- **Evil Mode slice 1, "the shell"** (2026-11-17, build plan `/mnt/project-files/plans/evil-mode/31_THE_BUILD_PLAN.md` section 3): with Settings > Gameplay > Evil Mode on (off by default), Run Setup offers the mode; after the starter you found a team on five pages (Boss, name, Creed, Line, Doctrine, then a summary and "Found it") and press through an empty day of six beats, saved at every beat.

## What's built
- Core `src/core/evilMode/`: `schema.ts` (data schemas, the save block `run.expansion.evilMode` with `team`, `here`, `draws`, `applied`, block `v: 1`), `data.ts`, `start.ts` (name check, Line's lit methods, founding to the first morning by Creed and Line, Loyalty band), `day.ts` (six beats, `step(block, action)`, cues), `screens.ts` (view models), `session.ts` (run-level founding and stepping). No Phaser, no randomness.
- Data `src/data/evilMode/`: `creeds.json` (6), `doctrines.json` (8, Kanto pools), `methods.json` (7), `founding.json` (opening lines, name lists, taken names, Lines, bands, beat words). Text is data.
- Mode `evil-mode` in `runRules.json` with `gate: "evilMode"` (`offeredModes` in `core/rules.ts`): listed only while the setting is on; a remembered pick with the setting off plays Standard. `progressionEligible: false`.
- Screen `EvilScene` + view `src/ui/redux/screens/evilFounding.ts`, New look only: with Old selected the New layer is mounted for this screen and one line says so; the setting is not changed. Top strip (Funds, Heat lamps, Loyalty word, Regard, Dread; Corruption only above 0), corner chip ("Kanto · District 1 · Day N"), beat strip with its one button. Esc saves and leaves.
- Settings: `expansion.evilMode` (default off) and `expansion.evilRunLength` (Three; Six stays locked until six regions exist, slice 19).

## Saves
No save-version bump: the block and both settings keys are optional with defaults, as with every other `run.expansion` block. A run or settings file saved before this loads unchanged (tested). The block has its own `v` for later slices.

## Tests
`tests/unit/evilModeShell.test.ts` (32 with the touched settings and run-prep tests): first state from each Creed; schema rejects each removed field; name check normal/boundary/failure; Line methods; day loop, wrong action does nothing, replay; save at each beat and reload; pre-mode run and settings load unchanged; damaged block refused; mode gate. Browser `tests/e2e/evilModeShell.spec.ts`: found a team in the New look and press a day round, reload continues; Old look mounts the New layer, setting unchanged; setting off = no Evil Mode.

## Limits (slice 1, by plan)
- No Look, Patron or first-region page: the team is cream and green, has no Patron, and is in Kanto. No Omen, no Charters tab.
- The Cause sentence and Target (second step on the Creed page for Cause and Spite) are not built; those two Creeds are `limited` in data.
- Beats are empty: no Board, jobs, people, Hero chip, region-rule chip or Ledger; a done beat can't be opened to look back. Day count has no district length yet.
- Founding progress isn't saved until "Found it": leaving mid-founding returns to page 1 on Continue.
- The run skips the campaign briefing and the Blessing plinth (the Blessing is still rolled with the run).
- No name filter exists in the game yet; the check is letters, length, taken names and a vowel.
