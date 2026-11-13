# Extended Cut Kanto (workstream 16)

**Player gets:** with the Extended Cut setting, Kanto's climax runs the longer phase list in order (Siege Map, Blackout, Gauntlet, Duels, Breather, Set piece, Giovanni, Colossus, Convoy, Resolution). Wide formats not built yet are skipped. Second Shot: first loss retries from the last save point (Breather or Colossus), second loss gives the worst Resolution and the run goes on. Friend Assist cap is 6 in the Extended Cut.

**Save:** no bump. State is in `run.expansion.cut` (`climaxCut`, `region`, `director`). Older runs that only have `expansion.climaxCut` still read as extended.

**Limits:** `src/core/arc/climaxExtended.ts` is the rules only; the screens/campaign director must call `beginClimax`, `nextStep`/`startStep`, `finishStep`, `climaxLost`. Debate is skipped until built. Kanto only. Raids 4/5 are read from `run.expansion.raids` by the formats. All cut readers (run.ts, events.ts, rivals/live.ts) use `climaxCutOf`.

## Follow-up: screens wired
`beginClimax` runs when the evil story reaches beat 6 (Extended Cut runs only). `climaxTick` runs when the map opens: it starts the next wide format (Siege, Blackout, Breather, Convoy, Colossus, Front) and moves on when it closes. Battle and story phases (Gauntlet, Duels, Set piece, Giovanni) are still played by the standard climax content, so the director passes through them; it does not launch those battles itself. Second Shot is not yet hooked to non-Stand-with climax losses.
