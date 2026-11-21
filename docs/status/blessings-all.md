# Every Legendary Blessing (71 of 71)

Source: `/mnt/project-files/catalog_overhaul_pack/expanded_notes/LEGENDARY_BLESSINGS.md` (Kice's spec: one blessing per Legendary).

## What is in
- **The whole roster:** 71 blessings in the doc's tiers (Lesser 25, Greater 23, Divine 16, Primordial 4, Origin 3), none disabled. Every one has a Communion form and a Rite, except The Renegade (its Rite is still to come) and The Empty Vessel (it takes the copied blessing's Rite). Every Primordial and Origin blessing names its Price.
- **Odds fix:** a tier with no playable blessing is left out of the roll, so its share spreads over the other tiers in proportion. Before, the empty Origin tier's 1.5% all fell onto Primordial and Kyurem showed up in about 8% of runs. With every tier filled, each tier now gets exactly the doc's share (Kyurem: 6.5% split with Mewtwo and Zygarde).
- **Palkia on:** once per region, before setting out on a stage, rearrange it from the run menu ("Rearrange the road"): any two nodes swap what waits there; paths and the final node stay. Rite, Design the Road: rearrange the stage you are on, even mid-stage.
- **New tools (all data-driven, in `blessings.json`):** Rites written as data (armed for the next battle of a kind, or heal/items at once); map sight (Cresselia's dream, Miraidon's glide); Ride/Warp (any node of the next level: Koraidon, Cosmog); badge growth (Cosmoem, Xerneas, Zygarde, Necrozma); growing blessings (Cosmog into Cosmoem, Kubfu into Urshifu, in Communion from region 2); run-level perks outside battle (Bond for Mesprit, Enamorus; Mewtwo's Price); Communion that works every battle (Tapu Koko, Tornadus).
- **New battle rules:** `statusImmuneTurns`, `foeSecondaryChance`, `statDropGuard`, `switchOutHeal`, `koBurn`, `koHeal`, `leadFirst`, `grantMechanic` (Dynamax / Tera without the key item); `battleStart` gains `terrain` and `against`; `damageMultiplier` gains `moveType`, `slot`, `hpAtLeast`, `turnAtMost/AtLeast`; `damageTakenMultiplier` gains `category`, `slot`, `fullHp`.
- Save: no version bump (new blessing-state fields `folds` and `rides` are optional).

## Known limits
Every blessing that differs from the doc is `limited`, and its `limits` text (shown on the run menu) says how. The common gaps: world-state tracks, locked places, prisons, puzzles, event re-choices, Wormholes, Memories, masks and tower choices do not exist yet, so those parts stand in with a battle perk, a boss-battle Rite or a heal. Stat effects are often built as damage multipliers.

## Second slice: Discovery, the bag, the Reliquary, starters
- **Discovery (Kice: "Follow the spec: start with 10"):** a new save draws only from 10 known blessings (Tapu Lele, Fezandipiti, Moltres, Munkidori, Tornadus, Zacian, Regidrago, Dialga, Palkia, Ho-Oh). A Legendary's Sign found in a run, or a blessing you ran with, joins the draw from the next run. `discovery: false` in `blessings.json` turns this off.
- **Shuffled bag:** inside a tier, every known blessing is dealt once before any repeats; the bag for a tier starts over when it is empty.
- Both live in the profile as `blessings: { found, dealt }` (optional, so no save bump; old saves start with an empty deck). Only the deck crosses runs: no run memory of nodes, events or fights.
- **Reliquary** (hub, Unlocks): all 71 blessings by tier; found ones show their words, the rest are empty plinths.
- **Starter interactions (section 7):** Kyogre + Water starter: moves 10% more accurate. Groudon + Fire starter: its Price waits until region 2. Virizion + Grass starter: Influence +1. Raikou + Electric starter or Pikachu: Influence +2. Each applies once, when the starter is chosen, with a journal line. The doc's Second Chance interaction is skipped (Second Chance was removed).

Still to come: Giratina's Rite (The Renegade), and the rest of section 7 where it needs systems that do not exist yet.
