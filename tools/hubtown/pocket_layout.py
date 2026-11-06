# Pocket Town layout (built by build.py into src/data/pocketTown.json). Woodland Hamlets: four hamlets in a forest
# clearing joined by lanes that meet at the fountain glade (Kice picked mockup 6 of 9, 2026-11-06).
from pocketlib import PTown
TITLE = 'Woodland Hamlets'
PITCH = 'Four little hamlets in a forest clearing, one per quarter, joined by country lanes that meet at the fountain glade. Cosy and secret, with trees everywhere.'
t = PTown(96, 88)
t.road(46, 3, 4, 83); t.road(3, 41, 90, 3)
t.block('training', 3, 3, 43, per=4); t.block('culture', 50, 3, 43, per=4)
t.plaza = [40, 36, 16, 12]; t.plaza_ring = [38, 34, 20, 16]
t.b('square', 46, 38)
t.sign('training', 42, 37); t.sign('culture', 53, 37); t.sign('home', 42, 45); t.sign('play', 53, 45)
t.block('home', 3, 48, 43, per=4); t.block('play', 50, 48, 43, per=4)
t.gate(44, 81)
t.forest(3, 3, 92, 84, 'tree', 3)
t.flowers(3, 3, 90, 82, 0.08)
t.border('pine')
t.district('plaza', 'Fountain Glade', 'The fountain and the Town Square', [38, 34, 20, 16], '#e8c070')
t.pads = [[41, 40], [54, 40], [41, 43], [54, 43], [44, 46], [51, 46]]
t.check()
t.spawn = {'x': 48, 'y': 79, 'facing': 'up'}
t.export(globals())
