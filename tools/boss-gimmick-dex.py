#!/usr/bin/env python3
"""Builds the boss gimmick dex (one self-contained HTML) from the JSON of tools/build-boss-gimmick-dex.ts.
   python3 -I tools/boss-gimmick-dex.py <dex.json> <out.html>"""
import base64, io, json, sys
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
assets = root / 'public/assets/images'
data = json.load(open(sys.argv[1]))

def first_frame(png: Path, js: Path | None):
    im = Image.open(png).convert('RGBA')
    if js and js.exists():
        j = json.load(open(js))
        frames = j['textures'][0]['frames'] if 'textures' in j else j['frames']
        f0 = frames[0] if isinstance(frames, list) else next(iter(frames.values()))
        fr = f0['frame']
        im = im.crop((fr['x'], fr['y'], fr['x'] + fr['w'], fr['y'] + fr['h']))
    bb = im.getbbox()
    if bb: im = im.crop(bb)
    if im.height > 110:
        k = 110 / im.height
        im = im.resize((max(1, round(im.width * k)), 110), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode(), im.width, im.height

sprites = {}
for sid, sp in data['species'].items():
    if sp['sprite']:
        p = assets / 'pokemon' / f"{sp['sprite']}.png"
        if p.exists():
            sprites[sid] = first_frame(p, assets / 'pokemon' / f"{sp['sprite']}.json")

def trainer_img(asset):
    kind, _, rest = asset.partition('.')
    if kind == 'boss':
        p = assets / 'bosses' / f'{rest}.png'; j = None
    else:
        p = assets / 'trainer' / f'{rest}.png'; j = assets / 'trainer' / f'{rest}.json'
    return first_frame(p, j)[0] if p.exists() else None

trainers = {b['id']: trainer_img(b['sprite']) for b in data['bosses']}
payload = {
    'after': data['afterStage'],
    'legend': data['legend'],
    'names': {k: v['name'] for k, v in data['species'].items()},
    'sprites': {k: [v[0], v[1], v[2]] for k, v in sprites.items()},
    'trainers': trainers,
    'bosses': data['bosses'],
}
html = open(root / 'tools/boss-gimmick-dex.template.html').read().replace('/*DATA*/null', json.dumps(payload, separators=(',', ':')))
Path(sys.argv[2]).write_text(html)
print(f"{len(data['bosses'])} bosses, {len(sprites)} sprites, {len(html) / 1e6:.1f} MB")
