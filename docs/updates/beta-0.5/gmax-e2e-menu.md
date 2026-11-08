# Gigantamax e2e: step back to the main menu

The Gigantamax browser test sometimes saw the move list (Flamethrower, Growl) instead of the main menu, because a late Enter from `confirmToMenu` could land on Fight. It only happened after the Z-Move test ran first.

Fix: the test now presses Escape if the move list is open, then checks the main menu. Test only; no game change.

Checked: `tests/e2e/milestone8_5.spec.ts` full file, 4 passed.
