// usage: node tbox.mjs img.png x,y,w,h [thr]  -> bbox of pixels differing from the ROI's top-left pixel color
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('C:/work/ui-agent/mcp/package.json');
const { PNG } = require('pngjs');
const [file, roi, t] = process.argv.slice(2); const thr = +(t || 120);
const p = PNG.sync.read(fs.readFileSync(file)); const { width: w, data } = p;
const [rx, ry, rw, rh] = roi.split(',').map(Number);
const px = (x, y) => { const i = (y * w + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
const bg = px(rx, ry); let a = 1e9, b = -1, c = 1e9, d = -1;
for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) { const q = px(x, y);
  if (Math.abs(q[0] - bg[0]) + Math.abs(q[1] - bg[1]) + Math.abs(q[2] - bg[2]) > thr) { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, y); d = Math.max(d, y); } }
console.log(`x ${a}-${b} (w ${b - a + 1}, cx ${(a + b) / 2})  y ${c}-${d} (h ${d - c + 1}, cy ${(c + d) / 2})`);
