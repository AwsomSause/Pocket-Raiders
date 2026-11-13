# EXPANDED EDITION — Design Note

*How the Expanded Edition is built, what every expanded script contains, and the naming rules. Read this before the files in `scripts/expanded/`.*

## 1. Intent

You asked for the pack to be 3–5x bigger: more detail, depth, phases, dialogue and events, named special team versions of characters and Pokémon, special Shadow Pokémon, and wider scales. The story scripts (`scripts/00`–`10`, about 34,700 words) are the part that grows. System documents and generated pool tables stay as they are.

**Goals**
- Every team's story plays at five scales, from one street to the whole world.
- Every team has a named cast three times the size, including **team versions** of characters the player already knows.
- Every team has a named line of **special Pokémon** and a set of **special Shadow Pokémon** with one **Apex Shadow**.
- Every climax has an **Extended Cut** of about eight phases.
- One cross-region arc (`docs/GRAND_ARC.md`) ties the teams together.

**Non-goals:** no change to pools, boss teams, run events, or the confirmed decisions (D1–D9). **Anti-goal:** nothing here may make a run unwinnable or force Shadow use (Shadow doc §10).

## 2. Approach (and the ones not taken)

| Approach | Trade-off | Verdict |
| --- | --- | --- |
| **Companion volumes**: one `*_EXPANDED.md` beside each base script | Base scripts and their 1,373 checks stay intact; a reader sees base and expansion side by side | **Chosen** |
| Rewrite each base script in place | One file per team, but the parser and every downstream JSON would need rework and old references would break | Not taken |
| Generate the expansion from templates | Fast and uniform, but dialogue and scenes would read as filler | Not taken |

Each expanded script is hand-written. Its three roster tables (cast, special Pokémon, special Shadows) follow fixed columns so `tools/build_expansion.js` can read them into `data/expansion.json` and check every species against your Pokédex.

## 3. What every expanded script contains

| § | Section | Contents |
| --- | --- | --- |
| E1 | **The Wider Scale** | The plan at five scales, a five-step world-state track, and the bigger secret |
| E2 | **Expanded Cast** | New officers and specialists; team versions of known characters; the rival's and the player's team versions |
| E3 | **Special Pokémon** | The team's named variant line and its members |
| E4 | **Special Shadow Pokémon** | Named Shadows and the Apex Shadow |
| E5 | **New Story Events** | New scenes with full dialogue and choices |
| E6 | **Raids, Expanded** | Deeper phases for the base raids and two new raids |
| E7 | **The Climax — Extended Cut** | About eight phases with dialogue |
| E8 | **Aftermath and the Thread** | Epilogues and the hook into the cross-region arc |
| E9 | **Dialogue Bank** | Ambush lines, boss barks, civilian lines by world state |
| E10 | **Flags and Wiring** | New flags, ids and counts |

## 4. The five scales

| Scale | What it means | Typical content |
| --- | --- | --- |
| 1 **Street** | One block, one victim | Rumors, shakedowns, a stolen Pokémon |
| 2 **City** | One town changes | A front business, a curfew, a closed route |
| 3 **Region** | The whole map feels it | Blocked roads, prices, weather, broadcasts |
| 4 **Border** | It leaks into the next region | Shipments, refugees, a liaison from outside |
| 5 **World** | It joins the cross-region arc | The supplier behind every team |

**World-state track.** Each team has a five-step track named for its plan. A step is gained when a raid is failed or declined, or when the climax is scheduled; a step is removed by a raid Success or better. The track changes civilian lines, shop stock and one regional rule per step. It never changes battle difficulty beyond the bounds in the design document §6.6.

## 5. Wide-scale battle formats

| Format | Rules in one line |
| --- | --- |
| **Siege Map** | The climax city is split into districts (Held / Contested / Lost); allies hold districts; each Lost district adds one announced effect |
| **Front** | Three 1-on-1 lanes at once; the player acts in one lane per turn and allies act in the others |
| **Convoy** | A chase of 3–5 battles with a distance meter; winning fast closes the gap |
| **Colossus** | A boss with parts and shield bars; breaking a part removes one of its moves |
| **Blackout** | A battle under a team-wide condition that an objective can switch off |

## 6. The Extended Cut

`climax.cut = "extended"` (default) or `"standard"` (the base script, unchanged). The Extended Cut has 13–18 battles where the Standard Cut has 8–12, so it adds protection: **two checkpoints**, and a **Breather** at the midpoint (heal 50%, revive one Pokémon, no shop). Decision D1 still applies: losing the climax ends the run. All raid effects stay inside the bounds of design document §6.6.

## 7. Names and ids

| Thing | Id | Rule |
| --- | --- | --- |
| Special character | `sc.<team>.<slug>` | A canon character is marked *canon*; a turned or invented version is marked *what-if* |
| Special Pokémon | `sv.<team>.<slug>` | Species must exist in your Pokédex; the trait is always announced in battle |
| Special Shadow | `ss.<team>.<slug>` | Uses the Shadow doc's tiers, abilities and moves; an Apex has a project code |
| Story event | `xe.<region>.<slug>` | Lists trigger, beats, choices and flags |
| New raid site | `pr.<region>.<site>` | Follows the base raid template and result table |
| Flag | `<team>.x.<name>` | `x` marks an Expanded Edition flag |

**Variant lines.** Each team's special Pokémon share a line name (for example Rocket's **Black-Label**). A line has one shared rule and each member has one signature trait.

**Apex Shadows** carry a Cipher project code. `XD001` (Shadow Lugia) is canon; `XD002` onward are original to this pack.

## 8. The cross-region arc in one paragraph

Every team's Shadow method came from one supplier: **Cipher**, the organization that created Shadow Pokémon, with Team Snag'em as its collectors. Each region has one Cipher **liaison** embedded with the local team. Beating the liaison drops a **Data ROM**. Collected ROMs open the finale in `docs/GRAND_ARC.md`.

## 9. Left to the builder

Levels, exact stat changes for special Pokémon, art, and the final move data. Every number here is a launch default.
