# Dominion D30: job moments and the morning paper

Round-4 mockups m8 (Boss order cut-in), m9 (Job done), m10 (Job botched) and m12 (The morning paper), from `plans/evil-mode-rework/mockups-v4/` (`src/i4.py`, `src/i5.py`). No block bump.

## What the player sees

- **Do it** on the Card now plays the **Boss order cut-in** (m8): the Boss's portrait slashes in on a crimson band with his order, the member on the job answers on a gold band, and `ORDER: EXTORT` is stamped across with the place, the odds and who's going. It ends by itself in 1.8 s; **Enter** (or a tap on "Enter Skip") skips it.
- Then the job goes on to what it was waiting for: a battle (the battle screen, as before), the Hero's interrupt (D11's m11), or its **result page**:
  - **Job done** (m9): PAID IN FULL / JOB DONE / BIG SCORE stamp, the take in gold with coins, every change with its before and after (Funds, Heat, Dread, Regard, Control in that town, Wanted, Hero Threat), the roll ("rolled 31 under 64"), the act's own lines (loot, Edge and mastery, street meetings), and the gold ribbon when a shop starts paying every week. **Enter** = To the Map, **N** = Next action (the Card of the next action on the board).
  - **Job botched** (m10): police lights and tape, BOTCHED, what it cost, and what now: Back to the Map (Enter) or Try the next action (N). If the police opened a questioning (D24), the page says who was caught and the one choice is **Face the police**, which hands the screen to D24's interview room. A line from the member closes the page.
- From **Day 2**, every **Morning** opens on **the morning paper** (m12): the region's Ledger on the Boss's desk. The front page is yesterday's busiest job (big jobs and battles first, then the most money): headline, deck, a grainy photo of the member, a column quoting the town. Two side stories come from the night's news lines (D25's week log, the Hero, police, rivals), then the Night Report (D3), then two quiet ones. A **WANTED** poster shows the bounty on the Boss (it follows the Wanted meter and the Notoriety step, and says what it was yesterday). **The news** panel: Notoriety as five stars, the bounty's change, Regard and Dread in the town of the story, Hero Threat and the rival team's Tension, each since yesterday morning. On the morning D25 prints its weekly paper, Rotom's ✦ line for it (`news:w<week>`, already stored by D25) shows in the column. **Enter** (or Esc, or the button) folds it onto the Morning; other keys do nothing while it is up.

## A member caught on a botched job (m10's three choices)

- **Who can be caught:** on a failed roll with no battle and no Boss questioning, the first member on the job (if any) can be grabbed. Chance = 25% + 2% per 10 Wanted (`moments.json` `botched.member`), on its own stream `dominion-collar::<rolls>`, so no game roll moves.
- **Then the Botched page asks what to do** (keys 1-3; Esc can't leave it unanswered, and a reload brings it back):
  1. **Pay her bail:** the crew's bail price (₽500, crew rules). She is back at once, Loyalty +bail bonus. Greyed out without the money.
  2. **Send someone to break her out:** the free member with the best Brawn + Stealth goes. Chance 35% + 3% per point of their Brawn + Stealth (5-95%), stream `dominion-breakout::<day>::<member>`. Always Heat +8 in the town and the rescuer gets +30 Fatigue. Success: she is free, Loyalty +3. Failure: she stays in the cell (as if left). Greyed out if nobody is free.
  3. **Leave her:** free, but every member loses 6 Loyalty, and she spends the night in a cell.
- **Left in the cell (or never answered by the night):** the World Turn crew step puts her in jail for the night, so D24's police step questions her as it does any arrested member (her questioning can raise Heat, Wanted or Hero Threat, as D24 already rules).
- Save: `paper.caught` (`{ member, action, district, day, left }`, optional) and the `jobCaught` action. No block bump.

## How it works

- Rules: `src/core/dominion/moments.ts` (models, job notes, morning snapshots), lines in `src/data/dominion/moments.json` (Zod-checked in `moments.ts`).
- **Outcome never depends on the animation.** The act is played and saved by `stepInRun` before the cut-in starts; `orderModel` / `jobModel` read the block before and after the act and never change it. Quitting mid cut-in loses nothing. Lines are picked on their own stream (`dominion-moment::<day>::<rolls>`, and `dominion-paper::<day>` for the paper), never a game roll.
- `act` (field.ts) now also returns its roll `{ r, chance, rolled }`; `stepInRun` and `GameSession.dominionStep` pass it on. Nothing reads it for rules.
- The paper's notes: `noteJob` (called by session.ts after every act) keeps `{ day, action, target, town, result, take, heat, member }`; a battle the job waited on turns `fight`/`hero` into `won`/`lost` (a field.ts fight hook). The World Turn end step `paperEnd` moves this morning's snapshot to `prev`, takes a new one and drops notes older than yesterday.
- Save: `block.paper` is optional (`jobs`, `prev`, `snap`), filled by the first act or World Turn. No block bump, no save version bump.
- Scene: `src/scenes/dominion/jobController.ts` (beside DominionScene); views `src/ui/redux/screens/dominion/moments.ts` (+ `moments.css`: the mockups' looping band and stamp animations play once in the game from when the page shows; it also carries m12's `.mast4` masthead rule, which `port-mockup-css.py` drops because the `.paper::after` rule before it confuses the tool).
- **Skip setting:** `src/ui/redux/screens/dominion/cutins.ts` `cutInsOn(settings)`. Until D27's "Cut-ins: Show / Skip" row lands it follows the game's own switches (Disable all animations, or Battle motion Off, skip the cut-in; Reduced motion / Reduced intensity hold the result pages still). D27 adds `settings.expansion.dominionFx` and `fxOf(settings).cutIns`; whichever of D27 and D30 merges second points `cutInsOn` at it.
- **Automated browsers** keep the old flow (the notice line after Do it, the Morning straight after the night) unless the page is opened with `?moments=1`, so the older Dominion specs are unchanged; `tests/e2e/dominionMoments.spec.ts` opens with it.
- One sprite copied from the mockup: `t-nate.png` (the WANTED mug), provenance in `public/assets/images/dominion/PROVENANCE.md`.

## Tests

- `tests/unit/dominionMoments.test.ts` (20; six for a caught member: grabbed, bail, break out, leave and the night's arrest, unanswered by the night, a second answer refused): the lines file (parses, every stat has lines, no "Claude"/"AI", a damaged file is refused); Do it returns the roll and the models change nothing; Job done (take, every change's before/after, the roll line, the weekly ribbon, the act's lines); Job botched (stamp, rolled over, nobody caught gives two choices; a questioning gives Face the police); same act same lines, no game roll moved; the views; the paper (a job noted, the next morning's front page and news panel, snapshots, same seed same paper, a quiet night, old notes dropped, no paper on Day 1 or outside the Morning, bounty and star boundaries, the paper changes nothing); the save (a block without `paper` loads, round trip, a damaged note refused).
- `tests/e2e/dominionMoments.spec.ts` (4, the fourth: a caught member's three choices, Esc can't leave them, bail frees them for ₽500): Do it → cut-in (the save already holds the result) → Job done by itself, three window sizes, N to the next Card; a botched job (Enter skips the cut-in, Enter back to the Map) and Battle motion Off skipping the cut-in; the next Morning's paper (front page, WANTED, the news, three window sizes, letters eaten, Enter folds it onto the Morning, nothing in the run changed, it stays folded when the scene starts again). No console errors.

## Known limits

- A caught member's choices are a new, simple rule (below); the Boss being caught still goes only through D24's questioning.
- The order cut-in always uses the Boss portrait `v-nate` (as D13's Debate does) and the WANTED mug `t-nate`; the Boss's own look per archetype waits for a Boss-look slice.
- "Next action" opens the next action in the board's current page (it wraps); it does not skip actions that are blocked (their Card says why).
- Folding the paper is remembered for the game session, not in the save: after a page reload the same Morning shows its paper again (it changes nothing).
- The bounty is a display number only (nothing reads it back); its numbers live in `moments.json` `paper.bounty`.
