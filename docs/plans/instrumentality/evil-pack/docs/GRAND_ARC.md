# THE GRAND ARC — One Supplier, Nine Methods, One Island

*The cross-region story of the Expanded Edition. Read `docs/EXPANSION_DESIGN.md` first. The regional scripts are in `scripts/expanded/`; this arc's finale is written out in `scripts/expanded/00_ROAMING_CAST_EXPANDED.md` §E7.*

**Canon note:** Cipher, its admins, Team Snag'em, Citadark Isle and XD001 (the Shadow Lugia) are canon to Pokémon Colosseum and Pokémon XD. Team Rainbow Rocket is canon to Ultra Sun and Ultra Moon. The idea that Cipher supplied every regional team, the Data ROMs, the project codes XD002 to XD012 and everything said in dialogue are original to this pack.

---

## 1. The arc in one page

Every evil team in the pack binds Pokémon in its own way: a rig, a radio wave, an orb, a chain. The Shadow document calls these the teams' *Shadow methods*. The Grand Arc gives them one origin.

**Cipher**, the organization that first made Shadow Pokémon, did not want to build nine weapons. It wanted to learn nine ways of closing a heart, and to have other people pay for the lessons. It sent one **liaison** to each region with a piece of technology the local team badly needed. Each team improved it in the field. Each liaison sent the results home.

The player meets a liaison in every region, usually as a quiet figure at the edge of someone else's scene. Beating one, or earning their respect, yields a **Data ROM**. Each ROM explains one method. Together they explain the thing Cipher built from all of them: **XD001**, a Shadow Lugia designed never to be purified.

After the last region of a run, a player holding at least three ROMs may sail to **Citadark Isle** for an optional finale. There, each ROM in the bag is one lock already open. With all nine, the last battle of the pack is not a battle.

Team Snag'em are Cipher's collectors and do not know what they are collecting for. Jessie, James and Meowth work the whole thing out by accident.

---

## 2. Nine regions, nine methods

| Region | Team | Liaison | What Cipher supplied | Shadow method | ROM | What the ROM proves | Apex Shadow |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kanto | Team Rocket | **Ein** | The Capture Rig's pulse | Capture Rig | **K**, "Rig Pulse" | The pulse is not Rocket's design | XD002 **M2** (Mewtwo) |
| Johto | Rocket Returns | **Miror B.** | The rhythm under the broadcast | Radio Wave Lock | **J**, "Carrier Beat" | The same waveform, carried by sound | XD003 **Dark Celebi** |
| Hoenn | Aqua and Magma | **Dakim** | Orb resonators, to both sides | Orb Resonance | **H**, "Resonator Mark II" | One waveform at three sizes | XD004 **Abyssal**, XD005 **Cinderheart** |
| Sinnoh | Team Galactic | **Lovrina** | The Red Chain's lock | Red Chain Lock | **S**, "Chain Lock" | A lock strong enough to hold a legend | XD006 **Stillhour**, XD007 **Farshore** |
| Unova | Team Plasma | **Snattle** | The Frigate's relay | Liberation Lock | **U**, "Open Hand" | A lock that waits to be let in | XD008 **Absolute** (Kyurem) |
| Kalos | Team Flare | **Venus** | The siphon | Life-Force Siphon | **X**, "Siphon" | A will that is taken is stored, not destroyed | XD009 **The Battery** |
| Alola | Skull and Aether | **Eldes** | The Conservation Hold | Conservation Hold | **A**, "Kindness" | A lock that calls itself protection | XD010 **The Mother Beast** |
| Galar | Macro Cosmos | **Ardos** | The Plant's regulator | Dynamax Overload | **G**, "Overload" | How to hold a Shadow state over a whole region | XD011 **The Darkest Day** |
| Paldea | Team Star | **Nascour** | Nothing. He came to buy | Star Barrage Link | **P**, "Borrowed" | A heart can be asked to lend itself | XD012 **The Cassiopeia Engine** |
| Any | Snag'em, Cipher | Gonzap, **Evice**, **Greevil** | — | Snag Machine | — | — | **XD001** (Lugia) |

Team Yell and the Rocket Remnants have no ROM and no Apex. Team Yell's chant is, in fact, the cure for Galar's method.

---

## 3. How a ROM is earned

Each ROM has a main route in its own region. Several have a second route there too. A ROM missed in its region can still be taken **late**, from its liaison at the finale; a late ROM opens its bank of tanks in the Reservoir but not its lock on XD001, because by then the lock is already set.

| ROM | Main route | Second route in the same region |
| --- | --- | --- |
| K | Raid 4, Secondary C (Ein's reading) | Shut down the Rig Room in the climax |
| J | Beat Miror B. on the observation deck (climax Phase 4) | — |
| H | Beat Dakim at the Space Center (Raid 5) | Beat him on the ledge (climax Phase 3) |
| S | Beat Lovrina on Stark Mountain (Raid 4) | Beat her in the climax (Phase 3) |
| U | Beat Snattle in the climax (Phase 3) | — |
| X | Beat Venus at the megalith (Raid 5) | Beat her in the studio (climax Phase 3) |
| A | Eldes hands it over after a battle he throws (climax Phase 3) | — (it cannot be missed once the climax is reached) |
| G | Beat Ardos in Rose Tower (climax Phase 3) | — (Ardos does not bend; this is the hardest ROM) |
| P | Beat Nascour under the clock (climax Phase 3) | — |

**Liaisons leave.** A liaison who is not beaten in their region is not gone. They return at the finale (00x §E7.5).

**Counting.**

| ROMs held | Effect |
| --- | --- |
| 0–2 | The finale is not offered. The thread is still told; it simply has no last chapter this run |
| 3 or more | The finale is offered after the run's last regional climax |
| Each one earned in its region | Opens one bank of tanks in the Reservoir and one of XD001's nine locks |
| Each one taken late | Opens its bank of tanks only |
| Every 3 | Removes one step of the Stock track (00x §E1.2) |
| 9 | XD001 is not fought. The player walks up to it |

---

## 4. Playing the regions in any order

A run may visit the regions in any order and may skip some. The arc is written so that it never depends on sequence.

- **Each liaison's scenes stand alone.** Their lines refer to "my colleagues" and "the other regions", never to a region by number.
- **Farewell notes point outward, not forward.** Each expanded script ends with a note from its liaison about where the trouble goes next. The game replaces the destination with the run's actual next region. If there is none, the note points to the island.
- **Carried results** are flags, and each is read only if it exists.

| Flag | Set in | Read in | Effect |
| --- | --- | --- | --- |
| `cipher.beast.raikou` / `.entei` / `.suicune` | Johto, Raid 4 (a beast not freed) | Kanto (Ein), Hoenn (Dakim), Kalos (Venus), the finale | That liaison's last Pokémon is the Shadow beast |
| `cipher.lugia-reading` | Johto, Raid 5 (Failed or Declined) | The finale | XD001 has one extra lock |
| Kanto Raid 4 result | Kanto | Johto, *Olivine Arrival* | A full freighter adds two Black-Label Pokémon to Johto's Executives |
| `rocket.x.kept-ledger` | Kanto, Phase 8 | Every later region | Shop prices −15% everywhere |
| `rocket-return.x.celebi` | Johto, Phase 6 | The roaming event *The Stone in the Forest* | A free Heart Scar, or a cold stone |
| `plasma.x.where` | Unova, Phase 8 | The next two regions | Trainers arrive to claim released Pokémon; or a wild pool called "the Unclaimed" |
| `galar.x.yell` (`honorary`) | Galar | Every later climax, and the finale | Team Yell is in the stands. They have come by coach |
| `rocket.rainbow.contact`, `.depot` | Alola Raid 5; the roaming event *The Prize Machine* | The finale, Phase 7 | The Rainbow Door opens even on a clean run |
| Each region's Apex result (`freed` / `taken`) | That region's Phase 6 | The finale, Phases 2, 4 and 7 | A taken Apex guards its tank and gives the Rainbow Door a lane |

**If a region is played after the finale** in a later run of the same save, its liaison is present as written. The arc is per run, like everything else (decision D7).

---

## 5. The wider world: what each region's ending changes elsewhere

These are the cross-region consequences that make the map feel like one world. All are small, all are announced, and none changes difficulty beyond the bounds in the design document §6.6.

| Region ending | What another region sees |
| --- | --- |
| Kanto: the ledger is published | In every later region, one civilian per city has a Pokémon back and says so |
| Kanto: M2 walks free | A flash over a northern cave is mentioned on the next region's radio |
| Johto: the call goes out and is answered | Rocket's ambushers in the next region are one rank higher |
| Johto: Celebi is freed | The Relic Stone grants a free Heart Scar in any later region |
| Hoenn: both titans rest | Weather in the next region's first stage is clear |
| Hoenn: Rayquaza is called | The next region's news mentions "an object that is no longer a concern" |
| Sinnoh: all three guardians are home | Friendship gains are +10% for the next region ("people are feeling things again") |
| Sinnoh: Cyrus is brought back | Looker appears once in the next region with a two-sentence report |
| Unova: the lists are sent | Three claimed Pokémon's trainers send gifts over the next two regions |
| Kalos: the weapon is closed | Mega Evolution needs no turn to trigger in the next region's first climax phase |
| Kalos: AZ's flower returns | A very tall man is seen once on a far road, walking more slowly, with company |
| Alola: the gate is closed cleanly | No Ultra Beast glimpses anywhere for the rest of the run |
| Alola: a window is left | One Ultra Beast may be met as a wild legend in each later region |
| Galar: Spikemuth hosts the final | The next region's climax crowd knows one of Piers's songs |
| Paldea: the Assembly is won | Atticus sends the player a badge with no squad color. It is equipped as an item: +1 to the lowest stat of the holder |

---

## 6. The finale at a glance

Written in full in `scripts/expanded/00_ROAMING_CAST_EXPANDED.md` §E7.

| # | Phase | What it is |
| --- | --- | --- |
| 0 | The Nine Locks | A letter, a map, and the choice to go |
| 0b | The Alliance | Citadark's four approaches are held by allies from the regions the player won |
| 1 | The Crossing | A convoy through the whirlpools |
| 2 | The Climb | Peons, the Hexagon Brothers, and Gonzap at the gate, on one side of it or the other |
| 3 | The Admins | Every liaison not beaten earlier; Miror B. and his Dragonite; Evice with the mask off |
| — | Breather | Krane's Purify Chamber |
| 4 | The Reservoir | The stored wills of every Shadow Pokémon; one bank opens per ROM |
| 5 | Grand Master Greevil | The boss, and an offer |
| 6 | XD001 | Nine locks, less the ROMs in hand |
| 7 | The Rainbow Door | Only if something was lost on the way |
| 8 | Resolution | Greevil, the Snag Machines, the feather, the trio |

**Fairness.** The finale is optional. It comes after the run is already won. Losing it does not end or undo the run (this is the one place decision D1 is relaxed, in the player's favor): the result is recorded as *won, finale lost*.

---

## 7. Results and the Doom Ledger

`finale.result` is written once.

| Result | How | Doom Ledger entry | In the Region of Doom |
| --- | --- | --- | --- |
| `sung` | XD001's last lock opens | `cipher.ended = sung` | Cipher is absent. Shadow encounter rates are halved. A Lugia Sighting begins every later run |
| `silent` | The timer runs out in Phase 6, or the player falls anywhere in the finale | `cipher.ended = silent` | XD001 is a roaming Legendary Shadow in the Region of Doom. Cipher is a faction at Doom Level 2 |
| `sold` | The player names a number in Phase 5 | `cipher.ended = bought` | Cipher is the richest faction. The player starts later runs with money and with −20 reputation everywhere |
| `declined` | [Never] at Phase 0, or fewer than three ROMs | `cipher.ended = unseen` | Cipher is a rumor: one sighting per region, no faction |

**Each regional Apex** is also written: `xd002` to `xd012`, each `freed` or `taken`. A taken Apex is a Legendary Shadow in the Region of Doom under its team's banner, with the rules of the Shadow document §8.

**The Rainbow Door** writes `rainbow.result`: `empty` (Giovanni came, found nobody, and left), `closed` (every lane held), or `open` (a lane was lost: one "world where they won" stays as a faction in the Region of Doom, led by that team's leader with the Apex at their side).

---

## 8. How the arc sits with the confirmed decisions

| Decision | How the Grand Arc treats it |
| --- | --- |
| **D1** Losing a climax ends the run | Unchanged for regional climaxes, Standard or Extended. Relaxed only for the finale, which comes after the run is won |
| **D2** Rival Rescue Plan | Unchanged. The rival appears in the finale in whatever state the run left them |
| **D3** Returning teams anywhere | Snag'em or the Remnants placed as a region's own team keep their base kits; Raids 5 and 6 of 00x are added |
| **D4** Gym clamp | Unchanged. No part of the arc is tied to a Gym |
| **D5** Permanent Shadow members | Unchanged. Special Shadows marked obtainable follow §12 of the Shadow document. Opening a region's tank bank lowers the party's Shadows from that region by one tier; a **Stabilized** Pokémon is not affected unless the player chooses |
| **D6** Stand with them | Each expanded script adds one line and one inverted phase for the allied route. Cipher itself has no allied route |
| **D7** Per-run persistence and the Doom Ledger | All arc flags are per run. Only `finale.result`, `rainbow.result` and the Apex results are written to the Ledger |
| **D8** Second rival | Unchanged. Where a second rival exists they hold one Siege Map district in that region's Extended Cut |
| **D9** No withdrawal | Unchanged for regional climaxes. The finale's [Not yet] and [Never] are choices made before it begins |

**Settings**

| Setting | Default | Effect |
| --- | --- | --- |
| `climax.cut` | `"extended"` | `"standard"` plays every regional climax as the base scripts write it |
| `grandArc.enabled` | `true` | `false` removes liaisons, ROMs and the finale; the Expanded content of each region still works |
| `rocket.x.triad` | `true` | `false` replaces Kanto's turned Gym Leaders with unnamed Executives |
| `rescue.climaxEligible` | `true` | From the Kanto Canon Spaces document; unaffected |

---

## 9. Reading order for the thread

For someone who wants only the cross-region story, in the order it makes most sense:

1. `scripts/expanded/01` §E5.4 *Harbor Export*: the first man in a lab coat.
2. `02` §E5.5 *Olivine Arrival* and §E6.4: the beasts, and the joke about who does not get one.
3. `03` §E5.5 *The Arms Dealer*: the same box, sold twice.
4. `04` §E5.8 *The Ribbon* and §E6.4: a chain for something larger.
5. `05` §E5.5 *The Candidate*: an office that does not exist.
6. `06` §E5.5 *Under Time* and §E8: where the stolen wills go.
7. `07` §E5.6 *The Consultant* and §E7.4: the one who is sorry.
8. `08` §E5.7 *The Partner Firm* and §E7.4: the one who is not.
9. `09` §E5.5 *Admissions* and §E7.4: "The children were never the product."
10. `00` §E5.2 *Landing Zone*, §E6.3 and all of §E7: bottle caps, pods, and the island.

---

## 10. Test checklist

- A run with zero ROMs never offers the finale and never mentions Citadark by name.
- A run with exactly three ROMs offers it; XD001 has six locks.
- A run with nine ROMs reaches Phase 6 with no shield bars and no battle.
- A ROM with a second route can be earned by it with the main route failed.
- A ROM missed in its region can be taken late at the finale; it opens a tank bank and no lock.
- Playing the regions in reverse order produces no line that refers to a region not yet visited.
- A liaison beaten in their region does not appear in Phase 3 of the finale.
- Losing the finale leaves the run recorded as won.
- A clean run (no Apex taken, Faba reported) gets the empty Rainbow Door and no Phase 7 battle.
- `grandArc.enabled = false` leaves every regional Extended Cut playable, with liaison duels removed and no dangling flag reads.
- A Stabilized Shadow Pokémon is not lowered a tier by the Reservoir without a prompt.
