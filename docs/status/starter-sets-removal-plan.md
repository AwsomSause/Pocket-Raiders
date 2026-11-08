# Plan: Starter Remembrances become the only starter system (Slice B)

Rule (Kice, 2026-11-08): no Starter Sets, no Classic pool. The first three starters of every run come from the Remembrance quiz, from three different regions. Every other starter is earned through a quest, event or other tie-in.

## What already exists
- 84 Remembrance lines: 54 unlock by `quiz`, 30 by `event` (quest-arc events, `src/data/story/questArcs.ts`). Five Starter Scouts (`story2/starterScouts.ts`) unlock more lines by talking to them. Unlocked lines go in the Archive and join the quiz pool.
- The quiz picks three from different regions already (PR #1089). The Short Intake (`story2/prologue.ts`) re-runs a quick quiz for later Story Runs.
- Only Story Runs use the quiz today (`GameSession.newRun(..., starterOverride)`). Other runs use `draftStarters` over `runPrep.json` pools.

## Build (one PR, off fresh origin/main)
1. **Run start**: every new run (Story, Daily, Weekly, normal) goes quiz or Short Intake, then `starterOverride` = the three picks. Daily/Weekly use a seeded quiz draw (same seed gives same three), kept from the reverted `drawRemembranceStarters`.
2. **Delete Starter Sets**: pools in `runPrep.json`, `draftStarters`/`eligibleSpecies`/`withSignatureStarter` in `core/runPrep.ts`, pool use in `daily.ts`/`weekly.ts`, `prep.poolId`, profile `unlockedPools`, `GameSession.unlockPool`, Starter Laboratory in HubScene, pool rows in RunPrepScene/BriefingScene, RunStartersScene/StarterSelectScene, `balance.starterSets`.
3. **Saves**: run v42 drops `prep.poolId`; profile v21 drops `unlockedPools`; settings only if a setting is removed. Migrations never drop a save; an in-progress run keeps its starters. Next free numbers must be checked on origin/main first.
4. **Other starters**: add a gate test that every non-quiz line has a reachable source (an existing quest event or a Scout). Lines with no source get one authored, or are marked limited in QUALITY_GATES. The unauthored "win" unlock stays out of scope unless Kice wants it.
5. **Tests**: delete the Starter Set tests (14 unit files plus one e2e spec touch it); add migration tests (old run and old profile load), a three-regions-on-every-run test, a Daily same-seed test, and a reachable-source gate test.
6. **Docs**: STATUS, CHECKLIST, MAP, `docs/status/<slice>.md`.

## Acceptance
- No file mentions `poolId`, `unlockedPools`, Starter Laboratory or `classic` pool.
- Every run mode starts with three starters from three different regions.
- Old saves load; `npm run check` and the starter e2e spec pass.

## Risks and rollback
- Big diff (about 46 files touch runPrep/pool code). Rollback is reverting the single PR; saves already migrated forward would still load because the migration only removes fields.
- Players with no unlocked lines get the quiz-eligible 54 only; fine for run one.
