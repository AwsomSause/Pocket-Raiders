- Modes slice 1 (category `s-modes-quests-qol`): three run modifiers in `runRules.json`, pickable on the briefing screen like the others.
  **Inverse Battle** (S291): `battleContent()` (`core/rules.ts`) hands the engine a cached copy of content with the type chart reversed (2 to 0.5, 0.5 and 0 to 2); used by run, auto-battle and BattleScene contexts, so damage, AI and effectiveness hints agree.
  **Level 50 Cup** (S290): `modifierLevelCap` lowers `runLevelCap` to 50 for the whole run (party levels; enemies follow the usual curve).
  **Low Resource** (S297): prize money x0.5 and enemies +2 levels.
  Save: no bump (rules are stored as modifier ids). Tests `tests/unit/modifiersS2.test.ts`. Already existed: Nuzlocke, Monotype, Solo, Boss Rush, Draft/Random draft, Empty Bag. Next: Doubles Only (S292), Gauntlet (S294), Pacifist (S300), Time Attack, Randomizer, Tag Team, Triple.
