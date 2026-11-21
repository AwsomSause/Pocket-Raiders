- **DOMINION slice D9, "the rival team"** (Evil Mode rework, 2026-11-19; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md`, design Part 4 §1-2, Part 3 §4, Part 9 A7; lists `rival-team-actions.md` and `outside-interactions.md`): Team Rocket now watches the player. Tension (0-100) rises as the player grows and falls on quiet nights. At each of six stages Rocket does more: spies, sabotage, raids on the HQ, kidnaps, Admins in the field, and at 80+ Giovanni raids the HQ in person (a battle at the door). The player answers on the new Rival File (key R).

## What's built
- **Data** (validated with Zod in `schema.ts`, loaded in `data.ts`):
  - `src/data/dominion/rivals.json`: a team for each of the 9 regions (only Kanto's Team Rocket is on), its Boss, Admins, Grunts and 7 sites; the six Tension stages; every number for Tension, Action Points, the weekly plan, raids, the Boss raid, truces, spies, kidnaps and street meetings; all the lines.
  - `src/data/dominion/rivalActions.json` (150 actions) and `outside.json` (300 rows), made from the two lists by `tools/dominion/rivals-to-json.py` (run it again if the lists change).
- **Rules** in `src/core/dominion/rivals.ts`:
  - Tension: +1 per 5 Control where Rocket has a stake, +1 per new member, +5 per HQ level; −1 a night after 2 quiet nights. Stages: Unaware 0, Watching 20, Annoyed 35, Hostile 50, At war 65, Boss 80. Each change is told on the Morning.
  - The weekly plan (A7): on day 7, three priorities by the Boss's personality and Action Points = 1 + stage + 1 per Admin. The plan is hidden unless a spy is inside, a deal or a tail learned it, or an Operations Room works at HQ Lv. 3+.
  - The World Turn's rival step (third, after the crew and the police): one action a night while points last, weighted by stage, plan, rooms and members. 36 kinds of action carry out all 134 live rows of the list.
  - Raids on the HQ hold by chance: 30% + Defense, guards on a guard task, your spies, raid-defence rooms; minus their spies, what they know and their arms. A held raid costs them power.
  - The Boss raid at 80+: warned 3 nights ahead (the threat row), then fought at the door in the morning through the fight bridge (Giovanni's team, cut by Defense and guards). Win: a Rocket site is yours, +30 Dread, Tension −30. Lose: the costliest room wrecked, half the money above the Treasury taken, the least loyal member held; Tension falls to 70. A loss never ends the run.
  - Cards to answer: challenges (a battle with a Grunt squad, an Admin or the Boss), demands, deals (their plan), defectors (a new lead), truce offers, street meetings (outside interactions F, O141-O165, met on a Boss action where Rocket has a stake).
  - Truces: pay a weekly tribute, Tension −10 now and each week, no raids or actions while it holds; breaking it is +30. Held members: ransom, a rescue task, or let go after 7 days.
  - 8 new crew task kinds (Spy, Tail/Decode/Steal Their Plans, Counter-Spy, Poach, Sabotage/Raid/Ambush, Rescue, Pass Rumours, Negotiate a Truce) and 17 Boss actions (Poach, Peace Talks, Declare War, Hunt the Snitch, Counterstrike, Court Day and more), gated by Tension, spies and raids.
  - Rolls use new streams only (`dominion-rival-<team>`, `dominion-rival-card`), so no older roll moves.
- **Screens**:
  - The Morning badge reads Rocket's Tension (mockup 2: "Tension: RISING"); rival alerts carry the tag ROCKET.
  - The HQ shows mockup 9's threat row ("TENSION 83 · Giovanni will raid your HQ within 3 nights.") and an R hint.
  - The Rival File (`src/ui/redux/screens/dominion/rival.ts`, controller `src/scenes/dominion/rivalController.ts`, model `src/core/dominion/rivalScreens.ts`): Giovanni's portrait, Admins, the Tension meter and stage, the week's plan, raid and truce, spies, Rocket's 7 sites, the answers and what they did. Keys: R opens it from the HQ or the Morning (or click the badge or the threat row), ▲▼ and Enter answer, R or Esc closes it.
  - The Crew File and strip show a held member ("Held by a rival team").
  - 3 new pictures in `public/assets/images/dominion/` (t-giovanni, g-dire-hit, p-moltres; see PROVENANCE.md).

## Saves
- No block bump. `rivals` is a new optional field on the v2 block; a save without it reads as Unaware and gets it on the next night.

## Lists: how much is in
- Rival team actions: 150 of 150 in the data. 134 live (119 supported, 15 limited with a note), 16 disabled with their slice: D10 6, D11 4, D13 2, D14 2, D15 1, D4 1.
- Outside interactions: 300 of 300 in the data. 25 live (section F, the street meetings), 275 disabled with their slice: D10 180, D6 50, D15 25, D11 20.
- Buildings: 94 live (was 65), 172 disabled; none wait on D9 now.
- Field actions: 62 played (was 45). Crew tasks: 58 live (was 33).
- Other regions' teams are in the data but off until the region slices.

## Tests
- `tests/unit/dominionRivals.test.ts`: 36 tests (data, stages and tiers, growth and cooling, the plan and points, raids, kidnaps and ransom, every live action, the Boss raid won and lost, truces, cards, street meetings, crew tasks, Boss action gates, the screen models, old saves, save and reload, failure cases).
- `tests/e2e/dominionRivals.spec.ts`: the threat row at 1280x720, 960x540 and 800x600; R opens the Rival File; pay a demand; offer a truce; the Morning badge; a click on the badge; reload.
- Changed counts in `dominionField.test.ts` (62 actions played) and `dominionHq.test.ts` (94 buildings live).

## Known limits
- Only the region's first team acts (one team per region until the region slices add more).
- Street meeting choices that need a later slice (a Debate, an item, a Pokémon for the stores) say so in their line and do nothing more yet.
- Rocket's own fights use the Gym Leader trainer class; Giovanni uses his Gym Leader id when one exists in the data.
