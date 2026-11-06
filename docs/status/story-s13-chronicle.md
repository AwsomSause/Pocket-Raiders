# Story S13 (4 of 8): Run Chronicle

- `core/story2/chronicle.ts`: `buildChronicle` makes one record per finished Story Run (run id, seed, title, backstory, partner, rival, antagonist, stops done/planned, setbacks, final relationship stage of everyone met, up to 12 scenes seen). `recordChronicle` is called from `finalizeRun`, once per run id, newest last, 40 kept. Classic runs write nothing. Nothing reads a Chronicle back into gameplay.
- `profile.story.chronicles` now has a real schema (`ChronicleRecordSchema`); it was an empty array of unknown, so no save bump and old saves load.
- `chronicleView` + a new "Run Chronicles" section at the top of Memories: a list (newest first) and a reader page that opens "In this telling,".
- Limits: the title is built from the theme and win/loss only (no ending or key-choice wording until endings exist); highlights are scene ids, not salience-ranked; no Compare, filter, sketches, scrapbook, run card or Replay; no Playwright test (needs a Story Run to finish).
- Tests: `tests/unit/storyChronicle.test.ts`; size-budget test in storyFoundation updated to real records.
