# Pokémon moments, batch 7: the last seven

All 133 Pokémon moments now play. The seven that were waiting on a hook:

| Moment | What it does |
|---|---|
| Swarm Strikes (Bug, below 25% HP) | The next Bug move does +25% damage, then the boost is spent. |
| Toxic Blood (Poison, below 25% HP) | For the rest of the battle, a foe that hits it with a contact move is poisoned. |
| Cackle (Gastly line, after a KO) | The next foe starts with Atk -1 and Sp. Atk -1. |
| Cold Triumph (Ice, after a KO) | The next foe starts with Spe -1. |
| Ghost Story (Ghost, at a healing stop) | Names the types that hit this stage's leader hardest. |
| Dream Walk (Psychic, at a healing stop) | The dreamer gains 30% of the experience to its next level (skipped, and not claimed, if it is at the level cap). |
| Water Song (Water, at a healing stop) | The whole team gains +3 friendship. |

## Notes
- Water Song changed from "heal 10%" to friendship: a healing stop already heals the team fully, so a heal would do nothing.
- Ghost Story reuses the Field License's weakness wording; no new hint system.
- No save version bump. Battle effects are tags in the battle; run limits are the usual `pm:<id>` story flags.
- No new RNG stream.

## Tests
`tests/unit/pokemonMoments.test.ts` (47 tests): each moment plays, the Bug boost is spent, the poison lands on a contact foe, the next-foe stages are set, and the three rest moments work.
