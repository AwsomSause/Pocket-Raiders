// Beta 0.6 slice E1 (part 1): variant-line rules as pure functions. Kanto's line is Black-Label, rule "Tagged".
// A variant line is a small rule carried by special Pokémon (data: src/data/expansion/variantLines.json). The engine asks
// these functions at its hook points (onHit, forced switch, item removal, battle end); nothing here reads the RNG or Phaser.
// Plan limits: a line's damage effect is at most 20% and counts in the +30% cap.

export const VARIANT_DAMAGE_CAP = 0.2;

/** Per-battle state of one tagged Pokémon. */
export interface TaggedState {
  /** The tag is still on. */
  tagged: boolean;
  /** Its first hit this battle has been taken. */
  firstHitTaken: boolean;
}
export const newTagged = (): TaggedState => ({ tagged: true, firstHitTaken: false });

/** Tagged: the first hit each battle does 20% less. Returns the damage multiplier and whether to announce it. */
export function taggedHit(state: TaggedState): { multiplier: number; message: string | null } {
  if (!state.tagged || state.firstHitTaken) return { multiplier: 1, message: null };
  state.firstHitTaken = true;
  return { multiplier: 1 - VARIANT_DAMAGE_CAP, message: 'The tag holds it in place.' };
}

/** Tagged: cannot be forced to switch out (Roar, Whirlwind, Dragon Tail, Circle Throw, Red Card, Eject Button on the foe...). */
export const taggedBlocksForcedSwitch = (state: TaggedState): boolean => state.tagged;

/** Knock Off or Thief takes the tag off. Returns the announcement the first time. */
export function taggedItemMoveHit(state: TaggedState, moveId: string): string | null {
  if (!state.tagged || (moveId !== 'knock-off' && moveId !== 'thief')) return null;
  state.tagged = false;
  return 'The tag is torn off!';
}

/** Winning the battle, catching or freeing the Pokémon removes the rule (it keeps its signature trait). */
export function taggedEnd(state: TaggedState): void {
  state.tagged = false;
}
