"""Lists item-library pictures no catalog item or reward uses yet.  python3 -I tools/drive/library-report.py <repo>"""
import json
import os
import sys

R = sys.argv[1]
import glob
catalog = json.load(open(f'{R}/src/data/itemCatalog.json', encoding='utf-8'))
for f in glob.glob(f'{R}/src/data/itemCatalog/*.json'):
    catalog += json.load(open(f, encoding='utf-8'))
used = {e['icon'].split('/')[-1] for e in catalog if (e.get('icon') or '').startswith('library/')}
used |= {e['iconAssetId'].split('/')[-1] for e in json.load(open(f'{R}/src/data/rewards.json', encoding='utf-8')) if e['iconAssetId'].startswith('item.library/')}
lib = sorted(f[:-4] for f in os.listdir(f'{R}/public/assets/images/items/library'))
left = [n for n in lib if n not in used]
print(f'{len(lib) - len(left)} of {len(lib)} library pictures wired; {len(left)} left:')
print(' '.join(left))
