#!/usr/bin/env python3
"""Copies the game art the animation mockups use into ../sprites.
Animated Pokémon and trainers are exported as one strip (frames side by side) so the mockups can play the game's own idle frames.
Run from the repo root: python3 plans/animation-redesign/src/assets.py"""
import json, os, shutil, sys
from PIL import Image
A = 'public/assets/images/'; UI = 'plans/ui-redesign/sprites/'; OUT = 'plans/animation-redesign/sprites/'
# animated strips: out name -> (source atlas, keep every Nth frame)
STRIPS = {
 'f-9': 'pokemon/9', 'f-6': 'pokemon/6', 'f-25': 'pokemon/25', 'f-94': 'pokemon/94', 'f-150': 'pokemon/150', 'f-143': 'pokemon/143',
 'f-130': 'pokemon/130', 'f-133': 'pokemon/133', 'f-815': 'pokemon/815', 'f-890': 'pokemon/890', 'f-121': 'pokemon/121',
 'f-6-gigantamax': 'pokemon/6-gigantamax', 'f-6-mega-x': 'pokemon/6-mega-x', 'f-884': 'pokemon/884', 'f-16': 'pokemon/16', 'f-4': 'pokemon/4', 'f-5': 'pokemon/5',
 'fb-6': 'pokemon/back/6', 'fb-25': 'pokemon/back/25', 'fb-448': 'pokemon/back/448', 'fb-6-mega-x': 'pokemon/back/6-mega-x',
 'fb-6-gigantamax': 'pokemon/back/6-gigantamax', 'fb-94': 'pokemon/back/94', 'fb-133': 'pokemon/back/133', 'fb-815': 'pokemon/back/815',
 'ft-red': 'trainer/red', 'ft-blue': 'trainer/blue', 'pt-hilda': 'bosses/back/hilda', 'pt-nate': 'bosses/back/nate', 'pt-red': 'bosses/back/red', 'pt-silver': 'bosses/back/silver',
}
# single pictures copied from the game: out name -> source
ONE = {
 'x-burst': 'packs/dbk/burst', 'x-shine': 'packs/dbk/shine', 'x-particle': 'packs/dbk/particle', 'x-pulse': 'packs/dbk/pulse',
 'x-mega-orb1': 'packs/dbk/mega/orb_1', 'x-mega-orb2': 'packs/dbk/mega/orb_2', 'x-mega-ring': 'packs/dbk/mega/ring', 'x-mega-shine': 'packs/dbk/mega/shine', 'x-mega-icon': 'packs/dbk/mega/icon',
 'x-tera-c1': 'packs/dbk/tera/crystal_1', 'x-tera-c2': 'packs/dbk/tera/crystal_2', 'x-tera-c3': 'packs/dbk/tera/crystal_3', 'x-tera-c4': 'packs/dbk/tera/crystal_4',
 'x-tera-icon': 'packs/dbk/tera/icon', 'x-tera-pulse': 'packs/dbk/tera/pulse', 'x-tera-fire': 'packs/dbk/tera/patterns/fire',
 'x-dmax-icon': 'packs/dbk/dynamax/icon', 'x-dmax-pattern': 'packs/dbk/dynamax/patterns/dynamax', 'x-z-particle': 'packs/dbk/zpower/particle', 'x-z-inferno': 'packs/dbk/zpower/titles/inferno-overdrive',
 'x-st-burn': 'packs/dbk/status/burn', 'x-st-frozen': 'packs/dbk/status/frozen', 'x-st-paralysis': 'packs/dbk/status/paralysis', 'x-st-poison': 'packs/dbk/status/poison',
}
# stills already cut out for the UI redesign (same names)
UIK = ('m-1 m-3 m-4 m-5 m-7 m-9 m-25 m-52 m-94 m-129 m-130 m-133 m-143 m-149 m-150 m-197 m-249 m-384 m-448 m-793 m-888 m-890 m-16 m-19 m-41 m-92 m-66 m-74 m-109 m-121 m-6 m-6-mega-x m-6-gigantamax m-448-mega m-144 m-145 m-146 m-243 m-282 m-376 m-445 m-248 m-131 m-26 m-172 m-59 m-65 m-68 m-95 m-791 m-792 m-800 m-483 m-484 m-487 '
       'mb-6 mb-25 mb-94 mb-130 mb-448 mb-143 mb-133 mb-6-mega-x mb-6-gigantamax mb-448-mega mb-4 mb-149 mb-445 mb-150 mb-384 '
       't-red t-blue t-giovanni t-archer t-grunt t-acef t-acem t-green t-hilda t-nate t-cynthia t-lance t-misty t-brock t-silver t-leon t-steven t-whitney '
       'b-pb b-gb b-dusk b-quick b-master b-luxury b-premier b-ub b-heal b-timer '
       'i-potion i-super_potion i-full_restore i-revive i-rare_candy i-mega_bracelet i-z_ring i-dynamax_band i-tera_orb i-firium_z i-fire_stone i-nugget i-mystery_egg i-lucky_egg i-charizardite_x i-amulet_coin i-map i-exp_charm i-shell_bell i-focus_sash '
       'bd-water bd-rock bd-electric bd-fire bd-grass bd-psychic bd-poison bd-ground').split()
ARENAS = 'grass cave sea volcano forest plains mountain ruins raid_max raid_tera raid_ultra graveyard desert ice_cave power_plant dojo swamp tall_grass abyss factory'.split()
TYPES = 'normal fighting flying poison ground rock bug ghost steel fire water grass electric psychic ice dragon dark fairy'.split()
EXTRA_MON = '812 815 818 823 849 869 884 888-crowned 889-crowned 812-gigantamax 815-gigantamax 818-gigantamax 884-gigantamax 849-gigantamax 823-gigantamax 869-gigantamax 143-gigantamax 25-gigantamax 94-gigantamax 131-gigantamax 890-eternamax 831 835 836 833 834 866 862 865 870 879 892 894 895 896 897 898 20 735 784 754 758 738 743 778 777 752 746 105-alola 20-alola 794 795 796 797 798 799 806 805 804 803 150-mega-y 150-mega-x 94-mega 384-mega 248-mega 9-mega 3-mega 130-mega 445-mega 65-mega 257 257-mega 2 8 26 134 135 136 196 197 470 471 700 151 251 385 490 492 494 647 648 649 719 720 721 801 802 807 808 809 893 12 15 17 18 22 35 36 39 54 58 63 77 79 81 100 104 113 116 120 123 125 126 127 128 132 137 142 152 155 158 175 179 183 196 202 216 225 231 235 241 246 252 255 258 280 300 304 311 312 333 349 355 359 361 363 371 374 387 390 393 403 417 418 425 427 433 441 443 447'.split()
EXTRA_T = {'hop': 'bosses/hop', 'marnie': 'bosses/marnie-masters4', 'bede': 'bosses/bede', 'raihan': 'bosses/raihan', 'nessa': 'bosses/nessa', 'milo': 'bosses/milo', 'kabu': 'bosses/kabu',
           'piers': 'bosses/piers', 'sonia': 'bosses/sonia', 'opal': 'bosses/opal', 'bea': 'bosses/bea', 'allister': 'bosses/allister', 'melony': 'bosses/melony', 'peony': 'bosses/peony'}
def frames(path):
    d = json.load(open(path + '.json')); fr = d['textures'][0]['frames'] if 'textures' in d else d['frames']
    if isinstance(fr, dict): fr = [dict(v, filename=k) for k, v in fr.items()]
    return sorted(fr, key=lambda f: f['filename'])
def cell(im, f):
    r = f['frame']; s = f['spriteSourceSize']; ss = f['sourceSize']
    c = Image.new('RGBA', (ss['w'], ss['h'])); c.paste(im.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h'])), (s['x'], s['y'])); return c
def strip(src, maxf=72):
    im = Image.open(A + src + '.png').convert('RGBA'); fr = frames(A + src)
    step = max(1, -(-len(fr) // maxf)); cells = [cell(im, f) for f in fr[::step]]
    x0 = min(c.getbbox()[0] for c in cells if c.getbbox()); y0 = min(c.getbbox()[1] for c in cells if c.getbbox())
    x1 = max(c.getbbox()[2] for c in cells if c.getbbox()); y1 = max(c.getbbox()[3] for c in cells if c.getbbox())
    w, h = x1 - x0, y1 - y0; out = Image.new('RGBA', (w * len(cells), h))
    for i, c in enumerate(cells): out.paste(c.crop((x0, y0, x1, y1)), (i * w, 0))
    return out, len(cells), round(10 / step, 2)
def first(path):
    im = Image.open(path + '.png').convert('RGBA')
    if os.path.exists(path + '.json'): im = cell(im, frames(path)[0])
    else:
        w, h = im.size
        if w > h * 1.5 and 'packs' not in path: im = im.crop((0, 0, h, h))
    bb = im.getbbox(); return im.crop(bb) if bb else im
def main():
    os.makedirs(OUT, exist_ok=True); miss = []; meta = {}
    for k, src in STRIPS.items():
        if not os.path.exists(A + src + '.json'): miss.append(src); continue
        im, n, fps = strip(src); im.save(OUT + k + '.png', optimize=True); meta[k] = [im.size[0] // n, im.size[1], n, fps]
    for k, src in ONE.items():
        if not os.path.exists(A + src + '.png'): miss.append(src); continue
        im = Image.open(A + src + '.png').convert('RGBA'); im.save(OUT + k + '.png', optimize=True); meta[k] = list(im.size)
    for k in UIK:
        if not os.path.exists(UI + k + '.png'): miss.append('ui ' + k); continue
        shutil.copy(UI + k + '.png', OUT + k + '.png'); meta[k] = list(Image.open(OUT + k + '.png').size)
    for a in ARENAS:
        for s in ('bg', 'a', 'b'):
            k = 'a-%s-%s' % (a, s)
            if os.path.exists(UI + k + '.png'): shutil.copy(UI + k + '.png', OUT + k + '.png'); meta[k] = list(Image.open(OUT + k + '.png').size)
    for t in TYPES:
        k = 'ty-' + t
        if os.path.exists(UI + k + '.png'): shutil.copy(UI + k + '.png', OUT + k + '.png'); meta[k] = [32, 32]
    for m in EXTRA_MON:
        k = 'm-' + m
        if k in meta: continue
        if not os.path.exists(A + 'pokemon/' + m + '.png'): miss.append('mon ' + m); continue
        im = first(A + 'pokemon/' + m); im.save(OUT + k + '.png', optimize=True); meta[k] = list(im.size)
    for k, src in EXTRA_T.items():
        if not os.path.exists(A + src + '.png'): miss.append(src); continue
        im = first(A + src); im.save(OUT + 't-' + k + '.png', optimize=True); meta['t-' + k] = list(im.size)
    json.dump(meta, open(OUT + '../src/sprites.json', 'w'), separators=(',', ':'))
    print(len(meta), 'sprites;', 'missing:', miss)
main()
