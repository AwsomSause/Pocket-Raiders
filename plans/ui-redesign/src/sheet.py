#!/usr/bin/env python3
"""Lays the screenshots of one pass on contact sheets. python3 sheet.py <pass> <shots dir> <out dir> [per-sheet=12] [changed]"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
P, src, out = int(sys.argv[1]), sys.argv[2], sys.argv[3]
per = int(sys.argv[4]) if len(sys.argv) > 4 else 12
idx = json.load(open(os.path.join(src, 'index.json')))
if len(sys.argv) > 5: idx = [i for i in idx if i['changed']]
W, H, L, COLS = 640, 360, 26, 3
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except Exception: font = ImageFont.load_default()
os.makedirs(out, exist_ok=True); names = []
for s in range(0, len(idx), per):
    part = idx[s:s + per]; rows = (len(part) + COLS - 1) // COLS
    sheet = Image.new('RGB', (W * COLS + 8 * (COLS + 1), rows * (H + L + 8) + 8), (18, 20, 27)); d = ImageDraw.Draw(sheet)
    for i, it in enumerate(part):
        x = 8 + (i % COLS) * (W + 8); y = 8 + (i // COLS) * (H + L + 8)
        sheet.paste(Image.open(os.path.join(src, it['f'])).convert('RGB').resize((W, H), Image.LANCZOS), (x, y + L))
        d.text((x + 2, y + 4), ('NEW  ' if it['isNew'] else '') + it['title'], fill=(255, 203, 5) if it['isNew'] else (220, 224, 236), font=font)
    n = os.path.join(out, 'pass-%02d%s.jpg' % (P, '' if len(idx) <= per else '-%d' % (s // per + 1)))
    sheet.save(n, quality=86); names.append(n)
print('\n'.join(names))
