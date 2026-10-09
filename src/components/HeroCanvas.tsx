'use client';

import { useEffect, useRef } from 'react';

/**
 * Animated background for the hero: a reactive equaliser skyline plus drifting
 * particles that lean toward the pointer. Pure canvas — no dependencies.
 */
export default function HeroCanvas({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const BARS = 88;
    const barVals = new Float32Array(BARS);
    const barTargets = new Float32Array(BARS);

    type Dot = { x: number; y: number; vx: number; vy: number; r: number; a: number };
    let dots: Dot[] = [];

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = Array.from({ length: Math.min(46, Math.floor(w / 22)) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.7 + 0.5,
        a: Math.random() * 0.45 + 0.12,
      }));
    }

    function onMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.tx = (e.clientX - rect.left) / rect.width;
      pointer.ty = (e.clientY - rect.top) / rect.height;
    }

    function draw() {
      t += 0.016;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      ctx!.clearRect(0, 0, w, h);

      // ---- drifting particles ----
      for (const d of dots) {
        d.x += d.vx + (pointer.x - 0.5) * 0.35;
        d.y += d.vy + (pointer.y - 0.5) * 0.35;
        if (d.x < 0) d.x = w;
        if (d.x > w) d.x = 0;
        if (d.y < 0) d.y = h;
        if (d.y > h) d.y = 0;

        const g = ctx!.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 7);
        g.addColorStop(0, `rgba(255,80,90,${d.a})`);
        g.addColorStop(1, 'rgba(255,45,58,0)');
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, d.r * 7, 0, Math.PI * 2);
        ctx!.fill();
      }

      // ---- equaliser skyline ----
      const gap = 3;
      const bw = Math.max(2, w / BARS - gap);
      const base = h * 0.86;

      for (let i = 0; i < BARS; i++) {
        const p = i / BARS;
        // pseudo-audio signal: stacked sines + beat pulse + pointer lift
        const beat = Math.pow(Math.max(0, Math.sin(t * 2.1 - p * 3.4)), 6) * 0.55;
        const wave =
          Math.sin(t * 1.5 + p * 9) * 0.22 +
          Math.sin(t * 0.9 - p * 17) * 0.16 +
          Math.sin(t * 3.1 + p * 27) * 0.08;
        const near = 1 - Math.min(1, Math.abs(p - pointer.x) * 4.2);
        const hover = near * 0.42;

        barTargets[i] = Math.max(0.04, 0.16 + Math.abs(wave) * 0.9 + beat + hover);
        barVals[i] += (barTargets[i] - barVals[i]) * 0.14;

        const bh = Math.min(h * 0.62, barVals[i] * h * 0.5);
        const x = i * (bw + gap);
        const y = base - bh;

        const grad = ctx!.createLinearGradient(x, y, x, base);
        grad.addColorStop(0, `rgba(255,110,120,${0.55 + barVals[i] * 0.45})`);
        grad.addColorStop(0.45, `rgba(255,45,58,${0.42 + barVals[i] * 0.4})`);
        grad.addColorStop(1, 'rgba(143,16,32,0.05)');
        ctx!.fillStyle = grad;
        roundRect(ctx!, x, y, bw, bh, Math.min(bw / 2, 3));
        ctx!.fill();

        // mirrrored reflection
        const rg = ctx!.createLinearGradient(x, base + 2, x, base + bh * 0.42);
        rg.addColorStop(0, `rgba(255,45,58,${0.2 * barVals[i]})`);
        rg.addColorStop(1, 'rgba(255,45,58,0)');
        ctx!.fillStyle = rg;
        roundRect(ctx!, x, base + 2, bw, bh * 0.42, Math.min(bw / 2, 3));
        ctx!.fill();
      }

      // ---- horizon line ----
      const lg = ctx!.createLinearGradient(0, 0, w, 0);
      lg.addColorStop(0, 'rgba(255,45,58,0)');
      lg.addColorStop(0.5, 'rgba(255,45,58,.75)');
      lg.addColorStop(1, 'rgba(255,45,58,0)');
      ctx!.fillStyle = lg;
      ctx!.fillRect(0, base, w, 1.2);

      raf = requestAnimationFrame(draw);
    }

    function roundRect(
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      r: number,
    ) {
      const rr = Math.min(r, width / 2, height / 2);
      c.beginPath();
      c.moveTo(x + rr, y);
      c.lineTo(x + width - rr, y);
      c.quadraticCurveTo(x + width, y, x + width, y + rr);
      c.lineTo(x + width, y + height);
      c.lineTo(x, y + height);
      c.lineTo(x, y + rr);
      c.quadraticCurveTo(x, y, x + rr, y);
      c.closePath();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(draw);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) cancelAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
