# Battle Frontier Points and prize shop (S490)

Run save v36 (`minigames.frontierPoints`, migration 35 to 36 + test in `tests/unit/frontierPoints.test.ts`). Winning a medal in Battle Factory, Palace, Arcade or Pyramid pays Frontier Points (bronze 1, silver 3, gold 6, times 1/2/3 by difficulty tier). On the result screen of those games the points are listed with a prize shop (Revives, Ultra Balls, Full Restore, Tuning Dust, Lucky Egg, King's Rock, Master Ball). Data: `economy.frontier` in `src/data/minigames.json`.

Limits: points live in the run (they reset each run, not in the profile); the shop is only on a Frontier game's result screen.
