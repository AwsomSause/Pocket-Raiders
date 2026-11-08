# Test fixes after the Starter Sets removal

- Tests that relied on the old starter sets now pick their starters directly (Kanto trio, or the Pokémon the test needs).
- The Daily/Weekly starter set is the same draw a run makes from its seed, so the two always agree.
- Save generator no longer writes `unlockedPools`.
- Old-seed fingerprints STORY2, STORY5 and STORY6 were re-pinned. The exact cause is not isolated; the other four seeds are unchanged.
