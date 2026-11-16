# Catalog Overhaul row 17: Pokémon Moments (POKEMON_MOMENTS.md)

Thread: "Build 100 new events and Pokémon moments". Built on local branch `moments-wip` after the new events (PR #1323); the catalog lead combines the row PRs.

## What is built (2026-11-15)
Data: `src/data/pokemonMoments.json` (243 moments). Rules: `src/core/moments/pokemonMoments.ts` (schema), `src/core/battle/pokemonMoments.ts` (battle), `src/core/battle/revivalStatus.ts` (the 15 last-stand statuses), `src/core/moments/runMoments.ts` (rest and evolution). Camp scenes: `tools/events/co/pack-moments.ts` built to `src/data/events/co-pack-moments.json` (`npm run co:build -- pack-moments`); each opens beside a rest stop from its rest moment, so it never lands in the random rest pool.

| Part | Ids | Built | Status |
|---|---|---|---|
| 1 Type moments | PT1 to PT18 | 14 entries (some share one) | supported |
| 2 Archetype moments | PA1 to PA16 | all | PA6, PA14, PA15 limited (below) |
| 2B Last-stand revivals | PA17 to PA31 | all, with 15 revival statuses | supported; audio from Kice |
| 3 Group moments | PG1 to PG18 | all | PG1, PG17 limited |
| 4 Species moments | PS1 to PS45 | 29 entries for 25 moments, 5 kept from the earlier draft | see below |
| 5 Individual moments | PI1 to PI14 | PI1, PI3, PI4, PI5 | see below |

The pack replaces matching moments (same species, same trigger): Eevee's Bond became PG1 Sibling Rivalry; Snorlax's Lazy Afternoon became PS8. Everything else stays. The five species moments already built from the pack's earlier draft (Formation!, Legendary Pokémon, The Headache, The Howl at Night, The Hammer: PS25, PS29, PS14, PS30, PS24) keep their `p2-` ids.

## Known limits
- **Limited:** PA6 (the every-stage tutor move is not built), PA14 (gifts only for Mew, Jirachi, Celebi), PA15 (holds at 1 HP or more), PG1 (no family photo), PG17 (no Galarica Twig item yet), PS16 (heals 25% of max HP instead of a temporary extra 25% max HP), PS27 (no run album: the painting is told, not kept). PG6 needs two living Swords; PG14 applies only when it leads. Celebi's gift is a Revive (out of battle).
- **Species moments not built (disabled, reason):** PS4 Cubone (needs a choice in the middle of a battle), PS7 Absol (needs a warning on the map path), PS19 Aegislash (no record of trainers lost to this run), PS23 Gholdengo (shop haggling hook), PS26 Shuckle (Berry Juice is a held heal; the no in-battle heal rule), PS31 Haunter (no stranger trade offers), PS34 Klefki (locks), PS35 Unown (Hidden Power type choice), PS36 Spinda (spots from the save file), PS37 Luvdisc (SF158 does not exist), PS39 Minior (choice after a faint), PS41 Pyukumuku (no beach nodes), PS42 Lapras (no sea nodes), PS43 Feebas (Beauty does not reach max in a run). PS3's sticker and PS44's album page are left out (no stickers or album); the moments themselves work. PS1's Mr. Pettigrew memory and PS11's applause wait for SF134.3 and SF118.
- **Individual moments not built:** PI2 (time in party is not tracked), PI6, PI7, PI8, PI11 (SF133, SF134.1, SF142, SF134.5 do not exist), PI9 (trades come with the markets row), PI10 (Box time), PI12 (no following Pokémon), PI13 (rival trade attempts are not recorded). PI14 is dropped: it carries a memory to another run, against Kice's same-run rule. PI4 is a +5% on any run-end revival for a nicknamed Pokémon, not its own entry.
- **Revival memories held:** marigolds, lost, psychic study, SF140, SF141, SF118, SF69, SF96, SF158 (their flags don't exist). PA28's cross-run memory dropped (same-run rule). PA1 stays at 50%.
- **Audio Kice supplies:** `public/assets/audio/moments/pa17_*.ogg` to `pa31_*.ogg` (sound, voice and theme per revival, names in each scene's data). A missing clip plays silent.

## Tests
`coMomentsPack.test.ts`, `coMomentsRevivals.test.ts`, `coMomentsGroups.test.ts`, `coMomentsSpecies.test.ts`, plus `pokemonMoments.test.ts` and `world.test.ts` (rooms opened by moments). Old-seed fingerprints unchanged (moments are off there). A gotcha found on the way: importing `co/neRules` into `events/coToolkit` changed module load order and moved the fingerprints, so the Rotom line reads the stage theme itself.
