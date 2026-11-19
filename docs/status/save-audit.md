# Save audit sweep (2026-11-19)

Kice: "Saves are breaking more and more" and "check every item, Pokémon, ability and event". Screenshot: "Unknown item sitrus-berry in save".

## Sweep (tests/unit/saveSweep.test.ts, ~2 min)
Every event choice (~21,000, choices the player can't take yet are skipped), every Bag and catalog item (given by an event and dropped straight in the Bag), every Pokémon (1,857) with every ability (517) in a three-turn battle. Each run is saved and loaded again: it must not throw, be rejected or need a repair. A last check: every pseudo-stage theme exists.

## Found and fixed
1. **Event trainer battles** with no class in their data use class `event`; the save check didn't know it, so closing the game mid-fight lost the run (1,281 event choices). Now allowed.
2. **Pseudo-stages** (places with their own map) were checked with full-stage rules (gym in the last column, two trainer columns), so a save inside one was rejected (226 choices). They now get their own check (`validatePseudoMap`: unique ids, links lead somewhere).
3. **Catalog items put straight in the Bag** (Sitrus Berry, Focus Sash rentals, Rare Candy from boxes, Sticky Barb...) were invisible in the Bag and made the save fail. `tidyBag` (core/bag.ts) runs on every save and load: held items go to the loose held items, team passives to passives, anything else is sold for the event gift price. A rented item kept there can still be returned.
4. **Events that take the whole team away** (Battle Factory, prison cell, draft) left an empty party, which the save check rejected. Allowed while the team waits in the box or stash.
5. **Two pseudo-stages named themes that don't exist** (`fairy-ghost`, `ground-fire`): now `ghost-fairy`, `fire-ground`.

## Limits
- Choices behind a requirement, follow-up battles' win/loss effects and multi-step chains past the first step are not swept.
- The live site (main) has none of these fixes until the ui-mockups update ships.
