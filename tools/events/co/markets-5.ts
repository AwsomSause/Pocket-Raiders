// Catalog Overhaul Pack: STORY_FAMILIES_12.md, SF92 THE FAIRGROUND (the gate, 21 games, 8 festival stops, the lost child).
// One fair with an owner (Madame Roux), a rivalry (her nephews, the Brothers Stile) and a lost child (Poppet).
// The gate (`festival-day`) opens three games (one from each row of seven) and one festival stop beside the node, and
// Poppet, lost by one of them. Every game states its prize. A fair can come back later in the run (`comeBack`).
import { $, ch, cure, fight, flag, flagIs, fr, item, out, anyType, trainer, type Json } from '../dsl.ts';
import { COMMON, aNode, bond, kind, mk, moment, need, pay, stay } from './_markets.ts';

export { CATEGORY } from './_markets.ts';

const G = 'Fairground';
const GAMES_A = ['rf-balancing-act', 'rf-balloon-pop', 'rf-barrel-roll', 'rf-berry-bobbing', 'rf-berry-taste', 'rf-bumper-cars', 'rf-carnival-plush'];
const GAMES_B = ['rf-crane-operator', 'rf-cupid-arrow', 'rf-disco-floor', 'rf-haunted-jenga', 'rf-hot-potato', 'rf-hurdles', 'rf-rhythm-raid'];
const GAMES_C = ['rf-sandcastle', 'rf-smell-test', 'rf-tug-of-war', 'rf-type-rps', 'rf-whack-diglett', 'rf-whistle-echo', 'dance-competition'];
const STOPS = ['fairy-tea', 'festival-fireworks', 'firebreather-show', 'flower-garden', 'photo-contest', 'pokefan-meetup', 'sky-race', 'street-brawl'];
const fairOpens = (poppet: boolean): Json[] => [
  { kind: 'addEventFrom', ids: GAMES_A }, { kind: 'addEventFrom', ids: GAMES_B }, { kind: 'addEventFrom', ids: GAMES_C }, { kind: 'addEventFrom', ids: STOPS },
  ...(poppet ? [stay('fair-lost-child')] : []),
  flag('fair-visits'), mk('comeBack', { event: 'festival-day' }),
];
/** A fair game: a room beside the gate. */
const game = (id: string, name: string, intro: string, choices: Json[], extra: Json = {}): Json => ({ id, name, group: G, stop: 'contest', room: true, intro, choices, ...extra });
const skill = (id: string, needs: 'ok' | 'good' | 'perfect', fail: string, ...failEffects: Json[]): Json => ({ prompt: { id, needs }, fail: out(fail, ...failEffects) });
const BERRIES = ['oran-berry', 'pecha-berry', 'cheri-berry'];

export const EVENTS: Json[] = [
  // ---- SF92.1 The Gate ----
  {
    id: 'festival-day', name: 'The Fairground', group: G,
    intro: 'Paper lanterns, drums, three stalls by the gate. Madame Roux wears her late husband\'s hat. "Today there\'s a game for everyone. And if you see a girl in a yellow coat on her own, she\'s mine. My granddaughter. She wanders."',
    choices: [
      ch('Play the games.', out('Roux waves you through the gate. Music from three directions, sugar in the air, and somewhere in the crowd a flash of a small yellow coat.', ...fairOpens(true))),
      ch('Look for Poppet.', out('You do not even get past the first stall. There she is, small and yellow and alone, standing by a game as if she owns it.', flag('fair-poppet'), stay('fair-lost-child'), ...fairOpens(false))),
      ch('Ask about the fair across the river.', out('Roux\'s face does something complicated. "My nephews. They think I stole their mother\'s fair. I didn\'t. I saved it." She straightens the hat. "They\'re in the will, you know. Nobody\'s told them."', flag('fair-stile'), stay('festival-day'))),
    ],
    remembers: [
      { id: 'fair-ribbon', when: [flagIs('fair-poppet-found', 3), flagIs('fair-ribbon', 0, 0)], notice: 'Poppet is at the gate, holding Roux\'s hand. Not lost. She is holding something yellow out to you.', hide: [0, 1],
        addChoices: [ch('Take the yellow ribbon.', out('Poppet ties her yellow ribbon round your wrist, in a terrible knot, very seriously. She does not wander off. Roux watches her. "She was waiting for you, I think."', flag('fair-ribbon'), moment('Poppet gave you her yellow ribbon, and stopped getting lost.', 70), ...fairOpens(false)))] },
      { id: 'fair-reunited', when: [flagIs('fair-stile-will')], notice: 'One fair today, not two. The rival fair across the river is dark, and Lem Stile is running the bumper cars, grinning like a boy.' },
      { id: 'fair-poppet-home', when: [flagIs('fair-ribbon')], notice: 'Poppet sits on the gatepost swinging her legs, right where Roux can see her. She waves at you. She is not lost at all.', hide: [0, 1],
        addChoices: [ch('Play the games.', out('Roux waves you through. Poppet points out her favourite game as you go past.', ...fairOpens(false)))] },
    ],
  },
  // ---- SF92.4 The Lost Child ----
  {
    id: 'fair-lost-child', name: 'The Lost Child', group: G, stop: 'contest', room: true,
    intro: 'A small girl in a yellow coat stands alone by a game, arms folded. She looks up at you with total confidence. "I\'m not lost," says Poppet. "Gran is."',
    choices: [
      ch("Let's find her together.", out('You walk across the whole fair hand in hand. Poppet knows everyone: the clown, the juggler, three Machamp by name. Roux is at the gate, crying with relief. She presses a ticket into your hand. "One game a visit, free. For life."', flag('fair-poppet-found'), flag('fair-ticket'), ...kind(1))),
      ch("Stay here, I'll get her.", out('You run for Roux. When you come back, the spot by the game is empty. A moment later you spot a yellow coat by the next game along. She did not stay. She never does.', stay('fair-lost-child'))),
      ch('Want to play a game first?', out('Her eyes go huge. You play one game together, free, and she cheats outrageously, and you let her. Then she takes your hand, and you go to find Gran together. Roux is at the gate, weeping into the hat.', flag('fair-poppet-found'), flag('fair-ticket'), ...kind(1), bond(1, 'party'))),
    ],
  },
  // ---- SF92.2 The Games ----
  game('rf-balancing-act', 'Balancing Act', 'A wobbling stack of plates on a pole. Teeter, the acrobat, balances on one hand on top of it. "Hold steady and we all win!" The prize, painted on a board: a Quick Claw for a perfect stack.', [
    ch('Balance.', out('The plates sway, and settle, and stand. Perfectly still. Teeter flips down and presents the Quick Claw with a bow.', item('quick-claw')), skill('brace-hold', 'perfect', 'The top plate tips, and then all of them, in a long musical crash. Teeter catches six. "Nearly! Nearly is a lot!"')),
    ch('Let a Pokémon balance.', out('Your Pokémon stacks them with total calm, one on its nose. The crowd counts. Perfect. A Quick Claw.', item('quick-claw')), skill('brace-hold', 'good', 'Your Pokémon gets eight plates up before sneezing. Teeter is crying with laughter.')),
  ]),
  game('rf-balloon-pop', 'Balloon Pop', 'A wall of balloons in four colours. Pip-Pop, the clown, honks a horn. "Pop only the matching colours!" Ten in a row wins a Silk Scarf.', [
    ch('Pop.', out('Pop, pop, pop, ten in a row, every one the right colour. Pip-Pop honks the horn until it squeaks. A Silk Scarf.', item('silk-scarf')), skill('whack-tap', 'perfect', 'Seven in a row, and then a red when you wanted blue. Pip-Pop honks sadly.')),
    ch('Let a Flying-type peck.', out('Your Flying-type pecks with surgical precision. Ten. Pip-Pop salutes it with the horn.', item('silk-scarf')), { requires: [anyType('flying')], ...skill('whack-tap', 'good', 'Your Flying-type gets distracted by its own reflection in a balloon.') }),
  ]),
  game('rf-barrel-roll', 'Barrel Roll', 'Barrels at the top of a grassy slope. Rolf, the starter, raises a flag. "Down the slope! Your Pokémon pushes!" The winner takes a Muscle Band.', [
    ch('Race.', out('Your Pokémon shoves, and runs, and shoves, and your barrel bounces over the line first. Rolf drops the flag. A Muscle Band.', item('muscle-band')), skill('hurdle-rhythm', 'good', 'Your barrel veers into a hay bale. Your Pokémon emerges covered in straw, delighted.')),
    ch('Cheer.', out('You cheer for everybody. A tiny Rattata pushing a barrel twice its size wins by a whisker and looks round to see if anyone saw. You saw.', bond(1))),
  ]),
  game('rf-berry-bobbing', 'Berry Bobbing', 'A barrel of water bobbing with Berries. Splashy Sue, soaked to the skin, waves you over. "Hands behind your back!" Every Berry you catch, you keep.', [
    ch('Bob.', out('You come up spluttering with a Berry in your teeth. Then another. Splashy Sue cheers every one.', item('oran-berry'), item('pecha-berry')), skill('dive-hold', 'ok', 'You come up with water up your nose and nothing in your teeth. Sue hands you a towel and a Berry anyway.', item('oran-berry'))),
    ch('Let a Water-type bob.', out('Your Water-type dives in and does not come up for a worryingly long time. Then it surfaces with its cheeks stuffed. Every Berry in the barrel.', item('oran-berry', 2), item('pecha-berry'), item('cheri-berry'), item('sitrus-berry')), { requires: [anyType('water')] }),
  ]),
  game('rf-berry-taste', 'Berry Taste', 'Five covered bowls. Prune, the taster, holds up a card with a clue. "Spicy, dry, sweet, bitter, sour. Match the clue." Five right wins a rare Berry.', [
    ch('Taste.', out('Spicy. Sour. Dry, so dry. Five clues, five bowls, five right. Prune gives you a Lum Berry with great ceremony.', item('lum-berry')), { chance: 0.4, fail: out('You get the bitter one wrong. Everyone gets the bitter one wrong. Prune gives you a common Berry for trying.', { kind: 'itemFrom', ids: BERRIES }) }),
    ch('Ask a Pokémon to sniff.', out('Your Pokémon sniffs each bowl and points with total certainty. Five for five. A Lum Berry.', item('lum-berry')), { chance: 0.8, fail: out('Your Pokémon is very sure, and very wrong, about the sour one. A common Berry for trying.', { kind: 'itemFrom', ids: BERRIES }) }),
  ]),
  game('rf-bumper-cars', 'Bumper Cars', 'A floor of sparking bumper cars. Dent, the operator, slams the lever. "Knock your rivals off the floor!" ₽300 to the last car standing. Two cars are the Brothers Stile. They are cheating.', [
    ch('Drive.', fight('You drive. The Stiles gang up on you at once, two cars, one plan. Their Pokémon ride on the bonnets. Fine. Ram them.', trainer('The Brothers Stile', { format: 'doubles', cls: 'roughneck', friendly: true, win: [$(300), $(200)] }))),
    ch('Watch.', out('You watch from the rail. The Stiles take each other out in the end, head on, and climb out arguing. Dent rolls his eyes so hard he nearly falls over.')),
  ]),
  game('rf-carnival-plush', 'Carnival Plush', 'Rows of plush Pokémon on pegs. Hoopla, the ring-toss girl, spins a hoop on each wrist. "Ring the plush and your party gets a lucky charm." Or buy one outright: ₽300.', [
    ch('Throw.', out('The hoop drops clean over a plush\'s head. Hoopla hands it over. Your team crowds round it and decides, together, that it is theirs.', flag('fair-plush'), bond(1, 'party')), skill('throw-ring', 'good', 'The hoop bounces off a plush\'s ear. Hoopla gives you another, for free, out of pity. That one misses too.')),
    ch('Buy the plush outright.', out('You pay ₽300 and choose. Hoopla does not judge. Your team crowds round the plush and adopts it on the spot.', pay(COMMON), flag('fair-plush'), bond(1, 'party')), need(COMMON)),
  ]),
  game('rf-crane-operator', 'Crane Operator', 'A real harbour crane over a pile of crates. Big Rosa leans on the controls. "Speed or accuracy, you decide." Fast pays ₽300. Careful wins a Gold Bottle Cap.', [
    ch('Fast.', out('You slam the crate onto the dock with a bang. Rosa checks the clock and laughs. "Fast. Ugly. Paid." ₽300.', $(300)), skill('shout-tap', 'ok', 'Too fast. The crate swings wide, and Rosa takes the controls back, very calmly.')),
    ch('Careful.', out('Slow, slow, and down, so gently the crate does not even creak. Rosa takes her hat off. A Gold Bottle Cap.', item('gold-bottle-cap')), skill('gauge-hold', 'good', 'Down, and a little crooked. Rosa sighs. "Careful is a whole lot of careful."')),
  ]),
  game('rf-cupid-arrow', "Cupid's Arrow", 'A target with paired hearts. Valentina, the archer, notches a blunt arrow. "Hit a pair and your party gets closer!" The prize: two of your Pokémon, named on the pair you hit, grow closer.', [
    ch('Aim.', out('Thunk. Dead centre of a pair of hearts. Valentina writes two of your Pokémon\'s names in them, and they sit together for the rest of the day.', bond(1, 'party')), skill('aim-drag', 'good', 'The arrow wobbles off into the bunting. Valentina retrieves it without comment.')),
    ch('Let a Fairy-type aim.', out('Your Fairy-type does not even look. Thunk. Two hearts. Valentina applauds slowly.', bond(1, 'party')), { requires: [anyType('fairy')], ...skill('aim-drag', 'ok', 'Your Fairy-type hits the hearts, but the wrong pair. It insists this was on purpose.') }),
  ]),
  game('rf-disco-floor', 'Disco Floor', 'A light-up dance floor, flashing. DJ Glimmer spins under a mirror ball. "Step on the beat!" A full combo wins a Sweet Heart.', [
    ch('Dance.', out('Every step on every beat. The floor lights up gold under you. DJ Glimmer stops the record to applaud. A Sweet Heart.', item('sweet-heart')), skill('echo-rhythm', 'perfect', 'You lose the beat halfway, and find it again, and lose it. The crowd dances anyway.')),
    ch('Let a Pokémon dance.', out('Your Pokémon has rhythm you never suspected. Full combo. DJ Glimmer hands it the Sweet Heart personally.', item('sweet-heart')), skill('echo-rhythm', 'good', 'Your Pokémon dances to a completely different song in its head. It has a lovely time.')),
  ]),
  game('rf-haunted-jenga', 'Haunted Tower', 'A tower of wooden blocks, operated by a Mimikyu in a tiny cap. When you reach for a block, it nudges the tower. Ten blocks wins a Spell Tag.', [
    ch('Pull a block.', out('You pull ten, the Mimikyu nudging every time, and the tower holds. The Mimikyu stares. It hands over a Spell Tag, outraged.', item('spell-tag')), skill('brace-hold', 'perfect', 'The Mimikyu nudges, and the tower comes down. It wiggles under its cap. Laughing, you suspect.')),
    ch('Ask it to stop.', out('The Mimikyu stops, embarrassed, and shuffles behind the table. Its cap droops.', flag('fair-mimikyu-stopped'), stay('rf-haunted-jenga'))),
  ], { remembers: [{ id: 'jenga-fair', when: [flagIs('fair-mimikyu-stopped')], notice: 'The Mimikyu keeps its paws to itself now, very pointedly.', hide: [0],
    addChoices: [ch('Pull a block.', out('Ten blocks, with nobody nudging. The Mimikyu hands over the Spell Tag, a little sulky, a little proud of you.', item('spell-tag')), skill('brace-hold', 'good', 'The tower comes down on its own this time. The Mimikyu looks very innocent.'))] }] }),
  game('rf-hot-potato', 'Hot Potato', 'A ring of players and a Voltorb being passed hand to hand, ticking. Fizzbang, the juggler, grins. "Hold the Voltorb at zero and it blows. Pass fast!" A Cell Battery to the winner.', [
    ch('Play.', out('Round and round. Zero. The Voltorb goes off in someone else\'s hands with a pop of confetti. You win a Cell Battery. The Voltorb is beaming.', item('cell-battery')), skill('shout-tap', 'good', 'Zero, in your hands. Pop. Confetti everywhere, nobody hurt. The Voltorb looks thrilled. You are out.')),
    ch('Is it a real Voltorb?', out('"Oh, very real," Fizzbang says. "He loves this game. It\'s just confetti. He makes it himself." The Voltorb looks smug.', stay('rf-hot-potato'))),
  ]),
  game('rf-hurdles', 'Hurdles', 'A short track with low hurdles. Coach Leap blows a whistle. "Tap the rhythm. Clear them all!" The prize: +1 Speed effort for the runner.', [
    ch('Run.', out('Your lead clears every hurdle on the beat, clean. Coach Leap writes the time on the board and underlines it twice.', mk('effort', { stat: 'spe', amount: 1 })), skill('hurdle-rhythm', 'good', 'Your lead clips the third hurdle, and the fourth, and finishes laughing.')),
    ch('Let a fast Pokémon run.', out('The Pokémon you pick takes the hurdles like they are not there. Coach Leap drops his whistle.', mk('effort', { stat: 'spe', amount: 1, who: 'picked' })), { pick: {}, ...skill('hurdle-rhythm', 'ok', 'It runs round the hurdles instead of over them. Technically fastest. Coach Leap does not allow it.') }),
  ]),
  game('rf-rhythm-raid', 'Rhythm Raid', 'A stage, speakers stacked high. MC Volt taps a mic. "Tap along and the beat carries you into battle." Hit the beat, and your moves hit a tenth harder in his battle.', [
    ch('Tap.', fight('You lock onto the beat. MC Volt grins and calls his Pokémon up on stage. The bass drops.', trainer('MC Volt', { types: ['electric'], friendly: true }), { kind: 'tempEffect', label: 'On the beat: moves +10%', effects: [{ kind: 'damageMultiplier', value: 1.1 }], battles: 1, until: 'battle' }), skill('echo-rhythm', 'good', 'You lose the beat. MC Volt shrugs. "Battle\'s still on." It is.')),
    ch('Freestyle.', fight('You ignore the beat entirely. The crowd loves it. MC Volt loves it. He calls his Pokémon up anyway.', trainer('MC Volt', { types: ['electric'], friendly: true }))),
  ]),
  game('rf-sandcastle', 'Sandcastle', 'A beach of sand piles and one very serious judge: a Sandygast, scorecard stuck to its shovel. The tallest castle wins a Soft Sand.', [
    ch('Build.', out('Up, and up, and a tower on top, and a flag. The Sandygast measures it with its shovel twice. Tallest. It hands over Soft Sand, grudgingly.', item('soft-sand')), skill('tilt-drag', 'good', 'Your castle slumps gently into a heap. The Sandygast writes something on its card. You suspect it is not kind.')),
    ch('Ask the Sandygast for tips.', out('It hesitates, then leads you behind the dunes, to its own castle. Towers, bridges, a moat with a Wingull in it. It is beautiful. The Sandygast looks at you, waiting for your opinion.', stay('rf-sandcastle'))),
  ]),
  game('rf-smell-test', 'Smell Test', 'A row of covered jars. Sniffles, the nose, holds one under yours. "Which item\'s in this jar?" Five right wins a Lagging Tail.', [
    ch('Sniff.', out('Five jars, five answers, five right. Sniffles laughs so hard he has to sit down, and hands over a Lagging Tail.', item('lagging-tail')), { chance: 0.4, fail: out('Three right, then two very confident wrong answers. Sniffles laughs anyway.') }),
    ch('Let a Pokémon sniff.', out('Your Pokémon sniffs once per jar and names each one by pointing. Sniffles is helpless with laughter. A Lagging Tail.', item('lagging-tail')), { chance: 0.8, fail: out('Your Pokémon tries to eat the fourth jar. Disqualified, adored.') }),
  ]),
  game('rf-tug-of-war', 'Tug of War', 'A thick rope across a mud pit, and on the far end, three Machamp, flexing all twelve arms. Win, as a team, and the prize is a Black Belt.', [
    ch('Pull with the team.', out('Everyone on the rope, everyone pulling, everyone yelling. The Machamp go into the mud, all three, and come up laughing. A Black Belt.', item('black-belt')), skill('pull-hold', 'good', 'The Machamp pull once, politely, and you all slide into the mud. They help you out, one arm each.')),
    ch('Pull alone.', out('You grab the rope alone. One Machamp pulls with one finger. You fly into the mud. The crowd cheers you anyway.')),
  ]),
  game('rf-type-rps', 'Type Rock-Paper-Scissors', 'A kid in a cap with his hand behind his back. Rocco grins. "Fire, Water or Grass? I always pick Grass!" The winner gets ₽100.', [
    ch('Fire.', out('Fire beats Grass. He really did pick Grass. He cries, loudly, for six seconds, and then he is fine, and pays you ₽100 from his pocket.', $(100))),
    ch('Water.', out('Grass beats Water. He really does always pick Grass. He cheers so loudly a Pidgey takes off.')),
    ch('Grass.', out('Grass and Grass. A tie. Rocco looks at you with deep respect, as one Grass person to another.')),
  ]),
  game('rf-whack-diglett', 'Whack-a-Diglett', 'A board of holes with Diglett popping in and out. Moley, the operator, holds out a soft hammer. "Tap before they hide! Points pay cash." Ten points per Diglett.', [
    ch('Whack.', out('Bop, bop, bop. The Diglett pop down giggling. Thirty points: Moley pays ₽300.', $(300)), skill('whack-tap', 'good', 'The Diglett are too quick, and they know it. Moley pays you ₽50 for effort.', $(50))),
    ch('Feed the Diglett instead.', out('You hold out a Berry. Every Diglett pops up and stays up, adoring, swaying. No points. Your Ground-type sits among them like it has come home.', fr(5, { types: ['ground'] })), { requires: [anyType('ground')] }),
  ]),
  game('rf-whistle-echo', 'Whistle Echo', 'An old man on a bench with a tin whistle. Old Tune plays four notes. "Copy my melody exactly." The prize: a Poké Flute.', [
    ch('Whistle back.', out('Four notes, exactly. Old Tune closes his eyes. Then he hands you a Poké Flute. "Wakes the sleepy ones. Play it kindly."', item('poke-flute')), skill('pitch-hold', 'good', 'Three notes right, one very wrong. Old Tune winces, and plays it again, slower.')),
    ch('Let a sound-move Pokémon sing it.', out('The Pokémon you pick sings the melody back perfectly, and then adds a harmony. Old Tune wipes his eyes. A Poké Flute.', item('poke-flute')), { pick: { moveFlag: 'sound' }, ...skill('pitch-hold', 'ok', 'It sings something else entirely, beautiful, and wrong. Old Tune claps anyway.') }),
  ]),
  game('dance-competition', 'Dance Competition', 'A stage with glowing arrows and three judges holding scorecards. "Match the arrows!" The winner takes a Dancer\'s ribbon.', [
    ch('Dance.', out('Up, left, spin, down, every arrow. Three tens. A Dancer\'s ribbon pinned on your collar.', flag('fair-dance-ribbon'), moment('A Dancer\'s ribbon from the fair\'s dance competition.', 50)), skill('copycat-claps', 'good', 'You miss an arrow and improvise. The judges hold up a 6, a 7 and, inexplicably, a 10.')),
    ch('Dance with a Pokémon.', out('You and the Pokémon you pick dance as one. The judges stand up. A Dancer\'s ribbon for each of you, and your partner will not stop doing the spin.', flag('fair-dance-ribbon'), fr(5, 'picked')), { pick: {}, ...skill('copycat-claps', 'ok', 'You step on each other. Twice. You both laugh too hard to finish.', fr(5, 'picked')) }),
  ]),
  // ---- SF92.3 The Festival Stops ----
  game('fairy-tea', 'The Fairy Tea Party', 'A tea table set for twelve, every seat a Fairy Pokémon. At the head, a Hatterene in a bonnet. Subtitled: "Sit. Pour. Mind your manners."', [
    ch('Pour for everyone.', out('You pour for every guest, saucer and all, without spilling a drop. The Hatterene inclines its head. A Pixie Plate is slid across the cloth.', fr(5, { types: ['fairy'] }), item('pixie-plate'))),
    ch('Bring a Fairy-type.', out('Your Fairy-type is welcomed with a cup of its own and a little bow from every guest. As you leave, it is given a Fairy Gem to take home.', item('fairy-gem')), { requires: [anyType('fairy')] }),
    ch('Spill.', out('Tea, everywhere. Twelve Fairies gasp at once. And then the Hatterene laughs, a sound like bells, and so does everyone. Nothing lost.')),
  ]),
  game('festival-fireworks', 'The Fireworks', 'Five fuses on a riverbank, one chance. Madame Roux hands you the taper. "Light them in the right order. The show depends on it." Poppet is sitting on the wall, swinging her legs.', [
    ch('Smallest to biggest.', out('Pop, crackle, bang, BANG, and the sky fills. Your whole team sits on the bank with their faces lit up gold. A perfect show.', bond(1, 'party'))),
    ch('Biggest first.', out('The big one first, then everything at once, then one small sad fizz at the end. A mess. Everyone agrees it was wonderful.')),
    ch('Ask Poppet.', out('"Red, then blue, then gold, then the two big ones together." She is right. The best show in years. Roux cries again. Poppet looks unbearably smug.', bond(1, 'party'), moment('Poppet lit the fair\'s fireworks with you. The best show in years.', 55))),
  ]),
  game('firebreather-show', 'The Fire-Breather', 'A man in a leather apron with a Magmar at his side. Ignatius winks. "Want to see a real one?" His Magmar breathes a perfect ring of fire into the night air.', [
    ch('Applaud.', out('You applaud. Ignatius bows. The Magmar bows lower.')),
    ch('Let my Fire-type try.', out('Your Fire-type takes a deep breath and blows a ring. It is lopsided. It is wonderful. The crowd goes absolutely wild, and your Fire-type stands a little taller all night.', fr(10, 'picked')), { pick: { types: ['fire'] } }),
    ch('Is that safe?', out('"Never," says Ignatius happily. "That\'s the fun." His Magmar nods solemnly.')),
  ]),
  game('flower-garden', 'The Flower Garden', 'A bright garden behind the stalls, and an Aroma Lady kneeling in it with her sleeves rolled up. Every bed is a different colour. The air smells like something you remember.', [
    ch('Help weed.', out('You weed all afternoon, side by side, not talking much. At the end she presses a Miracle Seed into your muddy hand.', ...aNode(), item('miracle-seed'))),
    ch('Smell the flowers.', out('You breathe in. Your whole team breathes in. Whatever sleepiness was in them is gone, and their eyes are bright.', cure())),
    ch('Pick one.', out('She lets you pick one, and tucks it behind your ear herself.', flag('fair-flower'))),
  ], { remembers: [{ id: 'garden-rosalind', when: [flagIs('roster-rosalind-done')], intro: 'A bright garden behind the stalls, and Rosalind kneeling in it, sleeves rolled up, with a whole bed of moonflowers. She sees you and smiles like it has been a long time.', hide: [2],
    addChoices: [ch('Pick one.', out('"Not that one." Rosalind stops your hand gently. She picks a moonflower instead and puts it in yours. "This one. You\'ll know why later."', flag('fair-flower'), moment('Rosalind gave you a moonflower from her bed at the fair.', 60)))] }] }),
  game('photo-contest', 'The Photo Contest', 'A board of pinned photographs and a judge with a magnifying glass. Flick waves you over. "Show me your best camp photo of your Pokémon!" First prize ₽500. Second ₽250.', [
    ch('The starter, sleeping.', out('Flick looks at it for a long time. "It\'s always the sleeping ones," he says softly, and pins a rosette on it. First prize.', $(500), fr(5, 'starter'))),
    ch('The whole team.', out('Everybody squeezed in, somebody blinking. Flick nods. Second prize. "Good. Honest. Somebody\'s looking at you instead of the camera."', $(250))),
    ch('A blurry action shot.', out('Flick holds it up to the light, turns it sideways, and gasps. "This is the best bad photo I have ever seen." Special mention.', flag('fair-photo-mention'), moment('Flick gave your blurry action shot a special mention.', 45))),
  ]),
  game('pokefan-meetup', 'The Pokéfan Meetup', 'A ring of folding chairs and Pokéfans with their favourites in their laps. Gwendolyn waves you in. "Show us yours!"', [
    ch('Show the starter.', out('Your starter sits in the middle of the ring, and everyone says its name, and asks questions, and it answers every one by looking at you.', fr(10, 'starter'))),
    ch('Show the newest.', out('Your newest Pokémon, shy, in the middle of the ring. Everyone is so kind to it. By the end it is sitting in Gwendolyn\'s lap.', fr(10, 'newest'))),
    ch('Ask to see theirs.', out('A dozen Pokémon, each with a story, and you hear every story. As you leave, Gwendolyn presses a Soothe Bell into your hand. "For listening."', item('soothe-bell'))),
  ]),
  game('sky-race', 'The Sky Race', 'Bird Keepers line up on a hill with their Flying-types. A banner overhead: FIRST OVER THE RIVER WINS A SHARP BEAK. A bookie at the side takes friendly bets: ₽100 on Perry, 1 in 3, pays ₽300.', [
    ch('Enter a Flying-type.', out('Your Flying-type rides the wind like it was made for it. First over the river. A Sharp Beak.', item('sharp-beak')), { requires: [anyType('flying')], ...skill('balloon-drag', 'good', 'Your Flying-type gets caught in a crosswind and comes third, furious about it.') }),
    ch('Bet on Perry.', out('You put ₽100 on Perry. The birds go up.', mk('prize', { stake: 100, table: [{ weight: 1, label: 'Perry wins! ₽300', money: 300 }, { weight: 2, label: 'Perry comes second' }] })), need(100)),
    ch('Watch.', out('You lie on the grass and watch them go, wings against the blue, all the way over the river.')),
  ], { remembers: [{ id: 'sky-race-perry', when: [flagIs('roster-perry-done')], notice: 'Perry is on the line, and he looks different. Steady. He catches your eye and nods.', hide: [1],
    addChoices: [ch('Bet on Perry.', out('You put ₽100 on Perry. He wins by a length, and lands, and looks for you in the crowd first.', pay(100), $(300)), need(100))] }] }),
  game('street-brawl', 'The Street Brawl', 'Two trainers squaring up behind the stalls. The Brothers Stile. Lem, the older: "She stole Mum\'s fair!" Tobble, the younger: "We\'ll take it back!"', [
    ch('Break it up.', fight('You step between them. They look at each other and agree on one thing: you. A double battle. Afterwards, they stop.', trainer('The Brothers Stile', { format: 'doubles', cls: 'roughneck', friendly: true }))),
    ch('Battle them both.', fight('"Both of you," you say. "Now." They grin, the same grin. They have trained for this. A harder double battle.', trainer('The Brothers Stile', { format: 'doubles', cls: 'roughneck', lv: 3, friendly: true }))),
    ch('Tell them about the will.', out('You tell them what Roux told you. They go very quiet. Tobble looks at Lem. Lem looks at the ground. Then they walk, together, toward the gate, to see her.', flag('fair-stile-will'), ...kind(1)), { requires: [flagIs('fair-stile')] }),
  ]),
];

export const REMOVE: string[] = [];
