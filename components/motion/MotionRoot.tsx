'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { dust, dustLine } from '@/components/fx/dust';

// Wires up the page's motion once per route:
// - [data-reveal]: "set-down" reveal when scrolled into view (CSS does the animation)
// - [data-countup]: numbers count up once, from the value already in the HTML
// - [data-parallax]: photos drift slightly inside their frame (transform only)
// - [data-words]: a paragraph's words light up one by one as it crosses the screen
// - [data-marquee]: rows slide sideways, faster while you scroll, turning with direction
// - [data-scramble]: a price shuffles through digits before settling (once, in view)
// - [data-reveal="blocks"]: a photo is covered by a grid of blocks that tumble away, with dust
// - main buttons kick up a little dust where they're pressed
// - Lenis smooth scroll on desktop mice only
// Nothing here runs under prefers-reduced-motion; the HTML already shows final states.

export function MotionRoot() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('motion-ready');
    if (!root.classList.contains('js-motion')) return;

    // Block reveals: lay a grid of blocks (in the surface's own colour) over each photo.
    const blockEls = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal="blocks"]:not(.is-in)'));
    blockEls.forEach((el) => {
      if (el.querySelector(':scope > .blocks')) return;
      let bg = 'rgb(18, 18, 17)';
      for (let a: HTMLElement | null = el.parentElement; a; a = a.parentElement) {
        const c = getComputedStyle(a).backgroundColor;
        if (c && c !== 'transparent' && !c.endsWith(', 0)')) {
          bg = c;
          break;
        }
      }
      const g = document.createElement('div');
      g.className = 'blocks';
      g.setAttribute('aria-hidden', 'true');
      g.style.setProperty('--block-bg', bg);
      for (let i = 0; i < 24; i++) {
        const b = document.createElement('i');
        const row = Math.floor(i / 6);
        b.style.setProperty('--bd', `${Math.round((3 - row) * 60 + Math.random() * 160)}ms`);
        b.style.setProperty('--bx', `${Math.round((Math.random() - 0.5) * 60)}%`);
        b.style.setProperty('--br', `${Math.round((Math.random() - 0.5) * 70)}deg`);
        g.appendChild(b);
      }
      el.appendChild(g);
    });
    const collapse = (el: HTMLElement) => {
      const g = el.querySelector<HTMLElement>(':scope > .blocks');
      if (!g) return;
      requestAnimationFrame(() => g.classList.add('go'));
      window.setTimeout(() => {
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight) dustLine(r.left, r.right, Math.min(r.bottom, innerHeight - 10), 1.1);
      }, 420);
      window.setTimeout(() => g.remove(), 1500);
    };

    const reveals = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)'));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
          if ((e.target as HTMLElement).dataset.reveal === 'blocks') collapse(e.target as HTMLElement);
          if (e.target instanceof HTMLElement && e.target.dataset.countup !== undefined) countUp(e.target);
          e.target.querySelectorAll<HTMLElement>('[data-countup]').forEach(countUp);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    reveals.forEach((el) => io.observe(el));

    // Scramble: prices shuffle into place the first time they come into view.
    const scrambles = Array.from(document.querySelectorAll<HTMLElement>('[data-scramble]'));
    const sio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          sio.unobserve(e.target);
          scramble(e.target as HTMLElement, scrambles.indexOf(e.target as HTMLElement) * 90);
        });
      },
      { threshold: 0.6 },
    );
    scrambles.forEach((el) => sio.observe(el));

    // Marquee: time-driven drift plus a kick from scroll velocity, wrapped at one copy's width.
    const marquees = Array.from(document.querySelectorAll<HTMLElement>('[data-marquee]')).map((el) => ({ el, x: 0, dir: Number(el.dataset.marquee) || 1 }));
    let mRaf = 0;
    let lastY = scrollY;
    let vel = 0;
    let sign = 1;
    let mVisible = false;
    const mLoop = () => {
      const dy = scrollY - lastY;
      lastY = scrollY;
      if (dy) sign = dy > 0 ? 1 : -1;
      vel += (Math.abs(dy) - vel) * 0.1;
      for (const m of marquees) {
        const unit = (m.el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
        if (!unit) continue;
        m.x -= (0.6 + vel * 0.35) * m.dir * sign;
        m.x = ((m.x % unit) + unit) % unit;
        m.el.style.transform = `translate3d(${(-m.x).toFixed(1)}px, 0, 0)`;
      }
      mRaf = mVisible ? requestAnimationFrame(mLoop) : 0;
    };
    const mio = new IntersectionObserver((entries) => {
      mVisible = entries.some((e) => e.isIntersecting);
      if (mVisible && !mRaf) mRaf = requestAnimationFrame(mLoop);
    });
    marquees.forEach((m) => mio.observe(m.el));

    // Scroll-lit words: each word's --lit runs 0 → 1 in reading order across the paragraph's pass.
    const wordBlocks = Array.from(document.querySelectorAll<HTMLElement>('[data-words]')).map((el) => ({
      el,
      words: Array.from(el.querySelectorAll<HTMLElement>('.w')),
      last: -1,
    }));

    // Parallax: move each photo up to ±6% of its frame height as it crosses the viewport.
    const photos = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    const drifts = Array.from(document.querySelectorAll<HTMLElement>('[data-drift]'));
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const vh = innerHeight;
        for (const img of photos) {
          const frame = img.parentElement!.getBoundingClientRect();
          if (frame.bottom < 0 || frame.top > vh) continue;
          const t = (frame.top + frame.height / 2 - vh / 2) / (vh / 2 + frame.height / 2); // -1..1
          img.style.transform = `translate3d(0, ${(-t * frame.height * 0.06).toFixed(1)}px, 0) scale(1.14)`;
        }
        // Filmstrip rows: slide sideways (opposite directions) as the band crosses the viewport.
        for (const row of drifts) {
          const r = row.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) continue;
          const t = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1..1
          row.style.transform = `translate3d(${(t * Number(row.dataset.drift) * Math.min(innerWidth * 0.18, 260)).toFixed(1)}px, 0, 0)`;
        }
        for (const b of wordBlocks) {
          const r = b.el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) continue;
          const p = Math.min(1, Math.max(0, (vh * 0.88 - r.top) / (r.height + vh * 0.32)));
          if (Math.abs(p - b.last) < 0.004) continue;
          b.last = p;
          const n = b.words.length;
          b.words.forEach((w, i) => w.style.setProperty('--lit', Math.min(1, Math.max(0, p * (n + 1) - i)).toFixed(2)));
        }
      });
    };
    if (photos.length || drifts.length || wordBlocks.length) {
      onScroll();
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll);
    }

    return () => {
      io.disconnect();
      sio.disconnect();
      mio.disconnect();
      cancelAnimationFrame(mRaf);
      cancelAnimationFrame(raf);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
    };
  }, [pathname]);

  // Main buttons kick up a little dust where they're pressed (keyboard: from the button's centre).
  useEffect(() => {
    if (!document.documentElement.classList.contains('js-motion')) return;
    const onClick = (e: MouseEvent) => {
      const b = (e.target as HTMLElement).closest?.('.btn-primary, .btn-ink');
      if (!b) return;
      const r = b.getBoundingClientRect();
      const x = e.clientX || r.left + r.width / 2;
      const y = e.clientY || r.top + r.height / 2;
      dust(x, y, { power: 0.55, chunks: 6 });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Smooth scroll: desktop with a fine pointer, no reduced motion. Loaded lazily.
  useEffect(() => {
    if (!document.documentElement.classList.contains('js-motion')) return;
    if (!matchMedia('(pointer: fine) and (min-width: 1024px)').matches) return;
    let lenis: { destroy: () => void; raf: (t: number) => void } | undefined;
    let raf = 0;
    let cancelled = false;
    const start = () =>
      import('lenis').then(({ default: Lenis }) => {
        if (cancelled) return;
        const l = new Lenis({ lerp: 0.12, wheelMultiplier: 1 });
        lenis = l;
        (window as unknown as { __lenis: unknown }).__lenis = l;
        const loop = (t: number) => {
          l.raf(t);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      });
    addEventListener('wheel', start, { once: true, passive: true });
    return () => {
      cancelled = true;
      removeEventListener('wheel', start);
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);

  return null;
}

function countUp(el: HTMLElement) {
  if (el.dataset.counted) return;
  el.dataset.counted = '1';
  const target = Number(el.dataset.countup);
  if (!Number.isFinite(target)) return;
  const original = el.textContent ?? '';
  const duration = 1100;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = original;
  };
  el.textContent = '0';
  requestAnimationFrame(step);
}

// Shuffle a short string (a price) through random digits, settling left to right.
function scramble(el: HTMLElement, delay: number) {
  const final = el.textContent ?? '';
  const pool = '0123456789';
  const duration = 700;
  let start = 0;
  const step = (now: number) => {
    if (!start) start = now + delay;
    const t = Math.min(1, Math.max(0, (now - start) / duration));
    const settled = Math.floor(t * final.length);
    el.textContent = final
      .split('')
      .map((ch, i) => (i < settled || !/[0-9]/.test(ch) ? ch : pool[Math.floor(Math.random() * 10)]))
      .join('');
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = final;
  };
  requestAnimationFrame(step);
}
