# Slide Management Utilities for Presentation Environment
from pathlib import Path
from typing import List, Optional, Dict, Any
import cv2
import numpy as np
from dataclasses import dataclass


@dataclass
class SlideMetadata:
    """Metadata for a slide."""
    index: int
    filename: str
    duration: float  # Time to display this slide in seconds
    custom_actions: Optional[Dict[int, float]] = None  # Reward multipliers for specific actions


class SlideManager:
    """
    Manages slide collections for presentation environments.
    
    Features:
    - Load slides from directory
    - Track slide metadata and durations
    - Support for different slide types (images, videos)
    - Automatic slide timing and transitions
    """
    
    def __init__(self, slides_dir: Optional[str] = None, total_slides: int = 10):
        """
        Initialize slide manager.
        
        Args:
            slides_dir: Directory containing slide images
            total_slides: Total number of slides in presentation
        """
        self.slides_dir = Path(slides_dir) if slides_dir else None
        self.total_slides = int(max(1, total_slides))
        self.slides: List[SlideMetadata] = []
        self.slide_images: Dict[int, np.ndarray] = {}
        self.default_slide_duration = 30.0 / total_slides  # Divide total time equally
        
        if self.slides_dir:
            self._load_slides()
    
    def _load_slides(self):
        """Load slides from directory."""
        if not self.slides_dir or not self.slides_dir.exists():
            print(f"Slides directory not found: {self.slides_dir}")
            return
        
        # Supported image formats
        image_extensions = {'.png', '.jpg', '.jpeg', '.bmp', '.gif'}
        image_files = sorted([
            f for f in self.slides_dir.iterdir()
            if f.suffix.lower() in image_extensions
        ])
        
        if not image_files:
            print(f"No image files found in {self.slides_dir}")
            return
        
        # Create slide metadata
        for idx, img_path in enumerate(image_files[:self.total_slides]):
            # Load image
            img = cv2.imread(str(img_path))
            if img is not None:
                # Resize to standard size
                img = cv2.resize(img, (500, 400))
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                self.slide_images[idx] = img
                
                # Create metadata
                slide_meta = SlideMetadata(
                    index=idx,
                    filename=img_path.name,
                    duration=self.default_slide_duration
                )
                self.slides.append(slide_meta)
        
        print(f"Loaded {len(self.slides)} slides from {self.slides_dir}")
    
    def get_slide(self, index: int) -> Optional[np.ndarray]:
        """Get slide image by index."""
        if index < 0 or index >= len(self.slide_images):
            return None
        return self.slide_images.get(index)
    
    def get_metadata(self, index: int) -> Optional[SlideMetadata]:
        """Get slide metadata by index."""
        if index < 0 or index >= len(self.slides):
            return None
        return self.slides[index]
    
    def get_all_slides(self) -> Dict[int, np.ndarray]:
        """Get all loaded slide images."""
        return self.slide_images.copy()
    
    def add_slide_timing(self, index: int, duration: float):
        """Update slide display duration."""
        if 0 <= index < len(self.slides):
            self.slides[index].duration = float(max(0.1, duration))
    
    def add_custom_actions(self, index: int, action_rewards: Dict[int, float]):
        """Add custom action rewards for specific slide."""
        if 0 <= index < len(self.slides):
            self.slides[index].custom_actions = action_rewards
    
    def get_total_duration(self) -> float:
        """Get total presentation duration."""
        return sum(slide.duration for slide in self.slides)
    
    def create_sample_presentation(self, output_dir: Optional[str] = None) -> Path:
        """
        Create a sample presentation with dummy slides.
        
        Args:
            output_dir: Directory to save sample slides
            
        Returns:
            Path to the sample presentation directory
        """
        if output_dir is None:
            output_dir = Path.cwd() / "sample_presentation"
        else:
            output_dir = Path(output_dir)
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Create sample slides with text
        for i in range(self.total_slides):
            # Create blank slide
            slide = np.ones((400, 500, 3), dtype=np.uint8) * 255
            
            # Add gradient background
            for y in range(400):
                color_val = int(255 * (1 - y / 400))
                slide[y, :] = [color_val, color_val + 50, 255]
            
            # Add slide number
            text = f"Slide {i + 1}"
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 2
            thickness = 3
            text_size = cv2.getTextSize(text, font, font_scale, thickness)[0]
            text_x = (slide.shape[1] - text_size[0]) // 2
            text_y = (slide.shape[0] + text_size[1]) // 2
            
            cv2.putText(slide, text, (text_x, text_y), font, font_scale, (255, 255, 255), thickness)
            
            # Save slide
            output_path = output_dir / f"slide_{i+1:02d}.png"
            slide_bgr = cv2.cvtColor(slide, cv2.COLOR_RGB2BGR)
            cv2.imwrite(str(output_path), slide_bgr)
        
        print(f"Created sample presentation with {self.total_slides} slides in {output_dir}")
        return output_dir


class PresentationConfig:
    """Configuration for presentation-based training."""
    
    def __init__(
        self,
        total_slides: int = 10,
        total_duration: float = 30.0,
        slides_dir: Optional[str] = None,
        use_sample_slides: bool = False,
        slide_timing: Optional[Dict[int, float]] = None,  # Custom timing per slide
        custom_action_rewards: Optional[Dict[int, Dict[int, float]]] = None,  # Custom rewards
    ):
        """
        Initialize presentation config.
        
        Args:
            total_slides: Number of slides
            total_duration: Total presentation duration in seconds
            slides_dir: Directory with slide images
            use_sample_slides: Create sample slides if none provided
            slide_timing: Custom duration for each slide
            custom_action_rewards: Custom action rewards per slide
        """
        self.total_slides = int(max(1, total_slides))
        self.total_duration = float(max(1, total_duration))
        self.slides_dir = slides_dir
        self.use_sample_slides = use_sample_slides
        self.slide_timing = slide_timing or {}
        self.custom_action_rewards = custom_action_rewards or {}
        
        # Initialize slide manager
        self.slide_manager = SlideManager(slides_dir, total_slides)
        
        # Create sample slides if needed
        if use_sample_slides and not self.slides_dir:
            sample_dir = self.slide_manager.create_sample_presentation()
            self.slide_manager.slides_dir = sample_dir
            self.slide_manager._load_slides()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'total_slides': self.total_slides,
            'total_duration': self.total_duration,
            'slides_dir': str(self.slides_dir) if self.slides_dir else None,
            'use_sample_slides': self.use_sample_slides,
            'slide_timing': self.slide_timing,
        }
    
    @classmethod
    def from_dict(cls, config_dict: Dict[str, Any]) -> 'PresentationConfig':
        """Create config from dictionary."""
        return cls(
            total_slides=config_dict.get('total_slides', 10),
            total_duration=config_dict.get('total_duration', 30.0),
            slides_dir=config_dict.get('slides_dir'),
            use_sample_slides=config_dict.get('use_sample_slides', False),
            slide_timing=config_dict.get('slide_timing'),
        )


# Preset presentation configurations
QUICK_DEMO = PresentationConfig(
    total_slides=5,
    total_duration=15.0,
    use_sample_slides=True,
)

STANDARD_PITCH = PresentationConfig(
    total_slides=10,
    total_duration=30.0,
    use_sample_slides=False,
)

EXTENDED_PITCH = PresentationConfig(
    total_slides=15,
    total_duration=45.0,
    use_sample_slides=False,
)

INVESTOR_PITCH = PresentationConfig(
    total_slides=12,
    total_duration=40.0,
    use_sample_slides=False,
    slide_timing={
        0: 10.0,   # Title slide - longer
        1: 5.0,    # Problem statement - shorter
        2: 8.0,    # Solution
        3: 6.0,    # Product demo
        4: 7.0,    # Business model
        5: 4.0,    # Market size
        6: 5.0,    # Competition
        7: 8.0,    # Go-to-market
        8: 6.0,    # Team
        9: 5.0,    # Financials
        10: 4.0,   # Call to action
        11: 2.0,   # Q&A - shortest
    }
)
