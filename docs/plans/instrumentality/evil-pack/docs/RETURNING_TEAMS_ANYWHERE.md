# ROAMING TEAMS, IN ANY REGION

*Decision recorded: any region should work for a returning team (D3). After the canon rewrite every region already has its own canon evil team, so the two **roaming teams** (Rocket Remnants and Team Snag'em, script `00_ROAMING_CAST.md`) work as **second factions**, **side factions** or, optionally, as the region's **lead team**. This file defines the placement rules, the module that makes them work in any region, and the 18 per-region kits (9 regions × 2 teams).*

*Canon note: Jessie, James, Meowth, Butch, Cassidy and Domino are canon Team Rocket characters; Gonzap, Wakin, Biden and Agrev are canon Team Snag'em characters. Dialogue and scenes are original. Species lists are my recall (marked approximate) and should be checked before shipping.*

---

## 1. Rules

1. **Two roaming teams per run:** Rocket Remnants and Team Snag'em. They may be placed in the same region only in the optional `stress` mode.
2. **Any region can host either team.** Placement is data, not code.
3. **Three modes** (§2): `second` (default, a second faction under a cap), `side` (Snag'em only, a 1–2 node side-front in 50% of regions) and `lead` (opt-in: the roaming team replaces the region's own team and uses its own raids and climax adapter from script 00 §8).
4. **The recurring trio (Jessie, James, Meowth) appear in every region**, whichever mode is active (script 00 §7: one comic beat and one allied/wild beat). They are always Specialist (2) and never own a climax.
5. In `second` mode a roaming team never adds more than **+1 battle** to the climax and never moves OS by more than **±1**. `lead` mode is exempt from the cap but sets the run's difficulty band one step lower for that region (to stay within the existing win-rate bands).
6. Both teams in one region is allowed only in `stress` mode, with the cap in rule 5 applied to the pair together.
7. Canon leaders (Giovanni, Archer, Cipher) are never replaced: Giovanni and Archer appear only as cameos in script 00, and Cipher is never on screen.

## 2. Placement modes

| Mode | Behaviour | Default |
| --- | --- | --- |
| `default` | Rocket Remnants in Kanto, Team Snag'em in Unova (`second` mode) | **Yes** |
| `seeded` | The profile seed picks two distinct regions and assigns the teams: `rng(hash(profileSeed, "roaming-placement"))` | No |
| `chosen` | The player picks both regions and the pairing in the run setup screen | No |
| `stress` | Both teams in one region (rule 6) | No |
| `lead` | Opt-in per region: the roaming team replaces the region's own team (uses script 00 §8) | No |

Snag'em's **side-faction** slot (script 00 §8.3) is rolled separately: `rng(hash(runSeed, regionId, "snagem-side")) < 0.5`. It never stacks with `second` mode in the same region.

Placement is fixed for a run and written to the Run Event Log (`roaming.placed`).

## 3. The Roaming Team Module (RTM)

One module, four beats. It works in every region because it never depends on the region's own story, only on the kit's one-line hooks.

| Beat | When | What happens |
| --- | --- | --- |
| **R1 Sighting** | Act 0 (rumors) | A rumor line mentions a balloon, a talking cat, or a dark-jacketed thief with a machine on his arm |
| **R2 Collision** | Ignition + 3 nodes | The roaming team clashes with the primary team or with the player. This is the scene where the stance (§4) becomes visible |
| **R3 Cache** *(optional)* | After Raid 1 | A small `PS-RAID` of one area and one objective at the kit's hideout. Triumph removes one Pokémon from the climax cameo; Failure adds Heat +10, nothing else |
| **R4 Cameo** | Climax | The acting leader appears in the climax, shaped by the stance (§4). It is always one duel with the acting leader (a **Phase 2.5** duel) |

The roaming team has its own **Heat sub-meter** (start 10; ambush rate ×0.5; ambusher tier capped at Commander). Its ambush lines come from the kit and from `data/ambush_lines.json`.

## 4. Stances

A kit picks one stance. The stance sets the relation to the primary team (it overrides the starting value in `faction_relations.json` for this run) and the cameo's modifier.

| Stance | Relation to primary team | Cameo modifier |
| --- | --- | --- |
| **Opportunist** | −40 | Wants one *prize* the primary team holds. If the player skips or loses the Phase 2.5 duel, the prize is stolen: one named reward is lost and the region gains the `occupied` modifier on one node |
| **Parasite** | −60 | Feeds on the primary team. Adds one extra *guarded point* to the Phase 3 objective (an Anchor, Relay, Pylon or Lantern). If it is not secured, the Phase 3 timer loses 2 turns |
| **Convenience ally** | +20 | Fights beside the primary team: +1 battle in Phase 1. At the Leader's boss phase it **betrays** the primary Leader: the Leader's Doctrine is suppressed for 2 turns |

## 5. Kits

Columns: where the team hides (the `pr.` id is a one-area hideout for R3), the stance, the cameo, the acting leader's cameo line, and one ambush intro and defeat line for the team's Grunts in this region. The acting leader for Rocket Remnants is **Butch and Cassidy** (Domino appears as a Phase 2.5 cameo when the stance is Opportunist); for Snag'em it is **Gonzap**, with Wakin as the Phase 2.5 duel.

### 5.1 Rocket Remnants (acting leaders: Butch and Cassidy)

| Region | Why they are here | Hideout | Stance | Cameo | Cameo line | Ambush intro | Ambush defeat |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kanto | Home ground; the trio are still low-ranking Rockets who never got the memo | `pr.kanto.route9-depot` | Convenience ally | Lend Grunts to Giovanni, then trip the Silph alarm | "We're helping! Why does that sound suspicious?" | "We're the real deal! Look at the pin!" | "That's not how it went in the brochure." |
| Johto | The Radio Tower is where the new orders are supposed to come from | `pr.johto.static-shack` | Parasite | Tap the Tower's broadcast to sell the feed | "Radio's the new gold, and we hold the antenna." | "Archer said wait. We got bored." | "We waited all that time for this?" |
| Hoenn | Aqua's sub and Magma's drill are both full of salvage | `pr.hoenn.salvage-yard` | Opportunist | Steal the Orb crate from whichever team loses | "Two teams fighting is just a sale with extra steps." | "Wet, rusty, and still ahead of you!" | "I'm going to need new shoes." |
| Sinnoh | Galactic's uniforms are easy to borrow | `pr.sinnoh.lake-cabin` | Opportunist | Steal a Red Chain fragment from the Pillar | "A fragment of the universe. Mine now." | "Silver is our color this week!" | "The costume was too tight, anyway." |
| Unova | Plasma's crowd is a good place to blend in | `pr.unova.market-roof` | Parasite | Sell fake Pokémon-freedom flyers | "Freedom, ten dollars. Bring a friend." | "We're part of the movement! The movement of cash!" | "Even the movement wants a refund." |
| Kalos | Flare's lab smells like money and bad sunglasses | `pr.kalos.cafe-cellar` | Opportunist | Steal a Mega Ring prototype | "Beauty is overrated. Shiny is not." | "Your style is… not our style. Fight!" | "My hair was perfect when I started." |
| Alola | Skull's loud, Aether's quiet, both are targets | `pr.alola.beach-hut` | Convenience ally | Disguise as Skull Grunts and wreck their boombox | "Yo! We're totally Skull! Obviously!" | "Yo, yo! Nobody knows we're not Skull!" | "Okay, the bandana was a mistake." |
| Galar | Macro Cosmos pays well and checks nothing | `pr.galar.stadium-garage` | Parasite | Sell tickets to the Rose Tower tour | "Tour's twelve dollars. Disasters extra." | "The Chairman can't see us. That's the plan!" | "That plan had a lot of holes." |
| Paldea | Team Star's Starmobiles are easy to hot-wire | `pr.paldea.mesagoza-alley` | Opportunist | Hot-wire a Starmobile and drive it into the fountain | "Nice wheels, kid. Thanks for the lift." | "We're borrowing this! Forever!" | "We're, uh, returning it. Slowly." |

### 5.2 Team Snag'em (acting leader: Gonzap)

| Region | Why they are here | Hideout | Stance | Cameo | Cameo line | Ambush intro | Ambush defeat |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kanto | Rocket's stolen Pokémon are good Shadow stock | `pr.kanto.pier-warehouse` | Opportunist | Buy Rocket's Game Corner prizes at a discount, then take the rest | "Nothing personal. Everybody's for sale." | "Good Pokémon. Handing them over is easy." | "We'll be back with more machine." |
| Johto | The Radio Tower can broadcast a Snag signal | `pr.johto.kiln-yard` | Parasite | Piggy-back on the Tower's signal to snag by radio | "Your signal. My machine. Same result." | "Nice Pokémon. Mine now." | "The machine glitched. Hold on." |
| Hoenn | Aqua and Magma both keep rare Pokémon in cages | `pr.hoenn.dock-annex` | Opportunist | Snag the Orb guardians | "Rare Pokémon, no owner. I'll take them." | "Don't worry. You'll never feel it." | "That didn't hurt. I'll do it again." |
| Sinnoh | The Red Chain holds Pokémon the Machine can reuse | `pr.sinnoh.cold-warehouse` | Parasite | Tap the Chain's power to boost the Machine | "Nice chain. Power's a loan." | "It's cold. We're not." | "I'm freezing. This isn't worth it." |
| Unova | Plasma's "freed" Pokémon are an easy mark | `pr.unova.shipyard` | Convenience ally | Shares Shadow technology with Colress | "Liberation, conversion. Same tools." | "Plasma's friends are friends of ours!" | "Okay, we're not friends." |
| Kalos | Flare's weapon draws life-force the Machine can bottle | `pr.kalos.outskirts-garage` | Opportunist | Steal a core for the Machine | "Life-force is life-force. Mine." | "Pretty city. Pretty target." | "That was pretty… expensive." |
| Alola | Aether's Paradise holds more rare Pokémon than anyone | `pr.alola.derelict-pier` | Parasite | Snag the Paradise's guardians | "Conservation? We call it inventory." | "Guzma's loud. We're quiet." | "Not so quiet now." |
| Galar | Dynamaxed Pokémon are valuable prizes | `pr.galar.wild-lot` | Opportunist | Try to Snag a Gigantamax Pokémon | "Big Pokémon. Big payday." | "Wild Pokémon, wild payday!" | "That one was too big." |
| Paldea | Terastal Pokémon are a new kind of stock | `pr.paldea.canyon-camp` | Convenience ally | Offer Team Star "borrowing" tech | "Borrowing, snagging. Same trade." | "Kids' Pokémon? Even easier." | "Okay, kids' Pokémon are tougher than they look." |

## 6. Interactions with other systems

| System | Rule |
| --- | --- |
| Stand With Them | The roaming teams never unlock the allied climax. The trio can decorate it (script 10 intro: Allied Strength +1, once per run) |
| Shadow Pokémon | Rocket Remnants use **Gadget Snare** (nets, balloons, pit traps; no permanent Shadow). Snag'em uses **Snag Machine** (a real Shadow Pokémon, D5) |
| Rival Rescue Plan | The trio can serve as a rescue shortcut if reputation ≥ +15 (script 00 §9) |
| Doom Ledger | `rocket-remnants.ended` and `snagem.ended` are written only when the team was placed in `lead` mode or a side-front failed |
| Region of Doom | Both roaming teams are always present in the Doom district for their seed (Region of Doom §3) |

## 7. Climax adapters (`lead` mode only)

- **Rocket Remnants: "Departure Lounge."** A stolen airship carrying a rare Pokémon heads to open sea. Phase 1 gauntlet on the dock (Remnant Grunts, Butch and Cassidy), Phase 2 duel Domino, Phase 3 set piece *Hot-air chase* (stop the airship in 6 turns), Phase 4 the trio as a comic bookend (Specialist-tier team, with Meowth's gadgets as a boss phase). Resolution choices: return the Pokémon / let the trio fly / hand the airship to the authorities.
- **Team Snag'em: "Pyrite Dawn."** Gonzap and the full syndicate stage a mass conversion at a plaza. Phase 1 gauntlet of Shadow Pokémon trainers, Phase 2 duels Biden / Agrev / Wakin, Phase 3 set piece *Snag Machine array* (destroy 3 emitters), Phase 4 Gonzap, with Cipher implied. Resolution choices: purify the stock / seal the plant / hand the Machine to the League.

## 8. Telemetry

`roaming.placed`, `roaming.mode`, `roaming.sideFront.resolved`, `roaming.trio.beat` (slot, id), `roaming.cameo.duel`. All are written to the Run Event Log and are read by the Doom Ledger only for `lead` mode.
