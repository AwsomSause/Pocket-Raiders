"""Import every item sprite from Kice's local pack folder into public/assets/images/items/library/.
Input: a folder holding the unzipped candidate sprites (one sub-folder per pack). Skips any item whose
name already has a picture in images/items, images/items/gen5 or images/pokeball. One picture per item name,
chosen by pack priority. BMP files named .png are converted to real PNGs. Writes tools/drive/item-library.json."""
import os, re, sys, json, hashlib
from PIL import Image
SRC, REPO = sys.argv[1], os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = f'{REPO}/public/assets/images/items/library'
def norm(s): return re.sub(r'[^a-z0-9]', '', os.path.splitext(s)[0].lower())
have = set()
for d in ('items', 'items/gen5', 'pokeball'):
    p = f'{REPO}/public/assets/images/{d}'
    have |= {norm(f) for f in os.listdir(p) if f.endswith('.png')}
PRIO = [('Graphics-', 'Items', 'Fan-game Graphics pack (Graphics/Items)'), ('Graphics-', 'Icons/Item', 'Fan-game Graphics pack (Graphics/Icons/Item)'),
        ('Pokemon-Decades', 'Items', 'Pokémon Decades (Graphics/Items)'), ('Pokemon-Essentials', 'Items', 'Pokémon Essentials + EBDX (Graphics/Items)'),
        ('LmigisNature', 'Items', 'LmigisNatureAndStatBalls'), ('pokerogue', 'items', 'PokeRogue assets beta (images/items)')]
files = []
for r, _, fs in os.walk(SRC):
    for f in fs:
        if f.lower().endswith(('.png', '.gif')):
            p = os.path.join(r, f); rel = os.path.relpath(p, SRC).replace(os.sep, '/')
            for i, (top, sub, label) in enumerate(PRIO):
                if rel.startswith(top) and ('/' + sub + '/') in '/' + os.path.dirname(rel) + '/' and not (sub == 'Items' and 'Not in PBS' in rel and False):
                    files.append((i, 0 if 'Not in PBS' not in rel else 1, rel, p, label)); break
files.sort(key=lambda x: (x[0], x[1], x[2]))
SKIP = {'000', 'back'}; os.makedirs(OUT, exist_ok=True)
done, prov, skipped = {}, [], 0
for _, _, rel, p, label in files:
    k = norm(os.path.basename(rel))
    if k in SKIP: continue
    if k in have or k in done: skipped += 1; continue
    name = re.sub(r'[^a-z0-9]+', '-', os.path.splitext(os.path.basename(rel))[0].lower()).strip('-')
    im = Image.open(p); im.load(); im = im.convert('RGBA')
    im.save(f'{OUT}/{name}.png', optimize=True)
    done[k] = name; prov.append({'file': f'images/items/library/{name}.png', 'source': label, 'original': rel.split('/', 1)[1], 'size': list(im.size)})
json.dump(prov, open(f'{REPO}/tools/drive/item-library.json', 'w'), indent=1, ensure_ascii=False)
print('imported', len(done), 'skipped dup/existing', skipped)
