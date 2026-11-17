"""Menu icons for every Jet species: the front picture shrunk to a 32x32 one-frame atlas (icons/custom/<id>.png + .json).
Run from the repo root:  python3 tools/jet/make-jet-icons.py
Without this the new Pokémon borrowed another species' icon in the party, map and lists."""
import json, os
from PIL import Image

ROOT = 'public/assets/images/pokemon'
species = json.load(open('src/data/jetSpecies.json'))['species']
out = os.path.join(ROOT, 'icons', 'custom')
os.makedirs(out, exist_ok=True)
for s in species:
    sid = s['id']
    base = os.path.join(ROOT, s['assets']['sprite'])
    atlas = json.load(open(base + '.json'))
    fr = sorted(atlas['textures'][0]['frames'], key=lambda f: f['filename'])[0]['frame']
    sheet = Image.open(base + '.png').convert('RGBA')
    im = sheet.crop((fr['x'], fr['y'], fr['x'] + fr['w'], fr['y'] + fr['h']))
    box = im.getchannel('A').getbbox()
    if box:
        im = im.crop(box)
    k = min(30 / im.width, 30 / im.height)
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    canvas = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    canvas.paste(im, ((32 - im.width) // 2, 31 - im.height), im)
    canvas.save(os.path.join(out, f'{sid}.png'), optimize=True)
    json.dump({'textures': [{'image': f'{sid}.png', 'format': 'RGBA8888', 'size': {'w': 32, 'h': 32}, 'scale': 1, 'frames': [{'filename': '0001.png', 'rotated': False, 'trimmed': False, 'sourceSize': {'w': 32, 'h': 32}, 'spriteSourceSize': {'x': 0, 'y': 0, 'w': 32, 'h': 32}, 'frame': {'x': 0, 'y': 0, 'w': 32, 'h': 32}}]}], 'meta': {'app': 'tools/jet/make-jet-icons.py'}}, open(os.path.join(out, f'{sid}.json'), 'w'))
print(f'Made {len(species)} icons.')
