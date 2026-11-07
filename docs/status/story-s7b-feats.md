# S7b: the other 8 Impossible Feats

- All 16 Feats in `core/story2/feats.ts` are now built (S7a had 8). New engine hooks (`engine.ts`, `tryFeat`, still no RNG):
  - **Between Them and It** (doubles): the partner takes a hit that would knock out its ally, at half damage.
  - **Break the Rule**: the partner's attack goes through an ability that would block it (absorbs, Levitate, Wonder Guard, Soundproof, Bulletproof). Once a run per ability (`brk:<ability>` in the Charge ledger).
  - **Unmask the Illusion**: the partner's hit ends a foe's Illusion or Disguise (Disguise soaks nothing). Transform copies are not undone (no clean revert in the engine).
  - **Spark Shared**: rides on any Feat fired in a double battle; the partner's ally gets +1 to every stat. Limit: it lasts until the ally switches out, not 2 turns.
  - **Call of the Wild** (Viridian backstory, or fact `rapport` 6+; singles): at turn start with the partner at half HP or less, a wild Pokémon hits the foe for a fifth of its HP (never the last HP point).
  - **Old Tactics** (Ex-Criminal): the partner ignores the entry hazards once.
  - **Resonance Pulse** (Aether): a foe's status on the partner is cancelled and the partner heals a tenth.
  - **Old Style Surge** (Hisui, the "Remains of the Past" backstory): at half HP or less, one attack hits 1.5x as hard (the Strong Style burst).
- Tests: the `storyFeats.test.ts` scenario suite now forces all 16 in Gym, Elite and Champion fights (58 tests): each fires once, no softlock, the save still parses.
- No save bump. Not browser-checked.
