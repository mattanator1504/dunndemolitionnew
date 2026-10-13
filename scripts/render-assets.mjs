// Renders build-time images with headless Chromium (run after `next build`):
// - public/images/hero-wall-poster(-1080).webp: the 3D wall's first frame (the hero poster)
// - public/og/default.png: 1200x630 share image
// - app/icon.png and app/apple-icon.png
// Usage: npm run build && node scripts/render-assets.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/opt/node-tools/node_modules/playwright'));
}

const root = path.resolve(import.meta.dirname, '..');
const port = 4317;
const server = spawn('npx', ['serve', 'out', '-l', String(port), '--no-request-logging'], { cwd: root, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  // 1. Poster: the wall's first frame at the scene's 1920x1080 reference frame (the hero
  // shows it object-fit: cover, which is how the live scene lays the wall out too).
  const page = await browser.newPage({ viewport: { width: 1920, height: 1152 } });
  await page.goto(`http://localhost:${port}/?poster=1&3d`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__posterReady === true, null, { timeout: 30000 });
  const dataUrl = await page.evaluate(() => {
    const canvas = document.querySelector('#hero canvas');
    const { width, height } = window.__posterFrame;
    Object.assign(canvas.style, { position: 'fixed', left: '0', top: '0', width: `${width}px`, height: `${height}px` });
    window.__heroScene.resize();
    window.__heroScene.renderOnce();
    return canvas.toDataURL('image/png');
  });
  const png = Buffer.from(dataUrl.split(',')[1], 'base64');
  for (const [w, file, q] of [
    [1920, 'hero-wall-poster.webp', 62],
    [1080, 'hero-wall-poster-1080.webp', 60],
  ]) {
    await sharp(png).resize({ width: w }).webp({ quality: q, effort: 6 }).toFile(path.join(root, 'public/images', file));
    const { size } = await fs.stat(path.join(root, 'public/images', file));
    console.log('poster', file, `${Math.round(size / 1024)} KB`);
  }

  // 2. OG image and icons, drawn in HTML with the site's fonts.
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const posterB64 = (await fs.readFile(path.join(root, 'public/images/hero-wall-poster.webp'))).toString('base64');
  await og.setContent(`<!doctype html><html><head>
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@125,900&family=JetBrains+Mono:wght@500&display=block" rel="stylesheet">
    <style>
      *{margin:0;box-sizing:border-box} body{width:1200px;height:630px;background:#121211;color:#e7e4dd;position:relative;overflow:hidden}
      .wall{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
      .shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(18,18,17,.55),rgba(18,18,17,0) 70%)}
      .txt{position:absolute;left:64px;top:64px;width:700px}
      .tag{font:500 17px 'JetBrains Mono';letter-spacing:.14em;text-transform:uppercase;color:#d6d2ca}
      .tag b{color:#FFB800;font-weight:500}
      h1{font:900 112px/0.84 'Archivo';font-stretch:125%;text-transform:uppercase;letter-spacing:-.03em;margin-top:120px}
      h1 span{color:#FFB800}
      p{font:500 17px 'JetBrains Mono';letter-spacing:.14em;text-transform:uppercase;margin-top:34px;color:#d6d2ca}
      .tape{position:absolute;left:0;right:0;bottom:0;height:20px;background-color:#FFB800;background-image:repeating-linear-gradient(90deg,#121211 0 1px,transparent 1px 10px),repeating-linear-gradient(90deg,#121211 0 2px,transparent 2px 100px);background-size:100% 35%,100% 70%;background-repeat:no-repeat}
    </style></head><body>
      <img class="wall" src="data:image/webp;base64,${posterB64}"><div class="shade"></div>
      <div class="txt"><div class="tag"><b>●</b> Est. 1974 · Virginia Class A Contractor</div><h1>We break<br>it <span>down.</span></h1><p>Dunn Demolition · Hampton Roads, VA</p></div>
      <div class="tape"></div></body></html>`);
  await og.waitForLoadState('networkidle');
  await og.evaluate(() => document.fonts.ready);
  await og.screenshot({ path: path.join(root, 'public/og/default.png') });
  console.log('og image done');

  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 34 34">
    <rect width="34" height="34" fill="#FFB800"/><g fill="#121211">
    <rect x="5" y="23" width="11" height="6"/><rect x="18" y="23" width="11" height="6"/>
    <rect x="5" y="15" width="5" height="6"/><rect x="12" y="15" width="11" height="6"/>
    <rect x="22" y="6" width="9" height="6" transform="rotate(24 26.5 9)"/></g></svg>`;
  await sharp(Buffer.from(iconSvg)).resize(512).png().toFile(path.join(root, 'app/icon.png'));
  await sharp(Buffer.from(iconSvg)).resize(180).png().toFile(path.join(root, 'app/apple-icon.png'));
  console.log('icons done');
  // Keep an existing static build in step with the new files.
  for (const f of ['public/images/hero-wall-poster.webp', 'public/images/hero-wall-poster-1080.webp', 'public/og/default.png']) {
    const dest = path.join(root, 'out', f.replace(/^public\//, ''));
    await fs.mkdir(path.dirname(dest), { recursive: true }).catch(() => {});
    await fs.copyFile(path.join(root, f), dest).catch(() => {});
  }
} finally {
  await browser.close();
  server.kill();
}
