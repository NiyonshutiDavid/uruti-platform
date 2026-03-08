from __future__ import annotations

import os
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

        self.repo_id = settings.URUTI_CHATBOT_REPO_ID
        self.filename = settings.URUTI_CHATBOT_GGUF_FILENAME
        self.local_path = settings.URUTI_CHATBOT_LOCAL_GGUF_PATH
        self.temperature = settings.URUTI_CHATBOT_TEMPERATURE
        self.max_tokens = settings.URUTI_CHATBOT_MAX_TOKENS
        self.ctx = settings.URUTI_CHATBOT_CTX

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
        if self._llm is not None:
            return
        if self._load_error is not None:
            raise RuntimeError(self._load_error)

        try:
            from llama_cpp import Llama  # type: ignore
        except Exception as exc:
            self._load_error = f"llama-cpp not available: {exc}"
            raise RuntimeError(self._load_error) from exc

        try:
            if self.local_path and os.path.exists(self.local_path):
                self._llm = Llama(
                    model_path=self.local_path,
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

    def chat(self, system_prompt: str, messages: list[dict[str, str]]) -> str:
        self._ensure_loaded()
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


chatbot_engine = ChatbotEngine()
