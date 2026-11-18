// The Base page's model (design Part 16 sections 3 to 8, Part 17 sections 2 to 9, Part 29's New look). Plain data the
// view draws: the site pick, the grid (rooms, posts, pieces, the route, the failing square), the three tabs (Build,
// Staff, Defend) with what can be done at the chosen square, the Night's base actions, Walk it, the warning's four
// choices and the Raid's Siege Map. Every option carries the action it sends: the step refuses whatever the page shouldn't
// allow, so the page never decides anything itself.

import { EVIL_DATA, type EvilData } from './data';
import { buildDays, buildProblem, fairOf, freeSquares, layoutOf, nightSpent, pairsAt, pieceCost, pieceDef, previewPiece, roomCost, siteDef, siteOffer, staffFor } from './base';
import { edgeKey, gridOf, isEdge, neighbours, routeOf, sqXY, type Grid } from './baseGrid';
import { hasFx, needsStaff, roomDef, roomOpen, sizeOf } from './baseFx';
import { bailOf, detectiveOf, officeSpeech, raidOn } from './raid';
import { money } from './ledger';
import { inRoster } from './people';
import { WING_IDS, type EvilModeBlock, type PieceId, type RoomType } from './schema';
import type { EvilAction } from './day';

export const BASE_TABS = ['Build', 'Staff', 'Defend'] as const;
/** The page's own state: the tab, the chosen square (or door, "a|b"), the chosen option, a room being moved. */
export interface BaseSel { tab: number; at: string | null; opt: number; moving: string | null }
export const newBaseSel = (): BaseSel => ({ tab: 0, at: null, opt: 0, moving: null });

export interface BaseOption { label: string; sub: string; problem: string | null; action: EvilAction | null; bad: string | null; move?: string }
export interface BaseCell { at: string; x: number; y: number; kind: 'door' | 'common' | 'office' | 'slot' | 'room'; name: string; sub: string; piece: string | null; post: string | null; open: boolean; route: boolean; sel: boolean; bad: boolean }
export interface BaseDoor { at: string; x: number; y: number; across: boolean; piece: string | null; sel: boolean; bad: boolean }
export interface BaseModel {
  mode: 'none' | 'site' | 'base' | 'walk' | 'raid';
  title: string;
  bg: string | null;
  sites: { id: string; name: string; and: string; local: string; action: EvilAction }[];
  grid: { w: number; h: number; cells: BaseCell[]; doors: BaseDoor[] } | null;
  fair: { ok: boolean; problem: string | null };
  tab: number;
  options: BaseOption[];
  opt: number;
  pairs: string[];
  night: { label: string; problem: string | null; action: EvilAction }[];
  walkIt: { problem: string | null };
  /** The Pen's latch, when there's a Pen. */
  latch: boolean | null;
  warn: { id: string; name: string; is: string; costs: string; gives: string; waits: string | null; action: EvilAction }[];
  walk: { route: { at: string; x: number; y: number; kind: string }[]; at: number; lines: string[]; end: string | null; fight: boolean } | null;
  raid: RaidModel | null;
  hint: string;
}
export interface RaidModel {
  state: string;
  detective: string;
  wings: { id: string; name: string; status: string; left: number; order: string; people: string[] }[];
  orders: { id: string; name: string }[];
  queue: { id: string; name: string; minor: boolean }[];
  log: string[];
  speech: string[];
  choices: { id: string; name: string; problem: string | null }[];
  after: string[];
  fight: boolean;
}

const nameOf = (block: EvilModeBlock, id: string) => block.crew.find((c) => c.id === id)?.name ?? id;

function cellsOf(block: EvilModeBlock, g: Grid, sel: BaseSel, bad: string | null, route: Set<string>, data: EvilData): BaseCell[] {
  const b = block.base!;
  return [...g.cells].map(([at, ch]) => {
    const [x, y] = sqXY(at);
    const r = b.rooms.find((q) => q.at === at);
    const piece = b.pieces.find((p) => p.at === at);
    const post = b.posts.find((p) => p.at === at);
    const kind: BaseCell['kind'] = ch === 'D' ? 'door' : ch === 'C' ? 'common' : at === g.office ? 'office' : r ? 'room' : 'slot';
    const def = r ? roomDef(r.type, data) : null;
    const name = kind === 'door' ? 'Front door' : kind === 'common' ? 'Common Room' : def ? def.name.replace(/^The /, '') : 'Empty';
    const size = r ? ['Small', 'Medium', 'Large'][sizeOf(r, block) - 1]! : '';
    const open = r ? roomOpen(block, r, data) : true;
    const sub = r ? `${size}${r.ready > block.here.day || (r.ready === block.here.day && !open) ? ` · ready day ${r.ready}` : !open ? ' · shut' : ''}${r.staff ? ` · ${nameOf(block, r.staff)}` : ''}` : '';
    return { at, x, y, kind, name, sub, piece: piece ? pieceDef(piece.type, data).name : null, post: post ? nameOf(block, post.id) : null, open, route: route.has(at), sel: sel.at === at, bad: bad === at };
  });
}

function doorsOf(block: EvilModeBlock, g: Grid, sel: BaseSel, bad: string | null, data: EvilData): BaseDoor[] {
  const out: BaseDoor[] = [];
  for (const a of g.cells.keys()) for (const n of neighbours(g, a)) {
    const k = edgeKey(a, n);
    if (out.some((d) => d.at === k) || a === g.door || n === g.door) continue;
    const [ax, ay] = sqXY(a);
    const [nx, ny] = sqXY(n);
    const p = block.base!.pieces.find((q) => q.at === k);
    out.push({ at: k, x: (ax + nx) / 2, y: (ay + ny) / 2, across: ax !== nx, piece: p ? pieceDef(p.type, data).name : null, sel: sel.at === k, bad: bad === k });
  }
  return out;
}

/** What can be done at the chosen square on the chosen tab. */
function optionsAt(block: EvilModeBlock, g: Grid, sel: BaseSel, data: EvilData): BaseOption[] {
  const b = block.base!;
  const at = sel.at;
  if (!at) return [];
  const out: BaseOption[] = [];
  const room = b.rooms.find((r) => r.at === at);
  const tab = BASE_TABS[sel.tab];
  if (sel.moving) {
    const r = b.rooms.find((x) => x.id === sel.moving);
    if (r && !isEdge(at) && freeSquares(b, data).includes(at)) out.push({ label: `Move ${roomDef(r.type, data).name} here`, sub: `${money(data.base.rules.moveCost)}; shut ${data.base.rules.moveDays} day`, problem: null, action: { type: 'moveRoom', id: r.id, to: at }, bad: null });
    out.push({ label: 'Cancel the move', sub: '', problem: null, action: null, bad: null, move: '' });
    return out;
  }
  if (tab === 'Build' && !isEdge(at)) {
    if (!room && g.slots.includes(at)) {
      for (const def of data.base.rooms) {
        if (def.fixed) continue;
        // Slice 21: the Shadow branch removed means removed: the Lab isn't on the list at all (dark methods are shown and refused only while it's in).
        if (def.id === 'lab' && !(block.settings.shadow && block.edges.shadow && data.edges.shadow.on)) continue;
        const problem = buildProblem(block, def.id, data);
        if (def.status === 'disabled' || (problem && /Line|Creed|region|always/.test(problem) && def.status !== 'supported')) continue;
        const cost = roomCost(block, def.id, 1, data);
        const pairs = pairsAt(block, def.id, at, data).map((p) => `${p.other}: ${p.does}`);
        out.push({ label: `${def.name}`, sub: `${cost ? money(cost) : 'free'} · ${buildDays(block, def.id, 1, data)} day(s) · ${def.sizes[0]!.does}${pairs.length ? ` · Next to ${pairs.join('; ')}` : ''}`, problem, action: { type: 'build', room: def.id as RoomType, at }, bad: null });
      }
    } else if (room && !roomDef(room.type, data).fixed) {
      const def = roomDef(room.type, data);
      const next = def.sizes[room.size];
      if (next) out.push({ label: `Enlarge to ${['Small', 'Medium', 'Large'][room.size]}`, sub: `${money(roomCost(block, room.type, room.size + 1, data))} · ${next.does}`, problem: next.status === 'supported' ? null : next.waits ?? null, action: { type: 'enlarge', id: room.id }, bad: null });
      out.push({ label: 'Move…', sub: `${money(data.base.rules.moveCost)}, then pick an empty square`, problem: null, action: null, bad: null, move: room.id });
      out.push({ label: 'Sell', sub: `Back a ${data.base.rules.sellBack === 3 ? 'third' : `1/${data.base.rules.sellBack}`}. Whoever ran it minds.`, problem: null, action: { type: 'sellRoom', id: room.id }, bad: null });
    }
  }
  if (tab === 'Staff' && !isEdge(at)) {
    if (room && needsStaff(room.type, data)) {
      const def = roomDef(room.type, data);
      const who = staffFor(block, room, data);
      for (const c of who) out.push({ label: `Hand ${c.name} the key`, sub: `${def.name} runs on ${def.runsOn}. ${c.rank === 'lead' ? 'Lead to Specialist.' : ''}`, problem: room.staff === c.id ? 'They run it already.' : null, action: { type: 'staff', id: room.id, who: c.id }, bad: null });
      if (!who.length) out.push({ label: 'Nobody can run it', sub: `${def.hand}`, problem: `It needs a Lead with the ${def.runsOn} talent.`, action: null, bad: null });
    }
    if (at !== g.door) {
      const posted = b.posts.find((p) => p.at === at);
      for (const c of inRoster(block)) out.push({ label: `Post ${c.name} here`, sub: c.rank, problem: posted?.id === c.id ? 'Posted here already.' : null, action: { type: 'guard', who: c.id, at }, bad: null });
      if (posted) out.unshift({ label: `Take ${nameOf(block, posted.id)} off`, sub: '', problem: null, action: { type: 'guard', who: posted.id, at: null }, bad: null });
    }
  }
  if (tab === 'Defend') {
    const here = b.pieces.find((p) => p.at === at);
    if (here) out.push({ label: `Take up ${pieceDef(here.type, data).name.replace(/^A /, 'a ')}`, sub: 'Counts against tonight\'s pieces', problem: null, action: { type: 'unplace', id: here.id }, bad: null });
    else {
      for (const def of data.base.pieces) {
        if ((def.on === 'door') !== isEdge(at)) continue;
        const variants = def.puzzle ? data.base.puzzles[def.puzzle].length : 1;
        for (let v = 0; v < variants; v++) {
          const draft = { type: def.id as PieceId, at, ...(def.lock === 'key' || def.lock === 'switch' ? { key: g.common } : {}), ...(def.puzzle ? { variant: v } : {}) };
          const pv = previewPiece(block, draft, data);
          const vname = def.puzzle ? ` (${data.base.puzzles[def.puzzle][v]!.name})` : '';
          out.push({ label: `${def.name}${vname}`, sub: `${pieceCost(block, def.id, data) ? money(pieceCost(block, def.id, data)) : 'free'} · ${def.is}${def.lock === 'key' || def.lock === 'switch' ? ' · its key in the Common Room' : ''}`, problem: pv.problem, action: { type: 'place', piece: draft }, bad: pv.fair && !pv.fair.ok ? pv.fair.at : null });
        }
      }
    }
  }
  return out;
}

export function baseModel(block: EvilModeBlock, sel: BaseSel, data: EvilData = EVIL_DATA): BaseModel {
  const empty: BaseModel = { mode: 'none', title: 'The base', bg: null, sites: [], grid: null, fair: { ok: true, problem: null }, tab: sel.tab, options: [], opt: 0, pairs: [], night: [], walkIt: { problem: null }, latch: true, warn: [], walk: null, raid: null, hint: '' };
  if (!data.base.on) return { ...empty, hint: 'The base is one room for now.' };
  const b = block.base;
  const r = block.raid;
  const warn = r?.state === 'warned' && !r.choice ? data.base.raid.choices.map((c) => ({ id: c.id, name: c.name, is: c.is, costs: c.costs, gives: c.gives, waits: c.status === 'supported' ? null : c.waits ?? null, action: { type: 'warnChoice', choice: c.id } as EvilAction })) : [];
  // The Raid first: after a lost one there's no base left, and the morning after still shows.
  if (r && (raidOn(block) || r.state === 'done')) {
    const RD = data.base.raid;
    const people = (wing: string) => Object.entries(r.where).filter(([, w]) => w === wing).map(([id]) => `${nameOf(block, id)}${r.how[id] && r.how[id] !== 'holds' ? ` (${r.how[id]})` : ''}`);
    const O = RD.office as Record<string, unknown>;
    const raid: RaidModel = {
      state: r.state,
      detective: detectiveOf(block, data).name,
      wings: WING_IDS.map((id) => ({ id, name: RD.wings.find((w) => w.id === id)!.name, status: r.wings[id], left: r.left[id], order: r.orders[id], people: people(id) })),
      orders: RD.orders.map((o) => ({ id: o.id, name: o.name })),
      queue: r.queue.map((id) => ({ id, name: nameOf(block, id), minor: !!block.crew.find((c) => c.id === id)?.minor })),
      log: r.log,
      speech: r.state === 'office' ? officeSpeech(block, data) : [],
      choices: (O.choices as { id: string; name: string }[]).map((c) => ({ id: c.id, name: c.name, problem: c.id === 'pen' && !b?.rooms.some((x) => x.type === 'pen') ? O.noPen as string : c.id === 'window' && !hasFx(block, 'window', data) ? O.noWindow as string : null })),
      after: r.after,
      fight: block.fight?.kind === 'raid',
    };
    return { ...empty, mode: 'raid', title: `The Raid${b ? ` · ${siteDef(b.site, data)!.name}` : ''}`, bg: b ? siteDef(b.site, data)!.bg : null, raid, hint: r.state === 'door' ? 'They knock. Open the door, or don\'t.' : r.state === 'turns' ? 'One order a wing, then play the turn.' : r.state === 'office' ? 'The detective, in the Office.' : 'The morning after.' };
  }
  if (!b) {
    const sites = siteOffer(block, data).map((id) => { const s = siteDef(id, data)!; return { id, name: s.name, and: s.and, local: s.local, action: { type: 'pickSite', site: id } as EvilAction }; });
    return { ...empty, mode: 'site', title: 'Somewhere to be found', sites, warn, hint: 'Pick where the team lives this region. One a region.' };
  }
  const site = siteDef(b.site, data)!;
  const g = gridOf(b.site, data);
  const fair = fairOf(b, data);
  const route = new Set(routeOf(layoutOf(b), data));
  const options = optionsAt(block, g, sel, data);
  const opt = Math.max(0, Math.min(options.length - 1, sel.opt));
  const bad = options[opt]?.bad ?? null;
  const grid = { w: g.w, h: g.h, cells: cellsOf(block, g, sel, bad, route, data), doors: doorsOf(block, g, sel, bad, data) };
  const spent = nightSpent(block);
  const nightProblem = (what: string) => (block.here.beat !== 'night' ? data.base.night.nightOnly as string : spent && spent !== what ? `Tonight's already spent: ${spent}.` : null);
  const night: BaseModel['night'] = [
    { label: 'Walk the base', problem: nightProblem('Walk the base'), action: { type: 'walkBase' } },
    ...(hasFx(block, 'window', data) ? [{ label: 'Stand at the window', problem: nightProblem('Stand at the window'), action: { type: 'window' } as EvilAction }] : []),
    ...block.crew.filter((c) => c.cell).flatMap((c) => [
      { label: `Visit ${c.name}`, problem: nightProblem('Visit'), action: { type: 'visit', id: c.id } as EvilAction },
      { label: `Bail ${c.name} (${money(bailOf(c, data))})`, problem: block.team.funds < bailOf(c, data) ? `Not enough Funds for ${money(bailOf(c, data))}.` : null, action: { type: 'bail', id: c.id } as EvilAction },
    ]),
  ];
  const walkProblem = block.here.beat !== 'inPerson' ? 'Walking it takes the in-person slot: at the In person beat.' : block.inPerson?.day === block.here.day ? 'The Boss has already been out today.' : !block.hero ? data.base.walk.noHero! : null;
  const sq = sel.at && !isEdge(sel.at) ? sel.at : null;
  const roomHere = sq ? b.rooms.find((x) => x.at === sq) : undefined;
  const pairs = roomHere ? pairsAt(block, roomHere.type, sq!, data).map((p) => `${p.other}: ${p.does}${p.status === 'supported' ? '' : ' (not yet)'}`) : [];
  const base: BaseModel = { ...empty, mode: 'base', title: `${site.name}`, bg: site.bg, grid, fair: { ok: fair.ok, problem: fair.problem }, tab: sel.tab, options, opt, pairs, night, walkIt: { problem: walkProblem }, latch: b.rooms.some((x) => x.type === 'pen') ? b.latch : null, warn, hint: sel.moving ? 'Pick an empty square to move the room to.' : 'Pick a square (or a door between two) and an option. Enter does it. Esc closes.' };
  if (b.walk) {
    const w = b.walk;
    return { ...base, mode: 'walk', title: `Walk it · ${site.name}`, walk: { route: w.route.map((at) => { const [x, y] = sqXY(at); const c = grid.cells.find((q) => q.at === at)!; return { at, x, y, kind: c.kind === 'office' ? 'boss' : c.kind === 'door' ? 'start' : 'trainer' }; }), at: w.at, lines: w.lines, end: w.end ?? null, fight: block.fight?.kind === 'walk' }, hint: w.end ? 'Enter puts the walk away.' : block.fight ? 'Enter: the battle at this door.' : '' };
  }
  return base;
}
