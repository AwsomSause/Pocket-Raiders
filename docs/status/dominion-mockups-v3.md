# Dominion mockups, round 3 (2026-11-19)

Kice: "Redesign all Evil-Mode UI mockups ... ask 'How can I make this UI more extravagant, visually pleasing and eye-catching?' twenty-five times. Show me every five."

- Where: `plans/evil-mode-rework/mockups-v3/` (README there). Live: https://claude.ai/artifact/5AmYQVgPqiA8GueZofd4Sm (shown to Kice after passes 5, 10, 15, 20 and 25).
- What: the 14 Dominion, 3 Chair and 10 Rotom screens merged into one page, then 25 passes on every screen. Layouts, text and numbers are unchanged from round 2, so slices already built (D1 to D3, D18, D19) still match; they only lack the new effects.
- Port: all CSS is still in the first style block for `tools/dominion/port-mockup-css.py`.
- Copy fix: Rotom chips said "Haiku"/"Sonnet" and the Key-Card vault named the key's company. Now "Quick"/"Deep" and "where the key was made"; the Debate says "No Key-Card?".
- Not built in the game yet. Slices from now on follow round 3. Earlier slices can take the effects in a later polish pass.
- Rebuild: `python3 plans/evil-mode-rework/mockups-v3/src/build.py 25`.
