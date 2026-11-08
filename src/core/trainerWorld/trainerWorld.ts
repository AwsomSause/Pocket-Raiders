// Beta 0.5 M1/M2: every trainer plays by the player's rules. This module is the single place that
// (1) names a trainer (a stable key), (2) decides their specialization and wealth, (3) gives their Pokémon
// friendship, a bond and mastered moves, and (4) keeps the record that later meetings read.
// Everything is deterministic from the run seed and the key (own hash streams, never the gameplay RNG).

import type { Content } from '../contentSchema';
import { Rng, hashSeed } from '../rng';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { getSpecies } from '../pokemon';
import { borrowedMove } from '../battle/lastResort';
import { chooseSpecialization, giveTrainerItems, steerTeam, teachReturning } from './behavior';
import { SPECIALIZATIONS, TRAINER_NOTES_KEPT, type Specialization, type TrainerNote, type TrainerRecord } from './schema';

type TrainerRef = { classId: string; name: string; leaderId: string | null };

const WEATHER_MOVES = new Set(['rain-dance', 'sunny-day', 'sandstorm', 'hail', 'snowscape']);
const SETUP_MOVES = new Set(['swords-dance', 'nasty-plot', 'calm-mind', 'dragon-dance', 'bulk-up', 'quiver-dance', 'agility', 'shell-smash', 'work-up', 'coil', 'iron-defense', 'amnesia', 'growth', 'curse', 'belly-drum']);
const bossLike = (t: TrainerRef) => t.leaderId !== null;

/** A stable id for a trainer: rival id, boss id, or class and name for an ordinary trainer. */
export function trainerKey(t: TrainerRef, rivalId?: string | null): string {
  if (rivalId) return `rival:${rivalId}`;
  if (t.leaderId) return `boss:${t.leaderId}`;
  return `class:${t.classId}:${t.name}`;
}

/** The key of the trainer in a battle, or null for wild battles. */
export function battleTrainerKey(battle: Pick<BattleState, 'kind' | 'trainer' | 'rivalId'>): string | null {
  return battle.kind === 'trainer' && battle.trainer ? trainerKey(battle.trainer, battle.rivalId) : null;
}

/** What a team is built around, read from the moves and stats it actually has. */
export function specializationOf(content: Content, team: readonly PokemonInstance[], seedKey: string): Specialization {
  const moves = team.flatMap((m) => m.moves.map((s) => s.id));
  if (moves.includes('trick-room')) return 'trickRoom';
  if (moves.some((id) => WEATHER_MOVES.has(id))) return 'weather';
  if (team.filter((m) => m.moves.some((s) => SETUP_MOVES.has(s.id))).length >= 2) return 'setup';
  const cats = moves.map((id) => content.moves.get(id)?.category).filter(Boolean);
  const statusShare = cats.length > 0 ? cats.filter((c) => c === 'status').length / cats.length : 0;
  if (statusShare >= 0.4) return 'status';
  let off = 0;
  let def = 0;
  for (const m of team) {
    const b = getSpecies(content, m.speciesId).baseStats;
    off += Math.max(b.atk, b.spa);
    def += (b.def + b.spd) / 2;
  }
  if (team.length > 0 && off / team.length >= (def / team.length) * 1.25) return 'offensive';
  if (team.length > 0 && def / team.length >= (off / team.length) * 1.1) return 'defensive';
  // About one team in eight is an improviser, decided by the key alone.
  return new Rng(hashSeed(`tw:spec:${seedKey}`)).chance(0.125) ? 'improviser' : 'balanced';
}

/** 0 (struggling) to 3 (wealthy): bosses are well off, others vary with the trainer's key. */
export function wealthOf(t: TrainerRef, seedKey: string): number {
  if (bossLike(t)) return 3;
  return new Rng(hashSeed(`tw:wealth:${seedKey}`)).int(0, 2);
}

export function ensureRecord(run: RunState, t: TrainerRef, rivalId?: string | null): TrainerRecord {
  const key = trainerKey(t, rivalId);
  const world = (run.story.trainers ??= {});
  return (world[key] ??= {
    key, name: t.name, classId: t.classId, leaderId: t.leaderId,
    specialization: 'balanced', wealth: bossLike(t) ? 3 : 1,
    meetings: 0, wins: 0, losses: 0, lastStage: -1, ace: null, bond: null, moveUses: {}, reputation: 0, notes: [], beatenBy: null,
  });
}

function addNote(content: Content, rec: TrainerRecord, note: TrainerNote): void {
  rec.notes.push(note);
  const cap = Math.min(TRAINER_NOTES_KEPT, content.balance.trainerWorld.notesKept);
  if (rec.notes.length > cap) rec.notes.splice(0, rec.notes.length - cap);
}

/**
 * M1: gives a trainer's freshly built team the same relationship and mastery systems the player has.
 * Mutates the Pokémon (friendship, bondWith, mastered) and the trainer's record; returns the record.
 * Call it once per trainer battle, after the team is built and before it is shown.
 */
export function applyTrainerParity(content: Content, run: RunState, t: TrainerRef, team: PokemonInstance[], rivalId?: string | null, lines?: string[]): TrainerRecord | null {
  const cfg = content.balance.trainerWorld;
  if (!cfg.enabled || team.length === 0) return null;
  const rec = ensureRecord(run, t, rivalId);
  const seedKey = `${run.seed}:${rec.key}`;
  const rng = new Rng(hashSeed(`tw:parity:${seedKey}:${rec.meetings}`));
  const [lo, hi] = bossLike(t) || rivalId ? cfg.friendshipBoss : cfg.friendshipOrdinary;
  const ace = team.reduce((a, b) => (b.level >= a.level ? b : a));
  for (const mon of team) {
    const base = rng.int(lo, Math.max(lo, hi));
    mon.friendship = Math.min(255, base + rec.meetings * cfg.friendshipPerMeeting + (mon === ace ? 20 : 0));
  }
  // A remembered bond comes back: the two species are fond of each other again.
  if (rec.bond) {
    const a = team.find((m) => m.speciesId === rec.bond!.a);
    const b = team.find((m) => m.speciesId === rec.bond!.b && m !== a);
    if (a && b) { a.friendship = Math.max(a.friendship, rec.bond.friendship); b.friendship = Math.max(b.friendship, rec.bond.friendship); }
  }
  // Bond: the two friendliest teammates, if both pass the threshold.
  const fond = [...team].sort((x, y) => y.friendship - x.friendship);
  if (fond.length >= 2 && fond[1]!.friendship >= cfg.bondMinFriendship) {
    fond[0]!.bondWith = fond[1]!.uid;
    fond[1]!.bondWith = fond[0]!.uid;
    if (!rec.bond || rec.bond.a !== fond[0]!.speciesId || rec.bond.b !== fond[1]!.speciesId) addNote(content, rec, { kind: 'bonded', stage: Math.max(0, rec.lastStage), subject: fond[0]!.speciesId });
    rec.bond = { a: fond[0]!.speciesId, b: fond[1]!.speciesId, friendship: Math.min(fond[0]!.friendship, fond[1]!.friendship) };
  }
  // Mentor and protégé: a lower-level teammate follows the team's strongest Pokémon, so Last Resort can really happen.
  const mentorOf = (m: PokemonInstance) => team.find((x) => x.uid === m.bondWith);
  if (team.length >= 2 && !team.some((m) => m.bondWith && mentorOf(m) && mentorOf(m)!.level > m.level && borrowedMove(content, mentorOf(m)!, m))) {
    const mentor = ace;
    const prote = team.filter((m) => m !== mentor && m.level < mentor.level && borrowedMove(content, mentor, m)).sort((x, y) => y.friendship - x.friendship || x.uid.localeCompare(y.uid))[0];
    if (prote) {
      for (const m of team) if (m.bondWith === mentor.uid || m.bondWith === prote.uid) delete m.bondWith;
      mentor.bondWith = prote.uid;
      prote.bondWith = mentor.uid;
      mentor.friendship = Math.max(mentor.friendship, cfg.bondMinFriendship);
      prote.friendship = Math.max(prote.friendship, cfg.bondMinFriendship);
    }
  }
  // Specialization (M1): a trainer keeps the style it had; a new one is read from its team, then its team is fitted to it.
  const wealth = wealthOf(t, seedKey);
  const spec = rec.meetings > 0 ? rec.specialization : chooseSpecialization(specializationOf(content, team, seedKey), seedKey);
  // Authored boss teams keep their moves and items; everyone else is fitted to their style.
  if (!bossLike(t)) {
    steerTeam(content, team, spec);
    giveTrainerItems(content, team, spec, wealth);
    const taught = teachReturning(content, team, rec, borrowedMove.bind(null, content));
    if (lines) lines.push(...taught);
  }
  // Move mastery: moves used often enough in earlier meetings; a boss's ace starts with its strongest attack mastered.
  for (const mon of team) {
    const earned = mon.moves
      .map((s) => s.id)
      .filter((id) => (rec.moveUses[`${mon.speciesId}:${id}`] ?? 0) >= cfg.masteryUses);
    const strongest = bossLike(t) && mon === ace
      ? [...mon.moves].map((s) => s.id).sort((x, y) => (content.moves.get(y)?.power ?? 0) - (content.moves.get(x)?.power ?? 0))[0]
      : undefined;
    const list = [...new Set([...(strongest && (content.moves.get(strongest)?.power ?? 0) > 0 ? [strongest] : []), ...earned])].slice(0, cfg.maxMastered);
    if (list.length > 0) mon.mastered = list;
  }
  rec.specialization = spec;
  rec.wealth = wealth;
  rec.ace = ace.speciesId;
  return rec;
}

/** Counts one use of a move by a trainer's Pokémon (hooks.ts calls this for every enemy move in a trainer battle). */
export function noteTrainerMove(content: Content, run: RunState, battle: Pick<BattleState, 'kind' | 'trainer' | 'rivalId' | 'enemyTeam' | 'enemyIndex'>, moveId: string): void {
  const key = battleTrainerKey(battle);
  const mon = battle.enemyTeam[battle.enemyIndex];
  const rec = key ? run.story.trainers?.[key] : undefined;
  if (!rec || !mon) return;
  const k = `${mon.speciesId}:${moveId}`;
  const n = (rec.moveUses[k] = (rec.moveUses[k] ?? 0) + 1);
  if (n === content.balance.trainerWorld.masteryUses) addNote(content, rec, { kind: 'mastered', stage: Math.max(0, rec.lastStage), subject: moveId });
}

/** M2: after a trainer battle ends, update the record: meetings, result, reputation, ace history and mastery notes. */
export function recordTrainerResult(content: Content, run: RunState, stage: number): void {
  const battle = run.battle;
  const cfg = content.balance.trainerWorld;
  if (!cfg.enabled || !battle || battle.kind !== 'trainer' || !battle.trainer || (battle.outcome !== 'win' && battle.outcome !== 'lose')) return;
  const rec = run.story.trainers?.[trainerKey(battle.trainer, battle.rivalId)];
  if (!rec) return;
  rec.meetings += 1;
  rec.lastStage = stage;
  const playerWon = battle.outcome === 'win';
  const lead = run.party[battle.activeIndex];
  if (playerWon && lead) rec.beatenBy = { speciesId: lead.speciesId, types: [...getSpecies(content, lead.speciesId).types] };
  if (playerWon) { rec.losses += 1; rec.reputation = Math.max(-100, rec.reputation + cfg.reputationLoss); }
  else { rec.wins += 1; rec.reputation = Math.min(100, rec.reputation + cfg.reputationWin); }
  addNote(content, rec, { kind: playerWon ? 'lost' : 'won', stage });
  const acePlace = battle.enemyTeam.reduce((a, b) => (b.level >= a.level ? b : a));
  if (playerWon && acePlace.hp <= 0) addNote(content, rec, { kind: 'ace-lost', stage, subject: acePlace.speciesId });
}

export { SPECIALIZATIONS };

/** A trainer's Pokémon's friendship (0-255) on the 0-100 bond scale the player's Last Stand uses. */
export const friendshipBond = (friendship: number): number => Math.floor((friendship * 100) / 255);

/** Potions a trainer carries by wealth (0 struggling .. 3 wealthy), and the share of max HP each restores. */
export const WEALTH_POTIONS = [0, 1, 1, 2] as const;
export const WEALTH_HEAL = [0.3, 0.4, 0.5, 0.6] as const;

/** M2: one line a returning trainer says before the fight, read from their record (no randomness), or null for a first meeting. */
export function trainerHistoryLine(content: Content, rec: TrainerRecord, partySpecies: readonly string[] = []): string | null {
  if (rec.meetings <= 0) return null;
  const nameOf = (id: string | null) => (id ? content.species.get(id)?.name ?? id : null);
  const ace = nameOf(rec.ace);
  if (rec.beatenBy && partySpecies.includes(rec.beatenBy.speciesId)) return `${rec.name} recognizes your ${nameOf(rec.beatenBy.speciesId)} from last time${ace ? `, and ${ace} has not forgotten it either` : ''}.`;
  if (rec.reputation >= 40) return `${rec.name} is a name people know by now. This is not a trainer to take lightly.`;
  if (rec.wins > rec.losses) return `${rec.name} remembers beating you before, and ${ace ? `${ace} is ready to do it again` : 'is ready to do it again'}.`;
  if (rec.losses >= 2 && rec.bond) return `${rec.name} has kept training since you last met. ${nameOf(rec.bond.a)} and ${nameOf(rec.bond.b)} are closer than ever.`;
  if (rec.losses > 0) return `${rec.name} lost to you before and has been training${ace ? `. ${ace} looks sharper` : ''}.`;
  return null;
}
