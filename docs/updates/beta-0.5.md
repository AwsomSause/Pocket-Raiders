# Beta 0.5: The World Doesn't Revolve Around You (update log)

Everything below ships to `main` as ONE PR from branch `beta-0.5`. Threads open PRs into `beta-0.5`, not `main`. CI runs on PRs into any branch (and on pushes to `beta-0.5`).

## Workstreams

| Workstream | Doc section | Milestones | PR | Status |
|---|---|---|---|---|
| Trainer parity and history | §3 | M1-M2 | part 1 in progress | foundation: records, friendship, bond, mastery data |
| Mentor / Protégé rework | §2 | M3-M5 | | not started |
| Cinematics and cutscenes | §4 | M6-M7 | | not started |
| Galar stadium, tournament, events | §1 | M8-M10 | | not started |
| Integration, persistence, save migration | §5 | check across all | | integration lead |

## Save versions touched

(add each bump + its migration test here)

## Merged into beta-0.5

(newest first: PR, one line on what the player gets)

- Trainer parity part 1: every trainer now has a record (meetings, wins, reputation, ace, bond) and their Pokémon get friendship, bonds and mastered moves like yours. Not visible in battle yet. No save bump (`run.story.trainers` is optional); old-save load test in `tests/unit/trainerWorld.test.ts`.

## Known limits / open items

