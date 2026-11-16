# Eight more Legendary Blessings (Lugia, Latias, Heatran, Thundurus, Landorus, Reshiram, Zekrom, Kyurem)

Built 2026-11-16 from `expanded_notes/LEGENDARY_BLESSINGS.md`. Data `src/data/blessings.json`; rules `src/core/blessings/index.ts`; tests `tests/unit/blessingsEight.test.ts`. All eight are rolled at run start (no save bump: the new blessing fields are optional). The roster grows, so a new run's rolled blessing can differ from before for the same seed; saved runs keep theirs.

| Blessing | Built | Communion | Rite |
|---|---|---|---|
| Lugia, Guardian of the Sea (greater) | **Calm** on the battle menu, once per stage, free action: clears weather, terrain, all stat stages | the Calm keeps your own boosts | not built (the Song) |
| Latias, Glass Wing (greater) | map previews show the lead of every wild/trainer battle ahead | whole team | not built |
| Heatran, Magma Heart (greater) | first Fire move at your side each battle absorbed, target +1 Sp. Atk (perk `fireAbsorbFirst`) | not built (ore, hazards) | not built |
| Thundurus, The Bolt (greater) | status moves +1 priority on turn 1 (`statusPriorityTurns`) | turns 1-2 | **built**: next trainer battle's lead starts paralysed |
| Landorus, Abundant Land (greater) | boss and rival battles: foe lead -1 Atk (`foeLeadStages`) | also -1 Sp. Atk | not built |
| Reshiram, The Truth (divine) | event choices show their outcome (same as Insight items) | foe's first move shown (`foeMovePreview`) | not built |
| Zekrom, The Ideal (divine) | vow picked on the opening screen; kept = +10% stats | 15% | **built**: holds the vow once, by itself |
| Kyurem, Empty Vessel (primordial) | empty until the first Sign of another Legendary; then a weaker copy (perk bonuses halved) | catching Kyurem gives the copy's Rite only | copy's Rite |

Keys (row A): Thundurus at Influence 5 also earns the Works Key; Kyurem at Influence 5 earns the Light and Dark Stones. The rest already read `blessing-<legend>` flags.

Known limits: Zekrom's third vow (refuse no one who asks) not built; vow breaks on release/trade (recorded ones) and on dealing the first damage of a trainer battle. Calm, Magma Heart and Landorus work in single battles only. Reshiram does not mark lying speakers.
