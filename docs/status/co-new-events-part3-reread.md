# Part 3 re-read (NE51 to NE75), 2026-11-15

Built in `tools/events/co/new-events-3.ts` (47 scenes: NE51 to NE60 and NE66 to NE75). Checked every choice, Remembers, reward and Afterstory against NEW_EVENTS_3.md.

**Waiting on markets:** NE61 to NE65 (the five trade events) need the Honest Trade Card effect `honestTrade`, which markets owns and hasn't pushed. Coordinator: leave them out until markets resumes (they also need the pool file `tradePools/new-events.json` and the quirks Burrower and Warm, whose rules the pack doesn't state).

Fixed in this pass: quirks defined with real hooks (`src/data/catalogOverhaul/quirks/new-events.json`): Smoke Crier (+1 Bond per badge), Victory Dancer (+1 Bond per Gym win), Won't Fall (survives one Electric KO per battle), Slow Kindling (Fire −20% until Bond 3, then +10%), Dreamer (new hook `evolvesInto`: a Poliwhirl becomes Politoed at 36), Protector (new hook `guardAlly`: takes one teammate's knockout hit per battle, held at 1 HP or more), plus Slow to Trust and Old Hand for the trades. NE54's battle uses a new rule `foeEndures: 3` (the Taillow can't fall before your third hit). NE52's tag battle and NE55's Step 15 scene are written directly (no patching after the list, so the done flags stay). Rewards the doc doesn't give removed from afterstories (NE51, NE54, NE56, NE57, NE60, NE68, NE69, NE72, NE74, NE75). NE58 line split. Reads of `intel`, `honest-lied`, `journalist-interview`, `fed-poochyena`, `haddon-ferried` switched on (other threads' flags; a variant stays hidden while nobody sets them).

All built, except (needs engine or item, not faked):
- NE53 the "[Name] didn't move. It didn't need to." battle line; PA6 paying an extra Bond (`slow-accepted` is set for it).
- NE54 afterstory: the Swellow taking a lightning bolt for the lead is a scene at a rest, not a battle moment.
- NE56/NE57/NE60: the Hideout changes (one Grunt fewer, a room skipped, guards moved) are flags the evil-story thread reads: `team-grunt-tin`, `team-mum-coming`, `team-uniform`, `team-op-stopped`, `teams-feud`, `remnants-op-stopped`.
- NE58 "Rainbow Rocket includes this boss" (`team-boss-free` set).
- NE66 pocket watch and NE68 whistle are key items with no item yet (flags `pocket-watch`, `abara-whistle`).
- Cross-run (left out by Kice's rule): NE67 rowing school, NE69 grown-up guide Ferdinand.
