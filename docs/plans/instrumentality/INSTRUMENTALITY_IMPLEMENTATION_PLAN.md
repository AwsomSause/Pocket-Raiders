# INSTRUMENTALITY — Implementation Plan

How I'd build every idea, system and piece of content in the Beta 0.6 pack, in the order I'd build it. This file goes with `INSTRUMENTALITY_DEFINITION.md`, whose section 7 lists your decisions (A–W, 2026-11-12). Every decision is built in below.

Repo facts are from `origin/main` 552e29ef (2026-11-13).

---

## 0. Rules every slice follows

These come from CLAUDE.md and the pack's own architecture doc, which agree.

1. **One slice = one playable, tested thing.** Each slice includes rules and validated data, UI, save/load, unit tests (normal, edge and failure cases), one Playwright check, a `docs/updates/beta-0.6/<pr>-<name>.md` fragment (Player gets / Save / Limits), and STATUS/CHECKLIST updates.
2. **`src/core` never imports Phaser.** Every new module below lives in `src/core/...`. Scenes only read state and show it.
3. **Data is JSON validated by Zod.** Authored text and numbers go in `src/data/...`, never in code. Pack tools turn the scripts into JSON once, and from then on the JSON is the source.
4. **Named seeded RNG streams.** Every new roll gets its own stream (list in section 9). Adding a stream must never change an existing roll. Every slice has a replay test: same seed with all new settings off gives the **same event log as today**.
5. **Everything is behind a setting.** Every setting listed in section 10 defaults to the safe value. Off means the module isn't even consulted.
6. **Saves:** each bump gets a migration and a migration test, and no save is ever dropped. Next free versions: **profile 21, run 43, settings 42**. If another branch takes one first, use the next.
7. **Content status:** every new event, character, Pokémon and format is marked supported, limited (with a written limit), disabled or invalid. Passing the schema doesn't count as supported.
8. **Presentation can't change results.** Siege maps, Colossus plates, title cards and crowd chants are cues only. Battle results come from state.
9. **Off-list items stay off** (no cross-run rival memory, no romance, no online play, no extra currencies, Capture Styles off, Risky Evolutions off). **Now allowed** by your decisions: Triple Battles, Evolution Encounters, mic input.
10. **The run never ends on a story loss.** Every climax gives two shots (decision A).

### Branch and workflow
- All work goes to the shared branch **`beta-0.6`**. Each workstream thread opens PRs into it, not into `main`.
- Each PR adds one `docs/updates/beta-0.6/<pr>-<name>.md` fragment.
- At the end, one big PR goes into `main` with the update log. It merges only on green CI.
- Workstreams that can run as **parallel threads** are marked ⇄.

---

## 1. Step zero (before any feature)

| # | Task | Done when |
|---|---|---|
| Z1 | **Get `main` CI green.** It was red on 11-12 (unit tests + e2e shard 3; last green #1093). | `CI ok` passes on main. You then set it as a required check. |
| Z2 | Create the `beta-0.6` branch from green main, plus `docs/updates/beta-0.6/README.md` (title INSTRUMENTALITY, scope = this plan). | Branch pushed; README merged. |
| Z3 | **Record your decisions** (definition section 7) in the README and in GAME_DESIGN.md as D17+, and update the off list (Triple Battle in, Evolution Encounters on, mic in). | Docs merged. |
| Z4 | Copy the pack into `docs/plans/instrumentality/` (docs and scripts only, no 7 MB JSON) and add line ranges to `docs/plans/INDEX.md`. | Later threads can grep it instead of re-unzipping. |
| Z5 | Add the 94 renamed sprites (already fixed, see `fixes/sprites/RENAMES.csv` in `INSTRUMENTALITY_fixes.zip`) under `public/assets/images/` with provenance rows. Add the custom trainer art when it arrives. | Asset check passes. |

---

## 2. Milestone 1.0 — *You Are (Not) Alone* (groundwork, balance, rivals)

Goal: the run feels fairer and the rivals feel like people, before any big story content arrives.

### 1.0-a Foundations
| Slice | What | Where | Save | Tests |
|---|---|---|---|---|
| F1 | **Expansion settings registry.** Add every setting from section 10 at its default. | `src/core/settingsRegistry.ts` | **settings 42** | migration test; "all off = base log" replay test |
| F2 | **Expansion run state.** One optional `run.expansion` block (track, cast statuses, raids n1–6, eventsSeen, cut, siege, apex, friend, rescue). All fields optional, so old runs load untouched. | `src/core/state.ts`, new `src/core/expansion/schema.ts` | **run 43** | old run loads; round trip; 96 KB size budget test |
| F3 | **Profile meta block** (only if B2 = yes): Reliquary, Storybook, Keepsakes, Doom Ledger, rival bags, Faller rank. | `ProfileSchema` in `src/core/state.ts` | **profile 21** | migration test; ledger entries are never dropped |
| F4 | **Data pipeline.** Port the pack's `build_expansion.js` output into `src/data/expansion/*.json`, plus Zod schemas, plus a content gate counting 143/110/58/80/20. | `tools/`, `src/core/contentSchema.ts` | – | schema test; counts test; species-in-dex test |

### 1.0-b Balance pass ⇄
| Slice | What | Where | Tests |
|---|---|---|---|
| B1 | **Type weights and retag** (Steel/Ghost/Psychic → uncommon, Ice/Fairy/Dragon → rare; 32 + 26 species), mapped onto the 8 rarity tiers (decision P). | species tags data | sim: rarest-type rule, tier counts |
| B2 | **Dampeners:** ×0.6 per in-run meet, ×0.8 per family. Use the cross-run ×0.9 only if B2 = yes. No species repeats in the first 6 encounters; one "odd one out" uncommon per early stage. | wild encounter picker | 10k-run sim: top species under 1.5× median |
| B3 | **Trainer pools:** at least 8 species per slot, starters only on rivals and named trainers, at most 2 trainers per species per region, and Story Run teams kept out of normal pools (decision C). | trainer generator | sim targets from Balance §13 |
| B4 | **Anti-sweep "Rally":** +1 Def/SpD to the next foe, stacking to +2; boost ceiling +4; level ceiling at average +2. Merge with the existing boss sweep guard (#1135) instead of adding a second one. | `src/core/battle/` | sim: sweep rate under 3% both ways |
| B5 | **Battle item budget (decision D):** each battle allows **10 healing items (any kind) + 6 revives**. **E4, rivals and the Champion get the same budget** from their own bag, plus AI that uses it (heal when the ace is low, revive the best Pokémon, never waste the last one). Other trainers keep today's rules. Numbers live in `balance.json` (`itemCaps.healsPerBattle: 10`, `revivesPerBattle: 6`). | `engine.ts` (near `revivesPerBattle`), battle AI, `balance.json` | budget counts for both sides; AI uses items only in its own turn; the item never applies twice |
| B6 | **More fights:** 4–5 trainer battles per stage (1–2 avoidable), 1 ace trainer, a doubles battle from region 2, EXP −20%, one fewer empty node. | stage generator, `balance.json` | sim: region-2 pass rate stays in band |
| B8 | **Transformations (decision H):** change `src/core/battle/transform.ts` from "one per side per battle" to **one of each gimmick per side per battle** (Mega, Z-Move, Dynamax, Tera: up to 4 different ones). Key items are still needed; the boss gimmick cap still decides which bosses get one. | `transform.ts`, `bossGimmicks.ts` | per-gimmick counters; a second Mega is refused; existing gimmick tests updated |
| B9 | **Evolution Encounters on (decision L):** switch the closed Evolution Encounters back on and let evolution-themed events (Eevee Who Couldn't Choose, Pokémon That Wouldn't Evolve, Pidgey's Resolve) use them. Risky Evolutions stay off. | event data, settings | content gate: no Risky Evolution used |
| B7 | **E4 counter-pick:** register 6 at the League door and swap 1; fairness cap 4; Champion answers your top two. | `src/core/campaign/circuitCast.ts` | unit: never counters an unseen Pokémon |

### 1.0-c Rival overhaul ⇄
| Slice | What | Where | Tests |
|---|---|---|---|
| R1 | **Map the pack's model onto the 4-rival system.** Main = major, Friend = friendly. The 8 pack personalities map onto the existing 11 types (new ones only where there's no match). Add 8 styles and 8 arcs as data. Locked ids, checked at battle start. | `src/data/majorRivals.json`, `src/core/rivals/` | id lock test; a rival never changes role |
| R2 | **Lead −3..+3** (extend the existing Feels Left Out offer). Rival win gives Lead +1 and rival loss gives Lead −1. Lead never changes levels. | `src/core/story/askLead.ts` | table tests per Lead step |
| R3 | **Marks (max 5) and six feelings (0–10)** with the change table. Reuse the battle growth marks only where the names don't clash. | rivals module | change-table tests |
| R4 | **Tier-5 rival AI:** win-condition target, scouting ledger (this rival, this run only), ~50% switch prediction, small endgame search (2 v 2). | battle AI | determinism: same seed gives the same choice; perf budget |
| R5 | **Rival dialogue bank:** the 528 authored lines, with species lines **built at runtime** (the "A Eevee" article bug is already fixed in the builder). At most 1 Pokémon line per meeting, no repeats until all are used. | `src/data/story/text/`, line builder | article test; every species resolves |
| R6 | **Presence and Pseudo Stages:** 2 guaranteed meetings per region plus a 50% third by Lead; Race/Team-Up/Already There/Ambush; catch step-in 3% once per region. | story2 world scenes | 40-run sim: presence counts |
| R7 | **Rival Report** as a pop-up panel on the map (decision M), not a new screen. | scenes (UI only) | e2e: panel opens, no console errors |
| R8 | **The Friend** (from the evil pack's second rival): Meet/Mid/Errand/Eve scenes, an optional no-stakes spar, ≤1 extra Assist, never betrays, postcards. Uses the friendly rival slot; one Friend per run, present in ~50% of regions (decision Q). | rivals + story2 | Assist budget ≤4 Standard / ≤6 Extended |
| R9 | **Rival Rescue Plan:** receipts, a holding clock (Logged/Processed/Assigned), plans (Loud Grab, Quiet Lift, Deal for money, Inside Job, Exchange), the 12-card complication deck, Reunion. | `src/core/evil/` + rescue | p clamp 0.35–0.95; Deal uses money only |
| R10 | **First-Stage Pity:** after 5 straight first-stage losses, the rival is −2 levels, AI tier 3, and gives advice. The counter is stored on the profile only if B2 = yes; otherwise it's per run. | rivals | counter test |
| R11 | **Witness the Rest:** end-of-run simulated cards for this run only (decision B1, no Archive). | run end screen | e2e |
| ✗ | Rival Archive, rumours, "Ones You Left", "Old Friend Returns", Hoopa ring | – | **Not built** (B1) |

### 1.0-d Triple Battles ⇄ (decision I)
| Slice | What | Where | Tests |
|---|---|---|---|
| T1 | **Triple Battle engine:** 3 v 3 on the field, positions (left/centre/right; edges can't reach the far edge with single-target moves), spread moves hit adjacent targets, shifting position as an action. Built next to `src/core/battle/doubles.ts`, sharing its targeting code. | `src/core/battle/triples.ts` | targeting table for every position; spread damage; KO refill order; determinism |
| T2 | **Triple Battle UI:** 3 Pokémon per side, target picker, HP bars. Mock-ups first (decision M). | BattleScene | e2e at 3 screen sizes; no console errors |
| T3 | **Triples in content:** a rules flag `triplesOnly`, some trainer battles in later regions, a Frontier option, and the base for the Front format (E4). | `src/core/rules.ts`, trainer data | content gate |

### 1.0-e Minigames and mic ⇄ (decisions N, O)
| Slice | What | Where | Tests |
|---|---|---|---|
| MG1 | **Remake the 14 existing minigames and 4 Frontier facilities to be harder:** add a Hard tier with tighter timing, more rounds and fewer hints. Rewards scale with the tier. Outcomes use seeded RNG; input timing is judged in fixed windows. | `src/core/minigame/games.ts`, `frontier.ts` | each game: Easy/Hard tables; seed replay |
| MG2 | **New minigames from the pack** as real games, in batches: rhythm (Orchestra, Alola rap, Galar claps/cheer-off), triage (Day the Center Closed), sled, Snake (Psyduck Migration), stealth (Pokémon Prison, Old Wing), arcade cabinet ×3, debate quiz, Safari photo/tracking. Each gets a mock-up set before UI work. | `src/core/minigame/` | per-game unit tests + e2e |
| MIC1 | **Mic input (decision N):** an optional `input.mic` setting, off by default. Uses the browser's microphone only after the player turns it on and the browser asks. Measures loudness only, never records or sends audio. **A button always does the same thing.** First use: Sleeping Snorlax shout; later, rhythm and cheer games. | `src/game/` input layer (not `src/core`) | e2e with fake media stream; the button path works with mic off |

**1.0 acceptance:** sim shows the balance targets were met, the rival overhaul runs through a full 3-region run, all settings off gives the base event log, and saves migrate.

---

## 3. Milestone 2.0 — *You Can (Not) Advance* (evil team saga, Kanto first)

This is the pack's own phase list E0–E8, fitted to the repo. **Kanto only** until the whole loop works.

| Phase | Slice | What | Where (new code under `src/core/expansion/`) | Tests |
|---|---|---|---|---|
| E0 | Data | Build the missing `tracks.json`, `siege_maps.json`, `climax_extended.json` and `apex.json` from the scripts. Kanto entries first. | `src/data/expansion/` | schema and counts |
| E1 | **Cast** | Dossier entries for the 143 characters (custom species such as Alphayena and Megawattrel use the game's existing entries, decision W) (Kanto first), the 14 **variant lines** as battle hooks (onEntry/onHit/onTurnEnd/onSwitchIn, ≤20% damage, counted in the +30% cap), and special Pokémon slots by rank (0 Grunt, 1 Spec/Lt, 2 Cmdr+). Kanto line: **Black-Label**. | `cast/`, `variantLines.ts`, hooks in `src/core/battle/` | each line: unit test + 5k-battle sim (neither side above 60%) |
| E2 | **World-state track** | Pure `reduceTrack()`, steps 0–5 (+1 raid fail/decline or climax scheduled, −1 raid success or officer turned). Step effects come only from the closed list: lines, music, weather, lighting, shop ±15%, one announced field rule, wild pools, ±1 optional event. Kanto: *Rocket Ledger*. | `tracks/` | reducer table; "never raises enemy levels" invariant |
| E3 | **Story events + quiet-node scheduler** | The `xe.kanto.*` events into the existing event system (`src/data/events/`, `EventDefSchema`). Scheduler priority: rescue offer → rival scene → Friend → anchor → story → roaming → postcard → run event. Density low 3 / normal 5 / full 8. | `events/`, `src/core/events.ts` | 10k-run sim: spacing, anchor always fires, never twice |
| E3b | **Run events** | 104 new run events (FE-44..75, EN-60..131) ported through `tools/events/*.ts`. Selling, coins and EXP candy rewritten (E, F, K). Vague effects ("small stat reward") replaced with concrete rules. | `tools/events/`, `src/data/events/` | content gate; no-selling grep test |
| E4 | **Wide formats**, one at a time, in this order: **Breather → Blackout → Convoy → Siege Map → Colossus → Front → Debate** | A thin `WideFormat` interface over ordinary battles (setup, describe → card, onBattleEnd, onTurn, isOver, result). **Front is built on Triple Battles** (decision I): 3 lanes as one triple battle with a lane rule, with a 4-lane Alola variant as triple + 1 waiting lane. **Debate** = 3 exchanges with evidence from key items or flags. Each format's HUD and the Siege Map / Colossus plate get **12 mock-ups for you to choose from** before they're built (M). | `formats/*.ts` | `formats.test.ts`, one test per format; e2e per format |
| E5 | **Extended Cut — Kanto** | Phases 0 → 8: 0b Siege Map, 1 Blackout, 2 Gauntlet, 3 Duels, Breather (heal 50%, revive 1), 4 Set piece, 5 Giovanni, 6 Colossus vs **XD002 M2 Mewtwo**, 7 optional, 8 Resolution. Two save points. **Second Shot** (decision A): the first loss retries from the last save point with the party healed; the second loss gives the worst Resolution plus a ledger entry, and **the run continues**. `climax.cut` setting: Standard (current) / Extended. | `arc/climaxExtended.ts`, `src/core/campaign/director.ts` | win bands 40–60 / 35–55; save/reload at both save points; Second Shot used once, never twice; a second loss never ends the run |
| E5b | **Raids 4 and 5** | Raid 4 after Raid 2; Raid 5 after Raid 3 or track step 4. Levers only write siege/apex/cast/phase flags; the ±2 OS bound is kept. | `src/core/raid/` | lever test; bound clamp test |
| E5c | **Climax × rival** | Help/Beat/Side roles per phase, 5 wide Assists (budget 3 per phase, ≤6 total with the Friend), Reveal Scenes with 4 responses, Breather conversation by attitude band, codas. | `arc/rivalClimaxExtended.ts` | swing targets ~+8% / 0 / −6% |
| E6 | **Shadow II** | Corruption 0–100 on the existing sealed Shadows, 4 tiers, purification keys with 3 hints, heart scars (≤2), `willDisobey` computed at the start of the turn and **shown**, a 2-slot cap for T3–4. Snag uses the existing Snag Ball (J). Shadow use is always optional. | `shadow/`, `engine.ts` near the Snag Ball | disobey uses only its own stream; purify is never undone |
| E7 | **Grand Arc start** | Cipher as a roaming team (with Rocket Remnants and Snag'em as `evilTeams.json` entries), liaison Ein, ROM K, the Stock track (−1 per 3 ROMs). | `grandArc/` | ROM is never lost (FE-70 copies, never removes) |
| E8 | **Stand With Them** | Code name House Card, reputation ladder +30/+45/+60/+70 (access and information only, never stats), Rise/Throne/Turn verdicts. Two shots here too (the base doc says a loss ends the run; decision A overrides it). A rival "handed over" is freed at run end, not held in the Region of Doom (B1). | `arc/standWithExtended.ts` | ladder test |

**2.0 acceptance = the smallest shippable INSTRUMENTALITY:** a Kanto run from Rumours to Resolution in both Standard and Extended Cut, with Second Shot working and the run never ending on a loss, ROM K collected, saves surviving both save points, the all-off replay identical to base, and no console errors at 3 screen sizes.

### Kanto canon spaces ⇄ (separate thread)
- Add the 115 new Kanto spaces (188 total) through the existing Town Roll.
- Sevii Islands as optional Interlude 7.
- Kanto minigames (Island of Giants, ballet, races, triage, maze, timing song) built as real games through MG2 (O).
- Keep the League (decision R).
- Cut the "remembers earlier runs" bits unless B2 = yes.
- The ₽1,000,000 bicycle becomes a voucher (G).
- Coins become money (F).

---

## 4. Milestone 3.0 — *You Can (Not) Redo* (legends, promises, beasts, second chances)

Each system is behind its own setting, and each can ship alone. ⇄ = parallel thread.

| Slice | What | Key rules | Tests |
|---|---|---|---|
| L1 ⇄ | **Legendary Blessings framework.** Tier roll (45/30/17/6.5/1.5), one per run, the opening sequence (unskippable only on a save's first run), Influence thresholds (Signs / Echoes / Trial / Recognition / Presence), Communion + one Rite. | New-save pool of 10; the Reliquary unlock needs B2 = yes, otherwise the full pool is always open. | tier odds sim; one per run |
| L2 | **Blessings content in batches:** Lesser (25), Greater (23), Divine (16), Primordial (4), Origin (3). Player-side gimmick blessings (Eternatus Dynamax, Terapagos Tera, Necrozma) follow decision H. | Every % inside the +30% cap. | per-blessing unit test |
| L3 | **Rewinds (Dialga, Celebi, Time Keeper).** Needs a **run snapshot** (stage start) and a **battle snapshot** (turn start). Restoring must give exactly the old state and must **not re-roll** RNG: streams are restored, not advanced. | Hardest technical slice in the update; build it before the Dialga/Palkia Rites. | restore = byte-equal state; no roll repeats |
| M1 ⇄ | **Mythical Promises.** Tellings (3 to believe, across runs only if B2 = yes; otherwise within the run), Visit odds, the Promise as an exact checkable rule with a warning before you break it, the Guest (7th companion **outside** the party), Keepsakes. | Diancie's promise rewritten (no selling); Hoopa's carry-over item only if B2 = yes; no Rival Archive link. | promise-check test per Mythical |
| U1 ⇄ | **Ultra Beast Incursions.** 10 hidden Appetite tallies, Static → Tear → Crossing → Incursion, Beast Balls from Shards, Homesickness, Faller rank (B2). | Each Ultra Rule is an engine hook; 5k-battle sim per rule (neither side above 60%); Guzzlord's buy-back removed (E). | per-rule sim |
| S1 | **Second Chance** (5%, once per run): revive at 25% HP, +1 to all stats, tag battle with the rival. Rescue order: rewind → Latios jewel → Flight North → Second Chance. | Tag battle = existing doubles with an AI partner (no new format). | order test; once per run |
| H1 | **Heated-moment moves** (6%, ≤1 per region, ≤3 per run, only big battles). Shares the "max 1 cinematic per battle" budget. | | budget test |

**3.0 acceptance:** each system works alone and with the others (precedence rules 0.3 from the Master doc as a unit-tested function), all off = base, and the rewind restore tests pass.

---

## 5. Milestone 3.0+1.0 — *Thrice Upon a Time* (the other regions and the finale)

| Slice | What | Notes |
|---|---|---|
| E9 ⇄ | **The other 8 regions**, one thread each, in the pack's order: **Johto, Unova, Kalos, Galar, Sinnoh, Hoenn, Alola, Paldea.** Each one repeats E1–E8 with its own track, line, cast, events, Raids 4/5, Extended Cut and liaison/ROM. | Per-region checks: Unova's PC −4 is run-only and reversible; Kalos's second held item (Couture) is a new engine slot, so build it as its own slice or cut it; Galar Dynamax/Paldea Tera lines follow H; Alola's forced-switch boss and "bring below half" wins are new battle win conditions; Cassiopeia, Ghetsis + Kyurem and Rose + Eternatus may field a **7th** Pokémon, listed in boss data (U); the battle engine and UI must handle a 7-slot foe party. |
| E10 | **Companions:** Rocket Remnants trio, Wes, Rui, Krane (purify chamber), Chobin, Looker; Friend postcards across regions. | In-run only. |
| E11 | **Grand Arc finale: Citadark vs XD001.** XD001 locks = 9 − ROMs + modifiers; all 9 ROMs means the last fight is not a fight. Losing at Citadark never undoes a won run. | `grandArc/finale.ts` |
| D1 | **Region of Doom ("The Margin")** as a 10th region unlocked by the Doom Ledger (B2). 14 districts, 8 Evil Gyms, takeover objectives, annexes. **No cross-run rival parts** (B1): the Gym 6 rival is replaced by a stand-in. | Level cap +50 like any region. If B2 = no, RoD becomes an in-run epilogue built from this run's ledger only. |
| W1 | **Whole Run Event framework:** bag, 35% of runs, forced meeting with two choices, 10-beat skeleton, hidden Threads, title cards, endings that change the Champion battle. | Nothing ends the run. |
| W2 | **Guidance of Giratina:** the Distortion Division, 10 beats, 6 endings. Build order: B1, B3, B10 with one ending, then the rest. **A content warning when it's first drawn, nothing else** (V). | Uses the Cultist sprites from the zip. The Avatar's speech stays original (the checker confirms no "Zamasu"). The Usurper ending still ends the run as "completed". |
| W3 | **The other 4 WREs** (Seven Days next, then Weather War, Made One, Weapon and the Flower): writing first, then build. | Outlines only in the pack. |
| G1 ⇄ | **Greenneedle events:** 62 reworked + 38 new, in batches of ~10. Player Megas and Z rewards follow H (one of each per battle); minigames are real games (O); Sleeping Snorlax uses mic or button (N); Evolution Encounters can be used (L); cross-run ones are cut (B1). Squirtle Squad and Primeape use the Anime Forms sprites from the zip. | Content gate per batch. |
| X1 | **Final balance and accessibility:** 1,000 sim runs per region (the sim bot must first be able to pass region 2, since today it can't, so late-game balance is unmeasured), win bands, letters/numbers/pips for every meter, reduced motion. | Gate for the final PR. |

---

## 5b. Screen mock-ups (decision M)

Before any new screen is built, I make **one mock-up page with 12 options** for it. You pick one (or mix parts), and the build follows that pick. Each page shows the 12 options side by side at game size, with the same sample data, and works on a phone.

| # | Screen | Used by | Needed before |
|---|---|---|---|
| 1 | Siege Map | Extended Cut phase 0b | E4 Siege |
| 2 | Notebook world-state track page | Tracks | E2 |
| 3 | Dossier (characters, ranks, what-if marks) | Cast | E1 |
| 4 | Field Notes (story events, ROMs, keys) | Events, Grand Arc | E3 |
| 5 | Colossus plate (Apex parts, shields, timer) | Phase 6 | E4 Colossus |
| 6 | Format HUDs (Blackout, Convoy, Front, Debate) | Wide formats | E4 |
| 7 | Situation Report (extended) | Climax choice | E5 |
| 8 | Rival Report | Rivals | R7 |
| 9 | Stage map slider + mini strip | Map | B6/R7 |

Triple Battle UI (T2), new minigames (MG2) and the Legendary Blessing opening get mock-up sets the same way.

## 6. Order and dependencies (short)

```
Z1 green main → Z2 branch → Z3 decisions
  → F1–F4 foundations
      → 1.0-b balance ⇄ 1.0-c rivals ⇄ Kanto spaces
      → E0 → E1 → E2 → E3 → E4 (format by format) → E5 → E5b/E5c → E6 → E7 → E8   [= ship point]
          → 3.0 systems (L1/M1/U1 ⇄; L3 before Dialga/Palkia/Celebi)
          → E9 regions ⇄ → E10 → E11 finale → D1 Region of Doom
          → W1 → W2 Giratina → W3
          → G1 Greenneedle batches ⇄ (any time after E3)
      (T1–T3 triples before E4 Front; mock-ups before every new screen; MG/MIC any time after F1)
              → X1 → final PR into main
```

## 7. Rough size

| Milestone | Slices | Size |
|---|---|---|
| Step zero | 5 | S |
| 1.0 | 4 + 9 + 11 + 3 triples + 3 minigame/mic | XL |
| 2.0 (Kanto) | ~14 + Kanto spaces | XL |
| 3.0 | 7 | L (rewinds are the risk) |
| 3.0+1.0 | 8 regions + 8 | XXL |

This is bigger than any update so far. Suggested release split: **Beta 0.6 = milestones 1.0 + 2.0** (Kanto); **0.6.x patches = 3.0 systems**; **Beta 0.7 = 3.0+1.0** (all regions and the finale). The title stays INSTRUMENTALITY throughout.

## 8. Save plan

| Bump | Version | Holds | Migration test |
|---|---|---|---|
| Settings | 42 | every expansion setting at its default, plus `input.mic` (off) | old settings load; defaults filled in |
| Run | 43 | optional `run.expansion` (+ `grandArc`, `rival.x.*`, `friend.x.*` flags) | v42 run loads and plays; no field required |
| Profile | 21 (only if B2) | Reliquary, Storybook, Keepsakes, Doom Ledger, bags, Faller rank | v20 profile loads; ledger never dropped |

Later bumps (rewind snapshots, if they're saved) take the next free numbers.

## 9. New RNG streams (all new, so no existing roll changes)

`events-density`, `event-<id>`, `roaming-stance`, `rescue-complication`, `rescue-cellmate`, `friend-presence`, `friend-postcard`, `siege-fall-order`, `convoy-par`, `shadow-obey-<id>-<turn>`, `shadow-reclaim`, `apex-<id>`, `finale-<phase>`, `doom-*`, `blessing-tier`, `blessing-pick`, `mythical-visit`, `ub-static`, `wre-draw`, `wre-<id>-<beat>`, `second-chance`, `heated-moment`, `rival-presence`, `rival-pseudo`, `rival-catch-stepin`, `balance-odd-one`.

## 10. New settings (defaults)

| Setting | Default | Notes |
|---|---|---|
| `climax.cut` | standard | extended becomes the default only after X1 balance |
| `events.density` | normal | low / normal / full |
| `grandArc.enabled` | on | off removes Cipher, ROMs and the finale |
| `rival.overhaul` | on after 1.0 | off = today's rivals |
| `rival.second` | on | the Friend |
| `rival.secondChance` | 5% | 0 turns it off |
| `itemCaps.healsPerBattle` / `revivesPerBattle` | 10 / 6 | decision D; E4, rivals and Champion use the same |
| `climax.secondShot` | on | decision A; turning it off still never ends the run |
| `input.mic` | off | decision N; the button always works |
| `minigames.difficulty` | normal | easy / normal / hard (decision O) |
| `blessings.enabled` / `mythicals.enabled` / `ultraBeasts.enabled` | on | each is its own toggle |
| `wholeRunEvents.chance` | 35% | 0 turns them off |
| `rocket.x.triad` and other what-if casts | on | the pack's what-if switches |
| `kanto.sevii` | on | |

## 11. Tests per slice (the minimum)

- Unit: normal, edge and failure cases for every rule table.
- **Replay:** with all new settings off, the same seed and actions give the same event log as before the slice.
- **Save:** save and reload at every checkpoint the slice adds (both Extended Cut save points, the Breather, raid ends).
- **Sim:** balance-touching slices run the sim (wild 10k runs, battles 5k per new rule).
- **Playwright:** one spec per player-facing slice (format, panel or scene), no console errors, 3 screen sizes.
- `npm run check` green before every PR; the PR only goes ready for review when green.

## 12. Cut list (if time runs out)

The pack's own list plus mine, in this order:
1. Debate becomes a plain duel.
2. Front becomes a plain Triple Battle.
3. Region of Doom annexes.
4. The 4 outlined WREs.
5. Kalos Couture (second held item).
6. Events density capped at 3.
7. Catchable special Pokémon (catches come last).
8. The Origin/Primordial blessing tiers.

**Never cut:** the Breather, the save points, Second Shot, announcements, the Standard Cut, the off switches, and "a story loss never ends the run".

## 13. Rollback

- Every system has a setting; turning it off restores today's behaviour (proven by the replay test).
- Every save bump only adds optional fields, so an older build ignores them.
- `beta-0.6` merges into `main` only as one PR; reverting that PR reverts the update.
- Content marked "limited" or "disabled" stays in data but is skipped by the content gate.

## 14. Risks

- **Size.** The full pack is bigger than Beta 0.5. Shipping Kanto first keeps 0.6 shippable.
- **Late game is unmeasured.** The sim bot can't pass region 2, and much of the pack (E4 counter-pick, the Champion, WRE endings, Citadark) is late game. Fixing the bot is part of X1, but start it early.
- **Rewinds** (L3) touch battle and run snapshots and RNG. They're the most likely source of determinism bugs.
- **Battle engine surface:** Triple Battles, 7-member boss parties, per-gimmick transformations, AI item use, 14 lines, 11 Ultra Rules, Colossus parts, forced switches and non-KO wins. Each one is a hook, so the hooks need one shared, well-tested entry point.
- **Art:** most new characters have no sprites yet (your custom trainer art is coming). Content without art ships "limited" with a silhouette until it arrives.
- **Mock-ups:** 9 screens × 12 options means about 108 mock-ups for you to review. I'd send them one screen at a time so a screen's build isn't waiting on all the others.
- **Mic input:** browsers only allow the mic after the player agrees, and some block it. The button fallback is required.
- **Parallel threads** conflict in shared files (`docs/status/INDEX.md`, asset provenance, `story.test.ts` fingerprints). Rebase right before merging.

## 15. First three PRs (what I'd do next)

1. **Fix main CI** (Z1).
2. **`beta-0.6` branch + README + decisions + pack copied into `docs/plans/instrumentality/`** (Z2–Z4), plus the renamed sprites with provenance (Z5).
3. **F1 + F2: settings 42 and run 43** with the expansion blocks empty and the replay test in place. Everything after this builds on it.
