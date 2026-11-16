# Catalog Overhaul: families-c (STORY_FAMILIES 9 and 10)

Status: **built, in review** (2026-11-16). All 166 ledger ids: 164 built, 2 merged (`ovc-abandoned-egg-s1` into
`abandoned-nest`, `ovc-net-tangle-s1` into `trapped-pokemon`), plus 280 rooms, callbacks and follow-ups
(`src/data/catalogOverhaul/status/families-c.json`). No save bump. No placement file: neither doc has placement blocks,
so every id keeps its old placement (`oldPlacement.json`).

## Files
- Events: `tools/events/co/families-c-1.ts` to `-7.ts` (built to `src/data/events/co-families-c-*.json`).
- Rules: `src/core/events/coToolkit.ts`, `coHelpers.ts`, `coDungeon.ts` (SF73), `coLegends.ts` (Signs, roamer trail
  chance, Tower bowl), `src/core/battle/coRules.ts` (SF72). Numbers: `src/data/catalogOverhaul/familiesC.json`.
- Items: `src/data/itemCatalog/families-c.json` (18 Old Badges, Spring Water, First Badge).
- Pseudo stages: `src/data/catalogOverhaul/pseudo/families-c.json` (the Lapras crossing, the Mystery Dungeon).
- Flags read by other families: `src/data/catalogOverhaul/flags/families-c.json`.
- Tests: `tests/unit/coFamiliesC.test.ts` (every flag read is set, every flag set is read or listed, rooms point at live
  events, no event ends a run, no healing-item rewards), `coFamiliesCEngine.test.ts`, `coToolkit.test.ts`.

## Re-read log (each section re-read against the doc after building)
| Doc section | Built in | Re-read |
| --- | --- | --- |
| SF55 to SF59 | families-c-1 | 2026-11-15 |
| SF60 to SF63 | families-c-2 | 2026-11-15 |
| SF64 to SF71 | families-c-3 | 2026-11-16 |
| SF72 (30 rule trainers) | families-c-4 | 2026-11-16 |
| SF73 to SF78 | families-c-5 | 2026-11-16 |
| SF79 to SF86 | families-c-6 | 2026-11-16 |
| Part 0: A1, L1, L16, GL3 vault, FE1 to FE6, other roamers | families-c-7 | 2026-11-16 |

## Known limits
- Memory stays inside the run (Kice's rule): SF60's "past run" stranger mirrors your team; SF65 "every run" is once
  per later region; FE1's letter is answered in this run, not the next; FE2's "past save" line is dropped; FE3's
  capsule is buried and dug up a region later in the same run; the Explorer rank (SF73) and Tower name are run-only.
- No healing-item rewards: SF56.2 Revive is a Black Belt, FE2's Potion is Spring Water, its Max Revive is a rare held item.
- Nix (SF55) trades the item you hold most of per tier. SF72 prizes use the rule multiplier table.
- SF64 garden flags have no reader, so they are not set. SF73 "see one room ahead" is not built; the horde is two
  triple battles. SF75 free-text guesses are three choices. SF77 one item per stall. SF81 standings floor at 0;
  Scholars' favour is research points; the Syndicate coin is `evil-skip` for evil-story to read. SF83 "wild Pokémon
  flee more" is text only. SF85 balms don't exist, so Mercy is paid in Bond. SF80 First Badge: all stats +5%.
- A1 Nobles: calming is a Calm meter (each turn the Noble isn't hurt fills it; 3, or 2 with Ine's sash). Frenzy and
  district rewards are a region-long -5% / +5% to one stat (map effects like closed paths aren't possible yet). No
  "two per region" limit, no Alpha Mark. Light Devourer shards: no Necrozma blessing exists yet.
- L1: Suicune's kneel needs cages opened or a stranger helped at any time this run (not "this stage"). The Rival
  Report chase is not built; "Step aside" raises the featured rival's admiration only.
- Roamers: the trail chance is 25% + 15% per Influence (only for its own blessing) + 15% after "Leave it be". Cresselia
  and Darkrai's Guest are not linked (no Guest system yet).
- L16: Influence starts at 0 to 2 and only Signs raise it, so the blessed summit (Influence 9+) is rare. Tower Week
  uses the existing `tower-of-legends` game event. A rival carved at the summit is not built.
- GL3 vault: "Leave the badges" gives the Telling; the badges' +5% (people's relics) stays, since relics can't be removed.
- FE4: the Paradox stage door for Koraidon/Miraidon is not built (their blessings don't exist yet); the Sign is.
- FE6: the five later bosses come through one at a time, one region after Giovanni.
- Final Reunion / All-Star flags are set; nothing reads them yet.

## Flags for other families (also in the flags file)
- legends: `sign-*`, `telling-*`, `vault-magearna`, `vault-wound`, `cruelty-act` / `dark-dealt` (should break the
  Volcanion and Zeraora promises), `roam-latias-chased` / `roam-latios-chased` (L7 clues).
- evil-story: `evil-plan-revealed`, `dark-reported`, `evil-funded`, `lead-smuggling-ring`, `evil-skip`.
- people: `leader-item-bought` / `-returned`, `estate-badge-case` (GL6), `estate-uncle-named` (GL9).
