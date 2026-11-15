# Catalog Overhaul Pack: evil-story (row 8)

Source: `STORY_FAMILIES_13.md` (the region-by-region Evil Team storyline) and `STORY_FAMILIES_18.md` (the merged evil-team events and the last leftovers). 319 catalog ids, all built (318 built, `ev-hidden-hideout` merged into `ps-evil-hideout-gate`). Save: none (everything new lives in run flags `ev:*` and the existing `story.evil` block).

## What's built
- **One team per region** (`core/evil/teams.ts`): each region gets its home team (`evilTeams.json` `home`), one story step per stage: Suspicious, Evidence, Recognized, Ambush, Rising Star, Trouble Inside, Nemesis, The Plan, the Hideout, A Legend Stirs. Modules `tools/events/co/evil-story-1.ts` (steps), `-2` (the 64 Operations), `-3` (Hideout rooms, keys, boss, Holding Pen), `-4` (SF130 Operation scenes), `-5` (SF134 leftovers). `_evil-story-sync.ts` writes the team data and the 17 pseudo-stage maps.
- **The Plan** starts all four Operations; the one marked first must be met before the other three. Each Operation has its lasting effect (region modifiers, numbered flags, crisis), stated before the choice.
- **The Hideout** is a pseudo-stage (`ps_evil_hideout_<team>`), drawn like a stage, ending on the Holding Pen, which gives back every Pokémon the team took this run.
- **Operation scenes (SF130)**: after The Plan, one scene from the team's pool shows up per region (mark `scene`). "Stop them." wins mark `op-stopped`, and "stop all four" counts those too. Walking on can cost a Pokémon (`evil` effect `steal`, to the Holding Pen) or put a region modifier on (`mods`, taken off when the region is left).
- **Plasma Holding Camp** is a pseudo-stage (`ps_plasma_camp`: gate, Yard, Handler). Plasma Operations 1 to 3 stay on the weekly Plasma Operation game event (its objectives count them).
- A choice with `pick.types` now needs a Pokémon of one of those types (`core/events.ts`, "Needs a Bug or Grass-type Pokémon").

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
| 6 SF134 ids | `STORY_FAMILIES_18.md` lines 194 to 286 (Fire Week, SF134.6, belongs to the calendar row) | 2026-11-15 |

## Limits
- "(a node)" costs show in the label but take no node until `takeNode` is on the shared branch (`TAKE_NODE` in `_evil-story-kit.ts`).
- Consequences that need systems this row doesn't own are run flags for now, named above: the Diglett line leaving encounters, sun on every road, no Poké Balls in shops, tired wild Pokémon, gravity on the next node, a slower next node, the tagged Center's free heal, the flooded Hideout (+10% Water), the lieutenant's rare item or counter-team, an easier climax after the tide, the stolen accessory. "+1 Pokémon in the Holding Pen" for crates that weren't yours is a mark (`pen-extra`) the pen reads in words only.
- "Bond" is friendship: +1 Bond is +25, "Bond 3 or more" is friendship 150.
- The Disguise's "Nice hat" line at the lieutenant's door isn't shown (that room already has three variants).
- Galactic's Orders: in the region-by-region story all four Operations are already known, so "the Operation is drawn again" becomes heat +1.
- Team Rocket from inside (Volume III and the Kanto/Johto Full Expansion) is not built yet.
