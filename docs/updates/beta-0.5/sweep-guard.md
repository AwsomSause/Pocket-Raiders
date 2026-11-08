# Sweep guard (boss AI)
After one of your Pokémon KOs 2 of a Gym Leader's, Elite Four member's, Champion's or Rival's team in a row (and you still have another Pokémon left), each new Pokémon of theirs steels itself: +1 Defence, +1 Sp. Def, +1 Speed. Settings: `balance.trainerAi.sweepGuard` (`kos` 0 = off, `stages`, `stats`). Streak state is the optional `battle.sweep` field (no save bump). The old-seeds story test freezes it off.
- Bench (`tools/sweepbench.ts`, maxed Garchomp + a bench Pokémon vs Leon's Champion team, gear off): sweeps 61% before, 3% with the guard at 2 KOs (43% at 3 KOs). With boss gear on, a solo maxed Garchomp already sweeps 0%.
- A swap-to-resist version was tried first and made sweeps more likely (61% to 78%), so it was dropped.
- Not triggered when your last Pokémon is out.
