# Pick spread and sim-100k rebalances (2026-11-17)

From Kice's 100k-run sim tables. All numbers live in data (`balance.json`, `story.json`, `dramaEvents.json`, `gameEvents.json`).

- **Main rival personality**: was ~59% bitter-challenger (archetypes with no pack personality fell back to one constant id) and ~15% protector (unknown-name fallback = first sorted). Now an even seed-stable pick across all 8 (`rivals/overhaul.ts`, `rivals/major.ts`).
- **Ultra Beast**: the "highest ratio" rule gave Symbiont ~85%. Now a seeded pick among all ready Appetites (`ultra/run.ts`).
- **Homeland Week** (new dated game event, 2026-11-18 to 2026-11-24 UTC): Kanto, Hoenn, Galar 3x as likely to be the first region (`firstRegionBoost`, `regions.ts`). Change `start`/`end` in `gameEvents.json` if the deploy date moves.
- **Story moments**: per-run cap per moment (`rarity.perRunCap` 5, `perRunCaps`: riled-up 2 ...), higher rarity chances; Still Standing 100% -> 25%, once per region per Pokémon.
- **Drama**: Last-Second Resolve 100% -> 30% with cooldown 5; rare ones (mercy, ace reveal, failed technique, unexpected respect, breakthrough evolution) loosened.
- **Survive a fatal hit**: bases and friendship gates lowered for the rarer causes.
- **Emotions**: turning points at 2 (justice 4), patience from set-up boosts; a Pokémon keeps its emotion until another leads by 2 tags.
- **Gym Leaders**: level now matches the player's top-3 average (gym bonus 0, no cap on the party correction); region level cap still applies.
- **Enemy healing items**: ordinary 1, Gym 2, E4 2 (+1 per 150 levels); Rivals and Champions keep the player's budget (boss gear rule).
- **SOS**: call rate x0.3 (`balance.sos.callScale`).

Not done yet: raising the other special battle tags (arena, grudge, echo, raid, event rule, spectate, nemesis, totem, narrative, rival).
Blessing odds (Kyurem 8% vs ~3.7% each Greater) left as is: Kice's call.
