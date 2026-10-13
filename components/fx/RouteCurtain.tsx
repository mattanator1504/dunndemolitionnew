'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { dustLine, quake } from './dust';

// Page transitions: on an internal link, a wall of eight slabs drops in from above, the
// route changes behind it, then the wall collapses (bottom-up, tumbling) to reveal the new
// page with a blast of dust along the bottom and a shake. Skipped under reduced motion,
// for new-tab clicks and hash links. The very first load gets no wall (the headline must
// paint first), just the blast along the bottom of the page header once the page has loaded.
const SLABS = 8;

export function RouteCurtain() {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const pending = useRef(false);

  // First load: once everything has painted, set the page header down with a thump.
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let t = 0;
    const go = () => {
      t = window.setTimeout(() => {
        if (scrollY > innerHeight * 0.5) return;
        const head = document.querySelector('#hero .hero-stage') ?? document.querySelector('main > section');
        const r = head?.getBoundingClientRect();
        const y = r ? Math.min(innerHeight - 10, r.bottom - 6) : innerHeight - 10;
        if (y < innerHeight * 0.3) return;
        dustLine(0, innerWidth, y, 1.4);
        quake('heavy');
      }, 250);
    };
    if (document.readyState === 'complete') go();
    else addEventListener('load', go, { once: true });
    return () => {
      removeEventListener('load', go);
      clearTimeout(t);
    };
  }, []);

  // Cover, then navigate.
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest?.('a');
      if (!a || a.target || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return; // same page (incl. #anchors)
      const el = ref.current;
      if (!el) return;
      e.preventDefault();
      pending.current = true;
      el.dataset.state = 'cover';
      window.setTimeout(() => router.push(url.pathname + url.search + url.hash), 420);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [router]);

  // New page in: collapse the wall.
  useEffect(() => {
    const el = ref.current;
    if (!el || !pending.current) return;
    pending.current = false;
    const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, o: { immediate: boolean }) => void } }).__lenis;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      el.dataset.state = 'fall';
      window.setTimeout(() => {
        dustLine(0, innerWidth, innerHeight - 8, 1.5);
        quake('heavy');
      }, 360);
      window.setTimeout(() => {
        el.dataset.state = '';
      }, 1100);
    });
  }, [pathname]);

  return (
    <div ref={ref} aria-hidden="true" data-state="" className="curtain pointer-events-none fixed inset-0 z-[60] flex">
      {Array.from({ length: SLABS }, (_, i) => (
        <i key={i} style={{ '--si': i, '--sr': `${((i * 53) % 9) - 4}deg` } as React.CSSProperties} />
      ))}
    </div>
  );
}
