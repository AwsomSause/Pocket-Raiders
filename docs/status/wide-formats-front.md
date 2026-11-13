# Wide formats: Front (E4, 6 of 7)

- `src/core/formats/front.ts`: the Giovanni finale as lanes. Lanes come from a table (Kanto: M2 held in the climax, `rocket.x.m2` = `taken`, gives a Giovanni/Mewtwo lane) or from the director's input `{lanes}`; at most 4. Format: 3+ lanes = triple battle, 2 = doubles, 1 = plain battle, 0 = no fight (result `none`).
- Lane rule (`rule.lanes`): a foe is only reachable from the same spot while the foe in that lane is alive. Small edits in `battle/triples.ts` (`canReach`, `lanesOn`), `battle/doubles.ts` (`laneHolds`) and `battle/fieldMenu.ts` (`laneBound`). Without the rule nothing changes.
- Enemy team is set exactly by the new optional `lineup` on trainer event battles (one species per lane, falls back to the normal pick).
- Result is written once to `run.story.flags['finale.x.front']`: `held` or `lost`. A loss is a story loss: party healed, run goes on.
- If triple battles are switched off (`balance.triples.enabled`), three lanes fall back to doubles through the normal event-format fallback.
- Not built: lanes for regions other than Kanto, a lane screen (plain Format card is used), 4th lane waits behind the first three.
- Tests: `tests/unit/formats.test.ts` (Front block).
