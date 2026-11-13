# 03x — HOENN: TEAM AQUA AND TEAM MAGMA — EXPANDED EDITION
### Script: *The Long Weather*

> *"He thinks I want to drown the world. I think he wants to burn it. Somebody sold us both the matches."* — Archie

**Extends:** `scripts/03_HOENN_TEAM_AQUA_AND_MAGMA.md` (the base script stays valid; this file adds to it)
**Template:** `docs/EXPANSION_DESIGN.md` · **Cross-region arc:** `docs/GRAND_ARC.md`
**Canon note:** Archie, Maxie, Matt, Shelly, Tabitha, Courtney, Captain Stern, Professor Cozmo, Steven Stone, Wallace, Zinnia and her Whismur Aster are canon to the games. Amber (Aqua) and Blaise (Magma) are canon to the manga; Brodie is canon to the anime. Dakim is a canon Cipher admin (Colosseum). **Navigator Stern**, **Chief Geologist Cozmo** and **Zinnia Two-Hoods** are *what-if* versions. All dialogue is original. Species are my best recall and are marked approximate.
**Two teams.** As in the base script, one team is seeded to find the player at Ignition. "The seeded team" and "the other team" below follow that roll.

---

## E1. The Wider Scale

The base script is two cults and one cave. The Expanded Edition shows what the argument does to everyone standing between them, and who has been selling to both sides.

### E1.1 The plan at five scales

| Scale | What Aqua and Magma are doing | What the player sees | Where it pays off |
| --- | --- | --- | --- |
| 1 **Street** | Testing Orb resonators on single wells, ponds and hot springs | A flooded cellar next door to a dry well | Event *Wet Cellar, Dry Well* |
| 2 **City** | Raiding the Weather Institute for its forecasts and its Castform; recruiting the region's best sailor and best geologist | A forecast board that argues with itself | Events *The Institute*, *Stern and Cozmo* |
| 3 **Region** | Seating the meteorite in Mt. Chimney; launching the submarine; binding the Eon twins of Southern Island | Weather that changes between one node and the next | Raids 1, 2 and 4 |
| 4 **Border** | Buying identical resonators from one dealer; pushing storm fronts and ash clouds past Hoenn's coast | Rain of ash on a beach; a third uniform at both hideouts | Event *The Arms Dealer*, Raid 5 |
| 5 **World** | Waking both titans at once, which is exactly what a third party has been steering them toward | A mural at Meteor Falls with a star on it that is getting bigger | Climax Phases 6 and 7 |

### E1.2 World-state track — *The Long Weather*

Stored in `hoenn.x.weather` (0–5). A second value, `hoenn.x.tilt` (−3 to +3), records which team is ahead: Aqua negative, Magma positive. Raids against one team move the tilt toward the other.

| Step | Name | Regional rule | Civilian mood |
| --- | --- | --- | --- |
| 1 | **Drizzle and Drought** | One route is rainy and one is sunny at all times | Complaining |
| 2 | **Blue Dawn, Red Dusk** | Weather at each node is set by the tilt (ties alternate) | Taking sides |
| 3 | **The Swing** | Weather flips every two turns in wild battles | Exhausted |
| 4 | **Spill** | Berry trees fail on one side of the region; ferries or cable cars stop, by tilt | Leaving |
| 5 | **The Awakening** | Rain and harsh sun arrive together; the climax is scheduled | Praying |

### E1.3 The bigger secret

Neither team can win (base script §3). Two people already knew that.

**Dakim** of Cipher sold Aqua its Orb resonators in the spring and sold Magma the same model in the summer, at a higher price, because by then Magma needed to catch up. He is a fighter who has discovered that wars pay better than tournaments.

**Zinnia**, a Lorekeeper of the Draconid people, has spent a year appearing to each leader in his own team's hood, reading him the half of the Meteor Falls mural that he wanted to hear. She does not care about land or sea. Something is falling toward the world, the mural says only the sky's guardian can meet it, and the guardian comes only when both titans wake. She has decided Hoenn is an acceptable price. She is not sure she is right, and it is making her reckless.

---

## E2. Expanded Cast

### E2.1 New officers and specialists

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.aqua.amber` | **Amber** | Commander (4) | canon (manga) | Infiltrator: Aqua's third admin, loyal past sense | **Twin Pearls** (Gorebyss, Huntail), Pelipper, Volbeat | Gentle, devoted, will sink with the ship |
| `sc.magma.blaise` | **Blaise** | Commander (4) | canon (manga) | Strategist: Magma's third admin, a maker of heat-mirages | **Mirage** (Magcargo), **Thermal** (Swellow) | Languid, amused, hard to find |
| `sc.magma.brodie` | **Brodie** | Lieutenant (3) | canon (anime) | Infiltrator: "the man of a thousand faces" | Ditto, Mightyena *(approximate)* | A different accent every scene |
| `sc.aqua.bosun-quill` | **Bosun Quill** | Lieutenant (3) | original | Enforcer: runs the submarine's deck crew | Crawdaunt, Walrein, Pelipper | Shouts everything, including affection |
| `sc.magma.surveyor-ossa` | **Surveyor Ossa** | Lieutenant (3) | original | Scientist: maps where the new land will rise | Claydol, Lunatone, Solrock | Whispery; names mountains that do not exist yet |
| `sc.aqua.dakim` | **Dakim** | Liaison (4) | canon (Colosseum) | Enforcer: Cipher's dealer to both teams | Claydol, Golem, Flygon, Whiscash *(approximate)*; a Shadow Entei if it was taken in Johto (`cipher.beast.entei`) | A wrestler's bellow; laughs at his own strength |

### E2.2 Team versions of characters you know

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.aqua.navigator-stern` | **Navigator Stern** | Executive (5) | what-if | Captain Stern, who gave Aqua his submarine because nobody else would fund the dive | **Flagship** (Wailord), Relicanth | Earnest, seasick with guilt |
| `sc.magma.geologist-cozmo` | **Chief Geologist Cozmo** | Executive (5) | what-if | Professor Cozmo, who told Magma where the meteorite was because they were the first people who ever listened to him | Lunatone, Solrock, Claydol | Flustered, thrilled, horrified, in that order |
| `sc.aqua.zinnia-blue-hood` | **Zinnia in the Blue Hood** | Consultant | what-if | Zinnia as Aqua knows her: "Tidereader", who interprets the mural for Archie | Salamence, Altaria, Noivern | Teasing, quick, hides behind jokes |
| `sc.magma.zinnia-red-hood` | **Zinnia in the Red Hood** | Consultant | what-if | Zinnia as Magma knows her: "Stonereader", who interprets the same mural for Maxie | Salamence, Tropius, Whismur (Aster) | The same person, slightly more formal |
| `sc.aqua.steven` | **Steven Stone** | Ally | canon (games) | Devon's heir, collecting stones and evidence | Metagross | Mild, exact, never in a hurry |
| `sc.aqua.wallace` | **Wallace** | Ally | canon (games) | Keeper of the Cave of Origin | Milotic | Graceful; treats a crisis as a performance to be done well |
| `sc.aqua.rival-low-tide` | **Deckhand "Low Tide"** (the rival) | Lieutenant (3) | what-if | The rival in Aqua's bandana, if Aqua was the team they joined | The rival's team plus one Tidebound Pokémon | The rival's archetype, with borrowed slogans |
| `sc.magma.rival-kindling` | **Cadet "Kindling"** (the rival) | Lieutenant (3) | what-if | The rival in Magma's hood, if Magma was the team they joined | The rival's team plus one Cinderborn Pokémon | The rival's archetype, with borrowed slogans |
| `sc.aqua.player-stowaway` | **"Stowaway"** (the player, Aqua) | Specialist (2) | what-if | The player on Aqua's Inside Man and Stand-with routes | The player's team | — |
| `sc.magma.player-ember` | **"Ember"** (the player, Magma) | Specialist (2) | what-if | The player on Magma's Inside Man and Stand-with routes | The player's team | — |

> **Zinnia Two-Hoods.** She is one person. If the player meets her in both hoods before the climax (`hoenn.x.two-hoods = true`), she stops pretending, and the Sky Pillar opens early (Phase 7).

---

## E3. Special Pokémon — the Tidebound and Cinderborn lines

Each team's special Pokémon were raised beside a working Orb resonator.

**Line rule — *Tidebound*:** (Team Aqua) in rain, a Tidebound Pokémon enters with +1 Speed and its Water moves cannot miss; in harsh sun it has neither (announced: "The tide is with it." / "The tide is out.").

**Line rule — *Cinderborn*:** (Team Magma) in harsh sun, a Cinderborn Pokémon enters with +1 Defense and its Fire and Ground moves cannot miss; in rain it has neither (announced: "The ground is warm." / "The ground is cold.").

| ID | Name | Species | Signature trait | Where met | Can the player get it? |
| --- | --- | --- | --- | --- | --- |
| `sv.aqua.riptide` | **Riptide** | Sharpedo / Mega Sharpedo / Z-Sharpedo | *Blood in the Water*: +1 Attack whenever any Pokémon on the field drops below half HP | Archie's ace | No |
| `sv.aqua.bosun` | **Bosun** | Mightyena / Alphayena | *All Hands*: its first move each battle also raises its partner's Attack by 1 | Matt | No |
| `sv.aqua.siren` | **Siren** | Milotic / Z-Mega Milotic | *Undertow Song*: Pokémon that switch in against it lose 1 Speed | Shelly | No |
| `sv.aqua.flagship` | **Flagship** | Wailmer / Wailord | *Flagship*: while it is on the field, its allies take 10% less damage | Navigator Stern; Raid 2 | Yes: it follows Stern, and Stern follows you if he is turned |
| `sv.aqua.twin-pearls` | **Twin Pearls** | Gorebyss / Huntail | *Matched Set*: if both are on the field, each acts again at half power once per battle | Amber | No |
| `sv.magma.caldera` | **Caldera** | Camerupt / Mega Camerupt | *Pressure Vent*: each hit it takes adds 10% to its next Fire move (up to 50%) | Maxie's ace | No |
| `sv.magma.old-faithful` | **Old Faithful** | Torkoal / Z-Mega Torkoal | *On Schedule*: every third turn it sets harsh sun for free | Tabitha | No |
| `sv.magma.specimen-nine` | **Specimen Nine** | Claydol | *Analysis Complete*: after seeing a move twice, it takes 30% less from that move | Courtney | No |
| `sv.magma.borehead` | **Borehead** | Aggron / Cataggron | *Tunnel Bore*: its Rock and Steel moves break screens before hitting | Magma tunnel crews; Raid 1 | No |
| `sv.magma.mirage` | **Mirage** | Slugma / Magcargo | *Heat Haze*: in harsh sun the first move aimed at it each turn has a 30% chance to miss | Blaise | No |
| `sv.magma.thermal` | **Thermal** | Swellow / Tempestwing | *Updraft*: +1 Speed at the end of each turn of harsh sun | Blaise | No |
| `sv.aqua.forecast` | **Forecast** | Castform / Rainy Castform / Sunny Castform | *Tomorrow's Weather*: at the start of battle it shows what the weather will be for the next three shifts | The Weather Institute | Yes: the Institute gives it to whoever saves it |

---

## E4. Special Shadow Pokémon

Both teams use **Orb Resonance**. Clear-sky weather gives −20 extra Corruption to an Aqua Shadow; sealing a vent gives −25 to a Magma Shadow (Shadow doc §6).

| ID | Code | Name | Species | Tier | Shadow ability | Shadow moves | Purification key | Where met |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ss.aqua.low-tide` | — | **Low Tide** | Wailord | 3 Gripped | Salt Chain | Hollow Tide, Gloam Crash, Siphon Lull | Help it off the beach at high tide (a rest node on any coast in clear weather) | Beached on a random shore, world state 2 or higher |
| `ss.magma.fault-line` | — | **Fault Line** | Aggron / Mega Aggron | 3 Gripped | Hollow Hide | Gloam Crash, Dusk Brand, Cinder Ward | Seal the vent it guards, then plant a tree on its mountain | Meteor Falls, Raid 1 |
| `ss.aqua.ebb` | — | **Ebb** | Latios / Mega Latios | 3 Gripped | Squall Mantle | Umbral Rush, Null Pulse, Rift Step | Reunite it with its twin on Southern Island | Raid 4 |
| `ss.magma.kindle` | — | **Kindle** | Latias / Mega Latias | 3 Gripped | Dread Aura | Umbral Rush, Null Pulse, Rift Step | Reunite it with its twin on Southern Island | Raid 4 |
| `ss.aqua.abyssal` | XD004 | **Abyssal** | Kyogre / Primal Kyogre | 4 Fallen | Squall Mantle | Hollow Tide, Chain Hymn, Drowned Sky | Story only: break the Blue Orb's three links | The Cave of Origin, Phase 6 |
| `ss.magma.cinderheart` | XD005 | **Cinderheart** | Groudon / Primal Groudon | 4 Fallen | Frost Oath | Ember of Grief, Gloam Crash, Scorched Dawn | Story only: break the Red Orb's three links | The Cave of Origin, Phase 6 |

**Signature Shadow move — Drowned Sky:** 110 power, hits all foes; brings a heavy rain for 3 turns in which Fire moves fail. Cost: +6 Corruption. Announced one turn ahead ("The ceiling is weeping.").

**Signature Shadow move — Scorched Dawn:** 110 power, hits all foes; brings an extreme sun for 3 turns in which Water moves fail. Cost: +6 Corruption. Announced one turn ahead ("The stone begins to glow.").

**Notes**
- **Ebb and Kindle** are twins. Aqua took one and Magma the other on the same night, each believing it had beaten the other team to the island. They follow the Legendary Shadow rules.
- **Frost Oath** on Cinderheart is deliberate: the Red Orb makes it immune to the weather it causes, and to the rain that would stop it.
- **Abyssal and Cinderheart** are never fought to a knockout. They are fought for their Orb links (Phase 6).

---

## E5. New Story Events

### E5.1 *Wet Cellar, Dry Well* (`xe.hoenn.wet-cellar`) — Street

*Trigger: any town node after Ignition. Two neighbors. One is bailing out a cellar. The other is lowering a bucket into a well and bringing it up empty.*

> **NEIGHBOR (cellar):** "Three days of rain on *my* roof."
> **NEIGHBOR (well):** "And not a drop on mine. Same street!"
> *(At the end of the street, an Aqua Grunt and a Magma Grunt stand over two small humming boxes, twenty paces apart, glaring at each other.)*
> **AQUA GRUNT:** "Ours was here first!"
> **MAGMA GRUNT:** "Yours is *leaking*!"
> **PLAYER (choice):**
> 1. **[Break the blue box]** → Battle the Aqua Grunt; tilt +1; the cellar drains.
> 2. **[Break the red box]** → Battle the Magma Grunt; tilt −1; the well fills.
> 3. **[Swap them]** → *(Needs Intel 6 or more.)* The boxes cancel out. Both Grunts stare. **AQUA GRUNT:** "…Is it *supposed* to do that?" **MAGMA GRUNT:** "Nobody tell the admins." *(World state −1 for this town; `hoenn.x.cancel-trick = true`: this works again in Phase 4.)*
> **NEIGHBOR (cellar, after):** "Do you know, I think I'd started to *like* blaming him."

### E5.2 *The Institute* (`xe.hoenn.weather-institute`) — City

*Trigger: the Weather Institute, world state 2. The other team (not the seeded one) has taken the building.*

> **SCIENTIST** *(under a desk)*: "They want the long-range model. I told them it's a guess! We put error bars on it! They took the error bars *off*!"
> *(Upstairs, a small grey Pokémon is changing shape every few seconds: sun, rain, sun, rain.)*
> **ADMIN (Shelly or Tabitha, by seed):** "This one knows what the sky's going to do before the sky does. It's coming with us."
> **PLAYER (choice):** [Battle the admin] → Win: **Forecast** is offered to you by the Institute. / [Ask Forecast what it sees] → *(It turns into a shape it has no form for: half sun, half rain, and it shivers.)* Intel +4. / [Leave] → Forecast is taken; the other team's Phase 4 weather shifts are no longer announced a turn ahead.
> **ADMIN (defeat, Tabitha):** "Ahyahyahya! …That was a nervous laugh. I want that noted."
> **ADMIN (defeat, Shelly):** "Keep the weather-vane. It was depressing the crew anyway."

### E5.3 *Stern and Cozmo* (`xe.hoenn.stern-and-cozmo`) — City

*Trigger: Slateport's Oceanic Museum, before Raid 2. Two men are arguing in front of a model submarine.*

> **PROFESSOR COZMO:** "They gave me a *team*, Stern. Forty people who want to hear about meteorites! Do you know how long I've waited for forty people?"
> **CAPTAIN STERN:** "And mine paid for the pressure hull in cash. I'm aware of what that means. I built it anyway."
> **COZMO:** "They can't *both* be the villains."
> **STERN:** "…Can't they?"
> **PLAYER (choice):**
> 1. **["What did you tell them?"]** → Each admits one fact: where the meteorite goes (Cozmo), how deep the sub can dive (Stern). Intel +3 each.
> 2. **["Quit."]** → Whichever man belongs to the seeded team quits on the spot. `hoenn.x.stern = turned` or `hoenn.x.cozmo = turned`: he is absent from his raid and holds a district on the Siege Map.
> 3. **["Compare notes."]** → *(Needs both facts.)* They lay a sea chart over a geological survey. The two plans point at the same cave. **COZMO:** "Oh. Oh, that's not a coincidence, is it." **STERN:** "Who gave you your map?" **COZMO:** "A consultant. Lovely young woman. Red hood." **STERN:** "…Blue."

*The third option writes `hoenn.x.maps-compared = true` and reveals Zinnia.*

### E5.4 *Two Hoods* (`xe.hoenn.two-hoods`) — Region

*Trigger: Meteor Falls, any time after the first raid. A young woman in the seeded team's hood is talking to the wall. A Whismur sits on her shoulder.*

> **ZINNIA:** "…and he'll believe it, Aster, because it's true. That's the trick. You don't lie. You just stop reading halfway down."
> *(She turns. She is grinning. It does not reach very far.)*
> **ZINNIA:** "Oh! A witness. Hi. I'm the— which one am I today? Blue? I'm the Tidereader. Big fan of oceans."
> **PLAYER (choice):**
> 1. **["What does the rest of the mural say?"]** → **ZINNIA:** "That something's coming down. That only the one in the sky can meet it. That it only comes when the two below are loud enough to wake it." *(The grin is gone.)* "So I'm making them loud."
> 2. **["People will die."]** → **ZINNIA:** "Some. Not all. I did the sums. I do them every night, and I get the same answer, and I hate it every time. You got a better answer? I'm serious. I'd *love* one."
> 3. **[Battle her]** → *(Battle: Salamence, Altaria, Noivern. Trait: **Lorekeeper**: the first time each of her Pokémon would faint it stays at 1 HP; announced.)* **ZINNIA (defeat):** "Strong. Good. Stay strong. If I'm wrong, somebody's going to have to stop me, and it should be someone who can."

*Meeting her a second time in the other hood sets `hoenn.x.two-hoods = true`.*

### E5.5 *The Arms Dealer* (`xe.hoenn.arms-dealer`) — Border

*Trigger: Lilycove harbor or the Mt. Chimney cable car, world state 3. A huge man is unloading crates. An Aqua admin is leaving as a Magma admin arrives.*

> **DAKIM:** "Ha! Same model, friend, same model! Yours is red. Red is extra."
> **MAGMA ADMIN:** "The other side has these?"
> **DAKIM:** "The other side has *last year's*. You want to lose to last year's?" *(He sees the player.)* "And a third customer! You want a box that makes weather, little one? No? You want to fight? *Good.* I was getting bored of money."
> **PLAYER (choice):** [Fight him] → *(Battle. Trait: **Mountain Rules**: his Earthquakes do not hit his own side; announced.)* / [Show him the swap trick] *(needs `hoenn.x.cancel-trick`)* → **DAKIM:** "…They *cancel*? Hah! Don't tell the customers." *(He pays ₽8,000 for your silence. Take it: Rep −5, and the trick fails in Phase 4. Refuse: he respects it.)* / [Follow the crates] → Intel +5; unlocks Raid 5.
> **DAKIM (defeat):** "Strong! Stronger than both my customers. You should sell them something."

*Writes: `cipher.seen.dakim`.*

### E5.6 *Lunch Break* (`xe.hoenn.truce-lunch`) — Street

*Trigger: a route rest node, any world state. An Aqua Grunt and a Magma Grunt are sharing a bench and a lunchbox.*

> **AQUA GRUNT:** "We're on break."
> **MAGMA GRUNT:** "Union rules. Well. Not union. We asked for a union."
> **AQUA GRUNT:** "Archie said the sea doesn't unionize."
> **MAGMA GRUNT:** "Maxie said it'd be 'inefficient'."
> **PLAYER (choice):** [Sit down] → They share. *(Heal 20%.)* **MAGMA GRUNT:** "Honestly? I joined for the hood." **AQUA GRUNT:** "I joined for the boat." *(`hoenn.x.truce-seed = true`.)* / [Report them] → Both are reassigned to the front line; +1 battle in Phase 2; Rep with the seeded team +3. / [Walk on] → No change.
> **AQUA GRUNT (as you leave):** "If it all goes wrong in that cave, I'm not hitting *him*. I'll hit anyone else."

### E5.7 *A Letter for Steven* (`xe.hoenn.steven-letter`) — Region

*Trigger: any cave node after Raid 1. A man in a suit is examining a wall with a small hammer.*

> **STEVEN:** "Devon has had six resonators 'fall off a truck' this year. All six were returned in better condition than we shipped them. Someone has been improving our rejects and selling them back to the region."
> **STEVEN:** "I'd like to know who. I'd also like this stone. Hold my lamp?"
> **PLAYER (choice):** [Hold the lamp] → He gives you a **Mega Stone** suited to your lead (or a Hard Stone), and holds a district on the Siege Map. / [Tell him about Dakim] *(needs `cipher.seen.dakim`)* → **STEVEN:** "A fighter turned supplier. That's worse than a scientist. A scientist wants it to *work*. He only wants it to *sell*." *(Raid 5 gains Steven as a tag partner.)*

### E5.8 *The Keepers* (`xe.hoenn.keepers`) — Street

*Trigger: Mt. Pyre summit, before Raid 3. An old man and an old woman sit by two empty cushions.*

> **OLD WOMAN:** "They aren't weapons, you know. People keep thinking that."
> **OLD MAN:** "The land made one and gave it to the sea. The sea made one and gave it to the land."
> **OLD WOMAN:** "They're apologies."
> **OLD MAN:** "You don't *use* an apology. You keep it where you can see it."
> **PLAYER (choice):** [Ask how to return them] → Unlocks a fourth Resolution option, **[Give each Orb to the other titan]** (E7.10). / [Promise to bring them back] → Rep +3; the Keepers hold the Mt. Pyre district.

---

## E6. Raids, Expanded

### E6.1 Raid 1 — "Mt. Chimney Meteorite", deeper

**New phase order:** Cable Car → **The Bore** *(new)* → Crater Rim → Caldera → **The Vent** *(new, conditional)*.

**The Bore.** Magma has driven a tunnel from Meteor Falls into the mountain's flank. **Borehead** crews work it in shifts.

> **SURVEYOR OSSA** *(whispering, to a blank map)*: "Here. Mount Tabitha. No, he'd be unbearable. Mount Ossa. …No. Mount *Quiet*."
> **OSSA** *(to the player)*: "You're standing on a beach. In about a year. Please step back, you'll get sand in the survey."
> *(Battle: Ossa. Trait: **Survey Line**: the first Ground move used by either side each battle hits as if the target were grounded; announced.)*

**Chief Geologist Cozmo** (unless turned) is at the crater rim with a clipboard, thrilled and appalled.

> **COZMO:** "The readings are *extraordinary*. I should stop them. I should absolutely stop them. Would you look at these readings first?"
> **PLAYER (choice):** [Look] → Intel +3, and he steps aside. / [Take the clipboard] → He follows you out, apologizing to the meteorite.

**The Vent** *(if the meteorite was seated, or the result is Partial or worse).* **Fault Line** (`ss.magma.fault-line`) guards a fissure it was bound to keep open.

> *(Battle: Tier 3. Sealing the vent with a Rock or Ice move during the battle counts as the purification's first half and drops it a tier at once.)*
> **After:** if the player returns later and plants a tree on the slope (any Berry), Fault Line is purified and joins or stays, as the player chooses. "It waters the sapling before it looks at you."

### E6.2 Raid 2 — "Slateport Submarine", deeper

**New phase order:** Pier → **Dry Dock Office** *(new)* → Engine Room → **Ballast Deck** *(new)* → Control Bridge.

**Dry Dock Office.** Navigator Stern (unless turned), at a desk covered in his own blueprints.

> **NAVIGATOR STERN:** "Explorer One. Rated to nine thousand meters. I drew every weld. Nobody would pay for her but them."
> **STERN:** "I told myself they wanted to *look*. You don't need a boarding crew to look."
> **PLAYER (choice):** ["Then sink her."] → He hands over the **Scuttle Codes**: the raid's primary can be completed from the Engine Room. / ["Come and see what they do with her."] → He walks with you; on the Bridge he takes the wheel away from Archie's helmsman himself.

**Ballast Deck.**

> **BOSUN QUILL:** "ALL HANDS! INTRUDER ON THE BALLAST DECK! I LOVE THIS CREW AND I WILL NOT SEE IT BOARDED!"
> *(Battle: Quill. The deck floods one step per turn; from step 3 Water moves gain +10% and Electric moves hit both sides.)*
> **BOSUN QUILL (defeat):** "STAND DOWN! …stand down. You fought fair. Tell the Captain I was loud to the end."

**Flagship.** A Wailord swims escort beside the sub. If Stern is with the player, it follows him, and through him the player (`sv.aqua.flagship`).

### E6.3 Raid 3 — "Mt. Pyre", deeper

**New phase order:** Graves → **The Stair** *(new, Front)* → Orb altar → Courtney.

**The Stair.** Both teams arrive at once. Amber leads Aqua's climb; Blaise leads Magma's. They are fighting each other when the player reaches them.

**Format: Front.** Three lanes on the stair: Amber against the player, Blaise against the player, and Amber against Blaise. Each turn the player acts in one lane; the third lane resolves on its own and whoever is losing it is weaker when the player turns to them.

> **AMBER:** "Please step aside. I don't want to hurt you, and I don't want to hurt him, and I'm going to do both."
> **BLAISE:** "She apologizes before every battle. It's the most frightening thing about her."
> **AMBER (defeat):** "Tell Archie I held the stair as long as the stair could be held."
> **BLAISE (defeat):** *(He is already gone. There was never anyone on the third step. A Magcargo is sitting where he stood.)*

**The Keepers,** if the player promised them: they stand at the altar and will not move. Neither team's Grunts will push past two old people. The altar battle has one fewer wave.

### E6.4 Raid 4 — "The Eon Twins" *(new)*

**Scale:** Region. **Offered:** world state 2 or higher, after Raid 1, by a ferryman with a ticket nobody sold him.
**Offer:** *"There's an island that's only on the map some days. Two of them live there. Lived. I heard them calling to each other last night from opposite ends of the sea."*
**PR:** `pr.hoenn.southern-island` — 4 areas: Landing → The Glade → Aqua Camp *(west)* / Magma Camp *(east)* → The Meeting Stone. **Security:** mist (the map of the island is redrawn each time the player leaves an area), resonator pylons that raise a Shadow's tier while they stand.
**Objectives:** *Primary:* free one twin. *Secondary A:* free the other. *Secondary B:* destroy both pylons. *Secondary C:* bring them to the Meeting Stone together.

**Phases**

1. **Landing.** Two boats, one blue, one red, beached at opposite ends. Each crew thinks it got here first.
2. **The Glade.** Empty. A small stone with two hollows worn into it, side by side.
3. **The Camps.** The player chooses which to enter first. The second camp is on alert (+1 battle).
   > **AQUA HANDLER:** "It keeps trying to fly east. There's nothing east but Magma. We think it's defective."
   > **MAGMA HANDLER:** "It keeps trying to fly west. We've tied it down twice."
   > *(Battle at each camp: the twin, `ss.aqua.ebb` or `ss.magma.kindle`, Tier 3, one tier lower if its pylon is already down. It fights until it sees the other.)*
4. **The Meeting Stone.** If both are freed and brought to the glade, there is no battle.
   > *(They circle each other once. The Shadow leaves them both at the same instant, like a breath let out. One of them drops something at the player's feet: a small blue-and-red orb.)*

**Reward (both freed):** Key Item **Soul Dew**. In Phase 6 the twins arrive and each holds one Orb link shut for two turns.

**Results (Lever: *The Twins*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | Both twins free and reunited; both pylons down | **Soul Dew:** two Orb links start cracked in Phase 6 | −3 |
| **Success** | Both free | One link starts cracked | −2 |
| **Partial** | One free; the other is shipped to its team's hideout | The bound twin fights for its team in Phase 4 | −1 |
| **Failure** | Neither freed; you wake on the ferry | Both twins fight in Phase 4 | +2 |
| **Declined** | The island is not on the map the next day | Both twins fight in Phase 4 | +1 |

**Failure consequences:** **C10 (Shadowed), C8 (Reputation fall), C11.**

### E6.5 Raid 5 — "Mossdeep Launch" *(new)*

**Scale:** Border. **Offered:** after `xe.hoenn.arms-dealer`, or at world state 4.
**Offer (a Space Center technician, pale):** *"We've got a rocket on the pad fuelled for orbit. One lot wants the fuel for their volcano. The other lot wants to flood the pad so nobody gets it. And there's a third man in the car park selling them both something that makes the ground shake."*
**PR:** `pr.hoenn.space-center` — 4 areas: Car Park → Mission Control → Fuel Farm → Launch Pad. **Security:** a launch countdown (**16 turns** across the raid), blast doors, a quake engine that knocks Flying and Levitating Pokémon to the ground every fourth turn.
**Objectives:** *Primary:* keep the fuel on the pad. *Secondary A:* shut down the quake engine. *Secondary B:* defeat Dakim. *Secondary C:* unmask Brodie.

**Phases**

1. **Car Park.** Dakim, with a machine the size of a van.
   > **DAKIM:** "Ha! The little one who fights! Come, come. I am demonstrating for two buyers. You can be the *demonstration*."
   > *(Battle: Dakim, with **Mountain Rules**. If Entei was shipped from Johto, it is his last Pokémon, a Shadow at Tier 3.)*
   > **DAKIM (defeat):** "Good! *Good.* Take the little record." *(He tosses a disc.)* "I do not read. I lift."

   *Reward:* **Data ROM H: "Resonator Mark II"**.
2. **Mission Control.** One of the scientists is not a scientist.
   > **"DR. HALLEY":** "Everything's under control! Please return to the gift shop!"
   > *(Three questions about the rocket. A real technician knows the answers; Brodie guesses. Catch two wrong answers and he drops the face.)*
   > **BRODIE:** "Seventeen jobs without a slip, and it's *rocket trivia* that gets me."
3. **Fuel Farm.** A tag battle. If Steven was told about Dakim, he fights beside the player.
   > **MAXIE** *(or Tabitha, if Maxie's Phase is being saved for the climax)*: "The mountain needs one push. This is the push."
   > **STEVEN:** "I've audited mountains. They don't need help. Shall we?"
   > *(Multi Battle: the player and Steven against Tabitha and a Magma Commander. Steven's Metagross takes the first hit each turn.)*
4. **Launch Pad.** Aqua's team has opened the sea valves. Water is climbing the gantry.
   > **MATT:** "BRO! If nobody gets the fuel then nobody *loses*! That's just maths!"
   > *(Battle: Matt with **Bosun**. Win before the countdown and the technicians launch the rocket empty, on schedule, to keep the fuel out of everyone's hands.)*

**Results (Lever: *The Fuel*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The rocket launches clean; the quake engine is scrap | **No push:** Cinderheart enters Phase 6 one tier lower; no quake effect in Phase 3 | −3 |
| **Success** | The fuel stays on the pad | No quake effect in Phase 3 | −2 |
| **Partial** | Half the fuel is taken or drowned | No change | −1 |
| **Failure** | Magma takes the fuel, or Aqua floods the pad (by tilt) | The leading team's titan enters Phase 6 with one extra link | +2 |
| **Declined** | Both happen | Tilt moves 1 toward the leading team | +1 |

**Failure consequences:** **C4 (Strength surge), C5 (Blacklisted), C11.**

---

## E7. The Climax — Extended Cut: "The Long Weather"

Checkpoints are after Phase 2 and at the Breather.

| # | Phase | Format | New or base | Battles |
| --- | --- | --- | --- | --- |
| 0 | Broadcast and Choice | — | base §10.1–10.3 | 0 |
| 0b | **Sootopolis Divided** | Siege Map | new | 0 |
| 1 | **The Crater Lake** | Blackout | new | 2–3 |
| 2 | The Descent | Gauntlet | base Phase 1, extended | 4–6 |
| 3 | The Admins | Duels and Front | base Phase 2, extended | 2–4 |
| — | **Breather** | Rest | new | 0 |
| 4 | The Orbs Resonate | Set piece | base Phase 3, extended | 2–4 |
| 5 | Archie and Maxie | Boss | base Phase 4, extended | 1–2 |
| 6 | **The Awakening: Abyssal and Cinderheart** | Colossus | new | 1 |
| 7 | **The Sky Pillar** | Duel | new, optional | 1 |
| 8 | Resolution | — | base §10.9, extended | 0 |

### E7.1 Phase 0b — Sootopolis Divided (Siege Map)

Sootopolis sits inside a crater. Aqua holds the west ledge, Magma the east.

| District | Held if… | If Lost |
| --- | --- | --- |
| **The Harbor Tunnel** | Raid 2 Success or better, or Stern turned | Entry costs one underwater battle |
| **West Ledge** | Tilt is +1 or more (Aqua is behind), or Amber was beaten | Aqua's pedestal in Phase 4 has one more defender |
| **East Ledge** | Tilt is −1 or less (Magma is behind), or Blaise was beaten | Magma's pedestal in Phase 4 has one more defender |
| **The White Rock** | Steven holds it, or the Keepers do | The Last Rest shop is closed |
| **The Cave Mouth** | Never; both teams are fighting over it | See Phase 2 |

> **WALLACE** *(on the crater rim, arranging his cape against the wind)*: "The cave has been in my family's keeping for a thousand years. In all that time the difficult part was getting anyone to visit. I do feel the universe overcorrected."

### E7.2 Phase 1 — The Crater Lake (Blackout)

The player crosses the lake to the cave. **Condition — *The Swing*:** weather flips between rain and harsh sun every two turns with no warning. It ends when either team's lakeside resonator is destroyed, or immediately if **Forecast** is in the party ("Forecast calls the weather before it turns.").

> **AQUA GRUNT (in a rowing boat):** "Is it raining? I can't tell anymore. I think I'm sunburnt *and* soaked."
> **MAGMA GRUNT (on a raft, to the Aqua Grunt):** "Lunch-break rules?"
> **AQUA GRUNT:** "…Lunch-break rules."
> *(If `hoenn.x.truce-seed` is set, these two do not fight the player or each other; they row the player across. One battle is skipped.)*

### E7.3 Phase 2 — The Descent (extended)

| Landing | Trainer | Notes |
| --- | --- | --- |
| Harbor | Aqua Grunts ×2 | base |
| Cliff path | Magma Grunts ×2 | base |
| **Tide Stair** | Aqua Handler | Two Tidebound Pokémon; rain |
| **Ember Stair** | Magma Tunneler with **Borehead** | Harsh sun; removed if Raid 1 was a Triumph |
| Cave mouth | Aqua Researcher + Magma Researcher | base |
| Inner Cave | Shelly with **Siren** | Trait: **Riptide** |
| Inner Cave | Courtney with **Specimen Nine** | Trait: **Magma Surge** |

> **AQUA RESEARCHER:** "Our Orb is at ninety percent!"
> **MAGMA RESEARCHER:** "Ours is at ninety-one."
> **AQUA RESEARCHER:** "…Did you round up?"
> **COURTNEY:** "Subject has returned. Probability of my defeat: recalculating. Recalculating. I dislike that it is still recalculating."

### E7.4 Phase 3 — The Admins (extended)

**Duels 1 and 2 — Shelly and Courtney** (base).

**Duel 3 — Matt and Tabitha** *(new; Front).* They are fighting each other across a rope bridge when the player arrives, and both turn.

> **MATT:** "BRO. Sit this one out, it's between me and the laughing guy."
> **TABITHA:** "Ahyahyahya! He's been calling me that for an hour!"
> *(Front: three lanes. Matt with **Bosun**, Tabitha with **Old Faithful**, and the two of them against each other. Executive Ability, Matt — **Full Send**: his lead's first move has +1 priority and +20% power, then −1 Defense. Executive Ability, Tabitha — **Boil Over**: in harsh sun his Fire moves leave steam, −10% accuracy for both sides for 2 turns. Both announced.)*
> **MATT (defeat):** "…Bro. *Bro.* That was *beautiful*."
> **TABITHA (defeat):** "Ahya… ha. Don't tell Maxie I was on a bridge."

**Duel 4 — Dakim** *(conditional: only if he was not beaten in Raid 5).* He is sitting on a crate of unsold resonators at the last landing.

> **DAKIM:** "Both my customers are downstairs breaking the merchandise. Terrible for repeat business. Fight me while I think of a new one."

### E7.5 Breather

A spring behind the cave wall that only the Keeper's family knows.

> **WALLACE:** "Drink. It's older than both of their arguments. I find that restful."

Heal 50%, revive one Pokémon, checkpoint.

### E7.6 Phase 4 — The Orbs Resonate (extended)

The base set piece (Orb pedestals, alternating weather) with three additions.

- **The swap trick.** With `hoenn.x.cancel-trick`, the player may spend a turn at any pedestal to cross the two resonator leads. That pedestal is finished at once. It works once.
- **The twins.** A twin still bound fights at its team's pedestal as a Tier 3 Shadow. A freed twin arrives and takes one hit for the player's side each battle.
- **Zinnia** is sitting on a ledge above the altar, hood down, eating an apple.
  > **ZINNIA:** "Don't mind me. I'm just here for the ending. I've read it. It's got a dragon in it."
  > **PLAYER (if `hoenn.x.maps-compared`):** "You gave them both the map."
  > **ZINNIA:** "Half each. Like a wishbone." *(She throws the core into the dark.)* "Go on. You're on the page too, you know. I never could tell which way you'd turn out."

**New PA lines** *(as pedestals are saved)*:

> **ARCHIE:** "One pedestal! The sea's patient. I'm not, but she is."
> **MAXIE:** "A delay of ninety seconds. I had allowed for one hundred and twenty."
> **ARCHIE:** "…Maxie. Why's yours glowing when I hit mine?"
> **MAXIE:** "That is not possible. …That is not *supposed* to be possible."

### E7.7 Phase 5 — Archie and Maxie (extended)

The base fight (§10.7) with **Riptide** and **Caldera**.

**New boss stage — *Common Cause*** (when the second leader's ace falls below half): both Orbs flare at once. The leaders stop.

> **ARCHIE (opening, extended):** "I pulled a kid out of a tide pool once. Soaked through, laughing. I thought: the sea *made* that. I've been trying to give it more room ever since."
> **MAXIE (opening, extended):** "I watched a town vote on which half of itself to let the water take. I resolved that nobody would have to hold that vote again."
> **ARCHIE:** "…That's a good reason."
> **MAXIE:** "Yours is sentimental. It is not *bad*."
> **ARCHIE (Common Cause):** "Maxie. Who sold you the red one?"
> **MAXIE:** "A large man. Very loud. …You?"
> **ARCHIE:** "Aye."
> **MAXIE:** "And the mural. A consultant read it to you."
> **ARCHIE:** "Blue hood."
> **MAXIE** *(closing his eyes)*: "We have been *played against each other by the supply chain*."

If `hoenn.x.truce-seed` is set, the Grunts on both ledges have already put their Poké Balls away. The battle ends at *Common Cause* without the last knockouts.

> **ARCHIE (defeat, extended):** "Doesn't matter who started it. Look."
> *(The water in the cave is rising. The rock under it is glowing.)*

### E7.8 Phase 6 — The Awakening: Abyssal and Cinderheart (Colossus)

*The cave floor splits. On one side, something the size of a ship surfaces in water that was not there a minute ago. On the other, something the size of a hill stands up out of stone gone soft.*

**Format.** Two Colossi at once: **Abyssal** (`ss.aqua.abyssal`, XD004) and **Cinderheart** (`ss.magma.cinderheart`, XD005). Neither can be knocked out. Each is held by its Orb through **three links**, and each link is a shield bar. The player wins when all six links are broken, or when one titan's three are broken and the other's are held shut by allies.

**The weather** is both at once. Each turn the game announces which titan will act: on Abyssal's turns the heavy rain rules (Fire fails); on Cinderheart's, the extreme sun (Water fails).

**Allies.** Archie stands at the Blue Orb and Maxie at the Red, each fighting his own titan's link beside the player. A leader who was spared the last knockout in Phase 5 has two Pokémon left; otherwise one. The freed twins, Steven, Wallace and the rival (Help) each hold one link shut for two turns.

> **ARCHIE:** "Riptide! Not the big one, the *chain*! Bite the chain!"
> **MAXIE:** "Caldera. Thirty degrees left. I have never asked you for anything unreasonable. This is unreasonable. Please."
> **ARCHIE** *(first Blue link)*: "She's looking at me. All this time I thought she'd be glad."
> **MAXIE** *(first Red link)*: "It is in pain. That was not in the model. Why was that not in the *model*?"
> **ZINNIA** *(from above, quiet for once)*: "…Come on. Come on. Loud enough. It has to be loud enough."

**Timer:** 14 turns. **Adjustments:** Soul Dew cracks one or two links at the start; Raid 5 Triumph lowers Cinderheart a tier; Raid 2 Triumph lowers Abyssal a tier.

**When the last link breaks:** both Orbs go dark. The titans look at each other across the cave for a long moment. Then the sea one sinks and the land one lies down, and the rain and the sun both stop.

**If the timer runs out:** the titans break the cave roof and take the fight outside. The climax can still be won at Phase 7 or by the Resolution, but XD004 and XD005 enter the Region of Doom unless Rayquaza is called.

### E7.9 Phase 7 — The Sky Pillar (optional)

*Available if the player wants to call Rayquaza, or immediately after Phase 6 if `hoenn.x.two-hoods` is set.* A tower on a rock in the open sea. Zinnia is at the top, in neither hood.

> **ZINNIA:** "So. They woke. It was loud. And up there—" *(She points. A light in the sky that is not a star.)* "—that's the bit of the mural neither of them got. It's a rock the size of a city, and it's been falling for a thousand years, and it lands *here*."
> **ZINNIA:** "I was going to call the dragon myself. That was the plan. Stand here, be worthy, ride up, save everybody, and nobody ever needs to know what I did to get it done."
> **ZINNIA:** "It won't come for me. I've been calling for an hour. I think it knows what I did."
> **PLAYER (choice):** ["Then I'll call it."] / ["You don't get to decide who pays."] / [Say nothing; step forward]
> **ZINNIA:** "Yeah. Okay. But I have to know you can carry it. I'm sorry. This is the last rotten thing I'll ask of anyone."
> *(Battle: Zinnia, with Salamence as a Mega. **Lorekeeper** applies. No Shadow Pokémon on either side: any in the player's party sit this battle out, announced.)*
> **ZINNIA (defeat):** *(She laughs, and then she is crying, and it is hard to tell where one stops.)* "There it is. *There* it is. Aster, look. It came."

**Win:** Rayquaza descends. The Resolution option [Call Rayquaza] is available and it also deals with what is falling. **Lose:** the run does not end; Zinnia calls again and this time is answered, and she goes up alone. The option [Call Rayquaza] is replaced by [Let her go].

### E7.10 Phase 8 — Resolution (extended)

The Orb choice (base §10.9) with these additions.

4. **[Give each Orb to the other titan]** *(only after* The Keepers*).* The Blue Orb is carried to the land titan and the Red Orb to the sea titan. *Effects:* both are purified as a story event; both Orb Resonance methods end for good; the Peacemaker Emblem; `legend-weather-crisis` resolved without Rayquaza. "You keep an apology where you can see it."
- **[Call Rayquaza], after the Sky Pillar:** the light in the sky goes out an hour later. *Hoenn Broadcast:* "Astronomers report that an object they had declined to tell us about is no longer a concern."
- **[Let her go]:** Zinnia is not seen again in this run. Aster is left with the player (a Whismur with the item **Lorekeeper's Cord**: it survives one fatal hit per battle).
- **Dakim's stock.** If Dakim was beaten, the player decides what happens to forty unsold resonators: [Hand them to Devon] (Steven: "We'll put the error bars back on.") / [Sink them] / [Keep one] (a Key Item that sets weather once per battle; Heat +1 tier with whichever team survives).

### E7.11 Rival and Stand-with additions

- **Help:** the rival holds a link in Phase 6. *Line:* "I'm holding a chain attached to the *ocean*. I want that remembered next time you say I never help."
- **Beat-you:** the rival is found between the two pedestals in Phase 4, shielding a bound twin from both teams.
- **Side-with:** the rival is **Deckhand "Low Tide"** or **Cadet "Kindling"**. Their own leader releases them at *Common Cause*: "Take the bandana off, kid. I'm about to."
- **Stand with them:** the player is **"Stowaway"** or **"Ember"**. In Phase 6 the player holds their own leader's Orb while he fights the link. See `scripts/10_STAND_WITH_THEM.md` §3; the new lines are Archie's "Stowaway, if she takes me under, you finish it" and Maxie's "Ember. I calculated a role for you. Disregard it. Improvise."

---

## E8. Aftermath and the Thread

- **Archie and Maxie** (any ending where both titans rest): they are seen once, on a breakwater, sharing a thermos and not talking.
- **Stern and Cozmo** write a joint paper. It has error bars.
- **The lunch-break Grunts** open a noodle stall in Slateport: half the sign is blue and half is red.
- **Low Tide**, if it was helped off the beach, breaches once beside every ferry the player takes for the rest of the region.
- **The Keepers:** two cushions, two Orbs, or two empty cushions and a note that says *thank you for asking first*.

**The Thread (`docs/GRAND_ARC.md`).** **Data ROM H: "Resonator Mark II"** shows the Orb resonators, the Rig Pulse and the Carrier Beat are one waveform at three sizes. Dakim's delivery log lists a fourth customer, further north: someone who ordered a chain.

> **DAKIM (note pinned to a crate):** "Little one. I go north. There is a man there who wants to tie up *time* and *space*. He does not laugh. I do not like him. He pays in advance. — D."

---

## E9. Dialogue Bank

### E9.1 New ambush lines

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Aqua Deckhand (Sunburnt) | "It was raining when I left the tent. Now look at me. Fight me before it changes again." | "…It changed again." |
| Grunt — Magma Tunneler (Dusty) | "Six weeks underground. You're the first thing I've seen with a face. Sorry about this." | "Back down the hole, then." |
| Grunt — Aqua Handler (Proud) | "Tidebound. Raised her myself. She only listens when it's wet." | "It's *dry*. That's cheating." |
| Grunt — Magma Handler (Proud) | "Cinderborn. Hatched him on a vent. Feel that heat?" | "He's gone *cold*." |
| Specialist — Aqua Researcher (Eager) | "For the record: the sea was here first. I have charts." | "The charts didn't cover this." |
| Specialist — Magma Researcher (Detached) | "You are standing on future real estate." | "I withdraw the valuation." |
| Lieutenant — Bosun Quill (Loud) | "INTRUDER! I SAY THIS WITH RESPECT!" | "RESPECTFULLY: OW." |
| Lieutenant — Surveyor Ossa (Whispery) | "Shh. I'm naming a mountain. You can be a foothill." | "A *large* foothill." |
| Lieutenant — Brodie (Any accent) | "G'day! Bonjour! Howdy! …Which one was I doing?" | "I'll be someone else by morning. He'll win." |
| Commander — Amber (Gentle) | "I'm so sorry. Truly. Send out your first." | "Thank you for being quick about it." |
| Commander — Blaise (Languid) | "Are you sure I'm standing here? Look again." | *(No answer. A shimmer where he was.)* |
| Liaison — Dakim (Bellowing) | "A customer who pays in *battle*! My favorite kind!" | "Strong! Buy nothing! I respect it!" |

### E9.2 Leader barks

| Moment | Archie | Maxie |
| --- | --- | --- |
| Player lands a super-effective hit | "Hah! There's salt in you." | "An efficient choice. I resent it." |
| Player's Pokémon faints | "Easy. It'll wake. The sea gives back." | "A loss. Log it and continue." |
| His Pokémon faints | "Rest, mate. You swam well." | "Recall. …You performed adequately. More than." |
| Weather turns against him | "Sun. *His* sun. Fight through it!" | "Rain. Of course. Compensate." |
| A Shadow Pokémon disobeys the player | "You've one of the Orb's own? Then you know. It never asks." | "Fascinating. And, I am beginning to think, unforgivable." |
| Last Pokémon each | "One wave left. Make it count." | "Final variable." |

### E9.3 Weather Institute forecasts (heard at rest nodes, by world state)

| Step | Forecast |
| --- | --- |
| 1 | "Showers in the east, sunshine in the west, and, er, the reverse. Both. We'll get back to you." |
| 2 | "Today's weather is brought to you by whichever team is nearer. We are not joking. We wish we were." |
| 3 | "The Institute advises carrying an umbrella and sunscreen and a second umbrella." |
| 4 | "Ash warnings for the south coast. Flood warnings for the south coast. Yes, we know." |
| 5 | "…We've stopped forecasting. Look up. That's the forecast." |

### E9.4 Civilians by world state

| Step | Line A | Line B |
| --- | --- | --- |
| 1 | "My washing's been on the line for a week. Wet, dry, wet, dry." | "The hot spring's gone lukewarm. Somebody's been tampering with the *earth*." |
| 2 | "I'm for Aqua. My husband's for Magma. We eat in separate rooms." | "Neither of them asked us. Have you noticed? Neither one *asked*." |
| 3 | "I've had sunstroke and a cold since Tuesday." | "The Pokémon don't know what season it is. My Roselia's bloomed four times." |
| 4 | "Ferry's cancelled. Cable car's cancelled. I'd walk, but the road's on fire or underwater, I forget which." | "We're packing. My sister's in Johto. It only *sings* at you there." |
| 5 | "Rain on one side of my face and sun on the other. I never thought the end would be so *uneven*." | "…" *(They are watching the sky. There is a light in it.)* |

### E9.5 Announcer lines for special Pokémon

| Pokémon | On entry |
| --- | --- |
| Riptide | "Riptide smells blood in the water." |
| Caldera | "Caldera's pressure is building." |
| Flagship | "Flagship takes position. Allies shelter behind it." |
| Forecast | "Forecast shows tomorrow's weather: …" |
| Ebb / Kindle | "The shadow tightens. It is looking for someone." |
| Abyssal | "The ceiling is weeping." |
| Cinderheart | "The stone begins to glow." |

---

## E10. Flags and Wiring

| Flag | Set by | Read by |
| --- | --- | --- |
| `hoenn.x.weather` (0–5), `hoenn.x.tilt` (−3 to +3) | Raids, events | Weather, civilians, Siege Map |
| `hoenn.x.cancel-trick` | *Wet Cellar, Dry Well* | *The Arms Dealer*, Phase 4 |
| `hoenn.x.stern`, `hoenn.x.cozmo` (`turned`) | *Stern and Cozmo* | Raids 1 and 2, Siege Map |
| `hoenn.x.maps-compared`, `hoenn.x.two-hoods` | Events | Phase 4, Phase 7 |
| `hoenn.x.truce-seed` | *Lunch Break* | Phase 1, Phase 5 |
| `hoenn.x.keepers` | *The Keepers* | Raid 3, Phase 8 option 4 |
| `hoenn.x.titans` (`rest` / `loose`) | Phase 6 | Aftermath, Region of Doom |
| `cipher.seen.dakim`, `cipher.rom.h` | *The Arms Dealer*, Raid 5 or Phase 3 | `docs/GRAND_ARC.md` |

**Counts for this file:** 16 named characters (6 new officers, 10 team versions and allies), 12 special Pokémon across two lines, 6 special Shadow Pokémon (2 Apex), 8 story events, 3 deepened raids and 2 new raids, an 8-phase Extended Cut, and 5 dialogue tables.
