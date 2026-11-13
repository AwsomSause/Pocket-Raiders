# Beta 0.6: INSTRUMENTALITY, "You Are (Not) Alone" (update log)

This ships to `main` as ONE PR from branch `beta-0.6`. Each piece below has its own fragment in `docs/updates/beta-0.6/` (Player gets, Save, Limits); this page is the summary. Source of truth for the design: `docs/plans/instrumentality/`.

## Save versions
- Settings 42 (adds `settings.expansion`, every Beta 0.6 switch with its default) and run 43 (optional `run.expansion`). Nothing else bumped: pacing, rescue, raids, the Kanto track, canon spaces, the Extended Cut, rival state, field notes and so on all live inside those optional blocks, so old saves load unchanged (migration and round-trip tests in `expansionFoundation.test.ts`).
- With every new switch off, a run plays as in Beta 0.5.

## What players get

By the numbers: 752 new events, 136 Pokémon moments, 143 cast characters, 110 special Pokémon, 58 special Shadows, 11 new items, 14 variant lines (full list: the patch notes).

**Fairer, tougher runs**
- Rarer Steel/Ghost/Psychic and Ice/Fairy/Dragon wilds, less wild repetition, fairer trainer pools (balance-a).
- Each battle allows 10 healing items plus 6 revives, for you and for bosses, rivals, the Elite Four and Champions (battle-budget-gimmicks). One transformation per gimmick per side.
- Enemy level ceiling (level-ceiling) and Rally, which stops one Pokémon sweeping a whole boss team (rally).
- Stage pacing: 4 to 5 trainer fights a stage with one ace trainer, doubles from region 2, E4 counter-picking, and Evolution Encounters, with Settings switches (1148, pacing-followups).

**Triple Battles**
- Real three-on-three battles in Kice's picked layout, Shift for edge Pokémon, smarter foes, a Battle Factory format and triple event scenes (1147, 1154, 1168, triples-screen, triples-screen-prep, triples-event-scenes).

**Rivals and the Friend**
- Rival core: locked identity, Lead -3 to +3, Marks and feelings. Rival presentation: tier-5 AI, a 528-line dialogue bank, presence and Pseudo Stages, the Rival Report, Race / Team-Up / Ambush, and the Friend with a real team and finale Assist. Rival questlines. (rival-core, rival-presentation, rival-wiring, rival-questlines.)
- Rival Rescue Plan: when a raid failure impounds your Pokémon, your rival comes with a plan; screens, map node, Door and Cage fights (rescue-plan, rescue-screens, rescue-map-node, ps-rescue-fights, rescue-triggers-raids-4-5).

**Kanto, the Evil Team saga (first full region)**
- Data pipeline for the whole pack (143 characters, 110 special Pokémon, 58 Shadows, 12 Apex, 80 events, 20 raids), the cast Dossier screen and Kanto's signature traits (1141, cast-variant-lines-part1, dossier, kanto-traits, kanto-traits-scenes).
- All 14 variant lines wired and met in play (variant-lines-part2 to part6).
- The Kanto Track "The Ledger Fills" with a Notebook page, story events and the quiet-node scheduler, 104 run events, events feeding the Siege Map and the Colossus (kanto-track, kanto-story-events, kanto-run-events, kanto-events-siege).
- Raid results, levers and consequences are recorded for Raids 1 to 5; the Magmuk, Kaiju, Celadon Hideout and Colossus fights are playable, while Raids 4 and 5 cannot be reached in a live run yet (rescue-triggers-raids-4-5, 1235).
- Extended Cut: Kanto's longer climax runs Siege Map, Blackout, Gauntlet, Duels, Breather, Set piece, Giovanni, Colossus, Convoy, Resolution, with Second Shot (first loss retries from the last save point, second loss gives the worst Resolution and the run goes on). All seven wide formats are built (1170, 1178, 1187, 1210, 1215, 1220, extended-cut-kanto).
- Foresight Tax (Oracle Sabrina) (1225). Shadow Pokémon II: tiers, an announced obey check, purification keys, heart scars (shadow-ii). Stand With Them: join the team, reputation ladder, climax and verdict (stand-with-them). Grand Arc start: Cipher, Rocket Remnants, Team Snag'em (grand-arc-start).
- Kanto Canon Spaces, town by town: Pewter, Veridian Forest, Mt. Moon, Viridian and Indigo Plateau, Cerulean, Vermilion, Lavender, Celadon, Saffron, Fuchsia, Cinnabar (the canon-* fragments, 1167 to 1232). Biome hazards and map stops, camp and rest scenes, and a choice-memory system so events remember earlier choices (biome-hazards, camp-rests, choice-memory).
- Field Notes screen (F on the map): Bestiary Book with Type Tabs (field-notes).

**Pokémon moments**
- 129 catalogued species and type moments; batches 1 to 7 plus the second pack are built (Failure Will (NOT) Be Tolerated, last stands, battle-start, switch-in, low-HP, KO, rest and catch moments). The rest stay disabled (pokemon-moments-*).

**Minigames and input**
- The 14 original minigames and the 4 Battle Frontier games get a fourth Master tier (mg1-harder-minigames).
- Removed again at Kice's call: the new Beta 0.6 minigames (Snake, Sled, Triage, Orchestra, Stealth, three arcade cabinets, Debate, Safari Trek, Safari Land, picture boards). The 34 existing minigames stay. Fuchsia's Safari Land is now a plain paid Safari-pool wild fight (minigames-removed).
- Microphone input, off by default; a button always does the same thing (mic1-microphone-input).

**Fixes along the way**
- Short-campaign stage pacing, the Psychic trainer trait renamed (no more clash with Sabrina's Foresight), Shadow command box and backdrop fixes, the Trade Stop e2e wait, the Flight North / Saffron stash overlap, asset provenance rows (fix-*, trades-e2e-wait).

## Known limits
- Not in 0.6, planned for 0.7: Blessings (incl. the Legendary Blessing Side Plinth screen), Mythical Promises, Ultra Beasts, Second Chance, Heated moments, the other eight regions, the finale and Region of Doom.
- Debate (the last wide format) is built but cannot be reached until Paldea exists. The wild stone chance stays off the Settings screen. Capture Styles stay disabled. Several Kanto details (listed in each fragment's Limits) are simplified; Marrowmother and M2 (Apex) are not obtainable yet.
- Balance: the X1-lite sim (30 seeded runs) shows no regression against Beta 0.5 (wild losses 5/30 vs 2/30 on main, a small sample). The full balance pass (X1) is still to do.
