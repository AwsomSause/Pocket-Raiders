# Round 4 interval 4 (passes 16-20): what happens after "Do it". Each action now plays a Boss order cut-in,
# then a full result page: job done, job botched, or the Hero showing up.
from kit import *

CSS = r'''
/* pass 16: the Boss order cut-in */
.half4{position:absolute;inset:0;z-index:2;background:radial-gradient(circle,rgba(255,77,99,.35) 1.4px,transparent 2px) 0 0/9px 9px;mix-blend-mode:screen}
.band{position:absolute;z-index:10;overflow:hidden;transform:skewY(-8deg);box-shadow:0 0 0 4px #12071a,0 0 0 7px #ff4d63,0 18px 40px rgba(0,0,0,.6)}
.band>*{transform:skewY(8deg)}
.band.boss{background:linear-gradient(90deg,#12071a,#4e0c24 45%,#c2183a)}
.band.crew{background:linear-gradient(90deg,#ffd23f,#e0a82a 40%,#6a4808)}
.band img.por{position:absolute;image-rendering:pixelated}
.speed{position:absolute;inset:0;background:repeating-linear-gradient(172deg,transparent 0 18px,rgba(255,255,255,.08) 18px 20px)}
.order{position:absolute;z-index:14;font:700 64px/0.95 var(--ui);letter-spacing:.04em;color:#ffd23f;transform:rotate(-8deg);
  text-shadow:0 4px 0 #8e1530,0 8px 0 #12071a,0 0 30px rgba(255,77,99,.8);-webkit-text-stroke:2px #12071a}
.order small{display:block;font:700 20px var(--ui);color:#fff;letter-spacing:.2em;-webkit-text-stroke:0;text-shadow:0 2px 0 #000}
.say{position:absolute;z-index:15;background:#fff;color:#12071a;font:700 17px/1.3 var(--ui);padding:10px 14px;border-radius:4px;box-shadow:0 0 0 3px #12071a,6px 6px 0 #ff4d63;transform:rotate(-3deg)}
.say b{display:block;font-size:12px;letter-spacing:.14em;color:#c2183a}

/* pass 17: job done */
.rays4{position:absolute;z-index:1;left:50%;top:46%;width:1400px;height:1400px;margin:-700px 0 0 -700px;background:repeating-conic-gradient(rgba(255,210,63,.16) 0 7deg,transparent 7deg 18deg);-webkit-mask:radial-gradient(circle,#000 10%,transparent 60%);mask:radial-gradient(circle,#000 10%,transparent 60%)}
.bigstamp{position:absolute;z-index:16;font:700 46px var(--ui);letter-spacing:.12em;padding:4px 22px;border:6px double currentColor;border-radius:8px;transform:rotate(-12deg);text-shadow:0 0 14px currentColor;box-shadow:0 0 22px currentColor,inset 0 0 18px currentColor;background:rgba(10,4,16,.35)}
.loot{position:absolute;z-index:12;font:700 72px var(--num);color:#ffd23f;text-shadow:0 4px 0 #6a4808,0 0 26px rgba(255,210,63,.7);letter-spacing:.02em}
.coin4{position:absolute;z-index:11;width:30px;height:30px;image-rendering:pixelated;filter:drop-shadow(0 3px 0 rgba(0,0,0,.5))}
.chg{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;background:rgba(10,6,20,.6);box-shadow:0 0 0 2px #3a2a5a;font-weight:600;font-size:15px}
.chg .d{margin-left:auto;font:700 18px var(--num)}
.chg .d.up{color:#43cf78}.chg .d.dn{color:#ff5a6e}.chg .d.y{color:#ffd23f}
.chg .from{color:#8a7cae;font-size:13px}

/* pass 18: job botched - police light */
.sirenL,.sirenR{position:absolute;z-index:3;top:0;bottom:0;width:60%;pointer-events:none;mix-blend-mode:screen}
.sirenL{left:0;background:radial-gradient(70% 90% at 0 40%,rgba(255,40,60,.55),transparent 70%)}
.sirenR{right:0;background:radial-gradient(70% 90% at 100% 40%,rgba(40,110,255,.55),transparent 70%)}
.tape4{position:absolute;z-index:13;height:34px;display:flex;align-items:center;gap:34px;white-space:nowrap;overflow:hidden;font:700 17px var(--ui);letter-spacing:.2em;color:#12071a;
  background:repeating-linear-gradient(135deg,#ffd23f 0 26px,#12071a 26px 34px);box-shadow:0 0 0 3px #12071a,0 10px 20px rgba(0,0,0,.5)}
.tape4 span{background:#ffd23f;padding:0 8px}

/* pass 19: the Hero shows up */
.crack{position:absolute;inset:0;z-index:18;pointer-events:none}
.vs4{position:absolute;z-index:16;font:700 84px var(--ui);color:#fff;transform:rotate(-8deg);text-shadow:0 0 0 #000,4px 4px 0 #ff4d63,8px 8px 0 #12071a,0 0 40px rgba(255,255,255,.7)}
.hero4{position:absolute;z-index:17;font:700 40px var(--ui);letter-spacing:.08em;color:#ff4d63;text-shadow:0 3px 0 #12071a,0 0 24px #ff4d63}
.hero4 small{display:block;font:600 15px var(--ui);letter-spacing:.2em;color:#ffd9de}

@media (prefers-reduced-motion:no-preference){
  .speed{animation:speed4 .5s linear infinite}
  @keyframes speed4{to{background-position:0 40px}}
  .band.boss{animation:bandin4 6s ease-out infinite}
  @keyframes bandin4{0%{transform:skewY(-8deg) translateX(-120%)}6%,100%{transform:skewY(-8deg) translateX(0)}}
  .band.crew{animation:bandin4b 6s ease-out infinite}
  @keyframes bandin4b{0%,4%{transform:skewY(-8deg) translateX(120%)}11%,100%{transform:skewY(-8deg) translateX(0)}}
  .rays4{animation:spin 40s linear infinite}
  .bigstamp{animation:stamp4 4s ease-out infinite}
  @keyframes stamp4{0%{transform:rotate(-12deg) scale(2.2);opacity:0}8%{transform:rotate(-12deg) scale(.94);opacity:1}11%,100%{transform:rotate(-12deg) scale(1)}}
  .sirenL{animation:sir4 1s steps(2) infinite}.sirenR{animation:sir4 1s steps(2) infinite reverse}
  @keyframes sir4{50%{opacity:.25}}
  .tape4{animation:tape4 9s linear infinite;background-size:68px 100%}
  @keyframes tape4{to{background-position:68px 0}}
  .vs4{animation:vs4 2.4s ease-in-out infinite}
  @keyframes vs4{50%{transform:rotate(-8deg) scale(1.08)}}
}
'''

CREW_TOP = top(last=('JOB', 'BIKE SHOP'))


def chg(ic, label, frm, d, cls):
    return '<div class="chg"><img class="ic s" src="sprites/%s.png" alt="">%s<span class="from">%s</span><span class="d %s">%s</span></div>' % (ic, label, frm, cls, d)


M8 = fig('m8', 'New · Boss order cut-in (after "Do it")',
 'Pressing Do it on the Card no longer jumps straight to a result. First the Boss gives the order: his portrait slashes in on a crimson band, the grunt answers on a gold band below, and the order is stamped across the middle in huge gold letters. It lasts under two seconds; Enter skips it, and Settings can turn cut-ins off.',
 '''  <canvas class="cv" data-paint="skyline" data-pal="day" data-seed="21" data-tall="1.1" width="960" height="540" style="filter:grayscale(.6) brightness(.35) contrast(1.2)"></canvas>
  <div class="half4"></div>
  <div class="band boss" style="left:-40px;top:40px;width:1040px;height:190px"><div class="speed"></div>
    <img class="por" src="sprites/v-nate.png" alt="The Boss" style="left:40px;top:-20px;width:512px;height:256px"></div>
  <div class="say" style="left:560px;top:96px;width:340px"><b>THE BOSS</b>Remind him who keeps his windows in one piece.</div>
  <div class="order" style="left:120px;top:236px">ORDER: EXTORT<small>CERULEAN BIKE SHOP · 64% · ROSA + 1</small></div>
  <div class="band crew" style="left:-40px;top:350px;width:1040px;height:150px"><div class="speed"></div>
    <img class="por" src="sprites/c-rosa.png" alt="Rosa" style="left:660px;top:-14px;width:107px;height:182px"></div>
  <div class="say" style="left:250px;top:402px;width:360px;box-shadow:0 0 0 3px #12071a,6px 6px 0 #ffd23f"><b>ROSA</b>Consider it done, Boss. He'll pay by noon.</div>
  <div class="keys" style="top:auto;bottom:10px"><span class="key">Enter</span><span>Skip</span></div>
''' + fx('#ff4d63', '#ffd23f'), cls='st kl-red vign grain', style='background:#12071a')

M9 = fig('m9', 'New · Job done',
 'The result gets its own page instead of a line in the log. A PAID IN FULL stamp slams down, the take counts up in huge gold numbers with coins spilling around it, and every change is listed with where it came from: Heat, Dread, Control and Rosa\'s skill. The shop now pays every week, shown as a gold ribbon. Two buttons: back to the map, or straight to the next action.',
 CREW_TOP + '''
  <div class="rays4"></div>
  <img class="spr" src="sprites/c-rosa.png" alt="Rosa" style="left:96px;top:190px;width:110px;height:186px;z-index:6">
  <img class="spr" src="sprites/t-clerk.png" alt="The shop owner" style="left:230px;top:262px;width:72px;height:112px;z-index:6;filter:brightness(.75);transform:scaleX(-1) rotate(-6deg)">
  <div class="shd" style="left:80px;top:368px;width:240px;height:26px"></div>
  <div class="bigstamp" style="left:34px;top:104px;color:#ffd23f;font-size:36px">PAID IN FULL</div>
  <div class="loot" style="left:96px;top:398px">+₽420</div>
  <img class="coin4" src="sprites/g-amulet-coin.png" alt="" style="left:330px;top:410px"><img class="coin4" src="sprites/g-nugget.png" alt="" style="left:300px;top:450px;transform:rotate(20deg)"><img class="coin4" src="sprites/g-amulet-coin.png" alt="" style="left:58px;top:430px;transform:scale(.8)"><img class="coin4" src="sprites/g-big-nugget.png" alt="" style="left:356px;top:458px">
  <div class="pnl gild" style="left:428px;top:92px;width:516px;height:300px">
    <div class="hd y"><img class="ic" src="sprites/g-relic-gold.png" alt="">Extort · Cerulean Bike Shop<span class="r" style="color:#43cf78">rolled 31 under 64</span></div>
    <div class="col" style="gap:7px;margin-top:10px">
      ''' + chg('g-amulet-coin', 'Funds', '₽4,310 → ₽4,730', '+₽420', 'y') + chg('g-fire-stone', 'Heat in Cerulean', '18 → 24', '+6', 'dn') + chg('g-dark-gem', 'Dread', '52 → 55', '+3', 'up') + chg('g-relic-crown', 'Your control', '34 → 42 of 50', '+8', 'up') + chg('c-rosa', 'Rosa · Skill', '61 → 64', '+3', 'up') + '''
    </div>
  </div>
  <div class="bnr" style="left:428px;top:404px;width:516px;font-size:17px;padding:6px 20px;text-align:center">The Bike Shop now pays ₽180 every week</div>
  <div class="cta shine" style="left:428px;top:448px;width:250px;height:52px;font-size:18px;white-space:nowrap">To the Map <span class="kc">Enter</span></div>
  <div class="cta" style="left:694px;top:448px;width:250px;height:52px;font-size:18px;white-space:nowrap;filter:saturate(.6) brightness(.85)">Next action <span class="kc">N</span></div>
''' + fx('#ffd23f', '#ff4d63'), cls='st kl-gold vign grain', style='background:#1a0e05')

M10 = fig('m10', 'New · Job botched',
 'When the roll fails the page turns into a police scene: red and blue lights strobe from both sides, police tape runs across the top, a BOTCHED stamp lands, and Officer Jenny\'s man has Rosa by the collar. What it cost is listed plainly, and the player picks what happens to Rosa right here. Leaving her or getting her caught leads to the police questioning screen.',
 '''  <canvas class="cv" data-paint="skyline" data-seed="21" data-tall="1.1" width="960" height="540" style="filter:brightness(.45) saturate(.6)"></canvas>
  <div class="sirenL"></div><div class="sirenR"></div>
  <div class="tape4" style="left:-20px;right:-20px;top:16px;transform:rotate(-2deg)"><span>POLICE LINE · DO NOT CROSS</span><span>POLICE LINE · DO NOT CROSS</span><span>POLICE LINE · DO NOT CROSS</span></div>
  <img class="spr" src="sprites/t-policeman.png" alt="Police officer" style="left:150px;top:180px;width:112px;height:154px;z-index:6;transform:scaleX(-1)">
  <img class="spr" src="sprites/c-rosa.png" alt="Rosa" style="left:96px;top:196px;width:84px;height:142px;z-index:7;filter:brightness(.9) saturate(.8);transform:rotate(8deg)">
  <div class="shd" style="left:70px;top:330px;width:220px;height:24px"></div>
  <div class="bigstamp" style="left:56px;top:84px;color:#ff4d63">BOTCHED</div>
  <div class="pnl" style="left:28px;top:372px;width:330px;height:140px">
    <div class="hd"><img class="ic" src="sprites/g-fire-stone.png" alt="">What it cost</div>
    <div class="col" style="gap:5px;margin-top:6px">''' + chg('g-fire-stone', 'Heat in Cerulean', '18 → 30', '+12', 'dn') + chg('g-amulet-coin', 'Take', 'rolled 81 over 64', '₽0', 'dn') + '''</div>
  </div>
  <div class="pnl gild" style="left:380px;top:70px;width:564px;height:442px">
    <div class="hd y"><img class="ic" src="sprites/c-rosa.png" alt="">Rosa was caught. What now?</div>
    <div class="col" style="gap:10px;margin-top:12px">
      <div class="ch on"><b>Pay her bail</b><span class="xs" style="display:block;font-weight:500">₽300 · she is back tonight · Regard +4</span><span class="kc" style="position:absolute;right:12px;top:12px">1</span></div>
      <div class="ch"><b>Send Dale to break her out</b><span class="xs mu" style="display:block;font-weight:500">58% · Heat +8 · Dale is busy tomorrow</span><span class="kc" style="position:absolute;right:12px;top:12px">2</span></div>
      <div class="ch"><b>Leave her</b><span class="xs mu" style="display:block;font-weight:500">Free · the police question her · crew Loyalty −6</span><span class="kc" style="position:absolute;right:12px;top:12px">3</span></div>
    </div>
    <div class="quote" style="position:static;margin-top:14px">“Boss… you're coming for me, right?” <b>— Rosa, from the back of the car</b></div>
  </div>
''' + fx('#8fb8ff', '#ff4d63'), cls='st kl-police vign grain', style='background:#0a0e1c')

CRACK = ('<svg class="crack" viewBox="0 0 960 540" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width="2.5" opacity=".75">'
         '<path d="M480 270 L380 120 L350 0"/><path d="M480 270 L620 90 L700 0"/><path d="M480 270 L700 300 L960 280"/><path d="M480 270 L560 460 L540 540"/>'
         '<path d="M480 270 L300 360 L0 420"/><path d="M380 120 L300 160"/><path d="M620 90 L700 130"/><path d="M700 300 L760 380"/><path d="M300 360 L280 460"/></g>'
         '<g fill="none" stroke="#ff4d63" stroke-width="1" opacity=".6"><path d="M480 270 L380 120 L350 0"/><path d="M480 270 L700 300 L960 280"/></g></svg>')

M11 = fig('m11', 'New · The Hero shows up',
 'Sometimes an action is interrupted: the screen cracks like glass, the screen splits in two, and the Hero steps in from the right under a white spotlight while your grunt stands in crimson light on the left. The Hero\'s Threat is shown big. Three choices: battle (the normal battle screen), run and lose the job, or throw a Smoke Ball and gamble on getting away clean.',
 '''  <div class="layer" style="background:linear-gradient(100deg,#2a0610 0 49.6%,#12071a 49.6% 50.4%,#0e1a3a 50.4%)"></div>
  <div class="cone" style="left:600px;top:0;width:280px;height:470px;--cc:rgba(255,255,255,.4)"></div>
  <div class="cone" style="left:80px;top:0;width:260px;height:470px;--cc:rgba(255,77,99,.35)"></div>
  <img class="spr" src="sprites/c-rosa.png" alt="Rosa" style="left:150px;top:150px;width:126px;height:214px;z-index:6">
  <img class="spr" src="sprites/p-houndour.png" alt="Houndour" style="left:270px;top:290px;width:80px;height:82px;z-index:6">
  <img class="spr" src="sprites/t-red.png" alt="Red, the Hero" style="left:660px;top:120px;width:150px;height:244px;z-index:6;transform:scaleX(-1)">
  <div class="shd" style="left:120px;top:360px;width:250px;height:26px"></div><div class="shd" style="left:620px;top:356px;width:230px;height:26px"></div>
  ''' + CRACK + '''
  <div class="vs4" style="left:430px;top:170px">VS</div>
  <div class="hero4" style="left:560px;top:28px;width:380px;text-align:right"><small>A HERO APPEARS</small>RED</div>
  <div class="pnl" style="left:600px;top:372px;width:340px;height:52px;padding:8px 12px;z-index:19">
    <div class="row" style="gap:10px"><span class="xs caps" style="color:#ff9aa8">Threat</span><div class="mt" style="--v:74;--c:#ff4d63;flex:1"></div><b style="font:700 22px var(--num);color:#ff4d63">74</b></div>
  </div>
  <div class="a" style="left:20px;right:20px;bottom:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;z-index:20">
    <div class="ch on"><b>Battle him</b><span class="xs" style="display:block;font-weight:500">Rosa vs Red · win to finish the job</span><span class="kc" style="position:absolute;right:12px;top:12px">1</span></div>
    <div class="ch"><b>Run</b><span class="xs mu" style="display:block;font-weight:500">Safe · lose the job · Heat +2</span><span class="kc" style="position:absolute;right:12px;top:12px">2</span></div>
    <div class="ch"><b>Smoke Ball</b><span class="xs mu" style="display:block;font-weight:500">45% clean escape with the take</span><span class="kc" style="position:absolute;right:12px;top:12px">3</span></div>
  </div>
''' + fx('#ffffff', '#ff4d63'), cls='st kl-red vign grain', style='background:#0a0610')

PAGES = [M8, M9, M10, M11]
PAGE_NAV = [('m8', 'Order'), ('m9', 'Job done'), ('m10', 'Botched'), ('m11', 'Hero')]
REPLACE = []
NOTES = {
 'm8': ['Pass 16 · built: the Boss order cut-in that plays after Do it, with the Boss and the grunt on slashing bands.'],
 'm9': ['Pass 17 · built: Job done, with the stamp, the take, and every change with its before and after.'],
 'm10': ['Pass 18 · built: Job botched, police lights and tape, what it cost, and what to do about the caught grunt.'],
 'm11': ['Pass 19 · built: the Hero interrupt, a cracked split screen with three choices.'],
 's4': ['Interval 4 · Do it now plays the Boss order cut-in, then opens Job done, Job botched, or the Hero page.'],
 'k8': ['Interval 4 · this is where "Leave her" on the Job botched page leads.'],
 'm2': ['Interval 4 · the Cut-ins switch in Effects & motion controls the new order cut-in.'],
}
ALL_NOTE = ''
TITLE = 'Action moments'
BIG = ('An action is now a little show instead of a log line: the Boss gives the order in a cut-in, then the result gets its own page '
       '(Job done, Job botched, or the Hero showing up), each with clear numbers and a choice.')
REVIEW = [
 ('Boss order cut-in', 'Two slashing portrait bands, speed lines, and the order stamped in huge gold letters.',
  'Pressing Do it used to cut straight to a number; now the Boss visibly gives the order.', 'It is a short moment, not a page; Enter skips it.',
  'The Cut-ins switch in Settings, Effects & motion, turns it off.', 'Very: the Boss orders a crime and his grunt says "Consider it done".'),
 ('Job done', 'A slamming PAID IN FULL stamp, gold rays, coins spilling and a huge count-up.',
  'Results used to be a row in the Morning report; now every change shows its before and after.', 'Yes: results got their own page so the map stays clean.',
  'Esc from here goes back to the map like any other page.', 'Yes: you just shook down a shop owner, and he is cowering in the corner.'),
 ('Job botched', 'Red and blue police strobes, rolling police tape and a BOTCHED stamp.',
  'Failures were the same grey line as wins; now failing feels dangerous and forces a choice.', 'Yes: the "what to do about Rosa" choice lives here, not on the map.',
  'Settings "Flashes: Soft" makes the strobes gentle; "Off" stops them.', 'Very: bail, a jailbreak, or leaving her to the police.'),
 ('The Hero shows up', 'The screen cracks like glass, splits into crimson and blue, and a giant VS pulses in the middle.',
  'The Hero used to be a warning banner; now he can actually walk in on a job.', 'Yes: an interrupt page, so the Card does not need a "what if the Hero comes" footnote.',
  'The Hero\'s Threat number matches the one on the Boss Menu.', 'Yes: in an evil game the hero is the boss fight.'),
 ('Wiring the moments', 'Each moment shares the cut-in look, so a run feels like a TV crime show.',
  'The Card (screen 4) now leads somewhere: order, then result. Botched leads into police questioning (Rotom screen 8).', 'Checked every action path: each ends on one result page with one main button.',
  'Every moment page skips with Enter and obeys the Effects & motion settings.', 'Yes: crimes have consequences you can see.'),
]
