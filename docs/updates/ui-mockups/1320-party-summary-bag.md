# #1320 New UI: Party, Summary and Bag

**Player gets:**
- **Party** opens as the mock-up page: a big card for the lead with the others in rows, a three-wide grid, or a list with a detail window (by layout). Each card shows the Pokémon, level, HP bar, held items and status.
- **Summary** is the mock-up page: the Pokémon's card on the left (picture, level, HP and XP bars, "Holding N items"), the seven tabs (Overview, Stats, Moves, Items, Bond, History, Traits), and the action menu (Make lead, Move up, Move down, Review moves, Review items) as a window over the page.
- **Bag** is the mock-up page: pockets as tabs, the items as a list with a detail window whose button says what Enter does (Use, Give, Change holder), or a grid of item cells. Under it, the party strip says who the focused item helps: Can use, No effect, Fainted, Holds it.
- Fix: in a two-column or grid list with an uneven number of rows, the last row could be left off screen.

**Save:** none.

**Limits:**
- A Party or Bag style picked in Settings still wins over the mock-up look (that is the rule for every screen).
- Choosing who to use an item on is the shared Pokémon list, not the party strip itself.
- Still drawn the Old way inside New: Battle default look, run end, overlays, cutscenes, map pop-ups (node menu too), Field Trial, egg hatch, Legendary title cards.
