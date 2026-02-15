# URUTI

AI-Powered Ideation, Pitch Coaching & Investor Intelligence Platform

## 1. Project Description

Uruti is an AI-driven ideation and pre-acceleration platform designed to bridge the early-stage startup "Valley of Death" in Rwanda and emerging ecosystems.

The platform supports founders from raw idea formation to investor readiness using:

- 🤖 AI-Guided Ideation & Advisory
- 🎤 Reinforcement Learning–Based Pitch Coaching
- 📊 Neural-Network Investor Scoring & Ranking

Uruti is not a chatbot. It is a goal-driven, outcome-optimized system built specifically to:

- Improve idea validation quality
- Increase pitch performance over time
- Reduce investor screening costs
- Standardize early-stage evaluation metrics

The system complements, rather than competes with, accelerators such as Y Combinator, Techstars, Norrsken House Kigali, and Kigali Innovation City.

## 2. Repository Links

- 🔗 **Current Development**: [Insert current repository URL]
- 🔗 **Previous Versions**: [Insert legacy repository URL]

## 3. Technology Stack

### Frontend (Web)
- React
- Vite
- TailwindCSS
- Responsive layout architecture
- Modular component design

### Mobile App
- Flutter
- Designed in Figma
- State-driven UI architecture

### Backend (Planned / In Progress)
- FastAPI (Python)
- RESTful APIs
- JWT Authentication
- Model inference endpoints

### AI / ML Stack
- Python
- PyTorch / TensorFlow (MLP implementation)
- Reinforcement Learning framework
- Pandas / NumPy
- Scikit-learn

## 4. System Architecture Overview

Uruti follows a modular service-oriented architecture:

- **Client Layer**: Web App (React), Mobile App (Flutter)
- **API Gateway Layer**: Authentication, Request routing, Rate limiting
- **AI Services Layer**: Reinforcement Learning Pitch Engine, MLP Scoring Engine, NLP Idea Structuring
- **Data Layer**: PostgreSQL / MongoDB, Model artifacts storage, User performance logs

## 5. Frontend Development Demonstration

### UI/UX Design Process

**Design workflow:**
- Wireframes
- High-fidelity mockups (Figma)
- Component system definition
- Tailwind-based implementation

**Design principles:**
- Minimal cognitive load
- Clear pitch progress tracking
- Structured dashboard layouts
- Mobile-first responsive design

### Figma Prototype
[Insert Figma Link]

### Screenshots
- Founder Dashboard


- Idea Refinement Interface


- Pitch Coaching Module


- Investor Analytics Dashboard


- Leaderboard Page

### Example Frontend Code
```jsx
export default function PitchScoreCard({ score }) {
    return (
        <div className="bg-white shadow-xl rounded-2xl p-6">
            <h2 className="text-xl font-semibold">Pitch Readiness Score</h2>
            <p className="text-4xl font-bold text-blue-600 mt-2">{score}%</p>
        </div>
    );
}
```

## 6. Machine Learning Track Demonstration

Documentation: `ModelCreation.ipynb`

### 6.1 Data Engineering & Visualization
- Dataset cleaning & feature engineering
- Feature scaling & missing value handling
- Visualizations: Feature importance, correlation heatmaps, training curves

### 6.2 Model Architecture

**A. Reinforcement Learning Pitch Coach**
- State: Founder pitch performance metrics
- Action: AI-generated structured feedback
- Reward: Improvement in pitch score
- Policy Optimization via Q-learning / Policy Gradient

**B. Multi-Layer Perceptron (MLP) – Investor Scoring Engine**
- Input Layer (startup features) → Hidden Layers (ReLU) → Output Layer
- Optimizer: Adam | Loss: Binary Cross-Entropy / MSE
- Outputs: Risk score, Market readiness probability, Ranking position

### 6.3 Initial Performance Metrics
- Accuracy
- Precision
- Recall
- F1-Score
- ROC-AUC

(Insert actual values from notebook)

## 7. Backend Development Demonstration

### Example FastAPI Endpoint
```python
@app.post("/score-startup")
def score_startup(data: StartupInput):
        prediction = model.predict(data.features)
        return {"investment_score": float(prediction)}
```

## 8. Database Schema

### Users Table
- `id`, `name`, `email`, `role` (founder/investor), `password_hash`

### Projects Table
- `id`, `founder_id`, `idea_text`, `validation_score`, `pitch_score`, `investor_score`

### Pitch Sessions Table
- `id`, `project_id`, `session_number`, `feedback`, `improvement_score`

## 9. Deployment Plan

**Phase 1 – MVP**: Frontend (Vercel), Backend (Render/Railway), Database (Supabase)

**Phase 2 – AI Scaling**: Docker containerization, Separate inference server, GPU scaling

**Phase 3 – Production**: CI/CD pipeline, Monitoring (Prometheus), Logging & performance tracking

## 10. Development Environment Setup

### Clone Repository
```bash
git clone https://github.com/yourusername/uruti.git
cd uruti
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Runs on: `http://localhost:5173`

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
Runs on: `http://localhost:8000` | Docs: `http://localhost:8000/docs`

### ML Notebook
```bash
jupyter notebook ModelCreation.ipynb
```
