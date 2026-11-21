"""DOMINION D2 (D10 added 151-600): turns the design lists `lists/player-actions.md` (Boss actions 1-150) and
`player-actions-151-300.md`, `-301-450.md`, `-451-600.md` (project files plans/evil-mode-rework/lists/) into
src/data/dominion/actions.json. Run: python3 -I tools/dominion/build-actions.py <lists folder>
(D10's tools/dominion/growth-to-json.py then works out how rows 151-600 play.)
The list is copied as written (name, slot, stat, what, the five level steps, unlock). How each one plays lives in
field.json (`play`); an action with no `play` entry shows as locked with the slice that opens it."""
import json, re, sys

LISTS = ['player-actions.md', 'player-actions-151-300.md', 'player-actions-301-450.md', 'player-actions-451-600.md']
src = [l for f in LISTS for l in open(f'{sys.argv[1]}/{f}', encoding='utf-8').read().splitlines()]
SLOT = {'D': 'day', 'N': 'night', 'E': 'evening'}
out, section = [], ''
for line in src:
    m = re.match(r'^## ([A-Z]{1,2})\. (.+?) \(', line)
    if m:
        section = m.group(2).strip()
        continue
    m = re.match(r'^\| (\d+) \|', line)
    if not m:
        continue
    cells = [c.strip() for c in line.strip().strip('|').split('|')]
    if len(cells) < 7:
        continue  # the level table at the top
    n, name, slot, stat, what, levels, unlock = cells[:7]
    name = name.replace('**', '').strip()
    base = re.sub(r'\s*\(.*?\)', '', name).lower().replace('é', 'e')
    ident = re.sub(r'[^a-z0-9]+', '-', base).strip('-')
    steps = [s.strip() for s in levels.split('→')]
    assert len(steps) == 5, (n, steps)
    stat = stat.lower()
    out.append({
        'n': int(n), 'id': ident, 'name': name, 'section': section, 'slot': SLOT[slot],
        'stat': stat if stat in ('brawn', 'nerve', 'wits', 'charm', 'stealth') else ('all' if stat == 'all' else None),
        'what': what, 'levels': steps, 'unlock': unlock or 'Day 1',
    })
assert [a['n'] for a in out] == list(range(1, 601)), 'expected rows 1-600'
ids = [a['id'] for a in out]
dup = sorted({i for i in ids if ids.count(i) > 1})
assert not dup, f'duplicate ids {dup}'
doc = {'_source': 'plans/evil-mode-rework/lists/player-actions.md + player-actions-151-300/301-450/451-600.md (rows 1-600), built by tools/dominion/build-actions.py', 'actions': out}
with open('src/data/dominion/actions.json', 'w', encoding='utf-8') as f:
    json.dump(doc, f, ensure_ascii=False, indent=1)
    f.write('\n')
print(len(out), 'actions')
