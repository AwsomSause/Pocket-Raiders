#!/usr/bin/env python3
"""DOMINION D9: turns two design lists into game data (run with python3 -I).

  python3 -I tools/dominion/rivals-to-json.py <lists dir>

reads  lists/rival-team-actions.md   -> src/data/dominion/rivalActions.json (all 150, word for word, numbers by tier)
       lists/outside-interactions.md -> src/data/dominion/outside.json      (all 300 rows; section F is D9's)

Each rival action gets the engine `kind` that carries it out (KIND below) and a status: supported (the kind does what the
row says), limited (the kind does the main part; `note` says what waits) or disabled (`waits` names the slice). The rival
AI only ever picks live actions.
"""
import json
import os
import re
import sys

src = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/plans/evil-mode-rework/lists'
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.normpath(os.path.join(here, '..', '..'))

STAGE = {'Watching': 'watching', 'Annoyed': 'annoyed', 'Hostile': 'hostile', 'At war': 'war', 'Boss': 'boss'}

# The ladders the list writes out (T1..T8), recognised by their exact numbers. D and N share numbers: the word after
# them decides ("day(s)", "week(s)" = D).
LADDERS = {
    'S': '2/3/4/5/6/8/10/12',
    'M': '₽300/600/1.2k/2.5k/5k/9k/16k/30k',
    'P': '5/8/11/15/19/24/30/36',
    'D': '1/1/2/2/3/3/4/5',
    'H': '+2/+3/+4/+6/+8/+10/+13/+16',
    'C': '−10/−8/−6/−5/−4/−3/−2/−1',
    'R': '1/2/3/4/5/6/7/8',
}

# kind: what the engine does (src/core/dominion/rivals.ts `KINDS`). (kind, status, note-or-waits)
S, L, X = 'supported', 'limited', 'disabled'
KIND = {
    # A. Spies and intel
    1: ('spy', S, None), 2: ('intel', L, 'Knowing your assignments early shows as raid odds; the day-by-day leak is D22.'),
    3: ('intel', L, 'Watchers lower raid defence; the sneak odds on hands-on Cards wait for D22.'), 4: ('heat', S, None),
    5: ('rent', S, None), 6: ('intel', S, None), 7: ('money', S, None), 8: ('intel', L, 'Shown as raid odds; type advantage in fights waits for D10.'),
    9: ('intel', L, 'Poaching odds read the same intel.'), 10: ('sweep', S, None),
    # B. Sabotage of your buildings
    11: ('closed', S, None), 12: ('cond', S, None), 13: ('mood', S, None), 14: ('cond', S, None),
    15: ('money', L, 'Shops come with D10; the skipped restock is taken as money.'), 16: ('money', S, None),
    17: ('jam', S, None), 18: ('cond', S, None), 19: ('racket', S, None), 20: ('closed', S, None),
    # C. Raids on your holdings
    21: ('smash', S, None), 22: ('vault', S, None), 23: ('stealMon', S, None), 24: ('smash', S, None),
    25: ('racket', S, None), 26: ('smash', S, None), 27: ('kidnap', S, None), 28: ('smash', S, None),
    29: ('cond', S, None), 30: ('burn', S, None),
    # D. Poaching your crew
    31: ('poach', S, None), 32: ('loyalty1', S, None), 33: ('loyalty', S, None), 34: ('stealMon', L, 'Takes from the Stores until members\' own teams can be raided (D4).'),
    35: ('closed', S, None), 36: ('poach', S, None), 37: ('recruitCut', S, None), 38: ('mood', S, None),
    39: ('spy', S, None), 40: ('loyalty', S, None),
    # E. Economy warfare
    41: ('skim', S, None), 42: ('money', L, 'Shops come with D10; the lost stock is taken as money.'), 43: ('money', L, 'Shops come with D10; the dearer stock is taken as money.'),
    44: ('money', S, None), 45: ('smash', S, None), 46: ('skim', S, None), 47: ('money', L, 'Frozen money is taken outright until the Ledger can lock it (D6).'),
    48: ('racket', S, None), 49: ('money', L, 'Buy Outs come with D10.'), 50: ('heat', S, None),
    # F. Smears, news and fear
    51: ('regard', S, None), 52: ('heat', S, None), 53: ('gymSmear', S, None), 54: ('heat', S, None), 55: ('loyalty1', S, None),
    56: ('heat', S, None), 57: ('regard', S, None), 58: ('recruitCut', S, None), 59: ('hero', S, None), 60: ('heat', S, None),
    # G. Using the Hero, police and Gyms
    61: ('heat', S, None), 62: ('gymRefuse', S, None), 63: ('hero', S, None), 64: (None, X, 'D14'), 65: ('heat', S, None),
    66: ('closed', S, None), 67: ('heat', S, None), 68: ('money', S, None), 69: ('gymFrame', S, None), 70: ('hero', S, None),
    # H. Territory
    71: ('control', S, None), 72: ('control', S, None), 73: ('recruitCut', S, None), 74: ('racket', S, None), 75: ('control', S, None),
    76: (None, X, 'D15'), 77: ('regard', S, None), 78: ('skim', S, None), 79: ('gymAnnex', S, None), 80: ('control', L, 'The wall is their Control; battle accuracy waits for D10.'),
    # I. Admin field battles
    81: ('fight', S, None), 82: ('fight', S, None), 83: ('control', S, None), 84: ('fight', S, None), 85: ('demand', S, None),
    86: ('deal', S, None), 87: ('fight', S, None), 88: (None, X, 'D11'), 89: ('fight', S, None), 90: ('defect', S, None),
    # J. Boss moves
    91: ('bossRaid', S, None), 92: ('demand', S, None), 93: ('fight', S, None), 94: ('bossRaid', S, None), 95: ('recruitCut', S, None),
    96: ('truce', S, None), 97: ('fight', S, None), 98: ('bossRaid', S, None), 99: ('deal', S, None), 100: ('tension', S, None),
    # K. Their own house
    101: ('grow', S, None), 102: ('grow', S, None), 103: ('grow', S, None), 104: ('grow', S, None), 105: ('grow', S, None),
    106: ('research', S, None), 107: ('arm', S, None), 108: ('grow', S, None), 109: ('hide', S, None), 110: ('research', S, None),
    # L. Diplomacy and alliances
    111: ('deal', L, 'A joint raid is offered as paid work; the Debate rule is D13.'), 112: ('demand', S, None), 113: ('deal', S, None), 114: ('deal', S, None),
    115: ('truce', S, None), 116: ('poach', L, 'The swap is one way until D16 adds trades.'), 117: ('heat', S, None), 118: ('debate', S, None), 119: ('debate', S, None), 120: ('tension', S, None),
    # M. Pokémon schemes
    121: ('mood', L, 'Pokémon XP loss waits for D10; the crew feel it as Morale.'), 122: ('fight', S, None), 123: ('skim', S, None),
    124: (None, X, 'D4'), 125: (None, X, 'D11'), 126: ('grow', S, None), 127: ('grow', S, None), 128: ('gymWeaken', S, None),
    129: ('cond', S, None), 130: ('turned', S, None),
    # N. Covert ops and terror
    131: ('racket', S, None), 132: ('intel', S, None), 133: ('skim', S, None), 134: ('regard', S, None), 135: ('hurt', S, None),
    136: ('mood', S, None), 137: ('closed', S, None), 138: ('grow', S, None), 139: ('skim', S, None), 140: ('money', S, None),
    # O. Finishers and desperate moves
    141: ('bossRaid', S, None), 142: ('burn', S, None), 143: ('bossRaid', L, 'The trap left behind waits for D14\'s Wipe Out.'), 144: (None, X, 'D11'),
    145: (None, X, 'D11'), 146: ('fight', S, None), 147: ('regard', S, None), 148: ('loyalty', S, None), 149: ('burn', S, None),
    150: (None, X, 'D14'),
}


def ladders_in(text):
    out = []
    for k, v in LADDERS.items():
        start = 0
        while True:
            i = text.find(v, start)
            if i < 0:
                break
            if k == 'D':
                after = text[i + len(v):i + len(v) + 8]
                if not re.match(r'\s*(day|week)', after):
                    k2 = 'N'
                else:
                    k2 = 'D'
                if k2 not in out:
                    out.append(k2)
            elif k not in out:
                out.append(k)
            start = i + len(v)
    return out


def actions():
    text = open(os.path.join(src, 'rival-team-actions.md'), encoding='utf-8').read()
    cats = {}
    cat = None
    rows = []
    for line in text.splitlines():
        m = re.match(r'^### ([A-O])\. (.+)$', line)
        if m:
            cat = m.group(1)
            cats[cat] = m.group(2).strip()
            continue
        m = re.match(r'^(\d+)\. \*\*(.+?)\*\* · from ([A-Za-z ]+) — (.*?)\s*\*Milestones: (.*)\*\s*$', line)
        if not m:
            continue
        n = int(m.group(1))
        text_ = m.group(4).strip()
        ms = {}
        for t, body in re.findall(r'T(\d) ([^;]+?)(?=; T\d|$)', m.group(5).strip()):
            ms[t] = body.strip().rstrip('.')
        kind, status, extra = KIND[n]
        row = {
            'n': n, 'id': re.sub(r'[^a-z0-9]+', '-', m.group(2).lower().replace("'", '').replace('’', '')).strip('-'),
            'name': m.group(2).strip(), 'cat': cat, 'stage': STAGE[m.group(3).strip()], 'text': text_,
            'uses': ladders_in(text_), 'milestones': ms, 'status': status,
        }
        if kind:
            row['kind'] = kind
        if status == L:
            row['note'] = extra
        if status == X:
            row['waits'] = extra
        rows.append(row)
    assert len(rows) == 150, len(rows)
    assert sorted(r['n'] for r in rows) == list(range(1, 151))
    assert len({r['id'] for r in rows}) == 150
    for r in rows:
        assert len(r['milestones']) == 3, (r['n'], r['milestones'])
    return {
        '_source': 'plans/evil-mode-rework/lists/rival-team-actions.md, word for word (tools/dominion/rivals-to-json.py)',
        'categories': cats,
        'ladders': {k: [float(x.replace('₽', '').replace('k', '')) * (1000 if 'k' in x else 1) if k == 'M' else int(x.replace('+', '').replace('−', '-')) for x in v.split('/')] for k, v in LADDERS.items()} | {'N': [1, 1, 2, 2, 3, 3, 4, 5]},
        'actions': rows,
    }


# Outside interactions: the slice each section waits for (F is D9's; A and J are D6b's, town.ts and town.json; B-E, H, I, K the D10 follow-up's). Marks: 🔒 minor lock, 🌙 night, ☀ day, ⟳ scales, 🔗 chain.
SECTION_WAITS = {'A': None, 'B': None, 'C': None, 'D': None, 'E': None, 'F': None, 'G': 'D11', 'H': None, 'I': None, 'J': None, 'K': None, 'L': 'D15'}
# D10 follow-up: street rows that only do part of what the list says (tools/dominion/outside-d10.py plays them).
OUTSIDE_LIMITED = {
    'O032': 'Buying the building later is the Buy Out on the Card; here it only earns a little Regard.',
    'O036': 'Berries are not in the Bag yet: a Hyper Potion stands in.',
    'O038': 'TMs teach on the spot and can\'t sit in the Bag: the hidden find is a Water Stone.',
    'O041': 'The Egg hatches at once into a Pokémon from the region.',
    'O044': 'The banker\'s loan is the Take a Loan action; a bribe gives dirt on him instead.',
    'O059': 'Apricorn Balls: a Fast Ball.',
    'O060': 'The Hero\'s next stop shows as less of the Hero\'s attention.',
    'O062': 'Going around costs no day.',
    'O064': 'Looker\'s three clues are told as Heat and Wanted.',
    'O067': 'A raid on the evidence room frees a jailed member if there is one.',
    'O071': 'Pleading needs no Lawyer: a Charm test.',
    'O072': 'Handing the member over costs Morale instead of the member.',
    'O076': 'The stolen Pokémon stays with you.',
    'O080': 'Your seized gear comes back as an Ultra Ball.',
    'O085': 'Breaking the curfew is a plain Heat risk; the flyers are not printed.',
    'O089': 'The +10 Takeover odds are one more scouting point on the Gym.',
    'O100': 'The Crackdown week odds show as Wanted.',
    'O102': 'The Monarch route flag waits for D14\'s League; the entry only earns standing.',
    'O104': 'The family business pays as a weekly racket instead of a Buy Out.',
    'O105': 'The badge itself stays: the theft leaves dirt on the Gym.',
    'O114': 'The Egg hatches at once.',
    'O120': 'The double battle is a single battle.',
    'O122': 'No boat check: a Brawn test.',
    'O129': 'The hints scout the district.',
    'O133': 'The Speed test is a Stealth test.',
    'O187': 'Hitting the lab here pays money; the rare Pokémon comes from the Lab Hit action.',
    'O190': 'The fossil is revived at once.',
    'O193': 'The partnership pays as a weekly racket.',
    'O206': 'Tracking it to its den scouts the district.',
    'O207': 'Going round costs no time.',
    'O208': 'The three-day hunt is one battle; the find is not always shiny.',
    'O216': 'Berries are not in the Bag yet: Potions stand in.',
    'O217': 'No Poké Flute in the game yet: waking it is a Charm test.',
    'O218': 'Marking the cave as a stash makes it a safehouse.',
    'O220': 'The Egg hatches at once.',
    'O225': 'Waiting costs no action; moving unseen is a day\'s cover and Stealth XP; the ambush is a fight.',
    'O227': 'The legend\'s trail is one Wits test (the legend itself comes with D11 and D15).',
    'O228': 'No spare is given in the swap.',
    'O253': 'The guild\'s +10% Thieve is Stealth XP for the Boss.',
    'O258': 'The hit lowers the rival\'s intel and raises Tension, not their team.',
    'O265': 'Acting on the tip pays as a quick Steal.',
    'O266': 'No Lawyer needed: a Wits test.',
    'O268': 'The driver keeps the police off here for three days.',
}


def outside():
    text = open(os.path.join(src, 'outside-interactions.md'), encoding='utf-8').read()
    rows = []
    sec = None
    names = {}
    for line in text.splitlines():
        m = re.match(r'^## ([A-L])\. (.+?) \(O\d+', line)
        if m:
            sec = m.group(1)
            names[sec] = m.group(2).strip().title()
            continue
        m = re.match(r'^\| (O\d{3}) \| (.+?) \| (.+?) \| (.+?) \|\s*$', line)
        if not m:
            continue
        what = m.group(2).strip()
        marks = [k for k, v in (('minor', '🔒'), ('night', '🌙'), ('day', '☀'), ('scales', '⟳'), ('chain', '🔗')) if v in what or v in m.group(4)]
        for sym in ('🔒', '🌙', '☀', '⟳', '🔗'):
            what = what.replace(sym, '').strip()
        rows.append({
            'id': m.group(1), 'section': sec, 'what': what, 'who': m.group(3).strip(),
            'choices': [c.strip().replace(' ⟳', '').replace('⟳', '').strip() for c in m.group(4).split(' / ')],
            'marks': marks, 'status': 'disabled' if SECTION_WAITS[sec] else 'limited' if m.group(1) in OUTSIDE_LIMITED else 'supported',
            **({'waits': SECTION_WAITS[sec]} if SECTION_WAITS[sec] else {}),
            **({'note': OUTSIDE_LIMITED[m.group(1)]} if not SECTION_WAITS[sec] and m.group(1) in OUTSIDE_LIMITED else {}),
        })
    assert len(rows) == 300, len(rows)
    return {'_source': 'plans/evil-mode-rework/lists/outside-interactions.md, word for word (tools/dominion/rivals-to-json.py)', 'sections': names, 'rows': rows}


for name, data in (('rivalActions.json', actions()), ('outside.json', outside())):
    path = os.path.join(root, 'src', 'data', 'dominion', name)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print(name, 'written')
