# Expanded notes

Nine documents built from the seven files you sent (`Stuff.md`, `Stuff_2.md`, `Whole_Run_Events.md`, `Legendary_Blessing_Framing.md`, `Greenneedle.md`, `greenneedle_extras.md`, `Rival_System_Overhaul_Rough_Draft.md`) and the encounter graph.

| File | What it is |
| --- | --- |
| **`MASTER_DESIGN_DOCUMENT.md`** | **Everything below combined into one file for the main project:** a new integration chapter (Part 0), then the nine documents as Parts 1 to 9 with cross-references rewritten and linked entries woven together |
| `GREENNEEDLE_NEW_EVENTS.md` | 38 brand-new events, each with a cold open, the episode, endings, reward and afterstory |
| `GREENNEEDLE_EVENTS_REWORKED.md` | All 62 of your events, with the extras notes turned into rules, numbers and endings |
| `RIVAL_SYSTEM_OVERHAUL.md` | The rival draft and both Stuff files consolidated into one spec to build first |
| `RIVAL_DIALOGUE_BANK.md` | 528 written lines for 8 personalities; every Pokédex entry resolves to 4 or more lines per personality |
| `LEGENDARY_BLESSINGS.md` | Opening sequence, tiers, Influence, Communion, and 71 blessings: one for every Legendary in the Pokédex |
| `MYTHICAL_PROMISES.md` | The Mythical system: Tellings, the Visit, the Promise, the Guest and its Wonder, the Keepsake; all 23 Mythicals |
| `ULTRA_BEAST_INCURSIONS.md` | The Ultra Beast system: Appetites, Tears, home worlds, Ultra Rules, Beast Balls, Homesickness, Faller rank; all 11 Beasts |
| `WHOLE_RUN_EVENTS.md` | The framework, *Guidance of Giratina* in full, and four more |
| `BALANCE_AND_SYSTEMS.md` | The encounter graph read and fixed, rarity, starters, items, healing, anti-sweep, Gym curve, Elite Four counter-picking, the map |

## Data and tools

| Path | What it is |
| --- | --- |
| `tools/rival_lines_source.js` | The rival lines. Edit this, not the Markdown |
| `tools/build_rival_bank.js` | Rebuilds `RIVAL_DIALOGUE_BANK.md` and the two JSON files, and checks coverage. `node tools/build_rival_bank.js "Gengar"` prints one species |
| `tools/check_notes.js` | Checks the documents: counts, cross-references, species names, and that every Legendary, Mythical and Ultra Beast in the Pokédex has exactly one entry |
| `tools/build_master.js` | Rebuilds `MASTER_DESIGN_DOCUMENT.md` from the nine documents, `tools/master_front.md` (Part 0) and `tools/integration_map.js` (which events serve which Pokémon) |
| `tools/build_blessings.js` | Rebuilds the blessings roster from `tools/blessings_roster_a.md` and `_b.md` |
| `data/rival_dialogue_bank.json` | The bank as data |
| `data/rival_species_lines.json` | The resolved lines for all 1,673 Pokédex entries |
| `data/retag_candidates.json` | The 58 Common-tagged species the balance document suggests re-tagging |

The tools read the Pokédex at `../beta06/data/source/pokedex.json`, so keep this folder beside `beta06/`.

## What to know

- Every number is a starting value. None of this has been playtested.
- Three choices of mine that you may want to overrule are stated where they apply: the Giratina leader's breakdown is an original speech, not lines from Dragon Ball Super; harm to children in that story is never shown; held Berries and Leftovers still work under the "no healing items in battle" rule.
- One line in `Stuff.md` could be read two ways (the "first of the two types" rule). `BALANCE_AND_SYSTEMS.md` section 2.6 says how I read it.
