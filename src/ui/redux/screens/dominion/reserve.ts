// DOMINION slice D4 screens: mockup 11 (the Pokémon Reserve, a PC box) and mockup 12 (the Rank Pyramid), ported from
// plans/evil-mode-rework/mockups-redesign/index.html sections s11 and s12 with their five passes (rays, the PC box
// header, the bobbing pick, the ghost in the empty slot, key caps; the capstone, motes, the gold thread). Plain data in
// from core/dominion/reserveScreens.ts.

import { PYRAMID_FX, reserveFx } from './reserveFx';
import { monName } from '../../../../core/dominion/crew';
import type { PyramidModel, ReserveModel, SlotModel } from '../../../../core/dominion/reserveScreens';
import { act, esc, mini, TYPE_COLORS } from '../../kit';
import { rxUrl } from '../../assets';
import { face } from './crew';
import { stage } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
const cap = (t: string): string => t[0]!.toUpperCase() + t.slice(1);
const col = (t: string): string => TYPE_COLORS[cap(t)] ?? '#888';
type MonFile = (species: string) => string | null;
const pic = (file: MonFile, species: string, size: number, style = ''): string => {
  const f = file(species);
  return f ? `<span style="display:inline-flex;align-items:center;justify-content:center;${style}">${mini(f, size)}</span>` : '';
};

function slot(s: SlotModel, file: MonFile, i: number): string {
  const cls = s.bad ? 'slot bad' : s.ace ? 'slot ace' : 'slot';
  return `<div class="${cls}"${act('takeSlot', i)} data-testid="dom-slot-${i}" style="${s.bad ? 'opacity:.75' : ''}">${pic(file, s.species, 50)}<span class="xs">${esc(monName(s.species))} ${s.level}${s.ace ? ' ★' : ''}</span>${s.bad ? `<span class="xs rd">${esc(s.bad)}</span>` : s.pens ? `<span class="xs y">Pens ${s.pens}d</span>` : ''}</div>`;
}

// ---------- mockup 11: the Reserve ----------

export function reserveView(m: ReserveModel, file: MonFile, notice: string | null, focus: 'box' | 'team', slotAt: number): string {
  const w = m.who;
  const portrait = w.id === 'boss'
    ? `<img class="px" src="${img('g-relic-crown')}" alt="" style="position:absolute;left:18px;top:30px;width:48px;height:48px">`
    : face(w.look, 102, 'position:absolute;left:9px;top:4px;width:66px;height:102px');
  const ghost = m.pick && m.pick.fits && w.id !== 'boss'
    ? `<div class="slot empty pulse" style="box-shadow:0 0 0 3px var(--ink),inset 0 0 0 2px #ffd23f,0 0 16px rgba(255,210,63,.55)" data-testid="dom-ghost">${pic(file, m.pick.species, 46, 'opacity:.55;filter:drop-shadow(0 0 4px #ffd23f)')}<span class="xs y">${esc(monName(m.pick.species))}?</span></div>`
    : '';
  const empties = Math.max(0, w.size - w.slots.length - (ghost ? 1 : 0));
  const teamSlots = w.slots.map((s, i) => slot(s, file, i)).join('') + ghost + '<div class="slot empty"></div>'.repeat(Math.min(empties, ghost ? 1 : 2));
  const bad = w.slots.find((s) => s.bad);
  const why = bad ? `<div class="xs rd" style="line-height:1.3;min-width:0">${esc(monName(bad.species))} stays on the team but can't be sent out until the caps rise.</div>` : '';
  const other = m.other
    ? `<div class="hd" style="margin-top:12px;font-size:15px">${esc(m.other.name.toUpperCase())} · ${esc(m.other.pill)}<span class="r">${m.other.ace ? 'Ace slot' : 'Next'}</span></div>
    <div class="row" style="gap:10px">${m.other.slots.slice(0, 2).map((s, i) => slot(s, file, 100 + i)).join('') || '<div class="slot empty"></div>'}<div class="sm" style="line-height:1.35">${esc(m.other.note)}</div></div>`
    : '';
  const tiles = m.tiles.map((t, i) => {
    const rays = t.on ? '<div class="rays turn" style="left:-30px;top:-30px;width:190px;height:190px;z-index:-1;--rc:rgba(255,220,110,.35)"></div>' : '';
    return `<div class="tile${t.on ? ' on' : ''}${t.fits ? '' : ' no'}" style="--c:${col(t.type)};${t.on ? 'overflow:visible' : ''}"${act('tile', i)} data-over="tileOver" data-testid="dom-tile-${i}">${rays}${pic(file, t.species, 60, `width:76px;height:64px;margin-bottom:auto;margin-top:2px${t.on ? '' : ''}`).replace('<span style', t.on ? '<span class="bob" style' : '<span style')}<b>${esc(monName(t.species))}</b><span>Lv ${t.level} · ${t.bst}</span><span class="pill ${t.fits ? 'g' : 'r'}">${esc(t.tag)}</span></div>`;
  }).join('') || `<div class="mu sm" style="grid-column:1/-1;padding:30px 0;text-align:center">${m.fitsOnly ? 'Nothing in the Reserve fits.' : 'The Reserve is empty. Catch and Steal tasks fill it.'}</div>`;
  const at = m.pick ? m.tiles.indexOf(m.pick) : -1;
  const cur = at >= 0 && focus === 'box' ? `<div class="cursor" style="left:352px;top:${130 + Math.floor(at / 4) * 148}px"></div><div class="glint" style="left:${478 + (at % 4) * 145}px;top:${128 + Math.floor(at / 4) * 148}px;--g:20px"></div>` : '';
  const notes = m.notes.map((n) => `<span class="row" style="gap:5px">${esc(n)}</span>`).join('');
  const msg = notice ? `<div class="al y" style="position:absolute;left:352px;top:418px;width:592px;z-index:25" data-testid="dom-notice"><img class="ic" src="${img('g-soothe-bell')}" alt=""><span>${esc(notice)}</span></div>` : '';
  const ctaIc = m.pick ? pic(file, m.pick.species, 34) : '';
  const hunt = w.hunt ? `<div class="row xs mu" style="margin-top:8px;gap:6px"><span class="kc">H</span>${esc(w.hunt)}</div>` : '';
  const slotKeys = focus === 'team' ? `<div class="row xs y" style="margin-top:6px;gap:6px" data-testid="dom-slot-focus"><span class="kc">◀▶</span>pick a Pokémon <span class="kc">Enter</span>take it back (Evening)</div>` : '';
  return stage(`<div class="layer" style="background:radial-gradient(500px 300px at 650px 250px,rgba(160,64,160,.28),transparent 70%)"></div>
  <div class="ttl" style="--t1:#7a3a9a;--t2:#a040a0">Pokémon <span class="sub">· Reserve</span></div>
  <div class="a row" style="left:378px;top:16px;gap:8px;z-index:30">${m.types.map((t) => `<span class="type" style="--c:${col(t)}">${cap(t).toUpperCase()}</span>`).join('')}<span class="sm mu">Team Types</span></div>
  <div class="keys"><span class="key" data-testid="dom-reserve-count">${esc(m.count)}</span><span class="key">${esc(m.hq)}</span></div>

  <div class="pnl" style="left:16px;top:70px;width:320px;height:458px;padding:12px 14px" data-testid="dom-give">
    <div class="hd"><img class="ic" src="${img('g-fame-checker')}" alt="">GIVE TO<span class="r row" style="gap:4px"><span class="kc"${act('who', -1)}>W</span><span data-testid="dom-who">${esc(w.name)}</span><span class="kc"${act('who', 1)}>E</span></span></div>
    <div class="row" style="gap:12px;align-items:flex-start">
      <div style="position:relative;width:84px;height:108px;flex:none;border-radius:8px;background:radial-gradient(circle at 50% 85%,rgba(166,120,255,.6),#1a1438 70%);box-shadow:0 0 0 3px var(--ink);overflow:hidden">${portrait}</div>
      <div class="col" style="gap:4px;font-size:15px;min-width:0">
        <span class="pill k" style="align-self:flex-start">${esc(w.pill)}</span>
        <div class="row sp"><span>Lv cap</span><b class="num y" style="font-size:24px" data-testid="dom-lvcap">${w.lvCap}</b></div>
        <div class="row sp"><span>BST cap</span><b class="num y" style="font-size:24px" data-testid="dom-bstcap">${w.bstCap ?? '—'}</b></div>
        <span class="xs mu">${esc(w.sum)}</span>
      </div>
    </div>
    ${w.id === 'boss' ? '' : `<div class="hd" style="margin-top:12px;font-size:15px">${esc(w.name.toUpperCase())}'S TEAM<span class="r">${w.slots.length} of ${w.size}</span></div>
    <div class="row" style="gap:10px">${teamSlots}${why}</div>${slotKeys}${hunt}`}
    ${other}
    <div class="a row xs" style="left:14px;right:14px;bottom:10px;gap:5px;row-gap:5px;flex-wrap:wrap;z-index:9;color:#dfe5ff"><span class="kc">←↑↓→</span>pick<span class="kc">[ ]</span>box<span class="kc">F</span>fits<span class="kc">Tab</span>team<span class="kc">X</span>set free<span class="kc">Esc</span>HQ</div>
  </div>

  <div class="pnl" style="left:352px;top:70px;width:592px;height:392px;padding:12px 14px;background:radial-gradient(circle at 12px 12px,rgba(255,255,255,.05) 0 5px,transparent 6px) 0 0/34px 34px,linear-gradient(180deg,rgba(52,40,86,.97),rgba(28,24,57,.97))" data-testid="dom-reserve">
    <div class="hd"><img class="ic" src="${img('g-ball')}" alt="">RESERVE<span class="boxnm"><span${act('boxPage', -1)}>◀</span> BOX ${m.page + 1} · STORES <span${act('boxPage', 1)}>▶</span></span><span class="r row" style="gap:6px"><span class="bt${m.fitsOnly ? ' y' : ''}" style="font-size:13px;padding:3px 9px"${act('fitsOnly', 1)} data-testid="dom-fits">Fits ${esc(w.id === 'boss' ? 'Boss' : w.name)}</span><span class="bt${m.fitsOnly ? '' : ' y'}" style="font-size:13px;padding:3px 9px"${act('fitsOnly', 0)}>All</span><span class="bt ghost" style="font-size:13px;padding:3px 9px"${act('autoFill')} data-testid="dom-auto">Auto-fill: ${m.auto ? 'on' : 'off'} <span class="kc" style="min-width:18px;height:18px;font-size:11px">A</span></span></span></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${tiles}</div>
    <div class="row" style="gap:16px;margin-top:10px;font-size:13.5px;color:var(--muted)">${notes}</div>
  </div>
  ${msg}
  <div class="cta${m.cta.ok ? ' shine' : ''}" style="left:352px;top:474px;width:592px;height:52px;font-size:22px;${m.cta.ok ? '' : 'filter:saturate(.3);opacity:.75'}"${act('giveIt')} data-testid="dom-give-cta"><span class="kc" style="position:absolute;right:14px">Enter</span>${ctaIc}${esc(m.cta.text)}</div>
  ${cur}
  ${reserveFx(at >= 0 && focus === 'box' ? at : -1)}
`, '', 'kl-gold check vign grain');
}

// ---------- mockup 12: the Rank Pyramid ----------

export function pyramidView(m: PyramidModel, notice: string | null): string {
  const tiers = m.tiers.map((t) => {
    const seats = t.seats.length
      ? `<span class="seats">${t.seats.map((s) => `<i class="seat${s === 'o' ? ' open' : s === 'w' ? ' open want pulse' : ''}"></i>`).join('')}</span>`
      : t.count ? `<span class="xs" style="opacity:.85">${esc(t.count)}</span>` : '';
    const crown = t.n === 16 ? `<img class="ic s" src="${img('g-relic-crown')}" alt="">` : '';
    return `<div class="tier ${t.z}${t.hot ? ' hot' : ''}" style="left:${t.left}px;top:${t.top}px;width:${t.width}px;${t.locked ? 'opacity:.55' : ''}" data-testid="dom-tier-${t.n}" title="${t.locked ? 'Needs a bigger HQ' : ''}"><span class="rk">${t.n === 2 ? '2·1' : t.n}</span>${crown}<b>${esc(t.label)}</b>${seats}</div>`;
  }).join('');
  const cands = m.cands.map((c, i) => `<div class="ch${i === 0 ? ' on' : ''}" style="--stripe:${c.stripe};padding:8px 10px 8px 22px;${i ? 'margin-top:10px' : ''}" data-testid="dom-cand-${c.id}">
      <div class="row" style="gap:10px">${face(c.look, 64, 'width:44px;height:64px;object-fit:contain;flex:none')}<div class="col" style="gap:3px;flex:1;min-width:0">
        <div class="row sp"><b style="font-size:19px">${esc(c.name)}${c.mark ? ` <span class="mkp" style="display:inline-grid;width:22px;height:22px;font-size:12px;color:${c.mark.colour}" title="${esc(c.mark.squad)}" data-testid="dom-cand-mark">${esc(c.mark.ch)}</span>` : ''}</b><span class="pill ${i === 0 ? 'v' : 'k'}">${esc(c.rank)}</span></div>
        <span class="sub">Lv ${c.level} · Loyalty <b>${c.loyalty}</b> · Ambition <b class="${c.ambition >= 50 ? 'rd' : ''}">${c.ambition}</b></span>
        <div class="mt ${i === 0 ? 'g' : 'r'} t" style="--v:${i === 0 ? c.loyalty : c.ambition}"></div></div></div>
    </div>`).join('');
  const alert = m.alert ? `<div class="al r" style="margin-top:12px;font-size:14px"><img class="ic" src="${img('g-dark-gem')}" alt=""><span>${esc(m.alert)}</span></div>` : '';
  const info = m.info.map((l) => `<div class="sm mu" style="margin-top:6px;line-height:1.3">${esc(l)}</div>`).join('');
  const thread = (() => {
    if (!m.thread) return '';
    const { x, y } = m.thread;
    const top = Math.min(y, 110) - 12;
    const w = Math.max(20, 620 - x), h = Math.max(30, y - top + 12);
    const sy = y - top, ey = 110 - top;
    return `<svg class="a" style="left:${x}px;top:${top}px;z-index:6;pointer-events:none" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="M 6 ${sy} C ${Math.round(w * 0.4)} ${sy}, ${Math.round(w * 0.6)} ${ey}, ${w - 4} ${ey}" fill="none" stroke="#ffd23f" stroke-width="3" stroke-dasharray="6 6" style="filter:drop-shadow(0 0 4px #ffd23f)"/><circle cx="6" cy="${sy}" r="6" fill="#ffd23f"/></svg>`;
  })();
  const msg = notice ? `<div class="al y" style="position:absolute;left:16px;top:70px;width:180px;z-index:35;font-size:13px" data-testid="dom-notice"><span>${esc(notice)}</span></div>` : '';
  return stage(`<div class="layer" style="background:radial-gradient(360px 260px at 304px 90px,rgba(255,210,63,.32),transparent 70%),radial-gradient(500px 320px at 304px 400px,rgba(123,63,160,.3),transparent 70%)"></div>
  <div class="ttl" style="--t1:#7b3fa0;--t2:#b04ad0">Roster <span class="sub">· Rank Pyramid</span></div>
  <div class="keys"><span class="key" data-testid="dom-crew-count">${esc(m.crew)}</span><span class="key">${esc(m.hq)}</span></div>
  <div class="rays turn" style="left:144px;top:-90px;width:320px;height:320px;z-index:2;--rc:rgba(255,220,110,.32)"></div>
  <div class="beam sweep" style="left:270px;--a0:-14deg;--a1:14deg;opacity:.55;z-index:1"></div>
  ${tiers}
  <div class="pnl" style="left:616px;top:70px;width:328px;height:458px;padding:12px 14px" data-testid="dom-seat">
    <div class="hd y"><img class="ic" src="${img('g-relic-statue')}" alt="">${esc(m.head)}<span class="r">${esc(m.headRight)}</span></div>
    ${cands}
    ${alert}
    ${info}
    <div class="col" style="gap:5px;margin-top:12px;font-size:13px">
      <span class="xs mu caps">Bands</span>
      <div class="row" style="flex-wrap:wrap;gap:5px"><span class="band-k z-st">Street 1–3</span><span class="band-k z-crew">Crew 4–6</span><span class="band-k z-off">Officers 7–9</span><span class="band-k z-cmd">Command 10–12</span><span class="band-k z-inner">Inner Circle 13–15</span></div>
    </div>
    <div class="row xs mu" style="position:absolute;left:14px;bottom:70px;gap:5px"><span class="kc">▲▼</span>member<span class="kc">D</span>demote<span class="kc">S</span>strip<span class="kc">Esc</span>back</div>
    <div class="cta${m.cta.ok ? ' shine' : ''}" style="position:absolute;left:14px;right:14px;bottom:12px;height:50px;font-size:${m.cta.ok ? 21 : 15}px;${m.cta.ok ? '' : 'filter:saturate(.3);opacity:.8'}"${act('promoteIt')} data-testid="dom-promote">${esc(m.cta.text)}${m.cta.ok ? ' ▶ <span class="kc">Enter</span>' : ''}</div>
  </div>
  ${msg}
  <div class="glint" style="left:254px;top:72px;--g:18px"></div>
  <div class="glint" style="left:392px;top:96px;--g:13px;animation-delay:-1.8s"></div>
  <div class="a" style="left:256px;top:42px;width:96px;height:30px;z-index:6;background:linear-gradient(180deg,#fff2b0,#e3b955 60%,#9a6a10);clip-path:polygon(50% 0,100% 100%,0 100%);filter:drop-shadow(0 0 10px rgba(255,210,63,.7))"></div>
  <div class="a" style="left:292px;top:54px;width:24px;height:16px;z-index:7;display:grid;place-items:center;font:800 13px/1 var(--logo);font-style:italic;color:#4a1f6e">${esc(m.initial)}</div>
  <div class="embers" style="left:60px;top:80px;width:500px;height:440px;z-index:6;--ec:#ffe27a;background-size:250px 220px;opacity:.9"></div>
  ${thread}
  ${PYRAMID_FX}`, '', 'kl-gold check vign grain');
}
