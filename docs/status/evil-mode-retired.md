- **Old Evil Mode flow deleted** (2026-11-20, after Dominion D17; Kice's answer on the D17 card: "Delete the old flow entirely"). Dominion is the only Evil Mode now.

## What went
- Code `src/core/evilMode/` (65 files), data `src/data/evilMode/` (27), the scene `EvilScene` and its 15 screens (`src/ui/redux/screens/evil*.ts`, except `evilLooks.ts`, which draws the main game's Hoenn team moments), the old sim `tools/evil-sim.ts` (`npm run sim:evil-old`), 26 unit tests and 23 browser tests, the old Board's phone CSS.
- The `evil-mode` mode in `src/data/runRules.json`; the old Turn card on the map; the old ending on the run-end page (a finished Dominion run's title is used there instead); the old Hall of Fame card in the profile; the settings rows Run length, Dispatch rolls, Fire reminder, Card speed and Shadow branch.
- Kept: the `evilMode` setting (it turns Dominion on in Run Setup; its text now says so), the main game's evil teams (`src/core/evil/`, events, catalog data), and Dominion's own Turn (D16).

## Saves (no version bump)
- Only optional fields went away, and the schemas aren't strict, so nothing needs migrating: a profile with `evilHall` or settings with the old rows load as before, without them.
- A run saved in the old Evil Mode (mode `evil-mode`, or an `expansion.evilMode` block) is reported, never dropped or crashed: `loadRun` returns `incompatible` with "This run was in the old Evil Mode, which Dominion has replaced, so it can't be continued." The main menu shows that and offers "Discard damaged save" (a backup copy is kept).

## Tools
- `tools/dominion/charters-to-json.py` and `regions-to-json.py` used the old data as a source; their notes say how to get it back from git (`git show 8a168fc6:src/data/evilMode/<file>`).

## Tests
- `tests/unit/evilModeRetired.test.ts` (4): the mode is gone from Run Setup; an old Evil Mode run (by mode, by block) is reported with the reason; a plain run and a Dominion run load; an old profile and old settings load without the old fields.
- `settingsRegistry.test.ts`, `milestone9.test.ts`: the old settings rows are gone.
