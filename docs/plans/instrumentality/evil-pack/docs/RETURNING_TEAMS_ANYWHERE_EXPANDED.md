# ROAMING TEAMS, IN ANY REGION — EXPANDED EDITION

**Extends:** `docs/RETURNING_TEAMS_ANYWHERE.md` (every rule there still holds; this file adds to it)
**Read with:** `scripts/00_ROAMING_CAST.md`, `scripts/expanded/00_ROAMING_CAST_EXPANDED.md`, `docs/GRAND_ARC.md`
*Jessie, James, Meowth, Butch, Cassidy, Domino, Gonzap, Wakin, Biden, Agrev, Wes and Rui are canon characters. Every scheme, gadget, scene and line here is original to this project. Species in tables are checked against your Pokédex.*

---

## X1. What this file adds

The base document makes two roaming teams work in any region with one small module and eighteen one-line kits. The Expanded Edition gave those teams a much larger story (Cipher behind Snag'em, the trio as accidental witnesses to all of it). This file grows the module to carry that story without breaking its caps.

| Section | Adds |
| --- | --- |
| X2 | The roaming cast, and who roams *for* the player |
| X3 | Three more stances (six in all) |
| X4 | The module grows from four beats to eight |
| X5 | All eighteen kits in depth: the scheme, the disguise, the machine, the prize |
| X6 | The trio, region by region: nine schemes and how each one fails |
| X7 | `lead` mode: both climax adapters as Extended Cuts |
| X8 | `stress` mode: the Double Booking |
| X9 | Roaming Heat, ambush ranks and lines |
| X10 | The roaming teams and the Grand Arc |
| X11 | Things that carry from region to region |
| X12 | Dialogue bank |
| X13 | Tests |

**One base rule, restated.** Base rule 7 says Cipher is never on screen. With `grandArc.enabled` (the default in the Expanded Edition) Cipher *is* on screen: through one liaison per region and at the finale. What rule 7 protects is unchanged: Cipher never leads a region, never replaces a canon leader, and never has an allied route. With `grandArc.enabled = false` the base rule applies exactly as written.

**The caps still hold.** In `second` mode a roaming team adds at most **one battle** to a regional climax and moves Operation Strength by at most **±1**. Every new beat below is outside the climax, optional, or both.

---

## X2. The roaming cast

### X2.1 Who travels

| Who | Team | Rank | Role in the module |
| --- | --- | --- | --- |
| **Jessie, James, Meowth** | Rocket Remnants | Specialist (2) | Every region, every mode. One comic beat and one allied or wild beat. They never own a climax |
| **Butch and Cassidy** | Rocket Remnants | Commander (4) | Acting leaders. Competent, bitter about not being the famous ones |
| **Domino** | Rocket Remnants | Commander (4) | The Opportunist cameo. The only Remnant who files reports |
| **Gonzap** | Team Snag'em | Leader (7) | Acting leader. Runs a theft ring; believes it is his |
| **Wakin** | Team Snag'em | Lieutenant (3) | The Phase 2.5 duel. Loyal, tired |
| **Biden, Agrev** | Team Snag'em | Specialist (2) | Lookouts and drivers; duels in `lead` mode |
| **The liaison** | Cipher | Executive (5) | One per region, attached to the region's own team, not to a roaming team (see `GRAND_ARC.md`) |

### X2.2 Who roams for the player

The Expanded Edition adds people who move from region to region on the player's side. They use the same placement seed as the roaming teams, so they tend to turn up where the trouble is.

| Who | First appears | What they do in any region |
| --- | --- | --- |
| **Wes** | The event *You Owe Me a Building* | Shadows Team Snag'em. If Snag'em is placed in a region, Wes is in it. He can take one Phase 2.5 duel off the player's hands, once per run |
| **Rui** | With Wes | Sees auras. Gives the first key hint for any Named Shadow in the region |
| **Professor Krane** | Raid 6, "The Key Lair" | After he is freed: a Purify Chamber at one rest node per region |
| **Chobin** | With Krane | Arrives late with the wrong equipment. Sells one useful gadget per region |
| **Looker** | Any `exposed` raid result | Follows the Remnants. Will trade Intel for evidence of a scheme (X6) |

None of them fights a climax for the player. Like the trio, they are furniture that moves.

---

## X3. Three more stances

The base stances are **Opportunist**, **Parasite** and **Convenience ally**. A kit may now use one of three more. Each obeys the same caps.

| Stance | Relation to primary team | What it means | Cameo modifier |
| --- | --- | --- | --- |
| **Understudy** | −20 | The roaming team is copying the primary team's plan, one size smaller and a week behind | The Phase 2.5 duel is fought over a **miniature** of the climax objective. Winning it shows the player the real objective's layout early (one point is pre-marked). Losing it changes nothing |
| **Contractor** | 0 | The roaming team was hired, by the liaison, to do one job | The acting leader holds the liaison's case. Winning the Phase 2.5 duel gives **Intel on the liaison** (their first Pokémon and their ace are revealed before they are fought). Losing it gives the liaison one extra item |
| **Refugee** | +10 toward the player | The roaming team has already lost something here and is hiding | There is no Phase 2.5 duel. Instead the acting leader asks for help (one optional battle, outside the climax). Helping gives one lane of support in the Extended Cut's Siege Map. Refusing costs nothing |

**Which stance a kit uses.** The base kits keep their stances. The seeded and chosen placement modes may roll one of the new three instead: `rng(hash(runSeed, regionId, "roaming-stance")) < 0.35` picks from the new list. The Run Event Log records it.

**Contractor is Snag'em's natural stance** once the Grand Arc is in motion: if `cipher.x.stock ≥ 2` when Snag'em is placed, the stance is Contractor regardless of the roll. Gonzap does not enjoy it.

> **GONZAP** *(Contractor)*: "I don't know what's in the case. I get paid not to know. Nine years I've been paid not to know, and the bill still ain't settled."

---

## X4. The module, grown

The Roaming Team Module had four beats. It now has eight. The four new ones are short, optional, and never inside a climax.

| Beat | When | What happens | New? |
| --- | --- | --- | --- |
| **R1 Sighting** | Act 0 | A rumor line | base |
| **R1b Postcard** | The node after R1 | The player receives something from the roaming team by mistake: a misdelivered invoice, a wanted poster with the wrong face, a balloon repair bill. It names the scheme (X5) | new |
| **R2 Collision** | Ignition + 3 nodes | The clash that shows the stance | base |
| **R2b Double Booking** | At Raid 1 or Raid 2, 40% | The roaming team has turned up at the same site, for its own reasons. One room of the raid has both teams in it, arguing. The player may slip past (no battle), or take a side for that room | new |
| **R3 Cache** | After Raid 1 | The one-area hideout raid | base |
| **R3b Truce** | Any rest node after R3, once | Someone from the roaming team sits down at the player's fire. No battle. A trade, a tip, or a confession (X12.3) | new |
| **R4 Cameo** | Climax | The Phase 2.5 duel, or the stance's variant | base |
| **R5 Curtain Call** | After the climax | The roaming team leaves the region. How they leave depends on everything above (X11.3) | new |

### X4.1 R2b in detail

The Double Booking is the module's best joke and its most useful beat. The primary team's Grunts and the roaming team's Grunts are in the same corridor, each insisting the other leave.

| The player | Result |
| --- | --- |
| **Slips past** | No battle. The raid's timer gains one turn while they argue |
| **Backs the roaming team** | A Double Battle beside one Remnant or Snag'em Grunt against two of the primary team's. Roaming reputation +5. The roaming team owes one favor (X11.1) |
| **Backs the primary team** | Only on the Inside Man route. A Double Battle the other way. Reputation with the primary team +3 |
| **Fights both** | Two ordinary battles in a row. Both sides remember |

It never changes the raid's result table.

### X4.2 R3b in detail

Who sits down depends on the team and the run.

| Team | Who comes | What they offer |
| --- | --- | --- |
| Rocket Remnants | Meowth, alone, if the trio owe the player two or more favors (X11.1); otherwise James, who has been sent to ask for food | A tip about the primary team's next raid, or a trade from James's bottle-cap collection (one held item) |
| Team Snag'em | Wakin | He asks the player not to tell Gonzap he was here. He wants to know if the Pokémon they took last week is all right. He gives back one thing: a Poké Ball, a name, an address |

A Truce can be refused. Nothing is lost.

---

## X5. The kits in depth

Each base kit has a hideout, a stance and a cameo. Here each also gets a **scheme** (what they are actually doing in this region), a **cover** (what they pretend to be), and its hardware. For the Remnants that is a **machine**: one ridiculous vehicle, fought as the last Pokémon-equivalent in the R3 Cache with a Patchwork gadget on it. For Snag'em it is a **mark**: one Pokémon in the region that Gonzap has been paid to take.

### X5.1 Rocket Remnants

| Region | Scheme | Cover | The machine | Species |
| --- | --- | --- | --- | --- |
| Kanto | *Employee of the Month*: prove they still work for Team Rocket by finishing a job nobody assigned | Silph Co. cleaning contractors | **The Mop-o-Tron**: a floor polisher with arms | Persian |
| Johto | *Pirate Radio*: sell advertising on a stolen frequency | Disc jockeys ("Jess and the Gents in the Morning") | **The Mecha-Marill**: a broadcast van shaped like one | Marill |
| Hoenn | *Salvage Rights*: follow two fleets and pick up what they drop | Marine insurance assessors | **The Wailmer Pail**: a submarine that mostly floats | Wailmer |
| Sinnoh | *Space Tourism*: sell tickets to whatever Galactic is building | Galactic recruits, in uniforms a size too small | **The Buneary Booster**: a rocket sled with ears | Buneary |
| Unova | *Liberation, Inc.*: collect "released" Pokémon before their trainers change their minds | Plasma knights, with cardboard shields | **The Clean Sweep**: a street-sweeper that collects Poké Balls | Minccino |
| Kalos | *Haute Heist*: steal the look, sell the knock-off | Fashion critics from a magazine nobody can find | **Le Grand Furfrou**: a parade float | Furfrou |
| Alola | *Malasada Monopoly*: corner the market while both teams are busy | Skull Grunts ("Yo."), then Aether staff ("Yo, but quietly.") | **The Rockruff Rider**: a food truck with a catapult | Rockruff |
| Galar | *Unofficial Merchandise*: sell League scarves outside every stadium | Macro Cosmos stewards | **The Yamper Scamper**: a ticket booth on wheels | Yamper |
| Paldea | *School Trip*: enrol at the Academy for the cafeteria | Exchange students of improbable age | **The Lechonk Truck**: a Starmobile, borrowed, repainted badly | Lechonk |

Every machine is **Patchwork** (roaming script 00x, §E3): it carries one gadget, shown to the player, that goes off once. Beating the machine in the Cache removes one Pokémon from the climax cameo, as the base rule says.

### X5.2 Team Snag'em

| Region | Scheme | Cover | The mark | Species |
| --- | --- | --- | --- | --- |
| Kanto | *Clearance*: buy Rocket's Game Corner stock cheap, then take the rest | Prize-machine repairmen | A Game Corner prize that was somebody's partner before it was a prize | Porygon |
| Johto | *Signal Boost*: snag by radio, without being in the room | Antenna riggers | The lighthouse's own, the one the whole town visits | Ampharos |
| Hoenn | *Unclaimed Cargo*: whatever is in a cage belongs to whoever opens it | Dock inspectors | A contest champion, kept in a tank on the losing team's ship | Milotic |
| Sinnoh | *Cold Storage*: use the Chain's power to hold more than the Machine can | Refrigeration engineers | A partner trained on Iron Island, taken from a trainer who is still looking | Lucario |
| Unova | *Second-hand*: a "freed" Pokémon has no trainer to object | Plasma's own logistics, by agreement | One that released itself rather than be released, and has been hiding in the crowd | Zoroark |
| Kalos | *Bottling*: draw off life-force and sell it by the litre | Café suppliers | An heirloom from a château, three hundred years in one family | Aegislash |
| Alola | *Inventory*: the Paradise catalogued everything for them | Aether auditors | A Pokémon Center nurse's helper, borrowed "for study" | Comfey |
| Galar | *Big Game*: one Dynamaxed prize pays for the year | Wild Area wardens | A Flying Taxi's own bird, still wearing its harness | Corviknight |
| Paldea | *Lost Property*: students leave things lying about | Academy caretakers | A student's partner, taken from a locker. Its hammer is still in the locker | Tinkaton |

**The mark is always a Snagged Pokémon with a real trainer.** If the player wins the Cache or the Phase 2.5 duel, the mark is recovered. It can then be returned (the trainer is found at a named node; reward: an item, reputation, and the *Named* Heart Scar if it was Shadow) or, on the Inside Man route only, kept. Keeping it is tracked like any use of Gonzap's Machine (expanded Shadow document, X11.2).

### X5.3 Kit data

Each kit gains four fields in `data/returning_team_kits.json` when this is implemented: `scheme`, `cover`, `machine` or `mark`, and `species`. The eighteen `pr.` hideout ids are unchanged.

---

## X6. The trio, region by region

Jessie, James and Meowth appear in every region whatever the placement (base rule 4). The base script gives each region one comic beat and one allied or wild beat. This table gives each region the scheme that connects them, so that the two beats are the beginning and the end of one small story.

| Region | The scheme | How it starts (comic beat) | How it fails | How it ends (allied or wild beat) |
| --- | --- | --- | --- | --- |
| Kanto | Win back their old jobs by catching the player's best Pokémon for the boss | A pit trap, signposted, with their names on the sign | The boss has not thought about them in years. Matori does not know who they are | They watch the Silph lights from a rooftop. Meowth translates what the caged Pokémon are saying. They open one cage and tell nobody |
| Johto | Get on the radio | They audition for Archer's broadcast and are told they are "too memorable" | The frequency they steal is the one the transmitter uses on the Gyarados | James recognises the sound as pain, because of his Growlithe at home. They pull the plug on their own show |
| Hoenn | Sell umbrellas and sunscreen to both teams | A stall on the footbridge between two armies | The weather changes faster than the stock | When the sea rises they are the ones rowing people off Slateport pier, charging nothing, and furious about it |
| Sinnoh | Join Team Galactic for the dental plan | They fail the entrance exam: all three of them answer the question "What do you feel?" at length | They are assigned to the Spiritless ward as cleaners | Jessie cannot stand that the Pokémon there do not react to her. She performs for them for six hours. One of them blinks |
| Unova | "Liberate" Pokémon and keep them | A recruitment stall next to Plasma's, with a smaller banner | A freed Pokémon will not leave Meowth alone, and he cannot make himself sell it | Meowth walks it home across three towns. He will not say this happened |
| Kalos | Become famous | James is mistaken for a noble at Parfum Palace, which he is | His name is on the list of those to be saved. Jessie's and Meowth's are not | He tears his invitation in half at the door. Lysandre, watching, says nothing, and for a moment looks sick |
| Alola | Retire | They buy a malasada truck with stolen money and are very happy for nine days | Team Skull eat on credit and Aether shuts them down on hygiene grounds | They feed Po Town through the barricade anyway. Guzma pays the whole tab at the end, in coins, without a word |
| Galar | Sell bootleg League scarves | Outside every stadium, one town ahead of the stewards | Team Yell buy the entire stock, for Marnie, and then realise they were bootleg | The Yell Grunts and the trio discover they are the same sort of people. There is a very loud evening. Nobody remembers who won |
| Paldea | Go back to school | They enrol. James is good at it. Jessie is not, and is put in remedial art, where she is a genius | They are found out when Meowth is marked absent for being a Pokémon | Team Star's Bosses, who know what it is to be thrown out, save them seats in the cafeteria |

**Rules.** Each scheme is two scenes and at most one battle (Specialist rank, never a wipe risk). The second scene always happens, whether the player won, lost or skipped the first. Trio reputation rises by +5 for any choice in either scene that is kind to them, as in the roaming script's events.

---

## X7. `lead` mode: the adapters as Extended Cuts

In `lead` mode a roaming team replaces the region's own team and uses its own climax adapter (base §7). With `climax.cut = "extended"` the adapters grow like every other climax. The base rule still applies: the region's difficulty band is set one step lower.

### X7.1 Rocket Remnants — *Departure Lounge*, Extended Cut

| # | Phase | Format | New or base | Battles |
| --- | --- | --- | --- | --- |
| 0 | **Now Boarding** | Briefing: the airship is on the dock, the rare Pokémon is aboard, and the trio were not invited | base | 0 |
| 0b | **The Concourse** | Siege Map: three terminals (Arrivals, Customs, the Hangar) | new | 0 |
| 1 | **Check-in** | Blackout: *Final Call* (a boarding timer shortens each battle by a turn until the tannoy is cut) | base, widened | 3–4 |
| 2 | **Butch and Cassidy** | Double Battle | base | 1 |
| 3 | **Domino** | Duel on the gangway | base | 1 |
| — | **The Departure Lounge** | Breather: vending machines, plastic seats, one very good coffee | new | — |
| 4 | **Hot-Air Chase** | Convoy: three battles from balloon to balloon, with the distance to the airship as the meter | base, widened | 3 |
| 5 | **The Captain** | Boss: whoever the Remnants found to fly it (Butch, promoted beyond his ability, with Cassidy correcting him) | new | 1 |
| 6 | **The Trio** | Comic bookend, as the base says: a Specialist-tier team with Meowth's gadgets as the phase change | base | 1 |
| 7 | **Resolution** | Return the Pokémon / let the trio fly / hand the airship to the authorities | base | 0 |

Typical total: **10–11 battles**. There is no Apex. The Remnants bind nothing, and their climax is the one in the game that is allowed to be mostly funny.

> **CASSIDY** *(Phase 2)*: "We planned this for a year. A *year*. And the first people on the dock are those three and a child."
> **BUTCH:** "It's *Butch*."
> **CASSIDY:** "Nobody said anything, Butch."

**The fourth resolution (Extended Cut only).** If trio reputation is +15 or more, a fourth choice appears: **[Give them the airship.]** Jessie, James and Meowth fly it out of the region. In every later region of the run their comic beat begins with it landing on something.

### X7.2 Team Snag'em — *Pyrite Dawn*, Extended Cut

| # | Phase | Format | New or base | Battles |
| --- | --- | --- | --- | --- |
| 0 | **The Plaza at Dawn** | Briefing: a mass conversion, a crowd that thinks it is a festival | base | 0 |
| 0b | **Four Corners** | Siege Map: the plaza's four approaches | new | 0 |
| 1 | **The Stalls** | Gauntlet of Shadow Pokémon trainers; Blackout: *Array Hum* (every Shadow on the field gains +10 Surge per turn until one emitter falls) | base, widened | 3–4 |
| 2 | **Biden, Agrev, Wakin** | Three duels; Wakin's may be skipped if he was given a reason to stop (the Truce, or `snagem.x.gonzap = asked`) | base | 2–3 |
| — | **The Fountain** | Breather. Rui is here if she has been met. She points at which emitter matters | new | — |
| 3 | **The Array** | Set piece: destroy three emitters in eight turns | base | 1–2 |
| 4 | **Gonzap** | Boss | base | 1 |
| 5 | **The Client** | Boss: the region's Cipher liaison, who has been in the crowd the whole time, taking readings | new | 1 |
| 6 | **The Stock** | Colossus, small: not an Apex but a **Snag Machine array** fused around the region's mark (X5.2). Three clamps. Breaking all three frees the mark | new | 1 |
| 7 | **Resolution** | Purify the stock / seal the plant / hand the Machine to the League | base | 0 |

Typical total: **10–13 battles**.

- **Phase 5 exists only with `grandArc.enabled`.** Beating the liaison here earns that region's Data ROM in-region, since in `lead` mode the liaison has no regional team to be attached to.
- **Gonzap's turn.** If `snagem.x.gonzap = asked`, Gonzap does not fight in Phase 4. He steps aside and fights beside the player in Phase 5. Phase 4 is then counted as won.

> **GONZAP** *(Phase 4, if he has asked)*: "Nine years. I found out what they do with them. Go on. I'll hold his coat. I'll hold his *arms*."

### X7.3 What `lead` mode does to the region

| Thing | In `lead` mode |
| --- | --- |
| The region's own team | Is **asleep**: it never ignites, its raids do not appear, and its Doom Ledger entry for the run is `dormant` |
| Its Apex and liaison | The Apex is not built this run. The liaison appears only in Phase 5 above |
| Gyms, rival, rescue plan | Unchanged |
| The trio | Still appear, as always, and in *Departure Lounge* they are the last fight |

---

## X8. `stress` mode: the Double Booking

With both roaming teams in one region (base rule 6), the cap applies to the pair together: one extra climax battle between them, and ±1 Operation Strength between them.

**The two teams despise each other.** The Remnants think Snag'em are thugs. Snag'em think the Remnants are a cabaret act. This is the content.

| Beat | In `stress` mode |
| --- | --- |
| R1 Sighting | Two rumors that contradict each other |
| R1b Postcard | The player receives each team's complaint about the other |
| R2 Collision | They collide with *each other*. The player arrives during it. Either side can be backed, or both left to it |
| R2b Double Booking | A triple booking: the primary team's Grunts, facing both. The corridor is impassable for one turn while everyone shouts |
| R3 Cache | One hideout, contested: whichever team the player did not back holds it |
| R3b Truce | Meowth and Wakin arrive at the same fire, separately, and each pretends not to see the other |
| R4 Cameo | **One** Phase 2.5 duel, against whichever acting leader won the Collision. The other has already left |
| R5 Curtain Call | They leave in opposite directions, and one of them has the other's luggage |

> **JESSIE:** "They *steal Pokémon*. For *money*."
> **JAMES:** "Jessie, we—"
> **JESSIE:** "We do it with *flair*."
> **GONZAP:** "I've had hernias with more flair."

---

## X9. Roaming Heat, ambush ranks and lines

The roaming sub-meter is the base rule: it starts at 10, ambushes at half the normal rate, and never sends anyone above Commander.

| Roaming Heat | Who comes | Team size | Remnants: what it looks like | Snag'em: what it looks like |
| --- | --- | --- | --- | --- |
| 0–19 | An Associate | 1–2 | A net that misses | A man who says "Nice Pokémon" and keeps walking |
| 20–39 | A Grunt | 2–3 | A pit trap with a welcome mat | A van that slows down |
| 40–59 | A Specialist: often the trio themselves | 3 | A balloon, a speech | Biden or Agrev, leaning on the van |
| 60–79 | A Lieutenant | 3–4 | A machine (X5.1), smaller than advertised | Wakin, apologetic |
| 80–100 | A Commander | 4–5 | Butch and Cassidy, on time and in a mood | Gonzap himself, "just to look" |

**What raises it:** winning the Cache (+10), backing the other side in a Double Booking (+5), refusing a Truce (+0: they are not offended, only sad), returning a mark to its trainer (+10 for Snag'em), exposing a scheme to Looker (+15 for the Remnants).

**What lowers it:** a Truce accepted (−10), backing them in a Double Booking (−5), any kind choice toward the trio (−3).

### X9.1 More ambush lines

**Rocket Remnants**

| Heat | Intro | Defeat |
| --- | --- | --- |
| Low | "Halt! In the name of an organization that may or may not still employ us!" | "We'd like to speak to a manager. Any manager." |
| Mid | "We've upgraded the net. It's a *different* net." | "It was the same net. I said it was the same net." |
| High | "No speeches today. Cassidy says speeches are why we lose." | "We didn't do the speech and we *still* lost. So it's not the speech. Write that down." |

**Team Snag'em**

| Heat | Intro | Defeat |
| --- | --- | --- |
| Low | "Easy. I only want the one. You've got five more." | "Fine. Keep 'em. Bad luck, taking from someone who looks at 'em like that." |
| Mid | "Boss wants that one in particular. Don't ask me why. I didn't." | "I'll tell him you weren't home." |
| High | "He's sent me twice now. Third time he comes himself. I'm doing you a favor here." | "…He's going to come himself." |

---

## X10. The roaming teams and the Grand Arc

### X10.1 Snag'em is the delivery service

Every method Cipher sold needed stock to test on, and every liaison needed someone to fetch it. That is Team Snag'em in every region: not a rival scheme, but the truck that serves the main one.

| Signal | Meaning | Effect in the region |
| --- | --- | --- |
| `cipher.x.stock` 0–1 | Cipher's supply is thin | Snag'em keep their base kit stance |
| `cipher.x.stock` 2–3 | Supply is flowing | Snag'em are **Contractors** (X3). The Cache holds crates addressed to the liaison |
| `cipher.x.stock` 4–5 | Cipher is nearly ready | Gonzap is short-tempered and short-staffed. Half his ambushes do not happen: the crews have been called to the island |

### X10.2 Raids 5 and 6, anywhere

The roaming script's two new raids are not tied to a region.

| Raid | Offered when | Placed in |
| --- | --- | --- |
| **Raid 5, "The Under"** (`pr.any.the-under`) | Snag'em are placed in any mode and the player has won one Cache | The region where Snag'em are placed, under its largest city |
| **Raid 6, "The Key Lair"** (`pr.any.cipher-key-lair`) | Chobin has found the player (two or more regions cleared) | The current region, in its most remote area. If the offer is declined it returns once, in the next region |

Both follow the base raid result table and neither can end a run.

### X10.3 The trio are the witnesses

The trio are thrown off every dock in the world, so they have seen every crate. Their running commentary is the player's cheapest source of truth about the Grand Arc: each region, Meowth reads one more stencil (roaming script 00x, §E9.4). With trio reputation at +15 or more he reads it *to the player* instead of to Jessie.

### X10.4 At the finale

| Who | Where they are |
| --- | --- |
| The trio | On the last dock, with a balloon, as the way off the island if it goes wrong. It is the only time their timing is good |
| Butch and Cassidy | Not present. They were not told. They find out from the newspaper |
| Gonzap | At the gate in Phase 2: against the player, or holding it for them if he asked |
| Wakin | With Gonzap either way |
| Wes, Rui | In Phase 4, at the tanks |

---

## X11. Things that carry from region to region

The roaming teams are the one part of a run that is not reset at each border. Three small counters carry.

### X11.1 Favors

`roaming.favors` (0–3) counts what the roaming teams owe the player: one for backing them in a Double Booking, one for an accepted Truce, one for helping a Refugee.

| Favors spent | What it buys |
| --- | --- |
| 1 | A warning: the next ambush from any team in this region is announced one node early |
| 2 | A door: one locked route in a raid is opened from the other side ("Don't ask how we got in. We don't know either.") |
| 3 | A rescue: the base rule's rescue shortcut (script 00 §9) works without the reputation requirement, once |

### X11.2 Running jokes

These are counted across the whole run and shown on the run summary. None has any effect on play.

| Counter | Counts | The summary says |
| --- | --- | --- |
| Blast-offs | Times the trio left a scene by air, unwillingly | "Team Rocket blasted off N times." |
| The bill | The balloon repair bill, which the player receives by post in every region and which grows | "Outstanding: ₽N. Final notice (N)." |
| Wobbuffet | Times it came out of its Ball uninvited | "Wobbuffet!" × N |
| "It's Butch" | Times someone got his name wrong | A list of the wrong names |
| The building | What Wes owes Gonzap, with interest | "One building. Two, with interest." |

### X11.3 Curtain Call

How the roaming team leaves a region is chosen from everything the player did.

| Team | If the player was mostly kind | If the player was mostly hostile | If the player ignored them |
| --- | --- | --- | --- |
| Rocket Remnants | The balloon rises. Meowth leans out and throws something down: a held item, wrapped in a wanted poster | The balloon rises, on fire. They are arguing about whose fault it is | The balloon rises. James waves. Nobody is watching. He keeps waving |
| Team Snag'em | The van stops. Wakin gets out, puts one Poké Ball on the road, gets back in | The van does not slow down | The van is already gone. An oil stain, and a list of addresses that somebody dropped on purpose |

---

## X12. Dialogue bank

### X12.1 Collisions, by stance

> **Opportunist — CASSIDY:** "We're not *with* them. We're *near* them. There's a legal difference and we've looked it up."
> **Parasite — GONZAP:** "They build it. They guard it. They pay for the lights. I just plug in. Why would I want them to lose?"
> **Convenience ally — JAMES:** "We're helping! We brought a casserole!"
> **Understudy — BUTCH:** "Same plan as theirs. Smaller. Cheaper. Ours has a *theme*."
> **Contractor — WAKIN:** "We don't ask what's in the crates. I'm telling you that so you'll stop asking me."
> **Refugee — JESSIE:** "Don't look at us. We're not here. We lost the balloon, the machine and James's dignity, in that order."

### X12.2 Double Bookings

> **PRIMARY GRUNT:** "This is a restricted operation!"
> **REMNANT GRUNT:** "So's ours! We restricted it first!"
> **PRIMARY GRUNT:** "You don't even have clearance!"
> **REMNANT GRUNT:** "We have *enthusiasm*!"

> **SNAG'EM GRUNT** *(to a primary team Grunt, flatly)*: "I'm here for one crate. You can have the rest of your evil plan. I don't care about your evil plan."

### X12.3 Truces

> **MEOWTH** *(alone, at the fire)*: "Don't make it weird. I was passin'. …That cage, back in town. With the little ones in it. I heard what they was sayin'. I ain't gonna tell ya what it was. I'm just gonna tell ya which door it's behind."

> **JAMES:** "I was sent to ask if you had any food. I was told to be menacing about it. Do you have any food? …That was the menacing version."

> **WAKIN:** "The one we took from that kid on the pier. The Marill. Is it… you saw it after, right? It was all right? …Yeah. Here's where it's being kept. I was never here."

### X12.4 Curtain calls

> **JESSIE** *(rising)*: "This region didn't deserve us!"
> **JAMES:** "It really didn't, we were dreadful!"
> **MEOWTH:** "Next one's gotta be better. Law of averages."

> **GONZAP** *(through a van window)*: "You cost me a week's stock. I've had worse weeks. Don't let it go to your head."

### X12.5 Wes

Wes says very little in the entire game. This line is only heard if the player returns three marks in one run.

> **WES:** "…Good."

---

## X13. Tests

- In `second` mode no combination of new beats adds more than one battle to a regional climax or moves Operation Strength by more than ±1.
- R1b, R2b, R3b and R5 never occur inside a climax; each can be skipped or declined with no penalty.
- A Double Booking never changes its raid's result table.
- The three new stances each respect the cap: Understudy and Contractor use the single Phase 2.5 duel; Refugee has none.
- Contractor is forced when `cipher.x.stock ≥ 2` and Snag'em are placed.
- Every Species cell in X5 resolves in the Pokédex.
- Every mark has a trainer and a named node where it can be returned.
- Each of the trio's nine schemes plays its second scene whatever the result of the first.
- `lead` mode Extended Cuts have 10–13 battles and set the region's difficulty band one step lower.
- *Pyrite Dawn* Phase 5 exists only with `grandArc.enabled`, and awards the ROM in-region.
- With `snagem.x.gonzap = asked`, Gonzap is not fought in Phase 4.
- In `stress` mode exactly one Phase 2.5 duel is fought.
- Roaming ambushers never exceed Commander rank at any Heat.
- `roaming.favors` never exceeds 3 and is spent only by the player's choice.
- With `grandArc.enabled = false`, no liaison, ROM or finale reference appears in any roaming beat.
