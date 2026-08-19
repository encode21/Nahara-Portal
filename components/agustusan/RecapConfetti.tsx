"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  color: string;
};

const COLORS = ["#c9a84c", "#f0d78c", "#ffffff", "#e11d48", "#fecaca", "#fbbf24", "#7a1218"];

function spawn(width: number): Particle {
  return {
    x: Math.random() * width,
    y: -20 - Math.random() * 80,
    vx: (Math.random() - 0.5) * 0.8,
    vy: 1.1 + Math.random() * 1.8,
    w: 5 + Math.random() * 7,
    h: 7 + Math.random() * 10,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.12,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

/** Confetti jatuh pelan di hero kenangan. */
export function RecapConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const count = Math.min(90, Math.max(48, Math.floor(canvas.width / 14)));
    const particles: Particle[] = Array.from({ length: count }, () => {
      const p = spawn(canvas.width);
      p.y = Math.random() * canvas.height;
      return p;
    });

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > canvas.height + 20) {
          const next = spawn(canvas.width);
          p.x = next.x;
          p.y = next.y;
          p.vx = next.vx;
          p.vy = next.vy;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      aria-hidden
    />
  );
}
