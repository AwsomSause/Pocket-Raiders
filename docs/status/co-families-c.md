# Catalog Overhaul: families-c (STORY_FAMILIES 9 and 10)

Status: **paused** (2026-11-15, Kice: only five threads at once). Work in progress, no PR yet.

## Where it stopped
- Built and tested: Part 9 SF55 to SF59 (`tools/events/co/families-c-1.ts`) and SF60 to SF63 (`families-c-2.ts`).
  `tests/unit/coFamiliesC.test.ts`, `catalogOverhaul.test.ts`, `coToolkit.test.ts` pass (28 tests); typecheck clean.
- Engine pieces added: `src/core/battle/coRules.ts` (SF72 rule-battle rules), `src/core/events/coHelpers.ts`
  (barter, given/noted Pokémon, helped return, Ditto, taken egg), `regionJoin` effect, flags file
  `src/data/catalogOverhaul/flags/families-c.json`.

## Next on resume
1. Rebase onto the lead's foundation (`claude/project-thread-0hal24`, PR #1316): e243e9ca and the people
   region stamps are already there, so my copies drop out. Placement fields: `docs/catalog-overhaul.md` "Map placement".
2. Tell legends: `cruelty-act` / `dark-dealt` should break the Volcanion and Zeraora promises. Tell evil-story about
   `evil-plan-revealed`, `dark-reported` and the Admin who holds the given Pokémon.
3. `families-c-3.ts`: SF64 to SF71 (statue garden, Lapras, scarecrow, starlit, clock tower, Trubbish, Hargrove, GL2 janitor).
4. `families-c-4.ts`: SF72, 30 rule battles (rule mapping is in coRules; Road Roster meeting flags for Perry, Ryder, Marina).
5. Part 10 (re-read STORY_FAMILIES_10.md first) and the Part 0 pointer ids.
6. Placement, pseudo chains, status file, update fragment, e2e spec, `npm run check`, PR into `ui-mockups`.

## Known limits so far
- Nix (barter) offers the item you hold most copies of per tier; epic items aren't traded.
- SF56.2: the Revive reward is a Black Belt (no healing-item rewards).
- SF60: the "your past run" stranger is a mirror of your current team (no cross-run memory).
- SF65 "visits every run" is within the run only; amends clear "robbed" within the run only.
- Final Reunion / All-Star flags are set but nothing reads them yet.
