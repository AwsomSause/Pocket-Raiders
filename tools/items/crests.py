"""Item rework part 4 (Kice 2026-11-07: "all items that aren't implemented need implementation"):
the 67 Crest pictures in images/items/library become working held items.

A Crest is held by one species line: its two best stats (not HP) are multiplied by 1.2. Uncommon, so
Stage II (1.3x, rare) and Stage III (1.4x, epic) come from core/itemStages.ts. Run: python3 tools/items/crests.py
"""
import json, os

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CAT = os.path.join(REPO, 'src/data/itemCatalog.json')
SPECIES = {s['id']: s for s in json.load(open(os.path.join(REPO, 'src/data/species.json')))}
LABEL = {'atk': 'Attack', 'def': 'Defense', 'spa': 'Sp. Atk', 'spd': 'Sp. Def', 'spe': 'Speed'}
# picture name -> species the crest is made for (Pokémon Rejuvenation naming)
CRESTS = {
    'aeamphcrest': 'ampharos', 'ariacrest': 'ariados', 'bastcrest': 'bastiodon', 'behecrest': 'beheeyem', 'boltcrest': 'boltund',
    'castcrest': 'castform', 'celecrest': 'celebi', 'chercrest': 'cherrim', 'cinccrest': 'cinccino', 'claycrest': 'claydol',
    'cofcrest': 'cofagrigus', 'crabcrest': 'crabominable', 'crycrest': 'cryogonal', 'darmcrest': 'darmanitan', 'dedecrest': 'dedenne',
    'delcrest': 'delcatty', 'druddicrest': 'druddigon', 'duskcrest': 'dusknoir', 'eleccrest': 'electrode', 'empcrest': 'empoleon',
    'enteicrest': 'entei', 'fearcrest': 'fearow', 'feracrest': 'feraligatr', 'flygoncrest': 'flygon', 'furrcrest': 'furret',
    'glaccrest': 'glaceon', 'gothcrest': 'gothitelle', 'hypcrest': 'hypno', 'infcrest': 'infernape', 'leafcrest': 'leafeon',
    'ledicrest': 'ledian', 'luvcrest': 'luvdisc', 'luxcrest': 'luxray', 'magcrest': 'magcargo', 'megcrest': 'meganium',
    'minuncrest': 'minun', 'noccrest': 'noctowl', 'oricrest': 'oricorio', 'phionecrest': 'phione', 'pluslecrest': 'plusle',
    'pourcrest': 'simipour', 'probocrest': 'probopass', 'raicrest': 'raikou', 'rampcrest': 'rampardos', 'relicrest': 'relicanth',
    'reunicrest': 'reuniclus', 'sagecrest': 'simisage', 'samucrest': 'samurott', 'sawscrest': 'sawsbuck', 'searcrest': 'simisear',
    'sevcrest': 'seviper', 'shiincrest': 'shiinotic', 'silvcrest': 'silvally', 'skuncrest': 'skuntank', 'spiritcrest': 'spiritomb',
    'stantcrest': 'stantler', 'suicrest': 'suicune', 'sunfloracrest': 'sunflora', 'swacrest': 'swalot', 'thievcrest': 'thievul',
    'torcrest': 'torterra', 'typhcrest': 'typhlosion', 'unowncrest': 'unown', 'vespicrest': 'vespiquen', 'whiscrest': 'whiscash',
    'zangcrest': 'zangoose', 'zorocrest': 'zoroark',
}


def line(sid):
    """The species and everything it evolves from."""
    out = [sid]
    while SPECIES[out[-1]].get('evolvesFrom') and SPECIES[out[-1]]['evolvesFrom'] in SPECIES:
        out.append(SPECIES[out[-1]]['evolvesFrom'])
    return list(reversed(out))


data = json.load(open(CAT))
have = {e['id'] for e in data}
added = 0
for pic, sid in CRESTS.items():
    sp = SPECIES[sid]
    iid = f'{sid}-crest'
    if iid in have:
        continue
    bs = sp['baseStats']
    top = sorted(LABEL, key=lambda s: (-bs[s], list(LABEL).index(s)))[:2]
    fam = line(sid)
    who = sp['name'] if len(fam) == 1 else f"{sp['name']} and its family"
    data.append({
        'id': iid, 'name': f"{sp['name']} Crest", 'family': 'Crests (species held)',
        'description': f"{who}: {LABEL[top[0]]} and {LABEL[top[1]]} x1.2",
        'rarity': 'uncommon', 'stacksOn': 'pokemon', 'max': 1, 'how': 'held', 'icon': f'library/{pic}', 'status': 'supported',
        'effect': {'kind': 'held', 'hooks': [{'hook': 'stat', 'stat': s, 'multiplier': 1.2, 'species': fam} for s in top]},
    })
    added += 1
open(CAT, 'w').write(json.dumps(data, indent=1, ensure_ascii=False) + '\n')
print(added, 'crests added')
