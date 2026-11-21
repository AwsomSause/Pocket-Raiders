"""Quick look: python3 chk.py <shots/pN dir> <out.jpg> <ids,comma> [cols] [width]"""
import sys, os, re
from PIL import Image
d, out, ids = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 2; w = int(sys.argv[5]) if len(sys.argv) > 5 else 720; h = w * 9 // 16
fs = os.listdir(d); rows = (len(ids) + cols - 1) // cols
im = Image.new('RGB', (cols * (w + 10) + 10, rows * (h + 10) + 10), '#111')
for n, i in enumerate(ids):
    g = [x for x in fs if re.fullmatch(r'\d+-' + re.escape(i) + r'\.png', x)]
    if g: im.paste(Image.open(os.path.join(d, g[0])).convert('RGB').resize((w, h), Image.LANCZOS), (10 + (n % cols) * (w + 10), 10 + (n // cols) * (h + 10)))
im.save(out, quality=88)
