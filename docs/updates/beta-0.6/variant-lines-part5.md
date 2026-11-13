# Variant lines part 5: Couture, Overcharged, Tuned (all 14 wired)

**Player gets:** Couture Pokémon wear a visible accessory that Knock Off and Thief strip first. Overcharged Pokémon Dynamax for one turn and then lose a turn. Tuned Pokémon Terastallize for two turns and then slow down.

**Save:** no version bump. The variant record gains an optional `accessory`; old saves load unchanged. Tested.

**Limits:** Overcharged and Tuned fire on their second turn out (no choice menu). Tuned uses the Pokémon's own Tera type, not a squad type, and its stall is one -1 Speed stage. Couture accessories come from a short tested list; nothing in a run assigns variants yet, so the Kanto/other event slices must call `assignVariant` with the accessory. Sim: Couture 49.5%, Overcharged 40.8%, Tuned 46.5%.
