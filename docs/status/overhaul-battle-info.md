# Overhaul slice 8: Better battle info

The battle Info panel (I key / the ⓘ tab) now also shows: a fourth column "Your moves vs the foe" (each damaging move: super effective ×2, not very effective, no effect, normal, and "(no PP)"); your active Pokémon's ability, transformation state (Mega, Tera type, Dynamax turns left, Z-Move used, mechanics used this battle) and a ready Hyper move; the foe's type, transformation state and mechanics it has used, its ability ("not shown yet" until it triggers) and a held item only after it acted. The panel grows upward over the arena when a column is long, so no line is cut off.

Hidden information stays hidden: while Blindfold Bout / Misdirection hides the foe, the panel shows "???" and no type, matchup or catch odds (the old panel leaked the species); an Illusion shows the species it copies. What the foe revealed is remembered by the battle screen only (display state, not saved), so there is no save change.

Code: `src/core/battle/conditions.ts` (`battleConditions(content, run, reveals)`, pure), `BattleScene.openPanel/noteFoeReveal`. Tests: `tests/unit/battleInfo.test.ts`, `tests/e2e/battleInfo.spec.ts`.

Limits: Hyper/Overdrive state here is only "Hyper move ready"; the full Hyper/Overdrive state display comes with slice 9. Weather, terrain and stat changes were already in the panel and are unchanged. Reveals are lost if the page is reloaded mid-battle.
