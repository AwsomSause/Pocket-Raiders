# New UI (the mock-ups, built into the game)

Kice's ask (2026-11-14): every mock-up in `pocket-raiders-mockups.zip`, in the game, behind **Settings > UI style** (New = default, Old = the earlier look). Update branch `ui-mockups`; notes per PR in `docs/updates/ui-mockups/`.

**How it is built.** The New UI is an HTML/CSS layer (`#rx`) laid over the Phaser canvas (`src/ui/redux/`). It uses the mock-ups' own CSS (`redux.css`) and templates (`templates.ts`, `screens/*.ts`) filled with live game data. Each Phaser scene stays the controller: it builds a plain model, calls `mountRedux(scene, { render, acts, overs })` (`stage.ts`), and the layer calls the scene's own handlers on clicks (`data-act`) and hovers (`data-over`). Keyboard input still goes through the scene. The layer never changes game state and never rolls gameplay RNG. `reduxOn()` says whether the New UI is on.

**Settings.** `uiStyle` (`new` | `old`) and `reduxSkin` (20 looks), settings v43. The address can force a style for one visit: `?ui=new` or `?ui=old`. An automated browser (Playwright) gets Old unless the address says `?ui=new`, because the older browser tests click the canvas, which the layer covers.

**Rule.** In New, a screen shows the mock-up look unless the player picked a specific style for that screen (screen style, map skin, reward skin, event style, plaza style, expedition or minigame look); that pick keeps its look. Battle: only the default look follows the mock-ups; every existing battle style stays in both New and Old (Kice, 2026-11-14).

**Done in New:** Title, Save Slots, Settings, list pickers, Trainer Select, Prep Desk, Run Setup, Modifiers, Seed, Starter Select, Briefing, stage map (4 layouts, legend, banner), Reward, Shop, Event, Decisions and the Yes/No box, Trade, Expedition, Minigames, Plaza dock, timed prompt window.

**Event text as a script** (`src/ui/redux/script.ts`, tests `tests/unit/reduxScript.test.ts`). Under New, an event's `intro` and outcome `text` are read as pages:
- a blank line (`\n\n`) is a page break; each page stays until Enter or a click (Esc goes back a page);
- a newline is a new line on the same page;
- `Name: "words"` is a speaker line: the name goes on the name plate, and that person stands in the picture when the event's cast has them; any other line is narration;
- a page over about 240 letters splits by itself (between lines, then at sentence ends), so nothing is ever cut;
- the choices (and a split-second countdown, if the event has one) come with the last page; results come only after the last outcome page.
Old UI is unchanged (whole text, "Read all" button).

**Tests.** `tests/e2e/newUi.spec.ts` (New: title to map, an event by clicks, paged event text, a decision with the confirm box, the style override). All older specs run under Old.

**Known limits.** Still Old-drawn inside New: Battle default look, Party, Summary, Bag, run end, overlays, cutscenes, Hub dock pages, map pop-ups, Field Trial, tournament events, egg hatch, Legendary title cards. The Plaza in New is the dock (walkable plaza: Old or another plaza style). The New UI ignores Font size and Dyslexia font. Trade shows type chips instead of the mock-up's HP bar. There is no mock-up for Hub Town.

**Fonts.** `public/assets/fonts/redux/` holds the nine font files the mock-ups use (Cinzel, Jersey 15, M PLUS Rounded 1c, Oswald, Pixelify Sans, Rajdhani, Tiny5), taken from the mock-up pack; all are Google Fonts families under the SIL Open Font License 1.1.
