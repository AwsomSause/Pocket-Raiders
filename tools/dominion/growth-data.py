"""DOMINION D10: the hand-made Growth data (Part 1 §3.2, Part 3 §5, Part 9 A10) -> src/data/dominion/growth.json.
Run from the repo root: python3 -I tools/dominion/growth-data.py"""
import json
P = {}
def play(id, **k): P[id] = k
ANYK = ['any']
play('loan-shark', kinds=ANYK, cost=300, effect='loan', win='You lend ₽300 at a "friendly" rate. ₽{back} is due back on Day {due}.')
play('buy-out', kinds=['shop', 'site', 'dock', 'crowd', 'street'], effect='buyOut', win='{target} is yours: the keys, the books and the staff.')
play('museum-heist', kinds=['site'], chance=45, heat=4, failHeat=10, crate='museum', gate='contact', battle=dict(chance=40, on='fail', foe='target'),
     win='Glass, a soft click, and the case is empty by morning: {loot}. The Fence will want to see this.', lose='A guard on a late round. You leave the case where it was.')
play('fence', kinds=ANYK, effect='fence', gate='contact', win='The Fence looks it over and pays.')
play('three-on-one', kinds=['route', 'street', 'crowd'], chance=60, prize=3, heat=2, failHeat=3, dread=2, battle=dict(chance=100, on='always', foe='target'),
     win='Three of them, one of you. Prize money times three: ₽{pay}.', lose='Three was too many today.')
play('gauntlet', kinds=['route', 'street', 'crowd', 'dock', 'cave'], effect='storm', dread=2, win='Five fights, no rest: you walk the gauntlet.')
play('rooftop-chase', kinds=ANYK, chance=60, heat=-10, gate='heat20', win='Over the roofs and down a fire escape. They lose you in the washing lines. Heat −10.', lose='A dead end, a whistle, and a long talk at the station.')
play('hire-a-specialist', kinds=ANYK, effect='specialist', band=2, win='{name} shakes your hand and puts the tool kit down.')
play('forge-papers', kinds=ANYK, chance=70, effect='forge', win='A permit, a stamp, a signature nobody can tell apart. One forged paper ready.', lose='The ink runs. You burn it.')
play('hack-the-terminal', kinds=['site', 'police'], chance=50, failHeat=8, wanted=-5, effect='scoutDistrict', battle=dict(chance=30, on='fail', foe='police'),
     win='A file copied, a warrant gone. Every place in {district} is scouted, and Wanted falls 5.', lose='The screen locks. Somewhere an alarm rings.')
play('dig-the-dirt', kinds=['shop', 'site', 'gym', 'police', 'dock', 'center', 'street'], chance=55, effect='dirt', win='A name, a date, a photo nobody was meant to see. You have dirt on {owner}.', lose='Nothing. They are cleaner than they look.')
play('kidnap-a-pokemon', kinds=['street', 'site', 'shop', 'center'], chance=45, heat=5, failHeat=12, band=3, effect='kidnap', battle=dict(chance=40, on='fail', foe='target'),
     win='A back door, a Ball in your coat. {mon} is in the Pens, cooling off.', lose='The Pokémon cries out. Lights come on upstairs.')
play('hit-a-lab', kinds=['site'], chance=45, heat=6, failHeat=12, crate='lab', effect='labHit', battle=dict(chance=45, on='fail', foe='target'),
     win='Parts, data and a fridge of samples: {loot}.', lose='The lab aide is still at the desk. You walk on by.')
play('pokemon-swap-meet', kinds=ANYK, cost=300, effect='swap', gate='contact', win='The Fence opens a crate of Balls. One of them is yours now: {mon}, in the Reserve.')
play('fossil-dig', kinds=['cave', 'route'], chance=55, crate='fossil', win='You dig until your hands hurt: {loot}.', lose='Rock, rock, and more rock.')
play('smuggle', kinds=ANYK, chance=55, heat=3, failHeat=10, pay=[300, 700], effect='smuggle', battle=dict(chance=30, on='fail', foe='police'),
     win='The van rolls into {district} with its lights off. ₽{pay}.', lose='A checkpoint on the bridge. You turn the van round.')
play('open-a-black-market-stall', kinds=ANYK, cost=500, effect='stall', win='A back room, a curtain, and three shelves of things nobody should sell.')
play('run-the-docks', kinds=['dock'], chance=50, heat=4, failHeat=9, pay=[200, 500], weekly=200, win='The ships pay to unload: ₽{pay}, and the harbour pays every week now.', lose='The harbour master has friends in uniform.')
play('underground-auction', kinds=ANYK, chance=60, heat=3, failHeat=6, pay=[800, 2000], win='Paddles go up in a dark room. The best bid: ₽{pay}.', lose='The bidders smell police. The room empties.')
play('contraband-run', kinds=ANYK, chance=55, heat=4, failHeat=10, pay=[600, 1000], battle=dict(chance=35, on='fail', foe='police'),
     win='Banned goods, past the checkpoint in a crate of cabbages: ₽{pay}.', lose='They open the cabbages.')
play('tunnel', kinds=ANYK, chance=70, heat=-5, effect='hide', win='A tunnel under the street, a way out nobody knows. You lie low tonight. Heat −5.', lose='The roof of the tunnel comes down. Start again.')
play('air-drop', kinds=ANYK, chance=65, heat=2, failHeat=6, pay=[250, 500], gate='fly', win='A Flying Pokémon drops the parcel on a roof in {district}: ₽{pay}.', lose='Wind. The parcel lands in the river.')
play('safehouse-network', kinds=ANYK, cost=300, effect='safehouse', win='A flat above a shop in {district}, rent paid in cash. Heat cools faster there.')
play('rare-candy-ring', kinds=ANYK, chance=55, heat=4, failHeat=8, crate='candy', gate='contact', win='The candy money comes in, with a little extra in the box: {loot}. (The game has no Rare Candy item, so the ring pays in cash.)', lose='The courier never shows.')
play('fake-shipment', kinds=ANYK, chance=65, heat=-5, wanted=-5, effect='jam', win='The police chase an empty crate across town. Heat −5, Wanted −5.', lose='They see through it.')
play('post-flyers', kinds=ANYK, effect='flyers', win='Flyers on every lamp post in {district}.')
play('spread-the-word', kinds=ANYK, chance=75, regard=3, win='You talk up the team on every corner of {district}. Regard +3.', lose='People listen, nod, and forget.')
play('bribe', kinds=ANYK, effect='bribe', win='An envelope changes hands.')
play('sabotage-the-station', kinds=['police'], chance=50, failHeat=12, wanted=-10, effect='jam', battle=dict(chance=40, on='fail', foe='police'),
     win='Cut wires, a jammed radio, a flat tyre on every car. Wanted −10, and no patrol tonight.', lose='Officer Jenny is working late.')
play('dodge-looker', kinds=ANYK, chance=55, effect='dodge', gate='wanted60', win='You move the books, burn the notes and change the locks. Looker goes home empty-handed this week.', lose='Looker writes something down and smiles.')
play('evidence-locker-visit', kinds=['police'], chance=45, failHeat=12, wanted=-15, battle=dict(chance=40, on='fail', foe='police'),
     win='Three boxes of evidence, gone. Wanted −15.', lose='The locker room has a new lock.')
play('sabotage', kinds=ANYK, chance=55, heat=2, failHeat=6, rival=-8, effect='rivalHit', win="Sand in the gears of the rival team's work in {district}.", lose="The rival team's guards are awake.")
play('raid', kinds=['site', 'police', 'dock', 'shop', 'center'], effect='storm', squad=3, win='You storm {target}.')
play('hire-mercenaries', kinds=ANYK, cost=800, effect='mercs', win='Hard faces for hire. They are yours for {days} days: every fight job is easier.')
play('gym-takeover', kinds=ANYK, chance=55, effect='gym', win='The Gym in {district} is yours.', lose='The Gym holds.')
play('intimidate-a-leader', kinds=ANYK, chance=60, dread=2, gate='gymScouted', effect='gymPress', battle=dict(chance=25, on='fail', foe='target'),
     win='You wait outside their house. {leader} gets the message: shaken for a week.', lose='{leader} stares you down.')
play('court-a-leader', kinds=ANYK, chance=65, cost=200, regard=1, gate='gymScouted', effect='gymCourt', win='A gift, a dinner, a favour. {leader} likes you a little.', lose='{leader} sends the gift back.')
play('rig-the-badge', kinds=ANYK, chance=55, failHeat=8, gate='gymAlly', effect='gymRig', win='The badge case is marked: the {badge} Badge is yours without a fight.', lose='An inspector is in the Gym today.')
play('midnight-market', kinds=ANYK, chance=70, heat=2, failHeat=5, pay=[150, 450], gate='contact', win='Lanterns under the bridge. You trade until dawn: ₽{pay}.', lose='Nobody wants what you have tonight.')
play('blackout', kinds=ANYK, chance=60, heat=-6, failHeat=6, effect='jam', win='The lights go out across {district}. Your tracks go with them. Heat −6.', lose='The backup generator hums.')
play('night-raid', kinds=['site', 'dock', 'shop', 'street'], effect='storm', squad=3, win='A night raid on {target}.')
play('the-big-night', kinds=ANYK, effect='bigNight', win='The Big Night: three more night jobs before dawn.')

later = {'interrogate': 'D23', 'hostage-trade': 'D23'}
crates = {
    'museum': dict(picks=1, cash=[100, 300], items=[['moon-stone', 2], ['sun-stone', 1], ['shiny-stone', 1], ['dusk-stone', 1], ['dragon-scale', 1], ['oval-stone', 2]]),
    'lab': dict(picks=2, cash=[0, 200], items=[['up-grade', 1], ['metal-coat', 1], ['thunder-stone', 1], ['lucky-egg', 1], ['timer-ball', 2], ['quick-ball', 2]]),
    'fossil': dict(picks=1, cash=[0, 50], items=[['moon-stone', 2], ['oval-stone', 2], ['fire-stone', 1], ['water-stone', 1], ['thunder-stone', 1], ['leaf-stone', 1]]),
    'candy': dict(picks=1, cash=[200, 500], items=[['lucky-egg', 1], ['oval-stone', 2]]),
    'raid': dict(picks=3, cash=[300, 900], items=[['ultra-ball', 2], ['revive', 2], ['full-heal', 2], ['timer-ball', 1], ['moon-stone', 1], ['lucky-egg', 1]]),
    'gauntlet': dict(picks=1, cash=[500, 700], items=[['lucky-egg', 1], ['ultra-ball', 2], ['revive', 1], ['quick-ball', 2]]),
}
B = lambda target, name, price, income, clean, perk, text, **k: dict(target=target, name=name, price=price, income=income, clean=clean, perk=perk, text=text, **k)
business = [
    B('pewter-mart', 'Pewter Poké Mart', 6000, 250, True, dict(kind='items', n=3, item='poke-ball'), 'Your Balls on the shelf: 3 Poké Balls a week.'),
    B('viridian-mart', 'Viridian Poké Mart', 5000, 200, True, dict(kind='items', n=2, item='potion'), '2 Potions a week from the stockroom.'),
    B('bike-shop', 'Cerulean Bike Shop', 4000, 180, True, dict(kind='odds', n=5), 'Fast bikes for the crew: +5% on jobs in Cerulean.'),
    B('celadon-store', 'Celadon Department Store', 15000, 600, True, dict(kind='regard', n=1), 'Six floors and a rooftop. Regard +1 in Celadon each week.'),
    B('game-corner', 'Celadon Game Corner', 20000, 500, False, dict(kind='clean', n=200), "Rocket's front. Big laundering: ₽200 of dirty money comes out clean each week.", rival=True),
    B('lavender-mart', 'Lavender Poké Mart', 3500, 150, True, dict(kind='heatDown', n=2), 'A quiet shop in a quiet town: Heat −2 in Lavender each week.'),
    B('fuchsia-mart', 'Fuchsia Poké Mart', 4500, 180, True, dict(kind='items', n=1, item='great-ball'), 'A Great Ball a week.'),
    B('vermilion-harbour', 'Vermilion Harbour', 12000, 400, False, dict(kind='odds', n=5), 'Ships that ask no questions: +5% on jobs in Vermilion.'),
    B('silph-co', 'Silph Co. floors', 30000, 800, True, dict(kind='items', n=2, item='ultra-ball'), 'Tech parts and research: 2 Ultra Balls a week. Master Ball research comes with the regions (D15).', rival=True),
    B('saffron-station', 'Saffron Daily (station newsstand)', 8000, 250, True, dict(kind='heroDown', n=1), "You control the Morning Report's spin: the Hero's Threat −1 a week."),
    B('safari-gate', 'Safari Zone gate', 9000, 300, True, dict(kind='income', n=100), 'Holiday money at the gate: +₽100 a week.'),
    B('fighting-dojo', 'Saffron Fighting Dojo', 10000, 200, True, dict(kind='odds', n=5), 'A battle venue: hard trainers, +5% on jobs in Saffron.'),
]
T = lambda name, cls, species, offset=-1: dict(name=name, cls=cls, leaderId=None, species=species, offset=offset)
gyms = [
    dict(id='pewter-gym', district='pewter', leader='Brock', leaderId='brock', type='rock', badge='Boulder', species=['geodude', 'onix'], offset=1,
         trainers=[T('Camper Liam', 'camper', ['geodude', 'sandshrew'])]),
    dict(id='cerulean-gym', district='cerulean', leader='Misty', leaderId='misty', type='water', badge='Cascade', species=['staryu', 'starmie'], offset=1,
         trainers=[T('Swimmer Luis', 'swimmer', ['horsea', 'shellder']), T('Picnicker Diana', 'picnicker', ['goldeen', 'seaking'])]),
    dict(id='vermilion-gym', district='vermilion', leader='Lt. Surge', leaderId='lt-surge', type='electric', badge='Thunder', species=['voltorb', 'pikachu', 'raichu'], offset=2,
         trainers=[T('Worker Dwayne', 'worker', ['pikachu', 'magnemite']), T('Guitarist Baily', 'guitarist', ['voltorb', 'magnemite'])]),
    dict(id='celadon-gym', district='celadon', leader='Erika', leaderId='erika', type='grass', badge='Rainbow', species=['victreebel', 'tangela', 'vileplume'], offset=2,
         trainers=[T('Aroma Lady Tamia', 'aroma-lady', ['bellsprout', 'oddish']), T('Lass Kay', 'lass', ['bellsprout', 'weepinbell'])]),
    dict(id='fuchsia-gym', district='fuchsia', leader='Koga', leaderId='koga', type='poison', badge='Soul', species=['koffing', 'muk', 'weezing'], offset=3,
         trainers=[T('Hex Maniac Kirk', 'hex-maniac', ['grimer', 'koffing']), T('Roughneck Phil', 'roughneck', ['venonat', 'golbat'])]),
    dict(id='saffron-gym', district='saffron', leader='Sabrina', leaderId='sabrina', type='psychic', badge='Marsh', species=['kadabra', 'mr-mime', 'alakazam'], offset=3,
         trainers=[T('Psychic Johan', 'psychic', ['slowpoke', 'drowzee']), T('Psychic Cameron', 'psychic', ['kadabra', 'hypno'])]),
    dict(id='cinnabar-gym', district='cinnabar', leader='Blaine', leaderId='blaine', type='fire', badge='Volcano', species=['growlithe', 'ponyta', 'rapidash', 'arcanine'], offset=4,
         trainers=[T('Firebreather Ned', 'firebreather', ['vulpix', 'ponyta']), T('Firebreather Lowell', 'firebreather', ['growlithe', 'magmar'])]),
    dict(id='viridian-gym', district='viridian', leader='Giovanni', leaderId='giovanni', type='ground', badge='Earth', species=['rhyhorn', 'dugtrio', 'nidoqueen', 'nidoking', 'rhydon'], offset=4,
         trainers=[T('Black Belt Atsushi', 'black-belt', ['machop', 'machoke']), T('Ace Trainer Yuji', 'ace-trainer', ['sandslash', 'graveler'])],
         only=['beat'], why="Rocket's own Boss runs this Gym: it falls when Rocket falls (D14). You can only beat him."),
]
ways = [
    dict(id='beat', name='Beat', text='Beat the Leader. A badge and Dread, but the Gym stays theirs.', stat=None, chance=100),
    dict(id='buy', name='Buy', text='Buy the building and the sponsors with clean money. The Leader stays as your puppet.', stat=None, chance=100),
    dict(id='break', name='Break', text='Raid the Gym: every trainer, then the Leader, no rest. The Leader flees and the Gym is yours.', stat=None, chance=100),
    dict(id='blackmail', name='Blackmail', text='Scout them three times to find the secret, then confront them. The Leader works for you, quietly.', stat='nerve', chance=55),
    dict(id='convert', name='Convert', text='Once beaten, win them over. The Leader joins as an Admin and the Gym trains your crew.', stat='charm', chance=40),
]
doc = {
    '_source': 'Part 1 §3.2, Part 3 §5, Part 9 A10 (plans/evil-mode-rework); D10 hand data, made by tools/dominion/growth-data.py',
    'play': P, 'later': later, 'crates': crates, 'business': business,
    'buyOut': dict(cornered=3, forcedPct=50, forcedHeat=20, forcedRegard=-5, off=[0, 5, 10, 15, 20]),
    'gyms': gyms, 'ways': ways,
    'gym': dict(patron=15, buy=25000, blackmailScouts=3, control=20, beatDread=5, takeDread=8, regardBuy=3, breakHero=15,
                defiance=dict(max=10, tell=7, heat=15, hero=20, start=dict(buy=0, blackmail=2)),
                **{'raise': 2000}, raiseDrop=3, wallBand=4, wallPlus=2, shakenDays=7, shakenLevels=3, courtDrop=2, rigHeat=6, appointCost=0),
    'raid': dict(fights=dict(site=4, police=5, dock=3, shop=3, center=3, street=3, crowd=3, route=3, cave=3, ghost=3), control=15, dread=6, rival=-12, crate='raid', levelStep=1, failHeat=12),
    'gauntlet': dict(fights=5, crate='gauntlet'),
    'flyers': dict(cost=100, heat=1, tornAt=40, walkIn=25, perStep=5, maxWalkIns=2, designs=[
        dict(id='pride', name='Pride', motto='"We look after our own."', does='regard', n=1),
        dict(id='fist', name='The Fist', motto='"Join, or get out of the way."', does='dread', n=1),
        dict(id='pay', name='The Pay Packet', motto='"Steady work. Cash on Friday."', does='walkIn', n=15)]),
    'bribe': [
        dict(id='officer', name='A police officer', cost=300, wanted=-10, heat=0, days=7, text='Wanted −10; no patrol in this district for a week.'),
        dict(id='clerk', name='A town clerk', cost=200, wanted=0, heat=-10, days=0, text='Heat −10 in this district; the paperwork goes missing.'),
        dict(id='assistant', name="A Leader's assistant", cost=250, wanted=0, heat=0, days=0, text="The Gym here counts as scouted once more (Blackmail needs three)."),
    ],
    'fence': dict(rate=[70, 70, 85, 85, 100], shop=40),
    'smuggle': dict(nightly=[80, 200], base=1, seizeHeat=40, seizePct=10),
    'specialists': [
        dict(id='fence', name='a Fence', cost=1500, wage=100, text='A Black Market contact: Fence, Swap Meet, the Midnight Market and the Candy Ring open.'),
        dict(id='forger', name='a Forger', cost=1200, wage=80, text='Forge Papers +15%, and a forged paper every week.', odds={'forge-papers': 15}),
        dict(id='hacker', name='a Hacker', cost=1500, wage=100, text='Hack the Terminal and Blackout +15%.', odds={'hack-the-terminal': 15, 'blackout': 15}),
        dict(id='medic', name='a Medic', cost=1000, wage=60, text='Hurt members heal a day sooner each night.'),
        dict(id='chef', name='a Chef', cost=800, wage=50, text="The crew's Morale +2 every week."),
    ],
    'loan': dict(out=300, back=390, days=7, defaultPct=15),
    'stall': dict(weekly=150),
    'safehouse': dict(cost=300, cool=2),
    'mercs': dict(days=3, odds=10),
    'swap': dict(cost=300, trust=3),
    'lab': dict(rare=['porygon', 'eevee', 'omanyte', 'kabuto', 'aerodactyl']),
    'revive': dict(species=['omanyte', 'kabuto', 'aerodactyl'], level=[10, 20]),
    'lines': {
        'noBiz': 'There is no business here to buy.', 'ownBiz': 'You already own {name}.', 'rivalBiz': '{name} is the rival team\'s while they hold {district}.',
        'cornered': '{owner} is Cornered: they will sell at half price.', 'cornerStep': 'Squeezed {n} of {need} times: at {need}, they sell at half.',
        'bizBought': '{name} is yours (₽{price}). It pays ₽{income} a week{clean}.', 'bizForced': '{name} is yours, forced at half price (₽{price}). Heat +{heat}, Regard −{regard}.',
        'bizWeek': 'Your businesses paid ₽{n} this week.', 'needClean': 'You need ₽{n} of clean money (you have ₽{have}).',
        'noGym': 'There is no Gym in {district}.', 'gymOnly': '{why}', 'gymYours': 'The {district} Gym is yours.', 'gymNotBeaten': 'Beat {leader} first.',
        'gymScouts': 'Scout {district} {n} more time(s) to find {leader}\'s secret.', 'gymMinor': 'This Leader is a minor: you can only beat them.',
        'beat': 'You beat {leader}. The {badge} Badge is yours. The Gym stays theirs.', 'took': 'The {district} Gym is yours ({way}). Control +{control}.',
        'fled': '{leader} runs out the back door. They may go to the Hero.', 'converted': '{leader} shakes your hand. They will join when the HQ has room (Admin).',
        'broadcast': '{name} gets the flyers into {district} too.', 'burrowed': '{name} slips the route to {district} past a raid (once a week).',
        'chainNext': 'Fight {n} of {of}: {name} next.', 'chainWon': 'All {of} fights won.', 'chainLost': 'Beaten at fight {n} of {of}. You pull back.',
        'raidWon': '{target} falls: {loot}. Control +{control}, Dread +{dread}.', 'gauntletWon': 'The gauntlet is done: {loot}.',
        'defiance': '{leader}\'s Defiance: {n}/10.', 'told': '{leader} has told the Hero everything. Heat +{heat}, Hero Threat +{hero}.',
        'breaks': '{leader} breaks with you in public and waits for you at the Gym.', 'defiantWon': '{leader} is put back in line. Defiance {n}.',
        'defiantLost': '{leader} keeps the Gym. It is theirs again.', 'raised': 'A raise for {leader}: Defiance −{n}.',
        'appointed': '{name} now leads the {district} Gym. The Hero must beat them for the badge.', 'unappointed': 'The {district} Gym has no Leader of yours.',
        'flyersUp': 'Flyers up in {district} (₽{cost} a week).', 'flyersAgain': 'Flyers in {district} refreshed.', 'flyersTorn': 'The police tear down your flyers (Wanted {n}).',
        'flyersWeek': 'Flyers cost ₽{n} this week.', 'walkIn': '{name}, {cls}, walked in with one of your flyers.', 'flyersBroke': 'No money for the flyers: they come down.',
        'bribed': '{who} takes the envelope. {text}', 'noHot': 'You have no stolen goods to sell.', 'fenced': 'The Fence pays ₽{n} for {items} ({pct}%).',
        'route': 'A smuggling route to {district} now pays ₽{n} a night.', 'routesFull': 'All your routes are busy.', 'routePay': 'Smuggling routes paid ₽{n}.',
        'seized': 'Police seize a shipment on the {district} route. The route is gone.', 'kidnapped': '{mon} is in the Pens, cooling off.',
        'labRare': 'Lab data points to a rare one: {mon} joins the Pens.', 'loanOut': 'A loan of ₽{out} is out: ₽{back} back on Day {due}.',
        'loanBack': 'A borrower pays back ₽{n}.', 'loanGone': 'A borrower skips town with your ₽{n}.', 'hired': '{name} joins your payroll (₽{wage} a week).',
        'hiredAlready': 'You already have {name}.', 'specWage': 'Specialists\' wages: ₽{n}.', 'forged': 'A forged paper is ready ({n} held).',
        'paperUsed': 'A forged paper gets you through the checkpoint in {district}.', 'dirt': 'You have dirt on {owner} now.',
        'dirtGym': 'The dirt counts as a scout on {leader}.', 'stallUp': 'The stall pays ₽{n} a week.', 'stallWeek': 'The black-market stall took ₽{n}.',
        'safehouse': 'A safehouse in {district}: Heat there cools {n} more each night.', 'safehouseHave': 'You already have a safehouse in {district}.',
        'mercs': 'Mercenaries until Day {day}.', 'jam': 'No patrol in {district} tonight.', 'dodged': 'Looker skips you this week.',
        'shaken': '{leader} is shaken until Day {day}: −{n} levels when you fight them.', 'courted': '{leader} owes you a favour: Defiance −{n}.',
        'rigged': 'The {badge} Badge, without a fight.', 'bigNight': 'Three more night actions tonight.', 'bigNightDone': 'The Big Night was this week already.',
        'noLeader': 'Nobody to put at the Gym yet (a Captain or higher).', 'chef': 'The chef cooks: Morale +2 for the crew.', 'medic': 'The medic patches up {name}.',
        'interest': 'Interest on idle money: ₽{n}.', 'swapNone': 'The Fence has nothing for you today.', 'squad': 'Squad: {names}.',
        'noBadge': 'You have this badge already.', 'stealthSave': 'Hot goods: {n}.', 'contact': 'Needs a Black Market contact (hire a Fence, or a Black Market Counter).',
        'heat20': 'Needs Heat 20 or more here.', 'wanted60': 'Needs Wanted 60 or more.', 'gymScouted': 'Scout the Gym first (the district it stands in).',
        'gymAlly': 'Needs a Gym ally: one you own or a Leader you courted.', 'fly': 'Needs a Pokémon that knows Fly.', 'surf': 'Needs a Pokémon that knows Surf.',
        'jailed': 'Needs a member in a cell.', 'fell': 'Needs a member who got hurt.', 'gymYoursCard': 'The Gym is yours: pick a Leader, or give them a raise.',
        'revived': '{name} revives a fossil: {mon} joins the Pens.', 'stocked': '{name} stocks the stores: {n} Potions.', 'hauled': '{name} runs goods: ₽{n}.',
        'fronted': '{name} works the front: ₽{n}, clean.', 'fencedTask': '{name} fences the day\'s loot: ₽{n}.', 'flyersTask': '{name} puts up flyers in {district}.',
    },
}
json.dump(doc, open('src/data/dominion/growth.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open('src/data/dominion/growth.json', 'a').write('\n')
print(len(P), 'plays')
