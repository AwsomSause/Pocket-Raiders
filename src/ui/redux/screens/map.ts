// New UI stage map, ported from the mock-ups' `map` template (four layouts by theme): A the journey over the
// stage's scenery, B the node web, C a tile map with a detail window, D big cards for the next stops.
// The scene hands over what it already worked out for its own drawing; nothing here reads or changes run state.

import { act, B, esc, foot, H, hpb, mini, nodeStyle, tall, W } from '../kit';
import { rxUrl } from '../assets';
import type { ReduxCtx } from '../stage';
import { type BattlePanel, cardWindow } from './battle';

export interface MapSideView { kind: string; glyph?: string; color?: string; used: boolean }
export interface MapNodeView {
  id: string; col: number; row: number;
  /** Stops in this node's column (rows are centred on the route). */
  rows: number;
  kind: string; glyph?: string; fog: boolean;
  visited: boolean; cur: boolean; go: boolean; dim: boolean; harder: boolean;
  /** Index in the scene's cursor list, or -1 when the node cannot be travelled to now. */
  opt: number;
  sides: MapSideView[];
  /** Small marks under the stop: text and colour. */
  marks: (readonly [string, string])[];
  /** Layout D cards: name, what it is and its line of detail. */
  title: string; text: string;
}
export interface MapLegendRow { glyph: string; color: string; text: string }
export interface MapModel {
  title: string;
  chips: string[];
  /** Type names of the stage, and the lines the old header showed under it. */
  types: string[];
  lines: string[];
  party: { file: string | null; hp: number; label: string }[];
  eggs: string[];
  /** Scenery file under assets/images, or null. */
  art: string | null;
  trainer: string | null;
  columns: number; column: number;
  nodes: MapNodeView[];
  edges: { a: string; b: string; open: boolean; walked: boolean }[];
  buttons: { label: string; opt: number; hot: boolean }[];
  keys: (readonly [string, string])[];
  hints: (readonly [string, string])[];
  index: number;
  info: string;
  notice: string;
  /** Node being travelled to (the trainer walks there). */
  going: string | null;
  banner: { top: string; title: string; sub: string; plan: readonly string[] } | null;
  /** The legend window (L), when open. */
  legend: MapLegendRow[] | null;
  /** The Ability card of the party Pokémon the pointer rests on (the mock-ups' Pokémon info card), or null. */
  card?: BattlePanel | null;
}

const pick = (opt: number): string => (opt >= 0 ? `${act('pick', opt)} data-over="over"` : '');

export function mapView(c: ReduxCtx, d: MapModel): string {
  const v = c.v(4);
  const by = new Map(d.nodes.map((n) => [n.id, n]));
  const cur = d.nodes.find((n) => n.cur) ?? null;
  const bar = `<div class="abs row" style="left:16px;right:16px;bottom:14px;gap:6px">${d.buttons.map((b) => B(esc(b.label), b.opt === d.index, `height:32px;font-size:13px;padding:0 4px;flex:1;justify-content:center;min-width:0;white-space:nowrap;overflow:hidden${b.hot && b.opt !== d.index ? ';box-shadow:inset 0 0 0 2px var(--acc)' : ''}`, '', pick(b.opt))).join('')}</div>`;
  const top = H(d.title, 'map', d.hints)
    + `<div class="abs row" style="left:20px;right:20px;top:58px;gap:8px;align-items:flex-start"><div class="row grow" style="flex-wrap:wrap;gap:6px 8px;padding-top:3px">${d.chips.map((t, k) => `<span class="tg${k ? ' no' : ''}">${esc(t)}</span>`).join('')}${d.eggs.map((t) => `<span class="tg no">Egg ${esc(t)}</span>`).join('')}</div><div class="row" style="flex:none;gap:6px;align-items:flex-start">${d.party.map((p, k) => `<div class="col" style="gap:2px;align-items:center" title="${esc(p.label)}" data-tip="mon:${k}">${p.file ? mini(p.file, 30) : ''}${hpb(p.hp, 30)}</div>`).join('')}</div></div>`;
  const slider = `<div class="abs row" style="left:20px;right:20px;bottom:54px;gap:8px"><span class="sm">Stops</span><div class="hp gold" style="flex:1;height:8px"><i style="width:${Math.round((Math.max(0, d.column) / Math.max(1, d.columns)) * 100)}%"></i></div><span class="sm">${Math.max(0, d.column)} / ${d.columns}</span></div>`;
  const keys = d.keys.map(([k, t]) => `<span${act('key', k)} style="cursor:pointer"><kbd>${esc(k)}</kbd>${esc(t)}</span>`).join(' ');
  // The line about the stop or button under the cursor, and the notice corner (layouts A, B and D keep them over the slider).
  const side = `${d.notice ? `<div class="acc">${esc(d.notice)}</div>` : ''}${d.lines.map((t) => `<div>${esc(t)}</div>`).join('')}`;
  const info = (y: number): string => `<div class="abs row" style="left:20px;right:20px;top:${y}px;gap:16px;align-items:flex-start"><div class="sm grow" style="line-height:18px;max-height:54px;overflow:hidden">${esc(d.info)}</div><div class="sm" style="font-size:11px;line-height:13px;max-width:470px;max-height:52px;overflow:hidden;text-align:right">${side}</div></div><div class="abs sm" style="right:20px;bottom:72px;font-size:11px">${keys}</div>`;
  const banner = d.banner ? `<div class="abs" style="left:0;right:0;top:168px;height:${d.banner.plan.length ? 230 : 168}px;background:var(--p);box-shadow:inset 0 6px 0 var(--acc),inset 0 -6px 0 var(--acc),0 0 0 400px #0008;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px"><b class="acc" style="font-size:22px">${esc(d.banner.top)}</b><b style="font-size:48px;line-height:54px">${esc(d.banner.title)}</b><span style="font-size:17px">${esc(d.banner.sub)}</span>${d.banner.plan.length ? `<div class="sm" style="text-align:center;line-height:18px">Built from your last stage:<br>${d.banner.plan.map(esc).join('<br>')}</div>` : ''}</div>` : '';

  const legend = (d.legend ? `<div class="fill" style="z-index:7"${act('legend')}></div>` + W(`<b class="acc">Legend</b><div style="display:grid;grid-template-columns:repeat(${d.legend.length > 12 ? 4 : 1},1fr);gap:5px 12px">${d.legend.map((r) => `<div class="row" style="gap:8px;min-width:0"><i style="width:20px;height:20px;flex:none;border-radius:50%;background:${r.color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-style:normal;font-weight:700">${esc(r.glyph)}</i><span style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.text)}</span></div>`).join('')}</div>`, `position:absolute;right:20px;top:60px;width:${d.legend.length > 12 ? 892 : 230}px;display:flex;flex-direction:column;gap:7px;padding:12px 14px;z-index:8`, '', act('legend')) : '') + (d.card ? cardWindow(d.card) : '');
  // One stop: the mock-ups' disc, with the game's extra marks around it.
  const dot = (n: MapNodeView, x: number, y: number): string => {
    const [col, ch] = n.fog ? ['#56607a', '?'] as const : nodeStyle(n.kind);
    const lit = n.opt >= 0 && n.opt === d.index;
    const sides = n.sides.map((s, k) => { const [sc, sg] = s.color ? [s.color, s.glyph ?? '?'] as const : nodeStyle(s.kind); return `<i style="position:absolute;left:${24 + k * 17}px;top:-12px;width:18px;height:18px;border-radius:50%;background:${sc};color:#fff;font:700 11px/18px inherit;text-align:center;font-style:normal;box-shadow:0 0 0 2px var(--l);opacity:${s.used ? 0.35 : 1}">${esc(sg)}</i>`; }).join('');
    const marks = n.marks.length ? `<span style="position:absolute;left:50%;top:40px;transform:translateX(-50%);white-space:nowrap;font-size:10px;line-height:12px;display:flex;gap:3px">${n.marks.map(([t, mc]) => `<i style="font-style:normal;background:#000a;color:${mc};padding:0 3px;border-radius:3px">${esc(t)}</i>`).join('')}</span>` : '';
    return `<div class="nd${n.visited && !n.cur ? ' off' : n.dim ? ' off' : ''}${n.go ? ' go' : ''}${lit ? ' foc' : ''}" style="left:${x}px;top:${y}px;--c:${col}${n.harder && !n.fog ? ';outline:3px solid #9048c8;outline-offset:2px' : ''}"${pick(n.opt)}>${esc(n.fog ? ch : n.glyph ?? ch)}${n.cur ? '<u></u>' : ''}${sides}${marks}</div>`;
  };
  // Where a stop sits: columns left to right inside a window that keeps the trainer in view, rows centred.
  const place = (x0: number, dx: number, shown: number, mid: number, dy: number) => {
    const c0 = Math.max(1, Math.min(Math.max(1, d.columns - shown + 1), Math.max(1, d.column) - 2));
    return { on: (n: MapNodeView) => n.col >= c0 && n.col < c0 + shown, x: (n: MapNodeView) => x0 + (n.col - c0) * dx, y: (n: MapNodeView) => Math.round(mid + (n.row - (n.rows - 1) / 2) * dy) };
  };
  const web = (p: ReturnType<typeof place>, line: (ax: number, ay: number, bx: number, by2: number, e: MapModel['edges'][number]) => string): { lines: string; dots: string; me: string } => {
    let lines = '';
    for (const e of d.edges) { const a = by.get(e.a), b = by.get(e.b); if (a && b && p.on(a) && p.on(b)) lines += line(p.x(a), p.y(a), p.x(b), p.y(b), e); }
    const dots = d.nodes.filter(p.on).map((n) => dot(n, p.x(n), p.y(n))).join('');
    const to = d.going ? by.get(d.going) : null, at = to && p.on(to) ? to : cur && p.on(cur) ? cur : null;
    const from = to && cur && p.on(cur) ? cur : null;
    const me = at && d.trainer ? foot(p.x(at), p.y(at) - 10, tall(d.trainer, 84), from ? `--fx:${p.x(from) - p.x(at)}px;--fy:${p.y(from) - p.y(at)}px;animation:rx-walk .38s ease-in-out both;z-index:4;pointer-events:none` : 'z-index:4;pointer-events:none') : '';
    return { lines, dots, me };
  };
  const scenery = d.art ? `background:url(${rxUrl(d.art)}) 50% 70%/cover;image-rendering:pixelated` : 'background:var(--p2)';

  if (v === 1) {
    const rows = Math.max(1, ...d.nodes.map((n) => n.rows)), p = place(80, 100, 9, 255, Math.min(85, 210 / Math.max(1, rows - 1)));
    const w = web(p, (ax, ay, bx, by2, e) => `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by2}"${e.open ? ' style="stroke:var(--acc);opacity:1;stroke-dasharray:none"' : e.walked ? ' style="opacity:1"' : ''}/>`);
    return top + `<svg class="fill" viewBox="0 0 960 540" style="stroke:var(--f);stroke-width:4;stroke-dasharray:3 9;stroke-linecap:round;opacity:.7">${w.lines}</svg>` + w.dots + info(398) + slider + bar + banner + legend;
  }
  if (v === 2) {
    const rows = Math.max(1, ...d.nodes.map((n) => n.rows)), p = place(60, 68, 8, 185, Math.min(70, 230 / Math.max(1, rows - 1)));
    const w = web(p, (ax, ay, bx, by2, e) => `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by2}" style="stroke:${e.open ? 'var(--acc)' : '#fff'};opacity:${e.open || e.walked ? 1 : 0.55}"/>`);
    const f = d.nodes.find((n) => n.opt >= 0 && n.opt === d.index) ?? null;
    const head = f ? f.title : d.buttons.find((b) => b.opt === d.index)?.label ?? '';
    return top + `<div class="abs" style="left:20px;top:104px;width:600px;height:330px;${scenery};box-shadow:0 0 0 3px var(--f),0 0 0 6px var(--l);overflow:hidden"><div class="fill" style="background:linear-gradient(#0003 2px,#0000 2px) 0 0/60px 55px,linear-gradient(90deg,#0003 2px,#0000 2px) 0 0/60px 55px"></div><svg class="fill" viewBox="0 0 600 330" style="stroke-width:3;stroke-dasharray:2 7;stroke-linecap:round">${w.lines}</svg>${w.dots}</div>`
      + `<div class="abs col" style="left:644px;right:20px;top:104px;gap:12px">${W(`<b class="acc" style="font-size:20px">${esc(head)}</b><div class="sm" style="line-height:19px;max-height:114px;overflow:hidden">${esc(d.info)}</div>`, 'display:flex;flex-direction:column;gap:8px')}${f ? B('Travel', true, 'justify-content:center', '', act('go')) : ''}</div><div class="abs sm" style="left:644px;right:20px;top:${f ? 318 : 262}px;font-size:12px;line-height:15px;max-height:${f ? 96 : 150}px;overflow:hidden">${side}</div><div class="abs sm" style="left:644px;right:20px;bottom:76px;font-size:11px;line-height:17px">${keys}</div>` + slider + bar + banner + legend;
  }
  if (v === 3) {
    const go = d.nodes.filter((n) => n.opt >= 0), small = go.length > 3;
    return top + `<div class="abs row" style="left:24px;right:24px;top:112px;gap:${small ? 10 : 20}px">${go.map((n) => W(`<div style="height:${small ? 84 : 120}px;margin:-12px -14px 8px;${scenery}"></div><div class="row"><div style="position:relative;width:38px;height:38px;flex:none">${dot({ ...n, opt: -1, go: false, cur: false, sides: [], marks: [] }, 19, 19)}</div><b style="font-size:${small ? 15 : 19}px">${esc(n.title)}</b></div><span class="sm" style="line-height:17px;max-height:${small ? 68 : 51}px;overflow:hidden">${esc(n.text)}</span>${n.sides.length ? `<div class="row sm"><span class="grow">Also here</span><b>${esc(n.sides.map((s) => s.kind).join(', '))}</b></div>` : ''}`, 'flex:1;display:flex;flex-direction:column;gap:6px;overflow:hidden;min-width:0', n.opt === d.index ? 'sel' : '', pick(n.opt))).join('') || W('<b>No stop to travel to from here.</b>', 'flex:1')}</div>` + info(398) + slider + bar + banner + legend;
  }
  const rows = Math.max(1, ...d.nodes.map((n) => n.rows)), p = place(60, 105, 9, 275, Math.min(62, 190 / Math.max(1, rows - 1)));
  const w = web(p, (ax, ay, bx, by2, e) => { const mx = (ax + bx) / 2; return `<path d="M${ax} ${ay} C ${mx} ${ay} ${mx} ${by2} ${bx} ${by2}"${e.open ? ' style="stroke:var(--acc)"' : e.walked ? '' : ' style="opacity:.6"'}/>`; });
  return `<div class="abs" style="left:0;right:0;top:48px;height:340px;${scenery}"></div><div class="abs" style="left:0;right:0;top:300px;height:90px;background:linear-gradient(#0000,var(--g))"></div><svg class="fill" viewBox="0 0 960 540" style="fill:none;stroke:#fff;stroke-width:5;stroke-dasharray:2 11;stroke-linecap:round">${w.lines}</svg>${w.dots}${w.me}` + top + info(398) + slider + bar + banner + legend;
}
