"""
VisionTutor - WebSocket Handler

Handles the bidirectional WebSocket connection between the frontend and backend.

Protocol (JSON messages over WebSocket):
  Client -> Server:
    { "type": "audio", "data": "<base64 PCM audio>" }
    { "type": "image", "data": "<base64 JPEG>", "mimeType": "image/jpeg" }
    { "type": "text", "data": "Hello, help me with this" }
    { "type": "config", "subject": "mathematics" }
    { "type": "ping" }

  Server -> Client:
    { "type": "audio", "data": "<base64 PCM audio>" }
    { "type": "transcript", "text": "...", "role": "user"|"model" }
    { "type": "interrupted" }
    { "type": "turn_complete" }
    { "type": "error", "message": "..." }
    { "type": "session_started", "sessionId": "abc123" }
    { "type": "pong" }
"""

import asyncio
import base64
import json
import logging
import time
from typing import Dict, Set

from fastapi import WebSocket, WebSocketDisconnect

from .gemini_session import GeminiSession

logger = logging.getLogger("visiontutor.websocket")

# Track active sessions for cleanup
active_sessions: Dict[str, GeminiSession] = {}


class ConnectionHandler:
    """
    Manages a single WebSocket connection and its associated Gemini session.
    
    Flow:
      1. Client connects via WebSocket
      2. Server creates a GeminiSession
      3. Client streams audio + images -> Server forwards to Gemini
      4. Gemini streams audio responses -> Server forwards to client
      5. On disconnect, everything is cleaned up
    """

    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.gemini: GeminiSession = None
        self._is_connected = False
        self._message_count = 0
        self._audio_bytes_received = 0
        self._images_received = 0

    async def handle(self) -> None:
        """Main handler for the WebSocket connection lifecycle."""
        await self.websocket.accept()
        self._is_connected = True
        logger.info("WebSocket client connected")

        try:
            # Create Gemini session with callbacks that forward to our WebSocket
            self.gemini = GeminiSession(
                on_audio=self._forward_audio_to_client,
                on_transcript=self._forward_transcript_to_client,
                on_interrupted=self._handle_interruption,
                on_turn_complete=self._handle_turn_complete,
            )

            # Connect to Gemini Live API
            await self.gemini.connect()

            # Track the active session
            active_sessions[self.gemini.session_id] = self.gemini

            # Notify client that session is ready
            await self._send_json({
                "type": "session_started",
                "sessionId": self.gemini.session_id,
            })

            # Main message loop — receive from client, forward to Gemini
            await self._receive_loop()

        except WebSocketDisconnect:
            logger.info("WebSocket client disconnected")
        except Exception as e:
            logger.error(f"WebSocket handler error: {e}", exc_info=True)
            await self._send_json({
                "type": "error",
                "message": str(e),
            })
        finally:
            await self._cleanup()

    async def _receive_loop(self) -> None:
        """Continuously receive and process messages from the client."""
        while self._is_connected:
            try:
                raw = await self.websocket.receive_text()
                msg = json.loads(raw)
                self._message_count += 1

                msg_type = msg.get("type", "")

                if msg_type == "audio":
                    await self._handle_audio(msg)

                elif msg_type == "image":
                    await self._handle_image(msg)

                elif msg_type == "text":
                    await self._handle_text(msg)

                elif msg_type == "config":
                    await self._handle_config(msg)

                elif msg_type == "ping":
                    await self._send_json({"type": "pong"})

                else:
                    logger.warning(f"Unknown message type: {msg_type}")

            except WebSocketDisconnect:
                raise
            except json.JSONDecodeError as e:
                logger.warning(f"Invalid JSON from client: {e}")
            except Exception as e:
                logger.error(f"Error processing message: {e}", exc_info=True)

    async def _handle_audio(self, msg: dict) -> None:
        """Process audio chunk from client."""
        audio_b64 = msg.get("data", "")
        if not audio_b64:
            return

        pcm_bytes = base64.b64decode(audio_b64)
        self._audio_bytes_received += len(pcm_bytes)
        await self.gemini.send_audio(pcm_bytes)

    async def _handle_image(self, msg: dict) -> None:
        """Process image frame from client."""
        image_b64 = msg.get("data", "")
        mime_type = msg.get("mimeType", "image/jpeg")
        if not image_b64:
            return

        image_bytes = base64.b64decode(image_b64)
        self._images_received += 1
        logger.info(
            f"Received image #{self._images_received} "
            f"({len(image_bytes)} bytes, {mime_type})"
        )
        await self.gemini.send_image(image_bytes, mime_type)

    async def _handle_text(self, msg: dict) -> None:
        """Process text message from client."""
        text = msg.get("data", "")
        if text:
            logger.info(f"Received text: {text[:100]}")
            await self.gemini.send_text(text)

    async def _handle_config(self, msg: dict) -> None:
        """Handle runtime config updates (e.g., subject change)."""
        subject = msg.get("subject", "")
        if subject:
            # Inject subject context into the ongoing session
            context_msg = (
                f"[System: The student is now studying {subject}. "
                f"Adapt your tutoring style accordingly.]"
            )
            await self.gemini.send_text(context_msg)
            logger.info(f"Subject changed to: {subject}")

    # ---- Callbacks from GeminiSession ----

    async def _forward_audio_to_client(self, audio_bytes: bytes) -> None:
        """Forward audio from Gemini to the WebSocket client."""
        if not self._is_connected:
            return
        try:
            await self._send_json({
                "type": "audio",
                "data": base64.b64encode(audio_bytes).decode("ascii"),
            })
        except Exception as e:
            logger.error(f"Error forwarding audio: {e}")

    async def _forward_transcript_to_client(
        self, text: str, role: str
    ) -> None:
        """Forward transcription to the WebSocket client."""
        if not self._is_connected:
            return
        try:
            await self._send_json({
                "type": "transcript",
                "text": text,
                "role": role,
            })
        except Exception as e:
            logger.error(f"Error forwarding transcript: {e}")

    async def _handle_interruption(self) -> None:
        """Notify client that the user interrupted (barge-in)."""
        if not self._is_connected:
            return
        try:
            await self._send_json({"type": "interrupted"})
        except Exception as e:
            logger.error(f"Error sending interruption: {e}")

    async def _handle_turn_complete(self) -> None:
        """Notify client that the model finished speaking."""
        if not self._is_connected:
            return
        try:
            await self._send_json({"type": "turn_complete"})
        except Exception as e:
            logger.error(f"Error sending turn_complete: {e}")

    # ---- Helpers ----

    async def _send_json(self, data: dict) -> None:
        """Send a JSON message to the WebSocket client."""
        await self.websocket.send_text(json.dumps(data))

    async def _cleanup(self) -> None:
        """Clean up resources on disconnect."""
        self._is_connected = False

        if self.gemini:
            session_id = self.gemini.session_id
            active_sessions.pop(session_id, None)
            await self.gemini.close()

            logger.info(
                f"Session {session_id} stats: "
                f"messages={self._message_count}, "
                f"audio_bytes={self._audio_bytes_received}, "
                f"images={self._images_received}"
            )
