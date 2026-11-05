// S255 Pokémon idle animations: lively loops for the Pokémon icons on the team screen.
// Pure numbers (a bouncy hop, a sway or a breath, picked per Pokémon from its uid) so the loops differ from one Pokémon
// to the next and always look the same for the same Pokémon. Never touches gameplay RNG.

export type IdleKind = 'hop' | 'sway' | 'breathe';

export interface IdleLoop {
  kind: IdleKind;
  /** Pixels (hop, sway) or scale share (breathe) at the top of the loop. */
  amount: number;
  /** One half-cycle, in ms. */
  half: number;
  /** Wait before the loop starts, so a row of Pokémon do not move together. */
  delay: number;
}

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** The idle loop for a Pokémon. Fainted Pokémon do not move (returns null). */
export function idleLoopFor(uid: string, fainted: boolean): IdleLoop | null {
  if (fainted) return null;
  const h = hash(uid);
  const kind: IdleKind = (['hop', 'sway', 'breathe'] as const)[h % 3]!;
  const half = 420 + (h >>> 3) % 360;
  const delay = (h >>> 9) % 900;
  const amount = kind === 'breathe' ? 0.05 : kind === 'hop' ? 4 : 3;
  return { kind, amount, half, delay };
}
