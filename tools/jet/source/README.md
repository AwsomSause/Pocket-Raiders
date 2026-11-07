# Jet Pokédex data

Six Pokémon: 001 Vine Riff, 002 Electric Oncore, 003 Cataggron, 004 Bastiodoom, 005 Pyro Spirit, 006 Neon Moon.

- `pokedex.json`: every Pokémon in one file.
- `pokemon/`: one JSON file per Pokémon, same schema as an entry in `pokedex.json`.
- `csv/`: flat tables for spreadsheets or importers (species, abilities, level-up moves, TM moves, signature moves, type defenses, forms). Rows are keyed by `pokemon` (the id).
- `sprites/`: the 128×128 PNG sprites, renamed by id. Cataggron has one per form.
- `showdown/recommended_sets.txt`: the recommended sets in Pokémon Showdown export format.

## Conventions
- Ids are snake_case (`vine_riff`); move, ability and internal names are SCREAMING_SNAKE_CASE (`THORNSTRUM`).
- Stat keys: hp, attack, defense, spAtk, spDef, speed.
- `learnset.levelUp[].level` is 0 for moves learned on evolution (`learnedOnEvolution: true`).
- `power: null` means variable or non-damaging power. Cataclysm Cannon's per-form power is in `signatureMove.formVariants`.
- New abilities and signature moves carry a `mechanics` / `effects` block that describes the rules in structured form; the `description` text is the source of truth if they ever disagree.
- `typeDefenses` lists only non-neutral matchups, keyed by multiplier ("4", "2", "0.5", "0.25", "0").
- Existing abilities (Protosynthesis, Quark Drive, Sturdy, Soundproof) and all non-signature moves work as they do in Scarlet & Violet.
