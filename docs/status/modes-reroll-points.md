# Modes: Reroll Points (S322)

- Tap the starred Run Quest line on the map to swap it for another open quest. Costs ₽100, then ₽200, ₽300 and so on.
- Core: `rerollRunQuest` / `questRerollCost` in `src/core/quests.ts`. Own seeded stream per reroll count; the count is `run.log.counters.questRerolls`. No save bump.
- Never swaps to a quest that is already done, and does nothing when the quest is done or money is short.
- Test: `tests/unit/questReroll.test.ts`.
- Limit: only the Run Quest line is tappable, not the directive line.
