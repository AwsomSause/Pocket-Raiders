"""Batch B of "give every remaining picture a use": held gear, rings and charms for battle.

  python3 -I tools/drive/wire-library3-gear.py <repo>
New effects used: `megaStoneGift` (Keystone, Mega Charm: hands you the Mega Stone of a party member) and `teamTrain` (IV Charms).
"""
import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wire3_common.py')).read())

F = 'Battle gear (Drive pack 3)'
hk = lambda *h: held(*h)
# ---- policies, blades, wings and manes ----
add('adrenalineorb', 'adrenaline-orb-2', 'Adrenaline Orb Mk II', F, "Wild Pokémon call for help more for 8 turns of the next battle, and the holder gets +1 Speed", 'uncommon', P, 3, 'use', boost({'kind': 'sos', 'turns': 8}, stage('spe', 1)))
add('aegispolicy', 'aegis-policy', 'Aegis Policy', F, 'Super-effective hits do 12% less damage to the holder', 'rare', P, 2, 'held', hk({'hook': 'damageTaken', 'percent': -12, 'superEffective': True}))
add('autowinpolicy', 'auto-win-policy', 'Auto-Win Policy', F, "The holder's chance to hang on at 1 HP is tripled", 'epic', P, 1, 'held', hk({'hook': 'endure', 'multiplier': 3}))
add('allensword', 'allens-sword', "Allen's Sword", F, 'Steel and Fighting moves of the holder do 15% more', 'rare', P, 1, 'held', hk(tp(['steel', 'fighting'], 15)))
add('amplifieldrock', 'amplifield-rock', 'Amplifield Rock', F, 'Terrains the holder sets last 3 turns longer', 'uncommon', P, 1, 'held', hk({'hook': 'terrainExtender', 'turns': 3}))
add('ancientwing', 'ancient-wing', 'Ancient Wing', F, 'Flying and Dragon moves of the holder do 15% more', 'uncommon', P, 2, 'held', hk(tp(['flying', 'dragon'], 15)))
add('baton', 'baton', 'Baton', F, 'When hit, the holder switches out (one use per battle)', 'uncommon', P, 1, 'held', hk({'hook': 'ejectButton'}))
add('blackmanehair', 'black-mane-hair', 'Black Mane Hair', F, 'Ghost and Dark moves of the holder do 15% more', 'rare', P, 1, 'held', hk(tp(['ghost', 'dark'], 15)))
add('whitemanehair', 'white-mane-hair', 'White Mane Hair', F, 'Ice and Psychic moves of the holder do 15% more', 'rare', P, 1, 'held', hk(tp(['ice', 'psychic'], 15)))
add('blankplate', 'blank-plate', 'Blank Plate', F, 'Normal moves of every team member do 10% more', 'uncommon', T, 1, 'held', hk(tp(['normal'], 10)))
add('legendplate', 'legend-plate', 'Legend Plate', F, 'Every move of every team member does 5% more', 'epic', T, 1, 'held', hk(tp(ALL, 5)))
add('blkprism', 'black-prism', 'Black Prism', F, "The holder's critical-hit stage goes up by 1", 'rare', P, 1, 'held', hk({'hook': 'crit', 'stages': 1}))
add('cellimprint', 'cell-imprint', 'Cell Imprint', F, 'The holder heals 10% of the damage it deals', 'rare', P, 1, 'held', hk({'hook': 'drain', 'percent': 10}))
add('commonstone', 'common-stone', 'Common Stone', F, 'The holder gets 10% more EXP', 'common', P, 3, 'held', hk({'hook': 'exp', 'multiplier': 1.1}))
add('intriguingstone', 'intriguing-stone', 'Intriguing Stone', F, 'The holder gets 25% more EXP', 'uncommon', P, 2, 'held', hk({'hook': 'exp', 'multiplier': 1.25}))
add('cursedcandle', 'cursed-candle', 'Cursed Candle', F, 'Ghost and Fire moves of the holder do 15% more', 'uncommon', P, 2, 'held', hk(tp(['ghost', 'fire'], 15)))
add('darchmirror', 'darch-mirror', "Darch's Mirror", F, 'Copies the stat boosts an opponent just got, once per battle', 'rare', P, 1, 'held', hk({'hook': 'mirrorHerb'}))
add('mirrorsprig', 'mirror-sprig', 'Mirror Sprig', F, "Opponents can't lower the holder's stats", 'rare', P, 1, 'held', hk({'hook': 'clearAmulet'}))
add('darkmatter', 'dark-matter', 'Dark Matter', F, 'Dark, Ghost and Dragon moves of the holder do 12% more', 'epic', P, 1, 'held', hk(tp(['dark', 'ghost', 'dragon'], 12)))
add('hauntedchalice', 'haunted-chalice', 'Haunted Chalice', F, 'Ghost types heal 1/8 a turn; others lose 1/16', 'rare', P, 1, 'held', hk({'hook': 'endTurn', 'fraction': 0.125, 'typed': 'ghost', 'otherwise': -0.0625}))
add('hiddenorb', 'hidden-orb', 'Hidden Orb', F, 'The holder dodges 8% more attacks', 'uncommon', P, 2, 'held', hk({'hook': 'evasion', 'percent': 8}))
add('lenscase', 'lens-case', 'Lens Case', F, "The holder's accuracy goes up 10% and its critical-hit stage by 1", 'rare', P, 1, 'held', hk({'hook': 'accuracy', 'percent': 10}, {'hook': 'crit', 'stages': 1}))
add('metabreakeramulet', 'metabreaker-amulet', 'Metabreaker Amulet', F, 'Super-effective moves of the holder do 20% more', 'rare', P, 1, 'held', hk({'hook': 'superPower', 'percent': 20}))
add('moselysbeanie', 'mosely-beanie', "Mosely's Beanie", F, 'The holder grows fond of you 100% faster', 'uncommon', P, 2, 'held', hk({'hook': 'friendship', 'percent': 100}))
add('robocloak', 'robo-cloak', 'Robo Cloak', F, "The holder's Defense and Sp. Def go up 10%", 'rare', P, 1, 'held', hk(stat('def', 1.1), stat('spd', 1.1)))
add('ultramemory', 'ultra-memory', 'Ultra Memory', F, 'Every stat of the holder goes up 5%', 'epic', P, 1, 'held', hk(stat('all', 1.05)))
add('glitchmemory', 'glitch-memory', 'Glitch Memory', F, 'One random stat of the holder goes up 20%', 'rare', P, 1, 'held', hk({'hook': 'randomStat', 'percent': 20}))
add('resistorcharm', 'resistor-charm', 'Resistor Charm', F, 'The holder takes 8% less damage', 'uncommon', P, 3, 'held', hk({'hook': 'damageTaken', 'percent': -8}))
add('stabcharm', 'stab-charm', 'STAB Charm', F, 'Every move of the holder does 8% more', 'uncommon', P, 3, 'held', hk({'hook': 'power', 'percent': 8}))
add('disablecharm', 'disable-charm', 'Disable Charm', F, 'The holder shrugs off 25% of status effects', 'uncommon', P, 2, 'held', hk({'hook': 'statusShield', 'percent': 25}))
add('inverse-ribbon', 'inverse-ribbon', 'Inverse Ribbon', F, 'Super-effective moves of the holder do 10% more', 'rare', P, 2, 'held', hk({'hook': 'superPower', 'percent': 10}))
add('flip-stats-ribbon', 'flip-stats-ribbon', 'Flip Stats Ribbon', F, "The holder's Attack and Sp. Atk go up 8%", 'rare', P, 2, 'held', hk(stat('atk', 1.08), stat('spa', 1.08)))
add('fresh-start-ribbon', 'fresh-start-ribbon', 'Fresh Start Ribbon', F, 'The holder gets 30% more EXP', 'rare', P, 1, 'held', hk({'hook': 'exp', 'multiplier': 1.3}))
add('mystemblem', 'myst-emblem', 'Myst Emblem', F, 'Every stat of the holder goes up 8%', 'epic', P, 1, 'held', hk(stat('all', 1.08)))
add('xenemblem', 'xen-emblem', 'Xen Emblem', F, 'Every move of the holder does 10% more', 'epic', P, 1, 'held', hk(tp(ALL, 10)))
add('zbooster', 'z-booster', 'Z Booster', F, 'Your whole team gets +1 Attack and +1 Sp. Atk for 8 turns of its next battle', 'rare', T, 3, 'use', boost(stage('atk', 1), stage('spa', 1)))
add('zsplicer', 'z-splicer', 'Z Splicer', F, 'Super-effective moves of the holder do 15% more', 'rare', P, 1, 'held', hk({'hook': 'superPower', 'percent': 15}))
add('interceptz', 'intercept-z', 'Interceptor Z', F, 'The holder gets the first move more often', 'epic', P, 1, 'held', hk({'hook': 'dodgeFirst'}))
add('interceptorwish', 'interceptor-wish', 'Interceptor Wish', F, 'Revives fainted Pokémon with half HP and heals the whole team 50%', 'rare', T, None, 'use', tcare(revive=0.5, heal=0.5))
# ---- seeds ----
add('elementalseed', 'elemental-seed', 'Elemental Seed', F, 'Electric Terrain: the holder gets +1 Sp. Def', 'uncommon', P, 1, 'held', hk({'hook': 'terrainSeed', 'terrain': 'electric', 'stat': 'spd', 'stages': 1}))
add('magicalseed', 'magical-seed', 'Magical Seed', F, 'Psychic Terrain: the holder gets +1 Defense', 'uncommon', P, 1, 'held', hk({'hook': 'terrainSeed', 'terrain': 'psychic', 'stat': 'def', 'stages': 1}))
add('syntheticseed', 'synthetic-seed', 'Synthetic Seed', F, 'Grassy Terrain: the holder gets +1 Sp. Def', 'uncommon', P, 1, 'held', hk({'hook': 'terrainSeed', 'terrain': 'grassy', 'stat': 'spd', 'stages': 1}))
add('telluricseed', 'telluric-seed', 'Telluric Seed', F, 'Misty Terrain: the holder gets +1 Defense', 'uncommon', P, 1, 'held', hk({'hook': 'terrainSeed', 'terrain': 'misty', 'stat': 'def', 'stages': 1}))
add('reviver-seed', 'reviver-seed', 'Reviver Seed', F, 'Revives a fainted Pokémon with 40% HP and cures its status', 'uncommon', P, None, 'use', care(revive=0.4, cure=True))
# ---- Mega, Z, Dynamax, Tera ----
G = 'Transformation items (Drive pack 3)'
add('megaring', 'mega-ring-2', 'Mega Bracer', G, 'Goes in your Bag: Pokémon holding their Mega Stone can Mega Evolve (like the Mega Ring)', 'epic', Y, 1, 'use', {'kind': 'bagItem', 'item': 'mega-ring', 'count': 1})
add('megacuff', 'mega-cuff', 'Mega Cuff', G, 'Goes in your Bag: Pokémon holding their Mega Stone can Mega Evolve (like the Mega Ring)', 'epic', Y, 1, 'use', {'kind': 'bagItem', 'item': 'mega-ring', 'count': 1})
add('zpowerring', 'z-power-ring', 'Z-Power Ring', G, 'Goes in your Bag: lets a Z-Crystal turn a move into its Z-Move once per battle (like the Z-Ring)', 'epic', Y, 1, 'use', {'kind': 'bagItem', 'item': 'z-ring', 'count': 1})
add('dynamaxcrystal', 'dynamax-crystal', 'Dynamax Crystal', G, 'Goes in your Bag: lets one Pokémon Dynamax once per battle (like the Dynamax Band)', 'epic', Y, 1, 'use', {'kind': 'bagItem', 'item': 'dynamax-band', 'count': 1})
add('dynamaxinhibitor', 'dynamax-inhibitor', 'Dynamax Inhibitor', G, 'The holder takes 15% less damage from wild Pokémon', 'rare', P, 2, 'held', hk({'hook': 'damageTaken', 'percent': -15, 'fromWild': True}))
add('keystone', 'keystone', 'Keystone', G, 'Hands you the Mega Stone of every party Pokémon that can Mega Evolve (and a Mega Ring if you have none)', 'epic', Y, 1, 'use', {'kind': 'megaStoneGift', 'all': True})
add('megacharm', 'mega-charm', 'Mega Charm', G, "Hands you the Mega Stone of the first party Pokémon that can Mega Evolve and has none yet", 'rare', Y, 3, 'use', {'kind': 'megaStoneGift', 'all': False})
add('stellarterashard', 'stellar-tera-shard', 'Stellar Tera Shard', G, "Gives a Pokémon a random new Tera Type", 'rare', P, 3, 'use', {'kind': 'teraType', 'mode': 'random'})
# ---- IV charms and ability items ----
H = 'IV and ability items (Drive pack 3)'
add('ivcharm', 'iv-charm', 'IV Charm', H, "Hyper trains the lowest IV of every Pokémon in your party (it counts as 31)", 'epic', T, 2, 'use', {'kind': 'teamTrain', 'mode': 'lowest'})
add('ivcharm-2', 'iv-charm-2', 'IV Charm II', H, 'Hyper trains every IV of every Pokémon in your party (they count as 31)', 'epic', T, 1, 'use', {'kind': 'teamTrain', 'mode': 'all'})
add('ability-charm', 'ability-charm', 'Ability Charm', H, 'Swaps a Pokémon between its normal abilities (needs two)', 'uncommon', P, 2, 'use', {'kind': 'ability', 'mode': 'swap'})
add('abilityvial', 'ability-vial', 'Ability Vial', H, 'Gives a Pokémon its hidden ability', 'rare', P, 1, 'use', {'kind': 'ability', 'mode': 'hidden'})
finish('gear')
