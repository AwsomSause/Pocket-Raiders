# Phantom UI: the Persona / Metaphor style redesign

Kice asked (2026-11-19) for every screen and animation to be redesigned as mockups in the style of the Persona games and Metaphor: ReFantazio, over 25 passes, shown every five. Each pass must be clearly different from and better than the one before, and after each one five questions get answered: is it more extravagant, how is it better than last time, does anything need its own page, how do a Menu and Settings fit, and does it feel like a Pokémon game? The answers are on the page under each pass, and in `src/passes.json`.

Mockups only. Nothing here changes the game.

- `index.html` is the page. Open it from disk. The slider at the top steps through the passes, so you can watch one screen change from pass 1 onward. Click things on the stage (menu words, cards, commands) to move between screens the way the game would.
- `src/` rebuilds it: `python3 src/build.py`. `src/js/*.js` holds the screens (a screen can have a newer version from a later pass), `src/css/NN.css` holds the styles pass NN added, all nested under `.pNN`.
- `node src/shoot.cjs <pass>` screenshots every screen of a pass and checks that no text is cut off, off-screen or sitting on other text. `python3 src/sheet.py pNN 3` makes contact sheets. `node src/tour.cjs` records a click-through video.
- `sprites/` is game art copied by `src/assets.py` from `public/assets/images` (the director's packs); `sprites/PROVENANCE.csv` lists where each file came from. `fonts/` are open-licence Google Fonts fetched by `src/fonts.py`.
- `shots/p05-sheet*.jpg`, `p10-…` and so on are the contact sheets shown to Kice at each interval.
- Every animation stops under reduced motion.

| Interval | Passes | Big change |
|---|---|---|
| 1 | 1 to 5 | The Phantom kit (Persona 5): red, black and white on a slant. Battle command burst, a page each for moves, party, bag; stage stamp, route map, talk then choice, reward cards, Mart; pause hub and six Settings pages; every page change is a morph. |
