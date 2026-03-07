# VisionTutor 👀🗣️
*An AI tutor that sees your notes, hears your questions, and responds in real-time.*

Built for the **Gemini Live Agent Challenge** (Category: *Live Agents 🗣️*).

[![Deploy to Google Cloud](https://img.shields.io/badge/Deployed_on-Google_Cloud-blue?logo=googlecloud)](https://cloud.google.com/)
[![Built with Gemini](https://img.shields.io/badge/Powered_by-Gemini_2.5_Live-indigo?logo=google)](https://ai.google.dev/)

---

## 🎯 What it is
VisionTutor is a next-generation study application that moves far beyond standard text-based chat. By leveraging the new **Gemini Live API (WebSockets)** via the **Google GenAI Python SDK (v1.5.0)**, VisionTutor acts as a real-time conversational agent.

### Features
* **Multimodal Input**: Simultaneously accepts high-frequency PCM audio from your microphone and video frames from your webcam.
* **"Show and Tell"**: Point your camera at handwritten math homework, physics diagrams, or upload a textbook screenshot while talking naturally.
* **Instant Voice Response**: The tutor speaks back using Gemini's native voice (`Kore` persona) with near-zero latency.
* **Natural Interruption**: You can barge-in and interrupt the tutor mid-sentence. The system detects "interrupted" signals from the server and instantly halts the audio playback queue.
* **Subject Context Alignment**: Switch between core subjects (Maths, Physics, CS) to inject dynamic system instructions for tailored tutoring styles (e.g., Socratic method).

---

## 🏗️ Architecture

```mermaid
flowchart TD
    subgraph Frontend [Next.js Client (React)]
        UI[Minimal Glassmorphic UI]
        Mic[Microphone PCM 16kHz]
        Cam[Webcam / Upload Frames 1fps]
        Speaker[AudioContext 24kHz Playback]
        
        Mic & Cam --> UI
        UI -->|WebSocket: JSON + Base64| API_Gateway
        API_Gateway -->|WebSocket: JSON + Audio Chunks| Speaker
    end

    subgraph Backend [Google Cloud Run (Python / FastAPI)]
        API_Gateway[WebSocket Handler]
        SessionMgr[GeminiSession Async Context]
        
        API_Gateway -->|Route Media| SessionMgr
        SessionMgr -->|Handle turn_complete / interrupt| API_Gateway
    end

    subgraph GoogleAI [Google GenAI]
        Model((Gemini 2.5 Flash Native Audio Preview))
    end

    SessionMgr <-->|BidiGenerateContent WSS| Model
```

---

## ⚙️ Technologies Used

### Backend (Python/FastAPI)
* **`google-genai` (v1.5.0)** – The newest Google GenAI SDK to open an `AsyncSession` to the Live API.
* **FastAPI + Uvicorn** – To proxy WebSockets and isolate frontend connectivity from the model context.
* **Docker** – For containerizing the application.
* **Deployed to:** Google Cloud Run (See Proof of Deployment Video).

### Frontend (Next.js/React)
* **Next.js** (App Router)
* **Web Audio API** – For capturing 16kHz float32 arrays, converting them to Int16 PCM, and cleanly scheduling 24kHz buffer nodes fetched from Gemini.
* **Canvas API** – Extracting responsive chunks from the Webcam stream.

---

## 🚀 How to Run Locally

If you are a judge testing the application, follow these exact steps to reproduce:

### Prerequisites
* **Python 3.10+**
* **Node.js 18+**
* An active **Gemini API Key**

### 1. Start the Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or `.venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Set your API Key
export GEMINI_API_KEY="AIzaSy..."  # Or set in backend/.env file

# Start the server (runs on port 8000)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start the Frontend
Open a new terminal tab:
```bash
cd frontend
npm install

# Connects to backend on localhost:8000
npm run dev
```

Visit **`http://localhost:3000`** in Google Chrome or Microsoft Edge. 
*Note: Ensure you allow Microphone and Camera permissions when prompted!*

---

## ☁️ Google Cloud Deployment (Bonus Points)

The backend is fully bundled and automated for deployment on **Google Cloud Run**.
As part of the hackathon "Bonus Points" initiative, an Infrastructure-as-Code automated deployment script has been written in `backend/deploy-backend.ps1` (for windows environments) / `.sh equivalents`.

**To deploy yourself using GCP:**

1. Authenticate with `gcloud auth login`
2. Set project: `gcloud config set project [YOUR-PROJECT-ID]`
3. Create a Secret in Secret Manager named `VISIONTUTOR_GEMINI_API_KEY` holding your Gemini key.
4. Run the automated script:
   ```powershell
   cd backend
   .\deploy-backend.ps1 -ProjectId YOUR-PROJECT-ID
   ```
   *(This script handles building via `gcloud builds submit` and deploying via `gcloud run deploy`, automatically setting port configurations and mounting the API key secret).*

---

## 🧠 Learnings & Challenges

* **SDK Versioning:** Google’s new `google-genai` pip package changes rapidly. We had to migrate rapidly from `genai.chat` patterns to the experimental `client.aio.live.connect()` Async Context Managers required by SDK v1.5.0.
* **Method Hunting:** In version 1.5.0, older helper methods like `send_realtime_input` were condensed into a unified `send(input=types.LiveClientRealtimeInput(...))` function, requiring careful validation against the SDK source.
* **Audio Synthesis Rendering Gap:** While receiving PCM audio chunks from Gemini, simple `onended` queue methods caused robotic stuttering due to the Event Loop block gap. We implemented a seamless Web Audio API scheduling mechanism (`nextPlayTimeRef`) to perfectly buffer chunks ahead of time, making Gemini's voice flow smoothly!
* **FastAPI WebSocket Proxying:** Holding the WebSocket connection open indefinitely natively between the Python Server and React Client while inside the Gemini `__aenter__` context manager required strong task separation `asyncio.create_task()` to prevent overlapping thread panics.
