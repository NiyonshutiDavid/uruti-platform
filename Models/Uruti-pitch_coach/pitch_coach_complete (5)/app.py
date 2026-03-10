from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from inference import load_models, compute_score, predict_action

app = FastAPI(title="Uruti Pitch Coach API")

# 1. Enable CORS for React/Flutter Frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace "*" with your actual frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models on startup
reward_model, rl_agent = load_models()

# 2. Define human-readable coaching tips to send directly to the UI
ACTION_MAP = {
    0: "Increase Energy (Speak louder and with more passion)",
    1: "Improve Eye Contact (Look directly at the camera)",
    2: "Reduce Fillers (Take a pause instead of saying 'um' or 'uh')",
    3: "Slow Down (Your pacing is a bit too fast)",
    4: "Clarify Point (Ensure your speech aligns with the slide text)",
    5: "Smile / Stronger Hook (Engage your audience visually)"
}

class FeaturePayload(BaseModel):
    features: List[float]

@app.post("/score")
def get_score(payload: FeaturePayload):
    if len(payload.features) != 9:
        raise HTTPException(status_code=400, detail="Must provide exactly 9 features")
    score = compute_score(reward_model, payload.features)
    return {"score": score}

@app.post("/coach")
def get_coaching_action(payload: FeaturePayload):
    # Expects 12 features: 9 core visual/audio + 3 context (slide_idx, time_rem, time_on_slide)
    if len(payload.features) != 12:
        raise HTTPException(status_code=400, detail="Must provide exactly 12 features for state vector")
    
    action_code = predict_action(rl_agent, payload.features)
    
    return {
        "action_code": action_code,
        "feedback": ACTION_MAP.get(action_code, "Keep going!")
    }
