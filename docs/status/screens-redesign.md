# Screens redesign (Kice, 2026-11-02)

Kice picked looks for 21 screens from the mock-ups in /mnt/project-files/redesign/ (build plan: /mnt/project-files/plans/screens-redesign-build-plan.md).

## Slice 1: shared screen-style system
- `src/core/presentation/screenStyles.ts`: every screen's picked styles, which are built (`SCREEN_STYLES_READY`), and `screenStyleOf`, which returns a pinned style, the original look, or a random built style chosen by a hash of a per-visit salt (never gameplay RNG, so a reload shows the same look).
- Settings v16 `screenStyles` (default {} = Random everywhere), migration and test.
- Settings > Display gets a "<Screen> style" entry (Random, each built look, Original) as soon as a screen has a built style.
- Known limit: no styles are built yet, so every screen still shows its original look.

## Slice 2: battle styles (all 10 of Kice's battle picks)
- `src/ui/battleStyles/`: one file per style. Each style sets the databoxes, message bar, command window and buttons, and can add an overlay and an opening flourish. BattleScene keeps every rule and input.
- Styles: Wii Channel, Enhanced Classic, Cyber HUD (scanlines, corner brackets), Arcade Versus (VS splash), Card Hand (moves as a hand of cards), Ring Command (moves in a ring of bubbles around your Pokémon), Stadium Broadcast (Galar League TV: LIVE bug, commentary ticker, Dynamax-red glow, "Live from ... Stadium" opener), Cinematic (letterbox, episode title), Shonen Versus (speed lines, VS!! clash), and Ink Duel (rice paper, brush outlines, red seal, brush-stroke opener).
- Each battle picks its look from a hash of the run seed and progress, so a reload keeps it. Settings > Display > "Battle screen style" cycles Random, each style, then Original. The old "Battle UI style" setting applies only to Original.
- Openers respect battle animations: with animations off they're skipped, and reduced effects lighten the shonen burst.
- Mock-up faithful (Kice 2026-11-02 "make them look practically identical to their mock-ups"): each style's layout (`BattleLayout`) copies its mock-up's coordinates: where the databoxes, message, menus, tabs and move details sit, plus per-style extras (types line, team balls, portraits, inline level, gold arcade HP gauge, Wii combined move grid, fanned cards, ring bubbles, broadcast lower-thirds, letterbox subtitles, ink silhouettes).
- Enhanced Classic uses the Pokémon Memories pack's databox, command window and Poké Ball art (`pack.memories.battle.*`, provenance rows in `docs/quality/asset-provenance.md`).
- Wii shows the moves and the other commands on one screen; picking a move tile uses it straight away (it opens the move menu and confirms the same move, so all move rules still apply). Off for doubles and while a Z-Move is chosen.
- `Menu` takes an optional `glass.paint` (a custom button painter), `place`, `angle`, `lift`, `align`, `inset`, `middle`, `focusColor` and `cursor: 'none'`. `Bar` takes an optional HP colour set.
- Known limits: the Bag, party and target pickers inside a battle still use the original look. The broadcast ticker and VS bars show names, not live HP.
- Tests: `tests/e2e/battleStyles.spec.ts` pins each style, checks it's the one drawn, opens the command and move menus, and plays a turn with no console errors.
