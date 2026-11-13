# RUN EVENTS — EXPANDED EDITION

**Extends:** `docs/RUN_EVENTS.md`, which is generated from `tools/events_source.js` and has itself been grown in place
**Read with:** `docs/expanded/BETA_06_DESIGN_DOCUMENT_EXPANDED.md` §X8 (story events), `docs/expanded/BETA_06_SYSTEM_ARCHITECTURE_EXPANDED.md` §X10 (the quiet-node scheduler)
*Every event is original to this project.*

---

## X1. What changed

`docs/RUN_EVENTS.md` is built from data, so it was expanded by adding events to its source and rebuilding, not by writing beside it. This file is the design note for what was added.

| | Before | Added | Now |
| --- | --- | --- | --- |
| Events | 102 | 104 | **206** |
| Forced events | 43 | 32 (FE-44 to FE-75) | 75 |
| Encounters | 59 | 72 (EN-60 to EN-131) | 131 |
| Categories | 15 | 11 new; 2 existing ones extended | 26 |
| Flags | 12 | 10 | 22 |
| Words in the generated document | 8,383 | about 9,750 | 18,137 |

**The base 102 events are untouched.** Their ids, text, weights and cooldowns are exactly as they were.

**Run events and story events are different pools.** A *story event* (`xe.<region>.<slug>`) is written in a region's script and belongs to that team's plot. A *run event* (`FE-` or `EN-`) is general: it can happen in any region where its conditions hold. The new run events are the general-purpose side of the Expanded Edition: they let the track, the cast, the Shadow system, the liaison and the roaming teams show up on an ordinary road, between the scripted scenes.

---

## X2. The ten new flags

Every new event that depends on an Expanded system is gated by a flag. With that system off, or not yet in play, the flag is never set and the event never fires.

| Flag | True when | Cleared when | Events that need it |
| --- | --- | --- | --- |
| `trackHigh` | The region's world-state track is at step 3 or more | The track falls below 3 | FE-44 to FE-51; EN-61, EN-65 to EN-68 |
| `extendedCut` | `climax.cut = "extended"` | The setting is changed | FE-52 to FE-56, FE-58, FE-59; EN-79, EN-130 |
| `hasShadow` | Any Shadow Pokémon is in the party | None is | FE-60, FE-61, FE-64; EN-80 to EN-83, EN-85, EN-94 |
| `keyHinted` | A Named Shadow in the party has had at least one key hint | Its key is met | FE-65; EN-84, EN-87 |
| `grandArc` | `grandArc.enabled = true` | The setting is turned off | FE-66 to FE-71; EN-96 to EN-102 |
| `liaisonSeen` | The region's liaison has appeared (FE-66, or a script scene) | The region ends | FE-67, FE-68; EN-98, EN-99 |
| `romHeld` | The player holds at least one Data ROM | Never, within a run | FE-70; EN-101 |
| `friendPresent` | A second rival exists in this region | The region ends | EN-88, EN-89, EN-91 |
| `trioFriendly` | Trio reputation is +15 or more | It falls below +15 | EN-102, EN-106 |
| `wesMet` | Wes has been met in any event this run | Never, within a run | EN-108 |

The twelve base flags (`insideMan`, `impounded`, `raidFailed`, and the rest) are unchanged, and several new events use them alongside the new ones.

---

## X3. The event director, unchanged and extended

### X3.1 What did not change

The director's rules in `RUN_EVENTS.md` §1 are the same: one event per node; forced events at `clamp(0.06 + 0.0015·Heat, 0.06, 0.20)`; encounters at 0.22; **five** forced events and **ten** forced battles per region at most; gaps after each; a pity encounter after five quiet nodes; and no event can end a run.

Doubling the pool does not double how many events a region has. It doubles how many *different* ones a player can meet across runs.

### X3.2 What was added

| Rule | Value | Why |
| --- | --- | --- |
| **Story beats do not spend the battle budget** | A forced event with no battle (FE-48, FE-58, FE-65, FE-66, FE-69, FE-71, FE-75) counts toward the five forced events per region, and not toward the ten forced battles | They are scenes. Seven of the 32 new forced events are of this kind |
| **Shared spacing with story events** | A run event and a story event (`xe.*`) never occupy adjacent nodes | So a region does not read as one long cutscene |
| **Quiet-node priority** | Run events are last in the quiet-node scheduler's order, after the Rescue Plan, rival scenes, the Friend, story events, roaming beats and postcards | The scripted middle of a region is protected |
| **Once-per-run beats** | Events marked *once per region* that introduce something (FE-66 the liaison; EN-103 the girl who sees auras; EN-131 the cut choice) are suppressed after their subject has been introduced another way | Nothing is introduced twice |
| **Flag weight** | Unchanged: an event whose required flags are all set has double weight. Because the new events mostly carry flags, they come forward exactly when their system is in play | A player keeping a Shadow Pokémon sees Shadow events; a player who is not, does not |

### X3.3 A region's mix, in practice

With default settings, a region of about forty nodes has roughly: five story events, five forced run events (of which one or two are story beats), six to eight encounters, three to five ambushes, the roaming team's beats, and the rival's and Friend's scenes. The run events added here compete for the same six to eight encounter slots and five forced slots as before.

---

## X4. The new categories

| Category | Kind | Events | What it is for |
| --- | --- | --- | --- |
| **World-state pressure** | Forced | FE-44 to FE-51 (8) | The track made physical: a closed road, a taken shop, a blackout, a requisition, the Leader's announcement. Each has a way round that costs a node and no battle |
| **Named officers** | Forced | FE-52 to FE-59 (8) | The Expanded cast met on the road: an officer with a name, a what-if face, a Handler with a special Pokémon, and four Inside Man beats including the runner |
| **Shadow and Reclaim** | Forced | FE-60 to FE-65 (6) | Reclaim, the Surge transmitter, a Snag attempt on the player, a wild bound Pokémon, an officer's challenge, and the moment a key is near |
| **Liaison and Cipher** | Forced | FE-66 to FE-71 (6) | The man with the clipboard, a numbered crate, a demonstration, an invoice, a buy-back, and the farewell note. Four of the six have no battle |
| **Roaming cast** (extended) | Forced | FE-72 to FE-75 (4) | Double Booking, the machine of the week, the mark, the Curtain Call |
| **Track scenes** | Encounter | EN-60 to EN-69 (10) | Civilians under each step: what the baker heard, the queue, the back-door shop, the street that left, the last step named |
| **Special Pokémon** | Encounter | EN-70 to EN-79 (10) | Meeting a team's line and its named Pokémon outside battle: a tag removed, a trait overheard, one left behind, one returned, the Apex's move seen from a roof |
| **Keys and purification** | Encounter | EN-80 to EN-87 (8) | The new purification methods as scenes: the Long Walk, the Shared Table, the Crowd Chant, a key hinted, a key missed, the choice to Stabilize |
| **Rival and the Friend** | Encounter | EN-88 to EN-95 (8) | The Errand, the Eve, the keepsake at the entrance, the receipt, a postcard, a cellmate |
| **Liaison trail** | Encounter | EN-96 to EN-103 (8) | The Grand Arc at Street scale: a crate number, a maker's plate, a waveform on a napkin, Meowth reading a stencil, the girl who sees auras |
| **Roaming, expanded** | Encounter | EN-104 to EN-111 (8) | The Postcard beat, the Truce, a favor called in, the bill, Wes at the wall, Chobin, Looker |
| **Quiet moments** | Encounter | EN-112 to EN-119 (8) | Rests with a small choice: the Dossier open, a name given, two Pokémon asleep, an offering, the flask before the climax |
| **Regional** (extended) | Encounter | EN-120 to EN-131 (12) | One Street-scale scene per primary team's plan, the second team's opinion, an ally for the Siege Map, and the choice of cut |

---

## X5. Events that feed other systems

Some of the new events are the on-the-road entry point for a rule written elsewhere. These are the links.

| Event | Feeds | Rule it triggers |
| --- | --- | --- |
| FE-44 *The Road Is Closed*, FE-51 *Supply Line* | World-state track | FE-51, won, removes the step a failed raid added |
| FE-53 *The Familiar Face* | The Dossier | Writes a what-if character's way back into the Notebook |
| FE-54 *Handler and Hound*; EN-70, EN-71, EN-74 | Field Notes | Reveals a line rule or a signature trait before it is fought |
| FE-59 *The Honor Guard*; EN-130 *A District Worth Holding* | The Siege Map | One district starts Held; one more ally |
| FE-60 *They Have Come for One of Yours* | Reclaim (expanded Shadow document §X13) | This *is* the Reclaim attempt. A loss sends the named Pokémon to Impound, never further |
| FE-62 *Snag!* | The Snag Machines (§X11) | The player's side of a Snag: announced, dodged by switching |
| FE-65 *A Key Turns*; EN-80, EN-84, EN-87 | Keys (§X8) | Key hints one to three, and the missed-key fallback |
| FE-66 *The Man With the Clipboard* | `liaisonSeen` | Opens the liaison's other events |
| FE-67 *Samples* | The Stock track | Stopping the crate prevents a step |
| FE-70 *Late Fee* | Data ROMs | A lost battle never loses the ROM: it is copied |
| FE-71 *The Postcard From Elsewhere* | The Grand Arc's any-order rule | Names the run's actual next region |
| FE-72 *Double Booking*; EN-105 *Truce by Firelight* | `roaming.favors` | One favor each |
| EN-79 *The Signature Move, Rehearsed* | The Colossus plate | The Apex's signature move and warning line, or one part marked |
| EN-81, EN-82, EN-83 | Purification methods 12, 13 and 9 | The Long Walk (−3), the Shared Table (−8 or −12), the Crowd Chant (−15) |
| EN-85 *Stabilize, or Not* | Permanent members (base Shadow document §12) | The Stabilize choice, offered gently |
| EN-88 *The Errand*, EN-89 *The Eve* | The Friend (expanded, §X3) | These *are* the two new encounters |
| EN-90 *Something of Theirs* | `keepsakeBonus` in the Turn formula | The small object at the climax entrance |
| EN-92 *The Receipt* | The Rescue Plan (expanded, §X2.1) | The receipt as a Key Item |
| EN-95 *Cellmate* | The Rescue Plan (expanded, §X7.3) | A cellmate, with the *Found* scar |
| EN-110 *Evidence for the Detective* | Looker's Warrant | Makes a legal seizure possible |
| EN-115 *An Offering* | The Region of Doom's Memorial wall | An item left for a Pokémon from an earlier run |
| EN-116 *The Breather Before* | The Breather | +10% healing tomorrow, if saved |
| EN-131 *Standard or Extended* | `climax.cut` | The setting, asked in the fiction, at the Last Rest |

---

## X6. Fairness

Checked for all 104 new events, and enforced by the builder and the verifier for all 206.

1. **Every forced event has at least one way out**, and every new one has at least two. For the story beats, both ways out are simply the two things the player may do.
2. **No event ends a run.** The worst outcome of any new forced battle is the standard defeat rule, a common item, or one Pokémon sent to Impound, where the Rival Rescue Plan applies.
3. **No event takes a Data ROM, a Key Item or a Shadow Pokémon's purification progress.**
4. **No event forces Shadow use.** Every event gated on `hasShadow` is one the player opted into by keeping a Shadow Pokémon, and each can be walked past.
5. **Track events never raise enemy strength.** They close roads and raise prices; they do not add levels.
6. **Everything is announced.** FE-46's accuracy penalty, FE-60's whistle, FE-61's Surge and FE-62's Snag are all stated on the event card before the battle starts.
7. **Tiers are capped as before.** No new event uses a tier above Executive, and those that reach Commander or above are once per region.

---

## X7. Tests

In addition to the checks in `tools/verify_beta06.js` section 14:

- The base 102 events are byte-identical in `data/run_events.json` before and after the additions (ids FE-01 to FE-43 and EN-01 to EN-59).
- With every Expanded flag false, no event that carries an Expanded flag is eligible. New events that carry none (the quiet moments, the regional scenes, the roaming teams' beats) are general by design and remain eligible.
- Forced events per region never exceed five; forced battles never exceed ten; story beats are not counted as battles.
- No run event is placed on a node adjacent to a story event.
- FE-60 is offered at most once per region per team, and never when the named Pokémon is Stabilized and benched.
- FE-70 never removes a Data ROM.
- EN-131 changes `climax.cut` only at a Last Rest.
- Every event in X5's table writes the flag or value its row names.
