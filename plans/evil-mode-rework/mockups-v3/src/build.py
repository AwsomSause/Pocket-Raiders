"""Builds the v3 Dominion mockups: base.html (the round-2 Dominion + Chair + Rotom screens merged) + passes 1..N
from passes.py -> ../index.html and ../passes.json.  Run: python3 build.py [N=25] [outdir]"""
import json, re, sys, html as H
import os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import importlib, passes as P
importlib.reload(P)

N = int(sys.argv[1]) if len(sys.argv) > 1 else 25
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(HERE)
src = open(os.path.join(HERE, 'base.html'), encoding='utf-8').read()
IDS = re.findall(r'<figure id="([a-z0-9]+)">', src)

css, log = [], {i: [] for i in IDS}
for p in P.PASSES[:N]:
    css.append('/* ===== v3 pass %d: %s ===== */\n%s' % (p['n'], p['name'], p['css'].strip()))
    for (scope, old, new) in p.get('replace', []):
        if scope:
            i = src.index('<figure id="%s">' % scope); j = src.index('</figure>', i)
            seg = src[i:j]
            assert old in seg, ('pass', p['n'], scope, old[:60])
            src = src[:i] + seg.replace(old, new, 1) + src[j:]
        else:
            assert old in src, ('pass', p['n'], old[:60])
            src = src.replace(old, new)
    per = p.get('per', {})
    for sid in IDS:
        snip = per.get(sid, {}).get('html') or (p['each'](sid) if p.get('each') else '')
        if snip:
            i = src.index('<figure id="%s">' % sid); j = src.index('\n</div></div>\n<figcaption>', i)
            src = src[:j] + '\n  ' + snip + src[j:]
        note = per.get(sid, {}).get('note') or p['note']
        log[sid].append('%s: %s' % (p['name'], note))

# one style block (the game's port tool reads only the first one)
k = src.index('</style>')
src = src[:k] + '\n'.join(css) + '\n' + src[k:]

# captions: the first five passes stay, the new ones go in a second list
for sid in IDS:
    i = src.index('<figure id="%s">' % sid); j = src.index('</figure>', i)
    seg = src[i:j]
    seg = seg.replace('<ol class="passes" aria-label="Five passes">', '<details class="older"><summary>First five passes (earlier round)</summary><ol class="passes" aria-label="First five passes">', 1)
    seg = seg.replace('</ol></figcaption>', '</ol></details>' + (
        '<ol class="passes v3" aria-label="New passes">' + ''.join('<li>%s</li>' % H.escape(x, quote=False) for x in log[sid]) + '</ol>' if log[sid] else '') + '</figcaption>', 1)
    src = src[:i] + seg + src[j:]

src = P.header(src, N)
open(OUT + '/index.html', 'w', encoding='utf-8').write(src)
json.dump(log, open(OUT + '/passes.json', 'w'), indent=1, ensure_ascii=False)
print('built', N, 'passes', len(src))
