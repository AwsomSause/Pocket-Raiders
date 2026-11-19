#!/usr/bin/env python3
"""Builds ../index.html (the whole mockup page) from the files here.
Run: python3 plans/ui-redesign/src/build.py [artifact-out.html]"""
import base64, glob, json, os, re, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
REPO = os.path.abspath(os.path.join(ROOT, '..', '..'))
FONTS = [('Jersey 15', 400, 'redux/jersey-15-400'), ('Pixelify Sans', 400, 'redux/pixelify-sans-400'), ('Tiny5', 400, 'redux/tiny5-400'),
         ('M PLUS Rounded 1c', 500, 'redux/m-plus-rounded-1c-500'), ('M PLUS Rounded 1c', 800, 'redux/m-plus-rounded-1c-800'),
         ('Oswald', 500, 'redux/oswald-500'), ('Rajdhani', 600, 'redux/rajdhani-600'), ('Rajdhani', 700, 'redux/rajdhani-700'),
         ('Cinzel', 600, 'redux/cinzel-600'), ('Pokemon Emerald Pro', 400, 'pokemon-emerald-pro')]
def read(p): return open(os.path.join(HERE, p), encoding='utf8').read()
def fonts():
    out = []
    for fam, w, f in FONTS:
        b = base64.b64encode(open(os.path.join(REPO, 'public/assets/fonts', f + '.woff2'), 'rb').read()).decode()
        out.append("@font-face{font-family:'%s';font-weight:%d;font-display:block;src:url(data:font/woff2;base64,%s) format('woff2')}" % (fam, w, b))
    return '\n'.join(out)
def pass_css(n):
    p = os.path.join(HERE, 'p%02d.css' % n)
    if not os.path.exists(p): return ''
    css = open(p, encoding='utf8').read()
    nested, _, top = css.partition('/*@top*/')
    return '<style data-pass="%d">\n#stage{\n%s\n}\n%s</style>\n' % (n, nested, top)
def main():
    notes = json.load(open(os.path.join(HERE, 'notes.json'), encoding='utf8'))
    maxp = max(int(k) for k in notes)
    sizes = {}
    for f in sorted(glob.glob(os.path.join(ROOT, 'sprites', '*.png'))):
        sizes[os.path.basename(f)[:-4]] = list(Image.open(f).size)
    js = 'const SPR=%s;\nconst NOTES=%s;\n' % (json.dumps(sizes, separators=(',', ':')), json.dumps(notes, ensure_ascii=False))
    js += read('kit.js')
    for n in range(1, maxp + 1):
        p = 'p%02d.js' % n
        if os.path.exists(os.path.join(HERE, p)): js += '\n/* ===== pass %d ===== */\n' % n + read(p)
    js += '\nboot();\n'
    head = ('<title>Pocket Raiders UI Redesign</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
            '<style>\n%s\n%s</style>\n' % (fonts(), read('base.css')))
    styles = ''.join(pass_css(n) for n in range(1, maxp + 1))
    body = ('<div id="app">\n<header class="vw-top vw-ui"><h1>Pocket Raiders · UI Redesign</h1>\n'
            '<div class="vw-passbar"><button class="vw-btn" data-pass-step="-1" aria-label="Earlier pass">◀</button><b id="vw-pass"></b>'
            '<button class="vw-btn" data-pass-step="1" aria-label="Later pass">▶</button><input id="vw-range" type="range" min="1" max="1" step="1" aria-label="Pass"><span id="vw-name"></span></div></header>\n'
            '<div id="vw-wrap"><div id="stage"></div></div>\n'
            '<div class="vw-row vw-ui"><span id="vw-cur"></span><button class="vw-btn" id="vw-replay">Replay animation</button><button class="vw-btn" id="vw-tour">Play tour</button><span>Click inside the screen to move around. Arrow keys change page, [ and ] change pass.</span></div>\n'
            '<nav id="vw-screens" class="vw-ui" aria-label="Pages"></nav>\n<section id="vw-review" class="vw-ui"></section>\n</div>\n')
    frag = head + styles + body + '<script>\n' + js + '</script>\n'
    open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf8').write('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n' + head + styles + '</head><body>\n' + body + '<script>\n' + js + '</script>\n</body></html>\n')
    if len(sys.argv) > 1: open(sys.argv[1], 'w', encoding='utf8').write(frag)
    json.dump(notes, open(os.path.join(ROOT, 'passes.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print('built: %d passes, %d KB' % (maxp, len(frag) // 1024))
main()
