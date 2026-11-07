"""Shared helpers for the item-uses batches (tools/drive/wire-library3-*.py, "give every remaining picture a use").

Each batch script runs:  python3 -I tools/drive/wire-library3-<tag>.py <repo>
and loads this file with exec(). A batch writes tools/drive/library-items3-<tag>.json (its ids); re-running replaces them.
If an id is already taken by another catalog item, "-2" is added so both exist. No picture is imported: every picture is already in images/items/library.
"""
import json
import os
import sys

REPO = sys.argv[1]
P, T, Y = 'pokemon', 'team', 'player'
ITEMS = []
RUN = {'for': 'run'}
ALL = 'bug dark dragon electric fairy fighting fire flying ghost grass ground ice normal poison psychic rock steel water'.split()


def add(pic, id_, name, family, desc, rarity, stacks, mx, how, effect):
    ITEMS.append(dict(id=id_, name=name, family=family, description=desc, rarity=rarity, stacksOn=stacks, max=mx, how=how, icon=f'library/{pic}', status='supported', effect=effect))


held = lambda *h: {'kind': 'held', 'hooks': list(h)}
enc = lambda lasts, *mods, **ch: {'kind': 'encounter', 'lasts': lasts, 'mods': list(mods), **({'changes': ch} if ch else {})}
money = lambda n, **ch: {'kind': 'money', 'amount': n, 'changes': ch}
care = lambda **k: {'kind': 'care', **k}
tcare = lambda **k: {'kind': 'teamCare', **k}
attrs = lambda **ch: {'kind': 'attributes', 'changes': ch}
perk = lambda *perks, lasts=RUN: {'kind': 'perk', 'lasts': lasts, 'perks': list(perks)}
passive = lambda name, pct: {'kind': 'passive', 'passive': name, 'percent': pct}
boost = lambda *b, **k: {'kind': 'battleBoost', 'boosts': list(b), **k}
stage = lambda stat, st, turns=8: {'kind': 'stage', 'stat': stat, 'stages': st, 'turns': turns}
feed = lambda fr=0, evs=None, **ch: {'kind': 'feed', 'friendship': fr, 'changes': ch, **({'evs': evs} if evs else {})}
battles = lambda n: {'for': 'battles', 'count': n}
STAGE = {'for': 'stage'}
NEXT = {'for': 'nextStage'}
stat = lambda s, m, species=None: {'hook': 'stat', 'stat': s, 'multiplier': m, **({'species': species} if species else {})}
tp = lambda types, pct: {'hook': 'typePower', 'types': types, 'percent': pct}


def finish(tag):
    cat_p, ids_p = f'{REPO}/src/data/itemCatalog.json', f'{REPO}/tools/drive/library-items3-{tag}.json'
    old = set(json.load(open(ids_p))) if os.path.exists(ids_p) else set()
    catalog = [e for e in json.load(open(cat_p, encoding='utf-8')) if e['id'] not in old]
    taken = {e['id'] for e in catalog}
    lib = {f[:-4] for f in os.listdir(f'{REPO}/public/assets/images/items/library')}
    out = []
    for e in ITEMS:
        pic = e['icon'].split('/')[-1]
        if pic not in lib:
            print(f'skipped {e["id"]}: no picture {pic}')
            continue
        if e['id'] in taken:
            e['id'] += '-2'
            print('renamed to', e['id'])
        taken.add(e['id'])
        out.append(e)
    open(cat_p, 'w', encoding='utf-8').write(json.dumps(catalog + out, indent=1, ensure_ascii=False) + '\n')
    open(ids_p, 'w').write(json.dumps(sorted(e['id'] for e in out), indent=1) + '\n')
    pics = sorted({e['icon'].split('/')[-1] for e in out})
    print(len(out), 'catalog items,', len(pics), 'pictures')
