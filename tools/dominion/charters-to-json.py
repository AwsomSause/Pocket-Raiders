"""DOMINION D16: the nine Charters as an established start (Part 0 §6.1 Q4: "Keep them as an optional start, locked
until you finish one run"; the start established: money, crew, an HQ).

Reads the old Evil Mode's Charters (src/data/evilMode/charters.json, design Part 28: the team, the question, the creed,
the Patron, the morning lines, the starting numbers) and writes Dominion's reading of them:
  -> src/data/dominion/charters.json

The old 0-10 scales become Dominion's 0-100 (x5 for Heat, Regard and Dread in the HQ's town); the old roster becomes the
Patron plus Grunts up to the HQ level's crew cap; the colours become the Founding's colour ids. The old house rules
(the Ledger returns, the roll call, two purses...) are not carried: Dominion's Charter is the established start only.

  python3 -I tools/dominion/charters-to-json.py src/data/evilMode/charters.json src/data/dominion/charters.json
"""
import json
import sys

src, out = sys.argv[1], sys.argv[2]
old = json.load(open(src, encoding='utf-8'))

# Per Charter: Founding colours (ids in founding.json), initial, mark, two Team Types (no Dragon or Fairy), the HQ level
# its rooms make (2 rooms: Hideout, 3-4: Hideout or Compound by roster), and the Patron's picture.
DOM = {
    'rocket':        dict(colours=('black', 'crimson'), initial='R', logo='shield', types=('poison', 'dark'), hq=3, look='trainer/pr/clerk_m'),
    'rocket-return': dict(colours=('charcoal', 'crimson'), initial='R', logo='ring', types=('poison', 'dark'), hq=3, look='trainer/pr/ariana'),
    'joint':         dict(colours=('navy', 'crimson'), initial='J', logo='diamond', types=('water', 'ground'), hq=3, look='trainer/pr/veteran_m'),
    'galactic':      dict(colours=('charcoal', 'white'), initial='G', logo='star', types=('steel', 'psychic'), hq=3, look='trainer/pr/scientist_f'),
    'plasma':        dict(colours=('white', 'navy'), initial='P', logo='shield', types=('psychic', 'dark'), hq=2, look='trainer/pr/ruin_maniac'),
    'flare':         dict(colours=('crimson', 'orange'), initial='F', logo='eye', types=('fire', 'dark'), hq=3, look='trainer/pr/waiter_m'),
    'two-boards':    dict(colours=('black', 'white'), initial='S', logo='fang', types=('poison', 'bug'), hq=2, look='trainer/pr/nursery_aide'),
    'group':         dict(colours=('navy', 'gold'), initial='M', logo='diamond', types=('steel', 'normal'), hq=3, look='trainer/pr/clerk_m_2'),
    'staff-room':    dict(colours=('olive', 'white'), initial='T', logo='ring', types=('normal', 'fighting'), hq=2, look='trainer/pr/janitor'),
}
CREW_CAP = {1: 3, 2: 5, 3: 10}
REGION = {'kanto': 'Kanto', 'johto': 'Johto', 'hoenn': 'Hoenn', 'sinnoh': 'Sinnoh', 'unova': 'Unova', 'kalos': 'Kalos', 'alola': 'Alola', 'galar': 'Galar', 'paldea': 'Paldea'}

charters = []
for c in old['charters']:
    d = DOM[c['id']]
    st = c['start']
    grunts = min(c['roster'] - 1, CREW_CAP[d['hq']] - 1)
    charters.append({
        'id': c['id'], 'name': c['name'], 'team': c['teamName'], 'question': c['question'], 'creed': c['creed'],
        'from': REGION[c['region']],
        'colours': list(d['colours']), 'initial': d['initial'], 'logo': d['logo'], 'motto': c['look']['motto'],
        'types': list(d['types']),
        'patron': {'name': c['patron']['name'], 'note': c['patron']['note'], 'look': d['look']},
        'funds': st['funds'], 'hqLevel': d['hq'], 'grunts': grunts,
        'heat': st['heat'] * 5, 'regard': st['regard'] * 5, 'dread': st['dread'] * 5,
        'opening': c['morning'] + [f"{c['patron']['name']}: \"{c['question']}\""],
        'status': 'supported',
    })

doc = {
    '_source': 'DOMINION D16: the nine Charters (old Evil Mode Part 28, src/data/evilMode/charters.json) read as Dominion\'s established start (Part 0 §6.1 Q4). Made by tools/dominion/charters-to-json.py; the old house rules are not carried.',
    'unlockAfter': 1,
    'lockLine': 'Finish one Dominion run to open the Charters.',
    'pickLine': 'Start established: a team with a name, money, a crew and an HQ. The rainy warehouse is always there too.',
    'charters': charters,
    'turn': {
        'fundsCap': 5000, 'regardPerBadge': 3, 'aceLevel': 15,
        'title': 'THE TURN',
        'text': 'You won. The League is yours, and it isn\'t enough. Carry on as a Boss: one Grunt, one warehouse, your ace turned back to where it started.',
        'take': 'Take the Turn',
        'opening': [
            'The trophy is in a box under the bed. The money is in a bag by the door.',
            'Rook is waiting outside the warehouse, in the rain. "They said you\'d come. The Champion. Here."',
            'You tell him to get the door. It\'s a start.',
        ],
    },
}
with open(out, 'w', encoding='utf-8') as f:
    json.dump(doc, f, ensure_ascii=False, indent=1)
    f.write('\n')
print(len(charters), 'charters')
