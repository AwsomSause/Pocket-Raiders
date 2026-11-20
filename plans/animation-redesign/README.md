# Animation redesign mockups

Kice asked (2026-11-19) for the same 25-pass mockup process as the UI redesign, but for the game's animations: everything that is animated in code rather than drawn frame by frame. Pokémon sprite frames, trainer throw frames and the move animation packs are already animated art, so they keep playing here; what is redesigned is all the motion around them (send-out, hits, fainting, catching, plates, gimmicks, events, the map and so on). Evil Mode is left out.

- `index.html` is the whole thing. The slider picks a pass, the chips pick a clip. Under the screen you can pause, replay, slow down to ½× or ¼×, and scrub through any animation; the timing strip lights up each beat as it happens. Each clip says what the game does today and what the redesign does.
- After each pass the same five questions as the UI redesign are answered (under the clips, and in `passes.json`). Each pass must look clearly different from the one before.
- The look (plates, colours, fonts) is pass 25 of `plans/ui-redesign/`.
- `REANIMATE.md` lists everything in the game that should be reanimated; `NEW_ANIMATIONS.md` lists animations the game does not have yet. `CURRENT_MOTION.md` is the survey of what the game does today.
- `sprites/` holds the game art used (copied by `src/assets.py`; animated Pokémon and trainers are exported as frame strips so their real idle frames play). `sheets/` has film strips of every clip, per pass.
- `src/` rebuilds the page: `sh plans/animation-redesign/src/run.sh <pass> [all]` builds `index.html`, photographs six moments of each clip and checks that no text is cut off, overlapping or off the screen. `pNN.js` is one pass. A pass adds clips and re-defines shared "verbs" (send, hit, faint...), which re-animates every earlier clip that uses them, so every pass can still be shown. `kit.js` is the timeline player, `fx.js` the shared effects.
- Open the page through a local web server (`npx serve plans/animation-redesign`) to see colour tints on sprites; opened straight from disk, browsers block them.

These are mockups only. Nothing here changes the game.
