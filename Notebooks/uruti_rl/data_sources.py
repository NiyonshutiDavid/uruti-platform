from pathlib import Path
from typing import Dict, List, Optional, Union

import numpy as np


VideoSource = Union[int, str, Path]
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}


def parse_video_source(raw_source):
    if raw_source is None:
        return None
    if isinstance(raw_source, int):
        return raw_source
    text = str(raw_source).strip()
    if text.isdigit():
        return int(text)
    return text


def directory_has_videos(root: Union[str, Path]) -> bool:
    root_path = Path(root)
    if not root_path.exists() or not root_path.is_dir():
        return False
    for path in root_path.rglob("*"):
        if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS:
            return True
    return False


def resolve_default_meld_video_source(base_file: str) -> Optional[str]:
    base = Path(base_file).resolve().parent
    candidates = [
        base / ".." / "Data" / "MELD.Raw",
        base / ".." / ".." / "Data" / "MELD.Raw",
        base / "Data" / "MELD.Raw",
    ]

    for candidate in candidates:
        resolved = candidate.resolve()
        if directory_has_videos(resolved):
            return str(resolved)

    return None


def collect_video_files(root: Union[str, Path]) -> List[Path]:
    root_path = Path(root)
    if not root_path.exists() or not root_path.is_dir():
        return []
    files = [p for p in root_path.rglob("*") if p.is_file() and p.suffix.lower() in VIDEO_EXTENSIONS]
    files.sort()
    return files


def sample_evenly(files: List[Path], limit: int) -> List[Path]:
    if limit <= 0 or len(files) <= limit:
        return files
    indices = np.linspace(0, len(files) - 1, num=limit, dtype=int)
    return [files[i] for i in indices]


def resolve_meld_category_dirs(meld_root: Union[str, Path]) -> Dict[str, Path]:
    root = Path(meld_root)
    return {
        "train": (root / "train" / "train_splits").resolve(),
        "test": (root / "dev_splits_complete").resolve(),
        "output": (root / "output_repeated_splits_test").resolve(),
    }
