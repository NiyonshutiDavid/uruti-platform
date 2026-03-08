from __future__ import annotations

from typing import Any

from ..models import Venture


def _enum_value(value: Any) -> Any:
    return value.value if hasattr(value, "value") else value


def build_venture_context(venture: Venture) -> dict[str, Any]:
    """Build a rich venture context payload for AI responses."""
    founder = getattr(venture, "founder", None)
    founder_role = None
    if founder is not None:
        founder_role = _enum_value(getattr(founder, "role", None))

    return {
        "venture_id": venture.id,
        "founder_id": venture.founder_id,
        "name": venture.name,
        "tagline": venture.tagline,
        "description": venture.description,
        "stage": _enum_value(venture.stage),
        "industry": _enum_value(venture.industry),
        "problem_statement": venture.problem_statement,
        "solution": venture.solution,
        "target_market": venture.target_market,
        "business_model": venture.business_model,
        "funding_goal": venture.funding_goal,
        "funding_raised": venture.funding_raised,
        "revenue": venture.revenue,
        "monthly_burn_rate": venture.monthly_burn_rate,
        "team_size": venture.team_size,
        "team_info": venture.team_info,
        "customers": venture.customers,
        "mrr": venture.mrr,
        "uruti_score": venture.uruti_score,
        "score_breakdown": venture.score_breakdown,
        "highlights": venture.highlights,
        "competitive_edge": venture.competitive_edge,
        "team_background": venture.team_background,
        "funding_plans": venture.funding_plans,
        "milestones": venture.milestones,
        "activities": venture.activities,
        "logo_url": venture.logo_url,
        "pitch_deck_url": venture.pitch_deck_url,
        "demo_video_url": venture.demo_video_url,
        "is_published": venture.is_published,
        "is_seeking_funding": venture.is_seeking_funding,
        "created_at": venture.created_at.isoformat() if venture.created_at else None,
        "updated_at": venture.updated_at.isoformat() if venture.updated_at else None,
        "founder": {
            "id": getattr(founder, "id", None),
            "full_name": getattr(founder, "full_name", None),
            "role": founder_role,
            "title": getattr(founder, "title", None),
            "company": getattr(founder, "company", None),
            "location": getattr(founder, "location", None),
            "years_of_experience": getattr(founder, "years_of_experience", None),
            "industry": getattr(founder, "industry", None),
            "expertise": getattr(founder, "expertise", None),
        },
    }
