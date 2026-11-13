# Beta 0.6 T3: Triple Battles in runs

**Built:**
- `balance.triples` (`enabled`, `chance`, `fromRegion`, `bossIds`): ordinary trainers from region 3 (`fromRegion` 2) fight three at a time with `chance` 0.15, on their own seed (`::triples::`), so no existing roll moves. Bosses in `bossIds` always do (list empty for now).
- Triples Only run rule (`triples-only`, group `doubles`, so it can't stack with Doubles Only): every trainer fight that can be a triple battle is one.
- Battle Factory: a "Format: Single / Triple" cell before the first rental; triple rounds are full triple battles on the engine (`fight(..., { triples: true })`, each Pokémon uses its strongest move on a foe in reach).
- Run helpers that list the Pokémon on the field (companion support, story growth counters) now use `fieldIndexes`, so they see all three.

**Switched off until T2 (the battle screen for three a side):** `balance.triples.enabled` is `false` and the Triples Only rule has status `planned` (listed, can't be picked). The Factory format works now because those fights are simulated, not drawn. T2 turns both on.

**Tests:** `tests/unit/triplesRuns.test.ts` (rule on/off and boundary, region gate, same seed same format, a whole run battle through `takeTurn`, Factory format switch and a triple round). `story.test.ts` pins unchanged.

**Save:** no bump. The Factory's `triples` flag is optional in the minigame state.

**Limits:** no wild triples; no boss is listed in `bossIds` yet; the Factory foe AI picks the strongest move, not the smartest.
