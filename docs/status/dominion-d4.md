- **DOMINION slice D4, "ranks, Team Types and the Reserve"** (Evil Mode rework, 2026-11-19; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md`, design Part 7, Part 8 and Part 9 A19): the Pokémon Reserve (mockup 11, tab 4) and the Rank Pyramid (mockup 12, P on the Crew File). The Boss hands Pokémon to members by hand (or turns on Auto-Fill), and promotes, demotes or strips members on the 15-rank pyramid.

## What's built
- **Data** (validated with Zod in `schema.ts`, loaded in `data.ts`): `src/data/dominion/pyramid.json` holds the 15 ranks (seats, HQ level, team size, level share, BST cap, Aces, band, what each rank unlocks), the five bands, the cap numbers (BST 600 max, region bonus, Notoriety standing), the promotion and demotion numbers, the Reserve numbers (20 places, Pens, Day 1 Pokémon, trait numbers, release pay), Pokémon Trust (A19) and every report line.
- **Rules** in `src/core/dominion/`:
  - `pyramid.ts`: ranks, seats, bands, level / BST / Ace caps (base + region + standing), the fit check (on-type, level, BST, never-allowed Pokémon, team full), Ready, promote / demote / strip. Members passed over gain Ambition; three passes make them Resentful.
  - `reserve.ts`: the Reserve box (20 places), Day 1's Pokémon of the other Team Type, give (to a member or the Boss), take back (Loyalty −5, −10 for an Ace or a member's own catch), Auto-Fill, "hunts for themselves" vs "for the Reserve", the Pens (stolen Pokémon cool off 5 days, Heat, escapes), offer freedom, Trust (start by source, +1 on wins, weekly for gentle natures, odds bonus at 7+, penalty below 4), evolve-in-peace, and an odds penalty for battle tasks with no usable Pokémon.
  - Off-type catches and steals go to the Reserve (Kice). D3's `crew.stores` moves into the Reserve on first load.
  - Crew tasks now live: Pens watch, Tend, Feed, Release, Rehab (plus Catch now fills the Reserve). **36 of 152 tasks can be played** (was 31).
  - Field plays now live (41 of 150, was 32): rescue a wild Pokémon, tame the wild, evolve in peace, promotion ceremony, mentor, toll booth, cat burglar, back-alley brawl, train robbery. Some need a band (rank group) in the crew.
  - Talks now live: 13 promotion day, 14 passed over, 27 the oath. Formed traits now live: Bug Whisperer, Gentle Hands, Nurturer.
  - Hooks `addOddsHook` / `addTaskKind` in `crew.ts` let later slices add odds and task kinds without import loops.
  - New RNG streams: `dominion-reserve-start`, `dominion-trust`, `dominion-rank`. No old roll moves.
- **Screens**:
  - `src/ui/redux/screens/dominion/reserve.ts` draws both mockups; `src/scenes/dominion/reserveController.ts` keeps their cursors.
  - Reserve keys: arrows pick, Enter gives, W / E change who gets it (Q is left for the command wheel, End for Quit), F fits only, A Auto-Fill, H hunt mode, X set free, Tab team slots (Enter takes back), [ ] box page, Esc HQ.
  - Pyramid keys: arrows pick a member, Enter promotes, D demotes, S strips (press twice), Esc back to the Crew File.
  - Tab 4 is now open. Two icons added (see PROVENANCE.md).

## Round-3 look (mockups-v3)
- `dominion.css` is re-ported from `plans/evil-mode-rework/mockups-v3/index.html` with `tools/dominion/port-mockup-css.py`, so every Dominion screen gets the round-3 chrome (gold rims, foil title, jewel tabs, living buttons, medallions, damask, screws, 3D numbers, the entrance).
- The port tool is the same as in #1491 / #1492 (they carry the v3 fixes), so `dominion.css` comes out identical on every branch: re-run the tool rather than hand-merging.
- The Reserve and the Pyramid also carry their per-screen overlays (haze, bokeh, particles, grade, spotlight, edge glow, frame, sunburst) from `reserveFx.ts`. On the Reserve the spotlight and sunburst follow the picked tile.
- D1-D3 screens get the shared chrome from the CSS but not their own overlays yet (their markup lives in those slices).

## Saves
No version bump. `block.reserve` is optional and filled the same way every time by `withReserve` (seeded on Day 1, stores moved in, missing Trust records added, stale ones dropped), so a D3 save loads unchanged (tested with a D3-era block and with a damaged record).

## Tests
- `tests/unit/dominionReserve.test.ts` (28 tests): data, caps, fit, Day 1, give / take back / Auto-Fill, hunting for themselves, the Pens, Trust, freedom, new tasks, Gentle Hands, promote / passed over / demote / strip, the strip walk-out roll (deterministic), band gates, talks, ceremony and mentor, both screen models, save/reload of a D3 block, a damaged record.
- `dominionField.test.ts` (played count 41) and `dominionCrew.test.ts` (catches go to the Reserve) updated.
- Browser: `tests/e2e/dominionReserve.spec.ts`: tab 4, give to Rook, switch to the Boss, three window sizes, the Pyramid, promote Rook, then reload. `dominionStart.spec.ts` now checks the locked tab with tab 5 (tab 4 is open). dominionStart, dominionCrew and dominionMap pass.

## Limits and what's left
- Moved to D5 (they need HQ rooms): Teach a Move, Safari Patrol, Hatch Eggs, Heal the Team, Breed, and Holding Pens upgrades. The Reserve stays at 20 places until D5.
- Moved: Hire a Specialist to D10, Plant a Mole to D9.
- Not built yet: Train's +10% XP for on-type Pokémon; named recruits' 7-day off-type rule; the Morale hit for "favours a type you don't run"; the Flyer recruit bonus; rivals or the Hero scouting your types (D9, D11).
- The region bonus to caps reads region 0 until D15 adds regions; the Sworn flag's effect waits for D15.
- Disobeying in battle is modelled through job odds, not in the battle engine.
- The Boss's own catches in battle still go to the party (the Reserve only takes crew catches and gifts back).
