#!/usr/bin/env node
// Same tools as the MCP server, from the command line:
//   node cli.mjs build spec.json | screenshot [out.png] | hierarchy | compare mockup.png render.png
import fs from 'node:fs';
import path from 'node:path';
import { compare } from './compare.mjs';

const BRIDGE = process.env.UI_AGENT_BRIDGE || 'http://127.0.0.1:8790';
const [cmd, a1, a2] = process.argv.slice(2);
const post = async (route, body = '') => (await fetch(`${BRIDGE}/${route}`, { method: 'POST', body })).json();

let res;
if (cmd === 'build') res = await post('build', fs.readFileSync(a1, 'utf8'));
else if (cmd === 'screenshot') res = await post('screenshot', a1 ? path.resolve(a1) : '');
else if (cmd === 'hierarchy') res = await post('hierarchy');
else if (cmd === 'ping') res = await post('ping');
else if (cmd === 'compare') res = compare(a1, a2, path.join(path.dirname(a2), path.basename(a2, '.png') + '_diff.png'));
else { console.log('usage: build spec.json | screenshot [out.png] | hierarchy | ping | compare mockup.png render.png'); process.exit(1); }
console.log(JSON.stringify(res, null, 2));
