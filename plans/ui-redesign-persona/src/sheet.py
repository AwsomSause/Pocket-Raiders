#!/usr/bin/env python3
"""Contact sheets for one pass: python3 src/sheet.py <shots-dir-name> [cols]. Writes shots/<name>-sheetN.jpg."""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); name = sys.argv[1]; cols = int(sys.argv[2]) if len(sys.argv) > 2 else 3
d = os.path.join(R, 'shots', name); ids = json.load(open(os.path.join(d, 'ids.json')))
only = sys.argv[3].split(',') if len(sys.argv) > 3 else None
if only: ids = [i for i in ids if i in only]
tw = 1536 // cols; th = tw * 9 // 16; per = cols * 4
f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15) if os.path.exists('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf') else ImageFont.load_default()
for s in range(0, len(ids), per):
    part = ids[s:s + per]; rows = -(-len(part) // cols); sh = Image.new('RGB', (cols * tw, rows * (th + 22)), (20, 20, 24)); dr = ImageDraw.Draw(sh)
    for i, sid in enumerate(part):
        im = Image.open(os.path.join(d, sid + '.png')).convert('RGB').resize((tw - 4, th - 2), Image.LANCZOS); x = (i % cols) * tw + 2; y = (i // cols) * (th + 22)
        sh.paste(im, (x, y + 20)); dr.text((x + 4, y + 2), f'{name} · {sid}', fill=(255, 220, 90), font=f)
    p = os.path.join(R, 'shots', f'{name}-sheet{s // per + 1}.jpg'); sh.save(p, quality=86); print(p)
