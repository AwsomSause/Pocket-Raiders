# Story pacing fix (S19, W8)

The three pacing rules that broke on every seed now hold with 0 violations: people cadence, downtime cadence, Act endings.
- `storyDirector.ts` Stop table: the last leader scene of Acts 1 and 2 and the Act 3 branch Stop are now Resolution Stops; seven quiet Stops also carry the `downtime` tag (no event uses that tag, so event picks are unchanged).
- `story2/sim.ts`: `recognition` and `champion` Stops count as named-character scenes; `PACING_KNOWN_LIMITS` is empty.
- `tests/unit/storyPacing.test.ts`: 200 seeds, 0 violations.
Known limits: none. Story-only; Classic seeds unchanged. No save change.
