"use client";

import { useRef, useCallback, useState, useEffect } from "react";

const BACKEND_WS_URL =
  process.env.NEXT_PUBLIC_BACKEND_WS_URL || "ws://localhost:8000/ws/session";

/**
 * Custom hook that manages the WebSocket connection to the VisionTutor backend.
 * Handles audio streaming, image sending, transcript collection, and playback.
 */
export function useVisionTutor() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [error, setError] = useState(null);
  const [currentSubject, setCurrentSubject] = useState("general");
  const [tutorMode, setTutorMode] = useState("normal");

  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioWorkletRef = useRef(null);
  const playbackQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const webcamIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const nextPlayTimeRef = useRef(0);

  const playAudioChunk = useCallback((base64Audio) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000,
      });
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }

    const ctx = audioContextRef.current;

    // Decode base64 to raw PCM bytes
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Convert 16-bit PCM to Float32
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    // Create AudioBuffer
    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    // Schedule playback seamlessly
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    // Start playback right after the previous chunk ends, or now if we lagged
    const now = ctx.currentTime;
    if (nextPlayTimeRef.current < now) {
      nextPlayTimeRef.current = now;
    }

    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuffer.duration;

    setIsTutorSpeaking(true);

    source.onended = () => {
      // If we've reached the end of the scheduled audio
      if (ctx.currentTime >= nextPlayTimeRef.current - 0.1) {
        setIsTutorSpeaking(false);
      }
    };
  }, []);

  const flushPlayback = useCallback(() => {
    setIsTutorSpeaking(false);
    nextPlayTimeRef.current = 0;
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // ── WebSocket Message Handler ──
  const handleMessage = useCallback(
    (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "session_started":
            setSessionId(msg.sessionId);
            setIsConnecting(false);
            setIsConnected(true);
            setError(null);
            break;

          case "audio":
            playAudioChunk(msg.data);
            break;

          case "transcript":
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              // Append to existing message from same role if still streaming
              if (last && last.role === msg.role && !last.complete) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: last.text + msg.text },
                ];
              }
              return [...prev, { role: msg.role, text: msg.text, complete: false, ts: Date.now() }];
            });
            break;

          case "interrupted":
            flushPlayback();
            // Mark last model transcript as complete
            setTranscripts((prev) => {
              if (prev.length > 0) {
                const last = prev[prev.length - 1];
                if (last.role === "model") {
                  return [...prev.slice(0, -1), { ...last, complete: true }];
                }
              }
              return prev;
            });
            break;

          case "turn_complete":
            setTranscripts((prev) => {
              if (prev.length > 0) {
                return [
                  ...prev.slice(0, -1),
                  { ...prev[prev.length - 1], complete: true },
                ];
              }
              return prev;
            });
            break;

          case "error":
            setError(msg.message);
            break;

          case "pong":
            break;

          case "mode_changed":
            setTutorMode(msg.mode);
            setSessionId(msg.sessionId);
            break;

          default:
            console.warn("Unknown message type:", msg.type);
        }
      } catch (e) {
        console.error("WS message parse error:", e);
      }
    },
    [playAudioChunk, flushPlayback]
  );

  // ── Microphone Capture (PCM 16kHz) ──
  const startMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      micStreamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 16000 });
      const source = ctx.createMediaStreamSource(stream);

      // Use ScriptProcessorNode (simpler, works everywhere)
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
          return;

        const float32 = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Send as base64
        const bytes = new Uint8Array(int16.buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        wsRef.current.send(JSON.stringify({ type: "audio", data: base64 }));
      };

      source.connect(processor);
      processor.connect(ctx.destination);
      audioWorkletRef.current = { ctx, processor, source };
      setIsListening(true);
    } catch (e) {
      console.error("Mic error:", e);
      setError("Microphone access denied. Please allow mic access.");
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioWorkletRef.current) {
      audioWorkletRef.current.processor.disconnect();
      audioWorkletRef.current.source.disconnect();
      audioWorkletRef.current.ctx.close();
      audioWorkletRef.current = null;
    }
    setIsListening(false);
  }, []);

  // ── Webcam Frame Capture ──
  const startWebcam = useCallback(async (videoElement, canvasElement) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 768, height: 768, facingMode: "environment" },
      });
      videoElement.srcObject = stream;
      await videoElement.play();
      videoRef.current = videoElement;
      canvasRef.current = canvasElement;

      // Capture frames at 1fps
      webcamIntervalRef.current = setInterval(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
          return;
        if (!videoElement.videoWidth) return;

        const ctx = canvasElement.getContext("2d");
        canvasElement.width = 768;
        canvasElement.height = 768;

        // Center crop to square
        const vw = videoElement.videoWidth;
        const vh = videoElement.videoHeight;
        const size = Math.min(vw, vh);
        const sx = (vw - size) / 2;
        const sy = (vh - size) / 2;

        ctx.drawImage(videoElement, sx, sy, size, size, 0, 0, 768, 768);
        const dataUrl = canvasElement.toDataURL("image/jpeg", 0.8);
        const base64 = dataUrl.split(",")[1];

        wsRef.current.send(
          JSON.stringify({ type: "image", data: base64, mimeType: "image/jpeg" })
        );
      }, 1000);
    } catch (e) {
      console.error("Webcam error:", e);
      setError("Camera access denied. Please allow camera access.");
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (webcamIntervalRef.current) {
      clearInterval(webcamIntervalRef.current);
      webcamIntervalRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // ── Image Upload ──
  const sendImage = useCallback((file) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        const base64 = dataUrl.split(",")[1];

        wsRef.current.send(
          JSON.stringify({
            type: "image",
            data: base64,
            mimeType: "image/jpeg",
          })
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  // ── Text Message ──
  const sendText = useCallback((text) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "text", data: text }));
  }, []);

  // ── Subject Change ──
  const changeSubject = useCallback(
    (subject) => {
      setCurrentSubject(subject);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "config", subject }));
      }
    },
    []
  );

  // ── Mode Change (Normal / Socratic / Exam) ──
  const changeMode = useCallback(
    (mode) => {
      setTutorMode(mode);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "mode", mode }));
      }
    },
    []
  );

  // ── Check My Work (Feature 2: Mistake Detection) ──
  const checkWork = useCallback(
    (optionalImageFile) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      if (optionalImageFile) {
        // If they passed a file, compress and send it with the check_work message
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_SIZE = 1024;
            let w = img.width, h = img.height;
            if (w > h) { if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; } }
            else { if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; } }
            canvas.width = w;
            canvas.height = h;
            canvas.getContext("2d").drawImage(img, 0, 0, w, h);
            const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
            wsRef.current.send(JSON.stringify({ type: "check_work", data: base64, mimeType: "image/jpeg" }));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(optionalImageFile);
      } else {
        // No image — just send the check_work text prompt (works if camera is already feeding frames)
        wsRef.current.send(JSON.stringify({ type: "check_work" }));
      }
    },
    []
  );

  // ── Connect / Disconnect ──
  const connect = useCallback(() => {
    if (wsRef.current) return;
    setIsConnecting(true);
    setError(null);

    const ws = new WebSocket(BACKEND_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = handleMessage;

    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
      setError("Connection error. Is the backend running?");
      setIsConnecting(false);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      wsRef.current = null;
      setIsConnected(false);
      setSessionId(null);
      setIsConnecting(false);
      stopMicrophone();
      stopWebcam();
    };
  }, [handleMessage, stopMicrophone, stopWebcam]);

  const disconnect = useCallback(() => {
    stopMicrophone();
    stopWebcam();
    flushPlayback();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setSessionId(null);
  }, [stopMicrophone, stopWebcam, flushPlayback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    isConnected,
    isConnecting,
    isTutorSpeaking,
    isListening,
    sessionId,
    transcripts,
    error,
    currentSubject,
    tutorMode,

    // Actions
    connect,
    disconnect,
    startMicrophone,
    stopMicrophone,
    startWebcam,
    stopWebcam,
    sendImage,
    sendText,
    changeSubject,
    changeMode,
    checkWork,
    setTranscripts,
    setError,
  };
}
