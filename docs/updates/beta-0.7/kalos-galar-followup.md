# Kalos Couture check and Galar Dynamax tremors (Beta 0.7 E9 follow-up)

**Player gets:**
- **Galar, The Forecast step 2 "Tremors":** once per stage, the next wild fight on a stage node has the wild Pokémon Dynamax by itself on its second turn out, for one turn, with no Power Spot; it pays on the next turn (the Overcharged line, no random numbers).
- **Step 3 "Red Cloud":** that wild Dynamax lasts one extra turn.
- **Kalos Couture:** already built in 0.6 and now covered by a test. A Flare Specialist, Executive or Leader's last Pokémon wear an accessory as a second held item (shown on entry, Knock Off and Thief take it first, a caught Pokémon keeps it). No new engine slot is needed: held items are a map.

**Save:** none. `run.expansion.tremors` is a new optional field (the stages already trembled), no version bump.

**Limits:** Only the node wild fights tremble (not fishing, dens or raids). Red Cloud's fixed Wild Area weather, rail and air step costs, the Encore chant and Dynamax Overload Shadows are still not built; the Skyline, Boardroom and other Galar/Kalos signature traits are not built. Files: `src/core/expansion/galarDynamax.ts`, one hook in `run.ts` (wild node battle), `variantLines.ts` and `battle/transform.ts` (the extra turn). Tests: `tests/unit/xeKalosGalar.test.ts`.
