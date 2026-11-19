// DOMINION slice D22: spies on the crew (CLAUDE_API_DRAFT.md §5.3 C; mockup a6/k6). A rival team's spies (D9's
// `rivals.teams[x].spies`, a count) become real members of the crew: the World Turn picks who was bought (a Greedy
// member is easy to turn, a Loyal one never), and each night a mole may leave a clue that raises their Suspicion.
// Innocent members leave red herrings from the same pool, so a clue alone proves nothing. At Suspicion 40+ the Boss can
// Confront them in the back room: quick questions (or typed ones) bring out tells; the truth was fixed when the mole was
// picked, and the ending (confess, double agent, run, battle) is rolled by the rules from pressure, a bribe, Loyalty and
// the member's traits. Rotom only voices the member's reply to a typed line (spyScreens.ts / the controller), never the result.
// Streams: `dominion-spy` (who is picked, clues), `dominion-spy-talk` (tells, replies), `dominion-spy-end` (the ending).
// Pure; the block is changed in place by the World Turn step and copied by the actions.

import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import { DOMINION_DATA } from './data';
import { DominionBlockSchema, SPY_ENDS, type DominionBlock, type Member, type SpiesState, type SpyTurn } from './schema';
import { addWorldStep, fill } from './worldTurn';
import { addActEffect, addActionGate, addFightSettler } from './field';
import { addLoyalty, addMorale, crewOf, freshCrewState, leave, rankN } from './crew';
import { hqFx, spend } from './hqFx';
import { learnPlan, rivalsOf, teamDef, teamsHere, withRivals } from './rivals';
import { sheet, voice } from './personality';

const SP = () => DOMINION_DATA.spies;
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)));
const rngOf = (seed: string, ...key: (string | number)[]): Rng => new Rng(hashSeed([seed, ...key].join('::')));

export type SpyEnd = (typeof SPY_ENDS)[number];
export type SpyOut = { ok: boolean; block: DominionBlock; notice: string | null; fight?: boolean };

export const freshSpies = (): SpiesState => ({ moles: [], sus: {}, quiet: {}, clues: [], talk: null, done: [] });
export function spiesOf(b: DominionBlock): SpiesState {
  return b.spies ?? freshSpies();
}
export function withSpies<T extends DominionBlock>(b: T): T & { spies: SpiesState } {
  b.spies ??= freshSpies();
  return b as T & { spies: SpiesState };
}

// ---------- lookups ----------

const traitsOf = (m: Member): string[] => {
  const card = crewOf(m).card;
  return card ? sheet(card).traits.map((t) => t.id) : [];
};
const spyFx = (m: Member): string[] => {
  const card = crewOf(m).card;
  return card ? sheet(card).traits.flatMap((t) => t.effects.map((e) => e.spy).filter((x): x is NonNullable<typeof x> => !!x)) : [];
};
export const suspicion = (b: DominionBlock, id: string): number => spiesOf(b).sus[id] ?? 0;
/** The member's live mole record (bought and not yet turned or found), or null. */
const moleOf = (b: DominionBlock, id: string) => spiesOf(b).moles.find((x) => x.member === id) ?? null;
export const isMole = (b: DominionBlock, id: string): boolean => {
  const x = moleOf(b, id);
  return !!x && !x.turned;
};
export const isDouble = (b: DominionBlock, id: string): boolean => !!moleOf(b, id)?.turned;
const teamName = (id: string): string => teamDef(id)?.name ?? 'The rival team';
const firstTeam = (): string => teamsHere()[0]?.id ?? 'rocket';

/** Pronouns for the ending labels ("she names her contact"). */
export function pron(m: Pick<Member, 'gender'>): Record<string, string> {
  const f = m.gender === 'f';
  return { they: f ? 'she' : 'he', They: f ? 'She' : 'He', their: f ? 'her' : 'his', s: 's' };
}

/** How much a rival would want this member as a mole (0: never). */
export function pickWeight(b: DominionBlock, m: Member): number {
  const P = SP().pick;
  if (spyFx(m).includes('noBribe')) return 0;
  let w = P.base;
  for (const t of traitsOf(m)) {
    if (P.traits[t] === 0) return 0;
    w += P.traits[t] ?? 0;
  }
  if (m.loyalty < P.lowLoyaltyBelow) w += P.lowLoyalty;
  if (b.day - m.joinedDay < P.newDays) w += P.newMember;
  return w;
}

const eligible = (b: DominionBlock): Member[] => {
  const s = spiesOf(b);
  const mine = new Set(rivalsOf(b).mySpies.map((x) => x.member));
  return b.members.filter((m) => !crewOf(m).out && !mine.has(m.id) && !s.moles.some((x) => x.member === m.id) && pickWeight(b, m) > 0);
};

// ---------- the World Turn step (after the rivals) ----------

/**
 * Keeps the moles in step with each rival team's spy count: new spies buy a member; a spy found by a counter-spy
 * (D9's tasks and actions take the count down) leaves the most suspected mole exposed at Suspicion 100. Changes `b`.
 */
export function syncMoles(b: DominionBlock, seed: string, out: string[]): void {
  const s = withSpies(b).spies;
  const ids = new Set(b.members.map((m) => m.id));
  s.moles = s.moles.filter((x) => ids.has(x.member));
  for (const k of Object.keys(s.sus)) if (!ids.has(k)) delete s.sus[k];
  for (const k of Object.keys(s.quiet)) if (!ids.has(k)) delete s.quiet[k];
  const r = rngOf(seed, 'dominion-spy', b.day, 'pick');
  for (const [team, t] of Object.entries(rivalsOf(b).teams)) {
    const live = s.moles.filter((x) => x.team === team && !x.turned && !x.exposed);
    // Found by a counter-spy: the most suspected is exposed (they stop reporting; confront them to settle it).
    for (const x of [...live].sort((p, q) => (s.sus[q.member] ?? 0) - (s.sus[p.member] ?? 0)).slice(0, Math.max(0, live.length - t.spies))) {
      x.exposed = true;
      s.sus[x.member] = SP().clues.exposed;
      const m = b.members.find((y) => y.id === x.member)!;
      out.push(fill(SP().lines.exposed!, { name: m.name, n: SP().clues.exposed }));
    }
    for (let need = t.spies - live.length; need > 0; need--) {
      const pool = eligible(b);
      if (!pool.length) break;
      const total = pool.reduce((a, m) => a + pickWeight(b, m), 0);
      let roll = r.int(1, total);
      const m = pool.find((x) => (roll -= pickWeight(b, x)) <= 0) ?? pool[0]!;
      s.moles.push({ member: m.id, team, day: b.day, turned: false, exposed: false });
      out.push(fill(SP().lines.mole!, { team: teamName(team) }));
    }
  }
}

function clueText(b: DominionBlock, r: Rng, team: string): string {
  const T = teamDef(team);
  const site = T?.sites[r.int(0, T.sites.length - 1)];
  const districts = Object.keys(b.field.districts);
  const district = DOMINION_DATA.field.districts.find((d) => d.id === (site?.district ?? districts[0]))?.name ?? 'the city';
  return fill(SP().pool[r.int(0, SP().pool.length - 1)]!, { team: T?.name ?? 'the rivals', site: site?.name ?? 'docks', district });
}

function addClue(b: DominionBlock, m: Member, text: string, gain: number, out: string[]): void {
  const s = withSpies(b).spies;
  s.sus[m.id] = clamp((s.sus[m.id] ?? 0) + gain);
  s.quiet[m.id] = 0;
  s.clues.push({ member: m.id, day: b.day, text });
  if (s.clues.length > SP().clues.keep) s.clues = s.clues.slice(-SP().clues.keep);
  const n = s.sus[m.id]!;
  out.push(fill(SP().lines.clue!, { name: m.name, clue: text, n }));
  const crew = (b.crew ??= freshCrewState());
  if (n >= SP().suspicion.confrontAt) crew.alerts.push({ kind: 'crew', time: '6:00', text: fill(SP().lines.high!, { name: m.name, n }) });
}

/** The spies' World Turn step: moles picked or exposed, clues and red herrings, Gossips leaking, double agents lying. */
export function spyStep(block: DominionBlock, seed: string): string[] {
  const b = withSpies(withRivals(block));
  const out: string[] = [];
  syncMoles(b, seed, out);
  const s = b.spies, C = SP().clues, S = SP().suspicion;
  const r = rngOf(seed, 'dominion-spy', b.day, 'night');
  const spyRoom = hqFx(b).spyCatch > 0;
  const live = s.moles.filter((x) => !x.turned && !x.exposed);
  for (const m of b.members) {
    if (crewOf(m).out) continue;
    const mole = live.find((x) => x.member === m.id);
    const before = s.sus[m.id] ?? 0;
    if (mole) {
      if (r.int(1, 100) <= C.moleChance) addClue(b, m, clueText(b, r, mole.team), r.int(C.moleGain[0], C.moleGain[1]) + (spyRoom ? C.securityGain : 0), out);
    } else if (!isDouble(b, m.id) && r.int(1, 100) <= C.herringChance) {
      addClue(b, m, clueText(b, r, firstTeam()), r.int(C.herringGain[0], C.herringGain[1]), out);
    }
    // Suspicion cools when nothing new comes up for a few nights.
    if ((s.sus[m.id] ?? 0) === before) {
      s.quiet[m.id] = (s.quiet[m.id] ?? 0) + 1;
      if (before > 0 && s.quiet[m.id]! > S.coolAfter && !mole && !moleOf(b, m.id)?.exposed) s.sus[m.id] = clamp(before - S.coolPerNight);
    }
  }
  // Gossips (personality trait) tell the moles more: +intel to each team with a live mole in the crew.
  const teams = [...new Set(live.map((x) => x.team))];
  for (const m of b.members) {
    if (!spyFx(m).includes('leak') || crewOf(m).out) continue;
    for (const team of teams) {
      const t = rivalsOf(b).teams[team];
      if (!t || live.some((x) => x.member === m.id)) continue;
      t.intel = clamp(t.intel + C.gossipIntel);
      out.push(fill(SP().lines.gossip!, { name: m.name, team: teamName(team), n: C.gossipIntel }));
    }
  }
  // Double agents feed their old team fake plans: their intel on you falls.
  for (const x of s.moles.filter((y) => y.turned)) {
    const t = rivalsOf(b).teams[x.team];
    const m = b.members.find((y) => y.id === x.member);
    if (!t || !m || crewOf(m).out || !t.intel) continue;
    const n = Math.min(t.intel, SP().effects.doubleIntel);
    t.intel = clamp(t.intel - n);
    out.push(fill(SP().lines.double!, { name: m.name, team: teamName(x.team), n }));
  }
  return out;
}

// ---------- the Confront talk ----------

const no = (block: DominionBlock, notice: string | null): SpyOut => ({ ok: false, block, notice });
const questionDef = (id: string) => SP().questions.find((q) => q.id === id);

/** Whether the member can be confronted now; the reason when not. */
export function cantConfront(b: DominionBlock, memberId: string): string | null {
  const m = b.members.find((x) => x.id === memberId);
  const L = SP().lines;
  if (!m) return L.noRoom!;
  if (isDouble(b, m.id)) return fill(L.turned!, { name: m.name });
  if (crewOf(m).out) return fill(L.busy!, { name: m.name });
  if (suspicion(b, m.id) < SP().suspicion.confrontAt) return fill(L.noTalk!, { n: SP().suspicion.confrontAt });
  if (spiesOf(b).done.some((d) => d.day === b.day)) return L.oneADay!;
  return null;
}

export function startConfront(block: DominionBlock, memberId: string): SpyOut {
  const why = cantConfront(block, memberId);
  if (spiesOf(block).talk?.member === memberId) return { ok: true, block, notice: null };
  if (why) return no(block, why);
  const b = withSpies(structuredClone(block));
  b.spies.talk = { member: memberId, day: b.day, turns: [], pressure: 0, bribed: false };
  return { ok: true, block: b, notice: null };
}

/** The member's offline reply and tell for this turn of the talk (rules and the talk stream only). */
export function talkRoll(b: DominionBlock, seed: string, memberId: string, q: string, turn: number): { reply: string; tell: SpyTurn['tell'] } {
  const def = questionDef(q) ?? questionDef('typed')!;
  const m = b.members.find((x) => x.id === memberId)!;
  const mole = !!moleOf(b, memberId) && !isDouble(b, memberId);
  const r = rngOf(seed, 'dominion-spy-talk', memberId, b.day, turn);
  const bank = mole ? def.lines.mole : def.lines.innocent;
  const line = bank[r.int(0, bank.length - 1)]!;
  const card = crewOf(m).card;
  const sh = card ? sheet(card) : null;
  const clue = [...spiesOf(b).clues].reverse().find((c) => c.member === memberId)?.text ?? 'the rumours';
  const team = moleOf(b, memberId)?.team ?? firstTeam();
  const text = fill(line, { clue, town: sh?.home ?? 'Viridian City', want: sh?.want ?? 'a quiet life', fear: sh?.fear ?? 'Gyarados', team: teamName(team) });
  const reply = sh ? voice(sh.quirk, text) : text;
  const chance = mole ? def.tellMole : def.tellInnocent;
  const tells = mole ? (['nervous', 'contradiction', 'rehearsed'] as const) : SP().innocentTells;
  const tell = r.int(1, 100) <= chance ? tells[r.int(0, tells.length - 1)]! : null;
  return { reply, tell };
}
/** Typed text kept in the save: printable, one line, clamped. */
export function cleanTyped(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, SP().talk.typedMax);
}

export function askSpy(block: DominionBlock, q: string, seed: string, text?: string): SpyOut {
  const talk = spiesOf(block).talk;
  const def = questionDef(q);
  const L = SP().lines;
  if (!talk || !def) return no(block, null);
  if (talk.turns.length >= SP().talk.turns) return no(block, L.noTurns!);
  const said = q === 'typed' ? cleanTyped(text ?? '') : null;
  if (q === 'typed' && !said) return no(block, null);
  if (q === 'bribe' && talk.bribed) return no(block, L.bribedOnce!);
  if (q === 'bribe' && block.funds < SP().talk.bribe) return no(block, fill(L.noMoney!, { n: SP().talk.bribe }));
  const b = withSpies(structuredClone(block));
  const t = b.spies.talk!;
  const m = b.members.find((x) => x.id === t.member);
  if (!m) return no(block, null);
  if (q === 'bribe') {
    spend(b, SP().talk.bribe);
    t.bribed = true;
  }
  if (q === 'threaten') addLoyalty(b, m, SP().talk.threatLoyalty);
  const roll = talkRoll(b, seed, m.id, q, t.turns.length);
  t.turns.push({ q, said, reply: roll.reply, tell: roll.tell });
  t.pressure += def.pressure;
  return { ok: true, block: b, notice: null };
}

/** Ending weights for a mole (the rules' pick; the talk only adds pressure and the bribe). */
export function endWeights(b: DominionBlock, m: Member): Record<SpyEnd, number> {
  const E = SP().ends;
  const w: Record<SpyEnd, number> = { confess: E.confess.weight, double: E.double.weight, run: E.run.weight, battle: E.battle.weight };
  const talk = spiesOf(b).talk;
  for (const id of traitsOf(m)) for (const [k, n] of Object.entries(SP().traitEnds[id] ?? {})) w[k as SpyEnd] += n;
  w.confess += Math.floor(((talk?.pressure ?? 0) * SP().pressureConfess) / 10) + Math.floor((m.loyalty * SP().loyalConfess) / 10);
  if (talk?.bribed) w.double += SP().bribeDouble * (spyFx(m).includes('bribe') ? 2 : 1);
  // No Pokémon, no battle: they run instead.
  if (!m.team.length) (w.run += Math.max(0, w.battle), (w.battle = 0));
  for (const k of SPY_ENDS) w[k] = Math.max(0, w[k]);
  return w;
}

/** Accuse: an innocent member is cleared (and hurt); a mole's ending is rolled. A battle leaves `field.fight` waiting. */
export function accuse(block: DominionBlock, seed: string): SpyOut {
  const talk = spiesOf(block).talk;
  if (!talk) return no(block, null);
  const b = withSpies(withRivals(structuredClone(block)));
  const m = b.members.find((x) => x.id === talk.member);
  if (!m) return (b.spies.talk = null), { ok: true, block: b, notice: null };
  const s = b.spies, L = SP().lines, F = SP().effects;
  const x = moleOf(b, m.id);
  const done = (end: SpiesState['done'][number]['end']): void => {
    s.done.push({ member: m.id, name: m.name, day: b.day, end });
    s.talk = null;
  };
  if (!x || x.turned) {
    const W = SP().wrong;
    addLoyalty(b, m, W.loyalty);
    addMorale(m, W.morale);
    for (const o of b.members) if (o.id !== m.id) addMorale(o, W.crewMorale);
    s.sus[m.id] = 0;
    s.quiet[m.id] = 0;
    crewOf(m).memory.push({ day: b.day, line: 'The Boss called me a spy.' });
    done('cleared');
    return { ok: true, block: b, notice: fill(L.cleared!, { name: m.name, loyalty: W.loyalty, morale: W.morale, crew: W.crewMorale }) };
  }
  const w = endWeights(b, m);
  const total = SPY_ENDS.reduce((a, k) => a + w[k], 0);
  const r = rngOf(seed, 'dominion-spy-end', m.id, b.day);
  let roll = r.int(1, Math.max(1, total));
  const end = SPY_ENDS.find((k) => (roll -= w[k]) <= 0) ?? 'confess';
  const t = rivalsOf(b).teams[x.team];
  const v = { name: m.name, team: teamName(x.team) };
  const less = (): void => void (t && !x.exposed && (t.spies = Math.max(0, t.spies - 1)));
  let notice = fill(SP().ends[end].line, v);
  let fight = false;
  if (end === 'confess') {
    less();
    if (t) t.intel = clamp(t.intel - F.confessIntel);
    learnPlan(b, x.team);
    addLoyalty(b, m, F.confessLoyalty);
    s.moles = s.moles.filter((y) => y !== x);
    s.sus[m.id] = 0;
  } else if (end === 'double') {
    less();
    x.turned = true;
    x.exposed = false;
    s.sus[m.id] = 0;
    if (!rivalsOf(b).mySpies.some((y) => y.member === m.id)) b.rivals!.mySpies.push({ member: m.id, team: x.team, day: b.day });
  } else if (end === 'run') {
    runAway(b, m, x.team);
  } else {
    b.field.fight = { why: 'spy', foe: 'member', begun: false, action: 'spy', target: m.id, district: DOMINION_DATA.field.hq, pass: false, big: false, wager: 0, racket: x.team };
    fight = true;
    notice = fill(SP().ends.battle.line, v);
  }
  done(end);
  return { ok: true, block: DominionBlockSchema.parse(b), notice, fight };
}

/** The mole gets away: a member gone, and their team knows more. */
function runAway(b: DominionBlock, m: Member, team: string): void {
  const s = withSpies(b).spies;
  const x = moleOf(b, m.id);
  const t = rivalsOf(b).teams[team];
  if (t) {
    if (x && !x.exposed) t.spies = Math.max(0, t.spies - 1);
    t.intel = clamp(t.intel + SP().effects.runIntel);
  }
  s.moles = s.moles.filter((y) => y.member !== m.id);
  delete s.sus[m.id];
  delete s.quiet[m.id];
  rivalsOf(b).mySpies = rivalsOf(b).mySpies.filter((y) => y.member !== m.id);
  leave(b, m, 'spy', null, '');
}

/** Let it go: the talk ends with nothing settled, and Suspicion falls a little. */
export function dropTalk(block: DominionBlock): SpyOut {
  const talk = spiesOf(block).talk;
  if (!talk) return no(block, null);
  const b = withSpies(structuredClone(block));
  const m = b.members.find((x) => x.id === talk.member);
  const n = -SP().drop.suspicion;
  if (m) {
    b.spies.sus[m.id] = clamp((b.spies.sus[m.id] ?? 0) - n);
    b.spies.done.push({ member: m.id, name: m.name, day: b.day, end: 'dropped' });
  }
  b.spies.talk = null;
  return { ok: true, block: b, notice: m ? fill(SP().lines.dropped!, { name: m.name, n }) : null };
}

/** The spy's battle (fightEnd.ts -> field.settle -> here). Win: thrown out. Lose (or flee): they get away. */
addFightSettler('spy', (_content, block, _run: RunState, fight, outcome) => {
  const b = withSpies(withRivals(block));
  const m = b.members.find((x) => x.id === fight.target);
  const team = fight.racket ?? firstTeam();
  const v = { name: m?.name ?? 'The spy', team: teamName(team) };
  if (!m) return [];
  if (outcome === 'win') {
    const x = moleOf(b, m.id);
    const t = rivalsOf(b).teams[team];
    if (t && x && !x.exposed) t.spies = Math.max(0, t.spies - 1);
    b.spies.moles = b.spies.moles.filter((y) => y.member !== m.id);
    delete b.spies.sus[m.id];
    const hq = b.field.districts[DOMINION_DATA.field.hq];
    if (hq) hq.dread += SP().effects.battleDread;
    leave(b, m, 'spy', null, '');
    return [fill(SP().lines.battleWon!, v)];
  }
  runAway(b, m, team);
  return [fill(SP().lines.battleLost!, v)];
});

// ---------- Plant a Mole (Boss action 54, moved here from D5/D9) ----------

/** Who you'd send in: a member of rank 2+ (Recruit or above), free, not already inside a rival team, not a rival's mole. Best Charm + Stealth. */
export function moleCandidate(b: DominionBlock): Member | null {
  const inside = new Set(rivalsOf(b).mySpies.map((x) => x.member));
  const ok = b.members.filter((m) => rankN(m.rank) >= 2 && !crewOf(m).out && !inside.has(m.id) && !isMole(b, m.id));
  return ok.sort((p, q) => q.stats.charm + q.stats.stealth - (p.stats.charm + p.stats.stealth) || p.id.localeCompare(q.id))[0] ?? null;
}
addActionGate((b, def) => (def.id === 'plant-a-mole' && !moleCandidate(b) ? SP().lines.noMole! : null));
addActEffect('plantMole', (b, x) => {
  const m = moleCandidate(b);
  const team = firstTeam();
  if (!m) return [];
  withRivals(b).rivals.mySpies.push({ member: m.id, team, day: b.day });
  // A big success puts them close to the top at once: this week's plan is read tonight.
  if (x.big) learnPlan(b, team);
  return [fill(SP().lines.planted!, { name: m.name, team: teamName(team) }) + (x.big ? ` ${SP().lines.plantedBig!}` : '')];
});

// Third in the World Turn order, after the rival team's own step (this module imports rivals.ts, so it registers after).
addWorldStep('rivals', spyStep);
