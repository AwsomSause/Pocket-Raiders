#!/usr/bin/env python3
"""Adds single sprites to ../sprites without re-running assets.py.
Run from the repo root: python3 plans/evil-mode-rework/redesign-50/src/add.py m:735 mb:6 t:milo=bosses/milo a:wasteland raw:rd-den=packs/raid/ui/den_entry"""
import json, os, sys
from PIL import Image
A = 'public/assets/images/'; OUT = 'plans/evil-mode-rework/redesign-50/sprites/'
def first_frame(path):
    im = Image.open(path + '.png').convert('RGBA'); j = path + '.json'
    if os.path.exists(j):
        d = json.load(open(j)); fr = d['textures'][0]['frames'] if 'textures' in d else d['frames']
        if isinstance(fr, dict): fr = [dict(v, filename=k) for k, v in fr.items()]
        fr = sorted(fr, key=lambda f: f['filename'])[0]; r = fr['frame']
        im = im.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
    else:
        w, h = im.size
        if w > h * 1.5: im = im.crop((0, 0, h, h))
    bb = im.getbbox(); return im.crop(bb) if bb else im
miss = []
for spec in sys.argv[1:]:
    kind, _, rest = spec.partition(':')
    try:
        if kind == 'm': first_frame(A + 'pokemon/' + rest).save(OUT + 'm-' + rest + '.png', optimize=True)
        elif kind == 'mb': first_frame(A + 'pokemon/back/' + rest).save(OUT + 'mb-' + rest + '.png', optimize=True)
        elif kind == 't': n, p = rest.split('='); first_frame(A + p).save(OUT + 't-' + n + '.png', optimize=True)
        elif kind == 'raw': n, p = rest.split('='); Image.open(A + p + '.png').save(OUT + n + '.png', optimize=True)
        elif kind == 'a':
            for s in ('bg', 'a', 'b'):
                f = A + 'arenas/%s_%s.png' % (rest, s)
                if not os.path.exists(f): miss.append(f); continue
                im = Image.open(f).convert('RGBA')
                if s != 'bg': im = im.crop(im.getbbox())
                im.save(OUT + 'a-%s-%s.png' % (rest, s), optimize=True)
    except Exception as e: miss.append(spec + ' ' + str(e)[:60])
print('missing:', miss)
