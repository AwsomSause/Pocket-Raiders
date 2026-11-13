# Variant lines in battle (E1, part 2)

**Player gets:** nothing visible until the Kanto slices spawn special Pokémon. Battle engine now supports five variant lines: Tagged (Kanto), Dark Ball (Johto), Tidebound and Cinderborn (Hoenn), Preserved (Alola), with announcements in the battle log.

**Save:** none bumped. `battle.extra.variants` is a new defaulted field; old battles load with an empty map (tested).

**Limits:** nine lines not wired yet (assigning one throws). Kanto signature traits not built. Cinderborn measures 61.3% in the 5,000-battle sim (target 60%), Preserved's 25% cut is above the 20% line cap: both flagged in `docs/status/variant-lines.md` for a director call. No special Pokémon spawn in runs yet.
