# Triple Battle engine (T1)

**Player gets:** nothing visible yet. The rules engine for 3-on-3 battles is in: positions, edges that can't reach the far edge, spread moves on adjacent Pokémon, Shift, Ally Switch, refills left to right and both last Pokémon stepping to the centre. The screen (T2) and battles that use it (T3) come next.

**Save:** none. The new `trio` block in a battle is optional, so old saves load unchanged (tested).

**Limits:** foes never Shift; status moves with nobody in reach still run; the two-attacker combo stays two-attacker. Details in `docs/status/beta06-t1-triples-engine.md`.
