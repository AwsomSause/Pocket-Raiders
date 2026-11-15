// Kanto Canon Spaces, KANTO_PLACED_5.md (Volume II): the roads between (eleven route spaces) and the Sevii Islands (the
// ferry, eighteen island spaces and the two far islands). Lines kept word for word; the text around them is longer and
// warmer. Same-run memory only (Kice): "later runs of this save" lines stay inside this run. No Keepsakes: a journal moment.
//
// The Sevii Islands are one Pseudo Stage (the doc's "own map"): Captain Tidewell's ferry at Cinnabar steps into it, and every
// island place is a run of nodes on that one map (Ember Spa's four nodes, Icefall Cave's four, and so on), so nothing nests.
import type { Json } from '../dsl.ts';
import { CHAINS, eid, road, later, intel, battle, buy, c, cash, flag, foe, fr, has, heal, heat, is, item, join, kc, moment, not, o, space, teach, temp, wild } from './_kc.ts';

export const CATEGORY = 'kanto-canon';
export const EVENTS: Json[] = [];
const E = EVENTS;
const DOC = 'KANTO_PLACED_5';
const rep = (n = 1): Json => flag('rep', n);
const trio = (n: number): Json => flag('kanto-trio-rep', n);
const lose = (id: string, count = 1): Json => ({ kind: 'loseItem', id, count });
const go = (sp: string, suffix = ''): Json => ({ kind: 'addEvent', eventId: eid(sp, suffix) });
const bond = (n: number, who: string): Json => ({ kind: 'friendship', amount: 0, bond: n, who });
const leadBond = (n: number): Json => ({ kind: 'bondLevel', atLeast: n, who: 'lead' });
const types = (...t: string[]): Json => ({ kind: 'partyTypes', types: t });
const fast = (label: string): Json => temp(label, [{ kind: 'statMultiplier', stat: 'spe', value: 2 }], 1);
const OTHER_REGIONS = ['zigzagoon', 'shinx', 'lillipup', 'fletchling', 'rockruff', 'wooloo', 'lechonk', 'buneary', 'skitty', 'spinda', 'teddiursa', 'smeargle', 'snubbull', 'bidoof', 'patrat', 'yungoos', 'skwovet', 'tandemaus'];

// ============================================================ THE ROADS BETWEEN (route spaces, at most two a stage)

// ---------- The Song (anime)
{
  const s = space(E, { id: 'cs.kanto.route.song', town: 'route', name: 'The Song', kind: 'EV', appears: 'route', flags: ['kanto.route.song'], section: `${DOC}: The Song`,
    placed: { stage: [1, 2, 3, 4, 5, 6, 7, 8], home: 6, window: [3, 12], sits: 'optional', attaches: 'before', badge: 'A music note and a marker pen', level: 0, often: 'Once per run; then seen in the background of other spaces' } });
  road(s.id(), [1, 2, 3, 4, 5, 6, 7, 8], 0.25);
  const asleep = (lead: string) => o(`${lead} Morning. Your face has spectacles on it. Your lead has a moustache. Somebody's been given a monocle, and suits it. The Jigglypuff is gone, and so is its audience's dignity.`,
    temp('Drawn on in the night: your first Pokémon out is too embarrassed to be quick (Speed halved, next battle)', [{ kind: 'statMultiplier', stat: 'spe', value: 0.5 }], 1), flag('kanto-song-missed'), flag('kanto-route-song'));
  s.entry('The Song',
    `A tree stump. A Jigglypuff standing on it, holding a marker pen like a microphone. It's cleared its throat. It's waiting. It looks at you. It looks at the stump in front of it, where an audience would sit. It looks at you again. Nobody has ever stayed for the end of its song. You can see that it knows.`,
    [c('"Go on, then."', asleep(`It sings. The edges of everything go soft. Everyone's asleep by the second line, and you go somewhere warm.`)),
      c('(Plug your ears.)', o(`It sees. It puffs up to twice its size, turns its back on you, and leaves, stamping. The stump stays empty.`, flag('kanto-song-missed'), flag('kanto-route-song'))),
      c('"I\'m going to stay awake this time. I promise."', o(`Its eyes go very wide. It holds the pen out at you, as if to check you mean it, then clears its throat again.`, s.open('v1')))]);
  const verse = (n: number, next: string, needs: 'ok' | 'good' | 'perfect', speed: string) => s.room(`v${n}`, `The Song: Verse ${n}`, `The bar drifts shut like an eyelid${speed}. A press at the right moment opens it.`,
    [c('Stay awake.', o('Your eyes stay open. It sings on, louder, delighted.', s.open(next)), { prompt: ['gauge-hold', needs], fail: asleep('Your eyelids win.') }),
      // The lead's pinch helps once.
      c('Your lead pinches you. (Bond 3 or more)', o('A sharp little pinch, right on time. You\'re awake. Your lead looks very pleased with itself.', flag('kanto-song-pinch'), s.open(next)), { requires: [leadBond(3), not('kanto-song-pinch')] })]);
  verse(1, 'v2', 'ok', ''); verse(2, 'v3', 'good', ', faster now'); verse(3, 'end', 'perfect', ', faster still');
  s.room('end', 'The Song: The Last Note', 'The last note. It opens its eyes. There\'s somebody still looking back.',
    [c('Keep looking back.', o(`It doesn't know what to do. Nobody's ever been there for this part. It bows. It bows again. It drops the pen, and picks it up, and holds it out. It joins you, the pen held like a sword.`,
      join(['jigglypuff']), flag('kanto-song-awake'), flag('kanto-route-song'), moment('Stayed awake to the end of the Jigglypuff\'s song. It had never had an audience for the last line.')))]);
}

// ---------- Dark City (anime; two unofficial gyms, no progress)
{
  const s = space(E, { id: 'cs.kanto.route.darkcity', town: 'route', name: 'Dark City', kind: 'EV', appears: 'route', flags: ['kanto.route.darkcity'], section: `${DOC}: Dark City`,
    placed: { stage: [3, 4, 5, 6], home: 9, window: [7, 12], sits: 'optional', attaches: 'instead', badge: 'A shuttered window', level: 0, often: 'Once per run' } });
  road(s.id(), [3, 4, 5, 6], 0.25);
  const done = flag('kanto-route-darkcity');
  const side = (gym: string, mon: string, coins: number) => c(`"I'll take ${gym}."`, battle(`One battle beside the ${gym} Gym, against the other side's ${mon === 'electabuzz' ? 'Scyther' : 'Electabuzz'}. Coins from ${gym}. The town stays shut.`,
    foe(`${gym === 'Yas' ? 'Kaz' : 'Yas'} Gym`, { team: [mon === 'electabuzz' ? 'scyther' : 'electabuzz'], size: 1, levelBonus: 0, win: [cash(coins)] }), done));
  s.entry('Dark City',
    `A town with every shutter down at noon. A child throws a stone at you, and is pulled indoors by an arm. The diner's owner, the only door open, Mrs. Agnes Hesketh: "They think you're one of them. Trainers. We've two gyms. Neither's real. They fight in the road over which gets to be. My window's been through four times." Outside, on cue: an Electabuzz and a Scyther, and thirty people in two colours. Yas Gym: "Free lunch. And when the inspector comes, we're official, and you're in on the ground floor." Kaz Gym: "Two free lunches." At the counter, a man in a hat is eating ketchup with a little food under it, and asking a lot of questions for a tourist.`,
    [side('Yas', 'electabuzz', 600), side('Kaz', 'scyther', 900),
      c('"I\'ll take both of you. In the road. Now."', battle('The Electabuzz first.', foe('Yas Gym', { team: ['electabuzz'], size: 1, levelBonus: 0, win: [s.open('both')] }))),
      c('(To the man in the hat) "You\'re the inspector."', o(`He takes off the hat. "A gym's for the town. A town isn't for the gym. I'll be back in a year. If the windows are mended, we'll talk. One of you. Sharing." Both signs come down by evening.`, rep(5), done, moment('Unmasked the gym inspector in Dark City; both signs came down by evening.')))]);
  s.room('both', 'Dark City: The Scyther', 'The Scyther, a little stronger, and furious that the Electabuzz went first.',
    [c('Battle.', battle(`The children pour ketchup on the Electabuzz, which sees red and goes after the Scyther, and that's how you learn the two Pokémon have never actually disliked each other. The feud ends: both leaders are sitting in the road, winded, looking at the broken windows as if for the first time. Mrs. Hesketh feeds the party.`,
      foe('Kaz Gym', { team: ['scyther'], size: 1, levelBonus: 1, win: [heal(0.5), done, moment('Ended Dark City\'s gym feud in the middle of the road.')] })))]);
}

// ---------- The Fossil Rush (anime; Pseudo Stage, short)
{
  const s = space(E, { id: 'cs.kanto.route.canyon', town: 'route', name: 'The Fossil Rush', kind: 'PS', appears: 'route', flags: ['kanto.route.canyon', 'kanto.route.egg'], section: `${DOC}: The Fossil Rush`,
    placed: { stage: [2, 3, 4, 5, 6], home: 12, window: [10, 15], sits: 'door', attaches: 'instead', badge: 'A pickaxe', level: 1, often: 'Once per run' },
    ps: { name: 'The Fossil Rush', themeId: 'rock-ghost', mood: 'eyes opening in rows in the dark, and a shaft of daylight far above' } });
  road(s.id(), [2, 3, 4, 5, 6], 0.25);
  const slow = temp('Slow to wake: the fossils start with Speed halved', [{ kind: 'statMultiplier', stat: 'spe', value: 2 }], 1);
  s.entry('The Fossil Rush',
    `A canyon with two hundred people in it, all digging. Somebody's selling shovels. Somebody's selling the hole they've just dug. A digger: "Fossils! Everywhere! A man found one Tuesday! ...It was a spoon. But it was a very old spoon." On the ridge: three people and a plunger. The rival, if they're near, has spotted the fuse and is running the wrong way to stamp on it.`,
    [c('Dig.', o('The blast, off-screen. The floor goes. You\'re in a cavern.', s.open('dark'))), c('Shout a warning, and dig anyway.', o('Half the canyon hears you and runs. The blast. The floor goes anyway, under you.', rep(1), s.open('dark')))]);
  s.room('dark', 'The Fossil Rush: The Cavern', 'Eyes, opening, in rows. They\'ve been shut a very long time. They\'re hungry in a way that\'s had ages to build. An Omastar, and a Kabutops, slow to start.',
    [c('Battle the Omastar.', battle('Slow to start: it moves like something remembering how.', wild(['omastar'], { levelBonus: s.lv, win: [s.open('dark2')] }), slow))]);
  s.room('dark2', 'The Fossil Rush: The Kabutops', 'The Kabutops, unfolding.',
    [c('Battle the Kabutops.', battle('Slow to start, then very fast.', wild(['kabutops'], { levelBonus: s.lv, win: [s.open('wings')] }), slow))]);
  const won = o('The carried Pokémon comes back to you shaking, and won\'t leave your side. A fossil of your choice from the rubble, and, in the rubble, warm, a strange egg.',
    bond(2, 'lead'), { kind: 'itemFrom', ids: ['helix-fossil', 'dome-fossil', 'old-amber'], count: 1 }, flag('kanto-route-egg'), { kind: 'laterEvent', eventId: eid('cs.kanto.route.egg'), nodes: 5 }, flag('kanto-route-canyon'),
    moment('Got the lead back from an Aerodactyl, and found a strange egg in the rubble.'));
  const lost = o('It drops your lead, unharmed, a mile off. Your lead walks back, furious. No egg.', flag('kanto-route-canyon'));
  s.room('wings', 'The Fossil Rush: Wings', 'Wings. A shadow the width of the cave. It takes your lead in its claws, almost gently, and it\'s gone up the shaft. Three turns to bring it down.',
    [c('Flying or ranged moves: bring it down.', battle('Each hit lowers it. Two bring it down.', wild(['aerodactyl'], { levelBonus: s.lv, win: [s.open('rim')] })), { requires: [types('flying', 'psychic', 'electric', 'ice')] }),
      c('Chase it up the shaft.', o('You climb. It\'s faster.', s.open('rim')), { prompt: ['climb-rhythm', 'good'], fail: lost }),
      c('A lullaby. (The Song)', o('The Jigglypuff\'s on the canyon rim with its pen. One verse. The Aerodactyl lands, asleep, with your lead tucked under one wing like something it meant to keep. The Jigglypuff draws on it.', s.open('rim')), { requires: [is('kanto-route-song')] })]);
  s.room('rim', 'The Fossil Rush: The Rim', 'Your lead, safe, and the rubble steaming.', [c('Search the rubble.', won)]);
}

// ---------- Who Keeps the Egg (anime; five nodes after the egg)
{
  const s = space(E, { id: 'cs.kanto.route.egg', town: 'route', name: 'Who Keeps the Egg', kind: 'EV', appears: 'locked', requires: { flags: ['kanto.route.egg'] }, flags: ['kanto.route.egg-hatched', 'kanto.rival.togepi'], section: `${DOC}: Who Keeps the Egg`,
    placed: { stage: [2, 3, 4, 5, 6, 7], home: 12, sits: 'must', attaches: 'before', badge: 'A cracked shell', level: null, often: 'Once per run' } });
  const hatched = flag('kanto-route-egg-hatched');
  s.entry('Who Keeps the Egg',
    `The bag's moving. The egg's out, on the grass. A crack. Everyone in the party's round it, and everyone's trying to be the nearest without seeming to try. Your lead's elbowed somebody. Somebody's elbowed back. The rival, if they're about: "I'm just looking. I'm allowed to look." It's going to open. Whoever it sees first, that's who it's decided on.`,
    [c('(A party Pokémon holds it.)', o(`It hatches. A Togepi. It looks up, at a very big face, and decides. The big one's ruined for anything else for a day; it keeps checking the Togepi's still there. The others sulk for one node.`,
      join(['togepi']), fr(30, 'picked'), { kind: 'campBond', chemistry: 10, calm: 0, settle: false }, hatched, moment('A Togepi hatched in a party Pokémon\'s arms, and chose it.')), { pick: {} }),
      c('"I\'ll hold it."', o('It hatches. A Togepi. It looks up at you. Its Bond starts at 3. The others sulk for one node.', join(['togepi']), bond(3, 'newest'), hatched, moment('A Togepi hatched in your hands.'))),
      c('"Here. You take it." (to the rival)', o(`The rival: "...Why? I didn't... you found it." It's got hold of their finger. "Oh. Oh, no. All right." It's theirs. You'll see it again, on their shoulder.`,
        { kind: 'rivalChange', feelings: { trust: 1 }, lead: 1 }, flag('kanto-rival-togepi'), hatched, moment('Gave the egg to the rival. It chose them.')), { requires: [{ kind: 'rivalState', feeling: { key: 'trust', atLeast: 0 } }] })],
    later());
}

// ---------- The Bargain Day-Care (anime)
{
  const s = space(E, { id: 'cs.kanto.route.daycare', town: 'route', name: 'The Bargain Day-Care', kind: 'EV', appears: 'route', flags: ['kanto.route.daycare'], section: `${DOC}: The Bargain Day-Care`,
    placed: { stage: [3, 4, 5, 6, 7], home: 7, window: [5, 10], sits: 'optional', attaches: 'after', badge: 'A heart with a price tag', level: 1, often: 'Once per run' } });
  road(s.id(), [3, 4, 5, 6, 7], 0.25);
  const done = flag('kanto-route-daycare');
  const fight = (lead: string, ...x: Json[]) => battle(`${lead} Butch and Cassidy, a double. Cassidy: "Do you know how long it takes to tie that many balloons?"`,
    foe('Butch and Cassidy', { team: ['raticate', 'drowzee'], size: 2, format: 'doubles', levelBonus: s.lv, evil: 'specialist', win: [s.open('won')], lose: [s.open('van')] }), ...x);
  s.entry('The Bargain Day-Care',
    `A brand-new building. Balloons. A banner: POKÉMON BOARDING! ONE WEEK! PRACTICALLY FREE! Two very cheerful people in aprons. The Honest Trade Card's shown, and one line on it reads: "This offer is not what it says." The game doesn't lie; they do. The woman: "We love them. Don't we love them?" The man, gravelly: "We love them." The woman: "We'll make them stronger. Shinier. You won't recognise them. You literally won't."`,
    [c('"I\'ll leave one."', fight('It\'s safe. It\'s on top of the pile. It\'s got out of its own crate and is opening the others when you come back in, and the aprons come off.', flag('kanto-daycare-left'))),
      c('"Can I see the back?"', fight('A door marked STAFF. Crates to the ceiling. Every one\'s got something in it, and a label for somewhere else. You have the element of surprise.', fast('The element of surprise: Speed doubled this battle'))),
      c('"No, thanks."', o('The event ends. A stage on, you see the banner again, down, in a ditch.', done))]);
  s.room('won', 'The Bargain Day-Care: The Crates', 'The crates are opened.',
    [c('Open every one.', o(`Rep and Intel. One grateful owner gives you something from her bag. The police report gets Butch's name wrong. Officer Jenny, reading it back: "'Cassidy and... Bob.'" Butch, from the van: "IT'S BUTCH!"`,
      rep(5), intel(), intel(), intel(), { kind: 'itemFrom', ids: ['rare-candy', 'nugget', 'star-piece'], count: 1 }, heat(-2), done, moment('Opened every crate at the Bargain Day-Care. The report said "Bob."')))]);
  s.room('van', 'The Bargain Day-Care: The Van', 'They leave in a van.',
    [c('Run after it.', o('Your Pokémon, if you left one, is thrown out of the back of it, indignant, holding a balloon.', done))]);
}

// ---------- The Estate (anime; no battle)
{
  const s = space(E, { id: 'cs.kanto.route.estate', town: 'route', name: 'The Estate', kind: 'EV', appears: 'route', flags: ['kanto.route.estate'], section: `${DOC}: The Estate`,
    placed: { stage: [4, 5, 6, 7], home: 14, window: [12, 16], sits: 'optional', attaches: 'after', badge: 'A crest', level: null, often: 'Once per run' } });
  road(s.id(), [4, 5, 6, 7], 0.25);
  const gate = (lead: string, ...x: Json[]) => o(`${lead} At the gate. James: "You could come." Growlie looks at him. It looks at the house. Somebody has to mind the two in the hall, daft as they are. It licks his hand, and it stays. Meowth, quietly, on the road: "Some people got a family they run from. Some of us'd take the runnin', just to have had one." A beat. "I didn't say nothin'. Yous heard nothin'." A Fire Stone, in the driveway.`,
    ...x, item('fire-stone'), flag('kanto-trio-met'), flag('kanto-route-estate'), moment('Held the gate while James ran from his own estate. Growlie stayed.'));
  s.entry('The Estate',
    `A notice on a wall, with a portrait of a small boy in a sailor suit: MISSING HEIR SOUGHT. PARENTS DECEASED. THE ESTATE AWAITS. Jessie, reading it: "That's you." James: "It isn't." Meowth: "It's got your nose. How much is an estate? ...How much is it in yen?" James: "I'm not going back there. You don't know what's in that house." They look at you. Jessie's already got James by the collar.`,
    [c('"I\'ll come and see fair play."', o('A kennel the size of a cottage. A house the size of a town.', s.open('hall'))), c('"Leave me out of it."', o('They go without you. You hear about it later, from Meowth, at length.', flag('kanto-route-estate')))]);
  s.room('hall', 'The Estate: The Hall', `The parents are in two coffins in the hall. They sit up. His mother: "Darling! It worked. We knew you'd come for money." His father: "And now you're home, you'll marry Jessebelle." A young woman on the stairs who looks exactly like Jessie, in better clothes, with a voice like a door closing. Jessebelle: "I've waited. I'm going to make a gentleman of you. It will take years. I've set them aside." In the kennel: a Growlithe. It's old now. It's heard his voice. It's coming through the wall. James: "...Growlie? You waited?"`,
    [c('"Run. I\'ll get the door."', gate('You hold the gate. Growlie holds the stairs.', trio(10))), c('"This is his to sort out."', gate('The same thing happens, a little later, through a window.'))]);
}

// ---------- The Leek Thief (anime; two parts)
{
  const s = space(E, { id: 'cs.kanto.route.leek', town: 'route', name: 'The Leek Thief', kind: 'EV', appears: 'route', flags: ['kanto.route.leek'], section: `${DOC}: The Leek Thief`,
    placed: { stage: [2, 3, 4, 5], home: 5, window: [3, 9], sits: 'optional', attaches: 'after', badge: 'A leek', level: -1, often: 'Once per run' } });
  road(s.id(), [2, 3, 4, 5], 0.25);
  s.entry('The Leek Thief',
    `A Farfetch'd in the path, limping. A very polite boy running after it. The boy, Keith: "Oh, thank goodness. It's hurt. Would you hold this a moment? Just my bag. You're so kind." He's gone into the reeds after it. A minute. Two. The bag's heavy. It's full of rocks. Your own bag isn't on your shoulder.`,
    [c('Wait for him.', o('He doesn\'t come back. Your bag\'s been taken. You\'ll get it back. For the next two nodes the road goes easy on you: nothing out there is spoiling for a fight.',
      temp('Bag taken: the next two battles are a level gentler', [{ kind: 'enemyLevelOffset', value: -1 }], 2), { kind: 'laterEvent', eventId: s.id('reeds'), nodes: 2 }))]);
  const home = (lead: string, ...x: Json[]) => o(`${lead} He stops. It stops. The other four bags go back that night, each with a note. Everything returned, and its spare Leek.`, ...x, item('leek'), flag('kanto-route-leek'), moment('Found Keith in the reeds, and his Farfetch\'d landed one real hit.'));
  s.room('reeds', 'The Leek Thief: The Reeds', `A boat, a campfire, your bag, unopened, and four others. Keith, to the Farfetch'd, not knowing you've heard: "I'm sorry. I know you hate the limp. It's only till we've enough. Then we'll go somewhere nobody'll ask you to fight. You'd only lose, and then they'd laugh, and then they'd want to eat you. That's what they said. The last ones."`,
    [c('"Give it back."', home('He gives it back, and doesn\'t look at you.')),
      c('"It\'s never won a battle, has it?"', battle('A battle with the Farfetch\'d, fought honestly. It\'s better than he thinks: it\'s been carrying that leek like a sword for years.', wild(['farfetchd'], { levelBonus: s.lv, win: [s.open('after')], lose: [s.open('after')] }))),
      c('(Take the bag, and go.)', o('Everything\'s returned. Nothing more.', flag('kanto-route-leek')))], later());
  s.room('after', 'The Leek Thief: It Hit', 'Whether it won or lost, it landed something real, and it stands differently after.',
    [c('Look at Keith.', home('Keith: "...It hit yours. Did you see? It hit it. It wasn\'t even frightened."', fr(5, 'lead')))]);
}

// ---------- The Hero's Visit (anime; at a + node)
{
  const s = space(E, { id: 'cs.kanto.route.hero', town: 'route', name: 'The Hero\'s Visit', kind: 'EV', appears: 'route', flags: ['kanto.route.hero'], section: `${DOC}: The Hero's Visit`,
    placed: { stage: [1, 2, 3, 4, 5, 6, 7, 8], home: 10, window: [6, 14], sits: 'plus', attaches: 'plus', badge: 'A paper crown', level: null, often: 'Once per run' } });
  road(s.id(), [1, 2, 3, 4, 5, 6, 7, 8], 0.2);
  s.entry('The Hero\'s Visit',
    `A fence with twenty small faces pressed through it. The teacher, Miss Dorcas Appleby: "I promised them a trainer. I didn't have one. I thought one would turn up. One has. I'm very relieved. You're on in two minutes." A small boy at the back, arms folded, Timmy: "I don't want that one. I want Meowth. A Meowth saved me. From a Beedrill. It talked." Miss Appleby: "He says that. Meowth don't talk, Timmy."`,
    [c('Something big, being gentle.', o('Silence. Then all of them at once. Every Pokémon that performs: Bond +1.', bond(1, 'party'), s.open('meowth')), { pick: {} }),
      c('Something small, being fierce.', o('Shrieking. The good kind. Every Pokémon that performs: Bond +1.', bond(1, 'party'), s.open('meowth')), { pick: {} }),
      c('Something that just sits there.', o('A girl sits next to it. They sit there together. It\'s the best one. Every Pokémon that performs: Bond +1.', bond(1, 'party'), s.open('meowth')), { pick: {} })]);
  s.room('meowth', 'The Hero\'s Visit: Meowth, Passing', 'The trio\'s on the road, just past the fence.',
    [c('"There\'s a kid who thinks you\'re a hero."', o(`Meowth: "Me? ...Nah. I never. When? ...Oh. That. I was after his sandwich. The Beedrill was in the way." You: "There's a meal in it." Meowth: "...What kinda meal?" He plays the hero, in a cape made of a tablecloth, with Jessie and James as the monster, badly. Timmy: "I said. I said it talked." Meowth, an hour later, still in the cape: "And another thing about bein' a hero..." Jessie: "We're leaving, Meowth."`,
      trio(5), flag('kanto-trio-met'), flag('kanto-route-hero'), moment('Got Meowth to play the hero for a kindergarten. He kept the cape on.'))),
      c('(Say nothing.)', o('The trio walk on. Timmy watches them all the way down the road.', flag('kanto-route-hero')))]);
}

// ---------- On Location (anime)
{
  const s = space(E, { id: 'cs.kanto.route.film', town: 'route', name: 'On Location', kind: 'EV', appears: 'route', flags: ['kanto.route.film'], section: `${DOC}: On Location`,
    placed: { stage: [3, 4, 5, 6, 7], home: 13, window: [10, 16], sits: 'optional', attaches: 'after', badge: 'A clapperboard', level: null, often: 'Once per run' } });
  road(s.id(), [3, 4, 5, 6, 7], 0.25);
  const mark = flag('kanto-film-marks');
  s.entry('On Location',
    `Lights. Cables. A director's chair. A trailer with a star on the door, and a Wigglytuff's silhouette in the window, throwing something. The director, Mr. Cleavon Schpielbunk: "My leading lady's fired four co-stars. She slapped the fourth. I need a fifth. I need one that won't cry. Or one that will, on cue. Which have you got?"`,
    [c('Audition one Pokémon.', o('He points. "That one. Hit the mark."', s.open('mark')), { pick: {} }), c('"Neither."', o('"Then get off my set." He means it kindly.', flag('kanto-route-film')))]);
  s.room('mark', 'On Location: Hit the Mark', 'Will it go where you point?',
    [c('Point.', o('It goes, and stops dead on the tape.', mark, s.open('pose')), { requires: [leadBond(2)] }), c('Point, and hope.', o('It goes somewhere near.', s.open('pose')))]);
  s.room('pose', 'On Location: Hold the Pose', 'A calm or careful one holds. A hasty one fidgets, charmingly.',
    [c('Hold it.', o('Still as a photograph.', mark, s.open('cry')), { prompt: ['brace-hold', 'good'], fail: o('It fidgets. The crew love it. The director doesn\'t.', s.open('cry')) })]);
  s.room('cry', 'On Location: Cry on Cue', 'You whisper to it. The right whisper is the thing it\'s actually lost, or feared, in this run.',
    [c('Whisper about the one who fainted.', o('It cries. Real tears. The set goes quiet.', mark, s.open('test')), { requires: [{ kind: 'memberFainted', within: 30 }] }),
      c('Whisper about the dark at the bottom of the last cave.', o('Its lip wobbles. Close enough.', mark, s.open('test')), { requires: [is('kanto-route-canyon')] }),
      c('Whisper something kind.', o('It looks at you, puzzled, and very happy. Not a tear.', s.open('test')))]);
  const cast = o(`Cast. Coins, and a Screen Ribbon. Fans will know it in every town for the rest of the run: shop prices are a little kinder while it leads. A fan, three towns on: "It's you! From the... I cried! My Mum cried! Can it do the face?"`,
    cash(1500), { kind: 'tempEffect', label: 'A screen star: shop prices -5% (this region)', effects: [{ kind: 'priceMultiplier', value: 0.95 }], battles: 1, until: 'region' }, flag('kanto-route-film'), moment('Cast in a film; the Screen Ribbon is pinned in the journal.'));
  s.room('test', 'On Location: The Screen Test', 'The Wigglytuff comes out for the screen test. It upstages. It steps on tails.',
    [c('Let it be judged.', o('The director counts on his fingers.', s.open('verdict'))),
      c('(A stubborn one) Step on its foot back.', o('The set goes silent. The Wigglytuff looks at your Pokémon for a long moment, and then, for the first time on this picture, acts.', mark, mark, s.open('verdict')), { requires: [{ kind: 'bondLevel', atLeast: 1, who: 'picked' }], pick: {} })]);
  s.room('verdict', 'On Location: The Verdict', 'He checks the rushes twice.',
    [c('Cast.', cast, { requires: [is('kanto-film-marks', 3)] }),
      c('Not cast.', o('A walk-on: it\'s in the back of one shot, looking at the camera. And lunch.', heal(0.3), flag('kanto-route-film')), { requires: [is('kanto-film-marks', 0, 2)] })]);
}

// ---------- The Stolen Badges (anime; two parts)
{
  const s = space(E, { id: 'cs.kanto.route.badges', town: 'route', name: 'The Stolen Badges', kind: 'EV', appears: 'route', flags: ['kanto.route.badges'], section: `${DOC}: The Stolen Badges`,
    placed: { stage: [6, 7, 8], home: 8, window: [6, 12], sits: 'optional', attaches: 'after', badge: 'An empty badge case', level: 1, often: 'Once per run' } });
  road(s.id(), [6, 7, 8], 0.3);
  s.entry('The Stolen Badges',
    `A trainer on a rock, polishing eight Badges in a row, where people can see. Otoshi: "How many've you got? ...Hm. I'd all eight before I was your age. My Marowak did most of it. I mostly stood there. You'll find it's about standing correctly." The Marowak rolls its eyes. It's the only one that sees the three people in the bush.`,
    [c('Walk on.', o('He calls a tip after you about posture.', { kind: 'laterEvent', eventId: s.id('night'), nodes: 1 })),
      c('"There\'s somebody in that bush."', o(`"There's always somebody in a bush. Bushes are popular." He goes on polishing.`, { kind: 'laterEvent', eventId: s.id('night'), nodes: 1 }))]);
  const trio2 = (lead: string) => battle(`${lead} The trio, a double, beside him. Meowth's wearing all eight Badges at once. Meowth: "I'm a Champion. Look at me. I got more of these than anyone here."`,
    foe('Jessie and James', { team: ['arbok', 'weezing'], size: 2, format: 'doubles', levelBonus: s.lv, win: [s.open('thanks')], lose: [s.open('thanks')] }), flag('kanto-trio-met'));
  s.room('night', 'The Stolen Badges: That Night', `He's at the edge of the firelight. He isn't standing correctly. Otoshi: "They took the case. I can't enter without it. I... look. I said some things. On the rock. I'd like to have not said them." The Marowak's sitting apart from him. It's ashamed of him, and it's made sure he knows.`,
    [c('"Come on. Which way?"', trio2('He points, and runs.')), c('"Say it properly."', trio2('"...I\'m sorry. I was showing off. I\'ve nobody to show off to, usually." The Marowak comes and stands beside him.')),
      c('"What does your Marowak think?"', trio2('The Marowak looks at him a long time, then points its club at the bush.'))], later());
  s.room('thanks', 'The Stolen Badges: Properly', 'He gets the case back. He battles you, as thanks, properly, and this time he calls every move himself.',
    [c('Battle.', battle('Win or lose: a Thick Club, and one honest tip about the road ahead. The Badges are his, and stay his.',
      foe('Otoshi', { team: ['marowak', 'nidoking', 'rhydon'], size: 3, levelBonus: s.lv, win: [item('thick-club'), { kind: 'revealStops' }, flag('kanto-route-badges')], lose: [item('thick-club'), { kind: 'revealStops' }, flag('kanto-route-badges')] }),
      moment('Got Otoshi\'s Badges back, and he called every move himself.')))]);
}

// ---------- The Buried City (anime; Pseudo Stage: a set piece of six turns)
{
  const s = space(E, { id: 'cs.kanto.route.buried', town: 'route', name: 'The Buried City', kind: 'PS', appears: 'route', flags: ['kanto.route.buried', 'kanto.buried.sighting'], section: `${DOC}: The Buried City`,
    placed: { stage: [4, 5, 6, 7, 8], home: 15, window: [13, 17], sits: 'door', attaches: 'instead', badge: 'A spoon and a bell', level: null, often: 'Once per run', tags: ['eerie'] },
    ps: { name: 'The Buried City', themeId: 'psychic-ghost', mood: 'a valley with two giants in it, arguing in the rain' } });
  road(s.id(), [4, 5, 6, 7, 8], 0.2);
  const coin = (lead: string) => o(`${lead} Dr. Wainscott's thanks, and an ancient coin. Dr. Wainscott, either way: "Small. That's what the poem said. I'd read it as an insult. It's a relief."`, s.open('coin'));
  s.entry('The Buried City',
    `A hillside that's come away in the rain. Under it: steps, going down. An archaeologist, soaked and delighted, Dr. Eve Wainscott: "Pokémopolis. It's in one poem and no history. 'They made them great, to be their gods, and were made small.' I thought it was a figure of speech." Inside: a stone spoon as long as a room. A black bell. Two niches, empty, and on the floor between them, where the flood's rolled them together: two small relics, touching.`,
    [c('Go down.', o('The roof goes.', s.open('wake')))]);
  s.room('wake', 'The Buried City: They Wake', 'On one side of the valley, a Gengar the height of a hill. On the other, an Alakazam, with a spoon like a bridge. They don\'t look down. They\'ve an argument three thousand years old, and they\'ve just remembered whose turn it was. They can\'t be beaten. They can be put to sleep.',
    [c('The relics: carry them home. (Six turns)', o('Your lead takes one relic; you take the other. Across the valley floor, while the fight goes on overhead.', s.open('t1'))),
      c('The Song. (The Jigglypuff, on a broken pillar)', o('It\'s never had an audience this size. One verse. They sit down, slowly, like buildings deciding to. It then draws on both of them. It takes all night.', s.open('song')), { requires: [is('kanto-route-song')] })]);
  const DANGERS = ['Falling masonry.', 'A stray Shadow Ball the size of a house.', 'The spoon, swinging overhead like a crane.', 'The ground splits under the second relic.', 'A wall, deciding.', 'The last stretch, in the dark between two shadows.'];
  DANGERS.forEach((d, i) => s.room(`t${i + 1}`, `The Buried City: Turn ${i + 1}`, d,
    [c('Dodge.', o('Through.', i < 5 ? s.open(`t${i + 2}`) : s.open('set')), { prompt: ['dodge-tap', i < 3 ? 'ok' : 'good'], fail: o('They tire themselves out by dawn, and lie down where they are. The valley\'s a mess. No coin.', flag('kanto-route-buried')) })]));
  s.room('set', 'The Buried City: The Niches', 'Both relics, back in their niches. The two giants stop mid-swing, and lie down, and are hills again.', [c('Breathe.', coin('Quiet.'))]);
  s.room('song', 'The Buried City: All Night', 'Two hills with moustaches.', [c('Wake Dr. Wainscott.', coin('She\'s been laughing in her sleep.'))]);
  s.room('coin', 'The Buried City: The Coin', 'An ancient coin: it sells very well, or the Pewter Museum will take it for a plaque with your name. A Sighting, too, for a Legendary of the region the run began in.',
    [c('Sell it.', o('It sells very well.', cash(5000), flag('kanto-buried-sighting'), flag('kanto-route-buried'))),
      c('Leave it at the Pewter Museum.', o('A small brass plaque, with your name on it, under a coin.', rep(5), flag('kanto-buried-sighting'), flag('kanto-route-buried'), moment('A plaque at the Pewter Museum, under a coin from Pokémopolis.')))]);
}

// ============================================================ THE SEVII ISLANDS (a Pseudo Stage for One Island and the ferry, and one for each island)

const NET = 'cs.kanto.sevii.network';
const dock = (n: string): Json => go(NET, n);
/** The ferry crossing to an island: the entry of that island's own map, so each island draws as a small stage of its own. */
const sailTo = (n: string): Json => go(NET, `sail-${n}`);
const sdone = flag('kanto-sevii-places');
const ISLAND: Record<string, string> = { two: 'Two Island', three: 'Three Island', four: 'Four Island', five: 'Five Island', six: 'Six Island', seven: 'Seven Island' };
const back = (n: string) => c(`Back to ${n === 'knot' ? 'One Island' : ISLAND[n]}'s dock.`, o('Back along the jetty.', dock(n)));
/** An island place: a node (or run of nodes) on its island's map. */
const isle = (id: string, name: string, kind: 'EV' | 'SHOP' | 'PS', flags: string[], level: number | null, badge: string) => space(E, { id, town: 'sevii', name, kind: kind === 'PS' ? 'EV' : kind, appears: 'always', parent: NET, flags, section: `${DOC}: ${name}`,
  placed: { stage: [7], home: 18, sits: 'plus', attaches: 'plus', badge, level, often: 'Once per run (on the Sevii map)' } });

// ---------- The Network Center and the ferry (the Pseudo Stage)
{
  const s = space(E, { id: NET, town: 'cinnabar', name: 'The Sevii Islands', kind: 'PS', appears: 'always', flags: ['kanto.sevii.pass', 'kanto.sevii.ruby', 'kanto.sevii.sapphire', 'kanto.sevii.wall', 'kanto.sapphire.six', 'kanto.hooh.sighting', 'kanto.lugia.sighting', 'kanto.deoxys.sighting', 'kanto.unown.sighting'], section: `${DOC}: The Sevii Islands`,
    placed: { stage: [7], home: 18, sits: 'plus', attaches: 'town', badge: 'A ferry pass', level: 1, often: 'Once per run' },
    ps: { name: 'The Sevii Islands', themeId: 'water-grass', mood: 'seven islands in a warm sea, and a ferry that does three and the first', start: 'opened' } });
  s.entry('The Man on the Dock',
    `A man on the Cinnabar dock, with a boat, a pass, and all afternoon. The ferryman, Captain Jonah Tidewell: "Islands. Seven. I do three and the first. Don't ask why three. It's the fuel, or it's tradition; I've forgotten which I made up."`,
    [c('"Take me."', o('He\'s already untying the rope.', s.open('center'))),
      c('"What\'s out there?"', o('"No Gyms. No League. People who went to get away from all that, and things that live where it\'s quiet. You\'ll come back with sand in everything." He\'s untying the rope while he says it.', s.open('center'))),
      c('"Not this time."', o(`"Suit yourself. The islands'll keep."`)),
      c('Back to One Island.', o('He\'s already untying the rope. "Knot, then."', s.open('knot')), { requires: [is('kanto-sevii-pass')] })],
    { remembers: [{ id: 'first', when: [not('kanto-sevii-pass')], hide: [3] },
      { id: 'pass', when: [is('kanto-sevii-pass')], intro: 'Captain Tidewell, at the jetty with the engine running and your Tri-Pass in his hat band. "One Island. I always go back by One. Everybody does."', hide: [0, 1, 2] }] });
  const hello = (label: string, line: string) => c(label, o(`${line} A full rest, in the Center's back room, on a camp bed among the cables.`, heal(1), flag('kanto-sevii-pass'), s.open('knot')));
  s.room('center', 'One Island: The Network Center', `A Pokémon Center with one wall that's all machine. Cables through the window. A man asleep with his forehead on a keyboard, typing one letter for ever. The engineer, Celio: "kkkkkkk... oh. Hello. I'm linking the storage system to regions further out. So a trainer here could see a friend's Pokémon there. It nearly works. It wants two stones to tune it. A red one. A blue one. I've a drawing. I drew it at four in the morning; the proportions may be hopeful." He gives you a Tri-Pass.`,
    [hello('"I\'ll look out for them."', '"Would you? Oh. Thank you."'), hello('"Why does it matter so much?"', 'Celio: "My friend made the one on the mainland. Everybody uses his. I\'d like to have made one thing people use."'),
      hello('"When did you last sleep?"', '"What day is it? ...Ah."')]);
  s.room('knot', 'One Island: The Dock', 'Knot Island. The Center, Mt. Ember steaming behind it, and the ferry, with Captain Tidewell asleep in it.',
    [c('Ember Spa and the Summit.', o('Up the hill, towards the steam.', go('cs.kanto.sevii.ember')), { requires: [not('kanto-sevii-ember')] }),
      c('The Network Center.', o('Celio\'s awake. Just.', s.open('celio'))), c('The ferry board.', o('Captain Tidewell wakes up and taps the board.', s.open('board'))),
      c('The shore.', o('Sand, and the boat.', s.open('shore')))]);
  // KANTO_PLACED_6: Treasure Beach (at low tide) and the Last Ferry home.
  s.room('shore', 'One Island: The Shore', 'The beach, and Captain Tidewell\'s boat. Nothing\'s lost by leaving. The islands keep.',
    [c('Treasure Beach.', o('The sea\'s gone out a long way.', go('cs.kanto.sevii.treasure')), { chance: 0.5, fail: o('The tide\'s in. The beach is under it. Another visit.', s.open('knot')) }),
      c('Sail home to Cinnabar for good.', o('He starts the engine.', go('cs.kanto.sevii.ferry'))), back('knot')]);
  s.room('celio', 'One Island: Celio', 'The wall of machine, humming, half of it dark.',
    [c('Give him the Ruby.', o('He fits it. Half the lights come on. He gives you one Network Machine, still warm.', item('network-machine'), flag('kanto-sevii-machine'), sdone, s.open('knot')), { requires: [is('kanto-sevii-ruby'), not('kanto-sevii-machine')] }),
      c('Give him the Sapphire too.', o(`Every light goes green, top to bottom, like a tide. Celio: "It's... there's somebody there. On the other end. They're waving. I don't know who they are. I'm waving." A second Network Machine.`,
        item('network-machine'), flag('kanto-sevii-machine'), flag('kanto-sevii-wall'), sdone, moment('Turned on Celio\'s wall. Somebody, somewhere, waved back.'), s.open('knot')), { requires: [is('kanto-sevii-ruby'), is('kanto-sevii-sapphire'), is('kanto-sevii-machine', 1, 1)] }),
      c('"Which islands do the stones need?"', o('He draws it on your hand: One for the Ruby and the first half of a password, Four for the second half, Five for the warehouse. "That\'s three. Exactly three. I didn\'t plan that. I\'d like to say I did." The board marks them.', flag('kanto-sevii-asked'), s.open('knot'))),
      back('knot')]);
  // The ferry board: One Island first, then any three of the other six.
  const trip = (n: string, level: string, thread: string) => c(`${ISLAND[n]} (${level})${thread}`, o(`The ferry noses out. ${ISLAND[n]} comes up out of the haze.`, flag('kanto-sevii-trips'), flag(`kanto-sevii-${n}`), sailTo(n)), { requires: [is('kanto-sevii-trips', 0, 2), not(`kanto-sevii-${n}`)] });
  const revisit = (n: string) => c(`${ISLAND[n]} again.`, o('"Paid for that one already."', sailTo(n)), { requires: [is(`kanto-sevii-${n}`)] });
  void revisit;
  s.room('board', 'The Ferry Board', 'Seven islands, a level against each. "I do three. You pick." Islands the stones need are marked once Celio\'s been asked.',
    [trip('two', 'level A', ''), trip('three', 'level A+1', ''), trip('four', 'level A+1', ': the password, second half'), c('Further down the board.', o('He turns it over.', s.open('board2')))],
    { remembers: [{ id: 'asked', when: [is('kanto-sevii-asked')], notice: 'Celio\'s marks are on the board: One, Four and Five. Exactly three.' }] });
  s.room('board2', 'The Ferry Board: The Far Side', 'Five, Six and Seven, and two islands in grey at the bottom.',
    [trip('five', 'level A+2', ': the warehouse'), trip('six', 'level A', ''), trip('seven', 'level A+2', ''), c('The grey islands, or back.', o('He shrugs at the grey ones.', s.open('far')))]);
  s.room('far', 'The Ferry Board: In Grey', 'Navel Rock and Birth Island, in grey. "Not without a ticket. I don\'t make the rules. Somebody does. Not me."',
    [c('Navel Rock (the Mystic Ticket).', o('He looks at the ticket a long time, and starts the engine.', go('cs.kanto.sevii.navel')), { requires: [is('kanto-mystic-ticket'), not('kanto-sevii-navel')] }),
      c('Birth Island (the Aurora Ticket).', o('He crosses himself, which he\'s never done before, and starts the engine.', go('cs.kanto.sevii.birth')), { requires: [is('kanto-aurora-ticket'), not('kanto-sevii-birth')] }),
      c('The reef with one hut.', o('Captain Tidewell slows without being asked.', go('cs.kanto.sevii.labyrinth'))), back('knot')]);
  // The islands' docks: each island's places, in any order, then back to the ferry.
  // Back to the ferry walks out of the island's map; the Captain takes you back to One Island (the Pseudo Stage's entry, with the pass).
  const sail = c('Back to the ferry.', o('Captain Tidewell\'s waiting with the engine running.', go(NET)));
  // Each island is a small stage of its own: the crossing is its entry, the dock its first room.
  const MOODS: Record<string, [string, string]> = {
    two: ['water-grass', 'a stall, a cottage that smells of mushrooms, and a game corner with three machines'],
    three: ['water-grass', 'one street, and a forest of berries beyond it'],
    four: ['water-grass', 'cold air off a cave mouth, and an old couple on a bench'],
    five: ['water-grass', 'a shed on a headland, a cave that counts, and a rock offshore'],
    six: ['water-grass', 'a door with no handle, and grass cut into a picture'],
    seven: ['water-grass', 'a tower with a clock, a sea cave, and a canyon'],
  };
  for (const n of Object.keys(ISLAND)) {
    s.room(`sail-${n}`, `The Ferry to ${ISLAND[n]}`, `Spray over the bow, and Captain Tidewell humming something with no tune. ${ISLAND[n]} comes up out of the haze: ${MOODS[n]![1]}.`,
      [c('Step ashore.', o('The jetty boards are warm.', dock(n)))]);
    CHAINS.push({ entry: s.id(`sail-${n}`), name: ISLAND[n]!, town: 'sevii', themeId: MOODS[n]![0], mood: MOODS[n]![1], start: 'opened' });
  }
  const place = (id: string, label: string) => c(label, o('Along the shore.', go(id)), { requires: [not(eid(id))] });
  s.room('two', 'Two Island: The Dock', 'Boon Island. A stall, a cottage with a sign that says MOVES, and a game corner with three machines.',
    [c('The Growing Stall.', o('Along the shore.', go('cs.kanto.sevii.stall'))), c('The Move Maniac.', o('A cottage that smells of mushrooms.', go('cs.kanto.sevii.maniac'))),
      c('The game corner.', o('Three machines and a jukebox.', s.open('corner'))), sail], later());
  s.room('corner', 'Two Island: The Game Corner', 'The island\'s game corner.',
    [place('cs.kanto.sevii.missing', 'The man wiping a glass.'), c('The chalked squares.', o('The floor\'s chalked.', go('cs.kanto.sevii.joyful')), { requires: [is('kanto-sevii-berryforest')] }), back('two')]);
  s.room('three', 'Three Island: The Dock', 'Kin Island. One street, and a forest beyond it.',
    [place('cs.kanto.sevii.bikers', 'The street.'), place('cs.kanto.sevii.berryforest', 'Berry Forest.'), sail], later());
  s.room('four', 'Four Island: The Dock', 'Floe Island. Cold air off a cave mouth, and an old couple on a bench.',
    [place('cs.kanto.sevii.icefall', 'Icefall Cave.'), c('The Island Day-Care.', o('The old couple wave.', go('cs.kanto.sevii.daycare'))), sail], later());
  s.room('five', 'Five Island: The Dock', 'Chrono Island. A shed on a headland, a cave with a sign that says COUNT, and a rock offshore.',
    [place('cs.kanto.sevii.warehouse', 'The shed on the headland.'), c('West: the Lost Cave, and the resort.', o('Round the headland.', s.open('west'))), place('cs.kanto.sevii.pillar', 'The rock offshore.'), sail], later());
  s.room('west', 'Five Island: West', 'The Lost Cave\'s mouth, and past it a resort with a veranda.',
    [place('cs.kanto.sevii.lostcave', 'The Lost Cave.'), c('The veranda.', o('A parasol.', go('cs.kanto.sevii.resort')), { requires: [is('kanto-sevii-lostcave')] }), back('five')]);
  s.room('six', 'Six Island: The Dock', 'Fortune Island. A door with no handle, a field of tall grass cut into a pattern, and a plain cave.',
    [place('cs.kanto.sevii.dottedhole', 'The door with no handle.'), place('cs.kanto.sevii.patternbush', 'Pattern Bush.'), place('cs.kanto.sevii.altering', 'The Altering Cave.'), sail], later());
  s.room('seven', 'Seven Island: The Dock', 'Quest Island. A tower with a clock, a sea cave, and a canyon.',
    [place('cs.kanto.sevii.tower', 'Trainer Tower.'), place('cs.kanto.sevii.tanoby', 'The sea cave.'), place('cs.kanto.sevii.canyon', 'Sevault Canyon.'), sail], later());
}

// ---------- One Island: Ember Spa and the Summit (four nodes)
{
  const s = isle('cs.kanto.sevii.ember', 'Ember Spa and the Summit', 'PS', ['kanto.sevii.ember', 'kanto.sevii.password1'], 1, 'A hot spring');
  const done = [flag('kanto-sevii-ember'), sdone];
  s.entry('Ember Spa and the Summit: The Spa', `A hot spring, full of old people and Slowpoke. A free rest, once. An old man: "It cures everything. I've been in since March."`,
    [c('Get in.', o('Everything that hurt stops. The Slowpoke don\'t move up. You don\'t mind.', heal(1), { kind: 'cure' }, s.open('path'))), c('Straight up the mountain.', o('The steam follows you a little way.', s.open('path')))], { room: true });
  s.room('path', 'Ember Spa: The Path', 'Fire types on the slope. Hot ground: a burn chance for anything that isn\'t Fire, Rock or Ground.',
    [c('Go carefully.', o('Up through the heat.', s.open('diggers')), { prompt: ['tilt-drag', 'ok'], fail: o('The ground bites.', { kind: 'status', status: 'burn', who: 'party', except: ['fire', 'rock', 'ground'] }, s.open('diggers')) }),
      c('Battle through.', battle('Something on the slope objects.', wild(['ponyta', 'magmar', 'slugma', 'geodude'], { levelBonus: s.lv, win: [s.open('diggers')] })))]);
  s.room('diggers', 'Ember Spa: The Diggers', `Below. Grunt 1: "What's the password again? For the warehouse?" Grunt 2: "I'm not saying it. There could be people." Grunt 1: "There's nobody. It's a mountain. Is it 'Goldeen need log'?" Grunt 2: "That's the first half! You've just said the first half!" They see you. Grunt 2: "...How long have you been there."`,
    [c('Battle.', battle('A double battle.', foe('Rocket Grunts', { team: ['golbat', 'sandslash'], size: 2, format: 'doubles', levelBonus: s.lv, evil: 'grunt', win: [flag('kanto-sevii-ruby'), flag('kanto-sevii-password1'), s.open('summit')], lose: [s.open('missed')] })))]);
  s.room('missed', 'Ember Spa: Still Digging', 'They keep digging. The Ruby can be bought later on Two Island, expensively. You know the first half of the password anyway: they said it.',
    [c('Climb on.', o('Up.', flag('kanto-sevii-password1'), s.open('summit')))]);
  s.room('summit', 'Ember Spa: The Summit', 'A scorched nest, the size of a room. Empty. Warm.',
    [c('Stand in it.', o('A Moltres Sighting. One feather, still warm. In the tunnel the grunts opened, red light: the Ruby, if they didn\'t keep it.', flag('kanto-moltres-sighting'), ...done, moment('Stood in Moltres\'s nest on top of Mt. Ember.'), dock('knot')))]);
}

// ---------- Two Island: The Growing Stall
{
  const s = isle('cs.kanto.sevii.stall', 'The Growing Stall', 'SHOP', [], null, 'A shelf');
  s.entry('The Growing Stall', `A stall with one item on it. It's a Berry. She's dusted it. The shopkeeper, Miss Jessamy Quoyle: "Stock's hard. The boats don't come unless there's a reason to. You could be a reason. Go and be useful somewhere, and they'll hear." Each Sevii place you finish adds a row to her shelves, and her prices never rise.`,
    [buy('The Berry', 100, 'She wraps it like it\'s the last one. It is.', item('sitrus-berry')),
      c('Balls, and medicine for the road. (3 places done)', o('A boat came in.', s.open('balls')), { requires: [is('kanto-sevii-places', 3)] }),
      c('Stones, and more. (6 places done)', o('Two boats came in.', s.open('stones')), { requires: [is('kanto-sevii-places', 6)] }),
      back('two')], { room: true });
  s.room('balls', 'The Growing Stall: Balls and Medicine', 'Balls, and medicine for the road (used here, out of battle).',
    [buy('Nest Balls (5)', 1000, 'Five, in a paper bag.', item('nest-ball', 5)), buy('A rest-in-a-bottle', 800, 'For the road: everyone patched up, here and now.', heal(1)), c('Back to the front of the stall.', o('Back.', go('cs.kanto.sevii.stall')))]);
  s.room('stones', 'The Growing Stall: Stones', 'Evolution stones. The Ruby, if you missed it. And at nine places done, TMs.',
    [buy('An evolution stone', 2100, 'Her best one, from the box under the counter.', { kind: 'itemFrom', ids: ['fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone', 'moon-stone'], count: 1 }),
      { ...buy('The Ruby', 6000, 'Expensively. She did warn you.', flag('kanto-sevii-ruby')), requires: [{ kind: 'money', atLeast: 6000 }, not('kanto-sevii-ruby')] },
      c('TMs, and the best shop in Kanto. (9 places done)', o('Three boats this morning.', s.open('best')), { requires: [is('kanto-sevii-places', 9)] }),
      c('Back to the front of the stall.', o('Back.', go('cs.kanto.sevii.stall')))]);
  s.room('best', 'The Growing Stall: The Best Shop in Kanto', 'At nine: TMs. At twelve: the best shop in Kanto. "Three boats this morning. Three. One of them asked for you by name. I said you were mine."',
    [buy('A Network Machine', 3000, 'A TM that teaches whatever it can learn.', item('network-machine')),
      { ...buy('A Rare Candy (12 places done)', 2400, 'From a boat that asked for you by name.', item('rare-candy')), requires: [{ kind: 'money', atLeast: 2400 }, is('kanto-sevii-places', 12)] },
      c('Back to the front of the stall.', o('Back.', go('cs.kanto.sevii.stall')))]);
}

// ---------- Two Island: The Move Maniac
{
  const s = isle('cs.kanto.sevii.maniac', 'The Move Maniac', 'EV', [], null, 'A mushroom');
  s.entry('The Move Maniac', `The Move Maniac: "I know every move every Pokémon's ever forgotten. I'll put one back. I take payment in mushrooms. I like mushrooms. Don't look at me like that." He does it by telling the Pokémon about the move, at length, until it remembers out of self-defence.`,
    [c('Pay a Big Mushroom: one move it could have learned.', o('He talks for forty minutes. Your lead remembers, mostly so he\'ll stop. (A Network Machine: pick the move.)', lose('big-mushroom'), item('network-machine')), { requires: [has('big-mushroom')] }),
      c('"I haven\'t a mushroom."', o('"Then bring me one. They grow on Paras. Also in shops. Mostly on Paras."')), back('two')], { room: true });
}

// ---------- Two Island: The Missing Girl (sets up Three Island)
{
  const s = isle('cs.kanto.sevii.missing', 'The Missing Girl', 'EV', ['kanto.sevii.missing'], null, 'A glass');
  const free = [flag('kanto-sevii-three'), flag('kanto-sevii-missing'), flag('cs-kanto-sevii-missing')];
  s.entry('The Missing Girl', `The island's game corner: three machines and a jukebox. A man behind the counter, wiping the same glass. The owner: "My Lostelle went over to Three for berries. She does. She's back by tea. It's past tea." He wipes the glass. "It's past tea." He doesn't ask. He can't leave the shop; there's nobody else. (Three Island goes on your Tri-Pass free: it doesn't use one of the three.)`,
    [c('"I\'m going to Three anyway."', o('He nods, and keeps wiping.', ...free, dock('two'))), c('"I\'ll go now."', o('He stops wiping. Just for a second.', ...free, sailTo('three'))), c('(Nod.)', o('He nods back.', ...free, dock('two')))], { room: true });
}

// ---------- Three Island: The Bikers
{
  const s = isle('cs.kanto.sevii.bikers', 'The Bikers', 'EV', ['kanto.sevii.bikers'], 0, 'A spanner');
  const done = [flag('cs-kanto-sevii-bikers'), flag('kanto-sevii-bikers'), sdone];
  const reward = (lead: string) => o(`${lead} From the grandmother: a full rest at her kitchen table, for the road, and directions to the forest.`, heal(1), ...done, dock('three'));
  s.entry('The Bikers', `One street. Twelve motorbikes on it. Across it, in a line, the island: fishermen, a baker, a grandmother, a boy of nine. Arms folded. No Pokémon. A biker: "We like it here. We're stopping." The grandmother: "No." A biker: "...You can't just say 'no.'" The grandmother: "I've said it."`,
    [c('Stand with the island.', battle('Three battles: two bikers, then their leader.', foe('Biker', { team: ['koffing', 'grimer'], size: 2, levelBonus: 0, win: [s.open('b2')] }))),
      c('Show them the patch from the Bridge Run.', reward(`The leader: "Is that... that's Chopper's. You rode the bridge? In the storm? ...Lads. We're on the wrong island. Sorry about the... sorry. We'll sweep up." No fight. They leave, embarrassed.`), { requires: [is('kanto-gang-patch')] }),
      back('three')], { room: true });
  s.room('b2', 'The Bikers: The Second', 'The second biker revs, twice, for effect.', [c('Battle.', battle('The second.', foe('Biker', { team: ['weezing', 'muk'], size: 2, levelBonus: 0, win: [s.open('b3')] })))]);
  s.room('b3', 'The Bikers: The Leader', 'Their leader takes off his helmet. He has very neat hair.', [c('Battle.', battle('The leader.', foe('Biker Leader', { team: ['weezing', 'muk', 'arbok'], size: 3, levelBonus: 0, win: [s.open('swept')] })))]);
  s.room('swept', 'The Bikers: Swept', 'They go. The grandmother unfolds her arms.', [c('"Is that it?"', reward('"That\'s it," says the grandmother.'))]);
}

// ---------- Three Island: Berry Forest (three nodes)
{
  const s = isle('cs.kanto.sevii.berryforest', 'Berry Forest', 'PS', ['kanto.sevii.berryforest'], 1, 'A basket');
  s.entry('Berry Forest: The Trees', 'Berry trees in rows nobody planted. It\'s very quiet. It\'s the kind of quiet with something holding it. Wild Pokémon that don\'t attack; they watch you go by.',
    [c('Walk on.', o('They watch.', s.open('basket')))], { room: true });
  s.room('basket', 'Berry Forest: The Basket', 'A basket on the path, tipped over. Berries in a line, leading in.', [c('Follow the berries.', o('In.', s.open('girl')))]);
  const home = (lead: string, ...x: Json[]) => o(`${lead} She walks home. From her father: a bundle of Nest Balls, and the stall gains two rows. Six Berries, of your choice. The owner, when she comes in, puts the glass down. He hasn't put it down all day.`,
    ...x, item('nest-ball', 5), item('sitrus-berry', 3), item('lum-berry', 3), flag('kanto-sevii-places', 3), flag('cs-kanto-sevii-berryforest'), flag('kanto-sevii-berryforest'), moment('Walked Lostelle home out of Berry Forest. Her father put the glass down.'), dock('three'));
  s.room('girl', 'Berry Forest: The Girl', `Lostelle: "I'm not lost. I know the way. I just keep not going. Every time I think 'home,' I think 'in a minute.'" Behind her, among the trunks: a pendulum, swinging. Slow.`,
    [c('"Battle it."', battle('A Hypno.', wild(['hypno'], { levelBonus: s.lv, win: [s.open('home')] }))),
      c('(Stand between them, and look at it.)', o('Three swings. You don\'t follow the pendulum. It looks away first.', s.open('home')), { prompt: ['echo-rhythm', 'good'], fail: o('The pendulum wins, for a while. When you come to, the Hypno is gone and Lostelle is holding your hand.', s.open('home')) }),
      c('"What do you want with her?"', home('It\'s lonely. The forest\'s empty. She was the first thing in a year that stopped to say hello. It lowers the pendulum itself. It didn\'t know it was keeping her. It follows to the forest\'s edge, and stops, and Lostelle says: "I\'ll come Tuesdays."'))]);
  s.room('home', 'Berry Forest: Home', 'The trees let you go.', [c('Walk her home.', home('Out of the trees.'))]);
}

// ---------- Four Island: Icefall Cave (four nodes)
{
  const s = isle('cs.kanto.sevii.icefall', 'Icefall Cave', 'PS', ['kanto.sevii.icefall', 'kanto.sevii.password2'], 1, 'An icicle');
  s.entry('Icefall Cave: The Slide', 'Slippery floors: a sliding puzzle. Every step carries you until something stops you.',
    [c('Slide it right.', o('You stop exactly at the far wall.', s.open('fall')), { prompt: ['tilt-drag', 'ok'], fail: o('You slide the long way round, twice. You get there.', s.open('fall')) })], { room: true });
  s.room('fall', 'Icefall Cave: The Waterfall', 'A waterfall, half frozen. Behind it, a way through.', [c('Behind the water.', o('Cold, then colder.', s.open('ice')))]);
  s.room('ice', 'Icefall Cave: The Ice', 'Ice types: Swinub, Sneasel, Delibird.', [c('Battle through.', battle('Something with a scarf.', wild(['swinub', 'sneasel', 'delibird'], { levelBonus: s.lv, win: [s.open('cove')] })))]);
  s.room('cove', 'Icefall Cave: The Cove', `Still green water under an ice roof. Lapras, a dozen, and among them, small ones. Crates on the ledge. Four people in black, loading. In front of them: a very old woman and a Dewgong. The Dewgong's hurt. She isn't moving. Old Winter: "Fifty years I've watched this water. I watched their grandmothers hatch. You'll go through me, and I'm awkward to go through." A poacher: "She's lost three in a row. She won't sit down."`,
    [c('Stand beside her.', battle('A double battle beside her. Old Winter, mid-fight: "Left one\'s yours. I\'ve a grudge with the right."',
      foe('Poachers', { team: ['golbat', 'arbok'], size: 2, format: 'doubles', levelBonus: s.lv, evil: 'grunt', win: [s.open('won')], lose: [s.open('crate')] })))]);
  const end = [flag('cs-kanto-sevii-icefall'), flag('kanto-sevii-icefall'), sdone];
  s.room('won', 'Icefall Cave: The Clipboard', 'The poachers leave. The second half of the password, on a dropped clipboard. A young Lapras follows you to the cave mouth.',
    [c('Invite it further.', o('Old Winter: "That one\'s nosy. Always was. Take it, if it\'ll go. Bring it back in the cold months. They like to come home in the cold."', join(['lapras']), flag('kanto-sevii-password2'), ...end, moment('A young Lapras followed you out of Icefall Cave.'), dock('four'))),
      c('Send it home.', o('It goes back to the others, looking over its shoulder twice.', flag('kanto-sevii-password2'), ...end, dock('four')))]);
  s.room('crate', 'Icefall Cave: One Crate', 'One crate leaves. You\'ll see it again in the Rocket Warehouse, where it can be opened. The clipboard\'s still on the ledge.',
    [c('Take the clipboard.', o('The second half of the password.', flag('kanto-sevii-password2'), flag('kanto-icefall-crate'), ...end, dock('four')))]);
}

// ---------- Four Island: The Island Day-Care
{
  const s = isle('cs.kanto.sevii.daycare', 'The Island Day-Care', 'EV', [], null, 'A teapot');
  s.entry('The Island Day-Care', 'The old couple: "Leave us two. They\'ll keep each other company. We\'ll just be about."',
    [c('Leave two.', o('They wave you off.', kc('daycareLeave', { count: 2 }), dock('four')), { requires: [not('kanto-sevii-daycare')] }),
      c('Collect them.', o('"They slept in a heap. We didn\'t like to move them. We had our tea round them." They come back a chemistry pair.', kc('daycareReturn'), { kind: 'campBond', chemistry: 10, calm: 5, settle: false }, flag('kanto-sevii-daycare'), sdone, dock('four')), { requires: [{ kind: 'kc', act: 'daycare' }] }),
      back('four')], { room: true });
}

// ---------- Five Island: The Rocket Warehouse (five nodes)
{
  const s = isle('cs.kanto.sevii.warehouse', 'The Rocket Warehouse', 'PS', ['kanto.sevii.warehouse'], 2, 'A crate');
  s.entry('The Rocket Warehouse', 'A shed on a headland. A door with a speaker grille. The door: "Password."',
    [c('Say both halves.', o(`The door: "'Goldeen need log. Yes, nah, Chansey.' ...Who wrote these? Come in."`, s.open('floor')), { requires: [is('kanto-sevii-password1'), is('kanto-sevii-password2')] }),
      c('Say the half you know.', o('"That\'s half." The grille clicks off.', dock('five')), { requires: [is('kanto-sevii-password1')] }), back('five')], { room: true });
  s.room('floor', 'The Rocket Warehouse: Conveyors', 'Conveyor floors. Crates stencilled: VERMILION. OLIVINE. And one address that\'s only a number.',
    [c('Ride the belts.', o('Round and down.', s.open('floor2')), { prompt: ['zip-line', 'ok'], fail: o('Round, and round, and down.', s.open('floor2')) })]);
  s.room('floor2', 'The Rocket Warehouse: Conveyors, Lower', 'More belts. The crate from Icefall, if one left, is on one of them.',
    [c('Find the office.', o('There\'s a list on the door.', s.open('admin1')))]);
  const admin = (n: number, next: string, team: string[]) => [
    c('"Your Boss is beaten. Team Rocket\'s disbanded."', battle(`Admin: "Disbanded? Disbanded? The Boss would never. You're lying. You're... somebody would have told us." They fight harder for it.${n === 2 ? ' After: "...Nobody told us. Three months. We\'ve been doing the inventory."' : ''}`,
      foe(`Rocket Admin ${n}`, { team, size: team.length, levelBonus: s.lv + 1, evil: 'executive', win: [s.open(next)], lose: [s.open('gone')] })), { requires: [is('kanto-silph-won')] }),
    c('Battle.', battle('They\'re a supply depot, and nervous. "You\'re not on the list. There\'s a list."', foe(`Rocket Admin ${n}`, { team, size: team.length, levelBonus: s.lv, evil: 'executive', win: [s.open(next)], lose: [s.open('gone')] })), { requires: [not('kanto-silph-won')] })];
  s.room('admin1', 'The Rocket Warehouse: The First Admin', 'The first Admin, behind a desk made of crates.', admin(1, 'admin2', ['golbat', 'weezing', 'arbok']));
  s.room('admin2', 'The Rocket Warehouse: The Second Admin', 'The second Admin, with a clipboard and a grudge.', admin(2, 'sci', ['muk', 'raticate', 'hypno']));
  s.room('sci', 'The Rocket Warehouse: The Scientist', 'The Scientist, Dr. Ferrand: "I don\'t care about your Rocket or your not-Rocket. I care what this is worth. Do you know what a tuned network sells for?" In his hand: the Sapphire.',
    [c('Battle.', battle('He fights like someone who\'s read about it.', foe('Dr. Ferrand', { team: ['magneton', 'electrode', 'porygon'], size: 3, levelBonus: s.lv, evil: 'specialist', win: [s.open('won')], lose: [s.open('gone')] })))]);
  const end = [flag('cs-kanto-sevii-warehouse'), flag('kanto-sevii-warehouse'), sdone];
  s.room('won', 'The Rocket Warehouse: The Sapphire', 'The Sapphire. Intel and Heat. The crate from Icefall, if one left: you open it, and a small Lapras climbs out, very cross.',
    [c('Take the Sapphire.', o('Blue, and cold, and humming faintly against the Ruby\'s hum.', flag('kanto-sevii-sapphire'), intel(), intel(), intel(), intel(), intel(), heat(5), ...end, moment('Took the Sapphire back from the Rocket Warehouse.'), dock('five'))),
      c('Open the crate from Icefall.', o('A small Lapras climbs out, very cross, and then very relieved. Old Winter will hear. You take the Sapphire too.', flag('kanto-sevii-sapphire'), intel(), intel(), intel(), intel(), intel(), heat(5), rep(3), ...end, dock('five')), { requires: [is('kanto-icefall-crate')] })]);
  s.room('gone', 'The Rocket Warehouse: Gone', 'The Scientist leaves with the Sapphire for Six Island.',
    [c('Let him go.', o('Six Island, then.', flag('kanto-sapphire-six'), ...end, dock('five')))]);
}

// ---------- Five Island: The Lost Cave (a maze)
{
  const s = isle('cs.kanto.sevii.lostcave', 'The Lost Cave', 'PS', ['kanto.sevii.lostcave'], 1, 'A sign that says COUNT');
  const DIRS = ['Up.', 'Right.', 'Down.', 'Left.'];
  const ROOMS: [number, string][] = [[2, 'Two boulders lean together in the corner.'], [3, 'Three boulders, in a row, like they\'re queueing.'], [1, 'One boulder, on its own, in the middle.'], [4, 'Four boulders, one in each corner.'], [2, 'Two boulders, one on top of the other.']];
  s.entry('The Lost Cave', 'A cave mouth. A sign that says only: "COUNT." Ghost types in the dark.',
    [c('Go in.', o('Four exits, and boulders.', s.open('m1'))), back('five')], { room: true });
  ROOMS.forEach(([n, look], i) => s.room(`m${i + 1}`, `The Lost Cave: Room ${i + 1}`, `${look} Four exits.`,
    DIRS.map((d, k) => c(d, k + 1 === n ? o('The air changes.', s.open(i < ROOMS.length - 1 ? `m${i + 2}` : 'lady')) : battle('Wrong. Something in the dark, and then the first room again.', wild(['gastly', 'haunter', 'misdreavus'], { levelBonus: s.lv, win: [s.open('m1')], lose: [s.open('m1')] }))))));
  const tea = (lead: string) => o(`${lead} Tea at her family's resort: a full rest. And a random valuable she insists on. Selphy: "Whatever's in my bag. I don't carry anything dull."`,
    heal(1), { kind: 'itemFrom', ids: ['nugget', 'big-pearl', 'star-piece', 'comet-shard'], count: 1 }, flag('cs-kanto-sevii-lostcave'), flag('kanto-sevii-lostcave'), sdone, s.open('bag'));
  s.room('lady', 'The Lost Cave: The Last Room', `A young lady in a very good coat, sitting on a rock, bolt upright, hands in her lap. Selphy: "I'm not afraid. I came in to demonstrate that. I've demonstrated it. I'm now simply... remaining." Her knuckles are white.`,
    [c('"Shall we walk out together?"', tea('"If you insist."')), c('"It\'s two boulders. Right-hand door."', tea('"I knew that."')), c('"I was afraid too."', tea('"...Were you? Honestly? Good. Then it isn\'t common."'))]);
  s.room('bag', 'The Lost Cave: Her Bag', 'At the bottom of the bag, under the valuables, a folded ticket with a lighthouse on it.',
    [c('"What\'s that one?"', o('"That? A Mystic Ticket. Grandfather\'s. He never went. Take it; somebody should." (Navel Rock goes on the ferry board.)', flag('kanto-mystic-ticket'), dock('five')), { chance: 0.25, fail: o('"Lint," says Selphy, firmly, and closes the bag.', dock('five')) })]);
}

// ---------- Five Island: The Memorial Pillar
{
  const s = isle('cs.kanto.sevii.pillar', 'The Memorial Pillar', 'EV', ['kanto.sevii.pillar'], null, 'A small stone');
  const end = [flag('cs-kanto-sevii-pillar'), flag('kanto-sevii-pillar'), sdone];
  const pour = (drink: string, smile: string) => c(`Leave him ${drink}.`, o(`The boy pours a little on the stone, and drinks a little, and pours the rest. "Thank you. He's called Tectonix. I like to say it. Here. He'd want somebody to have it."${smile} TM Metal Claw.`,
    lose(drink.replace(/ /g, '-').toLowerCase()), teach('metal-claw'), ...end, moment('Poured a drink for Tectonix at the Memorial Pillar.'), dock('five')), { requires: [has(drink.replace(/ /g, '-').toLowerCase())] });
  s.entry('The Memorial Pillar', `A rock offshore, reached at low tide or by a Water type. A stone, with a smaller stone on it. A boy standing very straight. The boy: "It's my Onix. Tectonix. He's under here. He liked lemonade. I used to bring it. I've run out, and the shop's only got a Berry."`,
    [pour('Lemonade', ' He smiles.'), { ...pour('Fresh Water', ''), requires: [{ kind: 'kc', act: 'holdsAny', ids: ['fresh-water', 'soda-pop'] }] },
      c('"Tell me about him."', o('"He was too big for the house. He slept round it. In a ring. You\'d wake up and he\'d be at every window."', s.open('stay'))), c('"I haven\'t any. I\'m sorry."', o('"That\'s all right. Not many people do."', ...end, dock('five')))],
    { room: true, remembers: [{ id: 'offering', when: [is('kanto-lavender-offering')], notice: 'The boy: "You\'ve left something somewhere too. I can tell. You stood right."' }] });
  s.room('stay', 'The Memorial Pillar: Tectonix', 'He tells you all of it. The tide turns.',
    [pour('Lemonade', ' He smiles.'), c('Stand with him a while.', o('He says the name three more times. You stay for all three.', fr(3, 'party'), ...end, dock('five')))]);
}

// ---------- Six Island: The Dotted Hole (five floors)
{
  const s = isle('cs.kanto.sevii.dottedhole', 'The Dotted Hole', 'PS', ['kanto.sevii.dottedhole'], 1, 'A dotted sign');
  const cut: Json = { kind: 'partyMove', move: 'cut' };
  s.entry('The Dotted Hole', 'A door with no handle, grown over.',
    [c('Cut it open.', o('The growth falls away. Steps down.', s.open('f1')), { requires: [cut] }),
      c('Cut it open with a slash of anything sharp.', o('It takes a while. Steps down.', s.open('f1')), { requires: [types('grass', 'bug', 'steel')] }), back('six')], { room: true });
  const DOTS = ['Down.', 'Left.', 'Up.', 'Right.', 'Down.'];
  DOTS.forEach((right, i) => s.room(`f${i + 1}`, `The Dotted Hole: Floor ${i + 1}`, `Four holes and a sign in raised dots.${i === 0 ? ' The first floor teaches the alphabet: the dots say up, down, left, right.' : ''}`,
    [c('Read the dots and take that hole.', o(`It said "${right}" You drop through.`, s.open(i < 4 ? `f${i + 2}` : 'bottom')), { requires: [is('kanto-lavender-pulse')] }),
      c('Feel the dots out.', o(`"${right}" You drop through.`, s.open(i < 4 ? `f${i + 2}` : 'bottom')), { prompt: ['echo-rhythm', 'ok'], fail: o('A wrong hole. You drop back a floor, unhurt.', s.open(i > 0 ? `f${i}` : 'f1')) })]));
  const end = [flag('cs-kanto-sevii-dottedhole'), flag('kanto-sevii-dottedhole'), sdone];
  s.room('bottom', 'The Dotted Hole: The Pedestal', 'The bottom. A pedestal.',
    [c('Lift the Sapphire.', battle('As you lift it: the Scientist, coming down the last hole.', foe('Dr. Ferrand', { team: ['magneton', 'electrode'], size: 2, levelBonus: s.lv, evil: 'specialist', win: [flag('kanto-sevii-sapphire'), ...end, dock('six')], lose: [...end, dock('six')] })), { requires: [not('kanto-sevii-sapphire')] }),
      c('Read the inscription.', o('In dots. Celio can read it: "What\'s joined can\'t be owned." An Unown Sighting.', flag('kanto-unown-sighting'), ...end, moment('Read the inscription at the bottom of the Dotted Hole.'), dock('six')), { requires: [is('kanto-sevii-sapphire')] })]);
}

// ---------- Six Island: Pattern Bush (six short battles)
{
  const s = isle('cs.kanto.sevii.patternbush', 'Pattern Bush', 'EV', ['kanto.sevii.patternbush'], 0, 'A picture in the grass');
  const GUESS = ['"It\'s a Butterfree."', '"It\'s a net."', '"It\'s my mum."', '"It\'s a map of here."', '"It\'s a Heracross."', '"It\'s nothing. That\'s what\'s so good."'];
  s.entry('Pattern Bush', `From the cliff: tall grass cut into a pattern. It's a picture of something. From inside, nobody's ever been able to tell what. A Bug Catcher at the gate: "Walk all of it, and you'll have drawn it with your feet. There's a prize. Nobody's claimed it. There's a Heracross in there that keeps moving the middle."`,
    [c('Walk it.', o('Into the grass.', s.open('g1'))), back('six')], { room: true });
  GUESS.forEach((g, i) => s.room(`g${i + 1}`, `Pattern Bush: Bug Catcher ${i + 1}`, `A Bug Catcher, with a guess: ${g}`,
    [c('Battle.', battle('A short battle.', foe('Bug Catcher', { team: [['caterpie', 'weedle', 'venonat', 'paras', 'beedrill', 'butterfree'][i]!], size: 1, levelBonus: 0, win: [s.open(i < 5 ? `g${i + 2}` : 'whole')], lose: [s.open(i < 5 ? `g${i + 2}` : 'whole')] })))]));
  s.room('whole', 'Pattern Bush: The Middle', 'The whole pattern, walked. In the middle, the Heracross that keeps moving it.',
    [c('Battle the Heracross.', battle('From the cliff, afterwards, with your path trodden in: it\'s a Heracross. The sixth boy was right. He\'s unbearable.', wild(['heracross'], { levelBonus: 0, win: [item('silver-powder'), dock('six')], lose: [dock('six')] }),
      flag('cs-kanto-sevii-patternbush'), flag('kanto-sevii-patternbush'), sdone, moment('Walked the whole of Pattern Bush. It was a Heracross.')))]);
}

// ---------- Six Island: The Altering Cave
{
  const s = isle('cs.kanto.sevii.altering', 'The Altering Cave', 'EV', [], 0, 'A pencilled sign');
  s.entry('The Altering Cave', `A plain cave. A plain sign: ALTERING CAVE. Under it, in pencil: "It's never altered. — a disappointed visitor." Under that, in different pencil: "It has now." What lives in it is different in every run: something from another region entirely.`,
    [c('Go in.', battle('One encounter the rest of Kanto can\'t offer.', wild(OTHER_REGIONS, { levelBonus: 0, win: [dock('six')], lose: [dock('six')] }), flag('cs-kanto-sevii-altering'), sdone)), back('six')], { room: true });
}

// ---------- Seven Island: Trainer Tower (eight floors)
{
  const s = isle('cs.kanto.sevii.tower', 'Trainer Tower', 'PS', ['kanto.sevii.tower'], 1, 'A clock');
  const MODES = ['Single', 'Double', 'Knockout', 'Mixed'];
  s.entry('Trainer Tower', 'A tower. A clock on the roof, with a second hand the size of a tree. The owner, on the roof, by loudspeaker: "No items! Four ways up! The clock doesn\'t care which!" The times are posted on a board, this run\'s by your lead\'s name.',
    MODES.map((m, k) => c(`${m}.`, o(`${m}, then. The clock starts.`, flag('kanto-tower-mode', k + 1), s.open('f1')))), { room: true });
  const POOL = [['machoke', 'kadabra'], ['tangela', 'seadra'], ['dodrio', 'electabuzz'], ['jynx', 'magmar'], ['rhydon', 'starmie'], ['gyarados', 'alakazam'], ['arcanine', 'lapras'], ['dragonair', 'snorlax']];
  const fallen = o('You\'re walked back down, kindly, by the trainer who beat you. "Floor six gets everyone. It got me."', flag('cs-kanto-sevii-tower'), flag('kanto-sevii-tower'), dock('seven'));
  POOL.forEach((team, i) => s.room(`f${i + 1}`, `Trainer Tower: Floor ${i + 1}`, i === 5 ? 'Floor six. It gets everyone.' : `Floor ${i + 1}, and the clock.`,
    MODES.map((m, k) => c(`${m}: battle.`, battle(`Floor ${i + 1}.`, foe(`Floor ${i + 1} Trainer`, {
      team: k === 2 ? [...team, 'clefable'] : team, size: k === 2 ? 3 : 2, ...(k === 1 || (k === 3 && i % 2 === 1) ? { format: 'doubles' } : {}), levelBonus: s.lv + (i === 5 ? 1 : 0),
      win: [s.open(i < 7 ? `f${i + 2}` : 'roof')], lose: [s.open('down')] })), { requires: [is('kanto-tower-mode', k + 1, k + 1)] }))));
  s.room('down', 'Trainer Tower: Walked Down', 'The trainer who beat you offers an arm on the stairs.', [c('Take it.', fallen)]);
  const end = [flag('cs-kanto-sevii-tower'), flag('kanto-sevii-tower'), sdone];
  s.room('roof', 'Trainer Tower: The Roof', 'The roof, and the clock, and the owner with a stopwatch. A prize by mode, and the board.',
    [c('Look at the clock.', o(`Under the posted time. The owner hands over his own held item, different every run, and something from his coat pocket: an Aurora Ticket. "Somebody gave me it. I don't like boats." (Birth Island goes on the ferry board.)`,
      { kind: 'itemFrom', ids: ['choice-band', 'quick-claw', 'scope-lens', 'kings-rock', 'focus-band'], count: 1 }, item('rare-candy'), flag('kanto-aurora-ticket'), ...end, moment('Beat the posted time at Trainer Tower.'), dock('seven')),
      { prompt: ['gauge-hold', 'good'], fail: o('A good time, not the best. A prize by mode.', item('rare-candy'), ...end, dock('seven')) })]);
}

// ---------- Seven Island: The Tanoby Chambers
{
  const s = isle('cs.kanto.sevii.tanoby', 'The Tanoby Chambers', 'PS', ['kanto.sevii.tanoby'], 0, 'A carved tile');
  s.entry('The Tanoby Chambers: The Key', 'A sea cave. Seven boulders, seven marks on the floor.',
    [c('Set the boulders.', o('When the last one\'s set: nothing happens here. A long way off, along the south cliffs, something does. Your lead has turned its head toward it.', s.open('ruins')), { prompt: ['pull-hold', 'ok'], fail: o('It takes all afternoon. When the last one\'s set, your lead turns its head toward the south cliffs.', s.open('ruins')) }),
      back('seven')], { room: true });
  s.room('ruins', 'The Tanoby Chambers: The Seven Ruins', 'Seven ruins along the south cliffs. Empty before. Not empty now. Each holds Unown, a different set of letters in each. Catch any four that spell a word, and the ruin-keeper carves you a tile.',
    [c('Search a chamber.', battle('An Unown, a letter, turning in the dark.', wild(['unown'], { levelBonus: 0, win: [flag('kanto-tanoby-letters'), s.open('ruins')], lose: [s.open('ruins')] }))),
      c('Show Mr. Dray your word.', o(`The ruin-keeper, Mr. Septimus Dray: "What did you spell? ...Good. That's a good one. A boy last year spelled 'SOUP.' I gave him the tile. It's a word." The word goes in your journal.`,
        flag('cs-kanto-sevii-tanoby'), flag('kanto-sevii-tanoby'), sdone, moment('Spelled a word in Unown at the Tanoby Chambers, and got a carved tile.'), dock('seven')), { requires: [is('kanto-tanoby-letters', 4)] }),
      back('seven')]);
}

// ---------- Seven Island: Sevault Canyon (four battles)
{
  const s = isle('cs.kanto.sevii.canyon', 'Sevault Canyon', 'EV', ['kanto.sevii.canyon'], 2, 'A dance step');
  const T: [string, string[]][] = [['Cooltrainer Hoy', ['nidoqueen', 'pidgeot']], ['Black Belt Aldous', ['hitmonchan', 'hitmonlee']], ['Psychic Mabel', ['mr-mime', 'slowbro']], ['Cooltrainer Fen', ['vaporeon', 'jolteon', 'flareon']]];
  s.entry('Sevault Canyon', 'A canyon with nobody in it but the best ordinary trainers in Kanto, who train here because nobody comes. The first, dropping what she\'s holding: "Somebody\'s come! Hoy! Everyone! Somebody\'s come!"',
    [c('Battle.', battle('They\'re delighted. They\'re very good.', foe(T[0]![0], { team: T[0]![1], size: 2, levelBonus: s.lv, win: [s.open('t2')], lose: [s.open('t2')] }))), back('seven')], { room: true });
  T.slice(1).forEach(([name, team], i) => s.room(`t${i + 2}`, `Sevault Canyon: ${name}`, 'The last one thanks you, sincerely, win or lose. The next one\'s already running over.',
    [c('Battle.', battle('Thanks, sincerely, win or lose.', foe(name, { team, size: team.length, levelBonus: s.lv, win: [s.open(i < 2 ? `t${i + 3}` : 'dance')], lose: [s.open(i < 2 ? `t${i + 3}` : 'dance')] })))]));
  const end = [flag('cs-kanto-sevii-canyon'), flag('kanto-sevii-canyon'), sdone];
  s.room('dance', 'Sevault Canyon: The Dance', 'From the last of them, a dance. "It\'s a Chansey dance. It doesn\'t do anything. It teaches something, if you do it for one that\'s never learned a gentle move."',
    [c('Dance it for one that knows no status move.', o('It watches, baffled, then copies, and remembers something soft: it learns Sing.', teach('sing'), ...end, moment('Learned the Chansey dance in Sevault Canyon.'), dock('seven')), { pick: {} }),
      c('Dance it anyway.', o('Everyone joins in. It doesn\'t do anything. It\'s lovely.', fr(3, 'party'), ...end, dock('seven')))]);
}

// ---------- The far islands (tickets)
{
  const s = isle('cs.kanto.sevii.navel', 'Navel Rock', 'EV', [], null, 'A stair');
  s.entry('Navel Rock', 'A rock in open sea. A stair up, and a stair down. Captain Tidewell won\'t get out of the boat.',
    [c('The stair up.', o('At the top, wind, and a colour without a name crossing the sun. A Ho-Oh Sighting. One feather. This one lands.', flag('kanto-hooh-sighting'), flag('kanto-sevii-navel'), moment('Saw Ho-Oh cross the sun from the top of Navel Rock.'), dock('knot')), { requires: [is('kanto-sighting-rainbow')] }),
      c('The stair down.', o('At the bottom, black water, and something very large turning over in it, slowly. A Lugia Sighting.', flag('kanto-lugia-sighting'), flag('kanto-sevii-navel'), moment('Saw something vast turn over in the water under Navel Rock.'), dock('knot')))], { room: true });
}
{
  const s = isle('cs.kanto.sevii.birth', 'Birth Island', 'EV', [], null, 'A black triangle');
  s.entry('Birth Island', 'An empty island. One black triangle on the ground. When you step toward it, it\'s somewhere else. Reach it in the fewest moves, six times, each time with one move fewer.',
    [c('Chase it.', o('The last time, it doesn\'t move. It lifts. The sky behind it\'s doing something. A Deoxys Sighting.', flag('kanto-deoxys-sighting'), flag('kanto-sevii-birth'), moment('Watched the triangle lift on Birth Island.'), dock('knot')), { prompt: ['aim-drag', 'good'], fail: o('It\'s always one step ahead. The boat\'s waiting.', dock('knot')) })], { room: true });
}

export const REMOVE: string[] = [];

