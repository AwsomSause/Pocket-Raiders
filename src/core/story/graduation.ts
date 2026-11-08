// Beta 0.5 (doc section 2.5, M4): outgrowing your mentor. When a protégé has caught up, the pair can hold a private,
// simulated sparring match from the camp menu. Nothing is risked: no HP, PP or knockout carries over. The result is
// worked out from the two Pokémon's real stats and moves with a roll from a stream derived from the run seed and the pair,
// so it never touches the run's own streams. Outcomes: the protégé wins, the mentor wins, or (with great chemistry and a
// close match) mutual respect.

import type { Content } from '../contentSchema';
import { typeEffectiveness } from '../battle/damage';
import { adjustBond, bondOf } from '../bond';
import { addEvs } from '../ivs';
import { calcStats, getSpecies } from '../pokemon';
import { Rng, hashSeed } from '../rng';
import type { PokemonInstance, RunState } from '../state';
import { MENTOR_CFG, TRAIT_NAMES, bondOfRel, inheritableMoves } from './mentorBond';
import { closeRelationship, emit, openRelationship } from './record';
import type { MentorBond, MentorType } from './schema';

const nm = (content: Content, m: PokemonInstance) => content.species.get(m.speciesId)?.name ?? m.speciesId;

function bestHit(content: Content, a: PokemonInstance, d: PokemonInstance): number {
  const sa = calcStats(content, a);
  const sd = calcStats(content, d);
  const as = getSpecies(content, a.speciesId);
  const ds = getSpecies(content, d.speciesId);
  let best = 0;
  for (const slot of a.moves) {
    const mv = content.moves.get(slot.id);
    if (!mv || !mv.power || mv.supported !== true) continue;
    const phys = mv.category === 'physical';
    const atk = phys ? sa.atk : sa.spa;
    const def = phys ? sd.def : sd.spd;
    const base = ((2 * a.level) / 5 + 2) * mv.power * (atk / Math.max(1, def)) / 50 + 2;
    const stab = as.types.includes(mv.type) ? 1.5 : 1;
    best = Math.max(best, base * stab * typeEffectiveness(content.typeChart, mv.type, ds.types));
  }
  return Math.max(1, best);
}

export interface SparResult { outcome: 'protege' | 'mentor' | 'mutual'; mentorShare: number; proteShare: number }

/** The simulated match: a few rounds of each side's best attack. Pure; HP and PP are never touched. */
export function simulateSpar(content: Content, run: RunState, bond: MentorBond): SparResult {
  const mentor = run.party.find((m) => m.uid === bond.mentorUid)!;
  const prote = run.party.find((m) => m.uid === bond.proteUid)!;
  const rng = new Rng(hashSeed(`${run.seed}::spar::${bond.relId}::${bond.events.spar ?? 0}`));
  const g = MENTOR_CFG.graduation;
  const sm = calcStats(content, mentor);
  const sp = calcStats(content, prote);
  const hm = sm.hp;
  const hp = sp.hp;
  let mHp = hm;
  let pHp = hp;
  const mHit = bestHit(content, mentor, prote);
  const pHit = bestHit(content, prote, mentor);
  for (let r = 0; r < g.rounds && mHp > 0 && pHp > 0; r++) {
    const order = sp.spe > sm.spe ? ['p', 'm'] : sp.spe < sm.spe ? ['m', 'p'] : rng.chance(0.5) ? ['p', 'm'] : ['m', 'p'];
    for (const who of order) {
      if (mHp <= 0 || pHp <= 0) break;
      const roll = 0.85 + rng.float() * 0.15;
      if (who === 'p') mHp -= pHit * roll;
      else pHp -= mHit * roll;
    }
  }
  const mentorShare = Math.max(0, mHp) / hm;
  const proteShare = Math.max(0, pHp) / hp;
  const close = Math.abs(mentorShare - proteShare) <= g.mutualMargin;
  const outcome = bond.chemistry >= g.mutualChemistry && close ? 'mutual' : proteShare > mentorShare ? 'protege' : 'mentor';
  return { outcome, mentorShare, proteShare };
}

const MUTUAL_STAT: Record<MentorType, 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe'> = {
  veteran: 'hp', rival: 'spe', protector: 'def', specialist: 'atk', familyFigure: 'hp', survivor: 'spd', formerEnemy: 'atk', prodigy: 'spa', unlikelyPair: 'spe', sharedExperience: 'hp',
};

/** Pairs whose protégé has caught up and may hold the graduation spar. */
export function sparReady(run: RunState): MentorBond[] {
  return Object.values(run.story.mentoring.bonds).filter((b) => b.ready && b.outcome === null && run.story.relationships.some((r) => r.id === b.relId && r.open) && run.party.some((m) => m.uid === b.mentorUid && m.hp > 0) && run.party.some((m) => m.uid === b.proteUid));
}

/** Holds the spar and applies its reward. Returns the lines to show. */
export function holdSpar(content: Content, run: RunState, relId: string): string[] {
  const bond = bondOfRel(run, relId);
  if (!bond || !sparReady(run).some((b) => b.relId === relId)) throw new Error('This pair is not ready to spar yet.');
  const rel = run.story.relationships.find((r) => r.id === relId)!;
  const mentor = run.party.find((m) => m.uid === bond.mentorUid)!;
  const prote = run.party.find((m) => m.uid === bond.proteUid)!;
  const g = MENTOR_CFG.graduation;
  const { outcome } = simulateSpar(content, run, bond);
  bond.events.spar = (bond.events.spar ?? 0) + 1;
  const mn = nm(content, mentor);
  const pn = nm(content, prote);
  const lines: string[] = [`${pn} and ${mn} held a friendly sparring match.`];
  const hm = run.story.histories[mentor.uid];
  const hp = run.story.histories[prote.uid];
  const finish = (def: string, text: string, importance: number) => {
    const cause = emit(content, run, 'storyMoment', { actors: [mentor.uid, prote.uid], data: { def, suppressed: false }, importance, text, emotions: ['perseverance'] });
    closeRelationship(rel);
    bond.outcome = outcome;
    bond.ready = false;
    return cause;
  };
  if (outcome === 'protege') {
    lines.push(`${mn} admitted that ${pn} has surpassed it.`);
    const cause = finish('graduation-protege', `The Student Becomes the Teacher: ${pn} beat ${mn} in the graduation spar`, 90);
    const top = (['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const).reduce((b, s) => (getSpecies(content, mentor.speciesId).baseStats[s] > getSpecies(content, mentor.speciesId).baseStats[b] ? s : b), 'hp' as 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe');
    const got = addEvs(content, prote, top, g.protegeEvReward);
    if (got > 0) lines.push(`${pn} gained ${got} ${top.toUpperCase()} training from ${mn}'s lessons.`);
    // The mentor's strongest move, handed over as an equal (no mentorship level needed).
    const gift = inheritableMoves(content, run, { ...bond, chemistry: 100, lessons: [] }).map((o) => content.moves.get(o.moveId)!).sort((a, b) => (b.power ?? 0) - (a.power ?? 0))[0];
    if (gift && !run.pending.some((p) => p.kind === 'learnMove' && p.uid === prote.uid && p.moveId === gift.id)) {
      run.pending.push({ kind: 'learnMove', uid: prote.uid, moveId: gift.id });
      lines.push(`${mn} passed on ${gift.name}.`);
    }
    if (hp && !hp.titles.includes('Former Protégé')) hp.titles.push('Former Protégé');
    if (hp && !hp.titles.includes('Surpassed Its Teacher')) hp.titles.push('Surpassed Its Teacher');
    openRelationship(content, run, 'respect', { kind: 'pokemon', id: prote.uid }, { kind: 'pokemon', id: mentor.uid }, cause);
    adjustBond(bondOf(run, prote.uid), { confidence: 8, respect: 5 });
    lines.push(`They are equals now.`);
  } else if (outcome === 'mentor') {
    lines.push(`${pn} lost, and understands there is still something to learn.`);
    bond.chemistry = Math.min(100, bond.chemistry + g.mentorChemistryReward);
    bond.ready = false;
    bond.battlesTogether = 0;
    bond.outcome = null;
    addEvs(content, prote, 'hp', Math.max(1, Math.floor(g.protegeEvReward / 3)));
    adjustBond(bondOf(run, prote.uid), { trust: 4 });
    emit(content, run, 'storyMoment', { actors: [mentor.uid, prote.uid], data: { def: 'graduation-mentor', suppressed: false }, importance: 70, text: `${mn} won the sparring match and gave ${pn} a new lesson`, emotions: ['perseverance'] });
    lines.push(`${mn} gave it a new lesson (+${g.mentorChemistryReward} chemistry). The mentorship continues; try again after three more battles together.`);
  } else {
    lines.push(`Neither could claim the win. They simply smiled at each other.`);
    const cause = finish('graduation-mutual', `Mutual Respect: ${pn} and ${mn} ended their mentorship as equals`, 95);
    bond.chemistry = g.mutualChemistryReward;
    const stat = MUTUAL_STAT[bond.types[0] ?? 'veteran'];
    for (const m of [mentor, prote]) {
      const got = addEvs(content, m, stat, g.mutualEvReward);
      if (got > 0) lines.push(`${nm(content, m)} gained ${got} ${stat.toUpperCase()} (${TRAIT_NAMES[bond.trait]}).`);
      adjustBond(bondOf(run, m.uid), { trust: 6, respect: 6 });
      const h = run.story.histories[m.uid];
      if (h && !h.titles.includes('Mutual Respect')) h.titles.push('Mutual Respect');
    }
    if (hp && !hp.titles.includes('Former Protégé')) hp.titles.push('Former Protégé');
    openRelationship(content, run, 'respect', { kind: 'pokemon', id: mentor.uid }, { kind: 'pokemon', id: prote.uid }, cause);
    void hm;
  }
  return lines;
}
