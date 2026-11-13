# Foresight Tax (Oracle Sabrina, Blackout Triad anchor)

- Battle rule `foresight` (`eventRule`), logic in `src/core/battle/foresight.ts`. Each turn, before the enemy picks, the player's chosen move is revealed to the enemy and announced ("Foresight Tax: Sabrina sees your move..."). It stops for the rest of the battle once any of her Pokémon has fainted (announced once). State: optional `battle.foresight {ended, revealed}` (no save bump).
- Effect on her choice: that turn she plays her best-scoring move (not a random one), and the Advanced AI's "threat" read counts only the revealed move instead of everything you know. A revealed status move means no threat, so she sets up; a big attack lets her react to a KO or priority race.
- Engine touches (outside the variant-line hooks): `EnemyBrain.foresight`, one `threat` filter, one call in `resolveTurn` before the enemy move is picked.
- Blackout gives the rule to the Triad's third anchor (Oracle Sabrina).
- Limits: single battles only (doubles/triples ignore the rule); a switch or item shows no move, so only the announcement and the best-move pick apply. The data-pipeline's own Sabrina entry can reuse `rule: { foresight: true }`.
- Tests: `tests/unit/colossus.test.ts` (Foresight block), `tests/unit/formats.test.ts` (Blackout Triad).
