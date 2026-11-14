# Pocket Raiders: full handoff after Beta 0.6, before Beta 0.7 (2026-11-14)

Give this file to a new Claude project (or a new thread) first. A fresh Claude should be able to continue without asking questions. It replaces the 2026-11-12 handoff. Repo: `AwsomSause/pkmn` (private). Live site: https://awsomsause.github.io/pkmn/ (GitHub Pages, redeploys on every push to `main`). Director: **Kice** (GitHub `AwsomSause`), a beginner programmer in the **Pacific time zone**. Write plain language, keep replies short, use Pacific times.

## 0. Where things stand (read this first)

- **Beta 0.6 INSTRUMENTALITY, "You Are (Not) Alone"** is merged to `main` (PR #1260, commit `371ac4d6`, 2026-11-14) and live. It is the first two milestones of the INSTRUMENTALITY plan: groundwork, balance and rivals (1.0) and the Kanto Evil Team saga (2.0).
- **Beta 0.7 is not started and its scope is not decided.** Two candidates are on the table: the rest of the INSTRUMENTALITY plan (milestones 3.0 and 3.0+1.0) and Kice's Node Event Menus idea (recommended as the 0.7 headline). Section 8 lists everything; section 8.8 lists the decisions only Kice can make.
- **A full bug investigation ran on 2026-11-14** (section 6). It found two real game bugs and two out-of-date browser tests, all fixed in PR #1261. Everything else checked came back clean.
- **Main CI** on the 0.6 merge commit: typecheck, all unit tests, build, content gate and bot playtests were green; 4 of 6 browser shards were green; shards 1 and 4 were red on one out-of-date test each (not game bugs). PR #1261 makes both green again.
- **Save versions:** profile 20, run 43, settings 42, meta 1, timeline 1. Next free: profile 21, run 44, settings 43.
- **Biggest known gaps in what shipped:** only Kanto has saga content; Raids 1, 3, 4 and 5 cannot be reached in a live run; the Extended Cut has no Settings switch (dev hook only); 11 of the new settings are stored but read by nothing; Pokémon moments run in single battles only; late game is still unmeasured because the test bot rarely passes region 2.

---

## 1. What the game is

A complete, deterministic, browser-based **Pokémon roguelike**, meant to be fun to replay. A run goes through regions (stages, gym towns, Elite Four, Champion, final boss) with a walkable Hub Town between runs. Working and integrated beats feature count. Same state + seed + actions = same result.

Style: flowy, bouncy, animated. Aesthetics: Frutiger Aero, DS era, Wii era, Cyber-Maximalism. Assets come from Kice's packs (PokeRogue AGPL-3.0, Nintendo material); keep provenance for every asset and dataset. The repo stays private.

Modes: Story Run, Classic runs, daily, challenge modes, Raids, Totems, Mega-Expeditions, 34 minigames, Battle Frontier (now with a Triple format), Galar Stadium and Champion Tournament.

## 2. Architecture (hard rules)

Stack: TypeScript (strict), Phaser 3.90, Vite, Vitest, Playwright 1.63.0, Zod. Node 22.

- `src/core` is pure rules and **never imports Phaser**. Outcomes never depend on animation or UI. (Checked 2026-11-14: no Phaser import, no `Math.random`, no clock use in rules.)
- Zod validates all data and saves. Balance numbers live in `src/data/balance.json` or validated data.
- Named seeded RNG streams (`src/core/rng.ts`, `hashSeed("<run seed>::<stream name>::<key>")`; the 0.6 rules also use the plain hash in `src/core/expansion/hash.ts`). A new stream never changes existing rolls. Previews, hovers, asset loading and animations never use gameplay RNG. No reward or event applies twice.
- Presentation failure never corrupts battle state. Respect motion, intensity, skip and audio settings.
- No placeholder behaviour for a requested mechanic. Every content item has a status: supported, limited (documented), disabled or invalid.

Doc router in the repo: `CLAUDE.md` (start) then `STATUS.md` then `MAP.md` (only to find a file) then `.claude/rules/*.md`. Slice notes are one file each in `docs/status/` (grep `docs/status/INDEX.md`, never read it whole). Update logs: `docs/updates/beta-0.6.md` (summary) and `docs/updates/beta-0.6/` (87 fragments, each with Player gets / Save / Limits).

Big files, never read whole: `run.ts`, `engine.ts`, `events.ts`, `contentSchema.ts`, `BattleScene.ts`, `HubScene.ts`, `MapScene.ts`, the generated JSON in `src/data/`. Grep the symbol, then read a 40 to 80 line window.

## 3. Build, test, CI, deploy

- Run: `npm install`, `npm run dev` (http://localhost:5173). URL flags: `?seed=x`, `?campaign=dev` (short 2-region), `?debug=1`; F2 = debug panel. Save Creator: `savegen.html`.
- `npm run check` = typecheck + unit tests + build + content gate. The unit suite is now about 8,300 tests in 598 files and takes about 26 minutes on CI. `npm run test:e2e` = Playwright (135 specs; CI splits it 6 ways). Iterate with single files.
- CI (`.github/workflows/ci.yml`): `changes` (skips heavy jobs on docs-only PRs), `check` (typecheck, `npm test`, build, `report:check`, `report:assets`, `report:perf`, bot playtests), 6 Playwright shards, and a final `CI ok` job. **CI skips draft PRs, so open PRs ready for review.** Pushes to an update branch (like `beta-0.6`) do not start CI; dispatch it by hand.
- New in PR #1261: CI also runs 50 bot runs **with the shipped 0.6 settings on** (`node tools/playtest.ts 0 50 --heal --sides --strict --expansion`). Before this, the bot only played with every 0.6 switch off, which is how a crash on a default-on event got through.
- **Branch protection on `main` is still off.** Kice must set `CI ok` as the required check (Settings > Branches).
- Gotchas: stale vitest cache in sandboxes (`rm -rf node_modules/.vitest-cache node_modules/.vite`). Typecheck needs `NODE_OPTIONS=--max-old-space-size=6144`. Missing `public/assets/manifest.json` in a sandbox causes fake unit failures (`npm run assets:manifest`; never commit that file). Playwright: the first key press after a scene change can drop, wait 250 ms. Browser tests time out when the sandbox is busy; re-run alone before believing a failure.
- Gameplay fingerprints: `tests/unit/story.test.ts` `BEFORE_STORY`. Re-pin only when a slice changed gameplay on purpose; fetch `origin/main` first. Never re-pin to hide a failure.
- `src/data/events.json` is **not** rebuildable with `npm run data:events` (it would wipe about 2,000 events). Edit the JSON and keep `tools/events/*.ts` in step. Run events (`xr-*`) are generated: `npm run data:run-events`. Expansion data: `npm run data:expansion` from `tools/sources/expansion/`.

## 4. Saves

Current versions (`src/save/saveManager.ts` `CURRENT_VERSIONS`): **profile 20, run 43, settings 42, meta 1, timeline 1.** Next free: profile 21, run 44, settings 43.

- Beta 0.6 took settings 42 (adds `settings.expansion`) and run 43 (adds the optional `run.expansion` block). Everything 0.6 stores lives inside those two blocks as optional fields, so nothing else was bumped.
- Any saved-shape change bumps the version and adds a migration with a test. Optional fields need no bump. Never silently drop a save.
- Checked 2026-11-14: 240 runs saved by the Beta 0.5 build (in every phase: map, battle, decision, event, reward, shop) plus 38 profiles and settings all load on the 0.6 build and play on for 500 more steps with a save and reload in between.
- Profile 21 is reserved by the plan for cross-run progress (Reliquary, Storybook, Keepsakes, Doom Ledger, Faller rank). Kice has since cut Keepsakes, Souvenirs and Shards and all cross-run memory, so check with Kice before building any of it.

## 5. Workflow rules and Kice's standing decisions

### Workflow (standing)
- **Token efficiency is top priority.** Short replies, no recaps, read only what is needed, small diffs.
- Every thread opens and owns its own PRs, one per workstream, ready for review. Rebase right before merging. Never merge over a real red CI result.
- **Update workflow:** one shared branch per update (for 0.6 it was `beta-0.6`); threads PR into it; each PR adds `docs/updates/<beta>/<pr>-<name>.md` (Player gets / Save / Limits); an integration lead compiles them and opens one big PR into `main`.
- **Merge rule (Kice, 2026-11-13):** into the update branch, a thread merges on typecheck plus the unit and browser tests related to its change, on a current base with no conflicts. The full check (all unit, all browser) is required only on the final PR into `main`. Direct PRs into `main` wait for their own CI to be green.
- The coordinator and the build lead decide routine choices for Kice; only art, accounts, things that cannot be undone and goal changes go to Kice (with a notification). Kice wants a notification whenever a PR opens or they are needed.
- Never commit `public/assets/manifest.json`. Slice notes go in `docs/status/<slice>.md`. Slices do not edit `STATUS.md` (only its Saves line on a save bump).

### Kice's decisions for INSTRUMENTALITY (A to W, 2026-11-12; full table in `docs/plans/instrumentality/INSTRUMENTALITY_DEFINITION.md` §7)
- **A** A lost climax gives a Second Shot; a second loss gives the worst ending and the run goes on. A story loss never ends a run.
- **B1** No cross-run rival memory. **B2** other cross-run progress was "keep" in the plan, but Kice later cut Keepsakes, Souvenirs, Shards and cross-run memory from the catalog packs: ask before building.
- **C** Keep Story Run. **D** 10 healing items + 6 revives per battle, for the player and for Elite Four, rivals and Champions. **E** No selling: rewrite as trades or money rewards. **F** Coins become money. **G** Prices over the money cap become vouchers (story key items).
- **H** One of each gimmick (Mega, Z, Dynamax, Tera) per side per battle. **I** Triple Battles are in. **J** Reuse the Snag Ball; Capture Styles stay disabled. **K** EXP and Rare Candy rewards are swapped for money or held items.
- **L** Evolution Encounters on; Risky Evolutions off. **M** New screens are built from mock-ups Kice picks (picks in `docs/plans/instrumentality/SCREEN_PICKS.md`). **N** Mic input with a button that always does the same thing. **O** Harder tiers for old minigames (the new 0.6 minigames were later removed by Kice).
- **P** Map the pack's 4 rarity tiers onto the game's 8. **Q** One Friend per run, in about half the regions. **R** Kanto keeps its League. **S** Colossus timer out = the Apex escapes; the climax still counts. **T** Announce hidden tactics. **U** Listed story bosses may field a 7th Pokémon (not built yet). **V** Giratina content gets a warning only. **W** All custom species already exist in the game.

### Later 0.6 calls (2026-11-13)
- Removed all the new 0.6 minigames; the 34 older ones stay. Debates must be real debates (built). Oracle Sabrina uses her own sprite. Shadow Pokémon get an aura. Variant-tagged Pokémon get a visible mark. The Colossus menu is smaller and folds.
- The wild stone chance stays off the Settings screen. Debate ships as built. The Metal Sonic theme is Kice's own file.
- Catalog Overhaul Packs 1 and 2 (in `/mnt/project-files/catalog_overhaul_pack/` and `_pack_2/`): skip the pack's 6 original evil teams; rewrite to 10 heals and 6 revives; strip cross-run memory, Keepsakes, Souvenirs and Shards; once-per-save becomes once-per-run. 0.6 built the rival questlines, hazards and map stops, triple scenes, camp scenes and the choice-memory framework. The rest waits for 0.7 (section 8.5).

### Off or deferred on purpose (do not build without asking)
Capture Styles (built, disabled), zoom, cross-run rival memory, romance, online co-op and cloud saves, the profile journal, extra currencies (vouchers are approved; minigame tokens become plain tries), Risky Evolutions, respec, menu redesigns.

### Game rules that still hold
Level cap 100 in region 1, +50 per region, max 500. HP x1.2. Rival and story losses never end a run. 4 active rivals; first rival has 2 Pokémon with the ace at your level +2. 8 gym towns per region, 6 required. At most 1 cinematic moment per battle. Boss gimmicks: 1 after Stage 5 of Region 1, +1 per region, max 4. Starter Remembrances is the only starter system. Starting trainers: Red, Blue, Green, Hilda, Nate. The trainer is not shown on screen in battle. Grunts are male-only. No selling, 100-item cap, money cap 999,999.

---

## 6. Bug investigation, 2026-11-14

Asked for by Kice after 0.6 merged. Slice note: `docs/status/bughunt-2026-11-14.md`. Fix PR: #1261.

### What was checked and what came back

| Check | How | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | Clean |
| Full unit suite (about 8,300 tests) | PR #1261's CI `check` job | Had to be green for #1261 to merge; the touched test files also pass locally |
| Main CI on the merge commit | Run 2547 | Green except two out-of-date browser tests (fixed) |
| Core rules | grep for Phaser imports, `Math.random`, clock use in `src/core` | Clean |
| Old saves | 240 Beta 0.5 runs in every phase, 38 profiles, settings; load on 0.6 and play 500 steps with reloads | All load and continue |
| Bot playtests, 0.6 settings on | 616 runs: all supported modes, 13 Triples Only, 16 deep runs | Only the two bugs below |
| Event wiring | Every one of 3,260 events forced in a live run, every unlocked choice taken (28,239 choices, 4,980 battles), state checked against the save schema, then played on | 0 schema errors; only the two bugs below (plus 2 bot-only false alarms) |
| Same seed, same result | Each run played twice and once more with a save and reload every 7 actions; the three must match | 68 standard runs and 6 deep Extended Cut runs: all three plays matched every time |
| New 0.6 screens | Dossier, Field Notes (800 and 1280 wide), Track page, Rival Report, Siege Map, Breather, Blackout, Colossus, triples at 3 sizes, Shadow box | No layout problems. (Cast members without art show a silhouette, as expected.) |

### Bugs found and fixed (PR #1261)

1. **Route 22 rival fight did nothing (new in 0.6, on by default).** The Kanto start event `cs-kanto-viridian-route22` gives the rival a mark called `route22-token`, but that name was missing from the list of allowed marks (`src/data/rivalOverhaul.json`). Once a rival was registered, choosing "Face your rival" threw an error inside the rules and the screen just sat there. Fix: the mark is in the list. New tests: the event with a registered rival, and a data check that every mark used by any event is in the list.
2. **Stuck screen after beating an Evil Team leader (since Beta 0.5).** When the win also brought up a move-learning or evolution prompt, the Betrayal's Legendary fight was created but the run stayed in the "decision" phase with nothing to decide. The screen was stuck and the save would not load ("waiting on a decision that is missing"). Fix in `src/core/events.ts` (`continueEventChain` now sets the battle phase). New test covers it, including the save loading.
3. **Two browser tests were out of date** (not game bugs): `rescueScreen.spec.ts` did not know Quiet Extraction now always has a guard fight; `battleDepth.spec.ts` read a battle-screen field that the triples work renamed. Both rewritten to test the real behaviour.

### New checks and tools left in the repo
- `tools/playtest.ts --expansion` and the matching CI step (bot runs with 0.6 on).
- `tests/unit/autoplay.ts` takes `expansion` options and now plays the Pacifist Challenge properly.
- `tools/bughunt/fuzz-events.ts` (event wiring), `tools/bughunt/fuzz-roundtrip.ts` (same seed and reloads; `--extended` for the Extended Cut), `tools/bughunt/old-saves.ts` (save a set of runs in an old checkout, load them in the new one). Run them before every big merge into `main`; each takes 5 to 15 minutes.

### Seen but left alone (not bugs, worth knowing)
- **11 settings are stored but read by nothing:** `climaxSecondShot`, `rivalOverhaul`, `rivalFriend`, `secondChancePct`, `healsPerBattle`, `revivesPerBattle` (the game uses `balance.json` `itemCaps` instead), `blessingsEnabled`, `mythicalsEnabled`, `ultraBeastsEnabled`, `wholeRunEventsPct`, `whatIfCasts`. They are placeholders for 0.7 systems or were replaced by balance numbers. None is on the Settings screen, so players cannot be misled, but a new thread should not assume they work.
- **6 settings work but have no Settings row:** `climaxCut` (Extended Cut), `eventsDensity`, `kantoSevii`, `worldTracks`, `grandArcEnabled`, `minigamesDifficulty`. Players get the defaults. The Extended Cut can only be started with the dev hook `await __pkr.extendedCut()` in the browser console.
- The Colossus fight opens with "A wild Mewtwo appeared!" although the story calls it M2. Text polish only.
- The Dossier shows a dark silhouette for cast members without art (known; art is on Kice's list).
- The event `stand-with-recruiter` throws "No team has noticed you yet" if it is forced where the game would never place it. Its placement rule prevents that in real play.

---

## 7. Beta 0.6: what shipped and how it works

By the numbers: 752 new events, 136 Pokémon moments, 143 cast characters, 110 special Pokémon, 58 special Shadows, 12 Apex records, 14 variant lines, 11 new items, 2 new moves, 1 new ability, 1 new run rule (Triples Only), 11 new browser specs, 54 new unit test files. Player-facing list: `/mnt/project-files/reports/beta-0.6-patch-notes.md`. Content list: `/mnt/project-files/reports/beta-0.6-content-list.md`.

### 7.1 Foundation and switches
- **Settings** (`src/core/expansion/schema.ts` `ExpansionSettingsSchema`, stored at `settings.expansion`). All default on except mic input and the Extended Cut.
- **Run block** (`ExpansionRunSchema`, stored at `run.expansion`, all optional): `track`, `cast`, `dossier`, `raids`, `eventsSeen`, `cut`, `siege`, `apex`, `friend`, `rival`, `rescue`, `canon`, `fieldNotes`, `stageMods`, `grandArc`, `standWith`, `pacing`, `evoEncounters`, `counterPick`, `density`, `climaxCut`, `xe`, `tracks`, `lastFaint`, `league`.
- **How a switch reaches a run:** `GameSession.createRun` reads the settings once and passes `expansion: { stagePacing, evolutionEncounters, leagueCounterPick, kantoCanon, grandArc, worldTracks, eventsDensity, climaxCut }` to `createRun` (`src/core/run.ts`). The run stores them and never looks at settings again, so changing a setting only affects the next run.
- **All switches off = Beta 0.5 behaviour**, proven by a replay test (`tests/unit/expansionFoundation.test.ts`).

| Setting | Default | On the Settings screen | Read by the game |
|---|---|---|---|
| `stagePacing` | on | yes (Busier stages) | yes |
| `leagueCounterPick` | on | yes | yes |
| `evolutionEncounters` | on | yes | yes |
| `micInput` | off | yes (Controls) | yes (no screen uses the mic yet) |
| `kantoSevii` | on | no | yes (Kanto canon spaces) |
| `worldTracks` | on | no | yes (the Ledger) |
| `grandArcEnabled` | on | no | yes |
| `eventsDensity` | normal | no | yes (3 / 5 / 8 story events per region) |
| `climaxCut` | standard | no | yes (dev hook only) |
| `minigamesDifficulty` | normal | no | yes (marks the matching tier) |
| the 11 listed in section 6 | various | no | **no** |

Other switches in `src/data/balance.json`: `triples.enabled` (on; chance 0.15 from region 2), `itemCaps` (`healsPerBattle` 10, `revivesPerBattle` 6), `pokemonMoments` (on unless set to `false`), `galarMoments` (default on). Capture Styles stay off until `captureStyles.enabled` is set there (`src/core/captureStyles.ts`).

### 7.2 Fairer, tougher runs
- **Wild rarity and repeats:** `src/core/wildDampers.ts` (x0.6 per meeting, x0.8 per relative, no repeats in the first 6 wild fights, one "odd one out" in each of the first 3 stages). 32 common Steel/Ghost/Psychic species became uncommon; 26 common Ice/Fairy/Dragon became rare.
- **Trainer pools:** `src/core/trainerPools.ts` (a type slot needs 8+ species; starters and rival signatures only on rivals and named trainers; a line on at most 2 ordinary trainers per region).
- **Item budget:** 10 heals + 6 revives per battle for the player and for bosses, rivals, Elite Four and Champions (their AI uses them; foes revive only when down to their last two). Numbers in `balance.json` `itemCaps`.
- **Gimmicks:** one of each per side per battle (`src/core/battle/transform.ts`).
- **Level ceiling:** no enemy above the average of your top three + 2. **Rally** (`src/core/battle/rally.ts`): foes brace when one Pokémon keeps sweeping (+1 Def/Sp. Def after 2 KOs, +2 after 4). It replaced the 0.5 sweep guard.
- **Stage pacing:** 4 to 5 trainer fights a stage, one ace trainer, a doubles trainer from region 2, EXP 20% lower. **League counter-pick:** `src/core/campaign/leagueDoor.ts` and `counterPick.ts`. **Evolution Encounters:** `src/core/evoEncounter.ts` and `src/data/events/evolution-encounters.json` (stone beside a wild Pokémon 15%).
- Limits: the balance sim still shows the top wild species at 6.4 times the median (target 1.5). No measurement of how tanky bosses are with 10 heals beyond a small sample (gym fights about 10% longer). The full balance pass (X1) is not done.

### 7.3 Triple Battles
- Engine: `src/core/battle/triples.ts` (beside `doubles.ts`). Reach rules, Shift, spread moves, refills left to right. Foe AI Shift and reach checks. Menus: `src/core/battle/fieldMenu.ts`.
- Screen: `BattleScene` field `duo = { size, focus, slots[side][spot] }` (the old `duo.other` is gone); positions `TRIO_POS` / `TRIO_BOX`. Triples always use Kice's pick, the Essentials Kit long boxes. Other skins have no triple layout.
- Where: some trainers from region 3, the Triples Only run rule, a Battle Factory format, event fights (events have a `format` field: single, double or triple).
- Tests: `tests/unit/triples.test.ts`, `triplesEvents.test.ts`, `triplesRuns.test.ts`, `tests/e2e/triples.spec.ts` (640x900, 960x540, 1280x720).
- Limits: with fewer than three healthy Pokémon it becomes a double or single. No wild triples. No boss always uses triples. Pokémon moments do not run in doubles or triples.

### 7.4 Rivals, the Friend, the Rescue Plan
- **Rival core** (`src/core/rivals/overhaul.ts`, data `src/data/rivalOverhaul.json`, state `run.expansion.rival`): identity locked at first meeting, Lead -3 to +3, up to 5 Marks from a fixed list (an unknown mark name throws, which was bug 1), six feelings 0 to 10, first-stage pity after 5 losses.
- **Tier-5 AI** (`src/core/rivals/tier5.ts`, `brainSetup.ts`): names a win condition, remembers what it has seen, punishes switches, solves small endgames, uses no random numbers.
- **Dialogue bank:** 528 lines for 8 personalities (`src/core/rivals/bank.ts`, `src/data/rivalBank.json`).
- **Presence** (`presence.ts`, `src/data/rivalPresence.json`): 2 guaranteed meetings per region plus a 50% third; Race, Team-Up, Already There, Ambush at Pseudo Stages. **Rival Report** (`report.ts`, key R on the map). **Witness the Rest** cards at run end (`witness.ts`).
- **The Friend** (`friend.ts`, `src/data/friendLines.json`, `friendTeams.json`, event `friend-spar.json`): one per run, four scenes, a 3-Pokémon team, finale Assist (cap 4, or 6 in the Extended Cut).
- **Rival questlines:** 42 scenes in `src/data/events/rivalQuestlines*.json` plus 37 echo scenes in `rivalEchoes.json`. Events change rival state with `rivalChange` / `rivalState` effects.
- **Rival Rescue Plan** (`src/core/evil/rescue.ts`, `rescueFights.ts`, `rescueGlue.ts`, `rescueView.ts`, `rescueSchema.ts`, data `src/data/rivalRescue.json`, screen `src/scenes/RescueScene.ts`, state `run.expansion.rescue`). An Evil Team operation let through impounds 1 to 3 bench Pokémon. About 10 nodes later the rival offers five plans. Quiet Extraction always has at least one guard fight; Loud Grab has three; the others none. Guard fights are pseudo trainer battles with event id `rescue:<spot>`. Choice order on screen is shuffled by seed. Tests: `tests/unit/rivalRescue.test.ts`, `rescueFights.test.ts`, `tests/e2e/rescueScreen.spec.ts`, `rescueAfterRaid.spec.ts`.
- Limits: Race, Team-Up and Ambush rewards are partly text. The third meeting is counted but not placed. Questlines R1, R3, R5 to R24 are not built. The annex is a strip on the Rescue screen, not a drawn map. No party-screen cage icon. Intel and Operational Strength are not built.

### 7.5 Kanto Evil Team saga
- **Data pipeline:** sources in `tools/sources/expansion/` (10 scripts, about 94k words, plus `evil_teams.json`, `shadow.json`), built by `npm run data:expansion` into `src/data/expansion/*.json` (`characters`, `specialPokemon`, `specialShadows`, `apex`, `variantLines`, `signatureMoves`, `tracks`, `raids`, `events`, `siege_maps`, `climax_extended`). Loader: `src/core/expansion/data.ts`. Content gate check: `expansion-data-gaps` in `report:check`. Data exists for all 9 regions; **only Kanto is wired into play.**
- **Cast and Dossier:** `src/core/expansion/cast/` (meet, entry, dossier), screen `src/ui/dossier.ts` (key D on the map), state `run.expansion.dossier`. Only Rocket's Kanto cast is wired.
- **Variant lines** (14, all wired): `src/core/expansion/variantLines.ts`, `variantAssign.ts`. Specialists, Executives and Leaders field their team's line; the ace always has it. Visual ring: `src/ui/battleFx/markAura.ts`. Sim tool: `tools/variant-sim.ts`.
- **Kanto signature traits:** `src/core/expansion/traits.ts`.
- **The Track "The Ledger Fills"** (steps 0 to 5): `src/core/expansion/track.ts`, `trackRun.ts`, `trackView.ts`; page `src/ui/trackPage.ts` (key T). Never raises enemy levels.
- **Story events and scheduler:** 8 Kanto story events plus the Count Room (`src/data/events/xe-kanto.json`, built by `npm run data:xe-events`), placed on quiet nodes by `src/core/expansion/scheduler.ts`. 104 run events (`src/data/events/xr-run-events.json`, built by `npm run data:run-events` from `tools/events/expansion/run*.ts`).
- **Story raids:** `src/core/raid/storyRaids.ts`, `raidCosts.ts`, data `src/data/storyRaids.json`. Rules exist for Raids 1 to 5. **Only Raid 2 can be reached in play** (through the Celadon Hideout). The Magmuk and Kaiju Tentacruel raids are canon-space fights, and the Colossus is the climax raid.
- **Extended Cut:** `src/core/arc/climaxExtended.ts`. Order: Siege Map, Blackout, Gauntlet, Duels, Breather, Set piece, Giovanni (Front), Colossus, Convoy, Resolution. Starts at evil story beat 6. Second Shot covers every climax loss. Started only by `__pkr.extendedCut()` today.
- **Wide formats:** `src/core/formats/` (`registry`, `glue`, `store`, `battle`, `siege`, `blackout`, `breather`, `convoy`, `colossus`, `front`, `debate`), screens `src/scenes/FormatScene.ts` and `SiegeScene.ts`. State at `run.expansion.cut.format`. Debate is built but skipped in Kanto (it belongs to Paldea).
- **Foresight Tax** (Oracle Sabrina): `src/core/battle/foresight.ts`, single battles only.
- **Shadow Pokémon II:** `src/core/shadow2/` (tiers, disobey, keys, grant), data `src/data/shadow2.json`, events `shadow2.json` and `shadow2Kanto.json`. Tiers by Heart Gauge, an announced obey check, purification keys with three hints, heart scars.
- **Stand With Them:** `src/core/arc/standWithExtended.ts`, `standWithSchema.ts`, data `src/data/standWith.json`, events `standWith.json`. Join the team, reputation ladder, "Hold the Line" climax, four verdicts.
- **Grand Arc start:** `src/core/grandArc/`, data `src/data/grandArc.json`. Cipher, Rocket Remnants and Team Snag'em roam; Ein gives Data ROM K; the Stock track 0 to 5. The finale is not built.
- **Field Notes** (key F): `src/core/expansion/fieldNotes.ts`, page `src/ui/fieldNotesPage.ts`. Tabs: Special Pokémon, Shadow Pokémon, Data ROMs, Keys.
- Limits (the important ones): Intel and Operational Strength are not built. No run can reach Raids 1, 3, 4 or 5. M2's signature moves are not real moves. LEDGER does not join the party. Debate evidence is given out by nothing. Stand With Them is missing its middle phases and loyalty raids. Shadow II is missing the Surge meter, 14 Shadow moves, 20 abilities and 17 scars. Marrowmother and M2 cannot be obtained. Only ROM K can be earned. Game Corner Black-Label prizes and Saffron's gates (track steps 2 and 5) are not built.

### 7.6 Kanto Canon Spaces (11 towns)
- Catalog: `src/data/expansion/canonSpacesKanto.json` and `canonRoutesKanto.json`, built by `npm run data:canon-spaces` from `tools/sources/expansion/CANON_SPACES_KANTO.md`. 71 spaces, 19 of them Pseudo Stages.
- Rules: `src/core/expansion/canonSpaces.ts` (the Town Roll), `canonRun.ts` (`addCanonStops` at stage start, `noteCanonEvent` after an event), `canonEnds.ts`, `canonSaffron.ts`, `stageMods.ts`. State at `run.expansion.canon`. Needs `kantoSevii` on.
- Events are ordinary game events with a `canon: "cs.kanto.<town>.<slug>"` tag: `src/data/eventsCanonKanto.json`, `eventsCanonVermilion.json`, `eventsCanonSaffron.json`, `eventsCanonFuchsia.json`, `src/data/events/canon-kanto-start.json`, `canonCinnabar.json`. Builders: `tools/build-canon-*.ts` and `.py`. Pseudo Stages are chains of room events, not `pseudoStages.json` records.
- Towns built: Viridian, Pewter, Veridian Forest, Mt. Moon, Cerulean, Vermilion, Lavender, Celadon, Saffron, Fuchsia, Cinnabar, Indigo Plateau, plus road events.
- Limits: the pack lists 188 spaces; 71 are built. Sevii and the 12 game route moments are not included. Several town details are simplified (each town's fragment lists them; see the appendix).

### 7.7 Pokémon moments
- 136 moments, all marked supported (`src/data/pokemonMoments.json`). Rules: `src/core/battle/pokemonMoments.ts`, `src/core/moments/`. Presentation: `src/ui/battleFx/momentScene.ts`. Rolls use their own seeded stream. At most one cinematic per battle.
- "Failure Will (NOT) Be Tolerated": when the run would really end, 50%, once per run, for construct Pokémon. Audio is Kice's own clips.
- **Singles only** (confirmed in code on 2026-11-14: `doubles.ts` and `triples.ts` never call the moment hooks).
- Left for 0.7: PT10, PT16, Shedinja, Mimikyu, Zoroark, Aegislash, Ninjask, Wishiwashi, Komala, PG4, PG11, PG13, PG14, PG16, the 15-entry revival family, anything cross-run.

### 7.8 Minigames and microphone
- The 14 original minigames and 4 Battle Frontier games have a fourth Master tier. All 34 older minigames stay. The new 0.6 minigames were removed at Kice's call; Fuchsia's Safari Land is a plain paid wild fight.
- Mic input: `src/game/micInput.ts`, Settings > Controls > Microphone, off by default, loudness only, never recorded. **No screen uses it yet.**

### 7.9 Events remember, hazards, camp
- Choice memory: `src/core/eventMemory.ts`, flags in `src/data/overhaul/memoryFlags.json` (33 flags). Per run only.
- Biome hazards and map stops: `src/data/events/hazards.json` (built by `npm run data:hazards`). Camp scenes: `src/data/events/camp-rests.json` (5, once per run each).

### 7.10 Dev hooks and how to try things
- `window.__pkr` in the browser console: `session` (the live run at `session.run`), `game`, `activeScene()`, `extendedCut()`.
- Force any event from a test or the console the way the browser specs do: push a side stop with the event id onto the current node and start the `Event` scene (see `tests/e2e/rescueAfterRaid.spec.ts`).
- In unit tests: `debugForceEvent` (`src/core/run.ts`), `eventView` and `chooseEvent` (`src/core/events.ts`), and the bot in `tests/unit/autoplay.ts` (`autoplay`, `step`).

### 7.11 Where 0.6 is thin (analysis)
1. **One region deep.** Every saga system is built as a general system but only Kanto has content. Runs in the other eight regions get the balance, rival and triple changes and nothing from the saga.
2. **The climax path most players see is the Standard Cut.** The Extended Cut, seven wide formats and the Friend's 6-strike Assist are behind a dev hook. A Settings row is a small job with a large effect on how much of 0.6 players actually see.
3. **Raids are mostly rules without doors.** Results, levers and costs exist for Raids 1 to 5, but only Raid 2 has a way in.
4. **Several systems write numbers that nothing reads yet:** Intel, Operational Strength, Heat (outside a few events), Reputation in hazards, the Stock track above step 1.
5. **Balance is unmeasured past region 2.** The bot seldom gets further, so the level ceiling, 10-heal bosses, Elite Four counter-picks and Champions have only small-sample checks.
6. **Art.** Many cast members, the Couture accessories and 7 custom Pokémon have no art; they show silhouettes or stand-ins.

### 7.12 The patch notes' "Needs checking" list, checked
The player patch notes end with 16 items where the update notes disagreed. Checked against the code on 2026-11-14:
- **Moment count:** 136 in `src/data/pokemonMoments.json`, all marked supported. Settled.
- **Raids:** only Raid 2 is resolved by any event in play (the Celadon Hideout). Raids 1, 3, 4 and 5 have rules but no way in. Settled.
- **Moments in doubles:** singles only. Settled.
- **Colossus plate:** the folding plate is on the Format card screen (`FormatScene`); the fight itself uses the normal raid display. Settled.
- **Settings:** three Gameplay switches plus the mic row are on the Settings screen; nothing else from 0.6. Settled.
- **Stale notes** (things called "not built" that later notes built): the latest note wins each time. The appendix keeps every note's own Limits text, so read it with that in mind.
- **Not re-checked** (wording only, low risk): the exact count of removed minigames (the note lists 11 names plus the cabinet choice and the picture-board screen), whether Celadon and the Lavender interlude share stage 4, how the 80 data event slots overlap the 104 run events, and how the 9 or 10 Kanto signature traits are counted.

---

## 8. Beta 0.7: everything planned, deferred or waiting

Nothing here is started. Scope is Kice's call (8.8).

### 8.1 The two headline candidates
- **Node Event Menus** (Kice's idea, 2026-11-13). Plan: `/mnt/project-files/plans/node-event-menus.md`; mock-ups: `/mnt/project-files/promo/node-event-menus/`. Recommended as the 0.7 headline.
- **The rest of INSTRUMENTALITY:** milestone 3.0 "You Can (Not) Redo" and milestone 3.0+1.0 "Thrice Upon a Time". Plan: `docs/plans/instrumentality/INSTRUMENTALITY_IMPLEMENTATION_PLAN.md` §4 and §5. The plan itself suggested 3.0 as 0.6.x patches and 3.0+1.0 as 0.7.
- They can share an update, but both change run pacing, so they should not share a balance pass. Suggested: Node Menus plus the small 0.6 follow-ups first, then the regions.

### 8.2 Node Event Menus (plan summary)
- Every map node becomes a small menu of 2 to 5 entries (5 is rare, about 5%). Some entries are required, some optional. Each menu mixes at least two kinds.
- Plan's recommendations: 1 optional pick per node (2 on gym-eve, plaza and 5-entry nodes); at most 2 required entries and never 2 required battles; short repeatable "micro entries" so menus never run dry (a full run is about 1,440 nodes against about 1,650 once-per-run events); "Rival Takes It" for what you skip; off in speedrun and boss rush; its own seeded stream `::node-menu::` so old seeds are identical while it is off; optional fields on side stops, no save bump.
- Build phases: P0 mock-up pick; P1 category tags on every event (pure data; **this did not ship in 0.6**, so it is the first 0.7 slice); P2 menu screen over today's stops; P3 composer (the large one); P4 micro entries and pacing with sim numbers; P5 new behaviours (fork, linked, Rival Takes It, escort and others); P6 hook up 0.6 content; P7 polish and switch on.
- Risks the plan names: run length, content running out, rare things becoming common, economy inflation, decision fatigue, changes to very large shared files, old seeds changing, off-list creep (picks must not become a currency).
- Seven decisions wait on Kice (8.8).

### 8.3 INSTRUMENTALITY milestone 3.0 (each behind its own setting)
- **L1 Legendary Blessings framework:** tier roll 45/30/17/6.5/1.5, one per run, Influence thresholds, Communion and one Rite. **L2 content:** 71 blessings (Lesser 25, Greater 23, Divine 16, Primordial 4, Origin 3). The Legendary Blessing screen is Kice's "Side Plinth" pick and waits for this.
- **L3 Rewinds** (Dialga, Celebi, Time Keeper): needs run and battle snapshots that restore the exact state and RNG streams without re-rolling. The hardest technical slice and the most likely source of determinism bugs. Use `tools/bughunt/fuzz-roundtrip.ts` as its test bed.
- **M1 Mythical Promises** (23): Tellings, Visit odds, a checkable Promise with a warning, the Guest as a 7th companion outside the party. Keepsakes are cut.
- **U1 Ultra Beast Incursions** (11): hidden Appetite tallies, Static to Incursion, Beast Balls, Ultra Rules as engine hooks with a 5,000-battle sim each. Shards are cut, so Beast Balls need a new source.
- **S1 Second Chance** (5%, once per run): revive at 25% HP, +1 all stats, tag battle with the rival. Rescue order: rewind, Latios jewel, Flight North, Second Chance.
- **H1 Heated-moment moves** (6%, at most 1 per region and 3 per run, big battles only; shares the 1-cinematic budget).
- The dormant settings `blessingsEnabled`, `mythicalsEnabled`, `ultraBeastsEnabled`, `secondChancePct` already exist for these.

### 8.4 INSTRUMENTALITY milestone 3.0+1.0
- **E9 The other 8 regions,** one thread each, in the pack's order: Johto, Unova, Kalos, Galar, Sinnoh, Hoenn, Alola, Paldea. Each repeats the Kanto set: track, variant line, cast, events, Raids 4 and 5, Extended Cut, liaison and ROM. The data is already imported. Per-region catches: Kalos Couture needs a second held-item slot; Alola needs a forced-switch boss and "bring below half" win conditions; Cassiopeia, Ghetsis + Kyurem and Rose + Eternatus field a 7th Pokémon (engine and screen must handle 7 foes); Galar scripts unlock the Overcharged line; Paldea unlocks Debate.
- **E10 Companions:** the Remnants trio, Wes, Rui, Krane, Chobin, Looker; Friend postcards. In-run only.
- **E11 Grand Arc finale:** Citadark vs XD001; the other 8 Cipher liaisons and ROMs.
- **D1 Region of Doom** ("The Margin"): 14 districts, 8 Evil Gyms. The plan unlocks it through a cross-run Doom Ledger; with cross-run progress cut it becomes an in-run epilogue. No cross-run rival parts.
- **W1 to W3 Whole Run Events:** framework (35% of runs), Guidance of Giratina (10 beats, 6 endings, warning only), then 4 more that are only outlined.
- **G1 Greenneedle events:** 62 reworked + 38 new, in batches of about 10.
- **X1 Final balance and accessibility:** 1,000 sim runs per region. The bot must first be able to pass region 2. Start this early; it gates everything late-game.
- Plan's cut list if time runs out, in order: Debate as a plain duel, Front as a plain triple, Region of Doom annexes, the 4 outlined WREs, Kalos Couture, events density capped at 3, catchable special Pokémon, the Origin and Primordial blessing tiers. Never cut: the Breather, save points, Second Shot, announcements, the Standard Cut, the off switches, "a story loss never ends the run".

### 8.5 Deferred from 0.6 (small to medium jobs)
- **Settings rows** for the Extended Cut, event density and the Kanto switch; decide what to do with the 11 unread settings (wire or remove).
- **Raid doors:** a way into Raids 1, 3, 4 and 5; the full raid format with floors and objectives; Raid 3's failure list; the C6 Hostage cost.
- **Kanto saga gaps:** Intel and Operational Strength; Game Corner Black-Label prizes; Saffron's gates; M2's real signature moves; LEDGER joining the party; obtainable Marrowmother and M2; the rest of Stand With Them; the rest of Shadow II; Stock track effects.
- **Kanto canon gaps:** the remaining pack spaces (188 listed, 71 built), Sevii, Silph Takeover, the Jessie/James cameos, Hidden Village trials as real games.
- **Rivals:** questlines R1, R3, R5 to R24; the placed third meeting; won/lost reaction lines; real Race/Team-Up/Ambush rewards; the party-screen cage icon.
- **Triples:** wild triples, a boss that always uses triples, triple layouts for the other skins, moments in doubles and triples.
- **Mic input:** a first screen that uses it (the Sleeping Snorlax shout).
- **Pokémon moments:** the 14 named ones and the revival family in 7.7.
- **Catalog Overhaul Packs:** Pack 1 rewrites all 2,821 events; Pack 2 has about 25 small events waiting. Intake reports: `/mnt/project-files/reports/catalog-overhaul-intake-2026-11-13.md` and `catalog-overhaul-pack2-intake-2026-11-13.md`. Kice's cuts in section 5 apply.
- **Art Kice must supply:** Megawattrel, Equinar, Hollow Shepherd, Brinecrown, Veinheart, Lumeria, Verdelis (`public/assets/images/pokemon/custom/<id>.png` + `.json`); 8 Couture accessory PNGs; custom trainer art for the cast; icons for Silver Powder, Cool Shades and Tauros Charm. 94 sprites are in the files but unused.

### 8.6 Older backlog still open
- Beta 0.5 leftovers: gym entrance cinematics, the REUNION scene, some camera-cut art.
- Content gaps: unreachable forms (Tatsugiri Droopy/Stretchy Mega, Magearna Original Mega, 5 Delta battle forms), 17 signature Z-Moves disabled, Pledge combos and Order Up limited, Elder Gale single-target.
- Phone sizes below 932x430 and touch keyboard sweeps are unchecked.
- Settings that do nothing from before 0.6 (Story Intensity, subtitles, journal voice, colour-blind markers, UI scale).
- `docs/plans/left-out-plan.md` lists everything asked for but not built, in priority order.

### 8.7 Suggested order for 0.7
1. Merge PR #1261. Ask Kice to turn on branch protection with `CI ok` required.
2. Get Kice's answers to 8.8.
3. Create the `beta-0.7` branch and `docs/updates/beta-0.7/README.md`; start an integration lead thread.
4. Start the long poles early: the bot that can pass region 2 (X1 groundwork) and, if rewinds are in scope, L3 snapshots.
5. Small visible wins first: Settings rows for the Extended Cut and density, raid doors, the first mic screen.
6. Then the headline (Node Menus P1 to P7, or the regions one thread each), with the bug-hunt tools run before the final merge.

### 8.8 Decisions waiting on Kice
1. What is Beta 0.7: Node Event Menus, the rest of INSTRUMENTALITY, or both, and in what order?
2. Node Menus, the plan's seven questions: release timing; 1 optional pick per node or free picks; allow micro entries; allow "Rival Takes It"; allow a second required entry; off in speedrun and time attack; which menu look.
3. Cross-run progress (profile 21): the plan kept Reliquary, Storybook, Doom Ledger and Faller rank, but Kice cut cross-run memory from the catalog packs. Which rule wins for Blessings, Ultra Beasts and the Region of Doom?
4. Should the Extended Cut get a Settings switch now, or stay hidden until the final balance pass?
5. The art list in 8.5.
6. Branch protection on `main`.

---

## 9. File and asset locations

- Repo plans: `docs/plans/instrumentality/` (definition, implementation plan, screen picks, `evil-pack/`, `notes-pack/`), `docs/plans/INDEX.md` (line ranges for long docs).
- Project files `/mnt/project-files/`: `plans/` (`beta-0.6-instrumentality/` with WORKSTREAMS.md, `node-event-menus.md`), `reports/` (this handoff, patch notes, content list, catalog intake reports, `ui-inventory.md`, events catalog), `promo/` (`beta-0.6-screens/PICKS.md`, `node-event-menus/`, event mock-ups), `catalog_overhaul_pack/` and `catalog_overhaul_pack_2/`, `videos/beta-0.6/`, `audio/pokemon-cries/`, `pokedex/pokedex.json`, `shots/`, `uploads/hearth/`.
- Kice's PC: `C:\Users\test\Downloads\ABDM\Compressed` holds the asset packs.

## 10. Suggested project instructions for a new project

```
You work on Pocket Raiders (repo AwsomSause/pkmn), a deterministic browser Pokémon roguelike. Director: Kice (beginner programmer, Pacific time). Keep replies short, plain, result first; notify Kice whenever they are needed or a PR opens.
Start every thread: read CLAUDE.md, STATUS.md and docs/HANDOFF.md; grep before reading; never read big generated data or design docs whole.
Each thread opens and owns its own PRs, one per workstream, ready for review (CI skips drafts). Updates ship as one big PR from a shared branch (beta-N) with docs/updates/beta-N/<pr>-<name>.md fragments (Player gets / Save / Limits). Into the update branch: merge on typecheck plus related tests. Into main: merge only when that PR's own CI is green.
Every save bump needs a migration test. Never commit public/assets/manifest.json. Slice notes in docs/status/<slice>.md.
Before a big merge into main run: node tools/playtest.ts 0 50 --heal --sides --strict --expansion, tools/bughunt/fuzz-events.ts and tools/bughunt/fuzz-roundtrip.ts.
Do not build anything on Kice's off list (HANDOFF section 5) without asking. No cross-run memory.
```

## 11. First-session checklist

`git fetch origin main`; read `CLAUDE.md`, `STATUS.md`, this file; check main's latest CI run; confirm save versions in `saveManager.ts`; branch from fresh `origin/main` (or the update branch); build vertically (data, rules, screen, saves + migration test, unit + browser test); add the status note and update-log fragment; open your own PR; rebase; merge on the rule in section 5.

## Appendix: every 0.6 slice's own limits

Each of the 87 fragments in `docs/updates/beta-0.6/` ends with a Limits section. The full handoff report outside the repo (`/mnt/project-files/reports/handoff-beta-0.6-0.7-2026-11-14.md`) has them all on one page. In the repo: `grep -A3 -i "limits" docs/updates/beta-0.6/<fragment>.md`.
