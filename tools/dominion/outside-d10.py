#!/usr/bin/env python3
"""DOMINION D10 follow-up, part 2: what the 180 street meetings of sections B, C, D, E, H, I and K do (run with python3 -I).

  python3 -I tools/dominion/outside-d10.py

Adds their rows, needs and foes to src/data/dominion/town.json (sections A and J stay as D6b wrote them). The rows that
only do part of what the list says are marked limited, with a note, by tools/dominion/rivals-to-json.py (OUTSIDE_LIMITED).
The row text stays in outside.json word for word; this file says what each choice does, one string per choice:

  key:n         a number (rg dr h ten hero money wanted control mor papers sell cover tip fightChance)
  key:word      a word (contact edge item mon check fight)
  word          a flag (racket route gymScout ally shaken safehouse heist dirt free lead scout intel foil)
  fail(...)     what a missed `check` does instead          lose(...)  what a lost `fight` does instead (default h:2)

fight: target (the district's own), police, wild, leader (the district's Gym Leader) or a key of FOES below.
mon: a species, or 'local' (one from the region). item: an id from items.json.
"""
import json
import os
import re

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.normpath(os.path.join(here, '..', '..'))
path = os.path.join(root, 'src', 'data', 'dominion', 'town.json')

NUM = {'rg', 'dr', 'h', 'ten', 'hero', 'money', 'wanted', 'control', 'mor', 'papers', 'sell', 'cover', 'tip', 'fightChance'}
WORD = {'contact', 'edge', 'item', 'mon', 'check', 'fight'}
FLAG = {'racket', 'route', 'gymScout', 'ally', 'shaken', 'safehouse', 'heist', 'dirt', 'free', 'lead', 'scout', 'intel', 'foil'}

# Who a street fight is against when it isn't the district's own target (cls: trainers.json class ids).
FOES = {
    'gym-trainer': dict(name='A Gym trainer', cls='ace-trainer', species=['machop', 'geodude'], offset=0),
    'gym-guide': dict(name='The Gym guide', cls='veteran', species=['growlithe', 'rhyhorn'], offset=1),
    'retired': dict(name='The retired Leader', cls='veteran', species=['golem', 'onix', 'kingler'], offset=4),
    'e4': dict(name='An Elite Four member', cls='dragon-tamer', species=['dewgong', 'cloyster', 'slowbro', 'jynx', 'lapras'], offset=8),
    'looker': dict(name='Looker', cls='veteran', species=['croagunk', 'growlithe', 'machoke'], offset=3),
    'agent': dict(name='An International Police agent', cls='veteran', species=['growlithe', 'machoke', 'croagunk'], offset=4),
    'hunter': dict(name='The bounty hunter', cls='ace-trainer', species=['arcanine', 'nidoking', 'scyther'], offset=4),
    'sailor': dict(name='Sailor', cls='fisherman', species=['machop', 'tentacool'], offset=0),
    'cyclist': dict(name='Cyclist', cls='biker', species=['ponyta', 'dodrio'], offset=1),
    'bug-catcher': dict(name='Bug Catcher', cls='bug-catcher', species=['caterpie', 'weedle', 'metapod'], offset=-3),
    'hiker': dict(name='Hiker', cls='hiker', species=['geodude', 'onix'], offset=0),
    'ace-trainer': dict(name='Ace Trainer', cls='ace-trainer', species=['nidorino', 'pidgeotto', 'ivysaur'], offset=3),
    'ranger': dict(name='Ranger', cls='ranger', species=['growlithe', 'pidgeotto'], offset=1),
    'black-belt': dict(name='Black Belt', cls='black-belt', species=['machop', 'hitmonlee'], offset=2),
    'fisherman': dict(name='Fisherman', cls='fisherman', species=['goldeen', 'poliwag', 'magikarp'], offset=-1),
    'hex-maniac': dict(name='Hex Maniac', cls='hex-maniac', species=['gastly', 'haunter'], offset=1),
    'cooltrainers': dict(name='Cooltrainers', cls='ace-trainer', species=['nidoking', 'nidoqueen'], offset=3),
    'swimmer': dict(name='Swimmer', cls='swimmer', species=['staryu', 'tentacool'], offset=0),
    'bikers': dict(name='The bikers', cls='biker', species=['koffing', 'grimer', 'muk'], offset=1),
    'trainer': dict(name='A trainer', cls='youngster', species=['raticate', 'pidgeotto'], offset=0),
    'veteran': dict(name='A veteran', cls='veteran', species=['primeape', 'machoke'], offset=2),
    'ace-duo': dict(name='Ace Duo', cls='ace-trainer', species=['arcanine', 'kadabra', 'dodrio'], offset=4),
    'rich-boy': dict(name='Rich Boy', cls='youngster', species=['growlithe', 'ponyta'], offset=0),
    'gambler': dict(name='The gambler', cls='roughneck', species=['meowth', 'persian'], offset=1),
    'juggler': dict(name='Juggler', cls='psychic', species=['drowzee', 'kadabra'], offset=1),
    'gentleman': dict(name='Gentleman', cls='veteran', species=['growlithe', 'ponyta'], offset=2),
    'guard': dict(name='Lab security', cls='veteran', species=['growlithe', 'arcanine'], offset=2),
    'brawler': dict(name='A brawler', cls='roughneck', species=['machoke', 'primeape'], offset=2),
    'gang': dict(name='The gang boss', cls='roughneck', species=['raticate', 'arbok', 'weezing'], offset=2),
    'collector': dict(name='The debt collector', cls='roughneck', species=['hitmonchan', 'machop'], offset=1),
    'blackmailer': dict(name='The blackmailer', cls='roughneck', species=['koffing', 'ekans'], offset=0),
    'tauros': dict(name='A wild Tauros', cls='hiker', species=['tauros'], offset=0, wild=True),
    'alpha': dict(name='The alpha', cls='hiker', species=['rhydon'], offset=5, wild=True),
    'snorlax': dict(name='A wild Snorlax', cls='hiker', species=['snorlax'], offset=6, wild=True),
    'meowth': dict(name='A wild Meowth', cls='hiker', species=['meowth'], offset=-2, wild=True),
}

E = ''  # no effect
S = {
    # B. Shops and businesses
    'O031': ['money:120 racket dr:2 h:3', 'rg:1', 'check:charm money:80 rg:1 fail(rg:-1)'],
    'O032': ['money:-300 rg:3 item:super-potion', 'rg:1', 'racket dr:3 rg:-2 h:2'],
    'O033': ['scout', 'check:wits money:300 fail(money:-200)', 'check:nerve racket money:200 dr:3 h:5 fail(h:6 dr:1)'],
    'O034': ['sell:40', 'money:-500 contact:fence'],
    'O035': ['racket ten:3 rg:1', 'intel'],
    'O036': ['money:-150 item:hyper-potion', 'item:hyper-potion h:6 dr:1', 'rg:1 item:hyper-potion'],
    'O037': ['money:-200 rg:3', 'item:hyper-potion h:10 dr:2 rg:-2'],
    'O038': ['money:-500 item:water-stone', 'check:stealth item:water-stone h:4 fail(h:10)', 'money:150'],
    'O039': ['route', 'money:100 racket dr:2 h:3'],
    'O040': ['money:-400 edge:brawn mor:3', 'money:-200 lead'],
    'O041': ['money:-600 mon:local', 'rg:2 h:-5', 'mon:local h:6 dr:2'],
    'O042': ['money:-200 mor:3', 'money:150 dr:1 rg:-1'],
    'O043': ['money:-50 gymScout', E],
    'O044': ['scout', 'money:-250 dirt', E],
    'O045': ['check:wits money:400 fail(money:-300)', 'check:stealth money:700 fail(h:8 money:-200)'],
    'O046': ['dirt dr:2', 'route'],
    'O047': ['racket money:100 dr:2 h:3', 'fight:sailor money:150', 'money:-300 route'],
    'O048': ['money:-200 h:-10', 'dr:2 hero:1'],
    'O049': ['scout h:1', 'rg:2'],
    'O050': ['dr:2 intel', 'check:charm rg:3 fail(rg:1)'],
    'O051': ['check:stealth money:1200 h:15 dr:2 fail(h:20)', 'money:-500 cover:3'],
    'O052': ['rg:4 ten:3', 'money:300 dirt dr:1'],
    'O053': ['money:-200 intel', 'rg:1 h:-3'],
    'O054': ['rg:3', 'money:250'],
    'O055': ['foil ten:-3', 'fight:target dr:2 foil'],
    'O056': ['check:wits money:200 fail(money:-150)', 'check:stealth money:300 h:4 fail(h:6 rg:-2)', 'fight:cyclist money:250 rg:1'],
    'O057': ['shaken', E],
    'O058': ['money:400 h:8 dr:2', 'dr:3'],
    'O059': ['racket money:100 dr:2 h:3', 'money:-200 item:fast-ball'],
    'O060': ['money:-100 hero:-2', 'hero:2 dr:3 h:3'],
    # C. Police and the law
    'O061': ['check:charm h:-3 fail(h:5)', 'check:stealth fail(h:8 wanted:2)', 'fight:police h:10 dr:2'],
    'O062': ['h:-3', 'money:-150 cover:2', 'check:stealth cover:1 fail(h:6)'],
    'O063': ['tip:3 rg:1', 'dr:3 h:3', 'money:-200 cover:3'],
    'O064': ['check:stealth wanted:-3 fail(h:5)', 'h:-2 wanted:-1', 'fight:looker wanted:-5 h:5'],
    'O065': ['check:wits h:-5 mor:2 fail(h:5)', 'h:-8 wanted:-2', 'dr:2 mor:1'],
    'O066': ['money:-300 h:-15', E],
    'O067': ['scout', 'fight:police free wanted:-10 h:25 dr:3'],
    'O068': ['check:wits h:-10 cover:7 rg:2 fail(rg:1)', 'mon:growlithe dr:2 h:15'],
    'O069': ['ten:-3 h:-10', E],
    'O070': ['check:charm h:-5 fail(h:10)', 'rg:3 h:5 mor:-3', 'money:-400 h:-8'],
    'O071': ['money:-500 free', 'fight:police free h:15 wanted:5', 'check:charm free fail(h:3)'],
    'O072': ['money:-400 mor:2', 'fight:hunter mor:4 dr:2', 'money:300 mor:-10 h:-10'],
    'O073': ['cover:1 dirt', 'rg:2'],
    'O074': ['h:-2', 'h:-5 wanted:-2', 'fight:agent wanted:-5 dr:3 h:10'],
    'O075': ['check:stealth h:-5 fail(h:5)', 'money:-50 h:-3', 'fight:police h:5'],
    'O076': ['h:-10 rg:1', 'check:stealth fail(h:8)', 'check:charm h:-3 fail(h:6 wanted:2)'],
    'O077': ['check:stealth h:-5 rg:1 fail(rg:-3 h:5)', 'dr:4 rg:-2 h:3', 'check:charm rg:3 fail(rg:-1)'],
    'O078': ['cover:2'],
    'O079': ['ten:4 rg:2 h:-5 foil', E],
    'O080': ['money:-300 item:ultra-ball', 'money:-800 mon:local'],
    'O081': ['h:-15 wanted:-3', E],
    'O082': ['rg:3 h:-5', 'money:400 h:6'],
    'O083': ['money:-100', 'check:charm fail(money:-150)', 'fight:police h:6'],
    'O084': [E, 'rg:2 h:2'],
    'O085': ['h:-3', 'h:5 dr:1', 'rg:2 h:3'],
    # D. Gyms and the League
    'O086': ['rg:2', 'fight:leader dr:3 shaken', E],
    'O087': ['lead gymScout', 'rg:1 shaken', 'money:-100 gymScout rg:1'],
    'O088': ['check:charm gymScout fail(h:2)', 'fight:gym-guide gymScout dr:1', 'check:stealth gymScout scout fail(h:5)'],
    'O089': ['money:-300 gymScout', 'rg:2'],
    'O090': ['money:-200 ally rg:2', 'item:full-heal rg:-2'],
    'O091': ['rg:2', 'lead', 'dr:2 rg:-1'],
    'O092': ['fight:leader money:500 rg:2', 'gymScout'],
    'O093': ['dr:-2', 'check:stealth gymScout fail(h:4)', 'fight:gym-trainer gymScout dr:3 h:8'],
    'O094': ['money:-300 rg:3 ally', 'check:stealth money:400 fail(h:6 rg:-2)', 'dr:3 h:4 shaken'],
    'O095': ['gymScout rg:1', 'money:-500 edge:wits', 'fight:retired money:600 h:8 dr:3'],
    'O096': ['lead gymScout', 'rg:2 ally'],
    'O097': ['rg:2', 'dr:3 hero:2'],
    'O098': ['ten:4 rg:2', 'money:-600 ally ten:2'],
    'O099': ['h:-3', 'fight:e4 dr:5 wanted:-5', 'check:charm wanted:-5 h:-5 fail(h:5)'],
    'O100': ['scout wanted:-2', 'fight:e4 money:800 dr:5 h:15'],
    'O101': [E, 'check:charm rg:4 hero:-1 fail(hero:1)', 'scout'],
    'O102': ['rg:2 dr:1', 'money:-100 papers:1'],
    'O103': ['check:wits rg:1 fail(h:4)', 'money:-200', E],
    'O104': ['money:-1500 racket rg:2', 'racket dr:3 h:3'],
    'O105': ['check:stealth dirt dr:4 h:25 fail(h:30 wanted:5)', 'rg:1'],
    'O106': ['check:charm rg:1 fail(rg:-2)', 'dr:4 rg:-1', 'money:-300 ally'],
    'O107': ['fight:gym-trainer rg:1 lose()'],
    'O108': ['fight:e4 dr:4 h:8', 'money:-300 rg:2 wanted:-2'],
    'O109': ['fight:gym-trainer gymScout lose()', 'rg:1', E],
    'O110': ['gymScout', 'fight:gym-trainer money:500 h:10 dr:3', 'control:5 rg:1'],
    # E. Trainers on the road
    'O111': ['fight:bug-catcher money:60', E],
    'O112': ['rg:2 money:100', 'fight:hiker money:200 dr:2 h:4', 'money:-200 item:moon-stone'],
    'O113': ['fight:ace-trainer money:300 rg:1', 'fight:ace-trainer lead'],
    'O114': ['money:-300 mon:local', 'mon:local h:6 dr:2'],
    'O115': ['check:wits fail(h:4)', 'fight:ranger dr:2 h:4'],
    'O116': ['fight:black-belt edge:brawn', E],
    'O117': ['fight:fisherman rg:1', 'money:-100'],
    'O118': ['money:-100 mor:3', 'fight:hex-maniac mor:2'],
    'O119': ['money:-300 edge:wits', 'check:stealth item:metal-coat h:4 fail(h:8)', 'edge:wits'],
    'O120': ['fight:cooltrainers money:400', 'money:-600 lead'],
    'O121': ['rg:2', E],
    'O122': ['fight:swimmer money:150', 'check:brawn rg:2 fail(mor:-2)'],
    'O123': ['money:-150', 'fight:bikers dr:3 money:150', 'check:charm lead rg:-1 fail(money:-150)'],
    'O124': ['edge:wits', E],
    'O125': ['fight:trainer mon:local h:10 dr:3', 'money:-500 mon:local'],
    'O126': ['edge:wits', 'fight:veteran edge:brawn'],
    'O127': ['money:100', 'rg:1'],
    'O128': ['fight:ace-duo money:500 dr:3', 'dr:-1'],
    'O129': ['money:-100 scout', E],
    'O130': ['fight:rich-boy money:200'],
    'O131': ['rg:1 dr:-1', E],
    'O132': ['mor:2', 'mor:3 rg:1'],
    'O133': ['check:stealth money:100 fail()'],
    'O134': ['scout'],
    'O135': ['check:wits money:200 fail(money:-200)', 'fight:sailor money:150'],
    'O136': ['fight:gambler money:500 lose(money:-500)', E],
    'O137': ['item:moon-stone', 'money:150 h:4 dr:1'],
    'O138': ['fight:juggler money:150', E],
    'O139': ['money:250 rg:2'],
    'O140': ['fight:gentleman money:300 rg:1', 'edge:wits'],
    # H. Professors, labs and science
    'O186': ['rg:3 money:200', 'money:400 rg:-1'],
    'O187': ['fight:guard money:500 h:12 dr:2', 'scout'],
    'O188': ['money:150 rg:1', 'item:lucky-egg h:6'],
    'O189': ['edge:wits rg:1', 'dr:2 h:4'],
    'O190': ['money:-800 mon:omanyte', 'check:stealth mon:kabuto h:10 fail(h:12)'],
    'O191': ['check:stealth item:thunder-stone h:10 fail(h:12)', 'money:-600 item:thunder-stone'],
    'O192': ['rg:2 edge:wits', 'money:300 h:8 dr:2'],
    'O193': ['check:stealth dr:3 h:4 fail(h:10 rg:-2)', 'money:-500 racket'],
    'O194': ['item:full-heal h:8 dr:2', 'rg:3 money:150'],
    'O195': ['lead', 'rg:2'],
    'O196': ['money:-250 scout', E],
    'O197': ['rg:3', 'money:300 dr:2 h:4'],
    'O198': ['money:-400 contact:hacker', 'check:nerve contact:hacker dr:2 fail(h:6)'],
    'O199': ['check:wits item:moon-stone fail()'],
    'O200': ['rg:1'],
    'O201': ['fight:guard mon:porygon h:15 dr:3', 'rg:1'],
    'O202': ['dr:3 h:4 rg:-2', 'money:-300 rg:3'],
    'O203': ['racket rg:1', 'racket money:150 dr:2 h:3'],
    'O204': ['item:metal-coat'],
    'O205': ['rg:2 h:5 hero:1', 'check:charm h:-3 fail(h:5 rg:-2)', 'ten:4 h:-5'],
    # I. Wild Pokémon and nature
    'O206': ['fight:wild mon:local', 'scout', E],
    'O207': [E, 'fight:tauros edge:brawn', 'rg:-2 h:3 scout'],
    'O208': ['fight:wild mon:local', 'ten:-1 money:100'],
    'O209': ['rg:3', 'mon:local rg:-1', 'dr:2'],
    'O210': ['fight:wild money:200 rg:2', 'mon:local', 'ten:3 h:4'],
    'O211': ['rg:5 lead', 'money:300 h:8 dr:4', 'rg:2'],
    'O212': ['rg:3 mon:local', 'edge:nerve', 'money:300 h:4'],
    'O213': ['mon:local mor:2', 'rg:1', 'money:300 rg:-2'],
    'O214': ['fight:alpha item:thunder-stone', E, 'ten:3 foil'],
    'O215': ['money:150', 'money:-100 cover:3', 'ten:2 dr:1'],
    'O216': ['item:potion', 'item:super-potion', 'racket'],
    'O217': ['fight:snorlax money:800', 'check:charm money:300 fail()', E],
    'O218': ['check:wits mon:local fail(item:super-potion)', 'safehouse', 'rg:2'],
    'O219': ['item:water-stone', 'route', E],
    'O220': ['mon:local', 'rg:2', 'money:500'],
    'O221': ['rg:6', 'money:600 h:10 dr:5', 'racket control:3'],
    'O222': ['fight:meowth mon:meowth', 'mon:meowth rg:1', 'dr:2 h:3 money:80'],
    'O223': ['scout', E, 'fight:wild mon:local'],
    'O224': ['money:200 rg:1', 'money:150 h:2', 'ten:2 dr:1'],
    'O225': [E, 'cover:1 edge:stealth', 'fight:trainer money:200 dr:2'],
    'O226': ['rg:2 item:moon-stone', E],
    'O227': ['check:wits scout edge:wits fail()', 'ten:-2 money:300', 'hero:2 rg:3'],
    'O228': ['mon:local', 'check:charm mon:local fail()', 'mon:local h:3 rg:-1'],
    'O229': ['mon:local rg:-3', 'rg:3 h:-3', 'mon:local dr:2'],
    'O230': ['money:-300 rg:4 hero:-1', 'money:200 h:6 dr:3', 'rg:1'],
    # K. Crime world and black market
    'O251': ['money:600 h:3', 'fight:target money:300 h:6', 'rg:2 h:-5'],
    'O252': ['sell:60', 'check:charm sell:80 fail(sell:60)', 'money:150 rg:-2'],
    'O253': ['money:-100 edge:stealth', E, 'dr:2 h:4'],
    'O254': ['fight:brawler money:300', 'check:wits money:200 fail(money:-200)', 'money:400 h:8 dr:3'],
    'O255': ['money:-200 papers:1', 'contact:forger dr:2', E],
    'O256': ['check:wits money:300 fail(money:-250)', 'check:stealth money:600 fail(h:6 money:-200)', 'racket dr:2 h:4'],
    'O257': ['money:-100 safehouse', 'money:-600 safehouse', E],
    'O258': ['money:-800 ten:6 foil h:15', E, 'rg:3 h:-5'],
    'O259': ['money:-400', 'fight:blackmailer dr:2', 'check:wits h:-3 fail(h:10)'],
    'O260': ['money:-300 lead', 'fight:collector dr:2 lead', E],
    'O261': ['h:4 lead', 'rg:2 cover:3'],
    'O262': ['money:-400 item:ultra-ball', 'fight:target money:600 h:10 dr:2'],
    'O263': ['money:-150 item:super-potion', 'money:-400 contact:medic'],
    'O264': ['racket', 'fight:gang dr:4 control:5', 'check:wits control:3 fail(h:4)'],
    'O265': ['money:400 h:4', 'money:150'],
    'O266': ['check:wits rg:3 fail(rg:1)', E],
    'O267': ['money:-500 tip:7', 'rg:4'],
    'O268': ['money:-300 cover:3', E],
    'O269': ['dr:3 h:4', 'money:-200 h:-5', 'check:wits foil h:-3 fail(h:5)'],
    'O270': ['heist', E],
    'O271': ['lead mor:1', E],
    'O272': ['ten:3 intel', 'money:200 h:4'],
    'O273': ['money:300 h:2', 'rg:2'],
    'O274': ['money:-200 contact:fence', 'check:stealth intel scout fail(h:6)', 'fight:gang money:500 dr:4 h:10'],
    'O275': ['check:wits rg:3 fail()', 'money:500 dr:3 h:15'],
}

NEEDS = {
    **{k: {'gym': True} for k in ['O043', 'O057'] + [f'O{n:03d}' for n in list(range(86, 99)) + list(range(104, 111))]},
    'O053': {'rival': True}, 'O055': {'rival': True}, 'O069': {'rival': True}, 'O079': {'rival': True},
    'O064': {'wanted': 60}, 'O099': {'wanted': 60}, 'O074': {'wanted': 70}, 'O071': {'jailed': True},
}
NEEDS['O098'] = {'gym': True, 'rival': True}



def parse(text):
    """'a:1 b fail(c:2)' -> dict."""
    out = {}
    i = 0
    text = text.strip()
    while i < len(text):
        if text[i] == ' ':
            i += 1
            continue
        m = re.match(r'(fail|lose)\(', text[i:])
        if m:
            depth, j = 1, i + len(m.group(0))
            while depth:
                depth += {'(': 1, ')': -1}.get(text[j], 0)
                j += 1
            out[m.group(1)] = parse(text[i + len(m.group(0)):j - 1])
            i = j
            continue
        tok = text[i:].split(' ', 1)[0]
        i += len(tok)
        k, _, v = tok.partition(':')
        assert k not in out, (text, k)
        if k in NUM:
            out[k] = int(v)
        elif k in WORD:
            assert v, (text, k)
            out[k] = v
        elif k in FLAG and not v:
            out[k] = True
        else:
            raise SystemExit(f'unknown token {tok!r} in {text!r}')
    return out


doc = json.load(open(path, encoding='utf-8'))
outside = {r['id']: r for r in json.load(open(os.path.join(root, 'src', 'data', 'dominion', 'outside.json'), encoding='utf-8'))['rows']}
items = {x['id'] for x in json.load(open(os.path.join(root, 'src', 'data', 'items.json'), encoding='utf-8'))}
sections = set('BCDEHIK')
assert sorted(S) == sorted(k for k, r in outside.items() if r['section'] in sections), 'every row of B-E, H, I, K, once'
for k, choices in S.items():
    assert len(choices) == len(outside[k]['choices']), (k, len(choices), outside[k]['choices'])
    parsed = [parse(c) for c in choices]
    for c in parsed:
        for fx in (c, c.get('fail', {}), c.get('lose', {})):
            if 'item' in fx:
                assert fx['item'] in items, (k, fx['item'])
            if 'fight' in c:
                assert c['fight'] in ('target', 'police', 'wild', 'leader') or c['fight'] in FOES, (k, c['fight'])
    doc['rows'][k] = parsed
doc['rows'] = dict(sorted(doc['rows'].items()))
doc['needs'] = dict(sorted({**doc['needs'], **NEEDS}.items()))
doc['foes'] = FOES
doc['meet']['edge'] = 3
doc['meet']['monBelow'] = 5
doc['_source'] = re.sub(r' \+ sections B.*$', '', doc['_source']) + ' + sections B-E, H, I and K (O031-O140, O186-O230, O251-O275), the D10 follow-up, written by tools/dominion/outside-d10.py'


def flat(v):
    """One line, written the way town.json is: { "k": v }, [a, b]."""
    if isinstance(v, dict):
        return '{ ' + ', '.join(f'{json.dumps(k, ensure_ascii=False)}: {flat(x)}' for k, x in v.items()) + ' }' if v else '{}'
    if isinstance(v, list):
        return '[' + ', '.join(flat(x) for x in v) + ']'
    return json.dumps(v, ensure_ascii=False)


def block(d):
    return '{\n' + ',\n'.join(f'  {json.dumps(k, ensure_ascii=False)}: {flat(v)}' for k, v in d.items()) + '\n }'


with open(path, 'w', encoding='utf-8') as f:
    f.write('{\n' + ',\n'.join([
        f' "_source": {json.dumps(doc["_source"], ensure_ascii=False)}',
        f' "meet": {flat(doc["meet"])}',
        f' "lines": {block(doc["lines"])}',
        f' "rows": {block(doc["rows"])}',
        f' "needs": {block(doc["needs"])}',
        f' "foes": {block(doc["foes"])}',
    ]) + '\n}\n')
assert json.load(open(path, encoding='utf-8')) == doc
print(len(S), 'rows written')
