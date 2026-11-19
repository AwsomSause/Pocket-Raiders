"""DOMINION slice D12: turns the Chair's 150 cards (lists/dilemmas.md) into game data.

  lists/dilemmas.md (cards 1-150) -> src/data/dominion/court.json  (cards only; the rules live in court-rules.json)

The list text is kept word for word (visitor, what they ask, both answer labels and what each does). What the engine
does with an answer is the SPEC table below, written in a small effect language (see `fx()`):

  $N / c$N    dirty / clean money (Warehouse scale, times the HQ tier's factor)   zero$  money back up to ₽0
  heat:N  wanted:N  reg:N  dread:N  mor:N  fame:N (Notoriety)  heatall:N (every district)  cool:N (HQ Heat -N a day)
  loy:N (the named member)  loy2:N (the second named)  loyall:N  xp:N  xp2:N  wage:N  happy:N  lvl:N
  item:id:n  held:id:n  item:*:-1 (a Bag item lost)   mon:N (Stores Pokémon; negative = lost)   monm:1 (the member's)
  join[:name=..:green=..]  leave  jail  free  rest  out:D  guard:D  poach:loy:pct  racket+  racket-  racket:share
  fav / grudge (on the visitor, or who=...)  follow:card:days  scout
  chance:P{yes}{no}  in:D{...} (D days later)  fight{win}{lose} (at the door next morning, card's foe)
  deal:N[:clean][:heat=H][:risk=P:heat=H|wanted=W][:mon=N][:item=id:n][:ten=N]  (every week)
  ten:N threat:N goal:N stab:N raid:N shadow:N wipe:N   (kept for the slice that builds them: owed)
  note:SLICE:"text"  (a part that waits for a later slice: the answer is "limited")

A card with `wait` is switched off (status "disabled") until the named slice builds what its answers need.
Re-run after the list changes:  python3 tools/dominion/court-to-json.py <plans/evil-mode-rework/lists> src/data/dominion
"""
import json
import re
import sys

lists, out = sys.argv[1], sys.argv[2]
md = open(f'{lists}/dilemmas.md', encoding='utf-8').read()

SECTIONS = {'A': 'crew', 'B': 'town', 'C': 'money', 'D': 'law', 'E': 'rival', 'F': 'hero', 'G': 'gyms', 'H': 'pokemon', 'I': 'empire', 'J': 'regular', 'K': 'crisis'}
CRISIS = {145: 'money', 146: 'heat', 147: 'morale', 148: 'regard', 149: 'loyalty', 150: 'threat'}


def clean(t):
    return t.replace('**', '').replace('*', '').strip()


def answer(cell):
    m = re.match(r'\*\*(.+?)\*\*\s*(.*)$', cell.strip())
    if not m:
        raise SystemExit(f'answer without a bold label: {cell}')
    return clean(m.group(1)), clean(m.group(2))


rows = {}
sect, regular = None, None
for line in md.splitlines():
    h = re.match(r'^## ([A-K])\. ', line)
    if h:
        sect = SECTIONS[h.group(1)]
        continue
    r = re.match(r'^### Regular (\d): (.+)$', line)
    if r:
        regular = (int(r.group(1)), r.group(2).strip())
        continue
    m = re.match(r'^\| (\d+) \| (.+) \|\s*$', line)
    if not m or not sect:
        continue
    n = int(m.group(1))
    cells = [c.strip() for c in m.group(2).split(' | ')]
    if sect == 'regular':
        step, tier, ask, a, b = cells
        visitor, note = regular[1], f'Regular {regular[0]}, step {step}'
        rows[n] = dict(sect=sect, visitor=visitor, note=note, tier=tier, ask=ask, a=a, b=b, regular=regular[0], step=int(step))
    elif sect == 'crisis':
        visitor, red, ask, a, b = cells
        rows[n] = dict(sect=sect, visitor=visitor, note=clean(red), tier='0', ask=ask, a=a, b=b)
    else:
        visitor, tier, ask, a, b = cells
        rows[n] = dict(sect=sect, visitor=visitor, tier=tier, ask=ask, a=a, b=b)
assert sorted(rows) == list(range(1, 151)), f'cards found: {len(rows)}'

# ---------- the effect language ----------


def split_top(s):
    """Splits on spaces outside braces and quotes."""
    out, depth, q, cur = [], 0, False, ''
    for ch in s:
        if ch == '"':
            q = not q
        if ch == '{':
            depth += 1
        if ch == '}':
            depth -= 1
        if ch == ' ' and depth == 0 and not q:
            if cur:
                out.append(cur)
            cur = ''
        else:
            cur += ch
    if cur:
        out.append(cur)
    return out


def blocks(s):
    """'name{a}{b}' -> ('name', ['a', 'b'])."""
    i = s.index('{')
    head, rest, parts, depth, cur = s[:i], s[i:], [], 0, ''
    for ch in rest:
        if ch == '{':
            depth += 1
            if depth == 1:
                cur = ''
                continue
        if ch == '}':
            depth -= 1
            if depth == 0:
                parts.append(cur)
                continue
        cur += ch
    return head, parts


NUM = {'heat': 'heat', 'wanted': 'wanted', 'reg': 'regard', 'dread': 'dread', 'mor': 'morale', 'fame': 'fame', 'heatall': 'heatAll', 'cool': 'cool',
       'xp': 'xp', 'xp2': 'xp', 'wage': 'wage', 'happy': 'happy', 'lvl': 'levels', 'mon': 'mon', 'monm': 'monMember', 'out': 'out', 'guard': 'guard'}
OWED = ('ten', 'threat', 'goal', 'stab', 'raid', 'shadow', 'wipe')


def fx(s):
    res = []
    for t in split_top(s.strip()):
        if '{' in t:
            head, parts = blocks(t)
            if head.startswith('chance:'):
                res.append({'k': 'chance', 'p': int(head[7:]), 'yes': fx(parts[0]), 'no': fx(parts[1]) if len(parts) > 1 else []})
            elif head.startswith('in:'):
                res.append({'k': 'later', 'days': int(head[3:]), 'fx': fx(parts[0])})
            elif head == 'fight':
                res.append({'k': 'fight', 'win': fx(parts[0]), 'lose': fx(parts[1]) if len(parts) > 1 else []})
            else:
                raise SystemExit(f'bad block {t}')
            continue
        if t.startswith('note:'):
            _, slice_, text = t.split(':', 2)
            res.append({'k': 'note', 'slice': slice_, 'text': text.strip('"')})
            continue
        if t.startswith('c$'):
            res.append({'k': 'funds', 'n': int(t[2:]), 'clean': True})
            continue
        if t.startswith('$'):
            if t.startswith('$each:'):
                res.append({'k': 'funds', 'n': int(t[6:]), 'each': True})
            else:
                res.append({'k': 'funds', 'n': int(t[1:])})
            continue
        if t == 'zero$':
            res.append({'k': 'zero'})
            continue
        if t in ('fav', 'grudge'):
            res.append({'k': 'tag', 'tag': 'favour' if t == 'fav' else 'grudge'})
            continue
        if t.startswith(('fav=', 'grudge=')):
            k, who = t.split('=')
            res.append({'k': 'tag', 'tag': 'favour' if k == 'fav' else 'grudge', 'who': who})
            continue
        if t in ('leave', 'jail', 'free', 'rest', 'scout', 'racket+', 'racket-'):
            res.append({'k': {'racket+': 'racketAdd', 'racket-': 'racketLose'}.get(t, t)})
            continue
        if t == 'join' or t.startswith('join:'):
            e = {'k': 'join'}
            for kv in t.split(':')[1:]:
                k, v = kv.split('=')
                e[k] = v
            res.append(e)
            continue
        if t.startswith('deal:'):
            p = t.split(':')
            e = {'k': 'deal', 'n': int(p[1])}
            i = 2
            while i < len(p):
                kv = p[i]
                if kv == 'clean':
                    e['clean'] = True
                elif kv.startswith('item='):
                    e['item'] = kv[5:]
                    e['itemN'] = int(p[i + 1])
                    i += 1
                else:
                    k, v = kv.split('=')
                    e[k] = int(v)
                i += 1
            res.append(e)
            continue
        k, _, v = t.partition(':')
        if k == 'item' or k == 'held':
            id_, n = v.split(':')
            e = {'k': 'item', 'id': id_, 'n': int(n)}
            if k == 'held':
                e['held'] = True
            res.append(e)
        elif k == 'follow':
            c, d = v.split(':')
            res.append({'k': 'follow', 'card': int(c), 'days': int(d)})
        elif k == 'racket':
            res.append({'k': 'racket', 'share': float(v)})
        elif k == 'poach':
            lo, p = v.split(':')
            res.append({'k': 'poach', 'below': int(lo), 'p': int(p)})
        elif k in ('loy', 'loy2', 'loyall'):
            res.append({'k': 'loyalty', 'n': int(v), 'who': {'loy': 'named', 'loy2': 'second', 'loyall': 'all'}[k]})
        elif k in ('xp', 'xp2'):
            res.append({'k': 'xp', 'n': int(v), 'who': 'named' if k == 'xp' else 'second'})
        elif k in OWED:
            res.append({'k': 'owed', 'key': k, 'n': int(v)})
        elif k in NUM:
            res.append({'k': NUM[k], 'n': int(v)})
        else:
            raise SystemExit(f'unknown effect {t}')
    return res


# ---------- what the engine does, card by card ----------
# look: trainer atlas (trainer/pr/... or trainer/...), 'member' (the named member's picture) or 'mon:<species>'.
# named: who the card names among the crew: any, first, jailed, hurt, admin, admins, two, sergeant, lowLoy, best,
#   name:<Name>. who: the person a Favour/Grudge sticks to. foe: the fight at the door (fight{} effects).
GR = 'trainer/pr/rocket_grunt_m'
FOES = {
    'poacher': dict(name='The poacher', cls='fisherman', species=['magikarp', 'gyarados'], offset=-2),
    'shark': dict(name='The loan shark', cls='roughneck', species=['machoke'], offset=1),
    'thief': dict(name='The out-of-town thief', cls='roughneck', species=['ekans', 'koffing'], offset=0),
    'archer': dict(name='Archer', cls='rival', species=['houndour', 'zubat', 'koffing'], offset=2),
    'friend': dict(name="The Hero's friend", cls='rival', species=['pidgeotto', 'kadabra', 'ivysaur'], offset=3),
    'surge': dict(name='Lt. Surge', cls='veteran', species=['voltorb', 'pikachu', 'raichu'], offset=3),
    'bruno': dict(name='The fighting master', cls='black-belt', species=['onix', 'hitmonchan', 'hitmonlee', 'machamp'], offset=4),
    'champion': dict(name='The retired Champion', cls='ace-trainer', species=['dragonair', 'gyarados', 'aerodactyl', 'dragonite'], offset=6),
    'hunter': dict(name='The bounty hunter', cls='ace-trainer', species=['arcanine', 'nidoking', 'scyther'], offset=5),
    'police': dict(name='International Police', cls='veteran', species=['growlithe', 'machoke', 'croagunk'], offset=4),
}

SPEC = {
    # A. the crew
    1: dict(look='trainer/pr/pokefan_f', named='first', who='mum', name="Your first member's mum", role="{name}'s mum", once=True, first=True,
            ask='"{He} told me {he} works at a recycling plant. Is my {boy} safe here?"',
            a='reg:3 loy:8 follow:2:6', b='dread:3 loy:-6 mor:-2'),
    2: dict(look='trainer/pr/pokefan_f', named='first', who='mum', name='The mum again', role="{name}'s mum", once=True, followOnly=True,
            ask='She brings a casserole and asks you to give {him} Sundays off',
            a='loy:10 note:D3:"skipping every 7th day\'s task waits for the crew rota"', b='loy:-4 item:camp-curry:2'),
    3: dict(look='member', named='any', who='member', a='$-80 loy:8 fav', b='loy:-6 chance:30{$-50}'),
    4: dict(look='member', named='any', a='loy:6 monm:1 heat:2', b='mon:1 loy:-3'),
    5: dict(look='member', named='two', a='mor:1 loy:-5', b='dread:2 xp:1 xp2:1 chance:50{loy:-3}{loy2:-3}'),
    6: dict(look='member', named='any', a='$-150 mor:6 dread:2', b='mor:-3 reg:1'),
    7: dict(look='member', named='any', a='note:D9:"the free Attack on the Rival" ten:6 loy:6', b='loy:-5 mor:-2'),
    8: dict(look='member', named='admin', wait='D8', a='loy:12 note:D8:"a 10% cut of their squad\'s take"', b='loy:-10 chance:20{follow:9:7}'),
    9: dict(look='member', named='admin', wait='D8', followOnly=True, a='$-300 loy:15', b='leave ten:-5 raid:10'),
    10: dict(look='member', named='any', a='mor:5', b='mor:-1 dread:1'),
    11: dict(look='member', named='any', a='loy:6 note:D8:"day jobs only"', b='note:D8:"night tasks at -10%; grows toward Steady"'),
    12: dict(look='member', named='any', a='join:green=clumsy:name=brother loy:5', b='loy:-4'),
    13: dict(look='member', named='any', a='deal:-100 mor:8', b='mor:-4'),
    14: dict(look='member', named='any', a='loy:6 mor:2', b='heat:-2 loy:-8'),
    15: dict(look='member', named='any', a='rest loy:5 reg:1', b='loy:-5'),
    16: dict(look='member', named='sergeant', a='note:D8:"new recruits train +20%" mor:-3 dread:3', b='loy:-4 mor:2'),
    17: dict(look='member', named='any', a='$-120 note:D9:"spy odds -20% this week"', b='chance:25{item:*:-1}'),
    18: dict(look='member', named='admin', a='join:look=trainer/pr/rocket_grunt_f ten:5 note:D9:"40% they\'re a spy"', b='loy:-6'),
    19: dict(look='member', named='any', oncePerRegion=True, a='$-400 mor:15 heat:4', b='mor:-8'),
    20: dict(look='member', named='any', who='member', a='leave $-100 reg:5 fav in:14{scout}', b='loy:-10 dread:4 mor:-4'),
    21: dict(look='member', named='hurt', a='guard:999 loy:10 note:D5:"HQ defense +1 battle"', b='loy:-6 out:5'),
    22: dict(look='member', named='admins', a='loy2:-12 loy:10', b='loy:-12 loy2:10 dread:3 note:D8:"the field bonus"'),
    # B. townsfolk and shops
    23: dict(look='trainer/pr/clerk_m', who='shopkeeper', needs='racket', a='racket:-0.5 reg:4 fav', b='dread:4 chance:30{heat:8}'),
    24: dict(look='trainer/pr/baker', who='baker', needs='racket', a='racket:-1 mor:5', b='dread:2 reg:-2'),
    25: dict(look='trainer/pr/rich_m', who='landlord', a='$-200 heat:-3', b='dread:5 heat:6 chance:50{$100}'),
    26: dict(look='trainer/pr/musician', who='busker', a='reg:3 mor:2 heat:1', b='dread:1 reg:-2'),
    27: dict(look='trainer/pr/parasol_lady', who='widow', a='$-200 reg:10 fav', b='$200 reg:-6 dread:3'),
    28: dict(look='trainer/pr/doctor_f', who='nurse', a='reg:5 note:D10:"no Thieving in Centers for 14 days"', b='dread:2 reg:-4 note:D10:"Heal costs +10% there"'),
    29: dict(look='trainer/pr/pilot', who='cabbie', wait='D10', a='deal:-140 note:D10:"chase odds +10%"', b=''),
    30: dict(look='trainer/pr/janitor', who='caretaker', a='reg:6 note:D10:"flyer recruits -1 there"', b='heat:5 reg:-6'),
    31: dict(look='trainer/fisherman', who='fisherman', foe='poacher', a='fight{reg:6 fav}{reg:2}', b='reg:-2'),
    32: dict(look='trainer/pr/clerk_f', who='shop-owner', wait='D5', a='c$-1500 note:D5:"+Building (Shop)" reg:5', b='dread:2'),
    33: dict(look='trainer/pr/worker_f', who='housing', a='$-250 reg:8 note:D10:"Night actions -5% there"', b='reg:-5 note:D10:"Night actions +5% there"'),
    34: dict(look='trainer/pr/pokefan_f', who='grandmother', a='scout reg:10', b='reg:-4 chance:30{loyall:1}'),
    35: dict(look='trainer/pr/waiter_m', who='vendor', a='mor:4 reg:3 heat:1', b=''),
    36: dict(look='trainer/pr/rich_kid_m', who='gambler-slots', needs='stores', a='mon:-1 chance:50{$600}', b='dread:1'),
    37: dict(look='trainer/pr/waiter_f', who='cafe', wait='D5', a='mor:-2 reg:4', b='c$-2000 note:D5:"+Building (Café Front)"'),
    38: dict(look='trainer/aroma_lady', who='florist', a='racket+ ten:6', b='reg:-2'),
    39: dict(look='trainer/worker_m', who='union', wait='D10', a='note:D10:"Smuggle: -15% cut, Heat -50%"', b='note:D10:"40%: Smuggle blocked 3 days"'),
    40: dict(look='trainer/pr/breeder_f', who='daycare', a='$-180 reg:3 mon:3', b='reg:-4 loyall:-1'),
    41: dict(look='trainer/pr/rich_f', who='planner', a='c$600 reg:6 heat:-2', b='dread:2'),
    42: dict(look='trainer/pr/artist', who='artist', a='$-200 fame:2 heat:6', b='heat:-2 reg:2'),
    43: dict(look='trainer/hiker', who='hiker', named='any', a='rest chance:30{join:look=trainer/hiker:green=lost} reg:4', b=''),
    44: dict(look='trainer/pr/clerk_m_2', who='blackout', a='note:D5:"HQ defense -1 battle tonight" reg:6', b='reg:-3'),
    # C. money and the underworld
    45: dict(look='trainer/pr/collector', who='fence', wait='D10', a='note:D10:"60% of the Holding value"', b='follow:46:7'),
    46: dict(look='trainer/pr/collector', who='fence', wait='D10', followOnly=True, a='note:D10:"Holding sells at 75% weekly" heat:-1', b='note:D10:"90% of the Holding value"'),
    47: dict(look='trainer/roughneck', who='shark', a='$1000 follow:48:14', b='dread:1'),
    48: dict(look='trainer/roughneck', who='shark', followOnly=True, foe='shark', a='$-1500 fav', b='dread:4 heat:5 chance:50{fight{}{$-1500}}'),
    49: dict(look='trainer/pr/scientist_m', who='counterfeiter', a='$500 chance:30{heat:15}', b='heat:-8 reg:3 dread:-2'),
    50: dict(look='trainer/pr/scuba_diver_m', who='smuggler', a='deal:400:heat=3 threat:2', b='reg:2 dread:2'),
    51: dict(look='trainer/pr/rich_m', who='gambler', wait='D5', a='note:D5:"win: +Building (House)" mon:-1', b=''),
    52: dict(look='trainer/pr/collector', who='black-market', a='$-600 item:ability-urge:1 heat:6', b=''),
    53: dict(look='trainer/pr/rich_m', who='accountant', wait='D5', a='note:D5:"laundering at 5%"', b=''),
    54: dict(look='trainer/pr/rich_f', who='collector', needs='stores', a='$1200 mon:-1 threat:3', b='mon:-1 reg:6 threat:-2'),
    55: dict(look='trainer/pr/harlequin', who='corner-manager', a='deal:300:risk=10:heat=12', b=''),
    56: dict(look='trainer/pr/rich_m', who='insurance', wait='D9', a='deal:-150 note:D9:"raid losses halved"', b='dread:2'),
    57: dict(look='trainer/pr/hooligans', who='thief', foe='thief', a='deal:100:heat=2', b='fight{dread:4}'),
    58: dict(look='trainer/pr/depot_agent', who='courier', a='in:3{chance:80{$500}{heat:20}}', b='item:rare-candy:3 grudge=courier-boss'),
    # D. police and the law
    59: dict(look='trainer/pr/officer', who='jenny', a='heat:-12 ten:8', b='heat:4 dread:1'),
    60: dict(look='trainer/pr/officer', who='jenny', a='c$-300 heat:-8 reg:3', b='heat:3'),
    61: dict(look='trainer/pr/officer', who='rookie', a='$-200 heat:-10 follow:62:10', b='heat:5'),
    62: dict(look='trainer/pr/officer', who='rookie', followOnly=True, a='$-400 heat:-10', b='heat:-5 grudge'),
    63: dict(look='trainer/pr/veteran_m', who='looker', a='wanted:-15 note:D16:"Snagem and Cipher deals closed for the run"', b='wanted:5 note:D2:"Looker watches: Heat +2 per Night action for 7 days"'),
    64: dict(look='trainer/pr/rich_f', who='lawyer', named='jailed', a='$-500 free loy:10', b='out:7 loy:-10'),
    65: dict(look='trainer/pr/rich_m', who='judge', wait='D10', a='c$-1500 note:D10:"police sweeps -30% for 2 weeks"', b='chance:20{note:D10:"Blackmail on him opens"}'),
    66: dict(look='trainer/pr/hooligans', who='informant', wait='D10', a='$-150 note:D10:"this week\'s sweep can\'t catch anyone"', b=''),
    67: dict(look='trainer/pr/officer', who='cousin', named='any', a='leave heat:-10', b='heat:6 loy:4'),
    68: dict(look='trainer/pr/interviewers', who='journalist', a='fame:3 heat:5', b='dread:3 chance:50{heat:8}'),
    69: dict(look='trainer/pr/officer', who='jenny', a='cool:1 fav note:D10:"that street: no actions"', b='heat:4 grudge'),
    70: dict(look='trainer/pr/veteran_m', who='guard', named='jailed', a='$-100 loy:10', b='loy:-5'),
    # E. rival teams
    71: dict(look=GR, who='rival', rival=True, a='join:look=trainer/pr/rocket_grunt_m ten:5 note:D9:"40% he\'s a spy"', b='ten:-3'),
    72: dict(look=GR, who='rival', rival=True, a='reg:4 ten:4 join:look=trainer/pr/rocket_grunt_m', b='dread:1'),
    73: dict(look='trainer/pr/rocket_grunt_f', who='rival', rival=True, a='deal:-200:ten=-10', b='ten:10 dread:3'),
    74: dict(look=GR, who='rival', rival=True, wait='D9', a='note:D9:"a double agent: Rival plans visible"', b='ten:-8 reg:-2'),
    75: dict(look=GR, who='rival', rival=True, a='$500 ten:-5 heat:5', b='ten:5'),
    76: dict(look='trainer/pr/archer', who='archer', rival=True, name='Archer', role='Rocket Admin', needs='racket', a='racket- ten:-12', b='ten:10 dread:5 follow:77:3'),
    77: dict(look='trainer/pr/archer', who='archer', rival=True, name='Archer', role='Rocket Admin', followOnly=True, foe='archer', a='fight{dread:8 ten:5}', b='$-400 ten:-6 mor:-4'),
    78: dict(look='trainer/pr/ariana', who='rival', rival=True, wait='D10', a='note:D10:"a joint Heist" ten:-10 chance:25{ten:20}', b='ten:4'),
    79: dict(look='trainer/pr/scientist_m', who='rival', rival=True, wait='D5', a='note:D5:"a lab machine: +1 Room effect" mon:-1 threat:4', b=''),
    80: dict(look='trainer/pr/magma_grunt_m', who='rival', rival=True, region='hoenn', wait='D15', a='note:D9:"Magma Tension -15, Aqua +15"', b='note:D9:"Aqua Tension -15, Magma +15"'),
    81: dict(look='trainer/pr/proton', who='rival', rival=True, wait='D13', a='note:D13:"the Debate opens early" ten:-5', b='ten:8 dread:3'),
    82: dict(look='trainer/pr/proton', who='rival', rival=True, wait='D14', a='wipe:1 ten:20 join', b='$1000 ten:-10 grudge'),
    83: dict(look=GR, who='rival', rival=True, needs='stores', a='mon:-1 mon:1 ten:-3', b=''),
    84: dict(look='trainer/pr/rocket_grunt_f', who='rival', rival=True, a='dread:3 ten:4', b='poach:30:40 reg:2'),
    85: dict(look='trainer/pr/pokefan_f', who='defector-mum', rival=True, named='any', a='guard:5 reg:6 ten:4', b='loy:-15'),
    86: dict(look='trainer/pr/rich_m', who='rival', rival=True, a='deal:800:ten=-10:risk=10:wanted=10', b='ten:15 note:D9:"Heat on Rival districts +20"'),
    # F. the Hero (Threat is kept for D11)
    87: dict(look='trainer/pr/scientist_m', who='professor', a='threat:-5 reg:4 note:D11:"Attack on routes -10% for 7 days"', b='threat:5 dread:2'),
    88: dict(look='trainer/pr/pokefan_f', who='hero-mum', a='held:leftovers:1 threat:-3 reg:3', b='dread:3 threat:3'),
    89: dict(look='trainer/blue', who='hero-friend', foe='friend', a='fight{threat:-4 dread:4}{threat:6}', b='threat:3'),
    90: dict(look='trainer/pr/interviewers', who='reporter', a='reg:4 threat:-2', b='dread:4 threat:6'),
    91: dict(look='member', named='any', a='loy:3 threat:-2', b='threat:4 note:D11:"+10% vs. the Hero"'),
    92: dict(look='trainer/pr/ace_trainer_m', who='gym-trainer', wait='D11', a='$-100 note:D11:"the Hero\'s district tomorrow"', b=''),
    93: dict(look='trainer/red', who='hero', wait='D11', a='threat:-8 reg:4 dread:-4', b='threat:10 note:D11:"Hero battle tomorrow"'),
    94: dict(look='trainer/red', who='hero', wait='D11', a='note:D10:"release the Holding Pens" reg:12 threat:-15', b='threat:12'),
    95: dict(look='trainer/red', who='hero', wait='D11', a='note:D11:"that district is locked to you" threat:-20', b='threat:15 dread:5'),
    96: dict(look='trainer/red', who='hero', wait='D11', once=True, a='mor:8 reg:4', b='dread:8 goal:5 threat:5'),
    # G. gyms, League and famous trainers
    97: dict(look='trainer/pr/veteran_m', who='surge', name='Lt. Surge', role='Gym Leader', foe='surge', a='fight{$600}', b='dread:-1'),
    98: dict(look='trainer/pr/striker', who='koga', wait='D10', a='$-800 note:D10:"+10% Steal/Thieve for 14 days"', b=''),
    99: dict(look='trainer/firebreather', who='blaine', wait='quiz', a='note:quiz:"a quiz: 3 questions, a TM if 2 are right"', b=''),
    100: dict(look='trainer/roark', who='gym-leader', wait='D10', a='shadow:-1 reg:10 fav', b='dread:4 grudge'),
    101: dict(look='trainer/roark', who='gym-leader', wait='D10', a='$-1000', b='dread:6 chance:40{heat:20 note:D10:"lose the Gym"}'),
    102: dict(look='trainer/black_belt_m', who='bruno', foe='bruno', a='fight{join:look=trainer/black_belt_m:name=Bruno}{dread:-5}', b=''),
    103: dict(look='trainer/pr/ace_trainer_f', who='aide', named='any', a='rest fame:5 loy:10 note:D11:"gone 3 days at the tournament"', b=''),
    104: dict(look='trainer/pr/ace_trainer_m', who='frontier', named='best', a='leave c$2000', b='loy:6'),
    105: dict(look='trainer/pr/beauty_2', who='coordinator', a='c$400 reg:6 heat:-2', b=''),
    106: dict(look='trainer/dragon_tamer', who='champion', foe='champion', a='fight{fame:10 dread:10}{threat:10}', b='reg:2'),
    107: dict(look='trainer/pr/veteran_f', who='hunter', foe='hunter', a='$-1500 join:look=trainer/pr/veteran_f:name=Kestrel note:D8:"temporary: 14 days"', b='fight{dread:8}'),
    108: dict(look='trainer/pr/ace_trainer_f', who='gym-trainer', a='join:look=trainer/pr/ace_trainer_f grudge=gym-leader', b='fav=gym-leader'),
    # H. Pokémon matters
    109: dict(look='trainer/pr/ranger_f', who='ranger', a='reg:6 threat:-3', b='mon:2 threat:3'),
    110: dict(look='trainer/pr/breeder_m', who='breeder', a='deal:-50:mon=1', b=''),
    111: dict(look='trainer/pr/ace_trainer_m', who='owner', needs='stores', a='mon:-1 reg:8 threat:-4', b='dread:4 threat:4'),
    112: dict(look='member', named='any', a='$-300 happy:20 mor:3', b='dread:1 loy:-3'),
    113: dict(look='trainer/pr/scientist_f', who='scientist', needs='stores', a='$800 mon:-1 threat:6', b='reg:2'),
    114: dict(look='trainer/pr/expert_pokemon_breeder', who='fuji', needs='stores2', a='mon:-2 reg:10', b=''),
    115: dict(look='trainer/pr/nursery_aide', who='daycare', a='$-600 lvl:5', b=''),
    116: dict(look='member', named='any', a='loy:6 reg:2', b='loy:-6 mon:1'),
    117: dict(look='trainer/pr/ruin_maniac', who='ballmaker', a='deal:0:item=luxury-ball:5 note:D10:"that forest is off-limits"', b='dread:2'),
    118: dict(look='mon:meowth', who='stray', a='chance:50{mon:1} mor:3', b=''),
    119: dict(look='trainer/pr/scientist_m', who='cipher', wait='D16', a='$-1000 note:D16:"a Shadow Pokémon" threat:8', b='reg:3'),
    120: dict(look='trainer/pr/ruin_maniac', who='hermit', wait='D11', a='reg:6 note:D11:"heroic Legendaries come 7 days later"', b='note:D11:"a Legendary hunt opens" threat:10'),
    121: dict(look='member', named='any', a='rest chance:50{$200 fame:1}', b='loy:-3'),
    122: dict(look='trainer/pr/camper_m', who='trainer', a='$-60 reg:3', b='dread:2 reg:-2'),
    # I. empire scale
    123: dict(look='trainer/pr/rich_m', who='mayor', a='c$-3000 heatall:-10 reg:8', b='wanted:5'),
    124: dict(look='trainer/pr/rich_m', who='company', a='deal:1000:clean shadow:1', b=''),
    125: dict(look='trainer/pr/interviewers', who='producer', a='fame:8 reg:6 heat:10', b=''),
    126: dict(look='trainer/pr/veteran_m', who='governor', wait='D15', a='stab:15 note:D15:"two members go to the held region"', b='stab:-10'),
    127: dict(look='trainer/pr/hooligans', who='rebel', wait='D15', a='stab:10 note:D15:"tribute -20%"', b='stab:-5 dread:10'),
    128: dict(look='trainer/pr/rich_m', who='magnate', a='deal:1500 wanted:5 note:D15:"region-to-region smuggling"', b=''),
    129: dict(look='trainer/pr/ace_trainer_m', who='gym-union', wait='D14', a='deal:-2000 note:D14:"Monarch Uprising check -50%"', b='note:D14:"Uprising check +25%"'),
    130: dict(look='trainer/pr/rich_f', who='council', wait='D10', a='c$-50000 note:D10:"police budget -20%"', b=''),
    131: dict(look='trainer/worker_m', who='architect', wait='D5', a='note:D5:"next HQ tier -20% cost"', b=''),
    132: dict(look='member', who='former', wait='D15', a='join stab:-5', b='stab:5'),
    # J. regulars (all once; each step comes 5-9 days after the last)
    133: dict(look='trainer/pr/clerk_m', who='sal', name='Sal', role='Mart clerk', a='deal:-40 reg:4 fav', b='$60 dread:4 chance:50{racket-}'),
    134: dict(look='trainer/pr/clerk_m', who='sal', name='Sal', role='Mart clerk', a='reg:4 note:D10:"Extort on the manager opens"', b=''),
    135: dict(look='trainer/pr/clerk_m', who='sal', name='Sal', role='Mart manager', a='reg:6 note:D5:"+Building (Mart Front)"', b='deal:100:clean fav'),
    136: dict(look='trainer/pr/ace_trainer_f', who='gilda', name='Gilda', role='Gym groupie', a='join:look=trainer/pr/ace_trainer_f:name=Gilda:green=starstruck', b='grudge'),
    137: dict(look='trainer/pr/ace_trainer_f', who='gilda', name='Gilda', role='Gym groupie', named='name:Gilda', a='chance:50{fav=gym-leader}{loy:-10}', b='loy:-5'),
    138: dict(look='trainer/pr/ace_trainer_f', who='gilda', name='Gilda', role='Gym groupie', named='name:Gilda', a='shadow:1 note:D10:"Gym taken (her)"', b='loy:10'),
    139: dict(look='trainer/pr/veteran_m', who='pops', name='Pops', role='old Rocket', a='join:look=trainer/pr/veteran_m:name=Pops:green=lazy mor:2', b=''),
    140: dict(look='trainer/pr/veteran_m', who='pops', name='Pops', role='old Rocket', named='name:Pops', a='mor:4 note:D10:"crew +10% Take"', b='loy:-4'),
    141: dict(look='trainer/pr/veteran_m', who='pops', name='Pops', role='old Rocket', named='name:Pops', a='note:D9:"Rocket plans visible 4 weeks" chance:30{leave}', b='loy:8'),
    142: dict(look='trainer/pr/interviewers', who='dex', name='Dex', role='reporter', a='fame:3 heat:4', b=''),
    143: dict(look='trainer/pr/interviewers', who='dex', name='Dex', role='reporter', a='ten:10 reg:6', b=''),
    144: dict(look='trainer/pr/interviewers', who='dex', name='Dex', role='reporter', a='reg:10 heat:-5', b=''),
    # K. crisis cards (always first)
    145: dict(look='trainer/pr/rich_m', who='bailiff', a='zero$ note:D5:"lose the newest room"', b='mon:-2 zero$ mor:-8'),
    146: dict(look='trainer/pr/officer', who='jenny', named='lowLoy', foe='police', a='jail heat:-30', b='heat:-20 fight{}{note:D5:"lose 1 room"}'),
    147: dict(look='member', named='first', who='crew', a='$each:-300 mor:30', b='mor:20 dread:-5 reg:5'),
    148: dict(look='trainer/pr/pokefan_m', who='town', a='$-1000 reg:15 dread:-10', b='dread:5 heat:15 reg:10'),
    149: dict(look='member', named='lowLoy', who='member', a='wage:200 loy:30', b='leave grudge raid:20'),
    150: dict(look='trainer/red', who='hero', wait='D11', a='note:D11:"Hero battle tomorrow, HQ defense bonus" threat:-20', b='note:D11:"lose 1 district" threat:-30'),
}
assert sorted(SPEC) == list(range(1, 151))

NOTES = {'tutorial, Day 2, once', 'once', 'once per region'}


def tier(t):
    t = t.replace('–', '-')
    lo, _, hi = t.partition('-')
    return int(lo), int(hi or 5)


cards = []
for n in range(1, 151):
    r, s = rows[n], SPEC[n]
    vm = re.match(r'\*\*(.+?)\*\*\s*(?:\((.+)\))?', r['visitor'])
    visitor = clean(vm.group(1)) if vm else clean(r['visitor'])
    extra = vm.group(2) if vm and vm.group(2) else None
    la, da = answer(r['a'])
    lb, db = answer(r['b'])
    c = {
        'id': n, 'sect': r['sect'], 'visitor': visitor, 'name': s.get('name', visitor), 'role': s.get('role', extra if extra and extra not in NOTES else None),
        'look': s['look'], 'tier': list(tier(r['tier'])), 'ask': s.get('ask', clean(r['ask'])),
        'a': {'label': la, 'does': da, 'fx': fx(s['a'])}, 'b': {'label': lb, 'does': db, 'fx': fx(s['b'])},
    }
    for k in ('named', 'who', 'needs', 'foe', 'wait', 'region'):
        if k in s:
            c[k] = FOES[s[k]] if k == 'foe' else s[k]
    for k in ('once', 'followOnly', 'oncePerRegion', 'rival', 'first'):
        if s.get(k):
            c[k] = True
    if r['sect'] == 'regular':
        c['once'] = True
        c['regular'] = r['regular']
        c['step'] = r['step']
    if r['sect'] == 'crisis':
        c['crisis'] = CRISIS[n]
        c['red'] = r['note']
    if extra and 'once' in extra:
        c['once'] = True
    cards.append(c)

json.dump({'_source': 'plans/evil-mode-rework/lists/dilemmas.md (made by tools/dominion/court-to-json.py; do not edit by hand)', 'cards': cards},
          open(f'{out}/court.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
live = sum(1 for c in cards if 'wait' not in c)
print(f'{len(cards)} cards, {live} live, {len(cards) - live} waiting')
