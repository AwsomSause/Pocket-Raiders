# Builds the Anime Forms battle atlases (core/animeLooks.ts) from the pack sheets already in
# public/assets/images/packs/instrumentality/anime_forms/animated (or Kice's Anime Forms.zip "Animated" folder).
#   python3 tools/anime/make-anime-sprites.py <animated folder> public/assets/images/pokemon
import json, os, sys
from PIL import Image, ImageOps
src, out = sys.argv[1], sys.argv[2]
# file in zip Animated/ -> (game key, target height in px = base art height)
JOBS = {
 'Lesser Squirtle.png': ('anime-lesser-squirtle-squad', 44),
 'Leader Squirtle Squad.png': ('anime-leader-squirtle-squad', 46),
 'Lesser Wartortle (Bounce Loop).png': ('anime-lesser-wartortle', 57),
 'Leader Wartortle.png': ('anime-leader-wartortle', 60),
 'Lesser Blastoise.png': ('anime-lesser-blastoise', 60),
 'Leader Blastoise.png': ('anime-leader-blastoise', 64),
 'Mega Squad Blastoise.png': ('anime-mega-squad-blastoise', 100),
 'Champion Primeape.png': ('anime-champion-primeape', 60),
}
for name, (key, th) in JOBS.items():
    sheet = Image.open(os.path.join(src, name)).convert('RGBA')
    n = sheet.width // 96
    frames = [sheet.crop((c*96, r*96, c*96+96, r*96+96)) for r in range(sheet.height // 96) for c in range(n)]
    frames = [f for f in frames if f.getchannel('A').getbbox()]
    boxes = [f.getchannel('A').getbbox() for f in frames]
    u = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    k = th / (u[3] - u[1])
    w, h = max(1, round((u[2]-u[0])*k)), th
    frames = [f.crop(u).resize((w, h), Image.LANCZOS) for f in frames]
    for folder, flip in (('', False), ('back', True), ('shiny', False), ('back/shiny', True)):
        atlas = Image.new('RGBA', (w * len(frames), h))
        fr = []
        for i, f in enumerate(frames):
            atlas.paste(ImageOps.mirror(f) if flip else f, (i * w, 0))
            fr.append({'filename': f'{i+1:04d}.png', 'rotated': False, 'trimmed': False, 'sourceSize': {'w': w, 'h': h},
                       'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'frame': {'x': i*w, 'y': 0, 'w': w, 'h': h}})
        d = os.path.join(out, folder, 'custom'); os.makedirs(d, exist_ok=True)
        atlas.save(os.path.join(d, key + '.png'), optimize=True)
        json.dump({'textures': [{'image': key + '.png', 'format': 'RGBA8888', 'size': {'w': atlas.width, 'h': h}, 'scale': 1, 'frames': fr}],
                   'meta': {'app': 'Anime Forms zip (Kice, 2026-11-14), 3x3 96px sheet -> atlas'}}, open(os.path.join(d, key + '.json'), 'w'))
    print(key, len(frames), w, h)
