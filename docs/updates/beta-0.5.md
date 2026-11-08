# Beta 0.5: The World Doesn't Revolve Around You (update log)

Everything below ships to `main` as ONE PR from branch `beta-0.5`. Threads open PRs into `beta-0.5`, not `main`. CI runs on PRs into any branch (and on pushes to `beta-0.5`).

## Workstreams

| Workstream | Doc section | Milestones | PR | Status |
|---|---|---|---|---|
| Trainer parity and history | §3 | M1-M2 | #1069 | records, friendship, bond, mastery, wealth potions, history lines built; trainer mentor Last Resort next |
| Mentor / Protégé rework | §2 | M3-M5 | (PR below) | built, see `docs/status/beta05-mentor-rework.md` |
| Cinematics and cutscenes | §4 | M6-M7 | M6 framework: see PR | M6 framework built (not wired yet); M7 scenes next |
| Galar stadium, tournament, events | §1 | M8-M10 | (this PR) | slice 1: data, rules, events, tests |
| Integration, persistence, save migration | §5 | check across all | | integration lead |

## Per-PR notes

Each PR adds its own fragment in `docs/updates/beta-0.5/` (see its README). Save versions and limits are listed in each fragment. The integration lead merges them into this file before the final PR to main.

## Save versions touched

- Run v42 (mentor rework), see `1070-mentor-rework.md`. All other Beta 0.5 PRs so far: no bump.
