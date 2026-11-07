# Story: Starter arcs (Signature II) and partner binding

Status: supported for all 76 Remembrance lines (Story Run only).

## What it does
- Vulpix and Psyduck are now Remembrance lines too (director, 2026-11-07; Familiar, quiz pool), each with signature moves
  (Six-Tail Flicker, Will-o'-Lantern; Headache Burst, Worry Wave). That makes 76 lines and 228 signature moves.
- Every Remembrance line has a 3-scene Starter arc, `arc_rm_<line>` (`src/data/story/starterArcs.ts` expands
  `starterArcs.json`; text in `text/starterArcs.en.json`; source table `tools/story/starter-arcs.tsv`,
  rebuild with `node tools/story/build-starter-arcs.mjs` then `npm run data:story`).
  1. Act 2+: what the partner struggles with. 2. Act 3+: the turning point; choose "Stand beside it" or "Trust it to face this
  on its own" (flag `sa_<line>` = together / trusted). 3. Act 4+: its own answer (a memory).
- The arc plays next to any backstory for the run's own starter line only (condition `starter_line`), at Stops the backstory leaves
  free and at the quiet Stops between backstory scenes, so every backstory ending stays reachable. Each beat adds Resolve Charge (S7); finishing it lets Signature II be learned at a Recovery stop with Heartbond 7.
- Fix: Story Runs never set the Heartbond partner or the starter line, so Heartbond, Feats and signature moves never switched on
  in real play. `ensureStoryRun` now binds the starter as the partner and names its Remembrance line (once, no RNG).

## Tests
`tests/unit/storyStarterArcs.test.ts`: all 74 arcs and their text, a whole run for every backstory plays the starter's 3 scenes in
order, both choices, same seed same scenes, save round trip, Signature II after the arc, a starter outside the 74 lines gets none.

## Limits
- Story Run starters still come from the old starter pool, so some starters (Vulpix, Geodude, Growlithe, Psyduck...) are not
  Remembrance lines (Geodude, Growlithe...): they get Heartbond and Feats but no Starter arc or signature moves.
- The arc uses the species name, not the nickname. One shared choice pair for all lines.
