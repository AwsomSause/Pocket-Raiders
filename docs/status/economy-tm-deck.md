# TM Deck (S415)

Key item `tm-deck` (perk `tmDeck`). Once per stage, from the map Items menu, your lead is offered up to 3 new moves of its own types (TM Case adds more). Picking one uses the normal teach-move screen (forget a move if it knows four). The offer comes from its own seeded hash, so reopening changes nothing. No save change (the once-per-stage mark uses `itemCounters`).
Tests: `tests/unit/tmDeck.test.ts`. Not done: choosing which party member learns it (always the lead).
