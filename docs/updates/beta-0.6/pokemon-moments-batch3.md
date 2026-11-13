# Pokémon moments, batch 3: low HP, a KO, a hit taken

**What the player gets.** Pokémon react to the fight. Gyarados rages below half HP, Snorlax falls asleep and heals, Dark types go all in with extra crits, Pikachu and Charizard celebrate a KO, and Rock, Steel, Ice, Bug, Grass and Normal types toughen up after a super-effective hit. The message box says the moment's name, a short line and what it did. Major moments (Gyarados, Snorlax) can play the existing flourish when the Moment Director allows a cinematic.

**Built (34 moments):** 18 low-HP, 8 KO, 6 super-effective-hit-taken, 2 critical-hit-taken.

**Rules.**
- Checked once at the end of each turn from what just happened. The effect starts next turn. At most two play per turn (low, then KO, then hit taken).
- A low-HP moment plays when HP is below the moment's own percent. Each moment's limit is spent before its roll.
- Same seeded roll as before; no save version bump (the new `momentCrit` volatile field defaults to 0; the new limits live in battle story effects and run flags).
- New effects: `critStage` (extra crit stages, can fade), `sleepSelf`, `weather` (hail for Ice), `healNowPct`, and a weather requirement (Grass healing needs sun).

**Limited (wording matches what happens).**
- Fire Last Stand and Steel Adamant: the stat boosts only (no burn or stat-drop immunity yet).
- Hunter Pack: the Pokémon in front gets Atk +1 for 2 turns (not the whole team).

**Still off:** Bug Swarm (needs a "next Bug move +25%" hook), Poison Toxic Blood (needs a contact-poison hook), Gengar Cackle and Ice Chill KO (they need to land on the next foe).

**Tests.** `tests/unit/pokemonMoments.test.ts` (26 pass): data checks, Gyarados low and once per battle, Snorlax nap, Grass needs sun, KO moment, super-effective moment, timed crit fade, repeatable by seed.
