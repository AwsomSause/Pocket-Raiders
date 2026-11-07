# Story: quests that unlock Rare and Exceptional starter lines

Status: supported (Story Run only). Stacked on the Starter arcs PR.

## What it does
- 13 short quest arcs (2 to 4 scenes) give the 14 Rare and Exceptional lines that had no way in an unlock route, following the
  design roster: rescue the stranded Dragonair (Dratini), the peak Alpha (Bagon), the Ironvein prototype (Beldum), three nights
  of feeding (Gible), the Hollow Choir ritual (Deino), a rain night (Goomy), the rival's training camp (Jangmo-o), guiding a lost
  Dreepy home, the Long Winter (Frigibax), the lucky egg (Togepi), the Twin Burrow (both Nidoran), the Lantern Vigil (Duskull)
  and the retired uniform (Pawniard).
- Source table `tools/story/quest-arcs.tsv`; `node tools/story/build-quest-arcs.mjs` writes `src/data/story/questArcs.json` and
  `text/questArcs.en.json`, points each line's `unlock` at its last scene, and fails if any Rare or Exceptional line has no route.
  `src/data/story/questArcs.ts` expands them into events `ev_qa_<arc>_<n>` and arcs `arc_qa_<arc>`.
- They play in any backstory at Stops the backstory and the Starter arc leave free (including the quiet Stops between backstory
  scenes), one quest at a time, at most one started per Act from Act 2. The order is a per-run string hash (no RNG stream).
- The last scene unlocks the line; it is folded into the profile's Remembrance Archive when the run ends.
- Fix: Poliwag's unlock hint pointed at an event that does not unlock it; it now names `ev_childhood_map`.

## Tests
`tests/unit/storyQuestArcs.test.ts`: every Rare and Exceptional line has a real unlock event, quests play whole and in order in
every backstory (at most one active, at most one per Act), a finished quest unlocks its line in the profile, same seed same scenes.
The S20 acceptance tests (every backstory ending reachable) still pass.

## Limits
- Simplified from the design: no Courage 65 or Trust 70 checks (those traits are not tracked in a run yet), and Gible's
  "feed it across 3 runs" is 3 nights in one run.
- Quest scenes are narration only (no battle is forced); the Alpha and grunt fights are told, not fought.
