# Item catalog batches

Entries here are added to `../itemCatalog.json` when the game data loads (`import.meta.glob` in `src/data/index.ts`; `tools/catalogInputs.ts` reads them for the asset list). One file per batch, same shape as `itemCatalog.json`, so PRs never conflict on the big file. The `library3-*.json` files are written by `tools/drive/wire-library3-*.py`; do not edit them by hand.
