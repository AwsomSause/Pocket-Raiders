# #1279 Rewinds (INSTRUMENTALITY L3)

**Player gets:** with Settings > "Rewinds (test)" on, a Rewind button in singles battles takes the fight back 1 to 5 turns, once per stage. Everything returns exactly as it was, but the dice keep rolling, so the turns play out fresh. If the whole team faints, the rewind happens automatically, before the VS Recorder, Safety Net or checkpoints.

**Save:** none. There's a new optional `run.expansion.rewind` block (old runs have none) and an optional `settings.expansion.rewinds` field (default off).

**Limits:** off by default, and no blessing grants rewinds yet (L1/L2 will call `grantRewinds`). The stage rewind (`rewindStage`, for Dialga's Rite) is built but not shown to the player yet. No Rewind button in doubles or triples, though the wipe rescue still works there. While on, the save holds one extra copy of the run. Celebi's "revisit an earlier stage" would need older stage snapshots, which aren't kept.
