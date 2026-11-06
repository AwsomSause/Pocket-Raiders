"""Phase 2 of the trainer import: turns the sprite inventory into one row per trainer.

  python3 -I tools/drive/identities.py <inventory.json> <repo root> <out.json>

A row is either a named person (Cynthia, Archer, Kukui...) or a trainer class (Hiker, Sinnoh Fisherman...).
The same person found in several packs is one row; the best sprite wins
(PokeRogue atlas > animated strip > still picture). Rows the game already has are marked
`existing` (only their art may be upgraded)."""
import json, os, re, sys

inv_path, root, out = sys.argv[1:4]
rows = json.load(open(inv_path))
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())

bosses = [b for b in json.load(open(os.path.join(root, 'src/data/bosses.json'))) if not b.get('drive')]
boss_ids = {b['id'] for b in bosses}
boss_by_name = {norm(b['name']): b['id'] for b in bosses}
classes = json.load(open(os.path.join(root, 'src/data/trainers.json')))
class_sprites = {c['spriteAssetId'] for c in classes}
cat = open(os.path.join(root, 'src/assets/catalog.ts')).read()
animated = set(re.findall(r"'([a-z0-9-]+)'", cat[cat.index('BOSS_ANIMATED = ['):cat.index('] as const', cat.index('BOSS_ANIMATED = ['))]))

# Other spellings of people the game already has.
ALIAS = {'teamrocketboss': 'giovanni', 'surge': 'ltsurge', 'wake': 'crasherwake', 'crasherwake': 'crasherwake', 'ltsurge': 'ltsurge', 'rocketbossgiovanni1': 'giovanni',
         'rocketboss': 'giovanni', 'galacticboss': 'cyrus', 'plasmaboss': 'ghetsis', 'blueoak': 'blue', 'samsonoak': 'samsonoak'}
PR_CLASSES = {'artist', 'baker', 'beauty', 'beauty_2', 'biker', 'bug_catcher', 'collector', 'dancer', 'depot_agent', 'dragon_tamer',
              'expert_pokemon_breeder', 'fairy_tale_girl', 'firebreather', 'fisherman', 'guitarist', 'harlequin', 'hex_maniac', 'hiker',
              'hooligans', 'hoopster', 'infielder', 'interviewers', 'janitor', 'linebacker', 'maid', 'musician', 'nursery_aide', 'officer',
              'parasol_lady', 'pilot', 'roughneck', 'ruin_maniac', 'smasher', 'snow_worker', 'striker', 'twins', 'young_couple', 'aroma_lady',
              'bug_type_superfan', 'mysterious_sisters', 'backers_f', 'backers_m', 'clerk_m_2', 'sailor'}
# Decades sprites that are classes even though their PBS title reads like a name.
EXTRA_CLASS_WORDS = {'ogreclanmember', 'reportercameraman', 'shadowtriad', 'snagemgruntglasses', 'minesworker', 'supernerd', 'nurse', 'hiker', 'juggler',
                     'mirrorbpeonfolly', 'mirrorbpeontrudly', 'pokefan',
                     # the fan game's generic classes
                     'acecouple', 'acetrainersnow', 'battlegirl', 'belleandpa', 'boarder', 'butler', 'cameraman', 'chef', 'clown', 'cowgirl',
                     'criminalleader', 'criminals', 'cult', 'dad', 'doubleteam', 'elder', 'executive', 'furisodegirl', 'gardener', 'guard', 'herd',
                     'idol', 'jogger', 'kimonogirl', 'madame', 'medium', 'ninjaboy', 'pokekid', 'policeofficer', 'rancher', 'reporter', 'routeboss',
                     'sage', 'schoolboy', 'schoolgirl', 'teacher', 'trwaitress', 'chaneller'}
SKIP_PR = re.compile(r'^(player_|trainer_[mf]_back|unknown_|jacinthe_holo$)')
GENDER = {'M': 'm', 'F': 'f', 'MAN': 'm', 'WOMAN': 'f', 'BOY': 'm', 'GIRL': 'f', 'GUY': 'm', 'MEN': 'm', 'WOMEN': 'f'}
PREFIX_TITLE = {'LEADER': 'Gym Leader', 'ELITEFOUR': 'Elite Four', 'CHAMPION': 'Champion', 'FRONTIERBRAIN': 'Frontier Brain',
                'SUBWAYBOSS': 'Subway Boss', 'ROCKETADMIN': 'Team Rocket Admin', 'TEAMPLASMA': 'Team Plasma', 'POKEMONTRAINER': 'Pokémon Trainer',
                'PROFESSOR': 'Professor', 'BOSSTRAINER': 'Pokémon Trainer'}
REGION = re.compile(r'^([A-Z]+(?:IAN|AN)|POKETOPIA|PLAYER_TRAINER)_([A-Z0-9]+)_(.+)$')
SOURCE_RANK = {'pokerogue': 0, 'intros': 1, 'decades': 2, 'essentials': 3, 'graphics': 4}
title_case = lambda s: ' '.join(w.capitalize() for w in s.replace('_', ' ').split())

ids = {}
# Every class word the stock packs use, so a Decades class with an odd PBS title is still a class.
VOCAB = set(EXTRA_CLASS_WORDS)
for r in rows:
    if r['src'] in ('intros', 'essentials') and not REGION.match(r['raw']):
        t = r['raw'].split('_')
        if len(t) == 1 or t[1] in GENDER: VOCAB.add(norm(re.sub(r'\d+$', '', t[0])))
    if r['src'] == 'pokerogue' and (r['raw'] in PR_CLASSES or re.search(r'_[mf](_\d)?$', r['raw'])):
        VOCAB.add(norm(re.sub(r'(_[mf])?(_\d)?$', '', r['raw'])))
def put(key, kind, row, **info):
    rank = (0 if row['src'] == 'pokerogue' and row['frames'] > 1 else 1 if row['frames'] > 1 else 2, SOURCE_RANK[row['src']])
    cur = ids.get(key)
    entry = {'key': key, 'kind': kind, 'src': row['src'], 'file': row['file'], 'frames': row['frames'], 'rank': rank, **info}
    raws = (cur['raws'] if cur else []) + [row['raw']]
    entry['raws'] = raws
    if cur is None:
        entry['also'] = []
        ids[key] = entry
    elif rank < cur['rank']:
        entry['also'] = cur['also'] + [cur['src'] + ':' + cur['file']]
        for k in ('title', 'region'):
            entry.setdefault(k, cur.get(k))
            if not entry.get(k): entry[k] = cur.get(k)
        ids[key] = entry
    else:
        cur['raws'] = raws
        cur['also'].append(row['src'] + ':' + row['file'])
        for k in ('title', 'region'):
            if not cur.get(k) and info.get(k): cur[k] = info[k]

skipped = []
for r in rows:
    raw = r['raw']
    if raw in ('000', 'desktop.ini', 'LEADERS', 'OKEMONTRAINER_RIVALF') or raw.isdigit() or raw.lower().endswith('_back') or '_back_' in raw.lower():
        skipped.append(raw); continue
    if r['src'] == 'pokerogue':
        if SKIP_PR.match(raw): skipped.append(raw); continue
        m = re.match(r'^(.*?)(?:_([mf]))?(?:_(\d))?$', raw)
        base, g, n = m.group(1), m.group(2), m.group(3)
        if g or raw in PR_CLASSES or raw.startswith(('halloween_rival', 'rival_')):
            put('class:' + norm(base) + (g or '') + (n or ''), 'class', r, name=title_case(base), gender=g)
        else:
            person = ALIAS.get(norm(raw), norm(raw))
            put('named:' + person, 'named', r, name=title_case(raw.replace('rocket_boss_giovanni_1', 'giovanni')))
        continue
    m = REGION.match(raw) if r['src'] == 'decades' else None
    if m:
        region, game, rest = m.groups()
        title = r.get('title') or ''
        toks = rest.split('_')
        gender = GENDER.get(toks[-1]) if len(toks) > 1 else None
        core = toks[:-1] if gender else toks
        tw = norm(re.sub(r"^\S+(ian|an)\s", '', title))
        if region == 'PLAYER_TRAINER':
            put('named:' + norm(core[-1]), 'named', r, name=title_case(core[-1]), title='Pokémon Trainer', region=game); continue
        is_class = bool(gender) or norm(''.join(core)) in VOCAB or (norm(''.join(core)) in tw or tw in norm(''.join(core)) or all(norm(t) in tw for t in core))
        if is_class:
            put('class:' + norm(region) + norm(game) + norm(''.join(core)) + (gender or ''), 'class', r,
                name=title_case(' '.join(core)), gender=gender, title=title, region=title_case(region))
        else:
            words = [t for t in core if t not in ('PROFESSOR', 'CASUAL', 'DRESS', 'SCIENCE', 'UNOFFICAL')]
            person = ALIAS.get(norm(''.join(words)), norm(''.join(words)))
            put('named:' + person, 'named', r, name=title_case(' '.join(words)), title=title, region=title_case(region))
        continue
    toks = raw.split('_')
    cls = toks[0]
    rest = toks[1:]
    # The fan game's folder also has single-word fan characters (AKUMA, Dawn, ERIS...) next to class sprites (LASS2, ACETRAINERF).
    if r['src'] == 'graphics' and (not rest or rest[0].isdigit()):
        word = re.sub(r'\d+$', '', cls)
        if len(word) > 20:
            skipped.append(raw); continue
        if norm(word) in ALIAS:
            put('named:' + ALIAS[norm(word)], 'named', r, name=ALIAS[norm(word)].capitalize()); continue
        base = re.sub(r'(F|M)$', '', word) if word.isupper() and norm(re.sub(r'(F|M)$', '', word)) in VOCAB else word
        base = re.sub(r'(F|M)$', '', base) if norm(re.sub(r'(F|M)$', '', base)) in ('cult', 'routeboss') else base
        if norm(base) in VOCAB or norm(word) in VOCAB:
            g = 'f' if word.endswith('F') and norm(base) != norm(word) else 'm' if word.endswith('M') and norm(base) != norm(word) else None
            put('class:' + norm(cls), 'class', r, name=title_case(base), gender=g)
        else:
            person = ALIAS.get(norm(word), norm(word))
            put('named:' + person, 'named', r, name=word.capitalize(), title='Pokémon Trainer', fan=True)
        continue
    if rest and rest[0][:1].isupper() and rest[0][1:].islower() and rest[0] not in GENDER and len(rest[0]) > 1:
        name = rest[0]
        if cls == 'WORKER':
            put('class:snowworker', 'class', r, name='Snow Worker'); continue
        person = ALIAS.get(norm(name), norm(name))
        variant = re.sub(r'^\d+$', '', rest[1]) if len(rest) > 1 else ''
        name = re.sub(r'\d+$', '', name)
        person = re.sub(r'\d+$', '', person)
        put('named:' + person, 'named', r, name=name, title=PREFIX_TITLE.get(cls, title_case(cls)))
    elif cls in ('ROCKETBOSS', 'GALACTICBOSS', 'PLASMABOSS'):
        put('named:' + ALIAS[norm(cls)], 'named', r, name=ALIAS[norm(cls)].capitalize())
    else:
        g = GENDER.get(rest[-1]) if rest else None
        put('class:' + norm(cls) + (g or '') , 'class', r, name=title_case(cls), gender=g)

# Outfits and duos of people the game already has stay with that person.
OUTFIT = re.compile(r'^(.+?)(travel|vacation|champion|cape|swimsuit|coat|stone|darach|ingo|tate)$')
for key in list(ids):
    e = ids[key]
    m = OUTFIT.match(key.split(':', 1)[1]) if e['kind'] == 'named' else None
    base = m and ('named:' + m.group(1))
    if base and (base in ids or m.group(1) in boss_ids):
        e['variantOf'] = m.group(1)

# Mark what the game already has
for e in ids.values():
    k = e['key'].split(':', 1)[1]
    if e['kind'] == 'named':
        k = e.get('variantOf', k)
        bid = k if k in boss_ids else boss_by_name.get(k)
        e['existing'] = bid
        e['animatedNow'] = bool(bid and bid in animated)
    else:
        sprite_names = {s.split('.', 1)[1].replace('npc_', '') for s in class_sprites}
        base = e['file'][:-4]
        e['existing'] = next((s for s in class_sprites if norm(s.split('.', 1)[1].replace('npc_', '')) == norm(base)), None)

lst = sorted(ids.values(), key=lambda e: e['key'])
json.dump(lst, open(out, 'w'), indent=1, ensure_ascii=False)
from collections import Counter
c = Counter((e['kind'], 'existing' if e['existing'] else 'new', 'anim' if e['frames'] > 1 else 'still') for e in lst)
for k, v in sorted(c.items()): print(k, v)
print('skipped', len(skipped))
