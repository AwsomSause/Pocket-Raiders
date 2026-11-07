"""Builds the Jet Pokémon atlases and the Viking overworld sheet from tools/jet/source (Python 3, Pillow).

  python3 tools/jet/make-jet-sprites.py

Each Pokémon PNG (128x128, transparent) is trimmed and written like convert-custom-sprites.py does:
public/assets/images/pokemon/{,back/,shiny/,back/shiny/}custom/<id>.{png,json}. No back or shiny art was
supplied, so back = the front mirrored and shiny = the normal art. The Viking (one 152x168 picture) becomes a
256x256 overworld sheet (4x4 frames of 64 px, every frame the same picture, so he stands and bobs).
"""
import json
import os

from PIL import Image, ImageOps

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
src = os.path.join(root, 'tools', 'jet', 'source')
out = os.path.join(root, 'public', 'assets', 'images')
MONS = ['espeon-paradox', 'umbreon-paradox', 'toxtricity-future', 'toxtricity-past', 'bastiodon-skull',
        'aggron-evolution', 'aggron-evolution-attack', 'aggron-evolution-defence']


def trim(im):
    box = im.getchannel('A').getbbox()
    return im.crop(box) if box else im


def write_atlas(im, folder, key):
    path = os.path.join(out, 'pokemon', folder, 'custom')
    os.makedirs(path, exist_ok=True)
    im.save(os.path.join(path, f'{key}.png'), optimize=True)
    w, h = im.size
    atlas = {'textures': [{'image': f'{key}.png', 'format': 'RGBA8888', 'size': {'w': w, 'h': h}, 'scale': 1, 'frames': [{
        'filename': '0001.png', 'rotated': False, 'trimmed': False, 'sourceSize': {'w': w, 'h': h},
        'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'frame': {'x': 0, 'y': 0, 'w': w, 'h': h}}]}],
        'meta': {'app': 'tools/jet/make-jet-sprites.py'}}
    with open(os.path.join(path, f'{key}.json'), 'w') as f:
        json.dump(atlas, f)


for key in MONS:
    front = trim(Image.open(os.path.join(src, f'{key}.png')).convert('RGBA'))
    back = ImageOps.mirror(front)
    for folder, im in (('', front), ('back', back), ('shiny', front), (os.path.join('back', 'shiny'), back)):
        write_atlas(im, folder, key)

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
