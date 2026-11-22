// Scores an agent run against ground truth.
//   node score.mjs runs/<run>     (expects runs/<run>/specs/*.json and renders/*.png)
// Element metrics: an agent element matches a ground-truth element when their boxes overlap with IoU >= 0.5
// and their types are compatible. Greedy matching by IoU.
import fs from 'node:fs';
import path from 'node:path';
import { compare } from '../mcp/compare.mjs';

const runDir = path.resolve(process.argv[2]);
const here = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const gtDir = process.env.GT_DIR || path.join(here, 'dataset', 'ground_truth');
const mockDir = path.join(here, 'dataset', 'mockups');

const group = t => ({ panel: 'box', button: 'box', progress: 'box', image: 'box', text: 'text', circle: 'circle' })[t] || 'box';
const iou = (a, b) => {
  const x1 = Math.max(a[0], b[0]), y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[0] + a[2], b[0] + b[2]), y2 = Math.min(a[1] + a[3], b[1] + b[3]);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  return inter / (a[2] * a[3] + b[2] * b[3] - inter || 1);
};
const rgb = h => { h = (h || '#000').replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
const colorSim = (a, b) => { const p = rgb(a), q = rgb(b); return 1 - Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) / 441.7; };
const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
// text lives either in a text element or as a label on a box
const textOf = e => e.text || '';

const rows = [];
for (const f of fs.readdirSync(gtDir).filter(f => f.endsWith('.json')).sort()) {
  const name = path.basename(f, '.json');
  const gt = JSON.parse(fs.readFileSync(path.join(gtDir, f), 'utf8'));
  const pf = path.join(runDir, 'specs', f);
  if (!fs.existsSync(pf)) { rows.push({ name, missing: true }); continue; }
  const pr = JSON.parse(fs.readFileSync(pf, 'utf8'));
  const G = gt.elements, P = pr.elements || [];
  const pairs = [];
  G.forEach((g, i) => P.forEach((p, j) => { if (group(g.type) === group(p.type) && p.rect?.length === 4) { const v = iou(g.rect, p.rect); if (v >= 0.5) pairs.push([v, i, j]); } }));
  pairs.sort((a, b) => b[0] - a[0]);
  const usedG = new Set(), usedP = new Set(), m = [];
  for (const [v, i, j] of pairs) if (!usedG.has(i) && !usedP.has(j)) { usedG.add(i); usedP.add(j); m.push([v, G[i], P[j]]); }

  const withText = G.filter(g => textOf(g));
  const textHits = m.filter(([, g, p]) => textOf(g) && norm(textOf(g)) === norm(textOf(p))).length;
  const cs = m.map(([, g, p]) => colorSim(g.color, p.color));
  const centerErr = m.map(([, g, p]) => Math.hypot(g.rect[0] + g.rect[2] / 2 - p.rect[0] - p.rect[2] / 2, g.rect[1] + g.rect[3] / 2 - p.rect[1] - p.rect[3] / 2));
  const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;

  let pixel = null;
  const render = path.join(runDir, 'renders', name + '.png');
  if (fs.existsSync(render)) pixel = compare(path.join(mockDir, name + '.png'), render, null).similarity;

  rows.push({
    name, gt: G.length, pred: P.length, matched: m.length,
    recall: m.length / G.length, precision: P.length ? m.length / P.length : 0,
    iou: avg(m.map(x => x[0])), centerErrPx: avg(centerErr),
    text: withText.length ? textHits / withText.length : 1, color: avg(cs), pixel,
  });
}

const ok = rows.filter(r => !r.missing);
const mean = k => ok.reduce((s, r) => s + (r[k] ?? 0), 0) / (ok.length || 1);
const pct = x => (x * 100).toFixed(1) + '%';
let md = `| Screen | Elements (truth / agent) | Found | Precision | Mean IoU | Center error | Text exact | Color | Pixel similarity |\n|---|---|---|---|---|---|---|---|---|\n`;
for (const r of rows) md += r.missing ? `| ${r.name} | missing | | | | | | | |\n` :
  `| ${r.name} | ${r.gt} / ${r.pred} | ${pct(r.recall)} | ${pct(r.precision)} | ${r.iou.toFixed(2)} | ${r.centerErrPx.toFixed(1)} px | ${pct(r.text)} | ${pct(r.color)} | ${r.pixel == null ? '' : pct(r.pixel)} |\n`;
md += `| **Mean** | | **${pct(mean('recall'))}** | **${pct(mean('precision'))}** | **${mean('iou').toFixed(2)}** | **${mean('centerErrPx').toFixed(1)} px** | **${pct(mean('text'))}** | **${pct(mean('color'))}** | **${pct(mean('pixel'))}** |\n`;
fs.writeFileSync(path.join(runDir, 'score.md'), md);
fs.writeFileSync(path.join(runDir, 'score.json'), JSON.stringify(rows, null, 2));
console.log(md);
