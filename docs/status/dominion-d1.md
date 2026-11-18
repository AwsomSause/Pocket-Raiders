- **DOMINION slice D1, "humble start + the clock"** (Evil Mode rework, 2026-11-18; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md`, design Parts 1, 6, 7 §1.1, 9 A1/A15): with Settings > Gameplay > Evil Mode on, Run Setup offers **Dominion**. After the starter: the title card (mockup 0), three setup pages (the Boss and all three offered starters, two Team Types, the First Member: Rook the Grunt or one of six Admins), the opening scene, then the HQ (mockup 1) with the clock: Evening plans, Night rests, Morning reads the Night Report, Day does the orders, End Day pays odd jobs.

## What's built
- Core `src/core/dominion/`: `schema.ts` (start.json shape, block `run.expansion.dominion` v1, actions), `data.ts`, `start.ts` (Team Types rule, first member + their Pokémon on stream `dominion-start`), `clock.ts` (four phases, 3 Day actions +1 when rested, -1 when Exhausted after 3 nights without Rest, odd jobs ₽50, First Steps), `worldTurn.ts` (Part 9 A1 fixed order crew > police > rivals > hero > legends > world; `addWorldStep` for later slices; D1 has the crew guard line, Heat cooling 3 a night, weekly rent ₽200 + wages, unpaid = Loyalty −15), `screens.ts` (view models), `session.ts` (start/step on the run; Rest heals the Boss's team).
- Data `src/data/dominion/start.json` (all numbers and lines). Mode `dominion` in `runRules.json` (gate `evilMode`, not progression-eligible). The old `evil-mode` flow is untouched until D17.
- Screens `src/ui/redux/screens/dominion/`: `dominion.css` is the mockup CSS ported by `tools/dominion/port-mockup-css.py` (scoped under `.dom`, keyframes `dm-*`, loops keep the view clock), `paint.ts` (the mockups' skyline and warehouse painters, cached as images), `views.ts` (title card, setup, opening, HQ; `stage`, `topBar`, `tabs` for later slices). Scene `src/scenes/DominionScene.ts`. Art: `public/assets/images/dominion/` (see its PROVENANCE.md).
- `GameSession.dominionStart` / `dominionStep` save at every step.

## Saves
No save-version bump: the block is optional, as with every other `run.expansion` block, and has its own `v: 1` for later slices (migrations go in `src/core/dominion/migrate.ts` when D2+ bump it). A run saved before this loads unchanged (tested).

## Tests
`tests/unit/dominionStart.test.ts` (21): mode gate and routing; Day 1 numbers; Boss's three starters; Rook and the Admin; Team Types rule (normal, boundary, failure); the clock round, orders, First Steps paid once, odd jobs, wrong-phase steps refused, Rest heals, Exhausted, Heat floor, weekly bills and unpaid wages, First Steps leave after a week, determinism; save/reload at every phase, pre-Dominion run, damaged block refused. Browser `tests/e2e/dominionStart.spec.ts`: the whole setup and one day round in the New look with screenshots, reload continues; Old look still draws the New layer.

## Limits (D1, by plan)
- Today's Orders are the three starting orders (Scout the block, Find a recruit, Secure the warehouse) with small fixed results; D2 replaces Scout with the real action and adds the nine actions, D3 adds Recruit.
- Tabs 2-6 are dimmed and say they open later (Region Map D2, Roster D3/D4, Pokémon D4, Operations D10, Ledger D6).
- No Night actions yet (D2): Night is Rest only. Going broke beyond unpaid wages is D5 (A22). Morning has no task-assign yet (D3, mockup 2).
- Emblem is blank and the armband grey until the Founding (D7).
- Old-look players see the New layer for this mode, as with old Evil Mode.
