// DOMINION slice D23: snatch and interrogation (Claude API draft §5.3 D; Rotom mockup a7, round 4 #k7).
// The Snatch Operation is action 58, Interrogate: it starts with a battle against the person you take (an enemy Grunt,
// a Gym Trainer, a company higher-up or a rival Admin; never a Gym Leader, never anyone flagged a minor). Win and they
// go to the Holding Cell, where the questioning starts: pick a Goal (Info or Extortion), then up to six lines. Each line
// is an approach (threat, bribe, bluff, empathy, logic) and a strength (0-3); the captive's personality card turns it
// into Resolve damage and moves the Fear/Trust needle. Resolve falling past a threshold unlocks the Goal's next prize,
// a real effect on the run (a place scouted, a Gym scouted, the rival team hit, money, silence, a site). Then Release,
// Recruit (a Charm check) or Ransom, or keep them in the cell. Talk only, as in the games: no violence is shown.
// Every captive raises Heat each night and the risk of a police check (which opens a D24 questioning); a captive can
// escape unless a member guards them (task 136, Hold a Prisoner). Action 113, Hostage Trade, swaps a captive for a
// member a rival team holds, or sells them back. Building 66, the Interrogation Cell, makes every line hit harder.
//
// Rotom may judge a typed line and voice the captive's reply; the judge arrives inside the action, is checked here and
// the rules decide the rest. Rolls are on this slice's own streams: `dominion-snatch::<n>::<line>` (a line's noise),
// `dominion-snatch::<n>::end` (the ending), `dominion-snatch-night::<day>::<n>` (escape), `dominion-snatch-check::<day>`.
// Who is taken at a place is picked without a roll (the day and the count), so the Card can show them first.

import type { Content } from '../contentSchema';
import { wrapPlayerText } from '../ai/rules';
import { hashSeed, Rng } from '../rng';
import { newMon } from '../run';
import type { RunState } from '../state';
import { addTaskKind, crewOf, freshCrew, withCrew } from './crew';
import { DOMINION_DATA } from './data';
import {
  actionDef, addActEffect, addCardGate, addCardHook, addFightSettler, addHeat, districtDef, foeLevel, masteryLevel, setSnatchFoe, syncHeat, targetDef, wanted,
} from './field';
import { growthOf } from './growth';
import { hasRoom, hqFx, spend, working } from './hqFx';
import { cardPrompt, rollCard, sheet, voice } from './personality';
import { addCaseEvidence, openQ } from './police';
import { addTension, teamsHere } from './rivals';
import {
  APPROACHES, SnatchJudgeSchema, type Approach, type Captive, type CaptiveKind, type DominionBlock, type FieldFight, type Member, type PrizeDef, type SnatchEnd,
  type SnatchGoal, type SnatchJudge, type SnatchSay, type SnatchState, type STurn,
} from './schema';
import { addWorldStep, fill } from './worldTurn';

const D = () => DOMINION_DATA.snatch;
const L = (k: string): string => D().lines[k] ?? k;
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)));
const rngOf = (seed: string, ...key: (string | number)[]): Rng => new Rng(hashSeed([seed, ...key].join('::')));
const dName = (id: string): string => districtDef(id)?.name ?? id;
const money = (n: number): string => n.toLocaleString('en-US');

export const freshSnatch = (): SnatchState => ({ n: 0, pending: null, cell: [], room: null, last: null });
/** The block's captives, filled in place for an older block. */
export function snatchOf(b: DominionBlock): SnatchState {
  return (b.snatch ??= freshSnatch());
}
/** The captive being questioned now. */
export const inRoom = (b: DominionBlock): Captive | null => {
  const s = b.snatch;
  return s && s.room !== null ? s.cell.find((c) => c.n === s.room) ?? null : null;
};

// ---------- who can be taken ----------

/** How many the Holding Cell holds (each working Holding Cell: `perTier` × its tier). */
export function cellCap(b: DominionBlock): number {
  return (b.hq?.rooms ?? []).filter((r) => r.id === 'holding-cell' && working(r)).reduce((a, r) => a + D().held.perTier * r.tier, 0);
}

/** Who you'd take at a place (no card yet: that is rolled when they are taken). Never a Leader, never a minor. */
export interface Candidate { kind: CaptiveKind; name: string; title: string; cls: string; sprite: string; species: string[]; offset: number; team: string | null; gym: string | null; traits: [string, string] | null; ransom: [number, number]; payer: string }

const isMinor = (cls: string): boolean => D().minorClasses.includes(cls);

export function candidate(b: DominionBlock, targetId: string | null, districtId: string): Candidate | null {
  const td = targetDef(targetId);
  const t = td && td.district.id === districtId ? td.target : null;
  if (!t) return null;
  const k = (b.day + (b.snatch?.n ?? 0)) >>> 0;
  const K = D().kinds;
  const team = teamsHere()[0] ?? null;
  // A Gym's trainers (never the Leader, never a child).
  if (t.kind === 'gym') {
    const gym = DOMINION_DATA.growth.gyms.find((g) => g.district === districtId);
    const pool = (gym?.trainers ?? []).filter((x) => !x.leaderId && !isMinor(x.cls));
    if (!gym || !pool.length) return null;
    const x = pool[k % pool.length]!;
    return { kind: 'gymTrainer', name: x.name, title: `${gym.leader}'s Gym`, cls: x.cls, sprite: D().classSprites[x.cls] ?? D().defaultSprite, species: x.species, offset: K.gymTrainer.offset + x.offset, team: null, gym: gym.id, traits: null, ransom: K.gymTrainer.ransom, payer: `${gym.leader}'s Gym` };
  }
  // A rival Admin at their front.
  if (team && D().adminAt.includes(t.id) && team.admins.length) {
    const a = team.admins[k % team.admins.length]!;
    return { kind: 'admin', name: a.name, title: `${team.name} Admin`, cls: 'gym-leader', sprite: D().adminSprite, species: a.species, offset: K.admin.offset, team: team.id, gym: null, traits: null, ransom: K.admin.ransom, payer: team.name };
  }
  // A company higher-up (a fixed sheet).
  const tpl = D().captives.find((c) => c.at === t.id);
  if (tpl) {
    if (tpl.minor || isMinor(tpl.cls)) return null;
    return { kind: 'exec', name: tpl.name, title: tpl.title, cls: tpl.cls, sprite: tpl.sprite, species: tpl.species, offset: K.exec.offset + tpl.offset, team: null, gym: null, traits: tpl.traits, ransom: tpl.ransom, payer: tpl.payer };
  }
  // A rival Grunt where their team has a stake.
  const ds = b.field.districts[districtId];
  if (team && D().gruntAt.includes(t.kind) && ((ds?.rival ?? 0) > 0 || team.sites.some((x) => x.district === districtId))) {
    const nm = D().gruntNames[k % D().gruntNames.length]!;
    const sp = team.grunt.species;
    return { kind: 'grunt', name: `${team.grunt.name} ${nm}`, title: `${team.name} Grunt`, cls: 'veteran', sprite: D().gruntSprite, species: [sp[k % sp.length]!, sp[(k + 1) % sp.length]!], offset: K.grunt.offset, team: team.id, gym: null, traits: null, ransom: K.grunt.ransom, payer: team.name };
  }
  return null;
}

function take(b: DominionBlock, seed: string, c: Candidate, target: string | null, district: string): Captive {
  const s = snatchOf(b);
  s.n += 1;
  const rolled = rollCard(seed, c.name);
  const card = c.traits && !('canon' in rolled) ? { ...rolled, t: [c.traits[0], c.traits[1]] as [string, string] } : rolled;
  const start = D().kinds[c.kind].resolve;
  const r = rngOf(seed, 'dominion-snatch', s.n);
  const ransom = Math.round(r.int(c.ransom[0], Math.max(c.ransom[0], c.ransom[1])) / 100) * 100;
  return {
    n: s.n, kind: c.kind, name: c.name, title: c.title, cls: c.cls, sprite: c.sprite, species: c.species, offset: c.offset,
    team: c.team, gym: c.gym, target, district, card, ransom, payer: c.payer, resolve: start, start, needle: 0, goal: null, got: 0,
    phase: 'goal', turns: [], said: 0, day: b.day, nights: 0,
  };
}

// ---------- the Card (actions 58 and 113) ----------

addCardHook((b, _run, c) => {
  if (c.def.id === 'interrogate') {
    const held = snatchOf(b).cell[0];
    if (held) c.note = fill(L('noteHeld'), { name: held.name, resolve: held.resolve });
    else {
      const who = candidate(b, c.target?.id ?? null, c.district.id);
      if (who) c.note = fill(L('note'), { name: who.name, title: who.title });
    }
  }
});
addCardGate((b, run, c) => {
  if (c.def.id === 'interrogate') {
    const s = snatchOf(b);
    if (!cellCap(b)) return L('noCell');
    if (s.cell.length) return null;
    if (!candidate(b, c.target?.id ?? null, c.district.id)) return L('nobody');
    if (!run.party.some((m) => m.hp > 0)) return DOMINION_DATA.field.lines.noTeam ?? 'No one can battle.';
  }
  if (c.def.id === 'hostage-trade' && !snatchOf(b).cell.length) return L('noHostage');
  return null;
});

/** Interrogate: question who's in the cell, or start the Snatch Operation's battle. */
addActEffect('snatch', (b, x) => {
  const s = snatchOf(b);
  const held = s.cell[0];
  if (held) {
    held.turns = [];
    held.phase = held.goal ? 'talk' : 'goal';
    s.room = held.n;
    return [fill(L('opened'), { name: held.name })];
  }
  const who = candidate(b, x.target, x.district);
  if (!who) return [L('nobody')];
  const c = take(b, x.run?.seed ?? '', who, x.target, x.district);
  s.pending = c;
  b.field.fight = { why: 'snatch', foe: 'snatch', begun: false, action: 'interrogate', target: x.target, district: x.district, pass: true, big: x.big, wager: 0, racket: null } as FieldFight;
  return [fill(L('move'), { name: c.name, place: targetDef(x.target)?.target.name ?? dName(x.district) })];
});

/** The side for the snatch battle (fight.ts builds it). */
export function snatchSide(b: DominionBlock, run: Pick<RunState, 'party'>): { name: string; classId: string; species: string[]; level: number } | null {
  const c = b.snatch?.pending;
  return c ? { name: c.name, classId: c.cls, species: c.species, level: foeLevel(b, run, c.offset) } : null;
}
setSnatchFoe((b, run) => {
  const s = snatchSide(b, run);
  return s ? { name: s.name, species: s.species[0]!, level: s.level, wild: false } : { name: 'A guard', species: 'rattata', level: 5, wild: false };
});

addFightSettler('snatch', (_content, b, run, fight, outcome) => {
  const s = snatchOf(b), c = s.pending;
  s.pending = null;
  if (!c) return [];
  if (outcome === 'win') {
    s.cell.push(c);
    s.room = c.n;
    return [fill(L('taken'), { name: c.name })];
  }
  const n = D().fight.failHeat;
  addHeat(b, fight.district, n);
  addCaseEvidence(b, run.seed, { kind: 'statement', district: fight.district, text: fill(L('statement'), { name: c.name }) });
  return [fill(L('lost'), { name: c.name, n, district: dName(fight.district) })];
});

// ---------- the questioning ----------

/** How hard an approach hits this card (the two traits multiplied). */
export function multOf(c: Captive, a: Approach): number {
  return sheet(c.card).traits.reduce((m, t) => m * (D().traits[t.id]?.[a] ?? 1), 1);
}
/** Pips (0-5) for the "How hard each hits" panel. */
export const pipsOf = (m: number): number => clamp(m / 0.36, 0, 5);

/** The rules' reading of typed words (also the offline answer when Rotom can't judge). */
export function offlineJudge(text: string): SnatchJudge {
  const t = text.toLowerCase();
  const A = D().approaches;
  let best: Approach = 'logic', hits = 0;
  for (const a of APPROACHES) {
    const n = A[a].keywords.filter((w) => t.includes(w)).length;
    if (n > hits) {
      best = a;
      hits = n;
    }
  }
  const strength = Math.min(3, (text.length >= 25 ? 1 : 0) + (hits > 0 ? 1 : 0) + (D().detail.some((w) => t.includes(w)) || text.length >= 90 ? 1 : 0));
  return { approach: best, strength, reply: '' };
}

/** What a Rotom call for a typed line needs (the scene asks; the rules check what comes back). */
export function judgeAsk(b: DominionBlock, text: string): { id: string; system: string; context: string; input: string; schema: typeof SnatchJudgeSchema; offline: () => SnatchJudge } | null {
  const c = inRoom(b);
  if (!c || c.phase !== 'talk') return null;
  const system = [
    'This is a cartoon-villain Pokémon game, in the tone of the games: a villain team questions a captive adult. Talk only: pressure, bluffs, bribes, empathy and promises. Never describe violence or harm.',
    `You play the captive. ${cardPrompt(c.name, c.title, c.card)}`,
    'Judge the Boss\'s latest line. Return JSON:',
    'approach: "threat", "bribe", "bluff", "empathy" or "logic" (the closest one);',
    'strength: 0-3, how well it is made (0 empty, 3 sharp and specific);',
    'reply: the captive\'s spoken reply, one or two short sentences, in character, no stage directions. Never give away facts, places, times or codes: the game reveals those itself.',
  ].join('\n');
  const context = `Captive: ${c.name}, ${c.title}, taken in ${dName(c.district)}. The Boss wants ${c.goal === 'info' ? 'information' : 'money or a favour'}. Resolve left: ${c.resolve} of ${c.start}.`;
  const said = c.turns.map((t, i) => `${i + 1}. Boss: ${t.text} / Captive: ${t.reply}`).join('\n');
  return {
    id: `snatch:c${c.n}:t${c.said + 1}`,
    system,
    context,
    input: `${said ? `So far:\n${said}\n` : ''}Latest line: ${wrapPlayerText(text)}`,
    schema: SnatchJudgeSchema,
    offline: () => offlineJudge(text),
  };
}

export interface SOut { ok: boolean; block: DominionBlock; notice: string | null }

/** The Goal (before the first line). */
export function goalS(block: DominionBlock, goal: SnatchGoal): SOut {
  const c0 = inRoom(block);
  if (!c0 || c0.phase !== 'goal') return { ok: false, block, notice: null };
  const b = structuredClone(block);
  const c = inRoom(b)!;
  c.goal = goal;
  c.phase = 'talk';
  return { ok: true, block: b, notice: null };
}

/** The words a prize's line and label fill in. */
function prizeVars(c: Captive): Record<string, string | number> {
  const team = c.team ? teamsHere().find((t) => t.id === c.team) : undefined;
  const gym = c.gym ? DOMINION_DATA.growth.gyms.find((g) => g.id === c.gym) : undefined;
  return {
    name: c.name, team: team?.name ?? 'Their team', boss: team?.boss.name ?? 'the Boss', district: dName(c.district),
    place: targetDef(c.target)?.target.name ?? dName(c.district), gym: gym ? `${dName(gym.district)} Gym` : 'the Gym', leader: gym?.leader ?? 'the Leader', payer: c.payer,
  };
}
export const prizesOf = (c: Captive, goal: SnatchGoal): PrizeDef[] => D().kinds[c.kind][goal];
export const prizeLabel = (c: Captive, p: PrizeDef): string => fill(p.label, { ...prizeVars(c), n: money(p.n ?? 0) });

/** One prize's effect on the run. Mutates `b`. */
function applyPrize(b: DominionBlock, c: Captive, p: PrizeDef): void {
  const f = b.field, n = p.n ?? 0;
  const ds = f.districts[c.district];
  const days = DOMINION_DATA.field.odds.scoutDays;
  switch (p.fx) {
    case 'scout': {
      const t = targetDef(c.target)?.target ?? districtDef(c.district)?.targets[0];
      if (t) {
        f.scouted[t.id] = b.day + days;
        if (!f.counted.includes(t.id)) f.counted.push(t.id);
      }
      break;
    }
    case 'scoutDistrict':
      for (const t of districtDef(c.district)?.targets ?? []) f.scouted[t.id] = b.day + days;
      break;
    case 'gymScout': {
      const gym = c.gym ?? DOMINION_DATA.growth.gyms.find((g) => g.district === c.district)?.id;
      if (gym) {
        const g = growthOf(b);
        g.gymScout[gym] = (g.gymScout[gym] ?? 0) + 1;
      }
      break;
    }
    case 'rivalHit':
      if (ds) ds.rival = clamp(ds.rival - n);
      if (c.team) addTension(b, c.team, D().adminTension);
      break;
    case 'cash':
      b.funds += n;
      b.earned += n;
      break;
    case 'silence': {
      if (ds) ds.heat = clamp(ds.heat - n);
      const p2 = b.police;
      if (p2) {
        const i = p2.evidence.map((e) => e.district).lastIndexOf(c.district);
        if (i >= 0) p2.evidence.splice(i, 1);
      }
      syncHeat(b);
      break;
    }
    case 'site':
      if (ds) ds.control = clamp(ds.control + n);
      break;
  }
}

/** % more each line hits: the Interrogation Cell and Interrogate's mastery. */
export function bonusPct(b: DominionBlock): number {
  const def = actionDef('interrogate');
  const lv = def ? masteryLevel(b.field.mastery[def.id] ?? 0) : 1;
  return hqFx(b).talk + (lv - 1) * D().hit.masteryPct;
}

/** One line in the room. Mutates a copy. */
export function sayS(block: DominionBlock, a: { kind: SnatchSay; text?: string; judge?: SnatchJudge; rotom?: boolean }, seed: string): SOut {
  const no = (notice: string | null): SOut => ({ ok: false, block, notice });
  const c0 = inRoom(block);
  if (!c0) return no(null);
  if (c0.phase === 'goal') return no(L('noGoal'));
  if (c0.phase !== 'talk') return no(null);
  const A = D().approaches, H = D().hit;
  const text = a.kind === 'typed' ? (a.text ?? '').trim().slice(0, H.maxText) : '';
  if (a.kind === 'typed' && !text) return no(null);
  let judge: SnatchJudge;
  let rotom = false;
  if (a.kind === 'typed') {
    const got = a.judge ? SnatchJudgeSchema.safeParse(a.judge) : null;
    if (got?.success) {
      judge = { ...got.data, reply: got.data.reply.trim().slice(0, H.maxReply) };
      rotom = !!a.rotom && !!judge.reply;
    } else judge = offlineJudge(text);
  } else judge = { approach: a.kind, strength: D().quick, reply: '' };
  const ap = judge.approach;
  const cost = A[ap].cost ?? 0;
  // A quick bribe needs the money on the table; a typed one with empty pockets is only a promise (half as strong).
  if (cost && block.funds < cost) {
    if (a.kind !== 'typed') return no(fill(L('noMoney'), { cost }));
    judge = { ...judge, strength: Math.floor(judge.strength / 2) };
  }
  const b = structuredClone(block);
  const c = inRoom(b)!;
  if (cost && b.funds >= cost) spend(b, cost);
  const vars = { ...prizeVars(c), cost };
  const said = a.kind === 'typed' ? text : fill(A[ap].quick, vars);
  const r = rngOf(seed, 'dominion-snatch', c.n, c.said + 1);
  const noise = r.int(-H.noise, H.noise);
  const m = multOf(c, ap);
  let k = 1 + bonusPct(b) / 100;
  const fearSide = ap === 'threat' || ap === 'bluff';
  if ((fearSide && c.needle <= -H.needleAt) || (!fearSide && c.needle >= H.needleAt)) k += H.needlePct / 100;
  if (c.turns.at(-1)?.approach === ap) k *= H.repeatPct / 100;
  let hit = judge.strength > 0 ? Math.round(judge.strength * H.per * m * k) + noise : 0;
  const dug = judge.strength > 0 && m * 100 < H.digBelow;
  if (dug) hit = -H.dig;
  hit = Math.max(-H.dig, hit);
  const before = c.resolve;
  c.resolve = clamp(c.resolve - hit);
  const fear = Math.round((A[ap].fear * Math.max(1, judge.strength)) / 2);
  c.needle = clamp(c.needle + fear, -100, 100);
  // Prizes: each threshold passed unlocks the Goal's next one, at once.
  const prizes = prizesOf(c, c.goal!);
  let prize: PrizeDef | null = null;
  while (c.got < 3 && c.resolve <= Math.floor(c.start * D().unlock[c.got]!)) {
    prize = prizes[c.got]!;
    applyPrize(b, c, prize);
    c.got += 1;
  }
  const sh = sheet(c.card);
  const lost = before - c.resolve;
  const line = prize ? fill(prize.say, { ...vars, n: money(prize.n ?? 0) }) : dug ? L('replyDig') : lost >= 15 ? L('replyBig') : lost > 0 ? L('replySome') : L('replyNone');
  const reply = rotom && !prize ? judge.reply : voice(sh.quirk, line);
  c.said += 1;
  const turn: STurn = { kind: a.kind, text: said.slice(0, 200), approach: ap, strength: judge.strength, hit: before - c.resolve, fear, reply: reply.slice(0, 400), rotom, prize: prize ? prizeLabel(c, prize) : null };
  c.turns.push(turn);
  if (c.turns.length >= D().turns || c.resolve <= 0) c.phase = 'end';
  syncHeat(b);
  return { ok: true, block: b, notice: null };
}

/** Esc: no more questions (the endings come up). */
export function stopS(block: DominionBlock): SOut {
  const c0 = inRoom(block);
  if (!c0 || c0.phase === 'end') return { ok: false, block, notice: null };
  const b = structuredClone(block);
  inRoom(b)!.phase = 'end';
  return { ok: true, block: b, notice: null };
}

// ---------- the endings ----------

/** The Charm check to recruit them (%). */
export function recruitOdds(b: DominionBlock, c: Captive): number {
  const R = D().recruit;
  const def = actionDef('interrogate');
  const lv = def ? masteryLevel(b.field.mastery[def.id] ?? 0) : 1;
  const broken = (c.start - c.resolve) / c.start;
  return clamp(R.base + b.field.edge.stats.charm * R.charmPer + broken * R.brokenPer + Math.max(0, c.needle) * R.trustPer / 10 + D().kinds[c.kind].recruit + (lv >= 5 ? R.masteryLv5 : 0), 0, 95);
}
/** The chance a released captive goes to the police (fear keeps them quiet). */
export const talkOdds = (c: Captive): number => clamp(D().release.talk - Math.max(0, -c.needle) / D().release.fearCut, 0, 100);
/** Today's chance of a police check at the HQ for the captives held (shown on the room). */
export function checkRisk(b: DominionBlock, extra = 0): number {
  const H = D().held, n = (b.snatch?.cell.length ?? 0) + extra;
  return n ? clamp(H.checkBase + H.checkPer * n + wanted(b.field) * H.checkHeatPer) : 0;
}

function freeCaptive(b: DominionBlock, c: Captive): void {
  const s = snatchOf(b);
  s.cell = s.cell.filter((x) => x.n !== c.n);
  if (s.room === c.n) s.room = null;
}
const hq = (): string => DOMINION_DATA.field.hq;

/** Let them go: Heat, and they may go to the police. Returns the line. */
function release(b: DominionBlock, c: Captive, r: Rng, line = 'released'): string {
  const R = D().release;
  addHeat(b, c.district, R.heat);
  const out = [fill(L(line), { name: c.name, n: R.heat, odds: recruitOdds(b, c) })];
  if (r.int(1, 100) <= talkOdds(c)) {
    addHeat(b, hq(), R.talkHeat);
    addCaseEvidence(b, '', { kind: 'statement', district: hq(), text: fill(L('statement'), { name: c.name }) });
    out.push(fill(L('talked'), { name: c.name, n: R.talkHeat }));
  }
  return out.join(' ');
}

/** The ending (1 Release, 2 Recruit, 3 Ransom; Esc keeps them in the cell). Mutates `run` (its block, a new member's Pokémon). */
export function endS(content: Content, run: RunState, how: SnatchEnd, seed: string): { ok: boolean; notice: string | null } {
  const b = run.expansion!.dominion!;
  const c = inRoom(b);
  if (!c) return { ok: false, notice: null };
  if (c.phase !== 'end' && how !== 'keep') return { ok: false, notice: L('noRoom') };
  const r = rngOf(seed, 'dominion-snatch', c.n, 'end');
  let line: string;
  const s = snatchOf(b);
  switch (how) {
    case 'keep':
      c.phase = 'end';
      s.room = null;
      line = fill(L('kept'), { name: c.name });
      break;
    case 'release':
      freeCaptive(b, c);
      line = release(b, c, r);
      break;
    case 'recruit': {
      freeCaptive(b, c);
      const odds = recruitOdds(b, c);
      if (b.members.length >= b.rosterCap) line = release(b, c, r, 'full');
      else if (r.int(1, 100) <= odds) {
        join(content, run, b, c);
        line = fill(L('recruited'), { name: c.name });
      } else line = release(b, c, r, 'refused');
      break;
    }
    case 'ransom': {
      freeCaptive(b, c);
      b.funds += c.ransom;
      b.earned += c.ransom;
      const Rn = D().ransom;
      if (c.team) {
        addTension(b, c.team, Rn.tension);
        line = fill(L('ransomTeam'), { team: teamsHere().find((t) => t.id === c.team)?.name ?? c.payer, n: money(c.ransom), name: c.name, t: Rn.tension });
      } else {
        addHeat(b, c.district, Rn.heat);
        line = fill(L('ransomed'), { payer: c.payer, n: money(c.ransom), name: c.name, heat: Rn.heat });
      }
      break;
    }
  }
  s.last = line;
  syncHeat(b);
  return { ok: true, notice: line };
}

/** A recruited captive joins as a member with their own Pokémon and their card. Mutates `b` and `run`. */
function join(content: Content, run: RunState, b: DominionBlock, c: Captive): void {
  withCrew(b);
  const C = DOMINION_DATA.crew;
  const rankId = c.kind === 'grunt' ? 'grunt' : c.kind === 'admin' ? 'admin' : 'sergeant';
  const rank = C.ranks.find((x) => x.id === rankId) ?? C.ranks[0]!;
  const green = C.greens[0]!;
  const sp = c.species.find((x) => content.species.has(x));
  const lv = Math.max(1, Math.min(b.levelCap, foeLevel(b, run, c.offset)));
  const m: Member = {
    id: `m${b.crew!.next++}`, name: c.name, rank: rank.id, gender: 'm', look: c.kind === 'grunt' ? 'dominion/c-rook0.png' : `dominion/${c.sprite}.png`, level: Math.min(30, rank.level),
    stats: { brawn: 5, nerve: 5, wits: 6, charm: 6, stealth: 5 }, loyalty: 40, morale: 40, traitPoints: 1, untrained: false, wage: rank.wage,
    team: sp ? [newMon(content, run, sp, lv, 'p')] : [], joinedDay: b.day, unpaid: 0,
    crew: { ...freshCrew(green.id, green.temperaments[0]!, 'guard-hq', b.day), cls: c.title, card: c.card },
  };
  crewOf(m);
  b.members.push(m);
}

// ---------- Hostage Trade (action 113) ----------

addActEffect('hostage', (b) => {
  const s = snatchOf(b);
  const c = s.cell[0];
  if (!c) return [L('noHostage')];
  freeCaptive(b, c);
  const Rn = D().ransom;
  const rv = b.rivals;
  const held = c.team && rv ? rv.held.find((h) => h.team === c.team) : undefined;
  const m = held ? b.members.find((x) => x.id === held.member) : undefined;
  if (rv && held && m) {
    rv.held = rv.held.filter((h) => h !== held);
    if (crewOf(m).out?.why === 'held') m.crew = { ...crewOf(m), out: null };
    return [fill(L('tradeMember'), { name: c.name, member: m.name })];
  }
  const n = Math.round((c.ransom * Rn.tradePct) / 100 / 100) * 100;
  b.funds += n;
  b.earned += n;
  if (c.team) {
    addTension(b, c.team, Rn.tradeTension);
    return [fill(L('tradeCash'), { team: teamsHere().find((t) => t.id === c.team)?.name ?? c.payer, n: money(n), name: c.name, t: Rn.tradeTension })];
  }
  return [fill(L('tradePayer'), { payer: c.payer, n: money(n), name: c.name })];
});

// ---------- the night: Heat, escapes, the guard, the police check ----------

/** Tonight's guard (task 136, Hold a Prisoner), read by the police step. */
const guards = new WeakMap<DominionBlock, { name: string; lv: number }>();
addTaskKind('captive', (b, m, ok, ctx) => {
  const c = b.snatch?.cell[0];
  if (!c || !ok) return;
  guards.set(b, { name: m.name, lv: ctx.lv });
  if (ctx.lv >= D().held.guardLv) {
    const n = D().held.guardHit;
    c.resolve = clamp(c.resolve - n);
    if (ctx.lv >= 5) c.needle = clamp(c.needle + 10, -100, 100);
    ctx.say('crew', fill(L('guardHit'), { member: m.name, name: c.name, n }));
  } else ctx.say('crew', fill(L('guarded'), { member: m.name, name: c.name }));
});

addWorldStep('police', (b, seed) => {
  const s = b.snatch;
  if (!s?.cell.length) return [];
  const H = D().held;
  const lines: string[] = [];
  const guard = guards.get(b);
  guards.delete(b);
  for (const c of [...s.cell]) {
    c.nights += 1;
    addHeat(b, hq(), H.heatNight);
    lines.push(fill(L('nightHeat'), { n: H.heatNight, name: c.name }));
    const r = rngOf(seed, 'dominion-snatch-night', b.day, c.n);
    if (!guard && r.int(1, 100) <= H.escapeBase + H.escapeNight * c.nights) {
      freeCaptive(b, c);
      addHeat(b, hq(), D().release.talkHeat);
      addCaseEvidence(b, seed, { kind: 'statement', district: hq(), text: fill(L('statement'), { name: c.name }) });
      lines.push(fill(L('escaped'), { name: c.name }));
    }
  }
  syncHeat(b);
  if (s.cell.length && !b.police?.q) {
    const r = rngOf(seed, 'dominion-snatch-check', b.day);
    if (r.int(1, 100) <= checkRisk(b)) {
      const names = s.cell.map((c) => c.name).join(' and ');
      s.cell = [];
      s.room = null;
      addHeat(b, hq(), H.checkHeat);
      syncHeat(b);
      lines.push(fill(L('found'), { name: names }));
      openQ(b, seed, 'boss', 'raid', hq(), { kind: 'report', district: hq(), text: fill(L('foundEv'), { name: names }) });
    }
  }
  return lines;
});

/** Whether the Interrogation Cell stands (the room's line on the Holding Cell panel). */
export const hasCell = (b: DominionBlock): boolean => hasRoom(b, 'interrogation-cell');
