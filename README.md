# URUTI

AI-powered ideation, pitch coaching, and investor intelligence platform for early-stage founders.

## Project Links

- Current development repo: https://github.com/NiyonshutiDavid/uruti-platform.git
- Previous versions: https://github.com/NiyonshutiDavid/uruti_MLOP.git

## Deployment And Deliverables

- Deployed web app link: https://uruti.rw
- APK files folder: https://drive.google.com/drive/folders/1uGmQXk1chvWdfEiGaUKAQ18qg1kYJv9c?usp=sharing
- Demo video (5 minutes): https://drive.google.com/drive/folders/1vv6e5kCKp86Lr4L88cjQwTP7zW4s0TNE?usp=sharing

## Hugging Face Model Deployments

The platform models are deployed on Hugging Face:

- Pitch coach model: https://huggingface.co/NiyonshutiDavid/Uruti-pitch_coach
- Investor ranker and analyzer model: https://huggingface.co/NiyonshutiDavid/uruti-ranker_and_analyser
- Chatbot model (GGUF, CPU-friendly): https://huggingface.co/NiyonshutiDavid/uruti-qwen2_5-7b-instruct-q4_k_m-gguf
- Chatbot model (Tensor/large variant): https://huggingface.co/NiyonshutiDavid/uruti-advisory-model-best

### Investor Ranker And Analyzer (What It Scores)

Model family and deployment bundle:

- Inference pipeline: XGBoost-based `Pipeline` (loaded from `uruti_bundle.joblib`)
- Classes:
    - `not_ready`
    - `mentorship_needed`
    - `investment_ready`

What it analyzes at inference time:

- Structured model features (10 canonical fields):
    - `funding_total_usd`
    - `funding_rounds`
    - `founded_year`
    - `rd_spend`
    - `administration_spend`
    - `marketing_spend`
    - `profit`
    - `state_code`
    - `category_code`
    - `source`
- Uruti readiness heuristics used for calibrated score blending:
    - team strength (`team_size`)
    - traction (`user_base` vs target market)
    - growth (`monthly_growth_pct`)
    - partnerships
    - sector boost
    - startup stage
    - optional platform score (`mlp_score`) when available

Score bands used in output:

- High Readiness (80-100)
- Strong Seed Readiness (70-79)
- Mentorship-to-Seed Transition (60-69)
- Mentorship Needed (50-59)
- Early Stage / Not Ready (<50)

Current performance (latest documented training artifacts):

- Best model: XGBoost Classifier
- Weighted F1 score: 83.82%
- Evaluation/training scale: 55,000+ startup records

### Pitch Coach (Session Handling, Actions, Rewards)

How the scoring and coaching session is handled:

- Score endpoint model:
    - Reward MLP takes 9 real-time pitch features and predicts a continuous score.
- Coaching endpoint policy:
    - RL agent takes a 12-dimensional state vector:
        - 9 multimodal features
        - 3 session-context fields: `slide_index`, `time_remaining`, `time_on_slide`

Core 9 pitch features analyzed:

- `eye_contact_score`
- `smile_rate`
- `head_stability`
- `pitch_variance`
- `rms_energy`
- `pause_ratio`
- `speech_rate`
- `readability_score`
- `filler_ratio`

Action space (Discrete(6)):

- `0`: Increase Energy
- `1`: Improve Eye Contact
- `2`: Reduce Fillers
- `3`: Slow Down
- `4`: Clarify Point / Slide Alignment
- `5`: Smile / Stronger Hook

Reward design used during RL training:

- Base reward: score improvement delta (`current_score - last_score`) scaled by `4.0`
- Maintenance bonus: `+2.0` when score remains above `85`
- Pacing penalty: subtract over-time penalty when `time_on_slide` exceeds expected slide time
- Terminal bonus: `+50.0` when session ends with final score `>= 85`

Current performance (latest notebook run + exported artifacts):

- Reward model validation: target reached at epoch 135 with `Val R^2 = 0.9512`
- RL algorithm comparison (mean final score):
    - DQN: `57.79/100` (best)
    - PPO: `57.74/100`
    - TRPO: `54.17/100`
- Deployed policy artifact currently marked best: `DQN`

## Datasets Used

Primary datasets and data assets used in this repository:

- `Notebooks/Data/50_Startups.csv` (startup financial features)
- `Notebooks/Data/investments_VC.csv` (VC/investment related records)
- `Notebooks/Data/startup data.csv` (startup profile and outcome features)
- `Notebooks/Data/alpaca_data_cleaned.json` (advisory/chat data)
- `Notebooks/Data/chatbot-data.json` (chatbot/advisory training data)
- `Notebooks/Data/MELD.Raw/` (speech/emotion-related raw data)
- `Notebooks/uruti-Chatbot/data/train_data_generated.jsonl`
- `Notebooks/uruti-Chatbot/data/val_data_generated.jsonl`
- `Notebooks/uruti-Chatbot/data/test_data_generated.jsonl`

Supporting data archives in `Notebooks/Data/`:

- `50 startups.zip`
- `Crunchbase Investment Data (Kaggle).zip`
- `Startup Success Prediction.zip`

## Notebooks And What They Do

All core notebooks should run in Google Colab (recommended baseline environment) so results are reproducible even when local hardware is limited.

- `Notebooks/uruti-MLP_models/ModelCreation.ipynb`
    Main training notebook for the investor intelligence model: preprocessing, training, evaluation, and export.

- `Notebooks/uruti-MLP_models/StartupAnalyzer_Demo.ipynb`
    Inference/demo notebook for startup scoring, confidence estimation, and recommendation generation.

- `Notebooks/uruti_rl/Uruti_pitch_coach.ipynb`
    Pitch coach research notebook with multimodal feature extraction, training experiments, and quality checks.

- `Notebooks/uruti-Chatbot/uruti_benchmark.ipynb`
    Advisory chatbot benchmark notebook covering data preparation, fine-tuning workflow, and model comparison.

Colab run notes:

- Prefer Google Colab GPU runtime for heavy training or fine-tuning cells.
- Configure required secrets/tokens before running cells (`HF_TOKEN`, `KAGGLE_USERNAME`, `KAGGLE_KEY`).
- Run cells from top to bottom to avoid missing setup state.

## Related Project Files

- Web app: `uruti-web/Uruti_Web-updated/`
    React + Vite frontend with founder/investor/admin dashboards.
- Backend (FastAPI): `uruti-web/Uruti_Web-updated/src/backend/`
    Core APIs, authentication, venture modules, and AI routing.
- Mobile app (Flutter): `uruti-Mobile/uruti_app/`
    Android/iOS app for mobile access to main platform workflows.
- Model artifacts: `Models/`
    Trained model bundles, metadata, and inference assets.
- Notebook workspace: `Notebooks/`
    Research, model training, evaluation, and demo notebooks.

## Step-By-Step Installation And Run Instructions

### 1. Clone Repository

```bash
git clone https://github.com/NiyonshutiDavid/uruti-platform.git
cd uruti-platform
```

### 2. Start Web Frontend

```bash
cd uruti-web/Uruti_Web-updated
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 3. Start Backend Services (Core + AI Modules)

Open a new terminal:

```bash
cd uruti-web/Uruti_Web-updated/src/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Run core backend service:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload
```

Open another terminal in the same backend folder and run AI modules service:

```bash
source .venv/bin/activate
uvicorn app.chatbot_main:app --host 127.0.0.1 --port 8020 --reload
```

Health checks:

- Core backend: `http://127.0.0.1:8010/health`
- AI modules: `http://127.0.0.1:8020/health`

### 4. Start Mobile App (Optional)

```bash
cd uruti-Mobile/uruti_app
flutter pub get
flutter run
```

Mobile localhost testing notes (including Pitch Coach):

- Android emulator uses `http://10.0.2.2:8010` (auto-handled in app).
- iOS simulator uses `http://localhost:8010` (auto-handled in app).
- Physical phone cannot use `localhost` to reach your laptop backend.
    Use `--dart-define` with your laptop LAN IP:

```bash
flutter run \
    --dart-define=BACKEND_URL=http://<YOUR-LAPTOP-LAN-IP>:8010 \
    --dart-define=AI_BACKEND_URL=http://<YOUR-LAPTOP-LAN-IP>:8020
```

This is required to validate Pitch Coach and all other modules on a real device before deployment.

### 5. Run Notebooks (Optional For ML Reproduction)

```bash
jupyter notebook
```

Then open notebooks from `Notebooks/`.

Environment recommendation:

- Recommended: Google Colab for reproducible setup and better GPU availability.
- Local Jupyter is supported mainly for lightweight/demo runs.



## Testing Results 



## Analysis 



## Discussion 



## Recommendations And Future Work 


Future improvement plan (including hardware constraints):

- Hardware resilience:
    Keep dual deployment paths: GGUF models for CPU/low-resource environments and Tensor/full models for GPU servers.

- Inference efficiency:
    Add batching, request queueing, and optimized quantization to reduce memory usage and response latency.

- Training infrastructure:
    Move heavy model training and large-scale experiments to Colab Pro/cloud GPU instances to avoid local hardware bottlenecks.

- Model quality:
    Increase domain-specific dataset size, improve label quality, and schedule periodic re-training with versioned evaluations.

- Safer and more reliable outputs:
    Strengthen RAG grounding, improve retrieval quality, and add hallucination checks for advisory responses.

- Better evaluation coverage:
    Track and publish metrics per module: accuracy/F1 (ranker), coaching score consistency (pitch coach), and factuality/latency (chatbot).

- Model compression roadmap:
    Distill larger advisory models into smaller student models to improve speed on limited hardware without large quality loss.

- MLOps and deployment maturity:
    Add automated model registry, staged rollout (canary), and drift monitoring in production.

## Demo Screenshots

- Core dashboard demo image:
    `[INSERT IMAGE OR LINK HERE]`

- Startup creation and management demo image:
    `[INSERT IMAGE OR LINK HERE]`

- Advisory/chatbot demo image:
    `[INSERT IMAGE OR LINK HERE]`

- Pitch coach demo image:
    `[INSERT IMAGE OR LINK HERE]`

- Investor intelligence/ranking demo image:
    `[INSERT IMAGE OR LINK HERE]`
