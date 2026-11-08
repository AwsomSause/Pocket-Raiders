# Beta 0.5: The World Doesn't Revolve Around You (update log)

Everything below ships to `main` as ONE PR from branch `beta-0.5`. Threads open PRs into `beta-0.5`, not `main`. CI runs on PRs into any branch (and on pushes to `beta-0.5`).

## Workstreams

| Workstream | Doc section | Milestones | PR | Status |
|---|---|---|---|---|
| Trainer parity and history | §3 | M1-M2 | | not started |
| Mentor / Protégé rework | §2 | M3-M5 | (PR below) | built, see `docs/status/beta05-mentor-rework.md` |
| Cinematics and cutscenes | §4 | M6-M7 | M6 framework: see PR | M6 framework built (not wired yet); M7 scenes next |
| Galar stadium, tournament, events | §1 | M8-M10 | | not started |
| Integration, persistence, save migration | §5 | check across all | | integration lead |

## Save versions touched

- Run v42 (mentor rework): `story.mentoring`. Migration `MIGRATIONS.run[41]`, tested in `tests/unit/mentorRework.test.ts` ("save migration run v41 -> v42").

Cinematics M6: no save bump.

## Merged into beta-0.5

(newest first: PR, one line on what the player gets)

## Known limits / open items

