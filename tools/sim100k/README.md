# sim100k: the big run survey

Plays many seeded bot runs with the default settings on, then builds one HTML page with all the numbers.
Analysis tool only: nothing in `src/` uses it.

```
node tools/sim100k/build.mjs                                  # bundles sim.ts into dist-sim/sim.mjs (fast to run)
node dist-sim/sim.mjs <rawDir> 100000 <shard> <shards>         # one process per shard, e.g. shards 0..3 of 4; safe to restart
node tools/sim100k/names.ts names.json                         # display names
node tools/sim100k/aggregate.mjs <rawDir> data.json names.json
node tools/sim100k/build-dashboard.mjs data.json out.html
```

Run `n` is always the same run (seed `k<n>`), so a crash listed on the page can be replayed with
`node dist-sim/sim.mjs /tmp/one <n+1> <n> 1000000`.

Notes:
- The game copies the whole run state on every action. The tool swaps `structuredClone` for a plain recursive copy
  (same results, about 3x faster). `SIM_SLOWCLONE=1` uses the built-in one; `SIM_VERIFY=1` freezes the shared story-log
  entries to prove nothing edits them.
- The bot is `tools/lib/simBot.ts` plus optional stops (events, shops, heals, raids, totems, fishing) chosen by a
  "curiosity" setting, through the node menu like the map screen does. It cannot play minigames, expeditions, the plaza or services.
