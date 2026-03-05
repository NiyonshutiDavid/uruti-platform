from __future__ import annotations

import csv
import gc
import hashlib
import io
import json
import os
import re
import tempfile
import warnings
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

os.environ["TOKENIZERS_PARALLELISM"] = "false"

warnings.filterwarnings(
    "ignore",
    message=r"`clean_up_tokenization_spaces` was not set.*",
    category=FutureWarning,
)

try:
    import torch
except Exception:
    torch = None


DISCLAIMER = "Advisory support only, not legal or financial advice. Validate critical decisions with qualified professionals."
PROMPT_TEMPLATE = """You are a senior startup advisor specialized in the Rwandan ecosystem.

Founder Context:
{founder_profile}

Retrieved Knowledge:
{retrieved_docs}

Founder Question:
{user_query}

Provide:
1. Root cause analysis
2. 3 strategic recommendations
3. Key risks
4. 30-day action plan
5. Funding considerations

Return STRICT JSON with keys:
- diagnosis
- strategic_recommendations (array)
- risks (array)
- 30_day_plan (array)
- funding_advice
"""


@dataclass
class ChunkRecord:
    text: str
    metadata: Dict[str, Any]


class RwandaRagAdvisor:
    def __init__(self) -> None:
        self.workspace_root = self._detect_workspace_root()
        self.vector_store_path = self.workspace_root / "uruti-web" / "Uruti_Web-updated" / "src" / "backend" / "data" / "rag_store"
        self.vector_store_path.mkdir(parents=True, exist_ok=True)

        self._chunks: List[ChunkRecord] = []
        self._embeddings: Optional[np.ndarray] = None
        self._faiss_index = None
        self._embedder = None
        self._embedding_backend = "uninitialized"

        self._tokenizer = None
        self._model = None
        self._default_model_id = os.getenv("URUTI_BEST_MODEL_ID", "microsoft/Phi-3.5-mini-instruct")
        self._model_id = self._default_model_id

        self._load_base_knowledge_once()

    def _detect_workspace_root(self) -> Path:
        current = Path(__file__).resolve()
        for parent in [current, *current.parents]:
            if (parent / "Notebooks").exists() and (parent / "uruti-web").exists():
                return parent
        return Path.cwd().resolve()

    def normalize_whitespace(self, text: str) -> str:
        return re.sub(r"\s+", " ", (text or "")).strip()

    def truncate_to_max_tokens(self, text: str, max_tokens: int = 512) -> str:
        words = (text or "").split()
        if len(words) <= max_tokens:
            return " ".join(words)
        return " ".join(words[:max_tokens])

    def _chunk_text(self, text: str, min_tokens: int = 300, max_tokens: int = 500) -> List[str]:
        cleaned = self.normalize_whitespace(text)
        words = cleaned.split()
        if not words:
            return []

        target = max(min_tokens, min(max_tokens, 400))
        chunks: List[str] = []
        start = 0
        while start < len(words):
            end = min(start + target, len(words))
            chunk_words = words[start:end]
            if len(chunk_words) < min_tokens and chunks:
                chunks[-1] = f"{chunks[-1]} {' '.join(chunk_words)}".strip()
            else:
                chunks.append(" ".join(chunk_words))
            start = end
        return chunks

    def _load_embedder(self):
        if self._embedder is None:
            try:
                from sentence_transformers import SentenceTransformer  # type: ignore

                self._embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
                self._embedding_backend = "sentence-transformers"
            except Exception:
                self._embedder = False
                self._embedding_backend = "hashing-fallback"
        return self._embedder

    def _embed_texts_fallback(self, texts: List[str], dim: int = 384) -> np.ndarray:
        if not texts:
            return np.zeros((0, dim), dtype=np.float32)

        vectors = np.zeros((len(texts), dim), dtype=np.float32)
        token_pattern = re.compile(r"[a-zA-Z0-9_]+")

        for row_idx, text in enumerate(texts):
            tokens = token_pattern.findall((text or "").lower())
            if not tokens:
                continue

            for token in tokens:
                digest = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
                value = int.from_bytes(digest, byteorder="big", signed=False)
                col_idx = value % dim
                sign = 1.0 if ((value >> 1) & 1) == 0 else -1.0
                vectors[row_idx, col_idx] += sign

            norm = float(np.linalg.norm(vectors[row_idx]))
            if norm > 0:
                vectors[row_idx] /= norm

        return vectors

    def _embed_texts(self, texts: List[str]) -> np.ndarray:
        embedder = self._load_embedder()
        if embedder is False:
            return self._embed_texts_fallback(texts)

        try:
            vectors = embedder.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
            return np.asarray(vectors, dtype=np.float32)
        except Exception:
            self._embedder = False
            self._embedding_backend = "hashing-fallback"
            return self._embed_texts_fallback(texts)

    def _refresh_index(self) -> None:
        if not self._chunks:
            self._embeddings = None
            self._faiss_index = None
            return

        texts = [c.text for c in self._chunks]
        self._embeddings = self._embed_texts(texts)

        try:
            import faiss  # type: ignore

            index = faiss.IndexFlatIP(self._embeddings.shape[1])
            index.add(self._embeddings)
            self._faiss_index = index
        except Exception:
            self._faiss_index = None

    def _add_chunks(self, chunks: List[str], metadata_base: Dict[str, Any]) -> None:
        for idx, chunk in enumerate(chunks):
            metadata = {
                **metadata_base,
                "chunk_index": idx,
            }
            self._chunks.append(ChunkRecord(text=chunk, metadata=metadata))
        self._refresh_index()

    def _load_csv_text(self, path: Path) -> str:
        rows: List[str] = []
        with path.open("r", encoding="utf-8", errors="ignore") as handle:
            reader = csv.reader(handle)
            for row in reader:
                rows.append(" | ".join(row))
        return "\n".join(rows)

    def _load_json_text(self, path: Path) -> str:
        raw = path.read_text(encoding="utf-8", errors="ignore")
        try:
            parsed = json.loads(raw)
            return json.dumps(parsed, ensure_ascii=False)
        except Exception:
            return raw

    def _load_base_knowledge_once(self) -> None:
        if self._chunks:
            return

        candidates = [
            self.workspace_root / "Notebooks" / "Domain-specific" / "data",
            self.workspace_root / "Notebooks" / "uruti-Chatbot" / "data",
        ]

        timestamp = datetime.now(timezone.utc).isoformat()
        for data_dir in candidates:
            if not data_dir.exists():
                continue
            for path in sorted(data_dir.glob("*")):
                if not path.is_file():
                    continue
                suffix = path.suffix.lower()
                try:
                    if suffix == ".csv":
                        text = self._load_csv_text(path)
                    elif suffix in {".json", ".jsonl"}:
                        text = self._load_json_text(path)
                    else:
                        continue
                except Exception:
                    continue

                chunks = self._chunk_text(text)
                if not chunks:
                    continue
                self._add_chunks(
                    chunks,
                    {
                        "source": str(path),
                        "upload_type": "knowledge_base",
                        "timestamp": timestamp,
                    },
                )

    def ingest_text(self, text: str, source: str, upload_type: str) -> int:
        chunks = self._chunk_text(text)
        if not chunks:
            return 0
        self._add_chunks(
            chunks,
            {
                "source": source,
                "upload_type": upload_type,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return len(chunks)

    def _extract_text_from_pdf(self, content: bytes) -> str:
        try:
            from pypdf import PdfReader  # type: ignore
        except Exception as exc:
            raise ValueError("PDF parsing requires pypdf") from exc

        reader = PdfReader(io.BytesIO(content))
        pages = [p.extract_text() or "" for p in reader.pages]
        return "\n".join(pages)

    def _extract_text_from_docx(self, content: bytes) -> str:
        try:
            import docx  # type: ignore
        except Exception as exc:
            raise ValueError("DOCX parsing requires python-docx") from exc

        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            tmp.write(content)
            tmp.flush()
            tmp_path = Path(tmp.name)

        try:
            document = docx.Document(str(tmp_path))
            text = "\n".join(paragraph.text for paragraph in document.paragraphs)
        finally:
            try:
                tmp_path.unlink(missing_ok=True)
            except Exception:
                pass
        return text

    def _extract_text_from_csv_bytes(self, content: bytes) -> str:
        decoded = content.decode("utf-8", errors="ignore")
        return decoded

    def ingest_file(self, filename: str, content: bytes) -> Dict[str, Any]:
        lower = filename.lower()
        if lower.endswith(".pdf"):
            text = self._extract_text_from_pdf(content)
            upload_type = "pdf"
        elif lower.endswith(".docx"):
            text = self._extract_text_from_docx(content)
            upload_type = "docx"
        elif lower.endswith(".csv"):
            text = self._extract_text_from_csv_bytes(content)
            upload_type = "csv"
        else:
            raise ValueError("Unsupported file type. Use PDF, DOCX, or CSV.")

        count = self.ingest_text(text, source=filename, upload_type=upload_type)
        return {
            "chunks_ingested": count,
            "upload_type": upload_type,
            "source": filename,
        }

    def transcribe_audio(self, filename: str, content: bytes) -> str:
        try:
            import whisper  # type: ignore
        except Exception as exc:
            raise ValueError("Audio transcription requires openai-whisper") from exc

        with tempfile.NamedTemporaryFile(suffix=Path(filename).suffix or ".wav", delete=False) as tmp:
            tmp.write(content)
            tmp.flush()
            tmp_path = Path(tmp.name)

        try:
            model = whisper.load_model("base")
            result = model.transcribe(str(tmp_path))
            text = result.get("text", "")
        finally:
            try:
                tmp_path.unlink(missing_ok=True)
            except Exception:
                pass

        return self.normalize_whitespace(text)

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if not self._chunks:
            return []

        q_vec = self._embed_texts([query])

        if self._faiss_index is not None:
            scores, idxs = self._faiss_index.search(q_vec, min(top_k, len(self._chunks)))
            indices = idxs[0].tolist()
            similarities = scores[0].tolist()
        else:
            emb = self._embeddings
            if emb is None:
                return []
            sims = np.dot(emb, q_vec[0])
            indices = np.argsort(-sims)[:top_k].tolist()
            similarities = [float(sims[i]) for i in indices]

        docs: List[Dict[str, Any]] = []
        for rank, (idx, score) in enumerate(zip(indices, similarities), start=1):
            if idx < 0 or idx >= len(self._chunks):
                continue
            chunk = self._chunks[idx]
            docs.append(
                {
                    "rank": rank,
                    "score": float(score),
                    "text": chunk.text,
                    "metadata": chunk.metadata,
                }
            )
        return docs

    def _build_prompt(self, founder_profile: str, retrieved_docs: List[Dict[str, Any]], user_query: str) -> str:
        docs_text = "\n\n".join(
            f"[{d['rank']}] ({d['metadata'].get('upload_type')}::{d['metadata'].get('source')}) {d['text']}"
            for d in retrieved_docs
        )
        return PROMPT_TEMPLATE.format(
            founder_profile=founder_profile or "N/A",
            retrieved_docs=docs_text or "No retrieved context.",
            user_query=user_query,
        )

    def _ensure_model_loaded(self) -> str:
        if self._model is not None and self._tokenizer is not None:
            return self._model_id

        if torch is None:
            raise ValueError("torch is required for production model inference")

        from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig  # type: ignore

        quant_config = None
        if torch.cuda.is_available():
            quant_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.float16,
            )

        self._tokenizer = AutoTokenizer.from_pretrained(self._model_id, token=os.getenv("HF_TOKEN"))
        self._model = AutoModelForCausalLM.from_pretrained(
            self._model_id,
            token=os.getenv("HF_TOKEN"),
            quantization_config=quant_config,
            device_map="auto" if torch.cuda.is_available() else None,
            low_cpu_mem_usage=True,
        )
        return self._model_id

    def _parse_structured_output(self, output_text: str) -> Dict[str, Any]:
        raw = output_text.strip()
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            snippet = raw[start : end + 1]
            try:
                parsed = json.loads(snippet)
                return {
                    "diagnosis": str(parsed.get("diagnosis", "")),
                    "strategic_recommendations": list(parsed.get("strategic_recommendations", []))[:3],
                    "risks": list(parsed.get("risks", []))[:5],
                    "30_day_plan": list(parsed.get("30_day_plan", []))[:6],
                    "funding_advice": str(parsed.get("funding_advice", "")),
                }
            except Exception:
                pass

        return {
            "diagnosis": raw[:500] if raw else "The startup challenge appears multi-factor and requires staged validation.",
            "strategic_recommendations": [
                "Validate assumptions with 10 customer interviews in Kigali and one secondary city.",
                "Prioritize a single measurable traction KPI for the next 30 days.",
                "Sequence operations and growth experiments to protect runway.",
            ],
            "risks": [
                "Market demand assumptions may be overestimated.",
                "Execution capacity may constrain delivery speed.",
            ],
            "30_day_plan": [
                "Week 1: clarify ICP and success metric.",
                "Week 2: run customer discovery and adjust hypothesis.",
                "Week 3: test one distribution channel.",
                "Week 4: review results and re-plan with mentor input.",
            ],
            "funding_advice": "Match funding ask to milestone-based evidence and maintain conservative runway assumptions.",
        }

    def _generate_with_model(self, prompt: str, max_new_tokens: int = 384) -> Tuple[str, int, float]:
        model_name = self._ensure_model_loaded()

        inputs = self._tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)
        if torch is not None and torch.cuda.is_available():
            inputs = {k: v.to("cuda") for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self._model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=False,
                temperature=0.0,
                eos_token_id=self._tokenizer.eos_token_id,
            )

        generated = outputs[0][inputs["input_ids"].shape[-1] :]
        text = self._tokenizer.decode(generated, skip_special_tokens=True)
        return model_name, int(generated.shape[-1]), float(torch.cuda.memory_allocated() / (1024 * 1024)) if (torch and torch.cuda.is_available()) else 0.0

    def _resolve_model_id(self, selected_model: Optional[str]) -> str:
        model_candidate = self.normalize_whitespace(selected_model or "")
        if not model_candidate or model_candidate in {"uruti-ai", "default"}:
            model_candidate = self._default_model_id

        if model_candidate != self._model_id:
            self._model_id = model_candidate
            self._tokenizer = None
            self._model = None
            self.clear_gpu()

        return self._model_id

    def advise(self, user_query: str, founder_profile: str, mode: str = "production", selected_model: Optional[str] = None) -> Dict[str, Any]:
        clean_query = self.truncate_to_max_tokens(self.normalize_whitespace(user_query), max_tokens=512)
        clean_profile = self.normalize_whitespace(founder_profile or "")

        retrieved = self.retrieve(clean_query, top_k=3)
        prompt = self._build_prompt(clean_profile, retrieved, clean_query)

        active_model = self._resolve_model_id(selected_model)
        model_name = active_model if mode == "production" else f"{active_model}-research"
        tokens_generated = 0
        memory_mb = 0.0

        try:
            if mode == "production":
                model_name, tokens_generated, memory_mb = self._generate_with_model(prompt)
                output_text = ""
                inputs = self._tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)
                if torch is not None and torch.cuda.is_available():
                    inputs = {k: v.to("cuda") for k, v in inputs.items()}
                with torch.no_grad():
                    outputs = self._model.generate(
                        **inputs,
                        max_new_tokens=384,
                        do_sample=False,
                        temperature=0.0,
                        eos_token_id=self._tokenizer.eos_token_id,
                    )
                generated = outputs[0][inputs["input_ids"].shape[-1] :]
                output_text = self._tokenizer.decode(generated, skip_special_tokens=True)
            else:
                output_text = (
                    "{\"diagnosis\":\"Key constraints include customer validation, distribution fit, and disciplined cash planning.\"," \
                    "\"strategic_recommendations\":[\"Test one Rwanda-focused ICP segment quickly.\",\"Pair product changes with measurable funnel metrics.\",\"Use mentor/investor checkpoints every two weeks.\"]," \
                    "\"risks\":[\"Demand uncertainty\",\"Channel concentration risk\"]," \
                    "\"30_day_plan\":[\"Week 1 discovery\",\"Week 2 pilot\",\"Week 3 iterate\",\"Week 4 scale decision\"]," \
                    "\"funding_advice\":\"Tie funding ask to milestone evidence and conservative burn assumptions.\"}"
                )
        except Exception:
            output_text = ""

        structured = self._parse_structured_output(output_text)
        structured["disclaimer"] = DISCLAIMER

        return {
            "model": model_name,
            "mode": mode,
            "advisory": structured,
            "retrieved_chunks": [
                {
                    "rank": d["rank"],
                    "score": d["score"],
                    "metadata": d["metadata"],
                }
                for d in retrieved
            ],
            "metadata": {
                "query_tokens_approx": len(clean_query.split()),
                "tokens_generated": tokens_generated,
                "gpu_memory_mb": round(memory_mb, 2),
                "retrieval_top_k": 3,
                "embedding_backend": self._embedding_backend,
            },
        }

    def clear_gpu(self) -> None:
        if torch is not None and torch.cuda.is_available():
            torch.cuda.empty_cache()
            gc.collect()


advisor_service = RwandaRagAdvisor()
