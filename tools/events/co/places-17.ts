// Catalog Overhaul Pack, category "places": STORY_FAMILIES_17.md SF129 Single Merges (part 2: people, shops, fights and the rerolls).
// Each beat is folded into the home the pack names. Where that home belongs to another row (a questline, the Honest Market,
// the Evil Team's defector arc), the beat plays its own scene here and leaves a flag that home can read (flags file lists them).
// Every fight here is friendly: a loss never ends the run.
import { $, any, ch, express, flag, fr, has, heal, item, join, lose, money, out, reveal, rp, scout, stat, takeNode, trainer, trade, type Json } from '../dsl.ts';
import { kind, moment, rep } from './_delve.ts';

export const CATEGORY = 'places';

const later = (id: string, nodes = 1): Json => ({ kind: 'laterEvent', eventId: id, nodes });
const bond = (n: number, who: Json | string = 'party'): Json => ({ kind: 'friendship', bond: n, who });
const fightW = (text: string, o: { species?: string[]; types?: string[]; lv: number; win: Json[]; aura?: boolean }, ...fx: Json[]): Json =>
  ({ text, effects: fx, battle: { kind: 'wild', friendly: true, species: o.species ?? [], types: o.types ?? [], levelBonus: o.lv, shinyMultiplier: 1, ...(o.aura ? { aura: true } : {}), win: o.win } });
const fightT = (text: string, battle: Json, ...fx: Json[]): Json => ({ text, effects: fx, battle: { ...battle, friendly: true } });
const E = (id: string, intro: string, choices: Json[], extra: Record<string, unknown> = {}): Json => ({ id, intro, choices, ...extra });
const walk = (text: string): Json => out(text);

export const EVENTS: Json[] = [
  // --- Questline doors (the questline itself belongs to another row; this is how the road finds it) ---
  E('ghost-ship', 'Fog on the water, thick as wool. Out of it, slowly, a ship: old timbers, torn sails, a lantern swinging at the bow with nobody holding it. Nobody on deck. It makes no sound at all. The old sailors say it sails once every hundred years, looking for something it lost.', [
    ch('Board.', fightW('You climb the rope ladder. The deck is warm, as if people stood here a moment ago. Then the lanterns all turn to face you, and the crew is not people at all.', { types: ['ghost'], lv: 3, win: [flag('ghost-ship-boarded'), any('spell-tag', 'reaper-cloth', 'cleanse-tag'), moment('Boarded the ship that sails every hundred years.')] })),
    ch('Signal.', out('You raise a light and swing it, slow, the way sailors do. For a long moment nothing. Then, from the bow, the lantern swings back. Once. Like a thank-you. The ship turns into the fog and is gone, and the water is just water again.', flag('ghost-ship-signalled'), { kind: 'attribute', key: 'luck', amount: 1 })),
  ], { name: 'The Ghost Ship' }),
  E('ghost-train', 'An empty platform at the edge of town, a timetable with no times on it. A dark train is waiting with its doors open. Every carriage is lit. Every seat is empty. A sign in the window says only: THE LAST STOP.', [
    ch('Board.', fightW('You step on and the doors close behind you without a sound. The train pulls out. In the next carriage, someone is sitting very still, and when they turn round they have no face at all.', { types: ['ghost'], lv: 2, win: [{ kind: 'levels', amount: 2, who: 'lead' }, flag('last-stop-rode')] })),
    ch('Wait for the next one.', out('You sit on the bench. The doors close. The train leaves without you, and as it goes, every window has someone in it, waving. Your team presses close to you. The next train is an ordinary one, full of tired people going home, and you have never been so glad to see tired people.', heal(0.25), bond(1))),
  ], { name: 'The Ghost Train' }),
  E('mr-cartographer', 'A studio above a bakery, every wall papered with maps, some of places that are not on any other map. **Cartographer, Inigo:** "Ah, a walker! I can tell by the boots. I\'ll fill your map in for you. Three hundred, and I never draw a road I haven\'t walked."', [
    ch('Pay. (300)', out('He takes your map and draws fast, muttering, tongue between his teeth. When he gives it back, every stop ahead is on it, and the roads between, and a tiny drawing of you in the corner.', $(-300), reveal(), scout(3)), { requires: [money(300)] }),
    ch('Ask about his maps.', out('He lights up. For an hour he walks you round the walls: the island that sank, the road that only exists in winter, the town that moved. Before you go he sketches the next bit of your road for free. "For listening," he says. "Nobody listens."', scout(2), bond(1))),
  ], { name: 'The Cartographer' }),
  E('dojo-challenge', 'A dojo with paper walls and a floor polished by a thousand bare feet. A Black Belt kneels at the door and bows low. "Welcome. Spar, or meditate? Both are training. Only one of them hurts."', [
    ch('Spar.', fightT('He bows again, and then he is very fast.', trainer('Black Belt Kenji', { cls: 'black-belt', size: 2, lv: 1, win: [{ kind: 'attribute', key: 'strength', amount: 1 }, later('dojo-tyrogue')] }))),
    ch('Meditate.', out('You kneel beside him and your lead kneels beside you. You breathe. It breathes. For a while there is nothing in the world but breath, and when you stand, your lead stands steadier than it ever has.', stat('spd'), { kind: 'attribute', key: 'ragePeace', amount: 1 })),
  ]),
  { ...E('dojo-tyrogue', 'Footsteps behind you on the road, light and quick. A Tyrogue, one of the dojo\'s little ones, fists up, hopping from foot to foot. It watched you spar. It wants to go where fights like that happen.', [
    ch('Take it along.', out('It punches the air, twice, and falls in beside your lead, copying the way it walks. Back at the dojo, someone will be smiling.', join({ species: ['tyrogue'] }), moment('A Tyrogue followed us from the dojo.'))),
    ch('Send it home.', out('You crouch down and tell it the dojo needs it more. It thinks about that very seriously. Then it bows, the way the Black Belt bowed, and runs back the way it came.', rep(1))),
  ]), name: 'A Small Challenger', group: 'Places', room: true, scene: { cast: [], pokemon: 'tyrogue', effect: 'none' } },
  E('dream-team-draft', 'A scout with a clipboard and three Poké Balls lined up on a crate. "Draft day! Pick one of three. They fight beside you for one battle against my best, and then they go home. No contracts. Just one fight, together."', [
    ch('Draft Pikachu.', fightT('Pikachu hops out, cheeks crackling, and stands next to your lead like it has always been there.', trainer('Draft Scout', { cls: 'ace-trainer', size: 2, ally: 'pikachu', win: [$(300), bond(1)] }))),
    ch('Draft Machop.', fightT('Machop rolls its shoulders and nods to your lead, one fighter to another.', trainer('Draft Scout', { cls: 'ace-trainer', size: 2, ally: 'machop', win: [$(300), bond(1)] }))),
    ch('Draft Gastly.', fightT('Gastly drifts out and grins at the scout\'s team with far too many teeth.', trainer('Draft Scout', { cls: 'ace-trainer', size: 2, ally: 'gastly', win: [$(300), bond(1)] }))),
    ch('Pass.', walk('"Next year, then," says the scout, and tips his cap.')),
  ], { name: 'Dream Team Draft' }),
  // The Mirror Trainer (SF41.7 Mirror Lake): both old ids are the same trainer on two roads.
  ...['mirror-image-trainer', 'mirror-match'].map((id) => E(id, 'A trainer at the roadside holds up a tall mirror, and in it is your team, exactly, down to the scratches. "Beat your own build," they say. "Everyone thinks they could. Almost nobody can."', [
    ch('Battle.', fightT('Your reflection steps out of the glass and bows, and every move you were about to make, it makes first.', trainer('Mirror Trainer', { size: 3, lv: 2, mirror: true, win: [flag('mirror-lake-hint'), rp(2), bond(1)] }))),
    ch('Turn the mirror away.', walk('You turn the mirror gently to face the hills. "Fair," says the trainer. "Some days you don\'t want to meet yourself."')),
  ], { name: 'The Mirror Trainer' })),
  E('hall-of-mirrors', 'A long hall of old mirrors, and none of them show you as you are now. They show this run: the Pokémon you carried through rain, the one you stayed up with, the one you did not leave behind. Every kindness, lit up in silver.', [
    ch('Look at each.', out('You walk the whole hall slowly and look at every one. Your team looks too. They see themselves being helped, over and over, by you, and when you reach the end they crowd round you so close you can hardly walk.', bond(1), rp(2))),
    ch('Walk through.', out('You walk through without stopping. Some things you do not need to see again; you were there. At the far end, a mirror shows only the road ahead, and it is bright.', rp(1))),
    ch('Look into the mirror of kindness.', out('The kind mirror shows every good thing you have done, and the faces of the people and Pokémon you did it for.', bond(2), rp(2)), { requires: [{ kind: 'meter', key: 'goodEvil', side: 'positive', atLeast: 2 }] }),
  ]),
  E('school-yard-skirmish', 'A school yard at lunch. Kids with Poké Balls everywhere, all shouting at once: "Battle! Battle! Battle!" A teacher on a bench gives you a look that says please.', [
    ch('Coach them.', out('You sit them down in a circle and show them how to read a type chart with their fingers. By the bell they are cheering each other on instead of shouting. "We\'re a team," says the smallest one, amazed. "We\'re the Little League!"', flag('little-league-coached'), rep(1), ...kind())),
    ch('Battle them all.', fightT('They come at you two at a time, giggling. It is chaos. It is wonderful.', trainer('School Kids', { cls: 'youngster', size: 6, lv: -5, chain: 2, win: [$(200), fr(3)] }))),
    ch('Hand out candy.', out('You share what you have. Twenty sticky faces say thank you at once.', $(-50), ...kind()), { requires: [money(50)] }),
  ], { name: 'School Yard' }),
  E('court-case', 'A court held on the roadside, on hay bales. A Meowth sits in the dock with its ears flat, accused of breaking a farmer\'s fence. It looks very small. **Judge:** "Will anyone speak for the defendant?"', [
    ch('Defend it.', out('You walk the fence line in front of everyone. The posts are snapped at hip height to a Tauros, not a Meowth. There are hoof prints in the mud. The real culprit is grazing in the next field, chewing, unbothered. The court bursts out laughing; the farmer apologises; the Meowth is free. It looks at you for a long time, then follows you out of town.', join({ species: ['meowth'] }), flag('court-won'), ...kind(), moment('Spoke for a Meowth in the Court of the Road. The Tauros did it.'))),
    ch('Stay silent.', out('Nobody speaks. The judge sighs and lets the Meowth go with a warning anyway, because nobody can prove anything. It slinks off. You think about it for a long time after.')),
  ]),
  E('museum-return', 'The museum doors are open but the guard is crying. **Curator:** "Someone stole our relics. In the night. The cases are just... empty. Those pieces were thousands of years old, and they were ours, everyone\'s."', [
    ch('I\'ll look.', out('You ask around. A Gym Leader is already on the case, a tall woman with a library card in her coat. "Lenora," she says. "If you\'re helping, keep up." Behind the museum, a scrap of paper: a stall number at a market nobody admits exists.', flag('museum-relic-lead'), flag('black-market-lead'))),
    ch('Return a Rare Bone.', out('You put the Rare Bone in an empty case. The curator holds it like a baby. "It isn\'t ours," she says. "But it\'s somebody\'s, and now it\'s safe." She presses a reward into your hands.', lose('rare-bone'), $(700), ...kind(), rp(3)), { requires: [has('rare-bone')] }),
    ch('Return a Relic Gold.', out('You give the Relic Gold to the curator. Her hands shake. "This was in the case nearest the door. The first one they took." She pays you, and writes your name in the donor book.', lose('relic-gold'), $(900), ...kind(), rp(3)), { requires: [has('relic-gold')] }),
    ch('Not today.', walk('You leave them to it. The guard is still crying when you go.')),
  ]),
  E('carnival-booths', 'The fairground at dusk: strings of lights, the smell of sugar, a Ferris wheel turning slow. Ring toss, a shooting gallery, a tub of Berries bobbing in water. **Barker:** "Fifty a go! Everybody wins something, some people win something good!"', [
    ch('Ring toss. (50)', out('Your ring spins, wobbles, drops clean over the bottle. The barker groans theatrically and hands you a prize.', $(-50), item('super-potion')), { requires: [money(50)] }),
    ch('Shooting gallery. (50)', out('You knock down every tin Voltorb in the row. Your team cheers louder than the crowd.', $(-50), any('great-ball', 'ultra-ball')), { requires: [money(50)] }),
    ch('Bob for Berries. (50)', out('You come up soaked and laughing with a Sitrus Berry in your teeth. A kid gives you a seedling from her pocket for being brave.', $(-50), item('sitrus-berry'), { kind: 'seedling', berry: 'sitrus-berry', mutated: false }), { requires: [money(50)] }),
    ch('Ride the wheel.', out('You ride the Ferris wheel with your team piled in the car. At the top it stops, and for a minute you can see the whole road you came along, lit up, and the road still to go.', bond(1))),
  ]),
  E('legend-autograph', 'A crowd in the town square, and at the middle of it a famous trainer at a folding table, signing anything people hold out: Poké Balls, hats, a little boy\'s arm. The queue goes round the fountain twice.', [
    ch('Queue.', out('You wait an hour. When you reach the front the legend looks up, then looks again, at your team. "You\'ve walked a long way with them," they say. "I can tell." Someone in the crowd, a traveller with a worn pack, watches you go, and writes something down.', flag('legend-autograph-signed'), flag('pc8-traveller-noticed'), { kind: 'attribute', key: 'charisma', amount: 1 }, bond(1))),
    ch('Skip the queue.', walk('You wave from the back and keep walking. Some legends you meet in a queue. Others, you become.')),
  ], { name: 'The Local Legend' }),
  E('ranger-rescue', 'A Pokémon Ranger kneeling by a fallen tree, Styler in one hand, the other on the head of a Pokémon pinned underneath. Its breathing is fast and scared. "I can\'t lift this on my own," the Ranger says. "Please. It\'s been here all night."', [
    ch('Help.', out('You and your team lift together. The tree groans, rises an inch, two, enough. The Ranger pulls it free. It is shaking, bruised, alive. It will not leave your side after that; the Ranger smiles and writes something in a notebook. "We could use people like you."', join({ lv: 2, shiny: 2 }), flag('ranger-mission-lead'), ...kind(), rep(1))),
    ch('Keep walking.', walk('You walk on. Behind you the Ranger keeps pushing at the tree, alone.')),
  ]),
  // The Honest Market regulars (SF87): one shopkeeper, Marta, three visits.
  E('shopkeeper-regular', 'A little shop with one stool by the counter. **Shopkeeper, Marta:** "Back again? Regulars get the good stool. Sit. Tell me where you\'ve been."', [
    ch('Sit.', out('You sit. She makes tea. You tell her about the road and she listens as if it matters, and when you stand up to go she has slipped a Potion into your bag without asking.', flag('shop-loyalty'), flag('trust-shopkeeper'), item('potion'), bond(1))),
    ch('Buy a little something. (100)', out('She wraps it in paper and string, the way her mother did.', $(-100), flag('shop-loyalty'), item('potion')), { requires: [money(100)] }),
    ch('Just browse.', walk('"Take your time," she says. "The shop isn\'t going anywhere. Neither am I."')),
  ], { name: 'The Shopkeeper Who Knows You' }),
  E('shopkeeper-discount', '**Shopkeeper, Marta:** "There you are! I kept something back." A box under the counter, tied with string. "Mystery discount, for regulars. I won\'t say what\'s in it. That\'s the mystery."', [
    ch('Take the box. (150)', out('Inside, wrapped in tissue: something good, and a note in her handwriting that just says "for the road".', $(-150), any('premier-ball', 'full-heal', 'revive')), { requires: [money(150)] }),
    ch('Thank her and leave it.', out('"Keep it for someone who needs it more," you say. She looks at you for a long moment, then gives you a Sitrus Berry anyway. "That\'s not a discount. That\'s just me."', item('sitrus-berry'), flag('shop-loyalty'), flag('trust-shopkeeper'))),
  ]),
  E('shopkeepers-delivery', '**Shopkeeper, Marta:** "Could you carry a bag for me? My sister\'s at the next town and my knees aren\'t what they were. I\'ll pay by distance: a hundred for every stop you carry it."', [
    ch('Carry the bag two stops. (+200)', out('It is heavier than it looks. Two stops on, her sister opens the door, sees the bag, and bursts into tears. "She remembered my birthday." You get paid, and a slice of cake.', takeNode(2), $(200), ...kind(), flag('h-delivery'))),
    ch('Carry it three stops. (+300)', out('You take the long road, the one with the view. Three stops, three hundred, and a letter back for Marta you promise to deliver next time.', takeNode(3), $(300), ...kind(), flag('h-delivery'))),
    ch('Send a Pokémon to carry it.', out('Your strongest Pokémon takes the bag in its teeth, proud as anything, and trots there and back. Marta pays it in treats as well as you in coins.', $(100), fr(3))),
    ch('Not today.', walk('"Another time," she says, and pats the bag. "It\'ll keep."')),
  ]),
  E('lucky-egg-hunt', 'Painted eggs hidden all over a park: in the roots, in the flowerbeds, one balanced on a statue\'s head. Kids run everywhere. Somewhere in here, everyone says, is a real Lucky Egg.', [
    ch('Hunt.', out('You search high. Up in the fork of an old tree, warm from the sun: the Lucky Egg, shining.', item('lucky-egg')), { chance: 0.5, fail: out('You search high and low and find painted eggs, a lost glove, and a Berry or two. Someone else gets the Lucky Egg, and you cheer with the crowd.', any('oran-berry', 'sitrus-berry', 'lum-berry')) }),
    ch('Help a kid hunt.', out('A little girl is crying because she has found nothing. You crouch beside her and play warmer, colder. When she finds the Lucky Egg herself her scream of joy turns the whole park round. Then she runs straight back and puts it in your hands. "You helped," she says. "So it\'s yours."', takeNode(), item('lucky-egg'), ...kind())),
  ], { name: 'The Egg Hunt' }),
  E('mudslide-thanks', 'At the bend in the road, the Pokémon you pulled from the mudslide are waiting for you. Clean now, standing in a line, the littlest one bouncing.', [
    ch('Greet them.', out('You kneel and they come to you one by one, pressing their heads into your hands. The Mudbray pushes something into your palm with its nose: a pouch of soft sand from the riverbank, the softest it could find.', item('soft-sand'), flag('mudslide-thanked'), bond(1)), { branches: [{ when: [{ kind: 'flag', key: 'mudslide-mudbray-kept', atLeast: 1, atMost: 99 }], text: 'You kneel and they come to you one by one, pressing their heads into your hands. Your own Mudbray stands with them for a moment, the way family does, and then comes back to you.', effects: [flag('mudslide-thanked'), bond(2)] }] }),
    ch('Ask what they know.', out('They lead you a little way and show you the road ahead from a high rock.', scout(2), flag('mudslide-thanked'))),
    ch('Invite the youngest along.', out('The littlest one cannot believe it. It runs one full circle round you before it settles in.', join({ species: ['diglett', 'geodude', 'sandshrew', 'onix', 'trapinch', 'drilbur'], lv: 1 }), flag('mudslide-thanked'))),
  ]),
  E('nesting-ground', 'A nesting ground in the long grass. Parents stand guard over a ring of eggs, watching you with hard eyes. One egg wobbles, tips, and rolls out of the nest and down the slope, right to your feet.', [
    ch('Roll it back.', out('You pick it up, warm and heavy, and walk it slowly back up the slope, never taking your eyes off the parents. You set it in the nest. They look at you, and then they bow, both of them, all the way down.', bond(1), any('oran-berry', 'sitrus-berry', 'lum-berry'), ...kind())),
    ch('Keep it.', out('You lift the egg and walk away. Behind you the parents call and call. The egg is warm against you all the way down the road.', { kind: 'egg', species: [], types: [], levelBonus: -3, shinyMultiplier: 3, left: 2, unit: 'battle' }, flag('taken-egg'), { kind: 'attribute', key: 'goodEvil', amount: -1 }), { requires: [{ kind: 'noTrainerTag', tag: 'pacifist' }] }),
  ]),
  // The Poacher Camp (the Smuggling Ring): both old ids are one camp.
  ...['poacher-hideout', 'poacher-camp'].map((id) => E(id, 'Cages by a smouldering fire. Pokémon inside, pressed to the back bars, too tired to cry any more. Tents, a truck, and men\'s voices from behind them.', [
    ch('Free them.', fightT('You open the first cage and a hunter shouts. They come out of the tents fast.', trainer('Pokémon Hunter', { cls: 'roughneck', size: 3, lv: 2, win: [{ kind: 'addEvent', eventId: 'poacher-freed' }, ...kind(2), rep(1)] }))),
    ch('Report it.', out('You slip away and find the Rangers. By dark the camp is surrounded and the cages are open. You watch from the hill as the last one runs free.', rp(10), ...kind())),
  ], { name: 'The Poacher Camp' })),
  { ...E('poacher-freed', 'The hunters are gone. One by one the cage doors swing open and the Pokémon run, limping, into the trees. All but one. It will not go near a Poké Ball, will not even look at one; it just stands next to you, shaking.', [
    ch('Walk with it.', out('You do not reach for a ball. You just start walking, and it walks beside you, and after a while it stops shaking.', join({ lv: 1 }), flag('smuggling-ball-shy'), moment('A Pokémon from the poacher cages walks beside us. It is afraid of Poké Balls.'))),
    ch('Let it find its way home.', out('You point it toward the trees. It looks back once, then goes.', ...kind())),
  ]), name: 'The Open Cages', group: 'Places', room: true },
  E('secret-route-path', 'A gap in the rock you would never see unless you were looking. Through it, grass in odd colours, and the call of a Pokémon you know, but wrong somehow, as if it grew up somewhere else.', [
    ch('Follow it.', fightW('The path opens into a hidden valley full of Pokémon in forms you have only read about. One of them does not like strangers.', { species: ['tauros-paldea-combat-breed', 'mr-mime-galar', 'stunfisk-galar', 'yamask-galar', 'darumaka-galar', 'qwilfish-hisui'], lv: 4, win: [flag('delta-habitat'), rp(10)] })),
    ch('Mark it on your map.', out('You mark the gap carefully. A scientist will want to know.', rp(40), flag('delta-habitat'))),
  ]),
  E('challengers', 'Three trainers on three stone pedestals, each in a cape. "Pick your opponent! Each of us fights by a rule!"', [
    ch('The No-Switch Duelist.', fightT('"Whoever you send out stays out. No running."', trainer('No-Switch Duelist', { cls: 'youngster', size: 2, lv: 0, rule: { noSwitch: true }, win: [$(300), stat('best')] }))),
    ch('The Empty-Pocket Ace.', fightT('"No items. Just you and them."', trainer('Empty-Pocket Ace', { cls: 'psychic', size: 2, lv: 1, rule: { noItems: true }, win: [$(400), any('protein', 'calcium', 'carbos')] }))),
    ch('The Masked Veteran.', fightT('"You will not know what you face until it moves."', trainer('Masked Veteran', { cls: 'dragon-tamer', size: 3, lv: 3, rule: { hiddenFoe: true }, win: [$(600), any('leftovers', 'focus-sash', 'life-orb')] })), { requires: [{ kind: 'noTrainerTag', tag: 'pacifist' }] }),
  ], { name: 'Mysterious Challengers' }),
  E('department-store-sale', 'Banners across the front of the department store: EVERYTHING MUST GO! A truck at the loading door, the staff selling straight off the back of it.', [
    ch('Ball bundle. (400)', out('A bag of Poké Balls with a Great Ball on top.', $(-400), item('great-ball'), item('poke-ball', 2)), { requires: [money(400)] }),
    ch('Healing bundle. (500)', out('Potions and a Full Heal, wrapped in a store bag.', $(-500), item('super-potion'), item('full-heal')), { requires: [money(500)] }),
    ch('Vitamin bundle. (1,200)', out('Two bottles, sealed, the real thing.', $(-1200), any('protein', 'calcium', 'carbos'), any('protein', 'calcium', 'carbos')), { requires: [money(1200)] }),
    ch('Browse.', walk('You wander the aisles. Nothing calls to you today.')),
  ]),
  E('fight-or-flight', 'A huge Pokémon stands guard over something glowing in a hollow, eyes burning with an alpha\'s red light. It has not noticed you yet.', [
    ch('Calm it.', out('You set your bag down and walk slowly, hands open, humming. It watches. It lowers its head, and lets you take the glowing thing from the hollow.', any('leftovers', 'focus-sash', 'life-orb'), ...kind()), { chance: 0.5, fail: out('It rears up, and you back away slowly. It does not follow. Some guardians are not ready to trust anyone.') }),
    ch('Battle.', fightW('Its eyes flare red. Alphas fight with everything.', { lv: 4, aura: true, win: [any('leftovers', 'focus-sash', 'life-orb'), rp(3)] })),
    ch('Leave.', walk('You leave it to its watch. Whatever it guards, it guards for a reason.')),
  ]),
  E('fortune-teller', 'A tent of purple cloth, a candle, three cards face down on a velvet cloth. "The cards know who waits at the Gym," says the woman behind them, not looking up. "Sit."', [
    ch('Read me. (500)', out('She turns the cards one by one. A face, a type, a Pokémon. When you look up she is smiling. "Now you know. Knowing is half of it."', $(-500), { kind: 'gymPreview' }), { requires: [money(500)] }),
    ch('Read them yourself.', out('You turn the cards before she can stop you, and you read them right. She laughs out loud. "Oh, I like you."', { kind: 'gymPreview' }), { requires: [{ kind: 'attribute', key: 'intelligence', atLeast: 40 }] }),
    ch('Not today.', walk('"The cards will wait," she says. "They always do."')),
  ], { name: 'The Fortune Teller' }),
  E('lost-pokemon', 'A small Pokémon sitting alone in the road, crying. No trainer. No ball. Just a scrap of ribbon round its neck with a name on it, half washed off.', [
    ch('Help it find its trainer.', out('You walk it from door to door. At the eleventh house a girl opens the door and screams its name and drops to her knees, and it leaps into her arms. Her parents press a reward on you and will not take no for an answer.', $(600), any('potion', 'super-potion', 'premier-ball'), ...kind(), moment('Walked a lost Pokémon home, door to door, until we found her.'))),
    ch('Keep it.', out('Nobody is looking for it. It stops crying when you pick it up.', join({ lv: -2 }), { kind: 'attribute', key: 'goodEvil', amount: -1 }), { requires: [{ kind: 'noTrainerTag', tag: 'pacifist' }] }),
    ch('Walk on.', walk('You walk on. Its crying follows you a long way.')),
  ]),
  E('mysterious-chest', 'A heavy iron chest at the roadside, half sunk in moss. As you get close it rattles, once, all on its own.', [
    ch('Open it.', out('Gold, and something better underneath.', any('nugget', 'big-pearl', 'pearl'), any('leftovers', 'focus-sash', 'life-orb'), { kind: 'attribute', key: 'luck', amount: 1 }), { chance: 0.6, fail: fightW('The lid flies open and the chest is not a chest.', { lv: 2, win: [any('nugget', 'big-pearl', 'pearl')] }) }),
    ch('Leave it.', walk('It rattles again as you walk away, almost disappointed.')),
  ], { name: 'The Rattling Chest' }),
  E('shady-dealer', 'A man in a long coat with his hat pulled down. "Trade me one of yours for something stronger. Look, I\'ll show you the card. What you give, what you get. All honest." He holds up a card with the trade written on it, plain as day.', [
    ch('Trade an unevolved Pokémon.', out('He reads the card out loud so you both agree. The swap is fair. The one you get is strong, and a little nervous, and grows used to you.', trade('an unevolved Pokémon', { stage: 1 }), join({ lv: 4 }))),
    ch('Refuse.', walk('"Suit yourself." He tips his hat and is gone before you blink.')),
  ], { name: 'The Shady Dealer' }),
  E('training-session', 'A Black Belt in a clearing, sweating, a punching bag on a branch. "Your lead looks strong. Want me to make it stronger? Pick a drill."', [
    ch('Train hard.', out('He works your lead until it drops, then works it again. It gets up stronger.', { kind: 'levels', amount: 2, who: 'lead' }, { kind: 'damage', share: 0.2 }, { kind: 'attribute', key: 'strength', amount: 1 })),
    ch('Train gently.', out('He shows you stretches. Your lead copies you, and you copy it, and by the end you are both laughing.', fr(15, 'lead'), { kind: 'attribute', key: 'ragePeace', amount: 1 })),
  ]),
  E('vitamin-seller', 'A crate of unlabelled bottles and a seller who will not stop smiling. "Vitamins! Cheap! Probably vitamins!" Behind the crate, in a locked case, a few bottles with real labels.', [
    ch('Cheap ones. (300)', out('It is a real vitamin, against all odds.', $(-300), any('protein', 'calcium', 'carbos')), { requires: [money(300)], chance: 0.5, fail: out('It is sugar water. Your team likes it, at least.', $(-300), fr(3)) }),
    ch('The real thing. (900)', out('He unlocks the case with a sigh. Two real bottles, sealed.', $(-900), any('protein', 'calcium', 'carbos'), any('protein', 'calcium', 'carbos')), { requires: [money(900)] }),
    ch('Leave.', walk('"Your loss!" he calls. It isn\'t.')),
  ], { name: 'The Vitamin Seller' }),
  // The Rerolls (Rescue and Rite rules): a Celebi Telling and three fixed-price shop items.
  E('rk-redo-ticket', 'A ticket booth with a green leaf painted over the window. Inside, nobody, just a ticket on the counter that says REDO, and a price. The leaf shimmers when you look at it, as if time moves strangely here.', [
    ch('Buy the Redo Ticket. (600)', out('You leave the coins and take the ticket. It is warm. Someday a Pokémon of yours will fall, and the ticket will remember the moment just before, and give it back. Once.', { kind: 'relic', id: 'rk-redo-ticket', name: 'Redo Ticket', effects: [{ kind: 'survivalChance', chance: 0.3 }] }, $(-600), flag('celebi-telling')), { requires: [money(600)] }),
    ch('No.', walk('You leave the ticket where it is. Some moments you want to keep, even the bad ones.')),
  ]),
  E('rk-reroll-shrine', 'A small shrine at a crossroads with a coin slot and a bell. Toss a coin, ring the bell, and the road ahead changes.', [
    ch('Toss a coin. (200)', out('The bell rings and the road ahead shivers, and a new door is there.', { kind: 'addEventFrom', ids: ['rk-door-wood', 'rk-door-iron', 'rk-floor-1'] }, reveal(), $(-200)), { requires: [money(200)] }),
    ch('Toss three coins. (500)', out('Three rings. The road ahead turns all the way round, and the door that opens is a good one.', { kind: 'addEventFrom', ids: ['rk-door-silver', 'rk-door-gold', 'rk-floor-4'] }, reveal(), scout(2), $(-500)), { requires: [money(500)] }),
    ch('No.', walk('You keep your coins and the road stays the road.')),
  ]),
  E('rk-shifting-map', 'A map pinned to a tree, and as you watch the roads on it move, slowly, like fingers.', [
    ch('Take the map.', out('You fold it into your pack. Every few stops it shifts the road a little, and shows you more.', { kind: 'relic', id: 'rk-shifting-map', name: 'Shifting Map', effects: [{ kind: 'stopShuffle', every: 3 }] }, scout(2))),
    ch('No.', walk('You leave the map to its slow shifting.')),
  ]),
  E('rk-skip-token', 'A kid at a fold-out table with a jar of wooden tokens. "Skip tokens! Skip the boring bit! Three hundred!"', [
    ch('Buy a token. (300)', out('The kid pockets your coins, very professional, and the road ahead folds shorter.', express(), $(-300)), { requires: [money(300)] }),
    ch('Haggle.', out('You haggle. The kid haggles back. You meet in the middle and shake on it.', express(), $(-150)), { requires: [money(150)], check: 'charisma', fail: out('The kid will not budge. "Fixed price. It\'s on the sign." You respect it.') }),
    ch('No.', walk('"Your loss," says the kid, and goes back to counting.')),
  ]),
  // The Double Agent: the defector arc (SF13 A5) begins here; the arc itself is the Evil Team row's.
  E('vt-double-agent', 'A villain you beat, sitting on a fence with their hat pulled low and the team badge in their hand, turning it over and over. "I\'m done with them," they say, not looking at you. "I mean it this time. I just don\'t know where to go."', [
    ch('Come along.', out('They look up, surprised that you mean it. "You\'d really...?" Their one Pokémon comes out of its ball on its own and sits at your feet. They throw the badge in the river.', join({ lv: 1 }), flag('vt-double-agent'), flag('defector-joined'), ...kind(), moment('A villain we beat threw their badge in the river and came with us.'))),
    ch('Prove it.', out('"Fair." They tell you everything: where the team meets, who is in charge, where the next job is. They draw it on your map.', rp(30), scout(3), flag('defector-tip'))),
    ch('No.', walk('"I get it," they say. When you look back, the badge is still in their hand.')),
  ]),
];

export const REMOVE: string[] = [];
