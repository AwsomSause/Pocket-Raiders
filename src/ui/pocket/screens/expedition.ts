// The Pocket look's Expedition pages (mock-ups `xp-gate`, `xp-route`, `xp-stop`, `xp-recruit`, `xp-draft`, `xp-extract`,
// `xp-result`, `xp-fail`): the gate's briefing, the route up the ridge with a stop per layer, a stop's choice, the
// draft and recruit cards, Extract now as both sides, and the haul or the loss. MapScene and ExpeditionScene keep the
// state, the cursor and the input; these only draw what they hand over. Presentation only.

import { act, back, esc, keys, page, spr, sprH, type PkKey } from '../kit';
import { itemArt, type PkArt } from '../art';
import { fit, fitBody, fitPic } from '../templates';

export interface PkXpOpt { label: string; detail: string; off?: boolean }
export interface PkXpActs { pick: string; over: string }
const ROUTE_ACTS: PkXpActs = { pick: 'pick', over: 'over' };

const EMB = (area = 'xp'): string => `<i class="emb28 ${area} card" data-nocheck></i>`;
const BG = 'packs/memories/eventbg/mountain.png';
const beats = (at: number): string => `<div class="beats">${['Talk', 'Choose', 'Result', 'Reward'].map((t, k) => `<i class="${k < at ? 'past' : k === at ? 'on' : ''}">${k + 1} ${t}</i>`).join('')}</div>`;
const where = (tag: string, name: string, sub: string): string =>
  `<div class="ev-where" data-m="hdr" data-key="xp-where"><em>${esc(tag)}</em><b style="font-size:${fit(name, 420, 30, 20, 0.55)}px">${esc(name)}</b><span>${esc(sub)}</span></div>`;
const choices = (opts: readonly PkXpOpt[], index: number, a: PkXpActs): string =>
  `<div class="dr-ch" data-key="xp-ch">${opts.map((o, k) => `<div class="btn${k === index ? ' on' : ''}${o.off ? ' off' : ''}" data-key="xp-ch-${k}"${act(a.pick, k, a.over)}><b style="font-size:${fit(o.label, 340, 28, 18, 0.55)}px">${esc(o.label)}</b>${o.detail ? `<span>${esc(o.detail)}</span>` : ''}</div>`).join('')}</div>`;
const card = (kicker: string, name: string, text: string, rows: readonly (readonly [string, string])[], area = 'xp'): string =>
  `<div class="dr-card" data-key="xp-card">${EMB(area)}<em>${esc(kicker)}</em><b style="font-size:${fit(name, 330, 46, 24, 0.55)}px">${esc(name)}</b><span style="font-size:${fitBody(text, 390, 40, [13, 12, 11], 1.35)}px">${esc(text)}</span>${rows.slice(0, 5).map(([k, v]) => `<p><i>${esc(k)}</i><span style="font-size:${fit(v, 300, 13, 10, 0.5)}px">${esc(v)}</span></p>`).join('')}</div>`;
const say = (t: string): string => (t ? `<div class="tb" data-m="tb" data-key="xp-tb"><p style="font-size:${fitBody(t, 880, 52, [18, 16, 15, 14, 13], 1.4)}px">${esc(t)}</p></div>` : '');

export interface PkXpDoorModel {
  /** `gate` is the Expedition Gate; `stop` a stop's question on the route (rest, a mystery, one recruit). */
  kind: 'gate' | 'stop';
  where: string;
  sub: string;
  kicker: string;
  name: string;
  text: string;
  rows: readonly (readonly [string, string])[];
  options: readonly PkXpOpt[];
  index: number;
  say: string;
  /** What Esc does, as the key row says it ('' leaves it out). */
  esc: string;
  /** A Pokémon standing by the card (a recruit). */
  mon?: PkArt | null;
  /** Another area's door in the same frame: Totem territory (`tm`) or a raid den (`rd`), its page id and backdrop. */
  area?: { key: 'tm' | 'rd'; tag: string; page: string; cls: string; bg: string };
}

/** The gate's briefing and a stop's question: the card at the left, the choices at the right, the line at the bottom. */
export function pkXpDoor(d: PkXpDoorModel, a: PkXpActs = ROUTE_ACTS): string {
  const ar = d.area;
  const cls = ar ? `hg33 ar28 a-${ar.key} event e9 dr22 st27 ${ar.cls}` : d.kind === 'gate' ? 'hg33 ar28 a-xp event e9 dr22 st27 xpg27' : `event e9 dr22 st27 ar28 a-xp xps30${d.mon ? ' hg33 rc35' : ''}`;
  const mon = d.mon ? `<i class="rec35" data-nocheck data-key="xp-mon">${fitPic(d.mon, 160, 160, '', 3)}</i>` : '';
  const ks: PkKey[] = [['↑↓', 'choose'], ['Enter', 'confirm'], ...(d.esc ? [['Esc', d.esc] as const] : [])];
  const frame = d.kind === 'gate' || d.mon || ar ? '<i class="fr33 l" data-nocheck></i><i class="fr33 r" data-nocheck></i>' : '';
  return page(ar ? ar.page : d.kind === 'gate' ? 'xp-gate' : d.mon ? 'xp-recruit' : 'xp-stop', 51, `<div class="scr ${cls}" data-key="xp-door">${back(ar?.bg ?? BG, 'ar-bg dim')}<i class="ev-vig"></i>${where(ar?.tag ?? 'Expedition', d.where, d.sub)}${beats(1)}${card(d.kicker, d.name, d.text, d.rows, ar?.key)}${mon}${choices(d.options, d.index, a)}${say(d.say)}${keys(ks)}${frame}</div>`);
}

export interface PkXpNode {
  layer: number;
  row: number;
  rows: number;
  kind: string;
  title: string;
  past: boolean;
  on: boolean;
  /** Its place among the stops you can go to now (-1: not one). */
  opt: number;
}

export interface PkXpRouteModel {
  name: string;
  /** "Expedition" or "Legendary event". */
  tag: string;
  layers: number;
  /** The layer you stand on, from 1 (0 at the gate). */
  layer: number;
  nodes: readonly PkXpNode[];
  edges: readonly { a: number; b: number; went: boolean }[];
  party: readonly { art: PkArt | null; hp: number }[];
  boss: PkArt | null;
  /** The Trainer's walk sheet (a URL), standing on the current stop. */
  walker: string | null;
  /** The lit choice's line ("Trainer battle: stop 2"). */
  now: string;
  money: number;
  items: number;
  index: number;
  /** The place of Extract now among the choices (-1: none). */
  extract: number;
  /** The run's steps for this kind of expedition, and the one you are on. */
  flow: readonly string[];
  step: number;
  lines: readonly string[];
}

/** Each stop's sign and colour on the ridge (the mock-up's XK table, and the game's other stops). */
const XK: Record<string, readonly [string, string]> = {
  wild: ['?', '#2f9e44'], trainer: ['VS', '#e3350d'], cache: ['▣', '#b97f00'], rest: ['+', '#d9468f'], elite: ['★', '#7a4fd0'], megaEnergy: ['M', '#1f8fa8'],
  mystery: ['!', '#56627f'], finale: ['♛', '#0d1530'], research: ['?', '#2a75bb'], recruit: ['R', '#12879c'], totem: ['T', '#e8891a'], raid: ['X', '#d9267d'], blocked: ['×', '#5a4a4a'],
};

/** Where a layer's stops stand: the ridge climbs from the bottom left to the top right (the mock-up's 5 layers, stretched to any). */
export function xpPlace(layer: number, row: number, rows: number, layers: number): { x: number; y: number; ground: number } {
  const span = Math.max(1, layers - 1), step = 640 / span;
  const ground = Math.round(434 - layer * (236 / span));
  const gap = rows > 2 ? 64 : 106;
  return { x: Math.round(105 + layer * step), y: ground - 30 + row * gap, ground };
}

const SKY = '<defs><linearGradient id="sk42" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#27357f"/><stop offset=".5" stop-color="#b9638f"/><stop offset=".82" stop-color="#ffb072"/><stop offset="1" stop-color="#fff0c0"/></linearGradient><linearGradient id="rk42" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2a52"/><stop offset="1" stop-color="#100c22"/></linearGradient><radialGradient id="xl44"><stop offset="0" stop-color="#ffd27a" stop-opacity=".7"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>'
  + '<rect width="960" height="540" fill="url(#sk42)"/><circle cx="236" cy="286" r="150" fill="#fff3c0" opacity=".22"/><circle cx="236" cy="286" r="62" fill="#fff6d6"/>'
  + [-60, 130, 350, 580, 830].map((x) => `<polygon points="226,286 246,286 ${x},40 ${x - 110},40" fill="#fff3c0" opacity=".12"/>`).join('')
  + '<circle cx="868" cy="132" r="74" fill="#fff1c4"/><circle cx="868" cy="132" r="90" fill="#fff1c4" opacity=".18"/>'
  + '<polygon points="0,340 90,280 170,320 260,240 340,300 430,225 520,290 620,205 700,262 800,190 880,250 960,214 960,540 0,540" fill="#2c1c46" opacity=".8"/>';
const STARS = [[60, 90], [150, 60], [250, 120], [330, 70], [420, 130], [520, 84], [610, 110], [700, 76], [300, 200], [470, 190]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#fff" opacity=".28"/>`).join('');
const CLOUDS = [[150, 262, 190], [520, 206, 170], [330, 322, 150], [760, 150, 120]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="12" fill="#fff" opacity=".3"/><ellipse cx="${x! + 40}" cy="${y! + 8}" rx="${Math.round(r! * 0.7)}" ry="8" fill="#ffd6e8" opacity=".3"/>`).join('');
const LAVA = '<path d="M960,318 L884,352 L906,404 L806,436 L846,494 L772,540" fill="none" stroke="#ff8a3c" stroke-width="16" opacity=".25" stroke-linejoin="round"/><path d="M960,318 L884,352 L906,404 L806,436 L846,494 L772,540" fill="none" stroke="#ffc46a" stroke-width="5" stroke-linejoin="round"/><path d="M884,352 L836,340 M806,436 L742,424 L700,452" fill="none" stroke="#ffc46a" stroke-width="3" opacity=".8"/>';
const TENT = '<polygon points="18,434 44,392 70,434" fill="#e3350d"/><polygon points="44,392 52,434 36,434" fill="#7a1a06"/><path d="M44,392 V378 h14 l-5,5 5,5 h-14" fill="#ffcb05" stroke="#0d1530" stroke-width="2"/>';
const ARCS = '<path d="M784.9,180.0 A96,96 0 0 1 788.4,78.3" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.85"/><path d="M755.4,197.0 A130,130 0 0 1 760.2,59.3" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.6"/><path d="M726.0,214.0 A164,164 0 0 1 732.0,40.3" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.35"/>';
const DEPTH = '<svg class="dp48 fr" viewBox="0 0 960 540" preserveAspectRatio="none" data-nocheck><g class="nr48"><polygon points="0,64 300,64 268,90 282,96 226,108 240,116 180,124 194,132 128,140 140,150 70,152 82,164 0,170" fill="#0c1a1c"/><polygon points="0,64 150,64 120,96 132,104 76,128 88,138 30,170 40,182 0,214" fill="#102a22"/><polygon points="420,504 446,470 498,452 556,460 606,440 664,464 692,504" fill="#0c0a1a"/>'
  + [[452, 468, 440], [484, 460, 427], [516, 452, 430], [548, 468, 433], [580, 460, 436], [612, 452, 439], [644, 468, 426]].map(([x, b, t]) => `<polygon points="${x},${b} ${x! + 6},${t} ${x! + 14},${b}" fill="#102a22"/>`).join('') + '</g></svg>';
const FLAG = '<svg class="fg50" viewBox="0 0 80 100" data-nocheck><rect x="6" y="0" width="5" height="100" fill="#0d1530"/><polygon points="11,4 76,4 62,24 76,44 11,44" fill="#1f8fa8" stroke="#0d1530" stroke-width="3"/><g transform="translate(22 6) scale(.36)"><circle cx="50" cy="50" r="45" fill="none" stroke="#fff" stroke-width="5"/><polygon points="14,74 40,36 54,56 66,42 86,74" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M40,36 V14" stroke="#fff" stroke-width="4"/><polygon points="40,14 58,20 40,27" fill="none" stroke="#fff" stroke-width="2"/></g></svg>';
const CREST = '<svg class="cr50" viewBox="0 0 100 100" style="width:40px;height:40px" data-nocheck><circle cx="50" cy="50" r="45" fill="#1f8fa8" stroke="#fff" stroke-width="5"/><polygon points="14,74 40,36 54,56 66,42 86,74" fill="#fff" stroke="#0d1530" stroke-width="3" stroke-linejoin="round"/><path d="M40,36 V14" stroke="#0d1530" stroke-width="4"/><polygon points="40,14 58,20 40,27" fill="#ffcb05" stroke="#0d1530" stroke-width="2"/></svg>';

/** The ridge: a step up per layer, its outline and strata, small pines on each step, the layer numbers. */
function ridge(layers: number, at: number): string {
  const span = Math.max(1, layers - 1), step = 640 / span;
  const pts: string[] = [];
  for (let k = 0; k < layers; k++) {
    const g = xpPlace(k, 0, 1, layers).ground, x = 105 + k * step;
    if (k === 0) pts.push(`0,${g}`);
    if (k < layers - 1) {
      const up = xpPlace(k + 1, 0, 1, layers).ground;
      pts.push(`${Math.round(x + step * 0.47)},${g}`, `${Math.round(x + step * 0.66)},${up}`);
    } else pts.push(`960,${g}`);
  }
  const line = pts.join(' ');
  const strata = [16, 34, 56, 82].map((dy, i) => `<polyline points="${line}" transform="translate(0 ${dy})" fill="none" stroke="#fff" stroke-width="2" opacity="${(0.13 - i * 0.025).toFixed(3)}"/>`).join('');
  const pines = Array.from({ length: Math.max(0, layers - 2) }, (_, i) => {
    const k = i + 1, g = xpPlace(k, 0, 1, layers).ground, x = Math.round(105 + k * step + step * 0.38);
    return `<polygon points="${x - 11},${g} ${x},${g - 30} ${x + 11},${g}" fill="#16302a"/><polygon points="${x - 8},${g - 16} ${x},${g - 42} ${x + 8},${g - 16}" fill="#1f463a"/>`;
  }).join('');
  const nums = Array.from({ length: layers }, (_, k) => {
    const g = xpPlace(k, 0, 1, layers).ground, x = k === layers - 1 ? 932 : Math.round(105 + k * step + 45);
    return `<text x="${x}" y="${g + 60}" class="ly49 ${k + 1 < at ? 'past' : k + 1 === at ? 'on' : ''}" text-anchor="middle">${k + 1}</text>`;
  }).join('');
  return `<polygon points="0,540 ${line} 960,540" fill="url(#rk42)"/>${strata}<polyline points="${line}" fill="none" stroke="#ffcf8a" stroke-width="5" stroke-linejoin="round"/>${pines}${nums}`;
}

/** The route up the ridge: the stops by layer, the trail walked in yellow, the guardian waiting at the top, the next stop's card. */
export function pkXpRoute(d: PkXpRouteModel, a: PkXpActs = ROUTE_ACTS): string {
  const at = (n: PkXpNode) => xpPlace(n.layer, n.row, n.rows, d.layers);
  const lit = d.nodes.find((n) => n.opt >= 0 && n.opt === d.index) ?? null;
  const here = d.nodes.find((n) => n.on) ?? null;
  const trails = d.edges.map((e) => { const p = at(d.nodes[e.a]!), q = at(d.nodes[e.b]!); return { went: e.went, d: `M${p.x},${p.y} L${q.x},${q.y}` }; });
  const svg = `<svg class="mt42" viewBox="0 0 960 540" preserveAspectRatio="none" data-nocheck>${SKY}${ridge(d.layers, d.layer)}${STARS}${LAVA}${TENT}<circle cx="160" cy="404" r="74" fill="url(#xl44)"/><circle cx="900" cy="404" r="90" fill="url(#xl44)"/>${ARCS}${CLOUDS}<path class="tr42" d="${trails.filter((t) => !t.went).map((t) => t.d).join(' ')}"/><path class="tr42 went" d="${trails.filter((t) => t.went).map((t) => t.d).join(' ')}"/></svg>`;
  const nodes = d.nodes.map((n, k) => {
    const p = at(n), [sign, colour] = XK[n.kind] ?? ['?', '#56627f'];
    const label = n.kind === 'finale' || n.opt >= 0 || n.on;
    return `<div class="nd42 ${esc(n.kind)}${n.past ? ' past' : ''}${n.on || n === lit ? ' on' : ''}${label ? ' lab' : ''}" style="left:${p.x}px;top:${p.y}px;--c:${colour}" data-key="xp-n-${k}"${n.opt >= 0 ? act(a.pick, n.opt, a.over) : ''}><i>${esc(sign)}</i><b>${esc(n.title)}</b></div>`;
  }).join('');
  const stand = here ? at(here) : xpPlace(0, 0, 1, d.layers);
  const walker = d.walker ? `<i class="wk you42" style="--s:1;--d:3;background-image:url(${d.walker});left:${here ? stand.x + 40 : 30}px;top:${stand.y - 32}px" data-key="xp-you"></i>` : '';
  const flow = `<div class="fw50 in" data-m="flow">${d.flow.map((t, k) => `<i class="${k < d.step ? 'past' : k === d.step ? 'on' : ''}">${esc(t)}</i>`).join('')}</div>`;
  const pips = `<i class="lp38">${Array.from({ length: d.layers }, (_, k) => `<s class="${k + 1 < d.layer ? 'past' : k + 1 === d.layer ? 'on' : ''}"></s>`).join('')}</i>`;
  const top = `<div class="sm-top" data-m="hdr" data-key="xp-top"><em>${CREST}${esc(d.tag)}</em><b style="font-size:${fit(d.name, 300, 22, 14, 0.6)}px">${esc(d.name)}</b><span class="ls38"><strong>${Math.max(1, d.layer)}</strong>of ${d.layers} layers${pips}</span></div>`;
  const party = `<div class="xpp32" data-m="party" data-key="xp-party">${d.party.slice(0, 6).map((p) => `<span class="${p.hp > 0 ? '' : 'ko'}"><i>${fitPic(p.art, 37, 41, '', 1)}</i><u><s style="width:${Math.max(0, Math.min(100, p.hp))}%"></s></u></span>`).join('')}</div>`;
  const boss = d.boss ? `<div class="fin42" data-key="xp-boss">${sprH(d.boss, 134)}</div>` : '';
  const loot = `₽${d.money.toLocaleString('en-US')}`;
  const rule = `<div class="sm-rule" data-key="xp-rule"><b>Next stop</b><p class="now"><i>Now</i><span style="font-size:${fit(d.now, 190, 14, 11, 0.5)}px">${esc(d.now)}</span></p>${d.lines.slice(-1).map((l) => `<p style="font-size:${fit(l, 200, 12, 10, 0.5)}px">${esc(l)}</p>`).join('')}<p class="loot38 n40"><i>Loot</i><strong>${loot}</strong>${d.items ? `+${d.items} ${d.items === 1 ? 'item' : 'items'}` : ''}</p>${d.extract >= 0 ? `<div class="btn${d.index === d.extract ? ' on' : ''}" data-key="xp-extract"${act(a.pick, d.extract, a.over)}><b>Extract now</b></div>` : ''}</div>`;
  const ks: PkKey[] = [['↑↓', 'pick a stop'], ['Enter', 'go'], ...(d.extract >= 0 ? [['X', 'extract now', a.pick, d.extract] as PkKey] : [])];
  return page('xp-route', 51, `<div class="scr mc51 cf50 ri49 de48 li47 be46 fd45 mo44 sd43 sm22 xp27 ar28 a-xp cs37 oh38 ms39 nb40 pb42" data-key="xp-route">${svg}${top}${party}${nodes}${walker}${boss}${rule}${keys(ks)}${DEPTH}<i class="gl47 s" data-nocheck></i>${flow}${FLAG}</div>`);
}

export interface PkXpDraftModel {
  title: string;
  text: string;
  /** Pokémon already taken (lit, numbered) then the ones on offer. */
  taken: readonly { art: PkArt | null; name: string; types: string }[];
  offer: readonly { art: PkArt | null; name: string; types: string; note: string }[];
  index: number;
  picks: number;
  /** A way past the offer ("Move on"), as the last choice. */
  pass: string | null;
}

/** The draft, the one recruit of a combined party, a recruit stop: a card per Pokémon, the taken ones lit and numbered. */
export function pkXpDraft(d: PkXpDraftModel, a: PkXpActs = ROUTE_ACTS): string {
  const taken = d.taken.map((m, k) => `<p class="on"><span>${fitPic(m.art, 64, 64, '', 2)}</span><b style="font-size:${fit(m.name, 150, 18, 12, 0.55)}px">${esc(m.name)}</b><em>${esc(m.types)}</em><i>Taken</i><u>${k + 1}</u></p>`);
  const offer = d.offer.map((m, k) => `<p class="${k === d.index ? 'gx-lit' : ''}" data-key="xp-d-${k}"${act(a.pick, k, a.over)}><span>${fitPic(m.art, 64, 64, '', 2)}</span><b style="font-size:${fit(m.name, 150, 18, 12, 0.55)}px">${esc(m.name)}</b><em>${esc(m.types)}</em><i>${esc(m.note)}</i></p>`);
  const cards = [...taken, ...offer].slice(0, 6).join('');
  const done = d.taken.length;
  const passBtn = d.pass ? `<div class="btn${d.index === d.offer.length ? ' on' : ''} nx" data-key="xp-pass"${act(a.pick, d.offer.length, a.over)}><b>${esc(d.pass)}</b></div>` : '';
  const lit = d.offer[d.index];
  const note = lit ? `Enter takes ${lit.name}.` : d.pass ? `${d.pass}: no one joins.` : '';
  return page('xp-draft', 51, `<div class="scr sz20 ar28 a-xp pg28" data-key="xp-draft"><div class="sz-h" data-m="hdr"><i class="emb28 xp hd" data-nocheck></i><b>${esc(d.title)}</b><span>${esc(d.text)}</span></div><div class="dk35" data-key="xp-cards">${cards}</div><div class="dkn35" data-key="xp-dn"><b>${done} of ${d.picks} picked</b><p>${esc(note)}</p>${passBtn}</div>${keys([['←→', 'look'], ['Enter', 'pick']])}</div>`);
}

export interface PkXpExtractModel {
  money: number;
  items: readonly string[];
  /** What a finished run would add (Mega Stones and other finale rewards). */
  prize: string;
  left: number;
  boss: PkArt | null;
  keep: number;
  index: number;
}

/** Extract now, as both sides: what you walk out with and what stays, against what the rest of the route could bring. */
export function pkXpExtract(d: PkXpExtractModel, a: PkXpActs = ROUTE_ACTS): string {
  const row = (cls: string, art: string, b: string, s: string, u: string) => `<p class="${cls}"><i>${art}</i><b style="font-size:${fit(b, 190, 16, 11, 0.55)}px">${esc(b)}</b><span>${esc(s)}</span>${u ? `<u>${esc(u)}</u>` : ''}</p>`;
  const items = d.items.length ? `${d.items.length} ${d.items.length === 1 ? 'item' : 'items'}` : 'No items';
  const left = `<div class="sd32 a"><em>Extract now</em><b>Walk out</b>${row('me', spr(itemArt('nugget'), 2), `₽${d.money.toLocaleString('en-US')}`, 'All the money so far', 'Kept')}${row('', spr(itemArt('rare_candy'), 2), items, d.items.join(', ') || 'Nothing found yet', d.items.length ? 'Kept' : '')}${row('out', spr(itemArt('mega_bracelet'), 2), d.prize, 'Stays on the route', 'Missed')}</div>`;
  const right = `<div class="sd32 b"><em>Keep going</em><b>${d.left} ${d.left === 1 ? 'layer' : 'layers'} left</b>${row('boss', d.boss ? sprH(d.boss, 40) : '', 'Win the finale', `Everything, and ${d.prize}`, 'Best')}${row('', '<q>?</q>', 'Lose on the way', `Keep ₽${d.keep.toLocaleString('en-US')}, items lost`, 'Risk')}${row('', '<q>?</q>', 'Either way', 'Your team is safe', '')}</div>`;
  const btns = `<div class="btn${d.index === 0 ? ' on' : ''} nx go32" data-key="xp-go"${act(a.pick, 0, a.over)}><b>Extract now</b></div>`;
  return page('xp-extract', 51, `<div class="scr sz20 ar28 a-xp pg28" data-key="xp-extract"><div class="sz-h" data-m="hdr"><i class="emb28 xp hd" data-nocheck></i><b>Extract now?</b><span>Extract now: keep the loot, skip the finale.</span></div><div class="vs32">${left}<i class="vsb32" data-nocheck>or</i>${right}</div>${btns}${keys([['Enter', 'extract'], ['X', 'keep going', 'back']])}</div>`);
}

export interface PkXpResultModel {
  outcome: 'completed' | 'extracted' | 'failed';
  name: string;
  text: string;
  rows: readonly { art: PkArt | null; title: string; sub: string; on?: boolean }[];
  side: string;
  lines: readonly string[];
  party: readonly (PkArt | null)[];
  counts: readonly (readonly [string, string])[];
}

/** The haul (finished or extracted) or the loss: what you carried out, the team walking home, how far you got. */
export function pkXpResult(d: PkXpResultModel): string {
  const failed = d.outcome === 'failed';
  const title = failed ? 'Expedition Failed' : d.outcome === 'extracted' ? 'Extracted' : 'Expedition Complete';
  const rows = d.rows.slice(0, 4).map((r) => `<p class="${r.on ? 'on' : ''}"><span>${r.art ? spr(r.art, 2) : ''}</span><b style="font-size:${fit(r.title, 170, 18, 12, 0.55)}px">${esc(r.title)}</b><em>${esc(r.sub)}</em></p>`).join('');
  const walk = d.party.slice(0, 6).map((p, k) => `<span style="animation-delay:${(k * 0.12).toFixed(2)}s">${fitPic(p, 80, 80, '', 2)}</span>`).join('');
  return page(failed ? 'xp-fail' : 'xp-result', 51, `<div class="scr sz20 ar28 a-xp res31${failed ? ' lose33' : ''}" data-key="xp-result"><i class="rays25 f" data-nocheck></i><div class="rz-h" data-m="hdr"><i class="emb28 xp hd" data-nocheck></i><em>${esc(d.name)}</em><b>${title}</b><span style="font-size:${fitBody(d.text, 560, 40, [15, 14, 13, 12], 1.3)}px">${esc(d.text)}</span></div>`
    + `<div class="rz-t" data-key="xp-haul">${rows}</div><div class="rz-s" data-key="xp-side"><b>${esc(d.side)}</b>${d.lines.slice(0, 2).map((l) => `<p style="font-size:${fitBody(l, 260, 60, [13, 12, 11], 1.3)}px">${esc(l)}</p>`).join('')}<div class="btn on nx"${act('next')}><b>Back to the map</b></div></div>`
    + `<div class="rz-p" data-m="party"><i class="rz-g" data-nocheck></i><div class="rz-w">${walk}</div><div class="rz-n">${d.counts.map(([b, e]) => `<p><b>${esc(b)}</b><em>${esc(e)}</em></p>`).join('')}</div></div>${keys([['Enter', 'continue']])}</div>`);
}
