# Lays chosen screenshots out as one labelled grid. Usage: python3 src/grid.py <out.jpg> <cols> <shots-dir/id> [<shots-dir/id> ...]
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
R = Path(__file__).resolve().parent.parent / 'shots'
out, cols, items = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
W = 1920 // cols; H = W * 9 // 16; LB = 26; rows = -(-len(items) // cols)
sheet = Image.new('RGB', (W * cols, (H + LB) * rows), '#14141a'); d = ImageDraw.Draw(sheet)
try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 17)
except OSError: f = ImageFont.load_default()
for i, it in enumerate(items):
    x, y = (i % cols) * W, (i // cols) * (H + LB)
    d.text((x + 8, y + 3), it.replace('/', ' · '), fill='#ffd84a', font=f)
    sheet.paste(Image.open(R / (it + '.png')).convert('RGB').resize((W - 4, H - 4), Image.LANCZOS), (x + 2, y + LB + 2))
sheet.save(out, quality=86); print(out)
