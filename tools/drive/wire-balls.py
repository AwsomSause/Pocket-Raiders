"""P6: 25 Nature Balls, 6 Training (EV) Balls and 3 Tera Jewels from images/items/library.

  python3 -I tools/drive/wire-balls.py <repo>
Balls are Bag items (items.json, category ball) that catch like a Great Ball (x1.2) and shape the caught Pokémon
(core/run.ts: ball.nature / ball.stat); each also has a catalog entry so it can turn up in reward drafts.
Re-running replaces the ids listed in tools/drive/ball-items.json.
"""
import json
import os
import sys

R = sys.argv[1]
NATURES = 'adamant bashful bold brave calm careful docile gentle hardy hasty impish jolly lax lonely mild modest naive naughty quiet quirky rash relaxed sassy serious timid'.split()
STATS = {'hp': 'HP', 'atk': 'Attack', 'def': 'Defense', 'spa': 'Sp. Atk', 'spd': 'Sp. Def', 'spe': 'Speed'}
EVPIC = {'hp': 'hpevball', 'atk': 'atkevball', 'def': 'defevball', 'spa': 'spaevball', 'spd': 'spdevball', 'spe': 'speevball'}

bag, cat = [], []


def ball(id_, name, desc, pic, effect, rarity):
    bag.append(dict(id=id_, name=name, description=desc, category='ball', iconAssetId=f'item.library/{pic}', usableInBattle=True, usableOutside=False, target='enemy', effect=effect))
    cat.append(dict(id=f'{id_}-pack', name=f'{name} x3', family='Capture and party items', description=f'Three {name}s for your Bag. {desc}', rarity=rarity, stacksOn='player', max=None, how='use', icon=f'library/{pic}', status='supported', effect={'kind': 'bagItem', 'item': id_, 'count': 3}))


for n in NATURES:
    ball(f'{n}-ball', f'{n.title()} Ball', f'Catches like a Great Ball; the caught Pokémon has the {n.title()} nature.', f'{n}ball', {'kind': 'catch', 'multiplier': 1.2, 'nature': n}, 'uncommon')
for s, label in STATS.items():
    ball(f'{s}-training-ball', f'{label} Training Ball', f'Catches like a Great Ball; the caught Pokémon starts with +5% {label}.', EVPIC[s], {'kind': 'catch', 'multiplier': 1.2, 'stat': {'stat': s, 'percent': 5}}, 'rare')

jewels = [('masterterajewel', 'master-tera-jewel', 'Master Tera Jewel', 'Changes a Pokémon\'s Tera Type to its second type (its first if it has one type)', 'secondary', 'epic'),
          ('radiantterajewel', 'radiant-tera-jewel', 'Radiant Tera Jewel', "Changes a Pokémon's Tera Type to its first type", 'primary', 'rare'),
          ('mysteryterajewel', 'mystery-tera-jewel', 'Mystery Tera Jewel', "Changes a Pokémon's Tera Type to a random type", 'random', 'uncommon')]
for pic, id_, name, desc, mode, rarity in jewels:
    cat.append(dict(id=id_, name=name, family='Tera Jewels', description=desc, rarity=rarity, stacksOn='pokemon', max=None, how='use', icon=f'library/{pic}', status='supported', effect={'kind': 'teraType', 'mode': mode}))

items_p, cat_p, ids_p = f'{R}/src/data/items.json', f'{R}/src/data/itemCatalog.json', f'{R}/tools/drive/ball-items.json'
old = set(json.load(open(ids_p))) if os.path.exists(ids_p) else set()
items = [e for e in json.load(open(items_p, encoding='utf-8')) if e['id'] not in old]
catalog = [e for e in json.load(open(cat_p, encoding='utf-8')) if e['id'] not in old]
taken = {e['id'] for e in items} | {e['id'] for e in catalog}
lib = {f[:-4] for f in os.listdir(f'{R}/public/assets/images/items/library')}
for e in bag + cat:
    pic = (e.get('icon') or e['iconAssetId']).split('/')[-1]
    if e['id'] in taken or pic not in lib:
        sys.exit(f"{e['id']}: exists or no picture {pic}")
# append as text so the hand-formatted files keep their layout
for path, new, base in [(items_p, bag, items), (cat_p, cat, catalog)]:
    text = open(path, encoding='utf-8').read().rstrip()
    assert text.endswith(']')
    if old:
        sys.exit('re-run: restore the files with git first')
    add = ',\n'.join(json.dumps(e, indent=1, ensure_ascii=False).replace('\n', '\n ') for e in new)
    open(path, 'w', encoding='utf-8').write(text[:-1].rstrip() + ',\n ' + add + '\n]\n')
open(ids_p, 'w').write(json.dumps(sorted(e['id'] for e in bag + cat), indent=1) + '\n')
print(len(bag), 'balls,', len(cat), 'catalog entries')
