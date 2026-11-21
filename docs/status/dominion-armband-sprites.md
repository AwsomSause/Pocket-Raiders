# Dominion: armband sprites (Kice's PixelLab sheets A to Z)

- Sheets copied unchanged to `public/assets/images/dominion/armbands/<letter>.png` (256x256, 8x8 cells of 32 px; provenance in `PROVENANCE.md`).
- `src/core/dominion/armbandSprite.ts` (pure): the initial picks the sheet; the cell is the row-0 colourway nearest the team's primary colour. Colourway order differs per sheet, so each sheet's colours are in `src/data/dominion/armbandSheets.json` (made by `tools/dominion/armbands/sheets.py`).
- Drawn (`armbandIcon` in `screens/dominion/views.ts`): the crew chip (Crew File, assign page) and the Founding armband preview. Grey band stays before the Founding or for a name with no A to Z initial.
- On the picture: `teamPic.ts` shrinks the same icon onto each sprite's checked arm anchor, over the painted band (which stays underneath as a fallback). The letter is too small to read there; the chips show it.
- Open choices for Kice: the icon shape (row 0 now; other rows hold wings, watch, belt, ribbon styles); whether to show the icon on the Squad card and member pictures too.
- No save change. Tests: `tests/unit/dominionArmbandSprite.test.ts`, `dominionFounding` and `dominionCrew` e2e.
