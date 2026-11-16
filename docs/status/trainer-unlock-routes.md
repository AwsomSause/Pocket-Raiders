# Trainer unlock routes (streamlined) and the trainer picker fix

Kice, 2026-11-16: "Make the trainer system more streamlined with better/more fun obtainment for all. Switch certain trainers to become unlocked through events/battle. Players can only choose the starting three."

## What changed
- **Picker bug:** Trainer Select only listed Red, Blue, Green, Hilda and Nate (`isPlayerTrainer` filter), and `GameSession.newRun` turned every other trainer into one of those five. So the ~280 other trainers could be unlocked but never played. Now every trainer shows on Trainer Select (the five starters first) and any owned trainer can lead a run. An unowned id (old save, shared code) still becomes one of the five.
- **One clear route per trainer** (`Archetype.unlockRoute`, set in `src/data/index.ts`):
  - `start`: Red, Blue, Green, Hilda, Nate.
  - `battle` (every trainer that is also a boss in `bosses.json`: Gym Leaders, Elite Four, Champions): beat them in a boss battle during a run and they join when the run ends (`run.itemCounters["recruit:<id>"]`, set in `run.ts` on a boss win). Their old challenge still works too.
  - `event` (the `npc-*` trainers): help them in their run event (existing `recruit` effect). Their challenge still works too.
  - `challenge`: everyone else, unchanged challenges from `trainerUnlocks.json`.
  - `evolution`: Trainer Evolutions (quest line), unchanged.
- **No claim step:** a met challenge owns the trainer at once (`trainerStatus` returns `unlocked`; `ownsTrainer`), and `joinEarnedTrainers` writes it to `unlockedArchetypes` at run end. All Bank Credit unlock costs are 0. The run-end screen says "New trainers joined your roster: ...".
- No save change (no version bump): the recruit key reuses `itemCounters`, and owning is derived from existing counters.

## Tests
`tests/unit/trainerRoutes.test.ts` (routes, auto-join, boss recruit through a real run, picking a non-starter); `milestone5` and `trainerUnlocks` tests updated for the removed claim step.

## Known limits
- The Hub Trainer Archive still has its claim code path; it is unused now (nothing is ever "claimable").
- A boss that never spawns in any campaign can only be earned through its challenge.
