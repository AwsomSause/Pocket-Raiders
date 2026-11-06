# Relic Fragments (S434)

Fragments are an event counter (`relic-frag`), no item or save change. Three new events: "Fragment Dig Site" (50% a fragment, or pay ₽300 for one), "Ruined Shrine" (rare, one or two fragments) and "The Relic Forge" (shows once you hold 3 fragments). At the forge, 3 fragments fuse into the Fragment Charm (+8% EXP) and 5 into the Fragment Crown (+10% money and healing). Each relic can be forged once per run.

- Data: `src/data/events/relicFragments.json`; uses existing `flag` and `relic` effects.
- Limits: the fragment count is not shown in a menu yet; the forge choices show what they need. The old-seed story test leaves the three events out.
- Test: `tests/unit/relicFragments.test.ts`.
