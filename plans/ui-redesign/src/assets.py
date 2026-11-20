#!/usr/bin/env python3
"""Copies the game sprites the mockups use into ../sprites (first frame of each atlas).
Run from the repo root: python3 plans/ui-redesign/src/assets.py"""
import json, os, sys
from PIL import Image
A = 'public/assets/images/'
OUT = 'plans/ui-redesign/sprites/'
MONS = '1 3 4 6 9 25 52 53 94 130 133 143 149 150 155 163 197 241 248 249 250 258 373 384 390 445 448 656 793 6-mega-x 6-gigantamax 448-mega 94-mega 150-mega-y 384-mega 445-mega 5 7 152 252 255 387 393 495 498 501 650 653 722 725 728 810 813 816 906 909 912 144 145 146 243 244 245 380 381 382 383 483 484 487 643 644 716 717 791 792 800 888 889 890 1007 1008 19 16 41 129 147 246 443 447 172 26 131 59 65 68 76 112 121 208 212 214 229 257 282 302 303 306 308 310 319 323 334 354 359 362 376 428 460 475 531 719 92 93 95 66 74 109 110 24 23 20 42 169 88 89 228 198 215 461 430'.split()
BACKS = '6 25 94 130 448 149 143 6-mega-x 6-gigantamax 448-mega 94-mega 4 155 258 133 445 150 384'.split()
TRAINERS = {  # out name: source
 'red':'trainer/red', 'blue':'trainer/blue', 'giovanni':'trainer/giovanni', 'archer':'trainer/pr/archer',
 'grunt':'trainer/pr/rocket_grunt_m', 'acef':'trainer/pr/ace_trainer_f', 'acem':'trainer/pr/ace_trainer_m',
 'green':'bosses/green', 'hilda':'bosses/hilda', 'nate':'bosses/nate', 'cynthia':'bosses/cynthia-masters',
 'lance':'bosses/lance', 'whitney':'bosses/whitney', 'misty':'bosses/misty', 'brock':'bosses/brock',
 'silver':'bosses/silver', 'steven':'bosses/steven-gen6', 'leon':'bosses/leon-masters', 'redm':'bosses/red-masters',
}
ARENAS = 'grass cave sea volcano forest plains mountain ruins raid_max raid_tera raid_ultra graveyard desert ice_cave power_plant dojo swamp tall_grass abyss factory'.split()
ITEMS = 'potion super_potion hyper_potion full_restore full_heal revive rare_candy ether lucky_egg amulet_coin focus_sash shell_bell muscle_band wise_glasses kings_rock quick_claw mega_bracelet z_ring dynamax_band tera_orb firium_z electrium_z fire_tera_shard fire_stone thunder_stone moon_stone nugget big_nugget map exp_charm shiny_charm mystery_egg metal_coat soothe_bell black_glasses candy calendar charizardite_x lucarionite gengarite red_orb blue_orb master_ribbon scanner coin_case'.split()
BALLS = 'pb gb dusk quick master luxury premier dive heal net timer ub love moon'.split()
def first_frame(path):
    im = Image.open(path + '.png').convert('RGBA')
    j = path + '.json'
    if os.path.exists(j):
        d = json.load(open(j))
        fr = d['textures'][0]['frames'] if 'textures' in d else d['frames']
        if isinstance(fr, dict): fr = [dict(v, filename=k) for k, v in fr.items()]
        fr = sorted(fr, key=lambda f: f['filename'])[0]
        r = fr['frame']; im = im.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
    else:
        w, h = im.size
        if w > h * 1.5: im = im.crop((0, 0, h, h))  # strip sheet: first cell
    bb = im.getbbox()
    return im.crop(bb) if bb else im
def save(im, name):
    im.save(OUT + name + '.png', optimize=True)
def main():
    os.makedirs(OUT, exist_ok=True); miss = []
    for m in MONS:
        p = A + 'pokemon/' + m
        if not os.path.exists(p + '.png'): miss.append(m); continue
        save(first_frame(p), 'm-' + m)
    for m in BACKS:
        p = A + 'pokemon/back/' + m
        if not os.path.exists(p + '.png'): miss.append('back ' + m); continue
        save(first_frame(p), 'mb-' + m)
    for k, v in TRAINERS.items():
        if not os.path.exists(A + v + '.png'): miss.append(v); continue
        save(first_frame(A + v), 't-' + k)
    for a in ARENAS:
        for s in ('bg', 'a', 'b'):
            f = A + 'arenas/%s_%s.png' % (a, s)
            if os.path.exists(f):
                im = Image.open(f).convert('RGBA')
                if s != 'bg': im = im.crop(im.getbbox())
                im.save(OUT + 'a-%s-%s.png' % (a, s), optimize=True)
            else: miss.append(f)
    for i in ITEMS:
        f = A + 'items/%s.png' % i
        if os.path.exists(f): Image.open(f).save(OUT + 'i-%s.png' % i, optimize=True)
        else: miss.append(f)
    for b in BALLS:
        f = A + 'pokeball/%s.png' % b
        if os.path.exists(f): save(first_frame(f[:-4]), 'b-' + b)
        else: miss.append(f)
    types = 'normal fighting flying poison ground rock bug ghost steel fire water grass electric psychic ice dragon dark fairy'.split()
    sheet = Image.open(A + 'packs/dbk/tera/types.png').convert('RGBA')
    for n, t in enumerate(types): sheet.crop((0, n * 32, 32, n * 32 + 32)).save(OUT + 'ty-%s.png' % t)
    for t in types:
        f = A + 'packs/story/badge/%s.png' % t
        if os.path.exists(f): Image.open(f).save(OUT + 'bd-%s.png' % t, optimize=True)
    for extra in sys.argv[1:]:  # src=out pairs, copied whole
        s, o = extra.split('=')
        Image.open(A + s).save(OUT + o + '.png', optimize=True)
    print('missing:', miss)
main()
