// Overhaul slices 27-28: Mega signature moves. A Mega Evolved Pokémon of yours gets one extra move, tied to
// its Mega form (src/data/megaMoves.json, built from tools/data/mega-roster.tsv). It sits in an extra slot like
// the Hyper slot, never replaces a normal move, and goes away when the battle ends (revertTransformations).
// Pure: it only changes the Pokémon it is given, and uses no randomness.

import type { Content } from '../contentSchema';
import type { PokemonInstance } from '../state';
import megaMovesJson from '../../data/megaMoves.json';

const BY_FORM: Readonly<Record<string, string>> = megaMovesJson.byForm;

/** The signature move of a Mega form, or null when it has none (yet). */
export function megaMoveFor(content: Content, formId: string): string | null {
  const id = BY_FORM[formId];
  return id && content.moves.has(id) ? id : null;
}

/** Adds the signature move for the Pokémon's current Mega form, once. Returns the move id when it was added. */
export function grantMegaMove(content: Content, mon: PokemonInstance): string | null {
  const id = megaMoveFor(content, mon.speciesId);
  if (!id || mon.moves.some((m) => m.megaSig && m.id === id)) return null;
  // A Pokémon already knowing the move as a normal move does not get it twice.
  if (mon.moves.some((m) => m.id === id)) return null;
  mon.moves.push({ id, pp: content.moves.get(id)!.pp, megaSig: true });
  return id;
}

/** Takes every signature move away (the battle is over). */
export function endMegaMoves(party: readonly PokemonInstance[]): void {
  for (const mon of party) if (mon.moves.some((m) => m.megaSig)) mon.moves = mon.moves.filter((m) => !m.megaSig);
}
