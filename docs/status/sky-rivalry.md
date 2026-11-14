# Pidgey's Resolve, the Rivalry of the Sky (Beta 0.7)

Kice's spec (2026-11-14, "Region-Wide Story, Rival Episode"), built whole and with the text expanded, nothing cut. Code `src/core/sky/` (`state.ts`, `sim.ts` CPU-versus-CPU fights on the real battle engine, `story.ts` rules, `text.ts` words), scenes `src/data/events/sky-rivalry.json` (9 events, ids `sky.*`, forced, need the story-event setting `eventsDensity`), tests `tests/unit/skyRivalry.test.ts`.

- **Opening** (`sky.opening`, first stage): back the Pidgey or the Spearow and watch a real CPU fight (Lv 5 each, own seeded streams; the winner is the same whichever bird you back). Pidgey backed and wins: a Flying HM (`hm-fly`, an airship-style map item, 4 trips) and the story ends. Pidgey backed and loses / Spearow backed and wins: Pidgey vows, the story begins and remembers who you backed. Spearow backed and loses: nothing happens, the story still begins.
- **Through the region**: one meeting per stage (`sky.meet`, or `sky.alone` on a 30% roll, never the first). Spar (a real fight; it learns an answer move to the type that beat it, max 2), share a berry, give a held item (kept to the end), or walk on. Found alone: watch, leave a berry unseen, or leave. Fearow learns one move per meeting (peck, leer, pursuit, fury attack, aerial ace, agility, drill peck, drill run, sky attack) and has its own line each time.
- **Finale** (`sky.finale`, last stage of the region, before the Elite Four): Pidgeot against Fearow, CPU versus CPU, on the cliff with the wild Pokémon watching. When Pidgeot first drops under 35% HP the fight stops and `sky.cheer` asks who to cheer for. Cheer Pidgeot: it Mega Evolves from resolve alone ("Pidgeot's resolve is unwavering!"). Cheer Fearow: Pidgeot is furious, Attack +2. The fight is replayed from the seed with the answer, so reloading changes nothing. Fearow is always the stronger bird (Pidgeot's level + 6; training and gifts ease it by up to 2 and raise Pidgeot up to +6).
- **Endings**: Pidgeot wins and was cheered: it asks to join (Scrappy, `skyMega`: Mega Evolves with no ring and no stone, so it holds a normal item; Mega ability **Sky's Resolve**: Normal moves become Flying and +20%, its moves cannot miss, and moves used against it cannot miss either). Fearow wins after being cheered: it lands and can be recruited (Sniper, Drill Run). Pidgeot wins after Fearow was cheered: it leaves and is met next region (`sky.rematch`, one more fight, a Rare Candy on a win). Nobody asked or nobody cheered: both go their own way.
- **Afterstory**: the bird that did not join is overhead at the start of the next region (`sky.overhead`), alone and still training.

## Save
None bumped. New optional `run.expansion.sky` (Zod `SkyStateSchema`; older runs have none) and optional `skyMega: true` on a Pokémon (optional field; older saves load as they are). Round trip tested.

## Limits and decisions
- The CPU fights are narrated lines (the event result card), not a watched battle on the BattleScene; no new art or music. A live viewer is a follow-up.
- Decided for the cases the spec leaves open: a cheered Pidgeot that loses means both birds leave and nobody joins; Pidgeot winning without ever dropping under 35% means nobody is asked and nobody joins. Beating the rematch Pidgeot does not recruit it.
- Gifts are real held items taken from the Bag (berries and other held-type items); only the first goes onto a recruited Pidgeot (the rest stay "in its feathers").
- Story left hanging (the cheer never answered, the finale stage missed) is settled by a silent CPU fight when the Elite Four or the next region begins (`settleSky`).
- Needs the story-event setting (`eventsDensity`) like the other `xe.*` scenes; old seeds without it play exactly as before. The old `evo-pidgeys-resolve` card is disabled in #1292.
- `SKY_BALANCE` (levels, 30% alone roll, 35% threshold) lives in `src/core/sky/story.ts`, not `balance.json` (follow-up).
