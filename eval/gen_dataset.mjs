// Generates 10 game-UI mockups with known ground truth.
// Ground truth = a UiSpec JSON. The mockup PNG is drawn by the browser with designer styling
// (web font, soft shadows, gradients), so it does not look like Unity's own render.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const W = 540, H = 960;
const dir = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const gtDir = path.join(dir, 'dataset', 'ground_truth');
const mockDir = path.join(dir, 'dataset', 'mockups');
const htmlDir = path.join(dir, 'dataset', 'html');
[gtDir, mockDir, htmlDir].forEach(d => fs.mkdirSync(d, { recursive: true }));

const P = (id, rect, color, extra = {}) => ({ id, type: 'panel', rect, color, ...extra });
const T = (id, rect, text, fontSize, color = '#ffffff', extra = {}) => ({ id, type: 'text', rect, text, fontSize, color, ...extra });
const B = (id, rect, color, text, fontSize = 30, extra = {}) => ({ id, type: 'button', rect, color, text, fontSize, bold: true, radius: 16, ...extra });
const C = (id, rect, color) => ({ id, type: 'circle', rect, color });
const G = (id, rect, color, fill, value, extra = {}) => ({ id, type: 'progress', rect, color, fill, value, radius: 14, ...extra });

const screens = [
  { name: '01_main_menu', bg: '#14213d', els: [
    T('Logo', [70, 140, 400, 90], 'SKY RUNNER', 56, '#fca311', { bold: true }),
    T('Subtitle', [120, 235, 300, 40], 'Season 4', 26, '#e5e5e5'),
    B('Play', [120, 470, 300, 90], '#2a9d8f', 'PLAY', 44),
    B('Shop', [120, 585, 300, 70], '#3a506b', 'SHOP', 32),
    B('Settings', [120, 680, 300, 70], '#3a506b', 'SETTINGS', 32),
    C('Profile', [30, 30, 64, 64], '#fca311'),
    T('Version', [370, 910, 160, 30], 'v1.4.2', 20, '#8d99ae', { align: 'right' }),
  ]},
  { name: '02_level_complete', bg: '#2b2d42', els: [
    P('Window', [40, 180, 460, 560], '#edf2f4', { radius: 28 }),
    P('Ribbon', [70, 150, 400, 80], '#ef233c', { radius: 18 }),
    T('Title', [70, 160, 400, 60], 'LEVEL COMPLETE', 34, '#ffffff', { bold: true }),
    C('Star1', [110, 270, 90, 90], '#ffb703'),
    C('Star2', [225, 250, 90, 90], '#ffb703'),
    C('Star3', [340, 270, 90, 90], '#8d99ae'),
    T('ScoreLabel', [90, 400, 360, 40], 'SCORE', 26, '#8d99ae'),
    T('Score', [90, 440, 360, 60], '12 480', 48, '#2b2d42', { bold: true }),
    B('Next', [100, 560, 340, 80], '#06d6a0', 'NEXT', 38),
    B('Home', [100, 655, 340, 60], '#8d99ae', 'HOME', 28),
  ]},
  { name: '03_shop', bg: '#1e2a4a', els: [
    P('Header', [0, 0, 540, 110], '#2c3e73'),
    T('Title', [120, 25, 300, 60], 'SHOP', 44, '#ffffff', { bold: true }),
    C('CoinIcon', [400, 38, 34, 34], '#ffc83d'),
    T('Coins', [440, 35, 90, 40], '1250', 28, '#ffe9a8', { align: 'left' }),
    P('Card1', [30, 150, 230, 300], '#34497f', { radius: 18 }),
    P('Card2', [280, 150, 230, 300], '#34497f', { radius: 18 }),
    C('Gem1', [95, 185, 100, 100], '#4fd1ff'),
    C('Gem2', [345, 185, 100, 100], '#c86bff'),
    B('Buy1', [55, 370, 180, 60], '#3fbf5f', '$0.99', 30),
    B('Buy2', [305, 370, 180, 60], '#3fbf5f', '$4.99', 30),
    G('Vip', [60, 520, 420, 36], '#141c33', '#ff9f1c', 0.65, { text: 'VIP 65%', fontSize: 22 }),
    B('Close', [170, 840, 200, 70], '#e05252', 'CLOSE', 32),
  ]},
  { name: '04_settings', bg: '#22223b', els: [
    T('Title', [40, 60, 460, 70], 'Settings', 48, '#f2e9e4', { bold: true }),
    P('Row1', [40, 180, 460, 90], '#4a4e69', { radius: 20 }),
    T('MusicLabel', [70, 200, 200, 50], 'Music', 32, '#f2e9e4', { align: 'left' }),
    G('Music', [270, 212, 200, 26], '#22223b', '#c9ada7', 0.8),
    P('Row2', [40, 290, 460, 90], '#4a4e69', { radius: 20 }),
    T('SfxLabel', [70, 310, 200, 50], 'Sounds', 32, '#f2e9e4', { align: 'left' }),
    G('Sfx', [270, 322, 200, 26], '#22223b', '#c9ada7', 0.4),
    P('Row3', [40, 400, 460, 90], '#4a4e69', { radius: 20 }),
    T('LangLabel', [70, 420, 200, 50], 'Language', 32, '#f2e9e4', { align: 'left' }),
    B('Lang', [330, 418, 140, 54], '#9a8c98', 'EN', 28),
    B('Back', [140, 820, 260, 80], '#c9ada7', 'BACK', 36, { textColor: '#22223b' }),
  ]},
  { name: '05_daily_reward', bg: '#3d405b', els: [
    T('Title', [40, 70, 460, 70], 'DAILY REWARD', 44, '#f4f1de', { bold: true }),
    P('Day1', [40, 190, 140, 170], '#81b29a', { radius: 20 }),
    P('Day2', [200, 190, 140, 170], '#81b29a', { radius: 20 }),
    P('Day3', [360, 190, 140, 170], '#e07a5f', { radius: 20, outline: '#f2cc8f', outlineWidth: 5 }),
    T('D1', [40, 200, 140, 40], 'Day 1', 24, '#f4f1de'),
    T('D2', [200, 200, 140, 40], 'Day 2', 24, '#f4f1de'),
    T('D3', [360, 200, 140, 40], 'Day 3', 24, '#f4f1de', { bold: true }),
    C('R1', [80, 255, 60, 60], '#f2cc8f'),
    C('R2', [240, 255, 60, 60], '#f2cc8f'),
    C('R3', [390, 245, 80, 80], '#f2cc8f'),
    B('Claim', [110, 470, 320, 90], '#e07a5f', 'CLAIM', 40),
    T('Timer', [90, 590, 360, 40], 'Next reward in 23:14:05', 24, '#d6d3c4'),
  ]},
  { name: '06_inventory', bg: '#0b132b', els: [
    P('Top', [0, 0, 540, 100], '#1c2541'),
    T('Title', [30, 25, 300, 50], 'Inventory', 38, '#ffffff', { bold: true, align: 'left' }),
    T('Count', [380, 30, 130, 40], '18 / 40', 26, '#5bc0be', { align: 'right' }),
    P('Slot1', [30, 140, 150, 150], '#3a506b', { radius: 16 }),
    P('Slot2', [195, 140, 150, 150], '#3a506b', { radius: 16 }),
    P('Slot3', [360, 140, 150, 150], '#3a506b', { radius: 16 }),
    P('Slot4', [30, 305, 150, 150], '#3a506b', { radius: 16 }),
    P('Slot5', [195, 305, 150, 150], '#5bc0be', { radius: 16 }),
    P('Slot6', [360, 305, 150, 150], '#3a506b', { radius: 16 }),
    P('Details', [30, 490, 480, 260], '#1c2541', { radius: 22 }),
    T('ItemName', [60, 510, 420, 50], 'Frost Blade', 34, '#ffffff', { bold: true, align: 'left' }),
    T('ItemDesc', [60, 565, 420, 80], 'Slows enemies on hit for 2 seconds.', 24, '#c9d6df', { align: 'left' }),
    B('Equip', [60, 670, 200, 60], '#5bc0be', 'EQUIP', 28, { textColor: '#0b132b' }),
    B('Sell', [280, 670, 200, 60], '#6c757d', 'SELL', 28),
  ]},
  { name: '07_pause', bg: '#000000', els: [
    P('Dim', [0, 0, 540, 960], '#1a1a2e'),
    P('Window', [70, 260, 400, 440], '#16213e', { radius: 30, outline: '#e94560', outlineWidth: 4 }),
    T('Title', [70, 290, 400, 70], 'PAUSED', 50, '#ffffff', { bold: true }),
    B('Resume', [120, 400, 300, 80], '#e94560', 'RESUME', 36),
    B('Restart', [120, 500, 300, 70], '#0f3460', 'RESTART', 30),
    B('Quit', [120, 590, 300, 70], '#0f3460', 'QUIT', 30),
  ]},
  { name: '08_leaderboard', bg: '#264653', els: [
    T('Title', [40, 50, 460, 70], 'LEADERBOARD', 44, '#e9c46a', { bold: true }),
    P('Row1', [40, 160, 460, 80], '#e9c46a', { radius: 18 }),
    T('Name1', [70, 175, 250, 50], '1. NovaKid', 30, '#264653', { bold: true, align: 'left' }),
    T('Score1', [330, 175, 150, 50], '98 200', 30, '#264653', { bold: true, align: 'right' }),
    P('Row2', [40, 255, 460, 80], '#2a9d8f', { radius: 18 }),
    T('Name2', [70, 270, 250, 50], '2. Orbit', 30, '#ffffff', { align: 'left' }),
    T('Score2', [330, 270, 150, 50], '91 450', 30, '#ffffff', { align: 'right' }),
    P('Row3', [40, 350, 460, 80], '#2a9d8f', { radius: 18 }),
    T('Name3', [70, 365, 250, 50], '3. Pixelor', 30, '#ffffff', { align: 'left' }),
    T('Score3', [330, 365, 150, 50], '88 010', 30, '#ffffff', { align: 'right' }),
    P('YouRow', [40, 760, 460, 90], '#f4a261', { radius: 18 }),
    T('YouName', [70, 780, 250, 50], '57. You', 32, '#264653', { bold: true, align: 'left' }),
    T('YouScore', [330, 780, 150, 50], '41 300', 32, '#264653', { bold: true, align: 'right' }),
  ]},
  { name: '09_battle_hud', bg: '#3c6e71', els: [
    G('Hp', [20, 30, 300, 36], '#284b63', '#e63946', 0.72, { text: 'HP 720', fontSize: 22 }),
    G('Mana', [20, 76, 220, 24], '#284b63', '#4cc9f0', 0.4),
    C('CoinIcon', [400, 28, 40, 40], '#ffd166'),
    T('Coins', [445, 28, 85, 40], '312', 28, '#ffffff', { align: 'left', bold: true }),
    T('Wave', [170, 130, 200, 50], 'WAVE 7', 36, '#ffffff', { bold: true }),
    C('Skill1', [40, 800, 110, 110], '#ef476f'),
    C('Skill2', [170, 820, 90, 90], '#118ab2'),
    C('Skill3', [280, 820, 90, 90], '#06d6a0'),
    B('Pause', [440, 800, 80, 80], '#284b63', 'II', 34),
  ]},
  { name: '10_profile', bg: '#f1faee', els: [
    P('Banner', [0, 0, 540, 260], '#457b9d'),
    C('Avatar', [195, 160, 150, 150], '#e63946'),
    T('Name', [70, 330, 400, 60], 'Captain Mira', 40, '#1d3557', { bold: true }),
    T('Level', [170, 390, 200, 40], 'Level 23', 26, '#457b9d'),
    G('Xp', [90, 450, 360, 30], '#a8dadc', '#1d3557', 0.55),
    P('Stat1', [40, 530, 140, 120], '#ffffff', { radius: 20, outline: '#a8dadc', outlineWidth: 3 }),
    P('Stat2', [200, 530, 140, 120], '#ffffff', { radius: 20, outline: '#a8dadc', outlineWidth: 3 }),
    P('Stat3', [360, 530, 140, 120], '#ffffff', { radius: 20, outline: '#a8dadc', outlineWidth: 3 }),
    T('Wins', [40, 550, 140, 50], '142', 34, '#1d3557', { bold: true }),
    T('Games', [200, 550, 140, 50], '310', 34, '#1d3557', { bold: true }),
    T('Rank', [360, 550, 140, 50], '#57', 34, '#1d3557', { bold: true }),
    B('Edit', [140, 820, 260, 80], '#1d3557', 'EDIT PROFILE', 30),
  ]},
];

function css(e) {
  const [x, y, w, h] = e.rect;
  let s = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
  const shade = `linear-gradient(180deg, rgba(255,255,255,.10), rgba(0,0,0,.06))`;
  switch (e.type) {
    case 'text':
      return s + `color:${e.color};font-size:${e.fontSize}px;font-weight:${e.bold ? 800 : 500};justify-content:${e.align === 'left' ? 'flex-start' : e.align === 'right' ? 'flex-end' : 'center'};text-align:${e.align || 'center'};`;
    case 'circle':
      return s + `border-radius:50%;background:radial-gradient(circle at 35% 30%, rgba(255,255,255,.35), rgba(255,255,255,0) 55%), ${e.color};box-shadow:0 4px 10px rgba(0,0,0,.25);`;
    case 'button':
      return s + `border-radius:${e.radius || 0}px;background:${shade}, ${e.color};box-shadow:0 5px 0 rgba(0,0,0,.25);color:${e.textColor || '#fff'};font-size:${e.fontSize}px;font-weight:800;justify-content:center;`;
    case 'progress':
      return s + `border-radius:${e.radius || 0}px;background:${e.color};overflow:hidden;`;
    default:
      return s + `border-radius:${e.radius || 0}px;background:${shade}, ${e.color};` +
        (e.outline ? `box-shadow:inset 0 0 0 ${e.outlineWidth || 4}px ${e.outline}, 0 6px 16px rgba(0,0,0,.25);` : `box-shadow:0 6px 16px rgba(0,0,0,.22);`);
  }
}

function inner(e) {
  if (e.type === 'progress') {
    const fill = `<div style="position:absolute;left:0;top:0;bottom:0;width:${Math.round(e.value * 100)}%;background:${e.fill};border-radius:${e.radius || 0}px"></div>`;
    const label = e.text ? `<div class="lbl" style="font-size:${e.fontSize}px;color:${e.textColor || '#fff'}">${e.text}</div>` : '';
    return fill + label;
  }
  if (e.type === 'text' || e.type === 'button') return e.text || '';
  return '';
}

for (const s of screens) {
  const spec = { name: s.name, canvas: { width: W, height: H, background: s.bg }, elements: s.els };
  fs.writeFileSync(path.join(gtDir, s.name + '.json'), JSON.stringify(spec, null, 2));
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:${s.bg};font-family:'Segoe UI Black','Segoe UI',Tahoma,sans-serif}
    .e{position:absolute;display:flex;align-items:center;box-sizing:border-box;white-space:nowrap}
    .lbl{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:700}
  </style></head><body>${s.els.map(e => `<div class="e" style="${css(e)}">${inner(e)}</div>`).join('')}</body></html>`;
  const hp = path.join(htmlDir, s.name + '.html');
  fs.writeFileSync(hp, html);
  const out = path.join(mockDir, s.name + '.png');
  execFileSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${W},${H}`, `--screenshot=${out}`, 'file:///' + hp.replace(/\\/g, '/')], { stdio: 'ignore' });
  console.log('mockup', s.name);
}
