# Choice memory ("Remembers") framework (Beta 0.6, events revamp slice 1)

Source: the catalog overhaul pack, `MEMORY_AND_FORMAT.md` section 2 (`/mnt/project-files/catalog_overhaul_pack/`). Report: `/mnt/project-files/reports/catalog-overhaul-intake-2026-11-13.md`.

## What it is
Events can remember what the player did earlier in the run. Flags already existed (`run.story.flags['ev:<key>']`, set by the `flag` effect, read by the `flag` condition). This slice adds the missing half: an event can carry up to **3 `remembers` variants**; the first one whose `when` conditions hold changes what the scene shows.

A variant may: replace the intro (`intro`), add a line naming the remembered act (`notice`), hide base choices (`hide`, by index), and add choices (`addChoices`, up to 3, total 1 to 4 visible). Only one variant applies at a time.

## Rules for content authors
- Flag ids from the pack (`kind.helped_stranger`) become keys with `memoryKey` (`kind-helped-stranger`). Use the key in `flag` effects and conditions. Registry: `src/data/overhaul/memoryFlags.json` (run-scoped only).
- Name the remembered act in `notice` the first time it matters (pack rule 2.7).
- Negative flags never lock a reward forever: add a way to make amends.
- Base choices keep their index forever. Added choices follow, in variant order. Stored indices (event battles, saves) use these stable indices; the player picks by position in what is shown, and `chooseEvent` maps it.

## Code
`src/core/eventMemory.ts` (pure, no RNG): `memoryKey`, `memoryValue`, `remembered`, `activeVariant`, `allChoices`, `choiceAt`, `visibleChoices`, `effectiveEvent`. `eventView` returns the effective event, so all event screens show variants with no UI change. Schema: `EventVariantSchema` in `contentSchema.ts`. Data gate: choices added by variants are checked like base choices (`src/data/index.ts`).

## Decisions (Kice, 2026-11-13)
No cross-run flags: pack's `past.*`, `released.*`, `promise.*`, `faller.rank`, Rival Archive, Keepsakes, Souvenirs and Shards are not built. Healing: events follow Beta 0.6 (10 heals and 6 revives per battle), not the pack's "no healing items".

## Limits
No real event uses `remembers` yet (next slices add them). Variants read flags only through existing conditions. Save: none (flags are an existing record).

Tests: `tests/unit/eventMemory.test.ts`.
