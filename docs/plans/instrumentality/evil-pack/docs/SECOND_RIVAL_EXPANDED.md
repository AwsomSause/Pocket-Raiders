# THE SECOND RIVAL ("THE FRIEND") — EXPANDED EDITION

**Extends:** `docs/SECOND_RIVAL.md` (every rule there still holds; this file adds to it)
**Read with:** the expanded companions to `CLIMAX_RIVAL_INTEGRATION.md`, `RIVAL_RESCUE_PLAN.md` and `STAND_WITH_THEM.md`
*The second rival is an original placeholder role, filled by the run's own rival-system data (name token `{friend}`). Every scene and line here is original to this project.*

---

## X1. What this file adds

The base document keeps the second rival small on purpose, with three rules:

1. They **never replace** the primary rival.
2. They **never betray** the player.
3. They add **at most one** extra Rival Assist budget.

All three rules stand. This file does not make the Friend bigger. It makes them *present*: more scenes outside the climax, a clear role inside the Extended Cut, and a voice about the things the Expanded Edition added (the Apex, Shadow Pokémon, the primary rival's worst day).

| Section | Adds |
| --- | --- |
| X2 | Who the Friend is: eight sketches, one per archetype |
| X3 | Two more encounters (four in all): the Errand and the Eve |
| X4 | The Friend and the primary rival: what they say about each other, and the line that turns a rival |
| X5 | The Friend in the Extended Cut |
| X6 | Caught, in depth: where, how, and what "Taken" means afterwards |
| X7 | The Friend and Shadow Pokémon |
| X8 | The Friend on the Stand-with route |
| X9 | Friends across a run: postcards, and the dock at the finale |
| X10 | 104 more lines |
| X11 | Memory, endings, flags and tests |

**The budget, restated for the Extended Cut.** In the Standard Cut the base limit holds: total Assist across both rivals never exceeds 4 in a Help climax. In the Extended Cut the climax is roughly half again as long, and the limit is **6** across both rivals, of which the Friend supplies at most **2** (X5.2). The Friend never supplies more than the primary rival does, except in Beat-you, where the base rule already gives them the full menu.

---

## X2. Who the Friend is

The rival system supplies a name. The archetype supplies a voice. These sketches supply the rest: why this person is on the road, what they carry, and the one habit that makes them recognisable in a crowd. They are deliberately light, so that any name fits.

| Archetype | Why they travel | What they carry | Habit |
| --- | --- | --- | --- |
| **Hotshot** | They were the best in a very small town and have just found out how small | A badge case with room for eight and two in it | Announces what they are about to do, then does something else |
| **Prodigy** | A scholarship requires "field experience" and they resent every hour of it | A notebook of other trainers' teams, alphabetised | Corrects their own sentences mid-way |
| **Friendly** | Their Pokémon wanted to see the sea. That is the whole reason | Too much food | Asks after the player's Pokémon by name, and remembers the answers |
| **Bitter** | They lost a qualifying match on a technicality and are walking it off, one region at a time | A rule book, annotated in red | Says "typical" under their breath |
| **Scholar** | They are writing something. It keeps getting longer | A camera with no film left and no wish to buy more | Asks permission, then does not wait for it |
| **Heir** | They left a house with forty rooms to find out whether they could manage one tent | A very good tent, pitched badly | Introduces themselves by first name only, quickly |
| **Lone Wolf** | Nobody knows. They have not said | One spare Poké Ball, never used | Is there before the player and gone before the player has finished speaking |
| **Mirror** | They saw the player once, on a route, and thought: *that could be me, if* | Nearly the same bag as the player | Finishes the player's sentences, wrongly, by one word |

**They are a different person in each region.** Presence and archetype are rolled per region (base §2), so a run may meet several Friends. X9 covers what happens to the ones left behind.

---

## X3. Four encounters

The base encounters are **Meet** and **Mid**. Two more are added. None is a battle unless the player asks for one.

| Encounter | Where | What happens | Attitude |
| --- | --- | --- | --- |
| **Meet** | base | base | +0.5 / 0 |
| **Mid** | base | base | +0.5 / −0.5 |
| **Errand** | The first town node after Raid 2 resolves (or after Raid 2 is declined) | The Friend needs a small favor (X3.1). It takes no node and can be refused | +0.5 if done; 0 if refused |
| **Eve** | The last quiet node before the climax, after the Rescue Plan's climax-eve offer if there is one | The Friend finds the player and says where they will be tomorrow (X3.2). This is where the player learns the Friend's role is about to be rolled, though not what it will be | +0.5 for [Ask them to be careful]; 0 for [Wish them luck]; −0.5 for [Tell them to stay home] |

Both new encounters obey `rival.second.encounters`. Skipped encounters leave attitude unchanged and write no memory, as in the base rules.

### X3.1 The Errand

One errand per archetype. Each can be done on the spot.

| Archetype | The favor | If done |
| --- | --- | --- |
| Hotshot | "Watch me practise my entrance. Be honest. Not *that* honest." | They give the player the item they were going to use as a prop |
| Prodigy | "Look over my team sheet. Find the flaw. I can't, and it is driving me mad." | The player is shown one true weakness of the region's Leader, which the Prodigy worked out along the way |
| Friendly | "Hold this while I feed everyone. Everyone includes yours." | Party healed 20% |
| Bitter | "Read this appeal letter and tell me if it sounds petty." | It does. If the player says so kindly, Attitude +1 instead of +0.5 |
| Scholar | "May I photograph your party? I have no film. I would like to anyway." | One party Pokémon gains Bond +1. It liked being looked at |
| Heir | "Would you show me how to light a camp stove? I have ruined two." | A cooked meal: the *Shared Table* method is available at the next rest node without a camp |
| Lone Wolf | *(They hold out a map and point at one spot.)* | A hidden item is at that spot |
| Mirror | "Trade bags with me for one node. I want to see what you carry." | The player's bag comes back with one thing added. The Mirror's comes back with one thing they did not know they wanted: the player chooses what |

### X3.2 A friendly spar (optional)

At the Errand the player may ask for a battle. The Friend agrees in every archetype but one (the Lone Wolf, who simply starts).

| Rule | Value |
| --- | --- |
| Team | Three Pokémon each, at the previous stage's tier |
| Ends | At the first side to lose two Pokémon |
| Stakes | None. No money changes hands and a loss is not a wipe: both sides are healed afterwards |
| Result | Attitude +0.5 either way. The Friend's `support-2` line in the climax changes to reference it |

The spar is the only time the player ever fights the Friend. It is the rule "never an opponent" kept in spirit: nobody is against anybody.

---

## X4. The Friend and the primary rival

The two rivals know each other. They do not much like each other, and that is useful.

### X4.1 What the Friend thinks of the rival

One sentence, said at the Mid encounter, shaped by the Friend's archetype.

| Friend's archetype | About the primary rival |
| --- | --- |
| Hotshot | "{rival}? Good. Really good. I say that so you know I'm being fair when I say I'm going to be better." |
| Prodigy | "{rival} makes emotional decisions and wins anyway. I find it statistically offensive." |
| Friendly | "I worry about {rival}. They don't eat properly. Have you noticed? I've noticed." |
| Bitter | "{rival}'s all right. Don't tell them I said so. They'd be unbearable." |
| Scholar | "{rival} is the most interesting trainer on this route. After you. Possibly before you. I have not finished the comparison." |
| Heir | "{rival} speaks to me as though my name meant nothing. I have never been so grateful to be insulted." |
| Lone Wolf | "…{rival}. Loud. …Solid." |
| Mirror | "{rival} looks at you the way I do. We've never discussed it. We won't." |

### X4.2 The line that turns a rival

When the primary rival sides with the team, the Friend's Support adds +1 to the Turn formula: "the friend says what the primary rival needed to hear" (base §4.1). This is what they say. It is spoken across the room during the Reveal Scene, before the player's own response.

| Friend's archetype | To the primary rival |
| --- | --- |
| Hotshot | "Hey! {rival}! You're better than every single person in that uniform and you *know* it, so what are you doing standing behind them?" |
| Prodigy | "{rival}. I checked your reasoning. It holds only if you assume nobody would have come for you. Two people came. Revise." |
| Friendly | "{rival}, I saved you a seat. At dinner. Every night since you went. I'm going to keep doing it, so you may as well come and sit in it." |
| Bitter | "I get it. I do. I nearly said yes to them myself. You know what stopped me? Nothing. Nobody. I just didn't. You can just *not*, {rival}." |
| Scholar | "{rival}, I have been keeping notes on you for a year. Not one page predicted this. That means it isn't you. Come and be yourself again; my data is a mess." |
| Heir | "{rival}. You once told me a name is only a thing other people call you. I have thought about it every day. Do not let them call you theirs." |
| Lone Wolf | "…{rival}. …Come on." |
| Mirror | "{rival}. I can see which one of you is talking. It's not the one I know." |

### X4.3 What the rival thinks of the Friend

Said once, by the primary rival, at the first rival encounter after the Friend's Meet. It uses the primary rival's own archetype voice and one of three attitudes.

| Primary rival is… | Line |
| --- | --- |
| Hotshot, Bitter | "Who's the new one? {friend}? You're collecting us now?" |
| Prodigy, Scholar | "I've met {friend}. An interesting choice of companion. I would like to understand the selection criteria." |
| Friendly, Heir | "{friend} seems kind. I'm glad you've someone. I mean that. Mostly." |
| Lone Wolf, Mirror | "…There's another one. …Fine." |

---

## X5. The Friend in the Extended Cut

### X5.1 Phase by phase

| # | Phase | Support (70%) | Caught (30%) |
| --- | --- | --- | --- |
| 0 | News and choice | Not mentioned | The report adds a line: "A second young trainer is reported missing near the site." |
| 0b | **Siege Map** | **Holds one district** without being asked. The player is told which and can move them once | One district is marked with a question mark: the **Annex**, where the Friend is held |
| 1 | Blackout | Not present: they are in their district | — |
| 2–3 | Gauntlet, officers | One Assist, as the base rule | The Annex can be reached: one battle against a Lieutenant, then the scene |
| — | **Breather** | Present. They have brought something (X5.3) | Present if rescued, wrapped in somebody's coat |
| 4 | Set piece | Stays with their district. If it is Held at the end of Phase 4, the Friend gains the memory `friend-held-district` | If rescued: 1 Assist from here on (base) |
| 5 | Leader | The Assist budget (X5.2) | — |
| 6 | **Colossus** | Does not fight the Apex. Stands at the edge with the primary rival's bag, the player's bag, or both. Has one line (X10) | The same, if rescued |
| 7 | Optional phase | Holds a lane if asked | Rests |
| 8 | Resolution | Is the one who notices the player has not sat down | Is the one who is asked, by everyone, if they are all right |

### X5.2 The Extended budget

| Primary variant | Friend's Assists, Standard Cut | Friend's Assists, Extended Cut | Wide-format Assist |
| --- | --- | --- | --- |
| Help | 1 | 2 | *Hold District* only |
| Beat-you | 3 | 3 | Any one of the five |
| Side-with | 2 | 2 | *Hold District* or *Take a Lane* |

The total across both rivals never exceeds 4 (Standard) or 6 (Extended).

### X5.3 What the Friend brings to the Breather

| Archetype | They bring | Effect |
| --- | --- | --- |
| Hotshot | A dramatic re-telling of the last hour, with gestures | Nothing. Morale |
| Prodigy | A revised plan on one sheet | The next phase's first enemy Pokémon is revealed |
| Friendly | Soup, in a flask, still hot | +10% healing at this Breather |
| Bitter | A list of everything that has gone wrong, so that it can be crossed off | Nothing. It helps anyway |
| Scholar | A sketch of the Apex from a distance | One part's position on the Colossus plate is marked as the weakest |
| Heir | A clean handkerchief, offered to whoever needs it | Cures one status |
| Lone Wolf | Themselves | — |
| Mirror | Exactly what the player was about to wish they had | One common item of the player's choice |

---

## X6. Caught, in depth

### X6.1 Where and how

A Caught Friend went in to help and got one room too far. Where they are held follows the team's holding site (`RIVAL_RESCUE_PLAN.md` §5), moved to the climax site's nearest equivalent and marked on the Siege Map as the Annex.

| Step | Detail |
| --- | --- |
| The tell | In the Eve encounter, a Friend who will be Caught says exactly where they mean to go. The player cannot stop them: [Tell them to stay home] only makes them leave earlier |
| The detour | One battle (a Lieutenant-rank defender), optional, shown on the map with its cost |
| The room | A scene, by archetype: the `caught-1` and `caught-2` lines of the base bank |
| If the primary rival is present (Help) | The primary rival offers to go instead: "Stay on the objective. I'll get them. …Don't look at me like that, I *like* them." This costs one of the primary rival's Assists and no battle from the player |

### X6.2 Not rescued: "Taken"

The base rule: the Friend is held by the team; if the team loses they are freed off screen. The Extended Cut adds what that looks like.

| Outcome of the climax | The Friend |
| --- | --- |
| Victory | Is found in the Resolution, in the Annex, by whoever goes to look. The `caught-3` line is said without heat. Attitude −1, as before. One region later, a postcard arrives (X9) |
| Stay out | Held for two days and released (base). The postcard is shorter |
| Defeat | The run ends. The Doom Ledger records `hostage:friend` (base) |

### X6.3 A hostage in the Region of Doom

A Friend recorded as `hostage:friend` appears in the Margin (`REGION_OF_DOOM_EXPANDED.md`): they are held in the district of the team that took them. Taking that district frees them. They have had a long time to think, and their line is the best one their archetype has:

| Archetype | When freed in the Margin |
| --- | --- |
| Hotshot | "You came back. A whole other *run* later, you came back. I'm going to be insufferable about this for the rest of my life." |
| Prodigy | "I calculated the probability of this at under two percent. I am pleased to report my model was poor." |
| Friendly | "I knew it was you by the footsteps. Isn't that silly? I knew." |
| Bitter | "…Took you long enough." *(They are smiling. They will deny it.)* |
| Scholar | "I have had time to write. It is all about what I should have done differently. You are thanked in the first line." |
| Heir | "Nobody ransomed me. My family was asked, and declined. You were not asked, and came. I shall remember the difference." |
| Lone Wolf | "…Hey." |
| Mirror | "I kept thinking: they'd come for me if they were me. And then you came, and you weren't. That's better." |

---

## X7. The Friend and Shadow Pokémon

The Friend has no stake in the Shadow system and so can say plain things about it.

- **If the player has a Shadow Pokémon in the party at the Meet or Mid encounter**, the Friend notices (X10, kind `shadow`). The first time, they hand over one Herb or Charm, "for whatever that is."
- **If the player Stabilized it**, the Friend's line changes to the second half of their `shadow` entry.
- **The Friend never carries a Shadow Pokémon**, never suggests the player should keep or purify one, and never comments twice. It is the player's decision (base Shadow document §12), and the Friend is the one character who visibly treats it that way.
- **If a Friend is Caught and held by a team with a binding method**, their own Pokémon are *not* bound. This is a rule, not luck: the Friend's role is never to be a second Shadow plot.

---

## X8. The Friend on the Stand-with route

The base rules: the Friend does not fight. They **plead** before and **react** after.

### X8.1 Between the two

In the Allied Extended Cut (`STAND_WITH_THEM_EXPANDED.md`, X6) the Friend is seen twice more, and says nothing either time.

| When | Where the Friend is |
| --- | --- |
| Phase 1, Hold the Line | At the barrier, among the civilians, not with the defenders. They are watching the player, and when the player looks, they do not look away |
| Phase 5, The Cavalry | Behind the Cavalry's line, holding somebody's coat. They are not there to fight. They came so that the player would have to do it in front of them |

### X8.2 The reaction, by ending

The base bank has one `react` line per archetype. The Extended Cut adds one for each ending (X10: `react-rise`, `react-throne`, `react-turn`). The attitude changes are the base document's: Rise −1, Take the Throne −2, Turn +1.5.

### X8.3 If the player let go

If Phase 6 ended with the player's own let-go action, the Friend is the first person through the door afterwards, ahead of the primary rival, ahead of the Cavalry. They do not have a line for it. They sit down on the floor next to the player, and the scene holds there for a moment before anyone else arrives.

---

## X9. Friends across a run

Presence is 50% per region, so a nine-region run meets four or five Friends on average, each a different archetype from that region's roll. They do not vanish at the border.

### X9.1 Postcards

One region after a Friend's region ends, a postcard arrives at the first rest node. One sentence, in the archetype's voice (X10, kind `postcard`), and a small enclosure.

| How their region ended for them | Enclosure |
| --- | --- |
| Supported, climax won | A common item, and a pressed flower or a ticket stub or a sum on a napkin, by archetype |
| Caught and rescued | A better item. They have been thinking about it |
| Caught and not rescued | No item. The card is polite |
| Stand-with: Rise or Take the Throne | The card is blank on the back |
| Stand-with: Turn | Two cards arrive. They forgot they had already written |
| Stay out | The card asks one question and has a return address |

Postcards are kept in the Notebook. They have no mechanical effect beyond the item.

### X9.2 Friends know each other

If a run meets three or more Friends, they find each other. From then on each new Friend's Meet scene opens with a second line: they have heard of the player from someone.

> **{friend}** *(after the base `meet` line)*: "A trainer two regions back told me to look out for you. Tall tale, I thought. …Apparently not."

### X9.3 The dock at the finale

If the run reaches the Citadark, every Friend whose attitude ended at +1 or better is on the mainland dock when the player sails, and again when the player returns. They are not part of the Alliance (that is for regional allies) and they do not fight. They came to see the player off.

- Each has one line (X10, kind `dock`).
- If the finale is `sung`, they are the crowd in the last image.
- If any Friend is still a hostage in the Doom Ledger from an earlier run, there is one gap in the line on the dock, and the others have left it there on purpose.

---

## X10. More lines (104)

Thirteen more kinds per archetype: `eve`, `spar` (after a friendly spar), `district` (taking up their district), `breather`, `apex` (on seeing the Apex), `shadow` (on the player's Shadow Pokémon; the second line is used if it is Stabilized), `about-beat` (when the primary rival is the one who needs rescuing), `about-side` (when they learn the primary rival joined the team), `react-rise`, `react-throne`, `react-turn`, `postcard`, `dock`.

### X10.1 Hotshot

| Kind | Line |
| --- | --- |
| eve | "Tomorrow I'm going in through the front. Don't try to talk me out of it. …You can try a *little*." |
| spar | "Okay, you won. Or I won. Somebody won and it was *close*, that's the point." |
| district | "This one's mine! Nobody gets past! Somebody write that on something!" |
| breather | "So then I said, 'Not today!' I didn't say it. I thought it really loudly." |
| apex | "…That's not a boss fight. That's somebody's *Pokémon*. That's so much worse." |
| shadow | "Is that one of the dark ones? It's got a look." *(if Stabilized:)* "…It's calmer now. You did that? Huh. Nice." |
| about-beat | "{rival} went in *alone*? Without telling— that's MY move! They stole my move and it went badly! Come on!" |
| about-side | "No. No way. {rival}? I'll talk to them. I'll *yell* at them. Same thing." |
| react-rise | "You've got a rank now. A real one. …I wanted one of those so bad. Not like that." |
| react-throne | "You run it. You actually *run* it. I don't know if I'm scared of you or for you." |
| react-turn | "You turned! At the last second! I KNEW it! I didn't know it. I hoped really hard." |
| postcard | "Got my third badge. Nobody watched. Did it anyway. Thought you should know." |
| dock | "Go be amazing. I'll tell everyone I taught you." |

### X10.2 Prodigy

| Kind | Line |
| --- | --- |
| eve | "I intend to enter by the east service door at dawn. I have told you so that one person knows. That is not sentiment. It is redundancy." |
| spar | "Informative. You adapt on turn two. I adapt on turn three. I will be working on that." |
| district | "I have this district. I have drawn it. I have drawn it twice. It will hold." |
| breather | "I revised the plan while you were fighting. Version four. Read the top line only; the rest is contingency." |
| apex | "I had modelled a weapon. That is not a weapon. I need to start again, from a different first principle." |
| shadow | "Your Pokémon is under a coercive bond. I assume you are aware." *(if Stabilized:)* "You have stabilised it rather than cured it. A defensible choice. I would like to hear the defence sometime." |
| about-beat | "{rival} acted without a plan and is now in difficulty. I am not surprised. I am, I find, quite upset." |
| about-side | "{rival} has joined them. I have checked the reasoning they would have used. It is not stupid. That is what frightens me." |
| react-rise | "You accepted a position in their hierarchy. I have run it forward ten years. I would rather not tell you what I found." |
| react-throne | "You took control. An efficient solution to a bad organisation. Also an organisation that is now yours. Mind the second part." |
| react-turn | "A late reversal. Your timing was appalling and your judgement was sound. I can work with that." |
| postcard | "Field experience completed. Scholarship retained. I learned less from the fieldwork than from you. Do not let it go to your head." |
| dock | "I have calculated your odds. I am not going to tell you. Go and make them wrong." |

### X10.3 Friendly

| Kind | Line |
| --- | --- |
| eve | "I'm going to help tomorrow. Round the side, where the staff go in. I'll be careful. I've packed a whistle!" |
| spar | "That was fun! Is everybody okay? Yours too? Come here, let me look at that paw." |
| district | "I'll stay here with the families. Go on. I've got biscuits and I've got a Blissey. We're fine." |
| breather | "Drink this. All of it. I'll hold your bag. I'll hold everybody's bag." |
| apex | "Oh, the poor thing. Oh, look at it. Can it hear us? I'm going to assume it can hear us. *We're here!*" |
| shadow | "It flinched when I put my hand out. Then it sniffed it. That's a start, isn't it?" *(if Stabilized:)* "It let me scratch its chin today! Did you see? It *leaned*." |
| about-beat | "{rival}'s in there alone? Oh no. Oh, they'll be so cross that we came. Let's come anyway." |
| about-side | "{rival} wouldn't. …They would, if they were lonely enough. Oh, I should have asked them to dinner more." |
| react-rise | "I'm still your friend. I said I would be. I'm just going to be it from a little further away for a while." |
| react-throne | "You're in charge of them now? Then be kind. Please. You know how. I've seen you." |
| react-turn | "You came back! I mean, you never left, not really, I never thought you— I'm so glad. I'm so, so glad." |
| postcard | "We reached the sea! Everyone paddled. I thought of you. I've enclosed a shell; it's not a good one, but it's the one we found." |
| dock | "I made you lunch for the boat. And dinner. And a second lunch. Come home after." |

### X10.4 Bitter

| Kind | Line |
| --- | --- |
| eve | "I'm going in the back way tomorrow. Alone. Don't make a face. It's a good back way." |
| spar | "Typical. …No. That was fair. That was actually fair. Weird feeling." |
| district | "Fine. I'll hold the bit nobody wants. I've had practice." |
| breather | "I've written down everything that went wrong so far. It's a long list. It's also *finished*. Look. Crossed off." |
| apex | "Somebody had all that power and *that's* what they made. Typical. No. Worse than typical." |
| shadow | "They did a number on that one. I know the look. It's waiting for the catch." *(if Stabilized:)* "It's stopped waiting. Good for it. Good for you. Don't tell it I said so." |
| about-beat | "{rival} got there first and got caught. That's the most relatable thing they've ever done." |
| about-side | "{rival} said yes to them. I nearly did, once. Nobody knows that. You know that, now. Let's go and get them." |
| react-rise | "You took the job. I'm not surprised. I'm tired, is what I am." |
| react-throne | "Top of the heap. Bet it's lonely. Don't write to me about it." |
| react-turn | "…You turned. At the end. Huh." *(a long pause)* "Okay. That's one I owe the universe." |
| postcard | "Appeal denied. Entered the next qualifier anyway. Won the first round. Don't say anything." |
| dock | "Don't die. It'd be typical. Don't be typical." |

### X10.5 Scholar

| Kind | Line |
| --- | --- |
| eve | "I shall be observing from the archive level tomorrow. Purely observing. I have said that twice now, which suggests I do not believe it." |
| spar | "Fascinating! You favour the second slot when pressed. I shall not exploit that. I shall merely write it down forever." |
| district | "The library district is mine. If it falls, the footnotes fall with it, and I will not have that." |
| breather | "I drew it. From the stairwell. The lower plate is thinner; you can see where I have shaded it. I did not get closer. I was not brave. I was thorough." |
| apex | "I am not going to describe it. For once I do not want the right word. I want it to be over, for its sake." |
| shadow | "There is a quarter-second delay before it obeys you. It is *choosing*. I find that extraordinarily moving." *(if Stabilized:)* "The delay is gone. Not because it stopped choosing. Because it has chosen." |
| about-beat | "{rival} went ahead without data. I would lecture them. I am told the first step is retrieving them." |
| about-side | "I have a year of notes on {rival}. None of them predicted this. So either my notes are wrong, or this is not really them. I prefer the second." |
| react-rise | "I am going to write this down exactly as it happened, and then I am going to put it in a drawer." |
| react-throne | "A participant observer who became the subject. There is a term for that. It is not a compliment." |
| react-turn | "A reversal in the final act. I had it in my notes as 'unlikely but hoped for'. I am underlining 'hoped for'." |
| postcard | "The manuscript is now four hundred pages. You are in chapter nine. It is the good chapter." |
| dock | "Come back with notes. Or without. Come back." |

### X10.6 Heir

| Kind | Line |
| --- | --- |
| eve | "I shall go in by the tradesman's door tomorrow. Nobody looks at who uses it. I learned that at home, and not happily." |
| spar | "Thank you. Nobody has ever let me lose before. It is more instructive than I was led to believe." |
| district | "I will hold the old quarter. I know these streets; my family owns half of them. For once that is useful to someone." |
| breather | "Please. Take it. It is only a handkerchief. I have been carrying it for an occasion, and I think this is one." |
| apex | "My family has funded things without asking what they were for. I am looking at what that means." |
| shadow | "It has been made to serve. I know something of being raised for a purpose." *(if Stabilized:)* "You have not freed it and you have not used it. You have simply kept it company. I did not know that was permitted." |
| about-beat | "{rival} is in danger and too proud to have asked. I recognise the fault. It is mine also. Let us go." |
| about-side | "{rival} has taken their colours. I shall speak to them. I shall be very polite, and I shall not leave." |
| react-rise | "You have accepted a title from them. I was born with several. I can tell you that they weigh more each year." |
| react-throne | "You lead them. Then lead them somewhere better. That is the only use a name has ever had." |
| react-turn | "You refused it. At the last, with everything offered. I have never seen anyone do that. I shall try to deserve having seen it." |
| postcard | "I pitched the tent correctly. Alone. In rain. I enclose a photograph. Please admire the guy lines." |
| dock | "Go well. I have no gift worth giving, so I shall simply stand here until you are out of sight." |

### X10.7 Lone Wolf

| Kind | Line |
| --- | --- |
| eve | "…Going in tomorrow. North side." |
| spar | "…Again sometime." |
| district | "…Mine." |
| breather | *(They sit down next to the player. That is the line.)* |
| apex | "…That's wrong." |
| shadow | "…It's hurting." *(if Stabilized:)* "…Better." |
| about-beat | "…{rival}'s in trouble. Come on." |
| about-side | "…{rival}. …I'll talk." *(They have never offered to talk before.)* |
| react-rise | "…Hm." |
| react-throne | "…Careful." |
| react-turn | "…Good." |
| postcard | *(A postcard with a picture of a mountain. Nothing written. It is the right mountain: the one the player mentioned once.)* |
| dock | "…Come back." |

### X10.8 Mirror

| Kind | Line |
| --- | --- |
| eve | "Tomorrow I'll go in the way you'd go in if you were going in alone. Which you're not. Which is the difference between us." |
| spar | "You did what I'd do. Then you did something I wouldn't. I'm keeping that one." |
| district | "I'll take the one you'd have taken if you could be in two places. Turns out you can." |
| breather | "You were about to wish you had one of these. Here. Don't ask how I knew. I just sat where you'd sit." |
| apex | "It doesn't know what it wants any more. Somebody put a want in it. …I'd like to leave now. I'm not going to." |
| shadow | "It looks at you to find out what it's feeling. I used to do that." *(if Stabilized:)* "It's stopped looking. It knows by itself now. …How long did that take?" |
| about-beat | "{rival} went first. That's what I'd have done. That's why I know how scared they are." |
| about-side | "{rival} picked them. I know why. It's the reason I'd have had. Let me say it to them; they'll hear it from me." |
| react-rise | "You said yes. I watched you say it. I'd have said it the same way. I wish I hadn't seen that." |
| react-throne | "You're them, now. And I'm still me. That's the first time that's been true." |
| react-turn | "You stopped. Right at the edge. I didn't know either of us could do that." |
| postcard | "I went left at the fork. You'd have gone right. It was nice. I'll tell you about it." |
| dock | "I'm not coming. You'd tell me not to. See? I'm learning which thoughts are yours." |

*(13 × 8 = **104 lines**, in addition to the base bank's 88 and the 28 in X4 and X6.)*

---

## X11. Memory, endings, flags and tests

### X11.1 Memory kinds (+5, added to the base four)

| Kind | Trigger | Callout (neutral) |
| --- | --- | --- |
| `friend-errand` | The Errand was done | "I did {friend} a small favor. They made too much of it." |
| `friend-spar` | A friendly spar was fought | "{friend} and I had a match. Nobody kept score. We both kept score." |
| `friend-held-district` | Their district stood | "{friend} held a whole district. They mention it weekly." |
| `friend-spoke-to-rival` | The Friend's line was said in a Side-with Reveal Scene | "{friend} said the thing I couldn't." |
| `friend-freed-margin` | A hostage Friend was freed in the Region of Doom | "I went back for {friend}. It took longer than it should have." |

### X11.2 Ending weights (added to base §7)

| Trigger | Bias |
| --- | --- |
| Errand done | Friends +3 |
| Friendly spar | Respect +3 |
| District held | Friends +5 |
| The Friend spoke to the rival and the rival turned | Redemption +5 (for the primary rival's ending) |
| A hostage freed in the Margin | Friends +15 |

### X11.3 Flags

| Flag | Meaning |
| --- | --- |
| `friend.present`, `friend.archetype`, `friend.role` | Base rolls |
| `friend.x.errand` | `done`, `refused`, or unset |
| `friend.x.spar` | Set if fought |
| `friend.x.eve` | `careful`, `luck`, `home` |
| `friend.x.district` | The district held, and whether it stood |
| `friend.x.annex` | `rescued`, `rival-went`, `taken` |
| `friend.x.postcard` | Set when delivered |
| `friend.x.met` | Count of Friends met this run |

### X11.4 Tests (in addition to base §9)

- The three base rules hold in every cut: the Friend never replaces the primary rival, never opposes the player (a friendly spar has no stakes and cannot be lost as a wipe), and never supplies more Assists than the table in X5.2.
- Total Assist across both rivals: at most 4 in the Standard Cut, at most 6 in the Extended Cut.
- The Errand and the Eve obey `rival.second.encounters`.
- A friendly spar ends at two knockouts on one side and heals both parties.
- In Support, the Friend holds exactly one Siege Map district and can be moved once.
- In Caught, the Annex appears on the Siege Map, costs one optional battle, and can be handled by the primary rival in a Help climax at the cost of one of their Assists.
- A Caught Friend's Pokémon are never Shadow.
- The Friend's `shadow` line is said once per region and its second half only when the Pokémon is Stabilized.
- On the Stand-with route the Friend is visible in Phases 1 and 5 and never battles.
- Postcards arrive exactly one region later, with the enclosure for that Friend's outcome.
- From the third Friend met, the Meet scene has its extra line.
- At the finale, only Friends at attitude +1 or better are on the dock.
- A `hostage:friend` entry produces a held Friend in the matching district of the Region of Doom, and taking the district frees them.
- All 104 new lines and the 28 in X4 and X6 resolve with no empty slots; `{friend}` is used only for the second rival's name.
