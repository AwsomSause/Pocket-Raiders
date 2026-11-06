"""Shrinks the pixel fonts (run once; needs `pip install fonttools brotli`).
Usage: python3 tools/subset-fonts.py <pokemon-emerald-pro.ttf> <pkmnems.ttf> <outdir>
- keeps Latin, punctuation, arrows, symbols (35k glyphs -> ~1k); writes woff2
- drops the male/female signs so the browser draws them with a system font (the pixel glyph read as "$")
- pkmnems: tightens the narrow letters (l, i, j ...), whose extra side space made "Leve l" / "Tange la"
"""
import sys
from fontTools.ttLib import TTFont
from fontTools import subset

RANGES = list(range(0x20, 0x250)) + list(range(0x2000, 0x2070)) + list(range(0x2190, 0x2200)) + list(range(0x25A0, 0x2600)) + list(range(0x2600, 0x2700)) + [0x20A0, 0x20AC, 0x20BD, 0x2122, 0x2212, 0x2260, 0x2264, 0x2265]
DROP = {0x2640, 0x2642}
main_src, bold_src, out = sys.argv[1:4]

def sub(src, dst, tighten):
    f = TTFont(src)
    if tighten:
        c, g, h, em = f.getBestCmap(), f['glyf'], f['hmtx'], f['head'].unitsPerEm
        px = em // 8
        for cp in range(0x21, 0x250):
            n = c.get(cp)
            if not n or cp in (0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30):
                continue
            gl = g[n]
            if gl.numberOfContours == 0 or gl.xMin <= 0:
                continue
            gl.coordinates.translate((-gl.xMin, 0))
            gl.recalcBounds(g)
            h[n] = (gl.xMax - gl.xMin + px, 0)
    opt = subset.Options()
    opt.flavor = 'woff2'
    opt.layout_features = ['*']
    opt.notdef_outline = True
    opt.hinting = False
    s = subset.Subsetter(opt)
    s.populate(unicodes=[u for u in RANGES if u not in DROP])
    s.subset(f)
    f.flavor = 'woff2'
    f.save(dst)

sub(main_src, f'{out}/pokemon-emerald-pro.woff2', False)
sub(bold_src, f'{out}/pkmnems.woff2', True)
