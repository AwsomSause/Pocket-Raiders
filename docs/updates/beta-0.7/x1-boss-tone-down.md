# X1: late bosses toned down

- **Player gets:** Gym Leaders, Elite Four, Champions and Rivals past level 40 deal less damage the higher their level (0.8% less per level above 40, down to 35% of normal damage at level 120 and up), and a boss can no longer raise one stat more than +1 stage (no stacked Dragon Dances). Boss gear changes: no Life Orb in the level bands or competitive gyms, boss AI sharpness cut by about 40%, training one stack lower from level 201.
- **Save:** none. New balance field `lateBoss` (default off when absent), no save change.
- **Limits:** raids and non-boss trainers are unchanged. This is a large cut (at level 100 a boss hits for about half) tuned against a bot that is 40 levels above the highest foe it has met; a player at par will feel it more. Tune with three numbers in `src/data/balance.json` `lateBoss` (`fromLevel`, `damagePerLevel`, `minDamageScale`) and `maxBoostStage`.

## Sim (24 Full-campaign runs, bot +40 levels, deterministic: `node tools/playtest.ts 0 24 out.jsonl --deep --heal --full --par=40 && node tools/late-report.mjs out.jsonl`)
Region the run ended in (index 0 to 9), 0 cleared in every case:
- Before (beta-0.7): 3, 4, 4, 9, 3, 1 (deepest region 5). Runs reaching region 4 or later: 4 of 24.
- Gear/AI tone-down only: 1, 4, 8, 9, 2. No change.
- Damage scale from level 100, cap +2 stages: reached region 4+: 6 of 24, deepest region 8.
- Damage scale from level 50, 0.4%/level, floor 45%: region 4+: 7 of 24.
- **Shipped** (from level 40, 0.8%/level, floor 35%, cap +1 stage): 1, 4, 2, 4, 4, 3, 1, 1, 1, 3. Region 4 or later: 13 of 24, and 3 runs reached the last region (index 9). Still 0 cleared: the bot lacks setup, counters and gimmicks.
