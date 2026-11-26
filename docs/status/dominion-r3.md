# Dominion redesign R3: The Day

Kice, 2026-11-21: "BUILD EVERYTHING AS CLOSE TO THE MOCKUPS AS YOU CAN. Keep redoing and remaking things until they look exactly like the mockups." Target: pass 50 of `plans/evil-mode-rework/redesign-50/`, group "The Day". Plan: `/mnt/project-files/plans/dominion-redesign-build/BUILD_SLICES.md` row R3. Built on R0's kit (`docs/status/dominion-r0.md`).

## What R3 built

All pages use the mockups' markup and classes (`r50.css`), filled from the run. Screens never change the run; every button calls the steps the old screens called.

- **Region map** (mockup `map`, tab 2): the board with the ten districts as tokens coloured by who holds them, roads, your crew's faces where they work, the Boss's marker, the Hero when seen, Rocket's pins, the legend. Side panel: the District file (leader, owner, Regard and Dread, control / heat / rival bars, targets, the action chips with a pager). In the evening a **Today's take** button opens the Evening.
- **Focus view** (`focus`): F on the map folds the HUD away; F again (or the corner tag) brings it back. Presentation only.
- **Place your crew** (`deploy`): Place crew on the map. The tray of members; Enter or a tap places the member in a district (the D6 `where` step).
- **District file** (`district`): Enter on the map. Portrait, stats, grouped actions with number keys, targets and goals. **Walk the street** opens the street.
- **Walk the street** (`street`): the district's three targets as buildings, the crew member walking to the one under the cursor; Enter goes in (the Card), Esc back.
- **Morning report** (`morning`): the Night Report as rows (title and line), the rival badge, the member on the plinth with the Today lines, crew strip, Assign tasks and Start the day. A crew member's talk shows in the text box with its answers.
- **Assign a task** (`assign`): M or Assign tasks. Task rows with odds, the member on the plinth, other crew, Give the order.
- **The morning paper** (`paper`): the newspaper sheet and At a glance (yesterday's jobs, heat, take, Notoriety, the Wanted notice). Enter folds it.
- **Evening wrap-up** (`evening`): today's take, what changed per job, the stamp, tomorrow's headline clipping.
- **Empire Ledger** (`ledger`, L): the week chart, In / Out / Net, Clean and dirty; ←→ or the tabs page to Territory and the Notoriety ladder, then Crew and stores.
- **The Day clock** (`clock`): tap the Day on the top bar. The dial on the phase that is now, the four phases with what happens in each, Next phase button. C opens the calendar.
- **Last night** (`recap`): Enter on the clock's Morning row (in the morning): the Night Report as four cards.
- **Calendar** (`calendar`): five weeks with Paydays (end of each week), the rival's announced HQ raid and Chair cards that come back; arrows pick a day.

## Mockup vs game (960x540)

| Page | Mockup | Game |
|---|---|---|
| Region map | ![](dominion-r3/mock-map.jpg) | ![](dominion-r3/game-map.jpg) |
| Focus view | ![](dominion-r3/mock-focus.jpg) | ![](dominion-r3/game-focus.jpg) |
| Place your crew | ![](dominion-r3/mock-deploy.jpg) | ![](dominion-r3/game-deploy.jpg) |
| District file | ![](dominion-r3/mock-district.jpg) | ![](dominion-r3/game-district.jpg) |
| Walk the street | ![](dominion-r3/mock-street.jpg) | ![](dominion-r3/game-street.jpg) |
| Morning report | ![](dominion-r3/mock-morning.jpg) | ![](dominion-r3/game-morning.jpg) |
| Assign a task | ![](dominion-r3/mock-assign.jpg) | ![](dominion-r3/game-assign.jpg) |
| Morning paper | ![](dominion-r3/mock-paper.jpg) | ![](dominion-r3/game-paper.jpg) |
| Evening | ![](dominion-r3/mock-evening.jpg) | ![](dominion-r3/game-evening.jpg) |
| Ledger | ![](dominion-r3/mock-ledger.jpg) | ![](dominion-r3/game-ledger.jpg) |
| Clock | ![](dominion-r3/mock-clock.jpg) | ![](dominion-r3/game-clock.jpg) |
| Last night | ![](dominion-r3/mock-recap.jpg) | ![](dominion-r3/game-recap.jpg) |
| Calendar | ![](dominion-r3/mock-calendar.jpg) | ![](dominion-r3/game-calendar.jpg) |

Differences left on purpose (live data, not looks): a new run holds no districts, has one crew member and no jobs yet; the game has ten districts (Pallet too) and nine district actions (the mockup drew five chips, so the file has a pager); the Ledger charts weeks (the game keeps weekly books, not daily); the Morning keeps the crew strip and Start the day (the old screen's controls); long game lines wrap to two smaller lines instead of being cut.

## Needs a mechanic (not built, no placeholder)

- **Scrapbook** (`scrap`): the game keeps only yesterday's and today's jobs for the paper; a run-long headline history needs a run save change.
- **Newsstand** (`papers`): several city papers with their own slant and "Give an interview" do not exist.
- **Travel** (`travel`): moving between districts is one step; routes with ambush odds and tolls do not exist.
- **Weather** (`weather`) and the clock's Forecast button: Dominion has no weather.
- **Timetable** (`timetable`): no Magnet Train or schedules.
- **Flooded tunnel** (`flood`): no route events with choices.
- Calendar festivals (Fireworks, Bug Catch) and Hero gym dates: no festival or Hero schedule data.

## Tests

- `tests/unit/dominionR3.test.ts` (9): map, Focus view, district file, Morning / Assign / paper / Ledger keep the old test ids and don't change the block; a talk hides Start the day; report lines split; the clock marks one phase; the calendar marks past days, today and paydays.
- `tests/e2e/dominionR3.spec.ts`: map, Focus, Place crew, District file, street, Ledger, clock, calendar, Evening, paper, Morning, Last night, Assign; no console errors. `R5_WAIT=6000 R5_DUMP=1` saves the shots and page HTML.
- Updated for the new pages: `dominionCrew`, `dominionPages` (Assign tasks / M open Assign; the Day's pages sit under the Region Map tab), `dominionMap` (targets are their own chips; the text box's ▼).

No save change.
