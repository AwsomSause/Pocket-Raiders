# RIVAL SYSTEM OVERHAUL — CONSOLIDATED SPEC

**Builds on:** your `Rival_System_Overhaul_Rough_Draft.md` (Parts I–XVI), plus every rival line in `Stuff.md` and `Stuff_2.md`.
**What this is:** the draft is a very large backlog. This document is the part of it to build first, with the open questions decided, numbers attached, and your newer notes folded in. The draft's 350 ideas stay valid as a backlog; nothing here deletes them.
**Companion:** `RIVAL_DIALOGUE_BANK.md` holds the lines.
*Numbers are starting values for tuning. Nothing here has been playtested.*

---

## 1. What changed from the draft

| Topic | Draft | Now | Why |
| --- | --- | --- | --- |
| Losing to a rival | Rival gets a progression jump | The same, **and the run never ends on a rival loss** | `Stuff.md` |
| Battle items | Rival mirrors the player's items, Max Revives included | **Nobody uses healing items in battle.** Parity covers held items and the scarce revival item only | `Stuff.md` removes in-battle healing |
| Who can be a rival | Curated pool | Curated pool, **Story Run off, three characters off**, no shared names, no double roles | `Stuff.md` |
| Variety | Weighted selection | **Shuffled bags** for archetype, battle style and story arc | "Average out" ×3 |
| AI | Bounded counter-picking | The same, and **rivals run the top AI tier in the game** | `Stuff.md` |
| Pseudo Stages | Not specified | Rival appears in **65%** of them | `Stuff_2.md` |
| Catch step-in | Not specified | Turned down hard (section 7) | `Stuff.md` |
| Assists | Not specified | Turned up (section 7) | `Stuff.md` |
| New | — | Rival Report (R key), Witness the Rest, Second Chance, First-Stage Pity | Both files |

---

## 2. The twelve rules

The first seven are the draft's. The last five are yours from the newer notes.

1. **Parity.** The rival never has a resource the player could not have. Held items are matched by tier. The revival item is matched by count. Neither side uses healing items in battle.
2. **A rival who beats the player gets ahead.** A real, visible lead in the campaign (section 3).
3. **Levels stay in range.** Rival levels are clamped to the player's highest level −1 to +1; the ace may be +2. Being ahead in the campaign never widens this.
4. **The ace is the ace.** It is fixed per rival and is not always sent out last.
5. **Curated pool.** Only characters marked eligible can be the main rival.
6. **Personality survives randomisation.** A random team does not make a random person.
7. **Difficulty is earned.** The rival only knows what it has seen.
8. **A rival loss never ends the run.** It costs position and changes the relationship.
9. **One name, one role.** No two rivals in a run share a name. A character who is a rival this run appears as nothing else this run: not a Gym Leader, not a route trainer, not a stand-in.
10. **Even variety.** Archetypes, battle styles and story arcs are dealt from shuffled bags, so every one comes up about as often as every other.
11. **The best AI in the game belongs to the rivals.**
12. **Rivals are present.** More battles, more Pseudo Stage appearances, more assists, and a way to see where they are at any time.

---

## 3. Losing to a rival

### 3.1 What happens at once

- The battle ends. **The run continues.**
- The player's party is restored to 50% HP at the next node. Who arranges that depends on the rival's personality (a Protector does it without a word; a Bitter Challenger leaves the player at a Pokémon Center door and makes sure they know it).
- No items or money are taken.
- The rival gains **Lead** and the relationship moves.

### 3.2 Lead

Lead is how far ahead of the player the rival is in the campaign. It is a number from −3 to +3 and it is shown on the stage map as the rival's marker.

| Event | Lead |
| --- | --- |
| Rival beats the player | +1 |
| Player beats the rival | −1 |
| Player skips a rival's challenge | +1 (once per region) |
| Player completes a Pseudo Stage the rival was racing | −1 |
| Rival is captured (Rival Rescue Plan) | set to −1 |

| Lead | What the player sees |
| --- | --- |
| +1 | The rival reaches the next Gym first. The Leader mentions them. One reward node has already been picked over: one of its three choices is gone. |
| +2 | The rival claims a regional objective first: a rare Pokémon, a tournament, a title. That Pokémon joins their team. |
| +3 | The rival is on course to become Champion. If they are still at +3 when the player reaches the League, **they are the final battle.** |
| −1 | The rival is training to catch up; their next team has one deliberate answer to the player's ace. |
| −2 | The rival's story arc reaches its low point (section 5.3). |
| −3 | The rival asks the player for help, or stops asking anyone. Depends on who they are. |

Lead changes **where the rival is**. It never changes their levels (rule 3).

### 3.3 The Mark

Every rival battle leaves one **Mark**: a short, permanent note on the relationship for this run, shown in the rival's profile. Marks drive dialogue. A rival has at most five; the oldest fades.

| Mark | How it is earned | What it changes |
| --- | --- | --- |
| *First Blood* | Whoever wins the first battle | Referenced for the rest of the run |
| *Swept* | One Pokémon knocked out four or more | The loser brings a specific answer to that Pokémon next time |
| *By a Thread* | The winner's last Pokémon was under 20% HP | Respect +2 for both |
| *Ace Down First* | The ace fainted before any other Pokémon | The rival changes when they send it out |
| *No Contest* | The loser knocked out nobody | Resentment or Admiration, by personality |
| *You Held Back* | The player won without their strongest Pokémon | Bitter and Prodigy rivals are insulted; Enthusiasts are thrilled |
| *The Hand Up* | The winner helped the loser afterwards | Trust +2 |
| *Left Standing* | The player walked away without a word | Rivalry +1, Friendship −1 |

### 3.4 The six axes

The draft's six axes stay: **Friendship, Respect, Trust, Rivalry, Resentment, Admiration**, each 0–10.

| Player does | Moves |
| --- | --- |
| Wins a close battle | Respect +1, Rivalry +1 |
| Wins easily | Respect +1; Resentment +1 for Bitter, Prodigy; Admiration +1 for Underdog, Enthusiast |
| Loses a close battle | Respect +1 |
| Loses easily | Respect −1; Friendship +1 for Protector, Enthusiast |
| Helps in an event | Trust +1, Friendship +1 |
| Refuses help | Trust −1 |
| Stands with an evil team | Trust −3 for most; Rivalry +2 |
| Rescues the rival | Trust +3, and Resentment +1 for the proud ones |

---

## 4. Who can be a rival

### 4.1 Switched off

- **Story Run** is disabled: hidden from the menu, and its fixed act teams are removed from every pool. Existing Story Run saves stay on disk untouched.
- **Dara Quinlan, Kael Verhoeven and Hale Brightwater** are disabled in every role (main, second, special, candidate, ordinary trainer). Their data stays; an `enabled: false` flag keeps them out.

### 4.2 Names and roles

At run start the game reserves every rival it will use (main, second, special). For each:

- Its name is unique among them. If two candidates share a first name, the second is re-drawn.
- Its character id is **locked** for the run. Trainer pools, Gym Leader pools, climax stand-ins and event casts skip a locked id.
- A check at each battle start asserts that no trainer on the field shares a locked id unless they are that rival.

### 4.3 Roles

The draft's four roles stand: **Main**, **Secondary**, **Special**, **Candidate**. One main rival per run, chosen at the start and never swapped mid-run without a story event.

---

## 5. Even variety

Your notes ask three times for things to be averaged out: archetypes, styles and story arcs. Weighted random will always clump. A shuffled bag will not.

### 5.1 The bags

For each of the three lists the save file keeps a **bag**: every entry once, shuffled. Each run draws the next entry. When the bag is empty it is refilled and reshuffled, with one rule: the first draw of a new bag is not the last draw of the old one.

- Within a run, the main and second rival never share an archetype, a battle style or a story arc.
- Characters are drawn the same way from a bag of eligible characters *for the drawn archetype*.
- **Test:** over any 40 runs, every archetype, style and arc appears exactly five times as the main rival's.

### 5.2 Eight personalities

These are the draft's eight character styles, with short names. The dialogue bank is keyed to them.

| Personality | Traits (from the draft) | Pack archetype it replaces |
| --- | --- | --- |
| **Champion-Chaser** | Competitive, Arrogant | Hotshot |
| **Bitter Challenger** | Ruthless, Insecure | Bitter |
| **Enthusiast** | Friendly, Reckless | Friendly |
| **Idealist** | Idealistic, Intellectual | Mirror |
| **Strategist** | Intellectual, Manipulative | Scholar |
| **Protector** | Stoic, Protective | Lone Wolf |
| **Prodigy** | Arrogant, Perfectionist | Prodigy and Heir |
| **Underdog** | Insecure, Determined | (new) |

### 5.3 Eight battle styles

| Style | How the team plays | What the player learns to do |
| --- | --- | --- |
| **All-Out** | Fast, frail, hits first | Take one hit and answer |
| **Wall and Punish** | Bulky, wears the player down | Bring something that breaks walls |
| **Weather** | One weather, built around it | Change or outlast the weather |
| **Status** | Sleep, paralysis, poison, then clean up | Carry a cure plan out of battle; lead smart |
| **Speed Control** | Tailwind, Trick Room, paralysis | Have two speeds on the team |
| **Pivot** | Switches constantly for position | Predict, or punish the switch |
| **Set-Up** | One Pokémon boosts and tries to win alone | Stop it early (see the anti-sweep rules in `BALANCE_AND_SYSTEMS.md`) |
| **Mirror** | Copies the player's best idea from last time | Stop relying on one idea |

### 5.4 Eight story arcs

| Arc | Shape | Ends in |
| --- | --- | --- |
| **The Race** | They want the title more than the player does | A final at the League |
| **The Fall** | They lose something (the ace, their nerve) and vanish | A return |
| **The Student** | They start behind and learn from the player | A battle the player may lose |
| **The Temptation** | An evil team offers them what they want | A rescue, or a fight across the line |
| **The Inheritance** | They are carrying someone else's expectations | Putting them down |
| **The Wall** | They start far ahead and are the mountain | Being caught |
| **The Truce** | They and the player keep needing each other | Friendship, with one last battle |
| **The Goodbye** | They are leaving at the end of the run, and both know it | A farewell |

Any personality can be dealt any arc. A Champion-Chaser on *The Student* is a proud person learning to ask; an Underdog on *The Wall* is someone who got good before the player arrived and does not believe it.

---

## 6. The strongest AI in the game

### 6.1 The ladder

| Tier | Who | What it does |
| --- | --- | --- |
| 1 | Early route trainers | Picks a damaging move; never switches |
| 2 | Route trainers | Uses type advantage; switches out of a 4× weakness |
| 3 | Aces, Gym trainers | Reads damage ranges; uses status; keeps a finisher alive |
| 4 | Gym Leaders, Elite Four, bosses | Plans two turns; sacks deliberately; tracks the player's revealed moves; sets and uses hazards and weather |
| **5** | **Rivals**, the Champion | Everything in 4, and the five behaviours below |

### 6.2 What tier 5 adds

1. **A win condition.** Before the battle it names one (the ace sweeping late, the weather holding, a stall). Every turn it asks whether the move protects that plan.
2. **A scouting ledger.** It remembers every move, item and ability the player has shown **to this rival, in this run**. It plays around what it has seen and guesses sensibly about what it has not.
3. **Switch prediction.** When the player's obvious play is to switch, it uses the move that punishes the switch about half the time. The split shifts with how the player has actually behaved.
4. **Endgame solving.** With two Pokémon or fewer on each side it searches the remaining turns and plays the line that wins most often.
5. **Trade sense.** It will give up a weakened Pokémon to bring the ace in safely, and it will not give up the ace for anything less than the battle.

### 6.3 Personality is style, not mistakes

A rival's personality changes *which* good play they prefer. It never makes them play badly on purpose.

| Personality | Tendency |
| --- | --- |
| Champion-Chaser | Takes the aggressive line when two lines are equal |
| Bitter Challenger | Targets the Pokémon that beat them last time, even at a small cost |
| Enthusiast | Stays in for the exciting trade |
| Idealist | Will not sack; switches to save everything it can |
| Strategist | Sets up one more turn than is comfortable; loves the punish |
| Protector | Guards the ace and the team's weakest member |
| Prodigy | Plays the textbook line; rattled (one turn of tier 4) the first time something unexpected happens |
| Underdog | Plays tighter when behind than when ahead |

### 6.4 Counter-picking, bounded

| Encounter | Team slots that may be chosen against the player | Based on |
| --- | --- | --- |
| First battle | 0 | — |
| Mid-region | 1 | Pokémon the rival has battled |
| Region finale | 2 | The same, plus anything a Rival Report showed |
| League or final | 3 | Everything in the ledger |

The rival never counters a Pokémon it has not seen. A player who changes their team between meetings has beaten the scouting, and the rival says so.

---

## 7. Presence: more rival, in more places

### 7.1 Battles per run

| Slot | Rule |
| --- | --- |
| Main rival, guaranteed | Two battles per region: one early, one at the region's end |
| Main rival, flexible | 50% for a third, placed by Lead (ahead: they are waiting; behind: they catch the player up) |
| Second rival (if present) | One per region, and one shared battle in the last region |
| Finale | One, at the League, if Lead is +3 or the arc calls for it |

That is six to ten rival battles in a three-region run, up from the current count. Ordinary trainer fights rise too; see `BALANCE_AND_SYSTEMS.md`.

### 7.2 Pseudo Stages

The main rival appears in **65%** of Pseudo Stages; the second rival, in 30% of those where the main rival is absent. One of four ways:

| Form | What it is |
| --- | --- |
| **The Race** | They entered by another path. Whoever reaches the end first takes the first pick of the reward. |
| **The Team-Up** | They join as a partner for the stage's hardest fight. |
| **Already There** | They have finished it. They are sitting at the exit, and what they say depends on Lead. |
| **The Ambush** | They challenge the player at the worst moment. Rare; never when the party is below 50% HP. |

### 7.3 Catch step-in: turned down

The rival interrupting a catch is memorable twice and irritating the tenth time.

- Chance: **3%**, and only on a wild Pokémon of Rare tier or above.
- At most **once per region**.
- Never on the player's first Pokémon of a stage, never on an event or story Pokémon, never on a Legendary, never when the player has fewer than three Pokémon.
- When it happens it is a scene: the rival wanted it too. The player may battle for it, let them have it (Friendship +1), or suggest they both leave it be.

### 7.4 Assists: turned up

| Situation | Chance the rival joins as assist trainer | Needs |
| --- | --- | --- |
| Evil-team climax | 70% | Trust 3 or more, and the rival is not captured or turned |
| Raid or giant-Pokémon event | 50% | Any relationship short of open hostility |
| A battle the player is losing badly in a Pseudo Stage | 25% | Friendship 4 or Respect 6 |
| Champion battle, after a Second Chance | Always | — |

An assisting rival brings three Pokémon including their ace, plays at tier 5, and talks.

---

## 8. The Rival Report

**On the stage map, press R.** For each rival in the run: a ten-second news clip and a short cutscene of where they are and what they are doing. All rivals, not only the main one.

- The clip is a regional broadcast: a presenter line, a location card, the rival's portrait.
- The cutscene is built from the rival's simulated state: at a Gym, in a Pseudo Stage, training, recovering, captured, on a boat.
- A report **costs nothing and can be watched any time**, but it updates only when the rival's state changes.
- A report is also information for both sides: if it shows the rival's new Pokémon, the player knows it; and if the player was on the news for something (a tournament win, a climax), the rival's ledger gains what the broadcast showed.

| Rival state | Example presenter line |
| --- | --- |
| Reached a Gym first | "A challenger left the Gym this morning with the badge and, staff say, very few words." |
| Won a tournament | "The bracket's youngest entrant took it in four." |
| Lost to the player | "No comment from the trainer seen leaving Route 9 at a run." |
| Training | "Hikers report lights on the ridge after midnight again." |
| Caught a rare Pokémon | "The sighting is confirmed. So, we understand, is the capture." |
| Captured | "The League has declined to say whether a registered trainer is among the missing." |
| With an evil team | "We have chosen not to broadcast the footage." |
| Ahead by +3 | "Bookmakers have stopped taking bets on this year's Champion." |

---

## 9. Witness the Rest

After a run is lost, the game-over screen offers **Witness the Rest**.

- The campaign is simulated to its end without the player. Each rival's remaining Gyms, climaxes and League run are resolved from their strength, arc and Lead.
- The player watches six to eight cards, about a minute in all, skippable: the next Gym, the region's crisis, who stood against the evil team and whether that was enough, the League bracket, the Champion.
- **The last card is addressed to the player** and depends on the relationship: a rival with high Friendship leaves the player's name on the Hall of Fame plaque beside theirs; a Bitter Challenger with high Resentment wins and finds it is not what they wanted; a rival who was captured and never rescued is not in the bracket at all.
- **It carries over.** The result is saved to the Rival Archive. In later runs, that world's Champion can be heard of in rumours, and *The Ones You Left* (in `GREENNEEDLE_NEW_EVENTS.md`) uses the same record.

---

## 10. Second Chance

**5% of the time, when the player loses a run:**

1. The screen fades slowly to black.
2. Glowing white text fades in and out, one line at a time:

> It's the end.
> You've fallen.
> Or so you think.
> No.
> Open your eyes.
> You've been given a second chance.

3. The screen fades back into the same fight. **The rival is beside the player.** They say one line, by personality (the bank has them).
4. The player's whole team is revived at **25% HP** with **+1 to every stat**. The battle continues as a tag battle with the rival as partner.

Rules:

- **Once per run.** The 5% is flat; nothing raises or lowers it.
- It can trigger on any run-ending loss, including the Champion.
- If the rival is captured, turned, or was the opponent in this battle, the **second rival** comes. If there is nobody, a silhouette the player does not recognise stands beside them and says nothing; this is deliberate.
- If the Flight North return is available, that plays instead and Second Chance is not rolled.
- Winning after a Second Chance sets the Mark *The Hand Up* from the rival's side.

---

## 11. First-Stage Pity

If the player has **lost in the first stage five runs in a row**, the rival notices at their first meeting of the sixth run.

- Their team is 2 levels lower than normal for that battle, with no counter-picks, and they play at tier 3.
- Win or lose, they give something afterwards: a held item, an egg, or one piece of real advice about the player's team (generated from what actually went wrong: no answer to a type, no status move, an over-levelled single Pokémon).
- **How** they do it is personality. An Enthusiast offers openly. A Champion-Chaser pretends they were not trying. A Bitter Challenger is rude about it and does it anyway. A Prodigy explains what the player did wrong, at length, and is right.
- The counter resets when the player clears the first stage. The game never mentions the counter.

---

## 12. Data and tests

### 12.1 Fields to add to a rival's run state

`lead` (−3..3), `marks[]` (max 5), `axes{}` (six, 0..10), `ledger{}` (seen moves, items, abilities by Pokémon), `winCondition`, `arc`, `arcBeat`, `battleStyle`, `personality`, `lockedId`, `reportState`, `reportSeenAt`, `secondChanceUsed`, `pityActive`.

### 12.2 Save-file fields

`bags{archetype[], style[], arc[], character{}}`, `firstStageLossStreak`, `archive[]` (Witness the Rest results), `disabled[]`.

### 12.3 Tests

1. A rival loss never produces a game-over.
2. After a rival loss the party is at 50% at the next node and no item count changed.
3. Lead never changes a rival's level outside the clamp.
4. No rival uses a healing item in battle.
5. A rival's held-item tier never exceeds the player's best.
6. No two rivals in a run share a name.
7. A locked character id never appears in a trainer, Gym or stand-in pool.
8. Dara Quinlan, Kael Verhoeven and Hale Brightwater never appear in 10,000 generated runs.
9. Story Run cannot be started; an old Story Run save still loads its menu entry as read-only.
10. Over 40 runs each archetype, style and arc is the main rival's exactly five times.
11. Main and second rival never share an archetype, style or arc.
12. A rival never counter-picks a Pokémon absent from its ledger.
13. Counter-pick slots never exceed the table in 6.4.
14. Pseudo Stage rival appearance is 65% ± 3 over 2,000 stages.
15. Catch step-in is at most one per region and never on an excluded Pokémon.
16. The Rival Report plays for every rival in the run and never shows a state the simulation is not in.
17. Witness the Rest always ends in a Champion and a final card.
18. Second Chance triggers at 5% ± 1 over 10,000 losses, once per run at most.
19. Second Chance revives at exactly 25% HP and +1 to all stats.
20. Pity activates on the sixth run after five first-stage losses, and clears on a first-stage win.

---

## 13. Build order

1. Rules 8 and 9 (no run-ending rival loss; names and locked ids), and the disable list.
2. Lead, Marks and the six axes.
3. The bags.
4. AI tier 5 and the scouting ledger.
5. Presence numbers (battles, Pseudo Stages, step-in, assists).
6. The Rival Report.
7. Second Chance and Pity.
8. Witness the Rest and the Archive.
9. Then the draft's backlog: tournaments, shared expeditions, personal quests, the fifteen special archetypes.
