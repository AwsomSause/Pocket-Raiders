# Dominion redesign · 50 passes

Mockups for every Dominion (Evil Mode) screen, redesigned 50 times. Each pass changes the whole UI, not one page, the same way the main game's UI and animation threads worked. They use the Dominion mockups, the main UI mockups and the animation mockups as references. All art comes from the game's own sprites and the Google Drive packs.

- **Live viewer:** https://claude.ai/artifact/DGCW3D7mK6AgbzNRaJVubU (the slider at the top switches passes, and ◀ ▶ step through them)
- **Offline:** open `index.html` in a browser. It is the same file.

## What is in this folder

| Path | What it is |
|---|---|
| `index.html` | The built viewer: all 50 passes and 194 pages in one file |
| `passes.json` | For each pass: its name, the big change, its new pages, and the five answers |
| `sprites/` | The 358 sprites the mockups use, copied from the game and the Drive packs |
| `src/kit.js`, `src/data.js` | The mockup kit and the pass 1 pages |
| `src/pNN.js`, `src/pNN.css` | One pass each. A pass only adds to or replaces what came before, so you can step back to any pass |
| `src/notes.json` | The answers after each pass (copied into `passes.json` when you build) |
| `src/build.py`, `src/run.sh`, `src/shoot.cjs`, `src/chk.py` | Build, screenshot and fit checks |

## The five questions

After every pass the notes answer: is it more eye-catching, how is it different and better than the last pass, should pages be added to avoid clutter, how a Menu and a Settings page fit, and does it feel like a Pokémon game.

## Passes

| Passes | What changed |
|---|---|
| 1–5 | Nova baseline, bold type, places, motion, Menu and Settings |
| 6–10 | Faces, the heist, battle stage, powers, story beats |
| 11–15 | Living HQ, the board, Rotom Phone, cards, day and night |
| 16–20 | Heat and the law, rivals, headlines, the Chair, every player (access, controls, phone) |
| 21–25 | Rotom's lessons, Empire, breathing room, the Nova mark, Master Cut |
| 26–30 | Spectacle, sound you can see, crew life, Rocket war, Second Cut |
| 31–35 | Party line, dirty money, trust, festival nights, Third Cut |
| 36–40 | Rocket falls, Johto, Magnet Line, storm front, Fourth Cut |
| 41–45 | Pocket Classic, the hunted, ranks, gym rush, Fifth Cut |
| 46–50 | Rotom live, clear sight, Final Act (ending and credits), feel, Final Cut |

Every fifth pass is a "cut" that folds the last four into one look and removes noise.

## Rules the mockups follow

- Rotom is the in-game helper's name. Canon characters only, and Grunts are male.
- Event text stays until a key press, and rewards appear only after the text is closed.
- No specific move animations are changed.
- Money does not carry over to a new region or a new run.
- No text is cut off or covered: every page passes the fit check (0 fit, 0 sprite and 0 error problems on all 50 passes).
- Every page is one or two steps from the HQ. Pass 50's "How pages connect" page lists the door to each group.

## Rebuilding

```
cd src
sh run.sh 50            # build, screenshot every page at pass 50, and check fit
sh run.sh 48 ending     # just one page
```

Screenshots go to `.shots/`, which is not committed.
