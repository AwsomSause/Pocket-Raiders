"""Mega Stone icons for the Jet Pokémon (python3 tools/jet/make-mega-stones.py, Pillow).

Each stone is a real Mega Stone picture from the game turned to the Mega's main type: the two-tone swirl is kept (hue rotated, shading and outline
untouched) so they read as the normal stones, not flat balls. Base picture rotates per type among three real stones so neighbours differ a little.
Stones come from tools/jet/source/stones.json (id + type); Alolan Flygonite is listed there too or is handled by the Beta 4.4 batch.
"""
import colorsys
import json
import os
import zlib

from PIL import Image

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
items = os.path.join(root, 'public', 'assets', 'images', 'items')
# Target hue (0-1) for the swirl's main colour, plus saturation and lightness factors for the pale or dark types.
TYPES = {'normal': (0.10, 0.25, 1.05), 'fire': (0.0, 1.0, 1.0), 'water': (0.6, 1.0, 1.0), 'electric': (0.14, 1.0, 1.05), 'grass': (0.33, 1.0, 0.95),
         'ice': (0.5, 0.8, 1.15), 'fighting': (0.03, 0.9, 0.85), 'poison': (0.78, 1.0, 0.95), 'ground': (0.09, 0.7, 0.9), 'flying': (0.62, 0.55, 1.15),
         'psychic': (0.9, 1.0, 1.05), 'bug': (0.24, 1.0, 0.95), 'rock': (0.11, 0.45, 0.9), 'ghost': (0.76, 0.8, 0.75), 'dragon': (0.7, 1.0, 0.9),
         'dark': (0.7, 0.35, 0.6), 'steel': (0.55, 0.3, 1.0), 'fairy': (0.93, 0.7, 1.15)}
BASES = ['garchompite', 'gengarite', 'charizardite_x']  # real stones: red/yellow, red/white/violet, blue/black
BASE_HUE = {'garchompite': 0.0, 'gengarite': 0.97, 'charizardite_x': 0.55}


def tint(base, hue, sat_k, light_k, rot):
    icon = base.copy()
    pix = icon.load()
    for y in range(icon.height):
        for x in range(icon.width):
            r, g, b, a = pix[x, y]
            if not a:
                continue
            h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            if s < 0.12:  # outline / highlight stay neutral
                nr, ng, nb = colorsys.hls_to_rgb(h, min(1, l * light_k), s)
            else:
                nr, ng, nb = colorsys.hls_to_rgb((h + rot) % 1, min(1, l * light_k), min(1, s * sat_k))
            pix[x, y] = (round(nr * 255), round(ng * 255), round(nb * 255), a)
    return icon


stones = json.load(open(os.path.join(root, 'tools', 'jet', 'source', 'stones.json')))
for st in stones:
    hue, sat_k, light_k = TYPES.get(st['type'], (0.5, 1.0, 1.0))
    name = BASES[zlib.crc32(st['id'].encode()) % len(BASES)]
    base = Image.open(os.path.join(items, name + '.png')).convert('RGBA')
    tint(base, hue, sat_k, light_k, (hue - BASE_HUE[name]) % 1).save(os.path.join(items, st['id'].replace('-', '_') + '.png'), optimize=True)
print(len(stones), 'stone icons written.')
