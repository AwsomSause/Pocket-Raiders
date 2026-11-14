# 1268: Legendary Blessings (L1 + L2, in-run)

- **Player gets:** with the "Legendary Blessings" setting on, each run opens (after the starter) with a Side Plinth screen showing the run's one blessing. Working blessings: Ho-Oh *Sacred Ash* (once per region, after a fight, every fainted Pokémon is restored), Tapu Lele (after every fight the most hurt Pokémon heals 10%), Fezandipiti (shops charge 10% less).
- **Save:** none. Optional `run.expansion.blessing` (id, tier, influence, seen, ashRegions); old runs load unchanged. Setting `expansion.blessingsEnabled` already existed (settings 42); its default is now **off**, so old seeds play exactly as before.
- **Limits:**
  - Off by default until the 0.7 balance pass; the integration lead flips the default (and must handle the e2e specs that press Enter through Starter to Briefing, because the opening adds a screen).
  - Influence is stored (tier start value) but nothing raises it yet; Signs, Echoes, Trial, Recognition, Presence, Communion and Rites are not built.
  - Fezandipiti's extra charming event answer is not built.
  - Dialga (needs battle rewind) and Palkia (needs a map-rearrange screen) are `disabled` in `src/data/blessings.json`. The other 66 blessings are not in the data yet.
  - Empty tiers fall down to the next lower tier with a playable blessing (so Ho-Oh shows about 25% of the time while Divine is the only upper tier).
  - The opening is skippable every time (no cross-run memory, so there is no "first run on a save"). The Divine shadow and the Primordial/Origin interrupt are not built.
  - Streams `::blessing-tier::` and `::blessing-pick::` are hashed from the seed, not saved.
