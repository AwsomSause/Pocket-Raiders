# Story S1, backstory 4: Aether Experiment (`bs_aether`)

- Data only (`src/data/story/*.json`, `text/en.json`); the S5 loader plays it. 5 characters (Dr. Okoro, Warden Castellan, Odile, Proto, Iris Vandermeer), intro, the 8 events (Proto is a 4-step arc, the Audio Logs a 3-step arc, the Decommission Order leads to a 2-step captive arc or a chase), 3 echo events, reception modifiers, 4 ending scenes, 2 interactables, 4 Lore entries, Ralts and Porygon Remembrances. Every speaking role has 3 variants (Dr. Okoro's lines vary by the hidden `premise` flag: true, partial, false, inverted); story gates stay at 0.
- Counters: `telemetry` (0-5), `humanity` (0-100, hidden). The org is the original "Aether Division of the Halvard Institute", never shown with the Alola Aether (lore text says so).
- Endings in order: Own Choice, Proof (two rows: premise false or inverted), Integration (any premise at Humanity 40+, so no gap), Dissolve as catch-all.
- Limits: stand-in art; `item_concordance_core`, both encounter pools and `prop_zero_stitch` are named, not built; effects are data for the S5 loader.
