# Ultra Beast Incursions (INSTRUMENTALITY U1)

PR: into `beta-0.7` (rename this file to `<pr>-ultra-beasts.md` once the number is known).
Plan: `docs/plans/instrumentality/notes-pack/ULTRA_BEAST_INCURSIONS.md`. Setting: Settings > Ultra Beast Incursions (`expansion.ultraBeastsEnabled`, OFF by default per the update rules; read when a run starts).

## Player gets
- **Hidden Appetites.** Ten tallies of how you play (one Pokémon doing most of the damage, one-hit knockouts, flawless wins, stat raises, long battles, crits, items used, full-party battles, one-hit/self-KO showmanship, Pokémon lost). Nothing is shown.
- **Static, Tear, Incursion** (from stage 3, never in a League stage, one Beast per run). When an Appetite is over its threshold, the next stage start brings a rumour ("the sky is the wrong colour"), and Looker and Anabel's parcel (one Beast Ball, once). The stage after, a **Tear** stop appears on the map and the Beast's **Ultra Rule** applies to every battle of that stage, both sides. Leave it alone for a stage and the Beast **comes out**: it takes the stage's first wild fight with the Ultra Aura (+1 to all stats). Enter it and you get a 2-fight **Crossing** (home-world fights under the rule, 2 Ultra Shards) and then the **Beast at home** (approach it for a fight, or take a Shard and go).
- **Beast Balls.** Ordinary balls catch an Ultra Beast at a tenth of their rate (when the system is on); a Beast Ball catches it at the normal rate (it already existed in shops; the Task Force parcel and **3 Shards = 1 Beast Ball**, forged at every stage start, are the new sources).
- **A caught Beast** brings its Ultra Rule to every battle. It gets **Homesickness** (+1 per stage; falls for some Beasts when you win a boss fight, win without damage, win in one hit, win a one-hit knockout or keep a full healthy party, or when it holds an item). At 10 it leaves, and takes its rule.
- **The 11 rules** (all engine hooks, both sides): Host, Flex, Untouchable, Overload, Slow Burn, Paper Cut, Devour, Many as One, Finale, Cling (no effect), Beast Boost for All. Per-rule 5,000-battle sims run in `tests/unit/ultraBeasts.test.ts`.

## Save
None. `run.expansion.ultra` is optional (absent on older runs and when the setting is off), `battle.ultra` is optional, the event rule gained an optional `ultra`, and `run.story.flags` carry the Shards (`ev:ultra-shard`). No version bump, so no migration test. Round-trip and old-run tests are in the new test file.

## Limits (documented, not hidden)
- **No cross-run memory** (Kice, 2026-11-14): no Faller rank, Faller's Log, Souvenirs, Ultra Megalopolis unlock or "bring a Poipole into a new run". Poipole and Naganadel never invade on their own; Poipole's follow-and-evolve path is not built.
- **Return or keep** a Beast at a Tear is not built; a held Beast simply leaves at Homesickness 10.
- **Worlds are short:** the Crossing is a 2-fight chain and a Beast event, not a 4-6 node stage. World laws are applied only for Nihilego (double battles) and Stakataka (no switching); the other nine laws are text only. Blacephalon's audience meter, Xurkitree's lightning, Kartana's half HP and Guzzlord's node cost are not built (Guzzlord's buy-back was already cut).
- **Overload** doubles stat changes but the ±6 ceiling is kept. **Host** possesses the two leads only (not later switch-ins).
- **Appetites** count a simplified set: Consumption counts items used in battle (not buying, selling or releasing); Strength counts one-hit knockouts; Spectacle counts one-hit KOs and self-KOs (not performances).
- Homesickness falls by "rest", "storms", "being fed" and "Electric Terrain" are not tracked (those Beasts only ever rise).
- Appetite thresholds are first guesses (3 to 10) and have not been tuned against bot runs.
- **Sim fairness:** the battle sim has a seat bias of its own (the second seat wins about 60% even with Cling, which changes nothing), so each rule is held to the plan's 60% line or to "no worse than 4 points beyond Cling". No rule is worse than that.
- Art is not needed (Kice): the Tear is an ordinary event stop.
