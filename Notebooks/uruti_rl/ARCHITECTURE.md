# 📊 Project Architecture

Clean, organized file structure for easy understanding and navigation.

---

## Folder Organization

```
uruti_rl/                          # Main project directory
│
├── 📂 envs/                        # Environment Implementations (3 files)
│   ├── __init__.py
│   ├── pitch_env.py               # Simulated pitch environment
│   ├── video_pitch_env.py         # MELD video-based environment  
│   └── presentation_pitch_env.py  # ⭐ NEW: Slide navigation environment
│
├── 📂 utils/                       # Utility Modules (2 files)
│   ├── presentation_comparison.py # ⭐ NEW: Performance analysis
│   └── slide_manager.py           # ⭐ NEW: Slide management
│
├── 📂 models/                      # Model Components (2 files)
│   ├── __init__.py
│   └── feature_extractor.py       # Feature extraction utilities
│
├── 📂 configs/                     # Hyperparameter Configurations (45 files)
│   ├── dqn_v01.json               # DQN variant 1
│   ├── dqn_v02.json through v10   # DQN variants 2-10 (9 more files)
│   ├── ppo_v01.json through v10   # PPO variants (10 files)
│   ├── a2c_v01.json through v10   # A2C variants (10 files)
│   ├── reinforce_v01.json through v10  # REINFORCE variants (10 files)
│   ├── *_example.json             # Example configs (4 files)
│   └── generate_hyperparameter_variants.py  # Config generator
│
├── 📂 models/                      # Trained Models (created at runtime)
│   └── [trained agent files]      # Saved models from training
│
├── 📂 reports/                     # Generated Reports (created at runtime)
│   ├── comparison.md              # Algorithm comparison report
│   ├── comparison.json            # Comparison data (JSON)
│   └── [other reports]            # Evaluation outputs
│
├── 📂 sample_presentation/         # Sample Slides (created at runtime)
│   └── [slide images]             # Generated sample presentation slides
│
├── 🔧 Core Training Scripts (5 files)
│   ├── train.py                   # Main training script
│   ├── train_presentation.py      # ⭐ NEW: Presentation training
│   ├── evaluate.py                # Model evaluation
│   ├── compare_models.py          # Algorithm comparison
│   └── environment_demo.py        # Demo environments
│
├── 🎨 Visualization & Analysis (3 files)
│   ├── visualizer.py              # Pygame visualization
│   ├── report_generator.py        # Markdown report generation
│   └── pdf_report_generator.py    # PDF report generation
│
├── 🔨 Utilities (1 file)
│   └── hyperparameter_tuner.py    # Batch training orchestrator
│
├── 📄 Configuration Files
│   ├── requirements.txt           # Python dependencies
│   ├── __init__.py                # Package marker
│   └── data_sources.py            # Data loading utilities
│
├── 📚 Documentation (2 files)
│   ├── README.md                  # Main documentation (THIS FILE)
│   └── comparison.md              # Performance comparison results
│
└── 📁 Other Files
    ├── 00_START_HERE.txt          # Quick start guide
    ├── comparison.json            # Cached comparison results
    └── PreviousRLagent/           # Old project reference
```

---

## File Organization by Purpose

### Training & Core Logic

| File | Purpose | Lines |
|------|---------|-------|
| `train.py` | Main training for sim/video environments | 300+ |
| `train_presentation.py` | Presentation environment training | 200+ |
| `evaluate.py` | Model evaluation and inference | 200+ |
| `compare_models.py` | Algorithm comparison runner | 250+ |
| `hyperparameter_tuner.py` | Batch 40-variant orchestrator | 300+ |

### Environments (agents learn from these)

| File | Type | Size | Features |
|------|------|------|----------|
| `envs/pitch_env.py` | Simulation | 300+ lines | Simulated metrics |
| `envs/video_pitch_env.py` | MELD Video | 300+ lines | MediaPipe poses |
| `envs/presentation_pitch_env.py` | ⭐ Presentation | 450 lines | **Slide navigation** |

### Analysis & Reporting

| File | Purpose |
|------|---------|
| `visualizer.py` | Real-time Pygame visualization |
| `report_generator.py` | Markdown report generation |
| `pdf_report_generator.py` | PDF report with plots |

### Utilities & Support

| File | Purpose |
|------|---------|
| `utils/slide_manager.py` | Slide loading, presets, generation |
| `utils/presentation_comparison.py` | Performance analysis framework |
| `models/feature_extractor.py` | Feature extraction (MediaPipe) |
| `hyperparameter_tuner.py` | Batch training orchestrator |
| `data_sources.py` | Data loading utilities |

---

## Configurations Structure

### 40 Hyperparameter Variants (configs/ folder)

```
configs/
├── DQN Variants (10)
│   ├── dqn_v01.json ─→ Learning rate: 0.001, gamma: 0.95
│   ├── dqn_v02.json ─→ Learning rate: 0.0005, gamma: 0.97
│   ├── ... (patterns continue)
│   └── dqn_v10.json ─→ Conservative settings
│
├── PPO Variants (10)
│   ├── ppo_v01.json ─→ High learning rate, entropy bonus
│   ├── ppo_v02.json ─→ Balanced settings
│   ├── ... (patterns continue)
│   └── ppo_v10.json ─→ Stable, slow learning
│
├── A2C Variants (10)
│   ├── a2c_v01.json ─→ Fast learning, high entropy
│   ├── ... (patterns continue)
│   └── a2c_v10.json ─→ Conservative updates
│
├── REINFORCE Variants (10)
│   ├── reinforce_v01.json
│   ├── ... (patterns continue)
│   └── reinforce_v10.json
│
├── Example Configs (4)
│   ├── dqn_example.json
│   ├── ppo_example.json
│   ├── a2c_example.json
│   └── reinforce_example.json
│
└── Config Generator
    └── generate_hyperparameter_variants.py
```

---

## Runtime Output Directories

### After Training

```
models/
├── dqn_presentation_slides10          # Best trained model
├── dqn_presentation_slides10_config.json
├── logs/
│   └── DQN_0/events.out.tfevents     # Tensorboard logs
├── best_models/
│   └── best_model.zip                # Best model
└── eval_logs/
    └── [evaluation results]          # Eval metrics
```

### After Running Demos/Evaluations

```
reports/
├── comparison.md                      # Algorithm comparison
├── comparison.json                    # Structured results
└── [other analysis reports]
```

### Sample Presentations

```
sample_presentation/                   # Created by SlideManager
├── slide_01.png
├── slide_02.png
├── ... (patterns continue)
└── slide_10.png
```

---

## Code Statistics

### By Component

| Component | Files | Lines | Purpose |
|-----------|-------|-------|---------|
| **Environments** | 3 | 1,050+ | Agent learning environments |
| **Training Scripts** | 5 | 1,100+ | Training & evaluation |
| **Utilities** | 2 | 650+ | Support functions |
| **Visualization** | 3 | 800+ | Real-time display |
| **Models** | 2 | 400+ | Feature extraction |
| **Total Python** | 15+ | 4,000+ | Complete system |

### By Purpose

| Purpose | Files | Role |
|---------|-------|------|
| **Training** | 5 | Core learning engine |
| **Environments** | 3 | Defines learning problems |
| **Analysis** | 2 | Performance evaluation |
| **Visualization** | 3 | Real-time feedback |
| **Config** | 44 | Hyperparameter variants |

---

## Data Flow

### Training Flow

```
train_presentation.py
    ↓
configs/ppo_v1.json (hyperparameters)
    ↓
envs/presentation_pitch_env.py (environment)
    ↓
utils/slide_manager.py (slide data)
    ↓
Stable Baselines 3 (DQN/PPO/A2C)
    ↓
models/*.zip (trained model)
```

### Demo/Inference Flow

```
presentation_demo.py
    ↓
models/*.zip (load trained model)
    ↓
envs/presentation_pitch_env.py (environment)
    ↓
visualizer (Pygame display)
    ↓
Video output / metrics
```

### Analysis Flow

```
compare_models.py
    ↓
utils/presentation_comparison.py (compare performance)
    ↓
report_generator.py (format results)
    ↓
comparison.md (human-readable)
comparison.json (machine-readable)
```

---

## File Relationships

### Dependencies Matrix

```
train_presentation.py
    ├── envs/presentation_pitch_env.py
    │   └── utils/slide_manager.py
    ├── configs/*.json
    └── models/ (save)

presentation_demo.py
    ├── models/*.zip (load)
    └── envs/presentation_pitch_env.py
        └── visualizer.py

compare_models.py
    ├── models/*.zip (multiple)
    └── utils/presentation_comparison.py
        ├── report_generator.py
        └── reports/ (save)
```

---

## Directory Purposes

| Folder | Purpose | Contains |
|--------|---------|----------|
| **envs/** | Learning environments | 3 environment implementations |
| **utils/** | Utility modules | Slide management, analysis |
| **models/** | ⚙️ Components & 🤖 Trained agents | Feature extractor + saved models |
| **configs/** | Hyperparameter definitions | 44 JSON configs (10 per algo) |
| **reports/** | Generated analysis | Comparison reports (MD + JSON) |
| **sample_presentation/** | Test slides | Generated presentation slides |

---

## Key Directories for Users

### For Training
→ Edit `configs/*.json`  
→ Run `train_presentation.py`  
→ Models save to `models/`

### For Evaluation
→ Models in `models/`  
→ Run `presentation_demo.py`  
→ View live visualization

### For Analysis
→ Run `compare_models.py`  
→ Results in `reports/`  
→ Check `comparison.md`

---

## Quick Reference

### Access Trained Model
```
models/dqn_presentation_slides10
```

### Access Slide Data
```
sample_presentation/ (or custom_slides/)
```

### Access Hyperparameters
```
configs/ppo_v1.json (example)
```

### Access Results
```
reports/comparison.md
```

### Access Source Code
```
envs/presentation_pitch_env.py (main environment)
```

---

## Adding New Components

### Add New Algorithm
1. Create config: `configs/newalgo_v01.json`
2. Add to `train.py` MODEL_LOADERS
3. Run: `train_presentation.py --algorithm newalgo`

### Add New Evaluation Metric  
1. Modify: `utils/presentation_comparison.py`
2. Add metric to `evaluate_presentation_agent()`
3. Re-run comparison

### Add Custom Slides
1. Create folder: `my_slides/`
2. Add PNG/JPG images
3. Train: `train_presentation.py --slides_dir my_slides/`

---

## Architecture Benefits

✅ **Modular** - Each component independent  
✅ **Scalable** - Easy to add new algorithms/environments  
✅ **Clear** - Folder structure matches functionality  
✅ **Documented** - Each file has clear purpose  
✅ **Maintainable** - Easy to find and modify  
✅ **Extensible** - Base classes for custom implementations  

---

**Version**: 2.0 - Presentation Environment Integration  
**Last Updated**: February 2025
