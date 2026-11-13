# CLIMAX × RIVAL INTEGRATION
## The rival at every regional climax

*Extends `BETA_06_DESIGN_DOCUMENT.md` §7–§8 and `RIVAL_MEMORY_REACTION_SYSTEM.md` (8 archetypes, memory, attitude, endings).*

> **Rule:** every regional climax involves at least one of your rivals. The rival will **help you (60%)**, **beat you to them (30%)**, or **side with them (10%)**.

---

## 1. The roll

| Variant | Id | Probability | One-line summary |
| --- | --- | --- | --- |
| **Help** | `rival.help` | **60%** | The rival meets you at the site and fights beside you |
| **Beat-you** | `rival.beat` | **30%** | The rival got there first; the news report says so; you arrive to a situation already in motion |
| **Side-with** | `rival.side` | **10%** | The rival is with the team |

### 1.1 When and how it is rolled

- Rolled **once per region**, at the moment the climax is scheduled (after the Gym `G` victory scene, **before** the News Report is composed, because the report depends on it).
- Uses the run's seeded RNG: `rng(hash(runSeed, regionId, "rival-climax"))`. Same seed → same variant.
- Stored in Narrative State as `climax.rivalVariant`. **Never rerolled** and never changed by player actions. (It is not a reward or a punishment; attitude and archetype change *how* it plays, not *whether*.)
- Dev override: `climax rival <help|beat|side>`; the test suite forces each variant.
- Statistical test: 10,000 seeds → 60% ± 1.5, 30% ± 1.5, 10% ± 1%.

### 1.2 Which rival

The climax always runs on the **primary rival**. If a second rival is present (50% of regions; `SECOND_RIVAL.md`), they take a smaller **Support** (70%) or **Caught** (30%) role, with guards so they never stack on a Beat-you or Side-with variant. If the run has none (rival disabled in settings), a **stand-in** is used: a recurring Gym-circuit trainer from the region's roster, with a `Friendly`/`Prodigy`/`Hotshot` voice, and the same three variants apply. The stand-in has no memory/attitude layer; lines come from the generic archetype banks.

### 1.3 Counting as a rival encounter

The climax meeting is a **Rival 4 / pre-climax encounter** for the purposes of the rival system (team stage 4 team, 5 Pokémon, signature item, counter slot), regardless of how many earlier encounters occurred. It writes `rival_encounter` events and a memory (`climax-together`, `climax-first`, `climax-opposed`; see §9).

---

## 2. Variant mechanics at a glance

| Aspect | Help (60%) | Beat-you (30%) | Side-with (10%) |
| --- | --- | --- | --- |
| News report | Standard text; rival is not mentioned | **Includes the rival** ("a young trainer is already inside") | Standard text; no mention (the twist is hidden) |
| Phase 1 (Gauntlet) | **Shortened** by 1 battle; rival handles one floor | **Shortened** by 1–2 battles (the rival cleared them) but with *aftermath hazards* | Normal length; rival is **seen once** in the distance (foreshadow) |
| Phase 2 (Executives/Second) | **Co-op duel** (2v2 or rival assist) | **Rescue** of the rival; solo duel | Normal; Executive reveals the rival's role afterwards |
| Phase 3 (Set piece) | Rival holds one of three objectives | Rival is **Captured/Shaken**; objective count +1 for the player | The rival **sabotages** one objective (the player must make up for it) |
| Phase 4 (Leader) | Rival **assists** (one support action per 3 turns) | Rival **returns** mid-phase after being rescued (one assist) | Rival **fights you** (Phase 2.5 duel) and then either breaks away or leaves |
| Resolution | Shared victory scene | Rival indebted/ashamed/resentful by archetype | Rival turns back (conditions) or exits |
| Rival attitude Δ | +1.5 | −0.5 to +1.5 by archetype and rescue | −1 to +2 by archetype and whether they turn |
| Memory written | `climax-together` | `climax-first` | `climax-opposed` |
| Gameplay swing (fairness) | Easier by ≈ 8% win rate | Neutral (≈ 0%) | Harder by ≈ 6% (offset by a rival-duel reward) |

> Win-rate bands for the reference party stay within §7.5 of the design document for every variant; the table's swing values are tuning targets to hit with the Rival Assist budgets in §3 and §5.

---

## 3. Variant 1 — Help (60%)

### 3.1 Beats

1. **Arrival.** The player reaches the climax site entrance; the rival is waiting (or arrives at a run). The rival uses archetype-specific greeting lines (§7).
2. **Plan.** A one-card "plan" choice: **[Split up]**, **[Stay together]**, **[You lead]**. (This changes which Phase 1 floors the rival clears and which support action is available; see §3.2.) The choice sets a flag and is shown in the Notebook.
3. **Co-op Gauntlet.** The rival fights through one flank. The player faces `gauntletBattles − 1` trainers.
4. **Co-op duel (Phase 2).** The Executive/Second fight is a **2v2 tag-in** if doubles are supported, otherwise a **Rival Assist** singles duel (the rival provides one of the Assist actions below).
5. **Set piece.** The rival takes one of the three objectives; the player handles the others.
6. **Leader.** The rival **holds the line** (distracts the Leader's reinforcement) and provides a periodic Assist.
7. **Resolution.** Both stand at the end; a shared moment (varies by archetype and attitude).

### 3.2 Rival Assist (the rival helps, but the player leads)

The rival's help is a **limited, shown, optional resource**. It never replaces the player's decisions and never trivializes a boss.

| Rival Assist | Effect | Limit |
| --- | --- | --- |
| **Cover** | Absorbs one hit for the player's active Pokémon (the rival's Pokémon takes the attack; flavor) | 1 per boss fight |
| **Opening** | Lowers one opposing stat by 1 stage at turn 1 | 1 per phase |
| **Cure** | Cures one status on the player's active Pokémon | 1 per phase |
| **Bait** | Draws the enemy's next target (the enemy attacks the rival's decoy) | 1 per boss fight |
| **Rally** | Player's active Pokémon gets +1 to its highest attacking stat | 1 per boss fight |
| **Intel** | Reveals the enemy's held item or next planned move this turn | 1 per phase |

**Assist budget:** 3 assists per phase, 1 per Boss fight turn window (every 3 turns). The Assist menu is shown with the cooldown.

**Archetype flavor (which Assists the rival prefers):**

| Archetype | Preferred Assists | Style |
| --- | --- | --- |
| Hotshot | Opening, Rally | Flashy; announces the assist loudly |
| Prodigy | Intel, Cover | Efficient; corrects the player's plan |
| Friendly | Cure, Cover | Caring; checks on your Pokémon |
| Bitter | Bait, Opening | Grudging; "Don't mistake this for kindness." |
| Scholar | Intel, Cure | Observational; narrates the enemy's pattern |
| Heir | Cover, Rally | Formal; treats it as honor |
| Lone Wolf | Bait, Opening | Silent; acts, not speaks |
| Mirror | Mimics the player's last action type | Uncanny |

### 3.3 Help-variant outcomes

- **Attitude:** +1.5, ×1.4 for Friendly, ×0.6 for Bitter (see rival doc §10.2).
- **Memory:** `climax-together` (valence +1).
- **Reward:** Shared Victory scene; the rival may give a gift (small, common-tier).
- **If the player wipes in Phase 4:** the rival does not "save" the player; the standard defeat rule applies (A6).

---

## 4. Variant 2 — Beat-you (30%)

"Beat you there" means the rival reached the team **before the player did**, engaged them, and is now in trouble. The news report says so.

### 4.1 The news report (variant B)

The report is composed with an extra **rival segment** (for each team, the script defines the exact text; this is the generic template):

> **Anchor:** "…and in an unexpected development, an unidentified young trainer has entered {siteName}. Eyewitnesses describe a trainer in {rivalOutfitTag}, accompanied by a {rivalAceType}-type Pokémon. Contact with the trainer has been lost for {minutes} minutes."
> **Chyron:** `TRAINER INSIDE {SITE} — STATUS UNKNOWN`

The segment is shown *before* the call to action, ensures the player realizes the stakes, and adds tension without spoiling anything beyond the rival's presence.

### 4.2 Beats

1. **Arrival.** The player reaches the site. The entrance shows signs of a battle already fought: fallen guards, wreckage, a discarded item belonging to the rival.
2. **Shortened Gauntlet.** `gauntletBattles − (1 or 2)` (depending on OS), plus **aftermath hazards**: damaged floors, broken doors, panicked civilians.
3. **The rival is found.** Between Phase 1 and Phase 2 or mid-Phase 2, depending on the script. The rival's state is one of: **Captured**, **Shaken**, **Hurt**, **Defiant but outnumbered**. The state is chosen by archetype (§6).
4. **Rescue.** Phase 2 is a **Rescue Duel**: the player must beat the Executive/Second while the rival is held (extra objective: break the restraints / reach the cell / drag the rival clear). The rival, once free, gives a line and either rejoins the party (as an Assist source for Phase 4) or rests.
5. **Set piece.** Objective count +1 (the rival's earlier disruption caused fallout).
6. **Leader.** The rival assists once (if rescued) or watches (if "Shaken").
7. **Resolution.** The rival's reaction (indebted, ashamed, resentful, defiant) by archetype.

### 4.3 Why this is fair

The rival's earlier work already removed battles. The cost is the **rescue** and **aftermath hazards**. Net difficulty is neutral. The rival is never *killed*, and the player is never punished for the rival's actions.

### 4.4 Outcomes

- **Attitude:** archetype-specific: grateful (Friendly +1.5), ashamed (Heir +0.5, Prodigy +0.5), resentful (Bitter −0.5), amused (Hotshot +0.5), curious (Scholar +1), silent respect (Lone Wolf +1), unsettled (Mirror 0).
- **Memory:** `climax-first` (valence −1 for the rival; "I got there first. It wasn't enough.").
- **Reward:** the rescued rival gives their personal thanks and, depending on attitude, a small item.

---

## 5. Variant 3 — Side-with (10%)

The rival is with the team: because of conviction, coercion, curiosity, or rivalry. It must be **foreshadowed fairly** and **resolved humanely**.

### 5.1 Foreshadowing (required)

To avoid a cheap twist, each team script includes **three foreshadow beats** that appear regardless of variant but read differently in hindsight:

1. **A grunt line** referencing "a kid with {starterType} Pokémon who asked a lot of questions."
2. **A gap in the rival's behavior:** at Raid 2 the rival is "busy" or unavailable; their last note is oddly cheerful or cold.
3. **A small object:** the rival's item/badge/charm appears at the climax entrance.

In Help and Beat variants these beats resolve as innocent. A fair reader should be able to guess; a casual one is surprised.

### 5.2 Beats

1. **News report** (standard; no mention).
2. **Gauntlet** (normal length). The rival is glimpsed on a balcony or monitor.
3. **Phase 2.5 — The Rival Duel.** After Phase 2 or before Phase 4 (script-defined), the rival steps out. They fight the player with their **Stage 4** team (5 Pokémon, signature item, a counter against the player's top tactic by the counter rule; cost ≤ 2).
4. **The Reveal Scene.** The rival's reason (archetype-driven, §6), a short dialogue with branching response options (3 choices) that set the **Turn** score (§5.3).
5. **Resolution of the rival:** the rival either **breaks away** (turns back, joins in Phase 4 as an Assist source) or **stays with the team** (does not appear again in this climax; reappears in the Aftermath).
6. **Leader.** If the rival turned, Phase 4 has +1 Assist and the rival's last line is a pivot. If not, Phase 4 includes one extra **Rival Interference** event (telegraphed): the rival tries to protect the Leader once.

### 5.3 The Turn (can the rival be won back?)

`turnScore = attitude (−5..+5) + dialogueChoice (−1, 0, +1, +2) + raidBonus + memoryBonus`

| Term | Value |
| --- | --- |
| attitude | The rival's attitude toward the player at climax |
| dialogueChoice | +2 for the archetype's "key" response (see §6), +1 acceptable, 0 neutral, −1 wrong |
| raidBonus | +1 if both raids were Success or better; −1 if both were Failures |
| memoryBonus | +1 if a shared-rest/kept-promise/helped-rival memory exists; −1 if broke-promise/fled-from-rival |

Turn if `turnScore ≥ 3`. If not, the rival **stays** and is defeated; they are not killed or captured; they leave (see below).

### 5.4 Outcomes

- **Turned:** attitude +2, memory `climax-opposed-turned` (valence +1), rival's ending bias toward Friends/Respect/Redemption.
- **Stayed:** attitude −1.5 (Bitter, Heir −0.5 due to honor), memory `climax-opposed-stayed`; ending bias toward Estranged/Rivals Forever; the rival returns at the League gate with a changed line.

### 5.5 Why 10%, and why it's safe

It's rare so it feels like a story event. The rival is never an unwinnable opponent, and the rival duel's reward is a small, themed item and a strong Notebook entry.

---

## 6. Archetype × Variant matrix

How each of the eight archetypes behaves in each variant. The "key response" is the dialogue choice that gives +2 in the Turn formula.

| Archetype | Help | Beat-you (rival's state) | Side-with (motive) | Key response (Turn) |
| --- | --- | --- | --- | --- |
| **Hotshot** | Charges in, announces assists, demands credit | **Defiant but outnumbered**: "I had them!" | **Tempted by power**: "Look at what they gave me." | Challenge them to win it back fairly |
| **Prodigy** | Quietly competent, corrects the plan | **Shaken**: miscalculated; stunned silence | **Ideological**: "Their logic is sound." | Counter the logic with evidence of what the team cost |
| **Friendly** | Worried, caring, brings supplies | **Hurt**: bruised, apologizes for being in the way | **Deceived/persuaded**: "They said they'd help." | Say you believe in them |
| **Bitter** | Grudging, "Don't mistake this for kindness" | **Captured**: furious at being rescued | **Coerced by grievance**: "They gave me what you had." | Acknowledge the unfairness, offer help without pity |
| **Scholar** | Narrates the enemy, notes everything | **Shaken**: the experiment failed | **Curiosity**: "I just wanted to see." | Ask what they have found (and name what it costs) |
| **Heir** | Formal, treats it as duty | **Captured**: ashamed | **Obligation**: "A debt is a debt." | Release them from the obligation |
| **Lone Wolf** | Silent, acts | **Hurt**: quiet, hides it | **Own cause**: "Our goals overlap." | Offer an alternative path (not an argument) |
| **Mirror** | Mimics the player's actions | **Shaken**: saw themselves in the team | **Reflection**: "You would have understood." | Show them who they are, not who you are |

### 6.1 Rival condition states (Beat-you)

| State | Rescue mechanics |
| --- | --- |
| **Captured** | A cell/restraint; objective: reach and free (3 steps) |
| **Shaken** | The rival is stunned at a corner; needs an item or a calming dialogue |
| **Hurt** | The rival cannot fight; the player escorts them to a safe room (short sub-objective) |
| **Defiant but outnumbered** | The rival is cornered and still fighting; the player joins a 2v1 flank battle |

---

## 7. Rival line banks for the climax

Original lines. Slots in `{braces}` per `RIVAL_MEMORY_REACTION_SYSTEM.md` Appendix A plus: `{site}` (climax site), `{team}` (team name), `{leader}` (leader name), `{teamNoun}` (e.g., "the Choir").

Each cell has three lines: **Arrival**, **Mid-climax**, **Resolution**. Help and Beat are listed together because they share arcs; Side has its own set.

### 7.1 Hotshot

| Variant | Arrival | Mid-climax | Resolution |
| --- | --- | --- | --- |
| Help | "About time! I saved you the best part — go on, follow me!" | "Watch this! Opening for you, {player}!" | "That was incredible. Don't tell anyone I was scared." |
| Beat | "I had them! I swear I had them. Ugh — {player}, you're here?" | "Ha… still got a move left. Don't look at me like that." | "Don't say it. Don't say thank you. Just — thank you." |
| Side | "Look at this! {team} sees what I can be!" | "You don't get it. I'm not losing to you in front of everyone." | "…It wasn't supposed to feel like this. I wanted to be seen." |

### 7.2 Prodigy

| Variant | Arrival | Mid-climax | Resolution |
| --- | --- | --- | --- |
| Help | "You're late. I mapped the floors; follow the plan I wrote." | "Exploit the left flank. Now. I'll cover." | "Your improvisation was adequate. More than adequate. Thank you." |
| Beat | "My model did not include this. I am… recalculating." | "Don't speak. I'll think. We need a new plan." | "I was wrong about the margin. I'll remember that." |
| Side | "Their reasoning is more coherent than anything I've been taught." | "I will prove my logic. Defend yours." | "You didn't beat my argument. You gave me a better one." |

### 7.3 Friendly

| Variant | Arrival | Mid-climax | Resolution |
| --- | --- | --- | --- |
| Help | "{player}! You came! I brought berries — are your Pokémon okay?" | "Hold on, I'll heal you up. You've got this!" | "We did it! I'm so glad you were here." |
| Beat | "I'm so sorry — I thought I could handle it. Please… be careful." | "Don't worry about me. Go. I'll be fine." | "Thank you for coming for me. I won't forget it." |
| Side | "They said they'd help me find {rivalAce}'s parents. I believed them." | "I don't want to fight you. But I promised." | "You're right. I knew something was wrong. I just wanted it to be true." |

### 7.4 Bitter

| Variant | Arrival | Mid-climax | Resolution |
| --- | --- | --- | --- |
| Help | "Don't mistake this for kindness. They hurt people I care about." | "Keep up. I'm not carrying you." | "…We're even. For now." |
| Beat | "Go away. I don't need you to — ugh. Fine. Get me out." | "Don't pity me. Just move." | "I owe you. I hate that I owe you." |
| Side | "They offered me what you were handed. A real chance." | "You've never had to choose between losing everything and losing yourself." | "…You came for me anyway. Why does that make this harder?" |

### 7.5 Scholar

| Variant | Arrival | Mid-climax | Resolution |
| --- | --- | --- | --- |
| Help | "Perfect timing. I've compiled their patrol patterns. Shall we?" | "Observation: the left emitter fails every nine seconds. Use it." | "I'll write this up. You'll be in the acknowledgements." |
| Beat | "I wanted to see how they operate. My hypothesis was… flawed." | "Please note: I am not proud of this. Help me out of here?" | "Thank you. I've learned more in an hour than in a year." |
| Side | "I only wanted to understand it. They've shown me things." | "This is the most interesting battle of my life. Don't hold back." | "I understood the data and ignored the cost. I won't do that again." |

### 7.6 Heir

| Variant | Arrival | Mid-climax | Resolution |
| --- | --- | --- | --- |
| Help | "I came as soon as I could. It is my duty to see this through." | "Allow me. A courtesy." | "It was an honor to fight beside you, {player}." |
| Beat | "I… acted without permission. Please forgive the disgrace." | "I will not be rescued like a parcel. Release the lock — then I'll stand." | "I owe you more than I can say. I will say it, later." |
| Side | "I owe {team} a debt. It's older than my name." | "Do not ask me to break a promise." | "You've freed me from a promise I should never have made." |

### 7.7 Lone Wolf

| Variant | Arrival | Mid-climax | Resolution |
| --- | --- | --- | --- |
| Help | "…Here." | "Left." | "…Good." |
| Beat | "…Slow." | "Don't talk. Move." | "…Thanks." |
| Side | "Our goals overlap." | "Don't make this personal." | "…You came. I didn't expect that." |

### 7.8 Mirror

| Variant | Arrival | Mid-climax | Resolution |
| --- | --- | --- | --- |
| Help | "I knew you'd be here. I'd have been here too." | "You'd go left. So will I." | "We make a good echo." |
| Beat | "I was trying to be you. It didn't work." | "That's what you'd do, isn't it? Wait for help?" | "Thank you for not being me." |
| Side | "I'm just doing what you would have done in my place." | "Fight me. Be the version of me that wins." | "I found a face of my own. It isn't theirs." |

(8 archetypes × 3 variants × 3 beats = **72 lines**. Add the per-team lines in the scripts.)

---

## 8. Integration with raids and levers

| Raid outcome | Effect on the rival |
| --- | --- |
| Triumph (any) | +1 attitude; the rival mentions it ("I heard what you did at {raidSite}") |
| Success | +0.5 attitude |
| Failure | −0.5 attitude for Hotshot/Prodigy/Bitter (contempt), +0.5 for Friendly/Scholar (worry) |
| Both raids Failures | The rival variant **Beat-you** has a harder rescue state (Captured instead of Shaken) |
| Declined both | The rival remarks ("You didn't try?") with archetype-specific tone; no mechanical effect |

The rival is **not present** in raids. They may appear in the Notebook with a note ("Rival is elsewhere"). In Side-with runs, one raid's recap includes a subtle clue.

---

## 9. Memory and ending integration

### 9.1 New memory kinds (add to catalog, +3 → 43)

| Kind | Trigger | Callout (neutral) |
| --- | --- | --- |
| `climax-together` | Help variant resolved | "We stood together at {site}. I haven't forgotten." |
| `climax-first` | Beat-you resolved | "I got to {site} first. It wasn't enough." |
| `climax-opposed` | Side-with resolved (turned or stayed) | "We fought at {site}. I'm still thinking about it." |

Hostile/warm variants follow the rival doc's callout format.

### 9.2 Endings

| Variant | Ending bias |
| --- | --- |
| Help | Friends +20, Respect +15 |
| Beat | Respect +10, Rivals Forever +10 (Bitter/Heir: Redemption +10) |
| Side (turned) | Redemption +20, Friends +10 |
| Side (stayed) | Estranged +20, Rivals Forever +10 |

(Applied as additive weights to the rival doc's ending conditions; hard conditions still win.)

### 9.3 The Rival Epilogue card

The run summary adds the climax line: *"{rival} {helped you at / reached before you / stood against you at} {site}."*

---

## 10. Edge cases and rules

| Case | Rule |
| --- | --- |
| Player stays out of the climax | The rival variant still plays offscreen (see design doc §7.7); the Aftermath includes a rival coda |
| Rival is defeated earlier in the run | Normal; rival variants do not depend on win/loss record |
| Two teams in the region (Hoenn, Alola, Galar, or a placed roaming team) | The rival engages the **primary** team; the second team may appear as an Executive-level subplot in the same climax |
| Rival mode disabled | Stand-in (§1.2) |
| Second rival present | `SECOND_RIVAL.md` §4: Support or Caught; Beat-you and Side-with force Support; total Assist across both rivals ≤ 4 |
| Rival's region mismatch | Uses the run's active rival |
| Local co-op / second player | Second player counts as the Help ally; the rival does not appear (v1 not supported) |
| The Champion fight | Separate; this climax does not replace the League |
| New Game+ / Echo | The rival may reference a previous climax in the Aftermath (no mechanical effect) |

---

## 11. Tests

| Test | Pass |
| --- | --- |
| Roll distribution (10,000 seeds) | 60/30/10 within tolerance |
| Determinism | Same seed → same variant, same lines |
| News variant | B includes rival segment; A and C do not mention the rival |
| Foreshadow (Side) | All three foreshadow beats fire in every Side run (and read innocently in Help/Beat) |
| Assist budget | Never exceeded; always shown |
| Win-rate bands | Reference party within bands for all variants |
| Rescue completeness | Every Beat state has a completable rescue |
| Turn formula | Unit tests across archetype × choice × attitude |
| Memory write | Exactly one `climax-*` memory per climax |
| Stay-out | The Offscreen Resolution table produces a valid result for all (variant × OS band) |
| Rival disabled | Stand-in works for all three variants |
| Localization | No unresolved slots |

---

## 12. Authoring checklist (per team)

For each team script, the Rival section must contain:

1. The News Report in **A** (standard) and **B** (rival-beat) forms.
2. **Help**: where the rival joins; which phase is shortened; a team-specific rival line.
3. **Beat**: the rival's condition state per archetype group; the rescue sub-objective; the aftermath hazard.
4. **Side**: the motive hook for the team; the three foreshadow beats; the reveal scene; how the Leader reacts.
5. The Turn dialogue choices (3 options, one key per archetype group).

---

## 13. If the player falls (the climax is lost and the run ends)

A climax defeat ends the run. The rival speaks once, on the defeat screen, in the voice of the variant that was rolled. Nine team scripts reference this table from §10.11.

| Archetype | Help | Beat-you | Side-with |
| --- | --- | --- | --- |
| **Hotshot** | "No. No, no. Get up! I had them right where... get UP!" | "I told you I had them. I didn't. I'm sorry." | "Don't look at me like that. I said I'd win it. I just never said whose side." |
| **Prodigy** | "A single misjudged turn. Mine. I will not make it twice." | "I miscalculated, and you paid for it." | "You see now? Logic prevails. Rest." |
| **Friendly** | "Oh, no, no, no. I'm here. I'm here. Please be okay." | "I'm so sorry I wasn't enough." | "I never wanted this. I never wanted any of this." |
| **Bitter** | "Don't you dare lie there. We were supposed to win." | "Of course it ends this way. Of course." | "You wanted a fair fight. Nobody gets one." |
| **Scholar** | "A significant failure. I will document it. Properly." | "I hypothesised it would hold. It did not." | "A fascinating outcome. I take no joy in it." |
| **Heir** | "Forgive me. I should have stood before you." | "A disgrace. Mine, and I will carry it." | "A debt is paid. I do not feel lighter." |
| **Lone Wolf** | "…No." | "…Sorry." | "…It's done." |
| **Mirror** | "That could have been me. That should have been me." | "I tried to be you. I failed you." | "I would have done it too. That's the worst part." |

(8 archetypes × 3 variants = **24 lines**.)

**Rules.** The rival's attitude is not changed (the run is over). A memory `climax-lost` is written for the New Game+ epilogue. If the rival variant is **Side-with**, the defeat scene shows the rival standing with the team, not the player.

## 14. Impound and the rival

The rival's Rescue Plan for impounded Pokémon is specified in `RIVAL_RESCUE_PLAN.md`. It is independent of the climax roll. See that document's §9 for how it interacts with each variant.
