# Kanto Canon Spaces: Cinnabar Island (workstream 18)

**Player gets:** In a Kanto run (Kanto setting on), the Cinnabar stage always has the **Cinnabar Lab** and three of four rolled spaces (at most two Pseudo Stages).
- **Lab:** a Fossil Machine (the Mt. Moon fossil log gives one Fossil Fragment; buy the matching half for ₽400; two halves revive any fossil Pokémon, 30 fossils, at +2 levels), Lab Trades (unevolved for Voltorb, middle-stage for Electrode, fully evolved for Porygon), and the Fusion Display (a story moment).
- **Pokémon Mansion:** Fire/Poison/Electric fights, four optional diary pages (Intel +2 each, the last one exposes Giovanni's cover), a three-step switch puzzle (one right switch of three; wrong ones shock your lead and reset), then a Rocket Scientist (Muk/Weezing) who drops the **Secret Key**. Pick the TM Fire Spin or a Fire-type fossil.
- **Seafoam Islands:** water/ice fights, a three-step boulder puzzle, then 35% Articuno (10% of those Galarian) or a Dewgong horde. Pays Never-Melt Ice and an Icy Rock.
- **New Island:** storm crossing, then the **Clone Battle**: clones of your own party (no ability, no items, +10% stats). Win and the **Clone Core** copies your lead's moves onto a party Pokémon you pick (optional; needs 2 Pokémon). 10% chance to meet Mew at the end.
- **Cinnabar Volcano:** five climb rooms (1 in 16 burn each), Burn Heal herbs, a Magmar/Charmeleon/Ponyta at the top, Fire Stone and Heat Rock.

**Save:** no version bump. New optional field `abilityless` on a Pokémon (older saves load as they are). New data-only pieces: battle flag `clone`, event effect `copyMoves`.

**Limits:**
- Fossil items revive instantly when found, so the Lab does not take fossil items. It works from Fossil Fragments instead (the Mt. Moon log gives one; the other half is bought). Pewter's Museum Fragment is not built.
- New Island rolls with the same weight as the other spaces (the pack says weight 1; the Town Roll has no weights).
- Clone Core is used right away (it is not kept in the bag). Fusion Display is cosmetic only.
- Articuno's low catch rate and the Mansion's "burned-out" Fire/Poison/Electric condition are only approximated by the fight pools. The thunderstorm is rain.
