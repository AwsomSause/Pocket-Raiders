#!/usr/bin/env python3
"""DOMINION slice D15: the eight regions after Kanto, as places to play.

Writes src/data/dominion/regions/<id>.json, one region pack each. A pack holds what Kanto keeps in field.json,
growth.json, rivals.json, hero.json and takeover.json: ten towns with three targets each (owner, trait, foe), roads and
sea lanes, the warehouse town you arrive in, the region's rival team(s) and their sites, eight Gyms with a trainer each,
the businesses you can buy, the Hero's path and allies, the League, the Shadow path's two pillars, the wild and steal
pools, the applications desk's badges, the arrival scene, and where each of the region's Holdings (takeover.json, made
by takeover-to-json.py and left disabled 'needs D15') stands and what it pays.

Sources: the canon games (town names, Gym Leaders, Elite Four, Champions, rival teams and their admins), the old Evil
Mode region and district data (src/data/evilMode/region.json, district.json, deleted after D17: see git show
8a168fc6:<path>) for the neighbours, and the takeover-bonuses
list (plans/evil-mode-rework/lists/takeover-bonuses.md) through takeover.json. Owners, lines and foes are written for
this slice in the same voice as Kanto's (field.json). Numbers follow Kanto's, scaled by the region's place in the run.

Run: python3 tools/dominion/regions-to-json.py   (no inputs outside the repo)
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'src', 'data', 'dominion', 'regions')
TAKEOVER = json.load(open(os.path.join(ROOT, 'src', 'data', 'dominion', 'takeover.json'), encoding='utf-8'))

TYPES = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
         'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']
CLS = set('youngster bug-catcher hiker fisherman bird-keeper black-belt firebreather guitarist aroma-lady snow-worker biker psychic '
          'hex-maniac dragon-tamer roughneck worker fairy-tale-girl lass camper picnicker swimmer breeder battle-girl ranger '
          'ace-trainer veteran reporter'.split())
LOOKS = set('ace_trainer_f ace_trainer_m artist backpacker_f backpacker_m baker beauty_2 bird_keeper_f black_belt_f breeder_f breeder_m '
            'clerk_f clerk_m collector cyclist_f cyclist_m dancer depot_agent doctor_f doctor_m expert_pokemon_breeder harlequin '
            'hooligans hoopster infielder interviewers janitor linebacker maid musician mysterious_sisters nursery_aide officer '
            'parasol_lady pilot pokefan_f pokefan_m psychic_f ranger_f ranger_m rich_f rich_m ruin_maniac scientist_f '
            'scientist_m scuba_diver_f scuba_diver_m smasher snow_worker snow_worker_f striker swimmer_m veteran_f veteran_m '
            'waiter_f waiter_m worker_f twins young_couple'.split())


def theme(a, b):
    return '-'.join(sorted([a, b], key=TYPES.index))


def T(tid, name, kind, owner, look, line, trait, pay, foe, cls, species, offset=0):
    """One target. `look` is a trainer/pr picture (or 'clerk'/'police' for the two Dominion pictures)."""
    if look == 'clerk':
        lk = 'dominion/t-clerk.png'
    elif look == 'police':
        lk = 'dominion/t-policeman.png'
    else:
        if look not in LOOKS:
            sys.exit(f'{tid}: unknown look {look}')
        lk = f'trainer/pr/{look}'
    if cls not in CLS:
        sys.exit(f'{tid}: unknown trainer class {cls}')
    tr = None
    if trait:
        w, o = trait
        tr = dict(word=w, odds=o)
    return dict(id=tid, name=name, kind=kind, owner=dict(name=owner, look=lk, line=line), trait=tr, pay=pay,
                foe=dict(name=foe, cls=cls, species=species, offset=offset))


def town(tid, name, x, y, wild, targets, control=0, rival=0, police=False, w=None, note=None):
    d = dict(id=tid, name=name, x=x, y=y, control=control, rival=rival, police=police, wild=theme(*wild), targets=targets)
    if w:
        d['w'] = w
    if note:
        d['rivalNote'] = note
    return d


def gym(gid, district, leader, leader_id, typ, badge, species, offset, trainers):
    return dict(id=gid, district=district, leader=leader, leaderId=leader_id, type=typ, badge=badge, species=species, offset=offset,
                trainers=[dict(name=n, cls=c, leaderId=None, species=s, offset=-1) for (n, c, s) in trainers])


def biz(target, name, price, income, clean, perk, text, rival=False):
    k, n, *it = perk
    p = dict(kind=k, n=n)
    if it:
        p['item'] = it[0]
    b = dict(target=target, name=name, price=price, income=income, clean=clean, perk=p, text=text)
    if rival:
        b['rival'] = True
    return b


def who(wid, name, species, offset):
    return dict(id=wid, name=name, species=species, offset=offset)


def ally(aid, name, look, ace, champion=False):
    a = dict(id=aid, name=name, look=f'bosses/{look}.png', ace=ace)
    if champion:
        a['champion'] = True
    return a


R = {}

# ======================================================================= JOHTO
R['johto'] = dict(
    hq='olivine', label='JOHTO', warehouse='Olivine',
    arrive=[
        'The new warehouse is a fish store on the Olivine docks, and it still smells like one. The lighthouse sweeps the window every eight seconds.',
        '"{brought}," you say. "Find a broom."',
        'Somewhere up the coast, a radio is playing an old Rocket song nobody\'s supposed to know any more.',
    ],
    districts=[
        town('new-bark', 'New Bark', 40, 196, ('normal', 'flying'), [
            T('elm-lab', "Elm's Lab", 'site', 'Professor Elm', 'scientist_m', 'Nervous, kind, and always one sample short.', ('Timid', 6), 1.3, 'Lab aide', 'youngster', ['marill', 'sentret']),
            T('new-bark-street', 'The Windy Lane', 'street', 'The town elders', 'veteran_f', 'They know every face that comes off Route 29.', ('Watchful', -4), 1, 'A local', 'picnicker', ['sentret', 'hoothoot']),
            T('route-29', 'Route 29', 'route', 'Trainers on the route', 'backpacker_m', 'First-timers with their first Pokémon.', None, 1, 'Youngster Joey', 'youngster', ['rattata', 'pidgey']),
        ]),
        town('cherrygrove', 'Cherrygrove', 40, 290, ('water', 'normal'), [
            T('cherrygrove-mart', 'Cherrygrove Mart', 'shop', 'The Mart clerk', 'clerk', 'She knows the guide gent better than her own brother.', ('Timid', 5), 1, "The clerk's cousin", 'fisherman', ['poliwag']),
            T('cherrygrove-bay', 'Cherrygrove Bay', 'dock', 'The fishermen', 'scuba_diver_m', 'Boats in at dawn, gone by noon.', ('Stubborn', -4), 1.2, 'Fisherman Tully', 'fisherman', ['tentacool', 'krabby'], 1),
            T('route-30', 'Route 30', 'route', 'Bug catchers', 'backpacker_f', 'Nets and jars and lunch money.', None, 1, 'Bug Catcher Don', 'bug-catcher', ['caterpie', 'weedle']),
        ]),
        town('violet', 'Violet', 178, 112, ('flying', 'grass'), [
            T('sprout-tower', 'Sprout Tower', 'ghost', 'The sages', 'veteran_m', 'Old men on a swaying floor. Calm as a pond.', ('Pious', -6), 1.2, 'Sage Nico', 'psychic', ['bellsprout', 'gastly']),
            T('violet-mart', 'Violet Mart', 'shop', 'The Mart clerk', 'clerk', 'Sells more Escape Ropes than anything else.', ('Timid', 5), 1, "The clerk's son", 'youngster', ['pidgey', 'spearow']),
            T('violet-school', "Earl's Academy", 'crowd', 'Earl, the teacher', 'harlequin', 'Spins when he talks. Owns the building outright.', ('Gullible', 6), 1.2, 'Earl', 'psychic', ['ponyta', 'abra']),
        ]),
        town('azalea', 'Azalea', 178, 290, ('bug', 'poison'), [
            T('slowpoke-well', 'Slowpoke Well', 'cave', 'The well keeper', 'veteran_m', 'Thinks the Slowpoke bring the rain.', ('Pious', -4), 1.2, 'Well hand', 'hiker', ['slowpoke', 'zubat']),
            T('kurt-workshop', "Kurt's Workshop", 'site', 'Kurt', 'veteran_m', 'Makes Balls from Apricorns. Hates anyone in a uniform.', ('Proud', -6), 1.4, 'Kurt', 'veteran', ['slowpoke', 'pineco'], 1),
            T('ilex-forest', 'Ilex Forest', 'route', 'The charcoal makers', 'worker_f', 'They burn wood all night and sell it all day.', None, 1, 'Charcoal maker', 'worker', ['paras', 'oddish']),
        ]),
        town('goldenrod', 'Goldenrod', 316, 196, ('normal', 'electric'), [
            T('goldenrod-store', 'Goldenrod Dept. Store', 'shop', 'The floor manager', 'rich_m', 'Six floors, a rooftop, and a man who counts all of it.', ('Greedy', 4), 1.5, 'Security guard', 'veteran', ['growlithe', 'magnemite']),
            T('radio-tower', 'Radio Tower', 'site', 'The station director', 'interviewers', 'On the air every hour. Hates dead air more than crime.', ('Proud', -6), 1.6, 'Station guard', 'veteran', ['magnemite', 'voltorb'], 1),
            T('goldenrod-underground', 'The Underground', 'crowd', 'The tunnel traders', 'hooligans', 'Haircuts, bargains, and nobody asks your name.', ('Greedy', 5), 1.3, 'Tunnel tough', 'roughneck', ['grimer', 'koffing']),
        ], rival=40, w=130, note='Rocket remnants'),
        town('ecruteak', 'Ecruteak', 316, 70, ('ghost', 'fire'), [
            T('burned-tower', 'Burned Tower', 'ghost', 'The tower watch', 'veteran_f', 'Nobody goes down to the basement. Nobody.', ('Superstitious', 6), 1.3, 'Watch hand', 'hex-maniac', ['gastly', 'koffing']),
            T('dance-theatre', 'Dance Theatre', 'crowd', 'The Kimono Girls', 'dancer', 'Five dancers, one stage, a crowd every night.', ('Proud', -5), 1.4, 'Theatre gent', 'veteran', ['umbreon', 'espeon'], 2),
            T('ecruteak-station', 'Ecruteak Police Post', 'police', 'Officer Jenny', 'police', 'Old town, old rules. She walks the tower lanes every night.', ('Sharp', -10), 1, 'Officer', 'veteran', ['growlithe', 'noctowl'], 1),
        ], police=True),
        town('olivine', 'Olivine', 454, 290, ('water', 'steel'), [
            T('olivine-docks', 'Olivine Docks', 'dock', 'The harbour master', 'pilot', 'The SS Aqua comes in Mondays. He meets it every time.', ('Stubborn', -4), 1.3, 'Dock hand', 'worker', ['machop', 'tentacool']),
            T('olivine-lighthouse', 'Glitter Lighthouse', 'site', 'The keeper', 'veteran_m', 'Up and down two hundred stairs, every night.', ('Steady', -4), 1.2, 'Keeper', 'fisherman', ['magnemite', 'tentacool']),
            T('olivine-cafe', 'Olivine Café', 'crowd', 'The cook', 'waiter_m', 'Sailors eat here. Sailors talk here.', ('Gossip', 5), 1.1, 'Sailor Huey', 'swimmer', ['poliwhirl', 'machop']),
        ], control=10),
        town('cianwood', 'Cianwood', 454, 118, ('fighting', 'water'), [
            T('cianwood-pharmacy', 'Cianwood Pharmacy', 'shop', 'The pharmacist', 'doctor_m', 'His secret medicine is famous across the sea.', ('Timid', 4), 1.3, 'Pharmacy guard', 'black-belt', ['machop']),
            T('cianwood-shore', 'Cianwood Shore', 'route', 'Swimmers', 'swimmer_m', 'The current is cruel; they swim it anyway.', None, 1, 'Swimmer Rory', 'swimmer', ['tentacool', 'shellder']),
            T('cianwood-photo', 'Photo Studio', 'street', 'The photographer', 'artist', 'Takes your picture for free. Keeps the negatives.', ('Gossip', 5), 1, 'Studio help', 'picnicker', ['smeargle']),
        ], w=118),
        town('mahogany', 'Mahogany', 178, 20, ('ice', 'dark'), [
            T('mahogany-mart', 'Souvenir Shop', 'shop', 'The old man at the till', 'clerk', 'The basement stairs are behind the counter. He says there\'s no basement.', ('Shifty', 6), 1.4, 'Basement guard', 'veteran', ['koffing', 'rattata'], 1),
            T('lake-of-rage', 'Lake of Rage', 'route', 'The fishermen', 'scuba_diver_f', 'Red Gyarados sightings every spring.', None, 1.2, 'Fisherman Andre', 'fisherman', ['magikarp', 'gyarados'], 1),
            T('ice-path', 'Ice Path', 'cave', 'Ice cutters', 'snow_worker', 'Blocks of ice for the whole region.', None, 1.1, 'Ice cutter', 'snow-worker', ['swinub', 'sneasel']),
        ], rival=30, note='Rocket remnants'),
        town('blackthorn', 'Blackthorn', 40, 40, ('dragon', 'ice'), [
            T('dragons-den', "Dragon's Den", 'cave', 'The Dragon elders', 'veteran_m', 'They test anyone who walks in. Most fail.', ('Proud', -8), 1.5, 'Dragon Tamer Paul', 'dragon-tamer', ['dratini', 'horsea'], 2),
            T('blackthorn-mart', 'Blackthorn Mart', 'shop', 'The Mart clerk', 'clerk', 'Sells Max Repels by the crate.', ('Timid', 5), 1, "The clerk's uncle", 'hiker', ['geodude', 'graveler']),
            T('blackthorn-square', 'Dragon Square', 'crowd', 'The clan', 'black_belt_f', 'A clan town. A stranger is news.', ('Watchful', -6), 1.2, 'Clan hand', 'ace-trainer', ['dragonair'], 2),
        ]),
    ],
    routes=[['new-bark', 'cherrygrove'], ['cherrygrove', 'violet'], ['violet', 'azalea'], ['azalea', 'goldenrod'], ['goldenrod', 'ecruteak'],
            ['ecruteak', 'olivine'], ['ecruteak', 'mahogany'], ['mahogany', 'blackthorn'], ['violet', 'ecruteak'], ['goldenrod', 'olivine']],
    water=[['olivine', 'cianwood'], ['new-bark', 'blackthorn']],
    pools=dict(catch=['sentret', 'hoothoot', 'ledyba', 'spinarak', 'mareep', 'hoppip', 'sunkern', 'wooper', 'yanma', 'murkrow', 'misdreavus',
                      'girafarig', 'pineco', 'dunsparce', 'snubbull', 'qwilfish', 'shuckle', 'heracross', 'sneasel', 'teddiursa', 'slugma',
                      'swinub', 'corsola', 'remoraid', 'delibird', 'skarmory', 'houndour', 'phanpy', 'stantler', 'natu', 'marill', 'chinchou'],
               steal=['larvitar', 'dratini', 'togepi', 'eevee', 'smeargle', 'miltank', 'tyrogue', 'elekid', 'magby', 'smoochum', 'scyther',
                      'gligar', 'aipom', 'yanma', 'bagon', 'sneasel']),
    rivals={'rocket-remnants': [('slowpoke-well-camp', 'Slowpoke Well Camp', 'azalea'), ('goldenrod-tunnel', 'Goldenrod Tunnel Hideout', 'goldenrod', True),
                                ('radio-tower-booth', 'Radio Tower Booth', 'goldenrod'), ('mahogany-basement', 'Mahogany Basement', 'mahogany'),
                                ('lake-transmitter', 'Lake of Rage Transmitter', 'mahogany'), ('ilex-shrine-watch', 'Ilex Shrine Watch', 'azalea'),
                                ('route-43-gate', 'Route 43 Toll Gate', 'mahogany')]},
    gyms=[
        gym('violet-gym', 'violet', 'Falkner', 'falkner', 'flying', 'Zephyr', ['pidgey', 'pidgeotto'], 1, [('Bird Keeper Rod', 'bird-keeper', ['pidgey', 'spearow'])]),
        gym('azalea-gym', 'azalea', 'Bugsy', 'bugsy', 'bug', 'Hive', ['metapod', 'kakuna', 'scyther'], 1, [('Bug Catcher Al', 'bug-catcher', ['caterpie', 'weedle'])]),
        gym('goldenrod-gym', 'goldenrod', 'Whitney', 'whitney', 'normal', 'Plain', ['clefairy', 'miltank'], 2, [('Lass Carrie', 'lass', ['snubbull'])]),
        gym('ecruteak-gym', 'ecruteak', 'Morty', 'morty', 'ghost', 'Fog', ['gastly', 'haunter', 'gengar'], 2, [('Sage Jeffrey', 'hex-maniac', ['haunter'])]),
        gym('cianwood-gym', 'cianwood', 'Chuck', 'chuck', 'fighting', 'Storm', ['primeape', 'poliwrath'], 3, [('Black Belt Yoshi', 'black-belt', ['hitmonlee'])]),
        gym('olivine-gym', 'olivine', 'Jasmine', 'jasmine', 'steel', 'Mineral', ['magnemite', 'steelix'], 3, [('Gentleman Preston', 'veteran', ['growlithe'])]),
        gym('mahogany-gym', 'mahogany', 'Pryce', 'pryce', 'ice', 'Glacier', ['seel', 'dewgong', 'piloswine'], 4, [('Skier Roxanne', 'snow-worker', ['jynx'])]),
        gym('blackthorn-gym', 'blackthorn', 'Clair', 'clair', 'dragon', 'Rising', ['dragonair', 'dragonair', 'kingdra'], 4, [('Dragon Tamer Erick', 'dragon-tamer', ['dragonair'])]),
    ],
    business=[
        biz('cherrygrove-mart', 'Cherrygrove Mart', 5000, 200, True, ('items', 2, 'potion'), '2 Potions a week from the back room.'),
        biz('violet-mart', 'Violet Mart', 5000, 200, True, ('items', 2, 'escape-rope'), '2 Escape Ropes a week.'),
        biz('goldenrod-store', 'Goldenrod Dept. Store', 15000, 600, True, ('regard', 1), 'The biggest shop in Johto. Regard +1 in Goldenrod each week.'),
        biz('radio-tower', 'Radio Tower', 30000, 800, True, ('heroDown', 1), 'Your news on every set. The Hero hears it too.', rival=True),
        biz('goldenrod-underground', 'The Underground', 12000, 450, False, ('clean', 200), 'Tunnel trade: ₽200 a week comes back clean.', rival=True),
        biz('cianwood-pharmacy', 'Cianwood Pharmacy', 8000, 250, True, ('items', 2, 'super-potion'), 'Secret medicine: 2 Super Potions a week.'),
        biz('olivine-cafe', 'Olivine Café', 4500, 180, True, ('odds', 5), 'Sailors talk: +5% on jobs in Olivine.'),
        biz('dance-theatre', 'Dance Theatre', 6000, 220, True, ('heatDown', 1), 'Nobody looks past the stage: Heat −1 in Ecruteak each week.'),
        biz('mahogany-mart', 'Souvenir Shop', 9000, 300, True, ('income', 300), 'The basement pays more than the shop.'),
    ],
    pillars=['radio-tower', 'goldenrod-store'],
    hero=dict(path=['new-bark', 'violet', 'azalea', 'goldenrod', 'ecruteak', 'cianwood', 'olivine', 'mahogany', 'blackthorn'],
              allies=[ally('falkner', 'Falkner', 'falkner', 'pidgeot'), ally('bugsy', 'Bugsy', 'bugsy', 'scyther'), ally('whitney', 'Whitney', 'whitney', 'miltank'),
                      ally('morty', 'Morty', 'morty', 'gengar'), ally('jasmine', 'Jasmine', 'jasmine', 'steelix'), ally('clair', 'Clair', 'clair', 'kingdra'),
                      ally('lance', 'Lance', 'lance', 'dragonite', True)],
              mentor='Professor Elm', parent="The Hero's mother", sidekick='Lyra, from New Bark',
              homes={'suicune': ('cianwood', 'the Tin Tower'), 'raikou': ('ecruteak', 'the Burned Tower'), 'entei': ('mahogany', 'Route 43')}),
    league=dict(elite=[who('will', 'Will', ['xatu', 'jynx', 'exeggutor', 'slowbro', 'xatu'], 2), who('koga', 'Koga', ['ariados', 'forretress', 'muk', 'venomoth', 'crobat'], 3),
                       who('bruno', 'Bruno', ['hitmontop', 'hitmonlee', 'hitmonchan', 'onix', 'machamp'], 4), who('karen', 'Karen', ['umbreon', 'vileplume', 'gengar', 'murkrow', 'houndoom'], 5)],
                champion=who('lance', 'Lance', ['gyarados', 'dragonite', 'charizard', 'aerodactyl', 'dragonite', 'dragonite'], 6), standIn={}),
    lab=['eevee', 'porygon', 'omanyte', 'kabuto', 'togepi'],
    desk=dict(name='Johto', rivals=['Rocket remnants'], badges=[('Zephyr', 'Violet City', '#a8c8e8'), ('Hive', 'Azalea Town', '#7ab84a'), ('Plain', 'Goldenrod City', '#e8c840'),
                                                             ('Fog', 'Ecruteak City', '#9a8ab8'), ('Storm', 'Cianwood City', '#c88a5a'), ('Mineral', 'Olivine City', '#c8c8d8'),
                                                             ('Glacier', 'Mahogany Town', '#8ad8f0'), ('Rising', 'Blackthorn City', '#4a6ab8')]),
    places={'new bark': 'new-bark', 'elm': 'new-bark', 'cherrygrove': 'cherrygrove', 'violet': 'violet', 'sprout': 'violet', 'alph': 'violet',
            'azalea': 'azalea', 'slowpoke well': 'azalea', 'ilex': 'azalea', 'union cave': 'azalea', 'goldenrod': 'goldenrod', 'radio tower': 'goldenrod',
            'magnet train': 'goldenrod', 'national park': 'goldenrod', 'ecruteak': 'ecruteak', 'burned tower': 'ecruteak', 'bell tower': 'ecruteak',
            'tin tower': 'ecruteak', 'olivine': 'olivine', 'cianwood': 'cianwood', 'whirl': 'cianwood', 'mahogany': 'mahogany', 'lake of rage': 'mahogany',
            'ice path': 'mahogany', 'mt. mortar': 'mahogany', 'blackthorn': 'blackthorn', "dragon's den": 'blackthorn', 'dark cave': 'violet',
            'safari zone': 'cianwood', 'victory road': 'new-bark', 'indigo plateau': 'new-bark'},
)

# ======================================================================= HOENN
R['hoenn'] = dict(
    hq='slateport', label='HOENN', warehouse='Slateport',
    arrive=[
        'The new warehouse smells like salt and rope. {brought} looks around, cracks their knuckles and grins.',
        '"Just like old times, Boss. Except this time I know what I\'m doing."',
        'Out on the water, a red boat and a blue boat pass each other without slowing down.',
    ],
    districts=[
        town('littleroot', 'Littleroot', 40, 300, ('normal', 'grass'), [
            T('birch-lab', "Birch's Lab", 'site', "Professor Birch", 'scientist_m', 'Always out in the field. The lab door sticks.', ('Absent', 8), 1.3, 'Lab aide', 'picnicker', ['zigzagoon', 'wurmple']),
            T('littleroot-street', 'Moving Day Lane', 'street', 'The neighbours', 'pokefan_f', 'Every new family gets a cake. Every stranger gets a look.', ('Watchful', -4), 1, 'Neighbour', 'picnicker', ['zigzagoon']),
            T('route-101', 'Route 101', 'route', 'Trainers on the route', 'backpacker_f', 'Kids with their first partner.', None, 1, 'Youngster Calvin', 'youngster', ['poochyena', 'zigzagoon']),
        ]),
        town('petalburg', 'Petalburg', 40, 196, ('normal', 'grass'), [
            T('petalburg-mart', 'Petalburg Mart', 'shop', 'The Mart clerk', 'clerk', 'Quiet town, quiet till.', ('Timid', 5), 1, "The clerk's son", 'youngster', ['zigzagoon']),
            T('petalburg-woods', 'Petalburg Woods', 'route', 'Bug maniacs', 'backpacker_m', 'Shroomish everywhere, and a man looking for them.', None, 1, 'Bug Catcher Lyle', 'bug-catcher', ['wurmple', 'shroomish']),
            T('wally-house', "The Mayor's Row", 'street', 'Town families', 'pokefan_m', 'Comfortable houses with nice gardens.', ('Gullible', 5), 1.1, 'Gardener', 'aroma-lady', ['roselia']),
        ]),
        town('rustboro', 'Rustboro', 40, 70, ('rock', 'steel'), [
            T('devon-corp', 'Devon Corporation', 'site', 'The night guard', 'veteran_m', 'Devon parts are worth more than Devon guards.', ('Bored', 6), 1.6, 'Devon guard', 'veteran', ['magnemite', 'nosepass'], 1),
            T('rustboro-school', 'Trainer School', 'crowd', 'The schoolteacher', 'expert_pokemon_breeder', 'Thirty pupils, one gate, no fence.', ('Kind', 5), 1, 'Student', 'lass', ['skitty']),
            T('rusturf-tunnel', 'Rusturf Tunnel', 'cave', 'Tunnel diggers', 'worker_f', 'Digging a tunnel by hand to Verdanturf.', None, 1.1, 'Digger', 'hiker', ['whismur', 'geodude']),
        ]),
        town('slateport', 'Slateport', 200, 300, ('water', 'normal'), [
            T('slateport-market', 'Slateport Market', 'crowd', 'The stall holders', 'clerk_f', 'Twenty stalls; every one sells something they shouldn\'t.', ('Greedy', 5), 1.3, 'Market tough', 'roughneck', ['machop', 'zigzagoon']),
            T('stern-shipyard', "Stern's Shipyard", 'dock', 'Captain Stern', 'pilot', 'Building a submarine. Talks about nothing else.', ('Distracted', 6), 1.4, 'Shipwright', 'worker', ['machop', 'wingull'], 1),
            T('oceanic-museum', 'Oceanic Museum', 'site', 'The curator', 'scientist_f', 'A red team and a blue team both want his parts.', ('Nervous', 6), 1.5, 'Museum guard', 'veteran', ['wingull', 'magnemite'], 1),
        ], control=10, police=False),
        town('mauville', 'Mauville', 200, 196, ('electric', 'normal'), [
            T('mauville-store', 'Mauville Shopping', 'shop', 'The store manager', 'rich_f', 'Half of Hoenn shops under this one roof.', ('Greedy', 4), 1.5, 'Security guard', 'veteran', ['electrike', 'magnemite']),
            T('game-corner-mauville', 'Mauville Game Corner', 'site', 'The floor boss', 'rich_m', 'The slots pay out on Sundays. Mostly.', ('Greedy', 6), 1.5, 'Floor boss', 'roughneck', ['spinda', 'meowth'], 1),
            T('mauville-station', 'Mauville Police Post', 'police', 'Officer Jenny', 'police', 'Runs the city\'s only police post. Takes it seriously.', ('Sharp', -10), 1, 'Officer', 'veteran', ['growlithe', 'electrike'], 1),
        ], police=True, w=130),
        town('fallarbor', 'Fallarbor', 200, 40, ('ground', 'fire'), [
            T('fallarbor-contest', 'Contest Hall', 'crowd', 'The contest staff', 'dancer', 'Ash falls on the stage; the crowd cheers anyway.', ('Proud', -4), 1.2, 'Coordinator', 'aroma-lady', ['spinda', 'skitty']),
            T('meteor-falls', 'Meteor Falls', 'cave', 'The Draconid', 'veteran_f', 'An old woman who knows every rock in the falls.', ('Pious', -6), 1.4, 'Old Draconid', 'dragon-tamer', ['bagon', 'solrock'], 1),
            T('route-113', 'Route 113', 'route', 'Ash gatherers', 'ruin_maniac', 'Glass flutes made from volcanic ash.', None, 1, 'Ninja Boy Lung', 'hiker', ['spinda', 'skarmory']),
        ], rival=35, note='Magma'),
        town('lavaridge', 'Lavaridge', 330, 70, ('fire', 'ground'), [
            T('lavaridge-springs', 'Hot Springs', 'crowd', 'The spring owners', 'beauty_2', 'Everyone talks in the hot springs.', ('Gossip', 6), 1.3, 'Bath attendant', 'aroma-lady', ['numel', 'slugma']),
            T('mt-chimney', 'Mt. Chimney', 'site', 'The cable car crew', 'worker_f', 'One car up, one car down. Magma rides both.', ('Bored', 4), 1.4, 'Cable car crew', 'hiker', ['numel', 'torkoal'], 1),
            T('lavaridge-herb', 'Herb Shop', 'shop', 'The herbalist', 'clerk', 'Bitter medicine, honest prices.', ('Timid', 4), 1.1, 'Herbalist', 'picnicker', ['roselia']),
        ], rival=50, note='Magma'),
        town('fortree', 'Fortree', 460, 70, ('grass', 'flying'), [
            T('fortree-market', 'Treehouse Market', 'shop', 'The decor seller', 'clerk_f', 'Sells furniture for secret bases, no questions.', ('Gullible', 5), 1.2, 'Treehouse guard', 'bird-keeper', ['swablu', 'tropius']),
            T('weather-institute', 'Weather Institute', 'site', 'The head scientist', 'scientist_m', 'Both teams want his forecast. Neither asks nicely.', ('Nervous', 6), 1.5, 'Institute guard', 'veteran', ['castform', 'magnemite'], 1),
            T('route-119', 'Route 119', 'route', 'Rain watchers', 'ranger_f', 'It rains here every day of the year.', None, 1.1, 'Ranger Catherine', 'ranger', ['oddish', 'kecleon']),
        ], rival=25, note='Aqua'),
        town('lilycove', 'Lilycove', 460, 196, ('water', 'normal'), [
            T('lilycove-store', 'Lilycove Dept. Store', 'shop', 'The floor manager', 'rich_m', 'The biggest store in Hoenn, right on the cove.', ('Greedy', 4), 1.5, 'Security guard', 'veteran', ['electrike', 'linoone']),
            T('lilycove-cove', 'The Hideout Cove', 'dock', 'The cove fishermen', 'scuba_diver_m', 'They don\'t fish the cave mouth. They know why.', ('Shifty', 6), 1.4, 'Fisherman Lane', 'fisherman', ['wailmer', 'tentacool'], 1),
            T('lilycove-museum', 'Art Museum', 'crowd', 'The curator', 'artist', 'Paintings of Pokémon, and a very old safe.', ('Proud', -4), 1.3, 'Night guard', 'veteran', ['smeargle']),
        ], rival=45, note='Aqua'),
        town('sootopolis', 'Sootopolis', 330, 300, ('water', 'psychic'), [
            T('cave-of-origin', 'Cave of Origin', 'ghost', 'The keeper', 'veteran_m', 'He says the cave is breathing.', ('Pious', -8), 1.5, 'Keeper', 'psychic', ['chimecho', 'golbat'], 2),
            T('sootopolis-crater', 'Crater Steps', 'street', 'The townsfolk', 'parasol_lady', 'A town inside a volcano. Nobody leaves.', ('Watchful', -6), 1.2, 'Townsman', 'swimmer', ['luvdisc', 'staryu']),
            T('route-126', 'Route 126', 'route', 'Divers', 'scuba_diver_f', 'Seaweed and old wrecks under the surface.', None, 1.2, 'Diver Jack', 'swimmer', ['clamperl', 'chinchou']),
        ]),
    ],
    routes=[['littleroot', 'petalburg'], ['petalburg', 'rustboro'], ['rustboro', 'fallarbor'], ['fallarbor', 'lavaridge'], ['lavaridge', 'mauville'],
            ['mauville', 'slateport'], ['mauville', 'fortree'], ['fortree', 'lilycove'], ['littleroot', 'slateport'], ['mauville', 'rustboro']],
    water=[['petalburg', 'slateport'], ['lilycove', 'sootopolis'], ['slateport', 'sootopolis']],
    pools=dict(catch=['zigzagoon', 'poochyena', 'wurmple', 'lotad', 'seedot', 'taillow', 'wingull', 'ralts', 'surskit', 'shroomish', 'slakoth', 'nincada',
                      'whismur', 'makuhita', 'azurill', 'nosepass', 'skitty', 'sableye', 'mawile', 'aron', 'meditite', 'electrike', 'plusle', 'minun',
                      'gulpin', 'carvanha', 'wailmer', 'numel', 'spoink', 'trapinch', 'cacnea', 'swablu', 'barboach', 'corphish', 'baltoy', 'shuppet'],
               steal=['bagon', 'beldum', 'feebas', 'absol', 'castform', 'kecleon', 'tropius', 'chimecho', 'clamperl', 'relicanth', 'lileep', 'anorith',
                      'zangoose', 'seviper', 'lunatone', 'solrock']),
    rivals={'magma': [('mt-chimney-camp', 'Mt. Chimney Camp', 'lavaridge'), ('magma-hideout', 'Magma Hideout (Jagged Pass)', 'lavaridge', True),
                      ('meteor-dig', 'Meteor Falls Dig', 'fallarbor'), ('route-113-post', 'Route 113 Ash Post', 'fallarbor')],
            'aqua': [('aqua-hideout', 'Aqua Hideout (Lilycove)', 'lilycove', True), ('weather-watch', 'Weather Institute Watch', 'fortree'),
                     ('slateport-berth', 'Slateport Berth', 'slateport'), ('route-123-camp', 'Route 123 Camp', 'lilycove')]},
    gyms=[
        gym('rustboro-gym', 'rustboro', 'Roxanne', 'roxanne', 'rock', 'Stone', ['geodude', 'nosepass'], 1, [('Youngster Josh', 'youngster', ['geodude'])]),
        gym('dewford-gym', 'petalburg', 'Brawly', 'brawly', 'fighting', 'Knuckle', ['machop', 'makuhita'], 1, [('Battle Girl Laura', 'battle-girl', ['meditite'])]),
        gym('mauville-gym', 'mauville', 'Wattson', 'wattson', 'electric', 'Dynamo', ['magnemite', 'voltorb', 'manectric'], 2, [('Guitarist Kirk', 'guitarist', ['electrike', 'voltorb'])]),
        gym('lavaridge-gym', 'lavaridge', 'Flannery', 'flannery', 'fire', 'Heat', ['numel', 'slugma', 'torkoal'], 2, [('Hiker Gerald', 'hiker', ['numel'])]),
        gym('petalburg-gym', 'petalburg', 'Norman', 'norman', 'normal', 'Balance', ['slaking', 'vigoroth', 'linoone'], 3, [('Ace Trainer Randall', 'ace-trainer', ['delcatty'])]),
        gym('fortree-gym', 'fortree', 'Winona', 'winona', 'flying', 'Feather', ['swablu', 'tropius', 'pelipper', 'altaria'], 3, [('Bird Keeper Jared', 'bird-keeper', ['doduo', 'skarmory'])]),
        gym('mossdeep-gym', 'lilycove', 'Tate and Liza', 'tate-and-liza', 'psychic', 'Mind', ['solrock', 'lunatone'], 4, [('Psychic Maura', 'psychic', ['kirlia'])]),
        gym('sootopolis-gym', 'sootopolis', 'Juan', 'juan', 'water', 'Rain', ['luvdisc', 'whiscash', 'sealeo', 'crawdaunt', 'kingdra'], 4, [('Beauty Olivia', 'aroma-lady', ['luvdisc'])]),
    ],
    business=[
        biz('petalburg-mart', 'Petalburg Mart', 5000, 200, True, ('items', 2, 'potion'), '2 Potions a week.'),
        biz('slateport-market', 'Slateport Market', 9000, 350, False, ('clean', 150), 'Cash stalls: ₽150 a week comes back clean.'),
        biz('devon-corp', 'Devon Corporation', 30000, 800, True, ('items', 1, 'ultra-ball'), 'Devon parts: an Ultra Ball a week, and a Scope if you ask.', rival=True),
        biz('mauville-store', 'Mauville Shopping', 15000, 600, True, ('regard', 1), 'Regard +1 in Mauville each week.'),
        biz('game-corner-mauville', 'Mauville Game Corner', 20000, 500, False, ('clean', 200), 'The slots wash ₽200 a week.', rival=True),
        biz('lavaridge-herb', 'Herb Shop', 4500, 180, True, ('items', 2, 'energy-powder'), '2 Energy Powders a week.'),
        biz('fortree-market', 'Treehouse Market', 4500, 180, True, ('odds', 5), 'Base gear: +5% on jobs in Fortree.'),
        biz('lilycove-store', 'Lilycove Dept. Store', 15000, 600, True, ('income', 300), 'The biggest store in Hoenn pays ₽300 more a week.'),
        biz('stern-shipyard', "Stern's Shipyard", 8000, 250, True, ('heroDown', 1), "The Hero's boat ride is slower."),
    ],
    pillars=['devon-corp', 'game-corner-mauville'],
    hero=dict(path=['littleroot', 'rustboro', 'petalburg', 'slateport', 'mauville', 'lavaridge', 'fortree', 'lilycove', 'sootopolis'],
              allies=[ally('roxanne', 'Roxanne', 'roxanne-gen6', 'nosepass'), ally('wattson', 'Wattson', 'wattson', 'manectric'), ally('flannery', 'Flannery', 'flannery', 'torkoal'),
                      ally('norman', 'Norman', 'norman', 'slaking'), ally('winona', 'Winona', 'winona-gen6', 'altaria'), ally('juan', 'Juan', 'juan', 'kingdra'),
                      ally('steven', 'Steven', 'steven-gen6', 'metagross', True)],
              mentor='Professor Birch', parent="The Hero's father, Norman", sidekick='Wally, from Petalburg',
              homes={'latios': ('sootopolis', 'Southern Island'), 'latias': ('lilycove', 'the open sea')}),
    league=dict(elite=[who('sidney', 'Sidney', ['mightyena', 'shiftry', 'cacturne', 'crawdaunt', 'absol'], 2), who('phoebe', 'Phoebe', ['dusclops', 'banette', 'sableye', 'banette', 'dusclops'], 3),
                       who('glacia', 'Glacia', ['sealeo', 'glalie', 'sealeo', 'glalie', 'walrein'], 4), who('drake', 'Drake', ['shelgon', 'altaria', 'flygon', 'flygon', 'salamence'], 5)],
                champion=who('steven', 'Steven', ['skarmory', 'claydol', 'aggron', 'cradily', 'armaldo', 'metagross'], 6), standIn={}),
    lab=['lileep', 'anorith', 'castform', 'beldum', 'feebas'],
    desk=dict(name='Hoenn', rivals=['Team Magma', 'Team Aqua'], badges=[('Stone', 'Rustboro City', '#9aa6b6'), ('Knuckle', 'Dewford Town', '#c86a3a'), ('Dynamo', 'Mauville City', '#ffd23f'),
                                                                         ('Heat', 'Lavaridge Town', '#ff5a3a'), ('Balance', 'Petalburg City', '#e8a0a0'), ('Feather', 'Fortree City', '#a0d0ff'),
                                                                         ('Mind', 'Mossdeep City', '#e070c0'), ('Rain', 'Sootopolis City', '#4fa3ff')]),
    places={'littleroot': 'littleroot', 'birch': 'littleroot', 'oldale': 'littleroot', 'petalburg': 'petalburg', 'dewford': 'petalburg', 'granite': 'petalburg',
            'rustboro': 'rustboro', 'devon': 'rustboro', 'rusturf': 'rustboro', 'verdanturf': 'rustboro', 'slateport': 'slateport', 'oceanic': 'slateport',
            'stern': 'slateport', 'mauville': 'mauville', 'new mauville': 'mauville', 'trick house': 'mauville', 'fallarbor': 'fallarbor', 'meteor falls': 'fallarbor',
            'route 113': 'fallarbor', 'lavaridge': 'lavaridge', 'chimney': 'lavaridge', 'jagged': 'lavaridge', 'magma hideout': 'lavaridge', 'fiery path': 'lavaridge',
            'fortree': 'fortree', 'weather institute': 'fortree', 'safari zone': 'fortree', 'lilycove': 'lilycove', 'aqua hideout': 'lilycove', 'mt. pyre': 'lilycove',
            'mossdeep': 'lilycove', 'space center': 'lilycove', 'shoal cave': 'lilycove', 'sootopolis': 'sootopolis', 'cave of origin': 'sootopolis',
            'sky pillar': 'sootopolis', 'pacifidlog': 'sootopolis', 'seafloor': 'sootopolis', 'ever grande': 'sootopolis', 'victory road': 'sootopolis',
            'battle frontier': 'slateport', 'battle tower': 'slateport', 'abandoned ship': 'slateport', 'southern island': 'sootopolis', 'mirage': 'sootopolis',
            'route 119': 'fortree', 'route 120': 'fortree', 'desert': 'fallarbor', 'scorched slab': 'fortree', 'trainer hill': 'lilycove', 'contest': 'lilycove'},
)

# ======================================================================= SINNOH
R['sinnoh'] = dict(
    hq='canalave', label='SINNOH', warehouse='Canalave',
    arrive=[
        'Canalave in the snow. The new warehouse is under the drawbridge, and every time it rises the whole place shakes.',
        '{brought} sets down the bags. "Cold. I like it. Keeps people indoors and not looking out the window."',
        'A poster on the wall: GALACTIC ENERGY FOR A NEW WORLD. Somebody has drawn a moustache on it.',
    ],
    districts=[
        town('twinleaf', 'Twinleaf', 40, 300, ('normal', 'grass'), [
            T('twinleaf-lake', 'Lake Verity', 'route', 'Lake walkers', 'backpacker_f', 'A quiet lake that hums at night.', None, 1.1, 'Lass Kara', 'lass', ['starly', 'bidoof']),
            T('twinleaf-street', 'Twinleaf Lane', 'street', 'The neighbours', 'pokefan_f', 'Four houses and a snowman.', ('Watchful', -4), 1, 'Neighbour', 'picnicker', ['bidoof']),
            T('rowan-lab', "Rowan's Lab (Sandgem)", 'site', 'Professor Rowan', 'scientist_m', 'Stern old man. Never locks the back door.', ('Absent', 6), 1.3, 'Lab aide', 'youngster', ['starly', 'shinx']),
        ]),
        town('jubilife', 'Jubilife', 140, 196, ('normal', 'electric'), [
            T('jubilife-tv', 'Jubilife TV', 'site', 'The producer', 'interviewers', 'Will put anything on the air if it rates.', ('Greedy', 5), 1.6, 'Studio guard', 'veteran', ['magnemite', 'chatot'], 1),
            T('poketch-co', 'Pokétch Company', 'shop', 'The president', 'rich_m', 'Every Trainer has one of his watches.', ('Greedy', 4), 1.5, 'Company guard', 'veteran', ['magnemite']),
            T('jubilife-school', 'Trainers\' School', 'crowd', 'The teacher', 'expert_pokemon_breeder', 'A blackboard full of type charts.', ('Kind', 5), 1, 'Student', 'lass', ['budew']),
        ], w=124),
        town('canalave', 'Canalave', 40, 120, ('water', 'steel'), [
            T('canalave-library', 'Canalave Library', 'site', 'The librarian', 'veteran_f', 'Three floors of old books. One of them is a map.', ('Bookish', 5), 1.4, 'Library guard', 'veteran', ['bronzor']),
            T('canalave-docks', 'Canalave Docks', 'dock', 'The sailors', 'pilot', 'Ships to Iron Island twice a day.', ('Stubborn', -4), 1.3, 'Sailor Luther', 'swimmer', ['wingull', 'buizel']),
            T('canalave-mart', 'Canalave Mart', 'shop', 'The Mart clerk', 'clerk', 'Stocks rope and nets for the ships.', ('Timid', 5), 1, "The clerk's son", 'worker', ['machop']),
        ], control=10),
        town('oreburgh', 'Oreburgh', 260, 196, ('rock', 'ground'), [
            T('oreburgh-mine', 'Oreburgh Mine', 'cave', 'The foreman', 'worker_f', 'Coal and fossils, and a lot of tired miners.', ('Bored', 5), 1.3, 'Miner', 'worker', ['geodude', 'onix']),
            T('mining-museum', 'Mining Museum', 'site', 'The curator', 'scientist_f', 'Fossil labs in the back. Locked with one key.', ('Nervous', 5), 1.4, 'Museum guard', 'veteran', ['cranidos', 'shieldon'], 1),
            T('oreburgh-gate', 'Oreburgh Gate', 'route', 'Hikers', 'backpacker_m', 'Every Trainer walks through here first.', None, 1, 'Hiker Daniel', 'hiker', ['zubat', 'geodude']),
        ]),
        town('floaroma', 'Floaroma', 260, 70, ('grass', 'electric'), [
            T('valley-windworks', 'Valley Windworks', 'site', 'The engineer', 'worker_f', 'The windmills power half of Sinnoh.', ('Steady', -4), 1.4, 'Windworks guard', 'veteran', ['shinx', 'pachirisu'], 1),
            T('floaroma-meadow', 'Floaroma Meadow', 'crowd', 'The flower sellers', 'parasol_lady', 'Honey and flowers, and Galactic grunts asking about honey.', ('Gullible', 5), 1.1, 'Flower seller', 'aroma-lady', ['combee', 'cherubi']),
            T('eterna-forest', 'Eterna Forest', 'route', 'Bug catchers', 'backpacker_f', 'Dark woods and an old mansion.', None, 1, 'Bug Catcher Jack', 'bug-catcher', ['wurmple', 'buneary']),
        ], rival=40, note='Galactic'),
        town('eterna', 'Eterna', 400, 70, ('grass', 'dragon'), [
            T('galactic-eterna', 'Eterna Building', 'site', 'The receptionist', 'clerk_f', 'A Galactic office pretending to be an office.', ('Shifty', 6), 1.5, 'Galactic guard', 'veteran', ['stunky', 'zubat'], 1),
            T('eterna-bikes', 'Cycle Shop', 'shop', 'The bike seller', 'cyclist_m', 'Sells bikes nobody can afford.', ('Greedy', 4), 1.2, 'Cyclist', 'biker', ['starly']),
            T('eterna-statue', 'Dialga Statue Square', 'crowd', 'The pilgrims', 'ruin_maniac', 'They come to see the old statue and leave flowers.', ('Pious', -5), 1.2, 'Pilgrim', 'psychic', ['bronzor', 'kadabra']),
        ], rival=55, note='Galactic'),
        town('hearthome', 'Hearthome', 400, 196, ('ghost', 'fairy'), [
            T('hearthome-contest', 'Contest Hall', 'crowd', 'The judges', 'dancer', 'The biggest stage in Sinnoh.', ('Proud', -4), 1.3, 'Coordinator', 'aroma-lady', ['buneary', 'glameow']),
            T('amity-square', 'Amity Square', 'street', 'The square keeper', 'pokefan_m', 'Only small Pokémon allowed. No grunts allowed.', ('Watchful', -6), 1.2, 'Square guard', 'veteran', ['pikachu', 'happiny']),
            T('hearthome-church', 'Hearthome Church', 'ghost', 'The old caretaker', 'veteran_m', 'Lost Tower spirits drift in at night.', ('Superstitious', 6), 1.3, 'Caretaker', 'hex-maniac', ['drifloon', 'duskull']),
        ], w=130),
        town('veilstone', 'Veilstone', 520, 120, ('fighting', 'psychic'), [
            T('galactic-hq', 'Veilstone Store Front', 'shop', 'The store manager', 'rich_f', 'The biggest shop in Sinnoh. Galactic HQ is across the street.', ('Greedy', 4), 1.5, 'Store guard', 'veteran', ['croagunk', 'machop']),
            T('veilstone-game-corner', 'Veilstone Game Corner', 'site', 'The floor boss', 'rich_m', 'Galactic money goes through these slots.', ('Greedy', 6), 1.5, 'Floor boss', 'roughneck', ['croagunk', 'meowth'], 1),
            T('veilstone-station', 'Veilstone Police Post', 'police', 'Officer Jenny', 'police', 'She watches the Galactic building through binoculars.', ('Sharp', -10), 1, 'Officer', 'veteran', ['growlithe', 'machop'], 1),
        ], police=True, rival=60, note='Galactic HQ'),
        town('pastoria', 'Pastoria', 400, 300, ('water', 'poison'), [
            T('great-marsh', 'Great Marsh', 'route', 'The marsh guides', 'ranger_m', 'Mud to your knees, Pokémon from every country.', None, 1.3, 'Ranger Jeffrey', 'ranger', ['wooper', 'croagunk']),
            T('pastoria-mart', 'Pastoria Mart', 'shop', 'The Mart clerk', 'clerk', 'Sells Safari Balls and mud boots.', ('Timid', 5), 1, "The clerk's sister", 'picnicker', ['psyduck']),
            T('valor-lake', 'Lake Valor', 'route', 'The resort staff', 'waiter_f', 'Rich guests, a lake, and a hotel full of keys.', ('Gullible', 5), 1.4, 'Resort guard', 'veteran', ['magikarp', 'gyarados'], 1),
        ]),
        town('snowpoint', 'Snowpoint', 260, 20, ('ice', 'steel'), [
            T('snowpoint-temple', 'Snowpoint Temple', 'ghost', 'The temple keeper', 'veteran_f', 'Down the stairs, something sleeps.', ('Pious', -8), 1.5, 'Keeper', 'psychic', ['snover', 'bronzong'], 2),
            T('acuity-lake', 'Lake Acuity', 'route', 'Snow walkers', 'snow_worker_f', 'A frozen lake at the top of the world.', None, 1.2, 'Skier Edward', 'snow-worker', ['snover', 'sneasel']),
            T('snowpoint-port', 'Snowpoint Harbour', 'dock', 'The ferryman', 'pilot', 'One ferry a day, if the ice lets it.', ('Stubborn', -4), 1.3, 'Ferry hand', 'fisherman', ['snorunt', 'buizel']),
        ], rival=20, note='Galactic'),
    ],
    routes=[['twinleaf', 'jubilife'], ['jubilife', 'canalave'], ['jubilife', 'oreburgh'], ['oreburgh', 'floaroma'], ['floaroma', 'eterna'],
            ['eterna', 'hearthome'], ['hearthome', 'veilstone'], ['hearthome', 'pastoria'], ['pastoria', 'veilstone'], ['eterna', 'snowpoint'], ['oreburgh', 'hearthome']],
    water=[['canalave', 'twinleaf']],
    pools=dict(catch=['starly', 'bidoof', 'kricketot', 'shinx', 'budew', 'cranidos', 'shieldon', 'burmy', 'combee', 'pachirisu', 'buizel', 'cherubi',
                      'shellos', 'drifloon', 'buneary', 'glameow', 'chingling', 'stunky', 'bronzor', 'bonsly', 'happiny', 'chatot', 'gible', 'riolu',
                      'hippopotas', 'skorupi', 'croagunk', 'carnivine', 'finneon', 'snover', 'geodude', 'zubat', 'machop', 'ponyta', 'psyduck'],
               steal=['gible', 'riolu', 'spiritomb', 'munchlax', 'mantyke', 'chatot', 'pachirisu', 'cranidos', 'shieldon', 'happiny', 'bonsly', 'eevee',
                      'togepi', 'snorunt', 'lucario']),
    rivals={'galactic': [('galactic-hq-site', 'Galactic HQ (Veilstone)', 'veilstone', True), ('windworks-hold', 'Valley Windworks Hold', 'floaroma'),
                         ('eterna-office', 'Eterna Galactic Building', 'eterna'), ('lake-verity-camp', 'Lake Verity Camp', 'twinleaf'),
                         ('lake-valor-camp', 'Lake Valor Camp', 'pastoria'), ('lake-acuity-camp', 'Lake Acuity Camp', 'snowpoint'),
                         ('veilstone-warehouse', 'Veilstone Warehouse', 'veilstone')]},
    gyms=[
        gym('oreburgh-gym', 'oreburgh', 'Roark', 'roark', 'rock', 'Coal', ['geodude', 'onix', 'cranidos'], 1, [('Youngster Jonathon', 'youngster', ['geodude'])]),
        gym('eterna-gym', 'eterna', 'Gardenia', 'gardenia', 'grass', 'Forest', ['cherubi', 'turtwig', 'roserade'], 1, [('Lass Caroline', 'lass', ['budew'])]),
        gym('veilstone-gym', 'veilstone', 'Maylene', 'maylene', 'fighting', 'Cobble', ['meditite', 'machoke', 'lucario'], 2, [('Black Belt Darren', 'black-belt', ['machop'])]),
        gym('pastoria-gym', 'pastoria', 'Crasher Wake', 'crasherwake', 'water', 'Fen', ['gyarados', 'quagsire', 'floatzel'], 2, [('Fisherman Walter', 'fisherman', ['magikarp', 'gyarados'])]),
        gym('hearthome-gym', 'hearthome', 'Fantina', 'fantina', 'ghost', 'Relic', ['duskull', 'haunter', 'mismagius'], 3, [('Hex Maniac Kindra', 'hex-maniac', ['drifloon'])]),
        gym('canalave-gym', 'canalave', 'Byron', 'byron', 'steel', 'Mine', ['bronzor', 'steelix', 'bastiodon'], 3, [('Worker Gary', 'worker', ['onix', 'magnemite'])]),
        gym('snowpoint-gym', 'snowpoint', 'Candice', 'candice', 'ice', 'Icicle', ['snover', 'sneasel', 'medicham', 'abomasnow'], 4, [('Skier Alexa', 'snow-worker', ['snover'])]),
        gym('sunyshore-gym', 'pastoria', 'Volkner', 'volkner', 'electric', 'Beacon', ['raichu', 'ambipom', 'octillery', 'luxray'], 4, [('Guitarist Jerry', 'guitarist', ['pachirisu', 'luxio'])]),
    ],
    business=[
        biz('canalave-mart', 'Canalave Mart', 5000, 200, True, ('items', 2, 'potion'), '2 Potions a week.'),
        biz('poketch-co', 'Pokétch Company', 15000, 600, True, ('odds', 5), 'Every watch tells you the time, and you where they are: +5% on jobs in Jubilife.'),
        biz('jubilife-tv', 'Jubilife TV', 30000, 800, True, ('heroDown', 1), 'Your story on the evening news. The Hero sees it.', rival=True),
        biz('galactic-hq', 'Veilstone Store Front', 15000, 600, True, ('regard', 1), 'Regard +1 in Veilstone each week.'),
        biz('veilstone-game-corner', 'Veilstone Game Corner', 20000, 500, False, ('clean', 200), 'The slots wash ₽200 a week.', rival=True),
        biz('eterna-bikes', 'Cycle Shop', 4000, 180, True, ('odds', 5), 'Fast bikes: +5% on jobs in Eterna.'),
        biz('pastoria-mart', 'Pastoria Mart', 4500, 180, True, ('items', 2, 'safari-ball'), '2 Safari Balls a week.'),
        biz('mining-museum', 'Mining Museum', 9000, 300, True, ('income', 300), 'Fossil tours pay ₽300 a week.'),
    ],
    pillars=['jubilife-tv', 'veilstone-game-corner'],
    hero=dict(path=['twinleaf', 'jubilife', 'oreburgh', 'floaroma', 'eterna', 'hearthome', 'veilstone', 'pastoria', 'snowpoint'],
              allies=[ally('gardenia', 'Gardenia', 'gardenia', 'roserade'), ally('maylene', 'Maylene', 'maylene', 'lucario'), ally('crasherwake', 'Crasher Wake', 'crasherwake', 'floatzel'),
                      ally('fantina', 'Fantina', 'fantina', 'mismagius'), ally('byron', 'Byron', 'byron', 'bastiodon'), ally('volkner', 'Volkner', 'volkner', 'luxray'),
                      ally('cynthia', 'Cynthia', 'cynthia-gen7', 'garchomp', True)],
              mentor='Professor Rowan', parent="The Hero's mother", sidekick='Barry, from Twinleaf',
              homes={'uxie': ('snowpoint', 'Lake Acuity'), 'mesprit': ('twinleaf', 'Lake Verity'), 'azelf': ('pastoria', 'Lake Valor')}),
    league=dict(elite=[who('aaron', 'Aaron', ['dustox', 'beautifly', 'vespiquen', 'heracross', 'drapion'], 2), who('bertha', 'Bertha', ['quagsire', 'sudowoodo', 'golem', 'whiscash', 'hippowdon'], 3),
                       who('flint', 'Flint', ['rapidash', 'steelix', 'drifblim', 'lopunny', 'infernape'], 4), who('lucian', 'Lucian', ['mr-mime', 'girafarig', 'medicham', 'alakazam', 'bronzong'], 5)],
                champion=who('cynthia', 'Cynthia', ['spiritomb', 'roserade', 'gastrodon', 'lucario', 'milotic', 'garchomp'], 6), standIn={}),
    lab=['cranidos', 'shieldon', 'gible', 'riolu', 'porygon'],
    desk=dict(name='Sinnoh', rivals=['Team Galactic'], badges=[('Coal', 'Oreburgh City', '#7a6a5a'), ('Forest', 'Eterna City', '#5aa84a'), ('Cobble', 'Veilstone City', '#c8a87a'),
                                                              ('Fen', 'Pastoria City', '#4a9ad8'), ('Relic', 'Hearthome City', '#a87ad8'), ('Mine', 'Canalave City', '#a8a8b8'),
                                                              ('Icicle', 'Snowpoint City', '#a8e0f8'), ('Beacon', 'Sunyshore City', '#ffd23f')]),
    places={'twinleaf': 'twinleaf', 'sandgem': 'twinleaf', 'verity': 'twinleaf', 'rowan': 'twinleaf', 'jubilife': 'jubilife', 'poketch': 'jubilife',
            'canalave': 'canalave', 'iron island': 'canalave', 'fullmoon': 'canalave', 'newmoon': 'canalave', 'oreburgh': 'oreburgh', 'wayward': 'oreburgh',
            'ravaged path': 'oreburgh', 'floaroma': 'floaroma', 'windworks': 'floaroma', 'eterna': 'eterna', 'old chateau': 'eterna', 'mt. coronet': 'eterna',
            'spear pillar': 'eterna', 'hearthome': 'hearthome', 'amity': 'hearthome', 'lost tower': 'hearthome', 'solaceon': 'hearthome', 'veilstone': 'veilstone',
            'galactic': 'veilstone', 'celestic': 'veilstone', 'pastoria': 'pastoria', 'great marsh': 'pastoria', 'valor': 'pastoria', 'hotel grand lake': 'pastoria',
            'sunyshore': 'pastoria', 'snowpoint': 'snowpoint', 'acuity': 'snowpoint', 'pokémon league': 'snowpoint', 'victory road': 'snowpoint',
            'battle zone': 'canalave', 'survival area': 'canalave', 'resort area': 'canalave', 'fight area': 'canalave', 'stark mountain': 'canalave',
            'battle frontier': 'canalave', 'trophy garden': 'pastoria', 'vista lighthouse': 'pastoria', 'route 212': 'pastoria', 'route 210': 'hearthome',
            'distortion world': 'eterna', 'turnback': 'eterna', 'snowpoint temple': 'snowpoint', 'underground': 'eterna'},
)

# ======================================================================= UNOVA
R['unova'] = dict(
    hq='castelia', label='UNOVA', warehouse='Castelia',
    arrive=[
        'Castelia. Every street is a canyon of glass, and the warehouse is a basement under a burger shop.',
        '{brought} looks up at the towers. "Big city. Lots of pockets."',
        'On the corner, a man in a grey robe is giving a speech about setting Pokémon free. A small crowd is nodding along.',
    ],
    districts=[
        town('nuvema', 'Nuvema', 40, 300, ('normal', 'grass'), [
            T('juniper-lab', "Juniper's Lab", 'site', 'Professor Juniper', 'scientist_f', 'Bright, busy, and never in the lab.', ('Absent', 6), 1.3, 'Lab aide', 'youngster', ['patrat', 'lillipup']),
            T('nuvema-street', 'Seaside Lane', 'street', 'The neighbours', 'pokefan_f', 'Every house can see the ocean and every neighbour.', ('Watchful', -4), 1, 'Neighbour', 'picnicker', ['purrloin']),
            T('route-1-unova', 'Route 1', 'route', 'Trainers on the route', 'backpacker_m', 'Kids on their first day out.', None, 1, 'Youngster Jimmy', 'youngster', ['patrat', 'lillipup']),
        ]),
        town('accumula', 'Accumula', 40, 196, ('normal', 'psychic'), [
            T('accumula-square', 'Accumula Square', 'crowd', 'The listeners', 'hooligans', 'Where Plasma gives its speeches.', ('Gullible', 6), 1.2, 'Listener', 'roughneck', ['purrloin', 'patrat']),
            T('accumula-mart', 'Accumula Mart', 'shop', 'The Mart clerk', 'clerk', 'Quiet till, quiet clerk.', ('Timid', 5), 1, "The clerk's son", 'youngster', ['lillipup']),
            T('route-2-unova', 'Route 2', 'route', 'Trainers on the route', 'backpacker_f', 'Grass, kids and a little Pokémon Centre.', None, 1, 'Lass Morgan', 'lass', ['purrloin', 'pidove']),
        ]),
        town('striaton', 'Striaton', 140, 120, ('grass', 'fire'), [
            T('striaton-restaurant', 'Striaton Restaurant', 'crowd', 'The three brothers', 'waiter_m', 'Waiters who battle. Tips are compulsory.', ('Proud', -4), 1.3, 'Waiter', 'veteran', ['pansage', 'pansear', 'panpour']),
            T('dreamyard', 'The Dreamyard', 'ghost', 'The night watchman', 'veteran_m', 'A ruined lab where people dream other people\'s dreams.', ('Superstitious', 6), 1.3, 'Watchman', 'psychic', ['munna', 'purrloin']),
            T('striaton-school', "Trainers' School", 'site', 'The school head', 'expert_pokemon_breeder', 'A good school with a bad lock.', ('Kind', 5), 1.1, 'Student', 'lass', ['lillipup']),
        ]),
        town('nacrene', 'Nacrene', 140, 300, ('normal', 'rock'), [
            T('nacrene-museum', 'Nacrene Museum', 'site', 'The curator', 'scientist_m', 'A dragon skull and a lot of empty security cameras.', ('Nervous', 6), 1.5, 'Museum guard', 'veteran', ['roggenrola', 'herdier'], 1),
            T('nacrene-cafe', 'Café Warehouse', 'crowd', 'The barista', 'waiter_f', 'Artists drink coffee here all day.', ('Gossip', 5), 1.2, 'Artist', 'aroma-lady', ['pansage']),
            T('pinwheel-forest', 'Pinwheel Forest', 'route', 'Forest rangers', 'ranger_m', 'A big wood on the river.', None, 1.1, 'Ranger Forrest', 'ranger', ['sewaddle', 'venipede']),
        ]),
        town('castelia', 'Castelia', 260, 300, ('normal', 'water'), [
            T('castelia-street', 'Castelia Street', 'shop', 'The business owners', 'rich_m', 'Fifty floors of offices and a cone shop on the corner.', ('Greedy', 4), 1.5, 'Office guard', 'veteran', ['herdier', 'trubbish']),
            T('castelia-sewers', 'Castelia Sewers', 'cave', 'The sewer gang', 'hooligans', 'Under the city there is another city.', ('Shifty', 6), 1.3, 'Sewer tough', 'roughneck', ['trubbish', 'grimer']),
            T('castelia-pier', 'Castelia Piers', 'dock', 'The pier boss', 'pilot', 'Ferries to Liberty Garden, cargo to everywhere.', ('Stubborn', -4), 1.4, 'Pier hand', 'worker', ['tympole', 'frillish']),
        ], control=10, w=124),
        town('nimbasa', 'Nimbasa', 260, 170, ('electric', 'ground'), [
            T('nimbasa-amusement', 'Amusement Park', 'crowd', 'The park manager', 'harlequin', 'A Ferris wheel and very long queues.', ('Gullible', 5), 1.4, 'Park staff', 'guitarist', ['emolga', 'blitzle']),
            T('gear-station', 'Gear Station', 'site', 'The station master', 'depot_agent', 'Every train in Unova runs through here.', ('Steady', -4), 1.5, 'Depot agent', 'worker', ['klink', 'timburr'], 1),
            T('nimbasa-station', 'Nimbasa Police Post', 'police', 'Officer Jenny', 'police', 'Plasma rallies keep her busy.', ('Sharp', -10), 1, 'Officer', 'veteran', ['lillipup', 'herdier'], 1),
        ], police=True, w=124),
        town('driftveil', 'Driftveil', 400, 196, ('ground', 'steel'), [
            T('driftveil-market', 'Driftveil Market', 'shop', 'The market boss', 'clerk_f', 'Fresh berries and cold storage behind the stalls.', ('Greedy', 5), 1.3, 'Market tough', 'roughneck', ['sandile', 'roggenrola']),
            T('cold-storage', 'Cold Storage', 'site', 'The warehouse keeper', 'worker_f', 'Plasma likes cold rooms. Nobody asks why.', ('Shifty', 6), 1.4, 'Storage guard', 'veteran', ['vanillite', 'timburr'], 1),
            T('chargestone', 'Chargestone Cave', 'cave', 'The cave guides', 'ruin_maniac', 'Floating stones and magnetic air.', None, 1.2, 'Guide', 'hiker', ['joltik', 'tynamo']),
        ], rival=45, note='Plasma'),
        town('mistralton', 'Mistralton', 400, 70, ('flying', 'grass'), [
            T('mistralton-cargo', 'Cargo Airfield', 'site', 'The pilots', 'pilot', 'Cargo planes to every city in Unova.', ('Bored', 4), 1.5, 'Pilot', 'bird-keeper', ['swoobat', 'ducklett'], 1),
            T('celestial-tower', 'Celestial Tower', 'ghost', 'The bell keeper', 'veteran_f', 'Ring the bell, and the dead hear it.', ('Pious', -6), 1.3, 'Keeper', 'hex-maniac', ['litwick', 'elgyem']),
            T('mistralton-farm', 'Route 6 Farms', 'route', 'The farmers', 'worker_f', 'Seasons change the fields, not the farmers.', None, 1, 'Farmer', 'picnicker', ['deerling', 'karrablast']),
        ], rival=25, note='Plasma'),
        town('icirrus', 'Icirrus', 520, 70, ('ice', 'water'), [
            T('dragonspiral', 'Dragonspiral Tower', 'ghost', 'The tower keeper', 'veteran_m', 'The oldest building in Unova. Something lives on top.', ('Pious', -8), 1.5, 'Keeper', 'dragon-tamer', ['druddigon', 'golett'], 2),
            T('icirrus-fan-club', 'Pokémon Fan Club', 'crowd', 'The chairman', 'pokefan_m', 'Talks about his Pokémon for hours.', ('Gullible', 6), 1.1, 'Fan', 'picnicker', ['cubchoo']),
            T('icirrus-marsh', 'Icirrus Marsh', 'route', 'Marsh fishermen', 'scuba_diver_m', 'Frozen in winter, flooded in spring.', None, 1.1, 'Fisherman Eli', 'fisherman', ['stunfisk', 'palpitoad']),
        ], rival=30, note='Plasma'),
        town('opelucid', 'Opelucid', 520, 196, ('dragon', 'steel'), [
            T('opelucid-square', 'Opelucid Square', 'crowd', 'The city council', 'veteran_f', 'Old money and new machines, side by side.', ('Proud', -6), 1.4, 'Councillor\'s guard', 'ace-trainer', ['fraxure', 'klang'], 2),
            T('opelucid-mart', 'Opelucid Mart', 'shop', 'The Mart clerk', 'clerk', 'Dragon fangs for sale, no receipts.', ('Timid', 5), 1.1, "The clerk's brother", 'dragon-tamer', ['axew']),
            T('route-11-unova', 'Route 11', 'route', 'Trainers on the route', 'backpacker_m', 'Waterfalls and very fast Trainers.', None, 1.1, 'Ace Trainer Chris', 'ace-trainer', ['sawsbuck', 'karrablast']),
        ], rival=55, note='Plasma'),
    ],
    routes=[['nuvema', 'accumula'], ['accumula', 'striaton'], ['striaton', 'nacrene'], ['nacrene', 'castelia'], ['castelia', 'nimbasa'], ['nimbasa', 'driftveil'],
            ['driftveil', 'mistralton'], ['mistralton', 'icirrus'], ['icirrus', 'opelucid'], ['opelucid', 'driftveil'], ['nimbasa', 'striaton']],
    water=[['castelia', 'driftveil']],
    pools=dict(catch=['patrat', 'lillipup', 'purrloin', 'pidove', 'blitzle', 'roggenrola', 'woobat', 'drilbur', 'audino', 'timburr', 'tympole', 'sewaddle',
                      'venipede', 'cottonee', 'petilil', 'basculin', 'sandile', 'darumaka', 'maractus', 'dwebble', 'scraggy', 'sigilyph', 'trubbish',
                      'minccino', 'gothita', 'solosis', 'ducklett', 'vanillite', 'deerling', 'emolga', 'karrablast', 'foongus', 'frillish', 'joltik'],
               steal=['axew', 'deino', 'larvesta', 'zorua', 'litwick', 'golett', 'pawniard', 'rufflet', 'vullaby', 'tirtouga', 'archen', 'klink',
                      'elgyem', 'cubchoo', 'mienfoo', 'druddigon']),
    rivals={'plasma': [('plasma-castle-site', "N's Castle (Opelucid)", 'opelucid', True), ('cold-storage-hold', 'Cold Storage Hold', 'driftveil'),
                       ('plasma-frigate', 'Plasma Frigate Berth', 'driftveil'), ('dragonspiral-camp', 'Dragonspiral Camp', 'icirrus'),
                       ('nacrene-cell', 'Nacrene Cell', 'nacrene'), ('accumula-stage', 'Accumula Stage', 'accumula'), ('celestial-watch', 'Celestial Tower Watch', 'mistralton')]},
    gyms=[
        gym('striaton-gym', 'striaton', 'Cilan', 'cilan', 'grass', 'Trio', ['lillipup', 'pansage'], 1, [('Waiter Tate', 'veteran', ['pansear'])]),
        gym('nacrene-gym', 'nacrene', 'Lenora', 'lenora', 'normal', 'Basic', ['herdier', 'watchog'], 1, [('Ace Trainer Magnolia', 'ace-trainer', ['patrat'])]),
        gym('castelia-gym', 'castelia', 'Burgh', 'burgh', 'bug', 'Insect', ['whirlipede', 'dwebble', 'leavanny'], 2, [('Bug Catcher Kent', 'bug-catcher', ['sewaddle'])]),
        gym('nimbasa-gym', 'nimbasa', 'Elesa', 'elesa', 'electric', 'Bolt', ['emolga', 'emolga', 'zebstrika'], 2, [('Guitarist Leslie', 'guitarist', ['blitzle'])]),
        gym('driftveil-gym', 'driftveil', 'Clay', 'clay', 'ground', 'Quake', ['krokorok', 'palpitoad', 'excadrill'], 3, [('Worker Brady', 'worker', ['drilbur', 'roggenrola'])]),
        gym('mistralton-gym', 'mistralton', 'Skyla', 'skyla', 'flying', 'Jet', ['swoobat', 'unfezant', 'swanna'], 3, [('Pilot Bert', 'bird-keeper', ['ducklett'])]),
        gym('icirrus-gym', 'icirrus', 'Brycen', 'brycen', 'ice', 'Freeze', ['vanillish', 'cryogonal', 'beartic'], 4, [('Black Belt Corey', 'black-belt', ['cubchoo'])]),
        gym('opelucid-gym', 'opelucid', 'Drayden', 'drayden', 'dragon', 'Legend', ['fraxure', 'druddigon', 'haxorus'], 4, [('Dragon Tamer Kassandra', 'dragon-tamer', ['axew'])]),
    ],
    business=[
        biz('accumula-mart', 'Accumula Mart', 5000, 200, True, ('items', 2, 'potion'), '2 Potions a week.'),
        biz('castelia-street', 'Castelia Street', 30000, 800, True, ('income', 400), 'Office rents: ₽400 more a week.', rival=True),
        biz('striaton-restaurant', 'Striaton Restaurant', 9000, 300, True, ('regard', 1), 'Free dinners: Regard +1 in Striaton each week.'),
        biz('nimbasa-amusement', 'Amusement Park', 15000, 600, True, ('heroDown', 1), 'The Hero rides the Ferris wheel. Twice.'),
        biz('gear-station', 'Gear Station', 20000, 500, True, ('odds', 5), 'Every train runs on time for you: +5% on jobs in Nimbasa.', rival=True),
        biz('driftveil-market', 'Driftveil Market', 9000, 350, False, ('clean', 150), 'Cash stalls: ₽150 a week comes back clean.'),
        biz('opelucid-mart', 'Opelucid Mart', 4500, 180, True, ('items', 1, 'dragon-fang'), 'A Dragon Fang a week.'),
        biz('nacrene-cafe', 'Café Warehouse', 4500, 180, True, ('heatDown', 1), 'Artists cover for you: Heat −1 in Nacrene each week.'),
    ],
    pillars=['castelia-street', 'gear-station'],
    hero=dict(path=['nuvema', 'striaton', 'nacrene', 'castelia', 'nimbasa', 'driftveil', 'mistralton', 'icirrus', 'opelucid'],
              allies=[ally('cilan', 'Cilan', 'cilan', 'simisage'), ally('burgh', 'Burgh', 'cheren', 'leavanny'), ally('elesa', 'Elesa', 'elesa-gen5bw2', 'zebstrika'),
                      ally('clay', 'Clay', 'clay', 'excadrill'), ally('skyla', 'Skyla', 'skyla', 'swanna'), ally('drayden', 'Drayden', 'drayden', 'haxorus'),
                      ally('alder', 'Alder', 'alder', 'volcarona', True)],
              mentor='Professor Juniper', parent="The Hero's mother", sidekick='Bianca, from Nuvema',
              homes={'cobalion': ('mistralton', 'Mistralton Cave'), 'terrakion': ('driftveil', 'the Victory Road'), 'virizion': ('nacrene', 'Pinwheel Forest')}),
    league=dict(elite=[who('shauntal', 'Shauntal', ['cofagrigus', 'jellicent', 'golurk', 'chandelure'], 2), who('grimsley', 'Grimsley', ['scrafty', 'krookodile', 'liepard', 'bisharp'], 3),
                       who('caitlin', 'Caitlin', ['musharna', 'sigilyph', 'reuniclus', 'gothitelle'], 4), who('marshal', 'Marshal', ['throh', 'sawk', 'mienshao', 'conkeldurr'], 5)],
                champion=who('alder', 'Alder', ['accelgor', 'bouffalant', 'druddigon', 'vanilluxe', 'escavalier', 'volcarona'], 6), standIn={}),
    lab=['tirtouga', 'archen', 'zorua', 'klink', 'porygon'],
    desk=dict(name='Unova', rivals=['Team Plasma'], badges=[('Trio', 'Striaton City', '#5aa84a'), ('Basic', 'Nacrene City', '#c8a87a'), ('Insect', 'Castelia City', '#9ad83a'),
                                                           ('Bolt', 'Nimbasa City', '#ffd23f'), ('Quake', 'Driftveil City', '#a87a4a'), ('Jet', 'Mistralton City', '#7ab8e8'),
                                                           ('Freeze', 'Icirrus City', '#a8e0f8'), ('Legend', 'Opelucid City', '#4a6ab8')]),
    places={'nuvema': 'nuvema', 'juniper': 'nuvema', 'accumula': 'accumula', 'striaton': 'striaton', 'dreamyard': 'striaton', 'nacrene': 'nacrene',
            'pinwheel': 'nacrene', 'castelia': 'castelia', 'liberty': 'castelia', 'skyarrow': 'castelia', 'nimbasa': 'nimbasa', 'gear station': 'nimbasa',
            'battle subway': 'nimbasa', 'desert resort': 'nimbasa', 'relic castle': 'nimbasa', 'driftveil': 'driftveil', 'cold storage': 'driftveil',
            'chargestone': 'driftveil', 'mistralton': 'mistralton', 'celestial': 'mistralton', 'icirrus': 'icirrus', 'dragonspiral': 'icirrus',
            'twist mountain': 'icirrus', 'opelucid': 'opelucid', 'victory road': 'opelucid', 'pokémon league': 'opelucid', "n's castle": 'opelucid',
            'black city': 'opelucid', 'white forest': 'opelucid', 'undella': 'opelucid', 'lacunosa': 'opelucid', 'village bridge': 'driftveil',
            'giant chasm': 'opelucid', 'abundant shrine': 'opelucid', 'route 4': 'castelia', 'route 7': 'mistralton', 'pokéwood': 'castelia',
            'join avenue': 'castelia', 'p2 lab': 'opelucid', 'marine tube': 'opelucid', 'humilau': 'opelucid', 'aspertia': 'nuvema', 'virbank': 'nuvema'},
)

# ======================================================================= KALOS
R['kalos'] = dict(
    hq='coumarine', label='KALOS', warehouse='Coumarine',
    arrive=[
        'Coumarine: half the town on the cliff, half by the sea, and a monorail between them. The warehouse is at the bottom.',
        '{brought} straightens their collar. "Everyone here dresses better than us, Boss."',
        'On every corner, a red-suited stranger hands out leaflets for a "better, more beautiful world". The leaflets are very expensive paper.',
    ],
    districts=[
        town('vaniville', 'Vaniville', 40, 300, ('normal', 'fairy'), [
            T('vaniville-street', 'Vaniville Lane', 'street', 'The neighbours', 'pokefan_f', 'Rhyhorn racers live here. They wake up early.', ('Watchful', -4), 1, 'Neighbour', 'picnicker', ['fletchling']),
            T('aquacorde-bridge', 'Aquacorde Bridge', 'crowd', 'The café crowd', 'waiter_f', 'Teenagers deciding their futures over macarons.', ('Gullible', 5), 1.1, 'Café regular', 'lass', ['bunnelby']),
            T('route-2-kalos', 'Route 2', 'route', 'Trainers on the route', 'backpacker_f', 'A short path with a lot of grass.', None, 1, 'Youngster Austin', 'youngster', ['fletchling', 'scatterbug']),
        ]),
        town('santalune', 'Santalune', 40, 196, ('bug', 'grass'), [
            T('santalune-forest', 'Santalune Forest', 'route', 'Bug catchers', 'backpacker_m', 'A bright forest with tidy paths.', None, 1, 'Bug Catcher Wayne', 'bug-catcher', ['scatterbug', 'pansage']),
            T('santalune-mart', 'Santalune Mart', 'shop', 'The Mart clerk', 'clerk', 'Sells photo frames and Poké Balls.', ('Timid', 5), 1, "The clerk's niece", 'lass', ['pikachu']),
            T('santalune-square', 'Santalune Plaza', 'crowd', 'The plaza crowd', 'artist', 'Painters, a photographer and her Gym.', ('Gossip', 5), 1.1, 'Painter', 'aroma-lady', ['vivillon']),
        ]),
        town('lumiose', 'Lumiose', 200, 170, ('normal', 'electric'), [
            T('lumiose-boutique', 'Boutique Couture', 'shop', 'The manager', 'rich_f', 'You can\'t afford it. That\'s the point.', ('Snob', -4), 1.6, 'Boutique guard', 'veteran', ['furfrou', 'meowstic']),
            T('lysandre-cafe', 'Lysandre Café', 'site', 'The waiter', 'waiter_m', 'Red walls, red coffee, a lift that goes down.', ('Shifty', 6), 1.6, 'Café staff', 'veteran', ['houndour', 'litleo'], 1),
            T('prism-tower', 'Prism Tower', 'site', 'The tower engineer', 'worker_f', 'It lights the whole city. Somebody has to work the switch.', ('Steady', -4), 1.5, 'Tower staff', 'guitarist', ['helioptile', 'magnemite'], 1),
        ], rival=55, w=130, note='Flare'),
        town('cyllage', 'Cyllage', 40, 70, ('rock', 'water'), [
            T('cyllage-bikes', 'Cycle Shop', 'shop', 'The bike seller', 'cyclist_f', 'Bikes up the cliff road, brakes extra.', ('Greedy', 4), 1.2, 'Cyclist', 'biker', ['fletchinder']),
            T('glittering-cave', 'Glittering Cave', 'cave', 'Fossil diggers', 'worker_f', 'Glowing walls and very old bones.', None, 1.2, 'Digger', 'hiker', ['onix', 'cubone']),
            T('ambrette-aquarium', 'Ambrette Aquarium', 'site', 'The aquarium director', 'scientist_f', 'Tanks of rare fish, and a fossil lab in the back.', ('Nervous', 6), 1.4, 'Aquarium guard', 'veteran', ['skrelp', 'clauncher'], 1),
        ]),
        town('coumarine', 'Coumarine', 340, 300, ('water', 'grass'), [
            T('coumarine-port', 'Coumarine Port', 'dock', 'The port boss', 'pilot', 'Ships to Hoenn, ships to Alola, ships nobody writes down.', ('Stubborn', -4), 1.4, 'Port hand', 'worker', ['wingull', 'inkay']),
            T('coumarine-monorail', 'Monorail Station', 'site', 'The station master', 'depot_agent', 'One train up the cliff, one train down.', ('Bored', 4), 1.3, 'Station hand', 'worker', ['magnemite', 'helioptile']),
            T('coumarine-mart', 'Coumarine Mart', 'shop', 'The Mart clerk', 'clerk', 'Fishing gear and sunscreen.', ('Timid', 5), 1, "The clerk's brother", 'fisherman', ['remoraid']),
        ], control=10),
        town('shalour', 'Shalour', 200, 40, ('fighting', 'steel'), [
            T('tower-of-mastery', 'Tower of Mastery', 'site', 'The Mega Tower guru', 'veteran_m', 'He guards the secret of Mega Evolution with his life.', ('Proud', -8), 1.6, 'Guru', 'black-belt', ['lucario', 'machoke'], 2),
            T('shalour-shore', 'Shalour Tide Flats', 'route', 'Tide walkers', 'scuba_diver_f', 'At low tide you can walk to the tower.', None, 1.1, 'Swimmer Marina', 'swimmer', ['binacle', 'skrelp']),
            T('shalour-mart', 'Shalour Mart', 'shop', 'The Mart clerk', 'clerk', 'Sells postcards of the tower.', ('Timid', 5), 1, "The clerk's sister", 'battle-girl', ['makuhita']),
        ]),
        town('laverre', 'Laverre', 340, 120, ('fairy', 'ghost'), [
            T('laverre-factory', 'Poké Ball Factory', 'site', 'The factory boss', 'worker_f', 'A Ball every second, all day long.', ('Bored', 5), 1.6, 'Factory guard', 'veteran', ['magnemite', 'pawniard'], 1),
            T('laverre-tree', 'The Great Tree', 'crowd', 'The tree town', 'parasol_lady', 'A town built round one old tree.', ('Watchful', -4), 1.2, 'Townsman', 'fairy-tale-girl', ['spritzee', 'swirlix']),
            T('lost-hotel', 'Lost Hotel', 'ghost', 'The punks', 'hooligans', 'A hotel nobody runs, full of people nobody wants.', ('Shifty', 6), 1.2, 'Punk', 'roughneck', ['trubbish', 'scraggy']),
        ], rival=25, note='Flare'),
        town('anistar', 'Anistar', 480, 196, ('psychic', 'flying'), [
            T('anistar-sundial', 'The Sundial', 'crowd', 'The watchers', 'psychic_f', 'They wait all day for the sundial to glow.', ('Superstitious', 6), 1.3, 'Watcher', 'psychic', ['espurr', 'sigilyph']),
            T('anistar-station', 'Anistar Police Post', 'police', 'Officer Jenny', 'police', 'A quiet post in a town of mystics.', ('Sharp', -10), 1, 'Officer', 'veteran', ['growlithe', 'meowstic'], 1),
            T('route-15-kalos', 'Route 15', 'route', 'Trainers on the route', 'backpacker_m', 'Wet leaves and lost Trainers.', None, 1.1, 'Ace Trainer Dean', 'ace-trainer', ['pawniard', 'skorupi']),
        ], police=True),
        town('snowbelle', 'Snowbelle', 480, 70, ('ice', 'grass'), [
            T('winding-woods', 'Winding Woods', 'route', 'Wood cutters', 'worker_f', 'Snow on the trees all year.', None, 1.1, 'Wood cutter', 'snow-worker', ['bergmite', 'snover']),
            T('pokemon-village', 'Pokémon Village', 'site', 'The village guardian', 'ranger_f', 'Pokémon hide here from people. She keeps it that way.', ('Kind', 5), 1.4, 'Guardian', 'ranger', ['ditto', 'noibat'], 1),
            T('snowbelle-mart', 'Snowbelle Mart', 'shop', 'The Mart clerk', 'clerk', 'Sells scarves and Ice Heals.', ('Timid', 5), 1, "The clerk's son", 'snow-worker', ['amaura']),
        ]),
        town('couriway', 'Couriway', 480, 300, ('water', 'dragon'), [
            T('couriway-station', 'Couriway Station', 'site', 'The station master', 'depot_agent', 'Trains from Lumiose stop here on the falls.', ('Bored', 4), 1.3, 'Station hand', 'worker', ['bunnelby']),
            T('terminus-cave', 'Terminus Cave', 'cave', 'The miners', 'worker_f', 'An abandoned mine with something guarding its end.', ('Superstitious', 6), 1.4, 'Miner', 'hiker', ['durant', 'noibat'], 1),
            T('kiloude-gate', 'Kiloude Gate', 'crowd', 'Battle fans', 'ace_trainer_m', 'Everyone here is going to the Battle Maison.', ('Proud', -4), 1.3, 'Battle fan', 'ace-trainer', ['goodra', 'hawlucha'], 2),
        ], rival=20, note='Flare'),
    ],
    routes=[['vaniville', 'santalune'], ['santalune', 'lumiose'], ['lumiose', 'cyllage'], ['cyllage', 'shalour'], ['shalour', 'lumiose'],
            ['lumiose', 'coumarine'], ['lumiose', 'laverre'], ['laverre', 'anistar'], ['anistar', 'snowbelle'], ['anistar', 'couriway'], ['coumarine', 'couriway']],
    water=[['vaniville', 'coumarine']],
    pools=dict(catch=['fletchling', 'scatterbug', 'bunnelby', 'litleo', 'flabebe', 'skiddo', 'pancham', 'furfrou', 'espurr', 'honedge', 'spritzee', 'swirlix',
                      'inkay', 'binacle', 'skrelp', 'clauncher', 'helioptile', 'tyrunt', 'amaura', 'hawlucha', 'dedenne', 'carbink', 'phantump',
                      'pumpkaboo', 'bergmite', 'noibat', 'pikachu', 'azurill', 'gulpin', 'snorlax', 'riolu', 'ralts', 'smeargle', 'gible'],
               steal=['goomy', 'noibat', 'honedge', 'tyrunt', 'amaura', 'hawlucha', 'dedenne', 'carbink', 'klefki', 'froakie', 'fennekin', 'chespin',
                      'riolu', 'eevee', 'axew', 'larvitar']),
    rivals={'flare': [('flare-secret-hq', 'Flare Secret HQ (Lumiose)', 'lumiose', True), ('lysandre-labs', 'Lysandre Labs Floor', 'lumiose'),
                      ('factory-wing', 'Poké Ball Factory Wing', 'laverre'), ('glittering-dig', 'Glittering Cave Dig', 'cyllage'),
                      ('lost-hotel-camp', 'Lost Hotel Camp', 'laverre'), ('terminus-watch', 'Terminus Cave Watch', 'couriway'), ('anistar-cell', 'Anistar Cell', 'anistar')]},
    gyms=[
        gym('santalune-gym', 'santalune', 'Viola', 'viola', 'bug', 'Bug', ['surskit', 'vivillon'], 1, [('Bug Catcher Charles', 'bug-catcher', ['scatterbug'])]),
        gym('cyllage-gym', 'cyllage', 'Grant', 'grant', 'rock', 'Cliff', ['amaura', 'tyrunt'], 1, [('Hiker Craig', 'hiker', ['onix'])]),
        gym('shalour-gym', 'shalour', 'Korrina', 'korrina', 'fighting', 'Rumble', ['mienfoo', 'machoke', 'lucario'], 2, [('Battle Girl Hailey', 'battle-girl', ['makuhita'])]),
        gym('coumarine-gym', 'coumarine', 'Ramos', 'ramos', 'grass', 'Plant', ['jumpluff', 'weepinbell', 'gogoat'], 2, [('Aroma Lady Rose', 'aroma-lady', ['skiddo'])]),
        gym('lumiose-gym', 'lumiose', 'Clemont', 'clemont', 'electric', 'Voltage', ['emolga', 'magneton', 'heliolisk'], 3, [('Guitarist Elijah', 'guitarist', ['helioptile'])]),
        gym('laverre-gym', 'laverre', 'Valerie', 'valerie', 'fairy', 'Fairy', ['mawile', 'mr-mime', 'sylveon'], 3, [('Fairy Tale Girl Alice', 'fairy-tale-girl', ['flabebe'])]),
        gym('anistar-gym', 'anistar', 'Olympia', 'olympia', 'psychic', 'Psychic', ['sigilyph', 'slowking', 'meowstic'], 4, [('Psychic Abigail', 'psychic', ['espurr'])]),
        gym('snowbelle-gym', 'snowbelle', 'Wulfric', 'wulfric', 'ice', 'Iceberg', ['abomasnow', 'cryogonal', 'avalugg'], 4, [('Skier Sidney', 'snow-worker', ['bergmite'])]),
    ],
    business=[
        biz('santalune-mart', 'Santalune Mart', 5000, 200, True, ('items', 2, 'potion'), '2 Potions a week.'),
        biz('lumiose-boutique', 'Boutique Couture', 30000, 800, True, ('regard', 2), 'You dress like money now. Regard +2 in Lumiose each week.', rival=True),
        biz('laverre-factory', 'Poké Ball Factory', 20000, 500, True, ('items', 3, 'great-ball'), '3 Great Balls a week off the line.', rival=True),
        biz('cyllage-bikes', 'Cycle Shop', 4000, 180, True, ('odds', 5), 'Fast bikes: +5% on jobs in Cyllage.'),
        biz('coumarine-port', 'Coumarine Port', 12000, 450, False, ('clean', 200), 'Unwritten cargo: ₽200 a week comes back clean.'),
        biz('shalour-mart', 'Shalour Mart', 4500, 180, True, ('heatDown', 1), 'Postcards and silence: Heat −1 in Shalour each week.'),
        biz('snowbelle-mart', 'Snowbelle Mart', 4500, 180, True, ('items', 2, 'ice-heal'), '2 Ice Heals a week.'),
        biz('anistar-sundial', 'The Sundial', 8000, 250, True, ('heroDown', 1), 'The Hero stops to stare at the sundial.'),
    ],
    pillars=['lumiose-boutique', 'laverre-factory'],
    hero=dict(path=['vaniville', 'santalune', 'lumiose', 'cyllage', 'shalour', 'coumarine', 'laverre', 'anistar', 'snowbelle'],
              allies=[ally('viola', 'Viola', 'serena', 'vivillon'), ally('korrina', 'Korrina', 'korrina', 'lucario'), ally('clemont', 'Clemont', 'clemont', 'heliolisk'),
                      ally('valerie', 'Valerie', 'valerie', 'sylveon'), ally('olympia', 'Olympia', 'olympia', 'meowstic'), ally('wulfric', 'Wulfric', 'wulfric', 'avalugg'),
                      ally('diantha', 'Diantha', 'diantha', 'gardevoir', True)],
              mentor='Professor Sycamore', parent="The Hero's mother, a Rhyhorn racer", sidekick='Shauna, from Vaniville',
              homes={'xerneas': ('couriway', 'the Team Flare weapon room'), 'yveltal': ('couriway', 'the Team Flare weapon room')}),
    league=dict(elite=[who('malva', 'Malva', ['pyroar', 'torkoal', 'chandelure', 'talonflame'], 2), who('siebold', 'Siebold', ['clawitzer', 'starmie', 'gyarados', 'barbaracle'], 3),
                       who('wikstrom', 'Wikstrom', ['klefki', 'probopass', 'scizor', 'aegislash'], 4), who('drasna', 'Drasna', ['dragalge', 'druddigon', 'altaria', 'noivern'], 5)],
                champion=who('diantha', 'Diantha', ['hawlucha', 'tyrantrum', 'aurorus', 'gourgeist', 'goodra', 'gardevoir'], 6), standIn={}),
    lab=['tyrunt', 'amaura', 'goomy', 'honedge', 'porygon'],
    desk=dict(name='Kalos', rivals=['Team Flare'], badges=[('Bug', 'Santalune City', '#9ad83a'), ('Cliff', 'Cyllage City', '#a87a4a'), ('Rumble', 'Shalour City', '#c86a3a'),
                                                          ('Plant', 'Coumarine City', '#5aa84a'), ('Voltage', 'Lumiose City', '#ffd23f'), ('Fairy', 'Laverre City', '#e88ab0'),
                                                          ('Psychic', 'Anistar City', '#e070c0'), ('Iceberg', 'Snowbelle City', '#a8e0f8')]),
    places={'vaniville': 'vaniville', 'aquacorde': 'vaniville', 'santalune': 'santalune', 'lumiose': 'lumiose', 'prism': 'lumiose', 'lysandre': 'lumiose',
            'sycamore': 'lumiose', 'boutique': 'lumiose', 'restaurant': 'lumiose', 'hotel': 'lumiose', 'camphrier': 'lumiose', 'parfum': 'lumiose',
            'cyllage': 'cyllage', 'ambrette': 'cyllage', 'glittering': 'cyllage', 'geosenge': 'cyllage', 'shalour': 'shalour', 'mastery': 'shalour',
            'reflection cave': 'shalour', 'coumarine': 'coumarine', 'laverre': 'laverre', 'poké ball factory': 'laverre', 'lost hotel': 'laverre',
            'anistar': 'anistar', 'dendemille': 'anistar', 'frost cavern': 'anistar', 'snowbelle': 'snowbelle', 'pokémon village': 'snowbelle',
            'winding woods': 'snowbelle', 'victory road': 'snowbelle', 'pokémon league': 'snowbelle', 'couriway': 'couriway', 'terminus': 'couriway',
            'kiloude': 'couriway', 'battle maison': 'couriway', 'friend safari': 'couriway', 'sea spirit': 'coumarine', 'azure bay': 'coumarine',
            'parfum palace': 'lumiose', 'route 7': 'lumiose', 'connecting cave': 'cyllage', 'flare': 'lumiose', 'baths': 'shalour', 'wild zone': 'lumiose'},
)

# ======================================================================= ALOLA
R['alola'] = dict(
    hq='hauoli', label='ALOLA', warehouse="Hau'oli",
    arrive=[
        "Hau'oli in the sun. The new warehouse is a closed surf shop, and the sign still says ALOHA.",
        '{brought} puts on sunglasses. "Boss, I think I live here now."',
        'Down the beach, a crowd in skull hats is spray-painting a wall. A car with a white foundation logo drives past them very slowly.',
    ],
    districts=[
        town('iki', 'Iki Town', 40, 196, ('normal', 'fighting'), [
            T('iki-stage', 'The Festival Stage', 'crowd', 'The town elders', 'veteran_m', 'The kahuna\'s stage. Everyone comes on festival night.', ('Pious', -6), 1.2, 'Festival guard', 'black-belt', ['makuhita', 'crabrawler']),
            T('ruins-of-conflict', 'Ruins of Conflict', 'ghost', 'The ruin keeper', 'ruin_maniac', 'Tapu Koko\'s old home. People leave offerings.', ('Superstitious', 6), 1.3, 'Keeper', 'psychic', ['spinda']),
            T('route-1-alola', 'Route 1', 'route', 'Trainers on the route', 'backpacker_m', 'Kids with their first partner and a lot of sunscreen.', None, 1, 'Youngster Joey', 'youngster', ['pikipek', 'yungoos']),
        ]),
        town('hauoli', "Hau'oli", 40, 300, ('normal', 'water'), [
            T('hauoli-mall', "Hau'oli Shopping Mall", 'shop', 'The mall manager', 'rich_f', 'Three floors of souvenirs and a malasada stall.', ('Greedy', 4), 1.5, 'Mall guard', 'veteran', ['meowth', 'yungoos']),
            T('hauoli-beach', "Hau'oli Beachfront", 'dock', 'The surfers', 'swimmer_m', 'Surfboards, tourists, and boats that come in at night.', ('Gullible', 5), 1.3, 'Surfer', 'swimmer', ['wingull', 'pyukumuku']),
            T('hauoli-station', "Hau'oli Police Station", 'police', 'Officer Jenny', 'police', 'The island\'s only real police station.', ('Sharp', -10), 1, 'Officer', 'veteran', ['growlithe', 'gumshoos'], 1),
        ], control=10, police=True, w=124),
        town('heahea', 'Heahea', 180, 196, ('water', 'normal'), [
            T('tide-song-hotel', 'Tide Song Hotel', 'crowd', 'The concierge', 'waiter_m', 'Every guest is rich and every guest is bored.', ('Gossip', 6), 1.5, 'Hotel guard', 'veteran', ['persian']),
            T('heahea-port', 'Heahea Port', 'dock', 'The harbour master', 'pilot', 'Ferries between all four islands.', ('Stubborn', -4), 1.3, 'Dock hand', 'worker', ['machop', 'wingull']),
            T('dimensional-lab', 'Dimensional Research Lab', 'site', 'Professor Burnet', 'scientist_f', 'She studies the holes in the sky.', ('Distracted', 6), 1.5, 'Lab aide', 'psychic', ['abra', 'porygon'], 1),
        ]),
        town('konikoni', 'Konikoni', 180, 300, ('steel', 'rock'), [
            T('konikoni-market', 'Konikoni Market', 'shop', 'The stall owners', 'clerk_f', 'Herbs, jewellery and old pearls.', ('Greedy', 5), 1.3, 'Market tough', 'roughneck', ['magnemite', 'mudbray']),
            T('memorial-hill', 'Memorial Hill', 'ghost', 'The grave keeper', 'veteran_f', 'Old graves on a windy hill. Ghosts at sunset.', ('Superstitious', 6), 1.2, 'Keeper', 'hex-maniac', ['sandygast', 'zubat']),
            T('route-9-alola', 'Route 9 Docks', 'route', 'Fishermen', 'scuba_diver_m', 'The quiet side of the island.', None, 1.1, 'Fisherman Kai', 'fisherman', ['wishiwashi', 'finneon']),
        ]),
        town('malie', 'Malie', 320, 196, ('normal', 'grass'), [
            T('malie-library', 'Malie Library', 'site', 'The librarian', 'veteran_f', 'Old Kanto-style roofs and older books.', ('Bookish', 5), 1.3, 'Library guard', 'veteran', ['bronzor']),
            T('malie-garden', 'Malie Garden', 'crowd', 'The garden tea house', 'maid', 'Tourists drink tea; locals watch the tourists.', ('Gullible', 5), 1.3, 'Tea house guard', 'veteran', ['psyduck', 'lombre']),
            T('malie-port', 'Malie Port', 'dock', 'The cargo crew', 'worker_f', 'Cargo for the whole island.', ('Bored', 4), 1.3, 'Cargo hand', 'worker', ['machop', 'pelipper']),
        ]),
        town('po', 'Po Town', 320, 70, ('dark', 'poison'), [
            T('shady-house', 'The Shady House', 'site', "The 'butler'", 'waiter_m', 'Guzma\'s mansion. Skull does what it likes here.', ('Shifty', 6), 1.6, 'Skull grunt', 'roughneck', ['salandit', 'mareanie'], 1),
            T('po-mart', 'Po Town Mart', 'shop', 'The Mart clerk', 'clerk', 'Shut, painted over, and still open if you knock.', ('Timid', 5), 1.1, 'Skull grunt', 'roughneck', ['zubat', 'grimer']),
            T('po-walls', 'The Painted Walls', 'street', 'The taggers', 'hooligans', 'Every wall says SKULL. Every wall.', ('Hothead', 4), 1.2, 'Tagger', 'roughneck', ['salandit', 'trubbish']),
        ], rival=75, note='Skull'),
        town('aether', 'Aether Paradise', 460, 196, ('psychic', 'fairy'), [
            T('aether-conservation', 'Conservation Deck', 'site', 'The branch chief', 'scientist_m', 'Pokémon in perfect white rooms. Too perfect.', ('Loyal', -6), 1.6, 'Aether guard', 'veteran', ['porygon2', 'bewear'], 1),
            T('aether-lobby', 'Aether Lobby', 'crowd', 'The receptionists', 'clerk_f', 'Smiles, white uniforms, and a lift that needs a card.', ('Shifty', 5), 1.4, 'Receptionist', 'ace-trainer', ['oranguru']),
            T('aether-docks', 'Aether Docks', 'dock', 'The ferry crew', 'pilot', 'The only way on or off the island.', ('Steady', -4), 1.3, 'Ferry hand', 'swimmer', ['pelipper', 'lanturn']),
        ], rival=60, w=130, note='Aether'),
        town('paniola', 'Paniola', 180, 70, ('normal', 'ground'), [
            T('paniola-ranch', 'Paniola Ranch', 'site', 'The ranch owner', 'veteran_m', 'Tauros and Miltank and a very old fence.', ('Stubborn', -4), 1.3, 'Ranch hand', 'worker', ['mudbray', 'tauros']),
            T('royal-avenue', 'Royal Avenue', 'crowd', 'The Battle Royal crowd', 'smasher', 'Four Trainers in one ring. The crowd bets on all of them.', ('Greedy', 5), 1.4, 'Masked Royal fan', 'ace-trainer', ['hawlucha', 'crabrawler'], 1),
            T('route-5-alola', 'Brooklet Hill', 'route', 'Trainers on the hill', 'backpacker_f', 'Waterfalls and wishiwashi.', None, 1.1, 'Fisherman Ray', 'fisherman', ['dewpider', 'wishiwashi']),
        ]),
        town('seafolk', 'Seafolk', 460, 300, ('water', 'flying'), [
            T('seafolk-boats', 'Seafolk Houseboats', 'dock', 'The boat captains', 'pilot', 'A village made of boats. Nobody owns land here.', ('Stubborn', -4), 1.3, 'Captain', 'swimmer', ['wailmer', 'pelipper']),
            T('poni-canyon', 'Poni Canyon', 'cave', 'The canyon guides', 'ranger_f', 'Dragon Pokémon live at the end of the canyon.', ('Proud', -6), 1.5, 'Guide', 'dragon-tamer', ['jangmo-o', 'golbat'], 2),
            T('seafolk-diner', 'Floating Diner', 'crowd', 'The cook', 'waiter_f', 'Fish soup and old stories.', ('Gossip', 5), 1.1, 'Diner regular', 'fisherman', ['magikarp']),
        ]),
        town('ula-ula', "Mount Lanakila", 460, 40, ('ice', 'rock'), [
            T('lanakila-league', 'The League Lift', 'site', 'The lift crew', 'snow_worker', 'The new Pokémon League sits on the summit.', ('Bored', 4), 1.5, 'Lift crew', 'snow-worker', ['vanillish', 'sneasel'], 2),
            T('lanakila-trail', 'Lanakila Trail', 'route', 'Snow climbers', 'snow_worker_f', 'Snow on a tropical island. Climbers love it.', None, 1.2, 'Climber', 'hiker', ['snorunt', 'crabominable']),
            T('observatory', 'Hokulani Observatory', 'site', 'The astronomer', 'scientist_m', 'He looks at the stars. Also at the Ultra Wormholes.', ('Distracted', 6), 1.4, 'Assistant', 'psychic', ['minior', 'magneton'], 1),
        ]),
    ],
    routes=[['iki', 'hauoli'], ['hauoli', 'heahea'], ['heahea', 'konikoni'], ['heahea', 'paniola'], ['heahea', 'malie'], ['malie', 'po'], ['po', 'ula-ula'],
            ['malie', 'aether'], ['iki', 'paniola']],
    water=[['hauoli', 'konikoni'], ['malie', 'seafolk'], ['aether', 'seafolk'], ['heahea', 'aether']],
    pools=dict(catch=['pikipek', 'yungoos', 'grubbin', 'crabrawler', 'oricorio', 'cutiefly', 'rockruff', 'wishiwashi', 'mareanie', 'mudbray', 'dewpider',
                      'fomantis', 'morelull', 'salandit', 'stufful', 'bounsweet', 'comfey', 'oranguru', 'passimian', 'wimpod', 'sandygast', 'pyukumuku',
                      'minior', 'komala', 'turtonator', 'togedemaru', 'mimikyu', 'bruxish', 'drampa', 'rattata-alola', 'meowth-alola', 'grimer-alola'],
               steal=['jangmo-o', 'mimikyu', 'rockruff', 'type-null', 'cosmog', 'drampa', 'turtonator', 'comfey', 'dhelmise', 'vulpix-alola', 'sandshrew-alola',
                      'litten', 'popplio', 'rowlet', 'eevee', 'larvitar']),
    rivals={'skull-aether': [('shady-house-hq', 'Shady House (Po Town)', 'po', True), ('aether-lab-floor', 'Aether Lab Floor', 'aether'),
                             ('aether-dock-watch', 'Aether Dock Watch', 'aether'), ('konikoni-tag', 'Konikoni Tag Wall', 'konikoni'),
                             ('heahea-backroom', 'Heahea Back Room', 'heahea'), ('malie-crew', 'Malie Garden Crew', 'malie'), ('hauoli-corner', "Hau'oli Corner", 'hauoli')]},
    gyms=[
        gym('melemele-trial', 'iki', 'Ilima', 'ilima', 'normal', 'Normalium Z', ['yungoos', 'smeargle', 'gumshoos'], 1, [('Youngster Kai', 'youngster', ['pikipek'])]),
        gym('melemele-kahuna', 'iki', 'Hala', 'hala', 'fighting', 'Fightinium Z', ['mankey', 'makuhita', 'crabrawler'], 1, [('Black Belt Kenji', 'black-belt', ['machop'])]),
        gym('akala-trial', 'heahea', 'Lana', 'lana', 'water', 'Waterium Z', ['wishiwashi', 'araquanid'], 2, [('Fisherman Kaipo', 'fisherman', ['dewpider'])]),
        gym('akala-kahuna', 'konikoni', 'Olivia', 'olivia', 'rock', 'Rockium Z', ['nosepass', 'boldore', 'lycanroc'], 2, [('Hiker Kelvin', 'hiker', ['geodude'])]),
        gym('ulaula-trial', 'malie', 'Sophocles', 'sophocles', 'electric', 'Electrium Z', ['togedemaru', 'magneton', 'vikavolt'], 3, [('Guitarist Rex', 'guitarist', ['charjabug'])]),
        gym('ulaula-kahuna', 'po', 'Nanu', 'nanu', 'dark', 'Darkinium Z', ['sableye', 'krokorok', 'persian'], 3, [('Veteran Thom', 'veteran', ['murkrow'])]),
        gym('poni-trial', 'seafolk', 'Mina', 'mina', 'fairy', 'Fairium Z', ['granbull', 'shiinotic', 'ribombee'], 4, [('Fairy Tale Girl Lani', 'fairy-tale-girl', ['comfey'])]),
        gym('poni-kahuna', 'seafolk', 'Hapu', 'hapu', 'ground', 'Groundium Z', ['dugtrio', 'gastrodon', 'flygon', 'mudsdale'], 4, [('Ranger Leilani', 'ranger', ['mudbray'])]),
    ],
    business=[
        biz('hauoli-mall', "Hau'oli Shopping Mall", 15000, 600, True, ('regard', 1), "Regard +1 in Hau'oli each week."),
        biz('tide-song-hotel', 'Tide Song Hotel', 30000, 800, True, ('income', 400), 'Rich guests pay ₽400 more a week.', rival=True),
        biz('konikoni-market', 'Konikoni Market', 9000, 350, False, ('clean', 150), 'Cash stalls: ₽150 a week comes back clean.'),
        biz('malie-garden', 'Malie Garden', 8000, 250, True, ('heroDown', 1), 'The Hero stops for tea. Every time.'),
        biz('royal-avenue', 'Royal Avenue', 20000, 500, False, ('clean', 200), 'Battle Royal bets wash ₽200 a week.', rival=True),
        biz('seafolk-diner', 'Floating Diner', 4500, 180, True, ('heatDown', 1), 'Nobody talks on a boat: Heat −1 in Seafolk each week.'),
        biz('po-mart', 'Po Town Mart', 4500, 180, True, ('items', 2, 'potion'), '2 Potions a week, if you knock.'),
        biz('paniola-ranch', 'Paniola Ranch', 6000, 220, True, ('items', 2, 'moomoo-milk'), '2 bottles of Moomoo Milk a week.'),
    ],
    pillars=['tide-song-hotel', 'royal-avenue'],
    hero=dict(path=['iki', 'hauoli', 'heahea', 'paniola', 'konikoni', 'malie', 'po', 'seafolk', 'ula-ula'],
              allies=[ally('hala', 'Hala', 'hala', 'crabominable'), ally('lana', 'Lana', 'lana', 'araquanid'), ally('olivia', 'Olivia', 'olivia', 'lycanroc'),
                      ally('sophocles', 'Sophocles', 'sophocles', 'vikavolt'), ally('nanu', 'Nanu', 'nanu', 'persian'), ally('hapu', 'Hapu', 'hapu', 'mudsdale'),
                      ally('kukui', 'Kukui', 'kukui', 'incineroar', True)],
              mentor='Professor Kukui', parent="The Hero's mother", sidekick='Hau, from Iki Town',
              homes={'tapu-koko': ('iki', 'the Ruins of Conflict'), 'tapu-lele': ('heahea', 'the Ruins of Life'), 'tapu-bulu': ('malie', 'the Ruins of Abundance'),
                     'tapu-fini': ('seafolk', 'the Ruins of Hope')}),
    league=dict(elite=[who('molayne', 'Molayne', ['klefki', 'bisharp', 'magnezone', 'metagross', 'dugtrio'], 2), who('olivia-e4', 'Olivia', ['relicanth', 'carbink', 'golem', 'probopass', 'lycanroc'], 3),
                       who('acerola', 'Acerola', ['sableye', 'drifblim', 'dhelmise', 'froslass', 'palossand'], 4), who('kahili', 'Kahili', ['skarmory', 'crobat', 'oricorio', 'mandibuzz', 'toucannon'], 5)],
                champion=who('kukui', 'Kukui', ['lycanroc', 'ninetales', 'braviary', 'magnezone', 'snorlax', 'incineroar'], 6), standIn={}),
    lab=['type-null', 'cosmog', 'porygon', 'jangmo-o', 'eevee'],
    desk=dict(name='Alola', rivals=['Team Skull', 'the Aether Foundation'], badges=[('Normalium', 'Iki Town', '#d8d0c0'), ('Fightinium', 'Iki Town', '#c86a3a'),
                                                                                     ('Waterium', 'Heahea City', '#4fa3ff'), ('Rockium', 'Konikoni City', '#a87a4a'),
                                                                                     ('Electrium', 'Malie City', '#ffd23f'), ('Darkinium', 'Po Town', '#4a3a5a'),
                                                                                     ('Fairium', 'Seafolk Village', '#e88ab0'), ('Groundium', 'Seafolk Village', '#c8a060')]),
    places={'iki': 'iki', 'mahalo': 'iki', 'ruins of conflict': 'iki', "hau'oli": 'hauoli', 'hauoli': 'hauoli', 'ten carat': 'hauoli', 'melemele': 'hauoli',
            'verdant cavern': 'hauoli', 'kala': 'hauoli', 'heahea': 'heahea', 'tide song': 'heahea', 'dimensional': 'heahea', 'ruins of life': 'heahea',
            'konikoni': 'konikoni', 'memorial hill': 'konikoni', 'diglett': 'konikoni', 'paniola': 'paniola', 'royal avenue': 'paniola', 'brooklet': 'paniola',
            'wela': 'paniola', 'lush jungle': 'paniola', 'battle royal': 'paniola', 'malie': 'malie', 'hokulani': 'ula-ula', 'observatory': 'ula-ula',
            'thrifty': 'malie', 'ruins of abundance': 'malie', 'po town': 'po', 'shady house': 'po', 'tapu village': 'po', 'haina': 'po', 'aether': 'aether',
            'seafolk': 'seafolk', 'poni': 'seafolk', 'vast poni': 'seafolk', 'altar': 'seafolk', 'exeggutor island': 'seafolk', 'ruins of hope': 'seafolk',
            'battle tree': 'seafolk', 'lanakila': 'ula-ula', 'pokémon league': 'ula-ula', 'mount lanakila': 'ula-ula', 'ula': 'ula-ula', 'ultra': 'aether',
            'hano': 'heahea', 'akala': 'heahea', 'route 8': 'heahea', 'route 16': 'malie', 'blush mountain': 'ula-ula', 'route 13': 'po'},
)

# ======================================================================= GALAR
R['galar'] = dict(
    hq='hulbury', label='GALAR', warehouse='Hulbury',
    arrive=[
        'Hulbury: fish, chips, gulls, and a lighthouse with a Gym inside it. The new warehouse is a fish-salting shed.',
        '{brought} pinches their nose. "Boss. Boss. It\'s worse than the first one."',
        'Every screen in the harbour shows the same smiling Chairman, promising Galar endless energy. The screen under the pier is broken; nobody fixes it.',
    ],
    districts=[
        town('postwick', 'Postwick', 40, 300, ('normal', 'grass'), [
            T('postwick-farm', 'Postwick Farms', 'site', 'The farmers', 'worker_f', 'Wooloo everywhere. They stop traffic.', ('Gullible', 5), 1.1, 'Farmhand', 'worker', ['wooloo', 'skwovet']),
            T('slumbering-weald', 'Slumbering Weald', 'route', 'Nobody', 'ranger_m', 'A misty wood the locals don\'t enter.', ('Superstitious', 6), 1.2, 'Lost hiker', 'hiker', ['rookidee', 'skwovet']),
            T('wedgehurst-lab', "Magnolia's Lab (Wedgehurst)", 'site', 'Sonia', 'scientist_f', 'Grandmother\'s lab, granddaughter\'s research.', ('Distracted', 6), 1.3, 'Lab aide', 'youngster', ['yamper', 'nickit']),
        ]),
        town('motostoke', 'Motostoke', 140, 196, ('fire', 'steel'), [
            T('motostoke-stadium', 'Motostoke Stadium', 'crowd', 'The stadium crowd', 'linebacker', 'Fans in the stands and bookies on the stairs.', ('Greedy', 5), 1.5, 'Stadium guard', 'veteran', ['rolycoly', 'growlithe']),
            T('budew-drop', 'Budew Drop Inn', 'crowd', 'The landlady', 'waiter_f', 'Every gym challenger sleeps here once.', ('Gossip', 5), 1.2, 'Barman', 'veteran', ['mudbray']),
            T('motostoke-riverbank', 'Motostoke Riverbank', 'route', 'Bargemen', 'worker_f', 'Coal barges and quiet deals.', None, 1.1, 'Bargeman', 'worker', ['chewtle', 'drednaw']),
        ], w=124),
        town('hulbury', 'Hulbury', 260, 300, ('water', 'normal'), [
            T('hulbury-market', 'Hulbury Market', 'crowd', 'The fishmongers', 'clerk_f', 'Fish, chips and what fell off a boat.', ('Greedy', 5), 1.3, 'Fishmonger', 'fisherman', ['chewtle', 'arrokuda']),
            T('hulbury-harbour', 'Hulbury Harbour', 'dock', 'The harbour master', 'pilot', 'Every ship in Galar docks here at least once.', ('Stubborn', -4), 1.4, 'Dock hand', 'worker', ['wingull', 'arrokuda']),
            T('seafood-restaurant', 'Captain\'s Seafood', 'shop', 'The head chef', 'waiter_m', 'Michelin-rated chips. The chef battles too.', ('Proud', -4), 1.4, 'Head chef', 'veteran', ['chewtle', 'wishiwashi']),
        ], control=10),
        town('turffield', 'Turffield', 40, 196, ('grass', 'rock'), [
            T('turffield-geoglyph', 'The Geoglyph', 'crowd', 'The ruin watchers', 'ruin_maniac', 'A huge picture on the hillside. Tourists come in coaches.', ('Superstitious', 5), 1.2, 'Ruin watcher', 'psychic', ['sigilyph']),
            T('turffield-farm', 'Turffield Farms', 'site', 'The farm co-op', 'worker_f', 'They grow half of Galar\'s food.', ('Stubborn', -4), 1.2, 'Farmhand', 'worker', ['gossifleur', 'wooloo']),
            T('galar-mine', 'Galar Mine', 'cave', 'The miners', 'worker_f', 'Macro Cosmos coal, dug by hand.', ('Bored', 5), 1.3, 'Miner', 'hiker', ['rolycoly', 'roggenrola']),
        ]),
        town('stow', 'Stow-on-Side', 140, 70, ('fighting', 'ghost'), [
            T('stow-bazaar', 'The Bazaar', 'shop', 'The stall holders', 'clerk_f', 'Everything is for sale. Everything.', ('Greedy', 6), 1.3, 'Stall tough', 'roughneck', ['sinistea', 'impidimp']),
            T('stow-mural', 'The Old Mural', 'site', 'The mural keeper', 'veteran_m', 'An ancient painting a Champion\'s rival once broke open.', ('Pious', -6), 1.3, 'Keeper', 'hex-maniac', ['sinistea', 'golett']),
            T('glimwood-tangle', 'Glimwood Tangle', 'route', 'Mushroom pickers', 'ranger_f', 'Glowing mushrooms and very small, very mean Pokémon.', None, 1.2, 'Picker', 'picnicker', ['impidimp', 'hatenna']),
        ]),
        town('ballonlea', 'Ballonlea', 40, 40, ('fairy', 'grass'), [
            T('ballonlea-forest', 'Ballonlea Woods', 'route', 'The woodsfolk', 'parasol_lady', 'A town under glowing trees.', ('Watchful', -4), 1.2, 'Woodsman', 'fairy-tale-girl', ['morelull', 'impidimp']),
            T('ballonlea-shop', 'The Glow Shop', 'shop', 'The shopkeeper', 'clerk', 'Sells lamps in a town that doesn\'t need them.', ('Timid', 5), 1, "The keeper's son", 'youngster', ['milcery']),
            T('ballonlea-stadium', 'Ballonlea Stadium', 'crowd', 'The tea ladies', 'veteran_f', 'Opal\'s fans. They bring cake and opinions.', ('Proud', -4), 1.3, 'Tea lady', 'fairy-tale-girl', ['spritzee', 'swirlix']),
        ]),
        town('hammerlocke', 'Hammerlocke', 260, 170, ('dragon', 'steel'), [
            T('hammerlocke-vault', 'The Vault', 'site', 'The vault guard', 'veteran_m', 'Old treasures behind the stadium, guarded by old men.', ('Steady', -6), 1.6, 'Vault guard', 'veteran', ['duraludon', 'bronzong'], 1),
            T('energy-plant', 'Hammerlocke Energy Plant', 'site', 'The plant crew', 'scientist_m', 'Under the castle, the power plant of all Galar.', ('Loyal', -6), 1.6, 'Plant crew', 'worker', ['rolycoly', 'magneton'], 2),
            T('hammerlocke-station', 'Hammerlocke Police', 'police', 'The constable', 'police', 'Polite, thorough, and very hard to bribe.', ('Sharp', -10), 1, 'Constable', 'veteran', ['growlithe', 'boltund'], 1),
        ], police=True, rival=60, w=130, note='Macro Cosmos'),
        town('circhester', 'Circhester', 400, 70, ('ice', 'rock'), [
            T('circhester-baths', 'The Hot Baths', 'crowd', 'The bath keeper', 'beauty_2', 'The old Roman baths. Everyone talks in the water.', ('Gossip', 6), 1.3, 'Bath attendant', 'aroma-lady', ['eiscue']),
            T('bob-diner', "Bob's Your Uncle", 'crowd', 'Bob', 'waiter_m', 'A diner shaped like Snorlax. Fans eat here after matches.', ('Gullible', 5), 1.2, 'Diner regular', 'roughneck', ['snom']),
            T('route-8-galar', 'Route 8 Ruins', 'route', 'Climbers', 'snow_worker', 'Steamy ruins, steep ladders.', None, 1.2, 'Climber', 'hiker', ['sneasel', 'onix']),
        ], rival=25, note='Macro Cosmos'),
        town('spikemuth', 'Spikemuth', 400, 196, ('dark', 'poison'), [
            T('spikemuth-alley', 'The Alley Stage', 'crowd', 'The Team Yell fans', 'hooligans', 'Piers plays here. Everyone shouts along.', ('Hothead', 4), 1.3, 'Yell fan', 'guitarist', ['zigzagoon', 'scraggy']),
            T('spikemuth-shop', 'Shuttered Shop', 'shop', 'The last shopkeeper', 'clerk', 'Everyone else closed. He stays out of spite.', ('Stubborn', -4), 1.1, 'Shopkeeper', 'roughneck', ['nickit']),
            T('spikemuth-gate', 'The Gate', 'street', 'Team Yell', 'hooligans', 'They block the gate for fun, and for Marnie.', ('Loyal', -6), 1.2, 'Yell member', 'roughneck', ['linoone', 'obstagoon']),
        ]),
        town('wyndon', 'Wyndon', 520, 196, ('normal', 'psychic'), [
            T('rose-tower', 'Rose Tower', 'site', 'Macro Cosmos security', 'veteran_f', 'The Chairman\'s glass tower. Every floor has a guard.', ('Loyal', -8), 1.8, 'Security', 'ace-trainer', ['copperajah', 'klinklang'], 2),
            T('wyndon-stadium', 'Wyndon Stadium', 'crowd', 'The Champion Cup crowd', 'linebacker', 'Ninety thousand seats and a lot of betting slips.', ('Greedy', 5), 1.6, 'Stadium guard', 'veteran', ['corviknight']),
            T('wyndon-hotel', 'Rose of the Rondelands', 'shop', 'The hotel manager', 'rich_m', 'The best hotel in Galar, owned by guess who.', ('Snob', -4), 1.6, 'Hotel guard', 'veteran', ['mr-rime']),
        ], rival=55, w=124, note='Macro Cosmos'),
    ],
    routes=[['postwick', 'motostoke'], ['motostoke', 'turffield'], ['motostoke', 'hulbury'], ['motostoke', 'hammerlocke'], ['hammerlocke', 'stow'],
            ['stow', 'ballonlea'], ['hammerlocke', 'circhester'], ['circhester', 'spikemuth'], ['spikemuth', 'wyndon'], ['hammerlocke', 'wyndon'], ['postwick', 'turffield']],
    water=[['hulbury', 'spikemuth']],
    pools=dict(catch=['skwovet', 'rookidee', 'blipbug', 'nickit', 'gossifleur', 'wooloo', 'chewtle', 'yamper', 'rolycoly', 'applin', 'silicobra', 'cramorant',
                      'arrokuda', 'toxel', 'sizzlipede', 'clobbopus', 'sinistea', 'hatenna', 'impidimp', 'milcery', 'falinks', 'pincurchin', 'snom',
                      'stonjourner', 'eiscue', 'indeedee', 'morpeko', 'cufant', 'zigzagoon-galar', 'meowth-galar', 'ponyta-galar', 'farfetchd-galar'],
               steal=['dreepy', 'duraludon', 'applin', 'toxel', 'falinks', 'stonjourner', 'eiscue', 'morpeko', 'ponyta-galar', 'darumaka-galar',
                      'grookey', 'scorbunny', 'sobble', 'eevee', 'larvitar', 'dracozolt']),
    rivals={'macro-cosmos': [('rose-tower-hq', 'Rose Tower (Wyndon)', 'wyndon', True), ('energy-plant-hold', 'Energy Plant Hold', 'hammerlocke'),
                             ('galar-mine-office', 'Galar Mine Office', 'turffield'), ('motostoke-rail', 'Motostoke Rail Yard', 'motostoke'),
                             ('circhester-office', 'Circhester Branch Office', 'circhester'), ('hulbury-shipping', 'Hulbury Shipping Desk', 'hulbury'),
                             ('wyndon-monorail', 'Wyndon Monorail', 'wyndon')]},
    gyms=[
        gym('turffield-gym', 'turffield', 'Milo', 'milo', 'grass', 'Grass', ['gossifleur', 'eldegoss'], 1, [('Gym Trainer Hayden', 'picnicker', ['gossifleur'])]),
        gym('hulbury-gym', 'hulbury', 'Nessa', 'nessa', 'water', 'Water', ['goldeen', 'arrokuda', 'drednaw'], 1, [('Swimmer Olivia', 'swimmer', ['chewtle'])]),
        gym('motostoke-gym', 'motostoke', 'Kabu', 'kabu', 'fire', 'Fire', ['ninetales', 'arcanine', 'centiskorch'], 2, [('Gym Trainer Belle', 'firebreather', ['sizzlipede'])]),
        gym('stow-gym', 'stow', 'Bea', 'bea', 'fighting', 'Fighting', ['hitmontop', 'pangoro', 'sirfetchd', 'machamp'], 2, [('Black Belt Ken', 'black-belt', ['clobbopus'])]),
        gym('ballonlea-gym', 'ballonlea', 'Opal', 'opal', 'fairy', 'Fairy', ['weezing', 'mawile', 'togekiss', 'alcremie'], 3, [('Gym Trainer Bianca', 'fairy-tale-girl', ['milcery'])]),
        gym('circhester-gym', 'circhester', 'Gordie', 'gordie', 'rock', 'Rock', ['barbaracle', 'shuckle', 'stonjourner', 'coalossal'], 3, [('Hiker Zack', 'hiker', ['rolycoly'])]),
        gym('spikemuth-gym', 'spikemuth', 'Piers', 'piers', 'dark', 'Dark', ['scrafty', 'malamar', 'skuntank', 'obstagoon'], 4, [('Guitarist Yell', 'guitarist', ['nickit'])]),
        gym('hammerlocke-gym', 'hammerlocke', 'Raihan', 'raihan', 'dragon', 'Dragon', ['gigalith', 'flygon', 'sandaconda', 'duraludon'], 4, [('Ace Trainer Ryder', 'ace-trainer', ['applin'])]),
    ],
    business=[
        biz('ballonlea-shop', 'The Glow Shop', 5000, 200, True, ('items', 2, 'potion'), '2 Potions a week.'),
        biz('seafood-restaurant', "Captain's Seafood", 9000, 300, True, ('regard', 1), 'Free chips: Regard +1 in Hulbury each week.'),
        biz('hulbury-market', 'Hulbury Market', 9000, 350, False, ('clean', 150), 'Cash stalls: ₽150 a week comes back clean.'),
        biz('wyndon-hotel', 'Rose of the Rondelands', 30000, 800, True, ('income', 400), 'The Chairman\'s hotel pays you ₽400 more a week.', rival=True),
        biz('motostoke-stadium', 'Motostoke Stadium', 20000, 500, False, ('clean', 200), 'Match-day bets wash ₽200 a week.', rival=True),
        biz('stow-bazaar', 'The Bazaar', 4500, 180, True, ('odds', 5), 'Market gossip: +5% on jobs in Stow-on-Side.'),
        biz('bob-diner', "Bob's Your Uncle", 4500, 180, True, ('heroDown', 1), 'The Hero stops for a burger.'),
        biz('spikemuth-shop', 'Shuttered Shop', 4000, 150, True, ('heatDown', 1), 'Spikemuth looks after its own: Heat −1 there each week.'),
    ],
    pillars=['wyndon-hotel', 'motostoke-stadium'],
    hero=dict(path=['postwick', 'motostoke', 'turffield', 'hulbury', 'stow', 'ballonlea', 'circhester', 'spikemuth', 'hammerlocke'],
              allies=[ally('milo', 'Milo', 'milo', 'eldegoss'), ally('nessa', 'Nessa', 'nessa', 'drednaw'), ally('kabu', 'Kabu', 'kabu', 'centiskorch'),
                      ally('bea', 'Bea', 'bea', 'machamp'), ally('piers', 'Piers', 'piers', 'obstagoon'), ally('raihan', 'Raihan', 'raihan', 'duraludon'),
                      ally('leon', 'Leon', 'leon-masters', 'charizard', True)],
              mentor='Professor Magnolia', parent="The Hero's mother", sidekick='Hop, from Postwick',
              homes={'zacian': ('postwick', 'the Slumbering Weald'), 'zamazenta': ('postwick', 'the Slumbering Weald')}),
    league=dict(elite=[who('marnie', 'Marnie', ['liepard', 'toxicroak', 'scrafty', 'morpeko', 'grimmsnarl'], 2), who('hop', 'Hop', ['dubwool', 'corviknight', 'pincurchin', 'snorlax', 'rillaboom'], 3),
                       who('bede', 'Bede', ['mawile', 'gardevoir', 'rapidash', 'hatterene'], 4), who('raihan-e4', 'Raihan', ['flygon', 'sandaconda', 'gigalith', 'duraludon'], 5)],
                champion=who('leon', 'Leon', ['aegislash', 'dragapult', 'haxorus', 'seismitoad', 'mr-rime', 'charizard'], 6), standIn={}),
    lab=['dreepy', 'duraludon', 'dracozolt', 'arctozolt', 'porygon'],
    desk=dict(name='Galar', rivals=['Macro Cosmos'], badges=[('Grass', 'Turffield', '#5aa84a'), ('Water', 'Hulbury', '#4fa3ff'), ('Fire', 'Motostoke', '#ff5a3a'),
                                                            ('Fighting', 'Stow-on-Side', '#c86a3a'), ('Fairy', 'Ballonlea', '#e88ab0'), ('Rock', 'Circhester', '#a87a4a'),
                                                            ('Dark', 'Spikemuth', '#4a3a5a'), ('Dragon', 'Hammerlocke', '#4a6ab8')]),
    places={'postwick': 'postwick', 'wedgehurst': 'postwick', 'slumbering': 'postwick', 'motostoke': 'motostoke', 'wild area': 'motostoke',
            'budew': 'motostoke', 'galar mine no. 2': 'hulbury', 'hulbury': 'hulbury', 'turffield': 'turffield', 'galar mine': 'turffield',
            'stow': 'stow', 'glimwood': 'ballonlea', 'ballonlea': 'ballonlea', 'hammerlocke': 'hammerlocke', 'energy plant': 'hammerlocke',
            'vault': 'hammerlocke', 'circhester': 'circhester', 'route 8': 'circhester', 'spikemuth': 'spikemuth', 'wyndon': 'wyndon', 'rose tower': 'wyndon',
            'battle tower': 'wyndon', 'isle of armor': 'hulbury', 'crown tundra': 'circhester', 'master dojo': 'hulbury', 'freezington': 'circhester',
            'dyna tree': 'circhester', 'max lair': 'circhester', 'route 9': 'spikemuth', 'route 10': 'wyndon', 'lake of outrage': 'hammerlocke',
            'bridge field': 'motostoke', 'dusty bowl': 'hammerlocke', 'stadium': 'wyndon', 'league': 'wyndon', 'macro cosmos': 'wyndon', 'route 2': 'postwick',
            'route 5': 'turffield', 'route 6': 'stow', 'route 7': 'circhester', 'tunnel': 'circhester', 'slumbering weald': 'postwick'},
)

# ======================================================================= PALDEA
R['paldea'] = dict(
    hq='porto-marinada', label='PALDEA', warehouse='Porto Marinada',
    arrive=[
        'Porto Marinada: an auction every afternoon, and fishing boats painted every colour there is. The warehouse is behind the auction house.',
        '{brought} squints at the noise. "They\'re bidding on everything, Boss. Even the fish that got away."',
        'Somebody at the Academy has posted a notice: a "Treasure Hunt" for every student. Half the region is out on the roads, and nobody is watching the shops.',
    ],
    districts=[
        town('cabo-poco', 'Cabo Poco', 40, 300, ('normal', 'grass'), [
            T('poco-house', 'The Hilltop House', 'street', 'The neighbours', 'pokefan_f', 'A tiny town on a cape. Everyone knows the Champion\'s cousin.', ('Watchful', -4), 1, 'Neighbour', 'picnicker', ['lechonk']),
            T('poco-path', 'Poco Path', 'route', 'Trainers on the path', 'backpacker_m', 'The lighthouse at the end is always open.', None, 1, 'Youngster Ivan', 'youngster', ['lechonk', 'tarountula']),
            T('inlet-grotto', 'Inlet Grotto', 'cave', 'Nobody', 'ruin_maniac', 'A cave on the beach. Something big sleeps in it.', ('Superstitious', 6), 1.3, 'Beachcomber', 'hiker', ['wiglett', 'tarountula']),
        ]),
        town('mesagoza', 'Mesagoza', 200, 196, ('normal', 'psychic'), [
            T('naranja-academy', 'Naranja Academy', 'site', 'The vice principal', 'veteran_m', 'Five hundred students and one very tired head teacher.', ('Kind', 5), 1.6, 'Academy guard', 'veteran', ['farigiraf', 'pawmo'], 1),
            T('mesagoza-plaza', 'Mesagoza Plaza', 'crowd', 'The plaza crowd', 'interviewers', 'Cafés round a fountain, and every student\'s parents.', ('Gullible', 5), 1.4, 'Plaza guard', 'veteran', ['lechonk', 'pawmi']),
            T('mesagoza-station', 'Mesagoza Police', 'police', 'Officer Jenny', 'police', 'She knows every student by name.', ('Sharp', -10), 1, 'Officer', 'veteran', ['growlithe', 'maschiff'], 1),
        ], police=True, w=130),
        town('porto-marinada', 'Porto Marinada', 40, 120, ('water', 'normal'), [
            T('marinada-auction', 'The Auction House', 'site', 'The auctioneer', 'rich_m', 'Everything goes under the hammer, nothing has papers.', ('Greedy', 6), 1.5, 'Auction guard', 'veteran', ['wattrel', 'finizen']),
            T('marinada-docks', 'Marinada Docks', 'dock', 'The fishermen', 'scuba_diver_m', 'Boats of every colour, catches of every kind.', ('Stubborn', -4), 1.3, 'Fisherman', 'fisherman', ['finizen', 'wiglett']),
            T('marinada-market', 'Fish Market', 'shop', 'The fishmonger', 'clerk_f', 'Fresh in at dawn, sold by noon.', ('Timid', 5), 1.1, 'Fishmonger', 'fisherman', ['bombirdier']),
        ], control=10),
        town('levincia', 'Levincia', 360, 70, ('electric', 'normal'), [
            T('levincia-studio', 'Iono\'s Studio', 'site', 'The stream crew', 'interviewers', 'Every move is filmed. Every film gets a million views.', ('Greedy', 5), 1.6, 'Crew guard', 'guitarist', ['bellibolt', 'pawmo'], 1),
            T('levincia-mall', 'Levincia Mall', 'shop', 'The mall manager', 'rich_f', 'Neon signs and a tower of screens.', ('Greedy', 4), 1.5, 'Mall guard', 'veteran', ['wattrel']),
            T('levincia-shore', 'Levincia Seafront', 'route', 'Beach crowds', 'swimmer_m', 'Neon by night, sand by day.', None, 1.1, 'Swimmer Sami', 'swimmer', ['finizen', 'wingull']),
        ]),
        town('cascarrafa', 'Cascarrafa', 200, 300, ('water', 'ground'), [
            T('cascarrafa-auction', 'Cascarrafa Market', 'shop', 'The stall owners', 'clerk_f', 'A city on a waterfall, a market on every step.', ('Greedy', 5), 1.4, 'Market tough', 'roughneck', ['sandaconda', 'wattrel']),
            T('asado-desert', 'Asado Desert', 'route', 'Desert guides', 'backpacker_m', 'Dunes, ruins and missing Trainers.', None, 1.2, 'Guide', 'hiker', ['sandile', 'silicobra']),
            T('cascarrafa-falls', 'The Falls', 'crowd', 'The tourists', 'young_couple', 'Everyone takes a picture at the falls.', ('Gullible', 5), 1.2, 'Tourist', 'picnicker', ['squawkabilly']),
        ]),
        town('medali', 'Medali', 320, 196, ('normal', 'ground'), [
            T('medali-restaurant', 'Treasure Eatery', 'shop', 'The cook', 'waiter_m', 'The best food in Paldea. The Gym Leader works here.', ('Proud', -4), 1.4, 'Cook', 'veteran', ['dudunsparce', 'lechonk']),
            T('medali-square', 'Medali Square', 'crowd', 'The diners', 'pokefan_m', 'A town that eats lunch for three hours.', ('Gossip', 5), 1.1, 'Diner', 'picnicker', ['tandemaus']),
            T('east-province', 'Route East', 'route', 'Trainers on the route', 'backpacker_f', 'Long roads between towns.', None, 1.1, 'Ace Trainer Rosa', 'ace-trainer', ['tauros', 'mudbray']),
        ]),
        town('alfornada', 'Alfornada', 360, 300, ('psychic', 'fairy'), [
            T('alfornada-cavern', 'Alfornada Cavern', 'cave', 'The cave keepers', 'psychic_f', 'Quiet caves, quiet people.', ('Pious', -6), 1.3, 'Keeper', 'psychic', ['espathra', 'gothita']),
            T('alfornada-mart', 'Alfornada Mart', 'shop', 'The Mart clerk', 'clerk', 'Sells Moon Stones to people who already have three.', ('Timid', 5), 1.1, "The clerk's sister", 'lass', ['flittle']),
            T('alfornada-square', 'Calm Square', 'crowd', 'The meditators', 'parasol_lady', 'Everyone is calm. It\'s unnerving.', ('Watchful', -4), 1.2, 'Meditator', 'psychic', ['indeedee']),
        ]),
        town('montenevera', 'Montenevera', 520, 120, ('ghost', 'ice'), [
            T('montenevera-stage', 'The Snow Stage', 'crowd', 'The fans', 'musician', 'A rapper Gym Leader and a frozen crowd.', ('Hothead', 4), 1.3, 'Fan', 'guitarist', ['greavard', 'shroodle']),
            T('glaseado-mountain', 'Glaseado Mountain', 'route', 'Ski crews', 'snow_worker', 'The biggest mountain in Paldea, and the coldest.', None, 1.2, 'Skier', 'snow-worker', ['cetoddle', 'snom']),
            T('montenevera-mart', 'Montenevera Mart', 'shop', 'The Mart clerk', 'clerk', 'Hot chocolate and Ice Heals.', ('Timid', 5), 1.1, "The clerk's cousin", 'snow-worker', ['frigibax']),
        ]),
        town('area-zero-gate', 'Area Zero Gate', 360, 196, ('dragon', 'psychic'), [
            T('zero-lab', 'The Zero Lab', 'site', 'The research machine', 'scientist_m', 'Doors that open only for the right voice.', ('Steady', -8), 1.8, 'Research guard', 'ace-trainer', ['great-tusk', 'iron-treads'], 3),
            T('great-crater', 'Crater Rim', 'route', 'Expedition crews', 'ranger_m', 'The edge of the Great Crater. Nobody goes down.', None, 1.4, 'Expedition hand', 'ranger', ['glimmet', 'frigibax'], 1),
            T('zero-gate-camp', 'Gate Camp', 'crowd', 'The camp crew', 'worker_f', 'Tents at the Gate, waiting for the Academy\'s say-so.', ('Bored', 5), 1.3, 'Camp hand', 'worker', ['orthworm']),
        ], rival=60, w=124, note='Area Zero'),
        town('zapapico', 'Zapapico', 520, 40, ('rock', 'flying'), [
            T('zapapico-quarry', 'The Quarry', 'cave', 'The quarry crew', 'worker_f', 'Cliffs, dust and Nacli everywhere.', ('Bored', 5), 1.3, 'Quarryman', 'worker', ['nacli', 'klawf']),
            T('zapapico-mart', 'Zapapico Mart', 'shop', 'The Mart clerk', 'clerk', 'Sells rope and helmets to climbers.', ('Timid', 5), 1.1, "The clerk's son", 'hiker', ['rookidee']),
            T('zapapico-peak', 'Zapapico Peak', 'route', 'Climbers', 'snow_worker_f', 'A town on a cliff, joined by rope bridges.', None, 1.1, 'Climber', 'hiker', ['flamigo', 'bombirdier']),
        ], rival=20, note='Area Zero'),
    ],
    routes=[['cabo-poco', 'mesagoza'], ['mesagoza', 'porto-marinada'], ['mesagoza', 'cascarrafa'], ['mesagoza', 'medali'], ['medali', 'levincia'],
            ['medali', 'alfornada'], ['medali', 'area-zero-gate'], ['levincia', 'montenevera'], ['montenevera', 'zapapico'], ['cascarrafa', 'alfornada']],
    water=[['porto-marinada', 'cabo-poco'], ['levincia', 'zapapico']],
    pools=dict(catch=['lechonk', 'tarountula', 'nymble', 'pawmi', 'tandemaus', 'fidough', 'smoliv', 'squawkabilly', 'nacli', 'charcadet', 'tadbulb', 'wattrel',
                      'maschiff', 'shroodle', 'bramblin', 'toedscool', 'klawf', 'capsakid', 'rellor', 'flittle', 'tinkatink', 'wiglett', 'bombirdier',
                      'finizen', 'varoom', 'cyclizar', 'orthworm', 'glimmet', 'greavard', 'flamigo', 'cetoddle', 'veluza', 'dondozo', 'tatsugiri'],
               steal=['frigibax', 'tinkatink', 'charcadet', 'gimmighoul', 'cyclizar', 'tatsugiri', 'flamigo', 'veluza', 'sprigatito', 'fuecoco', 'quaxly',
                      'eevee', 'larvitar', 'dreepy', 'goomy', 'deino']),
    rivals={'area-zero': [('zero-lab-site', 'The Zero Lab (Area Zero)', 'area-zero-gate', True), ('crater-camp', 'Crater Rim Camp', 'area-zero-gate'),
                          ('zapapico-relay', 'Zapapico Relay', 'zapapico'), ('montenevera-relay', 'Montenevera Relay', 'montenevera'),
                          ('levincia-feed', 'Levincia Feed', 'levincia'), ('cascarrafa-relay', 'Cascarrafa Relay', 'cascarrafa'), ('medali-relay', 'Medali Relay', 'medali')]},
    gyms=[
        gym('cortondo-gym', 'cabo-poco', 'Katy', 'katy', 'bug', 'Bug', ['nymble', 'tarountula', 'teddiursa'], 1, [('Gym Trainer Jo', 'bug-catcher', ['nymble'])]),
        gym('artazon-gym', 'mesagoza', 'Brassius', 'brassius', 'grass', 'Grass', ['petilil', 'smoliv', 'sudowoodo'], 1, [('Gym Trainer Tas', 'aroma-lady', ['smoliv'])]),
        gym('levincia-gym', 'levincia', 'Iono', 'iono', 'electric', 'Electric', ['wattrel', 'bellibolt', 'luxio', 'mismagius'], 2, [('Gym Trainer Nove', 'guitarist', ['tadbulb'])]),
        gym('cascarrafa-gym', 'cascarrafa', 'Kofu', 'kofu', 'water', 'Water', ['veluza', 'wugtrio', 'crabominable'], 2, [('Gym Trainer Hugo', 'fisherman', ['wiglett'])]),
        gym('medali-gym', 'medali', 'Larry', 'larry', 'normal', 'Normal', ['komala', 'dudunsparce', 'staraptor'], 3, [('Gym Trainer Clerk', 'worker', ['tandemaus'])]),
        gym('montenevera-gym', 'montenevera', 'Ryme', 'ryme', 'ghost', 'Ghost', ['banette', 'mimikyu', 'houndstone', 'toxtricity'], 3, [('Gym Trainer Tas', 'hex-maniac', ['greavard'])]),
        gym('alfornada-gym', 'alfornada', 'Tulip', 'tulip', 'psychic', 'Psychic', ['farigiraf', 'gardevoir', 'espathra', 'florges'], 4, [('Gym Trainer Emily', 'psychic', ['flittle'])]),
        gym('glaseado-gym', 'montenevera', 'Grusha', 'grusha', 'ice', 'Ice', ['frosmoth', 'beartic', 'cetitan', 'altaria'], 4, [('Skier Aidan', 'snow-worker', ['cetoddle'])]),
    ],
    business=[
        biz('marinada-market', 'Fish Market', 5000, 200, True, ('items', 2, 'potion'), '2 Potions a week.'),
        biz('marinada-auction', 'The Auction House', 20000, 500, False, ('clean', 200), 'Every lot washes a little: ₽200 a week comes back clean.', rival=True),
        biz('levincia-mall', 'Levincia Mall', 15000, 600, True, ('regard', 1), 'Regard +1 in Levincia each week.'),
        biz('levincia-studio', "Iono's Studio", 30000, 800, True, ('heroDown', 1), 'The Hero watches the stream. And the stream watches the Hero.', rival=True),
        biz('cascarrafa-auction', 'Cascarrafa Market', 9000, 350, False, ('clean', 150), 'Cash stalls: ₽150 a week comes back clean.'),
        biz('medali-restaurant', 'Treasure Eatery', 9000, 300, True, ('income', 300), 'The lunch crowd pays ₽300 a week.'),
        biz('zapapico-mart', 'Zapapico Mart', 4500, 180, True, ('odds', 5), 'Good rope: +5% on jobs in Zapapico.'),
        biz('montenevera-mart', 'Montenevera Mart', 4500, 180, True, ('heatDown', 1), 'Snowed in: Heat −1 in Montenevera each week.'),
    ],
    pillars=['levincia-studio', 'marinada-auction'],
    hero=dict(path=['cabo-poco', 'mesagoza', 'porto-marinada', 'cascarrafa', 'medali', 'levincia', 'alfornada', 'montenevera', 'area-zero-gate'],
              allies=[ally('katy', 'Katy', 'katy', 'teddiursa'), ally('iono', 'Iono', 'iono', 'bellibolt'), ally('kofu', 'Kofu', 'nemona-v', 'crabominable'),
                      ally('larry', 'Larry', 'ryuki', 'staraptor'), ally('tulip', 'Tulip', 'grusha', 'florges'), ally('grusha', 'Grusha', 'grusha', 'altaria'),
                      ally('geeta', 'Geeta', 'geeta', 'glimmora', True)],
              mentor='The Academy\'s Director, Clavell', parent="The Hero's mother", sidekick='Nemona, from Mesagoza',
              homes={'koraidon': ('area-zero-gate', 'the Great Crater'), 'miraidon': ('area-zero-gate', 'the Great Crater')}),
    league=dict(elite=[who('rika', 'Rika', ['whiscash', 'camerupt', 'donphan', 'dugtrio', 'clodsire'], 2), who('poppy', 'Poppy', ['copperajah', 'magnezone', 'bronzong', 'corviknight', 'tinkaton'], 3),
                       who('larry-e4', 'Larry', ['tropius', 'oricorio', 'altaria', 'staraptor', 'flamigo'], 4), who('hassel', 'Hassel', ['noivern', 'haxorus', 'dragalge', 'flapple', 'baxcalibur'], 5)],
                champion=who('geeta', 'Geeta', ['espathra', 'gogoat', 'veluza', 'avalugg', 'kingambit', 'glimmora'], 6), standIn={}),
    lab=['frigibax', 'gimmighoul', 'tinkatink', 'charcadet', 'porygon'],
    desk=dict(name='Paldea', rivals=['the Area Zero project'], badges=[('Bug', 'Cortondo', '#9ad83a'), ('Grass', 'Artazon', '#5aa84a'), ('Electric', 'Levincia', '#ffd23f'),
                                                                     ('Water', 'Cascarrafa', '#4fa3ff'), ('Normal', 'Medali', '#d8d0c0'), ('Ghost', 'Montenevera', '#7a6ab8'),
                                                                     ('Psychic', 'Alfornada', '#e070c0'), ('Ice', 'Glaseado', '#a8e0f8')]),
    places={'cabo poco': 'cabo-poco', 'poco path': 'cabo-poco', 'inlet grotto': 'cabo-poco', 'los platos': 'cabo-poco', 'cortondo': 'cabo-poco',
            'mesagoza': 'mesagoza', 'academy': 'mesagoza', 'naranja': 'mesagoza', 'uva': 'mesagoza', 'artazon': 'mesagoza', 'porto marinada': 'porto-marinada',
            'marinada': 'porto-marinada', 'levincia': 'levincia', 'cascarrafa': 'cascarrafa', 'asado': 'cascarrafa', 'medali': 'medali', 'alfornada': 'alfornada',
            'montenevera': 'montenevera', 'glaseado': 'montenevera', 'area zero': 'area-zero-gate', 'great crater': 'area-zero-gate', 'zero lab': 'area-zero-gate',
            'zapapico': 'zapapico', 'casseroya': 'zapapico', 'dalizapa': 'zapapico', 'tagtree': 'medali', 'pokémon league': 'mesagoza', 'league': 'mesagoza',
            'kitakami': 'montenevera', 'blueberry': 'levincia', 'terarium': 'levincia', 'south province': 'cabo-poco', 'east province': 'medali',
            'west province': 'cascarrafa', 'north province': 'zapapico', 'lighthouse': 'levincia', 'socarrat': 'cascarrafa', 'colonnade': 'medali',
            'tera': 'area-zero-gate', 'treasure': 'medali', 'ruins': 'cascarrafa'},
)


# ---------- the Holdings of each region (takeover.json rows left disabled 'needs D15') ----------

def place_district(region, place, places):
    p = place.lower()
    hits = sorted(((k, v) for k, v in places.items() if k in p), key=lambda kv: -len(kv[0]))
    return hits[0][1] if hits else None


SIZE_INCOME = {'S': 350, 'M': 700, 'L': 1400, 'XL': 2800}
GROUP_FX = {
    'Commerce': lambda s: [dict(k='income', n=SIZE_INCOME[s])],
    'Sea & Ports': lambda s: [dict(k='income', n=SIZE_INCOME[s])],
    'Venues & Sport': lambda s: [dict(k='regard', n=1, where='district'), dict(k='income', n=SIZE_INCOME[s] // 2)],
    'Wild & Nature': lambda s: [dict(k='odds', n=5, where='district')],
    'Homes & People': lambda s: [dict(k='loyalty', n=1)],
    'Landmarks': lambda s: [dict(k='regard', n=1, where='district')],
    'City': lambda s: [dict(k='income', n=SIZE_INCOME[s]), dict(k='regard', n=1, where='district')],
    'Gyms': lambda s: [dict(k='odds', n=5, where='district')],
    'Science & Industry': lambda s: [dict(k='income', n=SIZE_INCOME[s] // 2), dict(k='intel')],
    'Crime & Shadow': lambda s: [dict(k='clean', n=SIZE_INCOME[s] // 2)],
    'Teams & Bases': lambda s: [dict(k='dread', n=1, where='district')],
}


# Holding places whose names hold no town keyword (exact names from takeover.json, lower case).
EXTRA_PLACES = {
    'hoenn': {"mr. briney": 'petalburg', 'seabed route': 'sootopolis', "rydel's cycles": 'mauville', "steven's house": 'lilycove'},
    'sinnoh': {'sinnoh league': 'snowpoint', "trainers' school": 'jubilife', 'poffin house': 'hearthome', 'resort villa': 'canalave',
               'seven stars restaurant': 'hearthome'},
    'unova': {'unova league': 'opelucid', 'game freak office': 'castelia', 'big stadium': 'nimbasa', 'lostlorn forest': 'nimbasa',
              'relic passage': 'driftveil', 'plasma frigate': 'driftveil', 'team plasma castle': 'opelucid',
              'pokémon world tournament': 'driftveil', "challenger's cave": 'opelucid'},
    'kalos': {'kalos league': 'snowbelle', 'kalos power plant': 'laverre', 'haunted wood': 'laverre', 'battle chateau': 'santalune',
              'kalos underground': 'lumiose'},
    'alola': {"kukui's lab": 'hauoli', 'seaward cave': 'hauoli', 'lake of the sunne': 'ula-ula', 'lake of the moone': 'ula-ula'},
    'galar': {"hop's house": 'postwick', 'max raid dens': 'motostoke', "giant's cap": 'motostoke', 'challenge beach': 'hulbury',
              'poké job agency': 'wyndon', 'galar gym challenge seat': 'wyndon'},
    'paldea': {'team star dark base': 'mesagoza', 'team star fire base': 'cascarrafa', 'team star poison base': 'medali',
               'team star fairy base': 'montenevera', 'team star fighting base': 'zapapico', 'team star base hq': 'mesagoza',
               "professor's lab": 'cabo-poco', 'delibird presents': 'mesagoza', 'pokémon dojo': 'levincia',
               'titan site: klawf': 'cascarrafa', 'titan site: bombirdier': 'medali', 'titan site: orthworm': 'cascarrafa',
               'titan site: great tusk': 'zapapico', 'titan site: dondozo': 'montenevera', 'paldea mine': 'zapapico',
               'paldea port': 'porto-marinada'},
}


# The applications desk (D21) per region: who writes the references, and species that give a forged form away.
DESK_EXTRA = {
    'johto': dict(off=['zigzagoon', 'poochyena', 'shinx', 'lillipup', 'fletchling', 'rookidee', 'yungoos', 'bidoof'], writers=[
        ('Falkner\'s old flight coach', 'Coach Ren', 'Violet City', '{first} swept the tower stairs every morning. Never missed one.'),
        ('Charcoal maker Ilex', 'Ilex', 'Azalea Town', '{first} hauled wood for my kilns all winter. Strong back, quiet mouth.'),
        ('Radio DJ Mary', 'Mary', 'Goldenrod City', '{first} ran cables at the station. Knows every back door in the building.'),
        ('Sage Li', 'Li', 'Ecruteak City', '{first} kept the tower lamps lit. Patient. Maybe too patient.'),
        ('Pharmacist Tao', 'Tao', 'Cianwood City', '{first} delivered my medicine across the sea, rain or shine.'),
        ('Lighthouse keeper Amos', 'Amos', 'Olivine City', '{first} fixed the lamp twice and never asked for a coin. Hire them.'),
        ('Souvenir seller Old Pell', 'Pell', 'Mahogany Town', '{first} minded my shop. Never once went down the basement stairs. Probably.'),
    ]),
    'hoenn': dict(off=['rattata', 'sentret', 'bidoof', 'lillipup', 'fletchling', 'rookidee', 'yungoos', 'lechonk'], writers=[
        ('Devon clerk Mr. Stone\'s aide', 'Aide Ono', 'Rustboro City', '{first} filed Devon\'s papers for a year. Never lost one, never read one.'),
        ('Mr. Briney\'s neighbour', 'Neighbour Kip', 'Dewford Town', '{first} helped mend the nets. Good with knots and secrets.'),
        ('Wattson\'s shop hand', 'Hand Volt', 'Mauville City', '{first} rewired half of Mauville and never got a shock. Lucky, or careful.'),
        ('Hot-spring attendant Rina', 'Rina', 'Lavaridge Town', '{first} sold eggs boiled in the springs. Polite to everyone, even Magma.'),
        ('Gym trainee Wally\'s uncle', 'Uncle Wes', 'Petalburg City', '{first} helped Wally train. Kind. Don\'t let that fool you.'),
        ('Treehouse carpenter Vance', 'Vance', 'Fortree City', '{first} built rope bridges with me for two summers. Never fell once.'),
        ('Space Center guard Hollis', 'Hollis', 'Mossdeep City', '{first} worked nights at the launch pad. Saw the Magma lot coming before I did.'),
    ]),
    'sinnoh': dict(off=['rattata', 'sentret', 'zigzagoon', 'lillipup', 'fletchling', 'rookidee', 'yungoos', 'lechonk'], writers=[
        ('Mine foreman Dag', 'Dag', 'Oreburgh City', '{first} worked the coal face eight months. Never complained about the dust.'),
        ('Bike shop owner Rae', 'Rae', 'Eterna City', '{first} fixed bikes with me. Fast hands. Faster legs.'),
        ('Game Corner usher Sid', 'Sid', 'Veilstone City', '{first} worked the floor at the Game Corner. Saw the Galactic suits come and go.'),
        ('Great Marsh guide Olu', 'Olu', 'Pastoria City', '{first} guided tourists through the marsh. Never lost one in the mud.'),
        ('Contest hall dresser Belle', 'Belle', 'Hearthome City', '{first} dressed Pokémon for the Contests. Eye for detail.'),
        ('Library keeper Mott', 'Mott', 'Canalave City', '{first} read every book about the lakes. Every one. Twice.'),
    ]),
    'unova': dict(off=['rattata', 'sentret', 'zigzagoon', 'bidoof', 'fletchling', 'rookidee', 'yungoos', 'lechonk'], writers=[
        ('Café waiter Cress\'s cousin', 'Cousin Bo', 'Striaton City', '{first} waited tables at the Gym café. Never spilled a cup.'),
        ('Museum guard Hollis', 'Hollis', 'Nacrene City', '{first} guarded the dragon skull at night. Plasma never got close.'),
        ('Office clerk Wen', 'Wen', 'Castelia City', '{first} worked forty floors up and took the stairs. Every day.'),
        ('Ferris wheel operator Lu', 'Lu', 'Nimbasa City', '{first} ran the wheel. Knows everyone who\'s ever had a secret meeting on it.'),
        ('Cold storage boss Clay\'s foreman', 'Foreman Dex', 'Driftveil City', '{first} moved crates for us. Heavy lifting, no questions.'),
        ('Cargo pilot Skye', 'Skye', 'Mistralton City', '{first} loaded my cargo planes. Never once checked what was inside.'),
    ]),
    'kalos': dict(off=['rattata', 'sentret', 'zigzagoon', 'bidoof', 'lillipup', 'rookidee', 'yungoos', 'lechonk'], writers=[
        ('Painter Viola\'s model', 'Model Lise', 'Santalune City', '{first} sat for portraits all summer. Never moved a muscle.'),
        ('Fossil lab tech Andre', 'Andre', 'Cyllage City', '{first} cleaned fossils for the lab. Steady hands.'),
        ('Tower of Mastery monk', 'Brother Kai', 'Shalour City', '{first} studied Mega Evolution here. Asked a lot of questions.'),
        ('Port master Celine', 'Celine', 'Coumarine City', '{first} worked the monorail docks. Knows every ship in the bay.'),
        ('Café Soleil owner Marc', 'Marc', 'Lumiose City', '{first} poured coffee in Lumiose. Hears everything, repeats nothing.'),
        ('Poké Ball factory clerk Odile', 'Odile', 'Laverre City', '{first} worked the factory line. Knows where the Master Balls go.'),
    ]),
    'alola': dict(off=['rattata', 'sentret', 'zigzagoon', 'bidoof', 'lillipup', 'fletchling', 'rookidee', 'lechonk'], writers=[
        ('Kahuna\'s festival cook', 'Cook Mele', 'Iki Town', '{first} cooked for the festival every year. Never burned a thing.'),
        ('Ferry captain Kai', 'Kai', 'Heahea City', '{first} crewed my ferry between islands. Good sea legs.'),
        ('Ruins guide Noelani', 'Noelani', 'Konikoni City', '{first} sold stones at the market. Honest prices. Mostly.'),
        ('Malie library keeper', 'Keeper Pua', 'Malie City', '{first} sorted the old books in Malie. Quiet, sharp.'),
        ('Ex-Skull grunt Tupp\'s mum', 'Mrs. Tupp', 'Po Town', '{first} kept my boy out of trouble. Mostly. Bless them.'),
        ('Seafolk captain Mina\'s neighbour', 'Neighbour Ika', 'Seafolk Village', '{first} lived on the boat next door. Never stole a fish.'),
    ]),
    'galar': dict(off=['rattata', 'sentret', 'zigzagoon', 'bidoof', 'lillipup', 'fletchling', 'yungoos', 'lechonk'], writers=[
        ('Dig site foreman Milo\'s friend', 'Farmer Tom', 'Turffield', '{first} dug at the Turffield geoglyph. Never broke a stone.'),
        ('Hulbury fishmonger Nessa\'s aunt', 'Auntie Fen', 'Hulbury', '{first} gutted fish at my stall for a year. Strong stomach.'),
        ('Motostoke boiler man', 'Boilerman Cole', 'Motostoke', '{first} kept the city\'s boilers running. Never late.'),
        ('Stow-on-Side market trader', 'Trader Sal', 'Stow-on-Side', '{first} ran my market stall. Haggles like a pro.'),
        ('Ballonlea lamplighter', 'Lamplighter Ivy', 'Ballonlea', '{first} lit the mushroom lamps every night in Glimwood.'),
        ('Circhester bath attendant', 'Attendant Rolf', 'Circhester', '{first} worked the hot baths. Discreet. Very discreet.'),
    ]),
    'paldea': dict(off=['rattata', 'sentret', 'zigzagoon', 'bidoof', 'lillipup', 'fletchling', 'rookidee', 'yungoos'], writers=[
        ('Olive farmer Pepa', 'Pepa', 'Cortondo', '{first} picked olives for us. Never once rolled one.'),
        ('Artazon gardener Brassius\'s aide', 'Aide Flor', 'Artazon', '{first} trimmed the Sunflora statues. Patient work.'),
        ('Levincia streamer\'s manager', 'Manager Volt', 'Levincia', '{first} ran cameras for the streams. Knows what sells.'),
        ('Cascarrafa market seller', 'Seller Amir', 'Cascarrafa', '{first} worked the bidding hall. Reads people like price tags.'),
        ('Medali restaurant cook', 'Cook Lola', 'Medali', '{first} cooked at the Treasure Eatery. Kept the secret menu secret.'),
        ('Academy janitor Kai', 'Janitor Kai', 'Montenevera', '{first} cleaned the Academy halls. Saw Team Star come and go.'),
    ]),
}


def code3(town):
    w = ''.join(ch for ch in town.upper() if ch.isalpha())
    out = w[0]
    for ch in w[1:]:
        if len(out) == 3:
            break
        if ch not in 'AEIOU' and ch != out[-1]:
            out += ch
    for ch in w[1:]:
        if len(out) == 3:
            break
        out += ch
    return (out + 'XXX')[:3]


def desk_for(rid, p):
    towns = []
    for (_n, t, _c) in p['desk']['badges']:
        if t not in towns:
            towns.append(t)
    for (_n, _s, t, _q) in DESK_EXTRA[rid]['writers']:
        if t not in towns:
            towns.append(t)
    codes = {}
    for t in towns:
        c = code3(t)
        while c in codes.values():
            c = c[:2] + chr(ord('A') + (ord(c[2]) - ord('A') + 1) % 26)
        codes[t] = c
    return dict(name=p['desk']['name'], rivals=p['desk']['rivals'], badges=[dict(name=f'{n} Badge', town=t, c=c) for (n, t, c) in p['desk']['badges']],
                codes=codes, mons=p['pools']['catch'][:60], offRegion=DESK_EXTRA[rid]['off'],
                writers=[dict(name=n, short=sh, town=t, quote=q) for (n, sh, t, q) in DESK_EXTRA[rid]['writers']])


MISSING = []


def holdings_for(rid, pack):
    out = {}
    gym_by_leader = {g['leader'].lower(): g for g in pack['gyms']}
    biz_names = {b['name'].lower(): b['target'] for b in pack['business']}
    for h in TAKEOVER['holdings']:
        if h['region'] != rid:
            continue
        d = place_district(rid, h['place'], {**pack['places'], **EXTRA_PLACES.get(rid, {})})
        if not d:
            MISSING.append(f'{rid}: {h["place"]}')
            continue
        fx = list(h['fx']) or GROUP_FX.get(h['group'], lambda s: [dict(k='regard', n=1, where='district')])(h['size'])
        row = dict(district=d, fx=fx)
        if h['kind'] == 'gym':
            lead = re.search(r'\(([^)]+)\)', h['place'])
            g = None
            if lead:
                for name in lead.group(1).lower().replace('&', 'and').split(' and '):
                    g = gym_by_leader.get(name.strip()) or gym_by_leader.get(lead.group(1).lower().replace('&', 'and'))
                    if g:
                        break
            if g:
                row['via'] = f'gym:{g["id"]}'
        elif h['kind'] == 'league':
            row['via'] = 'champion'
        else:
            for bname, target in biz_names.items():
                if bname in h['place'].lower():
                    row['via'] = f'biz:{target}'
        what = ', '.join(sorted({f['k'] for f in fx}))
        row['note'] = f"Read from the list's Bonus as {what} each week; the rest of \"{h['bonus']['text'][:80]}\" waits for a battle or shop hook."
        out[h['id']] = row
    return out


def check(rid, p):
    ids = [d['id'] for d in p['districts']]
    if len(ids) != 10 or len(set(ids)) != 10:
        sys.exit(f'{rid}: ten towns with unique ids')
    if p['hq'] not in ids:
        sys.exit(f'{rid}: hq {p["hq"]} is not a town')
    tids = [t['id'] for d in p['districts'] for t in d['targets']]
    if len(set(tids)) != len(tids):
        sys.exit(f'{rid}: duplicate target ids')
    for a, b in p['routes'] + p['water']:
        if a not in ids or b not in ids:
            sys.exit(f'{rid}: route {a}-{b} names a missing town')
    for t in p['pillars']:
        if t not in tids:
            sys.exit(f'{rid}: pillar {t} is not a target')
    for b in p['business']:
        if b['target'] not in tids:
            sys.exit(f'{rid}: business {b["target"]} is not a target')
    for g in p['gyms']:
        if g['district'] not in ids:
            sys.exit(f'{rid}: gym {g["id"]} in a missing town')
    for x in p['hero']['path']:
        if x not in ids:
            sys.exit(f'{rid}: hero path {x} is not a town')
    for team, sites in p['rivals'].items():
        for s in sites:
            if s[2] not in ids:
                sys.exit(f'{rid}: site {s[0]} in a missing town')
    if sum(1 for d in p['districts'] if d['police']) != 1:
        sys.exit(f'{rid}: exactly one town has the police post')


def main():
    os.makedirs(OUT, exist_ok=True)
    seen_targets = {}
    for rid, p in R.items():
        check(rid, p)
        for d in p['districts']:
            for t in d['targets']:
                if t['id'] in seen_targets:
                    sys.exit(f'{rid}: target {t["id"]} also in {seen_targets[t["id"]]}')
                seen_targets[t['id']] = rid
        out = dict(
            _source=f'tools/dominion/regions-to-json.py ({rid}); see the tool for sources.',
            id=rid, label=p['label'], warehouse=p['warehouse'], hq=p['hq'], arrive=p['arrive'],
            districts=p['districts'], routes=p['routes'], water=p['water'], pools=p['pools'],
            rivals={team: [dict(id=s[0], name=s[1], district=s[2], **({'hq': True} if len(s) > 3 and s[3] else {})) for s in sites]
                    for team, sites in p['rivals'].items()},
            gyms=p['gyms'], business=p['business'], pillars=p['pillars'],
            hero=dict(path=p['hero']['path'], allies=p['hero']['allies'], mentor=p['hero']['mentor'], parent=p['hero']['parent'],
                      sidekick=p['hero']['sidekick'], homes={k: dict(home=v[0], over=v[1]) for k, v in p['hero']['homes'].items()}),
            league=p['league'], lab=p['lab'],
            desk=desk_for(rid, p),
            holdings=holdings_for(rid, p),
        )
        with open(os.path.join(OUT, f'{rid}.json'), 'w', encoding='utf-8') as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
            f.write('\n')
        print(f'{rid}: {len(p["districts"])} towns, {sum(len(d["targets"]) for d in p["districts"])} targets, {len(p["gyms"])} Gyms, '
              f'{len(out["holdings"])} Holdings placed')
    if MISSING:
        sys.exit('No town for these holding places (add them to places):\n  ' + '\n  '.join(MISSING))


if __name__ == '__main__':
    main()
