# Catalog Overhaul Pack: Kanto Canon Spaces (`kanto-canon`, plan row 16)

Source: `/mnt/project-files/catalog_overhaul_pack/kanto_canon_spaces/` (`KANTO_PLACED_1.md` to `_6.md`, `CANON_SPACES_KANTO*.md`). Greenneedle owns the spaces in `CANON_SPACES_KANTO_MOVED_TO_GREENNEEDLE.md` (forest, moon, magikarp, the Cerulean bridge/village/rain/squad/Bill/Damian, S.S. Anne, Kaiju, Maiden, Flight North, Factory, Safari Land, Savanna, Jungle, Labyrinth, Route 25, Tournament); this category leaves them alone.

- Build: `npm run co:kanto-canon` (catalog rows, co event files, placement, pseudo-stages, flags, status). Modules: `tools/events/co/kanto-canon-<n>.ts`, shared helpers `tools/events/co/_kc.ts`.
- Rules no general effect covers: `kc` effect and condition (`src/core/expansion/canonKantoRules.ts`): stat gain, museum pay, Fossil Fragment, Day-Care leave/return (+Egg), revive one, Parting Gift, Bond.
- Placement: `src/core/expansion/canonKantoPlaced.ts` puts each space in its doc window (must-see: every node of its home step; `homes` gives a later stage its own step), plus follow-up scenes at later stages. Stage 8 only rolls spaces the docs place at Stage 8.
- Pseudo-stages: `src/data/catalogOverhaul/pseudo/kanto-canon.json` (chain format, lead/legends loader).
- Flags: `src/data/catalogOverhaul/flags/kanto-canon.json` (generated). Save: none.

## Re-read table
| Space ids | Doc and section | Checked |
|---|---|---|
| `cs.kanto.viridian.oldman`, `.route22`, `.parcel`, `.school`, `.diglett` | `KANTO_PLACED_1.md`, Viridian (lines 47–210) | 2026-11-15 |
| `cs.kanto.pewter.rest`, `.museum`, `.flock` | `KANTO_PLACED_1.md`, Pewter (211–318) | 2026-11-15 |
| `cs.kanto.cerulean.burglary`, `.daycare` (`.cave` is scripted in Part 2) | `KANTO_PLACED_1.md`, Cerulean (319–384) | 2026-11-15 |
| `cs.kanto.vermilion.fishclub`, `.market` | `KANTO_PLACED_1.md`, Vermilion (385–444) | 2026-11-15 |
| `cs.kanto.lavender.tower`, `.fuji`, `.fanclub`, `.rocktunnel`, `.powerplant`, `.volunteers`, `.prank` | `KANTO_PLACED_1.md`, Lavender (445–652) | 2026-11-15 |
| `cs.kanto.celadon.*` (mart, rooftop, gamecorner, mansion, eevee, tea, perfume) + Sweet Air | `KANTO_PLACED_2.md`, Stage 4 (14–252), Manga moments (966–972) | 2026-11-15 |
| `cs.kanto.fuchsia.warden`, `.tauros`, `.zoo`, `.snag` | `KANTO_PLACED_2.md`, Stage 5 (253–374) | 2026-11-15 |
| `cs.kanto.saffron.silph`, `.dojo`, `.copycat`, `.train`, `.lament` | `KANTO_PLACED_2.md`, Stage 6 (375–493), Manga moments | 2026-11-15 |
| `cs.kanto.cinnabar.lab`, `.mansion`, `.seafoam`, `.newisland`, `.volcano` | `KANTO_PLACED_2.md`, Stage 7 (494–680) | 2026-11-15 |
| `cs.kanto.indigo.road`, `cs.kanto.route.badge-check`, `cs.kanto.cerulean.cave` | `KANTO_PLACED_2.md`, Stage 8 (681–791) | 2026-11-15 |
| `cs.kanto.route.*` (charizard, pidgeotto, bulbasaur, haunter, lapras, poster + 7 game moments), Jessie/James beats | `KANTO_PLACED_2.md`, 792–965 | 2026-11-15 |
| Viridian `.spearow`, `.center`, `.healer`, `.convertible`, `.nightmarket` | `KANTO_PLACED_3.md`, 13–204 | 2026-11-15 |
| Pewter `.siblings`, `.wheel`, `.afterhours`, `.ladder`, `.seymour`, `.serum` | `KANTO_PLACED_3.md`, 205–409 | 2026-11-15 |
| Cerulean `.ballet`, `.tech`, `.aj`, `.bike`, `.recruiter`, `.stall`, `.gyarados` | `KANTO_PLACED_3.md`, 410–651 | 2026-11-15 |
| Vermilion `.capsized`, `.portavista`, `.naptime`, `.dam`, `.photographer`, `.itemfinder` | `KANTO_PLACED_3.md`, 652–881 | 2026-11-15 |
| Lavender `.namerater`, `.radio`, `.vigil`, `.orphan`, `.offering` | `KANTO_PLACED_3.md`, 882–1042 | 2026-11-15 |
| Celadon `.salon`, `.diner`, `.poster`, `.devroom`, `.bridgerun`, `.greenhouse`, `.vee` | `KANTO_PLACED_4.md`, 10–257 | 2026-11-15 |
| Fuchsia `.ranch`, `.herd`, `.dragonlake`, `.gurus`, `.birdmaze`, `.paras`, `.carnival` | `KANTO_PLACED_4.md`, 258–501 | 2026-11-15 |
| Saffron `.mrpsychic`, `.imite`, `.exam`, `.teleport`, `.seam`, `.post` | `KANTO_PLACED_4.md`, 502–688 | 2026-11-15 |
| Cinnabar `.inn`, `.sleeper`, `.backlog`, `.trades`, `.wave`, `.vial` | `KANTO_PLACED_4.md`, 689–870 | 2026-11-15 |
| Indigo `.torch`, `.boulders`, `.village` | `KANTO_PLACED_4.md`, 871–959 | 2026-11-15 |
| Roads `cs.kanto.route.song`, `.darkcity`, `.canyon`, `.egg`, `.daycare`, `.estate`, `.leek`, `.hero`, `.film`, `.badges`, `.buried` | `KANTO_PLACED_5.md`, 9–430 | 2026-11-15 |
| Sevii `cs.kanto.sevii.*` (network + ferry, ember, stall, maniac, missing, bikers, berryforest, icefall, daycare, warehouse, lostcave, pillar, dottedhole, patternbush, altering, tower, tanoby, canyon, navel, birth) | `KANTO_PLACED_5.md`, 431–870 | 2026-11-15 |
| Towns `cs.kanto.pewter.stranger`, `.visitors`, `cs.kanto.vermilion.triage`, `.site`, `cs.kanto.lavender.rival`, `cs.kanto.celadon.festival`, `cs.kanto.fuchsia.secrethouse`, `cs.kanto.cinnabar.shellder` | `KANTO_PLACED_6.md`, 10–322 | 2026-11-15 |
| Roads `cs.kanto.route.goodbye`, `.k9`, `.oldstreet`, `.transfer`, `.snow`, `.bikerace`, `.gamblers`, `.seeker`, `.fame`, `.underground`, `.relay`, `.aides` | `KANTO_PLACED_6.md`, 323–670 | 2026-11-15 |
| Sevii `cs.kanto.sevii.joyful`, `.treasure`, `.resort`, `.labyrinth`, `.ferry` | `KANTO_PLACED_6.md`, 671–787 | 2026-11-15 |

## Limits (Part 1)
- Before / instead / after the node's battle and "at a + node" are recorded (placement file `attaches`) but every space is a stop beside its node until the lead's placer lands; then the placement file drives it.
- Pokédex Upgrade (parcel) gives the existing Devon Scope (map preview), not "the next five wild Pokémon show their Ability": no such rule exists yet.
- Catching Charm is a one-battle +25% on the next wild battle (the catalog's Catching Charm item is permanent, too strong for "the first ball").
- Brock's perfect stew: the stat is picked at once and lasts to the next boss; Special Defense is not offered (four-choice limit); the 15% heal is immediate.
- Trainer School questions are a fixed bank, not built from the stage's two types; the Stage 8 class line does not know which question was missed.
- The Flock's Pidgey does not fight beside the lead (no ally slot in event battles); Zapdos is a plain wild battle (no shown low odds, no Sign check yet: legends owns Signs).
- Lines that read flags other threads will set (rival threw a match / swapped teams, Mt. Moon's third fossil, the laughing ghost, Mimikyu, Lonely Cubone) stay silent until those threads set them; any Cubone counts for the Marowak scene.
- Not linked yet (other threads' events): Flight North reading the Weedle and the flock, the Day-Care Village branch (gn.40), Sprat at the fishing contests, the Fan Club Chairman at the Final Reunion, the Rocket-raid version of Pokémon Tower.
- Day-Care takes the Pokémon at the back of the party (no picker for two); "Share my light" in Rock Tunnel needs the Flashlight item (Flash alone does not open it).

## Limits (Part 2)
- Sweet Air shows in the battle Info panel (Field), not a separate header badge; "forest-tagged" uses the stage's tags (Grass, Bug or Fairy stage), as `core/co/placement.ts` defines them.
- Meowth's running count says "another one" (no number): beats 2 to 4 and the Silph list are in other threads' spaces (Mt. Moon, S.S. Anne, Flight North, the Silph takeover). The manga Silph rival rematch is part of the takeover (not this row).
- The Cinnabar Lab trades use the existing trade-away picker; the Fusion Display is a drawing (no fusion), as scripted.
- Fossil Wake's "Bond one step higher" is friendship +50 (two Bond +5 x 5 effects; the kc effect caps at 6 per effect).
- Seafoam's "the current may carry you back" is a 50% wade per boulder room; New Island's crossing uses the Dodge prompt, Bulbasaur's sway the Echo rhythm prompt.
- Charizard Feather is a held Fire booster (+5%, up to 3); the doc names the item but not its effect.

## Limits (Part 3, Volume II)
- Triggers are menu entries once their space needs are met (Spearow Storm: always at Stage 1; After Hours: after the Museum; Serum and Second Offer: after Mt. Moon or the Bridge, only while Team Rocket is awake). "First rainy node" and "at Night" are not checked; the Healer is offered whenever placed.
- Pokémon Center Siege: no rental Pokémon (your own party fights); the dark's accuracy penalty is not applied. "Heals free for the rest of Kanto" is a relic: healing +10%.
- Spearow Storm's "1 HP, every stat up, can't faint" fight is a normal fight; the rainbow sighting flag is left for the legends thread.
- Convertible questions are fixed (no rival memory log); three right shows the stops ahead and adds rival respect.
- Ten Brothers, Pokémon Tech and the Capsized Liner score with flags inside the space; Porta Vista's takings and the Photographer's photos are recorded flags, and the album pays from what the run already holds.
- Bike joke: the 2% Electric-move roll is a choice that needs an Electric move; paying the girl back is offered on a revisit.
- Itemfinder counts caught species (30); the come-back is a Pidgey note three nodes later.
- Name Rater: no renaming from an event; rating a name gives Bond. The Offering reads this run only (a party Pokémon fainted), never earlier runs (same-run rule); the Region of Doom wall is not linked.
- Serum custody joins a plain Rhydon (no Veiled tier); Seymour's "any later run" line is dropped (same-run rule).

## Limits (Part 4, Volume II)
- Same-run rule: the Torch's flame in the Plateau's bowl, the Big Wave's "next run" and the Village board's pinned keepsake stay inside this run. Keepsakes (Diploma, tickets, certificate, board pin) are journal moments (Kice's cut).
- Swaps for items the game lacks: the Boulder Hall's Max Revive is a Star Piece; the Torch's Ember Charm is a Charcoal. The Weakest Paras' Miracle Potion is a full heal on the spot, out of battle (the doc's own change).
- Cinnabar Lab: the Trade Wing replaces Lab Trades as the doc says, but Fossil Revival stays beside the Backlog (the doc replaces it; dropping it would strand fossils carried from Mt. Moon). The Backlog opens from the Lab's second fossil tray.
- The Village at the Gate sits on the League's second fight (Victory Road is on the first), the closest the League map has to "after Victory Road's last node".
- The Boulder Hall's three rooms are nodes of Victory Road's map beside the plates they open from (rooms of the same Pseudo Stage).
- The Admissions Exam's practical uses your own party, not three rentals (no rental teams in events yet); the quirk cards are text only.
- Room ends with two complementary gates (in time or late, pass or fail, with or without a Squirtle) are listed in the "only locked choices" exceptions of `kantoCanonCo.test.ts`; one always fits.

## Limits (Part 5, roads and Sevii)
- Same-run rule: the Network Center's "see Pokémon from earlier runs", Trainer Tower's save-wide times and Tanoby's save-wide words stay in this run (the wall lights up; the board and the word are this run's). Ribbons and tiles are journal moments.
- The Sevii Islands are seven small Pseudo Stages, not one (one map of 103 rooms drew 22 discs stacked in one column): One Island and the ferry (Captain Tidewell at Cinnabar), then one map per island, entered by its ferry crossing. Sailing back walks out to Cinnabar, where the Captain (with the pass) takes you back to One Island. Island choices check the ferry flags (three picks; Three free after the Missing Girl). Nothing nests.
- The Song's marker isn't an item: the Jigglypuff joins without it; sleeping through costs Speed (halved) for one battle. Second chances: the Sleeper on the Beach and the Village board; the Buried City uses the Song if it was met at all.
- Who Keeps the Egg: a "chemistry pair" is camp chemistry for the party plus friendship; the rival's Togepi is a flag for the rivals thread.
- The Leek Thief: the stolen bag makes the next two battles a level gentler; items stay usable.
- Stand-ins: Full Restore is a full rest on the spot; the Move Maniac's Tiny Mushroom tier is folded into the Big Mushroom (a Network Machine); the Ruby and Sapphire are run flags (the catalog's are sellable valuables); Rocket Admins' "+1 every stat" is +1 level; the Tower's "no items" isn't enforced.
- Tickets: the doc says "a rare reward elsewhere"; here the Mystic Ticket is in Selphy's bag (25%) and the Aurora Ticket is the prize for beating Trainer Tower's posted time.
- Sizes: the Lost Cave has five rooms (doc: up to eight); Birth Island's six step puzzles are one aim prompt; the Altering Cave rolls one of 18 non-Kanto species.

## Limits (Part 6, the second helping)
- Same-run rule: the Building Site's bricks and the Professor's later-run visits are dropped; the site's "again" room is a Stage 8 follow-up in the same run.
- The Kind Stranger is a Stage 1 road space (the forest is another thread's); the "certain if poisoned" rule isn't there. His advice is Speed ×2 against the next boss.
- The rival at the Tower: "fought side by side" is read as the lead at Bond 3.
- The Princess Festival is a rooftop choice at 50%; its price cut lasts until the next battle.
- The Secret House Warden: the second roll isn't done (the gold-teeth replica flag plus ₽3000).
- The Aides' lamp is a flag only; the Aides can be crowded out by the two-per-stage road cap.
- The Vs. Seeker and Fame Checker are items; the six-remark dossier reveals aren't built.
- Treasure Beach: a 50% roll stands in for low tide; "lost items wash back" isn't built.
- Resort wishes are a fixed three species; the Labyrinth egg is a Kanto baby; Joyful berry-picking needs the Doduo line.
- Bicycle Race: "a year of free food" is a rest now plus a run flag. Triage "potions" are rests (no in-battle healing items).
