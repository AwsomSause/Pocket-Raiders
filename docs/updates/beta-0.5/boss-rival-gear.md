# Boss and rival gear (anti-sweep)
Gym Leaders, Elite Four, Champions and Rivals now get held items, IVs, EVs and training like a player's team (`src/core/bossGear.ts`, applied when the fight is built in `run.ts`). No save change; no RNG.
- Tiers: gym (IV 20, EV 128, training 1), elite (26, 192, 2), champion and rival (31, 192, 2; first tried 252 and 3 stacks, which made Region 1 Champions unwinnable for a trained random party).
- Items picked per Pokémon (lead fast mon: Focus Sash, ace: Life Orb, bulky: Leftovers, special tank: Assault Vest, else Muscle Band/Wise Glasses/Sitrus). Champions and Rivals mirror the player's items per Pokémon (1 to 3). Items already set by boss bands or strategy are kept.
- Bench (`tools/sweepbench.ts`): a maxed Garchomp alone vs Leon's Champion team swept 61% before, 0% after.
- Limit: a full-party win-rate check across regions is still to do; numbers may need easing.

## Win rates (tools/wincurve.ts, random trained party, 20 trials per slot, before gear / after)
R1: gym 96/88, Elite 100/65, Champion 75/25. R2: gym 86/65, Champion 65/10. R3: gym 67/40, Champion 30/15. R5: gym 44/25, Champion 5/0. R10: gym 28/29, Champion 10/30.
The sim party plays no tactics, so real players do better. Later regions are already very hard for it (check separately).

## Switch
`balance.bossGear` (default true) turns the gear off; the "old seeds play exactly as before" test in story.test.ts freezes it off (it fixed the STORY1/0 fingerprint change from #1122).
