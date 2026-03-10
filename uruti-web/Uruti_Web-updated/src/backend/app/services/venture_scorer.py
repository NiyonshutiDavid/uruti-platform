from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import json
import sys

import joblib
import pandas as pd


@dataclass
class _LoadedBundle:
    estimator: Any
    class_names: List[str]
    model_name: str
    bundle_path: str


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


class VentureScorer:
    def __init__(self) -> None:
        self._loaded: Optional[_LoadedBundle] = None
        self._model_folder_name = "Uruti-Investor_Intelligence_and_Ranker"

    def _resolve_paths(self) -> Tuple[Optional[Path], Optional[Path]]:
        rel_bundle = Path("Models/Uruti-Investor_Intelligence_and_Ranker/uruti_bundle.joblib")
        rel_meta = Path("Models/Uruti-Investor_Intelligence_and_Ranker/uruti_bundle_meta.json")

        here = Path(__file__).resolve()
        for parent in here.parents:
            bundle_path = parent / rel_bundle
            meta_path = parent / rel_meta
            if bundle_path.exists():
                return bundle_path, meta_path if meta_path.exists() else None
        return None, None

    def _load(self) -> Optional[_LoadedBundle]:
        if self._loaded is not None:
            return self._loaded

        bundle_path, meta_path = self._resolve_paths()
        if bundle_path is None:
            return None

        class_names: List[str] = []
        model_name = self._model_folder_name

        if meta_path and meta_path.exists():
            try:
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
                class_names = [str(item) for item in meta.get("class_names", [])]
                model_name = str(model_name)
            except Exception:
                pass

        # Some exported sklearn/joblib bundles reference numpy internals under
        # the newer "numpy._core" module path. Provide compatibility aliases so
        # loading works across numpy distributions.
        try:
            import numpy.core as _np_core  # type: ignore

            if "numpy._core" not in sys.modules:
                sys.modules["numpy._core"] = _np_core
            if "numpy._core.numeric" not in sys.modules and hasattr(_np_core, "numeric"):
                sys.modules["numpy._core.numeric"] = _np_core.numeric
        except Exception:
            pass

        loaded_obj = joblib.load(bundle_path)
        estimator = loaded_obj

        if isinstance(loaded_obj, dict):
            estimator = (
                loaded_obj.get("model")
                or loaded_obj.get("estimator")
                or loaded_obj.get("pipeline")
                or loaded_obj.get("model_pipeline")
                or loaded_obj.get("clf")
                or loaded_obj.get("classifier")
                or loaded_obj
            )

            # Fall back to the first object that behaves like an estimator.
            if isinstance(estimator, dict):
                for value in loaded_obj.values():
                    if hasattr(value, "predict"):
                        estimator = value
                        break

            if not class_names:
                raw_classes = loaded_obj.get("class_names") or loaded_obj.get("classes")
                if isinstance(raw_classes, list):
                    class_names = [str(c) for c in raw_classes]
            model_name = str(model_name)

        if not class_names and hasattr(estimator, "classes_"):
            class_names = [str(c) for c in list(estimator.classes_)]

        folder_name = bundle_path.parent.name if bundle_path.parent else self._model_folder_name

        self._loaded = _LoadedBundle(
            estimator=estimator,
            class_names=class_names,
            model_name=folder_name,
            bundle_path=str(bundle_path),
        )
        return self._loaded

    def get_model_info(self) -> Dict[str, Any]:
        bundle_path, meta_path = self._resolve_paths()

        meta: Dict[str, Any] = {}
        if meta_path and meta_path.exists():
            try:
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
            except Exception:
                meta = {}

        loaded = self._load()

        if loaded is None:
            return {
                "status": "fallback",
                "model_source": "heuristic_fallback",
                "model_name": self._model_folder_name,
                "model_folder": self._model_folder_name,
                "bundle_path": str(bundle_path) if bundle_path else None,
                "meta_path": str(meta_path) if meta_path else None,
                "inference_backend": "rule_based",
                "class_names": ["not_ready", "mentorship_needed", "investment_ready"],
                "expected_feature_count": int(meta.get("expected_feature_count") or 10),
                "score_definition": str(meta.get("score") or "Uruti score is 0-100"),
            }

        estimator = loaded.estimator
        expected_feature_count = int(meta.get("expected_feature_count") or 0)
        if expected_feature_count <= 0 and hasattr(estimator, "feature_names_in_"):
            expected_feature_count = len(list(estimator.feature_names_in_))

        class_names = loaded.class_names or [
            str(c) for c in meta.get("class_names", []) if c is not None
        ]

        return {
            "status": "ready",
            "model_source": "root_models_bundle",
            "model_name": loaded.model_name,
            "model_folder": loaded.model_name,
            "bundle_path": loaded.bundle_path,
            "meta_path": str(meta_path) if meta_path else None,
            "inference_backend": estimator.__class__.__name__,
            "class_names": class_names,
            "expected_feature_count": expected_feature_count,
            "score_definition": str(meta.get("score") or "Uruti score is 0-100"),
        }

    def _venture_age_years(self, venture: Any) -> float:
        created_at = getattr(venture, "created_at", None)
        if not isinstance(created_at, datetime):
            return 0.5
        now = datetime.now(timezone.utc)
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        delta = now - created_at
        return _clamp(delta.days / 365.25, 0.0, 15.0)

    def _profile_completeness(self, venture: Any) -> float:
        fields = [
            getattr(venture, "tagline", None),
            getattr(venture, "description", None),
            getattr(venture, "problem_statement", None),
            getattr(venture, "solution", None),
            getattr(venture, "target_market", None),
            getattr(venture, "business_model", None),
            getattr(venture, "logo_url", None),
            getattr(venture, "banner_url", None),
            getattr(venture, "pitch_deck_url", None),
            getattr(venture, "demo_video_url", None),
        ]
        filled = 0
        for value in fields:
            if isinstance(value, str) and value.strip():
                filled += 1
            elif value is not None and value is not False:
                filled += 1
        return round(filled / len(fields), 4)

    def _feature_value(self, name: str, venture: Any) -> Any:
        n = name.strip().lower()

        numeric_defaults: Dict[str, float] = {
            "revenue": float(getattr(venture, "revenue", 0.0) or 0.0),
            "funding": float(getattr(venture, "funding_raised", 0.0) or 0.0),
            "funding_raised": float(getattr(venture, "funding_raised", 0.0) or 0.0),
            "funding_goal": float(getattr(venture, "funding_goal", 0.0) or 0.0),
            "valuation": float(getattr(venture, "funding_goal", 0.0) or 0.0),
            "employees": float(getattr(venture, "team_size", 1) or 1),
            "team_size": float(getattr(venture, "team_size", 1) or 1),
            "customers": float(getattr(venture, "customers", 0) or 0),
            "mrr": float(getattr(venture, "mrr", 0.0) or 0.0),
            "monthly_burn_rate": float(getattr(venture, "monthly_burn_rate", 0.0) or 0.0),
            "age": self._venture_age_years(venture),
            "startup_age": self._venture_age_years(venture),
            "startup_age_years": self._venture_age_years(venture),
            "profile_completeness": self._profile_completeness(venture),
            "is_seeking_funding": 1.0 if bool(getattr(venture, "is_seeking_funding", False)) else 0.0,
            "r&d spend": float(getattr(venture, "monthly_burn_rate", 0.0) or 0.0) * 0.35,
            "administration": float(getattr(venture, "monthly_burn_rate", 0.0) or 0.0) * 0.25,
            "marketing spend": float(getattr(venture, "monthly_burn_rate", 0.0) or 0.0) * 0.40,
            "new york": 0.0,
            "california": 0.0,
            "florida": 0.0,
        }

        if n in numeric_defaults:
            return numeric_defaults[n]

        if n in {"sector", "industry"}:
            value = getattr(venture, "industry", None)
            return str(value.value if hasattr(value, "value") else value or "other")

        if n in {"status", "stage"}:
            value = getattr(venture, "stage", None)
            return str(value.value if hasattr(value, "value") else value or "ideation")

        return 0.0

    def _build_feature_row(self, venture: Any, bundle: _LoadedBundle) -> Dict[str, Any]:
        estimator = bundle.estimator
        if hasattr(estimator, "feature_names_in_"):
            names = [str(name) for name in list(estimator.feature_names_in_)]
        elif bundle.class_names and len(bundle.class_names) == 10:
            names = [
                "revenue",
                "funding_raised",
                "monthly_burn_rate",
                "team_size",
                "customers",
                "mrr",
                "funding_goal",
                "startup_age_years",
                "industry",
                "stage",
            ]
        else:
            names = [
                "revenue",
                "funding",
                "employees",
                "age",
                "sector",
                "status",
                "monthly_burn_rate",
                "customers",
                "mrr",
                "profile_completeness",
            ]

        return {name: self._feature_value(name, venture) for name in names}

    def _heuristic_score(self, venture: Any) -> Dict[str, Any]:
        revenue = float(getattr(venture, "revenue", 0.0) or 0.0)
        funding = float(getattr(venture, "funding_raised", 0.0) or 0.0)
        team = float(getattr(venture, "team_size", 1) or 1)
        customers = float(getattr(venture, "customers", 0) or 0)
        mrr = float(getattr(venture, "mrr", 0.0) or 0.0)
        completeness = self._profile_completeness(venture)

        score = 22.0
        score += _clamp(revenue / 15000.0, 0, 30)
        score += _clamp(mrr / 3000.0, 0, 18)
        score += _clamp(customers / 150.0, 0, 12)
        score += _clamp(team * 1.8, 0, 14)
        score += _clamp(completeness * 12.0, 0, 12)
        score += _clamp((funding / max(revenue, 1.0)) * 0.8, -8, 8)
        score = float(round(_clamp(score, 0, 100), 2))

        if score >= 75:
            predicted_class = "investment_ready"
        elif score >= 45:
            predicted_class = "mentorship_needed"
        else:
            predicted_class = "not_ready"

        return {
            "uruti_score": score,
            "predicted_class": predicted_class,
            "confidence": 0.55,
            "class_probabilities": {
                "not_ready": round(_clamp((45 - score) / 45, 0, 1), 4),
                "mentorship_needed": round(_clamp(1 - abs(score - 60) / 30, 0, 1), 4),
                "investment_ready": round(_clamp((score - 55) / 45, 0, 1), 4),
            },
            "model_source": "heuristic_fallback",
            "model_name": self._model_folder_name,
            "used_bundle_path": None,
        }

    def score_venture(self, venture: Any) -> Dict[str, Any]:
        bundle = self._load()
        if bundle is None:
            return self._heuristic_score(venture)

        try:
            row = self._build_feature_row(venture, bundle)
            frame = pd.DataFrame([row])

            estimator = bundle.estimator
            try:
                predicted_raw = estimator.predict(frame)[0]
                probabilities = estimator.predict_proba(frame)[0] if hasattr(estimator, "predict_proba") else None
            except AttributeError as exc:
                # Compatibility path for older xgboost estimators under newer
                # sklearn versions where Pipeline.predict can fail on tag checks.
                if "__sklearn_tags__" not in str(exc) or not hasattr(estimator, "steps"):
                    raise

                transformed = frame
                steps = list(getattr(estimator, "steps", []))
                for _, step in steps[:-1]:
                    transformed = step.transform(transformed)

                last_step = steps[-1][1] if steps else estimator
                predicted_raw = last_step.predict(transformed)[0]
                probabilities = (
                    last_step.predict_proba(transformed)[0]
                    if hasattr(last_step, "predict_proba")
                    else None
                )

            classes = bundle.class_names
            if not classes and hasattr(estimator, "classes_"):
                classes = [str(c) for c in list(estimator.classes_)]

            predicted_class = str(predicted_raw)
            if str(predicted_raw).isdigit() and classes:
                idx = int(predicted_raw)
                if 0 <= idx < len(classes):
                    predicted_class = classes[idx]

            class_probabilities: Dict[str, float] = {}
            if probabilities is not None:
                if classes and len(classes) == len(probabilities):
                    class_probabilities = {
                        str(classes[idx]): float(round(prob, 6))
                        for idx, prob in enumerate(probabilities)
                    }
                else:
                    class_probabilities = {
                        f"class_{idx}": float(round(prob, 6))
                        for idx, prob in enumerate(probabilities)
                    }

            score_weights = {
                "not_ready": 25,
                "mentorship_needed": 60,
                "investment_ready": 90,
            }

            if class_probabilities:
                weighted_score = 0.0
                total_prob = 0.0
                for label, prob in class_probabilities.items():
                    weight = score_weights.get(label.lower(), 50)
                    weighted_score += float(prob) * float(weight)
                    total_prob += float(prob)
                if total_prob > 0:
                    weighted_score /= total_prob
                uruti_score = float(round(_clamp(weighted_score, 0, 100), 2))
                confidence = float(round(max(class_probabilities.values()), 6))
            else:
                uruti_score = float(score_weights.get(predicted_class.lower(), 50))
                confidence = 0.5

            return {
                "uruti_score": uruti_score,
                "predicted_class": predicted_class,
                "confidence": confidence,
                "class_probabilities": class_probabilities,
                "model_source": "root_models_bundle",
                "model_name": bundle.model_name,
                "used_bundle_path": bundle.bundle_path,
            }
        except Exception as exc:
            fallback = self._heuristic_score(venture)
            fallback["model_error"] = str(exc)
            return fallback


venture_scorer = VentureScorer()
