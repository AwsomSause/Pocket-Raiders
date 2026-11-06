# Overhaul content pack import

Written by `npm run data:overhaul` (tools/import-overhaul-pack.ts). Do not edit by hand.

## Counts

| File | Entries | Source hash |
| --- | --- | --- |
| battle_environments | 70 | ff94dcc832a9a5d4 |
| battlefield_conditions | 55 | 59fc59cfc19b596a |
| event_chains | 180 | e0d1cb58294ab780 |
| growth_paths | 106 | 5337ae9dfe2899bf |
| item_synergies | 452 | 7273318620604215 |
| lines/archetype_lines | 6250 | d4b7f06a24fbc1f3 |
| lines/contextual_reactions | 2155 | ac6c9ab48a4353d5 |
| lines/major_trainer_lines | 11871 | fd447e9a4c0f2dba |
| lines/species_signature_moments | 8346 | 631b0272076d9ef5 |
| major_trainers | 214 | 6b9e48a1fe623c89 |
| milestones | 135 | 7e5f1343f7c9368a |
| move_mastery_ideas | 123 | 0972e7ca634f6dd9 |
| personalities | 58 | dd501e313739e3fd |
| quirks | 54 | 83f9367620d8d50d |
| relationship_types | 53 | 1e66a4764c9019c0 |
| run_titles | 59 | 1ea120c8862dc573 |
| signature_moments_library | 157 | f6be9577197515a9 |
| team_chemistry | 185 | 50634f806f9645f3 |
| titles | 121 | d558dfde79887b0a |
| trainer_archetypes | 250 | e326b561c9684050 |

## Fixes made on import

| Fix | Count | Example |
| --- | --- | --- |
| "Stick" pairing removed (the item is the Leek, already listed) | 2 | cur-99 |
| "a" before a vowel changed to "an" | 79 | Electric Memory turns Silvally into a Electric type and Multi-Attack follows. |
| "pouring over" spelling fixed to "poring over" | 1 |  |
| Z-Crystal text corrected (it was written as an Arceus plate) | 17 | Buginium Z |
| cross-run entry switched off | 2 | M-VETERAN |
| fan-made item removed (not a real item) | 2 | Crucibellite |
| gendered word in a moment made neutral | 1 | champion-throne |
| reaction context spelling unified | 108 | rain-start -> rain |
| sentence after a full stop now starts with a capital | 622 | Whoa, that hurt, but we're still going! my best friend gave us luck! I didn't spend years racing eve |
| trainer lines: "his"/"her" changed to "my" | 16 | Tell me you're having fun, too! There is loving his brother, and there is big dreams. I keep both. L |
| trainer lines: line from a broken template removed | 393 | It's glowing?! Since when?! That's the stuff taunting rivals dreams are made of. Obviously! |
| trainer trait made first-person ("his brother" -> "my brother") | 2 | loving his brother |
| trainer type renamed (director, 2026-11-06) | 2 | Necromancer -> Spirit Caller |

## Names the game does not have (yet)

**item_synergies items not in the game** (46): Ability Capsule, Ability Shield, Adamant Crystal, Aloraichium Z, Blunder Policy, Booster Energy, Bottle Cap, Chipped Pot, Clear Amulet, Cornerstone Mask, Covert Cloak, Decidium Z, Eevium Z, Eject Pack, Griseous Core, Hearthflame Mask, Heavy-Duty Boots, Incinium Z, Kommonium Z, Loaded Dice, Luminous Moss, Lunalium Z, Lustrous Globe, Lycanium Z, Marshadium Z, Masterpiece Teacup, Mewnium Z, Mimikium Z, Pikanium Z, Pikashunium Z, Primarium Z, Protective Pads, Punching Glove, Room Service, Rusted Shield, Rusted Sword, Snorlium Z, Snowball, Solganium Z, Tapunium Z, Terrain Extender, Throat Spray, Ultranecrozium Z, Utility Umbrella, Weakness Policy, Wellspring Mask

**item_synergies species partners** (30): Kommo-o-Totem, Magearna-Original, Marowak-Alola-Totem, Meowstic-F, Mimikyu-Busted-Totem, Mimikyu-Totem, Necrozma-Dawn-Wings, Necrozma-Dusk-Mane, Ogerpon-Cornerstone, Ogerpon-Hearthflame, Ogerpon-Wellspring, Pikachu-Alola, Pikachu-Belle, Pikachu-Cosplay, Pikachu-Hoenn, Pikachu-Kalos, Pikachu-Libre, Pikachu-Original, Pikachu-Partner, Pikachu-PhD, Pikachu-Pop-Star, Pikachu-Rock-Star, Pikachu-Sinnoh, Pikachu-Starter, Pikachu-Unova, Pikachu-World, Poltchageist-Artisan, Sinistea-Antique, Tatsugiri-Droopy, Tatsugiri-Stretchy

**major_trainers without a game boss** (13): Brandon, Burnet, Cassiopeia, Clavell, Cyrano, Florian, Gold, Greta, Juliana, Magnolia, Spenser, Steven Stone, Tucker

