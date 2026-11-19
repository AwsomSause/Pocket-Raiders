# Round 4 interval 3 (passes 11-15): navigation. The Boss's board (page map), the command wheel, breadcrumbs,
# one shared Settings list, and a crimson shutter between pages.
import math
from kit import *

CSS = r'''
/* pass 11: the Boss's board */
.cork{position:absolute;inset:0;background:radial-gradient(circle at 20% 30%,rgba(0,0,0,.18) 0 1px,transparent 2px) 0 0/7px 7px,radial-gradient(circle at 60% 70%,rgba(255,220,160,.12) 0 1px,transparent 2px) 3px 2px/9px 9px,radial-gradient(120% 90% at 50% 40%,#8a5a32,#5a3518 70%,#341d0c)}
.cork::after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 0 14px #3a2412,inset 0 0 0 17px #1c0f05,inset 0 0 60px rgba(0,0,0,.6)}
.pol{position:absolute;z-index:6;width:104px;padding:6px 6px 8px;background:#f4efe2;box-shadow:0 0 0 2px #1c0f05,0 8px 14px rgba(0,0,0,.45);transform:rotate(var(--r,0deg));text-align:center;color:#2a1a10}
.pol .ph{height:52px;display:grid;place-items:center;background:linear-gradient(180deg,#2a1838,#140a1e);box-shadow:inset 0 0 0 1px rgba(0,0,0,.4)}
.pol .ph img{width:38px;height:38px;object-fit:contain;image-rendering:pixelated}
.pol b{display:block;font:700 13px/1.1 var(--ui);margin-top:5px;letter-spacing:.02em}
.pol small{display:block;font:500 10.5px var(--ui);color:#7a4a2a}
.pol::before{content:"";position:absolute;left:50%;top:-7px;width:13px;height:13px;margin-left:-6px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffb0b8,#d0233f 55%,#5a0812);box-shadow:0 2px 3px rgba(0,0,0,.5)}
.pol.gold{background:#fff3c4}.pol.gold::before{background:radial-gradient(circle at 35% 30%,#fff6c8,#e0a82a 55%,#6a4808)}
.pol.new{box-shadow:0 0 0 2px #1c0f05,0 0 0 4px #ff4d63,0 8px 14px rgba(0,0,0,.45)}
.strings{position:absolute;inset:0;z-index:4;pointer-events:none}
.tag4{position:absolute;z-index:7;font:700 11px var(--ui);padding:1px 6px;background:#f4efe2;color:#8a0f22;box-shadow:0 0 0 1.5px #1c0f05;transform:rotate(-3deg)}
.tag4.g{color:#6a4808;background:#fff3c4}
.memo{position:absolute;z-index:6;background:#fff27a;color:#3a2a08;font:600 13px/1.3 var(--ui);padding:10px 12px;box-shadow:0 0 0 2px #1c0f05,0 8px 14px rgba(0,0,0,.4);transform:rotate(2deg)}

/* pass 12: the command wheel */
.wheel{position:absolute;z-index:20;border-radius:50%;background:radial-gradient(circle,rgba(20,8,28,.0) 0 31%,rgba(20,8,28,.92) 32% 66%,transparent 67%)}
.wheel::before{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from var(--wa,0deg),rgba(255,77,99,.55) 0 45deg,transparent 45deg);-webkit-mask:radial-gradient(circle,transparent 0 32%,#000 33% 65%,transparent 66%);mask:radial-gradient(circle,transparent 0 32%,#000 33% 65%,transparent 66%)}
.wheel::after{content:"";position:absolute;inset:-6px;border-radius:50%;box-shadow:0 0 0 2px rgba(255,77,99,.6),0 0 30px rgba(255,77,99,.35),inset 0 0 0 2px rgba(154,100,216,.5)}
.wo{position:absolute;z-index:22;width:92px;height:74px;margin:-37px 0 0 -46px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:#e8e2ff;font:700 13px var(--ui);letter-spacing:.06em;text-transform:uppercase;text-align:center}
.wo img{width:34px;height:34px;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 2px 0 #000)}
.wo .kc{font-size:10px}
.wo.on{color:#fff;text-shadow:0 0 10px #ff4d63}
.wo.on img{transform:scale(1.25);filter:drop-shadow(0 0 8px #ff4d63) drop-shadow(0 2px 0 #000)}
.hub4{position:absolute;z-index:23;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:4px;
  background:radial-gradient(circle at 50% 35%,#3a1a4a,#12071a 70%);box-shadow:0 0 0 3px var(--ink),0 0 0 6px #8e1530,0 0 0 7px rgba(255,120,140,.6),0 0 40px rgba(255,77,99,.35)}
.hub4 b{font:700 20px var(--ui);color:#fff;letter-spacing:.04em}
.hub4 span{font-size:12.5px;color:#c9b8ec;line-height:1.3}

/* pass 13: breadcrumbs */
.crumb{display:inline-flex;align-items:center;gap:6px;font:600 13px var(--ui);color:#e8d8ff;background:rgba(18,7,26,.8);padding:3px 10px;border-radius:999px;box-shadow:0 0 0 2px #5e3a8e}
.crumb i{font-style:normal;color:#ff6a7e}
.crumb b{color:#ffd23f}
.q4{background:#4e0c24;border-color:#ff6a7e}

/* pass 15: the shutter between pages */
.shut{position:absolute;z-index:30;top:-40px;bottom:-40px;width:190px;transform:skewX(-14deg);background:linear-gradient(90deg,#12071a,#3a0a1e 40%,#8e1530 52%,#3a0a1e 64%,#12071a);box-shadow:0 0 0 3px #ff4d63,0 0 40px rgba(255,77,99,.7),0 0 120px rgba(194,24,58,.5)}
.shut::before,.shut::after{content:"";position:absolute;top:0;bottom:0;width:6px;background:linear-gradient(180deg,#ffd23f,#ff4d63)}
.shut::before{left:-14px;opacity:.7}.shut::after{right:-14px;opacity:.7}
.streak{position:absolute;z-index:29;height:3px;border-radius:2px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.8));filter:drop-shadow(0 0 4px #ff4d63)}
.eye4{position:absolute;z-index:31;width:96px;height:64px;clip-path:ellipse(50% 38% at 50% 50%);background:radial-gradient(ellipse 8px 22px at 50% 50%,#12071a 92%,transparent 100%),radial-gradient(circle at 50% 50%,#fff3b0 0 7px,#ffd23f 10px,#ff4d63 18px,#8a0f22 26px,#2a0610 29px,transparent 30px),linear-gradient(180deg,#f2e8ff,#b9a6d8)}
.dest{position:absolute;z-index:32;font:700 30px var(--ui);color:#fff;letter-spacing:.06em;text-shadow:0 3px 0 #000,0 0 18px #ff4d63}
.dest small{display:block;font:600 13px var(--ui);color:#ffb0b8;letter-spacing:.16em}

@media (prefers-reduced-motion:no-preference){
  .wheel::before{animation:wpulse 1.8s ease-in-out infinite}
  @keyframes wpulse{50%{opacity:.6}}
  .streak{animation:streak 1.1s linear infinite}
  @keyframes streak{from{transform:translateX(60px);opacity:0}30%{opacity:1}to{transform:translateX(-120px);opacity:0}}
  .pol.new{animation:polnew 2.4s ease-in-out infinite}
  @keyframes polnew{50%{box-shadow:0 0 0 2px #1c0f05,0 0 0 4px #ff4d63,0 0 18px #ff4d63,0 8px 14px rgba(0,0,0,.45)}}
}
'''

# ---------------------------------------------------------------- m5 the Boss's board
B = {  # id: (x, y, rot, icon, label, how, cls)
 'title': (30, 70, -3, 'i-leaders_crest', 'Title', 'start', ''),
 'menu': (428, 66, 2, 'g-relic-crown', 'Boss Menu', 'Esc, anywhere', 'gold new'),
 'set': (800, 70, -2, 'g-scope-lens', 'Settings', 'from the Menu', 'gold new'),
 'hq': (30, 222, 3, 'g-card-key', 'HQ', 'tab 1', ''),
 'morn': (182, 210, -2, 'g-calendar', 'Morning', 'each day', ''),
 'assign': (334, 222, 2, 'c-mina', 'Assign', 'Enter on a grunt', 'new'),
 'crew': (486, 210, -3, 'g-fame-checker', 'Crew File', 'tab 3', ''),
 'ledger': (638, 222, 2, 'g-journal', 'Ledger', 'tab 6 or L', ''),
 'rotom': (800, 214, -2, 'p-rotom', 'Rotom', 'from Settings', ''),
 'map': (40, 372, 2, 'g-town-map', 'Region Map', 'tab 2', ''),
 'dist': (190, 382, -3, 'g-bicycle', 'District', 'click a town', 'new'),
 'card': (340, 372, 3, 'g-member-card', 'Action Card', 'pick an action', ''),
 'take': (490, 382, -2, 'g-relic-statue', 'Takeover', 'control 50+', ''),
 'chair': (640, 372, 2, 't-petrel', 'The Chair', 'every evening', ''),
}
EDGES = [('title', 'hq', 'r', 'New run'), ('hq', 'morn', 'r', ''), ('morn', 'assign', 'r', 'Enter'), ('hq', 'map', 'r', 'Tab 2'),
         ('map', 'dist', 'r', ''), ('dist', 'card', 'r', '1–9'), ('card', 'take', 'r', ''), ('morn', 'chair', 'r', 'day ends'),
         ('hq', 'crew', 'r', ''), ('crew', 'ledger', 'r', ''), ('menu', 'set', 'g', 'S'), ('set', 'rotom', 'g', ''),
         ('menu', 'hq', 'g', 'Esc'), ('menu', 'morn', 'g', ''), ('menu', 'assign', 'g', ''), ('menu', 'crew', 'g', '')]


def ctr(k):
    x, y = B[k][0], B[k][1]
    return x + 52, y + 2


def board():
    svg = ['<svg class="strings" viewBox="0 0 960 540" aria-hidden="true">']
    tags = []
    for a, b, c, lab in EDGES:
        (x1, y1), (x2, y2) = ctr(a), ctr(b)
        mx, my = (x1 + x2) / 2, max(y1, y2) + 26 + abs(x2 - x1) * .05
        col, dash = ('#d0233f', '') if c == 'r' else ('#e0a82a', ' stroke-dasharray="7 5"')
        svg.append('<path d="M%d %d Q%d %d %d %d" fill="none" stroke="#1c0f05" stroke-width="4" opacity=".45" transform="translate(1 3)"/>' % (x1, y1, mx, my, x2, y2))
        svg.append('<path d="M%d %d Q%d %d %d %d" fill="none" stroke="%s" stroke-width="2.6"%s/>' % (x1, y1, mx, my, x2, y2, col, dash))
        if lab:
            tx, ty = (x1 + 2 * mx + x2) / 4, (y1 + 2 * my + y2) / 4
            tags.append('<span class="tag4%s" style="left:%dpx;top:%dpx">%s</span>' % (' g' if c == 'g' else '', tx - 16, ty - 8, lab))
    svg.append('</svg>')
    pols = ''.join('<div class="pol %s" style="left:%dpx;top:%dpx;--r:%ddeg"><div class="ph"><img src="sprites/%s.png" alt=""></div><b>%s</b><small>%s</small></div>' % (cl, x, y, r, ic, nm, how)
                   for (x, y, r, ic, nm, how, cl) in B.values())
    return '\n  '.join(svg) + '\n  ' + pols + '\n  ' + ''.join(tags)


M5 = fig('m5', 'New · The Boss\'s board (how every page connects)',
 'A map of the whole Dominion UI, drawn as the Boss\'s planning board: every page is a pinned photo, red string shows the normal way between pages, and gold dashed string shows the Boss Menu, which opens on Esc from anywhere. Pages with a red rim are new this round. It doubles as an in-game help page under Boss Menu, then Settings, then Controls.',
 '''  <div class="cork"></div>
  <div class="ttl" style="--t1:#7a3a12;--t2:#c9338f">The Board <span class="sub">· how every page connects</span></div>
  <div class="keys"><span class="key">Esc</span><span>Back</span></div>
  ''' + board() + '''
  <div class="memo" style="left:790px;top:366px;width:140px">Red string: the normal way.<br>Gold string: Esc to the Menu.<br><b>Hold Q</b>: the wheel jumps anywhere.</div>
''' + fx('#ffb07a', '#ff4d63'), cls='st kl-warm vign grain', style='background:#341d0c')

# ---------------------------------------------------------------- m6 command wheel
WO = [('g-card-key', 'HQ', '1'), ('g-town-map', 'Region Map', '2'), ('g-fame-checker', 'Roster', '3'), ('g-ball', 'Pokémon', '4'),
      ('g-machine-part', 'Operations', '5'), ('g-journal', 'Ledger', '6'), ('p-rotom', 'Rotom', 'R'), ('g-relic-crown', 'Boss Menu', 'Esc')]


def wheel(cx, cy, r, on):
    out = []
    for i, (ic, nm, k) in enumerate(WO):
        a = math.radians(-90 + i * 45)
        out.append('<div class="wo%s" style="left:%dpx;top:%dpx"><img src="sprites/%s.png" alt="">%s<span class="kc">%s</span></div>' % (
            ' on' if i == on else '', cx + r * math.cos(a), cy + r * math.sin(a), ic, nm, k))
    return ''.join(out)


M6 = fig('m6', 'New · Command wheel (hold Q anywhere)',
 'Holding Q on any Dominion screen dims the page and opens the Boss\'s command wheel: eight places in a ring around the Nova eye. Flick the mouse or stick toward one and let go to jump there; the six tabs keep their number keys, Rotom is R and the Boss Menu is Esc. The middle tells you what waits on the page you are pointing at, so you can check before you go.',
 top() + '''
  <canvas class="cv" data-paint="warehouse" width="960" height="540" style="filter:brightness(.25) saturate(.5) blur(3px)"></canvas>
  <div class="layer" style="background:radial-gradient(circle at 480px 300px,rgba(90,20,120,.35),rgba(6,3,12,.75) 60%)"></div>
  <div class="wheel" style="left:280px;top:100px;width:400px;height:400px;--wa:22.5deg"></div>
  ''' + wheel(480, 300, 152, 1) + '''
  <div class="hub4" style="left:404px;top:224px;width:152px;height:152px"><div class="eye4" style="position:relative;width:54px;height:36px"></div><b>Region Map</b><span>Red is in Cerulean.<br>2 actions left today.</span></div>
  <div class="a col" style="left:24px;top:120px;width:210px;gap:8px;z-index:21">
    <div class="grp" style="--c:#ff4d63">LAST PAGES</div>
    <div class="act"><img class="ic s" src="sprites/c-mina.png" alt="">Assign · Mina<span class="kc">⌫</span></div>
    <div class="act"><img class="ic s" src="sprites/g-calendar.png" alt="">Morning report</div>
    <div class="act dim"><img class="ic s" src="sprites/g-bicycle.png" alt="">Cerulean file</div>
  </div>
  <div class="a col" style="right:24px;top:120px;width:210px;gap:8px;z-index:21">
    <div class="grp" style="--c:#ffd23f">PINNED</div>
    <div class="act"><img class="ic s" src="sprites/g-bicycle.png" alt="">Cerulean · Foothold</div>
    <div class="act"><img class="ic s" src="sprites/c-dale.png" alt="">Dale wants a word</div>
  </div>
  <div class="keys" style="top:auto;bottom:18px;right:auto;left:50%;transform:translateX(-50%)"><span class="key">Q</span><span>hold</span><span class="key">◀▶</span><span>point</span><span class="key">Q</span><span>let go to jump</span><span class="key">⌫</span><span>last page</span></div>
''' + fx('#c9a0ff', '#ff4d63'), cls='st kl-violet vign grain', style='background:#0b0618')

# ---------------------------------------------------------------- m7 shutter
M7 = fig('m7', 'New · Page change: the crimson shutter',
 'What moving between pages looks like, frozen halfway: a crimson blade with the Nova eye sweeps across, the old page (the Region Map) slides off to the left and the new one (the Cerulean district file) slides in from the right, and the name of the new page flashes on the blade. It takes about a third of a second; Lighter makes it a plain fade and Calm turns it off.',
 '''  <canvas class="cv" data-paint="skyline" data-pal="day" data-seed="21" data-tall="1.1" width="960" height="540" style="filter:saturate(.9) brightness(.8)"></canvas>
  <div class="layer" style="clip-path:polygon(0 0,52% 0,40% 100%,0 100%);background:radial-gradient(circle at 1px 1px,rgba(140,170,255,.18) 1px,transparent 1.5px) 0 0/22px 22px,linear-gradient(180deg,#1a2244,#0e1430);z-index:2"></div>
  <div class="a" style="left:60px;top:150px;width:300px;height:250px;z-index:3;opacity:.75;filter:blur(1.5px);transform:translateX(-30px)">
    <svg viewBox="0 0 300 250" width="300" height="250" aria-hidden="true"><g fill="none" stroke="#f0cf6e" stroke-width="3" stroke-dasharray="8 6"><path d="M30 40H150V130H270"/><path d="M150 130V220H60"/></g>
    <g fill="#2a1838" stroke="#f0cf6e" stroke-width="3"><rect x="0" y="20" width="70" height="40" rx="6"/><rect x="120" y="110" width="70" height="40" rx="6" stroke="#ff4d63"/><rect x="230" y="110" width="70" height="40" rx="6"/><rect x="20" y="200" width="70" height="40" rx="6"/></g></svg>
  </div>
  <div class="pnl glass" style="left:640px;top:150px;width:290px;height:200px;z-index:3;transform:translateX(40px);opacity:.9">
    <div class="hd"><img class="ic" src="sprites/g-machine-part.png" alt="">What will you do here?</div>
    <div class="row" style="gap:8px;margin-top:10px"><div class="act on" style="flex:1"><img class="ic s" src="sprites/g-relic-gold.png" alt="">Extort</div><div class="act" style="flex:1"><img class="ic s" src="sprites/g-black-belt.png" alt="">Attack</div></div>
  </div>
  <div class="streak" style="left:620px;top:120px;width:180px"></div><div class="streak" style="left:660px;top:250px;width:240px"></div><div class="streak" style="left:600px;top:400px;width:160px"></div><div class="streak" style="left:700px;top:470px;width:200px"></div>
  <div class="shut" style="left:430px"></div>
  <div class="eye4" style="left:472px;top:200px"></div>
  <div class="dest" style="left:330px;top:290px;width:360px;text-align:center"><small>REGION MAP ▸</small>CERULEAN</div>
  <div class="ttl" style="--t1:#1f6fd0;--t2:#38b6d8;z-index:33">Cerulean <span class="sub">· District file</span></div>
''' + fx('#ff4d63', '#ffd23f'), cls='st kl-red vign grain', style='background:#0e1430')

PAGES = [M5, M6, M7]
PAGE_NAV = [('m5', 'Board'), ('m6', 'Wheel'), ('m7', 'Shutter')]

# pass 13 + 14 on earlier pages
PAGE_REPLACE = [
 ('m3', "<div style=\"flex:1\"><img class=\"ic l\" src=\"sprites/g-town-map.png\" alt=\"\"><div><span class=\"l\">REGION:</span><span class=\"v cy\">KANTO</span></div></div>",
  "<div style=\"flex:1\"><img class=\"ic l\" src=\"sprites/g-town-map.png\" alt=\"\"><div><span class=\"l\">YOU ARE HERE</span><span class=\"v cy\" style=\"font-size:16px;white-space:nowrap\">Morning › Assign</span></div></div>"),
 ('m4', '<div class="keys"><span class="key">Esc</span><span>Map</span></div>',
  '<div class="keys"><span class="crumb">Region Map <i>›</i> <b>Cerulean</b></span><span class="key q4">Q</span><span>Wheel</span><span class="key">Esc</span><span>Back</span></div>'),
 ('m1', '<div class="keys"><span class="key">Esc</span><span>Back to the game</span></div>',
  '<div class="keys"><span class="key q4">Q</span><span>Wheel</span><span class="key">Esc</span><span>Back to the game</span></div>'),
 ('m2', '<div class="cat"><img class="ic s" src="sprites/g-choice-band.png" alt="">Controls</div>',
  '<div class="cat"><img class="ic s" src="sprites/g-choice-band.png" alt="">Battle</div><div class="cat"><img class="ic s" src="sprites/g-town-map.png" alt="">Runs</div>'),
]

# every old screen with a key strip gets the wheel key; Rotom Settings gets the same category list as Dominion Settings
_K1A = '<div class="row" style="padding:7px 10px;border-radius:7px;color:#c9d2f2"><img class="ic s" src="sprites/g-tea.png" alt="">Audio</div>'
REPLACE = [
 ('', '<div class="keys">', '<div class="keys"><span class="key q4">Q</span><span>Wheel</span>'),
 ('', '<div class="keys" style="right:96px">', '<div class="keys" style="right:96px"><span class="key q4">Q</span><span>Wheel</span>'),
 ('k1', '<div class="col" style="gap:6px;font-size:17px;font-weight:600">', '<div class="col" style="gap:1px;font-size:16px;font-weight:600">'),
 ('k1', _K1A, '<div class="row" style="padding:5px 10px;border-radius:7px;color:#c9d2f2"><img class="ic s" src="sprites/g-relic-crown.png" alt="">Dominion</div>'
              '<div class="row" style="padding:5px 10px;border-radius:7px;color:#c9d2f2"><img class="ic s" src="sprites/g-star-piece.png" alt="">Effects &amp; motion</div>' + _K1A),
]
NOTES = {
 'm1': ['Interval 3 · the key strip now shows Q for the command wheel next to Esc.'],
 'm2': ['Interval 3 · the category list now matches the Rotom tab of Settings exactly (Battle and Runs added), so Settings is one page with one list.'],
 'm3': ['Interval 3 · the top bar\'s last cell is now a "You are here" breadcrumb: Morning › Assign.'],
 'm4': ['Interval 3 · breadcrumb (Region Map › Cerulean), the wheel key, and Esc now says Back.'],
 'm5': ['Pass 11 · built: the whole UI as the Boss\'s planning board, red string for normal routes, gold dashed string for Esc to the Menu.'],
 'm6': ['Pass 12 · built: hold Q for an eight-way wheel with last pages and pinned pages on the sides.'],
 'm7': ['Pass 15 · built: the crimson shutter that plays between pages, frozen halfway.'],
 'k1': ['Interval 3 · Dominion and Effects & motion added to the category list, so this is the same Settings page as the new Dominion tab.'],
}
ALL_NOTE = 'Interval 3 · the key strip shows Q (hold for the command wheel); page changes use the crimson shutter.'
TITLE = 'Getting around'
BIG = ('The screens now work as one connected game: a map of how every page links, a hold-Q command wheel that jumps anywhere, '
       '"you are here" breadcrumbs, one shared Settings list, and a crimson shutter that plays between pages.')
REVIEW = [
 ('The Boss\'s board', 'A cork planning board with pinned photos and red string, which is how a crime boss plans.',
  'Before, nothing showed how the 31 screens connect; now one page shows every route.', 'Yes: one new page, and it doubles as in-game help.',
  'The Menu is pinned at the top centre with gold string down to every main page; Settings hangs off it.', 'Yes: red string on a cork board is the classic villain\'s plan.'),
 ('Command wheel', 'A glowing ring of eight places around the Nova eye, with a crimson wedge on the one you point at.',
  'Jumping between pages took Esc, then the menu, then a choice; now it is one hold and flick.', 'It removes clicks instead of adding pages; last and pinned pages sit on its sides.',
  'Boss Menu is one of the eight spots, so Settings is two steps away from anywhere.', 'Yes: the Boss\'s orders come from the centre of the wheel.'),
 ('Breadcrumbs', '"You are here" chips with a crimson arrow.', 'Drill-down pages could get lost; now each one says where you came from.',
  'Checked: the breadcrumb sits in the top bar or key strip, so no page got more crowded.', 'Esc always goes one step back; from the top level it opens the Menu.', 'Neutral; this pass is about clarity.'),
 ('One Settings', 'The Rotom tab and the Dominion tab now share one category list.', 'There were two different Settings lists; now there is one.',
  'No new page: two half-pages became one page.', 'Settings opens from the Menu with the same nine tabs every time.', 'Partly: Dominion rules sit at the top of the list.'),
 ('The crimson shutter', 'A crimson blade with the Nova eye wipes across between pages, with the new page\'s name flashing on it.',
  'Pages used to just swap; now every change has a short villain sting.', 'No; it is a moment, not a page. Lighter turns it into a fade and Calm turns it off.',
  'The Menu opens with the same shutter, so pausing feels part of the show.', 'Yes: every page change looks like a team takeover.'),
]
