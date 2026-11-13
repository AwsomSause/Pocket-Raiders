# THE REGION OF DOOM — Beta 0.6 Tenth Region

*Companion to `BETA_06_DESIGN_DOCUMENT.md` (§16). Originally a late-game idea in Beta 0.6; here it is specified as a generated, persistent consequence of how a player treats the evil teams across their runs.*

---

## 1. What it is

The Region of Doom (RoD) is an **optional tenth region**, built from the **Doom Ledger**: the meta record of how each run's evil teams ended (`ended = sealed | stayed | pardoned | exposed | …`, plus every Stay-Out). It is where the unfinished business of the other nine regions gathers.

- It is **unlocked** after the player has completed at least one run in any region **or** when 3+ teams have entered the Doom Ledger as "remnants".
- It is **generated**, not hand-authored, but from curated parts (§4). Two players with different histories see different districts.
- It is **optional**. Skipping it never blocks the main game.

## 2. Structure

14 districts, 8 Evil Team Gyms and a final confrontation.

| # | District | Theme | Typical team presence |
| --- | --- | --- | --- |
| 1 | **Rocket Row** | Game Corner arcades, shuttered Silph floors, a dusty radio studio | Team Rocket, Rocket (Return), Rocket Remnants |
| 2 | **Tide and Ember** | Flooded caves, volcano rims, two stolen Orbs | Team Aqua, Team Magma |
| 3 | **Chain Quarter** | Pillar stairs, red-chain markets | Team Galactic |
| 4 | **Frost Crown** | Frozen bridges, frigate wrecks | Team Plasma |
| 5 | **Weapon Yard** | Lab ruins, cafes with locked basements | Team Flare |
| 6 | **Po Quarter** | Graffiti streets, pink-walled mansions | Team Skull, Aether Foundation |
| 7 | **Wormhole Beach** | Paradise gates, Snag Machine stalls | Aether Foundation, Team Snag'em |
| 8 | **Plant and Tower** | An energy plant, a lit-up tower, a fan hall | Macro Cosmos, Team Yell |
| 9 | **Starfall Avenue** | Parked Starmobiles, five Bases | Team Star |
| 10 | **Black Market Mile** | A hub of fences and brokers | Mixed |
| 11 | **The Pale Garden** | Where purification sites hide | None (neutral) |
| 12 | **Wire Row** | Hacker dens and rumor mills | Mixed |
| 13 | **Crown Yard** | Where the strongest teams meet | Mixed |
| 14 | **The Undercroft** | The final district | All |

District inclusion is **weighted by the Doom Ledger**: a district appears with probability proportional to how many of that team's runs ended in `stayed` or `escaped`. Districts 10, 11, 12, 13 and 14 always appear.

## 3. Evil Team Gyms (8)

Instead of badges, the player earns **Doom Marks** by defeating Evil Team Gym Leaders: former Executives, Seconds and Leaders from the Doom Ledger who now run territories.

| Gym | Leader source | Type bias | Rule |
| --- | --- | --- | --- |
| 1 | Highest-ranked surviving **Executive** from the most recent Stay-Out | Mixed | Standard |
| 2 | Highest-ranked surviving **Second** | Team's preferred type | Standard + Trait |
| 3 | A **Leader** who was pardoned | Team's type | Mercy battle (no KO option) |
| 4 | A **Leader** who was exposed | Dark | Ambush pre-battle |
| 5 | A **Defector** from any run | Mixed | Chemistry check |
| 6 | The rival (Side-with or Beat-you) | Rival's ace type | Rival callback |
| 7 | A **Doctrine-bearing Leader** | Team's type | Doctrine active |
| 8 | **The Chairperson of the Undercroft** (generated) | Mixed | Final |

If the Doom Ledger lacks a source for a slot, the generator fills it with an original **placeholder Leader** from `data/doom_leaders.json` (invented characters, never canon). Canon leaders (for example, Giovanni or Cyrus) appear as Gym Leaders only when the Ledger supplies them, and keep their canon team, types and dialogue.

## 4. Generation inputs

```
DoomLedger {
  entries: [{ runId, regionId, teamId, ended, rivalVariant, raidResults[], climaxResult, stayedOut, timestamp }],
  aggregates: { byTeam, byRegion, byEnding }
}
```

The generator reads `aggregates` and:
1. **Selects districts** (weighted, §2).
2. **Seeds territory control** (which team holds which district; ties broken by `teamId` hash).
3. **Fills Gym Leaders** (§3).
4. **Sets the Doom Level** (0–5) = min(5, distinct teams in the Ledger + number of `triumphant` entries). A team that won because the player lost the climax (`ended = triumphant`, run `climax-defeat`) enters with +1 Doom Level.
5. **Picks the Undercroft's Chairperson** from a pool, flavored by the dominant ending.

Seeded RNG: `rng(hash(profileSeed, "region-of-doom", ledgerVersion))`.

## 5. Progression

- The player enters with **Doom Level L** and a party of any size.
- Doom Marks (8) unlock the Undercroft.
- Territory can shift: **taking a district** changes its control to **Neutral** and lowers the Doom Level by 0.2 per district (rounded at thresholds).
- Black Markets (District 10) sell contraband (Shadow-binding tools, Intel packs, forged Passes) that are **not** required.
- Purification Sites (District 11) are always safe.

## 6. Rules specific to the Region of Doom

| Rule | Effect |
| --- | --- |
| **Ambush rate** | Base 20%; +3% per Doom Level; capped at 35% |
| **Heat** | Starts at 40; never fully resets |
| **Shadow encounters** | Up to 15% of wild encounters in active territories (higher than the 5% elsewhere) |
| **Raids** | Replaced with **Takeovers**: a PS-RAID with a single objective (hold the district) |
| **Rivals** | A different rival archetype appears (rolled from the Doom Ledger's most frequent variant) |
| **Loss** | A loss never ends the Doom Ledger; it ends the RoD attempt (retry from the entrance) |

## 7. Rewards

- **Doom Marks** (cosmetic + a minor run-start perk).
- **Echo Abilities** (see Shadow doc §4).
- **Legendary Sightings** that did not appear in the base regions.
- **A Doom Ledger Epitaph**: a written summary of the player's history, displayed in the Hall.

## 8. Test checklist

- The generator produces 14 districts for any ledger; fixed districts always appear.
- A canon character appears as an RoD Gym Leader only if the Doom Ledger supplied them; placeholder Leaders are always original.
- Retrying after a loss does not reset the Doom Ledger.
- Doom Level decreases monotonic with districts taken.
- Skipping the RoD has zero effect on main-game progression.
