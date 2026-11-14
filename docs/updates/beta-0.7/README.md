# Beta 0.7 per-PR notes

Branch: `beta-0.7` (from `main` at `c096e2ae`). Every workstream PR targets `beta-0.7`, never `main`, and adds one file here named `<pr>-<short-name>.md` with three headings:

- **Player gets:** what a player can now do or see.
- **Save:** save versions bumped (with the migration test), or "none".
- **Limits:** what is stubbed, limited or disabled, and why.

The integration lead compiles these into `docs/updates/beta-0.7.md` and opens one PR into `main`, merged only on its own green CI.

## Scope (Kice, 2026-11-14)

Beta 0.7 = **Node Event Menus (headline)** plus the rest of INSTRUMENTALITY (milestone 3.0 and 3.0+1.0), in the handoff's order: Node Menus and the small 0.6 follow-ups first, then 3.0, then the regions. Node Menus and the regions do not share a balance pass.

- **No cross-run progression.** Reliquary, Storybook, Doom Ledger, Faller rank and any other cross-run memory are cut. Blessings, Ultra Beasts and the Region of Doom are in-run only. Profile 21 stays unused.
- The art list (handoff 8.5) is not needed now.
- Squirtle Squad and the Tournament Champion Primeape use Kice's Anime Forms sprites.

## Decisions made for Kice (delegated, 2026-11-14)

Node Event Menus, the plan's seven questions, all on the plan's recommendation:
1. Release: ships in 0.7 behind its own setting, **on by default** once P7 passes the bot sims; off if the sims miss the run-length target.
2. Picks: **1 optional pick per node**, 2 on gym-eve, plaza and 5-entry nodes. No free picks.
3. Micro entries: **yes** (short repeatable entries so menus never run dry).
4. "Rival Takes It": **yes**, for what you skip.
5. Second required entry: **yes, at most 2 required**, never 2 required battles.
6. Off in speedrun, boss rush and time attack: **yes**.
7. Look: the existing stop-card style (`src/ui/stopLooks.ts`), 2 to 5 cards in a row; no new art.
- Own seeded stream `::node-menu::`; with the setting off, old seeds play exactly as before. Optional fields on side stops, no save bump.

Other calls:
- **Extended Cut** gets a Settings switch now, **off by default** until the final balance pass.
- The 11 stored-but-unread settings: wire each one that has a finished feature, remove the rest (with a settings migration).
- **Branch protection:** recommended to Kice (Settings > Branches, require `CI ok` on `main`); only Kice can set it.
- If time runs out, cut in the plan's order (Debate as a plain duel, Front as a plain triple, Doom annexes, the 4 outlined WREs, Kalos Couture, events density cap 3, catchable specials, Origin/Primordial blessings). Never cut: the Breather, save points, Second Shot, announcements, the Standard Cut, the off switches, "a story loss never ends the run".

## Save versions for 0.7

Start: profile 20, run 43, settings 42. Next free: profile 21 (unused, no cross-run), run 44, settings 43. Prefer optional fields (no bump). A thread that must bump takes the next free number at its merge time and adds a migration test.
