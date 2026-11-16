# New UI: last pass against the mock-ups, part 4 (Pokédex, Exchange Counter, Plaza district menu)

**Player gets:** (New look)
- **Pokédex set:** a set in the Research Room is the mock-up's wall of species pictures. A species you have not met is a "?" (a shadow if your field notes hint at it). The card at the left shows the picture, the name, its number and how often you have seen and caught it; the Found bar counts the species you have met. All / Seen / Owned / Mastered are tabs at the top (click, or Left and Right at the edge of the wall) instead of a "Tab" row in the list.
- **Pokédex species page:** the mock-up's page: the big picture, name, number, types and four facts (height, weight, times caught, battles) on the left; on the right your research note, six stat bars and the evolution line (a form you have not met is a shadow). Left or Right turns to the second page: abilities, egg groups, gender, catch rate, growth and the level-up moves. A species you have not met shows only "???".
- **Exchange Counter:** the Bank has one "Exchange Counter" row that opens the mock-up's counter page with a clerk: credits for Research Points and back, one lot or five at once (Left and Right pick how many). The clerk says what was exchanged, or why a button is shut; your credits and Research Points show as chips.
- **Plaza district menu:** each place shows what is on offer at the right of its row, as the mock-up's district menu does, and the text box names the district.

**Save:** none.

**Limits:**
- The game has no Pokédex flavour text, so the species page's top box shows your research note where the mock-up shows a description.
- The mock-up counter sells items; the game's counter swaps Bank Credits and Research Points, so it has two offers and no party strip.
- The Old look keeps its Pokédex list, its species page art and the two exchange rows in the Bank list. Five lots at once is in the New look only.
- The gender line on the data page now shows halves (87.5% / 12.5%) in both looks; it used to round both up.

**Tests:** unit tests for the species card, both pages in both layouts, the counter page and several-lot exchanges (all or nothing); browser tests in `tests/e2e/worldNewUi.spec.ts` (Pokédex, Exchange Counter, Plaza district menu).
