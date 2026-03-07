"""
VisionTutor - Gemini Live API Session Manager

Manages the bidirectional streaming connection to Google's Gemini Live API.
Each connected WebSocket client gets its own GeminiSession that handles:
  - Opening/closing the Gemini Live session
  - Forwarding audio chunks (PCM 16kHz mono)
  - Forwarding image frames (JPEG) alongside audio
  - Receiving audio responses and transcriptions
  - Handling barge-in / interruptions via VAD
"""

import asyncio
import base64
import logging
import time
import uuid
from typing import Optional, Callable, Awaitable

from google import genai
from google.genai import types

from .config import gemini_config, TUTOR_SYSTEM_PROMPT

logger = logging.getLogger("visiontutor.gemini")


class GeminiSession:
    """
    Wraps a single Gemini Live API session.
    
    Lifecycle:
        1. create() -> opens the Live session
        2. send_audio(pcm_bytes) -> streams audio to Gemini
        3. send_image(jpeg_bytes) -> sends a camera frame to Gemini
        4. receive loop yields audio chunks and events back
        5. close() -> tears down the session
    """

    def __init__(
        self,
        on_audio: Optional[Callable[[bytes], Awaitable[None]]] = None,
        on_transcript: Optional[Callable[[str, str], Awaitable[None]]] = None,
        on_interrupted: Optional[Callable[[], Awaitable[None]]] = None,
        on_turn_complete: Optional[Callable[[], Awaitable[None]]] = None,
        on_session_error: Optional[Callable[[str], Awaitable[None]]] = None,
    ):
        """
        Args:
            on_audio: callback(audio_bytes) -> called with PCM audio from Gemini
            on_transcript: callback(text, role) -> called with transcription text
            on_interrupted: callback() -> called when user interrupts (barge-in)
            on_turn_complete: callback() -> called when model finishes a turn
            on_session_error: callback(error_msg) -> called on session error
        """
        self.session_id = str(uuid.uuid4())[:8]
        self.on_audio = on_audio
        self.on_transcript = on_transcript
        self.on_interrupted = on_interrupted
        self.on_turn_complete = on_turn_complete
        self.on_session_error = on_session_error

        self._client: Optional[genai.Client] = None
        self._session = None
        self._ctx_manager = None  # Must keep reference to prevent GC
        self._receive_task: Optional[asyncio.Task] = None
        self._is_active = False
        self._auto_reconnect = True
        self._reconnect_count = 0
        self._created_at = time.time()

    async def connect(self) -> None:
        """Open a connection to the Gemini Live API."""
        logger.info(f"[{self.session_id}] Connecting to Gemini Live API...")

        # Initialize the GenAI client
        self._client = genai.Client(api_key=gemini_config.api_key)

        # Configure the Live session
        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=types.Content(
                parts=[types.Part(text=TUTOR_SYSTEM_PROMPT)]
            ),
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=gemini_config.voice_name
                    )
                )
            ),
        )

        # Open the live session
        # IMPORTANT: Store the context manager to prevent garbage collection
        self._ctx_manager = self._client.aio.live.connect(
            model=gemini_config.model,
            config=config,
        )
        self._session = await self._ctx_manager.__aenter__()

        self._is_active = True

        # Start the receive loop in a background task
        self._receive_task = asyncio.create_task(
            self._receive_loop(),
            name=f"gemini-receive-{self.session_id}"
        )

        logger.info(f"[{self.session_id}] Connected to Gemini Live API successfully")

    async def send_audio(self, pcm_data: bytes) -> None:
        """
        Send a chunk of PCM audio to Gemini.
        
        Args:
            pcm_data: Raw PCM audio bytes (16-bit, 16kHz, mono)
        """
        if not self._is_active or not self._session:
            return

        try:
            await self._session.send_realtime_input(
                audio=types.Blob(
                    data=pcm_data,
                    mime_type=f"audio/pcm;rate={gemini_config.audio_send_sample_rate}"
                )
            )
        except Exception as e:
            logger.error(f"[{self.session_id}] Error sending audio: {e}")

    async def send_image(self, image_data: bytes, mime_type: str = "image/jpeg") -> None:
        """
        Send an image frame to Gemini alongside the audio stream.
        
        The Live API accepts images via send_realtime_input alongside audio.
        Best practice: send ~1 frame per second, JPEG, ~768x768 resolution.
        
        Args:
            image_data: Raw image bytes (JPEG or PNG)
            mime_type: MIME type of the image (default: image/jpeg)
        """
        if not self._is_active or not self._session:
            return

        try:
            await self._session.send_realtime_input(
                video=types.Blob(
                    data=image_data,
                    mime_type=mime_type
                )
            )
            logger.debug(f"[{self.session_id}] Sent image frame ({len(image_data)} bytes)")
        except Exception as e:
            logger.error(f"[{self.session_id}] Error sending image: {e}")

    async def send_text(self, text: str) -> None:
        """
        Send a text message to the session (e.g., for context injection).
        
        Args:
            text: The text to send to Gemini
        """
        if not self._is_active or not self._session:
            return

        try:
            await self._session.send_client_content(
                turns=text,
                turn_complete=True
            )
            logger.debug(f"[{self.session_id}] Sent text: {text[:50]}...")
        except Exception as e:
            logger.error(f"[{self.session_id}] Error sending text: {e}")

    async def _receive_loop(self) -> None:
        """
        Background task that continuously receives responses from Gemini.
        
        Handles:
          - Audio data -> forwarded to client for playback
          - Transcriptions -> forwarded for display
          - Interruptions -> signals client to stop playback
          - Turn completion -> signals client that model finished speaking
        """
        logger.info(f"[{self.session_id}] Starting receive loop")

        try:
            while self._is_active:
                turn = self._session.receive()
                async for response in turn:
                    # ---- Handle model audio output ----
                    if (
                        response.server_content
                        and response.server_content.model_turn
                    ):
                        for part in response.server_content.model_turn.parts:
                            # Audio data from the model
                            if (
                                part.inline_data
                                and isinstance(part.inline_data.data, bytes)
                            ):
                                if self.on_audio:
                                    await self.on_audio(part.inline_data.data)

                            # Text part (shouldn't happen in AUDIO mode, but just in case)
                            if part.text:
                                logger.debug(
                                    f"[{self.session_id}] Model text: {part.text[:100]}"
                                )

                    # ---- Handle interruptions (barge-in) ----
                    if (
                        response.server_content
                        and response.server_content.interrupted
                    ):
                        logger.info(f"[{self.session_id}] User interrupted (barge-in)")
                        if self.on_interrupted:
                            await self.on_interrupted()

                    # ---- Handle turn completion ----
                    if (
                        response.server_content
                        and response.server_content.turn_complete
                    ):
                        logger.debug(f"[{self.session_id}] Model turn complete")
                        if self.on_turn_complete:
                            await self.on_turn_complete()

                    # ---- Handle output audio transcription ----
                    if (
                        response.server_content
                        and response.server_content.output_transcription
                    ):
                        transcript_text = response.server_content.output_transcription.text
                        if transcript_text and self.on_transcript:
                            await self.on_transcript(transcript_text, "model")

                    # ---- Handle input audio transcription ----
                    if (
                        response.server_content
                        and response.server_content.input_transcription
                    ):
                        transcript_text = response.server_content.input_transcription.text
                        if transcript_text and self.on_transcript:
                            await self.on_transcript(transcript_text, "user")

        except asyncio.CancelledError:
            logger.info(f"[{self.session_id}] Receive loop cancelled")
        except Exception as e:
            logger.error(f"[{self.session_id}] Receive loop error: {e}", exc_info=True)
            # Attempt auto-reconnect if the session died unexpectedly
            if self._is_active and self._auto_reconnect:
                logger.info(f"[{self.session_id}] Attempting auto-reconnect...")
                try:
                    await self._reconnect()
                    return  # _reconnect starts a new receive loop
                except Exception as re:
                    logger.error(f"[{self.session_id}] Reconnect failed: {re}")
            if self.on_session_error:
                await self.on_session_error(str(e))
        finally:
            self._is_active = False
            logger.info(f"[{self.session_id}] Receive loop ended")

    async def _reconnect(self) -> None:
        """Reconnect to Gemini Live API after a session drop."""
        # Close old session
        if self._ctx_manager:
            try:
                await self._ctx_manager.__aexit__(None, None, None)
            except Exception:
                pass
            self._session = None
            self._ctx_manager = None

        # Reopen
        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=types.Content(
                parts=[types.Part(text=TUTOR_SYSTEM_PROMPT)]
            ),
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=gemini_config.voice_name
                    )
                )
            ),
        )

        self._ctx_manager = self._client.aio.live.connect(
            model=gemini_config.model,
            config=config,
        )
        self._session = await self._ctx_manager.__aenter__()

        self._is_active = True
        self._reconnect_count += 1
        logger.info(
            f"[{self.session_id}] Reconnected successfully "
            f"(reconnect #{self._reconnect_count})"
        )

        # Restart receive loop
        self._receive_task = asyncio.create_task(
            self._receive_loop(),
            name=f"gemini-receive-{self.session_id}-r{self._reconnect_count}"
        )

    async def close(self) -> None:
        """Gracefully close the Gemini session."""
        logger.info(f"[{self.session_id}] Closing session...")
        self._is_active = False
        self._auto_reconnect = False  # Prevent reconnect during close

        if self._receive_task and not self._receive_task.done():
            self._receive_task.cancel()
            try:
                await self._receive_task
            except asyncio.CancelledError:
                pass

        if self._ctx_manager:
            try:
                await self._ctx_manager.__aexit__(None, None, None)
            except Exception as e:
                logger.error(f"[{self.session_id}] Error closing session: {e}")
            self._session = None
            self._ctx_manager = None

        elapsed = time.time() - self._created_at
        logger.info(
            f"[{self.session_id}] Session closed "
            f"(duration: {elapsed:.1f}s, reconnects: {self._reconnect_count})"
        )

    @property
    def is_active(self) -> bool:
        return self._is_active

    @property
    def duration(self) -> float:
        return time.time() - self._created_at

