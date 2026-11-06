"""Reads the Pokémon Decades trainer files and lists each trainer type's Pokémon in our species ids.

  python3 -I tools/drive/teams.py <decades dir> <repo root> <out.json>

Output: { "<TRAINER_TYPE_ID>": ["garchomp", ...] } in team order, all teams of that type joined.
Forms and items are dropped; only the species matter (they decide a trainer's types and signature Pokémon)."""
import json, os, re, sys

dec, root, out = sys.argv[1:4]
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
species = json.load(open(os.path.join(root, 'src/data/species.json')))
by = {}
for s in species:
    if s.get('form') or '-' in s['id'] and norm(s['name']) != norm(s['id']):
        by.setdefault(norm(s['name']), s['id'])
    by.setdefault(norm(s['id']), s['id'])
    by.setdefault(norm(s['name']), s['id'])
FIX = {'nidoranfe': 'nidoran-f', 'nidoranma': 'nidoran-m'}
teams, missing = {}, set()
for f in ('trainers_battle_mode.txt', 'trainers_story_mode.txt', 'trainers.txt'):
    cur = None
    for line in open(os.path.join(dec, f), encoding='utf-8-sig'):
        m = re.match(r'^\[(\w+),', line)
        if m:
            cur = teams.setdefault(m.group(1), [])
            continue
        m = re.match(r'^Pokemon = (\w+)', line)
        if m and cur is not None:
            k = norm(m.group(1))
            sid = FIX.get(k) or by.get(k)
            if sid: cur.append(sid)
            else: missing.add(m.group(1))
json.dump(teams, open(out, 'w'))
print(len(teams), 'trainer types with teams; unknown species:', sorted(missing)[:30], len(missing))
