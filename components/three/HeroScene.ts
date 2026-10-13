// The home page's 3D: a full-bleed brick wall that the hero sits on. Scrolling through
// the pinned hero knocks it out, starting from one strike point right of center, and the
// page behind shows through the hole as it spreads to the edges.
// The hero's scroll progress (0..1):
//   0.00-0.04  the wall stands
//   0.03-0.43  bricks loosen just ahead of the break, then let go (nearest the strike first),
//              blow out toward the camera, tumble and drop out of frame; mortar crumbles to dust
//   0.43-0.95  the last bricks keep falling, slowly; by 0.95 the canvas is empty
// Everything is a function of progress, so scrolling back up rebuilds the wall.
// The wall is laid out like CSS object-fit: cover over a 1920x1080 reference frame, so the
// static poster (rendered from this scene at that size) lines up with the live first frame.
// Plain three.js to stay inside the 3D budget in technical-seo.md §4.
// Loaded only through HeroSceneMount, never in the initial bundle.
import {
  ACESFilmicToneMapping,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  Euler,
  HemisphereLight,
  InstancedMesh,
  MathUtils,
  Matrix4,
  MeshStandardMaterial,
  NormalBlending,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Quaternion,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/** The reference frame the poster is rendered at. */
export const POSTER_FRAME = { width: 1920, height: 1080 };
const COURSES = 18; // brick courses visible across the reference frame's height

// World units: one course (brick + bed joint) is 1 high. US modular proportions:
// a 3-course module is as tall as a brick-and-joint is long.
const COURSE = 1;
const MODULE = 3;
const JOINT = 0.13;
const DEPTH = 1.25;
const FOV = 30;
const MAX_BRICKS = 1200;
const DUST = 520;

const BRICK_TONES = ['#7a3a29', '#713526', '#84422e', '#6a3224', '#7d4430', '#663328', '#8a4a34', '#5c2f25'].map((c) => new Color(c));

export type HeroSceneHandle = {
  /** Demolition progress, 0..1. */
  setProgress: (p: number) => void;
  /** Pointer in -1..1 (screen), for a little parallax. */
  setPointer: (x: number, y: number) => void;
  setRunning: (on: boolean) => void;
  renderOnce: () => void;
  resize: () => void;
  dispose: () => void;
};

// Hash two ints to 0..1, so every brick's behavior is fixed by where it sits in the wall.
function hash(a: number, b: number, k: number) {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(k | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function smoothstep(a: number, b: number, x: number) {
  const t = MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

// Fired-clay face: pale base (instance color tints it), speckle, pits and a little
// soot toward the edges. Also used as the bump map.
function brickTexture() {
  const w = 256;
  const h = 96;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  let s = 1974;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = '#d8d2cb';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 3800; i++) {
    const v = 150 + Math.floor(r() * 105);
    ctx.fillStyle = `rgba(${v},${v - 8},${v - 14},${0.3 + r() * 0.4})`;
    const d = r() * 1.8 + 0.4;
    ctx.fillRect(r() * w, r() * h, d, d);
  }
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(40,30,26,${0.25 + r() * 0.4})`;
    ctx.beginPath();
    ctx.arc(r() * w, r() * h, r() * 1.8 + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(30,22,18,0.22)');
  g.addColorStop(0.18, 'rgba(30,22,18,0)');
  g.addColorStop(0.82, 'rgba(30,22,18,0)');
  g.addColorStop(1, 'rgba(30,22,18,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  return tex;
}

function dustSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.28)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

export function createHeroScene(canvas: HTMLCanvasElement, opts: { poster?: boolean } = {}): HeroSceneHandle {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.poster });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.5, 400);

  // Raking light from the upper left picks out every course; a cool fill keeps the shadows readable.
  scene.add(new HemisphereLight(0xe9e4dc, 0x1a1512, 0.75));
  const key = new DirectionalLight(0xffe6c8, 3.1);
  key.position.set(-9, 7, 6);
  scene.add(key);
  const fill = new DirectionalLight(0xc9d6e6, 0.55);
  fill.position.set(8, -2, 7);
  scene.add(fill);

  const tex = brickTexture();
  const brickMat = new MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 2.2, roughness: 0.92, metalness: 0 });
  const brickGeo = new RoundedBoxGeometry(MODULE - JOINT, COURSE - JOINT, DEPTH, 2, 0.07);
  const bricks = new InstancedMesh(brickGeo, brickMat, MAX_BRICKS);
  bricks.instanceMatrix.setUsage(DynamicDrawUsage);
  bricks.frustumCulled = false;
  scene.add(bricks);

  // Each brick carries its own bed of mortar behind it: the wall has no backing, so where
  // a brick and its mortar have gone the canvas is clear and the page shows through.
  const mortarMat = new MeshStandardMaterial({ color: 0x8c857b, roughness: 1, metalness: 0 });
  const mortarGeo = new BoxGeometry(MODULE + 0.002, COURSE + 0.002, DEPTH * 0.5);
  const mortar = new InstancedMesh(mortarGeo, mortarMat, MAX_BRICKS);
  mortar.instanceMatrix.setUsage(DynamicDrawUsage);
  mortar.frustumCulled = false;
  scene.add(mortar);

  // Dust: one Points draw call, puffs that hang where bricks let go, then thin out.
  const dustPos = new Float32Array(DUST * 3);
  const dustCol = new Float32Array(DUST * 4);
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute('position', new BufferAttribute(dustPos, 3).setUsage(DynamicDrawUsage));
  dustGeo.setAttribute('color', new BufferAttribute(dustCol, 4).setUsage(DynamicDrawUsage));
  const dustMat = new PointsMaterial({ map: dustSprite(), size: 2.6, transparent: true, depthWrite: false, vertexColors: true, blending: NormalBlending });
  const dust = new Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  scene.add(dust);

  // Per-brick data, rebuilt whenever the frame changes size.
  let count = 0;
  const bx = new Float32Array(MAX_BRICKS);
  const by = new Float32Array(MAX_BRICKS);
  const t0 = new Float32Array(MAX_BRICKS); // progress at which it lets go
  const vel = new Float32Array(MAX_BRICKS * 3);
  const spin = new Float32Array(MAX_BRICKS * 3);
  const wob = new Float32Array(MAX_BRICKS * 2); // resting imperfection
  const dustSeed = new Float32Array(DUST * 6); // brick, ox, oy, vx, vy, size

  let visW = 1; // visible wall, in courses
  let visH = 1;
  let camDist = 30;

  const m = new Matrix4();
  const m2 = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const pos = new Vector3();
  const scl = new Vector3(1, 1, 1);
  const offset = new Matrix4().makeTranslation(0, 0, -DEPTH * 0.5);
  const col = new Color();

  function layout() {
    const Wpx = Math.max(1, canvas.clientWidth);
    const Hpx = Math.max(1, canvas.clientHeight);
    // object-fit: cover against the reference frame, scaled about the center.
    const s = Math.max(Wpx / POSTER_FRAME.width, Hpx / POSTER_FRAME.height);
    const coursePx = (POSTER_FRAME.height / COURSES) * s;
    visH = Hpx / coursePx;
    visW = Wpx / coursePx;
    camDist = visH / 2 / Math.tan(MathUtils.degToRad(FOV / 2));
    camera.aspect = Wpx / Hpx;
    camera.updateProjectionMatrix();

    // Strike point: right of center, a little above the middle.
    const ix = visW * 0.17;
    const iy = visH * 0.04;
    const far = Math.hypot(visW / 2 + Math.abs(ix) + MODULE, visH / 2 + Math.abs(iy) + 1);

    const rows = Math.ceil(visH / 2) + 2;
    const cols = Math.ceil(visW / 2 / MODULE) + 2;
    count = 0;
    for (let r = -rows; r <= rows; r++) {
      const shift = (r & 1) * (MODULE / 2);
      for (let c = -cols; c <= cols && count < MAX_BRICKS; c++) {
        const i = count++;
        const x = c * MODULE + shift;
        const y = r * COURSE;
        bx[i] = x;
        by[i] = y;
        const h1 = hash(r, c, 1);
        const h2 = hash(r, c, 2);
        const h3 = hash(r, c, 3);
        const dx = x - ix;
        const dy = y - iy;
        const d = Math.hypot(dx, dy);
        const dn = Math.min(1, d / far);
        t0[i] = 0.04 + 0.36 * Math.pow(dn, 1.05) + (h1 - 0.5) * 0.06;
        // Near the strike: blown out hard toward the camera. Toward the edges: they mostly drop.
        const kick = (1 - dn) * (1 - dn);
        const out = 1.5 + kick * 9;
        const ux = d > 0.01 ? dx / d : 0;
        const uy = d > 0.01 ? dy / d : 0;
        vel[i * 3] = ux * out * (0.7 + h2 * 0.6);
        vel[i * 3 + 1] = uy * out * (0.6 + h3 * 0.6) + 2 + kick * 5;
        vel[i * 3 + 2] = 2 + kick * 16 * (0.6 + h2 * 0.7);
        spin[i * 3] = (h3 - 0.5) * 7;
        spin[i * 3 + 1] = (h1 - 0.5) * 6;
        spin[i * 3 + 2] = (h2 - 0.5) * 5 - ux * 2;
        wob[i * 2] = (h2 - 0.5) * 0.02;
        wob[i * 2 + 1] = (h3 - 0.5) * 0.035;

        // Tone, then shade: darker down the left and along the bottom, where the hero's
        // type sits. The shade is in the brick's color, so it leaves with the brick.
        const tone = BRICK_TONES[Math.floor(h1 * 7919) % BRICK_TONES.length];
        const sx = smoothstep(-visW * 0.5, visW * 0.25, x);
        const sy = smoothstep(-visH * 0.55, visH * 0.15, y);
        const shade = (0.3 + 0.7 * sx) * (0.55 + 0.45 * sy) * (0.92 + h3 * 0.16);
        col.copy(tone).multiplyScalar(shade);
        bricks.setColorAt(i, col);
        mortar.setColorAt(i, col.setScalar(shade));
      }
    }
    bricks.count = count;
    mortar.count = count;
    if (bricks.instanceColor) bricks.instanceColor.needsUpdate = true;
    if (mortar.instanceColor) mortar.instanceColor.needsUpdate = true;

    // Dust puffs ride along with the bricks nearest the strike more often.
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < DUST; k++) {
      let j = Math.floor(r() * count);
      if (r() < 0.55) {
        // Re-pick toward early bricks: more dust where the wall is hit hardest.
        const j2 = Math.floor(r() * count);
        if (t0[j2] < t0[j]) j = j2;
      }
      dustSeed[k * 6] = j;
      dustSeed[k * 6 + 1] = (r() - 0.5) * MODULE;
      dustSeed[k * 6 + 2] = (r() - 0.5) * COURSE;
      dustSeed[k * 6 + 3] = (r() - 0.5) * 2.2;
      dustSeed[k * 6 + 4] = 0.3 + r() * 1.1;
      dustSeed[k * 6 + 5] = 0.5 + r() * 0.9;
    }
  }

  const G = 22; // courses per unit time squared
  const SPEED = 3; // unit time per unit of progress (lower = slower fall per scroll)

  function place(t: number) {
    for (let i = 0; i < count; i++) {
      const tau = (t - t0[i]) * SPEED;
      const loosen = smoothstep(t0[i] - 0.09, t0[i], t);
      if (tau <= 0) {
        // Standing; just ahead of the break it works loose and starts to lean out.
        pos.set(bx[i], by[i], loosen * 0.22);
        e.set(wob[i * 2] + loosen * spin[i * 3] * 0.012, wob[i * 2] * 0.5, wob[i * 2 + 1] + loosen * spin[i * 3 + 2] * 0.02);
        scl.setScalar(1);
      } else {
        pos.set(
          bx[i] + vel[i * 3] * tau,
          by[i] + vel[i * 3 + 1] * tau - 0.5 * G * tau * tau,
          0.22 + vel[i * 3 + 2] * tau,
        );
        e.set(wob[i * 2] + spin[i * 3] * tau, spin[i * 3 + 1] * tau, wob[i * 2 + 1] + spin[i * 3 + 2] * tau);
        scl.setScalar(1);
      }
      q.setFromEuler(e);
      m.compose(pos, q, scl);
      bricks.setMatrixAt(i, m);
      // Mortar breaks up as soon as its brick goes.
      const ms = tau <= 0 ? 1 : Math.max(0.0001, 1 - tau * 2.6);
      m2.copy(m).multiply(offset);
      if (ms < 1) m2.scale(pos.set(ms, ms, ms));
      mortar.setMatrixAt(i, m2);
    }
    bricks.instanceMatrix.needsUpdate = true;
    mortar.instanceMatrix.needsUpdate = true;

    for (let k = 0; k < DUST; k++) {
      const j = dustSeed[k * 6];
      const age = (t - t0[j]) * SPEED;
      const o = k * 4;
      if (age <= 0 || age > 1.44) {
        dustCol[o + 3] = 0;
        continue;
      }
      dustPos[k * 3] = bx[j] + dustSeed[k * 6 + 1] + dustSeed[k * 6 + 3] * age;
      dustPos[k * 3 + 1] = by[j] + dustSeed[k * 6 + 2] + dustSeed[k * 6 + 4] * age - 0.4 * age * age;
      dustPos[k * 3 + 2] = 0.6 + age * 1.4;
      const a = smoothstep(0, 0.12, age) * (1 - smoothstep(0.3, 1.44, age));
      dustCol[o] = 0.78;
      dustCol[o + 1] = 0.72;
      dustCol[o + 2] = 0.66;
      dustCol[o + 3] = a * 0.38 * dustSeed[k * 6 + 5] * (1 - smoothstep(0.85, 1, t)); // settled before the stage lets go
    }
    (dustGeo.attributes.position as BufferAttribute).needsUpdate = true;
    (dustGeo.attributes.color as BufferAttribute).needsUpdate = true;
  }

  let target = 0; // where the scroll says the demolition is
  let shown = 0; // where the drawn frame is (eases toward target)
  let placed = -1;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let running = false;
  let raf = 0;
  let dirty = true;

  function frameCamera() {
    // A touch of parallax: enough to feel the depth in the wall, never enough to show an edge.
    camera.position.set(pointer.sx * 0.5, -pointer.sy * 0.3, camDist);
    camera.lookAt(pointer.sx * 0.15, -pointer.sy * 0.1, 0);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(opts.poster ? 1 : dpr);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    layout();
    dirty = true;
  }

  function render() {
    if (placed !== shown || dirty) {
      const done = shown >= 1;
      bricks.visible = mortar.visible = dust.visible = !done;
      if (!done) place(shown);
      placed = shown;
    }
    frameCamera();
    renderer.render(scene, camera);
    dirty = false;
  }

  function tick() {
    raf = 0;
    if (!running) return;
    const before = shown;
    // Ease toward the scroll position so a flick of the wheel still reads as motion.
    shown = Math.abs(target - shown) < 0.0005 ? target : shown + (target - shown) * 0.12;
    const pmove = Math.abs(pointer.x - pointer.sx) + Math.abs(pointer.y - pointer.sy) > 0.0005;
    pointer.sx += (pointer.x - pointer.sx) * 0.06;
    pointer.sy += (pointer.y - pointer.sy) * 0.06;
    if (shown !== before || pmove || dirty) render();
    raf = requestAnimationFrame(tick);
  }

  resize();

  return {
    setProgress(p) {
      target = MathUtils.clamp(p, 0, 1);
    },
    setPointer(x, y) {
      // Once the wall is gone there's nothing to look around.
      if (target >= 1) return;
      pointer.x = x;
      pointer.y = y;
    },
    setRunning(on) {
      running = on;
      if (on && !raf) raf = requestAnimationFrame(tick);
      if (!on && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    renderOnce() {
      shown = target;
      dirty = true;
      render();
    },
    resize() {
      resize();
      if (!running) render();
    },
    dispose() {
      cancelAnimationFrame(raf);
      running = false;
      brickGeo.dispose();
      brickMat.dispose();
      tex.dispose();
      mortarGeo.dispose();
      mortarMat.dispose();
      dustGeo.dispose();
      dustMat.map?.dispose();
      dustMat.dispose();
      bricks.dispose();
      mortar.dispose();
      renderer.dispose();
    },
  };
}
