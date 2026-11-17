# Legend signature item art

- 111 pictures, one per Legendary, Mythical and Ultra Beast species (base forms only; forms share it, six story-original species included). 32x32 PNG, made with PixelLab (`create_image_pixflux`, transparent), in `public/assets/images/items/legend/<speciesId>.png`, asset id `item.legend/<speciesId>`.
- Data and loader: `src/data/legendItems.json`, `src/core/legends/items.ts` (`legendItemIcon`, `legendItemName`). Test: `tests/unit/coLegendItems.test.ts` (every species covered, 32x32, Blessings use them).
- The 11 Blessings now show their species' own item as the object picture. Art only: no new item rules, no RNG, no save change.
- Limits: not yet shown in the bag/shop (no new items were added); Legendary key items (Oak's Letter, wings, tickets) keep their own icons and are a separate list.
