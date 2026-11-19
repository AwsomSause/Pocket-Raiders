"""Round 4 builder: base.html (v3 final) + intervals 1..K (iN.py) -> out/index.html + passes.json."""
# Run from anywhere: python3 build4.py [intervals=5] [out_dir=..]. The base is the final round-3 page (../../mockups-v3/index.html).
import json, re, sys, os, importlib, html as H
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
K = int(sys.argv[1]) if len(sys.argv) > 1 else 5
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(HERE)
src = open(os.path.join(HERE, '..', '..', 'mockups-v3', 'index.html'), encoding='utf-8').read()
OLD = re.findall(r'<figure id="([a-z0-9]+)">', src)
mods = [importlib.import_module('i%d' % k) for k in range(1, K + 1)]

CSS0 = r'''
/* ===== round 4: page furniture ===== */
.passes.r4 li::before{content:"Round 4";color:#ffd23f}
.passes.r4 li{border-color:#5a4a1c;background:#1d1708}
.r4rev{max-width:1200px;margin:0 auto 26px;padding:0 16px}
.r4rev h2{font-size:20px;margin:0 0 10px;color:#ffe58a}
.r4rev details{background:#141a33;border:2px solid #2c3766;border-radius:12px;margin-bottom:10px;padding:10px 14px}
.r4rev details[open]{border-color:#7a6420}
.r4rev summary{cursor:pointer;font-weight:700;color:#f3e7c0;font-size:16px}
.r4rev summary small{font-weight:400;color:var(--muted);margin-left:8px}
.r4rev .big{margin:8px 0 10px;color:#ffd23f;font-size:15px}
.r4rev .qs{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px}
.r4rev .q{margin:0;background:#0f1428;border:1px solid #2a3360;border-radius:8px;padding:8px 10px;font-size:13.5px;line-height:1.4;color:#c9d2f2;min-width:0}
.r4rev .q b{display:block;color:#fff;margin-bottom:4px;font-size:14px}
.r4rev .q dt{color:#c9a0ff;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;margin-top:5px}
.r4rev .q dd{margin:0}
'''
Q = ['More extravagant?', 'Better than last time?', 'More pages?', 'Menu and Settings?', 'Evil Pokémon game?']

css, notes, newfigs, nav, reviews = [CSS0], {i: [] for i in OLD}, [], [], []
for k, m in enumerate(mods, 1):
    css.append('/* ===== round 4 interval %d ===== */\n%s' % (k, m.CSS.strip()))
    for (scope, old, new) in getattr(m, 'REPLACE', []):
        if scope:
            i = src.index('<figure id="%s">' % scope); j = src.index('</figure>', i)
            seg = src[i:j]; assert old in seg, (k, scope, old[:60])
            src = src[:i] + seg.replace(old, new, 1) + src[j:]
        else:
            assert old in src, (k, old[:60]); src = src.replace(old, new)
    for f in newfigs:  # later intervals may restyle earlier new pages
        pass
    newfigs += m.PAGES; nav += m.PAGE_NAV
    each = getattr(m, 'EACH', None)
    for sid in OLD:
        snip = each(sid) if each else ''
        if snip:
            i = src.index('<figure id="%s">' % sid); j = src.index('\n</div></div>\n<figcaption>', i)
            src = src[:j] + '\n  ' + snip + src[j:]
        notes[sid] += m.NOTES.get(sid, []) + ([m.ALL_NOTE] if getattr(m, 'ALL_NOTE', '') else [])
    for fid, _ in m.PAGE_NAV:
        notes.setdefault(fid, [])
    for fid in list(notes):
        if fid not in OLD: notes[fid] += m.NOTES.get(fid, [])
    reviews.append((k, getattr(m, 'TITLE', 'Interval %d' % k), getattr(m, 'BIG', ''), m.REVIEW))

# later intervals may patch new-page html too
pages = '\n'.join(newfigs)
for m in mods:
    for (scope, old, new) in getattr(m, 'PAGE_REPLACE', []):
        i = pages.index('<figure id="%s">' % scope); j = pages.index('</figure>', i)
        seg = pages[i:j]; assert old in seg, (scope, old[:60]); pages = pages[:i] + seg.replace(old, new, 1) + pages[j:]
    if getattr(m, 'EACH_NEW', None):
        for fid, _ in nav:
            snip = m.EACH_NEW(fid)
            if snip and ('<figure id="%s">' % fid) in pages:
                i = pages.index('<figure id="%s">' % fid); j = pages.index('\n</div></div>\n<figcaption>', i)
                pages = pages[:j] + '\n  ' + snip + pages[j:]
for fid, _ in nav:
    li = ''.join('<li>%s</li>' % H.escape(x, quote=False) for x in notes[fid])
    pages = pages.replace('<!--R4:%s-->' % fid, '<ol class="passes r4" aria-label="Round 4 notes">%s</ol>' % li)

k = src.index('</style>'); src = src[:k] + '\n'.join(css) + '\n' + src[k:]

for sid in OLD:
    i = src.index('<figure id="%s">' % sid); j = src.index('</figure>', i); seg = src[i:j]
    seg = seg.replace('<ol class="passes v3"', '<details class="older"><summary>Round 3 passes (25)</summary><ol class="passes v3"', 1)
    li = ''.join('<li>%s</li>' % H.escape(x, quote=False) for x in notes[sid])
    seg = seg.replace('</ol></figcaption>', '</ol></details>' + ('<ol class="passes r4" aria-label="Round 4 notes">%s</ol>' % li if li else '') + '</figcaption>', 1)
    src = src[:i] + seg + src[j:]

# reviews + new pages go right after the header
rv = ['<section class="r4rev" id="review"><h2>Round 4 · the five questions, asked every pass</h2>']
for (k, title, big, rows) in reviews:
    rv.append('<details%s><summary>Interval %d · passes %d–%d · %s<small>%s</small></summary>' % (' open' if k == len(reviews) else '', k, 5*k-4, 5*k, H.escape(title), 'latest' if k == len(reviews) else ''))
    if big: rv.append('<p class="big"><b>Big change:</b> %s</p>' % H.escape(big))
    rv.append('<div class="qs">')
    for n, r in enumerate(rows):
        rv.append('<dl class="q"><b>Pass %d · %s</b>%s</dl>' % (5*k-4+n, H.escape(r[0]), ''.join('<dt>%s</dt><dd>%s</dd>' % (q, H.escape(a)) for q, a in zip(Q, r[1:]))))
    rv.append('</div></details>')
rv.append('</section>')
sect = '\n<div class="sect" id="newpages"><h2>New pages · Menu, Settings and action pages</h2></div>\n'
hb = src.index('</header>') + len('</header>')
src = src[:hb] + '\n' + '\n'.join(rv) + sect + pages + '\n<div class="sect" id="dominion"><h2>Dominion · the 14 main screens</h2></div>\n' + src[hb:]

# header text
a = src.index('<header class="mast">'); b = src.index('</header>', a) + len('</header>')
v3nav = re.search(r'<nav class="jump" aria-label="Screens">(.*?)</nav>', src[a:b]).group(1)
navh = '<a href="#review">Reviews</a>' + ''.join('<a href="#%s">%s</a>' % x for x in nav) + v3nav
new = ('<header class="mast">\n  <div class="eyebrow">Pocket Raiders · Evil Mode (Dominion) · Round 4 · interval %d of 5</div>\n  <h1>Dominion</h1>\n'
       '  <p>Round 4 of the Evil Mode mockups: %d of 25 passes done. Every pass asked five questions: is it more extravagant, how is it better than last time, '
       'does an action need its own page, how do a Menu and Settings fit, and does it feel like an evil Pokémon game? The answers are in Reviews below. '
       'New pages come first, then all 27 screens. Mock data only; the game rules are unchanged.</p>\n'
       '  <div class="how"><b>Build notes:</b> all styles sit in the one style block so tools/dominion/port-mockup-css.py can port them. '
       'Every animation stops under reduced motion. The battle screen is not part of this set and gets no new styles.</div>\n'
       '  <nav class="jump" aria-label="Screens">%s</nav>\n</header>') % (K, 5*K, navh)
src = src[:a] + new + src[b:]
open(OUT + '/index.html', 'w', encoding='utf-8').write(src)
json.dump({'notes': notes, 'reviews': [{'interval': k, 'title': t, 'big': b, 'passes': [dict(zip(['name'] + Q, r)) for r in rows]} for k, t, b, rows in reviews]},
          open(OUT + '/passes.json', 'w'), indent=1, ensure_ascii=False)
print('built interval', K, len(src), 'new pages', [x[0] for x in nav])
