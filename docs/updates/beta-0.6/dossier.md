# Dossier (E1)

## Player gets
- A Dossier on the map: press **D** (or click "D: dossier") once the run has met someone from the cast. Kice's pick: Case Folders (8) with the Org Pyramid (4).
- One folder tab per team. Each case file shows the person's sprite (a dark shape where the game has no sprite yet), a mark (canon / what-if / original), a status (at large / beaten / turned / ally), rank and tier, the "Overheard" voice line, a note, and their ace (shown as ??? until you have beaten, turned or befriended them).
- The chain of command (T0 to T7) for the open folder; click a name to open that file. Left/Right changes folder, Up/Down changes person, D or Esc closes.

## Save
- None bumped. New optional `run.expansion.dossier` (`sc.*` id to status and when first met). Older runs have none and load untouched. No RNG used.
- New event effect `{ "kind": "cast", "id": "sc.…", "status"?: … }` meets a character or changes their status; meeting twice changes nothing, an unknown id does nothing.

## Limits
- Nothing in shipped event data uses the `cast` effect yet, and story raids are not offered on the live map, so in normal play the Dossier stays empty (and D does nothing) until the event and raid slices add `cast` effects. Raids may write only siege/apex/cast/cut/raids by design, so they were not given a Dossier write.
- Sprites exist for only a few characters; the rest show the dark shape.
- Checked by unit tests (`tests/unit/dossier.test.ts`) and the browser test `tests/e2e/dossier.spec.ts` with a screenshot.
