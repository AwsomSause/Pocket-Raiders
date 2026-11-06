# Story S8: Relationships

Added `src/core/story2/relationships.ts`: seven attributes, 13 stages (8 positive, 5 negative), gate events for Trusted/Close/Devoted/Hostile/Nemesis, hysteresis of 5 with a one-Node confirm, action deltas table, end-of-Node drift, ripples to linked characters (friend 20%, family 30%, rival -10%, faction 20%, cap 10), memories and one callback per greeting, consequence ids, and end-of-run fold helpers.

- Cast record in `run.story.v2` gained `flags, gates, mem, scenes, pending, last` (all defaulted, so old v40 saves load; no save bump).
- No cross-run rival memory: `castTrustFlags` skips rivals.
- Not wired yet: `foldCastIntoProfile` / `castTrustFlags` into finalizeRun, and event code calling `change`. Those come with the story event slices.
- Tests: `tests/unit/storyRelationships.test.ts` (12).
