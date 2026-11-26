// DOMINION redesign R2 (HQ, pass 50 of plans/evil-mode-rework/redesign-50): the HQ's own pages. Each copies its
// mockup page's pass-50 markup and fills it from core/dominion/floorScreens (plain data). The scene keeps the cursors
// and does the acts; pictures of people come in from the scene (it knows the art and the team's colours).
//
// Pages: floor (floor, floorg, floorb), plot, build, staff, auto (any post's file), staffgear, newfloor, launder,
// glance, mark, rest, arrive (goldenrod).

import type { BuildModel, FloorModel, FloorTile, GearCol, LaunderModel, NewFloorModel, PlotModel, PostCard, PostModel, RestModel } from '../../../../../core/dominion/floorScreens';
import { art, bg, esc, faceOf, foot, frame, keys, map, page, pn, rep, SP, spr, st, tabs, top, type R5Cta, type R5Key, type R5Run, type R5Speaker } from './kit';
import './hq.css';

const act = (name: string, arg: string | number = ''): string => `data-act="${esc(name)}" data-arg="${esc(String(arg))}"`;

/** People on the HQ pages: a full figure `h` px tall, and a round face. */
export interface R5Pics {
  /** Who works in a floor tile (a crew member's look for a room, the holder for the Staff Office), or ''. */
  tile(t: FloorTile, h: number): string;
  /** A member's figure (a post's holder), or ''. */
  member(id: string | null, h: number): string;
  /** A member's round face. */
  face(id: string | null, sz: number): string;
  /** The round face of whoever works in a floor tile, or ''. */
  tileFace(t: FloorTile, sz: number): string;
  /** The colour ring for a member. */
  colour(id: string | null): string;
}

/** The member who speaks on a page (the text box's face and name). */
export interface R5Voice { name: string; pic: string; colour: string }
const who = (v: R5Voice | null): R5Speaker | null => (v ? { name: v.name, pic: v.pic, colour: v.colour } : null);

// ---------- one page per floor (floor11) ----------

/** The tiles shown at once (the mockup's five); the cursor scrolls the rest. */
const TILES = 5;

export function r5Floor(m: FloorModel, run: R5Run, pics: R5Pics, o: { voice: R5Voice | null; line: string; notice: string | null }): string {
  const start = Math.max(0, Math.min(m.at - 2, m.tiles.length - TILES));
  const shown = m.tiles.slice(start, start + TILES);
  const more = m.tiles.length > TILES ? ` · ${start + 1}-${start + shown.length} of ${m.tiles.length}` : '';
  const rail = `<nav class="lift11" data-m="rail" data-testid="r5-lift"><div class="ind11"><i ${act('floorStep', -1)}>▲</i><b>${esc(m.tag)}</b><i ${act('floorStep', 1)}>▼</i></div>
    ${map(m.rail, (r) => (r.locked ? `<button class="lk" ${act('upgrade')} data-testid="r5-floor-locked" title="HQ Lv ${r.lv}">${esc(r.tag)}<em>Locked</em></button>` : `<button class="${r.f === m.f ? 'on' : ''}" ${act('floorTo', r.f)} data-testid="r5-lift-${r.f}">${esc(r.tag)}<em>${esc(r.name)}</em></button>`))}</nav>`;
  const tile = (t: FloorTile, j: number): string => {
    const i = start + j;
    const cls = t.kind === 'fix' ? ' fix' : t.kind === 'sale' ? ' plot' : t.kind === 'free' ? ' plot free5' : '';
    const fig = t.kind === 'sale' ? `<span class="sale11">FOR SALE</span>${SP('g-card-key', 40)}` : t.kind === 'free' ? `<span class="sale11 fr5">FREE</span>${SP('g-card-key', 40)}` : pics.tile(t, 70);
    const ric = t.kind === 'sale' || t.kind === 'free' ? '' : `<span class="ric">${art(t.icon, 24)}</span>`;
    const tid = t.uid ? `dom-room-${t.uid}` : `r5-tile-${t.kind}${t.kind === 'free' || t.kind === 'sale' ? `-${i}` : ''}`;
    return `<button class="rb11${cls}${i === m.at ? ' on' : ''}${t.state && t.state !== 'ok' ? ` s-${t.state}` : ''}" ${act('tile', i)} data-over="tileOver" data-testid="${tid}" style="--d:${j * 70}ms">
    <span class="rlit" data-nocheck=""></span>${fig}${ric}<b>${esc(t.name)}</b><em>${esc(t.sub)}</em></button>`;
  };
  const sel = m.tiles[m.at]!;
  const pic = sel.kind === 'free' || sel.kind === 'sale' ? faceOf(SP('g-card-key', 40), 70, '#e8b23a') : pics.tileFace(sel, 70) || faceOf(art(sel.icon, 44), 70, '#c1121f');
  const det = `${pic}<div class="d11"><b>${esc(sel.name)}</b><i class="tag">${esc(sel.tag)}</i>${map(sel.lines, (l) => `<p>${esc(l)}</p>`)}</div><div class="dc11">${map(sel.ctas, ([l, op, arg], i) => `<button class="cta${i === sel.ctas.length - 1 ? ' on' : ''}" ${act('tileDo', `${op}:${arg}`)} data-testid="r5-cta-${op}">${esc(l)}</button>`)}</div>`;
  const ks: R5Key[] = [['F', 'next floor', 'floorNext'], ['←→', 'room'], ['Enter', 'open'], ['Esc', 'HQ', 'hqBack']];
  const body = `${rail}
  ${pn('strip11', esc(m.head + more), `<div class="rms11" data-testid="dom-build">${map(shown, tile)}</div>`, 'panel')}
  <section class="pn det11" data-m="det" data-testid="r5-floor-det">${det}</section>`;
  return frame({
    id: `floor-${m.f}`, g: 'HQ', kind: `fl11 fl-${m.f === 2 ? 2 : m.f === 1 ? 1 : 0}`, top: { title: `${m.name} · ${m.tag}`, crumb: null }, body, run,
    who: o.notice ? null : who(o.voice), line: o.notice ?? o.line, ctas: [['Back to the HQ', 'hqBack', '', 'r5-back']], footOpts: { testid: o.notice ? 'dom-notice' : 'r5-floor-says', lineAct: o.notice ? 'dismissHq' : undefined }, keys: ks,
  });
}

// ---------- Buy a plot (list) ----------

export function r5Plot(m: PlotModel, run: R5Run, o: { notice: string | null }): string {
  const rows = map(m.rows, (r, i) => `<button class="row${i === m.at ? ' on' : ''}${r.locked ? ' lk5' : ''}" ${act('plotRow', i)} data-over="plotOver" data-testid="r5-plot-${r.f}" ${st(i)}>${spr(r.icon, 1, 'ico')}<span class="row-t"><b>${esc(r.title)}</b><em>${esc(r.sub)}</em></span><i class="tag${r.locked || !r.tag.startsWith('₽') ? '' : ' num'}">${esc(r.tag)}</i></button>`);
  const d = m.det;
  const det = `<div class="plinth">${SP(d.icon, 110, 'dspr')}</div><b class="det-t">${esc(d.title)}</b>${map(d.lines, (l) => `<p>${esc(l)}</p>`)}${d.cta ? `<button class="cta on" ${act('buyPlot', d.f)} data-testid="r5-buy-plot">${esc(d.cta)}</button>` : ''}`;
  const body = `${pn('l-main', esc(m.head), rows, 'panel')}
  <section class="pn l-det" data-m="det">${det}</section>`;
  return frame({ id: 'plot', g: 'HQ', kind: 'list', top: { title: 'Buy a plot', crumb: null }, body, run, line: o.notice ?? undefined, footOpts: { testid: 'dom-notice', lineAct: 'dismissHq' }, keys: [['Enter', 'Choose'], ['Esc', 'Back', 'hqBack'], ['Q', 'Wheel', 'wheel']] });
}

// ---------- Build a room (grid) ----------

export function r5Build(m: BuildModel, run: R5Run, o: { notice: string | null }): string {
  const cells = map(m.cells, (c, i) => `<button class="cell${i === m.at ? ' on' : ''}${c.ok ? '' : ' no5'}" ${act('buildCell', m.page * 6 + i)} data-over="buildOver" data-testid="dom-build-${esc(c.id)}" style="--pc:#3a2a34;--i:${i};--d:${i * 50}ms" title="${esc(c.why ?? '')}"><i class="rr14">${'★'.repeat(c.stars)}</i><span class="cs">${art(c.icon, 64)}</span><b>${esc(c.name)}</b><em>${esc(c.sub)}</em></button>`);
  const body = pn('g-main', esc(m.head), `<div class="cells n6">${cells}</div>`, 'panel');
  return frame({ id: 'build', g: 'HQ', kind: 'grid g-cards', top: { title: 'Build a room', crumb: null }, body, run, line: o.notice ?? undefined, footOpts: { testid: 'dom-notice', lineAct: 'dismissHq' }, keys: [['Enter', 'Choose'], ['Esc', 'Back', 'hqBack'], ['Q', 'Wheel', 'wheel']] }).replace('class="pn g-main"', 'class="pn g-main" data-testid="r5-build-grid"');
}

// ---------- the Staff Office (grid of three posts) ----------

export function r5Staff(cards: readonly PostCard[], at: number, run: R5Run, pics: R5Pics, o: { notice: string | null; floor: string }): string {
  const cells = map(cards, (c, i) => {
    const fig = c.holder ? pics.member(c.holder.id, 64) : SP('t-applicant', 64);
    const tag = !c.holder ? 'Empty' : !c.gear ? 'No gear' : c.on ? 'On' : 'Off';
    return `<button class="cell${i === at ? ' on' : ''}" ${act('staffCell', i)} data-over="staffOver" data-testid="r5-post-${c.role}" style="--pc:${pics.colour(c.holder?.id ?? null)};--i:${i};--d:${i * 50}ms"><i class="rr14">${'★'.repeat(Math.max(1, c.gear))}</i><span class="cs">${fig}</span><b>${esc(c.name)}</b><em>${esc(c.sub)}</em><i class="tag">${tag}</i></button>`;
  });
  const body = pn('g-main', esc(`Staff Office · ${o.floor} · 3 posts`), `<div class="cells n3">${cells}</div>`, 'panel');
  return frame({ id: 'staff', g: 'HQ', kind: 'grid g-cards', top: { title: 'Staff Office', crumb: null }, body, run, line: o.notice ?? undefined, footOpts: { testid: 'dom-notice', lineAct: 'dismissHq' }, keys: [['Enter', 'Choose'], ['Esc', 'Back', 'hqBack'], ['Q', 'Wheel', 'wheel']] }).replace('class="pn g-main"', 'class="pn g-main" data-testid="r5-staff-grid"');
}

// ---------- a post's file (mockup `auto`) ----------

export function r5Post(m: PostModel, run: R5Run, pics: R5Pics, o: { notice: string | null }): string {
  const fig = m.holder ? pics.member(m.holder.id, 190) : SP('t-applicant', 190);
  const bars = map(m.bars, ([l, v, mx], i) => `<div class="bar" ${st(i)}><span>${esc(l.replace(/ ₽[\d,]+$/, ''))}</span><i><u style="width:${mx ? Math.round((100 * v) / mx) : 0}%"></u></i><b>${esc(/₽/.test(l) ? l.split(' ').pop()! : String(v))}</b></div>`);
  const traits = map(m.traits, ([a, b], i) => `<div class="trait" ${st(i)}><b>${esc(a)}</b><em>${esc(b)}</em></div>`);
  const facts = `<dl class="facts" data-testid="r5-post-facts">${map(m.facts, (f, i) => `<dt class="${i === m.factAt ? 'on5' : ''}" ${act('factRow', i)}>${i === m.factAt ? '▶ ' : ''}${esc(f.label)}</dt><dd ${act('factChange', i)} data-testid="r5-fact-${f.key}">${esc(f.value)}</dd>`)}</dl>`;
  const body = `<section class="pn f-por" data-m="det"><div class="plinth big">${fig}</div><b class="f-name" data-m="name">${esc(m.name)}</b><em class="f-rank">${esc(m.rank)}</em></section>
  ${pn('f-st', 'Stats', bars, 'panel')}
  ${pn('f-tr', 'Notes', traits + facts)}`;
  const ctas: R5Cta[] = [['Back', 'hqBack', '', 'r5-back']];
  if (m.buy) ctas.push([m.buy, 'staffBuy', m.role, 'r5-buy-gear']);
  return frame({ id: 'auto', g: 'HQ', kind: 'file f6', top: { title: `Staff Office · ${m.name}`, crumb: null }, body, run, line: o.notice ?? (m.holder ? `${m.holder.name}: “${m.quote}”` : m.quote), ctas, footOpts: { testid: o.notice ? 'dom-notice' : 'r5-post-says', lineAct: o.notice ? 'dismissHq' : undefined }, keys: [['↑↓', 'row'], ['←→', 'change'], ['Enter', 'buy gear'], ['Esc', 'Back', 'hqBack']] }).replace('class="pn f-por"', `class="pn f-por" data-testid="r5-post-${m.role}"`);
}

// ---------- Staff gear ----------

export function r5Gear(cols: readonly GearCol[], at: number, run: R5Run, pics: R5Pics, o: { notice: string | null; voice: R5Voice | null; floor: string }): string {
  const colours = cols.map((c) => pics.colour(c.holder?.id ?? null));
  const html = map(cols, (c, ci) => `<div class="sgc${ci === at ? ' on' : ''}" ${act('gearCol', ci)} data-testid="r5-gear-${c.role}" style="--pc:${colours[ci]};--d:${ci * 120}ms"><div class="sgh">${c.holder ? pics.face(c.holder.id, 44) : faceOf(SP('t-applicant', 40), 44, '#6d6d78')}<span><b>${esc(c.name)}</b><em>${esc(c.who)}</em></span></div>
    ${map(c.rows, (r, i) => `<div class="rg ${i < c.own ? 'own' : i === c.own ? 'next' : 'lock'}" ${st(i, 50)}>${SP(GEAR_ICON[c.role][i]!, 24)}<span><b>${esc(r.name)}</b><em>${esc(r.line)}</em></span><i>${i < c.own ? '✓' : esc(r.price)}</i></div>`)}</div>`);
  const cur = cols[at]!;
  const next = cur.rows[cur.own];
  const ctas: R5Cta[] = [['Back', 'staffOpen', '', 'r5-back']];
  if (next) ctas.push([`Buy it · ${next.price}`, 'staffBuy', cur.role, 'r5-buy-gear']);
  const line = o.notice ?? (next ? `“${next.name}: ${next.line}.”` : `“${cur.name} has the best gear already.”`);
  return frame({
    id: 'staffgear', g: 'HQ', kind: 'sg11', top: { title: 'Staff gear', sub: `Staff Office · ${o.floor}`, crumb: ['HQ', 'hq'] },
    body: pn('sg11', 'Gear for each post · skill = gear + half the stat', `<div class="sgc11">${html}</div>`, 'panel'), run,
    who: o.notice ? null : who(o.voice), line, ctas, footOpts: { testid: o.notice ? 'dom-notice' : 'r5-gear-says', lineAct: o.notice ? 'dismissHq' : undefined }, keys: [['←→', 'post'], ['Enter', 'buy']],
  }).replace('class="pn sg11"', 'class="pn sg11" data-testid="r5-gear-grid"');
}
const GEAR_ICON: Record<GearCol['role'], string[]> = {
  checker: ['g-journal', 'g-storage-key', 'g-silph-scope', 'g-devon-scope', 'g-fame-checker'],
  books: ['g-journal', 'g-machine-part', 'g-letter', 'g-member-card', 'g-relic-gold'],
  care: ['g-machine-part', 'g-black-belt', 'g-idcard', 'g-xtransceiver', 'g-relic-statue'],
};

// ---------- the New floor reveal ----------

export function r5NewFloor(m: NewFloorModel, run: R5Run, pics: { room(id: string, h: number): string }, o: { voice: R5Voice | null }): string {
  const stack = map(m.stack, (x) => `${x.under ? '<i class="gl"></i>' : ''}<span class="sb11${x.isNew ? ' new' : ''}${x.under ? ' ug' : ''}"><b>${esc(x.tag)}</b>${map(x.rooms, (id) => pics.room(id, 54))}</span>`);
  const cards = map(m.cards, ([ic, a, b], i) => `<div class="nfx" style="--d:${500 + i * 160}ms">${art(ic, 34)}<span><b>${esc(a)}</b><em>${esc(b)}</em></span></div>`);
  const body = `${bg('gold', 'HQ', run)}<div class="rw-burst" data-nocheck=""></div>
  <div class="stack11" data-nocheck="">${stack}<i class="dust"></i></div>
  <div class="nfh11" data-m="ttl" data-testid="r5-newfloor-title"><small>${esc(m.level)}</small><b>NEW FLOOR</b><em>${esc(m.title)}</em></div>
  <div class="nfc11">${cards}</div>
  ${foot(who(o.voice), '“Fresh paint, Boss. Come and see the new floor.”', [['Later', 'floorLater', '', 'r5-later'], ['See the floor', 'floorSee', '', 'r5-see']], 'HQ', run)}${keys([['Enter', 'see the floor', 'floorSee'], ['Esc', 'later', 'floorLater']], 'HQ', run)}`;
  return page({ id: 'newfloor', g: 'HQ', kind: 'nf11', body });
}

// ---------- the Laundromat ----------

export function r5Launder(m: LaunderModel, run: R5Run, o: { notice: string | null; voice: R5Voice | null; sub: string }): string {
  const machine = `<div class="wm32" data-m="card"><i class="door"><i class="drum">${rep(6, (i) => `<i style="--a:${i * 60}deg">₽</i>`)}</i></i><span class="pnl"><i></i><i></i><b>${m.ok ? 'WASHING' : 'READY'}</b></span></div>`;
  const pend = m.pending.length ? `<div class="pd5">${map(m.pending.slice(0, 2), (p) => `<em>Coming back: ${esc(p)}</em>`)}</div>` : '';
  const det = `<div class="tt32"><span><small>${esc(m.from[0])}</small><b>${esc(m.from[1])}</b></span><i>→</i><span class="c"><small>${esc(m.to[0])}</small><b>${esc(m.to[1])}</b></span></div><div class="rate32"><b>${esc(m.rate[0])}</b><em>${esc(m.rate[1])}</em></div><div class="hz32"><b>${esc(m.note[0])}</b><em>${esc(m.note[1])}</em></div>${pend}`;
  const body = `${machine}
  <section class="pn lw32" data-m="det" data-testid="dom-money"><h3><i>${m.opt.startsWith('w') ? 'Wash tonight' : 'The Fence'}</i></h3>${det}</section>`;
  return frame({
    id: 'launder', g: 'HQ', kind: 'ld32', top: { title: 'Laundromat', sub: o.sub, crumb: ['HQ', 'hq'] }, body, run,
    who: o.notice ? null : who(o.voice), line: o.notice ?? '“Clean money buys real things, Boss.”', ctas: [['Back', 'hqBack', '', 'r5-back'], [m.label, 'washDo', '', `dom-money-${m.opt}`]],
    footOpts: { testid: o.notice ? 'dom-notice' : 'r5-launder-says', lineAct: o.notice ? 'dismissHq' : undefined }, keys: [['←→', 'amount'], ['Enter', 'wash', 'washDo'], ['Esc', 'back', 'hqBack']],
  });
}

// ---------- At a glance (the capsule's page) ----------

export interface GlanceTile { icon: string; label: string; value: string; line: string; pct: number }
export interface GlanceNeed { title: string; line: string; tone: '' | 'bad' | 'gold'; go: string }

export function r5Glance(tiles: readonly GlanceTile[], needs: readonly GlanceNeed[], at: number, run: R5Run): string {
  const gt = map(tiles, (t, i) => `<div class="gt23" style="--d:${i * 90}ms;--p:${Math.max(0, Math.min(100, t.pct))}%"><span class="gi">${SP(t.icon, 22)}</span><small>${esc(t.label)}</small><b>${esc(t.value)}</b><em>${esc(t.line)}</em><i class="gb23"><i></i></i></div>`);
  const nd = map(needs, (n, i) => `<button class="nd23 ${n.tone}${i === at ? ' on' : ''}" ${act('r5go', n.go)} data-testid="r5-need-${i}" ${st(i, 80)}><b>${esc(n.title)}</b><em>${esc(n.line)}</em></button>`);
  const body = `<section class="gl23" data-m="panel" data-testid="r5-glance-tiles">${gt}</section>
  ${pn('need23', 'Needs you', nd || '<div class="nd23"><b>All quiet</b><em>Nothing needs you right now</em></div>', 'det')}`;
  return frame({
    id: 'glance', g: 'HQ', kind: 'gl23', top: { title: 'At a glance', sub: 'What the capsule means', crumb: ['HQ', 'hq'] }, body, run: { ...run, tip: undefined },
    who: { name: 'Rotom', k: 'p-rotom' }, line: '“Bzzt! Tap the capsule on any page to come back here.”', ctas: [['Back', 'hqBack', '', 'r5-back'], ['Get ready', 'r5go', needs[at]?.go ?? 'hq']], keys: [['↑↓', 'pick'], ['Enter', 'go'], ['Esc', 'back', 'hqBack']],
  });
}

// ---------- The Mark ----------

export interface MarkModel { name: string; initial: string; colour: string; colours: { name: string; hex: string; on: boolean }[]; emblems: { name: string; glyph: string; on: boolean }[]; founded: boolean }

export function r5Mark(m: MarkModel, run: R5Run, o: { voice: R5Voice | null }): string {
  const flag = `<div class="flag24" data-m="emb" style="--mk:${m.colour}" data-testid="r5-mark-flag"><i class="rays" data-nocheck=""></i><span class="st">${esc(m.initial)}</span><b>${esc(m.name.toUpperCase())}</b></div>`;
  const det = `<b class="mh24">Colour</b><div class="sw24">${map(m.colours, (c, i) => `<button class="${c.on ? 'on' : ''}" style="--c:${c.hex};--d:${i * 60}ms"><i></i><em>${esc(c.name)}</em></button>`)}</div>
    <b class="mh24">Emblem</b><div class="em24">${map(m.emblems, (e, i) => `<button class="${e.on ? 'on' : ''}" style="--d:${i * 60}ms"><i>${esc(e.glyph)}</i><em>${esc(e.name)}</em></button>`)}</div>
    <b class="mh24">Armband letter</b><div class="lt24"><kbd>${esc(m.initial)}</kbd><em>${m.founded ? 'Shows on every crew armband' : 'Found the team to pick one'}</em></div>`;
  const body = `${flag}
  ${pn('mk24', 'Your mark', det, 'det')}`;
  return frame({
    id: 'mark', g: 'HQ', kind: 'mark24', top: { title: 'The Mark', sub: `${m.name}’s colours`, crumb: ['HQ', 'hq'] }, body, run,
    who: who(o.voice), line: m.founded ? '“Every wall in town knows this mark now.”' : '“No mark yet, Boss. Found the team first.”', ctas: [['Uniforms', 'r5go', 'uniform'], ['Keep it', 'hqBack', '', 'r5-back']], keys: [['Enter', 'keep', 'hqBack'], ['Esc', 'back', 'hqBack']],
  });
}

// ---------- Lights out ----------

export function r5Rest(m: RestModel, run: R5Run, sleepers: readonly string[], o: { voice: R5Voice | null }): string {
  const bunk = `<div class="bunk35">${map(sleepers.slice(0, 4), (h, i) => `<i style="--i:${i}">${h}<u>z</u></i>`)}</div>`;
  const card = `<div class="eod35" data-m="card" data-testid="r5-rest-card"><small>Day ${m.day} is over</small><b>LIGHTS OUT</b><dl>${map(m.rows, ([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`)}</dl><span class="sv35"><i></i>Saves every step</span></div>`;
  const body = `${bg('night', 'HQ', { ...run, tod: 'night' })}<i class="dk35" data-nocheck=""></i>${bunk}<div class="moon35" data-nocheck=""></div>${card}
  ${foot(who(o.voice), '“Get some sleep, Boss. I’ll keep watch.”', [['Last look at the Ledger', 'r5go', 'ledger'], ['Sleep', 'restSleep', '', 'r5-sleep']], 'HQ', run)}${keys([['Enter', 'sleep', 'restSleep'], ['Esc', 'back', 'hqBack']], 'HQ', run)}`;
  return page({ id: 'rest', g: 'HQ', kind: 'rs35', body });
}

// ---------- Starting over in a new region (mockup `goldenrod`) ----------

export interface ArriveModel { title: string; sub: string; shutters: { icon: string; name: string; line: string; kind: 'own' | 'buy' | 'lock' | 'foe' }[]; rows: [string, string, string][] }

export function r5Arrive(m: ArriveModel, run: R5Run, o: { voice: R5Voice | null; skin: 'kanto' | 'johto' }): string {
  const sh = map(m.shutters, (x, i) => `<button class="sh37 u-${x.kind}${i === 0 ? ' on' : ''}" ${act('r5go', x.kind === 'buy' ? 'plot' : 'floor')} style="--d:${i * 90}ms"><span class="door">${art(x.icon, 40)}</span><b>${esc(x.name)}</b><em>${esc(x.line)}</em></button>`);
  const rows = map(m.rows, ([a, b, c], i) => `<div class="gr37" ${st(i, 90)}><b>${esc(a)}</b><span><i>${esc(b)}</i><em>${esc(c)}</em></span></div>`);
  const body = `${bg('hq', 'HQ', run, { skin: o.skin })}${top('HQ', { title: m.title, sub: m.sub, crumb: ['HQ', 'hq'], id: 'arrive' }, run)}
  <section class="ug37" data-m="panel" data-testid="r5-arrive-row"><i class="pipe" data-nocheck=""></i>${sh}</section>
  ${pn('gs37', 'Starting over', rows, 'det')}
  ${foot(who(o.voice), '“A new base. We’ve had worse, Boss.”', [['Back', 'hqBack', '', 'r5-back'], ['See the floors', 'r5go', 'floor']], 'HQ', run)}${tabs('HQ', run)}${keys([['Enter', 'open'], ['Esc', 'back', 'hqBack']], 'HQ', run)}`;
  return page({ id: 'arrive', g: 'HQ', kind: `gu37 sk-${o.skin}`, body });
}
