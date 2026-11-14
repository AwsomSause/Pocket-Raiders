# Retire the shipped versions of five event lines (Beta 0.7)

Kice (2026-11-14): the shipped versions do not match the design and the pseudo stages were never built. They are switched off until the rebuilt versions land (each rebuild is its own thread).

- Kanto canon spaces off: Flight North, Sabrina's Labyrinth, Route 25, Fighting Tournament (`RETIRED_SPACES` in `src/core/expansion/canonSpaces.ts`). Data and events stay in the catalog; the town menu never offers them. The rebuild removes the id from the set.
- Pidgey's Resolve (`evo-pidgeys-resolve`): `disabled: true`.
- Poli-Pond: never existed in the game, nothing to switch off.
- No save change. Nothing deleted.
