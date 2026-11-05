# Battle Frontier facilities (slice 2 of s-minigames-lore)

Ideas S439 to S443: four facilities added as minigame stops (`src/core/minigame/frontier.ts`, data in `minigames.json`, needs 1 badge). Fights run on the real battle engine (`fight` in `core/exhibition.ts`) with the game's own seed, so they replay the same and use no gameplay RNG. No save change.

- Battle Factory: rent 3 of 6 Pokémon, win rounds, swap rentals between rounds.
- Battle Palace: pick a lineup order; the team picks its own moves (the battle AI).
- Battle Arcade: a wheel sets a level modifier each round; re-spin a few times.
- Battle Pyramid: 4x4 dark floors, fog, hidden trainers (win = bonus, loss ends the climb).

Limits: teams are generated Frontier teams (final-form species), not your own party. The Palace does not yet use nature-based move rules. Frontier Points and the prize shop (S490) are NOT built: they need a profile save bump, so they are the next slice. Prizes use the normal minigame medals.
