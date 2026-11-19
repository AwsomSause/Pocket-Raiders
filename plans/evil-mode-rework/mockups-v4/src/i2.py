# Round 4 interval 2 (passes 6-10): the Nova livery, an evil visual identity on every screen.
from urllib.parse import quote
SIG = quote('''<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 220'><g fill='none' stroke='#ff4d63' stroke-width='5'><path d='M100 6 192 52v116l-92 46-92-46V52z'/><path d='M100 26 174 63v94l-74 37-74-37V63z' stroke-width='2' stroke-opacity='.6'/></g><path d='M30 110Q100 40 170 110Q100 180 30 110z' fill='none' stroke='#ff4d63' stroke-width='5'/><ellipse cx='100' cy='110' rx='26' ry='26' fill='#ff4d63' fill-opacity='.5'/><ellipse cx='100' cy='110' rx='7' ry='24' fill='#ff4d63'/></svg>''', safe="=:/'' ")
CSS = r'''
/* pass 6: Nova livery - lacquer black, crimson seams, violet edges */
.st{--edge:#9a64d8;--edge2:#5e3a8e;--blood:#c2183a;--blood-l:#ff4d63}
.top{border-color:#9a3a6e;background:linear-gradient(180deg,rgba(255,255,255,.06),transparent 30%),linear-gradient(180deg,rgba(44,20,46,.98),rgba(20,10,26,.98) 55%,rgba(10,5,16,.98))}
.top::after{background:linear-gradient(90deg,transparent,#c2183a 14%,#ff4d63 50%,#c2183a 86%,transparent)}
.tabs>div{border-color:#6a3462}
.tabs>div:not(.on){background:radial-gradient(circle at 7px 7px,#e8d9a8 0 1.5px,#6a5420 2px,transparent 3px),radial-gradient(circle at calc(100% - 7px) 7px,#e8d9a8 0 1.5px,#6a5420 2px,transparent 3px),linear-gradient(180deg,rgba(46,24,50,.98),rgba(24,12,30,.98) 52%,rgba(12,6,18,.98))}
.tabs>.on{border-color:#ff6a7e;background:linear-gradient(180deg,#9a1f42,#4e0c24);box-shadow:0 0 0 3px var(--ink),0 0 22px rgba(255,77,99,.55),inset 0 2px 0 rgba(255,200,210,.25)}
.tabs>.on::before{background:linear-gradient(135deg,#fff,#ff9aa8 40%,#c2183a);box-shadow:0 0 0 2px var(--ink),0 0 12px #ff4d63}
.tabs>.on::after{background:linear-gradient(0deg,rgba(255,77,99,.4),transparent)}
.pnl{outline:1px solid rgba(255,77,99,.32);outline-offset:-7px}
.hd{border-image:linear-gradient(90deg,rgba(255,77,99,.85),rgba(154,100,216,.4) 45%,rgba(154,100,216,0)) 1}
.pnl.gild>.hd{border-image:linear-gradient(90deg,rgba(255,210,63,.9),rgba(255,77,99,.5) 45%,rgba(255,77,99,0)) 1}

/* pass 7: title banners become black lacquer with the Nova eye */
.ttl{background:linear-gradient(180deg,rgba(255,255,255,.1),transparent 45%),linear-gradient(100deg,#12071a 0 42%,color-mix(in srgb,var(--t1,#7a3cf0) 60%,#12071a) 76%,var(--t2,#c9338f));box-shadow:inset 0 -3px 0 #ff4d63,inset 0 -6px 0 rgba(120,8,30,.6)}
.ttl::before{width:30px;height:22px;transform:none;border-radius:0;clip-path:ellipse(50% 38% at 50% 50%);box-shadow:none;
  background:radial-gradient(ellipse 2.6px 7px at 50% 50%,#12071a 92%,transparent 100%),radial-gradient(circle at 50% 50%,#fff3b0 0 2.5px,#ffd23f 3.5px,#ff4d63 6px,#8a0f22 8.5px,#2a0610 9.5px,transparent 10px),linear-gradient(180deg,#f2e8ff,#b9a6d8)}
.ttl{text-shadow:0 -1px 0 rgba(255,255,255,.3),0 3px 0 rgba(0,0,0,.5),0 0 16px rgba(255,77,99,.45)}

/* pass 8: blood-gold buttons */
.cta{box-shadow:0 0 0 3px var(--ink),0 0 0 6px #8e1530,0 0 0 7px rgba(255,120,140,.7),inset 0 -6px 0 #c0601a,inset 0 2px 0 #fff6b8,0 0 34px rgba(255,77,99,.4)}
.cta{padding-left:34px}
.cta::before{content:"";position:absolute;left:8px;top:50%;width:18px;height:22px;margin-top:-11px;pointer-events:none;opacity:.55;
  background:linear-gradient(135deg,transparent 0 45%,#8e1530 46% 58%,transparent 59%) 0 0/9px 11px no-repeat,linear-gradient(45deg,transparent 0 41%,#8e1530 42% 54%,transparent 55%) 0 11px/9px 11px no-repeat,
  linear-gradient(135deg,transparent 0 45%,#8e1530 46% 58%,transparent 59%) 9px 0/9px 11px no-repeat,linear-gradient(45deg,transparent 0 41%,#8e1530 42% 54%,transparent 55%) 9px 11px/9px 11px no-repeat}
.ch.on{box-shadow:0 0 0 3px var(--ink),0 0 0 5px #8e1530,0 0 26px rgba(255,77,99,.45),inset 0 2px 0 #fff6c0}

/* pass 9: villain light - crimson underlight, siren seam, the Nova sigil behind every screen */
.vl4{position:absolute;inset:0;z-index:37;pointer-events:none;background:radial-gradient(120% 60% at 50% 115%,rgba(194,24,58,.30),transparent 60%),radial-gradient(60% 40% at 0 0,rgba(90,20,120,.22),transparent 70%)}
.vl4::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,transparent,#ff4d63 20%,transparent 40%,#a678ff 60%,transparent 80%) 0 0/200% 100%;opacity:.8;filter:drop-shadow(0 0 6px #ff4d63)}
.sig4{position:absolute;z-index:1;pointer-events:none;width:420px;height:462px;right:-70px;top:60px;opacity:.14;mix-blend-mode:screen;background:url("data:image/svg+xml,@SIG@") center/contain no-repeat}
.sig4.l{right:auto;left:-80px}
.sig4.c{right:auto;left:270px;top:40px;opacity:.12}

/* pass 10: lock-on - the chosen thing is a target */
.ch.on,.tile.on,.task.on,.blade.on,.act.on,.cat.on,.kcard.on{outline:2px solid rgba(255,77,99,.85);outline-offset:5px}
.dz.sel{outline-color:#ff6a7e;box-shadow:0 0 0 3px var(--ink),0 0 28px rgba(255,77,99,.7)}

@media (prefers-reduced-motion:no-preference){
  .ttl::before{animation:eye4 7s ease-in-out infinite}
  @keyframes eye4{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.08)}}
  .vl4::before{animation:siren4 4.5s linear infinite}
  @keyframes siren4{to{background-position:-200% 0}}
  .sig4{animation:sig4 40s ease-in-out infinite alternate}
  @keyframes sig4{from{transform:rotate(-4deg) scale(1)}to{transform:rotate(4deg) scale(1.06)}}
  .ch.on,.tile.on,.task.on,.blade.on,.act.on,.cat.on,.kcard.on{animation:lock4 2.6s ease-in-out infinite}
  @keyframes lock4{0%,100%{outline-offset:9px;outline-color:rgba(255,77,99,.25)}50%{outline-offset:4px;outline-color:rgba(255,77,99,.95)}}
}
'''.replace('@SIG@', SIG)

# where the sigil sits on each screen (r = right, l = left, c = centre) so it falls on open background
SIDE = {'s0': 'c', 'c1': 'c', 'k1': 'l', 'k4': 'l', 's8': 'l'}


def EACH(sid):
    side = SIDE.get(sid, '')
    return '<div class="sig4%s" aria-hidden="true"></div><div class="vl4" aria-hidden="true"></div>' % (' ' + side if side else '')


def EACH_NEW(fid):
    return EACH(fid)


PAGES, PAGE_NAV, REPLACE = [], [], []
NOTES = {}
ALL_NOTE = ('Interval 2 · the Nova livery: lacquer-black title banner with a blinking Nova eye, crimson seams on the top bar and tabs, '
            'blood-gold buttons with a crimson ring and fang marks, a crimson underlight and siren seam, the Nova sigil behind the screen, '
            'and a red lock-on ring around whatever is chosen.')
TITLE = 'The Nova livery'
BIG = ('Every screen, old and new, now wears one villain look instead of the friendly blue-and-gold: black lacquer, crimson seams, '
       'the Nova eye and sigil, and a red lock-on ring on the thing you are choosing.')
REVIEW = [
 ('Lacquer and crimson', 'Top bar, tabs and panel edges turn black lacquer and violet with crimson seams, and every panel gets a thin crimson inner line; the open tab glows red.',
  'Round 3 was gold on friendly blue, which read like a hero\'s menu. Now the colours say "criminal organisation" at a glance.',
  'No new page; this pass is about the look every page shares.', 'The Boss Menu and Settings take the same livery, so they feel part of the game.',
  'Yes: red and black is the classic villain team palette.'),
 ('The Nova eye', 'The plain white diamond on every title becomes a gold-and-crimson slit eye that blinks now and then.',
  'Every screen title now has the team\'s mark instead of a generic shape.', 'No; titles stay one line so pages stay calm.',
  'The Menu title gets the same eye, so it reads as the Boss\'s own menu.', 'Yes: the team is always watching.'),
 ('Blood-gold buttons', 'Main buttons get a crimson ring, a pink rim and two fang marks; chosen options get a crimson ring too.',
  'Buttons were plain yellow; now they look like a gang\'s seal.', 'No; the button count is unchanged.',
  'Settings switches stay gold so they read as safe; only actions turn blood-gold.', 'Yes: every "do it" button feels like committing a crime.'),
 ('Villain light and the sigil', 'A crimson underlight rises from the floor, a red-and-violet siren seam runs along the top edge, and the Nova sigil (a hex crest with an eye) slowly turns behind the UI.',
  'Round 3 lit each screen in its own colour; now every screen also shares one sinister light.', 'No; the sigil sits behind open space, never behind text.',
  'The Menu\'s darkened HQ gets the same underlight, so pausing still feels like the hideout.', 'Yes: it looks lit by an alarm, not by daylight.'),
 ('Lock-on', 'Whatever you are choosing gets a red ring that tightens like a target lock.',
  'Selection was only a gold fill; now it also says "target".', 'Checked: the ring sits outside each card, so nothing gets more crowded.',
  'Menu blades and Settings categories lock on the same way, so the cursor feels the same everywhere.',
  'Yes: choosing a task or district feels like picking a victim.'),
]
