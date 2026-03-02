"""
AI Chat router — handles conversation with Uruti's AI advisor.

Uses OpenAI when OPENAI_API_KEY is set in environment/.env, otherwise
falls back to a smart rule-based response engine so development works
without a paid API key.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from typing import List
import uuid, os

from ..database import get_db
from ..models import AiChatMessage, User, Venture
from ..schemas import (
    AiChatRequest, AiChatResponse,
    AiChatMessageResponse, AiChatSessionSummary,
)
from ..auth import get_current_user
from ..config import settings

router = APIRouter(prefix="/ai", tags=["ai"])

# ─── Available models ────────────────────────────────────────────────────────
SUPPORTED_MODELS = ["uruti-ai", "gpt-4", "gpt-3.5-turbo", "gpt-4-turbo"]


# ─── OpenAI helper (optional) ────────────────────────────────────────────────
def _openai_chat(messages: list[dict], model: str) -> str:
    """Call OpenAI Chat Completions if key is present, else raise ImportError."""
    api_key = getattr(settings, "OPENAI_API_KEY", None) or os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("No OpenAI API key configured")
    try:
        import openai  # type: ignore
        client = openai.OpenAI(api_key=api_key)
        oai_model = model if model.startswith("gpt") else "gpt-3.5-turbo"
        resp = client.chat.completions.create(model=oai_model, messages=messages)
        return resp.choices[0].message.content or ""
    except Exception as exc:
        raise ValueError(f"OpenAI error: {exc}") from exc


# ─── Uruti fallback AI ────────────────────────────────────────────────────────
_SYSTEM_PROMPT = (
    "You are the Uruti AI Advisor — an expert startup advisor specialised in "
    "early-stage companies in Rwanda and Sub-Saharan Africa. You help founders "
    "with ideation, market sizing, GTM strategy, pitch preparation, fundraising, "
    "and building investor-ready businesses. Be concrete, practical, and cite "
    "Rwanda / African context where relevant."
)

def _fallback_response(user_text: str, context: dict | None, history: list[dict]) -> str:
    """Rule-based fallback when OpenAI is not configured."""
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


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=AiChatResponse)
async def chat(
    payload: AiChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message to the AI Advisor. Persists history."""
    session_id = payload.session_id or str(uuid.uuid4())
    model = payload.model if payload.model in SUPPORTED_MODELS else "uruti-ai"

    # Build context string to inject
    ctx = payload.startup_context.model_dump(exclude_none=True) if payload.startup_context else None
    ctx_text = ""
    if ctx:
        ctx_text = (
            f"\n\n[Startup Context: {ctx.get('name','')} | "
            f"Stage: {ctx.get('stage','')} | "
            f"Industry: {ctx.get('industry','')} | "
            f"Problem: {ctx.get('problem_statement','')} | "
            f"Solution: {ctx.get('solution','')}]"
        )

    # Build user message (include file content if present)
    user_content = payload.message
    if payload.file_content:
        user_content += f"\n\n[Attached file — {payload.file_name or 'file'}]:\n{payload.file_content[:4000]}"

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
    history = [{"role": m.role, "content": m.content} for m in prev]

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

    if model != "uruti-ai":
        # Try OpenAI
        oai_messages = [{"role": "system", "content": _SYSTEM_PROMPT + ctx_text}]
        oai_messages += history
        oai_messages.append({"role": "user", "content": user_content})
        try:
            ai_text = _openai_chat(oai_messages, model)
        except ValueError:
            # Fallback gracefully
            ai_text = _fallback_response(payload.message, ctx, history)
            resolved_model = "uruti-ai"
    else:
        ai_text = _fallback_response(payload.message, ctx, history)

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

    return AiChatResponse(message=ai_text, session_id=session_id, model=resolved_model)


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
