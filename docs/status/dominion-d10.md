- **DOMINION slice D10, "Growth"** (Evil Mode rework, 2026-11-20; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md`, design Part 1 §3.2, Part 3 §5, Part 9 A10; lists `player-actions` and `team-actions` 151-600): the bigger options that turn a gang into an organisation. Buy Out, Raid, Gym Takeover (five ways, Defiance and the Wall), Post Flyers, Bribe, Fence, Smuggle, Sabotage, Kidnap, Hit a Lab, Spread the Word, and the rest of the actions and crew tasks that waited on this slice.

## What's built
- **Data**
  - `actions.json` now holds all 600 Boss actions (`tools/dominion/build-actions.py` reads the four list files).
  - `growthActions.json` is the play data for rows 151-600, made by `tools/dominion/growth-to-json.py` from section rules plus each row's Lv 1 numbers. Of the 450: 249 supported, 68 limited (the note says what isn't acted on), 133 disabled (each names its slice: D11 30, D14 30, D15 41, D16 15, D22 15, D9 2). D11 merged while D10 was in review: its 30 rows (sections AB and AJ, the Hero) are a D11 follow-up.
  - `growth.json` (`tools/dominion/growth-data.py`) holds the 42 hand-made plays for the D10 rows of 1-150, plus the rules: 12 businesses with perks, the 8 Kanto Gyms, the five ways, Defiance numbers, raid fights per place, flyer designs, bribes, Fence rates, smuggling, 5 specialists, loans, the stall, safehouses, mercenaries, the lab's rare species and the lines.
  - Crew tasks: all 600 are in (`lists-to-json.py`). 536 live with D11's; none waits for D10. Of team-actions 151-600: 117 supported, 303 limited, 30 disabled (AN waits D15, AQ waits D14).
  - Buildings: 121 of 266 live (27 more, such as the Operations Room, Front Office, Radio Room, Print Shop, Garage and Workshop). None waits for D10.
- **Rules** (`src/core/dominion/growth.ts`, registered into field.ts, crew.ts and the World Turn; every roll on its own stream: `dominion-loot`, `-route`, `-loan`, `-flyers`, `-kidnap`, `-lab`, `-swap`):
  - **Buy Out** a business for clean money; it pays every week (clean or dirty, with a perk). Extort the same shop three times and the owner is Cornered: half price, dirty money is fine, Heat +20, Regard −5.
  - **Raid** is a chain of fights (3-5 by the kind of place, a squad of up to 3) with no healing between; win them all for the loot crate, Control, Dread and the rival's Control down.
  - **Gym Takeover** has five ways, picked on the Card. Beat (one fight: badge and Dread, the Gym stays theirs). Buy (₽25,000 clean). Break (every trainer, then the Leader; the Leader flees, Hero Threat +15). Blackmail (needs 3 scouts of the town; rolls on Nerve). Convert (needs the badge; rolls on Charm; the Leader joins the crew as an Admin). A bought or blackmailed Leader gains Defiance each week while Dread beats Regard: at 7 they tell the Hero (Heat and Hero Threat), at 10 they break and wait at the Gym for a fight; lose it and the Gym is gone. An owned Gym's Card offers a raise (Defiance −3) and the Wall (a Captain or higher as the new Leader). Viridian is Beat-only (Giovanni's own).
  - **Post Flyers**: a design is picked once (Pride, The Fist, The Pay Pack). Each week costs ₽100 a district and can bring walk-in recruits; the police tear them down at Wanted 40+.
  - **Bribe** an officer (no patrol for some days), a clerk, or a Leader's assistant (counts as a Gym scout). **Fence** sells stolen goods (anything from a crate) at 70-100%. It needs a contact: a hired Fence, a member in the Fence role, or a building. **Smuggle** at Lv 3 or on a big success opens a route that pays every night; a hot town may seize it. **Kidnap**, a big **lab hit** and the Swap Meet put Pokémon in the Pens. **Hire a Specialist** (Fence, Forger, Hacker, Medic, Chef; weekly wage). **Loan Shark**, the stall, safehouses, mercenaries, Rig the Badge, Intimidate or Court a Leader, The Big Night and the rest.
  - Crew task kinds haul, front, fence, flyers, revive and stock.
  - From D3/D5/D6, now live: the Patron Ms. Kettering (Gym rolls +15), the Fence role, and formed traits Mule, Road Hog, Burrower, Counterfeiter, Orator and Broadcaster.
- **Screens** (mockups-v4 s3 and s4, the existing look):
  - The action grid pages a list section at a time, and the pager names the section (`[`/`]`).
  - The Card shows its choices as a row of pills (Left/Right, or tap) and a line on what the choice means. The dial shrinks a little when that row is shown.
  - B builds a squad on squad actions (Raid: up to 3).
  - After each fight of a chain, the map says who's next ("Fight 2 of 2: Brock next. Enter to go on.") and Enter starts it.

## Saves
No version bump: `block.growth` is optional and filled the same way every time (`growthOf`); the Card only reads it. A save from before D10 loads unchanged (tested).

## Tests
- `tests/unit/dominionGrowth.test.ts` (40):
  - counts and that every crate item, species and perk item exists
  - Buy Out: normal, short of clean money, Cornered at 3 (boundary 2), not a business
  - Raid: four fights, then loot and Control; a loss part-way adds Heat
  - Gym Takeover: Beat, Break, Buy at ₽24,999/₽25,000, Blackmail scouts, Convert needs the badge, Defiance tell and break plus Regard stopping it, the raise and the Wall
  - flyers week and tear-down, bribes, the Fence, Smuggle routes, Kidnap to the Pens, specialists, loans
  - traits, the Fence role and the Patron
  - the grid's sections, the Card model (choices, note, squad, no placeholder left in any Win line)
  - save/reload before and after D10, a damaged Growth refused, the Card never changes the block, determinism
- D2/D3/D5/D6 count tests updated (600 actions and tasks; D10's rows counted apart).
- `tests/unit/keyQueue.test.ts` (3): one key press reaches each screen once even when a slow frame holds several key events (Phaser re-read the queue and its neighbour-only duplicate check let Enter act twice; this made the Hero test flaky on CI). The fix is `src/ui/keyQueue.ts`, applied in `main.ts`.
- Browser `tests/e2e/dominionGrowth.spec.ts`: page to "Gyms and Heroes", the Card's five ways with Left/Right, Buy refused, Break in two battles with the map between, three window sizes, reload keeps the Gym.

## Follow-up 1: the Chair's cards (2026-11-20)
- The 18 court cards that waited on D10, D5 and "quiz" now play: 29, 39, 45, 46, 65, 66, 78, 98, 100, 101, 130 (D10), 32, 37, 51, 53, 79, 131 (D5, handed over) and 99 (Blaine's quiz). The court is at 142 of 150 live; 8 wait (D8 2, D15 5, D16 1).
- Rules in `src/core/dominion/growthCourt.ts` (each answer is a `hook:` in `tools/dominion/court-to-json.py`; numbers in growth.json `court`):
  - the cab driver (+10 on every Card while his deal stands), Koga (+10 on Steal and Thieve for 14 days)
  - the dockworkers (paid: routes pay 15% less, Smuggle's Heat halved; refused, 40%: a 3-day strike, no Smuggle, no route pay)
  - the fence (60% now; 20% he skips town; back: 75% every week, or 90% once), sold from the Bag right after the answer (`settleCourt`)
  - the judge (pick-ups 30% less likely for 14 days; 20% on a refusal: dirt on him, the same two weeks), the informant (no pick-up for 7 days), the council seat (pick-ups 20% less likely for good); police.ts `addPickupShare`
  - a joint heist (a raid crate and ₽300 more), a bought Leader going public (the Gym is lost), the blackmailed Leader's card only with a blackmailed Gym
  - gifts: the shop (Front Shop), the café (Front Café), the gambler's house (a Safehouse, won in a fight at the door); with no slot free, the gift is sold for its price, clean
  - the accountant (launders at 5% with no front; 15% a week he talks, Heat +10), the lab machine (a room one tier up), the architect (next HQ level 20% cheaper; 25%: Defense -1)
  - Blaine: three riddles on the Boss's Wits, two right wins the prize. The list says a TM; the game's TMs teach on the spot (item-catalog entries, not Bag items), so he pays a Fire Stone.
- Tests: `tests/unit/dominionCourtGrowth.test.ts` (9): every card plays, each rule, determinism, save/reload and a block without the court state. Chair counts updated (142 live).
- Saves: `growth.court` is optional, filled the same way every time (`courtOf`); no bump.

## Follow-up 2: the street and the rivals' Gym moves (2026-11-20)
- The 180 street meetings of outside-interactions sections B (Shops), C (Police), D (Gyms), E (Trainers), H (Labs), I (Wild Pokémon) and K (Crime World) now come up after an action, like D6b's A and J, and are answered on the Region Map. 137 do what the list says; 43 are limited, each with a `note` in `outside.json` (eggs hatch at once, no berries or Poké Flute in the game yet, chains played in one step, a Lawyer replaced by a test). Only G (D11) and L (D15) still wait.
  - What each choice does is in `src/data/dominion/town.json`, written by `tools/dominion/outside-d10.py` (one short string per choice). The limited notes live in `tools/dominion/rivals-to-json.py` (`OUTSIDE_LIMITED`).
  - New choice effects (`src/core/dominion/growthOutside.ts`, through a hook in town.ts): a racket on a shop here, a smuggling route, a specialist contact, the Gym scouted / courted / its Leader shaken, papers, Boss Edge XP, an item or a Pokémon (handed over after the step), hot goods sold, a safehouse, a joint heist, dirt, police looking away, a tip-off, a jailed member freed.
  - New fights: a choice can name a foe from town.json `foes` (31 trainers and four wild ones: Tauros, an alpha Rhydon, Snorlax, Meowth) or `leader`, the town's own Gym Leader (Brock in Pewter fights with his own team). Fight foe `town`, field.ts `townFoe`.
  - Needs: Gym rows only in a town with a Gym; Looker, the E4 visit and the International Police need Wanted 60/70; the court date needs someone in a cell; some need a rival here.
- The 6 rival actions that waited on D10 run (rivals.ts kinds through `setRivalKind`, growthOutside.ts; numbers in growth.json `rivalGym`):
  - 53 Smear campaign: the Leader's stance drops (takeover odds −2% a point, cleared by courting them again)
  - 62 Pay a Gym Leader: no Gym Takeover there for 1-5 weeks
  - 69 Frame your Gym ally: a courted Leader is no longer courted, Heat in that town
  - 79 Annex a gym town: Blackmail needs 1-8 more scouting there, rolled ways −3% a point, rival influence up
  - 128 Weaken your gym ally's Pokémon: takeover odds −5% to −36% for a week
  - 130 Turn your Pokémon against you: a fight card; their Admin fights you with a copy of your strongest Pokémon
  - The rival AI only picks 69 and 128 when you court a Gym. 142 of 150 rival actions are live.
- Every step now settles what it left for the run (items, Pokémon, hot goods, a heist's crate): `settleChair`/`settleCourt` moved from the action path to `stepInRun`.
- Tests: `tests/unit/dominionOutside.test.ts` (23): the data, each kind of effect, fights with a Leader and a wild foe, needs, tests of a stat, determinism, every rival move, save/reload and a block without the new state. Rival and town counts updated.
- Saves: `growth.foes` is optional; no bump.

## Limits and what waits
- 7 rival actions keep their D9 notes (shops' stock, buy-out race, accuracy, XP loss).
- Formed traits Locksmith (vault rooms) and Sea Legs (storms) wait for later slices: there are no vaults or storms yet.
- Interrogate, Hostage Trade, Hold a Prisoner and the Interrogation Cell move to D23 (captives).
- Rows 151-600 played by section rules only do their Lv 1 numbers; the higher mastery words are listed in each row's note (limited).
- The map's district file doesn't show owned businesses, Gyms or flyers yet (the Card's note does).
- There's no Rare Candy item in the game: the Rare Candy Ring pays Lucky Eggs, Oval Stones and cash.
