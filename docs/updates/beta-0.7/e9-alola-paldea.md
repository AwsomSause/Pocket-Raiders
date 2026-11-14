# E9: Evil Team saga, Alola and Paldea (Standard Cut)

**Player gets:** Eight story events in Alola (Team Skull and the Aether Foundation: Yo, The Aether House, Rent, The Trophy Room, The Gallery, The Consultant, Recon, The Pelago) and eight in Paldea (Team Star: The Flyer, Clive, Sandwiches, Read Receipts, Admissions, The Old Hallway, The Applicant, Shop Class). They use the Kanto scheduler (one anchor per region: Aether House and The Flyer), appear only with the saga on, and fill the Dossier. Alola's world state "Noise and Silence" thins the wild pool by a fifth from step 3. The Notebook track page works in both regions.

**Save:** none (story flags use the existing flag counters).

**Limits:** Paldea's track "Attendance" has no mechanical effects yet (page text only). Alola track steps 1, 2, 4, 5 are page text only. Script traits (Hype Man, Reluctant Hand, Old Habits), the rhythm prompt, Clive as a raid ally, Kieran's Phase 2 duel, and flags that change later phases (Second Place, Tall Tale purification) are set but not read yet. Raids 4 and 5, the Extended Cut, the forced-switch boss, Debate unlock, liaison and ROM for these regions are not built. Special Pokémon with no Field Notes id (the `ss.` shadows) are not noted. Team variant lines were already wired.

Files: `tools/events/expansion/{alola,paldea}.ts` (`npm run data:xe-alola-paldea`), `src/core/expansion/trackRegions.ts`, `cast/meetRegions.ts`, test `tests/unit/xeAlolaPaldea.test.ts`.
