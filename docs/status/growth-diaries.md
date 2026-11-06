# Growth: Pokémon Diaries (S64)

- The Hall of Fame shows a short first-person diary note for each remembered Pokémon (one with a title, a signature moment or a mentor legacy), newest run first, up to 30.
- Notes are built from the Legacy Card, so the same card always gives the same note. Nothing is stored; no save change.
- Code: `diaryNote` and `hallOfFame(...).diaries` in `src/core/hallOfFame.ts`; rows in `src/scenes/HallOfFameScene.ts`. Test: `tests/unit/hallOfFame.test.ts`.
- Limit: text only, no per-event diary entries beyond what the card holds.
