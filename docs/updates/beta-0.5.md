# Beta 0.5: The World Doesn't Revolve Around You (update log)

Everything below ships to `main` as ONE PR from branch `beta-0.5`. Threads open PRs into `beta-0.5`, not `main`. CI runs on PRs into any branch (and on pushes to `beta-0.5`).

## Workstreams

| Workstream | Doc section | Milestones | PR | Status |
|---|---|---|---|---|
| Trainer parity and history | §3 | M1-M2 | | not started |
| Mentor / Protégé rework | §2 | M3-M5 | | not started |
| Cinematics and cutscenes | §4 | M6-M7 | M6 framework: see PR | M6 framework built (not wired yet); M7 scenes next |
| Galar stadium, tournament, events | §1 | M8-M10 | (this PR) | slice 1: data, rules, events, tests |
| Integration, persistence, save migration | §5 | check across all | | integration lead |

## Save versions touched

(add each bump + its migration test here)

Cinematics M6: no save bump.
- Galar slice 1: none.

## Merged into beta-0.5

(newest first: PR, one line on what the player gets)

- Galar slice 1: 10 Galar-only events (Kubfu to Urshifu, Swordbert & Shieldbert, Wooloo, Gigantamax, raid...), plus tested rules for the 32-trainer Champion Tournament, Ball Guy's shop and the stadium Champion/crowd/camera presentation. Not yet wired into the League stage and battle screen.


## Known limits / open items

