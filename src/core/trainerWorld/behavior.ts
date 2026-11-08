// Beta 0.5 M1 part 5 (trainer parity): what a trainer's specialization, wealth and past do to its team and its play.
// Everything here is pure and deterministic (own hash streams, never the gameplay RNG).

import type { Content, TypeName } from '../contentSchema';
import { Rng, hashSeed } from '../rng';
import type { BattleState, PokemonInstance } from '../state';
import { getSpecies, isUsableMove, usableLearnset } from '../pokemon';
import { evolvedFormAt, type TrainerPlan } from '../encounters';
import { counterTypes } from '../story/nemesis';
import { withTeamTypes } from '../rivals/adapt';
import { BOSS_GIMMICKS, canCarry, type BossGimmick } from '../battle/bossGimmicks';
import type { Personality } from '../battle/aai';
import { SPECIALIZATIONS, type Specialization, type TrainerRecord } from './schema';
import type { TransformKind } from '../contentSchema';

const WEATHER_BY_TYPE: Partial<Record<TypeName, string>> = { fire: 'sunny-day', water: 'rain-dance', rock: 'sandstorm', ground: 'sandstorm', steel: 'sandstorm', ice: 'snowscape' };
const WEATHER_ROCK: Record<string, string> = { 'sunny-day': 'heat-rock', 'rain-dance': 'damp-rock', sandstorm: 'smooth-rock', snowscape: 'icy-rock', hail: 'icy-rock' };

/** The AI personality a specialization plays with (core/battle/aai.ts); an improviser changes its mind every few turns. */
export function specializationPersonality(spec: string | undefined, turn: number): Personality | null {
  switch (spec as Specialization | undefined) {
    case 'offensive': return 'aggressive';
    case 'defensive': case 'status': case 'trickRoom': return 'defensive';
    case 'setup': return 'hyperOffensive';
    case 'weather': case 'balanced': return 'balanced';
    case 'improviser': return (['aggressive', 'defensive', 'balanced', 'hyperOffensive'] as const)[Math.floor(turn / 3) % 4]!;
    default: return null;
  }
}

/** A move that starts a weather, trick room or other plan is worth more to the trainer built around it. */
export function specializationBonus(spec: string | undefined, move: { effects: { weather?: unknown; status?: unknown }; id: string; category: string }): number {
  if (spec === 'weather' && move.effects.weather) return 2.5;
  if (spec === 'trickRoom' && move.id === 'trick-room') return 6;
  if (spec === 'status' && move.category === 'status' && move.effects.status) return 1.8;
  return 1;
}

/** Picks a specialization for a first meeting from the team, or from the key when the team is plain. */
export function chooseSpecialization(derived: Specialization, seedKey: string): Specialization {
  if (derived !== 'balanced') return derived;
  return new Rng(hashSeed(`tw:spec-pick:${seedKey}`)).pick([...SPECIALIZATIONS]);
}

function giveMove(content: Content, mon: PokemonInstance, moveId: string): boolean {
  if (!isUsableMove(content, moveId) || mon.moves.some((m) => m.id === moveId)) return false;
  const move = content.moves.get(moveId)!;
  const entry = { id: moveId, pp: move.pp };
  if (mon.moves.length < 4) { mon.moves.push(entry); return true; }
  const types = getSpecies(content, mon.speciesId).types;
  let weakest = 0;
  const rank = (id: string) => { const m = content.moves.get(id); return (m?.power ?? 0) * (m && types.includes(m.type) ? 1.5 : 1); };
  mon.moves.forEach((m, i) => { if (rank(m.id) < rank(mon.moves[weakest]!.id)) weakest = i; });
  // Keep at least one attack.
  if (mon.moves.filter((m) => (content.moves.get(m.id)?.power ?? 0) > 0).length <= 1 && (content.moves.get(mon.moves[weakest]!.id)?.power ?? 0) > 0) return false;
  mon.moves[weakest] = entry;
  return true;
}

/** Team building (M1): the team is fitted to its specialization with the moves that make the plan work. */
export function steerTeam(content: Content, team: PokemonInstance[], spec: Specialization): string[] {
  const given: string[] = [];
  const ace = team[team.length - 1]!;
  const speciesTypes = (m: PokemonInstance) => getSpecies(content, m.speciesId).types;
  const add = (mon: PokemonInstance, id: string) => { if (giveMove(content, mon, id)) given.push(`${mon.uid}:${id}`); };
  if (spec === 'weather') {
    const id = speciesTypes(ace).map((t) => WEATHER_BY_TYPE[t]).find(Boolean);
    if (id) add(ace, id);
  } else if (spec === 'trickRoom') {
    const slowest = team.reduce((a, b) => (getSpecies(content, b.speciesId).baseStats.spe < getSpecies(content, a.speciesId).baseStats.spe ? b : a));
    add(slowest, 'trick-room');
  } else if (spec === 'setup') {
    const b = getSpecies(content, ace.speciesId).baseStats;
    add(ace, b.atk >= b.spa ? 'swords-dance' : 'nasty-plot');
  } else if (spec === 'status') {
    const t = speciesTypes(team[0]!);
    add(team[0]!, t.includes('grass') ? 'spore' : t.includes('electric') ? 'thunder-wave' : t.includes('fire') ? 'will-o-wisp' : 'toxic');
  } else if (spec === 'defensive') {
    for (const mon of team) add(mon, 'protect');
    add(ace, 'recover');
  }
  return given;
}

const heldOk = (content: Content, id: string) => content.catalog.get(id)?.effect?.kind === 'held';

/** Wealth (M1 items): what a trainer holds, by how well off it is and what it is built around. Only fills empty hands. */
export function giveTrainerItems(content: Content, team: PokemonInstance[], spec: Specialization, wealth: number): void {
  if (wealth < 2) return;
  const ace = team[team.length - 1]!;
  const give = (mon: PokemonInstance, id: string) => { if (!mon.held && heldOk(content, id)) mon.held = { [id]: 1 }; };
  const b = getSpecies(content, ace.speciesId).baseStats;
  if (spec === 'offensive') give(ace, wealth >= 3 ? (b.atk >= b.spa ? 'choice-band' : 'choice-specs') : 'life-orb');
  else if (spec === 'defensive') give(ace, 'leftovers');
  else if (spec === 'status') give(ace, 'lum-berry');
  else if (spec === 'setup') give(ace, 'sitrus-berry');
  else if (spec === 'weather') {
    const w = ace.moves.map((m) => WEATHER_ROCK[m.id]).find(Boolean);
    if (w) give(ace, w);
  }
  if (wealth >= 3) for (const mon of team) give(mon, 'sitrus-berry');
}

export interface TrainerKit { cure: number; boost: number; restore: number; boostStat: 'atk' | 'spa' | 'def' | 'spd' | 'spe' }

/** Battle consumables (M1 items): a status cure, an X-item for the ace, and a rich trainer's saved full restore. */
export function trainerKit(content: Content, team: readonly PokemonInstance[], spec: Specialization, wealth: number): TrainerKit {
  const ace = team[team.length - 1]!;
  const b = getSpecies(content, ace.speciesId).baseStats;
  const attackStat = b.atk >= b.spa ? 'atk' : 'spa';
  const boostStat = spec === 'defensive' ? 'def' : spec === 'status' ? 'spd' : spec === 'trickRoom' ? 'def' : spec === 'offensive' || spec === 'setup' ? attackStat : 'spe';
  return { cure: wealth >= 1 ? 1 : 0, boost: wealth >= 2 ? 1 : 0, restore: wealth >= 3 ? 1 : 0, boostStat };
}

/** Gimmicks by the player's rules: a rival (or other named trainer) takes the same Mega/Tera/Z/Dynamax slots as a boss, up to `cap`. */
export function planTrainerGimmicks(content: Content, key: string, team: readonly PokemonInstance[], slots: number, cap: number, disabled: readonly TransformKind[] = []): Record<string, BossGimmick> {
  const plan: Record<string, BossGimmick> = {};
  const want = Math.min(slots, cap);
  if (want <= 0) return plan;
  const order = [...BOSS_GIMMICKS].sort((a, b) => hashSeed(`tw:gimmick:${key}:${a}`).a - hashSeed(`tw:gimmick:${key}:${b}`).a);
  let given = 0;
  for (const kind of order) {
    if (given >= want) break;
    if (disabled.includes(kind)) continue;
    const free = [...team].reverse().find((m) => !plan[m.uid] && canCarry(content, m, kind));
    if (!free) continue;
    plan[free.uid] = kind;
    given += 1;
  }
  return plan;
}

/** Returning trainers (M2): a trainer that lost to your Pokémon plans for it: its ace may evolve early and its team gets answers. */
export function returningPlan(content: Content, plan: TrainerPlan, rec: TrainerRecord | undefined, beatenByTypes: readonly TypeName[]): { plan: TrainerPlan; notes: string[] } {
  if (!rec || rec.meetings <= 0 || rec.losses <= 0 || plan.members.length === 0) return { plan, notes: [] };
  const notes: string[] = [];
  let next = plan;
  const last = next.members.length - 1;
  const ace = next.members[last]!;
  const evolved = evolvedFormAt(content, ace.speciesId, ace.level + 12);
  if (evolved !== ace.speciesId) {
    next = { ...next, members: next.members.map((m, i) => (i === last ? { ...m, speciesId: evolved } : m)) };
    notes.push(`${rec.name}'s ${getSpecies(content, ace.speciesId).name} has grown into ${getSpecies(content, evolved).name}.`);
  }
  if (rec.losses >= 2 && beatenByTypes.length > 0) {
    const countered = withTeamTypes(content, next, counterTypes(content, beatenByTypes));
    if (countered !== next && countered.members.some((m, i) => m.speciesId !== next.members[i]!.speciesId)) notes.push(`${rec.name} has been preparing for your ${beatenByTypes[0]}-type team.`);
    next = countered;
  }
  return { plan: next, notes };
}

/** Tutor and mentor moves for a returning trainer's team: the ace is taught one stronger move, a mentor passes its best move to its protégé. */
export function teachReturning(content: Content, team: PokemonInstance[], rec: TrainerRecord | undefined, borrowed: (mentor: PokemonInstance, prote: PokemonInstance) => string | null): string[] {
  if (!rec || rec.meetings <= 0) return [];
  const lines: string[] = [];
  const ace = team[team.length - 1]!;
  const sp = getSpecies(content, ace.speciesId);
  const known = new Set(ace.moves.map((m) => m.id));
  const tutor = usableLearnset(content, sp)
    .map((e) => content.moves.get(e.move))
    .filter((m): m is NonNullable<typeof m> => !!m && (m.power ?? 0) > 0 && !known.has(m.id) && sp.types.includes(m.type))
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0) || a.id.localeCompare(b.id))[0];
  if (tutor && giveMove(content, ace, tutor.id)) lines.push(`${rec.name}'s ${sp.name} learned ${tutor.name}.`);
  if (rec.meetings >= 2) {
    for (const prote of team) {
      const mentor = team.find((m) => m.uid === prote.bondWith && m.level > prote.level);
      const id = mentor ? borrowed(mentor, prote) : null;
      if (mentor && id && giveMove(content, prote, id)) {
        lines.push(`${getSpecies(content, mentor.speciesId).name} has been teaching ${getSpecies(content, prote.speciesId).name}: it knows ${content.moves.get(id)?.name ?? id} now.`);
        break;
      }
    }
  }
  return lines;
}

export type TrainerBattleExtras = Pick<BattleState, 'trainerKit' | 'specialization' | 'enemyMoments'>;
