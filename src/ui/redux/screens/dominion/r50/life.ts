// DOMINION redesign R6, part 2 (pass 50): the pages whose rules came last (core/dominion/life.ts). The back-alley Clinic
// (mockup `clinic`, pass 41), Care time (`care`, pass 41), a Region Event: Fireworks Night (`festival`, pass 34) and the
// Blackout (`blackout`, pass 39), the Prize Corner (`prize`, pass 34) and the chapter card (`chapter`, pass 40).
// Display data in, HTML out: the scene keeps the cursors and does the acts.

import './r6.css';
import { bg, esc, frame, keys, map, page, rep, SP, type R5Key, type R5Run, type R5Speaker } from './kit';

const act = (name: string, arg: string | number = ''): string => `data-act="${esc(name)}" data-arg="${esc(String(arg))}"`;
const note = (n: string | null): string => (n ? `<div class="sd25" ${act('dismiss')} data-testid="dom-notice">${esc(n)}<i class="nx23" data-nocheck="">▼</i></div>` : '');
const hpCls = (hp: number): string => (hp >= 50 ? 'ok' : hp >= 25 ? 'mid' : 'low');

// ---------- the Clinic (mockup `clinic`) ----------

export interface R5ClinicRow { name: string; pic: string; hp: number; price: string }

export function r5Clinic(v: { rows: readonly R5ClinicRow[]; at: number; doctor: R5Speaker; doc: string; line: string; just: string | null; notice: string | null }, run: R5Run): string {
  const rows = map(v.rows, (r, i) => `<button class="pr41${i === v.at ? ' r6-on' : ''}" ${act('clinicPick', i)} data-testid="r6-clinic-${i}" style="--i:${i};--d:${i * 60}ms">${r.pic}<b>${esc(r.name)}</b><span><i class="${hpCls(r.hp)}" style="width:${r.hp}%"></i></span><em>${esc(r.price)}</em></button>`);
  const machine = `<section class="cm41" data-m="panel"><span class="doc" data-nocheck="">${v.doc}</span><span class="mach" data-nocheck=""><i class="scr41"></i>${rep(6, (i) => `<u style="--i:${i}"></u>`)}</span><i class="glow" data-nocheck=""></i></section>`;
  const ks: R5Key[] = [['↑↓', 'Pokémon'], ['Enter', 'heal all', 'clinicAll'], ['J', 'just one', 'clinicOne'], ['Esc', 'leave', 'partyBack']];
  const ctas = v.just ? [[`Just ${v.just}`, 'clinicOne', '', 'r6-clinic-one'] as const, ['Heal them all', 'clinicAll', '', 'r6-clinic-all'] as const] : [['Leave', 'partyBack', '', 'r6-clinic-leave'] as const];
  return frame({
    id: 'clinic', g: 'Pokémon', kind: 'cl41', bg: 'night', top: { title: 'Clinic', sub: 'Back alley · no questions' },
    body: `${machine}\n  <section class="pn cp41" data-m="det" data-testid="r6-clinic"><h3><i>Your party</i></h3>${rows}</section>${note(v.notice)}`,
    who: v.doctor, line: v.line, ctas, keys: ks, run, noTabs: true,
  });
}

// ---------- Care time (mockup `care`) ----------

export interface R5CareView {
  name: string;
  pic: string;
  tools: readonly { name: string; icon: string }[];
  tool: number;
  hearts: number;
  rows: readonly (readonly [string, string])[];
  speaker: R5Speaker;
  line: string;
  cta: string;
  notice: string | null;
}

export function r5Care(v: R5CareView, run: R5Run): string {
  const tools = map(v.tools, (t, i) => `<button class="tl41${i === v.tool ? ' on' : ''}" ${act('careTool', i)} data-testid="r6-care-tool-${i}" style="--i:${i};--d:${i * 90}ms">${SP(t.icon, 40)}<b>${esc(t.name)}</b></button>`);
  const scene = `<section class="cs41" data-m="panel"><i class="rug" data-nocheck=""></i><span class="hd" data-nocheck="">${v.pic}</span><span class="hts" data-nocheck="">${rep(6, (i) => `<i style="--i:${i};--x:${[30, 55, 70, 40, 62, 48][i]}%"></i>`)}</span><span class="tools">${tools}</span></section>`;
  const hearts = `<div class="af41" data-testid="r6-care-hearts" data-n="${v.hearts}"><b>Affection</b><span>${rep(5, (i) => `<i class="${i < v.hearts ? 'on' : ''}" style="--d:${i * 120}ms"></i>`)}</span></div>`;
  const rows = map(v.rows, ([k, val], i) => `<div class="row40" style="--i:${i};--d:${i * 80}ms"><b>${esc(k)}</b><i>${esc(val)}</i></div>`);
  const ks: R5Key[] = [['←→', 'tool'], ['↑↓', 'Pokémon'], ['Enter', 'use', 'careGo'], ['Esc', 'back', 'partyBack']];
  return frame({
    id: 'care', g: 'Pokémon', kind: 'ct41', bg: 'hq', top: { title: 'Care time', sub: `${v.name} · after the job` },
    body: `${scene}\n  <section class="pn cf41" data-m="det" data-testid="r6-care"><h3><i>${esc(v.name)}</i></h3>${hearts}${rows}</section>${note(v.notice)}`,
    who: v.speaker, line: v.line, ctas: [['Back', 'partyBack', '', 'r6-care-back'], [v.cta, 'careGo', '', 'r6-care-go']], keys: ks, run,
  });
}

// ---------- a Region Event: Fireworks Night (mockup `festival`) and the Blackout (`blackout`) ----------

export interface R5EventPick { name: string; sub: string; prize: string; chance: string; sprite: string; dark: boolean | null }

export interface R5RegionView {
  kind: 'festival' | 'blackout';
  title: string;
  sub: string;
  picks: readonly R5EventPick[];
  at: number;
  speaker: R5Speaker;
  line: string;
  /** Days the power stays out (the Blackout's clock) and the share of the event left. */
  left: string;
  leftPct: number;
  pass: string;
  go: string;
  open: boolean;
  /** After the action: the roll and what it did (the text waits for a key). */
  result: { word: string; line: string; ok: boolean } | null;
  crowd: readonly string[];
  notice: string | null;
}

export function r5Region(v: R5RegionView, run: R5Run): string {
  const ctas = v.result || !v.open ? [['Close', 'regionClose', '', 'r6-region-close'] as const] : [[v.pass, 'regionPass', '', 'r6-region-pass'] as const, [v.go, 'regionGo', '', 'r6-region-go'] as const];
  const roll = v.result ? `<div class="roll10${v.result.ok ? '' : ' r6-miss'} r6-region-roll" data-testid="r6-region-roll"><b>${esc(v.result.word)}</b><span>${esc(v.result.line)}</span></div>` : '';
  if (v.kind === 'festival') {
    const sky = `<div class="sky34" data-nocheck="">${rep(7, (i) => `<i style="--x:${6 + i * 6}%;--y:${10 + (i % 5) * 7}%;--c:${['#ffd75a', '#ff5d8a', '#5ad1ff', '#ffb86a', '#b8ff6a', '#ff8a3d', '#d18aff'][i]};--d:${(i * 0.45).toFixed(2)}s"></i>`)}</div>`;
    const crowd = `<div class="crowd34" data-nocheck="">${map(v.crowd, (k, i) => `<i style="--i:${i}">${SP(k, 64)}</i>`)}</div>`;
    const jobs = map(v.picks, (p, i) => `<button class="o29${i === v.at ? ' on' : ''}" ${act('regionPick', i)} data-testid="r6-region-${i}" style="--i:${i};--d:${i * 90}ms"><b>${esc(p.name)}</b><em>${esc(p.sub)}</em><i>${esc(p.prize)}</i></button>`);
    const ks: R5Key[] = [['↑↓', 'job'], ['Enter', 'plan'], ['Esc', 'watch']];
    return frame({
      id: 'festival', g: 'Events', kind: 'fe34', bg: 'night', top: { title: v.title, sub: v.sub, icon: 'g-letter' },
      body: `${sky}\n  ${crowd}\n  <section class="pn fj34" data-m="det" data-testid="r6-region"><h3><i>Festival jobs</i></h3>${jobs}</section>${roll}${note(v.notice)}`,
      who: v.speaker, line: v.line, ctas, keys: ks, run, noTabs: true,
    });
  }
  const cards = map(v.picks, (p, i) => `<button class="bb39 ${p.dark ? 'open' : 'shut'}${i === v.at ? ' on' : ''}" ${act('regionPick', i)} data-testid="r6-region-${i}" style="--d:${i * 140}ms"><span class="bd">${SP(p.sprite, 92)}<i class="win" data-nocheck=""></i></span><b>${esc(p.name)}</b><em>${esc(p.sub)}</em><i class="tg">${p.dark ? 'Dark' : 'Lit'}</i></button>`);
  const ks: R5Key[] = [['←→', 'target'], ['Enter', 'plan'], ['Esc', 'stay in']];
  return frame({
    id: 'blackout', g: 'Events', kind: 'bo39', bg: 'night', top: { title: v.title, sub: v.sub, icon: 'g-letter' },
    body: `<section class="bo39" data-m="panel" data-testid="r6-region">${cards}</section>\n  <div class="tm39" data-m="card"><small>Power back in</small><b data-testid="r6-region-left">${esc(v.left)}</b><span><i style="width:${v.leftPct}%"></i></span></div>${roll}${note(v.notice)}`,
    who: v.speaker, line: v.line, ctas, keys: ks, run, noTabs: true,
  });
}

// ---------- the Prize Corner (mockup `prize`) ----------

export interface R5Prize { name: string; pic: string; coins: string; can: boolean }

export function r5Prize(v: { prizes: readonly R5Prize[]; at: number; coins: string; speaker: R5Speaker; line: string; swap: string; result: { word: string; line: string; ok: boolean } | null; notice: string | null }, run: R5Run): string {
  const cards = map(v.prizes, (p, i) => `<button class="pr34${i === v.at ? ' on' : ''}${p.can ? '' : ' r6-bad'}" ${act('prizePick', i)} data-testid="r6-prize-${i}" style="--d:${i * 90}ms"><span class="cs">${p.pic}</span><b>${esc(p.name)}</b><em>${esc(p.coins)} coins</em></button>`);
  const roll = v.result ? `<div class="roll10${v.result.ok ? '' : ' r6-miss'} r6-region-roll" data-testid="r6-prize-roll"><b>${esc(v.result.word)}</b><span>${esc(v.result.line)}</span></div>` : '';
  const ks: R5Key[] = [['←→', 'prize'], ['Enter', 'trade', 'prizeTrade'], ['B', 'buy coins', 'prizeBuy', 'r6-prize-buy'], ['Esc', 'back', 'prizeClose']];
  return frame({
    id: 'prize', g: 'Events', kind: 'pz34', bg: 'hq', top: { title: 'Prize Corner', sub: 'Game Corner', icon: 'g-letter' },
    body: `<section class="pz34" data-m="panel" data-testid="r6-prize">${cards}</section>\n  <div class="coin34" data-nocheck="" ${act('prizeBuy')}><b data-testid="r6-coins">${esc(v.coins)}</b><em>coins</em></div>${roll}${note(v.notice)}`,
    who: v.speaker, line: v.line, ctas: [['Back', 'prizeClose', '', 'r6-prize-back'], [v.swap, 'prizeSwap', '', 'r6-prize-swap']], keys: ks, run, noTabs: true,
  });
}

// ---------- the chapter card (mockup `chapter`) ----------

export function r5Chapter(v: { n: number; title: string; line: string; left: string; right: string }, run: R5Run): string {
  const letters = map([...v.title.toUpperCase()], (c, i) => `<i style="--i:${i}">${c === ' ' ? '&nbsp;' : esc(c)}</i>`);
  const box = `<section class="foot f23 f13" data-m="box"><p data-testid="r6-chapter-line">Press Enter to begin.<i class="nx23" data-nocheck="">▼</i></p><div class="ch23"><button class="cta rc13 on" ${act('chapterGo')} data-testid="r6-chapter-go">Begin</button></div></section>`;
  return page({
    id: 'chapter', g: 'Events', kind: 'cd40',
    body: `${bg('night', 'Events', run)}<i class="br40" data-nocheck=""></i>\n  <div class="vs40" data-nocheck=""><i class="l">${v.left}</i><i class="r">${v.right}</i></div>\n  <div class="ct40" data-m="ttl" data-testid="r6-chapter"><small>Chapter ${v.n}</small><b>${letters}</b><em>${esc(v.line)}</em></div>\n  ${box}${keys([['Enter', 'begin', 'chapterGo']], 'Events', run)}`,
  });
}
