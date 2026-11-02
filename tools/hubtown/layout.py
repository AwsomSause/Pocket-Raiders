# Hub Town layout v3: the single hand-placed source of the town map (Hub Town spec 2026-11-01; Kice 2026-11-02:
# "smaller + more organized + easy to understand", tiles that line up). build.py turns this into src/data/hubTown.json
# and the two overworld atlases. Tile units are 32 px. x right, y down.
#
# Every object is placed by the top-left TILE of its solid picture (whole tiles only), so everything sits on the grid.
# The town is a plus: the Trainer Plaza in the middle, one district each way, three straight streets.
#
#   y  2-12  Champions' Row (north): Achievement Hall, Mentor Dojo, Competitive Arena, Hall of Memories, Pocket Town gate
#   y 13-15  North Street
#   y 16-22  Trainer's Quarter (west) . Trainer Plaza (middle) . Pokémon Park (east)
#   y 23-25  Main Street (through the plaza)
#   y 26-36  Player HQ, Network Post, Corner Nook (west) . Run Prep, Strange Merchant (south) . Institute, Sanctuary (east)
#   y 37-39  South Street
#   y 40-44  the Departure Gate (south, in the middle)

import random

W, H = 64, 48
R = random.Random(11)

paths = [
    [4, 13, 56, 3],      # North Street
    [3, 23, 58, 3],      # Main Street (crosses the plaza)
    [3, 37, 58, 3],      # South Street
    [31, 16, 3, 7],      # the north-south spine: North Street to the plaza
    [31, 26, 3, 18],     # the spine: plaza to the Departure Gate
    [16, 6, 3, 7],       # up to the Pocket Town gate
    [3, 16, 2, 7], [59, 16, 2, 7], [3, 26, 2, 11], [59, 26, 2, 11],   # the ends of the streets join up (a ring road)
]
plaza = [24, 16, 16, 11]
# a soft sandy ring around the plaza so the stone fades into the grass (Kice, 2026-11-02)
plaza_ring = [22, 15, 20, 13]

water = [[6, 41, 9, 3]]                  # the little pond by the south-west lawn
beach = []
bridges = []

# Interactive places. (id, name, stamp, tile x, tile y, door x as a fraction of the width, rooms, blurb)
# Doors are the middle of the bottom row; every door opens onto a street.
locations = [
    ('achievements', 'Achievement Hall', 'achv', 6, 5, 0.5, ['achievements', 'museum', 'codex'], 'Trophies, milestones, the item museum and the Moment Codex.'),
    ('dojo', 'Mentor Dojo', 'dojo', 22, 8, 0.5, ['mentors'], 'Your mentors and apprentices.'),
    ('arena', 'Competitive Arena', 'arena', 29, 4, 0.5, ['archive', 'intel'], 'Trainers, their unlocks, rival records and League intel.'),
    ('memories', 'Hall of Memories', 'memories', 43, 2, 0.5, ['legacy', 'memories', 'fame', 'tales'], 'Every past Trainer, their Aces, the Hall of Fame and the stories NPCs remember.'),
    ('events', 'Event Hall', 'eventhall', 52, 7, 0.5, ['events'], "This week's event, holidays, contracts and objectives."),
    ('boutique', 'Trainer Boutique', 'flowershop', 6, 17, 0.5, ['wardrobe', 'card'], 'Titles and card frames.'),
    ('post', 'Network Post', 'mart2', 13, 18, 0.5, ['network', 'seeds'], 'Parcels from the Trainer Network and the Seed Shelf.'),
    ('center', 'Pokémon Center', 'pc', 43, 16, 0.5, ['mastery', 'research', 'moves', 'hubmon'], 'Inspect every Pokémon you met, and choose the one that walks with you in town.'),
    ('bank', 'Pokémon Bank', 'bank', 52, 18, 0.5, ['bank'], 'Bank credits, tiers and licenses.'),
    ('hq', 'Player HQ', 'hq', 5, 29, 0.5, ['card', 'attributes', 'history', 'prestige', 'save'], 'Your profile, attributes, run history, prestige and save data.'),
    ('nook', 'Corner Nook', 'house_red', 14, 32, 0.5, ['nook'], 'A fortune cookie, a wish, a note to your future self.'),
    ('prep', 'Run Prep Center', 'prep', 24, 29, 0.5, ['run'], 'Choose a trainer, a starter and your bonuses, then set off.'),
    ('merchant', 'Strange Merchant', 'tent', 36, 31, 0.5, ['merchant'], 'Odd wares, limited stock, a new rotation every day.'),
    ('institute', 'Research Institute', 'tower', 43, 29, 0.5, ['tree', 'moves', 'research'], 'The Research Tree, move research and the Pokédex collection sets.'),
]
# Places that are not buildings. (id, name, stamp, tile x, tile y, rooms, blurb)
spots = [
    ('gate', 'Departure Gate', 'arch', 29, 40, ['depart'], 'Leave Hub Town and start your run (asks first).'),
    ('pocket', 'Pocket Town Gate', 'arch', 14, 2, ['town'], 'The road to Pocket Town: gardens, a dojo, a library and more.'),
    ('board', 'Event Board', 'board', 37, 16, ['events'], "What's on this week."),
    ('sanctuary', 'Starter Sanctuary', 'sign', 49, 29, ['lab', 'quests'], "Starter sets by category and each trainer's quest line."),
]

objects = []   # [stamp, tile x, tile y]
O = lambda n, x, y: objects.append([n, x, y])
O('octfount', 30, 18)                                     # the plaza fountain
for x, y in [(25, 17), (25, 25), (36, 25)]: O('bush', x, y)
O('statue', 36, 8); O('banner', 39, 9)
O('bench', 19, 20)
# street lamps, on the grid beside each street
for x, y in [(11, 16), (50, 16), (20, 26), (45, 26), (17, 40), (24, 40), (41, 40), (47, 40)]: O('lamp_g', x, y)
O('sign', 27, 41)

fences = [[48, 27, 13, 9, [[51, 27], [52, 27], [53, 27]]]]   # the Starter Sanctuary garden, open to Main Street

decals = []
fl = [(0, 4), (1, 4), (0, 5), (1, 5), (0, 6), (0, 7), (1, 7), (0, 8), (1, 8)]
for x in range(49, 60):                                   # sanctuary garden flowers
    for y in range(28, 35):
        if R.random() < 0.35: decals.append(['vr', *R.choice(fl), x, y])
for x in range(17, 29):                                   # south-west lawn flowers
    for y in range(41, 44):
        if R.random() < 0.6: decals.append(['vr', *R.choice(fl), x, y])
for x in range(36, 58):                                   # south-east meadow
    for y in range(41, 44):
        if R.random() < 0.4: decals.append(['vr', 2, 0, x, y])
# flowers just outside the plaza ring, so the square melts into the meadow
for _ in range(30):
    side = R.randint(0, 1); x = R.choice([R.randint(19, 21), R.randint(42, 44)]) if side else R.randint(22, 41)
    y = R.randint(16, 26) if side else R.choice([R.randint(26, 28)])
    decals.append(['vr', *R.choice(fl), x, y])

trees = []
def forest(x0, y0, x1, y1, kind='tree'):
    for yy in range(y0, y1 + 1, 2):
        for xx in range(x0 + ((yy // 2) % 2), x1 + 1, 2): trees.append([kind, xx, yy])
# a tidy hedge of trees all round (inside the map, nothing cut off)
forest(0, 0, W - 3, 0); forest(0, H - 3, W - 3, H - 3); forest(0, 2, 0, H - 4); forest(W - 3, 2, W - 3, H - 4)
for x, y in [(56, 2), (36, 2), (4, 2)]: trees.append(['pine', x, y])
for x, y in [(50, 30), (56, 30), (53, 32)]: trees.append(['cherry', x, y])
for x, y in [(37, 41), (44, 41), (51, 41), (56, 41), (18, 41)]: trees.append(['tree', x, y])

# Where you appear on a fresh visit (overridden by the Run Prep Center door: Enter starts a run).
spawn = {'x': 26, 'y': 37, 'facing': 'up'}
keepers = [
    {'id': 'merchant', 'sprite': 'hood_man', 'x': 41, 'y': 35, 'facing': 'down', 'location': 'merchant'},
    {'id': 'gatekeeper', 'sprite': 'NPC_Sonia', 'x': 30, 'y': 39, 'facing': 'down', 'location': 'gate'},
    {'id': 'sanctuary_keeper', 'sprite': 'POKEMONBREADER2', 'x': 54, 'y': 29, 'facing': 'down', 'location': 'sanctuary'},
]
# The Legacy Display: six pedestals round the fountain (the Ace stands on the outer side).
pads = [[28, 17], [35, 17], [28, 20], [35, 20], [28, 23], [35, 23]]
# Districts: named areas for the location banner, the minimap and the wandering crowd (x, y, w, h in tiles).
districts = [
    {'id': 'plaza', 'name': 'Trainer Plaza', 'blurb': 'The Legacy Display and the fountain', 'rect': [22, 15, 20, 13], 'color': '#e8c070'},
    {'id': 'north', 'name': "Champions' Row", 'blurb': 'Arena, Hall of Memories, Achievement Hall, Dojo', 'rect': [3, 2, 58, 13], 'color': '#e07060'},
    {'id': 'west', 'name': "Trainer's Quarter", 'blurb': 'Your HQ, the Boutique, the Post and the Nook', 'rect': [3, 16, 19, 22], 'color': '#70a0e0'},
    {'id': 'east', 'name': 'Pokémon Park', 'blurb': 'Pokémon Center, Bank, Institute, Starter Sanctuary', 'rect': [42, 16, 19, 22], 'color': '#70c070'},
    {'id': 'south', 'name': 'Departure Square', 'blurb': 'Run Prep, the Strange Merchant and the Departure Gate', 'rect': [22, 28, 20, 17], 'color': '#c090e0'},
]
zones = {d['id']: d['rect'] for d in districts}
zones.update({'sanctuary': [49, 28, 11, 7], 'lawn': [16, 40, 14, 4], 'meadow': [35, 40, 24, 4]})
