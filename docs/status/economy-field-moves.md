# Field moves (S416)

New event condition `partyMove` (a living party member knows the move). Two new uncommon events use it: "Blocked Path: Overgrowth" (Cut, Rock Smash, Surf) and "Blocked Path: Hidden Cave" (Flash, Strength, Dig). Each field move opens a choice that gives an item; "Walk around it" is always open.

- Data: `src/data/events/fieldMoves.json`; rule in `conditionMet` (`src/core/events.ts`). No save change.
- Limits: the move only has to be known, it is not spent. These are choices at event stops, not new map nodes. A locked choice shows "Needs a Pokémon that knows <Move>".
- Test: `tests/unit/fieldMoves.test.ts`; the old-seed story test leaves the events out.
