#!/usr/bin/env python3
"""
Enhanced Training Script - Presentation Environment Support
Train RL agents with slide-based presentation environment
"""

import json
import argparse
import importlib.util
import os
import sys
from pathlib import Path
from typing import Optional, Dict, Any

# Disable cv2 import by default in this script (prevents SDL symbol collisions with pygame on macOS).
# Set URUTI_DISABLE_CV2=0 to re-enable cv2 imports if needed.
if os.environ.get('URUTI_DISABLE_CV2', '1') == '1':
    sys.modules.setdefault('cv2', None)

import gymnasium as gym
import numpy as np
from stable_baselines3 import DQN, PPO, A2C
from stable_baselines3.common.callbacks import EvalCallback, StopTrainingOnRewardThreshold
from stable_baselines3.common.env_util import make_vec_env

from envs.presentation_pitch_env import PresentationPitchEnv
from envs.pitch_env import PitchEnv


def create_env(
    env_type: str = 'presentation',
    total_slides: int = 10,
    slides_dir: Optional[str] = None,
    **kwargs
) -> gym.Env:
    """
    Create environment based on type.
    
    Args:
        env_type: 'presentation' or 'simulation'
        total_slides: Number of slides
        slides_dir: Directory with slide images
        **kwargs: Additional environment arguments
        
    Returns:
        Gymnasium environment
    """
    if env_type == 'founder':
        from envs import PitchCoachFounderEnv
        return PitchCoachFounderEnv(
            render_mode=None,
            total_slides=total_slides,
            slide_images_dir=slides_dir,
            venture_name="Startup Demo",
            pitch_type="Investor Pitch",
            target_duration_min=5,
            **kwargs
        )
    elif env_type == 'presentation':
        return PresentationPitchEnv(
            render_mode=None,
            total_slides=total_slides,
            slide_images_dir=slides_dir,
            **kwargs
        )
    elif env_type == 'simulation':
        return PitchEnv(
            render_mode=None,
            total_slides=total_slides,
            **kwargs
        )
    else:
        raise ValueError(f"Unknown environment type: {env_type}")


def train_on_presentation(
    algorithm_name: str,
    env_type: str = 'founder',
    total_timesteps: int = 100000,
    total_slides: int = 10,
    slides_dir: Optional[str] = None,
    config_path: Optional[str] = None,
    seed: int = 42,
    eval_episodes: int = 10,
    log_dir: Optional[str] = None,
):
    """
    Train an RL agent on presentation environment.
    
    Args:
        algorithm_name: Algorithm to use ('dqn', 'ppo', 'a2c')
        env_type: Environment type ('presentation' or 'simulation')
        total_timesteps: Total timesteps to train
        total_slides: Number of slides in presentation
        slides_dir: Directory with slide images
        config_path: Path to hyperparameter config JSON
        seed: Random seed
        eval_episodes: Number of evaluation episodes
        log_dir: Directory for logs and models
    """
    
    # Setup directories
    if log_dir is None:
        log_dir = Path('models')
    else:
        log_dir = Path(log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)
    
    # Load hyperparameters if provided
    hyperparams = {}
    if config_path and Path(config_path).exists():
        with open(config_path, 'r') as f:
            hyperparams = json.load(f)
        print(f"Loaded hyperparameters from {config_path}")
    
    print(f"\n{'='*60}")
    print(f"Training {algorithm_name.upper()} on {env_type.upper()} Environment")
    print(f"{'='*60}")
    print(f"Environment: {env_type}")
    print(f"Total Slides: {total_slides}")
    print(f"Total Timesteps: {total_timesteps}")
    print(f"Random Seed: {seed}")
    print(f"{'='*60}\n")
    
    # Create environment
    env = gym.wrappers.TimeLimit(
        create_env(env_type, total_slides, slides_dir),
        max_episode_steps=300,
    )
    env.reset(seed=seed)
    
    # Create eval environment
    eval_env = gym.wrappers.TimeLimit(
        create_env(env_type, total_slides, slides_dir),
        max_episode_steps=300,
    )
    
    # Create model
    model_class = {'dqn': DQN, 'ppo': PPO, 'a2c': A2C}[algorithm_name.lower()]
    
    # Prepare model kwargs
    model_kwargs = {
        'seed': seed,
        'verbose': 1,
    }

    if importlib.util.find_spec('tensorboard') is not None:
        model_kwargs['tensorboard_log'] = str(log_dir / 'logs')
    else:
        print("TensorBoard not installed; continuing without tensorboard logging.")
    
    # Add hyperparameters if available
    if hyperparams:
        # Remove entries that aren't model parameters
        model_kwargs.update({
            k: v for k, v in hyperparams.items()
            if k not in ['name', 'description', 'rationale', 'learning_rate']
        })
        if 'learning_rate' in hyperparams:
            model_kwargs['learning_rate'] = hyperparams['learning_rate']
    
    model = model_class(
        policy='MlpPolicy',
        env=env,
        **model_kwargs
    )
    
    print(f"Model created with configuration:")
    print(json.dumps(model_kwargs, indent=2, default=str))
    print()
    
    # Callbacks
    eval_callback = EvalCallback(
        eval_env,
        n_eval_episodes=eval_episodes,
        eval_freq=max(total_timesteps // 10, 1000),
        log_path=str(log_dir / 'eval_logs'),
        best_model_save_path=str(log_dir / 'best_models'),
        deterministic=True,
        render=False,
    )
    
    # Train
    print("Starting training...")
    has_progress_bar_deps = (
        importlib.util.find_spec('tqdm') is not None and
        importlib.util.find_spec('rich') is not None
    )
    if not has_progress_bar_deps:
        print("tqdm/rich not installed; continuing without progress bar.")

    try:
        model.learn(
            total_timesteps=total_timesteps,
            log_interval=10,
            callback=eval_callback,
            progress_bar=has_progress_bar_deps,
        )
    except KeyboardInterrupt:
        print("\nTraining interrupted by user")
    finally:
        # Save final model
        model_filename = f"{algorithm_name}_{env_type}_slides{total_slides}"
        model_path = log_dir / model_filename
        model.save(str(model_path))
        print(f"\nModel saved to {model_path}")
        
        # Save training config
        config_data = {
            'algorithm': algorithm_name,
            'environment': env_type,
            'total_slides': total_slides,
            'total_timesteps': total_timesteps,
            'seed': seed,
            'hyperparameters': hyperparams,
        }
        config_filename = f"{model_filename}_config.json"
        config_file = log_dir / config_filename
        with open(config_file, 'w') as f:
            json.dump(config_data, f, indent=2)
        print(f"Config saved to {config_file}")
        
        env.close()
        eval_env.close()
    
    return model_path, config_file


def main():
    parser = argparse.ArgumentParser(
        description='Train RL agents on presentation environment'
    )
    parser.add_argument(
        '--algorithm', type=str, choices=['dqn', 'ppo', 'a2c'], required=True,
        help='Algorithm to train'
    )
    parser.add_argument(
        '--env_type', type=str, choices=['founder', 'presentation', 'simulation'], default='founder',
        help='Environment type (founder=Pitch Coach UI, presentation=slides, simulation=basic)'
    )
    parser.add_argument(
        '--timesteps', type=int, default=100000,
        help='Total training timesteps'
    )
    parser.add_argument(
        '--slides', type=int, default=10,
        help='Number of slides'
    )
    parser.add_argument(
        '--slides_dir', type=str, default=None,
        help='Directory with slide images'
    )
    parser.add_argument(
        '--config', type=str, default=None,
        help='Path to hyperparameter config JSON'
    )
    parser.add_argument(
        '--seed', type=int, default=42,
        help='Random seed'
    )
    parser.add_argument(
        '--log_dir', type=str, default='models',
        help='Directory for logs and models'
    )
    parser.add_argument(
        '--eval_episodes', type=int, default=10,
        help='Number of evaluation episodes'
    )
    
    args = parser.parse_args()
    
    train_on_presentation(
        algorithm_name=args.algorithm,
        env_type=args.env_type,
        total_timesteps=args.timesteps,
        total_slides=args.slides,
        slides_dir=args.slides_dir,
        config_path=args.config,
        seed=args.seed,
        eval_episodes=args.eval_episodes,
        log_dir=args.log_dir,
    )


if __name__ == "__main__":
    main()
