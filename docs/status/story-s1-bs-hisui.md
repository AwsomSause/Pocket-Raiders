# Story S1, backstory 5: Remains of the Past (`bs_hisui`)

- Data only (`src/data/story/*.json`, `text/en.json`); the S5 loader plays it. 4 characters (Captain Kuroda, Archivist Lund, Mara Kuroda-Lund, Tin), intro, the 8 events (the Temporal Disturbance is a 5-step arc that hands off to the Return Window), 3 echo events, reception modifiers, 4 ending scenes, 2 interactables, 4 Lore entries, 3 Remembrances (Rowlet, Cyndaquil, Oshawott; the Director picks one per run). Every speaking role has 3 variants; story gates stay at 0.
- Counters: `displacement` (0-10), `words` (Dictionary, 24 total), `window_state` (closed, opening, open, shut). The Old Method is the plain rules variant effect `rules_variant` (`old_method`: strong, agile, sneak).
- Endings in order: Home, Bridge, Present (two rows so staying with Displacement 4+ is not a gap), Lost as catch-all.
- Limits: the Hollow Shepherd is only named (its species comes from the S15 species PR; no character record yet). Remembrances use the base lines, not the Hisuian forms. Stand-in art; `item_hisuian_satchel`, the three encounter pools and `prop_hisuian_satchel` are named, not built; effects are data for the S5 loader.
