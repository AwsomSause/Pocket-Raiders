# Catalog Overhaul: people (mentors, past Champions and Leaders, the Road Roster)

Row 6 of `/mnt/project-files/plans/catalog-overhaul/PLAN.md`. Docs (in `/mnt/project-files/catalog_overhaul_pack/catalog_overhaul/`): `STORY_FAMILIES_5.md`, `STORY_FAMILIES_8.md`, `ROAD_ROSTER.md`, `QUESTLINES_PAST_CHAMPIONS_AND_LEADERS.md`, `QUESTLINES_PAST_ALLIES_AND_FUTURE.md`, and `QUESTLINES_DEEPENED_1.md` lines 261 to 435 (PC8, PC10, GL5, GL6).

## Files
| File | What it holds |
|---|---|
| `tools/events/co/_people.ts` | The kit: `rosterKit`, `spar` (friendly fight), `bond`, `scene`, `variant`. |
| `tools/events/co/people-roster-<n>.ts` | Road Roster trainers (RR1 is the pattern file). |
| `tools/events/co/people-mentors-<n>.ts`, `people-leaders-<n>.ts`, `people-champions-<n>.ts`, `people-stories-<n>.ts` | Story Families 5 and 8 and the questlines. |
| `src/data/catalogOverhaul/flags/people.json` | Flags read from other categories (`external`) and flags whose reader is another system (`afterstory`). |
| `tests/unit/coPeople.test.ts` | The gate for this category. `tests/unit/coSharedPieces.test.ts` covers the shared engine pieces. |

## How a scene is written (every people file follows this)

**Source of truth.** The doc section is the spec: every script line, every choice, every outcome, every Remembers line, the reward and its limit. Nothing is cut. Kice's order: expand the text and make it more emotional.

**Text.**
- `intro` = the doc's Opening plus its Script, as flowing prose in one string (no line breaks). Every scripted line appears word for word as `Name: "line"`. Stage directions become narration. Add small, warm, concrete detail around the lines; never change what a character says or means.
- A choice `label` is the doc's button text exactly, in its quotation marks when the doc quotes it (`'"Let\'s go."'`), otherwise the doc's words (`'Battle.'` becomes `'"Battle."'` only if the doc quotes it).
- An outcome `text` tells what the doc's Outcome cell says happens, with any quoted line word for word, expanded into two to four sentences.
- Any spoken line (text inside double quotes) is under 30 words. No copied catchphrases from the games or the anime. Nobody explains rules in dialogue.
- Use straight double quotes for speech, and write apostrophes with `\'` inside single-quoted TypeScript strings.

**Pack words** (also in `/mnt/project-files/plans/catalog-overhaul/STANDARDS.md`).
| The doc says | Build it as |
|---|---|
| A battle | `fight(text, spar(name, { team: ['machoke', 'hitmonchan'], size: 2, win: [...], lose: [...] }), ...effects)`. `team` = the species the doc names, in order (ids are lower-case with hyphens). Every fight uses `spar` (friendly: a loss never ends the run). Effects that depend on winning go in `win`, on losing in `lose`. "Harder", "a very hard battle": `lv: 1` or `lv: 2`. A Pokémon "that knows X": `foeMoves: ['x']` (first Pokémon). A double battle: `format: 'doubles'`. |
| "Then the battle" | The outcome is a `fight` whose text holds the line said first. |
| "+1 Bond" (one Pokémon) / "+1 Bond all" | `bond(1)` / `bond(1, 'party')`. |
| "+1 to a stat" for the lead, "for the region" | `stat('spe', { region: true })`; for the whole run leave `region` out; `stat('best')` = its highest stat. A group ("the player's Flying-types gain +1 Speed for the region"): `forRegion('Riding the wind', { kind: 'statMultiplier', stat: 'spe', type: 'flying', value: 1.05 })`. |
| Another bonus "for the region" | `forRegion(label, ...modifiers)` with modifiers from `ArchetypeModifierSchema` (`src/core/contentSchema.ts` line 686 on): `priceMultiplier`, `moneyMultiplier`, `friendshipMultiplier`, `xpMultiplier`, `captureMultiplier`, `healingMultiplier`, `damageMultiplier { type, value }`, `postBattleHeal { percent }`, `hiddenItemChance { chance }`... If nothing fits, do not fake it: set a flag named for it and list it in your report under "needs engine". |
| A Pokémon joins | `join({ species: ['taillow'] })`; with a set move add `{ kind: 'teachMove', move: 'hyper-fang', species: 'rattata' }`. An egg: `egg({ species: [...] })`. |
| A trade | `trade(label, want)` then `join(...)` (see `tools/events/dsl.ts`). |
| An item | `item('sharp-beak')`. Check the id: `node <scratch>/ids.mjs item sharp-beak` (path in your brief). A doc-original item with a new effect (for example "a moonflower: the holder can't be put to sleep") is listed in your report under "new items"; give the doc's other listed reward when it offers one ("a Miracle Seed or a moonflower"), else leave a `// TODO(new item): ...` on that outcome and set the flag `roster-<key>-owed-<item>`. A cosmetic (a cap, a drawing, a ribbon) is told in the text and recorded with `moment('...')`; cosmetics are not items. |
| Full heal / status cured / a rest | `heal(1)` / `cure()` / `heal(0.5)`. |
| "N nodes: a petition, a council battle" (a search, a job, a trip) | A chain of side scenes: the choice's outcome opens the first with `room(R.roomId('petition'))`, each side scene's choices open the next, the last one sets the flag and gives the reward. Each side scene is a real small scene (intro, 2 or 3 choices) holding what the doc names for that node. Build them with `R.room('petition', { title, intro, choices })`. |
| A minigame, contest round or race | A choice with a skill prompt: `ch(label, out(win text, ...), { prompt: { id: 'echo-rhythm', needs: 'good' }, fail: out(lose text, ...) })`. Ids (`src/core/interaction/prompt.ts`): `echo-rhythm` (rhythm), `hurdle-rhythm` (a race), `climb-rhythm`, `throw-ring` (timing), `brace-hold`, `pull-hold`, `dive-hold`, `pitch-hold`, `gauge-hold`, `aim-drag`, `tilt-drag`, `balloon-drag`, `shout-tap`, `dodge-tap`, `whack-tap`. Winning and losing both move the arc on. |
| "Skip one node" | `ferry()`. "A node passes / costs a node": `// TODO(takeNode)` on that outcome (the shared `takeNode` effect is not merged yet) and list it in your report. |
| A tag partner | `companion(1)` (travels with you for a stage); for "the region", `companion(3)`. |
| "Maybe later" / "appears again" | `again(R.id(1))` in that outcome (the scene can be drawn again). A plain "Leave" with no flags in the doc sets nothing. |
| Reputation +1 / Kindness +1 | `rep(1)` / `good(1)`. Honest and dishonest acts the doc flags (`honest.kept_stolen`): `flag('honest-kept-stolen')`. |
| Remembers | `remembers: [variant(id, [conditions], { notice, intro, hide: [choice indexes], add: [choices] })]`, at most 3, the first that holds applies. A Remembers line that changes an outcome hides the base choice and adds the changed one. |
| Cross-run things ("next run", "on the save", "in later runs", "carries across runs") | Not built (Kice: memory stays inside one run). Leave them out of the scene and list each in your report under "cross-run". |
| A Remembers line that reads another document's story ("If Z6 (Doran) is done", "A2 if not done") | Do not invent a flag. List it in your report under "cross-doc" with the doc reference. |

**Flags.** The doc's `roster.joey.m1` is key `roster-joey-m1`: use `R.set('m1')`, `R.is('won1')`, `R.not('won1')`. Every outcome the doc marks with `.m1` sets it with `R.set('m1')`. Every Meeting 2 outcome that counts as the meeting sets `R.set('m2')` (the doc leaves it unsaid). Every Meeting 3 outcome sets `R.set('done')` plus its ending flag. When the doc gives a meeting no flag for a choice (a plain refusal), set nothing: that is the doc. A flag that nothing in your file reads goes in your module's `AFTERSTORY` export with where the doc says it comes back. Finishing a Road Roster arc also recruits the trainer as a playable trainer (the old `npc-meet-*` events did; the kit adds the `recruit` to every outcome that sets `done`, never write it yourself). Owning that trainer never hides the arc.

**Rewards.** "Reward. Meeting 1: a Potion" is paid when that meeting's battle is won (in `win`); a Meeting 3 reward is paid by every outcome that finishes the meeting unless the doc ties it to one choice. Never more than the doc states.

## Status
See the tables below (filled in as files are finished). Checked = the doc section was opened again after the build and compared line by line.

### Where this stopped (2026-11-15, paused when Kice capped running threads at five)
| Piece | State |
|---|---|
| Road Roster RR1-RR51 (`people-roster-1..6`) | Built (all 51). Thread re-read not done yet. |
| Roster crossovers (`people-roster-crossovers`) | Built (10 scenes). |
| Mentor engine (lessons, `mentorLesson`/`mentorScene`, `regionsLeft`, battle/map/shop perks, gift items) | Built, unit tests pass (`mentorPerks`, `mentorWorld`). |
| Shared mentor scenes MS1-MS12 except MS9 (`people-mentors-1`) | Built. |
| Mentors B1-B12 (`people-mentors-2..4`) | Built. Thread re-read not done yet. |
| SF8 Day Off frame + B1-B13, B15, B16 (`_wip-people-leaders-1.ts`) | Half written, not built. Rename to `people-leaders-1.ts`, remove `@ts-nocheck`, finish. |
| GL3 wings, GL4-GL10, B14 (`_wip-people-leaders-2.ts`) | Half written, not built. |
| PC1-PC10, C4, PA4 (`_wip-people-champions-1.ts`) | Half written, not built. |
| SF8 C1-C3, C5, C6, D1-D7 (`_wip-people-champions-2.ts`) | Half written, not built. |
| Still to do | Re-read of every doc; status/placement JSON; update fragment; browser spec; `npm run check`; rebase onto the lead's foundation (PR #1316) and split statBoost into an engine-only commit for the lead. |

## Needs Kice
Listed here as they are found: beats that only work across runs.

### Build reports (draft, to be sorted into the final list)
## roster-6 (RR42-RR51): 32 events (30 meetings + jessa-warehouse, tuber-pip-later)
New items: none (Never-Melt Ice = nevermeltice; Gran's Lapras TM = tm-ice).
Needs engine (told in text + flag): RR42 M2 Wait TODO(takeNode); RR44 M2 Sneak one fewer battle in next Rocket stage (roster-boris-inside); RR44 reward one Rocket plan step revealed (roster-boris-evidence); RR45 M3 "I won't" free heals at this Center (roster-jessa-heals; full heal now); RR45 M3 Rocket admin's weakness (roster-jessa-secret); RR48 M3 Show his best move vs next boss (roster-rudy-best-move; gym() for team).
Cross-run: RR45 M3 free heals "for the save". Cross-doc: none.
Calls: RR42 M2 Help variants read roster-kai-m1/roster-finn-m1; rewards in one outcome only to that choice; RR43 M2 Alone = friendly wild Alpha Ursaring lv+2, win sets calmed + joins; RR43 M3 Soothe Bell unless calmed; RR44 M3 tag: Boris's Raticate ally vs "Team Rocket" Arbok+Golbat; RR45 warehouse stealth 2 prompts; M3 variant when stayed; RR47 M2 Tow needs Water-type, Rope needs Flying-type; RR49 Gran win tm-ice, lose Pearl; RR50 M1 50% guess; RR51 "You let him win" at M3; each M3 choice sets own ending flag.
#### roster-5 (RR32-RR41): 37 events (30 + lorna-forest, axel-drummer, axel-setlist, hadrian-sigil, murphy-sea1, murphy-sea2, murphy-island)
New items: none.
Needs engine (flags in AFTERSTORY): RR32 M1 her Pokémon act first turn one (roster-lorna-first-turn); RR33 M1 sound moves hit harder both sides (roster-axel-loud); RR33 M3 requested song plays next region (roster-axel-song 1-3); RR36 M2 spy plan step told in text only (roster-orson-spy); RR36 M3 base stats of every wild Pokémon this region (roster-orson-stats); RR36 M3 Remembers Orson in next evil-team battle -> built as his M3 instead (REVIEW); RR38 M3 team's biggest type weakness (roster-miles-weakness); RR39 M2 Galarian Corsola appear (roster-coral-moved); RR32 M1 Lorna names a type from party (no token; could use {lead} tokens later).
Cross-run: RR39 M2 Plant ("next run the reef is half-back"). Cross-doc: RR34 M2 Prove (sigil from Z2).
TODO(takeNode): RR40 M2 Lifeguard.
Calls: reward tied to one choice (Lorna Thanks Dawn Stone, Murphy Write Mystic Water, Coral Count Corsola, Finn Race win Wave Incense); undoc teams Lorna Meowstic+Gardevoir, Axel Toxtricity+Electivire, Amy=Plusle/Ampharos Tim=Minun/Pachirisu; tag fights use ally, tag partner companion(1) on every M3; Hadrian company fight = evil grunt spar; guardian wild Claydol spar; Finn +1 Speed Water-types run relic; Kai +5% HP stat('hp'); Kai Berry x3 = Oran; type requirements Finn Swim/Send Water, Kai Beacon Fire / Swim Water.
#### roster-4 (RR22-RR31): 37 events (30 + pierre-practice, rex-search, rex-thief, delia-upstream, delia-dumping, hal-poachers, edmund-bridge)
TEMP: roster-quinn-m1 in EXTERNAL (remove once RR8 Quinn built in roster-2).
Needs engine: RR24 M1 "no KO above 50% damage" rule (gentle set on any win); RR25 M1/M3 portrait & painting in hub (moments); RR28 M1 next egg hatches a stage sooner (roster-delia-hatch-sooner); RR31 M3 item lost later returns (roster-edmund-lost-returns); RR30 M3 skipAhead not forest-specific.
Cross-run: RR29 M3 Plant (forest recovers next run). Cross-doc: RR28 M2 Source links D5 (evil dumping).
Calls: RR22 Pierre Voltorb+Mr. Mime, "Which?" skill prompt; one-choice rewards (Light Clay Join win, Silk Scarf Mother, Rare Candy Donate, Lucky Egg/Miltank Watch or Help); RR23 Come with me companion(1); RR24 M3 Kent's Snubbull invented, Moon Stone choice consumes; RR25 M3 foeMoves Spore+Flamethrower only (cap 2), +1 Bond starter who:'picked'; RR26 rain picnic wild Water-types join picnic not party, dish +5% Atk one battle, free meals = heal stop every M3 choice; RR27 six odd Pokémon list; RR28 M1 Audino joins; RR29 Fight fire needs Water, Ride patrol hiddenItemChance 1 for region; RR30 M3 second small Buneary reward; RR31 Wrong fights lv-1, Prove it shows wild Pokémon ahead 3 battles (check works from event), Advise me gymPreview.
#### roster-3 (RR12-RR21): 43 events (30 + Ivan M3 callback + 12 side scenes)
Needs engine: RR13 M3 Plan first move of every boss this region (roster-selene-boss-first-move); RR13 M3 Improvise lead +1 Spe on switch-in this region (roster-selene-switch-speed); RR17 M2 Who evil-team step revealed (roster-baxter-team); RR20 M1 Bow prize +20% (roster-alfred-bow-prize); RR20 M3 Guest finished roster trainer to tea, not gated (roster-alfred-guest); RR21 M3 Story rare nest (roster-anthony-rare-nest); RR21 M2 Dig pick types ground/fighting can be empty.
Cross-run: none. Cross-doc: RR17 M2 Follow -> A9 Static Choir (story-alpha-static-choir) only flag roster-baxter-cables; RR17 M2 Remembers "If A9 resolved" not built.
TODO(takeNode): RR16 M1 Swim; RR17 M2 Fix (rest node used).
Calls: RR12 M1 "Don't need it" also sets m1; RR13 M2 Plan hint=gym(); RR13 M1 Notes Alakazam Psychic+Shadow Ball; RR15 M3 two regions: Ivan callback one region after M2, Mira -m3 one after Ivan sets done + Focus Band; RR18 M1 Gyarados+Lanturn, Fish pull-hold, Sit opens battle side scene; RR19 extra base choices, payback 1100, bet 500/win 1000, thugs roughneck class, Fight 2-battle chain; RR14/RR20 M3 extra base choices for variants; RR16 M2 council veteran class, M3 three openings.
#### roster-2 (RR2-RR11): 51 events (30 + 20 side scenes + Quinn M2 reported version)
New items: RR2 M3 moonflower (holder can't sleep) -> Miracle Seed given instead.
Needs engine: RR2 M1 Sweet Scent+Sleep Powder only on first mon; RR3 M2 "Enter anyway is free" line only; RR4 M3 free deliveries region + one item carried ahead after Race win (roster-ryder-free-deliveries, -carry); RR4 M2 follows two nodes = companion(1) (a stage); RR5 M1 first turn all faster; RR8 M3 free locked chests (roster-quinn-free-locks); RR9 M1 next rest heals 10% more (roster-liam-taught); RR9 M3 rest healing for region (roster-liam-rest-healing); RR10 M1 can't name lost species; RR10 M3 hidden-event reading (roster-hester-reading, -reading-lost); RR11 M1 they target separately.
Cross-run: RR6 M3 Judge (student not on Roster next run). Cross-doc: RR3 M3 Alpha Gyarados A2 (roster-bianca-gyarados); RR6 M3 Z6 Doran at grading.
TODO(takeNode): RR2 M2 Move the garden; RR5 M1 Watch with him.
Calls: RR5 M1 Watch / RR8 M1 Report also set m1; RR8 M2 reported version own event npc-meet-burglar-quinn-m2-reported; RR8 M1 plain Battle win keeps sack (two items, honest-kept-stolen); one-choice rewards (Quinn Lock, Hester Thank Spell Tag, Couple Tag companion(1), Perry Chick Taillow else Sharp Beak, Wade Trade Scyther else Silver Powder); RR11 M2 Leon meeting + Sky side scene, two apologies reconciled; RR3 M1 Bianca Milotic alone; RR6 M2 Train me Low Kick/Mach Punch; RR11 M2 solo fights lv-1; RR2 M2 council battle saves garden win or lose; roster-hester-doll in AFTERSTORY.

#### Mentor engine (battle perks) — agent report
stabDamageMultiplier (Brook) trainerPerks.ts:102; turnOneKoSpeed engine switchIn; noFlinchTurnOne canAct (boss/rival); foeMissBoost; foeMovePreview (deriveRng 'foeMovePreview', no draws; Old UI text only "Foe will use X!", New UI not wired); lostBattleXp ((v-1) x XP earned that battle; 0 if no foe defeated, still used); Ravi's Bell firstMoveSure (first move aimed at a foe). Simplified: KO speed counts any turn-one enemy faint; doubles: KO speed + preview not wired. battle field `lesson` optional, no save bump.
#### Mentor engine (map/shop/evolution) — agent report
Fenwick declinedEvolutionBoost: decline = battle after which a Pokémon ready to evolve was held (Hold evolution); cap 10%; clears on evolving; field evoDeclineBoost optional. Juno hiddenItemSight: lesson hides one item per stage, shown within N steps ahead. Tobias shopWorthIt/shopDeal: shops sell no battle held items, so the mark shows only on evolution/form items. Gifts giftOnly (never in reward draft). Linden's Notebook: on at start of next region, wild-stop moves preview for reachable stops. The 400 Pages (Ysolde): no Legendary Sign system yet, status pending.
#### Mentors B2-B6
Needs engine: Fenwick kept (Eevee never evolves), Fenwick choice (Eevee picks own evolution), Celeste recruit by party gap. Cross-run: Dax rival from past run, Dax coach students on Roster later runs, Linden kept habitats for the save. Cross-doc: SF14.5 Grand Festival (Celeste judge/perform/rest), D1 Delta Study (Linden deltas/lab/self, Delta Lens new item TODO), AQ54 Gary (Fenwick Remembers). Judgment: Juno +Crobat; Linden +Reuniclus,Magnezone; Fenwick final 7 (Espeon,Umbreon,Vaporeon,Jolteon,Flareon,Sylveon,Eevee); Dax final = mirror of your team +1 (rival +3); Dax lesson Scraggy+Mankey; Fenwick "I won't evolve it" stat to picked Normal-type; Juno recruit from Absol/Lapras/Dratini/Larvitar/Riolu.
#### Mentors B7-B12
Needs engine: Marigold team at max Bond (text only); Tobias team holding six perfect items (text); Ysolde Regi if met none (always Registeel); Sable in the E4 this run (sable-league/sable-joy); Vesper real League battle (vesper-promise/vesper-soft); Tobias "the region's Gym Leader" (text). Cross-doc: A2 lamp relit (ravi-light), blessing-Legendary Sign (ysolde-sign), SF10 Hooded Traveller. Judgment: Marigold +Azumarill,Snorlax,Clefable; lesson egg Togepi/Happiny/Riolu/Azurill/Munchlax 3 stages; Tobias team Ambipom,Kangaskhan,Snorlax,Breloom,Conkeldurr,Ferrothorn; Vesper E4 team Sableye,Mismagius,Honchkrow,Weavile,Chandelure,Spiritomb; Vesper farewell doc line only on win, written line on loss; Ravi Sail = three sea rooms.
#### Crossovers (me)
Needs engine: Boris+Jessa "free heals across the region" (heal stops are already free; heal(1) now); Hal+Willa one forest node always safe; Swim Club sea-node skip per region (ferry() once now).

