# **Pitch Coach – Reinforcement Learning for Presentation Skills**
**An AI-powered presentation coaching environment where RL agents learn to master the art of public speaking.**
---

## 📋 Table of Contents

* [Project Overview](#-project-overview)
* [Installation & Setup](#-installation--setup)
* [Usage (CLI Control Panel)](#-usage)
* [Reproducing Results](#-reproducing-results)
* [Environment Description](#-environment-description)
* [Project Structure](#-project-structure)
* [Results Summary](#-results-summary)
* [Credits & License](#-credits--license)

---

## 📋 Project Overview

**Pitch Coach** addresses a critical challenge for founders and presenters: the lack of objective, real-time feedback on delivery skills.

This project implements a custom Gymnasium environment where an agent (the presenter) must balance **Energy**, **Engagement**, and **Pacing** to deliver a successful pitch. Four Reinforcement Learning algorithms (**PPO**, **REINFORCE**, **DQN**, and **A2C**) were trained and compared to solve this stochastic optimization problem.

**Key Findings:**

  * 🏆 **PPO & REINFORCE** achieved the highest performance (Mean Reward \~49.2), successfully learning to balance audience engagement with slide completion.
  * 📉 **DQN** struggled with the sequential nature of the task, showing the lowest stability.
  * 📊 **A2C** showed high variance in training stability.

-----

## ⚙️ Installation & Setup

This project is designed to run locally. Follow these steps to set up the environment.

### 1\. Clone the Repository

```bash
git clone https://github.com/NiyonshutiDavid/uruti_MLOP.git
cd uruti_MLOP/uruti-reinforcedLearning
```

### 2\. Create a Virtual Environment

It is recommended to use a virtual environment to manage dependencies.

```bash
# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate

# Windows
python -m venv .venv
.venv\Scripts\activate
```

### 3\. Install Dependencies

Install all required packages from the `requirements.txt` file.

```bash
pip install -r requirements.txt
```

*Note: If you encounter audio-related errors on Linux/macOS, you may need to install `portaudio` (e.g., `brew install portaudio`).*

-----

## 🚀 Usage

The system is controlled via a centralized Command Line Interface (CLI).

### Start the Control Panel

Run the main script to access the interactive menu:

```bash
python main.py
```

You will see the following dashboard:

```text
╔════════════════════════════════════════════════════════════════════╗
║ PITCH COACH CONTROL PANEL                                          ║
╠════════════════════════════════════════════════════════════════════╣
║ 1: Run trained agent demonstration 🚀                              ║
║ 2: Train new models 🤖                                             ║
║ 3: Run random action demo 🎲                                       ║
║ 4: System information 📊                                           ║
║ 5: Exit 👋                                                         ║
╚════════════════════════════════════════════════════════════════════╝
```

### 🎮 Modes of Operation

1.  **Run Trained Agent (Demo)**

      * Selects the best-saved model (PPO/REINFORCE) and visualizes the agent delivering a pitch in real-time.
      * **Visuals:** Displays the PyGame UI with the presenter, audience reactions, and live metric bars.

2.  **Train New Models**

      * Allows you to train a specific algorithm (DQN, PPO, A2C, or REINFORCE) from scratch.
      * Configuration files from the `configs/` directory are used to set hyperparameters.

3.  **Random Action Demo**

      * Simulates the environment with an untrained agent taking random actions. Useful for verifying the environment logic and UI rendering without model inference.

-----

## 🔬 Reproducing Results

To reproduce the extensive hyperparameter sweep and analysis presented in the report, use the provided shell scripts and reporting tools.

### 1\. Run Hyperparameter Sweep (40 Runs)

We performed 10 runs for each of the 4 algorithms using different hyperparameter configurations. To replicate this:

```bash
chmod +x run_all_40.sh
./run_all_40.sh
```

*This script will iterate through all JSON files in `configs/`, train the models, and save the results to `runs/` and the best models to `models/`.*

### 2\. Generate Analysis Reports

Once training is complete, generate the comparison plots and tables:

```bash
python generate_report.py
```

This will create:

  * **Plots:** `reports/plots/` (Cumulative Rewards, Convergence Speed, Stability, etc.)
  * **Tables:** `reports/tables/` (Detailed CSV metrics for every run)
  * **Final Report:** `reports/final_report.pdf`

-----

## 🧠 Environment Description

The agent operates in a custom Gymnasium environment representing a stage.

### **Observation Space (6-Dim)**

| Index | Feature | Range | Description |
|:-----:|:--------|:-----:|:------------|
| 0 | `confidence` | 0.0 - 1.0 | Presenter's internal confidence metric |
| 1 | `engagement` | 0.0 - 1.0 | Current audience interest level |
| 2 | `clarity` | 0.0 - 1.0 | How well the message is being received |
| 3 | `pace` | 0.0 - 2.0 | Speech speed (1.0 is optimal) |
| 4 | `slide_progress`| 0.0 - 1.0 | % of the presentation completed |
| 5 | `time_remaining`| 0.0 - 1.0 | Time left in the session |

### **Action Space (Discrete)**

  * `0`: **Maintain** (Stabilize pace)
  * `1`: **Increase Energy** (Boosts engagement, costs stamina)
  * `2`: **Use Gestures** (Improves clarity)
  * `3`: **Eye Contact** (Boosts engagement)
  * `4`: **Next Slide** (Progresses presentation)
  * `5`: **Storytelling** (High reward, high cost)

-----

## 📂 Project Structure

```text
uruti-reinforcedLearning/
├── environment/           # Custom Gymnasium Environment
│   ├── pitch_env.py       # Main environment logic (Rewards, States)
│   └── visualization.py   # PyGame rendering engine
├── models/                # Saved trained models (Best performers)
│   ├── ppo/               # PPO Checkpoints
│   ├── reinforce/         # REINFORCE Checkpoints
│   └── ...
├── configs/               # Hyperparameter JSON configurations
│   ├── ppo/run_*.json
│   └── ...
├── reports/               # Generated analysis
│   ├── plots/             # Analysis graphs (matplotlib/seaborn)
│   └── tables/            # CSV results of all 40 runs
├── main.py                # CLI Entry Point
├── train.py               # Training script (Stable Baselines3)
├── play_demo.py           # Inference script for demo
├── run_all_40.sh          # Batch script for experiments
└── requirements.txt       # Python dependencies
```

-----

## 📊 Results Summary

Our extensive analysis of 40 training runs yielded the following insights:

  * **Best Algorithm:** **PPO** (Proximal Policy Optimization)
      * *Score:* Highest Max Reward (**78.7**) and most consistent Mean Reward.
      * *Behavior:* Learned to strategically use "Next Slide" while maintaining high "Engagement".
  * **Fastest Learner:** **REINFORCE**
      * *Convergence:* Converged in **\~638 episodes**, significantly faster than DQN (\~1057).
  * **Visualizations:**
      * Check `reports/plots/cumulative_rewards_comparison.png` for performance ranking.
      * Check `reports/plots/action_distribution_analysis.png` to see how PPO learned a balanced strategy vs DQN's repetitive actions.

-----

## 👥 Credits & License

**Student:** David Niyonshuti
**Course:** Machine Learning Techniques II (Summative Assignment)

This project is an additional feature being developed to be integrated into Uruti
