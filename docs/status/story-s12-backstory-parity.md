# Story S12: backstories 2 to 5 parity and ending-grid check

- The four modules (Ex-Criminal, Champion, Aether, Hisui) plus Viridian were already authored in S1 (`story-s1-bs-*.md`); S12 adds the proof: `src/core/story2/endingGrid.ts` (`endingGridReport`: no gap, every ending reachable; `parityAudit`: intro, recurring NPC with 3+ scenes, 3+ branching events, 4+ endings, echoes, complication modifier, exclusive item, pool, Remembrance) and `tests/unit/storyBackstoryParity.test.ts` (all five pass the Module Validator and the audit).
- Limits: the S5 module loader is not built yet, so none of the modules can be played end to end; Journal/Archive snapshot data is not part of S12.
