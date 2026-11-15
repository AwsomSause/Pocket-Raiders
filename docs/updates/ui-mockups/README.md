# UI mock-ups update: per-PR notes

Branch: `ui-mockups` (from `main` at `f9e5c26c`, after Beta 0.7). Kice's ask (2026-11-14): build every mock-up in `pocket-raiders-mockups.zip` into the game, behind a **UI Style** setting (New = default, Old = the earlier look). The event rebuild threads (catalog overhaul pack) also PR into this branch and use the New UI.

Every PR targets `ui-mockups`, never `main`, and adds one file here named `<pr>-<short-name>.md` with three headings:

- **Player gets:** what a player can now do or see.
- **Save:** save versions bumped (with the migration test), or "none".
- **Limits:** what is stubbed, limited or disabled, and why.

One final PR `ui-mockups` -> `main` carries the compiled update log (`docs/updates/ui-mockups.md`) and merges only on its own green CI.

## Rules for threads building on the New UI

- Owner of `src/ui/redux/stage.ts`, `kit.ts`, `redux.css`, `screens/event.ts` and `src/scenes/EventScene.ts`: the "Rebuild UI to match new mockups" thread. Ask it for changes; add your own views as new files under `src/ui/redux/screens/`.
- Event text rule (New UI): a blank line is a page break, a newline is a new line on the page, `Name: "words"` is a speaker line. See `docs/status/new-ui.md`.
- Browser tests: an automated browser gets the Old look unless the address has `?ui=new` (see `.claude/rules/tests-rules.md`).
