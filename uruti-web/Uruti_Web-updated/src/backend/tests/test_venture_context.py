from datetime import datetime
from enum import Enum
from types import SimpleNamespace

from app.services.venture_context import build_venture_context


class _Stage(str, Enum):
    MVP = "mvp"


class _Role(str, Enum):
    FOUNDER = "founder"


def test_build_venture_context_maps_core_fields() -> None:
    founder = SimpleNamespace(
        id=7,
        full_name="Jane Doe",
        role=_Role.FOUNDER,
        title="CEO",
        company="Uruti",
        location="Kigali",
        years_of_experience=4,
        industry="fintech",
        expertise="ops",
    )
    venture = SimpleNamespace(
        id=99,
        founder_id=7,
        name="Alpha",
        tagline="Build faster",
        description="desc",
        stage=_Stage.MVP,
        industry="fintech",
        problem_statement="problem",
        solution="solution",
        target_market="SMEs",
        business_model="SaaS",
        funding_goal=10000,
        funding_raised=3000,
        revenue=500,
        monthly_burn_rate=200,
        team_size=3,
        team_info="core team",
        customers=20,
        mrr=120,
        uruti_score=73.1,
        score_breakdown={"traction": 80},
        highlights=["launched"],
        competitive_edge="speed",
        team_background="mixed",
        funding_plans="seed",
        milestones=["m1"],
        activities=["pitch"],
        logo_url="/logo.png",
        pitch_deck_url="/deck.pdf",
        demo_video_url="/demo.mp4",
        is_published=True,
        is_seeking_funding=True,
        created_at=datetime(2025, 1, 1, 12, 0, 0),
        updated_at=datetime(2025, 1, 2, 12, 0, 0),
        founder=founder,
    )

    payload = build_venture_context(venture)

    assert payload["venture_id"] == 99
    assert payload["stage"] == "mvp"
    assert payload["founder"]["role"] == "founder"
    assert payload["founder"]["full_name"] == "Jane Doe"
    assert payload["created_at"].startswith("2025-01-01T12:00:00")
