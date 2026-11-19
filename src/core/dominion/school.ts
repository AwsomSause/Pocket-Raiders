// DOMINION slice D4b: what later slices pointed back at the ranks (pyramid.json `school`). Two crew tasks (Learn a
// Trade, Teach a Move), three Boss actions (Egg Run, Breed, Move Tutor) and the rank and training rooms (Admin Quarters,
// Classroom, Sparring Ring, Stealth School, Officer Academy, Therapy Room, Retiree Hall, Comfort Ward, Grunt Academy,
// Skill Booth, Veteran's Corner, Skill Exam Hall, Personality Lab, Mentoring Office, Sergeant's Post, Lieutenant's Office,
// Captain's Hall, Type Dojo: Fire). The seat rooms, the Officer Academy, the Classroom and the Exam Hall act in
// pyramid.ts; the Skill Booth in crew.ts; the rest here. No new RNG stream: Egg Run and Breed roll on the action's own
// stream (field.ts), and nothing else here rolls.

import { teachableMoves } from '../catalog';
import type { Content } from '../contentSchema';
import { familyId, teachEggMove } from '../mastery';
import { gainXp, getSpecies, maxHp } from '../pokemon';
import type { Rng } from '../rng';
import type { PokemonInstance, RunState } from '../state';
import { ivsOf } from '../ivs';
import {
  addCrewHook, addLeaveHook, addLoyalty, addMorale, addTaskKind, addXp, crewOf, growStat, monName, pickTrait, rankN,
  taskLevel, traitName, type TaskCtx,
} from './crew';
import { DOMINION_DATA } from './data';
import { addActionGate, addPlayEffect } from './field';
import { addClean, addFxHook, hqFx, spend } from './hqFx';
import { bandOf, levelCapOf } from './pyramid';
import { book, placeMon } from './reserve';
import type { DominionBlock, Egg, Member, School, StatId } from './schema';
import { STAT_IDS } from './schema';
import { fill, setWageOff } from './worldTurn';

const S = (): School => DOMINION_DATA.pyramid.school;
const SL = () => DOMINION_DATA.pyramid.school.lines;
const T = () => DOMINION_DATA.pyramid.trust;
const statWord = (k: StatId): string => k[0]!.toUpperCase() + k.slice(1);
const weekNight = (b: DominionBlock): boolean => b.day > 1 && (b.day - 1) % DOMINION_DATA.start.clock.weekLength === 0;

// ---------- Learn a Trade (team-actions.md 67) ----------

export const tradesOf = (m: Member): string[] => crewOf(m).flags.filter((f) => f.startsWith('trade:')).map((f) => f.slice(6));
const tradeDef = (id: string) => S().trades.find((t) => t.id === id);
const TRADE = 'learn-a-trade';

/** The trade a member learns next: the one their best stat fits (list order breaks a tie). */
export function nextTrade(m: Member): string | null {
  const known = tradesOf(m);
  const open = S().trades.filter((t) => !known.includes(t.id));
  if (!open.length) return null;
  return open.reduce((best, t) => (m.stats[t.stat] > m.stats[best.stat] ? t : best)).id;
}

/** The discounts the crew's trades give (task level 2; the blueprint at level 4 doubles it). */
addFxHook((b, out) => {
  for (const m of b.members) {
    const lv = taskLevel(m, TRADE);
    if (lv < 2) continue;
    for (const id of tradesOf(m)) {
      const t = tradeDef(id);
      if (t) out[t.perk] += t.pct * (lv >= 4 ? 2 : 1);
    }
  }
});
setWageOff((b) => hqFx(b).wageOff);

/** Learn a Trade, one day (the crew step runs it; tests call it with a fixed roll). */
export function tradeDay(b: DominionBlock, m: Member, ok: boolean, x: Pick<TaskCtx, 'say' | 'lv'>): void {
  if (!ok) {
    const n = Math.min(b.funds, S().mistake);
    if (n > 0) spend(b, n);
    return x.say('crew', fill(SL().tradeMistake!, { name: m.name, n }));
  }
  const known = tradesOf(m);
  // Level 1: the first trade; level 3: a second one.
  if (!known.length || (known.length === 1 && x.lv >= 3)) {
    const id = nextTrade(m)!;
    crewOf(m).flags.push(`trade:${id}`);
    return x.say('crew', fill(SL().tradeLearned!, { name: m.name, trade: tradeDef(id)!.name }));
  }
  x.say('crew', fill(SL().tradeStudy!, { name: m.name, trade: tradeDef(known[0]!)!.name }));
}
addTaskKind('trade', tradeDay);

/** The master craft (task level 5): once a week, the first trade's craft. */
function crafts(b: DominionBlock, lines: string[]): void {
  for (const m of b.members) {
    const id = tradesOf(m)[0];
    if (!id || taskLevel(m, TRADE) < 5 || crewOf(m).out) continue;
    const c = tradeDef(id)!.craft;
    const what: string[] = [];
    for (const [item, n] of Object.entries(c.items ?? {})) {
      b.crew!.pending.push({ k: 'item', id: item, n });
      what.push(`${n} ${item.replace(/-/g, ' ')}`);
    }
    if (c.repair) {
      for (const r of b.hq?.rooms ?? []) if (!r.ruined) r.cond = Math.min(100, r.cond + c.repair);
      what.push(`rooms repaired +${c.repair}`);
    }
    if (c.clean) {
      addClean(b, c.clean);
      what.push(`₽${c.clean} clean`);
    }
    lines.push(fill(SL().craft!, { name: m.name, what: what.join(', ') }));
  }
}

// ---------- Teach a Move (team-actions.md 69) and Move Tutor (player-actions.md 72) ----------

/** The tutor's fee for a member at this task level (level 2: 20% less). */
export const tutorFee = (lv: number): number => Math.round((S().tutorFee * (100 - (lv >= 2 ? S().tutorOff : 0))) / 100);

/** Teach a Move, one day: the fee now, the lesson when the session settles the night (it needs the content). */
export function tutorDay(b: DominionBlock, m: Member, ok: boolean, x: Pick<TaskCtx, 'say' | 'lv'>): void {
  if (!ok) return x.say('crew', fill(SL().tutorForgot!, { name: m.name }));
  const fee = tutorFee(x.lv);
  if (b.funds < fee) return x.say('money', fill(SL().tutorBroke!, { name: m.name, fee }));
  spend(b, fee);
  x.say('money', fill(SL().tutorFee!, { name: m.name, fee }));
  // Level 3: two moves; level 4: one to each of their Pokémon; level 5: an egg move first.
  b.crew!.pending.push({ k: 'move', member: m.id, n: x.lv >= 3 ? 2 : 1, team: x.lv >= 4, egg: x.lv >= 5 });
}
addTaskKind('tutor', tutorDay);

const power = (content: Content, id: string): number => content.moves.get(id)?.power ?? 0;

/** The move a Pokémon learns next: an egg move (when asked), else the strongest it can learn, one of its own types first. */
export function pickMove(content: Content, mon: PokemonInstance, opts: { egg: boolean; any: boolean }): string | null {
  const sp = getSpecies(content, mon.speciesId);
  const knows = (id: string) => mon.moves.some((m) => m.id === id);
  const rank = (ids: string[]) =>
    ids.filter((id) => content.moves.get(id)?.supported && !knows(id))
      .sort((a, x) => Number(sp.types.includes(content.moves.get(x)!.type)) - Number(sp.types.includes(content.moves.get(a)!.type)) || power(content, x) - power(content, a) || a.localeCompare(x))[0] ?? null;
  if (opts.egg) {
    const egg = rank(content.eggMoves.get(familyId(content, mon.speciesId)) ?? []);
    if (egg) return egg;
  }
  // Without tutor access: the moves it should have learned by now (a relearner); with it, every TM and tutor move too.
  const levelUp = sp.learnset.filter((e) => e.level <= mon.level).map((e) => e.move);
  return rank(opts.any ? teachableMoves(content, mon) : levelUp);
}

function teach(content: Content, mon: PokemonInstance, n: number, opts: { egg: boolean; any: boolean }): string[] {
  const got: string[] = [];
  for (let i = 0; i < n; i++) {
    const id = pickMove(content, mon, { egg: opts.egg && i === 0, any: opts.any });
    if (!id || !teachEggMove(content, mon, id, [])) break;
    got.push(content.moves.get(id)!.name);
  }
  return got;
}

/** Settles a Teach a Move lesson (session.ts, with the content). */
export function settleLesson(content: Content, b: DominionBlock, p: { member: string; n: number; team: boolean; egg: boolean }): string[] {
  const m = b.members.find((x) => x.id === p.member);
  if (!m) return [];
  const out: string[] = [];
  for (const mon of m.team) {
    const got = teach(content, mon, p.team ? 1 : p.n, { egg: p.egg, any: true });
    for (const move of got) out.push(fill(SL().tutorLearned!, { name: m.name, mon: monName(mon.speciesId), move }));
    if (got.length && !p.team) break;
  }
  return out.length ? out : [fill(SL().tutorNone!, { name: m.name })];
}

/** Move Tutor (the Boss's own team): level 1 a move it missed, level 3 any TM or tutor move, level 4 two, level 5 an egg move. */
export function bossTutor(content: Content, run: RunState, level: number): string[] {
  for (const mon of run.party) {
    const got = teach(content, mon, level >= 4 ? 2 : 1, { egg: level >= 5, any: level >= 3 });
    if (got.length) return got.map((move) => fill(SL().bossTutor!, { mon: monName(mon.speciesId), move }));
  }
  return [SL().bossTutorNone!];
}

// ---------- eggs: Egg Run (player-actions.md 63) and Breed (68) ----------

export const eggsOf = (b: DominionBlock): Egg[] => (book(b).eggs ??= []);
const teamLevel = (run: Pick<RunState, 'party'>): number => (run.party.length ? Math.round(run.party.reduce((a, m) => a + m.level, 0) / run.party.length) : 5);
const eggLevel = (b: DominionBlock, run: RunState): number => Math.max(2, Math.min(b.levelCap, teamLevel(run) - S().eggUnder));
const bst = (content: Content, id: string): number => Object.values(content.species.get(id)?.baseStats ?? {}).reduce((a, x) => a + x, 0);
const nextEggId = (b: DominionBlock): string => `egg${b.day}-${eggsOf(b).length + 1}`;

/** Egg Run: a found egg. Level 2 hatches a day sooner, 3 is a species the team knows, 4 shows it, 5 picks the best of three. */
export function eggRun(content: Content, b: DominionBlock, run: RunState, level: number, r: Rng): string {
  const eggs = eggsOf(b);
  if (eggs.length >= S().maxEggs) return fill(SL().eggFull!, { n: eggs.length });
  const region = DOMINION_DATA.start.start.region.toLowerCase();
  const wild = (DOMINION_DATA.crew.pools[region] ?? DOMINION_DATA.crew.pools.kanto!).catch;
  const held = [...run.party, ...b.members.flatMap((m) => m.team), ...book(b).box].map((m) => familyId(content, m.speciesId));
  const known = [...new Set(held)].filter((id) => content.species.has(id)).sort();
  const pool = (level >= 3 && known.length ? known : wild.map((id) => familyId(content, id))).filter((id) => content.species.has(id));
  const roll = (): string => pool[r.int(0, pool.length - 1)]!;
  const tries = Array.from({ length: level >= 5 ? S().eggPick : 1 }, roll);
  const species = tries.reduce((best, id) => (bst(content, id) > bst(content, best) ? id : best));
  const days = S().eggDays - (level >= 2 ? 1 : 0);
  const shown = level >= 4;
  eggs.push({ id: nextEggId(b), species, level: eggLevel(b, run), hatch: b.day + days, src: 'found', shown, nature: null, ivMin: 0, move: null, hidden: false });
  return fill(SL().eggFound!, { species: shown ? ` (${monName(species)})` : '', days });
}

/** Reserve Pokémon that can breed: out of the Pens. */
const breeders = (b: DominionBlock): PokemonInstance[] => book(b).box.filter((m) => (book(b).meta[m.uid]?.pens ?? 0) <= b.day);

addActionGate((b, def) => (def.id === 'breed' && breeders(b).length < 2 ? SL().noPair! : null));

/** Breed: two Reserve Pokémon (two of one family first, the most trusting pair) leave an egg of the first one's family. */
export function breed(content: Content, b: DominionBlock, run: RunState, level: number, r: Rng): string {
  const eggs = eggsOf(b);
  if (eggs.length >= S().maxEggs) return fill(SL().eggFull!, { n: eggs.length });
  const pool = breeders(b);
  if (pool.length < 2) return SL().noPair!;
  const trust = (m: PokemonInstance): number => book(b).meta[m.uid]?.trust ?? 0;
  const sorted = [...pool].sort((a, x) => trust(x) - trust(a) || a.uid.localeCompare(x.uid));
  let pair: [PokemonInstance, PokemonInstance] = [sorted[0]!, sorted[1]!];
  for (let i = 0; i < sorted.length; i++) {
    const mate = sorted.find((x, j) => j > i && familyId(content, x.speciesId) === familyId(content, sorted[i]!.speciesId));
    if (mate) {
      pair = [sorted[i]!, mate];
      break;
    }
  }
  const species = familyId(content, pair[0].speciesId);
  const sp = content.species.get(species);
  const good = sp && sp.baseStats.atk >= sp.baseStats.spa ? 'adamant' : 'modest';
  const nature = level >= 2 && r.int(1, 100) <= S().natureChance ? good : null;
  const eggMoves = content.eggMoves.get(species) ?? [];
  const move = level >= 4 ? pair.flatMap((m) => m.moves.map((x) => x.id)).find((id) => eggMoves.includes(id)) ?? null : null;
  const days = S().eggDays;
  eggs.push({
    id: nextEggId(b), species, level: eggLevel(b, run), hatch: b.day + days, src: 'bred', shown: true, nature,
    ivMin: level >= 3 ? S().ivMin : 0, move, hidden: level >= 5 && !!sp?.abilities.hidden,
  });
  return fill(SL().eggBred!, { a: monName(pair[0].speciesId), b: monName(pair[1].speciesId), species: monName(species), days });
}

// The three actions' effects (field.ts runs them when the action works, with the action's mastery level).
addPlayEffect('eggRun', (x) => [eggRun(x.content, x.b, x.run, x.level, x.rng)]);
addPlayEffect('breed', (x) => [breed(x.content, x.b, x.run, x.level, x.rng)]);
addPlayEffect('tutor', (x) => bossTutor(x.content, x.run, x.level));

/** Hatches the eggs that are due (session.ts, with the content): into the Reserve at Trust 8, shaped by how they were bred. */
export function hatchEggs(content: Content, run: RunState, b: DominionBlock): string[] {
  const eggs = eggsOf(b);
  const due = eggs.filter((e) => e.hatch <= b.day);
  if (!due.length) return [];
  book(b).eggs = eggs.filter((e) => e.hatch > b.day);
  const out: string[] = [];
  for (const e of due) {
    const shape = (mon: PokemonInstance): void => {
      if (e.nature) mon.nature = e.nature as PokemonInstance['nature'];
      if (e.ivMin) {
        const ivs = ivsOf(mon);
        mon.ivs = Object.fromEntries(Object.entries(ivs).map(([k, v]) => [k, Math.max(v, e.ivMin)]));
      }
      if (e.move) teachEggMove(content, mon, e.move, []);
      if (e.hidden) mon.abilitySlot = -1;
      mon.hp = maxHp(content, mon);
    };
    const line = placeMon(content, run, b, { species: e.species, level: e.level, src: 'hatched', shape });
    out.push(fill(SL().hatched!, { mon: monName(e.species) }));
    if (line && !line.includes('Reserve.')) out.push(line);
  }
  return out;
}

// ---------- Type Dojo (settled with the content) ----------

/** Type Dojo: every Pokémon of the type (the Boss's, the crew's under their level caps, the Reserve's) gains level x `xp` XP. */
export function settleDojo(content: Content, run: RunState, b: DominionBlock, p: { types: string[]; xp: number }): string[] {
  const fits = (mon: PokemonInstance) => getSpecies(content, mon.speciesId).types.some((t) => p.types.includes(t));
  for (const mon of run.party.filter(fits)) gainXp(content, mon, mon.level * p.xp, b.levelCap);
  for (const m of b.members) for (const mon of m.team.filter(fits)) gainXp(content, mon, mon.level * p.xp, levelCapOf(b, m));
  for (const mon of book(b).box.filter(fits)) gainXp(content, mon, mon.level * p.xp, b.levelCap);
  return [fill(SL().dojo!, { types: p.types.map((t) => t[0]!.toUpperCase() + t.slice(1)).join('/') })];
}

// ---------- the rooms' weekly work ----------

const atWork = (b: DominionBlock): Member[] => b.members.filter((m) => !crewOf(m).out);
const byLevel = (a: Member, x: Member): number => x.level - a.level || a.id.localeCompare(x.id);

/** The rooms' week (the night a new week starts, after the crew's own weekly step). Each room acts on its own. */
export function schoolWeek(b: DominionBlock, lines: string[]): void {
  const fx = hqFx(b), s = S(), L = SL();
  const crew = atWork(b);
  // Sparring Ring: the crew pair up by level, a bout per pair.
  const ring = [...crew].sort(byLevel);
  for (let i = 0; i < fx.spar && 2 * i + 1 < ring.length; i++) {
    const a = ring[2 * i]!, c = ring[2 * i + 1]!;
    addXp(a, s.sparXp, lines);
    addXp(c, s.sparXp, lines);
    lines.push(fill(L.spar!, { a: a.name, b: c.name, n: s.sparXp }));
  }
  // Stealth School: everyone's Stealth grows.
  if (fx.sneak) {
    for (const m of crew) growStat(m, 'stealth', fx.sneak, lines);
    lines.push(L.sneak!);
  }
  // Grunt Academy: Grunts (the first two bands) get a stat point on their task's stat.
  if (fx.gruntSkill) {
    for (const m of crew.filter((x) => bandOf(x.rank).n <= 2)) {
      const stat = (DOMINION_DATA.tasks.find((t) => t.id === crewOf(m).task)?.stat ?? 'brawn') as StatId;
      growStat(m, STAT_IDS.includes(stat) ? stat : 'brawn', fx.gruntSkill * 10, lines);
      lines.push(fill(L.gruntSkill!, { name: m.name, stat: statWord(stat) }));
    }
  }
  // Veteran's Corner: veterans (Veteran Grunt and up) teach the newest.
  const vet = rankN('veteran-grunt');
  const vets = crew.filter((m) => rankN(m.rank) >= vet).sort(byLevel);
  const fresh = crew.filter((m) => rankN(m.rank) < vet).sort((a, x) => -byLevel(a, x));
  for (let i = 0; i < Math.min(fx.vets, vets.length, fresh.length); i++) {
    addXp(fresh[i]!, s.vetXp, lines);
    lines.push(fill(L.vets!, { a: vets[i]!.name, b: fresh[i]!.name, n: s.vetXp }));
  }
  // Mentoring Office: an Admin (band 4 and up) with a Grunt (band 1-2).
  const admins = crew.filter((m) => bandOf(m.rank).n >= 4).sort(byLevel);
  const grunts = crew.filter((m) => bandOf(m.rank).n <= 2).sort((a, x) => -byLevel(a, x));
  for (let i = 0; i < Math.min(fx.pairs, admins.length, grunts.length); i++) {
    addXp(grunts[i]!, s.pairXp, lines);
    addLoyalty(b, grunts[i]!, s.pairLoyalty);
    lines.push(fill(L.pair!, { a: admins[i]!.name, b: grunts[i]!.name, n: s.pairXp, l: s.pairLoyalty }));
  }
  // Personality Lab: a trait shows early (the untrained first, then the longest-serving).
  const lab = b.members.filter((m) => crewOf(m).formed.length < 2).sort((a, x) => Number(x.untrained) - Number(a.untrained) || a.joinedDay - x.joinedDay || a.id.localeCompare(x.id));
  for (const m of lab.slice(0, fx.reveal)) {
    const to = pickTrait(m);
    if (!to) continue;
    const c = crewOf(m);
    c.grew = { from: c.formed.at(-1) ?? c.green, to, day: b.day };
    c.formed.push(to);
    m.untrained = false;
    lines.push(fill(L.reveal!, { name: m.name, trait: traitName(to) }));
  }
  // Therapy Room: bad traits cured; with none to cure, the unhappiest member talks it out.
  if (fx.cure) {
    let left = fx.cure;
    for (const m of b.members) {
      const c = crewOf(m);
      const bad = c.formed.find((t) => s.bad.includes(t));
      if (!bad || left < 1) continue;
      c.formed = c.formed.filter((t) => t !== bad);
      if (bad === 'resentful' && b.reserve) b.reserve.passed[m.id] = 0;
      left -= 1;
      lines.push(fill(L.cure!, { name: m.name, trait: traitName(bad) }));
    }
    if (left === fx.cure && b.members.length) {
      const sad = [...b.members].sort((a, x) => a.morale - x.morale || a.id.localeCompare(x.id))[0]!;
      addMorale(sad, s.counselMorale);
      lines.push(fill(L.counsel!, { name: sad.name, n: s.counselMorale }));
    }
  }
  // Comfort Ward: anxious Pokémon (Trust under the disobey line) calm down, the most anxious first.
  if (fx.trustCure && b.reserve) {
    const r = b.reserve;
    const anxious = Object.entries(r.meta).filter(([, x]) => x.trust < T().disobeyBelow).sort(([u, a], [v, x]) => a.trust - x.trust || u.localeCompare(v));
    for (const [uid, meta] of anxious.slice(0, fx.trustCure)) {
      meta.trust = Math.min(T().max, meta.trust + s.wardTrust);
      const mon = [...r.box, ...b.members.flatMap((m) => m.team)].find((x) => x.uid === uid);
      lines.push(fill(L.ward!, { mon: mon ? monName(mon.speciesId) : 'A Pokémon', n: meta.trust }));
    }
  }
  // Retiree Hall: the retirees it houses cheer the crew on.
  const housed = Math.min(fx.retirees, b.reserve?.retirees?.length ?? 0);
  if (housed) {
    const n = housed * s.retireeMorale;
    for (const m of b.members) addMorale(m, n);
    lines.push(fill(L.retirees!, { n }));
  }
  // Type Dojo: settled with the content (session.ts).
  for (const [type, xp] of Object.entries(fx.dojo)) b.crew!.pending.push({ k: 'dojo', types: [type], xp });
  crafts(b, lines);
}

addCrewHook((b, _seed, n) => {
  if (weekNight(b)) schoolWeek(b, n.lines);
});

/** Retiree Hall: a member who leaves on good terms (let go or seen off, long enough and loyal enough) retires there. */
addLeaveHook((b, m, why, lines) => {
  if (why !== 'let go' && why !== 'dismissed') return;
  const fx = hqFx(b);
  const r = book(b);
  const list = (r.retirees ??= []);
  if (!fx.retirees || list.length >= fx.retirees) return;
  if (b.day - m.joinedDay < S().retireMinDays || m.loyalty < S().retireMinLoyalty) return;
  list.push({ name: m.name, day: b.day });
  lines.push(fill(SL().retired!, { name: m.name }));
});
