from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ..auth import get_current_user
from ..models import User
from ..schemas import ChatResponse, ChatTextRequest, FounderProfilePayload
from ..services.rag_advisor import advisor_service

router = APIRouter(prefix="/chat", tags=["chat"])


PROFILE_DIR = Path("uploads") / "founder_profiles"
PROFILE_DIR.mkdir(parents=True, exist_ok=True)


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
    profile = advisor_service.normalize_whitespace(founder_profile)
    path.write_text(json.dumps({"founder_profile": profile}, ensure_ascii=False), encoding="utf-8")
    return profile


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

    return advisor_service.advise(
        user_query=payload.user_query,
        founder_profile=founder_profile,
        mode=payload.mode,
    )


@router.post("/file", response_model=ChatResponse)
async def chat_file(
    user_query: str = Form(...),
    founder_profile: Optional[str] = Form(None),
    mode: str = Form("production"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        advisor_service.ingest_file(file.filename or "uploaded_file", content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    resolved_profile = founder_profile or _read_profile(current_user.id)
    if founder_profile:
        _write_profile(current_user.id, founder_profile)

    return advisor_service.advise(
        user_query=user_query,
        founder_profile=resolved_profile,
        mode=mode,
    )


@router.post("/audio", response_model=ChatResponse)
async def chat_audio(
    user_query: Optional[str] = Form(""),
    founder_profile: Optional[str] = Form(None),
    mode: str = Form("production"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded audio is empty")

    try:
        transcript = advisor_service.transcribe_audio(file.filename or "founder_audio.wav", content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    advisor_service.ingest_text(
        transcript,
        source=file.filename or "founder_audio.wav",
        upload_type="audio",
    )

    effective_query = (user_query or "").strip() or transcript
    resolved_profile = founder_profile or _read_profile(current_user.id)
    if founder_profile:
        _write_profile(current_user.id, founder_profile)

    return advisor_service.advise(
        user_query=effective_query,
        founder_profile=resolved_profile,
        mode=mode,
    )
