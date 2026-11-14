# E9c: Alola story traits (Hype Man, Reluctant Hand) behind a setting

**Player gets:** With the new `expansion.storyTraits` setting on (off by default, read when a run starts), the Skull Trio in "Yo" has Hype Man (the next foe's first move hits 20% harder after one is beaten) and Eldes in "The Consultant" has Reluctant Hand (his Pokémon never land a critical hit). Off means old seeds play exactly as before.

**Save:** none. `battle.extra.storyTraits`, `run.expansion.storyTraits` and the setting are all optional with defaults; the timeline schema carries the flag.

**Limits:** No Settings screen switch yet (the setting exists in the settings file only). Hype Man applies to any foe after the first, not strictly "the one after a beaten foe". Reluctant Hand's second half (never a move that would KO a Pokémon under a quarter HP) is not built. Old Habits (Paldea) is not built: it only matters in doubles/triples and the Peon fight is a single battle. Files: `src/core/expansion/storyTraits.ts`, hooks in `engine.ts` (crit and power) and `events.ts` (assign); test `tests/unit/storyTraits.test.ts`.
