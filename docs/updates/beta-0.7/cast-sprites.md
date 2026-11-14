# Johto and Unova cast scenes, Cipher sprites

**Player gets:** Johto's Rocket Commanders (Attila, Hun, Professor Sebastian, Tyson, the Iron-Masked Marauder) and Unova's Sages (Gorm, Bronius, Ryoku) now enter the Dossier: from their region's world-track steps (Johto 1-5, Unova 1-5) and from the story events that show Mary, Lance, the Heir, Miror B., the Counterfeit Boss, Colress, Snattle, Aldith and the King's Likeness. All three Sages share one Sage sprite (`trainer.pr/zinzolin`). Johto's Commanders use stand-in art until their own exists.

**Why they never appeared:** no code put them in the Dossier (Johto and Unova had no meeting tables), and their names found no sprite (the Dossier looked up `trainer.<first word>`).

**Save:** none.

**Cipher art needed** (drop `<name>.png` + `.json` into `public/assets/images/trainer/cipher/`; it shows with no code change; until then the silhouette shows):
- `greevil`: Grand Master Greevil, Cipher's leader (Citadark boss fight, two story cards)
- `evice`: Evice, Cipher's second (Citadark boss fight)
- `gorigan`: Gorigan, Commander
- `hexagon`: The Hexagon Brothers, Lieutenants
- `trudly-folly`: Trudly and Folly, Specialists
- `es-cade`: Mayor Es Cade, civilian
- `verich`: Mr. Verich, civilian
Optional own art for Johto: `trainer/rocket-return/{attila,hun,sebastian,tyson}` and `trainer/cipher/marauder`.

**Limits:** Dossier appearances, not new battle scenes. The Johto Commanders' fights (Raids 4-5) are still unbuilt.
