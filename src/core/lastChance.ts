import type { Content } from './contentSchema';
import { hasPerk } from './mapItems';
import { maxHp } from './pokemon';
import type { RunState } from './state';

// Last Chance Revives (S389): with the Last Chance Charm, after each won fight at a stop, one fallen Pokémon
// (the highest level) gets back up with a share of its HP. One revive per stop; a fresh node gets a fresh one.
// It runs before a Nuzlocke burial, so the revived Pokémon is not lost.

/** Revives one fallen Pokémon after a won or caught fight (mutates `run`). Returns its uid, or null. */
export function lastChanceRevive(content: Content, run: RunState): string | null {
  if (!hasPerk(content, run, 'lastChance')) return null;
  const fallen = run.party.filter((m) => m.hp <= 0 && m.uid !== run.battle?.loaner).sort((a, b) => b.level - a.level);
  const mon = fallen[0];
  if (!mon) return null;
  mon.hp = Math.max(1, Math.floor(maxHp(content, mon) * content.balance.lastChance.share));
  run.itemCounters = { ...run.itemCounters, 'last-chance-used': (run.itemCounters?.['last-chance-used'] ?? 0) + 1 };
  return mon.uid;
}
