# S7c: the 74 Remembrance lines

- `src/data/story/remembrances.json` now holds all 74 lines from Design v2 Part II "The roster" (was 12): 27 starters, 10 pseudo-legendaries, 6 early/baby lines (Tuftin -> Eevee included), 9 regional birds (Hoothoot, Taillow and Wattrel end in the S15 species Oracowl, Tempestwing, Megawattrel) and 22 others. Rarity counts match the design: 32 Familiar, 20 Unusual, 12 Rare, 10 Exceptional.
- Source: `tools/story/remembrance-roster.tsv` (one row a line: stages, rarity, role, Core Temperament, primary traits, unlock route). `node tools/story/build-remembrances.mjs` rebuilds the JSON and keeps the 12 older entries' ids, unlocks, moves and keystones (the backstory modules point at them), then `npm run data:story`.
- Quiz pool: the 52 Familiar and Unusual lines (`quizEligible`), affinity 3/3/2 on the three primary traits. Rare and Exceptional lines are not in the quiz; their unlock is `win` with the design's route name (the routes' events are not authored yet).
- Schema: `rarity` added to a Remembrance; `line` and `moves` now take game ids with hyphens (`nidoran-f`, `leech-seed`).
- Branching lines (Eevee, Poliwag, Oddish, Ralts) list one path; the other branch is not a separate entry. Hisuian variants are not separate entries.
- All 74 are status `limited` (no signature moves or arcs yet). Tests: `storyRemembrances.test.ts` (closed list of 74, 1 to 3 real stages, rarity counts, quiz gives 3 distinct picks from the real pool 500 times).
