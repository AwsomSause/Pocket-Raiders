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

## Save versions touched

- Run v42 (mentor rework): `story.mentoring`. Migration `MIGRATIONS.run[41]`, tested in `tests/unit/mentorRework.test.ts` ("save migration run v41 -> v42").

Cinematics M6: no save bump.
- Galar slices 1-3: none (`run.shop.sold` and `run.shop.visit` are optional fields).

## Merged into beta-0.5

(newest first: PR, one line on what the player gets)

- Cinematics M7 slice 1: raid, Evil Team and returning-rival intro cards through the cinematic framework (no save bump).
- Cinematics M7 slices 2-3: RAID CLEARED, CHAMPION DEFEATED / ELITE FOUR DEFEATED / LEADER DEFEATED cards and a long Champion intro card.
- Trainer parity part 1: every trainer now has a record (meetings, wins, reputation, ace, bond) and their Pokémon get friendship, bonds and mastered moves like yours. Battles now use it: mastered moves hit 10% harder (you too), bonded trainer Pokémon can hold on at 1 HP, richer trainers carry more potions, and returning trainers greet you from their record. No save bump (`run.story.trainers` is optional); old-save load test in `tests/unit/trainerWorld.test.ts`.

- Galar slice 1: 10 Galar-only events (Kubfu to Urshifu, Swordbert & Shieldbert, Wooloo, Gigantamax, raid...), plus tested rules for the 32-trainer Champion Tournament, Ball Guy's shop and the stadium Champion/crowd/camera presentation. Stadium presentation is wired into Galar gym battles, and the Galar League is now the 32-trainer tournament with Ball Guy shops; bracket screen still to do.


## Known limits / open items

- Trainer behavior follow-up (stacks on #1069): specialization steers AI and teams, wealth kit items, bond protect/refuse-to-recall, rival gimmicks, returning trainers adapt. No save bump.
