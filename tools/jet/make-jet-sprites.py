"""Builds the Jet Pokémon atlases and the Viking overworld sheet from tools/jet/source (Python 3, Pillow).

  python3 tools/jet/make-jet-sprites.py

Each Pokémon PNG (128x128, transparent) is trimmed and written like convert-custom-sprites.py does:
public/assets/images/pokemon/{,back/,shiny/,back/shiny/}custom/<id>.{png,json}. Front art may be an animated sheet in tools/jet/source/anim and back art a picture in tools/jet/source/back; a missing back is
the front mirrored and shiny is always the normal art. The Viking (one 152x168 picture) becomes a
256x256 overworld sheet (4x4 frames of 64 px, every frame the same picture, so he stands and bobs).
"""
import json
import os

from PIL import Image, ImageOps

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
src = os.path.join(root, 'tools', 'jet', 'source')
out = os.path.join(root, 'public', 'assets', 'images')
MONS = ['vine-riff', 'electric-oncore', 'pyro-spirit', 'neon-moon', 'bastiodoom', 'cataggron', 'cataggron-attack', 'cataggron-defence',
        # Beta 4.4 batch (pokedex-data.zip + Beta 4.4 Added Pokemon.zip)
        'promised-prince', 'benovolant-beak', 'tyrant-king', 'fallen-liege', 'maliceye', 'gemgoyle', 'decidueye-assassian', 'dreadodile',
        'alolan-trapinch', 'alolan-vibrava', 'alolan-flygon', 'mega-alolan-flygon', 'paldean-golett', 'paldean-golurk', 'alolan-dratini', 'alolan-dragonair', 'alolan-dragonite']
# The source file name differs from the game id for the Mega (the game calls it alolan-flygon-mega like the other Megas).
OUT_ID = {'mega-alolan-flygon': 'alolan-flygon-mega'}


def trim(im):
    box = im.getchannel('A').getbbox()
    return im.crop(box) if box else im


def write_atlas(frames, folder, key):
    """One PNG laid out as a grid of equal frames plus the multi-atlas JSON (frames 0001.png, 0002.png ...)."""
    path = os.path.join(out, 'pokemon', folder, 'custom')
    os.makedirs(path, exist_ok=True)
    fw, fh = frames[0].size
    cols = min(len(frames), 5)
    rows = -(-len(frames) // cols)
    sheet = Image.new('RGBA', (fw * cols, fh * rows), (0, 0, 0, 0))
    entries = []
    for i, fr in enumerate(frames):
        x, y = (i % cols) * fw, (i // cols) * fh
        sheet.paste(fr, (x, y))
        entries.append({'filename': f'{i + 1:04d}.png', 'rotated': False, 'trimmed': False, 'sourceSize': {'w': fw, 'h': fh},
                        'spriteSourceSize': {'x': 0, 'y': 0, 'w': fw, 'h': fh}, 'frame': {'x': x, 'y': y, 'w': fw, 'h': fh}})
    sheet.save(os.path.join(path, f'{key}.png'), optimize=True)
    atlas = {'textures': [{'image': f'{key}.png', 'format': 'RGBA8888', 'size': {'w': sheet.width, 'h': sheet.height}, 'scale': 1, 'frames': entries}],
             'meta': {'app': 'tools/jet/make-jet-sprites.py'}}
    with open(os.path.join(path, f'{key}.json'), 'w') as f:
        json.dump(atlas, f)


def anim_frames(key):
    """The animated sheet (5 columns of 128 px frames, empty cells at the end), every frame cut to one shared box so it does not jitter."""
    p = os.path.join(src, 'anim', f'{key}.png')
    if not os.path.exists(p):
        return None
    sheet = Image.open(p).convert('RGBA')
    cells = [sheet.crop((c * 128, r * 128, c * 128 + 128, r * 128 + 128)) for r in range(sheet.height // 128) for c in range(sheet.width // 128)]
    cells = [c for c in cells if c.getchannel('A').getbbox()]
    boxes = [c.getchannel('A').getbbox() for c in cells]
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    return [c.crop(box) for c in cells]


for key in MONS:
    still = trim(Image.open(os.path.join(src, f'{key}.png' if key != 'cataggron' else 'cataggron-standard.png')).convert('RGBA'))
    front = anim_frames(key) or [still]
    bp = os.path.join(src, 'back', f'{key}.png')
    back = [trim(Image.open(bp).convert('RGBA'))] if os.path.exists(bp) else [ImageOps.mirror(still)]
    for folder, frames in (('', front), ('back', back), ('shiny', front), (os.path.join('back', 'shiny'), back)):
        write_atlas(frames, folder, OUT_ID.get(key, key))

viking = trim(Image.open(os.path.join(src, 'viking.png')).convert('RGBA'))
scale = 56 / viking.height
viking = viking.resize((max(1, round(viking.width * scale)), 56), Image.LANCZOS)
sheet = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
for row in range(4):
    for col in range(4):
        sheet.paste(viking, (col * 64 + (64 - viking.width) // 2, row * 64 + 62 - viking.height), viking)
os.makedirs(os.path.join(out, 'overworld', 'trainers'), exist_ok=True)
sheet.save(os.path.join(out, 'overworld', 'trainers', 'viking.png'), optimize=True)
print('Jet sprites done.')
