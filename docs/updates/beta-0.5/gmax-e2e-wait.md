# Gigantamax e2e: wait long enough for the swap

The Dynamax scene is 12.5 s long and the Gigantamax form (and its back sprite) is swapped in at the end, behind the fade. Measured locally: the swap lands 12.6 s after the scene appears, with the frame rate falling from 19 to 13 fps (software WebGL). The test only waited 15 s, so on a slower CI runner (about twice as slow) the swap came after the wait ran out. The game did swap correctly; the test gave up too early.

Fix: the back-sprite wait is now 45 s (the Mega test waits 30 s). Test only; no game change.

Checked: the Gigantamax test passes locally, also in CI's shard 3 with CI=1.
