# Balance A: types, wilds, trainers (B1-B3)

## Player gets
- Rarer type families: 32 common Steel/Ghost/Psychic species are now uncommon, 26 common Ice/Fairy/Dragon species are now rare (a dual type takes the rarest). You meet them less often early on.
- Wild variety: the same Pokémon is less likely each time you meet it in a run (x0.6 per meet, x0.8 per relative). No repeats in the first 6 wild fights. Each of the first 3 stages has one "odd one out" uncommon wild fight.
- Fairer trainers: a type slot needs 8+ species or the whole theme is used; starters and rival signature Pokémon only appear on rivals and named trainers; a species line is on at most 2 ordinary trainers per region.

## Save
No version bump. Uses the run's existing `history` map (new keys `wildMet`, `trainerRegion`); old runs load with empty history.

## Limits
- Balance sim (300 runs x 40 draws): early repeats 88 -> 0, but top species / median is 6.4 (was 7.5), far from the 1.5 target. Pool shape (themes, native, dual-type weights) dominates, not repeats. Needs a follow-up in final balance X1.
- Story Run teams are interpreted as starters + rival signatures (reserved list); no other Story Run list exists.
- The old-seed fingerprint test switches the new rules off (like earlier features); no pins changed.
- Typecheck clean; full unit run: all pass except the two fixed here. Playwright and `npm run check` run in PR CI.
