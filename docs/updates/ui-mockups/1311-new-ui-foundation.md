# #1311 New UI: foundation and the first screens

**Player gets:**
- Settings > **UI style**: **New** (default) or **Old**. New draws the screens the way the mock-ups do; Old is the game as it looked before. A second setting, **New UI look**, picks one of the mock-ups' 20 looks (colours, window shape, fonts, layout).
- In New: Title, Save Slots, Settings, every list picker, Trainer Select, Prep Desk, Run Setup, Modifiers, Seed, Starter Select, Briefing, the stage map (four layouts, legend, stage banner), Reward, Shop, Event, Decisions (learn a move, catch, PP Up, lead, signature picks), the Yes/No box, Trade, Expedition, Minigames, the Plaza dock and the timed prompt window.
- Long event text is read page by page. Each page waits for Enter or a click; the choices come with the last page, and the results come only after the last page of the outcome text. A line written as `Name: "words"` shows that person's name on the name plate.
- A screen keeps its own look if the player picked a style for it (screen style, map skin, reward skin, event style, plaza style, expedition or minigame look). All battle screen styles stay as they are in both New and Old.

**Save:** settings v43 (`uiStyle`, `reduxSkin`); migration test in `tests/unit/settingsV20.test.ts`. Run and profile unchanged.

**Limits:**
- Still drawn the Old way inside New (next PRs): Battle default look, Party, Summary, Bag, run end, overlays, cutscenes, Hub dock pages, map pop-ups (bracket, rival report, dossier, field notes, node menu), Field Trial, tournament events, egg hatch and Legendary title cards.
- The Plaza in New is the mock-ups' dock; the walkable plaza stays in Old and in the other plaza styles.
- The New UI does not follow the Font size and Dyslexia font settings yet.
- Trade shows type chips where the mock-up shows an HP bar; the catch screen shows the short summary with the full sheet on I.
