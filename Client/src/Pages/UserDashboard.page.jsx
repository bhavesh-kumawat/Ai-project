import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

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
const TABS = ["Inspiration", "Effects", "Library"];

const TRENDING = [
  { bg: "linear-gradient(135deg,#1e1b4b,#4c1d95,#312e81)", tag: "Cinematic", title: "Astronaut on Mars at sunset" },
  { bg: "linear-gradient(135deg,#0c4a6e,#0369a1,#075985)", tag: "Ocean", title: "Deep sea bioluminescence" },
  { bg: "linear-gradient(135deg,#14532d,#15803d,#166534)", tag: "Nature", title: "Forest at golden hour" },
  { bg: "linear-gradient(135deg,#4a044e,#7c3aed,#6b21a8)", tag: "Neon Noir", title: "Cyberpunk Tokyo rain night" },
  { bg: "linear-gradient(135deg,#7c2d12,#c2410c,#9a3412)", tag: "Fire", title: "Volcano eruption timelapse" },
  { bg: "linear-gradient(135deg,#0f172a,#1d4ed8,#1e3a5f)", tag: "Space", title: "Galaxy nebula formation" },
  { bg: "linear-gradient(135deg,#134e4a,#0f766e,#14b8a6)", tag: "Anime", title: "Spirit fox through teal forest" },
  { bg: "linear-gradient(135deg,#450a0a,#991b1b,#dc2626)", tag: "Drama", title: "Ancient battlefield at dawn" },
];

const EFFECTS = [
  { icon: "🌀", name: "Vortex", desc: "Spiral warp" },
  { icon: "💥", name: "Explosion", desc: "Cinematic burst" },
  { icon: "🌊", name: "Fluid", desc: "Liquid morph" },
  { icon: "⚡", name: "Glitch", desc: "Digital noise" },
  { icon: "🔥", name: "Inferno", desc: "Fire simulation" },
  { icon: "❄️", name: "Freeze", desc: "Ice crystals" },
  { icon: "🌌", name: "Nebula", desc: "Space dust" },
  { icon: "🪄", name: "Magic", desc: "Sparkle particles" },
];

const MY_VIDEOS = [
  { bg: "linear-gradient(135deg,#312e81,#1e1b4b)", title: "Astronaut on Mars", dur: "15s", status: "done" },
  { bg: "linear-gradient(135deg,#0c4a6e,#1e3a5f)", title: "Tokyo neon streets", dur: "10s", status: "done" },
  { bg: "linear-gradient(135deg,#4a044e,#3b0764)", title: "Fantasy dragon flight", dur: "30s", status: "processing" },
  { bg: "linear-gradient(135deg,#134e4a,#14532d)", title: "Ocean timelapse", dur: "15s", status: "done" },
];

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
  return {
    id: g._id,
    bg: "linear-gradient(135deg,#0f172a,#1e293b)",
    title: g.prompt || "Untitled",
    dur: durLabel,
    status,
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

// ─── PROMPT BOX ───────────────────────────────────────────────────────────────
function PromptBox({ onGenerated }) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Cinematic");
  const [dur, setDur] = useState("15s");
  const [ratio, setRatio] = useState("16:9");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const STYLES = ["Cinematic", "Anime", "3D Render", "Neon Noir", "Surreal"];
  const DURATIONS = ["5s", "10s", "15s", "30s"];
  const RATIOS = ["16:9", "9:16", "1:1"];

  const generate = () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setDone(false);
    setTimeout(() => { setLoading(false); setDone(true); onGenerated?.(); }, 3000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px" }}>

      {/* Card with animated border — same as login */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <div style={{ position: "absolute", inset: -1, borderRadius: 18, background: "linear-gradient(135deg,#7c3aed,#06b6d4,#ec4899,#7c3aed)", backgroundSize: "300% 300%", animation: "borderSpin 5s ease infinite", opacity: 0.55, pointerEvents: "none" }} />
        <div style={{ position: "relative", borderRadius: 18, background: "rgba(8,3,22,0.90)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>

          {/* Textarea */}
          <textarea
            value={prompt} onChange={e => setPrompt(e.target.value.slice(0, 500))}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
            placeholder="Describe your story…  e.g. A cinematic shot of an astronaut walking on Mars at golden hour"
            rows={3}
            style={{ width: "100%", background: "transparent", border: "none", padding: "18px 18px 10px", color: "#fff", fontSize: 14, fontWeight: 300, lineHeight: 1.7, resize: "none", outline: "none", letterSpacing: "0.02em" }}
          />

          {/* Bottom row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px 14px", flexWrap: "wrap", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 11 }}>{prompt.length}/500 · Enter ↵ to generate</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "7px 13px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", transition: "all .18s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)"; e.currentTarget.style.color = "#a78bfa"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
              >⬆ Image</button>
              <button onClick={generate} disabled={loading || !prompt.trim()} className="genbtn"
                style={{
                  padding: "7px 20px", borderRadius: 9, border: "none",
                  background: prompt.trim() && !loading ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "rgba(255,255,255,0.1)",
                  color: prompt.trim() && !loading ? "#fff" : "rgba(255,255,255,0.25)",
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", cursor: prompt.trim() && !loading ? "pointer" : "default",
                  transition: "background .25s", fontFamily: "'Syne',sans-serif", textTransform: "uppercase"
                }}
              >
                <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 7 }}>
                  {loading ? <><span className="spin16" />Generating…</> : done ? <>✓ Video Ready</> : <>🎬 Generate</>}
                </span>
              </button>
            </div>
          </div>

          {/* Progress */}
          <AnimatePresence>
            {loading && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ padding: "0 14px 14px" }}>
                  <div style={{ height: 3, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 5 }}>
                    <motion.div initial={{ width: "0%" }} animate={{ width: "88%" }} transition={{ duration: 2.8, ease: "easeOut" }}
                      style={{ height: "100%", background: "linear-gradient(90deg,#7c3aed,#06b6d4)", borderRadius: 999 }} />
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>AI is rendering your video…</p>
                </div>
              </motion.div>
            )}
            {done && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: "0 14px 12px", display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#34d399", fontSize: 12, fontWeight: 600 }}>✓ Your video is ready!</span>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>Check your library →</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", padding: "2px 4px" }}>
        <div>
          <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 7 }}>Style</p>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {STYLES.map(s => (
              <button key={s} onClick={() => setStyle(s)}
                style={{
                  padding: "5px 11px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                  background: style === s ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "rgba(255,255,255,0.07)",
                  color: style === s ? "#fff" : "rgba(255,255,255,0.38)",
                  outline: style === s ? "none" : "1px solid rgba(255,255,255,0.08)"
                }}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 7 }}>Duration</p>
          <div style={{ display: "flex", gap: 5 }}>
            {DURATIONS.map(d => (
              <button key={d} onClick={() => setDur(d)}
                style={{
                  padding: "5px 11px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                  background: dur === d ? "rgba(124,58,237,0.45)" : "rgba(255,255,255,0.07)",
                  color: dur === d ? "#c4b5fd" : "rgba(255,255,255,0.38)",
                  outline: dur === d ? "none" : "1px solid rgba(255,255,255,0.08)"
                }}>{d}</button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 7 }}>Ratio</p>
          <div style={{ display: "flex", gap: 5 }}>
            {RATIOS.map(r => (
              <button key={r} onClick={() => setRatio(r)}
                style={{
                  padding: "5px 11px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                  background: ratio === r ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.07)",
                  color: ratio === r ? "#22d3ee" : "rgba(255,255,255,0.38)",
                  outline: ratio === r ? "none" : "1px solid rgba(255,255,255,0.08)"
                }}>{r}</button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ user, tab, setTab, onLogout, live }) {
  const [menu, setMenu] = useState(false);
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: "blur(20px)", background: "rgba(5,8,22,0.80)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 58 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🎬</div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: "#fff", letterSpacing: "0.06em" }}>Nexus</span>
            <span style={{ color: "rgba(139,92,246,0.7)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em" }}>AI</span>
          </div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3, border: "1px solid rgba(255,255,255,0.07)" }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  padding: "6px 18px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em", transition: "all .18s",
                  background: tab === t ? "rgba(255,255,255,0.1)" : "transparent",
                  color: tab === t ? "#fff" : "rgba(255,255,255,0.38)"
                }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20, background: live ? "rgba(34,211,238,0.16)" : "rgba(148,163,184,0.12)", border: live ? "1px solid rgba(34,211,238,0.35)" : "1px solid rgba(148,163,184,0.25)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: live ? "#22d3ee" : "#94a3b8", animation: live ? "pulse 2s ease-in-out infinite" : "none" }} />
            <span style={{ color: live ? "#67e8f9" : "#94a3b8", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>LIVE</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
            <span>⚡</span><span style={{ color: "#c4b5fd", fontSize: 12, fontWeight: 700 }}>{user.credits}</span>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, border: "none", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "transform .15s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >✦ Upgrade</button>
          <div style={{ position: "relative" }}>
            <div onClick={() => setMenu(o => !o)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px 4px 4px", borderRadius: 20, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "all .18s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
            >
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{user.avatar}</div>
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 500 }}>{user.username}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>▾</span>
            </div>
            <AnimatePresence>
              {menu && (
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }}
                  style={{ position: "absolute", top: 44, right: 0, background: "rgba(10,4,28,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 8, minWidth: 185, zIndex: 200 }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 4 }}>
                    <p style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{user.username}</p>
                    <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 11 }}>{user.email}</p>
                  </div>
                  {["Profile", "Billing", "Settings"].map((it, i) => (
                    <button key={i} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer", borderRadius: 8, transition: "all .14s" }}
                      onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.06)"; e.target.style.color = "#fff"; }}
                      onMouseLeave={e => { e.target.style.background = "none"; e.target.style.color = "rgba(255,255,255,0.5)"; }}
                    >{it}</button>
                  ))}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 4, paddingTop: 4 }}>
                    <button onClick={onLogout} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", background: "none", border: "none", color: "rgba(248,113,113,0.75)", fontSize: 13, cursor: "pointer", borderRadius: 8 }}>Sign out</button>
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
  const displayName = storedUser?.username || storedUser?.email || "user";
  const user = {
    username: storedUser?.username || displayName,
    email: storedUser?.email || "",
    avatar: (displayName[0] || "U").toUpperCase(),
    credits: storedUser?.credits ?? 12,
  };
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const [tab, setTab] = useState("Inspiration");
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [liveGenerations, setLiveGenerations] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchGenerations = async () => {
      try {
        const res = await api.get("/generations?limit=12");
        const items = res.data?.data || [];
        if (active) {
          setLiveGenerations(items);
          setLastUpdatedAt(new Date().toISOString());
        }
      } catch (error) {
        // Keep dashboard usable even if live fetch fails
      }
    };

    fetchGenerations();
    const id = setInterval(fetchGenerations, 10000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const liveVideos = liveGenerations.map(mapGenerationToCard);
  const libraryVideos = liveVideos.length ? liveVideos : MY_VIDEOS;
  const completedCount = libraryVideos.filter(v => v.status === "done").length;
  const processingCount = libraryVideos.filter(v => v.status === "processing").length;
  const isLive = lastUpdatedAt ? (Date.now() - new Date(lastUpdatedAt).getTime() < 20000) : false;

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
      <Navbar user={user} tab={tab} setTab={setTab} onLogout={logout} live={isLive} />

      <div style={{ position: "relative", zIndex: 1, paddingTop: 58 }}>
        <AnimatePresence mode="wait">

          {/* ── INSPIRATION ── */}
          {tab === "Inspiration" && (
            <motion.div key="insp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

              {/* Hero */}
              <div style={{ textAlign: "center", padding: "56px 24px 44px" }}>
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
                  style={{ color: "rgba(255,255,255,0.3)", fontSize: 15, fontWeight: 300, marginBottom: 40 }}>
                  Describe any scene and watch AI bring it to life in seconds.
                </motion.p>

                <PromptBox />
              </div>

              {/* Trending */}
              <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px 72px" }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: 18, fontWeight: 700 }}>Trending Generations</h2>
                    <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 12, marginTop: 3 }}>Click any to use as your prompt</p>
                  </div>
                  <button style={{ padding: "6px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", transition: "all .18s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
                    View All →
                  </button>
                </motion.div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
                  {TRENDING.map((v, i) => <VideoCard key={i} {...v} delay={0.38 + i * 0.04} />)}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── EFFECTS ── */}
          {tab === "Effects" && (
            <motion.div key="effects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div style={{ maxWidth: 900, margin: "0 auto", padding: "52px 28px 72px" }}>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ textAlign: "center", marginBottom: 44 }}>
                  <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(26px,4vw,46px)", fontWeight: 800, color: "#fff", marginBottom: 10 }}>
                    Video <span style={{ background: "linear-gradient(90deg,#a78bfa,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Effects</span>
                  </h1>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 300 }}>Select an effect to apply to your next generation</p>
                </motion.div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 48 }}>
                  {EFFECTS.map((ef, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 18, scale: 0.93 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.08 + i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => setSelectedEffect(selectedEffect === ef.name ? null : ef.name)}
                      style={{
                        padding: "24px 14px", background: selectedEffect === ef.name ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(14px)",
                        border: `1px solid ${selectedEffect === ef.name ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 16, textAlign: "center", cursor: "pointer", transition: "all .22s"
                      }}
                      whileHover={{ y: -5, boxShadow: "0 10px 32px rgba(124,58,237,0.22)" }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <div style={{ fontSize: 34, marginBottom: 10 }}>{ef.icon}</div>
                      <p style={{ color: selectedEffect === ef.name ? "#c4b5fd" : "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'Syne',sans-serif", marginBottom: 4 }}>{ef.name}</p>
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{ef.desc}</p>
                      {selectedEffect === ef.name && (
                        <div style={{ marginTop: 8, padding: "2px 8px", borderRadius: 999, background: "rgba(139,92,246,0.3)", display: "inline-block", color: "#c4b5fd", fontSize: 10, fontWeight: 700 }}>✓ Selected</div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  style={{ color: "rgba(255,255,255,0.28)", fontSize: 13, textAlign: "center", marginBottom: 22 }}>
                  {selectedEffect ? `"${selectedEffect}" effect selected — describe your scene below` : "Select an effect above, then describe your scene"}
                </motion.p>
                <PromptBox />
              </div>
            </motion.div>
          )}

          {/* ── LIBRARY ── */}
          {tab === "Library" && (
            <motion.div key="lib" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 28px 72px" }}>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
                  <div>
                    <h1 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 800, marginBottom: 5 }}>My Library</h1>
                    <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 13, fontWeight: 300 }}>{libraryVideos.length} videos</p>
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
                            <video
                              src={preview.output}
                              controls
                              style={{ width: "100%", borderRadius: 12, background: "#000" }}
                            />
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

        </AnimatePresence>
      </div>
    </div>
  );
}
