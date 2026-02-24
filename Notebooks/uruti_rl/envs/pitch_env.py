import gymnasium as gym
from gymnasium import spaces
import numpy as np
import pygame
import random
import math
from typing import Optional, Tuple, Dict, Any

class PitchCoachEnv(gym.Env):
    """
    Enhanced Pitch Coach Environment with realistic stochastic effects.
    """
    metadata = {'render_modes': ['human', 'rgb_array'], 'render_fps': 30}

    def __init__(self, render_mode: Optional[str] = None, total_slides: int = 10, seed: Optional[int] = None):
        super().__init__()
        self.render_mode = render_mode
        self.total_slides = total_slides

        # Observation space (6 floats)
        self.observation_space = spaces.Box(
            low=np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0], dtype=np.float32),
            high=np.array([1.0, 1.0, 1.0, 2.0, 1.0, 1.0], dtype=np.float32),
            dtype=np.float32
        )

        # Action space: 6 discrete actions
        self.action_space = spaces.Discrete(6)
        self.action_meanings = [
            "Maintain Style", "Increase Energy", "Use Gestures",
            "Eye Contact", "Next Slide", "Storytelling"
        ]

        # Gesture types for variety
        self.gestures = ["open_palms", "pointing", "hand_waves"]

        self._rng = random.Random(seed)
        self.seed(seed)

        # Timing: 30 second pitch, 2 steps per second
        self.total_pitch_seconds = 30.0
        self.steps_per_second = 2
        self.time_decrement = 1.0 / (self.total_pitch_seconds * self.steps_per_second)

        self._init_state()

        # Pygame rendering setup
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

    def _init_fonts(self):
        if self.screen:
            self.fonts = {
                'title': pygame.font.Font(None, 36),
                'header': pygame.font.Font(None, 28),
                'body': pygame.font.Font(None, 24),
                'metric': pygame.font.Font(None, 20),
                'small': pygame.font.Font(None, 18)
            }

    def _init_state(self):
        self.confidence = 0.5
        self.engagement = 0.5
        self.clarity = 0.5
        self.pace = 1.0
        self.current_slide = 0
        self.slide_progress = 0.0
        self.time_remaining = 1.0
        self.last_action = None
        self.step_count = 0
        self.prev_action = None   # for repetition penalty

    def seed(self, seed: Optional[int] = None):
        self._seed = seed
        self.np_random, seed = gym.utils.seeding.np_random(seed)
        return [seed]

    def reset(self, seed: Optional[int] = None, options: Optional[dict] = None) -> Tuple[np.ndarray, Dict]:
        if seed is not None:
            self.seed(seed)
        self.confidence = float(0.5 + self.np_random.uniform(-0.1, 0.1))
        self.engagement = float(0.5 + self.np_random.uniform(-0.1, 0.1))
        self.clarity = float(0.5 + self.np_random.uniform(-0.1, 0.1))
        self.pace = 1.0
        self.current_slide = 0
        self.slide_progress = 0.0
        self.time_remaining = 1.0
        self.last_action = None
        self.step_count = 0
        self.prev_action = None
        obs = self._get_obs()
        info = self._get_info()
        if self.render_mode == "human":
            self._render_frame()
        return obs, info

    def _get_obs(self) -> np.ndarray:
        return np.array([
            self.confidence,
            self.engagement,
            self.clarity,
            self.pace,
            self.slide_progress,
            self.time_remaining
        ], dtype=np.float32)

    def _get_info(self) -> Dict[str, Any]:
        return {
            'current_metrics': {
                'confidence': self.confidence,
                'engagement': self.engagement,
                'clarity': self.clarity,
                'pace': self.pace,
                'current_slide': self.current_slide,
                'total_slides': self.total_slides,
                'time_remaining': self.time_remaining * self.total_pitch_seconds
            },
            'last_action': self.last_action,
            'step_count': self.step_count
        }

    def step(self, action: int):
        assert self.action_space.contains(action)
        self.last_action = action
        self.step_count += 1

        reward = 0.0

        # ---- Repetition penalty ----
        if self.prev_action == action:
            reward -= 0.02
        self.prev_action = action

        # ---- Stochastic action effects ----
        if action == 0:  # Maintain
            reward += 0.05
            self.confidence = min(1.0, self.confidence + self.np_random.uniform(0.0, 0.02))
        elif action == 1:  # Increase energy
            conf_boost = self.np_random.uniform(0.05, 0.15)
            eng_boost = self.np_random.uniform(0.10, 0.20)
            self.confidence = min(1.0, self.confidence + conf_boost)
            self.engagement = min(1.0, self.engagement + eng_boost)
            reward += 0.4
        elif action == 2:  # Use gestures
            gesture = self.np_random.choice(self.gestures)
            if gesture == 'open_palms':
                eng_boost = self.np_random.uniform(0.10, 0.18)
                clarity_boost = self.np_random.uniform(0.04, 0.08)
            elif gesture == 'pointing':
                eng_boost = self.np_random.uniform(0.08, 0.14)
                clarity_boost = self.np_random.uniform(0.06, 0.10)
            else:  # hand_waves
                eng_boost = self.np_random.uniform(0.12, 0.20)
                clarity_boost = self.np_random.uniform(0.02, 0.06)
            self.engagement = min(1.0, self.engagement + eng_boost)
            self.clarity = min(1.0, self.clarity + clarity_boost)
            reward += 0.3
        elif action == 3:  # Eye contact
            eng_boost = self.np_random.uniform(0.15, 0.25)
            self.engagement = min(1.0, self.engagement + eng_boost)
            reward += 0.45
        elif action == 4:  # Next slide
            if self.current_slide < self.total_slides - 1:
                self.current_slide += 1
                self.slide_progress = float(self.current_slide / max(1, (self.total_slides - 1)))
                reward += 1.2
                self.clarity = max(0.0, self.clarity - 0.02)
            else:
                reward -= 0.15
        elif action == 5:  # Storytelling
            eng_boost = self.np_random.uniform(0.20, 0.30)
            conf_boost = self.np_random.uniform(0.05, 0.12)
            self.engagement = min(1.0, self.engagement + eng_boost)
            self.confidence = min(1.0, self.confidence + conf_boost)
            reward += 0.6

        # Natural decay
        self.confidence = max(0.0, self.confidence - 0.012)
        self.engagement = max(0.0, self.engagement - 0.018)

        # State-based reward shaping
        state_reward = (0.3 * self.confidence + 0.4 * self.engagement + 0.3 * self.clarity)
        reward += 0.15 * state_reward

        # Time update and termination
        self.time_remaining = max(0.0, self.time_remaining - self.time_decrement)
        terminated = False
        truncated = False

        if self.time_remaining <= 0:
            terminated = True
            reward += 15.0 * self.slide_progress
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
        if self.render_mode == "rgb_array":
            return self._render_frame()
        elif self.render_mode == "human":
            self._render_frame()
        return None

    def _render_frame(self):
        # Initialize pygame window if needed
        if self.screen is None and self.render_mode == "human":
            pygame.init()
            self.screen = pygame.display.set_mode(self.window_size)
            pygame.display.set_caption("🎯 Pitch Coach - AI Presentation Trainer")
            self.clock = pygame.time.Clock()
            self._init_fonts()

        canvas = pygame.Surface(self.window_size)
        canvas.fill(self.colors['background'])

        # Draw presentation area (original from pitch_env.py)
        self._draw_presentation_area(canvas)
        self._draw_metrics_panel(canvas)
        self._draw_progress_panel(canvas)
        self._draw_action_feedback(canvas)

        # Overlay current observation values
        obs_text = f"Obs: C={self.confidence:.2f} E={self.engagement:.2f} Cl={self.clarity:.2f} P={self.pace:.2f} S={self.slide_progress:.2f} T={self.time_remaining:.2f}"
        obs_surface = self.fonts['small'].render(obs_text, True, self.colors['text'])
        canvas.blit(obs_surface, (10, self.window_size[1] - 30))

        if self.render_mode == "human":
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

    def _draw_presentation_area(self, canvas):
        """Draw the main presentation area with presenter and audience"""
        # Presentation area background
        pres_rect = pygame.Rect(50, 50, 500, 400)
        pygame.draw.rect(canvas, self.colors['card'], pres_rect, border_radius=12)
        pygame.draw.rect(canvas, self.colors['primary'], pres_rect, 2, border_radius=12)

        # Title
        title = self.fonts['header'].render("Live Pitch Session", True, self.colors['text'])
        canvas.blit(title, (pres_rect.centerx - title.get_width()//2, pres_rect.y + 20))

        # Presenter (center stage)
        presenter_x, presenter_y = pres_rect.centerx, pres_rect.centery - 30
        pygame.draw.circle(canvas, self.colors['primary'], (presenter_x, presenter_y), 40)

        # Presenter details
        pygame.draw.circle(canvas, (255, 255, 255), (presenter_x - 12, presenter_y - 8), 8)
        pygame.draw.circle(canvas, (255, 255, 255), (presenter_x + 12, presenter_y - 8), 8)
        pygame.draw.arc(canvas, (255, 255, 255), (presenter_x - 15, presenter_y, 30, 20), 0, math.pi, 3)

        # Audience (more expressive)
        audience_rows, audience_cols = 3, 4
        base_x, base_y = pres_rect.x + 80, pres_rect.y + 180
        dx, dy = 80, 60

        for i in range(audience_cols):
            for j in range(audience_rows):
                x = base_x + i * dx
                y = base_y + j * dy

                # Audience engagement affects appearance
                engagement_color = self._get_engagement_color()
                pygame.draw.circle(canvas, engagement_color, (x, y), 20)

                # Audience faces based on engagement
                if self.engagement > 0.7:
                    # Happy audience
                    pygame.draw.circle(canvas, (255, 255, 255), (x - 6, y - 4), 4)
                    pygame.draw.circle(canvas, (255, 255, 255), (x + 6, y - 4), 4)
                    pygame.draw.arc(canvas, (255, 255, 255), (x - 6, y + 2, 12, 8), 0, math.pi, 2)
                else:
                    # Neutral/bored audience
                    pygame.draw.circle(canvas, (255, 255, 255), (x - 6, y - 4), 4)
                    pygame.draw.circle(canvas, (255, 255, 255), (x + 6, y - 4), 4)
                    pygame.draw.line(canvas, (255, 255, 255), (x - 6, y + 6), (x + 6, y + 6), 2)

    def _get_engagement_color(self):
        if self.engagement > 0.7:
            return self.colors['success']
        elif self.engagement > 0.4:
            return self.colors['warning']
        else:
            return self.colors['danger']

    def _draw_metrics_panel(self, canvas):
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
        # Background
        pygame.draw.rect(canvas, (230, 230, 230), (x, y, width, 25), border_radius=5)
        # Value fill
        fill_width = int(value * width)
        if fill_width > 0:
            pygame.draw.rect(canvas, color, (x, y, fill_width, 25), border_radius=5)
        # Border
        pygame.draw.rect(canvas, (200, 200, 200), (x, y, width, 25), 2, border_radius=5)
        # Label and value
        label_text = self.fonts['body'].render(f"{label}: {value:.1f}", True, self.colors['text'])
        canvas.blit(label_text, (x, y - 25))
        # Percentage
        percent_text = self.fonts['small'].render(f"{int(value*100)}%", True, self.colors['text_light'])
        canvas.blit(percent_text, (x + width + 10, y + 5))

    def _draw_progress_panel(self, canvas):
        progress_rect = pygame.Rect(580, 270, 370, 180)
        pygame.draw.rect(canvas, self.colors['card'], progress_rect, border_radius=12)
        pygame.draw.rect(canvas, self.colors['primary'], progress_rect, 2, border_radius=12)

        title = self.fonts['header'].render("Progress & Timing", True, self.colors['text'])
        canvas.blit(title, (progress_rect.centerx - title.get_width()//2, progress_rect.y + 15))

        slide_y = progress_rect.y + 50
        slide_text = self.fonts['body'].render(f"Slide: {self.current_slide + 1}/{self.total_slides}", True, self.colors['text'])
        canvas.blit(slide_text, (600, slide_y))
        self._draw_progress_bar(canvas, "Completion", self.slide_progress, 600, slide_y + 30, 320)

        time_y = slide_y + 80
        remaining_seconds = self.time_remaining * self.total_pitch_seconds
        time_text = self.fonts['body'].render(f"Time: {remaining_seconds:.1f}s / {self.total_pitch_seconds}s", True, self.colors['text'])
        canvas.blit(time_text, (600, time_y))
        self._draw_progress_bar(canvas, "Time", self.time_remaining, 600, time_y + 30, 320, self.colors['warning'])

    def _draw_progress_bar(self, canvas, label, value, x, y, width, color=None):
        if color is None:
            color = self.colors['primary']
        pygame.draw.rect(canvas, (230, 230, 230), (x, y, width, 12), border_radius=6)
        progress_width = int(value * width)
        if progress_width > 0:
            pygame.draw.rect(canvas, color, (x, y, progress_width, 12), border_radius=6)
        pygame.draw.rect(canvas, (200, 200, 200), (x, y, width, 12), 1, border_radius=6)

    def _draw_action_feedback(self, canvas):
        feedback_rect = pygame.Rect(50, 470, 900, 200)
        pygame.draw.rect(canvas, self.colors['card'], feedback_rect, border_radius=12)
        pygame.draw.rect(canvas, self.colors['primary'], feedback_rect, 2, border_radius=12)

        title = self.fonts['header'].render("Current Status", True, self.colors['text'])
        canvas.blit(title, (feedback_rect.centerx - title.get_width()//2, feedback_rect.y + 15))

        if self.last_action is not None:
            action_text = self.fonts['body'].render(
                f"Last Action: {self.action_meanings[self.last_action]}",
                True, self.colors['primary']
            )
            canvas.blit(action_text, (80, feedback_rect.y + 50))

        step_text = self.fonts['body'].render(f"Step: {self.step_count}", True, self.colors['text_light'])
        canvas.blit(step_text, (80, feedback_rect.y + 80))

        actions_text = self.fonts['small'].render(
            "Available Actions: 1=Energy 2=Gestures 3=Eye Contact 4=Next Slide 5=Storytelling",
            True, self.colors['text_light']
        )
        canvas.blit(actions_text, (80, feedback_rect.y + 110))

        tips_y = feedback_rect.y + 135
        tip = self._get_performance_tip()
        tip_text = self.fonts['small'].render(f"Tip: {tip}", True, self.colors['warning'])
        canvas.blit(tip_text, (80, tips_y))

    def _get_performance_tip(self):
        if self.engagement < 0.4:
            return "Try using gestures or eye contact to boost engagement!"
        elif self.confidence < 0.4:
            return "Increase your energy to build confidence!"
        elif self.clarity < 0.4:
            return "Use storytelling to improve clarity!"
        elif self.slide_progress < 0.5 and self.time_remaining < 0.5:
            return "Consider moving to next slide to maintain pace"
        else:
            return "Great! Maintain your current presentation style"

    def close(self):
        if self.screen is not None:
            pygame.display.quit()
            pygame.quit()
            self.screen = None
            self.clock = None


# Backward-compatible alias used by training/evaluation scripts
PitchEnv = PitchCoachEnv