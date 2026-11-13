# Trainer pools, tier pools and boss teams

Built from your Pokédex (`data/source/pokedex.json`, 1673 entries) by `tools/build_pools.js`. Output: `data/trainer_pools.json`, `data/boss_teams.json`, and the per-Set files in `docs/pools/`.

## 1. How I read your request

- **Nine Sets, fifty sub-sets.** Your list had two entries named "Set-7" and the last two bands overlapped (401–451 and 451–500). I numbered them Set-1 to Set-9 and made the bands 401–450 and 451–500, so every level belongs to exactly one Set. Tell me if you meant something else.
- **A new sub-set every ten levels.** Set-1 (1–100) has ten sub-sets, each of the other eight Sets (50 levels each) has five. Labels run `Set-1.01` to `Set-9.05`. Every sub-set has its own pool for every team and tier, and its own team for every boss.
- **"Don't include levels."** The pool files and the JSON pools carry no Pokémon levels. The only level numbers are in the table below (and in `setMap` in the JSON), so the game can map a level to a Set.
- **What the Pokédex does not hold.** It has no moves, items or level-up data. Pools are built from species, types, base stats, abilities and evolution data. Items and roles on boss teams are suggestions; moves are left to you.

## 2. Set map (the only place levels appear)

| Set | Level band | Sub-sets |
|---|---|---|
| Set-1 | 1–100 | Set-1.01 to Set-1.10 (10) |
| Set-2 | 101–150 | Set-2.01 to Set-2.05 (5) |
| Set-3 | 151–200 | Set-3.01 to Set-3.05 (5) |
| Set-4 | 201–250 | Set-4.01 to Set-4.05 (5) |
| Set-5 | 251–300 | Set-5.01 to Set-5.05 (5) |
| Set-6 | 301–350 | Set-6.01 to Set-6.05 (5) |
| Set-7 | 351–400 | Set-7.01 to Set-7.05 (5) |
| Set-8 | 401–450 | Set-8.01 to Set-8.05 (5) |
| Set-9 | 451–500 | Set-9.01 to Set-9.05 (5) |

The nine bands cover levels 1 to 500 exactly once.

## 3. Tiers

| Tier | Rank id | Pool size | Uses | Party size |
|---|---|---|---|---|
| Associate | 0 | 6 (the weakest of the Grunt pool) | Associates, lookouts, ambush fodder | 1 → 2 → 3 |
| Grunt | 1 | 12 | Grunts, raid guards | 2 → 3 → 4 |
| Specialist | 2 | 8 | Specialists, named mid-rankers, the roaming trio (Jessie, James, Meowth) | 3 → 4 |
| Lieutenant | 3 | 8 | Lieutenants and raid captains | 3 → 4 → 5 |
| Commander | 4 | 8 | Commanders, Admins, Butch and Cassidy | 4 → 5 |
| Executive | 5 | 8 | Executives and Admins who run a region | 4 → 5 → 6 |
| Second | 6 | 6 | The leader's right hand, second-team leaders, rival-grade fights | 5 → 6 |
| Leader (boss) | 7 | – | See section 5 | 5 → 6 |

The numbers after "Party size" are the sizes in order, stepping up at fixed sub-sets (the exact steps are in `rules.partySize` in the JSON).

## 4. How the pools are built

1. **A BST ceiling that rises by sub-set.** For sub-set index k (0 to 49), the Grunt ceiling is `505 − 195·e^(−k/8) + 0.8·k` in base stat total. Each tier adds a bonus to the ceiling (Specialist +20, Lieutenant +40, Commander +60, Executive +80, Second +100) and takes species within a fixed span below it. The exact windows are printed for every sub-set in the Set files.
2. **Early sub-sets use basic and middle forms; later ones use final forms only.** From the eleventh sub-set (Set-2.01) onward only fully evolved species appear. Tiers above Specialist skip first-stage species even earlier.
3. **Each team has a type theme and signature species.** Signature species (and their evolution lines, so Zubat becomes Golbat becomes Crobat as the Sets climb) score highest. Species that share the team's types fill the rest. These lists are my recall of the games and anime and are approximate; edit `tools/pools_config.js` and rebuild.
4. **No repeats inside a pool.** One species per family and per dex number (Eevee's final forms count separately).
5. **Adjacent sub-sets differ.** A species used in the previous sub-set's pool for the same team and tier is penalised. Across all teams and tiers the average overlap between neighbouring sub-sets is 11% and the worst pair shares 50%.
6. **No legendaries or mythicals in ordinary pools.** They are for bosses only. Babies appear only in the earliest Grunt pools.
7. **Elite finals (BST 580 and up, non-legendary).** Pseudo-legendary lines, Slaking, Archaludon and similar. Lieutenants may carry one from Set-5, Commanders one from Set-4, Executives and Seconds up to two from Set-3 and Set-2. Grunts and Specialists never do. Anything above BST 640 is boss-only, from Set-6.
8. **Megas and custom forms.** Executive and Second pools list up to two Mega options each from Set-7 and Set-5. Z-forms and Spooky variants from your dex can join Lieutenant-and-above pools from Set-4. Delta forms and regional forms are treated as ordinary species.

## 5. Boss teams

Thirteen bosses: Giovanni, Archer, Archie, Maxie, Cyrus, Ghetsis, Lysandre, Guzma, Lusamine, Chairman Rose, Cassiopeia, Gonzap and Domino. Jessie, James and Meowth are never bosses; they use the Specialist pool. Wakin, Biden, Agrev, Butch and Cassidy use Commander/Executive pools, not boss teams.

**What makes them extremely hard**

- **A full team from the start:** five Pokémon in the first three sub-sets, six from Set-1.04. No other rank is ever larger, and Seconds reach six at Set-4.01 and Executives at Set-7.01.
- **A higher stat ceiling:** the boss window sits 110 BST above the Grunt ceiling, and its floor is 90 below that, so a boss team is on average 25% above the same team's Grunt pool in BST.
- **An ace that grows with the run** (the ladder in section 6) and, from Set-4, **legendary Pokémon** (one in Set-4 and 5, two in Set-6 and 7, three in Set-8 and 9). Upgraded legendary forms (Primal, Origin, Black/White, Mega X/Y, Complete, Eternamax) replace the base form from Set-7.
- **A team built to cover the type chart:** a search picks the best of 500 candidate teams per sub-set, rewarding type coverage, penalising shared weaknesses (a type that hits three or more members without two resisters is penalised heavily; across all 650 teams no type hits more than 5 members super effectively), and rewarding good abilities, speed and bulk. Average type coverage by Set: Set-1 15.6/18, Set-2 16/18, Set-3 16.4/18, Set-4 16.5/18, Set-5 16.4/18, Set-6 15.9/18, Set-7 16.1/18, Set-8 15.3/18, Set-9 15.3/18.
- **At most one gimmick form among the non-legendary members** (Mega, Gigantamax, Primal or Z-form). A legendary's upgraded form (Primal Kyogre, Mega Mewtwo, Origin Dialga) counts as the legend, not as a second gimmick.
- **A signature rule-bending tactic** (section 6) and the stacking **hard-mode rules** below.
- **Every sub-set has a new team.** At least two members change from the previous sub-set, so the same boss feels different each time you meet it.

Average boss-to-Grunt BST ratio by Set: Set-1 ×1.42, Set-2 ×1.17, Set-3 ×1.16, Set-4 ×1.21, Set-5 ×1.21, Set-6 ×1.22, Set-7 ×1.23, Set-8 ×1.25, Set-9 ×1.25. BST is only one part of difficulty; the rest comes from team size, legendaries, coverage and the rules below. These are launch numbers to tune, not tested balance.

**Hard-mode rules** (suggestions; all stack from the Set shown):

| From | Rule |
|---|---|
| Set-1 | Boss reads your lead and leads with the best match-up it has (no random lead). |
| Set-2 | Boss uses held items and one stat-boosting or healing item in battle. |
| Set-3 | Boss sets one layer of entry hazards or a field effect in the first two turns. |
| Set-4 | Ace survives its first lethal hit at 1 HP (once per battle, announced). |
| Set-5 | Boss switches for the match-up when it can, and never fully commits to a losing exchange. |
| Set-6 | Boss ace gets a free stat boost the first time it enters. |
| Set-7 | Boss legend returns once at a quarter of its HP (once per battle). |
| Set-8 | Boss uses its signature tactic twice, and the second use is not announced. |
| Set-9 | Boss ignores the first Shadow or capture-style disruption each battle, and its team cannot be fully status-locked. |

## 6. The thirteen bosses

### Giovanni (Team Rocket)

- **Type theme:** ground, rock, poison, dark, normal.
- **Strategy:** Win the ground war: Earth-type walls and heavy hitters that punish anything that does not fly or float.
- **Signature tactic:** Earth Rule: ground moves hit through Levitate-style immunities once per battle; the ace re-enters at 1 HP once.
- **Ace ladder:** Rhyhorn (from Set-1.01) → Rhydon (from Set-1.07) → Rhyperior (from Set-2.02) → Z-Rhyperior (from Set-6.01). The ace is held back if a stage's BST is too far above the current window, and Mega, Gigantamax and Z-forms wait for Set-3, Set-6 and Set-4.
- **Legendaries:** Mewtwo, Mega Mewtwo X, Mega Mewtwo Y (canon-tied (Rocket created Mewtwo)). Longer lists are rotated between sub-sets; if a boss needs more legendaries than its list has, type-fit ones are added and marked "type-fit".
- **Signature species:** Persian, Dugtrio, Nidoqueen, Nidoking, Kangaskhan, Tauros, Machamp, Rhydon, Steelix.
- **Sample teams:**
  - Set-1.01: Alolan Raticate, Vibrava, Roselia, Machoke, Rhyhorn (ace)
  - Set-2.03: Nidoqueen, Swampert, Delta Torterra, Machamp, Alolan Muk, Rhyperior (ace)
  - Set-4.05: Gemgoyle, Delta Metagross (Spider), Magnezone, Swampert, Rhyperior (ace), Mewtwo (legend)
  - Set-7.02: Vine Riff, Hydreigon, Delta Goodra, Z-Rhyperior (ace), Mega Mewtwo Y (legend), Iron Treads (legend)
  - Set-9.05: Vine Riff, Hydreigon, Z-Rhyperior (ace), Mega Mewtwo Y (legend), Nihilego (legend), Ting-Lu (legend)

### Archer (Team Rocket (Return))

- **Type theme:** dark, poison, fire, flying, normal.
- **Strategy:** Wear the opponent down with status and chip damage, then finish with fast dark attackers.
- **Signature tactic:** Radio Rule: every status move he uses carries a second effect from the broadcast (Speed drop or flinch chance).
- **Ace ladder:** Houndour (from Set-1.01) → Houndoom (from Set-1.06) → Mega Houndoom (from Set-4.02). The ace is held back if a stage's BST is too far above the current window, and Mega, Gigantamax and Z-forms wait for Set-3, Set-6 and Set-4.
- **Legendaries:** Darkrai, Ho-Oh, Yveltal (type-fit). Longer lists are rotated between sub-sets; if a boss needs more legendaries than its list has, type-fit ones are added and marked "type-fit".
- **Signature species:** Houndoom, Weezing, Crobat, Arbok, Honchkrow, Muk, Weavile, Gyarados, Persian.
- **Sample teams:**
  - Set-1.01: Persian, Krokorok, Morgrem, Ivysaur, Houndour (ace)
  - Set-2.03: Crobat, Sneasler, Obstagoon, Gyarados, Delta Muk (Grass Cage), Houndoom (ace)
  - Set-4.05: Crobat, Alphayena, Delta Hydreigon, Bastiodoom, Mega Houndoom (ace), Yveltal (legend)
  - Set-7.02: Vine Riff, Dreadodile, Bastiodoom, Mega Houndoom (ace), Darkrai (legend), Yveltal (legend)
  - Set-9.05: Kommo-o, Delta Goodra, Mega Houndoom (ace), Ho-Oh (legend), Yveltal (legend), Darkrai (legend)

### Archie (Team Aqua)

- **Type theme:** water, dark, poison, flying.
- **Strategy:** Rain control: set the weather, then sweep with water attackers backed by dark pivots.
- **Signature tactic:** Tide Rule: rain starts on turn one and cannot be overwritten for three turns.
- **Ace ladder:** Carvanha (from Set-1.01) → Sharpedo (from Set-1.05) → Mega Sharpedo (from Set-4.01). The ace is held back if a stage's BST is too far above the current window, and Mega, Gigantamax and Z-forms wait for Set-3, Set-6 and Set-4.
- **Legendaries:** Kyogre, Primal Kyogre (canon-tied). Longer lists are rotated between sub-sets; if a boss needs more legendaries than its list has, type-fit ones are added and marked "type-fit".
- **Signature species:** Mightyena, Crobat, Muk, Sharpedo, Wailord, Gyarados, Kingdra, Crawdaunt, Pelipper, Tentacruel.
- **Sample teams:**
  - Set-1.01: Delta Dragonair, Mightyena, Pelipper, Quagsire, Carvanha (ace)
  - Set-2.03: Crobat, Alphayena, Delta Tentacruel, Barbaracle, Delta Muk (Dark Cage), Sharpedo (ace)
  - Set-4.05: Salamence, Alphayena, Delta Dragonite, Oracowl, Mega Sharpedo (ace), Kyogre (legend)
  - Set-7.02: Dragapult, Electric Oncore, Delta Metagross (Spider), Mega Sharpedo (ace), Primal Kyogre (legend), Brinecrown (legend)
  - Set-9.05: Electric Oncore, Delta Metagross (Spider), Mega Sharpedo (ace), Primal Kyogre (legend), Brinecrown (legend), Walking Wake (legend)

### Maxie (Team Magma)

- **Type theme:** fire, ground, dark, poison, rock.
- **Strategy:** Sun control: set the weather, then break the opponent with fire and ground power.
- **Signature tactic:** Heat Rule: sun starts on turn one and cannot be overwritten for three turns.
- **Ace ladder:** Numel (from Set-1.01) → Camerupt (from Set-1.06) → Mega Camerupt (from Set-4.02). The ace is held back if a stage's BST is too far above the current window, and Mega, Gigantamax and Z-forms wait for Set-3, Set-6 and Set-4.
- **Legendaries:** Groudon, Primal Groudon (canon-tied). Longer lists are rotated between sub-sets; if a boss needs more legendaries than its list has, type-fit ones are added and marked "type-fit".
- **Signature species:** Mightyena, Crobat, Weezing, Camerupt, Houndoom, Flygon, Magcargo, Torkoal, Claydol.
- **Sample teams:**
  - Set-1.01: Mightyena, Delta Roselia, Delta Zweilous, Alolan Graveler, Numel (ace)
  - Set-2.03: Flygon, Alphayena, Houndoom, Claydol, Delta Snorlax (Autumn), Camerupt (ace)
  - Set-4.05: Crobat, Alphayena, Hisuian Arcanine, Delta Snorlax (Autumn), Mega Camerupt (ace), Groudon (legend)
  - Set-7.02: Pyro Spirit, Garchomp, Delta Metagross (Ruin), Mega Camerupt (ace), Primal Groudon (legend), Chi-Yu (legend)
  - Set-9.05: Garchomp, Delta Metagross (Ruin), Mega Camerupt (ace), Primal Groudon (legend), Ting-Lu (legend), Chi-Yu (legend)

### Cyrus (Team Galactic)

- **Type theme:** dark, poison, steel, psychic, flying, ice.
- **Strategy:** Cold calculation: remove every random element, then trade perfectly with a flawless lead and a counter to the opponent's best attacker.
- **Signature tactic:** Cold Calculus: the first critical hit and first miss against him are cancelled each battle.
- **Ace ladder:** Sneasel (from Set-1.01) → Weavile (from Set-1.05) → Honchkrow (from Set-2.02). The ace is held back if a stage's BST is too far above the current window, and Mega, Gigantamax and Z-forms wait for Set-3, Set-6 and Set-4.
- **Legendaries:** Dialga, Palkia, Giratina, Origin Dialga, Origin Palkia, Origin Giratina (canon-tied). Longer lists are rotated between sub-sets; if a boss needs more legendaries than its list has, type-fit ones are added and marked "type-fit".
- **Signature species:** Honchkrow, Crobat, Weavile, Gyarados, Houndoom, Toxicroak, Bronzong, Drapion, Mismagius, Skuntank.
- **Sample teams:**
  - Set-1.01: Swoobat, Haunter, Delta Wartortle, Delta Zweilous, Sneasel (ace)
  - Set-2.03: Sneasler, Delta Mismagius, Drapion, Gyarados, Bronzong, Honchkrow (ace)
  - Set-4.05: Alphayena, Delta Hydreigon, Z-Electivire, Gyarados, Honchkrow (ace), Dialga (legend)
  - Set-7.02: Vine Riff, Dreadodile, Bastiodoom, Honchkrow (ace), Origin Dialga (legend), Origin Giratina (legend)
  - Set-9.05: Delta Hydreigon, Cataggron, Honchkrow (ace), Origin Giratina (legend), Origin Palkia (legend), Origin Dialga (legend)

### Ghetsis (Team Plasma)

- **Type theme:** dark, ghost, dragon, ice, ground, normal.
- **Strategy:** Break the opponent's plan: a lie-and-reveal team that bluffs one ace and hides a second.
- **Signature tactic:** The Liberator's Lie: the first time the opponent KOs his ace, it returns once with a new typing, announced.
- **Ace ladder:** Deino (from Set-1.01) → Zweilous (from Set-1.09) → Hydreigon (from Set-2.03) → Delta Hydreigon (from Set-6.01). The ace is held back if a stage's BST is too far above the current window, and Mega, Gigantamax and Z-forms wait for Set-3, Set-6 and Set-4.
- **Legendaries:** Kyurem, Black Kyurem, White Kyurem (canon-tied). Longer lists are rotated between sub-sets; if a boss needs more legendaries than its list has, type-fit ones are added and marked "type-fit".
- **Signature species:** Cofagrigus, Bouffalant, Seismitoad, Eelektross, Drapion, Hydreigon, Weavile, Krookodile, Zoroark.
- **Sample teams:**
  - Set-1.01: Haunter, Palpitoad, Gurdurr, Eelektrik, Deino (ace)
  - Set-2.03: Sneasler, Cryogonal, Drapion, Basculegion, Seismitoad, Hydreigon (ace)
  - Set-4.05: Gholdengo, Dragonite, Kingambit, Ursaluna, Hydreigon (ace), Kyurem (legend)
  - Set-7.02: Pyro Spirit, Delta Dragonite, Florges, Delta Hydreigon (ace), White Kyurem (legend), Guzzlord (legend)
  - Set-9.05: Delta Metagross (Spider), Neon Moon, Delta Hydreigon (ace), Black Kyurem (legend), Roaring Moon (legend), Ting-Lu (legend)

### Lysandre (Team Flare)

- **Type theme:** fire, dark, fighting, flying, poison, psychic.
- **Strategy:** Beautiful and brutal: a fast mixed offense that keeps the ace safe until the field is clear.
- **Signature tactic:** Perfect Form: the ace takes 25% less damage while it is at full HP, each battle.
- **Ace ladder:** Magikarp (from Set-1.01) → Gyarados (from Set-1.04) → Mega Gyarados (from Set-4.01). The ace is held back if a stage's BST is too far above the current window, and Mega, Gigantamax and Z-forms wait for Set-3, Set-6 and Set-4.
- **Legendaries:** Yveltal, Xerneas, Zygarde, Complete Zygarde (canon-tied). Longer lists are rotated between sub-sets; if a boss needs more legendaries than its list has, type-fit ones are added and marked "type-fit".
- **Signature species:** Mienshao, Honchkrow, Pyroar, Gyarados, Houndoom, Drapion, Crobat, Malamar, Meowstic.
- **Sample teams:**
  - Set-1.01: Morpeko, Medicham, Mothim, Delta Sunflora, Magikarp (ace)
  - Set-2.03: Crobat, Mienshao, Drapion, Houndoom, Gemgoyle, Gyarados (ace)
  - Set-4.05: Crobat, Dreadodile, Arcanine, Kommo-o, Mega Gyarados (ace), Yveltal (legend)
  - Set-7.02: Vine Riff, Dreadodile, Bastiodoom, Mega Gyarados (ace), Xerneas (legend), Yveltal (legend)
  - Set-9.05: Archaludon, Delta Dragonite, Mega Gyarados (ace), Xerneas (legend), Yveltal (legend), Complete Zygarde (legend)

### Guzma (Team Skull)

- **Type theme:** bug, dark, poison, fighting, steel.
- **Strategy:** Swarm and bully: bug pivots that chip, trap and cut down anything that stays in.
- **Signature tactic:** Boss Swarm: every time one of his Pokémon faints, the next gains +1 Speed and +1 Attack.
- **Ace ladder:** Wimpod (from Set-1.01) → Golisopod (from Set-1.09) → Mega Golisopod (from Set-5.01). The ace is held back if a stage's BST is too far above the current window, and Mega, Gigantamax and Z-forms wait for Set-3, Set-6 and Set-4.
- **Legendaries:** Pheromosa, Buzzwole, Kartana, Genesect (type-fit (Ultra Beasts and bug-types)). Longer lists are rotated between sub-sets; if a boss needs more legendaries than its list has, type-fit ones are added and marked "type-fit".
- **Signature species:** Golisopod, Ariados, Masquerain, Vikavolt, Scizor, Pinsir, Accelgor, Crobat, Heracross, Araquanid.
- **Sample teams:**
  - Set-1.01: Krokorok, Pignite, Ariados, Charjabug, Wimpod (ace)
  - Set-2.03: Crobat, Sneasler, Kleavor, Delta Muk (Dark Cage), Vikavolt, Golisopod (ace)
  - Set-4.05: Crobat, Dreadodile, Tyranitar, Magnezone, Golisopod (ace), Buzzwole (legend)
  - Set-7.02: Vine Riff, Kommo-o, Tyranitar, Mega Golisopod (ace), Kartana (legend), Genesect (legend)
  - Set-9.05: Delta Hydreigon, Tyranitar, Mega Golisopod (ace), Pheromosa (legend), Kartana (legend), Buzzwole (legend)

### Lusamine (Aether Foundation)

- **Type theme:** fairy, psychic, normal, water, poison, grass.
- **Strategy:** Possession: protective bulk and fairy power that gets stronger the longer the fight goes.
- **Signature tactic:** Perfect Protection: she heals 10% of max HP on the first KO she scores each battle.
- **Ace ladder:** Clefairy (from Set-1.01) → Clefable (from Set-1.07) → Mega Clefable (from Set-4.03). The ace is held back if a stage's BST is too far above the current window, and Mega, Gigantamax and Z-forms wait for Set-3, Set-6 and Set-4.
- **Legendaries:** Nihilego, Necrozma, Ultra Necrozma, Solgaleo, Lunala (canon-tied (Ultra Beasts and Necrozma)). Longer lists are rotated between sub-sets; if a boss needs more legendaries than its list has, type-fit ones are added and marked "type-fit".
- **Signature species:** Clefable, Lilligant, Milotic, Bewear, Mismagius, Wigglytuff, Gardevoir, Slowbro, Hypno.
- **Sample teams:**
  - Set-1.01: Alolan Raticate, Trumbeak, Roselia, Delta Graveler, Clefairy (ace)
  - Set-2.03: Mismagius, Milotic, Delta Gardevoir, Bewear, Hatterene, Clefable (ace)
  - Set-4.05: Delta Volcarona, Milotic, Delta Dragonite, Ursaluna, Mega Clefable (ace), Necrozma (legend)
  - Set-7.02: Garchomp, Delta Arcanine, Delta Dragonite, Mega Clefable (ace), Lunala (legend), Solgaleo (legend)
  - Set-9.05: Dreadodile, Delta Dragonite, Mega Clefable (ace), Solgaleo (legend), Ultra Necrozma (legend), Nihilego (legend)

### Chairman Rose (Macro Cosmos)

- **Type theme:** steel, poison, normal, electric, psychic, dragon.
- **Strategy:** Build the weather the market wants: heavy steel walls, then a Dynamax finisher.
- **Signature tactic:** Corporate Dynamax: his team Dynamaxes for one extra turn once per battle, announced.
- **Ace ladder:** Cufant (from Set-1.01) → Copperajah (from Set-1.09) → Duraludon (from Set-2.03) → Archaludon (from Set-5.04) → Gigantamax Duraludon (from Set-6.02). The ace is held back if a stage's BST is too far above the current window, and Mega, Gigantamax and Z-forms wait for Set-3, Set-6 and Set-4.
- **Legendaries:** Eternatus, Eternamax Eternatus (canon-tied). Longer lists are rotated between sub-sets; if a boss needs more legendaries than its list has, type-fit ones are added and marked "type-fit".
- **Signature species:** Escavalier, Klinklang, Perrserker, Copperajah, Garbodor, Magnezone, Steelix, Corviknight, Mawile.
- **Sample teams:**
  - Set-1.01: Alolan Raticate, Farfetch’d, Delta Zweilous, Mawile, Cufant (ace)
  - Set-2.03: Gengar, Corviknight, Steelix, Bastiodoom, Escavalier, Duraludon (ace)
  - Set-4.05: Noivern, Garchomp, Magnezone, Kingambit, Duraludon (ace), Eternatus (legend)
  - Set-7.02: Vine Riff, Kommo-o, Cataggron, Gigantamax Duraludon (ace), Eternatus (legend), Jirachi (legend)
  - Set-9.05: Kommo-o, Delta Dragonite, Gigantamax Duraludon (ace), Eternamax Eternatus (legend), Dialga (legend), Munkidori (legend)

### Cassiopeia (Team Star)

- **Type theme:** normal, dark, fairy, water, fire, electric, psychic, grass, ice.
- **Strategy:** Eight answers to eight questions: a team of Eevee branches that covers every type.
- **Signature tactic:** Star Barrage: her team Terastallizes once, at a time she chooses, and the type is announced one turn earlier.
- **Ace ladder:** Eevee (from Set-1.01) → Sylveon (from Set-1.06) → Gigantamax Eevee (from Set-6.01). The ace is held back if a stage's BST is too far above the current window, and Mega, Gigantamax and Z-forms wait for Set-3, Set-6 and Set-4.
- **Legendaries:** Miraidon, Koraidon, Zeraora (type-fit). Longer lists are rotated between sub-sets; if a boss needs more legendaries than its list has, type-fit ones are added and marked "type-fit".
- **Signature species:** Umbreon, Vaporeon, Flareon, Jolteon, Espeon, Leafeon, Glaceon, Sylveon.
- **Sample teams:**
  - Set-1.01: Mightyena, Combusken, Mawile, Azumarill, Eevee (ace)
  - Set-2.03: Leafeon, Blaziken, Vaporeon, Neon Moon, Delta Muk (Dark Cage), Sylveon (ace)
  - Set-4.05: Pyro Spirit, Dreadodile, Delta Dragonite, Neon Moon, Sylveon (ace), Koraidon (legend)
  - Set-7.02: Pyro Spirit, Delta Goodra, Neon Moon, Gigantamax Eevee (ace), Zeraora (legend), Miraidon (legend)
  - Set-9.05: Pyro Spirit, Dreadodile, Gigantamax Eevee (ace), Miraidon (legend), Koraidon (legend), Zeraora (legend)

### Gonzap (Team Snag'em)

- **Type theme:** dark, normal, fighting, ground, flying, steel.
- **Strategy:** Take what is good: a Shadow-heavy brawl team that steals the opponent's best Pokémon's advantage.
- **Signature tactic:** Snag Beam: once per battle he disables the opponent's last-hit Pokémon for two turns, announced.
- **Ace ladder:** Poochyena (from Set-1.01) → Mightyena (from Set-1.05) → Tyranitar (from Set-2.02) → Mega Tyranitar (from Set-5.01). The ace is held back if a stage's BST is too far above the current window, and Mega, Gigantamax and Z-forms wait for Set-3, Set-6 and Set-4.
- **Legendaries:** Lugia, Entei, Raikou, Suicune (canon-tied (Cipher's Shadow legendaries)). Longer lists are rotated between sub-sets; if a boss needs more legendaries than its list has, type-fit ones are added and marked "type-fit".
- **Signature species:** Mightyena, Zangoose, Skarmory, Tyranitar, Houndoom, Absol, Salamence, Sableye, Weavile.
- **Sample teams:**
  - Set-1.01: Delta Dugtrio, Medicham, Pupitar, Loudred, Poochyena (ace)
  - Set-2.03: Sneasler, Bruticate, Braviary, Maliceye, Delta Tangrowth, Tyranitar (ace)
  - Set-4.05: Delta Noivern, Alolan Flygon, Alphayena, Ursaluna, Tyranitar (ace), Entei (legend)
  - Set-7.02: Electric Oncore, Garchomp, Kommo-o, Mega Tyranitar (ace), Suicune (legend), Entei (legend)
  - Set-9.05: Delta Hydreigon, Kommo-o, Mega Tyranitar (ace), Entei (legend), Lugia (legend), Suicune (legend)

### Domino (Rocket Remnants)

- **Type theme:** normal, poison, dark, bug, psychic.
- **Strategy:** Cool precision: a status-and-speed team that picks the match-ups and leaves.
- **Signature tactic:** Clean Exit: once per battle she swaps out of a KO for free, announced.
- **Ace ladder:** Meowth (from Set-1.01) → Persian (from Set-1.07) → Alolan Persian (from Set-2.03). The ace is held back if a stage's BST is too far above the current window, and Mega, Gigantamax and Z-forms wait for Set-3, Set-6 and Set-4.
- **Legendaries:** Mewtwo, Darkrai (type-fit). Longer lists are rotated between sub-sets; if a boss needs more legendaries than its list has, type-fit ones are added and marked "type-fit".
- **Signature species:** Persian, Nidoqueen, Ariados, Arbok, Weezing, Houndoom, Wobbuffet, Crobat, Muk.
- **Sample teams:**
  - Set-1.01: Delta Dugtrio, Galarian Linoone, Squawkabilly, Clodsire, Meowth (ace)
  - Set-2.03: Yanmega, Bewear, Delta Muk (Fairy Cage), Arboliva, Bastiodoom, Alolan Persian (ace)
  - Set-4.05: Crobat, Vine Riff, Delta Metagross (Spider), Bastiodoom, Alolan Persian (ace), Darkrai (legend)
  - Set-7.02: Vine Riff, Kommo-o, Bastiodoom, Alolan Persian (ace), Mewtwo (legend), Darkrai (legend)
  - Set-9.05: Delta Goodra, Bastiodoom, Alolan Persian (ace), Mewtwo (legend), Darkrai (legend), Meloetta (legend)

## 7. Using this in the pack

- **Which sub-set am I in?** Map the run's current level band to a Set with the table above, then use the sub-set for that ten-level step. Everything below is keyed by the sub-set label.
- **Raids, ambushes and the climax.** Raid guards use Grunt and Specialist pools; raid captains use Lieutenant or Commander; the raid boss uses Executive or Second. Climax phases follow the existing structure: Executive, then Second, then the Leader's boss team. Ambushes draw Associate/Grunt pools, with Specialist and Lieutenant pools when Heat is high.
- **Shadow Pokémon.** A Shadow version of any pool species is allowed under the existing Shadow rules. Gonzap's team is Shadow-heavy by design; his tactic is `Snag Beam`.
- **Second teams and roaming teams.** Every team has its own pools. Boss teams exist for Giovanni (Rocket), Archer (Rocket Return), Archie (Aqua), Maxie (Magma), Cyrus (Galactic), Ghetsis (Plasma), Lysandre (Flare), Guzma (Skull), Lusamine (Aether), Chairman Rose (Macro Cosmos), Cassiopeia (Star), Gonzap (Snag'em) and Domino (Rocket Remnants). Team Yell has no boss team because its leader stays off-screen; use its Second pool for its final fight.
- **Rival fights** are not covered here. If you want rival pools per Set, say so.

## 8. Data format

`data/trainer_pools.json` holds `setMap`, `species` (name, types, BST, class, stage, family for every species used), and `subsets[]`, each with `window`, `partySize` and `teams.<id>` pools (`associate`, `grunt`, `specialist`, `lieutenant`, `commander`, `executive`, `second`, `megaOptions`; the `generic` pool has `grunt` only). `data/boss_teams.json` holds, per boss, the profile and `teams[]` per sub-set with members (role, ability, suggested item, STAB types), metrics (average BST, ratio to the Grunt pool, types covered, shared weaknesses, legendaries) and the active hard-mode rules.

## 9. Honest limits

- Team signature species and themes are from my recall of the games and anime, not a checked source. Please review `tools/pools_config.js`.
- The Pokédex has no moves or items. Suggested items follow role and stat shape; abilities are the best of each species' listed abilities by a simple value list, and the hidden ability is allowed.
- Custom and Delta forms are treated as ordinary species by their stats and types. Some "fill" picks (custom forms, Paradox Pokémon) are there because they fit the type theme and the stat window, not because the team uses them in canon.
- All numbers (curve, bonuses, party sizes, hard-mode rules) are launch defaults for tuning.
