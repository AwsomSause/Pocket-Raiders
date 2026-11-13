# BALANCE AND SYSTEMS

**Builds on:** every non-rival line in `Stuff.md` and `Stuff_2.md`, and the "Encounters by species" graph you attached for the line marked (ANC).
**What this is:** each of those one-line notes turned into a rule with numbers, a reason, and a test. The rival lines are in `RIVAL_SYSTEM_OVERHAUL.md`; the blessings are in `LEGENDARY_BLESSINGS.md`.
*I do not have your current rates, so where a note says "rarer" or "more", this gives a target and a multiplier to apply to whatever the value is today. Nothing here has been playtested.*

---

## 1. What the graph says

I read three things off the image.

### 1.1 Wild encounters (top 20)

| Measure | Value |
| --- | --- |
| Most met | Wooper, 471 |
| Second | Snom, 447 |
| Third | Bramblin, 321 |
| Twentieth | Pidgey, 228 |
| Top divided by twentieth | 2.1 |
| Wooper and Snom together, as a share of the top 20 | 16% |

- **Two species sit far above the rest.** Wooper and Snom are about 40% above third place. After them the curve is fairly flat (321 down to 228).
- **The type mix disagrees with your rarity order.** Your order puts Ice 16th, Fairy 17th and Dragon 18th of 18. But Snom (Ice/Bug) is the second most common wild Pokémon, Applin (Grass/Dragon) is fourth, Noibat (Flying/Dragon) is tenth and Impidimp (Dark/Fairy) is seventeenth. Bramblin (Grass/Ghost) is third.
- **The cause, checked against your Pokédex file:** all twenty of these species are tagged `common`, including Snom, Applin, Noibat, Impidimp and Bramblin. So the type order is not reaching the encounter weights at all: a Common-tagged Dragon is as likely as a Common-tagged Bug. Of the 241 species tagged `common`, **58 have a rarer type in the bottom six of your order** (Steel, Ghost, Psychic, Ice, Fairy, Dragon), and 26 of those are Ice, Fairy or Dragon. Section 2 fixes this with one rule and one re-tagging pass.

### 1.2 Trainer Pokémon (top 20, Story Run cast excluded)

| Measure | Value |
| --- | --- |
| Most faced | Quaxly, 430 |
| Top four (Quaxly, Starly, Aron, Pawniard) | 1,445, which is 43% of the top 20 |
| Top six (adding Chimchar, Jangmo-o) | 57% of the top 20 |
| Seventh | Staravia, 136 |
| Twentieth | Snom, 87 |
| Top divided by twentieth | 4.9 |

- **This graph is far more lopsided than the wild one.** There is a cliff between sixth (230) and seventh (136).
- **Five of the top six are the same families as the Story Run cast's fixed teams** (Staravia, Monferno, Pawniard, Quaxwell and Jangmo-o on the third panel; only Aron is not). That suggests a small number of fixed early teams are being reused by ordinary trainers. I cannot confirm that from a graph; it is the first thing to check in the trainer data.
- **Starters are common on ordinary trainers:** Quaxly, Chimchar, Tepig, Oshawott and Snivy are all in the top 14.

### 1.3 Story Run cast

Small numbers (Staravia 7, Monferno 5). With Story Run disabled this panel goes away. What matters is that its teams stop leaking into the second panel.

---

## 2. Wild encounters: diversify and average out

### 2.1 The type order, as weights

Your order, most common first. A species' weight starts from its type.

| Rank | Type | Weight | | Rank | Type | Weight |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Bug | 100 | | 10 | Poison | 43 |
| 2 | Normal | 92 | | 11 | Dark | 38 |
| 3 | Flying | 85 | | 12 | Fire | 33 |
| 4 | Water | 78 | | 13 | Steel | 28 |
| 5 | Electric | 71 | | 14 | Ghost | 24 |
| 6 | Rock | 65 | | 15 | Psychic | 20 |
| 7 | Ground | 59 | | 16 | Ice | 16 |
| 8 | Fighting | 53 | | 17 | Fairy | 12 |
| 9 | Grass | 48 | | 18 | Dragon | 8 |

### 2.2 The rarer type governs

**A dual-type Pokémon uses the weight of its rarer type.**

| Species | Types | Pokédex tag today | Governing type now | Weight |
| --- | --- | --- | --- | --- |
| Snom | Ice / Bug | common | Ice | 16 |
| Applin | Grass / Dragon | common | Dragon | 8 |
| Noibat | Flying / Dragon | common | Dragon | 8 |
| Impidimp | Dark / Fairy | common | Fairy | 12 |
| Bramblin | Grass / Ghost | common | Ghost | 24 |
| Wooper | Water / Ground | common | Ground | 59 |
| Zubat | Poison / Flying | common | Poison | 43 |

This one rule moves five of the graph's top twenty down the list, and puts single-type Bug, Normal and Flying Pokémon at the top, which is what your order asks for.

**The re-tagging pass.** The weight handles how often a species comes up inside its tier. The tier tag should agree with it:

| Rarer type | Rule | Species affected |
| --- | --- | --- |
| Steel, Ghost, Psychic (ranks 13–15) | Cannot be tagged `common`; move to `uncommon` | 32 (Aron, Honedge, Gastly, Duskull, Baltoy, Abra and others) |
| Ice, Fairy, Dragon (ranks 16–18) | Cannot be tagged `common`; move to `rare` | 26 (Snom, Applin, Noibat, Ralts, Snorunt and others) |

That takes Common from 241 species to 183 and Uncommon from 114 to 146, which also evens out two tiers that are lopsided today. The full list is in `data/retag_candidates.json`. Several of these (Aron, Gastly, Duskull, Baltoy, Ralts, Applin, Noibat, Snom) are also on the trainer graph's top twenty, so the same pass should help there if trainer pools read the same tag.

### 2.3 Averaging out

Three dampeners, applied in order to a species' weight every time an encounter is rolled.

1. **Within a run:** each time a species is met, its weight is multiplied by 0.6 for the rest of the run.
2. **Across runs:** for each of the last five runs in which a species was met, its weight is multiplied by 0.9.
3. **Family:** meeting any member of an evolution line counts as meeting all of them for rule 1, at 0.8.

And one cap, checked in simulation, not at run time: **over 1,000 simulated runs, no species is met more than 1.5 times as often as the median species of its rarity tier.**

### 2.4 Targets for the wild graph

| Measure | Now | Target |
| --- | --- | --- |
| Top divided by twentieth | 2.1 | 1.4 or less |
| Share of the top 20 held by the top two | 16% | 11% or less |
| Dragon, Fairy or Ice species in the top 20 | 4 | 0 |
| Distinct species met in an average run | (measure) | +30% |

### 2.5 More early-game variety

- **Stage 1 pool:** at least 45 species eligible; each run samples 14 of them for that stage.
- **Stage 2 pool:** at least 60; sample 16.
- **No repeats in the first six wild encounters of a run.**
- **One "odd one" per early stage:** a single Uncommon slot drawn from the whole game's unevolved Pokémon of ranks 6 to 12 (Rock down to Fire), so that the first hour is not always birds and bugs.
- **Per-region flavour stays:** these rules change how often things appear, not which region they belong to.

### 2.6 "The first of the two types" rule

Your line: *"Each Region shouldn't have the first of the two types come up as the first in more than once per region."*

How I have read it: each stage has a pair of featured types, a first and a second. **Within one region, a type may be the *first* type of at most one stage.** It may still be the second type of other stages.

- Implementation: when a region is generated, first types are drawn from a bag without replacement; second types are drawn freely, but a stage's two types must differ.
- Test: in 10,000 generated regions, no type is the first type of two stages in the same region.

*If you meant dual-type species instead (a region should not offer two Pokémon whose first-listed type is the same in the same slot), the same bag does that job; tell me and I will rewrite this section.*

---

## 3. Trainer Pokémon: diversify and average out

| Rule | Detail |
| --- | --- |
| **No fixed early teams** | Every slot on an early trainer is a pool of at least 8 species, never a single species |
| **Starters are special** | Starter families appear only on rivals and named trainers. On an ordinary trainer, at most one, at a quarter of normal weight |
| **Story Run teams are retired** | The cast's fixed act teams are removed from every pool (see the rival spec) |
| **Trainer classes have themes, not lists** | A Bird Keeper draws from every eligible Flying-type for the stage, with the same dampeners as section 2.3 |
| **The rarer type governs** | As for wild Pokémon |
| **Per-run cap** | No species appears on more than two ordinary trainers per region |

**Targets for the trainer graph**

| Measure | Now | Target |
| --- | --- | --- |
| Top divided by twentieth | 4.9 | 2.0 or less |
| Share of the top 20 held by the top four | 43% | 28% or less |
| Any one species, as a share of all trainer Pokémon faced | (measure) | 3% or less |
| Starter-family Pokémon in the top 20 | 5 | 1 or fewer |

---

## 4. Rarity

### 4.1 Pokémon

| Tier | Target share of wild encounter rolls | Change from today |
| --- | --- | --- |
| Common | 62% | takes up the difference |
| Uncommon | 28% | unchanged |
| Rare | 8.5% | multiply today's rate by about 0.8 ("a little more rare") |
| Epic | 1.5% | multiply today's rate by about 0.35 ("way more rare") |

- **A naming note:** your Pokédex file tags species `common`, `uncommon`, `rare` and `veryRare`. I have taken "Epic" to be the `veryRare` tier. If Epic is something else in the game, the multipliers still apply to whichever tier you mean.
- **An Epic should be an event.** At 1.5%, a run of about 120 wild rolls sees one or two.
- **No pity timer for Epics.** A guarantee makes them feel scheduled. Blessings, events and the Hoopa ring are the ways to chase one.
- **Presentation:** an Epic encounter gets its own sting and a half-second pause before the Pokémon appears.

### 4.2 Starters

- **Unlocked on a new save:** the three starters the quiz offers (Quiz Three). Nothing else.
- **Every other starter is unlocked by doing something.** Once unlocked it is available at starter selection on later runs.

| Method | Unlocks |
| --- | --- |
| The Hidden Village: be chosen by its starter | That Grass starter |
| Cold Night's Rain: reach Flame 5 | The Fire starter that was on the rock |
| Squirtle Squad: recruit a Leader | Squirtle |
| Win a run | One starter of the player's choice from the type their team used most |
| Beat a rival who led with a starter, three times in one run | That starter |
| Hatch it from an egg (Day-Care Village, The Egg That Listened) | That starter |
| Complete a region without a starter-type advantage at any Gym | A random locked starter |
| Finish a Whole Run Event | A starter tied to that story |
| Reach Communion | A starter tied to that Legendary's home region |
| Fill a Reliquary row (all blessings of one tier seen) | A random locked starter |

The starter screen shows locked starters as silhouettes with a one-line hint.

### 4.3 Fossils

**Plum, Root and Spark fossils are Common.** Each is 20% of fossil rolls; every other fossil shares the remaining 40%. They may also appear as ordinary ground finds in cave and desert stages.

### 4.4 Items

| Tier | Share of item rolls | What lives here |
| --- | --- | --- |
| Common | 55% | Balls, status cures for use outside battle, basic Berries, money items |
| Uncommon | 28% | Type-boosting held items, evolution stones, common TMs, the three common fossils |
| Rare | 13% | Strong held items (Choice items, Focus Sash, Leftovers, Eviolite), good TMs, Ability Capsules |
| Epic | 3.5% | Mega Stones, Z-Crystals, tutors for one move, rare fossils |
| Unique | 0.5% | One per run at most: the Network Machine, a second Blessing sign, a Master Ball |

Three rebalancing rules:

1. **A tier is about how much a thing changes a run, not what it costs.** Leftovers is Rare because it changes how a Pokémon plays; a Nugget is Common however much it sells for.
2. **No item drops below the stage it becomes useful in.** No Mega Stone before the player could own the Pokémon.
3. **Shops carry at most one Rare and never an Epic,** except shops an event has unlocked.

---

## 5. Healing and revival

**Your rule: no healing items are used in battle.** For everyone: the player, trainers, Gym Leaders, rivals, bosses.

| Thing | Rule |
| --- | --- |
| Potions and the like | Usable only outside battle |
| Status cures | Usable only outside battle |
| Revival items | Usable only outside battle. Carry limit 2. Shops stock one per region. As a find, Rare tier |
| Held Berries and Leftovers | Still work. They are held items that trigger on their own, which is a team-building choice and not an item used in battle. *If you want these gone too, it is one flag.* |
| Healing moves and abilities | Unchanged |
| Rest nodes | Full heal, as now |

What this does to the game, and what has to move with it:

- **Battles become about the six Pokémon the player walked in with.** That is the point. It also means a bad matchup can no longer be bought out of, so the anti-sweep rules in section 8 matter more.
- **Trainers lose their Full Restores too,** which makes them easier unless their teams and AI improve. Section 9 does that.
- **Out-of-battle healing must stay generous enough** that a player is not punished for fighting more trainers (section 7): one free partial heal (30%) is given after every trainer battle that was won without a faint.

---

## 6. Heated-moment moves

*"Gaining special moves in heated moment appears too often."*

| Setting | Target |
| --- | --- |
| Chance when every condition is met | 6% |
| Per region | At most 1 |
| Per run | At most 3 |
| Where it can happen | Rival, Gym Leader, boss, climax and Champion battles only. Never against ordinary trainers or wild Pokémon |
| Conditions (all) | The Pokémon is the player's last standing or under 25% HP; its Bond is High or better; it has been in the party for at least one full stage |
| Never | Twice for the same Pokémon in a run |

When it happens it should stop the battle for a moment: the music drops out, the Pokémon looks back at the player, and the move's name appears before the player picks it.

---

## 7. More fights per run

| Per stage | Now | Target |
| --- | --- | --- |
| Ordinary trainer battles | (measure) | 4 to 5 |
| Of which avoidable | — | 1 or 2, on side paths, with a better reward than the main path |
| "Ace" trainers (full kit, AI tier 3) | — | 1 |
| Double battles | — | 1 from the second region on |
| Rival battles | see the rival spec | 2 to 3 per region |

- Experience per trainer falls by about 20% so that more fights do not mean over-levelling.
- Every trainer battle won without a faint gives the 30% heal from section 5.
- A run should be about 20% longer in battles and no longer in walking: remove one empty node per stage to pay for it.

---

## 8. No single Pokémon sweeps a team

For the player **and** the computer. Five rules, each visible to the player.

1. **Rally.** Each time one Pokémon knocks out an opponent without leaving the field, the *next* opposing Pokémon to enter gets +1 Defense and +1 Sp. Def, announced as "The team rallies!". It stacks to +2. It resets when the sweeper switches out or faints.
2. **Boost ceiling.** Stat stages stop at **+4**, not +6.
3. **Level ceiling.** No Pokémon may be more than 2 levels above the party's average. Experience past that is shared out to the rest of the party.
4. **Every team has an answer.** From the second region on, every trainer's team carries at least one of: a priority move, a move that forces a switch, a move that removes stat boosts, a status move with 85% accuracy or better, or a Focus Sash. Gym Leaders and above carry two.
5. **The AI notices.** From tier 3 up, when an opposing Pokémon has +2 or more in an attacking stat or Speed, or has taken two knockouts in a row, answering it becomes the AI's first priority.

These apply in both directions. If an opponent's ace is sweeping the player, the player's next Pokémon rallies too.

**Test:** in 5,000 simulated battles between level-matched teams with AI tier 3 or above, one Pokémon takes five or six knockouts in fewer than 3% of battles.

---

## 9. Trainers that hold their own

| Rule | Region 1 | Region 2 | Region 3 |
| --- | --- | --- | --- |
| Team size (ordinary) | 2–3 | 3–4 | 4–5 |
| Team size (ace trainer) | 3 | 4–5 | 6 |
| Levels against the player's highest | −2 to 0 | −1 to 0 | −1 to +1 |
| AI tier (ordinary / ace) | 1–2 / 3 | 2 / 3 | 3 / 4 |
| Held items | Ace only | Half the team | Every Pokémon |
| Moves | 3–4, one coverage move | 4, one non-damaging | 4, built as a set |
| Shared weakness | At most 3 Pokémon weak to one type | At most 2 | At most 2, and none 4× weak to it |

- **Levels follow the player's highest Pokémon,** not the average, so an over-levelled ace does not flatten everything else.
- **No trainer leads with a Pokémon that is 4× weak to the player's lead's own type** when it has another choice.
- **Trainer classes get one signature habit each** (Hikers set rocks; Psychics set screens; Bird Keepers pivot), so the player learns to read a class.

---

## 10. The Gym Leader curve

*"Have Gym Leader difficulty progressively get hard from stage 1 region 1 to stage 1 region 3."*

Difficulty is one number, **d**, that runs from 0 at the first stage of the first region to 1 at the first stage of the third, and stays at 1 after that. Every Gym reads its settings from d.

| d | Where | Team | Ace level over the player | AI | Kit |
| --- | --- | --- | --- | --- | --- |
| 0.0 | Region 1, stage 1 | 3 | +0 | Tier 3 | Ace holds an item. One trick, shown clearly |
| 0.25 | Region 1, later | 4 | +1 | Tier 3 | Two held items. One answer to its main weakness |
| 0.5 | Region 2, stage 1 | 5 | +1 | Tier 4 | Items on all. A lead that sets something up |
| 0.75 | Region 2, later | 5–6 | +2 | Tier 4 | A second type on two Pokémon. One counter slot |
| 1.0 | Region 3, stage 1 onward | 6 | +2 | Tier 4, with a win condition | A Mega or other signature. Two answers to sweepers |

- The step from one Gym to the next should be felt. The step should never be a level jump alone: each row adds **one new thing the Leader can do**.
- A Leader the player loses to keeps the same team on a retry. The player should be solving a problem, not re-rolling one.

---

## 11. The Elite Four and Champion are built against the player

### 11.1 When

At the League door the player **registers** their six. The Elite Four are chosen then, from that team. The line-up is announced by name. The player may then change moves and items freely, and swap **one** Pokémon.

### 11.2 Choosing the four

1. For every candidate (any Leader or Elite Four member in the game with a type specialty), count how many of the player's six are weak to that specialty.
2. Take the candidate with the highest count. Remove the Pokémon it threatens from the tally. Repeat until four are chosen.
3. No two share a specialty. At least one is a Double Battle specialist if the player has used Double Battles this run.
4. **Fairness cap:** no single member's specialty hits more than four of the player's six super-effectively. If it would, the next candidate is taken.

### 11.3 Building each team

Each member's six are: **four of the specialty**, and **two covers**: Pokémon chosen to beat the types on the player's team that threaten the specialty.

### 11.4 Your example, worked

Player's team: 2 Ground, 2 Fighting, 2 Ghost.

| Member | Why | Covers |
| --- | --- | --- |
| **Erika** (Grass) | Grass beats the two Ground-types | Ludicolo, to hit the Fire-types a Grass team fears; Scovillain, to hit Ice |
| **Tate and Liza** (Psychic, Double Battle) | Psychic beats the two Fighting-types | Malamar, to fight Ghost; Froslass, as in your note |
| **Phoebe** (Ghost) | Ghost beats the two Ghost-types | The Sableye line, with Mega Sableye, which Ghost moves do not hit for extra damage in return |
| **Fourth seat** | Nothing is left unaddressed, so it goes to the specialty that hits the player's remaining coverage hardest: Water or Ice against Ground | Two covers against Grass and Electric |

*One correction to the example: Froslass (Ice/Ghost) does not hit Bug-types for extra damage. If the aim is to cover a Psychic team's weakness to Bug, a Flying- or Fire-type cover does it; Sigilyph (Psychic/Flying) keeps the specialty as well. The cover picker in 11.3 would choose on that basis.*

### 11.5 The Champion

- The Champion's team **answers the types of the player's two strongest Pokémon** (highest level, then highest stats), with at least one Pokémon for each.
- The other four slots are the Champion's own identity and are not chosen against the player.
- The Champion plays at AI tier 5 and has one Mega or signature.
- If a rival is at Lead +3, the rival is the Champion, and the scouting ledger replaces this rule.

### 11.6 What keeps it fair

- The player sees the line-up before the first battle.
- The count in 11.2 uses types only. Moves, items and abilities are not read.
- The swap and the free move changes mean a prepared player can answer back.

---

## 12. The stage map

- **The whole stage is visible** from the moment it is entered: every node and path, with unknown node contents shown as a question mark.
- **A slider** along the bottom scrolls the map from start to finish; dragging it moves the view, and a small strip above it shows the whole stage in miniature with the player's position marked.
- Keyboard and controller: left and right scroll; Home and End jump to the ends.
- **R** opens the Rival Report (see the rival spec). Rival markers are shown on the miniature strip.
- Blessings that reveal nodes (The Lunar Dream, The Iron Serpent, The Storm Chaser) fill in question marks on this same map.

---

## 13. Every knob in one table

| Setting | Default |
| --- | --- |
| `encounter.rarerTypeGoverns` | on |
| `encounter.repeatDampener` | 0.6 |
| `encounter.crossRunDampener` | 0.9 |
| `encounter.stage1Pool` / `stage2Pool` | 45 / 60 |
| `region.firstTypeUnique` | on |
| `trainer.slotPoolMin` | 8 |
| `trainer.starterWeight` | 0.25 |
| `rarity.rare` / `rarity.epic` | 8.5% / 1.5% |
| `fossil.commonSet` | Plum, Root, Spark at 20% each |
| `battle.healingItems` | off |
| `battle.heldBerries` | on |
| `revival.carryLimit` / `revival.shopPerRegion` | 2 / 1 |
| `heated.chance` / `perRegion` / `perRun` | 6% / 1 / 3 |
| `stage.trainerBattles` | 4–5 |
| `sweep.rally` / `sweep.boostCeiling` / `sweep.levelCeiling` | on / +4 / average +2 |
| `gym.curve` | d from 0 to 1 by Region 3, stage 1 |
| `league.counterPick` / `league.swapAllowed` | on / 1 |
| `map.fullView` / `map.slider` | on / on |

---

## 14. Tests

1. Over 1,000 simulated runs the wild graph meets every target in 2.4.
2. Over 1,000 simulated runs the trainer graph meets every target in section 3.
3. No Dragon, Fairy or Ice species is in the wild top 20.
4. No type is the first type of two stages in one region.
5. Rare and Epic encounter rates are within half a point of target over 100,000 rolls.
6. A new save offers exactly the three quiz starters.
7. Plum, Root and Spark are each 20% of fossil rolls.
8. No battle command can use a healing or revival item, for any side.
9. Heated-moment moves never trigger against ordinary trainers and never exceed the caps.
10. Stage trainer counts are within range in 10,000 generated stages.
11. The sweep test in section 8 passes.
12. No generated trainer team breaks the shared-weakness rule for its region.
13. Gym settings rise with d and never fall.
14. For 10,000 random player teams, the chosen Elite Four have four different specialties and respect the fairness cap.
15. The Champion's team includes an answer to each of the player's two strongest Pokémon.
16. The whole stage map can be scrolled end to end with mouse, keyboard and controller.
