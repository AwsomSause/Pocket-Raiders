"""Dominion tutorial + opening mockups.

Builds ../index.html from the round-4 page (../../mockups-v4/index.html): same <style> block, same painter script,
same sprites, plus the tutorial pieces below (.tu-*). Run: python3 src/build.py
"""
import os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
V4 = os.path.join(OUT, '..', 'mockups-v4')
src = open(os.path.join(V4, 'index.html'), encoding='utf-8').read()

HEAD = src[:src.index('</style>')]
SCRIPT = src[src.index('<script>'):]


def frame(fid):
    """Inner HTML of a round-4 screen, without its figure wrapper."""
    i = src.index('<figure id="%s">' % fid)
    i = src.index('>', src.index('<div class="st', i)) + 1
    j = src.index('\n</div></div>\n<figcaption>', i)
    return src[i:j]


def swap(s, *pairs):
    for a, b in pairs:
        assert a in s, a[:70]
        s = s.replace(a, b)
    return s


# ---------------------------------------------------------------- kit

def top(nm='UNNAMED CREW', sub='HEADQUARTERS', day='DAY 01', when='EVENING', wc='#b48cff', funds='₽1,000', heat='5%', roster='1/3', emb='?', ec='#8a8f9e'):
    return ('<div class="top">'
            '<div class="team"><div class="emb" style="color:#fff;background:linear-gradient(180deg,%s,color-mix(in srgb,%s 55%%,#000))">%s</div><div><div class="nm">%s</div><div class="s">%s</div></div></div>'
            '<div><img class="ic l" src="sprites/g-calendar.png" alt=""><div><span class="l">%s</span><span class="v" style="color:%s;text-shadow:0 0 10px %s">%s</span></div></div>'
            '<div><img class="ic l" src="sprites/g-amulet-coin.png" alt=""><div><span class="l">FUNDS</span><span class="v y">%s</span></div></div>'
            '<div><img class="ic l" src="sprites/g-fire-stone.png" alt=""><div><span class="l">HEAT</span><span class="v rd">%s</span></div></div>'
            '<div><img class="ic l" src="sprites/g-fame-checker.png" alt=""><div><span class="l">ROSTER</span><span class="v">%s</span></div></div>'
            '<div style="flex:1"><img class="ic l" src="sprites/g-town-map.png" alt=""><div><span class="l">REGION:</span><span class="v cy">KANTO</span></div></div>'
            '</div>') % (ec, ec, emb, nm, sub, day, wc, wc, when, funds, heat, roster)


TABS = [('g-card-key', 'HQ'), ('g-town-map', 'REGION MAP'), ('g-fame-checker', 'ROSTER'), ('g-ball', 'POKÉMON'), ('g-machine-part', 'OPERATIONS'), ('g-journal', 'LEDGER')]


def tabs(on=0):
    return '<div class="tabs">' + ''.join('<div%s><img class="ic" src="sprites/%s.png" alt="">%s<span class="k">%d</span></div>' % (
        ' class="on"' if i == on else '', ic, nm, i + 1) for i, (ic, nm) in enumerate(TABS)) + '</div>'


def fx(k, a):
    return ('<div class="haze" aria-hidden="true" style="--hz:%s;--hz2:%s"></div>'
            '<div class="grade" aria-hidden="true" style="--g1:%s;--g2:%s"></div>'
            '<div class="edgeglow" aria-hidden="true" style="--eg:%s"></div><div class="orn" aria-hidden="true"></div>'
            '<div class="sig4" aria-hidden="true"></div><div class="vl4" aria-hidden="true"></div>') % (k, a, k, a, k)


LESSONS = ['The setup', 'The top bar', 'Orders', 'First Steps', 'Tasks', 'The night', 'Mornings', 'The Card', 'Heat',
           'The map', 'The wheel', 'The Boss Menu', 'Bills', 'Rivals', 'The Founding']


def rail(n, top_px=82):
    """Lesson rail: which lesson this is, out of the fifteen."""
    dots = ''.join('<i class="%s"></i>' % ('d' if i < n - 1 else 'c' if i == n - 1 else '') for i in range(len(LESSONS)))
    return '<div class="tu-rail" style="top:%dpx"><img src="sprites/p-rotom.png" alt="">LESSON %d · %s<span class="dots">%s</span><span class="kc">X</span>stop tips</div>' % (
        top_px, n, LESSONS[n - 1].upper(), dots)


def spot(x, y, w, h, r=12, dim=True):
    return '<div class="tu-spot%s" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx;border-radius:%dpx"></div>' % ('' if dim else ' nodim', x, y, w, h, r)


def tip(x, y, w, text, lesson='', step='', key='Got it', more=''):
    ls = '<span class="ls">%s</span>' % lesson if lesson else ''
    st = '<span>%s</span>' % step if step else '<span></span>'
    mo = '<span class="kc">%s</span>' % more if more else ''
    return ('<div class="tu-tip" style="left:%dpx;top:%dpx;width:%dpx"><img class="rt" src="sprites/p-rotom.png" alt="Rotom">'
            '<span class="nm">ROTOM</span>%s<div>%s</div><div class="ft">%s<span>%s<span class="kc">Enter</span>%s</span></div></div>') % (
        x, y, w, ls, text, st, mo, key)


def arw(x, y, d='down'):
    return '<div class="tu-arw %s" style="left:%dpx;top:%dpx"></div>' % (d, x, y)


def num(n, x, y):
    return '<div class="tu-n" style="left:%dpx;top:%dpx">%s</div>' % (x, y, n)


def tbox(who, lines, more='▼', x=60, w=840, b=24, h=140):
    body = ''.join('<div>%s</div>' % l for l in lines)
    wh = '<span class="who">%s</span>' % who if who else ''
    return '<div class="tbox" style="left:%dpx;width:%dpx;bottom:%dpx;min-height:%dpx">%s%s<span class="more">%s</span></div>' % (
        x, w, b, h, wh, body, more)


def reward(x, y, w, head, items, key='Take it', note=''):
    rows = ''.join('<div class="it" style="--i:%d"><img src="sprites/%s.png" alt="">%s<b>%s</b></div>' % (i, ic, lb, amt) for i, (ic, lb, amt) in enumerate(items))
    nt = '<div class="nt">%s</div>' % note if note else ''
    return ('<div class="tu-rw" style="left:%dpx;top:%dpx;width:%dpx"><div class="rh">%s</div><div class="col" style="gap:8px">%s</div>%s'
            '<div class="cta shine" style="position:relative;margin:14px auto 0;width:max-content">%s <span class="kc">Enter</span></div></div>') % (
        x, y, w, head, rows, nt, key)


def after(x, y, text='Shown only after the text is closed'):
    return '<div class="tu-after" style="left:%dpx;top:%dpx">✓ %s</div>' % (x, y, text)


def letterbox(cap='', big=''):
    c = '<div class="tu-cap">%s<b>%s</b></div>' % (cap, big) if cap or big else ''
    return '<div class="tu-lb t"></div><div class="tu-lb b"></div>' + c


def keys(*ks):
    return '<div class="keys">' + ''.join('<span class="key">%s</span><span>%s</span>' % (k, t) for k, t in ks) + '</div>'


def fig(fid, title, desc, body, cls='kl-warm', bg=''):
    st = ' style="background:%s"' % bg if bg else ''
    return ('<figure id="%s"><div class="frame"><div class="st %s vign grain"%s>\n%s\n</div></div>\n'
            '<figcaption><b>%s</b><span>%s</span></figcaption></figure>\n') % (fid, cls, st, body, title, desc)


ROOK = '<div class="shd" style="left:396px;top:454px;width:150px;height:22px"></div><img class="spr bob" src="sprites/c-rook0.png" alt="Rook" style="left:404px;top:266px;width:126px;height:195px;z-index:4">'
WARE = ('<canvas class="cv" data-paint="warehouse" width="960" height="540"%s></canvas>'
        '<div class="rain" style="left:40px;top:192px;width:268px;height:176px;right:auto;bottom:auto;opacity:.9"></div>'
        '<div class="rain" style="left:304px;top:16px;width:376px;height:62px;right:auto;bottom:auto"></div>'
        '<div class="cone flick" style="left:330px;top:70px;width:300px;height:400px;z-index:2;--cc:rgba(255,214,140,.30)"></div>')
DIMLAYER = '<div class="a" style="inset:0;background:rgba(6,9,19,.55);z-index:4"></div>'
NIGHTSKY = '<canvas class="cv" data-paint="skyline" data-seed="5" data-tall="1.1" width="960" height="540"%s></canvas>'

# Day 1 HQ (round-4 screen s1), as the base the HQ lessons sit on.
HQ1 = frame('s1')
HQ1 = HQ1.replace('<div class="team"><div class="emb">M</div>', '<div class="team"><div class="emb" style="background:linear-gradient(180deg,#8a8f9e,#5a5f6e)">?</div>')
HQ1_NOBUB = re.sub(r'<div class="bub"[^\n]*</div>', '', HQ1)
HQ1_NOBUB = HQ1_NOBUB.replace('<div class="qmark" style="left:450px;top:150px">!</div>', '')


def hq(*over, base=None):
    return (base or HQ1_NOBUB) + '\n' + '\n'.join(over)


PAGES = []


def section(sid, title, note):
    PAGES.append('<div class="sect" id="%s"><h2>%s</h2><p class="tu-sn">%s</p></div>' % (sid, title, note))


def add(*a, **k):
    PAGES.append(fig(*a, **k))


# ================================================================ A · before the run
section('a', 'A · Before the run', 'The title, the help choice and a short cold open. Every line of text stays until a key is pressed.')

TITLE = frame('s0').replace('Team Nova · Kanto · Day 63', 'No Dominion yet')
add('a1', 'A1 · Title, first time',
    'The round-4 title card. On a profile that has never played Dominion, New run gets a gold FIRST TIME tag and a Rotom line under it, so a new player knows help is coming. Continue is greyed (no run yet).',
    TITLE + '\n<div class="tu-new" style="left:226px;top:316px">FIRST TIME</div>'
    + tip(352, 262, 320, 'First Dominion? I\'ll walk you through it. Press <b>Enter</b> on New run.', key='', step='') ,
    cls='kl-violet', bg='#12082a')

add('a2', 'A2 · How much help?',
    'After New run, one question before anything else. Rotom pops out of the Boss\'s phone and offers three levels: the full walkthrough (fifteen short lessons over the first week), tips only (one line the first time a screen opens), or no help. The answer is a Settings row (Dominion tab, "Tutorial") and can be changed or replayed later from the Boss Menu.',
    NIGHTSKY % ' style="filter:brightness(.55)"'
    + '<div class="layer" style="background:radial-gradient(circle at 480px 250px,rgba(255,138,61,.18),rgba(6,3,12,.8) 65%)"></div>'
    + '<div class="ttl" style="--t1:#5b34b0;--t2:#c9338f">NEW RUN<span class="sub">· before you start</span></div>'
    + keys(('Esc', 'back'), ('▲▼', 'choose'), ('Enter', 'pick'))
    + '<div class="tu-phone" style="left:92px;top:118px"><img class="spr float" src="sprites/p-rotom.png" alt="Rotom" style="left:22px;top:30px;width:150px;height:150px"><div class="scr">BZZT!<br>BOSS-PHONE<br>ONLINE</div></div>'
    + '<div class="bub" style="left:66px;top:356px;width:260px;font-size:16px">Rotom: “New in the business? Don\'t worry. Everyone starts with a leaky roof.”</div>'
    + '<div class="a col" style="left:380px;top:110px;width:540px;gap:14px;z-index:10">'
    + '<div class="ch on" style="--stripe:#ff8a3d;font-size:20px;padding:14px 16px 14px 26px"><span class="brk"></span>Show me the ropes<span class="pill" style="--c:#c25a1a;margin-left:10px">RECOMMENDED</span><span class="xs" style="display:block;font-weight:500;margin-top:4px">Fifteen short lessons across your first week. Rotom points, you press.</span><span class="kc" style="position:absolute;right:12px;top:14px">1</span></div>'
    + '<div class="ch" style="--stripe:#a678ff;font-size:19px;padding:14px 16px 14px 26px">Just give me tips<span class="xs mu" style="display:block;font-weight:500;margin-top:4px">One line the first time each screen opens. Nothing blocks you.</span><span class="kc" style="position:absolute;right:12px;top:14px">2</span></div>'
    + '<div class="ch" style="--stripe:#5a6488;font-size:19px;padding:14px 16px 14px 26px">I know what I\'m doing<span class="xs mu" style="display:block;font-weight:500;margin-top:4px">No help. You can turn tips on later in Settings.</span><span class="kc" style="position:absolute;right:12px;top:14px">3</span></div>'
    + '</div>'
    + '<div class="a xs mu" style="left:380px;top:448px;width:540px;z-index:10">Change it any time: Boss Menu › Settings › Dominion › Tutorial. Replay any lesson from the Boss Menu.</div>'
    + fx('#ffb38a', '#c9338f'), cls='kl-violet', bg='#0b0618')

add('a3', 'A3 · Cold open 1: Pewter at night',
    'A short cold open before the setup, in the New-look event screen with cinema bars. Rain over Pewter, one dark warehouse lit by a single window. The narrator text stays until a key is pressed (▼ means more text). Esc skips the whole cold open.',
    NIGHTSKY % ' style="filter:brightness(.7) saturate(.8)"'
    + '<div class="rain" style="left:0;top:0;width:960px;height:540px;right:auto;bottom:auto;opacity:.8"></div>'
    + '<div class="a" style="left:560px;top:250px;width:250px;height:150px;background:linear-gradient(180deg,#1a1430,#0c0818);box-shadow:0 0 0 3px #060913;clip-path:polygon(0 30%,50% 0,100% 30%,100% 100%,0 100%);z-index:3"></div>'
    + '<div class="a blink" style="left:664px;top:330px;width:22px;height:18px;background:#ffd36b;box-shadow:0 0 18px #ffd36b;z-index:4"></div>'
    + letterbox('PEWTER CITY · KANTO', '2:14 AM')
    + '<div class="a" style="right:24px;top:20px;z-index:37;font:600 14px var(--ui);color:#cfd6f2"><span class="kc">Esc</span> skip the opening</div>'
    + tbox('', ['Every Team you\'ve heard of started somewhere small.', 'Team Rocket started in a basement in Celadon.'], b=80, h=110)
    + fx('#9fc4ff', '#b48cff'), cls='kl-cold', bg='#070a1c')

add('a4', 'A4 · Cold open 2: the paper',
    'The second beat: the morning paper on a wet crate. "The Kanto Ledger" (the same paper as round 4\'s morning paper) leads with Giovanni and Team Rocket, the canon team that already owns this region. It tells the player who the big fish is before they even pick a name.',
    WARE % ' style="filter:brightness(.4) saturate(.7) blur(2px)"'
    + '<div class="paper" style="left:250px;top:72px;width:460px;height:300px;padding:12px 20px">'
    + '<div style="font:700 40px/1 Cinzel,serif;text-align:center;border-bottom:3px double #231a10;padding-bottom:6px">The Kanto Ledger</div>'
    + '<div class="row sp xs" style="margin:4px 0 10px;font-family:serif">Celadon edition<span>Rain, then more rain</span><span>₽2</span></div>'
    + '<div style="font:700 26px/1.1 serif">ROCKET TIGHTENS GRIP ON CELADON</div>'
    + '<div class="row" style="gap:14px;margin-top:10px;align-items:flex-start"><div style="flex:none;width:120px;height:140px;background:#cfc29f;box-shadow:inset 0 0 0 2px #231a10;position:relative;overflow:hidden;filter:grayscale(1) contrast(1.2)"><img class="spr" src="sprites/t-giovanni.png" alt="Giovanni" style="left:-6px;top:4px;width:132px;height:170px"></div>'
    + '<div style="font:15px/1.35 serif">Police say Giovanni\'s people now run every game corner west of the river. "Nobody else would dare," says one shopkeeper. <i>Below the fold:</i> a warehouse in Pewter has finally found a tenant.</div></div></div>'
    + letterbox()
    + tbox('', ['Nobody in Kanto has heard of you.', 'That\'s about to change.'], b=80, h=96)
    + fx('#ffd9a0', '#9fc4ff'), cls='kl-warm', bg='#120a05')

add('a5', 'A5 · Cold open 3: the key',
    'The last beat: a key, a lease and ₽1,000 on a crate. The text stays up; the ▼ waits for Enter. The reward is NOT shown yet: it waits for the next page, after the text is closed.',
    WARE % ' style="filter:brightness(.55) saturate(.8)"'
    + '<div class="a" style="left:330px;top:300px;width:300px;height:90px;background:linear-gradient(180deg,#6a4a2a,#3a2614);box-shadow:0 0 0 3px #060913;z-index:4"></div>'
    + '<img class="spr" src="sprites/g-storage-key.png" alt="" style="left:420px;top:262px;width:48px;height:48px;z-index:5">'
    + '<img class="spr" src="sprites/g-letter.png" alt="" style="left:490px;top:266px;width:44px;height:44px;z-index:5;transform:rotate(12deg)">'
    + '<div class="a flick" style="left:330px;top:150px;width:300px;height:300px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,214,140,.22),transparent);mix-blend-mode:screen;z-index:3"></div>'
    + letterbox()
    + tbox('', ['One thousand Pokédollars. A key. A lease on a building nobody else wanted.', 'It\'s not much. Every empire is not much, at first.'], more='▼', b=80, h=110)
    + fx('#ffd9a0', '#ff8a3d'), cls='kl-warm', bg='#120a05')

add('a6', 'A6 · Reward, after the text',
    'Only after the A5 text is closed does the reward card rise, with gold rays. It stays until Enter. Then the setup starts (B1). This is the pattern for every reward in the tutorial: text first, then the reward, then a key to go on.',
    WARE % ' style="filter:brightness(.35) saturate(.6) blur(2px)"'
    + '<div class="rays4" style="z-index:30"></div>'
    + reward(300, 110, 360, 'YOU GOT', [('g-storage-key', 'The Warehouse key', 'Key Item'), ('g-letter', 'A lease (HQ Lv. 1)', 'Pewter'), ('g-amulet-coin', 'Starting money', '₽1,000')],
             key='Begin', note='Next: pick your Boss, your two Team Types and your first member.')
    + after(334, 74)
    + fx('#ffd23f', '#ff8a3d'), cls='kl-gold', bg='#1a0e05')

# ================================================================ B · the setup, with tips
section('b', 'B · The setup, with Rotom', 'The three built setup pages (D1) with one Rotom tip each. Lesson 1 of 15. Tips sit beside the panels and never cover what the player has to pick.')


def setup_head(i, name):
    return ('<div class="ttl" style="--t1:#5b34b0;--t2:#c9338f">NEW RUN<span class="sub">· %s · %d of 3</span></div>' % (name, i)
            + keys(('Esc', 'back'), ('Enter', 'next')))


SETUP_BG = (WARE % '') + DIMLAYER

add('b1', 'B1 · The Boss (lesson 1, step 1 of 3)',
    'The built Boss page: your trainer and the three Pokémon from the starter quiz. Rotom\'s tip explains the one rule that matters here: the Boss fights their own battles and has no type rule. The Charters chip (C) shows its lock line so new players know it opens later.',
    SETUP_BG + setup_head(1, 'THE BOSS')
    + '<div class="pnl glass" style="left:40px;top:96px;width:420px;height:330px"><div class="hd y"><img class="ic" src="sprites/g-member-card.png" alt="">THE BOSS</div>'
    + '<div class="row" style="justify-content:center;height:200px;align-items:flex-end"><img class="px" src="sprites/t-red.png" alt="Red" style="height:190px"></div>'
    + '<div class="col" style="gap:4px;margin-top:8px"><b style="font-size:24px">RED</b><span class="mu sm">You. You fight your own battles. The Boss never wears the uniform.</span></div></div>'
    + '<div class="pnl glass" style="left:490px;top:96px;width:430px;height:200px"><div class="hd"><img class="ic" src="sprites/g-ball.png" alt="">YOUR THREE POKÉMON</div>'
    + '<div class="row" style="justify-content:space-around"><div class="col" style="align-items:center"><img class="px" src="sprites/p-houndour.png" alt="" style="height:80px"><b>Houndour</b><span class="mu sm">Lv 6</span></div><div class="col" style="align-items:center"><img class="px" src="sprites/p-grimer.png" alt="" style="height:80px"><b>Grimer</b><span class="mu sm">Lv 6</span></div><div class="col" style="align-items:center"><img class="px" src="sprites/p-murkrow.png" alt="" style="height:80px"><b>Murkrow</b><span class="mu sm">Lv 6</span></div></div></div>'
    + '<div class="a row" style="left:40px;top:440px;z-index:9;gap:8px;font:600 14px var(--ui);color:#9aa3c4"><span class="kc">C</span>🔒 Charters open after your first finished Dominion</div>'
    + tip(520, 302, 400, 'This is <b>you</b>. You fight your own battles, with <b>any</b> Pokémon. Your crew has rules. You\'ll see.', lesson='Lesson 1 · The setup', step='1 of 3')
    + rail(1, 60)
    + '<div class="cta shine" style="right:40px;bottom:30px">Next ▶ <span class="kc">Enter</span></div>', cls='kl-warm')

TYPES = ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dark', 'steel', 'dragon', 'fairy']
TC = {'normal': '#a8a878', 'fire': '#f08030', 'water': '#6890f0', 'grass': '#78c850', 'electric': '#f8d030', 'ice': '#98d8d8', 'fighting': '#c03028', 'poison': '#a040a0', 'ground': '#e0c068',
      'flying': '#a890f0', 'psychic': '#f85888', 'bug': '#a8b820', 'rock': '#b8a038', 'ghost': '#705898', 'dark': '#705848', 'steel': '#b8b8d0', 'dragon': '#7038f8', 'fairy': '#ee99ac'}


def tchip(t):
    return '<span class="type" style="--c:%s">%s</span>' % (TC[t], t.upper())


def tgrid(picked, sel):
    cells = []
    for i, t in enumerate(TYPES):
        ban = t in ('dragon', 'fairy')
        stl = ('box-shadow:0 0 0 3px #ffd23f,0 0 14px rgba(255,210,63,.5);' if t == sel else '') + ('background:rgba(255,210,63,.18);' if t in picked else '') + ('opacity:.4;filter:grayscale(.8);' if ban else '')
        cells.append('<div class="row" style="justify-content:center;padding:6px;border-radius:8px;%s">%s</div>' % (stl, tchip(t)))
    return '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">%s</div>' % ''.join(cells)


add('b2', 'B2 · The Colours of the Team (lesson 1, step 2 of 3)',
    'The built type page with Poison and Dark picked. The spotlight sits on the rule panel, and Rotom says it in one line: every Grunt\'s Pokémon needs one of these two types. The canon examples (Rocket ran Poison and Normal...) stay in the panel.',
    SETUP_BG + setup_head(2, 'THE COLOURS OF THE TEAM')
    + '<div class="pnl glass" style="left:40px;top:96px;width:560px;height:380px"><div class="hd y"><img class="ic" src="sprites/g-star-piece.png" alt="">PICK TWO TEAM TYPES<span class="r">2 of 2</span></div>' + tgrid(['poison', 'dark'], 'dark') + '</div>'
    + '<div class="pnl glass" style="left:620px;top:96px;width:300px;height:250px"><div class="hd"><img class="ic" src="sprites/g-letter.png" alt="">THE RULE</div><div class="col sm" style="gap:8px;line-height:1.35">'
    + '<div>Every Grunt\'s Pokémon must have one of your two types. Admins and Executives get one Ace of any type. The Boss has no rule.</div><div class="row" style="gap:6px">' + tchip('poison') + tchip('dark') + '</div>'
    + '<div class="mu xs" style="line-height:1.4">Rocket ran Poison and Normal.<br>Magma ran Fire and Ground.<br>Aqua ran Water and Dark.</div></div></div>'
    + spot(612, 88, 316, 266)
    + tip(70, 400, 500, 'Pick <b>two</b>. Every Grunt\'s Pokémon needs one of them. Dragon and Fairy are too proud for a uniform.', lesson='Lesson 1 · The setup', step='2 of 3')
    + rail(1, 60)
    + '<div class="cta shine" style="right:40px;bottom:30px;z-index:41">Next ▶ <span class="kc">Enter</span></div>', cls='kl-warm')

add('b2x', 'B2b · Pressing Enter with one type',
    'The failure case gets a short, friendly answer instead of a silent block. The built red problem line stays, and Rotom adds a nudge pointing at the empty slot. Nothing is lost; the cursor stays where it was.',
    SETUP_BG + setup_head(2, 'THE COLOURS OF THE TEAM')
    + '<div class="pnl glass" style="left:40px;top:96px;width:560px;height:380px"><div class="hd y"><img class="ic" src="sprites/g-star-piece.png" alt="">PICK TWO TEAM TYPES<span class="r rd">1 of 2</span></div>' + tgrid(['poison'], 'poison') + '</div>'
    + '<div class="pnl glass" style="left:620px;top:96px;width:300px;height:250px"><div class="hd"><img class="ic" src="sprites/g-letter.png" alt="">THE RULE</div><div class="col sm" style="gap:8px;line-height:1.35">'
    + '<div class="row" style="gap:6px">' + tchip('poison') + '<span class="tu-slot">?</span></div><div class="rd b7">Pick two Team Types.</div></div></div>'
    + arw(748, 128, 'down')
    + tip(600, 372, 330, 'One more! Two types means more Pokémon your crew can use.', lesson='Lesson 1 · The setup', step='2 of 3', key='OK')
    + '<div class="cta shine" style="right:40px;bottom:30px;filter:saturate(.4) brightness(.8)">Next ▶ <span class="kc">Enter</span></div>', cls='kl-warm')


def member_card(grunt, on):
    if grunt:
        pic, hd, r, facts, pitch = '<img class="px" src="sprites/c-rook0.png" alt="" style="width:84px;height:130px">', 'A GRUNT', 'Rook', ['Male, the Grunt picture', 'Every skill POOR, 2 trait points', 'A Lv 5 Pokémon of a Team Type', 'Wage ₽80 a week, high Loyalty'], 'A Grunt is cheap and loyal and useless.'
    else:
        pic, hd, r, facts, pitch = '<img class="px" src="sprites/t-acetrainer-m.png" alt="" style="height:130px;image-rendering:pixelated">', 'AN ADMIN', 'Corbin · Ace Trainer', ['Any gender, a trainer-class picture', 'Capable, 4 trait points', 'A Lv 7 Pokémon of a Team Type', 'Wage ₽160 a week (double), low Loyalty'], 'An Admin is capable and expensive and might not stay.'
    return ('<div class="pnl %s" style="left:%dpx;top:96px;width:430px;height:310px">%s<div class="hd %s">%s<span class="r">%s</span></div>'
            '<div class="row" style="gap:14px;align-items:flex-end"><div style="width:120px;height:140px;display:flex;align-items:flex-end;justify-content:center">%s</div><div class="col sm" style="gap:4px;line-height:1.3">%s</div></div>'
            '<div style="margin-top:12px;font-style:italic;color:#efe6ff">“%s”</div></div>') % (
        'gild' if on else 'glass dim', 40 if grunt else 490, '<span class="brk"></span>' if on else '', 'y' if on else '', hd, r, pic, ''.join('<div>· %s</div>' % f for f in facts), pitch)


add('b3', 'B3 · The First Member (lesson 1, step 3 of 3)',
    'The built Grunt-or-Admin page. Rotom\'s tip compares them in plain words and recommends the Grunt for a first run (cheap, loyal, the tutorial is written around Rook). The Admin card uses an existing trainer-class picture, never an invented character. Grunts are male (Rook).',
    SETUP_BG + setup_head(3, 'THE FIRST MEMBER')
    + member_card(True, True) + member_card(False, False)
    + tip(200, 420, 480, 'First run? Take <b>Rook</b>. Cheap and loyal. An Admin costs double and might walk out.', lesson='Lesson 1 · The setup', step='3 of 3')
    + rail(1, 60)
    + '<div class="cta shine" style="right:40px;bottom:30px">Begin ▶ <span class="kc">Enter</span></div>', cls='kl-warm')

# ================================================================ C · the first evening
section('c', 'C · The first evening', 'The built opening scene, then the HQ on Day 1 evening with lessons 2 to 6 laid over it.')

add('c1', 'C1 · The opening scene, line 1',
    'The built opening scene (D1 text, New-look event screen) over the leaking warehouse. Lines appear one at a time and stay until Enter. ▼ means more text is coming.',
    WARE % '' + ROOK
    + tbox('THE WAREHOUSE', ['The warehouse smells like wet cardboard and Grimer. Rain comes through the roof in three places. Your one Grunt is trying to catch the drips in a Poké Ball, which doesn\'t work.'])
    + fx('#ffd9a0', '#7fb0ff'), cls='kl-warm')

add('c2', 'C2 · The opening scene, the joke',
    'The last lines of the built scene. Rook gets a speech bubble beside him as well as the text box, so the first member talks from the first minute. The arrow turns into "Enter ▶" on the last line.',
    WARE % '' + ROOK
    + '<div class="bub" style="left:540px;top:200px;width:190px;font-size:15px">“...That\'s what I was thinking about.”</div>'
    + tbox('THE WAREHOUSE', ['“Boss,” he says. “Boss, I\'ve been thinking about the plan.”', '“What plan?”', '“...That\'s what I was thinking about.”'], more='Enter ▶')
    + fx('#ffd9a0', '#7fb0ff'), cls='kl-warm')

add('c3', 'C3 · Starting kit, after the text',
    'After the opening text is closed, the starting kit appears as a reward card: 3 Poké Balls, 2 Potions and the crowbar (the Key Item that unlocks "Break in"). Rook is shown with his grey blank armband. Enter takes it and the HQ opens.',
    WARE % ' style="filter:brightness(.5) saturate(.7)"' + ROOK
    + '<div class="rays4" style="z-index:30"></div>'
    + reward(560, 96, 360, 'STARTING KIT', [('g-ball', 'Poké Ball', '×3'), ('g-max-potion', 'Potion', '×2'), ('g-machine-part', 'Crowbar · Key Item', 'Break in')], key='Take it', note='Rook: “Is the crowbar for me? ...It\'s for you. OK.”')
    + after(594, 60)
    + fx('#ffd23f', '#ff8a3d'), cls='kl-gold')

add('c4', 'C4 · Rotom boots up',
    'First look at the HQ. The whole screen dims and Rotom flies in from the phone corner with the welcome. This is the only lesson page that covers the screen; every later tip points at one thing.',
    hq('<div class="layer" style="background:rgba(5,3,14,.74);z-index:40"></div>',
       '<img class="spr float" src="sprites/p-rotom.png" alt="Rotom" style="left:150px;top:120px;width:190px;height:190px;z-index:46;filter:drop-shadow(0 0 22px rgba(255,150,80,.85))">',
       '<div class="tu-zap" style="left:120px;top:100px"></div>',
       tip(360, 150, 460, 'Bzzt! Welcome to Dominion, Boss. You run a crew from nothing. Each day you give orders, the city reacts, and slowly it all becomes yours. I\'ll show you one thing at a time.', lesson='Welcome', step='15 lessons · about 10 minutes', key='Let\'s go', more='X'),
       '<div class="a" style="left:360px;top:330px;z-index:46;font:600 14px var(--ui);color:#ffd9bf"><span class="kc">X</span> stop tips any time · Boss Menu › Replay a lesson</div>'),
    cls='kl-warm')

add('c5', 'C5 · Lesson 2: the top bar',
    'The spotlight cuts out the top bar and everything else dims. Five numbered marks name each cell, and Rotom explains them in one list. Enter goes to the next lesson.',
    hq(spot(4, 2, 952, 74, 10),
       num(1, 345, 64), num(2, 495, 64), num(3, 630, 64), num(4, 750, 64), num(5, 880, 64),
       rail(2, 470),
       tip(180, 150, 600, '<div class="tu-list"><div><i>1</i>The day and its phase. Four phases: Morning, Day, Evening, Night.</div><div><i>2</i>Funds. Rent and wages come out every 7 days.</div><div><i>3</i><b>Heat.</b> How hard the police are looking. Keep it low.</div><div><i>4</i>Roster. The Warehouse sleeps 3.</div><div><i>5</i>The region. One at a time.</div></div>', lesson='Lesson 2 · The top bar', step='1 of 1')),
    cls='kl-warm')

add('c6', 'C6 · Lesson 3: plan tomorrow\'s orders',
    'Evening is for planning. The spotlight is on Today\'s Orders; an arrow points at Scout the block. Rotom says: Enter marks an order for tomorrow, and tomorrow you have 3 actions. A gold PLANNED tag shows on each marked order.',
    hq(spot(4, 80, 302, 170),
       '<div class="a" style="left:236px;top:146px;z-index:42"><span class="pill" style="--c:#c9900c">PLANNED</span></div>',
       arw(314, 110, 'left'),
       rail(3, 470),
       tip(350, 110, 400, 'These are your first <b>orders</b>. In the evening you plan; tomorrow, you do. Press <b>Enter</b> to plan one. You get <b>3 actions</b> a day.', lesson='Lesson 3 · Orders', step='1 of 2', key='Plan it')),
    cls='kl-warm')

add('c7', 'C7 · Lesson 3: two planned, one to go',
    'The same panel after two presses: Scout the block and Find a recruit are PLANNED. Rotom tells the player that Secure the warehouse costs ₽40, so they learn costs show before they commit. This is the only tip that waits for a real input (it moves on when 3 orders are planned or the player presses Enter twice).',
    hq(spot(4, 80, 302, 170),
       '<div class="a" style="left:226px;top:112px;z-index:42"><span class="pill" style="--c:#c9900c">PLANNED</span></div><div class="a" style="left:236px;top:182px;z-index:42"><span class="pill" style="--c:#c9900c">PLANNED</span></div><div class="a" style="left:248px;top:216px;z-index:42"><span class="pill" style="--c:#7a2030">−₽40</span></div>',
       rail(3, 470),
       tip(350, 110, 400, 'Nice. <b>Secure the warehouse</b> costs ₽40. Every order shows its cost <b>before</b> you commit. Plan it or leave it, your call.', lesson='Lesson 3 · Orders', step='2 of 2', key='Done')),
    cls='kl-warm')

add('c8', 'C8 · Lesson 4: First Steps',
    'The spotlight moves to the First Steps panel. Rotom explains that these two small goals pay ₽100 each and vanish after the first week. A small "+₽100" sits next to each row.',
    hq(spot(646, 352, 310, 124),
       '<div class="a col" style="left:880px;top:396px;gap:12px;z-index:42"><span class="pill" style="--c:#c9900c">+₽100</span><span class="pill" style="--c:#c9900c">+₽100</span></div>',
       rail(4, 104),
       tip(300, 300, 330, 'Two easy goals for your first week. Each pays <b>₽100</b>. After 7 days they\'re gone, and nobody holds your hand again.', lesson='Lesson 4 · First Steps', step='1 of 1')),
    cls='kl-warm')

add('c9', 'C9 · Lesson 5: give Rook a task',
    'The spotlight is on Rook\'s card. Rotom says crew members do tasks while the Boss does orders, and suggests "Guard the warehouse" for tonight. Enter opens the Assign page (next).',
    hq(spot(646, 80, 310, 270),
       arw(600, 200, 'right'),
       rail(5, 470),
       tip(150, 210, 430, 'Rook is your crew. <b>You</b> do orders; <b>crew</b> do tasks. Rook is POOR at everything, so start simple: press <b>Enter</b> on his card and pick <b>Guard the warehouse</b>.', lesson='Lesson 5 · Tasks', step='1 of 1', key='Assign')),
    cls='kl-warm')

ASSIGN = ('<div class="ttl" style="--t1:#5b34b0;--t2:#c9338f">ASSIGN<span class="sub">· Rook · tonight</span></div>' + keys(('Esc', 'back'), ('▲▼', 'task'), ('Enter', 'give the order'))
          + '<img class="spr" src="sprites/c-rook0.png" alt="Rook" style="left:40px;top:120px;width:150px;height:232px;z-index:6">'
          + '<div class="bub" style="left:40px;top:370px;width:220px;font-size:15px">Rook: “Guard it? From who? ...Right. From everyone.”</div>')


def task(label, odds, sub, on=False, fit=False):
    return ('<div class="ch%s" style="font-size:18px;padding:10px 14px 10px 24px">%s%s<span class="xs%s" style="display:block;font-weight:500">%s</span><b style="position:absolute;right:14px;top:12px;font-size:22px" class="%s">%s</b></div>') % (
        ' on' if on else '', '<span class="brk"></span>' if on else '', label + (' <span class="pill" style="--c:#1f8a49">BEST FIT</span>' if fit else ''), '' if on else ' mu', sub, 'y' if on else 'mu', odds)


add('c10', 'C10 · Assign: Guard the warehouse',
    'The Assign page (round-4 m3) with only Rook\'s three starting tasks, so it is not crowded on Day 1. Guard is tagged Best fit. Rotom\'s tip sits under the list and explains the odds number in one line.',
    WARE % ' style="filter:brightness(.35) blur(2px)"' + ASSIGN
    + '<div class="a col" style="left:300px;top:100px;width:620px;gap:10px;z-index:10">'
    + task('Guard the warehouse', '90%', 'Free · nobody breaks in · Rook stays home', True, True)
    + task('Odd jobs', '75%', '+₽50 · Heat +0 · back by morning')
    + task('Train', '100%', 'Rook learns a little · no pay') + '</div>'
    + spot(292, 92, 636, 76)
    + tip(300, 330, 470, 'The big number is the <b>chance it works</b>. Guard is safe for Rook. Better crew, harder tasks, bigger money.', lesson='Lesson 5 · Tasks', step='1 of 1', key='Give the order')
    + fx('#c9a0ff', '#ff4d63'), cls='kl-violet', bg='#0b0618')

add('c11', 'C11 · Lesson 6: the night',
    'At Night the Boss picks: Rest (full health, +1 action tomorrow) or one Night action (riskier, better pay). A big four-phase dial shows where the day is. On Day 1 Rotom recommends Rest; Night actions unlock later in the tutorial.',
    NIGHTSKY % ' style="filter:brightness(.6)"' + top(when='NIGHT', wc='#6fa8ff')
    + '<div class="tu-dial" style="left:70px;top:120px"><i style="--a:0deg;--c:#ffd23f">MORNING</i><i style="--a:90deg;--c:#ffffff">DAY</i><i style="--a:180deg;--c:#b48cff">EVENING</i><i class="on" style="--a:270deg;--c:#6fa8ff">NIGHT</i><b>DAY 01</b></div>'
    + '<div class="a col" style="left:420px;top:120px;width:500px;gap:14px;z-index:10">'
    + '<div class="ch on" style="--stripe:#6fa8ff;font-size:20px;padding:14px 16px 14px 26px"><span class="brk"></span>Rest<span class="xs" style="display:block;font-weight:500">Pokémon healed · +1 action tomorrow · Heat cools 3</span></div>'
    + '<div class="ch" style="--stripe:#ff4d63;font-size:19px;padding:14px 16px 14px 26px;opacity:.55">Night action 🔒<span class="xs mu" style="display:block;font-weight:500">Opens on Day 2. Pays more, more Heat.</span></div></div>'
    + rail(6, 470)
    + tip(420, 320, 500, 'Every night: <b>rest</b> or <b>work</b>. Skip rest three nights in a row and you\'re <b>exhausted</b>. Tonight, rest.', lesson='Lesson 6 · The night', step='1 of 1', key='Rest')
    + fx('#6fa8ff', '#b48cff'), cls='kl-cold', bg='#070a1c')

# ================================================================ D · the first week
section('d', 'D · The first week', 'Day 2 to Day 7, with lessons 7 to 14. Each lesson shows once, the first time its screen or moment comes up.')

MORN = WARE % ' style="filter:brightness(.9) saturate(1.1) hue-rotate(-10deg)"'
add('d1', 'D1 · Lesson 7: the first morning report',
    'The World Turn ran overnight. The Morning report opens with what happened (D1 sample week, Day 2). The text stays until Enter. Rotom\'s tip is above the box, not inside it, so the report reads first.',
    MORN + top(day='DAY 02', when='MORNING', wc='#ffd23f')
    + '<div class="shd" style="left:396px;top:400px;width:150px;height:22px"></div><img class="spr" src="sprites/c-rook0.png" alt="Rook" style="left:404px;top:212px;width:126px;height:195px;z-index:4">'
    + '<img class="spr bob" src="sprites/p-rattata.png" alt="Rattata" style="left:560px;top:360px;width:56px;height:48px;z-index:5">'
    + '<div class="qmark" style="left:576px;top:310px">!</div>'
    + rail(7, 84)
    + tip(560, 140, 360, 'Every morning I tell you what happened overnight. Read it, then press Enter.', lesson='Lesson 7 · Mornings', step='1 of 2', key='')
    + tbox('MORNING REPORT', ['Rook guarded the warehouse. Nobody came.', 'Then Rook dropped a Poké Ball, and a Rattata ran into it. It\'s yours now.'])
    + fx('#ffd23f', '#ff8a3d'), cls='kl-warm')

add('d2', 'D2 · Rattata, after the text',
    'After the report closes, the reward card: Rattata, Lv 4. It is Normal type, not Poison or Dark, so it goes to the Reserve (Kice\'s rule: off-type catches go to the Reserve). Rotom uses it to teach Team Types for real.',
    MORN + top(day='DAY 02', when='MORNING', wc='#ffd23f')
    + '<div class="rays4" style="z-index:30"></div>'
    + '<div class="tu-rw" style="left:300px;top:150px;width:360px"><div class="rh">NEW POKÉMON</div><div class="row" style="justify-content:center"><img class="px" src="sprites/p-rattata.png" alt="" style="height:110px"></div>'
    + '<div class="row" style="justify-content:center;gap:8px;margin-top:6px"><b style="font-size:22px">RATTATA</b><span class="mu">Lv 4</span>' + tchip('normal') + '</div>'
    + '<div class="it" style="margin-top:10px"><img src="sprites/g-ball.png" alt="">Sent to <b style="margin-left:4px;color:#ffd23f">the Reserve</b></div>'
    + '<div class="cta shine" style="position:relative;margin:14px auto 0;width:max-content">OK <span class="kc">Enter</span></div></div>'
    + after(360, 110)
    + rail(7, 470)
    + tip(680, 230, 260, 'Normal isn\'t one of your types, so Rook can\'t use it. It waits in the <b>Reserve</b>. The Boss can use anything.', lesson='Lesson 7 · Mornings', step='2 of 2')
    + fx('#ffd23f', '#ff8a3d'), cls='kl-gold')

# The Card, from round-4 s4, for the first real field action.
CARD = frame('s4')
CARD = swap(CARD,
            ('Extort <span class="sub">· Cerulean Bike Shop</span>', 'Extort <span class="sub">· the cousin stand, Pewter</span>'),
            ('Action 2 of 3', 'Action 1 of 4'),
            ('Pays <b>₽300–550</b>, then <b>₽120/wk</b>', 'Pays <b>₽150–250</b>'),
            ('conic-gradient(#f5c927 0 64%', 'conic-gradient(#f5c927 0 71%'),
            ('>64%</div>', '>71%</div>'),
            ('<span>Boss Nerve 4</span><b style="color:#1f8a49">+32</b>', '<span>Boss Nerve 3</span><b style="color:#1f8a49">+24</b>'),
            ('Rosa brought along</span><b style="color:#1f8a49">+12</b>', 'Houndour along</span><b style="color:#1f8a49">+10</b>'),
            ('src="sprites/c-rosa.png" alt="" style="width:22px', 'src="sprites/p-houndour.png" alt="" style="width:22px'),
            ('<span>Scouted yesterday</span><b style="color:#1f8a49">+15</b>', '<span>Easy target</span><b style="color:#1f8a49">+46</b>'),
            ('<span>Heat in Cerulean</span><b style="color:#c0392b">−9</b>', '<span>Heat in Pewter</span><b style="color:#c0392b">−3</b>'),
            ('Owner is “Stubborn”', 'Nobody knows you'),
            ('<b>Total</b><b>64%</b>', '<b>Total</b><b>71%</b>'),
            ('Heat <b style="color:#c0392b">+5</b> here', 'Heat <b style="color:#c0392b">+3</b> here'),
            ('Mr. Bicycle. He\'ll pay. He\'ll remember.', 'The Mart clerk\'s cousin. He\'ll pay. He\'ll tell his cousin.'),
            ('Officer Jenny at noon. Red is in town.', 'Officer Jenny walks past at noon.'),
            ('<b style="color:#b23a2e">Battle? 40%</b><br>His nephew\'s Machop, Lv 18.', '<b style="color:#b23a2e">Battle? 20%</b><br>His Machop, Lv 6.'),
            ('SUCCESS 64%', 'SUCCESS 71%'),
            ('flex:64;', 'flex:71;'),
            ('<b style="color:#1f8a49">Win:</b> ₽300–550, Dread +3, the shop pays weekly', '<b style="color:#1f8a49">Win:</b> ₽150–250, Dread +2'),
            ('Heat +12, maybe a fight', 'Heat +8, maybe a fight'),
            ('>N</div>', '>?</div>'))
CARD = CARD.replace('flex:36', 'flex:29')
add('d3', 'D3 · Lesson 8: the Card',
    'The round-4 Card before every action, for the first real field action (Day 2: extort the cousin stand in Pewter, from the design\'s sample week). Three numbered marks: the odds, how they are made, and what it risks. Rotom\'s tip sits in the free space at the bottom left.',
    CARD + num(1, 140, 120) + num(2, 310, 120) + num(3, 640, 120)
    + tip(16, 444, 560, '<i class="tu-in">1</i>The odds. <i class="tu-in">2</i>Why. <i class="tu-in">3</i>Who gets hurt, who might see.', lesson='Lesson 8 · The Card', step='1 of 1'),
    cls='kl-cold', bg='#7cc4f0')

add('d4', 'D4 · The first job done',
    'The round-4 Job done page, Day 1 sized: +₽210, Heat 5 → 8, and the First Step "Earn your first ₽500" moving to ₽210 of ₽500. No tip here: the result speaks for itself, Rotom only adds one bubble.',
    WARE % ' style="filter:brightness(.4) saturate(.7)"' + top(day='DAY 02', when='DAY · 1 OF 4', wc='#fff', funds='₽1,210', heat='8%')
    + '<div class="rays4"></div>'
    + '<img class="spr" src="sprites/t-red.png" alt="Red" style="left:96px;top:170px;width:110px;height:186px;z-index:6">'
    + '<img class="spr" src="sprites/p-houndour.png" alt="Houndour" style="left:200px;top:290px;width:80px;height:70px;z-index:6">'
    + '<div class="shd" style="left:80px;top:350px;width:240px;height:26px"></div>'
    + '<div class="bigstamp" style="left:34px;top:104px;color:#ffd23f;font-size:36px">PAID</div>'
    + '<div class="loot" style="left:96px;top:390px">+₽210</div>'
    + '<div class="pnl gild" style="left:428px;top:92px;width:516px;height:250px"><div class="hd y"><img class="ic" src="sprites/g-relic-gold.png" alt="">Extort · the cousin stand<span class="r" style="color:#43cf78">rolled 22 under 71</span></div>'
    + '<div class="col" style="gap:7px;margin-top:10px">'
    + '<div class="chg y"><img class="ic" src="sprites/g-amulet-coin.png" alt="">Funds<span style="margin-left:auto">₽1,000 → ₽1,210</span><b>+₽210</b></div>'
    + '<div class="chg dn"><img class="ic" src="sprites/g-fire-stone.png" alt="">Heat in Pewter<span style="margin-left:auto">5 → 8</span><b>+3</b></div>'
    + '<div class="chg up"><img class="ic" src="sprites/g-dark-gem.png" alt="">Dread<span style="margin-left:auto">0 → 2</span><b>+2</b></div>'
    + '<div class="chg y"><img class="ic" src="sprites/g-star-piece.png" alt="">First Step · Earn ₽500<span style="margin-left:auto">₽210 of ₽500</span><b>42%</b></div></div></div>'
    + '<div class="bub" style="left:430px;top:356px;width:300px;font-size:15px">Rotom: “Bzzt! First money. Don\'t spend it on a roof yet.”</div>'
    + '<div class="cta shine" style="left:694px;top:448px;width:250px;height:52px;font-size:18px">To the Map <span class="kc">Enter</span></div>'
    + fx('#ffd23f', '#ff4d63'), cls='kl-gold', bg='#1a0e05')

add('d5', 'D5 · A First Step done (text first)',
    'Find a recruit pays off: the report text comes first (the D1 order text). Its reward is held back for the next page.',
    WARE % ' style="filter:brightness(.6)"' + top(day='DAY 02', when='DAY · 2 OF 4', wc='#fff', funds='₽1,210', heat='9%')
    + ROOK
    + tbox('FIND A RECRUIT', ['A dockhand at the noodle stand says he knows a man who knows a man.', 'You leave him your name. That\'s a contact.'])
    + fx('#ffd9a0', '#7fb0ff'), cls='kl-warm')

add('d6', 'D6 · First Step reward, after the text',
    'Once the text closes, the First Steps panel flies to the middle, the box ticks with a stamp, and +₽100 counts in. It stays until Enter, then the panel flies back to its corner.',
    WARE % ' style="filter:brightness(.35) blur(2px)"' + top(day='DAY 02', when='DAY · 2 OF 4', wc='#fff', funds='₽1,310', heat='9%')
    + '<div class="rays4" style="z-index:30"></div>'
    + '<div class="tu-rw" style="left:250px;top:110px;width:460px"><div class="rh">FIRST STEP DONE</div>'
    + '<div class="it"><span class="tu-box on">✓</span>Find one useful contact<b>+₽100</b></div>'
    + '<div class="it" style="opacity:.7"><span class="tu-box"></span>Earn your first ₽500<b class="mu">₽210 / ₽500</b></div>'
    + '<div class="bigstamp" style="position:relative;display:block;width:max-content;margin:14px auto 0;font-size:28px;color:#43cf78">CONTACT MADE</div>'
    + '<div class="cta shine" style="position:relative;margin:18px auto 0;width:max-content">OK <span class="kc">Enter</span></div></div>'
    + after(330, 76)
    + fx('#ffd23f', '#43cf78'), cls='kl-gold', bg='#1a0e05')

add('d7', 'D7 · Lesson 9: Heat',
    'The first time Heat goes up, the spotlight lands on the Heat cell and a short police ladder drops under it: Calm, Watched, Wanted, Hunted. A marker shows 9%. The tip says what each rung does in one line.',
    hq(spot(584, 4, 118, 70, 10),
       '<div class="tu-ladder" style="left:500px;top:100px"><div class="on"><b>CALM</b><span>0–24%</span></div><div><b>WATCHED</b><span>25–49% · Jenny asks around</span></div><div><b>WANTED</b><span>50–74% · raids</span></div><div><b>HUNTED</b><span>75%+ · Looker</span></div></div>',
       arw(626, 78, 'up'),
       rail(9, 470),
       tip(30, 120, 380, 'Heat is how hard the police are looking. Jobs raise it; quiet days lower it (−3 a day). <b>Lay Low</b> cools it fast.', lesson='Lesson 9 · Heat', step='1 of 1'),
       base=HQ1_NOBUB.replace('<span class="v rd">5%</span>', '<span class="v rd">9%</span>').replace('₽1,000', '₽1,310').replace('EVENING', 'DAY').replace('DAY 01', 'DAY 02')),
    cls='kl-warm')

# Region map, from round-4 s3 (Day 2: only Pewter is yours).
MAP = frame('s3')
i, j = MAP.index('<!-- the map -->'), MAP.index('<!-- the Hero today -->')
MAPC = MAP[i:j]
MAPC = swap(MAPC,
            ('<div class="dz held home" style="left:38px;top:40px"><span class="row" style="gap:5px"><img class="ic s" src="sprites/g-relic-crown.png" alt="">Pewter</span><span class="pill y">HQ · Held</span></div>',
             '<div class="dz foot home sel" style="left:38px;top:40px"><span class="row" style="gap:5px"><img class="ic s" src="sprites/g-storage-key.png" alt="">Pewter</span><span class="pill y">Home</span></div>'),
            ('<div class="dz held" style="left:38px;top:156px">Viridian<span class="pill g">Held</span></div>', '<div class="dz out" style="left:38px;top:156px">Viridian<span class="pill k">Outsider</span></div>'),
            ('<div class="dz foot" style="left:38px;top:254px">Pallet<span class="pill y">Foothold</span></div>', '<div class="dz out" style="left:38px;top:254px">Pallet<span class="pill k">Outsider</span></div>'),
            ('<div class="dz foot sel" style="left:330px;top:34px">Cerulean<span class="pill y">Foothold 34</span></div>', '<div class="dz out" style="left:330px;top:34px">Cerulean<span class="pill k">Outsider</span></div>'))
MAPC = re.sub(r'<!-- legend bar.*', '', MAPC, flags=re.S)
add('d8', 'D8 · Lesson 10: the Region Map',
    'Tab 2, the first time. The round-4 map with Day 2 data: only Pewter is marked Home, Rocket holds Celadon and Saffron, everything else is Outsider. The spotlight rings Pewter; the tip says districts are where the Boss acts and that Enter opens a district file.',
    top(sub='REGION MAP', day='DAY 02', when='DAY · 2 OF 4', wc='#fff', funds='₽1,310', heat='9%') + '\n' + MAPC + '</div>'
    + '<div class="pnl" style="left:616px;top:84px;width:334px;height:196px"><div class="row sp"><b class="y" style="font-size:26px">Pewter</b></div><div class="stamp" style="right:14px;top:10px;color:#ffd23f">HOME</div>'
    + '<div class="col" style="gap:3px;margin-top:8px;font-size:15px"><div class="row sp"><span>Your Control</span><b class="y">4</b></div><div class="mt" style="--v:4"></div><div class="row sp"><span>Heat here</span><b class="rd">9</b></div><div class="mt heat" style="--v:9"></div><div class="row sp"><span>Rocket Control</span><b class="rd">6</b></div><div class="mt r" style="--v:6"></div></div></div>'
    + tabs(1)
    + spot(42, 120, 136, 66)
    + rail(10, 300)
    + tip(616, 330, 334, 'This is Kanto. Your warehouse is in <b>Pewter</b>. Pick a district and press <b>Enter</b> to see its jobs. Red rings mean Rocket.', lesson='Lesson 10 · The map', step='1 of 1')
    + fx('#9fd0ff', '#ff4d63'), cls='kl-cold check')

WHEEL = frame('m6')
WHEEL = re.sub(r'<div class="top">.*?</div></div></div>', top(day='DAY 02', when='DAY · 2 OF 4', wc='#fff', funds='₽1,310', heat='9%'), WHEEL, count=1, flags=re.S)
WHEEL = WHEEL.replace('Red is in Cerulean.<br>2 actions left today.', 'Pewter is home.<br>2 actions left today.')
WHEEL = re.sub(r'<div class="a col" style="left:24px;top:120px.*?</div>\n  </div>\n  <div class="a col" style="right:24px.*?</div>\n  </div>', '', WHEEL, count=1, flags=re.S)
add('d9', 'D9 · Lesson 11: the command wheel',
    'The first time the player holds Q (or on Day 2 if they never have), Rotom shows the round-4 command wheel. The Last pages and Pinned columns are empty on Day 2, so they are hidden. The tip says: hold Q, point, let go.',
    WHEEL + rail(11, 470)
    + tip(20, 130, 250, '<b>Hold Q</b> anywhere. Point at a page, let go, you\'re there. Faster than the tabs.', lesson='Lesson 11 · The wheel', step='1 of 1'),
    cls='kl-violet', bg='#0b0618')

MENU = frame('m1')
MENU = MENU.replace('TEAM NOVA', 'UNNAMED CREW').replace('sprites/t-nate.png', 'sprites/t-red.png')
_set = '<div class="blade"><span class="bi"><img class="ic" src="sprites/g-scope-lens.png" alt=""></span><span class="bl">Settings</span><span class="kc">S</span></div>'
MENU = swap(MENU, (_set, _set + '<div class="blade" style="box-shadow:0 0 0 3px #ff8a3d,0 0 16px rgba(255,138,61,.6)"><span class="bi"><img class="ic" src="sprites/p-rotom.png" alt=""></span><span class="bl">Replay a lesson<small>new · 15 lessons</small></span><span class="kc">T</span></div>'))
add('d10', 'D10 · Lesson 12: the Boss Menu',
    'The first Esc: the round-4 Boss Menu. Rotom points to two things: Settings (where the Tutorial row lives) and a new blade, "Replay a lesson", which lists all fifteen lessons. Team summary numbers on this page come from round 4 and would read Day 2 values in game.',
    MENU
    + tip(600, 300, 340, 'Esc opens this from anywhere. <b>Settings</b> and <b>Replay a lesson</b> live here, so you can turn tips off or watch one again.', lesson='Lesson 12 · The Boss Menu', step='1 of 1'),
    cls='kl-violet', bg='#0b0618')

add('d11', 'D11 · Lesson 13: the first bills (Day 7)',
    'Day 7 morning. The weekly bills come in as a short report: rent ₽200, Rook\'s wage ₽80. The text shows first. Rotom\'s tip then explains what happens if Funds can\'t cover it (unpaid crew lose Loyalty).',
    MORN + top(day='DAY 07', when='MORNING', wc='#ffd23f', funds='₽1,890', heat='6%')
    + ROOK.replace('top:454px', 'top:420px').replace('top:266px', 'top:232px')
    + '<div class="paper" style="left:620px;top:150px;width:300px;padding:14px 18px;transform:rotate(3deg)"><div style="font:700 22px serif;border-bottom:2px solid #231a10">WEEK 1 BILLS</div><div class="row sp" style="font:16px serif;margin-top:8px">Rent, the Warehouse<b>₽200</b></div><div class="row sp" style="font:16px serif">Wage, Rook<b>₽80</b></div><div class="row sp" style="font:700 17px serif;border-top:2px solid #231a10;margin-top:6px;padding-top:4px">Total<b>₽280</b></div></div>'
    + rail(13, 84)
    + tip(40, 120, 360, 'Every <b>7 days</b>: rent and wages. Can\'t pay? Someone goes unpaid, and they <b>remember</b>.', lesson='Lesson 13 · Bills', step='1 of 1')
    + tbox('MORNING REPORT', ['Week 1 bills: rent ₽200, wages ₽80.', 'Rook counts the money twice. “We\'re still rich, right, Boss?”'])
    + fx('#ffd23f', '#ff8a3d'), cls='kl-warm')

add('d12', 'D12 · Lesson 14: Rocket notices you',
    'Also Day 7: the first rival note, from the design\'s sample week. Giovanni appears in a dark crimson window above the text box. This is the hook for the rival team (Tension, Debate). Rotom\'s tip comes after the text, pointing at R = Rival File.',
    '<canvas class="cv" data-paint="skyline" data-pal="rocket" data-seed="9" width="960" height="540" style="filter:brightness(.7)"></canvas>'
    + '<div class="layer" style="background:radial-gradient(circle at 480px 200px,rgba(194,24,58,.3),rgba(8,2,6,.85) 65%)"></div>'
    + '<img class="spr" src="sprites/v-giovanni.png" alt="Giovanni" style="left:340px;top:40px;width:280px;height:300px;z-index:5;filter:brightness(.8) contrast(1.1)">'
    + '<img class="spr" src="sprites/p-persian.png" alt="" style="left:560px;top:230px;width:110px;height:100px;z-index:6;filter:brightness(.6)">'
    + '<div class="a" style="left:40px;top:40px;z-index:10;font:700 15px var(--ui);letter-spacing:.3em;color:#ff4d63">RIVAL NOTE · TEAM ROCKET</div>'
    + tbox('TEAM ROCKET', ['“A new crew in Pewter. One Grunt and a leaking roof.”', '“Keep an eye on them. Small things grow.”'], more='Enter ▶')
    + '<div class="a" style="right:30px;top:40px;z-index:10;font:600 14px var(--ui);color:#ffd9bf">After the text: Rotom, lesson 14 · <span class="kc">R</span> Rival File</div>'
    + fx('#ff4d63', '#c2183a'), cls='kl-red', bg='#0a0410')

add('d13', 'D13 · The first week, closed',
    'The Week 1 Ledger, short form: money, crew, Heat, what the First Steps paid. Then the First Steps panel swaps its two done goals for the next three (Hold your first district, HQ Lv. 2, Win your first raid; from the design). Rotom says the hand-holding is almost over.',
    WARE % ' style="filter:brightness(.3) blur(2px)"'
    + '<div class="ttl" style="--t1:#8a5a08;--t2:#ffd23f">WEEK 1<span class="sub">· the Ledger</span></div>'
    + '<div class="pnl gild" style="left:40px;top:96px;width:430px;height:300px"><div class="hd y"><img class="ic" src="sprites/g-journal.png" alt="">THE WEEK</div><div class="col" style="gap:7px">'
    + '<div class="chg y"><img class="ic" src="sprites/g-amulet-coin.png" alt="">Funds<span style="margin-left:auto">₽1,000 → ₽1,610</span><b>+₽610</b></div>'
    + '<div class="chg up"><img class="ic" src="sprites/g-fame-checker.png" alt="">Crew<span style="margin-left:auto">Rook</span><b>1 / 3</b></div>'
    + '<div class="chg up"><img class="ic" src="sprites/g-ball.png" alt="">Pokémon<span style="margin-left:auto">+ Rattata, + Spearow</span><b>6</b></div>'
    + '<div class="chg dn"><img class="ic" src="sprites/g-fire-stone.png" alt="">Heat<span style="margin-left:auto">5% → 6%</span><b>+1</b></div>'
    + '<div class="chg y"><img class="ic" src="sprites/g-star-piece.png" alt="">First Steps<span style="margin-left:auto">2 of 2 done</span><b>+₽200</b></div></div></div>'
    + '<div class="pnl glass" style="left:500px;top:96px;width:420px;height:200px"><div class="hd y"><img class="ic" src="sprites/g-star-piece.png" alt="">NEXT STEPS<span class="r">new</span></div><div class="col" style="gap:8px;font-size:17px">'
    + '<div class="row"><span class="tu-box"></span>Hold your first district</div><div class="row"><span class="tu-box"></span>Upgrade to HQ Lv. 2</div><div class="row"><span class="tu-box"></span>Win your first raid</div></div></div>'
    + tip(500, 320, 420, 'That\'s week one. A few more lessons show up when they matter. After the Founding, you\'re on your own.', step='', key='Next week')
    + fx('#ffd23f', '#ff8a3d'), cls='kl-gold', bg='#1a0e05')

# ================================================================ E · the Founding
section('e', 'E · The Founding', 'Street Gang on the Notoriety ladder plus both First Steps opens the Founding (built in D7, key O). Lesson 15 walks through it once, then the tutorial ends.')

add('e1', 'E1 · Street Gang: the town says your name',
    'The Notoriety ladder (Part 9 A14) climbs one rung with a shutter flash: Nobody → Street Gang. The built ready line shows, and a gold "THE FOUNDING · O" alert drops onto the HQ. The text stays until Enter.',
    WARE % ' style="filter:brightness(.45)"'
    + '<div class="tu-ladder big" style="left:90px;top:80px"><div class="was"><b>NOBODY</b><span>“That lot in the old warehouse”</span></div><div class="on"><b>STREET GANG</b><span>Your name, said quietly</span></div><div><b>CREW</b><span>Your name, in the paper</span></div></div>'
    + '<div class="bigstamp" style="left:560px;top:120px;color:#ffd23f;font-size:34px">STREET GANG</div>'
    + '<div class="sticker pulse" style="left:620px;top:220px;transform:rotate(-6deg)">THE FOUNDING · O</div>'
    + tbox('THE TOWN', ['The town says your name now, quietly.', 'Time for the Founding: a name, colours, a mark and a motto.'], more='Enter ▶')
    + fx('#ffd23f', '#ff4d63'), cls='kl-gold', bg='#1a0e05')

FOUND_TOP = top(day='DAY 11', when='EVENING', funds='₽2,240', heat='14%', roster='2/3')


def found_page(stepn, title, body, tipx, tipy, tipw, text, sp=None):
    return (WARE % ' style="filter:brightness(.35) blur(2px)"'
            + '<div class="ttl" style="--t1:#5b34b0;--t2:#c9338f">THE FOUNDING<span class="sub">· %s · %d of 5</span></div>' % (title, stepn)
            + keys(('Esc', 'later'), ('Enter', 'next'))
            + body + (spot(*sp) if sp else '')
            + rail(15, 56)
            + tip(tipx, tipy, tipw, text, lesson='Lesson 15 · The Founding', step='%d of 5' % stepn)
            + fx('#c9a0ff', '#ff4d63'))


ROOKBAND = lambda c1, c2, x=720, y=120: ('<div class="a" style="left:%dpx;top:%dpx;z-index:8"><img class="spr" src="sprites/c-rook.png" alt="Rook" style="left:0;top:0;width:150px;height:232px;position:relative">'
                                         '<span class="tu-band" style="--b1:%s;--b2:%s;left:22px;top:92px">V</span></div>') % (x, y, c1, c2)

add('e2', 'E2 · The Founding: the name',
    'The built Founding page, one step at a time for the tutorial. Name: type it, or take one of six suggestions made from your record (the built list uses your types: Venom, Shade...). Canon team names are refused with the built "taken" line.',
    found_page(1, 'THE NAME',
               '<div class="pnl glass" style="left:40px;top:96px;width:560px;height:300px"><div class="hd y"><img class="ic" src="sprites/g-idcard.png" alt="">NAME THE TEAM</div>'
               '<div class="tu-input">TEAM VENOM<span class="cursor">▌</span></div>'
               '<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:14px"><span class="pill" style="--c:#7b3fa0">Venom</span><span class="pill" style="--c:#5a6488">Shade</span><span class="pill" style="--c:#5a6488">Pewter Crew</span><span class="pill" style="--c:#5a6488">Drip</span><span class="pill" style="--c:#5a6488">Warehouse Gang</span><span class="pill" style="--c:#5a6488">Nightfang</span></div>'
               '<div class="mu xs" style="margin-top:12px">Up to 14 letters. Rocket, Aqua, Magma and the other canon names are taken.</div></div>'
               + ROOKBAND('#8a8f9e', '#5a5f6e'),
               40, 410, 460, 'A name for the door. Type one, or pick a suggestion.', sp=(32, 88, 576, 316)),
    cls='kl-violet', bg='#0b0618')

SW = lambda c, on=False: '<span class="tu-sw%s" style="--c:%s"></span>' % (' on' if on else '', c)
add('e3', 'E3 · The Founding: the colours',
    'Primary and secondary colour from the built list of twelve. Rook stands on the right and his armband recolours live (Part 6 §8, Part 11). This is the first time the grey band changes.',
    found_page(2, 'THE COLOURS',
               '<div class="pnl glass" style="left:40px;top:96px;width:560px;height:300px"><div class="hd y"><img class="ic" src="sprites/g-star-piece.png" alt="">PRIMARY · SECONDARY</div>'
               '<div class="row" style="gap:10px;flex-wrap:wrap">' + SW('#7b3fa0', True) + SW('#e8e2ff') + SW('#c0392b') + SW('#2b2b33') + SW('#1f7a5c') + SW('#e0b030') + SW('#23366e') + SW('#5fb4ff') + SW('#e07a2a') + SW('#3a8a3a') + SW('#d0d0d8') + SW('#8a2a4a') + '</div>'
               '<div class="row" style="gap:16px;margin-top:20px"><div class="col" style="gap:4px"><span class="mu xs">PRIMARY</span><b>Purple</b></div><div class="col" style="gap:4px"><span class="mu xs">SECONDARY</span><b>Lilac</b></div></div></div>'
               + ROOKBAND('#7b3fa0', '#e8e2ff'),
               40, 410, 460, 'These go on every armband. Watch Rook\'s band change.', sp=(712, 100, 170, 260)),
    cls='kl-violet', bg='#0b0618')

LOGOS = ['Shield', 'Diamond', 'Ring', 'Fang', 'Star', 'Eye']
add('e4', 'E4 · The Founding: the mark and the motto',
    'Initial and logo (the built six shapes) and a motto (typed, up to 48 letters, or one of the built ideas). The mark previews on a crest and on Rook\'s armband.',
    found_page(3, 'THE MARK', '<div class="pnl glass" style="left:40px;top:96px;width:560px;height:300px"><div class="hd y"><img class="ic" src="sprites/i-leaders_crest.png" alt="">MARK AND MOTTO</div>'
               '<div class="row" style="gap:8px">' + ''.join('<span class="tu-logo%s">%s</span>' % (' on' if l == 'Fang' else '', l) for l in LOGOS) + '</div>'
               '<div class="row" style="gap:14px;margin-top:14px;align-items:center"><div class="emb" style="width:64px;height:58px;font-size:38px;clip-path:polygon(0 0,100% 0,100% 70%,50% 100%,0 70%);background:linear-gradient(180deg,#7b3fa0,#4a2066);color:#e8e2ff">V</div>'
               '<div class="tu-input" style="flex:1;font-size:20px">“We keep what we take.”<span class="cursor">▌</span></div></div></div>'
               + ROOKBAND('#7b3fa0', '#e8e2ff'),
               40, 410, 460, 'A mark for the door, a motto for the speeches.', sp=(32, 88, 576, 316)),
    cls='kl-violet', bg='#0b0618')

add('e5', 'E5 · The Founding: the Goal',
    'One of the fourteen Goals (built list), or "Rule" (no special Goal). The highlighted row shows its line and quote. Rotom explains the Goal sets what the team argues for in Debates and which paths it opens. Step 5 is the confirm (Begin), so the page says 4 of 5 then 5 of 5 on the sign.',
    found_page(4, 'THE GOAL', '<div class="pnl glass" style="left:40px;top:96px;width:560px;height:300px"><div class="hd y"><img class="ic" src="sprites/g-relic-crown.png" alt="">WHAT DO YOU WANT?<span class="r">14 + Rule</span></div>'
               '<div class="col" style="gap:6px">'
               '<div class="ch on" style="font-size:17px;padding:8px 12px 8px 22px"><span class="brk"></span>Total Takeover<span class="xs" style="display:block;font-weight:500">Own every lever in the region, with a fist or a mask.</span></div>'
               '<div class="ch" style="font-size:16px;padding:6px 12px 6px 22px">Land Preservation</div><div class="ch" style="font-size:16px;padding:6px 12px 6px 22px">Rule <span class="mu xs">· no special Goal</span></div></div>'
               '<div class="xs" style="margin-top:10px;font-style:italic;color:#efe6ff">“Everything in this region belongs to someone. It should belong to us.”</div></div>'
               + ROOKBAND('#7b3fa0', '#e8e2ff'),
               40, 410, 460, 'Your Goal is what you <b>want</b>. It shapes Debates and how you can win.', sp=(32, 88, 576, 316)),
    cls='kl-violet', bg='#0b0618')

add('e6', 'E6 · The sign goes up',
    'Begin: the built "sign goes up" moment, as a short scene. A purple-and-lilac sign with the Fang mark is nailed over the warehouse door; Rook has the line from the design. Text first, then the next page.',
    WARE % ' style="filter:brightness(.75)"'
    + '<div class="a" style="left:300px;top:96px;width:360px;height:90px;z-index:6;background:linear-gradient(180deg,#7b3fa0,#4a2066);box-shadow:0 0 0 4px #060913,0 0 30px rgba(123,63,160,.8);display:grid;place-items:center;font:800 46px/1 var(--logo);font-style:italic;color:#e8e2ff;transform:rotate(-2deg)">TEAM VENOM</div>'
    + '<div class="rays turn" style="left:280px;top:-40px;width:400px;height:360px;z-index:5;--rc:rgba(200,160,255,.3)"></div>'
    + ROOKBAND('#7b3fa0', '#e8e2ff', 404, 220)
    + tbox('ROOK', ['“...Huh. It\'s on the door now.”', '“That\'s real, then.”'], more='Enter ▶')
    + fx('#c9a0ff', '#ffd23f'), cls='kl-violet')

add('e7', 'E7 · Armbands on, after the text',
    'After the sign scene closes, the reward card: the team is founded, every armband takes the new colours and initial, and the HQ top bar shows the new name and emblem. Enter returns to the HQ.',
    WARE % ' style="filter:brightness(.35) blur(2px)"' + top(nm='TEAM VENOM', day='DAY 11', when='EVENING', funds='₽2,240', heat='14%', roster='2/3', emb='V', ec='#7b3fa0')
    + '<div class="rays4" style="z-index:30"></div>'
    + reward(300, 100, 360, 'TEAM VENOM IS FOUNDED', [('c-rook', 'Rook\'s armband', 'Purple · V'), ('g-relic-crown', 'The Fang mark', 'on the door'), ('g-star-piece', 'Notoriety', 'Street Gang')], key='Back to work')
    + after(334, 64)
    + fx('#c9a0ff', '#ffd23f'), cls='kl-gold', bg='#1a0e05')

add('e8', 'E8 · Tutorial done: Rotom signs off',
    'The last tutorial page, on the HQ with the new name. Rotom says goodbye in one bubble and points at the Boss Menu\'s Replay a lesson. A small "TUTORIAL COMPLETE" stamp. From here no lesson ever blocks the screen again (tips-only stays if the player picked it).',
    hq('<div class="layer" style="background:rgba(5,3,14,.6);z-index:40"></div>',
       '<img class="spr float" src="sprites/p-rotom.png" alt="Rotom" style="left:120px;top:150px;width:170px;height:170px;z-index:46;filter:drop-shadow(0 0 22px rgba(255,150,80,.85))">',
       '<div class="bigstamp" style="left:330px;top:110px;color:#ff8a3d;font-size:30px;z-index:46">TUTORIAL COMPLETE</div>',
       '<div class="tu-rail" style="top:470px"><img src="sprites/p-rotom.png" alt="">15 OF 15 LESSONS<span class="dots">' + '<i class="d"></i>' * 15 + '</span></div>',
       tip(320, 250, 520, 'That\'s everything I had, Boss. The rest you learn by doing. Esc › <b>Replay a lesson</b> if you forget. Now go make Team Venom a problem.', step='', key='Bzzt, bye'),
       base=HQ1_NOBUB.replace('UNNAMED CREW', 'TEAM VENOM').replace('background:linear-gradient(180deg,#8a8f9e,#5a5f6e)">?', 'background:linear-gradient(180deg,#7b3fa0,#4a2066)">V').replace('DAY 01', 'DAY 11').replace('₽1,000', '₽2,240').replace('<span class="v rd">5%</span>', '<span class="v rd">14%</span>').replace('<span class="v">1/3</span>', '<span class="v">2/3</span>')),
    cls='kl-warm')

add('e9', 'E9 · Replay a lesson (Boss Menu)',
    'The new Boss Menu page behind "Replay a lesson": the fifteen lessons as a list with a done tick, and the Tutorial setting at the bottom (Full walkthrough, Tips only, Off). Picking a lesson plays its pages again over the current screen, without changing the run.',
    WARE % ' style="filter:brightness(.25) blur(3px)"'
    + '<div class="ttl" style="--t1:#c25a1a;--t2:#ff8a3d">REPLAY A LESSON<span class="sub">· Boss Menu</span></div>' + keys(('Esc', 'back'), ('▲▼', 'lesson'), ('Enter', 'play'))
    + '<img class="spr float" src="sprites/p-rotom.png" alt="Rotom" style="left:40px;top:120px;width:150px;height:150px;z-index:6">'
    + '<div class="a col" style="left:230px;top:90px;width:690px;z-index:10;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(8,auto);grid-auto-flow:column;gap:6px 14px">'
    + ''.join('<div class="ch%s" style="font-size:16px;padding:6px 12px 6px 22px">%s<span class="mu xs" style="margin-right:8px">%d</span>%s<span style="position:absolute;right:10px;top:6px" class="gn">✓</span></div>' % (
        ' on' if k == 7 else '', '<span class="brk"></span>' if k == 7 else '', k + 1, n) for k, n in enumerate(LESSONS))
    + '</div>'
    + '<div class="a row" style="left:230px;top:440px;z-index:10;gap:10px;font-size:16px"><span class="mu">TUTORIAL</span><span class="seg"><span>Full walkthrough</span><span class="on">Tips only</span><span>Off</span></span></div>'
    + fx('#ffb38a', '#c9338f'), cls='kl-violet', bg='#0b0618')

# ---------------------------------------------------------------- page

CSS = r'''
/* ===== tutorial + opening (tu-) ===== */
.tu-sn{margin:4px 0 0;color:var(--muted);font-size:15px}
.tu-spot{position:absolute;z-index:40;pointer-events:none;box-shadow:0 0 0 1600px rgba(5,3,14,.72)}
.tu-spot.nodim{box-shadow:none}
.tu-spot::after{content:"";position:absolute;inset:-5px;border-radius:inherit;border:3px solid #ff8a3d;box-shadow:0 0 0 2px #12071a,0 0 18px rgba(255,138,61,.75),inset 0 0 14px rgba(255,138,61,.35)}
.tu-tip{position:absolute;z-index:46;background:radial-gradient(140% 120% at 50% 0,#ffffff,#f2f4fb 60%,#e7ebf7);color:#28314b;border-radius:14px;padding:16px 16px 12px 70px;font-size:17px;line-height:1.35;
  box-shadow:0 0 0 3px #060913,0 0 0 6px #ff8a3d,0 0 0 9px #060913,0 0 30px rgba(255,138,61,.45),0 16px 32px rgba(0,0,0,.55)}
.tu-tip .rt{position:absolute;left:-22px;top:-26px;width:86px;height:86px;filter:drop-shadow(0 0 2px #fff) drop-shadow(0 0 12px rgba(255,150,80,.9))}
.tu-tip .nm{position:absolute;left:62px;top:-15px;background:linear-gradient(180deg,#ffd0b0,#ff8a3d);color:#2a1205;font-weight:700;font-size:13px;letter-spacing:.16em;padding:2px 12px;border-radius:6px;box-shadow:0 0 0 3px #060913}
.tu-tip .ls{display:block;font-size:12px;letter-spacing:.16em;color:#b2522a;font-weight:700;margin-bottom:4px;text-transform:uppercase}
.tu-tip .ft{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:14px;color:#5d6a90;gap:10px}
.tu-tip .ft>span{display:flex;gap:6px;align-items:center}
.tu-tip b{color:#b23a2e}
.tu-list{display:flex;flex-direction:column;gap:5px}
.tu-in{display:inline-grid;place-items:center;width:22px;height:22px;margin:0 6px 0 4px;border-radius:50%;font:700 13px var(--ui);font-style:normal;color:#fff;background:#c2183a;box-shadow:0 0 0 2px #060913;vertical-align:1px}
.tu-list i{display:inline-grid;place-items:center;width:22px;height:22px;margin-right:8px;border-radius:50%;font:700 13px var(--ui);font-style:normal;color:#fff;background:#c2183a;box-shadow:0 0 0 2px #060913;vertical-align:1px}
.tu-arw{position:absolute;z-index:47;width:0;height:0;border:16px solid transparent;border-top:24px solid #ff8a3d;border-bottom:0;filter:drop-shadow(0 0 1px #060913) drop-shadow(0 2px 0 #060913) drop-shadow(0 0 10px rgba(255,138,61,.85))}
.tu-arw.up{transform:rotate(180deg)}.tu-arw.left{transform:rotate(90deg)}.tu-arw.right{transform:rotate(-90deg)}
.tu-n{position:absolute;z-index:47;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font:700 17px var(--ui);color:#fff;background:radial-gradient(circle at 35% 30%,#ff9aa8,#c2183a);box-shadow:0 0 0 3px #060913,0 0 14px rgba(255,77,99,.75)}
.tu-rail{position:absolute;z-index:48;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:4px 12px 4px 6px;border-radius:999px;background:rgba(14,6,20,.94);box-shadow:0 0 0 2px #ff8a3d,0 0 0 4px #060913,0 0 16px rgba(255,138,61,.4);font:700 13px var(--ui);letter-spacing:.12em;color:#ffd9bf;white-space:nowrap}
.tu-rail img{width:26px;height:26px}
.tu-rail .dots{display:flex;gap:4px}
.tu-rail .dots i{width:8px;height:8px;border-radius:50%;background:#43324f;box-shadow:0 0 0 1.5px #060913}
.tu-rail .dots i.d{background:#ff8a3d}
.tu-rail .dots i.c{background:#fff;box-shadow:0 0 0 2px #ff8a3d,0 0 8px #ff8a3d}
.tu-lb{position:absolute;left:0;right:0;height:62px;background:#000;z-index:35}
.tu-lb.t{top:0}.tu-lb.b{bottom:0}
.tu-cap{position:absolute;z-index:36;left:44px;top:84px;font:700 15px var(--ui);letter-spacing:.32em;color:#ffd9a0;text-shadow:0 0 10px rgba(255,200,120,.6)}
.tu-cap b{display:block;font:800 44px/1.1 var(--logo);font-style:italic;letter-spacing:.02em;color:#fff;text-shadow:0 3px 0 #2a1060,0 0 18px rgba(180,140,255,.6)}
.tu-rw{position:absolute;z-index:44;padding:18px 18px 16px;border-radius:16px;background:linear-gradient(180deg,rgba(42,30,12,.97),rgba(22,14,6,.97));box-shadow:0 0 0 3px #2c1f05,0 0 0 6px #f0cf6e,0 0 0 9px #060913,0 0 40px rgba(255,210,63,.45),0 20px 40px rgba(0,0,0,.6)}
.tu-rw .rh{text-align:center;font:700 15px var(--ui);letter-spacing:.32em;color:#ffd23f;margin-bottom:12px;text-shadow:0 0 12px rgba(255,210,63,.6)}
.tu-rw .it{display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:10px;background:rgba(10,6,20,.6);box-shadow:0 0 0 2px #5a4a1c;font-weight:600;font-size:17px}
.tu-rw .it img{width:38px;height:38px;object-fit:contain;image-rendering:pixelated}
.tu-rw .it b{margin-left:auto;color:#ffd23f}
.tu-rw .nt{margin-top:10px;font-size:14px;color:#e9dcb6;font-style:italic;text-align:center}
.tu-after{position:absolute;z-index:45;padding:3px 10px;border-radius:999px;background:rgba(10,30,18,.92);box-shadow:0 0 0 2px #43cf78,0 0 0 4px #060913;font:600 12.5px var(--ui);color:#bff5d2;letter-spacing:.04em;white-space:nowrap}
.tu-new{position:absolute;z-index:12;padding:3px 10px;border-radius:6px;font:700 13px var(--ui);letter-spacing:.14em;color:#2a1a00;background:linear-gradient(180deg,#fff2a8,#ffd23f);box-shadow:0 0 0 2px #060913,0 0 14px rgba(255,210,63,.7)}
.tu-phone{position:absolute;z-index:8;width:200px;height:220px;border-radius:26px;background:linear-gradient(180deg,#ff8a3d,#c25a1a);box-shadow:0 0 0 4px #060913,0 0 40px rgba(255,138,61,.55)}
.tu-phone .scr{position:absolute;left:18px;right:18px;top:16px;height:40px;border-radius:8px;background:#1a0e08;color:#ffd0b0;font:700 11px/1.15 var(--ui);letter-spacing:.14em;text-align:center;padding-top:3px;box-shadow:inset 0 0 0 2px #060913}
.tu-zap{position:absolute;z-index:45;width:240px;height:240px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,170,90,.45),transparent)}
.tu-slot{display:inline-grid;place-items:center;width:80px;height:26px;border-radius:6px;border:2px dashed #ff8a3d;color:#ff8a3d;font-weight:700}
.tu-dial{position:absolute;z-index:10;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,#141a33 55%,#0a0e20 56%);box-shadow:0 0 0 4px #060913,0 0 0 8px #2c3766,0 0 30px rgba(111,168,255,.4)}
.tu-dial i{position:absolute;left:50%;top:50%;font:700 14px var(--ui);font-style:normal;letter-spacing:.12em;color:var(--c);transform:translate(-50%,-50%) rotate(var(--a)) translateY(-118px) rotate(calc(-1 * var(--a)));opacity:.55}
.tu-dial i.on{opacity:1;text-shadow:0 0 12px var(--c);font-size:17px}
.tu-dial b{position:absolute;inset:0;display:grid;place-items:center;font:700 34px var(--num,var(--ui));color:#fff}
.tu-ladder{position:absolute;z-index:42;display:flex;flex-direction:column;gap:6px;width:300px}
.tu-ladder>div{display:flex;justify-content:space-between;gap:10px;padding:6px 12px;border-radius:8px;background:rgba(14,10,26,.92);box-shadow:0 0 0 2px #3a2a5a;font-size:14px;color:#9aa3c4}
.tu-ladder>div b{color:#dfe5ff}
.tu-ladder>div.on{box-shadow:0 0 0 3px #ff8a3d,0 0 14px rgba(255,138,61,.6);color:#ffd9bf}
.tu-ladder>div.was{opacity:.5;text-decoration:line-through}
.tu-ladder.big{width:420px}.tu-ladder.big>div{font-size:17px;padding:10px 14px}
.tu-box{display:inline-grid;place-items:center;width:20px;height:20px;border:2px solid #b2bde6;border-radius:4px;margin-right:6px;font-weight:700;color:#0c2a16}
.tu-box.on{background:#43cf78;border-color:#43cf78}
.tu-input{margin-top:6px;padding:10px 14px;border-radius:8px;background:#0a0e20;box-shadow:inset 0 0 0 2px #56679d;font:700 30px var(--ui);letter-spacing:.06em;color:#fff}
.tu-sw{display:inline-block;width:40px;height:40px;border-radius:8px;background:var(--c);box-shadow:0 0 0 3px #060913}
.tu-sw.on{box-shadow:0 0 0 3px #060913,0 0 0 6px #ffd23f,0 0 14px rgba(255,210,63,.6)}
.tu-logo{padding:8px 12px;border-radius:8px;background:#222b47;box-shadow:0 0 0 2px #060913;font-weight:700;font-size:15px}
.tu-logo.on{background:#4a2066;box-shadow:0 0 0 3px #ffd23f}
.tu-band{position:absolute;z-index:2;width:26px;height:20px;border-radius:4px;display:grid;place-items:center;font:700 12px var(--ui);color:var(--b2);background:linear-gradient(180deg,var(--b1),color-mix(in srgb,var(--b1) 60%,#000));box-shadow:0 0 0 2px #060913,0 0 10px color-mix(in srgb,var(--b1) 70%,transparent)}
@media (prefers-reduced-motion:no-preference){
  .tu-spot::after{animation:tuPulse 1.6s ease-in-out infinite}
  .tu-arw{animation:tuBob 1s ease-in-out infinite}
  .tu-arw.up{animation-name:tuBobU}.tu-arw.left{animation-name:tuBobL}.tu-arw.right{animation-name:tuBobR}
  .tu-tip{animation:tuPop .5s cubic-bezier(.2,1.4,.4,1) backwards .25s}
  .tu-tip .rt{animation:float 3s ease-in-out infinite}
  .tu-rw{animation:tuRise .6s cubic-bezier(.2,1.3,.4,1) backwards .2s}
  .tu-rw .it{animation:tuPop .45s cubic-bezier(.2,1.4,.4,1) backwards;animation-delay:calc(.5s + var(--i,0) * .15s)}
  .tu-after{animation:tuPop .4s ease-out backwards}
  .tu-zap{animation:tuZap 1.4s ease-in-out infinite}
  .tu-rail .dots i.c{animation:tuPulse 1.2s ease-in-out infinite}
  .tu-sw.on,.tu-band{animation:tuPulse 2s ease-in-out infinite}
}
@keyframes tuPulse{50%{opacity:.55;transform:scale(1.04)}}
@keyframes tuBob{50%{transform:translateY(8px)}}
@keyframes tuBobU{0%,100%{transform:rotate(180deg)}50%{transform:rotate(180deg) translateY(8px)}}
@keyframes tuBobL{0%,100%{transform:rotate(90deg)}50%{transform:rotate(90deg) translateY(8px)}}
@keyframes tuBobR{0%,100%{transform:rotate(-90deg)}50%{transform:rotate(-90deg) translateY(8px)}}
@keyframes tuPop{from{opacity:0;transform:scale(.85) translateY(8px)}}
@keyframes tuRise{from{opacity:0;transform:translateY(40px) scale(.9)}}
@keyframes tuZap{50%{opacity:.4;transform:scale(1.15)}}
'''

NAV = [('a', 'Before the run'), ('b', 'Setup'), ('c', 'First evening'), ('d', 'First week'), ('e', 'Founding')]
MAST = ('<div class="wrap">\n<header class="mast">\n  <div class="eyebrow">Pocket Raiders · Evil Mode (Dominion) · Tutorial and opening</div>\n  <h1>Dominion · the first week</h1>\n'
        '  <p>Mockups for a Dominion tutorial and opening, one page per screen or interaction. It runs from the title, through a short cold open and the built setup, to the first evening, the first week and the Founding. Rotom (the Boss\'s phone) teaches fifteen short lessons, one at a time, each pointing at one thing. Same look as round 4 (Nova livery, New UI).</p>\n'
        '  <div class="how"><b>Rules kept:</b> text stays until a key is pressed, and every reward card appears only after its text is closed (marked ✓). Canon characters only (Red as the Boss, Giovanni, Officer Jenny); Rook is the design\'s default Grunt and is male. The helper is always called Rotom; tutorial lines are written ahead of time, so they cost nothing. No move animations are touched. Build note: a "Tutorial" row (Full, Tips only, Off) goes in Settings, Dominion tab, which means a settings save bump with a migration test.</div>\n'
        '  <nav class="jump" aria-label="Sections">' + ''.join('<a href="#%s">%s</a>' % n for n in NAV) + '</nav>\n</header>\n')

html = HEAD.replace('<title>Dominion Mockups</title>', '<title>Dominion Tutorial Mockups</title>') + CSS + '</style>\n</head>\n<body>\n' + MAST + '\n'.join(PAGES) + '\n</div>\n' + SCRIPT
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)

# sprites: copy the ones the page uses from round 4
os.makedirs(os.path.join(OUT, 'sprites'), exist_ok=True)
used = sorted(set(re.findall(r'sprites/([a-z0-9_-]+\.png)', html)))
missing = [u for u in used if not os.path.exists(os.path.join(V4, 'sprites', u)) and not os.path.exists(os.path.join(OUT, 'sprites', u))]
for u in used:
    if u not in missing and os.path.exists(os.path.join(V4, 'sprites', u)):
        shutil.copy(os.path.join(V4, 'sprites', u), os.path.join(OUT, 'sprites', u))
print('pages', html.count('<figure id='), 'sprites', len(used), 'missing', missing)
