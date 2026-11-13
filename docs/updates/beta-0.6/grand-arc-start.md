# Grand Arc start (E7)

## Player gets
- Cipher, Rocket Remnants and Team Snag'em are now teams in `evilTeams.json` (full ranks, lines, rule, four operations each). They are roaming: never a run's own team, never drawn by the run's team pick.
- Ein, Cipher's liaison in Kanto, appears as a quiet figure at a Kanto stop ("The Quiet Figure"). Beat him, or let him read a Shadow Pokémon in your party, and you earn Data ROM K, "Rig Pulse". A second event ("Crates With the Same Stencil") fields Cipher Peons on any region.
- The Stock track (0 to 5) is kept for the run: Samples, Shipments, Three Beasts, The Reading, Complete. Every three ROMs held remove one step. A liaison nobody beat leaves with a sample when you clear their region (Stock step 1) and returns at the finale.
- Three or more ROMs means the finale (Citadark) will be offered (`finaleOffered`); the finale itself is not built yet.

## Save
- No version bump. New optional `run.expansion.grandArc` (ROMs earned, ROMs taken late, Stock steps gained, regions whose liaison left). It exists only when Settings > expansion > Grand Arc was on at run start (default on) and is carried by the replay genesis. ROMs are only ever added, never removed.

## Limits
- Only ROM K can be earned in play today (Kanto). The other eight liaisons, their routes (Raid 4 Secondary C, climax Phase 3) and the late-ROM route at the finale come with the other regions and workstream 16. The data for all nine ROMs and the five Stock steps is in `src/data/grandArc.json`.
- Only Stock step 1 is gained by play today; steps 2 to 5 have `gainStock` and an event effect (`grandArcStock`) ready for the Region of Doom, Johto and finale work. The Stock's effects at the finale (E11) are not built.
- Roaming teams fight with their own rules but no heat or operations (those belong to the run's own team). Event battles pick them with `evilTeam` on a trainer battle; their villain records are kept as `team:rank`.
- Cipher and Remnant trainer art reuses existing sprites until custom art arrives.
