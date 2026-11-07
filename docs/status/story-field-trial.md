# Beat 9: Field Trial (design O.4)

The first Story Run after a played prologue opens with the Field Trial: a scripted spar with the main rival on the station lawn. It teaches moves and type matchups (a type note), switching, items (a free Potion), Heartbond and a staged Impossible Feat, then the rival reacts and you choose whether to keep dramatic moments. Quick Start plays turns 0, 1, 3 and 7 and shows items and Heartbond as tip cards.

- Script, cast, reactions: `src/core/story2/fieldTrial.ts` (fixed table, no gameplay RNG, can't be lost). Screen: `src/scenes/FieldTrialScene.ts`, started from MapScene.
- Writes the rival's first Respect/Rivalry/Suspicion (design table) once, `facts['trial.done']`, and `profile.story.prologue.beatsSeen` gets `field_trial` (plays once per save; skipped prologues and later runs go straight to the first Stop).
- Tests: `tests/unit/storyFieldTrial.test.ts` (6), `tests/e2e/fieldTrial.spec.ts` (five teaching beats in order).
- Limits: the screen is a light battle view, not BattleScene; no move animations, ball throw or cries yet. The Trial starts once the run exists (after Trainer Select and the Desk), not before them.
