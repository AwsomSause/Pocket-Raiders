# Helpers for layout.py (Garden Village, Kice picked mockup 4 on 2026-11-06). A Town collects the lists build.py reads.
import random
SIZE = {'arena': (6, 9), 'achv': (7, 8), 'memories': (7, 11), 'hq': (7, 8), 'pc': (7, 7), 'bank': (6, 5), 'mart2': (6, 5), 'prep': (6, 8), 'tent': (5, 6), 'arch': (7, 4), 'house_red': (5, 5), 'fountain': (3, 3), 'board': (3, 5), 'statue': (3, 5), 'bust': (2, 2), 'banner': (2, 4), 'cherry': (3, 3), 'tree': (3, 3), 'eventhall': (5, 6), 'flowershop': (5, 6), 'tower': (5, 8), 'dojo': (5, 5), 'pool': (7, 9), 'octfount': (4, 4), 'bench': (2, 2), 'lamp': (2, 3), 'lamp_b': (1, 3), 'lamp_g': (1, 3), 'bush': (2, 2), 'hedge': (6, 2), 'well': (2, 2), 'counter': (3, 3), 'planter': (4, 4), 'house_b': (5, 6), 'house_c': (6, 6), 'house_d': (5, 5), 'thatch': (5, 6), 'blue_house': (6, 6), 'blue_house2': (6, 6), 'pinktree': (3, 3), 'pine': (3, 3), 'pier': (4, 2), 'torch': (1, 3), 'mailbox': (1, 1), 'sign': (1, 2), 'smallpool': (3, 3), 'flowerbox': (1, 2), 'bench_v': (2, 2), 'parasol': (3, 3), 'bluebench': (3, 3)}
LOC = {
 'achievements': ('Achievement Hall', 'achv', ['achievements', 'museum', 'codex'], 'Trophies, milestones, the item museum and the Moment Codex.'),
 'dojo': ('Mentor Dojo', 'dojo', ['mentors'], 'Your mentors and apprentices.'),
 'arena': ('Competitive Arena', 'arena', ['archive', 'intel'], 'Trainers, their unlocks, rival records and League intel.'),
 'memories': ('Hall of Memories', 'memories', ['legacy', 'memories', 'fame', 'tales'], 'Every past Trainer, their Aces, the Hall of Fame and the stories NPCs remember.'),
 'events': ('Event Hall', 'eventhall', ['events'], "This week's event, holidays, contracts and objectives."),
 'boutique': ('Trainer Boutique', 'flowershop', ['wardrobe', 'card'], 'Titles and card frames.'),
 'post': ('Network Post', 'mart2', ['network', 'seeds'], 'Parcels from the Trainer Network and the Seed Shelf.'),
 'center': ('Pokémon Center', 'pc', ['mastery', 'research', 'moves', 'hubmon'], 'Inspect every Pokémon you met.'),
 'bank': ('Pokémon Bank', 'bank', ['bank'], 'Bank credits, tiers and licenses.'),
 'hq': ('Player HQ', 'hq', ['card', 'attributes', 'history', 'prestige', 'save'], 'Your profile, attributes, run history, prestige and save data.'),
 'nook': ('Corner Nook', 'house_red', ['nook'], 'A fortune cookie, a wish, a note to your future self.'),
 'prep': ('Run Prep Center', 'prep', ['run'], 'Choose a trainer, a starter and your bonuses, then set off.'),
 'merchant': ('Strange Merchant', 'tent', ['merchant'], 'Odd wares, limited stock, a new rotation every day.'),
 'institute': ('Research Institute', 'tower', ['tree', 'moves', 'research'], 'The Research Tree, move research and the Pokédex collection sets.'),
}
SPOT = {
 'gate': ('Departure Gate', 'arch', ['depart'], 'Leave Hub Town and start your run (asks first).'),
 'pocket': ('Pocket Town Gate', 'arch', ['town'], 'The road to Pocket Town.'),
 'board': ('Event Board', 'board', ['events'], "What's on this week."),
 'sanctuary': ('Starter Sanctuary', 'sign', ['lab', 'quests'], "Starter sets and quest lines."),
}

class Town:
    def __init__(s, W, H, seed=11):
        s.W, s.H = W, H; s.R = random.Random(seed)
        s.paths, s.water, s.beach, s.bridges = [], [], [], []
        s.locations, s.spots, s.objects, s.fences, s.decals, s.trees = [], [], [], [], [], []
        s.plaza = None; s.plaza_ring = None; s.pads = []; s.districts = []; s.zones = {}; s.keepers = []
        s.spawn = {'x': W // 2, 'y': H - 6, 'facing': 'up'}

    def loc(s, lid, x, y=None, stamp=None, street=None):
        """Place a building by top-left tile; or give street= (the road row its door opens on) to set y."""
        name, st, rooms, blurb = LOC[lid]; st = stamp or st
        if street is not None: y = street - SIZE[st][1]
        s.locations.append((lid, name, st, x, y, 0.5, rooms, blurb)); return (x, y, *SIZE[st])

    def spot(s, sid, x, y=None, stamp=None, street=None):
        name, st, rooms, blurb = SPOT[sid]; st = stamp or st
        if street is not None: y = street - SIZE[st][1]
        s.spots.append((sid, name, st, x, y, rooms, blurb))

    def o(s, n, x, y): s.objects.append([n, x, y])
    def road(s, x, y, w, h): s.paths.append([x, y, w, h])
    def tree(s, k, x, y): s.trees.append([k, x, y])
    def forest(s, x0, y0, x1, y1, kind='tree', step=2):
        for yy in range(y0, y1 + 1, step):
            for xx in range(x0 + ((yy // step) % 2), x1 + 1, step): s.trees.append([kind, xx, yy])
    def border(s, kind='tree'):
        W, H = s.W, s.H
        s.forest(0, 0, W - 3, 0, kind); s.forest(0, H - 3, W - 3, H - 3, kind); s.forest(0, 2, 0, H - 4, kind); s.forest(W - 3, 2, W - 3, H - 4, kind)
    FL = [(0, 4), (1, 4), (0, 5), (1, 5), (0, 6), (0, 7), (1, 7), (0, 8), (1, 8)]
    def flowers(s, x, y, w, h, p=0.4, tall=False):
        for xx in range(x, x + w):
            for yy in range(y, y + h):
                if s.R.random() < p: s.decals.append(['vr', 2, 0, xx, yy] if tall else ['vr', *s.R.choice(s.FL), xx, yy])
    def district(s, did, name, blurb, rect, color):
        s.districts.append({'id': did, 'name': name, 'blurb': blurb, 'rect': rect, 'color': color}); s.zones[did] = rect

    def export(s, g):
        g.update(W=s.W, H=s.H, R=s.R, paths=s.paths, plaza=s.plaza, plaza_ring=s.plaza_ring, water=s.water, beach=s.beach,
                 bridges=s.bridges, locations=s.locations, spots=s.spots, objects=s.objects, fences=s.fences, decals=s.decals,
                 trees=s.trees, spawn=s.spawn, keepers=s.keepers, pads=s.pads, districts=s.districts, zones=s.zones)
