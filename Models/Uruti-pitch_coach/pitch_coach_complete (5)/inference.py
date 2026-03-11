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
                # Skip optimizer state — not needed for inference and causes
                # version-mismatch errors when torch version differs from training.
                if name == "policy.optimizer.pth":
                    continue
                file_path = os.path.join(root, name)
                arcname = os.path.relpath(file_path, model_path)
                zf.write(file_path, arcname=arcname)
    return zip_path, temp_dir

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
    rl_agent = algorithms[algo_name].load(load_path, device="cpu")
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
