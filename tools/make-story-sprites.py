"""Story Overhaul S15: stand-in art for the ten new species (no PixelLab access yet).

  python3 tools/make-story-sprites.py public/assets/images/pokemon

Each new species takes the first frame of an existing PokeRogue sprite (front and back), recolours
it (hue shift, saturation/brightness) and optionally rescales it, then writes one-frame atlases
like convert-custom-sprites.py: custom/<id>, back/custom/<id>, shiny/custom/<id>,
back/shiny/custom/<id>. The shiny is the same art hue-rotated a further 120 degrees.
Provenance: PokeRogue sprites (director's packs). These are marked `limited` art until real
PixelLab art replaces them (docs/status/story-species.md). Needs Pillow.
"""
import colorsys
import json
import os
import sys

from PIL import Image

out = sys.argv[1]

# id: (base sprite, hue shift degrees, saturation x, brightness x, scale x)
SPECS = {
    'tuftin': ('133', 0, 0.8, 1.2, 0.7),
    'oracowl': ('164', 200, 0.7, 1.2, 1.2),
    'tempestwing': ('277', 40, 0.4, 1.25, 1.1),
    'megawattrel': ('941', -20, 1.1, 1.05, 1.15),
    'equinar': ('488', 40, 0.9, 1.05, 1.0),
    'hollow-shepherd': ('896', 0, 0.45, 0.9, 1.0),
    'brinecrown': ('249', -25, 1.0, 0.85, 1.0),
    'veinheart': ('379', 30, 1.3, 0.9, 1.05),
    'lumeria': ('637', 300, 0.7, 1.25, 0.9),
    'verdelis': ('251', 80, 1.0, 0.95, 0.95),
}


def first_frame(folder: str, key: str) -> Image.Image:
    base = os.path.join(out, folder, key) if folder else os.path.join(out, key)
    atlas = json.load(open(base + '.json'))
    sheet = Image.open(base + '.png').convert('RGBA')
    raw = atlas['textures'][0]['frames'] if 'textures' in atlas else atlas['frames']
    frames = sorted(raw, key=lambda f: f['filename'])
    f = frames[0]['frame']
    return sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))


def recolor(im: Image.Image, hue: float, sat: float, val: float, scale: float) -> Image.Image:
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            h = (h + hue / 360) % 1.0
            s = min(1.0, s * sat)
            v = min(1.0, v * val)
            r, g, b = colorsys.hsv_to_rgb(h, s, v)
            px[x, y] = (round(r * 255), round(g * 255), round(b * 255), a)
    box = im.getchannel('A').getbbox()
    if box:
        im = im.crop(box)
    if scale != 1.0:
        im = im.resize((max(8, round(im.width * scale)), max(8, round(im.height * scale))), Image.NEAREST)
    return im


def write(im: Image.Image, folder: str, key: str) -> None:
    path = os.path.join(out, folder, 'custom')
    os.makedirs(path, exist_ok=True)
    im.save(os.path.join(path, f'{key}.png'), optimize=True)
    w, h = im.size
    atlas = {'textures': [{'image': f'{key}.png', 'format': 'RGBA8888', 'size': {'w': w, 'h': h}, 'scale': 1,
                           'frames': [{'filename': '0001.png', 'rotated': False, 'trimmed': False, 'sourceSize': {'w': w, 'h': h},
                                       'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'frame': {'x': 0, 'y': 0, 'w': w, 'h': h}}]}],
             'meta': {'app': 'tools/make-story-sprites.py'}}
    with open(os.path.join(path, f'{key}.json'), 'w') as f:
        json.dump(atlas, f)


for sid, (base, hue, sat, val, scale) in SPECS.items():
    front, back = first_frame('', base), first_frame('back', base)
    for im, norm_dir, shiny_dir in ((front, '', 'shiny'), (back, 'back', 'back/shiny')):
        write(recolor(im.copy(), hue, sat, val, scale), norm_dir, sid)
        write(recolor(im.copy(), hue + 120, sat, val, scale), shiny_dir, sid)
print('wrote', len(SPECS), 'species')
