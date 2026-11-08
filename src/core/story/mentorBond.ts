// Beta 0.5 (doc section 2, M3): the mentor/protégé relationship. Extends the Protégé system in mentorship.ts (which opens and
// closes the relationship) with: ten mentorship types and the compatibility test, chemistry and its traits, move inheritance
// outside the learnset, mentor-inspired stat drift (EVs) and mentorship events. Pure and deterministic: nothing here draws
// gameplay random numbers; everything comes from the Pokémon's histories.

import raw from '../../data/mentorship.json';
import megaMovesJson from '../../data/megaMoves.json';
import { z } from 'zod';
import type { Content } from '../contentSchema';
import { adjustBond, bondOf } from '../bond';
import { addEvs, ivsOf } from '../ivs';
import { getSpecies, maxHp } from '../pokemon';
import type { PokemonInstance, RunState } from '../state';
import { emit } from './record';
import { MENTOR_TYPES, type ChemistryTrait, type MentorBond, type MentorType, type PokemonHistory, type RelationshipRecord } from './schema';

const Num = z.number();
const CfgSchema = z.object({
  compat: z.object({ rivalLevelGap: Num, rivalBattles: Num, protectorGap: Num, protectorKnockouts: Num, survivorScore: Num, prodigyIvTotal: Num, prodigyGap: Num, sharedBosses: Num, familyGap: Num }),
  chemistry: z.object({ perWin: Num, perBoss: Num, levels: z.array(Num).length(5), traitBonus: z.record(z.string(), Num) }),
  drift: z.object({ evPerWin: Num, evPerWinHigh: Num, highChemistry: Num, cap: Num, topStats: Num, naturalMargin: Num }),
  moves: z.object({ signature: z.object({ level: Num, chemistry: Num, minPower: Num }), maxInherited: Num, tiers: z.array(z.object({ minPower: Num, level: Num, chemistry: Num })), statusLevel: Num, outsideCoverageLevel: Num }),
  events: z.object({ cooldownBattles: Num, chemistryGain: Num, chemistryLoss: Num }),
  lastResort: z.object({ hpShare: Num, pp: Num, minChemistry: Num }),
  graduation: z.object({ readyGap: Num, mutualChemistry: Num, mutualMargin: Num, rounds: Num, protegeEvReward: Num, mentorChemistryReward: Num, mutualChemistryReward: Num, mutualEvReward: Num }),
  return: z.object({ chance: Num, rareMinBosses: Num, minBattlesAfter: Num, cooldownBattles: Num, maxReturns: Num, bossMinChemistry: Num, minFoeLevelShare: Num, keep: Num }),
});
export const MENTOR_CFG = CfgSchema.parse(raw);

export const TYPE_NAMES: Record<MentorType, string> = {
  veteran: 'Veteran', rival: 'Rival', protector: 'Protector', specialist: 'Specialist', familyFigure: 'Family Figure', survivor: 'Survivor',
  formerEnemy: 'Former Enemy', prodigy: 'Prodigy', unlikelyPair: 'Unlikely Pair', sharedExperience: 'Shared Experience',
};
export const TRAIT_NAMES: Record<ChemistryTrait, string> = {
  mutualRespect: 'Mutual Respect', competitiveSpirit: 'Competitive Spirit', protectiveInstinct: 'Protective Instinct', familialBond: 'Familial Bond',
  unlikelyFriendship: 'Unlikely Friendship', professionalPartnership: 'Professional Partnership', sharedTrauma: 'Shared Trauma', heroWorship: 'Hero Worship',
  heatedRivalry: 'Heated Rivalry', quietUnderstanding: 'Quiet Understanding', teachersPride: "Teacher's Pride", growingIndependence: 'Growing Independence',
};
export const TYPE_BLURB: Record<MentorType, string> = {
  veteran: 'An experienced Pokémon teaching a younger one.', rival: 'Two Pokémon pushing each other to get stronger.', protector: 'A strong Pokémon taking charge of a weaker one.',
  specialist: 'Teaches the techniques of its own battle style.', familyFigure: 'Takes on a parent-like role.', survivor: 'Bonded by surviving hard fights.',
  formerEnemy: 'Once an enemy, now a teacher.', prodigy: 'Unusually talented, helps another reach its potential.', unlikelyPair: 'Two very different Pokémon who found a connection.',
  sharedExperience: 'Bonded by a memorable event they went through together.',
};
const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
const nm = (content: Content, m: PokemonInstance) => content.species.get(m.speciesId)?.name ?? m.speciesId;

const rootOf = (content: Content, id: string): string => {
  let cur = content.species.get(id);
  for (let i = 0; cur?.evolvesFrom && i < 6; i++) cur = content.species.get(cur.evolvesFrom) ?? cur;
  return cur?.form?.base ?? cur?.id ?? id;
};

const bestAttack = (content: Content, m: PokemonInstance): 'physical' | 'special' => {
  const b = getSpecies(content, m.speciesId).baseStats;
  return b.atk >= b.spa ? 'physical' : 'special';
};

/** Why these two might become mentor and protégé (a pair can have several reasons). Empty = no mentorship. */
export function mentorTypesFor(content: Content, run: RunState, mentor: PokemonInstance, prote: PokemonInstance, rule = content.story.mentorship): MentorType[] {
  const hm = run.story.histories[mentor.uid];
  const hp = run.story.histories[prote.uid];
  if (!hm || !hp || mentor.uid === prote.uid) return [];
  const c = MENTOR_CFG.compat;
  const ms = getSpecies(content, mentor.speciesId);
  const ps = getSpecies(content, prote.speciesId);
  const gap = mentor.level - prote.level;
  const shared = ms.types.filter((t) => ps.types.includes(t));
  const out: MentorType[] = [];
  if (!content.balance.mentorRework) return gap >= rule.levelGap && hm.battles >= rule.mentorBattles && hm.bossesBeaten >= 1 ? ['veteran'] : [];
  if (gap >= rule.levelGap && hm.battles >= rule.mentorBattles && hm.bossesBeaten >= 1) out.push('veteran');
  if (Math.abs(gap) <= c.rivalLevelGap && hm.battles >= c.rivalBattles && hp.battles >= c.rivalBattles && (shared.length > 0 || (hm.finishTrades[prote.uid] ?? 0) >= 2 || (hp.finishTrades[mentor.uid] ?? 0) >= 2)) out.push('rival');
  if (gap >= c.protectorGap && hm.knockoutsDealt >= c.protectorKnockouts && hp.knockoutsTaken >= 1) out.push('protector');
  const teachable = mentor.moves.some((s) => {
    const mv = content.moves.get(s.id);
    return !!mv && shared.includes(mv.type) && (mv.power ?? 0) >= 60 && !prote.moves.some((k) => k.id === s.id);
  });
  if (gap >= 1 && shared.length > 0 && teachable) out.push('specialist');
  if (gap >= 1 && (rootOf(content, mentor.speciesId) === rootOf(content, prote.speciesId) || (ms.evolutionStage > ps.evolutionStage && gap >= c.familyGap && ms.eggGroups.some((g) => ps.eggGroups.includes(g))))) out.push('familyFigure');
  if (hm.survivedFatal + hm.closeCalls >= c.survivorScore && hp.survivedFatal + hp.closeCalls >= 1) out.push('survivor');
  if (hm.joinedBy === 'caught' && hm.battles >= rule.mentorBattles && gap >= 1) out.push('formerEnemy');
  const ivTotal = STATS.reduce((n, s) => n + ivsOf(mentor)[s], 0);
  if (ivTotal >= c.prodigyIvTotal && gap >= c.prodigyGap) out.push('prodigy');
  if (gap >= 1 && shared.length === 0 && bestAttack(content, mentor) !== bestAttack(content, prote) && hm.battles >= 3 && hp.battles >= 1) out.push('unlikelyPair');
  if (gap >= 1 && hm.bossesBeaten >= c.sharedBosses && hp.bossesBeaten >= c.sharedBosses) out.push('sharedExperience');
  return MENTOR_TYPES.filter((t) => out.includes(t));
}

/** The chemistry trait a new pair starts with, from its first reason (deterministic). */
export function traitFor(content: Content, run: RunState, types: readonly MentorType[], mentor: PokemonInstance, prote: PokemonInstance): ChemistryTrait {
  const hm = run.story.histories[mentor.uid];
  switch (types[0]) {
    case 'veteran': return (hm?.bossesBeaten ?? 0) >= 3 ? 'teachersPride' : 'professionalPartnership';
    case 'rival': return (hm?.finishTrades[prote.uid] ?? 0) >= 2 ? 'competitiveSpirit' : 'heatedRivalry';
    case 'protector': return 'protectiveInstinct';
    case 'specialist': return 'professionalPartnership';
    case 'familyFigure': return 'familialBond';
    case 'survivor': return 'sharedTrauma';
    case 'formerEnemy': return 'mutualRespect';
    case 'prodigy': return 'heroWorship';
    case 'unlikelyPair': return 'unlikelyFriendship';
    default: return 'quietUnderstanding';
  }
}

export const bondOfRel = (run: RunState, relId: string): MentorBond | undefined => run.story.mentoring.bonds[relId];
export const bondForProtege = (run: RunState, proteUid: string): MentorBond | undefined => Object.values(run.story.mentoring.bonds).find((b) => b.proteUid === proteUid && run.story.relationships.some((r) => r.id === b.relId && r.open));
export const chemistryLevel = (chemistry: number): number => MENTOR_CFG.chemistry.levels.reduce((lvl, min, i) => (chemistry >= min ? i + 1 : lvl), 1);

/** Starts the bond record for a relationship (called when a mentorship is accepted or a returning protégé is taken in). */
export function openBond(content: Content, run: RunState, rel: RelationshipRecord, types: readonly MentorType[], mentor: PokemonInstance, prote: PokemonInstance, chemistry = 0): MentorBond {
  const t = types.length ? [...types] : (['veteran'] as MentorType[]);
  const bond: MentorBond = { relId: rel.id, mentorUid: mentor.uid, proteUid: prote.uid, types: t, trait: traitFor(content, run, t, mentor, prote), chemistry, lessons: [], drift: {}, ready: false, outcome: null, events: {}, lastEventBattle: null, battlesTogether: 0 };
  run.story.mentoring.bonds[rel.id] = bond;
  return bond;
}

/** Old saves and accepted offers made before the rework: make sure every open mentorship has a bond record. */
export function ensureBond(content: Content, run: RunState, rel: RelationshipRecord): MentorBond | undefined {
  const have = run.story.mentoring.bonds[rel.id];
  if (have) return have;
  const mentor = run.party.find((m) => m.uid === rel.a.id);
  const prote = run.party.find((m) => m.uid === rel.b.id);
  if (!mentor || !prote) return undefined;
  return openBond(content, run, rel, mentorTypesFor(content, run, mentor, prote).length ? mentorTypesFor(content, run, mentor, prote) : ['veteran'], mentor, prote, 10);
}

// ---------- chemistry and stat drift ----------

/** Mentor-inspired stat development: EVs drift toward the mentor's strongest stats, gradually, never past the cap. */
export function applyDrift(content: Content, bond: MentorBond, mentor: PokemonInstance, prote: PokemonInstance): Record<string, number> {
  const d = MENTOR_CFG.drift;
  const used = Object.values(bond.drift).reduce((n, v) => n + v, 0);
  if (used >= d.cap) return {};
  const mb = getSpecies(content, mentor.speciesId).baseStats;
  const pb = getSpecies(content, prote.speciesId).baseStats;
  const budget = Math.min(d.cap - used, bond.chemistry >= d.highChemistry ? d.evPerWinHigh : d.evPerWin);
  // The mentor's top stats that the protégé is not already naturally much better at.
  const targets = [...STATS].sort((a, b) => mb[b] - mb[a]).filter((s) => pb[s] * d.naturalMargin < mb[s]).slice(0, d.topStats);
  const gained: Record<string, number> = {};
  if (targets.length === 0) return gained;
  let left = budget;
  for (const [i, s] of targets.entries()) {
    const share = i === targets.length - 1 ? left : Math.ceil(budget / targets.length);
    const got = addEvs(content, prote, s, Math.min(share, left));
    if (got > 0) {
      gained[s] = got;
      bond.drift[s] = (bond.drift[s] ?? 0) + got;
      left -= got;
    }
  }
  return gained;
}

/** After a won battle: every open mentorship whose pair both stand in the party gains chemistry and drift. Returns lines for the log. */
export function mentorshipsAfterBattle(content: Content, run: RunState, boss: boolean): string[] {
  const lines: string[] = [];
  if (!content.balance.mentorRework) return lines;
  const index = run.encountersCompleted;
  for (const rel of run.story.relationships) {
    if (!rel.open || rel.kind !== 'mentorship') continue;
    const bond = ensureBond(content, run, rel);
    const mentor = run.party.find((m) => m.uid === rel.a.id);
    const prote = run.party.find((m) => m.uid === rel.b.id);
    if (!bond || !mentor || !prote || mentor.hp <= 0 || prote.hp <= 0) continue;
    const before = chemistryLevel(bond.chemistry);
    const gain = (boss ? MENTOR_CFG.chemistry.perBoss : MENTOR_CFG.chemistry.perWin) + (MENTOR_CFG.chemistry.traitBonus[bond.trait] ?? 0);
    bond.chemistry = Math.min(100, bond.chemistry + gain);
    bond.battlesTogether += 1;
    adjustBond(bondOf(run, prote.uid), { trust: 1 });
    applyDrift(content, bond, mentor, prote);
    const lvl = chemistryLevel(bond.chemistry);
    if (lvl > before) lines.push(`${nm(content, prote)} and ${nm(content, mentor)} grew closer (${TRAIT_NAMES[bond.trait]}, level ${lvl}).`);
    const ev = runMentorEvent(content, run, rel, bond, mentor, prote, index);
    if (ev) lines.push(ev);
  }
  return lines;
}

// ---------- mentorship events ----------

interface MentorEventDef { id: string; once: boolean; delta: number; text: (m: string, p: string) => string; when: (c: EventCtx) => boolean }
interface EventCtx { content: Content; run: RunState; bond: MentorBond; mentor: PokemonInstance; prote: PokemonInstance; hm: PokemonHistory; hp: PokemonHistory; index: number }

const MENTOR_EVENTS: MentorEventDef[] = [
  { id: 'refuse-giveup', once: false, delta: 3, text: (m, p) => `${m} would not let ${p} give up.`, when: (c) => c.prote.hp > 0 && c.prote.hp <= Math.max(1, Math.floor(0.25 * statHp(c))) && c.hp.lowHpStreak >= 1 },
  { id: 'imitate', once: true, delta: 2, text: (m, p) => `${p} tried to copy ${m}'s signature move.`, when: (c) => c.prote.moves.some((s) => c.mentor.moves.some((k) => k.id === s.id) && (c.hp.moves[s.id] ?? 0) >= 2) },
  { id: 'disappointed', once: false, delta: -MENTOR_CFG.events.chemistryLoss, text: (m, p) => `${m} was disappointed that ${p} keeps avoiding hard battles.`, when: (c) => c.hp.lastBattle !== null && c.index - c.hp.lastBattle >= 4 },
  { id: 'surprise', once: true, delta: 3, text: (m, p) => `${p} surprised ${m} with an unexpectedly powerful move.`, when: (c) => c.hp.knockoutsDealt >= 5 && c.hp.knockoutsDealt >= c.hm.knockoutsDealt && c.prote.level < c.mentor.level },
  { id: 'recognizes', once: true, delta: 2, text: (m, p) => `${m} saw that ${p} has become stronger.`, when: (c) => c.mentor.level - c.prote.level <= c.content.story.mentorship.graduateGap + 4 },
  { id: 'disagree', once: false, delta: 0, text: (m, p) => `${m} and ${p} disagreed over strategy.`, when: (c) => c.bond.battlesTogether >= 4 && c.bond.chemistry < 30 && ['unlikelyFriendship', 'heatedRivalry', 'competitiveSpirit'].includes(c.bond.trait) },
  { id: 'protected', once: false, delta: 2, text: (m, p) => `${m} stood in front of ${p} against a much stronger opponent.`, when: (c) => (c.run.battle?.enemyTeam ?? []).some((e) => e.level >= c.prote.level + 8) && c.mentor.hp > 0 && c.prote.hp > 0 },
  { id: 'wont-leave', once: true, delta: 2, text: (m, p) => `${p} refused to leave ${m} behind.`, when: (c) => c.run.box.some((b) => b.uid === c.mentor.uid) },
];
const statHp = (c: EventCtx) => maxHp(c.content, c.prote);

/** At most one event per pair per cooldown. Returns the line, or null. */
function runMentorEvent(content: Content, run: RunState, rel: RelationshipRecord, bond: MentorBond, mentor: PokemonInstance, prote: PokemonInstance, index: number): string | null {
  const hm = run.story.histories[mentor.uid];
  const hp = run.story.histories[prote.uid];
  if (!hm || !hp) return null;
  if (bond.lastEventBattle !== null && index - bond.lastEventBattle < MENTOR_CFG.events.cooldownBattles) return null;
  const ctx: EventCtx = { content, run, bond, mentor, prote, hm, hp, index };
  const def = MENTOR_EVENTS.find((e) => (!e.once || !bond.events[e.id]) && e.when(ctx));
  if (!def) return null;
  bond.events[def.id] = (bond.events[def.id] ?? 0) + 1;
  bond.lastEventBattle = index;
  bond.chemistry = Math.max(0, Math.min(100, bond.chemistry + def.delta));
  const text = def.text(nm(content, mentor), nm(content, prote));
  emit(content, run, 'storyMoment', { actors: [mentor.uid, prote.uid], data: { def: `mentor-${def.id}`, suppressed: false }, importance: 60, text, emotions: ['kindness'] });
  void rel;
  return text;
}

// ---------- move inheritance outside the learnset ----------

export interface InheritableMove { moveId: string; reason: string; needLevel: number; needChemistry: number; allowed: boolean; why: string | null; signature?: boolean }

/**
 * Signature-inspired techniques (doc 2.2): a Mega signature move itself never transfers (it only exists while Mega Evolved), but a
 * mentor whose species has one can pass on an echo of it: the strongest ordinary move of the same type and category that the
 * mentor's species can learn, a little weaker than the signature move. Returns [signature move, echo move] pairs, or [].
 */
export function signatureEchoes(content: Content, mentor: PokemonInstance): { signature: string; echo: string }[] {
  const ms = getSpecies(content, mentor.speciesId);
  const base = ms.form?.base ?? ms.id;
  const pool = new Set([...(content.learnables.get(ms.id) ?? (ms.form ? content.learnables.get(ms.form.base) : undefined) ?? []), ...ms.learnset.map((e) => e.move)]);
  const out: { signature: string; echo: string }[] = [];
  for (const [formId, sigId] of Object.entries(megaMovesJson.byForm as Record<string, string>)) {
    const form = content.species.get(formId);
    const sig = content.moves.get(sigId);
    if (!form || !sig || (form.form?.base ?? form.id) !== base || sig.power === null) continue;
    const echo = [...pool]
      .map((id) => content.moves.get(id))
      .filter((m): m is NonNullable<typeof m> => !!m && m.supported === true && m.type === sig.type && m.category === sig.category && !m.flags.some((f) => ['zmove', 'max', 'megasig', 'storysig', 'jetform'].includes(f)) && (m.power ?? 0) >= MENTOR_CFG.moves.signature.minPower && (m.power ?? 0) < (sig.power ?? 0))
      .sort((a, b) => (b.power ?? 0) - (a.power ?? 0) || a.id.localeCompare(b.id))[0];
    if (echo) out.push({ signature: sigId, echo: echo.id });
  }
  return out;
}

/** The moves this mentor could hand down, with the rule that allows or blocks each (mentors teach only moves they know). */
export function inheritableMoves(content: Content, run: RunState, bond: MentorBond): InheritableMove[] {
  const mentor = run.party.find((m) => m.uid === bond.mentorUid);
  const prote = run.party.find((m) => m.uid === bond.proteUid);
  if (!mentor || !prote) return [];
  const cfg = MENTOR_CFG.moves;
  const lvl = chemistryLevel(bond.chemistry);
  const ps = getSpecies(content, prote.speciesId);
  const ms = getSpecies(content, mentor.speciesId);
  const total = Object.values(run.story.mentoring.bonds).filter((b) => b.proteUid === prote.uid).reduce((n, b) => n + b.lessons.length, 0);
  const out: InheritableMove[] = [];
  for (const slot of mentor.moves) {
    if (slot.hyper || slot.lent || slot.megaSig || slot.storySig) continue;
    const mv = content.moves.get(slot.id);
    if (!mv || mv.supported !== true || mv.flags.some((f) => ['zmove', 'max', 'megasig', 'storysig', 'jetform'].includes(f))) continue;
    if (prote.moves.some((k) => k.id === mv.id)) continue;
    const tier = mv.category === 'status' ? { level: cfg.statusLevel, chemistry: 0 } : cfg.tiers.find((t) => (mv.power ?? 0) >= t.minPower) ?? { level: 1, chemistry: 0 };
    const sameCoverage = ps.types.includes(mv.type) || (mv.category !== 'status' && mv.category === bestAttack(content, prote));
    const needLevel = Math.max(tier.level, sameCoverage || bond.types.some((t) => ['specialist', 'familyFigure', 'unlikelyPair'].includes(t)) ? 1 : cfg.outsideCoverageLevel);
    const reason = ms.types.includes(mv.type) ? `${nm(content, mentor)}'s own ${mv.type}-type technique` : `part of ${nm(content, mentor)}'s battle style`;
    let why: string | null = null;
    if (bond.lessons.length >= cfg.maxInherited || total >= cfg.maxInherited) why = 'No room for more mentor moves';
    else if (lvl < needLevel) why = `Needs mentorship level ${needLevel}`;
    else if (bond.chemistry < tier.chemistry) why = `Needs ${tier.chemistry} chemistry`;
    out.push({ moveId: mv.id, reason, needLevel, needChemistry: tier.chemistry, allowed: why === null, why });
  }
  // The signature-inspired echo (one per protégé, mentorship level 5 and high chemistry).
  if (!bond.events.echo) {
    const sigCfg = cfg.signature;
    for (const { signature, echo } of signatureEchoes(content, mentor)) {
      if (prote.moves.some((k) => k.id === echo) || out.some((o) => o.moveId === echo)) continue;
      let why: string | null = null;
      if (bond.lessons.length >= cfg.maxInherited || total >= cfg.maxInherited) why = 'No room for more mentor moves';
      else if (lvl < sigCfg.level) why = `Needs mentorship level ${sigCfg.level}`;
      else if (bond.chemistry < sigCfg.chemistry) why = `Needs ${sigCfg.chemistry} chemistry`;
      out.push({ moveId: echo, reason: `an echo of ${content.moves.get(signature)?.name ?? signature}, ${nm(content, mentor)}'s signature technique`, needLevel: sigCfg.level, needChemistry: sigCfg.chemistry, allowed: why === null, why, signature: true });
      break;
    }
  }
  return out.sort((a, b) => Number(b.allowed) - Number(a.allowed) || a.moveId.localeCompare(b.moveId));
}

/** Hands a move down (replacing the protégé's weakest move when it knows four). Returns the message. */
export function teachInherited(content: Content, run: RunState, relId: string, moveId: string): string {
  const bond = run.story.mentoring.bonds[relId];
  if (!bond) throw new Error('No such mentorship.');
  const opt = inheritableMoves(content, run, bond).find((o) => o.moveId === moveId);
  if (!opt || !opt.allowed) throw new Error(opt?.why ?? 'That move cannot be handed down.');
  const mentor = run.party.find((m) => m.uid === bond.mentorUid)!;
  const prote = run.party.find((m) => m.uid === bond.proteUid)!;
  const move = content.moves.get(moveId)!;
  const slot = { id: moveId, pp: move.pp };
  let forgot: string | null = null;
  if (prote.moves.length < 4) prote.moves.push(slot);
  else {
    const weakest = prote.moves.reduce((w, m) => ((content.moves.get(m.id)?.power ?? 0) < (content.moves.get(w.id)?.power ?? 0) ? m : w));
    forgot = weakest.id;
    prote.moves[prote.moves.indexOf(weakest)] = slot;
  }
  bond.lessons.push(moveId);
  if (opt.signature) bond.events.echo = 1;
  adjustBond(bondOf(run, prote.uid), { trust: 3, respect: 2 });
  return `${nm(content, mentor)} taught ${nm(content, prote)} ${move.name}${forgot ? ` (it forgot ${content.moves.get(forgot)?.name ?? forgot})` : ''}.`;
}
