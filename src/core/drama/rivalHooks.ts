// Catalog Overhaul batch 5, row D: the four rival drama moments (The Rival Interruption, The Unfinished Grudge, The Rematch Reversal,
// Pokémon Recognition) plug into the rival overhaul (RIVAL_SYSTEM_OVERHAUL.md): the scouting ledger (what this rival has seen of you
// THIS run), the Marks, the six axes and the dialogue bank. Only for a rival the overhaul tracks; anyone else keeps the old checks.
// Pure: lines are picked by hash, never by a gameplay stream; nothing here changes HP, moves or turn order.

import type { RunState } from '../state';
import type { Content } from '../contentSchema';
import type { Rival } from '../story/schema';
import { overhaulOf } from '../rivals/overhaul';
import { BANK, type BankContext } from '../rivals/bank';
import type { RivalOverhaulState } from '../rivals/overhaulSchema';
import { fnv1a } from '../story/moments';

const bump = (rec: RivalOverhaulState, k: keyof RivalOverhaulState['feelings'], d: number): void => {
  rec.feelings[k] = Math.min(10, Math.max(0, rec.feelings[k] + d));
};

export const recOf = (run: RunState, rival: Rival | undefined): RivalOverhaulState | undefined => (rival ? overhaulOf(run, rival.id) : undefined);

/** The Unfinished Grudge, overhaul form: you won last time and the rival still feels it (Resentment or Rivalry 3+, or a Mark of yours on them). */
export function grudgeHeld(rec: RivalOverhaulState): boolean {
  return rec.feelings.resentment >= 3 || rec.feelings.rivalry >= 3 || rec.marks.some((m) => m === 'first-blood' || m === 'swept' || m === 'no-contest' || m === 'you-held-back');
}

/** The Rematch Reversal, overhaul form: a move the rival scouted (seen this run) that your active Pokémon knows, by name; null when it has scouted none. */
export function scoutedMove(content: Content, rec: RivalOverhaulState, active: { moves: { id: string }[] } | undefined): string | null {
  const seen = rec.ledger?.moves ?? [];
  const id = active?.moves.map((m) => m.id).find((m) => seen.includes(m)) ?? null;
  return id ? content.moves.get(id)?.name ?? id : null;
}

/** Pokémon Recognition, overhaul form: the rival has seen this species of yours this run (its scouting ledger). */
export const scoutedSpecies = (rec: RivalOverhaulState, speciesId: string | undefined): boolean => !!speciesId && (rec.ledger?.species ?? []).includes(speciesId);

/** Lines for a moment: the doc's own, plus the rival's personality lines of the matching bank context (said lines are not marked used). */
export function bankPool(rec: RivalOverhaulState | undefined, ctx: BankContext, own: readonly string[], seed: string): string[] {
  if (!rec) return [...own];
  const lines = (BANK.personalities[rec.personality] as unknown as Record<BankContext, string[]> | undefined)?.[ctx] ?? [];
  if (lines.length === 0) return [...own];
  return [...own, lines[fnv1a(`${seed}:${ctx}`) % lines.length]!];
}

/** What a moment leaves behind on the overhaul record. */
export function recordRivalMoment(run: RunState, id: string, fighting: Rival | undefined, witness: Rival | undefined): void {
  const rec = recOf(run, fighting);
  if (id === 'rivalInterruption' && witness) {
    // The watcher scouts you: every Pokémon you field today goes into its ledger, and it respects what it saw.
    const w = recOf(run, witness);
    if (w) {
      const ledger = (w.ledger ??= { moves: [], items: [], abilities: [], species: [], turns: 0, switches: 0 });
      for (const m of run.party) if (!ledger.species.includes(m.speciesId) && ledger.species.length < 60) ledger.species.push(m.speciesId);
      bump(w, 'respect', 1);
    }
    return;
  }
  if (!rec) return;
  if (id === 'unfinishedGrudge') bump(rec, 'rivalry', 1);
  if (id === 'rematchReversal') bump(rec, 'respect', 1);
  if (id === 'pokemonRecognition') bump(rec, 'admiration', 1);
}
