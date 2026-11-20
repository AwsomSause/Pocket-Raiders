# Pocket look (the Pokémon-style UI redesign, built for real)

Kice, 2026-11-20: "All of the most recent ones look fine. Build into the game now alongside the animations in the animations thread. Prioritize the looks of the UI thread (Current) while prioritizing the animations of the animations thread. IF A MENU OR ADDITION DOESNT ALREADY EXIST IN GAME, ADD IT" and "BUILD EVERYTHING AS CLOSE TO THE MOCKUPS AS YOU CAN". The mock-ups are in `plans/ui-redesign/` (283 pages; status in `docs/status/ui-redesign-25-passes.md`).

## What it is

A fourth UI style next to New, Phantom and Old: **Settings > Display > UI style > Pocket**. New stays the default until every page is built; then Pocket becomes the default (Kice's choice, 2026-11-20). No save version changed: `pocket` is one more value of the `uiStyle` setting.

Kice's picks decide which pass a page is drawn at: Title pass 17, Pause menu pass 24, the main game the Final Cut (slider 26), the new areas the Master Cut (slider 51). Dominion / Evil Mode pages are left out.

## How it is built

- It uses the New UI's HTML layer and the same scenes: a scene still owns the state and the keys, and its view draws a Pocket page when `ReduxCtx.pk` is set (`src/ui/redux/stage.ts`). A view's HTML that starts with the Pocket mark (`<!--pk:<page>:<tier>-->`) is drawn on its own layer `#pkx`, a 960 x 540 stage scaled to the window.
- The rules are the mock-ups' own CSS: `node tools/build-pocket-css.mjs` turns `plans/ui-redesign/src/pNN.css` into `src/ui/pocket/pocket.gen.css` in four tiers (17, 24, 26, 51), animations renamed `pk-...`, pictures as CSS variables. Hand additions go in `src/ui/pocket/pocket.css`; their classes start with `gx-`.
- Pages are in `src/ui/pocket/screens/` and `src/ui/pocket/templates.ts`, built with `src/ui/pocket/kit.ts`. Each page is ported from the mock-up's final HTML (`node tools/pocket/dump-pages.cjs <dir>` writes all of them), with the same class names, so the mock-up's rules apply as they are.
- Sprites are drawn as the mock-ups draw them: the first frame, cut down to the drawing, as an `<img>` (`src/ui/pocket/art.ts`).
- A page change is the browser's view transition, as in the mock-ups (`src/ui/pocket/turn.ts`); with menu animations off, pages simply change.
- A screen that has no Pocket page yet shows its New page, so the whole game is playable in the style from the first part.
- `?ui=pocket` in the address forces the style for one page load (the browser tests use it).
- Motion inside battles, the stage map and the Blessing screen belongs to the animations thread (`docs/status/animation-redesign-25-passes.md`); this look gives them the cards to move.

## Parts

| Part | Pages | State |
|---|---|---|
| 1 | The style setting, the layer, the mock-ups' rules, sprites and page changes. Title (pass 17). Settings home (nine tiles) and every Settings page (rows with switches, bars and choices, the Display preview). Save Slots. The confirm box (Rotom asks). Pause menu: the Rotom Phone (pass 24). Shared pages every list screen uses: menu, option rows, number tiles, picture wall, board. Through those: Trainer Select, Preparation Desk, Run Setup, Modifiers, Game Summary, My stats, the quest boards, the Save menu. | done |
| 2 | Events: talk, choice cards over the text bar, result, rewards (mock-ups `event`, `ev-choice`, `ev-result`, `ev-reward`), with the trade picker, tournament rounds, standing, timer and the dark scare page. Stage map (mock-up `map`, Final Cut): eight stops at a time on the Town Map board, the Gym card, the menu row, the legend with the stage notes, the stop menu, the stage banner. Shops and reward drafts: next | events and map done |
| 3 | Battle HUD and cards (trainer intro, ace call, the cards the animations thread moves) | not started |
| 4 | Party, Summary, Bag, Pokédex, Trainer Card, Journal, Type Chart | not started |
| 5 | Hub Town, Pocket Town, run setup pages of their own (starter pick, briefing) | not started |
| 6 | New areas: Galar, raids, totems, expeditions, evil teams | not started |
| 7 | Pages the game does not have yet, then Pocket becomes the default style | not started |

## Tests

- `tests/unit/pocketUi.test.ts`: the progress ribbon, Rotom's lines, the page mark and tiers, settings rows (switch, bar, choices, window, escaping), the shared pages, save slots, the Settings home, the Pause page, the battle cards, the event pages (talk, choice cards, result, rewards, many choices), the stage map (window, stop states, Gym card, notes, stop menu).
- `tests/e2e/pocketUi.spec.ts`: Title, Settings (home, a category, a change, Reset question, Game Summary), Save Slots and the Pause menu, each checked at three window sizes for text that is cut off or off the stage; the Pause menu changes nothing in the run; a real event from talk to rewards (rewards stay until Enter, the event is used up); the stage map (Town Map board, eight stops, legend, a click travels); no console errors.

## Known limits

- Parts 1 and 2 (events, stage map) only: every other screen still shows its New page in the Pocket style.
- The Rotom Phone has the apps the map can open today (Party, Bag, Journal, PC Box, Rivals, Save, Settings, End run). The mock-up's Pokédex, Trainer Card and Type Chart apps come with their pages in part 4.
- Page changes need a browser with view transitions (Chrome, Edge, Safari 18, Firefox 144); others change pages at once.
- Event pages: a place the New UI draws (a room, a shop, a fair) gets the nearest Pokémon Memories backdrop, as the mock-ups do; the New UI's drawn weather and drifting motes are not on these pages. The bracket, Honest Trade Card, code-name card and rival team pages are still New pages.
- Stage map: the stage's status lines (mentor, forecast, objectives) and the C/H/N/F keys live in the legend (L), so the board stays as clear as the mock-up. The party strip of the New map is not on the board (Party is in the menu row).
- Picture variables for the mock-ups' rules are now whole URLs (a relative one was read against the stylesheet's folder, so the Town Map board showed no map).
