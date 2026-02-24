#!/usr/bin/env python3
"""
Presentation-Based RL Training and Demo
Demonstrate agents trained with slide-based presentation environment
"""

import argparse
import json
from pathlib import Path
from typing import Optional

import gymnasium as gym
import numpy as np
from stable_baselines3 import DQN, PPO, A2C

from envs.presentation_pitch_env import PresentationPitchEnv
from utils.slide_manager import (
    PresentationConfig, QUICK_DEMO, STANDARD_PITCH, EXTENDED_PITCH, INVESTOR_PITCH
)


class PresentationDemoPlayer:
    """Play episode with trained presentation agent."""
    
    def __init__(
        self,
        model_path: str,
        algorithm: str,
        presentation_config: Optional[PresentationConfig] = None,
        slides_dir: Optional[str] = None,
    ):
        """
        Initialize demo player.
        
        Args:
            model_path: Path to trained model
            algorithm: Algorithm used ('dqn', 'ppo', 'a2c')
            presentation_config: Presentation configuration
            slides_dir: Directory with slide images
        """
        self.model_path = model_path
        self.algorithm = algorithm
        
        # Setup presentation config
        if presentation_config is None:
            presentation_config = STANDARD_PITCH
        self.config = presentation_config
        
        # Create environment
        self.env = PresentationPitchEnv(
            render_mode='human',
            total_slides=self.config.total_slides,
            slide_images_dir=slides_dir or (self.config.slide_manager.slides_dir if self.config.slide_manager.slides_dir else None),
        )
        
        # Load model
        print(f"Loading {algorithm.upper()} model from {model_path}")
        if algorithm == 'dqn':
            self.model = DQN.load(model_path)
        elif algorithm == 'ppo':
            self.model = PPO.load(model_path)
        elif algorithm == 'a2c':
            self.model = A2C.load(model_path)
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        print("Model loaded successfully!")
    
    def run_episode(self, deterministic: bool = True, episodes: int = 1):
        """
        Run episode(s) with trained agent.
        
        Args:
            deterministic: Whether to use deterministic policy
            episodes: Number of episodes to run
        """
        for ep in range(episodes):
            print(f"\n{'='*60}")
            print(f"Episode {ep + 1}/{episodes}")
            print(f"{'='*60}")
            print(f"Presentation: {self.config.total_slides} slides, {self.config.total_duration}s duration")
            print(f"Model: {self.algorithm.upper()} (deterministic={deterministic})")
            
            obs, info = self.env.reset()
            done = False
            total_reward = 0.0
            step_count = 0
            slides_completed = 0
            
            print("\nStarting presentation...\n")
            
            while not done:
                # Get action from model
                action, _states = self.model.predict(obs, deterministic=deterministic)
                
                # Step environment
                result = self.env.step(action)
                obs, reward, terminated, truncated, info = result
                done = terminated or truncated
                total_reward += reward
                step_count += 1
                
                # Track slide progression
                current_slide = info['current_metrics']['current_slide']
                if current_slide > slides_completed:
                    slides_completed = current_slide
                
                # Render
                self.env.render()
                
                # Print status
                if step_count % 5 == 0 or done:
                    metrics = info['current_metrics']
                    print(
                        f"Step {step_count:3d} | Slide {metrics['current_slide']+1}/{metrics['total_slides']} | "
                        f"Conf: {metrics['confidence']:.2f} | Eng: {metrics['engagement']:.2f} | "
                        f"Clarity: {metrics['clarity']:.2f} | Reward: {reward:+.3f} | Total: {total_reward:+.2f}"
                    )
                
                # Check for quit signal
                try:
                    import pygame
                    for event in pygame.event.get():
                        if event.type == pygame.QUIT:
                            done = True
                        elif event.type == pygame.KEYDOWN:
                            if event.key in (pygame.K_q, pygame.K_ESCAPE):
                                done = True
                except:
                    pass
            
            print(f"\n{'='*60}")
            print("EPISODE SUMMARY")
            print(f"{'='*60}")
            print(f"Total steps: {step_count}")
            print(f"Total reward: {total_reward:.2f}")
            print(f"Slides completed: {slides_completed + 1}/{self.config.total_slides}")
            print(f"Average reward per step: {total_reward / max(1, step_count):.3f}")
            print(f"{'='*60}\n")
        
        self.env.close()


def main():
    parser = argparse.ArgumentParser(
        description='Presentation Coach RL Demo - Slide Navigation'
    )
    parser.add_argument(
        '--model_path', type=str, required=True,
        help='Path to trained model'
    )
    parser.add_argument(
        '--algorithm', type=str, choices=['dqn', 'ppo', 'a2c'], required=True,
        help='Algorithm used for training'
    )
    parser.add_argument(
        '--presentation', type=str, choices=['quick', 'standard', 'extended', 'investor'],
        default='standard',
        help='Presentation type'
    )
    parser.add_argument(
        '--slides_dir', type=str, default=None,
        help='Directory with slide images'
    )
    parser.add_argument(
        '--episodes', type=int, default=1,
        help='Number of episodes to run'
    )
    parser.add_argument(
        '--deterministic', action='store_true',
        help='Use deterministic policy (default: stochastic)'
    )
    
    args = parser.parse_args()
    
    # Verify model exists
    if not Path(args.model_path).exists():
        print(f"Error: Model file {args.model_path} not found!")
        return
    
    # Select presentation config
    configs = {
        'quick': QUICK_DEMO,
        'standard': STANDARD_PITCH,
        'extended': EXTENDED_PITCH,
        'investor': INVESTOR_PITCH,
    }
    config = configs.get(args.presentation, STANDARD_PITCH)
    
    print("\n" + "="*60)
    print("PRESENTATION COACH - RL AGENT DEMO")
    print("="*60)
    print(f"Algorithm: {args.algorithm.upper()}")
    print(f"Presentation: {args.presentation.upper()}")
    print(f"Total Slides: {config.total_slides}")
    print(f"Total Duration: {config.total_duration}s")
    print(f"Episodes: {args.episodes}")
    print("="*60 + "\n")
    
    # Create and run demo
    demo = PresentationDemoPlayer(
        model_path=args.model_path,
        algorithm=args.algorithm,
        presentation_config=config,
        slides_dir=args.slides_dir,
    )
    
    demo.run_episode(
        deterministic=args.deterministic,
        episodes=args.episodes,
    )


if __name__ == "__main__":
    main()
