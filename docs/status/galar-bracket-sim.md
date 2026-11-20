# Galar Tournament: real simulated matches (2026-11-20)

Kice: "Galar Tournament should show a real bracket with real simulated battles that decide your next enemy. Champion stays as the final fight."

## What changed
- `src/core/galarSim.ts` (new): plays one trainer-vs-trainer match. Each boss brings their own Elite Four team for the run's region
  (`bossTeams.json`: species, moves, training; the Champion brings their champion team) at `galarTournament.json` `sim.level` plus the
  round's level bonus. Real stats, the game's damage formula, type chart, STAB, accuracy, crits, speed and priority order, multi-hit,
  drain, recoil, recharge, charge-up and self-faint moves. The boss's own `ai` value decides how often they pick their best move.
  A match that runs out of turns (`sim.maxTurns`) goes to the judges (more HP left).
- `src/core/galarTournament.ts`: with content, `buildBracket` plays every other match with the simulation; the winners move on and become
  the player's next opponents (and the cast Elite Four). The Champion and the run's last rival keep their promised places: if one of them
  loses, the match is replayed with fresh rolls, then with a level edge (`sim.retries`). `runBracket(content, run)` is the one entry point.
- Old saves: a run saved mid-tournament whose cast Elite Four matches the old strength-roll bracket keeps that bracket, so the screen always
  matches the fights the run really has. No save version change.
- Bracket screen (the canvas five-card bracket Kice restored on 2026-11-18): a later round's opponent shows "?" / "Not decided" until the
  matches that decide it are played (the Champion waits in the final); each won round shows its big-screen match with the score
  ("Bede beat Milo 4–1"). "Watch a match" replays the match's real play-by-play (every knock-out, then the result).
- Stadium reporter: "Next up: Marnie, fresh from beating Bede 4–2."

## Limits (documented, not stubbed)
- A sound simulation, not the full battle engine: status moves, abilities, held items, stat stages, switching and gimmicks are left out;
  moves that need a situation the sim does not model (Dream Eater, Fake Out, Sucker Punch, Belch, OHKO, ...) are not used.
- The 32-entrant group pages (New UI `galarPage`) are unreachable since the canvas bracket was restored; unchanged.

## Determinism
Each match rolls on its own stream hashed from the run seed, round and match (`galar-sim:...`): no gameplay stream moves, the same run always
plays the same matches, and a reload shows the same bracket. Results are cached per bracket.

## Tests
`tests/unit/galarTournament.test.ts` (sim brackets over many seeds, determinism, stronger side wins, empty side, run wiring, replay,
old-save bracket kept, reporter line).
