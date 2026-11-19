#!/usr/bin/env python3
"""Copies the game art the mockups use into sprites/ (first atlas frame for Pokémon)."""
import json, os, shutil, sys
from PIL import Image
A = os.path.join(os.path.dirname(__file__), '../../../public/assets/images')
OUT = os.path.join(os.path.dirname(__file__), '../sprites')
os.makedirs(OUT, exist_ok=True)
prov = []
def frame0(src_png, src_json, dst):
    if not os.path.exists(src_png): print('MISSING', src_png); return
    im = Image.open(src_png).convert('RGBA')
    fr = sorted(json.load(open(src_json))['textures'][0]['frames'], key=lambda f: f['filename'])[0]
    r = fr['frame']; s = fr['spriteSourceSize']; ss = fr['sourceSize']
    crop = im.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
    canvas = Image.new('RGBA', (ss['w'], ss['h']), (0, 0, 0, 0)); canvas.paste(crop, (s['x'], s['y']))
    bb = canvas.getbbox(); canvas = canvas.crop(bb) if bb else canvas
    canvas.save(dst); prov.append((os.path.basename(dst), os.path.relpath(src_png, A)))
def copy(src, dst, trim=False):
    p = os.path.join(A, src)
    if not os.path.exists(p): print('MISSING', src); return
    im = Image.open(p).convert('RGBA')
    if trim:
        bb = im.getbbox(); im = im.crop(bb) if bb else im
    im.save(os.path.join(OUT, dst)); prov.append((dst, src))
MON = {1:'bulbasaur',4:'charmander',7:'squirtle',6:'charizard',25:'pikachu',94:'gengar',448:'lucario',130:'gyarados',143:'snorlax',445:'garchomp',150:'mewtwo',384:'rayquaza',53:'persian',133:'eevee',9:'blastoise',3:'venusaur',149:'dragonite',248:'tyranitar',282:'gardevoir',197:'umbreon',658:'greninja',52:'meowth',41:'zubat',19:'rattata',16:'pidgey',249:'lugia',483:'dialga',59:'arcanine',131:'lapras',65:'alakazam',373:'salamence',376:'metagross',350:'milotic',442:'spiritomb',407:'roserade',109:'koffing',23:'ekans',5:'charmeleon'}
for n, name in MON.items():
    frame0(f'{A}/pokemon/{n}.png', f'{A}/pokemon/{n}.json', f'{OUT}/p-{name}.png')
for n in (6, 25, 448, 94, 130, 143, 4):
    frame0(f'{A}/pokemon/back/{n}.png', f'{A}/pokemon/back/{n}.json', f'{OUT}/b-{MON[n]}.png')
TR = {'red':'red','blue':'blue','green':'green','hilda':'hilda','nate':'nate','cynthia':'cynthia-masters','giovanni':'giovanni-rocketboss','lance':'lance','n':'n','silver':'silver','leon':'leon-masters','steven':'steven-gen6','misty':'misty','brock':'brock','oak':'oak','rocket':'teamrocket','gruntm':'npc_teamrocket_m','gruntf':'npc_teamrocket_f','jessie':'cast-jessie','james':'cast-james','marnie':'marnie-masters4','iris':'iris-gen5bw2','geeta':'geeta','cyrus':'cyrus','ghetsis':'ghetsis','lusamine':'lusamine-masters','leaf':'leaf-gen3','ethan':'ethan','dawn':'dawn','wally':'wally','hop':'hop','nemona':'nemona-v','kukui':'kukui','diantha':'diantha'}
for k, v in TR.items(): copy(f'bosses/{v}.png', f't-{k}.png', trim=True)
for a in ('grass','cave','volcano','sea','forest','ruins','mountain','graveyard','raid_max','raid_tera','power_plant','plains','ice_cave'):
    for s in ('bg','a','b'): copy(f'arenas/{a}_{s}.png', f'a-{a}-{s}.png')
for e in os.listdir(f'{A}/packs/memories/eventbg'): copy(f'packs/memories/eventbg/{e}', f'e-{e}')
for t in os.listdir(f'{A}/packs/story/badge'): copy(f'packs/story/badge/{t}', f'ty-{t}')
for b in os.listdir(f'{A}/pokeball'):
    if b.endswith('.png'): copy(f'pokeball/{b}', f'ball-{b}')
for i in ('potion','super_potion','hyper_potion','max_potion','full_restore','revive','max_revive','rare_candy','amulet_coin','leftovers','choice_band','life_orb','focus_sash','charizardite_x','charizardite_y','lucarionite','gengarite','master_ball','ultra_ball','poke_ball','great_ball','fire_stone','thunder_stone','exp_share','lucky_egg','nugget','big_nugget','full_heal','ether','elixir','sitrus_berry','oran_berry','town_map','bicycle','mega_bracelet','z_ring','dynamax_band','tera_orb','black_belt','charcoal','mystic_water','soothe_bell','scope_lens','quick_claw','kings_rock','star_piece','comet_shard','shiny_charm','oval_charm'):
    copy(f'items/{i}.png', f'i-{i}.png')
copy('packs/dbk/mega/icon.png','g-mega.png'); copy('packs/dbk/dynamax/icon.png','g-dmax.png'); copy('packs/dbk/tera/icon.png','g-tera.png')
copy('packs/dbk/mega/ring.png','g-megaring.png'); copy('packs/dbk/tera/crystal_1.png','g-crystal.png'); copy('packs/dbk/zpower/particle.png','g-z.png')
copy('packs/memories/townmap/region0.png','map-region0.png'); copy('packs/memories/townmap/region1.png','map-region1.png')
for c in ('brock','leaf-gen3','ethan','dawn'): copy(f'packs/memories/vs/cards/{c}.png', f'vs-{c}.png')
for c in ('dragon_tamer','hiker','youngster_m','psychic_m','hex_maniac','black_belt_m','biker','fisherman','bug_catcher'):
    frame0(f'{A}/trainer/{c}.png', f'{A}/trainer/{c}.json', f'{OUT}/c-{c}.png')
for k, v in {'mart':'NPC_113_Mart_M','nurse':'NPC_B2W2_Nurse'}.items():
    sh = Image.open(f'{A}/overworld/trainers/{v}.png').convert('RGBA'); fr = sh.crop((0, 0, sh.width // 4, sh.height // 4)); fr = fr.crop(fr.getbbox())
    fr.save(f'{OUT}/o-{k}.png'); prov.append((f'o-{k}.png', f'overworld/trainers/{v}.png'))
for i in ('exp_candy_l','exp_charm','black_glasses','shell_bell'): copy(f'items/{i}.png', f'i-{i}.png')
with open(os.path.join(OUT, 'PROVENANCE.csv'), 'w') as f:
    f.write('sprite,source (under public/assets/images)\n'); f.writelines(f'{a},{b}\n' for a, b in sorted(prov))
print(len(prov), 'files')
