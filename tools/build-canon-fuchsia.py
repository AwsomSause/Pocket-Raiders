#!/usr/bin/env python3
"""Builds src/data/eventsCanonFuchsia.json (Beta 0.6 Kanto canon spaces, Fuchsia City, CANON_SPACES_KANTO.md section 8).
Run: python3 tools/build-canon-fuchsia.py"""
import json, os

P = 'cs-kanto-fuchsia-'
GROUP = 'Canon Spaces: Kanto'
events = []

def A(i): return {'kind': 'addEvent', 'eventId': P + i}
def F(k, n=1): return {'kind': 'flag', 'key': k, 'amount': n}
def out(text, effects=None, battle=None):
    o = {'text': text, 'effects': effects or []}
    if battle: o['battle'] = battle
    return o
def ch(label, text, effects=None, battle=None, chance=None, fail=None, requires=None):
    c = {'label': label, 'success': out(text, effects, battle)}
    if requires: c['requires'] = requires
    if chance is not None:
        c['chance'] = chance
        c['failure'] = fail or out('It does not work out.')
    return c
def ev(i, name, intro, choices, tint, canon=None, room=True):
    e = {'id': P + i, 'name': name, 'group': GROUP, 'stop': 'delve' if room else 'event', 'rarity': 'common', 'minStage': 1,
         'types': [], 'requires': [], 'scene': {'cast': [], 'effect': 'none', 'tint': tint}, 'intro': intro, 'choices': choices}
    if room: e['room'] = True
    if canon: e['canon'] = canon
    events.append(e)
def wild(species, nxt, chain=1, bonus=0, win=None):
    return {'kind': 'wild', 'pseudo': True, 'species': species, 'chain': chain, 'levelBonus': bonus, 'win': (win or []) + ([A(nxt)] if nxt else [])}
def trainer(name, cls, types, size, nxt, bonus=0, win=None, **kw):
    b = {'kind': 'trainer', 'pseudo': True, 'classId': cls, 'name': name, 'size': size, 'types': types, 'levelBonus': bonus, 'win': (win or []) + ([A(nxt)] if nxt else [])}
    b.update(kw)
    return b
def cond(key, lo=1, hi=99): return {'kind': 'flag', 'key': key, 'atLeast': lo, 'atMost': hi}
def gate(i, name, intro, enter_text, first, tint, canon, effects=None):
    ev(i, name, intro, [ch('Enter', enter_text, (effects or []) + [A(first)]), ch('Leave', 'You turn back. Nothing here is forced.')], tint, canon, room=False)
def pick(i, name, intro, options, tint, nxt=None):
    """options: (label, text, effects)"""
    ev(i, name, intro, [ch(l, t, e + ([A(nxt)] if nxt else [])) for l, t, e in options], tint)

# ---------------------------------------------------------------- 8.2 Polluted Factory
T = '#4a4a2a'
FAC = 'cs.kanto.fuchsia.factory'
SLUDGE_POOL = ['grimer', 'muk', 'koffing', 'weezing', 'trubbish', 'garbodor', 'stunky', 'skuntank', 'grimer-alola', 'muk-alola', 'grimer-delta', 'muk-delta', 'weezing-galar', 'gulpin', 'swalot']
sludge = {'kind': 'tempEffect', 'label': 'Sludge: Poison moves +10%', 'battles': 5, 'until': 'battle', 'effects': [{'kind': 'typeDamageMultiplier', 'type': 'poison', 'value': 1.1}]}
gate('factory', 'Polluted Factory', 'A fenced-off factory leaking green fog into the grass. Everything in there is grimy, and a foreman is waving a clipboard.',
     'The gate buzzes open. The air tastes of metal.', 'factory-n1', T, FAC, [sludge])
ev('factory-n1', 'Polluted Factory: The Gate', 'A foreman asks you to sign a waiver. It is mostly a drawing of a Grimer wearing a hard hat.', [
    ch('Sign "Definitely Not Liable"', 'He nods solemnly and lets you through.', [A('factory-n2')]),
    ch('Sign "Ash Ketchum"', 'He squints at the name, shrugs, and lets you through.', [A('factory-n2')]),
    ch('Read the fine print', 'Clause 9 says the pipes burst. You note the warning.', [{'kind': 'attribute', 'key': 'intelligence', 'amount': 1}, A('factory-n2')]),
], T)
ev('factory-n2', 'Polluted Factory: The Pipes', 'Rusty pipes run overhead. One of them is dripping.', [
    ch('Cross the catwalk', 'Nothing bursts. A grimy Pokémon drops down in front of you.', [], wild(SLUDGE_POOL, 'factory-n3'),
       chance=0.75, fail=out('A pipe bursts! Poison gas hits your lead, and a grimy Pokémon drops down.', [{'kind': 'status', 'status': 'poison', 'who': 'lead', 'except': ['poison', 'steel']}],
                             wild(SLUDGE_POOL, 'factory-n3'))),
], T)
ev('factory-n3', 'Polluted Factory: The Vats', 'A worker in a stained coat blocks the stairs. "Unauthorised! Prepare to be decontaminated!"', [
    ch('Battle the Scientist', 'He throws a Pokéball with a gloved hand.', [], trainer('Scientist', 'worker', ['poison'], 2, 'factory-n4', species=SLUDGE_POOL)),
], T)
ev('factory-n4', 'Polluted Factory: The Sludge Trench', 'A trench of green sludge. Three Grimer rise out of it at once.', [
    ch('Wade in', 'They surge forward!', [], wild(['grimer', 'grimer-alola', 'grimer-delta'], 'factory-n5a', chain=3)),
], T)
valve_names = ['red', 'blue', 'yellow']
for n, (txt, good, ok, bad) in enumerate([
    ('A wall of valves. A note says: "SAFE valves are the ones with a blue ring."', 'Close the blue-ringed valve', 'Close the rusty valve', 'Smash the pressure gauge'),
    ('Another bank. The note says: "Never the red ones. Red means the boiler."', 'Close the green valve', 'Close the red valve', 'Pull the lever and hope'),
    ('The last bank hisses. The note says: "Turn clockwise. Slowly."', 'Turn the wheel slowly, clockwise', 'Turn the wheel quickly', 'Kick the wheel'),
], start=1):
    nxt = 'factory-n5' + 'bc'[n - 1] if n < 3 else 'factory-n6'
    ev('factory-n5' + 'abc'[n - 1], f'Polluted Factory: Control Room ({n} of 3)', txt, [
        ch(good, 'The valve seals with a clunk.', [F('kanto-factory-valves'), A(nxt)], chance=0.9, fail=out('It sticks. The valve is not fully closed.', [A(nxt)])),
        ch(ok, 'It groans shut, mostly.', [F('kanto-factory-valves'), A(nxt)], chance=0.4, fail=out('It will not turn.', [A(nxt)])),
        ch(bad, 'That was a gamble.', [F('kanto-factory-valves'), A(nxt)], chance=0.15, fail=out('Nothing happens.', [A(nxt)])),
    ], T)
ev('factory-n6', 'Polluted Factory: The Furnace', 'The furnace room glows orange. A huge Muk, glowing like embers, slides out of the molten sludge. It is Magmuk, and it will not be caught.', [
    ch('Fight Magmuk', 'Molten sludge seeps across the floor!', [], {
        'kind': 'raid', 'raidId': 'magmuk', 'name': 'Magmuk', 'pseudo': True, 'spikesUnless': {'flag': 'kanto-factory-valves', 'atLeast': 3},
        'win': [{'kind': 'item', 'id': 'black-sludge'}, F('kanto-factory-cleared'), A('factory-pick')],
        'lose': [F('kanto-factory-shut')]}),
], '#6a3a1a')
pick('factory-pick', 'Polluted Factory: Rescued', 'With Magmuk gone, three Pokémon come out from behind the machines. One will follow you out.', [
    ('Alolan Grimer', 'Alolan Grimer sticks to your boot and will not let go.', [{'kind': 'join', 'species': ['grimer-alola'], 'hiddenAbility': True}, F('kanto-factory-pick')]),
    ('Delta Grimer', 'Delta Grimer rolls after you, humming.', [{'kind': 'join', 'species': ['grimer-delta'], 'hiddenAbility': True}, F('kanto-factory-pick')]),
    ('Trubbish', 'Trubbish waves its little bag.', [{'kind': 'join', 'species': ['trubbish'], 'hiddenAbility': True}, F('kanto-factory-pick')]),
], T)

# ---------------------------------------------------------------- 8.3 Safari Land
S = '#6b8f3a'
SAFARI_POOL = ['chansey', 'kangaskhan', 'tauros', 'scyther', 'pinsir', 'dratini', 'dragonair', 'heracross', 'nidorina', 'nidorino', 'exeggcute', 'rhyhorn', 'venonat', 'paras', 'doduo', 'parasect', 'tangela', 'psyduck', 'slowpoke', 'rhydon']
ev('safari', 'Safari Land', 'A wide gate and a ticket booth. "Welcome to Safari Land! ₽500 gets you 30 Safari Balls and 500 steps. No battling inside." Beyond the fence the grass moves with a huge crowd of Pokémon.', [
    ch('Pay ₽500 and go in', 'The warden hands you 30 Safari Balls. Something big stirs in the grass right away.',
       [{'kind': 'money', 'amount': -500}, F('kanto-safari-balls', 30), F('kanto-safari-steps', 500)],
       wild(SAFARI_POOL, None, bonus=2),
       requires=[{'kind': 'money', 'atLeast': 500}]),
    ch('Walk on', 'You watch the herd for a while, then move along.'),
], S, 'cs.kanto.fuchsia.safari', room=False)

# ---------------------------------------------------------------- 8.4 Deep Savanna
SV = '#c9a24a'
sand = {'kind': 'tempEffect', 'label': 'Sandstorm on every first turn', 'battles': 5, 'until': 'battle', 'effects': [{'kind': 'battleStart', 'weather': 'sand', 'turns': 5}]}
savanna_pool = ['sandshrew', 'sandshrew-alola', 'trapinch', 'hippopotas', 'diglett', 'cacnea', 'maractus', 'sandile', 'krokorok', 'gible', 'larvitar', 'rhyhorn', 'tauros', 'heliolisk', 'dunsparce', 'stunfisk', 'palossand']
gate('savanna', 'Deep Savanna', 'Flat gold grass under a hard sun, and a wall of sand on the horizon. Ground-types move through it like fish.', 'The sand wall closes around you.', 'savanna-n1', SV, 'cs.kanto.fuchsia.savanna', [sand])
ev('savanna-n1', 'Deep Savanna: The Plain', 'Dry grass rustles. Something fast is running through it.', [
    ch('Walk into the grass', 'Something bursts out of the dust.', [], wild(savanna_pool, 'savanna-n2', chain=2)),
], SV)
ev('savanna-n2', 'Deep Savanna: Watering Hole', 'A small pool, ringed with tracks. The water is clean.', [
    ch('Drink and rest', 'The party recovers a little.', [{'kind': 'heal', 'share': 0.3}, A('savanna-n3')]),
], SV)
ev('savanna-n3', 'Deep Savanna: Dust Devil', 'A column of sand spins toward you across the plain.', [
    ch('Brace against it', 'The dust devil tears across you. Your lead is scoured and slowed.', [
        {'kind': 'damage', 'share': 0.125, 'who': 'lead', 'except': ['rock', 'ground', 'steel']},
        {'kind': 'tempEffect', 'label': 'Speed -1 for the next fight', 'battles': 1, 'until': 'battle', 'effects': [{'kind': 'statMultiplier', 'stat': 'spe', 'value': 0.67}]}, A('savanna-n4')]),
], SV)
ev('savanna-n4', 'Deep Savanna: The Oasis', 'Palm trees ahead and a second watering hole. Something is moving at its edge.', [
    ch('Approach the oasis', 'A Sand Veil Diglett group pops out of the sand, all at once!', [], wild(['diglett'], 'savanna-n5', chain=3, bonus=1), chance=0.1,
       fail=out('Just a quiet oasis. You drink and rest.', [{'kind': 'heal', 'share': 0.3}, A('savanna-n5')])),
], SV)
ev('savanna-n5', 'Deep Savanna: Dune Duel', 'A Ground-type trainer waits on a high dune. "One duel, then the road is yours."', [
    ch('Accept the duel', 'The wind picks up.', [], trainer('Dune Duelist', 'hiker', ['ground'], 3, 'savanna-n6', bonus=1)),
], SV)
ev('savanna-n6', 'Deep Savanna: Sandstorm Camp', 'A ring of tents in the lee of a rock. The storm howls but the camp is warm.', [
    ch('Take Soft Sand', 'You strap it onto a Pokémon.', [{'kind': 'heal', 'share': 0.4}, {'kind': 'item', 'id': 'soft-sand'}]),
    ch('Take Smooth Rock', 'Smooth and heavy.', [{'kind': 'heal', 'share': 0.4}, {'kind': 'item', 'id': 'smooth-rock'}]),
    ch('Take Gible', 'A little Gible with sandpaper skin follows you.', [{'kind': 'heal', 'share': 0.4}, {'kind': 'join', 'species': ['gible'], 'ability': 'rough-skin'}]),
    ch('Take Trapinch', 'A patient Trapinch climbs out of its pit.', [{'kind': 'heal', 'share': 0.4}, {'kind': 'join', 'species': ['trapinch']}]),
], SV)

# ---------------------------------------------------------------- 8.5 Lush Jungle
J = '#2d5a2a'
humid = {'kind': 'tempEffect', 'label': 'Humid: Grass +10%, Fire -10%', 'battles': 5, 'until': 'battle', 'effects': [{'kind': 'typeDamageMultiplier', 'type': 'grass', 'value': 1.1}, {'kind': 'typeDamageMultiplier', 'type': 'fire', 'value': 0.9}]}
jungle_pool = ['oddish', 'gloom', 'bellsprout', 'weepinbell', 'paras', 'exeggcute', 'tangela', 'venonat', 'ledian', 'foongus', 'bounsweet', 'roselia', 'budew', 'seedot', 'lotad', 'petilil', 'spinarak', 'ariados']
tangle = {'kind': 'tempEffect', 'label': 'Tangled: Speed -15% for the next fight', 'battles': 1, 'until': 'battle', 'effects': [{'kind': 'statMultiplier', 'stat': 'spe', 'value': 0.85}]}
gate('jungle', 'Lush Jungle', 'Thick green and thicker air. Everything drips, and the vines look like they are watching.', 'The canopy closes overhead.', 'jungle-n1', J, 'cs.kanto.fuchsia.jungle', [humid])
ev('jungle-n1', 'Lush Jungle: Vines', 'Vines hang across the trail.', [
    ch('Push through', 'The vines catch your lead. A wild Pokémon rustles out of the leaves.', [tangle], wild(jungle_pool, 'jungle-n2')),
], J)
ev('jungle-n2', 'Lush Jungle: More Vines', 'The trail narrows. The vines here are thicker.', [
    ch('Cut through', 'Another tangle, and another wild Pokémon.', [tangle], wild(jungle_pool, 'jungle-n3', chain=2)),
], J)
ev('jungle-n3', 'Lush Jungle: Spore Cloud', 'A fat mushroom bursts underfoot and the air turns yellow.', [
    ch('Hold your breath and run', 'You get through clean.', [A('jungle-n4a')], chance=0.7,
       fail=out('Poison spores! Your lead is poisoned.', [{'kind': 'status', 'status': 'poison', 'who': 'lead', 'except': ['poison', 'steel']}, A('jungle-n4a')])),
], J)
ev('jungle-n4a', 'Lush Jungle: Hidden Ruin (1 of 2)', 'A mossy wall of carved glyphs. A clue is scratched in the stone: "Not the leaf, not the fang."', [
    ch('Press the sun glyph', 'The stone slides. A clue!', [F('kanto-jungle-clue'), A('jungle-n4b')]),
    ch('Press the leaf glyph', 'Nothing. The wall hums angrily.', [A('jungle-n4b')]),
    ch('Press the fang glyph', 'A dart of spores hisses out. Nothing else.', [A('jungle-n4b')]),
], J)
ev('jungle-n4b', 'Lush Jungle: Hidden Ruin (2 of 2)', 'A second wall. "Three then one, and the last is the moon."', [
    ch('Press moon, sun, leaf', 'The wall opens on a hidden alcove.', [F('kanto-jungle-clue'), A('jungle-n4c')]),
    ch('Press sun, moon, leaf', 'The glyphs go dark.', [A('jungle-n4c')]),
    ch('Press leaf, leaf, moon', 'A dead end.', [A('jungle-n4c')]),
], J)
ev('jungle-n4c', 'Lush Jungle: The Alcove', 'Inside the ruin: a faded mural and a small stone dish.', [
    ch('Read the mural', 'You work out what the carvers meant. It sharpens your thinking.', [{'kind': 'attribute', 'key': 'intelligence', 'amount': 1}, {'kind': 'research', 'amount': 1}, A('jungle-n5')],
       requires=[cond('kanto-jungle-clue', 2)]),
    ch('Leave the ruin', 'You go back to the trail.', [A('jungle-n5')]),
], J)
ev('jungle-n5', 'Lush Jungle: The Jungle Chief', 'A tall ranger in leaf-green stands on a root. "This is my jungle. Show me you can keep up."', [
    ch('Battle the Jungle Chief', 'The ranger grins.', [], trainer('Jungle Chief', 'ranger', ['grass', 'poison'], 3, 'jungle-n6a', bonus=1)),
], J)
ev('jungle-n6a', 'Lush Jungle: The Heart', 'The trail ends at a clearing. In the middle, something very large breathes slowly under a blanket of leaves.', [
    ch('Look closer', 'A Venusaur, sleeping at the heart of the jungle. It wakes!', [], wild(['venusaur'], 'jungle-n6', bonus=3), chance=0.15,
       fail=out('Only a heap of leaves, rising and falling with the wind.', [A('jungle-n6')])),
    ch('Back away', 'You tiptoe on.', [A('jungle-n6')]),
], J)
ev('jungle-n6', 'Lush Jungle: Treehouse', 'A rope ladder leads up to a treehouse. There is food, a hammock, and two gifts left out.', [
    ch('Take the Miracle Seed', 'You rest, then climb down.', [{'kind': 'heal', 'share': 0.4}, {'kind': 'item', 'id': 'miracle-seed'}]),
    ch('Take the Black Sludge', 'You rest, then climb down.', [{'kind': 'heal', 'share': 0.4}, {'kind': 'item', 'id': 'black-sludge'}]),
    ch('Take Tangela', 'A shaggy Tangela follows you down.', [{'kind': 'heal', 'share': 0.4}, {'kind': 'join', 'species': ['tangela'], 'ability': 'chlorophyll'}]),
    ch('Take Foongus', 'A shy Foongus follows you down.', [{'kind': 'heal', 'share': 0.4}, {'kind': 'join', 'species': ['foongus'], 'ability': 'regenerator'}]),
], J)

# ---------------------------------------------------------------- 8.6 Warden's Gold Teeth
W = '#7a6a2a'
ev('warden', "Warden's Gold Teeth", 'The Safari Warden is pacing the fence, hand over his mouth. "I lost my gold teeth somewhere in the Zone. Find them and I will make it worth your while."', [
    ch('Search the Zone', 'You head in to look.', [A('warden-n1')]),
    ch('Not now', 'He sighs. "Fair enough."'),
], W, 'cs.kanto.fuchsia.warden', room=False)
found = [{'kind': 'teachMove', 'move': 'strength'}, F('kanto-safari-pass'), A('warden-reward')]
ev('warden-n1', "Warden's Gold Teeth: The Center", 'The Center of the Zone: wide grass, a bench, and hoofprints everywhere.', [
    ch('Search the Center', 'A glint in the grass: the teeth!', found, chance=0.4, fail=out('Nothing here but a chewed bench. On to Area 2.', [A('warden-n2')])),
], W)
ev('warden-n2', "Warden's Gold Teeth: Area 2", 'Area 2: tall reeds and a muddy bank.', [
    ch('Search Area 2', 'There! Gold, in the mud.', found, chance=35 / 60, fail=out('Only mud. Area 3 is left.', [A('warden-n3')])),
], W)
ev('warden-n3', "Warden's Gold Teeth: Area 3", 'Area 3: the far corner of the Zone, dry and rocky.', [
    ch('Search Area 3', 'Wedged between two stones: the teeth.', found),
], W)
ev('warden-reward', "Warden's Gold Teeth: Thanks", 'The Warden grins a gold-less grin, then slides the teeth back in. "A fine day! Take this."', [
    ch('Accept', 'He teaches you Strength and gives you a Safari Pass. Your next Safari Land visit starts with 10 extra Safari Balls.', [{'kind': 'moment', 'text': 'Found the Safari Warden\'s gold teeth.'}]),
], W)

# ---------------------------------------------------------------- 8.7 Tauros Stampede
TA = '#8a5a2a'
ev('tauros', 'Tauros Stampede', 'A rumble in the ground. A herd of Tauros comes over the ridge, straight at you.', [
    ch('Dodge', 'You dive aside. The herd thunders past. Nobody is hurt.', [], requires=[]),
    ch('Throw bait and hold your ground', 'The herd slows, sniffing the bait.', [F('kanto-tauros-bait'), A('tauros-r1')], requires=[cond('kanto-safari-balls', 1)]),
    ch('Throw rocks', 'The herd stampedes, furious!', [F('kanto-tauros-rock'), A('tauros-r1')], requires=[cond('kanto-safari-balls', 2)]),
], TA, 'cs.kanto.fuchsia.tauros', room=False)
for r in range(1, 7):
    nxt = 'tauros-r%d' % (r + 1) if r < 6 else 'tauros-end'
    def throw(label, mode, p, cost):
        reqs = [cond('kanto-tauros-' + mode), cond('kanto-safari-balls', cost)]
        return ch(label, 'Caught one!', [F('kanto-safari-balls', -cost), F('kanto-tauros-caught'), A(nxt)], chance=p,
                  fail=out('It slips away.', [F('kanto-safari-balls', -cost), A(nxt)]), requires=reqs)
    ev('tauros-r%d' % r, 'Tauros Stampede: Throw (%d of 6)' % r, 'The herd mills around you.', [
        throw('Throw a ball (bait: 40%)', 'bait', 0.4, 1),
        throw('Throw a ball (rock: 25%, costs 2)', 'rock', 0.25, 2),
        ch('Let the herd go', 'The herd thunders off.', [A('tauros-end')]),
    ], TA)
ev('tauros-end', 'Tauros Stampede: The Haul', 'The dust settles. The Tauros you caught wait in a line.', [
    ch('Take the Tauros home', 'A big Tauros snorts and falls in beside you.', [{'kind': 'join', 'species': ['tauros'], 'ability': 'intimidate'}, F('kanto-tauros-joined'), F('kanto-tauros-caught', -1), A('tauros-end')],
       requires=[cond('kanto-tauros-caught', 1), cond('kanto-tauros-joined', 0, 0)]),
    ch('Take a Tauros Charm', 'Each Tauros past the first leaves a charm behind.', [{'kind': 'item', 'id': 'tauros-charm'}, F('kanto-tauros-caught', -1), A('tauros-end')],
       requires=[cond('kanto-tauros-caught', 1), cond('kanto-tauros-joined', 1)]),
    ch('Head out', 'You walk on.', [], requires=[cond('kanto-tauros-caught', 0, 0)]),
], TA)

# ---------------------------------------------------------------- 8.8 Fuchsia Zoo
Z = '#5a7a8a'
ev('zoo', 'Fuchsia Zoo', 'The Fuchsia Zoo, with pens of rare Pokémon from all over. A keeper is selling a few oddities by the gate.', [
    ch('Tour the rare Pokémon', 'The keeper tells you what each type is weak to. You learn a lot.', [{'kind': 'attribute', 'key': 'intelligence', 'amount': 1}, {'kind': 'research', 'amount': 1}]),
    ch('Buy the Rare Candy (₽10,000)', 'A Rare Candy changes hands. "Only one a customer," the keeper warns.', [{'kind': 'money', 'amount': -10000}, {'kind': 'item', 'id': 'rare-candy'}, F('kanto-zoo-candy')],
       requires=[{'kind': 'money', 'atLeast': 10000}, cond('kanto-zoo-candy', 0, 0)]),
    ch('Move on', 'You wave and walk on.'),
], Z, 'cs.kanto.fuchsia.zoo', room=False)

# ---------------------------------------------------------------- 12.2 The Snag Test
SN = '#3a3a5a'
ev('snag', 'The Snag Test', 'Two Team Snag\'em operatives are testing a Snag Machine on a Safari trainer\'s Pokémon. One has already been snagged mid-battle. The trainer looks panicked.', [
    ch('Step in (2-on-1)', 'The trainer\'s Rhyhorn charges beside you.', [F('kanto-snag-seen')], {
        'kind': 'trainer', 'pseudo': True, 'name': "Snag'em Operative", 'classId': 'worker', 'size': 3, 'types': ['poison', 'dark'], 'shadow': 1, 'levelBonus': 1, 'ally': 'rhyhorn',
        'win': [{'kind': 'item', 'id': 'snag-ball'}, F('kanto-snag-ball'), {'kind': 'moment', 'text': 'Took the Snag Ball prototype from Team Snag\'em.'}],
        'lose': [F('kanto-snag-lost')]}),
    ch('Watch from the bushes', 'You see how the machine works, then slip away.', [F('kanto-snag-seen')]),
], SN, 'cs.kanto.fuchsia.snag', room=False)

json.dump({'events': events}, open(os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'eventsCanonFuchsia.json'), 'w'), indent=1, ensure_ascii=False)
open(os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'eventsCanonFuchsia.json'), 'a').write('\n')
print(len(events), 'events')
