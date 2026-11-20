"""DOMINION D10: works out how the Boss's actions 151-600 play (lists/player-actions-151-300.md, -301-450.md, -451-600.md,
already copied word for word into src/data/dominion/actions.json by build-actions.py).

Each section of the list is one kind of job (street money, burglary, combat, image...), so it gets one rule set below
(SECTION: target kinds, base odds, Heat, a fight). The row's Lv 1 step gives its numbers: ₽ pay (or a cost, for bribes
and buys), Regard, Dread, Heat, Control, Morale, Loyalty, Friendship, XP and Tension. A row is "supported" when its Lv 1
step is all numbers the rules use, "limited" when part of it is words the rules don't act on yet (the note says which),
and "disabled" when its section or its Unlock needs a later slice (the Hero, held regions, Snagem...).
Run: python3 -I tools/dominion/growth-to-json.py   (from the repo root)
"""
import json
import re

acts = json.load(open('src/data/dominion/actions.json', encoding='utf-8'))['actions']
rooms = json.load(open('src/data/dominion/hq.json', encoding='utf-8'))['rooms']

ANY = ['any']
SECTION = {
    'N': dict(kinds=['shop', 'street', 'crowd', 'center', 'dock'], chance=70, heat=2, failHeat=5, lose='{owner} says no, loudly, and people turn to look.'),
    'O': dict(kinds=['shop', 'site', 'street', 'dock'], chance=55, heat=3, failHeat=8, battle=(35, 'fail', 'target'), lose='An alarm, a light, a shout. You leave with nothing.'),
    'P': dict(kinds=['route', 'street', 'crowd', 'dock', 'gym', 'cave'], chance=60, heat=1, failHeat=3, battle=(100, 'always', 'target'), lose='You lose the fight, and the crowd remembers your face.'),
    'Q': dict(kinds=ANY, chance=70, lose='The words come out wrong. Nobody is moved.'),
    'R': dict(kinds=ANY, chance=70, effect='scout', lose='The trail goes cold before you get there.'),
    'S': dict(kinds=ANY, chance=75, lose='Your Pokémon aren\'t in the mood today.'),
    'T': dict(kinds=['dock', 'site', 'shop'], chance=55, heat=3, failHeat=8, battle=(30, 'fail', 'target'), lose='The harbour watch is awake tonight. You back off.'),
    'U': dict(kinds=ANY, chance=75, lose='Nobody turns up, and the ones who do don\'t clap.'),
    'V': dict(kinds=ANY, chance=75, lose='It doesn\'t take. The police still know your face.'),
    'W': dict(kinds=ANY, chance=55, heat=2, failHeat=6, effect='rivalHit', lose='The rival team saw you coming.'),
    'X': dict(kinds=ANY, chance=65, heat=1, failHeat=3, control=2, lose='The street doesn\'t take your side today.'),
    'Y': dict(kinds=['crowd', 'street', 'center', 'route'], chance=70, lose='Rain, a small crowd, an early night.'),
    'Z': dict(kinds=ANY, chance=65, failHeat=2, lose='Sparks, smoke, and a part that won\'t fit.'),
    'AA': dict(kinds=['route', 'cave', 'dock'], chance=75, lose='The road is long and gives you nothing.'),
    'AE': dict(kinds=ANY, chance=75, lose='The crew goes quiet when you walk in.'),
    'AF': dict(kinds=['cave', 'ghost', 'site', 'route'], chance=60, battle=(40, 'fail', 'wild'), lose='Something in the dark doesn\'t want you there.'),
    'AG': dict(kinds=['crowd', 'street', 'shop'], chance=70, heat=1, failHeat=4, lose='Half the seats are empty, and a patrol walks past twice.'),
    'AK': dict(kinds=ANY, chance=60, heat=1, failHeat=4, lose='The old families smile, and give you nothing.'),
    'AL': dict(kinds=['site'], chance=55, heat=3, failHeat=8, battle=(35, 'fail', 'target'), lose='Security badges you at the door. You walk away.'),
    'AM': dict(kinds=ANY, chance=60, failHeat=5, lose='The law doesn\'t bend for you today.'),
    'AN': dict(kinds=ANY, chance=80, lose='The crew shuffles its feet. Next time.'),
    'AO': dict(kinds=ANY, chance=75, clean=True, lose='A slow day at the front. Nobody comes in.'),
    'AP': dict(kinds=ANY, chance=65, heat=1, failHeat=4, lose='The mission falls apart at the first corner.'),
}
# Whole sections that need a later slice: the Hero (D11), Snagem and Cipher (D16), held regions (D15), the Elite Four and
# Champion (D14), spies and moles (D22), Legendaries (D11), the endgame takeover (D14).
SECTION_WAITS = {'AB': 'D11', 'AC': 'D16', 'AD': 'D15', 'AH': 'D14', 'AI': 'D22', 'AJ': 'D11', 'AQ': 'D14'}
# Unlocks the generic rules can't check yet, and the slice that brings them.
UNLOCK_WAITS = [(r'Region event|Region held|Final stage|A war ended|A traitor|A defector', 'D15'), (r'Hero', 'D11'),
                (r'Cipher|Snagem', 'D16'), (r'Takeover won', 'D14'), (r'Spy found|Raid suffered|Tension', 'D9')]
UNLOCK_GATE = {'Black Market': 'contact', 'Water Pokémon': 'surf', 'Flying Pokémon': 'fly', 'A member jailed': 'jailed', 'A member fell': 'fell'}
COST_WORDS = r'\bBribe|\bPay\b|\bFund|\bBuy\b|\bBuild|\bRepair|\bGift|\bSponsor|\bDonate|\bHire|\bRent\b'

NUM = {'Regard': 'regard', 'Dread': 'dread', 'Heat': 'heat', 'Control': 'control', 'Morale': 'morale', 'Loyalty': 'loyalty',
       'Friendship': 'friendship', 'XP': 'edge', 'Tension': 'tension'}


def signed(t):
    return int(t.replace('−', '-').replace('+', ''))


def parse(text, name, what):
    """Numbers in a Lv 1 step. Returns (fields, leftover words)."""
    f, rest = {}, text
    for m in re.finditer(r'(Regard|Dread|Heat|Control|Morale|Loyalty|Friendship|XP|Tension) ([+−-]\d+)|([+−-]\d+) (Regard|Dread|Heat|Control|Morale|Loyalty|Friendship|XP|Tension)', text):
        k, v = (m.group(1), m.group(2)) if m.group(1) else (m.group(4), m.group(3))
        f[NUM[k]] = f.get(NUM[k], 0) + signed(v)
        rest = rest.replace(m.group(0), '')
    m = re.search(r'₽([\d,]+)', text)
    if m:
        n = int(m.group(1).replace(',', ''))
        cost = re.search(COST_WORDS, name + ' ' + what) or re.search(r'buys|\bfor a\b|\bgift\b|costs', text)
        if cost:
            f['cost'] = n
        else:
            f['pay'] = [max(10, round(n * 0.8 / 10) * 10), max(10, round(n * 1.2 / 10) * 10)]
            if re.search(r'a week\b', text) and not cost:
                f['pay'] = [max(10, round(n * 0.5 / 10) * 10), max(10, round(n / 10) * 10)]
        rest = rest.replace(m.group(0), '')
    # Words left once the numbers and filler are gone.
    rest = re.sub(r'\b(a|an|the|and|one|of|from|for|split|day|week|profit|once|each|you|your|in|on|to|with|at)\b', ' ', rest, flags=re.I)
    rest = re.sub(r'[()\s,.;:%]+', ' ', rest).strip()
    return f, rest


def sentence(what, district=True):
    w = what.strip().rstrip('.')
    w = w[0].lower() + w[1:]
    return f'You {w}' + (' in {district}.' if district else '.')


LETTERS = ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ',
           'AK', 'AL', 'AM', 'AN', 'AO', 'AP', 'AQ']  # 15 rows each, from 151

play, later, status = {}, {}, {}
for a in acts:
    n = a['n']
    if n <= 150:
        continue
    letter = LETTERS[(n - 151) // 15]
    unlock = a['unlock']
    wait = SECTION_WAITS.get(letter) or next((s_ for pat, s_ in UNLOCK_WAITS if re.search(pat, unlock)), None)
    if wait:
        later[a['id']] = wait
        status[a['id']] = dict(status='disabled')
        continue
    rule = SECTION[letter]
    nums, rest = parse(a['levels'][0], a['name'], a['what'])
    evening = a['slot'] == 'evening'
    p_ = {'kinds': ANY if evening else rule['kinds']}
    p_['chance'] = rule['chance']
    if rule.get('heat') and 'heat' not in nums:
        p_['heat'] = rule['heat']
    if rule.get('failHeat'):
        p_['failHeat'] = rule['failHeat']
    for k in ('pay', 'cost', 'regard', 'dread', 'heat', 'morale', 'loyalty', 'friendship', 'edge', 'tension'):
        if k in nums and nums[k] != 0:
            v = nums[k]
            if k in ('edge', 'friendship') and v < 0:
                continue
            p_[k] = v
    if 'control' in nums and nums['control'] > 0:
        p_['control'] = nums['control']
    elif rule.get('control'):
        p_['control'] = rule['control']
    if rule.get('clean') and 'pay' in p_:
        p_['clean'] = True
    if rule.get('effect'):
        p_['effect'] = rule['effect']
    elif 'morale' in p_ or 'loyalty' in p_:
        p_['effect'] = 'crew'
    # Combat specials pay the fight's prize money when the row names no ₽ (Attack's rule, field.ts).
    if letter == 'P' and 'pay' not in p_ and not evening:
        p_['prize'] = 1
        rest = re.sub(r'\b(win|small|prize|wins?)\b', ' ', rest, flags=re.I).strip()
        nums['prize'] = 1
    if rule.get('battle') and not evening:
        c, on, foe = rule['battle']
        p_['battle'] = dict(chance=c, on=on, foe=foe)
    band = re.match(r'^Rank (\d) crew$', unlock)
    if band:
        p_['band'] = int(band.group(1))
    if unlock in UNLOCK_GATE:
        p_['gate'] = UNLOCK_GATE[unlock]
    # the lines
    bits = []
    if p_.get('prize'):
        bits.append('the prize money')
    if 'pay' in p_:
        bits.append('₽{pay}' + (', clean money' if p_.get('clean') else ''))
    for k, word in (('regard', 'Regard'), ('dread', 'Dread'), ('control', 'Control')):
        if p_.get(k):
            bits.append(f"{word} {'+' if p_[k] > 0 else '−'}{abs(p_[k])}")
    if p_.get('heat', 0) < 0:
        bits.append(f"Heat −{-p_['heat']}")
    for k, word in (('morale', 'Morale'), ('loyalty', 'Loyalty')):
        if p_.get(k):
            bits.append(f"the crew's {word} {'+' if p_[k] > 0 else '−'}{abs(p_[k])}")
    win = sentence(a['what'], not evening) + (' ' + ', '.join(bits)[0].upper() + ', '.join(bits)[1:] + '.' if bits else '')
    p_['win'] = win
    p_['lose'] = rule['lose']
    play[a['id']] = p_
    # A cost alone (a bribe, a buy) isn't a rule: what it buys is in the words.
    has_num = bool({'pay', 'prize', 'regard', 'dread', 'heat', 'control', 'morale', 'loyalty', 'friendship', 'edge', 'tension'} & set(nums))
    if has_num and len(rest.split()) <= 3:
        status[a['id']] = dict(status='supported')
    else:
        what = rule.get('effect')
        status[a['id']] = dict(status='limited', note=f"Lv 1 reads “{a['levels'][0]}”: the words beyond the numbers aren't acted on yet; it plays as a {a['section'].lower()} job" + (f" ({what})" if what else '') + '.')

doc = {'_source': 'plans/evil-mode-rework/lists/player-actions-151-300/301-450/451-600.md via tools/dominion/growth-to-json.py',
       'play': play, 'later': later, 'status': status}
with open('src/data/dominion/growthActions.json', 'w', encoding='utf-8') as f:
    json.dump(doc, f, ensure_ascii=False, indent=1)
    f.write('\n')
c = {}
for v in status.values():
    c[v['status']] = c.get(v['status'], 0) + 1
print(len(status), 'rows', c, 'waiting:', {s_: sum(1 for x in later.values() if x == s_) for s_ in sorted(set(later.values()))})
