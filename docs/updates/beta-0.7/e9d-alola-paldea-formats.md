# E9d: Alola and Paldea wide formats (Siege Map, Blackout, Colossus, beast Front)

**Player gets:** With the Extended Cut on, the Alola and Paldea climaxes now play their own wide formats:
- **Siege Map** ("Four Islands" / "The Five Bases"): district status comes from the story events' flags and the raid results; a Held gate is free, otherwise one battle.
- **Blackout** ("The Crossing" / "The Long Walk to School"): three anchors, two beaten ends it. Alola's fights carry Thin Light (every third turn a glimpse hits one Pokémon on the field for 1/8 HP, never a knockout) unless Beans came along.
- **Colossus**: The Mother Beast (Alola, XD010, three veils; saying where Mohn is removes one) and the Cassiopeia Engine (Paldea, XD012; Raid 4 Triumph or each Held Base removes a core stage, a Raid 4 failure adds one, at least two stay). Both are new raids in `raids.json`. 12 turns.
- **Front** (Alola only): if the Mother Beast was taken, three Ultra Beasts come through as a triple lane fight.

**Save:** none (new optional fields in the format state and battle rule; old saves load as Kanto).

**Limits:** The Siege Map's "if lost" effects for these regions are shown but not applied (the text says so); Paldea's Tera Flicker condition is not built (its Blackout has no condition); the Cassiopeia Engine's five cores are three shield stages (raid shields max 3); the Mother Beast cannot be knocked out only by script, here it is a normal raid; no Boss allies fight beside Team Star in the Engine. Convoy is not used by either region's cut. Alola's forced-switch boss and "bring below half" wins are still not built.
