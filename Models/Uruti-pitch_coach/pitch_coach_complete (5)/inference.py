import torch
import torch.nn as nn
import numpy as np
import os
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

    # SB3 saves as a directory (folder of .pth files) — pass the folder path directly.
    model_path = os.path.join(base_path, "models", "best_model")

    algorithms = {"DQN": DQN, "PPO": PPO, "A2C": A2C, "TRPO": TRPO}
    rl_agent = algorithms[algo_name].load(model_path, device="cpu")

    return reward_model, rl_agent

def compute_score(reward_model, features):
    with torch.no_grad():
        tensor_feat = torch.FloatTensor(features).unsqueeze(0)
        score = reward_model(tensor_feat).item()
    return round(score, 2)

def predict_action(rl_agent, state_vector):
    action, _ = rl_agent.predict(np.array(state_vector, dtype=np.float32), deterministic=True)
    return int(action)
