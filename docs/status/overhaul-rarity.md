# Overhaul slice 10: 8-tier rarity

- Species rarity now has 8 tiers (common, uncommon, rare, veryRare, epic, legendary, mythical, special) in `src/data/rarity.json`, read by `src/core/rarity.ts` (`rarityOf`). The sheet's six tiers map 1:1; Epic comes from `speciesOverrides` (pseudo-legendaries, Ultra Beasts, Paradox); Gigantamax forms sit one tier rarer; a condition or region evolution sits one tier rarer (never past Epic by shifting).
- Odds: `balance.availability.rarityWeights` (8 tiers, Special is 0-capable) feed wild, trainer, fishing and raid pools through `gatePool`; `eggRarityWeights` feed Mystery Eggs and Plaza egg traders (`pickEggSpecies`, one roll). Mythical and Special never roll in ordinary wild encounters; Legendary/Mythical/Special never come out of eggs.
- Shiny stays a separate property (eggs.json `shinyMultiplier`), not a tier.
- Limits: off-region rarity for regional forms and trade/shop/reward tier caps are not wired yet (config has the hooks); Mystery Egg and Plaza egg picks are now weighted, so their seeded results differ from before for new runs.
- Tests: `tests/unit/rarity.test.ts`. No save version change.
