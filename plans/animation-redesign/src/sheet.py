#!/usr/bin/env python3
"""Film-strip sheet for one pass: one row per clip, six moments each.
python3 sheet.py <pass> <shots dir> <out dir> [rows per sheet]"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
P, D, OUT = sys.argv[1], sys.argv[2], sys.argv[3]; PER = int(sys.argv[4]) if len(sys.argv) > 4 else 9
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
def font(sz):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',):
        if os.path.exists(f): return ImageFont.truetype(f, sz)
    return ImageFont.load_default()
idx = json.load(open(os.path.join(D, 'index.json'))); os.makedirs(OUT, exist_ok=True)
W, H, PAD, LAB = 320, 180, 6, 26; F = font(15); f2 = font(12)
for s in range(0, len(idx), PER):
    rows = idx[s:s + PER]; sheet = Image.new('RGB', (6 * (W + PAD) + PAD, len(rows) * (H + LAB + PAD) + PAD), '#12141b'); d = ImageDraw.Draw(sheet)
    for r, c in enumerate(rows):
        y = PAD + r * (H + LAB + PAD)
        d.text((PAD, y + 4), 'Pass %s · %s%s   %.1fs' % (P, c['title'], '  NEW' if c['isNew'] else '', c['dur']), fill='#ffcb05', font=F)
        for k, (f, t) in enumerate(c['fr']):
            im = Image.open(os.path.join(D, f)).convert('RGB').resize((W, H), Image.LANCZOS); x = PAD + k * (W + PAD); sheet.paste(im, (x, y + LAB))
            d.rectangle((x, y + LAB, x + 46, y + LAB + 16), fill='#000000'); d.text((x + 4, y + LAB + 1), '%.2fs' % t, fill='#ffffff', font=f2)
    n = s // PER + 1; sheet.save(os.path.join(OUT, 'pass-%02d-%d.jpg' % (int(P), n)), quality=82)
print('sheets:', (len(idx) + PER - 1) // PER)
