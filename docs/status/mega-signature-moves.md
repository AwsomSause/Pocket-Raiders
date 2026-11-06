# Mega signature moves (Overhaul slices 27-28)

Kice's rule: the move works only while its Pokémon is Mega Evolved and never replaces the normal moves.

- **Roster (approved):** 142 moves, 92 for the core Megas and 50 for the Delta and Z-Mega fan forms. Table with type, power, accuracy, PP, effect and tier: `plans/mega-signature-roster.md` in the project files. Source for the build: `tools/data/mega-roster.tsv` (the `batch` column says when each row ships).
- **Build:** `npm run data:mega-moves` writes `src/data/megaMoves.json` for the rows up to `BUILT_BATCH` (env `MEGA_BATCH`). It stops on any effect text it doesn't know. The moves carry the `megasig` flag, so no learnset, random-move rule or Metronome-style pool picks them up.
- **Rules:** `src/core/battle/megaMove.ts`. When your Pokémon Mega Evolves it gets the move in an extra slot (`megaSig` on the move slot, shown with a diamond in the move menu); `revertTransformations` removes it when the battle ends. A bonded Mega that stays Mega gets it back next battle. A boss ace that Mega Evolves gets its move too.
- **Engine:** an attack with a weather or terrain effect now hits first and sets it after landing (before, such a move only set the weather).
- **Power budget by Mega base stat total:** under 560 up to 110 power / 10 PP; 560-619 up to 105 / 10; 620-679 up to 100 / 8 (95 without a drawback); 680+ up to 100 / 5. Multi-hit power is per hit. `tests/unit/megaMoves.test.ts` checks every built move against this.
- **Spread move:** Drampa's Elder Gale is a single-target hit for now.
- **Batches:** all 10 built (142 moves: 92 core Megas, 50 Delta and Z-Mega forms). Each move is checked against the power tiers and the slice 4 move cap, and a smoke test uses every one for a turn in `tests/unit/megaMoves.test.ts`.
- **Poison:** "badly poison" in the approved roster is plain poison on an attack (the engine has no badly-poison chance on attacks).
- No new save version: the only save change is an optional `megaSig` on a move slot.
