# Boss and rival gear (anti-sweep)
Gym Leaders, Elite Four, Champions and Rivals now get held items, IVs, EVs and training like a player's team (`src/core/bossGear.ts`, applied when the fight is built in `run.ts`). No save change; no RNG.
- Tiers: gym (IV 20, EV 128, training 1), elite (26, 192, 2), champion and rival (31, 252, 3 = the vitamin cap).
- Items picked per Pokémon (lead fast mon: Focus Sash, ace: Life Orb, bulky: Leftovers, special tank: Assault Vest, else Muscle Band/Wise Glasses/Sitrus). Champions and Rivals mirror the player's items per Pokémon (1 to 3). Items already set by boss bands or strategy are kept.
- Bench (`tools/sweepbench.ts`): a maxed Garchomp alone vs Leon's Champion team swept 61% before, 0% after.
- Limit: a full-party win-rate check across regions is still to do; numbers may need easing.
