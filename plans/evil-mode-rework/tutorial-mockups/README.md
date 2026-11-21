# Dominion tutorial and opening mockups

Kice asked (2026-11-21) for mockups of a Dominion tutorial and opening, one mockup per page or interaction. 43 pages, same look as round 4 (`../mockups-v4/`, Nova livery, New UI).

Live copy: https://claude.ai/artifact/2cSDb623wFHXSUTNJL5pA8

- `index.html` is the page. It reuses round 4's `<style>` block and painter script, then adds the tutorial pieces (`.tu-*` classes) at the end of the same style block, so `tools/dominion/port-mockup-css.py` can port them.
- `src/build.py` rebuilds it: `python3 src/build.py`. Some pages reuse round-4 screens (title, Day 1 HQ, the Card, the map, the wheel, the Boss Menu) and lay the tutorial over them.
- `sprites/` holds the sprites the page uses, copied from round 4. `t-acetrainer-m.png` is frame 0001 of `public/assets/images/trainer/pr/ace_trainer_m.png` (same pack as the built Admin picks).

## The flow

| Part | Pages | What happens |
|---|---|---|
| A · Before the run | a1–a6 | Title (first-time tag), the help choice (full walkthrough / tips only / off), a three-beat cold open, the first reward |
| B · The setup | b1–b3 | The three built setup pages (D1) with one Rotom tip each, plus the "only one type" case |
| C · The first evening | c1–c11 | The built opening scene, starting kit, Rotom boots up, lessons 2–6 (top bar, orders, First Steps, tasks, the night) |
| D · The first week | d1–d13 | Lessons 7–14 (mornings, the Card, Heat, the map, the wheel, the Boss Menu, bills, Rocket notices you), the first job, Week 1 Ledger |
| E · The Founding | e1–e9 | Street Gang, lesson 15 through the built Founding (name, colours, mark, Goal), the sign goes up, tutorial done, Replay a lesson |

## Rules kept

- Text stays until a key is pressed. Every reward card shows only after its text is closed (green "✓ Shown only after the text is closed" chip).
- The helper is Rotom. Tutorial lines are written ahead of time (no Rotom spend).
- Canon characters only: Red (the Boss), Giovanni, Officer Jenny. Rook is the design's default Grunt, male.
- No move animations touched.
- Every animation sits inside `prefers-reduced-motion: no-preference`.

## Build notes

- A "Tutorial" row (Full walkthrough, Tips only, Off) goes in Settings, Dominion tab: a settings save bump with a migration test.
- Lesson progress needs a small saved list (which lessons were shown), so replaying or resuming a run never shows a lesson twice.
- "Replay a lesson" is a new Boss Menu blade (key T inside the menu; L is already the Ledger) and page (e9).
- Numbers come from `src/data/dominion/start.json` and Part 1 §4's sample week. None are playtested.
