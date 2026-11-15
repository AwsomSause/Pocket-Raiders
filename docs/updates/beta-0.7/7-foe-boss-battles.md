# 7-foe boss battles

- **Player gets:** nothing new yet. Named story bosses (Cassiopeia, Ghetsis + Kyurem, Rose + Eternatus and others the scripts list) can now field a 7th Pokémon once a region thread lists them. The player's party stays at 6.
- **Save:** none. The saved battle now accepts 7 foes (an older save always has 6, so it still loads).
- **Limits:** a trainer fight (`EventBattle`) has an optional `seventh: true`; only data sets it. Without it, a team of 7 is cut to 6, and Evil Team reinforcements still stop at 6. Boss-id signature teams and raid bosses are unchanged. The foe ball row on the battle screen already drew any number of balls.
