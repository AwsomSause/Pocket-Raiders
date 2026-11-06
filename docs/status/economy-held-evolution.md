# Held-item evolution paths (S413)

A Pokémon that holds its evolution item (Metal Coat on Onix, Dragon Scale on Seadra, Up-Grade on Porygon ...) evolves by itself once it reaches level 28, and the item is used up. Using the item from the Bag still works as before.

- Rules: `heldReady` in `src/core/evolution.ts`; the item is removed in `evolveFully`.
- Data: `balance.json` `heldEvolution` ({enabled, level}); no species edits, no save change.
- Limits: only items that can be held (held-type catalog items) take part; an Everstone still stops it. A level evolution that fires at the same time keeps the item.
- Test: `tests/unit/heldEvolution.test.ts`. The old-seed story test switches the feature off.
