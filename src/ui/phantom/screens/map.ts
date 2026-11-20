// Phantom UI: the stage map and its pause menu, built from the mock-ups' `map` page (the road as diamonds over the
// stage's scenery washed in the version's colour, the big stage number, the wallet, the card about the next stop,
// the team along the top) and `pause` page (the trainer, slanted words, money and place, the team). They take the
// New UI map's model (../../redux/screens/map.ts); MapScene keeps the cursor, the travel and every rule.
// Presentation only.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { rxUrl } from '../../redux/assets';
import { nodeStyle } from '../../redux/kit';
import type { MapModel, MapNodeView } from '../../redux/screens/map';
import type { NodeMenuModel, PauseModel } from '../../redux/screens/popups';
import { act, esc, hero, keys, mon, page, ransom } from '../kit';
import { phTip } from './party';

/** Six stops across; the window follows the trainer. */
const SHOWN = 6, X0 = 130, DX = 150, MID = 362, DY = 146;

const KEY_FACE: Record<string, string> = { Enter: 'Enter', '←→': '◀▶', '↑↓': '▲▼' };

/** "Unova · Stage 1" and the chip "Stage 1 / 8": the stage number, how many there are and the region's name. */
export function stageOf(title: string, chips: readonly string[]): { no: string; of: string; region: string } {
  const m = /Stage\s+(\d+)\s*\/\s*(\d+)/i.exec(chips.join(' | ')), t = /^(.*?)\s*·\s*Stage\s+(\d+)/i.exec(title);
  return { no: m?.[1] ?? t?.[2] ?? '', of: m?.[2] ?? '', region: t?.[1] ?? title };
}

function node(n: MapNodeView, x: number, y: number, lit: boolean, small = 1): string {
  const [col, ch] = n.fog ? (['#56607a', '?'] as const) : nodeStyle(n.kind);
  const state = lit ? 'sel' : n.cur ? 'here' : n.visited ? 'done' : n.opt >= 0 ? 'next' : n.dim ? 'skip' : '';
  const sides = n.sides.map((s, k) => { const [sc, sg] = s.color ? ([s.color, s.glyph ?? '?'] as const) : nodeStyle(s.kind); return `<u class="ph-side${s.used ? ' used' : ''}" style="--c:${sc};--k:${k}">${esc(sg)}</u>`; }).join('');
  const marks = n.marks.length ? `<span class="ph-marks"><span>${n.marks.map(([t, mc]) => `<i style="color:${mc}">${esc(t)}</i>`).join('')}</span></span>` : '';
  return `<div class="nd ph-nd ${state}${n.harder && !n.fog ? ' hard' : ''}" style="left:${x}px;top:${y}px;--c:${col}${small < 1 ? `;scale:${small}` : ''}" data-key="n${n.id}"${n.opt >= 0 ? act('pick', n.opt, 'over') : ''}><b>${esc(n.fog ? ch : n.glyph ?? ch)}</b>${sides}${marks}</div>`;
}

export function phMap(_ph: PhantomVersion, d: MapModel): string {
  const by = new Map(d.nodes.map((n) => [n.id, n]));
  const c0 = Math.max(1, Math.min(Math.max(1, d.columns - SHOWN + 1), Math.max(1, d.column) - 1));
  const on = (n: MapNodeView): boolean => n.col >= c0 && n.col < c0 + SHOWN;
  // A column of many stops is drawn closer together, with smaller diamonds, so none of them touch.
  const rows = Math.max(1, ...d.nodes.filter(on).map((n) => n.rows)), dy = Math.min(DY, 300 / Math.max(1, rows - 1)), small = dy < DY ? Number((dy / DY).toFixed(2)) : 1;
  const px = (n: MapNodeView): number => X0 + (n.col - c0) * DX, py = (n: MapNodeView): number => Math.round(MID + (n.row - (n.rows - 1) / 2) * dy);
  let base = '', over = '';
  for (const e of d.edges) {
    const a = by.get(e.a), b = by.get(e.b);
    if (!a || !b || !on(a) || !on(b)) continue;
    const path = `M${px(a)} ${py(a)} L${px(b)} ${py(b)}`;
    base += `<path class="ln" d="${path}"></path>`;
    over += `<path class="ln2${e.walked ? ' old' : e.open ? '' : ' far'}" d="${path}"></path>`;
  }
  const lit = d.nodes.find((n) => n.opt >= 0 && n.opt === d.index) ?? null, cur = d.nodes.find((n) => n.cur) ?? null;
  const nodes = d.nodes.filter(on).map((n) => node(n, px(n), py(n), n === lit, small)).join('');
  const to = d.going ? by.get(d.going) ?? null : null, at = to && on(to) ? to : cur && on(cur) ? cur : null;
  const you = at && d.trainer ? `<div class="you ph-you" style="left:${px(at) - 32}px;top:${py(at) - 112}px">${mon(d.trainer, 1.3, 'ol')}</div>${to ? '' : `<div class="youtag ph-youtag" style="left:${px(at) - 54}px;top:${py(at) + 50}px">You are here</div>`}` : '';
  const cols = `<div class="cols ph-cols">${Array.from({ length: Math.min(SHOWN, Math.max(0, d.columns - c0 + 1)) }, (_, k) => `<span style="left:${X0 + k * DX}px" class="${c0 + k === d.column ? 'on' : ''}">${c0 + k}</span>`).join('')}</div>`;

  const st = stageOf(d.title, d.chips), money = d.chips.find((x) => /^₽/.test(x));
  const rest = d.chips.filter((x) => x !== money && !/^Stage\s+\d+\s*\/\s*\d+$/i.test(x));
  const when = rest.filter((x) => /^(Day|Night|Morning|Evening)\b/i.test(x) || /tide|weather|rain|sun|snow|fog|clear/i.test(x));
  const facts = rest.filter((x) => !when.includes(x));
  const day = `<div class="day ph-day"><b>${esc(st.no || String(Math.max(0, d.column)))}</b><div>${st.no ? 'Stage' : 'Stop'}<span>${esc(st.of ? `of ${st.of}` : `of ${d.columns}`)}</span></div><strong>${esc(st.region)}</strong>${when.length ? `<i${when.join(' · ').length > 22 ? ' class="sm"' : ''}>${esc(when.join(' · ').toUpperCase())}</i>` : ''}</div>`;
  const wallet = money ? `<div class="wallet"><small>MONEY</small>${esc(money.replace(/^₽\s*/, '₽'))}</div>` : '';
  const chips = `<div class="ph-mchips">${facts.map((x) => `<span>${esc(x)}</span>`).join('')}<span>Stop ${Math.max(0, d.column)} / ${d.columns}</span>${d.eggs.map((x) => `<span class="egg">Egg ${esc(x)}</span>`).join('')}</div>`;
  const team = `<div class="mini ph-mteam">${d.party.map((p, k) => `<div class="u" title="${esc(p.label)}" data-tip="mon:${k}"><div class="pic">${p.file ? mon(p.file, 0.6, '', p.hp <= 0 ? 'filter:grayscale(1)' : '') : ''}</div><span class="slash ${p.hp <= 20 ? 'low' : p.hp <= 50 ? 'mid' : ''}"><i style="width:${Math.max(0, Math.min(100, p.hp))}%"></i></span></div>`).join('')}</div>`;

  // The card at the right: the stop or the button under the cursor, then what the stage itself says.
  const button = d.buttons.find((b) => b.opt === d.index);
  const [lc, lg] = lit ? (lit.fog ? (['#56607a', '?'] as const) : nodeStyle(lit.kind)) : (['var(--red)', ''] as const);
  const head = lit ? lit.title : button?.label ?? '';
  const stop = `<div class="stop ph-stop" data-key="s${d.index}"><small>${lit ? `NEXT STOP · ${lit.col} OF ${d.columns}` : 'ON THIS MAP'}</small><h3 style="font-size:${head.length > 16 ? 26 : head.length > 11 ? 34 : 46}px">${esc(head)}</h3>${lit ? `<div class="pic" style="background:${lc}"><b>${esc(lit.glyph ?? lg)}</b></div>` : ''}${lit?.text ? `<p>${esc(lit.text)}</p>` : ''}${d.info ? `<p class="info">${esc(d.info)}</p>` : ''}<div class="ph-stage">${d.lines.map((t) => `<p>${esc(t)}</p>`).join('')}</div></div>`;
  const notice = d.notice ? `<div class="pn lt ph-say ph-mnote" data-key="note"><p class="txt">${esc(d.notice)}</p></div>` : '';
  const bar = `<div class="ph-mbar">${d.buttons.map((b) => `<span class="${b.opt === d.index ? 'on' : ''}${b.hot ? ' hot' : ''}"${act('pick', b.opt, 'over')}>${esc(b.label)}</span>`).join('')}</div>`;
  const foot = keys(...d.keys.map(([k, t]) => [k, t.charAt(0).toUpperCase() + t.slice(1), 'key', k] as const), ...d.hints.map(([k, t]) => [KEY_FACE[k] ?? k, t.charAt(0).toUpperCase() + t.slice(1), k === 'Enter' ? 'go' : k === 'L' ? 'legend' : undefined] as const), ['Esc', 'Menu', 'back'] as const);

  const banner = d.banner ? `<div class="ph-shade" data-key="bshade"></div><div class="ph-mban" data-key="ban"><small>${esc(d.banner.top)}</small><h2>${ransom(d.banner.title.toUpperCase(), d.banner.title.length * 3 + 5)}</h2><p>${esc(d.banner.sub)}</p>${d.banner.plan.length ? `<ul>${d.banner.plan.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</div>` : '';
  const legend = d.legend ? `<div class="ph-shade" data-key="lshade"${act('legend')}></div><div class="pn lt ph-mleg${d.legend.length > 12 ? ' wide' : ''}" data-key="leg"><span class="lab">Legend</span><div>${d.legend.map((r) => `<span><u class="ph-side" style="--c:${r.color}">${esc(r.glyph)}</u>${esc(r.text)}</span>`).join('')}</div></div>` : '';
  const scenery = d.art ? ` style="--ph-map0:url(${rxUrl(d.art)})"` : '';
  return page('map', `<div class="bgk"></div><div class="tex"${scenery} aria-hidden="true"></div><div class="wash" aria-hidden="true"></div>`
    + '<div class="shard" style="--cp:polygon(0 0,100% 0,100% 12%,0 26%);inset:0" aria-hidden="true"></div><div class="shard" style="--cp:polygon(0 86%,100% 78%,100% 100%,0 100%);inset:0" aria-hidden="true"></div>'
    + `<svg viewBox="0 0 1280 720" aria-hidden="true">${base}${over}</svg>` + nodes + you + cols + day + wallet + chips + team + stop + notice + bar + foot
    + (d.card ? phTip(d.card, 'ph-mtip') : '') + legend + banner);
}

export interface PhPauseModel extends PauseModel {
  /** The line over the title ("Stage 1 of 8 · Unova"). */
  where: string;
  facts: readonly (readonly [string, string])[];
  party: readonly { file: string | null; hp: number }[];
}

/** The pause menu: a whole page, as the mock-up draws it. A click on the trainer's side resumes. */
export function phPause(ph: PhantomVersion, d: PhPauseModel): string {
  const rows = d.options.map((o, k) => `<div class="h${k === d.index ? ' on' : ''}${o.off ? ' off' : ''}" style="--i:${k};--r:${[-5, -2, -4, -1, -3][k % 5]}deg;--ml:${[0, 40, 14, 56, 26, 6, 44][k % 7]}px" data-key="p${k}"${act('pause', k, 'pauseOver')}>${esc(o.label)}</div>`).join('');
  return page('pause', '<div class="bgr"></div><div class="burst" style="--x:75%;--y:60%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div><div class="shard" style="--cp:polygon(0 0,40% 0,22% 100%,0 100%);inset:0" aria-hidden="true"></div>'
    + `<div class="ph-resume"${act('pause', -1)}></div><div class="hero ph-dk-hero">${hero(ph.hero, 11, 'sh', 'position:absolute;left:30px;top:24px')}${hero(ph.hero, 11, 'ol', 'position:relative')}</div>`
    + `<div class="hd" style="top:10px"><small>${esc(d.where)}</small>Pause</div><div class="hub ph-dk${d.options.length > 7 ? ' many' : ''}">${rows}</div>`
    + `<div class="facts">${d.facts.map(([a, b]) => `<span><b>${esc(a.toUpperCase())}</b>${esc(b)}</span>`).join('')}</div>`
    + `<div class="mini">${d.party.map((p) => `<div class="u"><div class="pic">${p.file ? mon(p.file, 0.6, '', p.hp <= 0 ? 'filter:grayscale(1)' : '') : ''}</div><span class="slash ${p.hp <= 20 ? 'low' : p.hp <= 50 ? 'mid' : ''}"><i style="width:${Math.max(0, Math.min(100, p.hp))}%"></i></span></div>`).join('')}</div>`
    + (d.note ? `<div class="pn ph-dk-note" data-key="n${d.index}"><p class="txt">${esc(d.note)}</p></div>` : '')
    + keys(['Enter', 'Open', 'pause', d.index], ['Esc', 'Close', 'pause', -1]));
}

/** A node's own menu: the map dims and the node's stops stand in a row of cards. A click beside them closes it. */
export function phNodeMenu(d: NodeMenuModel): string {
  const n = d.cards.length;
  const cards = d.cards.map((r, k) => `<div class="pn ph-nmc${k === d.index ? ' lt on' : ''}${r.off ? ' off' : ''}" style="--i:${k};--r:${[-2, 1.5, -1, 2][k % 4]}deg" data-key="m${k}"${act('menu', k, 'menuOver')}><span class="ph-nmk" style="background:${r.color}">${esc(r.kind)}</span><h3 class="tl1">${esc(r.name)}</h3><p class="txt">${esc(r.text)}</p><em class="${r.must && !r.off ? 'must' : ''}">${esc(r.status)}</em></div>`).join('');
  return `<div class="ph-shade" data-key="nmshade"${act('menu', -1)}></div><div class="ph-nm n${Math.min(6, n)}" data-key="nm"><div class="hd ph-nmh"><small>${esc(d.header ? `${d.header}: done` : 'This stop')}</small>What to do here?</div><div class="ph-nmr">${cards}</div></div>`;
}
