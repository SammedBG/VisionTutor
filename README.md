# VisionTutor 🎓

**A real-time AI study tutor that sees your notes and hears your questions — powered by Gemini Live API.**

> Built for the **Gemini Live Agent Challenge** | [Live Agents Track](https://ai.google.dev/competition)

[![Deploy to Cloud Run](https://img.shields.io/badge/Deploy-Cloud%20Run-4285F4?logo=google-cloud)](./deploy.sh)
[![Gemini Live API](https://img.shields.io/badge/Powered%20by-Gemini%20Live%20API-8E75B2?logo=google)](https://ai.google.dev/gemini-api/docs/live)

---

## 🎯 What It Does

VisionTutor is a **live AI agent** that acts as your personal study tutor:

1. **🎤 Hears you** — Ask questions naturally via your microphone
2. **📷 Sees your work** — Show handwritten notes, diagrams, or homework via webcam
3. **🗣️ Responds live** — Real-time voice responses like a real tutor
4. **✋ Can be interrupted** — Natural barge-in support mid-sentence
5. **📚 Adapts to subjects** — Math, Physics, CS, Chemistry, Biology

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Next.js · Web Audio API · Canvas API               │
│  [Mic Input] [Webcam Capture] [Live Transcript]     │
└─────────────────┬───────────────────────────────────┘
                  │ WebSocket (WSS)
                  │ Audio chunks (PCM 16kHz) + JPEG frames
┌─────────────────▼───────────────────────────────────┐
│                    BACKEND                           │
│  FastAPI · Python · Async WebSocket Handler         │
│  [Session Manager] [Prompt Engine] [Gemini Bridge]  │
└─────────────────┬───────────────────────────────────┘
                  │ Google GenAI SDK
                  │ Live API Protocol (Bidirectional)
┌─────────────────▼───────────────────────────────────┐
│              GEMINI LIVE API                         │
│  Gemini 2.5 Flash · Native Audio · Vision           │
│  [Speech I/O] [Handwriting OCR] [Barge-in/VAD]     │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Gemini API Key](https://aistudio.google.com/apikey)

### 1. Clone & Setup

```bash
git clone https://github.com/YOUR_USERNAME/visiontutor.git
cd visiontutor
```

### 2. Backend

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt

# Configure API key
copy .env.example .env    # Windows
# cp .env.example .env    # Mac/Linux
# Edit .env → add your GEMINI_API_KEY

# Test connection
python test_gemini_connection.py

# Start server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open

Visit [http://localhost:3000](http://localhost:3000) and start tutoring!

---

## 🐳 Docker (One Command)

```bash
# Make sure backend/.env has your GEMINI_API_KEY
docker-compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8000](http://localhost:8000)

---

## ☁️ Google Cloud Deployment

### Quick Deploy

```bash
export GCP_PROJECT_ID=your-project-id
export GEMINI_API_KEY=your-api-key
bash deploy.sh
```

### What It Does

1. Enables Cloud Run, Cloud Build, Secret Manager APIs
2. Stores your Gemini API key in Secret Manager
3. Builds & pushes Docker image via Cloud Build
4. Deploys to Cloud Run with WebSocket support
5. Outputs your live URL

### CI/CD (GitHub Actions)

Push to `main` → auto-deploys to Cloud Run. Set these GitHub Secrets:
- `GCP_PROJECT_ID` — Your GCP project ID
- `GCP_SA_KEY` — Service account JSON key
- `GEMINI_API_KEY` — Gemini API key

---

## 📁 Project Structure

```
VisionTutor/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI + WebSocket endpoint
│   │   ├── config.py            # Settings + tutor system prompt
│   │   ├── gemini_session.py    # Gemini Live API wrapper
│   │   └── websocket_handler.py # Client ↔ Gemini bridge
│   ├── test_gemini_connection.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── layout.js            # Root layout + metadata
│   │   ├── page.js              # Main session UI
│   │   ├── globals.css          # Design system + animations
│   │   └── hooks/
│   │       └── useVisionTutor.js # WebSocket + audio/video hook
│   ├── Dockerfile
│   └── next.config.mjs
├── .github/workflows/deploy.yml  # CI/CD
├── docker-compose.yml
├── deploy.sh                     # Cloud Run deploy script
└── README.md
```

## 🔌 WebSocket Protocol

### Client → Server

| Type | Payload | Description |
|------|---------|-------------|
| `audio` | `{ data: base64_pcm }` | PCM 16-bit 16kHz mono chunk |
| `image` | `{ data: base64_jpeg, mimeType }` | JPEG camera frame (~1 fps) |
| `text` | `{ data: string }` | Text question |
| `config` | `{ subject: string }` | Change subject context |

### Server → Client

| Type | Payload | Description |
|------|---------|-------------|
| `audio` | `{ data: base64_pcm }` | PCM 24kHz from tutor |
| `transcript` | `{ text, role }` | Live transcript |
| `interrupted` | `{}` | Barge-in detected |
| `turn_complete` | `{}` | Model done speaking |

## 📋 Google Cloud Services Used

| Service | Purpose | Code Reference |
|---------|---------|---------------|
| **Cloud Run** | Hosts backend (WebSocket + Gemini) | `deploy.sh`, `Dockerfile` |
| **Secret Manager** | Stores Gemini API key securely | `deploy.sh` |
| **Gemini Live API** | Real-time multimodal AI | `gemini_session.py` |
| **Cloud Build** | Docker image builds | `.github/workflows/deploy.yml` |

## 🏆 Hackathon Submission Checklist

- [x] Uses Gemini Live API (bidirectional audio + vision)
- [x] Uses Google GenAI Python SDK
- [x] Hosted on Google Cloud (Cloud Run)
- [x] NEW project with multimodal input/output
- [x] Real-time voice + vision interaction
- [x] Barge-in / interruption support
- [x] IaC deployment (deploy script + CI/CD)
- [x] Architecture diagram in README
- [x] Spin-up instructions provided
- [ ] Demo video (< 4 minutes)
- [ ] Devpost submission
- [ ] Blog post / LinkedIn article

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **AI** | Gemini 2.5 Flash (Live API, Native Audio) |
| **Backend** | Python 3.11 + FastAPI + WebSockets |
| **Frontend** | Next.js 16 + Tailwind CSS + Web Audio API |
| **Cloud** | Cloud Run + Secret Manager + Cloud Build |
| **DevOps** | Docker + GitHub Actions CI/CD |

## 📖 Key Learnings

- The Gemini Live API uses `video=` parameter for image frames (not `image=`)
- Audio+video sessions are limited to 2 minutes (use session resumption)
- Only ONE response modality per session (TEXT or AUDIO, not both)
- Use `output_audio_transcription` config to get text alongside audio
- VAD handles barge-in automatically — just flush your playback queue

## 📝 License

MIT — Built with ❤️ for the Gemini Live Agent Challenge

---

**Made by a CS student who believes AI tutoring should be as natural as talking to a friend.**
