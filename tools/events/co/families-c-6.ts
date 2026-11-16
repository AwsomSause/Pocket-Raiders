// Catalog Overhaul, families-c part 6: STORY_FAMILIES_10.md SF79 to SF86 (The Clockwork Vault, The Trapped Crypt,
// Three Factions, The Friendly Guide, The Watchers, The Dragon's Question, The Oath Stone, the Oracle's three
// prophecies). Re-read log: docs/status/co-families-c.md.
import { $, again, any, bondUp, ch, ev, fight, flag, flagAgo, flagIs, fr, good, heal, item, join, leave, money, out, room, rp, takeNode, type Json } from '../dsl.ts';
import { done, notYet, repDown, repUp, stamped, tf, wf } from './_families-c-kit.ts';

export const CATEGORY = 'families-c';

// ---------- SF79 The Clockwork Vault (a Delve: three levers, then the gear door) ----------
const GEARS = { cast: [], pokemon: 'klink', tint: '#2a2418', effect: 'none' };
const gRoom = (id: string, name: string, intro: string, choices: Json[]): Json => ev(id, name, 'Dungeon Puzzles', { room: true, ...GEARS }, intro, choices);
const LEVERS = ['vault-lever-cold', 'vault-lever-pit', 'vault-lever-sparks'];
const backToHall = room('dz-clockwork-hall');
const pulled = (k: string): Json[] => [flag(k), backToHall];
const SF79: Json[] = [
  ev('dz-clockwork', 'The Clockwork Vault', 'Dungeon Puzzles', GEARS,
    'A hall of gears under a stone dome. Three levers must be pulled for the middle door to open. The floor is full of traps. A brass plate: "MADE FOR SOMEONE WHO WILL KNOW WHAT IT IS FOR."',
    [
      ch('Go in.', out('The gears turn as you step inside, slowly, like something breathing in its sleep.', ...LEVERS.map((k) => flag(k, -99)), backToHall)),
      ch('Leave it.', leave('You leave the gears to their ticking.')),
    ]),
  gRoom('dz-clockwork-hall', 'The Hall of Gears', 'Three passages, and a round door in the middle with three empty slots.', [
    ch('Left passage (sparks).', out('You take the left passage. The air smells of hot metal.', room('dz-clockwork-sparks')), { requires: [flagIs('vault-lever-sparks', 0, 0)] }),
    ch('Right passage (pit).', out('You take the right passage. The floor drops away ahead.', room('dz-clockwork-pit')), { requires: [flagIs('vault-lever-pit', 0, 0)] }),
    ch('Centre (two levers).', out('You take the centre passage. It\'s very cold.', room('dz-clockwork-lever')), { requires: [flagIs('vault-lever-cold', 0, 0)] }),
    ch('The gear door.', out('Three levers down. The gears in the round door start to turn, one inside another, and it rolls open.', room('dz-clockwork-door')), { requires: LEVERS.map((k) => flagIs(k)) }),
  ]),
  gRoom('dz-clockwork-lever', 'The Cold Lever', 'Two levers. One is right. One drops a blade. A plate: "The cold lever is the true one."', [
    ch('Touch both first.', out('The left one is warm. The right one is cold as a stone in a river. You pull the right. Somewhere, a gear drops into place.', ...pulled('vault-lever-cold'))),
    ch('Pull the left.', out('A blade drops from the ceiling. Your Pokémon pulls you back, and takes the cut instead. Then you pull the right one.', { kind: 'damage', share: 0.2, who: 'lead' }, ...pulled('vault-lever-cold'))),
    ch('Pull the right.', out('It\'s cold under your hand. A gear drops into place. Safe.', ...pulled('vault-lever-cold'))),
  ]),
  gRoom('dz-clockwork-pit', 'The Pit', 'A spiked pit, a lever on the far side, a narrow beam.', [
    ch('Walk the beam.', out('One foot, the other foot. You don\'t look down. You pull the lever on the far side.', ...pulled('vault-lever-pit')), {
      prompt: { id: 'brace-hold', needs: 'good' },
      fail: out('Halfway across, you wobble. Your lead catches you, and catches a spike for it. You make it, and pull the lever.', { kind: 'damage', share: 0.1, who: 'lead' }, ...pulled('vault-lever-pit')),
    }),
    ch('Fly a Pokémon across.', out('Your Flying-type carries you over and sets you down by the lever. Easy.', ...pulled('vault-lever-pit')), { pick: { types: ['flying'] } }),
    ch('Throw something at the lever.', out('Your Psychic-type closes its eyes. The lever pulls itself.', ...pulled('vault-lever-pit')), { pick: { types: ['psychic'] } }),
  ]),
  gRoom('dz-clockwork-sparks', 'The Sparks', 'Live wires across the floor. A lever in a cage of arcs.', [
    ch('Ground it with a Ground-type.', out('Your Ground-type puts one foot on the wires. The arcs die. You walk in and pull the lever.', ...pulled('vault-lever-sparks')), { pick: { types: ['ground'] } }),
    ch('Let an Electric-type absorb it.', out('Your Electric-type drinks the sparks down, delighted, glowing. You pull the lever.', ...pulled('vault-lever-sparks')), { pick: { types: ['electric'] } }),
    ch('Reach through.', out('You reach through. It hurts. You pull the lever anyway. Your lead takes the jolt with you, and its legs are still twitching.', { kind: 'status', status: 'paralysis', who: 'lead' }, ...pulled('vault-lever-sparks'))),
  ]),
  gRoom('dz-clockwork-door', 'The Gear Door', 'Inside: a ticking heart-shaped box on a cushion, and a note in old handwriting: "When she is ready."', [
    ch('Open the box.', out('It\'s empty. But it\'s warm, as if something was just here. As if something will be.', flag('vault-magearna'))),
    ch('Leave it.', leave('You leave it ticking on its cushion. The vault closes behind you.')),
    ch('Wind it.', out('You turn the little key. It ticks faster, happier. Somewhere, something hears it.', flag('vault-magearna'), flag('vault-wound'))),
  ]),
];

// ---------- SF80 The Trapped Crypt ----------
const CRYPT = { cast: [], tint: '#1a1a22', effect: 'fog' };
const cRoom = (id: string, name: string, intro: string, choices: Json[], o: Json = {}): Json => ev(id, name, 'Dungeon Puzzles', { room: true, ...CRYPT, ...o }, intro, choices);
const SF80: Json[] = [
  ev('dz-crypt', 'The Trapped Crypt', 'Dungeon Puzzles', CRYPT,
    'Stone stairs down to a crypt of three trapped chambers. Whoever built it didn\'t want visitors, and left a lot of gold. A carving: THE FIRST GYM\'S LEADERS REST HERE.',
    [
      ch('Go down.', out('The stairs are worn in the middle by a lot of feet, a long time ago.', room('dz-crypt-darts'))),
      ch('Pay respects and leave.', out('You bow your head at the top of the stairs. On the top step, someone has left a Cleanse Tag. It\'s for you, you think.', item('cleanse-tag'))),
      ch('Look for another way in.', out('There isn\'t one. There\'s only down.', room('dz-crypt-darts'))),
    ]),
  cRoom('dz-crypt-darts', 'The Darts', 'Walls pocked with holes. A pressure plate every few steps.', [
    ch('Step carefully.', out('Slowly. Very slowly. Nothing fires.', room('dz-crypt-pit'))),
    ch('Send a Steel-type ahead.', out('The darts bounce off your Steel-type like rain off a roof.', room('dz-crypt-pit')), { pick: { types: ['steel'] } }),
    ch('Run.', out('You run. Something stings. One of your Pokémon is poisoned.', { kind: 'status', status: 'poison', who: 'lead' }, room('dz-crypt-pit'))),
  ]),
  cRoom('dz-crypt-pit', 'The Pit', 'The floor ends in a spiked pit. A thin ledge runs round the wall.', [
    ch('Edge along.', out('Back to the wall, inch by inch. You make it.', room('dz-crypt-guardian'))),
    ch('Bridge it with a Grass- or Ice-type.', out('Vines, or ice, laid straight across. You walk over it like a road.', room('dz-crypt-guardian')), { pick: { types: ['grass', 'ice'] } }),
    ch('Jump.', out('You jump. You make it, mostly. Your lead takes the landing.', { kind: 'damage', share: 0.1, who: 'lead' }, room('dz-crypt-guardian'))),
  ]),
  cRoom('dz-crypt-guardian', 'The Last Guardian', 'A stone door, and the crypt\'s last guardian: an old woman in a faded Gym uniform, three ancient Pokémon at her feet. Guardian, Aeda: "I kept the door when the Gym fell. I\'ve kept it since. They\'re sleeping. All the first Leaders." Aeda: "The gold\'s for whoever proves they aren\'t here for gold."', [
    ch("I'm not.", out('Aeda: "Prove it." She holds out a bag of old gold. It is very heavy.', room('dz-crypt-gold'))),
    ch('Battle for it.', fight('Aeda: "Then wake up, old friends." Fire, Water, Grass: ancient, slow, and very strong.', tf('Aeda', { cls: 'veteran', size: 3, lv: 2, team: ['arcanine', 'kingdra', 'meganium'], win: [$(2000)] }))),
    ch('Who were they?', out('She names them, one by one, slowly, like she is waking them. Then she waits.', room('dz-crypt-names'))),
  ]),
  cRoom('dz-crypt-names', 'The Last Guardian', 'Aeda finishes the last name and folds her hands.', [
    ch("I'm not here for gold.", out('Aeda: "Prove it." She holds out the gold.', room('dz-crypt-gold'))),
    ch('Battle for it.', fight('Aeda: "Then wake up, old friends."', tf('Aeda', { cls: 'veteran', size: 3, lv: 2, team: ['arcanine', 'kingdra', 'meganium'], win: [$(2000)] }))),
  ]),
  cRoom('dz-crypt-gold', 'The Gold', 'The bag of gold sits in Aeda\'s old hands.', [
    ch('Refuse it.', out('You close her fingers back around it. Aeda looks at you for a long time. Then she takes a small badge from her own collar: the First Badge. Aeda: "Then you\'re the one." She sits down by the door, and closes her eyes, and finally rests.', item('first-badge'), good(1))),
    ch('Take it.', out('You take it. Aeda nods. She is not surprised. She is a little sad.', $(2000))),
  ]),
];
Object.assign(SF80[3]!, {
  remembers: [{
    id: 'keepers', when: [flagIs('forgotten-badge', 3)], notice: 'Your three old badges glint. The stone door opens by itself. Aeda puts her hands over her face and weeps. She is the last keeper. You know her name already.',
    addChoices: [ch('Sit with her.', out('You sit with her until she can talk. Then she gives you the First Badge, and goes in to sleep beside them.', item('first-badge'), good(1)))],
  }],
});

// ---------- SF81 Three Factions (standing 0 to 3; Trusted is 3) ----------
const OUTPOST = { cast: ['trainer.ranger'], tint: '#1e2a1a', effect: 'none' };
const SCHOLARS = { cast: ['trainer.scientist'], tint: '#1e2230', effect: 'none' };
const ALLEY = { cast: ['trainer.roughneck'], tint: '#1a1420', effect: 'none' };
const rangers = (n: number): Json => flag('faction-rangers', n);
const scholars = (n: number): Json => flag('faction-scholars', n);
const syndicate = (n: number): Json => flag('faction-syndicate', n);
const SF81: Json[] = [
  ev('faction-rangers-low', 'The Stuck Gate', 'Story and characters', { ...OUTPOST, requires: [flagIs('faction-rangers', 0, 2)] },
    'A short-handed Ranger outpost. Ranger Basil: "Gate\'s stuck and the herd\'s on the wrong side. Hand?"',
    [
      ch('Push it.', out('You set your shoulder to it with Basil. It gives. The herd pours through, and Basil laughs out loud.', rangers(1))),
      ch('Use a Pokémon.', out('Your Pokémon leans on the gate and it swings wide. The herd crosses. Basil writes your name in the outpost book.', rangers(1)), { pick: {} }),
      ch('Busy.', leave('Basil waves you on. "Another time."')),
    ]),
  ev('faction-rangers-high', 'One of Ours, Nearly', 'Story and characters', { ...OUTPOST, requires: [flagIs('faction-rangers', 3), notYet('ranger-favour-given')] },
    'Basil, at the outpost gate, with something wrapped in a Ranger\'s scarf. Basil: "One of ours, nearly. Take this."',
    [
      ch('Thanks.', out('A Ranger\'s whistle. Basil: "Blow it once. If one of yours goes down in a fight you lose, we\'ll carry them out, and they\'ll be on their feet."', flag('ranger-favour'), done('ranger-favour-given'))),
      ch('Give it to the outpost.', out('Basil shakes his head, smiling, and hangs it back on your neck anyway. "The outpost says keep it."', flag('ranger-favour'), rangers(1), done('ranger-favour-given'))),
      ch("What's it for?", out('Basil: "A rescue. One. Any of yours, any fight you lose. We\'ll get them out." He presses it into your hand.', flag('ranger-favour'), done('ranger-favour-given'))),
    ]),
  ev('faction-scholars-low', 'Spare Eyes', 'Story and characters', { ...SCHOLARS, requires: [flagIs('faction-scholars', 0, 2)] },
    'Scholars cataloguing local Pokémon. Scholar Ines-Marie: "We need a spare pair of eyes. Count the Wurmple, would you?"',
    [
      ch('Count carefully (a node).', out('Forty-one. You count twice. Ines-Marie checks. Forty-one. She looks at you with new respect.', takeNode(), scholars(1))),
      ch('Guess.', out('"About thirty?" Ines-Marie looks at you over her glasses. She noticed.', scholars(-1))),
      ch('No.', leave('Ines-Marie goes back to counting, lips moving.')),
    ]),
  ev('faction-scholars-high', 'One of Ours, Nearly', 'Story and characters', { ...SCHOLARS, requires: [flagIs('faction-scholars', 3), notYet('scholars-favour-given')] },
    'Ines-Marie, with a thick folder under her arm. Ines-Marie: "One of ours, nearly. Take this."',
    [ch('Take it.', out('Field notes on every wild Pokémon in {nextRegion}: what they know, what they can do. Pages and pages of it.', rp(30), done('scholars-favour-given')))]),
  ev('faction-syndicate-low', 'Look the Other Way', 'Story and characters', { ...ALLEY, requires: [flagIs('faction-syndicate', 0, 2)] },
    'A shady crew in an alley. Crew boss, Lark: "Need someone to look the other way for a minute."',
    [
      ch('Look away.', out('You study a very interesting brick. Something heavy is carried past behind you. Lark: "Appreciated."', syndicate(1), rangers(-1))),
      ch("What's happening?", out('Lark: "A crate. Not Pokémon. I promise." He means it.', room('faction-syndicate-ask'))),
      ch('No.', out('Lark shrugs. "Your call." The crew finds someone else.', syndicate(-1))),
    ]),
  ev('faction-syndicate-ask', 'Look the Other Way', 'Story and characters', { room: true, ...ALLEY }, 'Lark waits. The crate waits.', [
    ch('Look away.', out('You look away. Lark: "Appreciated."', syndicate(1), rangers(-1))),
    ch('No.', out('Lark shrugs. "Your call."', syndicate(-1))),
  ]),
  ev('faction-syndicate-high', 'One of Ours, Nearly', 'Story and characters', { ...ALLEY, requires: [flagIs('faction-syndicate', 3), notYet('syndicate-favour-given')] },
    'Lark, leaning on a wall like he owns it. Lark: "Take this. And one day I\'ll ask a favour back."',
    [
      ch('Deal.', out('A coin with a hole in it. Lark: "Show that to any team\'s guards, once. They\'ve been paid." He smiles. "And one day, I\'ll ask."', stamped('syndicate-owed'), flag('evil-skip'), done('syndicate-favour-given'))),
      ch('No strings.', out('Lark laughs, a real laugh. "Nobody gets no strings." He pockets the coin again.', done('syndicate-favour-given'))),
      ch('What favour?', out('Lark: "You\'ll know." He holds the coin out, and waits.', room('faction-syndicate-coin'))),
    ]),
  ev('faction-syndicate-coin', 'One of Ours, Nearly', 'Story and characters', { room: true, ...ALLEY }, 'The coin with the hole in it.', [
    ch('Deal.', out('Lark: "Good." The coin goes in your pocket.', stamped('syndicate-owed'), flag('evil-skip'), done('syndicate-favour-given'))),
    ch('No strings.', out('Lark laughs. "Nobody gets no strings."', done('syndicate-favour-given'))),
  ]),
  ev('syndicate-price', 'The Price', 'Story and characters', { ...ALLEY, callback: true, requires: [flagAgo('syndicate-owed', 1), notYet('syndicate-paid')] },
    'A region later, Lark falls into step beside you. He has a sealed package under his arm. Lark: "That favour. Carry this past the Ranger checkpoint. Don\'t open it."',
    [
      ch('Carry it.', out('The Rangers search it. Inside: letters. Lark\'s love letters, years of them, to someone across the border. Completely legal. Deeply embarrassing. The Rangers look at you differently after that.', rangers(-2), done('syndicate-paid'))),
      ch('Refuse.', out('Lark looks at you for a long moment. He isn\'t angry. He\'s hurt, which is worse. "Right," he says. "Right."', syndicate(-3), done('syndicate-paid'))),
    ]),
];

// ---------- SF82 The Friendly Guide ----------
const GUIDE = { cast: ['trainer.hiker'], tint: '#2a2418', effect: 'none' };
const SF82: Json[] = [
  ev('guide-offer', 'No Charge', 'Story and characters', { ...GUIDE, requires: [notYet('guide-met')],
    // FE1: the letter in your own handwriting warned you about him.
    remembers: [{ id: 'warned', when: [flagIs('letter-followed')], notice: 'You remember a letter in your own handwriting: "Don\'t trust the guide with the free shortcut."',
      addChoices: [ch('No. Somebody warned me.', out('He tips his hat. Mosley: "Somebody warned you. Smart somebody." He walks off whistling, and doesn\'t look back.', done('guide-met'), flag('letter-came-true')))] }] },
    'A weathered guide offers you a shortcut. Guide, Mosley: "No charge. I just like company." If you look closely: his boots are new. He checks your bag twice. His "shortcut" adds distance on the map.',
    [
      ch('Lead on.', out('The shortcut is real, more or less. He chats the whole way. You notice him writing something in a little book.', stamped('guide-followed'), done('guide-met'))),
      ch('Your boots are new.', out('Mosley looks down at them. "...Gift." He leaves quickly, and doesn\'t look back.', done('guide-met'), good(1))),
      ch('No thanks.', leave('Mosley shrugs and waits for the next traveller.')),
    ]),
  ev('guide-betrayal', 'The Crossing', 'Story and characters', { ...GUIDE, callback: true, minStage: 3, requires: [flagIs('guide-followed'), notYet('guide-crossed')] },
    'Mosley at the crossing, too relaxed. Two strangers behind him. Mosley: "Hand over your coins."',
    [
      ch('Battle all three.', fight('Mosley sighs. "Have it your way."', tf('Bandits', { cls: 'roughneck', size: 3, lv: 1, chain: 3, win: [any('nugget', 'big-pearl', 'star-piece'), any('silk-scarf', 'charcoal', 'mystic-water'), any('oran-berry', 'pecha-berry'), done('guide-crossed')] }, [done('guide-crossed')]))),
      ch("I told the Rangers you'd be here.", out('The trees move. Rangers step out on every side. Mosley closes his eyes. "Of course you did." No battle. He goes quietly.', done('guide-crossed'), repUp(1)), { requires: [flagIs('faction-rangers', 2)] }),
      ch('Pay.', out('You hand over half of what you have. Mosley counts it twice. Word gets around.', $(-500), repDown(1), done('guide-crossed')), { requires: [money(500)] }),
    ]),
];

// ---------- SF83 The Watchers (the record: core/events/coToolkit.ts `record`) ----------
const WATCH = { cast: [], tint: '#1a2420', effect: 'none' };
const high: Json = { kind: 'record', is: 'high' };
const low: Json = { kind: 'record', is: 'low' };
const mid: Json = { kind: 'record', is: 'middle' };
const SF83: Json[] = [
  ev('a-quiet-hello', 'A Quiet Hello', 'Overdrive unusual events', WATCH,
    'A wild Pokémon watches your team from a distance. Not afraid, not angry. Waiting.',
    [
      ch('Sit down.', out('You sit. It watches. Then it comes a little closer, and a little closer, and stops just out of reach. Then it leaves.')),
      ch('Hold out a hand.', out('You hold out a hand. It comes closer, sniffs the air, and goes.')),
      ch('Walk on.', leave('You walk on.')),
    ]),
  ev('doesnt-want-to-fight', "It Doesn't Want to Fight", 'Overdrive unusual events', WATCH,
    'A wild Pokémon trembles in the grass. Frightened, or guarding something.',
    [
      ch('Back away.', out('You back away slowly. It stops trembling.')),
      ch('Look past it.', out('Behind it, in a hollow: eggs. It watches you look, and lets you. Then it settles back over them.', good(1))),
      ch('Battle.', fight('It fights like it has no choice. It doesn\'t.', wf({ lv: 1, win: [repDown(1)] }, [repDown(1)]))),
    ]),
  ev('it-saw-what-you-did', 'It Saw What You Did', 'Overdrive unusual events', WATCH,
    'A Pokémon at the edge of the path has been watching for a long time. It saw how you treated others on this road. It holds something in its mouth: something you dropped.',
    [
      ch('Take it.', out('It drops it in your hand. A Berry, a little chewed.', any('oran-berry', 'pecha-berry', 'cheri-berry'))),
      ch('Thank it.', out('It nods, once, and is gone.')),
      ch('Say sorry.', out('It considers you for a long time. Then it puts the thing at your feet and walks away, not hurried. Somewhere, the road\'s opinion of you shifts a little.', repUp(1)), { requires: [low] }),
    ]),
  ev('this-place-remembers', 'This Place Remembers', 'Overdrive unusual events', WATCH,
    'A place that seems familiar. The ground, the air and the old stones seem to remember the battles fought here. Faint shapes of Pokémon battling, fading.',
    [
      ch('Watch.', out('The shapes fight, and fade, and fight again. One of them is a {starter}. Yours watches it a long time.', bondUp(1, 'starter'))),
      ch('Call to them.', out('You call out. One shape stops, and turns its head toward you. Then it\'s gone.')),
      ch('Walk through.', leave('You walk through. The shapes part around you.')),
    ]),
];
Object.assign(SF83[0]!, {
  remembers: [
    { id: 'high', when: [high], notice: 'It looks at you like it already knows you.', hide: [0, 1], addChoices: [ch('Sit down.', out('You sit. It walks straight to you and sits too. When you stand, it comes with you. No battle. It just decided.', join({ lv: 0 }), fr(30, 'newest'))), ch('Hold out a hand.', out('It presses its head into your hand, and then follows you. It has decided.', join({ lv: 0 }), fr(30, 'newest')))] },
    { id: 'low', when: [low], notice: 'It looks at you, and its fur rises.', hide: [0, 1], addChoices: [ch('Sit down.', out('It backs away, then turns and runs, crying out. All along the road, wild Pokémon go quiet. They\'ve been warned.'))] },
  ],
});
Object.assign(SF83[1]!, {
  remembers: [{ id: 'high', when: [high], notice: 'It knows you. You can see it decide.', hide: [0], addChoices: [ch('Back away.', out('You back away. It stops trembling. Later, on the road, you hear small feet behind you. It followed.', join({ lv: 0 }), fr(20, 'newest')))] }],
});
Object.assign(SF83[2]!, {
  remembers: [
    { id: 'high', when: [high], notice: 'It drops the thing and steps closer. It liked what it saw.', hide: [1], addChoices: [ch('Thank it.', out('It looks at you for a long moment, then falls into step beside you. It joins you.', join({ lv: 0 }), fr(20, 'newest')))] },
    { id: 'fed', when: [flagIs('fed-poochyena')], notice: 'In its mouth: the very Berry you gave the starving Poochyena. It was watching then too.', addChoices: [] },
  ],
});
void mid;

// ---------- SF84 The Dragon's Question ----------
const SHRINE = { cast: ['trainer.veteran'], pokemon: 'dragonair', tint: '#1a2440', effect: 'none' };
const dRoom = (id: string, intro: string, choices: Json[]): Json => ev(id, "The Dragon's Question", 'One event for every type', { room: true, ...SHRINE }, intro, choices);
const TRUE = flag('dragon-true');
const unkind: Json[][] = [[{ kind: 'keptGoods' }], [flagIs('apprentice-copy-caught-weak')], [flagIs('dark-dealt')]];
const SF84: Json[] = [
  ev('dragon-shrine', "The Dragon's Question", 'One event for every type', { ...SHRINE, requires: [notYet('dragon-asked')] },
    'A shrine on a lake. An elder of the dragon clan sits on the steps. Elder Ryuen: "I\'ll ask three questions. There are no right answers. There are true ones. I\'ll know."',
    [
      ch('Ask.', out('Ryuen: "What matters most in battle?"', flag('dragon-true', -99), done('dragon-asked'), room('dragon-q1'))),
      ch('Not today.', leave('Ryuen nods. The lake is very still.')),
    ]),
  dRoom('dragon-q1', 'Ryuen: "What matters most in battle?"', [
    { ...ch('"Winning."', out('Ryuen: "Hm."', room('dragon-q2'))), branches: [{ when: [flagIs('left-fainted')], text: 'Ryuen: "Yes. That is true of you."', effects: [TRUE, room('dragon-q2')] }] },
    { ...ch('"My Pokémon."', out('Ryuen looks at your team for a long time. "Hm."', room('dragon-q2'))), branches: [{ when: [flagIs('left-fainted', 0, 0)], text: 'Ryuen: "Yes. You have never left one of them lying at a rest."', effects: [TRUE, room('dragon-q2')] }] },
    ch('"Learning."', out('Ryuen: "Everyone is learning. True."', TRUE, room('dragon-q2'))),
  ]),
  dRoom('dragon-q2', 'Ryuen: "Which of your Pokémon have you used least?"', [
    ch('Point to one.', out('Ryuen looks at the one you chose, then at you.', { kind: 'pickTest', test: 'leastUsed', pass: 'dragon-true', fail: 'dragon-q2-wrong', sulk: 0 }, room('dragon-q3')), { pick: {} }),
  ]),
  dRoom('dragon-q3', 'Ryuen: "Have you ever been unkind to a Pokémon?"', [
    { ...ch('"No."', out('Ryuen: "True."', TRUE, room('dragon-answer'))), branches: unkind.map((when) => ({ when, text: 'Ryuen says nothing for a long time. The lake says nothing either.', effects: [room('dragon-answer')] })) },
    { ...ch('"Yes."', out('Ryuen: "Hm. I don\'t think you have."', room('dragon-answer'))), branches: unkind.map((when) => ({ when, text: 'Ryuen: "True. Thank you for saying it."', effects: [TRUE, room('dragon-answer')] })) },
    { ...ch('"I don\'t know."', out('Ryuen: "You do know. You were kind."', room('dragon-answer'))), branches: unkind.map((when) => ({ when, text: 'Ryuen: "True. Most people don\'t."', effects: [TRUE, room('dragon-answer')] })) },
  ]),
  dRoom('dragon-answer', 'Ryuen stands, and looks out over the lake.', [
    ch('Three true answers.', out('Something rises from the lake: a Dratini, already knowing a move it shouldn\'t. Ryuen: "It chose you. Be worth it."', join({ species: ['dratini'], lv: 0 }), { kind: 'teachMove', move: 'extreme-speed', who: 'newest' }), { requires: [flagIs('dragon-true', 3)] }),
    ch('Two true answers.', out('A Dratini rises from the lake and swims to your feet. Ryuen: "Close enough. It thinks so, anyway."', join({ species: ['dratini'], lv: 0 })), { requires: [flagIs('dragon-true', 2, 2)] }),
    ch('Not enough.', out('Ryuen: "Come back when you know yourself better." The shrine stays where it is.', again('dragon-shrine'), flag('dragon-asked', -99)), { requires: [flagIs('dragon-true', 0, 1)] }),
  ]),
];

// ---------- SF85 The Oath Stone (the checks: coToolkit.ts coFled / coWildKo / coHealStop) ----------
const OSK = { cast: ['trainer.veteran'], tint: '#22201a', effect: 'none' };
const oathOk = [notYet('oath-taken'), flagIs('blessing-zekrom', 0, 0)];
const swear = (k: string, text: string): Json => ch(k === 'oath-steel' ? 'Steel.' : k === 'oath-mercy' ? 'Mercy.' : 'Speed.', out(text, flag(k), flag('oath-taken')));
const kept = flagIs('oath-broken', 0, 0);
const broken = flagIs('oath-broken');
const SF85: Json[] = [
  ev('oath-shrine', 'The Oath Stone', 'Set Pieces', { ...OSK, requires: oathOk },
    'An old stone with three hand-shaped hollows. Shrine keeper, Brother Osk: "Swear an oath, and the road will ask you to keep it. Keep it and you\'re paid."',
    [
      swear('oath-steel', 'You put your hand in the first hollow. Steel: never flee a battle. The stone is cold, and then warm.'),
      swear('oath-mercy', 'You put your hand in the second hollow. Mercy: never knock out a wild Pokémon you could have caught or calmed. The stone is warm.'),
      swear('oath-speed', 'You put your hand in the third hollow. Speed: never rest at more than one rest stop in a stage. The stone hums.'),
      ch('No oath.', leave('Osk: "Wise, maybe." He goes back to sweeping the stone.')),
    ]),
  ev('oath-reckoning', 'Reckoning: Steel', 'Set Pieces', { ...OSK, callback: true, requires: [flagIs('oath-steel', 1, 1), notYet('oath-reckoned')] },
    'Osk at a crossroads, waiting. Osk: "You swore Steel. Have you held to it?"',
    [
      { ...ch('I have.', out('Osk: "...No." He turns away. Word of it gets around.', repDown(1), done('oath-reckoned'))), branches: [{ when: [kept], text: 'Osk: "You have." He puts his hand on your lead\'s shoulder. It stands a little straighter, for good.', effects: [{ kind: 'statBoost', stat: 'def', percent: 5, who: 'lead', until: 'run' }, done('oath-reckoned')] }] },
      { ...ch('I broke it.', out('Osk: "No, you didn\'t. But honesty\'s worth something." He gives you nothing.', done('oath-reckoned'))), branches: [{ when: [broken], text: 'Osk: "Honest. That\'s worth something." A smaller pay: a Hard Stone from his pocket.', effects: [item('hard-stone'), done('oath-reckoned')] }] },
    ]),
  ev('oath-reckoning-mercy', 'Reckoning: Mercy', 'Set Pieces', { ...OSK, cast: ['trainer.lass'], callback: true, requires: [flagIs('oath-mercy', 1, 1), notYet('oath-reckoned')] },
    'A child runs up with a thank-you flower. Child: "The shrine said you kept your mercy!"',
    [
      { ...ch('Take the flower.', out('In your hand the flower wilts. The child looks at it, confused, then at you.', done('oath-reckoned'))), branches: [{ when: [kept], text: 'The flower stays bright. The pay: your whole team is gentler with every Pokémon they meet.', effects: [bondUp(1, 'party'), done('oath-reckoned')] }] },
      { ...ch("I'm not sure I did.", out('Osk steps out of the crowd. Osk: "You didn\'t." The child\'s flower droops.', done('oath-reckoned'))), branches: [{ when: [kept], text: 'Osk steps out of the crowd. Osk: "You did." The pay, and the child hugs every one of your Pokémon.', effects: [bondUp(1, 'party'), bondUp(1, 'party'), done('oath-reckoned')] }] },
    ]),
  ev('oath-reckoning-speed', 'Reckoning: Speed', 'Set Pieces', { ...OSK, cast: [], effect: 'fog', callback: true, requires: [flagIs('oath-speed', 1, 1), notYet('oath-reckoned')] },
    'Wind at a bend in the road. The oath sits lightly on your shoulder.',
    [
      { ...ch('Run with it.', out('You run. The oath slips off somewhere along the way. Nothing comes of it.', done('oath-reckoned'))), branches: [{ when: [kept], text: 'You run, and the wind runs with you. The pay: your lead starts every battle a step faster, for the rest of the run.', effects: [flag('oath-speed-paid'), done('oath-reckoned')] }] },
      ch('Stop and let it go.', out('You stop. The wind goes on without you. The oath is over. No pay, no penalty.', done('oath-reckoned'))),
    ]),
];

// ---------- SF86 The Oracle's prophecies come true (the frame, FE5, sets prophecy-<beat>) ----------
const ORACLE_LINE = 'The Oracle\'s words come back to you.';
const SF86: Json[] = [
  ev('prophecy-friend', 'A Friend in Need', 'Set Pieces', { cast: ['trainer.youngster'], tint: '#1e2030', effect: 'none', callback: true, requires: [flagIs('prophecy-friend', 1, 1)] },
    `A young trainer trips and spills their Poké Balls. ${ORACLE_LINE} Three Balls roll toward a river.`,
    [
      ch('Catch the Balls.', out('You catch two. The third goes in the river. It floats. They find it downstream, laughing with relief.', flag('prophecy-friend', 1), good(1))),
      ch('Help the trainer up.', out('You help them up first. The Balls are gone for a while, all three, and then found, one by one, in the reeds.', takeNode(), flag('prophecy-friend', 1), good(1))),
      ch('Send a Pokémon for the river one.', out('Your Pokémon dives and comes up with the third Ball in its mouth. All three saved. The trainer won\'t stop thanking you. "If you ever need a hand in a fight..."', flag('prophecy-friend', 1), good(1)), { pick: {} }),
    ]),
  ev('prophecy-loss', 'A Loss', 'Set Pieces', { cast: [], tint: '#1e2030', effect: 'none', callback: true, requires: [flagIs('prophecy-loss', 1, 1)] },
    `You reach into your bag. Something is gone. ${ORACLE_LINE}`,
    [
      ch('Retrace my steps.', out('A whole node of walking back. You find it, broken, in a ditch. Half its worth, in money.', takeNode(), $(400), flag('prophecy-loss', 1))),
      ch('Let it go.', out('You let it go. Somewhere, an old woman with closed eyes nods: "You let it go. That was the soft way."', flag('prophecy-loss', 1), good(1))),
      ch('Ask the party.', out('One of your Pokémon looks very guilty. It was playing with it. It gives it back, a little chewed.', fr(5, 'party'), flag('prophecy-loss', 1))),
    ]),
  ev('prophecy-win', 'A Win That Matters', 'Set Pieces', { cast: ['trainer.ace-trainer'], tint: '#1e2030', effect: 'none', callback: true, requires: [flagIs('prophecy-win', 1, 1)] },
    `A challenger calls you out. ${ORACLE_LINE} Challenger: "You! I've heard you can't be beaten."`,
    [
      ch('Battle.', fight('This one matters. You can feel it.', tf('Challenger', { cls: 'ace-trainer', size: 5, lv: 2, win: [repUp(2)] }), flag('prophecy-win', 1))),
      ch('Who told you that?', fight('Challenger: "An old woman with closed eyes." Then they send out their first.', tf('Challenger', { cls: 'ace-trainer', size: 5, lv: 2, win: [repUp(2)] }), flag('prophecy-win', 1))),
      ch('I can be beaten.', fight('Challenger: "Prove it."', tf('Challenger', { cls: 'ace-trainer', size: 5, lv: 2, win: [repUp(1)] }, []), flag('prophecy-win', 1))),
    ]),
];

export const EVENTS: Json[] = [...SF79, ...SF80, ...SF81, ...SF82, ...SF83, ...SF84, ...SF85, ...SF86];
export const REMOVE: string[] = [];
void heal;
