# Rally: anti-sweep stacking (B4)

## Player gets
When one of your Pokémon keeps knocking out a boss's or rival's team, each new foe braces: +1 Defence and Sp. Def at the first streak (2 KOs), +2 once the streak doubles (4 KOs). A Rally never lifts a stat past +4. This replaces the old boss sweep guard (#1135), not a second one; it no longer raises Speed.

## Save
No change. Numbers live in `balance.json` `trainerAi.sweepGuard` (`maxStages: 2`, `ceiling: 4`), defaults fill in for old data.

## Limits
- Level ceiling (foe level at party average +2) is not built; no foe level rules were touched.
- Sim (120 mixed runs each, before the boss item budget vs now): gym leader fights went from 17.3 to 19.0 turns on average (+10%), rivals stayed about the same (16.1 vs 15.0). The bot's gym win rate fell from 64% to 56%, but the sample is small. Not a slog, so no tuning yet; a bigger sim is worth running before release.
