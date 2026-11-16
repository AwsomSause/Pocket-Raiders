# Evil Teams Volume III, row 10: Kalos, Alola, Galar and Paldea from inside (Flare; Skull and Aether; Macro Cosmos and Yell; Star), their third options, and 58 open scenes.

Catalog Overhaul row 10. Sources: `TEAM_FLARE_KALOS_FULL_1-3`, `TEAM_SKULL_AETHER_ALOLA_FULL_1-3`, `MACRO_COSMOS_YELL_GALAR_FULL_1-3`, `TEAM_STAR_PALDEA_FULL_1-3` and their parts of `EVIL_TEAMS_VOLUME_3_A-D` (pack `/mnt/project-files/catalog_overhaul_pack/catalog_overhaul/`). Built on the inside-route engine from #1336 (`core/evil/inside.ts`, see `co-evil-story.md`). No engine, save or schema changes.

## What's built
| Region | Inside route (Offer, Acts 1-5, Operations, recurring and inside-only scenes, officers alone, loyalty test, found out) | Endings (chain maps) | Third option | Open scenes |
| --- | --- | --- | --- | --- |
| Kalos | `evil-story-30` (Flare; Act 3 is `ps_fl_stones`) | `evil-story-31`: `ps_fl_plan/turn/az/own` | Team Ember (`ps_ember_laundry`, A Cup of Tea) | `evil-story-32`: L1-L12 |
| Alola | `evil-story-33` (Skull and Aether, one Offer each; Act 3 `ps_sk_cold` / `ps_ae_cold`) | `evil-story-34`: plan, turn and both per side, `ps_ae_case`, `ps_sk_placed` | Team Tidepool (`ps_tp_entries`, `ps_tp_still`) | `evil-story-35`: AL1-AL12 |
| Galar | `evil-story-36` (Macro Cosmos and Yell; Act 3 MC is `ps_mc_flicker`) | `evil-story-37`: `ps_mc_plan/turn/lift/own`, `ps_yl_plan/turn/bought/own` | Team Encore (`ps_enc_quarry/island/12k`) | `evil-story-38`: GA1-GA12 |
| Paldea | `evil-story-39` (Star; Act 3 is `ps_st_file`) | `evil-story-40`: `ps_st_plan/turn/academy/own` | Team Homeroom (`ps_hr_lunch1/2`, `ps_hr_pyjamas`) | `evil-story-41`: PS1-PS12 |

- Ranks per region: `_evil-story-sync.ts` `ROUTES` (flare, skull, aether, yell, star). Offers after The Files: `OFFERS` in `evil-story-1.ts`.
- Placement: `src/data/catalogOverhaul/placement/evil-kagp.json` (158 open scenes, Operations and rest scenes, from each FULL_3 part E). Acts, Final Choices and third-option climaxes are callbacks the engine schedules; rooms ride their entry. Neither is placed.
- Flags read from row 10b (Hoenn/Sinnoh/Unova): `flags/evil-kagp.json` `external` (`lantern-founded`, `openhand-founded`, `unova-sealed`). **If row 10b names them otherwise, rename them here and in `evil-story-39.ts`/`-40.ts`.**
- Tests: `tests/unit/evilInsideKagp.test.ts` (Offer and Act 1 per team, Galar's two Offers, Odin asks at 7, walking out at 10, Paldea's Final Choice gates, Homeroom's founding, every chain map, every placed event).
- "Take it all" in each region ends the team story as allied and sets `evil-start-<region>`; it does not open Evil Mode (on hold, Kice). Its first-hour decisions are flags only.

## Limits (documented, not stubs)
- **Galar:** the region's team is Yell, so the Macro Cosmos route runs on Yell's meters and one rank list (Supporter ... Piers's Opening Act); the side is the flag `galar-side-mc` / `galar-side-yell`. GA1's rubbing shown to Rose/Peony/Zane/Oleana and GA3's lamps in the outside Rose battle are not built.
- **Alola:** the open scenes assume the region's team; "Placed" letters come as five bundles of eight over the rest of the run.
- **Mechanics as flags or text:** Kept/Overcharged marks, Ultra Beasts once a stage, "lead can't be confused", rest heals in full, storm tag removal, Encore's coach next node free, world-state drops (`paldea-quiet`, `world-state-down`), Spare Helmet (flag `spare-helmet`, not a Key Item), the Region of Doom's Cassiopeia Engine (`engines-saved`), Read in the Yard's bases as rest-and-shop nodes (`star-club`), Homeroom's chair once a stage (one event), Penny's Sylveon Terastallising.
- **Keepsakes are cut** (Kice, Nov 13): the Shed's hairdryer (PS3) is not offered; Clive's detention slip (PS10) is the flag `clive-slip`.
- **Prompts stand in for mini-games:** the chant "rhythm game" (`echo-rhythm`), carrying, the flag at dawn, Giacomo's legs bar, Clive's board (`brace-hold`).
- **Conditions the game can't read:** PI2's "lost a battle" lesson is always offered; its Shadow lesson is not built (no purified flag). Penny's "your Pokémon faints" bark is not built. PS4's "hood comes down a line sooner" and the A14 lines beyond three per scene are dropped where a scene already has three memory lines.
- **One effect is capped:** Galar's "Come and look at it first" gives Suspicion -3 (the effect's limit), not -4.
- **Fill-in lines** (the docs give a choice but no answer; written short, in voice): Alola's rent/passed Guzma, loyalty-test meters, AL1's report answer; Galar's ordered Operation texts and officers' replies; Paldea: Act 1 "Is this allowed?", Act 3 "Go in first" / "Hold out a hand", Act 5 "The same." / "A Director who listened", every ordered Operation line, PO6 "Come to the yard" / "(Stay on the line.)", PI3 "Who's Achird for?", PI4 "(Say nothing.)", the five bosses' unanswered choices, Odin's "You tell them", walking out at Suspicion 10 (Team Star doesn't battle you; the docs give no found-out scene), PS1 "Who'd know", PS2 "Did you teach them?", PS3 "whoomp", PS5 "Can a grade be withdrawn?", PS6 "What was she typing?", PS7 "Does Yusuf know?", PS8 "Show him yours", PS9 "Were you here?", PS11 "What's the badge for?", the outside gate's battle line, and the Offer's yes/no/Looker lines.
- **Team Homeroom's "refused the Academy"** is read as "never agreed to help Clive" (`star-clive-friend` unset).
- Sprites: Paldea uses `boss.giacomo`, `boss.ortega`, `trainer.pr/mela`, `trainer.pr/atticus`, `trainer.pr/eri`, `trainer.penny`, `trainer.gentleman` (Clavell), and Paldean Drive NPCs for the rest; Nascour and Harrow have no own art (rich man, office worker).
