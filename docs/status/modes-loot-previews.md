# Modes: Loot Previews (S320)

- The map Items menu shows a "Loot Preview" row: the chance of each rarity in the reward draft after the next gym leader.
- Core: `bossLootPreview` in `src/core/run.ts`. It reads the same boss weights plus your luck as the real draft; a sum only, no gameplay roll, no save change.
- Test: `tests/unit/lootPreview.test.ts`.
- Limit: shows rarity odds, not exact items (the draft is rolled after the battle).
