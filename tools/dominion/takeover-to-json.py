"""DOMINION slice D14: the four takeover paths, the fourteen Goals and every takeover bonus, as game data.

  lists/takeover-bonuses.md  (every Gym, city and notable building in all nine regions) -> holdings
  Kice's evil_mode_goals.zip Parts 35a-35c (the fourteen Goals)                          -> goals
  Part 5 §1 (the four ways to take a region, Kanto values)                               -> paths

The list text is kept word for word (place, kind, size, bonus, catch). What the engine does with a place is its `fx`
list: Kanto's rows are worked out by hand below (KANTO), the other eight regions' rows are classified from their text
and wait for their region to open (D15). The Goals keep the doc's stage names, Turning Points, Scheme, endings and the
Hero's reason word for word; what feeds each Track and its Cost (GOALS) is this slice's reading of the Goal's systems.
Re-run after a list changes:
  python3 tools/dominion/takeover-to-json.py <plans/evil-mode-rework/lists> <dir with 35a/35b/35c_GOALS_*.md> src/data/dominion
"""
import json
import re
import sys

lists, goals_dir, out = sys.argv[1], sys.argv[2], sys.argv[3]


def slug(t):
    t = t.lower().replace('é', 'e').replace("'", '').replace('’', '').replace('.', '').replace('&', 'and')
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def clean(t):
    return re.sub(r'\*+', '', t).strip()


# ---------- holdings (takeover-bonuses.md §3) ----------

REGIONS = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea']
SIZES = {'S', 'M', 'L', 'XL'}
KIND = {'gym': 'gym', 'league': 'league', 'annex': 'annex', 'infiltrate': 'infiltrate', 'buy-out': 'buyout', 'buyout': 'buyout',
        'seize': 'seize', 'raid': 'raid', 'home': 'home', 'landmark': 'seize', 'trial': 'gym', 'stadium': 'gym', 'kahuna': 'gym',
        'star': 'raid', 'base': 'raid', 'champion': 'league', 'cup': 'league'}
GROUP_WORDS = [
    ('Sea & Ports', r'port|harbou?r|ship|ss |s\.s\.|ferry|boat|bridge|marina|dock|sea|island|beach|lighthouse|pier|aquarium|wharf'),
    ('Industry & Labs', r'lab|co\.|corp|plant|museum|factory|institute|foundation|power|research|tower radio|radio|tv|station|observatory|space|mine|works|devon|silph|macro'),
    ('Commerce', r'store|mart|corner|shop|market|mall|boutique|caf[eé]|restaurant|bank|casino|salon|tailor|hotel|condominium'),
    ('Venues & Sport', r'dojo|stadium|club|contest|frontier|battle|tree|maison|arena|theatre|theater|musical|hall|resort|tournament|academy of'),
    ('Wild & Nature', r'cave|forest|safari|route|mt\.|mount|lake|road|tunnel|woods|meadow|desert|canyon|volcano|garden|park|ruins|islands|cove|marsh|bog|zone|wild area'),
    ('Homes & People', r'house|home|day care|nursery|academy|school|daycare|villa|mansion|manor|cabin'),
]


def group_of(place, kind):
    if kind in ('gym', 'league'):
        return 'Gyms'
    p = place.lower()
    for g, rx in GROUP_WORDS:
        if re.search(rx, p):
            return g
    return 'Landmarks'


def classify(text):
    """A rough reading of a row's Bonus for a region that isn't open yet (D15 opens it and checks each row)."""
    fx = []
    m = re.search(r'\+?₽([\d,]+)\s*/\s*day', text)
    if m:
        fx.append(dict(k='income', n=int(m.group(1).replace(',', '')) * 7))
    m = re.search(r'Regard \+(\d+)', text)
    if m:
        fx.append(dict(k='regard', n=int(m.group(1)), where='district'))
    m = re.search(r'Dread \+(\d+)', text)
    if m:
        fx.append(dict(k='dread', n=int(m.group(1)), where='district'))
    m = re.search(r'Heat −(\d+)', text)
    if m:
        fx.append(dict(k='heat', n=int(m.group(1))))
    if re.search(r'recruit', text, re.I):
        fx.append(dict(k='recruit', n=1))
    return fx


holdings, sets = [], []
region = None
section = None
for line in open(f'{lists}/takeover-bonuses.md', encoding='utf-8'):
    m = re.match(r'^## 3\.(\d) ', line)
    if m:
        region = REGIONS[int(m.group(1)) - 1]
        continue
    if line.startswith('# 4.'):
        region = None
    if not region:
        continue
    m = re.match(r'^### (.+)', line)
    if m:
        section = m.group(1).strip()
        continue
    m = re.match(r'^\*\*Set bonuses \((\w+)\):\*\* (.+)', line.strip())
    if m:
        for part in re.split(r'\.\s+(?=\d)', m.group(2).rstrip('.')):
            mm = re.match(r'(\d+) ([^=]+?) = ([^(]+?) \((.+)\)', part.strip())
            if mm:
                sets.append(dict(region=region, n=int(mm.group(1)), group=mm.group(2).strip(), name=mm.group(3).strip(), text=mm.group(4).strip()))
        continue
    if not line.startswith('| ') or line.startswith('| Place') or line.startswith('| ---'):
        continue
    c = [x.strip() for x in line.strip().strip('|').split('|')]
    if len(c) != 4:
        continue
    place = clean(c[0])
    ks = clean(c[1]).split()
    size = ks[-1] if ks and ks[-1] in SIZES else 'M'
    kw = ' '.join(ks[:-1] if ks and ks[-1] in SIZES else ks).lower()
    kind = next((v for k, v in KIND.items() if kw.startswith(k)), 'seize')
    bm = re.match(r'\*\*(.+?):\*\*\s*(.+)', c[2])
    bonus = dict(name=clean(bm.group(1)) if bm else place, text=clean(bm.group(2) if bm else c[2]))
    holdings.append(dict(id=f'{region}:{slug(place)}', region=region, place=place, section=section, kind=kind, size=size,
                         group=group_of(place, kind) if kind != 'annex' else 'City', bonus=bonus, catch=clean(c[3])))

# Kanto, by hand (Part 3 §5, D10's businesses and Gyms, D9's rival sites). via: what D10/D9 state already holds the place.
# fx: what the bonus does each week (see takeover.ts). `limited` names the part of the Bonus no system acts on yet.
WILD = ['clefairy', 'paras', 'zubat', 'geodude']
SAFARI = ['exeggcute', 'rhyhorn', 'nidoran-f', 'nidoran-m', 'venonat', 'doduo', 'kangaskhan', 'tauros', 'scyther', 'pinsir', 'chansey']
GUARD = dict(name='Guards', cls='veteran', species=['growlithe', 'machop'], offset=0)
SCI = dict(name='Scientists', cls='scientist', species=['magnemite', 'koffing', 'voltorb'], offset=1)
KANTO = {
    'pewter-gym-brock': dict(d='pewter', via='gym:pewter-gym', fx=[dict(k='train', stat='brawn')], limited='Rock and Ground crew taking −20% damage waits for a battle hook; Hardiness training is Brawn training.'),
    'cerulean-gym-misty': dict(d='cerulean', via='gym:cerulean-gym', fx=[dict(k='catch', n=1, species=['goldeen', 'horsea', 'staryu', 'psyduck', 'poliwag'])], limited='Fishing hauls +25% wait for fishing.'),
    'vermilion-gym-lt-surge': dict(d='vermilion', via='gym:vermilion-gym', fx=[dict(k='odds', n=5, where='district')], limited='Electric crew +1 Speed waits for a battle hook; the lock puzzle opening doors is +5% on jobs in Vermilion.'),
    'celadon-gym-erika': dict(d='celadon', via='gym:celadon-gym', fx=[dict(k='odds', n=15, stat='charm', where='region'), dict(k='heal')], limited='Grass crew heal each night: every crew Pokémon heals each week.'),
    'fuchsia-gym-koga': dict(d='fuchsia', via='gym:fuchsia-gym', fx=[dict(k='heat', n=5, where='region'), dict(k='odds', n=5, stat='stealth', where='region')]),
    'saffron-gym-sabrina': dict(d='saffron', via='gym:saffron-gym', fx=[dict(k='intel')], limited='Psychic crew +10% crit waits for a battle hook.'),
    'cinnabar-gym-blaine': dict(d='cinnabar', via='gym:cinnabar-gym', fx=[dict(k='item', id='lucky-egg', n=1)], limited='Fire crew +15% damage waits for a battle hook; the quiz is one free item a week (a Lucky Egg: the game has no Rare Candy).'),
    'viridian-gym-giovanni': dict(d='viridian', via='hq', fx=[dict(k='dread', n=3, where='region')], limited='Ground crew +20% damage waits for a battle hook.'),
    'indigo-plateau-league': dict(d='viridian', via='champion', fx=[dict(k='train', stat='brawn'), dict(k='dread', n=2, where='region')], limited='Filling an Elite Four seat with your crew waits for D15 (holders).'),
    'mt-silver-league-peak': dict(d='viridian', needs='champion', foe=dict(name='Ace Trainer', cls='ace-trainer', species=['ursaring', 'donphan', 'tyranitar'], offset=4), fx=[dict(k='hero', n=3)], limited='Red appearing waits for D15.'),
    'pallet-town-city': dict(d='pallet', fx=[dict(k='recruit', n=1)]),
    'viridian-city': dict(d='viridian', needs='hq', fx=[dict(k='heat', n=2, where='region')], limited='The Trainer House practice battle waits for D15.'),
    'pewter-city': dict(d='pewter', fx=[dict(k='income', n=700), dict(k='catch', n=1, species=['geodude', 'onix', 'rhyhorn'], every=14)], limited='Construction −10% is paid back as ₽700 a week; Rock-type Pokémon "in the shop" come to the Reserve every two weeks.'),
    'cerulean-city': dict(d='cerulean', fx=[dict(k='income', n=2100)]),
    'vermilion-city': dict(d='vermilion', fx=[dict(k='income', n=1400)], limited='SS Anne access and +2 smuggling routes wait for D15 (routes per region): paid as harbour fees.'),
    'lavender-town': dict(d='lavender', fx=[dict(k='heat', n=10)], limited='Ghost crew +10% evasion waits for a battle hook.'),
    'celadon-city': dict(d='celadon', fx=[dict(k='income', n=3500)]),
    'saffron-city': dict(d='saffron', fx=[dict(k='cut', n=5)]),
    'fuchsia-city': dict(d='fuchsia', fx=[dict(k='catch', n=1, species=SAFARI)]),
    'cinnabar-island': dict(d='cinnabar', fx=[dict(k='item', id='fire-stone', n=1)], limited='The Lab\'s research is the Cinnabar Lab\'s own Holding.'),
    'oaks-lab-pallet': dict(d='pallet', fx=[dict(k='recruit', n=1), dict(k='intel')], limited='Seeing wild levels and free starters for recruits wait for D15.'),
    'reds-house-pallet': dict(d='pallet', fx=[dict(k='heal'), dict(k='loyalty', n=2)]),
    'blues-house-pallet': dict(d='pallet', fx=[dict(k='intel')]),
    'pokemon-academy-viridian': dict(d='viridian', fx=[dict(k='recruit', n=1)]),
    'pewter-museum-of-science': dict(d='pewter', fx=[dict(k='catch', n=1, species=['aerodactyl', 'omanyte', 'kabuto'], every=28)], limited='The monthly fossil comes back to life at once and joins the Reserve.'),
    'mt-moon-cave': dict(d='pewter', site='mt-moon-dig', foe=dict(name='Hiker', cls='hiker', species=['geodude', 'onix', 'zubat'], offset=0), fx=[dict(k='item', id='moon-stone', n=1), dict(k='catch', n=1, species=['clefairy'])]),
    'bills-house-route-25': dict(d='cerulean', fx=[dict(k='odds', n=5, where='district')], limited='Storage +100 waits for D15: Bill\'s help is +5% on jobs in Cerulean.'),
    'nugget-bridge': dict(d='cerulean', site='nugget-bridge-post', foe=dict(name='Bridge trainers', cls='youngster', species=['rattata', 'ekans', 'pidgey', 'mankey', 'abra'], offset=0), fx=[dict(k='income', n=2100)]),
    'ss-anne-docked-at-vermilion': dict(d='vermilion', fx=[dict(k='recruit', n=1)], limited='A floating HQ room set waits for D15.'),
    'pokemon-fan-club-vermilion': dict(d='vermilion', fx=[dict(k='regard', n=2, where='district'), dict(k='once', regard=10), dict(k='loyalty', n=1)], limited='Pikachu and Raichu Loyalty: every member +1 Loyalty a week.'),
    'digletts-cave': dict(d='vermilion', foe=dict(name='Rival squad', cls='veteran', species=['diglett', 'dugtrio'], offset=0), fx=[dict(k='odds', n=5, where='district')], limited='Fast travel waits for a Dominion map: the shortcut is +5% on jobs in Vermilion.'),
    'rock-tunnel': dict(d='lavender', foe=dict(name='Hikers', cls='hiker', species=['geodude', 'machop', 'onix'], offset=0), fx=[dict(k='odds', n=5, where='district')], limited='Ghost crew +1 waits for a battle hook: a lit tunnel is +5% on jobs in Lavender.'),
    'pokemon-tower-lavender': dict(d='lavender', site='pokemon-tower-camp', fx=[dict(k='heat', n=3)], limited='Ghost crew +20% evasion and the Mr. Fuji event wait for D15.'),
    'radio-tower-lavender': dict(d='lavender', foe=GUARD, fx=[dict(k='regard', n=15, where='region'), dict(k='dread', n=15, where='region')], limited='Morning Report news from the Tower is D25\'s paper.'),
    'rocket-hideout-celadon-basement': dict(d='celadon', site='game-corner-hideout', foe=dict(name='Rocket Grunts', cls='veteran', species=['rattata', 'zubat', 'koffing', 'grimer'], offset=1), fx=[dict(k='heat', n=3), dict(k='dread', n=2, where='district')], limited='Six guard posts wait for HQ defence: the hidden base cools Celadon and adds Dread each week.'),
    'celadon-game-corner': dict(d='celadon', via='biz:game-corner', fx=[dict(k='clean', n=300), dict(k='catch', n=1, species=['porygon', 'abra'], every=28)]),
    'celadon-department-store': dict(d='celadon', via='biz:celadon-store', fx=[dict(k='item', id='rooftop-fresh-water', n=3)], limited='Shop prices −15% wait for a Dominion shop.'),
    'celadon-mansion': dict(d='celadon', fx=[dict(k='once', mon='eevee')], limited='The Dev Room\'s secrets are the one Eevee.'),
    'pokemon-day-care-route-5': dict(d='cerulean', fx=[dict(k='catch', n=1, species=['pichu', 'cleffa', 'igglybuff', 'togepi'], every=14)], limited='Raising stolen Pokémon faster waits for D15: the extra egg hatches every two weeks.'),
    'silph-co': dict(d='saffron', via='biz:silph-co', fx=[dict(k='once', item='master-ball'), dict(k='odds', n=10, where='district')], limited='Tech parts +50% and the free Garage wait for D15; the Card Key is +10% on jobs in Saffron.'),
    'fighting-dojo-saffron': dict(d='saffron', via='biz:fighting-dojo', fx=[dict(k='train', stat='brawn'), dict(k='train', stat='nerve')]),
    'copycats-house-saffron': dict(d='saffron', fx=[dict(k='item', id='ether', n=1)], limited='Duplicating any held item waits for D15: she copies an Ether each week.'),
    'safari-zone-fuchsia': dict(d='fuchsia', via='biz:safari-gate', fx=[dict(k='catch', n=2, species=SAFARI)], limited='Five a day would swamp the Reserve: two a week, rare chance kept in the pool.'),
    'wardens-house-fuchsia': dict(d='fuchsia', fx=[dict(k='once', funds=3000)], limited='The Gold Teeth event is the Warden\'s ₽3,000 thank-you; HM rewards wait for field moves in Dominion.'),
    'power-plant': dict(d='lavender', foe=dict(name='Wild guardians', cls='veteran', species=['voltorb', 'magnemite', 'electabuzz'], offset=2), fx=[dict(k='upkeep', n=30)], limited='Free power plays as −30% on the Holdings\' weekly upkeep.'),
    'cinnabar-pokemon-lab': dict(d='cinnabar', foe=SCI, fx=[dict(k='catch', n=1, species=['omanyte', 'kabuto', 'aerodactyl'], every=28)], limited='The Mewtwo rumour waits for D15.'),
    'pokemon-mansion-cinnabar': dict(d='cinnabar', needs='gym:cinnabar-gym', foe=dict(name='Burglars', cls='burglar', species=['growlithe', 'ponyta', 'grimer'], offset=1), fx=[dict(k='once', item='fire-stone'), dict(k='dread', n=1, where='district')], limited='The Secret Key opens Blaine\'s Gym, already yours; the diary\'s Mewtwo track waits for D15.'),
    'seafoam-islands': dict(d='fuchsia', foe=dict(name='Swimmers', cls='swimmer', species=['seel', 'shellder', 'slowpoke'], offset=1), fx=[dict(k='odds', n=5, where='district')], limited='The Articuno rumour, sea travel and Water/Ice +10% wait for D15: the islands are +5% on jobs in Fuchsia.'),
    'cerulean-cave': dict(d='cerulean', needs='champion', foe=dict(name='Cave dwellers', cls='ace-trainer', species=['golbat', 'parasect', 'rhydon', 'electrode'], offset=4), fx=[dict(k='catch', n=1, species=['ditto', 'chansey', 'kadabra', 'rhydon']), dict(k='item', id='ultra-ball', n=3)], limited='The Mewtwo rite waits for D15.'),
    'victory-road': dict(d='viridian', foe=dict(name='Cooltrainers', cls='ace-trainer', species=['machoke', 'marowak', 'golbat'], offset=2), fx=[dict(k='income', n=1500)]),
    'cycling-road-route-17': dict(d='celadon', foe=dict(name='Bikers', cls='biker', species=['grimer', 'koffing', 'weezing'], offset=0), fx=[dict(k='odds', n=5, where='district'), dict(k='recruit', n=1)], limited='Fast travel waits for a Dominion map: the road is +5% on jobs in Celadon.'),
}
FX_DONE = {'income', 'regard', 'dread', 'heat', 'loyalty', 'heal', 'recruit', 'catch', 'item', 'train', 'hero', 'odds', 'clean',
           'once', 'intel', 'cut', 'upkeep'}

seen = set()
for h in holdings:
    if h['region'] != 'kanto':
        fx = classify(h['bonus']['text'])
        h.update(fx=fx, status='disabled', needs='D15', district=None)
        continue
    key = h['id'].split(':', 1)[1]
    k = KANTO.get(key)
    if not k:
        raise SystemExit(f'Kanto row with no engine entry: {key}')
    seen.add(key)
    for f in k['fx']:
        if f['k'] not in FX_DONE:
            raise SystemExit(f'{key}: unknown fx {f}')
    h.update(district=k['d'], fx=k['fx'], status='limited' if k.get('limited') else 'supported')
    for opt in ('via', 'needs', 'site', 'foe'):
        if opt in k:
            h[opt] = k[opt]
    if k.get('limited'):
        h['note'] = k['limited']
missing = set(KANTO) - seen
if missing:
    raise SystemExit(f'KANTO rows not in the list: {sorted(missing)}')

for s in sets:
    s['fx'] = {'Gyms': [dict(k='odds', n=5, where='region')], 'Commerce': [dict(k='cut', n=20)],
               'Sea & Ports': [dict(k='income', n=1400)], 'Wild': [dict(k='catch', n=2, species=SAFARI)]}.get(s['group'], [])
    s['group'] = {'Wild': 'Wild & Nature', 'Sea & Ports': 'Sea & Ports', 'Commerce': 'Commerce', 'Gyms': 'Gyms'}.get(s['group'], s['group'])
    s['status'] = 'limited' if s['region'] == 'kanto' else 'disabled'
    if s['region'] == 'kanto':
        s['note'] = {'Gyms': 'Badge power +1 plays as +5% on every Boss action.', 'Commerce': 'Shop income +20% is +20% on what your Holdings pay.',
                     'Sea & Ports': 'An extra smuggling route waits for D15 (routes per region): paid as ₽1,400 a week.',
                     'Wild & Nature': 'Two more catches come weekly, not daily (the Reserve).'}[s['group']]


# ---------- the Goals (Parts 35a-35c) ----------

def section_rows(text, head):
    """Table rows (cells) under the first heading matching `head`, until the next heading."""
    m = re.search(head, text, re.M)
    if not m:
        return []
    rest = text[m.end():]
    stop = re.search(r'^#{1,3} ', rest, re.M)
    body = rest[:stop.start()] if stop else rest
    rows = []
    for line in body.splitlines():
        if line.startswith('| ') and not line.startswith('| ---'):
            rows.append([x.strip() for x in line.strip().strip('|').split('|')])
    return rows


doc = ''.join(open(f'{goals_dir}/{f}', encoding='utf-8').read() for f in ('35a_GOALS_I.md', '35b_GOALS_II.md', '35c_GOALS_III.md'))
blocks = re.split(r'^# (\d+)\. ', doc, flags=re.M)
parsed = {}
for i in range(1, len(blocks) - 1, 2):
    n = int(blocks[i])
    if n > 14:
        continue
    body = blocks[i + 1]
    name = body.splitlines()[0].strip().title()
    track = re.search(r'\*\*The Track:\*\* \*\*(.+?)\*\*', body).group(1)
    reason = re.search(r"\*\*The Hero's reason:\*\* \*\"?(.+?)\"?\*", body)
    stages = []
    for c in section_rows(body, r'^## \d+\.\d+ (?:The )?Turning Points.*$'):
        if len(c) == 3 and c[0].startswith('**'):
            tp = re.match(r'\*\*(.+?)\*\*[.:]?\s*(.*)', c[2])
            stages.append(dict(name=clean(c[0]), range=clean(c[1]), title=clean(tp.group(1)) if tp else clean(c[2]), scene=clean(tp.group(2)) if tp and tp.group(2) else clean(c[2])))
    endings = []
    for table in re.findall(r'^\| Ending \| Needs \|.*\n\| ---.*\n((?:\|.*\n)+)', body, re.M):
        for line in table.splitlines():
            c = [x.strip() for x in line.strip().strip('|').split('|')]
            if len(c) == 3:
                endings.append(dict(name=clean(c[0]), needs=clean(c[1]), scene=clean(c[2])))
    parsed[n] = dict(name=name, track=track, reason=clean(reason.group(1)) if reason else None, stages=stages[:5], endings=[e for e in endings if not e['name'].startswith('Wish')][:4])

# What feeds each Track and its Cost. `metrics`: points per one more of a measured thing (counted each night against
# the last night: Gyms you hold, businesses, held towns, Holdings, rival sites, Legendaries driven off, members, the
# Reserve, the League beaten, HQ level, a town's Dread or Regard in tens). `sections`: points per worked Boss action of
# that list section. The Cost rises the same way and falls by `decay` a week. At `warn` the region pushes back (Heat in
# the HQ's town each week); at 10 the Opposition strikes (the Track −5 a week until the Cost is back under `warn`).
GOALS = {
    'total-takeover': dict(n=1, cost='Exposure', costText='Every Lever pulled leaves a trail. At 8 the region\'s institutions merge against you.',
        opp=dict(name='The Champion', line='The Champion acts personally.', foe=dict(name='Champion', cls='gym-leader', leaderId='blue', species=['pidgeot', 'alakazam', 'rhydon', 'arcanine', 'exeggutor', 'gyarados'])),
        metrics=dict(gyms=8, biz=4, holdings=3, held=3, sites=2, elite=4), sections={'Pressure and Money': 0.5, 'Law and Police': 1, 'Corporate and Lab Ops': 1, 'Gyms and Heroes': 1},
        costMetrics=dict(gyms=1, biz=0.5, holdings=0.5), costSections={'Law and Police': 1}),
    'land-preservation': dict(n=2, cost='Displaced', costText='People moved for the land or the sea. At 20 households the Displaced form a camp.',
        opp=dict(name='The Rival Pole', line='The opposite team reclaims toward its own Pole.', foe=dict(name='Rival Admin', cls='gym-leader', leaderId='archer', species=['camerupt', 'sharpedo', 'mightyena', 'crobat'])),
        metrics=dict(held=4, holdings=3, legends=6, pens=0.3), sections={'Territory and Districts': 1, 'Pokémon': 1, 'Pokémon Handling': 1, 'Dungeons and Sites': 1, 'Legendary and Rare Events': 2},
        costMetrics=dict(holdings=1, held=1), costSections={'Territory and Districts': 0.5}),
    'perfect-order': dict(n=3, cost='Life', costText='Every correction lowers a town\'s Life. A perfectly ordered town is one nobody walks through for fun.',
        opp=dict(name='The Hero', line='The Hero notices first.', foe=dict(name='Commander', cls='gym-leader', leaderId=None, species=['honchkrow', 'weavile', 'bronzong', 'toxicroak'])),
        metrics=dict(held=3, hq=6, holdings=2, dread=2), sections={'Corporate and Lab Ops': 2, 'Gadgets and Technology': 2, 'Law and Police': 1, 'Legendary and Rare Events': 1},
        costMetrics=dict(dread=1, held=1), costSections={'Corporate and Lab Ops': 0.5}),
    'herald-of-legends': dict(n=4, cost='Zeal', costText='How much the team needs it to be true. At 6 the crew stops questioning the Text.',
        opp=dict(name='The Hermit', line='Mr. Severin Hollis charges in conversation.', foe=dict(name='Hermit Hollis', cls='hiker', leaderId=None, species=['bronzong', 'xatu', 'claydol', 'noctowl'])),
        metrics=dict(legends=10, held=2, holdings=2), sections={'Legendary and Rare Events': 3, 'Travel and Exploration': 1, 'Dungeons and Sites': 1, 'Intel and Spying': 0.5},
        costMetrics=dict(legends=1), costSections={'Legendary and Rare Events': 0.5, 'Influence and Propaganda': 0.5}),
    'ultra-divinity': dict(n=5, cost='Contempt', costText='As Ascension rises, the Boss looks down on this world\'s Pokémon, and they know it.',
        opp=dict(name='Anouk', line='The Boss\'s older sister runs a shelter in the first town.', foe=dict(name='Anouk Halcyon', cls='veteran', leaderId=None, species=['blissey', 'arcanine', 'togekiss', 'lapras'])),
        metrics=dict(legends=8, pens=0.5, hq=4), sections={'Legendary and Rare Events': 2, 'Pokémon': 1, 'Gadgets and Technology': 1, 'Corporate and Lab Ops': 1},
        costMetrics=dict(pens=0.2, legends=1), costSections={'Pokémon Handling': 0.5},
        # Part 35b §5 has no Turning Point table: the five chapters are its sections, in order.
        stages=[dict(name='The Chosen Beast', range='0–20', title='The Chosen Beast', scene='The Boss picks the Ultra Beast they worship: purity, strength, grace, form or change.'),
                dict(name='Ultra Rites', range='20–40', title='The first Rite', scene='A hole opens in the sky to pray at. One time in three, a Beast comes through.'),
                dict(name='The Menagerie', range='40–60', title='The glass', scene='The first Pokémon goes into cold sleep behind glass. Its Welfare is on its plaque.'),
                dict(name='Anouk', range='60–80', title='She visits', scene='Anouk stands at the base\'s gate. She won\'t come in. "I\'ll stand here. You come out."'),
                dict(name='Union', range='80–100', title='The Scheme', scene='The chosen Beast offers Union. The Boss can accept, or live with having been asked.')]),
    'spores-of-creation': dict(n=6, cost='The Burn Line', costText='Rangers and a woman who unbonded draw a line the spores may not cross.',
        opp=dict(name='The Burn Line', line='Ms. Elspeth Morrow, who was bonded for six years and chose to leave.', foe=dict(name='Ranger Morrow', cls='veteran', leaderId=None, species=['ninetales', 'arcanine', 'magmar', 'charizard'])),
        metrics=dict(members=6, held=2, pens=0.3), sections={'Persuasion and Crew': 1, 'People and Recruiting': 1, 'Crew Growth and Culture': 1, 'Pokémon Handling': 1},
        costMetrics=dict(members=1, held=1), costSections={'People and Recruiting': 0.5}),
    'pure-hate': dict(n=7, cost='Alone', costText='Hate eats the team first: Loyalty can\'t climb past 10 minus the region\'s Spite.', finish=False,
        opp=dict(name='Warmth', line='The world keeps being kind to the Boss anyway.', foe=dict(name='The Hero', cls='ace-trainer', leaderId=None, species=['pikachu', 'clefable', 'snorlax', 'lapras'])),
        metrics=dict(dread=4, held=2), sections={'Rivals and War': 1, 'Rival Warfare': 1, 'Betrayal and Loyalty': 1, 'Influence and Propaganda': 1, 'Public Image': 1},
        costMetrics=dict(dread=1), costSections={'Betrayal and Loyalty': 1}),
    'every-ball-opened': dict(n=8, cost='Broken Bonds', costText='Trainers left without. At 10 the Town has a support group; at 20 the Leaders refuse you.',
        opp=dict(name='The Hand', line='Someone on the crew is using the Boss.', foe=dict(name='The Hand', cls='gym-leader', leaderId=None, species=['zoroark', 'hydreigon', 'bisharp', 'krookodile'])),
        metrics=dict(held=3, gyms=4, holdings=2), sections={'Pokémon': 2, 'Pokémon Handling': 2, 'Theft and Heists': 1, 'Influence and Propaganda': 1, 'Public Image': 1},
        costMetrics=dict(gyms=1), costSections={'Theft and Heists': 1, 'Pokémon': 0.5}),
    'endless-energy': dict(n=9, cost='The Darkest Day', costText='What sleeps under the region\'s power stirs with every Wishing Star fed to a plant.',
        opp=dict(name='The Darkest Day', line='The Champion and the Hero fix it.', foe=dict(name='Chairman\'s guard', cls='gym-leader', leaderId=None, species=['copperajah', 'ferrothorn', 'klinklang', 'magnezone'])),
        metrics=dict(biz=5, holdings=4, hq=6, held=2), sections={'Corporate and Lab Ops': 2, 'Gadgets and Technology': 2, 'Pokémon Business': 1, 'Pressure and Money': 0.5},
        costMetrics=dict(holdings=1, biz=0.5), costSections={'Gadgets and Technology': 0.5}),
    'everlasting': dict(n=10, cost='Withering', costText='A town that gives up life for the Boss\'s years goes grey.',
        opp=dict(name='Time', line='Nothing the Boss does stops the clock for anyone else.', foe=dict(name='Celebi\'s keeper', cls='veteran', leaderId=None, species=['xatu', 'slowking', 'espeon', 'bronzong'])),
        metrics=dict(legends=10, holdings=2, hq=4), sections={'Legendary and Rare Events': 2, 'The Boss Himself: Training and Self': 2, 'Dungeons and Sites': 1, 'Travel and Exploration': 1},
        costMetrics=dict(holdings=1, legends=1), costSections={'Legendary and Rare Events': 0.5}),
    'every-window': dict(n=11, cost='Trust', costText='People stop trusting their own homes.',
        opp=dict(name='The Repairman', line='Mr. Cosimo Brannock knows what a Rotom sounds like when it\'s somewhere it shouldn\'t be.', foe=dict(name='Repairman Brannock', cls='worker', leaderId=None, species=['magnezone', 'porygon2', 'electivire', 'klinklang'])),
        metrics=dict(biz=4, holdings=3, held=3, hq=3), sections={'Intel and Spying': 2, 'Gadgets and Technology': 2, 'Detective Work': 1, 'Spies and Moles': 1},
        costMetrics=dict(holdings=1, biz=0.5), costSections={'Intel and Spying': 0.5}),
    'rightful-crown': dict(n=12, cost='Pretenders', costText='Every Legitimacy point the team gains, someone else claims the throne too.',
        opp=dict(name='The Pretenders', line='Someone else stands up in the square with a crown of their own.', foe=dict(name='Pretender', cls='gym-leader', leaderId=None, species=['aegislash', 'gallade', 'bisharp', 'gardevoir'])),
        metrics=dict(held=4, gyms=4, regard=3, holdings=2), sections={'Influence and Propaganda': 2, 'Public Image': 2, 'Persuasion and Crew': 1, 'Holding Regions': 1},
        costMetrics=dict(held=1, regard=1), costSections={'Public Image': 0.5}),
    'apex': dict(n=13, cost='Burnout', costText='The team\'s Pokémon, worn down by Harsh training and too many battles a day.',
        opp=dict(name='The Champion', line='"I\'ve heard. Come when you\'re ready. Not before."', foe=dict(name='Champion', cls='gym-leader', leaderId='blue', species=['pidgeot', 'alakazam', 'rhydon', 'arcanine', 'exeggutor', 'gyarados'])),
        metrics=dict(gyms=6, elite=8, sites=2, legends=4), sections={'Fighting and Battle': 2, 'Combat Specials': 2, 'Elite Four and Champion': 2, 'The Boss Himself: Training and Self': 1},
        costMetrics=dict(elite=1), costSections={'Fighting and Battle': 0.5, 'Combat Specials': 0.5}),
    'clean-slate': dict(n=14, cost='Repetition', costText='What\'s forgotten can happen again.',
        opp=dict(name='The Keepers', line='Mrs. Ignatia Winslow, 83, has told it every year since.', foe=dict(name='Keeper Winslow', cls='veteran', leaderId=None, species=['azelf', 'uxie', 'mesprit'])),
        metrics=dict(held=3, legends=6, regard=2), sections={'Influence and Propaganda': 1, 'Detective Work': 1, 'Legendary and Rare Events': 2, 'Public Image': 1},
        costMetrics=dict(held=1), costSections={'Influence and Propaganda': 0.5},
        stages=[dict(name='The Wound', range='0–20', title='Remembering', scene='Each town keeps it: a memorial, a song the school sings, an old man at the pub.'),
                dict(name='The Keepers', range='20–40', title='Mrs. Winslow', scene='She was a child when the Wound happened and has told it every year since.'),
                dict(name='The Lake Trio', range='40–60', title='Uxie asks', scene='"What will they not know?" A lie, and Uxie never helps again.'),
                dict(name='The Name', range='60–80', title='The twist', scene='The name in Winslow\'s story is the Boss\'s, or their mother\'s. It\'s been the Boss\'s memory all along.'),
                dict(name='The Slate', range='80–100', title='The Scheme', scene='The three lakes, in one night, on the Wound\'s anniversary.')]),
}

goals = []
founding = json.load(open(f'{out}/founding.json', encoding='utf-8'))
for fg in founding['goals']:
    g = GOALS[fg['id']]
    p = parsed[g['n']]
    stages = g.get('stages') or p['stages']
    if len(stages) != 5:
        raise SystemExit(f'{fg["id"]}: {len(stages)} stages')
    if not p['endings']:
        raise SystemExit(f'{fg["id"]}: no endings')
    goals.append(dict(id=fg['id'], name=fg['name'], track=p['track'], stages=stages, endings=p['endings'], reason=p['reason'] or '',
                      cost=dict(name=g['cost'], text=g['costText']), opposition=g['opp'], metrics=g['metrics'], sections=g['sections'],
                      costMetrics=g['costMetrics'], costSections=g['costSections'], finish=g.get('finish', True)))


# ---------- the D14 Boss actions (list rows 451-465 and 586-600) ----------
# Section rules like D10's (Lv 1 numbers). `effect` names takeover.ts's rule; `gate` the list's unlock D14 checks.
PLAY = {
    'study-the-elite-four': dict(kinds=['any'], chance=80, effect='league', win='You watch {target} train from the stands and learn their lead.', lose='A guard moves you along.'),
    'elite-bribe': dict(kinds=['any'], chance=70, cost=300, effect='league', win='The aide takes ₽300 and the match schedule changes hands.', lose='The aide pockets nothing and says nothing.'),
    'elite-duel': dict(kinds=['any'], chance=100, effect='league', win='An Elite Four member accepts.', lose='Not today.'),
    'elite-debate': dict(kinds=['any'], chance=60, regard=2, effect='league', win='You win a round on their ideals (+2 Regard).', lose='They hear you out and stay where they were.'),
    'champion-s-aide': dict(kinds=['any'], chance=65, cost=200, effect='league', win='₽200 for a note slipped under the door: the Champion\'s day plan.', lose='The aide looks past you.'),
    'hall-of-fame-heist': dict(kinds=['any'], chance=55, pay=[400, 900], heat=4, failHeat=8, win='₽{pay} of trophies from the Hall of Fame.', lose='An alarm in the Hall. You leave empty-handed.'),
    'league-rig': dict(kinds=['any'], chance=60, pay=[300, 600], heat=2, failHeat=5, win='You fix an early round. ₽{pay}.', lose='The referee won\'t be bought.'),
    'league-ticket': dict(kinds=['any'], chance=100, cost=120, regard=1, win='A seat at the League for ₽120. You\'re seen there (+1 Regard).'),
    'elite-rumour': dict(kinds=['any'], chance=65, effect='league', heat=1, win='A rumour about an Elite reaches the papers.', lose='Nobody repeats it.'),
    'elite-gift': dict(kinds=['any'], chance=75, cost=200, regard=1, effect='league', win='A gift to an Elite. They write back (+1 Regard).', lose='The gift comes back unopened.'),
    'champion-letter': dict(kinds=['any'], chance=60, effect='league', win='The Champion reads your letter.', lose='No answer.'),
    'pre-league-spar': dict(kinds=['any'], chance=70, xp=2, battle=dict(chance=100, on='always', foe='wild'), win='You spar with a League hopeful (+2 XP).', lose='The hopeful wins.'),
    'gate-guard-bribe': dict(kinds=['any'], chance=80, cost=150, effect='league', win='₽150 for a pass through the League gate.', lose='The guard calls a supervisor.'),
    'elite-s-weak-spot': dict(kinds=['any'], chance=60, effect='league', win='You learn an Elite\'s hobby, and who they trust.', lose='Nothing useful.'),
    'champion-duel': dict(kinds=['any'], chance=100, effect='league', win='The Champion accepts.', lose='Not today.'),
    'final-stand-prep': dict(kinds=['any'], chance=85, xp=2, effect='plan', where='hq', win='A plan for the Hero\'s last stand.', lose='The plan falls apart on paper.'),
    'takeover-speech': dict(kinds=['any'], chance=75, regard=3, effect='plan', win='A rally forms (+3 Regard).', lose='A thin crowd drifts off.'),
    'wipe-out-plan': dict(kinds=['any'], chance=80, xp=2, effect='plan', where='hq', win='A map of their routes on the wall.', lose='The map\'s wrong.'),
    'shadow-plan': dict(kinds=['any'], chance=80, xp=2, effect='plan', where='hq', win='A hidden front, drawn up.', lose='Too many loose ends.'),
    'monarch-plan': dict(kinds=['any'], chance=80, xp=2, effect='plan', where='hq', win='A banner designed.', lose='Nobody likes the banner.'),
    'goal-plan': dict(kinds=['any'], chance=80, xp=2, effect='plan', where='hq', win='A step toward the Goal, charted.', lose='The step goes nowhere.'),
    'region-sweep': dict(kinds=['any'], chance=70, pay=[200, 400], dread=1, win='A ring of stragglers cleared. ₽{pay}.', lose='They scatter before you get there.'),
    'final-ledger': dict(kinds=['any'], chance=85, pay=[300, 500], clean=True, where='hq', win='You close a page of the books. ₽{pay}, clean.', lose='The numbers won\'t balance tonight.'),
    'last-night': dict(kinds=['any'], chance=100, morale=3, where='hq', win='A last night before the takeover (crew Morale +3).'),
    'victory-parade': dict(kinds=['any'], chance=90, regard=4, win='A crowd cheers the parade (+4 Regard).', lose='Rain. Nobody comes.'),
    'crown-the-boss': dict(kinds=['any'], chance=100, dread=2, where='hq', win='A seat, and a crown on it (+2 Dread).'),
    'peace-treaty': dict(kinds=['any'], chance=80, tension=-4, where='hq', win='A pause in the war (Tension −4).', lose='They won\'t sign.'),
    'settle-scores': dict(kinds=['any'], chance=80, dread=2, heat=2, win='One old score settled (+2 Dread).', lose='They saw you coming.'),
    'pass-the-torch': dict(kinds=['any'], chance=100, loyalty=3, where='hq', win='You pick who carries on (+3 Loyalty).'),
    'farewell-feast': dict(kinds=['any'], chance=100, cost=200, loyalty=4, where='hq', win='A feast for the region (+4 Loyalty, ₽200).'),
    # Rows 87 and 128 waited for D14 too (the Radio Room's hijack; the Champion's ear).
    'pirate-radio': dict(kinds=['any'], chance=70, regard=1, dread=2, heat=3, effect='broadcast', win='Your clip cuts into the evening news in {district}.', lose='The engineers pull the plug before you go live.'),
    'meet-the-champion': dict(kinds=['any'], chance=60, regard=1, effect='league', win='The Champion hears you out in {district} and remembers your name.', lose='The Champion\'s people send you away.'),
}
STATUS = {k: dict(status='supported') for k in PLAY}
for k, note in {
    'study-the-elite-four': 'Studied Elite Four members fight 2 levels lower; learning their order and tell waits for D17\'s balance pass.',
    'elite-bribe': 'Each bribe sways the Champion\'s circle (Shadow\'s "Champion compromised" at 3 sway); the aide\'s vote at Lv 5 isn\'t acted on.',
    'elite-debate': 'A won debate sways the Elite: they field one Pokémon fewer.',
    'elite-rumour': 'The rumour sways one Elite: they field one Pokémon fewer. Stepping down at Lv 5 isn\'t acted on.',
    'elite-gift': 'A gift sways one Elite: they field one Pokémon fewer.',
    'champion-letter': 'Each letter is one sway toward "Champion compromised"; the pact of non-interference at Lv 5 isn\'t acted on.',
    'gate-guard-bribe': 'The pass is one sway toward "Champion compromised"; passes by length aren\'t tracked.',
    'elite-s-weak-spot': 'Leverage is one sway toward "Champion compromised".',
    'pre-league-spar': 'A hopeful joining at Lv 4 isn\'t acted on.',
    'final-stand-prep': 'Each plan is one Plan point (max 5): every point is one Pokémon fewer on the Hero\'s side at the final stand, down to 4.',
    'takeover-speech': 'Also one Plan point toward the path you are closest to.',
    'wipe-out-plan': 'The plan weakens the rival team (power −2).',
    'shadow-plan': 'Every town Regard +2.',
    'monarch-plan': 'Every town Dread +2.',
    'pirate-radio': 'The hijack plays the broadcast for the town; the clip naming a rival and the speech at higher levels read the same.',
    'meet-the-champion': 'Opens once the Elite Four are beaten (the Champion stage); each meeting is one sway toward "Champion compromised". The stand-down offer at Lv 5 isn\'t acted on.',
    'goal-plan': 'Your Goal Track +3 (a Rule team has no Goal: no effect beyond XP).',
}.items():
    STATUS[k] = dict(status='limited', note=note)
LEAGUE = dict(
    elite=[dict(id='lorelei', name='Lorelei', species=['dewgong', 'cloyster', 'slowbro', 'jynx', 'lapras'], offset=2),
           dict(id='bruno', name='Bruno', species=['onix', 'hitmonchan', 'hitmonlee', 'onix', 'machamp'], offset=3),
           dict(id='agatha', name='Agatha', species=['gengar', 'golbat', 'haunter', 'arbok', 'gengar'], offset=4),
           dict(id='lance', name='Lance', species=['gyarados', 'dragonair', 'dragonair', 'aerodactyl', 'dragonite'], offset=5)],
    champion=dict(id='blue', name='Blue', species=['pidgeot', 'alakazam', 'rhydon', 'arcanine', 'exeggutor', 'gyarados'], offset=6),
    # Q5: when the Hero is Blue (the Boss plays Red), Lance takes the Champion's seat and Karen his.
    standIn=dict(blue=dict(champion=dict(id='lance', name='Lance', species=['gyarados', 'dragonite', 'aerodactyl', 'charizard', 'kingdra', 'dragonite'], offset=6),
                           elite=dict(id='karen', name='Karen', species=['umbreon', 'vileplume', 'gengar', 'murkrow', 'houndoom'], offset=5))),
    studied=2, sway=3, plans=5, standMin=4,
)

LINES = {
    # path rows (s9 cards)
    'rowSites': '{n} of {of} {tag} sites taken', 'rowBossBeaten': '{boss} beaten at the HQ', 'rowBossNot': '{boss} still holds the HQ',
    'rowAdmins': '{n} of {of} Admins gone', 'rowRegard': 'Regard {n} (needs {of})', 'rowBiz': '{n} of {of} businesses owned',
    'rowBizPillar': '{n} of {of} businesses (Silph Co. and the Game Corner)', 'rowWanted': 'Wanted {n} (must stay at {max} or lower)',
    'rowPocket': '{n} of {of} Gym Leaders in your pocket', 'rowChampBought': 'The Champion is bought', 'rowChampNot': 'The Champion is not bought yet',
    'rowGyms': '{n} of {of} Gyms ruled', 'rowHeldPct': '{n}% of the region held (needs {of}%)', 'rowLeagueDone': 'The League has fallen',
    'rowElite': '{n} of 4 Elite Four beaten', 'rowEliteNot': 'Elite Four untouched', 'rowCitadel': 'HQ is a Citadel',
    'rowNoCitadel': 'HQ must grow into a Citadel', 'rowDread': 'Dread {n} (needs {of})', 'rowTrack': '{track} {n} / 100',
    'rowStage': 'Stage {n}: {name}', 'rowNoFinish': 'This Goal has no finish line. It only grows.', 'rowMomentWon': 'The Moment is won',
    'rowMoment': 'The Moment is ready: face the opposition', 'rowCost': '{cost} {n} / 10', 'rowRule': 'Pick a Goal on the Rule screen first',
    # Goal track
    'turningPoint': 'Turning Point. {track} reaches {stage}: {title}.', 'costWarn': '{cost} is at {n}. The streets heat up (+{heat} Heat everywhere).',
    'costStrike': '{who} strikes back. {track} falls by {n}.', 'momentReady': '{goal} is within reach. {who} stands in the way. Open the Takeover page to face them.',
    'momentNotYet': '{track} is {n} / 100. The Moment comes at 100.', 'momentStart': 'The Moment. {who} will not let {goal} happen without a fight.',
    'momentWon': '{who} falls. {goal} is real now.', 'momentLost': '{who} holds. {track} drops by {n}.',
    # Holdings
    'noPlace': 'That place is not in this region.', 'placeLater': 'This place opens in a later update ({slice}).',
    'seizing': '{place} is already being seized (done on day {day}).', 'alreadyHeld': '{place} is already yours.',
    'viaHq': 'This comes with beating the rival Boss at their HQ.', 'viaChampion': 'This comes with beating the Champion.',
    'viaGym': 'This comes with ruling the Gym in {town}.', 'viaBiz': 'This comes with owning the business in {town}.',
    'needs': 'Not yet: {need}.', 'need:champion': 'beat the Champion first', 'need:hq': 'beat the rival Boss at their HQ first',
    'need:gym:cinnabar-gym': 'rule the Cinnabar Gym first', 'siteFirst': 'Take the dig site at {place} first.',
    'fightWaits': 'A fight is already waiting. Finish it first.', 'dayOnly': 'Takeovers happen in the day phase.',
    'noActions': 'No Boss actions left today.', 'annexFirst': 'Take {n} more places in {town} first.',
    'scoutFirst': 'Send {n} more scouts to {town} first.', 'noMoney': 'You need ₽{cost}.',
    'mayor': 'The Mayor\'s guard', 'guards': 'Hired guards',
    'tookQuiet': 'Your people slip into {place}. Nobody notices. (₽{cost})', 'tookBuy': '{place} signs over to you for ₽{cost}.',
    'chainNext': 'Battle {n} of {of}: {name}.', 'seizeStart': 'Your crew starts seizing {place}. Hold it {days} more days.',
    'holdingNew': '{place} is yours. {bonus}: {text}', 'onceGot': '{place} hands over its treasure.',
    'holdingGone': '{place} slips away and {bonus} ends.', 'seizeHit': '{place} is fought over. Hold is at {n}%.',
    'seizeLost': 'The seizure of {place} fails.', 'unpaid': '{place} was not paid (₽{cost}) and its people turn on you.',
    'attacked': 'A rival hits {place}. Its hold drops to {n}%.', 'holdingLost': '{place} is lost.',
    'holdingsWeek': 'Your {count} Holdings pay ₽{n} this week.', 'setBonus': 'Set bonus: {name}. {text}',
    'placeLost': 'You could not take {place}.',
    # broadcast ticker
    'tickHolding': '{team} now runs {place}', 'tickRival': 'Team {rival} pulls out of {town}', 'tickPolice': 'Police advise staying indoors',
    'tickRegion': '{team} rules all of {region}', 'headRegion': '{team} now rules {region}',
    # paths and the region
    'pathWon': '{path} complete. {region} is yours.', 'pathAlso': '{path} is complete too.',
    'cracked': 'The Hero cracks under {n} paths at once.', 'taken': '{region} is Taken by {path}. The Hero\'s final stand begins.',
    # storm the rival HQ
    'noRival': 'No rival team is left here.', 'stormDone': '{boss} is already beaten.',
    'stormSites': 'Take {n} more {tag} sites before storming the HQ.', 'stormStart': 'You storm the HQ. {n} battles to {boss}.',
    'stormWon': '{boss} falls. {team} is finished here.', 'stormLost': 'The storm is pushed back. Try again another day.',
    # the League
    'eliteWon': '{name} is beaten ({n} of 4). {champion} is watching.', 'eliteAll': 'The Elite Four are beaten. Only {champion} is left.',
    'championWon': '{name} falls. The League is yours.', 'leagueLost': 'The League holds. Come back stronger.',
    'gateTaken': 'Take the region first.', 'gateStand': 'This opens at the Hero\'s final stand.', 'gateElite': 'Beat the Elite Four first.',
    'gateEliteDone': 'All four Elite Four are beaten.', 'gateChampDone': 'The Champion is already beaten.',
    'studyNone': 'Nobody left to study.', 'studied': 'You study {name}. Their ace will be {n} levels lower.',
    'swayed': '{name} looks the other way. Their team will not be ready.', 'sway': 'The Champion\'s people are leaning ({n} of {of}).',
    'champBought': '{name} is bought. The title is yours when you want it.', 'eliteFight': '{name} accepts your challenge.',
    'champFight': '{name} meets you on the stage.',
    # Plan actions
    'planPoint': 'The Plan grows ({n} of {of}). The Hero\'s stand will be smaller.', 'planWipe': 'Every rival loses ground in every town.',
    'planShadow': 'Every town warms to you (+2 Regard).', 'planMonarch': 'Every town fears you more (+2 Dread).',
    'planGoal': '{track} moves forward.', 'planLead': 'Your leading path is {path}.',
    # crew tasks
    'taskLoyalty': '{name} keeps the crew in line.', 'taskCoup': '{name} plants a traitor in a rival team.',
    'taskTrack': '{name} pushes {track} forward.', 'taskPlan': '{name} works on the Plan ({n} of {of}).',
}

data = {
    '_source': 'plans/evil-mode-rework/05_WINNING_AND_THE_REGIONS.md §1-2 (paths), lists/takeover-bonuses.md (holdings, word for word), '
               'Kice\'s evil_mode_goals.zip Parts 35a-35c (Goals: stages, Turning Points, endings, the Hero\'s reason word for word), '
               'list rows 87, 128, 451-465 and 586-600 (actions); built by tools/dominion/takeover-to-json.py',
    'paths': [
        dict(id='wipe', name='Wipe Out', icon='g-dire-hit', colour='#ef4a3a', fantasy='Destroy the rival team',
             after='Clean field. Their remaining Grunts can be recruited; their Boss is yours to recruit, exile or let go.'),
        dict(id='shadow', name='Shadow', icon='g-smoke-ball', colour='#3fcf74', fantasy='Rule from behind a clean face',
             after='The region thinks it\'s free. Low upkeep, high income; if Wanted ever passes 60 here, the Shadow cracks.'),
        dict(id='monarch', name='Monarch', icon='g-relic-crown', colour='#f2c230', fantasy='Rule openly',
             after='The region bows. High tribute, Gym Leaders serve you; Legendaries and rebels keep coming.'),
        dict(id='goal', name='Goal', icon='i-leaders_crest', colour='#b28cff', fantasy='Achieve what you set out to do',
             after='Depends on the Goal.'),
    ],
    'need': dict(shadowBiz=5, pillars=['silph-co', 'game-corner'], shadowRegard=60, shadowWanted=39, shadowGyms=4, monarchGyms=8,
                 monarchHeld=75, monarchDread=70, citadel=6, crack=60, crackTowns=3),
    'league': LEAGUE,
    'goal': dict(stages=[20, 40, 60, 80], warn=8, max=10, decay=1, strike=5, warnHeat=3, lose=10, loseCost=2, metricCap=40),
    'holding': dict(price=dict(S=8000, M=25000, L=70000, XL=180000), control=dict(S=5, M=10, L=20, XL=35), upkeepPct=3,
                    hold=dict(S=3, M=5, L=7, XL=9), raid=dict(S=3, M=4, L=5, XL=6), infiltrate=3, infiltratePct=50, seizeHit=20,
                    seizeLoss=25, attack=15, attackTension=50, unpaid=10, forceHeat=30),
    'holdings': holdings,
    'sets': sets,
    'goals': goals,
    'play': PLAY,
    'status': STATUS,
    'lines': LINES,
    'broadcast': dict(onAir='LIVE · ALL CHANNELS', small='{team} · SPECIAL BROADCAST', head='{team} now controls {town}',
                      say=['Good evening, {town}. Nothing changes for you, except who you work for.',
                           '{town}, your Gym, your shops and your streets answer to {team} now. Sleep well.',
                           'This is {team}. {town} is ours. Nobody needs to be a hero about it.'],
                      region='Good evening, {region}. You belong to {team} now.'),
}
json.dump(data, open(f'{out}/takeover.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'{len(holdings)} holdings ({sum(1 for h in holdings if h["region"] == "kanto")} Kanto), {len(sets)} sets, {len(goals)} goals, {len(PLAY)} actions')
