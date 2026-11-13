# Kanto Canon Spaces: Cerulean, part 1 (workstream 18)

**Player gets:** In a Kanto run (Kanto setting on), the Cerulean stage always has the **Bridge**. Cross it: 50% you reach **Nugget Bridge** (five trainers, then a Rocket Grunt offers a job: refuse for a Nugget and +1 Intel, or accept for a free fight, a Nugget and a hook flag). The other 50% the bridge breaks and you land in the **Hidden Village**: two wild fights, the Healing Pool / Berry Shrine / Elder (pick one), then one of nine Grass-starter trials (1 in 9 each). Win it for the starter with its egg move; fail for a Miracle Seed. A rope takes you back.
Rolled for the stage: **Squirtle Squad** (65% pranksters: three Squirtle, then a Wartortle; 35% standoff), then the **Blastoise** boss if your best Pokémon is 3+ levels over the stage. The reward is a Squad **Squirtle with Contrary, Swagger and Hex** holding **Cool Shades** (immune to Intimidate; the first use of each status move goes first). **Damian's Unofficial Gym** (optional): a Swimmer, a Fire Spirit, then Damian; you get the Unofficial Badge (sells for 300) and Water Pulse. **Cerulean Burglary**: chase a Rocket Grunt for Dig and less Rocket heat.

**Save:** no version bump. New optional field `fixedAbility` on a Pokémon (older saves load as they are). New data-only pieces: held hook `coolShades`, condition `partyLevelOver`, `join.ability`, `teachMove.slot`.

**Limits:**
- The Hidden Village trials are short choice and chance checks (picks with different odds) or fights, not the mini-games the pack describes (timing taps, rhythm, stealth); a fail gives the Miracle Seed with no retry.
- The Hidden Village is only reached from the Bridge fall; it has no separate Town Roll entry.
- Squad hose hazard (Speed -1 on the first turn) and the Blastoise's Skull Bash / Water Spout are not built; the Blastoise is a plain wild one.
- The Unofficial Badge is a sellable valuable, not a keepsake item; Cool Shades uses the Black Glasses picture.
- The Charmander tie-in (Damian as Cold Nights Rain's previous owner), Cold Nights Rain, Bill's Lighthouse, Route 5 Day-Care and Cerulean Cave come in later slices.
