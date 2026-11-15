# #1320 New UI: Party, Summary, Bag and the run end

**Player gets:**
- **Party** opens as the mock-up page: a big card for the lead with the others in rows, a three-wide grid, or a list with a detail window (by layout). Each card shows the Pokémon, level, HP bar, held items and status.
- **Summary** is the mock-up page: the Pokémon's card on the left (picture, level, HP and XP bars, "Holding N items"), the seven tabs (Overview, Stats, Moves, Items, Bond, History, Traits), and the action menu (Make lead, Move up, Move down, Review moves, Review items) as a window over the page.
- **Bag** is the mock-up page: pockets as tabs, the items as a list with a detail window whose button says what Enter does (Use, Give, Change holder), or a grid of item cells. Under it, the party strip says who the focused item helps: Can use, No effect, Fainted, Holds it.
- **Run end** is the mock-up page: RUN OVER or CHAMPION!, a window with the run's numbers, a Payouts window, your last party (the fallen as silhouettes), and three buttons.
  - **Witness the rest** (after a loss) or **Roll credits** (after a win; the rivals' cards play first): each rival, the Friend, the Champion and the last card as a full cutscene card with the speaker's picture.
  - **Run card** shows the card (result, Trainer, day or time, seed, MVP, badges); Enter saves it as a PNG.
  - **Back to Hub**. In the corner: **Tab** opens the full report (every line the old screen showed, in pages), **F** shows the final team, **R** retries the seed. G, T, C and S still copy the codes and save the card.
  - Tap a Pokémon on the page for a small reaction.
- Fix: in a two-column or grid list with an uneven number of rows, the last row could be left off screen.

**Save:** none.

**Limits:**
- A Party or Bag style picked in Settings still wins over the mock-up look (that is the rule for every screen).
- Choosing who to use an item on is the shared Pokémon list, not the party strip itself.
- A wiped team is shown greyed instead of as six black silhouettes, so it stays recognisable.
- The Champion card now uses your Trainer's name ("Red stands as Champion"), in both UI styles.
- Still drawn the Old way inside New: Battle default look, overlays, cutscenes, map pop-ups (node menu too), Field Trial, egg hatch, Legendary title cards.
