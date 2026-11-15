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
| gn.14–gn.62 | not started | |
| gn.new.01–38 | not started | |

## Limits (documented)
- gn.06 "a later run finds a signpost": cross-run memory is not allowed (Kice 2026-11-14), so a later bridge in the same run shows the sign and the village stall instead.

- gn.07 "permanent night": shown by the stage's dark tint; the rule that matters (rain: Fire halved, Water boosted) is on every fight. The Barn's "Ask [Fire-type] to sit with it." reads "Ask your Fire-type to sit with it." (labels can't hold a name).
- gn.10: the Captain's Compass is a next-stage item (shows the wild Pokémon ahead), not a held item. Trade A uses the region's generation (every generation in the game's own regions). The engine-room "File" is flag `ssanne-engine-opened` + Rocket heat until the Evil Team row reads it; the Collector at later auctions reads `ssanne-collector-refused` (markets row); the Stowaways' Flight North bonus reads `ssanne-trio-seen` (gn.13). Ship fights are friendly: a blackout puts you ashore.
- gn.09 "Bill's Egg Notes: egg-move information" is given as an egg move for the party lead (the old canon reward); there is no egg-move info screen. "A Notebook event" half of the stairs line waits for an event that lets the player write; the fog half reads `fog-named`. A failed search (fewer than three right readings in five) ends the night.
- gn.08 Squad fights can't be caught (one member joins at the end); the doc's "theft chance 5% lower at Flight North" waits for gn.13 (reads flag `kanto-squad-joined`).
- gn.07 remembers an abandoned Pokémon by run flag `abandoned-mon`: gn.new.03 (The Ball That Wouldn't Open) and the Trubbish Nobody Wanted must set it.

- gn.11 "Each turn, each party Pokémon can fight or rescue": the tide gives four turns; a Water- or Flying-type in the party rescues in one, otherwise two. Assists, boats and pylon stuns land before the fight, as boss HP already lost (6% per rescue, 9% boats, 6% per pylon stun, 6% more per stun the Machop braces); each pylon is +1 Attack for the boss. "Free it": the party's HP pays for the two turns of panicked swings (more if angered). The stage header "Something in the Harbour" from Step 1 is not shown (no stage-header hook). Out of Kanto there is no harbour market to shut. The Kaiju is no longer catchable (the gift is the Tentacool).
- gn.13: Flight North fights can't be caught and allow no bag items (the team is gone). The S.S. Anne trio raises the theft odds (+5%), the Squad and Heat 6+ lower them.
- gn.12 Swap Alley uses tradeFor (similar strength, wider, anything); the Honest Trade Card and nature pick wait for the markets row's `honestTrade`. Costume Stalls: ribbons are Bond (outfits for the player wait for an outfit system). The hatchery is a trade for a sand-warmed Egg that hatches after the next battle. The Fairy HMs are taught on the spot (no machine case to keep them). "Dusk" is the evening period.

## Fixes found on the way
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
