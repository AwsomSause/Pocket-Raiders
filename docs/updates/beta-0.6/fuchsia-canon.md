# Kanto Canon Spaces: Fuchsia City (workstream 18)

**Player gets:** In a Kanto run (Kanto setting on), the Fuchsia stage rolls three of eight spaces.
- **Polluted Factory** (6 rooms, Sludge field: your Poison moves +10%): a joke waiver, a pipe that bursts 25% of the time (poisons your lead), a Scientist, a trench of three Grimer, three valves to close, then a **Magmuk raid** (Delta Muk, Fire Cage; shields, a molten hazard, cannot be caught). Shut all three valves or the fight opens with Toxic Spikes on your side. Win: Black Sludge and a pick of Alolan Grimer, Delta Grimer or Trubbish (hidden ability).
- **Safari Land**: pay ₽500 and meet a wild Pokémon from a Safari pool (Chansey, Kangaskhan, Tauros, Scyther, Pinsir, Dratini and more). You also get 30 Safari Balls and 500 steps (saved as flags for Tauros Stampede). It is a plain event; the Safari minigame was cut.
- **Deep Savanna** (sandstorm on each first turn, ground pool, watering holes, Dust Devil, Dune Duel, camp pick: Soft Sand, Smooth Rock, Gible, Trapinch) and **Lush Jungle** (humid: Grass +10%, Fire -10%; vines, spore cloud, Hidden Ruin clues, Jungle Chief, 15% sleeping Venusaur, Treehouse pick: Miracle Seed, Black Sludge, Tangela, Foongus).
- **Warden's Gold Teeth** (found 40% Center / 35% Area 2 / 25% Area 3; Strength and a Safari Pass worth +10 balls next visit), **Tauros Stampede** (dodge safe; bait 40%, rock 25% for 2 balls; leftover Safari Balls; the first Tauros joins, each extra gives a Tauros Charm), **Fuchsia Zoo** (+1 Intel, one Rare Candy at ₽10,000) and **The Snag Test** (2-on-1 with a Rhyhorn; win the Snag Ball).

**Save:** no version bump. New optional data only: event battle kind `raid`, `addStop` can open a minigame, minigame flag `zone`, raid `special: canon`. Balls left are story flags (`kanto-safari-balls`).

**Limits:**
- The Hidden Village-style mini-games are not used; vine "tangle" slows your next fight (Speed -15%) instead of skipping a move. Dust Devil's Speed -1 is a ×0.67 Speed on the next fight.
- Sludge, humid and sandstorm help or hurt your side's moves only (battle-start rules); Steel is not exempted from anything because nothing here damages by field.
- Magmuk's moves: the raid adds Gunk Shot and Sludge Wave to its usual set; Earth Power and Flamethrower depend on its learnset. The valve puzzle is picks with odds, not a skill test.
- Losing a Pseudo Stage fight ejects you as usual; wild Pokémon caught inside the Factory are kept (the "lost on failure" rule is not built).
- Tauros Charm is Normal moves +15% (not physical-only) and uses the Muscle Band picture. Safari Pass is a story flag, not an item.
- the Jessie/James Tauros net cameo (section 12.1) and the named Shadow for the Snag Test are not built here.
