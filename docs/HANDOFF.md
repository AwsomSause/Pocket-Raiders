# Pocket Raiders: full handoff for the next update project (2026-11-12)

Paste this into a new Claude project (or give it as the first file). A fresh Claude should be able to continue without asking questions. It replaces the 2026-11-05 handoff (`docs/HANDOFF.md`, same content updated). Repo: `AwsomSause/pkmn` (private). Live site: https://awsomsause.github.io/pkmn/ (GitHub Pages, redeploys on every push to `main`). Director: **Kice** (GitHub `AwsomSause`), a beginner programmer in the **Pacific time zone**. Write plain language, keep replies short, use Pacific times.

State of the world on 2026-11-12: Beta 0.5 "The World (Doesn't) Revolve Around You" is **merged to main** (PR #1114, 2026-11-08). The next update is expected to be **Beta 0.6 "You are (Not) alone"** (Kice named it 2026-11-08). **Its scope is not written down anywhere in the repo or plans.** First job of the new project: ask Kice what is in it (section 9 lists candidates). **Main CI is currently red** (section 8, item 1): fix that before anything else.

---

## 1. What the game is
A complete, deterministic, browser-based **Pokémon roguelike** ("Pocket Raiders"), meant to be fun to replay. A run goes through regions (stages, gym towns, Elite Four, Champion, final boss) with a walkable **Hub Town** between runs (plus **Pocket Town**, "Woodland Hamlets"). Working and integrated beats feature count. Same state + seed + actions = same result.

Style: flowy, bouncy, animated. Aesthetics: Frutiger Aero, DS era, Wii era, Cyber-Maximalism. References: Enhanced Battle UI, Essentials 21.2, Deluxe Battle Kit, Visual Bible; PokeRogue is fine as a reference. Assets come from Kice's packs (PokeRogue AGPL-3.0, Nintendo material); keep provenance for every asset and dataset. Kice approved the site being public with pack sprites.

Modes: Story Run (title menu, #983; Main Rival only here), Classic/random runs, daily, challenge modes (Nuzlocke, pacifist, time attack, spooky, speedrun, others), Raids, Totems, Mega-Expeditions, 14+ minigames, Battle Frontier, Galar Stadium and Champion Tournament (Beta 0.5).

---

## 2. Architecture (hard rules)
Stack: TypeScript (strict), Phaser 3.90, Vite, Vitest, Playwright 1.63.0, Zod. Node 22.

- `src/core` is pure rules and **never imports Phaser**. Outcomes never depend on animation or UI.
- Zod validates all data and saves. Balance numbers live in `src/data/balance.json` or validated data.
- Named seeded RNG streams (`src/core/rng.ts`); a new stream never changes existing rolls. Previews, hovers, asset loading and animations never use gameplay RNG. No reward or event applies twice (ledger/claim pattern).
- Presentation failure never corrupts battle state; respect motion/intensity/skip/audio settings. Boss phases follow game state, not animation.
- No placeholder behaviour for a requested mechanic. Every content item has a status: supported, limited (documented), disabled or invalid (`src/quality/`, `QUALITY_GATES.md`). Passing the schema is not "supported".

Key folders: `src/core/` (rules: `run.ts`, `state.ts`, `contentSchema.ts`, `rng.ts`, `battle/` engine/abilities/damage/transform(Mega, Tera, Z, Dynamax)/hyper/doubles, `presentation/` cue layer, `story/`, `story2/`, `raid/`, `totem/`, `expedition/`, `rivals/`, `mentors/`, `bond/`, `care/`, `hubTown/`, etc.), `src/data/` (JSON content + `index.ts` loader; generated files never hand-edited or read whole: `species.json`, `learnables.json`, `moves.json`, `bossTeams.json`, `moveAnims.json`; rebuild with `npm run data:*`; events from `tools/events/*.ts` via `npm run data:events` or `src/data/events/<name>.json`), `src/game/GameSession.ts`, `src/save/saveManager.ts`, `src/scenes/` (Phaser screens), `src/ui/`, `src/assets/catalog.ts` (the one place asset names live), `tools/` (data/assets/report scripts, `playtest.ts` bot), `tests/unit` (~300 Vitest files) and `tests/e2e` (~100 Playwright specs).

Big files, never read whole: `run.ts`, `engine.ts`, `contentSchema.ts`, `BattleScene.ts`, `HubScene.ts`, `itemCatalog.json`. Grep the symbol, then read a 40-80 line window.

Doc router in the repo: `CLAUDE.md` (start here) -> `STATUS.md` -> `MAP.md` (only to find a file) -> `.claude/rules/*.md` (core, data, saves, screens, tests, working-style) -> `CHECKLIST.md` (grep headings), `GAME_DESIGN.md` (decisions D1-D16), `IMPLEMENTATION_PLAN.md`, `QUALITY_GATES.md`, `docs/plans/INDEX.md` (line ranges for long docs), `docs/status/<slice>.md` (about 530 one-bullet notes; grep `docs/status/INDEX.md`, never read whole), `docs/updates/beta-0.5/` (per-PR update-log fragments). `STATUS.md` is stale (last edited 2026-10-30, but its Saves line is current): new slices add `docs/status/<slice>.md` instead.

---

## 3. Build, test, CI, deploy
- Run: `npm install`, `npm run dev` (http://localhost:5173). URL flags: `?seed=x`, `?campaign=dev` (short 2-region), `?debug=1`; F2 = debug panel. Save Creator page: `savegen.html` (`npm run build:savegen`, #1110).
- `npm run check` = typecheck + unit tests + build + content gate (about 80 s fast box; much slower in cloud sandboxes). `npm run test:e2e` = Playwright (CI shards it 6 ways). Iterate with single files: `npx vitest run tests/unit/x.test.ts`, `npx playwright test tests/e2e/x.spec.ts`.
- CI (`.github/workflows/ci.yml`): `changes` job skips heavy jobs on docs-only PRs (#1042); **CI skips DRAFT PRs (#1043), so mark PRs ready for review**; `check` job (typecheck, `npm test`, build, `report:check` content gate, `report:assets`, `report:perf`, bot playtests incl. `--deep`), 6 Playwright shards (#1076), and a final `CI ok` job that aggregates. CI runs on PRs into any branch. Also `pages.yml` (deploy on push to main) and `story-nightly.yml`.
- **Branch protection on `main` is still off.** Kice must set `CI ok` as the required check (Settings > Branches) once main is green. Kice often hand-merges before CI finishes; the owning thread then checks main's CI. Main CI queues back up (about an hour) and stale failure emails are common.
- Gotchas: stale vitest cache in sandboxes -> `rm -rf node_modules/.vitest-cache node_modules/.vite`. Local typecheck needs `NODE_OPTIONS=--max-old-space-size=6144`. Local unit failures in `milestone9` / `weatherFx` / sprite tests = missing generated `public/assets/manifest.json` in the sandbox (run `npm run assets:manifest`), not real. Playwright: first key press after a scene change can drop, wait 250 ms.
- Gameplay fingerprints: `tests/unit/story.test.ts` `BEFORE_STORY` hashes. Re-pin only when a slice changed gameplay on purpose; fetch origin/main first because two threads re-pinning the same line is the usual cause of red main. Never re-pin to hide an unexplained failure.

---

## 4. Saves and migrations
Current versions (`src/save/saveManager.ts` `CURRENT_VERSIONS`, verified 2026-11-12): **profile 20, run 42, settings 41, meta 1, timeline 1.** Next free: profile 21, run 43, settings 42. (Check `origin/main` first; if another branch took a number, take the next.)
- Any saved-shape change bumps the version and adds a migration (N to N+1). Never silently drop a save; recover bad saves. **Every bump needs a migration test.**
- Optional fields need no bump (zod drops retired fields). Old Starter Sets fields drop on load; old archetype saves convert to Nate/Hilda.
- Test save then reload at checkpoints; nothing may apply twice.

---

## 5. Workflow rules (Kice's project instructions, standing)
- **Token efficiency is top priority.** Short replies, no recaps, read only what you need, batch tool calls, small diffs, reuse code and assets. Read `STATUS.md` first, not CHECKLIST. Never read the huge design .md files whole (use "(text)" copies or sections).
- Carry out every guide and doc in full; don't stop to check in except for real blockers; start the next phase without asking. If something is unclear, ask Kice directly in the thread.
- **Every thread opens and owns its own PRs** and never pushes onto another thread's PR. One PR per workstream. Push and open PRs automatically. **Rebase on main right before merging; merge only when that PR's own GitHub CI is green** (local pass is not enough). A red spec you didn't touch: check main's last run first, then fix or report; never merge over it.
- **UPDATE WORKFLOW (Kice, 2026-11-08):** threads work in parallel but everything ships as ONE big PR into `main` with an update log. Make a shared branch per update (e.g. `beta-0.6`); threads PR into that branch, not main; each PR adds `docs/updates/<beta>/<pr>-<name>.md` (Player gets / Save / Limits); the integration lead compiles the fragments and opens the final PR. Kice wants the final PR as top CI priority (freeze other pushes/CI until it merges).
- **Never commit `public/assets/manifest.json`** (generated; `npm run assets:manifest`). Every save bump needs a migration test. New slice notes go in `docs/status/<slice>.md`.
- Coordinator acts as director while Kice is away: answers thread questions, pushes threads to finish everything Kice gave, starts threads freely. New threads at **medium effort, Sonnet 5.5**; Opus only for design-heavy or tricky engine work. One thread per idea category. Threads may use any tool, repo, file or resource.
- Kice grants broad access (2026-11-05): proceed without asking; only say what manual step is needed when access is truly missing.
- **Alerts:** Kice wants a notification (post with notify) every time they're needed or a new PR opens.
- Folders: idea lists `ideas/`, plans `plans/`, promo images `promo/`, 2000s-style ads `promo/ads-2000s/`. Art from the Google Drive packs is allowed and encouraged.
- On Kice's own Windows PC only: graphify, codeburn, ponytail, headroom (port 8787), caveman proxy (port 8788; use `caveman claude`, not `headroom wrap`). Cloud threads load plugins only from claude.ai Project settings > Plugins and MCP servers only from claude.ai connectors; repo `.mcp.json`, `.claude/settings.json` plugins and `.claude/skills/` are ignored there. Useful tools Kice wished for: Context7 (library docs), Serena (symbol tools), Superpowers, Ponytail.
- Report format per slice: what was built, what the player can do, tests run (never claim a pass you didn't read), what's stubbed, risks/decisions, next slice. Slice gates: typecheck, tests, build, relevant Playwright, no console errors, screens at several sizes, clean diff, notes updated.

---

## 6. Kice's decisions (do not re-ask)
**Off or deferred on purpose:** Capture Styles built (#750) but DISABLED (`captureStyles.enabled`) until Kice says; Triple Battle deferred; zoom removed; menu/screen redesigns scrapped; Evolution Encounters closed; extra currencies, Risky Evolutions, Free Spirit/Cheerleader paths, respec, profile/collection journal (skipped unless asked), romance, Rescue Ranger, online co-op and cloud saves, cross-run rival memory (Echo, familiar-face NPC, legend guest) all off. Menu speed work on hold. Growth paths without a real mechanic: never invent a stand-in rule.

**Rules:** level cap 100 in Region 1, +50 per region, hard max 500 (`levelCap` in `src/core/regions.ts` + `balance.json`); HP boost x1.2 (#1097); boost cap +30%. Rival and story losses NEVER end a run (all modes except Adventure and Death-Block); always 4 active rivals; first rival fight = 2 Pokémon, ace at player level +2; rival is last challenger in the Galar tournament; main rival only in Story modes; harder rivals. 8 gym towns per region, 6 required, 2 optional (24 leaders); Gym Fork stays; leaders/E4/Champions are not region-locked. Max 1 cinematic (major) story moment per battle. Mega signature moves usable only while Mega Evolved (142 built). Each run = 1 major + 1 additional + 1 friendly rival. No selling, 100-item cap, 6 revives per battle, money cap 999,999, 25 per item per stage; EXP candies removed, Luck nerfed; 8 difficulty types; Hyper/Overdrive found moves use an extra slot with keep-or-skip.

**Starters:** Starter Sets / "Classic" pool are GONE. **Starter Remembrances is the only starter system** (`src/data/story/remembrances.json`, `core/story2/quiz.ts`). The quiz gives 3 starters from 3 different regions; all others unlock via quests/events (#1095, #1098, #1101). Non-Story runs use `core/story2/starterDraw.ts`. The "win" unlock route is not authored.
**Player trainers (latest, 2026-11-08):** starting trainers are **Red, Blue, Green, Hilda, Nate**. Hilda and Nate are rebuilt as unique trainers that parallel each other; Nate nerfed to +15 (#1112). Trainer is NOT shown on screen in battle (leaves after the throw). Grunts male-only. Every trainer from the packs imported "regardless of importance".

**Bosses:** Gym Leaders, E4, Champions and especially Rivals get held items, proper IVs/EVs and training; Rival/Champion item count = player's, strategized per Pokémon (#1122). Boss gimmicks (#1059/#1064): Gym/E4/Champions get 1 of Mega/Tera/Dynamax/Z after Stage 5 of Region 1, +1 per later region, max 4 (`src/data/bossGimmicks.json`, `npm run data:boss-gimmicks`). Every boss team has a custom form; Champions from region 6 have a Legendary. Boss sweep guard (#1135): new foes brace after a KO streak.
**Galar (Beta 0.5):** Stadium, 32-trainer Champion Tournament, bracket and replays, Ball Guy shop, crowd cameras and audio, reporter interviews. Galar gym/tournament/Champion battles use Kice's SwSh Gym Leader track from 4:19 with a 1 s fade-in. Champion example: player = Cynthia's Region-1 team vs Leon's Region-1 team at matching levels. Galar-only hype: survive-and-evolve, sweep counters (not on the player's last mon), all gimmicks (#1123; gated by `galarMoments` switch in #1132, still open).
**Gimmick visuals:** Kice approved Dynamax (#1105, "looks perfect"). Tera and Z-Move show the enemy trainer; gimmick scenes are full screen with zoomed camera (#1124).
**Evil Team:** Betrayal plays after the leader loses, then the catchable Legendary fight immediately (#1101/#1103).
**Roadmap answers (2026-11-07):** regional forms are NOT a battle mechanic: opt-in prompt on entering a region where the Pokémon has a form; IVs/EVs done properly (built, run v41 migration); time/weather evolutions also allow the matching stone; build all unused item pictures; remove "1 of 6 abilities" text; battle-depth redo must match `/mnt/project-files/shots/kice-2026-11-07/reference-battle-depth.png`.
**UI picks:** text box mockup 5; Hub Town mockup 4 (Garden Village); Pocket Town mockup 6 (Woodland Hamlets). Every multi-style menu defaults to the ORIGINAL design; reworks are options.
**Overhaul (Kice, 2026-11-06):** one shared controlled-randomness generator; a power budget (Threat Rating); handcrafted teams for important battles; rare stays rare (caps + 100-run sim); cross-system regression tests first. Rarity tiers: adopt 8 (today's 6 mapped). Hyper = bond/defense; Overdrive = aggressive with a drawback. Evil dark trainer types: assassin -> Shadow Agent, necromancer -> Spirit Caller.
**Story Overhaul v2** (`/mnt/project-files/plans/Story_Overhaul_Design_v2.md` + `_Implementation_Plan.md`, Appendix S = Kice's answers): stage 4 Crossing Trial, no 28-stop form, rival record for Hub/codex only, Old Method plain variant, Story Run fixed Main Rival.

---

## 7. What is built (short; details in `docs/status/`)
- **Core battle and run:** full turn engine (abilities, items, Mega/Tera/Z/Dynamax, Hyper/Overdrive, doubles), AI batches, difficulty/heat, multi-region runs, bosses, challenge modes, modifiers, daily/seed codes, IVs/EVs, regional-form prompt, time/weather evolution + stones, item rework.
- **Beta 0.5 (merged #1114, 156 commits, 223 files):** trainer parity (every trainer has records, bonds, friendship, mastered moves, styles, items), Mentor/Protégé rework (10 types, 12 chemistry traits; run v42), Galar stadium + tournament, cinematic framework + scenes (raid, Evil Team, rival, Champion, boss ace cards, Hyper/Overdrive), Dynamax remake + G-Max, Evil Team Betrayal, Starter Remembrances only, Nate/Hilda, Save Creator. Fragments: `docs/updates/beta-0.5/*.md`.
- **After #1114 (all merged 2026-11-08):** Red/Blue/Green back + Nate/Hilda pair (#1112), first-load update splash (#1121), boss/rival held items + IV/EV (#1122), Galar polish (#1123), full-screen gimmick cameras (#1124), gear-tier ease + win-rate curve tool (#1125), Look B selector (#1126), Save Creator `startRegion` (#1127), Galar interviews (#1128), "player unable to reach Hub" fix (#1129), rebalance re-pins (#1130/#1131), sweep guard (#1133-#1135).
- **Story/world:** Story Run, Living Rival, rivals (home region, signature mons), nemesis, Story Overhaul Tracks F/P/S/W (all W done), world sim, dungeons, run events (~490 of 560), Pocket Town v2 + Hub Town (both from `tools/hubtown/build.py`), Camp, Plaza, Hall of Fame.
- **Content:** 142 Mega signature moves, Beta 4.4 Pokémon (17 species + 5 Pocket Town starter scouts), custom Pokémon use stand-in recolours until Kice provides art.

---

## 8. Open and unfinished work (verify each before starting)
1. **MAIN CI IS RED.** Last green main run was #2260 (PR #1093, 2026-11-08). Since #1114 merged, runs #2331 through #2366 are failures or cancelled; the latest (70a35bf, 2026-11-11) fails in `npm test` (unit) and e2e shard 3 (the other five shards pass). Per #1132's notes, `tests/unit/story.test.ts` pinned fingerprints don't match on main (caused by non-Galar merges plus #1123 changing old-seed rolls on purpose); #1131 re-pinned STORY1/0. Job: reproduce locally, find every failing test, fix without hiding anything, get main green, then ask Kice to set `CI ok` as a required check. Run `https://github.com/AwsomSause/pkmn/actions/runs/43017150113`.
2. **PR #1132 is open** (not draft): "Galar moments get a switch so old seeds play as before" (`galarMoments` balance switch, default on). Review it, rebase, merge when CI is green (or close if superseded).
3. Known Beta 0.5 limits: gym entrances and the REUNION cinematic scene not built; some camera-cut art; Dynamax camera follow-ups done in #1124.
4. `docs/updates/beta-0.5.md` is the early skeleton, not the compiled final log (the PR #1114 body is the real summary); compile the fragments if a final log is wanted.
5. Content gaps (`docs/status/content-audit-*.md`, #982/#998): unreachable forms (Tatsugiri Droopy/Stretchy Mega, Magearna Original Mega, 5 Delta battle forms), 17 signature Z-Moves disabled, Pledge combos and Order Up limited, Elder Gale single-target.
6. Never built: Capture Styles (off), Triple Battle, rival 'win' starter route, full quiz on non-Story runs, Story landmark moment tier has no caller, regional-form leftovers, the S19 story pacing rules, parts of the ~334-system idea backlog (`ideas/` + `docs/ideas/roadmap.md`).
7. **Sim limits:** the bot never passes regions 1-2, so late game (region 3+, E4, Champion, level-cap curve) was never measured; no run reached E4 in the 600-run sim. 3 Story Run runs ended on unflagged "rival"-class trainers (check it was fixed). Tools: `reports/sim-600-tools/`, `npm run sim:overhaul`.
8. Mobile/phone sizes below 932x430, touch keyboard and cut-off text sweeps remain unchecked (see `docs/status/text-fit-*.md`).
9. Settings that do nothing (Story Intensity, subtitles, journal voice, color-blind markers, UI scale), run recap / shareable run card, "What's in this run" screen, first-time tutorial, Daily Run format, Draft Lab / Regional Circuit, Bank tiers / Research Tree / Prestige, audio per-region themes, doubles trainer poses: see `ideas/feature-roadmap-2026-11-07.md` workstreams W1-W18 (several since built; grep before starting).
10. Waiting on Kice: sprite art for Tuftin, Oracowl, Tempestwing, Megawattrel and six Legends (Equinar, Hollow Shepherd, Brinecrown, Veinheart, Lumeria, Verdelis) at `public/assets/images/pokemon/custom/<id>.png` + `.json`; Drive Assets folder for custom Pokémon (`plans/drive-assets-plan.md`).

---

## 9. Next update: Beta 0.6 "You are (Not) alone"
Title only is known. Do NOT invent scope: ask Kice first. Reasonable candidates drawn from what exists and what Kice has asked for (propose, don't assume): the unbuilt Beta 0.5 pieces (gym entrances, REUNION); companions/NPC allies and the friendly rival (the title fits Mentors, Rivals, bonds, Tag Team, which already exist in part); player-trainer follow-ups; Galar polish; the roadmap list in section 8 item 9. Set up the shared `beta-0.6` branch and `docs/updates/beta-0.6/README.md` fragment layout (copy `docs/updates/beta-0.5/README.md`). The full update log of the last update is thread "Create an extensive update log" (project chat); player-facing patch notes are in `/mnt/project-files/reports/patch-notes-mega-2026-11-07.html`.

---

## 10. Asset and file locations
- Project files `/mnt/project-files/`: `plans/` (Story Overhaul v2 + plan, overhaul-content-pack-plan, drive-assets-plan, item-rework-plan, mega roster files, starter-sets-removal-plan, OVERHAUL_REPOSITORY_AUDIT), `reports/` (feature-roadmap-2026-11-07.md, update logs, patch notes HTML/PNG, item/event/custom/boss-gimmick dex HTML, rival/pokemon/trainer sim-600 reports, hp-scaling), `pokedex/pokedex.json`, `promo/` (hubtown/pockettown/textbox/ui mockups), `shots/` (kice-2026-11-07 reference images), `clips/`, `gimmicks/`, `videos/`, `trailer/` (Beta 0.5 trailer), `sim/`, `saves/`, `shinies/`, `zmove/`, `asset-check/`, `uploads/hearth/` (uploaded files by id, no extension).
- Kice's PC: `C:\Users\test\Downloads\ABDM\Compressed` holds the asset packs (approved folder; main project folder `...\pkmn-main_7`).
- Pokémon Memories reference repo: https://github.com/AwsomSause/Pokemon-Memories.
- Older handoff: `project-rundown.md` (Kice's upload `file_011yZ1ZKJQayKH8BasBwesmp`, not in the shared folder; its key content is carried here).

---

## 11. Suggested project instructions for the new project
```
You work on Pocket Raiders (repo AwsomSause/pkmn), a deterministic browser Pokémon roguelike. Director: Kice (beginner programmer, Pacific time). Keep replies short, plain, result first; post with notify whenever Kice is needed or a PR opens.
Start every thread: read CLAUDE.md, STATUS.md and docs/HANDOFF.md; grep before reading; never read big generated data or design docs whole.
Each thread opens and owns its own PRs (never push onto another thread's PR), one PR per workstream, ready for review (CI skips drafts). Rebase on the update branch right before merging; merge only when that PR's own CI is green. Updates ship as one big PR from a shared branch (beta-N) with docs/updates/beta-N/<pr>-<name>.md fragments (Player gets / Save / Limits).
Every save bump needs a migration test. Never commit public/assets/manifest.json. Slice notes in docs/status/<slice>.md.
Coordinator acts as director while Kice is away. New threads: medium effort, Sonnet 5.5; Opus only for design-heavy engine work. One thread per area.
Do not build anything on Kice's off/deferred list (HANDOFF section 6) without asking.
```

## 12. First threads to start
1. **Get main CI green** (section 8.1) plus resolve #1132. Everything else waits on this.
2. **Ask Kice for Beta 0.6 scope**, then create the `beta-0.6` branch, README fragment layout and an integration-lead thread.
3. Beta 0.5 leftovers: gym entrances, REUNION scene.
4. Late-game sim: bot or fast-forward start that reaches region 3+, re-run the sims, rebalance with Kice's rules.
5. Content gaps (section 8.5) and the Story pacing rules.
6. Roadmap items Kice picks from section 8.9; each in its own thread.

## 13. First-session checklist
`git fetch origin main`; read `CLAUDE.md`, `STATUS.md`, this file; check main's latest CI run; confirm save versions in `saveManager.ts`; branch from fresh `origin/main` (or the update branch); build vertically (data, rules, UI, saves + migration test, unit + e2e), add the status note and update-log fragment, open your own PR, rebase, merge only on green CI.
