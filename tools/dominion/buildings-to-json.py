"""DOMINION slice D5: turns the two building lists into game data.

  lists/buildings.md                    (1-150, groups A-J)
  lists/buildings-pokemon-and-grunt.md  (P1-P50, G1-G60)
  + the Part 3 §3.2 rooms that aren't in either list (Pokémon Storage, Recruitment Center, Luxury Suite, Night Shift,
    Snag Desk / Shadow Lab)
  -> src/data/dominion/buildings.json

Every row is kept word for word (name, slots, cost, T1 effect, per tier, capstone, ladder). What the engine does with a
building is the FX table below (numbers at T1, scaled by the tier's Effect x). A building with no FX row is listed but
can't be built yet: it names the slice its effect waits for (WAITS, by keyword). Part 3 names win where the poster
renamed a room (Training Room, Research Lab, Treasury, Operations Room). Re-run after a list changes:
  python3 -I tools/dominion/buildings-to-json.py <plans/evil-mode-rework/lists> src/data/dominion/buildings.json
"""
import json
import re
import sys

lists, out = sys.argv[1], sys.argv[2]


def slug(t):
    t = t.lower().replace('é', 'e').replace("'", '').replace('’', '').replace('.', '').replace('(', '').replace(')', '')
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


# Part 3 §3.2 names (Kice's image) for list rows, and ids that would clash.
RENAME = {
    'Training Floor': 'Training Room', 'Science Lab': 'Research Lab', 'Vault': 'Treasury', 'War Room': 'Operations Room',
}
ID_FOR = {('A-J', 'Treasury'): 'treasury-hall', ('P', 'Pokémon Center Annex (ours)'): 'pokemon-center-annex-ours'}
NAME_FOR = {'treasury-hall': 'Treasury Hall'}

# What the engine does at T1. crewCap/storage/defense/dayActions/nightActions/restBonus: standing; morale/loyalty: every
# week to every member; income (dirty) / clean: ₽ a day; weekly: ₽ a week; heatDay: HQ district Heat down each night;
# heatWeek: same, weekly; control: district Control each week (the HQ's, or the outside building's own); heatOnce: the
# district's Heat down once when built; trainXp: crew Train tasks; injury: % off injury days; recruit: % on pitches;
# hireOff: % off Hire Grunt; launder: the fee in % (best one wins); treasury: ₽ kept safe in a raid (D9 raids read it);
# unlock: actions/tasks that need the room (field.json / tasks.json name it); items / weeklyItems: into the Bag each night /
# week; fatigue: % faster Fatigue recovery on Rest; repair: Condition back each week on every building; incomePct: % on
# the daily income.
FX = {
    'bunk-room': dict(crewCap=2), 'barracks': dict(crewCap=6, morale=5), 'mess-hall': dict(morale=3), 'rec-room': dict(morale=4),
    'card-den': dict(income=50), 'laundry': dict(heatDay=2), 'shrine-of-the-emblem': dict(loyalty=3),
    'library': dict(unlock=True), 'training-room': dict(trainXp=1), 'dojo': dict(trainXp=2, unlock=True),
    'infirmary': dict(injury=50), 'treasury': dict(treasury=10000), 'holding-pens': dict(unlock=True), 'kennel': dict(defense=1),
    'operations-room': dict(dayActions=1, unlock=True), 'radio-room': dict(unlock=True), 'front-office': dict(launder=5, unlock=True),
    'casino-floor': dict(income=300), 'laundering-room': dict(launder=10), 'protection-desk': dict(weekly=100),
    'workshop': dict(unlock=True), 'garage': dict(unlock=True), 'print-shop': dict(unlock=True), 'research-lab': dict(unlock=True),
    'trap-hall': dict(defense=1), 'executive-office': dict(dayActions=1), 'holding-cell': dict(unlock=True),
    'safehouse': dict(control=10, heatOnce=15), 'outpost': dict(crewCap=2), 'front-shop': dict(clean=150),
    'front-cafe': dict(clean=100), 'front-arcade': dict(clean=100), 'second-warehouse': dict(storage=100),
    'pet-corner': dict(morale=2), 'portrait-studio': dict(morale=1),
    'discipline-hall': dict(loyalty=3), 'cadet-quarters': dict(crewCap=2), 'grunt-mess': dict(morale=3), 'break-room': dict(morale=3),
    'pay-window': dict(loyalty=2), 'family-fund': dict(loyalty=2), 'bunk-block': dict(crewCap=3), 'pension-office': dict(loyalty=1),
    'smuggler-den': dict(income=100), 'racket-office': dict(weekly=100), 'street-patrol-station': dict(control=5),
    'vanguard-camp': dict(control=10), 'hall-of-ranks': dict(loyalty=2), 'grunt-cafe': dict(clean=80), 'grunt-arcade': dict(clean=100),
    'delivery-service': dict(clean=80), 'repair-shop': dict(clean=100), 'cleaning-crew': dict(heatWeek=5),
    'pokemon-storage': dict(storage=60), 'recruitment-center': dict(recruit=10, hireOff=25), 'luxury-suite': dict(restBonus=1),
    'night-shift': dict(nightActions=1, unlock=True),
    'berry-garden': dict(items={'oran-berry': 2}), 'pharmacy': dict(items={'potion': 1}), 'ball-foundry': dict(items={'poke-ball': 5}),
    'first-aid-closet': dict(weeklyItems={'revive': 2}), 'canteen-kitchen': dict(fatigue=10), 'fix-it-corner': dict(repair=10),
    'counting-room': dict(incomePct=5), 'night-market-stall': dict(income=80),
}
# Effects that only part works now (the rest waits): shown on the room card.
NOTE = {
    'barracks': None,
    'dojo': 'Stat classes come with ranks (D4).',
    'treasury': 'Raids on the HQ (D9) take only what is above this.',
    'kennel': 'Defense counts in raids on the HQ (D9).', 'trap-hall': 'Defense counts in raids on the HQ (D9).',
    'operations-room': 'Raid itself is D10.', 'front-office': 'Buy Out and Bribe are D10.',
    'radio-room': 'Spread the Word and jamming spies are D9-D10.', 'workshop': 'Sabotage and gadgets are D9-D10.',
    'garage': 'Smuggle is D10.', 'print-shop': 'Flyers are D10.', 'research-lab': 'Hit a Lab and breeding are D10.',
    'holding-pens': 'Cooling off stolen Pokémon comes with the Reserve (D4).', 'outpost': 'Its own 2 room slots come with many regions (D15).',
    'safehouse': None, 'luxury-suite': 'Debate +10% is D13; Executives\' Morale waits for ranks (D4).',
    'recruitment-center': 'The weekly walk-in is D6.', 'executive-office': 'Admins\' Hold +20% is D15.',
    'night-market-stall': 'The list gives no T1 number; ₽80 a day matches the Grunt Café.', 'berry-garden': 'One berry kind until the Cold Cellar (later).', 'card-den': 'The cheat chance comes with the Ledger (D6).', 'infirmary': 'Free healing: Rest already heals the team.',
}
# Slices for the rest, by the first keyword found in the row (effect, per tier, capstone).
WAITS = [
    (r'Debate|rhetoric|rehears', 'D13'), (r'Dread|Regard|emblem|Banner|Propaganda|headline|Morning Report|Culture', 'D6'),
    (r'squad|Squad|Elite', 'D8'), (r'promot|Sergeant|Lieutenant|Captain|Admin cap|rank|trait|skill|mentor|exam|cadet|Pair Admin', 'D4'),
    (r'Intel|spy|spies|Spy|rival|raid|Raid|guard|Guard|attack|alarm|Alarm|fire|Fire|escape|capture|wall|Wall|trap|Trap|intrud|Lockdown|decoy|envoy|tap|Counterintel|camera|cams|Surveillance|drone|mech|Prisoner|captured|Interrog|cell|walkout|mutiny|slack', 'D9'),
    (r'Smuggl|route|ship|tunnel|sea|Buy Out|Bribe|Flyer|flyer|Sabotage|Gym|gym|Black|banned|Auction|bid|Pawn|Loot|loot|Counterfeit|Coin|Forg|permit|lend|Lend|interest|robbery|plot|mission|takedown|debts|Fence', 'D10'),
    (r'tribute|held region|prefect|Seat|Rule|decree|Legendary|Blessing|Teleport', 'D15'),
    (r'Hero', 'D11'),
]


def waits_for(text):
    for pat, s in WAITS:
        if re.search(pat, text):
            return s
    return 'later'


def num(t):
    t = t.replace(',', '').strip()
    return int(t) if t.isdigit() else 0


# HQ tier needed to place a T1 (buildings.md §1): A, B, C, D at the Warehouse; E-H Hideout; I Compound; J a held district.
MIN_TIER = {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 1, 'F': 1, 'G': 1, 'H': 1, 'I': 2, 'J': 0, 'P': 1, 'Q': 1}

rows = []


def read(path, kind):
    group, gname = None, None
    for line in open(path, encoding='utf-8'):
        h = re.match(r'^#{3,4} ([A-J]|P\d|G\d)\.? (.+?) \(\d+\)', line)
        if h:
            group, gname = h.group(1), h.group(2)
            continue
        m = re.match(r'^\| *([PG]?\d+) *\|(.+)\|\s*$', line)
        if not m or group is None:
            continue
        cells = [c.strip() for c in m.group(2).split('|')]
        if len(cells) != 7:
            continue
        name, slots, cost, t1, per, cap, ladder = cells
        star = '★' in name
        name = name.replace('★', '').strip()
        key = ('A-J' if kind == 'main' else m.group(1)[0], name)
        shown = RENAME.get(name, name) if kind == 'main' else name
        bid = ID_FOR.get(key) or slug(shown)
        shown = NAME_FOR.get(bid, shown)
        g = group if kind == 'main' else ('P' if group.startswith('P') else 'Q')
        outside = slots in ('—', '-')
        grunt_outside = kind != 'main' and group in ('G3', 'G5')
        rows.append(dict(
            n=m.group(1), id=bid, name=shown, listName=name, group=g, sub=group if kind != 'main' else None, groupName=gname,
            focus='hq' if kind == 'main' else ('pokemon' if group.startswith('P') else 'grunt'),
            part3=star, slots=0 if outside else num(slots) or 1, outside=outside or (g == 'J'), canOutside=grunt_outside,
            cost=num(cost), t1=t1, per=per, cap=cap, ladder=[x.strip() for x in ladder.split('›')],
        ))


read(f'{lists}/buildings.md', 'main')
read(f'{lists}/buildings-pokemon-and-grunt.md', 'pg')

EXTRA = [  # Part 3 §3.2 rooms not in the lists (Kice's poster names three of them).
    dict(n='X1', id='pokemon-storage', name='Pokémon Storage', group='D', slots=1, cost=1000, t1='Stores +60 Pokémon (the Warehouse holds 20); crew can draw Pokémon from it', per='+30 Pokémon', ladder=['Crates', 'Pens', 'Storage', 'Racks', 'Bays', 'Vaults', 'Archive', 'Ark']),
    dict(n='X2', id='recruitment-center', name='Recruitment Center', group='A', slots=1, cost=3500, t1='+1 walk-in recruit candidate a week; recruit attempts +10%; Hire Grunt costs −25%', per='+5% recruit', ladder=['Table', 'Desk', 'Office', 'Center', 'Bureau', 'Hall', 'Institute', 'Grand Hall']),
    dict(n='X3', id='luxury-suite', name='Luxury Suite', group='A', slots=1, cost=12000, t1="Boss's quarters: Boss rests give +2 Day actions instead of +1; Debates and recruit meetings held here +10%; Executives' Morale +10", per='+5% meetings', ladder=['Room', 'Suite', 'Apartment', 'Penthouse', 'Loft', 'Manor Wing', 'Palace Wing', 'Royal Suite']),
    dict(n='X4', id='night-shift', name='Night Shift', group='E', slots=1, cost=5000, t1='+1 Night action', per='+1 night crew', ladder=['Lamp', 'Shift', 'Crew', 'Watch', 'Guard', 'Patrol', 'Company', 'Night Legion']),
    dict(n='X5', id='snag-desk', name='Snag Desk', group='G', slots=1, cost=0, t1='Built by Team Snagem (deal only)', per='—', ladder=['Desk'] * 8, deal='D16'),
    dict(n='X6', id='shadow-lab', name='Shadow Lab', group='G', slots=1, cost=0, t1='Built by Team Cipher (deal only)', per='—', ladder=['Lab'] * 8, deal='D16'),
]
for e in EXTRA:
    rows.append(dict(listName=e['name'], groupName='Part 3 §3.2', focus='hq', part3=True, outside=False, canOutside=False, cap='—', sub=None, **e))

ids = set()
for r in rows:
    assert r['id'] not in ids, r['id']
    ids.add(r['id'])
    assert len(r['ladder']) == 8, (r['id'], r['ladder'])
    fx = FX.get(r['id'])
    r['minTier'] = 5 if r['id'] == 'throne-room' else MIN_TIER[r['group']]
    deal = r.pop('deal', None)
    if deal:
        r.update(status='disabled', waits=deal, fx={})
    elif fx:
        note = NOTE.get(r['id'])
        r.update(status='limited' if note else 'supported', fx=fx, waits=None)
        if note:
            r['note'] = note
    else:
        r.update(status='disabled', waits='D14' if r['id'] == 'throne-room' else waits_for(' '.join([r['t1'], r['per'], r['cap']])), fx={})
    if r['sub'] is None:
        del r['sub']

for k in FX:
    assert k in ids, k
counts = {'main': sum(1 for r in rows if r['n'].isdigit()), 'P': sum(1 for r in rows if r['n'][0] == 'P'), 'G': sum(1 for r in rows if r['n'][0] == 'G'), 'X': sum(1 for r in rows if r['n'][0] == 'X')}
assert counts == {'main': 150, 'P': 50, 'G': 60, 'X': 6}, counts

data = {
    '_source': 'plans/evil-mode-rework/lists/buildings.md (1-150) + buildings-pokemon-and-grunt.md (P1-P50, G1-G60), word for word; Part 3 §3.2 extras X1-X6; tools/dominion/buildings-to-json.py FX',
    'buildings': rows,
}
with open(out, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
    f.write('\n')
st = {}
for r in rows:
    st[r['status']] = st.get(r['status'], 0) + 1
print(len(rows), 'buildings', st)
