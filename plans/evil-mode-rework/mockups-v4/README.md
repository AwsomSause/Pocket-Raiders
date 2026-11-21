# Dominion mockups, round 4

Kice asked (2026-11-19) for 25 more passes on every Evil Mode screen. Each pass answered five questions: is it more extravagant, how is it better than last time, does an action need its own page, how do a Menu and Settings fit, and does it feel like an evil Pokémon game? Every five passes (one "interval") had to make a big change. The answers are on the page under **Reviews**, and in `passes.json`.

Live copy: https://claude.ai/artifact/5AmYQVgPqiA8GueZofd4Sm

- `index.html` is the page: Reviews first, then the 13 new pages (m1 to m13), then all 27 round-3 screens (s0 to s13, c1 to c3, k1 to k10). Sprites load from `sprites/`.
- All styles stay in the first `<style>` block, so `tools/dominion/port-mockup-css.py` ports them. New CSS sits at the end under `/* ===== round 4 interval N ===== */`.
- `src/` rebuilds the page from `../mockups-v3/index.html`: `python3 src/build4.py 5`. `i1.py` to `i5.py` are the five intervals; `kit.py` has shared pieces (top bar, tabs, overlays).
- Every animation stops under reduced motion (checked: none left running).

| Interval | Big change | New pages | Classes |
|---|---|---|---|
| 1 (passes 1–5) | New pages: a Boss Menu and Settings, and the two most cluttered screens split up | m1 Boss Menu, m2 Settings · Dominion, m3 Assign a task (out of Morning), m4 District file (out of the Map) | `.blade`, `.seg`, `.tg`, `.srow`, `.cat`, `.task`, `.act`, `.grp`, `.quote` |
| 2 (6–10) | The Nova livery on every screen: lacquer black, crimson seams, the Nova eye on titles, blood-gold buttons, crimson underlight and sigil, red lock-on ring | none | `.st` vars `--edge/--blood`, `.ttl::before` (eye), `.cta::before`, `.vl4`, `.sig4`, lock-on outline |
| 3 (11–15) | Getting around: page map, hold-Q command wheel, breadcrumbs, one Settings list, crimson shutter between pages | m5 The Boss's board, m6 Command wheel, m7 Crimson shutter | `.cork`, `.pol`, `.wheel`, `.wo`, `.hub4`, `.crumb`, `.q4`, `.shut`, `.eye4` |
| 4 (16–20) | Action moments: Do it plays a Boss order cut-in, then a result page | m8 Boss order cut-in, m9 Job done, m10 Job botched, m11 The Hero shows up | `.band`, `.order`, `.say`, `.bigstamp`, `.loot`, `.chg`, `.sirenL/R`, `.tape4`, `.crack`, `.vs4` |
| 5 (21–25) | Villain flavour: the morning paper, the Boss's throne and Persian, gang words in menus, an audit, the hijacked TV broadcast | m12 The morning paper, m13 The hijacked broadcast | `.paper`, `.wanted`, `.throne`, `.tv`, `.onair`, `.lower3`, `.ticker4` |

Changes to old screens: every key strip shows Q for the wheel (the Crew File's Q/E paging moved to the arrow keys); Rotom Settings (k1) has the same category list as the Dominion tab. Layouts, text and numbers on the 27 old screens are otherwise unchanged.
