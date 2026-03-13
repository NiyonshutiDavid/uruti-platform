"""AI Chat router — handles conversation with Uruti's AI advisor."""
import asyncio
import json
import time
import urllib.request
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from typing import List
import uuid

from ..database import get_db
from ..models import AiChatMessage, User, Venture, Bookmark
from ..schemas import (
    AiChatRequest, AiChatResponse,
    AiChatMessageResponse, AiChatSessionSummary,
)
from ..auth import get_current_user
from ..config import settings
from ..services.venture_scorer import venture_scorer
from ..services.pitch_coach_engine import pitch_coach_engine
from ..services.venture_context import build_venture_context

router = APIRouter(prefix="/ai", tags=["ai"])

# ─── Available models ────────────────────────────────────────────────────────
ANALYSIS_MODEL_ID = "venture-mlop"
GEMINI_MODEL_ID = "gemini"
PITCH_MODEL_ID = "pitch-coach-ai"
_GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


def _probe_chatbot_service(base_url: str) -> dict:
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
            "error": "CHATBOT_SERVICE_URL is not configured",
        }

    try:
        request = urllib.request.Request(health_url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(
            request,
            timeout=settings.CHATBOT_HEALTH_PROBE_TIMEOUT_SECONDS,
        ) as response:
            raw = response.read().decode("utf-8", errors="ignore")
            payload = json.loads(raw) if raw else None
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


def _available_models() -> list[dict]:
    try:
        model_info = venture_scorer.get_model_info()
        analysis_name = str(model_info.get("model_folder") or model_info.get("model_name") or "Uruti-Investor_Intelligence_and_Ranker")
    except Exception:
        analysis_name = "Uruti-Investor_Intelligence_and_Ranker"

    models = [
        {
            "id": GEMINI_MODEL_ID,
            "name": "Gemini",
            "description": "Fast cloud chatbot responses via Google Gemini",
            "type": "chatbot",
            "requires_venture_context": False,
            "fixed_prompt": None,
            "is_default": True,
        },
        {
            "id": ANALYSIS_MODEL_ID,
            "name": analysis_name,
            "description": "Analyze ventures with required venture context (founders: own ventures, investors: bookmarked ventures)",
            "type": "analysis",
            "requires_venture_context": True,
            "fixed_prompt": "analyse my venture",
            "is_default": False,
        },
        {
            "id": PITCH_MODEL_ID,
            "name": "Pitch Coach",
            "description": "Get AI-powered pitch coaching feedback on your startup pitch",
            "type": "coach",
            "requires_venture_context": False,
            "fixed_prompt": None,
            "is_default": False,
        },
    ]
    return models


# ─── Uruti fallback AI ────────────────────────────────────────────────────────
_SYSTEM_PROMPT = (
    "You are the Uruti AI Advisor — an expert startup advisor specialised in "
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

def _fallback_response(user_text: str, context: dict | None, history: list[dict]) -> str:
    """Rule-based fallback when primary chatbot runtime is unavailable."""
    lower = user_text.lower()
    name = context.get("name", "your startup") if context else "your startup"

    if any(w in lower for w in ["refine", "improve", "better my idea", "strengthen"]):
        return (
            f"**Refining {name}** — key areas to sharpen:\n\n"
            "**1. Value Proposition** — articulate the unique problem you solve and why "
            "your solution is 10× better than alternatives.\n\n"
            "**2. Target Segment** — narrow your ICP (Ideal Customer Profile) to a "
            "beachhead market you can dominate first.\n\n"
            "**3. Business Model** — confirm unit economics: CAC vs LTV, pricing "
            "strategy, and payback period.\n\n"
            "**4. Milestones** — set 3–6-month measurable KPIs (customers, revenue, "
            "product completeness).\n\nWhich area would you like to dig into?"
        )

    if any(w in lower for w in ["market", "tam", "competition", "competitor"]):
        return (
            f"**Market Analysis for {name}**\n\n"
            "**Rwanda & EAC Context:**\n"
            "• ~14 M population, 65 %+ internet penetration, mobile-first economy\n"
            "• Government actively supports tech through RISA, Kigali Innovation City\n"
            "• EAC trade bloc gives access to ~300 M consumers\n\n"
            "**Framework (TAM → SAM → SOM):**\n"
            "1. **TAM** — total global/regional addressable market\n"
            "2. **SAM** — segment you can reach with your GTM\n"
            "3. **SOM** — realistic 3-year capture (typically 1–5 % of SAM for early stage)\n\n"
            "**Competitive moat checklist:** price, speed, network effects, switching "
            "costs, brand, data.\n\nWant me to help size your specific market?"
        )

    if any(w in lower for w in ["go-to-market", "gtm", "launch", "customer acquisition"]):
        return (
            "**Go-to-Market Playbook**\n\n"
            "**Phase 1 – Identify & Sign 10 Referenceable Customers (Month 1-2)**\n"
            "• Do 20+ problem interviews before building\n"
            "• Offer free/discounted pilot in exchange for testimonials\n\n"
            "**Phase 2 – Prove Retention (Month 3-4)**\n"
            "• Track weekly/monthly active usage\n"
            "• NPS > 40 before scaling spend\n\n"
            "**Phase 3 – Scale Channels (Month 5+)**\n"
            "• Rwanda: WhatsApp communities, church/sacco networks, tech events\n"
            "• B2B: direct sales + partnerships with SACCOs, MFIs, corporates\n\n"
            "Which phase are you in right now? I can go deeper on any of them."
        )

    if any(w in lower for w in ["pitch", "investor", "deck", "fundraise", "funding"]):
        return (
            "**Investor Pitch Framework (5–7 min)**\n\n"
            "1. **Hook** — one sentence problem that hits home\n"
            "2. **Problem** — proof it's real and painful (data + story)\n"
            "3. **Solution** — your unique approach, live demo if possible\n"
            "4. **Market** — TAM/SAM/SOM with credible sources\n"
            "5. **Traction** — key metrics (GMV, MRR, users, retention)\n"
            "6. **Business Model** — how you make money, unit economics\n"
            "7. **Team** — why you, why now\n"
            "8. **Ask** — amount, use of funds, key milestones\n\n"
            "**Rwandan VC landscape:** Norrsken Kigali, VC4A, Seedstars, GSMA "
            "Ecosystem Accelerator, BPN Rwanda.\n\n"
            "Would you like feedback on a specific slide or your full narrative?"
        )

    if any(w in lower for w in ["revenue", "pricing", "monetise", "monetize", "business model"]):
        return (
            "**Revenue Model Design**\n\n"
            "| Model | Best For | Rwanda Fit |\n"
            "|-------|----------|------------|\n"
            "| SaaS subscription | B2B software | ✅ Growing SME base |\n"
            "| Transaction % | Marketplaces, fintech | ✅ Mobile money native |\n"
            "| Freemium | Consumer apps | ⚠ Low ARPU, needs scale |\n"
            "| Usage-based | APIs, infra | ✅ Predictable costs |\n"
            "| Commission | Aggregators | ✅ Trust-based networks |\n\n"
            "**Key Rwanda considerations:** mobile money (MTN MoMo, Airtel Money) "
            "integration is essential; offer weekly/monthly billing to match income cycles.\n\n"
            "What does your current pricing model look like?"
        )

    if any(w in lower for w in ["team", "hire", "cofounder", "co-founder"]):
        return (
            "**Team Building for Early-Stage Startups**\n\n"
            "**The founding trio:** Hacker (builder) + Hustler (sales/ops) + "
            "Designer (UX/brand). Cover all three, even as one person wears multiple hats.\n\n"
            "**Hiring sequence:**\n"
            "1. First hire: plug your biggest personal skill gap\n"
            "2. Equity > salary until revenue is stable (4-year vest, 1-year cliff)\n"
            "3. Rwanda talent pools: RDB talent portal, ALU alumni, CMU Africa, "
            "University of Rwanda INES\n\n"
            "**Red flags to avoid:** hiring friends before skill-testing, "
            "giving equity without vesting, skipping written agreements.\n\n"
            "What role are you looking to fill?"
        )

    # Context-aware generic response
    if context:
        return (
            f"I'm here to help **{name}** succeed! Here's what I can help with:\n\n"
            "• 🔍 **Refinement** — sharpen your value prop and business model\n"
            "• 📊 **Market sizing** — TAM/SAM/SOM and competitive analysis\n"
            "• 🚀 **Go-to-market** — customer acquisition and channel strategy\n"
            "• 💰 **Funding** — pitch prep, investor targeting, term sheet basics\n"
            "• 👥 **Team** — hiring, equity, advisors\n\n"
            f"What's the biggest challenge **{name}** faces right now?"
        )

    return (
        "I'm your **Uruti AI Advisor** — here to help you build a fundable, "
        "scalable startup. I can help with:\n\n"
        "• 💡 Refining your startup idea\n"
        "• 📈 Market analysis and sizing\n"
        "• 🎯 Go-to-market strategy\n"
        "• 🤝 Investor pitch preparation\n"
        "• 💵 Revenue model design\n"
        "• 👥 Team building\n\n"
        "What would you like to work on today?"
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


def _gemini_fallback_response(user_text: str, context: dict | None, history: list[dict]) -> tuple[str | None, str | None]:
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


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=AiChatResponse)
async def chat(
    payload: AiChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message to the AI Advisor. Persists history."""
    session_id = payload.session_id or str(uuid.uuid4())
    available_ids = {m["id"] for m in _available_models()}
    model = payload.model if payload.model in available_ids else GEMINI_MODEL_ID

    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

    authorized_venture = None
    if payload.startup_context and payload.startup_context.venture_id is not None:
        venture_id = payload.startup_context.venture_id
        venture = db.query(Venture).filter(Venture.id == venture_id).first()
        if not venture:
            raise HTTPException(status_code=404, detail="Venture not found")

        if user_role == "founder":
            if venture.founder_id != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="Founders can only attach their own ventures",
                )
        elif user_role == "investor":
            bookmark = db.query(Bookmark).filter(
                Bookmark.user_id == current_user.id,
                Bookmark.venture_id == venture.id,
            ).first()
            if not bookmark:
                raise HTTPException(
                    status_code=403,
                    detail="Investors can only attach ventures in their bookmarks",
                )
        else:
            raise HTTPException(
                status_code=403,
                detail="Startup context attachment is only available for founders and investors",
            )

        authorized_venture = venture

    # Build context string to inject
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

    # Build user message (include file content if present)
    user_content = payload.message
    if payload.file_content:
        file_excerpt = payload.file_content[: settings.URUTI_CHATBOT_MAX_INPUT_CHARS]
        user_content += f"\n\n[Attached file — {payload.file_name or 'file'}]:\n{file_excerpt}"
    user_content = user_content[: settings.URUTI_CHATBOT_MAX_INPUT_CHARS]

    # Retrieve previous messages in this session for context
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

    # Save user message
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

    # Generate AI response
    ai_text = ""
    resolved_model = model
    fallback_used = False
    inference_backend = "unknown"
    inference_error = None

    if model == ANALYSIS_MODEL_ID:
        if user_role not in {"founder", "investor"}:
            raise HTTPException(
                status_code=403,
                detail="Analysis model is only available for founders and investors",
            )

        normalized = (payload.message or "").strip().lower()
        if normalized not in {"analyse my venture", "analyze my venture"}:
            raise HTTPException(status_code=400, detail="Analysis model only accepts the prompt: analyse my venture")

        venture_id = payload.startup_context.venture_id if payload.startup_context else None
        if not venture_id:
            raise HTTPException(status_code=400, detail="Analysis model requires venture context with venture_id")

        venture = authorized_venture or db.query(Venture).filter(Venture.id == venture_id).first()
        if not venture:
            raise HTTPException(status_code=404, detail="Venture not found")

        analysis = venture_scorer.score_venture(venture)
        score = float(analysis.get("uruti_score") or 0.0)
        predicted_class = str(analysis.get("predicted_class") or "unknown")

        ai_text = (
            f"Venture Analysis — {venture.name}\n\n"
            f"Uruti Score: {round(score, 2)}/100\n"
            f"Readiness Class: {predicted_class}\n"
            f"Summary: This score is generated by the {analysis.get('model_name', 'Uruti-Investor_Intelligence_and_Ranker')} ranking model."
        )
        resolved_model = ANALYSIS_MODEL_ID
        inference_backend = "venture-ranker"
    elif model == PITCH_MODEL_ID:
        tips = pitch_coach_engine.generate_feedback(payload.message)
        pitch_status = pitch_coach_engine.status()
        ai_text = "Pitch Coach Feedback\n\n" + "\n".join([f"- {tip}" for tip in tips])
        resolved_model = PITCH_MODEL_ID
        inference_backend = str(pitch_status.get("backend") or "pitch-coach")
        fallback_used = not bool(pitch_status.get("loaded"))
        if pitch_status.get("load_error"):
            inference_error = str(pitch_status.get("load_error"))
    elif model == GEMINI_MODEL_ID:
        # Pass user_content (includes any appended file excerpt) rather than the
        # bare payload.message.  Also pass only the *previous* turns in history —
        # _build_gemini_prompt already appends "User: {user_text}" at the end, so
        # including the current message in history would duplicate it in the prompt.
        ai_text, gemini_error = await asyncio.to_thread(
            _gemini_fallback_response,
            user_content,
            ctx,
            history,
        )
        if ai_text:
            inference_backend = "gemini"
        else:
            ai_text = _fallback_response(user_content, ctx, history)
            fallback_used = True
            inference_backend = "rule-fallback"
            inference_error = gemini_error
        resolved_model = GEMINI_MODEL_ID
    else:
        raise HTTPException(
            status_code=400,
            detail="Selected model is not supported by core backend. Use Gemini, venture ranker, or pitch coach.",
        )

    if not ai_text:
        ai_text = "I'm sorry, I couldn't generate a response. Please try again."

    # Save assistant message
    ai_msg = AiChatMessage(
        user_id=current_user.id,
        session_id=session_id,
        role="assistant",
        content=ai_text,
        model_used=resolved_model,
        startup_context=ctx,
    )
    db.add(ai_msg)
    db.commit()

    return AiChatResponse(
        message=ai_text,
        session_id=session_id,
        model=resolved_model,
        fallback_used=fallback_used,
        inference_backend=inference_backend,
        inference_error=inference_error,
    )


@router.get("/admin/runtime-status")
async def get_admin_runtime_status(
    current_user: User = Depends(get_current_user),
):
    """Return AI runtime status for admin diagnostics."""

    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    chatbot_service = await asyncio.to_thread(_probe_chatbot_service, settings.CHATBOT_SERVICE_URL)
    analysis_info = venture_scorer.get_model_info()
    pitch_info = pitch_coach_engine.status()

    gemini_key_present = bool((settings.GEMINI_API_KEY or "").strip())
    hf_token_present = bool(
        (settings.HF_TOKEN or settings.HUGGINGFACE_TOKEN or settings.HUGGINGFACE_API_TOKEN or "").strip()
    )
    chatbot_reachable = chatbot_service.get("reachable", False)

    # Determine effective inference mode for chatbot features.
    if gemini_key_present:
        inference_mode = "gemini"
    elif chatbot_reachable:
        inference_mode = "gguf-service"
    else:
        inference_mode = "rule-based-fallback"

    # Build chatbot_engine status compatible with what the admin dashboard reads.
    chatbot_engine_status = {
        "loaded": gemini_key_present or chatbot_reachable,
        "repo_id": settings.URUTI_CHATBOT_REPO_ID or "n/a",
        "filename": settings.URUTI_CHATBOT_GGUF_FILENAME or "n/a",
        "local_path_exists": False,
        "hf_token_configured": hf_token_present,
        "gemini_available": gemini_key_present,
        "inference_mode": inference_mode,
        "load_error": (
            None if (gemini_key_present or chatbot_reachable)
            else "Gemini API key not set and dedicated GGUF service is unreachable"
        ),
    }

    return {
        # Keys the admin frontend reads for 'Uruti AI Modules Status' card.
        "chatbot_model_id": settings.URUTI_BEST_MODEL_ID or "uruti-ai",
        "chatbot_engine": chatbot_engine_status,
        # Full-detail analysis/ranker engine info.
        "analysis_model_id": ANALYSIS_MODEL_ID,
        "analysis_engine": analysis_info,
        # Pitch coach engine.
        "pitch_model_id": PITCH_MODEL_ID,
        "pitch_coach_engine": pitch_info,
        # Service health.
        "core_service": {
            "service": "core-backend",
            "status": "healthy",
        },
        "chatbot_service": chatbot_service,
    }


@router.get("/models")
async def get_models(
    current_user: User = Depends(get_current_user),
):
    """Return AI models available in backend so frontend model picker is not hardcoded."""

    models = _available_models()
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role not in {"founder", "investor", "admin"}:
        models = [m for m in models if m["type"] != "analysis"]
    return models


@router.get("/history", response_model=List[AiChatSessionSummary])
async def get_history_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return a summary list of the user's past chat sessions."""
    rows = (
        db.query(AiChatMessage)
        .filter(
            AiChatMessage.user_id == current_user.id,
            AiChatMessage.role == "user",
        )
        .order_by(AiChatMessage.created_at)
        .all()
    )

    sessions: dict[str, AiChatSessionSummary] = {}
    for row in rows:
        if row.session_id not in sessions:
            sessions[row.session_id] = AiChatSessionSummary(
                session_id=row.session_id,
                first_message=row.content[:100],
                message_count=0,
                created_at=row.created_at,
                model_used=row.model_used,
            )
        sessions[row.session_id].message_count += 1

    return list(sessions.values())


@router.get("/history/{session_id}", response_model=List[AiChatMessageResponse])
async def get_session_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all messages in a specific chat session."""
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


@router.delete("/history", status_code=204)
async def clear_all_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete ALL chat history for the current user."""
    db.query(AiChatMessage).filter(AiChatMessage.user_id == current_user.id).delete()
    db.commit()


@router.delete("/history/{session_id}", status_code=204)
async def clear_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a specific chat session."""
    db.query(AiChatMessage).filter(
        AiChatMessage.user_id == current_user.id,
        AiChatMessage.session_id == session_id,
    ).delete()
    db.commit()
