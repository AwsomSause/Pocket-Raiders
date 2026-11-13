# STAND WITH THEM — EXPANDED EDITION

**Extends:** `docs/STAND_WITH_THEM.md` (every rule there still holds; this file adds to it)
**Read with:** `scripts/10_STAND_WITH_THEM.md`, each `scripts/expanded/*_EXPANDED.md` §E7.11, `docs/GRAND_ARC.md`
*The teams and their leaders are canon. The code names, jobs, scenes and lines here are original to this project.*

---

## X1. What this file adds

The base document makes the Inside Man route a real choice with a real climax. The Expanded Edition scripts then made every climax longer and put an Apex Shadow and a Cipher liaison in it, and each script left one paragraph saying what that means for a player on the team's side. This file turns those nine paragraphs into a full route.

| Section | Adds |
| --- | --- |
| X2 | The player's code names and the rank ladder |
| X3 | Reputation in depth: what earns trust and how the team shows it |
| X4 | Loyalty Jobs for all five raid sites in every region (45 jobs) |
| X5 | Allied Strength in depth |
| X6 | The Allied Extended Cut: the climax from the inside, at the new scale |
| X7 | The Apex from the inside, region by region |
| X8 | The Audit: the Cipher liaison on this route, and the Data ROM |
| X9 | The Verdict, with what each ending does to the Apex |
| X10 | Living in an Allied-Occupied region |
| X11 | Ways out: every point where the player can still turn |
| X12 | Dialogue bank |
| X13 | Flags and tests |

**The point of the route has not changed.** It is not the "evil ending". It is the route where the player learns what the team is like from the inside, does real work for it, and then has to decide what that was worth. The team is never made secretly good, and the player is never punished for having been curious.

---

## X2. Who you are on the inside

### X2.1 Eleven code names across nine regions

Every team gives its Inside Man a name. Each one says something about how that team sees people.

| Region | Team | The player is called | Given by | What it means |
| --- | --- | --- | --- | --- |
| Kanto | Team Rocket | **Provisional Agent 000, "House Card"** | Giovanni | A card the house keeps back. Useful, and not yet played |
| Johto | Rocket Returns | **Executive-in-Waiting "Standby"** | Archer | Archer is waiting for someone. Everyone under him waits too |
| Hoenn | Team Aqua | **"Stowaway"** | Archie | You came aboard without asking, and he liked that |
| Hoenn | Team Magma | **"Ember"** | Maxie | A small, measurable quantity of heat |
| Sinnoh | Team Galactic | **Probationer Ceres** | Cyrus | Commanders are planets. Ceres is not quite one |
| Unova | Team Plasma | **The Seventh Sage** | Ghetsis | A seat that has stood empty since the Sages broke |
| Kalos | Team Flare | **The Guest of Honor** | Lysandre | The one person he wants to save without charging |
| Alola | Team Skull | **Numbskull Number One** | Guzma | It is the highest compliment he has |
| Alola | Aether Foundation | **The Deputy Director** | Lusamine | A white coat, and a door that locks behind you |
| Galar | Macro Cosmos | **Junior Executive, Future Planning** | Rose | A department of one, invented for the player |
| Paldea | Team Star | **Fulu Squad** | Penny | The faintest star in the constellation. Still in it |

The name is used in every line spoken to the player on the route, on the uniform, and in the Doom Ledger entry.

### X2.2 The ladder

The player enters at Specialist rank (rank id 2 in `data/ranks.json`) and can climb.

| Reputation | Band | Rank held | What changes |
| --- | --- | --- | --- |
| +30 | Recognized | Specialist | Uniform. The team shop. Grunts stop challenging the player |
| +45 | Respected | Lieutenant | **[Stand with them]** unlocks. One Grunt is assigned to the player as a runner (carries one item) |
| +60 | Trusted | Commander | The player is told the real plan, not the memo. One officer's signature tool can be borrowed per job |
| +70 | Allied | Commander, with the Leader's ear | **Take the Throne** becomes possible. The Leader asks the player one honest question (X12.3) |
| Rise | — | Executive | After the climax only |

Rank on this route gives **access and information, never statistics**. A Commander-rank player hits no harder than a Specialist.

### X2.3 The runner

At Respected the player is assigned a Grunt: a named nobody who carries a bag and has opinions. The runner is the route's conscience without ever saying so. They are proud to be there at +45, worried at +60, and at the climax they are the one person in the building who asks the player if they are all right.

| Team | The runner | A line |
| --- | --- | --- |
| Rocket | **Grunt Mosley** | "Is it always this quiet before one? I only did Game Corner shifts." |
| Rocket Returns | **Grunt Pell** | "My dad was in the first lot. He said the boss'd come back. I'm sort of here to check." |
| Aqua | **Deckhand Finn** | "I can't actually swim. Don't tell Shelly." |
| Magma | **Trainee Cole** | "I joined for the geology. There's been less geology than advertised." |
| Galactic | **Grunt 114** | "They said to stop using my name. I keep nearly telling you it." |
| Plasma | **Squire Wren** | "I released mine, like he said. I see it sometimes, by the river. It doesn't come over." |
| Flare | **Intern Odile** | "I'm still paying off the suit. Is that normal? Nobody will tell me if that's normal." |
| Skull | **Grunt "Li'l D"** | "Yo, Number One! I'm, like, Number Forty. It's fine. It's a big team." |
| Aether | **Assistant Kahale** | "The President knows my name. She knows everybody's. I used to think that was nice." |
| Macro Cosmos | **Trainee Bex** | "I've got a lanyard. Does yours open the fourth floor? Mine doesn't open the fourth floor." |
| Star | **Squad-mate Juno** | "You're the only one in your squad. I asked if I could transfer. Penny said to ask you." |

A runner never battles for the player and cannot be lost. What happens to them after the Verdict is in X9.3.

---

## X3. Reputation in depth

### X3.1 More ways it moves

In addition to the base table (§2.1):

| Event | Rep | Note |
| --- | --- | --- |
| Finish a Loyalty Job without the job's "catch" being noticed | +2 | See X4 |
| Cover for the runner's mistake | +3 | And the runner remembers |
| Bring an officer something they asked for in passing | +2 | One per officer |
| Lose an ambush from a *rival* team while in uniform | +1 | They respect that you took it |
| Win an ambush from the authorities while in uniform | +3 | |
| Turn in a Defector | +10 | Rival Attitude −1; the Defector is in the Region of Doom later, and not at Gym 5 |
| Warn a Defector instead | −6 if discovered, 0 if not | 30% chance of discovery, shown |
| Refuse an order on principle, to the officer's face | −4 | Never below the band the player already holds; some Leaders *raise* rep by +2 for it (Giovanni, Guzma, Penny) |
| Free a Shadow Pokémon the team bound | −8 | −3 if the runner helped hide it |
| Keep a Shadow Pokémon the team gave you, and use it | +2 once | Heat for keeping it does not apply: it is theirs to give |
| Be seen talking to the liaison alone | −2 | Nobody likes the supplier |
| Be seen arguing with the liaison | +3 | Nobody likes the supplier |

### X3.2 How the team shows it

Reputation is a number, but the player should be able to read it without opening a menu.

| Band | In the hideout |
| --- | --- |
| Recognized | People stop talking when the player comes in |
| Respected | People keep talking |
| Trusted | People ask the player what they think |
| Allied | The Leader's door is left open |

---

## X4. Loyalty Jobs

### X4.1 The shape of a job

Every Loyalty Job has five beats.

1. **Briefing.** An officer gives the team's own objective.
2. **The work.** The same Pseudo Region as the raid, played for the team: guard, carry, hold, deliver.
3. **The catch.** One moment in every job shows the player what the work costs someone else. It is never a cutscene. It is something in the room that the player can look at or walk past.
4. **A small mercy.** Each catch has one quiet thing the player can do about it that does not fail the job. Doing it is never required and is never mentioned by the team unless they notice (30%, shown).
5. **Debrief.** Result, reputation, Allied Strength.

**Results** are the base five. A Failure never applies consequences C1–C11.

### X4.2 Forty-five jobs

Raids 1–3 are the base sites. Raids 4–5 are the Expanded Edition sites.

**Kanto — Team Rocket (briefed by Domino or Matori)**

| Site | The job | The catch | The small mercy |
| --- | --- | --- | --- |
| Mt. Moon Fossil Dig | Keep hikers out while the dig crew works | A Clefairy colony is in the blast area | Lead them out through the side tunnel |
| The Celadon Hideout | Run the Game Corner floor on a busy night | A regular is losing rent money to a rigged machine | Pay him out once and blame the machine |
| Pokémon Tower | Keep the upper floors closed to mourners | An old man only wants to leave flowers | Carry them up for him |
| Vermilion Docks | See a freighter loaded before dawn | The crates are warm and they move | Loosen one lid |
| Safari Night | Escort a poaching truck out of the Zone | A Kangaskhan is following the truck | Leave the tailgate unlatched |

**Johto — Rocket Returns (briefed by Ariana or Petrel)**

| Site | The job | The catch | The small mercy |
| --- | --- | --- | --- |
| Slowpoke Well | Guard the well mouth for a shift | Kurt's granddaughter is looking for her Slowpoke | Tell her which one it is |
| The Mahogany Hideout | Run the souvenir shop upstairs | The Electrode powering the transmitter are in pain | Turn the dial down one notch |
| Lake of Rage Transmitter | Keep fishermen off the shore | A man recognises the red Gyarados as his old Magikarp | Let him stand at the fence |
| Burned Tower | Hold the basement while the Marauder works | The three beasts are in glass and awake | Stand where they can see a window |
| Whirl Islands | Row the reading crew to the inner cave | A young Lugia is calling for its parent | Don't record the answer |

**Hoenn — Team Aqua or Team Magma (briefed by Shelly or Courtney)**

| Site | The job | The catch | The small mercy |
| --- | --- | --- | --- |
| Mt. Chimney Meteorite | Guard the machine at the crater | Lavaridge's hot springs are going cold, or boiling | Send word down the mountain |
| Slateport Submarine | Hold the dock while the sub is taken | Captain Stern built it for something else, and says so | Let him keep his notebook |
| Mt. Pyre | Carry the Orb down from the summit | The old couple do not resist. They only ask you to be careful with it | Be careful with it |
| Southern Island | Net one of the twins for the Orb tests | The other twin will not leave | Leave the net loose |
| Space Center | Hold the control room during the countdown | Dakim is selling the same data to the other team downstairs | Tell your own officer |

**Sinnoh — Team Galactic (briefed by Mars or Saturn)**

| Site | The job | The catch | The small mercy |
| --- | --- | --- | --- |
| Valley Windworks | Keep the engineer's daughter away from the door | She has brought her father's lunch | Take it in to him |
| The Galactic Building | Process the day's "donated" Pokémon | Each one comes with a child's handwriting on the tag | Put one tag in your pocket |
| Lake Valor | Clear the shore before the charge is set | The Magikarp left on the lakebed are still alive | Carry some to the stream |
| Stark Mountain | Guard Charon's dig | The mountain is not as asleep as he says | Mark the exits |
| Veilstone HQ | Stand watch over the Spiritless ward | They do not react to anything. One of them watches you leave | Say its name once |

**Unova — Team Plasma (briefed by Zinzolin or a Sage)**

| Site | The job | The catch | The small mercy |
| --- | --- | --- | --- |
| The Plasma Frigate | Crew the deck during a "liberation" speech | A boy in the crowd is deciding whether to let his Lillipup go | Catch his eye and shake your head |
| Colress's Laboratory | Assist an experiment | Colress asks what you think, and means it | Tell him the truth |
| The House in Driftveil | Search a house where ex-Plasma shelter Pokémon | They were your side, once | Miss the back room |
| Opelucid, Frozen | Patrol the frozen streets | People are trapped inside their own homes | Break one doorframe free |
| Plasma Castle | Stand guard outside N's old room | The toys are still in it | Close the door |

**Kalos — Team Flare (briefed by Xerosic or Malva)**

| Site | The job | The catch | The small mercy |
| --- | --- | --- | --- |
| The Power Plant | Keep the plant running at a stolen load | Lumiose is going dark one district at a time | Leave the hospital's line alone |
| Frost Cavern | Hold the cave while an Abomasnow is provoked | It only wants to be left alone | Stop provoking it for one turn |
| Lysandre Labs | Sell memberships at the café front | A couple are spending their savings to be "chosen" | Tell them the list is full |
| Parfum Palace | Work the door at a fundraising gala | The guest list is a list of who will be spared | Read it, and remember who is not on it |
| The Megalith | Keep the stone ring clear for the cameras | Venus is filming the Pokémon tied to the stones as scenery | Stand in the shot |

**Alola — Team Skull, then Aether (briefed by Plumeria, then Faba)**

| Site | The job | The catch | The small mercy |
| --- | --- | --- | --- |
| Po Town | Hold the barricade in the rain | The Grunts have nowhere else to sleep | Bring them something hot |
| Aether Paradise: Conservation Area | Lead a donors' tour | The enclosures are beautiful and nothing in them may leave | Leave one gate on the latch |
| Ten Carat Hill | Guard a wormhole test | Something small came through, and it is frightened | Stand between it and the cameras |
| Ruins of Life | Keep the kahuna's people off the altar | The guardian's shrine is being measured for a case | Move the tape measure |
| The Aether Gala | Serve at the President's party | Lillie is at the edge of the room and may not speak | Speak to her |

**Galar — Macro Cosmos (briefed by Oleana)**

| Site | The job | The catch | The small mercy |
| --- | --- | --- | --- |
| The Hammerlocke Energy Plant | Monitor the Wishing Star intake | The readings are wrong and everyone has been told to sign them | Sign with a question mark |
| The Slumbering Weald | Fence off the wood "for public safety" | A child's Wooloo has wandered in | Go in after it |
| Spikemuth Blockade | Enforce the shutter | The town on the other side is going under quietly | Pass a hamper through |
| Wild Area Dens | Cap the dens for the Chairman's supply | The Pokémon inside are being kept Dynamaxed | Leave one cap loose |
| Wyndon Stadium | Run the broadcast desk for the final | The Chairman intends to interrupt it | Leave the commentators' line live |

**Paldea — Team Star (briefed by a Boss)**

| Site | The job | The catch | The small mercy |
| --- | --- | --- | --- |
| Segin Base | Guard the gate against Academy "visitors" | One of them is a teacher who only wants to return homework | Take the homework |
| Schedar Base | Help tune the Starmobile | Mela has not slept. Nobody here has | Take the night watch |
| Navi Base | Carry supplies in | The supplies are donated by parents who cannot say so | Tell Atticus who sent the tea |
| Ruchbah Base | Keep buyers away from the Fairy crew's engines | Nascour's man has already made Ortega an offer | Stand next to Ortega while he says no |
| The Academy's Old Wing | Recover the deleted bullying reports | The names in them include people now on Star's side | Read all of it anyway |

Paldea's jobs are different in kind: Team Star's objective is usually to be left alone. The catch is usually that somebody was kind and the squad cannot afford to notice.

### X4.3 What the small mercies do

Each small mercy done is counted in `standwith.mercies` (0–5 per region). The count is never shown.

| Mercies | Effect at the climax |
| --- | --- |
| 0 | None |
| 1–2 | One defender in Phase 1 recognises the player and sits their battle out |
| 3–4 | The runner brings the player something at the Breather (a full heal for one Pokémon) |
| 5 | In the Verdict, the Leader says they knew about every one. What they do about it depends on the Leader (X12.3) |

A mercy that is **noticed** costs −2 reputation and still counts.

---

## X5. Allied Strength in depth

Allied Strength (AS, 0–10) is what the team has at the climax because of the player's work.

| AS | Band | Phase 1 battles | Officers who fight beside the player | Supplies at the Breather |
| --- | --- | --- | --- | --- |
| 0–2 | **Thin** | 6 | None; the runner apologises | Heal 25%, no revive |
| 3–5 | **Holding** | 5 | One officer holds one district | Heal 50%, revive one |
| 6–8 | **Strong** | 4 | Two officers; one lends a tool | Heal 50%, revive one, one item |
| 9–10 | **Ready** | 3 | Three officers; the Leader watches Phase 1 from a window and says so | Heal 75%, revive one, one item |

The Phase 1 count is the base formula, `clamp(7 − round(AS/2), 3, 6)`. Only the extras are new.

**Sabotage and AS.** A sabotage raid lowers the team's Operation Strength as usual, and on this route it also lowers AS by the same number of steps. A player who sabotages from inside and then stands with the team fights a harder climax for it. The Situation Report says why.

---

## X6. The Allied Extended Cut

With `climax.cut = "extended"`, the allied climax grows the same way the normal one does. The Standard Cut is the base document's six phases, unchanged.

| # | Phase | Format | New or base | Battles |
| --- | --- | --- | --- | --- |
| 0 | **Internal Memo and Choice** | Briefing | base | 0 |
| 0b | **The Duty Roster** | Siege Map, from the inside | new | 0 |
| 1 | **Hold the Line** | Blackout, mirrored | base, widened | 3–6 |
| 2 | **Carry Out the Plan** | Set piece | base | 1–2 |
| 3 | **The Rival** | Duel or Double | base | 1 |
| — | **The Canteen** | Breather | new | 0 |
| 4 | **The Defender** | Boss | base | 1 |
| 5 | **The Cavalry** | Front: three lanes | new | 1 |
| 6 | **The Apex, from the inside** | Colossus, inverted | new | 1 |
| 6b | **The Audit** | Duel, optional | new | 0–1 |
| 7 | **The Verdict** | Choice; one more battle for two endings | base, extended | 0–1 |
| 8 | **Aftermath** | Narrative | base, extended | 0 |

**Typical total: 10–14 battles** (base: 8–11). Two checkpoints (after Phase 2 and after Phase 4) and the Breather protect the longer run. Losing still ends the run (decision D1), with the `allied-defeat` entry.

### X6.1 Phase 0b — The Duty Roster

The player is handed the team's map of the climax city and assigns officers to districts. This is the Siege Map with the colors reversed: the team **holds**, the defenders **contest**.

- The player has as many officers as the AS band gives (X5), plus the runner, who can hold one quiet district if asked and is very proud of it.
- Each district left without an officer is **Contested** at the start and will fall to the defenders during Phase 1 unless the player wins its battle.
- Each district the defenders take adds one announced effect against the player's side for the rest of the climax (the same list as that region's Siege Map, mirrored).

> **OFFICER** *(any team, handing over the map)*: "Put us where you want us. Boss says it's your board today."

### X6.2 Phase 1 — Hold the Line (Blackout, mirrored)

The team's own condition is active and now **helps the player**: Rocket's sealed building, Galactic's silence, Macro Cosmos's red sky. The defenders have an objective that switches it off. If they complete it (a marker on the map, counted in turns), the condition ends and their side gains the usual bonus for the rest of the phase.

The defenders are ordinary people doing a brave thing, and the lines say so.

> **RANGER:** "I know that uniform's not yours. I can tell by how you stand. Step aside and I'll say I never saw you."
> **GYM TRAINER:** "My Leader says there's still time for you. I'm to tell you that and then I'm to stop you."

### X6.3 The Canteen (Breather)

A real canteen: trestle tables, a tea urn, Grunts eating before the worst part. Heal and revive by AS band (X5). The runner sits down opposite.

> **THE RUNNER:** "You all right? Only you've gone quiet. I go quiet when I'm not all right."
> **PLAYER (choice):** ["I'm fine."] / ["I don't know."] / ["Are you?"]

The third answer is the only one that changes anything: the runner admits they are frightened, and stays close in Phase 6 (X7).

### X6.4 Phase 5 — The Cavalry

After the Defender falls, the people the Expanded scripts made allies of the *other* route arrive to stop the player. This is a Front: three lanes at once.

| Region | Who arrives |
| --- | --- |
| Kanto | Blaine, with two Saffron dojo trainers; Looker, taking notes in the wrong lane |
| Johto | Lance, on a Dragonite, through the roof |
| Hoenn | Steven and Wallace, who for once agree |
| Sinnoh | Cynthia; Looker; Volkner, if he was woken |
| Unova | N, who does not want to fight and does it well; Hugh, who does |
| Kalos | Diantha, Sycamore, and AZ in the doorway |
| Alola | Nanu, sighing; Gladion; the kahuna |
| Galar | Leon, Piers, and Marnie; Team Yell behind the barrier, booing |
| Paldea | Director Clavell as "Clive"; Arven; Captain Zeb's hired security, who are the only ones here for money |

Officers assigned in the Duty Roster hold lanes. With no officers, the player fights all three lanes, one action per turn, and the Situation Report warned of this.

> **CYNTHIA:** "I've read what he wants. I can't believe you have, and are still standing there."
> **LEON:** "I'm supposed to be in a final right now. I mention it so you know how seriously I'm taking you."
> **N:** "Your Pokémon are not afraid of you. That is why I am still talking instead of fighting."

Phase 6 and after are in the next sections.

---

## X7. The Apex, from the inside

In the normal climax the player breaks the Apex's parts to free it (Colossus rules: expanded Shadow document, X9). On this route the player is standing next to it. The fight is inverted: **the defenders are trying to break the parts, and the parts are the player's shields.**

### X7.1 Inverted Colossus rules

1. The Apex is on the player's side of the field and acts on its Leader's orders, not the player's.
2. Its parts take the defenders' attacks before the player's Pokémon do. While any part stands, damage to the player's side is reduced by 25%.
3. Each part the defenders break removes that protection by a step and removes one of the Apex's moves, exactly as in the normal fight.
4. **The Apex speaks.** Every Apex has at least two lines when its parts break. On this route the player hears them from one step away.
5. The phase ends in one of three ways, and all three lead to the Verdict:

| How it ends | What it means |
| --- | --- |
| **Hold** | The player keeps at least one part standing until the timer ends. The plan succeeds |
| **Let go** | The player uses the phase's **let-go action** (below). The Apex is freed by the player's own hand. This is the start of **Turn** and cannot be undone |
| **Broken** | The defenders break every part. The Apex is free and the plan has failed, but the climax is not lost: the Leader fights on in Phase 7 without it |

Losing every Pokémon in this phase still ends the run.

### X7.2 Region by region

| Region | The player is | What the player is holding | The let-go action | The Leader's line |
| --- | --- | --- | --- | --- |
| Kanto | House Card | The generator M2 is cabled to, while police helicopters circle. M2's four armor seals are the player's shields | Pull the generator's main breaker | "House Card. If it speaks to you, don't answer." |
| Johto | Standby | The roof door, while Archer goes through to find the man he is waiting for | Close it behind him, or refuse to hold it | "Standby. If I go through, hold the roof for ten minutes. If I don't come back, hold it for nobody." |
| Hoenn (Aqua) | Stowaway | The Blue Orb, while Archie fights the link | Drop it into the sea | "Stowaway, if she takes me under, you finish it." |
| Hoenn (Magma) | Ember | The Red Orb, while Maxie fights the link | Set it down on the cooling rock | "Ember. I calculated a role for you. Disregard it. Improvise." |
| Sinnoh | Probationer Ceres | One Red Chain; Cyrus holds the other | Open your hand | "Ceres. You are still feeling something. I can see it from here. Hold the chain regardless." |
| Unova | The Seventh Sage | The third Splicer wedge | Pull it | "The seventh seat. I dusted it myself. Do you know how long it has been since I did a thing with my own hands that was not a lie?" |
| Kalos | The Guest of Honor | A place inside the weapon's shelter; the offer is real | Step back out through the door | "I charged them all. I could not bring myself to charge you." |
| Alola (Aether) | The Deputy Director | The gate, and then one of the three veils, from inside | Part the veil | "Deputy. You've never once tried to leave. I can't tell you what that means to me." |
| Galar | Junior Executive, Future Planning | The Wishing Star feed, held open | Close the feed | "Future Planning. A department of one. I've never had anyone to *talk* to about the year three thousand." |
| Paldea | Fulu Squad | Nothing. Phase 6 is the same for everyone: Team Star and the player against the hijacked engine | — | "Fulu's the faintest star in the W. You can't see it from a city. It's still *in* it. I checked." |

**Alola, Team Skull.** Numbskull Number One has no Phase 6. The Skull route ends at Raid 5, where Guzma either walks into Aether's building with the player beside him or is talked out of it. From there the player is offered the white coat, or goes home.

**Paldea.** Team Star's allied route has no inverted Apex because Team Star did not build one. Cipher's buyer hijacked their engines. Standing with Team Star means fighting Phase 6 on the same side as everyone else. This is deliberate: it is the one route where standing with the team is plainly the right thing, and the game lets it be.

### X7.3 What the Apex says to you

These are heard only on this route.

> **M2** *(first seal)*: "…You. You are not one of his. You stand like you're waiting to be told. So did I."
> **DARK CELEBI** *(first ring)*: *(a sound like a bell under water; the subtitle reads only)* "…yesterday you were kinder."
> **ABYSSAL** *(first link)*: *(no words: the tide goes out past the player's feet, and comes back warmer)*
> **CINDERHEART** *(first link)*: *(the ground under the player alone goes cool)*
> **STILLHOUR** *(first chain)*: *(the player's own last minute plays again: they see themselves take up the chain)*
> **ABSOLUTE** *(first wedge)*: "…cold. …you are warm. …why are you on this side."
> **THE BATTERY** *(first petal)*: *(every flower on the player's uniform, if Team Flare gave them one, opens)*
> **THE MOTHER BEAST** *(first veil)*: "Deputy. Dear. Stay where Mother can see you."
> **THE DARKEST DAY** *(first feed)*: *(the feed in the player's hands beats once, like a pulse)*

A player with the runner close by (X6.3) gets one more line:

> **THE RUNNER:** "It's looking at you. Why's it looking at *you*?"

---

## X8. The Audit: the liaison on this route

`GRAND_ARC.md` says Cipher has no allied route. That holds. But on the Inside Man route the liaison is on the player's side of the line, so the ordinary way to earn the region's Data ROM (beating the liaison) does not come up by itself. The Audit is how it comes up.

### X8.1 The liaison as a colleague

From Respected rank the liaison treats the player as staff.

> **EIN** *(Kanto)*: "House Card. Hold this clipboard. No, facing me. I need the readings, not your face."
> **MIROR B.** *(Johto)*: "Darling! A new face in the chorus line! Can you keep time? No? Stand at the back and sway."
> **LOVRINA** *(Sinnoh)*: "Ooh, Ceres! You can carry my samples. Careful, they're *feelings*."
> **SNATTLE** *(Unova)*: "A seventh Sage. How irregular. I shall require a form. I shall require you to *design* the form."
> **VENUS** *(Kalos)*: "The Guest of Honor! Look into camera two. Don't speak. Perfect. You're a natural at not speaking."
> **ARDOS** *(Galar)*: "Future Planning. I have read your file. It is short. Keep it short."

Reputation moves as in X3.1: being seen with the liaison costs trust, and arguing with them earns it.

### X8.2 Phase 6b — The Audit

When Phase 6 ends, in any of its three ways, the liaison tries to leave with the readings. This is their only interest in the whole affair.

> **THE LIAISON:** "Well. That's my data. Do carry on with your…" *(a gesture at the room)* "…whatever this was."

**[Let them go]** Nothing happens. The ROM can be taken late, at the finale.
**[Stop them]** A duel with the liaison (their regional team, as written in that region's expanded script). Winning it earns the ROM **in its own region**, with full effect at the finale.

The Leader's reaction is the reward:

| Leader | If the player stops the liaison |
| --- | --- |
| Giovanni | "I'd have had it done quietly. Yours was louder. …Yours will do." |
| Archer | "He never paid for the antenna time. Thank you." |
| Archie / Maxie | *(a look between them, if both are present: the only thing they have agreed on all year)* |
| Cyrus | "An emotional act. …I find I do not object." |
| Ghetsis | "You have cost me a supplier. I shall pretend to be angry. Do not look for it to be convincing." |
| Lysandre | "She filmed my friends dying and called it content. I should have done that myself." |
| Lusamine | "Eldes was always going to give it to you, dear. He was never really mine." *(Alola's ROM cannot be missed)* |
| Rose | "Good heavens. Well, I shan't be invoiced now, shall I." |

**Paldea.** Nascour is beaten under the clock by everyone, as written. There is no Audit there.

---

## X9. The Verdict, extended

The three endings are the base document's. The Extended Cut adds what each does to the Apex and to the people around the player.

### X9.1 The Apex clause

| Ending | Phase 6 ended in Hold | Phase 6 ended in Let go | Phase 6 ended in Broken |
| --- | --- | --- | --- |
| **Rise** | The team keeps the Apex. Ledger: `taken` | Not available: letting go began **Turn** | The Apex is free. Ledger: `freed`. Rise is still offered: "You held longer than my Executives did." |
| **Take the Throne** | After winning, the player decides: **keep it bound** (`taken`; the player's team now owns the worst thing in the region) or **free it** (`freed`; the team's first order from its new Leader) | Not available | `freed`; the fight for the chair has no Apex in it |
| **Turn** | The normal Phase 6 follows the Leader fight: the player breaks the parts they were just guarding, each at half shield because they know where the seams are | The Apex is already free. It takes one action against the Leader in the fight that follows, then goes | `freed` |

### X9.2 Take the Throne, in depth

Requirements: reputation +70, as before.

- **The fight** is the normal Leader fight with the Doctrine active. If the Apex is still bound, it does not take part: it is waiting to see who wins.
- **The officers choose.** Each named officer in the room sides with the Leader or the player. The split depends on reputation (at +85 or more, the majority side with the player) and on `standwith.mercies` (at 3 or more, the runner steps forward first, and two Grunts follow because the runner did).
- **After.** The player leads the team. The first three orders are choices, and the game remembers them in the Doom Ledger:

| First orders | Options |
| --- | --- |
| **The Pokémon** | Release every Shadow the team holds / Keep them / Send them to Krane |
| **The plan** | Finish it / Stop it / Change it (a one-line plan of the player's own, chosen from three that fit the team) |
| **The old Leader** | Let them go / Hold them / Offer them a job |

A team led by the player appears in the Region of Doom as the player's own district. It is as good or as bad as those three answers.

### X9.3 The runner's ending

| What happened | The runner |
| --- | --- |
| Rise | Is promoted, to their horror. Sends the player a postcard from somewhere worse |
| Take the Throne | Is the player's first officer. Asks, quietly, whether this means they can use their name again |
| Turn | Goes with the player to the door and stops. "I can't. My mum thinks I work in logistics." They are in the Region of Doom later, at Gym 5's kitchen, washing up |
| The player fell | Is the one who carries the party to the Pokémon Center |

---

## X10. Living in an Allied-Occupied region

After Rise or Take the Throne the region is **Allied-Occupied**. The base table gives the rules (shop prices, Wanted status). This is what it looks like.

| Region | Under the team | A civilian line |
| --- | --- | --- |
| Kanto | The Game Corner has a second floor again. The police have new uniforms and the same faces. Everything works slightly better and nobody says why | "Trains run on time now. I'd rather they didn't, if you take my meaning." |
| Johto | One station on every radio. It plays good music. Between songs a calm voice asks if anyone has seen a certain man | "My gran likes the tunes. She's stopped asking where the other stations went." |
| Hoenn | The coastline has moved, one way or the other. Maps are being reprinted. Slateport is either a reef or a hill | "We've all got new addresses. Same houses." |
| Sinnoh | It is very quiet. Nobody argues in the street. Nobody laughs much either | "I can't remember what I was upset about. That used to be a nice feeling." |
| Unova | Pokémon Centers are closed. Released Pokémon stand in fields facing the towns | "He says they're free. Mine comes to the fence every evening and I'm not allowed to open the gate." |
| Kalos | Lumiose is beautiful, and half empty, and the half that is left were on a list | "We were chosen. I keep telling myself that's the same as lucky." |
| Alola | Every wild Pokémon is safe, labelled, and behind glass | "Auntie's Meowth is in the Conservation Area now. We can visit on Tuesdays." |
| Galar | The lights never go out and the League never stops. The sky has a red edge after dark | "Chairman says there's enough power for a thousand years. I only wanted it for the kettle." |
| Paldea | The Academy has a new student council. Classes are optional. Attendance is up | "Nobody's making them come. That's the bit the staff room can't get over." |

**Rules that follow the player out.**

- **Wanted** (base §7): authority ambushes at 15% for 8 nodes in the next region. In the Extended Cut the ambushers may include one member of the Cavalry the player beat (X6.4), who has taken it personally.
- **The next region's team has heard.** At the next Ignition, that team's recruiter opens with a reference to it, and the starting reputation on that region's Inside Man route is +40 instead of +30.
- **The next region's defenders have heard too.** Gym Leaders have one new line. No Gym refuses the player (decision D4: Gyms are never locked).
- **The rival** follows the base variant table. In the Extended Cut the rival writes once, in the next region, whatever happened. The letter is in X12.5.

---

## X11. Ways out

The route is a commitment, and it is never a trap. These are all the points at which the player can still turn, and what each one costs.

| When | How | Cost |
| --- | --- | --- |
| Any raid offer | Choose **[Sabotage from inside]** | Reputation, as in the base table |
| Any Loyalty Job | Fail it on purpose | −5 reputation, −1 AS |
| Phase 0 | Choose **[Take them on]** | The normal climax, with a Betrayal opening: the team's first Phase 1 battle is the player's own runner's squad, who do not want to fight. The runner does not battle |
| Phase 0 | Choose **[Stay out]** | As the base rules. The team calls it desertion; reputation is set to 0 |
| Phase 2 | Leave one objective point undone | The plan is weaker (the Apex has one part fewer in Phase 6). Nobody can prove it was deliberate |
| Phase 6 | The **let-go action** | Begins Turn at once |
| Phase 6b | **[Stop them]** | None |
| Phase 7 | Choose **Turn** | As the base rules: Hostile, Heat 80 |

After the Verdict there is no further turn in this region. That is what a Verdict is.

**What can never happen:** the player cannot be forced onto this route, cannot be locked into Rise, and cannot lose Pokémon to the team for changing their mind. A Shadow Pokémon the team gave the player stays with the player on every exit.

---

## X12. Dialogue bank

### X12.1 Officers, by reputation band

| Team | Recognized (+30) | Respected (+45) | Trusted (+60) |
| --- | --- | --- | --- |
| Rocket | "New. Don't touch the Persian." | "You again. Good. The others break things." | "The boss asked what I thought of you. I said you count the exits. He liked that." |
| Rocket Returns | "We're a tribute act. Try to know the words." | "You've a steadier hand than Proton. Low bar. Still." | "If he does come back, I'd like him to meet you. I'm not sure why I said that." |
| Aqua | "Bro's new stray. Can you tie a bowline?" | "Shelly says you're all right. Shelly says that about one person a year." | "Archie's wrong about the sea, you know. Not *wrong* wrong. He just loves it too much to be careful." |
| Magma | "State your specialism." | "Your reports are legible. You would be surprised." | "The Leader's model has an error term he does not discuss. I am telling you because you will be near it." |
| Galactic | "Probationer. Stand there." | "Probationer. Stand here." | "I'm going to say something and then we will both forget it. I miss being annoyed." |
| Plasma | "Welcome, friend of Pokémon." | "Lord Ghetsis mentions you. He does not mention people." | "Half of us still believe the speech. Find out which half you're standing in." |
| Flare | "The suit is non-refundable." | "You wear it well. That's most of what we do." | "He cries, you know. At the list. Then he signs it." |
| Skull | "Yo." | "YO." | "Boss talks about you when he thinks we ain't listening. It's embarrassing. For him. Not you. You're cool." |
| Aether | "Welcome to Paradise. Please sanitise." | "The President asked that your coat be tailored." | "Don't let her call you family. I'm saying that as someone she calls family." |
| Macro Cosmos | "Lanyard." | "The Chairman remembered your name. He doesn't remember mine, and I schedule his day." | "He's a good man. I need you to know I think that, because of what I'm going to ask you to help me stop him doing." |
| Star | "…Hi." | "You can sit with us. If you want. No pressure." | "We weren't meant to be a gang. We were meant to be a study group that didn't get hit." |

### X12.2 The defenders

> **POLICE OFFICER:** "You're the one in the reports. You're younger than the reports."
> **RANGER:** "I've caught poachers who looked sorrier than you. Not many."
> **GYM TRAINER:** "Leader says go easy. Leader's nicer than me."
> **A PARENT, AT THE BARRIER:** "My kid's got your League Card on their wall. I'm going to have to explain this."
> **{gymLeaderG}** *(after losing)*: "Then it's on you now. All of it. I hope you're as good as you think they are."

### X12.3 The honest question

At Allied (+70) each Leader asks the player one question and means it. The answer changes one line of the Verdict and nothing else.

| Leader | The question |
| --- | --- |
| Giovanni | "If I gave you this organization tomorrow, what is the first thing you would stop it doing?" |
| Archer | "Do you think he's coming back? Don't be kind." |
| Archie | "When you look at the sea, d'you see what I see, or d'you just see water?" |
| Maxie | "Have I made an error? I am asking you because you are the only person here who would say yes." |
| Cyrus | "Describe what you felt, a moment ago, when I asked you to hold the chain. Precisely. I am trying to remember." |
| Ghetsis | "Do you believe me? …No. Good. Nor did my son. It is restful, being disbelieved by someone competent." |
| Lysandre | "Is it beautiful? The world I am saving. Or have I only kept the parts that flatter me?" |
| Guzma | "You ever get told you were nothin'? …Yeah. Thought so. Knew there was a reason I liked ya." |
| Lusamine | "You wouldn't leave, would you? If I opened the door. Tell me you wouldn't." |
| Rose | "A thousand years from now, will they thank me? Take your time. I've rather staked everything on it." |
| Penny | "Was it worth it? All of this, so five people had somewhere to eat lunch?" |

With five mercies counted (X4.3), the Leader adds one sentence before the Verdict:

> **GIOVANNI:** "The flowers. The lid. The tailgate. I know. A sentimental agent is a liability. I find I've kept you anyway."
> **CYRUS:** "You said its name. On the ward. I heard. I have been unable to stop hearing it."
> **PENNY:** "You read all of it. The reports. Even the ones about us. …Thanks for not saying anything."

### X12.4 If you fall, in the Extended Cut

The base lines stand. One more is added, from the runner, after the rival's:

> **THE RUNNER:** "I've got you. I've got you. Somebody get the *door*."

### X12.5 The rival's letter

Sent one region later, after a Stand-with victory.

| Variant | The letter |
| --- | --- |
| Opposes (Help) | "I keep starting this and it keeps coming out angry. I'm not angry. I was. I'm in the next town over if you ever want to tell me why. I'd listen. That's all." |
| Already inside (Beat-you), released | "You let me go. You didn't have to. I don't understand you and I'm starting to think that's on me." |
| Already inside (Beat-you), handed over | *(No letter. A League Card of the rival arrives, torn in half, with one half missing.)* |
| Stands beside (Side-with) | "We won. I keep saying it out loud to see if it sounds better. Write back. I don't want to be the only one who was there." |

---

## X13. Flags and tests

### X13.1 Flags

| Flag | Meaning |
| --- | --- |
| `<team>.insideman` | Base flag: the player joined |
| `standwith.codename` | The name in X2.1 |
| `standwith.runner` | `close` if the player asked "Are you?" in the Canteen |
| `standwith.mercies` | 0–5, never shown |
| `standwith.roster` | Districts assigned in Phase 0b |
| `standwith.phase6` | `hold`, `letgo` or `broken` |
| `standwith.audit` | `stopped` or `let-go` |
| `standwith.orders` | Three values, after Take the Throne |
| `xdNNN` | `freed` or `taken`, as in `GRAND_ARC.md` §7 |

### X13.2 Tests (in addition to base §9)

- The code name shown matches the region's primary team, and the Hoenn and Alola names follow the team joined.
- Rank on the route changes access only: a battle simulated at +30 and at +70 has identical statistics.
- Each of the 45 Loyalty Jobs has a catch and a small mercy, and no mercy can turn a job's result into Failure.
- `standwith.mercies` is never displayed before the Verdict.
- Sabotage lowers AS by the same number of steps as Operation Strength.
- The Allied Extended Cut has 10–14 battles for any AS; the Standard Cut is unchanged at 8–11.
- A district without an officer starts Contested; the runner can hold exactly one.
- In Phase 6, damage reduction is 25% while a part stands and 0% when none does.
- The let-go action is offered every turn of Phase 6 and always leads to Turn.
- *Broken* never ends the run.
- The Audit earns the ROM in-region when won and leaves it available late when declined; Alola's ROM is always received.
- Paldea has no inverted Apex and no Audit.
- Rise is unavailable after *Let go*; Take the Throne is refused below +70.
- Every exit in X11 leaves the player's party intact.
- A kept Shadow Pokémon given by the team remains with the player after Turn.
- The rival's letter matches the rolled variant and the Verdict choice.
