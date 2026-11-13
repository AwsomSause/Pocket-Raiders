# Variant lines as battle hooks (Beta 0.6 slice E1)

State: `battle.extra.variants` (uid -> line + counters, saved with the battle; old battles load with `{}`). Rules: `src/core/expansion/variantLines.ts`. Engine hooks (`engine.ts`): entry (`enterExtras`), damage taken, forced switch (`forceOut`), status (`tryInflictStatus`, `canGetStatus`), accuracy, end of turn (`endTurnMon`), item moves. Whoever spawns a special Pokémon calls `assignVariant(battle.extra.variants, uid, line)`; nothing spawns them yet (the Kanto event/track/climax slices do).

| Line | Region | Status |
|---|---|---|
| Tagged | Kanto | wired, tested |
| Dark Ball | Johto | wired, tested |
| Tidebound, Cinderborn | Hoenn | wired, tested |
| Preserved | Alola | wired, tested |
| Patchwork, Snagged, Spiritless, Overclocked, Couture, Tagged-Up, Overcharged, Loud, Tuned | various | NOT wired: `assignVariant` throws for them, so none can silently do nothing |

**Balance sim** (`node tools/variant-sim.ts`, 5,000 mirror battles each, identical Blastoise, the line on either side, weather a third rain / a third sun / a third none; gate 60%): baseline 50.0%; Tagged 53.3%; Dark Ball 45.4%; Tidebound 51.4%; Cinderborn 51.2%; Preserved 57.1%.

**Director decisions (via coordinator, 2026-11-13):** Cinderborn gives +1 Special Defense in sun (the script says +1 Defense; that measured 61.3%). Preserved's first-hit cut is 20% (the script says 25%; the plan's 20% cap wins).

Kanto's nine signature traits (Seat at the Table, Drill Through, ...) are not built yet.
