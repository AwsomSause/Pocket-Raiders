# Dominion mockups, round 4 (2026-11-19)

Kice: "Redesign all Evil-Mode UI mockups ... ask: more extravagant? how does this dramatically improve on the last design? more pages for specific actions? how would a Menu and a Settings page fit? does this feel like an evil Pokémon game? Twenty-five times. Show me every five intervals. Each interval needs some significant change."

- Where: `plans/evil-mode-rework/mockups-v4/` (README there). Live: https://claude.ai/artifact/5AmYQVgPqiA8GueZofd4Sm (shown to Kice after each interval).
- What: 13 new pages (Boss Menu, Settings, Assign, District file, the Boss's board, command wheel, page shutter, order cut-in, Job done, Job botched, Hero interrupt, morning paper, hijacked broadcast) and a villain look (the Nova livery) on all 27 old screens.
- Old screens keep their layouts, text and numbers, so built slices still match. Small changes: Q opens the wheel everywhere; the Crew File pages with the arrow keys; Rotom Settings lists Dominion and Effects & motion.
- Not built in the game yet. New slices should follow round 4; the Menu, Settings, wheel and result pages need their own slices.
- Rebuild: `python3 plans/evil-mode-rework/mockups-v4/src/build4.py 5` (reads `mockups-v3/index.html`).
