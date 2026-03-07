"""
VisionTutor — FastAPI Server Entry Point

This is the main server that:
  1. Serves a health-check REST endpoint
  2. Accepts WebSocket connections at /ws/session
  3. Bridges each WebSocket client to a Gemini Live API session
  4. Handles CORS for the Next.js frontend

Run with:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""


import logging
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import server_config, gemini_config
from .websocket_handler import ConnectionHandler, active_sessions

# ── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if server_config.debug else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("visiontutor")


# ── Lifespan (startup / shutdown) ──────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — runs on startup and shutdown."""
    # ---- Startup ----
    logger.info("=" * 60)
    logger.info("  VisionTutor Backend Starting...")
    logger.info("=" * 60)

    # Validate Gemini API key
    if not gemini_config.api_key or gemini_config.api_key == "your_gemini_api_key_here":
        logger.error(
            "GEMINI_API_KEY is not set! "
            "Copy .env.example to .env and add your API key from "
            "https://aistudio.google.com/apikey"
        )
        # Don't crash — allow health check to work so we can diagnose
    else:
        logger.info(f"  Gemini Model: {gemini_config.model}")
        logger.info(f"  Voice: {gemini_config.voice_name}")

    logger.info(f"  Server: {server_config.host}:{server_config.port}")
    logger.info(f"  Debug: {server_config.debug}")
    logger.info(f"  CORS Origins: {server_config.allowed_origins}")
    logger.info("=" * 60)

    yield  # App is running

    # ---- Shutdown ----
    logger.info("Shutting down — closing active sessions...")
    for session_id, session in list(active_sessions.items()):
        await session.close()
    logger.info("All sessions closed. Goodbye!")


# ── FastAPI App ────────────────────────────────────────────────────────────
app = FastAPI(
    title="VisionTutor API",
    description="Real-time AI study tutor powered by Gemini Live API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware — allow the Next.js frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=server_config.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── REST Endpoints ─────────────────────────────────────────────────────────
@app.get("/")
async def root():
    """Root endpoint — basic info."""
    return {
        "app": "VisionTutor",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint for Cloud Run / load balancers.
    Returns the server status and whether the Gemini API key is configured.
    """
    api_key_set = bool(
        gemini_config.api_key
        and gemini_config.api_key != "your_gemini_api_key_here"
    )
    return {
        "status": "healthy",
        "gemini_api_key_configured": api_key_set,
        "gemini_model": gemini_config.model,
        "active_sessions": len(active_sessions),
    }


@app.get("/api/sessions")
async def list_sessions():
    """List active sessions (for debugging)."""
    if not server_config.debug:
        raise HTTPException(status_code=403, detail="Debug mode only")

    return {
        "active_sessions": [
            {
                "id": sid,
                "duration": s.duration,
                "is_active": s.is_active,
            }
            for sid, s in active_sessions.items()
        ]
    }


# ── WebSocket Endpoint ─────────────────────────────────────────────────────
@app.websocket("/ws/session")
async def websocket_session(websocket: WebSocket):
    """
    Main WebSocket endpoint for live tutoring sessions.

    The client connects here and streams:
      - Audio chunks (PCM 16-bit, 16kHz, mono) as base64
      - Image frames (JPEG) as base64
      - Text messages
    
    The server streams back:
      - Audio responses from Gemini (PCM 24kHz) as base64
      - Transcriptions (both user input and model output)
      - Interruption / turn-complete signals
    """
    handler = ConnectionHandler(websocket)
    await handler.handle()


# ── Run directly ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=server_config.host,
        port=server_config.port,
        reload=server_config.debug,
        log_level="debug" if server_config.debug else "info",
    )
