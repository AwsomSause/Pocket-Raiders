# Kanto Canon Spaces: Celadon, no placeholders (follow-up)

**Player gets:**
- **Celadon Hideout.** In a Rocket run, the Game Corner's back machine (Intelligence check) opens the Hideout while Story Raid 2 is still open: B1F grunts, B3F Executive (win gives the Lift Key), B4F boss. Beat the boss within 20 turns for a Triumph, slower for a Success; retreat after B3F is a Partial; turning back at B1F is Declined; losing any floor is a Failure. Each result is recorded through the existing Story Raid 2 rules (levers, Operational Strength, world track, and a Failure's impound and costs).
- **Drinks are real bag items.** Fresh Water, Soda Pop and Lemonade (rooftop machines and the store's roof floor) go in the Bag and heal 30 / 50 / 70 HP when used.
- **Poké Doll is a real escape item.** Bought on the Doll Floor; in an ordinary wild battle (not a trainer, raid, totem, event fight or expedition) it slips you out: item used up, no experience, money or catch.
- **Diploma from the Pokédex.** The Game Freak room hands out a Diploma (+10% research) at 12 species seen this run and a Gold Diploma (+20%) at 25.
- **Bad Luck Charm lasts one stage.** Busting the ₽400 machine gives Luck −1 until the stage ends, then it is given back.

**Save:** no version bump. New optional field `run.expansion.stageMods`; new event pieces `dex` / `storyRaid` conditions and `storyRaid` / `stageAttribute` effects; new item effect `escape`; four new bag items. Older saves load unchanged.

**Limits:**
- The Hideout is a three-floor fight chain built from the existing event fights, not the full PS-RAID format with floors and objectives (that format is still unbuilt, Kanto saga slices 14 to 16). It does use the real Story Raid 2 results.
- "Pokédex progress" is the species seen this run, because events cannot read the account Pokédex.
- The Doll cannot be used in doubles or triples fights that are events, nor against trainers.
