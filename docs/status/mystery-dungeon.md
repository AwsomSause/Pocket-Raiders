# Mystery Dungeon floors (S492)

New minigame `mystery-dungeon` (`src/core/minigame/games3.ts`, data in `minigames.json`, now 34 games; no save change). A fogged 5x5 floor crawl: find the stairs (never next to the start), pick up loot, trap tiles cost 1 HP, monsters cost 1 HP and drop loot. Limited steps and HP; Easy 3 floors, Normal 4, Hard 5. Score is 3 per floor plus 1 per loot. Each floor is drawn from the game's own seeded generator.

Limits: monsters are resolved by the HP cost, not a battle; it is one minigame at a minigame stop, not a separate run mode.
