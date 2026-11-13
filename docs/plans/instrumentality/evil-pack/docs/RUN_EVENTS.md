# Run events: encounters and forced events

102 events beyond raids and the climax: **43 forced events** (always have a way out) and **59 encounters** (optional, with choices). Source: `tools/events_source.js`; data: `data/run_events.json`; built by `tools/build_events.js`.

**Forced** events happen to the player: a fight or a story beat they cannot simply decline, but every one has at least one listed way out (a Decoy Tag, a cost, an ally, a flag). **Encounters** are optional scenes at a node: the player picks a choice or walks on.

## 1. The event director

Runs after every eligible node. At most one event per node.

**Order of resolution**

1. Scripted beats (Ignition, Rival Rescue Plan, climax scheduling)
2. Forced event roll
3. Ambush roll (unchanged: clamp(0.10 + 0.002·Heat, 0.10, 0.30))
4. Encounter roll

| Rule | Value |
|---|---|
| Forced event chance | clamp(0.06 + 0.0015·Heat, 0.06, 0.20), ×0.5 once the climax is scheduled except for phase "pre-climax" events |
| Encounter chance | 0.22 (0.30 before the team awakens), only if no forced event or ambush fired |
| Forced events per region | 5 |
| Forced battles per region (ambushes included) | 10 |
| Gap after a forced event | 2 nodes |
| Gap after an encounter | 1 node |
| Pity | An encounter after 5 quiet nodes (never a forced one) |
| Weighting | weight × 2 if the event's required flags are all set; × 0.5 if used in the previous region; × 0 if its team is not present |
| Cooldowns | Each event has its own cooldown in nodes, and a category cannot repeat within 2 nodes |
| Node eligibility | Rest-stop and shop events (FE-04, FE-05) attach to rest and shop nodes; every other event follows the ambush eligibility rules (not Gym, boss, rival, legendary, raid, shop, rest, or the node after another forced event) |

**Guarantees**

- Forced events always have at least one way out
- No event ends the run (only the climax can)
- Difficulty never exceeds the named tier; Leader's Test and The Second's Warning are once-per-region exceptions
- A Decoy Tag cancels one forced battle (not story beats)

**Fields.** *Phase*: `pre-ignition` (before the team awakens), `pursuit` (awake, before the climax is scheduled), `post-raid`, `pre-climax`, `aftermath`, or `any`. *Heat* is the range in which the event can fire. *Teams*: `any` (primary or second team of the region), `primary`, or a list. *Requires* are run flags (e.g. `insideMan`, `impounded`, `raidFailed`). *Battle* names the trainer pool tier from `docs/TRAINER_POOLS_AND_BOSSES.md`; `chain` means back-to-back fights with no healing, `duel` a small party of the named tier. The effect numbers are on the same scale as the Heat, Intel and Operational Strength rules in the design document.

## 2. Ambush variants

| ID | Event | Kind | Phase / Heat | Teams | Battle | Requires |
|---|---|---|---|---|---|---|
| FE-01 | Cornered at the Dead End | forced | pursuit, 25–100 | any | single: grunt | – |
| FE-02 | Two-Pronged Ambush | forced | pursuit, 30–100 | any | double: grunt + grunt | – |
| FE-03 | Roadblock Toll | forced | pursuit, 30–100 | any | single: specialist | – |
| FE-04 | Raid on the Rest Stop | forced | pursuit, 40–100 | any | single: lieutenant | – |
| FE-05 | Shop Shakedown | forced | pursuit, 35–100 | any | single: specialist | – |
| FE-06 | Bait and Switch | forced | pursuit, 25–100 | any | single: specialist | – |
| FE-07 | Courier Intercept | forced | pursuit, 35–100 | any | single: lieutenant | – |
| FE-08 | Night Watch | forced | pursuit, 30–100 | any | chain: grunt + grunt | – |
| FE-09 | Gauntlet Corridor | forced | pursuit, 55–100 | any | chain: grunt + specialist + lieutenant | – |
| FE-10 | Pincer | forced | pursuit, 45–100 | any | chain: specialist + grunt | – |
| FE-11 | Debt Collector | forced | pursuit, 20–100 | any | single: specialist | fined |
| FE-12 | Impound Chaser | forced | pursuit, 20–100 | any | single: lieutenant | impounded |
| FE-13 | Bounty Hunter | forced | pursuit, 30–100 | any | single: commander | blacklisted |
| FE-14 | Shadow Squad | forced | pursuit, 60–100 | any | single: lieutenant | – |
| FE-15 | They Studied You | forced | pursuit, 50–100 | any | single: lieutenant | – |

**FE-01 Cornered at the Dead End.** The path ends in a fence and two exits are watched. One grunt steps out, and you cannot flee this fight.

- Ways out: Decoy Tag cancels it; A party member with an escape ability can slip you out (once per region); Bribe item from the Notebook.
- Win: Intel +4, the usual ambush drop.
- Lose: Standard defeat rules; ambush difficulty never exceeds the previous node.
- Effects: Heat +2, Intel +4, OS -1, Rep -1. Weight 4, cooldown 3.

**FE-02 Two-Pronged Ambush.** Two grunts close from opposite sides. Treat it as a double battle with two small parties.

- Ways out: Decoy Tag cancels one of the two; Rival help (if the rival is allied) takes one side.
- Win: Intel +5, double drop.
- Lose: Standard defeat rules.
- Effects: Heat +3, Intel +5, OS -1, Rep -2. Weight 3, cooldown 4.

**FE-03 Roadblock Toll.** A "toll booth" appears on the road. Pay or fight a Specialist.

- Ways out: Pay the toll (about a fifth of your money); Decoy Tag; Show a team item to be waved through (if reputation is Recognized or better).
- Win: Toll refunded plus a drop.
- Lose: Standard defeat rules plus the toll.
- Effects: Heat +3, Intel +3, OS -1, Rep -2. Weight 3, cooldown 4.

**FE-04 Raid on the Rest Stop.** Your rest node is attacked mid-heal. Resting heals only half this time unless you win.

- Ways out: Decoy Tag cancels it; Leave the rest node unused and take a free node of travel instead.
- Win: The rest node is restored to full healing.
- Lose: Half heal only; Heat +2.
- Effects: Heat +2, Intel +4, OS -1, Rep -2. Weight 3, cooldown 5.

**FE-05 Shop Shakedown.** A shop node is occupied and shuttered. Beat the Specialist inside to reopen it.

- Ways out: Skip the shop (the node is wasted); Decoy Tag; Pay the "protection fee" for one purchase at +30% prices.
- Win: The shop reopens with a discount on one item.
- Lose: Shop closed for the region; C5 style price rise for three nodes.
- Effects: Heat +2, Intel +3, OS -1, Rep -2. Weight 2, cooldown 6.

**FE-06 Bait and Switch.** Someone asks for help, and the "help" is an ambush. With enough Intel you see through it.

- Ways out: Intel 20 or more spots the trap and you strike first; Decline politely and walk on (Heat +1); Decoy Tag.
- Win: Intel +6.
- Lose: Standard defeat rules.
- Effects: Heat +2, Intel +6, OS -1, Rep -2. Weight 3, cooldown 6.

**FE-07 Courier Intercept.** You carry a package for an NPC. A team squad wants it.

- Ways out: Hand over a decoy parcel (Intel 15); Decoy Tag; Ask the courier NPC to run it ahead (delivery fails, no reward).
- Win: The delivery succeeds with a bonus.
- Lose: The package is lost; the NPC loses faith (small reputation drop).
- Effects: Heat +3, Intel +4, OS -1, Rep -2. Weight 2, cooldown 6.

**FE-08 Night Watch.** Two waves hit during a night rest. You get a short heal between waves.

- Ways out: Decoy Tag; Stay awake: take the first wave at a Speed edge.
- Win: Intel +5.
- Lose: Standard defeat rules.
- Effects: Heat +3, Intel +5, OS -1, Rep -2. Weight 2, cooldown 6.

**FE-09 Gauntlet Corridor.** A corridor, three watchers, no healing between fights. The hardest ambush shape.

- Ways out: Pay a fifth of your money to skip the last fight; Decoy Tag (skips the whole corridor); Rival help.
- Win: Intel +8, a team-themed drop and a Heat drop of 5.
- Lose: Standard defeat rules; no extra penalty.
- Effects: Heat +5, Intel +8, OS -2, Rep -3. Weight 2, cooldown 8.

**FE-10 Pincer.** A Specialist stops you from the front and a grunt arrives behind. You fight one, then the other.

- Ways out: Decoy Tag; Step aside: only the grunt fight happens, but Heat +3.
- Win: Intel +6.
- Lose: Standard defeat rules.
- Effects: Heat +4, Intel +6, OS -1, Rep -2. Weight 2, cooldown 6.

**FE-11 Debt Collector.** After a Fine, a collector comes for the rest.

- Ways out: Pay half the Fine again to settle; Decoy Tag.
- Win: The Fine debt is cleared.
- Lose: Standard defeat rules; the debt stays.
- Effects: Heat +2, Intel +3, OS 0, Rep -1. Weight 4, cooldown 8, once per region.

**FE-12 Impound Chaser.** The team uses your seized Pokémon's type against you. Beat the Lieutenant to get one back.

- Ways out: Decoy Tag; Wait for the Rival Rescue Plan (the encounter delays by one node).
- Win: One impounded Pokémon is returned.
- Lose: Standard defeat rules; the others stay impounded.
- Effects: Heat +3, Intel +5, OS -1, Rep -3. Weight 5, cooldown 6, once per region.

**FE-13 Bounty Hunter.** A blacklisted trainer attracts a hunter, who may belong to the team or hire out from outside.

- Ways out: Decoy Tag; Clear your name with a Reputation fund (costs money).
- Win: The blacklist ends early.
- Lose: Standard defeat rules; Heat +4.
- Effects: Heat +4, Intel +6, OS -1, Rep -2. Weight 4, cooldown 8, once per region.

**FE-14 Shadow Squad.** A squad that fights with Shadow Pokémon. They are not meant to be beaten fast; they are meant to be survived.

- Ways out: Decoy Tag; Purification token in the Notebook weakens the squad's lead.
- Win: Intel +8 and a Shadow clue.
- Lose: C10 Shadowed (one party Pokémon, low taint).
- Effects: Heat +4, Intel +8, OS -1, Rep -3. Weight 2, cooldown 10, from Set-2.

**FE-15 They Studied You.** The ambusher built a party to counter your lead Pokémon's types. They chose it from your last two battles.

- Ways out: Decoy Tag; Switch your lead before the fight (the counter-types shift).
- Win: Intel +8 (their notes).
- Lose: Standard defeat rules.
- Effects: Heat +3, Intel +8, OS -1, Rep -2. Weight 2, cooldown 8, from Set-2.

## 3. Pursuit pressure

| ID | Event | Kind | Phase / Heat | Teams | Battle | Requires |
|---|---|---|---|---|---|---|
| FE-16 | Manhunt | forced | pursuit, 90–100 | any | chain: grunt + specialist + commander | – |
| FE-17 | Checkpoint Sweep | forced | pursuit, 40–100 | any | single: specialist | – |
| FE-18 | Curfew Patrol | forced | pursuit, 50–100 | any | single: grunt | – |
| FE-19 | Press-Gang | forced | pursuit, 45–100 | any | single: specialist | – |
| FE-20 | Gym Gate Blockade | forced | pursuit, 40–100 | any | single: specialist | – |

**FE-16 Manhunt.** At maximum Heat the team sweeps the region: three squads, three fights, no ambush rolls until it ends.

- Ways out: Hide in a Safehouse (needs the flag); Decoy Tag stops one squad; Surrender the highest-value held item to end the hunt.
- Win: Heat falls by 30.
- Lose: C11 Setback and Heat stays high; no other penalty.
- Effects: Heat -30, Intel +12, OS -2, Rep -4. Weight 5, cooldown 15, once per region.

**FE-17 Checkpoint Sweep.** Checkpoints on the main road search bags.

- Ways out: Reputation Recognized or better walks you through; Show a disguise item; Decoy Tag.
- Win: Intel +5.
- Lose: Standard defeat rules.
- Effects: Heat +3, Intel +5, OS -1, Rep -2. Weight 3, cooldown 8.

**FE-18 Curfew Patrol.** The team declares a curfew. Night nodes are patrolled.

- Ways out: Wait out the night (lose a node, Heat −3); Decoy Tag.
- Win: Intel +4.
- Lose: Standard defeat rules.
- Effects: Heat +2, Intel +4, OS -1, Rep -1. Weight 2, cooldown 8.

**FE-19 Press-Gang.** They try to "draft" a Pokémon from your bench. Fight to keep it.

- Ways out: Decoy Tag; Offer money instead (about a quarter).
- Win: Intel +6.
- Lose: C1 Impound (bench Pokémon, one only).
- Effects: Heat +3, Intel +6, OS -1, Rep -3. Weight 2, cooldown 10, once per region.

**FE-20 Gym Gate Blockade.** Grunts block the way to the next Gym. The Gym staff vouch for you if you clear them.

- Ways out: Take the long way (C9 Gym lockdown: one extra pre-battle trial); Decoy Tag.
- Win: The Gym offers a small reward for clearing its door.
- Lose: C9 Gym lockdown.
- Effects: Heat +3, Intel +4, OS -1, Rep -2. Weight 3, cooldown 10.

## 4. Admin duels and boss previews

| ID | Event | Kind | Phase / Heat | Teams | Battle | Requires |
|---|---|---|---|---|---|---|
| FE-21 | Admin's Challenge of Honor | forced | pursuit, 60–100 | any | duel: executive | – |
| FE-22 | Leader's Test | forced | pre-climax, 70–100 | primary | boss preview | – |
| FE-23 | The Second's Warning | forced | pursuit, 70–100 | any | duel: second | – |

**FE-21 Admin's Challenge of Honor.** An Executive offers a formal duel with a small party. Dignity on both sides.

- Ways out: Decline: reputation −3, Heat +5; Decoy Tag does not apply; a Rival Rescue ally can take the duel.
- Win: Reputation +0, Intel +12, an Executive pool drop.
- Lose: C11 Setback only.
- Effects: Heat +4, Intel +12, OS -2, Rep -6. Weight 3, cooldown 12.

**FE-22 Leader's Test.** The Leader appears with a small slice of their real team (lead and ace, no legendary). It is a preview and a statement.

- Ways out: Retreat: the Leader lets you go (Heat +10).
- Win: Intel +15 and the boss's tactic is revealed in the Notebook.
- Lose: C11 Setback only; no other penalty.
- Effects: Heat +5, Intel +15, OS -2, Rep -8. Weight 3, cooldown 99, once per region.

**FE-23 The Second's Warning.** The Second (right hand) tests whether you are worth the Leader's time.

- Ways out: Decline: reputation −4, Heat +6; Rival help (allied).
- Win: Intel +12, one Second-pool drop.
- Lose: C11 Setback only.
- Effects: Heat +5, Intel +12, OS -2, Rep -7. Weight 2, cooldown 15, once per region, from Set-2.

## 5. Fallout

| ID | Event | Kind | Phase / Heat | Teams | Battle | Requires |
|---|---|---|---|---|---|---|
| FE-24 | Raid Fallout Strike | forced | post-raid, 30–100 | any | chain: specialist + commander | raidFailed |
| FE-25 | Raid Backlash | forced | post-raid, 30–100 | any | single: lieutenant | raidTriumph |

**FE-24 Raid Fallout Strike.** After a failed raid, a retaliation squad arrives.

- Ways out: Hide in a Safehouse; Decoy Tag stops one fight.
- Win: Raid fallout is cancelled.
- Lose: C11 Setback (always on Failure).
- Effects: Heat +4, Intel +6, OS -1, Rep -3. Weight 5, cooldown 10, once per region.

**FE-25 Raid Backlash.** The team answers a triumphant raid with a revenge Lieutenant. The reward was bigger; so is the answer.

- Ways out: Decoy Tag; Safehouse.
- Win: Intel +10.
- Lose: Standard defeat rules.
- Effects: Heat +4, Intel +10, OS -1, Rep -3. Weight 4, cooldown 10, once per region.

## 6. Regional

| ID | Event | Kind | Phase / Heat | Teams | Battle | Requires |
|---|---|---|---|---|---|---|
| FE-26 | Crossfire | forced | pursuit, 40–100 | aqua, magma, skull, aether, macro-cosmos, yell | double: grunt + grunt | secondTeam |
| FE-36 | Skyscraper Lockdown | forced | pursuit, 40–100 | rocket | chain: grunt + specialist | – |
| FE-37 | Signal Jam | forced | pursuit, 40–100 | rocket-return | single: specialist | – |
| FE-38 | Energy Siphon | forced | pursuit, 40–100 | galactic | single: lieutenant | – |
| FE-39 | Rally Riot | forced | pursuit, 40–100 | plasma | double: grunt + specialist | – |
| FE-40 | Boutique Front | forced | pursuit, 40–100 | flare | single: specialist | – |
| FE-41 | Pit Crew | forced | pursuit, 35–100 | skull, aether | double: grunt + grunt | – |
| FE-42 | Cheer Squad Blockade | forced | pursuit, 30–100 | yell, macro-cosmos | chain: grunt + grunt | – |
| FE-43 | Study Hall Duel | forced | pursuit, 30–100 | star | single: specialist | – |
| EN-47 | Back-Room Casino | encounter | pursuit, 20–100 | rocket | no battle | – |
| EN-48 | Broadcast Hijack | encounter | pursuit, 20–100 | rocket-return | no battle | – |
| EN-49 | Sea and Land Skirmish | encounter | pursuit, 20–100 | aqua, magma | no battle | – |
| EN-50 | Lake Vigil | encounter | pursuit, 20–100 | galactic | no battle | – |
| EN-51 | Liberation Rally | encounter | pursuit, 20–100 | plasma | no battle | – |
| EN-52 | Front Business | encounter | pursuit, 20–100 | flare | no battle | – |
| EN-53 | Skull Hangout | encounter | pursuit, 20–100 | skull, aether | no battle | – |
| EN-54 | Stadium Sponsor | encounter | pursuit, 20–100 | macro-cosmos, yell | no battle | – |
| EN-55 | Star Base Dare | encounter | pursuit, 20–100 | star | optional: specialist | – |

**FE-26 Crossfire.** The primary and second teams both reach you at once and fight each other as much as you. Treat it as a double battle with one grunt from each.

- Ways out: Decoy Tag; Reputation with either team Recognized or better: that team stands down.
- Win: Intel +8 and a relation shift between the two teams.
- Lose: Standard defeat rules.
- Effects: Heat +3, Intel +8, OS -1, Rep -2. Weight 3, cooldown 10, once per region.

**FE-36 Skyscraper Lockdown.** A city tower is sealed. You fight your way to the lobby to leave.

- Ways out: Decoy Tag; Ask the staff for a back stair.
- Win: Intel +8.
- Lose: Standard defeat rules.
- Effects: Heat +3, Intel +8, OS -1, Rep -3. Weight 2, cooldown 20, once per region.

**FE-37 Signal Jam.** The team jams your map and radio. You fight near a transmitter.

- Ways out: Decoy Tag; Carry a signal booster.
- Win: Signals return; Intel +6.
- Lose: Map hidden for two nodes.
- Effects: Heat +3, Intel +6, OS -1, Rep -2. Weight 2, cooldown 20, once per region.

**FE-38 Energy Siphon.** A power plant node is being siphoned. A Lieutenant guards the line.

- Ways out: Decoy Tag; Report it and let the police handle it (a node passes).
- Win: The siphon is cut; OS −1.
- Lose: OS +1.
- Effects: Heat +3, Intel +6, OS -2, Rep -3. Weight 2, cooldown 20, once per region.

**FE-39 Rally Riot.** A Liberation Rally turns into a riot. Double battle in the crowd.

- Ways out: Decoy Tag; Reputation Recognized or better: leaders call it off.
- Win: Region reputation +2.
- Lose: Standard defeat rules.
- Effects: Heat +3, Intel +6, OS -1, Rep -3. Weight 2, cooldown 20, once per region.

**FE-40 Boutique Front.** A "boutique" counts as a front. Beat its staff to leave with your shopping.

- Ways out: Decoy Tag; Pay for a gown and walk out.
- Win: A cosmetic reward and Intel +6.
- Lose: Standard defeat rules.
- Effects: Heat +3, Intel +6, OS -1, Rep -2. Weight 2, cooldown 20, once per region.

**FE-41 Pit Crew.** Skull grunts block a street with loud music, while Aether staff offer to "escort" you. Either way it is a double battle.

- Ways out: Decoy Tag; Accept the Aether escort (Heat −5, Aether reputation +2, Skull reputation −3).
- Win: Intel +6.
- Lose: Standard defeat rules.
- Effects: Heat +3, Intel +6, OS -1, Rep -2. Weight 2, cooldown 20, once per region.

**FE-42 Cheer Squad Blockade.** A cheer squad chants at you, and a chanting wall will not move. Two quick, loud fights.

- Ways out: Decoy Tag; Cheer back: a node passes, Heat −3.
- Win: Intel +4, a laugh.
- Lose: Standard defeat rules.
- Effects: Heat +1, Intel +4, OS -1, Rep -1. Weight 3, cooldown 20, once per region.

**FE-43 Study Hall Duel.** A Team Star member challenges you in a school yard dare.

- Ways out: Decline politely (reputation +1); Decoy Tag.
- Win: A respect gain. Reputation +3 with the team.
- Lose: No penalty beyond Heat +1.
- Effects: Heat +1, Intel +4, OS -1, Rep +3. Weight 2, cooldown 20, once per region.

**EN-47 Back-Room Casino.** A game hall has a back room that does not appear on the map.

- Play: win or lose money, Intel +4
- Slip into the back: a Specialist fight, Intel +10
- Leave
- Effects: Heat +2, Intel +4, OS 0, Rep -1. Weight 2, cooldown 20, once per region.

**EN-48 Broadcast Hijack.** A radio station plays only the team's anthem.

- Cut the feed: a Lieutenant fight
- Tune in: Intel +6
- Ignore
- Effects: Heat +2, Intel +6, OS -1, Rep -1. Weight 2, cooldown 20, once per region.

**EN-49 Sea and Land Skirmish.** The two teams fight each other at a pier.

- Watch: Intel +8, a relation shift
- Side with one: reputation shift
- Intervene on both: Heat +6
- Effects: Heat +2, Intel +8, OS 0, Rep 0. Weight 2, cooldown 20, once per region.

**EN-50 Lake Vigil.** Locals keep a vigil at a lake as strange machines dig nearby.

- Join: region reputation +3
- Scout the digging: Intel +8
- Pass
- Effects: Heat +1, Intel +8, OS 0, Rep -1. Weight 2, cooldown 20, once per region.

**EN-51 Liberation Rally.** A calm speaker calls for freeing Pokémon. Some of the crowd are team members.

- Listen: Intel +5 and a moral choice flag
- Question the speaker
- Leave
- Effects: Heat +1, Intel +5, OS 0, Rep 0. Weight 2, cooldown 20, once per region.

**EN-52 Front Business.** A tasteful shop is a front.

- Shop: a cosmetic and Intel +3
- Look in the back: Specialist fight
- Leave
- Effects: Heat +2, Intel +3, OS 0, Rep -1. Weight 2, cooldown 20, once per region.

**EN-53 Skull Hangout.** A run-down hangout where Skull grunts argue about their boss, while a pristine Aether van idles outside.

- Join the loud grunts: Intel +6
- Check the van: Intel +8, an Aether Specialist fight
- Leave
- Effects: Heat +2, Intel +6, OS 0, Rep -1. Weight 2, cooldown 20, once per region.

**EN-54 Stadium Sponsor.** A stadium sponsor has too much money and too many guards.

- Take a tour: Intel +6
- Call out the sponsor: Heat +4
- Cheer with the fans: Yell reputation +2
- Effects: Heat +2, Intel +6, OS 0, Rep -1. Weight 2, cooldown 20, once per region.

**EN-55 Star Base Dare.** Students dare you to take a lap of a base with a backpack of rules.

- Accept the dare: Specialist fight, reputation +3
- Ask what they are protecting: Intel +6
- Decline
- Effects: Heat 0, Intel +6, OS 0, Rep +3. Weight 2, cooldown 20, once per region.

## 7. Rival and allies

| ID | Event | Kind | Phase / Heat | Teams | Battle | Requires |
|---|---|---|---|---|---|---|
| FE-27 | Rival Collision | forced | pursuit, 30–100 | any | double: grunt + specialist | – |
| EN-21 | Rival Rally | encounter | pursuit, 0–100 | any | optional: specialist | – |
| EN-22 | The Gym Leader Calls | encounter | pursuit, 20–100 | any | no battle | – |
| EN-23 | Police Briefing | encounter | pursuit, 20–100 | any | no battle | – |
| EN-24 | The Second Rival Checks In | encounter | pursuit, 0–100 | any | no battle | – |
| EN-25 | A Veteran Who Knew the Leader | encounter | pursuit, 20–100 | primary | no battle | – |

**FE-27 Rival Collision.** Your rival crashes into the ambush. You fight side by side against two team members.

- Ways out: Let the rival take it (small reputation loss with them); Decoy Tag.
- Win: Rival bond +1; Intel +5.
- Lose: Standard defeat rules.
- Effects: Heat +2, Intel +5, OS -1, Rep -2. Weight 2, cooldown 10, once per region.

**EN-21 Rival Rally.** Your rival shares what they know and offers a friendly spar.

- Spar: small stat reward
- Trade notes: Intel +6
- Skip
- Effects: Heat 0, Intel +6, OS 0, Rep 0. Weight 3, cooldown 10.

**EN-22 The Gym Leader Calls.** A Gym Leader asks you to check on a site the Gym is too busy to cover.

- Accept: a short run of two nodes, Gym reward
- Decline
- Pass it to the rival
- Effects: Heat +2, Intel +4, OS 0, Rep -1. Weight 3, cooldown 10.

**EN-23 Police Briefing.** An officer shares a briefing and a gift.

- Take the briefing: Intel +6 and a Decoy Tag
- Ask for an escort: Heat −4, a node of travel is safe
- Decline
- Effects: Heat 0, Intel +6, OS 0, Rep 0. Weight 3, cooldown 10.

**EN-24 The Second Rival Checks In.** The friend with the other personality passes by and shares something.

- Ask for a favor: a held item or a map
- Ask for advice: Intel +4
- Wave
- Effects: Heat 0, Intel +4, OS 0, Rep 0. Weight 2, cooldown 15.

**EN-25 A Veteran Who Knew the Leader.** An old trainer tells you how the Leader fights.

- Listen: the boss's type theme is revealed in the Notebook
- Ask for the secret: the boss's tactic is revealed (costs Intel 10)
- Skip
- Effects: Heat 0, Intel 0, OS 0, Rep 0. Weight 3, cooldown 99, once per region.

## 8. Inside Man

| ID | Event | Kind | Phase / Heat | Teams | Battle | Requires |
|---|---|---|---|---|---|---|
| FE-28 | Loyalty Test | forced | pursuit, 0–100 | primary | single: specialist | insideMan |
| FE-29 | Mole Hunt | forced | pursuit, 0–100 | primary | single: commander | insideMan |
| FE-30 | Initiation Brawl | forced | pursuit, 0–100 | primary | single: specialist | insideMan |
| FE-31 | Orders From Above | forced | pursuit, 0–100 | primary | no battle | insideMan |

**FE-28 Loyalty Test.** The team tests its new member: a captured trainer's Pokémon must be taken. You decide how hard you try.

- Ways out: Throw the fight (reputation with the team −5, Heat −10); Refuse (cover risk: Intel check).
- Win: Reputation +6, Intel +6.
- Lose: Reputation −3 only.
- Effects: Heat -5, Intel +6, OS 0, Rep +6. Weight 4, cooldown 15, once per region.

**FE-29 Mole Hunt.** The team suspects a mole. A Commander questions you; a wrong answer ends in a fight.

- Ways out: Burn Intel (−15) to keep your cover; Confess and leave the team (Inside Man ends).
- Win: Cover holds, reputation +4.
- Lose: Cover blown; Heat +20; Inside Man flag ends.
- Effects: Heat +5, Intel -5, OS 0, Rep +4. Weight 3, cooldown 20, once per region.

**FE-30 Initiation Brawl.** A recruit-to-rank trial against a Specialist. It is the Inside Man's only way up before the climax.

- Ways out: Skip the trial (stay at your rank).
- Win: Rank step up; reputation +8.
- Lose: No penalty; try again after three nodes.
- Effects: Heat +2, Intel +4, OS 0, Rep +8. Weight 3, cooldown 10.

**FE-31 Orders From Above.** Three assignments are offered; you must take one. Refusing costs reputation.

- Ways out: Take the mild assignment (low reward); Take the harsh assignment (high reward, Heat); Refuse (reputation −8).
- Win: Per assignment.
- Lose: Per assignment.
- Effects: Heat +4, Intel +8, OS +1, Rep +4. Weight 3, cooldown 12.

## 9. Roaming cast

| ID | Event | Kind | Phase / Heat | Teams | Battle | Requires |
|---|---|---|---|---|---|---|
| FE-32 | Motto Battle | forced | any, 0–100 | any | single: specialist | – |
| FE-33 | Butch and Cassidy Pincer | forced | pursuit, 45–100 | rocket-remnants | double: commander + commander | roamingPlaced |
| FE-34 | Snag Sweep | forced | pursuit, 40–100 | snagem | single: lieutenant | roamingPlaced |
| FE-35 | Gonzap's Warning Shot | forced | pre-climax, 60–100 | snagem | duel: executive | roamingPlaced |
| EN-41 | The Trio in Disguise | encounter | any, 0–100 | any | no battle | – |
| EN-42 | The Trio's Balloon Trouble | encounter | any, 0–100 | any | no battle | – |
| EN-43 | Meowth's Deal | encounter | any, 0–100 | any | no battle | – |
| EN-44 | Butch and Cassidy's Stakeout | encounter | pursuit, 30–100 | rocket-remnants | no battle | roamingPlaced |
| EN-45 | Snag Machine Demonstration | encounter | pursuit, 30–100 | snagem | no battle | roamingPlaced |
| EN-46 | A Letter From Domino | encounter | pursuit, 30–100 | rocket-remnants | no battle | roamingPlaced |

**FE-32 Motto Battle.** Jessie, James and Meowth interrupt with a rehearsed speech. One fight, three voices, and the loudest is the Pokémon.

- Ways out: Ignore them (they follow for two nodes); Decoy Tag; Hand over a snack: Meowth waves you through.
- Win: They blast off. Intel +3, no Heat change. A Stand-with wildcard flag may be set.
- Lose: Standard defeat rules; they make you listen to the speech again.
- Effects: Heat 0, Intel +3, OS 0, Rep 0. Weight 3, cooldown 8.

**FE-33 Butch and Cassidy Pincer.** The Rocket Remnants send their rival pair for a clean double battle.

- Ways out: Decoy Tag; Jessie and James are on the field: pay them to look away (comedy, Heat +2).
- Win: Intel +12.
- Lose: Standard defeat rules.
- Effects: Heat +4, Intel +12, OS -1, Rep -3. Weight 3, cooldown 12.

**FE-34 Snag Sweep.** Wakin, Biden or Agrev try to snag a Pokémon in your party.

- Ways out: Decoy Tag; Purification token drops the Shadow ability of their lead.
- Win: Intel +8, a Snag Machine part.
- Lose: C10 Shadowed.
- Effects: Heat +4, Intel +8, OS -1, Rep -3. Weight 4, cooldown 10.

**FE-35 Gonzap's Warning Shot.** Gonzap's lieutenant fights you to take the measure of your party before the climax.

- Ways out: Decline: Heat +8; Rival help.
- Win: Intel +12.
- Lose: C11 Setback only.
- Effects: Heat +5, Intel +12, OS -2, Rep -5. Weight 2, cooldown 99, once per region.

**EN-41 The Trio in Disguise.** Three "travelling musicians" are far too eager to be near you.

- Play along: they set a flag as Stand-with wildcards
- Unmask them: they flee, Intel +3
- Ignore them
- Effects: Heat 0, Intel +3, OS 0, Rep 0. Weight 3, cooldown 10.

**EN-42 The Trio's Balloon Trouble.** A balloon is caught in a tree with three people hanging from it.

- Help them down: a Cache or Cameo flag (they help later)
- Take a photograph: Intel +2
- Leave
- Effects: Heat 0, Intel +2, OS 0, Rep 0. Weight 2, cooldown 15, once per region.

**EN-43 Meowth's Deal.** A talking Pokémon in a coat offers a trade: information for a favor.

- Take the deal: Intel +8, you owe a favor later
- Haggle: Intel +4
- Decline
- Effects: Heat 0, Intel +8, OS 0, Rep 0. Weight 2, cooldown 12.

**EN-44 Butch and Cassidy's Stakeout.** The rival pair watch a site you also want. They have not seen you.

- Watch them watch: Intel +8
- Sneak past: Heat −2
- Make yourself known: a Commander fight starts
- Effects: Heat +2, Intel +8, OS 0, Rep -2. Weight 2, cooldown 15.

**EN-45 Snag Machine Demonstration.** A salesman shows off a snag device to a crowd.

- Steal a part: OS −1, Heat +3
- Heckle him: he flees
- Watch: Intel +6
- Effects: Heat +3, Intel +6, OS -1, Rep -2. Weight 2, cooldown 15.

**EN-46 A Letter From Domino.** A sealed note, no stamp. It warns you off, in a very polite voice.

- Read it: Intel +6 (a detail on her real team)
- Burn it
- Take it to the police
- Effects: Heat +1, Intel +6, OS 0, Rep 0. Weight 2, cooldown 20, once per region.

## 10. Rescue and mercy

| ID | Event | Kind | Phase / Heat | Teams | Battle | Requires |
|---|---|---|---|---|---|---|
| EN-01 | Pokémon in a Snare | encounter | pursuit, 10–100 | any | no battle | – |
| EN-02 | The Child Who Lost a Pokémon | encounter | pursuit, 10–100 | any | no battle | – |
| EN-03 | Convoy on the Road | encounter | pursuit, 30–100 | any | chain: grunt + specialist | – |
| EN-04 | The Cage Room | encounter | post-raid, 30–100 | any | optional: grunt | – |
| EN-05 | A Grunt Who Wants Out | encounter | pursuit, 30–100 | any | no battle | – |
| EN-06 | The Weeping Scientist | encounter | pursuit, 40–100 | any | no battle | – |
| EN-07 | The Purification Mentor | encounter | pursuit, 0–100 | any | no battle | shadowSeen |

**EN-01 Pokémon in a Snare.** A wild Pokémon is caught in a team snare. It is hurt but alert.

- Free it (costs a healing item): it may join your later fights as a one-off helper
- Call the Ranger: Heat 0, the Ranger gives you a small reward
- Walk on
- Effects: Heat +2, Intel 0, OS 0, Rep -1. Weight 3, cooldown 6.

**EN-02 The Child Who Lost a Pokémon.** A child says the team took their Pokémon. They know which way the truck went.

- Promise to help: a side-chain of two nodes ends with a small battle and a reward
- Give them a Decoy Tag and go on
- Ignore
- Effects: Heat +1, Intel +3, OS 0, Rep -2. Weight 3, cooldown 8.

**EN-03 Convoy on the Road.** A truck with caged Pokémon rolls past with two guards.

- Stop it: fight the guards, free the Pokémon (Heat +5, Intel +6)
- Follow it quietly: Intel +10 and the location of a site
- Let it pass
- Effects: Heat +5, Intel +6, OS -1, Rep -3. Weight 3, cooldown 10.

**EN-04 The Cage Room.** You find the empty cage room of a site you just left. One cage still has something in it.

- Open the cage: fight a guard who was hiding, free the Pokémon
- Photograph the room: Intel +5
- Leave it
- Effects: Heat +3, Intel +5, OS -1, Rep -2. Weight 2, cooldown 10.

**EN-05 A Grunt Who Wants Out.** A grunt in a stolen coat asks to be walked out of the region.

- Escort them: three nodes with a risk of an extra ambush, then Intel +12 and a lasting contact
- Turn them in to the police: Intel +4, Heat −3
- Send them away
- Effects: Heat +3, Intel +12, OS -2, Rep -3. Weight 3, cooldown 10, once per region.

**EN-06 The Weeping Scientist.** A former researcher begs you to stop an experiment. They know how to loosen Shadow taint.

- Take their research: purification lead, Intel +10
- Bring them to the police
- Tell them to go
- Effects: Heat +2, Intel +10, OS -1, Rep -3. Weight 2, cooldown 12, once per region.

**EN-07 The Purification Mentor.** A quiet hermit offers to guide you through a purification ritual.

- Spend two nodes: lower taint on one Shadow Pokémon
- Pay for a charm instead
- Decline
- Effects: Heat 0, Intel 0, OS 0, Rep 0. Weight 3, cooldown 12.

## 11. Black market and supply

| ID | Event | Kind | Phase / Heat | Teams | Battle | Requires |
|---|---|---|---|---|---|---|
| EN-08 | Black Market Vendor | encounter | pursuit, 20–100 | any | no battle | – |
| EN-09 | Supply Cache | encounter | pursuit, 20–100 | any | no battle | – |
| EN-10 | A Local's Safehouse | encounter | pursuit, 20–100 | any | no battle | – |
| EN-11 | The Fence | encounter | pursuit, 20–100 | any | no battle | fined |
| EN-12 | Counterfeit Uniforms | encounter | pursuit, 20–100 | any | no battle | – |
| EN-13 | Underground Auction | encounter | pursuit, 30–100 | any | no battle | – |

**EN-08 Black Market Vendor.** A van in a side lane sells things shops will not.

- Buy a Decoy Tag at a premium
- Sell Intel for money (Intel −5)
- Report the vendor (Heat −3, Intel +2)
- Effects: Heat +2, Intel 0, OS 0, Rep 0. Weight 3, cooldown 8.

**EN-09 Supply Cache.** A team crate sits behind a shed.

- Take the supplies: a team-themed item, Heat +3
- Sabotage it: OS −1, Intel +2
- Tell the police
- Effects: Heat +3, Intel +2, OS -1, Rep -2. Weight 3, cooldown 8.

**EN-10 A Local's Safehouse.** A shopkeeper offers a back room, no questions asked.

- Accept: the Safehouse flag is set for this region
- Pay them to keep quiet instead
- Refuse
- Effects: Heat 0, Intel 0, OS 0, Rep 0. Weight 3, cooldown 99, once per region.

**EN-11 The Fence.** A fence has your confiscated goods in a crate.

- Buy back one item at triple price
- Steal it back: Specialist fight
- Let it go
- Effects: Heat +3, Intel +2, OS 0, Rep -2. Weight 3, cooldown 10, once per region.

**EN-12 Counterfeit Uniforms.** A tailor sells fake team uniforms.

- Buy one: opens a restricted infiltration path or a shop, risky if the wrong rank
- Buy a cheap sample: flavor only
- Report the tailor
- Effects: Heat +2, Intel +2, OS 0, Rep 0. Weight 2, cooldown 12.

**EN-13 Underground Auction.** A hush-hush auction of seized goods.

- Bid for a rare item (money)
- Slip out with a catalog: Intel +8
- Alert the police: Heat −5
- Effects: Heat +2, Intel +4, OS 0, Rep -2. Weight 2, cooldown 15, once per region.

## 12. Intel and informants

| ID | Event | Kind | Phase / Heat | Teams | Battle | Requires |
|---|---|---|---|---|---|---|
| EN-14 | Overheard Radio | encounter | pursuit, 10–100 | any | no battle | – |
| EN-15 | The Informant | encounter | pursuit, 20–100 | any | no battle | – |
| EN-16 | The Journalist | encounter | pursuit, 20–100 | any | no battle | – |
| EN-17 | Dead Drop | encounter | pursuit, 20–100 | any | no battle | – |
| EN-18 | Cryptic Graffiti | encounter | pursuit, 10–100 | any | no battle | – |
| EN-19 | Surveillance Gap | encounter | pursuit, 30–100 | any | no battle | – |
| EN-20 | Tapped Terminal | encounter | pursuit, 20–100 | any | optional: specialist | – |

**EN-14 Overheard Radio.** A radio left on a bench plays team chatter.

- Listen: Intel +6
- Trace it: a small Specialist fight, Intel +10
- Switch it off
- Effects: Heat +1, Intel +6, OS 0, Rep 0. Weight 4, cooldown 6.

**EN-15 The Informant.** A nervous man sells information about the next site.

- Pay: Intel +12 (or half the chance it is a trap)
- Bargain: lower Intel, safe
- Walk away
- Effects: Heat +1, Intel +12, OS 0, Rep 0. Weight 3, cooldown 10.

**EN-16 The Journalist.** A reporter wants your account of the team.

- Speak: region reputation +3, Heat +4
- Say nothing
- Give a false lead: Heat −5, Intel −2
- Effects: Heat +4, Intel 0, OS 0, Rep -2. Weight 3, cooldown 12.

**EN-17 Dead Drop.** A hollow tree hides a sealed envelope.

- Open it: Intel +8, Heat +3
- Give it to the police: Heat −3
- Leave it
- Effects: Heat +3, Intel +8, OS 0, Rep 0. Weight 3, cooldown 8.

**EN-18 Cryptic Graffiti.** A mural hides the team's sign-off and a route.

- Decode it: the next raid site is revealed
- Paint over it: Heat −2
- Ignore it
- Effects: Heat +1, Intel +5, OS 0, Rep 0. Weight 3, cooldown 10, once per region.

**EN-19 Surveillance Gap.** You find a street where the watchers are off duty.

- Rest here: Heat −8
- Scout their routine: Intel +6
- Move on
- Effects: Heat -8, Intel +6, OS 0, Rep 0. Weight 2, cooldown 12.

**EN-20 Tapped Terminal.** A team terminal is unguarded for a minute.

- Hack it: Intel +10 (a guard shows up: Specialist)
- Photograph it: Intel +4
- Pull the plug
- Effects: Heat +3, Intel +10, OS 0, Rep -1. Weight 2, cooldown 12.

## 13. Shadow

| ID | Event | Kind | Phase / Heat | Teams | Battle | Requires |
|---|---|---|---|---|---|---|
| EN-26 | A Shadow Wild Pokémon | encounter | pursuit, 20–100 | any | optional: specialist | – |
| EN-27 | Abandoned Shadow Pokémon | encounter | pursuit, 20–100 | any | no battle | – |
| EN-28 | Machine Debris | encounter | pursuit, 20–100 | any | no battle | – |

**EN-26 A Shadow Wild Pokémon.** A wild Pokémon with a dark aura stays close to the path.

- Challenge it: a single battle against a Shadow Pokémon from the pool, catch or purify
- Leave it
- Warn the Ranger
- Effects: Heat +2, Intel +3, OS 0, Rep 0. Weight 3, cooldown 10, from Set-2.

**EN-27 Abandoned Shadow Pokémon.** A Shadow Pokémon sits in a ditch where it was left.

- Adopt it: taint rule applies
- Hand it to a Ranger
- Leave it
- Effects: Heat +2, Intel 0, OS 0, Rep 0. Weight 2, cooldown 15, once per region, from Set-2.

**EN-28 Machine Debris.** You find pieces of a snag device. A scrapper watches you.

- Scavenge: a Snag Machine part, OS −1
- Sell it to the scrapper
- Leave it
- Effects: Heat +2, Intel +2, OS -1, Rep -1. Weight 2, cooldown 12.

## 14. Wild disruption

| ID | Event | Kind | Phase / Heat | Teams | Battle | Requires |
|---|---|---|---|---|---|---|
| EN-29 | Weather Machine Malfunction | encounter | pursuit, 30–100 | any | optional: grunt | – |
| EN-30 | Power Outage | encounter | pursuit, 30–100 | any | no battle | – |
| EN-31 | Stampede | encounter | pursuit, 20–100 | any | no battle | – |
| EN-32 | Poachers' Camp | encounter | pursuit, 20–100 | any | chain: grunt + grunt | – |
| EN-33 | Toxic Spill | encounter | pursuit, 20–100 | any | no battle | – |
| EN-34 | Strange Tremor | encounter | pre-climax, 60–100 | any | no battle | – |

**EN-29 Weather Machine Malfunction.** A team device is bending the weather over a node.

- Disable it: fight the guard, weather resets
- Use the weather: the next fight here has a field effect
- Avoid
- Effects: Heat +2, Intel +3, OS -1, Rep -1. Weight 2, cooldown 12.

**EN-30 Power Outage.** A team stunt knocks out the lights in a town.

- Help restore power: region reputation +3
- Use the dark to scout: Intel +6
- Wait
- Effects: Heat +2, Intel +6, OS 0, Rep -1. Weight 2, cooldown 12.

**EN-31 Stampede.** A herd of wild Pokémon, driven by a lure tower, runs through the road.

- Calm them: a skill check and a reward
- Break the lure: a short fight at the tower
- Wait it out
- Effects: Heat +1, Intel 0, OS -1, Rep -1. Weight 2, cooldown 12.

**EN-32 Poachers' Camp.** A camp of hired hands holds trapped Pokémon.

- Raid it: two battles, free the Pokémon
- Report it to the Ranger
- Pass
- Effects: Heat +3, Intel +4, OS -1, Rep -2. Weight 2, cooldown 15.

**EN-33 Toxic Spill.** A spill ruins a stream and the wild Pokémon around it.

- Clean it: use items, region reputation +3
- Find the dumpers: Intel +5
- Avoid
- Effects: Heat +1, Intel +5, OS 0, Rep -1. Weight 2, cooldown 12.

**EN-34 Strange Tremor.** The ground hums and the wild Pokémon go quiet. Something is waking.

- Investigate: Intel +10, a hint of the climax stakes
- Ignore it
- Warn the Gym
- Effects: Heat +2, Intel +10, OS 0, Rep 0. Weight 4, cooldown 99, once per region.

## 15. Team operations

| ID | Event | Kind | Phase / Heat | Teams | Battle | Requires |
|---|---|---|---|---|---|---|
| EN-35 | Witnessing an Operation | encounter | pursuit, 30–100 | any | optional: specialist | – |
| EN-36 | Recruitment Booth | encounter | pre-ignition, 0–100 | primary | no battle | – |
| EN-37 | Charity Drive | encounter | pursuit, 10–100 | any | no battle | – |
| EN-38 | Merch Stand | encounter | pursuit, 10–100 | any | no battle | – |
| EN-39 | Rally or Protest | encounter | pursuit, 20–100 | any | optional: grunt | – |
| EN-40 | Hideout Door | encounter | pursuit, 30–100 | any | chain: grunt + specialist | – |

**EN-35 Witnessing an Operation.** You see one of the team's operations in progress (drawn from the operations catalog).

- Intervene: a Specialist fight, the operation fails
- Report it: Intel +4
- Let it run: OS +1
- Effects: Heat +3, Intel +4, OS -1, Rep -2. Weight 4, cooldown 6.

**EN-36 Recruitment Booth.** A cheerful booth offers a new life with the team.

- Sign up: opens the Inside Man route
- Ask questions: Intel +3
- Walk on
- Effects: Heat 0, Intel +3, OS 0, Rep 0. Weight 3, cooldown 99, once per region.

**EN-37 Charity Drive.** The team runs a charity, with a dark purpose.

- Donate: a small reputation gain with the team
- Expose it: Heat +4, region reputation +2
- Ignore it
- Effects: Heat +2, Intel +2, OS 0, Rep 0. Weight 2, cooldown 12.

**EN-38 Merch Stand.** A stand sells team merchandise as if it were a band.

- Buy a cap: a disguise item
- Buy nothing and listen: Intel +2
- Tell the stand to move
- Effects: Heat +1, Intel +2, OS 0, Rep 0. Weight 2, cooldown 12.

**EN-39 Rally or Protest.** The team stages a rally in a plaza, and a protest forms.

- Join the protest
- Join the rally (Inside Man only)
- Watch from the edge: Intel +4
- Effects: Heat +2, Intel +4, OS 0, Rep 0. Weight 2, cooldown 12.

**EN-40 Hideout Door.** A small hideout entrance appears. This is not a raid; it is two rooms.

- Go in: two fights, a chest, Intel +10
- Mark it for the police: Intel +4, Heat −2
- Leave
- Effects: Heat +4, Intel +10, OS -1, Rep -3. Weight 3, cooldown 10.

## 16. Wildcards

| ID | Event | Kind | Phase / Heat | Teams | Battle | Requires |
|---|---|---|---|---|---|---|
| EN-56 | Lucky Find | encounter | any, 0–100 | any | no battle | – |
| EN-57 | Rain Delay | encounter | any, 0–100 | any | no battle | – |
| EN-58 | Street Performer | encounter | any, 0–100 | any | no battle | – |
| EN-59 | The Quiet Node | encounter | pursuit, 0–100 | any | no battle | – |

**EN-56 Lucky Find.** A lost wallet or a cheap sack of berries.

- Return it: reputation with locals
- Keep it
- Hand it to a police officer
- Effects: Heat 0, Intel 0, OS 0, Rep 0. Weight 4, cooldown 4.

**EN-57 Rain Delay.** A heavy rain closes the road for a node.

- Wait it out: Heat −4
- Push on: a free ambush check
- Share a shelter with a stranger: a story
- Effects: Heat -4, Intel 0, OS 0, Rep 0. Weight 4, cooldown 6.

**EN-58 Street Performer.** A performer drops a coded lyric in their song.

- Tip: Intel +3
- Join in: flavor
- Pass
- Effects: Heat 0, Intel +3, OS 0, Rep 0. Weight 3, cooldown 8.

**EN-59 The Quiet Node.** Nothing happens. It is the pause the pacing needs.

- Rest: a small heal
- Review the Notebook: sorted Intel
- Keep walking
- Effects: Heat -2, Intel 0, OS 0, Rep 0. Weight 5, cooldown 3.

## 17. Honest limits

- Effect numbers, chances and cooldowns are launch defaults for tuning.
- Choices that give "a node of safe travel", "a skill check" or "a field effect" name the idea; the exact rule is for the implementer.
- Team-specific events use canon teams and roaming cast but contain no canon dialogue.
- Rival and Rescue Plan scenes are covered by their own documents; Collision and Rally events here are extra beats, not replacements.
