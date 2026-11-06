"""Adds the Google Drive pack's item pictures that the game didn't have, each with a real effect.

Every item below uses an effect the game already runs (core/catalog.ts, core/battle/held.ts,
core/mapItems.ts), so nothing is a placeholder. Items whose effect would need new game code
(Weakness Policy, Ability Patch, the fan Mega Stones...) are left out on purpose; see
docs/status/drive-items.md.

  python3 -I tools/drive/build-items.py <Graphics/Items dir> <repo>

Icons: most of the pack's 48x48 pictures are pixel-doubled, so they are halved to the 24x24 size of
images/items/gen5 (the folder every catalog icon lives in). Re-running replaces the entries
this script added before (listed in tools/drive/items.json).
"""
import json
import os
import re
import sys

from PIL import Image

SRC, REPO = sys.argv[1], sys.argv[2]
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())

P, T, Y = 'pokemon', 'team', 'player'


def held(*hooks):
    return {'kind': 'held', 'hooks': list(hooks)}


def form(frm, to):
    return {'hook': 'formHeld', 'from': frm, 'to': to}


def tpower(types, pct, species=None):
    h = {'hook': 'typePower', 'types': types, 'percent': pct}
    if species:
        h['species'] = species
    return h


def enc(lasts, *mods, changes=None):
    e = {'kind': 'encounter', 'lasts': lasts, 'mods': list(mods)}
    if changes:
        e['changes'] = changes
    return e


def perk(lasts, *perks):
    return {'kind': 'perk', 'lasts': lasts, 'perks': list(perks)}


RUN = {'for': 'run'}
STAGE = {'for': 'stage'}
NEXT = {'for': 'nextStage'}
battles = lambda n: {'for': 'battles', 'count': n}
throws = lambda n: {'for': 'throws', 'count': n}
care = lambda heal=None, cure=None, **ch: {k: v for k, v in {'kind': 'care', 'heal': heal, 'cure': cure, 'changes': ch or None}.items() if v is not None}
feed = lambda fr, **ch: {'kind': 'feed', 'friendship': fr, 'changes': ch}
attrs = lambda **ch: {'kind': 'attributes', 'changes': ch}
money = lambda amount, **ch: {'kind': 'money', 'amount': amount, 'changes': ch}
boost = lambda stat, stages=1, turns=5: {'kind': 'stage', 'stat': stat, 'stages': stages, 'turns': turns}

GAUNTLET_SPECIES = {
    'conkeldurr': ['timburr', 'gurdurr', 'conkeldurr'],
    'drifblim': ['drifloon', 'drifblim'],
    'dugtrio': ['diglett', 'dugtrio'],
    'eevee': ['eevee'],
    'fearow': ['spearow', 'fearow'],
    'linoone': ['zigzagoon', 'linoone'],
    'parasect': ['paras', 'parasect'],
    'raticate': ['rattata', 'raticate'],
    'simi': ['pansage', 'simisage', 'pansear', 'simisear', 'panpour', 'simipour'],
    'skuntank': ['stunky', 'skuntank'],
    'trevenant': ['phantump', 'trevenant'],
    'unfezant': ['pidove', 'tranquill', 'unfezant'],
    'wurmple': ['wurmple', 'silcoon', 'beautifly', 'cascoon', 'dustox'],
}

# drive file key -> (id, name, family, description, rarity, stacksOn, max, how, effect)
ITEMS = []


def add(key, id_, name, family, desc, rarity, stacks, mx, how, effect):
    ITEMS.append((key, dict(id=id_, name=name, family=family, description=desc, rarity=rarity, stacksOn=stacks, max=mx, how=how, effect=effect)))


# ---------- held items from the newer games ----------
F = 'Held items (Drive pack)'
add('snowball', 'snowball', 'Snowball', F, 'Hit by an Ice move: +1 Attack, once per battle', 'uncommon', P, 1, 'held', held({'hook': 'absorb', 'type': 'ice', 'stat': 'atk', 'stages': 1}))
add('luminousmoss', 'luminous-moss', 'Luminous Moss', F, 'Hit by a Water move: +1 Sp. Def, once per battle', 'uncommon', P, 1, 'held', held({'hook': 'absorb', 'type': 'water', 'stat': 'spd', 'stages': 1}))
add('adamantcrystal', 'adamant-crystal', 'Adamant Crystal', F, 'Dialga takes its Origin Forme; its Steel and Dragon moves do 20% more', 'epic', P, 1, 'held', held(form('dialga', 'dialga-origin'), tpower(['steel', 'dragon'], 20, ['dialga', 'dialga-origin'])))
add('lustrousglobe', 'lustrous-globe', 'Lustrous Globe', F, 'Palkia takes its Origin Forme; its Water and Dragon moves do 20% more', 'epic', P, 1, 'held', held(form('palkia', 'palkia-origin'), tpower(['water', 'dragon'], 20, ['palkia', 'palkia-origin'])))
add('griseouscore', 'griseous-core', 'Griseous Core', F, 'Giratina takes its Origin Forme; its Ghost and Dragon moves do 20% more', 'epic', P, 1, 'held', held(form('giratina', 'giratina-origin'), tpower(['ghost', 'dragon'], 20, ['giratina', 'giratina-origin'])))
add('rustedsword', 'rusted-sword', 'Rusted Sword', F, 'Zacian becomes Zacian Crowned Sword while holding it', 'epic', P, 1, 'held', held(form('zacian', 'zacian-crowned')))
add('rustedshield', 'rusted-shield', 'Rusted Shield', F, 'Zamazenta becomes Zamazenta Crowned Shield while holding it', 'epic', P, 1, 'held', held(form('zamazenta', 'zamazenta-crowned')))
OG = ['ogerpon', 'ogerpon-wellspring-mask', 'ogerpon-hearthflame-mask', 'ogerpon-cornerstone-mask']
add('wellspringmask', 'wellspring-mask', 'Wellspring Mask', F, 'Ogerpon wears its Wellspring Mask; its moves do 20% more', 'epic', P, 1, 'held', held(form('ogerpon', 'ogerpon-wellspring-mask'), tpower(['water', 'grass'], 20, OG)))
add('hearthflamemask', 'hearthflame-mask', 'Hearthflame Mask', F, 'Ogerpon wears its Hearthflame Mask; its moves do 20% more', 'epic', P, 1, 'held', held(form('ogerpon', 'ogerpon-hearthflame-mask'), tpower(['fire', 'grass'], 20, OG)))
add('cornerstonemask', 'cornerstone-mask', 'Cornerstone Mask', F, 'Ogerpon wears its Cornerstone Mask; its moves do 20% more', 'epic', P, 1, 'held', held(form('ogerpon', 'ogerpon-cornerstone-mask'), tpower(['rock', 'grass'], 20, OG)))
add('tealmask', 'teal-mask', 'Teal Mask', F, "Ogerpon's Grass moves do 20% more", 'rare', P, 1, 'held', held(tpower(['grass'], 20, OG)))
add('prisonbottle', 'prison-bottle', 'Prison Bottle', F, 'Hoopa is unbound while holding it', 'epic', P, 1, 'held', held(form('hoopa', 'hoopa-unbound')))
add('revealglass', 'reveal-glass', 'Reveal Glass', F, 'Tornadus, Thundurus, Landorus and Enamorus take their Therian Forme', 'epic', P, 1, 'held', held(*[form(s, f'{s}-therian') for s in ['tornadus', 'thundurus', 'landorus', 'enamorus']]))
add('nsolarizer', 'n-solarizer', 'N-Solarizer', F, 'Necrozma becomes Dusk Mane Necrozma while holding it', 'epic', P, 1, 'held', held(form('necrozma', 'necrozma-dusk')))
add('nlunarizer', 'n-lunarizer', 'N-Lunarizer', F, 'Necrozma becomes Dawn Wings Necrozma while holding it', 'epic', P, 1, 'held', held(form('necrozma', 'necrozma-dawn')))
add('zygardecube', 'zygarde-cube', 'Zygarde Cube', F, 'Zygarde takes its Complete Forme while holding it', 'epic', P, 1, 'held', held(form('zygarde', 'zygarde-complete')))
add('meteorite1', 'meteorite-attack', 'Meteorite (Attack)', F, 'Deoxys takes its Attack Forme while holding it', 'epic', P, 1, 'held', held(form('deoxys', 'deoxys-attack')))
add('meteorite2', 'meteorite-defense', 'Meteorite (Defense)', F, 'Deoxys takes its Defense Forme while holding it', 'epic', P, 1, 'held', held(form('deoxys', 'deoxys-defense')))
add('meteorite3', 'meteorite-speed', 'Meteorite (Speed)', F, 'Deoxys takes its Speed Forme while holding it', 'epic', P, 1, 'held', held(form('deoxys', 'deoxys-speed')))
add('pinknectar', 'pink-nectar', 'Pink Nectar', F, "Oricorio dances in its Pa'u Style while holding it", 'rare', P, 1, 'held', held(form('oricorio', 'oricorio-pau')))
add('yellownectar', 'yellow-nectar', 'Yellow Nectar', F, 'Oricorio dances in its Pom-Pom Style while holding it', 'rare', P, 1, 'held', held(form('oricorio', 'oricorio-pom-pom')))
add('purplenectar', 'purple-nectar', 'Purple Nectar', F, 'Oricorio dances in its Sensu Style while holding it', 'rare', P, 1, 'held', held(form('oricorio', 'oricorio-sensu')))

# ---------- fan-made held items ----------
F = 'Fan held items (Drive pack)'
for key, species in GAUNTLET_SPECIES.items():
    nice = 'Simi' if key == 'simi' else key.capitalize()
    add(f'{key}gauntlet', f'{key}-gauntlet', f'{nice} Gauntlet', F, f'{nice}{" monkeys" if key == "simi" else ""} and its family: every stat but HP x1.3', 'rare', P, 1, 'held', held({'hook': 'stat', 'stat': 'all', 'multiplier': 1.3, 'species': species}))
add('blazingorb', 'blazing-orb', 'Blazing Orb', F, "Fire moves do 25% more, and the holder can't be frozen", 'rare', P, 1, 'held', held(tpower(['fire'], 25), {'hook': 'statusImmune', 'statuses': ['frz']}))
add('freezingorb', 'freezing-orb', 'Freezing Orb', F, "Ice moves do 25% more, and the holder can't be burned", 'rare', P, 1, 'held', held(tpower(['ice'], 25), {'hook': 'statusImmune', 'statuses': ['brn']}))
add('wickedorb', 'wicked-orb', 'Wicked Orb', F, 'Poisons the holder at the end of its first turn; its Dark moves do 30% more', 'uncommon', P, 1, 'held', held({'hook': 'selfStatus', 'status': 'psn', 'type': 'dark', 'percent': 30}))
add('mentalscarf', 'mental-scarf', 'Mental Scarf', F, 'Cures a Taunt once per battle; +1 Intelligence per knockout (up to 10)', 'uncommon', P, 1, 'held', held({'hook': 'mentalHerb'}, {'hook': 'koAttribute', 'attribute': 'intelligence', 'amount': 1, 'cap': 10}))
add('staticscarf', 'static-scarf', 'Static Scarf', F, "The holder's physical hits may paralyze (10%)", 'uncommon', P, 1, 'held', held({'hook': 'contactStatus', 'status': 'par', 'percent': 10}))
add('toxicscarf', 'toxic-scarf', 'Toxic Scarf', F, "The holder's physical hits may poison (10%)", 'uncommon', P, 1, 'held', held({'hook': 'contactStatus', 'status': 'psn', 'percent': 10}))

# ---------- charms (run-long) ----------
F = 'Charms (Drive pack)'
add('coincharm', 'coin-charm', 'Coin Charm', F, '+10% money from battles per copy', 'uncommon', T, 3, 'passive', {'kind': 'passive', 'passive': 'money', 'percent': 10})
add('goldcharm', 'gold-charm', 'Gold Charm', F, '+20% money from battles', 'rare', T, 1, 'passive', {'kind': 'passive', 'passive': 'money', 'percent': 20})
add('colorcharm', 'color-charm', 'Color Charm', F, 'Shiny Pokémon are 1.5x as likely for the rest of the run', 'epic', Y, 1, 'passive', enc(RUN, {'mod': 'shiny', 'multiplier': 1.5}))
add('glimmeringcharm', 'glimmering-charm', 'Glimmering Charm', F, 'Next stage: each wild Pokémon is the strongest of three', 'rare', Y, 1, 'use', enc(NEXT, {'mod': 'rare'}))
add('friendshipcharm', 'friendship-charm', 'Friendship Charm', F, 'Feeding a Pokémon gives 50% more friendship', 'uncommon', Y, 1, 'passive', {'kind': 'passive', 'passive': 'feedFriendship', 'percent': 50})
add('healingcharm', 'healing-charm', 'Healing Charm', F, 'Healing berries heal 25% more', 'common', T, 1, 'passive', {'kind': 'passive', 'passive': 'berryHeal', 'percent': 25})
add('stepcharm', 'step-charm', 'Step Charm', F, 'Every Egg gets one extra step toward hatching', 'rare', Y, 1, 'passive', perk(RUN, {'perk': 'ovalCharm'}))
add('mercycharm', 'mercy-charm', 'Mercy Charm', F, 'After each won fight, one fallen Pokémon gets back up', 'rare', Y, 1, 'passive', perk(RUN, {'perk': 'lastChance'}))
add('miningcharm', 'mining-charm', 'Mining Charm', F, 'Each stage, one wild stop hides a Bag item', 'uncommon', Y, 1, 'passive', perk(RUN, {'perk': 'hiddenItem'}))
add('lurecharm', 'lure-charm', 'Lure Charm', F, "Wild Pokémon match the stage's first type more often (+15% per copy)", 'common', Y, 3, 'passive', enc(RUN, {'mod': 'types', 'types': ['themeFirst'], 'percent': 15}))
add('keycharm', 'key-charm', 'Key Charm', F, 'Every hidden "?" stop shows what it is', 'rare', Y, 1, 'passive', perk(RUN, {'perk': 'revealEvents'}))
add('clovercharm', 'clover-charm', 'Clover Charm', F, '+3 Luck', 'common', Y, None, 'use', attrs(luck=3))
add('heartcharm', 'heart-charm', 'Heart Charm', F, '+3 Love', 'common', Y, None, 'use', attrs(love=3))

# ---------- Roto Powers (one-shot boosts) ----------
F = 'Roto Powers (Drive pack)'
add('rotobargain', 'roto-bargain', 'Roto Bargain', F, 'Your next 3 shop purchases are 25% cheaper', 'uncommon', Y, 3, 'use', perk({'for': 'purchases', 'count': 3}, {'perk': 'discount', 'percent': 25}))
add('rotoboost', 'roto-boost', 'Roto Boost', F, 'Whole team: +1 Attack and Sp. Atk for the first 3 turns of the next battle', 'uncommon', T, 3, 'use', {'kind': 'battleBoost', 'boosts': [boost('atk', 1, 3), boost('spa', 1, 3)]})
add('rotocatch', 'roto-catch', 'Roto Catch', F, 'Your next 3 ball throws catch twice as well', 'uncommon', Y, 3, 'use', enc(throws(3), {'mod': 'catch', 'multiplier': 2}))
add('rotoencounter', 'roto-encounter', 'Roto Encounter', F, 'Next 2 wild battles: the strongest of three Pokémon appears', 'uncommon', Y, 3, 'use', enc(battles(2), {'mod': 'rare'}))
add('rotoexppoints', 'roto-exp-points', 'Roto Exp. Points', F, 'Next 3 wild battles give 50% more EXP', 'common', Y, 3, 'use', enc(battles(3), {'mod': 'exp', 'percent': 50}))
add('rotofriendship', 'roto-friendship', 'Roto Friendship', F, 'A Pokémon of your choice gains a lot of friendship', 'common', P, None, 'use', feed(30))
add('rotohatch', 'roto-hatch', 'Roto Hatch', F, 'Next stage: every Egg gets one extra step toward hatching', 'common', Y, 3, 'use', perk(NEXT, {'perk': 'ovalCharm'}))
add('rotohprestore', 'roto-hp-restore', 'Roto HP Restore', F, 'Heals the whole team by half their HP', 'uncommon', T, None, 'use', {'kind': 'teamCare', 'heal': 0.5})
add('rotopprestore', 'roto-pp-restore', 'Roto PP Restore', F, "Restores all of the whole team's PP", 'rare', T, None, 'use', {'kind': 'teamCare', 'pp': -1})
add('rotoprizemoney', 'roto-prize-money', 'Roto Prize Money', F, 'Your next 3 trainer wins pay 50% more', 'uncommon', Y, 3, 'use', perk({'for': 'trainers', 'count': 3}, {'perk': 'trainerMoney', 'percent': 50}))
add('rotostealth', 'roto-stealth', 'Roto Stealth', F, 'Skips the next 2 wild battles', 'common', Y, 3, 'use', enc(battles(2), {'mod': 'repel'}))

# ---------- food (Galar camping and Paldea picnic ingredients) ----------
F = 'Food (Drive pack)'
for key, id_, name, eff, desc in [
    ('bread', 'bread', 'Bread', care(40, strength=1), 'Heals 40 HP; +1 Strength'),
    ('boiledegg', 'boiled-egg', 'Boiled Egg', care(50, love=1), 'Heals 50 HP; +1 Love'),
    ('coconutmilk', 'coconut-milk', 'Coconut Milk', care(60, charisma=1), 'Heals 60 HP; +1 Charisma'),
    ('fruitbunch', 'fruit-bunch', 'Fruit Bunch', care(50, luck=1), 'Heals 50 HP; +1 Luck'),
    ('instantnoodles', 'instant-noodles', 'Instant Noodles', care(40, speed=1), 'Heals 40 HP; +1 Speed'),
    ('moomoocheese', 'moomoo-cheese', 'Moomoo Cheese', care(80, love=1), 'Heals 80 HP; +1 Love'),
    ('packofpotatoes', 'pack-of-potatoes', 'Pack of Potatoes', care(50, strength=1), 'Heals 50 HP; +1 Strength'),
    ('pasta', 'pasta', 'Pasta', care(60, intelligence=1), 'Heals 60 HP; +1 Intelligence'),
    ('precookedburger', 'precooked-burger', 'Precooked Burger', care(70, strength=1), 'Heals 70 HP; +1 Strength'),
    ('saladmix', 'salad-mix', 'Salad Mix', care(40, True), 'Heals 40 HP and cures its status'),
    ('sausages', 'sausages', 'Sausages', care(60, ragePeace=1), 'Heals 60 HP; +1 Rage'),
    ('tinofbeans', 'tin-of-beans', 'Tin of Beans', care(40, goodEvil=1), 'Heals 40 HP; +1 Good'),
    ('mixedmushrooms', 'mixed-mushrooms', 'Mixed Mushrooms', care(None, True, ragePeace=-1), 'Cures its status; +1 Peace'),
    ('shaloursable', 'shalour-sable', 'Shalour Sable', care(20, True, charisma=1), 'Heals 20 HP and cures its status; +1 Charisma'),
    ('maxhoney', 'max-honey', 'Max Honey', care(120, True), 'Heals 120 HP and cures its status'),
    ('fancyapple', 'fancy-apple', 'Fancy Apple', feed(15, love=1), 'Friendship up; +1 Love'),
    ('freshcream', 'fresh-cream', 'Fresh Cream', feed(15, charisma=1), 'Friendship up; +1 Charisma'),
    ('largeleek', 'large-leek', 'Large Leek', feed(12, strength=1), 'Friendship up; +1 Strength'),
    ('smokepoketail', 'smoke-poke-tail', 'Smoke-Poke Tail', feed(12, luck=1), 'Friendship up; +1 Luck'),
    ('spicemix', 'spice-mix', 'Spice Mix', feed(10, ragePeace=1), 'Friendship up; +1 Rage'),
    ('pungentroot', 'pungent-root', 'Pungent Root', feed(-5, strength=2), 'Bitter: friendship down, but +2 Strength'),
    ('rainbowflower', 'rainbow-flower', 'Rainbow Flower', feed(25, charisma=1), 'Friendship up a lot; +1 Charisma'),
]:
    add(key, id_, name, F, desc, 'common', P, None, 'use', eff)
add('packagedcurry', 'packaged-curry', 'Packaged Curry', F, 'Heals the whole team by 20% of their HP', 'uncommon', T, None, 'use', {'kind': 'teamCare', 'heal': 0.2})
add('gigantamix', 'gigantamix', 'Gigantamix', F, 'Heals the whole team by 30% of their HP', 'rare', T, None, 'use', {'kind': 'teamCare', 'heal': 0.3})
add('maxmushrooms', 'max-mushrooms', 'Max Mushrooms', F, 'Heals the whole team by 25% of their HP', 'uncommon', T, None, 'use', {'kind': 'teamCare', 'heal': 0.25})
add('bigbambooshoot', 'big-bamboo-shoot', 'Big Bamboo Shoot', F, 'Sell it for 1500 money', 'rare', Y, None, 'use', money(1500))
add('tinybambooshoot', 'tiny-bamboo-shoot', 'Tiny Bamboo Shoot', F, 'Sell it for 250 money', 'common', Y, None, 'use', money(250))

# ---------- Herba Mystica (the whole team) ----------
F = 'Herba Mystica (Drive pack)'
add('sweetherbamystica', 'sweet-herba-mystica', 'Sweet Herba Mystica', F, "Fully heals the whole team's HP and PP", 'epic', T, None, 'use', {'kind': 'teamCare', 'heal': 1, 'pp': -1})
for key, name, stat, nice in [('spicy', 'Spicy', 'atk', 'Attack'), ('salty', 'Salty', 'def', 'Defense'), ('bitter', 'Bitter', 'spa', 'Sp. Atk'), ('sour', 'Sour', 'spd', 'Sp. Def')]:
    add(f'{key}herbamystica', f'{key}-herba-mystica', f'{name} Herba Mystica', F, f'Whole team: +2 {nice} for the first 5 turns of the next battle', 'rare', T, 3, 'use', {'kind': 'battleBoost', 'boosts': [boost(stat, 2)]})

# ---------- stat items ----------
F = 'Mochi (Drive pack)'
for key, name, stat in [('health', 'Health', 'hp'), ('muscle', 'Muscle', 'atk'), ('resist', 'Resist', 'def'), ('genius', 'Genius', 'spa'), ('clever', 'Clever', 'spd'), ('swift', 'Swift', 'spe')]:
    nice = {'hp': 'HP', 'atk': 'Attack', 'def': 'Defense', 'spa': 'Sp. Atk', 'spd': 'Sp. Def', 'spe': 'Speed'}[stat]
    add(f'{key}mochi', f'{key}-mochi', f'{name} Mochi', F, f'+4% {nice} for one Pokémon, for good', 'uncommon', P, 5, 'use', {'kind': 'statBoost', 'stat': stat, 'percent': 4})
F = 'Gummies (Drive pack)'
for key, name, stat in [('stamina', 'Stamina', 'hp'), ('strength', 'Strength', 'atk'), ('toughness', 'Toughness', 'def'), ('sanity', 'Sanity', 'spa'), ('will', 'Will', 'spd'), ('reaction', 'Reaction', 'spe')]:
    nice = {'hp': 'HP', 'atk': 'Attack', 'def': 'Defense', 'spa': 'Sp. Atk', 'spd': 'Sp. Def', 'spe': 'Speed'}[stat]
    add(f'{key}gummy', f'{key}-gummy', f'{name} Gummy', F, f'+3% {nice} for one Pokémon, for good', 'common', P, 5, 'use', {'kind': 'statBoost', 'stat': stat, 'percent': 3})
add('redgummy', 'red-gummy', 'Red Gummy', F, 'Friendship up a lot; +1 Love', 'common', P, None, 'use', feed(20, love=1))

# ---------- berry farming ----------
F = 'Mulch (Drive pack)'
add('amazemulch', 'amaze-mulch', 'Amaze Mulch', F, 'Berries are saved 15% of the time', 'uncommon', T, 1, 'passive', {'kind': 'passive', 'passive': 'berrySave', 'percent': 15})
add('boostmulch', 'boost-mulch', 'Boost Mulch', F, 'One more berry pot', 'uncommon', Y, 1, 'passive', {'kind': 'passive', 'passive': 'berryPotsExtra', 'percent': 1})
add('richmulch', 'rich-mulch', 'Rich Mulch', F, 'Berries sell for 10% more', 'common', Y, 1, 'passive', {'kind': 'passive', 'passive': 'berryMoney', 'percent': 10})
add('surprisemulch', 'surprise-mulch', 'Surprise Mulch', F, 'Pinch berries work 15% earlier', 'common', T, 1, 'passive', {'kind': 'passive', 'passive': 'berryPinch', 'percent': 15})

# ---------- petals (Mina's trial) ----------
F = 'Petals (Drive pack)'
for key, name, ch in [('red', 'Red', dict(strength=1)), ('orange', 'Orange', dict(speed=1)), ('yellow', 'Yellow', dict(luck=1)), ('green', 'Green', dict(goodEvil=1)), ('blue', 'Blue', dict(intelligence=1)), ('purple', 'Purple', dict(ragePeace=-1)), ('pink', 'Pink', dict(love=1))]:
    add(f'{key}petal', f'{key}-petal', f'{name} Petal', F, '', 'common', Y, None, 'use', attrs(**ch))
add('radiantpetal', 'radiant-petal', 'Radiant Petal', F, '+3 Charisma and +1 Luck', 'rare', Y, None, 'use', attrs(charisma=3, luck=1))

# ---------- fossils ----------
F = 'Fossils (Drive pack)'
for key, id_, name, sp in [('jawfossil', 'jaw-fossil', 'Jaw Fossil', 'tyrunt'), ('sailfossil', 'sail-fossil', 'Sail Fossil', 'amaura'), ('fossilizedbird', 'fossilized-bird', 'Fossilized Bird', 'dracozolt'), ('fossilizeddino', 'fossilized-dino', 'Fossilized Dino', 'arctozolt'), ('fossilizeddrake', 'fossilized-drake', 'Fossilized Drake', 'dracovish'), ('fossilizedfish', 'fossilized-fish', 'Fossilized Fish', 'arctovish')]:
    add(key, id_, name, F, f'Revives into {sp.capitalize()}', 'rare', Y, None, 'use', {'kind': 'fossil', 'species': sp})

# ---------- map and encounter items ----------
F = 'Map items (Drive pack)'
add('eonflute', 'eon-flute', 'Eon Flute', F, 'This stage: a 5% chance each for wild Latias or Latios', 'epic', Y, 1, 'use', enc(STAGE, {'mod': 'species', 'species': 'latias', 'percent': 5}, {'mod': 'species', 'species': 'latios', 'percent': 5}))
add('sunflute', 'sun-flute', 'Sun Flute', F, 'Solgaleo is chosen whenever an event could offer it', 'epic', Y, 1, 'passive', perk(RUN, {'perk': 'favorSpecies', 'species': 'solgaleo'}))
add('moonflute', 'moon-flute', 'Moon Flute', F, 'Lunala is chosen whenever an event could offer it', 'epic', Y, 1, 'passive', perk(RUN, {'perk': 'favorSpecies', 'species': 'lunala'}))
add('dryincense', 'dry-incense', 'Dry Incense', F, 'Wild Pokémon are more often Ground type (+20% per copy)', 'common', Y, 3, 'passive', enc(RUN, {'mod': 'types', 'types': ['ground'], 'percent': 20}))
add('sparkincense', 'spark-incense', 'Spark Incense', F, 'Wild Pokémon are more often Electric type (+20% per copy)', 'common', Y, 3, 'passive', enc(RUN, {'mod': 'types', 'types': ['electric'], 'percent': 20}))
add('infirepel', 'infinite-repel', 'Infinite Repel', F, 'Skips the next 6 wild battles', 'rare', Y, 1, 'use', enc(battles(6), {'mod': 'repel'}))
add('wishingpiece', 'wishing-piece', 'Wishing Piece', F, 'Next wild battle: the strongest of three Pokémon appears; +1 Luck', 'common', Y, 3, 'use', enc(battles(1), {'mod': 'rare'}, changes={'luck': 1}))
add('wishingstar', 'wishing-star', 'Wishing Star', F, 'Next 3 wild battles: shiny Pokémon are 3x as likely', 'rare', Y, 3, 'use', enc(battles(3), {'mod': 'shiny', 'multiplier': 3}))
add('decoy', 'decoy', 'Decoy', F, 'The next wild Pokémon loses its first turn', 'common', Y, 3, 'use', enc(battles(1), {'mod': 'freeTurn'}))

# ---------- gift boxes and valuables ----------
F = 'Gift boxes (Drive pack)'
add('giftbox', 'gift-box', 'Gift Box', F, 'Holds 2 Revives', 'common', Y, None, 'use', {'kind': 'bagItem', 'item': 'revive', 'count': 2})
add('giftboxpokeball', 'gift-box-balls', 'Gift Box (Balls)', F, 'Holds 3 Ultra Balls', 'uncommon', Y, None, 'use', {'kind': 'bagItem', 'item': 'ultra-ball', 'count': 3})
add('giftboxsupport', 'gift-box-support', 'Gift Box (Support)', F, 'Holds 2 Full Restores', 'rare', Y, None, 'use', {'kind': 'bagItem', 'item': 'full-restore', 'count': 2})
add('giftboxrare', 'gift-box-rare', 'Gift Box (Rare)', F, 'Holds a Master Ball', 'epic', Y, None, 'use', {'kind': 'bagItem', 'item': 'master-ball', 'count': 1})
F = 'Valuables (Drive pack)'
add('gimmighoulcoin', 'gimmighoul-coin', 'Gimmighoul Coin', F, 'Worth 100 money; +1 Luck', 'common', Y, None, 'use', money(100, luck=1))
add('strangesouvenir', 'strange-souvenir', 'Strange Souvenir', F, 'Worth 300 money; +2 Charisma', 'uncommon', Y, None, 'use', money(300, charisma=2))
add('kofuswallet', 'kofus-wallet', "Kofu's Wallet", F, 'Worth 1000 money; +2 Good', 'rare', Y, None, 'use', money(1000, goodEvil=2))
add('honorofkalos', 'honor-of-kalos', 'Honor of Kalos', F, '+3 Charisma and +2 Good', 'rare', Y, None, 'use', attrs(charisma=3, goodEvil=2))
add('expall', 'exp-all', 'Exp. All', F, 'The whole team shares EXP fully', 'epic', T, 1, 'passive', {'kind': 'passive', 'passive': 'expShare', 'percent': 100})

ATTR_NAMES = {'strength': 'Strength', 'intelligence': 'Intelligence', 'speed': 'Speed', 'charisma': 'Charisma', 'luck': 'Luck', 'love': 'Love'}


def describe_attrs(ch):
    parts = []
    for k, v in ch.items():
        if k == 'ragePeace':
            parts.append(f"+{abs(v)} {'Rage' if v > 0 else 'Peace'}")
        elif k == 'goodEvil':
            parts.append(f"+{abs(v)} {'Good' if v > 0 else 'Evil'}")
        else:
            parts.append(f'{v:+d} {ATTR_NAMES[k]}')
    return ' and '.join(parts)


def to_icon(img):
    """24x24: a pixel-doubled 48x48 picture is halved exactly; anything else is scaled to fit and centred."""
    if img.size == (48, 48) and img.resize((24, 24), Image.NEAREST).resize((48, 48), Image.NEAREST).tobytes() == img.tobytes():
        return img.resize((24, 24), Image.NEAREST)
    img = img.crop(img.getbbox() or (0, 0, *img.size))
    img.thumbnail((24, 24), Image.BOX)
    out = Image.new('RGBA', (24, 24))
    out.paste(img, ((24 - img.width) // 2, (24 - img.height) // 2))
    return out


# ---------- find the pictures ----------
sources = {}
for root, _, files in os.walk(SRC):
    for f in files:
        if f.lower().endswith('.png'):
            sources.setdefault(norm(f[:-4]), os.path.join(root, f))

catalog_path = f'{REPO}/src/data/itemCatalog.json'
ids_path = f'{REPO}/tools/drive/items.json'
prov_path = f'{REPO}/tools/drive/provenance.json'
catalog = json.load(open(catalog_path, encoding='utf-8'))
old = set(json.load(open(ids_path))) if os.path.exists(ids_path) else set()
catalog = [e for e in catalog if e['id'] not in old]
taken = {e['id'] for e in catalog}
gen5 = f'{REPO}/public/assets/images/items/gen5'
existing_icons = {f[:-4] for f in os.listdir(gen5)} - old

new, prov = [], []
for key, entry in ITEMS:
    if entry['id'] in taken:
        sys.exit(f'{entry["id"]} is already in the catalog')
    if entry['id'] in existing_icons:
        sys.exit(f'{entry["id"]}.png is already an icon')
    src = sources.get(key)
    if not src:
        sys.exit(f'no picture for {key}')
    if not entry['description']:
        entry['description'] = describe_attrs(entry['effect']['changes'])
    img = Image.open(src).convert('RGBA')
    img = to_icon(img)
    img.save(f'{gen5}/{entry["id"]}.png', optimize=True)
    out = {k: entry[k] for k in ['id', 'name', 'family', 'description', 'rarity', 'stacksOn', 'max', 'how']}
    out.update(icon=entry['id'], status='supported', effect=entry['effect'])
    new.append(out)
    taken.add(entry['id'])
    prov.append({'file': f'images/items/gen5/{entry["id"]}.png', 'source': 'Pokémon fan-game Graphics pack (Graphics/Items)', 'original': os.path.relpath(src, SRC).replace(os.sep, '/')})

json.dump(catalog + new, open(catalog_path, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
open(catalog_path, 'a').write('\n')
json.dump(sorted(e['id'] for e in new), open(ids_path, 'w'), indent=1)
open(ids_path, 'a').write('\n')
provs = [p for p in json.load(open(prov_path, encoding='utf-8')) if not p['file'].startswith('images/items/gen5/')]
json.dump(provs + prov, open(prov_path, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
open(prov_path, 'a').write('\n')
print(f'{len(new)} items added')
