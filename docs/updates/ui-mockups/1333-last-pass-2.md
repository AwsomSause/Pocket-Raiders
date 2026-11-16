# New UI: last pass against the mock-ups, part 2 (Tales and Tools rooms)

**Player gets:** (New look)
- **My stats:** eight number tiles (runs, wins, win rate, longest and average run, regions per run, top trainer, most used Pokémon) with the rest in the text box, as the mock-up's stats page. It was a list.
- **Speedrun timer:** number tiles too (the switch, the time, the last splits, the category) on the teal band. Enter or a click on the first tile switches the timer.
- **Tournament bracket:** names and seed are typed on the mock-up's form page (letter keys, Paste / Next / Clear) in place of the browser's own box, and the draw shows as the bracket page: up to eight names on one page, more as groups of eight plus the finals (◀ ▶ or the chips). Enter copies it as text.
- **Check a save file:** the mock-up's form page. Paste the save text and press Check, or press Check with the box empty to pick a file.
- **Berry Bestiary:** every berry shows its picture.
- **Content status:** each kind has a bar (how much is fully supported) and an OK or Check tag.
- **Header bands:** the Lore, Story and Remembrance Archives, the Character Database and the Moment Codex are purple; the Hall of Fame is gold; the Seed board, Seed leaderboard, Speedrun timer and Tournament bracket are teal; the Bank is hub blue. The band shows the page's name and the counts sit beside it as chips ("Lore Archive" + "3 / 24 known"). The Cast list is named Character Database and uses the picture grid.
- **Long names in lists:** a row with a long name keeps the name whole and shows the first part of its note ("Captain Ravi Ironhand · Newcomer"); the card beside the list shows all of it.
- **Hub speed (both looks):** opening a page from a hub list (Tools, a quest line) now closes the list under it. Lists used to pile up behind each other for the whole visit and slowed the hub down.

**Save:** none.

**Limits:**
- The mock-up's "Me" page has no room of its own in the game; its numbers are on My stats.
- The Character Database grid shows names; the cast has no portraits yet.

**Tests:** two old shop tests (`milestone3`, `milestone8_75`) failed on every PR from Nov 16 because the real week's event (Market Week, 10% off) changed their prices; they now take the dated events off their run. The hub dock test no longer loses key presses on a slow machine.
