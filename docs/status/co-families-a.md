# Catalog Overhaul Pack: families-a (row 2)

Docs: `STORY_FAMILIES_1.md`, `_2`, `_3`, `_4`, `_7` in `/mnt/project-files/catalog_overhaul_pack/catalog_overhaul/` (227 catalog ids). Plan: `/mnt/project-files/plans/catalog-overhaul/PLAN.md`. Guide: `docs/catalog-overhaul.md`.

- Content: `tools/events/co/families-a-<n>.ts` (helpers in `_fa.ts`) -> `npm run co:build -- families-a-<n>` -> `src/data/events/co-families-a-<n>.json`. Doc 1 = `-1` and `-2`, doc 2 = `-3`, doc 3 = `-4` and `-5`, doc 4 = `-6`, `-7`, `-8`, doc 7 = `-9` (Hazards, Kindness Ledger, Strangers, Camp) and `-10` (Borrowed Dog to Hospice).
- After a build: `node tools/events/co/_fa-status.ts <date>` (status file and the table below), `node tools/events/co/_fa-flags.ts` (flag map `src/data/catalogOverhaul/flags/families-a.json`; notes for flags other categories read in `_fa-flag-notes.json`), then `npx vitest run tests/unit/coFamiliesA.test.ts tests/unit/catalogOverhaul.test.ts`.
- Run memory is same-run only (Kice 2026-11-14). Every "past run" or "this save" in the docs is built as "earlier this run", or skipped (listed below).
- Story fights never end the run (`friendly`); battles inside a chain pseudo-stage set `pseudo`.
- New pieces: `src/core/flagPerks.ts` (Faulk's account interest; Oswin's bedroll refilled each region), items in `src/data/itemCatalog/co-families-a.json` (Aldous's Charm, Bramble's Collar, Oswin's Bedroll, Ember's Collar), chain `ps_fa_spire` in `src/data/catalogOverhaul/pseudo/families-a.json`. Schema: a Remembers variant may hide every base choice if it adds its own.
- Shared pieces used (cherry-picked): people's region stamps and friendly battles, anime's `flagAge` / `laterEvent` / `partyLine`, new-events' `takeNode` and `who` selectors, families-c's text tokens.
- Save: none.

## Where this stopped (resumed 2026-11-16, batch 3)
- Done: docs 1 to 4 and 7 (built, re-read, tested). Doc 3 is `families-a-4` and `-5`; doc 4 is `-6` (Village, Nobody, Roots, Cooking), `-7` (Treasure Map, Last Shift, Egg in the Fire, Courier) and `-8` (Disciple, Readings, Fog Bell, Storm-Grey Coat).
- `starter-fever-week` (listed under doc 4) is a game-event week in `gameEvents.json`, not an event: its rework (the weeks rule) is left pending for whoever reworks the weeks.
- Done since: update notes (`docs/updates/catalog-overhaul/families-a.md`), browser test (`tests/e2e/coFamiliesA.spec.ts`), old systems wired back in (below). Still to do: placement on the 20-step map (catalog lead's step); the catalog lead combines the batch.

## Known limits (honest list)
Doc 1 (SF1 to SF6)
- The rival's lines "by personality" use one neutral line (no personality condition yet).
- Tib's pronoun pick is not built (Tib is named, never gendered). "+1 bag space" is not built: Tib returns the bag with an item in it.
- "Can't battle for a stage" (the hospital's Electric-type) is a four-battle half-strength effect on that type.
- Severity 4 "shops closed, rests heal 25% less" is a region-long ×1.25 price and ×0.75 healing.
- Split-team crisis fights do not limit each half to three Pokémon.
- The factory's "three-node stage" is one room. "(a node)" and "(two nodes)" costs use new-events' `takeNode`.
- Cross-family hooks A9, A8, A5, D5 are not wired. Kyogre's blessing only blocks the flood's bad ending. Heal Bell only (no Aromatherapy alternative). The SF1.9 fallback ally is always a Ranger.
- Cross-run content skipped: the farmer in later runs, Wicker's past-run item, Pim as a later rival, "this save" meteorite, `released.<species>`. The lifetime discount lasts the region. Pen pal "never answered" and "rival in trouble" variants are not built.

Doc 2 (SF7 to SF12)
- Mara: her "past runs" memory is this run's. SF7.2 needs "beat her and walked on twice" (she can be met at a second bridge); SF7.3 needs `mara-rested`. AZ's line needs legends to set `az-flute` in M6. Her Final Reunion turn is the flag `mara-reunion` (greenneedle builds the Reunion).
- Old Ranger: "a free rest node" is a full heal on the spot. The bedroll is a Bag item (one full team rest) refilled to one at each new region. Oswin at the Final Reunion is the flag `ranger-reunion`.
- Sanctuary: "carried: that Pokémon can't battle for three nodes" is a three-battle −15% attack and special attack on the party. The Blissful Light is the game's Blissful awakening (highest Bond, Bond 3 or more), not "+10% while it is the only one of its type"; the "carried Pokémon is chosen" and "fainted more than five times" Remembers are not built. The trial's third moment reads the Good/Evil meter, not a specific past event. The Legendary is not named (shown as "something very old").
- Hooded Traveller: always the mentor version (the Past Champion, Gym Leader and Ally pools are cross-run and other categories' questlines). "Come back" sets `hood-returned` only. The tag partner is the travelling-companion system for four stages.
- Broken Habitat: the culprit is chosen by region (poachers by default; factory in Johto, Sinnoh, Kalos, Galar, Orrery Basin, Tidewrack Reaches; the rival in Paldea, Frontier Isles, Trial Archipelago, Cairnmoor). Zygarde Cells are a run count (flag `zygarde-cells`, read by legends L11), not a Bag item. A full rebuild sets `habitat-full`; legends counts it as a Trial. "Pay them: they come back next run" has no same-run return.
- Hollow Vale: "comes back next run" (Leave, Hold) is same-run: after Hold, the town returns a stage later (`vale-again`). Mrs. Abney's "first battle" gift is Sweet Berry Juice, not a Potion (MEMORY_AND_FORMAT: no event gives an in-battle healing item). "Rather forget" does not hide a log entry. The `released.<species>` trade and the blueprint (cosmetic) are not built. The Kyogre/Suicune line shows; counting it as a Communion is legends' to wire.

Doc 3 (SF13 to SF18)
- Circuit: the rung events climb the rivals row's R1 board (`circuit-rung`, one match a stage, needs the R1 sign-up `circuit-entered`). A lost match comes back at a later plaza (`seeAgain`). The Tower Pass is a flag (`circuit-pass`); a lost match already returns, so it gives no extra retry. Seven floors are three rooms (battle chains stop at three); the Frontier's four rounds are three plus one. "A Road Roster trainer at Meeting 2" is a generic face from the road. The Rival Circuit final opens R1's own final (`rq-circuit-final`); the ₽1,200 purse is paid on walking out. The Gold match against the rival needs the rival on the same rung.
- Exhibition Bracket: a chain pseudo-stage (`ps_fa_exhibition`). Sergei's "Pokémon from your last region" is text only. "Find him" marks a plan as seen (`evil` mark `plan-seen`, heat −1).
- Contests: the Contest Partner is the Pokémon picked at the first contest (remembered as the run's pick; a later pick elsewhere replaces it). Ribbons are a run count (`contest-ribbons`). "The highest-power move scores 0" is a harder contest (five moves). The Ribbon Cup is a run relic (+10% damage on each battle's first attack), not a held item on the partner. "Free entry to every contest next run" (cross-run) became a shop stop and ₽500. Beauty Bianca is named in the text only.
- Convoy: the first escort starts the convoy, the others join it (one more to guard; no cap of three). The secret is whoever is present first of Finch, Tess, Fen (not a draw). Endings are stops after the gym. Garrow's cut is a fixed ₽700. Finch's notes reveal the map's stops.
- Hollow Lantern: Autumn only (the Ghost-theme region trigger is not built). The name is the Pokémon released earlier this run; with none, the glass is blank, the grave is a grave, and the Keeper's "Come back" is a battle for a Ghost-type. A released Pokémon is alive, so the grave is always its prints and the Keeper never battles. The lantern is not a Keepsake (Keepsakes are cut). The Litwick joins if you knew the lantern's name (not by flame colour). The Gourgeist Alpha is a strong wild battle.
- Grunt School: "half its Grunts next stage" is team heat −1. The Grunt Jessa (RR45) line is not built. Dilly's basket is Berries and Sweet Berry Juice (no Potion: pack rule). The union route without signing is a 60% chance (else the stealth route).
- Heist: the informant is fixed by region (Ruth: Kanto, Sinnoh, Kalos, Paldea, Frontier Isles, Cairnmoor; Kip: Johto, Unova, Alola, Torren, Grand, Orrery Basin; Vesna elsewhere). Keeping the ledger is a team mark (`ledger-kept`), not a preview of Admin teams. The cut is a fixed ₽1,000. The Zeraora's Promise line is not built.

Doc 4 (SF19 to SF30)
- Village That Repeats: each noon costs a node; leaving keeps it looping (it can be drawn again). Hesk's bread is a full heal now (no rest node "for the save"); Nim's apple is a Sitrus Berry. Celebi gives `sign-celebi`; counting it as a Telling is legends' to wire.
- The Nobody: the key is a stop four nodes on. `nobody-told` is read but only other rows could set it (no share-a-secret line exists yet), so the dock ambush never happens yet. "Jenny's arc is good" is not checked: Nell always goes. "They caught the quiet one" is a line in the No outcome. Nell's second Pokémon is a Dark-type.
- Starter's Roots: every place can be visited; the starter's own type (and the doc's closest types) gives the home version and stamps `roots-own`; the Home scene comes two regions later. "Stays home" is not built (no effect removes a chosen party Pokémon): the starter always comes back. The visit gifts that are cross-run (the orchard tree "in a later run") are flags. The pylon's charge for Electric starters is +10% to Electric moves for the region; others get +1 Speed point.
- Cooking: recipes are cooked at a rest stop (`cook-at-rest`, drawn at rest stops once a recipe is known): one dish, two with the Golden Spoon. Tolu's cook-along is the timing prompt; the cook-off is a 60% roll; "scored by flavour by nature" is a 60% roll. The pie and draft dishes are +10% to one stat for the next battle. The final needs three wins (`cook-wins`).
- Treasure Map: pieces 3 and 4 absorb the Torn Treasure Map chain. "One Rare item of the player's choice" is a random rare held item. The Past Champion's questline beat is the flag `map-champion-met`. Cross-run chest notes are not built.
- Last Shift: the three stations are one choice (a Steel-type, an Electric-type, or a node by hand and a Klink). The Crestline Bell is a held Covert Cloak (blocks moves' extra effects, flinching among them). The Baxter museum (cross-run) is not built.
- Egg in the Fire: the egg (Larvesta) hatches after three stages. Keeping it warm is a rest-stop scene for the rest of that region (`eggWarm`: sooner hatch, more friendship); devoted/normal/resentful temperaments and Morning Sun are not built. Heatran's Sign is `sign-heatran`.
- Courier's Egg: the egg is one of the twelve species (random). Three ambushes end the hunt (two with the heist ledger). Running with Sorrel-Jay ends at the next region with a Smoke Ball. Officer Jenny's lab sends a different egg a region later.
- Disciple: the three tests are my own scenes (a promise, a refused easy win, training the weakest), not reads of other rows' promises. Each tower is three floors then two. Kubfu does not join until the top: the reward is Urshifu. With fewer than three tests the missed tests come round again once.
- Readings: the three readings are stops a node apart. "Balm rules" is a Berry. The eruption is a strong wild battle next region. Sonnet's meter reveals the map's stops once.
- Bell in the Fog: following is a small heal. The Fog Bank hazard (doc 7) hears Halden's bell. Halden's Bell is a flag (`halden-bell`); the ambush warning is not built. "A free rest every run" is a full heal once.
- Storm-Grey Coat: the bird is set by region (Articuno: Sinnoh, Kalos, Galar, Grand, Tidewrack Reaches; Zapdos: Kanto, Unova, Paldea, Torren, Frontier Isles, Orrery Basin; Moltres elsewhere); the L2 (Three Birds Trial) exclusion is not built. Signs are `sign-<bird>` +2. Aurel's coat is text only.

Doc 7 (SF42 to SF54)
- Hazards: "Wait" takes the next node. A few push costs are simplified: Pollen and Smog poison only the lead (a coin flip); Heat Wave's burn and the thunderstorm's paralysis hit the lead on a coin flip; the Solar Flare's hidden map is a small static shock instead (no map-hiding effect exists); the windstorm's lost turn is a slower next battle; Volcanic Ash is 15% lower accuracy for one battle. "Answered 3 this region" is three answered in the run with the last one this region. The Pathfinder ribbon is a party relic (+5% Speed everywhere, not only on hazard nodes).
- Kindness Ledger: `kind-total` counts the whole run, not one region. The helpers come once per run, the night before a crisis climax (`kind-helpers`): 3+ a full heal, 5+ also less damage taken for two battles (stands in for "the split battle costs nothing"), 7+ also saves both places at the climax (it sets the climax ally's split flag). Mrs. Pryor's sandwich and the hiker's thanks are flags only. Gifts that were Potions are Berries or Sweet Berry Juice (no in-battle healing items). Hettie's drawing is a run moment and a flag (no hub picture yet). "Any amount" for the orphanage is ₽200 or ₽1,000.
- Strangers: the Tellers are flags (`teller-<name>`); the Legendary and Mythical questlines (other rows) read them. "That Pokémon can't battle for a node" (the monk) is not built; the Pokémon gains Bond only.
- Camp: the checkpoint has four choices: Make camp (rest: heal, cure, chemistry rest), Prepare (scout; sort in the afternoon; mend at night; celebrate on a milestone day), Hold council (morning or afternoon: Train, Play, Sleep) and Talk by the fire (evening or night: where they came from, home, the rival, the mentor). The old camp systems still run behind it: chemistry bonds and settled grudges (Play), the mentor's trust and mission (mentor talk), the rival Pokémon trail. "The oldest" is your first catch.
- Borrowed Dog: Biscuit joins like any Pokémon (party limit applies; no seventh slot). Fainting is not tracked: if Biscuit is no longer with you, Della's "where is he?" scene plays; Bond 4 is the "never this happy" scene. The Arcanine and Oswin lines are not built.
- Lost and Found: the lost pet is a Lillipup; the stray is Purrloin or Skitty; the fence Pokémon is `found-fence`. The AQ59 Meowth line is not built. Tib's "rescued one too" shows when 3+ rescues happened in the run.
- Three Cards: three fixed cards with their effect printed on the button: The Sun (healing +10%), The Tower (foes two levels higher; "one more Pokémon per trainer" has no effect behind it) with Ostra's Lucky Egg, The Wheel (rare Pokémon 20% more likely).
- Empty Shelf: Kit appears three stages later once the evil story has started; "has beaten this region's Lieutenant" is the evil story's sixth beat having played. Kit's battle adds a short letter scene. Kit counting toward the Betrayal is the flag `shelf-kit-home` (evil-story reads it when built).
- Eve of the Gym: Wil comes back next region. Loud is +10% on the first attack in the next boss fight; Quiet is no flinching on turn one there; Advice is the gym preview.
- Riolu: the hidden watch count comes from the two return scenes (and +1 when your Kindness total is 3+), not from every camp choice. Aura Sphere is taught when the count is 2+; it evolves the normal way (friendship).
- Honesty Tests: keeping sets `honest-kept-<what>` and `honest-kept`, Reputation -1/-2 (`rep-lost`) and Kindness down; the Apprentice's next scene becomes the Sly one. The ring also sets the shared `honest-kept-wallet` / `honest-returned-wallet` (MEMORY_AND_FORMAT 2.1). The Final Reunion owner (two keeps) is another row's.
- Hospice: "The Lapras Who Waited is her mother" is not built (no such flag yet). A Lapras in your party sings back.

Integration (kept so older systems keep working)
- Spooky: Spooky Mode opens with `spooky-lantern-finds-you` (the mode's stop) and Spooky Season with `spooky-season-lantern`; the rest of the Hollow Lantern is mode-free follow-up scenes. Clues, the Keeper (boss) and the finale add to the mode's objective counters. The Coven detour battle uses Spooky forms and sets `spooky-met` (opens Spooky forms to eggs and trades).
- Treasure Map pieces are `th-piece-N` and `th-claimed`, the flags the Treasure Hunt Season already reads.
- Crisis reports need the region's crisis meter at 1 or more (the code places them at 2 or more).
- A scene that sends you back to a stop that is also drawn on its own (or to itself, "ask first, then choose") opens a room copy `<id>-room` (`withRooms` in `_fa.ts`), because rooms are never drawn on their own.
- The five Starter's Roots scenes need the starter still in the party (a bare `starter` condition).
- Gifts the old hazards and the Treasure Dig gave are kept in the new shape: a lead that answers a hazard finds an item of its type (Charcoal, Miracle Seed and so on); the dig scenes are `th-dig-a/b/c` and the old `dg-treasure-dig-*` ids are retired into them. The mudslide rescue sets `mudslide-saved` and the Circuit final sets `won-circuit` (the places row's callbacks read them).
- Old lore fragments that rebuilt events used to give are kept: First Ember (farmer), Tide Ledger (Wicker), Hollow Bell and Last Lullaby (funeral), Paper Crane (pen pal), Whisper Wood (the describer), Lantern Oath (Oswin). Tolu's cook-along is the timing prompt again.

## Re-read table
Every row was re-read against its doc section after building (date = the re-read).
<!-- table:start -->
| Id | Doc section | State |
|---|---|---|
| `crisis-old-friend` | STORY_FAMILIES_1 SF1.9 The Climax Ally: They Heard You Were Here | built, re-read 2026-11-15 |
| `crisis-report-blackout` | STORY_FAMILIES_1 SF1.1 Report: The Lights Went Out | built, re-read 2026-11-15 |
| `crisis-report-flood` | STORY_FAMILIES_1 SF1.2 Report: The Flood | built, re-read 2026-11-15 |
| `crisis-report-industry` | STORY_FAMILIES_1 SF1.3 Report: The Factory | built, re-read 2026-11-15 |
| `crisis-report-outbreak` | STORY_FAMILIES_1 SF1.4 Report: The Fever | built, re-read 2026-11-15 |
| `ember-vent-1` | STORY_FAMILIES_4 SF25.2 Ash and Gravel | built, re-read 2026-11-16 |
| `ember-vent-2` | STORY_FAMILIES_4 SF25.3 The Lava Bridge | built, re-read 2026-11-16 |
| `ember-vent-entrance` | STORY_FAMILIES_4 SF25.1 Something Breathing | built, re-read 2026-11-16 |
| `ember-vent-final` | STORY_FAMILIES_4 SF25.4 The Pool of Fire | built, re-read 2026-11-16 |
| `fog-guide` | STORY_FAMILIES_4 STORY FAMILIES, PART 4 | built, re-read 2026-11-16 |
| `foundry-1` | STORY_FAMILIES_4 SF24.2 Hungry Machines | built, re-read 2026-11-16 |
| `foundry-2` | STORY_FAMILIES_4 SF24.3 The Foreman | built, re-read 2026-11-16 |
| `foundry-entrance` | STORY_FAMILIES_4 SF24.1 Mid-Shift | built, re-read 2026-11-16 |
| `foundry-final` | STORY_FAMILIES_4 SF24.4 One Lit Button | built, re-read 2026-11-16 |
| `galar-dynamax-investigator` | STORY_FAMILIES_4 STORY FAMILIES, PART 4 | built, re-read 2026-11-16 |
| `galar-kubfu-disciple` | STORY_FAMILIES_4 SF27.1 The Cub | built, re-read 2026-11-16 |
| `galar-kubfu-tower` | STORY_FAMILIES_4 SF27.2 The Two Towers | built, re-read 2026-11-16 |
| `world-disaster-blizzard` | STORY_FAMILIES_1 SF1.5 The Fifth Strand: Wildfire / Quake / Blizzard | built, re-read 2026-11-15 |
| `world-disaster-flood` | STORY_FAMILIES_1 SF1.2 Report: The Flood | merged into `crisis-report-flood`, re-read 2026-11-16 |
| `world-disaster-quake` | STORY_FAMILIES_1 SF1.5 The Fifth Strand: Wildfire / Quake / Blizzard | built, re-read 2026-11-15 |
| `world-egg-delivery` | STORY_FAMILIES_4 STORY FAMILIES, PART 4 | built, re-read 2026-11-16 |
| `wx-ancient-lava-tube` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-black-ice-road` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-dust-devil` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-fog-bank` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-hailstorm` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-heat-wave-trek` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-mudslide-pass` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-overgrown-trail` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-pollen-season` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-rainy-day-market` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-rising-tide` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-salt-flats-mirage` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-smog-alert` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-solar-flare` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-sunken-road` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-swampy-mist` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-thunderstorm-crossing` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-tropical-squall` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-volcanic-ash` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `wx-windstorm-gap` | STORY_FAMILIES_7 The rule | built, re-read 2026-11-16 |
| `apprentice-follows` | STORY_FAMILIES_1 SF2.1 The Apprentice | built, re-read 2026-11-15 |
| `apprentice-kind` | STORY_FAMILIES_1 SF2.3 Second Region: What You Did | built, re-read 2026-11-15 |
| `apprentice-sly` | STORY_FAMILIES_1 SF2.3 Second Region: What You Did | built, re-read 2026-11-15 |
| `bakery-gift` | STORY_FAMILIES_7 SF43.1 Free Treats ( | built, re-read 2026-11-16 |
| `barefoot-monk` | STORY_FAMILIES_7 SF44.1 The Barefoot Monk ( | built, re-read 2026-11-16 |
| `blind-describer` | STORY_FAMILIES_7 SF44.2 Tell Me What's Out There ( | built, re-read 2026-11-16 |
| `blind-old-lady` | STORY_FAMILIES_7 SF44.3 Across the Road ( | built, re-read 2026-11-16 |
| `camp-checkpoint` | STORY_FAMILIES_7 SF45.1 The Checkpoint ( | built, re-read 2026-11-16 |
| `camp-council` | STORY_FAMILIES_7 SF45.2 Council ( | built, re-read 2026-11-16 |
| `camp-mentor` | STORY_FAMILIES_7 SF45.3 Mentor Talk ( | built, re-read 2026-11-16 |
| `camp-party` | STORY_FAMILIES_7 SF45.4 The Party ( | built, re-read 2026-11-16 |
| `camp-prepare` | STORY_FAMILIES_7 SF45.5 Prepare ( | built, re-read 2026-11-16 |
| `camp-rival` | STORY_FAMILIES_7 SF45.6 Rival Talk ( | built, re-read 2026-11-16 |
| `camp-rival-trail` | STORY_FAMILIES_7 SF45.7 Its Rival ( | built, re-read 2026-11-16 |
| `camp-talk` | STORY_FAMILIES_7 SF45.8 Quiet Talk ( | built, re-read 2026-11-16 |
| `center-lady` | STORY_FAMILIES_7 SF43.2 The Center Lady ( | built, re-read 2026-11-16 |
| `chef-cook-together` | STORY_FAMILIES_4 SF22.1 Fast Hands | built, re-read 2026-11-16 |
| `cooking-contest` | STORY_FAMILIES_4 SF22.2 Cook for Your Team | built, re-read 2026-11-16 |
| `dog-walker` | STORY_FAMILIES_7 SF46.1 Walk My Growlithe ( | built, re-read 2026-11-16 |
| `dog-walker-pays` | STORY_FAMILIES_7 SF46.2 Biscuit Comes Home ( | built, re-read 2026-11-16 |
| `elders-last-wish-1` | STORY_FAMILIES_1 SF4.1 Three Things | built, re-read 2026-11-15 |
| `elders-last-wish-2` | STORY_FAMILIES_1 SF4.2 The Star Was Real | built, re-read 2026-11-15 |
| `elders-last-wish-3` | STORY_FAMILIES_1 SF4.3 Be Kind to Them | built, re-read 2026-11-15 |
| `ev-lost-pokemon` | STORY_FAMILIES_7 SF47.1 Under the Signpost ( | built, re-read 2026-11-16 |
| `farmers-quest-1` | STORY_FAMILIES_1 SF3.1 The Farmer's Long Errand | built, re-read 2026-11-15 |
| `farmers-quest-2` | STORY_FAMILIES_1 SF3.2 The Same Farmer | built, re-read 2026-11-15 |
| `farmers-quest-3` | STORY_FAMILIES_1 SF3.3 Lucky | built, re-read 2026-11-15 |
| `flooded-basement` | STORY_FAMILIES_7 SF47.2 The Flooded Cellar ( | built, re-read 2026-11-16 |
| `fortune-three-cards` | STORY_FAMILIES_7 SF48. THREE CARDS | built, re-read 2026-11-16 |
| `funeral-respects` | STORY_FAMILIES_7 SF49. A QUIET FUNERAL | built, re-read 2026-11-16 |
| `gift-from-mom` | STORY_FAMILIES_7 SF43.3 From Mom ( | built, re-read 2026-11-16 |
| `gift-the-keeper` | STORY_FAMILIES_7 SF50. THE EMPTY SHELF | built, re-read 2026-11-16 |
| `grandmas-recipe` | STORY_FAMILIES_4 SF22.3 Grandma's Stew | built, re-read 2026-11-16 |
| `gym-eve-tone` | STORY_FAMILIES_7 SF51. EVE OF THE GYM | built, re-read 2026-11-16 |
| `hold-the-egg` | STORY_FAMILIES_4 STORY FAMILIES, PART 4 | built, re-read 2026-11-16 |
| `kind-hiker` | STORY_FAMILIES_7 SF43.4 Trail Mix ( | built, re-read 2026-11-16 |
| `kind-ranger` | STORY_FAMILIES_7 SF43.5 Check-Up ( | built, re-read 2026-11-16 |
| `kind-rival-visit` | STORY_FAMILIES_7 SF43.6 Good Luck Out There ( | built, re-read 2026-11-16 |
| `last-cookie` | STORY_FAMILIES_7 SF43.7 The Last Cookie ( | built, re-read 2026-11-16 |
| `ledge-riolu` | STORY_FAMILIES_7 SF52.1 The Ledge ( | built, re-read 2026-11-16 |
| `ledge-riolu-return` | STORY_FAMILIES_7 SF52.3 It Wants to Come Along ( | built, re-read 2026-11-16 |
| `lost-child` | STORY_FAMILIES_7 SF53.1 Two Lost Children ( | built, re-read 2026-11-16 |
| `lost-ring` | STORY_FAMILIES_7 SF53.2 The Ring ( | built, re-read 2026-11-16 |
| `lost-umbrella` | STORY_FAMILIES_7 SF53.3 The Umbrella ( | built, re-read 2026-11-16 |
| `lost-wallet` | STORY_FAMILIES_7 SF53.4 The Wallet ( | built, re-read 2026-11-16 |
| `mara-gatekeeper` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `mara-remembers-grudge` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `mara-remembers-kind` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `midnight-lullaby` | STORY_FAMILIES_7 SF47.3 The Tired Parent ( | built, re-read 2026-11-16 |
| `missing-cat-poster` | STORY_FAMILIES_7 SF47.4 Coins ( | built, re-read 2026-11-16 |
| `mom-calls` | STORY_FAMILIES_7 SF43.10 Mom Calls ( | built, re-read 2026-11-16 |
| `nurse-clinic` | STORY_FAMILIES_7 SF43.11 The Clinic ( | built, re-read 2026-11-16 |
| `old-mans-tale` | STORY_FAMILIES_7 SF44.4 An Old Man's Story ( | built, re-read 2026-11-16 |
| `pay-it-forward` | STORY_FAMILIES_7 SF43.8 Pass It On ( | built, re-read 2026-11-16 |
| `pay-it-forward-pass` | STORY_FAMILIES_7 SF43.9 Cover the Tab ( | built, re-read 2026-11-16 |
| `peddler-1` | STORY_FAMILIES_1 SF5.1 Her First Cart | built, re-read 2026-11-15 |
| `peddler-2` | STORY_FAMILIES_1 SF5.3 A New Wheel | built, re-read 2026-11-15 |
| `peddler-3` | STORY_FAMILIES_1 SF5.6 The Last Delivery | built, re-read 2026-11-15 |
| `pen-pal-letter` | STORY_FAMILIES_1 STORY FAMILIES, PART 1 | built, re-read 2026-11-15 |
| `pen-pal-mailbox` | STORY_FAMILIES_1 STORY FAMILIES, PART 1 | built, re-read 2026-11-15 |
| `pie-contest-judge` | STORY_FAMILIES_4 SF22.4 Four Pies | built, re-read 2026-11-16 |
| `pokemon-hospice` | STORY_FAMILIES_7 SF54. THE HOSPICE | built, re-read 2026-11-16 |
| `quiet-hermit` | STORY_FAMILIES_7 SF44.5 The Hermit ( | built, re-read 2026-11-16 |
| `ranger-trust-1` | STORY_FAMILIES_2 SF8.1 Mind the Bear | built, re-read 2026-11-15 |
| `ranger-trust-2` | STORY_FAMILIES_2 SF8.2 Tell Me About the Road | built, re-read 2026-11-15 |
| `ranger-trust-3` | STORY_FAMILIES_2 SF8.3 A Spare Bedroll | built, re-read 2026-11-15 |
| `rescue-team` | STORY_FAMILIES_4 STORY FAMILIES, PART 4 | built, re-read 2026-11-16 |
| `share-a-meal` | STORY_FAMILIES_7 SF44.6 Always Enough ( | built, re-read 2026-11-16 |
| `stray-kitten` | STORY_FAMILIES_7 SF47.5 The Stray ( | built, re-read 2026-11-16 |
| `stuck-pokemon` | STORY_FAMILIES_7 SF47.6 Stuck in the Fence ( | built, re-read 2026-11-16 |
| `blessing-trial` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `blissful-awakening` | STORY_FAMILIES_2 SF9 The Blissful Sanctuary | merged into `legendary-blessing`, re-read 2026-11-16 |
| `blissful-encounter` | STORY_FAMILIES_2 SF9 The Blissful Sanctuary | merged into `hurt-wanderer`, re-read 2026-11-16 |
| `companion-meet` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `companion-one` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `companion-three` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `companion-two` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `disturbed-habitat` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `ghost-town-gate` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `ghost-town-hall` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `ghost-town-market` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `habitat-disturbed` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `habitat-nest` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `habitat-restored` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `hurt-wanderer` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `legendary-blessing` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `lost-at-sea` | STORY_FAMILIES_1 STORY FAMILIES, PART 1 | built, re-read 2026-11-15 |
| `mudslide-rescue` | STORY_FAMILIES_1 STORY FAMILIES, PART 1 | built, re-read 2026-11-15 |
| `r137-ghostly-fog-bank` | STORY_FAMILIES_4 STORY FAMILIES, PART 4 | built, re-read 2026-11-16 |
| `sanctuary-attack` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `sanctuary-found` | STORY_FAMILIES_2 SF9 The Blissful Sanctuary | merged into `wanderer-arrives`, re-read 2026-11-16 |
| `sanctuary-guardian` | STORY_FAMILIES_2 SF9 The Blissful Sanctuary | merged into `blessing-trial`, re-read 2026-11-16 |
| `wanderer-arrives` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | built, re-read 2026-11-15 |
| `mr-spirit-cache` | STORY_FAMILIES_4 STORY FAMILIES, PART 4 | built, re-read 2026-11-16 |
| `mr-spirit-guide` | STORY_FAMILIES_4 STORY FAMILIES, PART 4 | merged into `fog-guide`, re-read 2026-11-16 |
| `mr-vanished-village` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | merged into `ghost-town-gate`, re-read 2026-11-16 |
| `battle-tower-floor` | STORY_FAMILIES_3 The rungs | built, re-read 2026-11-16 |
| `beauty-pageant` | STORY_FAMILIES_3 SF14.2 Your Lead Is Entered! | built, re-read 2026-11-16 |
| `champion-cup` | STORY_FAMILIES_3 The rungs | built, re-read 2026-11-16 |
| `chefs-cook-off-battle` | STORY_FAMILIES_4 SF22.5 Beat Me and Eat | built, re-read 2026-11-16 |
| `contest-hall` | STORY_FAMILIES_3 SF14.1 Beauty, Cool or Cute? | built, re-read 2026-11-16 |
| `contest-judges-challenge` | STORY_FAMILIES_3 SF14.3 Style, Not Just Strength | built, re-read 2026-11-16 |
| `ev-trainer-tournament` | STORY_FAMILIES_3 The rungs | built, re-read 2026-11-16 |
| `fan-club-tournament` | STORY_FAMILIES_3 The rungs | built, re-read 2026-11-16 |
| `ranked-ladder-1` | STORY_FAMILIES_3 The rungs | built, re-read 2026-11-16 |
| `ranked-ladder-2` | STORY_FAMILIES_3 The rungs | built, re-read 2026-11-16 |
| `ranked-ladder-3` | STORY_FAMILIES_3 The rungs | built, re-read 2026-11-16 |
| `story-tour-final` | STORY_FAMILIES_3 SF13.10 Of Course It's You | built, re-read 2026-11-16 |
| `story-tour-opening` | STORY_FAMILIES_3 SF13.8 Round of Eight | built, re-read 2026-11-16 |
| `story-tour-registration` | STORY_FAMILIES_3 SF13.7 The Exhibition Bracket: Registration | built, re-read 2026-11-16 |
| `story-tour-semi` | STORY_FAMILIES_3 SF13.9 The Lights Die | built, re-read 2026-11-16 |
| `tournament-entry` | STORY_FAMILIES_3 SF13.12 The Rival Circuit | built, re-read 2026-11-16 |
| `tournament-final` | STORY_FAMILIES_3 SF13.15 The Final | built, re-read 2026-11-16 |
| `tournament-quarter` | STORY_FAMILIES_3 SF13.13 Quarterfinal | built, re-read 2026-11-16 |
| `tournament-semi` | STORY_FAMILIES_3 SF13.14 Semifinal | built, re-read 2026-11-16 |
| `contest-pass-hall` | STORY_FAMILIES_3 SF14.4 The Super Contest | built, re-read 2026-11-16 |
| `wm-1` | STORY_FAMILIES_1 SF5.2 The Squeaky Cart | built, re-read 2026-11-15 |
| `wm-2` | STORY_FAMILIES_1 SF5.2 The Squeaky Cart | built, re-read 2026-11-15 |
| `wm-3` | STORY_FAMILIES_1 SF5.4 The Rare Box | built, re-read 2026-11-15 |
| `wm-4` | STORY_FAMILIES_1 SF5.5 Route's End | built, re-read 2026-11-15 |
| `convoy-lost-children` | STORY_FAMILIES_3 SF15.1 Children on the Road | built, re-read 2026-11-16 |
| `convoy-lost-researcher` | STORY_FAMILIES_3 SF15.2 A Researcher Needs an Escort | built, re-read 2026-11-16 |
| `convoy-merchant-cart` | STORY_FAMILIES_3 SF15.3 The Merchant's Cart | built, re-read 2026-11-16 |
| `convoy-shelter` | STORY_FAMILIES_3 SF15.5 The Shelter | built, re-read 2026-11-16 |
| `convoy-wounded-ranger` | STORY_FAMILIES_3 SF15.4 A Wounded Ranger | built, re-read 2026-11-16 |
| `hunt-clue-feather` | STORY_FAMILIES_4 SF30.1 A Feather That Hums | built, re-read 2026-11-16 |
| `hunt-clue-scorch` | STORY_FAMILIES_4 SF30.2 The Burned Ring | built, re-read 2026-11-16 |
| `hunt-clue-witness` | STORY_FAMILIES_4 SF30.3 The Witness | built, re-read 2026-11-16 |
| `hunt-lair` | STORY_FAMILIES_4 SF30.4 Where the Storm Rests | built, re-read 2026-11-16 |
| `spooky-costume-judge` | STORY_FAMILIES_3 SF16.10 The Festival Stops | built, re-read 2026-11-16 |
| `spooky-detour-battle` | STORY_FAMILIES_3 SF16.2 The Haunted Detour | built, re-read 2026-11-16 |
| `spooky-hexed-keeper` | STORY_FAMILIES_3 SF16.11 The Hexed Keeper | built, re-read 2026-11-16 |
| `spooky-hollow-lantern` | STORY_FAMILIES_3 SF16.4 The Hollow Lantern | built, re-read 2026-11-16 |
| `spooky-hollow-mirror` | STORY_FAMILIES_3 SF16.7 The Hollow Mirror | built, re-read 2026-11-16 |
| `spooky-lantern-festival` | STORY_FAMILIES_3 SF16.5 The Lantern Festival | built, re-read 2026-11-16 |
| `spooky-light-one` | STORY_FAMILIES_3 SF16.1 A Light Off the Road | built, re-read 2026-11-16 |
| `spooky-light-two` | STORY_FAMILIES_3 SF16.3 The Light Returns | built, re-read 2026-11-16 |
| `spooky-medium` | STORY_FAMILIES_3 SF16.6 The Medium's Table | built, re-read 2026-11-16 |
| `spooky-pale-visitor` | STORY_FAMILIES_3 SF16.9 The Pale Visitor | built, re-read 2026-11-16 |
| `spooky-whispering-grave` | STORY_FAMILIES_3 SF16.8 The Whispering Grave | built, re-read 2026-11-16 |
| `vt-grunt-favor` | STORY_FAMILIES_3 SF17.3 The Rookies Return | built, re-read 2026-11-16 |
| `vt-grunt-school` | STORY_FAMILIES_3 SF17.1 Villain Grunt School | built, re-read 2026-11-16 |
| `vt-grunt-union-strike` | STORY_FAMILIES_3 SF17.2 Grunt Union Strike | built, re-read 2026-11-16 |
| `vt-pyromaniac-sweep` | STORY_FAMILIES_1 STORY FAMILIES, PART 1 | built, re-read 2026-11-15 |
| `vt-stolen-egg-lab` | STORY_FAMILIES_4 STORY FAMILIES, PART 4 | built, re-read 2026-11-16 |
| `th-map-1` | STORY_FAMILIES_4 SF23.1–23.5 The Five Pieces | built, re-read 2026-11-16 |
| `th-map-2` | STORY_FAMILIES_4 SF23 The Treasure Map | built, re-read 2026-11-16 |
| `th-map-3` | STORY_FAMILIES_4 SF23 The Treasure Map | built, re-read 2026-11-16 |
| `th-map-4` | STORY_FAMILIES_4 SF23 The Treasure Map | built, re-read 2026-11-16 |
| `th-map-5` | STORY_FAMILIES_4 SF23.1–23.5 The Five Pieces | built, re-read 2026-11-16 |
| `th-treasure` | STORY_FAMILIES_4 SF23.6 X Marks the Spot | built, re-read 2026-11-16 |
| `face-aspiring-rival` | STORY_FAMILIES_1 STORY FAMILIES, PART 1 | built, re-read 2026-11-15 |
| `starter-ember-shrine` | STORY_FAMILIES_4 SF21.1 The Ember Shrine | built, re-read 2026-11-16 |
| `starter-first-pal` | STORY_FAMILIES_4 SF21.2 The First Pal's Nest | built, re-read 2026-11-16 |
| `starter-old-orchard` | STORY_FAMILIES_4 SF21.3 The Old Orchard | built, re-read 2026-11-16 |
| `starter-power-hum` | STORY_FAMILIES_4 SF21.4 The Hum | built, re-read 2026-11-16 |
| `starter-tide-pool` | STORY_FAMILIES_4 SF21.5 The Tide Pool | built, re-read 2026-11-16 |
| `rk-hidden-quest` | STORY_FAMILIES_4 SF20.1 A Secret Errand | built, re-read 2026-11-16 |
| `rk-hidden-quest-payoff` | STORY_FAMILIES_4 SF20.2 Kept Your Eyes Open | built, re-read 2026-11-16 |
| `rk-third-wheel` | STORY_FAMILIES_2 STORY FAMILIES, PART 2 | merged into `companion-meet`, re-read 2026-11-16 |
| `charity-drive` | STORY_FAMILIES_7 SF43.12 The Orphanage Stall ( | built, re-read 2026-11-16 |
| `charity-favor` | STORY_FAMILIES_7 SF43.14 The Favour Returned ( | built, re-read 2026-11-16 |
| `cooking-draft` | STORY_FAMILIES_4 SF22.6 The Draft | built, re-read 2026-11-16 |
| `cooking-final` | STORY_FAMILIES_4 SF22.7 Three Silent Judges | built, re-read 2026-11-16 |
| `graveyard-vigil` | STORY_FAMILIES_3 SF16.10 The Festival Stops | built, re-read 2026-11-16 |
| `heist-go` | STORY_FAMILIES_3 SF18.2 The Heist: Execution | built, re-read 2026-11-16 |
| `heist-plan` | STORY_FAMILIES_3 SF18.1 The Heist Plan | built, re-read 2026-11-16 |
| `surf-rescue` | STORY_FAMILIES_1 STORY FAMILIES, PART 1 | built, re-read 2026-11-15 |
| `time-loop-2` | STORY_FAMILIES_4 SF19.2 Ready This Time | built, re-read 2026-11-16 |
| `time-loop-3` | STORY_FAMILIES_4 SF19.3 The Baker Remembers | built, re-read 2026-11-16 |
| `time-loop-village` | STORY_FAMILIES_4 SF19.1 Noon | built, re-read 2026-11-16 |
| `umbrella-share` | STORY_FAMILIES_7 SF43.13 The Umbrella ( | built, re-read 2026-11-16 |
| `spooky-candle-vigil` | STORY_FAMILIES_3 SF16.10 The Festival Stops | built, re-read 2026-11-16 |
| `spooky-graveyard-dig` | STORY_FAMILIES_3 SF16.10 The Festival Stops | built, re-read 2026-11-16 |
| `spooky-haunted-mansion` | STORY_FAMILIES_3 SF16.10 The Festival Stops | built, re-read 2026-11-16 |
| `spooky-lost-spirit` | STORY_FAMILIES_3 SF16.10 The Festival Stops | built, re-read 2026-11-16 |
| `spooky-midnight-finale` | STORY_FAMILIES_3 SF16.12 The Pumpkin King and the Midnight Parade | built, re-read 2026-11-16 |
| `spooky-pumpkin-king` | STORY_FAMILIES_3 SF16.12 The Pumpkin King and the Midnight Parade | built, re-read 2026-11-16 |
| `spooky-pumpkin-patch` | STORY_FAMILIES_3 SF16.10 The Festival Stops | built, re-read 2026-11-16 |
| `spooky-trick-or-treat` | STORY_FAMILIES_3 SF16.10 The Festival Stops | built, re-read 2026-11-16 |
| `dg-treasure-dig-a` | STORY_FAMILIES_4 SF23.6 X Marks the Spot | merged into `th-dig-a`, re-read 2026-11-16 |
| `dg-treasure-dig-b` | STORY_FAMILIES_4 The Chest ( | merged into `th-dig-b`, re-read 2026-11-16 |
| `dg-treasure-dig-c` | STORY_FAMILIES_4 Daylight ( | merged into `th-dig-c`, re-read 2026-11-16 |
| `ovc-treasure-map-s1` | STORY_FAMILIES_4 SF23.1–23.5 The Five Pieces | merged into `th-map-3`, re-read 2026-11-16 |
| `ovc-treasure-map-s2` | STORY_FAMILIES_4 SF23.1–23.5 The Five Pieces | merged into `th-map-4`, re-read 2026-11-16 |
| `starter-fever-week` | STORY_FAMILIES_4 STORY FAMILIES, PART 4 | pending |
<!-- table:end -->
