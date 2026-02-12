import { useState, useEffect, useRef } from "react";
import { motion, useInView, useAnimation, AnimatePresence } from "framer-motion";

function Home() {

// ── Floating Orb (background ambient blobs) ──────────────────────────────────
const FloatingOrb = ({ style }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={style}
    animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.1, 1] }}
    transition={{ duration: 8 + Math.random() * 4, repeat: Infinity, ease: "easeInOut" }}
  />
);

// ── Animated counter ─────────────────────────────────────────────────────────
const Counter = ({ target, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// ── Section fade-up wrapper ──────────────────────────────────────────────────
const FadeUp = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

// ── Glowing card ─────────────────────────────────────────────────────────────
const GlowCard = ({ icon, title, desc, color, delay }) => (
  <FadeUp delay={delay}>
    <motion.div
      className="relative rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden group cursor-default h-full"
      whileHover={{ scale: 1.03, borderColor: "rgba(255,255,255,0.25)" }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{ background: `radial-gradient(circle at 50% 0%, ${color}22 0%, transparent 70%)` }}
      />
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
        style={{ background: `${color}22`, border: `1px solid ${color}55` }}
      >
        {icon}
      </div>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  </FadeUp>
);

// ── Pricing card ─────────────────────────────────────────────────────────────
const PricingCard = ({ plan, price, desc, features, popular, delay }) => (
  <FadeUp delay={delay}>
    <motion.div
      className={`relative rounded-2xl p-8 border h-full flex flex-col ${
        popular
          ? "border-violet-500/60 bg-gradient-to-b from-violet-950/60 to-black/60"
          : "border-white/10 bg-white/5"
      } backdrop-blur-sm`}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-violet-600 text-white text-xs font-bold px-4 py-1 rounded-full">
            MOST POPULAR
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-white font-bold text-xl mb-1">{plan}</h3>
        <p className="text-white/40 text-sm">{desc}</p>
      </div>
      <div className="mb-6">
        <span className="text-white font-black text-5xl">{price}</span>
        {price !== "Free" && <span className="text-white/40 text-sm ml-1">/month</span>}
      </div>
      <motion.button
        className={`w-full py-3 rounded-xl font-bold text-sm mb-6 transition-all ${
          popular
            ? "bg-violet-600 hover:bg-violet-500 text-white"
            : "border border-white/20 text-white hover:border-white/40 hover:bg-white/5"
        }`}
        whileTap={{ scale: 0.97 }}
      >
        Get Started
      </motion.button>
      <ul className="space-y-3 mt-auto">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-white/60">
            <span className={`text-base ${popular ? "text-violet-400" : "text-emerald-400"}`}>✓</span>
            {f}
          </li>
        ))}
      </ul>
    </motion.div>
  </FadeUp>
);

// ── Particle field ───────────────────────────────────────────────────────────
const Particles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    dur: Math.random() * 10 + 8,
    delay: Math.random() * 5,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-violet-400/30"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -80, 0], opacity: [0, 0.8, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

// ── Typing text ──────────────────────────────────────────────────────────────
const words = ["Videos", "Animations", "Reels", "Cinematic Scenes", "Shorts"];
const TypingText = () => {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[idx];
    let timeout;
    if (!deleting && displayed.length < word.length) {
      timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 90);
    } else if (!deleting && displayed.length === word.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 50);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIdx((prev) => (prev + 1) % words.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, idx]);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400">
      {displayed}
      <motion.span
        className="text-violet-400"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      >|</motion.span>
    </span>
  );
};

// ── Gallery items ─────────────────────────────────────────────────────────────
const galleryItems = [
  { bg: "from-violet-900 to-purple-950", label: "Cyberpunk City", tag: "Video" },
  { bg: "from-cyan-900 to-blue-950", label: "Ocean Depths", tag: "Animation" },
  { bg: "from-pink-900 to-rose-950", label: "Abstract Flow", tag: "Cinematic" },
  { bg: "from-amber-900 to-orange-950", label: "Desert Storm", tag: "Video" },
  { bg: "from-emerald-900 to-teal-950", label: "Forest Rain", tag: "Reel" },
  { bg: "from-indigo-900 to-slate-950", label: "Space Odyssey", tag: "Cinematic" },
];

// ── MAIN APP ─────────────────────────────────────────────────────────────────

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("video");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [setScrolled]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 3000);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
        }`}
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm font-black">
              ✦
            </div>
            <span className="font-black text-lg tracking-tight">AnimateX</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            {["Features", "Showcase", "Pricing", "Docs"].map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="hover:text-white transition-colors cursor-pointer"
                whileHover={{ y: -1 }}
              >
                {item}
              </motion.a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden md:block text-sm text-white/60 hover:text-white transition-colors px-4 py-2">
              Sign In
            </button>
            <motion.button
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-sm font-bold px-5 py-2 rounded-full transition-all"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started
            </motion.button>
            <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
              ☰
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex flex-col gap-4 text-sm text-white/70"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {["Features", "Showcase", "Pricing", "Docs"].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white" onClick={() => setMenuOpen(false)}>
                  {item}
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-black to-black" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(ellipse 80% 80% at 50% -20%, #7c3aed55, transparent)`,
            }}
          />
          <Particles />
        </div>

        <FloatingOrb style={{ width: 400, height: 400, top: "10%", left: "-10%", background: "radial-gradient(circle, #7c3aed22 0%, transparent 70%)" }} />
        <FloatingOrb style={{ width: 300, height: 300, bottom: "15%", right: "5%", background: "radial-gradient(circle, #ec489922 0%, transparent 70%)" }} />
        <FloatingOrb style={{ width: 200, height: 200, top: "40%", right: "20%", background: "radial-gradient(circle, #06b6d422 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24">
          <motion.div
            className="inline-flex items-center gap-2 border border-violet-500/30 bg-violet-950/30 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-violet-300 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-violet-400"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            ✦ AI-Powered Video Generation — Now in Beta
          </motion.div>

          <motion.h1
            className="text-6xl md:text-8xl font-black leading-none tracking-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            Create Stunning
            <br />
            <TypingText />
            <br />
            <span className="text-white/80">with AI</span>
          </motion.h1>

          <motion.p
            className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            Transform your ideas into professional animations and cinematic videos with our
            next-generation AI platform. No experience needed.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
          >
            <motion.button
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold px-8 py-4 rounded-full text-base flex items-center gap-2 shadow-lg shadow-violet-900/50"
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(124,58,237,0.4)" }}
              whileTap={{ scale: 0.97 }}
            >
              ▶ Start Creating Free
            </motion.button>
          
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex flex-wrap justify-center gap-12 mt-16 pt-12 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            {[
              { val: 500000, suffix: "+", label: "Creators" },
              { val: 10, suffix: "M+", label: "Videos Generated" },
              { val: 99, suffix: "%", label: "Satisfaction" },
            ].map(({ val, suffix, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-black text-white">
                  <Counter target={val} suffix={suffix} />
                </div>
                <div className="text-white/40 text-sm mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            className="w-px h-10 bg-gradient-to-b from-transparent to-violet-500"
            animate={{ scaleY: [0, 1, 0], y: [0, 0, 10] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-violet-950/10 to-black pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-violet-400 text-sm font-bold uppercase tracking-widest mb-3">Capabilities</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">Powerful Features</h2>
              <p className="text-white/40 mt-4 text-lg">Everything you need to create professional media with AI</p>
            </div>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <GlowCard delay={0.1} icon="⚡" title="Lightning Fast" color="#f59e0b"
              desc="Generate high-quality videos in seconds with our optimized AI pipeline." />
            <GlowCard delay={0.2} icon="🎬" title="Multiple Formats" color="#8b5cf6"
              desc="Create videos, animations, reels, and cinematic scenes from a single platform." />
            <GlowCard delay={0.3} icon="🎨" title="Customizable Styles" color="#ec4899"
              desc="Choose from cinematic, anime, realistic, abstract, and dozens of other styles." />
            <GlowCard delay={0.4} icon="⏱" title="Save Time" color="#06b6d4"
              desc="Automate your entire creative workflow and produce content at scale effortlessly." />
          </div>

          {/* Extra feature row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
            <GlowCard delay={0.5} icon="🔊" title="AI Voice & Audio" color="#10b981"
              desc="Auto-generate matching soundtracks, voiceovers, and sound effects for every video." />
            <GlowCard delay={0.6} icon="☁️" title="Cloud Rendering" color="#3b82f6"
              desc="No GPU required. Our cloud infrastructure handles all the heavy lifting." />
            <GlowCard delay={0.7} icon="🔗" title="API Access" color="#f97316"
              desc="Integrate AnimateX directly into your apps with our powerful REST API." />
          </div>
        </div>
      </section>

      {/* ── Generator UI ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, #7c3aed15, transparent)" }}
        />
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-12">
              <p className="text-violet-400 text-sm font-bold uppercase tracking-widest mb-3">Try It Now</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">Generate in Seconds</h2>
              <p className="text-white/40 mt-4 text-lg">Type your idea, choose a style, and watch AI bring it to life</p>
            </div>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl shadow-violet-900/30">
              {/* Tab switcher */}
              <div className="flex border-b border-white/10">
                {["video", "image", "audio"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 text-sm font-semibold capitalize transition-all relative ${
                      activeTab === tab ? "text-white" : "text-white/30 hover:text-white/60"
                    }`}
                  >
                    {tab === "video" && "🎬 "}
                    {tab === "image" && "🖼 "}
                    {tab === "audio" && "🔊 "}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {activeTab === tab && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-pink-500"
                        layoutId="tabLine"
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-8 grid md:grid-cols-2 gap-8">
                {/* Left: controls */}
                <div className="space-y-5">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Prompt</label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={`Describe the ${activeTab} you want to generate...`}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 resize-none h-28 focus:outline-none focus:border-violet-500/50 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Style</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 appearance-none text-sm">
                      <option value="" className="bg-black">Cinematic</option>
                      <option value="" className="bg-black">Anime</option>
                      <option value="" className="bg-black">Realistic</option>
                      <option value="" className="bg-black">Abstract</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Duration: 15s</label>
                    <div className="relative">
                      <div className="w-full h-2 bg-white/10 rounded-full">
                        <div className="w-3/4 h-2 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <motion.button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
                    whileHover={{ scale: generating ? 1 : 1.02 }}
                    whileTap={{ scale: generating ? 1 : 0.98 }}
                  >
                    {generating ? (
                      <>
                        <motion.span
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        />
                        Generating...
                      </>
                    ) : (
                      <>✦ Generate {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</>
                    )}
                  </motion.button>
                </div>

                {/* Right: preview */}
                <div className="rounded-xl border border-white/10 bg-black/50 flex items-center justify-center min-h-48 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    {!generating && !generated && (
                      <motion.div
                        key="empty"
                        className="text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="text-4xl mb-3 opacity-30">✦</div>
                        <p className="text-white/30 text-sm">Your generated content will appear here</p>
                      </motion.div>
                    )}
                    {generating && (
                      <motion.div
                        key="loading"
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="relative w-16 h-16">
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-violet-500/30"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-t-violet-500 border-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center text-xl">✦</div>
                        </div>
                        <p className="text-white/60 text-sm">AI is rendering your vision...</p>
                        <div className="w-40 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                          />
                        </div>
                      </motion.div>
                    )}
                    {generated && (
                      <motion.div
                        key="done"
                        className="w-full h-full flex flex-col items-center justify-center gap-4 p-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <motion.div
                          className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-2xl"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                        >
                          ✓
                        </motion.div>
                        <p className="text-white font-bold">Video Ready!</p>
                        <p className="text-white/40 text-sm text-center">Your cinematic video has been generated successfully</p>
                        <div className="flex gap-3">
                          <button className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                            Download
                          </button>
                          <button
                            className="border border-white/20 text-white/60 hover:text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                            onClick={() => { setGenerated(false); setPrompt(""); }}
                          >
                            New
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Showcase Gallery ────────────────────────────────────────────────── */}
      <section id="showcase" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-pink-400 text-sm font-bold uppercase tracking-widest mb-3">Gallery</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">Example Creations</h2>
              <p className="text-white/40 mt-4 text-lg">See what others have created with AnimateX</p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryItems.map(({ bg, label, tag }, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <motion.div
                  className={`relative rounded-2xl bg-gradient-to-br ${bg} overflow-hidden cursor-pointer group`}
                  style={{ aspectRatio: i % 3 === 1 ? "16/10" : "4/3" }}
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Animated shimmer */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)" }}
                  />

                  {/* Particle effect inside card */}
                  <div className="absolute inset-0">
                    {[...Array(8)].map((_, pi) => (
                      <motion.div
                        key={pi}
                        className="absolute w-1 h-1 rounded-full bg-white/40"
                        style={{ left: `${10 + pi * 12}%`, top: "80%" }}
                        animate={{ y: [0, -(80 + pi * 15)], opacity: [0, 0.6, 0] }}
                        transition={{ duration: 3 + pi * 0.3, delay: pi * 0.4, repeat: Infinity }}
                      />
                    ))}
                  </div>

                  {/* Play button */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={false}
                  >
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-xl">
                      ▶
                    </div>
                  </motion.div>

                  {/* Info */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <span className="text-white font-bold text-sm">{label}</span>
                    <span className="bg-black/50 backdrop-blur-sm text-white/70 text-xs px-2 py-1 rounded-full border border-white/10">
                      {tag}
                    </span>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 40% at 50% 100%, #7c3aed12, transparent)" }}
        />
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-violet-400 text-sm font-bold uppercase tracking-widest mb-3">Plans</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">Simple, Transparent Pricing</h2>
              <p className="text-white/40 mt-4 text-lg">Choose the plan that's right for you</p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PricingCard
              delay={0.1}
              plan="Free"
              price="Free"
              desc="Perfect for trying out our AI tools"
              features={["10 videos/month", "5 images/month", "Standard quality", "Basic styles", "Community support"]}
            />
            <PricingCard
              delay={0.2}
              plan="Pro"
              price="$29"
              desc="For professionals and creators"
              popular
              features={["100 videos/month", "Unlimited images", "HD quality", "All styles & effects", "Priority rendering", "Commercial license", "Email support"]}
            />
            <PricingCard
              delay={0.3}
              plan="Enterprise"
              price="$99"
              desc="For teams and businesses"
              features={["Unlimited videos", "4K quality", "API access", "Custom model training", "Dedicated support", "SLA guarantee", "Team management"]}
            />
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeUp>
            <div className="relative rounded-3xl overflow-hidden p-12 text-center border border-violet-500/30">
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(135deg, #7c3aed22 0%, #ec489922 50%, #06b6d422 100%)" }}
              />
              <motion.div
                className="absolute inset-0"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.1) 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                }}
              />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                  Start Creating Today
                </h2>
                <p className="text-white/50 text-lg mb-8">
                  Join 500,000+ creators already using AnimateX to bring their ideas to life.
                </p>
                <motion.button
                  className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold px-10 py-4 rounded-full text-base shadow-xl shadow-violet-900/40"
                  whileHover={{ scale: 1.06, boxShadow: "0 25px 50px rgba(124,58,237,0.45)" }}
                  whileTap={{ scale: 0.97 }}
                >
                  ▶ Start Creating Free — No Credit Card
                </motion.button>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm font-black">✦</div>
                <span className="font-black text-lg">AnimateX</span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                Create stunning AI-powered videos and animations. Bringing your creative vision to life with the power of artificial intelligence.
              </p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "API", "Documentation"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Legal", links: ["Privacy", "Terms", "License", "Security"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-white font-bold text-sm mb-4">{title}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-white/40 hover:text-violet-400 text-sm transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">© 2026 AnimateX. All rights reserved.</p>
            <div className="flex items-center gap-6">
              {["Twitter", "GitHub", "Discord", "YouTube"].map((s) => (
                <a key={s} href="#" className="text-white/30 hover:text-white/70 text-sm transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default Home