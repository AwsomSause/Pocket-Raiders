# Pacing follow-ups (settings toggles, wild stones)

**Player gets:** Three switches on the Settings screen (Gameplay): Busier stages, League counter-pick and Evolution Encounters; they apply to runs you start after changing them. With Evolution Encounters on, a wild Pokémon that evolves by a stone (Growlithe, Eevee, Gloom...) sometimes has that stone beside it (15%); win or catch it and you take the stone.

**Save:** none. The wild stone is a new optional `evoStone` field on the battle; older saves load unchanged.

**Limits:** the stone is announced in the fight's opening note, not with its own cue. Only plain stones count (no region branches, no friendship items). The stone chance lives in `balance.json` (`evolutionEncounter.wildStoneChance`), not on the Settings screen.
