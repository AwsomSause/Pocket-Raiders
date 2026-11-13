# Beta 0.6 — "You Are (Not) Alone" — Content & Design Pack (Canon Edition)

Your Beta 0.6 text, rewritten and expanded, plus the additions you asked for: an evil team in every region, a scripted story and full dialogue for each, raids and a climax built on Pseudo Regions and Pseudo Stages, post-ignition ambushes, a rank hierarchy, and a rival who appears in every climax (60% help / 30% beat you there / 10% side with them). Also in this version: a **Stand with them** route (fight the climax *for* the team), a **second rival** in some regions, and, new in this edition, **the canon teams, leaders and members**, plus **Team Snag'em** and the recurring trio **Jessie, James and Meowth**.

## What changed in the canon edition

- **The nine invented teams are gone.** Every region now has its canon team: Kanto **Team Rocket**, Johto **Team Rocket (Return)**, Hoenn **Team Aqua and Team Magma**, Sinnoh **Team Galactic**, Unova **Team Plasma** (Black 2 / White 2 era), Kalos **Team Flare**, Alola **Team Skull and the Aether Foundation**, Galar **Macro Cosmos and Team Yell**, Paldea **Team Star**.
- **Canon leaders and members** (Giovanni, Archer, Archie, Maxie, Cyrus, Ghetsis, Lysandre, Guzma, Lusamine, Chairman Rose, Cassiopeia and the rest) appear with their ranks, roles and signature Pokémon.
- **Team Snag'em** (Gonzap, Wakin, Biden, Agrev) and **Rocket Remnants** (Jessie, James, Meowth, Butch, Cassidy, Domino) live in `scripts/00_ROAMING_CAST.md`. Either can be placed in any region as a second faction, Snag'em can also be a side faction in half of the regions, and either can lead a region in the opt-in `lead` mode.
- **The recurring trio** (Jessie, James, Meowth) are Rocket low-rankers in Kanto and Johto and turn up in every region as comic ambushers, uneasy allies and Stand-with wildcards (Sighting / Collision / Cache / Cameo).
- Everything that depended on the old teams was rewritten: Stand With Them, Shadow methods, the Rescue Plan holding sites, the Region of Doom districts, the relations matrix, the data build and the verifier.

## New in this edition: Pokédex pools, boss teams and run events

- **Trainer pools from your Pokédex.** Nine Sets (Set-1 to Set-9) and 50 sub-sets (a new one every ten levels, no levels printed in the pool files). Every sub-set has a Grunt pool and Specialist, Lieutenant, Commander, Executive and Second pools for each of the 14 teams, plus a generic pool and Mega options. `docs/TRAINER_POOLS_AND_BOSSES.md`, `docs/pools/SET-1.md` to `SET-9.md`, `data/trainer_pools.json`.
- **Extremely hard boss teams.** Thirteen bosses, a new team in every sub-set (650 teams): bigger parties, a growing ace, legendaries from Set-4, full type coverage, and stacking hard-mode rules. `data/boss_teams.json`.
- **102 run events beyond raids and the climax:** 43 forced events (each with a way out) and 59 encounters, plus the director rules that schedule them. `docs/RUN_EVENTS.md`, `data/run_events.json`.
- **I renumbered your Sets.** Your list had two "Set-7" entries and overlapping last bands (401–451, 451–500). I used Set-7 as 351–400, Set-8 as 401–450 and Set-9 as 451–500. If that is wrong, change `SETS` in `tools/pools_config.js` and rebuild.

## Please read: what is canon and what is not

- **Characters, ranks and plots are canon; dialogue and scenes are original.** I did not copy script text from the games or the anime. Only a few very short catchphrase fragments appear.
- **The Pokémon species lists are my recall, not a checked source.** They are marked "(approximate)" or "(anime)". Bulbapedia's team tables would not load for me, so I could not verify them. Please check them before you ship (Rocket, Aqua, Magma, Galactic, Plasma, Flare, Aether, Macro Cosmos and Star rosters especially).
- **Some roster entries are generic and marked "generic; not canon"** (for example Team Yell's Cheer Captain and Chant Leader), because the games give those teams almost no named members.
- N, Wes, Marnie and Cipher are **NPCs or off-screen backers**, not roster members.

## Start here

1. `docs/BETA_06_DESIGN_DOCUMENT.md`: the master design (read §0.2 and §0.2b first: the assumptions I made and the decisions you confirmed).
2. `scripts/`: nine regional team scripts, plus `00_ROAMING_CAST.md`.
3. `docs/CLIMAX_RIVAL_INTEGRATION.md`: the 60/30/10 rival rules and the 72-line rival bank.
4. `docs/STAND_WITH_THEM.md` and `scripts/10_STAND_WITH_THEM.md`: the Inside Man climax, with nine regional versions (Hoenn covers Aqua *or* Magma).
5. `docs/RETURNING_TEAMS_ANYWHERE.md`: the roaming teams, placement modes and 18 kits.
6. `docs/SECOND_RIVAL.md`: the second rival and its 88-line bank.

## Layout

```
docs/       design document, rival integration, Rival Rescue Plan, Roaming Teams Anywhere, Shadow Pokémon, Region of Doom, Stand With Them, Second Rival, system architecture, implementation plan, TRAINER_POOLS_AND_BOSSES.md, RUN_EVENTS.md, pools/SET-1..9.md
scripts/    00 roaming cast + 01–09 regional stories (14 teams): acts, dialogue, ambush lines, raids, news reports, climax, rival variants, endings; plus 10_STAND_WITH_THEM.md (the nine allied climaxes)
data/       JSON catalogs for the game (see counts below), including trainer_pools.json, boss_teams.json, run_events.json and source/pokedex.json (your Pokédex)
tools/      parse_scripts.js, build_beta06.js (builds data/), pools_config.js + build_pools.js + build_pool_docs.js (pools and bosses), events_source.js + build_events.js (run events), verify_beta06.js (about 1,370 checks)
```

Rebuild and verify: `cd tools && node build_beta06.js && node build_pools.js && node build_pool_docs.js && node build_events.js && node verify_beta06.js`
(No dependencies; `tools/lib.js` is bundled.)

## Your requirements, and where each lives

| You asked for | Where |
| --- | --- |
| Every region has an evil team | Canon teams, one set per region: design doc §3.1 |
| Canon teams, leaders and members; Team Snag'em; Jessie, James and Meowth | `scripts/01…09` (canon casts), `scripts/00_ROAMING_CAST.md` (trio and Snag'em), `data/roster.json` |
| Returning teams can be placed in any region (D3) | `docs/RETURNING_TEAMS_ANYWHERE.md` (placement modes, 18 kits); Snag'em also has a side-faction mode |
| A scripted story with a huge climax for each | `scripts/01…09` |
| Use Pseudo Regions and Pseudo Stages | Design doc §2; every raid and climax has a `pr.<region>.<site>` id; architecture §6 |
| After the player sets the team off, a chance to force a battle after a node | Design doc §4.3; ambush odds `clamp(0.10 + 0.002·Heat, 0.10, 0.30)`, min gap 2, pity at 7, cap 6 |
| Hierarchy and roles | Design doc §5; `data/ranks.json`, `roles.json`, `org_templates.json`, `roster.json` |
| At least two optional raids before the climax; they shape the climax; losing is allowed with heavy consequences | Design doc §6; two raids plus a conditional third per team; 31 raids in `data/raids.json`; consequence menu C1–C11 |
| The climax always involves a rival | Every script §10.8 and `CLIMAX_RIVAL_INTEGRATION.md` |
| 60% help / 30% beat you there / 10% side with them | Rolled once per region from a seeded RNG (architecture §5); the verifier checks the split over 100,000 seeds |
| Climax after the 6th–8th Gym leader | Design doc §3.3; rolled from {6,7,8}, clamped for regions with fewer Gyms |
| Losing the climax | Ends the run (your decision). Defeat ending in every script (§10.11); rival defeat lines `CLIMAX_RIVAL_INTEGRATION.md` §13 |
| Opens as a news report; choice to fight or stay out; report mentions a rival who beat you there | Every script §10.1–10.3 (News A and News B). Inside Men get an internal memo and a third choice, **Stand with them** |
| The evil teams' own dialogue | Every script: Act 0 rumors, Ignition, ambush tables, raid scenes, climax speeches |

## Counts

| Item | Count |
| --- | --- |
| Teams (9 primary canon + 3 second canon + 2 roaming) | 14 |
| Named roster entries | 96 (5–12 per team; the canon casts are small by nature) |
| Ambush lines | 420 total: 111 authored in the scripts + 309 generated stubs (30 per team minimum) |
| Raids | 31 (27 regional, 3 per region with the third conditional, plus 4 for the roaming teams) |
| Operations / Missions / World events / Internal conflicts | 100 / 60 / 100 / 40 |
| Faction relations | 15 × 15 (14 teams + League/Authorities) |
| Shadow Pokémon | 14 moves, 20 abilities, 7 purification methods, 14 team binding methods; permanent party members allowed |
| Rival Rescue Plan | 14 stages × 8 archetypes = 112 lines, 3 plans, 14 holding sites |
| Roaming-team kits | 18 (2 teams × 9 regions) |
| Rival defeat lines / defeat endings | 24 / 9 |
| Stand with them | 9 allied climaxes (Hoenn covers Aqua or Magma), 27 endings (Rise / Take the Throne / Turn), 48 rival lines + 8 defeat lines |
| Second rival | 8 archetypes × 11 lines = 88 |
| Region of Doom | 14 districts, 8 Evil Team Gyms, 16 placeholder Leaders |
| Trainer pools | 9 Sets, 50 sub-sets × (14 teams + generic) × 6 tiers, Mega options for Executive/Second |
| Boss teams | 13 bosses × 50 sub-sets = 650 teams, with 9 stacking hard-mode rules |
| Run events | 102 (43 forced, 59 encounters) in 15 categories |
| Written material | about 72,000 words of docs and scripts, plus the generated pool and event documents |

## What is hand-written and what is generated

- **Hand-written:** the ten scripts (story, dialogue, characters, raids, news reports, rival variants), the design, rival, Shadow, Region of Doom, architecture and implementation documents, ranks, roles, templates, consequences, and the faction-relation overrides.
- **Parsed from those:** teams, roster, authored ambush lines, raids, Shadow data and Region of Doom districts. The Markdown is the source of truth.
- **Generated from curated parts (flagged `source: "generated…"`):** the 100 operations, 60 missions, 100 world events and 40 internal conflicts are built from hand-written category templates plus hand-written one-line specifics, with seeded codenames. They are usable as a first pass, not polished prose.
- **Generated stubs:** 309 of the 420 ambush lines. They are grammatical and on-theme but generic. Each team's authored lines are better; polish the rest by hand (they are labelled `generated-stub`).

## Honest limits

- **Canon species lists are unverified** (see above).
- Numbers (win-rate bands, Heat curve, OS effects, Corruption tiers) are launch defaults for tuning, not tested balance.
- No pseudo-region maps, art, audio or game code exist; this is design, writing and data.
- The scripts follow one template on purpose, so tooling can read them. Each has its own characters, setting and twist.
- Some plots are adapted rather than retold: Unova is set in the Black 2 / White 2 era, Alola treats Skull as Aether's decoy, and Team Star is deliberately not villainous at heart.
- Pseudo Region and Pseudo Stage were not defined in your files. I defined them (design doc §2). If you meant something else, §2 is the place to change.

- **Pools and bosses.** Team signature species and themes are recalled from the games and anime, not checked. The Pokédex has no moves or items, so items and roles on boss teams are suggestions and moves are left to you. Custom, Delta and Paradox forms are used by stats and type, so some picks fit the theme only loosely. Boss teams average about 15–25% more BST than the same team's Grunt pool (about 40% in Set-1); the rest of the difficulty comes from party size, legendaries, coverage and the hard-mode rules. All numbers are launch defaults.
- **Run events.** Chances, budgets and effect numbers are launch defaults; choices like "a node of safe travel" name the idea and leave the exact rule to the implementer.

## Decisions you confirmed

1. **Losing the climax ends the run.** Design doc §7.8. The "Stay out" choice, a readiness label and a Last Rest node are the player's protection. An optional `climax.allowWithdraw` setting exists but is off.
2. **Impounded Pokémon:** about ten nodes after the Impound (9–11, seeded), or at the last quiet node before the climax, whichever comes first, your rival arrives with a plan to get them back. Three plans (Quiet Extraction, Loud Grab, The Deal), dialogue for all 8 rival types.
3. **Returning teams can be placed in any region.** Now the two roaming teams: Rocket Remnants (default Kanto) and Team Snag'em (default Unova).
4. **Regions with fewer than 8 Gyms/Trials clamp** the climax roll to the last three.
5. **Shadow Pokémon can be permanent party members**, with a two-slot cap on Tier 3–4, a Stabilize option, and a Heat cost from the binding team.
6. **"Stand with them" ships at launch.** The Inside Man can fight the climax for the team: `docs/STAND_WITH_THEM.md`, `scripts/10_STAND_WITH_THEM.md`. Available to anyone who joined a team at Ignition with reputation of at least +45. Three endings: **Rise** (become an Executive), **Take the Throne** (needs +70; fight the Leader and run the team), **Turn** (switch sides at the last moment). Every canon team offers the Inside Man route; in Hoenn you choose Aqua or Magma at Ignition, and Team Yell's flag is a comic one that does not unlock the allied climax.
7. **Persistence is per-run**, with the Doom Ledger always on. A World Save stays optional.
8. **A second rival exists** in some regions (about half). A friend with a different personality who supports you at the climax (70%) or gets captured and needs rescuing (30%), and never betrays you. `docs/SECOND_RIVAL.md`.
9. **`climax.allowWithdraw` stays off.** It is an optional setting that would let a player pull out *between* climax phases once the fight has started. A withdrawal would count as "Stay out", one band worse, with no emblem. With it off, choosing "Take them on" is a commitment.
10. **Canon lineup (this edition):** the canon teams above; Snag'em as a returning team plus a side faction in regions that already have an evil team; the trio as a recurring cast across regions; the nine invented teams removed entirely.

## Assumptions still in force (design doc §0.2)

A2 definition of PR/PS · A3 "sets off" means the Ignition scene · A5 "beat you there" is not run-ending · A7 persistence is per-run with an always-on Doom Ledger (confirmed).

## Still open

Nothing is left as a question. The canon species lists need a human check, and the numbers (difficulty bands, Allied Strength, Heat, the Assist cap) are launch defaults for tuning, not tested balance.
