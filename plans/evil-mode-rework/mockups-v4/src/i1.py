from kit import *

CSS = r'''
/* ---- blades: the Boss Menu's slanted buttons ---- */
.blade{position:relative;display:flex;align-items:center;gap:12px;height:38px;padding:0 14px 0 10px;transform:skewX(-12deg);
  background:linear-gradient(90deg,rgba(46,26,82,.96),rgba(22,14,42,.92));box-shadow:0 0 0 3px var(--ink),inset 0 0 0 2px rgba(180,140,255,.32),0 8px 16px rgba(0,0,0,.45)}
.blade>*{transform:skewX(12deg)}
.blade .bi{width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 40% 35%,#4a3a7a,#140c26);box-shadow:0 0 0 2px #8a6ad8}
.blade .bl{display:flex;flex-direction:column;font:700 18px/1.05 var(--ui);letter-spacing:.07em;text-transform:uppercase;color:#ece6ff}
.blade .bl small{font:500 12px var(--ui);letter-spacing:.02em;text-transform:none;color:#a99cd6}
.blade .kc{margin-left:auto}
.blade.on{background:linear-gradient(90deg,#ffe46a,#f4c929 60%,#e0a417);box-shadow:0 0 0 3px var(--ink),0 0 0 6px rgba(255,210,63,.35),0 0 30px rgba(255,210,63,.55)}
.blade.on .bl,.blade.on .bl small{color:#2a1d02}
.blade.on .bi{background:radial-gradient(circle at 40% 35%,#fff6c8,#e0a417);box-shadow:0 0 0 2px #2a1d02}
.blade.on::before{content:"";position:absolute;left:-26px;top:50%;width:16px;height:16px;margin-top:-8px;background:#ff3d6e;transform:skewX(12deg) rotate(45deg);box-shadow:0 0 0 2px var(--ink),0 0 12px #ff3d6e}
.blade.dim{opacity:.55}
.blade.red{background:linear-gradient(90deg,rgba(96,18,34,.96),rgba(42,8,18,.92));box-shadow:0 0 0 3px var(--ink),inset 0 0 0 2px rgba(255,110,120,.4)}
/* ---- settings controls ---- */
.seg{display:inline-flex;border-radius:8px;box-shadow:0 0 0 3px var(--ink);overflow:hidden;flex:none}
.seg>span{padding:4px 11px;background:#1d2440;color:#aab4dc;font-weight:600;font-size:14px;border-right:2px solid #0b0f1e}
.seg>span:last-child{border-right:0}
.seg>.on{background:linear-gradient(180deg,#ffe46a,#f4c929);color:#2a2410}
.tg{position:relative;width:48px;height:24px;flex:none;border-radius:12px;background:#2a3150;box-shadow:0 0 0 2px var(--ink),inset 0 2px 4px rgba(0,0,0,.4)}
.tg::after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#c9d2f2;box-shadow:0 2px 0 rgba(0,0,0,.35)}
.tg.on{background:linear-gradient(180deg,#5fe08f,#27a356)}.tg.on::after{left:27px;background:#fff}
.tight .srow{padding:4px 2px}
.srow{display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px;padding:7px 2px;border-bottom:2px solid rgba(148,166,222,.16);font-size:16px;font-weight:600}
.srow small{display:block;font-weight:500;color:var(--dim);font-size:12.5px;margin-top:1px}
.srow.sel{background:linear-gradient(90deg,rgba(255,210,63,.16),transparent);box-shadow:inset 4px 0 0 #ffd23f;padding-left:10px;border-radius:4px}
.srow.lock{opacity:.55}
.cat{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:7px;color:#c9d2f2;font-weight:600;font-size:16px}
.cat.on{background:linear-gradient(90deg,#7a3cf0,#c9338f);color:#fff;box-shadow:0 0 0 3px var(--ink),0 0 18px rgba(201,51,143,.45)}
/* ---- task, target and action cards ---- */
.task{position:relative;border-radius:12px;padding:9px 12px 10px;background:linear-gradient(180deg,#2d3859,#1c2440);box-shadow:0 0 0 3px var(--ink),inset 0 2px 0 rgba(255,255,255,.08);display:flex;flex-direction:column;gap:3px;min-width:0}
.task .nm{display:flex;align-items:center;gap:8px;font-weight:700;font-size:16px}
.task .od{font:34px/1 var(--num);color:#fff}
.task .od small{font:600 13px var(--ui);color:var(--muted);margin-left:4px}
.task .ln{font-size:12.5px;color:#c9d2f2;display:flex;justify-content:space-between;gap:6px}
.task.on{background:radial-gradient(circle at 70% 20%,rgba(255,226,120,.25),transparent 60%),linear-gradient(180deg,#3a3a68,#232650);box-shadow:0 0 0 3px var(--ink),0 0 0 6px #ffd23f,0 0 26px rgba(255,210,63,.45)}
.task.no{filter:grayscale(.7);opacity:.6}
.task .rb{position:absolute;right:-6px;top:-10px;padding:2px 9px;border-radius:5px;font:800 11.5px var(--ui);letter-spacing:.1em;color:#2a1d02;background:linear-gradient(180deg,#fff0a8,#f6c935);box-shadow:0 0 0 2px var(--ink);transform:rotate(4deg)}
.act{display:flex;align-items:center;gap:7px;padding:6px 9px;border-radius:8px;font-weight:700;font-size:15px;background:linear-gradient(180deg,#2d3859,#222b47);box-shadow:0 0 0 2px var(--ink)}
.act .kc{margin-left:auto}
.act.on{background:linear-gradient(180deg,#ffe46a,#f4c929);color:#2a2410;box-shadow:0 0 0 2px var(--ink),0 0 16px rgba(255,210,63,.55)}
.act.no{opacity:.45}
.grp{font:700 12px var(--ui);letter-spacing:.16em;color:var(--c,#b48cff);display:flex;align-items:center;gap:6px;margin:2px 0 4px}
.grp::after{content:"";flex:1;height:2px;background:linear-gradient(90deg,var(--c,#b48cff),transparent)}
.task.on::after{content:"";position:absolute;inset:-6px;border-radius:15px;padding:3px;pointer-events:none;background:conic-gradient(from var(--ang),transparent 0 58%,#fff6c0 76%,#ffd23f 82%,transparent 90%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
@media (prefers-reduced-motion:no-preference){.task.on::after{animation:orbit 2.6s linear infinite}}
.quote{position:absolute;z-index:20;font:600 italic 17px/1.35 var(--ui);color:#e9d8ff;text-shadow:0 2px 0 rgba(0,0,0,.6)}
.quote b{color:#ff6aa8;font-style:normal}
.mini{position:relative;border-radius:8px;overflow:hidden;box-shadow:0 0 0 3px var(--ink),inset 0 0 0 2px rgba(255,255,255,.15)}
'''

# ------------------------------------------------------------ m1 Boss Menu
M1 = fig('m1', 'New · Boss Menu (pause)',
 'Esc from any Dominion screen opens the Boss Menu over a darkened, blurred HQ. The Boss stands under a violet spotlight with the Nova crest behind him. The menu is a stack of slanted blades with number keys, and the right side shows the empire at a glance, so the Boss can check the run without opening five tabs. Settings and Save live here too, so the main screens stay clean.',
 '''  <canvas class="cv" data-paint="warehouse" width="960" height="540" style="filter:brightness(.3) saturate(.6) blur(2px)"></canvas>
  <div class="layer" style="background:radial-gradient(380px 420px at 150px 330px,rgba(160,90,255,.35),transparent 70%%),linear-gradient(90deg,rgba(10,4,24,.2),rgba(10,4,24,.75) 55%%,rgba(10,4,24,.85))"></div>
  <div class="cone" style="left:40px;top:0;width:230px;height:520px;--cc:rgba(190,140,255,.42)"></div>
  <div class="crest-rim" style="left:96px;top:96px;--s:110px"></div><div class="crest" style="left:101px;top:101px;--s:110px;opacity:.9">N</div>
  <div class="shd" style="left:64px;top:478px;width:180px;height:30px"></div>
  <img class="spr" src="sprites/t-nate.png" alt="The Boss" style="left:84px;top:236px;width:126px;height:245px">
  <div class="ttl" style="--t1:#5b1fb0;--t2:#c9338f">Boss Menu <span class="sub">· Paused</span></div>
  <div class="keys"><span class="key">Esc</span><span>Back to the game</span></div>
  <div class="a col" style="left:300px;top:76px;width:300px;gap:6px;z-index:20">
    %s
  </div>
  <div class="pnl gild" style="left:630px;top:78px;width:314px;height:330px">
    <div class="hd y"><img class="ic" src="sprites/g-relic-crown.png" alt="">Empire at a glance</div>
    <div class="col" style="gap:7px;font-size:15px">
      <div class="row sp"><span class="mu">Day 18 · Morning</span><b class="y num" style="font-size:22px">₽4,310</b></div>
      <div class="row sp"><span>Heat</span><b class="rd">22%%</b></div><div class="mt heat t" style="--v:22"></div>
      <div class="row sp"><span>♥ Regard · Dread</span><b><span class="gn">38</span> · <span class="vi">52</span></b></div>
      <div class="row sp"><span>Goal · Takeover</span><b class="y">71%%</b></div><div class="mt v t" style="--v:71"></div>
      <div class="row sp"><span class="row" style="gap:6px"><img src="sprites/t-red.png" alt="" style="width:20px;height:22px;object-fit:cover;object-position:top" class="px">Hero · Red</span><b class="rd">Threat 74</b></div>
      <div class="al r" style="margin-top:4px"><img class="ic" src="sprites/g-meteorite.png" alt=""><div><span class="t">ROCKET</span>Raid on your HQ in 3 nights.</div></div>
    </div>
  </div>
  <div class="pnl dim" style="left:630px;top:420px;width:314px;height:62px;padding:8px 14px">
    <div class="row sp" style="font-size:14px"><span class="row" style="gap:8px"><img class="ic" src="sprites/g-storage-key.png" alt=""><span><b>Slot 1</b> · Team Nova · Kanto<br><span class="xs dm">6h 12m played · autosaved 2 min ago</span></span></span><span class="pill g">SAFE</span></div>
  </div>
  <div class="quote" style="left:300px;top:500px;width:620px">“Nobody remembers the second-best criminal.” <b>— the Boss</b></div>
''' % '\n    '.join([
    blade('g-vs-seeker', 'Resume', 'Esc', sub='back to the Morning'),
    blade('g-card-key', 'Empire · HQ', '1'),
    blade('g-fame-checker', 'Crew Roster', '3', on=True, sub='12 members · 2 want a word'),
    blade('g-ball', 'Pokémon Reserve', '4'),
    blade('g-machine-part', 'Operations', '5'),
    blade('g-journal', 'Ledger', '6'),
    blade('p-rotom', 'Rotom', 'R', sub='Key-Card: Pearl · $3.20 of $10'),
    blade('g-scope-lens', 'Settings', 'S'),
    blade('g-letter', 'Quit to Title', 'Q', dim=True),
]) + fx('#c9a0ff', '#ff7ab8'), cls='st kl-violet vign grain', style='background:#0b0618')

# ------------------------------------------------------------ m2 Settings · Dominion
CATS = [('g-relic-crown', 'Dominion', True), ('g-star-piece', 'Effects & motion', False), ('g-scope-lens', 'Display', False), ('g-tea', 'Audio', False),
        ('p-rotom', 'Rotom', False), ('g-choice-band', 'Controls', False), ('g-soothe-bell', 'Accessibility', False), ('g-storage-key', 'Saves', False)]
M2 = fig('m2', 'New · Settings, Dominion tab',
 'The Settings page from the Boss Menu. Dominion gets its own tab for run rules, and a new Effects & motion block lets players dial all the round-3 spectacle down (Full show, Lighter, Calm), with live previews. Rotom keeps its own tab. Locked options show why they are locked.',
 '''  <div class="layer" style="background:radial-gradient(560px 320px at 700px 200px,rgba(160,90,255,.22),transparent 70%%),radial-gradient(500px 360px at 100px 520px,rgba(201,51,143,.18),transparent 70%%)"></div>
  <div class="ttl" style="--t1:#5b1fb0;--t2:#c9338f">Settings <span class="sub">· Dominion</span></div>
  <div class="keys"><span class="key">◀ ▶</span><span>Change</span><span class="key">Esc</span><span>Back</span></div>
  <div class="pnl dim" style="left:16px;top:76px;width:196px;height:448px;padding:10px">
    <div class="col" style="gap:5px">%s</div>
    <div class="a xs dm" style="left:12px;right:12px;bottom:12px;line-height:1.35">Changes save at once. <span class="kc">D</span> resets this tab.</div>
  </div>
  <div class="pnl" style="left:228px;top:76px;width:390px;height:448px">
    <div class="hd"><img class="ic" src="sprites/g-relic-crown.png" alt="">Your run<span class="r">new runs only</span></div>
    <div class="srow"><span>Run length<small>Regions to take before the end</small></span><span class="seg"><span class="on">Three</span><span>Six</span></span></div>
    <div class="srow sel"><span>Day pace<small>How fast Heat and rivals push back</small></span><span class="seg"><span>Calm</span><span class="on">Normal</span><span>Ruthless</span></span></div>
    <div class="srow"><span>Hero pressure<small>How often the Hero comes for you</small></span><span class="seg"><span>Low</span><span class="on">Normal</span><span>High</span></span></div>
    <div class="srow"><span>Betrayals<small>Holders may turn on you</small></span><span class="seg"><span>Off</span><span>Rare</span><span class="on">Normal</span></span></div>
    <div class="srow"><span>Show odds on the Card<small>The chance dial before every action</small></span><span class="tg on"></span></div>
    <div class="srow"><span>End the day when no actions are left</span><span class="tg"></span></div>
    <div class="srow lock"><span>Charters 🔒<small>Unlocks after you finish one run</small></span><span class="seg"><span class="on">Off</span></span></div>
  </div>
  <div class="pnl gild" style="left:632px;top:76px;width:312px;height:448px">
    <div class="hd y"><img class="ic" src="sprites/g-star-piece.png" alt="">Effects &amp; motion</div>
    <div class="a" style="left:14px;right:14px;top:58px;display:grid;grid-template-columns:repeat(3,1fr);gap:9px">
      <div class="tile on" style="height:100px;justify-content:flex-start;padding-top:6px"><div class="mini" style="width:72px;height:42px;background:radial-gradient(circle at 30%% 30%%,#ffd23f 0 4px,transparent 5px),radial-gradient(circle at 70%% 60%%,#ff7ab8 0 3px,transparent 4px),linear-gradient(150deg,#7a3cf0,#1a0f3a)"></div><b>Full show</b><span>every effect</span></div>
      <div class="tile" style="height:100px;justify-content:flex-start;padding-top:6px"><div class="mini" style="width:72px;height:42px;background:radial-gradient(circle at 30%% 30%%,#ffd23f 0 3px,transparent 4px),linear-gradient(150deg,#4a2a90,#1a0f3a)"></div><b>Lighter</b><span>no particles</span></div>
      <div class="tile" style="height:100px;justify-content:flex-start;padding-top:6px"><div class="mini" style="width:72px;height:42px;background:linear-gradient(180deg,#2a3352,#1a2038)"></div><b>Calm</b><span>no motion</span></div>
    </div>
    <div class="a col tight" style="left:14px;right:14px;top:170px">
      <div class="srow"><span>Particles<small>coins, sparks, confetti</small></span><span class="tg on"></span></div>
      <div class="srow"><span>Cut-ins<small>Boss orders and big results</small></span><span class="seg"><span class="on">Show</span><span>Skip</span></span></div>
      <div class="srow"><span>Screen shake</span><span class="tg on"></span></div>
      <div class="srow"><span>Flashes<small>lightning, sirens</small></span><span class="seg"><span class="on">On</span><span>Soft</span><span>Off</span></span></div>
      <div class="srow" style="border:0"><span>Follows the game's Motion setting</span><span class="pill v">LINKED</span></div>
    </div>
  </div>
''' % ''.join('<div class="cat%s"><img class="ic s" src="sprites/%s.png" alt="">%s</div>' % (' on' if on else '', ic, nm) for ic, nm, on in CATS) + fx('#c9a0ff', '#ff7ab8'),
 cls='st kl-violet check vign grain')

# ------------------------------------------------------------ m3 Assign · Mina
TASKS = [('g-relic-gold', 'Extort a Business', 38, '₽300–550', 'Heat +6', 'half a day', ''),
         ('g-ball', 'Steal Pokémon', 31, '1 Pokémon', 'Heat +9', 'night', ''),
         ('g-town-map', 'Scout a Route', 44, 'Intel ×2', 'Heat +1', 'half a day', 'on'),
         ('g-member-card', 'Recruit a Trainer', 29, 'Hopeful', 'Heat +2', 'day', ''),
         ('g-choice-band', 'Train in Battle', 100, '+XP', 'none', 'day', ''),
         ('g-tea', 'Rest', 100, '+Morale', 'none', 'day', '')]


def task(ic, nm, od, pay, risk, t, on):
    rb = '<span class="rb">BEST FIT</span>' if on else ''
    odd = ('%d<small>%%</small>' % od) if od < 100 else 'sure'
    return ('<div class="task%s">%s<div class="nm"><img class="ic" src="sprites/%s.png" alt="">%s</div><div class="od">%s</div>'
            '<div class="ln"><span class="y">%s</span><span class="rd">%s</span></div><div class="ln"><span class="dm">takes %s</span></div></div>') % (
        ' on' if on else '', rb, ic, nm, odd, pay, risk, t)


M3 = fig('m3', 'New · Assign a task (split out of Morning)',
 'Assigning used to be a small list squeezed into the Morning screen. Now it gets its own page. The member stands on the left with her stats and the personality that is forming, and the six quick tasks become big cards with odds, pay, Heat and time. Scout a Route is tagged Best fit for Mina. The rest of the crew waits in the strip on the right. The Morning screen keeps the report and links here.',
 top() + '''
  <div class="layer" style="top:72px;background:radial-gradient(300px 300px at 150px 300px,rgba(160,90,255,.35),transparent 70%%),linear-gradient(180deg,#1a1430,#100c22)"></div>
  <div class="pool" style="left:20px;top:330px;width:260px;height:80px;--pc:rgba(190,140,255,.5)"></div>
  <img class="spr" src="sprites/c-mina.png" alt="Mina" style="left:44px;top:190px;width:216px;height:180px">
  <div class="pnl glass" style="left:14px;top:84px;width:262px;height:96px;padding:10px 14px">
    <div class="row" style="gap:8px"><b style="font-size:24px;letter-spacing:.06em">MINA</b><span class="pill v">SERGEANT</span><span class="pill r" style="margin-left:auto">NERVOUS</span></div>
    <div class="row xs mu" style="gap:6px;margin-top:4px"><span class="armband" style="width:44px;height:16px;border-radius:4px"><i style="font-size:11px">N</i></span>Night Shift leader · free today</div>
    <div class="row xs" style="gap:8px;margin-top:6px"><span>Loyalty <b class="gn">78</b></span><span>Skill <b class="cy">48</b></span><span>Stealth <b class="vi">7</b></span></div>
  </div>
  <div class="pnl glass" style="left:14px;top:388px;width:262px;height:80px;padding:8px 12px">
    <div class="xs dm caps">Personality forming</div>
    <div class="row sm" style="gap:6px;margin-top:4px"><span class="pill k">Calm?</span><span class="dm">2 more scouting jobs</span></div>
  </div>
  <div class="a" style="left:292px;top:96px;width:470px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px 12px">%s</div>
  <div class="pnl dim" style="left:776px;top:84px;width:170px;height:288px;padding:10px">
    <div class="hd" style="font-size:14px">Also free</div>
    <div class="col" style="gap:8px;font-size:14px">
      <div class="row"><img class="face" src="sprites/c-dale.png" alt="" style="width:40px;height:40px;object-fit:cover;object-position:top"><span><b>Dale</b><br><span class="xs gn">Guard · busy</span></span></div>
      <div class="row"><img class="face" src="sprites/c-rosa.png" alt="" style="width:40px;height:40px;object-fit:cover;object-position:top"><span><b>Rosa</b><br><span class="xs y">free</span></span></div>
      <div class="row"><img class="face" src="sprites/c-gus.png" alt="" style="width:40px;height:40px;object-fit:cover;object-position:top"><span><b>Gus</b><br><span class="xs y">free</span></span></div>
      <div class="row xs dm">◀ ▶ switch member</div>
    </div>
  </div>
  <div class="cta shine" style="left:776px;top:384px;width:170px;height:78px;flex-direction:column;gap:2px;font-size:19px">Send Mina<span class="kc">Enter</span></div>
''' % ''.join(task(*t) for t in TASKS) + tabs(2) + fx('#c9a0ff', '#ffd23f'), cls='st kl-violet vign grain')

# ------------------------------------------------------------ m4 District · Cerulean
def tgt(sprite, nm, val, note, cls=''):
    return ('<div class="task%s" style="padding:4px 10px"><div class="row" style="gap:10px"><img class="px" src="sprites/%s" alt="" style="width:40px;height:42px;object-fit:contain">'
            '<div class="col" style="gap:2px;min-width:0"><b>%s</b><span class="xs y">%s</span><span class="xs dm">%s</span></div></div></div>') % (cls, sprite, nm, val, note)


def acts(c, name, items):
    return '<div><div class="grp" style="--c:%s">%s</div><div class="col" style="gap:6px">%s</div></div>' % (c, name, ''.join(
        '<div class="act%s"><img class="ic s" src="sprites/%s.png" alt="">%s<span class="kc">%s</span></div>' % (' ' + x[3] if len(x) > 3 else '', x[0], x[1], x[2]) for x in items))


M4 = fig('m4', 'New · District file (split out of the Region Map)',
 'Clicking a district on the map now opens this page instead of a cramped side panel. Cerulean\'s skyline sits behind three dials for Control, Heat and Rocket\'s grip. Its three targets are cards with what they pay and who guards them, and the nine actions are grouped into Money, Muscle and Shadow with number keys. Red\'s warning runs across the top. The map goes back to being a map.',
 '''  <canvas class="cv" data-paint="skyline" data-pal="day" data-seed="21" data-tall="1.1" width="960" height="540" style="filter:saturate(.9) brightness(.85)"></canvas>
  <div class="layer" style="background:linear-gradient(180deg,rgba(10,14,40,.1),rgba(10,14,40,.55) 45%%,rgba(10,14,40,.9))"></div>
  <div class="ttl" style="--t1:#1f6fd0;--t2:#38b6d8">Cerulean <span class="sub">· District file</span></div>
  <div class="keys"><span class="key">Esc</span><span>Map</span></div>
  <div class="bnr" style="left:330px;top:66px;font-size:18px;padding:5px 34px;background:linear-gradient(180deg,#ff8a7a,#d8402f);color:#fff;filter:drop-shadow(0 4px 0 #4a0d08) drop-shadow(0 0 16px rgba(255,90,79,.6))"><img class="px" src="sprites/t-red.png" alt="" style="width:20px;height:34px;object-fit:cover;object-position:top">RED IS IN CERULEAN TODAY</div>
  <div class="stamp" style="left:770px;top:74px;color:#ffd23f;text-shadow:0 0 8px #ffd23f;font-size:18px">FOOTHOLD</div>
  <div class="pnl glass" style="left:16px;top:118px;width:300px;height:172px">
    <div class="row" style="justify-content:space-around;margin-top:4px">
      <div class="col" style="align-items:center;gap:6px"><div class="dial" style="--v:34;--c:#ffd23f;width:68px;height:68px"><b style="width:50px;height:50px;font-size:24px">34</b></div><span class="xs caps">Your control</span></div>
      <div class="col" style="align-items:center;gap:6px"><div class="dial" style="--v:18;--c:#ff7a3c;width:68px;height:68px"><b style="width:50px;height:50px;font-size:24px">18</b></div><span class="xs caps">Heat here</span></div>
      <div class="col" style="align-items:center;gap:6px"><div class="dial" style="--v:22;--c:#ef4a3a;width:68px;height:68px"><b style="width:50px;height:50px;font-size:24px">22</b></div><span class="xs caps">Rocket grip</span></div>
    </div>
    <div class="xs mu" style="margin-top:6px;text-align:center">Reach 50 control to make Cerulean <b class="gn">Held</b>.</div>
  </div>
  <div class="a col" style="left:16px;top:302px;width:300px;gap:6px;z-index:6">
    <div class="grp" style="--c:#ffd23f">TARGETS</div>
    %s%s%s
  </div>
  <div class="pnl" style="left:332px;top:118px;width:612px;height:300px">
    <div class="hd"><img class="ic" src="sprites/g-machine-part.png" alt="">What will you do here?<span class="r">2 actions left today</span></div>
    <div class="a" style="left:14px;right:14px;top:58px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px">%s%s%s</div>
    <div class="a xs dm" style="left:14px;right:14px;bottom:12px">Each action opens its Card first: you see the odds, pay and risk before anything happens.</div>
  </div>
  <div class="cta shine" style="left:332px;top:432px;width:612px;height:56px">Extort the Bike Shop ▶ <span class="kc">Enter</span></div>
''' % (tgt('g-bicycle.png', 'Bike Shop', 'pays ₽300–550', 'Owner: Stubborn · no guard', ' on'),
       tgt('t-misty.png', 'Cerulean Gym', 'Misty · Badge 2', 'Gym: battle or bribe'),
       tgt('g-nugget.png', 'Nugget Bridge', '₽1,200 a week', 'Rocket guards it'),
       acts('#ffd23f', 'MONEY', [('g-relic-gold', 'Extort', '1', 'on'), ('g-amulet-coin', 'Take', '2'), ('g-machine-part', 'Smuggle', '3')]),
       acts('#ff6a5c', 'MUSCLE', [('g-black-belt', 'Attack', '4'), ('g-smoke-ball', 'Thieve', '5'), ('g-ball', 'Steal', '6', 'no')]),
       acts('#b48cff', 'SHADOW', [('g-silph-scope', 'Scout', '7'), ('g-member-card', 'Recruit', '8'), ('g-tea', 'Lay low', '9')])) + fx('#9fd0ff', '#ffd23f'),
 cls='st kl-cold vign grain')

PAGES = [M1, M2, M3, M4]
PAGE_NAV = [('m1', 'Boss Menu'), ('m2', 'Settings'), ('m3', 'Assign'), ('m4', 'District')]

# s2 and s3 now point at the new pages
REPLACE = []

NOTES = {
 'm1': ['Pass 1 · built: a pause menu was missing. Slanted blades, the Boss under a spotlight, empire summary, save slot and a villain quote.'],
 'm2': ['Pass 2 · built: Settings with a Dominion tab and an Effects & motion block so the spectacle can be turned down.'],
 'm3': ['Pass 3 · built: assigning a task now has its own page; tasks are big cards with odds, pay, Heat and time.'],
 'm4': ['Pass 4 · built: the district file is its own page; actions are grouped Money, Muscle and Shadow.'],
 's2': ['Interval 1 · the Assign Task list now opens its own page (Assign a task), so this screen can breathe as the morning report.'],
 's3': ['Interval 1 · the side panel now opens the District file page, so the map stays a map.'],
}
ALL_NOTE = 'Interval 1 · Esc now opens the new Boss Menu from this screen, and Settings live there.'

TITLE = 'New pages'
BIG = 'Four new pages: a Boss Menu, Settings, an Assign-a-task page and a District file. Menu and Settings did not exist before; the other two pull clutter out of Morning and the Map.'

REVIEW = [
 ('Boss Menu', 'Slanted gold blades, the Boss lit like a poster, live empire summary.', 'There was no menu at all; now every screen has one place to pause, save and check the run.', 'Yes: Save, Settings and Rotom leave the main screens and live here.', 'This is the Menu. It opens on Esc from every Dominion screen.', 'Yes: the Boss stands over his crew list with a crest and a criminal\'s quote.'),
 ('Settings · Dominion', 'Segmented gold switches, live preview tiles for each effects level.', 'Rules that were only in docs (run length, pace, betrayals) are now player choices.', 'Yes: settings get their own page with tabs instead of hiding in Rotom\'s screen.', 'Settings opens from the Boss Menu, with a Dominion tab and an Effects & motion tab.', 'Partly: "Day pace: Ruthless" and "Betrayals" make the player think like a crime boss.'),
 ('Assign a task', 'Big task cards with huge odds numbers and a Best fit ribbon with an orbiting spark.', 'Morning had six tiny rows; now one member and six readable cards fill the screen.', 'Yes: assigning moved out of the Morning screen.', 'Esc still opens the Menu; the tabs stay at the bottom.', 'Yes: the jobs are extortion, theft and recruiting, all with Heat shown up front.'),
 ('District file', 'Three dials, target cards with portraits, a red Hero warning banner.', 'The map no longer carries a cramped side panel; actions get a full page.', 'Yes: the district and its nine actions are now their own page.', 'Esc goes back to the map, then to the Menu.', 'Yes: Money, Muscle and Shadow read like a crime syndicate\'s playbook.'),
 ('Wiring the new pages', 'Each new page keeps the round-3 frame, haze and glow, so it sits with the old screens.', 'The set went from 27 single screens to a connected game with a menu, settings and drill-down pages.', 'Checked every screen: Morning and the Map were the cluttered ones; both now hand off to their own pages.', 'Esc opens the Boss Menu from every screen (noted under each screen); Settings sit inside the Menu.', 'The Menu, the task list and the district page all speak as the villain.'),
]
