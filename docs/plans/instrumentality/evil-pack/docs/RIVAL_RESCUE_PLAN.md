# THE RIVAL'S RESCUE PLAN — Getting Impounded Pokémon Back

*Decision recorded: impounded Pokémon (consequence C1) are not left to wait for the climax. About ten nodes after the Impound, or at the climax at the latest, **your rival comes to you with a plan to get them back.** This document specifies the trigger, the plan, the micro Pseudo Stage that runs it, and the dialogue for every rival archetype. It extends `CLIMAX_RIVAL_INTEGRATION.md` and design doc §6.5.*

---

## 1. Why this exists

C1 (Impound) is the heaviest raid-failure consequence. Under the earlier rule the Pokémon sat with the team until the climax. That rule is replaced: the rival, who is already part of every climax, now also owns the *middle* of the arc. It gives the rival a reason to show up before the climax, turns a punishment into a story beat, and still leaves the player with a cost (the plan is not free and can go wrong).

## 2. Trigger rule

```
impoundNode      = stage node index when C1 was applied (earliest unresolved C1)
waitNodes        = 9 + floor(rng(hash(runSeed, regionId, "rescue-wait")) * 3)   // 9, 10 or 11 ("about ten")
planDueAt        = min(impoundNode + waitNodes, lastQuietNodeBeforeClimax)
```

- **"Climax at the latest":** if the climax is scheduled before `impoundNode + waitNodes`, the plan is offered at the **last quiet node before the climax** (the node before the news report). Its dialogue uses the *climax-eve* version.
- **One plan covers all** currently impounded Pokémon. A later C1 within the same region joins the pending plan if it has not yet been offered; otherwise it starts a new timer.
- **Cancelled** if no Pokémon remain impounded (a rescue event, Raid 3 Triumph or an earlier plan returned them).
- **Offered at a quiet moment only:** at a rest node, a shop node, or the first node after a battle. Never during a Pseudo Stage, ambush, or while a rival scene is already running.
- **Which rival:** the run's primary rival (see `CLIMAX_RIVAL_INTEGRATION.md` §1.2). If rival mode is off, the stand-in is used.
- **Independent of the 60/30/10 roll.** The climax variant is rolled once and is never changed by the plan. The plan only changes the rival's *attitude* and the player's *memory log*. Under **Side-with**, the rival's offer is still sincere in this scene; its job is to be the thing the player later remembers (see §9).

### 2.1 Offers

| Offer | When | Notes |
| --- | --- | --- |
| **First offer** | `planDueAt` | Always made |
| **Second offer** | 5 nodes after a decline, or at the last quiet node before the climax (whichever is first) | Skipped if the first offer was accepted |
| **Late Plan** | After a Stay-out, at the first rest node of the next region | Success −0.10; guaranteed to be offered |
| **No third offer** | — | The climax victory returns everything still held; defeat ends the run |

## 3. Plans

The rival proposes all three plans, names the one it prefers, and the player chooses.

| Plan | Fiction | Mechanic | Costs | Typical risk |
| --- | --- | --- | --- | --- |
| **Quiet Extraction** | Slip in, grab them, slip out | `PS-RESCUE`: stealth micro-stage, 3 beats, 1–2 battles | Full: Heat +0. Partial/Fail: Heat +10 | Lower reward on bad rolls |
| **Loud Grab** | Break in the front door | `PS-RESCUE`: 3-battle gauntlet with Rival Assist (budget 3) | Heat +15 always. Full: team OS −1 | Rival may be hurt on failure |
| **The Deal** | Pay or trade them out | No battle: a negotiation scene with the rival present | Lose 40% of current money, or give up one held-item set; Intel −5. No roll | Needs funds; the team learns you can be bought |

**Preferred plan by archetype** (gives that plan +0.10 success from rapport):

| Archetype | Prefers |
| --- | --- |
| Hotshot | Loud Grab |
| Prodigy | Quiet Extraction |
| Friendly | Quiet Extraction |
| Bitter | Loud Grab |
| Scholar | Quiet Extraction |
| Heir | The Deal (the rival offers to pay; see §5) |
| Lone Wolf | Quiet Extraction |
| Mirror | Whichever approach the player has used most in raids (default Quiet) |

### 3.1 Success formula (Quiet and Loud)

```
p = clamp( base
         + 0.05 * rivalAttitude          // -5..+5
         + 0.03 * floor(Intel / 25)      // 0..4 tiers
         - 0.02 * max(0, OS - 10)
         + (planIsPreferred ? 0.10 : 0)
         + beatBonus                      // sum of 3 beat choices: +0.05 good, 0 neutral, -0.05 bad
         + raidBonus                      // +0.05 if any raid was Triumph; -0.05 if any raid was Failure
         - (latePlan ? 0.10 : 0),
         0.35, 0.95 )
base: Quiet = 0.70, Loud = 0.80
roll r = rng(hash(runSeed, regionId, "rescue-roll"))
r <= p                -> Full
r <= min(1, p + 0.15) -> Partial
else                  -> Fail
```

The player sees a **telegraphed readiness label** (Risky / Even / Likely / Safe), never the number. Each beat's good choice is hinted by the rival's line (see §6 "complication"). No hidden modifiers.

### 3.2 Results

| Result | Effect |
| --- | --- |
| **Full** | All impounded Pokémon return. Rival attitude +1. Memory `rescue-together` |
| **Partial** | About half return (at least one); the rest stay until a second offer or the climax victory. Rival attitude 0 |
| **Fail** | None return. Heat +10. Rival attitude by archetype (see §7). The second offer is still due |
| **The Deal** | All return. Money/items spent. No roll |

### 3.3 "Held too long"

If an offer is **declined twice** or the Pokémon are still impounded at the climax, they come back (on climax victory) with a **Veiled taint** (Corruption 10) when the holding team has a Shadow binding method. This ties into `SHADOW_POKEMON_SYSTEM.md`; because Shadow Pokémon are now permanent members, the player may keep them. It is a choice with a cost, not a trap.

## 4. `PS-RESCUE` (micro Pseudo Stage)

| Field | Value |
| --- | --- |
| id | `PS-RESCUE` |
| kind | `rescue` |
| insertAfter | the quiet node where the offer was accepted |
| pseudoRegion | the **annex** of the holding site (see §5), reusing an existing raid map so no new maps are needed |
| difficulty | previous stage tier +0 |
| beats | Approach → Door → Cage (3 beats; each carries one choice) |
| checkpoints | one, at the Door |
| exit | back to the quiet node; applies Result |
| scriptRef | this document, §6 (dialogue) |

No wipe ends the run. A wipe inside `PS-RESCUE` resolves as **Fail** and the party is returned to the quiet node at 1 HP (same rule as raids).

## 5. Where the Pokémon are held

| Team | Holding site | Annex PR (reuses) | Notes |
| --- | --- | --- | --- |
| Team Rocket | The Celadon basement cells | `pr.kanto.celadon-cells` | Numbered cages under the Game Corner |
| Team Rocket (Return) | The Mahogany back room | `pr.johto.mahogany-cells` | Pokémon kept near the transmitter |
| Team Aqua | The Slateport sub bay | `pr.hoenn.sub-bay-cells` | Tanks and net cages |
| Team Magma | The Mt. Chimney tunnels | `pr.hoenn.chimney-cells` | Heat-lamped pens |
| Team Galactic | The Eterna Building basement | `pr.sinnoh.eterna-cells` | Chain-linked cages |
| Team Plasma | The Plasma Frigate hold | `pr.unova.frigate-hold` | "Freed" Pokémon bound to the signal |
| Team Flare | The Lysandre Labs lower levels | `pr.kalos.lab-cells` | Sterile glass cages |
| Team Skull | The Po Town cellar | `pr.alola.po-cellar` | "Borrowed" Pokémon with a whistle tag |
| Aether Foundation | The Paradise conservation wing | `pr.alola.paradise-wing` | "Protected" Pokémon in glass habitats |
| Macro Cosmos | The Energy Plant holding floor | `pr.galar.plant-holding` | Pokémon kept in Dynamax chambers |
| Team Yell | The Spikemuth fan hall back room | `pr.galar.fan-hall-backroom` | Pokémon "held for the cheer" |
| Team Star | The Segin Base garage | `pr.paldea.segin-garage` | "Borrowed" Pokémon in Starmobile crates |
| Rocket Remnants | Their hideout in the host region (default: Route 9 depot, back lot) | the kit's hideout (`RETURNING_TEAMS_ANYWHERE.md` §5.1; default `pr.kanto.route9-depot`) | Rust-and-crate cages |
| Team Snag'em | Their hideout in the host region (default: the Unova shipyard) | the kit's hideout (`RETURNING_TEAMS_ANYWHERE.md` §5.2; default `pr.unova.shipyard`) | Shadow stock in dark cages |

**Heir special case:** the Heir's preferred plan is *The Deal*, and the rival pays. If the player accepts, the rival's Deal costs **the rival's** funds (the player pays nothing, Intel −5 still applies), and the rival's attitude +1. If the player insists on paying, the cost is 40% as normal.

## 6. Dialogue (all eight archetypes)

Tags: `{player}`, `{count}` (number impounded), `{mon}` (first impounded Pokémon's name), `{team}`, `{site}`. Every archetype has 14 lines: **approach, offer, three plan pitches, accept, decline, start, complication, full, partial, fail, second-offer, climax-eve.** Voices match `CLIMAX_RIVAL_INTEGRATION.md` §7.

### 6.1 Hotshot

| Stage | Line |
| --- | --- |
| approach | "{player}! Stop right there. I've got news, and it's about to make your day." |
| offer | "They took {count} of yours, right? I've been scouting {site}. I've got a plan. A great plan. The best one I've ever had." |
| pitch-quiet | "Option one: we sneak in. I know, I know, me, sneaking. I can do it for, like, ten minutes." |
| pitch-loud | "Option two: we walk in the front door, I announce us, and everybody in the way regrets it. That's my pick." |
| pitch-deal | "Option three: we pay them off. Boring. Fine. But it works." |
| accept | "That's the spirit! You and me. They won't know what hit them." |
| decline | "Wait, what? You're turning down a Hotshot-certified plan? …Fine. It'll keep. For a bit." |
| start | "Right. Stay behind me. No, beside me. Okay, slightly behind." |
| complication | "Okay, that guard wasn't on my map. Don't look at me like that. He wasn't!" |
| full | "Told you! Flawless! Every last one. Okay, mostly flawless." |
| partial | "Okay, so we got some. That's a lot, actually! We'll get the rest, I swear." |
| fail | "That wasn't supposed to happen. I'll make it right. I will. Give me a day." |
| second-offer | "I've been thinking about it. My plan's still good. Want to try again?" |
| climax-eve | "No more waiting. They've got your Pokémon and a big show planned. We hit {site} now, or never." |

### 6.2 Prodigy

| Stage | Line |
| --- | --- |
| approach | "I've been looking for you. We should speak, privately and quickly." |
| offer | "{count} of your Pokémon are held at {site}. I've mapped the guard rotations and the paperwork. I can get them out. The question is how." |
| pitch-quiet | "Plan A, extraction. Minimal contact, highest efficiency, and a roughly seventy per cent success rate if you follow instructions." |
| pitch-loud | "Plan B, assault. Higher variance, shorter duration. Not elegant. Effective." |
| pitch-deal | "Plan C, a transaction. Zero risk to the Pokémon, moderate cost to you. I'd prefer not to use it." |
| accept | "Good. Memorize the route. I'll lead; you improvise only when I say." |
| decline | "That is an unusual decision. I'll assume you have a reason. The offer stands." |
| start | "Stage one. Three minutes. Count them." |
| complication | "An unlisted patrol. Recalculating. Do not move." |
| full | "Every variable accounted for. Well, nearly. They're yours again." |
| partial | "A partial result. I will adjust the model. The remainder is recoverable." |
| fail | "My estimate was wrong. That doesn't happen often. I'm not enjoying it." |
| second-offer | "I've revised the plan. The odds are better. Will you hear it?" |
| climax-eve | "We are out of time. Whatever the plan, it begins now." |

### 6.3 Friendly

| Stage | Line |
| --- | --- |
| approach | "{player}! Oh, I'm so glad I found you. I've been worried sick. Are you okay?" |
| offer | "I know they took {mon} and the others. I couldn't stop thinking about it. Let's get them back. Together. I've got a plan, and snacks." |
| pitch-quiet | "We could sneak in, quiet as anything. I'll bring a lantern with a cover on it, and berries in case anyone's scared." |
| pitch-loud | "Or we fight our way in. I don't love it, but I'll be right beside you, healing as fast as I can." |
| pitch-deal | "Or we could pay. It's not brave, but nobody gets hurt. I'll chip in what I have." |
| accept | "Yes! Okay! We'll bring them home. I promise." |
| decline | "Oh. Okay. I understand. I'll be around if you change your mind. I'll always be around." |
| start | "Deep breath. We've got this. {mon} knows we're coming." |
| complication | "Oh no, there's someone there. Okay, okay, stay calm. I'll distract them. Sort of." |
| full | "They're safe! They're all safe! Look, {mon}'s so happy! I'm crying, sorry." |
| partial | "We got some of them! We'll get the others, don't give up. I won't." |
| fail | "I'm so sorry. I really thought it would work. We'll try again. I swear we will." |
| second-offer | "I haven't stopped thinking about it. Could we try again? Please?" |
| climax-eve | "We can't wait any longer. They're going to use them tonight. Let me help. Please." |

### 6.4 Bitter

| Stage | Line |
| --- | --- |
| approach | "Hey. Got a minute? Don't make it a thing." |
| offer | "They took {count} of yours. I know what that's like. I've got a way into {site}. Take it or don't." |
| pitch-quiet | "Quiet's the smart way. Slip in, grab them, slip out. If you can keep your mouth shut." |
| pitch-loud | "Loud's the satisfying way. We break the door, we break a few faces. They've earned it." |
| pitch-deal | "Or pay them. I hate that. But it's the one they can't refuse." |
| accept | "Fine. Don't slow me down." |
| decline | "Your call. I'll pretend I never asked." |
| start | "Stay close. And try not to say anything stupid." |
| complication | "Of course. Of course something went wrong. Move!" |
| full | "…Got them. All of them. Don't thank me. I mean it." |
| partial | "Some of them. Not enough. The rest are still in there, and I'm not leaving it like that." |
| fail | "It's my fault. Don't say otherwise. I'll fix it." |
| second-offer | "I haven't dropped it. Want a second shot?" |
| climax-eve | "No time left. Tonight they use them, or we do this now. Pick." |

### 6.5 Scholar

| Stage | Line |
| --- | --- |
| approach | "Ah, {player}. Good. I have a proposition, and the data support it." |
| offer | "Your {count} impounded Pokémon are at {site}. I've observed the place for nine days. I believe I can retrieve them." |
| pitch-quiet | "Method one: stealth. Fewer observed incidents, longer preparation. It's my preferred method." |
| pitch-loud | "Method two: direct action. Statistically messier, but faster." |
| pitch-deal | "Method three: negotiation. Only workable if you can pay. I can supply the argument." |
| accept | "Excellent. I'll brief you on the way. Take notes. I will." |
| decline | "Noted. An unexpected decision. I will record it and keep the offer open." |
| start | "Beginning observation. Please walk where I walk." |
| complication | "An anomaly. Interesting, and terribly inconvenient." |
| full | "Success. And a fascinating dataset. They're all yours." |
| partial | "A partial retrieval. The results are instructive. I propose a follow-up." |
| fail | "Failure. I underestimated a variable: them. Forgive the error." |
| second-offer | "I've refined the method. Would you like to review the revision?" |
| climax-eve | "The window closes tonight. I recommend we act, even imperfectly." |

### 6.6 Heir

| Stage | Line |
| --- | --- |
| approach | "{player}. A word, if you will permit me." |
| offer | "Your Pokémon were taken by {team}. That is a stain upon every trainer in this region. I should like to help remove it." |
| pitch-quiet | "I propose discretion. My family has taught me the use of quiet doors." |
| pitch-loud | "Or a formal assault. It will be noisy, but honourable." |
| pitch-deal | "Or I can see it settled by purse. I would prefer you not owe anyone for it. I will cover the cost." |
| accept | "Thank you. I will not forget the trust." |
| decline | "I understand. My offer remains; do not hesitate to call upon it." |
| start | "We proceed. Remain composed, and I shall do the same." |
| complication | "An unforeseen obstacle. I have faced worse at table. Stay close." |
| full | "It is done. Your Pokémon are returned. It was an honour." |
| partial | "We have recovered some. The rest remain; I will not rest until they are free." |
| fail | "I have failed you. That is not a thing I say lightly." |
| second-offer | "Once more, if you will permit. I have improved the arrangement." |
| climax-eve | "The hour is late. Let us act, or let this stand forever." |

### 6.7 Lone Wolf

| Stage | Line |
| --- | --- |
| approach | "…Hey." |
| offer | "Your Pokémon. {site}. I can get them." |
| pitch-quiet | "Quiet." |
| pitch-loud | "Loud." |
| pitch-deal | "Pay." |
| accept | "…Come." |
| decline | "…Fine." |
| start | "…Follow." |
| complication | "…Trouble." |
| full | "…Done. They're yours." |
| partial | "…Some. Not all." |
| fail | "…Missed." |
| second-offer | "…Again?" |
| climax-eve | "…Now. Or never." |

### 6.8 Mirror

*Mirror's pitch order follows the player's most-used approach in raids; the lines below are the default (Quiet-first).*

| Stage | Line |
| --- | --- |
| approach | "I was going to find you. Looks like you were going to find me." |
| offer | "They took {count} of yours. I'd have wanted someone to come for mine. So here I am." |
| pitch-quiet | "You'd go quiet. You always do. I'd do it your way." |
| pitch-loud | "Or loud, which is what I'd do if you hadn't gotten there first." |
| pitch-deal | "Or pay. Which is what neither of us wants, so it's probably right." |
| accept | "Good. Then we do this the way you'd do it." |
| decline | "I get it. I'd have said no too. Still here if you change your mind." |
| start | "Right foot first, same as you. Let's go." |
| complication | "That's not what you'd have planned for. Me neither." |
| full | "They're back. I did what you'd have done. Better, maybe? No. Same." |
| partial | "We got some. You'd say it's good enough for now. I'd say the same." |
| fail | "That isn't how it was supposed to go. For either of us." |
| second-offer | "I keep replaying it. Let's try again." |
| climax-eve | "There's no later left. Whatever you'd do, do it now." |

## 7. Reactions and attitude by archetype

| Archetype | Full | Partial | Fail | Declined once |
| --- | --- | --- | --- | --- |
| Hotshot | +1 (proud) | 0 | −0.5 (contempt for themself) | −0.5 (stung) |
| Prodigy | +1 | 0 | −0.5 (analysis) | 0 |
| Friendly | +1.5 | +0.5 | +0.5 (worry) | 0 |
| Bitter | +0.5 | 0 | −0.5 | −0.5 |
| Scholar | +1 | +0.5 | 0 | 0 |
| Heir | +1 | 0 | −0.5 (shame) | 0 |
| Lone Wolf | +1 | 0 | 0 | 0 |
| Mirror | +0.5 | 0 | 0 | 0 |

Attitude stays within −5…+5. These deltas apply once per plan.

## 8. Memory and Run Event Log

New memory kinds for the Rival Memory system: `rescue-together` (Full), `rescue-partial`, `rescue-failed`, `rescue-declined`. New log events: `impound.applied`, `rescue.offered`, `rescue.accepted`, `rescue.declined`, `rescue.result`, `impound.returned`.

## 9. Interaction with the climax variants

| Variant | Interaction |
| --- | --- |
| **Help (60%)** | The rescue plan strengthens the partnership. If the plan succeeded, the arrival line may reference it |
| **Beat-you (30%)** | The rival got to the climax first. A successful earlier plan adds a line: "I'm sorry I wasn't there. I owed you one." A failed plan makes the rescue state *Defiant* instead of *Shaken* |
| **Side-with (10%)** | The plan is **sincere**. Its foreshadowing value is a *tell* the player can notice afterwards: the rival's holding-site knowledge was unusually good ("I had a source"), and a successful Full result is worth +1 on the Turn formula (`raidBonus` term in `CLIMAX_RIVAL_INTEGRATION.md` §5.3) |

## 10. Edge cases

| Case | Rule |
| --- | --- |
| Player is in a Pseudo Stage when `planDueAt` arrives | Wait for the next quiet node |
| Rival is the Beat-you variant and is "captured" before the climax | Not possible: variants resolve at the climax, after the plan |
| All Pokémon returned by Raid 3 / rescue event first | Plan cancelled; no offer |
| Run has no money for The Deal | Deal is greyed out with the reason shown |
| Player accepts then quits the stage | The offer re-appears at the next quiet node (accepting counts as the first offer) |
| Multiple C1 events | One plan; Pokémon from the newest C1 join if the plan has not started |
| Impounded party member was the player's only Pokémon | Impossible by rule: Impound takes bench Pokémon first and never the last two party members |
| Climax lost | The run ends. Impounded Pokémon are never returned (Doom Ledger records `lost-with-impounded`) |

## 11. Tests

- `planDueAt` is always in `[impoundNode+9, impoundNode+11]` or the last quiet node before the climax, whichever is smaller.
- Every archetype has all 14 stages; no stage has an empty line.
- A seed gives the same wait and the same roll on replay.
- The readiness label never shows a number; no hidden modifier.
- Full / Partial / Fail each leave the party in a legal state (no Pokémon duplicated or lost).
- Climax victory returns anything still held, with taint only if §3.3 applies.
- The Deal never goes below zero money and is unavailable when it cannot be paid.
