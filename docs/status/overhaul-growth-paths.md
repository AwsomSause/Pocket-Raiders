# Overhaul slice 25 (part): growth paths, first cut

A Pokémon that has proved itself over the run settles into one growth path, a small permanent damage edge (`core/overhaul/growth.ts`, numbers and switch in `balance.overhaulGrowth`: +5%, 8 KOs, 2 close calls).

- **Last Stand** (pack `last-stand`): 2 or more close calls, +5% damage under a quarter HP.
- **Striker** (pack `striker`): the single top KO count in the party (8 or more), +5% on super-effective hits.
- **Type path** (the first pack path of each of the 18 types, e.g. Fire-forged): a Pokémon of that type with 8 or more KOs, +5% damage with moves of its own type.
- Paths are given at camp rests, kept for the run (`growthPath` on the Pokémon, optional so no save bump), shown on the personality line of the info page. Run-only, no RNG.

Limits: only 20 of the 106 pack paths play, and their rules use the counters the game already keeps (KOs, close calls, types), not the pack's exact "earned by" text; the type paths use one flat bonus instead of each pack bonus. The other 86 paths need new battle counters and stay unplayed. Tests: `tests/unit/overhaulGrowth.test.ts`.
