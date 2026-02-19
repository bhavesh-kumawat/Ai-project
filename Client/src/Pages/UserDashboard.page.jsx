import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
const _MOTION = motion;

// ─── CANVAS ──────────────────────────────────────────────────────────────────
function SpaceCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); let raf;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const stars = Array.from({ length: 120 }, (_, i) => ({
      x: ((i * 7919) % 997) / 997, y: ((i * 6271) % 991) / 991,
      r: ((i * 3571) % 100) / 100 * 1.2 + 0.2, base: ((i * 4999) % 100) / 100 * 0.4 + 0.06,
      spd: ((i * 2333) % 100) / 100 * 0.007 + 0.002, ph: i * 1.4,
    }));
    const meteors = Array.from({ length: 3 }, (_, i) => ({ active: false, prog: 0, timer: 0, delay: 2000 + i * 4500 }));
    const spawn = m => { m.x = Math.random() * c.width * 0.7; m.y = Math.random() * c.height * 0.35; m.len = 65 + Math.random() * 100; m.prog = 0; m.spd = 0.014 + Math.random() * 0.013; m.active = true; };
    let t = 0;
    const draw = () => {
      const w = c.width, h = c.height; t += 0.016; ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const op = s.base + Math.sin(t * s.spd * 60 + s.ph) * 0.2;
        ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, op)})`; ctx.fill();
      }
      for (const m of meteors) {
        m.timer += 16; if (!m.active) { if (m.timer >= m.delay) spawn(m); continue; }
        m.prog += m.spd; if (m.prog >= 1) { m.active = false; m.timer = 0; m.delay = 4000 + Math.random() * 8000; continue; }
        const dx = m.len * Math.cos(Math.PI / 5), dy = m.len * Math.sin(Math.PI / 5);
        const tx = m.x + dx * m.prog, ty = m.y + dy * m.prog;
        const al = m.prog < 0.5 ? m.prog * 2 : (1 - m.prog) * 2;
        const g = ctx.createLinearGradient(tx, ty, tx - dx * 0.55, ty - dy * 0.55);
        g.addColorStop(0, `rgba(255,255,255,${al})`); g.addColorStop(0.4, `rgba(167,139,250,${al * 0.45})`); g.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - dx * 0.55, ty - dy * 0.55);
        ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.82 }} />;
}

// ─── BLOBS ────────────────────────────────────────────────────────────────────
function Blobs() {
  return (
    <>
      <style>{`
        @keyframes bA{0%,100%{transform:translate(-50%,-50%) scale(1)}35%{transform:translate(-50%,-50%) scale(1.1) translate(30px,-40px)}70%{transform:translate(-50%,-50%) scale(0.94) translate(-20px,22px)}}
        @keyframes bB{0%,100%{transform:translate(-50%,-50%) scale(1)}45%{transform:translate(-50%,-50%) scale(1.08) translate(-28px,22px)}80%{transform:translate(-50%,-50%) scale(0.95) translate(18px,-26px)}}
        @keyframes bC{0%,100%{transform:translate(-50%,-50%) scale(1)}55%{transform:translate(-50%,-50%) scale(1.12) translate(22px,28px)}}
        .bl{position:fixed;border-radius:50%;pointer-events:none;will-change:transform;z-index:0;}
        .ba{animation:bA 17s ease-in-out infinite;}.bb{animation:bB 22s ease-in-out infinite;}.bc{animation:bC 14s ease-in-out infinite;}
      `}</style>
      <div className="bl ba" style={{ width: 500, height: 500, left: "6%", top: "20%", background: "radial-gradient(circle,rgba(109,40,217,0.35) 0%,transparent 70%)", filter: "blur(55px)" }} />
      <div className="bl bb" style={{ width: 420, height: 420, left: "88%", top: "65%", background: "radial-gradient(circle,rgba(6,182,212,0.28) 0%,transparent 70%)", filter: "blur(50px)" }} />
      <div className="bl bc" style={{ width: 300, height: 300, left: "75%", top: "10%", background: "radial-gradient(circle,rgba(236,72,153,0.22) 0%,transparent 70%)", filter: "blur(44px)" }} />
    </>
  );
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const TABS = ["Inspiration", "Library"];
const USER_VIEWS = ["Profile", "Billing", "Settings"];



const UI_DURATION_TO_API = {
  "5s": "short",
  "10s": "medium",
  "15s": "long",
  "30s": "long",
};

const formatTimeAgo = (value) => {
  if (!value) return "";
  const now = Date.now();
  const then = new Date(value).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const mapGenerationToCard = (g) => {
  const duration = g?.metadata?.duration;
  const durLabel = duration === "short" ? "5s" : duration === "medium" ? "10s" : duration === "long" ? "20s" : "";
  const status = g?.status === "completed" ? "done" : g?.status === "processing" ? "processing" : g?.status === "failed" ? "failed" : "pending";
  const mediaType = g?.type?.includes("image") ? "image" : "video";
  return {
    id: g._id,
    bg: "linear-gradient(135deg,#0f172a,#1e293b)",
    title: g.prompt || "Untitled",
    dur: durLabel,
    status,
    mediaType,
    output: g.output || null,
    createdAt: g.createdAt,
  };
};

// ─── VIDEO CARD ───────────────────────────────────────────────────────────────
function VideoCard({ bg, tag, title, dur, status, delay = 0, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        borderRadius: 14, overflow: "hidden", cursor: "pointer",
        border: `1px solid rgba(255,255,255,${hov ? 0.15 : 0.07})`,
        transform: hov ? "translateY(-5px)" : "none",
        boxShadow: hov ? "0 16px 40px rgba(0,0,0,0.5)" : "none",
        transition: "all .22s ease"
      }}
    >
      <div style={{ height: 145, background: bg, position: "relative", overflow: "hidden" }}>
        {status === "processing" && (
          <motion.div animate={{ y: ["-100%", "300%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0, height: "28%", background: "linear-gradient(180deg,transparent,rgba(251,191,36,0.15),transparent)", pointerEvents: "none" }} />
        )}
        <AnimatePresence>
          {hov && status !== "processing" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.38)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>▶</div>
            </motion.div>
          )}
        </AnimatePresence>
        {tag && <div style={{ position: "absolute", top: 8, left: 8, padding: "2px 8px", borderRadius: 6, background: "rgba(124,58,237,0.7)", backdropFilter: "blur(8px)", color: "#e9d5ff", fontSize: 10, fontWeight: 700 }}>{tag}</div>}
        {dur && <div style={{ position: "absolute", bottom: 8, right: 8, padding: "2px 7px", borderRadius: 5, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, fontWeight: 600 }}>{dur}</div>}
      </div>
      <div style={{ padding: "11px 13px", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}>
        <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</p>
        {status === "processing" && <p style={{ color: "#fbbf24", fontSize: 10, marginTop: 3, fontWeight: 600 }}>⚙ Processing…</p>}
        {status === "pending" && <p style={{ color: "#93c5fd", fontSize: 10, marginTop: 3, fontWeight: 600 }}>⏳ Pending</p>}
        {status === "failed" && <p style={{ color: "#f87171", fontSize: 10, marginTop: 3, fontWeight: 600 }}>✕ Failed</p>}
        {status === "done" && <p style={{ color: "#34d399", fontSize: 10, marginTop: 3, fontWeight: 600 }}>✓ Completed</p>}
      </div>
    </motion.div>
  );
}

// ─── PROMPT BOX (Bottom Fixed Flow Style) ────────────────────────────────────
function PromptBox({ onGenerated, selectedEffect = null, defaultMode = "video", inputImage, setInputImage }) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Cinematic");
  const [dur, setDur] = useState("15s");
  const [size, setSize] = useState("medium");
  const [ratio, setRatio] = useState("16:9");
  const [mode, setMode] = useState(defaultMode);
  const [provider, setProvider] = useState("openai");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Open AI");
  const fileInputRef = useRef(null);
  const typeMenuRef = useRef(null);
  const modelMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target)) setShowTypeMenu(false);
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target)) setShowModelMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) await uploadFile(file);
  };

  const uploadFile = async (file) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/generations/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setInputImage(res.data.data.url);
      setMode(mode === "video" ? "image-to-video" : "image-to-image");
      toast.success("Image uploaded!");
    } catch (err) {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const STYLES = ["Cinematic", "Anime", "3D Render", "Neon Noir", "Surreal"];
  const DURATIONS = ["5s", "10s", "15s", "30s"];
  const SIZES = ["small", "medium", "large"];
  const RATIOS = ["16:9", "9:16", "1:1"];
  const IMAGE_PROVIDERS = ["openai", "stability", "gemini"];
  const VIDEO_PROVIDERS = ["stability", "openai", "gemini"];

  const MODES = [
    { id: "text-to-video", label: "Text to Video", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"></path><path d="m21 19-3-3 3-3"></path><path d="M15 19H5"></path><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3-3 3-3"></path><path d="M11 13l2 2 4-4"></path></svg>, type: "video" },
    { id: "image-to-video", label: "Frames to Video", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h20"></path><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"></path><path d="m7 21 5-5 5 5"></path><circle cx="12" cy="7" r="1.5"></circle></svg>, type: "video" },
    { id: "ingredients-to-video", label: "Ingredients to Video", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10"></path><path d="M12 21V9"></path><circle cx="12" cy="5" r="3"></circle></svg>, type: "video" },
    { id: "text-to-image", label: "Create Image", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>, type: "image" },
  ];

  const MODELS = [
    { id: "openai", label: "Open AI", icon: "🤖" },
    { id: "stability", label: "Stability AI", icon: "✨" },
    { id: "gemini", label: "Gemini", icon: "💎" },
  ];

  const COMING_SOON_MODELS = [
    { id: "sora", label: "Sora", icon: "🎥" },
    { id: "runway", label: "Runway Gen-3", icon: "🎬" },
    { id: "luma", label: "Luma Dream Machine", icon: "🎨" },
  ];

  const generate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setDone(false);
    setErrorMessage("");

    try {
      const promptWithEffects = selectedEffect ? `${prompt.trim()}. Use ${selectedEffect} effect.` : prompt.trim();

      // Map UI mode to valid API type
      let apiType = mode;

      // Auto-resolution logic based on inputImage
      if (inputImage) {
        if (mode === "text-to-video") apiType = "image-to-video";
        else if (mode === "text-to-image") apiType = "image-to-image";
        else if (mode === "ingredients-to-video") apiType = "image-to-video";
      }

      const payload = {
        type: apiType,
        prompt: promptWithEffects,
        inputImage: inputImage,
        duration: UI_DURATION_TO_API[dur] || "short",
        modelUsed: selectedModel,
        metadata: {
          provider,
          style,
          ratio,
          size,
          effect: selectedEffect || null,
          uiDuration: dur,
        },
      };

      const response = await api.post("/generations", payload);
      const createdGeneration = response?.data?.data;
      setDone(true);
      setPrompt("");
      onGenerated?.(createdGeneration);
      setTimeout(() => setDone(false), 3000);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Generation failed. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200, background: "linear-gradient(to top, rgba(5,8,22,0.98) 0%, rgba(5,8,22,0.9) 70%, transparent 100%)", backdropFilter: "blur(24px)", padding: "20px 0 24px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px" }}>

        {/* Settings Panel (Keep same for now, but style it better or integrate later) */}
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: 10, height: 0 }} transition={{ duration: 0.2 }}
              style={{ marginBottom: 16, overflow: "hidden" }}>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 auto", minWidth: 140 }}>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 600 }}>Style</p>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {STYLES.map(s => (
                        <button key={s} onClick={() => setStyle(s)}
                          style={{
                            padding: "4px 10px", borderRadius: 7, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                            background: style === s ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "rgba(255,255,255,0.07)",
                            color: style === s ? "#fff" : "rgba(255,255,255,0.5)"
                          }}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: "0 0 auto" }}>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 600 }}>Duration</p>
                    <div style={{ display: "flex", gap: 4 }}>
                      {DURATIONS.map(d => (
                        <button key={d} onClick={() => setDur(d)}
                          style={{
                            padding: "4px 10px", borderRadius: 7, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                            background: dur === d ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.07)",
                            color: dur === d ? "#c4b5fd" : "rgba(255,255,255,0.5)"
                          }}>{d}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: "0 0 auto" }}>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 600 }}>AI Provider</p>
                    <div style={{ display: "flex", gap: 4 }}>
                      {(mode === "image" ? IMAGE_PROVIDERS : VIDEO_PROVIDERS).map((p) => (
                        <button key={p} onClick={() => setProvider(p)}
                          style={{
                            padding: "4px 10px", borderRadius: 7, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                            background: provider === p ? "rgba(244,114,182,0.4)" : "rgba(255,255,255,0.07)",
                            color: provider === p ? "#f9a8d4" : "rgba(255,255,255,0.5)",
                            textTransform: "capitalize"
                          }}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: "0 0 auto" }}>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 600 }}>Ratio</p>
                    <div style={{ display: "flex", gap: 4 }}>
                      {RATIOS.map(r => (
                        <button key={r} onClick={() => setRatio(r)}
                          style={{
                            padding: "4px 10px", borderRadius: 7, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                            background: ratio === r ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.07)",
                            color: ratio === r ? "#22d3ee" : "rgba(255,255,255,0.5)"
                          }}>{r}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Flow Container */}
        <div style={{ position: "relative" }}>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: "none" }} />

          <div style={{
            position: "relative",
            borderRadius: 28,
            background: "rgba(12,12,12,0.92)",
            backdropFilter: "blur(30px)",
            padding: "16px 20px",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 12px 48px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}>

            {/* Top Row: Create, Model Selector, Options */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Generation Type Dropdown */}
                <div style={{ position: "relative" }} ref={typeMenuRef}>
                  <button
                    onClick={() => setShowTypeMenu(!showTypeMenu)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 16px", borderRadius: 100,
                      background: "rgba(255,255,255,0.08)",
                      border: "none",
                      color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      transition: "all .2s",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
                    }}>
                    {MODES.find(m => m.id === mode || m.type === mode)?.label || "Create Image"}
                    <span style={{ fontSize: 16, opacity: 1, color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>✕</span>
                  </button>

                  <AnimatePresence>
                    {showTypeMenu && (
                      <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: 8, background: "#111", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", minWidth: 200, overflow: "hidden", zIndex: 10, boxShadow: "0 -10px 40px rgba(0,0,0,0.5)" }}>
                        {MODES.map(m => (
                          <button key={m.id} onClick={() => { setMode(m.id); setShowTypeMenu(false); }}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", color: mode === m.id ? "#fff" : "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s", textAlign: "left" }}>
                            <span style={{ opacity: mode === m.id ? 1 : 0.4 }}>{m.icon}</span>
                            {m.label}
                          </button>
                        ))}
                        <div style={{ padding: "8px 16px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>COMING SOON</span>
                        </div>
                        {[
                          { id: "music", label: "Music to Video", icon: "🎵" },
                          { id: "lipsync", label: "Lip Sync", icon: "👄" },
                          { id: "faceswap", label: "Face Swap", icon: "🎭" }
                        ].map(m => (
                          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", opacity: 0.3, cursor: "default" }}>
                            <span style={{ fontSize: 16 }}>{m.icon}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{m.label}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Model Selector Dropdown */}
                <div style={{ position: "relative" }} ref={modelMenuRef}>
                  <button
                    onClick={() => setShowModelMenu(!showModelMenu)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 14px", borderRadius: 100,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 500, cursor: "pointer"
                    }}>
                    <span style={{ fontSize: 14 }}>{MODELS.find(m => m.label === selectedModel)?.icon || "🍌"}</span> {selectedModel}
                  </button>

                  <AnimatePresence>
                    {showModelMenu && (
                      <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        style={{ position: "absolute", bottom: "100%", right: 0, marginBottom: 8, background: "#111", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", minWidth: 200, overflow: "hidden", zIndex: 10, boxShadow: "0 -10px 40px rgba(0,0,0,0.5)" }}>
                        {MODELS.map(m => (
                          <button key={m.id} onClick={() => { setSelectedModel(m.label); setShowModelMenu(false); }}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", color: selectedModel === m.label ? "#fff" : "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s", textAlign: "left" }}>
                            <span style={{ fontSize: 16 }}>{m.icon}</span>
                            {m.label}
                          </button>
                        ))}
                        <div style={{ padding: "8px 16px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>COMING SOON</span>
                        </div>
                        {COMING_SOON_MODELS.map(m => (
                          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", opacity: 0.3, cursor: "default" }}>
                            <span style={{ fontSize: 16 }}>{m.icon}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{m.label}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Side Icons */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ cursor: "pointer", display: "flex", alignItems: "center" }} title="Aspect Ratio">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)" }} title="Quantity">x2</div>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                </button>
              </div>
            </div>

            {/* Image Preview (If any) */}
            <AnimatePresence>
              {inputImage && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  style={{ display: "flex", width: "fit-content", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", padding: "4px 4px 4px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                  <img src={inputImage} style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Attached</span>
                  <button onClick={() => setInputImage(null)} style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(248,113,113,0.2)", color: "#f87171", border: "none", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Middle: Textarea */}
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value.slice(0, 500))}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
              placeholder="Generate an image from text and ingredients"
              rows={1}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                padding: "4px 0",
                color: "#fffa",
                fontSize: 16,
                fontWeight: 400,
                lineHeight: 1.6,
                resize: "none",
                outline: "none",
                maxHeight: 180,
                overflowY: "auto",
                fontFamily: "'DM Sans',sans-serif"
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px';
              }}
            />

            {/* Bottom Row: Plus and Send */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <button
                onClick={() => fileInputRef.current.click()}
                style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                  border: "none", color: "rgba(255,255,255,0.4)",
                  fontSize: 20, cursor: "pointer", transition: "all .2s",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                {uploading ? <span className="spin16" style={{ width: 14, height: 14 }} /> : "+"}
              </button>

              <button
                onClick={generate}
                disabled={loading || !prompt.trim()}
                style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: prompt.trim() && !loading ? "#fff" : "rgba(255,255,255,0.05)",
                  color: prompt.trim() && !loading ? "#000" : "rgba(255,255,255,0.2)",
                  border: "none", fontSize: 18,
                  cursor: prompt.trim() && !loading ? "pointer" : "default",
                  transition: "all .2s",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                {loading ? <span className="spin16" style={{ width: 14, height: 14, borderColor: "#000 transparent" }} /> : "→"}
              </button>
            </div>

            {/* Status Messages */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 12, textAlign: "center" }}>
                  <div style={{ display: "inline-block", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", color: "#fb7185", padding: "6px 14px", borderRadius: 10, fontSize: 11, backdropFilter: "blur(10px)" }}>
                    {errorMessage}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE VIEW ─────────────────────────────────────────────────────────────
function ProfileView({ user, stats }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
      style={{ maxWidth: 700, margin: "60px auto", padding: "40px 30px", background: "rgba(255,255,255,0.03)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32, marginBottom: 48 }}>
        <div style={{ width: 120, height: 120, borderRadius: "35%", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 800, color: "#fff", boxShadow: "0 10px 30px rgba(124,58,237,0.3)" }}>{user.avatar}</div>
        <div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: 40, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>{user.username}</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 18, fontWeight: 400 }}>{user.email}</p>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <span style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", color: "#c4b5fd", fontSize: 12, fontWeight: 600 }}>{stats?.plan || "Free Account"}</span>
            <span style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)", color: "#67e8f9", fontSize: 12, fontWeight: 600 }}>Active Member</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ padding: 24, background: "rgba(255,255,255,0.02)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)", transition: "all .3s" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, fontWeight: 600 }}>Total Creations</p>
          <p style={{ color: "#fff", fontSize: 36, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>{stats?.totalGenerations || 0}</p>
          <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 12, overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: "70%" }} transition={{ duration: 1, delay: 0.5 }} style={{ height: "100%", background: "linear-gradient(90deg, #7c3aed, #06b6d4)" }} />
          </div>
        </div>
        <div style={{ padding: 24, background: "rgba(255,255,255,0.02)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, fontWeight: 600 }}>Member Duration</p>
          <p style={{ color: "#fff", fontSize: 26, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>{formatTimeAgo(stats?.createdAt || user.createdAt)}</p>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 8 }}>Joined {new Date(stats?.createdAt || Date.now()).toLocaleDateString()}</p>
        </div>
      </div>

      <div style={{ marginTop: 24, padding: 30, background: "linear-gradient(135deg, rgba(124,58,237,0.05), rgba(6,182,212,0.05))", borderRadius: 24, border: "1px solid rgba(124,58,237,0.15)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)", filter: "blur(20px)" }} />
        <h4 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Creative Studio Access</h4>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6 }}>Your account is in good standing. You have full access to our standard generation models and basic editing tools.</p>
      </div>
    </motion.div>
  );
}

// ─── BILLING VIEW ─────────────────────────────────────────────────────────────
function BillingView({ user, stats, transactions = [], fetchHistory }) {
  const [loading, setLoading] = useState(null);
  const [view, setView] = useState("plans"); // "plans" or "history"

  useEffect(() => {
    if (view === "history") fetchHistory();
  }, [view]);

  const handleUpgrade = async (planId) => {
    setLoading(planId);
    try {
      const response = await api.post("/stripe/create-checkout-session", { planId });
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      toast.error("Failed to initiate checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const PLANS = [
    {
      id: "starter",
      name: "Starter",
      price: "$10",
      credits: "100",
      features: ["Standard Generations", "Standard Speed", "Basic Support", "Standard License"],
      color: "rgba(52,211,153,0.15)",
      borderColor: "rgba(52,211,153,0.3)",
      tagColor: "#34d399"
    },
    {
      id: "pro",
      name: "Pro",
      price: "$25",
      credits: "500",
      features: ["High Quality Content", "Priority Rendering", "No Watermark", "Commercial License"],
      color: "rgba(124,58,237,0.15)",
      borderColor: "rgba(124,58,237,0.4)",
      tagColor: "#a78bfa",
      popular: true
    },
    {
      id: "ultra",
      name: "Ultra",
      price: "$50",
      credits: "1500",
      features: ["All Premium Models", "Unlimited Speed", "Direct Artist Support", "Extended License"],
      color: "rgba(6,182,212,0.15)",
      borderColor: "rgba(6,182,212,0.3)",
      tagColor: "#22d3ee"
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
      style={{ maxWidth: 1100, margin: "60px auto", padding: "0 24px" }}>

      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: 48, fontWeight: 800, marginBottom: 16, letterSpacing: "-0.03em" }}>Choice Your Power</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 18, maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>Upgrade your creative potential with premium credits and advanced features.</p>

        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.04)", borderRadius: 100, padding: 6, marginTop: 40, border: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => setView("plans")}
            style={{ padding: "10px 24px", borderRadius: 100, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .2s", background: view === "plans" ? "rgba(255,255,255,0.08)" : "transparent", color: view === "plans" ? "#fff" : "rgba(255,255,255,0.4)" }}>Pricing Plans</button>
          <button onClick={() => setView("history")}
            style={{ padding: "10px 24px", borderRadius: 100, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .2s", background: view === "history" ? "rgba(255,255,255,0.08)" : "transparent", color: view === "history" ? "#fff" : "rgba(255,255,255,0.4)" }}>History</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "plans" ? (
          <motion.div key="plans" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
              {PLANS.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    padding: "40px 32px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 32,
                    border: `1px solid ${stats?.plan === p.id ? p.tagColor : "rgba(255,255,255,0.08)"}`,
                    backdropFilter: "blur(16px)",
                    position: "relative",
                    overflow: "hidden",
                    transition: "transform 0.3s ease, border-color 0.3s ease",
                    boxShadow: stats?.plan === p.id ? `0 20px 60px ${p.borderColor}` : "none",
                    cursor: "default"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-8px)"; e.currentTarget.style.borderColor = p.borderColor; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = stats?.plan === p.id ? p.tagColor : "rgba(255,255,255,0.08)"; }}
                >
                  {p.popular && (
                    <div style={{ position: "absolute", top: 20, right: 20, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em" }}>Popular</div>
                  )}

                  <h3 style={{ color: p.tagColor, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 12, fontWeight: 800 }}>{p.name}</h3>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                    <span style={{ color: "#fff", fontSize: 44, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>{p.price}</span>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16 }}>/month</span>
                  </div>
                  <p style={{ color: "#fff", fontSize: 18, fontWeight: 600, marginBottom: 32 }}>{p.credits} Credits Included</p>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 28, marginBottom: 38 }}>
                    {p.features.map((f, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: p.tagColor }}>✓</span>
                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    disabled={loading || stats?.plan === p.id}
                    onClick={() => handleUpgrade(p.id)}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: 16,
                      border: "none",
                      background: stats?.plan === p.id ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #7c3aed, #06b6d4)",
                      color: stats?.plan === p.id ? "rgba(255,255,255,0.3)" : "#fff",
                      fontWeight: 800,
                      fontSize: 15,
                      cursor: stats?.plan === p.id ? "default" : "pointer",
                      transition: "all .3s ease",
                      fontFamily: "'Syne',sans-serif",
                      boxShadow: stats?.plan === p.id ? "none" : "0 10px 25px rgba(124,58,237,0.4)"
                    }}
                  >
                    {loading === p.id ? <span className="spin16" /> : (stats?.plan === p.id ? "Current Plan" : "Upgrade Now")}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
            style={{ minHeight: 400 }}>
            {transactions.length > 0 ? (
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <th style={{ textAlign: "left", padding: 20, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>Date</th>
                      <th style={{ textAlign: "left", padding: 20, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>Event</th>
                      <th style={{ textAlign: "right", padding: 20, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>Amount</th>
                      <th style={{ textAlign: "left", padding: 20, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, idx) => (
                      <tr key={t._id} style={{ borderBottom: idx !== transactions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "all .2s" }}>
                        <td style={{ padding: 20, fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: 20 }}>
                          <p style={{ fontSize: 14, fontWeight: 600 }}>{t.description}</p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2, textTransform: "capitalize" }}>{t.type}</p>
                        </td>
                        <td style={{ padding: 20, textAlign: "right", fontWeight: 700, fontSize: 15, color: t.amount > 0 ? "#34d399" : "#fff" }}>
                          {t.amount > 0 ? `+${t.amount}` : t.amount} ⚡
                        </td>
                        <td style={{ padding: 20 }}>
                          <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 100, background: t.status === "completed" ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.05)", color: t.status === "completed" ? "#34d399" : "rgba(255,255,255,0.4)", fontWeight: 700 }}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "80px 0", background: "rgba(255,255,255,0.02)", borderRadius: 28, border: "1px dashed rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📜</div>
                <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No history yet</h3>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Your transactions will appear here as you use the platform.</p>
              </div>
            )}
          </motion.div>
        )
        }
      </AnimatePresence>
    </motion.div>
  );
}

// ─── SETTINGS VIEW ────────────────────────────────────────────────────────────
function SettingsView({ user, onUpdate }) {
  const [form, setForm] = useState({ username: user.username, email: user.email });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch("/auth/me", form);
      const updatedUser = { ...user, ...form };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      onUpdate(updatedUser);
      // Custom toast-like notification would be better here
      toast.success("Settings updated successfully!");
    } catch (err) {
      toast.error("Failed to update settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
      style={{ maxWidth: 650, margin: "60px auto", padding: "48px", background: "rgba(255,255,255,0.02)", borderRadius: 32, border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>

      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Account Settings</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>Update your personal identity across the platform.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ position: "relative" }}>
          <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", display: "block", marginBottom: 10, fontWeight: 700, letterSpacing: "0.1em" }}>Username</label>
          <input
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            placeholder="Creative Username"
            style={{ width: "100%", padding: "16px 20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, color: "#fff", fontSize: 15, outline: "none", transition: "all .2s" }}
            onFocus={e => e.target.style.borderColor = "rgba(124,58,237,0.5)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
          />
        </div>

        <div>
          <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", display: "block", marginBottom: 10, fontWeight: 700, letterSpacing: "0.1em" }}>Email Identity</label>
          <input
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="your@email.com"
            style={{ width: "100%", padding: "16px 20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, fontSize: 15, outline: "none", transition: "all .2s", color: "rgba(255,255,255,0.5)" }}
            readOnly
          />
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 8 }}>Primary email cannot be changed directly.</p>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 32, marginTop: 10 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: 16,
              border: "none",
              background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              cursor: "pointer",
              transition: "all .3s ease",
              fontFamily: "'Syne',sans-serif",
              boxShadow: "0 10px 30px rgba(124,58,237,0.3)"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            {loading ? <span className="spin16" /> : "Store Evolution"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function Navbar({ user, tab, setTab, onLogout, live, stats }) {
  const [menu, setMenu] = useState(false);
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: "blur(24px)", background: "rgba(5,8,22,0.85)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setTab("Inspiration")}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎬</div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 19, color: "#fff", letterSpacing: "0.02em" }}>Skull Bot</span>
          </div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, border: "1px solid rgba(255,255,255,0.06)" }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  padding: "8px 20px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)",
                  background: tab === t ? "rgba(255,255,255,0.08)" : "transparent",
                  color: tab === t ? "#fff" : "rgba(255,255,255,0.4)"
                }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            onClick={() => setTab("Billing")}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 24, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)", cursor: "pointer" }}
          >
            <span style={{ fontSize: 14 }}>⚡</span><span style={{ color: "#c4b5fd", fontSize: 13, fontWeight: 700 }}>{stats?.totalCredits || user.credits}</span>
          </div>
          <div style={{ position: "relative" }}>
            <div onClick={() => setMenu(o => !o)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 14px 5px 6px", borderRadius: 24, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            >
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{user.avatar}</div>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{user.username}</span>
            </div>
            <AnimatePresence>
              {menu && (
                <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{ position: "absolute", top: 48, right: 0, background: "rgba(10,4,28,0.98)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 8, minWidth: 200, zIndex: 200, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 6 }}>
                    <p style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{user.username}</p>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{user.email}</p>
                  </div>
                  {USER_VIEWS.map((it, i) => (
                    <button key={i} onClick={() => { setTab(it); setMenu(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer", borderRadius: 10, transition: "all .2s" }}
                      onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.06)"; e.target.style.color = "#fff"; }}
                      onMouseLeave={e => { e.target.style.background = "none"; e.target.style.color = "rgba(255,255,255,0.5)"; }}
                    >{it}</button>
                  ))}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 6, paddingTop: 6 }}>
                    <button onClick={onLogout} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", color: "#f87171", fontSize: 13, cursor: "pointer", borderRadius: 10, transition: "all .2s" }}
                      onMouseEnter={e => e.target.style.background = "rgba(248,113,113,0.1)"}
                      onMouseLeave={e => e.target.style.background = "none"}
                    >Sign out</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function UserHome() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const displayName = (storedUser?.username || storedUser?.email || "user");
  const [user, setUser] = useState({
    username: storedUser?.username || displayName,
    email: storedUser?.email || "",
    avatar: (displayName[0] || "U").toUpperCase(),
    credits: storedUser?.credits ?? 12,
  });

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const [tab, setTab] = useState("Inspiration");
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [liveGenerations, setLiveGenerations] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [liveTick, setLiveTick] = useState(0);
  const [preview, setPreview] = useState(null);
  const [stats, setStats] = useState(null);
  const [inputImage, setInputImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [globalUploading, setGlobalUploading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const id = setInterval(() => setLiveTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/credit/stats");
      setStats(res.data?.data);
    } catch (err) { }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/credit/transactions");
      setTransactions(res.data?.data || []);
    } catch (err) { }
  };

  const fetchGenerations = useCallback(async () => {
    try {
      const res = await api.get("/generations?limit=24");
      const items = res.data?.data || [];
      setLiveGenerations(items);
      setLastUpdatedAt(new Date().toISOString());
      if (items.some(it => it.status === "completed")) {
        fetchStats();
      }
    } catch {
      // Keep dashboard usable even if live fetch fails
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const bootId = setTimeout(fetchGenerations, 0);
    const id = setInterval(fetchGenerations, 2500);
    return () => {
      clearTimeout(bootId);
      clearInterval(id);
    };
  }, [fetchGenerations]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    if (paymentStatus === "success") {
      // Refresh stats and show success
      fetchStats();
      toast.success("Payment successful! Your credits have been updated.");
      // Clean up URL
      window.history.replaceState({}, document.title, "/dashboard");
    } else if (paymentStatus === "cancel") {
      toast.error("Payment cancelled.");
      window.history.replaceState({}, document.title, "/dashboard");
    }
  }, [fetchStats]);

  const handleGenerationCreated = async (generation) => {
    if (generation?._id) {
      setLiveGenerations((prev) => {
        const filtered = prev.filter((item) => item._id !== generation._id);
        return [generation, ...filtered].slice(0, 24);
      });
    }
    setLastUpdatedAt(new Date().toISOString());
    setTab("Library");
    await fetchGenerations();
    fetchStats();
  };

  const liveVideos = liveGenerations.map(mapGenerationToCard);
  const libraryVideos = liveVideos;
  const completedCount = libraryVideos.filter(v => v.status === "done").length;
  const processingCount = libraryVideos.filter(v => v.status === "processing").length;
  const isLive = lastUpdatedAt ? (liveTick - new Date(lastUpdatedAt).getTime() < 20000) : false;

  const libFileInputRef = useRef(null);
  const [libUploading, setLibUploading] = useState(false);

  const uploadToLibrary = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    setLibUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await api.post("/generations/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = uploadRes.data.data.url;

      await api.post("/generations", {
        type: "text-to-image",
        prompt: "Uploaded to Library",
        output: url,
        status: "completed",
        creditUsed: 0
      });

      toast.success("Image added to library!");
      fetchGenerations();
    } catch (err) {
      toast.error("Upload failed.");
    } finally {
      setLibUploading(false);
    }
  };

  const onGlobalDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onGlobalDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onGlobalDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    if (tab === "Library") {
      const syntheticEvent = { target: { files: [file] } };
      uploadToLibrary(syntheticEvent);
    } else {
      // Upload for PromptBox
      setGlobalUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await api.post("/generations/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setInputImage(res.data.data.url);
        toast.success("Image attached!");
      } catch (err) {
        toast.error("Upload failed.");
      } finally {
        setGlobalUploading(false);
      }
    }
  };

  return (
    <div
      onDragOver={onGlobalDragOver}
      onDragLeave={onGlobalDragLeave}
      onDrop={onGlobalDrop}
      style={{ minHeight: "100vh", background: "#050816", fontFamily: "'DM Sans',sans-serif", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        html, body { background: #050816; min-height: 100%; }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:rgba(139,92,246,0.4);color:#fff;}
        ::placeholder{color:rgba(255,255,255,0.22);}
        ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px;}
        textarea,input,button{font-family:'DM Sans',sans-serif;}
        @keyframes borderSpin{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes spin16{to{transform:rotate(360deg)}}
        .spin16{width:14px;height:14px;border:2px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin16 .8s linear infinite;display:inline-block;}
        .genbtn{position:relative;overflow:hidden;transition:transform .14s;}
        .genbtn:hover:not(:disabled){transform:scale(1.04);}
        .genbtn:active:not(:disabled){transform:scale(0.96);}
      `}</style>

      <Blobs /><SpaceCanvas />
      <Navbar user={user} tab={tab} setTab={setTab} onLogout={logout} live={isLive} stats={stats} />

      <div style={{ position: "relative", zIndex: 1, paddingTop: 58 }}>
        <AnimatePresence mode="wait">

          {/* ── INSPIRATION ── */}
          {tab === "Inspiration" && (
            <motion.div key="insp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

              {/* Hero */}
              <div style={{ textAlign: "center", padding: "56px 24px 180px" }}>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 14px", borderRadius: 20, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.28)", marginBottom: 20 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
                  <span style={{ color: "#c4b5fd", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em" }}>AI-Powered Video Generation</span>
                </motion.div>

                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(30px,5.5vw,60px)", fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 14 }}>
                  Turn words into<br />
                  <span style={{ background: "linear-gradient(90deg,#a78bfa,#22d3ee,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>stunning videos</span>
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                  style={{ color: "rgba(255,255,255,0.3)", fontSize: 15, fontWeight: 300 }}>
                  Describe any scene and watch AI bring it to life in seconds.
                </motion.p>
              </div>


            </motion.div>
          )}




          {/* ── LIBRARY ── */}
          {tab === "Library" && (
            <motion.div
              key="lib" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            >
              <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 28px 200px" }}>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
                  <div>
                    <h1 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 800, marginBottom: 5 }}>My Library</h1>
                    <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 13, fontWeight: 300 }}>{libraryVideos.length} creations</p>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input type="file" ref={libFileInputRef} onChange={uploadToLibrary} accept="image/*" style={{ display: "none" }} />
                    <button onClick={() => libFileInputRef.current.click()} disabled={libUploading}
                      style={{ padding: "9px 20px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
                      {libUploading ? "Uploading…" : "Upload Image"}
                    </button>
                    <button onClick={() => setTab("Inspiration")}
                      style={{ padding: "9px 20px", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
                      + New Video
                    </button>
                  </div>
                </motion.div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 32 }}>
                  {[
                    { icon: "🎬", label: "Total", val: libraryVideos.length, color: "#a78bfa" },
                    { icon: "✅", label: "Completed", val: completedCount, color: "#34d399" },
                    { icon: "⚙️", label: "Processing", val: processingCount, color: "#fbbf24" },
                    { icon: "⚡", label: "Credits", val: user.credits, color: "#22d3ee" },
                  ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.06 }}
                      style={{ padding: "16px 18px", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14 }}>
                      <div style={{ fontSize: 20, marginBottom: 7 }}>{s.icon}</div>
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>{s.label}</p>
                      <p style={{ color: "#fff", fontSize: 24, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>{s.val}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Video grid */}
                {libraryVideos.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14, marginBottom: 32 }}>
                    {libraryVideos.map((v, i) => (
                      <VideoCard
                        key={v.id || i}
                        {...v}
                        delay={0.2 + i * 0.07}
                        onClick={() => setPreview(v)}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ marginBottom: 32, borderRadius: 14, border: "1px dashed rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.03)", padding: "28px 24px", textAlign: "center" }}>
                    <p style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No generations yet</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Create your first image or video from the Inspiration tab.</p>
                  </div>
                )}

                <AnimatePresence>
                  {preview && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
                      onClick={() => setPreview(null)}
                    >
                      <motion.div
                        initial={{ scale: 0.96, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.96, y: 10 }}
                        transition={{ duration: 0.2 }}
                        style={{ width: "min(900px, 92vw)", background: "rgba(8,3,22,0.95)", borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          <div>
                            <p style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>{preview.title}</p>
                            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{formatTimeAgo(preview.createdAt)}</p>
                          </div>
                          <button
                            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
                            onClick={() => setPreview(null)}
                          >
                            Close
                          </button>
                        </div>
                        <div style={{ padding: 16 }}>
                          {preview.status === "done" && preview.output ? (
                            preview.mediaType === "image" ? (
                              <img
                                src={preview.output}
                                alt={preview.title}
                                style={{ width: "100%", borderRadius: 12, background: "#000", objectFit: "contain", maxHeight: "70vh" }}
                              />
                            ) : (
                              <video
                                src={preview.output}
                                controls
                                style={{ width: "100%", borderRadius: 12, background: "#000" }}
                              />
                            )
                          ) : (
                            <div style={{ height: 320, borderRadius: 12, background: "linear-gradient(135deg,#0f172a,#1e293b)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)", border: "1px dashed rgba(255,255,255,0.2)" }}>
                              {preview.status === "processing" ? "Live rendering in progress…" : preview.status === "pending" ? "Queued for processing…" : "No preview available"}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                  style={{ borderRadius: 18, padding: "26px 28px", background: "linear-gradient(135deg,rgba(124,58,237,0.18),rgba(6,182,212,0.13))", border: "1px solid rgba(255,255,255,0.09)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: 17, fontWeight: 800, marginBottom: 5 }}>Need more credits? ⚡</h3>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 300 }}>You have {user.credits} credits · 500 more for $9.99 · Unlimited $29/mo</p>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button style={{ padding: "9px 18px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Buy Credits</button>
                    <button style={{ padding: "9px 18px", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>Go Unlimited →</button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ── PROFILE ── */}
          {tab === "Profile" && <ProfileView user={user} stats={stats} />}

          {/* ── BILLING ── */}
          {tab === "Billing" && <BillingView user={user} stats={stats} transactions={transactions} fetchHistory={fetchTransactions} />}

          {/* ── SETTINGS ── */}
          {tab === "Settings" && <SettingsView user={user} onUpdate={(u) => setUser(u)} />}

        </AnimatePresence>
      </div>

      {/* Global Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(10,4,28,0.85)",
              backdropFilter: "blur(8px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none"
            }}>
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              style={{
                width: 280,
                height: 280,
                borderRadius: "40%",
                border: "3px dashed rgba(124,58,237,0.5)",
                background: "rgba(124,58,237,0.1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 20
              }}>
              {globalUploading ? (
                <div className="spin16" style={{ width: 48, height: 48, borderWidth: 4 }} />
              ) : (
                <div style={{ fontSize: 64 }}>🖼️</div>
              )}
              <p style={{ color: "#fff", fontSize: 18, fontWeight: 700, textAlign: "center" }}>
                {globalUploading ? "Uploading image..." : (
                  <>Drop image to<br />{tab === "Library" ? "add to Library" : "attach to prompt"}</>
                )}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Bottom Input Box */}
      {!["Billing", "Profile", "Settings"].includes(tab) && (
        <PromptBox onGenerated={handleGenerationCreated} inputImage={inputImage} setInputImage={setInputImage} />
      )}
    </div>
  );
}
