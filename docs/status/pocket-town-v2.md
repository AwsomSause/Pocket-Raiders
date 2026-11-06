# Pocket Town v2: Woodland Hamlets (2026-11-06)

Kice asked for a Pocket Town redesign like the Hub Town one, with 9 mockups
(`/mnt/project-files/promo/pockettown-mockups/pocket-1..9.png`, sources in `source/`). Kice picked **#6 Woodland Hamlets**.

- **Layout:** four hamlets (Training NW, Culture NE, Home SW, Play SE) in a forest clearing, three rows of four places each,
  joined by a cross of lanes that meets at the Fountain Glade (Town Square + the four district signs). Hub gate at the south.
- **Same places:** all 48 buildings keep their ids, rooms and themed panels; the Town Square and four district signs stay signs.
  Thirteen outdoor places now wear a matching object instead of a house (statue, planter, cherry tree, mailbox, well, ...);
  they are still `building` doors you face and press Z.
- **Builder:** `tools/hubtown/build.py` now builds both maps (`layout.py` -> hubTown.json, `pocket_layout.py` + `pocketlib.py` ->
  pocketTown.json) into one shared tile and prop atlas. `pocket.py` is gone. Hub Town output is byte-identical.
- **Bug fixed:** since #867 rebuilt the prop atlas, live Pocket Town drew no trees, lamps, fountain or two house types (their
  frames were no longer in the atlas). Both towns now come from one atlas, so that can't drift again.
- **Rebuild:** `python3 tools/hubtown/build.py <folder holding Graphics/>`, then `git checkout src/data/overworld.json`
  if Graphics/Characters is missing.
- **Known limits:** the map is bigger than before (96x88); the plaza district box overlaps the edge of the Culture hamlet, so the
  location banner there names Culture (panel themes are correct; checked per building).
