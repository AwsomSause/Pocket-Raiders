"""Builds src/data/spriteScales.json: a size multiplier for custom Pokémon whose art was drawn bigger or smaller than
the base-game sprites it sits beside (python3 tools/build-sprite-scales.py, Pillow).

Battle sprites are drawn at one fixed scale, so a 120 px custom sprite towers over a 70 px Aggron. Each custom species
gets a target height (px of the first front frame's visible art):
  - TARGETS below: Jet / Beta 4.4 / story Pokémon, picked from a related species' height and the new Pokémon's weight;
  - other custom forms (Delta, Z, Spooky ...): clamped to 0.75-1.3x of their base species' height (Megas: up to 1.25x
    of the form they come from). Art already inside that range is left alone.
Presentation only: no rule, roll or save reads this.
"""
import json, os
from PIL import Image

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
P = os.path.join(root, 'public', 'assets', 'images', 'pokemon')
D = os.path.join(root, 'src', 'data')

TARGETS = {
    # Jet (reference: Toxtricity 84 px, Espeon-sized Eeveelutions ~58, Bastiodon 59, Aggron 69)
    'vine-riff': 76, 'electric-oncore': 80, 'pyro-spirit': 58, 'neon-moon': 60, 'bastiodoom': 72,
    'cataggron': 75, 'cataggron-attack': 75, 'cataggron-defence': 75,
    # Beta 4.4 (reference: Sableye 46, Krookodile ~72, Trapinch 40, Vibrava 50, Flygon 69, Golurk 79, Dratini 44, Dragonair 72, Dragonite 78)
    'benovolant-beak': 55, 'tyrant-king': 75, 'fallen-liege': 75, 'maliceye': 52, 'gemgoyle': 72, 'dreadodile': 76,
    'alolan-trapinch': 42, 'alolan-vibrava': 55, 'alolan-flygon': 70, 'alolan-flygon-mega': 74,
    'paldean-golett': 56, 'paldean-golurk': 78, 'alolan-dratini': 44, 'alolan-dragonair': 70, 'alolan-dragonite': 80,
    # Story Pokémon (reference: Noctowl 65, Swellow 59, Kilowattrel 67)
    'oracowl': 68, 'oracowl-day': 68, 'tempestwing': 62, 'megawattrel': 70,
}


def front_h(sprite):
    p = os.path.join(P, sprite)
    if not os.path.exists(p + '.png'):
        return None
    a = json.load(open(p + '.json'))
    frames = a['textures'][0]['frames'] if 'textures' in a else a['frames']
    fr = (frames[0] if isinstance(frames, list) else next(iter(frames.values())))['frame']
    im = Image.open(p + '.png').convert('RGBA').crop((fr['x'], fr['y'], fr['x'] + fr['w'], fr['y'] + fr['h']))
    b = im.getchannel('A').getbbox()
    return b[3] - b[1] if b else None


def load(f):
    j = json.load(open(os.path.join(D, f)))
    return j if isinstance(j, list) else (j.get('species') or list(j.values()))


sp = {}
for f in ('species.json', 'customSpecies.json', 'jetSpecies.json', 'storySpecies.json'):
    for s in load(f):
        sp[s['id']] = s
H = {i: front_h(s['assets']['sprite']) for i, s in sp.items() if (s.get('assets') or {}).get('sprite')}
custom = [i for i, s in sp.items() if 'custom' in ((s.get('assets') or {}).get('sprite') or '')]

target = {}
def goal(i, depth=0):
    """Target height of species i (resolves a form's base first so a Mega follows its adjusted base)."""
    if i in target:
        return target[i]
    s, h = sp[i], H.get(i)
    if h is None:
        return None
    if i in TARGETS:
        target[i] = TARGETS[i]; return target[i]
    form = s.get('form') or {}
    base = form.get('base')
    if base in sp and depth < 6 and base in H and H[base]:
        bh = goal(base, depth + 1) or H[base]
        hi = 1.25 if form.get('kind') == 'mega' else 1.3
        lo = 0.75 if form.get('kind') != 'mega' else 1.0
        target[i] = min(max(h, round(bh * lo)), round(bh * hi))
        return target[i]
    target[i] = h
    return h

out = {}
for i in custom:
    g, h = goal(i), H.get(i)
    if g and h and abs(g - h) / h > 0.04:
        out[i] = round(g / h, 3)
json.dump({'note': 'Size multiplier on the battle/display scale of custom Pokémon, built by tools/build-sprite-scales.py. Presentation only.', 'scales': dict(sorted(out.items()))},
          open(os.path.join(D, 'spriteScales.json'), 'w'), indent=1)
print(len(out), 'scaled of', len(custom))
