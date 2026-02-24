import gymnasium as gym
import numpy as np
import torch
import argparse
import json
import os
from datetime import datetime
from stable_baselines3 import DQN, PPO, A2C
from stable_baselines3.common.vec_env import DummyVecEnv
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.callbacks import BaseCallback
from environment.pitch_env import PitchCoachEnv
from utils.visualization import PitchVisualizer

class ExperimentLogger(BaseCallback):
    def __init__(self, save_path, verbose=0):
        super(ExperimentLogger, self).__init__(verbose)
        self.save_path = save_path
        self.experiment_data = {
            'episode_rewards': [],
            'episode_lengths': [],
            'training_loss': [],
            'timesteps': []
        }
        
    def _on_step(self) -> bool:
        if 'episode' in self.locals['infos'][0]:
            episode_info = self.locals['infos'][0]['episode']
            self.experiment_data['episode_rewards'].append(episode_info['r'])
            self.experiment_data['episode_lengths'].append(episode_info['l'])
            self.experiment_data['timesteps'].append(self.num_timesteps)
            
        return True
    
    def _on_training_end(self):
        # Save experiment data
        with open(os.path.join(self.save_path, 'training_metrics.json'), 'w') as f:
            json.dump(self.experiment_data, f)

def get_nested_config(config, algorithm):
    """Extract config for specific algorithm, handling nested structure"""
    if algorithm in config:
        # Nested structure: config = {'dqn': {...}, 'ppo': {...}}
        return config[algorithm]
    else:
        # Flat structure: config = {'learning_rate': 0.001, ...}
        return config

def train_dqn(env, experiment_dir, config):
    """Train DQN model with hyperparameters"""
    # Extract DQN-specific config
    dqn_config = get_nested_config(config, 'dqn')
    
    model = DQN(
        'MlpPolicy',
        env,
        learning_rate=dqn_config['learning_rate'],
        gamma=dqn_config['gamma'],
        buffer_size=dqn_config['buffer_size'],
        batch_size=dqn_config['batch_size'],
        exploration_fraction=dqn_config['exploration_fraction'],
        exploration_final_eps=dqn_config['exploration_final_eps'],
        tensorboard_log=experiment_dir,
        verbose=1
    )
    
    logger = ExperimentLogger(experiment_dir)
    model.learn(
        total_timesteps=dqn_config['total_timesteps'],
        callback=logger,
        tb_log_name="DQN"
    )
    
    model.save(os.path.join(experiment_dir, "dqn_model"))
    return model

def train_ppo(env, experiment_dir, config):
    """Train PPO model with hyperparameters"""
    # Extract PPO-specific config
    ppo_config = get_nested_config(config, 'ppo')
    
    model = PPO(
        'MlpPolicy',
        env,
        learning_rate=ppo_config['learning_rate'],
        gamma=ppo_config['gamma'],
        n_steps=ppo_config['n_steps'],
        ent_coef=ppo_config['ent_coef'],
        tensorboard_log=experiment_dir,
        verbose=1
    )
    
    logger = ExperimentLogger(experiment_dir)
    model.learn(
        total_timesteps=ppo_config['total_timesteps'],
        callback=logger,
        tb_log_name="PPO"
    )
    
    model.save(os.path.join(experiment_dir, "ppo_model"))
    return model

def train_reinforce(env, experiment_dir, config):
    """Train REINFORCE model with hyperparameters"""
    # Extract REINFORCE-specific config
    reinforce_config = get_nested_config(config, 'reinforce')
    
    model = PPO(  # Using PPO as REINFORCE implementation
        'MlpPolicy',
        env,
        learning_rate=reinforce_config['learning_rate'],
        gamma=reinforce_config['gamma'],
        n_steps=reinforce_config.get('n_steps', 2048),
        batch_size=reinforce_config.get('batch_size', 64),
        ent_coef=reinforce_config.get('ent_coef', 0.01),
        tensorboard_log=experiment_dir,
        verbose=1
    )
    
    logger = ExperimentLogger(experiment_dir)
    model.learn(
        total_timesteps=reinforce_config['total_timesteps'],
        callback=logger,
        tb_log_name="REINFORCE"
    )
    
    model.save(os.path.join(experiment_dir, "reinforce_model"))
    return model

def train_a2c(env, experiment_dir, config):
    """Train A2C model with hyperparameters"""
    # Extract A2C-specific config
    a2c_config = get_nested_config(config, 'a2c')
    
    model = A2C(
        'MlpPolicy',
        env,
        learning_rate=a2c_config['learning_rate'],
        gamma=a2c_config['gamma'],
        n_steps=a2c_config['n_steps'],
        ent_coef=a2c_config['ent_coef'],
        tensorboard_log=experiment_dir,
        verbose=1
    )
    
    logger = ExperimentLogger(experiment_dir)
    model.learn(
        total_timesteps=a2c_config['total_timesteps'],
        callback=logger,
        tb_log_name="A2C"
    )
    
    model.save(os.path.join(experiment_dir, "a2c_model"))
    return model

def main():
    parser = argparse.ArgumentParser(description='Train RL models for Pitch Coach')
    parser.add_argument('--algorithm', type=str, required=True, 
                       choices=['dqn', 'ppo', 'a2c', 'reinforce', 'all'],
                       help='RL algorithm to train')
    parser.add_argument('--config', type=str, required=True,
                       help='Path to training configuration JSON file')
    parser.add_argument('--env', type=str, default='environment.custom_env:PitchCoachEnv',
                       help='Environment ID (default: environment.custom_env:PitchCoachEnv)')
    parser.add_argument('--base_logdir', type=str, default='./runs',
                       help='Base directory for logging (default: ./runs)')
    
    args = parser.parse_args()
    
    # Load training configuration
    with open(args.config, 'r') as f:
        config = json.load(f)
    
    # Create experiment directory using base_logdir
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    experiment_dir = os.path.join(args.base_logdir, f"{args.algorithm}_{timestamp}")
    os.makedirs(experiment_dir, exist_ok=True)
    
    # Save configuration
    with open(os.path.join(experiment_dir, 'config.json'), 'w') as f:
        json.dump(config, f, indent=2)
    
    # Create environment
    try:
        # Try to create using gymnasium if it's a registered env
        env = gym.make(args.env)
    except:
        # Fall back to custom environment
        env = PitchCoachEnv()
    
    env = Monitor(env, experiment_dir)
    
    print(f"Starting training with {args.algorithm} algorithm...")
    print(f"Experiment directory: {experiment_dir}")
    print(f"Environment: {args.env}")
    print(f"Config structure: {list(config.keys())}")
    
    # Train selected algorithm
    if args.algorithm == 'dqn' or args.algorithm == 'all':
        print("Training DQN...")
        train_dqn(env, experiment_dir, config)
    
    if args.algorithm == 'ppo' or args.algorithm == 'all':
        print("Training PPO...")
        train_ppo(env, experiment_dir, config)
    
    if args.algorithm == 'reinforce' or args.algorithm == 'all':
        print("Training REINFORCE...")
        train_reinforce(env, experiment_dir, config)
    
    if args.algorithm == 'a2c' or args.algorithm == 'all':
        print("Training A2C...")
        train_a2c(env, experiment_dir, config)
    
    env.close()
    print("Training completed!")

if __name__ == "__main__":
    main()