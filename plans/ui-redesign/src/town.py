#!/usr/bin/env python3
"""Pass 11 art: cuts the Hub Town props out of the game's sheet and builds the street backdrops.
Run from the repo root: python3 plans/ui-redesign/src/town.py"""
import json
from PIL import Image, ImageDraw
A = 'public/assets/images/'; OUT = 'plans/ui-redesign/sprites/'
props = Image.open(A + 'overworld/hubtown_props.png').convert('RGBA')
fr = json.load(open(A + 'overworld/hubtown_props.json'))
fr = fr['textures'][0]['frames'] if 'textures' in fr else fr['frames']
if isinstance(fr, dict): fr = [dict(v, filename=k) for k, v in fr.items()]
P = {}
for f in fr:
    r = f['frame']; P[f['filename']] = props.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
USE = 'pc mart2 arch eventhall achv hq memories tower bank dojo flowershop tree pine cherry pinktree lamp bench fountain sign counter board banner statue parasol mailbox planter'.split()
for n in USE: P[n].save(OUT + 'tw-%s.png' % n, optimize=True)
tiles = Image.open(A + 'overworld/hubtown_tiles.png').convert('RGBA')
grass, sand = tiles.crop((0, 0, 32, 32)), tiles.crop((64, 296, 96, 328))
def ground(base=372):
    im = Image.new('RGBA', (960, 540)); d = ImageDraw.Draw(im)
    sky = [(104, 190, 244), (126, 202, 247), (150, 214, 250), (176, 226, 252), (202, 238, 254), (226, 246, 255)]
    for i, c in enumerate(sky): d.rectangle((0, i * 30, 960, i * 30 + 30), fill=c)
    for x, w, h in [(-40, 300, 70), (200, 380, 96), (520, 320, 78), (760, 300, 100)]:  # far hills
        d.ellipse((x, 176 - h, x + w, 176 + h), fill=(122, 190, 132))
    for x, w, h in [(60, 260, 44), (380, 300, 52), (700, 320, 46)]:
        d.ellipse((x, 180 - h, x + w, 180 + h), fill=(98, 170, 112))
    for y in range(176, 540, 32):
        for x in range(0, 960, 32): im.paste(grass, (x, y))
    for y in range(base, base + 80, 32):
        for x in range(0, 960, 32): im.paste(sand, (x, y))
    d.rectangle((0, base - 4, 960, base), fill=(86, 148, 78)); d.rectangle((0, base + 80, 960, base + 84), fill=(86, 148, 78))
    return im
def put(im, n, x, base): s = P[n]; im.alpha_composite(s, (x, base - s.height))
g = ground()
for n, x in [('pine', 20), ('tree', 300), ('cherry', 560), ('pine', 760), ('tree', 880)]: put(g, n, x, 300)
g.convert('RGB').save(OUT + 'town-ground.png', optimize=True)
s = ground()
for n, x in [('pine', -30), ('tree', 420), ('pinktree', 640), ('pine', 900)]: put(s, n, x, 300)
for n, x in [('eventhall', -70), ('achv', 110), ('pc', 322), ('arch', 524), ('mart2', 742), ('tower', 900)]: put(s, n, x, 372)
for n, x in [('lamp', 300), ('lamp', 716), ('bench', 452), ('sign', 506)]: put(s, n, x, 376)
s.convert('RGB').save(OUT + 'town-street.png', optimize=True)
for n, src in [('fw-6', 'followers/CHARIZARD'), ('fw-25', 'followers/PIKACHU'), ('fw-94', 'followers/GENGAR'), ('fw-130', 'followers/GYARADOS'), ('fw-448', 'followers/LUCARIO'), ('fw-143', 'followers/SNORLAX'),
               ('ow-red', 'trainers/trainer_POKEMONTRAINER_Red'), ('ow-nurse', 'trainers/NPC_B2W2_Nurse'), ('ow-clerk', 'trainers/NPC_114_Mart_F'), ('ow-lass', 'trainers/NPC_B2W2_Lass'), ('ow-young', 'trainers/NPC_B2W2_Youngster')]:
    im = Image.open(A + 'overworld/' + src + '.png').convert('RGBA'); print(n, im.size); im.save(OUT + n + '.png', optimize=True)
def first(path):  # first frame of a trainer atlas, trimmed
    im = Image.open(A + path + '.png').convert('RGBA'); d = json.load(open(A + path + '.json'))
    f = d['textures'][0]['frames'] if 'textures' in d else d['frames']
    if isinstance(f, dict): f = [dict(v, filename=k) for k, v in f.items()]
    r = sorted(f, key=lambda x: x['filename'])[0]['frame']; im = im.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
    return im.crop(im.getbbox())
for n, src in [('t-clerk', 'trainer/pr/clerk_f'), ('t-clerkm', 'trainer/pr/clerk_m')]:
    im = first(src); print(n, im.size); im.save(OUT + n + '.png', optimize=True)
im = first('pokemon/479'); print('m-479', im.size); im.save(OUT + 'm-479.png', optimize=True)
Image.open(A + 'overworld/followers/ROTOM.png').convert('RGBA').save(OUT + 'fw-479.png', optimize=True)
