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

## T4: Triple Battle event scenes
- Event battles take an optional `format` (`doubles` | `triples`; `EventBattleFormatSchema`). `applyEventFormat` (core/events.ts) makes triples only while triples are on (`balance.triples.enabled` or Triples Only) and both sides have three healthy Pokémon. Otherwise it makes doubles if it can, or leaves a single battle. It uses no random numbers.
- Wild fights with a format bring one or two more wild Pokémon, rolled on their own seed (`::event-format::<event>::<encounters>`). The first foe is the same as without a format.
- Data: `triple-battle` (triples, 3 foes), `whispering-grove-1` gets a new "Wake them" choice (a wild triple battle, fairy/grass, still opens the grove's next event), and `double-trouble`, `twin-trainers` and `hot-dog-duelists` become doubles. The Hot Dog Duelists are one double battle of 4 instead of a chain of two.
- Tests: `tests/unit/triplesEvents.test.ts`.

## T2 prep: layout-free battle menu rules
- `src/core/battle/fieldMenu.ts`: `commandPlan` (which of your spots to ask, skip, or fill with a forced move), `targetChoices` (foes in reach plus partners for ally moves, with the best-by-type marker), `shiftOptionProblem` (edges of a triple battle only, one Shift a turn). These follow the same rules as `resolveDoublesTurn`, so anything offered is accepted.
- The double battle screen (`BattleScene.promptSpot` / `openTargetPicker`) now uses them. What's left for T2: the spot positions (`DUO_POS` for 3), the Shift button, and the art.
- Tests: `tests/unit/fieldMenu.test.ts`; `doubles.spec.ts` and `raidDoubles.spec.ts` pass.
- More triple scenes: `shadow-triad`, `plasma-substage-yard` (Fight the guards), `delibird-y` (Battle them, wild), `md-1-monster-house` (both fights, wild), `xr.fe-72` Double Booking (one fight of 4 instead of a chain of two). Their sources in `tools/events/*.ts` carry the same `format` (the DSL's `wild`/`trainer` take `format`), and so do `triple-battle` and `double-trouble`.
- Left for later: the rival questline's "three-on-three" spar (`rq-swap-day`, owned by the rival work) stays a single battle. `whispering-grove-1`, `twin-trainers` and `hot-dog-duelists` were edited in their JSON files only; no generator source for them was found.
