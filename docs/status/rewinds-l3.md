# Rewinds (Beta 0.7, INSTRUMENTALITY L3)

The Time Keeper's rewind, built as the engine piece the Dialga, Celebi and Time Keeper blessings will call (`src/core/rewind.ts`, schema `src/core/rewindSchema.ts`). Off by default: Settings > "Rewinds (test)" turns it on for new runs (once per stage, until the Legendary Blessings grant it instead).

- **Run snapshot** at every stage start (`startStage` -> `takeStageSnapshot`), **battle snapshot** at every turn start (`takeTurn` -> `takeTurnSnapshot`), stored as small patches chained from the stage snapshot in the optional `run.expansion.rewind` block (no save bump).
- **Restore is exact:** everything returns to the chosen turn start except the RNG streams, which stay live, so no roll repeats and the rewind itself rolls nothing (Kice's "made afresh"). Checkpoint and VS Recorder copies leave the snapshots out and carry the live block over.
- **Player:** a "Rewind" button in singles battles (1 to 5 turns back, `balance.rewind`), and a wipe is turned back first in the rescue order (before VS Recorder, Safety Net, checkpoints).
- **Rite API:** `rewindStage(content, run, { keepTeam })` goes back to the stage start (Dialga's Rite keeps levels/stats/moves/species); not wired to a blessing yet.
- Tests: `tests/unit/rewind.test.ts`; fuzz `node tools/bughunt/fuzz-roundtrip.ts 0 10 --rewinds` (every rewind checked exact, straight = with reloads).
- Limits: no blessing grants rewinds yet (L1/L2); no rewind in doubles/triples UI (the wipe rescue still works); the stage snapshot is one extra copy of the run in the save while on; Celebi's "revisit an earlier stage" needs older stage snapshots (not kept).
