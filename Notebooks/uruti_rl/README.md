# Uruti RL Platform - Presentation Agent Training System

A comprehensive reinforcement learning framework for training agents to optimize presentation delivery through slide navigation and engagement optimization.

---

## 🎯 Quick Start

### 1. Create Sample Presentation

```bash
python3 -c "from utils.slide_manager import SlideManager; \
SlideManager().create_sample_presentation('sample_presentation')"
```

### 2. Train Agent (Choose Algorithm)

```bash
# Train DQN  
python3 train_presentation.py --algorithm dqn --timesteps 50000

# Train PPO with custom config
python3 train_presentation.py --algorithm ppo --config configs/ppo_v1.json --timesteps 100000

# Train A2C
python3 train_presentation.py --algorithm a2c --timesteps 50000
```

### 3. Run Trained Agent

```bash
python3 presentation_demo.py \
    --model_path models/dqn_presentation_slides10 \
    --algorithm dqn \
    --episodes 1
```

### 4. Compare Results

```bash
python3 compare_models.py
```

---

## 📁 Project Structure

```
uruti_rl/
│
├── 📂 Core Training Scripts
│   ├── train.py                    # Main training script (existing)
│   ├── train_presentation.py       # ⭐ NEW: Presentation-focused training
│   ├── evaluate.py                 # Model evaluation
│   ├── compare_models.py           # Algorithm comparison
│   └── environment_demo.py         # Environment demos
│
├── 📂 environments/ (envs/)
│   ├── pitch_env.py               # Simulated pitch environment
│   ├── video_pitch_env.py         # MELD video-based environment
│   └── presentation_pitch_env.py  # ⭐ NEW: Slide-based presentation
│
├── 📂 utilities/ (utils/)
│   ├── slide_manager.py           # ⭐ NEW: Slide management
│   └── presentation_comparison.py # ⭐ NEW: Performance analysis
│
├── 📂 models/
│   ├── __init__.py
│   └── feature_extractor.py
│
├── 📂 configurations/ (configs/)
│   ├── dqn_*.json                 # 10 DQN variant configs
│   ├── ppo_*.json                 # 10 PPO variant configs
│   ├── a2c_*.json                 # 10 A2C variant configs
│   ├── reinforce_*.json           # 10 REINFORCE configs
│   └── generate_hyperparameter_variants.py
│
├── 📂 models/ (trained)
│   └── [trained agent files]
│
├── 📂 reports/
│   ├── comparison.md              # Algorithm comparison results
│   ├── comparison.json
│   └── [evaluation reports]
│
├── 📄 README.md                   # This file
├── requirements.txt               # Python dependencies
└── sample_presentation/           # Sample slides directory
```

---

## 🤖 Presentation Pitch Environment

### Overview

The **PresentationPitchEnv** (`envs/presentation_pitch_env.py`) trains agents to:
- ✅ Navigate through presentation slides
- ✅ Maintain audience engagement
- ✅ Complete presentations within time constraints
- ✅ Optimize delivery through multiple actions

### Agent Actions

| ID | Action | Effect | Base Reward |
|----|---------| --------|------------|
| 0  | Maintain | Hold current slide | +0.05 |
| 1  | Increase Energy | Boost confidence & engagement | +0.40 |
| 2  | Use Gestures | Improve engagement & clarity | +0.30 |
| 3  | Eye Contact | Strong engagement boost | +0.45 |
| 4  | **Next Slide** | **Advance to next slide** ⭐ | **+1.20** |
| 5  | Storytelling | Maximum engagement boost | +0.60 |

### Observation Space (6-dimension)

```python
[confidence, engagement, clarity, pace, slide_progress, time_remaining]
```

- **confidence** (0-1): Presenter confidence level
- **engagement** (0-1): Audience engagement
- **clarity** (0-1): Message clarity
- **pace** (0-2): Presentation pace
- **slide_progress** (0-1): Slides completed
- **time_remaining** (0-1): Time left (0 = finished)

### Key Learning Objective

Agents learn **when to advance to the next slide** (Action 4) to maximize:
- Total reward (higher is better)
- Slides completed (more is better)
- Audience engagement (maintain > 0.7)

---

## 🧠 Supported Algorithms

| Algorithm | Status | Config Files | Features |
|-----------|--------|-------------|----------|
| **DQN** | ✅ Supported | 10 variants | Exploration-Exploitation |
| **PPO** | ✅ Supported | 10 variants | Policy Gradient |
| **A2C** | ✅ Supported | 10 variants | Advantage Actor-Critic |
| **REINFORCE** | ✅ Supported | 10 variants | Policy Gradient |

---

## 🚀 Training Commands

### Basic Training

```bash
# Quick training (5-10 minutes)
python3 train_presentation.py --algorithm dqn --timesteps 10000

# Standard training (30+ minutes)
python3 train_presentation.py --algorithm ppo --timesteps 100000

# Training with custom config
python3 train_presentation.py \
    --algorithm a2c \
    --config configs/a2c_v1.json \
    --timesteps 100000

# Train all algorithms
for algo in dqn ppo a2c reinforce; do
    echo "Training $algo..."
    python3 train_presentation.py --algorithm $algo --timesteps 50000 &
done
wait
```

### Training with Custom Slides

```bash
# Create slide directory
mkdir my_presentation
cp /path/to/slides/*.png my_presentation/

# Train with custom slides
python3 train_presentation.py \
    --algorithm ppo \
    --slides_dir my_presentation \
    --timesteps 100000
```

### Environment Options

```bash
python3 train_presentation.py \
    --algorithm dqn \
    --env_type presentation  # or 'simulation'
    --slides 10              # number of slides
    --timesteps 50000
```

---

## 🎮 Running Trained Agents

### Demo Modes

```bash
# Single episode
python3 presentation_demo.py \
    --model_path models/dqn_presentation_slides10 \
    --algorithm dqn \
    --episodes 1

# Multiple episodes with statistics
python3 presentation_demo.py \
    --model_path models/ppo_presentation_slides10 \
    --algorithm ppo \
    --episodes 5 \
    --deterministic

# With custom slides
python3 presentation_demo.py \
    --model_path models/dqn_presentation \
    --algorithm dqn \
    --slides_dir my_presentation \
    --episodes 3
```

---

## 📊 Analysis & Comparison

### Compare Algorithms

```bash
# Compare on presentation task
python3 -c "
from utils.presentation_comparison import PresentationComparator
c = PresentationComparator()
results = c.compare_algorithms(['dqn', 'ppo', 'a2c'], episodes=10)
report = c.generate_comparison_report(results)
print(report)
"
```

### View Comparison Results

```bash
cat comparison.md
```

### Benchmark Hyperparameter Variants

```bash
# Compare all variants of one algorithm
python3 -c "
from utils.presentation_comparison import PresentationComparator
c = PresentationComparator()
variants = c.benchmark_hyperparameters('ppo', variants=10)
report = c.generate_comparison_report(variants)
print(report)
"
```

---

## 📚 Key Files Reference

### Training & Evaluation

| File | Purpose | Run |
|------|---------|-----|
| `train_presentation.py` | Train agents on presentation | `python3 train_presentation.py --algorithm dqn` |
| `presentation_demo.py` | Run trained agent demo | `python3 presentation_demo.py --model_path ...` |
| `train.py` | Original training script | `python3 train.py --algorithm ppo` |
| `compare_models.py` | Compare algorithms | `python3 compare_models.py` |
| `evaluate.py` | Detailed evaluation | `python3 evaluate.py --model_path ...` |

### Environment Implementations

| File | Type | Features |
|------|------|----------|
| `envs/presentation_pitch_env.py` | 🆕 Presentation | Slide navigation, real slides, Pygame UI |
| `envs/pitch_env.py` | 📊 Simulation | Simulated metrics, basic UI |
| `envs/video_pitch_env.py` | 🎥 Video | MELD dataset, MediaPipe poses |

### Utilities

| File | Purpose |
|------|---------|
| `utils/slide_manager.py` | Slide loading, presets, sample generation |
| `utils/presentation_comparison.py` | Performance analysis, report generation |
| `hyperparameter_tuner.py` | Batch training with configurations |
| `visualizer.py` | Pygame-based visualization |
| `report_generator.py` | Markdown reports |
| `pdf_report_generator.py` | PDF report generation |

### Configurations

| File | Purpose | Count |
|------|---------|-------|
| `configs/dqn_*.json` | DQN hyperparameters | 10 variants |
| `configs/ppo_*.json` | PPO hyperparameters | 10 variants |
| `configs/a2c_*.json` | A2C hyperparameters | 10 variants |
| `configs/reinforce_*.json` | REINFORCE hyperparameters | 10 variants |

---

## 🎨 Presentation Features

### Real-Time Visualization

During training/demo, see live:
- **Slide Display** - Current presentation slide
- **Metrics Gauges** - Confidence, Engagement, Clarity
- **Progress Bars** - Slide progress, time remaining
- **Status Panel** - Current action, step count, tips

### Slide Management

```python
from utils.slide_manager import SlideManager, PresentationConfig

# Create sample presentation
manager = SlideManager(total_slides=10)
manager.create_sample_presentation('slides')

# Or use presets
from utils.slide_manager import STANDARD_PITCH, INVESTOR_PITCH

# Standard: 10 slides, 30 seconds
# Investor: 12 slides, 40 seconds with custom timings
```

### Supported Slide Formats

- PNG
- JPG
- BMP
- GIF

---

## 📈 Expected Performance

### Good Training Results

After training, well-performing agents should:
- ✅ **Complete 80%+ of slides**
- ✅ **Maintain engagement > 0.7**
- ✅ **Episode reward > 50**
- ✅ **Balance speed and quality**

### Performance Metrics

| Metric | Meaning | Good Range |
|--------|---------|-----------|
| Avg Reward | Total episode reward | > 50 |
| Slides Completed | Number of slides shown | > 8/10 |
| Final Engagement | Ending engagement level | > 0.7 |
| Time Used | Percentage of time used | 85-100% |

---

## 🔧 Installation & Setup

### Requirements

```bash
# Install dependencies
pip install -r requirements.txt
```

### Verify Installation

```bash
python3 -c "
from envs.presentation_pitch_env import PresentationPitchEnv
from utils.slide_manager import SlideManager
print('✅ Presentation environment ready!')
"
```

---

## 🐛 Troubleshooting

### Training Issues

| Problem | Solution |
|---------|----------|
| **No slides showing** | Create sample: `python3 -c "from utils.slide_manager import SlideManager; SlideManager().create_sample_presentation()"` |
| **Agent not learning** | Increase timesteps or adjust environment rewards |
| **Out of memory** | Reduce slides count or use simulation mode |
| **Model not found** | Check model path: `ls models/` |

### Running Issues

| Problem | Solution |
|---------|----------|
| **Import errors** | Install requirements: `pip install -r requirements.txt` |
| **Module not found** | Ensure working directory is `uruti_rl/` |
| **Pygame error** | On macOS: `brew install python-tk` |

---

## 📊 Performance Tracking

### View Training Logs

```bash
# Tensorboard visualization
tensorboard --logdir models/logs

# Or check results
ls -lh models/eval_logs/
```

### Save Results

```bash
# Comparison results already saved
cat comparison.md

# Generate new report
python3 -c "
from utils.presentation_comparison import PresentationComparator
c = PresentationComparator()
r = c.compare_algorithms(['dqn', 'ppo', 'a2c'])
report = c.generate_comparison_report(r, output_file='my_report.md')
"
```

---

## 🎯 Advanced Usage

### Train Multiple Variants

```bash
# Train all 40 hyperparameter configs on presentation environment
bash -c 'for config in configs/dqn_v*.json; do
    python3 train_presentation.py --algorithm dqn --config "$config" \
        --env_type presentation --timesteps 50000 &
done; wait'
```

### Compare Across Environments

```bash
# Compare on both simulation and presentation
python3 -c "
from utils.presentation_comparison import PresentationComparator
c = PresentationComparator()
dqn_sim = c.compare_environments('dqn', env_types=['simulation'])
dqn_pres = c.compare_environments('dqn', env_types=['presentation'])
"
```

### Custom Presentation Types

```python
from utils.slide_manager import PresentationConfig

# Define custom presentation
custom = PresentationConfig(
    total_slides=15,
    total_duration=60.0,
    slides_dir='my_slides',
    slide_timing={
        0: 15.0,   # Title slide - long
        1: 8.0,    # Problem  
        # ... custom timing per slide
    }
)
```

---

## 📝 File Statistics

- **Python Code**: 1,581 lines
- **Configuration Files**: 44 JSON variants
- **Documentation**: Comprehensive README + examples
- **Total Components**: 70 files

---

## 🎓 Learning Resources

### Understanding the System

1. **Basic Training** → Start with `train_presentation.py`
2. **Agent Design** → See `envs/presentation_pitch_env.py`
3. **Analysis** → Use `utils/presentation_comparison.py`
4. **Advanced** → Modify configs and algorithms

### Example Workflows

#### Workflow 1: Quick Test (5 min)
```bash
python3 -c "from utils.slide_manager import SlideManager; \
SlideManager().create_sample_presentation()"
python3 train_presentation.py --algorithm dqn --timesteps 5000
python3 presentation_demo.py --model_path models/dqn_presentation_slides10 \
    --algorithm dqn --episodes 1
```

#### Workflow 2: Full Training (1 hour)
```bash
# Train all algorithms
for algo in dqn ppo a2c; do
    python3 train_presentation.py --algorithm $algo --timesteps 100000 &
done
wait

# Compare results
python3 compare_models.py
```

#### Workflow 3: Custom Domain (2+ hours)
```bash
mkdir my_domain_slides
cp /path/to/domain/slides/*.png my_domain_slides/

for config in configs/ppo_v*.json; do
    python3 train_presentation.py --algorithm ppo --config "$config" \
        --slides_dir my_domain_slides --timesteps 100000 &
done
wait
```

---

## 🚀 Next Steps

1. **Create slides** → `mkdir slides && cp your_slides/*.png slides/`
2. **Train model** → `python3 train_presentation.py --algorithm ppo`
3. **Run demo** → `python3 presentation_demo.py --model_path models/ppo_presentation_slides10 --algorithm ppo`
4. **Analyze** → `python3 compare_models.py && cat comparison.md`

---

## 📄 Project Overview

This project provides a complete RL framework for:
- ✅ Training agents on presentation delivery
- ✅ Learning optimal slide navigation  
- ✅ Maintaining audience engagement
- ✅ Comparing algorithm performance
- ✅ Analyzing presentation strategies

### Architecture Highlights

- **Modular Design** - Easy to extend and customize
- **Multiple Environments** - Simulation, MELD video, and presentation modes
- **40 Hyperparameter Variants** - Systematic parameter tuning
- **4 RL Algorithms** - DQN, PPO, A2C, REINFORCE
- **Beautiful Visualization** - Real-time Pygame UI
- **Comprehensive Analysis** - Automated comparison and reporting

---

## 📞 Support

For issues or questions:
1. Check `comparison.md` for performance data
2. Review source code comments in `envs/presentation_pitch_env.py`
3. Check utility documentation in `utils/`
4. Verify installation with example scripts

---

**Ready to train your presentation agent!** 🎯

Last Updated: February 2025  
Version: 2.0 - Presentation Environment Integration
