"""Uruti AI Modules router dedicated to chatbot conversations."""

from __future__ import annotations

import asyncio
import json
import time
import urllib.request
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..config import settings
from ..database import get_db
from ..models import AiChatMessage, AiChatSession, Bookmark, User, Venture
from ..schemas import (
    AiChatMessageResponse,
    AiChatRequest,
    AiChatResponse,
    AiChatSessionSummary,
    AiChatSessionTitleUpdate,
)
from ..services.chatbot_engine import chatbot_engine
from ..services.venture_context import build_venture_context

router = APIRouter(prefix="/ai", tags=["uruti-ai-modules"])

CHATBOT_MODEL_ID = "uruti-ai"
GEMINI_MODEL_ID = "gemini"
_CHATBOT_INFERENCE_SEMAPHORE = asyncio.Semaphore(1)
_CHATBOT_QUEUE_TIMEOUT_SECONDS = 2.0
_GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

_SYSTEM_PROMPT = (
    "You are the Uruti AI Advisor - an expert startup advisor specialised in "
    "early-stage companies in Rwanda and Sub-Saharan Africa. You help founders "
    "with ideation, market sizing, GTM strategy, pitch preparation, fundraising, "
    "and building investor-ready businesses. Be concrete, practical, and cite "
    "Rwanda / African context where relevant."
)


def _compact_history(messages: list[dict[str, str]]) -> list[dict[str, str]]:
    # Keep only recent turns and truncate message bodies to reduce inference time.
    max_messages = max(1, int(settings.URUTI_CHATBOT_HISTORY_MESSAGES))
    max_chars = max(300, int(settings.URUTI_CHATBOT_MAX_INPUT_CHARS))
    recent = messages[-max_messages:]
    return [
        {
            "role": str(item.get("role") or "user"),
            "content": str(item.get("content") or "")[:max_chars],
        }
        for item in recent
    ]


def _probe_health(base_url: str) -> dict:
    normalized = (base_url or "").rstrip("/")
    health_url = f"{normalized}/health" if normalized else ""
    start = time.perf_counter()

    if not health_url:
        return {
            "configured_url": base_url,
            "health_url": None,
            "reachable": False,
            "status_code": None,
            "latency_ms": None,
            "payload": None,
            "error": "service URL not configured",
        }

    try:
        request = urllib.request.Request(health_url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(
            request,
            timeout=settings.CHATBOT_HEALTH_PROBE_TIMEOUT_SECONDS,
        ) as response:
            body = response.read().decode("utf-8", errors="ignore")
            payload = json.loads(body) if body else None
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            return {
                "configured_url": base_url,
                "health_url": health_url,
                "reachable": True,
                "status_code": response.getcode(),
                "latency_ms": latency_ms,
                "payload": payload,
                "error": None,
            }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "configured_url": base_url,
            "health_url": health_url,
            "reachable": False,
            "status_code": None,
            "latency_ms": latency_ms,
            "payload": None,
            "error": str(exc),
        }


def _fallback_response(user_text: str, context: dict | None, history: list[dict]) -> str:
    lower = user_text.lower()
    name = context.get("name", "your startup") if context else "your startup"

    if any(w in lower for w in ["pitch", "investor", "deck", "fundraise", "funding"]):
        return (
            "Investor Pitch Framework (5-7 min)\n\n"
            "1. Hook\n2. Problem\n3. Solution\n4. Market\n5. Traction\n6. Model\n7. Team\n8. Ask\n\n"
            "Would you like slide-by-slide feedback?"
        )

    if context:
        return (
            f"I can help strengthen {name}. Tell me the exact challenge now: "
            "traction, GTM, pricing, fundraising, or team."
        )

    return (
        "I can help with startup refinement, market sizing, GTM, fundraising, "
        "revenue model design, and team strategy. What do you want to improve first?"
    )


def _build_gemini_prompt(user_text: str, context: dict | None, history: list[dict]) -> str:
    history_lines: list[str] = []
    for turn in history[-6:]:
        role = str(turn.get("role") or "user").strip().lower()
        content = str(turn.get("content") or "").strip()
        if not content:
            continue
        speaker = "User" if role == "user" else "Assistant"
        history_lines.append(f"{speaker}: {content}")

    context_text = ""
    if context:
        context_text = (
            "Startup context:\n"
            f"- Name: {context.get('name', '')}\n"
            f"- Stage: {context.get('stage', '')}\n"
            f"- Industry: {context.get('industry', '')}\n"
            f"- Problem: {context.get('problem_statement', '')}\n"
            f"- Solution: {context.get('solution', '')}\n"
            f"- Target market: {context.get('target_market', '')}\n"
            f"- Business model: {context.get('business_model', '')}\n"
        )

    history_text = "\n".join(history_lines)
    return (
        f"{_SYSTEM_PROMPT}\n\n"
        "Respond with concise, practical startup advice and clear next steps. "
        "Prioritize East African market realities when relevant.\n\n"
        f"{context_text}\n"
        f"Conversation so far:\n{history_text}\n\n"
        f"User: {user_text}\n"
    )


def _extract_gemini_text(payload: dict) -> str:
    candidates = payload.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        return ""
    first = candidates[0] if isinstance(candidates[0], dict) else {}
    content = first.get("content") if isinstance(first, dict) else {}
    parts = content.get("parts") if isinstance(content, dict) else None
    if not isinstance(parts, list):
        return ""
    chunks: list[str] = []
    for part in parts:
        if isinstance(part, dict):
            text = part.get("text")
            if isinstance(text, str) and text.strip():
                chunks.append(text.strip())
    return "\n".join(chunks).strip()


def _gemini_response(user_text: str, context: dict | None, history: list[dict]) -> tuple[str | None, str | None]:
    api_key = (settings.GEMINI_API_KEY or "").strip()
    if not api_key:
        return None, "GEMINI_API_KEY not configured"

    model = (settings.GEMINI_MODEL or "gemini-1.5-flash").strip() or "gemini-1.5-flash"
    prompt = _build_gemini_prompt(user_text, context, history)
    sdk_error: str | None = None
    try:
        from google import genai  # type: ignore

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(model=model, contents=prompt)
        text = str(getattr(response, "text", "") or "").strip()
        if text:
            return text, None
        sdk_error = "Gemini SDK returned an empty response"
    except Exception as exc:
        sdk_error = f"Gemini SDK error: {exc}"

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
            text = _extract_gemini_text(body)
            if text:
                return text, None
            return None, sdk_error or "Gemini returned an empty response"
    except Exception as exc:
        if sdk_error:
            return None, f"{sdk_error}; REST fallback error: {exc}"
        return None, str(exc)


@router.get("/models")
async def get_chatbot_models(
    current_user: User = Depends(get_current_user),
):
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role not in {"founder", "investor", "admin"}:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    chatbot_status = chatbot_engine.status()
    gemini_available = bool((settings.GEMINI_API_KEY or "").strip())
    chatbot_available = bool(chatbot_status.get("loaded"))
    chatbot_initializing = bool(chatbot_status.get("startup_init_started")) and not bool(chatbot_status.get("startup_init_completed"))

    return [
        {
            "id": GEMINI_MODEL_ID,
            "name": "Gemini",
            "description": "Fast cloud chatbot responses via Google Gemini",
            "type": "chatbot",
            "requires_venture_context": False,
            "fixed_prompt": None,
            "is_default": True,
            "available": gemini_available,
            "status": "online" if gemini_available else "offline",
            "offline_reason": None if gemini_available else "GEMINI_API_KEY is not configured",
        },
        {
            "id": CHATBOT_MODEL_ID,
            "name": "Uruti AI Modules - Chatbot",
            "description": "General startup guidance and advisory conversations",
            "type": "chatbot",
            "requires_venture_context": False,
            "fixed_prompt": None,
            "is_default": False,
            "available": chatbot_available,
            "status": "initializing" if chatbot_initializing else ("online" if chatbot_available else "offline"),
            "offline_reason": chatbot_status.get("load_error"),
        },
    ]


@router.post("/chat", response_model=AiChatResponse)
async def chat(
    payload: AiChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session_id = payload.session_id or str(uuid.uuid4())
    available_models = await get_chatbot_models(current_user)
    available_ids = {m["id"] for m in available_models}
    model_map = {m["id"]: m for m in available_models}
    model = payload.model if payload.model in available_ids else GEMINI_MODEL_ID

    selected_model = model_map.get(model, {})
    if selected_model and not selected_model.get("available", True):
        status = selected_model.get("status") or "offline"
        reason = selected_model.get("offline_reason") or "Model unavailable"
        raise HTTPException(status_code=503, detail=f"Selected model is {status}: {reason}")

    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

    authorized_venture = None
    if payload.startup_context and payload.startup_context.venture_id is not None:
        venture_id = payload.startup_context.venture_id
        venture = db.query(Venture).filter(Venture.id == venture_id).first()
        if not venture:
            raise HTTPException(status_code=404, detail="Venture not found")

        if user_role == "founder":
            if venture.founder_id != current_user.id:
                raise HTTPException(status_code=403, detail="Founders can only attach their own ventures")
        elif user_role == "investor":
            bookmark = db.query(Bookmark).filter(
                Bookmark.user_id == current_user.id,
                Bookmark.venture_id == venture.id,
            ).first()
            if not bookmark:
                raise HTTPException(status_code=403, detail="Investors can only attach bookmarked ventures")
        else:
            raise HTTPException(status_code=403, detail="Startup context is only available for founders and investors")

        authorized_venture = venture

    ctx = payload.startup_context.model_dump(exclude_none=True) if payload.startup_context else None
    if authorized_venture:
        ctx = build_venture_context(authorized_venture)

    ctx_text = ""
    if ctx:
        ctx_text = (
            f"\n\n[Startup Context: {ctx.get('name','')} | "
            f"Stage: {ctx.get('stage','')} | "
            f"Industry: {ctx.get('industry','')} | "
            f"Problem: {ctx.get('problem_statement','')} | "
            f"Solution: {ctx.get('solution','')} | "
            f"Target Market: {ctx.get('target_market','')} | "
            f"Business Model: {ctx.get('business_model','')} | "
            f"Traction: customers={ctx.get('customers','n/a')}, mrr={ctx.get('mrr','n/a')}, revenue={ctx.get('revenue','n/a')} | "
            f"Funding: goal={ctx.get('funding_goal','n/a')}, raised={ctx.get('funding_raised','n/a')} | "
            f"Edge: {ctx.get('competitive_edge','')}]"
        )

    user_content = payload.message
    if payload.file_content:
        file_excerpt = payload.file_content[: settings.URUTI_CHATBOT_MAX_INPUT_CHARS]
        user_content += f"\n\n[Attached file - {payload.file_name or 'file'}]:\n{file_excerpt}"
    user_content = user_content[: settings.URUTI_CHATBOT_MAX_INPUT_CHARS]

    prev = (
        db.query(AiChatMessage)
        .filter(
            AiChatMessage.user_id == current_user.id,
            AiChatMessage.session_id == session_id,
        )
        .order_by(AiChatMessage.created_at)
        .all()
    )
    history = _compact_history([{"role": m.role, "content": m.content} for m in prev])

    meta = (
        db.query(AiChatSession)
        .filter(
            AiChatSession.user_id == current_user.id,
            AiChatSession.session_id == session_id,
        )
        .first()
    )
    if meta is None:
        meta = AiChatSession(
            user_id=current_user.id,
            session_id=session_id,
            title=((payload.message or "New Chat").strip()[:120] or "New Chat"),
        )
        db.add(meta)

    user_msg = AiChatMessage(
        user_id=current_user.id,
        session_id=session_id,
        role="user",
        content=user_content,
        model_used=model,
        startup_context=ctx,
        has_attachment=bool(payload.file_content),
        attachment_name=payload.file_name,
    )
    db.add(user_msg)
    db.flush()

    fallback_used = False
    inference_backend = "unknown"
    inference_error = None

    if model == GEMINI_MODEL_ID:
        ai_text, gemini_error = await asyncio.to_thread(
            _gemini_response,
            payload.message,
            ctx,
            history + [{"role": "user", "content": user_content}],
        )
        if ai_text:
            inference_backend = "gemini"
        else:
            ai_text = _fallback_response(payload.message, ctx, history)
            fallback_used = True
            inference_backend = "rule-fallback"
            inference_error = gemini_error
    else:
        acquired = False
        try:
            await asyncio.wait_for(
                _CHATBOT_INFERENCE_SEMAPHORE.acquire(),
                timeout=_CHATBOT_QUEUE_TIMEOUT_SECONDS,
            )
            acquired = True
            ai_text = await asyncio.wait_for(
                asyncio.to_thread(
                    chatbot_engine.chat,
                    _SYSTEM_PROMPT + ctx_text,
                    history + [{"role": "user", "content": user_content}],
                ),
                timeout=settings.URUTI_CHATBOT_LOCAL_TIMEOUT_SECONDS,
            )
            inference_backend = "llama-cpp"
        except asyncio.TimeoutError as exc:
            gemini_text, gemini_error = await asyncio.to_thread(
                _gemini_response,
                payload.message,
                ctx,
                history + [{"role": "user", "content": user_content}],
            )
            if gemini_text:
                ai_text = gemini_text
                fallback_used = True
                inference_backend = "gemini-fallback"
                inference_error = None
            else:
                ai_text = _fallback_response(payload.message, ctx, history)
                fallback_used = True
                inference_backend = "rule-fallback"
                if not acquired:
                    inference_error = gemini_error or (
                        f"chatbot busy: queued more than {_CHATBOT_QUEUE_TIMEOUT_SECONDS}s"
                    )
                else:
                    inference_error = gemini_error or (
                        f"chatbot timeout after {settings.URUTI_CHATBOT_LOCAL_TIMEOUT_SECONDS}s"
                    )
        except Exception as exc:
            gemini_text, gemini_error = await asyncio.to_thread(
                _gemini_response,
                payload.message,
                ctx,
                history + [{"role": "user", "content": user_content}],
            )
            if gemini_text:
                ai_text = gemini_text
                fallback_used = True
                inference_backend = "gemini-fallback"
                inference_error = None
            else:
                ai_text = _fallback_response(payload.message, ctx, history)
                fallback_used = True
                inference_backend = "rule-fallback"
                inference_error = gemini_error or str(exc)
        finally:
            if acquired:
                _CHATBOT_INFERENCE_SEMAPHORE.release()

    if not ai_text:
        ai_text = "I'm sorry, I couldn't generate a response. Please try again."

    ai_msg = AiChatMessage(
        user_id=current_user.id,
        session_id=session_id,
        role="assistant",
        content=ai_text,
        model_used=model,
        startup_context=ctx,
    )
    db.add(ai_msg)
    db.commit()

    return AiChatResponse(
        message=ai_text,
        session_id=session_id,
        model=model,
        fallback_used=fallback_used,
        inference_backend=inference_backend,
        inference_error=inference_error,
    )


@router.get("/history", response_model=List[AiChatSessionSummary])
async def get_history_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session_meta_rows = (
        db.query(AiChatSession)
        .filter(AiChatSession.user_id == current_user.id)
        .order_by(AiChatSession.created_at.desc())
        .limit(200)
        .all()
    )
    if not session_meta_rows:
        return []

    session_ids = [row.session_id for row in session_meta_rows]

    count_rows = (
        db.query(AiChatMessage.session_id, AiChatMessage.model_used)
        .filter(
            AiChatMessage.user_id == current_user.id,
            AiChatMessage.session_id.in_(session_ids),
            AiChatMessage.role == "user",
        )
        .order_by(AiChatMessage.created_at.asc())
        .all()
    )

    message_counts: dict[str, int] = {}
    model_used_map: dict[str, str | None] = {}
    for session_id, model_used in count_rows:
        message_counts[session_id] = message_counts.get(session_id, 0) + 1
        if session_id not in model_used_map:
            model_used_map[session_id] = model_used

    summaries: list[AiChatSessionSummary] = []
    for row in session_meta_rows:
        title = (row.title or "").strip() or "New Chat"
        summaries.append(
            AiChatSessionSummary(
                session_id=row.session_id,
                first_message=title,
                message_count=message_counts.get(row.session_id, 0),
                created_at=row.created_at,
                model_used=model_used_map.get(row.session_id),
            )
        )

    return summaries


@router.get("/history/{session_id}", response_model=List[AiChatMessageResponse])
async def get_session_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msgs = (
        db.query(AiChatMessage)
        .filter(
            AiChatMessage.user_id == current_user.id,
            AiChatMessage.session_id == session_id,
        )
        .order_by(AiChatMessage.created_at)
        .all()
    )
    if not msgs:
        raise HTTPException(status_code=404, detail="Session not found")
    return msgs


@router.delete("/history/{session_id}", status_code=204)
async def clear_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(AiChatMessage).filter(
        AiChatMessage.user_id == current_user.id,
        AiChatMessage.session_id == session_id,
    ).delete()
    db.query(AiChatSession).filter(
        AiChatSession.user_id == current_user.id,
        AiChatSession.session_id == session_id,
    ).delete()
    db.commit()


@router.put("/history/{session_id}/title")
async def rename_session(
    session_id: str,
    payload: AiChatSessionTitleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_title = (payload.title or "").strip()
    if not new_title:
        raise HTTPException(status_code=400, detail="Title cannot be empty")

    meta = (
        db.query(AiChatSession)
        .filter(
            AiChatSession.user_id == current_user.id,
            AiChatSession.session_id == session_id,
        )
        .first()
    )

    if meta is None:
        exists = (
            db.query(AiChatMessage.id)
            .filter(
                AiChatMessage.user_id == current_user.id,
                AiChatMessage.session_id == session_id,
            )
            .first()
        )
        if not exists:
            raise HTTPException(status_code=404, detail="Session not found")

        meta = AiChatSession(
            user_id=current_user.id,
            session_id=session_id,
            title=new_title[:120],
        )
        db.add(meta)
    else:
        meta.title = new_title[:120]

    db.commit()
    return {"session_id": session_id, "title": meta.title}


@router.get("/admin/runtime-status")
async def get_chatbot_runtime_status(
    current_user: User = Depends(get_current_user),
):
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    core_service = _probe_health(settings.CORE_SERVICE_URL)
    chatbot_service = _probe_health(settings.CHATBOT_SERVICE_URL)

    return {
        "chatbot_model_id": CHATBOT_MODEL_ID,
        "chatbot_engine": chatbot_engine.status(),
        "service": "uruti-ai-modules",
        "core_service": {
            "service": "core-backend",
            "status": "healthy" if core_service.get("reachable") else "unhealthy",
            "responsibility": "ventures and pitch recordings",
            **core_service,
        },
        "chatbot_service": chatbot_service,
    }
