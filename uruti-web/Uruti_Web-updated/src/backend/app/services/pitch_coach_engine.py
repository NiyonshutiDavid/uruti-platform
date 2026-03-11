from __future__ import annotations

import importlib.util
import os
import sys
import time
from pathlib import Path
from typing import Any
import json
import urllib.request

from ..config import settings


class PitchCoachEngine:
    """Optional model-backed pitch feedback generator with fallback-safe mode."""

    def __init__(self) -> None:
        self._pipe: Any | None = None
        self._reward_model: Any | None = None
        self._rl_agent: Any | None = None
        self._load_error: str | None = None
        self._last_load_attempt: float | None = None
        self._retry_after_seconds = 20
        self._backend = "fallback"
        self._startup_init_started = False
        self._startup_init_completed = False
        self.model_id = settings.PITCH_COACH_MODEL_ID or os.getenv("PITCH_COACH_MODEL_ID", "")
        self.enable_local_rl = settings.PITCH_COACH_ENABLE_LOCAL_RL
        self.local_model_dir = settings.PITCH_COACH_LOCAL_MODEL_DIR or self._default_local_model_dir()
        self._action_map = {
            0: "Increase Energy (Speak louder and with more passion).",
            1: "Improve Eye Contact (Look directly at the camera).",
            2: "Reduce Fillers (Pause instead of using filler words).",
            3: "Slow Down (Your pacing is a bit too fast).",
            4: "Clarify Point (Align your spoken narrative with slide text).",
            5: "Use a Stronger Hook (Open with a memorable problem statement).",
        }

    def warmup(self) -> None:
        """Best-effort eager initialization for admin/runtime health surfaces."""
        self._startup_init_started = True
        try:
            self._ensure_pipeline()
        except Exception:
            # Keep fallback-safe behavior; detailed error is stored in _load_error.
            pass
        finally:
            self._startup_init_completed = True

    def _default_local_model_dir(self) -> str:
        here = Path(__file__).resolve()
        for parent in here.parents:
            candidate = parent / "Models" / "Uruti-pitch_coach" / "pitch_coach_complete (5)"
            if candidate.exists():
                return str(candidate)
        return ""

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

    def _local_inference_path(self) -> Path | None:
        if not self.local_model_dir:
            return None
        path = Path(self.local_model_dir) / "inference.py"
        return path if path.exists() else None

    def _compute_local_state(self, text: str, duration_seconds: int, target_seconds: int) -> list[float]:
        words = max(len([w for w in text.split() if w.strip()]), 1)
        actual_minutes = max(duration_seconds / 60.0, 1 / 60.0)
        wpm = min(words / actual_minutes, 220.0)
        ratio = min(max(duration_seconds / float(max(target_seconds, 1)), 0.0), 1.5)

        # 12-feature vector expected by local RL model.
        return [
            min(words / 220.0, 1.0),
            min(wpm / 200.0, 1.0),
            ratio,
            max(0.0, 1.0 - abs(1.0 - ratio)),
            0.65 if "market" in text.lower() else 0.45,
            0.70 if "revenue" in text.lower() or "traction" in text.lower() else 0.50,
            0.68 if "problem" in text.lower() else 0.50,
            0.72 if "ask" in text.lower() or "fund" in text.lower() else 0.48,
            0.66 if "team" in text.lower() else 0.52,
            1.0,  # slide_idx placeholder
            max(0.0, 1.0 - ratio),  # time remaining proxy
            min(ratio, 1.0),  # time on current slide proxy
        ]

    def _ensure_local_model(self) -> None:
        if self._rl_agent is not None:
            return

        # Some exported SB3 bundles reference numpy internals using the
        # newer "numpy._core" module path. Provide compatibility aliases so
        # deserialization works across numpy distributions.
        try:
            import numpy.core as _np_core  # type: ignore

            if "numpy._core" not in sys.modules:
                sys.modules["numpy._core"] = _np_core
            if "numpy._core.numeric" not in sys.modules and hasattr(_np_core, "numeric"):
                sys.modules["numpy._core.numeric"] = _np_core.numeric
        except Exception:
            # Let downstream loader raise a detailed error if numpy itself is unavailable.
            pass

        inference_path = self._local_inference_path()
        if inference_path is None:
            raise RuntimeError("local pitch model inference.py not found")

        spec = importlib.util.spec_from_file_location("uruti_pitch_local_inference", str(inference_path))
        if spec is None or spec.loader is None:
            raise RuntimeError("failed to load local pitch model module spec")

        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        load_models = getattr(module, "load_models", None)
        if not callable(load_models):
            raise RuntimeError("local pitch model module missing load_models()")

        reward_model, rl_agent = load_models()
        self._reward_model = reward_model
        self._rl_agent = rl_agent
        self._backend = "local-rl"

    def _ensure_pipeline(self) -> None:
        now = time.time()
        if self._pipe is not None or self._rl_agent is not None:
            return
        if (
            self._load_error is not None
            and self._last_load_attempt is not None
            and (now - self._last_load_attempt) < self._retry_after_seconds
        ):
            raise RuntimeError(self._load_error)
        self._load_error = None
        self._last_load_attempt = now

        # Prefer local pitch model assets when available.
        # If no HF model id is provided, automatically attempt local RL loading
        # even when the explicit env toggle is false.
        local_error: str | None = None
        should_try_local = self.enable_local_rl or (not self.model_id and self._local_inference_path() is not None)
        if should_try_local:
            try:
                self._ensure_local_model()
                return
            except Exception as exc:
                local_error = str(exc)
                # Continue to HF model fallback.
                pass
        else:
            local_error = "local RL loading disabled (set PITCH_COACH_ENABLE_LOCAL_RL=true to enable)"

        if not self.model_id:
            suffix = f": {local_error}" if local_error else ""
            self._load_error = f"PITCH_COACH_MODEL_ID is not set and local model is unavailable{suffix}"
            self._backend = "fallback"
            return

        try:
            from transformers import pipeline  # type: ignore

            token = self._hf_token()
            self._pipe = pipeline(
                "text-generation",
                model=self.model_id,
                token=token,
            )
            self._backend = "hf-transformers"
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

    def _gemini_feedback(self, text: str, pitch_type: str, duration_seconds: int, target_duration_seconds: int) -> list[str] | None:
        """Call Gemini to generate pitch coach feedback. Returns None on failure."""
        api_key = (settings.GEMINI_API_KEY or "").strip()
        if not api_key:
            return None
        model = (settings.GEMINI_MODEL or "gemini-1.5-flash").strip() or "gemini-1.5-flash"
        prompt = (
            "You are an expert startup pitch coach. "
            f"The founder delivered a {pitch_type or 'general'} pitch "
            f"(duration: {duration_seconds}s, target: {target_duration_seconds or duration_seconds}s).\n\n"
            "Pitch transcript/notes:\n"
            f"{text}\n\n"
            "Give exactly 4 concise, actionable coaching tips to improve this pitch. "
            "Format as a numbered list (1. 2. 3. 4.). "
            "Focus on clarity, structure, traction evidence, and investor readiness. "
            "Keep each tip under 25 words."
        )
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        try:
            from google import genai as _genai  # type: ignore
            client = _genai.Client(api_key=api_key)
            response = client.models.generate_content(model=model, contents=prompt)
            raw = str(getattr(response, "text", "") or "").strip()
            if raw:
                return self._parse_tip_lines(raw)
        except Exception:
            pass
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=max(3.0, float(settings.GEMINI_TIMEOUT_SECONDS))) as resp:
                body = json.loads(resp.read().decode("utf-8", errors="ignore"))
                candidates = body.get("candidates") or []
                if candidates:
                    parts = (candidates[0].get("content") or {}).get("parts") or []
                    raw = " ".join(p.get("text", "") for p in parts if isinstance(p, dict)).strip()
                    if raw:
                        return self._parse_tip_lines(raw)
        except Exception:
            pass
        return None

    def _parse_tip_lines(self, raw: str) -> list[str]:
        lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
        tips: list[str] = []
        for ln in lines:
            # Strip leading numbering/bullets (1. 2. • - *)
            cleaned = ln.lstrip("0123456789.-•* \t")
            if cleaned and len(cleaned) > 8:
                tips.append(cleaned)
            if len(tips) == 4:
                break
        return tips if tips else self._fallback()

    def generate_feedback(
        self,
        transcript_or_notes: str,
        *,
        duration_seconds: int = 0,
        target_duration_seconds: int = 0,
        pitch_type: str = "",
    ) -> list[str]:
        text = (transcript_or_notes or "").strip()
        if not text:
            return self._fallback()

        try:
            # Runtime requests should not repeatedly trigger heavy model loads.
            # Initialization is performed during backend startup warmup.
            if not self._startup_init_completed:
                return ["Pitch coach model is still initializing. Please try again shortly."]

            if self._rl_agent is not None:
                import numpy as np  # type: ignore

                duration = max(int(duration_seconds), 1)
                target = max(int(target_duration_seconds or duration), 1)
                state = self._compute_local_state(text, duration, target)
                action, _ = self._rl_agent.predict(np.array(state, dtype=np.float32), deterministic=True)
                action_tip = self._action_map.get(int(action), "Keep going with clear and concise delivery.")
                extra = self._fallback()
                merged = [action_tip, *extra]
                deduped: list[str] = []
                for line in merged:
                    if line not in deduped:
                        deduped.append(line)
                    if len(deduped) == 4:
                        break
                return deduped

            if self._pipe is None:
                # Try Gemini before giving up with hardcoded static tips.
                gemini_tips = self._gemini_feedback(text, pitch_type, duration_seconds, target_duration_seconds)
                if gemini_tips:
                    self._backend = "gemini"
                    return gemini_tips
                return self._fallback()

            prompt = (
                "You are a startup pitch coach. Provide 4 concise bullet tips to improve this pitch.\n\n"
                f"Pitch type: {pitch_type or 'General Pitch'}\n"
                f"Duration: {duration_seconds}s, Target: {target_duration_seconds}s\n"
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
            self._backend = "fallback"
            gemini_tips = self._gemini_feedback(text, pitch_type, duration_seconds, target_duration_seconds)
            return gemini_tips if gemini_tips else self._fallback()

    def status(self) -> dict[str, Any]:
        service_available = (
            self._pipe is not None
            or self._rl_agent is not None
            or self._backend in ("fallback", "gemini")
            or bool((settings.GEMINI_API_KEY or "").strip())
        )
        return {
            "backend": self._backend,
            "loaded": service_available,
            "load_error": self._load_error,
            "last_load_attempt": self._last_load_attempt,
            "retry_after_seconds": self._retry_after_seconds,
            "model_id": self.model_id,
            "enable_local_rl": self.enable_local_rl,
            "local_model_dir": self.local_model_dir,
            "local_model_available": self._local_inference_path() is not None,
            "startup_init_started": self._startup_init_started,
            "startup_init_completed": self._startup_init_completed,
        }


pitch_coach_engine = PitchCoachEngine()
