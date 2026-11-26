// DOMINION redesign R4 (pass 50): the battle pages that got their own rules in core/dominion/bossFights.ts. Power gear
// (mockup `gear`), Pick a power (`power`), Phase two (`phase`), the crew team-up (`teamup`), Who steps in (`crewin`),
// the Betrayal (`legend`) and the Snapshot (`snap`). Pass-50 markup, the run's own numbers; the scene keeps the cursors
// and does the steps. Display only. The main battle screen is not touched (build rule 5): these pages come before or
// after a battle.

import './r4.css';
import { bg, esc, faceOf, foot, frame, go, keys, map, page, rep, type R5Key, type R5Run, type R5Speaker } from './kit';
import { scene, type R5Person } from './jobs';

const SR = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
const sr = (text: string, testid = ''): string => `<span${testid ? ` data-testid="${testid}"` : ''} style="${SR}">${esc(text)}</span>`;
const ROTOM: R5Speaker = { name: 'Rotom', k: 'p-rotom' };
const cur = (on: boolean): string => (on ? ' on' : '');

// ---------- Power gear (mockup `gear`) ----------

export interface R5GearRow { gear: string; sub: string; tag: string; icon: string; ready: boolean; carried: boolean }

export function r5Gear(m: { rows: readonly R5GearRow[]; at: number; open: number; pic: string; lines: readonly string[]; note: string | null }, run: R5Run): string {
  const rows = map(m.rows, (r, i) => `<button class="row${cur(i === m.at)}${r.ready ? '' : ' dim4'}" ${go('gearAt', i)} data-testid="dom-gear-${i}" style="--i:${i};--d:${i * 60}ms">${icon(r.icon, 40)}<span class="row-t"><b>${esc(r.gear)}</b><em>${esc(r.sub)}</em></span><i class="tag">${esc(r.carried ? 'Carried' : r.tag)}</i></button>`);
  const sel = m.rows[m.at];
  const det = `<section class="pn l-det" data-m="det"><div class="plinth">${m.pic}</div><b class="det-t">${esc(sel?.gear ?? '')}</b>${map(m.lines, (l) => `<p>${esc(l)}</p>`)}<button class="cta on" ${go('gearPick')} data-testid="dom-gear-pick">Pick a power</button>${m.note ? sr(m.note, 'dom-gear-note') : ''}</section>`;
  return frame({
    id: 'gear', g: 'Gimmicks', kind: 'list', bg: 'hq', run, noTabs: true,
    top: { title: 'Power gear', crumb: null },
    body: `<section class="pn l-main" data-m="panel" data-testid="dom-gear"><h3><i>Power gear · ${m.open} of ${m.rows.length} unlocked</i></h3>${rows}</section>\n  ${det}`,
    keys: [['↑↓', 'gear'], ['Enter', 'choose', 'gearPick'], ['Esc', 'back', 'gearBack']],
  });
}

const icon = (k: string, h: number, cls = 'ico'): string => `<img class="px ${cls}" src="assets/images/dominion/r50/${esc(k)}.png" alt="" draggable="false" style="width:${h}px;height:${h}px">`;

// ---------- Pick a power (mockup `power`) ----------

export interface R5PowerCard { kind: string; name: string; about: string; tag: string; icon: string; art: string; ready: boolean }
const PW: Record<string, string> = { mega: 'pw-mega', tera: 'pw-tera', dynamax: 'pw-dyna', zmove: 'pw-z' };

export function r5Power(m: { cards: readonly R5PowerCard[]; at: number; sub: string; line: string; verb: string }, run: R5Run): string {
  const cards = map(m.cards, (c, i) => `<button class="pwc ${PW[c.kind] ?? ''}${c.ready ? '' : ' lock'}${cur(i === m.at)}" ${go('powerAt', i)} data-testid="dom-power-${i}" style="--d:${i * 90}ms"><span class="pwc-art">${c.art}</span>${icon(c.icon, 51, 'pwc-ic')}<b>${esc(c.name)}</b><em>${esc(c.about)}</em><i class="tag">${esc(c.tag)}</i></button>`);
  return frame({
    id: 'power', g: 'Gimmicks', kind: 'power', bg: 'hq', run, noTabs: true,
    top: { title: 'Pick a power', sub: m.sub, crumb: ['Gear', 'gear'] },
    body: `<section class="pw-row" data-m="panel" data-testid="dom-power">${cards}</section>`,
    who: ROTOM, line: m.line, footOpts: { testid: 'dom-power-line' },
    ctas: [['Power gear', 'powerBack', '', 'dom-power-back'], [m.verb, 'powerUse', m.at, 'dom-power-use']],
    keys: [['←→', 'power'], ['Enter', 'carry it', 'powerUse'], ['Esc', 'back', 'powerBack']],
  });
}

// ---------- Phase two (mockup `phase`) ----------

export function r5Phase(m: { boss: string; role: string; pic: string; word: string; sub: string; changes: readonly { tone: string; icon: string; title: string; text: string }[]; speaker: R5Speaker; line: string }, run: R5Run): string {
  const body = bg('night', 'Trainers', run) + '<i class="crk26" data-nocheck=""></i><i class="fl26" data-nocheck=""></i>'
    + `\n  <div class="gio26" data-nocheck="">${m.pic}</div>`
    + `\n  <div class="pw26" data-m="ttl" data-testid="dom-phase2"><small>${esc(m.boss)} · ${esc(m.role)}</small><b>${esc(m.word.toUpperCase())}</b><em>${esc(m.sub)}</em></div>`
    + `\n  <section class="pn rl26" data-m="det"><h3><i>What changes</i></h3>${map(m.changes, (c, i) => `<div class="chg ${esc(c.tone)}" style="--i:${i};--d:${i * 60}ms"><i>${esc(c.icon)}</i><b>${esc(c.title)}</b><em>${esc(c.text)}</em></div>`)}</section>`
    + '\n  ' + foot(m.speaker, m.line, [['Continue', 'phaseGo', '', 'dom-phase2-go']], 'Trainers', run)
    + keys([['Enter', 'continue', 'phaseGo']], 'Trainers', run);
  return page({ id: 'phase', g: 'Trainers', kind: 'ph26', body });
}

// ---------- the crew team-up (mockup `teamup`) ----------

export function r5TeamUp(m: { word: string; sub: string; crew: readonly { name: string; pic: string; mon: string }[]; speaker: R5Speaker | null; line: string; cut: number }, run: R5Run): string {
  const crew = map(m.crew, (c, i) => `<div class="tus26" style="--i:${i}" data-nocheck=""><span class="tp">${c.pic}</span><span class="tm">${c.mon}</span></div><b class="tun26" style="--i:${i}">${esc(c.name)}</b>`);
  const body = bg('night', 'Trainers', run) + '<i class="fl26" data-nocheck=""></i>'
    + `\n  ${crew}`
    + `\n  <div class="tuw26" data-m="ttl" data-testid="dom-teamup"><b>${esc(m.word.toUpperCase())}</b><em>${esc(m.sub)}</em>${sr(`The foe's lead starts with ${m.cut}% less HP`, 'dom-teamup-cut')}</div>`
    + '\n  ' + foot(m.speaker, m.line, [['Not now', 'assistNo', '', 'dom-assist-no'], ['Team up', 'assistYes', '', 'dom-assist-yes']], 'Trainers', run)
    + keys([['Enter', 'team up', 'assistYes'], ['Esc', 'not now', 'assistNo']], 'Trainers', run);
  return page({ id: 'teamup', g: 'Trainers', kind: 'tu26', body });
}

// ---------- Who steps in (mockup `crewin`) ----------

export interface R5CrewIn { name: string; mon: string; face: string; colour: string; text: string; hp: number }

export function r5CrewIn(m: {
  foe: { name: string; level: number; pips: number; pic: string } | null; trainer: { name: string; face: string; sub: string } | null;
  clock: { label: string; n: number; unit: string }; me: { name: string; level: number; hp: number; max: number; pic: string } | null;
  rows: readonly R5CrewIn[]; at: number; head: string; about: string;
}, run: R5Run): string {
  const pct = (a: number, b: number): number => Math.round((100 * a) / Math.max(1, b));
  const foe = m.foe ? `<div class="bpl foe" data-m="foeplate"><b>${esc(m.foe.name)}</b><em>Lv ${m.foe.level}</em><span class="pips">${rep(6, (i) => `<i class="${i < m.foe!.pips ? 'on' : ''}"></i>`)}</span><i class="hp"><u style="width:100%"></u></i><span>100%</span></div>` : '';
  const tr = m.trainer ? `<div class="foe-tr">${m.trainer.face}<b>${esc(m.trainer.name)}</b><em>${esc(m.trainer.sub)}</em></div>` : '';
  const clock = `<div class="clock8" data-m="clock"><em>${esc(m.clock.label)}</em><b>${m.clock.n}</b><span>${esc(m.clock.unit)}</span><i>${rep(Math.min(6, Math.max(1, m.clock.n)), () => '<u class="on"></u>')}</i></div>`;
  const bench = `<div class="bench8"><em>Bench</em>${map(m.rows, (r) => `<span>${faceOf(r.face, 34, r.colour)}<i><u style="width:${r.hp}%"></u></i></span>`)}</div>`;
  const rows = map(m.rows, (r, i) => `<button class="cw${cur(i === m.at)}" ${go('crewInAt', i)} data-testid="dom-crewin-${i}" style="--pc:${r.colour}">${faceOf(r.face, 48, r.colour)}<span class="row-t"><b>${esc(r.name)} · ${esc(r.mon)}</b><em>${esc(r.text)}</em></span><i class="hpm"><u style="width:${r.hp}%"></u></i></button>`);
  const me = m.me ? `<div class="bpl me" data-m="meplate"><b>${esc(m.me.name)}</b><em>Lv ${m.me.level}</em><i class="hp"><u style="width:${pct(m.me.hp, m.me.max)}%"></u></i><span>${m.me.hp} / ${m.me.max}</span></div>` : '';
  const body = bg('hq', 'Trainers', run) + '<div class="court8" data-nocheck=""><span>' + esc(run.initial || 'N') + '</span></div>'
    + `\n  ${foe}\n  ${tr}\n  ${clock}\n  ${m.foe?.pic ?? ''}${m.me?.pic ?? ''}\n  ${bench}`
    + `\n  <section class="cw8" data-m="box" data-testid="dom-crewin"><h4>${esc(m.head)}</h4>${rows}<p>${esc(m.about)}</p><button class="ch" ${go('assistNo')} data-testid="dom-assist-no" style="${SR}">Nobody</button></section>\n  ${me}`
    + keys([['↑↓', 'who'], ['Enter', 'step in', 'assistYes'], ['Esc', 'nobody', 'assistNo']], 'Trainers', run);
  return page({ id: 'crewin', g: 'Trainers', kind: 'bat8 bv-crew', body });
}

// ---------- the Betrayal (mockup `legend`) ----------

export function r5Legend(m: { small: string; word: string; boss: R5Person; legend: R5Person; admin: R5Person; line: string; face: string }, run: R5Run): string {
  return scene({
    id: 'legend', g: 'Gimmicks', mode: 'vs', bg: 'night', word: { small: m.small, big: m.word.toUpperCase(), testid: 'dom-legend' },
    pre: '<div class="psy9" data-nocheck=""></div>', left: m.boss, right: m.legend,
    box: { who: m.admin, line: m.line, cta: [m.face, 'legendGo', 'dom-legend-go'], testid: 'dom-legend-line' },
    keys: [['Enter', 'next', 'legendGo']], run,
  });
}

// ---------- the Snapshot (mockup `snap`) ----------

export function r5Snap(m: { mine: string; foe: string; text: string; count: number; max: number; note: string; line: string }, run: R5Run): string {
  const filled = Math.min(15, m.count);
  const tiles = rep(16, (i) => (i < filled ? `<i style="--d:${i * 40}ms"></i>` : i === filled ? `<i class="new" style="--d:${i * 40}ms">NEW</i>` : `<i class="em" style="--d:${i * 40}ms"></i>`));
  return frame({
    id: 'snap', g: 'Trainers', kind: 'sn26', bg: 'hq', run, noTabs: true,
    top: { title: 'Snapshot', sub: `Moment ${Math.min(m.max, m.count + 1)} of ${m.max}`, crumb: ['Map', 'map'] },
    body: `<i class="fl26 w" data-nocheck=""></i>\n  <div class="ph26x" data-nocheck="" data-testid="dom-snap"><div class="pic"><i class="sky"></i><span class="a">${m.mine}</span><span class="b">${m.foe}</span></div><b>${esc(m.text)}</b></div>`
      + `\n  <section class="pn alb26" data-m="det"><h3><i>Album · ${m.count} of ${m.max}</i></h3><div class="ag26">${tiles}</div><p class="an26">${esc(m.note)}</p></section>`,
    who: ROTOM, line: m.line,
    ctas: [['Skip', 'snapSkip', '', 'dom-snap-skip'], ['Save to album', 'snapKeep', '', 'dom-snap-keep']],
    keys: [['Enter', 'save', 'snapKeep'], ['Esc', 'skip', 'snapSkip']],
  });
}

export type { R5Key };
