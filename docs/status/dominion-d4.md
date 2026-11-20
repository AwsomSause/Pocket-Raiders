- **DOMINION slice D4, "ranks, Team Types and the Reserve"** (Evil Mode rework, 2026-11-19; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md`, design Part 7, Part 8 and Part 9 A19): the Pokémon Reserve (mockup 11, tab 4) and the Rank Pyramid (mockup 12, P on the Crew File). The Boss hands Pokémon to members by hand (or turns on Auto-Fill), and promotes, demotes or strips members on the 15-rank pyramid.

## What's built
- **Data** (validated with Zod in `schema.ts`, loaded in `data.ts`): `src/data/dominion/pyramid.json` holds the 15 ranks (seats, HQ level, team size, level share, BST cap, Aces, band, what each rank unlocks), the five bands, the cap numbers (BST 600 max, region bonus, Notoriety standing), the promotion and demotion numbers, the Reserve numbers (20 places, Pens, Day 1 Pokémon, trait numbers, release pay), Pokémon Trust (A19) and every report line.
- **Rules** in `src/core/dominion/`:
  - `pyramid.ts`: ranks, seats, bands, level / BST / Ace caps (base + region + standing), the fit check (on-type, level, BST, never-allowed Pokémon, team full), Ready, promote / demote / strip. Members passed over gain Ambition; three passes make them Resentful.
  - `reserve.ts`: the Reserve box (20 places), Day 1's Pokémon of the other Team Type, give (to a member or the Boss), take back (Loyalty −5, −10 for an Ace or a member's own catch), Auto-Fill, "hunts for themselves" vs "for the Reserve", the Pens (stolen Pokémon cool off 5 days, Heat, escapes), offer freedom, Trust (start by source, +1 on wins, weekly for gentle natures, odds bonus at 7+, penalty below 4), evolve-in-peace, and an odds penalty for battle tasks with no usable Pokémon.
  - Off-type catches and steals go to the Reserve (Kice). D3's `crew.stores` moves into the Reserve on first load.
  - Crew tasks now live: Pens watch, Tend, Feed, Release, Rehab (plus Catch now fills the Reserve). **36 of 152 tasks could be played with D4** (was 31; 38 with D5 merged, 63 with D9 merged).
  - Field plays now live (41 of 150, was 32; 71 with D5 and D9 merged): rescue a wild Pokémon, tame the wild, evolve in peace, promotion ceremony, mentor, toll booth, cat burglar, back-alley brawl, train robbery. Some need a band (rank group) in the crew.
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
- `dominion.css` and the port tool are evil-mode's (after D5): re-run the tool on mockups-v3 rather than hand-merging.
- The Reserve and the Pyramid also carry their per-screen overlays (haze, bokeh, particles, grade, spotlight, edge glow, frame, sunburst) from `reserveFx.ts`. On the Reserve the spotlight and sunburst follow the picked tile.
- D1-D3 screens get the shared chrome from the CSS but not their own overlays yet (their markup lives in those slices).

## Saves
No version bump. `block.reserve` is optional and filled the same way every time by `withReserve` (seeded on Day 1, stores moved in, missing Trust records added, stale ones dropped), so a D3 save loads unchanged (tested with a D3-era block and with a damaged record).

## Tests
- `tests/unit/dominionReserve.test.ts` (28 tests): data, caps, fit, Day 1, give / take back / Auto-Fill, hunting for themselves, the Pens, Trust, freedom, new tasks, Gentle Hands, promote / passed over / demote / strip, the strip walk-out roll (deterministic), band gates, talks, ceremony and mentor, both screen models, save/reload of a D3 block, a damaged record.
- `dominionField.test.ts` (played count 41) and `dominionCrew.test.ts` (catches go to the Reserve) updated.
- Browser: `tests/e2e/dominionReserve.spec.ts`: tab 4, give to Rook, switch to the Boss, three window sizes, the Pyramid, promote Rook, then reload. `dominionStart.spec.ts` now checks the locked tab with tab 5 (tab 4 is open). dominionStart, dominionCrew and dominionMap pass.

## Limits and what's left
- Merged with D9: the rival team's task kinds and D4's share one `addTaskKind` hook (D9's signature, plus the task level `lv`). The Rival File (R from the HQ) and the Reserve / Pyramid live side by side.
- Merged with D5: the Reserve holds D5's 20 plus each Pokémon Storage room's places, and Pokémon over the cap are let go with D5's report line. D5's stores test now checks the Reserve.
- The 23 items D5 and D9 pointed at D4 are built in **D4b** (below). Nothing waits for D4 now (`dominionReserve.test.ts` checks it).
- Safari Patrol, Hatch Eggs and Heal the Team wait for the slices D5 named.
- Moved: Hire a Specialist to D10, Plant a Mole to D22 (spies; D9 merged without it).
- Not built yet: Train's +10% XP for on-type Pokémon; named recruits' 7-day off-type rule; the Morale hit for "favours a type you don't run"; the Flyer recruit bonus; rivals or the Hero scouting your types (D9, D11).
- The region bonus to caps reads region 0 until D15 adds regions; the Sworn flag's effect waits for D15.
- Disobeying in battle is modelled through job odds, not in the battle engine.
- The Boss's own catches in battle still go to the party (the Reserve only takes crew catches and gifts back).

## D4b: what later slices pointed at D4 (follow-up PR)
Rules in `src/core/dominion/school.ts` (plus small hooks in `pyramid.ts`, `crew.ts`, `hqFx.ts`, `hq.ts`, `worldTurn.ts`, `field.ts`, `session.ts`); numbers and lines in `pyramid.json` `school`; rooms in `tools/dominion/buildings-to-json.py`. No new RNG stream (Egg Run and Breed roll on the action's own stream). No block bump: `reserve.eggs` and `reserve.retirees` are optional.
- **Learn a Trade** (task 67): learns the trade their best stat fits (forger: Wits, mechanic: Brawn, cook: Charm); level 2 the trade's discount (forger 5% off Hire Grunt, mechanic 5% off building and raising rooms, cook 5% off wages); level 3 a second trade; level 4 the blueprint doubles the discount; level 5 a weekly master craft (₽100 clean, rooms repaired +10, or 2 Oran Berries). A fail costs ₽20.
- **Teach a Move** (task 69, Sergeant and up): the tutor costs ₽100 (₽80 from level 2); the member's Pokémon learns its strongest move of its own type; level 3 two moves, level 4 one to each of their Pokémon, level 5 an egg move first. A fail teaches nothing.
- **Egg Run** (action 63, Day, needs Holding Pens, 70%): an egg that hatches in 3 days (2 from level 2) into the Reserve at Trust 8, at the Boss's team level −5; level 3 a species the team has, level 4 the species shows, level 5 the best of three. Six eggs at most.
- **Breed** (action 68, Evening, needs Holding Pens): two Reserve Pokémon out of the Pens (a same-family pair first, then the most trusting) leave an egg of the first one's family; level 2 a 50% chance of a good nature, level 3 IVs at least 15, level 4 an egg move a parent knows, level 5 the hidden ability.
- **Move Tutor** (action 72, Evening, needs the Dojo, ₽200, 20% less from level 2): the Boss's first Pokémon with something to learn: a move it missed by level; from level 3 any TM or tutor move; level 4 two; level 5 an egg move.
- **Rooms** (all on, each T1 effect, scaled by tier): Admin Quarters, Sergeant's Post, Lieutenant's Office, Captain's Hall add a seat in their rank (+1 more every 3 tiers); Officer Academy takes 2 member levels off every rank up to Sergeant; Classroom forms the member's next trait at promotion (a trait point once two have formed); Skill Exam Hall +1 to the best stat at promotion; Skill Booth +1 task XP every working day. Weekly: Sparring Ring (paired bouts, +3 XP), Stealth School (+0.4 Stealth to all), Grunt Academy (+1 point on a Grunt's task stat), Veteran's Corner (+2 XP to the newest), Mentoring Office (an Admin and a Grunt: +2 XP, +2 Loyalty), Personality Lab (a trait forms early), Therapy Room (cures Resentful or Embezzler; else +10 Morale to the unhappiest), Comfort Ward (+2 Trust to the most anxious Pokémon), Retiree Hall (a member let go or seen off after 14+ days at Loyalty 50+ retires there; each retiree +1 Morale to all a week), Type Dojo: Fire (Fire Pokémon of the Boss, the crew and the Reserve gain level x 4 XP a week). The other seven Type Dojos share the rule and are on too.
- The Reserve's count shows waiting eggs ("· 2 eggs, next on Day 9").
- Not built (capstones): T8 capstones of these rooms (two traits on promotion, regions held, raids led) wait like D5's.
- Tests: `tests/unit/dominionSchool.test.ts` (21 tests).
