# Evil Mode slice 20: Alola, Galar, Paldea

- **Evil Mode slice 20, "the last three"** (2026-11-18, build plan `/mnt/project-files/plans/evil-mode/31_THE_BUILD_PLAN.md` section 3; design Part 26c, Part 08d, Part 15b sections 3 to 6). Alola, Galar and Paldea are written and `supported`: all nine canon regions can be founded in or reached by a Crossing ticket. Built on slice 19.

## What's built
- **Three regions whole** (`src/data/evilMode/*.json`): eight stages each, eight Leaders each (Part 08d: Alola's Captains are minors bar Mina; Bea and Allister share Stow-on-Side; Melony and Larry have a Buy price by the formula), eight locals each, and the neighbours: Guzma (Skull), Yell (Piers; steals nothing), Team Star (`minors`, `noWar`). Five ticks each. Galar has a second clock (the Darkest Day), stopped before the Reckoning if Yell's tick 3 was stopped.
- **Rules in one file** (`src/core/evilMode/lastThree.ts`, state in `region.l3`):
  - **Alola**: Buy and Replace shut at every district Gym, the door says "Shut by the island" (`regionShut`, checked first in `gym.ts`). A guardian's shrine per district: Sullen or Shut puts −10% on every job there ("The island's against it", on the Card); a Take that day cools it; three Warm held holdings warm it; at Shut the guardian comes once per island, then it's Wary. Aether is one In-person conversation (Against / Apart / Beside). The girl with the bag: say nothing, guard the bridge, or tell Lusamine (asks "are you sure?"; every Kind crew −3 Loyalty).
  - **Galar**: a won Gym on the pitch offers the handshake (Dread +1 becomes Regard +1). The Chairman's loan rings on the Arrival's day 2 with a 13-field Card, the clause in field 13: ₽20,000, 10% at each new district; if Heat reaches 8, or anything's owed on the Reckoning's first morning, every running Front vests in Macro Cosmos and Going Straight closes. Ask what "reasonable" means; repay in person. Away ends: each full one pays Regard +1 at the district end.
  - **Paldea / Team Star**: the Star enumeration. `canDo` refuses every action naming a Star base (jobs, Cards, waive/halve/ask/clear, post/unpost, go yourself, trade, Scheme ways, Digs, base pieces, any region act) except a Visit; no Chair; no Pen or person on the table. Star's stance list has no War, Rivals, Front or Merger; the Sit-Down's third answer is `service`; every step ends with `starLocks`. A Visit is In person, once a day, once a base (opinion +1). Canteen tables warm every local by one at the district end.
- **In person list**: region acts (`loan:*`, `shake:*`, `aether:*`, `bag:*`, `visit:*`) join the clock acts; the screen sends `regionAct` with the code.

## Saves
- No block version bump: `region.l3` is optional, the new holding kinds and the `service` stance only add enum members. Old saves read unchanged.

## Tests
`tests/unit/evilModeRegions3.test.ts` (20): the data; shrine and Star base have no methods; Buy/Replace shut by the island at every Alola district Gym, open in Galar/Paldea; the Star enumeration through `canDo` and `step`; Chair/Pen/person refused; no forbidden stance, even forced or over a whole autoplayed Paldea; Service on answer 3; Visit once; handshake; loan Card, Heat 8, Reckoning call, repay, decline; shrine terms and the guardian once per island; Aether and the bag; each region autoplayed, replayed and reloaded. Updated: founding (nine open), Run length (nine), Crossing (ticket from the offer), Gym prices (Melony, Larry), Mina's Replace line. Browser `tests/e2e/evilModeRegions3.spec.ts`: Alola's Gym doors, a Star Visit by tap, the loan taken by tap; screenshots at three sizes.

## Limits
- Not built: Trials and Paldea's Gym tests are Card text only; the guardian's battle (it comes and goes, no fight); Rent, the Clause and the Box schemes; the empty window table; Oleana's contract and publishing the real numbers; the feeder; away-end chants and per-match-day Regard (paid at the district end instead); Spikemuth's lower takings; the girl's File line; the Galar clock's Dynamax effects (lines only).
- Star bases sit at districts 1, 3, 4, 5 and 6 (Part 26c), not Part 15b's 1, 2, 3, 5, 6.
- The regions' own base sites (megamart, narrowboat, lighthouse) stay `disabled`, like every other region's own site.
- Part 27's six second-wave regions stay unbuilt (Kice's answer 6).
- Undo: set Alola, Galar and Paldea to `"status": "disabled"` in `src/data/evilMode/region.json`.
