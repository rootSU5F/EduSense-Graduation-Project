<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,50:1e3a5f,100:0ea5e9&height=200&section=header&text=EduSense&fontSize=72&fontColor=ffffff&fontAlignY=38&desc=Intelligent%20Student%20Confusion%20Detection%20System&descAlignY=60&descSize=18&descColor=93c5fd" width="100%"/>

<br/>

[![KKU](https://img.shields.io/badge/King%20Khalid%20University-College%20of%20CS-0ea5e9?style=for-the-badge&logo=graduation-cap&logoColor=white)](https://www.kku.edu.sa)
[![Status](https://img.shields.io/badge/Status-Defense%20Complete-22c55e?style=for-the-badge&logo=checkmarx&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-Academic%20Use-f59e0b?style=for-the-badge&logo=bookstack&logoColor=white)](#license)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.x-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](#)

<br/>

> **Detecting student confusion in real-time using multimodal AI — combining facial action units, gaze tracking, and engagement signals to deliver actionable insights to instructors.**

<br/>

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Gantt Chart](#-gantt-chart)
- [Documentation](#-documentation)
- [Dataset & References](#-dataset--references)
- [Roadmap](#-roadmap)
- [Contributors](#-contributors)
- [Institution](#-institution)
- [License](#-license)

---

## 🧠 Overview

**EduSense** is a graduation project from King Khalid University that addresses a critical gap in online education: the inability of instructors to detect when students are confused, disengaged, or struggling — in real time.

By combining computer vision, affective computing, and intelligent reporting, EduSense provides a non-intrusive monitoring pipeline that runs during live lectures and generates structured feedback for instructors after each session.

```
Student Webcam Feed  →  Facial Analysis  →  Confusion Classifier  →  Instructor Dashboard
```

> ⚠️ **Note:** This repository currently focuses on documentation, planning, and research artifacts. Implementation code will be integrated in subsequent phases per the project roadmap.

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EduSense Pipeline                        │
├──────────────┬──────────────────────────────┬───────────────────┤
│   INPUT      │        PROCESSING            │      OUTPUT       │
│              │                              │                   │
│  Webcam Feed │  ┌─────────────────────┐    │  Confusion Score  │
│  (Video)     │  │  YOLOv8 Face Det.   │    │  Heatmap Timeline │
│              │  └──────────┬──────────┘    │  Session Report   │
│              │             │               │  RAG-based Tips   │
│              │  ┌──────────▼──────────┐    │                   │
│              │  │  AffectNet ViT Enc. │    │                   │
│              │  └──────────┬──────────┘    │                   │
│              │             │               │                   │
│              │  ┌──────────▼──────────┐    │                   │
│              │  │  KAN + CORAL Cls.   │    │                   │
│              │  └──────────┬──────────┘    │                   │
│              │             │               │                   │
│              │  ┌──────────▼──────────┐    │                   │
│              │  │  7-Model Ensemble   │    │                   │
│              │  └─────────────────────┘    │                   │
└──────────────┴──────────────────────────────┴───────────────────┘
```

---

## ✨ Core Features

| Feature | Description | Status |
|---|---|---|
| 🎯 **Confusion Detection** | Real-time classification using boredom, frustration & confusion signals | ✅ Designed |
| 🧩 **7-Model Ensemble** | Voting ensemble for robust, stable predictions | ✅ Designed |
| 📊 **Ordinal Classification** | CORAL-based ordinal ranking for engagement levels | ✅ Designed |
| 📸 **Baseline Calibration** | Personal neutral-state calibration per student | ✅ Designed |
| 📖 **RAG Feedback** | FAISS-powered retrieval for context-aware instructor tips | ✅ Designed |
| 🎙️ **Whisper Transcription** | Audio transcription for correlating content with confusion spikes | ✅ Designed |
| 📓 **Auto Notebook Gen.** | Claude API-powered session notebooks for instructors | ✅ Designed |
| 🌐 **Flask Web App** | Live webcam monitoring with a real-time dashboard | 🔄 In Progress |

---

## 🛠 Tech Stack

<div align="center">

| Layer | Technologies |
|---|---|
| **Vision & Detection** | YOLOv8, OpenCV, Mediapipe |
| **Feature Extraction** | AffectNet-pretrained ViT |
| **Classification** | KAN (Kolmogorov-Arnold Networks), CORAL Ordinal |
| **Ensemble** | Scikit-learn, Custom Voting Logic |
| **RAG / Search** | FAISS, LangChain |
| **Transcription** | OpenAI Whisper |
| **Notebook Generation** | Claude API (Anthropic) |
| **Web Framework** | Flask, Jinja2 |
| **Core ML** | PyTorch 2.x, Transformers (HuggingFace) |
| **Dataset** | DAiSEE (IIT Roorkee) |

</div>

---

## 📁 Repository Structure

```
EduSense-Graduation-Project/
│
├── 📂 Docs/
│   ├── Report/
│   │   └── Project Report.pdf          # Formal project report
│   └── Chapters/
│       ├── 01_Introduction.md
│       ├── 02_Literature_Review.md
│       ├── 03_System_Design.md
│       └── ...
│
├── 📂 Diagrams/
│   ├── architecture_hld.png            # High-level architecture
│   ├── pipeline_flowchart.png          # Processing pipeline
│   └── erd.png                         # Entity relationship diagram
│
├── 📂 References/
│   ├── DataSet.md                      # Dataset notes & links
│   └── papers/                         # Curated research papers
│
├── 📂 Slides/
│   ├── midterm_presentation.pptx
│   └── final_defense.pptx
│
├── 📄 gant.html                        # Interactive Gantt chart (open in browser)
├── 📄 gantt.csv                        # Gantt data source — edit here to update
└── 📄 README.md                        # You are here
```

---

## 📅 Gantt Chart

The project timeline is tracked via an interactive Gantt chart.

**To view:**
1. Open `gant.html` directly in any browser — no server needed.
2. The chart reads from `gantt.csv` automatically.

**To update the timeline:**
1. Edit `gantt.csv` (preserve existing column headers).
2. Hard-refresh `gant.html` (`Ctrl+Shift+R` / `Cmd+Shift+R`) to reflect changes.

> 📌 If you move either file, update the relative path inside `gant.html` accordingly.

---

## 📚 Documentation

All formal documentation lives under `Docs/`:

- **`Docs/Report/Project Report.pdf`** — The official submitted project report.
- **`Docs/Chapters/`** — Incremental chapter drafts (Introduction → Literature Review → Design → Implementation → Evaluation).

Diagrams (architecture, data flow, ERDs) are maintained separately in `Diagrams/` for easy reuse across documents and slides.

---

## 🔎 Dataset & References

All academic and technical references are under `References/`.

**Primary Dataset:**

[![DAiSEE](https://img.shields.io/badge/Dataset-DAiSEE%20(IIT%20Roorkee)-8b5cf6?style=flat-square&logo=databricks&logoColor=white)](https://people.iith.ac.in/vineethnb/resources/daisee/index.html)

The DAiSEE dataset provides labeled video clips of students annotated across four engagement dimensions: **Boredom**, **Confusion**, **Engagement**, and **Frustration** — making it the primary benchmark for this system.

> See `References/DataSet.md` for full dataset notes, access instructions, and preprocessing decisions.

**Key Research Themes covered in `References/`:**
- Multimodal emotion recognition in educational settings
- Affective computing and facial action unit analysis
- Ordinal classification for engagement grading
- Knowledge distillation and ensemble methods
- RAG pipelines for educational AI assistants

---

## 🧭 Roadmap

```
Phase 1  ██████████  ✅  High-Level Design (HLD)
         Architecture, data flow, module boundaries

Phase 2  ██████████  ✅  Low-Level Design (LLD)
         Detailed specs, interfaces, CORAL/KAN design decisions

Phase 3  ████████░░  🔄  Prototype
         Confusion detection pipeline + minimal demo UI

Phase 4  ░░░░░░░░░░  📋  Evaluation
         Metrics, ablation study, user feedback

Phase 5  ░░░░░░░░░░  📋  Finalization
         Final docs, slides, and defense materials
```

---

## 🧑‍💻 Contributors

<table>
<tr>
<td align="center">
<b>Saeed</b><br/>
<sub>Project Lead · System Architect · ML Engineer</sub>
</td>
<td align="center">
<b>Fahad Abdullah</b><br/>
<sub>Developer · Implementation Engineer</sub>
</td>
</tr>
</table>

---

## 🏛️ Institution

<div align="center">

**King Khalid University (KKU)**  
College of Computer Science — Department of Computer Science  
Graduation Project · Academic Year 2025  
Abha, Saudi Arabia 🇸🇦

</div>

---

## 📜 License

```
EduSense © 2025 — King Khalid University
Academic and non-commercial use only.
All rights reserved by the EduSense team.
Redistribution or commercial use without explicit written permission is prohibited.
```

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0ea5e9,50:1e3a5f,100:0f172a&height=100&section=footer" width="100%"/>

*Built with curiosity, caffeine, and a deep belief that every confused student deserves to be understood.*

</div>
