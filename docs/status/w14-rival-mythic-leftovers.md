# W14: rival interference, pseudo openers, 10 more Mythical chains

- Rival Interference (11.1): `src/core/rivals/interference.ts`, hooked in `run.ts` `rivalInterfere`, `GameSession`, `MapScene` side-stop click (only when no fight cut in). Foes steal 10% money (max 150) or take a heal/event stop (used up); allies and friendly rivals leave a Potion. 25% per stop, seeded, once per stage, twice per region, never League or boss node. Flags only (`interfere:*`), no save bump. Never starts a battle, so it cannot end a run. Tests: `tests/unit/rivalInterference.test.ts`.
- Pseudo-stage openers: `src/data/events/pseudo-openers.json` (Safari Ticket, The Dream Orb, A Suspicious Warehouse, The Star Path) open the four gates; records now "limited". Distortion World still has no opener. Evil Hideout is a plain event opener, not tied to the Evil Team schedule.
- Mythical chains: 22 quests now (added Arceus, Genesect, Magearna, Volcanion, Keldeo, Meltan, Zarude, Pecharunt, Darkrai, Phione). Same rules as before (one per run).
- Map hints and dungeon items: see the follow-up below.

## Follow-up: map hints and dungeon items
- Map-node hints: `nodeHint` (worldSim/tick.ts) puts the first unheard world rumour on about one node in three ("Word on the road" in the map info line). It is a pure read; the rumour is marked heard when you travel to that node (`GameSession.chooseNode`). No save bump.
- Dungeon items: Torch and Dungeon Key added to the item catalog (perk `dungeonSupply`, no effect outside dungeons). A trap room offers "Light a Torch" (crosses safely, torch spent); a door to a sealed room offers "Use a Dungeon Key" (spent). Dungeon caches give a Torch from tier 2 and a "supply pack" (2 Repels + Escape Rope) from tier 3. Limits: the supply pack is a cache bundle, not a sold bag item; real dark-room darkness is still not modelled; torches/keys are not on sale yet.
