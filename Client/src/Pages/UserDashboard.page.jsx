import { useState, useEffect, useRef, useCallback } from "react";
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
function PromptBox({ onGenerated, selectedEffect = null, defaultMode = "video" }) {
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

  const STYLES = ["Cinematic", "Anime", "3D Render", "Neon Noir", "Surreal"];
  const DURATIONS = ["5s", "10s", "15s", "30s"];
  const SIZES = ["small", "medium", "large"];
  const RATIOS = ["16:9", "9:16", "1:1"];
  const IMAGE_PROVIDERS = ["openai", "stability", "gemini"];
  const VIDEO_PROVIDERS = ["stability", "openai", "gemini"];

  const generate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setDone(false);
    setErrorMessage("");

    try {
      const promptWithEffects = selectedEffect ? `${prompt.trim()}. Use ${selectedEffect} effect.` : prompt.trim();
      const payload = {
        type: mode === "image" ? "text-to-image" : "text-to-video",
        prompt: promptWithEffects,
        duration: UI_DURATION_TO_API[dur] || "short",
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
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200, background: "linear-gradient(to top, rgba(5,8,22,0.98) 0%, rgba(5,8,22,0.95) 70%, transparent 100%)", backdropFilter: "blur(24px)", padding: "20px 0 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px" }}>

        {/* Settings Panel */}
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

        {/* Main Input Bar */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "relative", borderRadius: 16, background: "rgba(8,3,22,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "10px 12px" }}>

              {/* Mode Toggle */}
              <div style={{ display: "flex", gap: 4, paddingBottom: 2 }}>
                <button onClick={() => setMode("video")}
                  style={{
                    padding: "6px 10px", borderRadius: 8, border: "none", fontSize: 12, cursor: "pointer", transition: "all .2s",
                    background: mode === "video" ? "rgba(124,58,237,0.3)" : "transparent",
                    color: mode === "video" ? "#c4b5fd" : "rgba(255,255,255,0.3)"
                  }}>
                  🎬
                </button>
                <button onClick={() => setMode("image")}
                  style={{
                    padding: "6px 10px", borderRadius: 8, border: "none", fontSize: 12, cursor: "pointer", transition: "all .2s",
                    background: mode === "image" ? "rgba(34,211,238,0.25)" : "transparent",
                    color: mode === "image" ? "#67e8f9" : "rgba(255,255,255,0.3)"
                  }}>
                  🖼
                </button>
              </div>

              {/* Input */}
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value.slice(0, 500))}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
                placeholder={`Describe the ${mode} you want to create...`}
                rows={1}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  padding: "8px 4px",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: 1.5,
                  resize: "none",
                  outline: "none",
                  maxHeight: 120,
                  overflowY: "auto",
                  fontFamily: "'DM Sans',sans-serif"
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, alignItems: "center", paddingBottom: 2 }}>
                <button onClick={() => setShowSettings(!showSettings)}
                  style={{
                    padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                    background: showSettings ? "rgba(255,255,255,0.1)" : "transparent",
                    color: showSettings ? "#fff" : "rgba(255,255,255,0.4)",
                    fontSize: 14, cursor: "pointer", transition: "all .2s"
                  }}
                  title="Settings">
                  ⚙️
                </button>
                <button onClick={generate} disabled={loading || !prompt.trim()}
                  style={{
                    padding: "8px 18px", borderRadius: 10, border: "none",
                    background: prompt.trim() && !loading ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "rgba(255,255,255,0.08)",
                    color: prompt.trim() && !loading ? "#fff" : "rgba(255,255,255,0.3)",
                    fontSize: 13, fontWeight: 700, cursor: prompt.trim() && !loading ? "pointer" : "default",
                    transition: "all .2s", fontFamily: "'Syne',sans-serif",
                    display: "flex", alignItems: "center", gap: 6
                  }}>
                  {loading ? <><span className="spin16" style={{ width: 12, height: 12, borderWidth: "2px" }} />Generating</> : done ? <>✓ Queued</> : <>Generate</>}
                </button>
              </div>
            </div>

            {/* Status Messages */}
            <AnimatePresence>
              {(loading || done || errorMessage) && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 14px" }}>
                  {loading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 2, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                        <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          style={{ height: "100%", width: "50%", background: "linear-gradient(90deg,transparent,#7c3aed,transparent)" }} />
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Rendering...</span>
                    </div>
                  )}
                  {done && !loading && (
                    <p style={{ color: "#34d399", fontSize: 11, fontWeight: 600 }}>✓ Generation queued! Check your Library →</p>
                  )}
                  {errorMessage && (
                    <p style={{ color: "#f87171", fontSize: 11 }}>{errorMessage}</p>
                  )}
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
      style={{ maxWidth: 700, margin: "60px auto", padding: "40px 30px", background: "rgba(255,255,255,0.03)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40 }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, color: "#fff" }}>{user.avatar}</div>
        <div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: 32, fontWeight: 800 }}>{user.username}</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>{user.email}</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Total Generations</p>
          <p style={{ color: "#fff", fontSize: 28, fontWeight: 800 }}>{stats?.totalGenerations || 0}</p>
        </div>
        <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Member Since</p>
          <p style={{ color: "#fff", fontSize: 24, fontWeight: 700 }}>{new Date(stats?.createdAt || Date.now()).toLocaleDateString()}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── BILLING VIEW ─────────────────────────────────────────────────────────────
function BillingView({ user, stats }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      style={{ maxWidth: 800, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Billing & Credits</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>Manage your balance and subscription</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 40 }}>
        <div style={{ padding: 30, background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.1))", borderRadius: 24, border: "1px solid rgba(124,58,237,0.2)" }}>
          <h3 style={{ color: "#c4b5fd", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Available Balance</h3>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 24 }}>
            <span style={{ color: "#fff", fontSize: 48, fontWeight: 800 }}>{stats?.totalCredits || user.credits}</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }}>Credits</span>
          </div>
          <button style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Top Up Now</button>
        </div>

        <div style={{ padding: 30, background: "rgba(255,255,255,0.03)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Current Plan</h3>
          <div style={{ marginBottom: 24 }}>
            <span style={{ color: "#fff", fontSize: 32, fontWeight: 800, textTransform: "capitalize" }}>{stats?.plan || "Free"}</span>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, marginTop: 4 }}>Basic usage, limit 5/day</p>
          </div>
          <button style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Upgrade Plan</button>
        </div>
      </div>
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
      alert("Settings updated!");
    } catch (err) {
      alert("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
      style={{ maxWidth: 600, margin: "60px auto", padding: "0 20px" }}>
      <h2 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: 32, fontWeight: 800, marginBottom: 32 }}>Account Settings</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Username</label>
          <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
            style={{ width: "100%", padding: "14px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 14, outline: "none" }} />
        </div>
        <div>
          <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Email Address</label>
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            style={{ width: "100%", padding: "14px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 14, outline: "none" }} />
        </div>
        <button type="submit" disabled={loading} style={{ padding: "16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 10 }}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
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
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 19, color: "#fff", letterSpacing: "0.02em" }}>Nexus</span>
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
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 24, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}>
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

  return (
    <div style={{ minHeight: "100vh", background: "#050816", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500;600&family=Syne:wght@600;700;800&display=swap');
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
            <motion.div key="lib" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 28px 200px" }}>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
                  <div>
                    <h1 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 800, marginBottom: 5 }}>My Library</h1>
                    <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 13, fontWeight: 300 }}>{libraryVideos.length} creations</p>
                  </div>
                  <button onClick={() => setTab("Inspiration")}
                    style={{ padding: "9px 20px", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
                    + New Video
                  </button>
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
          {tab === "Billing" && <BillingView user={user} stats={stats} />}

          {/* ── SETTINGS ── */}
          {tab === "Settings" && <SettingsView user={user} onUpdate={(u) => setUser(u)} />}

        </AnimatePresence>
      </div>

      {/* Global Bottom Input Box */}
      <PromptBox onGenerated={handleGenerationCreated} />
    </div>
  );
}
