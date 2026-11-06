# Overhaul slice 5: run log and Moment Director

- Overhaul slice 5 (THE OVERHAUL.md rule 4, rare stays rare): `src/core/story/momentDirector.ts` adds a per-run limit on story moments, on top of the existing per-battle limit (story.json `majorCuesPerBattle`). Each tier (minor, major, landmark, the pack's moment budgets) has `perRun` (null = no cap) and `cooldownBattles` in `balance.json` `moments`. API: `momentAllowed`, `momentsLeft`, `noteMoments`, `momentsShown`.
- Wired today: cinematic story cues ("major") go through it in `story/hooks.ts`. A refused moment still happens; it is told as a plain line, so battle results never change (tested: the same battles are fought with a cap of 2 as with none). Landmark is 3 per run, at least 5 battles apart, ready for the pack's landmark moments (Living World slice 24).
- Run log: the story layer's `run.story.events` and `run.story.flags` already are the one shared log of what happened in a run; the director keeps its counters there under `md:` keys, so there is no save change.
- Measured (8 autoplay runs): 0.5–0.85 cinematic moments per battle. Major is left uncapped until the director decides; slice 29's 100-run check tunes all tiers.
- Tests: `tests/unit/momentDirector.test.ts` (cap and cooldown, uncapped boundary, cap 0 = off, a capped run vs an uncapped one with the same seed).
