import { useEffect, useRef } from "react";

function SpaceCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Deterministic stars — no Math.random() on every render
    const stars = Array.from({ length: 120 }, (_, i) => ({
      x:     (((i * 7919) % 997) / 997),
      y:     (((i * 6271) % 991) / 991),
      r:     ((i * 3571) % 100) / 100 * 1.3 + 0.2,
      base:  ((i * 4999) % 100) / 100 * 0.45 + 0.08,
      speed: ((i * 2333) % 100) / 100 * 0.007 + 0.002,
      phase: i * 1.4,
    }));

    // Meteors
    const meteors = Array.from({ length: 5 }, (_, i) => ({
      active: false, prog: 0, timer: 0,
      initDelay: 1200 + i * 3500,
    }));

    const spawnMeteor = (m) => {
      const w = canvas.width, h = canvas.height;
      m.x     = Math.random() * w * 0.65;
      m.y     = Math.random() * h * 0.38;
      m.len   = 70 + Math.random() * 100;
      m.prog  = 0;
      m.speed = 0.016 + Math.random() * 0.014;
      m.active = true;
    };

    let t = 0;
    const draw = () => {
      const w = canvas.width, h = canvas.height;
      t += 0.016;
      ctx.clearRect(0, 0, w, h);

      // Stars
      for (const s of stars) {
        const opacity = s.base + Math.sin(t * s.speed * 60 + s.phase) * 0.22;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, opacity)})`;
        ctx.fill();
      }

      // Meteors
      for (const m of meteors) {
        m.timer += 16;
        if (!m.active) {
          if (m.timer >= m.initDelay) spawnMeteor(m);
          continue;
        }
        m.prog += m.speed;
        if (m.prog >= 1) {
          m.active = false;
          m.timer  = 0;
          m.initDelay = 3000 + Math.random() * 7000;
          continue;
        }
        const cos = Math.cos(Math.PI / 5), sin = Math.sin(Math.PI / 5);
        const dx = m.len * cos, dy = m.len * sin;
        const tx = m.x + dx * m.prog, ty = m.y + dy * m.prog;
        const alpha = m.prog < 0.5 ? m.prog * 2 : (1 - m.prog) * 2;

        const g = ctx.createLinearGradient(tx, ty, tx - dx * 0.55, ty - dy * 0.55);
        g.addColorStop(0,   `rgba(255,255,255,${alpha})`);
        g.addColorStop(0.4, `rgba(167,139,250,${alpha * 0.5})`);
        g.addColorStop(1,   "transparent");

        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - dx * 0.55, ty - dy * 0.55);
        ctx.strokeStyle = g;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.85 }} />;
}

export default SpaceCanvas;
