// bbox.mjs <img> x0 y0 x1 y1 [hexBg] [tol] -> bbox of pixels differing from bg within region
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('C:/work/ui-agent/mcp/package.json');
const { PNG } = require('pngjs');
const [img, x0, y0, x1, y1, bg, tolA] = process.argv.slice(2);
const p = PNG.sync.read(fs.readFileSync(img));
const tol = +(tolA || 40);
const get = (x, y) => { const i = (y * p.width + x) * 4; return [p.data[i], p.data[i+1], p.data[i+2]]; };
const bgc = bg ? [1,3,5].map(i => parseInt(bg.slice(i, i+2), 16)) : get(+x0, +y0);
let mnx=1e9,mny=1e9,mxx=-1,mxy=-1;
for (let y=+y0;y<=+y1;y++) for (let x=+x0;x<=+x1;x++){const c=get(x,y); if(Math.max(...c.map((v,i)=>Math.abs(v-bgc[i])))>tol){mnx=Math.min(mnx,x);mny=Math.min(mny,y);mxx=Math.max(mxx,x);mxy=Math.max(mxy,y);}}
console.log(`bbox x=${mnx} y=${mny} w=${mxx-mnx+1} h=${mxy-mny+1}`);
