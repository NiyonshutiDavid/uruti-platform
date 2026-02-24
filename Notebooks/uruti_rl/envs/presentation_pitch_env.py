# Enhanced Presentation Environment with Slide Navigation
import gymnasium as gym
from gymnasium import spaces
import numpy as np
import pygame
import random
import math
from typing import Tuple, Dict, Any, Optional, List
from pathlib import Path


class PresentationPitchEnv(gym.Env):
    """
    Enhanced Pitch Environment with Real Slide/Video Navigation
    
    Features:
    - Slide-based presentations with configurable slide count
    - Real video file support for slide backgrounds
    - Beautiful Pygame UI with metrics and audience feedback
    - Slide progression tracking and navigation rewards
    - Full integration with RL agents
    
    Actions:
    0: Maintain Style (hold current slide)
    1: Increase Energy (boost confidence/engagement)
    2: Use Gestures (increase engagement + clarity)
    3: Eye Contact (boost engagement significantly)
    4: Next Slide (advance to next slide)
    5: Storytelling (boost engagement + confidence)
    
    Observation:
    [confidence, engagement, clarity, pace, slide_progress, time_remaining]
    """
    
    metadata = {'render_modes': ['human', 'rgb_array'], 'render_fps': 30}

    def __init__(
        self,
        render_mode: Optional[str] = None,
        total_slides: int = 10,
        seed: Optional[int] = None,
        slide_images_dir: Optional[str] = None,
        slide_duration: float = 30.0,
        use_video_backgrounds: bool = False,
        video_path: Optional[str] = None,
    ):
        """
        Initialize presentation pitch environment.
        
        Args:
            render_mode: 'human' for display, 'rgb_array' for frame output
            total_slides: Number of slides in presentation
            seed: Random seed
            slide_images_dir: Directory containing slide images (PNG, JPG)
            slide_duration: Total presentation duration in seconds
            use_video_backgrounds: Whether to use video file as background
            video_path: Path to video file for background
        """
        super().__init__()
        self.render_mode = render_mode
        self.total_slides = int(max(1, total_slides))
        self.slide_duration = float(slide_duration)
        self.use_video_backgrounds = use_video_backgrounds
        
        # Observation space (floats)
        self.observation_space = spaces.Box(
            low=np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0], dtype=np.float32),
            high=np.array([1.0, 1.0, 1.0, 2.0, 1.0, 1.0], dtype=np.float32),
            dtype=np.float32
        )

        # Action space: 6 discrete actions
        self.action_space = spaces.Discrete(6)
        self.action_meanings = [
            "Maintain Style", 
            "Increase Energy", 
            "Use Gestures", 
            "Eye Contact", 
            "Next Slide", 
            "Storytelling"
        ]

        # Random number generator
        self._rng = random.Random(seed)
        self.seed(seed)

        # Timing configuration
        self.steps_per_second = 2  # 2 steps per second
        self.time_decrement = 1.0 / (self.slide_duration * self.steps_per_second)

        # Initialize state
        self._init_state()

        # Slide management
        self.slide_images: List[np.ndarray] = []
        self.slide_images_dir = slide_images_dir
        self._load_slide_images()
        
        # Video background
        self.video_cap: Optional[Any] = None
        if use_video_backgrounds and video_path:
            self._load_video_background(video_path)

        # Rendering
        self.window_size = (1000, 700)
        self.screen = None
        self.clock = None
        self.fonts = {}
        self.colors = {
            'background': (245, 245, 250),
            'card': (255, 255, 255),
            'primary': (41, 128, 185),
            'success': (39, 174, 96),
            'warning': (241, 196, 15),
            'danger': (231, 76, 60),
            'text': (52, 73, 94),
            'text_light': (149, 165, 166)
        }

    def _load_slide_images(self):
        """Load slide images from directory if provided."""
        if not self.slide_images_dir:
            return

        try:
            import cv2
        except Exception as exc:
            print(f"Warning: OpenCV not available, skipping slide image loading ({exc})")
            return
        
        slide_dir = Path(self.slide_images_dir)
        if not slide_dir.exists():
            print(f"Warning: Slide directory not found: {slide_dir}")
            return
        
        # Supported image formats
        image_extensions = {'.png', '.jpg', '.jpeg', '.bmp', '.gif'}
        image_files = sorted([
            f for f in slide_dir.iterdir() 
            if f.suffix.lower() in image_extensions
        ])
        
        if not image_files:
            print(f"Warning: No image files found in {slide_dir}")
            return
        
        # Load images
        for img_path in image_files[:self.total_slides]:
            img = cv2.imread(str(img_path))
            if img is not None:
                # Resize to match window
                img = cv2.resize(img, (500, 400))
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                self.slide_images.append(img)
        
        print(f"Loaded {len(self.slide_images)} slide images")

    def _load_video_background(self, video_path: str):
        """Load video file for background visualization."""
        try:
            import cv2
        except Exception as exc:
            print(f"Warning: OpenCV not available, skipping video background ({exc})")
            return

        if not Path(video_path).exists():
            print(f"Warning: Video file not found: {video_path}")
            return
        
        self.video_cap = cv2.VideoCapture(video_path)
        if not self.video_cap.isOpened():
            print(f"Error: Could not open video file: {video_path}")
            self.video_cap = None

    def _init_state(self):
        """Initialize mutable state variables."""
        self.confidence = 0.5
        self.engagement = 0.5
        self.clarity = 0.5
        self.pace = 1.0
        self.current_slide = 0
        self.slide_progress = 0.0
        self.time_remaining = 1.0
        self.last_action = None
        self.step_count = 0
        self.episode_reward = 0.0

    def seed(self, seed: Optional[int] = None):
        """Set random seed."""
        self._seed = seed
        self.np_random, seed = gym.utils.seeding.np_random(seed)
        return [seed]

    def reset(self, seed: Optional[int] = None, options: Optional[dict] = None) -> Tuple[np.ndarray, Dict]:
        """Reset environment for new episode."""
        if seed is not None:
            self.seed(seed)

        # Randomized start state
        self.confidence = float(0.5 + self.np_random.uniform(-0.1, 0.1))
        self.engagement = float(0.5 + self.np_random.uniform(-0.1, 0.1))
        self.clarity = float(0.5 + self.np_random.uniform(-0.1, 0.1))
        self.pace = 1.0
        self.current_slide = 0
        self.slide_progress = 0.0
        self.time_remaining = 1.0
        self.last_action = None
        self.step_count = 0
        self.episode_reward = 0.0

        obs = self._get_obs()
        info = self._get_info()

        if self.render_mode == "human":
            self._render_frame()

        return obs, info

    def _get_obs(self) -> np.ndarray:
        """Get current observation."""
        return np.array([
            self.confidence,
            self.engagement,
            self.clarity,
            self.pace,
            self.slide_progress,
            self.time_remaining
        ], dtype=np.float32)

    def _get_info(self) -> Dict[str, Any]:
        """Get current info dictionary."""
        return {
            'current_metrics': {
                'confidence': self.confidence,
                'engagement': self.engagement,
                'clarity': self.clarity,
                'pace': self.pace,
                'current_slide': self.current_slide,
                'total_slides': self.total_slides,
                'time_remaining': self.time_remaining * self.slide_duration
            },
            'last_action': self.last_action,
            'step_count': self.step_count,
            'episode_reward': self.episode_reward
        }

    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, Dict]:
        """Execute one step of environment."""
        assert self.action_space.contains(action), "Invalid action"
        self.last_action = action
        self.step_count += 1

        reward = 0.0

        # Action effects
        if action == 0:  # Maintain
            reward += 0.05
        elif action == 1:  # Increase energy
            self.confidence = min(1.0, self.confidence + 0.10)
            self.engagement = min(1.0, self.engagement + 0.15)
            reward += 0.4
        elif action == 2:  # Use gestures
            self.engagement = min(1.0, self.engagement + 0.12)
            self.clarity = min(1.0, self.clarity + 0.06)
            reward += 0.3
        elif action == 3:  # Eye contact
            self.engagement = min(1.0, self.engagement + 0.20)
            reward += 0.45
        elif action == 4:  # Next slide
            if self.current_slide < self.total_slides - 1:
                self.current_slide += 1
                self.slide_progress = float(self.current_slide / max(1, (self.total_slides - 1)))
                reward += 1.2  # High reward for progression
                self.clarity = max(0.0, self.clarity - 0.02)
            else:
                reward -= 0.15  # Penalty for trying beyond last slide
        elif action == 5:  # Storytelling
            self.engagement = min(1.0, self.engagement + 0.25)
            self.confidence = min(1.0, self.confidence + 0.08)
            reward += 0.6

        # Natural decay
        self.confidence = max(0.0, self.confidence - 0.012)
        self.engagement = max(0.0, self.engagement - 0.018)

        # Time progression
        self.time_remaining = max(0.0, self.time_remaining - self.time_decrement)

        # State-based reward shaping
        state_reward = (0.3 * self.confidence + 0.4 * self.engagement + 0.3 * self.clarity)
        reward += 0.15 * state_reward

        self.episode_reward += reward

        # Termination conditions
        terminated = False
        truncated = False

        # Time-based termination
        if self.time_remaining <= 0:
            terminated = True
            reward += 15.0 * self.slide_progress

        # Completion bonus
        if self.current_slide >= (self.total_slides - 1) and self.slide_progress >= 0.95:
            terminated = True
            reward += 15.0

        obs = self._get_obs()
        info = self._get_info()

        if self.render_mode == "human" or self.render_mode == "rgb_array":
            frame = self._render_frame()
            if self.render_mode == "rgb_array":
                return obs, float(reward), bool(terminated), bool(truncated), info, frame

        return obs, float(reward), bool(terminated), bool(truncated), info

    def render(self):
        """Render environment."""
        if self.render_mode == "rgb_array":
            return self._render_frame()
        elif self.render_mode == "human":
            self._render_frame()
        else:
            return None

    def _render_frame(self):
        """Render a single frame."""
        if self.screen is None and self.render_mode == "human":
            pygame.init()
            self.screen = pygame.display.set_mode(self.window_size)
            pygame.display.set_caption("🎯 Presentation Coach - Slide Navigation")
            self.clock = pygame.time.Clock()
            self._init_fonts()

        canvas = pygame.Surface(self.window_size)
        canvas.fill(self.colors['background'])

        # Draw components
        self._draw_presentation_area(canvas)
        self._draw_metrics_panel(canvas)
        self._draw_progress_panel(canvas)
        self._draw_action_feedback(canvas)

        # Push to screen
        if self.render_mode == "human":
            if self.screen is None:
                self.screen = pygame.display.set_mode(self.window_size)
            self.screen.blit(canvas, (0, 0))
            pygame.event.pump()
            pygame.display.flip()
            if self.clock:
                self.clock.tick(self.metadata["render_fps"])
            return None
        else:
            arr = pygame.surfarray.pixels3d(canvas).copy()
            arr = np.transpose(arr, (1, 0, 2))
            return arr

    def _init_fonts(self):
        """Initialize fonts."""
        if self.screen:
            self.fonts = {
                'title': pygame.font.Font(None, 36),
                'header': pygame.font.Font(None, 28),
                'body': pygame.font.Font(None, 24),
                'metric': pygame.font.Font(None, 20),
                'small': pygame.font.Font(None, 18)
            }

    def _draw_presentation_area(self, canvas):
        """Draw slide area with current slide."""
        pres_rect = pygame.Rect(50, 50, 500, 400)
        pygame.draw.rect(canvas, self.colors['card'], pres_rect, border_radius=12)
        pygame.draw.rect(canvas, self.colors['primary'], pres_rect, 2, border_radius=12)
        
        # Title
        title = self.fonts['header'].render("Current Slide View", True, self.colors['text'])
        canvas.blit(title, (pres_rect.centerx - title.get_width()//2, pres_rect.y + 20))

        # Slide content
        slide_display_rect = pygame.Rect(pres_rect.x + 20, pres_rect.y + 50, 460, 330)
        
        if self.slide_images and self.current_slide < len(self.slide_images):
            # Display loaded slide image
            slide_img = self.slide_images[self.current_slide]
            # Convert numpy array to pygame surface
            slide_surface = pygame.surfarray.make_surface(
                np.transpose(slide_img, (1, 0, 2))
            )
            canvas.blit(slide_surface, (slide_display_rect.x, slide_display_rect.y))
        else:
            # Fallback: Draw placeholder slide
            pygame.draw.rect(canvas, (200, 200, 200), slide_display_rect)
            slide_text = self.fonts['body'].render(
                f"Slide {self.current_slide + 1}/{self.total_slides}",
                True, self.colors['text']
            )
            canvas.blit(
                slide_text,
                (slide_display_rect.centerx - slide_text.get_width()//2,
                 slide_display_rect.centery - slide_text.get_height()//2)
            )

    def _draw_metrics_panel(self, canvas):
        """Draw metrics panel."""
        metrics_rect = pygame.Rect(580, 50, 370, 200)
        pygame.draw.rect(canvas, self.colors['card'], metrics_rect, border_radius=12)
        pygame.draw.rect(canvas, self.colors['primary'], metrics_rect, 2, border_radius=12)
        
        title = self.fonts['header'].render("Presentation Metrics", True, self.colors['text'])
        canvas.blit(title, (metrics_rect.centerx - title.get_width()//2, metrics_rect.y + 15))

        metrics = [
            ("Confidence", self.confidence, self.colors['primary']),
            ("Engagement", self.engagement, self.colors['success']),
            ("Clarity", self.clarity, self.colors['warning'])
        ]
        
        for i, (label, value, color) in enumerate(metrics):
            y_pos = metrics_rect.y + 60 + i * 45
            self._draw_modern_gauge(canvas, label, value, 600, y_pos, 340, color)

    def _draw_modern_gauge(self, canvas, label, value, x, y, width, color):
        """Draw a gauge with value."""
        pygame.draw.rect(canvas, (230, 230, 230), (x, y, width, 25), border_radius=5)
        fill_width = int(value * width)
        if fill_width > 0:
            pygame.draw.rect(canvas, color, (x, y, fill_width, 25), border_radius=5)
        pygame.draw.rect(canvas, (200, 200, 200), (x, y, width, 25), 2, border_radius=5)
        
        label_text = self.fonts['body'].render(f"{label}: {value:.1f}", True, self.colors['text'])
        canvas.blit(label_text, (x, y - 25))
        
        percent_text = self.fonts['small'].render(f"{int(value*100)}%", True, self.colors['text_light'])
        canvas.blit(percent_text, (x + width + 10, y + 5))

    def _draw_progress_panel(self, canvas):
        """Draw slide and time progress."""
        progress_rect = pygame.Rect(580, 270, 370, 180)
        pygame.draw.rect(canvas, self.colors['card'], progress_rect, border_radius=12)
        pygame.draw.rect(canvas, self.colors['primary'], progress_rect, 2, border_radius=12)
        
        title = self.fonts['header'].render("Progress & Navigation", True, self.colors['text'])
        canvas.blit(title, (progress_rect.centerx - title.get_width()//2, progress_rect.y + 15))

        # Slide progress
        slide_y = progress_rect.y + 50
        slide_text = self.fonts['body'].render(
            f"Slide: {self.current_slide + 1}/{self.total_slides}",
            True, self.colors['text']
        )
        canvas.blit(slide_text, (600, slide_y))
        self._draw_progress_bar(canvas, "Completion", self.slide_progress, 600, slide_y + 30, 320)

        # Time progress
        time_y = slide_y + 80
        remaining_seconds = self.time_remaining * self.slide_duration
        time_text = self.fonts['body'].render(
            f"Time: {remaining_seconds:.1f}s / {self.slide_duration}s",
            True, self.colors['text']
        )
        canvas.blit(time_text, (600, time_y))
        self._draw_progress_bar(canvas, "Time", self.time_remaining, 600, time_y + 30, 320, self.colors['warning'])

    def _draw_progress_bar(self, canvas, label, value, x, y, width, color=None):
        """Draw a progress bar."""
        if color is None:
            color = self.colors['primary']
        
        pygame.draw.rect(canvas, (230, 230, 230), (x, y, width, 12), border_radius=6)
        progress_width = int(value * width)
        if progress_width > 0:
            pygame.draw.rect(canvas, color, (x, y, progress_width, 12), border_radius=6)
        pygame.draw.rect(canvas, (200, 200, 200), (x, y, width, 12), 1, border_radius=6)

    def _draw_action_feedback(self, canvas):
        """Draw action and status information."""
        feedback_rect = pygame.Rect(50, 470, 900, 200)
        pygame.draw.rect(canvas, self.colors['card'], feedback_rect, border_radius=12)
        pygame.draw.rect(canvas, self.colors['primary'], feedback_rect, 2, border_radius=12)
        
        title = self.fonts['header'].render("Status & Actions", True, self.colors['text'])
        canvas.blit(title, (feedback_rect.centerx - title.get_width()//2, feedback_rect.y + 15))

        if self.last_action is not None:
            action_text = self.fonts['body'].render(
                f"Last Action: {self.action_meanings[self.last_action]}",
                True, self.colors['primary']
            )
            canvas.blit(action_text, (80, feedback_rect.y + 50))

        step_text = self.fonts['body'].render(f"Step: {self.step_count}", True, self.colors['text_light'])
        canvas.blit(step_text, (80, feedback_rect.y + 80))

        actions_y = feedback_rect.y + 110
        actions_text = self.fonts['small'].render(
            "Actions: 1=Energy 2=Gestures 3=Eye Contact 4=Next Slide 5=Storytelling",
            True, self.colors['text_light']
        )
        canvas.blit(actions_text, (80, actions_y))

        tip = self._get_performance_tip()
        tips_y = actions_y + 25
        tip_text = self.fonts['small'].render(f"Tip: {tip}", True, self.colors['warning'])
        canvas.blit(tip_text, (80, tips_y))

    def _get_performance_tip(self):
        """Get contextual performance tip."""
        if self.engagement < 0.4:
            return "Try gestures or eye contact to boost engagement!"
        elif self.confidence < 0.4:
            return "Increase energy to build confidence!"
        elif self.clarity < 0.4:
            return "Use storytelling for better clarity!"
        elif self.slide_progress < 0.5 and self.time_remaining < 0.5:
            return "Consider advancing slides to maintain pace"
        else:
            return "Great presentation! Keep it up!"

    def close(self):
        """Clean up resources."""
        if self.screen is not None:
            pygame.display.quit()
            pygame.quit()
            self.screen = None
            self.clock = None
        if self.video_cap is not None:
            self.video_cap.release()
