# The Overhaul: repository audit (P0, Phase Zero)

Written 2026-11-06 for Kice. This is the baseline the rest of The Overhaul is measured against (Beta 4.4 (2) sections 3, 5 and 6).
Short version: **the game's rules are in good health.** Thousands of automated battles and runs found no crash. Main's browser tests were red and have been fixed (PR #777). The Pokémon database matches the official data except for a few learnset typos and one missing evolution, now fixed.

## 1. How this was checked

All on `main` at `a2004718` (2026-11-06), on a 4-core / 15 GB cloud machine.

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | Pass. It needs more than Node's default 2 GB of memory here (`NODE_OPTIONS=--max-old-space-size=6144`); CI has enough. |
| Unit tests | `npm test` | **4,214 passed**, 1 skipped, 0 failed (362 files, about 10 min) |
| Build | `npm run build` | Pass. One JavaScript file of **15.3 MB** (2.7 MB compressed); see section 4. |
| Content gate | `npm run report:check` | Pass. All 16 checks at 0 (missing sprites, broken evolutions, untested save migrations…) |
| Asset audit / load budget | `report:assets`, `report:perf` | Pass. 731 pack files with provenance; first load 21.2 MB of the 25 MB budget |
| Battle fuzz | `npm run fuzz:battle` ×2, new seeds | **3,000 random battles, 0 failures** (no crash, no NaN, no impossible result) |
| Bot playtests | `tools/playtest.ts`, 600 runs (300 with healing so they go deeper) | **0 errors, 0 stuck runs, 0 broken numbers** across every trainer, mode, difficulty and modifier |
| Browser tests | `npm run test:e2e` | **Red on main**: 11 of 227 failed in the last 4 main CI runs (#748 to #751). Fixed in PR #777. |
| Pokémon data vs official | `npm run data:validate -- --official` (new) | Stats, types, abilities, Pokédex numbers: **all 1,290 official entries match**. Learnsets: 76 entries no official game teaches; 20 fixed, rest listed below. |
| Import cycles | script over `src/` (626 files) | `src/core` never imports Phaser (good). 5 import cycles, one big (75 core files around `run.ts`); see section 4. |

## 2. Critical bugs found and fixed

| # | Bug | Effect on a player | Fix |
|---|---|---|---|
| 1 | Main's CI red: 11 browser tests failing | Every other thread's PR showed red; real regressions could hide | PR #777. The Beta 4.4 skip guard swallowed instant test key presses (now off only in automated browsers). Tests read dates, prices and boss names from the game instead of fixed numbers. |
| 2 | **Tympole had Timburr's learnset** (Leer, Low Kick, Hammer Arm, Stone Edge, Focus Punch…) | A Water Tadpole that learns Fighting moves | Its real learnset (Growl, Bubble Beam, Muddy Water, Hydro Pump…) |
| 3 | Signature moves on the wrong Pokémon: Crabominable learned **Dynamax Cannon** (Eternatus's) at 45, Torkoal learned **Infernal Parade** at 47, Galarian Moltres learned **Fiery Dance** instead of its own **Fiery Wrath** | Wrong, sometimes much stronger, moves | The official move at the same level: Dynamic Punch, Inferno, Fiery Wrath |
| 4 | Other dataset typos: Appletun missed its signature **Apple Acid** (had Acid Armor), Toxtricity (both forms) Disable for Discharge, Galarian Moltres Growl for After You, Buneary Ally Switch for Swift, Toucannon Fury Cutter for Fury Attack, Poltchageist Strength Sap for Giga Drain | Missing or wrong moves | Same-level official move |
| 5 | **Nincada never gave a Shedinja** (5.2 special evolutions) | A whole species could not be obtained by evolution | When Nincada becomes Ninjask and you have a Poké Ball, the ball is used and a Shedinja (same level and moves) is offered like a caught Pokémon: join, PC or release. Works after battles and with Rare Candy. |
| 6 | **Bruticate and Alphayena could not use any TM or tutor** (no TM list) | Custom evolutions locked out of TMs, tutors and mentors | Species with no TM list borrow the one of the species they are a form of or evolve from (Bruticate gets Raticate's). |

The fixes live in `src/data/speciesFixes.json`, on top of the generated `species.json`, so they survive a rebuild of the data. If a rebuild fixes one at the source, the game refuses to load the old fix and the tests say which one to remove.

## 3. Pokémon database (section 6)

**Checked against PokeAPI's official data** (github.com/PokeAPI/pokeapi CSVs) for all 1,290 official species and forms. 347 custom forms and Pokémon have no official entry; they go through the same in-game checks.

| Field | Result |
|---|---|
| Pokédex number, name, types, base stats, abilities and hidden abilities | 100% match |
| Catch rate, base experience | Match (one known difference: Keldeo Resolute's base EXP 261 vs 290, harmless) |
| Gender ratio | Match, except the female forms (Meowstic-F, Indeedee-F, Basculegion-F, Oinkologne-F) which are 100% female on purpose |
| Growth rates | Match (the game calls PokeAPI's "medium" by its usual name, medium-fast) |
| Evolutions | Every official line exists. Only Nincada → Shedinja was missing (fixed). Trade, friendship and other methods become items as GAME_DESIGN §5c says (Linking Cord, Soothe Bell…), on purpose. |
| Level-up learnsets | 20,804 entries; 76 no official game teaches. 20 were clear errors and are fixed (section 2). 18 are "Vise Grip", which PokeAPI spells "Vice Grip" (not an error). The other ~33 are small, harmless extras from the director's move dataset (e.g. Palkia Metal Claw at 1, Deoxys Toxic Spikes, Zygarde Bide); `npm run data:validate -- --official` lists them. Not changed, since no official replacement at that level is obvious. |
| TM / tutor / egg lists | Every species now has one. Many include PokeRogue egg moves and Tera Blast that PokeAPI doesn't list; this is the game's design (PokeRogue source), not an error. |

**New repeatable validation (6.6):**
- `src/quality/speciesAudit.ts`: checks every species and form for: types (1 or 2, no repeat), all six stats, stat total in range, abilities present and not repeated, learnset not empty and no repeats, at least one usable move, a TM list, gender ratio, a sprite name, evolutions that point both ways, stages, and no loops. The game's loader already rejects unknown moves, abilities, items, regions and evolution targets.
- `tests/unit/speciesDatabase.test.ts` runs it in CI (0 problems today), plus tests for each fix and for Shedinja.
- `npm run data:validate` runs the same checks by hand. `npm run data:validate -- --official` also compares with PokeAPI. Run it after any species data change.

## 4. Other findings (not critical; for later slices)

| Area | Finding | Suggestion |
|---|---|---|
| Performance | The whole game is one 15.3 MB JavaScript file (all data JSON is bundled in, e.g. bossTeams 3.9 MB, species 1.9 MB). The first load is slow on phones. | Split the big data files into lazy chunks (Vite dynamic import). This is the biggest load-time win. |
| Performance | Typecheck needs over 2 GB of memory. | Fine on CI. Split the biggest files if it grows. |
| CI time | The browser tests alone take about 46 min on CI (the last main runs). | Shard Playwright across 2 to 3 jobs. |
| Architecture | 75 `src/core` files form one import cycle around `run.ts` (run → system → run). It works, but makes systems hard to test alone. Four small cycles too (e.g. `rarity` ↔ `availability`). | Move shared helpers (`newMon`, `nextUid`, counters) out of `run.ts` over time. |
| Tests | Several browser tests hard-coded prices, dates or texts that later features changed. This is why main went red. | New browser tests should read numbers from the game, like the fixed ones now do. |
| Evolution | Evolutions at the Workshop "class" service drop moves the Pokémon had no room for, and can't give Shedinja there. Map services have no decision screen. | Small follow-up: give services a way to queue decisions. |
| Data | Mega and Gigantamax forms record the base's *previous* stage as "evolves from" (e.g. Mega Venusaur from Ivysaur). Harmless: nothing evolves into them. The audit skips them on purpose. | Could point them at their base form at the next data rebuild. |
| Assets | 10 pack files may be unused, 30 are over 500 KB (`report:assets`). | Review during the asset overhaul (Phase One). |

Areas checked with no new bug found: battle init and turns, damage and types (fuzz), status, switching, fainting, victory and defeat, rewards, run progression, saves (every save upgrade has a migration test; the gate reports 0 untested), content cross-references (16 gate checks at 0).

## 5. Dependency map of major systems

```
Phaser screens (src/scenes, src/ui) ──> GameSession (src/game) ──> save manager (src/save, versioned + migrations)
                                              │
                                              v
                                   run state machine (src/core/run.ts)
     ┌──────────────┬─────────────┬───────────┼─────────────┬──────────────┬───────────────┐
  encounters     battle/engine   rewards    evolution     events/story   map, shops,   hub/meta
  (themes,       (damage, held,  (draft,    (items,       (story, drama,  services,     (profile, quests,
   rarity,        abilities,     catalog)   friendship)    rivals)        camp)          mastery, bank)
   availability)  transform, AI)
     └──────────────┴─────────────┴───────────┴─────────────┴──────────────┴───────────────┘
                                              │
                                   content (src/data/index.ts: Zod-checked JSON + speciesFixes)
                                              │
                                   seeded RNG streams (src/core/rng.ts)
```

## 6. What to protect during The Overhaul

- Determinism: the same seed and actions give the same run (fingerprint tests, named RNG streams).
- Save upgrades: run v38, settings v33, profile v18 at the time of writing, each with a migration test.
- The 16 content-gate checks at 0, and the battle fuzz and bot playtests at 0 failures.
- Main's CI green: rebase and wait for green before merging (PR #777 restores it).
