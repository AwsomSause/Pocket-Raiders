// DOMINION redesign R3 (pass 50 of plans/evil-mode-rework/redesign-50): The Day. The Region Map (mockup `map`), its
// Focus view (`focus`), Place your crew (`deploy`), the District file (`district`) and Walk the street (`street`).
// Live data in, HTML out: the scene keeps the map cursor and does the acts (D2's, unchanged). Every data-testid the old
// views had is kept.

import type { MapModel } from '../../../../../core/dominion/fieldScreens';
import type { DistrictModel } from '../../../../../core/dominion/districtScreen';
import './day.css';
import { esc, faceOf, frame as frame0, go, map, NAV, pn, rep, SP, spr, st, type R5Cta, type R5Key, type R5Run, type R5Speaker } from './kit';

/** The kit's frame, with one game-only fix: a long line in the text box wraps to two smaller lines instead of being cut
 *  (the mockups' lines were written to fit one). */
export function frame(o: Parameters<typeof frame0>[0]): string {
  const ctaW = (o.ctas ?? []).reduce((a, c) => a + c[0].length * 9 + 44, 0);
  const cap = Math.floor((880 - (o.who ? 60 : 0) - ctaW) / 8.6);
  const html = frame0(o);
  return o.line && o.line.length > cap ? html.replace('<section class="foot', '<section class="foot l2') : html;
}

// ---------- the board: Kanto as the mockup draws it ----------

/** Where each district sits on the 600x338 board (the mockup's spots; Pallet between Viridian and the sea). */
const SPOT: Record<string, [number, number]> = {
  viridian: [74, 190], pewter: [74, 76], cerulean: [389, 58], saffron: [389, 142], celadon: [253, 142], lavender: [542, 142],
  vermilion: [389, 226], fuchsia: [270, 256], cinnabar: [74, 274], pallet: [160, 238],
};
/** The game's own map coordinates, mapped onto the board, for a district the mockup didn't draw. */
export const spotOf = (id: string, x: number, y: number): [number, number] => SPOT[id] ?? [Math.round(74 + (x - 38) * 1.083), Math.round(58 + (y - 34) * 0.73)];

const ROADS: readonly [string, string, boolean][] = [
  ['viridian', 'pewter', false], ['pewter', 'cerulean', false], ['cerulean', 'saffron', false], ['saffron', 'celadon', false], ['saffron', 'lavender', false],
  ['cerulean', 'lavender', false], ['saffron', 'vermilion', false], ['vermilion', 'lavender', false], ['vermilion', 'fuchsia', false], ['celadon', 'fuchsia', false],
  ['viridian', 'pallet', false], ['fuchsia', 'cinnabar', true], ['pallet', 'cinnabar', true], ['viridian', 'celadon', true],
];

/** The board's colour for a district's status: yours, a foothold, the rival's, nobody's. */
type Own = 'nova' | 'foot' | 'rocket' | 'out';
/** Read by screen readers (and tests), not drawn. */
const SR = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
const OWN_COL: Record<Own, string> = { nova: '#e0294a', foot: '#f2b632', rocket: '#6a6f86', out: '#3d4256' };
export const ownOf = (cls: string): Own => (cls === 'held' ? 'nova' : cls === 'foot' ? 'foot' : cls === 'rival' ? 'rocket' : 'out');

/** What the scene knows about each district that the map model doesn't draw: who's there. */
export interface R5Spot {
  /** Members working there (face pictures, team-coloured). */
  crew: readonly string[];
  /** The Hero is there (and you know it). */
  hero: boolean;
  /** How many of the rival's markers to show. */
  rk: number;
}
export interface R5MapExtras {
  spots: Record<string, R5Spot>;
  /** The district's face: a sprite picture for the file (the Gym Leader, else a target's owner). */
  face: string;
  /** The hero's face for the board, and their name ("Red seen"). */
  hero: { pic: string; name: string } | null;
  team: string;
  rivalInitial: string;
  region: string;
  /** Who speaks the map's line (Rotom by default). */
  who: R5Speaker;
}

/** The land and Cinnabar's island. r50.css resets every element with `all: revert`, which also drops SVG geometry that is
 *  a CSS property (a path's d, an ellipse's cx/cy/rx/ry), so the shape is given again inline. */
const LAND_D = 'M40,30 L300,22 L470,30 L578,60 L584,200 L566,270 L430,290 L330,294 L240,292 L190,270 L120,242 L48,226 L36,140 Z';
const LAND = `<path d="${LAND_D}" style="d:path('${LAND_D}')"></path><ellipse cx="74" cy="276" rx="36" ry="22" style="cx:74px;cy:276px;rx:36px;ry:22px"></ellipse>`;

function board(m: MapModel, x: R5MapExtras, o: { act?: string; drag?: string } = {}): string {
  const pos: Record<string, [number, number]> = {};
  for (const d of m.districts) pos[d.id] = spotOf(d.id, d.x, d.y);
  const lines = map(ROADS.filter(([a, b]) => pos[a] && pos[b]), ([a, b, sea]) => `<line class="${sea ? 'sea' : ''}" x1="${pos[a]![0]}" y1="${pos[a]![1]}" x2="${pos[b]![0]}" y2="${pos[b]![1]}"></line>`);
  let k = 0;
  const toks = map(m.districts, (d, i) => {
    const [l, t] = pos[d.id]!;
    const own = ownOf(d.cls);
    const s = x.spots[d.id];
    const marks: string[] = [];
    for (const f of s?.crew ?? []) marks.push(`<span class="pc12 crew" style="left:${l + 18 + 14 * marks.length}px;top:${t - 34}px;--d:${400 + 60 * k++}ms" data-nocheck="">${faceOf(f, 26, '#3f7fd9')}</span>`);
    if (s?.hero && x.hero) marks.push(`<span class="pc12 hero" style="left:${l + 18 + 14 * marks.length}px;top:${t - 34}px;--d:${400 + 60 * k++}ms" data-nocheck="">${faceOf(x.hero.pic, 26, '#c1121f')}</span>`);
    for (let r = 0; r < (s?.rk ?? 0); r++) marks.push(`<span class="pc12 rk" style="left:${l + 18 + 14 * marks.length}px;top:${t - 34}px;--d:${400 + 60 * k++}ms" data-nocheck=""><i>${esc(x.rivalInitial)}</i></span>`);
    const tap = o.act ? go(o.act, d.id) : go('district', d.id);
    return `<button class="tk12 o-${own}${d.sel ? ' on' : ''}" style="left:${l}px;top:${t}px;--c:${OWN_COL[own]};--d:${i * 50}ms" ${tap} data-testid="dom-dz-${d.id}"><i></i><b>${esc(d.name)}${d.closed ? ' ✕' : ''}</b>${d.pill ? `<span style="${SR}">${esc(d.pill.text)}</span>` : ''}</button>\n    ${marks.join('')}`;
  });
  const heroAt = x.hero ? Object.entries(x.spots).find(([, s]) => s.hero)?.[0] : undefined;
  const seen = heroAt && pos[heroAt] ? `<span class="ping12" style="left:${pos[heroAt]![0]}px;top:${pos[heroAt]![1]}px" data-nocheck=""></span><em class="seen12" style="left:${pos[heroAt]![0] + 32}px;top:${pos[heroAt]![1] + 6}px">${esc(x.hero!.name)} seen</em>` : '';
  const sel = m.districts.find((d) => d.sel);
  const drag = o.drag && sel ? `<span class="drag12" style="left:${pos[sel.id]![0] + 30}px;top:${pos[sel.id]![1] - 40}px" data-nocheck="">${faceOf(o.drag, 34, '#a25fe0')}</span>` : '';
  return `<div class="bd12" data-m="panel" data-testid="dom-map"><svg class="land12" viewBox="0 0 600 338" data-nocheck="">${LAND}
  ${lines}</svg>
  ${toks}
  ${seen}
  <ul class="leg12"><li style="--c:${OWN_COL.nova}"><i></i>${esc(x.team)}</li><li style="--c:${OWN_COL.foot}"><i></i>Foothold</li><li style="--c:${OWN_COL.rocket}"><i></i>${esc(m.file.rivalName)}</li><li style="--c:${OWN_COL.out}"><i></i>Nobody yet</li></ul></div>
  ${drag}`;
}

const bar = (label: string, v: number, i: number, testid = ''): string => `<div class="bar" ${st(i)}><span>${esc(label)}</span><i><u style="width:${Math.max(0, Math.min(100, v))}%"></u></i><b${testid ? ` data-testid="${testid}"` : ''}>${v}</b></div>`;
const OWN_WORD: Record<string, string> = { HELD: 'yours', OWNED: 'yours', FOOTHOLD: 'a foothold', CONTESTED: 'contested', OUTSIDER: 'nobody yet', RIVAL: '' };

/** The district file beside the board (mockup `map`'s m-side panel). */
function fileSide(m: MapModel, x: R5MapExtras): string {
  const f = m.file;
  const own = f.stamp.word === 'RIVAL' ? f.rivalName : OWN_WORD[f.stamp.word] ? `${f.stamp.word === 'HELD' || f.stamp.word === 'OWNED' ? x.team : f.stamp.word[0] + f.stamp.word.slice(1).toLowerCase()}` : f.stamp.word;
  const tg = map(f.targets, (t, i) => `<i class="${t.on ? 'on' : ''}" ${go('target', i)} data-testid="dom-target-${t.id}">${esc(t.name)}</i>`);
  const chips = map(m.grid, (g, i) => `<i class="${g.on ? 'on' : ''}" ${go('grid', i)} data-testid="dom-act-${g.id}"${g.dim ? ' style="opacity:.45"' : ''}>${esc(g.label)}${g.night ? ' ☾' : ''}</i>`);
  const pager = m.pages > 1 ? `<i class="pg50" data-testid="dom-pager"><b ${go('page', -1)}>‹</b><span data-testid="dom-section">${esc(m.section)}</span> ${m.page + 1}/${m.pages}<b ${go('page', 1)}>›</b></i>` : '';
  return pn('m-side m12', 'District file', `<div class="dh12" ${go('dfile')} data-testid="dom-file">${x.face}<span><b class="det-t big">${esc(f.name)}</b><p class="own" style="--c:${OWN_COL[ownOf(m.districts.find((d) => d.sel)?.cls ?? 'out')]}">${esc(own)} · <small data-testid="dom-regard" title="Regard">♥ ${f.regard}</small> <small data-testid="dom-dread" title="Dread">✊ ${f.dread}</small></p></span></div>`
    + bar('Your control', f.control, 0, 'dom-control') + bar('Heat here', f.heat, 1, 'dom-dheat') + bar(`${f.rivalName.replace(/^Team /, '')} grip`, f.rival, 2)
    + `<div class="chips tg50" data-testid="dom-targets">${tg}</div><div class="chips" data-testid="dom-grid">${chips}${pager}</div>`, 'det');
}

/** The vehicles (V) in the side panel's place. */
function garageSide(m: MapModel): string {
  return pn('m-side m12 gar50', 'Vehicles', map(m.vehicles, (v, i) => `<button class="row sm" ${go('buy', v.id)} ${st(i)} data-testid="dom-buy-${v.id}">${SP('g-bicycle', 30, 'ico')}<span class="row-t"><b>${esc(v.name)}</b><em>${esc(v.does)}</em></span><i class="tag${v.owned ? '' : ' num'}">${v.owned ? 'Owned' : esc(v.price)}</i></button>`), 'det').replace('<section ', '<section data-testid="dom-garage" ');
}

/** D6b: a street meeting waiting on the map (town.ts), in the side panel's place. */
export interface MeetPanel { what: string; who: string; district: string; choices: string[]; at: number; title: string; hint: string }
function meetSide(t: MeetPanel): string {
  return pn('m-side m12 meet50', `${t.title} · ${t.district}`, `<p class="mt50">${esc(t.what)}</p><p class="mw50">${esc(t.who)}</p>${map(t.choices, (c, i) => `<button class="row sm${i === t.at ? ' on' : ''}" ${go('townMeet', i)} ${st(i)} data-testid="dom-town-${i}"><span class="row-t"><b>${esc(c)}</b></span></button>`)}`, 'det').replace('<section ', '<section data-testid="dom-town" ');
}

const MAP_KEYS: readonly R5Key[] = [['←→↑↓', 'district'], ['T', 'target'], ['Enter', 'open']];

export function r5Map(m: MapModel, x: R5MapExtras, o: { notice: string | null; garage: boolean; meet: MeetPanel | null; alert: string | null; focus: boolean; evening?: boolean }, run: R5Run): string {
  const side = o.meet ? meetSide(o.meet) : o.garage ? garageSide(m) : fileSide(m, x);
  const main: R5Cta = m.focus === 'grid' && m.cta ? [m.cta, 'card', '', 'dom-cta'] : ['Open the district', 'dfile', '', 'dom-cta'];
  const line = o.notice ?? o.meet?.hint ?? o.alert ?? m.note;
  const html = frame({
    id: 'map', g: 'The Day', kind: 'map12', bg: 'night', run,
    top: { title: `Region map · ${x.region}`, crumb: null },
    body: board(m, x) + '\n  ' + side,
    who: o.notice ? null : x.who, line,
    ctas: o.meet ? [] : [...(o.evening ? [["Today's take", NAV, 'evening', 'dom-eve-open'] as R5Cta] : []), ['Place crew', NAV, 'deploy'], main],
    footOpts: o.notice ? { testid: 'dom-notice', lineAct: 'dismiss' } : o.alert && !o.meet ? { testid: 'dom-alert' } : {},
    keys: MAP_KEYS,
  });
  return o.focus ? focusOf(html) : html;
}

/** Focus view (mockup `focus`): the HUD folds away; F brings it back. Presentation only. */
export function focusOf(page: string): string {
  return page.replace(/(<div class="scr nv k-[^"]*">)([\s\S]*)(<\/div><\/div>)$/, (_, a: string, body: string, end: string) => `<div class="scr nv k-fv23"><div class="fv23" data-nocheck="">${a}${body}</div></div><span class="fvh23" data-nocheck="" ${go(NAV, 'focus')}><kbd>F</kbd>Show the HUD</span><i class="fvs23" data-nocheck=""></i>${end.slice(6)}`).replace('data-scr="map" data-testid="r5-map"', 'data-scr="focus" data-testid="r5-focus"');
}

// ---------- Place your crew (mockup `deploy`) ----------

export interface R5Deploy {
  rows: readonly { id: string; name: string; pic: string; colour: string; where: string; placed: boolean; can: boolean }[];
  at: number;
  /** Orders left today, for the panel's title. */
  left: string;
  line: string;
  who: R5Speaker;
}

export function r5Deploy(m: MapModel, x: R5MapExtras, d: R5Deploy, notice: string | null, run: R5Run): string {
  const sel = d.rows[d.at];
  const tray = pn('m-side m12 tray12', `Crew · ${d.left}`, map(d.rows, (r, i) => `<button class="row sm dp12${i === d.at ? ' on' : ''}${r.placed ? ' set' : ''}" ${go('r5dep', i)} ${st(i)} data-testid="dom-dep-${r.id}"${r.can ? '' : ' style="opacity:.6"'}>${faceOf(r.pic, 34, r.colour)}<span class="row-t"><b>${esc(r.name)}</b><em>${esc(r.where)}</em></span>${r.placed ? '<i class="tag">Placed</i>' : ''}</button>`), 'det');
  return frame({
    id: 'deploy', g: 'The Day', kind: 'map12 k-dep12', bg: 'night', run,
    top: { title: 'Place your crew', crumb: null },
    body: board(m, x, { act: 'r5depTo', drag: sel?.can ? sel.pic : undefined }) + '\n  ' + tray,
    who: notice ? null : d.who, line: notice ?? d.line,
    ctas: [['Done', NAV, 'map', 'dom-dep-done']],
    footOpts: notice ? { testid: 'dom-notice', lineAct: 'dismiss' } : {},
    keys: [['↑↓', 'crew'], ['←→↑↓', 'district'], ['Enter', 'place'], ['Esc', 'done']],
  });
}

// ---------- the District file (mockup `district`) ----------

export function r5District(m: DistrictModel, face: string, notice: string | null, run: R5Run): string {
  const own = m.stamp.word === 'RIVAL' ? `${m.rivalName.replace(/^Team /, '')} holds it · ${m.control}% yours` : `${m.stamp.word[0]}${m.stamp.word.slice(1).toLowerCase()} · ${m.control}% yours`;
  const por = pn('f-por', '', `<div class="plinth big">${face}</div><b class="f-name" data-m="name" data-testid="dom-df-title">${esc(m.name)}</b><em class="f-rank" data-testid="dom-df-stamp">${esc(own)}</em>`, 'det');
  const acts = map(m.columns, (c) => `<div class="grp50" style="--c:${c.colour}">${esc(c.name)}</div><div class="chips">${map(c.acts, (a) => `<i class="${a.on ? 'on' : ''}" ${go('dfAct', a.slot)} data-testid="dom-df-act-${a.id}"${a.dim ? ' style="opacity:.45"' : ''}><kbd>${a.key}</kbd>${esc(a.label)}${a.night ? ' ☾' : ''}</i>`)}</div>`);
  const pager = m.pages > 1 ? `<div class="pg50 df50" data-testid="dom-df-pager"><b ${go('dfPage', -1)}>‹ [</b><span>${esc(m.section)} · ${m.page + 1}/${m.pages}</span><b ${go('dfPage', 1)}>] ›</b></div>` : '';
  const stats = pn('f-st', 'Stats', bar('Control', m.control, 0, 'dom-df-control') + bar('Heat', m.heat, 1, 'dom-df-heat') + bar(`${m.rivalName.replace(/^Team /, '')} grip`, m.rival, 2, 'dom-df-rival')
    + `<div class="acts50" data-testid="dom-df-acts">${acts}${pager}</div>`, 'panel');
  const notes = pn('f-tr', 'Targets', map(m.targets, (t, i) => `<div class="trait${t.on ? ' on' : ''}" ${st(i)} ${go('dfTarget', i)} data-testid="dom-df-target-${t.id}"><b>${esc(t.name)}</b><em>${esc(t.pays)}${t.pays ? ' · ' : ''}${esc(t.note)}</em></div>`)
    + `<dl class="facts"><dt>Goal</dt><dd data-testid="dom-df-goal">${esc(m.goal)}</dd><dt>Regard · Dread</dt><dd>♥ ${m.regard} · ✊ ${m.dread}</dd><dt>Today</dt><dd data-testid="dom-df-left">${esc(m.left)}</dd></dl>`);
  const line = notice ?? m.banner?.text ?? m.hint;
  return frame({
    id: 'district', g: 'The Day', kind: 'file f6', bg: 'hq', run,
    top: { title: `District · ${m.name}`, crumb: null },
    body: por + '\n  ' + stats + '\n  ' + notes,
    who: null, line,
    ctas: [['Walk the street', NAV, 'street', 'dom-df-street'], ...(m.cta ? [[m.cta, 'dfCard', '', 'dom-df-cta'] as R5Cta] : [])],
    footOpts: notice ? { testid: 'dom-notice', lineAct: 'dismiss' } : m.banner ? { testid: 'dom-df-banner' } : {},
    keys: [['1-9', 'action'], ['T', 'target'], ['Enter', 'Card'], ['Esc', 'map']],
  });
}

// ---------- Walk the street (mockup `street`) ----------

/** A target's storefront: the town sprite for its kind (shop, gym, route...). */
const SHOP: Record<string, string> = { shop: 'tw-bank', gym: 'tw-dojo', street: 'tw-mart2', route: 'tw-arch', site: 'tw-tower', center: 'tw-pc', ghost: 'tw-memories', crowd: 'tw-eventhall', cave: 'tw-arch', dock: 'tw-counter', police: 'tw-hq' };
export const shopOf = (kind: string): string => SHOP[kind] ?? 'tw-bank';

export interface R5Street {
  district: string;
  targets: readonly { id: string; name: string; kind: string; sub: string; on: boolean }[];
  /** The action picked on the map or the file, shown on each storefront. */
  action: string;
  cta: string | null;
  walker: string;
  who: R5Speaker;
  line: string;
}

export function r5Street(s: R5Street, notice: string | null, run: R5Run): string {
  const n = Math.min(4, s.targets.length);
  const x0 = Math.round((960 - n * 236) / 2) + 6;
  const shops = map(s.targets.slice(0, 4), (t, i) => `<button class="shop3${t.on ? ' on' : ''}" style="left:${x0 + i * 236}px;--d:${i * 120}ms" ${go('dfTarget', i)} data-testid="dom-st-${t.id}"><span class="sign3"><b>${esc(t.name)}</b><em>${esc(t.sub)}</em></span>${SP(shopOf(t.kind), 180, 'bldg')}<i class="act3">${esc(s.action)}</i></button>`);
  const at = Math.max(0, s.targets.findIndex((t) => t.on));
  const walker = `<div class="walker3" style="left:${x0 + at * 236 + 150}px">${s.walker}</div>`;
  return frame({
    id: 'street', g: 'The Day', kind: 'street', bg: 'street', run,
    top: { title: `${s.district} · The street`, crumb: null },
    body: `<div class="sky3" data-nocheck=""></div><div class="road3" data-nocheck=""></div>\n  ${shops}\n  ${walker}`,
    who: notice ? null : s.who, line: notice ?? s.line,
    ctas: [['Back to the map', 'back'], ...(s.cta ? [['Go in', 'dfCard', '', 'dom-st-go'] as R5Cta] : [])],
    footOpts: notice ? { testid: 'dom-notice', lineAct: 'dismiss' } : {},
    keys: [['←→', 'walk'], ['Enter', 'go in'], ['Esc', 'map']],
  });
}

export { rep };
