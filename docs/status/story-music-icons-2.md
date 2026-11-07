# Story music and icons, part 2

- Story Runs: each story region (Cairnmoor, Tidewrack Reaches, Orrery Basin) plays its own map song (`mu_region_*_route`), and Evil Team battles play the team's own song (`mu_team_*_tense`, `_final` for the team leader). Until real music exists, each id points at a different song already in the game (`tools/build-story-audio.ts`, `src/data/audio/story_music.json`).
- Story Run map: the last 8 badges won show as type badge icons left of the status line.
- Party care: after a care action, an emote icon shows over the Pokémon (heart for a hug or a loved berry, frown for a disliked one, zzz for a lullaby and so on).
- Code: `src/core/presentation/storyMusic.ts`; MapScene, BattleScene (`storyTeamSong`), pokemonMenu, GameSession.care.
- Test: `tests/unit/storyMusicPicks.test.ts`.
- Limits: the 12 snack icons have no matching item (the game's snacks are berries), so they stay unused. Town and tension region cues, leitmotifs, and the tone icons are still unused.
