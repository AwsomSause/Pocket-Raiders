"""P5: catalog items for the held-item hooks added in core/battle/held.ts (Weakness Policy ... Terrain Extender), Ability Shield and the Ability Capsule and Patch (Bottle Caps need IVs, which the game does not have: not built).

  python3 -I tools/drive/wire-held-hooks.py <repo>
Re-running replaces the ids listed in tools/drive/held-hooks-items.json. Pictures come from images/items/library.
"""
import json
import os
import sys

R = sys.argv[1]
P, Y = 'pokemon', 'player'
items = []


def add(pic, id_, name, fam, desc, rarity, stacks, mx, how, effect):
    items.append(dict(id=id_, name=name, family=fam, description=desc, rarity=rarity, stacksOn=stacks, max=mx, how=how, icon=f'library/{pic}', status='supported', effect=effect))


held = lambda *h: {'kind': 'held', 'hooks': list(h)}
H = lambda n, **kw: {'hook': n, **kw}
F = 'Battle held items (newer games)'
PARADOX = 'great-tusk scream-tail brute-bonnet flutter-mane slither-wing sandy-shocks roaring-moon walking-wake gouging-fire raging-bolt iron-treads iron-bundle iron-hands iron-jugulis iron-moth iron-thorns iron-valiant iron-leaves iron-boulder iron-crown koraidon miraidon espeon-paradox umbreon-paradox toxtricity-future toxtricity-past'.split()
add('weaknesspolicy', 'weakness-policy', 'Weakness Policy', F, 'Hit by a super-effective move: +2 Attack and +2 Sp. Atk, once per battle', 'rare', P, 1, 'held', held(H('weaknessPolicy')))
add('blunderpolicy', 'blunder-policy', 'Blunder Policy', F, 'After one of its moves misses: +2 Speed, once per battle', 'uncommon', P, 1, 'held', held(H('blunderPolicy')))
add('throatspray', 'throat-spray', 'Throat Spray', F, 'After it uses a sound move: +1 Sp. Atk, once per battle', 'uncommon', P, 1, 'held', held(H('throatSpray')))
add('ejectpack', 'eject-pack', 'Eject Pack', F, 'When an opponent lowers its stats, it switches out (once per battle)', 'uncommon', P, 1, 'held', held(H('ejectPack')))
add('roomservice', 'room-service', 'Room Service', F, 'While Trick Room is up: -1 Speed, once per battle', 'uncommon', P, 1, 'held', held(H('roomService')))
add('boosterenergy', 'booster-energy', 'Booster Energy', F, 'Paradox Pokémon only: +1 to its best stat when it comes in, once per battle', 'rare', P, 1, 'held', held(H('boosterEnergy', species=PARADOX)))
add('mirrorherb', 'mirror-herb', 'Mirror Herb', F, 'Copies the stat boosts an opponent just got, once per battle', 'uncommon', P, 1, 'held', held(H('mirrorHerb')))
add('covertcloak', 'covert-cloak', 'Covert Cloak', F, 'Added effects of moves (status, flinch, stat drops) never hit the holder', 'rare', P, 1, 'held', held(H('covertCloak')))
add('clearamulet', 'clear-amulet', 'Clear Amulet', F, "Opponents can't lower the holder's stats", 'rare', P, 1, 'held', held(H('clearAmulet')))
add('loadeddice', 'loaded-dice', 'Loaded Dice', F, 'Multi-hit moves hit at least 4 times', 'rare', P, 1, 'held', held(H('loadedDice')))
add('punchingglove', 'punching-glove', 'Punching Glove', F, "Punching moves hit 10% harder and don't make contact", 'uncommon', P, 1, 'held', held(H('punchingGlove', percent=10)))
add('protectivepads', 'protective-pads', 'Protective Pads', F, "The holder's moves never make contact (Rocky Helmet and friends don't trigger)", 'uncommon', P, 1, 'held', held(H('protectivePads')))
add('heavydutyboots', 'heavy-duty-boots', 'Heavy-Duty Boots', F, "Entry hazards (Spikes, Stealth Rock, Sticky Web) don't hurt the holder", 'rare', P, 1, 'held', held(H('heavyDutyBoots')))
add('utilityumbrella', 'utility-umbrella', 'Utility Umbrella', F, "Weather doesn't help, weaken or hurt the holder or its moves", 'uncommon', P, 1, 'held', held(H('utilityUmbrella')))
add('terrainextender', 'terrain-extender', 'Terrain Extender', F, 'Terrain the holder sets lasts 3 more turns', 'uncommon', P, 1, 'held', held(H('terrainExtender', turns=3)))
add('abilityshield', 'ability-shield', 'Ability Shield', F, "The holder's ability can't be ignored (Mold Breaker) or changed by opponents", 'rare', P, 1, 'held', held(H('abilityShield')))
F2 = 'Ability items'
add('abilitycapsule', 'ability-capsule', 'Ability Capsule', F2, 'Swaps a Pokémon between its normal abilities (needs two)', 'rare', P, None, 'use', {'kind': 'ability', 'mode': 'swap'})
add('abilitypatch', 'ability-patch', 'Ability Patch', F2, 'Gives a Pokémon its hidden ability', 'epic', P, None, 'use', {'kind': 'ability', 'mode': 'hidden'})
cat_p, ids_p = f'{R}/src/data/itemCatalog.json', f'{R}/tools/drive/held-hooks-items.json'
old = set(json.load(open(ids_p))) if os.path.exists(ids_p) else set()
cat = [e for e in json.load(open(cat_p, encoding='utf-8')) if e['id'] not in old]
taken = {e['id'] for e in cat}
lib = {f[:-4] for f in os.listdir(f'{R}/public/assets/images/items/library')}
for e in items:
    if e['id'] in taken:
        sys.exit(f"{e['id']} exists")
    if e['icon'].split('/')[1] not in lib:
        sys.exit('no picture ' + e['icon'])
open(cat_p, 'w', encoding='utf-8').write(json.dumps(cat + items, indent=1, ensure_ascii=False) + '\n')
open(ids_p, 'w').write(json.dumps(sorted(e['id'] for e in items), indent=1) + '\n')
print(len(items), 'items')
