#!/usr/bin/env python3
"""
Static and random action demonstration for the RL environments.
Shows untrained agent behavior to demonstrate environment structure and validity.
Generates both text and visual output.
"""

import sys
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from envs.pitch_env import PitchCoachEnv
from envs.video_pitch_env import VideoPitchEnv

class EnvironmentDemo:
    """Demonstrates untrained agent behavior in environments."""
    
    def __init__(self, env_name: str = 'sim'):
        """
        Initialize demo environment.
        
        Args:
            env_name: 'sim' for PitchCoachEnv, 'video' for VideoPitchEnv
        """
        if env_name == 'sim':
            self.env = PitchCoachEnv()
            self.env_name = 'Simulated Pitch Coach'
        elif env_name == 'video':
            video_root = Path(__file__).parent.parent / 'Data' / 'MELD.Raw'
            self.env = VideoPitchEnv(video_root=video_root, enable_rendering=False)
            self.env_name = 'Video-Based Pitch Coach'
        else:
            raise ValueError(f"Unknown environment: {env_name}")
    
    def print_environment_info(self):
        """Print environment structure and specifications."""
        print("\n" + "=" * 80)
        print(f"ENVIRONMENT: {self.env_name}")
        print("=" * 80)
        
        env = self.env
        
        # Observation space
        print(f"\nOBSERVATION SPACE:")
        if hasattr(env.observation_space, 'shape'):
            print(f"  Type: {type(env.observation_space).__name__}")
            print(f"  Shape: {env.observation_space.shape}")
            if hasattr(env.observation_space, 'dtype'):
                print(f"  Dtype: {env.observation_space.dtype}")
            if hasattr(env.observation_space, 'low') and hasattr(env.observation_space, 'high'):
                print(f"  Range: [{env.observation_space.low.min():.2f}, {env.observation_space.high.max():.2f}]")
        
        # Action space
        print(f"\nACTION SPACE:")
        if hasattr(env.action_space, 'n'):
            print(f"  Type: Discrete")
            print(f"  Number of Actions: {env.action_space.n}")
            print(f"  Action Meanings:")
            if isinstance(env, PitchCoachEnv):
                action_names = [
                    "Move Forward",
                    "Move Backward",
                    "Move Left", 
                    "Move Right",
                    "Turn Left",
                    "Turn Right",
                    "Pitch (Action 6)",
                    "Pitch (Action 7)",
                    "Pitch (Action 8)",
                    "Pitch (Action 9)",
                    "Pitch (Action 10)"
                ]
                for i, name in enumerate(action_names):
                    print(f"    {i}: {name}")
            else:
                for i in range(env.action_space.n):
                    print(f"    {i}: Action {i}")
        
        # Episode info
        print(f"\nEPISODE CONFIG:")
        if hasattr(env, 'max_steps'):
            print(f"  Max Steps: {env.max_steps}")
        if hasattr(env, 'reward_range'):
            print(f"  Reward Range: {env.reward_range}")
        
        # Environment-specific info
        if isinstance(env, PitchCoachEnv):
            print(f"\nPITCH COACH (SIMULATED) SPECIFICS:")
            print(f"  Goal: Move agent close to target position")
            print(f"  Reward: Based on distance to target and pose confidence")
            print(f"  Action Space: 11 discrete movements (forward, backward, left, right, turn, pose adjustments)")
            print(f"  State Dimensions: Position (2D), velocity (2D), orientation (1), pose angles (21), target position (2) = 27 dimensions")
        elif isinstance(env, VideoPitchEnv):
            print(f"\nVIDEO PITCH (MELD) SPECIFICS:")
            print(f"  Goal: Imitate instructor pose from video")
            print(f"  Reward: Based on similarity to instructor's pose landmarks")
            print(f"  Action Space: 11 discrete 3D movements in video frame")
            print(f"  State: MediaPipe holistic landmarks (pose, hand, face) - ~500+ dimensional")
            print(f"  Data Source: MELD (Multi-modal Emotion Dataset)")
    
    def run_random_episode(self, num_steps: int = None, max_steps: int = 300, 
                          verbose: bool = True) -> Dict:
        """
        Run single episode with random actions (no training).
        
        Args:
            num_steps: Exact number of steps to run (overrides max_steps)
            max_steps: Maximum steps in episode
            verbose: Print step-by-step information
        
        Returns:
            Episode statistics dictionary
        """
        observation, info = self.env.reset()
        
        episode_data = {
            'steps': [],
            'total_reward': 0.0,
            'rewards': [],
            'actions': [],
            'is_terminal': False,
            'termination_reason': None
        }
        
        step = 0
        target_steps = num_steps if num_steps is not None else max_steps
        
        if verbose:
            print(f"\nRunning {target_steps} random action steps...")
            print("-" * 80)
            print(f"{'Step':>6} {'Action':>8} {'Reward':>10} {'Obs Min':>10} {'Obs Max':>10} {'Obs Mean':>10}")
            print("-" * 80)
        
        while step < target_steps:
            # Random action
            action = self.env.action_space.sample()
            
            # Step environment
            observation, reward, terminated, truncated, info = self.env.step(action)
            done = terminated or truncated
            
            episode_data['steps'].append(step)
            episode_data['actions'].append(action)
            episode_data['rewards'].append(float(reward))
            episode_data['total_reward'] += reward
            
            if verbose and (step % max(1, target_steps // 10) == 0 or step < 5):
                obs_min = np.min(observation)
                obs_max = np.max(observation)
                obs_mean = np.mean(observation)
                print(f"{step:6d} {action:8d} {reward:10.4f} {obs_min:10.4f} {obs_max:10.4f} {obs_mean:10.4f}")
            
            step += 1
            
            if done:
                episode_data['is_terminal'] = True
                episode_data['termination_reason'] = "Episode terminated"
                if verbose:
                    print(f"\n✓ Episode terminated after {step} steps")
                break
        
        if verbose:
            print("-" * 80)
            print(f"\nEpisode Summary:")
            print(f"  Total Steps: {step}")
            print(f"  Total Reward: {episode_data['total_reward']:.4f}")
            print(f"  Mean Step Reward: {np.mean(episode_data['rewards']):.4f}")
            print(f"  Min Reward: {np.min(episode_data['rewards']):.4f}")
            print(f"  Max Reward: {np.max(episode_data['rewards']):.4f}")
            print(f"  Std Dev: {np.std(episode_data['rewards']):.4f}")
        
        return episode_data
    
    def run_multiple_episodes(self, num_episodes: int = 5, 
                             steps_per_episode: int = 300) -> Dict:
        """
        Run multiple random episodes and collect statistics.
        
        Args:
            num_episodes: Number of episodes to run
            steps_per_episode: Steps per episode
        
        Returns:
            Aggregated statistics
        """
        print(f"\n{'='*80}")
        print(f"RUNNING {num_episodes} RANDOM EPISODES ({steps_per_episode} steps each)")
        print(f"{'='*80}")
        
        all_rewards = []
        all_step_counts = []
        
        for ep in range(num_episodes):
            print(f"\n[Episode {ep + 1}/{num_episodes}]")
            episode_data = self.run_random_episode(
                num_steps=steps_per_episode,
                verbose=False
            )
            
            all_rewards.append(episode_data['total_reward'])
            all_step_counts.append(len(episode_data['steps']))
            
            print(f"  Total Reward: {episode_data['total_reward']:.4f}")
            print(f"  Steps Completed: {len(episode_data['steps'])}")
            print(f"  Mean Step Reward: {np.mean(episode_data['rewards']):.4f}")
            print(f"  Action Distribution: {dict(zip(*np.unique(episode_data['actions'], return_counts=True)))}")
        
        # Aggregate statistics
        stats = {
            'num_episodes': num_episodes,
            'steps_per_episode': steps_per_episode,
            'all_rewards': all_rewards,
            'all_step_counts': all_step_counts,
            'mean_episode_reward': float(np.mean(all_rewards)),
            'std_episode_reward': float(np.std(all_rewards)),
            'min_episode_reward': float(np.min(all_rewards)),
            'max_episode_reward': float(np.max(all_rewards)),
            'mean_steps_per_episode': float(np.mean(all_step_counts)),
        }
        
        print(f"\n{'='*80}")
        print(f"AGGREGATE STATISTICS (Random Agent)")
        print(f"{'='*80}")
        print(f"  Mean Episode Reward: {stats['mean_episode_reward']:.4f}")
        print(f"  Std Dev: {stats['std_episode_reward']:.4f}")
        print(f"  Min Episode Reward: {stats['min_episode_reward']:.4f}")
        print(f"  Max Episode Reward: {stats['max_episode_reward']:.4f}")
        print(f"  Mean Steps per Episode: {stats['mean_steps_per_episode']:.2f}")
        print(f"{'='*80}\n")
        
        return stats

def main():
    """Entry point for environment demo."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Demonstrate RL environments with random (untrained) agent"
    )
    parser.add_argument(
        '--env',
        choices=['sim', 'video'],
        default='sim',
        help='Environment type to demonstrate'
    )
    parser.add_argument(
        '--episodes',
        type=int,
        default=5,
        help='Number of episodes to run'
    )
    parser.add_argument(
        '--steps',
        type=int,
        default=300,
        help='Steps per episode'
    )
    parser.add_argument(
        '--single',
        action='store_true',
        help='Run single detailed episode instead of aggregate'
    )
    
    args = parser.parse_args()
    
    # Create demo
    demo = EnvironmentDemo(env_name=args.env)
    
    # Print environment info
    demo.print_environment_info()
    
    # Run episodes
    if args.single:
        demo.run_random_episode(num_steps=args.steps, verbose=True)
    else:
        demo.run_multiple_episodes(num_episodes=args.episodes, 
                                   steps_per_episode=args.steps)

if __name__ == '__main__':
    main()
