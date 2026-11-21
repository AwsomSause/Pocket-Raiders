// DOMINION redesign R4 (pass 50): the Jobs pages that got their own rules in core/dominion/jobs.ts. The Job board
// (mockup `jobs`), "something happens" (`live`), the calling card (`calling`), the Black Market (`market`), the Smuggling
// run (`cargo`), the Gym plan (`gymplan`) and the Leader's choice (`gymtalk`). Pass-50 markup, the run's own numbers; the
// scene keeps the cursors and does the steps. Display only.

import './r4.css';
import { esc, frame, go, map, SP, type R5Key, type R5Run, type R5Speaker } from './kit';
import { scene, type R5Choice, type R5Person } from './jobs';

const SR = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
const sr = (text: string, testid = ''): string => `<span${testid ? ` data-testid="${testid}"` : ''} style="${SR}">${esc(text)}</span>`;
export const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;
const signed = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

// ---------- the Job board (mockup `jobs`) ----------

export interface R5BoardJob { title: string; sub: string; art: string; pct: number; pay: string; heat: string; faces: readonly string[]; colour: string }

export function r5JobBoard(m: { jobs: readonly R5BoardJob[]; at: number; orders: string; speaker: R5Speaker | null; line: string; empty: string }, run: R5Run): string {
  const lefts = [24, 334, 644];
  const cards = map(m.jobs, (j, i) => `<button class="hc${i === m.at ? ' on' : ''}" style="left:${lefts[i] ?? 24}px;--d:${i * 120}ms;--pc:${j.colour}" ${go('boardTake', i)} data-over="boardOver" data-arg="${i}" data-testid="dom-board-${i}"><span class="hc-h"><b>${esc(j.title)}</b><em>${esc(j.sub)}</em></span>
    <span class="hc-art">${j.art}<span class="hc-o" style="--p:${j.pct}"><b>${j.pct}%</b></span></span>
    <span class="hc-f"><span><em>Pay</em><b>${esc(j.pay)}</b></span><span><em>Heat</em><b>${esc(j.heat)}</b></span><span class="hc-who">${j.faces.join('')}</span></span></button>`);
  const body = m.jobs.length ? cards : `<section class="pn" style="position:absolute;left:24px;right:24px;top:110px;padding:24px" data-testid="dom-board-empty"><p>${esc(m.empty)}</p></section>`;
  const ks: R5Key[] = m.jobs.length ? [['←→', 'job'], ['Enter', 'take it', 'boardTake'], ['Esc', 'back', 'boardBack']] : [['Esc', 'back', 'boardBack']];
  return frame({
    id: 'jobs', g: 'Jobs', kind: 'jobs', bg: 'night', run,
    top: { title: 'Job board', sub: m.orders, crumb: ['Jobs', 'map'], subTestid: 'dom-board-orders' },
    body, who: m.speaker, line: m.line,
    ctas: m.jobs.length ? [['Pick the crew', 'boardTake', m.at, 'dom-board-take']] : [], keys: ks,
  });
}

// ---------- "something happens" (mockup `live`) ----------

export interface R5Live { job: string; art: string; who: string; mon: string; steps: readonly string[]; now: number; q: string; answers: readonly { label: string; sub: string; dim?: boolean }[]; at: number; odds: number }

export function r5Live(m: R5Live, run: R5Run): string {
  const xs = [70, 220, 370, 520];
  const cps = map(m.steps, (s, i) => `<span class="lv-cp${i < m.now ? ' done' : i === m.now ? ' now' : ''}" style="left:${xs[i] ?? 70}px"><i></i><b>${esc(s)}</b></span>`);
  const stage = `<section class="lv-stage" data-m="panel"><div class="lv-sky" data-nocheck=""></div>${m.art}<div class="lv-path" data-nocheck=""></div>
    ${cps}
    <span class="lv-rook">${m.who}</span>${m.mon ? `<span class="lv-dog">${m.mon}</span>` : ''}<span class="lv-alert" data-nocheck="">!</span></section>`;
  const chs = map(m.answers, (a, i) => `<button class="ch${i === m.at ? ' on' : ''}${a.dim ? ' dim4' : ''}" ${go('liveAns', i)} data-over="liveOver" data-arg="${i}" data-testid="dom-live-${i}" style="--i:${i};--d:${i * 90}ms"><kbd>${i + 1}</kbd><span class="row-t"><b>${esc(a.label)}</b><em>${esc(a.sub)}</em></span></button>`);
  const ev = `<section class="pn lv-ev" data-m="det" data-testid="dom-live"><h3><i>Something happens</i></h3><p class="lv-q">${esc(m.q)}</p>${chs}</section>`;
  const odds = `<div class="lv-odds"><div class="bar" style="--i:0;--d:0ms"><span>Odds now</span><i><u style="width:${m.odds}%"></u></i><b data-testid="dom-live-odds">${m.odds}</b></div></div>`;
  return frame({
    id: 'live', g: 'Jobs', kind: 'live', bg: 'night', run, noTabs: true,
    top: { title: 'The job · live', sub: m.job, crumb: ['Jobs', 'card'] },
    body: `${stage}\n  ${ev}\n  ${odds}`,
    keys: [['1-3', 'react'], ['Enter', 'choose', 'liveGo'], ['Esc', 'back', 'liveBack']],
  });
}

// ---------- the calling card (mockup `calling`) ----------

export interface R5Calling { night: string; place: string; team: string; motto: string; rows: readonly { up: boolean; label: string; val: string }[]; at: number; speaker: R5Speaker | null; line: string }

export function r5Calling(m: R5Calling, run: R5Run): string {
  const cardH = `<div class="tbl24" data-nocheck=""></div>
  <div class="cc24" data-m="card" data-testid="dom-calling"><i class="stamp" data-nocheck=""></i><small>${esc(m.night)} · ${esc(m.place)}</small><b>${esc(m.team.toUpperCase())}<br>WAS HERE</b><em>${esc(m.motto)}</em></div>`;
  const rows = map(m.rows, (r, i) => `<div class="chg ${r.up ? 'up' : 'dn'}" style="--i:${i};--d:${i * 60}ms"><i>${r.up ? '▲' : '▼'}</i><b>${esc(r.label)}</b><em>${esc(r.val)}</em></div>`);
  return frame({
    id: 'calling', g: 'Jobs', kind: 'cc24', bg: 'night', run, noTabs: true,
    top: { title: 'Calling card', sub: m.place, crumb: ['Jobs', 'map'] },
    body: `${cardH}\n  <section class="pn ccw24" data-m="det"><h3><i>What the card does</i></h3>${rows}</section>`,
    who: m.speaker, line: m.line,
    // the last button is the default: the cursor (←→) picks which one Enter means
    ctas: m.at === 0 ? [['Leave the card', 'callingLeave', '', 'dom-calling-leave'], ['No card', 'callingSkip', '', 'dom-calling-skip']] : [['No card', 'callingSkip', '', 'dom-calling-skip'], ['Leave the card', 'callingLeave', '', 'dom-calling-leave']],
    keys: [['←→', 'choose'], ['Enter', 'confirm', 'callingGo']],
  });
}

// ---------- the Black Market (mockup `market`) ----------

export interface R5MarketItem { id: string; name: string; about: string; price: number; pic: string; dim: boolean; have: number }

export function r5Market(m: { items: readonly R5MarketItem[]; at: number; seller: R5Speaker; sellerPic: string; line: string; place: string }, run: R5Run): string {
  const cur = m.items[m.at];
  const grid = `<section class="sh32" data-m="panel" data-testid="dom-market">${map(m.items, (x, i) => `<button class="wr32${i === m.at ? ' on' : ''}${x.dim ? ' dim4' : ''}" style="--d:${i * 70}ms" ${go('marketBuy', i)} data-over="marketOver" data-arg="${i}" data-testid="dom-market-${i}"><span class="ic">${SP(x.pic, 64)}</span><b>${esc(x.name)}</b><em>${esc(x.about)}${x.have ? ` · have ${x.have}` : ''}</em><i>${money(x.price)}</i></button>`)}</section>
  <div class="dl32" data-nocheck="">${m.sellerPic}</div>`;
  return frame({
    id: 'market', g: 'Jobs', kind: 'bm32', bg: 'night', run, noTabs: true,
    top: { title: 'Black Market', sub: m.place, crumb: ['Jobs', 'map'] },
    body: grid, who: m.seller, line: m.line, footOpts: { testid: 'dom-market-line' },
    ctas: [['Leave', 'marketBack', '', 'dom-market-leave'], [cur ? `Buy ${cur.name}` : 'Buy', 'marketBuy', m.at, 'dom-market-buy']],
    keys: [['←→↑↓', 'item'], ['Enter', 'buy', 'marketBuy'], ['Esc', 'leave', 'marketBack']],
  });
}

// ---------- the Smuggling run (mockup `cargo`): the Smuggle Card ----------

export interface R5CargoRow { id: string; name: string; where: string; risk: number; pay: number; pic: string; on: boolean }

export function r5Cargo(m: { route: string; rows: readonly R5CargoRow[]; at: number; check: number; checkWord: string; pay: string; speaker: R5Speaker | null; line: string; blocked: string | null }, run: R5Run): string {
  const crates = map(m.rows, (r, i) => `<i class="cr38${r.on ? ' in' : ''}" style="--d:${i * 120}ms">${SP(r.pic, r.pic.startsWith('p-') ? 36 : 56)}<u>${'!'.repeat(r.risk)}</u></i>`);
  const bus = `<section class="car38" data-m="panel"><i class="roof" data-nocheck=""></i><span class="win" data-nocheck="">${map([0, 1, 2, 3, 4], (i) => `<i style="--i:${i}"></i>`)}</span><span class="hold">${crates}</span><i class="whl" data-nocheck=""></i><i class="whl r" data-nocheck=""></i></section>`;
  const rows = map(m.rows, (r, i) => `<div class="cw38${r.on ? ' on' : ''}" style="--i:${i};--d:${i * 90}ms${i === m.at ? ';outline:2px solid var(--yel);outline-offset:-2px' : ''}" ${go('cargoToggle', i)} data-testid="dom-cargo-${i}"><i class="ck">${r.on ? '✓' : ''}</i><span><b>${esc(r.name)}</b><em>${esc(r.where)}</em></span><small class="r${Math.min(4, r.risk)}">Risk ${r.risk}</small><i class="v">+${money(r.pay)}</i></div>`);
  const ins = `<div class="ins38"><b>Ticket check</b><span><i style="width:${m.check}%"></i></span><em data-testid="dom-cargo-odds">${m.check}% · ${esc(m.checkWord)}</em></div>`;
  return frame({
    id: 'cargo', g: 'Jobs', kind: 'cg38', bg: 'street', run,
    top: { title: 'Smuggling run', sub: m.route, crumb: ['Jobs', 'map'] },
    body: `${bus}\n  <section class="pn cl38" data-m="det" data-testid="dom-cargo"><h3><i>What goes on board</i></h3>${rows}${ins}${sr(`Pays ${m.pay}`, 'dom-card-pays')}</section>`,
    who: m.speaker, line: m.blocked ?? m.line, footOpts: m.blocked ? { sr: ['dom-card-blocked', m.blocked] } : {},
    ctas: [['Back', 'cardBack', '', 'dom-card-back'], ['Load and board', 'doit', '', 'dom-doit']],
    keys: [['↑↓', 'cargo'], ['Space', 'load', 'cargoToggle'], ['Enter', 'board', 'doit'], ['Esc', 'back', 'cardBack']],
  });
}

// ---------- the Gym plan (mockup `gymplan`): the Gym takeover Card ----------

export interface R5GymRow { id: string; name: string; text: string; tone: 'ok' | 'mid' | 'bad'; pct: string }

export function r5GymPlan(m: { gym: string; leader: { name: string; pic: string }; trainers: readonly string[]; me: string; rows: readonly R5GymRow[]; at: number; speaker: R5Speaker | null; line: string; blocked: string | null }, run: R5Run): string {
  const spots = [[90, 230], [260, 150], [430, 230], [170, 90], [380, 90]];
  const tr = map(m.trainers.slice(0, spots.length), (p, i) => `<span class="gt44" style="left:${spots[i]![0]}px;top:${spots[i]![1]}px;--i:${i}">${p}<i class="vw"></i></span>`);
  const map_ = `<section class="gp44" data-m="panel"><i class="hedge" data-nocheck=""></i>${tr}<span class="ld44" style="left:262px;top:20px">${m.leader.pic}<u>${esc(m.leader.name)}</u></span><svg class="pt44" viewBox="0 0 540 328" data-nocheck=""><path d="M270,320 L270,280 L180,280 L180,200 L350,200 L350,120 L300,110"></path></svg><i class="me44" data-nocheck="">${m.me}</i></section>`;
  const rows = map(m.rows, (r, i) => `<div class="o29 w-${r.tone}" style="--i:${i};--d:${i * 90}ms${i === m.at ? ';outline:2px solid var(--yel);outline-offset:-2px' : ''}" ${go('opt', r.id)} data-testid="dom-gym-way-${i}"><b>${esc(r.name)} · ${esc(r.pct)}</b><em>${esc(r.text)}</em></div>`);
  return frame({
    id: 'gymplan', g: 'Jobs', kind: 'gp44', bg: 'night', run,
    top: { title: 'Gym takeover', sub: m.gym, crumb: ['Jobs', 'map'] },
    body: `${map_}\n  <section class="pn gw44" data-m="det" data-testid="dom-gymplan"><h3><i>Weak spots</i></h3>${rows}</section>`,
    who: m.speaker, line: m.blocked ?? m.line, footOpts: m.blocked ? { sr: ['dom-card-blocked', m.blocked] } : {},
    ctas: [['Back', 'cardBack', '', 'dom-card-back'], ['Walk in', 'gymWalk', '', 'dom-gym-walk']],
    keys: [['↑↓', 'weak spot'], ['Enter', 'walk in', 'gymWalk'], ['Esc', 'back', 'cardBack']],
  });
}

// ---------- the Leader's choice (mockup `gymtalk`) ----------

export function r5GymTalk(m: { boss: R5Person; leader: R5Person; line: string; chs: readonly R5Choice[] }, run: R5Run): string {
  return scene({
    id: 'gymtalk', g: 'Trainers', mode: 'talk', bg: 'gold', left: m.boss, right: m.leader, chs: m.chs,
    box: { who: m.leader, line: m.line, testid: 'dom-gymtalk' },
    keys: [['1-3', 'answer'], ['Enter', 'your call', 'gymTalkGo']], run,
  });
}

export { signed, SP };
