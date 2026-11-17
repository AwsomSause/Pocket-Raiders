# Region 1 story (Kice 2026-11-16)

"Force Pidgey's Resolve, Poli-Pond, or Flight North to appear in region one, differing which event per run."

- **Rule** (`src/core/co/regionOneStory.ts`): each run picks one of the three from its seed (own stream `<seed>::region-one-story`, no existing roll moves). Runs without story events on never pick Pidgey's Resolve (it needs them).
- **The picked story is promised in Region 1**, whatever region that is: its opening is placed before everything else on every node of one column (`promised` in `planCoStage`), so no route misses it and the stage's event budget cannot drop it.
  - Pidgey's Resolve: stage 1, as before.
  - Poli-Pond: from stage 2; it prefers a water stage, and from the region's third stage it stops waiting for one.
  - Flight North: from stage 4 (its check). As the picked story the theft is certain in Region 1 (the roll is still taken, so the stream stays in step). In Kanto the Vermilion canon space plays it.
- **The other two wait** while the run is in Region 1 (`regionOneHeld`, read by `eligibleEvents` and the Kanto canon placer) and open as usual from Region 2.
- Tests: `tests/unit/regionOneStory.test.ts` (pick, waiting, on the map over 18 seeds, certain theft); `skyRivalry.test.ts` and `greenneedle3.test.ts` adjusted.
- Limits: the pick is by seed, not a rotation that remembers earlier runs (run-memory rule), so the same story can come up twice in a row. A run that ends before Poli-Pond's stage 2 or Flight North's stage 4 does not reach its story. Before this, Pidgey's Resolve and the Flight North check showed in most runs' Region 1; now only the picked one does.
