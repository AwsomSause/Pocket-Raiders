# Evil Mode slice 15: the endings

- **Evil Mode slice 15, "the endings"** (2026-11-17, build plan `/mnt/project-files/plans/evil-mode/31_THE_BUILD_PLAN.md` section 3; design Part 23, Part 22's Finales): a run now finishes, six ways. Built on slices 12 (#1464) and 14 (#1459), merged together on this branch.

## What's built
- Data `src/data/evilMode/endings.json` (validated by `EndingsFileSchema`): the six endings' names and scenes, the six Finales, the walk out, the court's count and its five bands, the Ledger's last page, the run-end cards, the Plateau's four and its Champion, the pay table, and the banned words (no line ranks an ending). `"on": false` is the undo: no ending begins, and the run plays to the Reckoning as before.
- Core `src/core/evilMode/endings.ts`:
  - **The order** (Part 23 section 1.1), checked after every step: Caught (a Raid at Heat 10 on a base with no back way) first; then the pressed ones (Going Straight, the Hand-Off, walking into the station); then the Scheme (the Moment's morning, ready) and the Last Room (the region's end). **One ending a run** (`ending:<id>` in `applied`).
  - **The six**: the Scheme (each Creed's Finale, clean/cracked/wrong/dirty; That Evening; Monday; the Hero late; the Hero's minute with no text box), the Last Room (by how the room went: Boss won, Hero won, talked, let past, a draw, the window, away, alone; the walk out, one line each), Going Straight (the knock and its answers; the first day), the Hand-Off (the heir list: never a minor, never under Loyalty 5; Otis and Obadiah say no; the line typed to them), the Recruit (the Plateau's four and the Champion as real battles, fight kind `ending`), Caught (the courtroom and **the count**, line by line, then the band; the cells; the detective's last line, typed).
  - **The pay** is the same for every ending at the same distance (the run, regions crossed, districts played, holdings held). Evil Mode isn't progression-eligible, so it's shown, not banked.
  - **The Hall of Fame card**: the one thing the mode writes to the profile, once, at the run's end.
- Wiring: `step` gates everything but the ending's own scenes once one has begun (`endAct`, `endPress`, `battleResult`); "Walk into the station" at the Raid's warning now begins Caught; the autoplayer reads an ending to its last page. `GameSession.evilFinish` ends the run (`victory` false for all six) and the ordinary run-end page shows the ending's name, the Ledger's page, the pay and the cards.
- Screen (New look): the ending holds the Road page (`data-mode="ending"`, Esc doesn't leave), one scene at a time, a typed line where a scene asks one, then the Ledger's last page and the cards, then "The run-end page". The pressed endings are on the Road page (O) at Night, and Walk in from Heat 6, each with why it isn't open yet.

## Saves
- Profile **20 -> 21**: one new field, `evilHall` (empty for old profiles). Tested in `tests/unit/evilModeEndings.test.ts`.
- Evil block **13 -> 14**: `ending: null`. Earlier evil tests now expect v14.

## Tests
`tests/unit/evilModeEndings.test.ts` (22): every ending reachable and played to its last page by the autoplayer (Kanto reaches the Last Room on its own); one ending a run; Caught beats a pressed button; the region rules; Going Straight's button rules; the heir list; equal pay; minors' cards read Home in every ending; no ranking words; the screens' ids; the count on five fixtures, one per band, walking in −2 and the Ledger −2 more; minors never called; the Hall card written once with one field; profile v20 -> v21; block v13 -> v14 and a mid-scene reload. Browser `tests/e2e/evilModeEndings.spec.ts`: walk into the station, Enter through the count, type the detective's line, the run-end page, one Hall card; screenshots at three sizes.

## Limits
- With one region written, the Hand-Off and the Recruit are reachable only by fixture (the plan's limit); Kanto is always the last region.
- Simplified: Wonder's catch choice and Cause's tap-five are three framed choices; the Mutiny, the mole, Rose and Pen-door rows of the tables aren't drawn (their slices aren't built); the Plateau's battles use Kanto's Elite Four and Champion species at fixed offsets.
- The simulator doesn't report endings yet.
