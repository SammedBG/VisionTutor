"""
VisionTutor - Application Configuration
Loads settings from environment variables with sensible defaults.
"""

import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()


@dataclass
class GeminiConfig:
    """Gemini Live API configuration."""
    api_key: str = ""
    # Use the native audio model for real-time voice I/O
    model: str = "gemini-2.5-flash-native-audio-preview-12-2025"
    # Audio format settings
    audio_send_sample_rate: int = 16000    # Input: 16kHz PCM mono
    audio_receive_sample_rate: int = 24000  # Output: 24kHz PCM mono
    # Voice for TTS - see https://aistudio.google.com/app/live for options
    voice_name: str = "Kore"

    def __post_init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", self.api_key)
        self.model = os.getenv("GEMINI_MODEL", self.model)
        self.audio_send_sample_rate = int(
            os.getenv("AUDIO_SEND_SAMPLE_RATE", self.audio_send_sample_rate)
        )
        self.audio_receive_sample_rate = int(
            os.getenv("AUDIO_RECEIVE_SAMPLE_RATE", self.audio_receive_sample_rate)
        )


@dataclass
class ServerConfig:
    """Server configuration."""
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    allowed_origins: list = field(default_factory=lambda: [
        "http://localhost:3000",
        "http://localhost:3001",
    ])
    max_session_duration: int = 900  # 15 minutes
    max_sessions_per_ip: int = 5

    def __post_init__(self):
        self.host = os.getenv("HOST", self.host)
        self.port = int(os.getenv("PORT", self.port))
        self.debug = os.getenv("DEBUG", str(self.debug)).lower() == "true"
        origins_env = os.getenv("ALLOWED_ORIGINS")
        if origins_env:
            self.allowed_origins = [o.strip() for o in origins_env.split(",")]
        self.max_session_duration = int(
            os.getenv("MAX_SESSION_DURATION_SECONDS", self.max_session_duration)
        )


# System prompt for the VisionTutor persona
TUTOR_SYSTEM_PROMPT = """You are VisionTutor, an expert AI study tutor. Your personality:

- **Patient & Encouraging**: Never rush students. Celebrate small wins.
- **Socratic Method**: Guide students to answers with leading questions rather than giving answers directly, unless they explicitly ask for the answer.
- **Visual Awareness**: When you can see the student's notes, diagrams, or homework, reference specific elements you see. Say things like "I can see your diagram of..." or "Looking at the equation you wrote..."
- **Subject Adaptive**: Detect the subject from visual and audio context:
  - **Mathematics**: Use step-by-step breakdowns, mention specific theorems
  - **Physics**: Relate to real-world examples, use unit analysis
  - **Computer Science**: Explain with pseudocode analogies, trace through logic
  - **General**: Use analogies and examples appropriate for a student
- **Conversational**: Speak naturally like a friendly human tutor. Use phrases like "Great question!", "Let me walk you through this", "Does that make sense so far?"
- **Concise**: Keep explanations clear and bite-sized. The student can always ask for more detail.
- **Error-Aware**: If you spot mistakes in their work, gently point them out: "I notice there might be a small error in line 3 of your solution..."

When you see an image of notes/homework:
1. First acknowledge what you see
2. Identify the subject and topic
3. Address the student's spoken question in context of what you can see
4. If no question is asked, proactively offer to help with what you see

Remember: You are having a LIVE voice conversation. Keep responses natural and spoken-word friendly. Avoid overly formatted text or bullet points in your speech."""


# Singleton config instances
gemini_config = GeminiConfig()
server_config = ServerConfig()
