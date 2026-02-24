"""
Random action demo - shows agent taking random actions without training
"""
import pygame
import cv2
import numpy as np
from datetime import datetime
from environment.pitch_env import PitchCoachEnv

def run_random_demo(episodes=1, save_video=True):
    """Run demo with random actions"""
    env = PitchCoachEnv(render_mode='human')
    
    video_writer = None
    if save_video:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        video_name = f"random_demo_{timestamp}.avi"
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        video_writer = cv2.VideoWriter(video_name, fourcc, 20.0, (800, 600))
        print(f"Recording random actions to: {video_name}")
    
    for episode in range(episodes):
        print(f"\n=== Random Action Demo - Episode {episode + 1} ===")
        obs, _ = env.reset()
        done = False
        total_reward = 0
        step_count = 0
        
        while not done:
            # Take random action
            action = env.action_space.sample()
            
            # Step environment
            obs, reward, terminated, truncated, info = env.step(action)
            done = terminated or truncated
            total_reward += reward
            step_count += 1
            
            # Render
            frame = env.render()
            
            # Record video
            if save_video and frame is not None and isinstance(frame, pygame.Surface):
                frame_array = pygame.surfarray.array3d(frame)
                frame_array = frame_array.transpose([1, 0, 2])
                frame_array = cv2.cvtColor(frame_array, cv2.COLOR_RGB2BGR)
                video_writer.write(frame_array)
            
            # Print status
            if step_count % 10 == 0 or done:
                print(f"Step {step_count}: Random action {action}, Reward: {reward:.3f}")
            
            # Check for quit
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    done = True
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_q:
                        done = True
        
        print(f"Episode completed! Total reward: {total_reward:.2f}")
    
    if save_video and video_writer:
        video_writer.release()
    
    env.close()
    print("\nRandom demo completed!")

if __name__ == "__main__":
    print("RANDOM ACTION DEMONSTRATION")
    print("This shows the environment with random actions (no trained model)")
    run_random_demo(episodes=1, save_video=True)