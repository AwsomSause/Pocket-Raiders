# Catalog Overhaul: legends (row 13)

Branch `claude/project-thread-gdpy7l` (PR into `ui-mockups` not opened yet). Contract for other threads: `/mnt/project-files/plans/catalog-overhaul/LEGENDS_PIECES.md`.

## Done (pushed)
- Chain pseudo-stages per category (`src/data/catalogOverhaul/pseudo/<category>.json`, `start: 'opened'`, `team`).
- Alpha calm fights: wild event battle `alpha: true`, `rule.calm`, `calm` effects; items `calming-balm`, `az-flute`; Alpha Mark (+10% HP); `calmed-alpha` count; `partyAlpha` condition.
- Signs (`sign-<legend>` -> Influence and ladder lines) and Tellings (`telling-<mythical>`), mirror flags (`blessing-*`, `guest-*`, `promise-*`, `blessing-company/solitary`).
- Blessings and Ultra Beast Incursions on by default: settings v44 migration (coordinator gave v44). Automated browsers on fresh settings keep the old baseline unless `?legends=1`.
- Tests: `tests/unit/coLegendsEngine.test.ts`, settings v44 tests in `settingsV20.test.ts`, `tests/e2e/blessings.spec.ts` (8 passed with milestone1/2 specs). Targeted unit files pass; the full unit run was stopped before it finished (pause on 2026-11-15).

## Alphas A2-A11 (built 2026-11-15, `tools/events/co/legends-1.ts` -> `co-legends-1.json`, 42 events)
Door Alphas (A2 Black Tide, A3 Frostbound, A4 Hushed One) are chain pseudo-stages in `src/data/catalogOverhaul/pseudo/legends.json`. New: abilities Hush and Three Faces (`src/data/catalogOverhaul/abilities/legends.json`, engine.ts), moves Keeper's Lamp and Last Winter, held item Shed Horn (`src/data/itemCatalog/legends.json`). A ball-caught Alpha keeps only the Alpha Mark (run.ts). Tests: `tests/unit/coLegendsAlphas.test.ts`.

| Id | Doc | Re-read | Known limits |
|---|---|---|---|
| story-alpha-black-tide | A2 | 2026-11-15 | none |
| story-alpha-frostbound | A3 | 2026-11-15 | the egg is given hatched (Frigibax with Last Winter) |
| story-alpha-hushed-one | A4 | 2026-11-15 | AN36 "five signs" reads flag `prince-signs` (anime thread to set it) |
| story-alpha-orchard-warden | A5 | 2026-11-15 | "a rest node that gives Berries for the run" is given as Berries now |
| story-alpha-quarry-king | A6 | 2026-11-15 | the local Leader is unnamed |
| story-alpha-rooftop-watcher | A7 (DEEPENED_1) | 2026-11-15 | A1 Braviary remembers line not built (needs families-c's flag name) |
| story-alpha-sleeper | A8 (DEEPENED_1) | 2026-11-15 | the later-runs afterstory is cut (same-run memory rule) |
| story-alpha-static-choir | A9 (DEEPENED_1) | 2026-11-15 | power cut sets `choir-tripped` only; candlelight shops not built; "team awake" not checked |
| story-alpha-unwelcome-guest | A10 (DEEPENED_1) | 2026-11-15 | Perform does not check which performance was won |
| story-alpha-weeping-lantern | A11 (DEEPENED_1) | 2026-11-15 | released-Pokémon last name and the both-paths afterstory not built |

Keeper's Lamp's accuracy guard is not built (plain 80-power Water move).

## Mega Anomalies M1-M6 (built 2026-11-15, `tools/events/co/legends-2.ts` -> `co-legends-2.json`, 24 events)
Pack questlines, so the status file lists them under `extra` (M1-M6 -> entry event). Re-read against QUESTLINES_ALPHAS_AND_ANOMALIES.md part two.

| Code | Entry | Shape | Built | Limits |
|---|---|---|---|---|
| M1 | co-m1-absol | Companion A5, 11 | follow / break stone / grave, Absol joins or leaves | none |
| M2 | co-m2-harvest | Region A9, stages 2/5/8 | farm, bribe, mine (2 checkpoints), seam vs Celosia | none |
| M3 | co-m3-twins | Companion A6, 12 | cutter two nodes on, both whole or one scorched (your Charizard can calm it) | none |
| M4 | co-m4-mirror | Door A7, 14 | pseudo chain `ps_mirror_spider`: rooms 1-3, central room, merge or split | none |
| M5 | co-m5-tatsugiri | Single A4, 10 | contest or feed, verdict, tie gives a later ride | none |
| M6 | co-m6-flower | Single A17, 11-13 | fence, reactor, AZ's Flute | none |
| M7 | co-m7-glow | 2026-11-15 | a rival episode on the rivals row's rival slot (`slotFree`/`takeSlot`); opinion counts at Trust 4+, else by personality (Hothead = bitter-challenger/champion-chaser keeps, Gentle = protector/idealist seals, others by Trust); Seal gives a Mega Ring (the game's Key Stone), flag `rival-mega-sealed`; Keep = rival Lead +1, flag `rival-mega-kept`; `co-m7-loose` at meter 5 | the stoneless Mega is not shown in the battle itself (the rival's ace does not Mega on screen); the out-of-control fight is a 1-Pokémon rival fight, not a calm bar |

The region Anomaly meter is run flag `mega-meter`; `syncLegendFlags` resets it to 0 when the region changes. Tests: `tests/unit/coLegendsMega.test.ts`.

## Delta Anomalies D1-D8 (built 2026-11-15, `tools/events/co/legends-3.ts` -> `co-legends-3.json`, 43 events)
Catalog ids: `delta-clue-nest/-scales/-song` and `delta-research-battle` rebuilt (D1); `form-clue-*` and `form-research-battle` merged into them; `delta-research-week` is a rule (the calendar week). D1-D8 listed under `extra`.

| Code | Entry | Built | Limits |
|---|---|---|---|
| D1 | co-d1-linden (+ linden-again) | Journal, clues need it, 3 clues open the habitat (Catch / Study / Sample), named at 3 studied, Lens at 5, letter if only caught | the Delta Lens is a flag and a Moment: map question marks not built |
| D2 | co-d2-valley (chain d2, 3 beats) | carry the ember (Fire-type), a recent faint dims it (Revive or let go), Charmander starter never fails, Ho-Oh Sign; carried = Delta Charizard + Delta Charizardite, forced = no stone | "the carrier faints" is read as any party faint in the last 18 fights |
| D3 | co-d3-hill | awake one by the run's own season, visits in four seasons wake the fifth, gran gives Leftovers, a caught one keeps the fifth asleep | uses the in-run calendar (28-day seasons), not the real date; "bring it back to stand in it" not built |
| D4 | co-d4-cove (chain d4, 3 beats) | 5 finds by tell over three beats, wrong guesses count, elder needs all 5 and no misses (4 with your own Ditto), pick one of 4 types | 5 finds stand in for 18 |
| D5 | co-d5-dump | six cage fights, the boss (report / pay 3000 / guards), leave = scattered | released-species cage not built |
| D6 | co-d6-marsh | vent (Ground-type, doubles vs water/ice), take the Wooper, tend (back a region later), Groudon blessing or Groudon in party opens it | none |
| D7 | co-d7-crossing-1..3 (stages 3/6/8) | signal by Flying-type, sound move or Flash; three signals bring it down; stay / catch / pod; Lugia Sign | none |
| D8 | co-d8-cloud (+ rest 1-3) | coax over rests, apple skips one, Pikachu starter lands at once | "no battles between rests" not enforced; "comes down at the Final Reunion" not built |

Tests: `tests/unit/coLegendsDelta.test.ts`.

## Z Anomalies (built 2026-11-15, `tools/events/co/legends-4.ts` -> `co-legends-4.json`, 59 events)
Catalog ids rebuilt: the 18 `island-trial-*` (Z1), `z-sigil-ruin`, `z-sigil-pool`, `z-form-trial` (Z2); `z-move-trial` is a rule (the calendar week). Z3, Z4, Z6, Z7 under `extra`. Z5 (Darkrai) waits for the Mythicals.

| Code | Entry | Built | Limits |
|---|---|---|---|
| Z1 | island-trial-<type> | the first Trial gives the Z-Ring; Start = Totem (Alpha-sized) fight; Ask = the Totem's reason, then a calm fight (crystal + the item it guarded); Grand Trial after three (Kahuna Olivia), no battle if all three calmed; crystal of the starter's type; Swarm Totem lets you in at 3 calmed Alphas | puzzle stage is one line of text; captains for Electric (Calder) and Psychic (Lune) chosen by me since the pack names 14 originals for 15 slots; "remembers a past run" cut (same-run rule) |
| Z2 | z-sigil-ruin | pairs: ruin, then pool a stage later, then the Z-form test (catch it to keep it); keep the sigils = `sigils-held`; Oriel's rubbing on the third pair | "re-shape one of yours" is the sigils spent in Z3/Z4/Z6 for a Z-Mega stone; no general re-shape |
| Z3 | co-z3-cave | spring / Fire-type / stay (Never-Melt Ice); Fire starter = Z-Haunter at once; sigils = Gengarite Z | none |
| Z4 | co-z4-night-1 (3 nights) | follow / grab / leave, the grave, Straight Spoon (held, Psychic +10%), three bent spoons; sigils = Alakazite Z | none |
| Z6 | co-z6-dojo | three friendly spars across the region, Doran or the sigils (Snorlaxite Z), Munchlax; leaving = an Alpha Snorlax a region later | Road Roster remembers not built |
| Z7 | co-z7-hill | needs 3 calmed Alphas at night; Hunt (calm a fleeing Furret), Hold (survive 5 turns, 7 if a Noble was beaten), Howl (a sound move); bow at 6 calmed; fed Poochyena skips the hunt; 3 rounds = Poochyena with **Pack Call** (new ability, engine) | "next region's Alphas calm/hostile" is a flag only (`alphayena-bowed`/`-prey`) |

Tests: `tests/unit/coLegendsZ.test.ts` (incl. Pack Call). Old-seed fingerprints: legends items added to `LATE_ITEMS` in story.test.ts (no re-pin).

## Legendary questlines L2-L15 (built 2026-11-15, `legends-5.ts` L2-L8, 54 events; `legends-6.ts` L9-L15, 35 events)
Pack questlines (status `extra` L2-L15). Every Legendary fight is a pseudo fight. Recognition: with that Legendary's blessing at Influence 7+, a variant lets it offer itself. Catching the blessing's Legendary gives Communion through the existing blessings code.

| Code | Built | Limits |
|---|---|---|
| L2 Birds | three cliffs (chain l2), Articuno = survive 6 turns with no attacks, Zapdos = 4 climbs (non-Ground lead is paralysed, 3 strikes fail), Moltres = 4 wind checks (a Fire-type relights once), landing battle, the jealous third after two | crests across runs cut |
| L3 Ho-Oh | feather, three burnt footprints (help sets `hooh-helped`), Bell Tower: 3 = roof (battle or Sacred Ash), 1-2 circles, 0 grey | no "lost for good" Pokémon outside Nuzlocke, so Ho-Oh always "simply waits"; Sacred Ash is the item (no free rescue roll) |
| L4 Lugia | pseudo chain `ps_lugia_whirl`: 3 whirl islands (fight / wait / ask that island's bird), still sea if all birds passed, island 4 answers; Silver Wing | Aqua submarine not built |
| L5 Mewtwo | pseudo chain `ps_mewtwo_lab`: three questions, honesty from what you did (rival beaten, a recent faint), 3 honest = battle or leave in peace | "no Pokémon released" counts as honest (releases are not tracked) |
| L6 Weather | towns, two bases (take Orb / listen / report), Sky Pillar (Flying-type retry), finale: calm Kyogre or Groudon (need 6, or 3 when both leaders were heard), or Rayquaza after the Pillar | the Drought/Deluge header is the placer's; the arena does not alternate weather |
| L7 Eon | three bridges (fight / draw off / break the lens with a Steel or Rock move), garden: hold 6 turns or get Latias out; Blue Mind jewel; all lenses broken = no overload; Eon Ticket | Final Reunion bench not built |
| L8 Regis | five doors (do as it says = it joins, force = full-anger fight, leave it for him), Regigigas meadow (wake / sleep / ask the others) | the acts are told, not checked turn by turn (only Registeel needs a Steel-type) |
| L9 Lakes | Uxie (truth checked against your types), Mesprit (who you'd leave costs Bond), Azelf (lose, then "Again" = Red Chain), Spear Pillar (Time / Space / both = survive 8, Giratina Sign) | Uxie's "forget a move" penalty is a flag only |
| L10 Tao | stone (needs a Fire- and a Water-type), the divided town (N follows on "Both"), tower: Reshiram / Zekrom / both crack (Kyurem Sign) | Kyurem fusion and the rival's far-side dragon not built |
| L11 Life | wake the tree (both, doubles) / stop the lab (Yveltal at night) / the green lights (needs `zygarde-cells`) | AZ on the ridge not built |
| L12 Nebby | Lillie, three Aether attempts, the altars: Lillie keeps it, or (if Nebby chose you) Solgaleo by day / Lunala by night | Ash questline link is the families' |
| L13 Necrozma | summit: fight / give it light (survive 6) / let it take Solgaleo's or Lunala's light; Poipole at Faller rank 5 | the Sun/Moon Legendary is not removed after the fusion |
| L14 Wolves | relics, two red nights, the Weald: sword = Zacian, shield = Zamazenta, both = Eternatus fight then choose | Swordbert crown not built |
| L15 Wards | put back (doubles vs the Ruinous four) / find the seller (3 clues, Gilt Circle guards) / pull the rest (healing x0.6 for the region, the four roam); tablets add "Apologise" | the curse is healing x0.9 per stake, not a stat drop; stake-woods not built |

Tests: `tests/unit/coLegendsLegendary.test.ts`.

## Mythical Visits MY1-MY22 and Z5 (built 2026-11-15, `legends-7.ts` MY1-MY12, 36 events; `legends-8.ts` MY13-MY22 + Z5, 29 events)
Each Visit opens for a believed Mythical (`believed-<id>`, three Tellings) while no Mythical has visited this run (`mythical-visited` 0), never forces a battle, and ends in the Promise room `co-my-<id>-promise` ("I promise." / "Not this run." = ₽500 / "What happens if I break it?" comes back). "I promise." sets `vow-<id>`: `core/legends/signs.ts makeVow` makes it the Guest exactly as accepting a rolled Visit does (one per run; no-op for disabled Mythicals). Mythical fights are pseudo one-on-ones with no items, so nothing is caught. Placement shape `Visit` (hidden "?").

| Code | Built | Limits |
|---|---|---|
| MY1 Mew | play / go away (steals an item) / sit | the stolen item is not returned; double forgiveness not built |
| MY2 Celebi | bowls, or three saplings over Stages 2, 5, 8 | the reverting forest and the past-run forester cut |
| MY3 Jirachi | at Night; wish for team (better draft) / someone / nothing | "starts with forgiveness" not built |
| MY4 Deoxys | three tone rounds (a wrong answer retries a stage later), Forme choice flag | the Forme is a flag only (no Wonder) |
| MY5 Phione | save it (Water-type or line) | Manaphy's later-run half and Keepsake cut |
| MY6 Victini | glory = one-on-one (lose: "Again." once), them, honest | |
| MY7 Shaymin | thank / carry to water (2 nodes) / pick a flower (retry next stage) | |
| MY8 Meloetta | three notes (sound move for the third), 3 = dance, 1-2 = corrected, 0 = gone | |
| MY9 Hoopa | three rings over three stages, the sandwich scene at the third | stolen-item return not tracked |
| MY10 Marshadow | the shadow spar / ask / look away | no Promise: Marshadow is disabled (its Visit needs past runs) |
| MY11 Arceus | co-my11-pedestals (2026-11-15) | same-run version: comes at the last rest before the League (last region) to a run whose Guest still walks with it, Promise never broken (`guest-true`); "My Pokémon" is refused and asked again; "Nothing" = two commandments instead of three. The Judgment covers the rest of THIS run (heal less, pay more, catch less), gives the starter's type its Plate power (catalog Plate, or that type's charm where the items.json Plate is a Rage item), and one rewrite (revives / +3 levels / rivals -5 levels for the region). Cut: ten Promises on the save, the next-run Judgment, the Azure Flute keepsake, the remembers lines (all past-run) |
| MY12 Pecharunt | favour / yes / no (it comes back next stage); "Ah. One of mine." with a Loyal blessing | "kept by breaking it" not built; the Honest Trade Card is the markets row's |
| MY13 Darkrai | at Night: tell a nightmare (heal) / watch / ask about the pale shape; Cresselia variant | "+10% over max HP" is a full heal; double forgiveness not built |
| MY14 Keldeo | one-on-one, win or lose ends in the Promise; Swords variant | Resolute form not built |
| MY15 Genesect | stand down / wake (hard fight) / leave / type nothing, then HOME? | "already awake next run" cut |
| MY16 Diancie | sing (only the nervous hum works) / strike (chipped) / a sound move (+1 Bond); Carbink variant | chipped does not change forgiveness |
| MY17 Volcanion | nothing (retry next stage) / help / the poacher camp (free, report, tell it) | the Ranger is told, not built |
| MY18 Magearna | three doors and the note | the bouquet hand-over at the last stage (a Parting) cut |
| MY19 Zeraora | lightning over three stages, then the test | "took a wild one's side" is not checked |
| MY20 Meltan | feed (an item) / shoo (comes back with friends) / ask the tinkerer | |
| MY21 Melmetal | forge (an item for a better draft) / refuse / ask | Melmetal's Promise is disabled; Meltan stays the Guest; feeding eight is not counted |
| MY22 Zarude | the fruit, then the child (never / find the family / not my business) | |
| Z5 Darkest Dream | Darkrai as Guest + `promise-step-darkrai` 2 (new-events row), at Night: refuse / Z-Mega Darkrai fights beside you once (ally) and rests heal 25% less for the region; Cresselia hides "Do it." | wild Pokémon starting drowsy not built |

Wonders and most Promise rules are still Beta 0.7 limits (promisesData.ts: only Zarude's rule and Wonder run in the game). Tests: `tests/unit/coLegendsMythical.test.ts`.

## Ultra Beast questlines U1-U9 (built 2026-11-15, `legends-9.ts`, 26 events)
Every entry needs the Ultra setting on this run (`ultra-on`, a mirror flag `syncLegendFlags` now keeps with `ultra-static` and `ultra-beast-<species>`). Beast fights are pseudo fights with their Ultra Rule on; a Beast Ball catches as usual. Entering a home world (U2 Deep Sea, U4 Midway, U5 Ruined City) raises `faller-rank` by 1 (this run only). U4 and U5 are Doors (pseudo chains `ps_ultra_midway`, `ps_ultra_ruin`).

| Code | Built | Limits |
|---|---|---|
| U1 Task Force | Looker and Anabel after the first Static (a Beast Ball either way), three missions at rests (₽600, a Beast Ball, a hint), Anabel's ask | missions are told, not checked; mission pay is not Shards (cut) |
| U2 Lusamine | lab battle (3 ways in), the frozen cases, the Tear: follow = Nihilego fight or "Talk to her" (needs Lillie met, `nebby-met`), leave = she returns a region later | Lillie coming through the Tear is the families' |
| U3 Buzzwole | pose back (Fighting/Bug: +Atk), battle (Flex), walk away; the gym's free training | it does not join the next battle on the other side |
| U4 Midway | at Night: three acts (repeating bores the crowd), the curtain, the operator (applaud = a fight plus a Beast Ball), the looping exit | "double catch odds" is an extra Beast Ball |
| U5 Ruined City | the survivor (story / give an item / pay items to pass), the stadium: battle (Devour) / feed it everything / leave | the Final Reunion box and Operation memory not built |
| U6 Kartana | who / help fold / bleeding, then take it home / let it stay / catch it (Paper Cut) | |
| U7 Stakataka | talk (it becomes a house; rest) / knock it down (Many as One) / build beside it (2 nodes, full heal) | the wall is not a lasting Rest node |
| U8 Poipole | it can stay (joins) / find its home / ask the one it holds (High Bond nods) | Cling (double Bond) not built; Poipole simply joins |
| U9 Hole in the Sky | needs the Task Force and Faller rank 2: close it (3 Beasts, +1 Faller) / guide them home (a calm) / let them through | "every Ultra Rule active" after letting them through is told, not built; Faller 3 lowered to 2 (only three home worlds can raise it) |

Tests: `tests/unit/coLegendsUltra.test.ts`.

## The RULE ids (built 2026-11-15, `legends-10.ts`: 7 stops, 155 old events retired)
265 of the 382 RULE ids are in the status `rule` bucket (all retired: REMOVE, or not map events at all).
- **Signs** now come from stops in place of the old landmark, shrine, ruin, echo and Legend Trail events: `co-rule-landmark`, `co-rule-shrine`, `co-rule-ruin`, `co-rule-echo` (Influence 3+), plus `co-rule-sky` (Necrozma) and `co-rule-dream` (Cresselia). They need a blessing (`blessed` mirror flag).
- **Tellings**: `telling-any` (core/legends/signs.ts `tellAny`, stream `mythical-telling-stop`) tells of the half-told Mythical first, else any Mythical that is not disabled. Stops: `co-rule-tale` (rest), `co-rule-ruin`; `co-rule-sky` (Deoxys, Jirachi), `co-rule-dream` (Darkrai). Need Promises on (`promises-on`). The Beta 0.7 per-stage Telling is unchanged (supported Mythicals only).
- **The Presence**: the blessing Legendary is a focus of the Legendary gate (core/legendary/legendary.ts `presenceFocus`): its chance per region is the ladder's 4% to 65%, so the old Legendary and raid stages (`legend-*`, 101 ids, expeditions) are its Presence encounter. Runs without a blessing roll as before.
- **Legend weeks** (7 calendar weeks with a Legendary focus): +1 starting Influence for the matching blessing, one Telling for each Mythical in the week (`weekInfluence` at run start).
- Retired as built elsewhere: the 66 Mythical chain stages (Visit scenes), Red Chain and Sky Pillar (L9, L6 Trials), Static and Tears (Ultra system), Alpha warnings (Alpha questlines).
- The Static Choir and four Visit scenes that come back to themselves now use a room copy (`-again`), so no drawn event is also a room.

Still pending (117, left live on purpose): Giratina, Darkrai, Koraidon and Rayquaza pseudo stages (31), the Shadow chain (stays, Shadow system), old tickets as keys (17), form items as Communion upgrades (7), PAST ALLIES and the Archive (cross-run: cut by the run-memory rule unless Kice says otherwise), rival scenes and weeks (rivals row), evil-team and league weeks, Z/Mega odds weeks, Renegade bargain, Reputation readout, researcher reactions, two weeks with no Legendary focus (`paradox-tide-week`, `leap-day-special`).
Tests: `tests/unit/coLegendsRules.test.ts`. Old tests changed for the retired events: crisisTournament (Legend Trail), disabledEventsEnabled (two retired), shadowWorld (ancient-shrine), zTrials (the Z-Ring is given at the first Trial).

## Beta 0.7 systems checked against the notes (2026-11-15)
| System (notes) | Matches | Gaps left |
|---|---|---|
| Legendary Blessings (`LEGENDARY_BLESSINGS.md`) | blessing roll, tiers, Influence never falls, the ladder (Echoes 3, Trial 5, Recognition 7, Presence 9), Communion on catching its Legendary; now also Signs, Sign stops, Presence on the gate, Legend weeks | "Aligned choices" (+1) and "defeats its guardian" (+2) are not counted; the Trial is placed by the questline, not unlocked by Influence 5 |
| Mythical Promises (`MYTHICAL_PROMISES.md`) | Tellings (3 believe), one Mythical per run, the Promise, forgive-once, the Guest; now Visit scenes and Telling stops for every Mythical not disabled | Wonders and Promise rules only for Zarude (the rest are `limited`); Keepsakes, Storybook, Arceus, Marshadow cut (past runs) |
| Ultra Beast Incursions (`ULTRA_BEAST_INCURSIONS.md`) | Appetites, Static, Tears, Crossings, Incursions, Beast Balls, Homesickness; now questlines U1-U9 and mirror flags | Faller rank is a run flag only (raised by home worlds); Souvenirs and the Faller's Log cut |
| Whole-Run Events (`WHOLE_RUN_EVENTS.md`) | built 2026-11-15: see "Whole Run Events" below | |

## Where I stopped (paused 2026-11-15, Kice: five threads at a time)
- Resumed 2026-11-15 (merged ui-mockups; shared pieces are in the base now). Alphas, Megas, Deltas, Z, Legendary L2-L15 and Mythical MY1-MY22, Ultra U1-U9 and the RULE ids done; next the Beta 0.7 check, update fragment, PR ready.
- Still to build: M7 (rivals slot), the 382 RULE ids (ladder Trial/Recognition/Presence), placement/flags/status files, update fragment, PR.
- Run the full `npm run check` before opening the PR.

## Whole Run Events (built 2026-11-15, `tools/events/co/legends-11.ts`, `legends-12.ts`; engine `src/core/legends/wholeRun.ts`)
- Setting **Whole Run Events** (Gameplay, on by default; schema default, no save bump). Automated browsers on fresh settings keep it off, like Blessings.
- 35% of runs draw one of five at run start (stream `whole-run-event`), marked by flags `wre-on`, `wre-<id>`. Run genesis keeps the setting, so a replay draws the same.
- Ten beats each on the pack's skeleton (placement/legends.json: Beat 1 home step 2; 2-3 first region; 4-6 a region later; 7-9 two later; Beat 10 last region, before the Champion). A beat waits for the one before it, so a late beat catches up; the climax needs only Beat 1.
- Threads are run flags (`gg-faith`, `gg-doubt`, `gg-curse`, `gg-w`, `gg-names`, `gg-lost`; `ww-sea/land/trust/sky`; `mo-purpose/kindness/leash/tools`; `sd-wishes/cost/kept`; `wf-grief/beauty/key/flower`). Endings set `<p>-end-<name>` and a for-the-region effect on the League (boss damage, healing and similar). Nothing ends a run: wild fights pseudo, trainer fights friendly. Tests: `tests/unit/coLegendsWholeRun.test.ts`.

| Story | Beats | Limits |
|---|---|---|
| Guidance of Giratina | all 10, Beat 4 as three rooms (Looker, Rowan, Cynthia), Ghetsis's offer after the Baptism, climax in 3 phases + 3 acts (10/7/4/1 turns) and 6 endings | "the Pokémon obtained most recently" is the lowest-level one (the trade-away effect); the Curse is a region of slightly worse catching and healing, not a per-stage misfortune; outside hooks built: Renegade blessing (Faith starts higher), Ghost-type before Beat 2, Giratina in the party at Beat 8, lying (no Cyrus); not built: releases, evil-team stand, never losing a Pokémon; the Champion's arena and opening line do not change (the ending's effect stands in); the Usurper does not skip the Champion (nothing ends a run); Intensity "Reduced" text not written (Off = switch the setting off) |
| The Weather War | 10 beats, dam third answer, climax survive 8 turns in rain/sun or pick a side; Balance / Drowned / Dry / Long Storm | map nodes do not flood or dry with the Threads |
| The Made One | 10 beats, climax by what it learned (tools: it decides against you; else its makers); Chooses / Stays (Mewtwo joins) / Obeys / Against Us | outside hooks (releases, forced evolutions) not wired |
| The Seven Days | 10 beats, five real wishes each paid by a named person; Blank Tag / Given Away / Seven for One / Goodnight | Jirachi-as-Guest hook not wired |
| The Weapon and the Flower | 10 beats; Buried / Fired Once More / Beautiful World / Still Walking | outside hooks (revives at a cost, blessings) not wired |
- Pack outlines for the last four were written up to full scenes here (the pack gives them at outline depth). Same-run only: the pack's "shuffled bag so all five are seen before a repeat" is a plain draw per run.
