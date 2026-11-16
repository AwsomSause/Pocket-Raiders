// gn.new.35 The Storyteller's Road: the Slowking's "Twice-Told". The first move a foe uses against it in a battle is 20% weaker the
// second time it is used. State lives in `battle.extra.twiceTold` (target uid -> that first move and how often it has been used). Pure, no RNG.
export const TWICE_TOLD_MARK = 'twice-told';
export const TWICE_TOLD_POWER = 0.8;

export type TwiceToldStore = Record<string, { move: string; n: number }>;

/** The power multiplier for `moveId` landing on a Pokémon that carries the mark (`gn` marks of the target). */
export function twiceToldPower(store: TwiceToldStore, targetUid: string, targetMarks: readonly string[] | undefined, moveId: string): number {
  if (!targetMarks?.includes(TWICE_TOLD_MARK)) return 1;
  const seen = store[targetUid];
  if (!seen) {
    store[targetUid] = { move: moveId, n: 1 };
    return 1;
  }
  if (seen.move !== moveId) return 1;
  seen.n += 1;
  return seen.n >= 2 ? TWICE_TOLD_POWER : 1;
}
