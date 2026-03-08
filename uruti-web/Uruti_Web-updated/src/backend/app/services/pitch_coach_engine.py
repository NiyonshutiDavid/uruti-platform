from __future__ import annotations

import os
from typing import Any

from ..config import settings


class PitchCoachEngine:
    """Optional model-backed pitch feedback generator with fallback-safe mode."""

    def __init__(self) -> None:
        self._pipe: Any | None = None
        self._load_error: str | None = None
        self.model_id = settings.PITCH_COACH_MODEL_ID or os.getenv("PITCH_COACH_MODEL_ID", "")

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

    def _ensure_pipeline(self) -> None:
        if self._pipe is not None:
            return
        if self._load_error is not None:
            raise RuntimeError(self._load_error)
        if not self.model_id:
            self._load_error = "PITCH_COACH_MODEL_ID is not set"
            raise RuntimeError(self._load_error)

        try:
            from transformers import pipeline  # type: ignore

            token = self._hf_token()
            self._pipe = pipeline(
                "text-generation",
                model=self.model_id,
                token=token,
            )
        except Exception as exc:
            self._load_error = f"failed to load pitch coach model: {exc}"
            raise RuntimeError(self._load_error) from exc

    def _fallback(self) -> list[str]:
        return [
            "Start with a one-sentence problem that is specific and urgent.",
            "Quantify traction early: users, revenue, retention, or pilots.",
            "Tighten pacing around your value proposition and target market.",
            "End with a clear funding ask and milestone-based use of funds.",
        ]

    def generate_feedback(self, transcript_or_notes: str) -> list[str]:
        text = (transcript_or_notes or "").strip()
        if not text:
            return self._fallback()

        try:
            self._ensure_pipeline()
            if self._pipe is None:
                return self._fallback()

            prompt = (
                "You are a startup pitch coach. Provide 4 concise bullet tips to improve this pitch.\n\n"
                f"Pitch:\n{text}\n\nTips:\n"
            )
            outputs = self._pipe(prompt, max_new_tokens=120, do_sample=False)
            raw = ""
            if isinstance(outputs, list) and outputs:
                raw = str(outputs[0].get("generated_text") or "")

            lines = [
                ln.strip(" -•\t")
                for ln in raw.splitlines()
                if ln.strip() and ("tip" in ln.lower() or ln.strip().startswith(("-", "•", "1", "2", "3", "4")))
            ]
            if not lines:
                lines = [ln.strip(" -•\t") for ln in raw.splitlines() if ln.strip()]

            deduped: list[str] = []
            for line in lines:
                if line and line not in deduped:
                    deduped.append(line)
                if len(deduped) == 4:
                    break

            return deduped if deduped else self._fallback()
        except Exception:
            return self._fallback()


pitch_coach_engine = PitchCoachEngine()
