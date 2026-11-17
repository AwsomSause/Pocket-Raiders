# Enemy heal cap + scaling
- All enemy trainers (ordinary, gym, E4, rival, champion) use at most `balance.trainerAi.maxHealItems` (4) healing items per battle. Potions, Full Restores and Revives all count (`battle.enemyItemsUsed`).
- The potion scales by region: `trainerAi.healTiers` (Potion 25%, Super 35%, Hyper 50%, Hyper 60% from region 4). `BattleContext.foeHealTier` = run.regionIndex.
- Existing per-class caps (healCaps) still apply under the 4 cap. No save change (ctx field, not saved).
- Test: tests/unit/enemyHealCap.test.ts.
- Difficulty keeps its edge: `runRules.json` difficulties have `enemyHeal` (0.7 casual .. 1.6 mythic) multiplying the potion's share of max HP; harder presets heal more per item, never use more than 4.
- Tiers set to Potion 20%, Super 30%, Hyper 45%, Hyper 60%. Re-pinned STORY1/2/5/6/8 fingerprints.
