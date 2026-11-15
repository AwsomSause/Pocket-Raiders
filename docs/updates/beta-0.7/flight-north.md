# Flight North, rebuilt: the Bug-type and its return (Beta 0.7)

## Player gets
- **The check:** unchanged 50%: Jessie, James and Meowth take the whole party. The stage (levels 5 to 20) is rewritten with longer, warmer text: a Caterpie or Weedle knocks a Spearow out of the sky and is your only Pokémon.
- **It is a character:** you name it (three names or "say nothing yet", it can be renamed in Care), it has an idle shiver, a thin bright cry and a small victory hop in the text, and five beats raise its Bond ("trust"). It evolves along the way; the Venomoth fight adds the mid-battle evolution rule (`evolveMid`) and keeps the shiny rescue.
- **The return (Second Wind):** after it leaves, if the run is later lost, the screen cracks, cracks again and shatters, and it comes back as Mega Beedrill or a Gigantamax-sized Butterfree. The whole team is revived at full HP and it fights alongside for that battle (the existing ally strike, 6 strikes). Once per run, its own song id `bgm.flight_north`.
- **After the battle:** keep it (it always holds its Mega Stone: Beedrillite or Butterfreite Z; it knows **North's Wind**: revive one fainted member at 50% HP, then +1 Sp. Atk and Speed, 1 PP so one charge per battle, refilled only by a rest) or release it (its silhouette crosses the sky in later regions). **Secret:** Bond at 255 and it refuses to leave and joins without asking.
- **Rescue order:** the return goes before Second Chance; once Flight North is in a run, Second Chance cannot trigger.

## Save
None. Optional `run.expansion.flightNorth` and `battle.flightNorth`; older saves load as before (tested).

## Limits
- No composed song yet: `bgm.flight_north` falls back to the usual battle song. No new art: the return uses the existing `beedrill-mega` and `butterfree-gmax` species.
- The idle animation and victory hop are described in text; no new animation.
- The sky silhouette is a helper (`skySilhouette`) and is not drawn on a screen yet. A "released" Bug-type is not met again.
- The return is available only in a Kanto run that played the stage. Odds shifts for the 50% check are not built.
- Retired by #1292 via `RETIRED_SPACES`; this build replaces it, so remove `cs.kanto.vermilion.flightnorth` from that set when #1292 is in.
