- **Evil Mode slice 9, "a region"** (2026-11-17, build plan `/mnt/project-files/plans/evil-mode/31_THE_BUILD_PLAN.md` section 3; design Part 2, Part 9, Part 26a, Part 30 section 14.1): the player can play Kanto from the first Morning to a soft finish: the Arrival, six districts in order with the Road between them, and a three-day Reckoning that can't end the run. **The Evil Mode setting now defaults to on.**

## What's built
- Data `src/data/evilMode/region.json` (validated in `schema.ts` `RegionFileSchema`): Kanto's ticket, rule ("Everything's owned": Pay odds +10, a Take on a deeded holding Heat +1), deed share, homes; the eight other regions listed on the ticket page but disabled (with what they wait on); the Arrival (3–4 days, Lean/Take/Expose shut, one squad, Brock untouchable); the Reckoning (three days); the Road, drift (one in six), tally labels; Part 2's twelve "ways it can go wrong", each with its way forward and a status; six Patrons; the Look's lists.
- `district.json`: eight Kanto stage rows (Pewter, Cerulean, Vermilion, Celadon's tower of 5 floors, Fuchsia, Saffron's Silph of 11 floors, Cinnabar, Viridian), the new **floor** holding (held from the bottom), and Kanto's eight locals of its own (Mr. Fuji can't be Leaned on or Taken from).
- Core: `regionRule.ts` (the region-rule hook: modifiers from data, region then Patron, adds before scales; doors that name who shut them), `region.ts` (stages, the tally, the Road, an Officer left behind, past districts paying, drift on its own stream `evil-drift`, the double-back, recall, the Reckoning). `step` takes `toRoad`, `goOn {stay}` and `recall`.
- Founding: three new pages, the Look (eight rows that turn and wrap), the Patron, the first region (nine tickets, only Kanto open).
- Screens (New look only): region chips on the frame (region · stage · day, the rule, the Champion Patron's next-Gym chip), the tally, the Road (stay / nobody / recall), "the region's over".
- Simulator: `src/core/evilMode/autoplay.ts` and `tools/evil-sim.ts` (`npm run sim:evil -- 1000 docs/reports/evil-sim-kanto.md`). Report: `docs/reports/evil-sim-kanto.md` (1,000 Kantos for each of three policies; all finish, about 37–45 days).

## Saves
The block's own version goes 7 to 8 (no run/settings bump). `migrateEvilBlock` turns a saved district n into its stage (n+1) and adds the region state. Tested in `tests/unit/evilModeRegion.test.ts`. Take the next number on rebase if another slice bumps first.

## Tests
`tests/unit/evilModeRegion.test.ts` (25): the data, Look/Patron/region pages, only Pay's odds and a deeded Take's Heat change with the rule on, floors and Fuji, the Road with and without an Officer, drift on its stream and after a reload, the double-back, the tally, the Reckoning can't end the run, every way-forward row, v7 -> v8, a whole region replays from its action list. Earlier slices' tests now found at stage 2 (District 1). Browser `tests/e2e/evilModeRegion.spec.ts`: Arrival to tally to Road (reload keeps the Road) to District 1 with an Officer left, at three sizes; `evilModeShell.spec.ts` walks the three new pages.

## Limits
- One region (by plan). The Reckoning has no last room; "the region's over" waits for the Crossing (slice 16).
- The economy is slice 11: Funds only grow in the simulator; no Rackets, Fronts, upkeep or bankruptcy yet.
- Not yet: the garrison, an Officer's "write" at Night (their letter arrives, but there's no action to answer), Saffron sealing, a floor's "lift" Take, the top floor as a neighbour's.
- Patrons: the Leader's Gym in region 2, the Professor's free room and the Champion's battle wait for later slices; their rule mods work.
- Turn the setting's default back to off to undo the "on by default" part.
