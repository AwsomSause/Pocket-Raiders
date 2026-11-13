# PS-RESCUE: Door and Cage battles and the annex (R9)

**Player gets:** the rival's Quiet Extraction and Loud Grab now have real fights.
- **Quiet Extraction:** no fight at the Approach, but always at least one fight. Clean play meets one guard at the Cage; a poor choice at the Door adds a guard there; a poor choice at the Cage means a guard there too (two at most).
- **Loud Grab:** a guard fights you after every beat (three fights), and your rival's first Pokémon fights beside you when the rival has one.
- The Inside Job, the Deal and the Exchange have no fights.
- The Rescue screen shows the annex as three stops (Approach, Door, Cage), the holding site's own words for each, and how many guards you have beaten.
- The Door is the one checkpoint: the run is saved there, and a reload resumes the plan. After a fight the map reopens the Rescue screen where it stopped.
- Win every fight and the plan goes to its normal roll. Lose one and the plan fails (nothing returns, the hold stays). Nobody's run ends; the party is patched up by the pseudo-stage rule.

**Save:** no version bump. `run.expansion.rescue.active` gains `fights`, `fightNow`, `wiped` (defaults, so old saves and plans load unchanged). Tested.

**Limits:**
- The annex is the three-stop strip on the Rescue screen, not a drawn map, and the fight uses the usual battle backdrop; the `pr.*` annex ids in `rivalRescue.json` are not separate maps yet.
- A lost fight heals the party by the pseudo-stage rule, not "1 HP" as the plan text says.
- Rival Assist uses the rival's first Pokémon as a loaner for each Loud fight (budget 3 = the three fights); it only appears when a story rival with a team is registered.
- The guard foes come from the holding team's grunt Pokémon at ordinary event-fight levels.
