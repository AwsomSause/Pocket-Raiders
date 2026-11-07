# Daily Run: set final boss (W13)

Built: the Daily Run's champion is now fixed by the date (`dailyChampionId` in `core/daily.ts`, hashed from the daily seed, any region's champion list, never the gameplay RNG). `enterLeague` swaps it in and logs it in the role cast; Run Prep's Daily lines name it. Draft Lab, Regional Circuit (with region choice) and Spooky content already existed (see `sweep-d-*.md`). Tests in `tests/unit/daily.test.ts`. No save bump.
Limits: no archived retries of past dailies; Spooky has no mode-specific NPCs or festival tie-in yet.

## Follow-up (W13)
- Daily practice: Run Prep has a "Daily date" row (Daily Run only) to replay any of the last 6 days (`dailyDate`, `PRACTICE_DAYS` in `core/daily.ts`). Practice pays no account rewards and never claims the day.
- Spooky festival: two Autumn-only Spooky events (`spooky-lantern-festival` gives a clue, `spooky-costume-judge` pays money). The Medium, Pale Visitor and Keeper NPCs already existed.
- Still not built: a festival calendar beyond Autumn, a practice leaderboard.
