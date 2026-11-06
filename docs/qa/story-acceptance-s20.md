# Story S20: acceptance report

`npm run sim:story -- 20` does two things (seeds are fixed, so a run repeats exactly):
1. **Fight sim:** 20 Story Runs per backstory (100 in all) with the smart test bot, Orrery Circuit.
2. **Ending sim:** 300 Story Runs per backstory where every Story Stop plays without fights and each choice is answered at random; the Champion is won, lost or neither (a third each).

## What the first run (PR #921) found, and what this PR fixed
Before: only Viridian could reach more than one ending; Ex-Criminal, Champion's Heir and Aether always fell through to their catch-all (300 of 300 runs).

| Problem | Fix |
|---|---|
| Counters started at 0, but the design starts Redemption at 40, Humanity at 50 and Displacement at 5 (so Redeemed >= 70, Own Choice >= 70 could never happen) | `balance.story.module.starts` and `limits` (floor and cap), read by the module loader |
| Aether's hidden Premise was never rolled (its Proof ending and scene variants read it) | Premise roll added to `balance.json` (True, Partial, False, Inverted, 25 each) |
| `seen_marauders` was required by two Ex-Criminal scenes but nothing set it, so the Cass contract and Ledger Room never played and Relapse was unreachable | Set by the first Ex-Criminal scene (Old Uniform) |
| `championship_won` (Heir ending) and `final_loss` (Shadow ending) were never set | Set when the Finale plays (Champion beaten) and when a story fight is lost during the League |
| Champion's Refusal needed Legacy <= -6, but the scenes only reach -2 | Threshold now <= -2 (data; hash updated) |

## Results after the fixes
Ending shares (300 runs each, random answers, so a careful player can steer toward the rarer ones):

| Backstory | Endings reached |
|---|---|
| Ex-Criminal | Ghost 146, Reconciled 73, Redeemed 43, Relapse 38 |
| Champion's Heir | Own Name 201, Shadow 58, Heir 31, Refusal 9, Third Way 1 |
| Viridian | Reckoning 208, Listener 75, Gardener 15, Echo 2 |
| Aether | Integration 179, Proof 99, Dissolve 19, Own Choice 3 |
| Hisui | Present 108, Home 105, Bridge 87 |

- `tests/unit/storyAcceptance.test.ts` steers each scene toward and away from every grid key and proves **every ending is reachable by real answers**, each run plays exactly one ending, no scene repeats, and counters stay inside their limits. Only Hisui's Lost ending is not reached, on purpose: it is the catch-all after Home, Bridge and Present, which cover every answer once the return choice is made.
- Fight sim: 100 runs, 0 errors, 0 wins. Every run was lost early (median 11 battles, none cleared a region; 76 to trainers, 24 to wild). Rival and story losses kept the run going as designed (17 to 25 per 20 runs). The test bot is too weak for the late game, same as `sim:overhaul`.

## Balance notes for Kice (not changed)
- Rare endings with random answers: Third Way (Champion), Echo (Viridian) and Own Choice (Aether) are under 1% to 2%. A player who picks on purpose reaches them (the test proves it), but you may want easier thresholds.
- Most random runs end on the catch-all (Champion: Own Name 67%, Viridian: Reckoning 69%, Ex-Criminal: Ghost 49%).
- Only Viridian is on in `enabledBackstories`; the other four play only when chosen (`chooseBackstory`, S2). Turning them on for seeded picks is Kice's call.
- Hisui's Lost ending needs a design decision (when should it trigger?).

## Still not covered
- A full Story Run through real fights to the Epilogue (the bot cannot get past region 1); the S19 level-500 walk covers the Stops, not these endings.
- Final screenshots (no change to any screen in this slice).
