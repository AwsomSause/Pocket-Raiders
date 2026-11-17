# Evil Mode slice 17: the long cast

- **Evil Mode slice 17, "the long cast"** (2026-11-17, build plan `/mnt/project-files/plans/evil-mode/31_THE_BUILD_PLAN.md` section 3; design Parts 10a, 10b, 10c, 11): applicants for Johto and Hoenn, everyone's own quest, Ask to stay, and the mole. Built on slice 16 (#1470).

## What's built
- **The long cast** (`src/data/evilMode/people.json`, `faces.json`): twelve Johto and twelve Hoenn applicants (Miyu is a minor) and thirteen specials who arrive only when something happened in the run (the first Take, a raid survived, the Hero beaten, and so on). Founders are drawn only in the first region; each later region draws its own deck. 65 people, every one with a face.
- **Quests** (`src/core/evilMode/quest.ts`, `quests.json`): eight shapes, three steps each, written for the sixteen founders and three newer people; others follow their shape. A quest opens at Loyalty 7 (or "Why us?" at hiring). Each step takes that person's day for nothing ("Gives: Nothing"), a district apart; boss steps go at In person. The Boss picks the ending; done pins Loyalty at 10 and greys the flaw. Unfinished at the Crossing: failed, with a line, and Loyalty never above 7 after.
- **Ask to stay** (Loyalty 1-2): reasons on their card, greyed ones say why; once per person; the answer rolls on `evil-mole`.
- **The mole** (`src/core/evilMode/mole.ts`, `mole.json`, stream `evil-mole`, ON by default): a handler (police, neighbour, local, the Hero's mother), a marked applicant from District 2 (never a minor; refused = never the mole), reports at each district's end (the police's: Heat +1 "reason not known"), six tells pinned as slips (innocents show them too), the Patron's warning once. The Office at Night: name them (wrong costs Loyalty 4, a minor leaves, a second wrong caps Loyalty at 8 for the region), feed them a false job at Dispatch, the knock at Loyalty 8. Four outcomes: turned, let go, kept, stopped by a quest.
- **Three more ways to leave**: poached (by a standing neighbour, Loyalty under 3), quest (their ending took them), sent (let go from the Office).
- **Screens (New look)**: quest line and step/ending buttons on the Roster; Suspicions page (key J, or the tag on the board); the Office scene. No screen reads who the mole is.

## Saves
- Evil block **15 -> 16**: adds `quests` (empty) and `mole` (empty). Test in `tests/unit/evilModeLongCast.test.ts`.

## Tests
`tests/unit/evilModeLongCast.test.ts` (22): deck counts and faces; founders first region only; nobody twice; every quest finishable, steps a district apart, Loyalty pinned at 10; wrong beat has a line; failed at the Crossing caps 7; Ask to stay once; same seed same mark, never a minor, refused never the mole; mole Off: the draw's taken and ignored, odds and Heat untouched, streets the same; wrong name never changes the real mole; found, let go = sent; turned neighbour, mother never turns; knock once at 8; feed once a district; Suspicions page identical whoever the mole is; v15 -> v16; a region replays. All 16 Evil unit files pass (426). Browser `tests/e2e/evilModeLongCast.spec.ts` (3): quest step by tap; J opens Suspicions with no "mole" on it; the knock answered by tap; screenshots at three sizes.

## Limits
- Applicants for three regions only, until slices 19/20 (the plan's limit).
- The neighbour's mole expects Take jobs (war jobs aren't built). The detective special never arrives (no detective yet). The knock is its own Office scene. Not built: Sioned's contract rules, the Sunday custom, the rose garden, raids using what the mole reported, the Hero's mother's letters.
- Undo: set `"on": false` in `src/data/evilMode/mole.json` (the mole); quests and new applicants stay.
