import argparse
import json
import os
import importlib.util
from datetime import datetime
import gymnasium as gym
from stable_baselines3 import DQN, PPO, A2C
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.callbacks import BaseCallback

from envs.pitch_env import PitchCoachEnv
from data_sources import parse_video_source, resolve_default_meld_video_source

class MetricsLogger(BaseCallback):
    def __init__(self, save_path, verbose=0):
        super().__init__(verbose)
        self.save_path = save_path
        self.data = {'episode_rewards': [], 'episode_lengths': [], 'timesteps': []}

    def _on_step(self):
        if 'episode' in self.locals['infos'][0]:
            ep_info = self.locals['infos'][0]['episode']
            self.data['episode_rewards'].append(ep_info['r'])
            self.data['episode_lengths'].append(ep_info['l'])
            self.data['timesteps'].append(self.num_timesteps)
        return True

    def _on_training_end(self):
        with open(os.path.join(self.save_path, 'training_metrics.json'), 'w') as f:
            json.dump(self.data, f, indent=2)

def create_env(
    env_type,
    video_source=None,
    render_mode=None,
    max_videos_per_category=100,
    max_videos_total=0,
):
    if env_type == 'sim':
        return PitchCoachEnv(render_mode=render_mode)
    elif env_type == 'video':
        from envs.video_pitch_env import VideoPitchEnv
        if video_source is None:
            video_source = resolve_default_meld_video_source(__file__)
            if video_source is None:
                raise ValueError(
                    "No MELD video dataset found. Provide --video_source with a real video file or folder in MELD.Raw."
                )
        return VideoPitchEnv(
            video_source=video_source,
            render_mode=render_mode,
            max_videos_per_category=max_videos_per_category,
            max_videos_total=max_videos_total,
        )
    else:
        raise ValueError(f"Unknown env_type: {env_type}")

def load_config(config_path, algorithm):
    with open(config_path, 'r') as f:
        config = json.load(f)
    # If config is flat, return as is; if nested under algorithm key, extract.
    if algorithm in config:
        return config[algorithm]
    return config

def train(args):
    # Create environment
    env = create_env(
        args.env_type,
        video_source=parse_video_source(args.video_source),
        max_videos_per_category=args.max_videos_per_category,
        max_videos_total=args.max_videos_total,
    )

    if args.env_type == 'video' and hasattr(env, 'category_video_counts'):
        print(f"[Startup] Selected MELD video counts: {env.category_video_counts}")

    env = Monitor(env, args.logdir)

    # Load hyperparameters
    algo_config = load_config(args.config, args.algorithm).copy()
    total_timesteps = int(algo_config.pop('total_timesteps', 50000))
    tensorboard_logdir = args.logdir if importlib.util.find_spec('tensorboard') else None
    if tensorboard_logdir is None:
        print("[Startup] TensorBoard not installed; continuing without tensorboard logging.")

    # Setup model
    if args.algorithm == 'dqn':
        model = DQN('MlpPolicy', env, verbose=1, tensorboard_log=tensorboard_logdir, **algo_config)
    elif args.algorithm == 'ppo':
        model = PPO('MlpPolicy', env, verbose=1, tensorboard_log=tensorboard_logdir, **algo_config)
    elif args.algorithm == 'a2c':
        model = A2C('MlpPolicy', env, verbose=1, tensorboard_log=tensorboard_logdir, **algo_config)
    elif args.algorithm == 'reinforce':
        # Use PPO as proxy for REINFORCE (or implement custom)
        model = PPO('MlpPolicy', env, verbose=1, tensorboard_log=tensorboard_logdir, **algo_config)
    else:
        raise ValueError(f"Unsupported algorithm: {args.algorithm}")

    # Train
    logger = MetricsLogger(args.logdir)
    model.learn(total_timesteps=total_timesteps,
                callback=logger)
    model.save(os.path.join(args.logdir, f"{args.algorithm}_model"))
    env.close()
    print(f"Training complete. Model saved in {args.logdir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--algorithm', type=str, required=True,
                        choices=['dqn', 'ppo', 'a2c', 'reinforce'])
    parser.add_argument('--config', type=str, required=True,
                        help='Path to JSON config file')
    parser.add_argument('--env_type', type=str, default='sim',
                        choices=['sim', 'video'],
                        help='Environment type: sim (simulated) or video')
    parser.add_argument('--video_source', type=str, default=None,
                        help='Video file path or camera index (0,1,...) or folder path')
    parser.add_argument('--max_videos_per_category', type=int, default=100,
                        help='Maximum videos to load per MELD category (output/test/train) when using MELD.Raw root')
    parser.add_argument('--max_videos_total', type=int, default=0,
                        help='Maximum videos to load from a non-MELD-root video folder (0 disables cap)')
    parser.add_argument('--logdir', type=str, default='./runs',
                        help='Directory to save logs and models')
    args = parser.parse_args()

    # Create unique run directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_name = f"{args.algorithm}_{args.env_type}_{timestamp}"
    args.logdir = os.path.join(args.logdir, run_name)
    os.makedirs(args.logdir, exist_ok=True)

    # Save a copy of the config
    with open(args.config, 'r') as f_src:
        with open(os.path.join(args.logdir, 'config.json'), 'w') as f_dst:
            f_dst.write(f_src.read())

    train(args)