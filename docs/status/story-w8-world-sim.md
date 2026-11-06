# Story Overhaul W8: world simulation layer

Done: `src/core/worldSim/tick.ts` is the one coordinator (design 14.10). The rival, evil, weather and roamer simulators already ran once a stage and are left alone; the tick runs right after them and adds the new actors:
- Legendary disturbance: a roamer in the stage may set a disturbance flag (and a rumor).
- Mystery trainers: a hidden trainer "enters" a dungeon. Entering that dungeon later finds them once (+3 Research, a story moment). Max 4 waiting.
- Leaders hear of the player: after the first badge, the stage's leader gets a one-line "heard" flag and rumor.
- Rumors written from the above (max 12); `worldFor(run)` returns at most 3 unshown hints without rolling or writing.

Safety: one tick per stage (ledger id `wl:<region>.<stage>`); every roll uses its own named stream (`wl:legend`, `wl:mystery`, `wl:rumor`), so no existing roll moves; cap of 40 records per tick; test fails above 20 ms.

Save: `story.sim` is optional inside the story state, so no version bump.

Data: `src/data/worldSim.json` (chances, budgets, names, rumor text). Status: limited.

Limits:
- Hints from `worldFor` are not yet shown at map nodes (the data is ready); rare-find input to `stagePlan` is not wired.
- Rival, evil and roamer steps still run from `startStage` in their old order; the tick does not re-run them.
- Event-priority ties and dungeon-pick streams are unused (W5/W6 use their own).

Tests: tests/unit/worldSim.test.ts. Next: W9 (shiny egg).
