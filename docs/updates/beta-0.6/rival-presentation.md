# Rival presentation (R4-R8, R11)

## Player gets
- **Tier-5 rival AI.** A registered rival names a win condition (sweep, weather or stall) before the fight, remembers every move and Pokémon you have shown it this run, plays the move that punishes your switch about half the time (30-70%, nudged by how often you really switch), and solves 2-v-2-or-smaller endgames. Personality only changes tie-breaks, never skill. It draws no random numbers.
- **528-line rival dialogue bank** for 8 personalities. Pokémon lines are built at runtime (opener + type line, plus a category line), "An Eevee" not "A Eevee". One Pokémon line per meeting, no repeats until a species' lines are all used.
- **Presence.** 2 guaranteed meetings per region plus a 50% third (ahead: waiting; behind: catching up). Pseudo Stages: main rival 65%, Friend 30% of the rest; Race, Team-Up, Already There, Ambush (never under 50% party HP). Catch step-in 3%, once per region.
- **Rival Report** pop-up on the map (key R, or click the tag). Shows Lead, Marks, top feelings, meetings and what the rival has seen of you.
- **The Friend**: one per run, in about half the regions, a different personality from the main rival, never betrays, four scenes (Meet, Mid, Errand, Eve), postcards, at most 1 extra Assist (total cap 4 Standard / 6 Extended).
- **Witness the Rest** on the run-end screen: cards from this run's rivals, always ending with the Champion card and a final card.

## Save
- No version bump. New optional fields only: `run.expansion.rival[id].ledger / bankUsed / presence` and `battle.rivalBrain`. Older saves load unchanged (tested). Run 44 and profile 21 stay free.
- Per run only. No cross-run rival memory.

## Limits
- Tier 5 applies to registered rivals (the main rival from its first fight). Pity (R10) still drops it to the normal AI.
- The pure rules for presence, Pseudo Stage forms, step-in and the Friend (`presence.ts`, `friend.ts`) are in and tested; the Friend's scenes and Pseudo Stage forms are not yet scheduled into live map stages (needs the story2 world-scene hook), so only the AI, ledger, Rival Report and Witness cards are visible in play today.
- Counter-picking limits (`counterSlots`, `mayCounter`) exist but the team builder does not call them yet.
- Bank lines are loaded by `pickSpeciesLine` / `pickContextLine`; callers in scenes are still to be wired.
- Win-condition and "trade sense" are light: the plan nudges scores by 10-30%, it does not plan switches.
