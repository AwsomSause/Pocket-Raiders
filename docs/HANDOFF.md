# Pocket Raiders: full project handoff (2026-11-05)

Paste this into a new project. A fresh Claude should be able to continue from here without asking questions. Repo: `AwsomSause/pkmn` (private). Live site: https://awsomsause.github.io/pkmn/ (GitHub Pages, redeploys on every push to `main`). Director: **Kice** (GitHub `AwsomSause`), a beginner programmer. Write plain language, keep replies short.

## 1. What the game is
A complete, deterministic, browser-based **Pokémon roguelike** ("Pocket Raiders") meant to be fun to replay. Runs go through regions (stages, gyms, Elite Four, champion, final boss), with a walkable Hub Town between runs. Working and integrated beats feature count. Same state + seed + actions = same result.

Visual style (all visuals): flowy, bouncy, animated. Aesthetics: Frutiger Aero, DS era, Wii era, Cyber-Maximalism. References: Enhanced Battle UI, Essentials 21.2, Deluxe Battle Kit, Visual Bible; PokeRogue is OK as a reference. Style guide merged in #344. Assets come from the director's packs (PokeRogue, AGPL-3.0, Nintendo material); keep provenance for every asset and dataset. Importing art from Essentials packs is allowed and encouraged.

## 2. Architecture
Stack: TypeScript (strict), Phaser 3.90, Vite, Vitest, Playwright 1.63.0, Zod. Node 22.

Hard rules:
- `src/core` is pure game rules and **never imports Phaser**. Outcomes never depend on animation or UI.
- Zod validates all data and saves. Balance numbers live in `src/data/balance.json` or validated data.
- Named seeded RNG streams (`src/core/rng.ts`). A new stream must never change existing rolls. Previews, hovers, asset loading and animations never use gameplay RNG. No reward or event applies twice (ledger/claim pattern).
- Presentation failure never corrupts battle state; respect motion/intensity/skip/audio settings.
- No placeholder behaviour for a requested mechanic. Every content item has a status: supported, limited (documented), disabled or invalid (`src/quality/`, `QUALITY_GATES.md`).

Key directories:
- `src/core/`: rules. `run.ts` (run state machine, big), `state.ts`, `contentSchema.ts` (big), `rng.ts`, `battle/` (engine, abilities, damage, held items, transform = Mega/Tera/Z/Dynamax, hyper, doubles), `presentation/` (cue layer, move/story anims), `story/` (domain events, effects ledger, nemesis), `raid/`, `totem/`, `expedition/`, `minigame/`, `camp/`, `hubTown/`, `rivals/`, `mentors/`, `bond/`, `care/`, `memories/`, `plaza/`, `legacy*.ts`, `events.ts`, `gameEvents.ts`, `quests.ts`, `mastery.ts`, `shopTypes.ts`, `crafting.ts`, and one file per other system.
- `src/data/`: content JSON plus `index.ts` loader. Some files are generated (never hand-edit, never read whole): `species.json`, `learnables.json` (1 MB single line), `moves.json`, `bossTeams.json`, `moveAnims.json`, etc. Rebuild with `npm run data:*`. Events are built from `tools/events/*.ts` via `npm run data:events`; `src/data/events/<name>.json` is also allowed (#616), but whether auto-discovery is wired in `src/data/index.ts` is disputed. Verify before relying on it.
- `src/game/`: `GameSession.ts` connects rules to saving. `src/save/`: `saveManager.ts` (versions and migrations), `storage.ts`.
- `src/scenes/`: Phaser screens (Boot, MainMenu, Hub, Town, RunPrep, TrainerSelect, StarterSelect, Map, Battle, Reward, Shop, Event, Decision, GameOver, Raid/Expedition/Minigame, Memories, Settings, Plaza, Trade, Tutorial, Credits, HallOfFame, LegacyGallery...). `routing.ts` picks the screen for a run.
- `src/ui/`: shared widgets, theme, audio, `battleFx/`, `battleStyles/`, `shopStyles/`, `tradeStyles/`, `hubTown/`. `src/assets/catalog.ts` is the one place asset names are defined.
- `tools/`: Node scripts behind `data:*`, `assets:*`, `report:*`; `tools/content-baseline.json` is the CI content gate baseline; `tools/playtest.ts` is the bot playtest.
- `tests/unit/` (~295 Vitest files) and `tests/e2e/` (~103 Playwright specs).
- Big files: never read whole. Grep for the symbol, then read a 40-80 line window: `run.ts`, `engine.ts`, `contentSchema.ts`, `BattleScene.ts`, `HubScene.ts`, `itemCatalog.json`.

Doc router in the repo: `CLAUDE.md` (start here), `STATUS.md` (one page), `MAP.md` (what every file is), `.claude/rules/*.md` (path-scoped rules: core, data, saves, screens, tests, working-style), `CHECKLIST.md`, `GAME_DESIGN.md` (director decisions D1-D16), `IMPLEMENTATION_PLAN.md`, `QUALITY_GATES.md`, `docs/plans/INDEX.md` (line ranges for long docs), `docs/ideas/` (roadmap + approved-idea review), `docs/status/<slice>.md` (one note per finished slice, about 250 of them).

## 3. Build, test, deploy
- Run: `npm install`, `npm run dev` (http://localhost:5173). URL flags: `?seed=x` (replay a run), `?campaign=dev` (short 2-region campaign), `?debug=1`; F2 opens the debug panel.
- `npm run check` = typecheck + unit tests + build + content gate (about 80 s on a fast box; one note says 10+ min locally on slow ones). `npm test` rebuilds the asset manifest. `npm run test:e2e` = full Playwright (about 15 min; don't run it before every PR). Run single files while iterating: `npx vitest run tests/unit/x.test.ts`, `npx playwright test tests/e2e/x.spec.ts`.
- CI (`.github/workflows/ci.yml`, runs on PRs and pushes to main): `npm ci`, typecheck, `npm test`, build, `report:check` (content gate vs baseline), `report:assets`, `report:perf`, bot playtest (`node tools/playtest.ts 0 50 --heal --sides --strict`), Playwright install, full `test:e2e`.
- Deploy (`.github/workflows/deploy.yml`): on every push to main, `assets:manifest`, `vite build`, GitHub Pages.
- Playwright gotcha: the first key press after a scene change can be dropped, so wait 250 ms. Two Run-Prep specs in `milestone5_5.spec.ts` are known flaky.
- Gameplay fingerprints: `tests/unit/story.test.ts` `BEFORE_STORY` hashes. Re-pin only if the slice changed gameplay on purpose (see `.claude/rules/tests-rules.md`); fetch origin/main first because two threads re-pinning the same line is the usual cause of a red main. Never re-pin to hide an unexplained failure.

## 4. Saves, versions and migrations
Records and current versions in `src/save/saveManager.ts` `CURRENT_VERSIONS` on main now: **profile 17, run 34, settings 30, meta 1, timeline 1**. Next free: profile 18, run 35, settings 31. (STATUS.md may lag; the code is the truth. Check `origin/main` first because another thread may have taken the number.)
Rules:
- Any change to a saved shape bumps the version and adds a migration (N to N+1). Never silently drop a save; malformed saves must recover safely. Zod validates on load.
- **Every save bump needs a migration test** (the content gate checks).
- Test save then reload at every meaningful checkpoint. Nothing (reward, story effect, evolution) may apply twice after reload or replayed animation.

## 5. Kice's standing rules
- Be terse. No recaps or filler. Plain language for a beginner.
- Token efficiency: read `STATUS.md` first (not CHECKLIST), grep before reading, read tight windows, batch independent tool calls, small diffs, reuse existing code/assets and free libraries. Use the "(text).md" copies of the big design docs in project files, never the 11-100 MB originals.
- **Every thread opens and owns its own pull requests** (never push onto another thread's PR) and pushes them automatically. Rebase onto fresh `origin/main` right before merging (push the rebase fast, CI validates).
- **Merge only when the PR's own GitHub CI run on its current head is green**, not just local `npm run check`. A red spec you didn't touch: check main's last run first, then fix or report, don't merge over it.
- Every save bump needs a migration test.
- **Never commit `public/assets/manifest.json`** (generated and gitignored; `npm run assets:manifest`).
- New slice notes go in `docs/status/<slice>.md` (one bullet, same style as STATUS Done list). Do **not** edit STATUS.md except its Saves line when you bump a version.
- Execute guides and docs to their fullest extent (everything in every md file). Don't stop to check in; stop only for real blockers. Threads may start next phases without asking. Ask Kice directly only to clarify or for a real decision.
- Each slice: rules + validated data, UI, save/load, unit tests (normal, boundary, failure), browser test, docs, clean diff. Report briefly: what was built, what the player can do, tests run (never claim a test passed unless you read the result), what's stubbed, risks, next slice.
- Every multi-style menu/visual defaults to the ORIGINAL pre-rework design; reworks stay as options (Kice 2026-11-02). Screen looks must be practically identical to their mock-ups using real pack art.
- Decisions: ideas in the "Untitled document" win over earlier decisions when they clash; Pokemon_Spreadsheet levels are fine as starting encounter levels; level cap is +50 per region, max 500; Sandbox/Level editor (F217/F218) dropped; real Guard/Brace-named moves/items stay.
- Hub has a Settings switch "Hub Town" (walkable overworld) vs "Arena Lobby" (old tile hub). Hub Town is the default since #644.

## 6. Workflow gotchas
- Several threads work on `main` at once: start from fresh `origin/main`, rebase before pushing.
- Cloud threads load plugins only from claude.ai Project settings > Plugins and MCP servers only from claude.ai connectors; repo `.mcp.json` / `.claude/settings.json` plugins / `.claude/skills/` are ignored there.
- `.ignore` makes folder-wide Grep skip generated data, `public/assets/` and the lockfile; to search those pass the exact path. `.claude/settings.json` blocks reading `learnables.json` and `package-lock.json`.
- Project files in `/mnt/project-files/`: plans/ (left-out-plan, source-files-plan, how-to-execute-guides, major-update-spec, ideas-implementation-plan, ideas-approved-ledger...), ideas/ (library/, remaining/, review), hub-town/, promo/ (228 promo images, 2000s-style ads), playtest/, redesign/ (screen mock-ups + generators), announcements/.

## 7. Open issues (as of 2026-11-05 23:30 UTC)
1. **Main's CI is red on unit tests**: `eventsRB`, `eventsExtra`, `story`, `run`, `modifierCategories`, `rules` fail on main itself. The "Fix CI" thread is working on it. Likely causes: gameplay fingerprint (`story`) re-pinned by two threads, and event files disputed between `tools/events` and `src/data/events/*.json`.
2. **Many PRs were merged before CI finished** (the cause of the red main). Do not repeat: wait for green.
3. **GitHub pushes were being rejected** in several threads (git push failures with `commit_refs`). Finished work is committed in threads but has no PR yet: S160 crit scaling, Camp follow-up, trainer events batch 2 (also restores batch 1's events), Harbor Boat Trips (S366), S118 rival siblings, Run Setup and Trainer pages, 13 world events, achievements showcase / photo contest / trade board, expedition looks. Re-check these threads and get PRs opened once pushes work.
4. **Open PRs:** #654 Dex Completion Rewards, #655 text-fit sweep, #659 Raid Medals, #660 Trainer expressions; each should merge once CI is green.
5. Run Prep: a phone tap test, the Overview cards, and verifying the Type Focus e2e test are still unchecked.
6. Mobile: many screens unchecked, phone sizes below 932x430 unchecked, no touch keyboard, nothing tested on a real device.
7. Cut-off text: event styles, battle menus and about a dozen screens not yet swept for text fit.
8. General ideas G1-G1103 came back **blank** from Kice's review: on hold, ask Kice before building any.

## 8. What is built (by area)
Details for each are in `docs/status/<name>.md`; the long list below is names only.
- **Core run and battle:** full turn engine (abilities, held items, Mega/Tera/Z/Dynamax, Hyper/Overdrive moments, doubles/triples-limits, terrain and terrain Max Moves), AI improvements (AAI batches, prediction, S164/S168/S271), difficulty/heat levels, levels past 100 (+50/region up to 500), multi-region runs, bosses and boss bands, battle frontier, challenge modes (Nuzlocke, pacifist, time attack, spooky, speedrun timer, later modes), mutators/modifiers, rule draft, daily run, seed codes and seed page.
- **Pokémon growth and care:** bond levels, care/party life, team chemistry, mastery ranks, move mastery, eggs and berries, Hisuian fossils, shadow/blissful, tuning dust, candies, catch chains, shiny charm, reticle catching, evolution and custom forms, items (unified bag, item distribution, rewards-who-can-use, catalog leftovers).
- **Story and rivals:** Living Rival (relationship path, 14 events, letters/visits, final boss assist), rival depth/kinds/moments/promotion/gift swap/world recognition/style tricks/ultimate rival/sim report, mentors, nemesis system, false protagonist replays (#387), story hooks (E4 rematch, gym leader moods, weather-prophet rumors), villain/evil team events, narrative defeat, drama flavour, Battle Drama Engine spectacle.
- **Events and world:** run events A through K families (merchants, wild scenes, helpers, games, famous faces, mysteries, weather, training/growth, trainer events batch 1), world events, legendary world events, landmark dungeons, traversal and wanderer, emergent events, game events (weekly/holiday), tide clock, day/night.
- **Raids, Totems, expeditions, minigames:** raids (types, roles, weak spots, pressure, counter-cheer, cheer levels, practice, memories, named rival), Totems with doubles, Mega-Expeditions, 14 minigames, frontier minigames.
- **Hub and meta:** Hub Town (walkable, generated map from `tools/hubtown/`), Pocket Town (data-driven `src/data/town.json`: Hall Records, Weather Station, Fan Club, Guild Board, Relic Vault, Sponsor Deals, Town Economy discount), Camp (gadgets, kitchen, workshop, market), crafting, Trainer Plaza, trade stops, shops redesign (6 kinds), Trainer Archive/Starter Lab, quests and claim ledger, badge powers (S483) and scaling, legacy hub/runs/gallery, Hall of Fame, social profile/share codes, bank and research, save inspector, dex completion rewards (open PR), tutorial + update log.
- **Presentation:** animation registry, ability/story anims, expressions (open PR), idle loops, victory poses, shake, skip/recap, CRT letterbox, map day/night, Wii motion, glass screens, sound packs, pack music and jingles, screens-redesign shared system (`core/presentation/screenStyles.ts`; Kice wants original designs as default) with battle (10 styles), map/reward/party, title/trainer/starter/briefing, bag/evolve/run end/camp, dex/settings/hub menus/legacy/loading.
- **Settings and QoL:** unified settings, animation setting keys, accessibility, mobile overhaul/pass/sweep/tap targets/pad toggle, text-fit sweeps, transitions perf, modes-QoL batches 1-4.

## 9. NOT yet built
Source: `ideas/remaining-2026-11-05.md` (method: approved ids minus ids named in commits/status notes; approximate, so verify an idea isn't built before starting). Approved: 436 systems (about 102 built, about 334 remaining) and 560 run events (about 490 built, about 70 remaining). Approved ideas: `docs/ideas/review-2026-11-02.md`; build order and status: `docs/ideas/roadmap.md` and `docs/ideas/categories/`.

**Run events remaining:** R104-R110 (B), R286, R290-R306, R308-R309, R313, R315-R316, R318-R320, R323-R324, R328-R335, R337-R338, R340-R342, R345-R346 (F games/puzzles), R348-R349, R355, R357, R363-R364, R366-R369, R371, R374-R380, R382-R383 (G training). Trainer events specifically: R56-62, R64, R67, R69, R73-79, R81-85, R88-97, R99, R103 and later.

**Systems remaining, by area:**
- **Modes:** Randomizer, Tag Team, Triple Battle, Streak Bonuses, Pity Counters, Bounty Boards, Milestone Chests. Challenge modes S282-289, 293, 295, 296, 298, 299, 301-303; quests/rewards S304-317, 320-324.
- **Economy:** S67, S74, S79, S81-86, S88 (also 68-73, 75, 78 per the master list). Risk S369-387, S389, S390. Items S413-434 and Oval Charm (some may already exist; S430 built).
- **Growth:** S46, S48, S49, S52, S54-56, S59, S61-65; S57 and S58 partial. Bond paired moves, bond level on party screen, Tuning Dust in shops, fossils for the evolved Hisuian forms.
- **Battle/AI:** S26, S32, S43, S44, S154-159, S161, S162, S167, S169-171, S174, S175, S263-266, S269, S270, S272-275, S277, S278, S280, S281.
- **Run map and world:** S1, S10, S14, S22, S132, S133, S135, S139, S142, S144-147, S149, S150. Dungeons have no traps or puzzles; several world events partly built.
- **Story:** S112, S115, S120, S122, S125, S128, S129; check S114, S117, S119, S121 first.
- **Capture:** S219-224, S229, S231-233, S236-238; check S234, S235 first.
- **Meta/Hub:** Airship (S367), NPC schedules and gossip (S348, S350), market price swings (S347), Rival Sponsors (S360), Dream Tower (S109); unchecked: Spa (S476), Garden visitors (S475), Teleporters (S467), Trading Cards (S357), Hub quests, Mod Workshop. Hub advanced S460-463, S467-478.
- **Hub Town:** real ambient recordings, Berry Orchard, a check on the live site.
- **Social/Tech:** S201-205, S213, S216, S325 (more pack types), S327, S328, S329, S332, S334, S337, S338, S340, S341, S344.
- **Minigames:** S437, S439, S445, S446, S451, S453, S479-482, S484, S486-504, plus Palace nature rules.
- **Raids/bosses:** S393-395, S398, S399, S401-403, S405-412, plus a role badge in battle and a target picker for weak spots.
- **Presentation:** boss intro cutscenes (S244), parallax map layers (S242), moving battle camera (S240), move animation packs (S253), sticker reactions (S256), music reacting to battle (S243); also S251, S254, S258.
- **Screen looks (redesign):** Evolution, Egg hatch, learn-move, Camp, Bag and Memories layouts; minigame Eyecatch; Channels and Medal looks; hub tab rows and wheel; Settings Rotom sprite and sticker cards; expedition hero sprites; Totem Sunset and Classic looks.

## 10. First steps for a new session
1. `git fetch origin main`, read `CLAUDE.md`, `STATUS.md`, `docs/ideas/roadmap.md`.
2. Check main's latest CI run. If red, coordinate with the Fix CI work before building anything that touches the failing tests.
3. Pick one slice from section 9, branch from fresh `origin/main`, build it vertically (data, rules, UI, saves + migration test, unit + e2e), add `docs/status/<slice>.md`, open your own PR, rebase, merge only on green CI.
