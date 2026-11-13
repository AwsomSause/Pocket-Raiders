# Beta 0.6 T1: Triple Battle engine

**Built:** `src/core/battle/triples.ts` (spots, reach, Shift, centring, setup) and the shared turn code in `doubles.ts`, which now reads 2 or 3 spots from the battle. A triple battle is `battle.doubles` with a `trio` block; `resolveDoublesTurn` / `startDoubles` run both formats.

**Rules:**
- Spots 0 left, 1 centre, 2 right as seen on screen, both sides; spot n faces spot n.
- Ordinary single-target moves reach adjacent foes (edges can't reach the far edge) and adjacent allies. Long-range moves (`LONG_RANGE`: flying and pulse moves) reach anyone.
- Spread moves hit adjacent Pokémon only; 0.75× when they hit more than one (as doubles).
- Shift: an edge Pokémon trades places with the centre one, after switches/items and before moves. One per turn.
- Ally Switch trades the two edges; it fails in the centre.
- Intimidate reaches adjacent foes; Healer each adjacent ally; Follow Me / Lightning Rod only pull moves that could reach them.
- An attack with nobody in reach fails. Fainted spots refill left to right (trainer automatically; the player one at a time).
- Centring: one Pokémon left per side on opposite edges, both move to the centre.

**Tests:** `tests/unit/triples.test.ts` (26: targeting table for every position, spread, Shift, Ally Switch, refill order, centring, determinism, save round trip). All doubles tests and `story.test.ts` fingerprints unchanged.

**Limits:** not reachable in a run yet (T3 adds the `triplesOnly` rule and trainers); the battle screen still draws doubles only (T2). The foe AI never Shifts. A status move with nobody in reach still runs (only attacks fail). The W1 combo attack still needs exactly two attackers. Run-level helpers that read `doubles.player.index` (companion support, story hooks) see only the main-field Pokémon in triples; T3 should switch them to `fieldUids`.

**Save:** no version bump. `doubles.trio` is optional and `refill` / `aims` widen to spot 2, so every old save loads (tested).
