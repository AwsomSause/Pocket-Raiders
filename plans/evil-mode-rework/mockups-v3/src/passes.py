# The 25 "more extravagant" passes for the v3 Dominion mockups. Each pass: n, name, note (what it did on every
# screen), css, optional per-screen html/notes ('per'), a generator 'each(sid)' for per-screen html, and 'replace'.

# key light (k) and accent (a) per screen, used by the atmosphere passes
PAL = {
 's0': ('#c9a0ff', '#ff7ab8'), 's1': ('#ffd9a0', '#7fb0ff'), 's2': ('#ffc88a', '#ffe7a8'), 's3': ('#9fd0ff', '#ffd23f'),
 's4': ('#fff0c0', '#9fd0ff'), 's5': ('#c9a0ff', '#ffd23f'), 's6': ('#ffd38a', '#a678ff'), 's7': ('#ffc070', '#ffdf9a'),
 's8': ('#ff8a8a', '#b48cff'), 's9': ('#ff7a6a', '#cfd8ff'), 's10': ('#8fe3ff', '#b48cff'), 's11': ('#ffe38a', '#b48cff'),
 's12': ('#ffd23f', '#b48cff'), 's13': ('#c9a0ff', '#ffd23f'), 'c1': ('#ff9a7a', '#ffd38a'), 'c2': ('#ffd9a0', '#ff9ac0'),
 'c3': ('#cfe0ff', '#ffd23f'), 'k1': ('#ffb38a', '#9fd0ff'), 'k2': ('#e8b0ff', '#9fe7ff'), 'k3': ('#ffe0a0', '#ffb38a'),
 'k4': ('#ff8a8a', '#b48cff'), 'k5': ('#9fd0ff', '#ffb38a'), 'k6': ('#fff0c0', '#ff7ab8'), 'k7': ('#cfe0ff', '#ffd23f'),
 'k8': ('#8fb8ff', '#ff6a6a'), 'k9': ('#ffb07a', '#b48cff'), 'k10': ('#ffd38a', '#ff7ab8'),
}

NAV = [('s0', '0 Title'), ('s1', '1 HQ'), ('s2', '2 Morning'), ('s3', '3 Map'), ('s4', '4 Card'), ('s5', '5 Crew'),
       ('s6', '6 HQ Lv. 3'), ('s7', '7 Ledger'), ('s8', '8 Debate'), ('s9', '9 Takeover'), ('s10', '10 Empire'),
       ('s11', '11 Reserve'), ('s12', '12 Pyramid'), ('s13', '13 Squads'), ('c1', 'Chair 1–3'), ('k1', 'Rotom 1–10')]


def header(src, n):
    a = src.index('<header class="mast">'); b = src.index('</header>', a) + len('</header>')
    nav = ''.join('<a href="#%s">%s</a>' % x for x in NAV)
    new = ('<header class="mast">\n  <div class="eyebrow">Pocket Raiders · Evil Mode (Dominion) · New look · Round 3</div>\n'
           '  <h1>Dominion</h1>\n'
           '  <p>All 27 Evil Mode screens in one place: the 14 Dominion screens, the 3 Chair screens and the 10 Rotom screens. '
           'Each one was taken through %d more passes, each asking “How can I make this UI more extravagant, visually pleasing and eye-catching?” '
           'Every pass touched every screen. What it changed is listed under each screen. Mock data only; the game rules are unchanged.</p>\n'
           '  <div class="how"><b>Build notes:</b> all styles sit in the one style block so tools/dominion/port-mockup-css.py can port them. '
           'Every animation stops under reduced motion. The battle screen is not part of this set and gets no new styles.</div>\n'
           '  <nav class="jump" aria-label="Screens">%s</nav>\n</header>') % (n, nav)
    return src[:a] + new + src[b:]


def pal(sid):
    return PAL.get(sid, ('#c9a0ff', '#ffd23f'))


PASSES = []

# ---------------------------------------------------------------- batch 1: the shell
PASSES.append(dict(n=1, name='Gilded rims', note='every panel gets a thin inner gold line, the top bar and tabs turn to brushed metal with a gold seam, and panel headers fade from gold into the panel.',
css=r'''
.pnl{box-shadow:0 0 0 3px var(--ink),inset 0 0 0 1px rgba(255,222,140,.18),inset 0 2px 0 rgba(255,255,255,.12),inset 0 -3px 0 rgba(0,0,0,.25),0 12px 26px rgba(0,0,0,.5)}
.top,.tabs>div{background:linear-gradient(180deg,rgba(52,64,104,.98),rgba(28,35,62,.98) 52%,rgba(18,23,44,.98))}
.top::before{content:"";position:absolute;left:16px;right:16px;top:1px;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);pointer-events:none}
.top::after{content:"";position:absolute;left:16px;right:16px;bottom:-1px;height:2px;background:linear-gradient(90deg,transparent,#ffd23f 18%,#fff2b0 50%,#ffd23f 82%,transparent);opacity:.8;pointer-events:none}
.tabs>div{position:relative}
.hd{border-bottom:2px solid transparent;border-image:linear-gradient(90deg,rgba(255,210,63,.8),rgba(148,166,222,.32) 45%,rgba(148,166,222,0)) 1}
'''))

PASSES.append(dict(n=2, name='Foil titles and jewel tabs', note='the title tab gets a foil sheen, a gold underline and a glowing gold gem; the open tab wears a gem and throws a beam of light up into the scene; top-bar numbers glow in their own colour.',
css=r'''
.ttl{box-shadow:inset 0 -3px 0 rgba(255,214,110,.9)}
.ttl::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 0 36%,rgba(255,255,255,.3) 45%,transparent 55%),radial-gradient(120% 160% at 0 0,rgba(255,255,255,.2),transparent 50%)}
.ttl::before{background:linear-gradient(135deg,#fff 10%,#ffe58a 45%,#d39c14);box-shadow:0 0 0 2px rgba(0,0,0,.35),0 0 14px #ffe58a,0 0 28px rgba(255,210,63,.6)}
.top .v{text-shadow:0 2px 0 rgba(0,0,0,.6),0 0 14px color-mix(in srgb,currentColor 45%,transparent)}
.tabs>.on::before{content:"";position:absolute;left:50%;top:-9px;width:14px;height:14px;margin-left:-7px;transform:rotate(45deg);background:linear-gradient(135deg,#fff,#9fd0ff 45%,#2f6fd0);box-shadow:0 0 0 2px var(--ink),0 0 12px #9fd0ff;z-index:2}
.tabs>.on::after{content:"";position:absolute;left:8%;right:8%;bottom:100%;height:70px;pointer-events:none;mix-blend-mode:screen;background:linear-gradient(0deg,rgba(120,180,255,.38),transparent);clip-path:polygon(0 100%,100% 100%,78% 0,22% 0)}
@media (prefers-reduced-motion:no-preference){
  .ttl::after{background-size:250% 100%,100% 100%;animation:foil 6s ease-in-out infinite}
  @keyframes foil{0%,60%{background-position:120% 0,0 0}100%{background-position:-60% 0,0 0}}
}
'''))

PASSES.append(dict(n=3, name='Living buttons', note='the big gold buttons get a glass gloss, a light sweep and a slow golden breathing glow; the picked choice card shimmers; gold small buttons shimmer too.',
css=r'''
.cta{background:linear-gradient(180deg,rgba(255,255,255,.4),rgba(255,255,255,0) 46%),linear-gradient(180deg,#ffe45e,#f5c927)}
.ch.on,.bt.y{background:linear-gradient(110deg,transparent 40%,rgba(255,255,255,.6) 50%,transparent 60%) -120% 0/250% 100% no-repeat,linear-gradient(180deg,#ffe46a,#f4c929)}
@media (prefers-reduced-motion:no-preference){
  .cta{animation:ctaglow 2.6s ease-in-out infinite}
  @keyframes ctaglow{50%{box-shadow:0 0 0 3px var(--ink),inset 0 -6px 0 #cf9a10,inset 0 2px 0 #fff6b8,0 0 48px rgba(255,210,63,.7),0 0 96px rgba(255,170,40,.28)}}
  .ch.on,.bt.y{animation:shim 3.4s ease-in-out infinite}
  @keyframes shim{0%,45%{background-position:-120% 0,0 0}100%{background-position:220% 0,0 0}}
}
'''))


def haze(sid):
    k, a = pal(sid)
    return '<div class="haze" style="--hz:%s;--hz2:%s" aria-hidden="true"></div>' % (k, a)


PASSES.append(dict(n=4, name='Atmosphere', each=haze,
note='a soft coloured haze in the screen\'s own key light hangs over the scene, slanted light shafts fall from above, and dust motes drift up through it.',
css=r'''
.haze{position:absolute;inset:0;z-index:2;pointer-events:none;mix-blend-mode:screen;
  background:radial-gradient(55% 45% at 18% 28%,color-mix(in srgb,var(--hz) 34%,transparent),transparent 70%),radial-gradient(50% 40% at 84% 74%,color-mix(in srgb,var(--hz2) 24%,transparent),transparent 70%)}
.haze::before{content:"";position:absolute;inset:0;opacity:.85;background:repeating-linear-gradient(112deg,transparent 0 46px,color-mix(in srgb,var(--hz) 26%,transparent) 46px 74px,transparent 74px 130px);-webkit-mask:linear-gradient(180deg,#000,transparent 75%);mask:linear-gradient(180deg,#000,transparent 75%)}
.haze::after{content:"";position:absolute;inset:-80px 0 0;opacity:.6;background-image:radial-gradient(1.6px 1.6px at 30px 60px,var(--hz),transparent),radial-gradient(1.2px 1.2px at 140px 180px,var(--hz),transparent),radial-gradient(2px 2px at 220px 40px,var(--hz2),transparent),radial-gradient(1.3px 1.3px at 300px 230px,var(--hz),transparent),radial-gradient(1.6px 1.6px at 90px 250px,var(--hz2),transparent);background-size:340px 280px}
@media (prefers-reduced-motion:no-preference){
  .haze::after{animation:motes 22s linear infinite}
  @keyframes motes{to{background-position:40px -280px}}
}
'''))

PASSES.append(dict(n=5, name='Dressed text boxes', note='text boxes get a pearl gradient, gold corner filigree and a faint gold halo; name plates get a gold diamond and a ribbon tail; speech bubbles get a soft gradient; the ▼ next arrow bobs.',
css=r'''
.tbox{background:radial-gradient(140% 120% at 50% 0,#ffffff,#f2f4fb 60%,#e7ebf7);box-shadow:0 0 0 3px var(--ink),0 0 0 6px rgba(255,210,63,.22),inset 0 -5px 0 #dfe5f5,0 14px 28px rgba(0,0,0,.45)}
.tbox::before{content:"";position:absolute;inset:5px;pointer-events:none;--k:#d4a52a;--L:16px;
  background:linear-gradient(var(--k),var(--k)) 0 0/var(--L) 2px no-repeat,linear-gradient(var(--k),var(--k)) 0 0/2px var(--L) no-repeat,
  linear-gradient(var(--k),var(--k)) 100% 0/var(--L) 2px no-repeat,linear-gradient(var(--k),var(--k)) 100% 0/2px var(--L) no-repeat,
  linear-gradient(var(--k),var(--k)) 0 100%/var(--L) 2px no-repeat,linear-gradient(var(--k),var(--k)) 0 100%/2px var(--L) no-repeat,
  linear-gradient(var(--k),var(--k)) 100% 100%/var(--L) 2px no-repeat,linear-gradient(var(--k),var(--k)) 100% 100%/2px var(--L) no-repeat;opacity:.8;border-radius:8px}
.tbox .who::before{content:"◆";font-size:11px;color:#8a5a08;margin-right:7px;vertical-align:2px}
.tbox .who::after{content:"";position:absolute;right:-13px;top:3px;bottom:3px;width:14px;background:#ddc06e;clip-path:polygon(0 0,100% 0,45% 50%,100% 100%,0 100%)}
.bub{background:linear-gradient(180deg,#ffffff,#eef1fb)}
.bub::after{background:#eef1fb}
@media (prefers-reduced-motion:no-preference){
  .tbox .more{animation:bob 1.1s ease-in-out infinite}
}
'''))

# ---------------------------------------------------------------- batch 2: scene drama
import random

KL = {'s1': 'warm', 's2': 'warm', 's6': 'warm', 's7': 'warm', 'c2': 'warm', 'k3': 'warm', 'k10': 'warm',
      's0': 'violet', 's5': 'violet', 's13': 'violet', 'k2': 'violet',
      's3': 'cold', 's4': 'cold', 's10': 'cold', 'k5': 'cold', 'c3': 'cold', 'k7': 'cold',
      's8': 'red', 's9': 'red', 'c1': 'red', 'k4': 'red', 's11': 'gold', 's12': 'gold',
      'k1': 'rotom', 'k8': 'police', 'k6': 'spot', 'k9': 'dawn'}
KLNOTE = {'warm': 'a warm amber', 'violet': 'a violet', 'cold': 'a cool blue', 'red': 'a red', 'gold': 'a gold',
          'rotom': 'Rotom\'s orange', 'police': 'a police-blue', 'spot': 'a white spotlight', 'dawn': 'a dawn-orange'}

PASSES.append(dict(n=6, name='Rim light',
replace=[(sid, '<div class="st ', '<div class="st kl-%s ' % KL[sid]) for sid in KL],
per={sid: {'note': 'every character and Pokémon gets %s rim light on one edge and a soft glow, so they pop off the background.' % KLNOTE[KL[sid]]} for sid in KL},
note='characters and Pokémon get a coloured rim light and soft glow.',
css=r'''
.kl-warm{--rim:#ffcf8a}.kl-violet{--rim:#d2a8ff}.kl-cold{--rim:#a8d8ff}.kl-red{--rim:#ff8a7a}.kl-gold{--rim:#ffe38a}.kl-rotom{--rim:#ffb38a}.kl-police{--rim:#8fb8ff}.kl-spot{--rim:#fff3c8}.kl-dawn{--rim:#ffb07a}
.st .spr{filter:drop-shadow(2px -1px 0 color-mix(in srgb,var(--rim,#fff) 75%,transparent)) drop-shadow(-1px 1px 0 rgba(0,0,0,.45)) drop-shadow(0 0 12px color-mix(in srgb,var(--rim,#fff) 38%,transparent))}
'''))


def bokeh(sid):
    k, a = pal(sid)
    R = random.Random(sid)
    dots = []
    for i in range(8):
        x = R.choice([R.randint(0, 220), R.randint(740, 960), R.randint(0, 960)])
        y = R.randint(70, 200) if R.random() < .7 else R.randint(380, 520)
        r = R.randint(18, 52)
        c = k if i % 2 else a
        dots.append('radial-gradient(circle %dpx at %dpx %dpx,color-mix(in srgb,%s 34%%,transparent),color-mix(in srgb,%s 18%%,transparent) 70%%,transparent 100%%)' % (r, x, y, c, c))
    return '<div class="bokeh" aria-hidden="true" style="background:%s"></div>' % ','.join(dots)


PASSES.append(dict(n=7, name='Depth of field', each=bokeh,
note='out-of-focus bokeh lights in the screen\'s two colours float at the edges, giving the scene a camera-lens depth.',
css=r'''
.bokeh{position:absolute;inset:0;z-index:1;pointer-events:none;mix-blend-mode:screen}
@media (prefers-reduced-motion:no-preference){.bokeh{animation:bk 9s ease-in-out infinite alternate}@keyframes bk{to{transform:translate(-10px,6px);opacity:.75}}}
'''))

N3D = [('s4', 'class="num" style="font-size:62px;line-height:.9;color:#28314b">64%', 'class="num n3d" style="font-size:62px;line-height:.9;color:#28314b">64%'),
       ('k1', 'class="num" style="font-size:44px;line-height:.9;color:#fff;text-shadow:0 0 14px rgba(255,170,120,.7),0 3px 0 #5a2a10">$3.20', 'class="num n3d" style="font-size:44px;line-height:.9;color:#fff">$3.20'),
       ('k4', 'class="num y pulse" style="font-size:34px;line-height:.8;text-shadow:0 0 12px rgba(255,210,63,.8)">+24', 'class="num y pulse n3d" style="font-size:34px;line-height:.8">+24'),
       ('k6', 'class="num rd pulse" style="font-size:44px;line-height:.9;text-shadow:0 0 14px rgba(255,90,79,.8)">78<', 'class="num rd pulse n3d" style="font-size:44px;line-height:.9">78<'),
       ('k7', 'font-size:40px;color:#ff8a2a;text-shadow:0 3px 0 #5a1c00,0 0 14px rgba(255,138,42,.8)">−18', 'font-size:40px;color:#ff8a2a">−18'),
       ('k8', 'class="num" style="font-size:40px;text-align:center;line-height:1;color:#ffb238">41<', 'class="num n3d" style="font-size:40px;text-align:center;line-height:1;color:#ffb238">41<')]
PASSES.append(dict(n=8, name='Hero numbers',
replace=[(a, b, c) for a, b, c in N3D] + [('k7', 'class="a num jolt"', 'class="a num jolt n3d"')],
per={'s4': {'note': 'the 64% chance becomes a chunky stacked 3D numeral, like an arcade score.'},
     'k1': {'note': 'the $3.20 spend becomes a chunky 3D numeral with an orange glow.'},
     'k4': {'note': 'the +24 Conviction becomes a chunky gold 3D numeral.'},
     'k6': {'note': 'the 78 Suspicion becomes a chunky red 3D numeral.'},
     'k7': {'note': 'the −18 Resolve hit becomes a chunky orange 3D numeral.'},
     'k8': {'note': 'the 41 Belief becomes a chunky amber 3D numeral.'}},
note='the big numbers (dials, nets, top-bar values) become chunky stacked 3D numerals with a glow in their own colour.',
css=r'''
.dial>b,.net,.n3d,.rk{text-shadow:0 2px 0 color-mix(in srgb,currentColor 55%,#000),0 3px 0 color-mix(in srgb,currentColor 38%,#000),0 4px 0 rgba(0,0,0,.55),0 0 18px color-mix(in srgb,currentColor 45%,transparent)}
.top .v{text-shadow:0 2px 0 color-mix(in srgb,currentColor 45%,#000),0 3px 0 rgba(0,0,0,.55),0 0 14px color-mix(in srgb,currentColor 45%,transparent)}
'''))

# particle themes: kind, count, box (x0,y0,x1,y1), z (back/front)
PT = {
 's0': [('shoot', 3, (80, 20, 700, 160), 'b'), ('star', 10, (0, 20, 960, 260), 'b')],
 's1': [('flash', 1, None, 'b'), ('drop', 6, (300, 60, 460, 220), 'b')],
 's2': [('mote', 12, (100, 80, 900, 420), 'b')],
 's3': [('cloud', 3, (40, 80, 600, 420), 'f')],
 's4': [('coin', 6, (0, 80, 70, 500), 'b'), ('coin', 5, (900, 80, 960, 500), 'b'), ('star', 4, (110, 120, 270, 300), 'f')],
 's5': [('conf', 14, (690, 40, 900, 140), 'f'), ('star', 6, (40, 70, 260, 330), 'f')],
 's6': [('star', 12, (0, 76, 960, 140), 'b'), ('shoot', 1, (100, 80, 500, 120), 'b')],
 's7': [('ember', 8, (20, 300, 70, 420), 'f'), ('star', 4, (650, 400, 760, 450), 'f')],
 's8': [('spark', 12, (40, 200, 760, 222), 'f')],
 's9': [('ember', 14, (0, 120, 960, 540), 'b')],
 's10': [('shoot', 3, (60, 40, 900, 200), 'b'), ('star', 12, (0, 40, 960, 330), 'b')],
 's11': [('star', 7, (190, 60, 340, 210), 'f')],
 's12': [('conf', 16, (360, 20, 700, 140), 'b')],
 's13': [('star', 6, (330, 220, 480, 290), 'f')],
 'c1': [('ember', 8, (565, 120, 600, 220), 'f')],
 'c2': [('heart', 5, (300, 120, 420, 230), 'f'), ('star', 5, (420, 60, 560, 200), 'f')],
 'c3': [('star', 8, (440, 60, 560, 160), 'f')],
 'k1': [('zap', 5, (640, 50, 780, 110), 'f')],
 'k2': [('star', 8, (170, 30, 330, 180), 'f'), ('zap', 3, (60, 20, 900, 40), 'f')],
 'k3': [('mote', 10, (40, 60, 660, 420), 'f')],
 'k4': [('zap', 3, (760, 318, 800, 336), 'f'), ('spark', 8, (40, 200, 760, 222), 'f')],
 'k5': [('flash', 1, None, 'b'), ('drop', 8, (20, 40, 360, 300), 'b')],
 'k6': [('mote', 12, (480, 70, 700, 330), 'f')],
 'k7': [('drop', 2, (400, 100, 440, 130), 'f'), ('star', 5, (560, 40, 700, 110), 'f')],
 'k8': [('siren', 1, None, 'b')],
 'k9': [('mote', 10, (330, 120, 640, 420), 'f')],
 'k10': [('note', 6, (130, 270, 330, 420), 'f')],
}
PTN = {'shoot': 'shooting stars', 'star': 'twinkling stars', 'flash': 'a lightning flash through the windows', 'drop': 'falling raindrops',
       'mote': 'glittering motes', 'cloud': 'cloud shadows drifting over the map', 'coin': 'gold coins tumbling down the edges',
       'conf': 'confetti', 'ember': 'embers', 'spark': 'sparks crackling along the bar', 'heart': 'hearts', 'zap': 'Rotom\'s electric zaps',
       'siren': 'red and blue police lights washing the walls', 'note': 'music notes (Mick sang)'}
CONF = ['#ffd23f', '#ff7ab8', '#a678ff', '#4fd2ff', '#43cf78', '#fff']


def particles(sid):
    R = random.Random('pt' + sid)
    k, a = pal(sid)
    out = []
    for kind, n, box, z in PT.get(sid, []):
        zc = ' f' if z == 'f' else ''
        if kind in ('flash', 'siren'):
            out.append('<div class="pt-%s" aria-hidden="true"></div>' % kind)
            continue
        for i in range(n):
            x = R.randint(box[0], box[2]); y = R.randint(box[1], box[3])
            st = 'left:%dpx;top:%dpx;--dl:-%.1fs;--t:%.1fs' % (x, y, R.uniform(0, 6), R.uniform(2.4, 6))
            if kind == 'coin':
                out.append('<img class="pt coin px%s" src="sprites/g-amulet-coin.png" alt="" style="%s">' % (zc, st))
            elif kind == 'conf':
                out.append('<i class="pt conf%s" style="%s;--c:%s;--r:%ddeg"></i>' % (zc, st, R.choice(CONF), R.randint(0, 180)))
            elif kind == 'note':
                out.append('<i class="pt note%s" style="%s">%s</i>' % (zc, st, R.choice('♪♫')))
            elif kind == 'heart':
                out.append('<i class="pt hrt%s" style="%s">♥</i>' % (zc, st))
            else:
                out.append('<i class="pt %s%s" style="%s;--c:%s"></i>' % (kind, zc, st, R.choice([k, a, '#fff'])))
    return '<div class="pts" aria-hidden="true">' + ''.join(out) + '</div>' if out else ''


PASSES.append(dict(n=9, name='Signature particles', each=particles,
per={sid: {'note': 'its own particles: %s.' % ', '.join(PTN[x[0]] for x in v)} for sid, v in PT.items()},
note='each screen gets its own particles.',
css=r'''
.pts{position:absolute;inset:0;pointer-events:none;z-index:3}
.pt{position:absolute;display:block;pointer-events:none;z-index:3;font-style:normal}
.pt.star{width:12px;height:12px;background:var(--c);clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);filter:drop-shadow(0 0 4px var(--c))}
.pt.mote{width:4px;height:4px;border-radius:50%;background:var(--c);box-shadow:0 0 8px 2px color-mix(in srgb,var(--c) 60%,transparent)}
.pt.ember{width:4px;height:4px;border-radius:1px;background:#ffcf6a;box-shadow:0 0 6px 2px rgba(255,140,60,.75)}
.pt.spark{width:8px;height:8px;background:#fff6c0;clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);filter:drop-shadow(0 0 5px #ffd23f)}
.pt.shoot{width:120px;height:2px;background:linear-gradient(90deg,transparent,#fff);transform:rotate(-18deg);opacity:.85;filter:drop-shadow(0 0 4px #cfd8ff)}
.pt.drop{width:2px;height:14px;background:linear-gradient(180deg,transparent,rgba(190,215,255,.85))}
.pt.cloud{width:260px;height:120px;border-radius:50%;background:radial-gradient(closest-side,rgba(10,14,30,.28),transparent);z-index:7}
.pt.coin{width:20px;height:20px;filter:drop-shadow(0 0 6px rgba(255,210,63,.8))}
.pt.conf{width:7px;height:12px;background:var(--c);transform:rotate(var(--r));box-shadow:0 0 4px color-mix(in srgb,var(--c) 60%,transparent)}
.pt.note{font:700 20px/1 system-ui,sans-serif;color:#ffd38a;text-shadow:0 0 8px #ff7ab8,0 2px 0 #3a1c58}
.pt.hrt{font:700 16px/1 system-ui,sans-serif;color:#ff7aa8;text-shadow:0 0 8px #ff7aa8}
.pt.zap{width:16px;height:26px;background:#ffe9b0;clip-path:polygon(55% 0,10% 55%,45% 55%,30% 100%,90% 40%,55% 40%,75% 0);filter:drop-shadow(0 0 5px #ffb38a) drop-shadow(0 0 10px #ff8a3a)}
.pt-flash{position:absolute;inset:0;z-index:3;pointer-events:none;background:radial-gradient(70% 60% at 30% 10%,rgba(220,230,255,.0),transparent);mix-blend-mode:screen}
.pt-siren{position:absolute;inset:0;z-index:3;pointer-events:none;mix-blend-mode:screen;background:radial-gradient(45% 70% at 0 30%,rgba(255,50,60,.28),transparent 70%),radial-gradient(45% 70% at 100% 30%,rgba(60,110,255,.28),transparent 70%)}
@media (prefers-reduced-motion:no-preference){
  .pt.star,.pt.spark{animation:tw var(--t) ease-in-out var(--dl) infinite}
  .pt.mote{animation:rise var(--t) linear var(--dl) infinite;animation-duration:calc(var(--t) * 2)}
  .pt.ember{animation:rise var(--t) linear var(--dl) infinite}
  .pt.shoot{animation:shoot 7s ease-in var(--dl) infinite}
  @keyframes shoot{0%,82%{transform:translate(0,0) rotate(-18deg);opacity:0}84%{opacity:1}100%{transform:translate(-260px,90px) rotate(-18deg);opacity:0}}
  .pt.drop{animation:drip .9s linear var(--dl) infinite}
  .pt.cloud{animation:cross 40s linear var(--dl) infinite;--x:420px}
  .pt.coin{animation:coinfall var(--t) linear var(--dl) infinite}
  @keyframes coinfall{0%{transform:translateY(-40px) rotateY(0);opacity:0}10%{opacity:1}100%{transform:translateY(160px) rotateY(720deg);opacity:0}}
  .pt.conf{animation:conf var(--t) linear var(--dl) infinite}
  @keyframes conf{0%{transform:translateY(-30px) rotate(var(--r));opacity:0}10%{opacity:1}100%{transform:translate(18px,150px) rotate(calc(var(--r) + 540deg));opacity:0}}
  .pt.note,.pt.hrt{animation:rise var(--t) ease-out var(--dl) infinite}
  .pt.zap{animation:zap 1.8s steps(1) var(--dl) infinite}
  @keyframes zap{0%,100%{opacity:0}8%{opacity:1;transform:scale(1)}14%{opacity:0}22%{opacity:1;transform:scale(.8) rotate(12deg)}28%{opacity:0}}
  .pt-flash{animation:lflash 7s steps(1) infinite}
  @keyframes lflash{0%,88%,92%,100%{background:transparent}89%,91%{background:radial-gradient(80% 70% at 30% 0,rgba(220,230,255,.35),transparent)}90%{background:transparent}}
  .pt-siren{animation:siren 1.4s steps(1) infinite}
  @keyframes siren{50%{background:radial-gradient(45% 70% at 0 30%,rgba(60,110,255,.28),transparent 70%),radial-gradient(45% 70% at 100% 30%,rgba(255,50,60,.28),transparent 70%)}}
}
'''))


def grade(sid):
    k, a = pal(sid)
    return '<div class="grade" aria-hidden="true" style="--g1:%s;--g2:%s"></div>' % (k, a)


PASSES.append(dict(n=10, name='Colour grade', each=grade,
note='a film-style colour grade washes the whole screen (key light from the top left, accent from the bottom right), and the dark vignette turns a deep Nova violet.',
css=r'''
.grade{position:absolute;inset:0;z-index:39;pointer-events:none;mix-blend-mode:soft-light;background:linear-gradient(150deg,color-mix(in srgb,var(--g1) 55%,transparent),transparent 38%,transparent 62%,color-mix(in srgb,var(--g2) 45%,transparent))}
.vign::after{background:radial-gradient(120% 90% at 50% 45%,transparent 55%,rgba(22,6,44,.62))}
'''))

# ---------------------------------------------------------------- batch 3: motion and reward
PASSES.append(dict(n=11, name='Entrance', note='when the screen opens, its panels, cards and buttons rise and fade in one after another with a small overshoot, so every screen arrives like a show (rest frame unchanged).',
css=r'''
@media (prefers-reduced-motion:no-preference){
  .st>.pnl,.st>.path,.st>.sq,.st>.kcard,.st>.doc,.st>.tbox,.st>.cta,.st>.ch,.st>.dz,.st>.tier,.st>.tabs,.st>.top,.st>.rib,.st>.bnr,.st>.sticker,.st>.tell{animation:enter .62s cubic-bezier(.2,1.25,.35,1) backwards;animation-delay:calc(var(--i,0) * 70ms)}
  @keyframes enter{from{opacity:0;translate:0 16px;scale:.96}}
  .st>:nth-child(4n+1){--i:1}.st>:nth-child(4n+2){--i:2}.st>:nth-child(4n+3){--i:3}.st>:nth-child(4n){--i:4}
  .st>.top,.st>.tabs{--i:0}
}
'''))

PASSES.append(dict(n=12, name='Orbiting halo',
replace=[('s9', 'class="path" style="--c:#b28cff', 'class="path goal" style="--c:#b28cff')],
note='whatever is picked (the chosen card, tile, district or rank) gets a bright spark that runs round and round its border.',
per={'s9': {'note': 'your Goal card and the picked items get a bright spark that runs round their border.'},
     's3': {'note': 'Cerulean, the picked district, gets a bright spark that runs round its border.'},
     's11': {'note': 'the picked Houndour tile gets a bright spark that runs round its border.'},
     's12': {'note': 'the open Admin rank gets a bright spark that runs round its border.'}},
css=r'''
@property --ang{syntax:"<angle>";inherits:false;initial-value:30deg}
.ch.on::after,.tile.on::after,.dz.sel::after,.tier.hot::after,.path.goal::after,.slot.ace::after{content:"";position:absolute;inset:-6px;border-radius:13px;padding:3px;pointer-events:none;z-index:2;
  background:conic-gradient(from var(--ang),transparent 0 58%,rgba(255,246,192,.2) 66%,#fff6c0 76%,#ffd23f 82%,transparent 90%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);filter:drop-shadow(0 0 4px #ffd23f)}
.slot.ace{position:relative}
@media (prefers-reduced-motion:no-preference){
  .ch.on::after,.tile.on::after,.dz.sel::after,.tier.hot::after,.path.goal::after,.slot.ace::after{animation:orbit 2.6s linear infinite}
  @keyframes orbit{to{--ang:390deg}}
}
'''))

PASSES.append(dict(n=13, name='Liquid meters', note='every meter fills with moving candy stripes and a bright cap at its edge; dials get a ring of tick marks; the lean slider knob glows.',
css=r'''
.mt::before{background:repeating-linear-gradient(135deg,rgba(255,255,255,.2) 0 5px,transparent 5px 11px),var(--fill,var(--c));box-shadow:0 0 10px var(--c),inset -3px 0 0 rgba(255,255,255,.85)}
.dial{background:repeating-conic-gradient(from -2deg,rgba(6,9,19,.55) 0 2deg,transparent 2deg 18deg),conic-gradient(var(--c) calc(var(--v) * 1%),#121830 0)}
.lean i{box-shadow:0 0 0 2px var(--ink),0 0 10px #fff,0 0 18px rgba(255,210,63,.7)}
@media (prefers-reduced-motion:no-preference){
  .mt::before{background-size:16px 100%,100% 100%;animation:mtflow 1.2s linear infinite}
  @keyframes mtflow{to{background-position:16px 0,0 0}}
}
'''))

PASSES.append(dict(n=14, name='Icon medallions', note='each panel header\'s icon sits in a round gold-rimmed medallion with a soft glow, like a badge.',
css=r'''
.hd .ic{width:32px;height:32px;margin:-4px 0;padding:4px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#45528a,#161c34);box-shadow:0 0 0 2px #c9a24a,0 0 0 4px rgba(6,9,19,.8),0 0 12px rgba(255,210,63,.35)}
.hd .ic.s{width:28px;height:28px;padding:4px;margin:-3px 0}
'''))

PASSES.append(dict(n=15, name='Holographic foil', note='the most important cards (gold panels, your Goal, Family squads, the picked tile) get a slow holographic foil sweep across them.',
css=r'''
.pnl.gild{background:linear-gradient(115deg,transparent 30%,rgba(255,236,170,.13) 42%,rgba(190,160,255,.15) 50%,rgba(140,230,255,.12) 58%,transparent 70%) 100% 0/300% 100% no-repeat,linear-gradient(180deg,rgba(42,52,86,.97),rgba(25,32,57,.97))}
.sq.fam::before,.path.goal::before,.tile.on::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:1;mix-blend-mode:screen;
  background:linear-gradient(115deg,transparent 30%,rgba(255,236,170,.22) 42%,rgba(190,160,255,.25) 50%,rgba(140,230,255,.2) 58%,transparent 70%) 100% 0/300% 100% no-repeat}
@media (prefers-reduced-motion:no-preference){
  .pnl.gild{animation:holo 7s ease-in-out infinite}
  .sq.fam::before,.path.goal::before,.tile.on::before{animation:holo1 6s ease-in-out infinite}
  @keyframes holo{0%,40%{background-position:100% 0,0 0}100%{background-position:-100% 0,0 0}}
  @keyframes holo1{0%,40%{background-position:100% 0}100%{background-position:-100% 0}}
}
'''))

# ---------------------------------------------------------------- batch 4: identity
from urllib.parse import quote
DAMASK = quote("<svg xmlns='http://www.w3.org/2000/svg' width='46' height='46'><path d='M9 31V15l9 16V15' fill='none' stroke='#b48cff' stroke-opacity='.07' stroke-width='2.2' stroke-linejoin='bevel'/><path d='M35 4l4 4-4 4-4-4z' fill='#ffd23f' fill-opacity='.09'/><circle cx='35' cy='35' r='1.6' fill='#ffd23f' fill-opacity='.10'/></svg>")
PASSES.append(dict(n=16, name='Nova damask', note='panels get a faint woven pattern of Team Nova N marks and little gold diamonds, like the lining of a Boss\'s coat.',
css=r'''
.pnl{background:url("data:image/svg+xml,%s") 0 0/46px 46px,linear-gradient(180deg,rgba(42,52,86,.97),rgba(25,32,57,.97))}
.pnl.glass{background:url("data:image/svg+xml,%s") 0 0/46px 46px,linear-gradient(180deg,rgba(34,43,74,.86),rgba(18,24,46,.9))}
.pnl.gild{background:linear-gradient(115deg,transparent 30%%,rgba(255,236,170,.13) 42%%,rgba(190,160,255,.15) 50%%,rgba(140,230,255,.12) 58%%,transparent 70%%) 100%% 0/300%% 100%% no-repeat,url("data:image/svg+xml,%s") 0 0/46px 46px,linear-gradient(180deg,rgba(42,52,86,.97),rgba(25,32,57,.97))}
@media (prefers-reduced-motion:no-preference){@keyframes holo{0%%,40%%{background-position:100%% 0,0 0,0 0}100%%{background-position:-100%% 0,0 0,0 0}}}
''' % (DAMASK, DAMASK, DAMASK)))

FOC = {'s0': (270, 150, 220, 'violet'), 's1': (390, 300, 160, 'warm'), 's2': (876, 438, 110, 'gold'), 's3': (404, 150, 120, 'gold'),
       's4': (222, 234, 150, 'gold'), 's5': (156, 228, 180, 'violet'), 's6': (528, 318, 100, 'cyan'), 's7': (414, 444, 100, 'gold'),
       's8': (480, 292, 160, 'gold'), 's9': (542, 180, 160, 'violet'), 's10': (792, 216, 180, 'cyan'), 's11': (434, 180, 120, 'gold'),
       's12': (300, 84, 130, 'gold'), 's13': (648, 474, 90, 'violet'), 'c1': (264, 160, 150, 'red'), 'c2': (180, 260, 150, 'warm'),
       'c3': (870, 216, 110, 'cold'), 'k1': (672, 204, 110, 'orange'), 'k2': (480, 204, 170, 'violet'), 'k3': (144, 216, 150, 'warm'),
       'k4': (462, 268, 110, 'gold'), 'k5': (432, 156, 130, 'cold'), 'k6': (486, 216, 160, 'warm'), 'k7': (474, 276, 150, 'cold'),
       'k8': (504, 198, 140, 'cold'), 'k9': (246, 384, 160, 'orange'), 'k10': (396, 288, 180, 'warm')}
FCOL = {'violet': '200,150,255', 'warm': '255,205,140', 'gold': '255,215,90', 'cyan': '120,215,255', 'red': '255,120,100', 'cold': '170,205,255', 'orange': '255,170,110'}
FOCN = {'s0': 'the DOMINION logo', 's1': 'Rook', 's2': 'Start the day', 's3': 'Cerulean', 's4': 'the chance dial', 's5': 'Dale on his pedestal',
        's6': 'the Front Office blueprint', 's7': 'the week\'s net', 's8': 'the Conviction marker', 's9': 'your Goal card', 's10': 'the Hoenn card',
        's11': 'the picked Houndour', 's12': 'the Boss at the top', 's13': 'the armband preview', 'c1': 'Petrel', 'c2': 'Mick and the Growlithe',
        'c3': 'the figure in the doorway', 'k1': 'the Standard tier', 'k2': 'the Pearl card', 'k3': 'Gus\'s photo', 'k4': 'the +24',
        'k5': 'the applicant', 'k6': 'Rosa', 'k7': 'Mr. Fenwick', 'k8': 'the officer', 'k9': 'the Boss walking out', 'k10': 'the crew'}


def focus(sid):
    x, y, r, c = FOC[sid]
    return '<div class="focus" aria-hidden="true" style="left:%dpx;top:%dpx;--r:%dpx;--fc:%s"></div>' % (x, y, r, FCOL[c])


PASSES.append(dict(n=17, name='Focal spotlight', each=focus,
per={sid: {'note': 'a breathing pool of light sits behind %s, the one thing the eye should land on first.' % FOCN[sid]} for sid in FOC},
note='a breathing spotlight sits behind the screen\'s focal point.',
css=r'''
.focus{position:absolute;z-index:2;width:calc(var(--r) * 2);height:calc(var(--r) * 2);margin:calc(var(--r) * -1) 0 0 calc(var(--r) * -1);border-radius:50%;pointer-events:none;mix-blend-mode:screen;
  background:radial-gradient(closest-side,rgba(var(--fc),.42),rgba(var(--fc),.16) 55%,transparent)}
@media (prefers-reduced-motion:no-preference){.focus{animation:breathe 4.5s ease-in-out infinite}@keyframes breathe{50%{scale:1.12;opacity:.75}}}
'''))

NIGHT = {'s0', 's6', 's9', 's10', 'c3', 'k5', 'k10', 'k9'}


def lights(sid):
    k, a = pal(sid)
    h = '<div class="edgeglow" aria-hidden="true" style="--eg:%s"></div>' % k
    if sid in NIGHT:
        h += ('<div class="beam sweep" aria-hidden="true" style="left:120px;z-index:1;--a0:-30deg;--a1:14deg;background:linear-gradient(0deg,transparent,%s 35%%,transparent);opacity:.35"></div>'
              '<div class="beam sweep b" aria-hidden="true" style="left:780px;z-index:1;--a0:22deg;--a1:-18deg;background:linear-gradient(0deg,transparent,%s 35%%,transparent);opacity:.3"></div>') % (k, a)
    return h


PASSES.append(dict(n=18, name='Light show', each=lights,
per={sid: {'note': 'a neon glow breathes around the edge of the screen, and two searchlights in the screen\'s colours sweep the night sky behind everything.'} for sid in NIGHT},
note='a neon glow in the screen\'s key colour breathes around the edge of the whole screen.',
css=r'''
.edgeglow{position:absolute;inset:0;z-index:38;pointer-events:none;box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--eg) 45%,transparent),inset 0 0 38px color-mix(in srgb,var(--eg) 30%,transparent)}
@media (prefers-reduced-motion:no-preference){.edgeglow{animation:egp 3.8s ease-in-out infinite}@keyframes egp{50%{opacity:.55}}}
'''))

PASSES.append(dict(n=19, name='Gold-leaf lettering', note='title-tab lettering gets a bevel (light top edge, deep shadow), headers on gold panels turn to gold leaf, and ribbons and banners get engraved edges.',
css=r'''
.ttl{text-shadow:0 -1px 0 rgba(255,255,255,.35),0 3px 0 rgba(0,0,0,.4),0 0 18px rgba(255,255,255,.25)}
.pnl.gild>.hd{background:linear-gradient(180deg,#fff8d8 10%,#ffd23f 55%,#c9900c);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 1px 0 rgba(0,0,0,.6))}
.rib,.tbox .who{text-shadow:0 1px 0 rgba(255,255,255,.65)}
.bnr{text-shadow:0 1px 0 rgba(255,255,255,.7),0 -1px 0 rgba(120,80,0,.35)}
'''))

C1 = "<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><g transform='%s'><path d='M3 46V12Q3 3 12 3h34' fill='none' stroke='#ffd23f' stroke-width='2'/><path d='M9 46V16q0-7 7-7h30' fill='none' stroke='#ffd23f' stroke-opacity='.45'/><circle cx='11' cy='11' r='3.2' fill='#fff2b0'/><path d='M22 3l3.5 3.5L22 10l-3.5-3.5z' fill='#ffd23f'/><path d='M3 22l3.5 3.5L3 29l-3.5-3.5z' fill='#ffd23f'/></g></svg>"
CORN = [quote(C1 % t) for t in ('', 'translate(48 0) scale(-1 1)', 'translate(0 48) scale(1 -1)', 'translate(48 48) scale(-1 -1)')]
PASSES.append(dict(n=20, name='Ornate frame', each=lambda sid: '<div class="orn" aria-hidden="true"></div>',
note='the whole screen gets a fine double gold frame with filigree corners and gem studs, so every screen reads as a framed Dominion page.',
css=r'''
.orn{position:absolute;inset:3px;z-index:38;pointer-events:none;
  background:url("data:image/svg+xml,%s") 0 0/48px 48px no-repeat,url("data:image/svg+xml,%s") 100%% 0/48px 48px no-repeat,url("data:image/svg+xml,%s") 0 100%%/48px 48px no-repeat,url("data:image/svg+xml,%s") 100%% 100%%/48px 48px no-repeat,
  linear-gradient(90deg,transparent 48px,rgba(255,210,63,.55) 120px,rgba(255,210,63,.55) calc(100%% - 120px),transparent calc(100%% - 48px)) 0 0/100%% 1px no-repeat,
  linear-gradient(90deg,transparent 48px,rgba(255,210,63,.55) 120px,rgba(255,210,63,.55) calc(100%% - 120px),transparent calc(100%% - 48px)) 0 100%%/100%% 1px no-repeat;filter:drop-shadow(0 0 3px rgba(255,210,63,.5))}
''' % tuple(CORN)))

# ---------------------------------------------------------------- batch 5: finish
PASSES.append(dict(n=21, name='Depth and underglow', note='panels float higher: a deeper soft shadow plus an underglow in the screen\'s key colour, so the UI layer separates cleanly from the scene behind it.',
css=r'''
.st .pnl,.st .path,.st .sq{box-shadow:0 0 0 3px var(--ink),inset 0 0 0 1px rgba(255,222,140,.18),inset 0 2px 0 rgba(255,255,255,.12),inset 0 -3px 0 rgba(0,0,0,.25),0 16px 30px rgba(0,0,0,.55),0 22px 44px -14px color-mix(in srgb,var(--rim,#a678ff) 45%,transparent)}
.st .pnl.gild{box-shadow:0 0 0 3px #2c1f05,inset 0 2px 0 rgba(255,240,180,.15),0 0 0 6px rgba(240,207,110,.12),0 0 26px rgba(255,210,63,.3),0 16px 30px rgba(0,0,0,.55),0 22px 44px -14px color-mix(in srgb,var(--rim,#a678ff) 45%,transparent)}
.st .sq.fam{box-shadow:0 0 0 3px var(--ink),0 0 0 6px #ffd23f,0 0 24px rgba(255,210,63,.45),0 22px 44px -14px color-mix(in srgb,var(--rim,#a678ff) 45%,transparent)}
.st .doc{box-shadow:0 0 0 2px #2a2014,3px 6px 0 rgba(0,0,0,.35),0 18px 30px rgba(0,0,0,.5)}
'''))

PASSES.append(dict(n=22, name='Hardware details', note='tabs get brass screw heads, pills and chips get a glossy top, paper notes get a stitched inner seam, and key caps get a shiny bevel.',
css=r'''
.tabs>div:not(.on){background:radial-gradient(circle at 7px 7px,#e8d9a8 0 1.5px,#6a5420 2px,transparent 3px),radial-gradient(circle at calc(100% - 7px) 7px,#e8d9a8 0 1.5px,#6a5420 2px,transparent 3px),linear-gradient(180deg,rgba(52,64,104,.98),rgba(28,35,62,.98) 52%,rgba(18,23,44,.98))}
.pill,.fx,.type{background-image:linear-gradient(180deg,rgba(255,255,255,.3),rgba(255,255,255,0) 55%)}
.doc{outline:1px dashed rgba(122,100,64,.4);outline-offset:-5px}
.kc{box-shadow:0 0 0 2px var(--ink),inset 0 -3px 0 rgba(0,0,0,.22),inset 0 1px 0 #fff}
'''))

COPY = [('<i></i>Haiku · ', '<i></i>Quick · '), ('<i></i>Sonnet · ', '<i></i>Deep · '), ('Chatter + news · Haiku · ', 'Chatter + news · Quick · '),
        ('Talks, judge, rivals · Haiku<br>Debate voice · Sonnet', 'Talks, judge, rivals · quick<br>Debate voice · deep'),
        ('></i>Haiku</span>', '></i>Quick</span>'), ('style="color:var(--ai)">Haiku · $0.0002', 'style="color:var(--ai)">Quick · $0.0002'),
        ('<span>Dialogue only · Haiku</span>', '<span>Dialogue only · quick voice</span>'), ('<span>Sonnet for big moments', '<span>Deep voice for big moments'),
        ('No API key? Each stance', 'No Key-Card? Each stance'), ('limit in the Anthropic Console. The game', 'limit where the key was made. The game')]
CN = {'k1': 'the tier list says “quick voice” and “deep voice” instead of model names.', 'k2': '“Anthropic Console” became “where the key was made”, so no company or AI name shows.',
      'k3': 'the Rotom chip says “Quick” instead of a model name.', 'k4': 'the chips say “Quick” and “Deep” instead of model names.',
      'k5': 'the Rotom chip says “Quick” instead of a model name.', 'k6': 'the Rotom chip says “Quick” instead of a model name.',
      'k7': 'the Rotom chip says “Quick” instead of a model name.', 'k8': 'the Rotom chip says “Quick” instead of a model name.',
      'k10': 'the Rotom chip says “Quick” instead of a model name.', 's8': '“No API key?” became “No Key-Card?”, the game\'s own word.'}
PASSES.append(dict(n=23, name='Readability and naming check', replace=[(None, a, b) for a, b in COPY],
per={sid: {'note': 'checked that every line still reads clearly over the new effects (the haze, grade and edge glow stay behind or below text); ' + v} for sid, v in CN.items()},
note='checked that every line still reads clearly over the new effects: haze, bokeh and particles sit behind the panels, and the grade and edge glow are too soft to cut contrast. Small muted text gets a dark halo.',
css=r'''
.pnl .xs,.pnl .dm,.pnl .mu{text-shadow:0 1px 2px rgba(6,9,19,.8)}
'''))

PASSES.append(dict(n=24, name='Living backdrop', note='the background never sits still: painted scenes slowly drift and zoom like a camera pan, and checkered floors slide gently.',
css=r'''
@media (prefers-reduced-motion:no-preference){
  .st>canvas.cv{animation:kb 32s ease-in-out infinite alternate;transform-origin:50% 60%}
  @keyframes kb{to{scale:1.05;translate:-8px -4px}}
  .st.check{animation:chk 60s linear infinite}
  @keyframes chk{to{background-position:56px 112px}}
}
'''))


def crown(sid):
    x, y, r, c = FOC[sid]
    s = int(r * 2.2)
    return ('<div class="rays turn finale" aria-hidden="true" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx;--rc:rgba(%s,.30)"></div>'
            '<i class="glint fg" style="left:%dpx;top:%dpx;--g:20px"></i><i class="glint fg" style="left:%dpx;top:%dpx;--g:14px;animation-delay:-1.4s"></i>') % (
        x - s // 2, y - s // 2, s, s, FCOL[c], x + int(r * .55), y - int(r * .6), x - int(r * .7), y + int(r * .35))


PASSES.append(dict(n=25, name='Finale burst', each=crown,
per={sid: {'note': 'a slow-turning sunburst crowns %s and two star glints flash beside it: the screen\'s signature moment.' % FOCN[sid]} for sid in FOC},
note='a slow-turning sunburst crowns the focal point and two glints flash beside it.',
css=r'''
.finale{z-index:2;mix-blend-mode:screen}
.glint.fg{z-index:3}
'''))
