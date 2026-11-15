# Catalog overhaul row 15: Greenneedle events

Branch `claude/project-thread-uehq47`, draft PR #1314 into `ui-mockups`.

## Status: resumed 2026-11-15 (merged ui-mockups with the catalog foundation)

| Event | State | Doc re-read |
|---|---|---|
| gn.01 Poli-Pond | done, tests pass | yes |
| gn.02 Pidgey's Resolve | done, unit + browser tests pass | yes |
| gn.03 | done, tests pass | yes |
| gn.04 Mt. Moon | done, tests pass | yes |
| gn.05 Damian's Unofficial Gym | done, tests pass | yes |
| gn.06 Bridge Crossing and the Hidden Village | done, 11 tests pass (Kanto: canon space cs-kanto-cerulean-bridge opens it; old hv-* scenes retired) | yes |
| gn.07 Cold Night's Rain | done, 9 tests pass (Kept Flame ability, Flame 0-5, owner fights, Flame-5 solo fight; Kanto: cs-kanto-cerulean-rain) | yes |
| gn.08 The Squirtle Squad | done, 12 tests pass (hose Speed −1 now works in wild event fights; Squad can't be caught; recruit kit; Kanto: cs-kanto-cerulean-squad) | yes |
| gn.09 Bill's Lighthouse | done, 10 tests pass (search hub + 5 nodes; Bill's PC = PC on the road, Recorder = new perk `revealOne`; Kanto: cs-kanto-cerulean-bill, canon flags now copy from any later room) | yes |
| gn.10 The S.S. Anne | done, 10 tests pass (12 trainer cabins, trades A/B/Delta/secret, 11 optional rooms capped at 4, Dobbs-Leary, captain, rival, gift; Kanto: cs-kanto-vermilion-ssanne) | yes |
| gn.11 Kaiju Tentacruel | done, 6 tests pass (rescues on a four-turn tide, Ned's hook, pylons, the raid with its four moves and Tentacool calls, free / defeat / float, the lost ending, the sea-battle return; Kanto: cs-kanto-vermilion-kaiju now an event, the canon den is no longer placed) | yes |
| gn.12 Maiden's Peak | done, 5 tests pass (market hub: Lantern Row, TM Hall of 24 by type on two rotating boards, Swap Alley, Egg Row, stalls and boxes, Dusk Vendors, Madame Roux, Tea House; five sightings, two right turns of three = Blessing; Fairium Z or three Fairy HMs; Tea House hub every later stage; the portrait; Kanto: cs-kanto-vermilion-maiden) | yes |
| gn.13 Flight North | done, 4 tests pass (must-see check at step 17, theft 50% ±5 for the Squad, Heat 6+ and the S.S. Anne trio; bully, meadow, cocoon, Harden-only stream, wings, camp, Jessie & James with the shiny rescue, goodbye returns the team; Kanto: cs-kanto-vermilion-flight, old flight rooms retired) | yes |
| gn.14 Sabrina's Labyrinth | done, 6 tests pass (door step 11, "?" badge; unwinnable first fight; one of four ghosts L10 to L40; six lanterns: sleepwalker fight, mirror, four-door memory, two doors, floating floor, riddle; Sabrina with the false slot and the ghost rescue; goodbye; return one region later; Kanto: cs-kanto-saffron-labyrinth, old lab rooms and the ev-sabrina-labyrinth opener retired) | yes |
| gn.15 Route 25: The Angry Mankey | done, 6 tests pass (must-see step 6; Screech, Fury Swipes, the Berry, one 25% breath, Low Kick; the fifth stands, "Wait." twice lets you pass; the camp first or as a side stop on the next step, with the three doc choices; the fifth or one of the four joins with Swords Dance and Mach Punch, Bond +2 for the food, Black Belt if nobody fainted; the Berry grove afterstory; Kanto: cs-kanto-saffron-r25, old r25 rooms retired) | yes |
| gn.16 The Fighting Tournament | done, 9 tests pass (needs the Route 25 Mankey; five 1-on-1 rounds scaled to it, 40% heal between, prizes; commentary; Crowd 0-5; montage Power/Guard/Footwork once each, Rest at the fourth gap; Throh bow, silent Hitmonchan, Hawlucha misses twice; Pax's final with the last exchange; title, Dynamic Punch, Champion's Entrance; prize money choices; out keeps prizes, a lost final returns next region; rival's belt return; Kanto: cs-kanto-saffron-tournament, old t/tm/t-win rooms retired) | yes |
| gn.17 The Polluted Factory | done, 12 tests pass (door step 8 optional, must-see variant with the Kaiju float; six nodes: gate with the waiver File, two pipe fights with Sludge and burst pipes, Dr. Stroud and his research, the pits (free six, Grimer horde, the Trubbish remembers), the Muk in the wall, the control room (three valves, the line-stop lever, the new form through the glass); three-phase Magmuk raid (spread moves split it, the burning floor with Water as steam, the core with Finish it. / Stop attacking. / Let the Muk go to it.); Black Sludge and a pick, the Muk with the new Stopgap ability; research sold or given; shutdown changes water routes for the region and Mr. Scrimshaw fishes later; a lost raid locks down and drops what was caught inside; Kanto: cs-kanto-fuchsia-factory, old rooms retired) | yes |
| gn.17–gn.62 | not started | |
| gn.new.01–38 | not started | |

## Limits (documented)
- gn.06 "a later run finds a signpost": cross-run memory is not allowed (Kice 2026-11-14), so a later bridge in the same run shows the sign and the village stall instead.

- gn.07 "permanent night": shown by the stage's dark tint; the rule that matters (rain: Fire halved, Water boosted) is on every fight. The Barn's "Ask [Fire-type] to sit with it." reads "Ask your Fire-type to sit with it." (labels can't hold a name).
- gn.10: the Captain's Compass is a next-stage item (shows the wild Pokémon ahead), not a held item. Trade A uses the region's generation (every generation in the game's own regions). The engine-room "File" is flag `ssanne-engine-opened` + Rocket heat until the Evil Team row reads it; the Collector at later auctions reads `ssanne-collector-refused` (markets row); the Stowaways' Flight North bonus reads `ssanne-trio-seen` (gn.13). Ship fights are friendly: a blackout puts you ashore.
- gn.09 "Bill's Egg Notes: egg-move information" is given as an egg move for the party lead (the old canon reward); there is no egg-move info screen. "A Notebook event" half of the stairs line waits for an event that lets the player write; the fog half reads `fog-named`. A failed search (fewer than three right readings in five) ends the night.
- gn.08 Squad fights can't be caught (one member joins at the end); the doc's "theft chance 5% lower at Flight North" waits for gn.13 (reads flag `kanto-squad-joined`).
- gn.07 remembers an abandoned Pokémon by run flag `abandoned-mon`: gn.new.03 (The Ball That Wouldn't Open) and the Trubbish Nobody Wanted must set it.

- gn.11 "Each turn, each party Pokémon can fight or rescue": the tide gives four turns; a Water- or Flying-type in the party rescues in one, otherwise two. Assists, boats and pylon stuns land before the fight, as boss HP already lost (6% per rescue, 9% boats, 6% per pylon stun, 6% more per stun the Machop braces); each pylon is +1 Attack for the boss. "Free it": the party's HP pays for the two turns of panicked swings (more if angered). The stage header "Something in the Harbour" from Step 1 is not shown (no stage-header hook). Out of Kanto there is no harbour market to shut. The Kaiju is no longer catchable (the gift is the Tentacool).
- gn.17: the raid is three wild fights against the Magmuk (A+2, uncatchable), one per phase, not a raids.json den, so each phase can carry its own rule; the Molten Sludge restarts at 6 minus the Pokémon freed in each of phases 1 and 2, and the core has none. Sealing the pipe is what lets the Muk follow (feeding it doesn't free it). "Send the Muk in front." is the choice that picks its phase; it makes the Magmuk lose its first turn. A Muk that went with the Magmuk can't also be the reward. The professor's special Ball is 3 Dream Balls. "Left running" sets `factory-left-running`; the Stranding (gn.new.17) and the Kaiju's return must read it. Stopgap also covers flinch, confusion and stat drops; it works from the bench.
- gn.16: "Lands a first-turn hit" does not raise the Crowd (an event can't see the fight's turns); a win at half HP or less is "from behind". The Machop twin's shouting is +1 Speed for the bout (you react first). Guard is Defence and Sp. Def x1.1. "You choose." gives +1 priority to the first move; the player still picks it. The last exchange is a second bout: the rival starts it at 20% HP, yours as it was. The fighter is any Mankey or Primeape in the party after gn.15 (the recruit isn't marked). Prize money: ₽3000, or ₽1500 split. Nobody uses potions in the ring.
- gn.15: the "Wait." button is a choice in the room before the fifth's fight (the battle screen has no extra button); the fifth stands for its first turn in the fight too. "Opens with Screech" starts your lead at Defence −2. The red "!" badge is the event's own badge. A lost gauntlet fight sends you on with no recruit. Remembers read `fed-poochyena` and `egg-returned` (the Taken Egg rows must set them). gn.16 reads `kanto-mankey` and `mankey-food-returned` (the troop in the crowd).
- gn.14: "Once per save" is once per run (no memory across runs). The grave shows "a name you know" for `lost-mon` (no name is stored with the flag). The puzzles are choices; a wrong answer costs the ghost 20% HP and restarts that trial. The Shedinja line reads `shedinja-answered` (gn.new.07 must set it); the cruel body reads `hoenn-cruel` or `robbed-trainer`. The core Labyrinth rules (canonSaffron.ts) now point at the gn-14 rooms.
- gn.13: Flight North fights can't be caught and allow no bag items (the team is gone). The S.S. Anne trio raises the theft odds (+5%), the Squad and Heat 6+ lower them.
- gn.12 Swap Alley uses tradeFor (similar strength, wider, anything); the Honest Trade Card and nature pick wait for the markets row's `honestTrade`. Costume Stalls: ribbons are Bond (outfits for the player wait for an outfit system). The hatchery is a trade for a sand-warmed Egg that hatches after the next battle. The Fairy HMs are taught on the spot (no machine case to keep them). "Dusk" is the evening period.

## Fixes found on the way
- New: gn op `check` (a flag from conditions), gn test `hurtLead`, gn rules `hawlucha`, `final` (pauses at both under 25%), `lastExchange`. Pseudo chains stop at canon gates, and retired events open nothing in the reachability test.
- New: gn op `ahead` puts an event on every node of the next step (a side branch); a wild event fight can hold an item (`held`).
- Flight North's nickname made a half-built care record (no mood or fatigue), so every stat of the named Bug-type came out NaN and the first hit knocked it out: the name now goes on a full care record.
- Door events (gn.03/04/06/07) used stop `dungeon`, so the Landmark Dungeon placer could pick them: now stop `event`.
- Greenneedle items (Moon Stone Shard, Bottle-Cap Badge, Damian's badge) are gift-only, so they never enter reward drafts (old-seed fingerprint back to green).
- Event fight rules' stat stages (`stages`/`myStages`/`foeStages`) now also apply to wild event fights.
- A join that teaches several moves keeps all of them (it used to overwrite the last slot each time).
- An event raid whose boss is caught now pays its `win` effects (it used to pay nothing).
- Older tests updated: retired Cerulean canon rooms (bridge, village, squad, rain) dropped from canonCerulean.test.ts; world/eventMemory walk `gn` effects; placed stops sit outside the drawn quota; plain-stage tests use `withoutDoors`; test autoplay plays a chain room when it is the only way on.
- Placement data: the placer reads `tags` as stage needs, so the doc's category labels now go to `kinds`, `needs` become `tags` ("cave|high" = either; `core/co/placement.ts` tagHolds), and the key event's own beat gives its step and stage. Before this no Greenneedle event was ever placed.

## Still to do
- Files 2–13 of the pack (gn.06–62; reconcile gn.13–16), then the 38 new events.
- gn.new.09 The Last Stop: when the Dusknoir punches the ticket set flag `last-stop-ticket` = 1 and start node timer `{ kind: 'flag', key: 'ovt-last-stop', amount: 0 }` (pairs with families-b row 3). Any scene that loses a Pokémon for good sets flag `lost-mon`.
- Tell the legends thread about `eventBattleLost` now using `choiceAt` and the `remembers` walk in `pseudo.ts`; tell the Kanto canon thread about retired ids (`pp-rematch-exceptional`).
- Samurai Slash power 70 → 60.
- gn.10 trades: switch to the markets row's `honestTrade` effect (branch claude/project-thread-uvwqv1) once that PR is in ui-mockups.
- Update fragment `docs/updates/catalog-overhaul/greenneedle.md`, Playwright spec, `npm run check`, mark PR ready.
