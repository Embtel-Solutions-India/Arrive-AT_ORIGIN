import { useEffect, useRef } from "react";

function HeroCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let w, h, dpr;
    let points = [];
    let rafId = null;

    function seed() {
      points = [];
      const n = Math.min(180, Math.round(window.innerWidth / 8));
      for (let i = 0; i < n; i++) {
        points.push({
          a: Math.random() * Math.PI * 2,
          r: 80 + Math.random() * 460,
          s: 0.0002 + Math.random() * 0.0006,
          z: 0.4 + Math.random() * 0.8,
        });
      }
    }

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now) {
      const e = now - t0;
      ctx.clearRect(0, 0, w, h);
      let cx = w * 0.74;
      let cy = h * 0.46;
      if (w < 780) {
        cx = w * 0.78;
        cy = h * 0.24;
      }

      for (let k = 1; k <= 7; k++) {
        const base = k * 74;
        const breathe = reduce ? 0 : Math.sin(e * 0.0006 + k * 0.7) * 7;
        ctx.beginPath();
        ctx.arc(cx, cy, base + breathe, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(201,153,46,${0.2 - k * 0.021})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (!reduce) p.a += p.s;
        const x = cx + Math.cos(p.a) * p.r;
        const y = cy + Math.sin(p.a) * p.r * 0.62;
        ctx.beginPath();
        ctx.arc(x, y, p.z, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,206,140,${0.1 + p.z * 0.24})`;
        ctx.fill();
      }

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
      g.addColorStop(0, "rgba(232,206,140,.85)");
      g.addColorStop(1, "rgba(232,206,140,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fill();

      if (!reduce) rafId = requestAnimationFrame(draw);
    }

    function handleResize() {
      size();
      seed();
      if (reduce) draw(performance.now());
    }

    size();
    seed();
    rafId = requestAnimationFrame(draw);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 z-0 h-full w-full"
    />
  );
}

export default HeroCanvas;
