# Fix: Flight North and the Saffron stash no longer undo each other

**Player gets:** entering the Fighting Tournament or Sabrina's Labyrinth (Saffron) and then reaching a normal node, or a pseudo-stage loss, can no longer swap your kept Pokémon for the stashed team and leave the Saffron state half-cleared. Flight North (Vermilion) still gives your stolen party back as before.
**Save:** none. Both towns keep using `run.expansion.canon.stash`; Flight North's restore now ignores a stash that Saffron owns (`solo` set).
**Limits:** the two never overlap in one stage today; this makes it safe if they ever do. Covered by `tests/unit/canonStashCombined.test.ts` (4 tests).
