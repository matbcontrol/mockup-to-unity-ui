// probe.mjs <img> row y | col x | px x y   -> runs of similar color
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('C:/work/ui-agent/mcp/package.json');
const { PNG } = require('pngjs');
const [img, cmd, a, b, tolArg] = process.argv.slice(2);
const p = PNG.sync.read(fs.readFileSync(img));
const get = (x, y) => { const i = (y * p.width + x) * 4; return [p.data[i], p.data[i+1], p.data[i+2]]; };
const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
const tol = +(tolArg || 12);
const diff = (c, d) => Math.max(...c.map((v, i) => Math.abs(v - d[i])));
if (cmd === 'px') { console.log(hex(get(+a, +b))); process.exit(); }
const n = cmd === 'row' ? p.width : p.height;
const at = i => cmd === 'row' ? get(i, +a) : get(+a, i);
let start = 0, prev = at(0), runs = [];
for (let i = 1; i <= n; i++) {
  const c = i < n ? at(i) : null;
  if (!c || diff(c, prev) > tol) { runs.push([start, i - 1, hex(at(start)), hex(at(Math.floor((start + i - 1) / 2)))]); start = i; }
  if (c) prev = c;
}
const minLen = +(b || 1);
console.log(runs.filter(r => r[1] - r[0] + 1 >= minLen).map(r => `${r[0]}-${r[1]} (${r[1]-r[0]+1}) ${r[3]}`).join('\n'));
