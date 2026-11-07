"""Batch C of "give every remaining picture a use": consumables, scents, Warp Lab items, eggs, dolls and the Canari Pal upgrade line.

  python3 -I tools/drive/wire-library3-supplies.py <repo>
Also writes src/data/events/plushWorkshop.json (five "Plush Workshop" events that trade a Pal up one level for a fee).
"""
import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wire3_common.py')).read())

F = 'Supplies (Drive pack 3)'
once = lambda n=1: {'for': 'manual', 'count': n}
# ---- food and drink ----
add('berry-juice-bad', 'bitter-berry-juice', 'Bitter Berry Juice', F, 'Heals 30 HP, +1 Evil', 'common', P, None, 'use', care(heal=30, changes={'goodEvil': -1}))
add('berry-juice-good', 'sweet-berry-juice', 'Sweet Berry Juice', F, 'Heals 50 HP, friendship +3', 'common', P, None, 'use', care(heal=50, friendship=3))
add('greatbutter', 'great-butter', 'Great Butter', F, 'Heals 100 HP, +1 Strength', 'uncommon', P, None, 'use', care(heal=100, changes={'strength': 1}))
add('hopoberry', 'hopo-berry', 'Hopo Berry', F, 'Restores PP to the move with the least', 'uncommon', P, None, 'use', care(ppMove='lowest'))
add('mythicalpechaberry', 'mythical-pecha-berry', 'Mythical Pecha Berry', F, 'Heals fully and cures status', 'rare', P, None, 'use', care(heal=9999, cure=True))
add('pechaberry2', 'pecha-berry-plus', 'Pecha Berry Plus', F, 'The holder eats it when poisoned or paralyzed and is cured', 'uncommon', P, 2, 'held', held({'hook': 'berryCure', 'statuses': ['psn', 'par']}))
add('rednectar', 'red-nectar', 'Red Nectar', F, 'Heals 40 HP, +1 Luck', 'uncommon', P, None, 'use', care(heal=40, changes={'luck': 1}))
add('arbolivaoil', 'arboliva-oil', 'Arboliva Oil', F, 'Heals 70 HP, friendship +5', 'uncommon', P, None, 'use', care(heal=70, friendship=5))
add('supervial', 'super-vial', 'Super Vial', F, 'Heals 150 HP and cures status', 'rare', P, None, 'use', care(heal=150, cure=True))
add('epicenoire', 'epice-noire', 'Épice Noire', F, 'Heals fully, +1 Evil', 'rare', P, None, 'use', care(heal=9999, changes={'goodEvil': -1}))
add('apophyllpan', 'apophyll-pan', 'Apophyll Pan', F, 'Cooks a hearty meal: heals the whole team 35%, +1 Love', 'rare', T, None, 'use', tcare(heal=0.35, changes={'love': 1}))
add('originessencezyg', 'origin-essence', 'Origin Essence', F, 'Heals the whole team 60% and wakes sleepers', 'epic', T, None, 'use', tcare(heal=0.6, cureSleep=True))
add('rebornflower', 'reborn-flower', 'Reborn Flower', F, 'Revives a fainted Pokémon with full HP', 'epic', P, None, 'use', care(revive=1, cure=True))
add('ppall', 'pp-all', 'PP All', F, 'Restores all PP of the whole team', 'rare', T, None, 'use', tcare(pp=-1))
add('wl-max-elixir', 'wl-max-elixir-2', 'Max Elixir (Warp Lab)', F, 'Restores 10 PP to every move of the whole team', 'rare', T, None, 'use', tcare(pp=10))
add('freshstartmochi', 'fresh-start-mochi', 'Fresh Start Mochi', F, 'Wipes all of a Pokémon’s EVs so you can train it again', 'rare', P, None, 'use', feed(0, evs={s: -252 for s in ['hp', 'atk', 'def', 'spa', 'spd', 'spe']}))
# ---- scents and powders ----
add('excitescent', 'excite-scent', 'Excite Scent', F, 'The next 3 wild battles give 30% more EXP', 'uncommon', Y, 3, 'use', enc(battles(3), {'mod': 'exp', 'percent': 30}))
add('joyscent', 'joy-scent', 'Joy Scent', F, 'The next 3 wild battles are 1.4x easier to catch, +1 Love', 'uncommon', Y, 3, 'use', enc(battles(3), {'mod': 'catch', 'multiplier': 1.4}, love=1))
add('vividscent', 'vivid-scent', 'Vivid Scent', F, 'The next 2 wild battles show a rare Pokémon of any type', 'rare', Y, 3, 'use', enc(battles(2), {'mod': 'rare'}, {'mod': 'anyType'}))
add('farawayessence', 'faraway-essence', 'Faraway Essence', F, 'The next 3 wild battles: Pokémon are 1.5x as likely shiny', 'rare', Y, 2, 'use', enc(battles(3), {'mod': 'shiny', 'multiplier': 1.5}))
add('emotionpowder', 'emotion-powder', 'Emotion Powder', F, '+2 Love, +2 Charisma', 'uncommon', Y, None, 'use', attrs(love=2, charisma=2))
add('smileburst', 'smile-burst', 'Smile Burst', F, '+3 Charisma, +1 Luck', 'uncommon', Y, None, 'use', attrs(charisma=3, luck=1))
add('nightmarefuel', 'nightmare-fuel', 'Nightmare Fuel', F, '+3 Evil, +2 toward Rage', 'uncommon', Y, None, 'use', attrs(goodEvil=-3, ragePeace=2))
add('hoenniansalt', 'hoennian-salt', 'Hoennian Salt', F, "Your whole team can't fall asleep in its next battle", 'uncommon', T, 3, 'use', boost({'kind': 'immune', 'status': 'slp'}))
add('vialofglitter', 'vial-of-glitter', 'Vial of Glitter', F, 'Sell for ₽700, +1 Charisma', 'uncommon', Y, None, 'use', money(700, charisma=1))
add('goocibag', 'gooci-bag', 'Gooci Bag', F, 'Sell for ₽900, +2 Charisma', 'rare', Y, None, 'use', money(900, charisma=2))
# ---- toys and comforts ----
add('sprinklotad', 'sprinklotad', 'Sprinklotad', F, 'Between levels, water a Pokémon: friendship up (more than a Wailmer Pail)', 'uncommon', Y, 1, 'passive', perk({'perk': 'pail', 'friendship': 8}))
add('babymonitor', 'baby-monitor', 'Baby Monitor', F, 'Eggs hatch faster: every Egg gets one extra step toward hatching each time', 'rare', Y, 1, 'passive', perk({'perk': 'ovalCharm'}))
add('clefairy-doll', 'clefairy-doll', 'Clefairy Doll', F, 'The next 2 wild battles are skipped (the level still counts)', 'uncommon', Y, 3, 'use', enc(battles(2), {'mod': 'repel'}))
# ---- Warp Lab battle items (go into the Bag, used in battle) ----
add('wl-ability-urge', 'wl-ability-urge', 'Ability Urge (Warp Lab)', F, 'Two Ability Urges go into your Bag: trigger the Pokémon in battle’s ability now', 'uncommon', Y, 3, 'use', {'kind': 'bagItem', 'item': 'ability-urge', 'count': 2})
add('wl-item-urge', 'wl-item-urge', 'Item Urge (Warp Lab)', F, 'Two Item Urges go into your Bag: use the held Berry or Herb now', 'uncommon', Y, 3, 'use', {'kind': 'bagItem', 'item': 'item-urge', 'count': 2})
add('wl-reset-urge', 'wl-reset-urge', 'Reset Urge (Warp Lab)', F, 'Two Reset Urges go into your Bag: reset every stat change in battle', 'uncommon', Y, 3, 'use', {'kind': 'bagItem', 'item': 'reset-urge', 'count': 2})
add('wl-item-drop', 'wl-item-drop', 'Item Drop (Warp Lab)', F, 'Two Item Drops go into your Bag (see the Bag for what they do in battle)', 'uncommon', Y, 3, 'use', {'kind': 'bagItem', 'item': 'item-drop', 'count': 2})
add('wl-guard-spec', 'wl-guard-spec', 'Guard Spec. (Warp Lab)', F, "Your whole team can't have its stats lowered for 6 turns of its next battle", 'uncommon', T, 3, 'use', boost({'kind': 'guard', 'turns': 6}))
add('wl-custom-spliced', 'wl-custom-spliced', 'Spliced Egg (Warp Lab)', F, 'Hatches after 2 stages into a random first-stage Pokémon (shiny chance x2)', 'rare', Y, None, 'use', {'kind': 'egg', 'stages': 2, 'shiny': 2})
add('wl-custom-thief', 'wl-custom-thief', 'Sticky Fingers (Warp Lab)', F, 'The holder steals 20% of the foe’s prize money when it wins', 'rare', P, 1, 'held', held({'hook': 'steal', 'percent': 20}))

# ---- Canari Pals: three levels per colour, traded up at the Plush Workshop ----
G = 'Canari Pals (upgrade line)'
colours = {
    'red': ('Red', 'Prize money from trainers', lambda v: passive('trainerMoney', v), [5, 10, 18], '+{}%'),
    'blue': ('Blue', 'Healing berries heal', lambda v: passive('berryHeal', v), [15, 30, 50], '{}% more'),
    'green': ('Green', 'Feeding a Pokémon gives', lambda v: passive('feedFriendship', v), [25, 50, 100], '{}% more friendship'),
    'pink': ('Pink', 'Every stage cleared gives', lambda v: passive('stageCharisma', v), [1, 2, 3], '+{} Charisma'),
    'gold': ('Gold', 'Money from battles', lambda v: passive('money', v), [5, 10, 20], '+{}%'),
}
RARE = ['uncommon', 'rare', 'epic']
events = []
for key, (nm, what, eff, vals, fmt) in colours.items():
    for lv in (1, 2, 3):
        add(f'{key}canariplushlv{lv}', f'{key}-canari-pal-{lv}', f'{nm} Canari Pal Lv.{lv}', G, f'{what} {fmt.format(vals[lv - 1])}' + ('' if lv == 3 else ' (the Plush Workshop can upgrade it)'), RARE[lv - 1], Y, 1, 'passive', eff(vals[lv - 1]))
    step = lambda a, b, fee, txt: {'label': f'Lv.{a} to Lv.{b} (₽{fee})', 'requires': [{'kind': 'item', 'id': f'{key}-canari-pal-{a}'}, {'kind': 'money', 'atLeast': fee}], 'success': {'text': txt, 'effects': [{'kind': 'money', 'amount': -fee}, {'kind': 'loseItem', 'id': f'{key}-canari-pal-{a}'}, {'kind': 'item', 'id': f'{key}-canari-pal-{b}', 'count': 1}]}}
    events.append({'id': f'plush-workshop-{key}', 'name': f'Plush Workshop: {nm} Pals', 'group': 'Plush Workshop', 'rarity': 'uncommon', 'minStage': 1, 'scene': {'cast': [], 'effect': 'glint'},
                   'intro': f'A stall of stitched Canari pals. "Bring me a {nm.lower()} one and I will sew it up a level. Thread costs money, love is free."',
                   'choices': [step(1, 2, 500, 'New stitching and a bigger bow. Lv.2!'), step(2, 3, 1200, 'Gold thread at the seams. Lv.3!'), {'label': 'Walk on', 'success': {'text': 'You wave at the little pals and move on.', 'effects': []}}]})
finish('supplies')
json.dump({'events': events}, open(f'{REPO}/src/data/events/plushWorkshop.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
open(f'{REPO}/src/data/events/plushWorkshop.json', 'a').write('\n')
