# 06x — KALOS: TEAM FLARE — EXPANDED EDITION
### Script: *The Last Beautiful Day*

> *"I gave, and gave, and the world held out its hand for more. There is not enough. There was never going to be enough. So: fewer hands."* — Lysandre

**Extends:** `scripts/06_KALOS_TEAM_FLARE.md` (the base script stays valid; this file adds to it)
**Template:** `docs/EXPANSION_DESIGN.md` · **Cross-region arc:** `docs/GRAND_ARC.md`
**Canon note:** Lysandre, Malva, Xerosic, Aliana, Bryony, Celosia, Mable, AZ and his Floette, Professor Sycamore, Diantha, Sina and Dexio, Emma, her Espurr Mimi and the Expansion Suit persona **Essentia**, the Holo Caster, the five-million entry fee and the boutique that turns away the unstylish are canon to the games. Alain, Mairin, Chespie, the Zygarde cores called Squishy and Z-2 and the moving megalith are canon to the anime. Venus is a canon Cipher admin (Colosseum). **Couturière Valerie** is a *what-if* version. All dialogue is original. Species are my best recall and are marked approximate.

---

## E1. The Wider Scale

The base script is a weapon under a village. The Expanded Edition shows who has been invited to survive it, and how the invitations were delivered.

### E1.1 The plan at five scales

| Scale | What Flare is doing | What the player sees | Where it pays off |
| --- | --- | --- | --- |
| 1 **Street** | Selling membership: a red suit and a place on the list, five million each | A boutique that will not serve you; a recruiter who will | Event *Not Stylish Enough* |
| 2 **City** | Blacking out Lumiose to feed the weapon; borrowing trainers' Pokémon by night through a girl in a suit she cannot take off | Dark boulevards; a thief on the rooftops who apologizes | Raid 1; event *Essentia* |
| 3 **Region** | Draining Mega Evolution energy through an honest courier; draining a jewel, a fossil king and a film star's partner; moving a rock the size of a cathedral | A boy with a black Charizard who thinks he is helping | Events *The Courier*, Raids 4 and 5 |
| 4 **Border** | Putting a Holo Caster in every pocket, in Kalos and beyond; competing for airtime with a rival broadcaster | The same red-haired man on every screen, and sometimes a woman who is not Malva | Event *Under Time* |
| 5 **World** | Firing a weapon that takes the life of everything not carrying the right device, and gives it to those who are | A countdown that appears on the player's own Holo Caster | Climax Phases 6 and 7 |

### E1.2 World-state track — *The Guest List*

Stored in `flare.x.guest-list` (0–5).

| Step | Name | Regional rule | Civilian mood |
| --- | --- | --- | --- |
| 1 | **Invitations** | One boutique per city refuses the player; Flare recruiters appear at city nodes | Flattered |
| 2 | **Blackout** | Half of each city is dark: night rules apply there at all hours | Irritated |
| 3 | **Members First** | Pokémon Centers heal members first: the player's heal is 85% unless carrying a Flare badge | Dividing |
| 4 | **Prime Time** | The Holo Caster interrupts once per stage; shop stock shows "reserved for members" on two items | Afraid to be seen |
| 5 | **Countdown** | A timer on every screen; the climax is scheduled | Dressed in red, or hiding |

### E1.3 The bigger secret

Malva's newscast is Flare's megaphone (base script §3). The **Holo Caster** is the rest of it. Lysandre's laboratory invented the device and gave it to the region nearly free. Every one of them reports where its owner is standing. A Holo Caster with a Flare key is a shelter. One without is a target. The five million does not buy a suit. It buys the key.

Lysandre did not start here. He started by giving: money, time, his whole fortune, to anyone who asked. They kept asking. He concluded that kindness was a finite thing being divided among too many, and that the only merciful arithmetic left was subtraction. He is sincerely sorry about it. That is what makes him persuasive.

**Venus** of Cipher supplied the siphon that drains a Pokémon into the machine. Her price was the footage. She has a show to fill.

And a very tall, very old man is walking the roads of Kalos toward Geosenge. He built the weapon. He has been looking for a flower for three thousand years.

---

## E2. Expanded Cast

### E2.1 New officers and specialists

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.flare.corbeau` | **Maître d' Corbeau** | Lieutenant (3) | original | Infiltrator: runs the Lysandre Café and decides who is shown downstairs | Honchkrow, Banette, Klefki | Impeccable; can refuse a table in a way that feels like a compliment |
| `sc.flare.garance` | **Treasurer Garance** | Lieutenant (3) | original | Handler: collects the five million and keeps the list | Persian, Furfrou, Florges | Warm, brisk; treats the end of the world as a subscription service |
| `sc.flare.venus` | **Venus** | Liaison (4) | canon (Colosseum) | Spokesperson: Cipher's star, producer of a show called *Under Time* | Milotic, Bellossom, Steelix, Banette *(approximate)*; a Shadow Suicune if it was taken in Johto (`cipher.beast.suicune`) | Honeyed on camera, flint off it |
| `sc.flare.gallery-twins` | **Sina and Dexio** | Ally | canon (games) | Sycamore's assistants, who fight in masks and insist nobody knows who they are | Glaceon, Espeon *(approximate)* | Cheerful; very bad at secret identities |

### E2.2 Team versions of characters you know

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.flare.essentia` | **Essentia** | Commander (4) | canon (games) | Emma, a girl from the Lumiose alleys, inside Xerosic's Expansion Suit: stronger, faster, and not steering | Persian, Crobat, Malamar, and whatever she has borrowed | A filtered voice; under it, sometimes, "sorry, sorry, sorry" |
| `sc.flare.alain` | **Alain, the Courier** | Commander (4) | canon (anime) | A trainer who collects Mega Evolution energy for Lysandre, having been told it is to protect people | **Ember-Black** (Charizard) | Serious, driven, kind when he forgets to be serious |
| `sc.flare.valerie` | **Couturière Valerie** | Contractor | what-if | Laverre's designer, who made the red suits for a client she was told was a theatre company | Sylveon, Mawile, Aromatisse | Dreamy, exact; horrified in a very quiet way |
| `sc.flare.sycamore` | **Professor Sycamore** | Ally | canon (games) | Lysandre's oldest friend, who heard all of it across a café table and thought it was philosophy | Garchomp *(approximate)* | Easy, charming, sick with hindsight |
| `sc.flare.diantha` | **Diantha** | Ally | canon (games) | Kalos's Champion and its most famous actress | Gardevoir | Gracious; steel when the camera is off |
| `sc.flare.az` | **AZ** | Ally | canon (games) | A king, once. He built the weapon to bring one Pokémon back, and it worked, and she left | Torkoal, Golurk, Sigilyph | Slow; every sentence has travelled a long way |
| `sc.flare.rival-amaryllis` | **Admin "Amaryllis"** (the rival) | Lieutenant (3) | what-if | The rival in a tailored red suit, in the Side-with variant | The rival's team plus one Couture Pokémon | The rival's archetype, with better posture |
| `sc.flare.player-guest` | **The Guest of Honor** (the player) | Specialist (2) | what-if | The player on the Inside Man and Stand-with routes; Lysandre's own name for the one person he wants to save without charging | The player's team | — |

> **Members are not Grunts.** A Flare *member* is a wealthy civilian in a red suit who paid to be on the list. Members never battle. They complain, and several of the best lines in the climax are theirs.

---

## E3. Special Pokémon — the Couture line

**Couture** Pokémon have been groomed, dyed crimson and fitted with an accessory cut from Mega-charged stone.

**Line rule — *Couture*:** a Couture Pokémon carries a second held item, its **accessory**, shown to the player at the start of battle. Knock Off, Thief and similar moves remove the accessory first (announced: "Its accessory is knocked askew."). A Couture Pokémon that is caught or freed keeps the accessory as an ordinary item.

| ID | Name | Species | Signature trait | Where met | Can the player get it? |
| --- | --- | --- | --- | --- | --- |
| `sv.flare.sovereign` | **Sovereign** | Gyarados / Mega Gyarados | *Without Flaw*: the first super-effective hit it takes each battle is treated as neutral | Lysandre's ace | No |
| `sv.flare.pride` | **Pride** | Pyroar / Z-Mega Pyroar | *Looks Down*: +1 Special Attack on entry if the Pokémon facing it is slower | Lysandre | No |
| `sv.flare.prime-time` | **Prime Time** | Talonflame | *Live Feed*: while Malva's **On Air** is active, its Fire moves have +1 priority | Malva | No |
| `sv.flare.contrarian` | **Contrarian** | Malamar | *Inverse Lecture*: once per battle it reverses every stat change on the field, both sides | Xerosic | No |
| `sv.flare.stiletto` | **Stiletto** | Aegislash / Blade Aegislash | *Dressed to Kill*: changing stance does not use its turn | Celosia | No |
| `sv.flare.gargoyle` | **Gargoyle** | Druddigon | *Rough Cut*: contact with it removes the attacker's held item for 2 turns | Aliana | No |
| `sv.flare.ember-black` | **Ember-Black** | Charizard / Mega Charizard X | *Chosen Bond*: its Mega Evolution needs no turn and no item slot; it fails if Alain doubts (see Raid 5) | Alain | No |
| `sv.flare.mimi` | **Mimi** | Espurr / Meowstic | *Knows Her Voice*: when it faces Essentia it reveals which of her Pokémon is borrowed | Emma's Espurr, in the Lumiose alleys | Ally only: it is Emma's |
| `sv.flare.cavern-elder` | **The Elder of the Cavern** | Abomasnow / Mega Abomasnow | *Old Snow*: hail it brings lasts until it leaves the field | Frost Cavern, Raid 2 | Yes: it gives an Abomasite and comes along if asked |
| `sv.flare.eternal-flower` | **The Eternal Flower** | Floette / Eternal Floette | *Three Thousand Years*: once per battle it revives a fainted ally to 25% HP | With AZ, at the very end | Yes: only if AZ reached Geosenge and the weapon was not sealed with him inside |
| `sv.flare.squishy` | **Squishy** | 10% Zygarde / Zygarde / Complete Zygarde | *Order*: the field cannot hold more than one weather, terrain or room effect while it is out; the oldest ends | In the player's bag, uninvited | Ally only: it is not anyone's |

> Mimi, the Elder, the Eternal Flower and Squishy are not Couture. Ember-Black is not either; Alain would not allow it. Lysandre finds that admirable, and has made a note of it.

---

## E4. Special Shadow Pokémon

Flare's method is the **Life-Force Siphon**; opening the conduits that feed on a Pokémon gives −35 Corruption (Shadow doc §6).

| ID | Code | Name | Species | Tier | Shadow ability | Shadow moves | Purification key | Where met |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ss.flare.leading-lady` | — | **The Leading Lady** | Gardevoir / Mega Gardevoir | 3 Gripped | Tailored Edge | Dusk Brand, Siphon Lull, Pale Echo | Diantha's voice: she must be present and say the line they rehearsed together | Raid 4 |
| `ss.flare.rose-of-the-mine` | — | **The Rose of the Mine** | Diancie / Mega Diancie | 3 Gripped | Hollow Hide | Cinder Ward, Dusk Brand, Null Pulse | Return its Heart Diamond from the weapon's cooling loop | Raid 2, the Dig Site |
| `ss.flare.ancien-regime` | — | **Ancien Régime** | Tyrantrum | 3 Gripped | Lurker | Gloam Crash, Weeping Maw, Umbral Rush | Open the conduit in Lysandre Labs that feeds on it | Raid 3 |
| `ss.flare.z2` | — | **Z-2** | Zygarde / 10% Zygarde | 4 Fallen | Tailored Edge | Chain Hymn, Gloam Crash, Heart Eclipse | Squishy must reach it and touch it | Raid 5; Phase 7 |
| `ss.flare.battery` | XD009 | **The Battery** | Xerneas / Yveltal | 4 Fallen | Contract Clause | Siphon Lull, Null Pulse, Borrowed Years | Story only: close the flower's three petals | Geosenge, Phase 6 |

**Signature Shadow move — Borrowed Years:** 100 power; heals the user by half the damage dealt; the target's maximum HP is lowered by 1/8 for the rest of the battle. Cost: +6 Corruption. Announced one turn ahead ("The light dims around it.").

**Notes**
- **The Battery** is the legendary of life or of destruction, by the run's seed. It is not Lysandre's partner. It is the weapon's fuel, held in the cocoon or the tree where it slept, and it has not woken up. What the player fights is its sleep.
- **Essentia's borrowed Pokémon.** In any battle with Essentia, one of her slots holds a Pokémon taken from a trainer in the region. If the player has a Pokémon in Impound (consequence C1), it is that one, as a Tier 1 Shadow, and winning returns it.
- **Z-2** follows the Legendary Shadow rules. So does the Battery.

---

## E5. New Story Events

### E5.1 *Not Stylish Enough* (`xe.kalos.boutique`) — Street

*Trigger: Lumiose, any time after Ignition. A boutique on a gold-paved avenue.*

> **CLERK** *(a single glance, head to foot)*: "I'm afraid we couldn't possibly. Perhaps when you're a little more… *known*."
> *(Outside, a woman in a red suit is waiting with a brochure, as if she knew.)*
> **TREASURER GARANCE:** "Dreadful, aren't they? Nobody should be made to feel that way. *We* would never turn you away. Membership is five million."
> **PLAYER:** "Five *million*."
> **GARANCE:** "It includes the suit. And a Holo Caster upgrade. And, between ourselves, rather a good chance of being here next year. Most people find that reassuring once it's explained."
> **PLAYER (choice):**
> 1. **[Pay]** *(if you somehow can)* → A **Flare Key** for your Holo Caster: `flare.x.member = true`. Centers heal you in full; Heat −20; in Phase 6 the weapon does not target your party's HP on the first pulse. Sycamore will not look at you.
> 2. **["What's being explained?"]** → She explains, pleasantly, about half of it. Intel +5. **GARANCE:** "You've gone pale. It suits you. Red would suit you more."
> 3. **[Take a brochure and leave]** → Key Item **Membership Brochure**: one member in the climax mistakes you for a prospect and lets you through a door.
> **CLERK** *(through the glass, afterwards)*: "…I only said it because I couldn't afford the suit either."

### E5.2 *The Corner Table* (`xe.kalos.cafe`) — City

*Trigger: Lumiose, before Raid 1. A red café. Three people at the corner table: a professor, a film star, and the man who owns the room.*

> **LYSANDRE:** "Diantha. You are extraordinary on the screen. Would you not wish to remain so? To be this, always?"
> **DIANTHA:** "What a strange question. No. I'd like to play someone's grandmother one day. It's a better part."
> **LYSANDRE:** "You would let it fade."
> **DIANTHA:** "I'd let it *change*. You've always confused the two, darling."
> **SYCAMORE:** "He's been like this since university. Give him a sunset and he wants to nail it to the sky."
> *(They laugh. Lysandre does not. He notices the player and stands, courteous to a fault.)*
> **LYSANDRE:** "Forgive me. You have a trainer's hands. Tell me honestly: if there were not enough for everyone, and there is not, who would *you* have go without?"
> **PLAYER (choice):** ["Nobody."] → **LYSANDRE:** "Yes. I said that too, for twenty years. It is the most expensive word there is." / ["Me."] → *(He is silent for a moment.)* "…That is the only answer I have ever respected. Remember that I asked." `flare.x.guest = true`. / ["Whoever's hoarding."] → "Then we want the same thing, and differ only in where to begin."
> **SYCAMORE** *(after Lysandre has gone downstairs)*: "He's a good man. He gives away more than he keeps. He's just been tired lately." *(A pause.)* "For about six years."

### E5.3 *The Tall Man* (`xe.kalos.tall-man`) — Region

*Trigger: any route node at world state 2 or higher. A man twice the height of a man is sitting by the road, looking at a key in his palm.*

> **AZ:** "There was a Pokémon I loved. There was a war. She was sent, and she did not come back."
> **AZ:** "I built a machine to give her life again. It needed life to give. I took it from others. Many. I did not count. The stones at Geosenge are the count."
> **AZ:** "She woke, and saw what her life had cost, and she left me. I have been walking since. Someone has found my machine. I can feel it warming, the way an old wound knows the weather."
> **PLAYER (choice):** [Walk with him] → He joins the Siege Map; he reaches Geosenge two phases late, on foot. / [Ask for the key] → He gives it: **AZ's Key** opens one sealed door in Raid 3 or one petal's housing in Phase 6. / ["Was it worth it?"] → **AZ:** "I had her back for one hour. Ask me a question with only one answer."

### E5.4 *The Courier* (`xe.kalos.courier`) — Region

*Trigger: after any battle in which the player's Pokémon Mega Evolved, or at world state 3. A young man in a black coat is waiting at the next node, a device on his wrist ticking.*

> **ALAIN:** "You Mega Evolved back there. I need to battle you. It's not personal; I'm measuring something."
> *(Battle: Alain with **Ember-Black**. Win or lose, his device chimes.)*
> **ALAIN:** "Good reading. Thank you. Mr. Lysandre is building a system to protect people. It runs on this. Every strong battle I have is a little more protection for someone."
> *(A girl runs up behind him with a Chespin asleep in her arms. It has been asleep for a long time.)*
> **MAIRIN:** "Alain! Chespie twitched! I think. Maybe. Did you get enough yet? You said when you got enough he'd wake up."
> **ALAIN** *(not looking at her)*: "Nearly."
> **PLAYER (choice):** ["Protect people from what?"] → **ALAIN:** "From— he said from—" *(He stops. He has never asked.)* `flare.x.alain-doubt +1`. / ["Where does the energy go?"] → Intel +4, and `+1`. / [Say nothing; battle him again] → Another reading for Lysandre. The weapon's Phase 4 charge starts one step higher.

### E5.5 *Under Time* (`xe.kalos.under-time`) — Border

*Trigger: any rest node at world state 4. The Holo Caster turns itself on. It is the evening bulletin: Malva at her desk, mid-sentence. The picture tears. A different woman is sitting on the desk.*

> **VENUS:** "Good evening, Kalos, and good evening to our viewers *abroad*! This is *Under Time*, and I'm your Venus. Tonight: how to tell if your Pokémon truly loves you. Spoiler: it doesn't matter!"
> **MALVA** *(off-frame, icy)*: "This is my slot."
> **VENUS:** "It's *our* slot, darling. My people built the thing that makes yours go. Read your contract. It's in the part printed in red on red."
> *(To camera, sweetly:)*
> **VENUS:** "And a special hello to one little viewer who's been ruining my friends' work in four regions. I'd *love* to have you on the show."
> **PLAYER (choice):** [Trace the signal] → Intel +5; in Phase 3 her duel can be fought. / [Switch it off] → It switches itself back on at the next rest node. / [Call in] → *(She takes the call, live.)* **VENUS:** "Caller, you're on *Under Time*!" *(Whatever the player says is cut into a jingle and replayed for the rest of the region. Rep +3 with civilians, who liked it.)*

*Writes: `cipher.seen.venus`.*

### E5.6 *The Factory Floor* (`xe.kalos.factory`) — City

*Trigger: the Poké Ball Factory, before Raid 2. The conveyor is running. The workers are tied up in the canteen. Red suits are loading crates.*

> **CELOSIA:** "Every Poké Ball made in Kalos for a year. If nobody but us can catch a Pokémon, nobody but us will *have* one. It's not theft. It's *curation*."
> **BRYONY:** "She's been practising that all morning."
> *(Battle: Celosia and Bryony, a Double Battle. Trait: **Matched Set**: when both use moves of the same type in one turn, the second gains +20%; announced.)*
> **FACTORY PRESIDENT (freed):** "You've saved the line! Please, take one: this Master Ball, or this Big Nugget. Not both. I've a board to answer to."
> **PLAYER (choice):** [The Master Ball] / [The Big Nugget] / ["Give the other to your workers."] → He blinks, and does. Rep +5; every shop in Kalos stocks one extra Ball type.

### E5.7 *Essentia* (`xe.kalos.essentia`) — City

*Trigger: Lumiose at night, world state 2 or higher. A trainer in an alley is shouting at an empty Poké Ball. On the roof above, a figure in a visored suit, something struggling under her arm.*

> **ESSENTIA** *(filtered, flat)*: "Asset acquired. Returning to—" *(The filter drops for half a second.)* "—sorry, I'm sorry, I can't make it stop—" *(Flat again.)* "Returning to base."
> *(An Espurr on the alley wall watches her go with enormous eyes.)*
> **PLAYER (choice):** [Chase her] → *(A rooftop Convoy of two battles. She cannot be caught tonight. Win both: the stolen Pokémon is dropped.)* / [Follow the Espurr] → A basement office with a hand-painted sign: LOOKER BUREAU. A cot. A girl's jacket. A note in a child's hand: *Gone to do a job for the nice doctor. Back soon. Feed Mimi.* `flare.x.emma-known = true`; **Mimi** joins as an ally.
> **MIMI:** *(does not make a sound; sits on the jacket.)*

### E5.8 *Something in the Bag* (`xe.kalos.squishy`) — Street

*Trigger: any node after the first raid. The player's bag is heavier than it should be. Something green and soft is looking out of it.*

> *(It has one eye, hexagonal. It blinks. It does not seem to be a Pokémon the Pokédex knows.)*
> **PLAYER (choice):** [Feed it] → It eats one Berry, slowly, and goes back to sleep in the bag. `flare.x.squishy = fed`. / [Put it out] → It is in the bag again at the next node. / [Show it to Sycamore] → **SYCAMORE:** "*Mon dieu.* That's not a Pokémon. That's a *part* of one. Something that watches the balance of the land and wakes up only when it's very wrong. If it's awake, and it's chosen your bag—" *(He looks toward Geosenge.)* "—then I've been a worse friend than I thought."

*Squishy never fights for the player before the climax. It simply stays.*

---

## E6. Raids, Expanded

### E6.1 Raid 1 — "The Power Plant", deeper

**New phase order:** Yard → **The Masked Defenders** *(new)* → Turbine Hall → **Substation Thirteen** *(new)* → Switch Room.

**The Masked Defenders.** Two figures in domino masks drop from a gantry and strike a pose.

> **MASKED WOMAN:** "Halt, evildoers! We are—"
> **MASKED MAN:** "—two entirely anonymous defenders of Kalos!"
> **FLARE GRUNT:** "It's the Professor's assistants. Hi, Sina. Hi, Dexio."
> **SINA:** "…We are *not*."
> *(They hold the Yard. The player skips its second battle. If asked about the masks afterwards, Dexio says: "Nobody recognized us. It went really well.")*

**Substation Thirteen.** The cable that leaves the plant does not go to Lumiose. It goes south-west, underground, toward Geosenge. A Flare Scientist is sitting beside it with a meter and a sandwich.

> **FLARE SCIENTIST:** "Thirty percent of the region's power, down one cable, to a village with four hundred people in it. I asked what they needed it for. They said 'landscaping'."
> **PLAYER (choice):** [Cut the cable] → Lever bonus: the weapon's charge in Phase 4 starts one step lower. The Scientist finishes his sandwich and resigns. / [Follow it] → Intel +5: the player learns where the climax will be, one stage early, and the Last Rest gains a shop.

> **ALIANA (extended):** "I'm told I'm 'flat'. I'm *efficient*. Enthusiasm is wasted energy, and we're short of energy. That's the whole reason I'm standing in a power plant."
> **ALIANA (defeat, extended):** "Hm. That was inefficient of me."

### E6.2 Raid 2 — "Frost Cavern", deeper

**New phase order:** Mouth → Ice Hall → **The Elder** *(new)* → Dig Site → **The Cooling Loop** *(new)*.

**The Elder.** In the deepest hall an old Abomasnow is chained to the wall, and Flare's machines are drawing the cold out of it.

> **MABLE:** "Its energy keeps the weapon's core from melting. It's the single most useful Pokémon in Kalos. You'd think it would be *proud*."
> **MABLE (defeat, extended):** "Take it, then. We have the jewel. One refrigerant is as good as another."

Freed, **the Elder of the Cavern** (`sv.flare.cavern-elder`) offers the player a stone from its own shoulder: an **Abomasite**.

**The Cooling Loop.** Behind the dig, a pipe glows pink. Something small and bright is inside it, curled around a diamond that is being worn away a layer at a time.

> *(Battle: `ss.flare.rose-of-the-mine`, Tier 3. It fights with its eyes shut. Breaking the pipe housing with a Rock, Steel or Fighting move ends the battle and returns the Heart Diamond.)*
> **After:** it makes a new diamond, a very small one, and leaves it in the player's hand before it goes. *(Item: **Heart Shard**: once per run, a Pokémon about to faint keeps 1 HP.)*

### E6.3 Raid 3 — "Lysandre Labs", deeper

**New phase order:** The Café → **The Cells** *(new)* → Warp Halls → Data Core → **The Two Buttons** *(new)*.

**The Café.** Maître d' Corbeau is polishing a glass.

> **MAÎTRE D' CORBEAU:** "Downstairs is for members. I'm desolated. Might I offer you the terrace, which is for everyone else, and has a view of the end of the world?"
> *(Battle, or show a Membership Brochure and be bowed through.)*

**The Cells.** Three doors. Behind one, **Ancien Régime** (`ss.flare.ancien-regime`), a fossil king wired to the wall. Behind the second, a very tall man, sitting on the floor because the ceiling is too low to stand.

> **AZ:** "He asked me how it worked. I would not say. He has found out without me. He is a clever man. So was I."
> *(AZ's Key opens the third door, a shortcut past the Warp Halls. If the player already has the key, AZ is not here: he gave it away and walked on.)*

**The Two Buttons.** After Xerosic is beaten, he holds out a remote.

> **XEROSIC:** "A sporting proposition! One button, blue, shuts the weapon down. One button, red, activates it. Choose! Go on! I shan't tell you which is which, except that I just did."
> **PLAYER (choice):** [Blue] / [Red] / ["You'll press it yourself whatever I choose."]
> **XEROSIC** *(any answer)*: "Ha! Of course I will! It was never wired to the blue one. But I *did* want to see your face." *(He presses it.)*
> *(Choosing the third option gives Intel +5 and one line of respect: "Oh, you're no fun. You're* right*, but you're no fun.")*

This scene does not change the raid's result. It is why the climax is always scheduled.

### E6.4 Raid 4 — "The Gala at Parfum Palace" *(new)*

**Scale:** Region. **Offered:** world state 2 or higher, by an embossed invitation that arrives by Fletchling.
**Offer (the card):** *"Team Flare requests the pleasure of your company at an evening of fashion in aid of A Beautiful Future. Black tie, or red. Diantha will perform."*
**PR:** `pr.kalos.parfum-palace` — 4 areas: The Gates → The Hall of Mirrors → Backstage → The Garden Stage. **Security:** a dress code (the player is turned away without formal wear, a Brochure or a side entrance), members everywhere who will raise the alarm if a battle is seen, a hedge maze.
**Objectives:** *Primary:* take the membership ledger. *Secondary A:* free the Leading Lady. *Secondary B:* turn Valerie. *Secondary C:* unmask Essentia.

**Phases**

1. **The Gates.** Treasurer Garance is working the queue with a tablet.
   > **GARANCE:** "Name? …Oh, it's *you*. You're not on the list. But I do admire persistence. Tell you what: I'll look at my shoes for ten seconds."
2. **The Hall of Mirrors.** Members, champagne, complaints.
   > **MEMBER:** "Five million, and the canapés are *lukewarm*."
   > **MEMBER:** "I asked what the fund was for. He said 'the future'. One doesn't like to pry."
3. **Backstage.** Racks of red suits. Valerie is unpicking a seam with shaking hands.
   > **COUTURIÈRE VALERIE:** "I was told it was for an opera. Four hundred identical suits. I thought, how modern. I've just seen who is wearing them."
   > **PLAYER (choice):** ["Help me."] → She sews the player into a suit in forty seconds: the rest of the raid cannot be alarmed. `flare.x.valerie = turned`. / ["You must have known."] → **VALERIE:** "I knew they paid in advance. I did not ask a second question. That is a kind of knowing."
4. **The Garden Stage.** Diantha finishes her scene and bows. The lights go red. A visored figure steps out of the wings, and Diantha's Gardevoir walks to her as if called.
   > **DIANTHA** *(very quietly, into a silence of four hundred people)*: "That's my partner. She has never once missed a cue in fifteen years. *Who is giving her this one?*"
   > *(Battle: Essentia, with **the Leading Lady** (`ss.flare.leading-lady`), Tier 3, in the borrowed slot. If Diantha is beside the player she speaks a line from the play they first did together, and the Gardevoir turns its head: Corruption −40. With Mimi present, Essentia's visor flickers, and for one turn she does not attack.)*
   > **ESSENTIA (defeat):** "Unit withdrawing. —Mimi? Is that— *Unit withdrawing.*"

**Results (Lever: *The Ledger*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The ledger is yours; the Gardevoir is home; no alarm | **The list is public:** half the members stay home; one fewer Flare-keyed shelter means Phase 6's first pulse is weaker for everyone | −3 |
| **Success** | The ledger is yours | Phase 2 −1 battle (the donors' escort is gone) | −2 |
| **Partial** | Half the ledger | No change | −1 |
| **Failure** | You are escorted out by four members and a very polite Honchkrow | **Fully subscribed:** +1 Conduit in Phase 4 | +2 |
| **Declined** | The gala raises a record sum | Fully subscribed | +1 |

**Failure consequences:** **C2 (Fine / Shakedown), C8 (Reputation fall), C11.**

### E6.5 Raid 5 — "The Megalith" *(new)*

**Scale:** Region and Border. **Offered:** after `xe.kalos.courier` with `flare.x.alain-doubt` at 1 or more, or at world state 4.
**Offer (Mairin, alone, Chespie in her arms):** *"Alain's gone to a place with a giant rock and he wouldn't let me come. He never doesn't let me come. Please. He listens to people who battle."*
**PR:** `pr.kalos.megalith` — 4 areas: The Quarry Road → The Lifting Yard → The Energy Hall → The Rock. **Security:** haulage Pokémon that must be stopped without being hurt, energy arcs between pylons (a hit costs 1/8 HP), a rock that is very slowly moving.
**Objectives:** *Primary:* stop the megalith leaving. *Secondary A:* show Alain where the energy goes. *Secondary B:* free Z-2. *Secondary C:* defeat Venus.

**Phases**

1. **The Quarry Road.** A stone the size of a cathedral on a bed of rollers, and four hundred Flare Grunts pulling.
2. **The Lifting Yard.** Venus, in a director's chair, with a camera crew.
   > **VENUS:** "And *action*! Oh, it's the caller! Everyone, this is the caller. You're just in time: tonight we make a Shadow Pokémon live, out of something that isn't even *one* Pokémon. Ratings gold."
   > *(Battle. Trait: **Close-Up**: at the start of each turn she picks one of the player's Pokémon; it takes +20% damage that turn and deals +20% too; announced.)*
   > **VENUS (defeat):** "Cut. *Cut!* Burn that take. …No, give them the tape, I've got copies, I always have copies."

   *Reward:* **Data ROM X: "Siphon"**.
3. **The Energy Hall.** Every reading Alain ever took, in rows of glowing cells. One cable out, marked GEOSENGE. In the middle, in a tank, something red and coiled: **Z-2**.
   > **ALAIN:** "This is the system. This is what protects—" *(He reads the cable tag. He reads it again.)* "…Geosenge is a graveyard. Why does a shield need to be *aimed*?"
   > **LYSANDRE** *(by Holo Caster, gently)*: "Alain. You have done more for the future than anyone living. I had hoped to tell you myself, afterwards, when you could see how beautiful it was."
   > **ALAIN:** "The girl's Chespin. You said enough energy would wake it."
   > **LYSANDRE:** "I said it would no longer matter. You heard the kinder sentence. People do."
   > *(If `flare.x.alain-doubt` is 2 or more, Alain turns. Otherwise he must be battled first: Ember-Black fails to Mega Evolve on the second attempt. "Chosen Bond fails. Alain doubts.")*
4. **The Rock.** Z-2 (`ss.flare.z2`) is released into the megalith as its engine. Red vines the width of roads.
   > *(Battle: Tier 4. It cannot be worn down. Squishy climbs out of the player's bag, crosses the field in three turns if protected (it has 1 HP and the player must keep attacks off it), and touches the red coil. If Squishy was never fed, it takes five turns.)*
   > *(Green runs up the red like dye in water.)*

**Results (Lever: *The Megalith*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The rock stops; Z-2 is free; Alain has turned | **Order restored:** Squishy and Z-2 both stand at Geosenge; Phase 7 is not needed | −3 |
| **Success** | The rock stops | Alain holds a district; Z-2 remains bound | −2 |
| **Partial** | The rock is slowed | No change | −1 |
| **Failure** | The rock rolls on | **Charged:** the weapon's Phase 4 charge starts one step higher; Phase 7 is certain | +2 |
| **Declined** | The rock rolls on; Mairin waits at the quarry gate | Charged | +1 |

**Failure consequences:** **C4 (Strength surge), C10 (Shadowed), C11.**

---

## E7. The Climax — Extended Cut: "The Last Beautiful Day"

Checkpoints are after Phase 2 and at the Breather.

| # | Phase | Format | New or base | Battles |
| --- | --- | --- | --- | --- |
| 0 | Broadcast and Choice | — | base §10.1–10.3 | 0 |
| 0b | **Kalos on Every Screen** | Siege Map | new | 0 |
| 1 | **The Stones of Route 10** | Blackout | new | 2–3 |
| 2 | The Descent | Gauntlet | base Phase 1, extended | 4–6 |
| 3 | The Scientist and the Broadcaster | Duels and Front | base Phase 2, extended | 2–4 |
| — | **Breather** | Rest | new | 0 |
| 4 | The Conduits | Set piece | base Phase 3, extended | 2–4 |
| 5 | Lysandre | Boss | base Phase 4, extended | 1 |
| 6 | **The Flower Opens: The Battery** | Colossus | new | 1 |
| 7 | **The Rock Over Anistar** | Convoy | new, conditional | 2–3 |
| 8 | Resolution | — | base §10.9, extended | 0 |

### E7.1 Phase 0b — Kalos on Every Screen (Siege Map)

Lysandre's announcement plays on every Holo Caster in the region at once. Each city either listens or looks away.

| District | Held if… | If Lost |
| --- | --- | --- |
| **Lumiose** | Raid 1 Success or better (the lights are on), or Sycamore with Sina and Dexio | The Last Rest has no shop |
| **Laverre** | Valerie turned | Grunts in the climax carry accessories (+1 Couture Pokémon each) |
| **Shalour** | The player has Mega Evolved at least once this region | Mega Evolution takes a turn to trigger in Phase 2 |
| **Anistar** | Raid 5 Success or better | Phase 7 is certain |
| **Geosenge** | Never | See Phase 1 |

> **LYSANDRE** *(on every screen; the player's too)*: "People of Kalos. I have loved you. I want that understood. Because I have loved you, I can no longer watch you divide a shrinking world into smaller and uglier pieces. Team Flare will remain. I am sorry for the rest. It will be quick, and it will be the last ugly thing."
> **MEMBER** *(somewhere in the crowd at Geosenge, peevish)*: "He didn't mention the canapés."

### E7.2 Phase 1 — The Stones of Route 10 (Blackout)

A road between rows of standing stones. Each is a grave. They are glowing. **Condition — *The Draw*:** at the end of each turn every Pokémon on the field loses 1/16 HP, drawn into the stones. It ends at the village edge, or at once if **AZ's Key** is held ("The stones know the key. They let you by.").

> **FLARE GRUNT:** "Don't touch them. They're *hungry*. The Boss says they've been hungry for three thousand years and it's only polite to feed them."
> **AZ** *(if he walked with the player; he is waiting at the last stone, a hand flat against it)*: "This one was a Bisharp. I remember. I remember all of them. That is the part of living forever that nobody asks about."

### E7.3 Phase 2 — The Descent (extended)

| Level | Trainer | Notes |
| --- | --- | --- |
| Menhir circle | Flare Grunts ×2 | base |
| **The Lift Queue** | Members ×6 | Not a battle: a queue. A Brochure, a Flare Key or patience (2 turns of the Phase 4 charge) gets past |
| Surface | Flare Scientists ×2 | base |
| **Service Stair** | Aliana with **Gargoyle** | Only if she was not beaten in Raid 1 |
| Hall | Celosia with **Stiletto** | Trait: **Vanity** |
| Hall | Bryony | Trait: **Proud Strike** |
| HQ door | Mable | Trait: **Whiteout**; no hail if the Elder was freed |
| **The Vestibule** | Essentia | Borrowed slot; see below |

> **MEMBER (in the queue):** "I've been in line since four. For the *apocalypse*. You'd think one could book."
> **MEMBER:** "My wife didn't want to come. I said, darling, it's the event of the season. She said that was rather the problem."
> **ESSENTIA:** "Intruder. Engaging. *Please stop me.* Engaging."
> *(Battle. If `flare.x.emma-known` and Mimi is present, the player may use a turn to call her name. Three calls and the visor opens. "Mimi? …Why am I in a* suit*? Why is everything on fire?" She keeps the suit's strength for one more battle and uses it on the door.)*

### E7.4 Phase 3 — The Scientist and the Broadcaster (extended)

**Duel 1 — Xerosic** (base), with **Contrarian**. If Essentia was freed:

> **XEROSIC:** "You *woke* her? That suit was my life's work! She was the perfect operator: no ambition, no family, nobody to notice!"
> **EMMA** *(behind the player, visor up)*: "Mimi noticed."

**Duel 2 — Malva and Venus** *(extended; Front)*. Two broadcasters, one studio, both on air.

> **MALVA:** "This is Malva, live from Geosenge, with the only story that will ever matter again—"
> **VENUS:** "—and this is *Under Time*, live from the same place, with better lighting!"
> **MALVA:** "Get off my frequency."
> **VENUS:** "Make me, darling. On camera. I'd love the clip."
> *(Front: three lanes. Malva with **Prime Time**, Venus with **Close-Up**, and the two of them against each other. Whoever the player beats first goes off the air; the other gets the audience and +1 to all stats for her last Pokémon.)*
> **MALVA (defeat):** "…And that's all from me. This has been Malva. I believed every word. Goodnight, Kalos."
> **VENUS (defeat, if not beaten in Raid 5):** "Fine! *Fine.* It'll play better as a tragedy anyway."

**Duel 3 — Alain** *(conditional: only if he has not turned)*. He fights with his eyes down. He loses on purpose in the last turn and says nothing.

### E7.5 Breather

A store-room full of unsold red suits. Sycamore is sitting on a crate with his head in his hands.

> **SYCAMORE:** "He asked me, once, at that table: 'If you could save only some of them, would you?' I said, 'Lysandre, that's a question for a bad novel.' He laughed. I thought that was the end of it. …Here. Hold still. You're bleeding on the merchandise."

Heal 50%, revive one Pokémon, checkpoint.

### E7.6 Phase 4 — The Conduits (extended)

The base set piece (Conduits at the menhirs, rising weapon charge) with these additions.

- **The countdown.** Every Holo Caster in the room, the player's included, shows the same number. A Flare Key in the player's possession pauses the player's own for 2 turns, once.
- **Borrowed life.** Each Conduit is fed by one siphoned Pokémon unless it was freed: the Rose of the Mine, Ancien Régime, the Leading Lady. A fed Conduit has an extra shield.
- **Alain,** if turned, cuts one Conduit alone. **ALAIN:** "Every reading I gave him is in that wall. I'm taking them back."
- **Squishy** leaves the bag for the first time and sits on the central console. Nothing happens. The charge stops rising for one turn each time the player looks at it (once per battle, a free action).

**New PA lines** *(Lysandre, calm, as Conduits fall)*:

> "One. You are magnificent. I mean that. It is exactly the quality I am trying to preserve."
> "Two. Please stop. Not for my sake. Every one you cut is a little more that will have to burn."
> "Three. Then come down and say it to my face. You have earned the courtesy, and so have I."

### E7.7 Phase 5 — Lysandre (extended)

The base fight (§10.7) with **Sovereign** and **Pride**.

**New boss stage — *The Offer*** (after *The Weapon Pulses*, when his ace falls below 25% HP): Lysandre stops the battle for one turn and holds out a Flare Key. No attack is made by either side that turn (announced).

> **LYSANDRE (opening, extended):** "I had a house full of people once. I fed them. I paid their debts. They brought their cousins. I fed the cousins. One night I counted the plates and understood that I would run out before they did."
> **LYSANDRE:** "I am not angry at them. That is important. I am *tired* for them. Somebody has to decide, and everybody else is too kind."
> **LYSANDRE (The Offer):** "Take it. No fee. You and yours. Stand beside me and watch it be beautiful, and afterwards help me deserve it."
> **PLAYER (choice):** [Take it] *(only shown on the Stand-with route)* / [Refuse] / **["Who's holding the plate now?"]** *(only if `flare.x.guest`)*
> **LYSANDRE (if the last):** *(For the first time he has no answer ready.)* "…You said 'me'. At the café. I asked who should go without and you said 'me'." *(His hand closes on the key.)* "I have been asking that question for six years and you are the only one who ever—" *(He does not finish. Sovereign's next move is skipped.)*
> **LYSANDRE (defeat, extended):** "So. The world keeps all its hands." *(He looks up at the ceiling, which is opening.)* "Then let it see what they reach for."

### E7.8 Phase 6 — The Flower Opens: The Battery (Colossus)

*The ground of Geosenge folds back. A crystal flower as tall as a tower rises out of the village and turns its face to the sky. At its root, in a cocoon or a withered tree, something is asleep and being emptied.*

**Format.** **The Battery** (`ss.flare.battery`, XD009) is a Colossus. It does not wake and cannot be knocked out. It is fought through the flower's **three petals**, each a shield bar and a rule. Closing a petal needs its shield broken and one free action at its housing.

| Petal | While it is open | When it is closed |
| --- | --- | --- |
| **The Draw** | Every Pokémon on the field loses 1/16 HP a turn; Flare-keyed parties do not | The draw stops |
| **The Gift** | Borrowed Years is used every third turn (announced) | It is not used again |
| **The Aim** | The countdown runs | The countdown stops |

**Timer:** the countdown, 12 turns. **Adjustments:** AZ's Key closes one housing without the free action; AZ himself, if he has arrived, puts his hands on the Aim and holds it off the sky for three turns; Diantha, Alain, Emma and the rival (Help) each take one hit meant for the player; Squishy cancels the Draw for two turns.

> **AZ** *(his arms around a petal thicker than he is)*: "I built you to give one life back. I built you *badly*. Close."
> **LYSANDRE** *(on his knees at the console, quite calm)*: "It will fire. It has enough. It may not have enough for *them*, now. Only for here. …Ah. Only for here."
> *(He looks at the player.)*
> **LYSANDRE:** "Go. All of you. I mean it kindly. It is the last thing I have to give away."

**When the third petal closes:** the flower folds like a hand. The light goes back down into the thing at its root, and it stirs, and for a moment a whole valley is either in bloom or in shadow. Then it is gone, and where it slept there is only a tree, or a cocoon, quiet.

**If the countdown reaches zero:** the weapon fires. It does not have the charge to reach Kalos. It takes Geosenge. The climax is won if Lysandre was beaten, the village is not there afterwards, and XD009 enters the Region of Doom.

### E7.9 Phase 7 — The Rock Over Anistar (Convoy, conditional)

*Happens if Z-2 is still bound.* The megalith has been moving all this time. It is drawn to the great Sundial at Anistar, and if it touches it, the result is the weapon's blast by another road.

**Format:** a Convoy of three battles along the rock's path (two if Alain has turned): the red vines, Xerosic or a Flare Scientist riding the control rig, then Z-2 itself.

> **XEROSIC** *(on the rig, delighted)*: "He wanted a flower! *I* wanted a comet! Both of us are artists; mine is merely *moving*!"
> *(At the rock: Squishy leaves the bag. Protect it for three turns, as in Raid 5. When green meets red, they do not separate. They stand up together, vast, in a shape the Pokédex has no page for, and put one hand flat against the megalith. It stops.)*

### E7.10 Phase 8 — Resolution (extended)

The Weapon choice (base §10.9) with these additions.

- **Lysandre.** If the countdown did not reach zero, he is in the rubble of the chamber. [Pull him out] → He lives, in Sycamore's custody. **SYCAMORE:** "I'm going to sit across a table from you every day until one of us understands the other. I've booked the corner." / [Leave him] → The chamber seals. A year later the café reopens under new management; one table is never let.
- **AZ.** If he reached Geosenge and the weapon was not sealed with him inside, a small Pokémon with a black flower floats down out of the evening. He does not say anything. He is too tall to kneel easily. He manages. *(If the player chooses, `sv.flare.eternal-flower` may travel with them for the rest of the run; AZ nods. "She has walked with me for one hour and three thousand years. She may walk where she likes.")*
- **The list.** If the player holds the ledger: [Publish it] (members are known; reputation +15; several of them sue) / [Burn it] / [Send each member a bill for the damage] (the Aftermath gains one extra shop, funded involuntarily).
- **The Holo Casters.** [Leave them on] / [Have Sycamore switch off the tracking] (Flare remnants cannot ambush the player in Kalos again).

### E7.11 Rival and Stand-with additions

- **Help:** the rival closes a petal. *Line:* "It's a flower. I'm fighting a *flower*. Don't tell anyone how hard this is."
- **Beat-you:** the rival is found in the Lift Queue, in a stolen red suit, stuck behind six members and too polite to push.
- **Side-with:** the rival is **Admin "Amaryllis"**. They paid nothing; Lysandre waived the fee. A successful Turn has them hand their Flare Key to a member's child in the queue.
- **Stand with them:** the player is **the Guest of Honor**. At *The Offer* the option [Take it] is real. See `scripts/10_STAND_WITH_THEM.md` §6; the new line is Lysandre's: "I charged them all. I could not bring myself to charge you. I have wondered since whether that makes me a hypocrite or merely a host."

---

## E8. Aftermath and the Thread

- **The boutique** has a new sign: ALL WELCOME. The clerk is still there. So is the suit they could not afford, in the window, marked down.
- **Emma** runs the Looker Bureau. Mimi sits on the desk. The Expansion Suit is in a locked cupboard and she has thrown the key in the river, and then fished it out, in case.
- **Alain and Mairin:** the Chespin wakes on a Tuesday, for no reason anyone can measure. Alain's device does not chime. He takes it off.
- **Malva** goes back on air. She reads the news straight. It is the hardest thing she has done.
- **Valerie** unpicks four hundred suits and makes them into quilts for Geosenge.

**The Thread (`docs/GRAND_ARC.md`).** **Data ROM X: "Siphon"** shows where a Pokémon's will goes when it is taken: it does not vanish, it is *stored*. Cipher has been storing it for years. Venus's tapes are in the same crate as the ROM. They are labelled by episode, and the last label is blank except for one word: *Lugia*.

> **VENUS (outtake, at the end of the last tape):** "Eldes, you sanctimonious old stick, if you're watching this in your nice white lab on your nice white island: we have the siphon *and* the footage. Tell your mother-of-the-year she can have her monster. Kiss kiss."

---

## E9. Dialogue Bank

### E9.1 New ambush lines

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Recruiter (Smooth) | "You've a wonderful look. Wasted, out here. Shall we discuss your future, or shall I rearrange it?" | "I'll put you down as 'thinking it over'." |
| Grunt — Stylist (Appalled) | "*That* outfit, in *this* city. I'm doing you a kindness." | "…It's actually rather practical." |
| Grunt — Stone Feeder (Uneasy) | "The stones are hungry. Better your Pokémon than mine." | "I'm not feeding them mine. I've decided." |
| Grunt — Usher (Clipped) | "Members only beyond this point. Are you a member? You don't *walk* like a member." | "Walk on, then." |
| Specialist — Flare Scientist (Smug) | "Mega energy, bottled. Watch what a teaspoon does." | "I may have used a tablespoon." |
| Lieutenant — Maître d' Corbeau (Impeccable) | "I regret that your table is unavailable. Permanently." | "Do come again. I shall be elsewhere." |
| Lieutenant — Treasurer Garance (Warm) | "You're in arrears, sweetheart. Five million and counting." | "I'll waive the late fee." |
| Commander — Essentia (Filtered) | "Target confirmed. *Run.* Engaging." | "Withdrawing. *Thank you.* Withdrawing." |
| Commander — Alain (Serious) | "I need the data. I'm sorry. It's for something good." | "Good reading. …It *is* for something good. He said." |
| Commander — Celosia and Bryony (Matched) | "Shall we?" / "After you." / "No, after *you*." | "You went first." / "*You* went first." |
| Second — Malva (Theatrical) | "This is Malva, and this is breaking news: you." | "We'll return after this defeat." |
| Liaison — Venus (Honeyed) | "Smile, darling! You're on *Under Time*!" | "Cut! Somebody cut! Why is nobody cutting?" |

### E9.2 Lysandre's barks

| Moment | Line |
| --- | --- |
| Player lands a super-effective hit | "Beautiful. Do you see? *That* is what I would keep." |
| Player's Pokémon faints | "I am sorry. Truly. I am always sorry. It has never once stopped me." |
| His Pokémon faints | "You gave everything. That is all I ever asked of anyone." |
| Player heals | "Generous. And when the medicine runs out? It always runs out." |
| A Shadow Pokémon disobeys the player | "You hold a life that was taken from someone, and you call *me* the thief." |
| Last Pokémon each | "One each. At last, an even division." |

### E9.3 Holo Caster interruptions (by world state)

| Step | Broadcast |
| --- | --- |
| 1 | **MALVA:** "Lysandre Labs today announced a free Holo Caster for every household. Isn't that generous? Isn't *he*?" |
| 2 | **MALVA:** "Engineers blame the blackout on 'unexpected demand'. Stay indoors. Stay beautiful." |
| 3 | **MALVA:** "Team Flare members are reminded to carry their keys at all times. Non-members are reminded." *(A pause.)* "That's the bulletin." |
| 4 | **VENUS:** "And on *Under Time*: is your neighbor on the list? Text us! We'll read out the best ones!" |
| 5 | **LYSANDRE:** "This is not a threat. I am telling you so that you may spend today as you would wish to have spent it." |

### E9.4 Civilians by world state

| Step | Line A | Line B |
| --- | --- | --- |
| 1 | "The shop wouldn't let me in. Then a lady in red said *she* would. Flattering, really." | "Five million! For a suit! …What do you suppose it comes with?" |
| 2 | "Half the avenue's dark. The half with the cheap flats, you'll notice." | "Something's been taking Pokémon at night. It left a note on mine's bed. It said 'sorry'." |
| 3 | "The nurse saw his red jacket and took him first. I'd been waiting an hour." | "My brother joined. He says he can't tell me why I should, only that I *should*." |
| 4 | "I've stopped answering my Holo Caster. It answers itself." | "They read our street out on that programme. We're not on the list. They laughed." |
| 5 | "We're going to the coast. If it's the last day, I want to see the sea, not a countdown." | "…" *(They are wearing red. They will not meet your eye.)* |

### E9.5 Announcer lines for special Pokémon

| Pokémon | On entry |
| --- | --- |
| Any Couture Pokémon | "It wears its accessory: …" |
| Sovereign | "Sovereign rises. Not a scale out of place." |
| Ember-Black | "Ember-Black answers before it is called." |
| Mimi | "Mimi is watching the one in the suit." |
| Squishy | "Squishy is here. One thing at a time, the field decides." |
| The Leading Lady | "The shadow tightens. She has missed her cue." |
| The Battery | "The light dims around it." |

---

## E10. Flags and Wiring

| Flag | Set by | Read by |
| --- | --- | --- |
| `flare.x.guest-list` (0–5) | Raids, climax schedule | Regional rules, broadcasts, civilians |
| `flare.x.member` | *Not Stylish Enough* | Centers, Phase 4, Phase 6 |
| `flare.x.guest` | *The Corner Table* | Phase 5 |
| `flare.x.alain-doubt` (0–3) | *The Courier*, Raid 5 | Raid 5, Phase 3, Phase 4 |
| `flare.x.emma-known` | *Essentia* | Raid 4, Phase 2 |
| `flare.x.squishy` (`fed`) | *Something in the Bag* | Raid 5, Phase 7 |
| `flare.x.valerie` (`turned`) | Raid 4 | Siege Map, Aftermath |
| `flare.x.weapon` (`closed` / `fired`) | Phase 6 | Aftermath, Region of Doom |
| `cipher.seen.venus`, `cipher.rom.x` | *Under Time*, Raid 5 or Phase 3 | `docs/GRAND_ARC.md` |

**Counts for this file:** 12 named characters (4 new officers and allies, 8 team versions and allies), 11 special Pokémon, 5 special Shadow Pokémon (1 Apex), 8 story events, 3 deepened raids and 2 new raids, an 8-phase Extended Cut, and 5 dialogue tables.
