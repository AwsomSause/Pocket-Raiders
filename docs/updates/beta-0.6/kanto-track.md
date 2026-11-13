# Kanto Track: The Ledger Fills (E2)

## Player gets
- A world-state track for Kanto, "The Ledger Fills", step 0 to 5. It goes up when an Evil Team operation is let through (a raid lost) and when the team's real plan comes out (the climax is scheduled), and down when an operation is stopped (a raid won).
- What each step does in play: **1** one shop per stage charges +10% ("insurance"); **2** the first Pokémon Center of a stage is shut at night (the game says why); **4** about a quarter of the wild species in Kanto leave the pool (stable for the run; an emptied pool falls back to the full one); **5** a news line about Rocket adverts. Step 3 ("Closed Roads", Snorlax detours) is carried by the story events in the next slice.
- A Notebook track page (Kice's pick: Ledger 1, open notebook): press **T** on the map once the track has moved. Left page lists the five steps as Seen / Now / Next / Locked, right page shows "how much you've seen" and what civilians say. A step not reached yet shows "???".
- It never raises an enemy's level or team.

## Save
- None bumped. `run.expansion.track` is now a typed record by region (step, peak, applied keys, last 12 changes); older runs have no track and load untouched. New run flag `run.expansion.tracks` and setting `expansion.worldTracks` (default on, added with its default, no version change). Old-seed fingerprints do not move: runs without the flag never touch the track.

## Limits
- Story raids (E5b) already call the track: a won raid (triumph, success) removes a step, a failed or declined one adds a step, a partial changes nothing. Raids are not offered on the live map yet, so until one is played the existing Evil Team operations stand in (stopped = raid won, let through = raid lost; story beat 6 = climax scheduled). Once any raid is resolved the operation stand-in stops, so nothing counts twice.
- Only Kanto's track is built. In this game a stage is a "city" and Kanto has no Vermilion stage yet, so step 4 thins all Kanto wild pools; the canon-spaces slice can narrow it.
- Game Corner Black-Label prizes (step 2) and "Saffron's gates are shut" (step 5) are not built: the first needs the event data changed for every run, the second needs the Extended Cut climax. They are listed as the next steps, not faked.
- Dossier (Case Folders + Org Pyramid) belongs to the Cast slice (E1), not this one.
- Checked by unit tests and typecheck; a browser screenshot pass is listed in the PR.
