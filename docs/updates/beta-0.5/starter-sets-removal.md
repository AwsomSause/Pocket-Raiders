# Starter Sets removed, Remembrances only

Status: done in code, awaiting CI.

- Starter Sets and the Classic pool are gone: starter pools, draft rules (Type Focus, Blind, Balanced...), the Starter Laboratory, the pool/draft/type rows on the Preparation Desk, the Starters page, the Draft Lab mode and the Random Draft modifier.
- Every run (Story, normal, Daily, Weekly) starts with three Remembrance starters from three different regions: the quiz picks for Story Runs, the same quiz rules over a seeded draw otherwise (`core/story2/starterDraw.ts`).
- Quest and event rewards no longer unlock starter sets (removed from `trainerQuests.json`, `gameEvents.json`, mode rewards). Daily's first fourth-gym reward pays 50 Bank Credits instead.
- Other starters: the 30 event-unlocked Remembrance lines and the Starter Scouts. A new test checks every non-quiz line has a route.
- Saves: no version bump. Old saves load; the retired fields (run `prep.poolId/draftRuleId/typeFocus/note`, profile `unlockedPools`) are ignored and dropped on next save. A test covers both.
- Not built: the "win" unlock route for the rare lines; the full quiz at the start of every non-Story run (non-Story runs use the seeded quiz-rules draw).
