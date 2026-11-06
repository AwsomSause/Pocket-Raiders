"""Phase 3 of the Drive trainer import: copies the sprites and writes the game data.

  python3 -I tools/drive/build-trainers.py <identities.json> <teams.json> <pokerogue trainer dir> <intros Graphics/Trainers dir> \
      <decades Trainers dir> <essentials Graphics/Trainers dir> <fan-game Graphics/Trainers dir> <repo root>

Writes (safe to re-run; it only replaces what it made before):
  public/assets/images/trainer/pr/<name>.png|json     PokeRogue atlases (animated)
  public/assets/images/trainer/drive/<id>.png|json    animated strips turned into atlases
  public/assets/images/bosses/drive/<id>.png          still pictures (pixel-doubled art halved to 1x)
  public/assets/images/bosses/anim/<boss>.png|json    animation for a boss the game only had as a still
  src/data/trainersDrive.json                         new trainer classes (one per sprite)
  src/data/bosses.json                                new named trainers appended (entries with "drive": true are replaced)
  tools/drive/bossAnims.json + src/assets/catalog.ts   bosses that gained an animation (BOSS_ANIMATED)
  tools/drive/provenance.json                         where every file came from
"""
import hashlib, json, os, re, shutil, struct, sys
from collections import Counter
from PIL import Image

ids_path, teams_path, pr_dir, ati_dir, dec_dir, ess_dir, gfx_dir, root = sys.argv[1:9]
idents = json.load(open(ids_path))
teams = json.load(open(teams_path))
A = os.path.join(root, 'public', 'assets', 'images')
species = {s['id']: s for s in json.load(open(os.path.join(root, 'src', 'data', 'species.json')))}
SRC_DIR = {'pokerogue': pr_dir, 'intros': ati_dir, 'decades': dec_dir, 'essentials': ess_dir, 'graphics': gfx_dir}
SRC_NAME = {'pokerogue': 'pokerogue-assets-beta (images/trainer)', 'intros': 'Animated Trainer Intros (Graphics/Trainers)',
            'decades': 'Pokemon-Decades-main (Graphics/Trainers)', 'essentials': 'Pokemon-Essentials-21-With-Unofficial-EBDX (Graphics/Trainers)',
            'graphics': 'Graphics (fan game, Graphics/Trainers)'}
slug = lambda s: re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', s.lower())).strip('-')

# ---------- people: display names, fixes, and teams the Drive files don't have ----------
NAME_FIX = {'augustinesycamore': 'Sycamore', 'aureajuniper': 'Juniper', 'cedricjuniper': 'Cedric Juniper', 'daisyoak': 'Daisy',
            'grandoak': 'Grand Oak', 'samsonoak': 'Samson Oak', 'josephstone': 'Mr. Stone', 'mrbriney': 'Mr. Briney', 'djmary': 'DJ Mary',
            'mirorb': 'Miror B.', 'riderwillie': 'Willie', 'snagemleadergonzap': 'Gonzap', 'cipheradminardos': 'Ardos',
            'cipheradmingorigan': 'Gorigan', 'cipheradminvenus': 'Venus', 'hazycrazy': 'Hazy', 'korinna': 'Korrina', 'oak': 'Professor Oak'}
# Same person as one the game (or this list) already has.
SAME_AS = {'blanne': 'blaine', 'proto': 'proton', 'korinna': 'korrina', 'lizatate': 'liza'}
# Real people (basketball players in a fan game): not added.
SKIP_PEOPLE = {'charlesbarkley', 'michealjordan'}
# Stock Essentials pictures of characters already in the game (Blue, Oak, Lance...).
SKIP_CLASSES = {'rival1', 'rival2', 'champion', 'professor', 'plasmaboss2', 'leaders'}
# Named trainers with no team in the Drive files: their known teams (types, signature ace first).
MANUAL = {
    # DJ Mary's Drive team is too small for 36 different boss teams.
    'djmary': (['normal'], ['wigglytuff', 'blissey', 'persian', 'clefable', 'smeargle', 'meowth', 'chansey', 'jigglypuff']),
    'aliana': (['dark'], ['mightyena', 'druddigon', 'houndoom']),
    'anthea': (['psychic'], ['musharna', 'gothitelle', 'reuniclus', 'sigilyph']),
    'concordia': (['psychic'], ['gothitelle', 'musharna', 'reuniclus', 'sigilyph']),
    'atticus': (['poison'], ['revavroom', 'skuntank', 'muk', 'toxtricity', 'revavroom']),
    'baoba': (['normal'], ['kangaskhan', 'tauros', 'chansey', 'rhyhorn', 'scyther', 'pinsir']),
    'bellis': (['psychic'], ['metagross', 'alakazam', 'espeon', 'gardevoir']),
    'bonnie': (['electric', 'fairy'], ['dedenne', 'pikachu', 'sylveon', 'raichu']),
    'bryony': (['dark'], ['liepard', 'bisharp', 'mightyena']),
    'celosia': (['fire', 'dark'], ['houndoom', 'manectric', 'liepard']),
    'mable': (['fire', 'dark'], ['houndoom', 'weavile', 'mightyena']),
    'curtis': (['normal'], ['audino', 'stoutland', 'zebstrika', 'swoobat']),
    'yancy': (['normal', 'fairy'], ['audino', 'whimsicott', 'lilligant', 'swoobat']),
    'eri': (['fighting'], ['annihilape', 'lucario', 'passimian', 'toxicroak', 'conkeldurr']),
    'faba': (['psychic'], ['hypno', 'claydol', 'bruxish']),
    'fennel': (['psychic'], ['musharna', 'munna']),
    'mela': (['fire'], ['revavroom', 'armarouge', 'houndoom', 'torkoal', 'coalossal']),
    'proton': (['poison'], ['weezing', 'golbat', 'koffing', 'zubat']),
    'rood': (['psychic'], ['swoobat', 'musharna']),
    'vicky': (['fighting'], ['medicham', 'meditite']),
    'victor': (['flying', 'normal'], ['swellow', 'linoone', 'taillow', 'zigzagoon']),
    'victoria': (['grass'], ['roserade', 'roselia']),
    'vito': (['normal'], ['dodrio', 'kadabra', 'manectric', 'swellow', 'electrike']),
    'vivi': (['water', 'grass'], ['azumarill', 'roselia', 'breloom', 'marill']),
    'wes': (['dark', 'psychic'], ['umbreon', 'espeon', 'tyranitar', 'metagross']),
    'xerosic': (['poison', 'dark'], ['crobat', 'malamar', 'electrode']),
    'zinzolin': (['ice', 'dark'], ['cryogonal', 'weavile', 'sneasel']),
}

# ---------- classes: words in the class name decide types, money, style and lines ----------
KEYWORDS = [  # (regex on the class name, types, money per level, style, category)
    (r'grunt|rocket|galactic|plasma|magma|aqua|flare|skull|yell|macro|star|snagem|cipher|peon|shadow|triad|admin|aether', None, 30, 'aggressive', 'villain'),
    (r'swim|surf|diver|tuber|sailor|fisher|beach|scuba|bather|captain', ['water'], 20, 'balanced', 'water'),
    (r'hiker|ruin|mine|worker|engineer|roughneck|construct|backpack|clay', ['rock', 'ground'], 24, 'defensive', 'outdoor'),
    (r'camper|cowgirl|rancher|farmer|ranger', ['ground', 'grass'], 20, 'balanced', 'outdoor'),
    (r'picnic|aroma|garden|parasol|florist|botan', ['grass'], 20, 'balanced', 'gentle'),
    (r'bird|pilot|sky|aviat', ['flying'], 24, 'aggressive', 'outdoor'),
    (r'black.?belt|crush|battle.?girl|body.?build|striker|linebacker|infielder|hoopster|smasher|backer|athlete|jogger|cyclist|tennis|golf|sport|karate|rider|biker', ['fighting'], 24, 'aggressive', 'sport'),
    (r'psychic|medium|channeler|hex|mystic|myster|fortune|sage|witch', ['psychic', 'ghost'], 24, 'tricky', 'spooky'),
    (r'burglar|fire|kindler|cook|baker|chef', ['fire'], 24, 'aggressive', 'worker'),
    (r'bug|catcher', ['bug'], 16, 'swarm', 'kid'),
    (r'guitar|rocker|musician|punk|dancer|idol|artist|painter|model|harlequin|juggler|clown|street|perform|pokestar|actor|interview|reporter|camera', ['electric', 'normal'], 24, 'tricky', 'show'),
    (r'scien|nerd|maniac|collector|programmer|research|professor|doctor|nurse|clerk|office|depot|janitor|waiter|waitress|maid|bellhop|butler|clerk|courier|officer|police|firefight|guide', ['steel', 'electric'], 28, 'balanced', 'worker'),
    (r'ski|snow|ice|boarder', ['ice'], 24, 'balanced', 'outdoor'),
    (r'dragon|tamer|veteran|ace|cool|expert|elite', ['dragon'], 36, 'aggressive', 'tough'),
    (r'fairy|preschool|nursery|lady|madame|socialite|beauty|rich|gentleman|furisode|kimono|tourist|sightseer', ['fairy', 'normal'], 48, 'balanced', 'posh'),
    (r'youngster|lass|school|kid|twin|couple|sis|kin|pokefan|fan|cue|gambler|breeder|boy|girl|trainer', ['normal'], 16, 'balanced', 'kid'),
]
LINES = {
    'villain': ('You picked the wrong path to walk down.', 'Our plans won\'t wait for you.', 'The boss won\'t like this...'),
    'water': ('The tide is with my team today!', 'Swept away, just like that.', 'Washed up... for now.'),
    'outdoor': ('Out here, only the tough keep going.', 'The trail always wins.', 'Guess I need more miles under my boots.'),
    'gentle': ('Let\'s have a lovely little battle.', 'What a pleasant win!', 'Oh my, you\'re quite strong.'),
    'sport': ('Warm-up\'s over. Let\'s go!', 'That\'s how a pro plays!', 'Good game. Rematch soon!'),
    'spooky': ('I saw this battle coming...', 'Just as the spirits said.', 'The signs didn\'t warn me of you...'),
    'worker': ('I\'m on my break. Make it quick!', 'Back to work, then.', 'I\'ll be late for my shift now...'),
    'kid': ('My Pokémon are the best, I bet!', 'Yes! I won!', 'Aw, no fair...'),
    'show': ('Lights up! It\'s showtime!', 'Give it up for my team!', 'Tough crowd tonight...'),
    'tough': ('I only battle trainers worth my time.', 'Train harder, then come back.', 'You\'ve earned my respect.'),
    'posh': ('A battle? How charming.', 'As expected, of course.', 'My, how very rude of you to win.'),
}
NAMES = {
    'm': ['Aaron', 'Ben', 'Cal', 'Dante', 'Eli', 'Finn', 'Gus', 'Hank', 'Ivan', 'Jude', 'Kai', 'Leo', 'Milo', 'Nico', 'Omar', 'Pablo', 'Quinn',
          'Rex', 'Sam', 'Theo', 'Uri', 'Vince', 'Wade', 'Xander', 'Yuri', 'Zack', 'Ash', 'Bram', 'Cody', 'Dex'],
    'f': ['Ada', 'Bea', 'Cara', 'Dana', 'Elle', 'Faye', 'Gina', 'Hana', 'Iris', 'Jill', 'Kira', 'Lena', 'Mia', 'Nora', 'Opal', 'Pia', 'Rosa',
          'Sara', 'Tia', 'Uma', 'Vera', 'Wren', 'Yara', 'Zoe', 'Ava', 'Bree', 'Cleo', 'Dina', 'Eve', 'Flo'],
}
NICE = {'aromalady': 'Aroma Lady', 'birdkeeper': 'Bird Keeper', 'blackbelt': 'Black Belt', 'bugcatcher': 'Bug Catcher', 'coolcouple': 'Cool Couple',
        'cooltrainer': 'Ace Trainer', 'crushgirl': 'Crush Girl', 'crushkin': 'Crush Kin', 'cueball': 'Cue Ball', 'pokemaniac': 'Poké Maniac',
        'pokemonbreeder': 'Pokémon Breeder', 'pokemonranger': 'Pokémon Ranger', 'ruinmaniac': 'Ruin Maniac', 'sisandbro': 'Sis and Bro',
        'supernerd': 'Super Nerd', 'teamrocket': 'Team Rocket Grunt', 'youngcouple': 'Young Couple', 'depotagent': 'Depot Agent',
        'nurseryaide': 'Nursery Aide', 'parasollady': 'Parasol Lady', 'richboy': 'Rich Boy', 'schoolkid': 'School Kid',
        'teamgalactic': 'Team Galactic Grunt', 'teamplasma': 'Team Plasma Grunt', 'shadowtriad': 'Shadow Triad', 'pokestar': 'Pokéstar',
        'pokefan': 'Poké Fan', 'swimmer': 'Swimmer', 'tuber': 'Tuber', 'clerk': 'Clerk', 'scientist': 'Scientist', 'snowworker': 'Snow Worker'}

HUES = [(15, 'fire'), (50, None),  # 15-50 is skin and hair, not an outfit colour
         (70, 'electric'), (160, 'grass'), (200, 'water'), (250, 'ice'), (290, 'psychic'), (330, 'poison'), (361, 'fairy')]
def types_from_colour(path):
    """A trainer with no team anywhere gets the type its outfit's main colour suggests (red = Fire, blue = Water...)."""
    import colorsys
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    im = im.crop((0, 0, min(w, h), h)).resize((32, 32), Image.NEAREST)
    hues, dark, grey = Counter(), 0, 0
    for r, g, b, a in list(im.getdata()):
        if a < 128:
            continue
        hh, ll, ss = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if ll < 0.2: dark += 1
        elif ss < 0.25: grey += 1
        else:
            t = next(t for limit, t in HUES if hh * 360 < limit)
            if t: hues[t] += 1
    total = dark + grey + sum(hues.values()) or 1
    if hues and max(hues.values()) >= 0.2 * total:
        return [hues.most_common(1)[0][0]]
    return ['dark'] if dark >= grey else ['steel']

def types_from_team(sp):
    c = Counter()
    for s in sp:
        for t in species[s]['types']:
            c[t] += 1
    if not c:
        return []
    (t1, n1), *rest = c.most_common()
    out = [t1]
    if rest and rest[0][1] >= 0.6 * n1:
        out.append(rest[0][0])
    return out

def signature(sp):
    seen, order = Counter(sp), []
    for s in reversed(sp):  # the ace is usually last in an Essentials team
        if s not in order:
            order.append(s)
    order.sort(key=lambda s: -seen[s])
    return order[:6]

def pick(seed, pool, n):
    """n different names from the pool, the same every run for the same seed."""
    ranked = sorted(pool, key=lambda name: hashlib.sha1(f'{seed}:{name}'.encode()).hexdigest())
    return ranked[:n]

def doubled(im):
    w, h = im.size
    if w % 2 or h % 2:
        return False
    return im.resize((w // 2, h // 2), Image.NEAREST).resize((w, h), Image.NEAREST).tobytes() == im.tobytes()

def atlas_json(name, w, h, fw, fh, n):
    frames = [{'filename': f'{i + 1:04d}.png', 'rotated': False, 'trimmed': False, 'sourceSize': {'w': fw, 'h': fh},
               'spriteSourceSize': {'x': 0, 'y': 0, 'w': fw, 'h': fh}, 'frame': {'x': i * fw, 'y': 0, 'w': fw, 'h': fh}} for i in range(n)]
    return {'textures': [{'image': f'{name}.png', 'format': 'RGBA8888', 'size': {'w': w, 'h': h}, 'scale': 1, 'frames': frames}]}

provenance = []
def place(e, out_id):
    """Copies the identity's best sprite into the game and returns its asset id."""
    src = os.path.join(SRC_DIR[e['src']], e['file'])
    if e['src'] == 'pokerogue':
        d = os.path.join(A, 'trainer', 'pr')
        os.makedirs(d, exist_ok=True)
        name = e['file'][:-4]
        shutil.copyfile(src, os.path.join(d, name + '.png'))
        shutil.copyfile(src[:-4] + '.json', os.path.join(d, name + '.json'))
        provenance.append({'file': f'images/trainer/pr/{name}.png|json', 'source': SRC_NAME['pokerogue'], 'original': e['file']})
        return f'trainer.pr/{name}'
    im = Image.open(src).convert('RGBA')
    w, h = im.size
    n = max(1, round(w / h)) if h else 1
    if doubled(im):
        im = im.resize((w // 2, h // 2), Image.NEAREST)
        w, h = im.size
    if n > 1:
        fw = w // n
        d = os.path.join(A, 'trainer', 'drive')
        os.makedirs(d, exist_ok=True)
        im.crop((0, 0, fw * n, h)).save(os.path.join(d, out_id + '.png'), optimize=True)
        json.dump(atlas_json(out_id, fw * n, h, fw, h, n), open(os.path.join(d, out_id + '.json'), 'w'))
        provenance.append({'file': f'images/trainer/drive/{out_id}.png|json', 'source': SRC_NAME[e['src']], 'original': e['file']})
        return f'trainer.drive/{out_id}'
    d = os.path.join(A, 'bosses', 'drive')
    os.makedirs(d, exist_ok=True)
    im.save(os.path.join(d, out_id + '.png'), optimize=True)
    provenance.append({'file': f'images/bosses/drive/{out_id}.png', 'source': SRC_NAME[e['src']], 'original': e['file']})
    return f'boss.drive/{out_id}'

def place_boss_anim(e, still_name):
    """Gives a boss the game only had as a still picture its animated sprite (images/bosses/anim)."""
    d = os.path.join(A, 'bosses', 'anim')
    src = os.path.join(SRC_DIR[e['src']], e['file'])
    if e['src'] == 'pokerogue':
        shutil.copyfile(src, os.path.join(d, still_name + '.png'))
        j = json.load(open(src[:-4] + '.json'))
        for t in j.get('textures', []):
            t['image'] = still_name + '.png'
        json.dump(j, open(os.path.join(d, still_name + '.json'), 'w'))
    else:
        im = Image.open(src).convert('RGBA')
        w, h = im.size
        n = max(1, round(w / h))
        fw = w // n
        im.crop((0, 0, fw * n, h)).save(os.path.join(d, still_name + '.png'), optimize=True)
        json.dump(atlas_json(still_name, fw * n, h, fw, h, n), open(os.path.join(d, still_name + '.json'), 'w'))
    provenance.append({'file': f'images/bosses/anim/{still_name}.png|json', 'source': SRC_NAME[e['src']], 'original': e['file']})

# ---------- clean what an earlier run made ----------
for sub in (('trainer', 'pr'), ('trainer', 'drive'), ('bosses', 'drive')):
    shutil.rmtree(os.path.join(A, *sub), ignore_errors=True)
anim_path = os.path.join(root, 'tools', 'drive', 'bossAnims.json')
for n in (json.load(open(anim_path)) if os.path.exists(anim_path) else []):
    for ext in ('.png', '.json'):
        p = os.path.join(A, 'bosses', 'anim', n + ext)
        if os.path.exists(p): os.remove(p)
bosses_path = os.path.join(root, 'src', 'data', 'bosses.json')
bosses = [b for b in json.load(open(bosses_path)) if not b.get('drive')]
boss_ids = {b['id'] for b in bosses}
cat = open(os.path.join(root, 'src', 'assets', 'catalog.ts')).read()
own = cat[cat.index('BOSS_ANIMATED = ['):cat.index('  // drive-anims:start')]  # the game's own list, without what this tool added
animated = set(re.findall(r"'([a-z0-9-]+)'", own))
class_ids = {c['id'] for c in json.load(open(os.path.join(root, 'src', 'data', 'trainers.json')))}

new_classes, new_bosses, boss_anims, report = [], [], [], Counter()
for e in idents:
    k = e['key'].split(':', 1)[1]
    team = [s for r in e['raws'] for s in teams.get(r, [])]
    if e['kind'] == 'named':
        if k in SKIP_PEOPLE or e.get('variantOf') or k in SAME_AS:
            report['named: same person / skipped'] += 1
            continue
        if e['existing']:
            b = next(b for b in bosses if b['id'] == e['existing'])
            still = b['sprites']['default']
            name = still[len('boss.'):] if still.startswith('boss.') else None
            if name and e['frames'] > 1 and name not in animated and name not in boss_anims:
                place_boss_anim(e, name)
                boss_anims.append(name)
                report['named: existing, now animated'] += 1
            else:
                report['named: existing, unchanged'] += 1
            continue
        types, sig = MANUAL.get(k, (types_from_team(team), signature(team)))
        if not sig:
            # A fan-game character with no team anywhere: an ordinary trainer under their own name, not a boss.
            src_png = os.path.join(SRC_DIR[e['src']], e['file'])
            name = NAME_FIX.get(k, e['name'])
            types = species[slug(name)]['types'] if slug(name) in species else types_from_colour(src_png)
            cid = 'fan-' + slug(name)
            intro, win, lose = LINES['tough']
            new_classes.append({
                'id': cid, 'name': e.get('title') or 'Pokémon Trainer', 'spriteAssetId': place(e, cid), 'moneyPerLevel': 36,
                'names': [name], 'types': types[:2], 'style': 'balanced', 'personality': ['tough'],
                'lines': {'intro': intro, 'win': win, 'lose': lose}, 'extra': True, 'pack': 'drive',
            })
            report['named: fan character as a trainer'] += 1
            continue
        bid = slug(NAME_FIX.get(k, e['name']))
        if bid in boss_ids or bid in {b['id'] for b in new_bosses}:
            bid = slug(k)
        sprite = place(e, bid)
        new_bosses.append({'id': bid, 'name': NAME_FIX.get(k, e['name']), 'types': types[:2], 'sprites': {'default': sprite}, 'signature': sig, 'drive': True})
        report['named: new boss'] += 1
        continue
    # trainer class
    if k in SKIP_CLASSES:
        report['class: stock duplicate skipped'] += 1
        continue
    if e['existing']:
        report['class: existing, unchanged'] += 1
        continue
    base = re.sub(r'\d+$', '', re.sub(r'[mf]$', '', k)) if not e.get('region') else k
    nice = NICE.get(re.sub(r'\d+$', '', re.sub(r'(m|f)$', '', k)) if not e.get('region') else '', None)
    display = e.get('title') or nice or e['name']
    display = re.sub(r'\s+(Man|Woman|Boy|Girl|Guy)$', '', display) if display else e['name']
    rule = next((kw for kw in KEYWORDS if re.search(kw[0], (e['name'] + ' ' + display).lower())), (None, None, 24, 'balanced', 'tough'))
    types = types_from_team(team) or rule[1] or (['dark', 'poison'] if rule[4] == 'villain' else None)
    if not types:
        types = types_from_colour(os.path.join(SRC_DIR[e['src']], e['file']))
    cid = slug(e['raws'][0])
    if cid in class_ids or cid in {c['id'] for c in new_classes}:
        cid += '-drive'
    while cid in {c['id'] for c in new_classes}:
        cid += '-2'
    gender = e.get('gender') or ('f' if re.search(r'woman|girl|lady|lass|beauty|maid|madame|sister|waitress|nurse|_f$', (e['file'] + display).lower()) else 'm')
    intro, win, lose = LINES[rule[4]]
    new_classes.append({
        'id': cid, 'name': display, 'spriteAssetId': place(e, cid), 'moneyPerLevel': rule[2],
        'names': pick(cid, NAMES[gender], 5), 'types': types[:2], 'style': rule[3], 'personality': [rule[4]],
        'lines': {'intro': intro, 'win': win, 'lose': lose}, 'extra': True, 'pack': 'drive',
    })
    report['class: new'] += 1

json.dump(new_classes, open(os.path.join(root, 'src', 'data', 'trainersDrive.json'), 'w'), indent=1, ensure_ascii=False)
with open(bosses_path, 'w') as f:
    f.write('[\n' + ',\n'.join(' ' + json.dumps(b, ensure_ascii=False) for b in bosses + new_bosses) + '\n]\n')
json.dump(sorted(boss_anims), open(anim_path, 'w'), indent=1)
cat_path = os.path.join(root, 'src', 'assets', 'catalog.ts')
cat = open(cat_path).read()
a, b = cat.index('  // drive-anims:start\n') + len('  // drive-anims:start\n'), cat.index('  // drive-anims:end')
open(cat_path, 'w').write(cat[:a] + ''.join(f"  '{n}',\n" for n in sorted(boss_anims)) + cat[b:])
json.dump(sorted(provenance, key=lambda p: p['file']), open(os.path.join(root, 'tools', 'drive', 'provenance.json'), 'w'), indent=1)
for k, v in sorted(report.items()):
    print(f'{k}: {v}')
