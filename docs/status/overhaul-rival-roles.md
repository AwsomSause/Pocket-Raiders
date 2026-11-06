# Overhaul slice 22 (rest): three rival roles

Each run's rivals now play one of three roles, worked out from who they are in this run (`core/overhaul/rivalRoles.ts`, switch and number in `balance.overhaulRivalRoles`). Nothing is remembered between runs.

- **Major** (the guaranteed major rival): counter-picks as before.
- **Additional** (the first other rival): at most one counter-pick over the run.
- **Friendly** (any further rival): spars; it never studies your moves, and its return shows "only sparring" instead of a counter-pick.

The memory and counter-tactics the major rival already had (`rivals/major.ts`, `adapt.ts`) are unchanged. Only counter-picking depends on the role.

Limits: meetings, teams and lines are not changed by role; no new rival Notebook screen; I did not run the rival win-rate report against the fairness bands (40-60% early, 35-55% mid, 30-50% late). Removing counters only makes the second and later rivals easier. Tests: `tests/unit/overhaulRivalRoles.test.ts`, `tests/unit/rivals.test.ts`.
