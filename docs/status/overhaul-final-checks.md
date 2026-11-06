# Overhaul slices 29–30: 100-run simulation and acceptance checklist

## Slice 29: 100-run simulation

`npm run sim:overhaul -- 100 out.json` (tools/overhaul-sim.ts) plays seeds `ov0`–`ov99` with the smart test bot (heals on the map, 3000 steps, archetypes in turn) and counts rare things, wild repeats, run length and rival results. Same seed = same numbers.

Measured 2026-11-06 on main e948c976, against the same 100 runs on a200471 (the game just before Overhaul slice 1):

| What | Before | After | Verdict |
|---|---|---|---|
| Run length, median battles (steps) | 45 (327) | 42 (307) | Pass: 7% shorter, rule is "not over 10% longer" |
| Wild Pokémon whose family was met in the last 5 | 15.8% | 8.2% | Pass: repeats halved (slice 3) |
| Legendary per wild Pokémon | 0 in 5401 | 1 in 5359 | Pass: rare |
| Mythical per wild Pokémon | 0 | 0 | Pass |
| Special forms (Delta, Z-form, Spooky) per wild | 1.8% | 1.6% | Pass |
| Hyper moments per battle | 0 | 1.8% (about 1 per run) | Pass: rare, not on every fight |
| Overdrive moments per battle | 0 | 1.6% (about 1 per run) | Pass |
| Cinematic story moments per battle | 0 | 0.44 | Pass: never more than 1 per battle (Kice's choice) |
| Rival fights won by the bot, early / mid | 87% / 5 of 5 | 89% / 6 of 7 | Above the 40–60% band, but the same as before the Overhaul (see limits) |
| Errors | 0 | 0 | Pass |

Nothing went over target, so no balance number was changed.

Limits of the measurement:
- The bot loses every run in the first region or the next one (median 42 battles, 1 of 100 cleared a region, both before and after). So mid and late rival rates, region-2+ legendaries and late-game Mythicals can't be measured by the bot.
- The bot heals on the map for free, so it wins single fights more than a player would. Rival early win rate (89%) is above the 40–60% band, yet rivals still end 36 of 100 runs. Not tuned: that is a difficulty call for Kice.
- Eggs and trades: the bot skips side modes, so they are ~0 here; their variety is covered by tests (eggPools, tradePools).
- The `landmark` moment tier (3 per run) has no caller yet: nothing in the game emits a landmark moment.

## Slice 30: acceptance checklist (THE OVERHAUL.md §18)

Evidence is the test that proves it. "Partly" = tested next door, not head-on.

- **Technical.** No crashes in 100 runs (above). Every species and form starts a battle, evolves, hatches, trades and saves (`crossSystem.test.ts`). Data validates (`content.test.ts`, content gate). Save round-trips and migrations (`save.test.ts`, `variety.test.ts`). Power budget gate (`powerBudget.test.ts`). Partly: failed saves are reported, not crashed (`save.test.ts`), but there is no test for a failed asset download.
- **Gameplay.** Remembered move (`rememberChoice.test.ts`). Item target list shows each Pokémon's preview (`itemPreview.spec.ts`). Hyper/Overdrive explain trigger, effect and limit and wait for Continue (`hyperOverdrive.test.ts`, `hyperExplain.spec.ts`). Transformations together and reverting (`transformCheck.test.ts`, `milestone8_5.spec.ts`). Legendaries kept out of ordinary wild fights (`legendaryCheck.test.ts`, `rarity.test.ts`). Mega signature moves: all 142 built (`megaMoves.test.ts`).
- **Diversity.** Wild repeats halved (above, `variety.test.ts`). Egg tiers differ (`eggPools.test.ts`). Trade pools vary (`tradePools.test.ts`). Trainer signature sets and fixed boss teams (`trainerIdentity.test.ts`, `trainerTiers.test.ts`).
- **Difficulty.** Smarter trainer AI (`opponentAi.test.ts`, `trainerAiKo.test.ts`), sharper bosses and multi-phase legendary bosses (`bossStrategy.test.ts`, `legendaryCheck.test.ts`), scouting before bosses (`services.test.ts`, `camp.test.ts`). Partly: "no stat inflation" is held by the power budget, not a direct test. Whether ordinary battles feel more engaging needs a human playtest.
- **Presentation.** Every transformation has its own cutscene (`transformAnims.test.ts`), mechanic messages (`battleInfo.test.ts`), screens fit every window size (`screenSizes.spec.ts`), legendary briefing (`legendaryEvent.spec.ts`). Partly: "rare discoveries feel exciting" and "visual identity" are taste and need a human playtest.

Left for Kice: a hands-on playtest of a full run (the "feel" items above), and whether rivals should be harder.
