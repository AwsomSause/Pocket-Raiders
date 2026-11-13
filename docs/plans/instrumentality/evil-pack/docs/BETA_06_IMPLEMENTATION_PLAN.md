# BETA 0.6 — IMPLEMENTATION PLAN

*Ordered so each phase ships something playable. Estimates are rough effort sizes (S/M/L), not calendar time. Systems reference `BETA_06_SYSTEM_ARCHITECTURE.md`; content references `scripts/` and `data/`.*

---

## Phase 0 — Foundations (S)

1. Add seeded RNG streams (`rng.ts`) with named purposes (`rival-climax`, `ambush`, `doom`).
2. Extend the Run Event Log with the new event types (no behavior yet).
3. Add `schemaVersion` + migration scaffolding for Arc and Faction state.
**Accept:** same seed → identical event sequence in a replay test.

## Phase 1 — Pseudo Stage + Pseudo Region runtime (L)

1. Implement `PseudoStage` scheduler (`insertAfter`, does not advance `stageIndex`).
2. Implement `PseudoRegionRuntime` (load, enter, checkpoint, exit, dispose).
3. Build one **test PR** (`pr.test.box`) with a gauntlet, a timer and an exit.
**Accept:** entering and leaving a PS leaves `stageIndex` unchanged; the party state is restored; **no-dead-end test** passes for every checkpoint.

## Phase 2 — Heat, Intel, OS and Pursuit (M)

1. Faction state, `awake` flag, Ignition trigger.
2. Ambush roll (§4 of the architecture), tiers, pity rule, caps, Decoy Tag.
3. Ambusher selection from `ambush_lines.json`; show intro/defeat lines.
**Accept:** simulation of 10,000 regions respects min gap 2, pity at 7, cap 6; mean ambushes per region within 3–5.

## Phase 3 — One vertical slice: Kanto (L)

1. Compile `scripts/01_*.md` into data (acts, raids, climax, dialogue).
2. Raid 1 and Raid 2 as `PS-RAID` with results and the consequence menu (C1–C11).
3. News report A/B, the Choice, `PS-CLIMAX` with phases 0–5.
4. Rival 60/30/10 roll and the three variants (Help, Beat-you, Side-with).
5. Aftermath, Doom Ledger entry.
6. Defeat ending (run ends), Last Rest node, readiness label.
7. Rescue Plan: Impound tracker, `PS-RESCUE`, offers, all 8 archetypes' dialogue.
**Accept:** a full Kanto arc is playable from Ignition to Aftermath in all three rival variants and both climax choices, plus the defeat ending; an Impound is recoverable through the rival's plan; no softlocks.

## Phase 4 — Hierarchy, roles and rosters (M)

1. Tier ladder (0–7), roles, promotion/demotion.
2. Commander Operation Traits, Executive Abilities (announced, counter slot), Leader Doctrine (≤10%).
3. Load rosters for all 14 teams.
**Accept:** every authored member loads; every Trait/Ability is announced in battle UI; no hidden modifiers.

## Phase 5 — Remaining regions (L, parallelizable)

For each of Johto, Hoenn, Hoenn (+Magma), Alola (+Aether), Galar (+Yell), Unova, Kalos, Alola, Galar, Paldea: compile the script, build the Raid PRs and the Climax PR, wire regional hooks (Legendary Sightings, regional forms), art/audio pass.
**Accept:** each region passes the script verifier and the vertical-slice playthrough checklist.

## Phase 4B — Roaming Team Module (M)

1. Placement modes (`default`, `seeded`, `chosen`, `stress`).
2. The four RTM beats and the three stances.
3. Load all 18 kits.
**Accept:** every `(team, region)` pair plays; the caps (+1 battle, ±1 OS) hold in a 1,000-seed simulation.

## Phase 6 — Shadow Pokémon (M)

1. Shadow record, tiers, Surge, Hold, disobedience notices.
2. Shadow moves (14) and abilities (20).
3. Seven purification methods; Heart Scars; Mentor Bind.
4. Permanent-member rules (`SHADOW_POKEMON_SYSTEM.md` §12): Shadow slots, Stability, Release and Keep.
**Accept:** the Shadow test checklist passes; a run with zero Shadow use remains winnable; a Fallen Pokémon can be kept for a whole run without breaking any battle rule.

## Phase 7 — Reputation, Inside Man, betrayal (M)

1. Reputation −100…+100, seven states.
2. Inside Man route for every canon team (Hoenn: Aqua or Magma) with its own scenes, including the raid fork ([Sabotage from inside] vs [Run the job]).
3. Mercy values and betrayal outcomes.
**Accept:** reputation changes persist through a run; Inside Man never makes the climax impossible.

## Phase 7B — Stand with them (L)

1. `PS-CLIMAX-ALLIED` runtime: Phases 0–5 (memo and Last Rest, Hold the Line, Carry Out the Plan with timer, The Rival, The Defender, The Verdict).
2. Allied Strength tracking and Loyalty Jobs; eligibility gate (reputation ≥ +45).
3. Nine team scripts from `scripts/10_STAND_WITH_THEM.md`; rival roles for the 60/30/10 variants; three endings (Rise / Take the Throne / Turn); Allied-Occupied aftermath.
4. Doom Ledger values and Region of Doom pre-clear.
**Accept:** every rival variant × every ending resolves; Turn never softlocks; an allied defeat ends the run like any climax defeat.

## Phase 7C — Second rival (S)

1. Presence, archetype and role rolls on isolated RNG streams (architecture §5A).
2. Meet and Mid encounters; attitude track; four memory kinds.
3. Climax Support/Caught (including the Rescue objective), Rescue Plan join, Stand-with plea and reaction.
4. 88-line bank from `docs/SECOND_RIVAL.md`.
**Accept:** the primary 60/30/10 split is unchanged with or without the second rival; total Assist never exceeds 4.

## Phase 8 — Operations, missions, world events, conflicts (M)

1. Content loaders for 100 operations, 60 missions, 100 world events, 40 internal conflicts.
2. Faction relations 12×12 and diplomacy.
3. Event scheduling (Run mode: light; World mode: full).
**Accept:** no event fires with missing data; each event has a cause, an effect and a log entry.

## Phase 9 — Persistence and the Region of Doom (L)

1. Run / Save-World / Doom Ledger layers with migrations.
2. Region of Doom generator (14 districts, 8 Gyms) and takeovers.
3. Doom Epitaph screen.
**Accept:** generator determinism and fixture tests; skipping RoD has no effect on the main game.

## Phase 10 — Balance, accessibility, polish (M)

1. Tune to win-rate bands: ambush 55–75% win; raids 50–70%; climax 40–60 / 35–55 / 30–50 by OS band.
2. Accessibility pass for news reports (captions, flash limits, skip rules).
3. Telemetry-driven adjustments.

---

## Test plan (high level)

| Area | Tests |
| --- | --- |
| RNG | Same seed → same ambushes/variants; stream isolation |
| Rival roll | Distribution over 100k seeds: 60±1 / 30±1 / 10±1 |
| Second rival | Presence 50±1%; archetype ≠ primary; Support/Caught 70/30 when unforced; forced Support for Beat-you/Side-with; Assist total ≤ 4; primary roll unchanged by the second rival |
| Stand with them | Button hidden without the flag, locked below +45; Loyalty Job failure never applies C1–C11; `alliedBattles` ∈ [3,6]; every rival variant × ending resolves; Take the Throne needs ≥ +70 |
| Scheduling | Climax after Gym 6–8; clamped for short regions; never before `N-2` |
| Pseudo Stage | `stageIndex` unchanged; no-dead-end; Fall Back once; wipe → failure not run-end |
| Raids | Every result × every consequence applied; bounded effects (±2 OS tiers, ±1 phase condition, ±1 gauntlet floor) |
| Rescue Plan | `planDueAt` in [impound+9, impound+11] or the last quiet node; same seed → same wait and roll; no number shown; legal party after Full/Partial/Fail |
| Climax loss | Defeat ends the run; Doom Ledger `triumphant`; impounded recorded as lost; `allowWithdraw` off by default |
| Returning teams | 18 kits load; placement modes; caps hold in any region |
| Climax | News A vs B; Choice; Stay Out resolution table; defeat handling |
| Shadow | Tier boundaries, Surge, Mentor, purification methods, release |
| Persistence | Migrations; ledger never loses entries |
| Content | Script verifier (headings, ≥2 raids, news A and B, rival variants, ambush table) |

## Definition of Done (per team)

- [ ] Script compiled; verifier passes.
- [ ] Raid PRs 1, 2 (and 3) playable with all five results.
- [ ] Climax PR playable in three rival variants × two choices.
- [ ] All dialogue present; no placeholder text.
- [ ] Doom Ledger entry written for each ending.
- [ ] Art/audio notes implemented or ticketed.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| PS/PR scope balloons (many unique maps) | Reusable PR kits (gauntlet, hostage, timer, set piece); only 3 unique maps per region |
| Climax feels too long | Target 8–12 battles; Fall Back/Extract; skippable dialogue after first view |
| Raid loss feels punishing | Consequence menu with recovery routes; Failure always offers a next step |
| Rival variants feel samey | Archetype × variant matrix and the 72-line bank |
| Content volume | Compile from Markdown into JSON; verifier catches gaps early |
| Legal | All characters, teams and dialogue are original; canon leaders only referenced |
