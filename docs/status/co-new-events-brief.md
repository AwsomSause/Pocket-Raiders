# Brief: build part N of the 100 new events (Pocket Raiders, Catalog Overhaul row 17, category `new-events`)

You are writing game content (TypeScript that builds event JSON) for a Pokémon roguelike. The director (Kice) ordered:
"Rebuild all events ... with the data/info in the zip. Whenever you finish something, re-read the doc and make sure it's correctly put together."
and for event text: "DO NOT CUT ANYTHING; expand text, make more emotional." Build each event to its script: every line, choice, outcome,
Remembers variant, reward and Afterstory. No stand-ins, no simplified versions.

## Sources (read only your part)
- Script: `/mnt/project-files/catalog_overhaul_pack/catalog_overhaul/NEW_EVENTS_<N>.md` (your NE range only; grep `^## NE` for line numbers).
- Placement: `/mnt/project-files/catalog_overhaul_pack/catalog_overhaul/NEW_EVENTS_PLACED.md`: read its rules section at the top, then only the rows/notes for your NE numbers. Each event gets a `place: { earliest, home, window, sits, attaches, tags, level?, note? }` taken from there.
- Shared word board: `/mnt/project-files/plans/catalog-overhaul/STANDARDS.md` (pack words: "+1 Bond", Kindness, Reputation, "(a node)", items).
- Kit: `tools/events/co/_ne.ts` (read it whole: `ne()`, `after()`, `step()`, `variant()`, `P()`, `L()`, `kind()`, `kindFull()`, `rep()`, `sign()`, `telling()`, `temp()`, `teach()`, `place()`, `anyFlag()`, `GROUP`).
- Worked example: `tools/events/co/new-events-1.ts` (NE1 to NE25). Read its top helpers and three or four events fully (for example NE1, NE5, NE10, NE16) to copy the style, then follow it. Do not read the whole file.
- DSL: `tools/events/dsl.ts` (grep the helper you need; `ch`, `out`, `fight`, `wild`, `trainer`, `join`, `item`, `flag`, `flagIs`, `flagAt`, `flagAgo`, `flagThisRegion`, `bondUp`, `bondIs`, `takeNode`, `takeNodeBack`, `anyType`, `room`, `again`, `br`, `leadIs`, `pickedIs`, `lv`, `fr`, `heal`, `hurt`, `money`, `$`).
- Schema truth: `src/core/contentSchema.ts` (grep `kind: z.literal('<name>')` to check a field before using it).

## Writing rules
- Text: pages are joined with `P(...)` (blank line = page break), lines inside a page with `L(...)`. A speaker line is `Name: "words"` (e.g. `L('Climber Lazarus: "Egg thieves, two summers back."', ...)`). Keep pages under about 240 characters. Lines over 30 words are split at sentence ends by the kit, but a single sentence over 30 words fails the test: keep sentences shorter.
- Expand and deepen the doc's text (more feeling, more concrete detail), never drop or change what the doc says happens. Named NPCs keep their names. Narration in second person ("You ...").
- Once per run is automatic in `ne()`. "Once per save" = once per run. The pack's **Save** flags / cross-run memory are NOT built (Kice: memory only inside the same run). Anything "next run"/"a past run" is left out and listed in your report.
- No event ends a run, forces a Shadow Pokémon, or gives an in-battle healing item. Grunts are male only. No Keepsakes, Souvenirs or Shards: a cosmetic keepsake item (feather, photo, drawing, ticket stub...) becomes a run flag plus text instead. Items with a real game effect use an existing item id (check with `grep -n '"<id>"' src/data/items.json` or the item catalog) or are listed in your report as "needs an item".
- Fights the player may lose without it hurting the run: `trainer(name, { friendly: true, lose: [...] })` or `{ ...wild({...}), friendly: true, lose: [...] }`. Rival/story losses never end a run.
- "(a node)" cost = `takeNode()` (two nodes: `takeNode(2)`); "a node back" = `takeNodeBack()`. "+1 Bond" = `bondUp(1, who)` (who: 'lead', 'party', 'picked', 'starter', 'top', 'firstCatch', 'newest'). Bond level condition = `bondIs(n, who)`. A choice that points at one Pokémon: `ch(label, out(...), { pick: { types?, moveFlag?, bond? } })` then effects with who 'picked'.
- Kindness = `...kind(n)` (full Kindness Ledger good deed: `...kindFull(n)`). Reputation = `rep(n)` / `repLost(n)`. Legendary Sign = `sign()` (the run's own legend) or `sign('<legend>')`. Mythical Telling = `telling('<mythical>')`. Promise step = `promiseStep('<mythical>')`. Calmed Alpha = `calmed()`.
- Outcome depends on a condition (type of picked Pokémon, a flag): choice `branches` via `br([conds], 'text', ...effects)` in `ch(label, out(...), { branches: [...] })` (first match replaces the outcome text and effects).
- Remembers: at most 3 `variant(id, when, { intro?, notice?, hide?: [choice indexes], addChoices?: [max 3] })` per event; only the first matching variant applies; a variant must leave at least one base choice visible.
- Afterstory / later beat: `after(n, id, name, GROUP.x, [conditions], { minStage, ... }, intro, choices)` (gets a stop on the first later stage where the conditions hold; set a stamped flag with `flagAt(key)` and read "a region later" with `flagAgo(key)`, "same region" with `flagThisRegion(key)`). A second step of the same scene: `step(...)` opened by `room(id)` in an outcome.
- Shared pieces in this branch you may use (see STANDARDS.md "More shared pieces"): `friendly`/`lose` on battles, `foeMoves` on trainer battles, `seeAgain` (`again(id)`), `tempEffect` (`temp(label, battles, until, ...modifiers)`; `forRegion(label, ...modifiers)` for a whole region), `laterEvent` `{ kind: 'laterEvent', eventId, nodes }`, `flagAge` `{ kind: 'flagAge', key, atLeast, atMost }` (stages since a flag), `partyLine`/`friendshipLine`, text tokens `{lead}` `{starter}` `{most}` `{least}` and `record` condition (families-c), `stageTypes`, `runPlace` (`place({...})`), `hasEgg`, `weather`, `anyFlag`, `quietWild`, `eggWarm`, `typeItem`, `tagPartner` `{ kind: 'tagPartner', copy: 'lead', battles }`, rule `foeNoFlag`, rule `foeTailwind`, `join` `levelShare`, `teachMove` `who`.
- Pending pieces (write them in their final shape; the test allows them): Alpha fights `{ ...wild({ species: [x], lv }), alpha: true }`; quirks on a joining Pokémon `{ ...join({...}), quirk: '<kebab-id>' }` (list each quirk's name, one-line description and battle effect in your report).
- NOT available: anything else. If a doc line needs a mechanic that does not exist, do NOT fake it with something different. Write the closest honest version only if it matches the doc's meaning; otherwise list it in the report under "needs engine" with the exact JSON shape you would want, and leave that part out.

## Do not touch
`tools/events/co/_ne.ts`, `tools/events/dsl.ts`, anything in `src/core/`, other `new-events-*.ts` files, `tests/`. Local helpers go at the top of your own file.

## Build and check (run from the repo root of your worktree)
1. If `node_modules` is missing: `ln -s /home/user/pkmn/node_modules node_modules`.
2. `npm run co:build -- new-events-<N>` (writes `src/data/events/co-new-events-<N>.json`; never hand-edit it).
3. `npx vitest run tests/unit/catalogOverhaul.test.ts tests/unit/coNewEvents.test.ts` must pass (schema, ids that exist, flags read are set, done flags, line length, nothing silently dropped). If a test says data is missing right after adding a file: `rm -rf node_modules/.vitest-cache node_modules/.vite` and re-run.
4. Re-read: go through your doc section event by event against your file and fix anything missing. Then commit both files on your worktree branch (message "New events part <N> (NE<a> to NE<b>)", ending with the two lines `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01B8zAVCWK459etiEC8i1M9N`). Do not push.

## Report (short, plain)
- Commit hash and branch name.
- Table: NE number -> event ids (main + afterstories/steps).
- Re-read table: NE number, what you checked, "all built" or what is left out and why.
- Needs engine (exact shape), needs item, needs art (cast sprites that do not exist: check `ls public/assets/images/trainer/`), quirks (id, name, line, effect).
- Flags you read that another thread sets (key and which doc/thread), and cross-run lines you left out.
- Decisions you made where the doc was unclear.
