# Hub Town layout v4: Garden Village (Kice picked mockup 4 of 6, 2026-11-06; mockups in promo/hubtown-mockups/).
# The single hand-placed source of the town map. build.py turns it into src/data/hubTown.json and the overworld atlases.
# Tile units are 32 px, x right, y down. Buildings are placed by the top-left tile of their solid picture, or by the
# street their door opens on (street=y puts the door on row y-1 and the stand on row y).
#
#   y  2-13  Champions' Row (north): Achievement Hall, Mentor Dojo, Arena, Hall of Memories, Event Hall, Pocket Town gate
#   y 14-16  North Lane
#   y 17-31  Orchard Lane (west) . Mill Pond with its bridge (middle) . Meadow Park (east)
#   y 32-34  Pond Road
#   y 35-43  Market Green: Post, Nook, Run Prep, the market square, Merchant, Institute, Event Board
#   y 44-46  Gate Road, then the Departure Gate (south, in the middle)
from townlib import Town

t = Town(60, 54)
t.road(3, 14, 54, 3); t.road(3, 32, 54, 3); t.road(3, 44, 54, 3); t.road(17, 14, 3, 21); t.road(40, 14, 3, 21)
t.road(3, 14, 2, 33); t.road(55, 14, 2, 33); t.road(47, 7, 3, 7); t.road(28, 47, 3, 4); t.road(28, 17, 3, 3); t.road(28, 29, 3, 3)
t.water.append([20, 19, 20, 11]); t.bridges += [[28, 19], [28, 22], [28, 25], [28, 27]]
t.plaza = [25, 36, 10, 8]; t.plaza_ring = [24, 35, 12, 10]

# Champions' Row
t.loc('achievements', 5, street=14); t.loc('dojo', 13, street=14); t.loc('arena', 20, street=14); t.loc('memories', 28, street=14)
t.loc('events', 37, street=14); t.spot('pocket', 45, 3)
# Orchard Lane and Meadow Park
t.loc('hq', 5, street=32, stamp='blue_house2'); t.loc('boutique', 11, street=32)
t.loc('center', 43, street=32); t.loc('bank', 50, street=32)
t.fences.append([43, 17, 13, 7, [[43, 19], [43, 20]]]); t.spot('sanctuary', 46, 18)
# Market Green
t.loc('post', 4, street=44, stamp='house_c'); t.loc('nook', 11, street=44, stamp='thatch'); t.loc('prep', 18, street=44)
t.loc('merchant', 36, street=44); t.loc('institute', 42, street=44); t.spot('board', 50, 39)
t.spot('gate', 26, 48)

# the market square: a well and a stall
t.o('well', 27, 38); t.o('counter', 31, 37)
# orchards
for x in (6, 9, 12, 15): t.tree('cherry', x, 18); t.tree('cherry', x + 1, 22)
t.tree('cherry', 52, 20); t.tree('pinktree', 48, 41)
# lamps by the roads, benches by the pond
for x, y in [(15, 18), (10, 41), (16, 41), (41, 41), (48, 41)]: t.o('lamp', x, y)
for x, y in [(22, 30), (35, 30)]: t.o('bench', x, y)
t.flowers(44, 18, 11, 5, 0.45); t.flowers(5, 24, 11, 2, 0.5); t.flowers(20, 30, 20, 2, 0.6)
t.flowers(5, 48, 20, 2, 0.5, True); t.flowers(33, 48, 20, 2, 0.5, True)
t.border('pine')

t.pads = [[25, 36], [34, 36], [25, 39], [34, 39], [25, 42], [34, 42]]
t.keepers = [{'id': 'merchant', 'sprite': 'hood_man', 'x': 38, 'y': 45, 'facing': 'down', 'location': 'merchant'},
             {'id': 'gatekeeper', 'sprite': 'NPC_Sonia', 'x': 31, 'y': 49, 'facing': 'down', 'location': 'gate'},
             {'id': 'sanctuary_keeper', 'sprite': 'POKEMONBREADER2', 'x': 50, 'y': 21, 'facing': 'down', 'location': 'sanctuary'}]
# Districts: the location banner, the minimap and the wandering crowd use these (ids are fixed: plaza/north/west/east/south).
t.district('plaza', 'Market Green', 'The market square and the Legacy Display', [24, 35, 12, 10], '#e8c070')
t.district('north', "Champions' Row", 'Arena, Memories, Achievements, Dojo, Events', [3, 2, 54, 15], '#e07060')
t.district('west', 'Orchard Lane', 'Your HQ and the Boutique among the cherry trees', [3, 17, 14, 18], '#70a0e0')
t.district('east', 'Meadow Park', 'Pokémon Center, Bank and the Starter Sanctuary', [40, 17, 17, 18], '#70c070')
t.district('south', 'Village Gate', 'Post, Nook, Run Prep, Merchant, Institute and the Departure Gate', [3, 35, 54, 17], '#c090e0')
t.zones.update({'sanctuary': [44, 18, 11, 5], 'lawn': [5, 48, 20, 2], 'meadow': [33, 48, 20, 2], 'pond': [20, 17, 20, 15]})
t.spawn = {'x': 20, 'y': 44, 'facing': 'up'}
t.export(globals())
