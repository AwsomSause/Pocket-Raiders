// Sabrina's Labyrinth (Beta 0.7): the false move slot. Each turn one of the ghost's move slots lies: it shows its own move and
// does another. Every second turn the companion "sees true" and marks it. Pure and seed-free: the slot is a function of the
// turn number and the Pokémon, so the screen, the AI and a reloaded save always agree and no gameplay roll is spent.

export interface FalseSlot {
  /** The slot that lies. */
  slot: number;
  /** The slot whose move it really uses. */
  to: number;
  /** True on every second turn: the companion has marked the lie. */
  seen: boolean;
}

const sum = (s: string) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 9973, 7);

/** The lying slot for this turn, or null when the Pokémon has fewer than two moves. `usable` marks slots with PP left. */
export function falseSlotFor(turn: number, uid: string, moveCount: number, usable: readonly boolean[] = []): FalseSlot | null {
  if (moveCount < 2) return null;
  const k = (sum(uid) + turn * 7) % moveCount;
  const step = 1 + ((turn + sum(uid)) % (moveCount - 1));
  let to = (k + step) % moveCount;
  for (let i = 0; i < moveCount && usable.length && usable[to] === false; i++) to = (to + 1) % moveCount;
  if (to === k) return null;
  return { slot: k, to, seen: turn % 2 === 0 };
}
