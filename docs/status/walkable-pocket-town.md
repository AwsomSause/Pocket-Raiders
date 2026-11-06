# Walkable Pocket Town (Appendix S.5, slice 1 of 2)

Pocket Town now works like Hub Town: you walk your Pokémon around a tile map, walk up to a door and press Z, talk to townsfolk.

- **Engine reuse:** `HubTownView` takes a map (`map`, `mapId` options; Hub Town is the default), so there is no second walking system. `minimap.ts` and `townTime.ts` read the view's map. Map data: `src/data/pocketTown.json` (`POCKET_TOWN` in `core/hubTown/schema.ts`), built by `python3 tools/hubtown/pocket.py`. It re-uses the existing tile and building atlases, so no new art and no PokéMemories source needed.
- **Layout:** 72 x 72 tiles. Road cross with a fountain plaza in the middle; four districts of 12 doors: Training Grounds (NW, dirt ground), Culture Quarter (NE, stone), Home Gardens (SW, grass), Play Street (SE, flowers). District signs and the Town Square are signs at the plaza (face and press Z). The south arch asks before going back to Hub Town.
- **Buildings:** all 48 keep their ids, actions and `profile.town` data (core/town untouched). Door plaques show names. The hidden Developer Room door says why it is locked until it unlocks.
- **Town directory:** Esc opens the old building list with fast travel (picking a building jumps to its door and opens it) and a "Back to Hub Town" row.
- **Townsfolk:** 10 walkers (`ui/hubTown/pocketFolk.ts`), one zone each; their lines react to your last run (`pocketChatterFor`).
- **Sky:** last run's weather tint, day/night light and lamps (`drawDaylight`), season prop in the plaza, fireflies at night, furniture, pets and the cursor trail stay.
- **Saves:** no save change. Player spot is remembered per session only.
- **Tests:** `tests/unit/pocketTown.test.ts` (every door reachable from the entrance, ids match core/town, 12 doors per district), `tests/e2e/town.spec.ts` (walk, open a door, directory, gate back to Hub; 1280x720 and 390x844).
- **Limits:** no Settings toggle for the directory (Esc always opens it). One shared music track (no per-district loops). Story visiting cast (rivals, Vance) waits for the story track. Buildings share six building pictures, told apart by plaques.
