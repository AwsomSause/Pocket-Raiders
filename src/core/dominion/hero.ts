// DOMINION slice D11: the Hero and the Heroic Legendaries (design Part 4 §7-8, Part 9 A8-A9, Part 0 §6.1 Q1 and Q5;
// list outside-interactions.md section G, O166-O185; mockups s9 "the Hero's file" and m11 "the Hero shows up").
// - The Hero is the region's canon protagonist, grown up (Q1). If the Boss's own trainer is that Hero, the game's
//   canon rival plays the Hero instead (Q5).
// - Hero Threat (0-100) is worked out each night from Wanted, Dread, stolen Pokémon, buildings and what the Boss did in
//   their path. Five stages: Ignores, Foils (one job a week, mockup m11), Attacks (crew on tasks, the stores), Raids
//   (a Racket a week), Allies (Gym Leaders, the Champion, a Legendary; the HQ raided). Never harmed outside battle.
// - The Hero's reason is the first thing they see the Boss do (A9); they adapt to the Boss's types after two battles;
//   Disillusion (A8) is hidden and is the chance (max 80%) they join after the final stand.
// - Heroic Legendaries wake when Wanted or a town's Dread pass 70 and strike from outside each week until beaten.
// The World Turn's `hero` and `legends` steps run on their own streams (dominion-hero::<day>, dominion-legends::<day>);
// encounters roll on dominion-hero::<day>::meet, the Smoke Ball and the recruit roll on their own keys. No old roll
// moves. Pure: no Phaser; the run's Pokémon are made by fight.ts and session.ts.

import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import { book } from './book';
import { crewOf, setHeroTask } from './crew';
import { DOMINION_DATA } from './data';
import {
  addActedHook, addActionGate, addEffectHook, addFightHook, addHeat, districtDef, setHeroFoe, setInterruptHook, statusOf, syncHeat, targetDef, wanted,
} from './field';
import type { ActionDef, Alert, DominionBlock, Encounter, FieldFight, HeroDef, HeroState, Member } from './schema';
import { addWorldStep, fill } from './worldTurn';

const H = () => DOMINION_DATA.hero;
const F = () => DOMINION_DATA.field;
const Ln = () => DOMINION_DATA.hero.lines;
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)));
const weekOf = (day: number): number => Math.floor((day - 1) / DOMINION_DATA.start.clock.weekLength) + 1;
const rngOf = (...key: (string | number)[]): Rng => new Rng(hashSeed(key.join('::')));
const dName = (id: string): string => districtDef(id)?.name ?? id;

/** The region the Dominion is played in (field.json), as hero.json keys it. */
export const regionId = (): string => F().region;
const regionDef = () => H().regions[regionId()] ?? Object.values(H().regions)[0]!;

// ---------- who (Q1, Q5) ----------

/**
 * The Hero for a region: its canon protagonist (one of two picked by the run seed, fixed for the run). When the Boss's
 * own trainer is that region's Hero, the canon rival plays the Hero (Kice, Q5: Red -> Blue, Hilda -> Cheren...).
 */
export function heroFor(region: string, trainerId: string, seed: string): string {
  const r = H().regions[region] ?? regionDef();
  const own = trainerId.startsWith('evolved-') ? trainerId.slice('evolved-'.length) : trainerId;
  if (r.playerIs.includes(own)) return r.standIn[own]!;
  const pick = r.heroes[rngOf(seed, 'dominion-hero-pick', region).int(0, r.heroes.length - 1)]!;
  return pick;
}

export const heroDefOf = (id: string): HeroDef => H().heroes.find((h) => h.id === id) ?? H().heroes[0]!;

export function freshHero(day: number, id: string): HeroState {
  return {
    id, threat: 0, harm: 0, stolen: 0, stage: 0, badges: 0, badgeDay: day + H().badges.first, delay: 0, morale: 100, met: false,
    reason: null, wrong: false, disill: 0, seen: 0, types: {}, counters: [], intel: 0, forced: false, foilWeek: 0, foilDay: 0, foiled: false,
    weekDone: {}, allies: [], meet: null, used: [], week: [], stand: null,
    legends: Object.fromEntries(regionDef().legends.map((l) => [l.id, { seen: false, next: 0, away: 0, beaten: 0 }])),
  };
}

/** The block's Hero (made with the region's first Hero if the session hasn't set one yet). */
export function heroOf(b: DominionBlock): HeroState {
  return (b.hero ??= freshHero(b.day, regionDef().heroes[0]!));
}

/** Sets the Hero up for a run (the session calls it with the Boss's trainer). Pure; returns the block. */
export function ensureHero(block: DominionBlock, trainerId: string, seed: string): DominionBlock {
  if (block.hero) return block;
  return { ...block, hero: freshHero(block.day, heroFor(regionId(), trainerId, seed)) };
}

// ---------- Threat, level, team ----------

export function threatOf(b: DominionBlock): number {
  const w = H().threat.weights, h = heroOf(b);
  const dread = Object.values(b.field.districts).reduce((a, d) => a + Math.max(0, d.dread), 0);
  // Buildings: the HQ's levels for now; D5 adds the buildings outside it.
  const buildings = b.hqLevel - 1;
  return clamp(wanted(b.field) * w.wanted + dread * w.dread + h.stolen * w.stolen + buildings * w.building + (h.harm + b.field.hero) * w.harm);
}

export function stageIndex(threat: number): number {
  const s = H().threat.stages;
  let i = 0;
  while (i + 1 < s.length && threat >= s[i + 1]!.min) i += 1;
  return i;
}
export const stageOf = (b: DominionBlock) => H().threat.stages[stageIndex(heroOf(b).threat)]!;

/** Where the Hero is: the town on their story path for the badges they hold. */
export function heroAt(b: DominionBlock): string {
  const path = regionDef().path ?? [F().hq];
  return path[Math.min(heroOf(b).badges, path.length - 1)]!;
}

const bestLevel = (run: Pick<RunState, 'party'>): number => run.party.reduce((a, m) => Math.max(a, m.level), 1);

/** Hero level = the Boss's best level −5 to +5 by Threat, one lower per 10 points of lost nerve (Part 4 §7.2). */
export function heroLevel(b: DominionBlock, run: Pick<RunState, 'party'>): number {
  const L = H().level, h = heroOf(b);
  const off = Math.round(L.low + ((L.high - L.low) * h.threat) / 100) - Math.floor((100 - h.morale) / L.moraleStep);
  return clamp(bestLevel(run) + off, F().levels.min, b.levelCap + F().levels.overCap);
}

const stageFor = (line: readonly string[], level: number): string => {
  const [a, c] = H().team.stageAt;
  return line[Math.min(line.length - 1, level >= c ? 2 : level >= a ? 1 : 0)]!;
};

export interface HeroTeam { name: string; cls: string | null; team: { species: string; level: number }[]; wild: boolean }

/**
 * The team the Hero (or their sidekick, or a Legendary) brings. Counters (A9) take the last slots; allies' aces join at
 * the HQ and the final stand; the final stand is a full six at the region's cap, with the Hero's partner Legendary.
 */
export function heroTeam(b: DominionBlock, run: Pick<RunState, 'party'>, kind: 'hero' | 'sidekick' | 'legend', why: FieldFight['why'] | null = null): HeroTeam {
  const h = heroOf(b), def = heroDefOf(h.id), T = H().team;
  if (kind === 'legend') {
    const id = b.field.fight?.target ?? regionDef().legends[0]!.id;
    const L = regionDef().legends.find((l) => l.id === id) ?? regionDef().legends[0]!;
    return { name: L.name, cls: null, team: [{ species: L.id, level: b.levelCap + H().legends.levelOver }], wild: true };
  }
  if (kind === 'sidekick') {
    const lv = Math.max(F().levels.min, heroLevel(b, run) - 3);
    return { name: regionDef().sidekick ?? 'A kid', cls: 'youngster', team: def.lines.slice(0, 2).map((l) => ({ species: stageFor(l, lv), level: lv })), wild: false };
  }
  const stand = why === 'stand';
  const lv = stand ? b.levelCap : heroLevel(b, run);
  const size = stand ? 6 : T.sizeByBadges[Math.min(8, h.badges)]!;
  const species = def.lines.slice(0, size).map((l) => stageFor(l, lv));
  // Counters replace the newest catches, never the starter.
  h.counters.slice(0, Math.max(0, species.length - 1)).forEach((type, i) => {
    const line = H().counters[type]?.[1];
    if (line) species[species.length - 1 - i] = stageFor(line, lv);
  });
  if (stand && def.partner) species[species.length - 1] = def.partner;
  if (stand || why === 'heroRaid') {
    for (const a of h.allies) {
      if (species.length >= 6) break;
      const ally = regionDef().allies?.find((x) => x.id === a);
      if (ally) species.push(ally.ace);
      else if (regionDef().legends.some((l) => l.id === a)) species.push(a);
    }
  }
  return { name: def.name, cls: 'rival', team: species.map((s) => ({ species: s, level: lv })), wild: false };
}

// ---------- the Morning Report and the Hero file's "This week" ----------

const ALERT_TIMES = ['4:50', '5:05', '5:20', '5:35', '5:50'];
function alert(b: DominionBlock, text: string): void {
  const al = b.crew?.alerts;
  if (al) al.push({ kind: 'hero' as Alert['kind'], time: ALERT_TIMES[Math.min(al.filter((a) => a.kind === 'hero').length, ALERT_TIMES.length - 1)]!, text });
}
function note(b: DominionBlock, text: string): void {
  const h = heroOf(b);
  h.week = [...h.week, text].slice(-4);
}
const vars = (b: DominionBlock, extra: Record<string, string | number> = {}): Record<string, string | number> => {
  const h = heroOf(b);
  return { hero: heroDefOf(h.id).name, badges: h.badges, district: dName(heroAt(b)), at: dName(heroAt(b)), ...extra };
};
export const reasonDef = (id: string | null) => H().reasons.find((r) => r.id === id) ?? null;

/** Meeting the Hero (the gate for Shame, Ambush, Steal the Item, Recruit a Friend). Returns the line once. */
function meet(b: DominionBlock): string[] {
  const h = heroOf(b);
  if (h.met) return [];
  h.met = true;
  return [fill(Ln().met!, vars(b))];
}

const addDisill = (b: DominionBlock, n: number): void => {
  const h = heroOf(b);
  h.disill = clamp(h.disill + n);
};

// ---------- what the Hero sees the Boss do (A9 reason, A8 Disillusion) ----------

/** An action landed (or failed): the Hero sees it when it's in their town; stolen Pokémon count anywhere. */
function acted(b: DominionBlock, def: ActionDef, district: { id: string }, won: boolean): void {
  const h = heroOf(b), D = H().disillusion;
  if (won && H().threat.stolenActions.includes(def.id)) h.stolen += 1;
  if (district.id !== heroAt(b)) return;
  const r = H().reasons.find((x) => x.actions.includes(def.id));
  if (won && r) {
    if (!h.reason) {
      h.reason = r.id;
      note(b, fill(Ln().reason!, vars(b, { reason: r.text })));
    } else if (h.reason === r.id) addDisill(b, D.hurt);
  }
  if (won && D.goodActions.includes(def.id)) addDisill(b, D.good);
  if (won && D.bribeActions.includes(def.id)) addDisill(b, D.bribe);
}

/** With no reason seen by Foils, they take the Boss's most common kind of job (stealing, extortion, attacks...). */
function settleReason(b: DominionBlock): void {
  const h = heroOf(b);
  if (h.reason) return;
  const done = b.field.mastery;
  let best: { id: string; n: number } | null = null;
  for (const r of H().reasons) {
    const n = r.actions.reduce((a, id) => a + (done[id] ?? 0), 0);
    if (n > 0 && (!best || n > best.n)) best = { id: r.id, n };
  }
  if (best) {
    h.reason = best.id;
    note(b, fill(Ln().reason!, vars(b, { reason: reasonDef(best.id)!.text })));
  }
}

// ---------- the World Turn: hero step ----------

function heroStep(b: DominionBlock, seed: string): string[] {
  const h = heroOf(b), S = H().threat.stages;
  const out: string[] = [];
  const say = (t: string, onFile = true): void => {
    out.push(t);
    alert(b, t);
    if (onFile) note(b, t);
  };
  const week = weekOf(b.day);
  if (h.foilWeek && h.foilWeek !== week) h.week = [];
  const r = rngOf(seed, 'dominion-hero', b.day);
  // Threat and stage (stages once reached are announced once).
  h.threat = threatOf(b);
  const st = stageIndex(h.threat);
  if (st > h.stage) {
    h.stage = st;
    say(fill(Ln().stage!, vars(b, { word: S[st]!.word, does: S[st]!.does })), false);
  }
  // Badges along the story path; every lost day pushes the next one back.
  if (h.badges < 8 && b.day >= h.badgeDay + h.delay) {
    h.badges += 1;
    h.badgeDay = b.day + Math.max(H().badges.min, H().badges.every - H().badges.perStage * st);
    h.delay = 0;
    say(fill(Ln().badge!, vars(b, { district: dName(heroAt(b)) })));
    const row = H().encounters.rows.find((e) => e.badge && !h.used.includes(e.id));
    if (row && !h.meet && h.met) deal(b, row);
  }
  // Foils (25+): one job a week, on a day picked at the week's start.
  if (st >= 1) {
    if (h.foilWeek !== week) {
      h.foilWeek = week;
      h.foilDay = (week - 1) * DOMINION_DATA.start.clock.weekLength + 1 + r.int(0, DOMINION_DATA.start.clock.weekLength - 1);
      h.foiled = false;
      settleReason(b);
    }
  } else if (h.foilWeek !== week) h.foilWeek = week;
  const once = (k: string): boolean => {
    if (h.weekDone[k] === week) return false;
    h.weekDone[k] = week;
    return true;
  };
  // Attacks (45+): hunts a member out on a task; once a week frees Pokémon from the stores.
  if (st >= 2) {
    const A = H().attacks;
    const out1 = b.members.filter((m) => !crewOf(m).out && crewOf(m).task !== 'guard-hq' && crewOf(m).lastTask && crewOf(m).lastTask !== 'guard-hq');
    if (out1.length && r.int(1, 100) <= A.huntChance) {
      const m = out1[r.int(0, out1.length - 1)]!;
      crewOf(m).out = { why: 'hurt', days: A.hurtDays };
      say(fill(Ln().hunt!, vars(b, { name: m.name, days: A.hurtDays })));
    }
    const stores = b.crew?.stores ?? [];
    if (stores.length && once('free')) {
      const n = Math.min(A.free, stores.length);
      b.crew!.stores = stores.slice(0, stores.length - n);
      say(fill(Ln().free!, vars(b, { n })));
    }
  }
  // Raids (65+): breaks up the biggest Racket a week (the machines in D5's rooms come with D5).
  if (st >= 3 && once('racket')) {
    const rk = [...b.field.rackets].sort((x, y) => y.weekly - x.weekly)[0];
    if (rk) {
      b.field.rackets = b.field.rackets.filter((x) => x !== rk);
      say(fill(Ln().racket!, vars(b, { target: targetDef(rk.target)?.target.name ?? rk.target })));
    } else say(fill(Ln().noRacket!, vars(b)));
  }
  // Allies (80+): one ally a week (the Leaders, then the Champion, then a Legendary); the HQ raided weekly.
  if (st >= 4) {
    if (once('ally')) {
      const next = (regionDef().allies ?? []).find((a) => !h.allies.includes(a.id) && a.id !== h.id);
      if (next) {
        h.allies.push(next.id);
        say(fill(Ln().ally!, vars(b, { ally: next.name })));
      } else {
        const lg = regionDef().legends.find((l) => !h.allies.includes(l.id));
        if (lg) {
          h.allies.push(lg.id);
          say(fill(Ln().allyLegend!, vars(b, { legend: lg.name })));
        }
      }
    }
    if (!b.field.fight && once('raid')) {
      b.field.fight = { why: 'heroRaid', foe: 'hero', begun: false, action: null, target: null, district: F().hq, pass: false, big: false, wager: 0, racket: null };
      say(fill(Ln().raid!, vars(b, { n: h.allies.length })));
    }
  }
  // A8: a fear-heavy rule (Dread far above Regard) lowers Disillusion, once a week, unseen.
  const D = H().disillusion;
  const dread = Object.values(b.field.districts).reduce((a, d) => a + Math.max(0, d.dread), 0);
  const regard = Object.values(b.field.districts).reduce((a, d) => a + Math.max(0, d.regard), 0);
  if (dread > regard * D.fearRatio + D.fearMargin && once('fear')) addDisill(b, D.fear);
  // The final stand's rematch day.
  if (h.stand?.state === 'due' && b.day >= h.stand.day && !b.field.fight) {
    b.field.fight = { why: 'stand', foe: 'hero', begun: false, action: null, target: null, district: F().hq, pass: false, big: false, wager: 0, racket: null };
    say(fill(Ln().standDue!, vars(b, { place: heroDefOf(h.id).place })), false);
  }
  // Encounters (O166-O185): one card at a time, at most one a day; an unanswered card goes after two days.
  if (h.meet && b.day - h.meet.day >= 2) h.meet = null;
  if (!h.meet && b.day >= H().encounters.from && rngOf(seed, 'dominion-hero', b.day, 'meet').int(1, 100) <= H().encounters.chance) {
    const rows = H().encounters.rows.filter((e) => !e.badge && !h.used.includes(e.id) && (h.met || e.id === 'O166'));
    if (rows.length) deal(b, rows[rngOf(seed, 'dominion-hero', b.day, 'row').int(0, rows.length - 1)]!);
  }
  if (h.meet) {
    const e = H().encounters.rows.find((x) => x.id === h.meet!.id)!;
    alert(b, fill(e.title, vars(b)) + (e.night ? ' (tonight)' : ''));
  }
  return out;
}

function deal(b: DominionBlock, e: Encounter): void {
  const h = heroOf(b);
  h.meet = { id: e.id, day: b.day, district: heroAt(b) };
  h.used.push(e.id);
}

// ---------- the World Turn: legends step ----------

function legendsStep(b: DominionBlock, seed: string): string[] {
  const h = heroOf(b), G = H().legends;
  const out: string[] = [];
  const say = (t: string): void => {
    out.push(t);
    alert(b, t);
    note(b, t);
  };
  const w = wanted(b.field);
  const dread = Math.max(0, ...Object.values(b.field.districts).map((d) => d.dread));
  const stirred = w >= G.wakeAt || dread >= G.wakeAt;
  const r = rngOf(seed, 'dominion-legends', b.day);
  for (const L of regionDef().legends) {
    const s = (h.legends[L.id] ??= { seen: false, next: 0, away: 0, beaten: 0 });
    if (s.away > b.day) continue;
    if (!s.seen) {
      if (!stirred) continue;
      s.seen = true;
      s.next = b.day + G.warn;
      say(fill(Ln().seen!, { legend: L.name, over: L.over ?? dName(L.home ?? F().hq) }));
      break; // one wakes at a time
    }
    if (b.day < s.next) continue;
    s.next = b.day + G.strikeEvery;
    // Strikes from outside: a Racket wrecked, a held town's Control scattered, or the stores flung open.
    const held = Object.keys(b.field.districts).filter((id) => ['held', 'owned', 'contested'].includes(statusOf(b.field.districts[id]!)));
    const opts: (() => boolean)[] = [
      () => {
        const rk = b.field.rackets.find((x) => x.district === L.home) ?? b.field.rackets[0];
        if (!rk) return false;
        b.field.rackets = b.field.rackets.filter((x) => x !== rk);
        say(fill(Ln().wreck!, { legend: L.name, target: targetDef(rk.target)?.target.name ?? rk.target }));
        return true;
      },
      () => {
        const id = held.includes(L.home ?? '') ? L.home! : held[0];
        if (!id) return false;
        const ds = b.field.districts[id]!;
        const n = Math.min(ds.control, G.scatter);
        ds.control -= n;
        say(fill(Ln().scatter!, { legend: L.name, district: dName(id), n }));
        return true;
      },
      () => {
        const n = b.crew?.stores.length ?? 0;
        if (!n) return false;
        b.crew!.stores = [];
        say(fill(Ln().loose!, { legend: L.name, n }));
        return true;
      },
    ];
    const start = r.int(0, opts.length - 1);
    let hit = false;
    for (let i = 0; i < opts.length && !hit; i++) hit = opts[(start + i) % opts.length]!();
    if (!hit) say(fill(Ln().calm!, { legend: L.name, over: L.over ?? dName(L.home ?? F().hq) }));
  }
  return out;
}

/** The Legendaries out there now (seen and not driven off), for the Hero file and the fight. */
export function activeLegends(b: DominionBlock): string[] {
  const h = heroOf(b);
  return regionDef().legends.filter((l) => h.legends[l.id]?.seen && (h.legends[l.id]?.away ?? 0) <= b.day).map((l) => l.id);
}

// ---------- the Hero steps into a job (m11) ----------

const HERO_ACTIONS = new Set(['shame-the-hero', 'duel-the-hero', 'recruit-a-hero-s-friend', 'ambush-the-hero-s-route', 'steal-the-hero-s-item']);

function interrupt(b: DominionBlock, def: ActionDef, district: { id: string }): boolean {
  const h = heroOf(b);
  void district;
  if (HERO_ACTIONS.has(def.id) || h.foiled || h.stage < 1 || stageIndex(h.threat) < 1 || h.foilWeek !== weekOf(b.day) || b.day < h.foilDay) return false;
  h.foiled = true;
  h.met = true;
  return true;
}

// ---------- encounter cards (O166-O185) ----------

export const encounterOf = (id: string): Encounter | undefined => H().encounters.rows.find((e) => e.id === id);

export interface MeetOut { ok: boolean; block: DominionBlock; notice: string | null; fight: boolean; item: string | null; funds: number }

/** Answers the waiting card. A battle choice leaves `field.fight` for the session to start. */
export function answerMeet(block: DominionBlock, choice: number): MeetOut {
  const no = (notice: string | null = null): MeetOut => ({ ok: false, block, notice, fight: false, item: null, funds: 0 });
  const m = block.hero?.meet;
  const e = m ? encounterOf(m.id) : undefined;
  const c = e?.choices[choice];
  if (!m || !e || !c) return no();
  if (e.night && block.phase !== 'night') return no('That one waits for the night.');
  if (c.battle && (block.field.fight || block.phase === 'morning')) return no(block.field.fight ? 'A fight is waiting.' : 'Start the day first.');
  if (c.funds && c.funds < 0 && block.funds + c.funds < 0) return no(`Not enough money: it costs ₽${-c.funds}.`);
  const b = structuredClone(block);
  const h = heroOf(b), ds = b.field.districts[m.district];
  h.meet = null;
  const lines = [fill(c.line, vars(b, { district: dName(m.district) }))];
  if (e.who === 'hero') lines.push(...meet(b));
  if (ds) {
    if (c.regard) ds.regard += c.regard;
    if (c.dread) ds.dread += c.dread;
  }
  if (c.heat) addHeat(b, m.district, c.heat);
  if (c.harm) h.harm += c.harm;
  if (c.delay) h.delay += c.delay;
  if (c.intel) h.intel = Math.max(h.intel, b.day + c.intel);
  if (c.disill) addDisill(b, c.disill);
  if (c.crewMor) for (const x of b.members) x.morale = clamp(x.morale + c.crewMor);
  if (c.funds) {
    b.funds += c.funds;
    book(b, 'other', c.funds);
  }
  if (c.wrong) {
    const r = reasonDef(h.reason);
    if (r?.wrong && !h.wrong) {
      h.wrong = true;
      addDisill(b, H().disillusion.wrong);
      lines.push(fill(Ln().wrong!, vars(b, { wrong: r.wrong })));
    }
  }
  if (c.battle) b.field.fight = { why: 'challenge', foe: c.battle, begun: false, action: null, target: null, district: m.district, pass: false, big: false, wager: 0, racket: null };
  syncHeat(b);
  return { ok: true, block: b, notice: lines.join(' '), fight: !!c.battle, item: c.item ?? null, funds: c.funds ?? 0 };
}

// ---------- fighting a Legendary (a Day action, from the Hero file) ----------

export function legendProblem(b: DominionBlock, id: string): string | null {
  if (!activeLegends(b).includes(id)) return Ln().legendNone!;
  if (b.field.fight) return 'A fight is waiting.';
  if (b.phase !== 'day' || b.actions < 1) return Ln().legendDay!;
  return null;
}

export function startLegend(block: DominionBlock, id: string): { ok: boolean; block: DominionBlock; notice: string | null } {
  const why = legendProblem(block, id);
  if (why) return { ok: false, block, notice: why };
  const b = structuredClone(block);
  b.actions -= 1;
  const L = regionDef().legends.find((l) => l.id === id)!;
  b.field.fight = { why: 'legend', foe: 'legend', begun: false, action: null, target: id, district: L.home ?? F().hq, pass: false, big: false, wager: 0, racket: null };
  return { ok: true, block: b, notice: null };
}

// ---------- the final stand (Part 4 §7.3, A8) ----------

/** D14 calls this once a takeover path finishes the region: the Hero comes for the Boss the next morning. */
export function callFinalStand(b: DominionBlock): void {
  const h = heroOf(b);
  if (h.stand) return;
  h.stand = { state: 'due', day: b.day + 1, lost: 0, outcome: null };
}

/** After a won final stand: leave them in their shame, or try to recruit them (chance = Disillusion, max 80%). */
export function afterStand(block: DominionBlock, how: 'leave' | 'recruit', seed: string): { ok: boolean; block: DominionBlock; notice: string | null; joined: boolean } {
  const h0 = block.hero;
  if (h0?.stand?.state !== 'choose') return { ok: false, block, notice: null, joined: false };
  const b = structuredClone(block);
  const h = heroOf(b), St = H().stand, name = heroDefOf(h.id).name;
  const towns = Object.values(b.field.districts);
  if (how === 'leave') {
    for (const d of towns) {
      d.dread += St.leaveDread;
      d.regard += St.leaveRegard;
    }
    h.stand = { ...h.stand!, state: 'done', outcome: 'leave' };
    return { ok: true, block: b, notice: fill(Ln().leave!, { hero: name }), joined: false };
  }
  const chance = Math.min(H().disillusion.joinMax, h.disill);
  const joined = rngOf(seed, 'dominion-hero-join', b.day).int(1, 100) <= chance;
  if (joined) {
    h.stand = { ...h.stand!, state: 'done', outcome: 'joined' };
    return { ok: true, block: b, notice: fill(Ln().joined!, { hero: name, line: St.joinLine }), joined: true };
  }
  for (const d of towns) d.regard += St.refuseRegard;
  h.stand = { ...h.stand!, state: 'done', outcome: 'refused' };
  return { ok: true, block: b, notice: fill(Ln().refused!, { hero: name }), joined: false };
}

/** The Hero as a crew member after they join (Executive, Part 8); the session gives them their team. */
export function heroMember(b: DominionBlock, id: string): Member {
  const def = heroDefOf(heroOf(b).id), St = H().stand;
  const rank = DOMINION_DATA.crew.ranks.find((r) => r.id === St.rank)!;
  return {
    id, name: def.name, rank: rank.id, gender: def.gender, look: def.look, level: rank.level, stats: { ...St.stats },
    loyalty: St.joinLoyalty, morale: 60, traitPoints: 2, untrained: false, wage: rank.wage, team: [], joinedDay: b.day, unpaid: 0,
  };
}

// ---------- fights end ----------

function afterFight(b: DominionBlock, run: RunState, fight: FieldFight, outcome: 'win' | 'lose' | 'fled'): string[] {
  const h = heroOf(b), won = outcome === 'win';
  const lines: string[] = [];
  const name = heroDefOf(h.id).name;
  void run;
  if (fight.foe === 'hero') {
    // A9: they watched the Boss's types (counted when the battle began, fight.ts); after two battles, counters.
    h.seen += 1;
    if (h.seen >= H().adapt.after && h.counters.length < H().adapt.max) {
      const top = Object.entries(h.types).sort((a, c) => c[1] - a[1] || a[0].localeCompare(c[0])).find(([t]) => H().counters[t] && !h.counters.includes(H().counters[t]![0]) && !h.counters.includes(t));
      if (top) {
        h.counters.push(top[0]);
        const line = fill(H().adapt.line, { type: top[0][0]!.toUpperCase() + top[0].slice(1) });
        alert(b, line);
        note(b, line);
      }
    }
    h.met = true;
    if (won) addDisill(b, H().disillusion.fair);
  }
  switch (fight.why) {
    case 'hero':
      lines.push(fill(won ? Ln().foilWon! : Ln().foilLost!, { hero: name }));
      break;
    case 'challenge':
      lines.push(fill(won ? Ln().won! : Ln().lost!, { hero: fight.foe === 'sidekick' ? regionDef().sidekick ?? 'The kid' : name }), Ln().challenge!);
      break;
    case 'heroRaid': {
      if (won) lines.push(fill(Ln().raidWon!, { hero: name }));
      else {
        const take = Math.max(0, Math.floor(Math.max(0, b.funds) * H().heroRaid.take));
        b.funds -= take;
        const n = Math.min(H().heroRaid.free, b.crew?.stores.length ?? 0);
        if (n) b.crew!.stores = b.crew!.stores.slice(0, b.crew!.stores.length - n);
        lines.push(fill(Ln().raidLost!, { hero: name, take, n }));
      }
      break;
    }
    case 'stand': {
      const St = H().stand;
      if (won) {
        h.stand = { state: 'choose', day: b.day, lost: h.stand?.lost ?? 0, outcome: null };
        lines.push(fill(Ln().standWon!, { hero: name }));
      } else {
        // Contested: the Hero takes back the three strongest towns, and comes back in seven days.
        const ids = Object.keys(b.field.districts).sort((x, y) => b.field.districts[y]!.control - b.field.districts[x]!.control).slice(0, St.take);
        for (const id of ids) b.field.districts[id]!.control = Math.min(b.field.districts[id]!.control, St.control);
        h.stand = { state: 'due', day: b.day + St.rematch, lost: (h.stand?.lost ?? 0) + 1, outcome: null };
        lines.push(fill(Ln().standLost!, { hero: name, n: ids.length, days: St.rematch }));
      }
      break;
    }
    case 'legend': {
      const L = regionDef().legends.find((l) => l.id === fight.target);
      const s = L ? h.legends[L.id] : undefined;
      if (L && s) {
        if (won) {
          s.away = b.day + H().legends.away;
          s.beaten += 1;
          s.next = s.away;
          lines.push(fill(Ln().legendWon!, { legend: L.name, weeks: Math.round(H().legends.away / 7) }));
        } else lines.push(fill(Ln().legendLost!, { legend: L.name }));
      }
      break;
    }
    default:
      break;
  }
  return lines;
}

/** A9: the Boss's types the Hero saw in a battle (fight.ts counts them when it begins: it has the species data). */
export function sawTypes(b: DominionBlock, types: readonly string[]): void {
  const h = heroOf(b);
  for (const t of types) h.types[t] = (h.types[t] ?? 0) + 1;
}

// ---------- the five Boss actions on the Hero (lists/player-actions.md 123-127) ----------

function heroGate(b: DominionBlock, def: ActionDef, district: string): string | null {
  if (!HERO_ACTIONS.has(def.id)) return null;
  const h = heroOf(b);
  if (def.unlock.includes('stage')) {
    if (h.stage < 2 && !h.forced) return Ln().notStage!;
  } else if (!h.met) return Ln().notMet!;
  if (district !== heroAt(b)) return fill(Ln().notHere!, { district: dName(district), at: dName(heroAt(b)) });
  return null;
}

function effects(): void {
  const A = H().actions;
  addEffectHook('heroShame', (b, _run, x, lines) => {
    const h = heroOf(b);
    h.morale = clamp(h.morale - (x.big ? A.shame.bigMorale : A.shame.morale));
    lines.push(fill(Ln().shame!, vars(b, { district: x.district.name })));
  });
  addEffectHook('heroDuel', (b, _run, _x, lines) => {
    const h = heroOf(b);
    h.morale = clamp(h.morale - A.duel.morale);
    h.forced = false;
    void lines;
  });
  addEffectHook('heroFriend', (b, _run, _x, lines) => {
    const h = heroOf(b);
    const gone = h.allies.filter((a) => regionDef().allies?.some((x) => x.id === a)).at(-1);
    if (gone) {
      h.allies = h.allies.filter((a) => a !== gone);
      lines.push(fill(Ln().friend!, vars(b, { ally: regionDef().allies!.find((x) => x.id === gone)!.name })));
    } else {
      h.intel = Math.max(h.intel, b.day + A.friend.intel);
      lines.push(fill(Ln().friendHint!, vars(b)));
    }
  });
  addEffectHook('heroAmbush', (b, _run, x, lines) => {
    const n = x.big ? A.ambush.bigDelay : A.ambush.delay;
    heroOf(b).delay += n;
    lines.push(fill(Ln().ambush!, vars(b, { n })));
  });
  addEffectHook('heroItem', (b, run, x, lines) => {
    const id = x.big ? A.item.bigItem : A.item.item;
    run.inventory[id] = (run.inventory[id] ?? 0) + 1;
    heroOf(b).delay += A.item.delay;
    lines.push(fill(Ln().item!, vars(b, { item: id.replace(/-/g, ' ') })));
  });
}

// ---------- the crew's Hero tasks (team-actions.md 45, 118, 145) ----------

function heroTask(b: DominionBlock, m: Member, task: { id: string }, x: { lv: number; r: Rng; ok: boolean; say: (k: Alert['kind'], t: string) => void }): void {
  const h = heroOf(b), T = H().tasks, v = vars(b, { name: m.name });
  if (task.id === 'track-the-hero') {
    if (!x.ok) return;
    h.met = true;
    const n = T.track[x.lv - 1]!;
    if (n) h.intel = Math.max(h.intel, b.day + n);
    x.say('hero', fill(n ? Ln().track! : Ln().trackNow!, { ...v, n }));
  } else if (task.id === 'counter-the-heros-story') {
    if (x.ok) {
      h.morale = clamp(h.morale - T.counter[x.lv - 1]!);
      x.say('hero', fill(Ln().counter!, v));
    } else {
      const ds = b.field.districts[crewOf(m).where ?? F().hq];
      if (ds) ds.regard -= T.backfire;
      x.say('hero', fill(Ln().backfire!, v));
    }
  } else if (task.id === 'hunt-the-hero') {
    if (!x.ok) return;
    h.met = true;
    h.intel = Math.max(h.intel, b.day + 1);
    if (x.lv >= 5) {
      h.forced = true;
      x.say('hero', fill(Ln().hunt5!, v));
    } else if (x.lv >= 3) {
      h.delay += 1;
      x.say('hero', fill(Ln().hunt3!, v));
    } else x.say('hero', fill(Ln().hunt1!, v));
  }
}

/** Patrol's "Meets the Hero" risk (D6's task): a patrol in the Hero's town runs into them. */
function patrolMeets(b: DominionBlock): string[] {
  const at = heroAt(b);
  const m = b.members.find((x) => crewOf(x).lastTask === 'patrol-the-district' && crewOf(x).last !== 'fail' && (crewOf(x).where ?? F().hq) === at);
  if (!m || heroOf(b).met) return [];
  heroOf(b).met = true;
  const t = fill(Ln().patrol!, vars(b, { name: m.name, district: dName(at) }));
  alert(b, t);
  return [t];
}

// ---------- registration (once, at import) ----------

addWorldStep('hero', (b, seed) => [...patrolMeets(b), ...heroStep(b, seed)]);
addWorldStep('legends', legendsStep);
setInterruptHook(interrupt);
addActedHook(acted);
addFightHook((b, run, fight, outcome) => (['hero', 'sidekick', 'legend'].includes(fight.foe) ? afterFight(b, run, fight, outcome) : []));
addActionGate(heroGate);
setHeroFoe((b, run, kind) => {
  const t = heroTeam(b, run, kind, b.field.fight?.why ?? null);
  const first = t.team[0]!;
  return { name: t.name, species: first.species, level: first.level, wild: t.wild };
});
setHeroTask(heroTask);
effects();
