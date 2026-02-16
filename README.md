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

- 🔗 **Current Development**: https://github.com/NiyonshutiDavid/uruti-platform.git
- 🔗 **Previous Versions**: https://github.com/NiyonshutiDavid/uruti_MLOP.git

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
https://www.figma.com/design/UDNIFsLGHMzDn5EFre4P1O/Uruti-UI-UX-designs?node-id=10213-130944&t=NniDCsG2ZnRrQ8fp-1

### Screenshots
- Founder Dashboard
<img width="1436" height="696" alt="Screenshot 2026-02-15 at 15 35 16" src="https://github.com/user-attachments/assets/c0814007-3486-41c4-8a26-31291846266c" />


- Idea Refinement Interface
<img width="908" height="643" alt="Screenshot 2026-02-15 at 15 35 57" src="https://github.com/user-attachments/assets/c80634ad-3f16-4b77-8b28-808b4e6c304e" />


- Pitch Coaching Module
<img width="1435" height="696" alt="Screenshot 2026-02-15 at 15 36 43" src="https://github.com/user-attachments/assets/bfb4efa2-a7cb-414d-9b1b-bd2c615b7fab" />


- Investor Analytics Dashboard
<img width="1440" height="688" alt="Screenshot 2026-02-15 at 15 38 20" src="https://github.com/user-attachments/assets/cc58b1fd-c003-477a-8b0f-502ecf507884" />


- Leaderboard Page
<img width="1436" height="697" alt="Screenshot 2026-02-15 at 15 37 11" src="https://github.com/user-attachments/assets/35b9ba2e-e918-4a6c-9e4e-9a5aaffb6055" />

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

### 6.2 Model Current Performance

**A. Reinforcement Learning Pitch Coach**
<img width="850" height="547" alt="image" src="https://github.com/user-attachments/assets/527f24ac-d047-4b23-868e-4b485c595517" />


**B. Multi-Layer Perceptron (MLP) – Investor Scoring Engine**
<img width="1790" height="490" alt="image" src="https://github.com/user-attachments/assets/d20bef9c-62be-4dec-95d8-0b94d47e75b1" />


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
### Video recording
Access the video recording from here:
https://drive.google.com/drive/folders/1vv6e5kCKp86Lr4L88cjQwTP7zW4s0TNE?usp=sharing
