# Shadow box, forest backdrop, battle marks

**Player gets:** (1) The Shadow command box no longer clips: tier and Heart stage share one line ("Shadow · Fallen (tier 4) · Sealed 100/100"), "The shadow tightens: it will use X." is shorter, and the text is a bit smaller for Shadows only. (2) Grass stages (Haunted Forest etc.) no longer pick the Flower Garden battleback, which looked like rainbow block noise; the other grass backdrops stay. (3) Shadow Pokémon (either side) sit in a pulsing violet aura. Variant-tagged Pokémon (Tagged, Dark Ball, Tidebound ...) get a coloured ring at their feet and a label; Couture also shows its accessory's item art on the sprite. One shared helper: `src/ui/battleFx/markAura.ts`.

**Save:** none. Presentation only; no gameplay RNG. (The backdrop pick is a seed hash, so the same run can show a different grass backdrop than before.)

**Limits:** the aura and marks are drawn from the sprite's bounds and redrawn once after the entrance bounce, so a very fast sprite swap can show them a moment late. Motion "off" draws them still. Other variant lines show the ring and label only (no per-line art yet).

**Tests:** `tests/e2e/shadowBox.spec.ts` (3-line box fits; marks drawn, screenshots), `arenaStyle` and `shadow2` unit tests.
