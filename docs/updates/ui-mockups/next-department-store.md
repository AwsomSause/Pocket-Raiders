# New UI: the Celadon Department Store floors

**Player gets:** (New look)
- Every room of the Celadon Department Store (the lift, the five floors, the roof, the hidden half floor) now draws as the mock-up's **store page**: the floor directory down the left with the floor you are on lit, the floor's goods as rows with their price at the right, your coins at the top right, your party along the bottom, and the clerk's words in the text box.
- The party strip says who the good under the cursor helps: **Can evolve** for a stone, **Heals** for medicine.
- A good you cannot pay for is dimmed, and the text box says why while the cursor is on it.

**Save:** none.

**Limits:**
- The store is still the same chain of event rooms: you ride the lift between floors, so the floor directory shows where you are and is not a menu.
- The TM Counter sells mystery discs, so it cannot say "Can learn" the way the mock-up does.
- The hidden half floor is on the directory only while you stand on it.
- Only the Celadon store has rooms like this today; another store needs one entry in `src/ui/redux/storeFloors.ts`.
