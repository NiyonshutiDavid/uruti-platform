import math
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pygame

from .presentation_pitch_env import PresentationPitchEnv


class PitchCoachFounderEnv(PresentationPitchEnv):
    """
    Founder-facing Pitch Coach environment inspired by the web Pitch Coach UI.

    Adds:
    - Real-time coaching metrics panel (pacing, clarity, confidence, engagement, structure)
    - Live feedback stream and contextual coaching tips
    - End-of-session scorecard with weighted final score
    """

    metadata = {'render_modes': ['human', 'rgb_array'], 'render_fps': 30}

    def __init__(
        self,
        render_mode: Optional[str] = None,
        total_slides: int = 10,
        seed: Optional[int] = None,
        slide_images_dir: Optional[str] = None,
        slide_duration: float = 30.0,
        venture_name: str = 'Founder Venture',
        pitch_type: str = 'Investor Pitch',
        target_duration_min: float = 5.0,
    ):
        super().__init__(
            render_mode=render_mode,
            total_slides=total_slides,
            seed=seed,
            slide_images_dir=slide_images_dir,
            slide_duration=slide_duration,
            use_video_backgrounds=False,
            video_path=None,
        )

        self.venture_name = venture_name
        self.pitch_type = pitch_type
        self.target_duration_min = float(target_duration_min)

        self.window_size = (1280, 760)
        self.session_complete = False
        self.final_scores: Optional[Dict[str, float]] = None
        self.live_feedback: List[Dict[str, str]] = []

        self.session_flags = {
            'camera_active': True,
            'microphone_active': True,
            'screen_sharing': False,
            'is_recording': True,
            'ai_listening': True,
        }

        self.brand_colors = {
            'green': (118, 185, 71),
            'green_dark': (90, 143, 53),
            'slate': (31, 41, 55),
            'card': (255, 255, 255),
            'muted': (107, 114, 128),
            'bg': (244, 247, 250),
            'warning': (245, 158, 11),
            'info': (59, 130, 246),
            'danger': (239, 68, 68),
        }

    def reset(self, seed: Optional[int] = None, options: Optional[dict] = None) -> Tuple[np.ndarray, Dict]:
        obs, info = super().reset(seed=seed, options=options)
        self.session_complete = False
        self.final_scores = None
        self.live_feedback = []
        self._append_feedback('positive', 'Session started. Open with a clear problem statement.')
        return obs, self._enrich_info(info)

    def step(self, action: int):
        result = super().step(action)

        if len(result) == 6:
            obs, reward, terminated, truncated, info, frame = result
            info = self._after_step(info, terminated or truncated)
            return obs, reward, terminated, truncated, info, frame

        obs, reward, terminated, truncated, info = result
        info = self._after_step(info, terminated or truncated)
        return obs, reward, terminated, truncated, info

    def _after_step(self, info: Dict[str, Any], done: bool) -> Dict[str, Any]:
        if self.step_count % 6 == 0:
            tip = self._get_performance_tip()
            feedback_type = 'warning' if self.engagement < 0.45 or self.clarity < 0.45 else 'positive'
            self._append_feedback(feedback_type, tip)

        if done:
            self.session_complete = True
            self.final_scores = self._compute_final_scores()

        return self._enrich_info(info)

    def _enrich_info(self, info: Dict[str, Any]) -> Dict[str, Any]:
        info = dict(info)
        info['coach_metrics'] = self._compute_coach_metrics()
        info['live_tip'] = self._get_performance_tip()
        info['live_feedback'] = list(self.live_feedback[-4:])
        info['session_flags'] = dict(self.session_flags)
        if self.final_scores is not None:
            info['final_scores'] = dict(self.final_scores)
        return info

    def _compute_coach_metrics(self) -> Dict[str, float]:
        pacing = max(0.0, min(1.0, 1.0 - abs(self.pace - 1.0) / 0.8))
        structure = max(0.0, min(1.0, 0.65 * self.slide_progress + 0.35 * self.clarity))

        return {
            'pacing': pacing,
            'clarity': self.clarity,
            'confidence': self.confidence,
            'engagement': self.engagement,
            'structure': structure,
        }

    def _compute_final_scores(self) -> Dict[str, float]:
        metrics = self._compute_coach_metrics()
        scores = {k: round(v * 100.0, 1) for k, v in metrics.items()}
        overall = (
            0.20 * scores['pacing']
            + 0.20 * scores['clarity']
            + 0.20 * scores['confidence']
            + 0.25 * scores['engagement']
            + 0.15 * scores['structure']
        )
        scores['overall'] = round(overall, 1)
        scores['reward'] = round(float(self.episode_reward), 2)
        scores['slides_completed'] = float(self.current_slide + 1)
        return scores

    def _append_feedback(self, feedback_type: str, message: str) -> None:
        total_elapsed = (1.0 - self.time_remaining) * self.slide_duration
        mins = int(total_elapsed // 60)
        secs = int(total_elapsed % 60)
        self.live_feedback.append(
            {
                'type': feedback_type,
                'message': message,
                'time': f'{mins}:{secs:02d}',
            }
        )

    def _render_frame(self):
        if self.screen is None and self.render_mode == 'human':
            pygame.init()
            self.screen = pygame.display.set_mode(self.window_size)
            pygame.display.set_caption('Pitch Coach - Founder Practice Environment')
            self.clock = pygame.time.Clock()
            self._init_fonts()

        canvas = pygame.Surface(self.window_size)
        canvas.fill(self.brand_colors['bg'])

        self._draw_founder_header(canvas)
        self._draw_main_video_panel(canvas)
        self._draw_controls_bar(canvas)
        self._draw_sidebar(canvas)

        if self.session_complete and self.final_scores is not None:
            self._draw_final_score_overlay(canvas)

        if self.render_mode == 'human':
            if self.screen is None:
                self.screen = pygame.display.set_mode(self.window_size)
            self.screen.blit(canvas, (0, 0))
            pygame.event.pump()
            pygame.display.flip()
            if self.clock:
                self.clock.tick(self.metadata['render_fps'])
            return None

        arr = pygame.surfarray.pixels3d(canvas).copy()
        return np.transpose(arr, (1, 0, 2))

    def _init_fonts(self):
        if self.screen:
            self.fonts = {
                'title': pygame.font.Font(None, 40),
                'header': pygame.font.Font(None, 30),
                'body': pygame.font.Font(None, 22),
                'metric': pygame.font.Font(None, 20),
                'small': pygame.font.Font(None, 18),
                'tiny': pygame.font.Font(None, 16),
            }

    def _draw_founder_header(self, canvas: pygame.Surface) -> None:
        title = self.fonts['title'].render('Pitch Coach', True, self.brand_colors['slate'])
        subtitle = self.fonts['small'].render(
            'Practice your pitch with AI-powered real-time coaching',
            True,
            self.brand_colors['muted'],
        )
        canvas.blit(title, (30, 16))
        canvas.blit(subtitle, (30, 52))

    def _draw_main_video_panel(self, canvas: pygame.Surface) -> None:
        panel = pygame.Rect(30, 90, 820, 430)
        pygame.draw.rect(canvas, self.brand_colors['card'], panel, border_radius=14)
        pygame.draw.rect(canvas, (0, 0, 0), panel, 1, border_radius=14)

        viewport = pygame.Rect(panel.x + 16, panel.y + 16, panel.width - 32, panel.height - 32)
        pygame.draw.rect(canvas, (16, 24, 39), viewport, border_radius=10)

        if self.slide_images and self.current_slide < len(self.slide_images):
            slide_img = self.slide_images[self.current_slide]
            slide_surface = pygame.surfarray.make_surface(np.transpose(slide_img, (1, 0, 2)))
            fit = pygame.transform.smoothscale(slide_surface, (viewport.width, viewport.height))
            canvas.blit(fit, (viewport.x, viewport.y))
        else:
            placeholder = self.fonts['header'].render('Camera Off', True, (243, 244, 246))
            helper = self.fonts['small'].render('Start practice to simulate founder pitch flow', True, (156, 163, 175))
            canvas.blit(
                placeholder,
                (viewport.centerx - placeholder.get_width() // 2, viewport.centery - 24),
            )
            canvas.blit(
                helper,
                (viewport.centerx - helper.get_width() // 2, viewport.centery + 8),
            )

        # AI listening strip
        if not self.session_complete:
            strip = pygame.Rect(viewport.x + 12, viewport.y + 12, 290, 36)
            pygame.draw.rect(canvas, (0, 0, 0), strip, border_radius=18)
            lbl = self.fonts['small'].render('AI Coach is listening...', True, (255, 255, 255))
            canvas.blit(lbl, (strip.x + 12, strip.y + 10))

        # Timer badge
        elapsed = (1.0 - self.time_remaining) * self.slide_duration
        mins = int(elapsed // 60)
        secs = int(elapsed % 60)
        badge = pygame.Rect(viewport.right - 118, viewport.y + 12, 104, 34)
        pygame.draw.rect(canvas, (127, 29, 29), badge, border_radius=17)
        txt = self.fonts['small'].render(f'{mins}:{secs:02d}', True, (255, 255, 255))
        canvas.blit(txt, (badge.centerx - txt.get_width() // 2, badge.y + 9))

        # Live toast
        toast_msg = self._get_performance_tip()
        toast = pygame.Rect(viewport.x + 16, viewport.bottom - 52, viewport.width - 32, 36)
        pygame.draw.rect(canvas, (15, 23, 42), toast, border_radius=8)
        tip_text = self.fonts['small'].render(toast_msg, True, (255, 255, 255))
        canvas.blit(tip_text, (toast.x + 10, toast.y + 10))

    def _draw_controls_bar(self, canvas: pygame.Surface) -> None:
        controls = pygame.Rect(30, 534, 820, 62)
        pygame.draw.rect(canvas, (3, 7, 18), controls, border_radius=12)

        pills = [
            ('Mic', self.session_flags['microphone_active']),
            ('Camera', self.session_flags['camera_active']),
            ('Present', self.session_flags['screen_sharing']),
            ('Recording', self.session_flags['is_recording']),
        ]
        x = controls.x + 16
        for label, active in pills:
            color = self.brand_colors['green'] if active else self.brand_colors['danger']
            pill = pygame.Rect(x, controls.y + 14, 120, 34)
            pygame.draw.rect(canvas, color, pill, border_radius=17)
            text = self.fonts['small'].render(label, True, (255, 255, 255))
            canvas.blit(text, (pill.centerx - text.get_width() // 2, pill.y + 9))
            x += 132

        action_name = self.action_meanings[self.last_action] if self.last_action is not None else 'Session Ready'
        action_txt = self.fonts['small'].render(f'Last action: {action_name}', True, (229, 231, 235))
        canvas.blit(action_txt, (controls.right - action_txt.get_width() - 20, controls.y + 22))

    def _draw_sidebar(self, canvas: pygame.Surface) -> None:
        x0 = 870

        self._draw_session_info(canvas, x0, 90, 380, 170)
        self._draw_realtime_metrics(canvas, x0, 274, 380, 190)
        self._draw_feedback_and_tips(canvas, x0, 478, 380, 220)

    def _draw_session_info(self, canvas: pygame.Surface, x: int, y: int, w: int, h: int) -> None:
        card = pygame.Rect(x, y, w, h)
        pygame.draw.rect(canvas, self.brand_colors['card'], card, border_radius=12)
        pygame.draw.rect(canvas, (0, 0, 0), card, 1, border_radius=12)

        title = self.fonts['header'].render('Session Info', True, self.brand_colors['slate'])
        canvas.blit(title, (x + 14, y + 12))

        lines = [
            ('Current Venture', self.venture_name),
            ('Pitch Type', self.pitch_type),
            ('Target Duration', f'{self.target_duration_min:.0f} minutes'),
            ('Slide Progress', f'{self.current_slide + 1}/{self.total_slides}'),
        ]

        yy = y + 52
        for label, value in lines:
            lb = self.fonts['tiny'].render(label, True, self.brand_colors['muted'])
            vv = self.fonts['small'].render(value, True, self.brand_colors['slate'])
            canvas.blit(lb, (x + 14, yy))
            canvas.blit(vv, (x + 170, yy))
            yy += 26

    def _draw_realtime_metrics(self, canvas: pygame.Surface, x: int, y: int, w: int, h: int) -> None:
        card = pygame.Rect(x, y, w, h)
        pygame.draw.rect(canvas, self.brand_colors['card'], card, border_radius=12)
        pygame.draw.rect(canvas, (0, 0, 0), card, 1, border_radius=12)

        title = self.fonts['header'].render('Real-time Performance Metrics', True, self.brand_colors['slate'])
        canvas.blit(title, (x + 12, y + 12))

        metrics = self._compute_coach_metrics()
        order = ['pacing', 'clarity', 'confidence', 'engagement', 'structure']

        yy = y + 48
        for key in order:
            val = max(0.0, min(1.0, metrics[key]))
            label = self.fonts['tiny'].render(key.capitalize(), True, self.brand_colors['slate'])
            pct = self.fonts['tiny'].render(f'{int(val * 100)}%', True, self.brand_colors['green'])
            canvas.blit(label, (x + 14, yy))
            canvas.blit(pct, (x + w - 48, yy))

            bar_bg = pygame.Rect(x + 96, yy + 2, w - 152, 14)
            pygame.draw.rect(canvas, (229, 231, 235), bar_bg, border_radius=7)
            fill = pygame.Rect(bar_bg.x, bar_bg.y, int(bar_bg.width * val), bar_bg.height)
            pygame.draw.rect(canvas, self.brand_colors['green'], fill, border_radius=7)
            yy += 28

    def _draw_feedback_and_tips(self, canvas: pygame.Surface, x: int, y: int, w: int, h: int) -> None:
        card = pygame.Rect(x, y, w, h)
        pygame.draw.rect(canvas, self.brand_colors['card'], card, border_radius=12)
        pygame.draw.rect(canvas, (0, 0, 0), card, 1, border_radius=12)

        title = self.fonts['header'].render('Live Feedback & Tips', True, self.brand_colors['slate'])
        canvas.blit(title, (x + 12, y + 10))

        feedback_rows = self.live_feedback[-3:] if self.live_feedback else []
        yy = y + 42
        for row in feedback_rows:
            color = self.brand_colors['green'] if row['type'] == 'positive' else self.brand_colors['warning']
            dot = pygame.Rect(x + 14, yy + 6, 8, 8)
            pygame.draw.ellipse(canvas, color, dot)
            msg = self.fonts['tiny'].render(row['message'][:50], True, self.brand_colors['slate'])
            tm = self.fonts['tiny'].render(row['time'], True, self.brand_colors['muted'])
            canvas.blit(msg, (x + 30, yy))
            canvas.blit(tm, (x + w - 50, yy))
            yy += 24

        tips = [
            'Start with a compelling hook.',
            'Maintain camera eye contact.',
            'Use evidence for market claims.',
            'Keep transitions smooth between slides.',
        ]

        yy += 8
        for tip in tips:
            bullet = self.fonts['tiny'].render(f'• {tip}', True, self.brand_colors['muted'])
            canvas.blit(bullet, (x + 14, yy))
            yy += 20

    def _draw_final_score_overlay(self, canvas: pygame.Surface) -> None:
        overlay = pygame.Surface(self.window_size, pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 130))
        canvas.blit(overlay, (0, 0))

        modal = pygame.Rect(300, 170, 680, 400)
        pygame.draw.rect(canvas, (255, 255, 255), modal, border_radius=16)
        pygame.draw.rect(canvas, self.brand_colors['green_dark'], modal, 2, border_radius=16)

        title = self.fonts['title'].render('Pitch Coach Scorecard', True, self.brand_colors['slate'])
        canvas.blit(title, (modal.centerx - title.get_width() // 2, modal.y + 24))

        overall = self.final_scores.get('overall', 0.0)
        big = self.fonts['title'].render(f'Overall Score: {overall:.1f}/100', True, self.brand_colors['green_dark'])
        canvas.blit(big, (modal.centerx - big.get_width() // 2, modal.y + 74))

        left = modal.x + 50
        right = modal.x + 360
        y = modal.y + 150

        left_fields = ['pacing', 'clarity', 'confidence']
        right_fields = ['engagement', 'structure', 'reward']

        for name in left_fields:
            value = self.final_scores.get(name, 0.0)
            row = self.fonts['body'].render(f'{name.capitalize()}: {value:.1f}', True, self.brand_colors['slate'])
            canvas.blit(row, (left, y))
            y += 40

        y = modal.y + 150
        for name in right_fields:
            value = self.final_scores.get(name, 0.0)
            label = 'Episode Reward' if name == 'reward' else name.capitalize()
            row = self.fonts['body'].render(f'{label}: {value:.1f}', True, self.brand_colors['slate'])
            canvas.blit(row, (right, y))
            y += 40

        footer = self.fonts['small'].render(
            f'Slides completed: {int(self.final_scores.get("slides_completed", 0))}/{self.total_slides}',
            True,
            self.brand_colors['muted'],
        )
        canvas.blit(footer, (modal.centerx - footer.get_width() // 2, modal.bottom - 48))

    def _get_performance_tip(self):
        metrics = self._compute_coach_metrics()

        if metrics['engagement'] < 0.45:
            return 'Engagement is dropping. Use stronger storytelling now.'
        if metrics['clarity'] < 0.45:
            return 'Clarify your value proposition in one sentence.'
        if metrics['confidence'] < 0.45:
            return 'Project confidence: stronger voice and posture.'
        if metrics['pacing'] < 0.45:
            return 'Adjust pacing: slow down and emphasize key points.'
        if self.slide_progress < 0.5 and self.time_remaining < 0.45:
            return 'Advance slides a bit faster to stay on schedule.'
        return 'Great flow. Keep this rhythm and finish with a strong ask.'
