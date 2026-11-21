"""Reads Kice's armband sheets (public/assets/images/dominion/armbands/A..Z.png, 8x8 cells of 32 px) and writes the
representative colour of each row-0 cell to src/data/dominion/armbandSheets.json. The colourway order differs per letter,
so the game picks the cell nearest the team's primary colour from this file. Run: python3 tools/dominion/armbands/sheets.py"""
import json
import numpy as np
from PIL import Image

out = {}
for L in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
    im = np.array(Image.open(f'public/assets/images/dominion/armbands/{L}.png').convert('RGBA'))
    row = []
    for c in range(8):
        cell = im[0:32, c * 32:(c + 1) * 32].reshape(-1, 4)
        cell = cell[cell[:, 3] > 0][:, :3].astype(int)
        lum = cell.sum(1)
        m = cell[(lum > 120) & (lum < 640)]
        if len(m) == 0:
            m = cell
        sat = m.max(1) - m.min(1)
        k = m[np.argsort(-sat)[len(m) // 4]]
        row.append('#%02x%02x%02x' % tuple(k))
    out[L] = row
json.dump({'_source': 'tools/dominion/armbands/sheets.py: the colour of each row-0 cell of the 26 armband sheets', 'row0': out}, open('src/data/dominion/armbandSheets.json', 'w'), indent=1)
