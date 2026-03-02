import joblib
import numpy as np
import pandas as pd

class UrutiPredictor:
    def __init__(self, bundle_path: str):
        self.bundle = joblib.load(bundle_path)
        self.model = self.bundle["model_pipeline"]
        self.class_names = self.bundle["class_names"]
        self.class_to_id = self.bundle["class_to_id"]
        self.id_to_class = self.bundle["id_to_class"]
        self.expected_cols = self.bundle["expected_feature_names"]
        self.cfg = self.bundle["uruti_config"]

    def _score_band(self, score: float) -> str:
        for band in self.cfg["band_definitions"]:
            if score >= band["min"]:
                return band["label"]
        return "Early Stage / Not Ready (<50)"

    def _score_to_prior_probs(self, score: float) -> np.ndarray:
        pp = self.cfg["prior_probs_by_band"]
        if score >= 80:
            prior = np.array(pp["80_plus"], dtype=float)
        elif score >= 70:
            prior = np.array(pp["70_79"], dtype=float)
        elif score >= 60:
            prior = np.array(pp["60_69"], dtype=float)
        elif score >= 50:
            prior = np.array(pp["50_59"], dtype=float)
        else:
            prior = np.array(pp["below_50"], dtype=float)
        return prior / prior.sum()

    def _compute_uruti_score(self, profile: dict) -> float:
        w = self.cfg["heuristic_weights"]
        sector = str(profile.get("sector", "unknown")).strip().lower()
        team_size = float(profile.get("team_size", 0) or 0)
        user_base = float(profile.get("user_base", 0) or 0)
        growth = float(profile.get("monthly_growth_pct", 0) or 0)
        partnerships = float(profile.get("partnerships", 0) or 0)
        target_market_size = float(profile.get("target_market_size", max(user_base * 3, 3000)) or max(user_base * 3, 3000))
        stage = str(profile.get("stage", "")).lower()

        penetration = min(user_base / max(target_market_size, 1), 1.0)p
        team_score = min(team_size / 8.0, 1.0) * 100
        traction_score = penetration * 100
        growth_score = min(growth / 20.0, 1.0) * 100
        partner_score = min(partnerships / 5.0, 1.0) * 100

        sector_boost = 100 if sector.replace("-", "").replace(" ", "") in {
            "fintech", "agtech", "agritech", "edtech", "healthtech", "ecommerce"
        } else 70

        if "series b" in stage:
            stage_score = 95
        elif "series a" in stage:
            stage_score = 85
        elif "seed" in stage:
            stage_score = 75
        elif stage:
            stage_score = 70
        else:
            stage_score = 72

        heuristic = (
            w["team"] * team_score
            + w["traction"] * traction_score
            + w["growth"] * growth_score
            + w["partnership"] * partner_score
            + w["sector_boost"] * sector_boost
            + w["stage"] * stage_score
        )

        if profile.get("mlp_score") is not None:
            platform_mlp = float(profile["mlp_score"])
            final = 0.45 * heuristic + 0.55 * platform_mlp
        else:
            final = heuristic

        return float(np.clip(final, 0, 100))

    def _map_profile_to_model_features(self, profile: dict) -> dict:
        sector = str(profile.get("sector", "unknown")).strip().lower()
        team_size = float(profile.get("team_size", 5) or 5)
        user_base = float(profile.get("user_base", 0) or 0)
        monthly_growth = float(profile.get("monthly_growth_pct", 10) or 10)
        partnerships = float(profile.get("partnerships", 1) or 1)

        age = profile.get("age")
        if age is None:
            stage = str(profile.get("stage", "")).lower()
            if "seed" in stage:
                age = 1.5
            elif "series a" in stage:
                age = 3.0
            elif "series b" in stage:
                age = 5.0
            else:
                age = 2.0
        age = float(age)

        revenue = profile.get("revenue")
        if revenue is None:
            arpu_map = {
                "fintech": 50, "agtech": 30, "agritech": 30,
                "edtech": 40, "healthtech": 60, "e-commerce": 25, "ecommerce": 25
            }
            key = sector.replace(" ", "").replace("-", "")
            arpu = arpu_map.get(key, 30)
            base_rev = user_base * arpu if user_base > 0 else team_size * 10000 * age
            growth_multiplier = 1 + (monthly_growth / 100.0)
            partner_multiplier = 1 + (min(partnerships, 10) * 0.03)
            revenue = base_rev * growth_multiplier * partner_multiplier
        revenue = float(revenue)

        funding = float(profile.get("funding", revenue * 0.8) or revenue * 0.8)
        total_spend = funding * 0.6
        rd_spend = total_spend * 0.45
        admin_spend = total_spend * 0.25
        marketing_spend = total_spend * 0.30

        profit = float(profile.get("profit", revenue * 0.20))
        founded_year = int(profile.get("founded_year", max(2015, 2026 - int(round(age)))))p
        funding_rounds = int(profile.get("funding_rounds", 1 if funding > 0 else 0))
        state_code = str(profile.get("state_code", "RW"))
        category_code = str(profile.get("category_code", sector if sector else "agritech"))
        source = str(profile.get("source", "platform_profile"))

        canonical = {
            "rd_spend": rd_spend,
            "administration_spend": admin_spend,
            "marketing_spend": marketing_spend,
            "funding_total_usd": funding,
            "profit": profit,
            "founded_year": founded_year,
            "funding_rounds": funding_rounds,
            "state_code": state_code,
            "category_code": category_code,
            "source": source,
        }

        row = {}
        for col in self.expected_cols:
            if col in canonical:
                row[col] = canonical[col]
            else:
                low = str(col).lower()
                if any(k in low for k in ["spend", "revenue", "funding", "valuation", "profit", "age", "employees", "rounds", "year"]):
                    row[col] = 0.0
                else:
                    row[col] = "unknown"
        return row

    def predict_profile(self, profile: dict) -> dict:
        model_row = self._map_profile_to_model_features(profile)
        df = pd.DataFrame([model_row])
        model_probs = self.model.predict_proba(df)[0]

        uruti_score = self._compute_uruti_score(profile)
        prior_probs = self._score_to_prior_probs(uruti_score)

        alpha = self.cfg["blend_alpha"]["with_platform_mlp_score"] if profile.get("mlp_score") is not None else self.cfg["blend_alpha"]["without_platform_mlp_score"]
        blended = alpha * model_probs + (1 - alpha) * prior_probs
        blended = blended / blended.sum()

        pred_id = int(np.argmax(blended))
        pred_name = self.id_to_class[pred_id]
        prob_dict = {self.id_to_class[i]: float(blended[i]) for i in range(len(self.class_names))}

        return {
            "prediction": pred_name,
            "confidence": float(np.max(blended)),
            "probabilities": prob_dict,
            "uruti_score_100": float(uruti_score),
            "uruti_band": self._score_band(uruti_score)
        }

    def predict_many(self, profiles):
        return [self.predict_profile(p) for p in profiles]
