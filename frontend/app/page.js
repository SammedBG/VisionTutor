"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useVisionTutor } from "./hooks/useVisionTutor";

/* ══════════════════════════════════════════════════════
   SVG Icon Components
   ══════════════════════════════════════════════════════ */

function IconMic({ size = 20 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>);
}
function IconMicOff({ size = 20 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="22" y2="22" /><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" /><path d="M5 10v2a7 7 0 0 0 12 5" /><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12" /><line x1="12" y1="19" x2="12" y2="22" /></svg>);
}
function IconCamera({ size = 20 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>);
}
function IconUpload({ size = 20 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>);
}
function IconSend({ size = 18 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>);
}
function IconX({ size = 18 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
}
function IconSparkles({ size = 20 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a1 1 0 0 0 .6.6L20.325 12l-5.813 1.912a1 1 0 0 0-.6.6L12 20.325l-1.912-5.813a1 1 0 0 0-.6-.6L3.675 12l5.813-1.912a1 1 0 0 0 .6-.6L12 3z" /></svg>);
}
function IconLogOut({ size = 18 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>);
}
function IconEye({ size = 20 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>);
}
function IconBookOpen({ size = 20 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>);
}
function IconMessageCircle({ size = 28 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>);
}
function IconSearch({ size = 20 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);
}

/* ══════════════════════════════════════════════════════
   Data
   ══════════════════════════════════════════════════════ */

const SUBJECTS = [
  { id: "general", label: "General", color: "#9490b3" },
  { id: "mathematics", label: "Maths", color: "#f0b847" },
  { id: "physics", label: "Physics", color: "#7c6bf0" },
  { id: "chemistry", label: "Chemistry", color: "#ff7e67" },
  { id: "computer_science", label: "CS", color: "#4fd1a8" },
  { id: "biology", label: "Biology", color: "#f06292" },
];

const MODES = [
  { id: "normal", label: "Normal", color: "var(--accent-mint)", desc: "Standard tutoring" },
  { id: "socratic", label: "Socratic", color: "var(--accent-indigo)", desc: "Guided discovery" },
  { id: "exam", label: "Exam", color: "var(--accent-coral)", desc: "Mock test mode" },
];

/* ══════════════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════════════ */

function AuroraBackground() {
  return (
    <div className="aurora-bg">
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
    </div>
  );
}

function Waveform({ active, color = "var(--accent-indigo)" }) {
  if (!active) return null;
  return (
    <div className="wave-container">
      {[...Array(7)].map((_, i) => (
        <span key={i} className="wave-bar" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="typing-dots msg-bubble msg-model" style={{ maxWidth: 80 }}>
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Landing Page
   ══════════════════════════════════════════════════════ */

function LandingPage({ onStart, error }) {
  return (
    <div className="page-center">
      <AuroraBackground />
      <div className="animate-fade-up" style={{ position: "relative", zIndex: 10, maxWidth: 540, textAlign: "center" }}>
        {/* Logo */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{
              width: 96, height: 96, borderRadius: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 28px",
              background: "var(--gradient-aurora)",
              boxShadow: "0 0 80px rgba(124,107,240,0.3), 0 0 40px rgba(240,184,71,0.15)",
            }}>
              <IconEye size={42} />
            </div>
            <div style={{
              position: "absolute", inset: -8, borderRadius: 32,
              border: "1px dashed rgba(124,107,240,0.2)",
              animation: "spin-slow 30s linear infinite",
            }} />
          </div>
          <h1 className="gradient-text" style={{ fontSize: 52, fontWeight: 800, marginBottom: 16, lineHeight: 1.1 }}>
            VisionTutor
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 420, margin: "0 auto" }}>
            An AI tutor that <strong style={{ color: "var(--text-primary)" }}>sees your notes</strong> and{" "}
            <strong style={{ color: "var(--text-primary)" }}>hears your questions</strong>responding in real time with voice.
          </p>
        </div>

        {/* Feature Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 40, textAlign: "left" }}>
          {[
            { icon: <IconMessageCircle size={20} />, title: "Socratic Mode", desc: "Guides you with questions", color: "var(--accent-indigo)" },
            { icon: <IconEye size={20} />, title: "Mistake Detection", desc: "Spots logic/math errors", color: "var(--accent-rose)" },
            { icon: <IconMic size={20} />, title: "Follow-up Quiz", desc: "Verbally quizzes you", color: "var(--accent-mint)" },
            { icon: <IconBookOpen size={20} />, title: "Step-by-Step", desc: "Walks through slowly", color: "var(--accent-gold)" },
            { icon: <IconSparkles size={20} />, title: "Mock Exam", desc: "Timed audio exams", color: "var(--accent-sky)" },
          ].map((f, i) => (
            <div key={i} className="glass-sm" style={{ padding: 16 }}>
              <div style={{ color: f.color, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={onStart} className="btn-primary">
          <IconSparkles size={18} />
          Start Tutoring Session
        </button>

        {error && (
          <div style={{
            marginTop: 20, padding: 16, borderRadius: 16,
            background: "var(--accent-rose-dim)", border: "1px solid rgba(240,98,146,0.2)",
            color: "var(--accent-rose)", fontSize: 14,
          }}>
            {error}
          </div>
        )}

        <p style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 32, letterSpacing: "0.05em" }}>
          Powered by Gemini Live API · Built for the Gemini Live Agent Challenge
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Connecting Screen
   ══════════════════════════════════════════════════════ */

function ConnectingScreen() {
  return (
    <div className="page-center">
      <AuroraBackground />
      <div className="animate-scale-in" style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block", marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: "var(--gradient-primary)",
            animation: "breathe 1.5s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", inset: -6, borderRadius: 28,
            border: "2px dashed rgba(124,107,240,0.3)",
            animation: "spin-slow 4s linear infinite",
          }} />
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, fontWeight: 500 }}>Connecting to VisionTutor...</p>
        <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 8 }}>Initializing Gemini Live session</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Main Session UI
   ══════════════════════════════════════════════════════ */

function SessionUI({ tutor }) {
  const [showCamera, setShowCamera] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);

  const videoElRef = useRef(null);
  const canvasElRef = useRef(null);
  const fileInputRef = useRef(null);
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tutor.transcripts]);

  const handleToggleMic = useCallback(() => {
    tutor.isListening ? tutor.stopMicrophone() : tutor.startMicrophone();
  }, [tutor]);

  const handleToggleCamera = useCallback(() => {
    if (showCamera) {
      tutor.stopWebcam();
      setShowCamera(false);
    } else {
      setShowCamera(true);
      setTimeout(() => {
        if (videoElRef.current && canvasElRef.current) {
          tutor.startWebcam(videoElRef.current, canvasElRef.current);
        }
      }, 100);
    }
  }, [showCamera, tutor]);

  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setUploadedImages((prev) => [...prev, { url, name: file.name }]);
      tutor.sendImage(file);
    });
    e.target.value = "";
  }, [tutor]);

  const handleSendText = useCallback((e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    tutor.sendText(textInput.trim());
    tutor.setTranscripts((prev) => [
      ...prev,
      { role: "user", text: textInput.trim(), complete: true, ts: Date.now() },
    ]);
    setTextInput("");
  }, [textInput, tutor]);

  const handleEndSession = useCallback(() => {
    setShowCamera(false);
    setUploadedImages([]);
    tutor.disconnect();
  }, [tutor]);

  const activeSubject = SUBJECTS.find((s) => s.id === tutor.currentSubject) || SUBJECTS[0];

  return (
    <div className="session-layout">
      <AuroraBackground />

      {/* ═══ TOP BAR ═══ */}
      <header className="top-bar">
        <div className="row gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--gradient-primary)",
          }}>
            <IconEye size={16} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>VisionTutor</div>
            <div className="row gap-2">
              <div className="status-live">
                <span className="status-dot" style={{ backgroundColor: "var(--accent-mint)" }} />
                <span style={{ color: "var(--accent-mint)" }}>LIVE</span>
              </div>
              <span style={{ color: "var(--text-dim)", fontSize: 10 }}>· {tutor.sessionId}</span>
            </div>
          </div>
        </div>

        {/* Mode Toggles */}
        <div className="row gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => tutor.changeMode(m.id)}
              className="chip"
              style={tutor.tutorMode === m.id ? {
                borderColor: m.color, color: m.color,
                background: `color-mix(in srgb, ${m.color} 12%, transparent)`,
                boxShadow: `0 0 16px color-mix(in srgb, ${m.color} 15%, transparent)`,
                fontWeight: 700,
              } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Subject + End */}
        <div className="row gap-2">
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => tutor.changeSubject(s.id)}
              className="chip"
              style={tutor.currentSubject === s.id ? {
                borderColor: s.color, color: s.color,
                background: `${s.color}14`,
                boxShadow: `0 0 16px ${s.color}20`,
              } : {}}
            >
              {s.label}
            </button>
          ))}
          <button onClick={handleEndSession} className="btn-ghost"
            style={{ color: "var(--accent-rose)", borderColor: "rgba(240,98,146,0.2)" }}>
            <IconLogOut size={14} /> End
          </button>
        </div>
      </header>

      {/* ═══ BODY ═══ */}
      <div className="session-body">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="sidebar">
          <div style={{ padding: 16 }}>
            <div className="row-between" style={{ marginBottom: 12 }}>
              <div className="row gap-2">
                <IconEye size={14} style={{ color: "var(--accent-gold)" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Visual Input
                </span>
              </div>
              <div className="row gap-2">
                <button onClick={handleToggleCamera}
                  className={`btn-icon ${showCamera ? "active" : ""}`}
                  style={{ width: 36, height: 36, borderRadius: 10 }}
                  title={showCamera ? "Stop Camera" : "Start Camera"}>
                  <IconCamera size={15} />
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  className="btn-icon"
                  style={{ width: 36, height: 36, borderRadius: 10 }}
                  title="Upload Image">
                  <IconUpload size={15} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple
                  onChange={handleFileUpload} className="hidden" />
              </div>
            </div>

            {showCamera ? (
              <div className="animate-scale-in" style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#000", aspectRatio: "1" }}>
                <video ref={videoElRef} className="mirror"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  playsInline muted />
                <canvas ref={canvasElRef} className="hidden" />
                <div className="video-badge" style={{ top: 12, left: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f44", animation: "breathe 1.5s ease-in-out infinite" }} />
                  LIVE
                </div>
                <div className="video-badge" style={{ bottom: 12, right: 12, fontWeight: 500, color: "var(--text-muted)" }}>
                  1 fps · 768×768
                </div>
              </div>
            ) : (
              <div className="cam-placeholder" onClick={handleToggleCamera}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 12, background: "var(--accent-indigo-dim)", color: "var(--accent-indigo)",
                }}>
                  <IconCamera size={24} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>Start Camera</span>
                <span style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>Show your notes or homework</span>
              </div>
            )}
          </div>

          {/* Check My Work Button (Feature 2) */}
          <div style={{ padding: "0 16px 12px" }}>
            <button
              onClick={() => tutor.checkWork()}
              disabled={!showCamera && uploadedImages.length === 0}
              className="btn-primary"
              title={(!showCamera && uploadedImages.length === 0) ? "Start camera or upload an image first" : "Check My Work"}
              style={{
                background: (!showCamera && uploadedImages.length === 0) ? "rgba(255, 255, 255, 0.05)" : "var(--gradient-warm)",
                color: (!showCamera && uploadedImages.length === 0) ? "var(--text-dim)" : "var(--bg-base)",
                cursor: (!showCamera && uploadedImages.length === 0) ? "not-allowed" : "pointer",
                padding: "10px 16px",
                fontSize: 13,
                borderRadius: 12,
                opacity: (!showCamera && uploadedImages.length === 0) ? 0.6 : 1,
              }}
            >
              <IconSearch size={15} /> Check My Work
            </button>
          </div>

          {/* Uploaded Images */}
          {uploadedImages.length > 0 && (
            <div style={{ padding: "0 16px 12px" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>
                Uploaded ({uploadedImages.length})
              </span>
              <div className="upload-grid">
                {uploadedImages.map((img, i) => (
                  <div key={i} className="upload-thumb">
                    <img src={img.url} alt={img.name} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Panel */}
          <div style={{ marginTop: "auto", padding: 16 }}>
            <div className="glass-sm">
              <div className="stat-box">
                <div className="row gap-2">
                  <IconMic size={13} style={{ color: tutor.isListening ? "var(--accent-indigo)" : "var(--text-dim)" }} />
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>Microphone</span>
                </div>
                <div className="row gap-2">
                  <Waveform active={tutor.isListening} color="var(--accent-indigo)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: tutor.isListening ? "var(--accent-mint)" : "var(--text-dim)" }}>
                    {tutor.isListening ? "Active" : "Off"}
                  </span>
                </div>
              </div>
              <div className="stat-box">
                <div className="row gap-2">
                  <IconSparkles size={13} style={{ color: tutor.isTutorSpeaking ? "var(--accent-gold)" : "var(--text-dim)" }} />
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>Tutor</span>
                </div>
                <div className="row gap-2">
                  <Waveform active={tutor.isTutorSpeaking} color="var(--accent-gold)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: tutor.isTutorSpeaking ? "var(--accent-gold)" : "var(--text-dim)" }}>
                    {tutor.isTutorSpeaking ? "Speaking" : "Idle"}
                  </span>
                </div>
              </div>
              <div className="stat-box">
                <div className="row gap-2">
                  <IconBookOpen size={13} style={{ color: activeSubject.color }} />
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>Subject</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: activeSubject.color }}>{activeSubject.label}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── RIGHT: CHAT PANEL ── */}
        <main className="chat-panel">
          <div className="chat-messages">
            {tutor.transcripts.length === 0 && (
              <div className="chat-empty animate-fade-up">
                <div style={{
                  width: 80, height: 80, borderRadius: 24,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20, background: "rgba(124,107,240,0.08)",
                  border: "1px solid var(--border-subtle)", color: "var(--text-muted)",
                }}>
                  <IconMessageCircle size={34} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  Ready to Learn
                </h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 360, lineHeight: 1.7, marginBottom: 32 }}>
                  Start your mic and ask a question. You can also share your notes via camera or upload an image.
                </p>
                <div className="row gap-3" style={{ justifyContent: "center" }}>
                  <button onClick={handleToggleMic} className="btn-primary" style={{ width: "auto", padding: "12px 24px" }}>
                    <IconMic size={16} /> Start Talking
                  </button>
                  <button onClick={handleToggleCamera} className="btn-ghost">
                    <IconCamera size={16} /> Show Notes
                  </button>
                </div>
              </div>
            )}

            {tutor.transcripts.map((t, i) => (
              <div key={i} className={`msg-row ${t.role === "user" ? "user" : ""}`}>
                <div className={`avatar ${t.role === "model" ? "avatar-model" : "avatar-user"}`}>
                  {t.role === "model" ? "VT" : "You"}
                </div>
                <div className={`msg-bubble ${t.role === "model" ? "msg-model" : "msg-user"}`}>
                  {t.text}
                </div>
              </div>
            ))}

            {tutor.isTutorSpeaking && tutor.transcripts.length > 0 && (
              <div className="msg-row">
                <div className="avatar avatar-model">VT</div>
                <TypingIndicator />
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* Error */}
          {tutor.error && (
            <div className="error-banner">
              <span style={{ fontSize: 14, color: "var(--accent-rose)" }}>{tutor.error}</span>
              <button onClick={() => tutor.setError(null)}
                style={{ marginLeft: 12, padding: 4, borderRadius: 8, border: "none", background: "transparent", color: "var(--accent-rose)", cursor: "pointer" }}>
                <IconX size={14} />
              </button>
            </div>
          )}

          {/* ═══ BOTTOM BAR ═══ */}
          <div className="bottom-bar">
            <div className="row gap-3">
              <div style={{ position: "relative" }}>
                <button onClick={handleToggleMic}
                  className={`mic-btn ${tutor.isListening ? "listening" : ""}`}
                  title={tutor.isListening ? "Mute Mic" : "Unmute Mic"}>
                  {tutor.isListening ? <IconMic size={22} /> : <IconMicOff size={22} />}
                  {tutor.isListening && <span className="mic-ripple" />}
                </button>
              </div>

              <form onSubmit={handleSendText} className="flex-1">
                <div className="input-bar">
                  <input type="text" value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type a question..." />
                  <button type="submit" disabled={!textInput.trim()}
                    className="btn-icon"
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: "none",
                      background: textInput.trim() ? "var(--gradient-primary)" : "transparent",
                      color: textInput.trim() ? "var(--bg-base)" : "var(--text-dim)",
                    }}>
                    <IconSend size={15} />
                  </button>
                </div>
              </form>

              <button onClick={() => fileInputRef.current?.click()} className="btn-icon" title="Upload Image">
                <IconUpload size={18} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Root Page
   ══════════════════════════════════════════════════════ */

export default function Home() {
  const tutor = useVisionTutor();

  if (!tutor.isConnected && !tutor.isConnecting) {
    return <LandingPage onStart={tutor.connect} error={tutor.error} />;
  }
  if (tutor.isConnecting) {
    return <ConnectingScreen />;
  }
  return <SessionUI tutor={tutor} />;
}
