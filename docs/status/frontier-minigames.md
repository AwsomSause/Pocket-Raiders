# Frontier-style minigames (slice 1 of s-minigames-lore)

Seven new games in the existing minigame framework (`src/core/minigame/games2.ts`, data in `src/data/minigames.json`, now 21 games). They appear at stage minigame stops with the same medals, caps and rewards as the first 14. No save change (games are chosen by id).

| Idea | Game id |
|---|---|
| S455 Maze Runner | `maze-runner` (fog, pits, step counter) |
| S456 Lock Picking | `lock-picking` (timed sweep) |
| S454 Sky Race | `sky-race` (3 lanes, rings and rocks) |
| S444 Safari Zone Nodes | `safari-steps` (bait, balls, step limit) |
| S438 Puzzle Nodes | `sliding-puzzle` (8-tile slide) |
| S436 Berry Blending | `berry-blending` |
| S450, S489, S503 cooking | `camp-cooking` (flavour order; no stat buffs yet) |

Limits: cooking pays the normal minigame rewards, it does not give Poffin/curry buffs or contest conditions yet. Safari uses type labels, not real species. Already covered by the first 14: S447 memory, S448 quiz, S449 fishing, S451 rhythm, S452 dig.
Next slices: Battle Frontier facilities (S439-S443, S490), Contest conditions (S487, S488), Mega/Dynamax/Tera/Z progression (S479-S482).
