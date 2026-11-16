# Catalog Overhaul, batch 5 row C: calendar and odds weeks, the Shadow chain, reputation (32 ids, legends)

Built 2026-11-16 on `claude/project-thread-qrlk9b` (PR into `ui-mockups`). Ids from `/mnt/project-files/plans/catalog-overhaul/OPEN_IDS.md` row C; rules from `CATALOG_INDEX.md` and `rules/08_villains.js`, `12_setpieces.js`, `18_calendar.js`.

## What was built
- Engine: `src/core/co/weeks.ts` (`startFlag`, `blessingWeek`, `freeTelling`, `featuredOpenings` week modifiers; `rivalInPseudo`), `src/core/co/shadowChain.ts` (`purifyShadow` effect), `planCoStage(..., featured)` in `co/placement.ts` (a week's `featuredOpenings` and `mapEvents` go first in their tier; no week = old order). `featuredOpenings` ids are checked by the unit test, not by `buildContent`, so the old-seed content in `story.test.ts` (no Catalog Overhaul files) still builds. Hooks: `run.ts` (run start), `dungeon/pseudo.ts` (record and chain pseudo-stages).
- Data: `gameEvents.json` (22 weeks plus z-move-trial: modifiers, featured openings, rule text), `tools/events/co/legends-15.ts` -> `co-legends-15.json` (9 Shadow chain events, `karma-echo`, `co-week-rival`). Status: 10 `built`, 22 `rule` in `status/legends.json`; flags in `flags/legends.json`.
- Tests: `tests/unit/coLegendsWeeks.test.ts` (19). `gameEvents.test.ts` gate test now brings its own copy of an event (it relied on `shadow-triad` being the last raw event no co file overrides). `world.test.ts` lists `co-week-rival` as placed by code. No new screen (events use the New UI event screen), so no new browser spec.

## Re-read table
| Catalog ids | Rule (doc) | Built | Checked |
|---|---|---|---|
| shadow-sighting, -sanctuary, -stabilize, -purified, -outbreak, -stronghold, -black-market, -lieutenant | 08_villains: "The Shadow chain stays and plugs into the pack's Shadow system (Reclaim, purification, the Lieutenant)" | Reclaim = Sanctuary ward (sendAway/bringBack purified, a caged one, crate buy-back); purification = shadowHeart, purifyShadow; Lieutenant = stronghold sets `lieutenant-loose`, beating them frees their Shadow (offered). Never forced (accept prompt). Black market purchases set `evil-funded` (06_merchants) and print the Snag Ball odds | 2026-11-16 |
| shadow-triad | 08_villains: MERGE "Into the Plasma storyline" (the ledger lists SYSTEM via `^shadow-`) | needs `evil` team plasma | 2026-11-16 |
| karma-echo | 12_setpieces: "Reputation readout." | reads `rep`, `rep-lost`, `kind-total`, kept goods (recordOf) and W1 rep categories | 2026-11-16 |
| rivalry-week, roadside-rival-week | "the rival appears in every Pseudo Stage and the Rival Circuit opens" | `circuit-qualified` + `rivalry-week` at run start; `co-week-rival` on the middle column of every pseudo-stage once a rival is met | 2026-11-16 |
| gym-circuit, champions-gauntlet, elite-four-sweep, champion-cup-weekend, gym-rematch-week | "League weeks tied to Past Gym Leaders and Past Champions" (rematch: Leaders) | PC/GL openings (`placement/people.json`) featured | 2026-11-16 |
| raid-rally, world-boss-week, dragon-week, legendary-beasts-chase, tower-of-legends | "raise Legendary questline odds (Beasts, Tower, raids)" | raids = Alpha openings; Dragon = L6, L7, L9, L10; Beasts = legendaryFocus + clue events; Tower = its own floor events | 2026-11-16 |
| plasma-operation, team-rocket-invasion, aqua-magma-showdown, galactic-machination, flare-experiment, aether-rescue | "Evil-team weeks raise that team's odds of being the run's team" | `evilTeamFocus` (plasma added; others had it) | 2026-11-16 |
| mega-evolution-showcase, mega-stone-hunt (and z-move-trial) | 18_calendar: "Raise odds of the Z and Mega Anomaly questlines" (OPEN_IDS grouped showcase with team weeks; the rule file and index say Z/Mega) | M1-M6, Z2-Z7 openings featured; island trials on Z-Move Trial | 2026-11-16 |
| paradox-tide-week | "Legend weeks raise the starting Influence of the matching blessings by 1" | `blessingWeek` Koraidon, Miraidon, Dialga (time) | 2026-11-16 |
| leap-day-special | "... (leap day: one free Telling)" | `freeTelling` | 2026-11-16 |

## Limits
- Koraidon and Miraidon blessings are not in `blessings.json` (10 built), so Paradox Tide lands on Dialga only until they are added. Dialga is my reading of "matching" (Paradox Pokémon come from the past and future).
- QUESTLINES_LEGENDARY L1 (Three Beasts) and L16 (Tower of Legends) are built by families-c (`tools/events/co/families-c-7.ts`, `src/core/events/coLegends.ts`, STORY_FAMILIES_10 Part 0); the weeks raise those events.
- "Raise odds" for placed openings means first claim on the stage's 8-event budget; it does not lift an opening's own `earliest`/`stages`/tags limits.
