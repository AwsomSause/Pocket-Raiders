// DOMINION redesign R3 (pass 50, "The Day"): Rotom's forecast (mockup `weather`), Travel (`travel`), the Magnet Line
// Timetable (`timetable`), the Flooded tunnel (`flood`), the Newsstand (`papers`) with the press interview, and the
// Scrapbook (`scrap`). Live data from theDay.ts; the scene's DayPages builds the models. Pure markup.

import { esc, go, map, pn, SP, type R5Cta, type R5Key, type R5Run, type R5Speaker } from './kit';
import { frame } from './day';

const wx = (k: string): string => `<i class="wx ${esc(k)}" data-nocheck=""></i>`;

// ---------- Rotom's forecast (mockup `weather`) ----------

export interface R5Forecast {
  region: string;
  days: readonly { d: number; icon: string; word: string }[];
  at: number;
  head: string;
  fx: readonly { cls: 'up' | 'dn'; label: string; line: string }[];
  line: string;
}

export function r5Forecast(o: R5Forecast, run: R5Run): string {
  const week = `<section class="wk15" data-m="panel" data-testid="dom-wx-week">${map(o.days, (d, i) => `<div class="dy15${i === o.at ? ' on' : ''}" style="--d:${i * 70}ms" ${go('wxDay', i)} data-testid="dom-wx-${i}"><small>Day ${d.d}</small>${wx(d.icon)}<b>${esc(d.word)}</b></div>`)}</section>`;
  const fx = o.fx.length ? map(o.fx, (f, i) => `<div class="chg ${f.cls}" style="--i:${i};--d:${i * 60}ms"><i>${f.cls === 'dn' ? '▼' : '▲'}</i><b>${esc(f.label)}</b><em>${esc(f.line)}</em></div>`)
    : `<div class="chg up"><i>▲</i><b>Nothing changes</b><em>A normal day for every job</em></div>`;
  return frame({
    id: 'weather', g: 'The Day', kind: 'wx15', bg: 'morn', run,
    top: { title: 'Rotom forecast', sub: `${o.region} · ${o.days.length} days`, crumb: ['Clock', 'dayBack'] },
    body: week + '\n  ' + pn('fx15', o.head, fx, 'det').replace('<section ', '<section data-testid="dom-wx-fx" ') + `\n  <div class="rot15" data-nocheck="">${SP('p-rotom', 90)}</div>`,
    who: { name: 'Rotom', k: 'p-rotom' }, line: o.line,
    ctas: [['Back', 'dayBack', '', 'dom-wx-back'], ['Plan a job', 'dayDone', '', 'dom-wx-plan']],
    keys: [['←→', 'day'], ['Enter', 'plan', 'dayDone'], ['Esc', 'back']],
  });
}

// ---------- Travel (mockup `travel`) ----------

export interface R5Way { name: string; what: string; big: string; small: string; icon: string; why: string | null }
export interface R5Travel {
  from: string;
  to: string;
  /** The road's districts with their holder's colour; `toll` marks a district that takes a toll. */
  stops: readonly { name: string; colour: string; toll: boolean }[];
  walker: string;
  ways: readonly R5Way[];
  at: number;
  /** The way the Boss uses now. */
  now: number;
  who: R5Speaker | null;
  line: string;
  /** A storm floods the Underground Path on this road. */
  flooded: boolean;
}
/** The road's curve (the mockup's), and its height at any x (sampled from its three Bézier pieces) to sit the stops on it. */
const ROAD = 'M40,130 C200,130 220,40 380,50 S600,140 700,100 S830,40 860,50';
const PIECES: readonly (readonly [number, number])[][] = [[[40, 130], [200, 130], [220, 40], [380, 50]], [[380, 50], [540, 60], [600, 140], [700, 100]], [[700, 100], [800, 60], [830, 40], [860, 50]]];
const CURVE: [number, number][] = PIECES.flatMap((p) => Array.from({ length: 40 }, (_, k) => {
  const t = k / 39, u = 1 - t, w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [w.reduce((a, c, j) => a + c * p[j]![0], 0), w.reduce((a, c, j) => a + c * p[j]![1], 0)] as [number, number];
}));
const yAt = (x: number): number => Math.round(CURVE.reduce((best, p) => (Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best))[1]);

export function r5Travel(o: R5Travel, run: R5Run): string {
  const n = o.stops.length;
  const pos = (i: number): [number, number] => { const x = Math.round(40 + (820 * i) / Math.max(1, n - 1)); return [x, yAt(x)]; };
  const toll = o.stops.findIndex((s) => s.toll);
  const road = `<section class="road12" data-m="panel" data-testid="dom-tv-road"><svg viewBox="0 0 928 172" data-nocheck="" style="width:928px;height:172px"><path class="r" d="${ROAD}" style="d:path('${ROAD}');fill:none;stroke:#e9d7a0;stroke-width:22;stroke-linecap:round"/><path class="r on" d="${ROAD}" style="d:path('${ROAD}');fill:none;stroke:#ffd75a;stroke-width:6;stroke-linecap:round"/></svg>
    ${map(o.stops, (s, i) => `<span class="st12" style="left:${pos(i)[0]}px;top:${pos(i)[1]}px;--c:${esc(s.colour)};--d:${i * 120}ms"><i></i><b>${esc(s.name)}</b></span>`)}
    <span class="walk12" data-nocheck="">${o.walker}</span>${toll >= 0 ? `<span class="amb12" style="left:${pos(toll)[0] - 40}px;top:${Math.max(4, pos(toll)[1] - 52)}px" data-testid="dom-tv-toll">${SP('g-smoke-ball', 28)}<b>Toll</b></span>` : ''}</section>`;
  const rows = map(o.ways, (w, i) => `<button class="row way12${i === o.at ? ' on' : ''}${w.why ? ' off' : ''}" ${go('wayRow', i)} style="--i:${i};--d:${i * 60}ms" data-testid="dom-tv-way-${i}">${SP(w.icon, 30)}<span class="row-t"><b>${esc(w.name)}${i === o.now ? ' ✓' : ''}</b><em>${esc(w.why ?? w.what)}</em></span><span class="wr12"><b>${esc(w.big)}</b><em>${esc(w.small)}</em></span></button>`);
  return frame({
    id: 'travel', g: 'The Day', kind: 'travel12', bg: 'morn', run,
    top: { title: 'Travel', sub: `${o.from} to ${o.to}`, crumb: ['Map', 'dayBack'] },
    body: '<div class="table12" data-nocheck=""></div>' + road + '\n  ' + pn('ways12', 'Which way?', rows, 'det'),
    // The mockup has no text box here: it shows only for a notice (the way just picked).
    ...(o.line ? { who: o.who, line: o.line, ctas: [['Back', 'dayBack', '', 'dom-tv-back'] as R5Cta] } : {}),
    keys: [['↑↓', 'road'], ...(o.flooded ? [['F', 'flooded tunnel', 'dayFlood', 'dom-tv-flood'] as R5Key] : []), ['Enter', 'go', 'wayGo', 'dom-tv-go'], ['Esc', 'back']],
  });
}

// ---------- the Timetable (mockup `timetable`) ----------

export interface R5Timetable {
  stations: readonly { id: string; name: string; x: number; y: number; o: 'own' | 'foe' | 'none'; here: boolean }[];
  lines: readonly { colour: string; d: string }[];
  rows: readonly { time: string; to: string; pl: number; status: string; cls: '' | 'd-bad' | 'd-warn' | 'd-mag' }[];
  at: number;
  sub: string;
  legend: readonly [string, string, string];
  who: R5Speaker | null;
  line: string;
}

export function r5Timetable(o: R5Timetable, run: R5Run): string {
  const mm = `<section class="mm38" data-m="panel" data-testid="dom-tt-map"><svg viewBox="0 0 540 320" data-nocheck="" style="width:540px;height:320px">${map(o.lines, (l, i) => `<path d="${esc(l.d)}" style="d:path('${esc(l.d)}');--i:${i};fill:none;stroke:${esc(l.colour)};stroke-width:9;stroke-linecap:round;stroke-linejoin:round"/>`)}</svg>
    ${map(o.stations, (s, i) => `<span class="st38 o-${s.o}" style="left:${s.x}px;top:${s.y}px;--d:${i * 60}ms"${s.here ? ' data-testid="dom-tt-here"' : ''}><i></i><b>${esc(s.name)}${s.here ? ' ★' : ''}</b></span>`)}
    <span class="lg38">${map(['own', 'foe', 'none'] as const, (k, i) => `<u class="o-${k}"><i></i>${esc(o.legend[i]!)}</u>`)}</span></section>`;
  const rows = o.rows.length
    ? map(o.rows, (r, i) => `<div class="dr38 ${r.cls}${i === o.at ? ' on' : ''}" style="--d:${i * 140}ms" ${go('ttRow', i)} data-testid="dom-tt-row-${i}"><i>${esc(r.time)}</i><i>${esc(r.to)}</i><i>${r.pl}</i><i>${esc(r.status)}</i></div>`)
    : `<div class="dr38 d-bad"><i>—</i><i>No station here</i><i></i><i></i></div>`;
  const ctas: R5Cta[] = [['Back', 'dayBack', '', 'dom-tt-back']];
  if (o.rows.length) ctas.push(['Board', 'ttBoard', '', 'dom-tt-board']);
  return frame({
    id: 'timetable', g: 'The Day', kind: 'tt38', bg: 'night', run,
    top: { title: 'Timetable', sub: o.sub, crumb: ['Map', 'dayBack'] },
    body: mm + '\n  ' + pn('db38', 'Departures', `<div class="dh38"><b>Time</b><b>To</b><b>Pl.</b><b>Status</b></div>${rows}`, 'det').replace('<section ', '<section data-testid="dom-tt-board-list" '),
    who: o.who, line: o.line, ctas,
    keys: [['↑↓', 'train'], ['Enter', 'board'], ['Esc', 'back']],
  });
}

// ---------- the Flooded tunnel (mockup `flood`) ----------

export interface R5Flood {
  sub: string;
  people: readonly string[];
  rider: string | null;
  ways: readonly { name: string; what: string; cost: string; cls: 'ok' | 'mid' | 'bad'; why: string | null }[];
  at: number;
  now: number;
  who: R5Speaker | null;
  line: string;
}

export function r5Flood(o: R5Flood, run: R5Run): string {
  const tn = `<section class="tn39" data-m="panel" data-testid="dom-fl-tunnel"><i class="arch" data-nocheck=""></i><i class="wtr" data-nocheck=""><u></u><u></u></i><span class="ppl" data-nocheck="">${o.people.join('')}</span>${o.rider ? `<i class="lp" data-nocheck="">${o.rider}</i>` : ''}</section>`;
  const rows = map(o.ways, (w, i) => `<button class="o29 r-${w.cls}${i === o.at ? ' on' : ''}" ${go('flRow', i)} style="--i:${i};--d:${i * 100}ms" data-testid="dom-fl-way-${i}"><b>${esc(w.name)}${i === o.now ? ' ✓' : ''}</b><em>${esc(w.why ?? w.what)}</em><small>${esc(w.cost)}</small></button>`);
  return frame({
    id: 'flood', g: 'The Day', kind: 'fl39', bg: 'night', run,
    top: { title: 'Flooded tunnel', sub: o.sub, crumb: ['Map', 'dayBack'] },
    body: tn + '\n  ' + pn('rt39', 'Which way?', rows, 'det'),
    who: o.who, line: o.line,
    ctas: [['Turn back', 'dayBack', '', 'dom-fl-back'], [o.ways[o.at]?.name ?? 'Go', 'flRow', o.at, 'dom-fl-go']],
    keys: [['↑↓', 'way'], ['Enter', 'go'], ['Esc', 'turn back']],
  });
}

// ---------- the Newsstand (mockup `papers`) and the press interview ----------

export interface R5Paper3 { mast: string; head: string; deck: string; pic: string; fx: string; cls: 'plain' | 'fear' | 'kind' }
export interface R5Papers {
  day: number;
  papers: readonly R5Paper3[];
  at: number;
  who: R5Speaker | null;
  line: string;
  /** The reporter's question, with the three answers (null: not asking). */
  ask: { who: R5Speaker; line: string; choices: readonly string[] } | null;
  /** "Give an interview" or why it can't be given yet. */
  press: string | null;
}

export function r5Papers(o: R5Papers, run: R5Run): string {
  const ns = `<div class="ns18" data-m="panel" data-testid="dom-papers">${map(o.papers, (p, i) => `<div class="np18 ${p.cls}${i === o.at ? ' on' : ''}" style="--d:${i * 150}ms" ${go('npPick', i)} data-testid="dom-np-${i}"><b class="mast">${esc(p.mast)}</b><b class="hl">${esc(p.head)}</b><em>${esc(p.deck)}</em><span class="ph">${p.pic}</span><i class="fx">${esc(p.fx)}</i></div>`)}</div>`;
  const ask = o.ask;
  const ctas: R5Cta[] = ask
    ? ask.choices.map((c, k) => [c, 'press', k, `dom-press-${k}`] as R5Cta)
    : [['Scrapbook', NAVS, 'scrap', 'dom-np-scrap'], [o.press ?? 'Give an interview', 'pressAsk', '', 'dom-np-press']];
  const keys: R5Key[] = ask ? [['1-3', 'answer'], ['Esc', 'walk past']] : [['←→', 'paper'], ['S', 'scrapbook', 'dayScrap'], ['Esc', 'back']];
  return frame({
    id: 'papers', g: 'The Day', kind: 'news18', bg: 'street', run,
    top: { title: 'Newsstand', sub: `Day ${o.day} · ${o.papers.length} papers`, crumb: ['Map', 'dayBack'] },
    body: ns,
    who: ask ? ask.who : o.who, line: ask ? ask.line : o.line, ctas, footOpts: ask ? { testid: 'dom-press' } : undefined,
    keys,
  });
}
const NAVS = 'r5go';

// ---------- the Scrapbook (mockup `scrap`) ----------

export interface R5Scrap { sub: string; clips: readonly { d: number; head: string; deck: string }[]; who: R5Speaker | null; line: string }
const TILT = [-2, 1.5, -1, 2, -1.5, 1];

export function r5Scrap(o: R5Scrap, run: R5Run): string {
  const cork = `<section class="cork18" data-m="panel" data-testid="dom-scrap"><svg class="str18" viewBox="0 0 928 334" data-nocheck="" style="width:928px;height:334px">${o.clips.length > 1 ? `<polyline points="${'150,60 460,70 770,60 770,220 460,230 150,220'.split(' ').slice(0, o.clips.length).join(' ')}" style="fill:none"/>` : ''}</svg>${map(o.clips, (c, i) => `<div class="cl18" style="--r:${TILT[i % 6]}deg;--d:${i * 110}ms" data-testid="dom-clip-${i}"><i class="tack"></i><small>Day ${c.d}</small><b>${esc(c.head)}</b><em>${esc(c.deck)}</em></div>`)}</section>`;
  return frame({
    id: 'scrap', g: 'The Day', kind: 'scrap18', bg: 'hq', run,
    top: { title: 'Scrapbook', sub: o.sub, crumb: ['Papers', 'dayBack'] },
    body: cork,
    who: o.who, line: o.line,
    ctas: [['Back', 'dayBack', '', 'dom-scrap-back']],
    keys: [['Esc', 'back']],
  });
}
