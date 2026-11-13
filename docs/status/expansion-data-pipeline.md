# Expansion data pipeline (Beta 0.6 slice F4 + E0)

**What it is.** `npm run data:expansion` (`tools/build-expansion.ts`) reads the ten expanded scripts in `tools/sources/expansion/` (the Cipher/roaming cast plus the nine regions) and writes `src/data/expansion/*.json`. Never edit the JSON by hand; edit the script text and rebuild. `--check` fails if a file is stale (a unit test runs it).

**Files** (shapes in `src/core/expansion/data.ts`, Zod; loaded and parsed once by `src/data/expansion/index.ts` as `expansionData`):

| File | Rows | From |
|---|---|---|
| `characters.json` | 143 | E2 cast tables |
| `specialPokemon.json` | 110 | E3 special Pokémon (14 variant lines) |
| `specialShadows.json` | 58 | E4 special Shadows (12 Apex) |
| `variantLines.json`, `signatureMoves.json` | 14, 12 | line rules, signature Shadow moves |
| `events.json`, `raids.json` | 80, 20 | `xe.*` event ids, `pr.*` raid ids (ids only; the event text is for the event slices) |
| `tracks.json` | 10 | E1.2 world-state track, steps 1 to 5 (Sinnoh step 3 has 3a/3b/3c) |
| `siege_maps.json` | 10 | E7 Phase 0b: districts, held-if, if-lost |
| `climax_extended.json` | 10 | E7 Extended Cut phase table |
| `apex.json` | 12 | XD001 to XD012 with their Phase 6 format and timer |

Ten = the Cipher finale (`region: any`) plus nine regions. Kanto's saga slices (13 to 18) read the `kanto` rows.

**Gates.** The build stops on: bad ids, unknown team, duplicate id, a Pokémon name the game does not have, bad Shadow tier/ability/move, a reference to an undefined id, counts other than 143/110/58/80/20/12. `report:check` has a new check `expansion-data-gaps` (baseline 0). Tests: `tests/unit/expansionData.test.ts`.

**Limits.** Prose bodies (dialogue, event text, raid detail, Phase 1 to 8 rules) stay in the scripts; this data is the structured skeleton the engine reads. Event and raid rows are ids only. Fixed rival lines from INSTRUMENTALITY_fixes.zip (`rival_species_lines.json`) belong to the rival slice, not here.
