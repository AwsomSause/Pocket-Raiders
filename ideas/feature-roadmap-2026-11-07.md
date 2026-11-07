# Feature roadmap: what we promised, and what should come next

Written 2026-11-07 against `main` @ 0d7c0d47. Sources: every project thread and the project chat (through 11-07), Kice's decisions, `plans/` (Story Overhaul v2 + plan, Overhaul content pack, item rework, Mega roster, Drive assets), `reports/plans-audit-2026-11-07.md`, `docs/plans/left-out-plan.md`, STATUS.md and `docs/status/`. Status words: **built** (on main), **in PR** (open or draft PR), **not started**. Built/in-PR was checked against git history and thread reports, not play-tested.

## Kice's decisions that shape both lists (do not re-propose)
- **Off on purpose:** Capture Styles (disabled until Kice says), Triple Battle (deferred), zoom (removed), profile journal / collection journal (skipped unless asked), cross-run rival memory (Echo, familiar-face NPC, legend guest), romance, Free Spirit/Cheerleader, Rescue Ranger, Theme O, online co-op and cloud saves (recommended skip), AI "fatigue" rule (removed).
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
| Growth paths | 98 of 106 playable at last report; remaining few were being finished by "Finish last growth paths" (verify) |
| Run modifiers (Bug Outbreak etc.), Mythical quest chains, region identities, rival Notebook, sprite-pose moments, moment dev tool | built |
| Rarity tiers, Legendary roles, Tera/Z power budget, rarity caps (#984) | built |
| 40 Delta scenes, 51 lore scenes, camp quirks by hour/festival (#984) | built |
| Rival win-rate band | measured early fights only (59%); mid/late can't be measured because the bot dies first |
| Beta 4.4 bug list (28 bugs), early-run deaths + difficulties, 10,000-run sim fixes | built (some questions to Kice about modifier mode, slow menus, battle won't load were left open) |

### C. Section-9 idea lists ("Build remaining ...")
All built and merged: game modes (Randomizer, Streaks, Pity, Milestone Chests, Bounty Boards, Tag Team), economy (dynamic prices, wealth tax, Omens, charms, item sets, TM Deck), growth (Tuning Dust, bond paired moves, Training Camps, Mentors, Nursery, regional-form ritual, Ability Capsule quests, Diaries, friendship loafing), battle/AI (regional charts, elemental reactions, AI tricks, move fusion, doubles combos, crowd, field effects, learning bosses), run map (puzzle dungeons, Sky Route, Endless Tower, seasons, Treasure Hunt, World Boss Week), raids (17 ideas incl. co-op hot-seat), minigames (7+ games, Mystery Dungeon, Berry Blending, Contest, Frontier shop), presentation (camera, parallax, packs, stickers, ash), hub/meta (Airship, market swings, Dream Tower, Guide Pip, Social rank), social/tech (leaderboard, replay viewer, mod hooks), capture (Lure Crafting, Scent Trails, mastery rows), run events (about 25 trainer events). **Dropped by Kice:** Evolution Encounters (#704 closed). **Needs a file only Kice has:** `Amb-Birds.mp3` for town ambience.

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
| Remaining Drive items: more arenas (276 backgrounds, ~137 in), rest of 527 music tracks, Maliceye and Kice's own Pokémon | not started |

### F. UI redesigns
Text box (mockup 5, dimmed screen, trainer slide-in, typing, shake/jump/cry, faster-text setting), Battle UI polish, platform alignment (reverted by Kice, reason unknown), 9-screen UI sweep, trainer throw animation: built. Trainer shown in singles only; doubles, command/item/capture poses and reaction setting: not started.

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

### Questions only Kice can answer (so threads stop guessing)
- Regional forms as a real battle mechanic, or keep event-only?
- IVs/EVs, time of day, weather evolutions: add or keep out? (This also decides Bottle Caps.)
- Why was the platform alignment change (#808) reverted in #809?
- When a battle "won't load", what do you see? Which part of Modifier mode breaks? Which menus feel slow?
- Any appetite for the skipped profile/collection journal now that the Story Run has a Journal?
- Should the 8 not-yet-playable growth paths get a stand-in rule, or wait for the systems that can count them? (Current rule: never invent one.)
- Please add `Amb-Birds.mp3` to the repo if you want town birdsong.

## Confidence
Built/in-PR marks come from merged PR titles, thread reports and the plans audit, not from play-testing. The audit was written before #984/#986 landed; those items are marked built here. Anything in "not confirmed built" should be grepped before a thread starts it.
