# The Second Rival ("the Friend")

*Decision D8: a second rival exists in some regions. This document is the spec and the dialogue bank. It extends `CLIMAX_RIVAL_INTEGRATION.md`, `RIVAL_RESCUE_PLAN.md` and `STAND_WITH_THEM.md`. All characters are original; the second rival is a placeholder role filled by the run's own rival-system data (name token `{friend}`).*

---

## 1. What it is, and why it is small on purpose

The primary rival is the story's mirror: a hard, shifting relationship with a 60/30/10 climax roll. The second rival is the opposite shape: a **supporting** presence, a friend with a different personality, who makes the climax feel populated without making it harder to balance.

Three rules keep it bounded:

1. It **never replaces** the primary rival. The primary rival's roll, lines and Turn rules are untouched.
2. It **never betrays** the player. (One rival can side with the team; two would be a story about rivals, not about the team.)
3. It adds **at most one** extra Rival Assist budget (see §4), so a boss fight cannot be trivialized by a crowd.

## 2. Presence and archetype

| Item | Rule |
| --- | --- |
| Presence | 50% per region. `rng(hash(runSeed, regionId, "second-rival-present"))` < 0.50 |
| Archetype | Uniform among the 7 archetypes **other than** the primary rival's. `rng(hash(runSeed, regionId, "second-rival-archetype"))` |
| Rolled | Once, when the region is entered. Never rerolled, never changed by player actions |
| Setting | `rival.second` (default **on**). When off, the presence roll still happens (so seeds stay comparable) but the result is ignored |
| Name | The run's rival-system supplies a name; the bank uses the token `{friend}` |
| Absent | Nothing changes. Every document that mentions the second rival says "if present" |

## 3. The attitude track and the two encounters

The second rival has its own attitude track, **separate** from the primary rival's (range −5..+5), starting at **+1**.

| Encounter | Where | What happens | Attitude |
| --- | --- | --- | --- |
| **Meet** | The first rest node after Gym 2 (or the first town node, whichever comes first) | A short scene in the archetype's voice (bank: `meet`). The player picks [Be friendly] / [Be brisk] | +0.5 / 0 |
| **Mid** | The first rest node after Raid 1 resolves | A check-in scene (bank: `mid`) that reflects the Raid 1 result in one clause (Triumph/Success: pleased; Partial/Failure: worried; Declined: curious). The player picks [Share what you know] / [Keep it to yourself] | +0.5 / −0.5 |

Neither encounter is a battle. Both are skippable in the settings; a skipped encounter keeps attitude at its default and writes no memory.

## 4. The climax role

Rolled once, when the climax is scheduled, **after** the primary rival's roll: `rng(hash(runSeed, regionId, "second-rival-climax"))`.

| Role | Chance | What happens |
| --- | --- | --- |
| **Support** | 70% | The second rival joins the effort and provides a limited Assist (below) |
| **Caught** | 30% | The second rival went in to help and was captured. A **Rescue objective** appears in Phase 3 (below) |

### 4.1 Guards (so the roll never stacks badly)

| Primary rival variant | Guard |
| --- | --- |
| **Help** | No guard: either role is allowed |
| **Beat-you** | **Forced to Support.** The primary rival already needs rescuing; the second rival arrives with the **full** Assist budget (3) because the primary is out of action |
| **Side-with** | **Forced to Support.** The second rival's Support also adds **+1** to the primary rival's Turn formula (`CLIMAX_RIVAL_INTEGRATION.md` §5.3: the friend says what the primary rival needed to hear) |

### 4.2 Support: the Assist budget

| Primary rival variant | Second rival's Assist |
| --- | --- |
| Help | **1** extra Assist per climax, chosen from the same menu (Cover / Opening / Cure / Bait / Rally). Total Assist across both rivals never exceeds **4** |
| Beat-you | **3** (the full menu; the primary rival is the rescued party, not an assistant) |
| Side-with | **2**; the second rival stands with the player in Phase 3 and in Phase 4 |

The Assist is **shown, optional and limited**, exactly like the primary rival's (`CLIMAX_RIVAL_INTEGRATION.md` §3.2). Archetype flavour follows §3.2's table.

### 4.3 Caught: the Rescue objective

| Step | Detail |
| --- | --- |
| Setup | The news report (or the memo, for an Inside Man) adds one line: "A second young trainer is reported missing near the site." |
| Phase 3 | A side room is marked on the pseudo-region map. The detour is **one battle** (a team Lieutenant-class defender, tier 3) and a short scene. It is optional and shown |
| Rescued | The second rival joins for Phase 4 with **1** Assist. Memory `friend-rescued`. Attitude +1.5 |
| Not rescued | The second rival is **Taken**: held by the team. Attitude −1. If the team loses, they are freed offscreen; if the player Stays out or loses, they are in the Doom Ledger as a hostage (no extra penalty to the run) |
| Never | Being Caught never ends the run, and never changes the primary rival's variant |

### 4.4 Stay out, Stand with them

| Choice | What the second rival does |
| --- | --- |
| **Stay out of it** | They go in anyway. The Offscreen Resolution adds one coda line (Support: "went in alongside {rival}"; Caught: "was held for two days and released"). Attitude −1 |
| **Stand with them** | They do not fight. They appear twice: the **plea** in the Phase 0 memo scene and the **reaction** after the verdict (§6) |

## 5. The dialogue bank: 8 archetypes × 11 lines = 88

Kinds: `meet`, `mid`, `support-1` (arrival), `support-2` (mid-fight, when an Assist is used), `support-3` (after the win), `caught-1` (found), `caught-2` (rescued), `caught-3` (left behind, shown if the player did not rescue them), `rescue-join` (joins a Rival Rescue Plan), `plea` (Stand-with memo scene), `react` (after the climax / verdict).

All lines are original. `{rival}` is the primary rival, `{player}` the player, `{site}` the climax site, `{team}` the team.

### 5.1 Hotshot
| Kind | Line |
| --- | --- |
| meet | "You're {player}, right? Everyone's talking. I'm not impressed yet. Don't make me wait." |
| mid | "I heard about the raid. Not bad. If I'd been there it'd have been faster, but not bad." |
| support-1 | "Don't look so surprised! You think I'd miss the loudest fight in the region?" |
| support-2 | "Heads up! I've got this one. Go, go, go!" |
| support-3 | "Ha! Did you see me? Say it. Say I was good." |
| caught-1 | "Took you long enough! I had a plan. The plan was... fine, the plan was bad." |
| caught-2 | "Okay. Okay! I owe you. Don't tell anyone I said that." |
| caught-3 | "You left me in there! ...Fine. Fine. It was a dumb move to go alone." |
| rescue-join | "Rescue? Count me in. I'll take the door. Obviously." |
| plea | "You're joining *them*? That's not funny. Tell me it's a bit." |
| react | "I don't get you. I don't. But you finished it, and that's more than I did." |

### 5.2 Prodigy
| Kind | Line |
| --- | --- |
| meet | "Your team composition is unusual. I'm {friend}. I'd like to see it in action." |
| mid | "I read the raid report. You made two good calls and one lucky one. Let's work on the lucky one." |
| support-1 | "I calculated the odds of you needing help. They were high. Here I am." |
| support-2 | "Window open on turn two. Use it." |
| support-3 | "Efficient. I would have shaved a turn, but efficient." |
| caught-1 | "I misjudged the guard rotation. It happens. Rarely. To me." |
| caught-2 | "I won't pretend I wasn't glad to see you. Thank you." |
| caught-3 | "You had the margin to come back for me. I noted that you didn't." |
| rescue-join | "I've mapped the holding site. Let me show you the weak point." |
| plea | "I ran every projection. None of them end with you on their side. Walk me through yours." |
| react | "I was wrong about one variable: you. Keep surprising me." |

### 5.3 Friendly
| Kind | Line |
| --- | --- |
| meet | "Oh, hi! I'm {friend}. Is your team okay? They look tired. Here, I have berries!" |
| mid | "I heard it was scary. Are you alright? Really? You can tell me." |
| support-1 | "I couldn't just sit at home! Let me help. Please let me help." |
| support-2 | "I've got you! Breathe. Okay, go!" |
| support-3 | "We did it! We actually did it. Oh, I'm shaking. Are you shaking?" |
| caught-1 | "I'm okay! I'm okay. I'm a little scared. Okay, a lot scared." |
| caught-2 | "I knew you'd come. I just knew. Thank you, thank you." |
| caught-3 | "It's okay. I understand. You couldn't. I'm just... glad you're alright." |
| rescue-join | "Of course I'll help get them back. Tell me what to carry." |
| plea | "Please don't. I know you have reasons. But please, talk to me first." |
| react | "I'm not going to stop being your friend. Whatever you chose. I just wanted you to know." |

### 5.4 Bitter
| Kind | Line |
| --- | --- |
| meet | "{friend}. Don't bother introducing yourself; I read the standings. Try not to embarrass us both." |
| mid | "A raid. How noble. Next time, bring someone who can keep up." |
| support-1 | "Don't thank me. I'm here because the team ruined my favourite pier. That's all." |
| support-2 | "Left side. Now. Do I have to draw it?" |
| support-3 | "...Not bad. Not *good*. Not bad." |
| caught-1 | "Don't look at me like that. Get me out. Then say whatever you want." |
| caught-2 | "Fine. You came. I'll remember that. Unfortunately." |
| caught-3 | "Of course you didn't. Of course. I should have known better." |
| rescue-join | "I know a back route in. Don't make me regret telling you." |
| plea | "I won't stop you. I'll just say I'm disappointed. It's a long list, you're on it." |
| react | "I'll never admit this twice. You surprised me. That's all." |

### 5.5 Scholar
| Kind | Line |
| --- | --- |
| meet | "Oh! Your Pokémon's stance is unusual. Do you mind if I take notes? I'm {friend}." |
| mid | "Fascinating. The raid pattern matches a rural supply chain. Tell me what you saw." |
| support-1 | "I've reviewed the site plans. There are three exits. I'll hold the north one." |
| support-2 | "Their pattern repeats every four turns. Now. Now!" |
| support-3 | "Remarkable. I'll write this up. Under 'things I did not expect to survive.'" |
| caught-1 | "I'm unharmed. I'd like to note that the cell is poorly ventilated. Also: hello." |
| caught-2 | "Thank you. I will cite you in every paper I ever write." |
| caught-3 | "I understand the logic of leaving me. I don't love it, but I understand it." |
| rescue-join | "I've catalogued the guard shifts. Take this schedule. You're welcome." |
| plea | "Before you decide: here is the evidence against them. Please read it. Please." |
| react | "I'll need a few days to process this. I'll write it down. That helps." |

### 5.6 Heir
| Kind | Line |
| --- | --- |
| meet | "I'm {friend}. You'll have heard the name. I'd prefer you judged me on today." |
| mid | "My family would have paid the team off. I'd rather watch you do it properly." |
| support-1 | "I've come to help. No retinue, no name. Just me. Please call me {friend}." |
| support-2 | "Let me take this one. It's the least I can do." |
| support-3 | "I'd like to say something grand. All I have is: thank you." |
| caught-1 | "They knew my family name. It didn't help. It really didn't." |
| caught-2 | "You didn't have to. Nobody ever has to for me. Thank you." |
| caught-3 | "I understand. People leave my family's names behind, usually. I'd hoped for better." |
| rescue-join | "My family can open one door. I'll make it a good one. Let me." |
| plea | "I've seen what 'inside' does to people. I'm asking you not to learn it yourself." |
| react | "I'm trying to be someone who doesn't need a name. You helped. Thank you." |

### 5.7 Lone Wolf
| Kind | Line |
| --- | --- |
| meet | "...{friend}. I don't talk much. I watch. You're worth watching." |
| mid | "Raid. I saw the smoke. Good." |
| support-1 | "I'm here." |
| support-2 | "Left." |
| support-3 | "Done. Good." |
| caught-1 | "Late. But you're here." |
| caught-2 | "Thanks." |
| caught-3 | "...Right. You had your reasons. I'll leave it." |
| rescue-join | "I'll go in first. Follow my lead." |
| plea | "Don't." |
| react | "I won't say it again. You did something worth doing." |

### 5.8 Mirror
| Kind | Line |
| --- | --- |
| meet | "You walk like I walk. Funny. I'm {friend}. We should talk about that." |
| mid | "You handled the raid the way I would have. Which is either very good or very worrying." |
| support-1 | "I knew you'd be here. I'd have been here too. So I came." |
| support-2 | "Do what I'd do. I'll cover the rest." |
| support-3 | "That's the version where we both walk out. I like that one." |
| caught-1 | "Strange. I knew this would happen. I came anyway. So did you, I suppose." |
| caught-2 | "You came back. I'd have come back too. That's a comfort." |
| caught-3 | "I would have left me, too. I'm trying to be fine with it." |
| rescue-join | "I know how I'd hide a hostage. Start with the third room." |
| plea | "I can see the version of you that says yes. I'm asking you to be the other one." |
| react | "I recognised you the whole way through. Whichever one you picked, I did." |

## 6. Stand with them: the plea and the reaction

| Beat | When | Detail |
| --- | --- | --- |
| **Plea** | Phase 0, after the memo, before the Last Rest | The second rival arrives with the `plea` line. Choices: [Hear them out] (attitude +1, memory `friend-pleaded`) or [Dismiss] (attitude −1). Neither affects eligibility |
| **Reaction** | Phase 5, after the verdict | The `react` line plays. Attitude change by ending: **Rise** −1, **Take the Throne** −2, **Turn** +1.5 (the second rival is the first to be told) |
| **With a Side-with primary** | Rival Stands beside you (variant 10%) | The plea adds **+1** to the primary rival's Turn formula if the player chose [Hear them out], since the friend voices what the primary rival needed to hear |
| **Caught** | Not applicable | In the Stand-with route the second rival is outside and is never captured |

## 7. Other integration points

| System | Rule |
| --- | --- |
| **Rival Rescue Plan** | If present and attitude ≥ 0, the second rival joins the plan: **+0.05** success, and the `rescue-join` line plays at the plan's first beat. If attitude < 0 they decline politely; no penalty |
| **Memory kinds** (+4) | `friend-met`, `friend-supported`, `friend-rescued`, `friend-pleaded` (callouts below) |
| **Endings** | Friends +10 on Support, +15 on Rescued; Respect +5 on Pleaded; unaffected by Caught-not-rescued except −1 attitude |
| **Region of Doom** | A Taken second rival who is never freed appears in the Doom Ledger as `hostage:friend` |
| **Rival Epilogue card** | Adds one line for the second rival when present |
| **Settings** | `rival.second` (default on); `rival.second.encounters` (default on) |

### 7.1 Memory callouts (neutral)

| Kind | Trigger | Callout |
| --- | --- | --- |
| `friend-met` | Meet encounter done | "{friend} and I met at {place}. I think we'll see each other again." |
| `friend-supported` | Support role resolved | "{friend} stood with us at {site}." |
| `friend-rescued` | Caught and rescued | "I went back for {friend}. I'm glad I did." |
| `friend-pleaded` | [Hear them out] chosen | "{friend} asked me to reconsider. I listened." |

## 8. Edge cases

| Case | Rule |
| --- | --- |
| Primary rival disabled | The second rival still plays, using the same stand-in rules for presence; the primary stand-in is the one that rolls 60/30/10 |
| Second rival same archetype as primary | Prevented by §2 (archetype ≠ primary) |
| Roaming team placed in the region | Unchanged: the second rival engages the **primary** team's climax only |
| Player Stays out | §4.4 |
| Primary Beat-you and second Support | Forced; the second rival provides the full Assist |
| Primary Side-with and Stand-with chosen | Primary Stands beside you; second rival only pleads and reacts |
| Player skips both encounters | Attitude stays +1; climax role still rolls |
| Second rival Taken and the player loses | The run ends as per D1; the second rival is in the Doom Ledger as `hostage:friend` |
| New Game+ / Echo | The second rival may reference a past climax in `react` (no mechanical effect) |
| Local co-op | Not supported in v1 |

## 9. Tests

- Presence rate over 100,000 seeds is 50% ± 1%.
- The second rival's archetype never equals the primary's.
- Role split over 100,000 seeds (unforced) is 70/30 ± 1; with Beat-you or Side-with it is always Support.
- Total Assist across both rivals never exceeds 4 in a Help climax.
- Caught never changes the primary variant and never ends the run.
- Rescued second rival has exactly 1 Assist in Phase 4.
- The bank has 8 × 11 = 88 lines; every kind exists for every archetype.
- Meet and Mid skip cleanly with `rival.second.encounters` off.

## 10. Authoring checklist

- Each line has the archetype's voice, uses `{friend}` only for the second rival's name and never reuses a primary-rival line.
- No line betrays the team or the player: the second rival is never an opponent.
- Keep each line to one or two sentences.
