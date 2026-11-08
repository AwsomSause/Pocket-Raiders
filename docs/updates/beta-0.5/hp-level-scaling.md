# HP scales with level (x1.2)
**Player gets:** every Pokémon (yours and enemies') has up to 20% more max HP, phasing in by level 100 (about +6% at level 30, +9% at level 45). A same-level super-effective hit from a strong attacker still one-shots a typical Fire type; neutral hits take about 15% less of its HP.
**Save:** no bump (`balance.hpLevelBonus` 0.2, `hpLevelMultiplier` in `src/core/pokemon.ts`).
**Limits:** the first cut (#1092, x1.5) was lowered because it broke the super-effective OHKO. Before/after table (x1.5 numbers): `/mnt/project-files/reports/hp-scaling-before-after.md`.
