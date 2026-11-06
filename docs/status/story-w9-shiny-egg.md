# Story Overhaul W9: Max Luck shiny egg

Done: `src/core/shinyEgg.ts`. A run whose effective Luck is at the cap (qualifier B, Kice's answer) is given one guaranteed-shiny egg at its first stage start, once per run (`itemCounters['shiny-egg']`, no save bump). Species: uniform over wild-eligible first-stage species (regional and alternate forms count, never legendary-like), drawn from `${seed}::shiny-egg`. The shiny is forced (no roll, shiny meter and chain untouched). Tier comes from the "Regional Egg" origin weights; hatch distance `balance.shinyEgg.left` (6 stages). It hatches through the normal egg path, which already counts a shiny found.

Limits: no cosmetic egg looks (golden/rainbow...), no sparkle on the egg screen, no variant-rolled-at-hatch handling (variants are their own ids). Qualifiers A (needs dex-size Shiny Charm) and C are not built.

Tests: tests/unit/shinyEgg.test.ts. Track W done after this (W2 and W4 were other threads).
