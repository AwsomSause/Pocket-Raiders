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
    return list(first_frame(p, j)) if p.exists() else None

MAX_FRAMES = 18

def animated(sprite):
    """All frames of a front sprite as one looping lossless WebP, cropped to the union box (feet stay put), thinned to MAX_FRAMES."""
    base = assets / 'pokemon' / sprite
    j = json.load(open(f'{base}.json'))
    frames = j['textures'][0]['frames'] if 'textures' in j else j['frames']
    frames = frames if isinstance(frames, list) else list(frames.values())
    im = Image.open(f'{base}.png').convert('RGBA')
    fr = [im.crop((f['frame']['x'], f['frame']['y'], f['frame']['x'] + f['frame']['w'], f['frame']['y'] + f['frame']['h'])) for f in frames]
    box = None
    for f in fr:
        bb = f.getbbox()
        if bb: box = bb if box is None else (min(box[0], bb[0]), min(box[1], bb[1]), max(box[2], bb[2]), max(box[3], bb[3]))
    fr = [f.crop(box) for f in fr]
    total_ms = len(fr) * 1000 / 12
    if len(fr) > MAX_FRAMES:
        fr = [fr[round(i * len(fr) / MAX_FRAMES)] for i in range(MAX_FRAMES)]
    if fr[0].height > 120:
        k = 120 / fr[0].height
        fr = [f.resize((max(1, round(f.width * k)), 120), Image.LANCZOS) for f in fr]
    buf = io.BytesIO()
    fr[0].save(buf, 'WEBP', save_all=True, append_images=fr[1:], duration=max(83, round(total_ms / len(fr))), loop=0, lossless=True, method=4)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode(), fr[0].width, fr[0].height

need = {(m.get('f') or m['s']) for b in data['bosses'] for m in b['champion'][-1]['members']}
anims = {sid: animated(data['species'][sid]['sprite']) for sid in sorted(need) if sid in sprites}

trainers = {b['id']: trainer_img(b['sprite']) for b in data['bosses']}
payload = {
    'after': data['afterStage'],
    'legend': data['legend'],
    'names': {k: v['name'] for k, v in data['species'].items()},
    'sprites': {k: [v[0], v[1], v[2]] for k, v in sprites.items()},
    'trainers': trainers,
    'anims': {k: list(v) for k, v in anims.items()},
    'heights': {k: v['h'] for k, v in data['species'].items()},
    'th': {b['id']: b['th'] for b in data['bosses']},
    'bosses': data['bosses'],
}
html = open(root / 'tools/boss-gimmick-dex.template.html').read().replace('/*DATA*/null', json.dumps(payload, separators=(',', ':')))
Path(sys.argv[2]).write_text(html)
print(f"{len(data['bosses'])} bosses, {len(sprites)} sprites, {len(html) / 1e6:.1f} MB")
