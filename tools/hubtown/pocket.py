#!/usr/bin/env python3
"""Pocket Town builder (offline asset tool, Python 3 + Pillow). Slice "Walkable Pocket Town" (Appendix S.5).

Pocket Town is a second map on the Hub Town engine: same schema (core/hubTown/schema.ts), same two atlases
(hubtown_tiles.png and hubtown_props.png/.json). It needs no source art: it only re-uses tile indices and building
pictures that build.py already cut, so no new image is written. Output: src/data/pocketTown.json.

Usage:  python3 tools/hubtown/pocket.py        (run from the repo root; deterministic)

Layout: a plus of two roads crossing at a plaza with a fountain. Four districts of 12 buildings each (4 x 3 cells of
8 x 8 tiles): Training (north-west), Culture (north-east), Home (south-west), Play (south-east). The Town Square is a
board in the plaza. The Hub gate is the arch at the south end of the main road. Building ids match src/data/town.json.
"""
import json, os, random
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IMG = os.path.join(ROOT, 'public/assets/images/overworld')
T = 32
W, H = 72, 72
R = random.Random(21)

# ---- atlas knowledge (indices into hubtown_tiles.png; see the roles in build.py's blob()) ----
GRASS = [0, 0, 0, 1, 1, 2, 3, 4]
ROAD = {'TL': 5, 'T': 6, 'TR': 7, 'L': 8, 'C': 9, 'R': 10, 'BL': 150, 'B': 13, 'BR': 184, 'iTL': 11, 'iTR': 12, 'iBL': 14, 'iBR': 28}
STONE = lambda x, y: 70 + x % 3 + 11 * (y % 3)
DIRT = 94
FLOWERS = [194, 195, 197, 198, 199, 200, 201, 203]

props_json = json.load(open(os.path.join(IMG, 'hubtown_props.json')))['frames']
sheet = Image.open(os.path.join(IMG, 'hubtown_props.png')).convert('RGBA')

def stamp(n):
    f = props_json[n]['frame']
    return sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))

def footprint(n, px, py):
    """Solid tiles of a picture placed with its top-left at (px, py) pixels (same rule as build.py, buildings keep rows-1)."""
    im = stamp(n); a = im.split()[3].point(lambda v: 255 if v > 200 else 0)
    w, h = im.size
    rows = max(1, round(h / T))
    keep = max(1, rows - 1 if n in BUILDING_FRAMES else (2 if n in ('tree', 'arch') else rows))
    bottom_px = py + (a.getbbox() or (0, 0, w, h))[3]
    tiles = set()
    for ty in range(int(py // T), int((py + h - 1) // T) + 1):
        if ty * T + T <= bottom_px - keep * T: continue
        for tx in range(int(px // T), int((px + w - 1) // T) + 1):
            x0, y0 = max(tx * T, px), max(ty * T, py); x1, y1 = min(tx * T + T, px + w), min(ty * T + T, py + h)
            if x1 <= x0 or y1 <= y0: continue
            box = a.crop((int(x0 - px), int(y0 - py), int(x1 - px), int(y1 - py)))
            if sum(box.histogram()[255:]) / (T * T) >= 0.28: tiles.add((tx, ty))
    return sorted(tiles)

BUILDING_FRAMES = {'house_red', 'dojo', 'tent', 'bank', 'mart2', 'flowershop'}

# ---- districts: building ids (src/data/town.json) in reading order, with the picture each one wears ----
DISTRICTS = [
    ('training', 'Training Grounds', 'Dojo, gym replica, workshop and the places that make you stronger', 2, 2, '#e07060', 'dirt',
     ['dojo', 'replica', 'dreamtower', 'workshop', 'daycare', 'pets', 'arcade', 'basement', 'rooftop', 'elevator', 'statues', 'timemachine']),
    ('culture', 'Culture Quarter', 'Library, shrine, museum, trophies and the town memory', 38, 2, '#70a0e0', 'stone',
     ['library', 'shrine', 'museum2', 'trophy', 'wall', 'memorial', 'observatory', 'radio', 'guestbook', 'board', 'hall', 'lost']),
    ('home', 'Home Gardens', 'Gardens, kitchen, hot spring and cosy corners', 2, 38, '#70c070', 'grass',
     ['garden', 'orchard', 'greenhouse', 'kitchen', 'bakery', 'tea', 'fireplace', 'hotspring', 'aquarium', 'pond', 'seasonal', 'night']),
    ('play', 'Play Street', 'Capsule machine, cinema, stage and every game', 38, 38, '#c090e0', 'flowers',
     ['capsule', 'cinema', 'stage', 'jukebox', 'photo', 'mirror', 'cafe', 'furniture', 'wishing', 'phone', 'mailbox', 'devroom']),
]
FRAMES = ['house_red', 'dojo', 'tent', 'bank', 'mart2', 'flowershop']
town = json.load(open(os.path.join(ROOT, 'src/data/town.json')))
BUILDINGS = {b['id']: b for b in town['buildings']}
assert sum(len(d[-1]) for d in DISTRICTS) + 1 == len(BUILDINGS), 'every building needs a spot (+ the Town Square)'
for d in DISTRICTS:
    for bid in d[-1]: assert bid in BUILDINGS, bid

rect = lambda x, y, w, h: {(xx, yy) for xx in range(x, x + w) for yy in range(y, y + h)}

# ---- roads ----
path = set()
path |= rect(34, 2, 4, H - 4)            # main road, north to south
path |= rect(2, 30, W - 4, 4)            # cross road
for (_i, _n, _b, qx, qy, _c, _g, _ids) in DISTRICTS:
    for r in range(3): path |= rect(qx, qy + r * 8 + 6, 32, 2)   # the two-tile walk beside each row of doors
PLAZA = (29, 28, 14, 8)
plaza = rect(*PLAZA)

ground = [[R.choice(GRASS) for _ in range(W)] for _ in range(H)]
overlay = [[-1] * W for _ in range(H)]
for (_i, _n, _b, qx, qy, _c, floor, _ids) in DISTRICTS:
    for x in range(qx, qx + 32):
        for y in range(qy, qy + 24):
            if floor == 'dirt': ground[y][x] = DIRT
            elif floor == 'stone': ground[y][x] = STONE(x, y)
            elif floor == 'flowers' and R.random() < 0.3 and (x, y) not in path: overlay[y][x] = R.choice(FLOWERS)
            elif floor == 'grass' and R.random() < 0.12 and (x, y) not in path: overlay[y][x] = R.choice(FLOWERS)

def blob(mask):
    for (x, y) in mask:
        n = lambda dx, dy: (x + dx, y + dy) in mask
        cx = 0 if not n(-1, 0) else (2 if not n(1, 0) else 1); cy = 0 if not n(0, -1) else (2 if not n(0, 1) else 1)
        k = {(0, 0): 'TL', (1, 0): 'T', (2, 0): 'TR', (0, 1): 'L', (1, 1): 'C', (2, 1): 'R', (0, 2): 'BL', (1, 2): 'B', (2, 2): 'BR'}[(cx, cy)]
        if k == 'C':
            if not n(-1, -1): k = 'iTL'
            elif not n(1, -1): k = 'iTR'
            elif not n(-1, 1): k = 'iBL'
            elif not n(1, 1): k = 'iBR'
        ground[y][x] = ROAD[k]
        overlay[y][x] = -1

# ---- pictures ----
props, solid, taken, places, building_tiles = [], set(), set(), [], set()

def place(n, x, y):
    """Top-left TILE (x, y) of the solid picture; whole tiles only (same maths as build.py)."""
    im = stamp(n); a = im.split()[3].point(lambda v: 255 if v > 200 else 0)
    bb = a.getbbox() or (0, 0, im.width, im.height)
    wt = -(-(bb[2] - bb[0]) // T); ht = -(-(bb[3] - bb[1]) // T)
    px = x * T + ((wt * T - (bb[2] - bb[0])) // 4) * 2 - bb[0]
    py = (y + ht) * T - bb[3]
    props.append((n, px, py, py + bb[3]))
    fp = footprint(n, px, py)
    solid.update(fp); taken.update(rect(x, y, wt, ht))
    return px, py, im.width, wt, ht, fp

def bottom_aligned(n, cx, cy_bottom):
    """Top-left tile for a picture standing in the cell starting at column cx whose last solid row is cy_bottom."""
    im = stamp(n); a = im.split()[3].point(lambda v: 255 if v > 200 else 0)
    bb = a.getbbox() or (0, 0, im.width, im.height)
    wt = -(-(bb[2] - bb[0]) // T); ht = -(-(bb[3] - bb[1]) // T)
    return cx + (8 - wt) // 2, cy_bottom + 1 - ht

for (did, dname, _b, qx, qy, _c, _f, ids) in DISTRICTS:
    for i, bid in enumerate(ids):
        col, row = i % 4, i // 4
        cx, cy = qx + col * 8, qy + row * 8
        n = FRAMES[(i * 5 + len(did)) % len(FRAMES)]
        x, y = bottom_aligned(n, cx, cy + 5)
        px, py, w, wt, ht, fp = place(n, x, y)
        building_tiles.update(fp)
        bottom = max(t[1] for t in fp)
        target = (px + w * 0.5) / T
        door = min([t for t in fp if t[1] == bottom], key=lambda t: abs(t[0] + 0.5 - target))
        places.append({'id': bid, 'name': BUILDINGS[bid]['name'], 'kind': 'building', 'rooms': [bid], 'blurb': BUILDINGS[bid]['blurb'],
                       'door': {'x': door[0], 'y': door[1]}, 'stand': {'x': door[0], 'y': door[1] + 1, 'facing': 'up'}})

# plaza: fountain, the Town Square board, benches, lamps
place('octfount', 34, 30)
bx, by = 35, 34
px, py, w, wt, ht, fp = place('sign', bx, by)
bt = fp[-1]
places.append({'id': 'square', 'name': 'Town Square', 'kind': 'sign', 'rooms': ['square'], 'blurb': BUILDINGS['square']['blurb'],
               'door': {'x': bt[0], 'y': bt[1]}, 'stand': {'x': bt[0], 'y': bt[1] + 1, 'facing': 'up'}})
for x, y in [(30, 32), (40, 32)]: place('bench', x, y)

# district signs at the plaza corners (face one for the district's blurb)
for (did, dname, blurb, qx, qy, _c, _f, _ids) in DISTRICTS:
    sx = 31 if qx < 34 else 40
    sy = 29 if qy < 30 else 33
    px, py, w, wt, ht, fp = place('sign', sx, sy)
    t = fp[-1] if fp else (sx, sy)
    places.append({'id': f'sign-{did}', 'name': dname, 'kind': 'sign', 'rooms': [f'dist:{did}'], 'blurb': blurb,
                   'door': {'x': t[0], 'y': t[1]}, 'stand': {'x': t[0], 'y': t[1] + 1, 'facing': 'up'}})

# the Hub gate: an arch at the south end of the main road
px, py, w, wt, ht, fp = place('arch', 33, H - 9)
gx = int((px + w / 2) // T); gy = int((py + stamp('arch').height) // T) - 1
places.append({'id': 'hubgate', 'name': 'Hub Town Gate', 'kind': 'gate', 'rooms': ['hub'], 'blurb': 'The road back to Hub Town.',
               'door': {'x': gx, 'y': gy}, 'stand': {'x': gx, 'y': gy - 1, 'facing': 'down'}})
path |= rect(34, H - 8, 4, 6)
blob(path)
for (x, y) in plaza: ground[y][x] = STONE(x, y); overlay[y][x] = -1

# street lamps along the main road and the cross road
for x, y in [(32, 8), (38, 8), (32, 20), (38, 20), (32, 46), (38, 46), (32, 58), (38, 58), (14, 28), (58, 28), (14, 36), (58, 36)]:
    if not (rect(x, y, 1, 3) & (taken | path)): place('lamp_g', x, y)

# a hedge of trees round the edge
trees = []
for x in range(0, W - 2, 2): trees += [(x, 0), (x, H - 3)]
for y in range(2, H - 3, 2): trees += [(0, y), (W - 3, y)]
blockers = taken | path | plaza
for (x, y) in trees:
    if rect(x, y, 2, 2) & blockers: continue
    place('tree', x, y)

# ---- minimap, keepers, zones, districts ----
def mini(x, y):
    if (x, y) in building_tiles: return '#'
    if (x, y) in solid: return 'T'
    if (x, y) in plaza: return 'o'
    if (x, y) in path: return '='
    return '.'
minimap = [''.join(mini(x, y) for x in range(W)) for y in range(H)]
gate = next(p for p in places if p['id'] == 'hubgate')
districts = [{'id': 'plaza', 'name': 'Town Plaza', 'blurb': 'The fountain and the Town Square', 'rect': list(PLAZA), 'color': '#e8c070'}]
zones = {'plaza': list(PLAZA)}
for (did, dname, blurb, qx, qy, color, _f, _ids) in DISTRICTS:
    districts.append({'id': did, 'name': dname, 'blurb': blurb, 'rect': [qx, qy, 32, 24 if qy < 30 else 24], 'color': color})
    zones[did] = [qx, qy, 32, 24]
props.sort(key=lambda p: (p[3], p[1]))
out = {
    'size': [W, H], 'tile': T, 'columns': 16,
    'ground': [ground[y][x] for y in range(H) for x in range(W)],
    'overlay': [overlay[y][x] for y in range(H) for x in range(W)],
    'props': [[n, px, py, d] for n, px, py, d in props],
    'solid': sorted([x, y] for x, y in solid if 0 <= x < W and 0 <= y < H),
    'water': [], 'places': places,
    'spawn': {'x': gate['stand']['x'], 'y': gate['stand']['y'], 'facing': 'up'},
    'keepers': [], 'zones': zones,
    'pads': [[30, 30], [30, 33], [41, 30], [41, 33], [34, 28], [37, 35]],
    'districts': districts, 'minimap': minimap,
}
json.dump(out, open(os.path.join(ROOT, 'src/data/pocketTown.json'), 'w'), separators=(',', ':'))
print(f'props {len(props)}  solid {len(solid)}  places {len(places)}')
