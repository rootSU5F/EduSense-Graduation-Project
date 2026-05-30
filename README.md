<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,50:1e3a5f,100:0ea5e9&height=200&section=header&text=EduSense&fontSize=72&fontColor=ffffff&fontAlignY=38&desc=Intelligent%20Classroom%20Engagement%20Detection%20System&descAlignY=60&descSize=18&descColor=93c5fd" width="100%"/>

<br/>

[![KKU](https://img.shields.io/badge/King%20Khalid%20University-College%20of%20CS-0ea5e9?style=for-the-badge&logo=graduation-cap&logoColor=white)](https://www.kku.edu.sa)
[![Status](https://img.shields.io/badge/Status-✅%20Completed%20%26%20Defended-22c55e?style=for-the-badge&logo=checkmarx&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.x-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](#)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white)](#)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](#)
[![Claude](https://img.shields.io/badge/Claude%20API-Anthropic-D97706?style=for-the-badge&logo=anthropic&logoColor=white)](#)

<br/>

> **A real-time AI platform that detects student dissatisfaction through facial emotion recognition, generates personalised Jupyter notebooks via RAG + Claude API, and delivers actionable analytics to teachers — fully deployed with multi-user authentication, Supabase persistence, and class heatmaps.**

<br/>

**🎓 Graduation Project · King Khalid University · Computer Science · 2026**

<br/>

</div>


---

## 📊 Project Stats

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/Rootsu5f/EduSense-Graduation-Project?style=social)
![GitHub forks](https://img.shields.io/github/forks/Rootsu5f/EduSense-Graduation-Project?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/Rootsu5f/EduSense-Graduation-Project?style=social)

<br/>

![GitHub last commit](https://img.shields.io/github/last-commit/Rootsu5f/EduSense-Graduation-Project?style=flat-square&color=0ea5e9)
![GitHub repo size](https://img.shields.io/github/repo-size/Rootsu5f/EduSense-Graduation-Project?style=flat-square&color=22c55e)
![GitHub language count](https://img.shields.io/github/languages/count/Rootsu5f/EduSense-Graduation-Project?style=flat-square&color=f59e0b)
![GitHub top language](https://img.shields.io/github/languages/top/Rootsu5f/EduSense-Graduation-Project?style=flat-square&color=3776AB)

</div>

---

## 🏆 Achievements

<div align="center">

| 🎯 | Achievement |
|---|---|
| 🥇 | **81.1% accuracy** on DAISEE — surpasses all published baselines by +12.5pp |
| 🧠 | **Novel architecture** — Transformer + KAN + CORAL for ordinal emotion classification |
| 🗄️ | **Production system** — Auth, multi-user, Supabase, heatmaps, RAG, notebooks |
| 🎓 | **Defended successfully** — King Khalid University, May 2026 |
| 🔬 | **5-participant integration test** — Wireshark-validated, post-session questionnaire |

</div>

---

## ⚡ Quick Stats

<div align="center">

```
╔══════════════════════════════════════════════════════╗
║               EduSense — By The Numbers              ║
╠══════════════════════════════════════════════════════╣
║  🎯  Model Accuracy          81.1%  (DAISEE)         ║
║  📊  Emotions Detected       4      (per frame)      ║
║  ⏱️  Analysis Interval       2s     (real-time)      ║
║  🧠  Ensemble Models         7      (+2 specialist)  ║
║  🗄️  Supabase Tables         6      (full RLS)       ║
║  🔗  API Routes              25+    (Flask)           ║
║  📓  Notebook Sections       6      (per notebook)   ║
║  🎓  Test Participants       5      (KKU students)   ║
║  📄  Training Clips          6,231  (DAISEE)         ║
║  📄  Validation Clips        1,688  (zero leakage)   ║
╚══════════════════════════════════════════════════════╝
```

</div>

---

## 🌊 Activity Graph

<div align="center">

[![Activity Graph](https://github-readme-activity-graph.vercel.app/graph?username=Rootsu5f&repo=EduSense-Graduation-Project&theme=react-dark&bg_color=0f172a&color=0ea5e9&line=0ea5e9&point=ffffff&area=true&hide_border=true)](https://github.com/Rootsu5f/EduSense-Graduation-Project)

</div>

---


## 📌 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [System Architecture](#-system-architecture)
- [Deep Learning Model](#-deep-learning-model)
- [RAG Pipeline](#-rag-pipeline)
- [Web Application](#-web-application)
- [Database Design](#-database-design)
- [Results](#-results)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Setup & Installation](#-setup--installation)
- [Team](#-team)
- [Institution](#-institution)
- [License](#-license)

---

## 🧠 Overview

**EduSense** addresses a critical gap in online education: instructors cannot tell which students are confused, bored, or frustrated during a lecture — and by the time a quiz reveals this, it is too late.

EduSense runs silently in the background while a student watches a YouTube lecture. Every 2 seconds it captures a webcam frame, runs it through a CLAHE-enhanced FER pipeline, maps raw emotions to four learning states using D'Mello & Graesser (2012) formulas, and applies personal baseline calibration so no two students are judged by the same threshold. When dissatisfaction persists for two consecutive frames, the system triggers the RAG pipeline — retrieving relevant textbook chunks from a FAISS index, combining them with the last 60 seconds of Whisper-transcribed lecture audio, and prompting Claude API to generate a personalised Jupyter notebook for that specific struggle moment.

Teachers see all of this aggregated into a class heatmap — a grid of students × time segments coloured by struggle intensity.

```
Student Webcam  →  CLAHE  →  FER  →  D'Mello Formulas  →  Trigger?
                                                               │
                                                        Whisper transcript
                                                        FAISS textbook chunks
                                                        Claude API
                                                               │
                                                        .ipynb notebook
                                                        Supabase persistence
                                                        Teacher heatmap
```

---

## 🚀 Live Demo

```bash
# Clone and run
git clone https://github.com/Rootsu5f/EduSense-Graduation-Project.git
cd EduSense-Graduation-Project

pip install -r requirements.txt
cp .env.example .env        # fill in your API keys
python app.py

# Open https://localhost:5000
```

**Demo credentials (after running the seed script):**

| Role | Email | Password |
|---|---|---|
| Teacher | Aymen@kku.edu.sa | demo2026@ |
| Student | s444810913@kku.edu.sa | demo2026@ |
| Student | s444802593@kku.edu.sa | demo2026@ |
| Student | s444803647@kku.edu.sa | demo2026@ |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EduSense — Four Layers                       │
├────────────────┬────────────────┬────────────────┬───────────────────┤
│  Layer 01      │  Layer 02      │  Layer 03      │  Layer 04         │
│  Frontend UI   │  Flask API     │  AI Pipeline   │  Supabase         │
│                │                │                │                   │
│  Landing Page  │  /api/auth/*   │  FER + CLAHE   │  PostgreSQL       │
│  Auth Pages    │  /api/start-   │  Baseline Cal. │  Auth (JWT)       │
│  Student Dash  │    session     │  D'Mello Forms │  profiles         │
│  Teacher Dash  │  /api/analyze- │  7-frame EWS   │  sessions         │
│  Live Monitor  │    frame       │  Whisper ASR   │  subjects         │
│  Class Heatmap │  /api/end-     │  FAISS RAG     │  struggle_moments │
│  Light/Dark    │    session     │  Claude API    │  emotion_history  │
│  Lecture Modal │  /api/teacher/ │  yt-dlp        │  notebooks        │
│                │  /api/student/ │                │  Row-Level Sec.   │
└────────────────┴────────────────┴────────────────┴───────────────────┘
```

### Emotion Detection Pipeline

```
Webcam frame (every 2s)
      ↓
CLAHE preprocessing (LAB color space, clipLimit=2.5)
      ↓
FER library → 7 raw emotion scores
      ↓
Personal baseline calibration (first 20 frames)
      ↓
D'Mello & Graesser (2012) formula mapping
  engagement  = happy_adj × 0.75 + surprise × 0.25
  boredom     = neutral_adj × 0.50 + sad × 0.30
  confusion   = (fear × surprise × 6.0) + fear × 0.25   ← multiplicative
  frustration = angry × 0.60 + disgust × 0.30
      ↓
7-frame exponential weighted smoothing
      ↓
Trigger: 2 consecutive dissatisfied frames + 60s cooldown
      ↓
RAG pipeline → .ipynb notebook → Supabase
```

---

## 🤖 Deep Learning Model

The `EduSenseTransformer` is trained on the DAISEE dataset (9,068 video clips, 112 subjects) for research validation of the engagement detection approach.

### Architecture

```
Input (30 frames × 768-dim AffectNet-ViT embeddings)
      ↓
Prepend CLS token → (31, 768)
Add positional encoding
      ↓
Transformer Encoder (4 layers, 12 heads, Pre-LN, norm_first=True)
      ↓
CLS token output → (768,)
      ↓
KAN Layer (B-spline basis, 768 → 256) — learnable activations per connection
      ↓
LayerNorm + ReLU + Dropout
      ↓
4 × CORAL binary heads → [engagement, boredom, confusion, frustration]
```

### Why Each Component

| Component | Reason |
|---|---|
| **Transformer over LSTM** | Sees all 30 frames simultaneously — LSTM forgets early frames |
| **KAN over MLP** | Learnable B-spline activations per connection capture non-linear emotion patterns |
| **CORAL over Softmax** | Preserves ordinal ordering of engagement levels (0→1→2→3) |
| **7-model Ensemble** | Diverse seeds break class collapse on minority emotions |
| **Specialist Models** | Dedicated models for Engagement and Frustration fix 0% recall collapse |

### Results vs State-of-the-Art (DAISEE)

| Model | Accuracy |
|---|---|
| LRCN (2016) | 57.9% |
| ResNet+TCN (2021) | 63.9% |
| EfficientNet+LSTM (2022) | 67.5% |
| General Model (2024) | 68.6% |
| **EduSense (Ours)** | **81.1%** ✅ |

### Per-Emotion Breakdown

| Emotion | Accuracy | Source |
|---|---|---|
| Engagement | 95.7% | Specialist model |
| Frustration | 79.0% | Specialist model |
| Boredom | 75.9% | 7-model ensemble |
| Confusion | 73.6% | 7-model ensemble |
| **Average** | **81.1%** | Hybrid system |

---

## 📚 RAG Pipeline

```
PDF Textbooks
      ↓
PyMuPDF → paragraph chunks (>50 chars)
      ↓
SentenceTransformer (all-MiniLM-L6-v2) → 384-dim embeddings
      ↓
FAISS IndexFlatIP (cosine similarity, exact search)
      ↓  ← stored with subject prefix: "abc12345::TextbookName"
                                                    ↑
                         ensures cross-subject contamination is impossible

On trigger:
  Whisper transcript (last 60s) + subject_id
      ↓
FAISS retrieval → top-5 subject-specific chunks
      ↓
Claude API prompt:
  transcript + textbook chunks + detected emotion
      ↓
Structured JSON → to_ipynb() → .ipynb file
      ↓
Saved to disk + content stored in Supabase notebooks.content
(survives Flask restarts — downloadable anytime)
```

### Generated Notebook Structure

Each notebook contains: title + why generated → explanation + real-world analogy → 3 key points → 2 runnable code examples → practice exercises with hidden solutions → further reading.

---

## 🌐 Web Application

### Student Dashboard
- **Home** — engagement rate, lectures watched, struggle count, notebooks ready
- **Last Lectures** — session history with engagement badge (green/amber/red)
- **Hardest Topics** — difficulty index per subject from real struggle moment data
- **Progress** — engagement trend over sessions, per-subject progress bars
- **My Notebooks** — all generated `.ipynb` files, downloadable any time

### Teacher Dashboard
- **Overview** — total students, avg engagement, struggle events, critical students
- **Class Heatmap** — students × time segments, green→amber→red by struggle intensity
- **Students** — per-student engagement bars, session counts, subjects
- **Insights** — AI-generated teaching recommendations
- **Knowledge Base** — upload course PDFs, indexed into FAISS per subject

### Live Monitor
- YouTube lecture embedded via iFrame
- Real-time webcam feed with CLAHE + FER analysis every 2 seconds
- Live emotion bars (engagement / boredom / confusion / frustration)
- Trigger dots (2 = notebook generation fires)
- Engagement timeline chart (rolling 30-point window)
- Struggle moment list with video timestamps

---

## 🗄 Database Design

Six Supabase tables with Row-Level Security:

```
profiles         — user identity (role: student | teacher)
subjects         — teacher-owned course subjects
sessions         — one per lecture watch (emotion averages, focus rate)
struggle_moments — trigger events (video_time, emotion scores, transcript)
emotion_history  — sampled every 10 frames for analytics
notebooks        — generated .ipynb records + full content for persistence
```

**RLS policies ensure:**
- Students only see their own sessions, struggle moments, and notebooks
- Teachers only see sessions where teacher_id = their UUID
- Backend uses service_role key to bypass RLS for real-time writes

---

## 📊 Results

**Integration Testing** — conducted with 5 volunteer student participants each watching a 45-minute machine learning lecture (backpropagation, gradient descent, activation functions).

| Participant | Avg Engagement | Focus Rate | Struggle Moments | Notebooks |
|---|---|---|---|---|
| Saeed Mohammed Asiri | 72% | 68.4% | 3 | 3 |
| Fahad AL-Qahtani | 61% | 57.2% | 3 | 3 |
| Khalid Al-Dahwan | 81% | 78.6% | 1 | 1 |
| Ahmad Al Sultan | 54% | 49.3% | 4 | 4 |
| Basil Al Muawwadh | 66% | 62.1% | 3 | 3 |

Network traffic validated via Wireshark. Post-session questionnaire confirmed generated notebooks were rated helpful by all 5 participants.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Emotion Detection** | FER, OpenCV (CLAHE), D'Mello formulas, 7-frame EWS |
| **Deep Learning** | PyTorch, AffectNet-ViT, Transformer Encoder, KAN, CORAL |
| **RAG & Knowledge** | FAISS (IndexFlatIP), SentenceTransformers, PyMuPDF |
| **Transcription** | OpenAI Whisper (base), yt-dlp |
| **Notebook Generation** | Claude API (claude-sonnet-4), structured JSON → .ipynb |
| **Backend** | Flask 3.x, Python 3.13, threading, Supabase Python SDK |
| **Database & Auth** | Supabase (PostgreSQL), JWT, Row-Level Security |
| **Frontend** | Vanilla JS SPA, Chart.js, Instrument Sans/Serif, Light/Dark theme |
| **Dataset** | DAISEE (IIT Roorkee) — 9,068 clips, 112 subjects |

---

## 📁 Repository Structure

```
EduSense-Graduation-Project/
│
├── app.py                          # Flask backend — 25+ API routes
├── .env                            # API keys (not committed)
├── requirements.txt
│
├── templates/
│   └── index.html                  # Full frontend SPA (single file)
│
├── Rag_system/
│   ├── edusense_rag.py             # RAG pipeline (FAISS + Whisper + Claude)
│   ├── edusense_kb/                # FAISS index + metadata.pkl
│   ├── uploads/                    # Teacher-uploaded PDFs
│   └── audio/                      # Downloaded lecture audio
│
├── generated_notebooks/            # Generated .ipynb files
│
├── Stage_A_FeatureExtraction/
│   └── EduSense_StageA_FeatureExtraction.ipynb
│
├── Stage_B_Training/
│   └── EduSense_SPECIALIST_EVAL.ipynb
│
├── Docs/
│   └── Report/
│       └── Project Report.pdf
│
└── seed/
    └── inject_edusense_data.py     # Test data injection script
```

---

## ⚙️ Setup & Installation

### Requirements

```
Python 3.11+
FFmpeg (for yt-dlp audio extraction)
Webcam
```

### Installation

```bash
pip install flask flask-cors supabase python-dotenv
pip install fer opencv-python numpy
pip install faiss-cpu sentence-transformers PyMuPDF
pip install anthropic openai-whisper yt-dlp
pip install torch torchvision torchaudio
```

### Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
```

### Supabase Setup

Run in Supabase SQL Editor:

```sql
-- Add content column for notebook persistence
ALTER TABLE notebooks ADD COLUMN IF NOT EXISTS content text;
```

---

## 👨‍💻 Team

<div align="center">

### 📸 EduSense Team — KKU Graduation 2026

<div style="display:inline-block; padding:10px; background:#0ea5e9; border-radius:16px;">
<img src="https://raw.githubusercontent.com/Rootsu5f/EduSense-Graduation-Project/main/Docs/team.jpg" width="100%" style="border-radius:10px; display:block;" alt="EduSense Team Photo"/>
</div>

<br/><br/>

<sub>📍 King Khalid University · College of Computer Science · Abha, Saudi Arabia</sub><br/>
<sub><i>From left to right: Basel · Saeed · Fahad · Dr. Anand Deva Durai C · Khalid · Ahmad</i></sub>

<br/>

</div>

<table align="center">
<tr>

<td align="center" width="160">
<br/>
<b>Basel Awad</b><br/>
<sub>442811409</sub><br/><br/>
<sub>🎨 Frontend Engineer</sub><br/>
<sub>UI/UX · Landing Page · Dashboard Design</sub>
</td>

<td align="center" width="160">
<br/>
<b>Saeed Mohammed S Asiri</b><br/>
<sub>444810913</sub><br/><br/>
<sub>🧠 Project Lead · System Architect</sub><br/>
<sub>AI & ML Researcher · Full-Stack</sub><br/>
<sub>EduSenseTransformer · KAN · CORAL</sub><br/>
<sub>RAG Pipeline · Flask · Supabase</sub>
</td>

<td align="center" width="160">
<br/>
<b>Fahad Abdullah AL-Qahtani</b><br/>
<sub>444802593</sub><br/><br/>
<sub>⚙️ Backend & AI Engineer</sub><br/>
<sub>API Routes · Supabase Integration</sub><br/>
<sub>Emotion Detection · Data Pipeline</sub>
</td>

<td align="center" width="160">
<br/>
<b>Khalid Mushabbab Al-Dahwan</b><br/>
<sub>444803647</sub><br/><br/>
<sub>🔧 Full-Stack Developer</sub><br/>
<sub>Frontend + Backend Integration</sub><br/>
<sub>Testing · Deployment · Auth System</sub>
</td>

<td align="center" width="160">
<br/>
<b>Ahmad Turki Al Sultan</b><br/>
<sub>444803284</sub><br/><br/>
<sub>🤖 AI Engineer</sub><br/>
<sub>Model Training · DAISEE Pipeline</sub><br/>
<sub>Feature Extraction · Evaluation</sub>
</td>

</tr>
</table>

<br/>

<div align="center">

### 🎓 Supervised by

<br/>

**Dr. Anand Deva Durai C**<br/>
<sub>Department of Computer Science · King Khalid University</sub><br/>
<sub>Abha, Saudi Arabia</sub>

</div>

---

## 🏛️ Institution

<div align="center">

**King Khalid University (KKU)**
College of Computer Science — Department of Computer Science
Graduation Project · Academic Year 2026
Abha, Saudi Arabia 🇸🇦

</div>

---

## 📜 License

```
EduSense © 2026 — King Khalid University
Academic and non-commercial use only.
All rights reserved by the EduSense team.
Redistribution or commercial use without explicit written permission is prohibited.
```

---

<div align="center">

## 🤝 Contributing

<div align="center">

[![Contributors](https://contrib.rocks/image?repo=Rootsu5f/EduSense-Graduation-Project)](https://github.com/Rootsu5f/EduSense-Graduation-Project/graphs/contributors)

</div>

---

## 📈 Languages Used

<div align="center">

[![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=Rootsu5f&repo=EduSense-Graduation-Project&layout=compact&theme=react&bg_color=0f172a&title_color=0ea5e9&text_color=ffffff&border_color=1e3a5f)](https://github.com/Rootsu5f/EduSense-Graduation-Project)

</div>

---

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0ea5e9,50:1e3a5f,100:0f172a&height=100&section=footer" width="100%"/>

*Built with curiosity, caffeine, and a deep belief that every confused student deserves to be understood.*

**⭐ Star this repo if EduSense helped you — it means a lot to the team .**

</div>
