"""Shrinks the UI photographs (sprites/u-*.png) to 256 colours and lists them in sprites.json so the page knows them."""
import glob, json, os
from PIL import Image
D = os.path.join(os.path.dirname(__file__), '..', 'sprites'); J = os.path.join(os.path.dirname(__file__), 'sprites.json'); d = json.load(open(J))
for f in sorted(glob.glob(os.path.join(D, 'u-*.png'))):
    im = Image.open(f)
    if im.mode == 'RGBA' and im.getextrema()[3][0] < 255: im.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(f, optimize=True)
    elif im.mode != 'P': im.convert('RGB').quantize(256, dither=Image.Dither.NONE).save(f, optimize=True)
    d[os.path.basename(f)[:-4]] = [960, 540]
json.dump(d, open(J, 'w'), separators=(',', ':'))
