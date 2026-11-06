// Beta 4.4 (Kice): when a Hyper or Overdrive moment fires for your Pokémon, it taps into a new move for the
// rest of the battle. The move sits in an extra slot (like the Z-Move button), hits with +20 power and has
// a few PP. When the battle is won the player chooses to keep it (forgetting a move) or let it go; on any
// other ending it simply fades. Pure: works on the run it is given.

import type { Content } from '../contentSchema';
import { strongestMoves } from '../bossBands';
import { getSpecies, isUsableMove } from '../pokemon';
import type { PokemonInstance, RunState } from '../state';
import type { BattleEvent } from './engine';

/** The move a Pokémon taps into: the strongest one it could know at its level that it doesn't know yet, or null. */
export function hyperMoveFor(content: Content, mon: PokemonInstance): string | null {
  const known = new Set(mon.moves.map((m) => m.id));
  return strongestMoves(content, getSpecies(content, mon.speciesId), mon.level).find((id) => !known.has(id) && isUsableMove(content, id)) ?? null;
}

/** After a turn: each of your Pokémon that had a Hyper moment gets its Hyper slot (once per battle). Returns the lines to show. */
export function grantHyperMoves(content: Content, run: RunState, events: readonly BattleEvent[]): BattleEvent[] {
  const battle = run.battle;
  if (!battle || battle.doubles || battle.outcome) return [];
  const out: BattleEvent[] = [];
  for (const e of events) {
    if (e.type !== 'hyper' || e.side !== 'player') continue;
    const mon = run.party.find((m) => m.uid === e.uid);
    if (!mon || mon.hp <= 0 || mon.moves.some((m) => m.hyper) || battle.hyperMoved?.includes(mon.uid)) continue;
    const id = hyperMoveFor(content, mon);
    if (!id) continue;
    const move = content.moves.get(id)!;
    mon.moves.push({ id, pp: Math.min(move.pp, content.balance.hyperMove.pp), hyper: true });
    battle.hyperMoved = [...(battle.hyperMoved ?? []), mon.uid];
    out.push({ type: 'spectacle', kind: 'signature', side: 'player', uid: mon.uid, text: `${getSpecies(content, mon.speciesId).name} found a new move in the moment: ${move.name}! (Hyper slot, +${content.balance.hyperMove.powerBonus} power)` });
  }
  return out;
}

/** When a battle ends: every Hyper slot goes away; after a win (or catch) each one is offered to keep. */
export function endHyperMoves(run: RunState, offer: boolean): void {
  for (const mon of run.party) {
    const slots = mon.moves.filter((m) => m.hyper);
    if (slots.length === 0) continue;
    mon.moves = mon.moves.filter((m) => !m.hyper);
    // Offered even if it fainted later in the fight: the move was found, the choice is still yours.
    if (!offer) continue;
    for (const s of slots) {
      if (mon.moves.some((m) => m.id === s.id) || run.pending.some((p) => p.kind === 'learnMove' && p.uid === mon.uid && p.moveId === s.id)) continue;
      run.pending.push({ kind: 'learnMove', uid: mon.uid, moveId: s.id });
    }
  }
}
