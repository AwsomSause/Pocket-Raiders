# Kanto Canon Spaces: Mt. Moon (workstream 18, slice 4)

**Player gets:** Mt. Moon is always on the Pewter map in a Kanto run (Kanto setting on). Enter (or leave before any fight) and cross 7 nodes: a wild encounter, a Hiker, another wild encounter, **Clefairy Moon Watching** (three prompts; three right answers give a free Clefairy that knows Moonblast, two right is a 50% chance, otherwise a Moon Stone), **Fossil Recovery** (a Scientist with Magnemite, Voltorb and Koffing; win for one random fossil, 70% a Kanto one), the **Gem-Stone Mine** (a Fighting-type move cracks a deposit open for a random evolution stone plus a Rock guardian; 10% a Gem Vein with a Rare Candy and a Metal Coat; or rent a pickaxe for 200, no guardian) and the way out.

**Save:** none. New data-only pieces: condition `partyMoveType`, `teachMove.species`.

**Limits:**
- The Rocket-allied Scientist (+1 level) and the grateful bonus fossil depend on Raid 1 (Mt. Moon Fossil Dig), which is not built; the Scientist is always the plain one.
- The Mine has no per-move skill prompt: a Fighting-type move in the party is enough, and the stone table is as the pack gives it (Moon 22, Fire 14, Water 14, Thunder 14, Leaf 14, Sun 12, Everstone 10).
- The Rock guardian pool is Geodude, Onix, Rhyhorn and Alolan Geodude; Omanyte shells and Delta rock forms are left out. The "Moon Stone shard" is a Moon Stone.
- The "second fossil pick with Old Amber" is not built (the Museum already trades the Amber for the quiz).
- Shadow II hooks: the flag `xk-fossil-registered` is set when you win the fossil and when you register one at the Museum. Their Pokémon Tower and Snag Test hooks come with those spaces.
