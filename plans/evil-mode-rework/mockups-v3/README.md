# Dominion mockups, round 3

All 27 Evil Mode (Dominion) screens on one page: the 14 Dominion screens (s0 to s13), the 3 Chair screens (c1 to c3) and the 10 Rotom screens (k1 to k10, slices D18 to D25). Kice asked (2026-11-19) for every screen to get 25 more passes, each asking "How can I make this UI more extravagant, visually pleasing and eye-catching?". Every pass touched every screen. `passes.json` lists what each pass did on each screen, and the page shows the same list under each screen.

Live copy: https://claude.ai/artifact/5AmYQVgPqiA8GueZofd4Sm

- `index.html` is the page. Open it in a browser; sprites load from `sprites/`.
- All styles stay in the first `<style>` block, so `python3 tools/dominion/port-mockup-css.py plans/evil-mode-rework/mockups-v3/index.html src/ui/redux/screens/dominion/dominion.css` ports them like before. The new classes are listed at the end of the block under `/* ===== v3 pass N ===== */`.
- `src/` rebuilds the page: `base.html` is the round-2 page (the old Dominion and Rotom mockups merged, unchanged), `passes.py` holds the 25 passes, `build.py` applies them (`python3 src/build.py 25`).

What a slice needs to copy (screen layouts, text and numbers are the same as round 2):

| Pass | What to build | Classes |
|---|---|---|
| 1, 2, 5, 19, 22 | Chrome: gold seams, foil title tab, tab gem and beam, dressed text boxes, gold-leaf headers, screws | `.top::after`, `.ttl::after`, `.tabs>.on::before/::after`, `.tbox::before`, `.who::after` |
| 3, 12, 13, 15 | Buttons breathe, the picked thing has an orbiting spark, striped meters, holographic foil | `.cta`, `.ch.on::after`, `.mt::before`, `.pnl.gild` |
| 4, 7, 10, 17, 18, 20, 25 | One overlay set per screen: haze, bokeh, colour grade, focal spotlight, edge glow, gold frame, sunburst | `.haze`, `.bokeh`, `.grade`, `.focus`, `.edgeglow`, `.orn`, `.finale` |
| 6 | Rim light on every sprite, coloured by the screen's key light | `.kl-*` on the stage, `.st .spr` |
| 8 | Chunky 3D numerals for big numbers | `.n3d`, `.dial>b`, `.net` |
| 9 | Particles made for each screen | `.pts`, `.pt.*`, `.pt-flash`, `.pt-siren` |
| 11 | Panels rise in one after another when a screen opens | `@keyframes enter` |
| 16 | Team Nova N pattern on panels | `.pnl` background |
| 23 | Rotom naming: no model or company names on screen | "Quick" and "Deep" voices, "Key-Card" |
| 24 | Background drifts like a slow camera pan | `@keyframes kb`, `chk` |

Rules kept: player-facing text says Rotom, never Claude or AI; every animation stops under reduced motion (the game's motion setting); overlays never take clicks (`pointer-events:none`); the battle screen is not in this set and gets no new styles.
