# Dominion tutorial and opening

Built from `plans/evil-mode-rework/tutorial-mockups/` (pages a1-e9). Kice 2026-11-21: "Build the tutorial almost if not EXACTLY to the mockups", and add any screen the game lacks.

## What the player gets
- **Before the run:** New run asks how much help (Full walkthrough, Tips only, Off). Full and Tips play a three-beat cold open (Esc skips) and a reward card, then the setup. A first-time title shows a FIRST TIME tag.
- **Full walkthrough:** Rotom tips on the three setup pages, the starting kit card after the opening, then 15 lessons over the first week (top bar, orders, First Steps, tasks, the night, mornings, the Card, Heat, the map, the wheel, the Boss Menu, bills, Rivals, the Founding). A lesson holds the page until Enter. X stops the tips (the run goes to Off).
- **Tips only:** one line the first time each screen opens; any key closes it and still does its own thing.
- **New pages:** help choice, cold open, reward cards, the Day 2 Rattata (goes to the Reserve once), First Step done, Week 1 bills, Rocket's note, Week 1 Ledger, the night dial, Street Gang, founded card, Rotom signs off, Replay a lesson.
- **Boss Menu:** new "Replay a lesson" blade (T) and page: plays a lesson's tips again over the page (changes nothing in the run); ◀ ▶ there sets the Tutorial level. **Settings › Dominion** has a Tutorial row.

## Code
- Core `src/core/dominion/tutorial.ts`, text `src/data/dominion/tutorial.json` (Zod-checked). Block field `tut { mode, seen[] }` is optional: older runs have none and play exactly as before (no save bump). Action `{ t: 'tut', op: 'seen' | 'mode' | 'gift' }`. `prefs.tutorial` defaults to Full (settings default, no bump).
- Scene `src/scenes/dominion/tutorialController.ts`; views `src/ui/redux/screens/dominion/tutorial.ts` + `tutorial.css` (the `.tu-*` rules ported from the mockups).
- Automated browsers keep the old flow unless the URL has `?tutorial=1` (like `?moments=1`).

## Tests
- `tests/unit/dominionTutorial.test.ts` (14), `tests/e2e/dominionTutorial.spec.ts` (3). Boss Menu tests now expect 10 blades.

## Known limits
- The lesson positions are the mockups' (960x540); a lesson waits when something else owns the HQ (a crew talk, the Chair, a moment).
- Lesson 15's Street Gang page and Founding tips depend on the built Founding opening (both First Steps + Street Gang).
- None of the numbers are playtested.
