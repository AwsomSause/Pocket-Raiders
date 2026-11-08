# Save generator

`node tools/savegen.ts <spec.json | preset> [out.json]` builds a file for **Settings > Import save from a file**, then press **Continue**.
`--list` shows presets (`tools/savegen/presets/*.json`), `--schema` prints every field as JSON Schema. A spec can say `"preset": "name"` and override it.
Nothing is written unless the game's own importer accepts it; every problem is listed at once.

## Fields (source of truth: `SaveSpecSchema` in `src/save/saveGenerator.ts`)
- **Run:** `seed`, `trainer` (nate by default, or hilda), `mode`, `difficulty`, `modifiers`, `deathBlock`, `region` (1-based), `stage` (1-based), `money`, `items`, `badges` ("auto" or ids), `gimmickUses` (`mega:<stone>`, `dynamax`, `tera`), `storyFlags` (story and rival flags), `levelCapCheck`, `run.patch`.
- **Party (up to 6):** `species` (the form is the species id, e.g. `meowstic-female`), `level`, `gender`, `shiny`, `nature`, `ability` (id or "hidden"), `moves`, `held` (item id(s) or `"mega-stone"`), `ivs` (number or per stat), `evs` (per stat or "max"), `friendship`, `nickname`, `teraType`, `hpPercent`, `status`, `patch`.
- **Profile:** `id`, `bankCredits`, `bankTier`, `researchPoints`, `researchTree`, `prestige`, `contacts`, `candies`, `candyPerks`, `licenses`, `titles`, `unlockAllTrainers`, `unlockedArchetypes`, `dexAll`, `remembrances`, `protagonistName`, `patch`.
- **Random fill:** blank nature, ability, moves and IVs are rolled from the seed (`"random": false` = plain defaults). Same spec, same file.

## Adding a field
Add it to `SaveSpecSchema` and apply it in `buildMon`, `buildProfile` or `buildRun`. Until then, `patch` sets any path, e.g. `"patch": {"stats.battlesWon": 77}`.
