# STAND WITH THEM — The Inside Man Climax (ships at launch)

*Decision recorded: "Stand with them" is part of launch, not a post-launch variant. The player who joined a team at Ignition can fight the climax **for** the team, against the authorities and the rival. It replaces Appendix B of the design doc. The nine team versions are in `scripts/10_STAND_WITH_THEM.md`.*

---

## 1. What it is

At Ignition every primary team offers recruitment (the **Inside Man** route, flag `<team>.insideman`). Until now the route only changed the raids. With this document it also unlocks a third climax choice: **[Stand with them]**.

The climax then plays **from the team's side**: you defend the site against the region's defenders, carry out the team's signature plan, face your rival as an opponent, and meet the authority leading the defense. Then you decide what kind of ally you are. As always, **losing ends the run** (design doc §7.8).

## 2. Eligibility

All of these must be true when the climax is scheduled:

| Condition | Why |
| --- | --- |
| `insideman` is set for the region's **primary** team | You joined them at Ignition |
| Team reputation ≥ **+45 (Respected)** | You earned trust, not just a uniform |
| You have not **betrayed** the team (design doc §12.5) | No Heat-80 hunt in progress |
| You have not used the **Turn** ending in an earlier region of this run | The team remembers |

If you joined but are below +45 the button is shown **locked with the reason**. If you never joined, the button is hidden (no spoiler).

### 2.1 Reputation on this route

| Event | Rep |
| --- | --- |
| Join at Ignition | set to **+30 (Recognized)** |
| Complete a **Loyalty Job** (below) | Triumph +12, Success +8, Partial +4, Failure −5 |
| Team mission | +8 |
| Team-favoring dialogue choice | +3 |
| **Sabotage from inside** (the normal infiltration raid) | −20 / −12 / −5 / 0 by result (as design doc §12.2) |

By the first climax a loyal Inside Man reaches about +50 to +65. Sabotaging even once makes the climb difficult. This is deliberate: the route is a commitment.

## 3. Raids for an Inside Man: two buttons

Each raid offer shows both options:

| Option | What it is | Effect |
| --- | --- | --- |
| **[Sabotage from inside]** | The usual infiltration raid (`PS-INFIL`, team uniform, discovery = failure). Normal raid results and consequences | Lowers OS as usual; lowers reputation |
| **[Run the job]** | **Loyalty Job**: the same Pseudo Region, but you carry out the team's own objective for them (guard the cargo, secure the line, escort the asset). Same five results, no consequence menu: a failed job only costs reputation | Raises **Allied Strength (AS)**; raises reputation |

**Allied Strength (AS)**, 0–10, starts at 4: Triumph +3, Success +2, Partial +1, Failure −1, Declined 0. A Loyalty Job's Failure never applies C1–C11 (you are on their side); it costs only reputation and AS.

The player can mix, but sabotage works against the Stand-with route.

## 4. The climax from the team's side (`PS-CLIMAX-ALLIED`)

| Phase | Name | Contents | Fairness |
| --- | --- | --- | --- |
| **0** | **Internal Memo & Choice** | A briefing instead of a news report. The memo is the team's own statement of the plan (per team in the scripts). The choice is **[Stand with them] / [Take them on] / [Stay out]**. Then a **Last Rest** | The Situation Report shows readiness; the second rival's plea happens here (`SECOND_RIVAL.md`) |
| **1** | **Hold the Line** | `alliedBattles = clamp(7 − round(AS/2), 3, 6)` trainer battles against **defenders** (Rangers, Gym Trainers, region-flavored guards) | Level = previous stage + 2; AI 2–3; no counters yet |
| **2** | **Carry Out the Plan** | The team's set piece, executed by you: a timed objective of 2–5 points (12 turns baseline), with defenders interfering | Telegraphed; failure drains HP/resources, not the run |
| **3** | **The Rival** | A duel with your rival as your opponent, shaped by the variant (§5) | AI 3; band 35–55% |
| **4** | **The Defender** | The region's defense leader: **the Gym Leader of the last Gym you beat** (generic: `{gymLeaderG}`), team of 6 at Gym-leader tier +1, with a telegraphed phase change at 50% ace HP | AI 3–4; band 35–55% |
| **5** | **The Verdict** | The team's Leader judges you. Then three endings: **Rise**, **Take the Throne**, **Turn** (§6) | Narrative; Take the Throne and Turn include one more battle |

Typical total: **8–11 battles**. The same win-rate bands as the normal climax apply (40–60 / 35–55 / 30–50).

The roaming team (if placed) is handled as in `RETURNING_TEAMS_ANYWHERE.md`, mirrored: the acting leader contests the team's prize and you defend it in the Phase 2.5 duel.

## 5. The rival in the Stand-with climax (60 / 30 / 10 still applies)

The variant is rolled once exactly as before. Only the **role** changes:

| Rolled variant | Chance | Role in the Stand-with climax |
| --- | --- | --- |
| **Help** | 60% | **Opposes.** The rival arrives with the defenders to stop the team, and to stop you. Phase 3 is a full duel. The rival is hurt in spirit, not captured |
| **Beat-you** | 30% | **Already inside.** The rival infiltrated before you and sabotaged one Phase 2 point (the objective gains a **Sabotaged** point to restore). Phase 3 is the duel on that platform. After it the rival is **Captured**. At the Verdict you decide: *release them* or *hand them to the team* |
| **Side-with** | 10% | **Stands beside you.** The rival is already part of the team (the foreshadowed beats pay off as a different kind of ending). Phase 3 is a **Double Battle** against the defenders' two best trainers. Both of you are named in the Verdict |

If the **Turn** ending is chosen, the variant maps back to the normal climax (design doc and `CLIMAX_RIVAL_INTEGRATION.md`): Help → helps; Beat-you → Captured/Shaken rescue state; Side-with → Turn formula, with a **−1** penalty (you were seen standing with them).

### 5.1 Rival lines (8 archetypes × 3 variants × 2 beats = 48)

Beats: **arrival** (when the rival appears in Phase 3) and **resolution** (after the duel or the Double Battle).

| Archetype | Opposes: arrival | Opposes: resolution | Already inside: arrival | Already inside: resolution | Stands beside: arrival | Stands beside: resolution |
| --- | --- | --- | --- | --- | --- | --- |
| **Hotshot** | "You?! You're with THEM? Unbelievable. Fine. I'll beat you in front of everyone." | "Okay. Okay, you won. But I'm not done. I'm never done." | "I got in first! I got in first, and now I'm stuck. Don't laugh." | "Don't say it. Just... get me out of this cage. Please." | "We're in! Together! Wait, did you plan this? I'm not mad. I'm... impressed." | "Best team-up ever. Don't tell anyone I said that." |
| **Prodigy** | "The data pointed to this. I refused to read it. Defend yourself." | "Your side wins this exchange. The argument is not settled." | "I've disabled the third lantern. You will have to fix it. Think about why I did." | "Captured. A flaw in the plan. Mine. I accept the consequences." | "Our objectives align. I did not expect that to be true." | "Efficient. Let us never discuss how well that worked." |
| **Friendly** | "No... not you. Please tell me you have a reason. Please." | "I don't hate you. I just... wish you'd chosen differently." | "I'm so sorry. I wanted to stop them before you did something you'd regret." | "Don't be angry. I'm just glad it's you who found me." | "I knew you'd come around. I knew it. We can fix this from the inside." | "We did it. I think. I hope it's the right thing." |
| **Bitter** | "Of course. Of course you picked them. Everyone I've ever trusted does." | "Don't look at me like that. You made your choice." | "I got in to take them down. And look who walks in. Bold of you." | "Take me wherever you take people. I'm tired of caring." | "They gave you the same offer they gave me. Funny how that works." | "...This feels like winning. I hate that it feels like winning." |
| **Scholar** | "A fascinating development. I did not hypothesize this. Let us test it." | "My hypothesis was wrong about you. I will revise it." | "I only wanted to observe the third lantern. It is, regrettably, broken." | "An unplanned data point. Thank you for noticing me." | "A shared dataset. We have rarely agreed on so much." | "A complete study. I should publish it. I suspect I should not." |
| **Heir** | "I am obliged to oppose you. I regret that the obligation is mine." | "A fair loss. I will carry it with dignity." | "I entered in good faith. I find myself... detained. How uncivil." | "Release me, or do not. I will thank you in either case." | "Our families would be astonished. As am I. Let us proceed." | "An honourable partnership. I will remember it." |
| **Lone Wolf** | "...You." | "...Fine. Go." | "...Late." | "...Thanks. Don't tell." | "...Together, then." | "...Good." |
| **Mirror** | "I'm doing what you'd do if you were me. Fight me. Be the one who sees it." | "You won. You'd have said that. I'm still not sure what that means." | "I did what you did, only earlier. It cost me." | "You'd have gotten out. I couldn't. I'm sorry I'm not you." | "I'm on your side. Which is funny, because so are you." | "Two of us. Same ending. Almost like a mirror." |

### 5.2 If the player falls in the Stand-with climax (8 lines)

The run ends. The rival speaks once. The Doom Ledger records the team as `routed` and the run as `allied-defeat`.

| Archetype | Line |
| --- | --- |
| Hotshot | "Ha! Got you. Wait, no. I didn't want to. Get up." |
| Prodigy | "I was correct. I take no satisfaction in it." |
| Friendly | "I'm sorry. I'm so sorry. I wish it had gone differently." |
| Bitter | "You picked a side and lost. That's all there is to say." |
| Scholar | "An instructive failure. I will note the conditions." |
| Heir | "Your service was sincere. Rest." |
| Lone Wolf | "...Done." |
| Mirror | "I won. It felt like losing. Strange." |

## 6. The Verdict and the three endings

The team's Leader speaks. The player picks one ending. Each team's text is in the scripts.

| Ending | Meaning | Extra battle | Result |
| --- | --- | --- | --- |
| **Rise** | You accept a place in the hierarchy | None | The team wins. You gain **Executive** rank (title, exclusive item set, team-shop discount). Region becomes **Allied-Occupied** (§7). Doom Ledger: `team.ended = victorious-allied` |
| **Take the Throne** | You challenge the Leader | The team's Leader boss fight (normal Phase 4 stats, Doctrine active, the player's rank gives the player **no** bonus). Requires reputation ≥ **+70 (Allied)** | If you win, you lead the team. The old Leader leaves or is held. Doom Ledger: `team.leader = player` |
| **Turn** | You change sides at the last moment | The normal Phase 4 Leader fight (Doctrine active), with the defenders from Phase 1 acting as **Assist** (budget 2) | Normal victory rewards, no Executive rank; the team turns **Hostile**, Heat 80, as in design doc §12.5. Variant maps back (§5) |

## 7. Aftermath of a Stand-with victory (`PS-AFTER`)

The run continues. The effects are chosen to be real but fair:

| Effect | Rise | Take the Throne | Turn |
| --- | --- | --- | --- |
| Region state | **Allied-Occupied** | **Allied-Occupied** | Normal (Peacemaker Emblem) |
| Team shop | −20% prices; exclusive stock | −20% prices; exclusive stock | Closed |
| Other shops | +15% prices | +15% prices | Normal |
| Authority ambushes | **Wanted**: authority ambushes (Rangers, Gym Trainers) at 15% base for 8 nodes in the next region | Same, plus +5% | None; the team hunts instead |
| Impounded Pokémon | Returned by the Leader as a "gift" | Returned | Per the rival's Rescue Plan |
| Region of Doom | Start with one Evil Team Gym pre-cleared and −1 Doom Level for this team | Same, and you hold a district | Normal |
| Rival | By variant (§5) | By variant | By variant, with the −1 turn penalty |

Authority ambushes use ordinary trainers at the same difficulty as team ambushes, with the same caps and counterplay (Decoy Tag).

## 8. Edge cases

| Case | Rule |
| --- | --- |
| Two teams in the region (Hoenn, Alola, Galar, or a placed roaming team) | Stand-with is for the **primary** team only. Hoenn offers Aqua *or* Magma (the flag set at Ignition); Alola's route is through Skull; Galar's through Macro Cosmos (Team Yell's comic flag does not unlock it) |
| Player lost the Inside Man flag (betrayed) | Button hidden |
| Player sabotaged one raid but stayed ≥ +45 | Allowed |
| Rival variant is Beat-you and the player picks "release them" | Rival attitude +1.5; the team's reputation −10 |
| Rival variant is Beat-you and the player picks "hand them over" | The rival is held; they appear in the Region of Doom. Attitude −2 |
| A second rival exists | See `SECOND_RIVAL.md` §6 (plea scene and reaction) |
| New Game+ | Prior Stand-with endings change an Aftermath line only |

## 9. Tests

- The button is hidden without the flag, locked below +45, and enabled at +45.
- Loyalty Job failure never applies C1–C11.
- `alliedBattles` stays within 3–6 for any AS 0–10.
- All three endings are reachable; Take the Throne is refused below +70.
- A loss in any phase ends the run with the `allied-defeat` ledger entry.
- Turn restores the normal Phase 4 and sets Heat to 80.
- The rolled rival variant never changes after the choice.
- Rival lines exist for 8 × 3 × 2 cells and 8 defeat lines.
