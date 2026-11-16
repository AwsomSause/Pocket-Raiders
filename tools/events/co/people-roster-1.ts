// Catalog Overhaul Pack, people: THE ROAD ROSTER, RR1 (ROAD_ROSTER.md). The reference module for every other roster file.
// Build: npm run co:build -- people-roster-1
import { again, ch, fight, item, join, out, room, type Json } from '../dsl.ts';
import { bond, CATEGORY as CAT, moment, rosterKit, spar, variant } from './_people.ts';

export const CATEGORY = CAT;

// ---------- RR1. Youngster Joey (morning, afternoon; Rattata, later Raticate) ----------
const J = rosterKit('joey', 'npc-meet-youngster-joey', 'Youngster Joey');
const JOEY = 'Youngster Joey';
const clubRattata = [join({ species: ['rattata'] }), { kind: 'teachMove', move: 'hyper-fang', species: 'rattata' }];

const joey: Json[] = [
  J.meet(1, {
    title: 'Top Percentage',
    intro:
      'A sunny route. A boy in shorts and a cap jumps out of the long grass with a Rattata held up over his head like a trophy. Joey: "Hey! You! Look at this Rattata." ' +
      'He turns it so you can see every side. Joey: "It\'s in the top percentage. I looked it up. Well, I asked my cousin." He tugs at his shorts. ' +
      'Joey: "Like my shorts? They\'re comfy and easy to wear!" The Rattata bares its teeth, very proud of both of them. Joey: "Battle me. You\'ll see."',
    choices: [
      ch('"Let\'s go."', fight('Joey whoops and sets the Rattata down. It plants its feet like it has been waiting all morning for exactly this.',
        spar(JOEY, { team: ['rattata'], size: 1, lv: 2, foeMoves: ['hyper-fang'], win: [J.set('won1'), item('potion'), moment('You beat Joey\'s top-percentage Rattata')], lose: [moment('Joey\'s top-percentage Rattata beat you')] }), J.set('m1'))),
      ch('"Which percentage?"', fight('Joey: "The top one!" He is very sure. He says it again, slower, in case you missed it. Then the Rattata is on the ground and the battle is on.',
        spar(JOEY, { team: ['rattata'], size: 1, lv: 2, foeMoves: ['hyper-fang'], win: [J.set('won1'), item('potion'), moment('You beat Joey\'s top-percentage Rattata')], lose: [moment('Joey\'s top-percentage Rattata beat you')] }), J.set('m1'))),
      ch('"Maybe later."', out('Joey: "It\'ll be stronger later! You\'ll be sorry!" He is already climbing back into the grass. You have the feeling he will be out here again tomorrow morning, waiting.', again(J.id(1)))),
    ],
  }),
  J.meet(2, {
    title: 'The Old Rattata',
    intro:
      'The same boy, a little taller, sitting on a fence. The Rattata is curled on his lap. Its whiskers have gone grey. Joey: "It\'s slower now. Vet says that\'s normal. Rattata don\'t last that long." ' +
      'He strokes its ears with one finger. Joey: "Everyone says evolve it. I don\'t want it to stop being it." He looks up at you, and his voice goes small. Joey: "Did you battle it last time? Did it do good?"',
    choices: [
      ch('"It was the best."', out('Joey: "...Yeah. Top percentage." He laughs and cries at once, and wipes his nose on his wrist. The old Rattata opens one eye, looks at you, and thumps its tail against his knee.', J.set('m2'), J.set('kind'), bond(1, 'party'))),
      ch('"Evolve it."', out('Joey: "But—" He stops. He thinks about it for a long, long moment, forehead against the Rattata\'s. Then the light takes it, right there on his lap. The Raticate that sits up is bright-eyed and much perkier, and it licks his whole face.', J.set('m2'), J.set('evolved'))),
      ch('"Let it rest."', out('He nods slowly. He reaches into his bag and shows you a younger Rattata, tiny and wriggling, that he caught "just in case." Joey: "This one can do the battling. That one can watch." The old one yawns, as if that suits it fine.', J.set('m2'), J.set('rested'))),
    ],
    remembers: [
      variant('lost-m1', [J.not('won1')], { notice: 'Joey grins at you through it all. Joey: "You lost to it! That\'s how I know it\'s top percentage." He is delighted.' }),
      variant('won-m1', [J.is('won1')], { notice: 'Joey shrugs, not unkindly. Joey: "You beat it. That\'s okay. You\'re really good."' }),
    ],
  }),
  J.meet(3, {
    title: 'The Rattata Club',
    intro:
      'A little sign is nailed to a tree: RATTATA CLUB, MEMBERS ONLY. Under it sit five kids and five Rattata, and Joey, in charge, with a whistle he clearly found somewhere. ' +
      'Joey: "I started a club! We train together. Want to judge?" A basket sits next to him in the shade, lined with an old jumper.',
    choices: [
      ch('"Judge."', out('Joey blows the whistle. The five kids scramble into a line, each holding a Rattata as high as their arms will go. You are handed a twig, which is apparently the judge\'s twig.', room(J.roomId('contest')))),
      ch('"Battle the whole club."', fight('Joey: "ALL of us? Okay! Club, line up! One at a time, like we practised!" Five Rattata, in a row. It is harder than it sounds.',
        spar('The Rattata Club', { team: ['rattata', 'rattata', 'rattata', 'rattata', 'rattata'], size: 5, foeMoves: ['hyper-fang'], win: [...clubRattata, moment('You beat all five of the Rattata Club')], lose: [moment('The Rattata Club beat you, one Rattata at a time')] }), J.set('done'), J.set('battled'))),
      ch('"Give a speech."', out('Joey shushes everyone. Five kids and five Rattata go quiet and look up at you. Joey has a pencil ready. Whatever you say next is going on the sign.', room(J.roomId('speech')))),
    ],
    remembers: [
      variant('coach', [J.is('evolved')], { notice: 'The Raticate sits upright in the basket with a tiny whistle of its own round its neck. It is the club\'s "coach," and it is very proud.' }),
      variant('empty-basket', [J.is('rested')], { notice: 'The basket is empty. Joey sees you looking. Joey: "Last spring." He points at the sign. Under RATTATA CLUB, smaller: "Top Percentage\'s club."' }),
      variant('sleeping', [J.is('kind')], { notice: 'The old Rattata is asleep in the basket, grey whiskers twitching. Every kid in the club steps round it very carefully.' }),
    ],
  }),
  J.room('contest', {
    title: 'The Club Contest',
    intro:
      'Three finalists step forward. Dot\'s Rattata does a perfect Quick Attack round the tree and back. Benji\'s Rattata misses its jump, lands on its face, and gets up and tries again without being asked. ' +
      'Little Ines whispers something to hers, and it sits completely still for a count of ten, which nobody thought a Rattata could do. Joey: "Okay, judge. Who wins?"',
    choices: [
      ch('"Dot. That was fast."', out('Dot screams. Her Rattata screams. Joey hangs a bottle-cap medal round its neck with great ceremony. The club votes, loudly, to give their judge a member of their own: a young Rattata in a tiny cap, already showing its fangs.', J.set('done'), J.set('club', 1), ...clubRattata)),
      ch('"Benji. It got back up."', out('Benji goes bright red and stares at his shoes, and his Rattata climbs onto his head and stays there. Joey: "Good pick. That\'s the club rule. You get back up." They send you off with a young Rattata in a tiny cap.', J.set('done'), J.set('club', 2), ...clubRattata)),
      ch('"Ines. It listened."', out('Ines does not say anything at all, but she holds the bottle-cap medal in both hands for the rest of the afternoon. Joey nods like a much older man. The club gives you a young Rattata in a tiny cap to remember them by.', J.set('done'), J.set('club', 3), ...clubRattata)),
    ],
  }),
  J.room('speech', {
    title: 'The Sign',
    intro: 'The club waits. A Rattata sneezes. Joey holds the pencil against the wood under MEMBERS ONLY and looks at you without blinking.',
    choices: [
      ch('"Every one of you is top percentage."', out('Joey writes it down with his tongue between his teeth, spelling "percentage" three different ways before he gets it. The kids cheer like they have won something. They press a young Rattata in a tiny cap into your arms.', J.set('done'), J.set('sign', 1), ...clubRattata)),
      ch('"Small is not the same as weak."', out('The littlest kid nods so hard her cap falls off. Joey writes it in capitals and underlines it twice. A young Rattata in a tiny cap is voted, unanimously, to go with you.', J.set('done'), J.set('sign', 2), ...clubRattata)),
      ch('"Look after them and they\'ll look after you."', out('Joey stops writing halfway and looks at the basket. Then he finishes the line very neatly. Joey: "Yeah. They do." He hands you a young Rattata in a tiny cap himself.', J.set('done'), J.set('sign', 3), ...clubRattata)),
    ],
  }),
];

export const EVENTS: Json[] = [...joey];
export const REMOVE: string[] = [];

/** Where each event is scripted (for docs/status/co-people.md and the `extra` list of the status file). */
export const DOC: Record<string, string> = {
  'npc-meet-youngster-joey': 'RR1 M1', 'npc-meet-youngster-joey-m2': 'RR1 M2', 'npc-meet-youngster-joey-m3': 'RR1 M3',
  'npc-meet-youngster-joey-contest': 'RR1 M3 (Judge)', 'npc-meet-youngster-joey-speech': 'RR1 M3 (Speech)',
};

/** Flags nothing in this file reads: where the doc says they come back (merged into src/data/catalogOverhaul/flags/people.json). */
export const AFTERSTORY: { match: string; readBy: string }[] = [
  { match: 'roster-joey-(club|battled|sign)', readBy: 'Final Reunion: Joey brings the whole club and the line on the sign (RR1 Afterstory)' },
];
