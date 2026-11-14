# X1: test bot plays the late game

- **Player gets:** nothing in the game. The test bot (`--deep`) is stronger and can now play the whole 9-region Full campaign, so late-game balance can finally be measured.
- **Save:** none.
- **Limits:** the deep bot still cheats on strength: every party member is lifted to (highest foe seen + `--par`) levels on the map, with boss gear and sweep guard off. Its battle play is simple (no gimmicks, no status plans). Numbers show where bosses wall a team that is `par` levels over, not how a real player does.

## What changed (test tools only)
- `tests/unit/autoplay.ts` (strong bot only): fills the party to 6 (takes any catch while under 4, BST 280+ after), throws its best ball in stock at up to 2/3 foe HP, revives in trainer fights, never heals more than twice in a row (heals smaller than foe hits only stalled fights).
- `tools/playtest.ts`: `--full` (Full campaign, 120k steps), `--par=N` (default 25).
- `tools/late-report.mjs`: summary of where runs ended.

## Numbers
3-region Multi-Region, par 25, 31 runs: cleared 4 (13%, before the bot changes none reached the end); 9 died in region 1, 13 in region 2.

Full campaign, par 40, 24 runs, no errors or stuck runs, 0 cleared. Runs ended in: R1 13%, R2 17%, R3 17%, R4 (index 3) 38% (the wall: killers Misty, Byron, Sabrina, Guzma at about L155-196 vs party L205-245), R5 13%, R6 4% (Sada, L254 vs L300). Deepest: region 6 of 9.

Reproduce: `node tools/playtest.ts 0 24 out.jsonl --deep --heal --full --par=40 && node tools/late-report.mjs out.jsonl`

Follow-up: late-game gym leaders hit hard enough that par +40 still loses 38% of runs in region 4; a boss-tanky check and a bot that uses gimmicks are the next steps for the X1 balance pass.

## Tried and dropped
Weighting moves by the attacking stat and preferring attackers when building the team made the 24-run Full sim worse (14 of 24 runs ended before region 4 instead of 11, noise-level but not better), so it is not in. Diagnosis of the region 4 wall: foes hit for 100%+ of a bot Pokémon's HP (Dragon Dance Gyarados, Aqua Tail 540-750 vs ~540 HP) while the bot deals 10-45% of a foe's HP, even 44 levels ahead. That is bot play (no setup or counters, random catches) as much as boss numbers, so no balance change is proposed from this data.
