# BETA 0.6 — IMPLEMENTATION PLAN — EXPANDED EDITION

**Extends:** `docs/BETA_06_IMPLEMENTATION_PLAN.md` (the base phases 0–10 still come first; this file adds phases E0–E12)
**Read with:** `docs/expanded/BETA_06_SYSTEM_ARCHITECTURE_EXPANDED.md`, `docs/expanded/BETA_06_DESIGN_DOCUMENT_EXPANDED.md`
*Effort sizes are rough (S / M / L / XL), not calendar time. Each phase ends with something playable and an acceptance test.*

---

## X1. How to read this plan

The base plan builds the Regional Evil Team Arc in ten phases. The Expanded Edition is a second layer over it. Nothing here should start until the base **Kanto vertical slice (base Phase 3)** is playable, because every Expanded system extends something that slice proves.

Four rules shape the order.

1. **One region first.** Every Expanded system is built once, for Kanto, end to end, before any other region gets it.
2. **Cheapest proof first.** Data and rules before screens; screens before art; reused art before new art.
3. **Behind a flag from day one.** Each phase adds a setting that defaults to *off* until its acceptance test passes.
4. **The base game never regresses.** Every phase's acceptance includes: "with the new flag off, the base replay test still produces an identical event log."

### X1.1 Dependency map

```
Base 0-3 (Kanto slice) ──> E0 data ──> E1 cast/lines ──> E2 tracks ──> E3 events
                                   └──> E4 formats ──> E5 Extended Cut (Kanto) ──> E9 other regions
Base 6 (Shadow) ──────────> E6 Shadow II ──> (E5 Phase 6 needs E6 Apex) ──> E7 Grand Arc ──> E8 finale
Base 7B, 7C, rescue ──────> E10 companions (rival, rescue, Friend, Stand-with, roaming)
Base 9 (Doom) ────────────> E11 Region of Doom II
All ──────────────────────> E12 balance, accessibility, polish
```

---

## X2. Phases

### Phase E0 — Expansion data and settings (S)

1. Load `data/expansion.json` through `expansionRegistry.ts`; index by id.
2. Add the settings in Volume II §X12 (`climax.cut`, `grandArc.enabled`, `events.density`, `format.cards`, `rocket.x.triad`, `rescue.climaxEligible`), all stored per save.
3. Add the seed streams in the expanded architecture §X11.
4. Bump `ArcState` and `DoomLedger` to schema v2 with the optional fields; write the migrations and fixtures.

**Accept:** every id in `expansion.json` resolves; a v1 save loads; with every Expanded setting off, a seeded base run is byte-identical to the base build.

### Phase E1 — Cast, variant lines and special Pokémon (M)

1. `dossier.ts`: named characters with status; what-if conditions as data.
2. Fourteen line rules as battle hooks (`variantLines.ts`), each with its announcer line.
3. Signature traits as battle hooks; obtainability (`no`, `yes`, `ally-only`, `returned`).
4. The Dossier and Field Notes screens, text-only.

**Accept:** each of the 14 line rules and each Kanto signature trait fires in a scripted test battle with its announcement *before* its effect; no capture prompt appears for a `no` Pokémon; `rocket.x.triad = false` swaps the three Gym Leaders for unnamed Executives with the same teams.

### Phase E2 — World-state tracks (M)

1. `worldTrack.ts`: the single reducer; signals from raids, idle nodes, scheduling and scripts.
2. `trackEffects.ts`: lines, shop prices and stock, one field rule on routes, wild pool changes.
3. The Notebook's track page; the ten-second "moment" scenes as simple palette-and-prop changes.
4. Hand-enter Kanto's track (*The Ledger Fills*) from the script; then extract `data/tracks.json` for all ten.

**Accept:** the worked example in Volume II §X3.5 reproduces exactly; no track effect changes an enemy level or team size (static check); the next step and its cause are always visible.

### Phase E3 — Story events and the quiet-node scheduler (M)

1. `quietNodeScheduler.ts` with the priority table; move the Rescue Plan offer, rival scenes and the Friend's encounters onto it.
2. `storyEvents.ts`: triggers, density selection (3, 5 or 8), anchor events.
3. Kanto's eight events, then the eight roaming events.

**Accept:** over 10,000 seeded Kanto runs, no node holds two scheduled items (postcards excepted), no two story events are adjacent, the anchor event always occurs, and no deadline item is late.

### Phase E4 — Wide formats (L)

Build each as a thin layer over ordinary battles, in this order, each with its HUD and its one-screen card.

| Order | Format | Why this order |
| --- | --- | --- |
| 1 | **Breather** | Trivial; every later test needs it |
| 2 | **Blackout** | One field rule and a counter |
| 3 | **Convoy** | A meter between ordinary battles |
| 4 | **Siege Map** | One screen and a table of effects; no battle changes |
| 5 | **Colossus** | The first format that changes how damage is routed |
| 6 | **Front** | Three lanes: the largest interface job |
| 7 | **Debate** | Used once; no battle engine work |

**Accept:** a test Pseudo Region (`pr.test.formats`) plays each format in isolation; a Front is won by the reference party with no allies; a Convoy that escapes does not end the test run; a Colossus body's HP never changes; every format event is announced.

### Phase E5 — The Extended Cut, Kanto (L)

1. `climaxExtended.ts`: build the phase list from the script's table; two save points; the `climax.cut` switch at Last Rest.
2. Kanto Phase 0b (*The Sealed City*), Phase 1 (*The Streets*), the extended gauntlet floors and officers, the Rig Room objective, Giovanni's new boss stage.
3. Raids 4 and 5 (*The Vermilion Manifest*, *Safari Night Poach*) and the three deepened base raids.
4. The extended Situation Report.

**Accept:** the worked climax in Volume II §X17 can be played and produces the same district states and battle count; `climax.cut = "standard"` plays the base climax unchanged; a wipe in any of phases 1–6 ends the run through the base defeat path; Phase 7 cannot.

*(Phase 6 of the Kanto climax needs Phase E6. Stub it with a plain boss until then.)*

### Phase E6 — Shadow system II (L)

1. Sixteen more moves, sixteen more abilities, six more purification methods, twenty-four Heart Scars.
2. Veiled hesitation and the Gripped 15% rule; end-of-turn tier recalculation.
3. Classes and keys (`shadowKeys.ts`): three hints, the missed-key fallback, a key met early.
4. Apex definitions and the Colossus (`apex.ts`); start with M2.
5. Reclaim; the two Snag Machines; auras (shape and written tier).

**Accept:** the expanded Shadow document's test list (§X15.2) passes; M2 can be fought at Set-1 and Set-9 with the right shields and timers; every Kanto Named Shadow reaches Corruption 0 by its key and falls back to Common when the key is marked impossible; a run with zero Shadow use is still winnable.

### Phase E7 — The Grand Arc (M)

1. `liaisons.ts`, `dataRoms.ts`, `stockTrack.ts`, `carried.ts` (read-if-present only).
2. Ein in Kanto: Raid 4's secondary objective, the Rig Room second route, the farewell note that points to the run's actual next region.
3. `grandArc.enabled = false` path: one fewer officer duel, no note, no ROM.

**Accept:** ROM K can be earned by either route and never twice; with the Grand Arc off, Kanto's Extended Cut is complete and mentions no supplier; no scene reads a carried flag without a default.

### Phase E8 — The finale (L)

1. The gate (three or more ROMs, after the last region).
2. Phases 0–8 of *Citadark*: the Alliance map, the Crossing, the Climb, the Admins, the Reservoir, Greevil, XD001, the Rainbow Door, Resolution.
3. The relaxed-D1 path: a loss writes `silent` and leaves the run won.
4. Doom Ledger writes: `finale.result`, `rainbow.result`, Apex results.

**Accept:** the finale is playable with three, five and nine ROMs and differs in each; with nine in-region ROMs XD001 is not fought; losing at any finale phase does not change `run.ended`.

### Phase E9 — The other eight regions (XL, parallelizable)

For each of Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar, Paldea:

1. Extract the track, district table, phase table and Apex definition.
2. Build Raids 4 and 5; deepen Raids 1–3.
3. Dress Phase 0b, Phase 1, Phase 6 and Phase 7.
4. Wire the liaison, the ROM and the carried flags.

**Accept (per region):** the Expanded Definition of Done (X5) is met.

Suggested order, easiest first: **Johto** (shares Rocket assets), **Unova**, **Kalos**, **Galar**, **Sinnoh** (double Apex), **Hoenn** (two teams, two weathers), **Alola** (two teams), **Paldea** (a defended raid and a Debate).

### Phase E10 — The companions (L, parallelizable with E9)

| Companion | Work |
| --- | --- |
| **Rival at the climax** | Wide Assists; `keepsakeBonus` and `shadowTerm`; eight Reveal Scenes; the Breather scene; 96 lines; nine stand-ins |
| **Rescue Plan** | Receipts; the holding clock; the Inside Job and the Exchange; twelve complications; fourteen jailers; cellmates; the Pound; 72 lines |
| **The Friend** | Errand, Eve, spar; the district and the Annex; postcards; the dock; 132 lines |
| **Stand with them** | Code names and runners; 45 Loyalty Jobs with a catch and a mercy; the Allied Extended Cut (Duty Roster, Cavalry, inverted Colossus, Audit); first orders |
| **Roaming teams** | Four new beats; three new stances; the eighteen kits' schemes, machines and marks; favors; both `lead`-mode Extended Cuts |

**Accept:** each companion's own test list passes; the base 60/30/10 roll, the base rescue timing and the base second-rival rolls are unchanged for every seed.

### Phase E11 — Region of Doom II (M)

1. Districts in depth: landmarks, rules, locals; Takeovers with four results.
2. Eight Gyms with arenas, rules and Marks; sixteen placeholder Leaders with lines.
3. Five annexes from the ledger; the Chairperson's five manners; *The Table*; the Vote.
4. Sixteen events; the Mile's catalog; the Pale Garden; the Epitaph.

**Accept:** the three worked ledgers in the expanded Region of Doom document (§X16) generate as described; the district count is always 14; the Doom Level never rises during a visit; the Pale Garden never starts a battle.

### Phase E12 — Balance, accessibility, polish (M)

1. Tune the Extended Cut to the same overall band as the Standard Cut (30–50%), with Phase 6 at 45–65%.
2. Tune Colossus shields by Set, Front lane strength, Convoy pars.
3. Accessibility pass: no state carried by color alone; every timer numeric; announcer lines can wait for input.
4. First-time format cards; `format.cards` setting.
5. Length check: a full Expanded region should add no more than about 40% play time.

**Accept:** telemetry over 1,000 simulated runs per region falls inside the bands; a first-time player in a hallway test can explain the Siege Map after one screen.

---

## X3. Effort summary

| Phase | Size | Depends on | Ships |
| --- | --- | --- | --- |
| E0 Data and settings | S | Base 0 | Nothing visible; everything testable |
| E1 Cast and lines | M | E0, base 4 | Named officers and special Pokémon in ordinary battles |
| E2 Tracks | M | E0, base 3 | A region that visibly changes |
| E3 Events and scheduler | M | E0 | Eight Kanto scenes |
| E4 Formats | L | Base 1 | Six formats in a test room |
| E5 Extended Cut, Kanto | L | E1–E4 | The first full Expanded climax |
| E6 Shadow II | L | Base 6, E4 | Keys, Apex, Reclaim |
| E7 Grand Arc | M | E5, E6 | A stranger with a clipboard |
| E8 Finale | L | E7, E9 (three regions at least) | The island |
| E9 Other regions | XL | E5–E7 | Eight more Expanded regions |
| E10 Companions | L | Base 7B, 7C; E4–E6 | Rival, rescue, Friend, Stand-with, roaming at full depth |
| E11 Region of Doom II | M | Base 9, E8 | The Margin |
| E12 Polish | M | All | A shippable Expanded Edition |

**Smallest shippable Expanded Edition:** E0–E7 for Kanto alone, with `grandArc.enabled` on and no finale. It is one region at full depth, and it proves every system.

---

## X4. Assets

The Expanded Edition is mostly text and rules. Most of what it shows on screen can reuse what the base game already has. This list is ordered **cheapest first**, so that each tier can ship before the next is made.

### X4.1 Tier 0 — nothing new (reuse)

| Need | Reuse |
| --- | --- |
| 110 special Pokémon | Their species' existing sprites. The name and line badge do the work |
| 58 special Shadows | Existing sprites plus the aura overlay from Tier 1 |
| Holding sites, raid annexes | Existing raid maps (base rule) |
| Jailers, runners, locals, placeholder Leaders | Existing generic trainer classes, with a name |
| Track "moments" | Existing overworld scenes with a palette shift |

### X4.2 Tier 1 — small icons and overlays

Small, flat, and reusable everywhere. These are the best first batch for a generator.

| Asset | Count | Notes |
| --- | --- | --- |
| Line badges | 14 | One per variant line; about 16×16 |
| Aura overlays | 15 shapes | One per team method; four depths can be the same shape at four opacities |
| Shadow class and key-type symbols | 4 + 5 | For Field Notes and the purification ring |
| Heart Scar icons | 24 | Tiny; can share 6 base shapes in 4 colors |
| Data ROM icons | 9 | One shape, nine letters |
| Doom Marks | 8 | Badge-like |
| Receipts (Key Item icons) | 13 | One per team; Snag'em leaves none |
| District state markers | 3 | H, C, L, with distinct shapes |
| Format HUD pieces | about 12 | Lane numbers, distance pips, switch counter, part bars, evidence card frame |
| Postcard backs | 8 | One per archetype |

### X4.3 Tier 2 — props and accessories

| Asset | Count | Notes |
| --- | --- | --- |
| Line props on sprites | 14 | A tag, a dark ball, a ribbon, a harness, a lanyard, a star sticker, a spray can. One small overlay per line, placed on any species |
| Apex part overlays | 12 sets | Armor seals, thorn rings, orb links, chains, wedges, petals, veils, feeds, cores, locks. Drawn over existing Legendary sprites |
| Remnant machines | 9 | Small vehicles, one per region; each is a single sprite |
| Track props | about 20 | Two Snorlax on a road, a banner, a frozen bridge rail, a logo sign, a boarded prize counter |
| Region of Doom landmarks | about 42 | Three per district; most are single buildings or signs |

### X4.4 Tier 3 — backgrounds and maps

| Asset | Count | Notes |
| --- | --- | --- |
| Siege Map backgrounds | 10 | One stylised map per climax city, plus the finale. Flat, labelled, no animation |
| Phase 6 arenas | 12 | A roof, a shrine, a crater lake, a peak, a throne room, a flower, a deep, a tower top, a stage, a hall of tanks. Several can reuse climax maps with a lighting change |
| Phase 7 stages | 9 | A road, a waterfall, a pillar, a mirror world, a bridge, a hillside, islands, a pitch, an auditorium |
| New raid sites | 20 | Two per region and two roaming. Each needs one map; reuse tilesets from that region |
| Region of Doom districts | 14 + 5 annexes | Reuse regional tilesets, recolored |
| The Citadark | 1 large | Docks, a climb, a hall, a roof |

### X4.5 Tier 4 — trainer sprites and portraits

These are listed separately because they follow their own pipeline and are not part of the generated batches above.

| Group | Count | Notes |
| --- | --- | --- |
| New named officers and allies with no existing sprite | about 60 | Of the 143 named characters, 80 are canon and many already have references; 18 are original; 45 are what-if versions that need a costume change on an existing character |
| What-if costume variants | 45 | The same person in another team's colors. The cheapest version is a palette and one accessory |
| The player's and rival's team versions | 11 + 11 | One uniform per team, applied to the existing player and rival bases |
| Liaisons | 9 | Cipher's officers |
| Region of Doom placeholder Leaders | 16 | Original characters |
| The Friend | 8 | One per archetype, or reuse the rival system's pool |

**If trainer art is the bottleneck,** every named character can ship first as a generic class sprite with their name and a portrait frame in their team's color. Nothing in the rules depends on unique art.

### X4.6 Audio

| Asset | Count | Notes |
| --- | --- | --- |
| Aura entry cues | 15 | Half a second each |
| Format stings | 6 | One per format |
| Announcer chime | 1 | Plays before every announced effect |
| Track step stings | 5 | Shared by every team; pitch rises by step |
| Apex themes | 1 shared + 12 short motifs | A motif can be four bars over a shared bed |
| Breather music | 1 | Quiet |

---

## X5. Definition of Done (per region, Expanded)

In addition to the base Definition of Done:

- [ ] Track extracted to data; five steps each change something visible and nothing forbidden.
- [ ] Eight story events playable; one anchor; none can end a run.
- [ ] Raids 4 and 5 playable with all five results; their Levers change only what Volume II §X6.2 allows.
- [ ] Phase 0b district table in data; every district shows both lines of text and its reason.
- [ ] Phase 1 format playable; its condition can be ended and lapses at the Breather.
- [ ] Phase 6 Apex playable at Set-1 and Set-9; signature move announced and removed early; ends without a knockout.
- [ ] Phase 7 playable or skippable; cannot end the run.
- [ ] Every named character in the Dossier; every what-if has a way back that works.
- [ ] Every special Pokémon's trait fires with its announcement; obtainable ones can be obtained.
- [ ] Every Named Shadow's key works, and its missed-key fallback works.
- [ ] Liaison beatable; ROM awarded once; farewell note points to the run's real next region.
- [ ] `climax.cut = "standard"` and `grandArc.enabled = false` each leave a complete region.
- [ ] Rival additions (Help, Beat-you, Side-with) and the Stand-with inversion play as the script's §E7.11 says.
- [ ] No unresolved tokens; no placeholder text.

---

## X6. Test plan additions

| Area | Tests |
| --- | --- |
| Settings | Every Expanded setting off → base-identical event log for the same seed. Each setting toggled alone → base seed streams unchanged |
| Tracks | Reducer table tests; floor of 1 while active; ±15% price bound; no enemy-strength effects (static) |
| Events | Density 3/5/8; anchor always; spacing; forced events have both outcomes; none ends a run |
| Scheduler | One item per node; priorities; no starvation; deadlines met |
| Siege Map | Start states from conditions and track; at most three Lost effects; view-only after confirm |
| Blackout | Ends by wins or by three switch actions; always lapses at the Breather |
| Front | Winnable with no allies; holding lanes take hits every second turn at half damage; two lanes decide |
| Convoy | Par shown; meter moves by one; escape is never a loss by itself; never more than five battles |
| Colossus | Shields by Set; two-thirds rule above five parts; body HP constant; signature move within first two parts; timer loss is a climax loss except at the finale |
| Debate | Three, two and fewer wins resolve correctly; evidence never consumed |
| Extended Cut | 13–18 battles; two save points; no retry; Standard Cut untouched |
| Raid bound | Total Operation Strength change from five raids within ±2 |
| Cast | Every what-if has a reachable way back; `rocket.x.triad` swap |
| Lines and traits | 14 rules and 110 traits announced before effect; +20% and +30% caps hold |
| Shadow II | Hesitation 5% ± 1; Gripped 15% ± 1; end-of-turn tier; 44 keys; Reclaim once per region per team; Snag refusals |
| Grand Arc | ROM routes; late ROMs open tanks only; any-order: every region playable first, last and alone |
| Finale | Three, five, nine ROMs; loss does not end the run; ledger writes |
| Companions | Each companion's own list |
| Region of Doom II | 14 districts always; annex exclusivity; worked ledgers; Garden safety |
| Content | `build_expansion.js` passes; verifier sections 15 and 16 pass; every Species cell in every expanded document is in the Pokédex |

---

## X7. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| The Extended Cut is too long | It is a setting, changeable at any Last Rest. The Breather and two save points are mandatory. Phase 7 is optional. Target: 13–18 battles, never more |
| Six formats are six ways to confuse people | One-screen cards; ordinary battles underneath; each format introduced alone in its first region; a hallway test in E12 |
| The Front's interface is the hardest job | Build it last in E4. If it slips, Alola's and Galar's Phase 7 can ship as a three-battle gauntlet with the same story, and the Stand-with Cavalry as three duels |
| Cast volume outruns art | Tier 4 fallback: generic class sprites with names. No rule depends on unique art |
| What-if Gym Leaders divide players | Per-region switch, already present in Kanto; add one per region if playtests ask for it |
| The Grand Arc makes single-region runs feel incomplete | Every region is written to stand alone; with fewer than three ROMs the game says nothing about a finale |
| Any-order breaks under real seeds | `readCarried` forces a default at every read; test each region first, last and alone |
| Special Pokémon balance | Traits are flavor-first; line rules are budgeted like held items; both count toward the +30% cap |
| The parser extracts rosters only | Tracks, districts, phase tables and Apex parts are in fixed-shape tables already; extraction is listed as work in E2, E5, E6 and E9 |
| Scope | The smallest shippable slice is Kanto alone (X3). Everything after it is additive |

### X7.1 What to cut first, if something must be cut

| Cut | Cost |
| --- | --- |
| Debate → a single duel | Paldea loses its best scene and nothing else |
| Front → gauntlet | See above |
| `lead`-mode Extended Cuts for the roaming teams | `lead` mode falls back to the base adapters |
| Region of Doom annexes | The Margin still generates; finale results show as lines of dialogue only |
| Loyalty Job "catches" | The Stand-with route loses its conscience. Cut last |
| Story event density to 3 | Shorter regions; the anchor events remain |

Do **not** cut: the Breather, the save points, the announcements, the Standard Cut, or the off switches. Those are the fairness promises.
