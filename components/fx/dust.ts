// Dust bursts: call dust(x, y) from anywhere (viewport px). DustFX (mounted once in the
// layout) draws them; before it mounts, or under reduced motion, this does nothing.
export type BurstOptions = {
  /** 0.3 = a puff, 1 = an impact, 2 = a big hit. */
  power?: number;
  /** Debris chunks thrown out with the dust. */
  chunks?: number;
  /** Bias the throw: -1 left, 0 straight up, 1 right. */
  lean?: number;
  /** A shockwave ring and a hot flash at the point of impact: the "blast" look. */
  blast?: boolean;
};

export function dust(x: number, y: number, opts: BurstOptions = {}) {
  (window as unknown as { __dust?: { burst: (x: number, y: number, o: BurstOptions) => void } }).__dust?.burst(x, y, opts);
}

/** A row of bursts along a line (e.g. the bottom edge of something that just came down), with a blast in the middle. */
export function dustLine(x0: number, x1: number, y: number, power = 1) {
  const n = Math.max(2, Math.round((x1 - x0) / 200));
  for (let i = 0; i < n; i++) dust(x0 + ((x1 - x0) * (i + 0.5)) / n, y, { power, chunks: Math.round(4 + power * 4), lean: (i / (n - 1 || 1) - 0.5) * 1.2 });
  dust((x0 + x1) / 2, y, { power: power * 1.3, chunks: 0, blast: true });
}

/** Shake the page for a moment, like a heavy hit nearby. Motion allowed only. */
export function quake(strength: 'light' | 'heavy' = 'light') {
  const root = document.documentElement;
  if (!root.classList.contains('js-motion')) return;
  root.classList.remove('quake', 'quake-heavy');
  void root.offsetWidth; // restart the animation
  root.classList.add(strength === 'heavy' ? 'quake-heavy' : 'quake');
  window.setTimeout(() => root.classList.remove('quake', 'quake-heavy'), 600);
}
