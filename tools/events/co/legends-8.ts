// Catalog Overhaul Pack, legends: Mythical Visits MY13 to MY22 (QUESTLINES_MYTHICAL.md) and Z5, Darkrai's Darkest Dream
// (QUESTLINES_ALPHAS_AND_ANOMALIES.md). Same rules as legends-7: a Visit opens for a believed Mythical when none has visited this run,
// never forces a battle, and ends in the Promise room. Melmetal's Promise is disabled in promisesData.ts (only one Mythical per run,
// and Meltan is already the Guest), so MY21 is a scene without a Promise. Keepsakes and the Parting are cut.
import { $, at, better, bondUp, ch, ev, fight, flag, flagIs, fr, heal, leave, lose, moveFlag, out, room, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { promiseRoom, visitable } from './_legendsKit.ts';

export const CATEGORY = 'legends';

const G = 'Story: Mythical';
const R = { room: true, rarity: 'rare' as const };
const moment = (text: string, importance = 85): Json => ({ kind: 'moment', text, importance });
const not = (key: string): Json => flagIs(key, 0, 0);
const toPromise = (id: string): Json => room(`co-my-${id}-promise`);
/** A one-on-one with a Mythical: no items (so no balls), no switching, the foe at your lead's level, the first faint ends it. */
const duel = (species: string, win: Json[], lose: Json[]): Json => ({
  ...wild({ species: [species], win }),
  pseudo: true,
  lose,
  rule: { noItems: true, noSwitch: true, matchLead: true, suddenDeath: true },
});

// ---------------------------------------------------------------- MY13. Darkrai: The Moonless Camp
const nightmare = (n: 1 | 2 | 3, label: string, text: string): Json =>
  ch(label, out(`${text} Darkrai takes it, the way smoke takes a candle. Your team wakes rested.`, flag(`darkrai-told-${n}`), heal(1), toPromise('darkrai')));
const my13: Json[] = [
  ev('co-my13-camp', 'The Moonless Camp', G, {
    rarity: 'rare', requires: [...visitable('darkrai'), at('night')], pokemon: 'darkrai', tint: '#302040', effect: 'flicker',
    remembers: [{ id: 'cresselia', when: [flagIs('blessing-cresselia')], notice: 'The pale shape steps out of the trees. Cresselia, heard, not spoken: "It is not your enemy. It never was."', addChoices: [] }],
  },
    'Camp, at night. Everyone falls asleep at once, you last. The moon is gone from the sky.\n\nYou wake inside a dream of the camp. Your Pokémon are asleep, twitching. One whimpers.\n\nA figure at the edge of the firelight, made of smoke and a white plume: "They dream of losing you. I did not put it there. I only let them see it. Tell me your nightmare, and I will take theirs."\n\nBehind it, something pale flickers in the trees and is gone.',
    [
      ch('"Tell it."', out('Which one?', room('co-my13-nightmare'))),
      ch('"Stay awake."', out('You hold the watch all night. Darkrai stays at the edge of the light until dawn, then speaks once: "You are stubborn. Good."', flag('darkrai-watched'), toPromise('darkrai'))),
      ch('"Who was that in the trees?"', out('Darkrai: "Someone who would rather I did not exist."', flag('darkrai-asked-cresselia'), room('co-my13-camp'))),
    ]),
  ev('co-my13-nightmare', 'The Moonless Camp: Your Nightmare', G, { ...R, pokemon: 'darkrai', tint: '#302040', effect: 'flicker' },
    'Darkrai waits. The fire does not crackle.',
    [
      nightmare(1, 'Losing your starter.', 'You tell it about the first day, and the one you chose, and the dream where you lose them.'),
      nightmare(2, 'Losing the run.', 'You tell it about the last battle going wrong, and walking home alone.'),
      nightmare(3, 'Being forgotten.', 'You tell it about coming back one day and nobody knowing your name.'),
    ]),
  promiseRoom('darkrai', 'Darkrai: "Where I sleep, they dream badly. Stop less. Let them breathe."', 'Darkrai walks a little behind you, always at the edge of the light. Your team sleeps well that night.', '#302040'),
];

// ---------------------------------------------------------------- MY14. Keldeo: The Fourth Statue
const my14: Json[] = [
  ev('co-my14-cave', 'The Fourth Statue', G, {
    rarity: 'rare', types: ['water'], requires: visitable('keldeo'), pokemon: 'keldeo', tint: '#4080c0',
    remembers: [{ id: 'swords', when: [flagIs('blessing-swords')], notice: 'One of the three statues turns its stone head. Keldeo: "They\'re watching."', addChoices: [] }],
  },
    'Behind a waterfall, a cave with three tall swordsman statues: a Cobalion, a Terrakion and a Virizion, cut in stone. A fourth plinth is empty. Hoofprints lead to it and away.\n\nA small blue Pokémon with a stubby horn backs out of the shadows, holding its ground.\nKeldeo: "They said I\'m not ready. They left me here to think. I\'ve thought. I\'m ready. I just need someone to see it. Battle me. Don\'t go easy."',
    [
      ch('"You\'re ready."', out('Keldeo: "You haven\'t even seen me." It is hurt, and asks again.', room('co-my14-cave'))),
      ch('"Show me."', fight('A one-on-one, under the statues.', duel('keldeo', [flag('keldeo-shown'), flag('keldeo-beaten'), toPromise('keldeo')], [flag('keldeo-shown'), toPromise('keldeo')]))),
      ch('"Why did they leave you?"', fight('Keldeo: "I ran to help someone. Alone. I almost lost." Then it lowers its horn.', duel('keldeo', [flag('keldeo-shown'), flag('keldeo-told'), toPromise('keldeo')], [flag('keldeo-shown'), flag('keldeo-told'), toPromise('keldeo')]))),
    ]),
  promiseRoom('keldeo', 'Keldeo, win or lose: "You didn\'t go easy. Thank you." It climbs onto the empty plinth and stands there a moment, then jumps down.\n\nKeldeo: "If I have to stand alone, so do you."', 'Keldeo trots beside you out of the cave, head high.', '#4080c0'),
];

// ---------------------------------------------------------------- MY15. Genesect: Command?
const my15: Json[] = [
  ev('co-my15-lab', 'Command?', G, { rarity: 'rare', requires: visitable('genesect'), pokemon: 'genesect', tint: '#8040a0' },
    'An abandoned lab on a cliff. Rust. A cracked pod, still warm. A screen flickers: COMMAND?\n\nBehind the pod, a purple insect-machine with a cannon on its back, curled up. The screen scrolls: SUBJECT REVIVED 300,000,000 YEARS POST. MODIFIED. 4 DRIVES FITTED. AWAITING COMMAND.\n\nIt opens one red eye and looks at the screen, not at you.',
    [
      ch('"Stand down."', out('It powers off. It stays here, curled up, quiet.', flag('genesect-down'))),
      ch('"Wake up."', fight('It wakes as a weapon.', { ...wild({ species: ['genesect'], lv: 4, win: [flag('genesect-fought'), room('co-my15-home')] }), pseudo: true, lose: [flag('genesect-fought')], rule: { noItems: true } })),
      ch('"Leave it."', out('You walk out. It follows you out of the lab, at a distance, and at the gate the screen it carries flickers.', flag('genesect-followed'), room('co-my15-home'))),
      ch('Type nothing.', out('Three minutes pass. It types back, slowly.', flag('genesect-home'), room('co-my15-home'))),
    ]),
  ev('co-my15-home', 'Command?: HOME?', G, { ...R, pokemon: 'genesect', tint: '#8040a0' },
    'The screen: HOME?',
    [
      ch('"Here."', out('It curls up by the pod again. It stays in the lab.', flag('genesect-stayed'))),
      ch('"I don\'t know."', out('It types: SAME. It follows.', toPromise('genesect'))),
      ch('"Let\'s find it."', out('It follows. Sometimes it stops on a cliff and looks at the sea.', flag('genesect-find'), toPromise('genesect'))),
    ]),
  promiseRoom('genesect', 'The screen: THEY CHANGED ME. NO ONE ASKED. DO NOT CHANGE THEM.', 'Genesect folds its cannon down and walks beside you.', '#8040a0'),
];

// ---------------------------------------------------------------- MY16. Diancie: One Pure Note
const my16: Json[] = [
  ev('co-my16-wall', 'One Pure Note', G, {
    rarity: 'rare', types: ['rock', 'fairy'], requires: visitable('diancie'), pokemon: 'diancie', tint: '#f0a0c0',
    remembers: [{ id: 'carbink', when: [{ kind: 'partySpecies', species: 'carbink' }], notice: 'Your Carbink bow to the stone. The voice inside goes very quiet, and very embarrassed.', addChoices: [] }],
  },
    'A cave wall full of grey stone. One pink glint pulses with your heartbeat.\n\nA tiny voice, from inside the stone: "Oh! Someone. Hello. I\'m stuck. I made a diamond too big and it closed around me. One pure note would crack it. Not a loud one. A true one."',
    [
      ch('"Sing."', out('Which note?', room('co-my16-note'))),
      ch('"Strike the crystal."', out('It cracks wrong. Diancie tumbles out, free but chipped, and backs away from you.', flag('diancie-chipped'), toPromise('diancie'))),
      ch('Ask a Pokémon to sing.', out('Your Pokémon sings one note, and the crystal splits like a seed. Diancie steps out, blinking.', flag('diancie-pokesang'), bondUp(1, { moveFlag: 'sound' }), toPromise('diancie')), { requires: [moveFlag('sound')] }),
    ]),
  ev('co-my16-note', 'One Pure Note: The Note', G, { ...R, pokemon: 'diancie', tint: '#f0a0c0' },
    'You take a breath.',
    [
      ch('High.', out('Diancie giggles. "Try again."', room('co-my16-note'))),
      ch('Low.', out('Diancie giggles. "Try again."', room('co-my16-note'))),
      ch('The one you hum when you are nervous.', out('The crystal rings, and splits, and she is free.', flag('diancie-sang'), toPromise('diancie'))),
    ]),
  promiseRoom('diancie', 'Diancie: "I\'m supposed to be a princess. I\'m not very good at it. Can I make you something? No. That\'s a trade. I want to give you something."\n\nDiancie: "Things given are worth more than things sold."', 'Diancie walks with you, pink light in her hands, very pleased with herself.', '#f0a0c0'),
];

// ---------------------------------------------------------------- MY17. Volcanion: The Steam Valley
const valley = 'Out of the steam, a red-and-brown Pokémon with a great ring on its back. It stands between you and a small cave full of hurt Pokémon.\n\nVolcanion: "Humans. What do you want? The last ones wanted my water. And then they wanted these."';
const volcanionChoices = (): Json[] => [
  ch('"Nothing."', out('Volcanion: "Then go." The steam closes over the path.', flag('volcanion-nothing'))),
  ch('"To help."', out('Volcanion: "Prove it." Two of the hurt ones need Berries; one needs carrying to a Center and back. It takes all stage, and Volcanion watches every step.', flag('volcanion-helped'), takeNode(1), toPromise('volcanion'))),
  ch('"Who hurt them?"', out('A poacher camp, one node away. Volcanion: "Go and look. Then come back and tell me what you\'ll do."', flag('volcanion-camp'), room('co-my17-camp'))),
];
const my17: Json[] = [
  ev('co-my17-valley', 'The Steam Valley', G, { rarity: 'rare', types: ['fire', 'water'], requires: visitable('volcanion'), pokemon: 'volcanion', tint: '#c06040', effect: 'fog' },
    `Steam drifts across the route toward you and stops, suspicious. Every rock is wet and hot.\n\n${valley}`, volcanionChoices()),
  ev('co-my17-again', 'The Steam Valley: Again', G, { callback: true, rarity: 'rare', requires: [flagIs('volcanion-nothing'), not('volcanion-helped'), not('volcanion-camp'), not('mythical-visited')], pokemon: 'volcanion', tint: '#c06040', effect: 'fog' },
    `The steam again, further on. It waits for you this time.\n\n${valley}`, volcanionChoices().slice(1)),
  ev('co-my17-camp', 'The Steam Valley: The Camp', G, { ...R, pokemon: 'volcanion', tint: '#804030' },
    'The poachers\' camp. Cages, stacked. Hurt Pokémon in most of them.',
    [
      ch('"Free them all."', fight('The poachers do not let them go quietly. Volcanion arrives on the last of them.', trainer('Poachers', { size: 3, types: ['dark', 'steel'], lv: 2, win: [flag('volcanion-freed'), toPromise('volcanion')], lose: [flag('volcanion-failed')], friendly: true }))),
      ch('"Report them."', out('The Ranger comes, a stage later. Volcanion watches from the steam. It respects it. It does not trust it.', flag('volcanion-reported'), toPromise('volcanion'))),
      ch('Go back and tell Volcanion.', out('Volcanion destroys the camp with a single blast of steam and fire. Then it turns to you. "Are you afraid of me?"', flag('volcanion-blast'), toPromise('volcanion'))),
    ]),
  promiseRoom('volcanion', 'Volcanion: "Don\'t start helping something and walk away halfway. That\'s worse than not starting."', 'Volcanion walks with you, a long way off, steam rising from its ring.', '#c06040'),
];

// ---------------------------------------------------------------- MY18. Magearna: The Heart in the Box
const my18: Json[] = [
  ev('co-my18-hall', 'The Heart in the Box', G, {
    rarity: 'rare', requires: visitable('magearna'), pokemon: 'magearna', tint: '#c0a060',
    remembers: [{ id: 'read', when: [flagIs('magearna-read')], notice: 'The middle door glows faintly.', addChoices: [] }],
  },
    'A castle hall full of clocks, all stopped. On a pedestal, a heart-shaped box, ticking. Three tiny doors, one gear.\n\nA note in the dust, in a careful hand: SHE WAS MADE 500 YEARS AGO. SHE WAKES FOR SOMEONE WHO KNOWS WHAT SHE IS FOR.',
    [
      ch('The left door.', out('A tiny wind-up toy marches out and falls over. The box laughs: a ticking giggle.', room('co-my18-hall'))),
      ch('The middle door.', out('The gear turns. Every clock in the hall starts at once. Magearna unfolds from the box.', flag('magearna-woke'), toPromise('magearna'))),
      ch('The right door.', out('A tiny wind-up bird whistles at you. The box giggles, ticking.', room('co-my18-hall'))),
      ch('Read the rest of the note.', out('SHE IS FOR GIVING. SHE WAS A GIFT.', flag('magearna-read'), room('co-my18-hall'))),
    ]),
  promiseRoom('magearna', 'Magearna curtseys. It holds out a bouquet of metal flowers.\nMagearna, in chimes: "Carry this. To someone. You will know who."', 'One of your Pokémon takes the bouquet, carefully. Magearna chimes, and follows.', '#c0a060'),
];

// ---------------------------------------------------------------- MY19. Zeraora: Lightning on the Ground (three stages)
const my19: Json[] = [
  ev('co-my19-bolt-1', 'Lightning on the Ground', G, { rarity: 'rare', requires: visitable('zeraora'), pokemon: 'zeraora', tint: '#e0c040', effect: 'rain' },
    'Lightning crosses the ground, not the sky. It zigzags between the trees, stops a few steps from you, and is gone.',
    [ch('Watch where it went.', out('Scorched grass, in a line, going on ahead of you.', flag('zeraora-bolts')))]),
  ev('co-my19-bolt-2', 'Lightning on the Ground: Again', G, { callback: true, rarity: 'rare', requires: [flagIs('zeraora-bolts', 1, 1), not('mythical-visited')], pokemon: 'zeraora', tint: '#e0c040', effect: 'rain' },
    'The lightning again, closer. It circles your party once, crackling, and leaves.',
    [ch('Stand still.', out('Your hair stands up. Something is checking you.', flag('zeraora-bolts')))]),
  ev('co-my19-cat', 'Lightning on the Ground: Zeraora', G, { callback: true, rarity: 'rare', requires: [flagIs('zeraora-bolts', 2, 2), not('mythical-visited')], pokemon: 'zeraora', tint: '#e0c040', effect: 'rain' },
    'Lightning stops at your feet. A lean yellow-and-black cat stands where it stopped, crackling.\n\nZeraora: "Some time ago. A wild one, cornered. You took its side against a trainer. Why?"\n\nIt does not blink. It is checking.',
    [
      ch('"It was right."', fight('Zeraora: "Most say that and don\'t mean it." It tests you: a battle, no items.', duel('zeraora', [flag('zeraora-tested'), toPromise('zeraora')], [flag('zeraora-failed')]))),
      ch('"I don\'t know."', out('Zeraora: "That\'s honest." It sits.', flag('zeraora-honest'), toPromise('zeraora'))),
      ch('"I didn\'t. You\'ve got the wrong person."', out('Zeraora looks at you a long time. Then it is lightning again, and gone.', flag('zeraora-left'))),
    ]),
  promiseRoom('zeraora', 'Zeraora: "I was caged once. The team you have is the team. Make it enough."', 'Zeraora runs ahead of you, and back, and ahead, like weather.', '#e0c040'),
];

// ---------------------------------------------------------------- MY20. Meltan: The Hinge-Eater
const my20: Json[] = [
  ev('co-my20-camp', 'The Hinge-Eater', G, { rarity: 'rare', requires: visitable('meltan'), pokemon: 'meltan', tint: '#a0a0a0' },
    'The campfire. A clink. A tiny bolt-shaped Pokémon with a nut for a head is gnawing the hinge of your bag. It stops. It looks at you. It keeps gnawing. A second one pokes out of the firewood.\n\nA tinkerer, from the next tent: "Oh no. Once there\'s two, there\'s always more."',
    [
      ch('"Feed it."', out('You hold out something metal. It eats it, glows, and sits on your boot.', lose(), flag('meltan-fed'), toPromise('meltan'))),
      ch('"Shoo it."', out('It goes. So does the bag hinge. Something falls out of the bag and is lost in the dark.', lose(), flag('meltan-shooed'))),
      ch('Ask the tinkerer.', out('Tinkerer: "They eat metal. Give them one thing and they\'ll love you. Give them eight things and... well. You\'ll see."', flag('meltan-warned'), room('co-my20-camp'))),
    ]),
  ev('co-my20-back', 'The Hinge-Eater: Back', G, { callback: true, rarity: 'rare', requires: [flagIs('meltan-shooed'), not('mythical-visited')], pokemon: 'meltan', tint: '#a0a0a0' },
    'Meltan is back, with three friends, and something of yours it is very proud of having found.',
    [
      ch('"Fine. Feed it."', out('It gives back what it found, and eats something else instead, glowing.', $(200), flag('meltan-fed'), toPromise('meltan'))),
      ch('Shoo them all.', leave('Four Meltan go off into the dark, offended.')),
    ]),
  promiseRoom('meltan', 'Meltan sits on your boot and looks at your bag, meaningfully.', 'Meltan rides on your bag, nibbling the buckle.', '#a0a0a0'),
];

// ---------------------------------------------------------------- MY21. Melmetal: More (Melmetal's Promise is disabled: Meltan stays the Guest)
const my21: Json[] = [
  ev('co-my21-stack', 'More', G, { callback: true, rarity: 'rare', requires: [flagIs('guest-meltan'), flagIs('meltan-fed')], pokemon: 'melmetal', tint: '#808090' },
    'Eight Meltan stack on top of each other in the camp, wobble, and become one huge metal Pokémon with arms like hammers.\n\nMelmetal, in a clanking voice: "More." It holds out a hand. Your bag rattles.\n\nThe tinkerer: "It wants to make things. Not eat them. Give it something good and see what happens."',
    [
      ch('"Here."', out('It hammers what you give it into something better, and hands it back, still warm. The next reward you find is finer for it.', lose(), better(1), flag('melmetal-forged'), moment('Eight Meltan became Melmetal at your campfire, and it forged you something.'))),
      ch('"That\'s enough."', out('Melmetal: "...Hm." It sits. It waits for you to change your mind. By morning it is eight Meltan again, asleep in a pile.', flag('melmetal-refused'))),
      ch('"What will you make?"', out('Melmetal: "Things to give away. Made things go out. Not in." Then it comes apart into eight Meltan, satisfied, and they follow you.', flag('melmetal-asked'), fr(1))),
    ]),
];

// ---------------------------------------------------------------- MY22. Zarude: The Fruit Test
const my22: Json[] = [
  ev('co-my22-vines', 'The Fruit Test', G, { rarity: 'rare', types: ['grass', 'bug'], requires: visitable('zarude'), pokemon: 'zarude', tint: '#406030' },
    'Vines swing overhead. A pack of dark apes drops fruit on the path and watches from the branches. One fruit lands at your feet.\n\nA Zarude, scarred, with a pink scarf, sits on a branch, arms folded. A small human child is tied in a hammock of vines behind it, asleep and safe.\n\nZarude, in growls: "The pack wants to see what you do with what\'s given."',
    [
      ch('Catch it.', out('The pack hoots. They think you are greedy, but quick. Zarude says nothing.', room('co-my22-child'))),
      ch('Throw it back.', out('The pack throws fruit at you for a full minute. Zarude laughs.', flag('zarude-threw'), room('co-my22-child'))),
      ch('Share it.', out('You split it with your Pokémon. The pack goes quiet. Zarude climbs down.', flag('zarude-shared'), fr(1), room('co-my22-child'))),
    ]),
  ev('co-my22-child', 'The Fruit Test: The Child', G, { ...R, pokemon: 'zarude', tint: '#406030' },
    'A wanderer\'s child it found and raises. It is not stolen; nobody has come looking.\n\nZarude: "The pack says I should leave it. I won\'t. Would you?"',
    [
      ch('"Never."', out('Zarude nods.', toPromise('zarude'))),
      ch('"Find their family."', out('A sign in a town, a year old: LOST, AGE 2. That night Zarude carries the child to the edge of town and watches from a tree until the door opens.', flag('zarude-family'), takeNode(1), toPromise('zarude'))),
      ch('"It\'s not my business."', out('Zarude: "Then go."', flag('zarude-refused'))),
    ]),
  promiseRoom('zarude', 'Zarude: "The small one. Whatever happens, the small one doesn\'t fall."', 'Zarude swings along the branches above you, and the pack follows a while.', '#406030'),
];

// ---------------------------------------------------------------- Z5. The Darkest Dream (Darkrai as Guest, its Promise kept two steps)
const z5: Json[] = [
  ev('co-z5-dream', 'The Darkest Dream', 'Story: Z Anomalies', {
    callback: true, rarity: 'rare', requires: [flagIs('guest-darkrai'), flagIs('promise-step-darkrai', 2), at('night')], pokemon: 'darkrai', tint: '#200020', effect: 'flicker',
    remembers: [{ id: 'cresselia', when: [flagIs('blessing-cresselia')], notice: 'Cresselia stands between you and the shadow. "Do it" is not something you can say tonight.', hide: [1] }],
  },
    'Night. Darkrai walks beside you, and its shadow does not match it.\n\nDarkrai, heard, not spoken: "There is a shape I could take. In it, the dreams I bring would not end. Not for anyone. You have kept faith with me. I ask you, not myself."',
    [
      ch('"Don\'t."', out('Darkrai thanks you. Its shadow is its own again. In the last battle of this run, it means to stand beside you.', flag('darkrai-refused-z'), fr(2), moment('Darkrai asked you whether to become something worse, and you said no.', 90))),
      ch('"Do it."', fight('The shadow rises. For one battle, Z-Mega Darkrai fights at your side. After it, the whole region sleeps badly.',
        trainer('The Endless Dream', { format: 'doubles', size: 2, types: ['dark', 'ghost'], lv: 2, ally: 'darkrai-z-mega', friendly: true, win: [flag('darkrai-z-won')], lose: [] }),
        flag('darkrai-became-z'),
        { kind: 'tempEffect', label: 'The whole region sleeps badly', effects: [{ kind: 'healingMultiplier', value: 0.75 }], until: 'region' })),
      ch('"Why ask me?"', out('Darkrai: "Because I would say yes."', room('co-z5-dream'))),
    ]),
];

export const EVENTS: Json[] = [...my13, ...my14, ...my15, ...my16, ...my17, ...my18, ...my19, ...my20, ...my21, ...my22, ...z5];
export const REMOVE: string[] = [];
