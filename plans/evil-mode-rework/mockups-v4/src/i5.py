# Round 4 interval 5 (passes 21-25): villain flavour and polish. The morning paper, the Boss's throne,
# team speak, an audit pass, and the hijacked broadcast finale.
from kit import *

CSS = r'''
/* pass 21: the morning paper */
.desk{position:absolute;inset:0;background:radial-gradient(80% 70% at 40% 40%,#4a2c18,#24140a 70%,#120a05)}
.paper{position:absolute;z-index:6;background:linear-gradient(180deg,#f3ead2,#e6d9b6);color:#231a10;box-shadow:0 0 0 2px #120a05,0 20px 40px rgba(0,0,0,.6);transform:rotate(-2deg)}
.paper::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 70% 20%,rgba(120,80,30,.12),transparent 40%),repeating-linear-gradient(0deg,transparent 0 3px,rgba(0,0,0,.025) 3px 4px)}
.mast4{font:700 40px/1 var(--regal);letter-spacing:.06em;text-align:center;border-bottom:3px double #231a10;padding-bottom:4px}
.dateline{display:flex;justify-content:space-between;font:600 11px var(--ui);letter-spacing:.12em;border-bottom:1px solid #231a10;padding:3px 0;text-transform:uppercase}
.head4{font:700 30px/1.02 var(--regal);letter-spacing:.01em;margin-top:8px}
.deck{font:600 13px/1.3 var(--ui);color:#5a4630;margin-top:4px}
.col4{font:500 11.5px/1.35 var(--ui);color:#3a2c1c;column-count:2;column-gap:12px;column-rule:1px solid rgba(35,26,16,.3)}
.photo4{position:relative;background:#2a2a2a;box-shadow:0 0 0 2px #231a10;overflow:hidden;filter:grayscale(1) contrast(1.1)}
.cap4{font:italic 500 10.5px var(--ui);color:#5a4630;margin-top:3px}
.wanted{position:absolute;z-index:8;background:#e9d29a;color:#3a1a08;text-align:center;padding:8px 10px 10px;box-shadow:0 0 0 2px #3a1a08,0 12px 24px rgba(0,0,0,.5);transform:rotate(4deg)}
.wanted b.w{display:block;font:700 30px var(--regal);letter-spacing:.12em;color:#7a1a08}
.wanted .mug{height:110px;display:grid;place-items:end center;background:linear-gradient(180deg,#c9b27a,#a88d55);box-shadow:inset 0 0 0 2px #3a1a08;overflow:hidden}
.wanted .mug img{filter:sepia(1) contrast(1.2) brightness(.8);image-rendering:pixelated}
.wanted .bty{font:700 22px var(--num);color:#7a1a08;margin-top:4px}
.stars4{color:#ffd23f;letter-spacing:2px;text-shadow:0 0 8px #ffd23f}
.stars4 i{font-style:normal;color:#4a3a5a;text-shadow:none}

/* pass 22: the throne */
.throne{position:absolute;clip-path:polygon(18% 0,82% 0,90% 8%,88% 58%,100% 62%,100% 100%,0 100%,0 62%,12% 58%,10% 8%);
  background:linear-gradient(90deg,rgba(255,77,99,.0) 0 10%,rgba(255,77,99,.5) 10.5% 11.5%,transparent 12% 88%,rgba(255,77,99,.5) 88.5% 89.5%,transparent 90%),linear-gradient(180deg,#3a0a2a,#1a0614 60%,#0c0410)}
.throne::before{content:"";position:absolute;left:50%;top:6%;width:44%;height:22%;margin-left:-22%;background:linear-gradient(180deg,#ffd23f,#9a6a10);clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%);opacity:.75}

@media (prefers-reduced-motion:reduce){.puff{animation:none!important}}

/* pass 25: the hijacked broadcast */
.tv{position:absolute;z-index:6;border-radius:18px;padding:12px;background:linear-gradient(180deg,#3a3440,#1a161e);box-shadow:0 0 0 3px #08060a,inset 0 2px 0 rgba(255,255,255,.15),0 16px 30px rgba(0,0,0,.6)}
.tv .scr{position:relative;width:100%;height:100%;border-radius:12px/16px;overflow:hidden;background:radial-gradient(circle at 50% 45%,#5a0a24,#1a0410 75%);box-shadow:inset 0 0 30px rgba(0,0,0,.8)}
.tv .scr::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 2px,transparent 2px 4px),radial-gradient(ellipse at 50% 50%,transparent 55%,rgba(0,0,0,.55));mix-blend-mode:multiply}
.tv .scr::before{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:linear-gradient(180deg,transparent 0 46%,rgba(255,255,255,.08) 48%,transparent 52%) 0 0/100% 300%}
.tv.sm .scr{background:radial-gradient(circle at 50% 45%,#3a0a2a,#120410 75%)}
.onair{position:absolute;z-index:4;top:10px;left:12px;font:700 13px var(--ui);color:#fff;letter-spacing:.12em;display:flex;align-items:center;gap:6px;text-shadow:0 1px 0 #000}
.onair::before{content:"";width:10px;height:10px;border-radius:50%;background:#ff3b4f;box-shadow:0 0 8px #ff3b4f}
.lower3{position:absolute;z-index:4;left:0;right:0;bottom:30px;padding:6px 14px;background:linear-gradient(90deg,#c2183a,#8e1530 70%,transparent);font:700 20px var(--ui);color:#fff;letter-spacing:.04em;text-shadow:0 2px 0 #000}
.lower3 small{display:block;font:600 11px var(--ui);letter-spacing:.18em;color:#ffd23f}
.ticker4{position:absolute;z-index:4;left:0;right:0;bottom:0;height:30px;display:flex;align-items:center;gap:40px;white-space:nowrap;overflow:hidden;background:#ffd23f;color:#12071a;font:700 14px var(--ui);padding-left:12px}
.ticker4 b{background:#12071a;color:#ffd23f;padding:2px 8px}

@media (prefers-reduced-motion:no-preference){
  .tv .scr::before{animation:roll4 5s linear infinite}
  @keyframes roll4{to{background-position:0 300%}}
  .ticker4 span{animation:tick4 14s linear infinite}
  @keyframes tick4{from{transform:translateX(30%)}to{transform:translateX(-60%)}}
  .onair::before{animation:blink 1.2s steps(2) infinite}
}
'''

# ---------------------------------------------------------------- m12 morning paper
M12 = fig('m12', 'New · The morning paper',
 'Every morning starts with the Kanto Ledger (the same paper as on the Evening screen), folded on the Boss\'s desk. Last night\'s work is the front page: the headline, a grainy photo of your grunt, and a column that quotes the scared shop owner. A WANTED poster for the Boss is pinned over the corner with the bounty going up. The side panel lists what the news changed: notoriety stars, Regard in the town, and the Hero\'s Threat.',
 '''  <div class="desk"></div>
  <img class="spr" src="sprites/g-tea.png" alt="" style="left:858px;top:30px;width:64px;height:64px;z-index:3;filter:drop-shadow(0 6px 4px rgba(0,0,0,.5))">
  <div class="paper" style="left:34px;top:26px;width:560px;height:490px;padding:16px 20px">
    <div class="mast4">The Kanto Ledger</div>
    <div class="dateline"><span>Day 19 · Morning edition</span><span>Cerulean · Saffron · Celadon</span><span>₽2</span></div>
    <div class="head4">GANG SHAKES DOWN CERULEAN BIKE SHOP</div>
    <div class="deck">Owner "too scared to talk"; police have no leads; witnesses describe a purple crest.</div>
    <div class="row" style="gap:14px;margin-top:10px;align-items:flex-start">
      <div style="width:220px;flex:none">
        <div class="photo4" style="height:150px"><canvas class="cv" data-paint="skyline" data-pal="day" data-seed="21" data-tall="1.1" width="960" height="540" style="width:440px;height:248px;left:-110px;top:-60px;animation:none"></canvas>
          <img src="sprites/c-rosa.png" alt="" style="position:absolute;left:120px;top:40px;width:60px;height:102px;image-rendering:pixelated;filter:brightness(.3)"></div>
        <div class="cap4">A figure in purple leaves the shop at noon. Photo: K. Ledger</div>
      </div>
      <div class="col4" style="height:200px">The owner of the Cerulean Bike Shop paid an unknown group a large sum yesterday, according to neighbours. "He just handed it over," said one. Officer Jenny called it "an isolated case". It is the third such report this week. The same crest was painted on a Pewter warehouse on Day 12. Gym Leader Misty declined to comment. Residents are asked to report anyone wearing a purple armband.</div>
    </div>
    <div class="row" style="gap:12px;margin-top:10px;border-top:2px solid #231a10;padding-top:6px">
      <div style="flex:1"><b style="font:700 15px var(--regal)">Young trainer Red vows to "clean up Cerulean"</b><div class="deck" style="font-size:11.5px">The Cascade Badge holder was seen asking questions near Nugget Bridge.</div></div>
      <div style="flex:1"><b style="font:700 15px var(--regal)">Rocket denies any link to new gang</b><div class="deck" style="font-size:11.5px">"Amateurs," says a man in a black cap.</div></div>
    </div>
  </div>
  <div class="wanted" style="left:488px;top:150px;width:168px">
    <b class="w">WANTED</b>
    <div class="mug"><img src="sprites/t-nate.png" alt="The Boss" style="width:74px;height:144px;margin-bottom:-36px"></div>
    <div style="font:600 11px var(--ui);margin-top:4px;letter-spacing:.06em">"THE BOSS" OF THE PURPLE GANG</div>
    <div class="bty">₽12,000</div>
    <div style="font:600 10px var(--ui)">was ₽8,000 · Kanto Police</div>
  </div>
  <div class="pnl gild" style="left:690px;top:120px;width:254px;height:300px">
    <div class="hd y"><img class="ic" src="sprites/g-journal.png" alt="">The news</div>
    <div class="col" style="gap:7px;margin-top:8px">
      <div class="chg">Notoriety<span class="d stars4">★★★<i>★★</i></span></div>
      <div class="chg">Bounty<span class="d y">+₽4,000</span></div>
      <div class="chg">Regard · Cerulean<span class="d dn">−2</span></div>
      <div class="chg">Dread · Cerulean<span class="d up">+4</span></div>
      <div class="chg">Hero Threat<span class="d dn">+3</span></div>
      <div class="chg">Rocket Tension<span class="d dn">+4</span></div>
    </div>
  </div>
  <div class="cta shine" style="left:690px;top:436px;width:254px;height:56px;font-size:19px;white-space:nowrap">Fold the paper <span class="kc">Enter</span></div>
''' + fx('#ffcf8a', '#ff4d63'), cls='st kl-warm vign grain', style='background:#120a05')

# ---------------------------------------------------------------- m13 hijacked broadcast
def small_tv(x, y, w, h, tint):
    return ('<div class="tv sm" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx;padding:6px;border-radius:10px"><div class="scr" style="filter:hue-rotate(%ddeg)">'
            '<div class="sig4 c" style="left:-10px;top:-6px;width:%dpx;height:%dpx;opacity:.5;animation:none"></div>'
            '<img src="sprites/v-nate.png" alt="" style="position:absolute;left:50%%;bottom:0;width:%dpx;transform:translateX(-50%%);image-rendering:pixelated;opacity:.8"></div></div>') % (
        x, y, w, h, tint, w, h, w * 1.1)


M13 = fig('m13', 'New · The hijacked broadcast (after a Takeover)',
 'The finale of a Takeover night. The Boss cuts into every TV in the city: a wall of old sets all show his face, and the big one in the middle plays the full broadcast with a LIVE tag, a crimson lower third that says Team Nova now controls Cerulean, and a gold news ticker listing what changed. It plays once per town taken and can be skipped.',
 '''  <div class="layer" style="background:radial-gradient(70% 70% at 50% 50%,#2a0a20,#0a0410 75%)"></div>
  ''' + small_tv(24, 30, 170, 130, 0) + small_tv(24, 176, 170, 130, 30) + small_tv(24, 322, 170, 130, -20)
 + small_tv(766, 30, 170, 130, 15) + small_tv(766, 176, 170, 130, -35) + small_tv(766, 322, 170, 130, 0) + '''
  <div class="tv" style="left:214px;top:28px;width:532px;height:404px">
    <div class="scr">
      <div class="sig4 c" style="left:110px;top:0;width:290px;height:320px;opacity:.35"></div>
      <img src="sprites/v-nate.png" alt="The Boss on TV" style="position:absolute;left:50%;bottom:58px;width:420px;height:210px;transform:translateX(-50%);image-rendering:pixelated">
      <div class="onair">LIVE · ALL CHANNELS</div>
      <div class="lower3"><small>TEAM NOVA · SPECIAL BROADCAST</small>Team Nova now controls Cerulean City</div>
      <div class="ticker4"><span><b>NOVA</b> All Cerulean businesses now pay Team Nova · Rocket loses Nugget Bridge · Police chief "reviewing options" · Gym Leader Misty missing since noon · <b>NOVA</b></span></div>
    </div>
  </div>
  <div class="say" style="left:250px;top:446px;width:460px;transform:rotate(-1deg)"><b>THE BOSS, ON EVERY SCREEN</b>Good evening, Cerulean. Nothing changes for you, except who you work for.</div>
  <div class="keys" style="top:auto;bottom:14px"><span class="key">Enter</span><span>Skip</span></div>
''' + fx('#ff4d63', '#c9a0ff'), cls='st kl-red vign grain', style='background:#0a0410')

PAGES = [M12, M13]
PAGE_NAV = [('m12', 'Paper'), ('m13', 'Broadcast')]

_THRONE = ('<div class="throne" style="left:56px;top:196px;width:182px;height:300px"></div>'
           '<img class="spr" src="sprites/p-persian.png" alt="Persian" style="left:196px;top:410px;width:97px;height:87px;z-index:7">')
PAGE_REPLACE = [
 # pass 22: the throne and the Boss's cat
 ('m1', '<div class="shd" style="left:64px;top:478px;width:180px;height:30px"></div>', _THRONE + '<div class="shd" style="left:64px;top:478px;width:230px;height:30px"></div>'),
 # pass 23: team speak
 ('m1', '<span class="bl">Resume<small>back to the Morning</small></span>', '<span class="bl">Back to work<small>the Morning is waiting</small></span>'),
 # pass 24: Q is the command wheel now, so Quit moves off Q
 ('m1', '<span class="bl">Quit to Title</span><span class="kc">Q</span>', '<span class="bl">Go into hiding<small>save and quit to title</small></span><span class="kc">End</span>'),
 ('m1', '“Nobody remembers the second-best criminal.”', '“Kanto doesn\'t need a hero. It needs a landlord.”'),
 ('m3', '<img class="spr" src="sprites/c-mina.png" alt="Mina"', '<div class="bub" style="left:170px;top:196px;width:132px;--tx:18px;font-size:13px">Mina: “Scouting? Again? ...Fine, Boss.”</div><img class="spr" src="sprites/c-mina.png" alt="Mina"'),
 ('m3', 'flex-direction:column;gap:2px;font-size:19px">Send Mina<span', 'flex-direction:column;gap:2px;font-size:19px">Give the order<span'),
]
REPLACE = [
 ('k3', '<span class="key">Q</span><span class="key">E</span><span>Next member</span>', '<span class="key">◀</span><span class="key">▶</span><span>Next member</span>'),
]
NOTES = {
 'm1': ['Interval 5 · the Boss sits on a crimson throne with his Persian; the menu speaks like a villain (Back to work, Go into hiding); Quit moved off Q because Q is the wheel; new quote.'],
 'm3': ['Interval 5 · Mina talks back in a bubble, and the button says Give the order.'],
 'm12': ['Pass 21 · built: the Kanto Ledger with last night\'s crime on the front page and a WANTED poster for the Boss.'],
 'm13': ['Pass 25 · built: the finale, a wall of TVs all showing the Boss\'s broadcast after a Takeover.'],
 's2': ['Interval 5 · the morning now opens with the paper (new page) before this report.'],
 'k3': ['Interval 5 · paging between crew files moved from Q/E to the arrow keys, because Q now opens the command wheel.'],
 's9': ['Interval 5 · after the Takeover, the hijacked broadcast plays (new page).'],
}
ALL_NOTE = ''
TITLE = 'Villain flavour and polish'
BIG = ('The game now talks and acts like a villain: the morning paper reports your crimes, the Boss has a throne and a cat, '
       'menus say "Back to work" and "Go into hiding", grunts talk back, and taking a town ends with the Boss hijacking every TV.')
REVIEW = [
 ('The morning paper', 'A cream newspaper on a dark desk, a sepia WANTED poster with a rising bounty, notoriety stars.',
  'Results were numbers; now the world reacts to your crimes in its own words.', 'Yes: news gets its own page, so the Morning report keeps only your crew\'s news.',
  'Esc folds the paper; it sits in the board between Title and Morning.', 'Very: you read about yourself as the bad guy and your bounty goes up.'),
 ('The throne', 'The Boss sits on a tall crimson throne with a gold crest, and his Persian lies at his feet.',
  'The Menu had the Boss standing under a spotlight; now it is his seat of power.', 'No new page.',
  'The Boss Menu is literally the Boss\'s chair.', 'Yes: the villain with a cat is the oldest evil-boss picture in the book.'),
 ('Team speak', 'Every new page now uses gang words: Back to work, Go into hiding, Give the order, and grunts answer in bubbles.',
  'The menu read like any game; now it reads like a crime boss\'s office.', 'Checked: renaming made no page busier.',
  'Menu items keep their keys; only the words changed.', 'Yes: even pausing sounds criminal.'),
 ('Audit', 'Checked every page for clashes and fixed what turned up.',
  'Found and fixed: Quit was on Q, which is now the wheel (moved to End); the Crew File paged with Q and E (now the arrow keys); the paper now has the same name as the one on the Evening screen; long button text wrapped (shortened); the board\'s note covered a photo (moved).',
  'Counted 13 new pages; each one exists to take something off a busier screen or give a big moment its own space.',
  'Every page has Esc, the wheel key or Enter shown; Settings has one list. No company names appear on screen; Rotom is called Rotom everywhere; with reduced motion on, nothing on any screen moves.',
  'Checked tone on every page: the words are villain-flavoured but stay readable for kids.'),
 ('The hijacked broadcast', 'A wall of seven TVs, scanlines, a LIVE tag, a crimson lower third and a rolling gold ticker.',
  'Takeover used to end on the map; now it ends with the Boss addressing the whole city.', 'Yes: a finale page that plays once per town.',
  'Skippable with Enter; the Cut-ins setting can turn it off.', 'Very: the villain hijacking TV is the classic evil-team moment.'),
]
