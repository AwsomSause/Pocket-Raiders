- **DOMINION slice D12, "the Chair"** (Evil Mode rework, 2026-11-19; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md`, design `lists/end-of-day-court.md`, cards `lists/dilemmas.md`, mockups c1-c3 in `mockups-v4`): from Day 2, the Evening ends at the Chair. Visitors come one by one with a problem; the Boss answers 1 or 2, or hands one case a night to a crew member. The Tally shows what changed, then the Night starts.

## What's built
- **Data**
  - `src/data/dominion/court.json`: all 150 dilemma cards, word for word from `dilemmas.md`. Made by `tools/dominion/court-to-json.py` (its SPEC table turns each "does" column into effects). Run: `python3 tools/dominion/court-to-json.py /mnt/project-files/plans/evil-mode-rework/lists src/data/dominion`.
  - `src/data/dominion/courtRules.json`: the numbers (visitors per Chair tier, cooldowns, red-zone lines, hand-off rank, whisper odds), the Chair's six seats, and every line the screens show.
  - Shapes: `CourtFileSchema`, `CourtRulesSchema`, `ChairStateSchema` in `schema.ts`. The file check refuses follow-ups to missing cards, fights without a foe, and answers that change nothing.
- **Rules** `src/core/dominion/chair.ts`:
  - Picking visitors: tier, region, cooldown, once-only cards, follow-ups on their day, the 4 Regulars, Open House every 7th day, at most 2 rivals a night.
  - A crisis card comes first when a number is in the red (money, Heat, Morale, Regard, Loyalty).
  - Answers, Hand it off (Grunt rank or higher, not named on the card; their lean picks, they gain Loyalty +2), the Right Hand's whisper (honest, money-minded or selfish by Loyalty).
  - Favours and Grudges, deals paid weekly, later results, fights at the door next morning, Close the doors (Regard −1).
  - New Leads, members leaving, Pokémon and items given, task locks.
  - The World Turn step: deals, Heat cool-off, the weekly Chair line.
  - Rolls use the new `dominion-court` stream, so older rolls don't change.
- **Screens** `src/ui/redux/screens/dominion/chair.ts` (built from mockups c1-c3), with `chairScreens.ts` as the models and `scenes/dominion/chairController.ts` handling keys:
  - c1, a visitor: the visitor and their Pokémon across the candle-lit table, the Boss's Chair from behind, your lead Pokémon reacting, and the Right Hand whispering.
  - Answer cards show chips: one arrow means a small change, two arrows a big one, Exact shows numbers.
  - c2, Hand it off: crew cards with traits, a lean bar and what they'd likely pick. Named or away members are greyed out.
  - c3, the Tally: faces, answers, what changed, the net, and a doorway figure when someone will come back.
  - Keys: 1/2 answer, 3 (or ◀▶ then Enter) Hand it off, C close the doors, O Chair settings, Enter next / start the Night, Esc back from Hand it off.
- **Chair settings** (O on the Chair): length (Off/Short/Normal/Long), numbers (Arrows/Exact), speed (Normal/Fast; Fast drops the reactions and the entrance). They are kept in the run's block, so no settings save bump.
- Ledger: "Press" (the Chair's fame) adds to Notoriety. Chair money is booked on the Ledger's Chair lines (dirty or clean).

## Card status (150)
- **132 live** (113 at D12; cards 56, 74 and 81 in the D13 follow-up; D11's seven in the D11 follow-up; 82 in D14, below; D15's and D16's in their slices; 8 and 9 in the D8 follow-up). Some of them are limited: one part waits for a later slice, and the card shows it as a note ("waits for D9") or as a number that the later slice will use (Hero Threat, Goal, Stability, raid odds, Shadow, Wipe Out).
- **Hero Threat** (D11 follow-up): `threat:N` answers now move the Hero's Threat (`hero.nudge`, through `setChairHero`, so chair.ts doesn't import hero.ts). Threat a D12 save kept in `chair.owed.threat` is added once on the next night. The Threat crisis (card 150) comes at Hero Threat 90+. The seven cards that waited for D11 play: 92 (the Hero's route tomorrow), 93 (Listen, or the Hero at the door tomorrow), 94 (still a D10 part: the Holding Pens), 95 (a town left alone: no Boss actions there), 96 (Goal still waits for D14), 120 (Legendaries 7 days later, or a Legendary hunt) and 150 (the Letter: the Hero at the door with the HQ's Defense as levels off their team and Threat −20 the next day, or flee: Control in one town gone). They use a new `hero:` effect (`hero:intel:N`, `battle`, `letter`, `spare`, `late:N`, `hunt`, `lose`).
- **Tension** (28 answers and the Chair deals) now moves the region's rival team (D9, `addTension`), through a hook rivals.ts sets (`setChairTension`), so chair.ts doesn't import rivals.ts.
- **18 waiting** (disabled, never drawn; each names its slice):
  - D10 (fence, gyms, bribes): 11
  - D5 (buildings): 6
  - Blaine's quiz: 1

- **`hook:` answers** (D13 follow-up): an answer whose rule lives in another slice's file says `hook:id`, and that slice registers it with `setChairHook` (like the Tension hook).
  - 56, the insurance man: the weekly deal, plus flag `insured`: a raid that gets into the Warehouse or the vault takes `rivals.raid.insured` (50)% less (rivals.ts).
  - 74, the caught Rival spy: flag `agent:<team>`; that team's weekly plan always shows (`planSeen`).
  - 8, the Admin who wants a cut (D8 follow-up): `hook:squad-cut` puts the Admin in `squads.cuts`; each paying job of a squad they're in, or of a squad in the Group they lead, gives up `adminCutPct` (10)% of what it brought in (squads.ts). Card 9 (the same Admin, the Rival's offer) follows from it and plays too.
  - 81, the Rival Boss's assistant: a Debate card for the region's rival Boss right now (an invitation, so no Tension 40+ or win needed), one per team, none once they're your Branch or Merger (debate.ts).

## Saves
No version bump. `block.chair` is optional and is filled the same way every time (`chairOf`), so a D6 save loads unchanged (tested). Each answer is saved, so a reload lands on the same visitor.

## Tests
- `tests/unit/dominionChair.test.ts` (22):
  - Data counts per section, items, foes and species exist.
  - The first sitting is on Day 2 with card 1; follow-ups come on their day.
  - Same seed gives the same result; visitor counts at their limits; draw rules.
  - The crisis card comes first, and every crisis answer leaves the red.
  - Close the doors; refusals; Chair Off.
  - Hand it off and the whisper; deals; the door fight; owed numbers and Press; new Leads; items and stores.
  - Save/reload mid-sitting; a D6 save; a damaged block is refused.
- Older Dominion unit tests (D4, D5, D9, D10, D11, D13, D21, D24, D25) turn the Chair off (`quiet()`) so their nights stay the same. With the Chair off a Crisis visitor still comes when a number is in the red, so the D11 test answers it.
- Browser `tests/e2e/dominionChair.spec.ts`:
  - Day 2's sitting, three window sizes, settings (Exact numbers).
  - Hand it off (the named member is greyed out), reload mid-sitting.
  - The Tally, then the Night.

## Limits
- Round 4 (D26): the Chair wears the Nova livery (`stage`, the sigil centred on c1) and every Chair key strip starts with the Q Wheel key; the wheel itself is D28. Esc on the Chair does nothing until the Boss Menu (D27-D30), which will also move the Chair settings onto the Settings page.
- While a sitting is open, O is the Chair's settings (D7's Founding keeps O everywhere else).
- The visitor has no walk-in of their own. The panels' shared entrance plays when Dominion opens (see D6).
- The card text is copied word for word, so some answer labels keep the list's "he" for the member.
