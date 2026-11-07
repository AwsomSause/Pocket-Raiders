# Story S6: Underdog win hook

- Feat hook was already wired by S7 (`run.ts`, `feat` event into `heartbondTurn`), so nothing more was needed for Feats.
- New: a won battle where the team was outleveled (same test as underdog XP, `underdogXpMultiplier > 1`) pays `underdog_win` to the Heartbond partner. A boss/rival win that is also an underdog win pays only the higher source (`milestone_win`).
- `heartbondVictory(run, key, milestone, underdog)` in `story2/heartbond.ts`; call in `run.ts` win path.
- No save change. Test: `tests/unit/storyHeartbond.test.ts` (27 pass).
- Still not buildable: keepsakes, Embrace level-7 gate, hardcore rule.
