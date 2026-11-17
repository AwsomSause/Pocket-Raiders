# Jet Pokédex batch 5 abilities (122)

All 122 new abilities that came with the Jet batch 5 import (dex 63-207) now work in battle. Status: **supported** (`abilityStatus`), and `jetSpecies.json` `pendingAbilities` is empty.

**Where:** simple rules join the shared tables in `src/core/battle/abilities.ts` (weather/terrain setters, weather Speed, absorbs, status immunities, drop guards, flag boosts, Contact Status, Priority Guard). The rest is data plus pure helpers in `src/core/battle/jetAbilities.ts` (power, damage taken, sure hits, priority, floaters, crit/hazard/forced-switch immunity, turn healing), and the engine runs them in one block in `engine.ts` (`jetEntry`, `jetOnEnter`, `jetAfterHit`, `jetResidual`, `jetSurvive`, `jetFrozenPresent`, `jetStatusMoveSeen`). Doubles: `doubles.ts` (Requiem/Full Broadside spread, Lantern Lure redirect, Petal Waltz vs Dancer, foe drops on both foes). Fermented Shell's double Berry: `held.ts` `eatBerry`.

**Tests:** `tests/unit/jetAbilities.test.ts` (126 tests; the last one fails if any of the 122 has no test).

**Readings of the descriptions (limits):**
- "May" with no number = 30% (as Static). Dream Chorus 10% (stated).
- Kingpin: +0.2 per fallen teammate, capped at 1.6x.
- Three Heads: biting and fire-breathing moves hit 3 times at 40% power each (1.2x total).
- Masterstroke: against two types, effectiveness counts only the type the move does best against.
- Undying Flame / Rainbow Wings: once per battle, only against a move's hit. Rainbow Wings fully heals the next living teammate in party order straight away.
- Season Cycle: no forms exist in the pack, so only the second type changes (turn 4 Summer/Fire, 8 Fall/Ghost, 12 Winter/Ice, 16 Spring/Grass).
- Purifying Aurora cures itself and its partner, and wipes stat changes on every Pokémon on the field.
- Lure Tongue traps for 2 turns; Kraken's Grip binds for 8 turns at 1/6 a turn.
- Guardian Angel, Inspiration, Heart of the Herd and the ally parts of Queen's Guard, Warm Hearth, Reef Crown, Living Atoll, Command Bark only matter in double battles (singles have no partner on the field). Requiem / Full Broadside spreading and Lantern Lure redirecting are doubles-only too; Lantern Lure's 25% cut applies in singles.
- Battlements' "hazards last forever": hazards already never expire in this game, so only its 25% physical cut changes anything.
- Sonic Echo's "ignores Substitute": sound moves already do here.
- All-Seeing Eye "reveals the foe's moves" as a battle message.
- Old Growth and Deep Roots already existed (Greenneedle) with other rules; the pack reuses the ids, so Ancient Exeggutor and Petrarbor get the existing versions. Not changed.
- Some Jet signature moves have no slicing/pulse/bone/beak flag in the data; `jetAbilities.ts` lists them by id (e.g. Leek Katana, Psyblade Rush, Broadside, Ossuary Crush, Drill Gale).
