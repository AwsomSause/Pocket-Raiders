# Pokémon moments, batch 2: battle start and switch-in

**What the player gets.** Pokémon now sometimes open a fight (or come out of the ball) with a small edge or a small setback for the foe. Pikachu's static can paralyse the first foe, Gastly's grin lowers its Accuracy, Arceus lifts every stat (once per run), a Dragon type's aura gives Attack for 3 turns, and walls, glass cannons, legendaries and starters each have a switch-in moment. The message box says the moment's name, a short line and what it did.

**Built (24 start + 5 switch-in = 29 moments).** Start moments run once per battle for the lead. Switch-in moments run for the Pokémon that comes out. At most two play at once (most specific first). Each moment's limit is spent before its roll, so a reload cannot re-roll.

**Rules.**
- Rolls use the same stateless seeded roll as batch 1 (`momentRoll`); no other roll moves.
- No save version bump: limits live in the run's story flags and the battle's story effects.
- Timed boosts (`boostTurns`) are stored as `pm-fade:` tags in the battle's story effects and taken back at the end of their last turn.
- Roles (wall, glass-cannon, support) come from base stats: wall = Def+SpD at least 1.25x Atk+SpA (and 150+), glass-cannon = Atk+SpA at least 1.25x Def+SpD (and 170+), support = HP 75+ with both attackers at 90 or less.
- Eeveelution Bond needs two living Eeveelutions in the party.
- Fix found on the way: evolution lines are now matched on every ancestor, not only the root, so a line listed by its classic root (Eevee) still matches when a custom baby (Tuftin) was added before it. This also helps the batch 1 moments.

**Limited (wording changed to match what really happens).**
- Mewtwo Armored: SpA+1 and SpD+1 only (no flinch immunity yet).
- Lucario Aura: Accuracy +1 only (no seeing the foe's moves).
- Growlithe Loyal: the lead gets Atk +1 for 1 turn (not the whole team).
- Starter Trainers: Atk +1 only (no friendship gain).
- Dark Menace: foe Evasion -1 only (no crit stage).
- Paradox Resonance: Atk or Sp. Atk, whichever is higher.
- Magikarp Splash: the first foe loses 10% max HP, once per run.

**Still off (they need new mechanics, so nothing fake is shown).** Ditto Copy, Smeargle Sketch, Mew Curious, Darkrai Nightmare, Sneasel Ambush.

**Tests.** `tests/unit/pokemonMoments.test.ts`: once per battle, run claim spent, repeatable by seed, timed boost fades after 3 turns, foe status, Eevee's Bond condition, switch-in plays for the right Pokémon, roles, and the list of five disabled moments.
