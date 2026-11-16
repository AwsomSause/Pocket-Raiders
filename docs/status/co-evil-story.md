# Catalog Overhaul Pack: evil-story (row 8)

Source: `STORY_FAMILIES_13.md` (the region-by-region Evil Team storyline) and `STORY_FAMILIES_18.md` (the merged evil-team events and the last leftovers). 319 catalog ids, all built (318 built, `ev-hidden-hideout` merged into `ps-evil-hideout-gate`). Save: none (everything new lives in run flags `ev:*` and the existing `story.evil` block).

## What's built
- **One team per region** (`core/evil/teams.ts`): each region gets its home team (`evilTeams.json` `home`), one story step per stage: Suspicious, Evidence, Recognized, Ambush, Rising Star, Trouble Inside, Nemesis, The Plan, the Hideout, A Legend Stirs. Modules `tools/events/co/evil-story-1.ts` (steps), `-2` (the 64 Operations), `-3` (Hideout rooms, keys, boss, Holding Pen), `-4` (SF130 Operation scenes), `-5` (SF134 leftovers). `_evil-story-sync.ts` writes the team data and the 17 pseudo-stage maps.
- **The Plan** starts all four Operations; the one marked first must be met before the other three. Each Operation has its lasting effect (region modifiers, numbered flags, crisis), stated before the choice.
- **The Hideout** is a pseudo-stage (`ps_evil_hideout_<team>`), drawn like a stage, ending on the Holding Pen, which gives back every Pokémon the team took this run.
- **Operation scenes (SF130)**: after The Plan, one scene from the team's pool shows up per region (mark `scene`). "Stop them." wins mark `op-stopped`, and "stop all four" counts those too. Walking on can cost a Pokémon (`evil` effect `steal`, to the Holding Pen) or put a region modifier on (`mods`, taken off when the region is left).
- **Plasma Holding Camp** is a pseudo-stage (`ps_plasma_camp`: gate, Yard, Handler). Plasma Operations 1 to 3 stay on the weekly Plasma Operation game event (its objectives count them).
- A choice with `pick.types` now needs a Pokémon of one of those types (`core/events.ts`, "Needs a Bug or Grass-type Pokémon").

## Team Rocket from inside (Volume III)
- **Engine** (`core/evil/inside.ts`): run flags `team-<id>-standing` / `-suspicion` / `-rank` (0–10, 0–10, 1–6; rank also rises at Standing 2/4/6/8/10), marks `inside`, `inside-man` (+1 to each Suspicion rise), `careful`, `third`, `confided`, `loyalty-test`, `found-out`. All cleared when the region's story closes. Evil conditions gain `inside`, `rank`, `standing`, `suspicion`, `suspicionBelow`, `anyRoute`; effects gain `standing`, `suspicion`, `rank`. Rank titles per region in `evilTeams.json` `routes`.
- **The swap:** on the inside route the outside beat≥2 steps, Operations and heat events are hidden (`replacedByInside`); the Acts move the beat instead. A team with `third` loses its Hideout (beat 6) to the third option's climax. Scenes for anyone set `anyRoute`.
- **Kanto** (`evil-story-6/7/8`): the Offer after The Files, Acts 1–5, six Operations, Fridays, the loyalty test (Suspicion 7–9) and being found out (10), the Final Choice on Silph's eleventh floor, four endings as chain maps (`ps_rk_plan/turn/police/own`), Team Ledger (founding, three audits, The Read-Out), R1–R11.
- **Johto** (`evil-story-9/10/11`): the Offer after Slowpoke Well, Acts 1–5 (Act 3 is the `ps_neo_tower` map), six Operations, Fridays, K2–K4, loyalty test and found out, the Final Choice at Noon, four endings (`ps_neo_plan/turn/lance/own`), Team Static (founding, three broadcasts, Two Frequencies: `ps_static_mary`, `ps_static_air`), J1–J12 and the ring given back.
- "Take it all" ends the team story as allied and does **not** open Evil Mode (on hold, Kice). Its Evil Mode choices are flags only.
- Tests: `tests/unit/rocketInside.test.ts`.

## How to add a team
1. Add it to `TEAMS` in `tools/events/co/_evil-story-teams.ts` (names, lieutenant, colleague, four Operations with `stated` effects and another way, boss lines) and to `evilTeams.json` (ranks, sprites, species).
2. Give it a `home` region and its Operations' lasting effects in `_evil-story-sync.ts`, then run `node tools/events/co/_evil-story-sync.ts` and `npm run co:build`.
3. Optional: a variety pool in `evil-story-4.ts` (scenes gated `{ kind: 'evil', team, after: 6, ends: ['none'], lacks: 'scene' }`) and a Holding Pen site in `rivalRescue.json` (without one, `steal` takes nothing).

## Flags other rows read or write
- Written here: `team-<id>-<mark>` (files, quiet, op-stopped, lt-out, defector-colleague, pen-open, legend-seen, scene, pen-extra, ...), `intel`, `rep`/`rep-lost`, `kind-total`, `sign-<species>`, `calmed-alpha`, `crisis-<strand>-start`, `region-diglett-gone`, `region-sun-vent`, `region-no-balls`, `region-tired-wild`, `gravity-next-node`, `next-node-slow`, `center-tagged`, `daycare-egg`, `dynamax-spot`, `biscuit-home`, `coach-style-<x>`, `pettigrew-karp`, `rocky-wish`, `promise-jirachi-broken`, `final-chant-joined`, `final-want-<x>`.
- Read here: `front-exposed` and `evil-talk-down` (people/markets), `shelf-kit`/`shelf-kit-address` (SF50), `promise-jirachi`, `lockpicks`, `hideout-key`.

## Re-read table
| Catalog ids | Doc and section | Checked |
|---|---|---|
| 224 SF13 ids: 16 teams × steps, 64 Operations, Hideout entry, boss, after, pen | `STORY_FAMILIES_13.md` Parts A to E | 2026-11-15 |
| SF131 rooms, SF132 keys, SF133 Holding Pen | `STORY_FAMILIES_18.md` lines 106 to 193 | 2026-11-15 |
| 47 SF130 scenes | `STORY_FAMILIES_18.md` lines 14 to 105; scripted check: every doc id is built and has "Stop them." (the Yard and the Handler are rooms with the doc's own two choices) | 2026-11-15 |
| Kanto inside: Offer, Acts, Ops, Fridays, tests, Final Choice, 4 endings, Ledger, R1–R11 | `EVIL_TEAMS_VOLUME_3_A.md` Kanto; `TEAM_ROCKET_KANTO_FULL_1..3.md` | 2026-11-16 |
| Johto inside: Offer, Acts, Ops, Fridays, K2–K4, tests, Noon, 4 endings, Static, J1–J12 | `EVIL_TEAMS_VOLUME_3_A.md` Johto; `TEAM_ROCKET_JOHTO_FULL_1..3.md` (Part E placement, Part F flags) | 2026-11-16 |
| 6 SF134 ids | `STORY_FAMILIES_18.md` lines 194 to 286 (Fire Week, SF134.6, belongs to the calendar row) | 2026-11-15 |

## Limits
- "(a node)" costs show in the label but take no node until `takeNode` is on the shared branch (`TAKE_NODE` in `_evil-story-kit.ts`).
- Consequences that need systems this row doesn't own are run flags for now, named above: the Diglett line leaving encounters, sun on every road, no Poké Balls in shops, tired wild Pokémon, gravity on the next node, a slower next node, the tagged Center's free heal, the flooded Hideout (+10% Water), the lieutenant's rare item or counter-team, an easier climax after the tide, the stolen accessory. "+1 Pokémon in the Holding Pen" for crates that weren't yours is a mark (`pen-extra`) the pen reads in words only.
- "Bond" is friendship: +1 Bond is +25, "Bond 3 or more" is friendship 150.
- The Disguise's "Nice hat" line at the lieutenant's door isn't shown (that room already has three variants).
- Galactic's Orders: in the region-by-region story all four Operations are already known, so "the Operation is drawn again" becomes heat +1.
- Team Rocket from inside, limits: R12 (Entry 4,113) isn't built (needs memory from an earlier run). "Let her win" and thrown fights are told in text. World state, Rigs, Black Fog, Miner's Lamp, the jingle's world-state drop, the Den-shelved Celebi's lost rest day, the closing-time song letting you past Old Rocket, the ring skipping one of Archer's battles from outside, Static's Hire/Promote/Assign/Dispatch screens and its once-a-region true thing are flags or words only. `rocket-son-found` and `butch-named` have no source, so those two choices never open. Epilogues are said in the ending's last text (no Final Reunion). The loyalty test script, Friday pay (₽500), J6's eight phrases, the Marauder's team (two Dark/Rock Pokémon) and Two Frequencies' thresholds (`kind-total` 8+ most, 4–7 even) are my own fill-ins where the docs give none. Tohjo Falls after "Turn" isn't offered. Story Run's director still adopts outside beat events.
