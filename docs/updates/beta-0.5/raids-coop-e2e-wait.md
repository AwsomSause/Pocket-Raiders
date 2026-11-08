# Raids co-op e2e: steadier wait for "PLAYER 1"

The co-op raid test pressed Enter, then waited 700 ms before looking at the message. On a slow run the "PLAYER 1" line could pass by in that gap, leaving weather or flavour text.

Fix: the test now checks the message every 120 ms, presses Enter only when battle text is waiting, and stops as soon as "PLAYER 1" shows. Test only; no game change.

Checked: the co-op test run 4 times in a row locally, 4 passed.
