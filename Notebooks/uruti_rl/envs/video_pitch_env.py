from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import cv2
import gymnasium as gym
import numpy as np
from gymnasium import spaces

from data_sources import (
	collect_video_files,
	resolve_default_meld_video_source,
	resolve_meld_category_dirs,
	sample_evenly,
)
from models.feature_extractor import VideoFeatureExtractor


VideoSource = Union[int, str, Path]


class VideoPitchEnv(gym.Env):
	metadata = {"render_modes": ["human", "rgb_array"], "render_fps": 30}

	def __init__(
		self,
		video_source: Optional[VideoSource] = None,
		render_mode: Optional[str] = None,
		frame_skip: int = 4,
		max_steps: int = 300,
		max_videos_per_category: int = 100,
		max_videos_total: int = 0,
	):
		super().__init__()
		self.render_mode = render_mode
		self.frame_skip = max(1, int(frame_skip))
		self.max_steps = max(1, int(max_steps))
		self.max_videos_per_category = max(1, int(max_videos_per_category))
		self.max_videos_total = max(0, int(max_videos_total))

		self.action_space = spaces.Discrete(6)
		self.action_meanings = [
			"Maintain Style",
			"Increase Energy",
			"Use Gestures",
			"Eye Contact",
			"Next Slide",
			"Storytelling",
		]
		self.observation_space = spaces.Box(
			low=np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0], dtype=np.float32),
			high=np.array([1.0, 1.0, 1.0, 2.0, 1.0, 1.0], dtype=np.float32),
			dtype=np.float32,
		)

		self.feature_extractor = VideoFeatureExtractor(use_face=True, use_pose=True, use_hands=False)
		self.video_source = video_source
		self._camera_index: Optional[int] = None
		self.video_files: List[Path] = []
		self.category_video_counts: Dict[str, int] = {}
		self._video_cursor = 0
		self.cap: Optional[cv2.VideoCapture] = None

		self.step_count = 0
		self.current_frame_idx = 0
		self.current_video_name = ""
		self.confidence = 0.5
		self.engagement = 0.5
		self.clarity = 0.5
		self.pace = 1.0
		self.slide_progress = 0.0
		self.time_remaining = 1.0

		self._resolved_sources = self._resolve_video_source(video_source)

	def _resolve_video_source(self, source: Optional[VideoSource]) -> Dict[str, Any]:
		if source is None:
			source = resolve_default_meld_video_source(__file__)
			if source is None:
				raise ValueError(
					"No video source provided and no MELD.Raw video dataset found. Pass a video file, folder, or camera index."
				)

		if isinstance(source, int):
			self._camera_index = source
			return {"type": "camera", "camera_index": source}

		source_path = Path(str(source)).expanduser().resolve()
		if not source_path.exists():
			raise FileNotFoundError(f"Video source not found: {source_path}")

		if source_path.is_file():
			if source_path.suffix.lower() not in {".mp4", ".mov", ".avi", ".mkv", ".webm"}:
				raise ValueError(f"Unsupported video file type: {source_path.suffix}")
			self.video_files = [source_path]
			return {"type": "file", "files": self.video_files}

		files, category_counts = self._collect_folder_video_files(source_path)
		if not files:
			raise ValueError(f"No video files found under folder: {source_path}")
		self.video_files = files
		self.category_video_counts = category_counts
		return {"type": "folder", "files": self.video_files}

	def _collect_folder_video_files(self, folder: Path) -> Tuple[List[Path], Dict[str, int]]:
		if folder.name == "MELD.Raw":
			category_dirs = resolve_meld_category_dirs(folder)
			selected: List[Path] = []
			counts: Dict[str, int] = {}
			for category in ("output", "test", "train"):
				category_path = category_dirs[category]
				files = collect_video_files(category_path)
				limited = sample_evenly(files, self.max_videos_per_category)
				counts[category] = len(limited)
				selected.extend(limited)
			selected.sort()
			return selected, counts

		files = collect_video_files(folder)
		if self.max_videos_total > 0:
			files = sample_evenly(files, self.max_videos_total)
		return files, {"all": len(files)}

	def _open_next_capture(self) -> bool:
		self._release_capture()

		source_type = self._resolved_sources["type"]
		if source_type == "camera":
			self.current_video_name = f"camera:{self._camera_index}"
			self.cap = cv2.VideoCapture(self._camera_index)
			return bool(self.cap is not None and self.cap.isOpened())

		if not self.video_files:
			return False

		path = self.video_files[self._video_cursor % len(self.video_files)]
		self._video_cursor += 1
		self.current_video_name = path.name
		self.cap = cv2.VideoCapture(str(path))
		self.current_frame_idx = 0
		return bool(self.cap is not None and self.cap.isOpened())

	def _release_capture(self) -> None:
		if self.cap is not None:
			self.cap.release()
			self.cap = None

	def reset(self, seed: Optional[int] = None, options: Optional[dict] = None) -> Tuple[np.ndarray, Dict[str, Any]]:
		super().reset(seed=seed)
		self.step_count = 0
		self.current_frame_idx = 0
		self.confidence = 0.5
		self.engagement = 0.5
		self.clarity = 0.5
		self.pace = 1.0
		self.slide_progress = 0.0
		self.time_remaining = 1.0

		opened = self._open_next_capture()
		if not opened:
			raise RuntimeError("Unable to open video source for reset.")

		frame = self._read_frame()
		if frame is None:
			raise RuntimeError("Unable to read first frame from video source.")

		self._update_metrics_from_frame(frame)
		obs = self._get_obs()
		info = self._get_info()
		if self.render_mode == "human":
			self._render_frame(frame)
		return obs, info

	def _read_frame(self) -> Optional[np.ndarray]:
		if self.cap is None:
			return None

		frame = None
		for _ in range(self.frame_skip):
			ok, f = self.cap.read()
			if not ok:
				frame = None
				break
			frame = f
			self.current_frame_idx += 1

		if frame is not None:
			return frame

		if self._resolved_sources["type"] in {"file", "folder"} and self.video_files:
			if not self._open_next_capture():
				return None
			ok, f = self.cap.read() if self.cap is not None else (False, None)
			if ok:
				self.current_frame_idx += 1
				return f
		return None

	def _update_metrics_from_frame(self, frame: np.ndarray) -> None:
		features = self.feature_extractor.extract(frame)

		face_dim = 468 * 3
		pose_dim = 33 * 3
		face_features = features[:face_dim]
		pose_features = features[face_dim : face_dim + pose_dim]

		face_present = float(np.mean(np.abs(face_features) > 1e-6))
		pose_present = float(np.mean(np.abs(pose_features) > 1e-6))

		gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
		sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
		sharpness_norm = float(np.clip(sharpness / 500.0, 0.0, 1.0))

		self.confidence = float(np.clip(0.25 + 0.75 * face_present, 0.0, 1.0))
		self.engagement = float(np.clip(0.25 + 0.75 * pose_present, 0.0, 1.0))
		self.clarity = float(np.clip(sharpness_norm, 0.0, 1.0))

	def _get_obs(self) -> np.ndarray:
		return np.array(
			[
				self.confidence,
				self.engagement,
				self.clarity,
				self.pace,
				self.slide_progress,
				self.time_remaining,
			],
			dtype=np.float32,
		)

	def _get_info(self) -> Dict[str, Any]:
		return {
			"video": self.current_video_name,
			"frame_index": self.current_frame_idx,
			"category_video_counts": self.category_video_counts,
			"metrics": {
				"confidence": self.confidence,
				"engagement": self.engagement,
				"clarity": self.clarity,
				"pace": self.pace,
			},
		}

	def step(self, action: int):
		assert self.action_space.contains(action)
		self.step_count += 1

		frame = self._read_frame()
		terminated = False
		truncated = False

		if frame is None:
			terminated = True
			reward = 0.0
			obs = self._get_obs()
			info = self._get_info()
			return obs, reward, terminated, truncated, info

		self._update_metrics_from_frame(frame)

		if action == 1:
			self.engagement = float(np.clip(self.engagement + 0.05, 0.0, 1.0))
		elif action == 2:
			self.confidence = float(np.clip(self.confidence + 0.03, 0.0, 1.0))
		elif action == 3:
			self.engagement = float(np.clip(self.engagement + 0.07, 0.0, 1.0))
		elif action == 5:
			self.confidence = float(np.clip(self.confidence + 0.04, 0.0, 1.0))
			self.engagement = float(np.clip(self.engagement + 0.04, 0.0, 1.0))

		self.slide_progress = float(np.clip(self.step_count / self.max_steps, 0.0, 1.0))
		self.time_remaining = float(np.clip(1.0 - (self.step_count / self.max_steps), 0.0, 1.0))

		reward = float(0.35 * self.confidence + 0.4 * self.engagement + 0.25 * self.clarity)
		if action == 4:
			reward += 0.05

		if self.step_count >= self.max_steps:
			terminated = True

		if self.render_mode == "human":
			self._render_frame(frame)

		obs = self._get_obs()
		info = self._get_info()
		return obs, reward, terminated, truncated, info

	def _render_frame(self, frame: np.ndarray):
		display = frame.copy()
		text = (
			f"{self.current_video_name} | conf={self.confidence:.2f} "
			f"eng={self.engagement:.2f} cla={self.clarity:.2f}"
		)
		cv2.putText(display, text, (12, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

		if self.render_mode == "human":
			cv2.imshow("VideoPitchEnv", display)
			cv2.waitKey(1)
			return None
		if self.render_mode == "rgb_array":
			return cv2.cvtColor(display, cv2.COLOR_BGR2RGB)
		return None

	def render(self):
		return None

	def close(self):
		self._release_capture()
		if self.render_mode == "human":
			cv2.destroyAllWindows()
