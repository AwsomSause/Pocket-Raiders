# Harder rivals (Kice, 2026-11-06)

Done:
- The scripted first rival now has two Pokémon: an opener at the player's level and an ace (last in the team) at the player's level +2. "Player level" is the party's highest level, capped by the stage level cap. Numbers live in `balance.rival` (`members`, `openerOffset`, `aceOffset`, `followPlayer`).
- A rival loss never ends a run: the party is healed, the node counts as done, no prize, and the loss goes into memories, the chronicle and the rival's record. This was Story Run only; it now covers every mode except Adventure (checkpoints) and Death-Block, which keep their own wipe rules. Switch: `balance.rival.softLoss`. Classic counts losses in `story.flags['story:losses']`.
- A survived loss now counts toward the Modifier Run offer, like a win.

Also fixed (my earlier W6/W7 content, red on main): potion tier 2 for dungeon caches is now `potion` (rarity order test); five pseudo stages with no entry event are marked disabled and build no rooms (Safari, Distortion World, Dreamscape, Evil Hideout, Celestial Expanse).

Sim (100 runs, smart bot): early rival win rate 89% -> 57% (target 40-60%); runs ended by a rival 36 -> 4 (those 4 are Adventure/Death-Block style or unlisted fights). The sim now counts a survived loss as a loss, not a win.

Limits: story-event fights (not rival fights) still end a run when lost; the mid and late rival bands can't be measured because the bot never gets past region 1 or 2.
