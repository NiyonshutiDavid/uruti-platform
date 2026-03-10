from __future__ import annotations

import asyncio
import json
from functools import lru_cache
from pathlib import Path
from typing import Optional
import urllib.request

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ..auth import get_current_user
from ..config import settings
from ..models import User
from ..schemas import ChatResponse, ChatTextRequest, FounderProfilePayload

router = APIRouter(prefix="/chat", tags=["chat"])


PROFILE_DIR = Path("uploads") / "founder_profiles"
PROFILE_DIR.mkdir(parents=True, exist_ok=True)
_GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


@lru_cache(maxsize=1)
def _advisor_service():
    # Import lazily so core backend can start quickly even when RAG indexes are large.
    from ..services.rag_advisor import advisor_service

    return advisor_service


def _profile_path(user_id: int) -> Path:
    return PROFILE_DIR / f"{user_id}.json"


def _read_profile(user_id: int) -> str:
    path = _profile_path(user_id)
    if not path.exists():
        return ""
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        return str(payload.get("founder_profile", ""))
    except Exception:
        return ""


def _write_profile(user_id: int, founder_profile: str) -> str:
    path = _profile_path(user_id)
    profile = _advisor_service().normalize_whitespace(founder_profile)
    path.write_text(json.dumps({"founder_profile": profile}, ensure_ascii=False), encoding="utf-8")
    return profile


def _rule_chat_fallback(user_query: str) -> dict:
    return {
        "model": "rule-fallback",
        "mode": "production",
        "advisory": {
            "diagnosis": "Your request is clear, but the primary advisory model is currently unavailable.",
            "strategic_recommendations": [
                "Define one measurable startup objective for the next 30 days.",
                "Validate your riskiest assumption with at least 10 customer interviews.",
                "Track one traction KPI weekly and iterate based on evidence.",
            ],
            "risks": [
                "Limited market validation may delay product-market fit.",
                "Unclear unit economics can weaken investor confidence.",
            ],
            "30_day_plan": [
                "Week 1: sharpen problem statement and ICP.",
                "Week 2: run interviews and test one channel.",
                "Week 3: adjust offer/pricing from feedback.",
                "Week 4: summarize evidence and decide next milestone.",
            ],
            "funding_advice": "Frame your funding ask around milestone-based proof and runway discipline.",
            "disclaimer": "Advisory content is AI-generated and should be validated with mentors and experts.",
        },
        "retrieved_chunks": [],
        "metadata": {
            "fallback_used": True,
            "fallback_backend": "rule",
            "query_tokens_approx": len((user_query or "").split()),
        },
    }


def _gemini_chat_fallback(user_query: str, founder_profile: str, mode: str) -> tuple[dict | None, str | None]:
    api_key = (settings.GEMINI_API_KEY or "").strip()
    if not api_key:
        return None, "GEMINI_API_KEY not configured"

    model = (settings.GEMINI_MODEL or "gemini-1.5-flash").strip() or "gemini-1.5-flash"
    prompt = (
        "You are an expert startup advisor focused on Rwanda and Sub-Saharan Africa. "
        "Return ONLY strict JSON with keys: diagnosis, strategic_recommendations, risks, 30_day_plan, funding_advice. "
        "Use concise and practical outputs.\n\n"
        f"Founder profile:\n{founder_profile or 'N/A'}\n\n"
        f"User query:\n{user_query}\n"
    )
    sdk_error: str | None = None
    try:
        from google import genai  # type: ignore

        client = genai.Client(api_key=api_key)
        sdk_response = client.models.generate_content(model=model, contents=prompt)
        raw_text = str(getattr(sdk_response, "text", "") or "").strip()
        if raw_text:
            pass
        else:
            sdk_error = "Gemini SDK returned an empty response"
    except Exception as exc:
        raw_text = ""
        sdk_error = f"Gemini SDK error: {exc}"

    if not raw_text:
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
        }
        url = f"{_GEMINI_API_BASE}/{model}:generateContent?key={api_key}"

        try:
            request = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(
                request,
                timeout=max(3.0, float(settings.GEMINI_TIMEOUT_SECONDS)),
            ) as response:
                raw = response.read().decode("utf-8", errors="ignore")
                body = json.loads(raw) if raw else {}

            candidates = body.get("candidates") if isinstance(body, dict) else []
            parts = []
            if isinstance(candidates, list) and candidates:
                content = candidates[0].get("content") if isinstance(candidates[0], dict) else {}
                parts = content.get("parts") if isinstance(content, dict) else []

            text_blocks: list[str] = []
            if isinstance(parts, list):
                for part in parts:
                    if isinstance(part, dict):
                        text = part.get("text")
                        if isinstance(text, str) and text.strip():
                            text_blocks.append(text.strip())

            raw_text = "\n".join(text_blocks).strip()
            if not raw_text:
                return None, sdk_error or "Gemini returned an empty response"
        except Exception as exc:
            if sdk_error:
                return None, f"{sdk_error}; REST fallback error: {exc}"
            return None, str(exc)

    try:
        parsed = json.loads(raw_text)
    except Exception:
            parsed = {
                "diagnosis": raw_text[:500],
                "strategic_recommendations": [
                    "Break this challenge into problem, channel, and unit-economics experiments.",
                ],
                "risks": ["Execution risk due to incomplete market evidence."],
                "30_day_plan": [
                    "Week 1: validate assumptions.",
                    "Week 2: test one acquisition channel.",
                    "Week 3: improve conversion and retention.",
                    "Week 4: prepare investor-ready metrics summary.",
                ],
                "funding_advice": "Anchor your ask to milestones and measurable traction.",
            }

    advisory = {
        "diagnosis": str(parsed.get("diagnosis", "")),
        "strategic_recommendations": list(parsed.get("strategic_recommendations", []))[:5],
        "risks": list(parsed.get("risks", []))[:5],
        "30_day_plan": list(parsed.get("30_day_plan", []))[:8],
        "funding_advice": str(parsed.get("funding_advice", "")),
        "disclaimer": "Advisory content is AI-generated and should be validated with mentors and experts.",
    }

    return {
        "model": f"{model}-fallback",
        "mode": mode,
        "advisory": advisory,
        "retrieved_chunks": [],
        "metadata": {
            "fallback_used": True,
            "fallback_backend": "gemini",
            "query_tokens_approx": len((user_query or "").split()),
        },
    }, None


async def _advise_with_fallback(*, user_query: str, founder_profile: str, mode: str, selected_model: Optional[str]) -> dict:
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(
                _advisor_service().advise,
                user_query,
                founder_profile,
                mode,
                selected_model,
            ),
            timeout=max(1.0, float(settings.URUTI_CHATBOT_LOCAL_TIMEOUT_SECONDS)),
        )
    except Exception:
        gemini_result, _ = await asyncio.to_thread(
            _gemini_chat_fallback,
            user_query,
            founder_profile,
            mode,
        )
        if gemini_result:
            return gemini_result
        return _rule_chat_fallback(user_query)


@router.post("/profile")
async def set_founder_profile(
    payload: FounderProfilePayload,
    current_user: User = Depends(get_current_user),
):
    profile = _write_profile(current_user.id, payload.founder_profile)
    return {"founder_profile": profile}


@router.get("/profile")
async def get_founder_profile(
    current_user: User = Depends(get_current_user),
):
    return {"founder_profile": _read_profile(current_user.id)}


@router.post("/text", response_model=ChatResponse)
async def chat_text(
    payload: ChatTextRequest,
    current_user: User = Depends(get_current_user),
):
    founder_profile = payload.founder_profile or _read_profile(current_user.id)
    if payload.founder_profile:
        _write_profile(current_user.id, payload.founder_profile)

    if not payload.user_query.strip():
        raise HTTPException(status_code=400, detail="user_query is required")

    return await _advise_with_fallback(
        user_query=payload.user_query,
        founder_profile=founder_profile,
        mode=payload.mode,
        selected_model=payload.model,
    )


@router.post("/file", response_model=ChatResponse)
async def chat_file(
    user_query: str = Form(...),
    founder_profile: Optional[str] = Form(None),
    mode: str = Form("production"),
    model: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        _advisor_service().ingest_file(file.filename or "uploaded_file", content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    resolved_profile = founder_profile or _read_profile(current_user.id)
    if founder_profile:
        _write_profile(current_user.id, founder_profile)

    return await _advise_with_fallback(
        user_query=user_query,
        founder_profile=resolved_profile,
        mode=mode,
        selected_model=model,
    )


@router.post("/audio", response_model=ChatResponse)
async def chat_audio(
    user_query: Optional[str] = Form(""),
    founder_profile: Optional[str] = Form(None),
    mode: str = Form("production"),
    model: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded audio is empty")

    try:
        transcript = _advisor_service().transcribe_audio(file.filename or "founder_audio.wav", content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    _advisor_service().ingest_text(
        transcript,
        source=file.filename or "founder_audio.wav",
        upload_type="audio",
    )

    effective_query = (user_query or "").strip() or transcript
    resolved_profile = founder_profile or _read_profile(current_user.id)
    if founder_profile:
        _write_profile(current_user.id, founder_profile)

    return await _advise_with_fallback(
        user_query=effective_query,
        founder_profile=resolved_profile,
        mode=mode,
        selected_model=model,
    )
