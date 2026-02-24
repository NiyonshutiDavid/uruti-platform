import gymnasium as gym
import numpy as np
import torch
import argparse
import json
import os
import cv2
import wave
import pyaudio
import pygame  
from datetime import datetime
from stable_baselines3 import DQN, PPO, A2C
from environment.pitch_env import PitchCoachEnv
from utils.visualization import PitchVisualizer
from utils.audio_processor import AudioRecorder

class PitchCoachPlayer:
    def __init__(self, model_path, algorithm):
        self.model_path = model_path
        self.algorithm = algorithm
        self.env = PitchCoachEnv(render_mode='human')
        self.visualizer = PitchVisualizer()
        self.audio_recorder = AudioRecorder()
        
        # Load model
        if algorithm == 'dqn':
            self.model = DQN.load(model_path)
        elif algorithm == 'reinforce':
            self.model = PPO.load(model_path)
        elif algorithm == 'a2c':
            self.model = A2C.load(model_path)
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
    
    def play_episode(self, record_audio=True, save_video=False):
        """Play one episode with the trained model"""  # Fixed docstring
        if record_audio and self.audio_recorder.is_available():
            print("Starting audio recording...")
            self.audio_recorder.start_recording()
        elif record_audio:
            print("Audio recording requested but not available")
            print("To enable audio recording, install pyaudio:")
            print("  On macOS: brew install portaudio && pip install pyaudio")
            print("  On Ubuntu: sudo apt-get install python3-pyaudio")
        
        if save_video:
            # Initialize video writer
            fourcc = cv2.VideoWriter_fourcc(*'XVID')
            video_out = cv2.VideoWriter(
                f"pitch_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.avi",
                fourcc, 20.0, (800, 600)
            )
        
        obs, _ = self.env.reset()
        done = False
        total_reward = 0
        step_count = 0
        
        print("Starting pitch session...")
        print("Press 'q' to quit early")
        
        while not done:
            # Get action from model
            action, _states = self.model.predict(obs, deterministic=True)
            
            # Step environment
            obs, reward, terminated, truncated, info = self.env.step(action)
            done = terminated or truncated
            total_reward += reward
            step_count += 1
            
            # Render environment
            frame = self.env.render()
            
            if save_video and frame is not None:
                # Convert Pygame surface to OpenCV format
                if isinstance(frame, pygame.Surface):
                    # Convert pygame Surface to numpy array
                    frame_array = pygame.surfarray.array3d(frame)
                    frame_array = frame_array.transpose([1, 0, 2])  # Fix dimensions
                    frame_array = cv2.cvtColor(frame_array, cv2.COLOR_RGB2BGR)
                    video_out.write(frame_array)
            
            # Display current metrics
            if 'current_metrics' in info:
                metrics = info['current_metrics']
                print(f"Step {step_count}: Confidence: {metrics['confidence']:.2f}, "
                      f"Engagement: {metrics['engagement']:.2f}, "
                      f"Clarity: {metrics['clarity']:.2f}, "
                      f"Reward: {reward:.2f}")
            
            # Check for early quit
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("Session terminated early by user")
                break
        
        if record_audio and self.audio_recorder.is_available():
            print("Stopping audio recording...")
            audio_filename = self.audio_recorder.stop_recording()
            if audio_filename:
                print(f"Audio saved as: {audio_filename}")
        
        if save_video:
            video_out.release()
            print("Video saved successfully")
        
        # Generate performance report
        self.generate_report(total_reward, step_count, info)
        
        self.env.close()
        cv2.destroyAllWindows()
        
        return total_reward, step_count, info

    def generate_report(self, total_reward, step_count, info):
        """Generate a performance report after the session"""
        print("\n" + "="*50)
        print("PITCH SESSION REPORT")
        print("="*50)
        print(f"Total Reward: {total_reward:.2f}")
        print(f"Session Duration: {step_count} steps")
        
        if 'final_metrics' in info:
            metrics = info['final_metrics']
            print(f"Final Confidence: {metrics.get('confidence', 0):.2f}")
            print(f"Final Engagement: {metrics.get('engagement', 0):.2f}")
            print(f"Final Clarity: {metrics.get('clarity', 0):.2f}")
        
        print("="*50)

# Add main function to make the script runnable
def main():
    parser = argparse.ArgumentParser(description='Play trained RL model for Pitch Coach')
    parser.add_argument('--model_path', type=str, required=True,
                       help='Path to the trained model')
    parser.add_argument('--algorithm', type=str, required=True,
                       choices=['dqn', 'reinforce', 'a2c'],
                       help='RL algorithm used for training')
    parser.add_argument('--record_audio', action='store_true',
                       help='Record audio during the session')
    parser.add_argument('--save_video', action='store_true',
                       help='Save video of the session')
    
    args = parser.parse_args()
    
    player = PitchCoachPlayer(args.model_path, args.algorithm)
    player.play_episode(record_audio=args.record_audio, save_video=args.save_video)

if __name__ == "__main__":
    main()