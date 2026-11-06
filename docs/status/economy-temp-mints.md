# Temporary mints (S418)

Six "Fleeting" mints (Adamant, Modest, Jolly, Timid, Bold, Calm), common items. Each gives a Pokémon another nature for 3 won battles (that it took part in); then its real nature returns. The real nature is never changed.

- Rules: `effectiveNature` in `src/core/natures.ts` (used by `calcStats`); `battles` on the catalog `nature` effect; countdown in the win branch of `run.ts`. The summary shows "fleeting, N battles left".
- Save: `tempNature` is an optional field on a Pokémon, so no save version bump; old saves load unchanged.
- Limits: a new Fleeting Mint replaces the old temporary nature. Only a Pokémon that fought counts the battle down.
- Test: `tests/unit/tempMint.test.ts`. The old-seed story test leaves the six items out.
