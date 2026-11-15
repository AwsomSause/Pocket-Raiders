// Catalog Overhaul Pack, STORY_FAMILIES_18 SF134: the last leftovers in this row (Biscuit, COACH, the Honest Salesman, the Reverse
// Wishing Fountain, the Long Table and the Last Door). Fire Week (SF134.6) belongs to the calendar row.
// "+1 Bond" is friendship +25 here (BOND); "Bond 2" on the salesman's Magikarp is said in words.
import { $, ch, ev, flag, flagIs, fr, inRegion, item, join, money, out, room, type Json } from '../dsl.ts';
import { kind } from './_evil-story-kit.ts';

export const CATEGORY = 'evil-story';

const BOND = 25;
const say = (who: string, line: string): string => `${who}: "${line}"`;

// SF134.1 Biscuit.
const sit = ch('Sit with Biscuit.', out(`You sit down on the wet ground and say nothing. Your lead lies down beside the bench, nose on its paws, and waits with you. A long while later, the Yamper creeps out and puts its head on your lead's paw. You carry Biscuit back to Teddie wrapped in your jacket. Teddie gives you a Sitrus Berry and pins the damp FOUND sign to your bag, and won't hear a word about it.`, fr(BOND, 'lead'), flag('biscuit-home'), item('sitrus-berry'), flag('found-sign')));
const bring = ch('Bring Teddie here.', out(`You fetch Teddie. They kneel down in front of the bench, in front of everyone walking past, and say sorry to a Yamper. Out loud. "I didn't mean it. We lost and I was angry and I didn't mean it." Biscuit comes out, and climbs into their lap. Teddie gives you a Sitrus Berry, and pins their FOUND sign to your bag.`, flag('biscuit-home'), item('sitrus-berry'), flag('found-sign'), ...kind(1)));
const biscuit: Json[] = [
  ev('galar-lost-pokemon', 'Biscuit', 'Galar', { requires: [inRegion('galar')], cast: ['trainer.pr/clerk_f'], pokemon: 'yamper', tint: '#486898', effect: 'rain' },
    `A trainer stands in the rain by the stadium with a damp cardboard sign: LOST: YAMPER. ANSWERS TO BISCUIT. When you pass, they grab your sleeve. ${say('Teddie', `I've looked since the match last night. We lost. I said a thing. I didn't mean it.`)} Under a bench by the stadium wall, you can see a Yamper, soaked, its ears flat against its head.`,
    [
      ch('Call Biscuit.', out(`"Biscuit!" It flinches at the voice, and bolts along the wall to the next bench, farther away, and crouches under that one instead. You'll have to try something gentler.`, room('galar-lost-pokemon-bench'))),
      sit,
      bring,
    ]),
  ev('galar-lost-pokemon-bench', 'Under the Bench', 'Galar', { room: true, cast: ['trainer.pr/clerk_f'], pokemon: 'yamper', tint: '#486898', effect: 'rain' },
    `Biscuit is under the far bench now, shaking. Teddie has their hands over their mouth.`,
    [sit, bring]),
];

// SF134.2 COACH: three lessons, then the Little Cup (a stage later).
const lesson = (id: string, name: string, intro: string, picks: [string, string, string][], next?: string): Json =>
  ev(id, name, 'Trainers and challenges', { room: id !== 'little-league', cast: ['trainer.youngster_m'], effect: 'sparkle' }, intro,
    picks.map(([label, text, key]) => ch(label, out(text, flag(`coach-style-${key}`), ...(next ? [room(next)] : [flag('coach-done')])))));
const coach: Json[] = [
  lesson('little-league', 'COACH',
    `Kids practising battles in a park, badly. They've got a Wooper, a Tyrogue, a Skwovet and a Pichu, and the Pichu keeps shocking its own trainer. The tallest one marches up to you. ${say('Linnet, the captain', `You're a real trainer. Coach us? The Little Cup's soon.`)} Four faces look up at you. First lesson: what's the team about?`,
    [['"Win at all costs."', `They nod, very serious. The Tyrogue's trainer punches the air.`, 'costs'], ['"Have fun first."', `The Pichu's trainer laughs so hard she sits down.`, 'fun'], ['"Look after each other."', `Linnet looks round at the other three, and nods slowly.`, 'each-other']], 'little-league-2'),
  lesson('little-league-2', 'COACH: Tactics',
    `Second lesson. ${say('Linnet', `What do we do when we're actually battling?`)}`,
    [['"Use your strongest move."', `The Wooper's trainer writes it on his hand.`, 'strongest'], ['"Read the other side."', `They all turn and stare at each other's Pokémon, very hard, as practice.`, 'read']], 'little-league-3'),
  lesson('little-league-3', 'COACH: Losing',
    `Last lesson. The smallest one, the Skwovet's trainer, asks it very quietly. "What if we lose?"`,
    [['"Losing\'s the worst."', `She nods, and holds her Skwovet tighter.`, 'worst'], ['"Losing\'s how you learn."', `She thinks about it, and then she nods too, and lets go a little.`, 'learn']]),
  ev('little-league-cup', 'The Little Cup', 'Trainers and challenges', { callback: true, requires: [flagIs('coach-done'), flagIs('little-cup-done', 0, 0)], cast: ['trainer.youngster_m'], effect: 'sparkle' },
    `The Little Cup. Your team, your four kids, in matching shirts they've made themselves. You sit on the coach's bench. In the stands, a trainer with a Yamper on their lap is cheering for everyone.`,
    [ch('Watch from the bench.', out(`They win. They actually win. Linnet runs over and pushes the trophy into your hands. You hold it for a second, and give it back. It's theirs.`, flag('little-cup-done'), flag('little-cup-won'), ...kind(1)), { chance: 0.5, fail: out(`They lose, in the final, by one hit. They walk off the field together.`, flag('little-cup-done')) })]),
];
(coach[3] as Json).remembers = [
  { id: 'worst', when: [flagIs('coach-style-worst')], notice: `If they lose, you know already: they'll cry, and quit. You taught them that losing is the worst.` },
  { id: 'learn', when: [flagIs('coach-style-learn')], notice: `Win or lose, they'll shake hands at the end. You taught them that.` },
];
(coach[0] as Json).remembers = [{ id: 'biscuit', when: [flagIs('biscuit-home')], notice: `Teddie is sitting on the park bench with Biscuit in their lap, watching the practice.` }];

// SF134.3 The Honest Salesman.
const salesman = ev('pokemon-salesman', 'The Honest Salesman', 'Merchants and deals', { cast: ['trainer.guitarist'], pokemon: 'magikarp', effect: 'sparkle' },
  `A Magikarp on a velvet cushion, flopping gently. ${say('The salesman', `Only ₽500! It's a secret kind!`)} You look at it. "It's a Magikarp." There's a long pause. ${say('Mr. Pettigrew', `...It is a Magikarp. It's a good one. It tries very hard. I'm tired of lying about it.`)} He holds up a little card, written in pen. HONEST TRADE: ₽500 for one Magikarp, level 10, knows Bounce, already likes people. Fair value about ₽200. You'd be overpaying by ₽300.`,
  [
    ch('Buy it (₽500).', out(`You pay the full ₽500. He's so surprised he throws in a Mystic Water and has to sit down. The Magikarp flops off the cushion and into your arms.`, $(-500), join({ species: ['magikarp'] }), item('mystic-water'), flag('pettigrew-karp')), { requires: [money(500)] }),
    ch('Offer ₽200.', out(`${say('Mr. Pettigrew', `Fair. That's fair.`)} He takes it, and he looks lighter for it.`, $(-200), join({ species: ['magikarp'] }), flag('pettigrew-karp')), { requires: [money(200)] }),
    ch('No.', out(`He nods. He wasn't expecting anything else. The Magikarp flops in a way that might be a wave.`)),
  ]);

// SF134.4 The Reverse Wishing Fountain.
const fountain = ev('rk-reverse-fountain', 'The Reverse Wishing Fountain', 'Run-Wide Modifiers', { cast: [], tint: '#142a3a', effect: 'sparkle' },
  `A fountain full of coins, and a sign: TAKE A COIN INSTEAD OF LEAVING ONE. Each coin has a wish scratched into it. "For Mum's hip." "Make Rocky win." "Let me pass." If you take a coin and you carry Jirachi's Promise, the Promise breaks.`,
  [
    ch('Take a coin.', out(`You fish one out. ₽100. Scratched on it, in someone else's hand: "Let me pass." It won't come true now.`, $(100), flag('took-wish')), {}),
    ch('Leave one of mine.', out(`You scratch your own wish into a coin with a key, and drop it in. It sinks. Nothing happens, which is as it should be.`)),
    ch('Read the wishes.', out(`You read them all, one by one. One is a child's, in big letters: "LET ROCKY WIN HIS GYM." You remember the name.`, flag('rocky-wish'))),
  ]);
(fountain as Json).remembers = [{ id: 'promise', when: [flagIs('promise-jirachi')], notice: `Jirachi's Promise is warm in your bag. If you take a coin, it breaks.`, hide: [0], addChoices: [ch('Take a coin. (breaks the Promise)', out(`You take one. ₽100. In your bag, Jirachi's Promise cracks right across, quietly.`, $(100), flag('took-wish'), flag('promise-jirachi-broken')))] }];

// SF134.5 The Long Table and the Last Door.
const table = ev('final-chant', 'The Long Table', 'Set Pieces', { cast: [], tint: '#1c1c28', effect: 'sparkle' },
  `In the room before the Champion's door there's a long table, laid for a meal. There's a chair for every Pokémon you've had this run: the ones here now, the ones who went home, and the ones you lost, whose chairs are empty. Your team gathers round it. Each of them has a cry. One starts, and then the next, and it goes round the table.`,
  [
    ch('Join in.', out(`You join in, as loud as any of them. When it gets back round to the start, they're all looking at you. Whatever happens through that door, the first move will be yours together.`, fr(BOND, 'party'), flag('final-chant-joined'))),
    ch('Listen.', out(`You listen. Every voice, all the way round. Nothing else changes, and that's fine.`)),
    ch('Say each name.', out(`You say each name, all the way round the table, the empty chairs too. You say the lost ones last, and the team goes quiet for them. Then the cry starts again, softer.`, fr(BOND, 'party'), flag('final-names-said'))),
  ]);
(table as Json).remembers = [{ id: 'rival', when: [{ kind: 'rivalPath', path: 'friend' }], notice: `Your rival is at the table too, in a chair with their name on it. They say the first cry, and then look at you, embarrassed.` }];
const door = ev('final-conversation', 'The Last Door', 'Set Pieces', { cast: ['boss.cynthia-masters'], tint: '#1c1c28', effect: 'glint' },
  `The last door. Before you can knock, a voice behind it asks: "Before we fight: what do you want?"`,
  [
    ch('"To win."', out(`"Good. So do I." The door opens.`, flag('final-want-win'))),
    ch('"To see how far we\'ve come."', out(`"Then I'll show you." When the door opens, the Champion is holding one Ball, the oldest one, worn smooth. They'll lead with their oldest friend.`, flag('final-want-far'))),
    ch('"To be done."', out(`A long silence. "...I know that feeling." The door opens. "After this, win or lose, come and sit at the table for a while."`, flag('final-want-done'))),
  ]);

export const EVENTS: Json[] = [...biscuit, ...coach, salesman, fountain, table, door];
export const REMOVE: string[] = [];
