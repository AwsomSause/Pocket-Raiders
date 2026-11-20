# UI redesign mockups (Pokémon-game style)

Kice asked (2026-11-19) for every screen and animation in the game to be redesigned as mockups, in 25 passes. After each pass five questions are answered: is it more extravagant and eye-catching, how is it different and better than the last pass, does it need more pages to avoid clutter, how do the Menu and Settings fit, and does it feel like a Pokémon game? Each pass must look clearly different from the one before. The answers are on the page under the screen, and in `passes.json`.

- `index.html` is the whole thing: open it in a browser. The slider picks a pass (1 to the newest), the chips pick a page, and clicking inside the screen moves around like the game would. Pages morph into each other; **Play tour** walks through all of them.
- `sprites/` holds the game art the mockups use (first frame of each sprite, copied from `public/assets/images` by `src/assets.py`).
- `sheets/` has one picture per pass with every page, and `evolution-*.jpg` showing the same pages across passes.
- `src/` rebuilds the page: `sh plans/ui-redesign/src/run.sh <pass>` builds `index.html`, screenshots every page of that pass and checks that no text is cut off, covered, overlapping or off the screen. `pNN.js` and `pNN.css` are one pass each; a pass only adds to the ones before it, so every earlier pass can still be shown.
- Screens are drawn at 960×540, the game's own size, and scale with the window.

These are mockups only. Nothing here changes the game.
