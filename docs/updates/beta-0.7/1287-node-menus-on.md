# Node Event Menus: on by default, up to 3 picks

**Player gets:** node menus are on for new runs (Settings > Node menus turns them off; still off in Boss Rush, Speed Clear and Time Attack). Each stop allows up to 3 picks (Kice, 2026-11-14), and the "picks left" line is gone from the menu.

**Save:** none (a settings default and a data number).

**Limits:** `npm run sim:node-menus -- 30`: menus off 34.8 battles, on 36.1, 0 errors. The sim bot plays one micro card per stop, so it does not yet measure players who use all 3 picks (more small heals and items per stop). Picks never carry over between stops.
