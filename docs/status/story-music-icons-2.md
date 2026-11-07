# Story music and icons, part 2

- Story Runs: Evil Team battles use the team's own story song id (`mu_team_*_tense`, `_final` for the team leader) through `storyOr`, so they switch to real music as soon as its file is added; until then the shipped song plays (same policy as main's story region and battle music).
- Story Run map: the last 8 badges won show as type badge icons left of the status line.
- Party care: after a care action, an emote icon shows over the Pokémon (heart for a hug or a loved berry, frown for a disliked one, zzz for a lullaby and so on).
- Code: `src/core/presentation/storyMusic.ts`; MapScene, BattleScene (`storyTeamSong`), pokemonMenu, GameSession.care.
- Test: `tests/unit/storyMusicPicks.test.ts`.
- Limits: the 12 snack icons have no matching item (the game's snacks are berries), so they stay unused. Tone icons and leitmotifs are still unused.
