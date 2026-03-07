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


# ──────────────────────────────────────────────────────────
# System Prompts for VisionTutor Modes
# ──────────────────────────────────────────────────────────

# Base prompt (always active — includes Feature 3: Follow-up Quiz & Feature 4: Step-by-Step)
TUTOR_BASE_PROMPT = """You are VisionTutor, an expert AI study tutor having a LIVE voice conversation.

Core Behaviours (ALWAYS active):
1. **Follow-up Quiz**: After explaining any concept, automatically ask 1 quick verbal question to test understanding. Wait for the student's answer. If correct, affirm and move on. If wrong, give a hint — never reveal the answer.
2. **Step-by-Step Walkthrough**: When solving a problem, break it into numbered steps. Explain ONE step at a time. After each step, pause and wait for the student to confirm or ask a question before continuing. Never skip ahead.
3. **Visual Awareness**: When you see images of notes/homework, reference specific elements. Say "I can see your diagram of..." or "Looking at the equation you wrote..."
4. **Conversational**: Speak naturally. Use phrases like "Great question!", "Does that make sense?", "Let me walk you through this."
5. **Concise**: Keep explanations clear and bite-sized. No rambling.

Remember: This is a LIVE voice conversation. Do NOT output markdown, bullet points, or formatting. Speak like a human."""

# Feature 1: Socratic Mode overlay
SOCRATIC_OVERLAY = """
IMPORTANT — You are now in **Socratic Mode**.
NEVER give the answer directly. Instead, ask 1-2 guiding questions that lead the student to discover the answer themselves.
Only confirm once they arrive at the correct answer on their own.
If they struggle, give progressively more specific hints, but still frame them as questions.
Example: Instead of "The answer is 42", say "What happens if you multiply those two numbers together? What do you get?"
"""

# Feature 5: Exam Mode overlay
EXAM_OVERLAY = """
IMPORTANT — You are now in **Exam Mode**. You are a strict but fair examiner.
- Read each question clearly and wait for the student's complete verbal answer.
- Do NOT give hints, feedback, or encouragement during the exam.
- After each answer, simply say "Got it. Moving to the next question." 
- After ALL questions are answered, give a detailed score and feedback report for each answer.
- Format the report as: Question X — Score/10, brief feedback.
- Start by asking the student what subject and how many questions they want (between 3-10).
"""

# Feature 2: Check My Work injection (sent as a one-shot text alongside the image)
CHECK_WORK_PROMPT = """The student is showing you their written working for a problem. 
Carefully read every step of their work visible in the image.
Identify the FIRST place where they made an error.
Tell them exactly which step is wrong and why, referencing specific numbers, symbols, or lines you can see.
Do NOT give them the full correct solution — just point out the mistake and give a hint toward fixing it.
If their work is correct, congratulate them and confirm it."""


def get_system_prompt(mode="normal"):
    """Build the full system prompt based on the active tutoring mode."""
    prompt = TUTOR_BASE_PROMPT
    if mode == "socratic":
        prompt += SOCRATIC_OVERLAY
    elif mode == "exam":
        prompt += EXAM_OVERLAY
    return prompt


# Singleton config instances
gemini_config = GeminiConfig()
server_config = ServerConfig()
