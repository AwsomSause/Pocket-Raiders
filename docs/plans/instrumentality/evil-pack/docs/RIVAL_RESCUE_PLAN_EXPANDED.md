# THE RIVAL'S RESCUE PLAN — EXPANDED EDITION

**Extends:** `docs/RIVAL_RESCUE_PLAN.md` (every rule there still holds; this file adds to it)
**Read with:** `docs/CLIMAX_RIVAL_INTEGRATION.md` and its expanded companion, `docs/expanded/SHADOW_POKEMON_SYSTEM_EXPANDED.md`
*Every jailer, scene and line here is original to this project.*

---

## X1. What this file adds

The base document turns the heaviest raid consequence (C1, Impound) into a story beat: about ten nodes later the rival arrives with a plan. It defines three plans, one micro-stage and fourteen lines per archetype.

This file makes the middle of that story as detailed as its two ends: what happens to a Pokémon while it is held, what the micro-stage looks like in each team's building, and what the reunion is like.

| Section | Adds |
| --- | --- |
| X2 | Impound in depth: the receipt, the holding clock, what each team does with a held Pokémon |
| X3 | Two more plans (five in all): the Inside Job and the Exchange |
| X4 | `PS-RESCUE` beat by beat, with the choices for every plan |
| X5 | Fourteen holding sites: the approach, the door, the cage, the jailer |
| X6 | The complication deck (12) |
| X7 | The reunion: what comes back, and who comes back with it |
| X8 | Other rescuers: the second rival, the trio, Looker, Wes |
| X9 | The Pound: rescue inside the Extended Cut climax |
| X10 | 64 more lines |
| X11 | The plan under each climax variant, in depth |
| X12 | Flags, memory and tests |

**What does not change:** the trigger and its timing, the 0.35–0.95 clamp, the readiness label, the rule that a wipe inside the micro-stage is only a Fail, and the rule that Impound never takes the last two party members.

---

## X2. Impound in depth

### X2.1 The receipt

When C1 is applied, the team leaves paperwork. Every team's receipt is different and every one tells the player where the Pokémon went, which is the first clue for the plan.

| Team | The receipt |
| --- | --- |
| Team Rocket | A numbered claim ticket, carbon copy. "Property held pending assessment. No refunds." |
| Rocket Returns | A request slip from a radio station: "Your dedication has been received and will be played shortly." |
| Team Aqua | A cargo tag, damp. A berth number and a tide table |
| Team Magma | A sample label: specimen, mass, temperature tolerance |
| Team Galactic | A form with every field filled in except *Owner* |
| Team Plasma | A certificate of liberation, gilt-edged, congratulating the Pokémon |
| Team Flare | An invoice. The amount is the Pokémon. It is marked *paid* |
| Team Skull | A tag sprayed on the nearest wall: the Pokémon's name, spelled wrong, and "BORROWED" |
| Aether Foundation | An intake card with a photograph, a habitat number and visiting hours |
| Macro Cosmos | A lanyard pass for the Pokémon: "Contractor, Energy Division" |
| Team Yell | A ticket stub. Standing section. "See you at the match!" |
| Team Star | A sticky note: "Borrowing this. Sorry. Will give back. Probably." |
| Rocket Remnants | An IOU, signed by all three, with a pawprint |
| Team Snag'em | Nothing. That is how the player knows who it was |

The receipt is a Key Item until the Pokémon are returned. Showing it to the rival skips the *offer* line's explanation and gives `beatBonus` +0.05 on the Approach (the rival knows which door).

### X2.2 The holding clock

The player can always see how long a Pokémon has been held, and what that means.

| Nodes held | State | What it means |
| --- | --- | --- |
| 0–4 | **Logged** | In a cage, fed, untouched. Returns exactly as it left |
| 5–9 | **Processed** | The team has started on it (see X2.3). Returns with a cosmetic mark of the team |
| 10 or more | **Assigned** | The team has a use for it. Returns with the mark, and one minor, temporary effect (X2.3) |
| Two declined offers, or still held at the climax | **Held too long** | The base rule (§3.3), unchanged: returns Veiled (Corruption 10) if the team has a binding method |

The clock is shown on the party screen beside the empty slot: a small cage icon that fills. It stops when a plan is accepted.

### X2.3 What each team does with a held Pokémon

The marks are small on purpose. Impound is already a punishment. The mark is the story.

| Team | Processed (cosmetic) | Assigned (lasts 5 nodes after return) | Held too long |
| --- | --- | --- | --- |
| Team Rocket | A numbered ear tag | *Tagged*: cannot be forced to switch out; the tag can be removed at any rest node | Veiled, Capture Rig |
| Rocket Returns | It hums a jingle | Flinches at radio static: −1 Speed on its first turn in the next battle only | Veiled, Radio Wave Lock |
| Team Aqua | Smells of brine | +1 Speed in rain, −1 in harsh sun, for five nodes | Veiled, Orb Resonance |
| Team Magma | Soot on its coat | +1 Defense in harsh sun, −1 in rain, for five nodes | Veiled, Orb Resonance |
| Team Galactic | Sits very still | *Quiet*: bond effects are halved for five nodes. It comes back to itself gradually | Veiled, Red Chain Lock |
| Team Plasma | Looks for the door | Hesitates once (loses one turn in its next battle) the first time it is sent out | Veiled, Liberation Lock |
| Team Flare | Groomed, with a ribbon | Keeps the ribbon: a harmless held item | Veiled, Life-Force Siphon |
| Team Skull | A sprayed tag on one flank | Has picked up a bad habit: uses its weakest move first, once. The Grunts taught it that for a laugh | Veiled, Stolen Bond |
| Aether Foundation | Very clean; a wristband | Cannot be given a status condition for five nodes; −1 Speed for the same | Veiled, Conservation Hold |
| Macro Cosmos | A lanyard | Tired: starts its next battle at 90% HP. It has been working | Veiled, Dynamax Overload |
| Team Yell | Face paint | Louder: its sound-based moves have +10% power for five nodes. It had a lovely time | Never. Yell binds nothing; the Pokémon comes back hoarse |
| Team Star | A star sticker | Nothing. Somebody fed it and taught it a trick | Veiled, Star Barrage Link |
| Rocket Remnants | A tiny bow tie | Nothing. Meowth kept it company and it is slightly spoiled | Never: no lasting Shadow |
| Team Snag'em | A dark collar | *Snagged*: 20% chance to skip a turn in its next battle, once, looking for its trainer | Veiled, Snag Machine |

**Nothing here is permanent** except what the player chooses to keep (base §3.3, and the Shadow document §12).

---

## X3. Two more plans

The base three are **Quiet Extraction**, **Loud Grab** and **The Deal**. Two more are offered only when the run has earned them.

| Plan | Offered when | Fiction | Mechanic | Costs | Risk |
| --- | --- | --- | --- | --- | --- |
| **The Inside Job** | The player has someone inside: the Inside Man flag for that team, a Defector from it, the runner (Stand-with route), or trio reputation +15 when the holder is the Remnants | Somebody opens the door from the other side | `PS-RESCUE` with **two** beats, not three (the Door is skipped). Base success 0.85 | The insider is spent: a Defector moves to a safehouse and is unavailable for five nodes; on the Inside Man route, reputation −8 if noticed (30%, shown) | Lowest risk. Highest cost to someone else |
| **The Exchange** | The player holds something the team wants: an Intel pack on a rival team, a recovered device (a recall whistle, a Gate Lock, a Splicer wedge), or a captured officer's tool from a raid Triumph | A trade on neutral ground, with the rival watching the exits | No roll. A negotiation of three lines; the wrong line turns it into a Loud Grab at −0.10 | The item is gone. If it was a device, the team's Operation Strength rises by 1 | None, unless the player insults them |

**Preferred plans.** No archetype prefers a new plan by default. Two archetypes shift when one is available:

| Archetype | Shift |
| --- | --- |
| Scholar | Prefers the Inside Job if a Defector exists ("A primary source! We must not waste a primary source.") |
| Bitter | Prefers the Exchange if the item was taken from that team ("Sell them their own junk back. I like it.") |

### X3.1 The success formula, restated

For Quiet, Loud and the Inside Job the base formula holds. Only `base` differs.

| Plan | `base` | Beats | Extra term |
| --- | --- | --- | --- |
| Quiet Extraction | 0.70 | 3 | — |
| Loud Grab | 0.80 | 3 | — |
| The Inside Job | 0.85 | 2 | `+0.05` if the insider's own relationship with the player is good (Defector helped earlier; runner is `close`; trio reputation +25) |

The clamp is still 0.35–0.95, and the readiness label still never shows a number.

---

## X4. `PS-RESCUE`, beat by beat

Three beats: **Approach → Door → Cage**. Each has one choice of three. The rival's line before each beat hints at the good one (the *complication* line in the base document, and three more per archetype in X10).

### X4.1 Quiet Extraction

| Beat | Good (+0.05) | Neutral (0) | Bad (−0.05) |
| --- | --- | --- | --- |
| **Approach** | Wait for the shift change | Go at once | Go at once, with a light |
| **Door** | Use the service entrance the receipt names | Pick the main lock | Try the window. There is always a window. It is always alarmed |
| **Cage** | Let the Pokémon recognise the player before opening | Open every cage at once | Carry the cage out, closed |

Battles: one at the Door if the choice was not Good; one at the Cage if the complication calls for it.

### X4.2 Loud Grab

| Beat | Good (+0.05) | Neutral (0) | Bad (−0.05) |
| --- | --- | --- | --- |
| **Approach** | Let the rival go first and be the noise | Go in together | Go first and be the noise yourself |
| **Door** | Break the hinge side | Break the lock | Argue with the guard |
| **Cage** | Shield the cages before the last fight | Fight in the open | Fight beside the cages |

Battles: three, with Rival Assist (budget 3), as in the base document. A Bad choice at the Cage puts one impounded Pokémon at risk of returning *Assigned* instead of *Logged*.

### X4.3 The Deal

No beats. Three exchanges with the team's jailer (X5). The rival stands behind the player and says nothing, unless they are a Hotshot.

| Exchange | What decides it |
| --- | --- |
| The price is named | 40% of current money, or one held-item set (base). Reputation with the team of +15 or more lowers it to 30% |
| The counter | The player may offer Intel instead of part of the money (Intel −5 buys 10 points off the percentage) |
| The handshake | Always succeeds. The jailer has one line (X5) that tells the player what the team thinks of people who pay |

### X4.4 The Inside Job

| Beat | Good (+0.05) | Neutral (0) | Bad (−0.05) |
| --- | --- | --- | --- |
| **Approach** | Arrive exactly when the insider said | Arrive early | Arrive late |
| **Cage** | Leave the way the insider says, even though it is longer | Leave the way the player came | Stop to take something else |

Battles: none on two Good choices; one otherwise.

### X4.5 The Exchange

| Line | Good | Wrong |
| --- | --- | --- |
| Opening | Put the item on the table first | Ask to see the Pokémon first |
| Middle | Say nothing while they inspect it | Explain what it is worth |
| Close | Take the Pokémon and leave | Ask for something extra |

One Wrong line is forgiven. Two turn the scene into a Loud Grab that starts at the Cage, at −0.10.

---

## X5. Fourteen holding sites

Each site reuses an existing raid map (base §5). What changes is who is on the door.

| Team | The approach | The door | The cage | The jailer |
| --- | --- | --- | --- | --- |
| Team Rocket | Down the Game Corner's back stairs, past a poster that is a switch | A numbered grille; the number on the claim ticket opens it | Rows of cages with claim numbers | **Mr. Fitch**, who has a ledger and a sandwich. "Ticket? No ticket, no talk. Ticket, we talk." |
| Rocket Returns | Through the souvenir shop, under the Ragecandybar display | A studio door with a red light. It cannot be opened while the light is on | Pens beside the transmitter. The hum makes teeth ache | **Nan Holloway**, the "station manager". "We're on air in two minutes. Whatever this is, make it one." |
| Team Aqua | Along the dry dock at low tide | A pressure hatch | Tanks and net cages, half flooded on a schedule | **Bosun Kettle**. "Tide's in at six. You want 'em dry, you want 'em before six." |
| Team Magma | Down a service tunnel that is slightly too warm | A blast door with a thermal lock: it opens when the room is cool | Heat-lamped pens | **Technician Ashby**. "Don't touch the lamps. They like the lamps. I'm fairly sure they like the lamps." |
| Team Galactic | The lift does not list this floor | A door with no handle on the outside | Chain-linked cages in a room with no echo | **Grunt 87**. "I am required to ask your business. I am not required to care." |
| Team Plasma | Up the Frigate's stern ladder | A hold hatch with a banner over it: *They Are Free Now* | A large, comfortable pen with no exit | **Brother Aldous**. "You've come to take them back into bondage. I shall pray for you. The key is on the hook." |
| Team Flare | The café's wine cellar | A glass door. Fingerprints show | Sterile glass cases, each with a price card | **Madame Solange**. "They are very well kept. Better than you kept them, I think. Look at the coat." |
| Team Skull | Over the Po Town wall, in the rain | A door held shut by a Grunt leaning on it | A cellar. Someone has put down blankets | **Grunt "Big Wheels"**. "Boss said nobody goes in. He didn't say nothin' about *out*. Hm." |
| Aether Foundation | The visitors' entrance, during visiting hours | A habitat airlock with a sanitising cycle | Glass habitats, each one perfect and sealed | **Keeper Lehua**. "Visiting hours end at four. You're welcome to look. Please don't tap the glass." |
| Macro Cosmos | A staff corridor; the lanyard pass from the receipt works once | A turnstile | Dynamax chambers: red light under the doors | **Shift Supervisor Dunn**. "If it's on the rota I can't release it. If you take it off the rota I never saw it on the rota." |
| Team Yell | The fan hall's side door | It is open. It is always open | A back room with sofas. The Pokémon are watching a match replay | **Yell Grunt Tegan**. "Oh! They're yours? We thought they were supporters! They've been *brilliant*." |
| Team Star | The Base's garage roller door | A padlock with the code written on it in marker | Starmobile crates with air holes and cushions | **Star Grunt Pío**. "We were gonna give them back! We got busy! There was a *thing*!" |
| Rocket Remnants | Their hideout in the host region | A net, strung across the doorway, that falls on whoever sets it | A cage made of other, smaller cages | **Meowth**, on a stool. "Youse can't prove nothin'. …How much ya got?" |
| Team Snag'em | Their hideout in the host region | A roller shutter and a dog that is actually a Houndour | Dark cages. The Pokémon inside have gone quiet | **Wakin**, if he is not at the Cache. "…Take them. Quick. I'm going to go and check on something over there for five minutes." |

**Team Yell's site cannot fail.** Any plan against Team Yell resolves as Full. The Grunts help carry.

**Team Snag'em's site** is the quietest of the fourteen. If the Pokémon were held too long, this is the one place the player sees it before the rescue is over, and the rival's *complication* line is replaced with a quieter one: "…{mon}'s looking right at me. I don't think it knows who I am."

---

## X6. The complication deck

The base document gives each archetype one *complication* line. This is what the line is about. One complication is drawn per plan (`rng(hash(runSeed, regionId, "rescue-complication"))`), announced by the rival, and answered with one choice. A good answer is worth the beat's +0.05; a poor one costs the same.

| # | Complication | What the player sees | Good answer | Poor answer |
| --- | --- | --- | --- | --- |
| 1 | **The Extra Guard** | Someone who was not on the rival's map | Wait: they are on a break and will leave | Rush them |
| 2 | **The Wrong Cage** | The cage number on the receipt holds a different Pokémon | Open it anyway, then find the right one | Leave it |
| 3 | **Moved** | The Pokémon were moved an hour ago | Follow the drag marks | Search room by room |
| 4 | **The Alarm Test** | A scheduled alarm test begins | Walk, do not run: it is only a test | Run |
| 5 | **It Won't Come** | The player's Pokémon is frightened and will not leave the cage | Sit down. Wait. Say its name | Pull |
| 6 | **The Friendly Grunt** | A Grunt who has been feeding them and does not want trouble | Thank them | Battle them |
| 7 | **The Second Rescuer** | Somebody else is already breaking in for their own Pokémon | Work together | Compete for the door |
| 8 | **Locked In** | The door shuts behind the party | Look up: there is always a hatch | Force the door |
| 9 | **The Officer** | A Lieutenant arrives for an inspection | Hide among the cages. The Pokémon keep quiet for the player | Fight |
| 10 | **The Paperwork** | The jailer will not release them without a form | Fill in the form. It is two lines long | Tear up the form |
| 11 | **Somebody's Missing** | One of the impounded Pokémon is not with the others | Ask the others. One of them points | Assume the worst |
| 12 | **The Rival Freezes** | The rival sees something in a cage that stops them | Give them a moment | Hurry them |

**Complication 7** can introduce the second rival, the trio, or an ordinary trainer whose Pokémon was also taken. Working together adds that trainer's Pokémon to the reunion scene, and the trainer is met again later with a gift.

**Complication 12** is archetype-specific, and is the one place in the plan where the rival's own history shows.

| Archetype | What stopped them |
| --- | --- |
| Hotshot | A Pokémon of the same species as their starter, much smaller, in a cage that is too big |
| Prodigy | A cage with nothing in it and scratch marks on the inside |
| Friendly | All of it. They are fine. They need a second |
| Bitter | A cage tag with a sponsor's logo on it. A sponsor that turned them down |
| Scholar | A clipboard with someone else's notes. The handwriting is neat. The notes are about pain thresholds |
| Heir | Their family's crest, stamped on the lock |
| Lone Wolf | Nothing visible. They stand there for five seconds, and then carry on |
| Mirror | Their own reflection in the glass, with a Pokémon behind it looking back |

---

## X7. The reunion

### X7.1 What comes back

| Result | Reunion |
| --- | --- |
| **Full** | A scene at the quiet node: each Pokémon is let out, one at a time, and goes to the player or to a party member it has chemistry with. Bond +1 for every returned Pokémon. Chemistry pairs that were split gain a one-battle bonus: their combined effect is doubled in the next fight |
| **Partial** | The same, smaller. The ones that came back look at the door for the ones that did not. No Bond change |
| **Fail** | No reunion. The rival sits with the player instead. That scene is in the base lines, and it matters as much |
| **The Deal / The Exchange** | The Pokémon are handed over in carriers. They are quiet until the carriers are opened away from the building |

### X7.2 What they remember

A returned Pokémon has one line on its summary screen for the next five nodes, chosen by how long it was held.

| State | Summary line |
| --- | --- |
| Logged | "It checked that you were all still here." |
| Processed | "It keeps looking at the mark they left. It doesn't seem to mind when you look too." |
| Assigned | "It did what they told it. It would rather not talk about it." |
| Held too long | "It knows you came. It took a while to be sure." |

### X7.3 Cellmates

On a **Full** result there is a 20% chance (`rng(hash(runSeed, regionId, "rescue-cellmate"))`) that the Pokémon from the next cage follows the party out. It is drawn from the holding team's Grunt pool for the current Set, so it is never stronger than what the player has been fighting.

| The player | Result |
| --- | --- |
| **Lets it come** | It joins, at Bond 1, with the *Found* Heart Scar already earned (it can never be Impounded) |
| **Finds its trainer** | A short optional errand. Reward: an item, and reputation with the region's civilians |
| **Leaves the door open** | It goes where it likes. It may be seen again as a wild encounter that does not run |

A cellmate is never Shadow unless the holder is Team Snag'em, and the game says so before the player chooses.

---

## X8. Other rescuers

The rival owns the plan. Four other people can shorten it.

| Who | When | What they do | Limit |
| --- | --- | --- | --- |
| **The second rival** | They exist this region (decision D8) and their attitude is not hostile | Joins the plan as a lookout: `beatBonus` +0.05 at the Approach, and one extra Assist in a Loud Grab | They say afterwards that it was their idea |
| **The trio** | Trio reputation +15 (script 00 §9), or three favors spent (expanded roaming document, X11.1) | **The Balloon**: no micro-stage. They lower a rope ladder into the holding site's yard and haul the cages up. Counts as Full | Once per run. Something of the player's goes missing afterwards: one common item. It comes back in the post, with a bill |
| **Looker** | Any raid in this region ended with the team `exposed`, or the player has given him evidence | **The Warrant**: a legal seizure. No battle and no roll, but it takes three nodes to arrive | Does not work on Team Snag'em (no premises) or Team Yell (no crime) |
| **Wes** | Snag'em is the holder, or the Pokémon were held too long | **The Snag-back**: Wes walks in with Krane's Machine and takes the Shadowed Pokémon back off the team mid-battle. They return at once, still Veiled | Only for Pokémon that are already Shadow |

None of these changes the rival's attitude deltas (base §7). If a shortcut is used instead of the plan, the rival's *decline* delta is not applied: they were not turned down, they were beaten to it, and each archetype has one line about that in X10.

---

## X9. The Pound: rescue inside the Extended Cut

The base rule is "the climax at the latest." In the Standard Cut that means the climax-eve offer. In the Extended Cut, with `rescue.climaxEligible = true` (the default), there is one more chance, inside the climax itself.

- If any Pokémon are still impounded when the climax begins, the holding site appears on the **Siege Map** as an extra district: **the Pound**.
- The Pound starts **Contested**. The player can assign an ally to hold it (the rival, in Help; the second rival; any regional ally), or fight its one battle themselves during Phase 1.
- If the Pound is **Held** at the Breather, the impounded Pokémon are returned there, at 50% HP, and may be used in the second half of the climax.
- If the Pound is **Lost**, nothing more is lost: the Pokémon are returned on climax victory, as the base rule says.
- **Held too long still applies.** Pokémon recovered from the Pound were held until the climax, so they return Veiled (Corruption 10) where the team has a binding method. The summary line is the fourth in X7.2.
- **No reunion scene** plays in the middle of a climax. It plays in the Resolution instead, and it is longer for having waited.

> **THE RIVAL** *(Help, assigned to the Pound)*: "The cells. Give me the cells. I said I'd get them back and I didn't. I'd like to stop thinking about that."

With `rescue.climaxEligible = false` the Pound does not appear and the Standard rule applies.

---

## X10. More lines (64)

Eight more stages per archetype: **hint-approach**, **hint-door**, **hint-cage** (each points at the Good choice for the rival's preferred plan, or for Quiet Extraction where the preferred plan has no beats), **pitch-inside**, **pitch-exchange**, **reunion**, **held-too-long**, **the-pound**.

### X10.1 Hotshot

| Stage | Line |
| --- | --- |
| hint-approach | "I'll go first and be loud. That's the plan. That's also just me." |
| hint-door | "Hinges! Always go for the hinges. I saw it in a film." |
| hint-cage | "Get in front of the cages. If anything hits them I'll never forgive either of us." |
| pitch-inside | "We know a guy? We *know a guy*! Why didn't you say! Okay, new plan, the guy." |
| pitch-exchange | "We trade them something? Like a hostage swap? That is the coolest thing you've ever suggested." |
| reunion | "Look at them! Look at {mon}! Okay, I'm not crying, there's cage dust." |
| held-too-long | "…{mon}'s got something on it. Something of theirs. That's on me. I was slow." |
| the-pound | "The cells are *on the map*. They put the cells on the map! I'm taking the cells." |

### X10.2 Prodigy

| Stage | Line |
| --- | --- |
| hint-approach | "The shift changes at the quarter hour. We wait. Patience is a tactic." |
| hint-door | "The receipt lists a service entrance. They wrote the route down for us. Remarkable." |
| hint-cage | "Let it see you before you touch the latch. A frightened Pokémon is a variable." |
| pitch-inside | "An informant removes the Door beat entirely. I recommend it. I recommend also that we thank them properly." |
| pitch-exchange | "A trade is a negotiation with a fixed outcome, provided nobody talks too much. I shall stand behind you and not talk." |
| reunion | "All accounted for. …I had prepared remarks. I find I do not need them." |
| held-too-long | "There is a trace of their method on {mon}. Ten points of Corruption, by my estimate. Recoverable. I am sorry it is not zero." |
| the-pound | "The holding site is a district. Assign me to it. I have its floor plan memorised, for reasons I regret." |

### X10.3 Friendly

| Stage | Line |
| --- | --- |
| hint-approach | "Let's wait till they change over. I don't want anyone to get in trouble. Even them. A bit." |
| hint-door | "There's a little side door on the ticket. Side doors are nicer. Nobody slams a side door." |
| hint-cage | "Let {mon} smell your hand first. Slowly. There. See? It *knows*." |
| pitch-inside | "Someone inside wants to help? Oh, that's so brave of them. We have to bring them something." |
| pitch-exchange | "We give them a thing, they give us our friends. Nobody fights. Can it be that one? Please?" |
| reunion | "They're all here. They're all *here*. Group hug. No, I mean it, everybody in." |
| held-too-long | "{mon}'s a bit… far away. That's okay. We'll go slowly. We've got time now." |
| the-pound | "Put me on the cells. I'll sit with them till you're done. I'll tell them you're coming." |

### X10.4 Bitter

| Stage | Line |
| --- | --- |
| hint-approach | "I'll make the noise. You've got the face people open doors for. Use it." |
| hint-door | "Hinge side. Locks are for people who follow rules." |
| hint-cage | "Stand in front of them. If one more thing gets taken off somebody today I'm going to break something expensive." |
| pitch-inside | "You've got a friend on the inside. Course you do. Fine. Use them. Just… make sure they're all right after." |
| pitch-exchange | "Sell them their own junk back. I like it. I like it a lot." |
| reunion | "…Yeah. Okay. That's. Yeah." *(They turn around for a moment.)* |
| held-too-long | "They got to {mon}. A little. I know what a little feels like. It'll want you close. Don't crowd it." |
| the-pound | "Cells are mine. Nobody argue." |

### X10.5 Scholar

| Stage | Line |
| --- | --- |
| hint-approach | "Observation: they change shifts at the quarter hour and nobody watches the gap. We shall be the gap." |
| hint-door | "The receipt is a primary document. It names a service door. Always read the primary document." |
| hint-cage | "Recognition precedes trust. Let it identify you. I shall time it, for interest." |
| pitch-inside | "A primary source! We must not waste a primary source. Also we must keep them safe; I have seen what happens to sources." |
| pitch-exchange | "An exchange of goods under mutual suspicion. I have read about these. Do not explain the item's value. The books are firm on that." |
| reunion | "I note elevated vocalisation, physical contact, and what I can only record as joy. Sample size: all of them." |
| held-too-long | "{mon} presents with a mild Shadow tier. I am recording that as *mild* and *temporary*, and I will be checking on it personally." |
| the-pound | "The holding site, as a contested district. I should like to hold it. I should like, for once, to be useful rather than informative." |

### X10.6 Heir

| Stage | Line |
| --- | --- |
| hint-approach | "We wait for the change of the guard. One does not interrupt." |
| hint-door | "The tradesman's entrance. I am told it is the honest way into any great house." |
| hint-cage | "Allow it to come to you. One does not seize what one has come to restore." |
| pitch-inside | "A friend within. Then we are guests, in a manner of speaking. Let us behave as guests and leave nothing broken that need not be." |
| pitch-exchange | "A formal exchange. I know the customs. Place the article down first; it shows good faith, and it frees both hands." |
| reunion | "They are restored to you. I am… forgive me. I was not taught what to do with my face at such moments." |
| held-too-long | "They have left their mark upon {mon}. I consider it an insult to us both. It will be answered." |
| the-pound | "Assign me the cells. A promise was made concerning them. I intend that it be kept on the field." |

### X10.7 Lone Wolf

| Stage | Line |
| --- | --- |
| hint-approach | "…Wait." |
| hint-door | "…Side." |
| hint-cage | "…Slow." |
| pitch-inside | "…You trust them?" *(a pause)* "…Okay." |
| pitch-exchange | "…Don't talk." |
| reunion | "…" *(They crouch. One of the returned Pokémon goes to them first. They let it.)* |
| held-too-long | "…It'll come back. Give it time." |
| the-pound | "…Cells. Mine." |

### X10.8 Mirror

| Stage | Line |
| --- | --- |
| hint-approach | "You'd wait for the shift change. So we wait." |
| hint-door | "You'd read the ticket twice. I read it twice. There's a side door." |
| hint-cage | "You'd let it come to you. I'd have grabbed. I'm learning." |
| pitch-inside | "You've got someone in there who'd open a door for you. I'd like to know what that's like." |
| pitch-exchange | "A trade. You give up something to get something back. You're better at that than me." |
| reunion | "They went straight to you. Not a look at me. …Good. That's how it should be." |
| held-too-long | "{mon} isn't sure which feelings are its own right now. I can sit with it, if you want. I know the way out of that." |
| the-pound | "You'd want the cells held by someone who knows what it is to be kept. That's me." |

### X10.9 Beaten to it (8 lines)

Said when the trio, Looker or Wes returns the Pokémon before the rival's plan is used.

| Archetype | Line |
| --- | --- |
| Hotshot | "A *balloon*? You got rescued by a *balloon*? I had a whole plan! It had a part with a rope!" |
| Prodigy | "An external actor resolved it first. I am told this is good news. I am adjusting to that." |
| Friendly | "They're back? Oh, thank goodness. I don't mind who. I mind a *bit*. Mostly I don't mind." |
| Bitter | "Somebody else did it. Faster. …Good. No, I mean it. Good." |
| Scholar | "I had a nine-day observation log. I shall file it under 'unnecessary' and try to feel pleased." |
| Heir | "The matter is settled, and not by me. I shall be gracious about it. Starting presently." |
| Lone Wolf | "…Huh." |
| Mirror | "Someone got there before me. That's usually your line." |

---

## X11. The plan under each climax variant

The base table (§9) says how the plan and the roll touch. This is how it plays.

### X11.1 Help (60%)

The plan is the partnership's first test. At the climax:

- If the plan was **Full**, the rival's arrival line is replaced with a callback, and the first Rival Assist of the climax is free of its cooldown.
- If it was **Fail**, the rival opens with an apology and offers **Hold District** on the Pound without being asked.
- If it was **declined twice**, the rival still helps, and says once: "I'd have come. You know that, right? I just need to know you know."

### X11.2 Beat-you (30%)

The rival went in first. The plan colors why.

- A successful plan means they went in **for the player**: "I owed you one. I thought I'd pay early."
- A failed plan means they went in to **make up for it**. The rescue state is *Defiant* rather than *Shaken* (base §9), and the rival's first words when found are an apology, whatever the archetype.
- If Pokémon are still impounded, the rival is found **at the Pound**, whatever the region's usual staging. They got that far.

### X11.3 Side-with (10%)

The plan is sincere and it is also the tell.

| The tell | When the player can notice it |
| --- | --- |
| The rival knew the cage numbers without the receipt | During the offer |
| The jailer greets the rival by a name that is not theirs, and corrects themselves | At the Door or in The Deal |
| The rival does not want to be seen by one particular officer | The Officer complication, if drawn |
| The Inside Job is offered even when the player has no insider. *The rival is the insider* | The plan menu |

A **Full** result is worth +1 on the Turn formula, as the base document says. In the Reveal Scene the rival brings it up themselves:

> **THE RIVAL:** "I got yours out. Did you ever wonder how I knew the way? …I was already working there. I got yours out *anyway*. I want that to count for something. I don't know if it does."

It does. It is the +1.

---

## X12. Flags, memory and tests

### X12.1 Flags

| Flag | Meaning |
| --- | --- |
| `impound.receipt` | Key Item held |
| `impound.state` | `logged`, `processed`, `assigned`, `held-too-long` |
| `rescue.plan` | `quiet`, `loud`, `deal`, `inside`, `exchange` |
| `rescue.complication` | 1–12 |
| `rescue.shortcut` | `trio`, `looker`, `wes`, or unset |
| `rescue.cellmate` | `joined`, `returned`, `released`, or unset |
| `rescue.pound` | `held`, `lost`, or unset |
| `rescue.climaxEligible` | Setting, default `true` |

### X12.2 Memory kinds (+3, added to the base four)

| Kind | Trigger | Callout (neutral) |
| --- | --- | --- |
| `rescue-froze` | Complication 12, answered well | "You waited for me. In that room. I haven't said thank you." |
| `rescue-beaten-to-it` | A shortcut returned the Pokémon first | "I had a plan, you know. A good one." |
| `rescue-pound` | The rival held the Pound | "I held the cells. I'd promised." |

### X12.3 Tests (in addition to base §11)

- Each team's receipt exists and names its holding site; Team Snag'em leaves none.
- The holding clock reads Logged, Processed or Assigned by nodes held, and *Held too long* only under the base rule (two declines, or still held at the climax).
- Every Assigned effect ends five nodes after return.
- The Inside Job and the Exchange appear only when their conditions hold, except in Side-with, where the Inside Job is always listed.
- The Inside Job has two beats and never includes a Door choice.
- Two Wrong lines in the Exchange start a Loud Grab at the Cage with −0.10; one Wrong line does not.
- Any plan against Team Yell resolves as Full.
- Exactly one complication is drawn per plan, deterministically from the seed.
- A cellmate is drawn from the holding team's Grunt pool for the current Set, and is Shadow only when the holder is Team Snag'em.
- The trio's Balloon works once per run and counts as Full.
- The Warrant is refused for Team Snag'em and Team Yell.
- The Pound appears only in the Extended Cut, only with `rescue.climaxEligible`, and only if Pokémon are still impounded.
- Pokémon returned at the Breather are at 50% HP and usable at once.
- A Lost Pound removes nothing; climax victory still returns everything.
- All 64 new stage lines and 8 beaten-to-it lines resolve with no empty slots.
- The success probability stays within 0.35–0.95 for every plan and every input.
