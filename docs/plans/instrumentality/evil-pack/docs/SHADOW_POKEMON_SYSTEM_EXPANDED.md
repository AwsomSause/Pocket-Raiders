# SHADOW POKÉMON SYSTEM — EXPANDED EDITION

**Extends:** `docs/SHADOW_POKEMON_SYSTEM.md` (every rule there still holds; this file adds to it)
**Read with:** `docs/EXPANSION_DESIGN.md`, `docs/GRAND_ARC.md`, `docs/SPECIAL_VARIANTS_AND_SHADOWS.md`
*All names, moves and mechanics here are original to this project. Values are launch defaults for tuning, not tested balance.*

---

## X1. What this file adds

The base document defines a Shadow Pokémon: Corruption, four tiers, a Surge meter, 14 moves, 20 abilities and 7 ways to purify. The Expanded Edition scripts then introduced things the base rules never had to cover: **58 named Shadows with their own keys, 12 Apex Shadows fought as multi-part bosses, a second Snag Machine, a room full of stored wills, and a crowd that can chant a Pokémon small again.** This file gives those things rules.

| Section | Adds |
| --- | --- |
| X2 | Auras: what a Shadow looks and sounds like, by team |
| X3 | Tier behavior in depth, with a worked battle |
| X4 | 16 more Shadow moves (30 in all) |
| X5 | 16 more Shadow abilities (36 in all) |
| X6 | 6 more purification methods (13 in all) |
| X7 | A catalog of 24 Heart Scars |
| X8 | Classes of Shadow and the key system |
| X9 | Apex Shadows and the Colossus format |
| X10 | Variant lines and Shadow states together |
| X11 | The two Snag Machines |
| X12 | The Reservoir: stored wills |
| X13 | Reclaim: when the binder wants it back |
| X14 | Every battle notice, in one table |
| X15 | Tuning levers and tests |

---

## X2. Auras

A Shadow state must be readable (base §1, goal 2). Each team's method leaves a different mark. The aura is drawn around the Pokémon in battle and on its party icon. Rui, and any player who has met her, also sees it in the overworld.

| Team | Method | Aura color | Shape | Sound cue on entry |
| --- | --- | --- | --- | --- |
| Team Rocket | Capture Rig | Dull red | A thin band at the neck, pulsing | A short radio click |
| Rocket Returns | Radio Wave Lock | Red, flickering | Concentric rings, like a broadcast | A bar of static |
| Team Aqua | Orb Resonance | Deep blue | A slow tide line rising and falling across the body | A wave drawing back |
| Team Magma | Orb Resonance | Ember orange | Heat shimmer from the ground up | A low crackle |
| Team Galactic | Red Chain Lock | Crimson | A single taut line leading off-screen | One link of chain, struck |
| Team Plasma | Liberation Lock | White-blue | An open ring that never closes | A signal tone, held |
| Team Flare | Life-Force Siphon | Pale gold, draining to grey | Threads streaming away from the body | A long exhale |
| Team Skull | Stolen Bond | Purple | A scrawled tag that redraws itself | A two-note whistle |
| Aether Foundation | Conservation Hold | Frost white | A still glass outline | A soft seal closing |
| Macro Cosmos | Dynamax Overload | Magenta | Storm cloud over the head; the body is oversized | A stadium horn, distorted |
| Team Yell | Cheer Chant | None | None: Yell binds nothing | The crowd, and only the crowd |
| Team Star | Star Barrage Link | Shifting Tera colors | A crystal crown that does not match the Pokémon's type | An engine turning over |
| Rocket Remnants | Gadget Snare | None lasting | A net or a puff of smoke, for one turn | *Sproing* |
| Team Snag'em | Snag Machine | Violet-black | Smoke that clings | A heavy mechanical lock |
| Cipher | All of them | Violet-black with a second color underneath | Smoke over whichever shape the original method left | Two cues, overlapping |

**Depth of color shows the tier.** Veiled is a tint. Bound is a clear outline. Gripped fills the outline. Fallen spills past it.

**Stabilized Pokémon** (base §12.4) keep their aura, drawn with a steady edge that does not pulse.

**Accessibility.** Every aura has a shape as well as a color, and the tier is also written on the status plate ("Shadow II"). No information is carried by color alone.

---

## X3. Tier behavior in depth

### X3.1 What each tier does, turn by turn

| | Veiled (1) | Bound (2) | Gripped (3) | Fallen (4) |
| --- | --- | --- | --- | --- |
| Damage bonus | +5% | +10% | +15% | +20% |
| Drawback | None | None | −10% accuracy on non-Shadow moves | −15% to both defenses |
| Surge meter | No | Yes | Yes | Yes |
| Shadow moves known | None | Up to 2 | Up to 3 | Up to 4 |
| Chance to replace your command | 0% | 0% | 15% per turn | 25% per turn (10% if Stabilized) |
| What it does instead | — | — | A Shadow move of its choosing | Any move of its choosing, at any target, including a switch it refuses |
| Hesitation (loses the turn) | 5% | 0% | 0% | 0% |
| Chemistry bonuses | Kept | Kept | Suspended unless Stabilized | Suspended unless Stabilized |
| Can be a Mentor's charge | Yes | Yes | Yes | Yes |
| Counts against the two-slot limit | No | No | Yes | Yes |

**Veiled hesitation** is the one quirk of the lowest tier: the Pokémon is nearly itself and sometimes stops, as if it had heard its name. The notice reads "It hesitates." It is not disobedience and does not use the fairness check.

### X3.2 Corruption during a battle

| Event | Corruption |
| --- | --- |
| Uses a Shadow move | + the move's cost (halved with Overbound) |
| Surges | +2 on top of the move's cost |
| Knocks out a foe with a Shadow move | +1 |
| Faints | +3 |
| Lands the finishing blow with a non-Shadow move (Heart Bond) | −10 |
| Takes part without fainting (Heart Bond) | −5 at the end of the battle |
| Each turn on the field beside its Mentor | −2 |
| Its Mentor faints | +10, once |
| A key condition is met (X8) | Set to 0 |

Tier is recalculated at the end of the turn, never mid-turn. A Pokémon that crosses into Fallen during a battle does not start refusing commands until the next turn begins.

### X3.3 A worked battle

A player's **Gripped** Houndoom (Corruption 60, Surge 40, ability Lurker) leads against a Lieutenant.

| Turn | What the player orders | What happens | Corruption | Surge |
| --- | --- | --- | --- | --- |
| 1 | Flamethrower | Obeys. Lurker adds 25% to the first attack. | 60 | 48 |
| 2 | Flamethrower | "The shadow tightens." The game shows that Flamethrower will be replaced by Umbral Rush. It is. | 63 | 56 |
| 3 | Hold | The Surge meter pauses for 2 turns. Hold is now spent for this battle. | 63 | 56 |
| 4 | Crunch | Obeys. The foe lands a super-effective hit; the meter is paused and does not gain. | 63 | 56 |
| 5 | Crunch | Obeys. The pause ends at the end of this turn. | 63 | 64 |
| 6 | Switch out | Obeys (a Gripped Pokémon cannot refuse a switch; a Fallen one can). | 63 | 64 |
| End | — | It took part and did not faint: Heart Bond applies. | 58 | — |

The player lost one command in six, saw it coming, and ended the battle 2 Corruption lower than they began. That is the intended feel of the third tier: usable, and on a leash.

### X3.4 Shadow Pokémon on the other side

When the *foe* fields a Shadow Pokémon the same rules apply in mirror: it may ignore its own trainer. An enemy Shadow that disobeys gets the same on-screen notice, one turn ahead. A foe's Fallen Pokémon attacking its own partner in a Double Battle is not a bug. It is the clearest lesson the system teaches.

---

## X4. Sixteen more Shadow moves

Numbered on from the base list. As before, damage is typeless and uses the Pokémon's best-matching type for effectiveness.

| # | Move | Power | Effect | Cost | Unlocks at |
| --- | --- | --- | --- | --- | --- |
| 15 | **Grave Lantern** | — | Marks the user: the next ally sent in after it faints enters with +1 Attack and +1 Special Attack | +2 | Tier 2 |
| 16 | **Hush Fall** | 60 | Sound-based moves fail for both sides for 2 turns | +2 | Tier 2 |
| 17 | **Borrowed Breath** | — | Heals 25% of max HP | +5 | Tier 2 |
| 18 | **Tether Snap** | 70 | Forces the target to switch out; fails against a Pokémon that cannot be forced | +3 | Tier 2 |
| 19 | **Ashen Vow** | — | +2 Attack, −1 Defense | +3 | Tier 2 |
| 20 | **Mirror Wound** | — | Until its next turn, returns 30% of the damage it takes | +2 | Tier 2 |
| 21 | **Frayed Bond** | 75 | For 3 turns the target gets no benefit from bond or friendship effects (no endured hits, no shaken-off status) | +4 | Tier 3 |
| 22 | **Undertow Grip** | 65 | Traps the target for 3 turns; it loses 1/16 HP each turn | +3 | Tier 3 |
| 23 | **Coldfire** | 85 | Counts as both Fire and Ice for effectiveness; cannot burn or freeze | +4 | Tier 3 |
| 24 | **Rust Psalm** | 70 | −1 Defense on the target; −2 if the target is Steel | +3 | Tier 3 |
| 25 | **Starless Dive** | 100 | Two turns: the user vanishes, then strikes. It cannot be hit while gone | +4 | Tier 3 |
| 26 | **Wither Touch** | 60 | Healing on the target is halved for 3 turns | +3 | Tier 3 |
| 27 | **Echo Cage** | — | The target must repeat its last move on its next turn | +3 | Tier 4 |
| 28 | **Still Air** | — | Removes weather, terrain and room effects | +3 | Tier 4 |
| 29 | **Threadbare** | — | +2 Speed, −1 to both defenses | +4 | Tier 4 |
| 30 | **Eclipse Choir** | 90 | Hits all foes; every Shadow Pokémon on the user's side gains +20 Surge | +6 | Tier 4 |

**Signature Shadow moves.** The twelve Apex Shadows each have one more move that no other Pokémon can learn: Mind Vault, Yesterday's Thorn, Drowned Sky, Scorched Dawn, Stopped Clock, Folded Distance, Empty Crown, Borrowed Years, Keepsake, Red Star, Starfall Barrage and Storm Without a Song. Their rules are in the scripts and in the compendium. All twelve are announced one turn ahead.

**Move pools by method.** A Shadow Pokémon draws its moves from its method's pool: the base table's moves plus these.

| Method | Adds from this list |
| --- | --- |
| Capture Rig, Gadget Snare | Tether Snap, Echo Cage |
| Radio Wave Lock | Hush Fall, Eclipse Choir |
| Orb Resonance (Aqua) | Undertow Grip, Still Air |
| Orb Resonance (Magma) | Coldfire, Ashen Vow |
| Red Chain Lock | Frayed Bond, Echo Cage |
| Liberation Lock | Frayed Bond, Borrowed Breath |
| Life-Force Siphon | Wither Touch, Borrowed Breath |
| Stolen Bond | Tether Snap, Threadbare |
| Conservation Hold | Mirror Wound, Still Air |
| Dynamax Overload | Eclipse Choir, Ashen Vow |
| Star Barrage Link | Starless Dive, Threadbare |
| Snag Machine | Rust Psalm, Grave Lantern |
| Cipher | Any |

---

## X5. Sixteen more Shadow abilities

| # | Ability | Effect |
| --- | --- | --- |
| 21 | **Bitter Root** | Heals 1/16 HP whenever it ignores a command |
| 22 | **Cold Ledger** | Stat boosts it copies or steals last 2 extra turns |
| 23 | **Hollow Crown** | Its stats cannot be lowered while it is above half HP |
| 24 | **Night Shift** | +1 Speed on entry at night nodes and under dark conditions |
| 25 | **Tin Ear** | Immune to sound-based moves; Crowd Chant works on it at half strength |
| 26 | **Wrong Season** | Weather never boosts a move that targets it |
| 27 | **Iron Will, Glass Jaw** | Cannot flinch, be confused or be put to sleep; takes 10% more damage |
| 28 | **Quartermaster** | If it holds nothing, it takes the first item knocked off or dropped by a foe |
| 29 | **Second Shift** | The first time it faints in a battle, the next Shadow ally enters with Surge at 50 |
| 30 | **Handler's Whistle** | Never disobeys while the one who bound it is its trainer; for the player, never disobeys while its Mentor is in the party |
| 31 | **Scar Tissue** | Each repeat hit from the same move type does 10% less (to a floor of −30%) |
| 32 | **Slow Thaw** | Cannot act on its first turn out; from then on +1 Defense and +1 Special Defense |
| 33 | **Toll Gate** | A foe that switches in while it is active loses 1/16 HP, once per foe |
| 34 | **Borrowed Name** | The first status move aimed at it each battle fails |
| 35 | **Last Word** | If it is knocked out by a contact move, the attacker's last move is disabled for 2 turns |
| 36 | **Unfinished** | Counts as one tier lower for obedience checks; one tier higher for Shadow move costs |

**Ability pools by method** (added to the base table's three per team):

| Method | Adds |
| --- | --- |
| Capture Rig | Handler's Whistle |
| Radio Wave Lock | Tin Ear |
| Orb Resonance (Aqua) | Wrong Season |
| Orb Resonance (Magma) | Scar Tissue |
| Red Chain Lock | Hollow Crown |
| Liberation Lock | Borrowed Name |
| Life-Force Siphon | Quartermaster |
| Stolen Bond | Toll Gate |
| Conservation Hold | Slow Thaw |
| Dynamax Overload | Iron Will, Glass Jaw |
| Star Barrage Link | Unfinished |
| Gadget Snare | Last Word |
| Snag Machine | Second Shift |
| Cipher | Cold Ledger, Night Shift, Bitter Root |

The Echo rule is unchanged: after purification a Pokémon may keep one Shadow ability as an **Echo**, one per run.

---

## X6. Six more ways to purify

Numbered on from the base list's seven.

| # | Method | How it works | Limits |
| --- | --- | --- | --- |
| 8 | **Purify Chamber** | At a rest node, place the Shadow Pokémon in the Chamber with up to four Clear party members. −30 Corruption. If those four form a **cycle** (each has a type advantage over the next, and the last over the first) the drop is −45 | Needs Professor Krane (roaming script 00x, Raid 6). Once per rest node. Works on Tier 4 |
| 9 | **Crowd Chant** | A crowd that knows the Pokémon's name says it, in time. −15 per chant | Learned in Galar (*The Gig*). Once per battle; needs a crowd (a stadium, a town node, Team Yell in the stands). Half strength against Tin Ear |
| 10 | **Keyed Purification** | A named Shadow has a **key**: a person, a place, an object or an act. Meeting the key sets Corruption to 0 at once | Only for the 58 special Shadows (X8). Cannot be forced; the key must be real |
| 11 | **Reservoir Return** | At the finale, opening a region's bank of tanks returns the stored wills of that region's Shadows. Every Shadow from that region in the party drops one tier; with that region's ROM earned in its region, to 0 | Finale only. A Stabilized Pokémon is asked first |
| 12 | **The Long Walk** | Keep the Shadow Pokémon in the first party slot between nodes. −3 Corruption per node travelled without it fainting | Stacks with Heart Bond. Lost for a node if it faints |
| 13 | **Shared Table** | At a rest node with a meal (a camp, a picnic, a kitchen), the Shadow Pokémon eats beside one Clear Pokémon whose bond is Friendly or better. −8 | Once per rest node; +4 if a chemistry partner is at the table |

**Which methods reach which tier**

| Tier | Methods that work |
| --- | --- |
| Veiled, Bound | All |
| Gripped | All |
| Fallen | Calming Rite, Mentor Bind, Site Cleansing, Team Reversal, Choose to Release, Purify Chamber, Crowd Chant, Keyed Purification, Reservoir Return, The Long Walk. *Not* Heart Bond (base rule: Tier 3 or lower), Rival's Word or Shared Table: a Fallen Pokémon will not sit at a table yet |

**Purification is still never required** (base §10 rule 4) and never a dead end. Every tier has at least four methods open at any rest node.

---

## X7. Heart Scars

A Pokémon that has been purified keeps a small mark of it: a **Heart Scar**. The base document names three. Here are twenty-four. A Pokémon may hold two. Which scar it earns depends on *how* it was freed.

| Scar | Effect | Usually earned by |
| --- | --- | --- |
| **Steadfast** | +3% Defense | Heart Bond |
| **Wary** | +3% evasion | Choose to Release, then rejoining |
| **Soft-hearted** | Healing items work 10% better on it | Calming Rite |
| **Kept Promise** | Bond with its trainer grows 10% faster | Mentor Bind |
| **Listener** | Takes 10% less from sound-based moves | Crowd Chant |
| **Homeward** | +5% Speed in the region where it was freed | Keyed Purification by a place |
| **Named** | A Snag Machine cannot lock onto it | Keyed Purification by a person |
| **Unbought** | Immune to effects that turn a Pokémon against its trainer for a turn | Team Reversal |
| **Second Wind** | Once per battle, heals 5% when it first drops below half HP | The Long Walk |
| **Unafraid of the Dark** | No accuracy loss at night or under dark conditions | Site Cleansing |
| **Light Sleeper** | Sleep lasts one turn fewer | Shared Table |
| **Even Keel** | The first stat drop it suffers each battle is reduced by one stage | Purify Chamber |
| **In Tempo** | +3% damage on the turn after an ally acts | Purify Chamber with a full cycle |
| **Weathered** | No damage from weather | Purified under any weather condition |
| **Warm** | Burn damage halved; thaws in one turn | Purified at a campfire node |
| **Clear-eyed** | Its accuracy cannot be lowered | Rival's Word |
| **Found** | Never chosen by an Impound (consequence C1) | Returned from Impound, then purified |
| **Patient** | Its protective move has +1 priority once per battle | Purified by waiting (a key that is an act of patience) |
| **Sky-minded** | +3% accuracy in outdoor battles | Freed outdoors, after captivity indoors |
| **Choir-born** | In a Double Battle, healing moves aimed at its partner heal 10% more | Reservoir Return |
| **Unmasked** | The first hit it takes each battle cannot be a critical hit | A key that removed a device (a helmet, a harness, a chain) |
| **Tide-turned** | +5% damage while its trainer has fewer Pokémon left than the foe | Purified during a climax |
| **Well-fed** | Berries it eats restore 10% more | Shared Table with a chemistry partner |
| **Remembered** | If its trainer loses a run, it is listed first on the Memorial Wall and leaves a gift there | Any method, if its Corruption was ever 100 |

**Rules.** A scar is always a small positive (never more than about 5% of anything). The third scar offered is refused with a message, as the base test list says, unless the player chooses to replace one. Scars are shown on the summary screen with the name of the place and the method.

---

## X8. Classes of Shadow and the key system

### X8.1 Four classes

| Class | How many | Captured? | How it is purified | Example |
| --- | --- | --- | --- | --- |
| **Common** | Unlimited | Yes | Any method open to its tier | A wild Shadow near an awake team; a stolen party member returned bound |
| **Named** | 44 | Some (the script says which) | Its **key** sets it to 0; ordinary methods still lower it | Amberjack, The Leading Lady, Rent Money |
| **Story-bound** | 2 | No | Only the scene written for it | Marrowmother, Silver |
| **Apex** | 12 | No | Only the Colossus fight and its story choice (X9) | XD002 M2, XD009 The Battery |

Named, Story-bound and Apex Shadows together are the **58 special Shadows** in `docs/SPECIAL_VARIANTS_AND_SHADOWS.md`.

### X8.2 What a key is

A key is the thing the binding could not account for. Cipher's methods (see `GRAND_ARC.md` §2) all work the same way: they lock a Pokémon's will behind one command. A key is something older than the command.

| Key type | The Pokémon needs | Heart Scar it tends to leave | Count |
| --- | --- | --- | --- |
| **Person** | To hear or be touched by someone specific | Named | 9 |
| **Place** | To be taken somewhere | Homeward | 14 |
| **Object** | Something returned, opened or broken | Unmasked | 13 |
| **Act** | The player to do something in a particular way | Patient | 8 |
| **Story** | The scene itself | Set by the scene | 2, and the 12 Apex |

### X8.3 Key index

| Type | Named Shadow | Key, in short |
| --- | --- | --- |
| Person | Matron | Her child, returned from the poachers' truck |
| Person | Ebb, Kindle | Each other, on Southern Island |
| Person | The Leading Lady | Diantha, saying the line they rehearsed |
| Person | Z-2 | Squishy must reach it |
| Person | The Guardian in Glass | The island calls it: the kahuna and three people the player helped |
| Person | Lighthouse | A crowd using its old ferry name |
| Person | The Old Shift | Peony's voice |
| Person | Overlooked | One honest sentence from its trainer |
| Place | Amberjack | One battle won outdoors, leading |
| Place | Shellshock | The Pewter Museum registers its fossil |
| Place | The Black Fog | Site Cleansing at Pokémon Tower, and nowhere else |
| Place | Rage Signal | The Lake shore, for one rest node, after the transmitter is gone |
| Place | Low Tide | Any coast at high tide, in clear weather |
| Place | Fault Line | Its vent sealed, then a tree planted on its mountain |
| Place | Unknowing, Unfeeling, Unwilling | Lakes Acuity, Verity and Valor |
| Place | The Second Sun | Daylight, outside the Relic Castle |
| Place | Old Guard | Opelucid, thawed |
| Place | Rent Money | Its own trial site |
| Place | Tall Tale | The Pelago |
| Place | The Time Capsule | Site Cleansing only; it does not belong to this age |
| Object | Whiteout, Blackout Wing, Burnout | Their three tanks in the Reservoir |
| Object | Thunder Under Glass, Ash Crown, North Wind | The Miracle Crystal, shattered |
| Object | Slag Heart | The Magma Stone, put back |
| Object | The Long Night | A Lunar Wing, carried to Canalave |
| Object | The Rose of the Mine | Its Heart Diamond, out of the cooling loop |
| Object | Ancien Régime | The conduit that feeds on it, opened |
| Object | The Sword That Slept, The Shield That Slept | The rusted sword; the rusted shield |
| Object | The First Engine | Three parts, and Ortega's hands |
| Act | First Snag | Anything: it exists to teach purification |
| Act | The Gift | Heart Bond only: it has to be walked with |
| Act | Kingmaker | Beat Evice with the mask off |
| Act | Encore, Please | Beat it in time with the music |
| Act | The Captive Star | Open the door, then step out of the way |
| Act | Oathbreaker | Win without one of your Pokémon fainting |
| Act | Null Three | Break the helmet with trust, not force |
| Act | The Tablets of Grudge | Read the deleted reports aloud at its shrine |
| Story | Marrowmother | The orphan Cubone, at the top of the Tower |
| Story | Silver | Returned to its parent in the storm |

### X8.4 Key rules

1. **Three hints, always.** Every key is hinted three times before it matters: once by the one who bound the Pokémon (usually a boast), once by an ally or a civilian, and once on the Pokémon's summary screen, where the purification ring shows a small symbol for the key type.
2. **Keys cannot be forced.** No item substitutes for a key. A key that is a person requires that person to be alive to the story, present and willing.
3. **Keys can be missed, and that is never a dead end.** If a key becomes impossible in this run (the person left, the place burned, the object was sold), the Named Shadow becomes a **Common** Shadow from then on: every ordinary method works on it at normal strength. The summary screen says so: "What it was waiting for is gone. It will need a longer road."
4. **Ordinary methods still count.** While the key exists, ordinary methods lower a Named Shadow's Corruption at **half** strength. This keeps the key meaningful without trapping the player.
5. **A key met early is kept.** If the player meets the key before they have the Pokémon (they return the Magma Stone before meeting Slag Heart), the Shadow is found already Clear and says so in its entry scene.
6. **Rui sees keys.** With Rui as an ally, the first hint is given on sight.

---

## X9. Apex Shadows and the Colossus format

An **Apex** is a Legendary Shadow (base §8) that a team built its whole plan around. It is fought as a **Colossus**: a boss with parts.

### X9.1 The twelve

| Code | Name | Species | Parts | Signature move |
| --- | --- | --- | --- | --- |
| XD001 | XD001 | Lugia | Nine locks, one per method | Storm Without a Song |
| XD002 | M2 | Mewtwo / Mega Mewtwo X | Four armor seals | Mind Vault |
| XD003 | Dark Celebi | Celebi | Three Thorn Rings | Yesterday's Thorn |
| XD004 | Abyssal | Kyogre / Primal Kyogre | Three links of the Blue Orb | Drowned Sky |
| XD005 | Cinderheart | Groudon / Primal Groudon | Three links of the Red Orb | Scorched Dawn |
| XD006 | Stillhour | Dialga / Origin Dialga | Two Red Chains | Stopped Clock |
| XD007 | Farshore | Palkia / Origin Palkia | Two Red Chains | Folded Distance |
| XD008 | Absolute | Kyurem / Black Kyurem / White Kyurem | Three Splicer wedges | Empty Crown |
| XD009 | The Battery | Xerneas / Yveltal | Three petals | Borrowed Years |
| XD010 | The Mother Beast | Nihilego | Three veils | Keepsake |
| XD011 | The Darkest Day | Eternatus / Eternamax Eternatus | Three feeds, then an endurance round | Red Star |
| XD012 | The Cassiopeia Engine | Revavroom | Five cores | Starfall Barrage |

### X9.2 Colossus rules

1. **Parts first.** The Apex cannot be knocked out while any part stands. Its HP bar is shown locked.
2. **Each part has a shield bar.** Damage to the Apex goes to a part the player chooses (single-target moves) or is split across all standing parts (spread moves).
3. **Breaking a part removes one move.** The order is fixed and shown on the Colossus plate at the start of the fight. The signature move is always among the first two removed, so the hardest turn of the fight is early.
4. **The last part is never a move.** It is the Pokémon's obedience. When it breaks, the Apex stops attacking and the story choice begins. An Apex is never knocked out by the player.
5. **Announcements.** The signature move is announced one turn ahead, with its own line. Part breaks are announced when they happen.
6. **Timer.** Every Colossus has a turn limit (10 turns by default; the scripts adjust it). Running out is a loss of the climax (decision D1), except at the finale (see `GRAND_ARC.md` §6).
7. **Help arrives through the parts.** Raid results, allies and items do not weaken the Apex. They start parts cracked, break one outright, or add turns. A player who did every raid well may walk into a Colossus with half its parts gone.
8. **No Shadow cost to the player.** Fighting an Apex adds no Corruption to the player's Pokémon. A player's own Shadow Pokémon gains +10 Surge each turn it shares the field with an Apex ("It recognizes the sound.").

### X9.3 Part shields by Set

Shields scale with the level band the fight is in (`TRAINER_POOLS_AND_BOSSES.md` §2).

| Set | Shield per part (% of the Apex's max HP) | Default timer | Parts cracked for free |
| --- | --- | --- | --- |
| Set-1 | 14% | 12 turns | 1 |
| Set-2 | 16% | 12 turns | 1 |
| Set-3 | 18% | 11 turns | 0 |
| Set-4 | 20% | 11 turns | 0 |
| Set-5 | 22% | 10 turns | 0 |
| Set-6 | 24% | 10 turns | 0 |
| Set-7 | 26% | 10 turns | 0 |
| Set-8 | 28% | 9 turns | 0 |
| Set-9 | 30% | 9 turns | 0 |

A cracked part starts at half its shield. A fight with more than five parts (XD001, with up to nine locks) uses **two-thirds** of the listed shield per part.

### X9.4 Double Apex

Sinnoh's Stillhour and Farshore are fought together. Each has its own two chains. The player may break them in any order. Breaking both chains on one of the two frees it, and **the freed one turns on the chains of the other**, acting as an ally for the rest of the fight. This is the format's one built-in swing, and the script times Cyrus's best line to it.

### X9.5 After an Apex is freed

- It is never added to the party by the fight itself. Whether it leaves, stays near, or can be met again is written in each script's Resolution.
- Its code is entered in the Doom Ledger with the result: **freed** or **taken** (`GRAND_ARC.md` §7). A taken Apex is met again in the Region of Doom, under its team's banner.
- A freed Apex's signature move cannot be learned. Its Heart Scar, if the script grants one to a party member who took part, is listed there.

---

## X10. Variant lines and Shadow states together

A **variant line** (Black-Label, Tidebound, Couture and the rest) is a team's training, kit or habit. A **Shadow state** is a locked will. They are different systems and a Pokémon can have both.

| Line | Is the line itself a binding? | If the Pokémon is also Shadow | When the player obtains or frees it |
| --- | --- | --- | --- |
| Black-Label (rule: *Tagged*) | No: a tag | Both apply | Loses the rule, keeps its signature trait |
| Dark Ball | **Yes**: the Ball is the lock | Counts as at least Bound while in the Ball | The Ball cracks; keeps only its signature trait; Corruption is set to 25 |
| Tidebound | No: weather training | Both apply; Orb Resonance boost stacks once | Keeps the rule |
| Cinderborn | No: weather training | Both apply; Orb Resonance boost stacks once | Keeps the rule |
| Spiritless | **Yes**, lightly | Treated as a Tier 1 Shadow for purification | Purify it, or return Mesprit to Lake Verity |
| Overclocked | No: a device | Both apply; overheating does not add Corruption | Keeps the rule; the device can be removed at a rest node |
| Couture | No: an accessory | Both apply | Keeps the accessory as an ordinary item |
| Tagged-Up | No: a spray can | Both apply | Keeps the rule (and the can) |
| Preserved | Partly: kept cold | Conservation Hold Shadows are always Preserved | Thaws over three nodes: the rule fades, −1 Speed first |
| Overcharged | Partly: a forced charge | Dynamax Overload Shadows are always Overcharged | Keeps the rule at half length if Clear |
| Loud | No: a fan | Never Shadow: Yell binds nothing | Keeps the rule; still embarrassed by Marnie's card |
| Tuned | No: an engine's charge | Both apply | Keeps the rule if a Star Boss vouches for the player |
| Patchwork | No: a gadget | Never a lasting Shadow | Keeps one gadget, chosen once |
| Snagged | **Yes**: taken mid-battle | Always at least Veiled | Returned to its real trainer, it loses the rule and the Shadow |

**Stacking limit.** A line rule plus a Shadow tier plus an ability can add up. The base cap holds: no more than **+20% damage from Shadow sources** and no more than **+30% from all sources together**. Where a line rule would break the cap, the line rule is reduced first.

**Reading order on the status plate:** name, line badge, Shadow tier, aura. A Pokémon with both shows both: "Houndoom · Black-Label · Shadow III".

---

## X11. The two Snag Machines

There are two Machines in the world and they are not the same device.

| | Gonzap's Machine | Krane's Machine |
| --- | --- | --- |
| Built by | Cipher, for Team Snag'em | Professor Krane, from a stolen plan |
| Takes | Any Pokémon from any trainer | **Only Shadow Pokémon** |
| What it does to the Pokémon | Binds it (Snagged; at least Veiled) | Nothing: it only overrides the binder's claim |
| Who can wear it | Gonzap, Wes (once), the rival in one variant, the player on the Inside Man route | Wes, the player after Raid 6 |
| Heat | +4 for every awake team, each time it is used | None |
| How it ends | Destroyed, kept, or handed to Wes at the finale | Kept as a Key Item, or destroyed |

### X11.1 Snagging rules (either Machine)

1. **A Snag is a throw.** It uses the player's action for the turn and one Snag Ball. It follows ordinary capture odds for the target's HP and status, with a +50% bonus against a Pokémon whose trainer has no other Pokémon left.
2. **One per battle.** A second Snag in the same battle fails.
3. **Not against Apex or Story-bound Shadows.** The Machine sparks and reports "No lock."
4. **Not against a Pokémon with the *Named* Heart Scar**, or one sharing Pocket Change's trait.
5. **The trainer reacts.** A trainer who loses a Pokémon to Krane's Machine has one line about it. A trainer who loses one to Gonzap's remembers the player for the rest of the run.

### X11.2 Wearing Gonzap's

The Inside Man route can put Gonzap's Machine on the player's arm. It is the strongest capture tool in the game and it is priced accordingly.

| Each use | Effect |
| --- | --- |
| The Pokémon | Joins Snagged and Veiled; it may refuse its snagger (line rule) |
| Its trainer | Is added to a list. Three names on the list and one of them comes looking: a forced battle with a trainer who wants their partner back and is right |
| Rival Attitude | −1 the first time the rival sees it |
| Ending | Any Snagged Pokémon still held when the run ends is returned in the credits, one by one, with its trainer's name |

**Re-tuning.** After meeting Krane, the player can have Gonzap's Machine re-tuned to take only Shadow Pokémon. Every Snagged Pokémon in the party is offered its way home at that moment. Gonzap takes it personally (`snagem.x.retuned`: his next ambush has one more Pokémon and a new line).

### X11.3 Krane's Machine and custody

Taking a Shadow Pokémon with Krane's Machine counts as **custody** (base §12.2). The Pokémon keeps its tier, ability and moves. The team that bound it gains Heat +2 for the region, as for any kept Shadow.

---

## X12. The Reservoir

The Kalos ROM ("Siphon") proves the thing every earlier ROM hinted at: **a Shadow Pokémon's will is not destroyed. It is drawn off and stored.** Cipher stores it in one place.

- **Where.** A hall under the Citadark, reached in the finale's Phase 4. Nine banks of tanks, one per region, each tank the size of a lunchbox and faintly lit.
- **What is in a tank.** One Pokémon's stored will. Tanks are labelled with a luggage tag: a species, a town, a date.
- **Why it matters to the system.** It is the reason purification works at all. Every method in this document is a way of calling a will back down a very long wire. The Reservoir is the other end of the wire.

### X12.1 Rules

| Situation | Effect |
| --- | --- |
| A bank is opened with its ROM | Every Shadow from that region in the party drops one tier (Reservoir Return, method 11) |
| The ROM was earned in its own region | Those Pokémon go to 0 instead |
| A bank is opened without a ROM | One battle, then the same one-tier drop |
| A Stabilized Pokémon's tank is opened | The Pokémon is asked. The player sees one line from its point of view and chooses for it. Either answer is respected |
| A bank is left closed | Nothing is lost. Those Shadows stay as they are and can be purified by ordinary methods |
| Whiteout, Blackout Wing, Burnout | Their tanks are their keys (X8.3) |

### X12.2 After the finale

If the finale is won, the Reservoir is emptied and its wills are posted home. In later runs (decision D7, the Doom Ledger) this shows as one small change: **in a region whose bank was opened, wild Shadow encounters are purified 25% faster by every method.** The world remembers that it was answered.

If the finale is lost or declined, the Reservoir stays full, and nothing in an ordinary run is made harder by it.

---

## X13. Reclaim

Base §12 rule 6 says the binder wants a kept Shadow back and charges Heat for it. **Reclaim** is what that Heat buys.

### X13.1 When it triggers

A Reclaim attempt can replace an ordinary ambush when **all** of these hold: the player holds a Shadow bound by an awake team; that team's Heat is 50 or more; no Reclaim has happened in this region yet.

### X13.2 How it plays

1. **Telegraph.** The ambush splash reads "They have come for one of yours." and names the Pokémon.
2. **The Handler battle.** A Handler (Lieutenant rank) with a recall device. Each turn the device is active, the named Pokémon's Surge fills by an extra 10.
3. **The whistle.** On turn 3 and every third turn after, the Handler uses **Recall**: the named Pokémon, if it is on the field, must pass an obedience check at one tier higher than its own. If it fails, it turns and attacks its own side this turn (announced, as always).
4. **Ways to answer.** Keep the Pokémon on the bench. Knock out the Handler's device carrier (shown with an icon). Use Hold. Stabilized Pokémon ignore Recall entirely.

### X13.3 Results

| Result | Effect |
| --- | --- |
| Win | The device is taken: a Key Item worth −30 Corruption once (the method's "defeat the technician" boost), and no more Reclaims from that team this run |
| Lose | The run does not end. The named Pokémon is taken to **Impound** (consequence C1) and follows the Rival Rescue Plan like any other Impounded Pokémon |
| Flee | Heat +5; the next Reclaim may come one node later |

A Pokémon with *Handler's Whistle* fails every Recall check against its own binder. The ability's description says so.

---

## X14. Battle notices

Every hidden roll in this system has a line. They are collected here so none is missed in implementation.

| When | Notice |
| --- | --- |
| A Veiled Pokémon hesitates | "It hesitates." |
| A Gripped or Fallen Pokémon will disobey this turn | "The shadow tightens." (and the replaced move is shown) |
| A Surge will happen this turn | "The shadow surges." |
| Hold is used | "You steady it." |
| The Mentor is beside it | "It listens for a moment." |
| The Mentor faints | "It loses the voice it was following." |
| A key is near | "It turns its head." |
| A key is met | "It knows this." |
| Purification completes | "The shadow lets go." |
| A Heart Scar is earned | "It will carry this." |
| A third Heart Scar is offered | "It can carry two. Choose." |
| Stabilize | "You stop asking it to be different." |
| Unstabilize | "You ask again." |
| A Snag attempt | "The Machine reaches." |
| A Snag is blocked | "No lock." |
| Reclaim begins | "They have come for one of yours." |
| Recall is used | "A whistle. It knows the whistle." |
| A Colossus part breaks | The part's own line, from the script |
| The last part breaks | "It can hear itself." |
| Fighting beside an Apex | "It recognizes the sound." |
| Crowd Chant | "They are saying its name." |
| A missed key | "What it was waiting for is gone. It will need a longer road." |

---

## X15. Tuning levers and tests

### X15.1 Levers

| Lever | Default | Safe range |
| --- | --- | --- |
| Gripped disobedience | 15% | 10–20% |
| Veiled hesitation | 5% | 0–8% |
| Named Shadow: ordinary methods at | 50% strength | 33–75% |
| Purify Chamber drop | −30 (−45 with a cycle) | −20 to −40 |
| The Long Walk | −3 per node | −2 to −5 |
| Colossus shield per part | X9.3 | ±4 points per Set |
| Reclaim Heat threshold | 50 | 40–70 |
| Gonzap's Machine: names before a visit | 3 | 2–5 |
| Heart Scar size | about 3–5% | never above 5% |

### X15.2 Tests (in addition to base §11 and §12.1)

- Every one of the 30 Shadow moves and 36 abilities is used by at least one Pokémon in `data/expansion.json` or a pool.
- A Veiled Pokémon hesitates on 5% ± 1% of turns across 10,000 simulated turns; a Gripped one disobeys on 15% ± 1%.
- Tier is recalculated at the end of the turn and never mid-turn.
- Each of the 44 Named Shadows reaches Corruption 0 when its key is met, and falls back to Common when its key is marked impossible.
- A key met before the Pokémon is obtained delivers the Pokémon Clear.
- No Colossus can be knocked out while a part stands; the last part ends the fight without a knockout.
- The freed half of a Double Apex acts as an ally on the following turn.
- Shield values match the Set of the fight; a fight with more than five parts uses two-thirds.
- A Snag fails against Apex, Story-bound, *Named*-scarred and Pocket Change targets, with the "No lock." notice.
- Three uses of Gonzap's Machine schedule exactly one visit.
- Reclaim triggers at most once per region per team, and never when the Pokémon is Stabilized and benched.
- Losing a Reclaim sends the Pokémon to Impound and does not end the run.
- Opening a bank lowers every matching party Shadow by one tier, or to 0 with an in-region ROM.
- A Stabilized Pokémon is always asked before Reservoir Return applies.
- Damage from Shadow sources never exceeds +20%; from all sources, +30%.
- Every notice in X14 appears at least once in an automated playthrough.

---

## X16. Counts

| Thing | Base | Added here | Total |
| --- | --- | --- | --- |
| Shadow moves | 14 | 16 (and 12 signature moves) | 30 (42) |
| Shadow abilities | 20 | 16 | 36 |
| Purification methods | 7 | 6 | 13 |
| Heart Scars | 3 named | 21 more | 24 |
| Classes of Shadow | 5 variants | 4 classes, 5 key types | — |
| Special Shadows with rules here | — | 58 (12 Apex) | 58 |
| Battle notices | 1 | 21 | 22 |

*Next: `REGION_OF_DOOM_EXPANDED.md` covers what happens to all of this when a region falls.*
