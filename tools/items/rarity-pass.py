"""Item rework part 3 (Kice, 2026-11-07): rarity pass over every catalog item.

Sets each base item's rarity from how strong it is, so Stage I/II/III (core/itemStages.ts) climb from
a sensible start, and makes anything that gives Luck one rarity harder to get (Luck nerf).
Only touches supported items whose effect has a clear strength number; everything else keeps its rarity.
Run: python3 tools/items/rarity-pass.py  (prints every change; safe to run again, it is idempotent).
"""
import json, os

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PATH = os.path.join(REPO, 'src/data/itemCatalog.json')
BAL = json.load(open(os.path.join(REPO, 'src/data/balance.json')))
SKIP_FAMILIES = set(BAL['itemStages']['skipFamilies'])
RAR = ['common', 'uncommon', 'rare', 'epic']


def band(v, limits):
    """Index of the first limit v is at or under (limits for common, uncommon, rare); epic above them all."""
    for i, lim in enumerate(limits):
        if v <= lim:
            return i
    return len(limits)


def strength(e, x_stacks):
    """Base rarity index from the effect's main number, or None to leave the item alone."""
    k = e['kind']
    if k == 'money':
        return band(e['amount'], [150, 500, 10**9])  # money-only valuables are never epic (Major Update rarity audit)
    if k == 'statBoost':
        return band(e['percent'], [3, 4, 6])
    if k == 'feed':
        return band(e['friendship'], [15, 30, 60]) if e['friendship'] > 0 else None
    if k == 'care' and e.get('heal'):
        return band(e['heal'], [60, 120, 9999])
    if k == 'attributes':
        total = sum(abs(v) for a, v in e['changes'].items() if a != 'luck')
        return band(total, [2, 4, 8]) if total else None
    if k == 'battleBoost' and x_stacks != 'team':
        st = [b for b in e['boosts'] if b['kind'] == 'stage']
        return band(max(b['stages'] for b in st), [1, 2, 3]) if st else None
    if k == 'held' and len(e['hooks']) == 1:
        h = e['hooks'][0]
        if h['hook'] == 'typePower' and len(h.get('types', [])) == 1:
            return band(h['percent'], [10, 20, 30])
        if h['hook'] == 'berryHeal' and 'fraction' in h:
            return band(h['fraction'], [0.25, 0.34, 0.5])
    return None


def luck_of(e):
    ch = e.get('changes') or {}
    return ch.get('luck', 0) > 0 or any(p.get('luck', 0) > 0 for p in e.get('perks', []))


data = json.load(open(PATH))
changes = []
for x in data:
    if x.get('status') != 'supported' or x['family'] in SKIP_FAMILIES or x['name'].endswith('Charm'):
        continue
    e = x['effect']
    s = strength(e, x['stacksOn'])
    if s is None and not luck_of(e):
        continue
    idx = RAR.index(x['rarity']) if s is None else s
    if luck_of(e):
        idx += 1  # Luck nerf: anything that gives Luck is one rarity harder to find.
    new = RAR[min(3, idx)]
    if new != x['rarity']:
        changes.append((x['id'], x['rarity'], new))
        x['rarity'] = new

# Idempotent: a second run must not bump Luck items again.
marker = os.path.join(REPO, 'tools/items/rarity-pass.done.json')
if os.path.exists(marker):
    raise SystemExit('Already applied (tools/items/rarity-pass.done.json lists the changes); delete it to re-run on fresh data.')
open(PATH, 'w').write(json.dumps(data, indent=1, ensure_ascii=False) + '\n')
json.dump([{'id': i, 'from': a, 'to': b} for i, a, b in changes], open(marker, 'w'), indent=1)
for i, a, b in changes:
    print(f'{i}: {a} -> {b}')
print(len(changes), 'changed')
