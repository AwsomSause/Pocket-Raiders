"""W7: wires more pictures from images/items/library as catalog items, each with an effect the game already runs.

  python3 -I tools/drive/wire-library2.py <repo>

Entries use icon "library/<name>". Re-running replaces the ids listed in tools/drive/library-items2.json.
Pictures still unused are listed by tools/drive/library-report.py.
"""
import json
import os
import sys

REPO = sys.argv[1]
P, T, Y = 'pokemon', 'team', 'player'
ITEMS, BAGS = [], []


def add(pic, id_, name, family, desc, rarity, stacks, mx, how, effect):
    ITEMS.append(dict(id=id_, name=name, family=family, description=desc, rarity=rarity, stacksOn=stacks, max=mx, how=how, icon=f'library/{pic}', status='supported', effect=effect))


held = lambda *h: {'kind': 'held', 'hooks': list(h)}
enc = lambda lasts, *mods: {'kind': 'encounter', 'lasts': lasts, 'mods': list(mods)}
money = lambda n, **ch: {'kind': 'money', 'amount': n, 'changes': ch}
care = lambda **k: {'kind': 'care', **k}
boost = lambda stat, st, turns=8: {'kind': 'battleBoost', 'boosts': [{'kind': 'stage', 'stat': stat, 'stages': st, 'turns': turns}]}
RUN = {'for': 'run'}
battles = lambda n: {'for': 'battles', 'count': n}
ALL = 'bug dark dragon electric fairy fighting fire flying ghost grass ground ice normal poison psychic rock steel water'.split()

# ---- all-type ribbons (held) ----
F = 'Ribbons (held, all types)'
for pic, id_, nm, pct, r in [('classic-ribbon-5', 'classic-ribbon-5', 'Classic Ribbon (5)', 5, 'uncommon'), ('classic-ribbon-10', 'classic-ribbon-10', 'Classic Ribbon (10)', 8, 'rare'),
                             ('classic-ribbon-15', 'classic-ribbon-15', 'Classic Ribbon (15)', 11, 'epic'), ('classic-ribbon-default', 'classic-ribbon', 'Classic Ribbon', 3, 'common'),
                             ('common-ribbon', 'common-ribbon', 'Common Ribbon', 4, 'common'), ('great-ribbon', 'great-ribbon', 'Great Ribbon', 7, 'uncommon'),
                             ('ultra-ribbon', 'ultra-ribbon', 'Ultra Ribbon', 10, 'rare'), ('rogue-ribbon', 'rogue-ribbon', 'Rogue Ribbon', 12, 'epic'), ('hardcore-ribbon', 'hardcore-ribbon', 'Hardcore Ribbon', 15, 'epic')]:
    add(pic, id_, nm, F, f'Moves of every type from the holder do {pct}% more', r, P, 2, 'held', held({'hook': 'typePower', 'types': ALL, 'percent': pct}))
add('ribbon-friendship', 'friendship-ribbon', 'Friendship Ribbon', F, 'The holder grows fond of you 50% faster', 'uncommon', P, 2, 'held', held({'hook': 'friendship', 'percent': 50}))
add('ribbon-typeless', 'typeless-ribbon', 'Typeless Ribbon', F, 'Normal moves of the holder do 25% more', 'uncommon', P, 2, 'held', held({'hook': 'typePower', 'types': ['normal'], 'percent': 25}))

# ---- new hold items ----
F = 'Held items (Drive pack)'
add('normal-memory', 'normal-memory', 'Normal Memory', F, 'Holder becomes Normal type (Silvally) / holds the Normal memory', 'rare', P, 1, 'held', held({'hook': 'memory', 'type': 'normal'}))
add('blastpowder', 'blast-powder', 'Blast Powder', F, 'Explosive Powder: the holder does 15% more damage and takes 5% of its max HP', 'rare', P, 1, 'held', held({'hook': 'power', 'percent': 15, 'recoil': 0.05}))
add('multi-lens', 'multi-lens', 'Multi Lens', F, "The holder's accuracy goes up 10%", 'uncommon', P, 2, 'held', held({'hook': 'accuracy', 'percent': 10}))
add('diffusion-lens', 'diffusion-lens', 'Diffusion Lens', F, "The holder's moves hit 15% more often", 'rare', P, 1, 'held', held({'hook': 'accuracy', 'percent': 15}))
add('magstone', 'mag-stone', 'Mag Stone', F, 'Steel moves of the holder do 20% more', 'uncommon', P, 2, 'held', held({'hook': 'typePower', 'types': ['steel'], 'percent': 20}))
add('sparklingstone', 'sparkling-stone', 'Sparkling Stone', F, 'Fairy and Psychic moves of the holder do 15% more', 'uncommon', P, 2, 'held', held({'hook': 'typePower', 'types': ['fairy', 'psychic'], 'percent': 15}))
add('soulstone', 'soul-stone', 'Soul Stone', F, 'Ghost moves of the holder do 20% more', 'uncommon', P, 2, 'held', held({'hook': 'typePower', 'types': ['ghost'], 'percent': 20}))
add('darkcore', 'dark-core', 'Dark Core', F, 'Dark moves of the holder do 20% more', 'uncommon', P, 2, 'held', held({'hook': 'typePower', 'types': ['dark'], 'percent': 20}))
add('soundgem', 'sound-gem', 'Sound Gem', F, 'One Normal move does 1.5x damage, then the gem is spent', 'uncommon', P, 2, 'held', held({'hook': 'gem', 'type': 'normal', 'multiplier': 1.5}))
add('mystical-rock', 'mystical-rock', 'Mystical Rock', F, 'Sun, rain, sand and snow set by the holder last 8 turns', 'rare', P, 1, 'held', held({'hook': 'weatherTurns', 'weathers': ['sun', 'rain', 'sand', 'snow'], 'turns': 8}))
add('percivalglass', 'percival-glass', 'Percival Glass', F, 'Holder shrugs off 10% of damage from wild Pokémon', 'rare', P, 1, 'held', held({'hook': 'damageTaken', 'percent': -10, 'fromWild': True}))
add('grubbyhanky', 'grubby-hanky', 'Grubby Hanky', F, 'Heals the holder 1/16 each turn', 'uncommon', P, 1, 'held', held({'hook': 'endTurn', 'fraction': 0.0625}))
add('falconryglove', 'falconry-glove', 'Falconry Glove', F, 'Flying moves of the holder do 20% more', 'uncommon', P, 2, 'held', held({'hook': 'typePower', 'types': ['flying'], 'percent': 20}))
add('talonsglove', 'talons-glove', "Talon's Glove", F, 'Physical moves of the holder do 10% more', 'rare', P, 2, 'held', held({'hook': 'categoryPower', 'category': 'physical', 'percent': 10}))
add('gearamulet', 'gear-amulet', 'Gear Amulet', F, 'Holder takes no weather damage', 'uncommon', P, 1, 'held', held({'hook': 'weatherImmune', 'weathers': ['sand', 'hail']}))
add('aquasuit', 'aqua-suit', 'Aqua Suit', F, 'Water moves of the holder do 20% more', 'uncommon', P, 2, 'held', held({'hook': 'typePower', 'types': ['water'], 'percent': 20}))
add('magmasuit', 'magma-suit', 'Magma Suit', F, 'Fire moves of the holder do 20% more', 'uncommon', P, 2, 'held', held({'hook': 'typePower', 'types': ['fire'], 'percent': 20}))
add('damienscarf', 'damiens-scarf', "Damien's Scarf", F, 'Flinches the foe 10% more often', 'rare', P, 1, 'held', held({'hook': 'flinch', 'percent': 10, 'bonus': 5}))
add('blacklantern', 'black-lantern', 'Black Lantern', F, 'Ghost and Dark moves of the holder do 12% more', 'uncommon', P, 2, 'held', held({'hook': 'typePower', 'types': ['ghost', 'dark'], 'percent': 12}))
add('goldenlantern', 'golden-lantern', 'Golden Lantern', F, 'Fire and Electric moves of the holder do 12% more', 'uncommon', P, 2, 'held', held({'hook': 'typePower', 'types': ['fire', 'electric'], 'percent': 12}))
add('goldenclaws', 'golden-claws', 'Golden Claws', F, 'Contact moves of the holder do 10% more', 'rare', P, 2, 'held', held({'hook': 'categoryPower', 'category': 'physical', 'percent': 10}))
add('goldenwings', 'golden-wings', 'Golden Wings', F, 'Flying moves of the holder do 25% more', 'rare', P, 1, 'held', held({'hook': 'typePower', 'types': ['flying'], 'percent': 25}))
add('goldenhammer', 'golden-hammer', 'Golden Hammer', F, 'Steel and Rock moves of the holder do 15% more', 'rare', P, 1, 'held', held({'hook': 'typePower', 'types': ['steel', 'rock'], 'percent': 15}))
add('goldenaxe', 'golden-axe', 'Golden Axe', F, 'Grass and Bug moves of the holder do 15% more', 'rare', P, 1, 'held', held({'hook': 'typePower', 'types': ['grass', 'bug'], 'percent': 15}))
add('golden-punch', 'golden-punch', 'Golden Punch', F, 'Fighting moves of the holder do 20% more', 'rare', P, 1, 'held', held({'hook': 'typePower', 'types': ['fighting'], 'percent': 20}))
add('goldensurfboard', 'golden-surfboard', 'Golden Surfboard', F, 'Water and Ice moves of the holder do 15% more', 'rare', P, 1, 'held', held({'hook': 'typePower', 'types': ['water', 'ice'], 'percent': 15}))
add('goldengauntlet', 'golden-gauntlet', 'Golden Gauntlet', F, 'Every move of the holder does 8% more', 'epic', P, 1, 'held', held({'hook': 'typePower', 'types': ALL, 'percent': 8}))
add('goldenscubagear', 'golden-scuba-gear', 'Golden Scuba Gear', F, 'Water and Ground moves of the holder do 15% more', 'rare', P, 1, 'held', held({'hook': 'typePower', 'types': ['water', 'ground'], 'percent': 15}))
add('goldenjetpack', 'golden-jetpack', 'Golden Jetpack', F, 'Holder gets the first move more often', 'epic', P, 1, 'held', held({'hook': 'dodgeFirst'}))
add('goldendriftboard', 'golden-driftboard', 'Golden Driftboard', F, 'Ice and Ground moves of the holder do 15% more', 'rare', P, 1, 'held', held({'hook': 'typePower', 'types': ['ice', 'ground'], 'percent': 15}))

# ---- battle cards ----
F = 'Battle boosters (X items, Dire Hit, Guard Spec.)'
for pic, id_, nm, stat, lab in [('atkcard', 'attack-card', 'Attack Card', 'atk', 'Attack'), ('defcard', 'defense-card', 'Defense Card', 'def', 'Defense'), ('spatkcard', 'sp-atk-card', 'Sp. Atk Card', 'spa', 'Sp. Atk'),
                                ('spdefcard', 'sp-def-card', 'Sp. Def Card', 'spd', 'Sp. Def'), ('speedcard', 'speed-card', 'Speed Card', 'spe', 'Speed')]:
    add(pic, id_, nm, F, f'+2 {lab} for the first 8 turns of its next battle', 'uncommon', P, 3, 'use', boost(stat, 2))
add('hpcard', 'hp-card', 'HP Card', 'Healing and status items', 'Heals 50 HP', 'common', P, None, 'use', care(heal=50))

# ---- healing and care ----
F = 'Healing and status items'
for pic, id_, nm, kw, d, r in [('wl-potion', 'wl-potion', 'Potion (Warp Lab)', dict(heal=20), 'Heals 20 HP', 'common'), ('wl-super-potion', 'wl-super-potion', 'Super Potion (Warp Lab)', dict(heal=60), 'Heals 60 HP', 'common'),
                               ('wl-hyper-potion', 'wl-hyper-potion', 'Hyper Potion (Warp Lab)', dict(heal=120), 'Heals 120 HP', 'uncommon'), ('wl-max-potion', 'wl-max-potion', 'Max Potion (Warp Lab)', dict(heal=9999), 'Heals fully', 'rare'),
                               ('wl-antidote', 'wl-antidote', 'Antidote (Warp Lab)', dict(cure=True), 'Cures status', 'common'), ('wl-awakening', 'wl-awakening', 'Awakening (Warp Lab)', dict(cure=True), 'Cures status', 'common'),
                               ('wl-burn-heal', 'wl-burn-heal', 'Burn Heal (Warp Lab)', dict(cure=True), 'Cures status', 'common'), ('wl-ice-heal', 'wl-ice-heal', 'Ice Heal (Warp Lab)', dict(cure=True), 'Cures status', 'common'),
                               ('wl-paralyze-heal', 'wl-paralyze-heal', 'Paralyze Heal (Warp Lab)', dict(cure=True), 'Cures status', 'common'), ('paralyzeheal', 'paralyze-heal-2', 'Paralyze Heal Plus', dict(cure=True, heal=20), 'Heals 20 HP and cures status', 'common'),
                               ('wl-full-heal', 'wl-full-heal', 'Full Heal (Warp Lab)', dict(cure=True, heal=40), 'Heals 40 HP and cures status', 'uncommon'), ('wl-full-restore', 'wl-full-restore', 'Full Restore (Warp Lab)', dict(cure=True, heal=9999), 'Heals fully and cures status', 'rare'),
                               ('wl-revive', 'wl-revive', 'Revive (Warp Lab)', dict(revive=0.5), 'Revives a fainted Pokémon with half HP', 'uncommon'), ('wl-max-revive', 'wl-max-revive', 'Max Revive (Warp Lab)', dict(revive=1), 'Revives a fainted Pokémon fully', 'rare'),
                               ('minrevive', 'min-revive', 'Min Revive', dict(revive=0.1), 'Revives a fainted Pokémon with 10% HP', 'common'), ('defibrillator', 'defibrillator', 'Defibrillator', dict(revive=0.5, friendship=-5), 'Revives a fainted Pokémon with half HP, a little scary', 'rare'),
                               ('ultrapotion', 'ultra-potion', 'Ultra Potion', dict(heal=150), 'Heals 150 HP', 'uncommon'), ('wl-elixir', 'wl-elixir', 'Elixir (Warp Lab)', dict(ppMove='lowest'), 'Restores PP to the move with the least', 'uncommon'),
                               ('wl-ether', 'wl-ether', 'Ether (Warp Lab)', dict(ppMove='lowest'), 'Restores PP to the move with the least', 'uncommon'), ('wl-max-ether', 'wl-max-ether', 'Max Ether (Warp Lab)', dict(ppMove='lowest'), 'Restores PP to the move with the least', 'rare'),
                               ('herbaltea', 'herbal-tea', 'Herbal Tea', dict(heal=30, cure=True), 'Heals 30 HP and cures status', 'common'), ('rosetea', 'rose-tea', 'Rose Tea', dict(heal=60, changes={'charisma': 1}), 'Heals 60 HP, +1 Charisma', 'uncommon'),
                               ('berry-juice-good', 'berry-juice', 'Berry Juice', dict(heal=40), 'Heals 40 HP', 'common'), ('nightmed', 'night-med', 'Night Med', dict(heal=80, changes={'goodEvil': -1}), 'Heals 80 HP, +1 Evil', 'uncommon'),
                               ('magicmoomilk', 'magic-moomoo-milk', 'Magic Moomoo Milk', dict(heal=140, changes={'love': 1}), 'Heals 140 HP, +1 Love', 'rare'), ('maxsoup', 'max-soup', 'Max Soup', dict(heal=100, cure=True), 'Heals 100 HP and cures status', 'rare')]:
    add(pic, id_, nm, F, d, r, P, None, 'use', care(**kw))
for pic, id_, nm, kw, d, r in [('gourmettreat', 'gourmet-treat', 'Gourmet Treat', dict(heal=0.3), 'Heals the whole team 30%', 'uncommon'), ('canaribread', 'canari-bread', 'Canari Bread', dict(heal=0.2), 'Heals the whole team 20%', 'common'),
                               ('chineseFood'.lower(), 'chinese-food', 'Takeout', dict(heal=0.25), 'Heals the whole team 25%', 'common'), ('funnelcake', 'funnel-cake', 'Funnel Cake', dict(heal=0.15), 'Heals the whole team 15%', 'common'),
                               ('thinmints', 'thin-mints', 'Thin Mints', dict(heal=0.15, changes={'love': 1}), 'Heals the whole team 15%, +1 Love', 'common'), ('strawcake', 'straw-cake', 'Strawberry Cake', dict(heal=0.4), 'Heals the whole team 40%', 'rare'),
                               ('agolisopoditea', 'agol-isopodi-tea', 'Agol Isopodi Tea', dict(heal=0.2, pp=5), 'Heals the whole team 20% and restores 5 PP', 'uncommon'), ('golisopoditea', 'gol-isopodi-tea', 'Gol Isopodi Tea', dict(heal=0.3, pp=10), 'Heals the whole team 30% and restores 10 PP', 'rare'),
                               ('chocolateic', 'chocolate-ice', 'Chocolate Ice Cream', dict(heal=0.2, cureSleep=True), 'Heals the whole team 20% and wakes sleepers', 'common'), ('vanillaic', 'vanilla-ice', 'Vanilla Ice Cream', dict(heal=0.2, cureSleep=True), 'Heals the whole team 20% and wakes sleepers', 'common'),
                               ('strawbic', 'strawberry-ice', 'Strawberry Ice Cream', dict(heal=0.2, cureSleep=True), 'Heals the whole team 20% and wakes sleepers', 'common')]:
    add(pic, id_, nm, F, d, r, T, None, 'use', {'kind': 'teamCare', **kw})
# butters (food, friendship + attributes)
for pic, id_, nm, kw, d in [('nicebutter', 'nice-butter', 'Nice Butter', dict(heal=40, changes={'goodEvil': 1}), 'Heals 40 HP, +1 Good'), ('amazingbutter', 'amazing-butter', 'Amazing Butter', dict(heal=80, changes={'luck': 1}), 'Heals 80 HP, +1 Luck'),
                            ('supremebutter', 'supreme-butter', 'Supreme Butter', dict(heal=120, changes={'love': 2}), 'Heals 120 HP, +2 Love'), ('hyperspacebutter', 'hyperspace-butter', 'Hyperspace Butter', dict(heal=200, changes={'luck': 2}), 'Heals 200 HP, +2 Luck'),
                            ('lumiosianbutter', 'lumiosian-butter', 'Lumiosian Butter', dict(heal=60, friendship=10), 'Heals 60 HP, friendship +10'), ('icerootcarrot', 'ice-root-carrot', 'Ice Root Carrot', dict(heal=50, changes={'strength': 1}), 'Heals 50 HP, +1 Strength'),
                            ('shaderootcarrot', 'shade-root-carrot', 'Shade Root Carrot', dict(heal=50, changes={'intelligence': 1}), 'Heals 50 HP, +1 Intelligence'), ('spicepowder', 'spice-powder', 'Spice Powder', dict(heal=30, changes={'ragePeace': 1}), 'Heals 30 HP, +1 toward Peace')]:
    add(pic, id_, nm, 'Food', d, 'uncommon', P, None, 'use', care(**kw))

# ---- valuables (money) ----
F = 'Valuables'
for pic, id_, nm, amt, r, ch in [('prettyfeather', 'pretty-feather', 'Pretty Feather', 200, 'common', {}), ('darkfeather', 'dark-feather', 'Dark Feather', 350, 'uncommon', {}), ('lightfeather', 'light-feather', 'Light Feather', 350, 'uncommon', {}),
                                 ('coupon', 'coupon', 'Coupon', 100, 'common', {}), ('giftcard', 'gift-card', 'Gift Card', 400, 'uncommon', {}), ('thankyoucard', 'thank-you-card', 'Thank-You Card', 150, 'common', {'love': 1}),
                                 ('festivalticket', 'festival-ticket', 'Festival Ticket', 500, 'uncommon', {'charisma': 1}), ('puppetcoin', 'puppet-coin', 'Puppet Coin', 600, 'uncommon', {}), ('wishingchip', 'wishing-chip', 'Wishing Chip', 800, 'rare', {'luck': 1}),
                                 ('goldenapple', 'golden-apple', 'Golden Apple', 1000, 'rare', {}), ('chestnut', 'chestnut', 'Chestnut', 120, 'common', {}), ('pumpkin', 'pumpkin', 'Pumpkin', 250, 'common', {}),
                                 ('hotelkey', 'hotel-key-2', 'Hotel Voucher', 300, 'common', {}), ('permit', 'permit', 'Permit', 450, 'uncommon', {}), ('trainpass', 'train-pass', 'Train Pass', 350, 'uncommon', {}),
                                 ('secretpatent', 'secret-patent', 'Secret Patent', 1200, 'rare', {'intelligence': 1}), ('updatedpatent', 'updated-patent', 'Updated Patent', 900, 'rare', {'intelligence': 1}), ('amberslet', 'amber-slet', 'Amber Bracelet', 700, 'uncommon', {}),
                                 ('spaceaspearl', 'space-pearl', 'Space Pearl', 1400, 'rare', {}), ('surgebadge', 'surge-badge', 'Surge Badge (replica)', 500, 'uncommon', {}), ('puzzlebox', 'puzzle-box', 'Puzzle Box', 650, 'uncommon', {'intelligence': 1}),
                                 ('chippedpot', 'chipped-pot-2', 'Chipped Pot Shard', 220, 'common', {}), ('masterpieceteacup', 'masterpiece-teacup', 'Masterpiece Teacup', 1800, 'epic', {})]:
    add(pic, id_, nm, F, f'Sell for ${amt}' + (''.join(f', +{v} {k.title()}' for k, v in ch.items())), r, Y, None, 'use', money(amt, **ch))

# ---- charms and gear (perks and passives) ----
F = 'Charms'
add('golden-exp-charm', 'golden-exp-charm', 'Golden EXP Charm', F, 'Next 5 battles give 50% more experience', 'epic', Y, 2, 'use', enc(battles(5), {'mod': 'exp', 'percent': 50}))
add('super-exp-charm', 'super-exp-charm', 'Super EXP Charm', F, 'Next 5 battles give 25% more experience', 'rare', Y, 2, 'use', enc(battles(5), {'mod': 'exp', 'percent': 25}))
add('super-lure', 'super-lure-2', 'Super Lure', F, 'The next 5 wild battles show a rare Pokémon', 'rare', Y, 3, 'use', enc(battles(5), {'mod': 'rare'}))
add('maxlure', 'max-lure', 'Max Lure', F, 'The next 8 wild battles show a rare Pokémon', 'epic', Y, 2, 'use', enc(battles(8), {'mod': 'rare'}))
add('scentedlure', 'scented-lure', 'Scented Lure', F, 'The next 3 wild battles are 1.5x easier to catch', 'uncommon', Y, 3, 'use', enc(battles(3), {'mod': 'catch', 'multiplier': 1.5}))
add('mirrorlure', 'mirror-lure', 'Mirror Lure', F, 'The next 3 wild battles show any type', 'uncommon', Y, 3, 'use', enc(battles(3), {'mod': 'anyType'}))
add('golden-net', 'golden-net', 'Golden Net', F, 'Every wild Pokémon is 1.3x easier to catch', 'epic', Y, 1, 'passive', enc(RUN, {'mod': 'catch', 'multiplier': 1.3}))
add('lucky-punch-great', 'lucky-punch-great', 'Lucky Punch (Great)', F, 'Next 3 wild battles: you move first free turn', 'rare', Y, 3, 'use', enc(battles(3), {'mod': 'freeTurn'}))
add('lucky-punch-ultra', 'lucky-punch-ultra', 'Lucky Punch (Ultra)', F, 'Next 5 wild battles: you get a free turn', 'epic', Y, 3, 'use', enc(battles(5), {'mod': 'freeTurn'}))
add('lucky-punch-master', 'lucky-punch-master', 'Lucky Punch (Master)', F, 'Next 8 wild battles: you get a free turn', 'epic', Y, 2, 'use', enc(battles(8), {'mod': 'freeTurn'}))
add('roamingcharm', 'roaming-charm', 'Roaming Charm', F, 'Next 5 wild battles: rare Pokémon are slower', 'uncommon', Y, 3, 'use', enc(battles(5), {'mod': 'foeSpeed', 'stages': -1}))
add('shaydascharm', 'shaydas-charm', "Shayda's Charm", F, 'Next 3 wild battles: Pokémon are 2x as likely shiny', 'rare', Y, 2, 'use', enc(battles(3), {'mod': 'shiny', 'multiplier': 2}))
add('apricorncharm', 'apricorn-charm', 'Apricorn Charm', F, 'Next 3 throws x1.5 catch rate', 'uncommon', Y, 3, 'use', enc({'for': 'throws', 'count': 3}, {'mod': 'catch', 'multiplier': 1.5}))
add('levelcapcharm', 'level-cap-charm', 'Level Cap Charm', F, 'Next 3 wild battles: wild Pokémon are 2 levels lower', 'uncommon', Y, 3, 'use', enc(battles(3), {'mod': 'level', 'amount': -2}))
add('effortcharm', 'effort-charm', 'Effort Charm', F, '+4 Strength', 'uncommon', Y, None, 'use', {'kind': 'attributes', 'changes': {'strength': 4}})
add('hiddencharm', 'hidden-charm', 'Hidden Charm', F, '+3 Luck', 'uncommon', Y, None, 'use', {'kind': 'attributes', 'changes': {'luck': 3}})
add('balancecharm', 'balance-charm', 'Balance Charm', F, '+2 Love, +2 Good and +2 toward Peace', 'rare', Y, None, 'use', {'kind': 'attributes', 'changes': {'love': 2, 'goodEvil': 2, 'ragePeace': 2}})
add('naturecharm', 'nature-charm', 'Nature Charm', F, '+3 Love', 'uncommon', Y, None, 'use', {'kind': 'attributes', 'changes': {'love': 3}})
add('elementcharm', 'element-charm', 'Element Charm', F, '+3 Intelligence', 'uncommon', Y, None, 'use', {'kind': 'attributes', 'changes': {'intelligence': 3}})
add('linkcharm', 'link-charm', 'Link Charm', F, '+4 Love', 'uncommon', Y, None, 'use', {'kind': 'attributes', 'changes': {'love': 4}})
add('twincharm', 'twin-charm', 'Twin Charm', F, '+2 Love, +2 Charisma', 'uncommon', Y, None, 'use', {'kind': 'attributes', 'changes': {'love': 2, 'charisma': 2}})
add('viralcharm', 'viral-charm', 'Viral Charm', F, '+4 Charisma', 'uncommon', Y, None, 'use', {'kind': 'attributes', 'changes': {'charisma': 4}})
add('triptriadcharm', 'triple-triad-charm', 'Triple Triad Charm', F, '+3 Intelligence, +1 Luck', 'uncommon', Y, None, 'use', {'kind': 'attributes', 'changes': {'intelligence': 3, 'luck': 1}})
add('craftingcharm', 'crafting-charm', 'Crafting Charm', F, 'Prize money from trainers +15%', 'uncommon', T, 3, 'passive', {'kind': 'passive', 'passive': 'trainerMoney', 'percent': 15})
add('slotscharm', 'slots-charm', 'Slots Charm', F, 'Prize money from trainers +20%', 'rare', T, 3, 'passive', {'kind': 'passive', 'passive': 'trainerMoney', 'percent': 20})
add('tradingcharm', 'trading-charm', 'Trading Charm', F, 'Shops sell 8% cheaper', 'rare', Y, 2, 'passive', {'kind': 'perk', 'lasts': RUN, 'perks': [{'perk': 'discount', 'percent': 8}]})
add('pointscharm', 'points-charm', 'Points Charm', F, 'Earn an extra point every 10 trainers', 'rare', Y, 1, 'passive', {'kind': 'perk', 'lasts': RUN, 'perks': [{'perk': 'points', 'every': 10}]})
add('promocharm', 'promo-charm', 'Promo Charm', F, 'Shops sell 10% cheaper', 'rare', Y, 1, 'passive', {'kind': 'perk', 'lasts': RUN, 'perks': [{'perk': 'discount', 'percent': 10}]})
add('markcharm', 'mark-charm', 'Mark Charm', F, 'Shows what the next trainers will bring', 'uncommon', Y, 1, 'passive', {'kind': 'perk', 'lasts': RUN, 'perks': [{'perk': 'preview', 'what': 'trainers'}]})

# ---- eggs ----
F = 'Capture and party items'
for pic, id_, nm, st, sh, r in [('common-egg', 'common-egg', 'Common Egg', 3, 1, 'common'), ('rare-egg', 'rare-egg', 'Rare Egg', 3, 3, 'rare'), ('epic-egg', 'epic-egg', 'Epic Egg', 2, 6, 'epic'),
                                ('legendary-egg', 'legendary-egg', 'Legendary Egg', 2, 12, 'epic'), ('rogue-egg', 'rogue-egg', 'Rogue Egg', 2, 8, 'epic'), ('golden-egg', 'golden-egg', 'Golden Egg', 2, 16, 'epic'),
                                ('manaphy-egg', 'manaphy-egg', 'Manaphy Egg', 2, 4, 'rare')]:
    add(pic, id_, nm, F, f'Hatches after {st} stages into a random first-stage Pokémon (shiny chance x{sh})', r, Y, None, 'use', {'kind': 'egg', 'stages': st, 'shiny': sh})

# ---- write ----
cat_p, ids_p = f'{REPO}/src/data/itemCatalog.json', f'{REPO}/tools/drive/library-items2.json'
old = set(json.load(open(ids_p))) if os.path.exists(ids_p) else set()
catalog = [e for e in json.load(open(cat_p, encoding='utf-8')) if e['id'] not in old]
taken = {e['id'] for e in catalog}
lib = {f[:-4] for f in os.listdir(f'{REPO}/public/assets/images/items/library')}
for e in ITEMS:
    pic = e['icon'].split('/')[-1]
    if e['id'] in taken or pic not in lib:
        print(f"skipped {e['id']}: exists or no picture {pic}")
        e['skip'] = True
        continue
    taken.add(e['id'])
ITEMS = [e for e in ITEMS if not e.get('skip')]
open(cat_p, 'w', encoding='utf-8').write(json.dumps(catalog + ITEMS, indent=1, ensure_ascii=False) + '\n')
open(ids_p, 'w').write(json.dumps(sorted(e['id'] for e in ITEMS), indent=1) + '\n')
print(len(ITEMS), 'catalog items')
