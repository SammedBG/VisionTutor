"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useVisionTutor } from "./hooks/useVisionTutor";

// ── Icon Components ──────────────────────────────────────────────
function MicIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function MicOffIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function CameraIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function UploadIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function SendIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function PhoneIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function XIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Subject Data ─────────────────────────────────────────────────
const SUBJECTS = [
  { id: "general", label: "General", color: "#a1a1aa" },
  { id: "mathematics", label: "Math", color: "#06b6d4" },
  { id: "physics", label: "Physics", color: "#8b5cf6" },
  { id: "chemistry", label: "Chemistry", color: "#f59e0b" },
  { id: "computer_science", label: "CS", color: "#10b981" },
  { id: "biology", label: "Biology", color: "#f43f5e" },
];

// ── Audio Waveform Visualizer ────────────────────────────────────
function WaveformVisualizer({ isActive, color = "var(--accent-cyan)" }) {
  if (!isActive) return null;
  return (
    <div className="flex items-end gap-[2px] h-6">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className="wave-bar"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

// ── Transcript Message ───────────────────────────────────────────
function TranscriptMessage({ role, text }) {
  const isModel = role === "model";
  return (
    <div
      className={`flex gap-3 animate-fade-in ${isModel ? "" : "flex-row-reverse"}`}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
        style={{
          background: isModel
            ? "linear-gradient(135deg, #06b6d4, #8b5cf6)"
            : "linear-gradient(135deg, #f59e0b, #f43f5e)",
        }}
      >
        {isModel ? "VT" : "You"}
      </div>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isModel
            ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-tl-sm"
            : "bg-[var(--accent-cyan)]/10 text-[var(--text-primary)] rounded-tr-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function Home() {
  const tutor = useVisionTutor();
  const [showCamera, setShowCamera] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);

  const videoElRef = useRef(null);
  const canvasElRef = useRef(null);
  const fileInputRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tutor.transcripts]);

  // ── Handlers ──
  const handleStartSession = useCallback(() => {
    tutor.connect();
  }, [tutor]);

  const handleEndSession = useCallback(() => {
    setShowCamera(false);
    setUploadedImages([]);
    tutor.disconnect();
  }, [tutor]);

  const handleToggleMic = useCallback(() => {
    if (tutor.isListening) {
      tutor.stopMicrophone();
    } else {
      tutor.startMicrophone();
    }
  }, [tutor]);

  const handleToggleCamera = useCallback(() => {
    if (showCamera) {
      tutor.stopWebcam();
      setShowCamera(false);
    } else {
      setShowCamera(true);
      // Start webcam after render
      setTimeout(() => {
        if (videoElRef.current && canvasElRef.current) {
          tutor.startWebcam(videoElRef.current, canvasElRef.current);
        }
      }, 100);
    }
  }, [showCamera, tutor]);

  const handleFileUpload = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      files.forEach((file) => {
        // Preview
        const url = URL.createObjectURL(file);
        setUploadedImages((prev) => [...prev, { url, name: file.name }]);
        // Send to tutor
        tutor.sendImage(file);
      });
      e.target.value = "";
    },
    [tutor]
  );

  const handleSendText = useCallback(
    (e) => {
      e.preventDefault();
      if (!textInput.trim()) return;
      tutor.sendText(textInput.trim());
      tutor.setTranscripts((prev) => [
        ...prev,
        { role: "user", text: textInput.trim(), complete: true, ts: Date.now() },
      ]);
      setTextInput("");
    },
    [textInput, tutor]
  );

  // ── Not Connected State ─────────────────────────────────────
  if (!tutor.isConnected && !tutor.isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center max-w-lg px-6 animate-slide-up">
          {/* Logo */}
          <div className="mb-8">
            <div
              className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6"
              style={{
                background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                boxShadow: "0 0 60px rgba(6, 182, 212, 0.3)",
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </div>
            <h1 className="text-5xl font-extrabold gradient-text mb-3">
              VisionTutor
            </h1>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed">
              Your AI study tutor that <strong className="text-[var(--text-primary)]">sees your notes</strong> and{" "}
              <strong className="text-[var(--text-primary)]">hears your questions</strong>
              <br />
              — in real time.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: "🎤", label: "Voice Chat", desc: "Speak naturally" },
              { icon: "📷", label: "See Notes", desc: "Show your work" },
              { icon: "⚡", label: "Live Response", desc: "Real-time tutor" },
            ].map((f, i) => (
              <div
                key={i}
                className="glass-card p-4 text-center hover:border-[var(--accent-cyan)]/30 transition-colors"
              >
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-xs font-semibold text-[var(--text-primary)] mb-1">
                  {f.label}
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  {f.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartSession}
            className="btn-primary text-base px-8 py-3 w-full"
            style={{ fontSize: 16 }}
          >
            Start Tutoring Session
          </button>

          {tutor.error && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {tutor.error}
            </div>
          )}

          <p className="text-[var(--text-muted)] text-[11px] mt-6">
            Powered by Gemini Live API &middot; Gemini Live Agent Challenge
          </p>
        </div>
      </div>
    );
  }

  // ── Connecting State ──────────────────────────────────────────
  if (tutor.isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center animate-expand-in">
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-full"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
              animation: "pulse-glow 1.5s ease-in-out infinite",
            }}
          />
          <p className="text-[var(--text-secondary)] text-sm">
            Connecting to VisionTutor...
          </p>
        </div>
      </div>
    );
  }

  // ── Connected — Main Session UI ──────────────────────────────
  return (
    <div className="h-screen flex flex-col relative z-10">
      {/* ── Top Bar ── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--text-primary)]">
              VisionTutor
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-emerald)] inline-block" />
              <span className="text-[11px] text-[var(--text-muted)]">
                Session {tutor.sessionId}
              </span>
            </div>
          </div>
        </div>

        {/* Subject Selector */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => tutor.changeSubject(s.id)}
              className={`subject-chip whitespace-nowrap ${tutor.currentSubject === s.id ? "active" : ""}`}
              style={
                tutor.currentSubject === s.id
                  ? {
                      borderColor: s.color,
                      color: s.color,
                      background: `${s.color}15`,
                    }
                  : {}
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleEndSession}
          className="btn-ghost flex items-center gap-2 text-[var(--accent-rose)]"
          style={{ borderColor: "rgba(244, 63, 94, 0.3)" }}
        >
          <XIcon size={14} />
          End
        </button>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Panel: Camera / Upload ── */}
        <aside className="w-80 border-r border-[var(--border-subtle)] flex flex-col bg-[var(--bg-secondary)]">
          {/* Camera View */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Visual Input
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleToggleCamera}
                  className={`p-2 rounded-lg transition-colors ${
                    showCamera
                      ? "bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]"
                      : "bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                  title={showCamera ? "Stop Camera" : "Start Camera"}
                >
                  <CameraIcon size={16} />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  title="Upload Image"
                >
                  <UploadIcon size={16} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Camera Video */}
            {showCamera ? (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
                <video
                  ref={videoElRef}
                  className="w-full h-full object-cover mirror"
                  playsInline
                  muted
                />
                <canvas ref={canvasElRef} className="hidden" />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-white font-medium">LIVE</span>
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl border-2 border-dashed border-[var(--border-default)] flex flex-col items-center justify-center aspect-square cursor-pointer hover:border-[var(--accent-cyan)]/40 transition-colors"
                onClick={handleToggleCamera}
              >
                <CameraIcon size={32} />
                <span className="text-xs text-[var(--text-muted)] mt-2">
                  Click to start camera
                </span>
                <span className="text-[10px] text-[var(--text-muted)] mt-1">
                  or upload an image →
                </span>
              </div>
            )}
          </div>

          {/* Uploaded Images */}
          {uploadedImages.length > 0 && (
            <div className="px-3 pb-3">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                Uploaded
              </span>
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg overflow-hidden border border-[var(--border-subtle)]"
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="mt-auto p-3 border-t border-[var(--border-subtle)]">
            <div className="glass-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">
                  Microphone
                </span>
                <div className="flex items-center gap-2">
                  <WaveformVisualizer
                    isActive={tutor.isListening}
                    color="var(--accent-cyan)"
                  />
                  <span
                    className={`text-[11px] font-medium ${
                      tutor.isListening
                        ? "text-[var(--accent-emerald)]"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {tutor.isListening ? "Active" : "Off"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">
                  Tutor
                </span>
                <div className="flex items-center gap-2">
                  <WaveformVisualizer
                    isActive={tutor.isTutorSpeaking}
                    color="var(--accent-violet)"
                  />
                  <span
                    className={`text-[11px] font-medium ${
                      tutor.isTutorSpeaking
                        ? "text-[var(--accent-violet)]"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {tutor.isTutorSpeaking ? "Speaking..." : "Idle"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Right Panel: Chat / Transcript ── */}
        <main className="flex-1 flex flex-col">
          {/* Transcript Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 transcript-scroll">
            {tutor.transcripts.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(6,182,212,0.1), rgba(139,92,246,0.1))",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  Ready to Tutor
                </h3>
                <p className="text-sm text-[var(--text-muted)] max-w-sm leading-relaxed">
                  Turn on your microphone and start asking questions.
                  <br />
                  You can also show your notes via camera or upload an image.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleToggleMic}
                    className="btn-primary flex items-center gap-2"
                  >
                    <MicIcon size={16} />
                    Start Talking
                  </button>
                  <button
                    onClick={handleToggleCamera}
                    className="btn-ghost flex items-center gap-2"
                  >
                    <CameraIcon size={16} />
                    Show Notes
                  </button>
                </div>
              </div>
            )}

            {tutor.transcripts.map((t, i) => (
              <TranscriptMessage key={i} role={t.role} text={t.text} />
            ))}
            <div ref={transcriptEndRef} />
          </div>

          {/* Error Banner */}
          {tutor.error && (
            <div className="mx-6 mb-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
              <span>{tutor.error}</span>
              <button
                onClick={() => tutor.setError(null)}
                className="text-red-400 hover:text-red-300"
              >
                <XIcon size={14} />
              </button>
            </div>
          )}

          {/* ── Bottom Control Bar ── */}
          <div className="border-t border-[var(--border-subtle)] p-4">
            <div className="flex items-center gap-3">
              {/* Mic Toggle */}
              <button
                onClick={handleToggleMic}
                className={`p-3 rounded-2xl transition-all ${
                  tutor.isListening
                    ? "bg-[var(--accent-cyan)] text-white shadow-lg"
                    : "bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
                style={
                  tutor.isListening
                    ? { boxShadow: "0 0 24px rgba(6, 182, 212, 0.4)" }
                    : {}
                }
                title={tutor.isListening ? "Mute" : "Unmute"}
              >
                {tutor.isListening ? (
                  <MicIcon size={20} />
                ) : (
                  <MicOffIcon size={20} />
                )}
              </button>

              {/* Text Input */}
              <form
                onSubmit={handleSendText}
                className="flex-1 flex items-center gap-2 bg-[var(--bg-elevated)] rounded-2xl px-4 py-2 border border-[var(--border-subtle)] focus-within:border-[var(--accent-cyan)]/50 transition-colors"
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type a question..."
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="p-1.5 rounded-lg text-[var(--accent-cyan)] disabled:text-[var(--text-muted)] hover:bg-[var(--accent-cyan)]/10 transition-colors disabled:hover:bg-transparent"
                >
                  <SendIcon size={16} />
                </button>
              </form>

              {/* Upload quick button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Upload Image"
              >
                <UploadIcon size={20} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
