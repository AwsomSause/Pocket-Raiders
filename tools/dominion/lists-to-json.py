"""DOMINION slice D3: turns the crew lists into game data.

  lists/team-actions.md (tasks 1-150)  -> src/data/dominion/tasks.json
  lists/grunt-types.md  (types 1-150)  -> src/data/dominion/gruntTypes.json

The list text is kept word for word (name, what they do, the five levels, the risk). What the engine does with a task is
the ENGINE table below: a task the game can run now gets an effect and status "supported" (or "limited" when part of the
row waits on a later slice); every other row is "disabled" and names the slice that brings what it needs. Re-run after a
list changes:  python3 tools/dominion/lists-to-json.py <plans/evil-mode-rework/lists> src/data/dominion
"""
import json
import re
import sys

lists, out = sys.argv[1], sys.argv[2]

STAT = {'Brawn': 'brawn', 'Nerve': 'nerve', 'Wits': 'wits', 'Charm': 'charm', 'Stealth': 'stealth', '—': None, 'Stealth + Wits': 'stealth'}
RANK = {'Recruit': 'recruit', 'Grunt': 'grunt', 'Senior': 'senior-grunt', 'Sergeant': 'sergeant', 'Admin': 'admin', 'Executive': 'executive'}


def slug(t):
    t = t.lower().replace('é', 'e').replace("'", '').replace('’', '').replace('.', '')
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def clean(t):
    return t.replace('**', '').strip()


# What the engine does (Part 2 §2 and the list). funds: [low, high] by the stat (1 -> low, 10 -> high).
# risky: a failure is "caught" (Heat, personal Heat, maybe an arrest). note: what is still waiting (status limited).
ENGINE = {
    1: dict(kind='guard'),
    3: dict(kind='guard'),
    12: dict(kind='guard'),
    14: dict(kind='money', funds=[80, 240], heat=5, risky=True, note='Pays like a new shop each time; a crew shake-down doesn\'t make a Racket (the Boss\'s Extort does).'),
    20: dict(kind='money', funds=[20, 90], fine=30),
    21: dict(kind='money', funds=[40, 160], risky=True, caughtHeat=3),
    24: dict(kind='audit'),
    25: dict(kind='money', funds=[30, 200], risky=True),
    26: dict(kind='money', funds=[60, 180], risky=True),
    27: dict(kind='money', funds=[20, 100], risky=True),
    28: dict(kind='money', funds=[80, 260], heat=2, risky=True, caughtHeat=6),
    30: dict(kind='money', funds=[20, 120], risky=True),
    31: dict(kind='money', funds=[30, 140], risky=True, caughtHeat=3),
    37: dict(kind='scout', note='Saves a Boss action and finds Patrons; scouting a named target comes with the Region Map (D2).'),
    49: dict(kind='recruit', note='Moles come with the rival team (D9).'),
    52: dict(kind='welcome'),
    56: dict(kind='interview'),
    57: dict(kind='mentor'),
    59: dict(kind='rally'),
    61: dict(kind='train', sure=True),
    62: dict(kind='trainMon'),
    64: dict(kind='drills'),
    65: dict(kind='train', grow='brawn', xp=2, injury=10),
    66: dict(kind='coach'),
    68: dict(kind='train', grow='wits'),
    # D5: rooms open these.
    63: dict(kind='train', grow='wits', room='library'),
    17: dict(kind='audit'),
    72: dict(kind='rest', sure=True),
    73: dict(kind='catch', note='Catches go to the stores; the Reserve screen and hand assignment are D4.'),
    82: dict(kind='berries'),
    102: dict(kind='money', funds=[20, 80]),
    # D6: district tasks (kind 'district', done in the member's district; n = [task Lv 1-2, Lv 3+]).
    5: dict(kind='district', does='patrol', n=[3, 5], note='Rival jobs losing odds there wait for the rival team (D9); meeting the Hero waits for D11.'),
    13: dict(kind='district', does='collect', collect=[100, 100, 110, 110, 125], note='Being jumped by rivals waits for the rival team (D9).'),
    32: dict(kind='district', does='dread', n=[1, 2], heat=1, risky=True, caughtHeat=4),
    40: dict(kind='district', does='eavesdrop'),
    47: dict(kind='district', does='poll', sure=True),
    53: dict(kind='district', does='regard', n=[1, 2]),
    110: dict(kind='district', does='regard', n=[1, 2], risky=True, caughtHeat=3),
    111: dict(kind='district', does='song', n=[1, 2], mor=2),
    112: dict(kind='district', does='regard', n=[2, 4]),
    113: dict(kind='district', does='dread', n=[1, 2], risky=True, caughtHeat=2),
    114: dict(kind='district', does='cool', n=[2, 5]),
    115: dict(kind='district', does='poll', sure=True),
    116: dict(kind='district', does='party', n=[3, 6], cost=100, heat=1),
    117: dict(kind='district', does='regard', n=[2, 4]),
    119: dict(kind='district', does='hold', note='The income bonus at task Lv 2-3 waits for businesses (D10).'),
    124: dict(kind='district', does='line', n=[2, 3], note='Attacks on a district come with the rival team (D9); until then it keeps Heat from wearing Control down and pushes the rivals back.'),
    128: dict(kind='district', does='peace', n=[2, 4], note='Tension comes with the rival team (D9); until then it cools Heat there.'),
    146: dict(kind='district', does='face', n=[5, 10], note='A face who turns rival waits for betrayals (D15).'),
}

# The slice each disabled row waits for: by section, then by row.
NEEDS_SECTION = {'A': 'D5', 'B': 'D10', 'C': 'D2', 'D': 'D9', 'E': 'D9', 'F': 'D5', 'G': 'D4', 'H': 'D10', 'I': 'D10', 'J': 'D6', 'K': 'D15', 'L': 'D9', 'M': 'D14'}
NEEDS_ROW = {
    4: 'D9', 5: 'D6', 6: 'D2', 7: 'D4', 8: 'D10', 9: 'D2', 11: 'D9', 13: 'D6', 23: 'D6', 2: 'D9', 10: 'D9', 67: 'D4', 32: 'D6', 33: 'D10',
    40: 'D6', 46: 'D2', 47: 'D6', 42: 'D2', 45: 'D11', 50: 'D10', 53: 'D6', 55: 'D2', 58: 'D8', 69: 'D4', 70: 'D9', 71: 'D7',
    83: 'D10', 84: 'D11', 89: 'D10', 90: 'D9', 91: 'D10', 109: 'D10', 118: 'D11', 119: 'D6', 124: 'D6', 128: 'D6', 141: 'D8',
    142: 'D9', 145: 'D11', 146: 'D6',
}

tasks = []
section = None
for line in open(f'{lists}/team-actions.md', encoding='utf-8'):
    m = re.match(r'^## ([A-M])\. (.+?) \(', line)
    if m:
        section = (m.group(1), m.group(2).strip())
        continue
    if not re.match(r'^\| \d+ \| \*\*', line):
        continue
    c = [x.strip() for x in line.strip().strip('|').split('|')]
    n = int(c[0])
    levels = [clean(x) for x in c[5].split('→')]
    if len(levels) != 5:
        raise SystemExit(f'task {n}: {len(levels)} levels')
    t = dict(n=n, id=slug(clean(c[1])), name=clean(c[1]), section=section[0], group=section[1], stat=STAT[c[2]], min=RANK[c[3]],
             does=clean(c[4]), levels=levels, risk=clean(c[6]))
    e = ENGINE.get(n)
    if e:
        e = dict(e)
        note = e.pop('note', None)
        room = e.pop('room', None)
        if room:
            t['room'] = room
        t['status'] = 'limited' if note else 'supported'
        if note:
            t['note'] = note
        t['effect'] = e
    else:
        t['status'] = 'disabled'
        t['needs'] = NEEDS_ROW.get(n, NEEDS_SECTION[section[0]])
    tasks.append(t)

# Two tasks named outside the list: Rest (Part 2 §2's table) and Steal Pokémon (Part 6 §4's quick task, the crew's
# version of player action 64, Kidnap a Pokémon from an adult's home).
tasks.insert(0, dict(n=0, id='rest', name='Rest', section='F', group='Training and Growth', stat=None, min='hopeful',
                     does='Take the day off', levels=['Morale +15, heals injuries', 'Fatigue falls faster', 'Morale +20',
                                                       'Personal Heat cools faster', 'Morale +25 and a free XP'],
                     risk='—', status='supported', effect=dict(kind='rest', sure=True), source='Part 2 §2'))
tasks.insert(1, dict(n=0, id='steal-pokemon', name='Steal Pokémon', section='C', group='Street Crime', stat='stealth', min='grunt',
                     does="Take a Pokémon from an adult's home", levels=['One Pokémon', 'Take a second one too', 'A pair',
                                                                          'The owner never knows who did it', 'A rare one (never from a minor)'],
                     risk='Caught', status='limited', note='Goes to the stores; the Reserve screen is D4.',
                     effect=dict(kind='steal', heat=3, risky=True, caughtHeat=6), source='Part 6 §4; player-actions.md 64'))
ids = [t['id'] for t in tasks]
dup = {i for i in ids if ids.count(i) > 1}
if dup:
    raise SystemExit(f'duplicate task ids {dup}')

json.dump({'_source': 'plans/evil-mode-rework/lists/team-actions.md (1-150, word for word) + tools/dominion/lists-to-json.py ENGINE',
           'tasks': tasks}, open(f'{out}/tasks.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------- grunt types ----------
LEAN = {'B': 'brawn', 'N': 'nerve', 'W': 'wits', 'C': 'charm', 'S': 'stealth'}
BEST = {'Guard': 'guard-hq', 'Collect': 'collect', 'Shake Down': 'shake-down', 'Scout': 'scout', 'Recruit': 'recruit', 'Train': 'train',
        'Smuggle': 'smuggle', 'Work the Front': 'work-the-front', 'Hold': 'hold', 'Catch': 'catch', 'Pickpocket': 'pickpocket',
        'Spy': 'spy', 'Post Flyers': 'post-flyers', 'Rest': 'rest'}
REGION = {'Kanto': 'kanto', 'Johto': 'johto', 'Hoenn': 'hoenn', 'Sinnoh': 'sinnoh', 'Unova': 'unova', 'Kalos': 'kalos', 'Alola': 'alola', 'Galar': 'galar', 'Paldea': 'paldea'}
types, traits = [], {}
group = None
for line in open(f'{lists}/grunt-types.md', encoding='utf-8'):
    m = re.match(r'^## ([A-O])\. (.+?) — Found: (.+)$', line)
    if m:
        group = (m.group(1), m.group(2).strip(), m.group(3).strip())
        continue
    if not re.match(r'^\| \d+ \|', line):
        continue
    c = [x.strip() for x in line.strip().strip('|').split('|')]
    n = int(c[0])
    name = c[1]
    region = None
    rm = re.match(r'^(Kanto|Johto|Hoenn|Sinnoh|Unova|Kalos|Alola|Galar|Paldea): (.+)$', name)
    if rm:
        region, name = REGION[rm.group(1)], rm.group(2)
    best = c[6]
    if best not in BEST:
        raise SystemExit(f'type {n}: best at {best!r}')
    gm = re.match(r'^\*?([^*(]+?)\*?\s*(?:\((.+)\))?$', c[7])
    grows, effect = gm.group(1).strip(), (gm.group(2) or '').strip()
    if effect and grows not in traits:
        traits[grows] = effect
    favours = [x.strip() for x in c[5].split(',')]
    types.append(dict(n=n, id=f't{n}', name=name, group=group[1].title() if group[1].isupper() else group[1], found=group[2],
                      rarity=c[2], lean=LEAN[c[3]], green=slug(c[4]), favours=favours, bestAt=BEST[best], grows=slug(grows),
                      **({'region': region} if region else {}), **({'once': True} if n == 150 else {})))
json.dump({'_source': 'plans/evil-mode-rework/lists/grunt-types.md (1-150) via tools/dominion/lists-to-json.py', 'types': types,
           '_newTraits': traits}, open(f'{out}/gruntTypes.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(tasks), 'tasks', sum(t['status'] != 'disabled' for t in tasks), 'live;', len(types), 'grunt types;', len(traits), 'trait effects from the list')
