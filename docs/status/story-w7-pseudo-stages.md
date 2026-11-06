# Story Overhaul W7: pseudo stages and regions

Done: 10 pseudo-stage records (`src/data/pseudoStages.json`), validated like dungeons (3 to 6 rooms, every branch reaches the exit, hidden rooms are side branches). They compile to gate + room events (`src/core/dungeon/pseudo.ts`). The gate offers Enter / Leave, so nothing is forced (P2).

Rules: a loss ejects the player with a partial heal (half) and the run goes on; stage, badges and regions are untouched (P1, P5). Battles inside are marked `pseudo`. One reward item at most (P4). Caps: 1 per region, 2 per run, not on League stages, blocked in daily-route, boss-rush and quick-route (P3).

Wired entries (run catalogue, now enabled): Champion's Invitation, Distortion Rift, Lost Civilization, Trainer Tournament, Ancient Discovery (third choice).

Limits (all records are status "limited"):
- Safari, Dreamscape, Evil Hideout and Celestial Expanse gates are not opened by any event yet (Safari uses the live Preserve; no Dream Orb item; evil hideout is the live evil system).
- "2 stages before a Gym" is approximated by the League-stage and campaign blocks.
- ev-dimensional-collision stays disabled (needs W8 world flags).
- No save bump (counters live in itemCounters).

Tests: tests/unit/pseudoStages.test.ts. Next: W8 (needs W4).
