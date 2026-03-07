"""
VisionTutor - Quick Test Script
Tests the Gemini Live API connection directly (no FastAPI/WebSocket needed).

Run: python test_gemini_connection.py

This confirms:
  1. Your API key works
  2. You can open a Live session
  3. Audio round-trip works (send text, get audio back)
  4. Image input works (send a test image, model describes it)
"""


import asyncio
import os
import sys
import base64
from pathlib import Path

# Add parent to path so we can import app config
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from google import genai
from google.genai import types


async def test_basic_connection():
    """Test 1: Basic connection to Gemini Live API."""
    print("\n" + "=" * 60)
    print("TEST 1: Basic Live API Connection")
    print("=" * 60)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        print("ERROR: Set GEMINI_API_KEY in your .env file!")
        print("  Get a key at: https://aistudio.google.com/apikey")
        return False

    client = genai.Client(api_key=api_key)
    model = "gemini-2.5-flash-native-audio-preview-12-2025"

    config = {
        "response_modalities": ["AUDIO"],
        "system_instruction": "You are a helpful tutor. Respond briefly.",
        "speech_config": {
            "voice_config": {
                "prebuilt_voice_config": {"voice_name": "Kore"}
            }
        },
        "output_audio_transcription": {},
    }

    print(f"  Connecting to model: {model}")

    try:
        async with client.aio.live.connect(model=model, config=config) as session:
            print("  ✓ Connected successfully!")

            # Send a text message and get audio + transcript back
            print("  Sending test message: 'Hello, say hi briefly'")
            await session.send_client_content(
                turns="Hello! Just say hi briefly to confirm you're working.",
                turn_complete=True,
            )

            # Collect responses
            audio_chunks = 0
            transcript_parts = []

            turn = session.receive()
            async for response in turn:
                if (
                    response.server_content
                    and response.server_content.model_turn
                ):
                    for part in response.server_content.model_turn.parts:
                        if part.inline_data and isinstance(part.inline_data.data, bytes):
                            audio_chunks += 1

                if (
                    response.server_content
                    and response.server_content.output_transcription
                ):
                    t = response.server_content.output_transcription.text
                    if t:
                        transcript_parts.append(t)

                if (
                    response.server_content
                    and response.server_content.turn_complete
                ):
                    break

            transcript = "".join(transcript_parts)
            print(f"  ✓ Received {audio_chunks} audio chunks")
            print(f"  ✓ Transcript: \"{transcript}\"")
            print("  ✓ TEST 1 PASSED!")
            return True

    except Exception as e:
        print(f"  ✗ Connection failed: {e}")
        return False


async def test_text_mode():
    """Test 2: Text-only mode (useful for testing without audio hardware)."""
    print("\n" + "=" * 60)
    print("TEST 2: Text Mode (no audio)")
    print("=" * 60)

    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)

    # Use the non-native-audio model for text mode
    model = "gemini-live-2.5-flash-preview"
    config = {
        "response_modalities": ["TEXT"],
        "system_instruction": "You are a helpful tutor. Be very brief.",
    }

    print(f"  Connecting to model: {model}")

    try:
        async with client.aio.live.connect(model=model, config=config) as session:
            print("  ✓ Connected!")

            await session.send_client_content(
                turns="What is 2 + 2? Answer in one word.",
                turn_complete=True,
            )

            text_parts = []
            turn = session.receive()
            async for response in turn:
                if response.text:
                    text_parts.append(response.text)
                if (
                    response.server_content
                    and response.server_content.turn_complete
                ):
                    break

            answer = "".join(text_parts)
            print(f"  ✓ Response: \"{answer}\"")
            print("  ✓ TEST 2 PASSED!")
            return True

    except Exception as e:
        print(f"  ✗ Failed: {e}")
        return False


async def test_image_input():
    """Test 3: Send an image to the Live API session."""
    print("\n" + "=" * 60)
    print("TEST 3: Image Input (Vision)")
    print("=" * 60)

    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)

    # Text mode so we can see the description easily
    model = "gemini-live-2.5-flash-preview"
    config = {
        "response_modalities": ["TEXT"],
        "system_instruction": "You are a study tutor. Describe any images you see briefly.",
    }

    # Create a simple test image (a red rectangle — simulates notes)
    try:
        from PIL import Image, ImageDraw, ImageFont
        import io

        # Create a simple "homework" image
        img = Image.new("RGB", (400, 300), "white")
        draw = ImageDraw.Draw(img)
        draw.text((20, 20), "Math Homework", fill="black")
        draw.text((20, 60), "Problem 1:", fill="black")
        draw.text((20, 90), "   2x + 5 = 15", fill="blue")
        draw.text((20, 120), "   Solve for x", fill="black")
        draw.text((20, 180), "Problem 2:", fill="black")
        draw.text((20, 210), "   Area of circle", fill="blue")
        draw.text((20, 240), "   with r = 7cm", fill="black")

        # Convert to JPEG bytes
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        img_bytes = buffer.getvalue()

        print(f"  Created test image ({len(img_bytes)} bytes)")

    except ImportError:
        print("  Pillow not installed, using a minimal PNG instead")
        # Create a 1x1 pixel PNG as fallback
        img_bytes = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )

    print(f"  Connecting to model: {model}")

    try:
        async with client.aio.live.connect(model=model, config=config) as session:
            print("  ✓ Connected!")

            # Send the image as a realtime input
            await session.send_realtime_input(
                video=types.Blob(data=img_bytes, mime_type="image/jpeg")
            )

            # Ask about it
            await session.send_client_content(
                turns="What do you see in the image I just showed you?",
                turn_complete=True,
            )

            text_parts = []
            turn = session.receive()
            async for response in turn:
                if response.text:
                    text_parts.append(response.text)
                if (
                    response.server_content
                    and response.server_content.turn_complete
                ):
                    break

            answer = "".join(text_parts)
            print(f"  ✓ Vision response: \"{answer[:200]}\"")
            print("  ✓ TEST 3 PASSED!")
            return True

    except Exception as e:
        print(f"  ✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests."""
    print("\n╔════════════════════════════════════════════╗")
    print("║  VisionTutor — Gemini Live API Test Suite  ║")
    print("╚════════════════════════════════════════════╝")

    results = []

    results.append(("Basic Connection", await test_basic_connection()))
    results.append(("Text Mode", await test_text_mode()))
    results.append(("Image Input", await test_image_input()))

    print("\n" + "=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {status}  {name}")

    all_passed = all(r[1] for r in results)
    print()
    if all_passed:
        print("  🎉 All tests passed! Your setup is ready for Day 2.")
    else:
        print("  ⚠ Some tests failed. Check the errors above.")

    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
