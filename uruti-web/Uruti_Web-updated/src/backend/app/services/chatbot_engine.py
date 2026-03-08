from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any

from ..config import settings


class ChatbotEngine:
    """Runtime chatbot engine with optional llama-cpp GGUF backend.

    This service intentionally fails soft: if model loading/inference fails,
    callers can fallback to rule-based responses.
    """

    def __init__(self) -> None:
        self._llm: Any | None = None
        self._load_error: str | None = None
        self._last_load_attempt: float | None = None
        self._retry_after_seconds = 20
        self._startup_init_started = False
        self._startup_init_completed = False

        self.repo_id = settings.URUTI_CHATBOT_REPO_ID
        self.filename = settings.URUTI_CHATBOT_GGUF_FILENAME
        self.local_path = settings.URUTI_CHATBOT_LOCAL_GGUF_PATH
        self.temperature = settings.URUTI_CHATBOT_TEMPERATURE
        self.max_tokens = settings.URUTI_CHATBOT_MAX_TOKENS
        self.ctx = settings.URUTI_CHATBOT_CTX

    def _resolve_workspace_root(self) -> Path:
        here = Path(__file__).resolve()
        for parent in here.parents:
            if (parent / "Models").exists():
                return parent
        return here.parents[-1]

    def _discover_local_model(self) -> str | None:
        if self.local_path and os.path.exists(self.local_path):
            return self.local_path

        workspace_root = self._resolve_workspace_root()
        candidates = [
            workspace_root / "Models" / "Uruti chatbot",
            workspace_root / "Models",
        ]

        for base in candidates:
            if not base.exists():
                continue
            preferred = base / self.filename
            if preferred.exists():
                return str(preferred)
            for gguf in base.rglob("*.gguf"):
                if gguf.is_file():
                    return str(gguf)
        return None

    def _hf_token(self) -> str | None:
        return (
            settings.HF_TOKEN
            or settings.HUGGINGFACE_TOKEN
            or settings.HUGGINGFACE_API_TOKEN
            or settings.HUGGINGFACEHUB_API_TOKEN
            or os.getenv("HF_TOKEN")
            or os.getenv("HUGGINGFACE_TOKEN")
            or os.getenv("HUGGINGFACE_API_TOKEN")
            or os.getenv("HUGGINGFACEHUB_API_TOKEN")
        )

    def _ensure_loaded(self) -> None:
        now = time.time()
        if self._llm is not None:
            return
        if (
            self._load_error is not None
            and self._last_load_attempt is not None
            and (now - self._last_load_attempt) < self._retry_after_seconds
        ):
            raise RuntimeError(self._load_error)
        self._load_error = None
        self._last_load_attempt = now

        try:
            from llama_cpp import Llama  # type: ignore
        except Exception as exc:
            self._load_error = f"llama-cpp not available: {exc}"
            raise RuntimeError(self._load_error) from exc

        try:
            resolved_local = self._discover_local_model()
            if resolved_local and os.path.exists(resolved_local):
                self.local_path = resolved_local
                self._llm = Llama(
                    model_path=resolved_local,
                    n_ctx=self.ctx,
                    verbose=False,
                )
                return

            token = self._hf_token()
            if token:
                self._llm = Llama.from_pretrained(
                    repo_id=self.repo_id,
                    filename=self.filename,
                    token=token,
                    n_ctx=self.ctx,
                    verbose=False,
                )
            else:
                self._llm = Llama.from_pretrained(
                    repo_id=self.repo_id,
                    filename=self.filename,
                    n_ctx=self.ctx,
                    verbose=False,
                )
        except Exception as exc:
            self._load_error = f"failed to load GGUF chatbot model: {exc}"
            raise RuntimeError(self._load_error) from exc

    def warmup(self) -> None:
        """Best-effort eager chatbot model load to reduce first-message latency."""
        self._startup_init_started = True
        try:
            self._ensure_loaded()
        except Exception:
            # Keep fallback-safe runtime behavior.
            pass
        finally:
            self._startup_init_completed = True

    def chat(self, system_prompt: str, messages: list[dict[str, str]]) -> str:
        # Runtime requests should not trigger heavy model loading repeatedly.
        # Initialization is done during AI backend startup warmup.
        if self._llm is None:
            if not self._startup_init_completed:
                raise RuntimeError("Chatbot model is still initializing")
            raise RuntimeError(self._load_error or "Chatbot model unavailable")
        if self._llm is None:
            raise RuntimeError("Chatbot model unavailable")

        payload = [{"role": "system", "content": system_prompt}, *messages]
        result = self._llm.create_chat_completion(
            messages=payload,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )

        choices = result.get("choices") if isinstance(result, dict) else None
        if not choices:
            return ""

        message = choices[0].get("message") if isinstance(choices[0], dict) else None
        content = message.get("content") if isinstance(message, dict) else ""
        return str(content or "")

    def status(self) -> dict[str, Any]:
        local_exists = bool(self.local_path and os.path.exists(self.local_path))
        return {
            "loaded": self._llm is not None,
            "load_error": self._load_error,
            "last_load_attempt": self._last_load_attempt,
            "retry_after_seconds": self._retry_after_seconds,
            "repo_id": self.repo_id,
            "filename": self.filename,
            "local_path": self.local_path,
            "local_path_exists": local_exists,
            "ctx": self.ctx,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "hf_token_configured": bool(self._hf_token()),
            "startup_init_started": self._startup_init_started,
            "startup_init_completed": self._startup_init_completed,
        }


chatbot_engine = ChatbotEngine()
