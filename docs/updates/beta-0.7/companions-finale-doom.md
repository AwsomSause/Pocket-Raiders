# Companions, the Citadark finale and the Region of Doom (workstream 13)

Branch: `claude/project-thread-846rbm` into `beta-0.7`. Covers INSTRUMENTALITY E10, E11 and D1, in-run only (no cross-run memory).

## Player gets

- **Companions (E10).** Chobin, Rui and Professor Krane can be met in three new run events (`xc.chobin`, `xc.rui`, `xc.krane`, Grand Arc runs, stage 3+, rare). Wes (`wes-met`), Detective Looker (`looker-evidence`) and the Rocket Remnants trio (`rocket-trio-debt`) count once their existing events have been played. Rui is also the existing Companion NPC (heals a hurt lead once per fight). Each companion has a role in the finale (below), a short postcard line per region, and a line in the victory text.
- **Citadark finale (E11).** After the last region, a won run holding 3+ Data ROMs is offered the finale (Go / Never): Crossing, Climb, Admins (beaten liaisons give their ROM late), the Breather, Reservoir, Greevil (with the "Name a number" offer, and "Nine." with all nine ROMs), then XD001 as a raid. **XD001 locks = 9 minus ROMs earned in their regions**, minus 1 for Krane's Purify Chamber, minus 1 for the Remnants' balloon if lock J still stands. Zero locks: no fight, the player walks up. Allies hold the four approaches (Chobin = Whirlpool Gate; Wes = Gonzap steps aside; Looker = Cliff Stair). A loss, Never or a sale ends only the finale (`silent`, `declined`, `sold`); the run stays won. Resolution cards: the Snag Machines and the trio.
- **Region of Doom, "The Margin" (D1).** Optional in-run epilogue (after the finale if both are on): 14 districts held by the teams in *this run's* ledger, 8 Evil Gyms (leaders from the run's own evil team ranks, pardoned/exposed leader, defector, rival; invented placeholders otherwise), a Doom Level that falls 0.2 per district taken back, 8 Doom Marks, the Chairperson of the Undercroft, a Pale Garden rest, and an epitaph. A loss walks you out (`fled`); the win is never undone.

## Save

None bumped. New optional block `run.expansion.epilogue` (finale/doom switches, results, picks, marks, taken districts; defaults filled, old runs have none) and the loose `run.expansion.cut.epilogue` director state. Tests: `tests/unit/finale.test.ts` ("saves" and "save and reload in the middle"). New settings `expansion.finaleEnabled` (default **off**, needs needs the Grand Arc and 3 ROMs) and `expansion.doomEpilogue` (default **off** until the final balance pass); both default-filled, no settings bump.

## Limits

- The Siege Map "Alliance" screen is not built: approaches are worked out from flags and companions. The Rainbow Door's Front is not built: its result (`empty`/`open`) is written and shown, no battle. Lost approaches (not the gate) add one Climb wave each instead of lava hazards or a lower Breather heal.
- The XD001 raid format allows three shields, so every three standing locks is one shield. Per-lock field conditions (no item healing, no switching, ...) and the Reservoir's tank effects on Shadow tiers are not applied.
- Doom: Takeover raids, the Black Market, ambush/Shadow wild rates (shown on the doorway card, not applied), annexes (first on the cut list) and Echo Abilities are not built. Several approach flags (`blaine`, Lance, N, Leon, Cynthia, Nanu, Diantha, Hoenn titans, Paldea Engine) only count if the event that sets them exists; most do not yet.
- Only Kanto climaxes exist today, so reaching three ROMs needs the other regions (workstream E9). The finale and Doom were driven by unit tests and the director, not a browser run; the Format screen is the plain existing one.
- Timeline replays carry the two new switches.
