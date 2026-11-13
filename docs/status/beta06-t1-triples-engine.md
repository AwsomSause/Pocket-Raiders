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

**Limits:** in runs only behind `balance.triples` and the Triples Only rule, both off until the screen exists (T3, `beta06-t3-triples-in-runs.md`); the battle screen still draws doubles only (T2). A status move with nobody in reach still runs (only attacks fail). The W1 combo attack still needs exactly two attackers.

**Save:** no version bump. `doubles.trio` is optional and `refill` / `aims` widen to spot 2, so every old save loads (tested).

**Foe AI (follow-up PR):** an edge foe with no player Pokémon in reach and no long-range attack Shifts into the centre, but only when the centre is free or held by a partner with no attack, so two foes never swap back and forth. In triples a foe never picks a move that can't hit anyone while another move can. Neither rule uses random numbers. Doubles are unchanged: every move reaches there, so the move list the AI picks from is the same. Limit: an edge foe that can't reach, standing next to a centre partner with attacks, still wastes its turn.
