import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getAdminStats, getAdminUsers } from "../Service/admin.service";

// ─── CANVAS (red tinted meteors for admin) ────────────────────────────────────
function SpaceCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); let raf;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const stars = Array.from({ length: 110 }, (_, i) => ({
      x: ((i * 7919) % 997) / 997, y: ((i * 6271) % 991) / 991,
      r: ((i * 3571) % 100) / 100 * 1.1 + 0.2, base: ((i * 4999) % 100) / 100 * 0.35 + 0.06,
      spd: ((i * 2333) % 100) / 100 * 0.006 + 0.002, ph: i * 1.4,
    }));
    const meteors = Array.from({ length: 3 }, (_, i) => ({ active: false, prog: 0, timer: 0, delay: 2200 + i * 5000 }));
    const spawn = m => { m.x = Math.random() * c.width * 0.7; m.y = Math.random() * c.height * 0.35; m.len = 60 + Math.random() * 100; m.prog = 0; m.spd = 0.014 + Math.random() * 0.012; m.active = true; };
    let t = 0;
    const draw = () => {
      const w = c.width, h = c.height; t += 0.016; ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const op = s.base + Math.sin(t * s.spd * 60 + s.ph) * 0.18;
        ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, op)})`; ctx.fill();
      }
      for (const m of meteors) {
        m.timer += 16; if (!m.active) { if (m.timer >= m.delay) spawn(m); continue; }
        m.prog += m.spd; if (m.prog >= 1) { m.active = false; m.timer = 0; m.delay = 5000 + Math.random() * 9000; continue; }
        const dx = m.len * Math.cos(Math.PI / 5), dy = m.len * Math.sin(Math.PI / 5);
        const tx = m.x + dx * m.prog, ty = m.y + dy * m.prog;
        const al = m.prog < 0.5 ? m.prog * 2 : (1 - m.prog) * 2;
        const g = ctx.createLinearGradient(tx, ty, tx - dx * 0.55, ty - dy * 0.55);
        g.addColorStop(0, `rgba(255,220,200,${al})`); g.addColorStop(0.4, `rgba(239,68,68,${al * 0.4})`); g.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - dx * 0.55, ty - dy * 0.55);
        ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.78 }} />;
}

// ─── BLOBS (red/orange for admin) ────────────────────────────────────────────
function Blobs() {
  return (
    <>
      <style>{`
        @keyframes bA{0%,100%{transform:translate(-50%,-50%) scale(1)}35%{transform:translate(-50%,-50%) scale(1.1) translate(30px,-40px)}70%{transform:translate(-50%,-50%) scale(0.94) translate(-20px,22px)}}
        @keyframes bB{0%,100%{transform:translate(-50%,-50%) scale(1)}45%{transform:translate(-50%,-50%) scale(1.08) translate(-28px,22px)}80%{transform:translate(-50%,-50%) scale(0.95) translate(18px,-26px)}}
        @keyframes bC{0%,100%{transform:translate(-50%,-50%) scale(1)}55%{transform:translate(-50%,-50%) scale(1.12) translate(22px,28px)}}
        .bl{position:fixed;border-radius:50%;pointer-events:none;will-change:transform;z-index:0;}
        .ba{animation:bA 17s ease-in-out infinite;}.bb{animation:bB 22s ease-in-out infinite;}.bc{animation:bC 14s ease-in-out infinite;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
      `}</style>
      <div className="bl ba" style={{ width: 500, height: 500, left: "6%", top: "20%", background: "radial-gradient(circle,rgba(220,38,38,0.3) 0%,transparent 70%)", filter: "blur(55px)" }} />
      <div className="bl bb" style={{ width: 420, height: 420, left: "88%", top: "65%", background: "radial-gradient(circle,rgba(234,88,12,0.25) 0%,transparent 70%)", filter: "blur(50px)" }} />
      <div className="bl bc" style={{ width: 300, height: 300, left: "75%", top: "10%", background: "radial-gradient(circle,rgba(239,68,68,0.18) 0%,transparent 70%)", filter: "blur(44px)" }} />
    </>
  );
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const NAV_TABS = ["Overview", "Users", "Videos", "Analytics", "Moderation", "Settings"];

const USERS = [
  { id: 1, name: "john_doe", email: "john@ex.com", role: "user", status: "active", videos: 18, credits: 120, joined: "Jan 12" },
  { id: 2, name: "sarah_k", email: "sarah@ex.com", role: "user", status: "active", videos: 9, credits: 340, joined: "Jan 18" },
  { id: 3, name: "mike_92", email: "mike@ex.com", role: "user", status: "inactive", videos: 2, credits: 0, joined: "Feb 2" },
  { id: 4, name: "alex_dev", email: "alex@ex.com", role: "admin", status: "active", videos: 55, credits: 999, joined: "Dec 30" },
  { id: 5, name: "priya_m", email: "priya@ex.com", role: "user", status: "active", videos: 7, credits: 80, joined: "Feb 8" },
  { id: 6, name: "chen_liu", email: "chen@ex.com", role: "user", status: "pending", videos: 0, credits: 50, joined: "Feb 11" },
];

const RECENT_VIDEOS = [
  { user: "john_doe", prompt: "Astronaut on Mars at sunset", style: "Cinematic", dur: "15s", status: "completed", time: "5m ago" },
  { user: "sarah_k", prompt: "Neon Tokyo rain cyberpunk", style: "Neon Noir", dur: "10s", status: "completed", time: "12m ago" },
  { user: "mike_92", prompt: "Fantasy dragon flying", style: "3D Render", dur: "30s", status: "failed", time: "1h ago" },
  { user: "priya_m", prompt: "Abstract fluid morphing", style: "Surreal", dur: "10s", status: "processing", time: "2m ago" },
  { user: "chen_liu", prompt: "Cherry blossom anime scene", style: "Anime", dur: "15s", status: "completed", time: "3h ago" },
];

const MOD_QUEUE = [
  { user: "john_doe", prompt: "Dark battle scene with graphic violence", reason: "Violence", bg: "linear-gradient(135deg,#7c2d12,#1c1917)", time: "10m ago" },
  { user: "mike_92", prompt: "Realistic weapon showcase close-up", reason: "Weapons", bg: "linear-gradient(135deg,#365314,#1a2e05)", time: "1h ago" },
  { user: "chen_liu", prompt: "Controversial political speech video", reason: "Political", bg: "linear-gradient(135deg,#1e3a5f,#0f172a)", time: "2h ago" },
];

const WEEK = [
  { d: "Mon", v: 42 }, { d: "Tue", v: 68 }, { d: "Wed", v: 55 }, { d: "Thu", v: 89 }, { d: "Fri", v: 73 }, { d: "Sat", v: 38 }, { d: "Sun", v: 51 },
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

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────
const SC = { completed: "#34d399", processing: "#fbbf24", failed: "#f87171", active: "#34d399", inactive: "#6b7280", pending: "#fbbf24" };

function Badge({ label, color, bg }) {
  return <span style={{ padding: "2px 8px", borderRadius: 999, background: bg || `${color}18`, color, fontSize: 10, fontWeight: 700, textTransform: "uppercase", display: "inline-block" }}>{label}</span>;
}

function StatCard({ icon, label, value, change, color, delay }) {
  const pos = change?.startsWith("+");
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: "20px 22px", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, position: "relative", overflow: "hidden" }}
      whileHover={{ y: -3, boxShadow: `0 8px 28px ${color}20` }} transition={{ duration: 0.2 }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at 80% 20%,${color}18,transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>{label}</p>
      <p style={{ color: "#fff", fontSize: 26, fontWeight: 800, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{value}</p>
      {change && <p style={{ color: pos ? "#34d399" : "#f87171", fontSize: 11, marginTop: 5, fontWeight: 500 }}>{change}</p>}
    </motion.div>
  );
}

function BarChart({ data, color = "#7c3aed" }) {
  const max = Math.max(...data.map(d => d.v));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 72 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <motion.div initial={{ height: 0 }} animate={{ height: `${(d.v / max) * 58}px` }} transition={{ delay: 0.1 + i * 0.04, duration: 0.55, ease: "easeOut" }}
            style={{ width: "100%", borderRadius: "3px 3px 0 0", background: color, minHeight: 3 }} />
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 9 }}>{d.d}</span>
        </div>
      ))}
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ user, activeTab, setActiveTab, onLogout, live }) {
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: "blur(20px)", background: "rgba(5,8,22,0.82)", borderBottom: "1px solid rgba(220,38,38,0.18)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 58 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#dc2626,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🎬</div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: "#fff", letterSpacing: "0.06em" }}>Nexus</span>
            <span style={{ color: "rgba(239,68,68,0.7)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em" }}>AI</span>
          </div>
          <div style={{ padding: "2px 10px", borderRadius: 999, background: "rgba(220,38,38,0.18)", border: "1px solid rgba(220,38,38,0.35)", color: "#fca5a5", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>🛡 ADMIN</div>
        </div>

        {/* Nav tabs */}
        <div style={{ display: "flex", gap: 2 }}>
          {NAV_TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ padding: "6px 14px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .18s",
                background: activeTab === t ? "rgba(220,38,38,0.2)" : "transparent",
                color: activeTab === t ? "#fca5a5" : "rgba(255,255,255,0.38)",
                borderBottom: activeTab === t ? "2px solid #dc2626" : "2px solid transparent" }}>{t}</button>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 9px", borderRadius: 999, background: live ? "rgba(248,113,113,0.15)" : "rgba(148,163,184,0.12)", border: live ? "1px solid rgba(248,113,113,0.35)" : "1px solid rgba(148,163,184,0.25)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: live ? "#f87171" : "#94a3b8", animation: live ? "pulse 1.8s ease-in-out infinite" : "none" }} />
            <span style={{ color: live ? "#fecaca" : "#94a3b8", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>LIVE</span>
          </div>
          <div style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.2)", color: "#fca5a5", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ animation: "pulse 1.5s ease-in-out infinite", display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#f87171" }} />
            3 alerts
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#dc2626,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{user.avatar}</div>
          <button onClick={onLogout} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.2)", background: "transparent", color: "rgba(248,113,113,0.6)", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Logout</button>
        </div>
      </div>
    </nav>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const displayName = storedUser?.username || storedUser?.email || "admin";
  const user = { username: storedUser?.username || displayName, email: storedUser?.email || "", avatar: (displayName[0] || "A").toUpperCase(), role: "admin" };
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const [activeTab, setActiveTab] = useState("Overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [modQueue, setModQueue] = useState(MOD_QUEUE);
  const [stats, setStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchAdminLive = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          getAdminStats(),
          getAdminUsers({ q: searchQuery, limit: 20 }),
        ]);
        if (!active) return;
        setStats(statsRes?.data || null);
        setAdminUsers(usersRes?.data || []);
        setLastUpdatedAt(new Date().toISOString());
      } catch (error) {
        // keep UI usable on failed live fetch
      }
    };

    fetchAdminLive();
    const id = setInterval(fetchAdminLive, 10000);
    return () => { active = false; clearInterval(id); };
  }, [searchQuery]);

  const effectiveUsers = adminUsers.length
    ? adminUsers.map((u, idx) => ({
        id: idx + 1,
        name: u.username || u.email || "user",
        email: u.email || "",
        role: u.role || "user",
        status: "active",
        videos: 0,
        credits: 0,
        joined: formatTimeAgo(u.createdAt),
      }))
    : USERS;

  const filteredUsers = effectiveUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentLive = stats?.recentGenerations || [];
  const recentVideos = recentLive.length
    ? recentLive.map((g) => ({
        user: g.user?.username || g.user?.email || "user",
        prompt: g.prompt || "Untitled",
        style: g.modelUsed || "Default",
        dur: g.metadata?.duration || "—",
        status: g.status || "pending",
        time: formatTimeAgo(g.createdAt),
      }))
    : RECENT_VIDEOS;

  const totals = stats?.totals || {};
  const statusCounts = stats?.status || {};
  const queueDepth = (statusCounts.pending || 0) + (statusCounts.processing || 0);
  const isLive = lastUpdatedAt ? (Date.now() - new Date(lastUpdatedAt).getTime() < 20000) : false;

  const removeFromQueue = (i) => setModQueue(q => q.filter((_, idx) => idx !== i));

  return (
    <div style={{ minHeight: "100vh", background: "#050816", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:rgba(220,38,38,0.4);color:#fff;}
        ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px;}
        input,button,textarea{font-family:'DM Sans',sans-serif;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      <Blobs /><SpaceCanvas />
      <Navbar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} live={isLive} />

      <div style={{ position: "relative", zIndex: 1, paddingTop: 58 }}>
        <AnimatePresence mode="wait">

          {/* ═══════════════ OVERVIEW ═══════════════ */}
          {activeTab === "Overview" && (
            <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div style={{ maxWidth: 1280, margin: "0 auto", padding: "44px 28px 72px" }}>

                {/* Title */}
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ marginBottom: 30 }}>
                  <p style={{ color: "rgba(252,165,165,0.5)", fontSize: 12, letterSpacing: "0.12em", marginBottom: 5 }}>🛡 Admin Control Panel</p>
                  <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(26px,4vw,44px)", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
                    Platform{" "}
                    <span style={{ background: "linear-gradient(90deg,#fca5a5,#fb923c,#fde68a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Overview</span>
                  </h1>
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, marginTop: 5 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </motion.div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
                  <StatCard icon="🎬" label="Total Videos" value={totals.videos ?? 0} change="+12% week" color="#a78bfa" delay={0.08} />
                  <StatCard icon="👥" label="Total Users" value={totals.users ?? 0} change="+2 week" color="#22d3ee" delay={0.14} />
                  <StatCard icon="⚡" label="API Calls Today" value="4,891" change="+18%" color="#fb923c" delay={0.20} />
                  <StatCard icon="💰" label="Revenue MTD" value="$2,340" change="+8%" color="#34d399" delay={0.26} />
                  <StatCard icon="⚠️" label="Failed Jobs" value={statusCounts.failed ?? 0} change="-3%" color="#f87171" delay={0.32} />
                  <StatCard icon="🔄" label="Queue Depth" value={queueDepth} change="avg 12s" color="#fbbf24" delay={0.38} />
                </div>

                {/* Charts row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
                    style={{ padding: "20px", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                      <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>Videos Generated</p>
                      <span style={{ color: "#34d399", fontSize: 12, fontWeight: 600 }}>+24% ↑</span>
                    </div>
                    <BarChart data={WEEK} color="#7c3aed" />
                    <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 10, textAlign: "center" }}>Total this week: 416 videos</p>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
                    style={{ padding: "20px", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
                    <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif", marginBottom: 16 }}>Style Breakdown</p>
                    {[
                      { label: "Cinematic", pct: 38, color: "#7c3aed" },
                      { label: "Anime", pct: 24, color: "#ec4899" },
                      { label: "3D Render", pct: 18, color: "#06b6d4" },
                      { label: "Neon Noir", pct: 12, color: "#fbbf24" },
                      { label: "Other", pct: 8, color: "#6b7280" },
                    ].map((s, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{s.label}</span>
                          <span style={{ color: s.color, fontSize: 12, fontWeight: 600 }}>{s.pct}%</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ delay: 0.52 + i * 0.07, duration: 0.7, ease: "easeOut" }}
                            style={{ height: "100%", background: s.color, borderRadius: 999 }} />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>

                {/* Recent jobs */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                  style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>Recent Generation Jobs</p>
                    <button onClick={() => setActiveTab("Videos")} style={{ color: "#a78bfa", fontSize: 12, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>View All →</button>
                  </div>
                  {recentVideos.map((v, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.58 + i * 0.05 }}
                      style={{ display: "grid", gridTemplateColumns: "100px 1fr 90px 60px 100px 70px", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: i < RECENT_VIDEOS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", transition: "background .12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 600 }}>@{v.user}</span>
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.prompt}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{v.style}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{v.dur}</span>
                      <Badge label={v.status} color={SC[v.status]} />
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>{v.time}</span>
                    </motion.div>
                  ))}
                </motion.div>

              </div>
            </motion.div>
          )}

          {/* ═══════════════ USERS ═══════════════ */}
          {activeTab === "Users" && (
            <motion.div key="usr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div style={{ maxWidth: 1280, margin: "0 auto", padding: "44px 28px 72px" }}>
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <div>
                    <h1 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: 26, fontWeight: 800 }}>User Management</h1>
                    <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 13, marginTop: 3 }}>{filteredUsers.length} total users</p>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search users…"
                      style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 12, outline: "none", width: 210 }} />
                    <button style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#dc2626,#ea580c)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add User</button>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "32px 1.5fr 1.6fr 70px 80px 65px 80px 110px", gap: 0, padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                    {["#", "Username", "Email", "Role", "Status", "Videos", "Credits", "Actions"].map((h, i) => (
                      <span key={i} style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</span>
                    ))}
                  </div>
                  {filteredUsers.map((u, i) => (
                    <motion.div key={u.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ display: "grid", gridTemplateColumns: "32px 1.5fr 1.6fr 70px 80px 65px 80px 110px", gap: 0, padding: "13px 18px", borderBottom: i < filteredUsers.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", alignItems: "center", transition: "background .12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>{u.id}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: u.role === "admin" ? "linear-gradient(135deg,#dc2626,#ea580c)" : "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{u.name[0].toUpperCase()}</div>
                        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{u.name}</span>
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{u.email}</span>
                      <Badge label={u.role} color={u.role === "admin" ? "#fca5a5" : "#c4b5fd"} bg={u.role === "admin" ? "rgba(220,38,38,0.18)" : "rgba(124,58,237,0.18)"} />
                      <Badge label={u.status} color={SC[u.status]} />
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, textAlign: "center" }}>{u.videos}</span>
                      <span style={{ color: "#c4b5fd", fontSize: 12, fontWeight: 600 }}>⚡{u.credits}</span>
                      <div style={{ display: "flex", gap: 5 }}>
                        {["Edit", "Ban", "Del"].map((a, ai) => (
                          <button key={ai} style={{ padding: "3px 7px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: a === "Del" ? "rgba(248,113,113,0.6)" : "rgba(255,255,255,0.4)", fontSize: 10, cursor: "pointer", transition: "all .14s" }}
                            onMouseEnter={e => { e.target.style.borderColor = a === "Del" ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.25)"; e.target.style.color = a === "Del" ? "#f87171" : "#fff"; }}
                            onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.color = a === "Del" ? "rgba(248,113,113,0.6)" : "rgba(255,255,255,0.4)"; }}
                          >{a}</button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* User stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 20 }}>
                  {[
                    { title: "Top Generator", val: "alex_dev", sub: "55 videos created", icon: "🏆", color: "#fbbf24" },
                    { title: "Most Credits", val: "sarah_k", sub: "340 credits remaining", icon: "⚡", color: "#22d3ee" },
                    { title: "Newest Member", val: "chen_liu", sub: "Joined Feb 11", icon: "🆕", color: "#a78bfa" },
                  ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                      style={{ padding: "18px 20px", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{s.title}</p>
                        <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>{s.val}</p>
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{s.sub}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ VIDEOS ═══════════════ */}
          {activeTab === "Videos" && (
            <motion.div key="vids" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div style={{ maxWidth: 1280, margin: "0 auto", padding: "44px 28px 72px" }}>
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 22 }}>
                  <h1 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: 26, fontWeight: 800 }}>All Videos</h1>
                  <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 13, marginTop: 3 }}>All platform generation jobs</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 60px 100px 70px 60px", gap: 0, padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                    {["Prompt", "User", "Style", "Dur", "Status", "Time", "Action"].map((h, i) => (
                      <span key={i} style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</span>
                    ))}
                  </div>
                  {recentVideos.map((v, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 60px 100px 70px 60px", gap: 0, padding: "13px 18px", borderBottom: i < RECENT_VIDEOS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", alignItems: "center", transition: "background .12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 10 }}>{v.prompt}</span>
                      <span style={{ color: "#a78bfa", fontSize: 11, fontWeight: 600 }}>@{v.user}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{v.style}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{v.dur}</span>
                      <Badge label={v.status} color={SC[v.status]} />
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>{v.time}</span>
                      <button style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.08)", color: "rgba(248,113,113,0.6)", fontSize: 10, cursor: "pointer" }}
                        onMouseEnter={e => { e.target.style.background = "rgba(248,113,113,0.2)"; e.target.style.color = "#f87171"; }}
                        onMouseLeave={e => { e.target.style.background = "rgba(248,113,113,0.08)"; e.target.style.color = "rgba(248,113,113,0.6)"; }}>Del</button>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ ANALYTICS ═══════════════ */}
          {activeTab === "Analytics" && (
            <motion.div key="ana" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div style={{ maxWidth: 1280, margin: "0 auto", padding: "44px 28px 72px" }}>
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
                  <h1 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: 26, fontWeight: 800 }}>Analytics</h1>
                </motion.div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
                  {[
                    { title: "Daily Active Users", data: [{ d: "M", v: 12 }, { d: "T", v: 18 }, { d: "W", v: 15 }, { d: "T", v: 22 }, { d: "F", v: 19 }, { d: "S", v: 8 }, { d: "S", v: 6 }], color: "#7c3aed", info: "Avg 14.3/day" },
                    { title: "API Latency (ms)", data: [{ d: "M", v: 320 }, { d: "T", v: 280 }, { d: "W", v: 310 }, { d: "T", v: 290 }, { d: "F", v: 340 }, { d: "S", v: 260 }, { d: "S", v: 270 }], color: "#06b6d4", info: "Avg 295ms" },
                    { title: "Credit Usage", data: [{ d: "M", v: 800 }, { d: "T", v: 1200 }, { d: "W", v: 950 }, { d: "T", v: 1400 }, { d: "F", v: 1100 }, { d: "S", v: 600 }, { d: "S", v: 750 }], color: "#fb923c", info: "6,800 this week" },
                  ].map((ch, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      style={{ padding: "20px", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
                      <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'Syne',sans-serif", marginBottom: 14 }}>{ch.title}</p>
                      <BarChart data={ch.data} color={ch.color} />
                      <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 10 }}>{ch.info}</p>
                    </motion.div>
                  ))}
                </div>
                {/* Top users leaderboard */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  style={{ padding: "20px", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
                  <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif", marginBottom: 16 }}>Top Users by Videos Generated</p>
                  {[...USERS].sort((a, b) => b.videos - a.videos).map((u, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < USERS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, fontWeight: 700, width: 22 }}>#{i + 1}</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, flex: 1 }}>{u.name}</span>
                      <div style={{ flex: 3, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(u.videos / 55) * 100}%` }} transition={{ delay: 0.35 + i * 0.06, duration: 0.7 }}
                          style={{ height: "100%", background: "linear-gradient(90deg,#dc2626,#ea580c)", borderRadius: 999 }} />
                      </div>
                      <span style={{ color: "#fca5a5", fontSize: 13, fontWeight: 600, minWidth: 28, textAlign: "right" }}>{u.videos}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ MODERATION ═══════════════ */}
          {activeTab === "Moderation" && (
            <motion.div key="mod" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div style={{ maxWidth: 1100, margin: "0 auto", padding: "44px 28px 72px" }}>
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26 }}>
                  <h1 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: 26, fontWeight: 800 }}>Moderation Queue</h1>
                  {modQueue.length > 0 && <Badge label={`${modQueue.length} pending`} color="#f87171" bg="rgba(248,113,113,0.15)" />}
                </motion.div>

                {modQueue.length === 0 ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: "60px 0" }}>
                    <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
                    <p style={{ color: "#fff", fontSize: 18, fontWeight: 700, fontFamily: "'Syne',sans-serif", marginBottom: 6 }}>Queue is clear!</p>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>All videos have been reviewed</p>
                  </motion.div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {modQueue.map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16, height: 0 }} transition={{ delay: i * 0.07 }}
                        layout style={{ display: "flex", gap: 16, padding: "18px 20px", background: "rgba(248,113,113,0.05)", backdropFilter: "blur(14px)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 16, alignItems: "center" }}>
                        <div style={{ width: 80, height: 54, borderRadius: 10, background: item.bg, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                            <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 600 }}>@{item.user}</span>
                            <Badge label={`⚠ ${item.reason}`} color="#f87171" bg="rgba(248,113,113,0.15)" />
                            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>{item.time}</span>
                          </div>
                          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>&quot;{item.prompt}&quot;</p>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <button onClick={() => removeFromQueue(i)} style={{ padding: "7px 16px", borderRadius: 9, border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.1)", color: "#34d399", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(52,211,153,0.2)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(52,211,153,0.1)"}
                          >✓ Approve</button>
                          <button onClick={() => removeFromQueue(i)} style={{ padding: "7px 16px", borderRadius: 9, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.1)", color: "#f87171", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.2)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(248,113,113,0.1)"}
                          >✕ Remove</button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══════════════ SETTINGS ═══════════════ */}
          {activeTab === "Settings" && (
            <motion.div key="set" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div style={{ maxWidth: 1100, margin: "0 auto", padding: "44px 28px 72px" }}>
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 26 }}>
                  <h1 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: 26, fontWeight: 800 }}>Platform Settings</h1>
                  <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 13, marginTop: 4 }}>Configure and manage all platform-level settings</p>
                </motion.div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { title: "🎬 Generation", items: ["Default video quality", "Max duration limit", "Allowed styles", "Credit cost per second", "Queue priority rules", "Model version"] },
                    { title: "🔐 Security", items: ["Rotate admin secret key", "Enable 2FA for admins", "IP allowlist", "Rate limiting config", "JWT expiry duration", "Session management"] },
                    { title: "💰 Billing", items: ["Credit package pricing", "Subscription tiers", "Refund policy", "Invoice templates", "Payment gateway keys", "Trial settings"] },
                    { title: "📧 Email", items: ["SMTP configuration", "Welcome email template", "Credit alert threshold", "Password reset template", "Weekly digest", "Notification rules"] },
                    { title: "🌐 Platform", items: ["Site name & branding", "Maintenance mode", "Feature flags", "API rate limits", "Webhook endpoints", "CDN settings"] },
                    { title: "🗑 Danger Zone", items: ["Purge all failed jobs", "Reset user credit balances", "Wipe moderation queue", "Revoke all sessions", "Factory reset platform", "Export all data"], danger: true },
                  ].map((g, gi) => (
                    <motion.div key={gi} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.06 }}
                      style={{ padding: "20px", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(14px)", border: `1px solid ${g.danger ? "rgba(248,113,113,0.22)" : "rgba(255,255,255,0.07)"}`, borderRadius: 16 }}>
                      <p style={{ color: g.danger ? "#fca5a5" : "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif", marginBottom: 12 }}>{g.title}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {g.items.map((item, ii) => (
                          <motion.button key={ii}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: "rgba(255,255,255,0.04)", border: `1px solid ${g.danger ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.06)"}`, borderRadius: 10, cursor: "pointer", transition: "all .18s", textAlign: "left" }}
                            whileHover={{ x: 3, background: g.danger ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.07)" }}
                            whileTap={{ scale: 0.98 }}>
                            <span style={{ color: g.danger ? "rgba(248,113,113,0.7)" : "rgba(255,255,255,0.55)", fontSize: 12 }}>{item}</span>
                            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>→</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
