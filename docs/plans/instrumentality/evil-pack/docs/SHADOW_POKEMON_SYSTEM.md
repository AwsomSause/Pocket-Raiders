# SHADOW POKÉMON SYSTEM — Beta 0.6 Rework

*Companion to `BETA_06_DESIGN_DOCUMENT.md` (§12). All names, moves and mechanics here are original to this project. Values are launch defaults for tuning, not tested balance.*

---

## 1. Design goals

1. A Shadow Pokémon is a **story state with mechanical weight**, not a stat penalty. Each one is a choice: use the power now, or spend effort to free it.
2. Every Shadow state is **readable**: a status icon, an aura color, and a named behavior. No hidden cheating by the AI.
3. Purification is **never a dead end** and never required to finish a run.
4. Each evil team binds Pokémon in its own way (the team's *Shadow method*), so Shadow encounters feel like the team's story, not a generic debuff.
5. Shadow Pokémon connect to Beta 0.5 systems (Team Chemistry, Rival Memory, Growth Paths) without breaking them.

## 2. Core model

A Pokémon has an optional `shadow` record:

```
shadow: {
  corruption: 0..100,        // how bound it is
  tier: 0..4,                // derived from corruption
  method: "ledger" | "choir" | "tempest" | "cairn" | "vantage" | "maison" | "wave" | "fixer" | "lacuna" | "rocket" | "galactic",   // see §6 for names
  boundBy: factionId,
  mentorId?: pokemonId,      // optional; see §7
  origin: "wild" | "stolen" | "released" | "gifted",
  heartScars: string[],      // permanent after purification
  openedAt: nodeIndex
}
```

### 2.1 Corruption and tiers

| Tier | Name | Corruption | Behavior | Power |
| --- | --- | --- | --- | --- |
| 0 | Clear | 0 | Normal | — |
| 1 | Veiled | 1–25 | Obeys; occasional hesitation | +5% damage |
| 2 | Bound | 26–50 | Obeys most of the time; a **Surge** meter fills | +10% damage |
| 3 | Gripped | 51–75 | May ignore commands; Shadow moves unlock | +15% damage, −10% accuracy on non-Shadow moves |
| 4 | Fallen | 76–100 | Acts on its own 25% of turns (announced); strongest Shadow moves | +20% damage, −15% defenses |

Corruption never exceeds 100. **A Fallen Pokémon is never lost**; it can always be freed.

### 2.2 Surge meter (tiers 2–4)

A Surge meter (0–100) fills 8 per turn the Pokémon is on the field and +10 when it is hit by a super-effective move. At 100 it **Surges** (announced): it uses a Shadow move of its choosing this turn, and the meter resets to 20. The player may **Hold** (spend an action) to pause the meter for 2 turns. Hold is limited to once per battle per Pokémon.

### 2.3 Obedience rule (fairness)

When a Tier 3 or 4 Shadow Pokémon would disobey, the game **shows the check** before the turn resolves: "The shadow tightens." The player sees which move is replaced. No move is replaced silently.

## 3. Shadow moves (14)

Shadow moves are original; each has a name, a type (typeless "Shadow" type for damage calculation uses the Pokémon's best-matching type), power, side effect, and **cost** (a Corruption increase or a Heart penalty).

| # | Move | Power | Effect | Cost |
| --- | --- | --- | --- | --- |
| 1 | **Umbral Rush** | 80 | Priority +1 if user is faster | +3 corruption |
| 2 | **Hollow Tide** | 90 | Hits all adjacent foes; user loses 10% max HP | +4 |
| 3 | **Dusk Brand** | 70 | Marks the target: next hit on it +30% | +2 |
| 4 | **Siphon Lull** | 60 | Drains 50%; target sleepy (50% to miss next turn) | +3 |
| 5 | **Gloam Crash** | 100 | −1 user Defense | +4 |
| 6 | **Ember of Grief** | 75 | Burns; 30% flinch | +3 |
| 7 | **Chain Hymn** | 65 | Lowers target Speed −2; blocks switching 2 turns | +3 |
| 8 | **Null Pulse** | 85 | Ignores abilities for 2 turns | +4 |
| 9 | **Weeping Maw** | 95 | Hits harder when user is below 50% HP (up to 120) | +5 |
| 10 | **Cinder Ward** | — | Shields user for 1 hit; reflects 25% | +2 |
| 11 | **Pale Echo** | 70 | Copies the target's last move at 70% power | +3 |
| 12 | **Rift Step** | — | Swap with ally and heal both 12% | +2 |
| 13 | **Last Lamp** | 120 | Only usable at ≤25% HP; user faints if it fails to KO | +6 |
| 14 | **Heart Eclipse** | 110 | Next turn the user can't act | +5 |

Moves 1–7 unlock at Tier 2; 8–12 at Tier 3; 13–14 at Tier 4.

## 4. Shadow abilities (20)

A Shadow Pokémon replaces its ability with one of these (chosen by `method`, see §6) until purified. After purification the original ability returns and the Shadow ability may be kept as an **Echo** (one per run).

| # | Ability | Effect |
| --- | --- | --- |
| 1 | **Grim Resolve** | Survives one KO hit at 1 HP once per battle |
| 2 | **Shroud** | Evasion +1 when HP > 75% |
| 3 | **Overbound** | Shadow moves cost half the Corruption increase |
| 4 | **Lurker** | First attack each battle +25% |
| 5 | **Dread Aura** | Foes' accuracy −5% |
| 6 | **Hollow Hide** | −10% damage from super-effective hits |
| 7 | **Debt Collector** | Heals 6% max HP when it KOs a foe |
| 8 | **Choir Hum** | Allies' Special Defense +10% |
| 9 | **Squall Mantle** | Water/Flying moves +10% |
| 10 | **Frost Oath** | Ice/Rock moves +10%; weather immune |
| 11 | **Contract Clause** | Cannot be forced out by the opponent; cannot be healed by items |
| 12 | **Spotlight Sap** | When a foe boosts, boost the same stat by +1 once |
| 13 | **Tailored Edge** | Slashing/Dark moves +10% |
| 14 | **Salt Chain** | Foes' Speed −1 on entry |
| 15 | **Odds Shaver** | Moves with secondary effect: effect chance ×1.5 |
| 16 | **Relic Ward** | Takes 25% less from moves of types the user is *weak* to the first time per battle |
| 17 | **Lantern Heart** | Cures its own status at end of turn (30%) |
| 18 | **Black Ledger** | Foes' stat boosts reduced by 1 stage on entry |
| 19 | **Echo of Another** | Copies one random ally ability for the battle |
| 20 | **Unbound Spark** | At Tier 4: acts first in priority bracket 25% of turns |

## 5. Purification methods (7)

Each method is available in set contexts; the player chooses at a **Purification Site**, a rest node variant, or in the overworld menu when conditions are met.

| # | Method | How it works | Cost / limits |
| --- | --- | --- | --- |
| 1 | **Heart Bond** | Corruption −5 per battle the Pokémon participates in without fainting; −10 if it lands the finishing blow | Needs Tier ≤3; the Pokémon must have Bond ≥ Friendly |
| 2 | **Calming Rite** | A rest-node ritual: spend 1 Herb/Charm to drop Corruption −20 | Once per rest node; scales with Chemistry (+5 per chemistry partner on the team) |
| 3 | **Rival's Word** | If the Pokémon belongs to a team the rival once opposed, the rival can speak to it (rival memory required) | Drops Corruption −25 once; changes rival Attitude +1 |
| 4 | **Mentor Bind** | Link to a Clear Pokémon (the Mentor); each turn together, Corruption −2 for the Shadow, +1 Fatigue for the Mentor | Mentor's Bond ≥ 3; max 1 Mentor per Shadow (see §7) |
| 5 | **Site Cleansing** | Visit a hidden Purification Site (one per region, found via Intel or Sightings) | Costs a node; drops Corruption by 40–100 depending on the site's condition |
| 6 | **Team Reversal** | Defeat the team's lieutenant/commander who bound it; the binding weakens | −30 Corruption; not available if the binder is a Leader whose Doctrine is active |
| 7 | **Choose to Release** | Release the Pokémon into the wild; it is **not** lost: it returns as a rare wild encounter in the same region with the Shadow cleared and 50% chance to join if the player is kind | Costs the Pokémon from the party; may become an ally later |

**Heart Scars:** After purification a Pokémon gains a **Heart Scar** (cosmetic + a minor, positive trait): e.g., *Steadfast* (+3% defense), *Wary* (+3% evasion), *Soft-hearted* (healing items +10%). A Pokémon can hold up to 2 Heart Scars.

## 6. Team-specific Shadow methods

Each team's method defines its **Shadow ability pool**, its **binding scene**, and its **unique purification boost**.

| Team | Method | Ability pool | Binding scene | Unique purification boost |
| --- | --- | --- | --- | --- |
| Team Rocket (Kanto) | **Capture Rig** | Grim Resolve, Dread Aura, Lurker | A Rocket-built harness overrides the bond with a radio pulse | Defeat the technician: −30 |
| Team Rocket Return (Johto) | **Radio Wave Lock** | Choir Hum, Overbound, Lurker | The Tower's signal pulses a Pokémon into a single instinct | Cut the broadcast: −35 |
| Team Aqua (Hoenn) | **Orb Resonance** | Squall Mantle, Salt Chain, Dread Aura | The Blue Orb binds sea Pokémon to the tide | Clear-sky weather = −20 extra |
| Team Magma (Hoenn) | **Orb Resonance** | Frost Oath, Hollow Hide, Dread Aura | The Red Orb binds land Pokémon to the heat | Seal the vent = −25 |
| Team Galactic (Sinnoh) | **Red Chain Lock** | Dread Aura, Echo of Another, Black Ledger | A Galactic-engineered chain bends the will to a single hand | Cut the tether: −35 |
| Team Plasma (Unova) | **Liberation Lock** | Spotlight Sap, Overbound, Contract Clause | A "freed" Pokémon is bound to the Frigate's signal | Break the Relay = −40 |
| Team Flare (Kalos) | **Life-Force Siphon** | Tailored Edge, Hollow Hide, Lurker | The weapon's current bleeds a Pokémon's will into the machine | Open the conduits = −35 |
| Team Skull (Alola) | **Stolen Bond** | Debt Collector, Dread Aura, Odds Shaver | A "borrowed" Pokémon is bound by the taker's whistle | Return it to its owner = −30 |
| Aether Foundation (Alola) | **Conservation Hold** | Relic Ward, Lantern Heart, Shroud | The lab seals a Pokémon's will for "protection" | Free it from the Paradise = −35 |
| Macro Cosmos (Galar) | **Dynamax Overload** | Squall Mantle, Contract Clause, Overbound | The Plant's pulse binds a Pokémon in a permanent Dynamax state | Cut the pulse = −40 |
| Team Yell (Galar) | **Cheer Chant** | Choir Hum, Lantern Heart, Shroud | A crowd chant rattles a Pokémon into battle, no binding at all | Calm the crowd = −15 |
| Team Star (Paldea) | **Star Barrage Link** | Unbound Spark, Relic Ward, Echo of Another | A Terastal charge forced through the Bases' Starmobiles | Ground the Starmobile = −30 |
| Rocket Remnants (any) | **Gadget Snare** | Grim Resolve, Lurker, Salt Chain | Nets, balloons and pit traps; no permanent Shadow | Defeat the technician: −30 |
| Team Snag'em (any) | **Snag Machine** | Dread Aura, Black Ledger, Overbound | An arm-mounted Machine takes a Pokémon mid-battle and makes it a Shadow Pokémon | Destroy the Machine: −40 |

> *Naming note:* the method names match the "Shadow method" line in each team's script profile (`scripts/`); the verifier checks it. The method names are original to this project; the teams and leaders are canon, and the scenes are original.

## 7. Mentor mechanic

- A **Mentor** is a Clear party member linked to one Shadow Pokémon (Mentor Bind).
- While linked, if both are on the field the Shadow's Corruption drops by 2 per turn; if the Mentor faints, the link breaks and the Shadow gains +10 Corruption.
- Mentor candidates: any Clear Pokémon with Bond ≥ 3. Chemistry combos (Beta 0.5) that include both Pokémon **double** the per-turn drop.
- A Mentor can carry one linked Shadow at a time; the Shadow may be re-linked at rest nodes.

## 8. Variants

| Variant | Description |
| --- | --- |
| **Wild Shadow** | Rare wild encounter in or near a team's active territory (see Region of Doom) |
| **Stolen Shadow** | A party Pokémon taken during Raid failure (C1/C3/C6); returns Shadowed if not recovered by climax |
| **Gifted Shadow** | A "gift" from a team Inside Man contact; tempting and risky |
| **Rival's Shadow** | In the Side-with rival variant (10%), the rival may field a Shadowed Pokémon; purification is part of the Turn resolution |
| **Legendary Shadow** | Boss only: cannot be captured, cannot be Mentor-bound; purified only through the story choice |

## 9. Beta 0.5 links

- **Team Chemistry:** chemistry partners add +5 to Calming Rite and double Mentor Bind. A Shadow Pokémon's chemistry bonuses are **suspended** at Tier 3+ and restored at Tier ≤2.
- **Rival Memory:** a new memory kind `shadow-freed` is written when the rival helps with purification; it grants +1 attitude and an archetype-specific line.
- **Growth Paths:** Heart Scars are an optional growth-path unlock (Cleansed Path) for any Pokémon that held a Shadow.
- **Run Event Log:** logs `shadow.bound`, `shadow.surge`, `shadow.disobey`, `shadow.purified`, `shadow.released`.

## 10. Fairness and tuning rules

1. Shadow bonuses never exceed +20% damage. Power is paid for by risk (disobedience, defenses).
2. A Shadow Pokémon is never forced on the player without a scene; Stolen Shadows are the exception, and those always have a recovery route.
3. Shadow rates in wild encounters: ≤5% in active territory, 0% elsewhere.
4. A run can be won with zero Shadow use; no mandatory Shadow content. Keeping Shadow Pokémon is a choice (§12), never a requirement.
5. Purification progress persists across nodes and is displayed on the party screen as a ring.

## 11. Test checklist

- Tier boundaries compute correctly for corruption 0, 1, 25, 26, 50, 51, 75, 76, 100.
- Surge meter resets to 20 after surging; Hold works once per battle.
- Every disobedience check shows its notice before resolution.
- All seven purification methods are reachable in a normal run (one test per method).
- Mentor link breaks when the Mentor faints; +10 Corruption applied once.
- Heart Scar cap is 2; a third is refused with a message.
- Released Shadow becomes a wild encounter in the same region (no loss).
- Legendary Shadow cannot be captured or Mentor-bound.

## 12. Permanent party members (confirmed)

Shadow Pokémon are not only raid rewards. A Shadow Pokémon can be a **permanent member of the party for the whole run**, at any tier.

1. **Never forced out, never forced to purify.** No node, region or story beat removes a kept Shadow Pokémon (the Impound consequence applies to all Pokémon equally).
2. **How they join.**

| Source | Notes |
| --- | --- |
| Wild Shadow capture | Rare, in or near an active team's territory (§10 rule 3) |
| Custody | After beating the Handler or officer who bound it: *Take custody* or *Free it* |
| Gifted | From an Inside Man contact; tempting and tracked (rule 6) |
| Returned from Impound | Veiled taint if held too long (`RIVAL_RESCUE_PLAN.md` §3.3) |
| Rival's Shadow | After a successful Turn in the Side-with variant |
| Rejoin | A released Shadow Pokémon (method 7) may return as a wild encounter and be caught again |

3. **Shadow slots.** At most **two Gripped or Fallen (Tier 3–4)** Pokémon in the active party of six. More can be stored; stored Pokémon change nothing.
4. **Stabilize ("Embrace").** At a rest node, a Pokémon with Bond ≥ 4 can be **Stabilized** (spend 1 Herb or Charm). While stable: Corruption is frozen, a Tier 3 Pokémon never disobeys, a Tier 4 Pokémon disobeys on 10% of turns (instead of 25%), and the Surge meter fills 6 per turn (instead of 8). The cost: the purification ring is hidden, no Heart Scar can be earned, and its Shadow ability and moves stay. The player can **Unstabilize** at any rest node.
5. **Chemistry.** A stable Pokémon keeps its Team Chemistry bonuses (they are suspended only while it is unstable at Tier 3+).
6. **The binder wants it back.** Keeping a Pokémon bound by an awake team adds **Heat +2 once per region** for that team. The party screen tooltip shows it. This is the cost of keeping stolen power.
7. **Power stays capped.** The +20% damage cap and the +30% global stacking cap still apply.
8. **End of run.** The Pokémon is recorded in the Hall of Fame with a *Shadow Kept* mark. Corruption does not carry into the next run.

### 12.1 Tests

- The party refuses a third Tier 3–4 member in the active six with a clear message.
- A stable Tier 4 Pokémon disobeys on 10% ± 1% of turns over 10,000 simulated turns; an unstable one on 25% ± 1%.
- Unstabilizing restores the purification ring at the stored Corruption value.
- Heat +2 applies once per region and is shown in the tooltip.
- A run that keeps a Fallen Pokémon from the start to the climax breaks no battle rule.
