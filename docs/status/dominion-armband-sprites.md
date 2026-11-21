# Dominion: armband sprites (Kice's PixelLab sheets A to Z)

- Sheets copied unchanged to `public/assets/images/dominion/armbands/<letter>.png` (256x256, 8x8 cells of 32 px; provenance in `PROVENANCE.md`).
- `src/core/dominion/armbandSprite.ts` (pure): the initial picks the sheet; the cell is the row-0 colourway nearest the team's primary colour. Colourway order differs per sheet, so each sheet's colours are in `src/data/dominion/armbandSheets.json` (made by `tools/dominion/armbands/sheets.py`).
- Drawn (`armbandIcon` in `screens/dominion/views.ts`): the crew chip (Crew File, assign page) and the Founding armband preview. Grey band stays before the Founding or for a name with no A to Z initial.
- Not changed: the band painted on the sleeve of each crew picture (`teamLook.ts`). An upper arm is 5 to 7 px wide at 80x80, so the 24 px icon can't sit on it.
- Open choices for Kice: the icon shape (row 0 now; other rows hold wings, watch, belt, ribbon styles); whether to show the icon on the Squad card and member pictures too.
- No save change. Tests: `tests/unit/dominionArmbandSprite.test.ts`, `dominionFounding` and `dominionCrew` e2e.
