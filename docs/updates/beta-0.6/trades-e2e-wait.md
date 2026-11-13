# Trade Stop e2e: wait for the screen to be ready

**Player gets:** nothing new; this only fixes a flaky test.

**Save:** no change.

**Limits:** The test pressed Enter 600 ms after the Trade screen opened. On a slow CI runner the style art was still loading, Enter was ignored, and the scene never reached "done". The test now waits for the "choose" phase first (the Plaza test already did). Not reproduced locally (it passed); this is the cause read from the code.
