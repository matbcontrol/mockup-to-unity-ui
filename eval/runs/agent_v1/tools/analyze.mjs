// usage: node analyze.mjs img.png [thr] [minArea]  -> connected components differing from bg
//        node analyze.mjs img.png sample x,y x,y ...
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('C:/work/ui-agent/mcp/package.json');
const { PNG } = require('pngjs');
const [file, a2, ...rest] = process.argv.slice(2);
const p = PNG.sync.read(fs.readFileSync(file)); const { width: w, height: h, data } = p;
const px = (x, y) => { const i = (y * w + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
if (a2 === 'sample') { for (const s of rest) { const [x, y] = s.split(',').map(Number); console.log(s, hex(px(x, y))); } process.exit(0); }
const thr = +(a2 || 24), minArea = +(rest[0] || 30);
// local background: compare each pixel to bg color (corner)
const bg = process.env.BG ? px(...process.env.BG.split(",").map(Number)) : px(2, h - 2);
const R = process.env.ROI ? process.env.ROI.split(",").map(Number) : [0, 0, w, h];
const inR = (x, y) => x >= R[0] && y >= R[1] && x < R[0] + R[2] && y < R[1] + R[3];
const diff = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const lab = new Int32Array(w * h).fill(-1); const comps = [];
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  if (!inR(x, y) || lab[y * w + x] >= 0 || diff(px(x, y), bg) <= thr) continue;
  const id = comps.length; const st = [y * w + x]; lab[y * w + x] = id;
  let x0 = x, x1 = x, y0 = y, y1 = y, n = 0; const cnt = new Map();
  while (st.length) { const k = st.pop(); const cx = k % w, cy = (k / w) | 0; n++;
    const c = px(cx, cy); const key = hex(c.map(v => (v >> 3) << 3)); cnt.set(key, (cnt.get(key) || 0) + 1);
    if (cx < x0) x0 = cx; if (cx > x1) x1 = cx; if (cy < y0) y0 = cy; if (cy > y1) y1 = cy;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy;
      if (!inR(nx, ny)) continue; const j = ny * w + nx;
      if (lab[j] < 0 && diff(px(nx, ny), bg) > thr) { lab[j] = id; st.push(j); } } }
  const top = [...cnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0]).join(',');
  comps.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, n, top });
}
console.log('bg', hex(bg), 'size', w, h);
// merge small components (text glyphs) on same line into groups
const big = comps.filter(c => c.n >= minArea);
for (const c of big) console.log(`[${c.x},${c.y},${c.w},${c.h}] n=${c.n} fill=${(c.n / (c.w * c.h)).toFixed(2)} ${c.top} center=${hex(px(c.x + (c.w >> 1), c.y + (c.h >> 1)))}`);
