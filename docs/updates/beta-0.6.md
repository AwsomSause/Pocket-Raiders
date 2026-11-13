# Beta 0.6: INSTRUMENTALITY, "You Are (Not) Alone" (update log)

Everything below ships to `main` as ONE PR from branch `beta-0.6`. Threads open PRs into `beta-0.6`, not `main`. Merge only on green CI.

**Source of truth:** `docs/plans/instrumentality/` (see `docs/plans/INDEX.md`).
- `INSTRUMENTALITY_DEFINITION.md`: what the update is, and Kice's decisions A–W (section 7). Do not re-ask them.
- `INSTRUMENTALITY_IMPLEMENTATION_PLAN.md`: every slice, in order, with files, saves and tests.
- `SCREEN_PICKS.md`: Kice's chosen mock-up for each new screen. Build screens from these picks (mock-ups are in the project files under `promo/beta-0.6-screens/`).
- `evil-pack/` and `notes-pack/`: the director's design packs (docs and scripts). Grep them; never read them whole.

## Scope

Beta 0.6 = plan milestones **1.0** (groundwork, balance, rivals, Triple Battles, minigames, mic) and **2.0** (the Kanto evil team saga, start to finish). Milestones 3.0 and 3.0+1.0 come after.

## Workstreams

| Workstream | Plan section | PR | Status |
|---|---|---|---|
| Setup: branch, docs, decisions, renamed sprites | 1 (Z2–Z5) | (this PR) | in review |
| Foundations: settings 42, run 43, expansion data pipeline | 2 (F1–F4) | | next |
| Balance pass | 2 (B1–B9) | | |
| Rival overhaul + the Friend + Rescue | 2 (R1–R11) | | |
| Triple Battles | 2 (T1–T3) | | |
| Minigames + mic | 2 (MG1, MG2, MIC1) | | |
| Kanto evil team saga | 3 (E0–E8) | | |
| Kanto canon spaces | 3 | | |

## Save versions touched

None yet. Planned: settings 42 (F1), run 43 (F2), profile 21 (F3).
