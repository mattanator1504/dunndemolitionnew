'use client';

import { useEffect, useRef, useState } from 'react';
import type { HeroSceneHandle } from './HeroScene';

// Decides whether and when the 3D wall loads (technical-seo.md §4):
// - never under reduced motion, Save-Data, no WebGL, small screens or low-power devices
// - otherwise on the first user interaction, or once the page has been idle a while
// The poster (the scene's first frame) is always rendered first, full-bleed under the canvas.
// Under html.js-pin the hero is a tall track with a sticky stage over the start of the page;
// this writes the scroll progress through that track to #hero as --p (and data-cleared once
// the copy has gone), whether or not the 3D has loaded yet, so the CSS can fade the poster
// and the hero copy on its own.

function canRun3D() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(location.search);
  if (params.has('poster')) return true;
  const force = params.has('3d'); // testing: skip the low-power checks
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (!matchMedia('(min-width: 1024px)').matches) return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  if (!force && (nav.hardwareConcurrency ?? 8) <= 4) return false;
  if (!force && nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

export function HeroSceneMount({ heroId }: { heroId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<HeroSceneHandle | undefined>(undefined);
  const progressRef = useRef(0);
  const [active, setActive] = useState(false);
  const [shown, setShown] = useState(false);

  // Step 1: wait for a reason to load.
  useEffect(() => {
    if (!canRun3D()) {
      // The boot script pinned the hero for a scene that can't run here (e.g. no WebGL2):
      // unpin, so the wall is a plain hero instead of screens of dead scroll.
      document.documentElement.classList.remove('js-pin');
      return;
    }
    if (new URLSearchParams(location.search).has('poster')) {
      setActive(true);
      return;
    }
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      cleanup();
      setActive(true);
    };
    const events = ['pointermove', 'pointerdown', 'wheel', 'scroll', 'keydown', 'touchstart'] as const;
    events.forEach((ev) => window.addEventListener(ev, go, { passive: true, once: true }));
    const idle = window.setTimeout(() => {
      if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 2000 });
      else go();
    }, 6000);
    function cleanup() {
      events.forEach((ev) => window.removeEventListener(ev, go));
      clearTimeout(idle);
    }
    return cleanup;
  }, []);

  // Scroll progress through the pinned track: 0 at rest, 1 when the stage lets go.
  useEffect(() => {
    const hero = document.getElementById(heroId);
    if (!hero) return;
    const header = document.querySelector('header');
    let raf = 0;
    const sync = () => {
      raf = 0;
      let p = 0;
      if (document.documentElement.classList.contains('js-pin')) {
        const r = hero.getBoundingClientRect();
        const headerH = header?.offsetHeight ?? 0;
        const travel = r.height - (innerHeight - headerH);
        if (travel > 0) p = Math.min(1, Math.max(0, (headerH - r.top) / travel));
      }
      progressRef.current = p;
      hero.style.setProperty('--p', p.toFixed(4));
      hero.toggleAttribute('data-cleared', p > 0.33);
      handleRef.current?.setProgress(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };
    sync();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [heroId]);

  // Step 2: load three.js and run the scene.
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    let disposed = false;
    let ro: ResizeObserver | undefined;
    const poster = new URLSearchParams(location.search).has('poster');
    const hero = document.getElementById(heroId);
    const canvas = canvasRef.current;

    const onPointer = (e: PointerEvent) => {
      handleRef.current?.setPointer((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
    };
    const onResize = () => handleRef.current?.resize();
    const onVisibility = () => handleRef.current?.setRunning(!document.hidden);

    import('./HeroScene').then(({ createHeroScene, POSTER_FRAME }) => {
      if (disposed || !canvasRef.current) return;
      const handle = createHeroScene(canvas, { poster });
      handleRef.current = handle;
      if (poster) {
        handle.renderOnce();
        Object.assign(window, { __heroScene: handle, __posterFrame: POSTER_FRAME, __posterReady: true });
        return;
      }
      handle.setProgress(progressRef.current);
      handle.renderOnce();
      requestAnimationFrame(() => {
        setShown(true);
        // Hide the poster once the live canvas has faded in over it.
        window.setTimeout(() => hero?.setAttribute('data-scene', 'live'), 700);
      });
      handle.setRunning(!document.hidden);
      window.addEventListener('pointermove', onPointer, { passive: true });
      ro = new ResizeObserver(onResize);
      ro.observe(canvas);
      document.addEventListener('visibilitychange', onVisibility);
    });

    return () => {
      disposed = true;
      window.removeEventListener('pointermove', onPointer);
      ro?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      handleRef.current?.dispose();
      handleRef.current = undefined;
      hero?.removeAttribute('data-scene');
    };
  }, [active, heroId]);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {active && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-700"
          style={{ opacity: shown || (typeof location !== 'undefined' && location.search.includes('poster')) ? 1 : 0 }}
        />
      )}
    </div>
  );
}
