// The warning and the Raid (design Part 17 section 9; Part 5's Heat ladder). At Heat 9 the detective gives a day's notice
// and the player picks from four: Move, Stay and empty it, Stay and hold, Walk into the station. At Heat 10 on the next
// Evening the Raid comes, played on the Siege Map: the base's wings are each Held, Contested or Lost (and never a fourth
// thing). The constables move a wing a turn; the player gives each wing one order a turn, and the people in it do what
// their Loyalty says about that order. The back way passes three a turn, minors first. Then the Office. A Raid never
// ends the run and never touches the command party: it ends the base. Never twice in a district. No gameplay stream:
// every outcome here is read from Loyalty, orders and the base.

import { EVIL_DATA, type EvilData } from './data';
import { gridOf, neighbours } from './baseGrid';
import { activePairs, hasFx, roomOpen } from './baseFx';
import { pieceDef, siteDef } from './base';
import { bandOf } from './walk';
import { appendLog, fill, money } from './ledger';
import { inRoster } from './people';
import { WING_IDS, type BaseState, type Crew, type EvilModeBlock, type OrderId, type RaidState, type WingId } from './schema';
import { logOf } from './pack';

export interface RaidOut { block: EvilModeBlock; problem: string | null; lines: string[]; fight?: boolean }
const no = (block: EvilModeBlock, problem: string): RaidOut => ({ block, problem, lines: [] });
const R = (data: EvilData) => data.base.raid;

export const districtKey = (block: EvilModeBlock): string => `${block.here.region}:${block.here.stage}`;
export const detectiveOf = (block: EvilModeBlock, data: EvilData = EVIL_DATA) => {
  const id = data.region.regions.find((r) => r.index === block.here.region)?.id ?? 'kanto';
  return R(data).detectives.find((d) => d.region === id) ?? R(data).detectives[0]!;
};
/** Heat as the Raid reads it: a warehouse is easy to find (one higher). */
export const raidHeat = (block: EvilModeBlock, data: EvilData = EVIL_DATA): number => Math.min(10, block.team.heat + (block.base ? siteDef(block.base.site, data)?.raidHeat ?? 0 : 0));
/** A Raid's on: knocking, wing by wing, or in the Office. Nothing else ends a beat till it's over. */
export const raidOn = (block: EvilModeBlock): boolean => !!block.raid && ['door', 'turns', 'office'].includes(block.raid.state);

// ---- The wings (Part 17 section 9.2) ----

/** Which wing a square's in: the front door and whatever's next to it are the Front; rooms by the data's lists; bare floor is Living. */
export function wingOf(b: BaseState, sq: string, data: EvilData = EVIL_DATA): WingId {
  const g = gridOf(b.site, data);
  if (sq === g.door) return 'front';
  const W = R(data).wings;
  if (sq === g.office) return 'keep';
  if (sq === g.common) return 'living';
  const r = b.rooms.find((x) => x.at === sq);
  if (r) return W.find((w) => w.rooms.includes(r.type))?.id ?? 'living';
  return neighbours(g, sq).includes(g.door) ? 'front' : 'living';
}

/** Where each person is when the knock comes: where they're posted, the room they run, or the Living wing (the Front, with Barracks by the door). */
function startWing(block: EvilModeBlock, b: BaseState, c: Crew, data: EvilData): WingId {
  const post = b.posts.find((p) => p.id === c.id);
  if (post) return wingOf(b, post.at, data);
  const r = b.rooms.find((x) => x.staff === c.id && roomOpen(block, x, data));
  if (r) return wingOf(b, r.at, data);
  return activePairs(block, data).some((p) => p.fx.some((f) => f.k === 'frontWing')) ? 'front' : 'living';
}

export const backWayWing = (b: BaseState, data: EvilData): WingId | null => {
  const p = b.pieces.find((x) => pieceDef(x.type, data).needs === 'outside');
  return p ? wingOf(b, p.at, data) : null;
};

// ---- The warning (section 9.1) ----

/**
 * At each Evening: a warned base is raided if Heat's 10 (as read), or the warning lapses; an unwarned base at 9 is warned
 * (a cave two Evenings late). A district's raided once at most. A Raid beaten in the Office holds Heat at 8 for the region.
 */
export function raidEvening(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  if (!data.base.on) return block;
  let out = block;
  const held = out.law.heatHeld;
  if (held && held.region === out.here.region && out.team.heat !== held.heat) out = { ...out, team: { ...out.team, heat: held.heat } };
  const b = out.base;
  const key = districtKey(out);
  if (!b || out.law.raids.includes(key) || (out.raid && out.raid.state !== 'warned')) return out;
  const heat = raidHeat(out, data);
  const D = R(data);
  if (out.raid?.state === 'warned' && out.raid.day < out.here.day) {
    if (heat >= D.at) return startRaid(out, data);
    return { ...out, raid: null, law: { ...out.law, hot: 0 }, evening: [...out.evening, D.lapsed] };
  }
  if (out.raid) return out;
  if (heat < D.warnAt) return out.law.hot ? { ...out, law: { ...out.law, hot: 0 } } : out;
  const hot = out.law.hot + 1;
  const late = siteDef(b.site, data)?.raidLate ?? 0;
  if (hot <= late) return { ...out, law: { ...out.law, hot } };
  const raid: RaidState = { state: 'warned', day: out.here.day, district: key, choice: null, wings: allWings('held'), left: allWings(0), orders: allWings('hold'), turn: 0, where: {}, how: {}, queue: [], log: [], end: null, after: [] };
  const text = `${detectiveOf(out, data).name}: ${D.warning}`;
  out = { ...out, raid, law: { ...out.law, hot }, evening: [...out.evening, text] };
  return appendLog(out, { kind: 'raid', who: [], text: `Day ${out.here.day}. ${D.warning}` });
}

function allWings<T>(v: T): Record<WingId, T> {
  return Object.fromEntries(WING_IDS.map((w) => [w, v])) as Record<WingId, T>;
}

/** The four choices at the warning. Walk into the station waits for the endings. */
export function warnChoice(block: EvilModeBlock, choice: 'move' | 'empty' | 'hold' | 'station', data: EvilData = EVIL_DATA): RaidOut {
  const r = block.raid;
  if (!r || r.state !== 'warned') return no(block, 'Nobody has warned you of anything.');
  if (r.choice) return no(block, 'Chosen already.');
  const c = R(data).choices.find((x) => x.id === choice)!;
  if (c.status !== 'supported') return no(block, `${c.name}: ${c.waits ?? 'not yet'}`);
  if (choice === 'move') {
    // The base is lost: its rooms, not its people. Heat −4. A new site can be found.
    let out: EvilModeBlock = { ...block, base: null, raid: null, team: { ...block.team, heat: Math.max(0, block.team.heat + (c.heat ?? 0)) }, law: { ...block.law, hot: 0, raids: [...block.law.raids, r.district] }, applied: [...block.applied, `base:lost:${block.applied.filter((a) => a.startsWith('base:lost:')).length + 1}`] };
    out = appendLog(out, { kind: 'raid', who: [], text: `Day ${block.here.day}. Moved out before the Raid. ${c.gives}.` });
    return { block: out, problem: null, lines: [`${c.name}. ${c.is}. ${c.gives}.`] };
  }
  let out: EvilModeBlock = { ...block, raid: { ...r, choice: choice as 'empty' | 'hold' } };
  out = appendLog(out, { kind: 'raid', who: [], text: `Day ${block.here.day}. Warned. Chose: ${c.name.toLowerCase()}.` });
  return { block: out, problem: null, lines: [`${c.name}. ${c.gives}.`] };
}

// ---- The Raid (sections 9.2 to 9.4) ----

function startRaid(block: EvilModeBlock, data: EvilData): EvilModeBlock {
  const b = block.base!;
  const D = R(data);
  const where: RaidState['where'] = {};
  const log: string[] = [D.door.knock!];
  let crew = block.crew;
  for (const c of inRoster(block)) {
    if (bandOf(c.loyalty, data).does === 'opened') {
      // 1–2: opened the door before the knock. They aren't at it; they don't come back in.
      where[c.id] = 'gone';
      log.push(fill(D.door.opened!, { name: c.name }));
      crew = crew.map((x) => (x.id === c.id ? { ...x, where: 'left' as const, left: { day: block.here.day, how: 'loyalty' as const } } : x));
    } else where[c.id] = startWing(block, b, c, data);
  }
  // Constables slide on every puzzle in a wing: a turn more for that wing, once (Part 17 section 9.3, beat 2).
  const left = allWings(0);
  for (const w of D.wings) {
    const squares = [...gridOf(b.site, data).cells.keys()].filter((sq) => wingOf(b, sq, data) === w.id);
    if (!squares.length) continue;
    const puzzles = b.pieces.filter((p) => pieceDef(p.type, data).puzzle && squares.includes(p.at)).length;
    left[w.id] = w.turns + (puzzles ? 1 : 0);
  }
  const ordered = inRoster({ ...block, crew }).filter((c) => where[c.id] !== 'gone');
  const queue = [...ordered.filter((c) => c.minor), ...ordered.filter((c) => !c.minor && bandOf(c.loyalty, data).does !== 'again'), ...ordered.filter((c) => !c.minor && bandOf(c.loyalty, data).does === 'again')].map((c) => c.id);
  const raid: RaidState = { ...block.raid!, state: 'door', wings: allWings('held'), left, orders: allWings('hold'), turn: 0, where, how: {}, queue, log, end: null, after: [] };
  const out: EvilModeBlock = { ...block, crew, raid, law: { ...block.law, hot: 0, raids: [...block.law.raids, raid.district] }, evening: [...block.evening, `${detectiveOf(block, data).name}. ${D.door.knock}`] };
  return appendLog(out, { kind: 'raid', who: [], text: `Day ${block.here.day}. The Raid. ${D.door.knock}` });
}

/** Beat 1: open the door, or don't. Opened: the Front's Lost without a fight and nobody's hurt. */
export function raidDoor(block: EvilModeBlock, open: boolean, data: EvilData = EVIL_DATA): RaidOut {
  const r = block.raid;
  if (!r || r.state !== 'door') return no(block, 'Nobody is knocking.');
  const D = R(data);
  const lines: string[] = [];
  let where = { ...r.where };
  const wings = { ...r.wings };
  const left = { ...r.left };
  const opened = Object.values(r.where).includes('gone');
  if (open || opened) {
    lines.push(opened && !open ? D.door.opened!.replace('{name}', 'Somebody') : D.door.open!);
    wings.front = 'lost';
    left.front = 0;
    // Nobody's hurt: whoever was in the Front falls back.
    for (const [id, w] of Object.entries(where)) if (w === 'front') where = { ...where, [id]: 'living' };
  } else {
    const at = Object.entries(where).filter(([, w]) => w === 'front').map(([id]) => block.crew.find((c) => c.id === id)!.name);
    lines.push(at.length ? fill(D.door.force!, { name: at.join(' and ') }) : D.door.forceNobody!);
    wings.front = 'contested';
  }
  return { block: { ...block, raid: { ...r, state: 'turns', where, wings, left, log: [...r.log, ...lines] } }, problem: null, lines };
}

/** One order a wing, given before the turn's played. */
export function raidOrder(block: EvilModeBlock, wing: WingId, order: OrderId): RaidOut {
  const r = block.raid;
  if (!r || r.state !== 'turns') return no(block, 'No Raid to order.');
  if (r.wings[wing] === 'lost') return no(block, 'That wing is Lost.');
  return { block: { ...block, raid: { ...r, orders: { ...r.orders, [wing]: order } } }, problem: null, lines: [] };
}

/** The back way's order. The game won't let a minor be placed below anyone who isn't one. */
export function raidQueue(block: EvilModeBlock, queue: string[], data: EvilData = EVIL_DATA): RaidOut {
  const r = block.raid;
  if (!r || (r.state !== 'turns' && r.state !== 'door')) return no(block, 'No Raid under way.');
  const same = queue.length === r.queue.length && queue.every((id) => r.queue.includes(id));
  if (!same) return no(block, 'The list is everyone who could go.');
  const minor = (id: string) => !!block.crew.find((c) => c.id === id)?.minor;
  const firstAdult = queue.findIndex((id) => !minor(id));
  if (firstAdult >= 0 && queue.slice(firstAdult).some(minor)) return no(block, R(data).minor);
  return { block: { ...block, raid: { ...r, queue } }, problem: null, lines: [] };
}

/** Beats 2 to 4, one turn: the constables move on a wing, the orders are followed by Loyalty, the back way passes three. */
export function raidTurn(block: EvilModeBlock, data: EvilData = EVIL_DATA): RaidOut {
  const r = block.raid;
  if (!r || r.state !== 'turns') return no(block, 'No Raid under way.');
  const b = block.base!;
  const D = R(data);
  const A = D.acts;
  const lines: string[] = [];
  let where = { ...r.where };
  const how = { ...r.how };
  const wings = { ...r.wings };
  const left = { ...r.left };
  let crew = block.crew;
  let queue = [...r.queue];
  const order = WING_IDS.filter((w) => wings[w] !== 'lost');
  // Wings with no squares fall at once.
  for (const w of order) if (left[w] === 0 && w !== 'keep') wings[w] = 'lost';
  const cur = WING_IDS.find((w) => wings[w] !== 'lost')!;
  if (cur === 'keep') return { block: { ...block, raid: { ...r, wings: { ...wings, keep: 'contested' }, state: 'office' } }, problem: null, lines: [] };
  if (wings[cur] === 'held') {
    lines.push(fill(A.contested!, { wing: D.wings.find((x) => x.id === cur)!.name }));
    for (const p of b.pieces) if (pieceDef(p.type, data).puzzle && wingOf(b, p.at, data) === cur) lines.push(fill(D.slide, { piece: pieceDef(p.type, data).name.replace(/^An? /, '').toLowerCase() }));
  }
  wings[cur] = 'contested';
  const inner = (w: WingId): WingId => { const i = WING_IDS.indexOf(w); return WING_IDS.slice(i + 1).find((x) => wings[x] !== 'lost') ?? w; };
  const back = backWayWing(b, data);
  const backOpen = !!back && wings[back] !== 'lost';
  let bonus = 0;
  const name = (id: string) => crew.find((c) => c.id === id)!.name;
  const run = (id: string, w: WingId) => {
    if (backOpen) { if (!queue.includes(id)) queue.push(id); lines.push(fill(A.runs!, { name: name(id) })); }
    else { where = { ...where, [id]: inner(w) }; lines.push(fill(A.noBack!, {}), fill(A.back!, { name: name(id) })); }
  };
  for (const [id, w] of Object.entries(r.where)) {
    if (!WING_IDS.includes(w as WingId) || wings[w as WingId] === 'lost') continue;
    const wing = w as WingId;
    const c = crew.find((x) => x.id === id)!;
    const band = bandOf(c.loyalty, data).does;
    const o = r.orders[wing];
    if (o === 'down') { where = { ...where, [id]: 'caught' }; how[id] = 'down'; lines.push(fill(A.down!, { name: c.name })); continue; }
    if (o === 'back') { where = { ...where, [id]: inner(wing) }; lines.push(fill(A.back!, { name: c.name })); continue; }
    if (wing !== cur) { if (o === 'run') run(id, wing); continue; }
    // In the wing the constables are in: by Loyalty (Part 17 section 9.4).
    if (band === 'aside') {
      if (o === 'run') { where = { ...where, [id]: 'gone' }; crew = crew.map((x) => (x.id === id ? { ...x, where: 'left' as const, left: { day: block.here.day, how: 'loyalty' as const } } : x)); lines.push(fill(A.gone!, { name: c.name })); }
      else { where = { ...where, [id]: 'caught' }; how[id] = 'aside'; lines.push(fill(A.aside!, { name: c.name })); }
      continue;
    }
    if (o === 'run') {
      if (band === 'again') { where = { ...where, [id]: 'caught' }; how[id] = 'holds'; bonus += 1; lines.push(fill(A.doorFor!, { name: c.name })); }
      else run(id, wing);
      continue;
    }
    // Hold.
    if (band === 'again') lines.push(fill(A.holds!, { name: c.name }).replace(/ Is caught\. Says nothing\./, ''));
    else if (band === 'fight' && c.loyalty >= 7) lines.push(fill(A.fights!, { name: c.name }));
    else if (how[id] !== 'slow') { how[id] = 'slow'; lines.push(fill(A.turnRuns!, { name: c.name }).replace(/, then runs\./, '.')); }
    else run(id, wing);
  }
  // The back way: three a turn (and one more for each door held open), in the list's order.
  if (backOpen) {
    let n = D.backWay + bonus;
    const still: string[] = [];
    for (const id of queue) {
      const w = where[id];
      if (n > 0 && w && WING_IDS.includes(w as WingId) && wings[w as WingId] !== 'lost') { where = { ...where, [id]: 'out' }; lines.push(fill(A.out!, { name: name(id) })); n -= 1; }
      else if (w && WING_IDS.includes(w as WingId)) still.push(id);
    }
    queue = still;
  }
  left[cur] = Math.max(0, left[cur] - 1);
  if (left[cur] === 0) {
    wings[cur] = 'lost';
    lines.push(fill(A.lost!, { wing: D.wings.find((x) => x.id === cur)!.name }));
    for (const rm of b.rooms) if (wingOf(b, rm.at, data) === cur) lines.push(fill(A.searched!, { room: data.base.rooms.find((x) => x.id === rm.type)!.name }));
    for (const [id, w] of Object.entries(where)) {
      if (w !== cur) continue;
      const c = crew.find((x) => x.id === id)!;
      where = { ...where, [id]: 'caught' };
      how[id] = how[id] ?? (bandOf(c.loyalty, data).does === 'again' ? 'holds' : 'slow');
      lines.push(fill(A.caught!, { name: c.name }));
    }
  }
  const next = WING_IDS.find((w) => wings[w] !== 'lost')!;
  const state = next === 'keep' ? 'office' : 'turns';
  if (state === 'office') wings.keep = 'contested';
  const raid: RaidState = { ...r, state, where, how, wings, left, queue, turn: r.turn + 1, log: [...r.log, ...lines] };
  return { block: { ...block, crew, raid }, problem: null, lines };
}

// ---- The Office (section 9.5), and after (section 9.6) ----

/** What the detective reads from the run (every clause is the run's own). */
export function officeSpeech(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  const O = R(data).office;
  const C = O.clauses as Record<string, string>;
  const went = (m: string) => logOf(block).some((e) => e.kind === 'job' && e.result === 'went' && e.method === m);
  const out = [O.speech as string];
  if (went('persuade') || went('outplay')) out.push(C.work!);
  if (went('lean')) out.push(C.lean!);
  if (logOf(block).some((e) => e.kind === 'waive')) out.push(C.waive!);
  if (went('take')) out.push(C.take!);
  out.push(fill(O.never as string, { middle: detectiveOf(block, data).middle }));
  return out;
}

export function raidOffice(block: EvilModeBlock, choice: 'battle' | 'charge' | 'pen' | 'window', data: EvilData = EVIL_DATA): RaidOut {
  const r = block.raid;
  if (!r || r.state !== 'office' || r.end) return no(block, 'Nobody is in the Office yet.');
  const O = R(data).office as Record<string, string>;
  const b = block.base!;
  if (choice === 'pen' && !b.rooms.some((x) => x.type === 'pen')) return no(block, O.noPen!);
  if (choice === 'window' && !hasFx(block, 'window', data)) return no(block, O.noWindow!);
  if (choice === 'battle') return { block: { ...block, raid: { ...r, end: 'battle' }, fight: { kind: 'raid', holdingId: 'base', begun: false } }, problem: null, lines: [], fight: true };
  const said = choice === 'charge' ? [O.charge!, ...listOf(block)] : choice === 'pen' ? [O.pen!] : [O.window!];
  return lose(block, choice, said, data);
}

/** The list, read aloud: what can be proved, from the Log. */
function listOf(block: EvilModeBlock): string[] {
  return logOf(block).filter((e) => e.kind === 'job' && e.result === 'went' && (e.method === 'lean' || e.method === 'take' || e.method === 'expose')).map((e) => e.text);
}

/** The Office battle's over. Won: they withdraw, the base is held, Heat's 8 for the region. Lost: the base is lost. */
export function raidResult(block: EvilModeBlock, won: boolean, data: EvilData = EVIL_DATA): RaidOut {
  const r = block.raid;
  if (!r || r.end !== 'battle') return no(block, 'No Raid battle.');
  const O = R(data).office as Record<string, string>;
  const cleared: EvilModeBlock = { ...block, fight: null };
  if (!won) return lose(cleared, 'lost', [O.lost!], data);
  const D = R(data);
  const after = [O.won!, D.after.held!, ...caughtLines(block, r, data)];
  let out: EvilModeBlock = { ...cleared, team: { ...block.team, heat: D.heatHeld }, law: { ...block.law, heatHeld: { region: block.here.region, heat: D.heatHeld } } };
  out = jail(out, r, data);
  out = { ...out, raid: { ...r, state: 'done', end: 'won', after } };
  return { block: appendLog(out, { kind: 'raid', who: [], text: `Day ${block.here.day}. The Raid. ${O.won}` }), problem: null, lines: after };
}

const caughtLines = (block: EvilModeBlock, r: RaidState, data: EvilData): string[] => {
  const ids = Object.entries(r.where).filter(([, w]) => w === 'caught').map(([id]) => id);
  const names = ids.map((id) => block.crew.find((c) => c.id === id)?.name ?? id);
  return [names.length ? fill(R(data).after.caught!, { names: names.join(', ') }) : R(data).after.nobody!];
};

/** The caught go to the cells (away, with how they were caught); whoever ran and didn't come back has left. */
function jail(block: EvilModeBlock, r: RaidState, data: EvilData): EvilModeBlock {
  void data;
  const crew = block.crew.map((c) => {
    const w = r.where[c.id];
    if (w === 'caught' && c.where === 'in') return { ...c, where: 'away' as const, cell: { day: block.here.day, how: r.how[c.id] ?? 'slow' } };
    return c;
  });
  return { ...block, crew };
}

/** The base is lost (section 9.6): its rooms and site; Funds not in a Counting Room (half; a tenth; none by a Vault); deeds as evidence. */
function lose(block: EvilModeBlock, end: NonNullable<RaidState['end']>, said: string[], data: EvilData): RaidOut {
  const r = block.raid!;
  const D = R(data);
  const A = D.after;
  // Whoever's still inside is caught (the window: the Boss isn't).
  let where = { ...r.where };
  const how = { ...r.how };
  for (const [id, w] of Object.entries(where)) if (WING_IDS.includes(w as WingId)) { where = { ...where, [id]: 'caught' }; how[id] = how[id] ?? 'slow'; }
  const pairs = activePairs(block, data);
  const safe = pairs.some((p) => p.fx.some((f) => f.k === 'raidFunds' && f.v === 0));
  const counting = block.base!.rooms.some((x) => x.type === 'counting' && roomOpen(block, x, data));
  const pct = safe ? 0 : counting ? data.base.rooms.find((x) => x.id === 'counting')!.fx.find((f) => f.k === 'raidFunds')!.v : D.funds;
  const lost = Math.floor((block.team.funds * pct) / 100);
  const deeds = block.district?.holdings.filter((h) => h.owner === 'team' && h.method === 'take') ?? [];
  const district = block.district ? { ...block.district, holdings: block.district.holdings.map((h) => (deeds.includes(h) ? (({ method: _m, since: _s, ...rest }) => ({ ...rest, owner: 'nobody' as const, holds: false }))(h) : h)) } : block.district;
  const raid: RaidState = { ...r, where, how, state: 'done', end };
  const after = [...said, A.rooms!, lost ? fill(A.funds!, { amount: money(lost) }) : A.fundsNone!, ...(deeds.length ? [fill(A.deeds!, { n: deeds.length })] : []), ...caughtLines(block, raid, data), ...(end === 'window' ? [] : [(D.office as Record<string, string>).taken!]), A.lines!];
  let out: EvilModeBlock = {
    ...block, district, base: null,
    team: { ...block.team, funds: block.team.funds - lost, heat: D.heatAfter },
    applied: [...block.applied, `base:lost:${block.applied.filter((a) => a.startsWith('base:lost:')).length + 1}`],
    raid: { ...raid, after },
  };
  out = jail(out, raid, data);
  out = appendLog(out, { kind: 'raid', who: Object.keys(where).filter((id) => where[id] === 'caught'), text: `Day ${block.here.day}. The Raid. The base is lost. ${lost ? `${money(lost)} lost.` : 'No Funds lost.'}` });
  return { block: out, problem: null, lines: after };
}

/** The morning after's read: the Raid's put away. */
export function raidDone(block: EvilModeBlock): RaidOut {
  if (block.raid?.state !== 'done') return no(block, 'The Raid is not over.');
  return { block: { ...block, raid: null }, problem: null, lines: [] };
}

// ---- The cells (Part 9: bail's ₽1,000 × rank; visits are a Night action) ----

export const bailOf = (c: Crew, data: EvilData = EVIL_DATA): number => R(data).cells.bailEach * (data.people.ranks.findIndex((x) => x.id === c.rank) + 1);

export function bail(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): RaidOut {
  const c = block.crew.find((x) => x.id === id);
  if (!c?.cell) return no(block, "They're not in the cells.");
  const cost = bailOf(c, data);
  if (cost > block.team.funds) return no(block, `Not enough Funds for ${money(cost)}.`);
  const { cell: _c, ...rest } = c;
  let out: EvilModeBlock = { ...block, team: { ...block.team, funds: block.team.funds - cost }, crew: block.crew.map((x) => (x.id === id ? { ...rest, where: 'in' as const } : x)) };
  out = appendLog(out, { kind: 'raid', who: [id], text: `Day ${block.here.day}. ${fill(R(data).cells.bailed, { name: c.name })} ${money(cost)}.` });
  return { block: out, problem: null, lines: [fill(R(data).cells.bailed, { name: c.name })] };
}

/** Go and see them: a Night action. Each says something different by how they were caught. Nothing moves. */
export function visit(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): RaidOut {
  const c = block.crew.find((x) => x.id === id);
  if (!c?.cell) return no(block, "They're not in the cells.");
  if (block.here.beat !== 'night') return no(block, data.base.night.nightOnly as string);
  const spent = block.base?.night?.day === block.here.day ? block.base.night.what : null;
  if (spent) return no(block, fill(data.base.night.used as string, { what: spent }));
  const line = `${c.name}: ${R(data).cells.visit[c.cell.how]}`;
  const base = block.base ? { ...block.base, night: { day: block.here.day, what: 'Visit', pieces: 0 } } : block.base;
  return { block: { ...block, base }, problem: null, lines: [line] };
}

export { WING_IDS };
export type { WingId };
