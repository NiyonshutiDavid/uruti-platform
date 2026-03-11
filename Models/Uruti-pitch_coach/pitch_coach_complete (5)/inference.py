import torch
import torch.nn as nn
import numpy as np
import os
import tempfile
import zipfile
from stable_baselines3 import DQN, PPO, A2C
from sb3_contrib import TRPO

class RewardMLP(nn.Module):
    def __init__(self, input_dim):
        super(RewardMLP, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128), nn.ReLU(),
            nn.Linear(128, 64), nn.ReLU(),
            nn.Linear(64, 1)
        )
    def forward(self, x): return self.net(x)


def _resolve_sb3_model_path(model_path):
    if os.path.isfile(model_path):
        return model_path, None

    if not os.path.isdir(model_path):
        raise FileNotFoundError(f"SB3 model artifact not found: {model_path}")

    temp_dir = tempfile.TemporaryDirectory(prefix="uruti_pitch_sb3_")
    zip_path = os.path.join(temp_dir.name, "best_model.zip")
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(model_path):
            for name in files:
                file_path = os.path.join(root, name)
                arcname = os.path.relpath(file_path, model_path)
                zf.write(file_path, arcname=arcname)
    return zip_path, temp_dir


def _load_sb3_for_inference(algo_class, zip_path, device="cpu"):
    """Load an SB3 model for inference, tolerating optimizer state mismatches.

    Tries a standard load first.  If the optimizer state dict is incompatible
    with the installed torch version (common when the model was trained on a
    different torch release), patches BasePolicy.set_parameters to use
    exact_match=False so that a missing or mismatched optimizer is silently
    skipped — the optimizer is never needed for inference.
    """
    # Attempt 1: standard load (works when torch versions align).
    try:
        return algo_class.load(zip_path, device=device)
    except Exception:
        pass

    # Attempt 2: relax the exact-match check so a mismatched / absent
    # optimizer state does not block loading the policy weights.
    from stable_baselines3.common.policies import BasePolicy
    _orig = BasePolicy.set_parameters

    def _relaxed(self, load_path_or_dict, exact_match=True, device="auto"):
        return _orig(self, load_path_or_dict, exact_match=False, device=device)

    BasePolicy.set_parameters = _relaxed
    try:
        return algo_class.load(zip_path, device=device)
    finally:
        BasePolicy.set_parameters = _orig


def load_models():
    base_path = os.path.dirname(os.path.abspath(__file__))

    # 1. Load Reward Model
    reward_model = RewardMLP(input_dim=9)
    reward_path = os.path.join(base_path, "models", "reward_model.pt")
    reward_model.load_state_dict(torch.load(reward_path, map_location="cpu", weights_only=True))
    reward_model.eval()

    # 2. Identify and Load Best RL Agent
    with open(os.path.join(base_path, "models", "best_model_name.txt"), "r") as f:
        algo_name = f.read().strip()

    model_path = os.path.join(base_path, "models", "best_model")
    load_path, temp_dir = _resolve_sb3_model_path(model_path)

    algorithms = {"DQN": DQN, "PPO": PPO, "A2C": A2C, "TRPO": TRPO}
    rl_agent = _load_sb3_for_inference(algorithms[algo_name], load_path, device="cpu")
    if temp_dir is not None:
        rl_agent._uruti_temp_dir = temp_dir

    return reward_model, rl_agent

def compute_score(reward_model, features):
    with torch.no_grad():
        tensor_feat = torch.FloatTensor(features).unsqueeze(0)
        score = reward_model(tensor_feat).item()
    return round(score, 2)

def predict_action(rl_agent, state_vector):
    action, _ = rl_agent.predict(np.array(state_vector, dtype=np.float32), deterministic=True)
    return int(action)
