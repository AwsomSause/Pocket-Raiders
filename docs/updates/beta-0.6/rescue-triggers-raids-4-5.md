# Rescue triggers and Raids 4/5 (E5b + R9 wiring)

**Player gets:** letting a Team Rocket (or any team with a holding site) operation through, by choosing "Leave it alone" or by leaving the region with it still running, now costs you 1 to 3 bench Pokémon (never the last two). The team leaves its receipt, the holding clock starts, and about ten stages later your rival's Rescue offer opens on the map. Shutting an operation down impounds nothing. Losing Raids 1, 4 or 5 also applies the fine, confiscation, reputation, Shadow and setback costs their scripts list.
Raid results for Kanto Raids 1 to 5 are recorded with their lever (broken / weakened / dented / strengthened / unchanged). Raid 4 (Vermilion Docks) opens after Raid 2; Raid 5 (Safari Night) opens after Raid 3 or at world-track step 4. A Raid 2 loss impounds Pokémon the same way.

**Save:** no version bump. Results live in `run.expansion.raids` (`n1`..`n6`); levers write only `siege`, `apex`, `cast` and `cut` (phase mods). Old saves have none of it and load unchanged. Round trip is tested.

**Limits:**
- The playable Raid formats (PS-RAID: floors, objectives, the fights) are not built (Kanto saga slices 14 to 16). Raids 1 to 5 have the rules, gates, results and levers, but nothing in a run offers them yet, so no run can reach Raid 4 or 5 today. The live source of lost raids is the existing evil-team operation.
- Raid 3 has no failure list in the script. C6 Hostage (Raid 2) needs the climax Rescue objective, which is not built, so it is not applied.
- Costs, as built: C2 loses 40-60% of money; C3 takes 2-4 bag items (never Key Items; Pokémon-held items are not touched); C8 is plaza reputation -15 (the only reputation the run has; the team's own regard is not built); C10 gives one random party Pokémon Shadow taint at Heart Gauge 80-95; C11 makes the next 3 battles pay 25% less money (other rewards are not cut).
- The track (E2) is not built: Raid 5's "step 4" gate reads `run.expansion.track.step` if it exists, else 0. Raids do not write the track; the track reducer will read the raid records.
- "Rival handed over" (Stand With Them, E8) is not built, so nothing impounds on it.
- Bounds are enforced when read: total OS change within +/-2, gauntlet and each phase mod within +/-1.
- Impound count (1 to 3) is a hashed roll of seed + region + label; no random stream is touched.
