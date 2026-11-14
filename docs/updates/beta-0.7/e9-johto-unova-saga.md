# E9: Evil Team saga for Johto and Unova (Standard Cut)

**Player gets:** with the Evil Team saga on, Johto (Team Rocket's return, "The Signal Spreads") and Unova (Team Plasma, "The Frost Line") now play like Kanto. Each has 8 story events from the scripts, placed by the same quiet-node scheduler (Low 3, Normal 5, Full 8, anchor always first: The Tail Market in Johto, The Speech in Unova). Each region's world-state track now changes the world: Johto shops mark up from step 2, wild pools thin at step 4, adverts at step 5; Unova thins wild pools from step 2, shuts a Pokémon Center at night from step 3, closes roads at step 4, adverts at step 5. The Notebook track page (T on the map) works in both regions.

**Save:** none. Story events are data and the track state was already per region.

**Limits:** Standard Cut only. Intel, Operational Strength and the Siege Map do not exist, so events write story flags (`ev:rocket-return-...`, `ev:plasma-...`) instead. Track effects use the five existing fields only (no enemy changes); the script's "one evolution stage higher water Pokémon", Slowpoke tails in shops, and Unova's PC-slot and snow hazards are not built. Raids 1 to 5 for these regions and the Extended Cut climax stay Kanto-only (raids are not offered in live runs yet).
