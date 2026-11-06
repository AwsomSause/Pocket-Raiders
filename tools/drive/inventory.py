"""Builds one list of every trainer sprite in the Drive packs (phase 1 of the trainer import).

  python3 -I tools/drive/inventory.py <pokerogue trainer dir> <animated intros Graphics/Trainers dir> <decades dir (Trainers + PBS txt)> <essentials Graphics/Trainers dir> <fan-game Graphics/Trainers dir> <out.json>

Each sprite becomes one row: who it is (a named person or a trainer class), where it comes from,
and whether it moves. Same person in several packs = one identity, best sprite first
(PokeRogue atlas > animated strip > still picture).
"""
import json, os, re, struct, sys

pr_dir, ati_dir, dec_dir, ess_dir, gfx_dir, out = sys.argv[1:7]

def png_size(p):
    with open(p, 'rb') as f:
        b = f.read(24)
    return struct.unpack('>II', b[16:24])

def norm(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())

CLASS_PREFIX_TITLES = {
    'LEADER': 'Gym Leader', 'ELITEFOUR': 'Elite Four', 'CHAMPION': 'Champion', 'FRONTIERBRAIN': 'Frontier Brain',
    'SUBWAYBOSS': 'Subway Boss', 'ROCKETADMIN': 'Rocket Admin', 'TEAMPLASMA': 'Team Plasma', 'POKEMONTRAINER': 'Pokémon Trainer',
    'PROFESSOR': 'Professor', 'BOSSTRAINER': 'Boss Trainer', 'WORKER': 'Worker',
}
GENDER = {'M': 'm', 'F': 'f', 'MAN': 'm', 'WOMAN': 'f', 'BOY': 'm', 'GIRL': 'f', 'MEN': 'm', 'WOMEN': 'f', 'GUY': 'm'}

rows = []

def add(**r):
    rows.append(r)

# 1. PokeRogue atlases (already the game's format)
for f in sorted(os.listdir(pr_dir)):
    if not f.endswith('.png'):
        continue
    name = f[:-4]
    j = json.load(open(os.path.join(pr_dir, name + '.json')))
    frames = sum(len(t['frames']) for t in j['textures']) if 'textures' in j else len(j.get('frames', {}))
    m = re.match(r'^(.*?)(?:_(m|f))?(?:_(\d|alternate|back|back_pb|holo))?$', name)
    add(src='pokerogue', file=f, raw=name, frames=frames)

# 2. Animated Trainer Intros + 4. Essentials (CLASS[_Name][_n][_back])
def ess_like(d, src):
    for f in sorted(os.listdir(d)):
        p = os.path.join(d, f)
        if not f.lower().endswith('.png') or os.path.isdir(p):
            continue
        w, h = png_size(p)
        add(src=src, file=f, raw=f[:-4], frames=max(1, round(w / h)) if h else 1, size=[w, h])
ess_like(ati_dir, 'intros')
ess_like(ess_dir, 'essentials')
ess_like(gfx_dir, 'graphics')

# 3. Decades: REGION_GAME_REST with its PBS title
titles = {}
txt = open(os.path.join(dec_dir, 'trainer_types_CTPBS.txt'), encoding='utf-8-sig').read()
for tid, title in re.findall(r'^\[(\w+)\]\s*\nName = (.*)', txt, re.M):
    titles[tid] = title.strip()
for f in sorted(os.listdir(os.path.join(dec_dir, 'Trainers'))):
    if not f.endswith('.png'):
        continue
    p = os.path.join(dec_dir, 'Trainers', f)
    w, h = png_size(p)
    add(src='decades', file=f, raw=f[:-4], frames=max(1, round(w / h)) if h else 1, size=[w, h], title=titles.get(f[:-4]))

json.dump(rows, open(out, 'w'), indent=0)
from collections import Counter
print(Counter(r['src'] for r in rows), 'animated', Counter(r['src'] for r in rows if r['frames'] > 1))
