# Jet Pokédex data

All Pokémon: 001 Vine Riff, 002 Electric Oncore, 003 Cataggron, 004 Bastiodoom, 005 Pyro Spirit, 006 Neon Moon, 007 Maliceye, 008 Gemgoyle, 009 Decidueye (Assassian), 010 Dreadodile, 011 Promised Prince, 012 Benovolant Beak, 013 Tyrant King, 014 Fallen Liege, 015 Alolan Trapinch, 016 Alolan Vibrava, 017 Alolan Flygon, 018 Mega Alolan Flygon, 019 Paldean Golett, 020 Paldean Golurk, 021 Alolan Dratini, 022 Alolan Dragonair, 023 Alolan Dragonite, 024 Galarian Grimer, 025 Galarian Muk, 026 Magmuk, 027 Galarian Spearow, 028 Galarian Fearow, 029 Galarian Azurill, 030 Galarian Marill, 031 Galarian Azumarill, 032 Galarian Trubbish, 033 Galarian Garbodor, 034 Galarian Lotad, 035 Galarian Lombre, 036 Galarian Ludicolo, 037 Neocleon, 038 Galarian Magnemite, 039 Galarian Magneton, 040 Galarian Magnezone, 041 Galarian Tangela, 042 Galarian Tangrowth, 043 Galarian Chikorita, 044 Galarian Bayleef, 045 Galarian Meganium, 046 Galarian Cyndaquil, 047 Galarian Quilava, 048 Galarian Typhlosion, 049 Galarian Totodile, 050 Galarian Croconaw, 051 Galarian Feraligatr, 052 Galarian Larvitar, 053 Galarian Pupitar, 054 Galarian Tyranitar, 055 Galarian Onix, 056 Galarian Steelix, 057 Galarian Slugma, 058 Galarian Magcargo, 059 Galarian Snivy, 060 Galarian Servine, 061 Galarian Serperior, 062 Hoopno.

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
