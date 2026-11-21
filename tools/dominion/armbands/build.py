#!/usr/bin/env python3
"""DOMINION D7: armband + team-colour data for every crew picture (design plans/evil-mode-rework Part 11).

For each member look the Dominion data can give (start.json, crew.json): take the picture the game draws (a png, or
frame 0 of a trainer atlas on its untrimmed canvas), find its primary and secondary outfit colours and the armband
anchor with armband.py, apply the hand-checked fixes below, and write src/data/dominion/armbands.json. A proof sheet
(before / grey band / three example teams) goes to the path given with --proof, to check every band by eye.

  python3 tools/dominion/armbands/build.py [--proof out.png]
"""
import json, os, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, HERE)
from armband import analyse, find_anchor, swap, draw_band, hex2rgb, hls  # noqa: E402
import armband  # noqa: E402


def outline_px(p, out):
    return p[3] > 0 and (p[:3] in out or hls(p)[1] < 0.10)


def section(px, W, y, side, cx, cap):
    """The arm's span on one row, from the silhouette edge on `side`: skip the outline, take the fill up to the next
    outline pixel or `cap` pixels (an arm drawn against the body has no outline between them)."""
    xs = [x for x in (range(W - 1, -1, -1) if side > 0 else range(W)) if (x > cx if side > 0 else x < cx)]
    i = 0
    while i < len(xs) and px[xs[i], y][3] == 0: i += 1
    if i >= len(xs): return None
    n = 0
    while i < len(xs) and outline_px(px[xs[i], y], armband.OUT) and n < 2: i += 1; n += 1
    s = i
    while i < len(xs) and i - s < cap and px[xs[i], y][3] > 0 and not outline_px(px[xs[i], y], armband.OUT): i += 1
    if i - s < 3: return None
    a, b = xs[s], xs[i - 1]
    return (min(a, b), max(a, b))


def finder(im, an, prefer=+1, cap=7, at=None):
    """Part 11 §4.2's finder, loosened for the game's trainer sprites: 7 rows on the upper arm, 3 to `cap` wide,
    steady width, between the shoulder line and about a third of the way down the body. `at` = (side, y) to try one place."""
    armband.OUT = {hex2rgb(c) for c in an['outline']}
    W, H = im.size; px = im.load()
    top, bot = an['top'], an['bot']; h = bot - top
    def span(y):
        xs = [x for x in range(W) if px[x, y][3] > 0]; return (min(xs), max(xs)) if xs else None
    sy = an['headY']
    rows_c = [span(y) for y in range(sy, min(bot, sy + 6)) if span(y)]
    cx = sum(a + b for a, b in rows_c) / (2 * len(rows_c)) if rows_c else W / 2
    tries = [at] if at else [(side, y0) for side in (prefer, -prefer) for y0 in range(sy, sy + int(.25 * h))]
    for side, y0 in tries:
        rows = [section(px, W, y, side, cx, cap) for y in range(y0, y0 + 7)]
        if all(rows):
            w = [b - a + 1 for a, b in rows]
            if max(w) - min(w) <= 2 or at:
                return {'side': 'right' if side > 0 else 'left', 'y': y0, 'rows': rows}
    return None

IMAGES = os.path.join(ROOT, 'public', 'assets', 'images')
OUT = os.path.join(ROOT, 'src', 'data', 'dominion', 'armbands.json')

# Hand-checked anchors (Part 11 §4.2), placed on a zoomed grid and checked on the proof sheet. The finder alone put
# bands on hair and chests for these sprites, so every look is listed: [x0, x1, y0] = the upper-arm box (7 rows from
# y0; each row takes the sleeve's own fill pixels inside x0..x1, so the band follows the arm). None = the shown frame
# has no upper arm to wear it (held out sideways, raised, folded, hidden): no band rather than one floating on the chest.
OVERRIDES = {
    'dominion/c-rook0.png': [34, 39, 21],
    'trainer/pr/ace_trainer_f': None,
    'trainer/pr/ace_trainer_m': [38, 43, 37],
    'trainer/pr/scientist_f': None,
    'trainer/pr/scientist_m': None,
    'trainer/pr/psychic_f': None,
    'trainer/pr/beauty_2': [32, 39, 29],
    'trainer/pr/veteran_m': [45, 51, 30],
    'trainer/pr/veteran_f': None,
    'trainer/pr/harlequin': None,
    'trainer/pr/depot_agent': [23, 28, 24],
    'trainer/pr/clerk_m': None,
    'trainer/pr/clerk_f': None,
    'trainer/pr/janitor': None,
    'trainer/pr/worker_f': None,
    'trainer/pr/waiter_m': [55, 59, 27],
    'trainer/pr/waiter_f': None,
    'trainer/pr/baker': None,
    'trainer/pr/musician': None,
    'trainer/pr/rich_m': None,
    'trainer/pr/doctor_f': None,
    'trainer/pr/collector': None,
    'trainer/pr/backpacker_m': None,
    'trainer/pr/black_belt_f': None,
    'trainer/pr/cyclist_m': None,
    'trainer/pr/ranger_f': None,
    'trainer/pr/breeder_m': None,
    'trainer/pr/ruin_maniac': None,
}


# Hand-fixed colour roles (Part 11 §2.5): Rook's whole jacket is one dark navy the analyser takes for outline.
ROLE_FIX = {
    'dominion/c-rook0.png': {'outline': ['#000000'], 'primary': ['#292941'], 'secondary': ['#4a4a52', '#5a5a62', '#42454f', '#6a6a6a']},
}


def boxed(im, an, box):
    """An anchor from a hand-placed box: each of 7 rows spans the non-outline pixels inside x0..x1."""
    x0, x1, y0 = box
    armband.OUT = {hex2rgb(c) for c in an['outline']}
    px = im.load()
    rows = []
    for y in range(y0, y0 + 7):
        xs = [x for x in range(x0, x1 + 1) if px[x, y][3] > 0 and not outline_px(px[x, y], armband.OUT)]
        if len(xs) < 3:
            raise SystemExit(f'box {box}: row {y} has {len(xs)} sleeve pixels')
        rows.append((min(xs), max(xs)))
    xs = [x for y in range(im.size[1]) for x in range(im.size[0]) if px[x, y][3] > 0]
    side = 'right' if (x0 + x1) / 2 > (min(xs) + max(xs)) / 2 else 'left'
    return {'side': side, 'y': y0, 'rows': rows}


def looks():
    out = []
    def walk(v, key=None):
        if isinstance(v, dict):
            for k, x in v.items(): walk(x, k)
        elif isinstance(v, list):
            for x in v: walk(x, key)
        elif isinstance(v, str) and key in ('look', 'file') and (v.endswith('.png') or v.startswith('trainer/')):
            if v not in out: out.append(v)
    for f in ('start.json', 'crew.json'):
        walk(json.load(open(os.path.join(ROOT, 'src', 'data', 'dominion', f))))
    return out


def picture(look):
    """The picture as the game shows it: the png, or frame 0 (frames sorted by name) on its untrimmed canvas."""
    if look.endswith('.png'):
        return Image.open(os.path.join(IMAGES, look)).convert('RGBA')
    d = json.load(open(os.path.join(IMAGES, look + '.json')))
    frames = d['textures'][0]['frames'] if 'textures' in d else d['frames']
    if isinstance(frames, dict):
        frames = [dict(v, filename=k) for k, v in frames.items()]
    f = sorted(frames, key=lambda q: q['filename'])[0]
    sheet = Image.open(os.path.join(IMAGES, look + '.png')).convert('RGBA')
    fr, ss = f['frame'], f.get('sourceSize', {'w': f['frame']['w'], 'h': f['frame']['h']})
    off = f.get('spriteSourceSize', {'x': 0, 'y': 0})
    im = Image.new('RGBA', (ss['w'], ss['h']), (0, 0, 0, 0))
    im.paste(sheet.crop((fr['x'], fr['y'], fr['x'] + fr['w'], fr['y'] + fr['h'])), (off['x'], off['y']))
    return im


def entry(look):
    im = picture(look)
    an = analyse(im)
    fix = ROLE_FIX.get(look)
    if fix:
        an['outline'] = fix['outline']
        an['families']['fix-p'] = {'body': 0, 'head': 0, 'colours': fix['primary']}
        an['families']['fix-s'] = {'body': 0, 'head': 0, 'colours': fix['secondary']}
        an['roles'] = {'primary': 'fix-p', 'secondary': 'fix-s'}
    fam = an['families']
    roles = {r: fam[an['roles'][r]]['colours'] for r in ('primary', 'secondary') if r in an['roles']}
    if look in OVERRIDES:
        anchor = boxed(im, an, OVERRIDES[look]) if OVERRIDES[look] else None
    else:
        anchor = finder(im, an)
    if anchor:
        anchor = {'side': anchor['side'], 'y': anchor['y'], 'rows': [list(r) for r in anchor['rows']]}
    return im, an, {
        'w': im.size[0], 'h': im.size[1], 'headY': an['headY'],
        'primary': roles.get('primary', []), 'secondary': roles.get('secondary', []),
        'anchor': anchor,
    }


TEAMS = [
    {'letter': 'N', 'primary': '#7b3fa0', 'secondary': '#e8e2ff'},
    {'letter': 'E', 'primary': '#c0392b', 'secondary': '#2b2b33'},
    {'letter': 'T', 'primary': '#1f7a5c', 'secondary': '#f2d34a'},
]


def main():
    proof = sys.argv[sys.argv.index('--proof') + 1] if '--proof' in sys.argv else None
    data = {'_source': 'tools/dominion/armbands/build.py (Part 11: roles + armband anchor per crew picture, hand-checked)', 'looks': {}}
    rows = []
    for look in looks():
        im, an, e = entry(look)
        data['looks'][look] = e
        rows.append((look, im, an, e))
    json.dump(data, open(OUT, 'w'), indent=1)
    open(OUT, 'a').write('\n')
    missing = [l for l, *_ in rows if not data['looks'][l]['anchor']]
    print(f'{len(rows)} looks, {len(rows) - len(missing)} with a band; no band: {missing}')
    if not proof:
        return
    S, cell, pad = 3, 80 * 3, 8
    W = cell * 5 + pad * 6
    H = (cell + pad) * len(rows) + 30
    sheet = Image.new('RGBA', (W, H), (32, 36, 44, 255))
    d = ImageDraw.Draw(sheet)
    for c, t in enumerate(['Before', 'Unnamed (grey)', 'N purple/lilac', 'E red/charcoal', 'T green/gold']):
        d.text((pad + c * (cell + pad) + 4, 8), t, fill=(255, 255, 255, 255))
    grey = {'primary': '#8a8f9e', 'secondary': '#8a8f9e'}
    for r, (look, im, an, e) in enumerate(rows):
        a = e['anchor']
        anc = {'side': a['side'], 'y': a['y'], 'rows': [tuple(x) for x in a['rows']]} if a else None
        imgs = [im, draw_band(im, anc, grey, '') if anc else im]
        for t in TEAMS:
            sw = swap(im, an, t)[0]
            imgs.append(draw_band(sw, anc, t, t['letter']) if anc else sw)
        for c, i in enumerate(imgs):
            k = cell / max(i.size)
            sheet.alpha_composite(i.resize((round(i.size[0] * k), round(i.size[1] * k)), Image.NEAREST), (pad + c * (cell + pad), 26 + r * (cell + pad)))
        d.text((pad + 4, 26 + r * (cell + pad) + cell - 14), look, fill=(220, 220, 220, 255))
    sheet.save(proof)


if __name__ == '__main__':
    main()
