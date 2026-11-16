# Catalog Overhaul, batch 5 row B: pseudo-stage worlds and the rift (33 legends ids)

Branch `claude/project-thread-wmnqkl`, PR into `ui-mockups` (the lead combines batch 5). Status file: `src/data/catalogOverhaul/status/legends.json` (all 33 `built`). No save bump.

## What was wrong
The five Legendary worlds (Distortion Incident, Distortion World, Dreamscape, Ancient Wilds, Celestial Expanse) existed as pseudo-stages, but the legends questlines had retired every door into them (`ev-distortion-rift`, `ev-dimensional-collision`, `ev-dream-orb`, `ev-ancient-discovery`, `ev-star-path`), so no run could reach them. Their Legendaries were missing too.

## What was built
- **Five new doors** (`tools/events/co/legends-13.ts`, pseudo doors, so 1 per region and 2 per run): A Wrong Sky (Distortion Incident), Where Two Places Touch (Distortion World), A Dream That Is Not Yours (Dreamscape), Area Zero's Edge (Ancient Wilds), A Stair of Light (Celestial Expanse). Each offers a way to walk on.
- **The worlds' Legendaries** (`src/data/pseudoStages.json`, new `rare` list): Giratina in both Distortion worlds' rare rooms; Darkrai and Cresselia as two optional fights in the Dreamscape's last room; Koraidon in the Ancient Wilds' rare room and seven ancient paradox Pokémon in its wild list; Rayquaza and Deoxys in the Celestial Expanse.
- **Guidance of Giratina:** in a run with that Whole Run Event the Distortion gates and doors read as the Division's rifts (choice memory `guidance`).
- **The Renegade (Giratina, Primordial)** in `blessings.json` with `pool: false`: never rolled at run start (no seed moves), only offered by **The Rift Whisper** mid-run. Accepting swaps the run's blessing for it (`takeBlessing` effect, `core/blessings/index.ts`); Dialga's rewinds leave with Dialga's blessing. Price: Ghost-types more common (`balance.renegade.ghostEncounterWeight` 1.5). With Blessings off, the bargain is the old relic.
- **The Reverse Side** (`core/legends/reverseSide.ts`, `stepToReverseSide` in `run.ts`, a "Reverse Side" button in battle): once per stage, step out of a battle that is not a boss's. Nothing is won or lost; the node then holds the gate of Distortion Incident, then Distortion World the next time. Pseudo-stage caps still hold (past them, only the step-out).
- **Faller 3 Ultra Space door:** the Celestial Expanse's rare room has "Climb past the last star" at `faller-rank` 3, which opens one Ultra Beast home world.
- **Rival Ambush, Pseudo Stage form:** a chain (`ps_rival_ambush`, The Ambush Meadow): the ambush opens a duel or a chase (Speed check), both reach the far side. Rival fights are friendly: a loss never ends the run.

## Re-read table (doc line, what the game does now)
| Ids | Doc rule | Built as |
|---|---|---|
| mr-rift-whisper | Giratina's Primordial bargain (The Renegade) offered mid-run | The Rift Whisper offers The Renegade; accepting replaces the run's blessing |
| dz-rival-ambush | Rival Ambush (Rival spec, Pseudo Stage form) | Chain pseudo-stage with duel, chase and far side rooms |
| ps-distortion-incident-*, ps-distortion-world-* (13) | Giratina pseudo stages; in Guidance of Giratina they are the rifts; with The Renegade they are the Reverse Side | New doors; Giratina in rare rooms; Guidance variants on gates and doors; the Reverse Side opens these gates |
| ps-dreamscape-* (6) | Darkrai and Cresselia pseudo stage | New door; Darkrai and Cresselia fights in the last room |
| ps-ancient-wilds-* (6) | Koraidon and paradox pseudo stage; ties to Area Zero's Edge | The door is Area Zero's Edge; Koraidon rare room; paradox wild list |
| ps-celestial-expanse-* (5) | Rayquaza and Deoxys pseudo stage; an Ultra Beast home-world entrance at Faller 3 | New door; Rayquaza and Deoxys rare room; Faller 3 home-world choice |

## Known limits
- The Renegade's Communion (see every node's reverse side) and its Rite (a mirror stage) are not built (documented in `blessings.json`).
- The Reverse Side does not work in event battles, rival, raid, totem or finale fights: a story waits on their result.
- Tests: `tests/unit/coLegendsWorlds.test.ts` (14). The co gate test now also accepts pseudo-stage gates and rooms as built (they are made by code from `pseudoStages.json`).
