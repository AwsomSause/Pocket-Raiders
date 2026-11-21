- **DOMINION slice D17, "Completion"** (Evil Mode rework, 2026-11-21; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md`, design Part 5 §7-8, Part 0 §6.1 Q4, old Evil Mode Part 23 §9.3 = Kice answer 9): the run's end, the ending page, account rewards, Collapse, the balance sim and the status audit.

## What's built
- **Data** `src/data/dominion/ending.json` (shape `EndingFileSchema` in `src/core/dominion/ending.ts`): the Goals that end the run on their own (Everlasting and Clean Slate, the two Part 5 §7 names), the ending page's words, the region pills, the "how far it got" rows, Collapse's numbers and lines.
- **Rules** `src/core/dominion/ending.ts`:
  - **Complete** (Part 5 §7): every region in the run owned (the last one Taken, every held one still held at that moment, no Long Trip pending), or the region Taken by the Goal path with a run-ending Goal. Other Goals take their region and the run sails on. D16's Charters unlock (`dominionFinished`) now reads this, so a run with a lost region doesn't unlock them.
  - **The books across every day**: after each night the closing funds go in `block.annals` (one point per run day; past 720 points pairs merge). They come along when the Boss leaves for the next region.
  - **Account rewards** (Kice answer 9): "Close the books" stamps the run over and won, adds the regions Taken to `regionsCleared`, and the main game's `finishRun` pays it: the run's ordinary Bank Credits (stipend per region, per run), research, species, achievements, Run History. Same rule for every ending. The `dominion` mode is now `progressionEligible` (it was off, so the old Evil Mode never paid anything). Money stays where it is (Q3). The Road Home (NE100) doesn't play after a Dominion run.
  - **Collapse** (Part 5 §8, not built by any earlier slice): HQ destroyed (every room inside ruined) and ₽ below 0 and no district held. The Boss wakes in a new warehouse in the same region with one member and ₽1,000; held regions stay held; the days keep counting; the Night Report says "Humble beginnings, again."
- **Screen** `src/ui/redux/screens/dominion/ending.ts`, controller `src/scenes/dominion/endingController.ts`: opens by itself the first time a hub page (HQ, map, Takeover, Empire, Ledger) is drawn with the run complete, and from L on the Empire or Takeover page after that. No mockup draws it, so it's made of v4 parts: s10's region cards (the Empire Map: each region's pill, the path that took it, the day, the Hero who stood last, the Holder), s7's ledger page (the graph across every day, its peak), s5-style crew rows (first line the day they joined, last line now; Holders in held regions too; ◀▶ pages), the "how far it got" row and the text box (the ending's line; for a Goal ending, its other endings). Enter closes the books (the run-end page follows, titled by the ending), Esc goes back.
- **Balance sim** `npm run sim:evil` now plays Dominion (`tools/dominion-sim.ts`, player `src/core/dominion/autoplay.ts`, its own stream `dominion-sim::<seed>`); the old one is `npm run sim:evil-old`.

## Balance pass (12 seeds × 3 policies × 60 run days, medians)
| Policy | Day 14 | Day 28 | Day 60 | Red nights | Collapses |
| --- | --- | --- | --- | --- | --- |
| Boss works the best paying job | ₽3,855 | ₽16,122 | ₽53,570 | 0 | 0 |
| Crew on the quick tasks only | ₽3,110 | ₽4,975 | ₽9,595 | 0 | 0 |
| Both | ₽3,930 | ₽16,435 | ₽54,427 | 0 | 0 |

- Nobody went broke and nobody Collapsed. The Boss's own hands earn about ₽1,200 a day by week 4; the crew alone about ₽110 a day net of wages (Part 0: "your own hands first, your crew's later"). By day 60 a working Boss can pay for HQ Lv 4 (₽40,000); Lv 5-6 (₽120,000 / ₽300,000) stay end-of-region goals. No numbers changed: nothing in the sim pointed at a broken economy.
- Found and fixed: the Chair crashed (`Rng.int: max < min`) when a card named "a jailed member" and nobody was jailed. Now nobody fits and the card isn't drawn.
- Not measured: the sim doesn't take districts, build rooms or follow a takeover path, so the 40-90 days per region target and Notoriety past step 3 are still untested by it. Heat stays near 0 for a Boss who picks low-Heat jobs.

## The audit (on this branch, before the D8 and D10 follow-ups merge)
- Boss actions: 600; 502 play, 98 name the slice that left them (D15 45, D11 30, D22 15, D3 5, D9 2, D1 1). Crew tasks: every one has a status; disabled ones name their slice. Rival actions and the 300 street meetings: every one has a status. None waits for D17 (test `dominionEnding.test.ts`).
- Chair cards: 130 of 150 live; the 20 still on `wait` are D8's 8-9 (PR #1542) and D10's follow-up (PR #1543, with D5's six and the quiz card). D17 merges both before it merges; then no card waits.

## Limited (honest list)
- A Goal ending shows the Goal's first ending; the others' conditions (wishes, Portents, Tilt...) aren't tracked, and the page says so.
- Collapse keeps the most loyal member (then the highest level, then the longest served); the design says "your choice of survivors", which needs a picker page.
- Crew journeys cover the crew now and the Holders left in held regions; members who left along the way aren't on the page.
- Study the Elite Four: the send-out order and the tell (+15% first move) need a battle-side preview the battle screen doesn't have (was noted "waits for D17's balance pass").
- The old Evil Mode flow is untouched until Kice answers the retire question.

## Saves
No version bump: `block.annals` is optional (a block without it starts its book the first night it's seen). No existing roll moved; the sim's stream is its own.

## Tests
- `tests/unit/dominionEnding.test.ts` (16): data; not complete before Taken or with a region left; complete with every region held; a lost/seceded/sold-out region or a pending Long Trip blocks it; run-ending Goals vs other Goals; the books (record, carry across regions, gaps, halving, old blocks); Collapse (each condition alone, the survivor, ₽1,000, HQ Lv 1, a valid block); the ending page model and view; closing the books pays through `finalizeRun`; a fight blocks it; saves; the audit; the sim plays 10 days without getting stuck, same seed same result.
- `tests/unit/dominionStart.test.ts`: the mode is now progression-eligible.
- `tests/e2e/dominionEnding.spec.ts`: an Everlasting run opens the ending by itself, the map, graph, crew pages and pay row; Esc, then K and L open it again; Enter goes to the run-end page, the profile counts the run (Charters) and pays Bank Credits; two window sizes; no console errors.
