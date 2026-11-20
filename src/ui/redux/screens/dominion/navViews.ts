// DOMINION slice D28 (round-4 mockups m5-m7): the Boss's board (page map), the hold-Q command wheel and the crimson
// shutter between pages. Presentation only: the scene says what is open and what is pointed at; nothing here reads or
// changes a save or a random stream. The shutter is a moment, not a page: it never blocks a key or a tap.

import './nav.css';
import { EDGES, PINS, SHEETS, SPOTS, type PageId, type Pin, type Waiting } from '../../../../core/dominion/nav';
import { act, esc } from '../../kit';
import { rxUrl } from '../../assets';
import { stage } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);

/** The round-3 overlay set (haze, grade, edge glow, frame) the mockups put on every new page (kit.py fx). */
const fx = (k: string, a: string): string =>
  `<div class="haze" aria-hidden="true" style="--hz:${k};--hz2:${a}"></div><div class="grade" aria-hidden="true" style="--g1:${k};--g2:${a}"></div><div class="edgeglow" aria-hidden="true" style="--eg:${k}"></div><div class="orn" aria-hidden="true"></div>`;

// ---------- m5: the Boss's board ----------

export interface BoardModel {
  sheet: 0 | 1;
  /** The photo the keyboard cursor is on (index into this sheet's photos). */
  at: number;
}

const ctr = (p: Pin): [number, number] => [p.x + 52, p.y + 2];

function strings(sheet: 0 | 1): string {
  const pins = PINS.filter((p) => p.sheet === sheet);
  const find = (id: PageId): Pin => pins.find((p) => p.id === id)!;
  const svg: string[] = [];
  const tags: string[] = [];
  for (const e of EDGES.filter((x) => x.sheet === sheet)) {
    const [x1, y1] = ctr(find(e.a)), [x2, y2] = ctr(find(e.b));
    const mx = (x1 + x2) / 2, my = Math.max(y1, y2) + 26 + Math.abs(x2 - x1) * 0.05;
    const d = `M${x1} ${y1} Q${Math.round(mx)} ${Math.round(my)} ${x2} ${y2}`;
    svg.push(`<path d="${d}" fill="none" stroke="#1c0f05" stroke-width="4" opacity=".45" transform="translate(1 3)"/>`);
    svg.push(`<path d="${d}" fill="none" stroke="${e.gold ? '#e0a82a' : '#d0233f'}" stroke-width="2.6"${e.gold ? ' stroke-dasharray="7 5"' : ''}/>`);
    if (e.label) {
      const tx = (x1 + 2 * mx + x2) / 4, ty = (y1 + 2 * my + y2) / 4;
      tags.push(`<span class="tag4${e.gold ? ' g' : ''}" style="left:${Math.round(tx - 16)}px;top:${Math.round(ty - 8)}px">${esc(e.label)}</span>`);
    }
  }
  return `<svg class="strings" viewBox="0 0 960 540" aria-hidden="true">${svg.join('')}</svg>${tags.join('')}`;
}

export function boardView(m: BoardModel): string {
  const pins = PINS.filter((p) => p.sheet === m.sheet);
  const pols = pins.map((p, i) => {
    const cls = ['pol', p.cls, i === m.at ? 'on4' : '', p.reach === 'jump' ? '' : 'off4'].filter(Boolean).join(' ');
    return `<div class="${cls}" style="left:${p.x}px;top:${p.y}px;--r:${p.r}deg"${act('navPin', i)} data-over="navPinOver" data-testid="dom-pin-${p.id}"><div class="ph"><img src="${img(p.icon)}" alt=""></div><b>${esc(p.name)}</b><small>${esc(p.how)}</small></div>`;
  }).join('');
  const other = m.sheet ? 0 : 1;
  const memo = m.sheet === 0
    ? 'Red string: the normal way.<br>Gold string: Esc to the Menu.<br><b>Hold Q</b>: the wheel jumps anywhere.'
    : 'Top row: keys on the HQ.<br>Middle row: keys on the Crew File.<br>Bottom row: these come to you.';
  return stage(`<div class="cork"></div>
  <div class="ttl" style="--t1:#7a3a12;--t2:#c9338f">The Board <span class="sub">· ${esc(SHEETS[m.sheet])}</span></div>
  <div class="keys" data-testid="dom-board-keys"><span class="key"${act('navSheet', other)} style="cursor:pointer">Tab</span><span>${esc(SHEETS[other])}</span><span class="key">Enter</span><span>Go</span><span class="key"${act('navBoardClose')} style="cursor:pointer">Esc</span><span>Back</span></div>
  ${strings(m.sheet)}
  ${pols}
  <div class="memo" style="left:790px;top:366px;width:140px">${memo}</div>
  ${fx('#ffb07a', '#ff4d63')}`, 'background:#341d0c', 'kl-warm vign grain');
}

// ---------- m6: the command wheel ----------

export interface WheelModel {
  /** The place pointed at (0-7, clockwise from the top), or null for the hub. */
  at: number | null;
  /** The middle's words for the place pointed at (or for the page you are on). */
  hubName: string;
  hubLine: string;
  last: { id: PageId; name: string }[];
  pins: Waiting[];
  /** Places that can't be jumped to yet (Operations): drawn dim. */
  shut: number[];
}

/** The wheel, drawn over the page you are on (the page dims behind it, as in m6). */
export function wheelView(m: WheelModel): string {
  const cx = 480, cy = 300, r = 152;
  const spots = SPOTS.map((s, i) => {
    const a = ((-90 + i * 45) * Math.PI) / 180;
    const x = Math.round(cx + r * Math.cos(a)), y = Math.round(cy + r * Math.sin(a));
    const cls = ['wo', i === m.at ? 'on' : '', m.shut.includes(i) ? 'dim4' : ''].filter(Boolean).join(' ');
    return `<div class="${cls}" style="left:${x}px;top:${y}px"${act('navSpot', i)} data-over="navPoint" data-testid="dom-wheel-spot-${i}"><img src="${img(s.icon)}" alt="">${esc(s.name)}<span class="kc">${esc(s.key)}</span></div>`;
  }).join('');
  const last = m.last.map((p, i) => `<div class="act${i === 2 ? ' dim' : ''}"${act('navGo', p.id)} style="cursor:pointer" data-testid="dom-wheel-last-${i}"><img class="ic s" src="${img(PINS.find((x) => x.id === p.id)?.icon ?? 'g-journal')}" alt="">${esc(p.name)}${i === 0 ? '<span class="kc">⌫</span>' : ''}</div>`).join('')
    || '<div class="act dim">Nowhere yet</div>';
  const pins = m.pins.map((p, i) => `<div class="act"${act('navGo', p.go)} style="cursor:pointer" data-testid="dom-wheel-pin-${i}"><img class="ic s" src="${img(p.icon)}" alt="">${esc(p.text)}</div>`).join('')
    || '<div class="act dim">Nothing waits</div>';
  const wa = m.at === null ? 0 : m.at * 45 - 22.5;
  return `<div class="dom nav4" style="position:absolute;left:0;top:0;width:960px;height:540px;z-index:40" data-testid="dom-wheel">
  <div class="dim4l"${act('navClose')}></div>
  <div class="wheel${m.at === null ? ' idle4' : ''}" style="left:280px;top:100px;width:400px;height:400px;--wa:${wa}deg"></div>
  ${spots}
  <div class="hub4" style="left:404px;top:224px;width:152px;height:152px"${act('navClose')} data-testid="dom-wheel-hub"><div class="eye4" style="position:relative;width:54px;height:36px"></div><b>${esc(m.hubName)}</b><span>${esc(m.hubLine)}</span></div>
  <div class="a col" style="left:24px;top:120px;width:210px;gap:8px;z-index:21"><div class="grp" style="--c:#ff4d63">LAST PAGES</div>${last}</div>
  <div class="a col" style="right:24px;top:120px;width:210px;gap:8px;z-index:21"><div class="grp" style="--c:#ffd23f">PINNED</div>${pins}</div>
  <div class="keys" style="top:auto;bottom:18px;right:auto;left:50%;transform:translateX(-50%)"><span class="key">Q</span><span>hold</span><span class="key">◀▶</span><span>point</span><span class="key">Q</span><span>let go to jump</span><span class="key">⌫</span><span>last page</span><span class="key"${act('navBoard')} style="cursor:pointer">M</span><span>the Board</span></div>
</div>`;
}

// ---------- m7: the crimson shutter ----------

export type ShutterMode = 'blade' | 'fade' | 'off';

/** Settings · Effects & motion (D27's resolved level, which already follows the game's own Motion settings): Full show
 *  plays the blade, Lighter a plain fade, Calm none. Reduced animation intensity or the OS asking for reduced motion
 *  turn Full show into the fade too. */
export function shutterMode(level: 'full' | 'lighter' | 'calm', reduced: boolean): ShutterMode {
  if (level === 'calm') return 'off';
  return level === 'lighter' || reduced ? 'fade' : 'blade';
}

/** How long a page change shows the shutter (m7: "about a third of a second"). */
export const SHUTTER_MS = 340;

/** The old page as a picture for the shutter to wipe away: its panels and art without its words, keys, ids or taps,
 *  so nothing on it can be clicked, read twice by a screen reader or found by a test. Needs the DOM (the game only). */
export function ghostOf(html: string): string {
  if (typeof document === 'undefined') return '';
  const t = document.createElement('template');
  t.innerHTML = html;
  const st = t.content.querySelector('.st');
  if (!st) return '';
  st.querySelectorAll('.keys,.sig4,.vl4,.nav4').forEach((n) => n.remove());
  st.querySelectorAll('*').forEach((n) => {
    for (const a of [...n.attributes]) if (a.name.startsWith('data-') || a.name === 'id' || a.name.startsWith('aria-')) n.removeAttribute(a.name);
  });
  const walk = document.createTreeWalker(st, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) n.nodeValue = (n.nodeValue ?? '').replace(/\S/g, '⠀');
  const cls = [...st.classList].filter((c) => c !== 'st').join(' ');
  return `<div class="gh4 ${cls}" style="${esc(st.getAttribute('style') ?? '')}">${st.innerHTML}</div>`;
}

export interface Shutter { n: number; mode: Exclude<ShutterMode, 'off'>; from: string; to: string; ghost: string }

/** Wraps the new page: it slides in from the right while the blade with the Nova eye sweeps left over the old one. */
export function withShutter(page: string, s: Shutter): string {
  const key = `shut${s.n}`;
  const ghost = `<div class="dom" style="position:absolute;left:0;top:0;width:960px;height:540px;z-index:41;pointer-events:none" aria-hidden="true" data-testid="dom-shutter" data-mode="${s.mode}">
  <div class="ghl4 ${s.mode}" data-once="${key}g">${s.ghost}</div>
  ${s.mode === 'blade' ? `<div class="shw4" data-once="${key}b">
    <div class="streak" style="left:190px;top:120px;width:180px"></div><div class="streak" style="left:230px;top:250px;width:240px"></div><div class="streak" style="left:170px;top:400px;width:160px"></div><div class="streak" style="left:270px;top:470px;width:200px"></div>
    <div class="shut" style="left:0"></div>
    <div class="eye4" style="left:42px;top:200px"></div>
    <div class="dest" style="left:-100px;top:290px;width:360px;text-align:center"><small>${esc(s.from.toUpperCase())} ▸</small>${esc(s.to.toUpperCase())}</div>
  </div>` : ''}
</div>`;
  return `<div class="slin4 ${s.mode}" data-once="${key}s">${page}</div>${ghost}`;
}
