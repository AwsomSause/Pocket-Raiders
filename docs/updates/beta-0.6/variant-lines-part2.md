# Variant lines in battle (E1, part 2)

**Player gets:** nothing visible until the Kanto slices spawn special Pokémon. Battle engine now supports five variant lines: Tagged (Kanto), Dark Ball (Johto), Tidebound and Cinderborn (Hoenn), Preserved (Alola), with announcements in the battle log.

**Save:** none bumped. `battle.extra.variants` is a new defaulted field; old battles load with an empty map (tested).

**Limits:** nine lines not wired yet (assigning one throws). Kanto signature traits not built. Two script rules changed by decision: Cinderborn gives +1 Special Defense in sun (not +1 Defense; sim 51.2%), and Preserved's first-hit cut is 20% (not 25%; plan's cap wins). All wired lines are under 60% in the 5,000-battle sim. No special Pokémon spawn in runs yet. Details: `docs/status/variant-lines.md`.
