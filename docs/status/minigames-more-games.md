# More minigames and Palace nature rules (slice 3 of s-minigames-lore)

Seven new games in `src/core/minigame/games3.ts` (data in `src/data/minigames.json`, now 32 games). They appear at minigame stops with the usual medals, caps and rewards. No save change.

| Idea | Game id |
|---|---|
| S437 Pokéathlon courses, S486 five-stat layer | `obstacle-course` (Speed/Power/Skill/Stamina/Jump profile, energy, 2 rests) |
| S445 Bug Contest | `bug-contest` (size, rarity, health; keep or release) |
| S446 Slot Machine Alternatives | `puzzle-slots` (4 reels; turn them to line up rows; no luck) |
| S451 Dance Battles | `dance-battle` (copy the rival's routine) |
| S453 Pinball Bonus | `pinball-bonus` (flipper, bumpers, balls) |
| S493 Rangers Styler | `ranger-styler` (draw capture loops; the target dashes) |
| S494 Snap Photo | `snap-photo` (the dex asks for a type; centre frame scores most) |

Battle Palace nature rules: Palace Pokémon now get a nature; attack natures only use damaging moves, defence natures use status moves, speed natures alternate, neutral natures use the normal AI (`palaceStyle` in `core/exhibition.ts`).

Limits: the Styler is a tap-in-order loop, not a drag; Snap Photo uses type labels, not real species; no rewards beyond the normal minigame payout. Still open from this area: Frontier Points shop (S490) and Contest conditions (S487-S489, S503 buffs), which need a save bump.
