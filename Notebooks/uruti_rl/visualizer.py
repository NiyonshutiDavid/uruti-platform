#!/usr/bin/env python3
"""
Pygame-based environment visualizer for the Pitch Coach RL environment.
Shows agent position, target, obstacles, and real-time reward feedback.
"""

import sys
from pathlib import Path
from typing import Tuple

try:
    import pygame
    import numpy as np
except ImportError as e:
    print(f"Error: Missing required library: {e}")
    print("Install with: pip install pygame numpy")
    sys.exit(1)

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from envs.pitch_env import PitchCoachEnv

class PitchCoachVisualizer:
    """Pygame visualizer for PitchCoachEnv."""
    
    def __init__(self, env: PitchCoachEnv, fps: int = 30, scale: int = 50):
        """
        Initialize visualizer.
        
        Args:
            env: PitchCoachEnv instance to visualize
            fps: Frames per second
            scale: Pixels per unit of environment space
        """
        self.env = env
        self.fps = fps
        self.scale = scale
        self.clock = pygame.time.Clock()
        
        # Environment bounds (assuming 20x20 unit space based on PitchCoachEnv)
        self.env_width = 20
        self.env_height = 20
        
        # Window dimensions
        self.window_width = int(self.env_width * self.scale)
        self.window_height = int(self.env_height * self.scale) + 100  # Extra space for info
        
        # Initialize Pygame
        pygame.init()
        pygame.display.set_mode((self.window_width, self.window_height))
        pygame.display.set_caption("Pitch Coach RL Environment")
        self.screen = pygame.display.get_surface()
        self.font = pygame.font.Font(None, 24)
        self.small_font = pygame.font.Font(None, 18)
        
        # Colors
        self.colors = {
            'bg': (20, 20, 20),
            'grid': (60, 60, 60),
            'agent': (0, 150, 255),      # Blue
            'target': (0, 255, 0),       # Green
            'obstacle': (255, 100, 0),   # Orange
            'text': (255, 255, 255),     # White
            'reward_pos': (0, 255, 100), # Cyan
            'reward_neg': (255, 50, 50), # Red
        }
    
    def world_to_screen(self, x: float, y: float) -> tuple:
        """Convert world coordinates to screen coordinates."""
        screen_x = int((x + self.env_width / 2) * self.scale)
        screen_y = int(self.window_height - 100 - (y + self.env_height / 2) * self.scale)
        return screen_x, screen_y
    
    def draw_background(self):
        """Draw environment background and grid."""
        self.screen.fill(self.colors['bg'])
        
        # Draw grid
        for i in range(0, self.window_width, self.scale):
            pygame.draw.line(self.screen, self.colors['grid'], (i, 0), (i, self.window_height - 100))
        for j in range(0, self.window_height - 100, self.scale):
            pygame.draw.line(self.screen, self.colors['grid'], (0, j), (self.window_width, j))
        
        # Draw environment bounds
        bound_rect = pygame.Rect(0, 0, self.window_width, self.window_height - 100)
        pygame.draw.rect(self.screen, self.colors['text'], bound_rect, 2)
    
    def draw_agent(self, x: float, y: float, size: int = 8):
        """Draw agent as a circle."""
        screen_x, screen_y = self.world_to_screen(x, y)
        pygame.draw.circle(self.screen, self.colors['agent'], (screen_x, screen_y), size)
        pygame.draw.circle(self.screen, self.colors['text'], (screen_x, screen_y), size, 1)
    
    def draw_target(self, x: float, y: float, size: int = 8):
        """Draw target as a star/cross."""
        screen_x, screen_y = self.world_to_screen(x, y)
        
        # Draw as a plus sign
        line_len = size * 2
        pygame.draw.line(
            self.screen,
            self.colors['target'],
            (screen_x - line_len, screen_y),
            (screen_x + line_len, screen_y),
            2
        )
        pygame.draw.line(
            self.screen,
            self.colors['target'],
            (screen_x, screen_y - line_len),
            (screen_x, screen_y + line_len),
            2
        )
    
    def draw_info_panel(self, step: int, total_reward: float, last_reward: float, 
                       agent_pos: tuple, target_pos: tuple):
        """Draw information panel at bottom."""
        y_offset = self.window_height - 95
        
        # Background for info panel
        pygame.draw.rect(
            self.screen,
            (30, 30, 30),
            pygame.Rect(0, self.window_height - 100, self.window_width, 100)
        )
        pygame.draw.line(
            self.screen,
            self.colors['text'],
            (0, self.window_height - 100),
            (self.window_width, self.window_height - 100),
            1
        )
        
        # Render text
        texts = [
            f"Step: {step}",
            f"Total Reward: {total_reward:.2f}",
            f"Last Reward: {last_reward:.2f}",
            f"Agent: ({agent_pos[0]:.1f}, {agent_pos[1]:.1f})",
            f"Target: ({target_pos[0]:.1f}, {target_pos[1]:.1f})",
        ]
        
        x, y = 10, y_offset
        for text in texts:
            # Determine color based on reward
            if "Last Reward" in text and last_reward > 0:
                color = self.colors['reward_pos']
            elif "Last Reward" in text:
                color = self.colors['reward_neg']
            else:
                color = self.colors['text']
            
            surf = self.small_font.render(text, True, color)
            self.screen.blit(surf, (x, y))
            y += 18
    
    def render_frame(self, observation: np.ndarray, step: int, 
                    total_reward: float, last_reward: float):
        """Render a single frame."""
        self.draw_background()
        
        # Parse observation
        # PitchCoachEnv state: [agent_x, agent_y, agent_vx, agent_vy, target_x, target_y, ...]
        agent_x = float(observation[0]) if len(observation) > 0 else 0
        agent_y = float(observation[1]) if len(observation) > 1 else 0
        target_x = float(observation[4]) if len(observation) > 4 else 0
        target_y = float(observation[5]) if len(observation) > 5 else 0
        
        # Draw elements
        self.draw_target(target_x, target_y, size=10)
        self.draw_agent(agent_x, agent_y, size=8)
        
        # Draw info panel
        self.draw_info_panel(
            step, total_reward, last_reward,
            (agent_x, agent_y),
            (target_x, target_y)
        )
        
        pygame.display.flip()
        self.clock.tick(self.fps)
    
    def run_episode(self, render: bool = True, num_steps: int = None) -> Tuple[float, int]:
        """
        Run one episode with visualization.
        
        Args:
            render: Whether to render frames
            num_steps: Max steps (None = use env max)
        
        Returns: (total_reward, num_steps_taken)
        """
        observation, _ = self.env.reset()
        total_reward = 0.0
        step = 0
        done = False
        
        max_steps = num_steps or self.env.max_steps if hasattr(self.env, 'max_steps') else 300
        
        while not done and step < max_steps:
            # Random action
            action = self.env.action_space.sample()
            observation, reward, terminated, truncated, _ = self.env.step(action)
            done = terminated or truncated
            
            total_reward += reward
            step += 1
            
            if render:
                self.render_frame(observation, step, total_reward, reward)
            
            # Handle events
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    return total_reward, step
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        return total_reward, step
        
        return total_reward, step
    
    def run_demo(self, num_episodes: int = 5):
        """Run multiple demo episodes."""
        print(f"Running {num_episodes} random action demonstrations...")
        print("Press ESC or close window to stop\n")
        
        episode_rewards = []
        
        try:
            for ep in range(num_episodes):
                print(f"Episode {ep + 1}/{num_episodes}...", end='', flush=True)
                episode_reward, steps = self.run_episode(render=True, num_steps=300)
                episode_rewards.append(episode_reward)
                print(f" Complete (reward: {episode_reward:.2f}, steps: {steps})")
        except KeyboardInterrupt:
            print("\nDemo interrupted by user")
        finally:
            if episode_rewards:
                print(f"\nDemo Statistics:")
                print(f"  Mean Reward: {np.mean(episode_rewards):.2f}")
                print(f"  Std Dev: {np.std(episode_rewards):.2f}")
                print(f"  Min: {np.min(episode_rewards):.2f}")
                print(f"  Max: {np.max(episode_rewards):.2f}")
            pygame.quit()

def main():
    """Entry point for visualization demo."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Visualize Pitch Coach RL environment with random actions"
    )
    parser.add_argument(
        '--episodes',
        type=int,
        default=5,
        help='Number of episodes to run'
    )
    parser.add_argument(
        '--fps',
        type=int,
        default=30,
        help='Frames per second'
    )
    parser.add_argument(
        '--scale',
        type=int,
        default=50,
        help='Pixels per unit of environment space'
    )
    
    args = parser.parse_args()
    
    # Create environment
    env = PitchCoachEnv()
    
    # Create visualizer
    visualizer = PitchCoachVisualizer(env, fps=args.fps, scale=args.scale)
    
    # Run demo
    visualizer.run_demo(num_episodes=args.episodes)

if __name__ == '__main__':
    main()
