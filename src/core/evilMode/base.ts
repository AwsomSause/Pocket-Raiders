// Evil Mode's base (design Part 16; Part 17 sections 2 and 3; Part 5's building costs). One a region: a site picked from
// three the map offers, a grid with a front door, a Common Room and an Office the game places furthest from the door.
// Rooms are built at Night, take days, grow on their own square, and do nothing till somebody with the right talent is
// handed the key (the Lead-to-Specialist promotion). Defend places pieces, at most three a Night, and every change is
// run through the fairness check first: a base is never saved unfair. Pure: `(block, ...) -> { block, problem, line }`.

import { runRegions } from './runLength';
import { EVIL_DATA, type EvilData } from './data';
import { checkFair, delayOf, edgeKey, gridOf, isEdge, neighbours, roomName, type FairResult } from './baseGrid';
import { activePairs, baseOn, fxTotal, hasFx, isDone, needsStaff, roomDef, roomOpen, sizeOf } from './baseFx';
import { appendLog, fill, money } from './ledger';
import { inRoster, moveLoyalty, peopleRoll } from './people';
import { hashSeed, Rng } from '../rng';
import type { BaseState, Crew, EvilModeBlock, Piece, PieceId, Room, RoomType } from './schema';
import { logOf } from './pack';

export interface BaseOut { block: EvilModeBlock; problem: string | null; line: string }
const no = (block: EvilModeBlock, problem: string): BaseOut => ({ block, problem, line: '' });
const ok = (block: EvilModeBlock, line = ''): BaseOut => ({ block, problem: null, line });

export const siteDef = (id: string, data: EvilData = EVIL_DATA) => data.base.sites.find((s) => s.id === id);
export const pieceDef = (t: PieceId, data: EvilData = EVIL_DATA) => data.base.pieces.find((p) => p.id === t)!;
const regionId = (block: EvilModeBlock, data: EvilData) => data.region.regions.find((r) => r.index === block.here.region)?.id ?? 'kanto';
const lastRegion = (block: EvilModeBlock) => runRegions(block) - 1;
/** Slice 16: which region of the run (0 first), not the region's own index. */
const runIdx = (block: EvilModeBlock) => block.region?.crossed?.length ?? 0;

// ---- The site (Part 16 section 2) ----

/** The three sites the map offers: two of the six kinds, drawn from the seed (no gameplay stream), and the region's own. */
export function siteOffer(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  if (!baseOn(data)) return [];
  const moved = block.applied.filter((a) => a.startsWith('base:lost:')).length;
  const rng = new Rng(hashSeed(`${block.district?.seed ?? block.team.name}::evil-site::${block.here.region}::${moved}`));
  const kinds = data.base.sites.filter((s) => s.region === null && s.status !== 'disabled').map((s) => s.id);
  const out: string[] = [];
  while (out.length < Math.min(data.base.offer.kinds, kinds.length)) {
    const k = rng.pick(kinds);
    if (!out.includes(k)) out.push(k);
  }
  const own = data.base.sites.find((s) => s.region === regionId(block, data) && s.status !== 'disabled');
  return own ? [...out, own.id] : out;
}

/** The layout the fairness check reads. */
export const layoutOf = (b: Pick<BaseState, 'site' | 'rooms' | 'pieces' | 'posts'>) => ({ site: b.site, rooms: b.rooms, pieces: b.pieces, posts: b.posts });
export const fairOf = (b: BaseState, data: EvilData = EVIL_DATA): FairResult => checkFair(layoutOf(b), data);

/** A new base on a site: the Office placed, the warehouse's Garage built, a ruin's Regard. */
export function pickSite(block: EvilModeBlock, siteId: string, data: EvilData = EVIL_DATA): BaseOut {
  if (!baseOn(data)) return no(block, 'The base is one room for now.');
  if (block.base) return no(block, 'There is a base already. One a region.');
  if (!block.district) return no(block, 'Nowhere to look yet.');
  if (!siteOffer(block, data).includes(siteId)) return no(block, "That site isn't on offer.");
  const site = siteDef(siteId, data)!;
  const g = gridOf(siteId, data);
  const rooms: Room[] = [{ id: 'office', type: 'office', size: 1, at: g.office, staff: null, ready: 0 }];
  if (site.freeRoom) rooms.push({ id: `r-${site.freeRoom}`, type: site.freeRoom, size: 1, at: g.slots.find((s) => neighbours(g, s).includes(g.door)) ?? g.slots[0]!, staff: null, ready: 0 });
  const base: BaseState = { site: siteId, region: block.here.region, rooms, pieces: [], posts: [], fair: true, freeUsed: false, order: [], night: null, latch: true, walk: null, walked: null };
  let out: EvilModeBlock = { ...block, base };
  const key = `base:regard:${block.here.region}`;
  if (site.regard && !out.applied.includes(key)) out = { ...out, team: { ...out.team, regard: Math.min(10, out.team.regard + site.regard) }, applied: [...out.applied, key] };
  out = appendLog(out, { kind: 'base', who: [], text: `Day ${block.here.day}. Moved into ${site.name.toLowerCase()}. ${site.evening}` });
  return ok(out, site.evening);
}

// ---- The Night action (Part 2; Part 16 section 8) ----

/** What tonight's already been spent on, or null. Defend may be spent three pieces at a time. */
export function nightSpent(block: EvilModeBlock): string | null {
  const n = block.base?.night;
  return n && n.day === block.here.day ? n.what : null;
}
function spendNight(block: EvilModeBlock, what: string, data: EvilData, pieces = 0): BaseOut | null {
  if (block.here.beat !== 'night') return no(block, data.base.night.nightOnly as string);
  const spent = nightSpent(block);
  if (spent && !(spent === 'Defend' && what === 'Defend' && block.base!.night!.pieces + pieces <= data.base.rules.piecesANight)) {
    return no(block, spent === 'Defend' && what === 'Defend' ? `${data.base.rules.piecesANight} pieces a Night at most.` : fill(data.base.night.used as string, { what: spent }));
  }
  return null;
}
const markNight = (b: BaseState, block: EvilModeBlock, what: string, pieces = 0): BaseState => ({
  ...b, night: { day: block.here.day, what, pieces: (b.night && b.night.day === block.here.day && b.night.what === what ? b.night.pieces : 0) + pieces },
});
/** After Walk it, the Night's change is written down (the Ledger's last page, Part 17 section 4). */
const noteChange = (b: BaseState, block: EvilModeBlock, what: string): BaseState => (b.walked && b.walked.day === block.here.day ? { ...b, walked: { ...b.walked, what: [...b.walked.what, what] } } : b);

/** Save a changed base only if it's fair (Part 17 section 3: "It won't save"). */
function saveFair(block: EvilModeBlock, base: BaseState, data: EvilData): { block: EvilModeBlock; problem: string | null } {
  const f = fairOf(base, data);
  if (!f.ok) return { block, problem: f.problem };
  return { block: { ...block, base }, problem: null };
}

// ---- Building (Part 16 section 3.1) ----

/** What a room costs at a size: the first room in a region's free; a cave's Workshop half again. */
export function roomCost(block: EvilModeBlock, t: RoomType, size: number, data: EvilData = EVIL_DATA): number {
  const def = roomDef(t, data);
  const base = def.sizes[size - 1]?.cost ?? 0;
  if (size === 1 && block.base && !block.base.freeUsed && !def.fixed) return 0;
  const site = block.base ? siteDef(block.base.site, data) : undefined;
  return t === 'workshop' && site?.workshopScale ? Math.floor(base * site.workshopScale) : base;
}

/** Days to build: Small by the next Evening, Medium two, Large three, the Creed's room four. Machines: a day sooner, never under one. */
export function buildDays(block: EvilModeBlock, t: RoomType, size: number, data: EvilData = EVIL_DATA): number {
  const R = data.base.rules;
  const d = t === 'creed' ? R.creedDays : R.days[size - 1]!;
  return Math.max(1, d - (block.team.doctrine === 'machines' ? R.machinesFaster : 0));
}

/** Why this room can't be built now (by the Creed, the Line, the region, the money), or null. */
export function buildProblem(block: EvilModeBlock, t: RoomType, data: EvilData = EVIL_DATA): string | null {
  const def = roomDef(t, data);
  const b = block.base;
  if (!b) return 'There is no base yet.';
  if (def.status === 'disabled') return def.waits ?? 'Not yet.';
  if (def.fixed) return `${def.name} is always there.`;
  if (def.line && !def.line.includes(block.team.line)) return `Shut by your Line. ${block.team.line === 'clean' ? "Clean hands can't build one. The button's not there." : ''}`.trim();
  if (def.lastRegion && runIdx(block) !== lastRegion(block)) return def.sizes[0]!.waits ?? 'Built in the last region.';
  if (b.rooms.some((r) => r.type === t)) return `There's ${def.name.startsWith('The') ? '' : 'a '}${def.name} already. Build on it to make it bigger.`;
  const cost = roomCost(block, t, 1, data);
  if (cost > block.team.funds) return `Not enough Funds for ${money(cost)}.`;
  return null;
}

/** The squares a room can go on: a slot nobody's built on. */
export const freeSquares = (b: BaseState, data: EvilData = EVIL_DATA): string[] => gridOf(b.site, data).slots.filter((s) => !b.rooms.some((r) => r.at === s));

export function build(block: EvilModeBlock, t: RoomType, at: string, data: EvilData = EVIL_DATA): BaseOut {
  const p = buildProblem(block, t, data);
  if (p) return no(block, p);
  const night = spendNight(block, 'Build', data);
  if (night) return night;
  const b = block.base!;
  if (!freeSquares(b, data).includes(at)) return no(block, 'Nothing can go there.');
  const cost = roomCost(block, t, 1, data);
  const def = roomDef(t, data);
  const ready = block.here.day + buildDays(block, t, 1, data);
  let base: BaseState = { ...b, rooms: [...b.rooms, { id: `r-${t}`, type: t, size: 1, at, staff: null, ready }], freeUsed: true, order: b.order.length < 3 ? [...b.order, t] : b.order };
  base = noteChange(markNight(base, block, 'Build'), block, `built ${def.name.replace(/^The /, 'the ')}`);
  const saved = saveFair(block, base, data);
  if (saved.problem) return no(block, saved.problem);
  let out: EvilModeBlock = { ...saved.block, team: { ...saved.block.team, funds: block.team.funds - cost } };
  out = appendLog(out, { kind: 'base', who: [], text: `Day ${block.here.day}. Started ${def.name.replace(/^The /, 'the ')}, small${cost ? `, ${money(cost)}` : ': the first room, free'}.` });
  const lines = [fill(data.base.night.build as string, { room: def.name, size: 'small', when: `day ${ready}'s Evening` })];
  const first = b.order.length < 3 ? firstLine(block, t, data) : null;
  if (first) lines.push(first);
  return ok(out, lines.join(' '));
}

/** "Built first": the line said at Night by whoever'd notice (Part 16 section 3.3). */
export function firstLine(block: EvilModeBlock, t: RoomType, data: EvilData = EVIL_DATA): string | null {
  const f = roomDef(t, data).first;
  if (!f.line) return null;
  const roster = inRoster(block);
  const who = (f.talent ? roster.find((c) => c.talent === f.talent) : undefined) ?? roster[0];
  return who ? fill(data.base.first, { name: who.name, line: f.line }) : null;
}

/** Build a room again on itself: Small, Medium, Large. It doesn't take more squares. */
export function enlarge(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): BaseOut {
  const b = block.base;
  const r = b?.rooms.find((x) => x.id === id);
  if (!b || !r) return no(block, 'No such room.');
  const def = roomDef(r.type, data);
  if (r.next) return no(block, `${def.name} is being built on already.`);
  if (!isDone(r.ready, block)) return no(block, `${def.name} isn't finished yet.`);
  const size = r.size + 1;
  const sz = def.sizes[size - 1];
  if (!sz) return no(block, `${def.name} is as big as it gets.`);
  if (sz.status === 'disabled') return no(block, sz.waits ?? 'Not yet.');
  const cost = roomCost(block, r.type, size, data);
  if (cost > block.team.funds) return no(block, `Not enough Funds for ${money(cost)}.`);
  const night = spendNight(block, 'Build', data);
  if (night) return night;
  const ready = block.here.day + buildDays(block, r.type, size, data);
  const word = size === 2 ? 'medium' : 'large';
  let base: BaseState = { ...b, rooms: b.rooms.map((x) => (x.id === id ? { ...x, next: { size, ready } } : x)) };
  base = noteChange(markNight(base, block, 'Build'), block, `made ${def.name.replace(/^The /, 'the ')} ${word}`);
  let out: EvilModeBlock = { ...block, base, team: { ...block.team, funds: block.team.funds - cost } };
  out = appendLog(out, { kind: 'base', who: [], text: `Day ${block.here.day}. Building ${def.name.replace(/^The /, 'the ')} to ${word}, ${money(cost)}.` });
  return ok(out, fill(data.base.night.build as string, { room: def.name, size: word, when: `day ${ready}'s Evening` }));
}

/** Move a room: a day and ₽500. Its Specialist comes with it. They mind, slightly, every time. */
export function moveRoom(block: EvilModeBlock, id: string, to: string, data: EvilData = EVIL_DATA): BaseOut {
  const b = block.base;
  const r = b?.rooms.find((x) => x.id === id);
  if (!b || !r) return no(block, 'No such room.');
  if (roomDef(r.type, data).fixed) return no(block, `${roomDef(r.type, data).name} doesn't move: the game places it.`);
  if (!freeSquares(b, data).includes(to)) return no(block, 'Nothing can go there.');
  const R = data.base.rules;
  if (R.moveCost > block.team.funds) return no(block, `Not enough Funds for ${money(R.moveCost)}.`);
  const night = spendNight(block, 'Build', data);
  if (night) return night;
  const name = roomDef(r.type, data).name;
  let base: BaseState = { ...b, rooms: b.rooms.map((x) => (x.id === id ? { ...x, at: to, ready: Math.max(x.ready, block.here.day + R.moveDays) } : x)) };
  base = noteChange(markNight(base, block, 'Build'), block, `moved ${name.replace(/^The /, 'the ')}`);
  const saved = saveFair(block, base, data);
  if (saved.problem) return no(block, saved.problem);
  let out: EvilModeBlock = { ...saved.block, team: { ...block.team, funds: block.team.funds - R.moveCost } };
  if (r.staff) out = { ...out, crew: out.crew.map((c) => (c.id === r.staff ? { ...c } : c)) };
  out = appendLog(out, { kind: 'base', who: r.staff ? [r.staff] : [], text: `Day ${block.here.day}. Moved ${name.replace(/^The /, 'the ')}, ${money(R.moveCost)}.` });
  const who = r.staff ? block.crew.find((c) => c.id === r.staff) : undefined;
  return ok(out, who ? `${who.name} carries the things over. They mind, slightly.` : `${name} is moved.`);
}

/** Sell a room: a third of its cost back, at once. Its Specialist's a Lead again, and Loyalty −2. */
export function sellRoom(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): BaseOut {
  const b = block.base;
  const r = b?.rooms.find((x) => x.id === id);
  if (!b || !r) return no(block, 'No such room.');
  const def = roomDef(r.type, data);
  if (def.fixed) return no(block, `${def.name} can't be sold.`);
  const paid = def.sizes.slice(0, sizeOf(r, block)).reduce((n, s) => n + s.cost, 0);
  const back = Math.floor(paid / data.base.rules.sellBack);
  let base: BaseState = { ...b, rooms: b.rooms.filter((x) => x.id !== id), posts: b.posts };
  base = noteChange(base, block, `sold ${def.name.replace(/^The /, 'the ')}`);
  const saved = saveFair(block, base, data);
  if (saved.problem) return no(block, saved.problem);
  const R = data.base.rules;
  const crew = saved.block.crew.map((c) => (c.id === r.staff ? moveLoyalty({ ...c, rank: c.rank === 'specialist' ? 'lead' as const : c.rank }, R.sellLoyalty, data) : c));
  let out: EvilModeBlock = { ...saved.block, crew, team: { ...block.team, funds: block.team.funds + back } };
  out = appendLog(out, { kind: 'base', who: r.staff ? [r.staff] : [], text: `Day ${block.here.day}. Sold ${def.name.replace(/^The /, 'the ')}: ${money(back)} back.` });
  const who = r.staff ? block.crew.find((c) => c.id === r.staff) : undefined;
  return ok(out, who ? `${who.name}: "I'd just got it how I wanted."` : `${def.name} is sold.`);
}

// ---- Staffing (Part 16 section 3.1; Part 9: the rank between Lead and Officer) ----

/** Who could run this room: the right talent (or anyone, for the Pen), a Lead or a Specialist with no room of their own. */
export function staffFor(block: EvilModeBlock, r: Room, data: EvilData = EVIL_DATA): Crew[] {
  const def = roomDef(r.type, data);
  if (!needsStaff(r.type, data)) return [];
  const running = new Set(block.base?.rooms.filter((x) => x.id !== r.id && x.staff).map((x) => x.staff!));
  const free = inRoster(block).filter((c) => !running.has(c.id));
  // The Creed's room: the Patron, if they're still with the team; if not, the longest-serving person on the Roster.
  if (def.runsOn === 'patron') return free.filter((c) => c.id === 'patron').concat(free.some((c) => c.id === 'patron') ? [] : free.slice(0, 1));
  return free.filter((c) => {
    if (c.rank !== 'lead' && c.rank !== 'specialist') return false;
    return def.runsOn === 'anyone' || c.talent === def.runsOn;
  });
}

/** Hand someone the key: the Lead-to-Specialist promotion. The scene's in the room, and the line's about the room. */
export function staff(block: EvilModeBlock, id: string, who: string, data: EvilData = EVIL_DATA): BaseOut {
  const b = block.base;
  const r = b?.rooms.find((x) => x.id === id);
  if (!b || !r) return no(block, 'No such room.');
  const def = roomDef(r.type, data);
  if (!needsStaff(r.type, data)) return no(block, def.runsOn === 'boss' ? "It's the Boss's." : `${def.name} runs on whoever's in it.`);
  const p = block.crew.find((c) => c.id === who && c.where === 'in');
  if (!p) return no(block, 'Not on the Roster.');
  if (!staffFor(block, r, data).some((c) => c.id === who)) {
    if (b.rooms.some((x) => x.staff === who)) return no(block, `${p.name} runs a room already.`);
    if (p.rank !== 'lead' && p.rank !== 'specialist') return no(block, `${p.name} would need to be a Lead first.`);
    return no(block, `${def.name} runs on ${def.runsOn === 'anyone' ? 'anyone' : data.people.talents.find((t) => t.id === def.runsOn)?.name ?? def.runsOn}. ${p.name} hasn't got it.`);
  }
  const promoted = p.rank === 'lead';
  const crew = block.crew.map((c) => (c.id === who ? (promoted ? moveLoyalty({ ...c, rank: 'specialist' as const }, data.base.rules.handedLoyalty, data) : c) : c));
  let base: BaseState = { ...b, rooms: b.rooms.map((x) => (x.id === id ? { ...x, staff: who } : x)) };
  base = noteChange(base, block, `gave ${def.name.replace(/^The /, 'the ')} to ${p.name}`);
  let out: EvilModeBlock = { ...block, base, crew };
  out = appendLog(out, { kind: 'promote', who: [who], text: `Day ${block.here.day}. ${p.name} given ${def.name.replace(/^The /, 'the ')}${promoted ? ', and made Specialist' : ''}. ${def.hand}` });
  return ok(out, `${p.name}: ${def.hand}`);
}

// ---- Defend (Part 17 section 2) ----

export interface PieceDraft { type: PieceId; at: string; key?: string; variant?: number; quiz?: string[] }

/** What placing this piece would do: the base it'd make and whether it's fair (the screen shows it before it's placed). */
export function previewPiece(block: EvilModeBlock, draft: PieceDraft, data: EvilData = EVIL_DATA): { base: BaseState | null; fair: FairResult | null; problem: string | null; cost: number } {
  const b = block.base;
  if (!b) return { base: null, fair: null, problem: 'There is no base yet.', cost: 0 };
  const def = pieceDef(draft.type, data);
  if ((def.on === 'door') !== isEdge(draft.at)) return { base: null, fair: null, problem: def.on === 'door' ? 'It goes on a door between two rooms.' : 'It goes on a floor.', cost: 0 };
  const taken = b.pieces.some((p) => p.at === draft.at);
  if (taken) return { base: null, fair: null, problem: def.on === 'door' ? 'That door has a piece already.' : 'A room holds one floor piece.', cost: 0 };
  const cost = pieceCost(block, draft.type, data);
  const piece: Piece = { id: `p${b.pieces.length + 1}-${draft.at}`, type: draft.type, at: draft.at, ...(draft.key ? { key: draft.key } : {}), ...(def.puzzle ? { variant: draft.variant ?? 0 } : {}), ...(def.lock === 'quiz' ? { quiz: draft.quiz ?? data.base.quiz.slice(0, 3).map((q) => q.id) } : {}) };
  const base: BaseState = { ...b, pieces: [...b.pieces, piece] };
  const fair = fairOf(base, data);
  return { base, fair, problem: fair.ok ? (cost > block.team.funds ? `Not enough Funds for ${money(cost)}.` : null) : fair.problem, cost };
}

/** A piece's price: Part 17's table; the first seven free with a working Medium Workshop. */
export const pieceCost = (block: EvilModeBlock, t: PieceId, data: EvilData = EVIL_DATA): number => (pieceDef(t, data).workshop && fxTotal(block, 'freePieces', data) > 0 ? 0 : pieceDef(t, data).cost);

export function place(block: EvilModeBlock, draft: PieceDraft, data: EvilData = EVIL_DATA): BaseOut {
  const night = spendNight(block, 'Defend', data, 1);
  if (night) return night;
  const pv = previewPiece(block, draft, data);
  if (pv.problem || !pv.base) return no(block, pv.problem ?? 'Not there.');
  const def = pieceDef(draft.type, data);
  const base = noteChange(markNight(pv.base, block, 'Defend', 1), block, `placed ${def.name.replace(/^A /, 'a ')}`);
  let out: EvilModeBlock = { ...block, base, team: { ...block.team, funds: block.team.funds - pv.cost } };
  out = appendLog(out, { kind: 'base', who: [], text: `Day ${block.here.day}. Placed ${def.name.replace(/^A /, 'a ')}${pv.cost ? `, ${money(pv.cost)}` : ''}.` });
  return ok(out, `${def.name}: placed. ${data.base.fair.ok}`);
}

/** Take a piece up (a move counts against tonight's three). Never leaves the base unfair. */
export function unplace(block: EvilModeBlock, pieceId: string, data: EvilData = EVIL_DATA): BaseOut {
  const b = block.base;
  const p = b?.pieces.find((x) => x.id === pieceId);
  if (!b || !p) return no(block, 'No such piece.');
  const night = spendNight(block, 'Defend', data, 1);
  if (night) return night;
  let base: BaseState = { ...b, pieces: b.pieces.filter((x) => x.id !== pieceId) };
  base = noteChange(markNight(base, block, 'Defend', 1), block, `took up ${pieceDef(p.type, data).name.replace(/^A /, 'a ')}`);
  const saved = saveFair(block, base, data);
  if (saved.problem) return no(block, saved.problem);
  return ok(saved.block, `${pieceDef(p.type, data).name}: taken up.`);
}

/** Post somebody at a square (a Grunt at a door, an Officer in a room), or take them off (`at` null). One person a room. */
export function guard(block: EvilModeBlock, who: string, at: string | null, data: EvilData = EVIL_DATA): BaseOut {
  const b = block.base;
  if (!b) return no(block, 'There is no base yet.');
  const p = block.crew.find((c) => c.id === who && c.where === 'in');
  if (!p) return no(block, 'Not on the Roster.');
  const g = gridOf(b.site, data);
  if (at !== null && (!g.cells.has(at) || at === g.office)) return no(block, 'Nobody can stand there.');
  if (at !== null && b.posts.some((x) => x.at === at && x.id !== who)) return no(block, 'A room holds one person.');
  const night = spendNight(block, 'Defend', data, 1);
  if (night) return night;
  const posts = b.posts.filter((x) => x.id !== who);
  let base: BaseState = { ...b, posts: at === null ? posts : [...posts, { id: who, at }] };
  base = noteChange(markNight(base, block, 'Defend', 1), block, at === null ? `stood ${p.name} down` : `posted ${p.name} at ${roomName(g, b, at, data)}`);
  const saved = saveFair(block, base, data);
  if (saved.problem) return no(block, saved.problem);
  return ok(saved.block, at === null ? `${p.name} stood down.` : `${p.name}: at ${roomName(g, b, at, data)}.`);
}

/** The Pen's latch: a toggle on the room's screen (Part 16 section 4.9). Off, a Pokémon may walk home in the night. */
export function setLatch(block: EvilModeBlock, on: boolean): BaseOut {
  if (!block.base?.rooms.some((r) => r.type === 'pen')) return no(block, 'There is no Pen.');
  return ok({ ...block, base: { ...block.base, latch: on } }, on ? 'Latch: on.' : 'Latch: off. The door can be left.');
}

// ---- Night actions the base adds (Part 16 section 8) ----

/** Walk the base: each working room with somebody in it gives a line; one person spoken to: Loyalty +1 (stream evil-people). */
export function walkBase(block: EvilModeBlock, data: EvilData = EVIL_DATA): BaseOut {
  const b = block.base;
  if (!b) return no(block, 'There is no base yet.');
  const night = spendNight(block, 'Walk the base', data);
  if (night) return night;
  const N = data.base.night;
  const lines = [N.walk as string];
  const spoken: string[] = [];
  for (const r of b.rooms) {
    if (!roomOpen(block, r, data) || r.type === 'office') continue;
    const who = r.staff ? block.crew.find((c) => c.id === r.staff) : undefined;
    lines.push(`${roomDef(r.type, data).name}: ${who ? `${who.name}. ` : ''}${N.rooms[r.type] ?? ''}`.trim());
    if (who) spoken.push(who.id);
  }
  let out: EvilModeBlock = { ...block, base: markNight(b, block, 'Walk the base') };
  if (!spoken.length) return ok(out, N.walkNone as string);
  const draws = out.draws['evil-people'] ?? 0;
  const pick = spoken[peopleRoll(block.district?.seed ?? '', draws, spoken.length) - 1]!;
  out = { ...out, draws: { ...out.draws, 'evil-people': draws + 1 }, crew: out.crew.map((c) => (c.id === pick ? moveLoyalty(c, 1, data) : c)) };
  lines.push(fill(N.walkLoyal as string, { name: block.crew.find((c) => c.id === pick)!.name }));
  return ok(out, lines.join(' '));
}

/** Stand at the window: Large Office only. Nothing happens. One line, by what was done today. It changes no number. */
export function standAtWindow(block: EvilModeBlock, data: EvilData = EVIL_DATA): BaseOut {
  const b = block.base;
  if (!b || !hasFx(block, 'window', data)) return no(block, data.base.raid.office.noWindow as string);
  const night = spendNight(block, 'Stand at the window', data);
  if (night) return night;
  return ok({ ...block, base: markNight(b, block, 'Stand at the window') }, windowLine(block, data));
}

/** What the window says (Part 16 section 8): read from today's Log and the Hero's road. */
export function windowLine(block: EvilModeBlock, data: EvilData = EVIL_DATA): string {
  const W = data.base.night.window;
  const today = logOf(block).filter((e) => e.day === block.here.day);
  if (block.hero && block.hero.at >= 19) return W.hero!;
  if (today.some((e) => e.kind === 'leave')) return W.lost!;
  if (today.some((e) => e.kind === 'job' && e.result === 'went' && e.method === 'lean')) return W.leaned!;
  if (today.some((e) => e.kind === 'job' && e.result === 'went' && (e.method === 'persuade' || e.method === 'outplay'))) return W.work!;
  return W.quiet!;
}

// ---- What happens on its own (Evening, a new district, the Morning's notes) ----

/** The Evening: rooms finished today open (a line each); a bigger size takes over; supper's two names (stream evil-people). */
export function baseEvening(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const b = block.base;
  if (!b || !baseOn(data)) return block;
  const lines: string[] = [];
  const rooms = b.rooms.map((r) => {
    if (r.ready === block.here.day && r.type !== 'office') lines.push(fill(data.base.night.built as string, { room: roomDef(r.type, data).name }));
    if (r.next && isDone(r.next.ready, block)) {
      lines.push(fill(data.base.night.built as string, { room: `${roomDef(r.type, data).name}, ${r.next.size === 2 ? 'medium' : 'large'},` }));
      const { next, ...rest } = r;
      return { ...rest, size: next.size };
    }
    return r;
  });
  let out: EvilModeBlock = { ...block, base: { ...b, rooms } };
  // Supper: every evening the Mess is working, two names, drawn (Part 16 section 4.2).
  const mess = rooms.find((r) => r.type === 'mess');
  const roster = inRoster(out);
  if (mess && roomOpen(out, mess, data) && roster.length >= 2) {
    let draws = out.draws['evil-people'] ?? 0;
    const a = roster[peopleRoll(out.district?.seed ?? '', draws++, roster.length) - 1]!;
    const rest = roster.filter((c) => c.id !== a.id);
    const c = rest[peopleRoll(out.district?.seed ?? '', draws++, rest.length) - 1]!;
    out = { ...out, draws: { ...out.draws, 'evil-people': draws } };
    lines.push(fill(data.base.supper, { a: a.name, b: c.name }));
  }
  return lines.length ? { ...out, evening: [...out.evening, ...lines] } : out;
}

/**
 * A new district (and the first, once a site's picked): the rooms that work "a district" do it once. Mess (and Mess by
 * Barracks) Loyalty; a Pen by the Barracks, −1; a Large Infirmary (and one on the street) Regard; a Medium Listening
 * Post scouts the district to depth 1; a ship pays its mooring fee.
 */
export function baseDistrict(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const b = block.base;
  if (!b || !baseOn(data) || !block.district) return block;
  const key = `base:district:${block.here.region}:${block.here.stage}`;
  if (block.applied.includes(key)) return block;
  const lines: string[] = [];
  let out: EvilModeBlock = { ...block, applied: [...block.applied, key] };
  const loyal = fxTotal(out, 'loyaltyDistrict', data);
  if (loyal) { out = { ...out, crew: out.crew.map((c) => (c.where === 'in' ? moveLoyalty(c, loyal, data) : c)) }; lines.push(`The base: Loyalty ${loyal > 0 ? '+' : ''}${loyal}, everyone.`); }
  const regard = fxTotal(out, 'regardDistrict', data);
  const heat = fxTotal(out, 'heatDistrict', data);
  if (regard || heat) {
    out = { ...out, team: { ...out.team, regard: Math.min(10, out.team.regard + regard), heat: Math.min(10, out.team.heat + heat) } };
    if (regard) lines.push(`The base: Regard +${regard}.`);
    if (heat) lines.push(`The base: Heat +${heat}.`);
  }
  if (fxTotal(out, 'scoutFree', data) > 0) {
    out = { ...out, district: { ...out.district!, holdings: out.district!.holdings.map((h) => ({ ...h, scouted: Math.max(1, h.scouted) })) } };
    lines.push(data.base.post.scouted!);
  }
  const fee = siteDef(b.site, data)?.fee;
  if (fee) { out = { ...out, team: { ...out.team, funds: Math.max(0, out.team.funds - fee) } }; lines.push(`Mooring fees: ${money(fee)}.`); }
  return lines.length ? { ...out, region: { ...out.region, notes: [...out.region.notes, ...lines] } } : out;
}

/** The Listening Post's notes (Part 16 section 4.6): the Hero's next stop (two at Medium); the detective's next move at Large. */
export function postNotes(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  if (!block.base || !baseOn(data)) return [];
  const out: string[] = [];
  const steps = Math.min(2, fxTotal(block, 'heroSteps', data));
  const h = block.hero;
  if (steps && h && block.district) {
    const next = [1, 2].slice(0, steps).map((i) => block.district!.holdings.find((x) => x.step === h.at + i)?.ref).filter(Boolean) as string[];
    if (next.length) out.push(fill(next.length > 1 ? data.base.post.steps! : data.base.post.step!, { where: next.join(', then ') }));
  }
  if (fxTotal(block, 'detective', data) > 0) out.push(fill(data.base.post.detective!, { heat: block.team.heat, warn: data.base.raid.warnAt }));
  return out;
}

/** Whether the Post's report comes the same Night (a Post next to the Office). */
export const postAtNight = (block: EvilModeBlock, data: EvilData = EVIL_DATA): boolean => fxTotal(block, 'postAtNight', data) > 0;

/** The days the base adds to the Hero's walk at the Reckoning: at most two a region (Part 17 section 3.3). */
export const baseDelay = (block: EvilModeBlock, data: EvilData = EVIL_DATA): number =>
  block.base && baseOn(data) && block.base.region === block.here.region ? delayOf(block.base.pieces, data) : 0;

/** Every pair a room would make on a square, before it's built (the hover preview: "No adjacency's hidden"). */
export function pairsAt(block: EvilModeBlock, t: RoomType, at: string, data: EvilData = EVIL_DATA): { other: string; does: string; status: string }[] {
  const b = block.base;
  if (!b) return [];
  const g = gridOf(b.site, data);
  const near: string[] = neighbours(g, at).map((n): string | undefined => (n === g.door ? 'door' : b.rooms.find((r) => r.at === n)?.type)).filter((x): x is string => !!x);
  return data.base.adjacency.filter((p) => (p.a === t && (near.includes(p.b) || (p.b === '*' && near.length))) || (p.b === t && near.includes(p.a))).map((p) => ({ other: p.a === t ? p.b : p.a, does: p.does, status: p.status }));
}

export { activePairs, edgeKey, roomOpen, sizeOf };
