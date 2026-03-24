from datetime import datetime, timezone
from types import SimpleNamespace

from app.services.venture_scorer import VentureScorer, _clamp


def test_clamp_bounds_values() -> None:
    assert _clamp(10.0, 0.0, 5.0) == 5.0
    assert _clamp(-1.0, 0.0, 5.0) == 0.0
    assert _clamp(2.5, 0.0, 5.0) == 2.5


def test_profile_completeness_counts_filled_fields() -> None:
    scorer = VentureScorer()
    venture = SimpleNamespace(
        tagline="tag",
        description="desc",
        problem_statement="problem",
        solution="solution",
        target_market="market",
        business_model="model",
        logo_url="/logo.png",
        banner_url=None,
        pitch_deck_url="",
        demo_video_url=None,
    )

    completeness = scorer._profile_completeness(venture)

    assert completeness == 0.8


def test_venture_age_years_uses_created_at() -> None:
    scorer = VentureScorer()
    venture = SimpleNamespace(created_at=datetime(2025, 1, 1, tzinfo=timezone.utc))

    age = scorer._venture_age_years(venture)

    assert 0.0 <= age <= 15.0


def test_heuristic_score_returns_expected_shape() -> None:
    scorer = VentureScorer()
    venture = SimpleNamespace(
        revenue=12000.0,
        funding_raised=3000.0,
        team_size=4,
        customers=40,
        mrr=900.0,
        tagline="tag",
        description="desc",
        problem_statement="problem",
        solution="solution",
        target_market="market",
        business_model="model",
        logo_url="/logo.png",
        banner_url="/banner.png",
        pitch_deck_url="/deck.pdf",
        demo_video_url="/demo.mp4",
    )

    score = scorer._heuristic_score(venture)

    assert 0.0 <= score["uruti_score"] <= 100.0
    assert score["predicted_class"] in {
        "not_ready",
        "mentorship_needed",
        "investment_ready",
    }
    assert score["model_source"] == "heuristic_fallback"
