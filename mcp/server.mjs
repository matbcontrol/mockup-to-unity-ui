#!/usr/bin/env node
// MCP server (stdio, JSON-RPC 2.0) that lets an agent build and check Unity UI.
// It talks to the Unity editor bridge on http://127.0.0.1:8790 (open editor or headless Serve mode).
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { compare } from './compare.mjs';

const BRIDGE = process.env.UI_AGENT_BRIDGE || 'http://127.0.0.1:8790';

async function bridge(route, body) {
  let r;
  try { r = await fetch(`${BRIDGE}/${route}`, { method: 'POST', body: body ?? '' }); }
  catch { throw new Error(`Unity bridge is not reachable at ${BRIDGE}. Open the project in Unity or start headless mode (see README).`); }
  return await r.json();
}

const tools = [
  {
    name: 'unity_build_ui',
    description: 'Build a uGUI screen in Unity from a layout spec and save it as a prefab. Replaces the previous build. ' +
      'Spec: {"name","canvas":{"width","height","background"},"elements":[{"id","type":"panel|button|text|image|circle|progress",' +
      '"rect":[x,y,w,h] in canvas px from top-left,"color","radius","outline","outlineWidth","text","fontSize","textColor","align":"left|center|right","bold","fill","value"}]}. ' +
      'Elements are drawn in list order; put backgrounds first. Returns the prefab path and how each element was anchored.',
    inputSchema: { type: 'object', properties: { spec: { type: 'object', description: 'Layout spec' } }, required: ['spec'] },
  },
  {
    name: 'unity_screenshot',
    description: 'Render the last built screen at its exact canvas size and save a PNG. Returns the file path; open it to look at the result.',
    inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'Optional output path' } } },
  },
  {
    name: 'unity_hierarchy',
    description: 'List the built UI objects with anchored position, size, anchor, color and text.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'compare_to_mockup',
    description: 'Compare a Unity screenshot with the mockup image. Returns overall pixel similarity (0..1), the four worst regions of a 3x4 grid, ' +
      'and a diff image path (red = different). Use it after each build to decide what to fix.',
    inputSchema: { type: 'object', properties: { mockup: { type: 'string' }, render: { type: 'string' } }, required: ['mockup', 'render'] },
  },
];

async function call(name, args) {
  switch (name) {
    case 'unity_build_ui': return bridge('build', JSON.stringify(args.spec));
    case 'unity_screenshot': return bridge('screenshot', args.path || '');
    case 'unity_hierarchy': return bridge('hierarchy');
    case 'compare_to_mockup': {
      const diff = path.join(path.dirname(args.render), path.basename(args.render, '.png') + '_diff.png');
      return compare(args.mockup, args.render, diff);
    }
    default: throw new Error('unknown tool ' + name);
  }
}

const send = msg => process.stdout.write(JSON.stringify(msg) + '\n');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', async line => {
  let msg; try { msg = JSON.parse(line); } catch { return; }
  const { id, method, params } = msg;
  try {
    if (method === 'initialize')
      return send({ jsonrpc: '2.0', id, result: { protocolVersion: params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'unity-ui-agent', version: '0.1.0' } } });
    if (method === 'notifications/initialized' || id === undefined) return;
    if (method === 'tools/list') return send({ jsonrpc: '2.0', id, result: { tools } });
    if (method === 'tools/call') {
      const res = await call(params.name, params.arguments || {});
      return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }], isError: res && res.ok === false } });
    }
    if (method === 'ping') return send({ jsonrpc: '2.0', id, result: {} });
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'method not found' } });
  } catch (e) {
    send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: String(e.message || e) }], isError: true } });
  }
});
