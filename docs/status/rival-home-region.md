# Rival home region, signature Pokémon, live rivals (2026-11-07, Kice)

- First rival names now 18: added Hugh, Brendan, May, N, Lillie (Lillie is a new character in `majorRivals.json`).
- Opener and ace come from the rival's home region (`src/data/rivalHome.json`, `core/rivals/home.ts`; flag `balance.rival.homeRegion`).
- Signature Pokémon: N Zorua, Wally Ralts, Gladion Type: Null, Lillie Cosmog (opener, kept on later meetings); Hop Wooloo (first fight only).
- A run keeps 4 live rivals (`rivals.json` `activeTarget`, `maxRivals` 12): once the first rival exists, the next ordinary trainer win becomes a rival whenever fewer than 4 are not ally/retired.
- Fixed sim bugs: run-long (passive) Repel/Bridge/Favored items threw "No Repel is working" / "That item is used up", and made the sim bot say "No reward could be taken".
- Limits: Story Run rivals keep their written names/teams (no home-region change). Sparks need a trainer win, so 4 rivals is usually reached during stage 3-4, not at stage 1. Old-seed test pins `homeRegion: false` and the 13 old names.
