# Mega Stone levels, Dynamax Band levels, Z-Ring attunement (S479, S480, S482)

Run save v38 (`gimmicks.uses`; migration 37 to 38 + test in `tests/unit/gimmicks.test.ts`). Levels come from use, with thresholds in `balance.transformations.gimmick` (levels at 2, 5 and 9 uses). Logic in `src/core/gimmicks.ts`; the battle gets it through the optional `gimmicks` field on the battle context.
- S479: each Mega Stone counts its Mega Evolutions; a Mega heals 10% of max HP per stone level when it evolves.
- S480: the Dynamax Band counts Dynamaxes; each level adds one turn to your Dynamax (3 up to 6).
- S482: a Z-Crystal's type attunes after 5 hits with damaging moves of that type this run (counted from the Pokémon's move histories); until then the Z-Ring says how many hits are left. Contexts without a gimmick record (raids, old tests) are not gated.
- S481 (Tera Orb pool): already covered by Tera Shards, which set a Pokémon's Tera Type; no change.

Limits: levels are per run and shown only in battle messages (no level screen yet); Mega Stone "upgrade" is by use, not by spending. Z-Moves keep the bond rule (S174) and add attunement on top.
