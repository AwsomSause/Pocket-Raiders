# Daily Run: set final boss (W13)

Built: the Daily Run's champion is now fixed by the date (`dailyChampionId` in `core/daily.ts`, hashed from the daily seed, any region's champion list, never the gameplay RNG). `enterLeague` swaps it in and logs it in the role cast; Run Prep's Daily lines name it. Draft Lab, Regional Circuit (with region choice) and Spooky content already existed (see `sweep-d-*.md`). Tests in `tests/unit/daily.test.ts`. No save bump.
Limits: no archived retries of past dailies; Spooky has no mode-specific NPCs or festival tie-in yet.
