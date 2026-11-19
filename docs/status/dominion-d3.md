- **DOMINION slice D3, "the crew"** (Evil Mode rework, 2026-11-19; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md`, design Part 2, Part 9 A16-A18 and A24): the Morning (mockup 2) and the Crew File (mockup 5). Each morning the player reads the night's report, answers any talk card, and gives every member a task for the night; tab 3 (Roster) opens the Crew File, where they can hire Grunts, pitch leads, give gifts, ask for an Evening talk and bail a jailed member.

## What's built
- **Data** (validated with Zod in `schema.ts`, loaded in `data.ts`):
  - `src/data/dominion/tasks.json`: all 150 crew tasks from `lists/team-actions.md`, word for word, plus `rest` and `steal-pokemon`.
  - `src/data/dominion/gruntTypes.json`: all 150 grunt types from `lists/grunt-types.md`.
  - Both files are made by `tools/dominion/lists-to-json.py` (run it again if the lists change).
  - `src/data/dominion/crew.json`: ranks and wages, every rule number, the six quick tasks, Green / Formed / signature traits, motives, Patrons, the A24 refusals for nine regions, recruiting (pitches, 24 adult classes, names), Hire Grunt, report lines and the talks.
- **Rules** in `src/core/dominion/`:
  - `crew.ts`: member stats, Loyalty, Morale, Motive, personal Heat, Fatigue (A18), XP and task levels, odds, the crew World Turn step (`addWorldStep('crew')`, replacing D1's guard line), arrests and bail, thieves, weekly pay and motive effects, disloyal members leaving, and Green traits growing into Formed traits.
  - `recruit.ts`: leads from the Recruit task, pitches and their odds, the waiting list, Hire Grunt (three a day, C/U/R), the A24 refusals and Patrons (A16).
  - `talk.ts`: talk cards. Morning cards are dealt by the crew step; Evening cards are asked for with T. At most two a day, no repeats within seven days.
  - `crewScreens.ts`: view models for both screens.
  - New RNG streams: `dominion-crew`, `dominion-internal`, `dominion-recruit`, `dominion-hire`. No old roll moves.
- **Screens**:
  - `src/ui/redux/screens/dominion/crew.ts` draws the Morning, the Crew File (with the stat web), the talk card, and the Hire and Leads overlays.
  - `src/scenes/dominion/crewController.ts` keeps their cursors. DominionScene only forwards to it.
  - Keys: arrows and Enter assign tasks or answer talks; M opens the full task list; 3 opens the Crew File and 1 or Esc goes back; T, G, H, R and B work on the Crew File.
  - 12 new icons in `public/assets/images/dominion/` (see PROVENANCE.md).

## Saves
No version bump. `member.crew` and `block.crew` are optional and filled in the same way every time by `withCrew` / `crewOf`, so a D1 save loads unchanged (tested). Work that needs the run (new members' Pokémon, levels, the Bag) waits in `crew.pending` and is settled right after the step.

## Lists: how much is in
- Crew tasks: all 150 are in the data. **31 can be played now.** The other 119 are switched off, and each one names the slice it waits for (D2, D4, D5, D6, D8-D11, D14 or D15) and shows that on the full list.
- Grunt types: all 150 are in. Three of them name rules rather than species, so they get team-type Pokémon instead.
- Internal interactions: **batch 1 (talks 1-30) is in**. Talks 7, 13, 14 and 27 wait for D2/D4. **270 talks are left for later slices.**
- Formed traits: 12 from Part 2 plus 42 from the list. Ones whose effect needs a later slice say so.

## Tests
- `tests/unit/dominionCrew.test.ts` (30 tests): the lists as data, members and odds, the crew step (deterministic, money, Fatigue and Rest, arrests and bail), traits growing, recruiting, hiring and full HQ, talks, A24, Patrons, screens, and save/reload.
- `tests/unit/dominionStart.test.ts` (21 tests) still passes, with the guard line updated.
- Browser:
  - `tests/e2e/dominionCrew.spec.ts`: Crew File, hire, Morning talk, assign Rest, three window sizes, then reload.
  - `tests/e2e/dominionStart.spec.ts`: updated for the Morning screen and tab 4.

## Limits (by plan)
- The Tension badge shows Heat until D9 adds Tension.
- Patrons need Notoriety. Until D6, Notoriety is just the number of members, so Patrons rarely show.
- These wait for D2's fight bridge: sparring with the Boss, the recruit test battle, and double XP for a member "coming with you".
- Gifting a Pokémon to a member waits for D4.
- Off-type Pokémon from hiring go to `crew.stores` until D4's Reserve.
