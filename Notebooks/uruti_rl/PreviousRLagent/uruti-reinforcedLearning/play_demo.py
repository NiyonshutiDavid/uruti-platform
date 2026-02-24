"""
Demo script for Pitch Coach RL Agent
This script demonstrates the trained agent interacting with the pitch environment
"""
import pygame
import cv2
import numpy as np
import argparse
import os
from datetime import datetime
from stable_baselines3 import DQN, PPO, A2C

# Import your custom environment
from environment.pitch_env import PitchCoachEnv

class PitchCoachDemo:
    def __init__(self, model_path, algorithm, render_mode='human'):
        self.model_path = model_path
        self.algorithm = algorithm
        self.render_mode = render_mode
        
        # Initialize environment
        self.env = PitchCoachEnv(render_mode=render_mode)
        
        # Load the trained model
        print(f"Loading {algorithm.upper()} model from {model_path}")
        if algorithm == 'dqn':
            self.model = DQN.load(model_path)
        elif algorithm == 'ppo':
            self.model = PPO.load(model_path)
        elif algorithm == 'a2c':
            self.model = A2C.load(model_path)
        elif algorithm == 'reinforce':
            self.model = PPO.load(model_path)  #
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        print("Model loaded successfully!")
        
    def run_demo(self, episodes=1, save_video=True, video_name=None):
        """Run the demo with the trained agent"""
        if video_name is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            video_name = f"pitch_demo_{self.algorithm}_{timestamp}.avi"
        
        video_writer = None
        if save_video:
            fourcc = cv2.VideoWriter_fourcc(*'XVID')
            video_writer = cv2.VideoWriter(video_name, fourcc, 20.0, (800, 600))
            print(f"Recording video to: {video_name}")
        
        for episode in range(episodes):
            print(f"\n=== Starting Episode {episode + 1} ===")
            obs, _ = self.env.reset()
            done = False
            total_reward = 0
            step_count = 0
            
            while not done:
                # Get action from trained model
                action, _ = self.model.predict(obs, deterministic=True)
                
                # Take action in environment
                obs, reward, terminated, truncated, info = self.env.step(action)
                done = terminated or truncated
                total_reward += reward
                step_count += 1
                
                # Render environment
                frame = self.env.render()
                
                # Convert Pygame surface to OpenCV format for video recording
                if save_video and frame is not None and isinstance(frame, pygame.Surface):
                    frame_array = pygame.surfarray.array3d(frame)
                    frame_array = frame_array.transpose([1, 0, 2])  # Fix dimensions
                    frame_array = cv2.cvtColor(frame_array, cv2.COLOR_RGB2BGR)
                    video_writer.write(frame_array)
                
                # Display current status
                if step_count % 10 == 0 or done:  # Print every 10 steps or at the end
                    if 'current_metrics' in info:
                        metrics = info['current_metrics']
                        print(f"Step {step_count}: "
                              f"Confidence: {metrics.get('confidence', 0):.2f}, "
                              f"Engagement: {metrics.get('engagement', 0):.2f}, "
                              f"Clarity: {metrics.get('clarity', 0):.2f}, "
                              f"Reward: {reward:.3f}, Total: {total_reward:.2f}")
                
                # Check for quit signal
                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        done = True
                    elif event.type == pygame.KEYDOWN:
                        if event.key == pygame.K_q or event.key == pygame.K_ESCAPE:
                            done = True
            
            print(f"Episode {episode + 1} completed!")
            print(f"Total steps: {step_count}")
            print(f"Total reward: {total_reward:.2f}")
            
            if 'final_metrics' in info:
                metrics = info['final_metrics']
                print("Final Metrics:")
                print(f"  Confidence: {metrics.get('confidence', 0):.2f}")
                print(f"  Engagement: {metrics.get('engagement', 0):.2f}")
                print(f"  Clarity: {metrics.get('clarity', 0):.2f}")
        
        if save_video and video_writer:
            video_writer.release()
            print(f"Video saved as: {video_name}")
        
        self.env.close()
        return total_reward, step_count

def main():
    parser = argparse.ArgumentParser(description='Pitch Coach RL Demo')
    parser.add_argument('--model_path', type=str, required=True,
                       help='Path to the trained model')
    parser.add_argument('--algorithm', type=str, required=True,
                       choices=['dqn', 'ppo', 'a2c', 'reinforce'],
                       help='RL algorithm used')
    parser.add_argument('--episodes', type=int, default=1,
                       help='Number of episodes to run')
    parser.add_argument('--save_video', action='store_true',
                       help='Save demonstration as video')
    parser.add_argument('--video_name', type=str, default=None,
                       help='Custom name for output video')
    
    args = parser.parse_args()
    
    # Verify model exists
    if not os.path.exists(args.model_path):
        print(f"Error: Model file {args.model_path} not found!")
        return
    
    print("=" * 60)
    print("PITCH COACH RL DEMONSTRATION")
    print("=" * 60)
    print("Problem: Founders struggle with pitch delivery and need objective feedback")
    print("Agent Behavior: Learns optimal presentation strategies through RL")
    print("Reward Structure: Based on confidence, engagement, and clarity metrics")
    print("Objective: Maximize presentation quality and audience engagement")
    print("=" * 60)
    
    demo = PitchCoachDemo(args.model_path, args.algorithm)
    
    print("\nStarting demonstration...")
    print("Controls:")
    print("  - Press 'q' or ESC to quit early")
    print("  - Close window to end session")
    print("-" * 40)
    
    total_reward, steps = demo.run_demo(
        episodes=args.episodes,
        save_video=args.save_video,
        video_name=args.video_name
    )
    
    print("\n" + "=" * 60)
    print("DEMONSTRATION COMPLETED")
    print("=" * 60)
    print(f"Algorithm: {args.algorithm.upper()}")
    print(f"Final Performance: {total_reward:.2f} total reward over {steps} steps")
    print("Agent successfully learned presentation optimization strategies!")

if __name__ == "__main__":
    main()