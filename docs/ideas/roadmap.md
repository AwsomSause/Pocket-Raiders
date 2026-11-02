# Roadmap from the 2026-11-02 idea review

Record of answers: `docs/ideas/review-2026-11-02.md` (S approved/rejected + director comments). R1-R560 = all approved ("YES TO ALL"). G1-G1103 = unanswered (form came back blank): do not build until Kice answers.

Existence column comes from a keyword scan of `src/` and `docs/status/` (2026-11-02), not a code audit. "Check" means verify the real feature before building; "Gap" means no hit.

## Already in the game (check, then only fill gaps)
Nuzlocke, Daily Run, Endless, level caps, mentors, retirement, Pawn/Black Market/Auction/Crafting/Recipes, Raids/Totems, replays, mastery/prestige, trophies, photos, weather/day-night, contests, Safari, quiz, fossils, Mega/Z/Dynamax/Tera, Berry Garden, ranch, news/radio/phone, trading cards, rival systems, item-using AI (`battle/autoBattle.ts`, `enemyItemsUsed`). Comment items: S271 "all trainers use items" (check trainer AI covers every trainer, not only autoBattle), S51 Hisuian fossils (add Hisuian-form fossils to the Fossil Lab), S465 storage holds a set amount per run (`boxCapacity` exists: check it is capped), S6 "Gamemode" (a run modifier draft: pick 1 of 3 as a game mode; 12 modifiers already exist on the Prep Desk).

## Slices, in order
| # | Slice | Ideas | Status |
|---|---|---|---|
| 1 | Badge Powers (badge passive matches Leader type) | S483 | **Built** (`docs/status/badge-powers.md`) |
| 2 | Heat Levels: stacking opt-in difficulty with reward multiplier, ordered Challenge Gate | S176, S104, S178 | Gap |
| 3 | Run Modifier Draft (pick 1 of 3 run rules at start; "Gamemode") | S6, S374 | Gap (modifiers exist) |
| 4 | Bond Levels + Legacy Lines (descendants keep a signature move) | S47, S59, S58 | Gap |
| 5 | Share Codes + versioned seed format + Challenge Cards | S198, S343, S200 | Built (S343 PR1 seed code already existed) |
| 6 | Catch Chains, Shiny Charm tiers, Release Rewards | S218, S225, S226 | **Built** (`docs/status/catch-chains-shiny-charm.md`) |
| 7 | Battle Frontier facilities: Factory, Palace, Pyramid, Arcade | S439-S443, S490 | Gap |
| 8 | Challenge modes missing: Randomizer, Time Attack, Tag Team, Triple, Hot-seat | S298, S303, S302, S293, S203 | Gap |
| 9 | Hisuian fossils and Fossil Lab upgrades, Museum | S51, S93 | Check |
| 10 | Move/combos: Combo Moves, Combo Ability Pairs, Move Fusion, Charge-Up | S26, S167, S155, S164 | Gap |
| 11 | Presentation skins: Frutiger Aero, DS, Wii Channel, Cyber-Maximalist, CRT filter, sound packs | S246-S249, S259, S261 | Gap |
| 12 | Content pack loader + mod hooks + feature flags | S194, S325, S332, S344 | Partly (config packs exist; Save Inspector S330/S331 built, `docs/status/save-inspector.md`) |
| 13 | Run events R1-R560, built by section as event-data batches (existing `events.json` pipeline): A Merchants 1-50, B Trainer battles 51-110, C Wild scenes 111-180, D Villains 181-235, E Helpers/moral 236-285, F Games/puzzles 286-345, G Training 346-385, H Mysteries 386-435, I Cameos 436-470, J Weather/hazards 471-505, K Run-wide modifiers 506-560 | R1-R560 | Gap (per-event check needed) |
| 14 | Everything else approved in S (see review file), grouped by its section heading | rest of S | Backlog |

Rules for every slice: one PR per slice, notes in `docs/status/<slice>.md`, no `public/assets/manifest.json`, provenance row for any new asset, save bump needs a migration test. Mobile support is another thread's work.

Category files (one build thread each): `docs/ideas/categories/README.md`.
