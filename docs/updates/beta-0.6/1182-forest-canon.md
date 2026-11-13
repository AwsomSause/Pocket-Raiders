# Kanto Canon Spaces: Veridian Forest (workstream 18, slice 3)

**Player gets:** Pewter's Veridian Forest is always on the map in a Kanto run (Kanto setting on). Enter (or leave before any fight) and walk 6 rooms: Bug Catchers, a guaranteed wild Bug-type (Caterpie, Weedle or Pinsir) to catch, a 40% Beedrill swarm side path (Poison Barb), a 30% honey-tree den (Combee or Heracross), the Clearing, and the Samurai's 1-on-1: your first Bug-type against his Scyther (if yours is weak to Flying) or Pinsir, same level, no items, no switching. Win and your Bug-type learns Samurai Slash (Bug, 70 power, 100 accuracy, 10 PP, contact, slicing; the first time it is used in a battle stay the target flinches).

**Save:** none (adds a boolean to the in-battle volatile state with a default, and event data).

**Limits:**
- No Bug-type at the Clearing: a waiting Weedle joins you instead (as the pack says). The caught Bug-type is simply your first Bug-type in the party.
- Losing the duel ejects you to the map with a partial heal (existing pseudo-stage rule). The pack's Silver Powder consolation is not given: no such item exists yet.
- "First use in a battle" is "first use this stay on the field" (resets on switch).
- A full moveset loses its last move to Samurai Slash. Re-teaching at the Move Relearner is not wired.
- Leaving at the gate and entering both mark the space finished. The Fog (10%) and Hunters' Trap (10%) extras are not built.
- New engine pieces, all data-driven: move effect `flinchFirstUse`, event effect `teachMove`, trainer-battle fields `team` and `counter`, rule fields `leadType` and `matchLead`, condition flag `partyType.absent`.
