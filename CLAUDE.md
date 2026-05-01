# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

```bash
# Main app (no Supabase integration)
python app.py

# Latest app with Supabase integration
python "app (35).py"

# Open in browser
# http://localhost:5000
```

There is no `requirements.txt`. Core Python dependencies:
```
flask flask-cors python-dotenv numpy opencv-python fer supabase
faiss-cpu sentence-transformers anthropic openai-whisper PyMuPDF yt-dlp
```

## Environment Variables

Copy `.env` values:
- `ANTHROPIC_API_KEY` — Claude API for notebook generation
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_KEY` — Supabase service role key (used in `app (35).py`)
- `SUPABASE_ANON_KEY` — Supabase anon key

## Architecture Overview

EduSense detects student confusion during online lectures using webcam facial analysis, then generates personalized study notebooks via RAG + Claude API.

**Data flow:**
```
YouTube URL → yt_dlp audio → Whisper transcript
Webcam frame (Base64) → FER emotions → smoothing → struggle detection
Struggle detected → transcript context + FAISS KB retrieval → Claude API → .ipynb notebook
```

### Flask Backend (`app.py` / `app (35).py`)

Single global `session` dict holds all runtime state (active flag, transcript, emotion history, struggle moments, notebooks, Supabase IDs). No database for live state — everything is in-memory per server process.

Key API endpoints:
- `POST /api/start-session` — downloads audio via yt_dlp, transcribes with Whisper in a background thread
- `POST /api/analyze-frame` — receives base64 webcam frame, runs FER pipeline, appends to emotion history
- `POST /api/end-session` — generates notebooks for all detected struggle moments
- `POST /api/upload-pdf` — indexes a PDF into the FAISS knowledge base
- `GET /api/status` / `GET /api/engagement-timeline` / `GET /api/session-report`

**Emotion pipeline in `analyze_frame()`:**
1. CLAHE preprocessing for lighting normalization
2. FER-7 → 7 raw emotion probabilities (happy, neutral, fear, surprise, angry, disgust, sad)
3. Personal baseline calibration (first 20 frames set `baseline_neutral` / `baseline_happy`)
4. Formula-based mapping to 4 learning states: engagement, boredom, confusion, frustration
5. Exponential weighted smoothing over 7-frame buffer
6. `is_dissatisfied()` triggers notebook generation if 3+ consecutive negative frames with 3-min cooldown

### RAG System (`Rag_system/edusense_rag.py`)

Three classes compose the pipeline:

- **`PDFKnowledgeBase`** — FAISS flat index with `all-MiniLM-L6-v2` embeddings (384-dim). Persists to `Rag_system/edusense_kb/faiss.index` + `metadata.pkl`. Chunks PDFs by paragraph with 200-char overlap.
- **`LectureTranscriber`** — Whisper wrapper; stores segments with timestamps for time-windowed transcript retrieval.
- **`NotebookGenerator`** — retrieves top-4 FAISS chunks + lecture transcript slice → prompts `claude-sonnet-4-20250514` → parses JSON response → writes `.ipynb` to `generated_notebooks/`.

`EduSenseRAG` orchestrates all three; accessed lazily via `get_rag()` in Flask.

### Frontend (`templates/`)

`index.html` + `templates/app.js` — vanilla JS, no build step required. Uses:
- Chart.js for real-time emotion timeline
- YouTube iFrame API for embedded lecture video
- `navigator.mediaDevices.getUserMedia` for webcam capture (frame sent every 2s as base64 JPEG)

### React Prototype (`Prototype/`)

Separate Vite + React app, independently runnable. Not connected to the Flask backend in production — this was a UI exploration.

## File Organization Notes

- `app.py` — original version without Supabase
- `app (6).py` through `app (35).py` — iterative development snapshots; `app (35).py` is the latest with full Supabase auth integration
- `Models/` — contains `specialist_engagement.pth`, `specialist_frustration.pth` (PyTorch); currently not used in `app.py` (FER library is used instead)
- `experimints/` — experimental code, not part of production pipeline
- `Fake Data Injection/` — seed scripts for Supabase tables
- `generated_notebooks/` — output location for Claude-generated `.ipynb` files
- `Rag_system/edusense_kb/` — persisted FAISS index; delete to reset the knowledge base
