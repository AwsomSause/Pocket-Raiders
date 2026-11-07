"""P4: wires pictures from images/items/library into the game as catalog items (and rewards), each with an effect the game already runs.

  python3 -I tools/drive/wire-library.py <repo>

Entries use icon "library/<name>" (no copying). Re-running replaces the ids listed in tools/drive/library-items.json.
Pictures still unused are listed by tools/drive/library-report.py.
"""
import json
import os
import sys

REPO = sys.argv[1]
P, T, Y = 'pokemon', 'team', 'player'
ITEMS, REWARDS = [], []


def add(pic, id_, name, family, desc, rarity, stacks, mx, how, effect):
    ITEMS.append(dict(id=id_, name=name, family=family, description=desc, rarity=rarity, stacksOn=stacks, max=mx, how=how, icon=f'library/{pic}', status='supported', effect=effect))


held = lambda *h: {'kind': 'held', 'hooks': list(h)}
enc = lambda lasts, *mods, ch=None: {k: v for k, v in {'kind': 'encounter', 'lasts': lasts, 'mods': list(mods), 'changes': ch}.items() if v}
money = lambda n, **ch: {'kind': 'money', 'amount': n, 'changes': ch}
RUN = {'for': 'run'}
battles = lambda n: {'for': 'battles', 'count': n}

# ---- teach-a-move machines ----
F = 'TMs and HMs'
add('tm-fairy', 'tm-fairy', 'TM (Fairy)', F, 'Teach 1 of 3 random Fairy moves the Pokémon can learn', 'uncommon', P, None, 'use', {'kind': 'teachMove', 'type': 'fairy', 'mode': 'tm'})
add('machine-fairy', 'hm-fairy', 'HM (Fairy)', F, 'Teach any Fairy move the Pokémon can learn', 'rare', P, None, 'use', {'kind': 'teachMove', 'type': 'fairy', 'mode': 'hm'})

# ---- temporary mints (3 won battles) ----
F = 'Natures and Mints'
for pic, nat, label in [('mint-atk', 'adamant', 'Attack'), ('mint-def', 'bold', 'Defense'), ('mint-spatk', 'modest', 'Sp. Atk'), ('mint-spd', 'timid', 'Speed'), ('mint-spdef', 'calm', 'Sp. Def'), ('mint-neutral', 'hardy', 'Neutral'),
                        ('mintblue', 'careful', 'Blue'), ('mintcyan', 'impish', 'Cyan'), ('mintgreen', 'jolly', 'Green'), ('mintpink', 'gentle', 'Pink'), ('mintred', 'brave', 'Red'), ('mintyellow', 'hasty', 'Yellow'), ('mystic-mint', 'quiet', 'Mystic')]:
    add(pic, f'temp-{pic}', f'Fresh {label} Mint', F, f'Changes a Pokémon to the {nat.title()} nature for its next 3 won battles, then its own nature returns', 'common', P, None, 'use', {'kind': 'nature', 'nature': nat, 'battles': 3})

# ---- hyper berries ----
F = 'Berries (held, eaten in battle)'
CURE = {'aspear': (['frz'], 'freeze'), 'cheri': (['par'], 'paralysis'), 'chesto': (['slp'], 'sleep'), 'pecha': (['psn'], 'poison'), 'rawst': (['brn'], 'burn')}
for b, (st, nm) in CURE.items():
    add(f'hyper{b}berry', f'hyper-{b}-berry', f'Hyper {b.title()} Berry', F, f'Cures {nm}, then heals 20% (below 50% HP once cured)', 'rare', P, 2, 'held', held({'hook': 'berryCure', 'statuses': st}, {'hook': 'berryHeal', 'below': 0.5, 'fraction': 0.2}))
add('hyperpersimberry', 'hyper-persim-berry', 'Hyper Persim Berry', F, 'Cures confusion and heals 20% below 50% HP', 'rare', P, 2, 'held', held({'hook': 'berryCure', 'statuses': [], 'confusion': True}, {'hook': 'berryHeal', 'below': 0.5, 'fraction': 0.2}))
add('hyperlumberry', 'hyper-lum-berry', 'Hyper Lum Berry', F, 'Cures any status or confusion and heals 20% below 50% HP', 'epic', P, 2, 'held', held({'hook': 'berryCure', 'statuses': ['par', 'slp', 'psn', 'brn', 'frz'], 'confusion': True}, {'hook': 'berryHeal', 'below': 0.5, 'fraction': 0.2}))
add('hyperoranberry', 'hyper-oran-berry', 'Hyper Oran Berry', F, 'Below 50% HP: heals 30 HP', 'uncommon', P, 5, 'held', held({'hook': 'berryHeal', 'below': 0.5, 'flat': 30}))
add('hypersitrusberry', 'hyper-sitrus-berry', 'Hyper Sitrus Berry', F, 'Below 50% HP: heals 50% max HP', 'rare', P, 3, 'held', held({'hook': 'berryHeal', 'below': 0.5, 'fraction': 0.5}))
for b, fr, ch, what in [('pomeg', 40, {'love': 2}, '+2 Love'), ('kelpsy', 30, {'ragePeace': 2}, '+2 toward Peace'), ('qualot', 30, {'goodEvil': 2}, '+2 Good'), ('hondew', 30, {'intelligence': 2}, '+2 Intelligence'), ('grepa', 30, {'charisma': 2}, '+2 Charisma'), ('tamato', 30, {'strength': 2}, '+2 Strength')]:
    add(f'hyper{b}berry', f'hyper-{b}-berry', f'Hyper {b.title()} Berry', F, f'Feed to a Pokémon: huge friendship boost, {what}', 'uncommon', P, None, 'use', {'kind': 'feed', 'friendship': fr, 'changes': ch})
add('razztart', 'razz-tart', 'Razz Tart', F, 'Next wild Pokémon is 2x easier to catch', 'uncommon', Y, 3, 'use', enc(battles(1), {'mod': 'catch', 'multiplier': 2}))

# ---- apricorns ----
F = 'Capture and party items'
for pic, nm, types in [('blackapricorn', 'Black Apricorn', ['dark', 'poison']), ('blueapricorn', 'Blue Apricorn', ['water', 'ice']), ('greenapricorn', 'Green Apricorn', ['grass', 'bug']), ('pinkapricorn', 'Pink Apricorn', ['fairy', 'psychic']),
                       ('yellowapricorn', 'Yellow Apricorn', ['electric', 'ground']), ('hisuianapricorn', 'Hisuian Apricorn', ['rock', 'steel'])]:
    add(pic, pic.replace('apricorn', '-apricorn'), nm, F, f"Next 3 throws at {' or '.join(t.title() for t in types)} Pokémon x2.5 catch rate", 'uncommon', Y, 5, 'use', enc({'for': 'throws', 'count': 3}, {'mod': 'catch', 'multiplier': 2.5, 'types': types}))
add('whiteapricorn', 'white-apricorn', 'White Apricorn', F, 'Next 3 throws at shiny Pokémon x3 catch rate', 'rare', Y, 5, 'use', enc({'for': 'throws', 'count': 3}, {'mod': 'catch', 'multiplier': 3, 'shiny': True}))

# ---- sweets (friendship food) ----
F = 'Sweets'
for pic, nm, fr, ch, what in [('berrysweet', 'Berry Sweet', 10, {'love': 1}, '+1 Love'), ('cloversweet', 'Clover Sweet', 10, {'luck': 1}, '+1 Luck'), ('flowersweet', 'Flower Sweet', 10, {'ragePeace': 1}, '+1 toward Peace'), ('ribbonsweet', 'Ribbon Sweet', 10, {'charisma': 1}, '+1 Charisma'), ('starsweet', 'Star Sweet', 15, {'goodEvil': 1}, '+1 Good')]:
    add(pic, pic.replace('sweet', '-sweet'), nm, F, f'Feed to a Pokémon: friendship boost, {what}', 'common', P, None, 'use', {'kind': 'feed', 'friendship': fr, 'changes': ch})

# ---- gems and shards (money) ----
F = 'Valuables'
for pic, nm, amt, r, ch in [('crackedpearl', 'Cracked Pearl', 150, 'common', {}), ('crackeddiamond', 'Cracked Diamond', 500, 'uncommon', {}), ('tiempasdiamond', "Tiempa's Diamond", 1500, 'rare', {'luck': 1}),
                            ('aquamarineore', 'Aquamarine Ore', 400, 'uncommon', {}), ('blackshard', 'Black Shard', 300, 'common', {}), ('blackshard2', 'Dark Shard', 600, 'uncommon', {}), ('crystalshard', 'Crystal Shard', 800, 'uncommon', {}),
                            ('umbralshard', 'Umbral Shard', 1000, 'rare', {}), ('megashard', 'Mega Shard', 1200, 'rare', {}), ('meteoriteshard', 'Meteorite Shard', 700, 'uncommon', {}), ('bustershard', 'Buster Shard', 500, 'uncommon', {}),
                            ('starshard1', 'Star Shard (Red)', 250, 'common', {}), ('starshard2', 'Star Shard (Blue)', 250, 'common', {}), ('starshard3', 'Star Shard (Yellow)', 250, 'common', {}), ('starshard4', 'Star Shard (Green)', 250, 'common', {}),
                            ('redgem', 'Red Gem', 900, 'rare', {}), ('jeweloflife', 'Jewel of Life', 2000, 'epic', {'love': 2})]:
    add(pic, pic.replace('2', '-2') if pic[-1].isdigit() and pic.startswith('black') else pic.replace('shard', '-shard').replace('ore', '-ore').replace('crackedpearl', 'cracked-pearl').replace('crackeddiamond', 'cracked-diamond').replace('tiempasdiamond', 'tiempas-diamond').replace('redgem', 'red-gem').replace('jeweloflife', 'jewel-of-life').replace('aquamarine', 'aquamarine'), nm, F, f'Worth {amt} money' + (''.join(f'; +{v} {k.title()}' for k, v in ch.items())), r, Y, None, 'use', money(amt, **ch))

# ---- type ribbons (held type boost) ----
F = 'Ribbons (held, one type)'
for t in 'bug dark dragon electric fairy fighting fire flying ghost grass ground ice normal poison psychic rock steel water'.split():
    add(f'ribbon-{t}', f'{t}-ribbon', f'{t.title()} Ribbon', F, f'{t.title()} moves of the holder do 10% more', 'uncommon', P, 3, 'held', held({'hook': 'typePower', 'types': [t], 'percent': 10}))

# ---- charms ----
F = 'Charms'
add('berrycharm', 'berry-charm', 'Berry Charm', F, 'Berries heal 20% more', 'rare', Y, 1, 'passive', {'kind': 'passive', 'passive': 'berryHeal', 'percent': 20})
add('safaricharm', 'safari-charm', 'Safari Charm', F, 'Every wild Pokémon is 1.15x easier to catch', 'uncommon', Y, 1, 'passive', enc(RUN, {'mod': 'catch', 'multiplier': 1.15}))
add('wishingcharm', 'wishing-charm', 'Wishing Charm', F, 'Next 5 wild battles: the strongest of three Pokémon appears', 'rare', Y, 3, 'use', enc(battles(5), {'mod': 'rare'}))
add('repelcharm', 'repel-charm', 'Repel Charm', F, 'Skips the next 3 wild battles', 'uncommon', Y, 3, 'use', enc(battles(3), {'mod': 'repel'}))
add('frugalcharm', 'frugal-charm', 'Frugal Charm', F, 'Prize money from trainers +10% per copy', 'uncommon', T, 5, 'passive', {'kind': 'passive', 'passive': 'trainerMoney', 'percent': 10})
add('heritagecharm', 'heritage-charm', 'Heritage Charm', F, 'Pokémon far below the team level catch up faster', 'rare', T, 1, 'passive', {'kind': 'passive', 'passive': 'catchUpExp', 'percent': 25})
add('spiritcharm', 'spirit-charm', 'Spirit Charm', F, '+3 Love and +2 toward Peace', 'uncommon', Y, None, 'use', {'kind': 'attributes', 'changes': {'love': 3, 'ragePeace': 2}})
add('purifycharm', 'purify-charm', 'Purify Charm', F, '+5 Good', 'uncommon', Y, None, 'use', {'kind': 'attributes', 'changes': {'goodEvil': 5}})
add('corruptcharm', 'corrupt-charm', 'Corrupt Charm', F, '+5 Evil', 'uncommon', Y, None, 'use', {'kind': 'attributes', 'changes': {'goodEvil': -5}})
add('smartcharm', 'smart-charm', 'Smart Charm', F, '+4 Intelligence', 'uncommon', Y, None, 'use', {'kind': 'attributes', 'changes': {'intelligence': 4}})
add('hardcharm', 'hard-charm', 'Hard Charm', F, '+4 Strength', 'uncommon', Y, None, 'use', {'kind': 'attributes', 'changes': {'strength': 4}})
add('easycharm', 'easy-charm', 'Easy Charm', F, '+4 toward Peace', 'uncommon', Y, None, 'use', {'kind': 'attributes', 'changes': {'ragePeace': 4}})
add('contestcharm', 'contest-charm', 'Contest Charm', F, '+4 Charisma', 'uncommon', Y, None, 'use', {'kind': 'attributes', 'changes': {'charisma': 4}})

# ---- candies: removed (Kice, 2026-11-07: "Remove EXP candies"); the level candies are no longer draft cards ----

# ---- write ----
cat_p, rew_p, ids_p = (f'{REPO}/src/data/itemCatalog.json', f'{REPO}/src/data/rewards.json', f'{REPO}/tools/drive/library-items.json')
old = set(json.load(open(ids_p))) if os.path.exists(ids_p) else set()
catalog = [e for e in json.load(open(cat_p, encoding='utf-8')) if e['id'] not in old]
rewards = [e for e in json.load(open(rew_p, encoding='utf-8')) if e['id'] not in old]
taken = {e['id'] for e in catalog} | {e['id'] for e in rewards}
lib = {f[:-4] for f in os.listdir(f'{REPO}/public/assets/images/items/library')}
for e in ITEMS + REWARDS:
    if e['id'] in taken:
        sys.exit(f'{e["id"]} already exists')
    pic = (e.get('icon') or e['iconAssetId']).split('/')[-1]
    if pic not in lib:
        sys.exit(f'no library picture {pic}')
    taken.add(e['id'])
dump = lambda p, d: open(p, 'w', encoding='utf-8').write(json.dumps(d, indent=1, ensure_ascii=False) + '\n')
dump(cat_p, catalog + ITEMS)
dump(rew_p, rewards + REWARDS)
dump(ids_p, sorted(e['id'] for e in ITEMS + REWARDS))
print(len(ITEMS), 'catalog items,', len(REWARDS), 'rewards')
