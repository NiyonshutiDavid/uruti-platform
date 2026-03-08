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
