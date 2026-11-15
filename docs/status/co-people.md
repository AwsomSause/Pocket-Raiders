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

**Flags.** The doc's `roster.joey.m1` is key `roster-joey-m1`: use `R.set('m1')`, `R.is('won1')`, `R.not('won1')`. Every outcome the doc marks with `.m1` sets it with `R.set('m1')`. Every Meeting 2 outcome that counts as the meeting sets `R.set('m2')` (the doc leaves it unsaid). Every Meeting 3 outcome sets `R.set('done')` plus its ending flag. When the doc gives a meeting no flag for a choice (a plain refusal), set nothing: that is the doc. A flag that nothing in your file reads goes in your module's `AFTERSTORY` export with where the doc says it comes back.

**Rewards.** "Reward. Meeting 1: a Potion" is paid when that meeting's battle is won (in `win`); a Meeting 3 reward is paid by every outcome that finishes the meeting unless the doc ties it to one choice. Never more than the doc states.

## Status
See the tables below (filled in as files are finished). Checked = the doc section was opened again after the build and compared line by line.

## Needs Kice
Listed here as they are found: beats that only work across runs.
