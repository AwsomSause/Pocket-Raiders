"""Evolution sheet with one extra 'headline page' per pass.
python3 evo2.py <shots dir> <out.jpg> <ids,comma> <pass:headline,pass:headline,...> [pass:id/id/id/id other pages for one pass]"""
import sys, os, re, json
from PIL import Image, ImageDraw, ImageFont
shots, out, ids, heads = sys.argv[1], sys.argv[2], sys.argv[3].split(','), dict(x.split(':') for x in sys.argv[4].split(','))
notes = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'notes.json')))
alt = dict((int(a.split(':')[0]), a.split(':')[1].split('/')) for a in sys.argv[5:])
tw, th, pad, lab = 400, 225, 8, 30
ps = sorted(int(p) for p in heads)
im = Image.new('RGB', (pad + (len(ids) + 1) * (tw + pad), len(ps) * (th + lab + pad) + pad), '#11131c'); d = ImageDraw.Draw(im)
try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
except Exception: f = ImageFont.load_default()
for r, p in enumerate(ps):
    y = pad + r * (th + lab + pad); d.text((pad, y + 4), 'Pass %d · %s' % (p, notes[str(p)]['name']), fill='#ffcb05', font=f)
    files = os.listdir('%s/p%d' % (shots, p))
    for c, i in enumerate(alt.get(p, ids) + [heads[str(p)]]):
        g = [x for x in files if re.fullmatch(r'\d+-' + re.escape(i) + r'\.png', x)]
        if g: im.paste(Image.open('%s/p%d/%s' % (shots, p, g[0])).convert('RGB').resize((tw, th), Image.LANCZOS), (pad + c * (tw + pad), y + lab))
im.save(out, quality=88); print(out)
