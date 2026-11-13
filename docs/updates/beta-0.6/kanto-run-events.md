# 104 new run events (E3b)

## Player gets
- 104 new run events: 32 forced scenes (FE-44 to FE-75) and 72 encounters (EN-60 to EN-131). They cover the world around the Ledger, the cast, Shadow Pokémon, the trio liaison, roaming beats, the friend, quiet moments and regional scenes.
- They only appear in runs that have the story-events flag (same switch as the Kanto story events). Forced scenes always offer two or more ways out. They never sell, pay coins, give EXP candy, end a run, take a Key Item or Data ROM, or start a battle bigger than three Pokémon.
- Events that depend on a state (Extended Cut, a Shadow in the party, a hinted key, the Grand Arc, a Data ROM, the friend, the trio) wait for it. A story event is never placed in a neighbouring column.
- New effect `shadowHeart` eases every party Shadow's Heart (never below 1).

## Save
- None bumped. One new optional field `run.expansion.climaxCut`, set at run start when the Extended Cut setting is on.

## Limits
- Intel, Operational Strength, Siege Map, Impound, Reclaim, Breather, Field Notes, the Dossier and the Cut choice are not built yet; those events write story flags (for example `ev:cut-extended`) for later slices.
- Game Corner Black-Label prizes and Saffron's gates are not built.
