# Helpers for pocket_layout.py (Pocket Town v2, Woodland Hamlets: Kice picked mockup 6 of 9 on 2026-11-06).
# Places the 48 buildings + Town Square of src/data/town.json with the Hub Town lib; build.py reads the lists.
import json, os
from townlib import Town, SIZE
TJ = {b['id']: b for b in json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../src/data/town.json')))['buildings']}
STAMP = {  # building id -> picture (a house-like stamp = walk-in building)
 'dojo': 'dojo', 'replica': 'arena', 'dreamtower': 'tower', 'workshop': 'house_d', 'daycare': 'house_b', 'pets': 'house_red',
 'arcade': 'mart2', 'basement': 'house_c', 'rooftop': 'blue_house', 'elevator': 'hq', 'timemachine': 'prep',
 'library': 'memories', 'shrine': 'thatch', 'museum2': 'achv', 'trophy': 'bank', 'observatory': 'tower', 'radio': 'blue_house2',
 'guestbook': 'house_c', 'hall': 'hq', 'lost': 'house_red',
 'kitchen': 'house_b', 'bakery': 'flowershop', 'tea': 'thatch', 'fireplace': 'house_d', 'greenhouse': 'blue_house', 'aquarium': 'pool',
 'capsule': 'mart2', 'cinema': 'eventhall', 'stage': 'achv', 'jukebox': 'house_red', 'photo': 'flowershop', 'mirror': 'blue_house2',
 'cafe': 'house_c', 'furniture': 'bank', 'devroom': 'pc', 'phone': 'house_d',
}
OUT = {  # outdoor places: the object itself is the thing you face
 'statues': 'statue', 'wall': 'banner', 'memorial': 'bust', 'board': 'board', 'garden': 'planter', 'orchard': 'cherry',
 'hotspring': 'smallpool', 'pond': 'well', 'seasonal': 'parasol', 'night': 'lamp', 'wishing': 'pinktree', 'mailbox': 'mailbox',
 'square': 'fountain',
}
assert set(STAMP) | set(OUT) == set(TJ), set(TJ) ^ (set(STAMP) | set(OUT))
DIST = {
 'training': ('Training Grounds', 'Dojo, gym replica, workshop and the places that make you stronger', '#e07060',
              ['dojo', 'replica', 'dreamtower', 'workshop', 'daycare', 'pets', 'arcade', 'basement', 'rooftop', 'elevator', 'statues', 'timemachine']),
 'culture': ('Culture Quarter', 'Library, shrine, museum, trophies and the town memory', '#70a0e0',
             ['library', 'shrine', 'museum2', 'trophy', 'wall', 'memorial', 'observatory', 'radio', 'guestbook', 'board', 'hall', 'lost']),
 'home': ('Home Gardens', 'Gardens, kitchen, hot spring and cosy corners', '#70c070',
          ['garden', 'orchard', 'greenhouse', 'kitchen', 'bakery', 'tea', 'fireplace', 'hotspring', 'aquarium', 'pond', 'seasonal', 'night']),
 'play': ('Play Street', 'Capsule machine, cinema, stage and every game', '#c090e0',
          ['capsule', 'cinema', 'stage', 'jukebox', 'photo', 'mirror', 'cafe', 'furniture', 'wishing', 'phone', 'mailbox', 'devroom']),
}

class PTown(Town):
    def __init__(s, W, H, seed=11):
        super().__init__(W, H, seed); s.rects = []
    def _r(s, what, x, y, st):
        w, h = SIZE[st]; s.rects.append((what, x, y, w, h)); return (x, y, w, h)
    def b(s, bid, x, y=None, street=None, stamp=None):
        """A Pocket Town place by top-left tile, or with street= the road row its door opens on."""
        b = TJ[bid]
        if bid == 'square':
            st = stamp or OUT[bid]
            if street is not None: y = street - SIZE[st][1]
            s.spots.append((bid, b['name'], st, x, y, [bid], b['blurb']))
        else:   # outdoor places (statue, planter, mailbox...) are still 'building' doors: you face the object
            st = stamp or OUT.get(bid) or STAMP[bid]
            if street is not None: y = street - SIZE[st][1]
            s.locations.append((bid, b['name'], st, x, y, 0.5, [bid], b['blurb']))
        return s._r(bid, x, y, st)
    def w(s, bid, stamp=None): return SIZE[stamp or OUT.get(bid) or STAMP[bid]][0]
    def row(s, ids, x, street, gap=1):
        for i in ids: s.b(i, x, street=street); x += s.w(i) + gap
        return x
    def sign(s, did, x, y):
        n, bl, c, _ = DIST[did]; s.spots.append((f'sign-{did}', n, 'sign', x, y, [f'dist:{did}'], bl)); s._r('sign-' + did, x, y, 'sign')
    def gate(s, x, y):
        s.spots.append(('hubgate', 'Hub Town Gate', 'arch', x, y, ['hub'], 'The road back to Hub Town.')); s._r('hubgate', x, y, 'arch')
    def o(s, n, x, y): s.objects.append([n, x, y]); s._r(n, x, y, n)
    def dist(s, did, rect):
        n, bl, c, _ = DIST[did]; s.district(did, n, bl, rect, c)
    def check(s):
        got = {r[0] for r in s.rects}
        miss = set(TJ) - got; assert not miss, f'missing {miss}'
        for i, a in enumerate(s.rects):
            n, x, y, w, h = a
            assert x >= 0 and y >= 0 and x + w <= s.W and y + h <= s.H, f'outside {a}'
            for bb in s.rects[i + 1:]:
                if x < bb[1] + bb[3] and bb[1] < x + w and y < bb[2] + bb[4] and bb[2] < y + h: print('OVERLAP', a, bb)
            for r in s.paths:
                if n in SIZE and x < r[0] + r[2] and r[0] < x + w and y < r[1] + r[3] and r[1] < y + h: print('ON ROAD', a, r)

    def hrow(s, ids, x, w, street, gap=1):
        """Centre a row of places in [x, x+w) with doors on road row `street`."""
        tot = sum(s.w(i) for i in ids) + gap * (len(ids) - 1)
        assert tot <= w, f'row too wide {tot}>{w} {ids}'
        s.row(ids, x + (w - tot) // 2, street, gap)
    def block(s, did, x, y, w, per=6, ids=None, road=2, gap=1, color=True):
        """Pack a district's places into rows of `per`, each row standing on its own `road`-tall street. Returns bottom y."""
        ids = ids or DIST[did][3]; top = y
        for k in range(0, len(ids), per):
            r = ids[k:k + per]; h = max(SIZE[OUT.get(i) or STAMP[i]][1] for i in r)
            street = y + h; s.hrow(r, x, w, street, gap); s.road(x, street, w, road); y = street + road + 1
        if color: s.dist(did, [x, top, w, y - top])
        return y
