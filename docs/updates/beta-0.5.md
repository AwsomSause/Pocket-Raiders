# Beta 0.5: The World Doesn't Revolve Around You (update log)

Everything below ships to `main` as ONE PR from branch `beta-0.5`. Threads open PRs into `beta-0.5`, not `main`. CI runs on PRs into any branch (and on pushes to `beta-0.5`).

## Workstreams

| Workstream | Doc section | Milestones | PR | Status |
|---|---|---|---|---|
| Trainer parity and history | §3 | M1-M2 | part 1 in progress | foundation: records, friendship, bond, mastery data |
| Mentor / Protégé rework | §2 | M3-M5 | | not started |
| Cinematics and cutscenes | §4 | M6-M7 | M6 framework: see PR | M6 framework built (not wired yet); M7 scenes next |
| Galar stadium, tournament, events | §1 | M8-M10 | | not started |
| Integration, persistence, save migration | §5 | check across all | | integration lead |

## Save versions touched

(add each bump + its migration test here)

Cinematics M6: no save bump.

## Merged into beta-0.5

(newest first: PR, one line on what the player gets)

- Trainer parity part 1: every trainer now has a record (meetings, wins, reputation, ace, bond) and their Pokémon get friendship, bonds and mastered moves like yours. Battles now use it: mastered moves hit 10% harder (you too), bonded trainer Pokémon can hold on at 1 HP, richer trainers carry more potions, and returning trainers greet you from their record. No save bump (`run.story.trainers` is optional); old-save load test in `tests/unit/trainerWorld.test.ts`.

## Known limits / open items

