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
    7: dict(kind='pens'),
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
    73: dict(kind='catch'),
    75: dict(kind='tend'),
    79: dict(kind='release'),
    80: dict(kind='rehab'),
    81: dict(kind='feed'),
    82: dict(kind='berries'),
    102: dict(kind='money', funds=[20, 80]),
    # D6: district tasks (kind 'district', done in the member's district; n = [task Lv 1-2, Lv 3+]).
    5: dict(kind='district', does='patrol', n=[3, 5], note='Rival jobs losing odds there wait for the rival team (D9).'),
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
    # D11: the Hero tasks (hero.ts).
    45: dict(kind='hero', does='track', heat=1, risky=True),
    118: dict(kind='hero', does='counter', heat=0, risky=True),
    145: dict(kind='hero', does='hunt', heat=2, risky=True),
    # D9: the rival team (rivals.ts runs the new kinds). Guards count in raid defence (Part 3 §4).
    2: dict(kind='guard', note='Counts in raids on the HQ; guarding one outside building comes with D10.'),
    4: dict(kind='guard'), 10: dict(kind='guard'), 11: dict(kind='guard'), 138: dict(kind='guard'),
    90: dict(kind='guard', note='Counts as a guard against Warehouse grabs; stored goods come with D10.'),
    38: dict(kind='rivalSpy'),
    39: dict(kind='rivalIntel'), 41: dict(kind='rivalIntel'), 43: dict(kind='rivalIntel'), 48: dict(kind='rivalIntel'), 137: dict(kind='rivalIntel'),
    44: dict(kind='counterSpy'), 51: dict(kind='counterSpy'),
    54: dict(kind='poachRival'), 60: dict(kind='poachRival', note='Defectors come as leads; a double agent waits for D22.'),
    70: dict(kind='drills'),
    131: dict(kind='rivalHit'), 132: dict(kind='rivalHit', risky=True), 133: dict(kind='rivalHit', funds=[100, 400], risky=True),
    134: dict(kind='rivalHit', heat=4, risky=True, caughtHeat=6), 142: dict(kind='rivalHit', risky=True),
    135: dict(kind='rescue', risky=True),
    139: dict(kind='rumours'),
    140: dict(kind='truceTalk'),
    # D8 (squads.ts): pairs two members; an Executive leads five on their tasks.
    58: dict(kind='matchMake', note='The bond trait (level 3) and swapping Pokémon in a doubles battle (level 4) wait for squads in battle (D10).'),
    141: dict(kind='runCrew', note='Level 4 (no failures from miscommunication) has nothing to stop yet: crew tasks have no miscommunication roll.'),
    # D10 (growth.ts): hauls, fronts, the Fence, flyers, fossils, the stores.
    8: dict(kind='haul', funds=[60, 200], note='Pays more on each smuggling route you run; a hijack is a failed run.'),
    15: dict(kind='money', funds=[80, 240], risky=True, caughtHeat=3),
    16: dict(kind='front', funds=[40, 140], room='front-office', note='Keeps the Loan Shark\'s books: pays as a front; the loans themselves are the Boss\'s action.'),
    18: dict(kind='money', funds=[40, 160], risky=True, caughtHeat=4),
    19: dict(kind='front', funds=[40, 160]),
    22: dict(kind='front', funds=[60, 200], note='Runs as a front; buying stolen goods cheap is the Fence\'s job.'),
    33: dict(kind='fence', funds=[60, 220]),
    50: dict(kind='flyers', room='print-shop'),
    83: dict(kind='revive', room='research-lab'),
    85: dict(kind='haul', funds=[200, 600], risky=True, heat=2, caughtHeat=6, room='garage'),
    86: dict(kind='haul', funds=[80, 240], room='garage'),
    87: dict(kind='haul', funds=[100, 300], room='garage', note='No boat check yet: any member can sail.'),
    88: dict(kind='haul', funds=[120, 360], risky=True, caughtHeat=4, room='garage', note='No Flying Pokémon check yet.'),
    89: dict(kind='stock'),
    91: dict(kind='district', does='cool', n=[1, 2], note='The hiding place cools its district; the Boss\'s Safehouse Network is the action.'),
    92: dict(kind='haul', funds=[60, 180], note='Clears cargo as a paid haul; customs as its own system is later.'),
    93: dict(kind='haul', funds=[60, 180], room='workshop', note='Digs as a paid haul; the Boss\'s Tunnel action hides the HQ.'),
    94: dict(kind='fence', funds=[40, 160]),
    95: dict(kind='scout', note='The drop saves a Boss action like Scout.'),
    96: dict(kind='money', funds=[120, 360], risky=True, heat=2, caughtHeat=6),
    97: dict(kind='front', funds=[60, 200]),
    98: dict(kind='front', funds=[30, 120]),
    99: dict(kind='front', funds=[40, 140]),
    100: dict(kind='rally'),
    101: dict(kind='front', funds=[30, 120], note='Paid repairs for the neighbourhood; fixing your own vehicles waits for vehicle wear (later).'),
    103: dict(kind='flyers', room='print-shop'),
    104: dict(kind='district', does='regard', n=[1, 2], room='radio-room'),
    105: dict(kind='front', funds=[60, 220]),
    106: dict(kind='front', funds=[40, 160], note='A stall pays as a front; it isn\'t a business you can buy yet.'),
    107: dict(kind='front', funds=[40, 160], note='Pays as a front; lower costs on rooms are later.'),
    108: dict(kind='front', funds=[100, 400], risky=True, caughtHeat=4),
    109: dict(kind='flyers'),
}

# The slice each disabled row waits for: by section, then by row.
NEEDS_SECTION = {'A': 'D5', 'B': 'D10', 'C': 'D2', 'D': 'D9', 'E': 'D9', 'F': 'D5', 'G': 'D5', 'H': 'D10', 'I': 'D10', 'J': 'D6', 'K': 'D15', 'L': 'D9', 'M': 'D14'}
NEEDS_ROW = {
    4: 'D9', 5: 'D6', 6: 'D2', 8: 'D10', 9: 'D2', 11: 'D9', 13: 'D6', 23: 'D6', 2: 'D9', 10: 'D9', 67: 'D4', 32: 'D6', 33: 'D10',
    40: 'D6', 46: 'D2', 47: 'D6', 42: 'D2', 45: 'D11', 50: 'D10', 53: 'D6', 55: 'D2', 69: 'D4', 70: 'D9', 71: 'D7',
    83: 'D10', 84: 'D15', 89: 'D10', 90: 'D9', 91: 'D10', 109: 'D10', 118: 'D11', 119: 'D6', 124: 'D6', 128: 'D6',
    142: 'D9', 145: 'D11', 146: 'D6', 136: 'D23',
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


# ---------- D10: crew tasks 151-600 (team-actions-151-300.md, -301-450.md, -451-600.md) ----------
# Each section runs as one engine kind. The row's own five level steps are kept word for word and shown; what the engine
# does is the kind's (a section's rows differ in wording, not in rules), so a row is "supported" when its Lv 1 step is
# exactly what the kind does (pay in ₽, a stat's training) and "limited" otherwise, with a note naming the kind.
# AN (governing held regions) waits for D15 and AQ (executive projects, the takeover paths) for D14.
WORD = {'guard': 'a guard shift (counts in HQ defence)', 'audit': 'a books check (finds pocketed money)', 'money': 'a cash job',
        'catch': 'a catch for the Reserve', 'tend': 'Pokémon care', 'train': "the member's training", 'rally': 'a Morale lift for the crew',
        'recruit': 'a hunt for recruits', 'scout': 'scouting (saves a Boss action, finds Patrons)', 'front': 'clean money from a front',
        'haul': 'a haul (pays more on your smuggling routes)', 'district': 'district work', 'rivalIntel': 'intel on the rival team',
        'rivalHit': 'a hit on the rival team', 'trainMon': "training the member's Pokémon"}
SEC10 = {
    'N': dict(kind='guard'), 'O': dict(kind='audit'), 'P': dict(kind='money', risky=True, heat=2, caughtHeat=4),
    'Q': dict(kind='catch'), 'R': dict(kind='tend'), 'S': dict(kind='train'), 'T': dict(kind='rally'),
    'U': dict(kind='haul'), 'V': dict(kind='recruit'), 'W': dict(kind='money', risky=True, heat=3, caughtHeat=6),
    'X': dict(kind='scout'), 'Y': dict(kind='front'), 'Z': dict(kind='district', does='cool'), 'AA': dict(kind='district', does='regard'),
    'AB': dict(kind='rivalIntel'), 'AC': dict(kind='train'), 'AD': dict(kind='tend'), 'AE': dict(kind='haul', risky=True, heat=2, caughtHeat=5),
    'AF': dict(kind='rally'), 'AG': dict(kind='district', does='hold'), 'AH': None, 'AI': dict(kind='train', xp=2), 'AJ': dict(kind='guard'),
    'AK': dict(kind='front'), 'AL': dict(kind='district', does='regard'), 'AM': dict(kind='rivalHit'), 'AO': dict(kind='front'), 'AP': None,
}
NEEDS10 = {'AN': 'D15', 'AQ': 'D14'}
# AH (elite specialists) and AP (night crew): by the row's stat.
BY_STAT = {'stealth': dict(kind='money', risky=True, heat=3, caughtHeat=6), 'brawn': dict(kind='guard'), 'wits': dict(kind='scout'),
           'charm': dict(kind='recruit'), 'nerve': dict(kind='guard')}
RANK10 = dict(RANK, Senior='senior-grunt')
# A row is "supported" when its Lv 1 step says what the kind does.
SURE = {'rally': r'Morale \+', 'guard': r'raid|intruder|guard|warn|alarm|stops', 'catch': r'catch|bug|wild|Pokémon',
        'tend': r'Happiness|Friendship|heal|Potion', 'regard': r'Regard \+', 'dread': r'Dread \+', 'cool': r'Heat −',
        'recruit': r'inquiry|recruit|lead|joins', 'scout': r'see|spot|learn|watch|notes', 'rivalIntel': r'spot|learn|rival',
        'audit': r'₽|error|ledger|books'}


def lv1_cash(t):
    m = re.search(r'₽([\d,]+)', t)
    return int(m.group(1).replace(',', '')) if m else None


for f in ('team-actions-151-300.md', 'team-actions-301-450.md', 'team-actions-451-600.md'):
    for line in open(f'{lists}/{f}', encoding='utf-8'):
        m = re.match(r'^## ([A-Z]{1,2})\. (.+?) \(', line)
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
        stat = STAT[c[2]]
        t = dict(n=n, id=slug(clean(c[1])), name=clean(c[1]), section=section[0], group=section[1], stat=stat, min=RANK10[c[3]],
                 does=clean(c[4]), levels=levels, risk=clean(c[6]), source=f)
        if section[0] in NEEDS10:
            t['status'] = 'disabled'
            t['needs'] = NEEDS10[section[0]]
            tasks.append(t)
            continue
        e = dict(SEC10[section[0]] or BY_STAT[stat or 'wits'])
        cash = lv1_cash(levels[0])
        sure = False
        if e['kind'] in ('money', 'front', 'haul'):
            lo = cash or (20 if e['kind'] == 'front' else 40)
            e['funds'] = [lo, lo * 4]
            sure = cash is not None
        if e['kind'] == 'train':
            g = re.match(r'^(Brawn|Nerve|Wits|Charm|Stealth) \+', levels[0])
            grow = g.group(1).lower() if g else stat
            if grow:
                e['grow'] = grow
            sure = bool(g)
        if e['kind'] == 'district' and e.get('does') == 'regard' and re.search(r'Dread \+', levels[0]):
            e['does'] = 'dread'
        if e['kind'] == 'district':
            e['n'] = [1, 2]
        if re.search(SURE.get(e.get('does') or e['kind'], r'^$'), levels[0], re.I):
            sure = True
        t['status'] = 'supported' if sure else 'limited'
        if not sure:
            t['note'] = f"Lv 1 reads “{levels[0]}”; the task runs as {WORD[e['kind']]}."
        t['effect'] = e
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
                     risk='Caught', status='supported',
                     effect=dict(kind='steal', heat=3, risky=True, caughtHeat=6), source='Part 6 §4; player-actions.md 64'))
ids = [t['id'] for t in tasks]
dup = {i for i in ids if ids.count(i) > 1}
if dup:
    raise SystemExit(f'duplicate task ids {dup}')

json.dump({'_source': 'plans/evil-mode-rework/lists/team-actions.md (1-150) and team-actions-151-300/301-450/451-600.md (D10), word for word, + tools/dominion/lists-to-json.py ENGINE and SEC10',
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
