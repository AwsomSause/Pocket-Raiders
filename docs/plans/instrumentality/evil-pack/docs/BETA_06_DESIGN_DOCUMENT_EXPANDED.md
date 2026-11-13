# BETA 0.6 "YOU ARE (NOT) ALONE" — EXPANDED EDITION
## Design Document, Volume II

**Extends:** `docs/BETA_06_DESIGN_DOCUMENT.md` (Volume I; every rule there still holds; this volume adds to it)
**Read with:** `docs/EXPANSION_DESIGN.md` (the short note this volume grows from), `docs/GRAND_ARC.md`, the ten files in `scripts/expanded/`
*The teams and their leaders are canon. The formats, tracks, lines, codes, variant names and events specified here are original to this project. Numbers are launch defaults for tuning, not tested balance.*

---

## X0. Scope and reading guide

Volume I designs the Regional Evil Team Arc: ignition, pursuit, raids, a climax, and the systems under them. The Expanded Edition scripts then made that arc three to five times larger: wider stakes, longer climaxes, a named cast, special Pokémon, Apex Shadows, and one thread running through every region.

`EXPANSION_DESIGN.md` describes all of that in about eight hundred words. This volume is the full specification: everything an implementer needs to build the Expanded Edition without reading the ten scripts first.

| Section | Covers |
| --- | --- |
| X1 | Goals and promises for the Expanded Edition |
| X2 | The five scales |
| X3 | World-state tracks |
| X4 | Wide-scale battle formats: Siege Map, Blackout, Front, Convoy, Colossus, Debate |
| X5 | The Extended Cut |
| X6 | Expanded raids: Raids 4 and 5 |
| X7 | The special cast: named officers, team versions, variant lines, special Pokémon |
| X8 | Story events |
| X9 | The Grand Arc, as a system |
| X10 | Dialogue systems |
| X11 | Pacing and run length |
| X12 | Settings reference |
| X13 | Fairness and anti-frustration, Volume II |
| X14 | Content totals |
| X15 | New screens |
| X16 | Team by team: design notes |
| X17 | A worked Extended Cut |
| X18 | Decisions: confirmed, assumed, open |
| X19 | Glossary |

**How Volume II sits beside Volume I.** Nothing in Volume I is replaced. Where the two touch, Volume I's bounds win: raid effects stay inside ±2 Operation Strength tiers, win-rate bands are unchanged, and the confirmed decisions D1–D9 hold in every new system.

---

## X1. Goals and promises

### X1.1 What the Expanded Edition is for

1. **Scale.** The base arc is a team taking a building. The Expanded Edition is a team taking a region, and something behind the team taking the world.
2. **People.** Every team gains named officers with voices, and familiar characters seen from an unfamiliar side.
3. **Pokémon as characters.** Special Pokémon and special Shadows have names, histories and, where it fits, keys.
4. **A longer last act.** The climax becomes a night, not a fight.
5. **One thread.** A reason to play the ninth region that the first region set up.

### X1.2 Seven promises

Volume I makes design promises (§1.3). Volume II adds seven. Every system below is checked against them.

| # | Promise | What it rules out |
| --- | --- | --- |
| P1 | **Bigger is never unfair.** A longer climax has more protection, never less | Extended climaxes without a Breather or save points |
| P2 | **Everything new can be turned off.** Each layer has a setting and the game is whole without it | Content that only makes sense with the Grand Arc on |
| P3 | **Any order.** No region needs another region to have come first | Scenes that say "as you saw in Kanto" |
| P4 | **No new way to lose a run.** D1 is the only run-ending rule, and the finale relaxes it | Events, raids or tracks that end a run |
| P5 | **Announced.** Every special trait, signature move, format rule and track effect is shown before it matters | Hidden modifiers; surprise mechanics |
| P6 | **Named things are in your Pokédex.** Every special Pokémon is a species the game already has | Invented species |
| P7 | **Shadow use stays optional.** No route, key or format requires the player to field a Shadow Pokémon | Shadow-gated content |

---

## X2. The five scales

Every expanded script opens by restating its team's plan at five scales. The scales are a writing tool and a scheduling tool.

| Scale | The plan at this size | The player meets it as | Typical content |
| --- | --- | --- | --- |
| 1 **Street** | What the team does to one person | Ambushes, one shop, one stolen Pokémon | Story events tagged Street; ambush lines; step 1 of the track |
| 2 **City** | What it does to a town | A hideout, a front business, a mayor who has stopped asking | Raids 1–2; City events |
| 3 **Region** | What it does to the map | Roads closed, weather changed, a landmark taken | Raids 3–5; the Siege Map; Region events |
| 4 **Border** | What leaks out | Shipments, refugees, a visitor from outside | The liaison; one Border event; the farewell note |
| 5 **World** | What it is part of | The supplier behind every team | The Apex; the Data ROM; the finale |

### X2.1 Rules

1. **Order of discovery.** A region reveals its scales in order. No World-scale fact is stated before the player has seen the Region-scale one it rests on.
2. **Scale tags.** Every story event, raid and climax phase carries one scale tag. The Notebook groups entries by it.
3. **Pacing budget per region.** At least two Street beats before the first City beat; no more than one Border beat before Raid 2; the World scale appears first as an unexplained detail (a crate stencil, a waveform, a man with a clipboard) and is explained only in the climax.
4. **The scale badge.** A small five-pip badge in the Notebook shows how much of the plan the player has seen. It is a reading aid, not a score.

### X2.2 The nine plans

| Region | Street | City | Region | Border | World |
| --- | --- | --- | --- | --- | --- |
| Kanto | "Insurance" from shops; Pokémon stolen to order | Celadon run through the Game Corner; Black-Label kennels | Saffron's roads closed; the Safari Zone poached; fossils revived as weapons | Rigged Pokémon shipped out of Vermilion | Cipher's pulse, paid for in data; Project M2 |
| Johto | Slowpoke tails; the pulse tested on strays | The Radio Director replaced; a midnight show of coded orders | The Lake of Rage; the three beasts; a young Lugia | Freight in at Olivine; the signal pushed east | Celebi in a Dark Ball, so Archer can go back to before the Boss left |
| Hoenn | Resonators tested on wells and hot springs | The Weather Institute raided | The meteorite, the submarine, the Eon twins | Identical resonators from one dealer; weather past the coast | Both titans woken at once, as a third party intended |
| Sinnoh | "Wellness clinics" that return Pokémon empty | A third of the region's power drawn off | The three lake guardians taken | A hunter with an airship; the chain's design shared | Time and space held still to subtract spirit from everything |
| Unova | Speeches, then "safekeeping" | Castelia's sewers as a depot | Opelucid frozen; N's castle raised | The five bridges closed | Kyurem fused; the region sealed |
| Kalos | Memberships: a suit and a place on the list | Lumiose blacked out | Mega energy, a jewel, a fossil king and a film star's partner drained | A Holo Caster in every pocket | A weapon that spares only the list |
| Alola | Tags, blocked bus stops, "borrowed" Pokémon | Po Town held; Aether paying for it | Pokémon collected "for conservation", a guardian among them | The wall to Ultra Space thinned | The gate opened, so one woman need never be left |
| Galar | A logo on everything | Insurance against a disaster nobody has heard of | The dens capped; the Weald's guardians woken badly | Trains and flights stopped; Wishing Stars exported | The Darkest Day, on live television |
| Paldea | Kids who stopped going to class | Five Bases; an ultimatum | Eighteen months ago, reports were deleted | A man with silver hair, offering scholarships | Five Starmobiles are the cheapest Shadow engine ever built |

---

## X3. World-state tracks

### X3.1 What a track is

Each team has one five-step track, named for its plan. The track is how the region shows that the team is winning or losing *outside* the player's battles.

| Rule | Value |
| --- | --- |
| Range | 0–5, stored per region as `<team>.x.<track>` |
| Starts at | 1 at Ignition |
| **Gains a step** | A raid is Failed or Declined; the climax is scheduled; 12 nodes pass with no raid attempted |
| **Loses a step** | A raid Success or Triumph; a named officer is turned; one specific event per region (the script names it) |
| Floor during a region | 1. A team that has ignited is never at 0 until it is beaten |
| At the climax | The step count is read once, in Phase 0, and sets the Siege Map's starting state (X4.1) |

### X3.2 What a step may change

A step changes **what the region looks and feels like**, and **one small rule**. It never changes trainer levels, team sizes or AI, which follow Volume I's difficulty curve.

| A step may | A step may not |
| --- | --- |
| Change civilian lines, radio, weather, lighting, music | Raise enemy levels or add Pokémon to enemy teams |
| Change shop stock or prices by up to ±15% | Close every shop or Pokémon Center in the region |
| Add one announced field rule on some routes (dark nights, static, frost) | Add a rule that cannot be countered or avoided |
| Change which wild Pokémon appear | Remove healing from the region |
| Add or remove one optional event | Block the route to the next Gym (decision D4) |

### X3.3 The ten tracks

| Team | Track | Flag | Steps 1 → 5 |
| --- | --- | --- | --- |
| Team Rocket | *The Ledger Fills* | `rocket.x.ledger` | Small Print → House Rules → Closed Roads → Export → Under New Management |
| Rocket Returns | *The Signal Spreads* | `rocket-return.x.signal` | Static → Jingle → Rage → Carrier Wave → The Call |
| Aqua and Magma | *The Long Weather* | `hoenn.x.weather` | Drizzle and Drought → Blue Dawn, Red Dusk → The Swing → Spill → The Awakening |
| Team Galactic | *The Subtraction* | `galactic.x.subtraction` | Quiet → Brownout → A lake taken (memory, feeling or will) → The Hum → Zero Hour |
| Team Plasma | *The Frost Line* | `plasma.x.frost` | Pamphlets → Let Go → The Frost Line → The Bridges → The Crown |
| Team Flare | *The Guest List* | `flare.x.guest-list` | Invitations → Blackout → Members First → Prime Time → Countdown |
| Skull and Aether | *Noise and Silence* | `alola.x.quiet` | Tags → Borrowed → Donations → Thin Places → The Gate |
| Macro Cosmos | *The Forecast* | `galar.x.forecast` | Sponsored → Tremors → Red Cloud → Service Suspended → Launch Day |
| Team Star | *Attendance* | `star.x.attendance` | Empty Desks → Five Bases → Ultimatum → Buyers → Barrage |
| Cipher | *The Stock* | `cipher.x.stock` | Samples → Shipments → Three Beasts → The Reading → Complete |

**Sinnoh's third step is three steps in one.** Each lake guardian taken removes one thing from the region (the map loses detail; bond effects weaken; the player's Pokémon hesitate), and each is restored when that guardian is freed. Only one counts toward the track.

**Cipher's track is different in kind.** It is not per region. It runs across the whole run, gains from regional results, loses one step per three Data ROMs, and is read only at the finale (X9).

### X3.4 How the player sees it

- **The Notebook** has one page per region with the track drawn as five boxes, the current step named, and the next step named in grey: the player always knows what happens if they do nothing.
- **Each step has a moment.** The first time a step is gained, a ten-second scene shows it happening: the roads closing, the first snow on the bridge, the logo going up.
- **Each step has a line** from any civilian (X10.2), so that a player who skips scenes still hears it.

### X3.5 Worked example

A Kanto player declines Raid 1, wins Raid 2, fails Raid 3 and schedules the climax.

| Moment | Track | What they see |
| --- | --- | --- |
| Ignition | 1 *Small Print* | Shopkeepers mention "insurance" |
| Raid 1 declined | 2 *House Rules* | Celadon's Game Corner is open all night; prices in Celadon +5% |
| Raid 2 Success | 1 *Small Print* | The Game Corner is shut for "refurbishment" |
| Raid 3 Failure | 2 *House Rules* | Open again |
| Climax scheduled | 3 *Closed Roads* | Two Snorlax on the Saffron roads; the news report mentions them |

The climax opens at step 3, so the Siege Map starts with one district Lost (X4.1).

---

## X4. Wide-scale battle formats

Volume I's battles are one trainer against another. The Expanded Edition needs fights the size of a city, a chase, or a god. Six formats cover it. Each is a thin layer over ordinary battles, so that no new battle engine is required.

| Format | In one line | Used in |
| --- | --- | --- |
| **Siege Map** | The climax city as districts that can be Held, Contested or Lost | Phase 0b, every region |
| **Blackout** | A battle under a team-wide condition that an objective can switch off | Phase 1, most regions |
| **Front** | Three one-on-one lanes at once | Alola and Galar Phase 7; the finale; Stand-with Phase 5 |
| **Convoy** | A chase of 3–5 battles with a distance meter | Kanto, Unova, Kalos Phase 7; Galar Phase 1; the finale |
| **Colossus** | A boss with parts and shield bars | Phase 6, every region |
| **Debate** | An argument fought with evidence | Paldea Phase 7 |

### X4.1 Siege Map

**What it is.** A map of the climax city or region, split into **four to six districts**. Each district is in one of three states.

| State | Meaning | Effect |
| --- | --- | --- |
| **Held** | An ally is standing there and it is safe | Gives its **benefit** (one per district, listed on the map) |
| **Contested** | Nobody has it yet | Nothing, until Phase 1 ends |
| **Lost** | The team has it | Applies its **effect** (one per district, listed on the map) for the rest of the climax |

**Setup (Phase 0b).**

1. Each script has a district table saying what makes each district **Held** at the start: a raid result, an ally, a flag (for example, Galar's five stadiums after a Triumph in *The Final*, or Saffron's East Gate if the ghosts of Pokémon Tower were freed). Every other district opens **Contested**, except that one of them starts **Lost** for each track step above 2 (so a region at step 5 opens with up to three Lost). The script lists the order in which districts fall.
2. The player assigns **allies** to districts: the rival (Help variant), the second rival, regional allies earned in events and raids, and anyone the scripts name. Each ally holds one district. A Held district cannot be Lost.
3. The player may claim **one** Contested district personally: it adds one battle to Phase 1 and becomes Held when that battle is won.

**Resolution.** At the end of Phase 1, every district still Contested becomes Lost.

**Limits.**

- No more than **three** Lost effects are active at once. If more are Lost, the player sees which three apply (the three listed first on the map) and the rest are cosmetic.
- No Lost effect changes enemy levels or adds enemy Pokémon. The standard list is below; scripts pick from it and rename.
- A Lost district can be **retaken** once during the climax by spending a Rival Assist or by a script event.

**Standard benefits and effects.**

| District type | Held: benefit | Lost: effect |
| --- | --- | --- |
| Hospital, Center | The Breather heals 75% instead of 50% | The Breather revives nobody |
| Harbor, station | One extra turn on every timer | One fewer turn on every timer |
| Market, depot | One free item at the Breather | Item use costs the turn *and* the next turn's priority |
| Broadcast, tower | The enemy's first move each battle is revealed | The player's first move each battle is revealed to the AI |
| Power, plant | The Blackout condition ends one turn sooner | The Blackout condition cannot be ended until Phase 2 |
| Residential | Civilians cheer: +1 to one stat on entry, once per battle | Civilians in the way: the first spread move each battle fails |
| The Pound (only if Pokémon are impounded) | Impounded Pokémon return at the Breather | Nothing more is lost (they return on victory) |

**What the player sees.** One screen, before the fighting starts: the map, the districts, the allies as portraits to drag onto it, and for each district both lines of text. Nothing on the Siege Map is hidden, and once Phase 1 starts it cannot be reopened, only viewed.

**Dressing.** Scripts dress the map to fit the place. Kanto's districts are Saffron's four gates and its center, and the player enters through one of them; Unova's are five bridges; Alola's are four islands. Every version obeys the rules above.

**Why it exists.** It is where the whole region's play pays out in one image. Every raid, every ally and every step of the track is on that screen.

### X4.2 Blackout

**What it is.** One announced condition lies over every battle of a phase. One **switch** ends it.

| Part | Rule |
| --- | --- |
| The condition | One rule, named and shown: darkness (accuracy −1 for both sides), static (sound-based moves fail), frost (the first Pokémon out is slowed), a sealed building (no fleeing, no switching on the first turn), and so on. The script chooses |
| The switch | A marked objective. It is reached by winning a set number of the phase's battles (usually two of three), or by a **Go for the Switch** action |
| Go for the Switch | Spends the player's turn. The active Pokémon does not attack. If it is still standing at the end of the turn, the switch's counter advances by one. Three advances end the condition |
| When it ends | The condition is gone for the rest of the climax, and the team loses whatever it was getting from it |
| If it never ends | It lapses anyway at the Breather. A Blackout never follows the player into the second half |

The condition always affects both sides. The team's Pokémon are built for it (Volume I's Doctrines work the same way), so it favors them, and ending it is worth a turn or two. It is never required.

### X4.3 Front

**What it is.** Three one-on-one battles side by side: three **lanes**. It is how the game stages a line being held.

| Part | Rule |
| --- | --- |
| Setup | The player assigns one or two Pokémon to each lane before the fight (the lane's reserve). An ally assigned to a lane brings their own |
| Turns | Each turn the player gives **one command, in one lane**. Lanes held by an ally act by themselves. A lane with neither the player's command nor an ally **holds**: its Pokémon guards (takes 50% damage, does not attack) |
| The other side | Each enemy lane acts every turn against a commanded or allied lane, and **every second turn** against a holding lane |
| A lane is **won** | When its enemy has no Pokémon left. Its Pokémon may then be moved to another lane as reserve (one move, costs no turn) |
| A lane is **lost** | When its reserve is gone |
| The Front is **won** | At two lanes won |
| The Front is **lost** | At two lanes lost. In an optional phase this ends the phase only. In a required one it is a climax loss (decision D1), and the Situation Report says which before the phase begins |

**Fairness.**

- Enemy lanes are built at the gauntlet's level, not the boss's. Three lanes are three ordinary trainers.
- With no allies at all, the player still commands one lane per turn while the others guard. A player with no allies can win a Front; it takes about half again as many turns.
- Spread moves do not cross lanes. Weather and terrain apply to all three.
- The interface shows all three lanes at once, with the commanded lane in front. Switching the commanded lane costs nothing.

### X4.4 Convoy

**What it is.** A chase: three to five battles in a row against something that is getting away.

| Part | Rule |
| --- | --- |
| The meter | **Distance**, 0–5. It starts at 3 |
| Each battle | Has a **par** (a turn count shown before it starts, usually 5–7). Win at or under par: Distance −1. Win over par: Distance +1. Par is never hidden |
| Between battles | No full rest. Heal 20% "on the move". Items may be used |
| **Caught** | Distance 0 at any point, or the last battle won with Distance 2 or less. The Convoy succeeds |
| **Escaped** | Distance 5 at any point, or the last battle won with Distance 3 or more |
| A wipe | Follows the rule of the phase the Convoy sits in |

**What Escaped means** depends on where the Convoy is.

| Convoy | If the target escapes |
| --- | --- |
| An optional Phase 7 (Kanto's *Long Drive*, Unova's *Thaw*, Kalos's *Rock Over Anistar*) | The phase's prize is lost. The climax result stands |
| A required Phase 1 (Galar's *Last Train to Wyndon*; the finale's *Crossing*) | The player still arrives, late: one more district is Lost on the Siege Map. It is never a climax loss by itself |

**Help.** A Rival Assist (*Close the Gap*) or a raid result may move the meter one step or shorten the Convoy by one battle. Convoys never have more than five battles.

### X4.5 Colossus

**What it is.** A boss with **parts**. The body cannot be knocked out while a part stands; each part has a shield bar; breaking a part removes one of the boss's moves; the last part is its obedience, and breaking it ends the fight without a knockout.

The full rules are in `docs/expanded/SHADOW_POKEMON_SYSTEM_EXPANDED.md` §X9, because every Colossus in the Expanded Edition is an Apex Shadow. In summary:

| Rule | Value |
| --- | --- |
| Parts | 2–5 per Apex (XD001 has up to nine locks, at two-thirds shield each) |
| Shield per part | 14% of the Apex's max HP at Set-1, rising 2 points per Set to 30% at Set-9 |
| Timer | 12 turns at Set-1 and Set-2, falling to 9 at Set-8 and Set-9; scripts adjust |
| Signature move | Announced one turn ahead; always among the first two moves removed |
| Help | Raids, allies and items crack or break parts, or add turns. They never weaken the Apex itself |
| The player's own Shadow Pokémon | +10 Surge per turn beside an Apex; no Corruption cost for fighting one |

The Colossus is the one format that is always a required phase.

### X4.6 Debate

**What it is.** An argument, in front of an audience, decided by what the player can prove. It is used once, in Paldea, and is specified as a format so that it can be used again.

| Part | Rule |
| --- | --- |
| Exchanges | Three. In each, the opponent makes one claim |
| Evidence | The player answers with a **Key Item or a flag** earned earlier in the region. Each exchange lists two things that win it. Evidence is never consumed |
| No evidence | The player may still answer, with a plain statement. It does not win the exchange |
| Result | Three wins: no battle. Two wins: no battle, and the opponent objects for one line. Fewer: one battle against the opponent, at Leader-fight rules, in front of the room |
| Losing the battle | The Debate is an optional Phase 7. Losing it changes the Resolution's tone. It does not end the run |

**Design rule.** A Debate may only ask for evidence the region's raids and events could have supplied, and the Situation Report lists how many of the six pieces the player holds, without naming them.

### X4.7 Rules common to every format

1. **One screen of explanation, once.** The first time a format appears in a run, a single card explains it. After that, a one-line reminder.
2. **Ordinary battles underneath.** Every format resolves into normal battles with normal rules. A player who understands a Pokémon battle can play all six.
3. **AI tier.** Formats use the phase's AI tier from Volume I (§7.4). No format has its own smarter AI.
4. **Announcements.** Every format-level event (a district falling, a lane lost, the meter moving, a part breaking, a claim made) has a line of text and a sound.
5. **Timers are generous.** A format's timer is set so that a reference party finishes with two turns to spare, as in Volume I.
6. **Accessibility.** Each format's state is readable without color: districts carry letters (H, C, L), lanes carry numbers, the Convoy meter is a row of pips, Colossus parts are named.
7. **Standard Cut.** With `climax.cut = "standard"` no wide format appears and the base climax plays as written.

---

## X5. The Extended Cut

### X5.1 The template

| # | Phase | Format | New or base | Battles | Scale |
| --- | --- | --- | --- | --- | --- |
| 0 | Broadcast and choice | News report, Situation Report, Last Rest | base | 0 | Region |
| 0b | **The Siege Map** | Siege Map | new | 0 | Region |
| 1 | **The approach** | Blackout or Convoy | new | 2–3 | City |
| 2 | The gauntlet | Trainer battles, with new floors | base, extended | 4–7 | City |
| 3 | The officers | Duels: Executives, the Second, the liaison | base, extended | 2–3 | Region |
| — | **Breather** | Rest | new | 0 | — |
| 4 | The set piece | The team's signature objective | base | 1–2 | Region |
| 5 | The Leader | Boss | base | 1 | Region |
| 6 | **The Apex** | Colossus | new | 1 | World |
| 7 | **Optional or conditional** | Convoy, Front, Duel or Debate | new | 0–4 | Border |
| 8 | Resolution | Choices, the liaison's note, the thread | base, extended | 0 | World |

**Total battles: 13–18** (Standard Cut: 8–12).

### X5.2 What protects the longer climax

| Protection | Rule |
| --- | --- |
| **The Breather** | After Phase 3. Heal 50%, revive one Pokémon, no shop. Siege Map results may raise the heal to 75% or lower it to 35%; it is never below 35% |
| **Two save points** | After Phase 2 and at the Breather. The game may be saved and quit there and resumed there. These are *not* retries: decision D1 holds, and a wipe at any phase from 1 to 6 ends the run. With `climax.allowWithdraw` on (off by default, decision D9), these are also the two points at which the player may withdraw |
| **Phase 7 cannot end the run** | It comes after the Apex is freed. Losing it costs its prize |
| **Help scales with length** | The Rival Assist budget and ally count are sized to the Extended Cut (see the expanded rival documents) |
| **The readiness label** | The Situation Report's label (Risky / Even / Likely / Safe) is computed for the cut in use |
| **The Standard Cut** | One setting away, at any Last Rest |

### X5.3 Win-rate bands

Volume I's bands are kept for the phases they were written for, and the new phases are placed inside them.

| Phases | Band for a balanced reference party |
| --- | --- |
| 1–2 (approach, gauntlet) | 40–60% |
| 3–5 (officers, set piece, Leader) | 35–55% |
| 6 (Apex) | 45–65%: it is the spectacle, not the wall. The wall was Phase 5 |
| Whole Extended Cut | 30–50%, the same as the Standard Cut. The extra battles are paid for by the Breather and the Siege Map |

### X5.4 The ten climaxes

| Region | 0b Siege Map | 1 Approach | 6 Apex | 7 Optional |
| --- | --- | --- | --- | --- |
| Kanto | The Sealed City | The Streets (Blackout) | The Roof: Project M2 | The Long Drive (Convoy) |
| Johto | Goldenrod Under Static | The Underground (Blackout) | The Welcome: Dark Celebi | Tohjo Falls, Three Years Ago (Duel) |
| Hoenn | Sootopolis Divided | The Crater Lake (Blackout) | The Awakening: Abyssal and Cinderheart | The Sky Pillar (Duel) |
| Sinnoh | The Mountain Under Siege | The White Tunnel (Blackout) | Zero Hour: Stillhour and Farshore | The Distortion World (Duel) |
| Unova | The Five Bridges | The Frost Line (Blackout) | The Crown: Absolute | The Thaw (Convoy) |
| Kalos | Kalos on Every Screen | The Stones of Route 10 (Blackout) | The Flower Opens: The Battery | The Rock Over Anistar (Convoy) |
| Alola | Four Islands | The Crossing (Blackout) | The Deep: The Mother Beast | The Beasts Come Through (Front) |
| Galar | Five Stadiums | The Last Train to Wyndon (Convoy) | The Darkest Day | Their Majesties' Encore (Front) |
| Paldea | The Five Bases | The Long Walk to School (Blackout) | The Cassiopeia Engine | The Assembly (Debate) |
| Finale | The Alliance | The Crossing (Convoy) | XD001 | The Rainbow Door (Front) |

### X5.5 Moving a base sub-stage

Several base scripts end their Leader fight with the Leader summoning the region's Legendary. In the Extended Cut that sub-stage is lifted out of Phase 5 and becomes Phase 6, so that the Leader fight ends on the Leader and the Apex has a phase to itself. The battle count of Phase 5 is unchanged; nothing is fought twice.

---

## X6. Expanded raids

### X6.1 Raids 4 and 5

Volume I gives each team up to three raids. The Expanded Edition adds two per region, and **deepens** the base three (one new room, one new named officer or special Pokémon, and one extra secondary objective each).

| Rule | Value |
| --- | --- |
| Offered | Raid 4 after Raid 2 resolves; Raid 5 after Raid 3 resolves, or when the track reaches step 4 |
| Optional | Always. Declining adds a track step, as for any raid |
| Framework | Volume I §6 in full: the Pseudo Region, the five results, Fall Back, the consequence menu on Failure, and no run-ending wipe |
| Scale | Raid 4 is Region scale. Raid 5 is Region or Border scale and is where the liaison is usually first seen clearly |
| Lever | Each new raid has its own named Lever, which changes one thing in the Extended Cut |

### X6.2 The bound still holds

Five raids could move the climax further than three. They do not: **the total effect of all raids on Operation Strength is still clamped to ±2 tiers** (Volume I §6.6). What Raids 4 and 5 add is *sideways* rather than *down*: they change the Siege Map, the Apex's parts, and who stands with the player.

| A new raid's Lever may | It may not |
| --- | --- |
| Start a Siege Map district Held | Lower enemy levels |
| Start one Colossus part cracked or broken | Remove the Leader fight |
| Remove one named officer's duel from Phase 3 | Remove the Apex |
| Add an ally | Add more than one Assist beyond the format budgets |
| Make Phase 7 unnecessary | Change the rival's variant |

### X6.3 The twenty new raids

| Region | Raid | Site | Lever | On a Triumph |
| --- | --- | --- | --- | --- |
| Kanto | 4 *The Vermilion Manifest* | `pr.kanto.vermilion-docks` | The Manifest | Phase 7's Convoy is one battle shorter; LEDGER can join |
| Kanto | 5 *Safari Night Poach* | `pr.kanto.safari-night` | The Herd | A Tauros stampede clears one district |
| Johto | 4 *The Burned Tower Hunt* | `pr.johto.burned-tower` | The Three | Each beast clears a Contested district; none is shipped out |
| Johto | 5 *The Silver Net* | `pr.johto.whirl-islands` | The Storm | The static condition is gone from Phase 2 |
| Hoenn | 4 *The Eon Twins* | `pr.hoenn.southern-island` | The Twins | Two Orb links start cracked in Phase 6 |
| Hoenn | 5 *Mossdeep Launch* | `pr.hoenn.space-center` | The Fuel | Cinderheart enters Phase 6 one tier lower |
| Sinnoh | 4 *The Side Deal* | `pr.sinnoh.stark-mountain` | The Side Deal | Charon's duel is removed from Phase 3 |
| Sinnoh | 5 *The Three Machines* | `pr.sinnoh.veilstone-hq` | The Three Spirits | Each free guardian breaks one Red Chain pulse |
| Unova | 4 *Opelucid Under Ice* | `pr.unova.opelucid-ice` | The Splicers | Absolute has two wedges, not three |
| Unova | 5 *The Coronation* | `pr.unova.plasma-castle` | The Faithful | Every old-uniform Grunt is gone from the climax |
| Kalos | 4 *The Gala at Parfum Palace* | `pr.kalos.parfum-palace` | The Ledger | Half the members stay home; Phase 6's first pulse is weaker |
| Kalos | 5 *The Megalith* | `pr.kalos.megalith` | The Megalith | Phase 7 is not needed |
| Alola | 4 *The Guardian in Glass* | `pr.alola.ruins-of-life` | The Guardians | All four guardians hold their islands; Phase 7 cannot be lost |
| Alola | 5 *The Fifth Island* | `pr.alola.aether-gala` | The Decoy | No Skull Grunts in the climax; Guzma fights beside the player |
| Galar | 4 *The Capped Dens* | `pr.galar.wild-area-dens` | The Dens | The Darkest Day has two feeds, not three |
| Galar | 5 *The Final* | `pr.galar.wyndon-stadium` | The Crowd | All five stadiums start Held |
| Paldea | 4 *The Buyers* (the player defends) | `pr.paldea.ruchbah-base` | The Fifth Engine | The Cassiopeia Engine has four cores, not five |
| Paldea | 5 *The Old Wing* | `pr.paldea.academy-old-wing` | The Record | Phase 7 can be won without a battle |
| Any | 5 *The Under* | `pr.any.the-under` | The Broadcast | The Stock track loses a step; one fewer wave at the finale |
| Any | 6 *The Key Lair* | `pr.any.cipher-key-lair` | The Chamber | XD001 has one fewer lock; the Purify Chamber is unlocked |

Every raid's full result table (Triumph, Success, Partial, Failure, Declined) is in its script.

### X6.4 A defended raid

Paldea's Raid 4 inverts the form: Team Star's Base is the one being raided, by Cipher's buyers, and the player defends it. A defended raid uses the same result table, with **hold** objectives in place of **reach** objectives, and its Failure consequence menu is drawn against the team being defended, not the player: the player cannot be Impounded for failing to protect someone else.

---

## X7. The special cast

The Expanded Edition names 143 people, 110 special Pokémon and 58 special Shadow Pokémon. Three small systems keep them consistent.

### X7.1 Named characters (`sc.<team>.<slug>`)

Each expanded script adds two tables: **new officers and specialists**, and **team versions of characters you know**.

| Field | Rule |
| --- | --- |
| Rank | One of Volume I's ranks (§5.2), or a role outside the ladder: Ally, Liaison, Civilian, Consultant, Hostage |
| **Based on** | Exactly one of three marks (below) |
| Role | One of Volume I's roles (§5.3), with a one-line description |
| Ace or signature | A Pokémon, a special Pokémon id, or "none" for those who do not battle |
| Voice | A few words on how they speak, so that any line written for them later matches |

**The three marks.**

| Mark | Meaning | Count | Rule |
| --- | --- | --- | --- |
| **canon** | A character from the games, anime or manga, in a role they could plausibly hold | 80 | Keeps their canon team, types and manner. Dialogue is original |
| **what-if** | A canon character on the *other* side: a Gym Leader as a Rocket officer, a Champion's partner bound, the rival in a uniform, the player with a code name | 45 | Always explained in the script (why they are there, what it would take to turn them), and always reversible within the region |
| **original** | A character invented for this project | 18 | Never mistaken for canon; never given a canon character's signature Pokémon |

**What-if characters and settings.** A player who does not want Gym Leaders on a team can turn that off where it applies (`rocket.x.triad` in Kanto: the turned Gym Leaders become unnamed Executives with the same teams). Decision D4 is unaffected either way: a Gym Leader who appears in a what-if role still runs their Gym, and the Gym is never locked.

**Every what-if is a person to win back.** The scripts give each one a condition under which they stand down or change sides. The condition is always something the player can do, and the Situation Report counts how many have been met.

### X7.2 The player and the rival as cast

Two what-if entries per team are always present:

- **The player's team version**: the code name used on the Inside Man and Stand-with routes (`STAND_WITH_THEM_EXPANDED.md` §X2).
- **The rival's team version**: the rank and name used in the Side-with variant (`CLIMAX_RIVAL_INTEGRATION_EXPANDED.md` §X4).

Neither exists unless its route or variant is in play.

### X7.3 Variant lines

Each team's special Pokémon share a **line**: a name, and one rule that every member has.

| Team | Line | Rule name | The rule, in short |
| --- | --- | --- | --- |
| Team Rocket | **Black-Label** | Tagged | Cannot be forced out; first hit taken does 20% less; the tag can be knocked off |
| Rocket Returns | **Dark Ball** | Dark Ball | +1 Attack and Special Attack on entry; loses 1/16 HP each turn |
| Team Aqua | **Tidebound** | Tidebound | In rain: +1 Speed, Water moves cannot miss |
| Team Magma | **Cinderborn** | Cinderborn | In harsh sun: +1 Defense, Fire and Ground moves cannot miss |
| Team Galactic | **Spiritless** | Spiritless | Stats cannot be lowered by the foe or raised by anyone; cannot flinch or be taunted |
| Team Plasma | **Overclocked** | Overclocked | First move on entry has +1 priority; overheats after three turns |
| Team Flare | **Couture** | Couture | Carries a second held item, its accessory |
| Team Skull | **Tagged-Up** | Tagged-Up | Sprays a tag: each foe loses 1/16 HP the first time it switches in |
| Aether Foundation | **Preserved** | Preserved | −1 Speed; immune to status; first hit taken does 25% less |
| Macro Cosmos | **Overcharged** | Overcharged | May Dynamax for one turn without a Power Spot; cannot act the turn after |
| Team Yell | **Loud** | Loud | Sound moves +20%; +1 Speed when the stands cheer |
| Team Star | **Tuned** | Tuned | May Terastallize for two turns without a charged Orb; stalls afterward |
| Rocket Remnants | **Patchwork** | Patchwork | Carries one gadget, shown, that goes off once |
| Team Snag'em | **Snagged** | Snagged | A rising chance each turn to refuse its snagger |

**The line budget.** A line rule is worth about as much as a held item: one upside, and either a matching downside or a way for the player to remove it. No line rule raises damage by more than 20%, and line rules count toward Volume I's +30% stacking cap.

**How line rules and Shadow states combine** is specified in the expanded Shadow document, §X10.

### X7.4 Special Pokémon (`sv.<team>.<slug>`)

A special Pokémon is a named individual: a species from the Pokédex, its team's line rule, and one **signature trait** of its own.

| Field | Rule |
| --- | --- |
| Species | Must exist in `data/source/pokedex.json`. Evolution lines and alternate forms are listed with " / " |
| Signature trait | One sentence. Always announced the first time it applies |
| Where met | A trainer, a raid room, an event, or a climax phase |
| **Can the player get it?** | One of four answers |

| Answer | Meaning | Count |
| --- | --- | --- |
| **No** | It belongs to someone. It is fought, or met, and stays theirs | 73 |
| **Yes** | It can join the party, with the condition stated | 25 |
| **Ally only** | It fights beside the player in named scenes and is never in the party | 9 |
| **Returned** | It was taken from someone. The player can bring it home, and that is the reward | 3 |

**An obtained special Pokémon keeps its signature trait and loses its line rule**, unless the script says the line travels with it (Tidebound and Cinderborn are training, not equipment, and stay).

**Budget for signature traits.** A signature trait is flavor first. It may be strong in one situation; it may not be strong in general. Traits that give information (reveal a move, mark a target) are preferred to traits that give numbers.

### X7.5 Special Shadow Pokémon (`ss.<team>.<slug>`)

Fifty-eight named Shadows, twelve of them Apex (codes XD001–XD012). Each lists its tier, a Shadow ability, its Shadow moves, a **purification key** and where it is met. Their rules are in the expanded Shadow document: classes and keys in §X8, Apex and Colossus in §X9.

| Tier | Count |
| --- | --- |
| 1 Veiled | 1 |
| 2 Bound | 6 |
| 3 Gripped | 32 |
| 4 Fallen | 19 |

### X7.6 Validation

`tools/build_expansion.js` parses every roster table and refuses to build if an id is malformed, a team is unknown, a species is not in the Pokédex, a tier, ability or move is not in the Shadow data, an Apex code is duplicated, or a script falls below its minimums (eight characters, six special Pokémon, four special Shadows, six events, two new raids).

---

## X8. Story events

### X8.1 What an event is

A **story event** (`xe.<region>.<slug>`) is a short scene on the node map that belongs to the region's team story. Each region has eight; the roaming cast has eight that can occur anywhere.

| Field | Content |
| --- | --- |
| Scale | Street, City, Region or Border |
| Trigger | A node type and a condition: "any city node after Ignition", "the first rest node at track step 3", "after Raid 2" |
| Beats | Three to eight lines of dialogue and one **choice of two or three** |
| Battle | At most one, optional in most events, never above the current stage's tier |
| Writes | Flags (`<team>.x.<name>`), and small amounts of Intel, Heat or reputation |

### X8.2 Scheduling

| Rule | Value |
| --- | --- |
| Density | By default **five of a region's eight** events occur in a run of that region, chosen by trigger order. `events.density` may be `low` (3), `normal` (5) or `full` (8) |
| Spacing | No two story events on consecutive nodes. None on a node that already holds an ambush, a rival scene or a Rescue Plan offer |
| Guaranteed | In each region one event is marked **anchor**: it sets a flag the climax reads, and it always occurs |
| Roaming events | At most one roaming event per region; each occurs at most once per run |
| Order | Street events first. The Border event never occurs before Raid 1 |

### X8.3 What an event may do

| An event may | An event may not |
| --- | --- |
| Start one optional battle | Force a battle with no way to decline, except where the script marks the event **forced** and gives it an on-win and on-lose path that both continue the run |
| Give or cost a small amount of money, Intel, Heat or reputation | Take a Pokémon from the party |
| Introduce a named character or special Pokémon | End a run, or make it unwinnable |
| Set a flag that changes a later scene or one Siege Map district | Change the rival's variant or the climax's battle count by more than one |
| Offer a special Pokémon marked **Yes** | Require the player to keep a Shadow Pokémon |

### X8.4 Events and the Run Events document

`docs/RUN_EVENTS.md` (built from `tools/events_source.js`) is the game's general event pool: encounters and forced events that are not tied to one team's story. Story events are different in two ways: they are written in the scripts, not generated, and they always belong to a region. The two pools share the spacing rule, so they never collide.

---

## X9. The Grand Arc, as a system

`docs/GRAND_ARC.md` tells the story. This section states its rules as a system, so it can be built or left out cleanly.

| Part | Rule |
| --- | --- |
| **Liaisons** | One Cipher officer per region, attached to that region's team at Executive rank. Fought once, in a raid or in Phase 3 |
| **Data ROMs** | Nine, one per region. Earned by beating that region's liaison in the region (some have a second route). A missed ROM can be taken **late**, at the finale, with reduced effect |
| **Any order** | No liaison's scene depends on another region. Carried results are flags, each read only if it exists |
| **The Stock track** | One run-wide track (X3.3). Gains from unbeaten liaisons and lost regions; loses a step per three ROMs |
| **The finale** | Offered after the run's **last** regional climax if the player holds three or more ROMs. Optional. An Extended Cut of its own, on an island |
| **D1 relaxed** | Losing the finale does not end or undo the run. It is recorded as *won, finale lost* |
| **What ROMs do there** | Each ROM earned in its region opens one bank of tanks in the Reservoir and removes one of XD001's nine locks. Each late ROM opens its bank only. With all nine earned in-region, XD001 is not fought |
| **Results** | `finale.result` (sung, silent, sold, declined), `rainbow.result` (empty, closed, open) and each Apex's result (freed, taken) are written to the Doom Ledger |
| **Off switch** | `grandArc.enabled = false` removes liaisons, ROMs, the Stock track and the finale. Every region's Expanded content still works: Phase 3 has one fewer duel, and the farewell note is omitted |

**Design intent.** The arc is a reward for breadth, not a requirement. A player who plays one region sees a complete story with a stranger in it. A player who plays nine sees who the stranger worked for.

---

## X10. Dialogue systems

The expanded scripts hold 938 lines of dialogue; the expanded companion documents add several hundred more. Five small systems choose which line is heard.

### X10.1 Ambush lines

Each team gains new ambush intro and defeat lines, tagged by rank and by track step. Selection: the highest-step line not yet heard this run, then any line not heard in the last three ambushes. A line is never repeated in the same region until every eligible line has been used.

### X10.2 World-state lines

One civilian line per track step per region, and one per Siege Map district state. Any civilian NPC can speak the current step's line once. They are the cheapest way the player learns the track moved.

### X10.3 Leader barks

Each Leader has barks for: the player's first raid win, the player's first raid loss, each track step, the rival's variant being revealed, and each part of their Apex breaking. Barks are delivered by broadcast, memo or loudspeaker, and never interrupt a battle turn.

### X10.4 Announcer lines

Every signature trait, line rule, signature Shadow move and format event has one fixed line of battle text. These are the lines promise P5 depends on. They are short, they are the same every time, and they appear **before** the effect resolves.

### X10.5 Rival and Friend lines

Chosen by archetype, variant and attitude, as specified in the rival documents. A rival line that refers to an event (a raid, the Breather, a keepsake) is only eligible if that event happened.

### X10.6 Rules for all five

1. **No line reveals a later scale.** A Street-scale line never mentions the Apex.
2. **No line depends on region order** (promise P3).
3. **Repetition limit:** no line of any kind is heard twice within ten nodes.
4. **Skippable.** Every non-battle line can be advanced at once; announcer lines obey the battle text speed setting.
5. **Tokens** follow Volume I's list (`{player}`, `{rival}`, `{site}`, `{team}`, `{leader}`) plus `{friend}`, `{codename}`, `{liaison}` and `{apex}`. No line may ship with an unresolved token.

---

## X11. Pacing and run length

The Expanded Edition adds content to every region. This is roughly how much, for a region played with default settings.

| Part | Standard | Expanded | Difference |
| --- | --- | --- | --- |
| Story events | 0 | 5 of 8 (short scenes; 0–1 battles each) | About 5 scenes, 2 battles |
| Raids offered | Up to 3 | Up to 5 | Up to 2 more, both optional |
| Climax battles | 8–12 | 13–18 | About 5 more, with a Breather |
| Roaming beats | 4 | 8 (none in the climax) | About 4 short scenes |
| Finale | — | Once per run, optional | 10–15 battles, after the run is won |

**Estimated added play per region:** about 30–40% with everything on and every optional raid taken; about 15% if Raids 4 and 5 are declined.

### X11.1 Ways to shorten

| Setting | Effect on length |
| --- | --- |
| `climax.cut = "standard"` | Removes about five climax battles per region |
| `events.density = "low"` | Three story events per region instead of five |
| `grandArc.enabled = false` | Removes one duel per climax and the finale |
| Declining Raids 4 and 5 | No added raid time. The track gains a step for each |

### X11.2 Pacing rules

1. **No two long things in a row.** A raid is never offered on the node after a story event with a battle.
2. **The middle is protected.** The Rescue Plan's offer, the rival's scenes and the second rival's encounters take priority over story events when they compete for a quiet node.
3. **The climax is announced early.** The track's step-5 name is visible from Ignition, so the player always knows what the region is building toward.
4. **The last thing in a region is small.** After the Resolution there is one quiet node with the liaison's note, a postcard, or the roaming team's Curtain Call, and nothing else.

---

## X12. Settings reference

Every Expanded Edition setting, in one place. All are per save and can be changed between regions; `climax.cut` can also be changed at any Last Rest.

| Setting | Values | Default | Effect |
| --- | --- | --- | --- |
| `climax.cut` | `extended`, `standard` | `extended` | Extended Cut or the base climax |
| `grandArc.enabled` | `true`, `false` | `true` | Liaisons, ROMs, the Stock track, the finale |
| `events.density` | `low`, `normal`, `full` | `normal` | 3, 5 or 8 story events per region |
| `rocket.x.triad` | `true`, `false` | `true` | Kanto's turned Gym Leaders, or unnamed Executives |
| `rescue.climaxEligible` | `true`, `false` | `true` | The Pound district in the Extended Cut |
| `rival.second` | on, off | on | Base setting; the Friend |
| `rival.second.encounters` | on, off | on | Base setting; also covers the Errand and the Eve |
| `climax.allowWithdraw` | on, off | **off** | Base setting (decision D9); applies at the Extended Cut's two save points |
| `saffron.labyrinth.countsAsGym` | on, off | off | From the Kanto Canon Spaces document |
| `format.cards` | `first-time`, `always`, `never` | `first-time` | When the one-card format explanations are shown |

**Accessibility.** Format states never rely on color alone (X4.7). Every timer shows a number. Announcer lines can be set to wait for a button press. Auras carry a shape and a written tier (expanded Shadow document, §X2).

---

## X13. Fairness and anti-frustration, Volume II

Volume I lists its fairness rules in §17. These are added.

1. **A longer climax always has a Breather and two save points.**
2. **Nothing new ends a run.** Events, new raids, tracks, Reclaim, the Rescue Plan and the finale cannot. Only a regional climax can (decision D1).
3. **Phase 7 never ends a run.**
4. **Tracks never change enemy strength.** They change the world and one small rule.
5. **The ±2 bound holds for five raids as it did for three.**
6. **Every format is explained once and announced always.**
7. **A Blackout always lapses at the Breather.**
8. **No more than three Lost-district effects apply at once.**
9. **A Front can be won with no allies.**
10. **A Convoy that escapes is never, by itself, a loss.**
11. **A Colossus's hardest turn is early.** Its signature move is among the first two removed.
12. **Keys can be missed and Shadows can still be purified.**
13. **What-if characters can always be won back.**
14. **Special Pokémon marked *No* are never dangled.** The game does not show a capture prompt for something that cannot be caught.
15. **Everything can be switched off**, and with everything off the base game is exactly Volume I.

---

## X14. Content totals

| Content | Base | Added by the Expanded Edition | Where |
| --- | --- | --- | --- |
| Script words | 34,676 | about 94,000 | `scripts/expanded/` |
| Named characters | (in base scripts) | 143 (80 canon, 45 what-if, 18 original) | Scripts §E2 |
| Special Pokémon | — | 110, in 14 lines | Scripts §E3 |
| Special Shadow Pokémon | — | 58, of which 12 Apex | Scripts §E4 |
| Signature Shadow moves | — | 12 | Scripts §E4 |
| Shadow moves / abilities / purification methods | 14 / 20 / 7 | +16 / +16 / +6 | Expanded Shadow document |
| Story events | — | 80 | Scripts §E5 |
| Raid sites | 31 | +20 | Scripts §E6 |
| Climax formats | 1 | +6 wide formats | This volume, X4 |
| World-state tracks | — | 10 | This volume, X3 |
| Data ROMs and liaisons | — | 9 and 9 | `GRAND_ARC.md` |
| Finale | — | 1 (optional) | Roaming script §E7 |
| Script dialogue lines | (in base scripts) | 938 | Scripts §E9 |
| Companion-document lines (rivals, the Friend, Stand-with, the Region of Doom) | 352 | more than 500 | `docs/expanded/` |

---

## X15. New screens

Seven new screens or panels. Each is specified by what it must show, not how it must look.

### X15.1 The Siege Map screen

| Must show | Detail |
| --- | --- |
| The map | Four to six districts, each with a name and a state letter (H, C, L) |
| For each district | Its Held benefit and its Lost effect, both visible at once |
| The roster | Portraits of every ally available, each with a one-line reason they are here ("You freed her at the Lake") |
| Why a district is as it is | "Held: Raid 5 Triumph." "Lost: track at step 4." |
| The player's own option | One Contested district may be claimed, with its cost shown: "+1 battle in Phase 1" |
| Confirmation | One button. After it, the map is view-only |

### X15.2 The Notebook: track page

One page per region. Five boxes; the current step filled and named; the next step named in grey with what would cause it. Below: the scale badge (five pips), and the list of events seen, grouped by scale.

### X15.3 The Dossier

A cast gallery. Every named character met, with their rank, their mark (canon, what-if, original), their voice line, and their status: *at large*, *beaten*, *turned*, *ally*. What-if characters show the condition for winning them back once the player has heard a hint of it.

### X15.4 Field Notes

A compendium of special Pokémon and special Shadows met. For each: name, species, line badge, signature trait (once seen), and whether it can be obtained. A Named Shadow shows its key type symbol after the first hint and the full key after the third.

### X15.5 The Colossus plate

During Phase 6: the Apex's name and code; its parts as named bars; beside each part, the move its loss removes; the timer; and the signature move's warning line when it is one turn away. The body's HP bar is shown locked.

### X15.6 Format HUDs

| Format | HUD |
| --- | --- |
| Blackout | The condition's name in the corner, and the switch's counter (0 of 3) |
| Front | Three lanes side by side, numbered; the commanded lane in front; a small icon on lanes that are holding or allied |
| Convoy | A row of five pips for Distance, and the par for the current battle |
| Debate | The claim; the player's evidence as cards; three round markers |

### X15.7 The Situation Report, extended

Volume I's Situation Report (§7.3) gains five lines in the Extended Cut: the track step; districts Held, Contested and Lost; allies available; Apex parts already cracked or broken; and which phases are required and which optional. The readiness label is computed from all of it and remains a word, never a number.

---

## X16. Team by team: design notes

One note per script: the idea, what the expansion added, and what to watch in playtest. Titles are the scripts' own.

### Kanto — Team Rocket, *The Long Ledger*
- **Idea.** Rocket is a business. Everything it does is an entry in a book, and the book is alive: LEDGER, a Porygon that has recorded every theft and is starting to wonder what it is.
- **Added.** Matori, Dr. Namba, Madame Boss; the Rocket Triad (three Gym Leaders on the payroll, switchable off); the Black-Label line; Project M2.
- **The what-if.** Sabrina keeping a city quiet because she likes it quiet.
- **Watch.** The Triad is the most likely thing to divide players. The switch must be easy to find. M2's four seals at Set-1 are the first Colossus most players will see: it must teach the format without being trivial.

### Johto — Rocket Returns, *Dead Air*
- **Idea.** A team waiting for a man who is not coming. Archer broadcasts into silence, and when silence does not answer, he tries to go back to before the Boss left.
- **Added.** The Iron-Masked Marauder and his Dark Balls; Attila and Hun; the three beasts under glass; a young Lugia; Dark Celebi.
- **The what-if.** The Heir, and what he does when his father's old staff ask him to lead.
- **Watch.** The optional Phase 7 (*Tohjo Falls, Three Years Ago*) is a duel in the past. It needs to read as a gift, not a twist. The beasts leaving Johto feed three other regions: test every combination.

### Hoenn — Team Aqua and Team Magma, *The Long Weather*
- **Idea.** Two teams with opposite plans bought the same machine from the same dealer. Somebody wanted both titans awake.
- **Added.** One officer per side and a shared supplier (Dakim); the Eon twins, bound one to each team; Zinnia in either hood; a double Apex fought as one phase.
- **The what-if.** Archie and Maxie on the same side, for one scene, against the man who sold to both.
- **Watch.** Two weathers on one field is the hardest thing in the Expanded Edition to make readable. The Blackout condition here alternates; the announcement must come a full turn ahead.

### Sinnoh — Team Galactic, *The Quiet Machine*
- **Idea.** Galactic does not want to rule. It wants to subtract. The region loses memory, then feeling, then will, one lake at a time, and the player feels each one go.
- **Added.** Sird, Hunter J and her bronzing; the Spiritless line and its "wellness clinics"; Lovrina; two Apex at once, where freeing one turns it on the other's chains.
- **The what-if.** Commander Mercury: the rival, quick and small and no longer bothered by anything.
- **Watch.** The track's third step changes the *interface* (the map loses detail; bond effects fade). It must feel eerie, not broken. A clear icon should say "this is the team's doing."

### Unova — Team Plasma, *The Kindest Lie*
- **Idea.** The speech worked. People let their Pokémon go. Now the Pokémon stand in fields facing the towns, and someone is collecting them.
- **Added.** Three more Sages, Aldith and Barret, Schwarz and Weiss; the King's Likeness (a stand-in for N); the Overclocked line; a region closed bridge by bridge.
- **The what-if.** Knight-Errant "Gray": a rival who believed it.
- **Watch.** This is the script most likely to make a player sad. That is intended. The released Pokémon must be recoverable in the Resolution for every ending but one, and that one must be chosen with open eyes.

### Kalos — Team Flare, *The Last Beautiful Day*
- **Idea.** A list. Those on it are saved. Lysandre weeps over it and signs it.
- **Added.** Corbeau and Garance; Venus and her television programme; Essentia in the suit she cannot take off; Alain; the Couture line; a megalith the size of a cathedral.
- **The what-if.** The player as the Guest of Honor: the one name he added for free.
- **Watch.** The offer at the climax ("Take it") is real on the Stand-with route. It must not be selectable by accident.

### Alola — Team Skull and the Aether Foundation, *What We Keep*
- **Idea.** A woman who cannot bear to be left, and the things she keeps so that they cannot leave. Team Skull is a decoy that does not know it.
- **Added.** Tupp, Rapp and Zipp; Eldes, a liaison with a conscience; the Preserved and Tagged-Up lines; a guardian in glass; Kahuna Guzma; the Mother Beast.
- **The what-if.** Guzma as a kahuna, which is only a what-if until the player makes it true.
- **Watch.** Two teams, one of them sympathetic. Skull's exit at Raid 5 must feel like a win for the player whichever way it goes.

### Galar — Macro Cosmos and Team Yell, *The Thousand-Year Plan*
- **Idea.** A good man solving a real problem a thousand years early, on live television, with insurance.
- **Added.** Sordward and Shielbert as consultants; an actuary, a rail director, and the Ball Guy, who takes his head off once; the Overcharged and Loud lines; the two sleeping guardians as Named Shadows.
- **The what-if.** The Chairman's Pick: a rival in a jacket of logos.
- **Watch.** Team Yell follow the player to every later region. The joke must stay a joke: they cheer, they never fight, and they never change a battle.

### Paldea — Team Star, *The Kids Who Stayed Out*
- **Idea.** The team is right. The villains are an Academy official who deleted the reports and a buyer who wants the engines.
- **Added.** Nascour; Harrow and his Peons in the wrong boots; the Tuned line; a raid the player *defends*; a Debate; a last fight fought beside the team.
- **The what-if.** The rival as Boss of a sixth squad, and correct to be.
- **Watch.** The Debate has no battle if the player did the work. Make sure a player who skipped Raid 5 can still win two of three exchanges from ordinary play.

### Roaming — the trio, Team Snag'em and Cipher, *The Long Way Round*
- **Idea.** Three clowns thrown off every dock in the world are the only people who have seen every crate. A thief has never asked what his client does with the goods. And at the end of the long way round, an island.
- **Added.** Greevil, Evice, Gonzap's nine-year debt; Wes, Rui, Krane, Chobin; the Patchwork and Snagged lines; Raids 5 and 6; the finale; XD001.
- **Watch.** The finale must be worth reaching with three ROMs and different with nine. Test three, five and nine.

---

## X17. A worked Extended Cut

One climax, start to finish, with example numbers, to show how the systems meet. Kanto, Set-2, a balanced party of six.

**Before the climax.** The player declined Raid 1, won Raid 2 (Success), failed Raid 3, won Raid 4 (Success), and did not attempt Raid 5. The track stands at step 3, *Closed Roads*. The rival rolled **Help**. No second rival this region. The Triad is on.

**Phase 0: Broadcast and choice.** The news report mentions two Snorlax on the Saffron roads. The Situation Report reads: *track 3; districts 2 Held, 2 Contested, 1 Lost; allies 1; Apex parts 0 cracked; readiness: Even.* The player takes the Last Rest.

**Phase 0b: The Sealed City.**

| District | State | Why |
| --- | --- | --- |
| North Gate | Held | The rival, Help variant |
| East Gate | Contested | Raid 3 failed, and no police wire |
| South Gate | Held | Raid 4 Success |
| West Gate | **Lost** | Track at step 3: one district falls, and the script lists West first. Raid 5 was not attempted |
| The Center | Sabrina's | Always |

The player enters by the South Gate (free) and claims the East Gate personally (+1 battle in Phase 1). The West Gate's effect will apply: the Breather heals 35%, not 50%.

**Phase 1: The Streets (Blackout).** The Seal is up: no fleeing, no switching on the first turn, Psychic moves +10% for both sides. Three anchors; two must fall. The player beats the first anchor, then the East Gate's battle, then Sabrina at the crossroads, whose first move each turn is announced. The Seal goes out. *Three battles.* The East Gate is now Held.

**Phase 2: The Climb.** Operation Strength gives five floors; the rival takes one. Four battles, including the Kennel Handler's two Black-Label Pokémon (*Tagged*: the first hit on each does 20% less). On the 11th floor the trio, who owe the player nothing this run, fight. *Four battles. Save point.*

**Phase 3: The Officers.** Domino, then Matori. The South Gate is Held, so Major Surge does not appear, and the base script's conditional third duel is not triggered this run. The rival uses *Intel* on Matori's ace. *Two battles.*

**Breather.** A pantry on the 8th floor. Heal 35% (the West Gate), revive one. The rival is there, at Warm attitude, and asks their question. *Save point.*

**Phase 4: Saffron Sealed.** Card Key stations and reinforcement waves on a 12-turn timer. The player takes the optional Rig Room: two turns spent, and every Shadow Pokémon in the building, M2 included, drops one tier. *Three battles.*

**Phase 5: Giovanni.** The named team; at 25% Vault-Breaker tears off its tag and changes form, announced. The rival gives one Assist every three turns. *One battle.*

**Phase 6: The Roof.** M2, four armor seals, each at 16% of its max HP at Set-2, ten turns. One seal starts cracked for free at Set-2. The rival joins for two turns and cracks another. Mind Vault is announced on turn 2 and is gone when the first seal breaks on turn 3. The fourth seal, its obedience, breaks on turn 9.

> **M2:** "I can hear myself."

No knockout. The story choice follows. *One battle.*

**Phase 7: The Long Drive.** Not offered: Matori's one o'clock was never moved. The ledger leaves with Giovanni, and nothing else is lost.

**Phase 8: Resolution.** Ein was not beaten in Raid 4's secondary objective, but the Rig Room was shut down, which is ROM K's second route. The player holds one Data ROM. The liaison's note points to the run's next region.

**Totals.** Fourteen battles; two save points; one Breather; three Lost-district effects possible, one applied. The player was never shown a number they could not have predicted from the Situation Report.

---

## X18. Decisions

### X18.1 Confirmed, and unchanged here

D1 (a lost climax ends the run), D2 (the Rival Rescue Plan), D3 (roaming teams in any region), D4 (the Gym clamp), D5 (permanent Shadow members), D6 (Stand with them at launch), D7 (per-run persistence and the Doom Ledger), D8 (a second rival in about half of regions), D9 (`allowWithdraw` off by default).

### X18.2 Assumptions made in the Expanded Edition

| # | Assumption | Where to change it |
| --- | --- | --- |
| A1 | The Extended Cut is the default | `climax.cut` |
| A2 | Gym Leaders may appear in what-if roles, with a switch in Kanto | `rocket.x.triad`; a per-region switch could be added |
| A3 | Cipher is the supplier behind every team's Shadow method | `grandArc.enabled` |
| A4 | The finale relaxes D1, in the player's favor | `GRAND_ARC.md` §6 |
| A5 | Five of eight story events occur per region | `events.density` |
| A6 | Every special Pokémon uses an existing Pokédex entry, including your custom forms | `tools/build_expansion.js` |
| A7 | Apex Shadows are never added to the party by their fight | Scripts §E8 |

### X18.3 Still open

1. Should Gym Leaders appear as team members at all, outside Kanto's switch?
2. Should the Extended Cut be the default, or opt-in?
3. Should a freed Apex ever be catchable in a later run, as a Doom Ledger reward?
4. Should `events.density = "full"` be allowed on a first run, or unlocked?
5. Earlier questions from the Kanto Canon Spaces document remain open and are listed there.

---

## X19. Glossary

| Term | Meaning |
| --- | --- |
| **Apex** | A Legendary Shadow at the center of a team's plan, with a project code (XD001–XD012), fought as a Colossus |
| **Blackout** | A phase under one announced condition that a switch can end |
| **Breather** | The rest at the midpoint of an Extended Cut |
| **Colossus** | A boss with parts; the last part is its obedience |
| **Convoy** | A chase of battles with a distance meter |
| **Data ROM** | Proof of one Cipher method; nine exist |
| **Debate** | An argument decided by evidence |
| **Extended Cut** | The longer climax; the default |
| **Front** | Three lanes fought at once |
| **Key** | The person, place, object or act that frees a Named Shadow |
| **Lever** | The one thing in the climax that a raid's result changes |
| **Liaison** | Cipher's officer in a region |
| **Line** | A team's shared rule for its special Pokémon |
| **Scale** | Street, City, Region, Border, World |
| **Siege Map** | The climax city as districts: Held, Contested, Lost |
| **Standard Cut** | The base climax, unchanged |
| **Track** | A team's five-step world-state track |
| **What-if** | A canon character on the other side, always winnable back |
