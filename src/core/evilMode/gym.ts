// Evil Mode slice 8: the Gym, five ways (design Part 8a, Part 8b's Kanto, Part 29 section 12.2). Beat, Buy, Bend,
// Replace, Befriend; which are open and who shut the rest; each Leader's standing; what the Evening does to a bought
// or befriended Gym; what the Hero meets at Step 20. Pure: new blocks are returned. Numbers and words are in gym.json.
// The `evil-gym` stream: Buy's found-out roll, a Beat's colder Town, Koga's seat, and how many tries a Bent Leader makes
// the Hero take. Each number is counted, so a reload draws the same.

import { hashSeed, Rng } from '../rng';
import { shiftMood, townStreet } from './board';
import { EVIL_DATA, type EvilData } from './data';
import { appendLog, fill, money } from './ledger';
import { inRoster, moveLoyalty } from './people';
/** Which region of the run this is (0 first); slice 16. Read here without importing region.ts. */
const runIndexOf = (block: EvilModeBlock): number => block.region?.crossed?.length ?? 0;
import type { EvilModeBlock, GymState, GymWay, Holding, LeaderDef, Standing } from './schema';
import { logOf } from './pack';

type G = EvilData['gym'];
const lines = (data: EvilData) => data.gym.lines as Record<string, string> & { heroFight: Record<GymWay, string> };

/** The n-th number `evil-gym` gives out in this run, 1..max. */
export const gymRoll = (seed: string, n: number, max: number): number => new Rng(hashSeed(`${seed}::evil-gym::${n}`)).int(1, max);

/** Draws one number from `evil-gym` and counts it. */
function draw(block: EvilModeBlock, max: number): { block: EvilModeBlock; roll: number } {
  const n = block.draws['evil-gym'] ?? 0;
  return { block: { ...block, draws: { ...block.draws, 'evil-gym': n + 1 } }, roll: gymRoll(block.district?.seed ?? '', n, max) };
}

export const gymOn = (data: EvilData = EVIL_DATA): boolean => data.gym.on;

/** A Leader's words with their pronouns and name filled in. */
export const say = (t: string, L: LeaderDef, extra: Record<string, string | number> = {}): string =>
  fill(t, { them: L.them, they: L.they.toLowerCase(), They: L.they, their: L.their, name: L.name, ...extra });

export const leaderById = (id: string, data: EvilData = EVIL_DATA): LeaderDef | undefined => data.gym.leaders.find((l) => l.id === id);

/** The Leader of district `n` in `region` (its first Gym is n 0, its eighth n 7). An heir only takes over by a Bend. */
export const leaderOf = (region: number, n: number, data: EvilData = EVIL_DATA): LeaderDef | undefined =>
  data.gym.leaders.find((l) => l.region === region && l.n === n && l.role !== 'heir');

export const gymHolding = (block: EvilModeBlock): Holding | undefined => block.district?.holdings.find((h) => h.kind === 'gym');

/** This district's Gym state: the stored one, or a fresh one (Wary, never asked). Null with no district or no Leader. */
export function gymOf(block: EvilModeBlock, data: EvilData = EVIL_DATA): GymState | null {
  const d = block.district;
  if (!d) return null;
  const stored = (block.gyms ?? []).find((g) => g.region === d.region && g.district === d.n);
  if (stored) return stored;
  const L = leaderOf(d.region, d.n, data);
  if (!L) return null;
  return { leaderId: L.id, region: d.region, district: d.n, way: null, standing: data.gym.standing.start, moved: data.gym.standing.startMoved, closed: [], tried: 0, bend: 0, officer: null, insults: 0, foundOut: false, loud: null, heroTries: 0, heroNeeds: null };
}

/** The Leader who holds this district's Gym now (Janine, after Koga's seat). */
export function currentLeader(block: EvilModeBlock, data: EvilData = EVIL_DATA): LeaderDef | undefined {
  const g = gymOf(block, data);
  return g ? leaderById(g.leaderId, data) : undefined;
}

const putGym = (block: EvilModeBlock, g: GymState): EvilModeBlock => {
  const rest = (block.gyms ?? []).filter((x) => !(x.region === g.region && x.district === g.district));
  return { ...block, gyms: [...rest, g] };
};

/** Dealt with, and still holding: the district's lock is off (Part 8a section 1). */
export const gymDealt = (block: EvilModeBlock, data: EvilData = EVIL_DATA): boolean => gymOn(data) && !!gymOf(block, data)?.way;

/** The Officer holding a Gym's chair can't be sent on jobs (Part 8a section 5). */
export const inChair = (block: EvilModeBlock, id: string): boolean => (block.gyms ?? []).some((g) => g.way === 'replace' && g.officer === id);

/** The Badge a Hero takes here: half a tier from a Beaten or Bought Leader, else a full one (Part 8a section 12). */
export function badgeHow(block: EvilModeBlock, data: EvilData = EVIL_DATA): 'full' | 'half' {
  const w = gymOn(data) ? gymOf(block, data)?.way : null;
  return w === 'beat' || w === 'buy' ? 'half' : 'full';
}

/** A Buy's price: ₽6,000 in a first district, +₽1,500 a district, +₽3,000 a region (Part 8a section 3). */
export const priceFor = (region: number, n: number, data: EvilData = EVIL_DATA): number => {
  const P = data.gym.numbers.price;
  return P.first + P.perDistrict * Math.max(0, n - 1) + P.perRegion * region;
};

/** The Officer the team would send to challenge: the first in the Roster at Officer rank or above, not out. */
export const officerFor = (block: EvilModeBlock) => inRoster(block).find((c) => (c.rank === 'officer' || c.rank === 'executive') && c.outOn === null && !inChair(block, c.id));

export interface GymDoor {
  way: GymWay;
  name: string;
  open: boolean;
  /** What's needed and what's in hand, or why it's shut, in a line. */
  why: string;
  /** Who shut it ("Shut by your Line", "Shut by her"...); null when open. A shut door always names who. */
  shutBy: string | null;
  done: boolean;
}

/** The five doors, open or shut, each with its reason (Part 8a section 1.2). */
export function gymDoors(block: EvilModeBlock, data: EvilData = EVIL_DATA): GymDoor[] {
  const G: G = data.gym;
  const S = G.shut;
  const T = lines(data);
  const L = currentLeader(block, data);
  const g = gymOf(block, data);
  const h = gymHolding(block);
  return G.ways.map((way): GymDoor => {
    const name = G.names[way];
    const shut = (by: string, why: string): GymDoor => ({ way, name, open: false, why, shutBy: L ? say(by, L) : by, done: false });
    const open = (why: string): GymDoor => ({ way, name, open: true, why, shutBy: null, done: false });
    if (!L || !g || !h) return shut(S.arrival, S.arrival);
    if (L.role === 'first') return shut(S.arrival, S.arrival);
    if (L.role === 'eighth') return shut(S.hero, S.hero);
    if (g.way) return g.way === way ? { way, name, open: false, why: fill(T.already!, { way: name }), shutBy: null, done: true } : shut(S.done, fill(T.already!, { way: G.names[g.way] }));
    if (g.standing === 'gone') return shut(S.gone, S.gone);
    if (g.standing === 'shut') return shut(S.leader, T.shutLeader!);
    if (g.closed.includes(way)) return shut(S.tried, S.tried);
    const scouted = h.scouted >= 2;
    const line = block.team.line;
    switch (way) {
      case 'beat':
        return open(T.beatOpen!);
      case 'buy': {
        if (L.minor) return shut(S.age, say(L.buy?.why ?? S.age, L));
        // Slice 16: a Leader with a price asks the formula's, by the run's region and the district (Part 8a section 3).
        const price = L.buy?.price ? priceFor(runIndexOf(block), L.n, data) : null;
        if (price === null) return shut(S.leader, L.buy?.why ?? S.leader);
        if (!scouted) return shut(S.scout, T.notScouted!);
        if (block.team.funds < price) return shut(S.number, fill(T.short!, { price: money(price), funds: money(block.team.funds) }));
        return open(`${money(price)}. "${L.buy!.why}"`);
      }
      case 'bend': {
        if (!L.bend) return shut(S.build, S.build);
        if (!scouted) return shut(S.scout, T.notScouted!);
        const n = L.bend.steps.length;
        return open(fill(T.bendStep!, { n: g.bend + 1, of: n, text: L.bend.steps[Math.min(g.bend, n - 1)]! }));
      }
      case 'replace': {
        if (L.minor) return shut(S.age, T.replaceRefused!);
        if (!L.replace?.can) return shut(S.leader, L.replace?.goes ?? S.leader);
        if (line === 'clean') return shut(S.line, T.notClean!);
        const o = officerFor(block);
        if (!o) return shut(S.officer, T.noOfficer!);
        return open(`${o.name} challenges, under the Gym's rule, at A+2.`);
      }
      case 'befriend': {
        if (line === 'whatever') return shut(S.leader, say(T.notWhatever!, L));
        if (line === 'grey') return shut(S.line, say(T.work!, L));
        const creed = block.team.creed;
        if (!L.respects.includes(creed)) return shut(S.leader, say(T.creed!, L, { creed: data.creeds.find((c) => c.id === creed)?.name ?? creed }));
        const need = G.numbers.befriend.needRegard;
        if (block.team.regard < need) return shut(S.number, fill(T.regardShort!, { have: block.team.regard, need }));
        if (block.district && townStreet(block.district, data).some((x) => x.owner === 'team' && !x.holds)) return shut(S.number, say(T.wouldTurn!, L));
        return open(`Regard ${block.team.regard}; ${data.creeds.find((c) => c.id === creed)?.name ?? creed} heard out.`);
      }
    }
  });
}

/** The standing as a word, and the last thing that moved it (the Gym panel's foot). */
export function standingText(block: EvilModeBlock, data: EvilData = EVIL_DATA): { word: string; moved: string } | null {
  const g = gymOf(block, data);
  return g ? { word: data.gym.standing.words[g.standing], moved: g.moved } : null;
}

const capN = (n: number) => Math.max(0, Math.min(10, n));

/** Every local on the Town's street one warmer (by > 0) or colder; returns a new block. */
function townBy(block: EvilModeBlock, by: number, data: EvilData): EvilModeBlock {
  const d = block.district!;
  const ids = new Set(townStreet(d, data).map((h) => h.id));
  return { ...block, district: { ...d, holdings: d.holdings.map((h) => (ids.has(h.id) ? { ...h, mood: shiftMood(h.mood, by) } : h)) } };
}

function crewBy(block: EvilModeBlock, f: (c: EvilModeBlock['crew'][number]) => number, data: EvilData): EvilModeBlock {
  return { ...block, crew: block.crew.map((c) => (c.where !== 'in' ? c : f(c) ? moveLoyalty(c, f(c), data) : c)) };
}

const logGym = (block: EvilModeBlock, text: string, who: string[] = []): EvilModeBlock =>
  appendLog(block, { kind: 'gym', who, to: gymHolding(block)?.id, text: `Day ${block.here.day}. ${text}` });

export interface GymActResult { block: EvilModeBlock; problem: string | null; lines: string[]; fight: boolean }

/**
 * One of the five, at the In person beat (a Gym's never dispatched to). Beat and Replace start a battle; Buy, a step of
 * a Bend, and Befriend happen at once. Each uses the Boss's one outing of the day. Refused unless the door's open.
 */
export function gymAct(block: EvilModeBlock, way: GymWay, data: EvilData = EVIL_DATA): GymActResult {
  const T = lines(data);
  const N = data.gym.numbers;
  const no = (problem: string): GymActResult => ({ block, problem, lines: [], fight: false });
  if (!gymOn(data)) return no(data.gym.shut.build);
  if (block.here.beat !== 'inPerson') return no(T.inPersonOnly!);
  if (block.fight) return no('A battle is waiting.');
  if (block.inPerson?.day === block.here.day) return no(T.outToday!);
  const door = gymDoors(block, data).find((d) => d.way === way)!;
  if (!door.open) return no(door.why);
  const L = currentLeader(block, data)!;
  const h = gymHolding(block)!;
  let g = gymOf(block, data)!;
  const day = block.here.day;
  let out: EvilModeBlock = { ...block, inPerson: { day, holdingId: h.id } };
  if (way === 'beat') return { block: putGym({ ...out, fight: { kind: 'gym', holdingId: h.id, begun: false } }, g), problem: null, lines: [], fight: true };
  if (way === 'replace') {
    const o = officerFor(block)!;
    return { block: putGym({ ...out, fight: { kind: 'challenge', holdingId: h.id, personId: o.id, begun: false } }, g), problem: null, lines: [], fight: true };
  }
  if (way === 'buy') {
    const price = priceFor(runIndexOf(block), L.n, data);
    const text = say(T.bought!, L, { price: money(price) });
    out = { ...out, team: { ...out.team, funds: out.team.funds - price } };
    out = crewBy(out, (c) => (c.talent === 'heart' ? -1 : 0), data);
    g = { ...g, way: 'buy', standing: 'wary', moved: 'Took the money. Hides it well.', loud: { day, heat: N.buy.heat } };
    return { block: logGym(putGym(out, g), text), problem: null, lines: [text], fight: false };
  }
  if (way === 'bend') {
    const bend = L.bend!;
    // Something admitted: the Ledger's checked. A team that's Leaned or Taken in this district can't say it's what it's for.
    if (bend.kind === 'admitted' && logOf(block).some((e) => e.kind === 'job' && e.result === 'went' && e.region === block.district!.region && e.district === block.district!.n && (e.method === 'lean' || e.method === 'take'))) {
      return no(T.admittedFails!);
    }
    const n = g.bend + 1;
    const said = [fill(T.bendStep!, { n, of: bend.steps.length, text: bend.steps[n - 1]! })];
    g = { ...g, bend: n, moved: `Bend, step ${n} of ${bend.steps.length}.` };
    if (n >= bend.steps.length) {
      said.push(say(T.bendDone!, L), ...bend.scene);
      g = { ...g, way: 'bend', standing: 'warm', moved: 'Bent. The lights were off.', loud: { day, heat: 0 } };
      out = { ...out, team: { ...out.team, regard: capN(out.team.regard + N.bend.regard) } };
      out = crewBy(out, () => N.bend.loyalty, data);
      out = townBy(out, 1, data);
      // A fair chance: arranged, not fixed. Koga gets the seat at two in three, and the Gym's his daughter's.
      if (L.heir && bend.kind === 'chance') {
        const r = draw(out, N.bend.seatOf);
        out = r.block;
        if (r.roll <= N.bend.seat) {
          g = { ...g, leaderId: L.heir, moved: 'Her father got his seat. The Gym came to her.' };
          said.push(T.seat!);
        } else said.push(T.noSeat!);
      }
    }
    return { block: logGym(putGym(out, g), said[0]!), problem: null, lines: said, fight: false };
  }
  // Befriend: three exchanges, all Levels; the Leader's already made up their mind (Part 8a section 6.1).
  const B = data.gym.befriend;
  const boss = B.boss[block.team.creed] ?? B.boss.profit!;
  const said = [`${L.name}: "${B.leader[0]}"`, `You: "${boss[0]}"`, `${L.name}: "${B.leader[1]}"`, `You: "${boss[1]}"`, `${L.name}: "${B.leader[2]}"`, say(T.befriended!, L)];
  g = { ...g, way: 'befriend', standing: 'easy', moved: 'Was asked, properly.', loud: { day, heat: 0 } };
  out = { ...out, team: { ...out.team, regard: capN(out.team.regard + N.befriend.regard) } };
  out = townBy(out, 1, data);
  return { block: logGym(putGym(out, g), say(T.befriended!, L)), problem: null, lines: said, fight: false };
}

/** A Gym battle's end (Beat: the Boss; Replace: the Officer's challenge). Returns the lines the battle screen reads out. */
export function gymResult(block: EvilModeBlock, won: boolean, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  const f = block.fight!;
  const T = lines(data);
  const N = data.gym.numbers;
  const L = currentLeader(block, data)!;
  let g = gymOf(block, data)!;
  const day = block.here.day;
  let out: EvilModeBlock = { ...block, fight: null };
  if (f.kind === 'gym') {
    if (!won) {
      g = { ...g, tried: g.tried + 1, moved: 'Fought the Boss and won. Leads differently now.' };
      const text = say(T.beatLost!, L);
      return { block: logGym(putGym(out, g), text), lines: [text] };
    }
    const said = [say(T.beatWon!, L), `${L.name}: "${L.beaten ?? ''}"`];
    g = { ...g, way: 'beat', standing: 'sullen', moved: 'Beaten in her own Gym.'.replace('her', L.their), loud: { day, heat: N.beat.heat } };
    out = { ...out, team: { ...out.team, dread: capN(out.team.dread + N.beat.dread) } };
    out = crewBy(out, (c) => (c.talent === 'nerve' ? 1 : 0), data);
    // The Town: each local on its street one colder at one in two (they blame the team for the Saturdays).
    const d = out.district!;
    const street = townStreet(d, data).map((h) => h.id);
    let holdings = d.holdings;
    for (const id of street) {
      const r = draw(out, 100);
      out = r.block;
      if (r.roll <= N.beat.townColder) holdings = holdings.map((h) => (h.id === id ? { ...h, mood: shiftMood(h.mood, -1) } : h));
    }
    out = { ...out, district: { ...d, holdings } };
    return { block: logGym(putGym(out, g), said[0]!), lines: said };
  }
  const o = out.crew.find((c) => c.id === f.personId);
  const officer = o?.name ?? 'The Officer';
  if (!won) {
    g = { ...g, closed: [...g.closed, 'replace'], moved: `Beat ${officer} in a fair challenge.` };
    out = { ...out, crew: out.crew.map((c) => (c.id === f.personId ? moveLoyalty(c, N.replace.loseLoyalty, data) : c)) };
    const text = fill(T.challengeLost!, { officer });
    return { block: logGym(putGym(out, g), text, o ? [o.id] : []), lines: [text] };
  }
  const said = [say(T.challengeWon!, L, { officer }), L.replace?.goes ?? ''];
  g = { ...g, way: 'replace', standing: 'gone', officer: f.personId ?? null, moved: `Handed ${officer} the keys.`, loud: { day, heat: N.replace.heat } };
  out = { ...out, team: { ...out.team, regard: capN(out.team.regard + N.replace.regard) }, crew: out.crew.map((c) => (c.id === f.personId ? moveLoyalty(c, N.replace.officerLoyalty, data) : c)) };
  return { block: logGym(putGym(out, g), said[0]!, o ? [o.id] : []), lines: said.filter(Boolean) };
}

/** The day's Heat from the Gym, for the Evening's loudest (Part 8a section 12). */
export const gymHeatToday = (block: EvilModeBlock): number | null => {
  const g = (block.gyms ?? []).find((x) => x.loud?.day === block.here.day && block.district && x.region === block.district.region && x.district === block.district.n);
  return g?.loud ? g.loud.heat : null;
};

/**
 * After the Evening's rolls (Part 8a sections 2.1, 3.2 and 6.3): a Bought Leader's found out at one in ten; a Beaten one
 * who hears of a Lean on the Town's street is Shut; a Befriended one warns once, then walks in. Once a day.
 */
export function gymEvening(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  if (!gymOn(data) || !block.district) return block;
  const key = `gym:${block.district.region}:${block.district.n}:${block.here.day}`;
  if (block.applied.includes(key)) return block;
  const g0 = (block.gyms ?? []).find((x) => x.region === block.district!.region && x.district === block.district!.n);
  let out: EvilModeBlock = { ...block, applied: [...block.applied, key] };
  const L = g0 ? leaderById(g0.leaderId, data) : undefined;
  if (!g0 || !L || !g0.way) {
    if (block.district.end && !g0?.way) out = { ...out, evening: [...out.evening, lines(data).neverAsked!] };
    return out;
  }
  const T = lines(data);
  const N = data.gym.numbers;
  let g = g0;
  const said: string[] = [];
  const d = block.district;
  const today = logOf(block).filter((e) => e.kind === 'job' && e.result === 'went' && e.day === block.here.day && e.region === d.region && e.district === d.n);
  const street = new Set(townStreet(d, data).map((h) => h.id));
  const leanedStreet = today.some((e) => e.method === 'lean' && e.to && street.has(e.to));
  const tookHere = today.some((e) => e.method === 'take');
  if (g.way === 'buy' && !g.foundOut) {
    const r = draw(out, N.buy.foundOut);
    out = r.block;
    if (r.roll === 1) {
      g = { ...g, way: null, standing: 'shut', foundOut: true, moved: 'It got out that the team bought them.' };
      out = townBy({ ...out, team: { ...out.team, dread: capN(out.team.dread + N.buy.dread) } }, -1, data);
      said.push(say(T.foundOut!, L));
    }
  } else if (g.way === 'beat' && leanedStreet) {
    g = { ...g, way: null, standing: 'shut', closed: [...new Set([...g.closed, 'beat' as const])], moved: 'A second insult: the Lean on the Town\'s street.' };
    said.push(say(T.secondInsult!, L));
  } else if (g.way === 'befriend' && (leanedStreet || tookHere)) {
    const insults = g.insults + 1;
    if (insults >= 2 || tookHere) {
      g = { ...g, way: null, standing: 'shut', insults, moved: 'Walked into the base, by the front, alone.' };
      out = { ...out, team: { ...out.team, regard: capN(out.team.regard + N.befriend.lostRegard) } };
      said.push(`${L.name}: "${L.walksIn ?? ''}"`);
    } else {
      g = { ...g, insults, moved: 'Sent a note: "I said a short list."' };
      said.push(say(T.firstWarning!, L));
    }
  }
  if (!said.length) return out;
  out = putGym(out, g);
  for (const s of said) out = logGym(out, s);
  return { ...out, evening: [...out.evening, ...said] };
}

/**
 * The Hero reaches Step 20 (Part 8a sections 1 to 6). A Bent Leader beats them the first time (and the second, at one
 * in two, drawn once from `evil-gym`): they step back and rest a day. Otherwise they win, and learn what the way says.
 * `took`: the Badge is theirs now (the caller gives it).
 */
export function heroAtGym(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; took: boolean; lines: string[] } {
  const g0 = gymOn(data) ? gymOf(block, data) : null;
  const L = g0 ? leaderById(g0.leaderId, data) : undefined;
  if (!g0 || !L || !g0.way) return { block, took: true, lines: [] };
  const T = lines(data);
  let out = block;
  let g = g0;
  if (g.way === 'bend') {
    if (g.heroNeeds === null) {
      const [lo, hi] = data.gym.numbers.heroTries.bend;
      const r = draw(out, hi - lo + 1);
      out = r.block;
      g = { ...g, heroNeeds: lo + r.roll - 1 };
    }
    if (g.heroTries + 1 < g.heroNeeds!) {
      g = { ...g, heroTries: g.heroTries + 1 };
      return { block: putGym(out, g), took: false, lines: [say(T.heroLost!, L)] };
    }
  }
  g = { ...g, heroTries: g.heroTries + 1 };
  const way = g.way!;
  const toHero = L.toHero[way];
  const learned = [fill(data.gym.file[way], { officer: out.crew.find((c) => c.id === g.officer)?.name ?? 'the Officer' }), ...(toHero ? [`${L.name} told them: "${toHero}"`] : [])];
  const hero = out.hero ? { ...out.hero, learned: [...out.hero.learned, ...learned] } : out.hero;
  return { block: putGym({ ...out, hero }, g), took: true, lines: [T.heroFight[way]] };
}
