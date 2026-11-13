# Pokémon moments, batch 5: faint, ally, weather and status moments

**What the player gets.** Pokémon react to more of the fight: an Electric type that falls can paralyse its attacker, a fallen legendary bird stirs the next bird sent out, Fire types speed up in sun and thaw at once, Poison types shake poison off quickly, Psychic types clear confusion and sleep. 22 more moments.

**Built (22).**
- 10 "ally" moments from our catalog (partner-fall, Eon heal, Pikachu's friend, Nidoking's court, the legendary birds, lake guardians, beasts, swords, Regis, Tapu).
- 4 weather moments (Fire in sun, Water in rain, Rock in sand, Ice in hail), 4 status moments (Poison Tolerance, Fire Thaw, Psychic Clear, Normal Hold).
- 4 from pack 2: Static Discharge (Electric faint), Spite in the Blood (Poison faint, any hit), Formation! (Falinks goes first), Legendary Pokémon (Arcanine gets Atk +1 against a legendary foe).

**Rules.**
- New trigger "faint": the Pokémon in front fell this turn. Its own faint moments hit the foe; party-mates' ally moments are rolled at the fall and wait as a pending tag, then play when that survivor is next sent out (a benched Pokémon cannot hold stat stages).
- Weather and status moments are checked at the end of each turn against the current weather and the Pokémon's own status; once per battle each.
- New data fields: `requires.status`, `requires.foeTag`, `allyScope` (same set or any ally), `statusLeft`. No save version bump.

**Limited.** Tapu Guardians heals 20% but does not set terrain yet. Spite in the Blood works on any hit, not only contact. Ally moments reach the next survivor sent out, not the whole team at once.

**Still off.** Rest moments (8) and catch moments (2) need the map and run layer, so they are the next batch. Bug Swarm, Poison Toxic Blood, Gengar Cackle and Ice Chill KO still need new hooks.

**Tests.** `tests/unit/pokemonMoments.test.ts` (37 pass): weather only in its weather, status needs the status, Fire thaws, faint paralysis, the pending ally boost that waits for the switch-in, Arcanine against a legendary, Falinks.
