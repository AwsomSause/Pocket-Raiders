// Evil Mode's Hero (design Part 18, slice 5 of Part 31): made at founding from the rival system's parts, turned round.
// Pure. Making the Hero uses its own generator from the run's seed (like laying a district), never a gameplay stream.
// The Hero's road is a pure function of the block (the Log and the map): no roll anywhere on it. Their party isn't here:
// it's the rival record's (`run.story.rivals`, id `hero.rivalId`), and the session reads it there.

import { baseDelay } from './base';
import { hashSeed, Rng } from '../rng';
import starterTable from '../../data/rivalHome.json';
import bankJson from '../../data/rivalBank.json';
import { holdingName, localOf, streetName, streetOf, townStreet } from './board';
import { dayIn, stageKind } from './region';
import { goWithHero } from './line';
import { badgeHow, gymDealt, heroAtGym } from './gym';
import { EVIL_DATA, type EvilData } from './data';
import { appendLog, fill } from './ledger';
import { heroSlice12Start, type District, type EvilModeBlock, type Fight, type Hero, type Holding, type LogEntry, type Personality } from './schema';
import { angrySteps, monName, moveTemper } from './temper';
import { approachLines, eighthLines, openLastRoom, reckOn } from './reckoning';

const STARTERS = starterTable.regionStarters as Record<string, string[]>;
const BANK = bankJson.personalities as Record<string, { open: string[]; won: string[]; lost: string[] }>;

export const heroData = (data: EvilData = EVIL_DATA) => data.hero;
const line = (k: string, data: EvilData): string => {
  const v = data.hero.lines[k];
  return typeof v === 'string' ? v : '';
};
const sub = (k: string, which: string, data: EvilData): string => {
  const v = data.hero.lines[k];
  return typeof v === 'object' ? v[which] ?? '' : '';
};

export interface MadeHero {
  hero: Hero;
  /** The party the rival record starts with: the starter, then the home opener. */
  team: string[];
  /** The rival record's hidden traits (0..100), from the personality's starting values. */
  traits: Record<'ambition' | 'pride' | 'empathy' | 'adaptability' | 'vindictiveness' | 'resilience', number>;
}

/**
 * The Hero, from the run's seed (design Part 18 section 2). A starter from one of three regions (never the Boss's own
 * line); a Route 1 opener from their home region; a personality from the voice bank's eight; home on the Town's street.
 */
export function makeHero(seed: string, district: District, bossStarter: string | null, data: EvilData = EVIL_DATA): MadeHero {
  const H = data.hero;
  const rng = new Rng(hashSeed(`${seed}::evil-hero`));
  const kid = rng.pick(H.kids);
  const personality = rng.pick(H.personalities).id as Personality;
  // Three regions, one starter each, none the Boss's own line; the Hero was given one of the three.
  const regions = rng.shuffle(Object.keys(STARTERS).filter((r) => (STARTERS[r] ?? []).some((s) => s !== bossStarter))).slice(0, 3);
  const offered = regions.map((r) => ({ region: r, species: rng.pick((STARTERS[r] ?? []).filter((s) => s !== bossStarter)) }));
  const given = rng.pick(offered);
  const opener = rng.pick(H.openers[H.homeRegion] ?? ['pidgey']);
  const town = district.holdings.find((h) => h.kind === 'town') ?? district.holdings[0]!;
  const street = streetName(district, streetOf(town.step, data), data) || town.ref;
  const traits = {
    ambition: rng.int(20, 80), pride: rng.int(20, 80), empathy: rng.int(20, 80),
    adaptability: rng.int(20, 80), vindictiveness: rng.int(20, 80), resilience: rng.int(20, 80),
  };
  const hero: Hero = {
    rivalId: H.rivalId, name: kid.name, look: kid.look, raisedBy: kid.raisedBy, personality,
    home: { region: district.region, district: district.n, street, holdings: townStreet(district, data).map((h) => h.id) },
    starterRegion: given.region, at: town.step, walked: 0, restOn: 0, marks: 0, battlesWithTeam: 0, lostDays: 0,
    badges: [], seen: [], learned: [], said: [], today: [], met: false,
    ...heroSlice12Start(monName(given.species)),
  };
  return { hero, team: [given.species, opener], traits };
}

export const personalityDef = (p: Personality, data: EvilData = EVIL_DATA) => data.hero.personalities.find((x) => x.id === p)!;

/** Steps they walk on `day` (design Part 18 section 7.2). */
export function stepsOn(hero: Hero, day: number, data: EvilData = EVIL_DATA): number {
  const s = personalityDef(hero.personality, data).steps;
  // Slice 12: at Angry or above, three steps a day whatever the personality.
  return angrySteps(hero, data) ?? s[(day - 1) % s.length]!;
}

/** Tiers: one a Badge won in a real fight, half for a bought or beaten one (Part 18 section 7.1). */
export function heroTier(hero: Hero, data: EvilData = EVIL_DATA) {
  const n = Math.floor(hero.badges.reduce((t, b) => t + (b.how === 'full' ? 1 : 0.5), 0));
  return [...data.hero.tiers].reverse().find((t) => n >= t.min) ?? data.hero.tiers[0]!;
}

/** What a mark count means (Part 18 section 8). */
export const marksWord = (marks: number, data: EvilData = EVIL_DATA): string => [...data.hero.marks.words].reverse().find(([n]) => marks >= n)?.[1] ?? '';

// ---- The reason (Part 18 section 4): the first loud entry of the Log in their home district ----

/** How far a Log line carried, 0 to 3 (Part 30 section 7.1 `loud`). A Pay under the price is louder than a fair one. */
export function loudOf(block: EvilModeBlock, e: LogEntry, data: EvilData = EVIL_DATA): number {
  if (e.kind !== 'job' || !e.method) return 0;
  const L = data.hero.loud;
  if (e.method === 'pay') return block.cards.find((c) => c.id === e.cardId)?.clean === false ? L.payUnder : L.pay;
  return L[e.method];
}

export type ReasonDef = EvilData['hero']['reasons'][number];

/** The Hero's reason, or null while nothing loud has happened and the district isn't over. A pure function of the Log. */
export function heroReason(block: EvilModeBlock, data: EvilData = EVIL_DATA): { reason: ReasonDef; logId: string | null } | null {
  const hero = block.hero;
  if (!hero) return null;
  const R = data.hero.reasons;
  for (const e of block.log) {
    if (e.region !== hero.home.region || e.district !== hero.home.district) continue;
    if (loudOf(block, e, data) < 2) continue;
    const trigger = e.to && hero.home.holdings.includes(e.to) ? 'homeStreet' : 'quiet';
    return { reason: R.find((r) => r.trigger === trigger)!, logId: e.id };
  }
  const d = block.district;
  if (d && d.region === hero.home.region && d.n === hero.home.district && !d.end) return null;
  return { reason: R.find((r) => r.trigger === 'quiet')!, logId: null };
}

// ---- The Card's field 10 (Part 18 section 3) ----

export function heroField(block: EvilModeBlock, h: Holding, data: EvilData = EVIL_DATA): string {
  const hero = block.hero;
  if (!hero) return data.ledger.card.hero;
  if (hero.home.holdings.includes(h.id) && block.district?.n === hero.home.district) {
    const l = localOf(h, data);
    return l && h.scouted > 0 ? fill(line('street', data), { who: l.who.replace(/,.*$/, '') }) : line('streetBlind', data);
  }
  return fill(line('notStreet', data), { step: hero.at });
}

// ---- Hold: a person posted at a holding the Hero's about to reach (Part 2 section 3.2) ----

export function postProblem(block: EvilModeBlock, holdingId: string, id: string): string | null {
  const d = block.district;
  if (!d || d.end) return "The district's over.";
  if (block.here.beat !== 'dispatch') return 'People are posted at Dispatch.';
  if (!block.hero) return "Nobody's on the road yet.";
  const h = d.holdings.find((x) => x.id === holdingId);
  if (!h) return 'Pick a holding.';
  if (h.owner !== 'team') return 'Only a holding that is yours can be held.';
  if (h.step <= block.hero.at) return 'The kid is already past it.';
  if (block.posted.some((p) => p.holdingId === holdingId)) return 'Somebody is already standing there.';
  const c = block.crew.find((x) => x.id === id);
  if (!c || c.where !== 'in') return 'Nobody by that name.';
  if (c.minor) return `${c.name} is ${c.age ?? 'young'}. Not against a child, and not in a fight.`;
  if (c.outOn === block.here.day) return `${c.name} is resting after yesterday's battle.`;
  if (block.queue.some((j) => j.squad.includes(id)) || block.posted.some((p) => p.id === id)) return `${c.name} is already going somewhere today.`;
  return null;
}

export function post(block: EvilModeBlock, holdingId: string, id: string): { block: EvilModeBlock; problem: string | null } {
  const p = postProblem(block, holdingId, id);
  return p ? { block, problem: p } : { block: { ...block, posted: [...block.posted, { holdingId, id }] }, problem: null };
}

export const unpost = (block: EvilModeBlock, holdingId: string): EvilModeBlock => ({ ...block, posted: block.posted.filter((p) => p.holdingId !== holdingId) });

// ---- The road (Part 18 section 7, Part 2 section 3.6) ----

const placeName = (h: Holding, data: EvilData) => holdingName({ ...h, scouted: Math.max(1, h.scouted) }, data);

function turn(block: EvilModeBlock, h: Holding, hero: Hero, data: EvilData): { block: EvilModeBlock; hero: Hero; text: string } {
  const d = block.district!;
  const holdings = d.holdings.map((x): Holding => {
    if (x.id !== h.id) return x;
    const { method: _m, since: _s, ...rest } = x;
    return { ...rest, owner: 'nobody', holds: false };
  });
  const l = localOf(h, data);
  const where = placeName(h, data);
  const who = l ? l.who.replace(/,.*$/, '') : '';
  const text = l ? fill(line('turned', data), { step: h.step, where, who }) : fill(line('turnedPlace', data), { step: h.step, where });
  const learned = l ? [...hero.learned, fill(line('learnedTurn', data), { who, step: h.step })] : hero.learned;
  const said = l ? [...hero.said, fill(line('saidTurn', data), { who, who2: who.split(' ')[0] ?? who })] : hero.said;
  let out: EvilModeBlock = { ...block, district: { ...d, holdings } };
  out = appendLog(out, { kind: 'hero', who: [], to: h.id, text: `Day ${block.here.day}. ${text}` });
  return { block: out, hero: { ...hero, learned, said, met: true }, text };
}

/** The Hero takes the district's Badge (Part 2 section 4: "Taken", or on their way through on the seventh day). */
export function takeBadge(block: EvilModeBlock, how: 'gym' | 'day7', data: EvilData = EVIL_DATA): EvilModeBlock {
  const d = block.district;
  const hero = block.hero;
  if (!d || !hero || hero.badges.some((b) => b.region === d.region && b.district === d.n)) return block;
  // Slice 8: half a tier off a Beaten or Bought Leader; and a Gym that's dealt with no longer ends the district when they win.
  const badge = { region: d.region, district: d.n, how: badgeHow(block, data), day: block.here.day };
  let out: EvilModeBlock = { ...block, hero: { ...hero, badges: [...hero.badges, badge] } };
  const text = line(how === 'gym' ? 'badge' : 'badgeDay7', data);
  if (how === 'gym' && !d.end && !gymDealt(block, data)) {
    const count = d.holdings.reduce((n, h) => n + (h.owner === 'team' && h.kind !== 'gym' ? 1 : 0), 0);
    out = { ...out, district: { ...d, end: { how: 'taken', day: block.here.day, count } }, evening: [...block.evening, text] };
  } else out = { ...out, evening: [...out.evening, text] };
  return appendLog(out, { kind: 'hero', who: [], to: d.holdings.find((h) => h.kind === 'gym')?.id, text: `Day ${block.here.day}. ${text}` });
}

/**
 * The Hero's walk for today (beat 6). Steps by personality; each holding they reach or pass over: one that would turn,
 * turns; one that holds, a wave; one with somebody posted, a fight (the walk stops there and waits on it); the Gym, the
 * Badge. Once a day. Returns the same block when they've walked today.
 */
export function walkHero(block: EvilModeBlock, data: EvilData = EVIL_DATA, maxStep = 20): EvilModeBlock {
  const d0 = block.district;
  let hero = block.hero;
  const day = block.here.day;
  if (!d0 || d0.end || !hero || hero.walked === day || block.fight) return block;
  // Slice 9: the Arrival and the Reckoning walk to their own days (Part 2 sections 2.1 and 2.3).
  if (maxStep === 20 && data.region.on && stageKind(block.here.stage) !== 'district') return stageWalk(block, data);
  if (hero.restOn === day) return { ...block, hero: { ...hero, walked: day, today: [line('rest', data)] } };
  let out = block;
  const from = hero.at;
  const lines: string[] = [];
  let fight: Fight | null = null;
  const n = stepsOn(hero, day, data);
  for (let i = 0; i < n && hero.at < maxStep; i++) {
    const s: number = hero.at + 1;
    hero = { ...hero, at: s };
    const h = out.district!.holdings.find((x) => x.step === s)!;
    if (h.kind === 'gym') {
      // Slice 8: who they fight at Step 20 depends on how the Gym was dealt with. A Bent Leader beats them first.
      const g = heroAtGym({ ...out, hero }, data);
      out = g.block;
      hero = out.hero!;
      lines.push(...g.lines);
      if (!g.took) {
        hero = { ...hero, at: s - 1, restOn: day + 1 };
        break;
      }
      out = takeBadge({ ...out, hero }, 'gym', data);
      hero = out.hero!;
      lines.push(line('badge', data));
      break;
    }
    const posted = out.posted.find((p) => p.holdingId === h.id);
    if (posted && h.owner === 'team') {
      const person = out.crew.find((c) => c.id === posted.id)?.name ?? 'Somebody';
      fight = { kind: 'hold', holdingId: h.id, personId: posted.id, begun: false };
      lines.push(fill(line('stopFight', data), { step: s, where: placeName(h, data), person }));
      break;
    }
    if (h.owner === 'team' && !h.holds) {
      const r = turn(out, h, hero, data);
      out = r.block;
      hero = r.hero;
      lines.push(r.text);
    } else if (h.owner === 'team') lines.push(fill(line('wave', data), { step: s, where: placeName(h, data) }));
  }
  const moved = hero.at - from;
  const head = fill(line('walked', data), { n: moved, s: moved === 1 ? '' : 's', from, to: hero.at });
  return { ...out, hero: { ...hero, walked: day, today: [head, ...lines] }, fight };
}

/** The Hero's likely road tomorrow: the steps they'd reach (the Board's faint line). Pure: no state changes. */
export function likelyRoad(block: EvilModeBlock, data: EvilData = EVIL_DATA): number[] {
  const hero = block.hero;
  if (!hero || block.district?.end) return [];
  const day = hero.walked === block.here.day ? block.here.day + 1 : block.here.day;
  if (hero.restOn === day) return [];
  const n = stepsOn(hero, day, data);
  return Array.from({ length: n }, (_, i) => hero.at + i + 1).filter((s) => s <= 20);
}

// ---- A Hold's result (Part 18 sections 7.3, 7.4 and 8) ----

/**
 * A Hold fight is over. Won by the person posted: the Hero steps back a step and rests a day, two marks. Lost: the holding's
 * gone (it turns), one mark. Either way, nobody leaves the road: the Hero is never removed, and the run goes on.
 */
export function holdResult(block: EvilModeBlock, won: boolean, fielded: readonly string[], data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  const f = block.fight;
  const hero0 = block.hero;
  const d = block.district;
  if (!f || f.kind !== 'hold' || !hero0 || !d) return { block, lines: [] };
  const h = d.holdings.find((x) => x.id === f.holdingId)!;
  const person = block.crew.find((c) => c.id === f.personId)?.name ?? 'Somebody';
  const where = placeName(h, data);
  const M = data.hero.marks;
  const bank = BANK[hero0.personality];
  let hero: Hero = {
    ...hero0, battlesWithTeam: hero0.battlesWithTeam + 1, met: true,
    seen: [...new Set([...hero0.seen, ...fielded])],
    said: [...hero0.said, fill(line('saidFight', data), { person })],
  };
  let out: EvilModeBlock = { ...block, fight: null, posted: block.posted.filter((p) => p.holdingId !== f.holdingId) };
  const lines: string[] = [];
  if (won) {
    hero = { ...hero, at: Math.max(1, h.step - 1), marks: Math.min(M.max, hero.marks + M.lostToGrunt), restOn: block.here.day + 1, lostDays: hero.lostDays + 1, learned: [...hero.learned, fill(line('learnedLoss', data), { person, where })] };
    lines.push(fill(sub('fightWon', 'hold', data), { person, where }));
    if (bank) lines.push(`"${bank.lost[hero.battlesWithTeam % bank.lost.length]}"`);
    out = appendLog({ ...out, hero }, { kind: 'hero', who: f.personId ? [f.personId] : [], to: h.id, text: `Day ${block.here.day}. ${fill(line('heldBack', data), { person, where })}` });
  } else {
    hero = { ...hero, marks: Math.min(M.max, hero.marks + M.grunt), learned: [...hero.learned, fill(line('learnedWin', data), { person, where })] };
    const r = turn({ ...out, hero }, h, hero, data);
    out = r.block;
    hero = r.hero;
    lines.push(fill(sub('fightLost', 'hold', data), { person, where }));
    if (bank) lines.push(`"${bank.won[hero.battlesWithTeam % bank.won.length]}"`);
    out = appendLog({ ...out, hero }, { kind: 'hero', who: f.personId ? [f.personId] : [], to: h.id, text: `Day ${block.here.day}. ${fill(line('heroPassed', data), { person, where })}` });
    // Slice 6: beaten, at Loyalty under 5, they may go with the kid (Part 9 section 10, way 4).
    const g = goWithHero(out, f.personId, data);
    out = g.block;
    if (g.line) lines.push(g.line);
  }
  // Slice 12: a Proud one who won gloats (+1); a Kind one was decent to them (−1, once a region).
  const c = block.crew.find((x) => x.id === f.personId);
  if (won && c?.flaw === 'proud') hero = moveTemper(hero, 1, 'proud', data);
  const decent = `temper:decent:${d.region}`;
  if (c?.flaw === 'kind' && !out.applied.includes(decent)) { hero = moveTemper(hero, -1, 'decent', data); out = { ...out, applied: [...out.applied, decent] }; }
  hero = { ...hero, today: [...hero.today, ...lines] };
  return { block: { ...out, hero }, lines };
}

/** The Hero's opening line, by personality, from the rival voice bank. */
export function heroOpen(hero: Hero, starterName: string): string {
  const b = BANK[hero.personality];
  return b ? b.open[0]!.replace('{mon}', starterName) : '';
}

/** Whether the counter's due: after the Doctrine's third battle (Part 18 section 6.1, slot 3). */
export const counterDue = (hero: Hero, data: EvilData = EVIL_DATA): boolean => hero.battlesWithTeam >= data.hero.counterAt;

/** The step on the road for a holding id. */
export const stepOfHolding = (block: EvilModeBlock, id: string): number => block.district?.holdings.find((h) => h.id === id)?.step ?? 0;

// ---- Slice 9: the Arrival's and the Reckoning's road (Part 2 sections 2.1 and 2.3) ----

const ownedCount = (b: EvilModeBlock): number => b.district!.holdings.filter((h) => h.owner === 'team' && h.kind !== 'gym').length;

/**
 * The Arrival: day 1 the Hero's at home; from day 2 they walk (stopping short of the Gym); on the Badge day (3 or 4) they
 * beat the first Leader and the Arrival ends. The Reckoning: day 1 they walk the district and win the eighth Badge without
 * the team; day 2 they sit outside; day 3 they come to the door, and the region ends (soft: never the run).
 */
function stageWalk(block: EvilModeBlock, data: EvilData): EvilModeBlock {
  const R = data.region;
  const d = block.district!;
  const day = block.here.day;
  const di = dayIn(block);
  const hero0 = block.hero!;
  const done = (b: EvilModeBlock, today: string[]): EvilModeBlock => ({ ...b, hero: { ...b.hero!, walked: day, today } });
  const badge = (b: EvilModeBlock, text: string): EvilModeBlock => {
    const h = b.hero!;
    if (h.badges.some((x) => x.region === d.region && x.district === d.n)) return b;
    const out: EvilModeBlock = { ...b, hero: { ...h, at: 20, badges: [...h.badges, { region: d.region, district: d.n, how: 'full', day }] }, evening: [...b.evening, text] };
    return appendLog(out, { kind: 'hero', who: [], to: d.holdings.find((x) => x.kind === 'gym')?.id, text: `Day ${day}. ${text}` });
  };
  if (stageKind(block.here.stage) === 'arrival') {
    if (di <= 1) return done(block, [fill(R.arrival.home, { street: hero0.home.street })]);
    let out = walkHero(block, data, 19);
    if (out.fight) return out;
    const today = [...(di === 2 ? [R.arrival.leaves] : []), ...out.hero!.today];
    if (di < block.region.badgeDay) return done(out, today);
    out = badge(out, R.arrival.badge);
    out = { ...out, district: { ...out.district!, end: { how: 'arrival', day, count: ownedCount(out) } }, evening: [...out.evening, R.arrival.end] };
    return done(out, [...today, R.arrival.badge]);
  }
  if (di <= 1) {
    let out = walkHero(block, data, 19);
    if (out.fight) return out;
    const today = out.hero!.today;
    out = badge(out, R.reckoning.badge);
    // Slice 12: what the eighth Leader says to them, and their answer (Part 21 section 2).
    return done(out, [...today, R.reckoning.badge, ...eighthLines(out, data)]);
  }
  if (di === 2) return done(badge(block, R.reckoning.badge), [R.reckoning.outside, ...(reckOn(data) ? approachLines(block, data) : [])]);
  // Slice 10: the base can delay the Hero, at most two days a region (Part 17 section 3.3).
  const late = baseDelay(block, data);
  if (di < R.reckoning.days + late) return done(block, [R.reckoning.outside, fill(data.base.delay.word, { days: late, s: late === 1 ? '' : 's' })]);
  // Slice 12: the gate, the walk, and the last room. The region ends when the room does (reckoning.ts finishRoom).
  if (reckOn(data)) {
    const r = openLastRoom(block, data);
    return done(r.block, [R.reckoning.arrives, ...r.lines]);
  }
  const out: EvilModeBlock = { ...block, district: { ...d, end: { how: 'reckoning', day, count: ownedCount(block) } }, evening: [...block.evening, R.reckoning.arrives, R.reckoning.end] };
  return done(out, [R.reckoning.arrives]);
}
