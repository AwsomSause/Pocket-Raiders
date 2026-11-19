- **DOMINION slice D8, "Squads and Groups"** (Evil Mode rework, 2026-11-19; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md`, design Part 10): the Squads page (mockup 13 of round 4, U on the Crew File). The Boss forms named squads under a Corporal or higher, gives each one an Incentive, a Mark and a Focus, and orders the whole squad at once. Groups (Admin+) and Divisions (Executive+) bundle squads.

## What's built
- **Data** (`src/data/dominion/squads.json`, validated in `schema.ts`): unlock (Notoriety 20, "Street Gang", Corporal+), Code Name rules (20 letters, allowed characters, blocked words), sizes by leader rank (Corporal 3, Sergeant 4, Staff Sergeant 6, Lieutenant 8, Captain 12), group kinds, the cap (1 + HQ level), 10 Incentives, 9 Focuses, 12 Marks, Cohesion bands and moves, 20 squad traits (the design's 7 plus 13 more), name ideas, targets, report lines and chatter.
- **Rules** in `src/core/dominion/squads.ts` (pure, no Phaser):
  - Form, edit and break up squads; Family squads (Cohesion 80+) hurt to split (Morale −15 and a seeded quit roll).
  - A squad order sets every member's task. It is refused when a member's Line forbids it, unless the Incentive is Fear or Purse.
  - At night the leader rolls once for the squad; followers ride along (Fatigue 10, leader's own Fatigue 10 instead of 15), share XP and the record. Cohesion grows with jobs, long shots, rescues and nights; it drops with swaps, losses, demotions, punishment and Incentive changes.
  - Each Incentive works: Cut of the Take, Glory, Brotherhood, Promotion, Fear, Vengeance (+25 on the Card against the target), Pokémon First, Quiet, Purse. Cause waits for D14.
  - Traits are offered at Cohesion milestones and change odds, Heat, pockets or Fatigue.
  - Groups and Divisions: form, order every squad at once, break up.
  - Crew tasks now live: Match-Make (58) and Run a Crew (141). With D5 and D9 merged, **65 of 152 tasks can be played**.
  - Bail out a squad member: Cohesion +15.
  - New hooks: `addModHook` and `addRunHook` in `crew.ts`, `addCardHook` in `field.ts`. New RNG stream `dominion-squad`; no old roll moves.
- **Screens**: `src/ui/redux/screens/dominion/squads.ts` draws mockup 13 (cards on the left, the builder on the right, the order and trait picker); `src/scenes/dominion/squadController.ts` keeps the cursors. The Rank Pyramid shows each member's squad Mark.
- **Keys** (U on the Crew File opens it): arrows pick, Enter gives an order, Tab moves to the builder, E edit, N name (typing form), F focus, G group mode, T trait, X break up (press twice), [ ] page, Esc back. Q (command wheel), End (quit) and the number keys pass through.
- Three target portraits added (see PROVENANCE.md).

## Saves
No version bump. `block.squads` is optional and is filled by `squadsOf` on first use, so a D4 save loads unchanged (tested, plus a damaged record).

## Tests
- `tests/unit/dominionSquads.test.ts` (26 tests): data, sizes, cap, lock, names, form / edit, orders and refusals, odds, the night (deterministic, Fatigue 10 vs 15), Cut 10%, Family traits, losses and demotion, the week, Family split, bail rescue, groups, Match-Make, Run a Crew, Vengeance on the Card, screen models, the Pyramid Mark, save/reload, a damaged record, play through the session.
- All 168 Dominion unit tests pass.
- Browser: `tests/e2e/dominionSquads.spec.ts`: a Street Gang crew forms "Viper Unit", gives it an order, three window sizes, reload. Passes.

## Limits and what's left
- Cause Incentive needs D14. Betrayal from squads needs D15. Poaching, rival-admin targets and Shield Wall need D9. Squad-only jobs, Raid / Smuggle focus, Breach Team and Tunnel Rats need D10. Hero's Shadow needs D11.
- Mishap reductions from traits are not modelled yet. Battles as doubles wait for D10.
- Operations Rooms (extra squad cap) wait for D5; Divisions by region and companion squads wait for D15. A Unit holding a squad is not built.
- The round-4 villain look classes are in the markup but the CSS comes with D26's re-port. Armband colours wait for D7.
- Browser tests must space key presses (~120 ms): two presses inside one frame can be read twice.
