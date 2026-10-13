'use client';

import { useEffect, useRef } from 'react';
import type { BurstOptions } from './dust';

// One fixed, click-through canvas for every dust burst on the site: concrete-dust clouds
// that billow, hang and fade (a light and a dark tone, so they read on ink and on paper),
// chunks of debris thrown out under gravity, and for blasts a shockwave ring and a flash.
// It sits under the sticky header, only animates while particles are alive, and stays
// empty under reduced motion.
// kind: 0 dust, 1 chunk, 2 shockwave ring, 3 flash
type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; spin: number; a: number; kind: 0 | 1 | 2 | 3; tone: number };

const MAX = 1600;

export function DustFX() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = innerWidth;
      h = innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();
    addEventListener('resize', resize);

    // Soft round sprites for the dust, drawn once: pale concrete and a darker grit.
    const makeSprite = (stops: [number, string][]) => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d')!;
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      for (const [o, col] of stops) grad.addColorStop(o, col);
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      return c;
    };
    const light = makeSprite([
      [0, 'rgba(222,216,204,0.7)'],
      [0.5, 'rgba(196,190,178,0.3)'],
      [1, 'rgba(170,164,152,0)'],
    ]);
    const dark = makeSprite([
      [0, 'rgba(120,112,102,0.6)'],
      [0.5, 'rgba(110,104,94,0.25)'],
      [1, 'rgba(100,94,86,0)'],
    ]);
    const flash = makeSprite([
      [0, 'rgba(255,236,190,0.95)'],
      [0.35, 'rgba(255,184,0,0.45)'],
      [1, 'rgba(255,184,0,0)'],
    ]);

    const ps: P[] = [];
    let raf = 0;
    let last = 0;
    let lastScroll = scrollY;

    const burst = (x: number, y: number, o: BurstOptions = {}) => {
      // Phones get a bigger hit: the screen is small, so the same burst reads as a puff.
      const power = (o.power ?? 1) * (w < 768 ? 1.4 : 1);
      const lean = o.lean ?? 0;
      const nDust = Math.round(18 + power * 30);
      const nChunks = o.chunks ?? Math.round(power * 12);
      if (o.blast) {
        ps.push({ x, y, vx: 0, vy: 0, life: 0.28, max: 0.28, size: 200 * power, spin: 0, a: 0, kind: 3, tone: 0 });
        ps.push({ x, y, vx: 0, vy: 0, life: 0.6, max: 0.6, size: 170 * power, spin: 0, a: 0, kind: 2, tone: 0 });
        ps.push({ x, y, vx: 0, vy: 0, life: 0.85, max: 0.85, size: 280 * power, spin: 0, a: 0, kind: 2, tone: 1 });
      }
      for (let i = 0; i < nDust && ps.length < MAX; i++) {
        const ang = -Math.PI / 2 + lean * 0.6 + (Math.random() - 0.5) * Math.PI * (o.blast ? 2 : 1.4);
        const sp = (50 + Math.random() * 220) * power;
        const max = 0.6 + Math.random() * 0.6 * Math.min(1.4, power); // a hit, not a fog: gone in a second or so
        ps.push({ x: x + (Math.random() - 0.5) * 70 * power, y: y + (Math.random() - 0.5) * 16, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp * 0.6, life: max, max, size: (14 + Math.random() * 26) * (0.6 + power * 0.55), spin: 0, a: 0, kind: 0, tone: Math.random() });
      }
      for (let i = 0; i < nChunks && ps.length < MAX; i++) {
        const ang = -Math.PI / 2 + lean * 0.7 + (Math.random() - 0.5) * Math.PI * 1.1;
        const sp = (160 + Math.random() * 380) * Math.sqrt(power);
        const max = 0.84 + Math.random() * 0.48;
        ps.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: max, max, size: 2 + Math.random() * 5 * Math.min(1.5, power), spin: (Math.random() - 0.5) * 18, a: Math.random() * 6, kind: 1, tone: Math.random() });
      }
      if (!raf) {
        last = performance.now();
        lastScroll = scrollY;
        raf = requestAnimationFrame(tick);
      }
    };

    const tick = (now: number) => {
      // rAF timestamps can trail the performance.now() a burst started from: never step back.
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      const scrolled = scrollY - lastScroll;
      lastScroll = scrollY;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        // Dust is anchored to the page, so it scrolls away with whatever it came off,
        // and it clears five times as fast while you're scrolling.
        p.y -= scrolled;
        p.life -= scrolled ? dt * 5 : dt;
        if (p.life <= 0 || p.y > h + 60 || p.y < -160) {
          ps.splice(i, 1);
          continue;
        }
        const k = p.life / p.max; // 1 → 0
        if (p.kind === 0) {
          // Dust: drags to a stop, drifts up a touch, billows out and fades.
          p.vx *= 1 - dt * 3.2;
          p.vy = p.vy * (1 - dt * 3.2) - 14 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          const s = p.size * (1 + (1 - k) * 3);
          ctx.globalAlpha = Math.pow(k, 1.4) * 0.95; // thick at the hit, thinning from the start
          ctx.drawImage(p.tone < 0.4 ? dark : light, p.x - s / 2, p.y - s / 2, s, s);
        } else if (p.kind === 2) {
          // Shockwave: a ring that races out and thins as it goes.
          const t = 1 - k;
          const r = p.size * (1 - (1 - t) * (1 - t));
          ctx.globalAlpha = k * (p.tone ? 0.3 : 0.45);
          ctx.strokeStyle = p.tone ? 'rgba(200,194,182,1)' : 'rgba(232,222,200,1)';
          ctx.lineWidth = Math.max(1, (p.tone ? 10 : 6) * k);
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, r, r * 0.55, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.kind === 3) {
          // Flash: hot, brief, swells as it fades.
          const s = p.size * (0.6 + (1 - k) * 0.8);
          ctx.globalAlpha = k * k;
          ctx.drawImage(flash, p.x - s / 2, p.y - s / 2, s, s);
        } else {
          // Chunks: ballistic, spinning.
          p.vy += 1500 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.a += p.spin * dt;
          ctx.globalAlpha = Math.min(1, k * 2.5);
          ctx.fillStyle = p.tone > 0.93 ? '#ffb800' : `hsl(40 6% ${38 + p.tone * 34}%)`;
          ctx.setTransform(dpr * Math.cos(p.a), dpr * Math.sin(p.a), -dpr * Math.sin(p.a), dpr * Math.cos(p.a), dpr * p.x, dpr * p.y);
          ctx.fillRect(-p.size / 2, -p.size * 0.35, p.size, p.size * 0.7);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
      }
      ctx.globalAlpha = 1;
      raf = ps.length ? requestAnimationFrame(tick) : 0;
      if (!raf) ctx.clearRect(0, 0, w, h);
    };

    (window as unknown as { __dust?: { burst: typeof burst } }).__dust = { burst };
    return () => {
      removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
      delete (window as unknown as { __dust?: unknown }).__dust;
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 h-full w-full" />;
}
