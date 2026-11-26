# Dominion redesign R8: the Empire and the Chair

Kice, 2026-11-21 12:25 PM PT: "BUILD EVERYTHING AS CLOSE TO THE MOCKUPS AS YOU CAN. Keep redoing and remaking things until they look exactly like the mockups." Target: pass 50 of `plans/evil-mode-rework/redesign-50/`, slice R8 of `/mnt/project-files/plans/dominion-redesign-build/BUILD_SLICES.md`. Built on R0 (`docs/status/dominion-r0.md`).

## What R8 built

Every page is drawn from the mockup's markup and the pass-50 styles, with the run's live data. Screens never change state; every choice still goes through `GameSession.dominionStep`.

**The Chair** (`r50/chairR8.ts`, `scenes/dominion/chairController.ts`)
- `chair`: the visitor at the desk (their sprite, the lead Pokémon, the plaque, the question, two answers and Hand it off, the right hand's whisper). Keys 1-3, Enter, V waiting room, C close the doors, O settings.
- `handoff`: who answers for you, as cards (rank stars, lean, why someone can't).
- `queue` (new page, V): the waiting room, the visitor at the door first, then the rest of the docket.
- `favours` (new page, F from the waiting room): who owes you (Favours, deals that pay) and who you owe (Grudges, deals that cost). **Call it in** on a Favour (its button, or ↑↓ and Enter) spends it: ₽1,500 back and the HQ's Heat −10 (`courtRules.json` `callIn`, `src/core/dominion/favours.ts`). Grudges and deals can't be called in.
- `tally`: NET money, the visitors, what changed, To the Night.
- `night` (new page): the HQ at Night opens on the night shift (four of the crew and what they do). Enter sleeps, Esc stays up (the HQ for a Night action).

**The Empire** (`r50/empireR8.ts`, the Takeover, Empire and Ending controllers)
- `takeover`: the four paths as dials, the first alert as Rotom's tip, the Turning Point card on top.
- `fronts`: the Holdings list (P) with the detail panel; buying works as before.
- `broadcast`: the hijacked TV (the Boss on air, the ticker, the line).
- `regions`: the Empire across regions (G), four region cards. A second tap opens a held region's own page (its buttons and standing orders). Keys L sail, W world, U the Underworld, Y the Gym case.
- `magnet` (new page): from Johto, a held Kanto's page has **Magnet Train**. The page shows the pass (Saffron ⇄ Goldenrod, seats, fare, times) and the conductor. Riding costs ₽600 and the rest of the Day (nothing more in the Evening) and works like a short visit: Stability +10, one grievance gone, the away count reset (`regions.json` `magnet`, realm op `magnet`).
- `world` (new page, W): the islands, the route, Pick the Holder / Sail.
- `holder` and `sail`: the old Leaving page split in two, as in the mockups. Holder cards (second tap goes on); the boat, who comes (chips), the orders (one chip, ◀▶ to change, O or the 1/4 chip for the next order).
- `johto`: a region after the first opens on its arrival page (welcome card, crew and ace, start money, heat, who runs the region: the rival Boss, the Hero, the wild card and a Gym Leader). Enter reads the arrival lines.
- `underworld` (new page, U): every evil team, met / next / later.
- `gymcase` (new page, Y): the region's eight Gyms, yours, the rival's, next, free. Plan opens that Gym's district file on the map.
- `ending`: the city at night, the tower with the team's initial, the crew either side, the books' numbers, Credits.
- `credits` (Enter on the ending): the Boss starring, the crew (six to a page), Also starring (the rival Bosses met).
- `infamy` (H on the ending): the Hall of Infamy (the Boss, the right hand, the ace, two more).

New core models (pure, no Phaser): `src/core/dominion/r8Pages.ts` (waiting room, favours, night rows, Underworld, Gym case).

## Mockup vs game (960x540)

| Page | Mockup | Game |
|---|---|---|
| Chair: visitor | ![](dominion-r8/mock-chair.jpg) | ![](dominion-r8/game-chair.jpg) |
| Hand it off | ![](dominion-r8/mock-handoff.jpg) | ![](dominion-r8/game-handoff.jpg) |
| Waiting room | ![](dominion-r8/mock-queue.jpg) | ![](dominion-r8/game-queue.jpg) |
| Favour ledger | ![](dominion-r8/mock-favours.jpg) | ![](dominion-r8/game-favours.jpg) |
| Tally | ![](dominion-r8/mock-tally.jpg) | ![](dominion-r8/game-tally.jpg) |
| Night | ![](dominion-r8/mock-night.jpg) | ![](dominion-r8/game-night.jpg) |
| Takeover night | ![](dominion-r8/mock-takeover.jpg) | ![](dominion-r8/game-takeover.jpg) |
| Holdings | ![](dominion-r8/mock-fronts.jpg) | ![](dominion-r8/game-fronts.jpg) |
| Broadcast | ![](dominion-r8/mock-broadcast.jpg) | ![](dominion-r8/game-broadcast.jpg) |
| Empire across regions | ![](dominion-r8/mock-regions.jpg) | ![](dominion-r8/game-regions.jpg) |
| The World | ![](dominion-r8/mock-world.jpg) | ![](dominion-r8/game-world.jpg) |
| Pick the Holder | ![](dominion-r8/mock-holder.jpg) | ![](dominion-r8/game-holder.jpg) |
| Sail | ![](dominion-r8/mock-sail.jpg) | ![](dominion-r8/game-sail.jpg) |
| Arrival (Johto) | ![](dominion-r8/mock-johto.jpg) | ![](dominion-r8/game-johto.jpg) |
| Underworld | ![](dominion-r8/mock-underworld.jpg) | ![](dominion-r8/game-underworld.jpg) |
| Gym case | ![](dominion-r8/mock-gymcase.jpg) | ![](dominion-r8/game-gymcase.jpg) |
| Ending | ![](dominion-r8/mock-ending.jpg) | ![](dominion-r8/game-ending.jpg) |
| Credits | ![](dominion-r8/mock-credits.jpg) | ![](dominion-r8/game-credits.jpg) |
| Hall of Infamy | ![](dominion-r8/mock-infamy.jpg) | ![](dominion-r8/game-infamy.jpg) |
| A held region (game only) | — | ![](dominion-r8/game-realm.jpg) |
| Standing orders (game only) | — | ![](dominion-r8/game-orders.jpg) |

Differences left on purpose (live data, not looks): a short test run has fewer visitors, crew and Gyms than the mockup's Day 64; the Boss is the run's trainer; numbers are the run's.

## Needs a mechanic (not built, no placeholder)

- Ending: the mockup has no region map or funds graph, so the old ending's `dom-end-region-*` and `dom-end-graph` are gone; the numbers stay in the stats row.
- Johto: the mockup's **Region skin** button (the skins are R9's settings).

## Keys that differ from the mockups

- Q is the hold-Q command wheel everywhere, so the waiting room opens on **V** (the mockup said Q).
- The regions page has more keys than the mockup (L, W, U, Y) because the World, the Underworld and the Gym case have no other way in yet.

## Tests

- `tests/unit/dominionR8.test.ts` (13): Call it in (pays, cools, spent once; Grudges, strangers and shut doors refused; Heat floors at 0), the Magnet Train (fare, Day spent, Stability; no money, Night or no line refused; an Evening ride), the waiting room (closed doors give null; the door visitor first), the favour ledger (empty, then a Favour, a Grudge and a paying deal), the visitor page's test ids, the Night's four rows, the Underworld's states, the Gym case's eight Gyms, the regions grid and World with four regions.
- `tests/e2e/dominionR8.spec.ts` (3): the Chair pages (and calling in Rosa's Favour), the Empire pages (Takeover to Johto's arrival, a held region's page and orders, the Magnet Train ride), the Ending, Credits and Hall of Infamy. Each shot checks that every sprite drew. `R8_SHOTS=<dir>` writes the 960x540 shots and markup there.
- Updated for the new pages: `dominionChair.spec.ts` (the settings value is `b.tag`), `dominionTakeover.spec.ts` (no Hero file on the page), `dominionRegions.spec.ts` (Holder then Sail; the region page before its orders; wait for the arrival page to close), `dominionEnding.spec.ts` (Credits before closing the books).

No save change.
