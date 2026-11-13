# Kanto Canon Spaces (workstream 18)

Slice 1 (this): `src/core/expansion/canonSpaces.ts` (schema, `buildTownMenu`, `canonSpaceGaps`), `tools/build-canon-spaces.ts` -> `src/data/expansion/canonSpacesKanto.json`, tests in `tests/unit/canonSpaces.test.ts`, gate `canon-spaces-gaps`.

Next slices, one PR each: run wiring (menu on town entry, `kanto.*` flags on the run record, needs the next free run save version), then the Pseudo Stages town by town (Pewter first), events and shops, Hidden Village and S.S. Anne tables, Flight North with the run-end rescue, route events, Sevii.

Built so far (state at `run.expansion.canon`, no save bump): Pewter events, Veridian Forest, Mt. Moon, and Cerulean (Bridge, Hidden Village, Squirtle Squad, Damian, Burglary, Cold Nights Rain, Bill, Day-Care). Cerulean Cave comes with the Indigo thread.
Celadon City (Department Store, Game Corner, Mansion, Eeveelution Brothers, Tea, Perfume Heist, Rooftop) is built; see docs/updates/beta-0.6/celadon-canon.md.


Lavender Town built (interlude-3, shown on the Stage 4 map): Pokémon Tower, Fuji's House, Fan Club, Rock Tunnel, Power Plant, Volunteers. See docs/updates/beta-0.6/lavender-canon.md.
Cinnabar Island built (Lab, Mansion, Seafoam, New Island, Volcano); see docs/updates/beta-0.6/cinnabar-canon.md.
