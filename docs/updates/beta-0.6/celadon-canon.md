# Kanto Canon Spaces: Celadon City (workstream 18)

**Player gets:** In a Kanto run, the Celadon stage always has the **Department Store** (stage 4), and rolls its optional spaces. Store floors: service counter (full rest ₽150, cure + PP ₽100), Trainer's Market (Potions, Super Potions, Poké Balls), a rotating TM counter (one of four shelves per visit), Wise Man (six type boosters, ₽1200), Evolution Stones (five Kanto stones at 1.5x price, ₽4500), a Doll floor (Poké Doll ₽300) and rooftop drink machines.
Rolled spaces: **Game Corner** (three slot machines paid by Luck, with an Amulet Coin version; a prize counter with five tiers, Abra to Dratini, two stocks; a back machine that brings a Rocket Grunt), **Celadon Mansion** (four floors: free Eevee, a Game Freak quiz for a Diploma relic, a rooftop rest, the Rocket plans for Intelligence +2 and a Mansion Key flag), **Eeveelution Brothers** (pick one stone, fight the brother you passed over, win the matching Eeveelution and stone; 25% a fourth brother adds Leaf/Ice for Leafeon/Glaceon), **Tea House** (tea: cure + PP ₽150, rest: full heal ₽300), **Perfume Heist** (unmask the gardener girls, double fight vs Rocket Remnants, Perfume Vial + Charisma +2) and **Rooftop Vending** (Fresh Water ₽200, Soda Pop ₽275, Lemonade ₽350).

**Save:** no version bump. New event effect `restorePp` and new item `perfume-vial` (data only; older saves load as they are).

**Limits:**
- Long shelves are split over "More" pages because an event holds at most four choices.
- Money stands in for Game Corner coins (no extra currency). The luck check decides the slots; busting the ₽400 machine gives Luck −1 for the rest of the run, not for one stage.
- The back machine opens a Rocket Grunt fight instead of the Celadon Hideout raid entry; the raid is not wired here.
- The Diploma is gained by a quiz check (Intelligence), not by Pokédex counts; it is a relic (+10% research). "Rep+2" is Charisma +2. The Mansion Key is a story flag (`xk-mansion-key`), not an item.
- Drinks are drunk on the spot (heal 15/25/35% and a small bonus); the Doll is used at once (next wild foe loses its first turn). The Saffron guard's drink trade and a Pokémon left on the mansion roof are not built.
- Tea has a price (₽150) that the spec does not give.
