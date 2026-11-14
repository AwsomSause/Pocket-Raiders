# Node Event Menus: special entries (P5-P7)

**Player gets:** with Node Event Menus on, a node's menu can hold four new kinds of card. **Fork**: one choice with two halves (one pays now, the other can pay at the next node). **Linked**: a start card ("Dropped parcel") whose follow-up ("Return the parcel") shows up 1 to 3 columns later in the same stage; miss it and the chance passes. **Escort**: a companion walks with you for 2-3 nodes and pays at the end, but leaves if you keep arriving with fainted Pokémon. **Rival Takes It**: an optional card you skip may be taken by one of your rivals, who fights you up to 2 levels higher next time (once).

**Save:** none. Optional `run.expansion.nodeMenuSpecial` (forks waiting to pay, open follow-ups, the escort, what rivals took, done keys).

**Limits:** 6 forks, 6 linked pairs, 4 escorts (data `src/data/nodeMenuSpecial.json`); no new art (stop-card look). Not in the League. Rival Takes It needs a rival you have met; at most 2 per stage.
