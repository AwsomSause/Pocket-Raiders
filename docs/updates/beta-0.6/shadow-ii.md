# Shadow Pokémon II (E6)

## Player gets
- Every Shadow Pokémon now has a tier from its Heart Gauge (Corruption 1-100): Veiled 1-25, Bound 26-50, Gripped 51-75, Fallen 76-100. Damage bonus +5/10/15/20%; Fallen takes about 15% more damage.
- Whether a Shadow will disobey is decided at the start of the turn and shown in the "What will X do?" box before you choose. Veiled may hesitate (5%); Gripped (15%) and Fallen (25%) replace your command with one of their own moves, and the box names that move. The turn then plays out exactly as shown.
- Named Shadows have a purification key (a person, place, object or act) with three hints: one on arrival, a second after a won battle together, all three on the summary screen. Meeting the key frees it for good. Until then ordinary soothing is half strength. If a key becomes impossible it turns Common (`markKeyGone`) and the summary says so.
- Keys now live for First Snag, The Gift, Amberjack, Shellshock, Matron, The Black Fog and Marrowmother (Kanto and the roaming Snag'em ones). Two story events hand out First Snag and The Gift now (Story Runs only).
- Heart scars (two per Pokémon, a third is refused): Steadfast (-3% damage taken), Kept Promise (friendship +10% faster), Soft-hearted (healing items +10%). Heart Bond purification leaves Steadfast; each key leaves its own scar.
- A party can hold at most 2 Gripped or Fallen Shadows; a third cannot join the party.

## Save
- No version bump. Optional fields only: `pokemon.shadow.{named,keyGone,hints}` and `pokemon.scars`. Older runs load untouched (test in `tests/unit/shadow2.test.ts`).
- The disobey check uses its own stream, derived from the Pokémon, the turn and the battle stream's state at turn start. It never draws from the battle stream.

## Limits
- Old rule change on purpose: the old Sealed "ignores your command" roll and the flat 1.2x / 1.15x Shadow damage are replaced by the tier rules. Enemy Shadows get the tier damage numbers but do not disobey their own trainer yet.
- Not in this PR: Surge meter, the 14 Shadow moves and 20 abilities, Gripped -10% accuracy, the other 17 scars, Mentor, Reclaim, the Reservoir and Apex Shadows (Colossus, workstream 15). A disobeying Pokémon uses one of its own ordinary moves.
- Only First Snag and The Gift are obtainable in play today. The other Named Shadows have keys and a `grantNamedShadow` / `namedShadow` event effect ready; their raids and events (workstreams 14 and 16) set the key flags (`xk-fossil-registered`, `xk-matron-child-returned`, `xk-tower-cleansed`, `xk-cubone-at-tower-top`, `xk-amber-technician-beaten`) with the existing `flag` event effect. Amberjack's outdoors rule counts a won wild fight with it leading.
- Cipher, Reservoir and Apex keys wait for the Grand Arc and Colossus work.

## Update: Kanto Named Shadows in play (follow-up, same branch as Stand With Them)
- Amberjack ("The Amber Lab": beat the technician, then win a wild fight with it leading), Shellshock ("The Fossil Vault" then "The Pewter Museum Registry"), Matron ("The Poachers' Truck": driving off the poachers returns her child, which is her key) and The Black Fog ("Fog Over Lavender" then "The Old Rites") can now be met in a Kanto run with the Grand Arc on. The key events free them for good.
- Still not obtainable: Marrowmother and M2 (story-bound and Apex Shadows are never captured; their scenes and the Colossus fight come with the Extended Cut), and The Black Fog's world-state-3 gate (the track is not built). These events do not use the Kanto canon spaces yet because nothing reads the Town Roll menu; when it does, they can be moved into those spaces.
