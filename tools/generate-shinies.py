#!/usr/bin/env python3
"""Gives every Pokémon sprite a real shiny. Scans all front/back sprites (canon + custom); when the shiny
file is missing, pixel-identical to the normal art, or nearly so, it writes a recoloured copy (hue shift, picked
from the sprite name so it is stable). Real hand-made shinies are never touched.
Usage: python3 tools/generate-shinies.py [--check]   (--check only reports; exit 1 if any shiny is not distinct)"""
import hashlib, json, os, shutil, sys
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'assets', 'images', 'pokemon')
MIN_DIFF = 2.0  # mean RGB difference (0-255) over opaque pixels below which a shiny counts as "the same"
# (normal dir, shiny dir) pairs; custom sprites live in a custom/ subfolder of each.
DIRS = [('', 'shiny'), ('custom', 'shiny/custom'), ('back', 'back/shiny'), ('back/custom', 'back/shiny/custom')]
HUES = [120, 150, 180, 210, 240, 270, 300, 330, 60, 90]  # degrees


def score(a, b):
    """Mean RGB difference over opaque pixels; None if the sheets differ in size (own layout, assumed real)."""
    A, B = np.asarray(a.convert('RGBA'), dtype=float), np.asarray(b.convert('RGBA'), dtype=float)
    if A.shape != B.shape:
        return None
    m = A[..., 3] > 0
    return float(np.abs(A[..., :3] - B[..., :3])[m].mean()) if m.any() else 99.0


def shift(img, name):
    h = int(hashlib.sha1(name.encode()).hexdigest(), 16)
    deg = HUES[h % len(HUES)]
    hsv = np.asarray(img.convert('RGBA').convert('RGBa').convert('RGBA'))  # keep alpha as-is
    rgba = Image.open(img.filename).convert('RGBA') if False else img.convert('RGBA')
    a = np.asarray(rgba).copy()
    alpha = a[..., 3]
    hs = Image.fromarray(a[..., :3], 'RGB').convert('HSV')
    arr = np.asarray(hs).astype(int)
    arr[..., 0] = (arr[..., 0] + int(deg / 360 * 256)) % 256
    # Grey-ish sprites do not change with a hue shift, so give them colour.
    grey = arr[..., 1] < 40
    arr[grey, 1] = 110
    arr[grey, 2] = np.clip(arr[grey, 2] * 0.95 + 8, 0, 255)
    out = np.asarray(Image.fromarray(arr.astype('uint8'), 'HSV').convert('RGB'))
    res = np.dstack([out, alpha]).astype('uint8')
    return Image.fromarray(res, 'RGBA')


def main():
    check = '--check' in sys.argv
    fixed, bad = [], []
    for nd, sd in DIRS:
        ndir, sdir = os.path.join(ROOT, nd), os.path.join(ROOT, sd)
        for f in sorted(os.listdir(ndir)):
            if not f.endswith('.png') or not os.path.isfile(os.path.join(ndir, f)):
                continue
            n, s = os.path.join(ndir, f), os.path.join(sdir, f)
            img = Image.open(n)
            sc = None if not os.path.exists(s) else score(img, Image.open(s))
            if sc is not None and sc >= MIN_DIFF:
                continue
            if sc is None and os.path.exists(s):
                continue  # different sheet layout: hand-made
            bad.append(os.path.relpath(s, ROOT))
            if check:
                continue
            os.makedirs(sdir, exist_ok=True)
            shift(img, f[:-4]).save(s, optimize=True)
            j = os.path.join(ndir, f[:-4] + '.json')
            sj = os.path.join(sdir, f[:-4] + '.json')
            if os.path.exists(j) and not os.path.exists(sj):
                shutil.copy(j, sj)
            fixed.append(s)
    print(f"{'needs shiny' if check else 'generated'}: {len(bad)}")
    for b in bad[:40]:
        print('  ', b)
    sys.exit(1 if (check and bad) else 0)


main()
