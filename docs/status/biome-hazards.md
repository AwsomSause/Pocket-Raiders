# Biome hazards, map stops, NE76-80 (Beta 0.6)

Source: pack SF127, SF135, NE76-80 (`/mnt/project-files/catalog_overhaul_pack*`). Data: `src/data/events/hazards.json` (generated: `npm run data:hazards`, tool `tools/build-hazard-events.ts`, content `tools/events/hazards.ts`).
- An event in `src/data/events/*.json` now REPLACES any older event with the same id (`src/data/index.ts`). Placement (stop, rarity, types) is copied from the old event.
- New engine bits: `damage` and `status` effects take `who` (party or lead) and `except` (spared types); new condition `partyMoveFlag` (a party move with a flag such as sound).
- Flags (run-only): bridge-tuned, fog-named, honest-lied, orchard-planted, lighthouse-marked, snow-stopped, snow-trainer-climbed, quicksand-dale, berrytree-left, center-nurse-kept.
- Limits: see `docs/updates/beta-0.6/biome-hazards.md`. Heal and revive budgets untouched (events give items out of battle only).
Tests: `tests/unit/biomeHazards.test.ts`.
- Follow-up: seven more stops patched from their old versions (`PATCHES` in `tools/events/hazards.ts`). `hazards.json` carries `"override": true`, so it also replaces same-id events from other `src/data/events/*.json` files. New `levels` target `weakest`.
