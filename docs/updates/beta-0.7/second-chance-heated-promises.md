# Second Chance, Heated moves, Mythical Promises (INSTRUMENTALITY S1, H1, M1)

## Player gets
- **Second Chance (S1):** when a run would end, 5% of the time (once per run, flat) the team is revived at 25% HP with +1 to every stat, the six white lines are shown in the battle screen, and a rival (else a silent silhouette) stands beside you. The partner is the existing final-boss assist (3 strikes), not a new battle format. Settings: "Second Chance" (Off/5/10/25%).
- **Heated moves (H1):** the move a Pokémon finds in the heat of a fight now needs a big fight (rival, Gym, Elite Four, Champion, climax), the Pokémon last standing or under 25% HP, High Bond, a 6% roll, at most 1 per region and 3 per run, never twice for one Pokémon. Setting: "Rarer heated-moment moves" (on by default).
- **Mythical Promises (M1):** all 23 Mythicals are data with three Tellings, a Promise rule and a Wonder. One Telling a stage; once believed (3), a visit can come at the first stage of a region (10%, +3% per extra Telling, max 25%, one per run). Accept and it is your Guest; break its rule and it forgives once (where allowed) then leaves. Setting: "Mythical Promises".

## Save
None. Everything is optional fields in `run.expansion` (v43) and a defaulted `heatedMoments` in `settings.expansion` (v42); older saves load as before. The run-start settings are copied into the run, so replays stay deterministic.

## Limits
- Mythicals: only **Zarude** is supported (visit, Promise enforced on faint, Wonder heals 10% after wins). 19 are *limited* (Promise rule is checked and tested, but the visit trigger and Wonder are not built, so they never visit); Arceus, Marshadow, Manaphy and Melmetal are *disabled* (need cross-run memory or another Mythical first). Each entry says why in `promisesData.ts`.
- No Storybook, Keepsakes or Parting: they were cross-run and are cut. The Guest is not drawn on the map, and the warning mark exists as `promiseWarning()` but no screen calls it yet. Only the faint event is hooked into the run.
- Second Chance: rewinds, the jewel and Flight North are not all built, so only the order function exists (`pickRescue`). The +1 stats are re-applied each time a Pokémon is sent in during that fight. The line "by personality" uses 4 short lines, not the dialogue bank. No Settings screen art for the six lines yet (the result carries them).
- Heated: "in the party one full stage" is approximated by a shared-history count of 2 (the bond records one per fight). The music-drop moment is not added.
