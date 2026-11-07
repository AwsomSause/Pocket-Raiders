# Feature roadmap: what we promised, and what should come next

Written 2026-11-07 against `main` @ 0d7c0d47, then rewritten after a full read of all 92 threads (resolved ones included) and the whole project chat. Sources: every project thread and the project chat (through 11-07 18:26), Kice's decisions, `plans/` (Story Overhaul v2 + plan, Overhaul content pack, item rework, Mega roster, Drive assets), `reports/plans-audit-2026-11-07.md`, `docs/plans/left-out-plan.md`, STATUS.md and `docs/status/`. Status words: **built** (on main), **in PR** (open or draft PR), **not started**. Built/in-PR comes from git history and what the threads reported, not from play-testing. Many PRs were merged before CI finished, so "built" does not mean "green on main".

## Kice's decisions that shape both lists (do not re-propose)
- **Off on purpose:** Capture Styles (built in #750 but OFF, `captureStyles.enabled`, until Kice says), Triple Battle (Kice picked "Defer"), zoom (removed, #804 closed), menu/screen redesigns (Kice: "scrap these menu redesigns"), Evolution Encounters (#704 closed), "more currencies", Risky Evolutions, Free Spirit and Cheerleader growth paths ("skip for now"), respec (no EVs), profile journal / collection journal (skipped unless asked), cross-run rival memory (Echo, familiar-face NPC, legend guest), romance, Free Spirit/Cheerleader, Rescue Ranger, Theme O, online co-op and cloud saves (recommended skip), AI "fatigue" rule (removed).
- **Also decided by Kice:** Berserk only for fitting Pokémon; no selling, 100-item cap, 6 revives per battle, money cap 999,999, 25 per item per stage; Hyper/Overdrive found moves use an extra slot with a keep-or-skip screen; Premier Ball per 2,000 spare XP; EXP candies removed, Luck nerfed; 8 difficulty types; menu speed work on hold; Mock 5 text box, Garden Village hub, Woodland Hamlets Pocket Town; trainer leaves the screen after the throw; every trainer from the packs imported "regardless of importance".
- **Rules:** level cap 100 in region 1, +50 per region after. Rival and story losses never end a run. First rival fight is 2 Pokémon, ace at player level +2. 8 gym towns per region, 6 of 8 needed. Mega signature moves usable only while Mega Evolved. Max 1 cinematic moment per battle. Main rival only in Story modes.

---

## List 1: everything we said would be added

### A. Story Run (Story Overhaul v2, 36 slices)
| Item | Status |
|---|---|
| Foundation F0, prologue, trainer sprites/poses P1 P3–P7 | built |
| Story Run on the title menu, name/pronouns, prologue Beats 5–8, rival dialogue, trainer intros | in PR (#995, fixing conflicts; #983 entry point merged) |
| Beat 9 Field Trial (scripted spar), story sounds and icons | in PR (#995 follow-up PR, not yet opened) |
| 7 backstories with full content (S1), Professor Vance | built |
| Quiz, Heartbond, Embrace care (Lv 7), Feats, signature moves, Remembrance lines (76 lines, 228 sig moves), Starter arcs, 13 Rare/Exceptional quest arcs | built |
| Gym Fork (8 towns, 6 required), leader/role pool, 15 pool towns, evil beat 7 at League | built |
| Journal screens (S13) as lists, 10 new story species | built (tabs and art missing, see below) |
| Rivals: ace ladders, activity, rumors, race paces, Notebook screen, Track W (W0–W9) | built |
| Story teams, 6 original evil teams, 10 Alphas, Exhibition Bracket, 30 event templates, Eevee Crossroads, 12 chemistry types, 24 camp scenes, Story Bus, credits page, trainer facts check, chain timing | built (#986) |
| Simulation harness S19 (6 bots, nightly sim) | built, 3 pacing rules still broken on every seed (parked for Kice) |
| Walkable Pocket Town (Woodland Hamlets) and Hub Town (Garden Village) redesigns | built |

### B. Overhaul content pack (30 slices) and Beta 4.4
| Item | Status |
|---|---|
| All 30 slices, Living World (memories, environments, personality, chemistry, event chains, boss aftermath, rival roles) | built |
| Growth paths | 104 of 106 playable (#940, #953, #957). The last 2 (Free Spirit, Cheerleader) stay off by Kice's choice; Rocky Helmet not counted for Thorn Warden |
| Run modifiers (Bug Outbreak etc.), Mythical quest chains, region identities, rival Notebook, sprite-pose moments, moment dev tool | built |
| Rarity tiers, Legendary roles, Tera/Z power budget, rarity caps (#984) | built |
| 40 Delta scenes, 51 lore scenes, camp quirks by hour/festival (#984) | built |
| Rival win-rate band | measured early fights only (59%); mid/late can't be measured because the bot dies first |
| Beta 4.4 bug list (28 bugs), early-run deaths + 8 difficulties (#963–#974), 10,000-run sim fixes (#948–#958) | built. Still open from Kice's answers: Random Draft and modifier picks A/B/C failed to start (#758 fixed the crash; recheck), black battle screen only with non-default Battle UIs (never reproduced, needs style name), menu/info-screen speed (on hold by Kice) |

### C. Section-9 idea lists ("Build remaining ...")
All built and merged: game modes (Randomizer, Streaks, Pity, Milestone Chests, Bounty Boards, Tag Team), economy (dynamic prices, wealth tax, Omens, charms, item sets, TM Deck), growth (Tuning Dust, bond paired moves, Training Camps, Mentors, Nursery, regional-form ritual, Ability Capsule quests, Diaries, friendship loafing), battle/AI (regional charts, elemental reactions, AI tricks, move fusion, doubles combos, crowd, field effects, learning bosses), run map (puzzle dungeons, Sky Route, Endless Tower, seasons, Treasure Hunt, World Boss Week), raids (17 ideas incl. co-op hot-seat), minigames (7+ games, Mystery Dungeon, Berry Blending, Contest, Frontier shop), presentation (camera, parallax, packs, stickers, ash), hub/meta (Airship, market swings, Dream Tower, Guide Pip, Social rank), social/tech (leaderboard, replay viewer, mod hooks), capture (Lure Crafting, Scent Trails, mastery rows), run events (about 25 trainer events). **Dropped by Kice:** Evolution Encounters (#704 closed). Real birdsong landed (#748), but its licence/provenance is unconfirmed. **Not built from these lists:** Collection Books / Quest Chains / Reward Tracks (named as next, outcome unknown), capture-style minigame screens and predator-take messages (Capture Styles roll like a ball throw), Randomizer for abilities, online or second-controller co-op, World Boss Week is local only, gimmick levels only show in battle messages, 10 Mythical chains (Arceus, Genesect, Magearna, Volcanion, Keldeo, Meltan, Zarude, Pecharunt, Darkrai, Phione) and the Mythical intro cinematic, region lore shown on no screen, no region-specific events.

### D. Items and Megas
| Item | Status |
|---|---|
| 142 Mega signature moves | built (limits: Elder Gale single-target, "badly poison" is plain poison) |
| Item rework PRs 1–4 (candies, charms, Hyper Potion→Premier Ball, Luck nerf, stages, rarity, crests, held hooks), 853 item sprites imported and wired | built |
| 17 species Z-Crystals | built |
| Bottle Caps, fan Mega Stones | not buildable (no IVs; every Mega already has a stone) |
| Gimmick looks: Z-Move, Dynamax, Tera, Mega "like the reference" | built |

### E. Art, audio and Drive assets (thread "Add missing Drive plan assets" still working)
| Item | Status |
|---|---|
| Trainer sprites (all packs), 28+47 themed arenas, Pokédex footprints, low-HP music, Pokédex data page, Gen 9 learnset pass (695 moves), Decades rule options (Own-Type Normal, Frostbite, Drowsy) | built |
| 18 Decades songs for battle/map variety | in PR (#991) |
| 43 class NPC overworld sprites | in PR (#992, draft) |
| 115 animated form sprites | in PR (#989, draft) |
| Remaining Drive items: more arenas (276 backgrounds, ~137 in), rest of 527 music tracks, Kice's own Pokémon from the Assets folder (blocked: folder not in the repo copy), ~640–738 unused library item pictures (Weakness Policy, Ability Patch, Nature/EV balls style items still need code) | not started |

### F. UI redesigns
Text box (mockup 5, dimmed screen, trainer slide-in, typing, shake/jump/cry, faster-text setting), Battle UI polish, platform alignment (#808 merged, reverted by Kice in #809 two minutes later, no reason given; Koffing-type floaters still hover, request not re-landed), 9-screen UI sweep, trainer throw animation: built. Trainer shown in singles only; doubles, command/item/capture poses and reaction setting: not started. Male trainer look is a "COMING SOON" stub; the Hub plaza speckle fix (#937) was closed on Kice's "remove this stuff"; small text is still tiny on many screens and map quest text is hard to read.

### G. Still-promised Story Overhaul pieces that are NOT built (from the plans audit)
- **Reachability:** quiz screen, reveal/inspect panel, backstory picker, first-partner screen, Look picker in Settings: not started (the thread "Make Story Run playable" is wiring some). Ending tables, lost-run endings, `resolveThemeEnding`, leader/Elite/Ashdown scenes, lieutenants, grunt lines, cutscene runner, news templates, Move Moments: data exists, no player path.
- **S2/S3:** Quick Quiz, intake interview, Professor's Pick, 60 reaction + 30 result lines, replay determinism fields, Look B data.
- **S5/S12:** echo events 3 of 5 per backstory, exclusive items/props/conclusion scenes, backstory gameplay modifiers (Notoriety, Old Pass, Walk-Up), Hollow Shepherd record.
- **S6:** Talk/Play topic cards, memories page, Bond Ability at level 5, Story Abilities, heart icons, level banners, 12 snacks, 16 temperament behaviours, Seeded Twists. Embrace/keepsakes in #980 built.
- **S7:** Echo montage, Marginalia sketch, naming prompt (browser prompt), 4 Feats never offered, Move Moments never taught.
- **S9–S11:** Fork Gate polish, Meet-the-Leader stops, Closed Doors, 6 Guest Leader badges, Elite Four role pool in Story Run, rival beats 1/3/5/7, reveal and Retrospective Replay, Marisol ledger, 6 core theme cards.
- **S13/S14:** Journal tabs (Pokémon Story, Optional, Mysteries, News, Adaptation Log), Cast filter, Lore search, Story Archive, 80 more news templates.
- **S15–S18:** real art for 10 new species (stand-ins now), signature abilities, Dex text/cries, cutscenes, story music (nothing composed), Story Intensity / subtitle settings read by nothing, colour-blind cues.
- **Design v2 extras:** Marauder cast, relationship consequences and gossip, legend-plot ladder, 9 major events, blueprint viewer, tone/stakes/Mercy ladders, 12 Pokémon-specific arcs, voice lines, rival interference/showcases/rematch ladder, 9 of 25 run events still disabled, 5 pseudo stages, dark rooms/extraction, 14 of 24 rumours dead, rival Mega, `rivalIntensity`/`worldNews` settings.
- **Art volume:** about 660 art items (pose cards, props, backdrops, stills, grunts, walk/collapse/kneel clips).
- **Perf (P9):** 28 files over 500 KB, 16.5 MB bundle, mp3 re-encode: not started.
- **Left-out plan P1/P2 not confirmed built:** Bank tiers, Legacy & Live hub systems (Trainer Network, Research Tree, Prestige), levels above 100 (+50/region; cap work was a separate thread), Encounter Director extras, bond-based evolution outside battle, Daily Run as its own format, Spooky Mode content, Draft Lab / Regional Circuit modes, fuller catch reveal, settings (UI scale, color-blind markers), generic trainer classes as data, Advanced AI scripts (most of 47). Verify each against main before starting.
- **Kice asked, never confirmed delivered:** live website deploy (sat queued behind the Actions backlog), Z-Move stage backgrounds (Z-Power art never found), full-pass UI polish (#927/#931/#945 landed, no final sign-off), healing-use / held-item / ball-throw caps from "other such changes", Pokémon alignment (above), phone sizes below 932x430 and text-fit sweeps, "Playtest 500" per-5-run comments.
- **Track W leftovers:** 4 pseudo stages with no opener (Safari, Dreamscape, Evil Hideout, Celestial Expanse), map-node world hints, egg sparkle, dungeon items (torch, key, supply pack), Rival Interference, 14 of 24 rumours off, leaders: second leader per town and "taking the role" intro lines.
- **Story species / audio:** 10 species use recoloured art, level-only evolutions, no signature abilities, no composed music, ~26 SFX and the barks missing, nothing plays the story audio ids; Journal extras (News, Mysteries, Adaptation Log, Replay) wait on systems that do not exist; 15 of 20 Keepsakes cannot be earned until events are tracked; some Story starters (Geodude, Growlithe...) have no Remembrance arcs; Nidoran-pair Remembrance blocked by id pattern.
- **Open bugs from content audit:** Fury Cutter, Alluring Voice, Pledge combos, Order Up are plain hits; 5 Delta forms, Tatsugiri/Magearna Megas unreachable; 17 signature Z-Moves disabled.

---

## List 2: what SHOULD be added (recommendations)

Ranked by value to "a fun, replayable, complete game". Each respects the decisions above.

### Must do first (the game must be playable and trustworthy)
1. **Finish the Story Run end to end.** Merge #995, then one playthrough from title to ending with no debug URL. Without this, most of Track S and all of Design v2 is invisible. Includes quiz screen, backstory picker, first-partner screen, and lost-run endings.
2. **Make main CI trustworthy.** Many merged PRs show red or timed-out e2e specs. Shard Playwright, quarantine nothing, fix flakes; turn on branch protection (Kice's one manual step). Add the 50-seed bot playtest to CI.
3. **Full real playtest by Kice or a bot to depth.** The bot never passes region 1–2, so late game, mid rivals and the level-cap curve have never been measured. Build a bot that survives to region 3+ (or a "fast-forward to stage N" debug start) and run the 10k sim again.
4. **Fix the parked S19 pacing rules** (3 broken on every seed) and the open move/ability gaps listed above.

### Should do next (biggest fun per effort)
5. **Wire the dead story content to the player:** rival scenes at map nodes, leader/Elite scenes, theme endings, news, interactables. Data exists; callers don't.
6. **Settings that do nothing:** Story Intensity, subtitles, journal voice, rivalIntensity, worldNews, separate shake/flash, color-blind markers, UI scale. Cheap and visible.
7. **Run summary / shareable run card** and a post-run recap screen (grow idea from the content-pack plan, not found). Strong replay hook.
8. **Weekly QA / balance report** in CI (idea from plan) so tuning stops being guesswork.
9. **Battle feel pass for doubles:** trainer in doubles, command/item/capture poses (P2/P8 gap), contact shadows, boss-phase arena light.
10. **Onboarding:** a short interactive tutorial for first-time players, plus "what changed" on the title screen. The game now has hundreds of systems and almost no explanation.
11. **Content visibility:** a single "What's in this run" screen showing active modifiers, season, bounty, world boss week, so players notice the systems already built.

### Good to add (depth and replay)
12. **Daily Run as its own format** (curated starters, daily modifier, short route, set final boss) plus a shared seed leaderboard entry for it. Pieces exist.
13. **Draft Lab and Regional Circuit modes** (left-out plan 5.13), reusing the Randomizer and Tag Team code.
14. **Spooky Mode content** (events, shop, boss) so seasonal play differs; a festival calendar tie-in with camp quirks.
15. **Remaining mid/late-game systems:** Bank tiers and Out-of-Run services, Research Tree, Prestige (never deletes collection), Regional Intelligence Board.
16. **Bond-based evolution and move learning outside battle**; Eevee Leanings (Design v2); finish the last growth paths.
17. **Boss variety:** bosses with new held-item hooks, Champion adaptive rule, legend-plot ladder, rival Mega, rival interference and rematch ladder.
18. **Accessibility pass:** aria-live for story text, small-screen checks, line-length validators, reduce-particles option, Content Notes card (all in Design v2 Part XII).
19. **Audio pass:** per-region and per-boss themes from the 527-track pack, story music ids actually played, ambient town loop (needs `Amb-Birds.mp3`).
20. **Performance:** lazy-load game data chunks, break the `run.ts` import cycle, compress oversize assets (P9 / repo audit).

### Questions only Kice can answer (the rest are settled by the record)
- Why was the platform alignment (#808) reverted in #809, and should it be re-landed (floaters like Koffing still hover)?
- When a battle shows a black screen with a non-default Battle UI, which style and what were you doing? (Never reproduced.)
- Which of the ~640 unused item picture groups should be built into items next?
- Plaza speckle fix (#937) was closed on your "remove this stuff": redo it differently, or leave the plaza as is?
- Wording of Decades rules Frostbite and Drowsy, and "1 of 6 abilities" now means "any of its own": OK?
- The 3 story pacing rules the Stop table breaks on every seed (S19): accept, or fix?
- Final art, cries, Dex text and poses for the 10 new story species, plus the Look B / male-trainer art and your own Pokémon from the Assets folder: these need files only you have.
- Regional forms as a real battle mechanic, and IVs/EVs, time of day, weather evolutions (this also decides Bottle Caps)?
- Did the website deploy go live?

### Already settled by Kice (do not ask again)
Profile journal: skipped unless asked. Capture Styles: stay off. Triple Battle: deferred. Free Spirit / Cheerleader: skip. Rival difficulty: answered (#904). Town names, evil beat 7, 6-of-8 gyms, level cap (100, +50 per region): answered. Birdsong: `Amb-Birds.mp3` was added (#748). Growth paths without a real mechanic: never invent a stand-in rule. Online co-op and cloud saves: skipped. Menu speed work: on hold.

## Confidence
Built/in-PR marks come from merged PR titles, thread reports and the plans audit, not from play-testing. The audit was written before #984/#986 landed; those items are marked built here. All 92 threads and the full project chat were read (by five readers, each summarising a slice). Anything in "not confirmed built" should be grepped before a thread starts it.
