# Flaky e2e: dropped key presses (2026-11-21)

**Cause.** The game drops a confirm that lands while a screen is still opening (input guard, `src/ui/input.ts`). On slow CI runners that window is long, so specs that sleep a fixed time and press Enter once sometimes lose the press. Which spec fails changes each run (main run 44940726347: `events.spec.ts`, 2 tests; passed on retry or locally). Not a `Map.busy` bug in the game.

**Fix.** `tests/e2e/helpers/pressUntil.ts`: press, check the result, press again if nothing changed. Used in `events.spec.ts` for the choice, reward and battle steps (replaces fixed sleeps + single press). 4 runs under 4 CPU hogs passed with no retries.

**Left.** ~33 specs still copy the same `toMap` (Enter then `waitForScene`). Convert them to `pressUntil` if they start flaking; the shared `helpers/newUi.ts` `toMap` already polls each scene.
