# Extended Cut Kanto (workstream 16)

**Player gets:** with the Extended Cut setting, Kanto's climax runs the longer phase list in order (Siege Map, Blackout, Gauntlet, Duels, Breather, Set piece, Giovanni, Colossus, Convoy, Resolution). Wide formats not built yet are skipped. Second Shot: first loss retries from the last save point (Breather or Colossus), second loss gives the worst Resolution and the run goes on. Friend Assist cap is 6 in the Extended Cut.

**Save:** no bump. State is in `run.expansion.cut` (`climaxCut`, `region`, `director`). Older runs that only have `expansion.climaxCut` still read as extended.

**Limits:** `src/core/arc/climaxExtended.ts` is the rules only; the screens/campaign director must call `beginClimax`, `nextStep`/`startStep`, `finishStep`, `climaxLost`. Debate is skipped until built. Kanto only. Raids 4/5 are read from `run.expansion.raids` by the formats. All cut readers (run.ts, events.ts, rivals/live.ts) use `climaxCutOf`.

## Follow-up: screens wired
`beginClimax` runs when the evil story reaches beat 6 (Extended Cut runs only). `climaxTick` runs when the map opens: it starts the next wide format and moves on when it closes. The director also launches the Gauntlet (grunts), Duels (officers), Set piece (specialists) and Boss (leader) battles itself, as ordinary `format:climax` fights; the count per phase is picked from the script's range with a seeded stream of its own (`climax-count`), so no existing roll changes.

Second Shot covers every climax loss: the loss heals the party (pseudo-battle path), the first loss retries from the last save point (Breather or Colossus), the second ends the climax with a `cut.result = 'worst'` (Kanto's world-state track rises by 1, once) and the run goes on. Limits: Kanto only; the boss is the run's evil-team leader.

Dev hook: `await __pkr.extendedCut()` in the browser console (or a test) switches the current map run to the Extended Cut and starts the climax; the map then plays the phases. The climax starts for Kanto only.
