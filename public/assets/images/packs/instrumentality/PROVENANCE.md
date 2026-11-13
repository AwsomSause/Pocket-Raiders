# Instrumentality pack sprites (Beta 0.6)

Source: Kice's `pocket-raiders-upd.zip` (folders "Anime Forms" and "Story Stuff"), delivered 2026-11-13. Kice's own packs and art. Same licence and privacy rules as every other pack in this repo (see `docs/plans/drive-assets-plan.md`).

Files were renamed to lowercase_snake_case and typos fixed; the images are unchanged. `RENAMES.csv` lists every original name and its new path.

- `anime_forms/`: Squirtle Squad line (Lesser/Leader Squirtle, Wartortle, Blastoise), Mega Squad Blastoise, Champion Primeape. Statics 96x96; `animated/` holds 288x288 3x3 frame sheets.
- `story/trainers/`: evil team and story trainer sprites, 80x80 (two sheets: `concordia_sheet.png`, `plasma_sages_sheet.jpg`).
- `story/giratina_cultist/`: Giratina Cultist grunt (variants a and b, 9 poses each) and leader (7 poses).
- `story/animations/`: Leader battle animations 1 (13 frames, plus a sheet) and 2 (9 frames).

Not wired into `src/assets/catalog.ts` yet; each slice that uses one adds it there.
