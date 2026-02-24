"""
REINFORCE trainer (PyTorch) with TensorBoard logging.

"""
import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from torch.utils.tensorboard import SummaryWriter

class PolicyNet(nn.Module):
    def __init__(self, obs_size, n_actions, hidden=(64,32)):
        super().__init__()
        layers = []
        last = obs_size
        for h in hidden:
            layers.append(nn.Linear(last, h))
            layers.append(nn.ReLU())
            last = h
        layers.append(nn.Linear(last, n_actions))
        self.net = nn.Sequential(*layers)

    def forward(self, x):
        return torch.softmax(self.net(x), dim=-1)

class REINFORCETrainer:
    def __init__(self, env_ctor, logdir, config):
        """
        env_ctor: callable that returns an env (e.g. lambda: PitchCoachEnv(render_mode='rgb_array'))
        logdir: directory to save model and logs
        config: dict with hyperparams (learning_rate, gamma, batch_size, total_episodes)
        """
        self.env_ctor = env_ctor
        self.logdir = os.path.abspath(logdir)
        os.makedirs(self.logdir, exist_ok=True)
        self.config = config
        self.writer = SummaryWriter(log_dir=os.path.join(self.logdir, 'tb'))
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    def train(self):
        env = self.env_ctor()
        obs_size = env.observation_space.shape[0]
        n_actions = env.action_space.n

        net = PolicyNet(obs_size, n_actions).to(self.device)
        optimizer = optim.Adam(net.parameters(), lr=float(self.config.get('learning_rate', 3e-4)))
        gamma = float(self.config.get('gamma', 0.99))
        total_episodes = int(self.config.get('total_episodes', 200))
        batch_size = int(self.config.get('batch_size', 10))

        episode = 0
        all_episode_rewards = []

        while episode < total_episodes:
            batch = []
            for _ in range(batch_size):
                obs, _ = env.reset()
                done = False
                traj = []
                ep_reward = 0.0
                while not done:
                    obs_v = torch.tensor(obs, dtype=torch.float32).unsqueeze(0).to(self.device)
                    probs = net(obs_v).detach().cpu().numpy()[0]
                    action = np.random.choice(len(probs), p=probs)
                    next_obs, reward, terminated, truncated, info = env.step(action)
                    traj.append((obs, action, reward))
                    obs = next_obs
                    done = bool(terminated or truncated)
                    ep_reward += reward
                batch.append(traj)
                episode += 1
                all_episode_rewards.append(ep_reward)
                # TensorBoard scalar
                self.writer.add_scalar('episode/reward', ep_reward, episode)

            # compute policy gradient loss
            losses = []
            for traj in batch:
                returns = []
                G = 0.0
                for _, _, r in reversed(traj):
                    G = r + gamma * G
                    returns.insert(0, G)
                returns = torch.tensor(returns, dtype=torch.float32).to(self.device)
                returns = (returns - returns.mean()) / (returns.std() + 1e-8)
                for (obs, action, _), Gt in zip(traj, returns):
                    obs_v = torch.tensor(obs, dtype=torch.float32).unsqueeze(0).to(self.device)
                    probs = net(obs_v)
                    logp = torch.log(probs[0, action] + 1e-8)
                    losses.append(-logp * Gt)

            optimizer.zero_grad()
            loss = torch.stack(losses).sum()
            loss.backward()
            optimizer.step()

            # Log loss and moving avg reward
            self.writer.add_scalar('train/loss', loss.item(), episode)
            if len(all_episode_rewards) >= 10:
                mov_avg = float(np.mean(all_episode_rewards[-10:]))
                self.writer.add_scalar('train/moving_avg_reward_10', mov_avg, episode)

            # Save intermediate policy periodically
            if episode % max(1, int(total_episodes/10)) == 0:
                model_path = os.path.join(self.logdir, f'policy_episode_{episode}.pt')
                torch.save(net.state_dict(), model_path)
                print(f"[REINFORCE] Saved policy checkpoint: {model_path}")

        # final save
        final_model = os.path.join(self.logdir, 'policy_final.pt')
        torch.save(net.state_dict(), final_model)
        env.close()
        self.writer.close()
        # write config and summary
        with open(os.path.join(self.logdir, 'config_used.json'), 'w') as fh:
            json.dump(self.config, fh, indent=2)
        summary = {'episodes_trained': total_episodes, 'mean_reward': float(np.mean(all_episode_rewards) if all_episode_rewards else 0.0)}
        with open(os.path.join(self.logdir, 'summary.json'), 'w') as fh:
            json.dump(summary, fh, indent=2)
        print(f"[REINFORCE] Training complete. Model saved to {final_model}")
        return final_model
