# 10,000-run simulation: bugs and polish list

Plain-language report. Tool: `npm run sim:mass` (worker, `tools/mass-sim.ts`) and `npm run sim:mass-report` (dashboard, `tools/mass-report.ts`). Seeds are `ms0`..`ms9999`; the same seed replays the same run. Raw data and the HTML dashboard are not in the repo (shared with Kice as a file).

## What was run
- 10,000 runs, 0 skipped: Classic 3,000 (Standard 1,800, Veteran/Champion/Nightmare 400 each), Story 3,000 (600 per backstory, Orrery Circuit), 16 other modes 250 each (Quick Route, Adventure, Daily, Endless, Endless Tower, Spooky, Draft Lab, Regional Circuit, Multi-Region, Research Expedition, Nuzlocke, Hardcore Nuzlocke, Modifier Run, Rule Draft, Time Pressure, Weekly).
- All 287 trainers (archetypes) rotate; 70% of runs heal free on the map, 30% do not.
- The bot is stronger than the S20 one (`tools/lib/simBot.ts`): keeps its best moves on level-up, picks level-ups/vitamins first and gives them to the lead, swaps out low Pokémon when it has no potion. Classic median went from about 11 battles to 36 (Standard).
- Totals: 399,091 battles, 9,911 runs ended in a loss, 25 wins (all Regional Circuit), 1 crash. No run cleared a 3rd region.

## Bugs (fix these)
| # | What | Evidence | Where |
|---|---|---|---|
| B1 | **Crash**: a rival trade takes a Pokémon the partner has no bond for, then reads `.trust` of nothing. Hit while taking a PP Up after a stage change. | `ms3505` (Endless Tower): `Cannot read properties of undefined (reading 'trust')`. 1 of 10,000 runs, but it kills the run. | `src/core/rivals/transfer.ts:88`, called from `simulateRivalWorld` (`world.ts:142`) in `enterStage` (`run.ts:845`) |
| B2 | **Level cap.** 88 runs had Pokémon above 100. This was the old rule working as built (cap 50 per region, max 500). Kice (2026-11-07): the first region caps at 100 and each region after adds 50. Fixed in its own PR. | `ms184`, `ms1955`, `ms1276` | `src/core/regions.ts` `levelCap`, `balance.json` `levelCapStart` |
| B3 | ~~Very long battles~~ **Not a game bug.** 57 runs had fights over 80 turns (up to 226). Traced: the bot kept choosing a move the game had blocked (Torment/Disable); the battle menu already shows the reason (`moveBlockReason`). Fixed in the bot: it now skips blocked moves (re-run: 226 → 29 turns, 206 → 44, 152 → 26). | `ms823`, `ms7332`, `ms5192` | `tools/lib/simBot.ts` |
| B4 | ~~Held items missing~~ **Not a game bug.** The sim read the wrong field (`heldItem`; the game uses `held`, a map of many items). Fixed in `tools/mass-sim.ts`; a re-check shows held items attach (often 6-8 per Pokémon late in a run). The dashboard's held-item chart is empty for this 10,000-run batch. | `ms823` | `tools/mass-sim.ts` |

## Balance and polish (decide, then tune)
1. **Early game is deadly.** 3,022 of 9,911 losses (30%) happen at party level 0-9; the number one killers are wild Pokémon (3,892 wild losses; Bramblin alone 279, Bonsly 136, Wooper 135, Nincada 129). Wild fights are won 99% of the time, so the early losses are a few unlucky fights, not a general difficulty. Consider a safety net (first 3 fights, or run away).
2. **Gym leaders are the wall.** Gym leader fights are won only 82% (3,766 losses, the biggest cause after wilds); worst: Skyla, Chuck, Odette Marr, Melony, Pryce, Larry, Clay, Grant. Elite Four 93%, Champion 70% (434 of 619), rivals 99% (the harder-rivals work may not be biting yet; rival losses never end a run, so this is a check on whether they are tough).
3. **Nobody finishes.** Median depth 17 battles and 0 wins in Classic and Story (max 334 battles; 2 regions cleared). This is partly the bot, so treat as "the bot cannot finish", not "the game cannot be finished". Regional Circuit is the only mode with wins (25/250).
4. **Archetype spread is huge.** Median battles by trainer, 35 runs each: best Dawn (SPR) 34, Lucas 34, Barry 33; worst Sonia 6, Juggler Pierre 8, Harmony 8, Evolved N 8, Yellow 9. Worth a look at the weakest starters.
5. **Starter spread.** Growlithe, Psyduck, Vulpix, Magnemite and Mankey are each 7-8% of all runs; many starters are under 0.1%. Fine if intended, odd if not.
6. **Modes that die in the first 10 battles** (median): Adventure 4, Research Expedition 7, Nightmare 7, Hardcore Nuzlocke 9, Quick Route 9, Daily 10. Adventure ends to trainers 219/250 times. Research Expedition is limited by the bot, which cannot enter expeditions (`autoplay` throws), so its numbers only show the first fights.
7. **Story runs are short**: median 11 battles, 2 Story Stops, 0 regions in all five backstories (2,110 trainer losses, 888 wild). Loss-that-continues counts are working (about 0.97 per run). Story needs a deeper bot before late stops/endings can be judged.
8. **Speed.** Average run 1.7 s, but the 3 slowest (Adventure) took 33-37 s for about 300 battles. Cost per step grows with run length (state is cloned every action). Worth checking before any long-run feature (auto-play, replays).
9. **Rewards**: Lvl-1 Candy (12,388), Shiny Charm (6,525) and stat vitamins are the most-taken rewards. The Shiny Charm count is high for a rare item; check its weight in the draft.
10. **Move variety**: top used moves are Tackle (74,708), Close Combat (55,376), Overheat (53,111), Water Spout (48,717), Petal Dance (47,792). Expected for a damage-score bot, but Water Spout / Overheat dominate because of the bot's power-only scoring.

## Not covered / limits
- The bot never uses status moves, setup, items in battle beyond potions and balls, or the Tera/Mega/Dynamax gimmicks, and cannot play expeditions or minigames.
- Levels over 100 end a run in the sim early (the invariant check stops after 5 repeats), so runs that reach about 320 battles are cut off; see B2.
- Triple Battle, Capture Styles and disabled content are not played.
- `sim:story-nightly` (10,000 Director blueprints, 3 walks per bot): see the section below.

## Story blueprint sim (`npm run sim:story-nightly`, 10,000 blueprints, 3 walks per bot)
PASS in 207 s. 10,000 distinct blueprints, 13 characters used, themes evenly spread (about 2,450-2,550 each). All 6 bots (first choice, random, aggressive, relationship, chaos, completionist) reached the Epilogue 3/3, playing about 42.3-42.7 of 44 Stops. Slots filled 279,343 of 440,000 (63%): worth checking whether the empty slots are intended (not enough pool characters) or a gap.
Note: this walks the story data directly, so it works even though the real-battle Story runs above die early.
