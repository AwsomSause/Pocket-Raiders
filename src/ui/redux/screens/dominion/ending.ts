// DOMINION D17: the ending page (design Part 5 §7). No mockup draws it, so it is made of round-4 parts: s10's region
// cards over the night sea (the Empire Map: every region coloured, the path that took it, the Hero who stood last), s7's
// ledger page (the Ledger graph across every day of the run) and s5's crew rows (each member's first line, the day they
// joined, and their last line now). Plain data in from core/dominion/ending.ts; the scene's EndingController keeps the
// page and the keys (◀ ▶ crew pages, Enter closes the books, Esc back).

import './dominion.css';
import type { EndingModel, EndRegion, Journey } from '../../../../core/dominion/ending';
import { act, esc } from '../../kit';
import { face } from './crew';
import { stage, WHEEL_KEY } from './views';

const INK = '#3a2a18', GREEN = '#2d7a3e', RED = '#a8322a', HEAD = '#5a1e14', SOFT = '#7a6040';
const PAGE = `background:linear-gradient(90deg,#e6d6ae,#f4e9cc 10%,#f2e6c6 88%,#cdb88a);box-shadow:inset 0 0 0 2px #b79f6c,0 6px 0 rgba(0,0,0,.35);color:${INK}`;

function region(r: EndRegion, i: number, n: number): string {
  const w = Math.floor((928 - (n - 1) * 12) / n), left = 16 + i * (w + 12);
  const dim = r.tone === 'k' ? ';filter:saturate(.45) brightness(.8)' : r.tone === 'r' ? ';border-color:#ff8a7a' : '';
  return `<div class="pnl${r.tone === 'g' || r.tone === 'y' ? ' gild' : ''}" style="left:${left}px;top:62px;width:${w}px;height:112px;padding:8px 12px;overflow:hidden;background:radial-gradient(circle at 85% 20%,rgba(${r.glow},.35),transparent 60%),linear-gradient(180deg,#141a3a,#0c1230)${dim}" data-testid="dom-end-region-${r.id}">
    <div class="row sp"><b style="font:800 24px var(--logo);font-style:italic;color:#fff;text-shadow:0 3px 0 ${r.shade}">${esc(r.name)}</b><span class="pill ${r.tone}" style="margin-right:34px">${esc(r.pill)}</span></div>
    <div class="col xs" style="gap:2px;margin-top:4px;font-size:14px">
      ${r.path ? `<span>Taken by <b class="y">${esc(r.path)}</b>${r.day ? ` · run day ${r.day}` : ''}</span>` : ''}
      ${r.hero ? `<span class="mu">${esc(r.hero)}</span>` : ''}
      ${r.holder ? `<span>Holder <b>${esc(r.holder)}</b></span>` : ''}
    </div>
  </div>
  <div class="crest" style="left:${left + w - 40}px;top:56px;--s:34px;background:linear-gradient(180deg,${r.colour},${r.colour} 55%,${r.shade})">${esc(r.crest)}</div>`;
}

function graph(m: EndingModel): string {
  const g = m.graph, W = 400, H = 120;
  const n = g.points.length;
  const x = (i: number): number => (n <= 1 ? 0 : Math.round((i / (n - 1)) * W));
  const y = (v: number): number => Math.round(H - ((v - g.min) / Math.max(1, g.max - g.min)) * (H - 8) - 4);
  const pts = g.points.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const zero = y(0);
  const body = g.empty
    ? `<div style="height:${H}px;display:grid;place-items:center;color:${SOFT};font-size:15px">${esc(g.empty)}</div>`
    : `<svg width="${W}" height="${H + 14}" viewBox="0 0 ${W} ${H + 14}" style="display:block;margin-top:6px" aria-hidden="true" data-testid="dom-end-graph">
      <line x1="0" y1="${zero}" x2="${W}" y2="${zero}" stroke="#cdb88a" stroke-width="1"/>
      <polygon points="${pts} ${W},${zero} 0,${zero}" fill="rgba(45,122,62,.14)"/>
      <polyline points="${pts}" fill="none" stroke="${GREEN}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="${x(n - 1)}" cy="${y(g.points[n - 1]!)}" r="5" fill="${g.points[n - 1]! >= 0 ? GREEN : RED}"/>
      <g font-family="Pixelify Sans" font-size="12" fill="${SOFT}"><text x="0" y="${H + 13}">Run day ${g.from}</text><text x="${W - 70}" y="${H + 13}">Run day ${g.to}</text></g>
    </svg>`;
  return `<div class="a" style="left:16px;top:186px;width:452px;height:204px;padding:10px 18px;border-radius:10px;z-index:5;${PAGE}" data-testid="dom-end-ledger">
    <div class="row sp" style="border-bottom:2px solid #8a6a3a;padding-bottom:3px;white-space:nowrap"><b style="font:700 15px var(--regal);letter-spacing:.04em;color:${HEAD}">THE LEDGER · EVERY DAY</b><span style="font-size:12px;color:${SOFT}">${esc(g.peak)}</span></div>
    ${body}
  </div>`;
}

const journey = (j: Journey): string => `<div class="row" style="gap:10px;align-items:flex-start;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.08)" data-testid="dom-end-member-${j.id}">
    ${face(j.look, 40, 'width:40px;height:44px;object-fit:contain;object-position:bottom;flex:none')}
    <div class="col" style="gap:1px;min-width:0;font-size:13px">
      <span><b style="font-size:15px">${esc(j.name)}</b> <span class="pill v" style="font-size:11px">${esc(j.rank)}</span> <span class="mu">${esc(j.where)}</span></span>
      <span class="mu" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(j.joined)}: “${esc(j.first)}”</span>
      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Now: “${esc(j.last)}”</span>
    </div>
  </div>`;

export function endingView(m: EndingModel, notice: string | null): string {
  const crew = m.crew.length ? m.crew.map(journey).join('') : '<div class="mu" style="padding:12px 0">Nobody stayed. The Boss did this alone.</div>';
  const pay = m.pay.map(([k, v]) => `<span class="row" style="gap:6px"><span class="mu">${esc(k)}</span><b class="y">${esc(v)}</b></span>`).join('');
  return stage(`
  <div class="layer" style="background:linear-gradient(180deg,#0b1030,#1a2458 55%,#2a3a78)"></div>
  <div class="stars twinkle" style="height:240px"></div>
  <div class="layer" style="top:300px;background:repeating-linear-gradient(180deg,rgba(120,170,255,.10) 0 2px,transparent 2px 12px),linear-gradient(180deg,#14306a,#0c1c44)"></div>
  <div class="ttl" style="--t1:#7a1414;--t2:#d0302a" data-testid="dom-ending">${esc(m.title)} <span class="sub">· ${esc(m.sub)}</span></div>
  <div class="keys">${WHEEL_KEY}${m.pages > 1 ? `<span class="key"${act('endPage', -1)}>◀▶</span><span>${esc(`page ${m.page + 1}/${m.pages}`)}</span>` : ''}<span class="key" style="color:#8fffb0"${act('endClose')}>Enter</span><span${act('endClose')} data-testid="dom-end-close">Close the books</span><span class="key"${act('back')}>Esc</span><span>back</span></div>
  ${m.map.map((r, i) => region(r, i, m.map.length)).join('')}
  ${graph(m)}
  <div class="pnl" style="left:484px;top:186px;width:460px;height:204px;padding:10px 14px;overflow:hidden" data-testid="dom-end-crew">
    <div class="hd y" style="font-size:15px">WHO WAS IN IT</div>
    <div class="col">${crew}</div>
  </div>
  <div class="a row" style="left:16px;top:398px;width:928px;gap:22px;font-size:14px;z-index:5" data-testid="dom-end-pay"><b class="y">HOW FAR IT GOT</b>${pay}</div>
  <div class="tbox" style="left:16px;top:434px;width:928px;height:92px;font-size:16px;line-height:1.4" data-testid="dom-end-tbox"><span class="who">${esc(m.tbox.who)}</span>${esc(m.line)} ${esc(m.note ?? m.tbox.text)} <span class="mu" style="font-size:14px">${esc(m.charters)}</span><span class="more blink">▼</span></div>
  ${notice ? `<div class="a pnl" style="left:180px;top:200px;width:600px;padding:14px 18px;z-index:40;font-size:16px"${act('dismiss')} data-testid="dom-notice">${esc(notice)} <span class="kc">Enter</span></div>` : ''}
  `);
}
