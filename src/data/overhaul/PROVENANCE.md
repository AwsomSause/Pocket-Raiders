# Provenance: src/data/overhaul/

- **Source:** `overhaul_content_pack_2.zip`, uploaded by the director (Kice) on 2026-11-06 for "The Overhaul" (Beta 4.4 2 and 3). The pack says all text is original or paraphrased; nothing is copied from the games, anime or manga. Species, move and type facts come from `@pkmn/dex` data.
- **How it got here:** `npm run data:overhaul -- <unzipped pack folder>` (tools/import-overhaul-pack.ts). The script fixes the problems found in the review and matches names to the game's data. Every fix, count, source-file hash and unmatched name is in `docs/quality/overhaul-import.md`.
- **Not committed:** the raw pack (about 7 MB). The pack's own build scripts (`tools/` in the zip) are not needed to rebuild these files.
- **Status:** every file is `disabled` (data only). A later Overhaul slice changes a file's status when a game system reads it.
- The repo stays private (D4).
