#!/usr/bin/env python3
"""Player trainer art importer (Story Overhaul slice P1).

  python3 tools/mc/build-player-art.py <unzipped MC folder>

Reads the director's MC pack (MC/Female MC Animations/*.png, MC/Female MC.png, the 3x3 throw sheets, ...) and writes one
Phaser JSON-hash atlas per animation (a single horizontal strip, frames bottom-centre aligned so the feet stay planted):

  public/assets/images/packs/mc/<look>/<anim>.png + <anim>.json      (asset id `player_<look>_<anim>`, see src/assets/playerArt.ts)

Look A = the female MC (complete). Look B = the male MC (stub: throw sheet + portrait only; the male trainer stays COMING SOON).
Deterministic: the same input folder gives the same bytes. The raw pack is not committed.
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "public/assets/images/packs/mc"


def split_sheet(path, n=3):
    """Split an n x n sheet into frames, row by row."""
    im = Image.open(path).convert("RGBA")
    w, h = im.width // n, im.height // n
    return [im.crop((c * w, r * h, (c + 1) * w, (r + 1) * h)) for r in range(n) for c in range(n)]


def numbered(folder, stem):
    files = sorted(folder.glob(f"{stem}_[0-9][0-9][0-9][0-9].png"), key=lambda p: int(re.search(r"_(\d+)\.png$", p.name).group(1)))
    return [Image.open(f).convert("RGBA") for f in files]


def one(path):
    return [Image.open(path).convert("RGBA")]


def write(look, anim, frames):
    cw, ch = max(f.width for f in frames), max(f.height for f in frames)
    strip = Image.new("RGBA", (cw * len(frames), ch), (0, 0, 0, 0))
    meta = []
    for i, f in enumerate(frames):
        strip.paste(f, (i * cw + (cw - f.width) // 2, ch - f.height), f)
        meta.append({"filename": f"{i + 1:04d}.png", "rotated": False, "trimmed": False, "sourceSize": {"w": cw, "h": ch},
                     "spriteSourceSize": {"x": 0, "y": 0, "w": cw, "h": ch}, "frame": {"x": i * cw, "y": 0, "w": cw, "h": ch}})
    d = OUT / look
    d.mkdir(parents=True, exist_ok=True)
    strip.save(d / f"{anim}.png", optimize=True)
    (d / f"{anim}.json").write_text(json.dumps({"textures": [{"image": f"{anim}.png", "format": "RGBA8888", "size": {"w": strip.width, "h": strip.height}, "scale": 1, "frames": meta}]}, separators=(",", ":")))
    print(f"{look}/{anim}: {len(frames)} frames {cw}x{ch}")
    return len(frames)


def main(root):
    root = Path(root)
    mc = root / "MC" if (root / "MC").is_dir() else root
    fa = mc / "Female MC Animations"
    total = 0
    # Back-view animations (3/4 from behind, 128 px cells).
    total += write("look_a", "throw", split_sheet(fa / "Female MC Throwing.png"))
    for anim, stem in [("celebrate", "celebrate"), ("command", "command"), ("disappointment", "disappointment"), ("hit", "reaction to hit"), ("recall", "recall")]:
        total += write("look_a", anim, numbered(fa, stem))
    total += write("look_a", "back_idle", one(next(fa.glob("Create a back sprite*_0001.png"))))
    # Front/side mood poses and the pet / item scenes.
    for anim, stem in [("angry", "angry"), ("pissed", "pissed"), ("sad", "sad"), ("looking_up", "looking up"), ("item_offer", "item offering"), ("petting", "petting")]:
        total += write("look_a", anim, numbered(fa, stem))
    for anim, name in [("excited", "execited.png"), ("happy", "happy.png"), ("hunger", "hunger.png"), ("laughing", "laughing.png"), ("walk_mid", "mid-walking.png"),
                       ("nervous", "nervous_0001.png"), ("read_letter", "read letter.png"), ("shock", "shock.png")]:
        total += write("look_a", anim, one(fa / name))
    total += write("look_a", "disappointed", one(next(fa.glob("disappointed*.png"))))
    total += write("look_a", "flinch", one(next(fa.glob("Create a flinch pose*.png"))))
    total += write("look_a", "portrait", one(mc / "Female MC.png"))
    total += write("look_a", "pidgey", split_sheet(mc / "Female Trainer and Pidgey.png"))
    # Look B stub (male MC, COMING SOON): cropped throw sheet and portrait only.
    write("look_b", "throw", split_sheet(mc / "Male MC Throwing.png"))
    write("look_b", "portrait", one(mc / "Male MC.png"))
    print("look_a frames (excluding portrait and pidgey):", total - 10)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
