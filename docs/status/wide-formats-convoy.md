# Wide formats: Convoy (E4, 3 of 7)

- `src/core/formats/convoy.ts`: Kanto Phase 7 "The Long Drive". Legs fought back to back with no healing between (the party is only healed by a lost fight's story-loss tail): escort van, Poacher-Captain Rudd, then LEDGER (Porygon-Z). A Raid 4 Triumph (`run.expansion.raids['4'].result === 'triumph'`, or `startFormat('convoy', ctx, { short: true })`) drops Rudd. At the car the player answers LEDGER: "You're a list." fights it (win = ledger `won`), "You're a witness." skips the fight (ledger `joined`). A lost leg fails the Convoy (ledger `none`, nothing else lost; the climax result stands). The result is written once to `run.expansion.cut.ledger` for the Resolution (E5) to read.
- Battles use `launchFormatBattle` from the Blackout slice.
- Not built: LEDGER joining the party as a Pokémon (special-Pokémon plumbing belongs to the Kanto saga slices); other regions' Convoy conditions (Power Surge, storm wind) come with their saga slices as `legs` config plus an `eventRule`.
- Tests: `tests/unit/formats.test.ts` (Convoy block).
