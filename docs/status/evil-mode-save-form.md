# Evil Mode: the save form (smaller saves)

**Why:** a six-region Evil Mode save went over the 300 KB budget (Part 30 section 14): 5 of 10 seeds were over, up to 367 KB, and slices 17, 18 and 21 add more. The Cards and the Log kept full text, written again and again.

**What:** `src/core/evilMode/saveForm.ts`. Only the stored copy changes; the block in play is the same object every reader uses.
- Every string of 4+ characters that appears twice or more goes once into a table; each use becomes a short id. A Card's twelfth field and its Log line, the Card fields every job repeats, place names: each written once.
- Every list of 3+ objects (Log lines, Cards, holdings, ventures) is written as its keys once and one row of values each.
- Lossless and deterministic. Written by `SaveManager.saveRun` / `saveReplay` (`runToSaveForm`); read back in `migrateEvilBlock` (`fromSaveForm`) before any migration.
- **No block or run version bump:** the save form is told apart by its shape (`¤t`), and a loose block from an older save loads exactly as before (tested). Slices claiming v21/v22 are unaffected.

**Sizes (six-region "mix" autoplay, 12 seeds):** worst 353 KB loose -> 207 KB saved; pinned seed 299 KB -> 157 KB. Encode about 5 ms, decode about 2 ms.

**Tests:** `tests/unit/evilModeSaveForm.test.ts` (round trip, same text each time, odd strings, old loose block, run wrapper, missing id is an error); `evilModeRegions2.test.ts` checks 12 seeds, each under 250 KB; `evilModeCrossing.test.ts` measures the save form; `evilModeShell.test.ts` checks the stored run holds the packed block and reloads equal.

**For later slices:** measure size with `JSON.stringify(toSaveForm(block))`. Nothing else changes for you.
