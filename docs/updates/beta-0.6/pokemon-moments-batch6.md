# Pokémon moments, batch 6: rest and catch moments

**What the player gets.** At a healing stop (rest), Snorlax can doze off beside you (+8 friendship and a free berry, once per run), Pikachu and Eevee can curl up (+5 friendship), a Fire type warms the camp (+2 friendship to the whole team), a Grass type leaves a berry. When a legendary joins your party the whole team is healed and it gains +10 friendship, and a Ditto that joins rolls a talent if it had none. The moment's line is added to the stop's message.

**Built (7).** snorlax-rest, pikachu-spark-night, eevee-curl, fire-campfire, grass-sprout (rest) and legend-joined, ditto-join (catch).

**Rules.**
- One roll per party member's moment at each healing stop, seeded from the run seed, the moment, the Pokémon and how many fights are behind it. A once-per-run moment is claimed only when it plays, so a failed roll at one rest does not use up the chance at the next.
- Catch moments run when you keep a caught Pokémon (add to party or replace a member). Catches sent to the PC or released do nothing.
- The free berry is an Oran or Sitrus Berry in the bag, picked by the same seeded roll. No new RNG stream, no save version bump (the claim lives in the run's story flags; a talent uses the existing care data).
- The new code is `src/core/moments/runMoments.ts`, called from the healing stop and the caught-Pokémon decision in `run.ts`.

**Still off (3).** Ghost Story (needs a hidden event hint system), Psychic Dream (needs a way to give experience out of battle), Water Song (heals 10%, but a healing stop already heals everyone fully, so it would do nothing).

**Not hooked.** Joins by trade, gift, raid, safari or reunion do not roll catch moments yet; only the caught-Pokémon decision does.

**Tests.** `tests/unit/pokemonMoments.test.ts` (43): Snorlax once per run, a failed rest roll is not claimed, repeatable by seed, a legendary heals the team once, Ditto's talent (and an existing talent is kept).
