"""Imports the director's hand-drawn art for Tuftin, Tempestwing and Oracowl (Night, plus Day as oracowl-day).

  python3 -I tools/import-starter-sprites.py <folder with the unzipped animations and PNGs> <public/assets/images/pokemon>

Front sprites become multi-frame atlases (PokeRogue layout, frames 0001.. from the animated PNG sequences, all trimmed to
one shared box so the animation does not jitter). Back sprites are one-frame atlases. No shiny art was supplied, so shiny
uses the normal art. Oracowl Day's back sprite arrived in a later upload (Oracowl_Day_Backsprite.png).
"""
import glob, json, os, sys
from PIL import Image

src, out = sys.argv[1:3]

def one(pattern):
    hits = sorted(glob.glob(os.path.join(src, pattern)))
    if len(hits) != 1: raise SystemExit(f'expected 1 match for {pattern}, got {hits}')
    return hits[0]

def frames_of(folder_glob):
    d = one(folder_glob)
    fs = sorted(f for f in glob.glob(os.path.join(d, '*_[0-9][0-9][0-9][0-9].png')))
    return [Image.open(f).convert('RGBA') for f in fs]

def union_box(ims):
    boxes = [b for b in (i.getchannel('A').getbbox() for i in ims) if b]
    return (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))

def write(ims, folder, key):
    box = union_box(ims)
    ims = [i.crop(box) for i in ims]
    w, h = ims[0].size
    sheet = Image.new('RGBA', (w * len(ims), h))
    frames = []
    for n, im in enumerate(ims):
        sheet.paste(im, (w * n, 0))
        frames.append({'filename': f'{n + 1:04d}.png', 'rotated': False, 'trimmed': False, 'sourceSize': {'w': w, 'h': h},
                       'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'frame': {'x': w * n, 'y': 0, 'w': w, 'h': h}})
    path = os.path.join(out, folder, 'custom')
    os.makedirs(path, exist_ok=True)
    sheet.save(os.path.join(path, f'{key}.png'), optimize=True)
    atlas = {'textures': [{'image': f'{key}.png', 'format': 'RGBA8888', 'size': {'w': w * len(ims), 'h': h}, 'scale': 1, 'frames': frames}],
             'meta': {'app': 'tools/import-starter-sprites.py'}}
    with open(os.path.join(path, f'{key}.json'), 'w') as f: json.dump(atlas, f, separators=(', ', ': '))

def still(pattern): return [Image.open(one(pattern)).convert('RGBA')]

jobs = {
    'tuftin': (frames_of('*Tuftin_Animated/*'), still('*Backsprite_for_Tuftin.png')),
    'tempestwing': (frames_of('*Temperwing_Animated/*'), still('*Backsprite_for_Tempestwing.png')),
    'oracowl': (frames_of('*Owacowl_Night_Animated/*'), still('*Oracowl_Night_Backsprite.png')),
}
day = frames_of('*Oracowl_Day_Animated/*')
jobs['oracowl-day'] = (day, still('*Oracowl_Day_Backsprite.png'))
for key, (front, back) in jobs.items():
    for folder, ims in (('.', front), ('shiny', front), ('back', back), ('back/shiny', back)):
        write(ims, folder, key)
print('ok', {k: len(v[0]) for k, v in jobs.items()})
