# VisionTutor 🎓

A real-time AI study tutor that **sees your notes** and **hears your questions** — powered by Gemini Live API.

> Built for the **Gemini Live Agent Challenge** (Deadline: March 17, 2026)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Next.js · Web Audio API · Canvas API               │
│  [Mic Input] [Webcam Capture] [Live Transcript]     │
└─────────────────┬───────────────────────────────────┘
                  │ WebSocket (WSS)
                  │ Audio chunks + Image frames
┌─────────────────▼───────────────────────────────────┐
│                    BACKEND                           │
│  FastAPI · Python · Async WebSocket Handler         │
│  [Session Manager] [Prompt Engine]                  │
└─────────────────┬───────────────────────────────────┘
                  │ Google GenAI SDK
                  │ Live API Protocol
┌─────────────────▼───────────────────────────────────┐
│              GEMINI LIVE API                         │
│  Gemini 2.5 Flash · Native Audio                    │
│  [Vision] [Speech I/O] [Barge-in]                   │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Gemini API Key](https://aistudio.google.com/apikey)

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt

# Configure your API key
copy .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Test your Gemini connection
python test_gemini_connection.py

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup (Coming Day 4-5)

```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
VisionTutor/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings + system prompt
│   │   ├── gemini_session.py    # Gemini Live API wrapper
│   │   └── websocket_handler.py # WebSocket protocol handler
│   ├── test_gemini_connection.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/                    # Next.js app (Day 4-5)
├── study-tutor-plan (1).html    # Hackathon blueprint
└── README.md
```

## 🔌 WebSocket Protocol

### Client → Server

| Type | Payload | Description |
|------|---------|-------------|
| `audio` | `{ data: base64_pcm }` | PCM 16-bit 16kHz mono audio chunk |
| `image` | `{ data: base64_jpeg, mimeType }` | JPEG camera frame (~1 fps) |
| `text` | `{ data: string }` | Text message to tutor |
| `config` | `{ subject: string }` | Change subject context |

### Server → Client

| Type | Payload | Description |
|------|---------|-------------|
| `audio` | `{ data: base64_pcm }` | PCM 24kHz audio from tutor |
| `transcript` | `{ text, role }` | Live transcript (user/model) |
| `interrupted` | `{}` | Barge-in detected |
| `turn_complete` | `{}` | Model finished speaking |

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| AI | Gemini 2.5 Flash (Live API) |
| Backend | Python + FastAPI + WebSockets |
| Frontend | Next.js + Web Audio API + Canvas |
| Cloud | Cloud Run + Firestore + Cloud Storage |

## 📝 License

MIT — Built for the Gemini Live Agent Challenge
