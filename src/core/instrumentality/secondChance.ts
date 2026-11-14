// Beta 0.7 S1: Second Chance (RIVAL_SYSTEM_OVERHAUL section 10). When a run-ending loss would happen, 5% of the time (flat, once
// per run) the whole team is revived at 25% HP with +1 to every stat, a rival stands beside the player, and the same fight goes on.
// The "tag" is the existing final-boss assist (battle.finaleAssist: the partner strikes 3 times); no new battle format.
// Pure and deterministic: its own seeded stream (`second-chance`), so no other roll moves. Off when the run started with 0%.

import type { Content } from '../contentSchema';
import { maxHp } from '../pokemon';
import { hashSeed, Rng } from '../rng';
import type { BattleState, RunState, Stages } from '../state';
import { BOOST_STATS } from '../contentSchema';

export const SECOND_CHANCE = { reviveShare: 0.25, boost: 1, assistStrikes: 3, levelGap: 3 } as const;

/** One rescue per lost run, in this order (MASTER_FRONT rule 5). The first one available is used; the others are not rolled. */
export type Rescue = 'rewind' | 'jewel' | 'flight-north' | 'second-chance';
export const RESCUE_ORDER: readonly Rescue[] = ['rewind', 'jewel', 'flight-north', 'second-chance'];

export function pickRescue(available: Partial<Record<Rescue, boolean>>): Rescue | null {
  return RESCUE_ORDER.find((r) => available[r]) ?? null;
}

/** The six white lines, shown one at a time (presentation only). */
export const SECOND_CHANCE_LINES = ["It's the end.", "You've fallen.", 'Or so you think.', 'No.', 'Open your eyes.', "You've been given a second chance."] as const;

/** The flat roll for this loss. Once per run, never raised or lowered. */
export function secondChanceRolls(seed: string | number, at: number, pct: number): boolean {
  if (pct <= 0) return false;
  return new Rng(hashSeed(`${seed}::second-chance::${at}`)).chance(Math.min(100, pct) / 100);
}

/** The one-line "by personality" lines: a short fixed set keyed by the rival's archetype (the dialogue bank can replace them). */
const RIVAL_LINES: Record<string, string> = {
  friendly: "Hey, I'm here. We're not done yet!",
  proud: "Don't you dare quit on me now. Get up.",
  cold: 'Stand. I did not come this far to watch you fall.',
  default: "Get up. I've got your back.",
};

export interface SecondChanceCompanion { id: string | null; name: string; speciesId: string | null; level: number; line: string; silhouette: boolean }

/** Who stands beside the player: a live rival that is not this battle's opponent, else a silent silhouette (deliberate). */
export function secondChanceCompanion(content: Content, run: Pick<RunState, 'story' | 'party' | 'expansion'>, battle: Pick<BattleState, 'trainer'>): SecondChanceCompanion {
  const opponent = battle.trainer?.name;
  const live = run.story.rivals.filter((r) => r.state !== 'retired' && r.name !== opponent);
  const roleOf = (id: string): number => (run.expansion?.rival?.[id]?.role === 'main' ? 0 : run.expansion?.rival?.[id]?.role === 'friend' ? 1 : 2);
  const rival = [...live].sort((a, b) => roleOf(a.id) - roleOf(b.id) || b.rivalPotential - a.rivalPotential || a.id.localeCompare(b.id))[0];
  const top = Math.max(...run.party.map((m) => m.level), 5);
  if (!rival) return { id: null, name: 'A silhouette', speciesId: null, level: Math.max(5, top - SECOND_CHANCE.levelGap), line: '', silhouette: true };
  const species = (rival.memory?.lastBattle?.team ?? []).find((id) => content.species.has(id)) ?? null;
  const line = RIVAL_LINES[rival.archetype] ?? RIVAL_LINES.default!;
  return { id: rival.id, name: rival.name, speciesId: species, level: Math.max(5, top - SECOND_CHANCE.levelGap), line, silhouette: false };
}

/** Everything a Second Chance does to the run, in place. The caller has already decided the loss is run-ending and rolled. */
export function applySecondChance(content: Content, run: RunState): { lines: string[]; companion: SecondChanceCompanion } {
  const battle = run.battle!;
  const companion = secondChanceCompanion(content, run, battle);
  for (const mon of run.party) {
    mon.hp = Math.max(1, Math.floor(maxHp(content, mon) * SECOND_CHANCE.reviveShare));
    mon.status = null;
  }
  // Back to the same fight: the foe keeps what it had, and the player sends in the first Pokémon.
  battle.outcome = null;
  battle.activeIndex = 0;
  battle.secondChance = true;
  const stages: Stages = { ...battle.playerStages };
  for (const stat of BOOST_STATS) stages[stat] = Math.min(6, (stages[stat] ?? 0) + SECOND_CHANCE.boost);
  battle.playerStages = stages;
  if (companion.speciesId) {
    battle.finaleAssist = { id: companion.id ?? 'second-chance', name: companion.name, speciesId: companion.speciesId, level: companion.level, strikesLeft: SECOND_CHANCE.assistStrikes };
  }
  battle.rivalNote = [battle.rivalNote, companion.silhouette ? 'A silhouette you do not recognise stands beside you and says nothing.' : `${companion.name}: "${companion.line.replace(/"/g, '')}"`].filter(Boolean).join(' ');
  run.expansion = { ...run.expansion, secondChance: { at: run.encountersCompleted, rival: companion.id } };
  return { lines: [...SECOND_CHANCE_LINES], companion };
}

/** True when this loss may roll: the setting was on at run start and it has not happened yet this run. */
export function secondChanceOpen(run: Pick<RunState, 'expansion'>): boolean {
  if (run.expansion?.flightNorth) return false; // Flight North's return, once in the run, is the rescue: Second Chance cannot also trigger
  return (run.expansion?.secondChancePct ?? 0) > 0 && !run.expansion?.secondChance;
}

/** The +1 to every stat follows the Pokémon each time one is sent in for the rest of this fight (engine hook). */
export function reapplyBoost(stages: Stages): Stages {
  const out: Stages = { ...stages };
  for (const stat of BOOST_STATS) out[stat] = Math.min(6, (out[stat] ?? 0) + SECOND_CHANCE.boost);
  return out;
}
