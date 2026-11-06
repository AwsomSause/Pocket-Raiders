#!/usr/bin/env python3
"""Texture Atlas Builder (idea S338): packs a folder of small PNGs into one atlas image plus a Phaser JSON-hash file.

  python3 tools/build-atlas.py <folder> <out-name> [--max 2048] [--pad 1]

Writes <out-name>.png and <out-name>.json next to each other (frame names are the file names without .png).
Shelf packing, tallest first, so the same folder always gives the same atlas. Read-only on the folder.
Exit 1 when the files do not fit in one atlas of --max pixels (split the folder instead).
"""
import json
import sys
from pathlib import Path

from PIL import Image


def pack(sizes, max_size, pad):
    """sizes: list of (name, w, h). Returns ({name: (x, y)}, width, height) or None when it does not fit."""
    order = sorted(sizes, key=lambda s: (-s[2], -s[1], s[0]))
    pos, x, y, row_h, width = {}, 0, 0, 0, 0
    for name, w, h in order:
        if w + pad > max_size or h + pad > max_size:
            return None
        if x + w + pad > max_size:
            x, y, row_h = 0, y + row_h, 0
        if y + h + pad > max_size:
            return None
        pos[name] = (x + pad, y + pad)
        x += w + pad
        row_h = max(row_h, h + pad)
        width = max(width, x)
    return pos, width + pad, y + row_h + pad if sizes else 0


def build(folder, out, max_size=2048, pad=1):
    target = Path(out).with_suffix(".png").resolve()
    files = sorted(f for f in Path(folder).glob("*.png") if f.resolve() != target)
    if not files:
        print("no PNG files in", folder)
        return 1
    images = {f.stem: Image.open(f).convert("RGBA") for f in files}
    laid = pack([(n, i.width, i.height) for n, i in images.items()], max_size, pad)
    if laid is None:
        print(f"the {len(files)} files do not fit in one {max_size}px atlas")
        return 1
    pos, w, h = laid
    sheet = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    frames = {}
    for name, img in images.items():
        x, y = pos[name]
        sheet.paste(img, (x, y))
        frames[name] = {"frame": {"x": x, "y": y, "w": img.width, "h": img.height}, "rotated": False, "trimmed": False,
                        "spriteSourceSize": {"x": 0, "y": 0, "w": img.width, "h": img.height}, "sourceSize": {"w": img.width, "h": img.height}}
    out = Path(out)
    sheet.save(out.with_suffix(".png"))
    out.with_suffix(".json").write_text(json.dumps({"frames": frames, "meta": {"image": out.with_suffix(".png").name, "size": {"w": w, "h": h}, "scale": "1"}}, indent=1, sort_keys=True))
    print(f"{len(files)} images -> {w}x{h} atlas ({out.with_suffix('.png').name})")
    return 0


if __name__ == "__main__":
    args = sys.argv[1:]
    opt = lambda k, d: int(args[args.index(k) + 1]) if k in args else d
    if len(args) < 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(build(args[0], args[1], opt("--max", 2048), opt("--pad", 1)))
