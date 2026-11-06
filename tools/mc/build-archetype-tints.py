#!/usr/bin/env python3
"""Archetype tints (Story Overhaul P8): the colour that dresses the generic throwing pose for a trainer with no back sprite of its own.

  python3 tools/mc/build-archetype-tints.py

For every archetype in src/data/archetypes.json it finds the sprite's most common saturated colour (ignoring white, black, grey and skin-like
tones) and writes src/data/archetypeTints.json: { "<spriteAssetId>": "#rrggbb" }. Deterministic; sprites that cannot be read are left out.
"""
import colorsys
import json
from collections import Counter
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "public/assets"


def sprite_file(asset_id):
    kind, _, name = asset_id.partition(".")
    base = {"trainer": "images/trainer", "boss": "images/bosses"}.get(kind)
    return ASSETS / base / f"{name}.png" if base else None


def dominant(path):
    im = Image.open(path).convert("RGBA")
    counts = Counter()
    for r, g, b, a in im.getdata():
        if a < 200:
            continue
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if s < 0.35 or v < 0.25 or v > 0.95:
            continue
        if 0.02 < h < 0.11 and s < 0.6:  # skin and hair browns
            continue
        counts[(round(r / 32), round(g / 32), round(b / 32))] += 1
    if not counts:
        return None
    r, g, b = counts.most_common(1)[0][0]
    return "#%02x%02x%02x" % (min(255, r * 32), min(255, g * 32), min(255, b * 32))


def main():
    data = json.loads((ROOT / "src/data/archetypes.json").read_text())
    arr = data if isinstance(data, list) else data.get("archetypes", list(data.values()))
    out, missing = {}, []
    for sprite in sorted({a["spriteAssetId"] for a in arr}):
        f = sprite_file(sprite)
        col = dominant(f) if f and f.exists() else None
        if col:
            out[sprite] = col
        else:
            missing.append(sprite)
    (ROOT / "src/data/archetypeTints.json").write_text(json.dumps(out, indent=1, sort_keys=True) + "\n")
    print(f"{len(out)} tints, {len(missing)} without (they use the default colour): {missing[:10]}")


if __name__ == "__main__":
    main()
