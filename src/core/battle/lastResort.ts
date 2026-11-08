// Beta 0.5 (doc section 2.4, M4): Mentor's Last Resort. Once per battle, when a protégé on the field is at or below half HP and
// its mentor is in the party and able to fight, the mentor lends the protégé its strongest known move. The move sits in a
// temporary extra slot (like the Hyper slot) with a few PP and keeps the mentor's real move properties; it vanishes when the
// battle ends. The pure helpers (`lastResortEligible`, `borrowedMove`) take plain Pokémon so AI trainers can use the same rule.

import type { Content } from '../contentSchema';
import { adjustBond, bondOf } from '../bond';
import { getSpecies, isUsableMove, maxHp } from '../pokemon';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { MENTOR_CFG, bondForProtege, chemistryLevel } from '../story/mentorBond';
import type { BattleEvent } from './engine';

/** The mentor's strongest move the protégé does not know: power first, then a same-type bonus for the mentor, then id. */
export function borrowedMove(content: Content, mentor: PokemonInstance, prote: PokemonInstance): string | null {
  const ms = getSpecies(content, mentor.speciesId);
  const scored = mentor.moves
    .filter((s) => !s.hyper && !s.lent && !s.megaSig && !s.storySig && s.pp >= 0)
    .map((s) => content.moves.get(s.id))
    .filter((m): m is NonNullable<typeof m> => !!m && m.supported === true && isUsableMove(content, m.id) && !m.flags.some((f) => ['zmove', 'max', 'megasig', 'storysig', 'jetform'].includes(f)))
    .filter((m) => !prote.moves.some((k) => k.id === m.id))
    .map((m) => ({ id: m.id, score: (m.power ?? 0) * (ms.types.includes(m.type) ? 1.5 : 1) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return scored[0]?.id ?? null;
}

/** The rule on its own: the protégé is at or below the HP share, the mentor can fight, and nothing was lent yet. */
export function lastResortEligible(content: Content, prote: PokemonInstance, mentor: PokemonInstance | undefined, alreadyUsed: boolean): boolean {
  if (alreadyUsed || !mentor || mentor.hp <= 0 || prote.hp <= 0) return false;
  return prote.hp <= Math.floor(maxHp(content, prote) * MENTOR_CFG.lastResort.hpShare) && borrowedMove(content, mentor, prote) !== null;
}

export interface LastResortOffer { mentorUid: string; proteUid: string; moveId: string }

/** Is the option on the battle menu right now? (Singles and doubles: the active player Pokémon is the protégé.) */
export function lastResortOffer(content: Content, run: RunState): LastResortOffer | null {
  const battle = run.battle;
  if (!battle || battle.outcome || battle.lastResort || battle.doubles) return null;
  const prote = run.party[battle.activeIndex];
  if (!prote) return null;
  const bond = bondForProtege(run, prote.uid);
  if (!bond || bond.chemistry < MENTOR_CFG.lastResort.minChemistry) return null;
  const mentor = run.party.find((m) => m.uid === bond.mentorUid);
  if (!mentor || mentor.uid === prote.uid || !lastResortEligible(content, prote, mentor, false)) return null;
  return { mentorUid: mentor.uid, proteUid: prote.uid, moveId: borrowedMove(content, mentor, prote)! };
}

/** Lends the move. Returns the lines for the presentation (the scene plays them in order). */
export function useLastResort(content: Content, run: RunState): BattleEvent[] {
  const offer = lastResortOffer(content, run);
  if (!offer) throw new Error("Mentor's Last Resort is not available.");
  const battle = run.battle!;
  const mentor = run.party.find((m) => m.uid === offer.mentorUid)!;
  const prote = run.party.find((m) => m.uid === offer.proteUid)!;
  const move = content.moves.get(offer.moveId)!;
  prote.moves.push({ id: move.id, pp: Math.min(move.pp, MENTOR_CFG.lastResort.pp), lent: true });
  battle.lastResort = offer;
  const bond = bondForProtege(run, prote.uid)!;
  adjustBond(bondOf(run, prote.uid), { trust: 2, synchronization: 2 });
  const mn = getSpecies(content, mentor.speciesId).name;
  const pn = getSpecies(content, prote.speciesId).name;
  const lvl = chemistryLevel(bond.chemistry);
  return [
    { type: 'spectacle', kind: 'signature', side: 'player', uid: prote.uid, text: `${pn} struggles to keep its footing...` },
    { type: 'spectacle', kind: 'signature', side: 'player', uid: mentor.uid, text: `${mn} will not let ${pn} fall! It lends its strength${lvl >= 4 ? ' without a second thought' : ''}.` },
    { type: 'spectacle', kind: 'signature', side: 'player', uid: prote.uid, text: `${pn} channels ${mn}'s power: ${move.name}! (borrowed move, ${Math.min(move.pp, MENTOR_CFG.lastResort.pp)} PP)` },
  ];
}

/** When a battle ends: every lent slot goes away. (The mentorship records the moment.) */
export function endLastResort(run: RunState): void {
  for (const mon of [...run.party, ...(run.battle?.enemyTeam ?? [])]) if (mon.moves.some((m) => m.lent)) mon.moves = mon.moves.filter((m) => !m.lent);
}

/**
 * Beta 0.5 M1 (trainer parity): the same rule for a trainer's team. Its bonded pair (core/trainerWorld) is a mentor and a protégé
 * when one is the higher level. Once per battle, when the protégé on the field is at or below the HP share and the mentor can still
 * fight, the mentor lends its strongest move. Returns the lines to show, or null when nothing happens.
 */
export function enemyLastResort(content: Content, battle: BattleState): BattleEvent[] | null {
  if (battle.kind !== 'trainer' || battle.enemyLastResort || battle.outcome || battle.raid || battle.totem || battle.doubles) return null;
  const prote = battle.enemyTeam[battle.enemyIndex];
  if (!prote?.bondWith) return null;
  const mentor = battle.enemyTeam.find((m) => m.uid === prote.bondWith);
  if (!mentor || mentor.level <= prote.level || mentor.uid === prote.uid || !lastResortEligible(content, prote, mentor, false)) return null;
  const moveId = borrowedMove(content, mentor, prote)!;
  const move = content.moves.get(moveId)!;
  const pp = Math.min(move.pp, MENTOR_CFG.lastResort.pp);
  prote.moves.push({ id: moveId, pp, lent: true });
  battle.enemyLastResort = { mentorUid: mentor.uid, proteUid: prote.uid, moveId };
  const mn = getSpecies(content, mentor.speciesId).name;
  const pn = getSpecies(content, prote.speciesId).name;
  return [
    { type: 'spectacle', kind: 'signature', side: 'enemy', uid: prote.uid, text: `${pn} struggles to keep its footing...` },
    { type: 'spectacle', kind: 'signature', side: 'enemy', uid: mentor.uid, text: `${mn} will not let ${pn} fall! It lends its strength.` },
    { type: 'spectacle', kind: 'signature', side: 'enemy', uid: prote.uid, text: `${pn} channels ${mn}'s power: ${move.name}!` },
  ];
}
