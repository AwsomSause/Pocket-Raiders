# Pidgey's Resolve, the Rivalry of the Sky

Branch: `claude/project-thread-fovpco` into `beta-0.7`. Kice's spec (Region-Wide Story, Rival Episode), whole, text expanded.

## Player gets

- A Pidgey and a Spearow fight over a branch (a CPU-versus-CPU battle on the real engine); back one. Pidgey backed and winning gives a Flying HM and ends the story; every other result starts the rivalry (Pidgey remembers who you backed).
- Pidgey meets you once per stage: spar it (it learns an answer to what beat it), boost it with berries and held items (it keeps every gift to the end), or find it training alone. Fearow learns one move per stage.
- The cliff finale before the Elite Four: Pidgeot against Fearow, CPU versus CPU. Under 35% HP you choose who to cheer: Pidgeot Mega Evolves from resolve alone; Fearow's cheer makes Pidgeot furious (Attack +2).
- Endings: Pidgeot joins (Scrappy, stoneless Mega, Mega ability Sky's Resolve: Normal moves become Flying +20%, its moves cannot miss, moves against it cannot miss either); Fearow lands and can join (Sniper, Drill Run); a Pidgeot that left is fought once more next region. The bird that did not join is overhead at the start of the next region.

## Save

None bumped. Optional `run.expansion.sky` and optional `skyMega` on a Pokémon; both default to absent in older saves.

## Limits

CPU fights are told as text lines, not shown on the battle scene. Scenes need the story-event setting. Details and the choices made for cases the spec leaves open: `docs/status/sky-rivalry.md`.
