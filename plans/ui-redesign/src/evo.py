#!/usr/bin/env python3
"""One picture showing the same key pages across several passes. python3 evo.py <from> <to> <shots root> <out.jpg> id1,id2,..."""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
a, b, root, out, ids = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3], sys.argv[4], sys.argv[5].split(',')
notes = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'notes.json'), encoding='utf8'))
W, H, L = 480, 270, 30
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 17)
sheet = Image.new('RGB', (W * len(ids) + 8 * (len(ids) + 1), (b - a + 1) * (H + L + 8) + 8), (18, 20, 27)); d = ImageDraw.Draw(sheet)
for r, P in enumerate(range(a, b + 1)):
    y = 8 + r * (H + L + 8); d.text((10, y + 5), 'Pass %d · %s' % (P, notes[str(P)]['name']), fill=(255, 203, 5), font=font)
    idx = json.load(open(os.path.join(root, 'p%d' % P, 'index.json')))
    for c, i in enumerate(ids):
        f = [x['f'] for x in idx if x['f'].split('-', 1)[1] == i + '.png']
        if f: sheet.paste(Image.open(os.path.join(root, 'p%d' % P, f[0])).convert('RGB').resize((W, H), Image.LANCZOS), (8 + c * (W + 8), y + L))
sheet.save(out, quality=86); print(out)
