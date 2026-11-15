# Catalog Overhaul Pack: how to build from it

Kice's ask (2026-11-14): rebuild every event, the Evil Team documents, the rival events and everything else in `catalog_overhaul_pack.zip`, to the doc, and re-read the doc after each piece. Pack: `/mnt/project-files/catalog_overhaul_pack/`. Plan, rules for every thread and the category table: `/mnt/project-files/plans/catalog-overhaul/PLAN.md`.

## Files
| File | What it is |
|---|---|
| `src/data/catalogOverhaul/ledger.json` | All 2,821 catalog ids: title, verdict, doc, section, owning category. Built by `npm run co:ledger`. Grep it, never read it whole. |
| `src/data/catalogOverhaul/oldPlacement.json` | Where each old event sat (name, group, stop, rarity, types, minStage, requires, scene...). Taken once; do not rebuild. |
| `tools/events/co/<category>-<n>.ts` | Your content. See `_example.ts`. Exports `CATEGORY`, `EVENTS`, `REMOVE`. |
| `src/data/events/co-<category>-<n>.json` | Output of `npm run co:build -- <category>-<n>`. Commit it. Never edit by hand. |
| `src/data/catalogOverhaul/status/<category>.json` | Your progress: `built`, `merged`, `rule`, `scrapped`, `extra`. Only your own file. |
| `src/data/catalogOverhaul/flags/<category>.json` | New remembered flags you add (key, set by, read by). |
| `docs/status/co-<category>.md` | Status note with the re-read table (id, doc section, date checked). |

## Rules of the loader (`src/data/index.ts`)
- A co file's event replaces any event with the same id, from any source.
- An id in a co file's `remove` list is kept in the game data with `disabled: true`: never drawn or queued again, but a saved run standing on it still loads.
- Two co files may not build the same id; a catalog id may only be built by its owning category.

## Status file
```json
{ "category": "singles",
  "built":    { "berry-tree": "2026-11-15" },
  "merged":   { "w4-berry-tree": "berry-tree" },
  "rule":     { "site-shrine": "Legendary Sign site (blessings)" },
  "scrapped": ["wx-fallen-bridge"],
  "extra":    { "NE12": "ne-012-the-long-table" } }
```
`built`: catalog id, rebuilt in a co file and re-read against the doc (value: the date checked). `merged`: old id to the live event that now holds it. `rule`: old id to the system that covers it. `extra`: things from your docs that are not catalog ids (Greenneedle `gn.*`, new events `NE*`, canon spaces), each pointing at the event id that plays it.
`npm run co:status` prints the count per category. Gate: `tests/unit/catalogOverhaul.test.ts`.

## Gotcha
After adding a new `co-*.json` file, tests may still see the old event list. Run `rm -rf node_modules/.vitest-cache node_modules/.vite` once and re-run.

## Shared pieces board
`/mnt/project-files/plans/catalog-overhaul/STANDARDS.md` lists every shared piece (placement data format, pseudo-stage files, Signs and Tellings, mini-games, the inside route, the pick choice), its owner and its state. Read it before inventing one.

## Patterns
- Pick a Pokémon ("Who soaks first?"): `ch('Who soaks first?', out('...', fr(5, 'picked')), { pick: {} })`; `pick: { types: ['fire'] }` narrows the list. `friendship` and `levels` take `who: 'picked'`. The screens show it with the existing picker.
- Remember something: `flag('key')` adds 1 to a run flag; `flagIs('key')` or `{ kind: 'flag', key, atLeast, atMost }` reads it. Pack flag `kind.helped_stranger` is key `kind-helped-stranger`.
- Count visits ("a perk on the third visit"): add `flag('market-<seller>-visits')` to every visit's outcomes and give the event a `remembers` variant with `when: [{ kind: 'flag', key: 'market-<seller>-visits', atLeast: 2 }]`.
- Once per run: `requires: [{ kind: 'flag', key: '<event>-done', atMost: 0 }]` plus `flag('<event>-done')` in every outcome (or the `eventSeen` condition).
- Map placement: write the doc's placement block to `src/data/catalogOverhaul/placement/<category>.json` (shape in the board above) and also set `minStage`, `requires`, `callback`, `forced`, `room` and `addEvent` so the event plays today. The lead thread is building the placer that reads those files.
- A missing engine piece (an effect or condition the doc needs): add it in `core/` with a unit test, in its own file where you can. Do not replace it with a stand-in.
