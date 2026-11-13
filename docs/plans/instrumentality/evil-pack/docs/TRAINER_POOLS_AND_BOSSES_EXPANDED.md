# TRAINER POOLS, TIER POOLS AND BOSS TEAMS — EXPANDED EDITION

**Extends:** `docs/TRAINER_POOLS_AND_BOSSES.md` (every pool, Set and boss there is unchanged; this file adds to it)
**Read with:** `data/trainer_pools.json`, `data/boss_teams.json`, `data/expansion.json`, `docs/SPECIAL_VARIANTS_AND_SHADOWS.md`
*As in the base document: no Pokémon levels appear here. Levels come from the Set map. Species in every "Species" column are checked against your Pokédex. Team lists marked (approx.) are from recall and are meant to be edited.*

---

## X1. What this file adds

The base document builds a pool for every team, tier and sub-set, and a team for each of thirteen bosses. The Expanded Edition added people and fights the base pools were never asked to staff: 143 named characters, 110 special Pokémon, nine Cipher liaisons, twelve Apex Shadows, and six battle formats.

This file says **where each of them gets a team**, using the pools that already exist wherever possible.

| Section | Adds |
| --- | --- |
| X2 | The rule for named officers: a rank, a pool, and one signature |
| X3 | How special Pokémon slot into teams, and which form appears at which Set |
| X4 | The nine liaisons |
| X5 | A Cipher pool, by tier |
| X6 | The twelve Apex Shadows: form, parts, shield and timer by Set |
| X7 | Staffing the six formats and the Extended Cut |
| X8 | Authority pools: the defenders on the Stand-with route |
| X9 | The rival's and the Friend's extras |
| X10 | Rescue, Reclaim and the roaming teams' machines |
| X11 | The Region of Doom |
| X12 | Data and tests |

**Nothing here changes a base pool.** Where a named officer's script lists a team, the script's team is *layered over* the pool for their rank: the pool fills the party, the script supplies the signature.

---

## X2. Named officers

### X2.1 The rule

Every named character with a battle has a **rank**, and every rank already has a pool for every sub-set. So:

1. **Party size and strength** come from the rank's row in the base tier table (§3).
2. **Species** are drawn from that team's pool for that rank and the current sub-set, as for any trainer.
3. **The signature** from the script replaces pool slots, last slot first: one slot for a Specialist or Lieutenant, up to two for a Commander or above. The signature is their ace, a special Pokémon (`sv.*`), or a special Shadow (`ss.*`).
4. **If the script lists a full team** (marked "approx."), those species are *preferred* when the pool is rolled: each gets the top signature score. A listed species whose base stat total is above the tier's window for the current sub-set is held back until it fits, exactly like a boss's ace ladder.

The result: an officer fought in an early Set has a small party of early forms with one memorable Pokémon, and the same officer in a late Set has the team their script describes.

### X2.2 Ranks used by the Expanded cast

| Rank in the scripts | Count | Pool tier used | Signature slots |
| --- | --- | --- | --- |
| Associate | 4 | Associate | 0 |
| Specialist | 16 | Specialist | 1 |
| Lieutenant | 33 | Lieutenant | 1 |
| Commander | 18 | Commander | 2 |
| Executive | 17 | Executive | 2 |
| Second | 1 | Second | 2 |
| Leader | 4 | Boss rules (base §5) | Ace, and the script's named team |
| Liaison | 9 | Commander (Nascour: Executive), from the **Cipher** pool (X5) | 2 |
| Ally | 25 | The pool of the rank they would hold; fought only in friendly or what-if scenes | 1 |
| Others (Civilian, Hostage, Consultant, Contractor, Figurehead, Visitors) | 16 | None: they do not battle, or the script gives them one fixed encounter | — |

### X2.3 What-if characters

A canon character on the wrong side (a Gym Leader, a Champion's partner, a rival in uniform) keeps **their own canon type theme**, not the team's. Their party is rolled from the *team's* pool at their rank, filtered to their own types, with their canon ace as the signature. If the filter leaves too few species, the remainder comes from the team's pool unfiltered, and those Pokémon carry the team's line rule: they are the ones the team issued.

### X2.4 The player's and the rival's team versions

The rival in the Side-with variant uses the rival system's own team (rival Stage 4) plus **one** Pokémon of the team's line, drawn from the team's Lieutenant pool for the sub-set. The player's team version is the player's party; nothing is added.

---

## X3. Special Pokémon in teams

### X3.1 Slots

| Trainer rank | Special Pokémon allowed in one party |
| --- | --- |
| Associate, Grunt | 0, except Handlers (a Grunt-rank role that exists to carry one) |
| Specialist, Lieutenant | 1 |
| Commander, Executive, Second | 2 |
| Leader | As the script names them |

A special Pokémon takes the place of a pool Pokémon. It never adds a seventh.

### X3.2 Which form appears

Most special Pokémon list more than one form ("Varoom / Revavroom", "Kabutops / Z-Mega Kabutops"). One rule picks the form, and it is the base document's ace-ladder rule:

1. Take the forms in the order listed.
2. Use the **latest** form whose base stat total fits the window for the trainer's tier in the current sub-set.
3. Mega forms wait for **Set-3**, Z-forms and Spooky forms for **Set-4**, Gigantamax and Eternamax forms for **Set-6**, as in the base document.
4. If no listed form fits yet (a late-game species met early), the encounter is held back: the trainer uses a pool Pokémon in that slot and the special Pokémon is mentioned in dialogue instead.

A special Pokémon's **signature trait and line rule apply at every form.**

### X3.3 The budget

| Thing | Limit |
| --- | --- |
| Line rule | Worth about one held item. Never more than +20% damage |
| Signature trait | One situation where it is strong. Preferably information, not numbers |
| Line rule + trait + held item + ability | Inside the pack's +30% stacking cap |
| A special Pokémon's base stats | Its species' own. No special Pokémon has boosted stats |

### X3.4 Special Pokémon per team

| Team | Line | Special Pokémon | Special Shadows |
| --- | --- | --- | --- |
| Team Rocket | Black-Label | 9 | 6 |
| Rocket Returns | Dark Ball | 9 | 6 |
| Team Aqua | Tidebound | 6 | 3 |
| Team Magma | Cinderborn | 6 | 3 |
| Team Galactic | Spiritless | 11 | 7 |
| Team Plasma | Overclocked | 12 | 5 |
| Team Flare | Couture | 11 | 5 |
| Team Skull | Tagged-Up | 7 | 1 |
| Aether Foundation | Preserved | 6 | 4 |
| Macro Cosmos | Overcharged | 8 | 5 |
| Team Yell | Loud | 5 | 0 |
| Team Star | Tuned | 10 | 5 |
| Rocket Remnants | Patchwork | 5 | 0 |
| Team Snag'em | Snagged | 5 | 2 |
| Cipher | (uses every method) | — | 6 |
| **Total** | 14 lines | **110** | **58** |

---

## X4. The nine liaisons

Each liaison is a Cipher officer attached to a region's team. They battle at **Commander** strength, as the scripts rank them (Nascour, in Paldea, at Executive with a full six), from the Cipher pool (X5), with the core team their script gives them.

| Region | Liaison | Type lean | Species | Notes |
| --- | --- | --- | --- | --- |
| Kanto | **Ein** | Electric, Water (rain) | Lanturn / Pelipper / Manectric | A Shadow Raikou joins if `cipher.beast.raikou` is set |
| Johto | **Miror B.** | Water, Grass (rain dance) | Ludicolo / Sudowoodo | Three Ludicolo. The fourth dancer is a Sudowoodo pretending |
| Hoenn | **Dakim** | Ground, Rock | Claydol / Golem / Flygon / Whiscash | A Shadow Entei joins if `cipher.beast.entei` is set |
| Sinnoh | **Lovrina** | Psychic, Fairy, Ghost | Gardevoir / Mismagius / Delcatty / Roserade | Prefers status and charm |
| Unova | **Snattle** | Psychic, Rock, Steel | Lunatone / Solrock / Metagross / Castform | Weather by committee |
| Kalos | **Venus** | Water, Grass, Steel | Milotic / Bellossom / Steelix / Banette | A Shadow Suicune joins if `cipher.beast.suicune` is set |
| Alola | **Eldes** | Dragon, Steel, Ice | Latios / Metagross / Flygon / Walrein | He throws the battle; his team is real, his heart is not in it |
| Galar | **Ardos** | Psychic, Water, Fighting | Alakazam / Kingdra / Heracross / Snorlax | Does not bend. The hardest liaison |
| Paldea | **Nascour** | Psychic, Ghost, mixed | Gardevoir / Xatu / Dusclops / Walrein / Blaziken / Metagross | A full six at every Set where six is allowed |

*(All nine lists are approximate, from recall of the characters' teams, and are meant to be edited.)*

**Rules.**

- **Early Sets.** A liaison met in Set-1 uses the first forms of their listed lines where the window requires (Ralts for Gardevoir, Beldum's line for Metagross), by the X3.2 rule.
- **The carried beasts.** A Shadow Raikou, Entei or Suicune appears only if its flag exists, takes a signature slot, and follows the Legendary Shadow rules: it cannot be captured in the liaison fight.
- **Late.** A liaison fought at the finale (not beaten in their region) uses the same team at the finale's Set.
- **With `grandArc.enabled = false`** no liaison exists and nothing in this section is used.

---

## X5. A Cipher pool

Cipher is not one of the fourteen teams in `data/trainer_pools.json`. It needs a pool for its liaisons, for the Depot in the Region of Doom, and for the finale. This is a hand-written pool in the base format: one row per tier, used at every Set, with the base document's form rule deciding which stage of each line appears.

| Tier | Used for | Species |
| --- | --- | --- |
| Grunt (Peon) | Peons at the finale and the Depot | Makuhita / Poochyena / Houndour / Spheal / Baltoy / Mareep / Gulpin / Seedot / Spinarak / Numel / Carvanha / Shroomish |
| Specialist | Trudly and Folly; key-lair guards | Delcatty / Voltorb / Vulpix / Duskull / Ralts / Mawile / Snorunt / Pineco |
| Lieutenant | The Hexagon Brothers | Piloswine / Lunatone / Nosepass / Hypno / Golduck / Sableye / Dodrio / Roselia |
| Commander | Gorigan; finale captains; the liaisons' fill slots | Altaria / Banette / Magmar / Pinsir / Rapidash / Magcargo / Hitmonchan / Hitmonlee |
| Executive | Nascour's fill slots; the finale's Admins | Starmie / Electabuzz / Snorlax / Poliwrath / Manectric / Salamence / Marowak / Lapras |
| Second | Evice | Slaking / Salamence / Scizor / Tyranitar / Metagross / Dragonite |
| Leader | Grand Master Greevil | Rhydon / Exeggutor / Tauros / Articuno / Zapdos / Moltres |

**Type theme:** none. Cipher's pool is deliberately mixed: it is a company that buys what works. **Shadow rate:** every Cipher trainer above Peon carries at least one Shadow Pokémon; Peons carry one in three. **To build it into the data,** add a `cipher` block to `tools/pools_config.js` with these as signature species and rebuild; the generator will then produce sub-set pools like any other team's.

---

## X6. The twelve Apex Shadows, by Set

An Apex is fought as a Colossus (expanded Shadow document §X9). Its strength is set by the Set of the fight, not by a level.

### X6.1 Form by Set

| Code | Name | Species | Form used |
| --- | --- | --- | --- |
| XD001 | XD001 | Lugia | Lugia at every Set |
| XD002 | M2 | Mewtwo / Mega Mewtwo X | Mewtwo to Set-2; Mega Mewtwo X from Set-3 (the armor is the Mega) |
| XD003 | Dark Celebi | Celebi | Celebi at every Set |
| XD004 | Abyssal | Kyogre / Primal Kyogre | Kyogre to Set-2; Primal Kyogre from Set-3 |
| XD005 | Cinderheart | Groudon / Primal Groudon | Groudon to Set-2; Primal Groudon from Set-3 |
| XD006 | Stillhour | Dialga / Origin Dialga | Dialga to Set-3; Origin Dialga from Set-4 |
| XD007 | Farshore | Palkia / Origin Palkia | Palkia to Set-3; Origin Palkia from Set-4 |
| XD008 | Absolute | Kyurem / Black Kyurem / White Kyurem | Kyurem until the fusion sub-stage; Black or White by the dragon the script supplies |
| XD009 | The Battery | Xerneas / Yveltal | By the version of the plan in play; one or the other, never both |
| XD010 | The Mother Beast | Nihilego | Nihilego at every Set |
| XD011 | The Darkest Day | Eternatus / Eternamax Eternatus | Eternatus to Set-5; Eternamax Eternatus from Set-6 |
| XD012 | The Cassiopeia Engine | Revavroom | Revavroom at every Set |

### X6.2 Parts, shield and timer

Shield per part is a share of the Apex's maximum HP. The default timer is the base value; scripts adjust it (M2 is ten turns at every Set).

| Set | Shield per part | Default timer | Parts cracked for free |
| --- | --- | --- | --- |
| Set-1 | 14% | 12 | 1 |
| Set-2 | 16% | 12 | 1 |
| Set-3 | 18% | 11 | 0 |
| Set-4 | 20% | 11 | 0 |
| Set-5 | 22% | 10 | 0 |
| Set-6 | 24% | 10 | 0 |
| Set-7 | 26% | 10 | 0 |
| Set-8 | 28% | 9 | 0 |
| Set-9 | 30% | 9 | 0 |

| Code | Parts | Total shield to break at Set-1 | At Set-5 | At Set-9 |
| --- | --- | --- | --- | --- |
| XD002 M2 | 4 | 49% (one part cracked) | 88% | 120% |
| XD003 Dark Celebi | 3 | 35% | 66% | 90% |
| XD004 Abyssal, XD005 Cinderheart | 3 each | 35% each | 66% each | 90% each |
| XD006 Stillhour, XD007 Farshore | 2 each | 21% each | 44% each | 60% each |
| XD008 Absolute | 3 | 35% | 66% | 90% |
| XD009 The Battery | 3 | 35% | 66% | 90% |
| XD010 The Mother Beast | 3 | 35% | 66% | 90% |
| XD011 The Darkest Day | 3, then an endurance round | 35% | 66% | 90% |
| XD012 The Cassiopeia Engine | 5 | 63% | 110% | 150% |
| XD001 | Up to 9, at two-thirds shield | Up to 84% | Up to 132% | Up to 180% |

*(Set-1 totals count one part as cracked, at half its shield. Percentages are of the Apex's own maximum HP, so "120%" means the parts together hold a little more than the body would.)*

**Reading the table.** The work to free an Apex roughly doubles between Set-1 and Set-9, while the player's damage grows by much more than that across the same span. The Colossus is meant to get *relatively* easier as a run goes on. It is the spectacle of a climax, and the Leader before it is the wall.

### X6.3 The Apex's own moves

An Apex has its signature Shadow move, two or three ordinary Shadow moves, and one move from its species. Each part removes one, in the order the script lists. The species move is never the first removed, so that the fight still feels like that Legendary to the end.

---

## X7. Staffing the formats and the Extended Cut

### X7.1 Who fills each format

| Format | Opponents | Pool tier | Party size |
| --- | --- | --- | --- |
| **Siege Map** (a claimed district) | One district captain | Lieutenant | By the tier's row for the Set |
| **Blackout** (anchors, patrols) | Two or three | Specialist; the last may be a named officer | As the tier |
| **Front** | Three lane trainers | Commander, at the *gauntlet's* strength, not the boss's | 2–3 each, never more than 3 |
| **Convoy** | Three to five, rising | Grunt → Specialist → Lieutenant → Commander | As each tier; the last is the named target |
| **Colossus** | The Apex | X6 | One, with parts |
| **Debate** (if it comes to a battle) | The opponent | Executive | As the tier |
| **Breather** | None | — | — |

### X7.2 The Extended Cut's battle budget

| Phase | Battles | Tier mix |
| --- | --- | --- |
| 1 Approach | 2–3 | Specialist, Specialist, (one named Lieutenant or Commander) |
| 2 Gauntlet | 4–7 | Base formula. New floors add Handlers (Grunt rank, one special Pokémon) and named Lieutenants |
| 3 Officers | 2–3 | Executives and the Second; the liaison, from the Cipher pool |
| 4 Set piece | 1–2 | As the base script |
| 5 Leader | 1 | Boss rules, with the script's named team |
| 6 Apex | 1 | X6 |
| 7 Optional | 0–4 | By format (X7.1) |

**The ceiling.** No Extended Cut fields more than **three** fights at Executive strength or above before the Breather, or more than **two** after it besides the Leader and the Apex. A script that names more officers than that rotates them: the ones not fought are seen, and speak, and are counted as beaten if their district is Held.

### X7.3 Handlers

A **Handler** is a Grunt-rank trainer whose job is one special Pokémon. Their party is the Grunt pool's, one smaller than usual, plus the special Pokémon in the last slot. Handlers are where most players first meet a team's line rule, so the line rule's announcement must be its clearest here.

---

## X8. Authority pools

On the Stand-with route the player fights the region's defenders. The base document staffs them from "ordinary trainers at the same difficulty as team ambushes." These four small pools give them a face. Each uses the base form rule, so first forms appear in early Sets.

| Defender | Pool tier equivalent | Species | Where they appear |
| --- | --- | --- | --- |
| **Police** | Grunt to Lieutenant | Growlithe / Arcanine / Herdier / Stoutland / Manectric / Machoke / Machamp / Magneton | Hold the Line; authority ambushes while Wanted |
| **Rangers** | Specialist to Commander | Staraptor / Sawsbuck / Ursaring / Leavanny / Lucario / Luxray / Floatzel / Mamoswine | Hold the Line; the Duty Roster's contested districts |
| **Gym Trainers** | Lieutenant | — | Hold the Line; one lane of the Cavalry. Their Pokémon are the type of the last Gym the player beat, drawn from every team's pools filtered to that type |
| **Volunteers** | Associate | Chansey / Blissey / Audino / Wingull / Pelipper | The barrier. They heal. They battle only if the player insists, and lose |

**The Defender** (base Phase 4) is unchanged: the Gym Leader of the last Gym the player beat, at Gym-leader tier +1. **The Cavalry** (Stand-with expanded, Phase 5) are named allies from the other route; each uses the pool of the rank they would hold, filtered to their own canon types, with their canon ace.

---

## X9. The rival's and the Friend's extras

| Who | When | Team |
| --- | --- | --- |
| The rival, Side-with | Phase 2.5 | Rival Stage 4 team, plus one line Pokémon from the team's Lieutenant pool. In Johto that Pokémon is the Red Gyarados; in Sinnoh it is Spiritless |
| The rival, as a Region of Doom Gym Leader | Gym 6 | The team from their last fight with the player, plus one Pokémon the player released, traded or lost in any run |
| The Friend, friendly spar | The Errand | Three Pokémon from the *player's region's wild pool* at the previous stage's strength. The Friend has no team affiliation and never carries a line or Shadow Pokémon |
| A stand-in rival | Rivals disabled | A Gym-circuit trainer: the Lieutenant-strength pool of the region's first three Gym types |

---

## X10. Rescue, Reclaim and the roaming teams

| Fight | Opponent | Pool |
| --- | --- | --- |
| Rescue Plan: the Door, the Cage | A jailer; a guard | Specialist of the holding team |
| Rescue Plan: Loud Grab | Three in a row | Grunt, Specialist, Lieutenant of the holding team |
| The Pound (Siege Map) | The district captain | Lieutenant of the holding team |
| A cellmate | — | Drawn from the holding team's **Grunt** pool for the sub-set: never stronger than what the player has been fighting |
| Reclaim | A Handler with a recall device | Lieutenant, with one Pokémon of the team's line |
| Double Booking | One Grunt from each team | Grunt |
| The Truce | Nobody | — |

### X10.1 The Remnants' machines

Each region's machine is fought as the last entry of the Cache. It is one sprite, with the base stats of the species it is built to look like, at Specialist strength, carrying one Patchwork gadget.

| Region | Machine | Species |
| --- | --- | --- |
| Kanto | The Mop-o-Tron | Persian |
| Johto | The Mecha-Marill | Marill |
| Hoenn | The Wailmer Pail | Wailmer |
| Sinnoh | The Buneary Booster | Buneary |
| Unova | The Clean Sweep | Minccino |
| Kalos | Le Grand Furfrou | Furfrou |
| Alola | The Rockruff Rider | Rockruff |
| Galar | The Yamper Scamper | Yamper |
| Paldea | The Lechonk Truck | Lechonk |

### X10.2 Snag'em's marks

A mark is one named Pokémon with a real trainer. It is not part of any pool. It appears in Wakin's or Gonzap's party as a Snagged Pokémon (it may refuse them) and is recovered by winning.

| Region | Species |
| --- | --- |
| Kanto | Porygon |
| Johto | Ampharos |
| Hoenn | Milotic |
| Sinnoh | Lucario |
| Unova | Zoroark |
| Kalos | Aegislash |
| Alola | Comfey |
| Galar | Corviknight |
| Paldea | Tinkaton |

---

## X11. The Region of Doom

| Fight | Team |
| --- | --- |
| **Gym Leaders from the ledger** | Their own rank's pool for their team, at the Set of the visit, with the party size set by Marks held (4, 5 or 6), and the signature from their script |
| **Placeholder Leaders** | Tier 5 or 6 as `data/doom_leaders.json` says; drawn from *every* team's pool at that tier, filtered to their type bias. They have no line Pokémon: they belong to no team |
| **Takeover captains** | Lieutenant (districts 1–9) or Commander (Crown Yard) of the team holding the district |
| **A taken Apex guarding a district** | X6, at the Set of the visit, with whatever parts the ledger says were left |
| **The Chairperson** | Six Pokémon, one from each team in the ledger, each team's highest-tier pool for the Set. The last is always a Ghost type |
| **The Depot's Cipher Gym** | The Cipher pool (X5): a liaison, Gonzap, or Greevil |
| **The player's own team, used by the Chairperson** (after taking the chair) | A copy of the party from the player's last winning run, at the Set of the visit |

---

## X12. Data and tests

### X12.1 Data

| Data | Where it is now | Where it should go |
| --- | --- | --- |
| Named officers' ranks and signatures | `data/expansion.json` (`characters`) | Used directly |
| Special Pokémon, forms, traits | `data/expansion.json` (`specialPokemon`) | Used directly |
| Apex species and codes | `data/expansion.json` (`specialShadows`) | `data/apex.json`, with parts and move order, when extracted |
| Cipher pool, authority pools | This document | `tools/pools_config.js`, as a `cipher` team and four `authority` blocks |
| Liaison core teams | The scripts and this document | Signature lists in the `cipher` block |

### X12.2 Tests

- Every Species cell in this document resolves in the Pokédex.
- A named officer's party size equals their rank's row for the sub-set; a signature never adds a seventh Pokémon.
- A special Pokémon's form is the latest listed form that fits the tier's window, and Mega, Z and Gigantamax forms obey the base Set gates.
- A special Pokémon held back for strength is replaced by a pool Pokémon, never dropped as an empty slot.
- A what-if character's party is their own types where the pool allows, and never empty.
- A liaison's carried beast appears only when its flag exists.
- Apex form, shield and timer follow the Set of the fight; the two-thirds rule applies above five parts.
- A Front's lane trainers are at gauntlet strength.
- No Extended Cut exceeds the Executive-strength ceiling in X7.2.
- A cellmate comes from the holding team's Grunt pool for the current sub-set.
- A placeholder Leader's party contains no line Pokémon.
- The Chairperson's last Pokémon is a Ghost type for every ledger.
- With every Expanded setting off, `trainer_pools.json` and `boss_teams.json` produce exactly the teams the base document describes.
