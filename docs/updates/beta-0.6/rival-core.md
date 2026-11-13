# Rival core (R1-R3, R10)

## Player gets
- Your main rival is locked in the moment it is first met: same id and role for the whole run, never changes role.
- Lead: a score from -3 to +3. A rival win is +1, a rival loss is -1. It never changes levels.
- Up to 5 Marks per rival and six feelings (Friendship, Respect, Trust, Rivalry, Resentment, Admiration), each 0-10, changed by a data table.
- First-stage pity: after 5 straight first-stage losses to a rival, it comes back 2 levels lower, with AI tier 3 and advice. Any rival win resets it.

## Save
- No version bump. State is `run.expansion.rival[rivalId]` inside the optional v43 expansion block; v42/v43 runs load as before. Run 44 stays free.
- Per run only (no cross-run rival memory).

## Limits
- Reads and writes only; the Rival Report, dialogue, tier-5 AI and the Friend (workstream 5) use `src/core/rivals/overhaul.ts`: `registerRival`, `assertRivalLock`, `recordRivalBattle`, `pityFor`, `changeFeelings`, `addMark`.
- Pity's AI tier 3 is returned by `pityFor`; the tier-5 AI work consumes it. The level change is applied now.
- Only the main rival is registered automatically. The Friend registers with role `friend` (workstream 5).
- The old "Feels Left Out" offer (askLead.ts) is a different thing (a Pokémon asking to lead) and is unchanged.
- Pack personalities map to existing profile ids; 8 styles and 8 arcs are chosen from existing ids (`src/data/rivalOverhaul.json`).
