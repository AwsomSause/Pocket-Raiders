# Choice Items 2.0 (S429)

New held item Lock Breaker (hook `choiceBreak`, 10% max HP). A Pokémon holding it and a Choice Band, Specs or Scarf may pick a different move than its lock: the move list stops greying the others out, the holder pays 10% of its max HP (never to a faint; at 1 HP the lock holds), and the new move becomes the lock. Without a Lock Breaker nothing changes. Event line: "breaks its Choice lock!".
Code: `choiceBreakCost` in `battle/held.ts`, the lock block in `battle/engine.ts` (`resolveTurn`), `battle/moveBlock.ts`. Test: `tests/unit/lockBreaker.test.ts`. No save change.
Not done: a custom icon (reuses the Choice Band's), and a way to find it other than the usual item drops.
