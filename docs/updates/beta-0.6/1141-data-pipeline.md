# Data pipeline (F4 + E0)

**Player gets:** nothing yet. The structured Beta 0.6 data (143 characters, 110 special Pokémon, 58 special Shadows, 12 Apex, 80 event ids, 20 raid ids, plus the world-state track, Siege Map and Extended Cut phase list for the finale and all nine regions) is now built from the scripts and checked, so the Kanto saga slices can read it.

**Save:** none.

**Limits:** structure only; dialogue and rules text stay in `tools/sources/expansion/`. Rebuild with `npm run data:expansion`. New check `expansion-data-gaps` in `report:check`. Details: `docs/status/expansion-data-pipeline.md`.
