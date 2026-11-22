// Image comparison used by the agent (MCP tool) and by the evaluation.
import fs from 'node:fs';
import { PNG } from 'pngjs';

export function readPng(p) { return PNG.sync.read(fs.readFileSync(p)); }

// Mean absolute difference over RGB, as a similarity in 0..1.
// Also writes a heat map: bright red where the render differs from the mockup.
// Regions are a 3x4 grid (top/middle/bottom x left/right) with the worst ones listed first,
// so the agent knows where to look.
export function compare(mockupPath, renderPath, diffPath) {
  const a = readPng(mockupPath), b = readPng(renderPath);
  if (a.width !== b.width || a.height !== b.height)
    throw new Error(`size mismatch: mockup ${a.width}x${a.height}, render ${b.width}x${b.height}`);
  const { width: w, height: h } = a;
  const out = new PNG({ width: w, height: h });
  const gx = 3, gy = 4; const cell = Array(gx * gy).fill(0); const cnt = Array(gx * gy).fill(0);
  let total = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const d = (Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2])) / 3;
    total += d;
    const c = Math.min(gy - 1, Math.floor(y / h * gy)) * gx + Math.min(gx - 1, Math.floor(x / w * gx));
    cell[c] += d; cnt[c]++;
    const g = (a.data[i] + a.data[i + 1] + a.data[i + 2]) / 3 * 0.35;
    const v = Math.min(255, d * 3);
    out.data[i] = Math.min(255, g + v); out.data[i + 1] = g; out.data[i + 2] = g; out.data[i + 3] = 255;
  }
  if (diffPath) fs.writeFileSync(diffPath, PNG.sync.write(out));
  const rows = ['top', 'upper-middle', 'lower-middle', 'bottom'], cols = ['left', 'center', 'right'];
  const regions = cell.map((s, i) => ({ region: `${rows[Math.floor(i / gx)]}-${cols[i % gx]}`, similarity: +(1 - s / cnt[i] / 255).toFixed(3) }))
    .sort((p, q) => p.similarity - q.similarity);
  return { similarity: +(1 - total / (w * h) / 255).toFixed(4), worstRegions: regions.slice(0, 4), diff: diffPath || null };
}
