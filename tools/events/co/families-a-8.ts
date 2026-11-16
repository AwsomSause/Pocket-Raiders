// Catalog Overhaul Pack: STORY_FAMILIES_4.md, part three. SF27 The Disciple, SF28 The Readings, SF29 The Bell in the Fog,
// SF30 The Storm-Grey Coat. Build: npm run co:build -- families-a-8. Run memory is same-run only (Kice 2026-11-14).
import { br, ch, fight, flag, flagAt, fr, heal, isGood, join, lose, lv, out, reveal, room, takeNode, trainer, wild, anyType, type Json } from '../dsl.ts';
import { is, later, moment, not, safe, sub, v, withRooms } from './_fa.ts';

export const CATEGORY = 'families-a';
/** The spirit guide is the fog guide (see _fa-retired.json). */
export const REMOVE = ['mr-spirit-guide'];

const soon = (eventId: string, nodes: number): Json => ({ kind: 'laterEvent', eventId, nodes });
const again = (eventId: string): Json => ({ kind: 'seeAgain', eventId });
const inRegion = (...ids: string[]): Json => ({ kind: 'region', ids });

// =====================================================================================================================
// SF27. THE DISCIPLE. Three tests across the region, then the Tower Choice. Each tower is two rooms (three floors, then two).
// =====================================================================================================================
const TEST = flag('kubfu-tests');
const TRIED = flag('kubfu-tried');
const tower = (side: 'dark' | 'water'): Json[] => {
  const type = side === 'dark' ? 'dark' : 'water';
  const name = side === 'dark' ? 'The Tower of Darkness' : 'The Tower of Waters';
  const urshifu = side === 'dark' ? 'urshifu' : 'urshifu-rapid-strike';
  return [
    sub('galar-kubfu-disciple', `kubfu-${side}-1`, `${name}: The First Floors`, side === 'dark'
      ? 'The Tower of Darkness. Inside, it is quiet as a held breath, and every floor is one opponent waiting in the dark for the one blow that ends it. Kubfu goes up the first step with its fists closed.'
      : 'The Tower of Waters. Water runs down every wall and across every floor, and never stops. Every opponent here is patient. Kubfu goes up the first step, and the water runs over its feet, and it keeps going.', [
      ch('Climb.', fight('Three floors, one after another.', safe(trainer('Tower Disciples', { cls: 'ace-trainer', size: 2, types: [type], lv: 1, chain: 3, win: [room(`kubfu-${side}-2`)] }), again('galar-kubfu-tower')))),
    ]),
    sub('galar-kubfu-disciple', `kubfu-${side}-2`, `${name}: The Top`, 'Two floors left. Kubfu is breathing hard. It looks up at you, and then up the stairs, and goes on without waiting to be told.', [
      ch('Climb to the top.', fight('The last two floors.', safe(trainer('Tower Masters', { cls: 'ace-trainer', size: 3, types: [type], lv: 2, chain: 2, win: [join({ species: [urshifu] }), flag(`kubfu-${side}`), flag('kubfu-done'), moment(side === 'dark' ? 'Kubfu climbed the Tower of Darkness and came down as Urshifu, one strike and done' : 'Kubfu climbed the Tower of Waters and came down as Urshifu, a river that keeps coming', 85)] }), again('galar-kubfu-tower')))),
    ]),
  ];
};

const DISCIPLE: Json[] = [
  {
    id: 'galar-kubfu-disciple',
    intro: 'An old martial-arts master sits cross-legged by the road, very straight, very still. Next to him, a small bear cub in exactly the same pose, trying very hard and wobbling. Master Hiro: "This is Kubfu. It doesn\'t follow strength. It follows sincerity." The cub opens one eye and looks at you. Hiro: "It\'s been watching you since the last town. If you want it, show it three things." He counts them on his fingers. "Keep a promise. Refuse an easy win. Train with a Pokémon you never use."',
    choices: [
      ch('I\'ll try.', out('Hiro nods. Kubfu closes its eye again, but you notice it follows you down the road, a long way back.', flag('kubfu-on'), soon('kubfu-test-promise', 2))),
      ch('Why me?', out('Hiro: "It didn\'t say." He shrugs. "It doesn\'t say much." Kubfu is already following you.', flag('kubfu-on'), soon('kubfu-test-promise', 2))),
      ch('I\'m not that kind of trainer.', out('Hiro: "That\'s sincere, at least." He almost smiles. Kubfu gets up and follows you anyway, at a distance, scowling, as if it is going to prove you wrong.', flag('kubfu-on'), flag('kubfu-doubted'), soon('kubfu-test-promise', 2))),
    ],
  },
  sub('galar-kubfu-disciple', 'kubfu-test-promise', 'A Promise', 'A small boy at a crossroads with a Wooloo on a string, crying. He has lost his way home. You tell him you will walk him there, if he waits here while you clear the road. Kubfu, at the edge of the trees, is watching.', [
    ch('Come back for him.', out('You clear the road, and you come back, though it is out of your way, and he is still there, and you walk him home. Kubfu has come a little closer.', TEST, flag('kubfu-test-1'), soon('kubfu-test-refuse', 2), TRIED)),
    ch('Send someone else.', out('You flag down a passing ranger to take him. It is sensible. Kubfu turns its back.', soon('kubfu-test-refuse', 2), TRIED)),
  ], { callback: true, requires: [is('kubfu-on'), not('kubfu-test-1')] }),
  sub('galar-kubfu-disciple', 'kubfu-test-refuse', 'An Easy Win', 'A trainer\'s Pokémon slips on a wet stone at the start of your match, and turns its ankle, and the trainer looks at you, white. Trainer: "You can take the win. It\'s fair. It\'s the rules." Kubfu is sitting on a fence post, watching.', [
    ch('Refuse it. We\'ll play when it\'s healed.', out('You shake your head. You sit with them while their Pokémon is strapped up, and you play the match the next morning, properly. Kubfu jumps down off the fence post.', TEST, flag('kubfu-test-2'), soon('kubfu-test-train', 2), TRIED)),
    ch('Take the win.', out('You take it. It is fair. It is the rules. Kubfu stays on its fence post.', soon('kubfu-test-train', 2), TRIED)),
  ], { callback: true, requires: [is('kubfu-on'), not('kubfu-test-2')] }),
  sub('galar-kubfu-disciple', 'kubfu-test-train', 'The One You Never Use', 'A training ground by a river. Kubfu sits on the bank and looks, very pointedly, at the Pokémon of yours that never gets to lead.', [
    ch('Train with it all day.', out('You put it at the front, and you train with it all day, through three practice battles and a lot of falling over. By the end it is standing differently. Kubfu walks over and sits down next to you.', TEST, flag('kubfu-test-3'), lv(1, 'weakest'), TRIED)),
    ch('Not today.', out('Not today. Kubfu looks at the one you never use, and then at you, and sighs like an old man.', TRIED)),
  ], { callback: true, requires: [is('kubfu-on'), not('kubfu-test-3')] }),
  {
    id: 'galar-kubfu-tower', room: false, callback: true, requires: [is('kubfu-on'), is('kubfu-tests', 3), not('kubfu-done')],
    intro: 'Two towers above the mist, one black as a closed eye, one with water pouring down every side of it like a waterfall standing up. Hiro stands between them. He will not choose. Hiro: "Kubfu learns from the tower it climbs. Dark teaches it to strike once and end it. Water teaches it to keep coming." He looks at you. "It\'ll climb the one you walk to. Don\'t think about what\'s stronger. Think about what you are."',
    choices: [
      ch('The Tower of Darkness.', out('You walk to the dark tower. Kubfu runs ahead of you to the door.', room('kubfu-dark-1'))),
      ch('The Tower of Waters.', out('You walk to the water tower. Kubfu runs ahead of you to the door.', room('kubfu-water-1'))),
      ch('Let Kubfu pick.', out('You stand still. Kubfu looks at you for a long time, as if it is reading everything you have done this run. Then it turns to the dark tower: you have been decisive, and it has noticed.', flag('kubfu-chose'), room('kubfu-dark-1')), { branches: [br([isGood(1)], 'You stand still. Kubfu looks at you for a long time, as if it is reading everything you have done this run. Then it turns to the tower of waters: you have been kind, again and again, and it has noticed.', flag('kubfu-chose'), room('kubfu-water-1'))] }),
    ],
    remembers: [
      v('doubted', [is('kubfu-doubted')], { notice: 'Hiro laughs, suddenly, a big surprised laugh. Hiro: "Not that kind of trainer." He shakes his head. "Look at you."' }),
    ],
  },
  ...tower('dark'),
  ...tower('water'),
];
// Fewer than three tests: the towers wait for the next region.
DISCIPLE.push(sub('galar-kubfu-disciple', 'kubfu-not-yet', 'Not Yet', 'The two towers, above the mist. Kubfu walks to the foot of them, and stops, and sits down, and will not climb. Hiro puts a hand on its head. Hiro: "Not yet. Come back."', [
  ch('We\'ll come back.', out('The towers will be there next region. So will Kubfu, watching you on the road for the tests you missed.', flag('kubfu-wait'), soon('kubfu-test-promise', 3), soon('kubfu-test-refuse', 5), soon('kubfu-test-train', 7))),
], { callback: true, requires: [is('kubfu-on'), is('kubfu-tried', 3), { kind: 'flag', key: 'kubfu-tests', atLeast: 0, atMost: 2 }, not('kubfu-done'), not('kubfu-wait')] }));

// =====================================================================================================================
// SF28. THE READINGS. Three measurement stops; the vent is capped, or a Power Spot erupts next region.
// =====================================================================================================================
const READINGS: Json[] = [
  {
    id: 'galar-dynamax-investigator',
    intro: 'A field of long grass, and a researcher crouched in the middle of it over a humming meter, frowning at the needle. Dr. Sonnet: "The Dynamax energy here is climbing and I can\'t explain why." She looks up at you over her glasses. "Do you have a minute?" She thinks. "Three, really. Three places."',
    choices: [
      ch('Help.', out('Sonnet hands you the spare probe and a pencil. Sonnet: "First place is a well. Come on."', flag('readings-on'), soon('readings-well', 1))),
      ch('What\'s Dynamax energy?', out('Sonnet: "What makes Pokémon giant." She taps the ground with the probe. "It comes from underground. From something asleep." Then she hands you the spare probe.', flag('readings-on'), flag('readings-asked'), soon('readings-well', 1))),
      ch('No time.', out('Sonnet nods, already looking at the meter again. You walk on. Behind you the needle climbs.', flag('readings-skipped'), flagAt('readings-erupts'))),
    ],
  },
  sub('galar-dynamax-investigator', 'readings-well', 'A Well', 'An old stone well. Sonnet\'s meter spins the moment she holds it over the edge. Down in the dark water, a wild Pokémon looks up at you, and it is twice the size it should be.', [
    ch('Calm it.', out('You lower a bucket of berries and talk to it, softly, for a long time. Slowly it shrinks back to itself, and blinks up at you, puzzled.', lose('oran-berry'), fr(3, 'party'), soon('readings-stone', 1)), { requires: [{ kind: 'item', id: 'oran-berry' }] }),
    ch('Battle it.', fight('It comes up out of the well like a wave.', wild({ types: ['water'], lv: 3 }), soon('readings-stone', 1))),
    ch('Just measure.', out('Sonnet writes down the number. She writes it again, as if it might change.', soon('readings-stone', 1))),
  ], { callback: true, requires: [is('readings-on'), not('readings-capped'), not('readings-erupts'), not('readings-done')] }),
  sub('galar-dynamax-investigator', 'readings-stone', 'A Stone Circle', 'A ring of standing stones on a hill. Red light is seeping up through the cracks between them, slow as blood. Sonnet\'s meter is screaming. Sonnet: "This is the vent."', [
    ch('Cap it now.', out('Your Rock- or Steel-type puts itself across the widest crack and holds there while you heap stones on the rest. The red light goes out, one crack at a time. The meter falls silent.', flag('readings-capped'), soon('readings-hill', 1)), { requires: [anyType('rock', 'steel')] }),
    ch('Measure and go.', out('You measure, and go. Behind you the red light keeps seeping.', flagAt('readings-erupts'), soon('readings-hill', 1))),
  ], { callback: true, requires: [is('readings-on'), not('readings-capped'), not('readings-erupts')] }),
  sub('galar-dynamax-investigator', 'readings-hill', 'A Hill', 'The top of a hill, the last reading. Sonnet sets up the meter. And for one second, the whole sky goes red. Everyone in the valley below stops and looks up. Then it is blue again. Sonnet is very quiet. Sonnet: "...That\'s not from here." She looks at the ground. "That\'s from under everything."', [
    ch('What\'s under everything?', out('Sonnet: "Something that fell a long time ago." She packs up the meter and then, after a moment, holds it out to you. Sonnet: "Keep it. It\'ll show you where the energy pools."', flag('readings-done'), flag('sign-eternatus'), reveal()), { branches: [br([is('blessing-eternatus')], 'Sonnet: "Something that fell a long time ago." The red stays behind your eyes for a long time; whatever is under everything, it looked at you. Sonnet gives you her meter.', flag('readings-done'), flag('sign-eternatus', 2), reveal())] }),
    ch('Record it.', out('You write it down: the time, the colour, the second it lasted. Sonnet signs it under you. Then she gives you her meter. Sonnet: "You\'ll want it."', flag('readings-done'), reveal())),
  ], { callback: true, requires: [is('readings-on'), not('readings-done')] }),
  sub('galar-dynamax-investigator', 'readings-erupt', 'The Power Spot', 'The ground splits on the road ahead with a sound like a door slamming in the earth, and red light pours up out of it, and something comes up with the light: a wild Pokémon, enormous, furious, Dynamax energy crackling off it in sheets.', [
    ch('Stand your ground.', fight('It is huge, and it does not want to be.', wild({ lv: 4 }), flag('readings-erupted'))),
    ch('Go round. (a node)', out('You go the long way round, a node of it, and leave it roaring at the sky.', takeNode(1), flag('readings-erupted'))),
  ], { callback: true, requires: [is('readings-erupts'), later('readings-erupts', { regions: 1 }), not('readings-erupted'), not('readings-capped')] }),
];

// =====================================================================================================================
// SF29. THE BELL IN THE FOG. The guide knows the ground because they died on it.
// =====================================================================================================================
const FOG: Json[] = [
  {
    id: 'r137-ghostly-fog-bank',
    intro: 'A fog bank rolls over the road, white and heavy, and swallows it. Shapes drift in it, at the edge of seeing: people, maybe, or Pokémon, or neither. They seem to want something. Your Ghost-types, if you have any, have gone very still. Then, somewhere ahead, a bell. Once.',
    choices: [
      ch('Follow the bell.', out('You walk toward the sound.', flag('fog-on'), room('fog-guide'))),
      ch('Wait for the fog to lift. (a node)', out('You wait. It takes a node. The fog lifts at last, all at once, and the road is empty. Far off, the bell rings once more, as if disappointed.', takeNode(1))),
      ch('Call out.', out('You call out. The bell answers: twice. Then a light comes toward you through the white.', flag('fog-on'), flag('fog-called'), room('fog-guide'))),
    ],
  },
  {
    id: 'fog-guide',
    intro: 'A lantern bobs toward you through the fog, and under it a guide steps out: an old coat, a walking stick, a brass bell on their belt. Guide: "I know this ground." Their voice is calm and kind. "Keep to my left. There\'s a drop on the right you won\'t see until you\'re in it." They turn and walk on, and you notice their boots do not make a sound.',
    choices: [
      ch('Follow.', out('You follow. Three fog-bound stretches of road, and not one hazard, not one wrong step. The guide never looks back to check on you, and never needs to.', flag('fog-followed'), heal(0.25), soon('rescue-team', 1))),
      ch('Who are you?', out('Guide: "Ask me at the end." They walk on.', flag('fog-asked'), soon('rescue-team', 1))),
      ch('Off the path?', out('The guide stops. For a long moment they do not say anything. Guide: "There\'s something there I\'d like found."', flag('fog-cache'), room('mr-spirit-cache'))),
    ],
    remembers: [
      v('crestline', [is('shift-rested')], { notice: 'The bell on their belt catches the lantern light. Stamped on its rim: CRESTLINE.' }),
    ],
  },
  {
    id: 'rescue-team', callback: true, requires: [is('fog-on'), not('fog-rescue-seen')],
    intro: 'In the fog, ropes and voices: a Rescue Team, three people roped together and an Arcanine with its nose to the ground. Their leader pushes her hood back. Moss: "A hiker\'s lost in this. Two days." She is hoarse from calling. "We can\'t find the path." Beside you, the guide says nothing at all. Moss does not seem to see them.',
    choices: [
      ch('Ask the guide.', out('You look at the guide. The guide points, without a word, down into the white. You go where they point, and in a hollow under a rock there is the hiker, alive, so cold she cannot speak, and Moss\'s team gets her out.', flag('fog-rescue-seen'), flag('fog-hiker'), soon('fog-end', 1))),
      ch('Search with the team. (two nodes)', out('You search with them, two nodes of shouting into the fog. You find her, in the end. She is worse than she would have been.', takeNode(2), flag('fog-rescue-seen'), flag('fog-hiker-late'), soon('fog-end', 1))),
      ch('Go on.', out('You go on. Behind you, the team keeps calling a name into the fog.', flag('fog-rescue-seen'), soon('fog-end', 1))),
    ],
  },
  {
    id: 'mr-spirit-cache',
    intro: 'Off the path, where the fog is thickest. A flat stone. The guide stands back and lets you lift it. Under it, wrapped in oilcloth gone soft with age: a letter, sealed, never sent, and a child\'s drawing of two people and a Growlithe. Guide: "That\'s mine." Very quietly. "I was taking it home."',
    choices: [
      ch('I\'ll deliver it.', out('You put it inside your coat, against your chest. The guide does not say thank you. They do not have to.', flag('fog-delivering'), flagAt('fog-delivering'), soon('rescue-team', 1))),
      ch('Read it.', out('You open it, carefully. One line, in a big untidy hand: "Home Thursday. Tell the dog."', flag('fog-read'), soon('rescue-team', 1))),
      ch('Put it back.', out('You wrap it up again and lay the stone back over it. The guide nods.', soon('rescue-team', 1))),
    ],
  },
  sub('r137-ghostly-fog-bank', 'fog-end', 'At the End', 'The fog thins. The road comes back, a field, a stile, ordinary light. The guide stops at the edge of the road, where the white ends. Guide: "This is where I stop."', [
    ch('Who are you?', out('The guide points with their stick to a grave at the roadside, half under the hedge. The stone says: HALDEN VEY, GUIDE. LOST IN THE FOG, BRINGING THE OTHERS HOME. Halden unhooks the bell from their belt and puts it in your hand. It is cold, and then warm. When you look up, there is nobody there.', flag('fog-named'), flag('halden-bell'), moment('Halden Vey gave you their bell at the edge of the fog', 80))),
    ch('Thank you.', out('Halden tips the lantern to you, and turns, and walks back into the fog. Later, where the road comes out, there is a bench nobody remembers putting there, and you rest on it, and it is the best rest of the region.', flag('fog-thanked'), heal(1))),
    ch('Come with me.', out('Halden: "Someone has to be here." They unhook the bell from their belt and give it to you anyway, and close your fingers over it. Then they walk back into the fog to wait for the next one.', flag('fog-named'), flag('halden-bell'), moment('Halden Vey stayed in the fog, and gave you their bell', 80))),
  ], {
    callback: true, requires: [is('fog-on'), not('fog-named'), not('fog-thanked')],
    remembers: [v('called', [is('fog-called')], { notice: 'You called out to them, the first time, and they rang twice. You think the bell will always ring twice for you.' })],
  }),
  sub('mr-spirit-cache', 'fog-letter', 'Home Thursday', 'A village in a new region, and a cottage at the end of a lane, and an old woman on the step shelling peas. You give her the letter. She reads it. She reads it again. Then she puts her hand over her mouth. Old woman: "It\'s from my brother." Her voice is very small. "He was coming home. Thursday. We waited at the window all day." She holds the drawing against her chest. "That\'s me. And him. And the dog."', [
    ch('He was bringing others home.', out('You tell her about the fog, and the guide, and the bell. She listens to every word. When you go, she is still on the step, holding the letter, looking at the road.', flag('fog-delivered'), moment('You brought Halden Vey\'s letter home, sixty years late', 85))),
  ], { callback: true, requires: [is('fog-delivering'), later('fog-delivering', { regions: 1 }), not('fog-delivered')] }),
];

// =====================================================================================================================
// SF30. THE STORM-GREY COAT. The grand-enemy hunt (three clues, then the lair) is a caged Legendary bird. The bird is set by
// region: Articuno (Sinnoh, Kalos, Galar, Grand, Tidewrack Reaches), Zapdos (Kanto, Unova, Paldea, Torren, Frontier Isles,
// Orrery Basin), Moltres elsewhere.
// =====================================================================================================================
const ARTICUNO = inRegion('sinnoh', 'kalos', 'galar', 'grand', 'tidewrack-reaches');
const ZAPDOS = inRegion('kanto', 'unova', 'paldea', 'torren', 'frontier-isles', 'orrery-basin');
const CLUE: Json = { kind: 'hunt' };
const FINISH: Json = { kind: 'hunt', finish: true };
const birdChoices = (bird: string, Name: string): Json[] => [
  ch('Go.', out(`${Name} spreads its wings, all the way, for the first time in years. It looks at you. Then it goes up, and up, until it is a point of light and then nothing, and the whole sky feels bigger.`, flag(`sign-${bird}`, 2), flag('coat-free'), FINISH, moment(`You opened the cage and ${Name} flew`, 85))),
  ch('Come with me.', fight(`${Name} looks at you for a long time. Then it comes down, and you understand: it will come with you if you are strong enough to ask.`, wild({ species: [bird], lv: 3 }), flag('coat-caught-chance'), FINISH)),
  ch('Look at him, too.', out(`${Name} turns its head toward Aurel. It lands beside him, and he flinches, and it touches his face with the edge of its wing, once, very gently. Then it flies. Aurel stands there a long time with his hand on his cheek. He gives you his coat. He says he will not need it where he is going. He means a ranger station.`, flag(`sign-${bird}`, 2), flag('coat-forgiven'), FINISH, moment(`${Name} forgave the man who kept it, and so did you`, 90))),
];

const COAT: Json[] = [
  {
    id: 'hunt-clue-feather',
    intro: 'A single feather lies in the road, as long as your arm. It is warm to the touch, and the air around it shimmers. It hums. Every Pokémon you own turns to look at it. Around the quill, a metal band. A ring, like the ones they put on birds in cages.',
    choices: [
      ch('Keep it.', out('You wrap it in a cloth and put it in your pack. It keeps humming, softly, like something asleep.', CLUE, flag('coat-clue-feather'))),
      ch('Follow where it points.', out('You hold it flat on your palm. It turns, slowly, like a compass needle, and points north.', CLUE, flag('coat-clue-feather'))),
      ch('Leave it.', out('You leave it in the road. It stops humming as you walk away.')),
    ],
    remembers: [
      v('articuno', [ARTICUNO], { intro: 'A single feather lies in the road, as long as your arm, and it is frosted: the puddle it lies in has frozen solid around it. It hums. Every Pokémon you own turns to look at it. Around the quill, a metal band. A ring, like the ones they put on birds in cages.' }),
      v('zapdos', [ZAPDOS], { intro: 'A single feather lies in the road, as long as your arm, crackling: the hair on your arms stands up as you bend to it. It hums. Every Pokémon you own turns to look at it. Around the quill, a metal band. A ring, like the ones they put on birds in cages.' }),
    ],
  },
  {
    id: 'hunt-clue-scorch',
    intro: 'A ring in a field as wide as a house, burned, or frozen, or blasted, the grass gone strange in a perfect circle. Something very large landed here. Around the edge, chain marks in the mud. A farmer leans on his gate, watching you look. Farmer: "Tuesday. A ship came down out of the clouds." He spits. "A ship. Then it left."',
    choices: [
      ch('Measure it.', out('You pace it out. It is a wingspan. Something\'s wingspan, held open, held down.', CLUE, flag('coat-clue-scorch'))),
      ch('Follow the chain marks.', out('You follow them round to where one link has snapped and been left in the mud. You pick it up. Stamped into it: a crest, a grey storm cloud.', CLUE, flag('coat-clue-scorch'), flag('coat-crest'))),
      ch('Ask about the ship.', out('Farmer: "Grey," he says. "With a cloud on it." He looks at the ring in his field. "And something crying inside."', CLUE, flag('coat-clue-scorch'))),
    ],
  },
  {
    id: 'hunt-clue-witness',
    intro: 'A ranger sitting on a stump with a blanket round her shoulders and a cold cup of tea in her hands, her Staraptor asleep at her feet with its head under its wing. Ranger Cleo: "It was in the clouds. It looked at me." She turns the cup. "It wasn\'t afraid of me. It was afraid of the man on the deck. Long grey coat. He waved, like he knew me." She looks at her Staraptor. "I followed them three days. Then it wouldn\'t fly any further."',
    choices: [
      ch('Where did they go?', out('Cleo: "The old weather station." She points at a peak. "Up there."', CLUE, flag('coat-clue-witness'))),
      ch('Are you hurt?', out('Cleo: "No." She looks down. "Ashamed." Then she points at the peak. "The old weather station. Up there."', CLUE, flag('coat-clue-witness'))),
      ch('Come with me.', out('Cleo looks at you. Then she puts the cup down and stands up and folds the blanket, very neatly. Her Staraptor wakes up. Cleo: "Yes."', CLUE, flag('coat-clue-witness'), flag('coat-cleo'))),
    ],
  },
  {
    id: 'hunt-lair',
    intro: 'The old weather station on the peak, its dome cracked, its instruments still turning in the wind. A grey airship moored to the mast, a storm cloud painted on its side. A figure in a long storm-grey coat steps down the gangway and bows. The Collector, Aurel: "You\'ve been looking for us." He straightens. "Then show us what you know." He gestures behind him. "I don\'t hurt it. I keep it. I\'m the last person in the world who keeps one. Do you know how many people would hurt it if I didn\'t?" Behind him, in a cage of steel and glass, the bird. It sees you. It does not make a sound.',
    choices: [
      ch('Open the cage.', fight('His three bodyguards come down the gangway: a Corviknight, a Skarmory, an Aerodactyl.', safe(trainer('Aurel\'s Bodyguards', { cls: 'ace-trainer', team: ['corviknight', 'skarmory', 'aerodactyl'], size: 1, lv: 2, chain: 3, win: [flag('coat-opened'), room('hunt-bird')] })))),
      ch('Battle you for it.', fight('Aurel takes off his coat and folds it over the rail. Six Pokémon, each one for a different weather.', safe(trainer('Aurel', { cls: 'veteran', size: 6, lv: 3, win: [flag('coat-beat-aurel'), room('hunt-bird')] })))),
      ch('Why do you keep it?', out('Aurel: "My father caught it." He looks at the cage. "He died. It was the only thing he loved." His voice does not change, but his hands do. "If I let it go, I have nothing of him."', flag('coat-asked'), room('hunt-why'))),
    ],
    remembers: [
      v('crest', [is('coat-crest')], { notice: 'You know that crest on his coat: a grey storm cloud. You found it stamped on a broken chain. You know which way the guards will look, and which way they won\'t.', hide: [0], add: [ch('Open the cage, quietly.', out('While Aurel talks, you go round the back, the way the chain marks went, and nobody is watching it. The cage door is heavy. You open it.', flag('coat-opened'), room('hunt-bird')))] }),
      v('cleo', [is('coat-cleo')], { notice: 'Cleo steps up beside you, and her Staraptor lands on the rail with a crack of wings.', hide: [0], add: [ch('Open the cage.', out('The bodyguards come down the gangway. Cleo: "Go. I\'ve got these." She does. You open the cage.', flag('coat-opened'), room('hunt-bird')))] }),
    ],
  },
  sub('hunt-lair', 'hunt-why', 'Why He Keeps It', 'Aurel stands with his back to the cage. The wind is very loud.', [
    ch('Then let it be the thing you remember him by. Free.', out('Aurel looks at the cage a long time. Then he walks to it, and opens it, and stands aside. He is crying, and he does not wipe his face.', flag('coat-aurel-freed'), room('hunt-bird'))),
    ch('Your father\'s dead. It isn\'t.', fight('Aurel goes white, then red. He fights you with everything he has. When it is over, he opens the cage himself, without a word.', safe(trainer('Aurel', { cls: 'veteran', size: 6, lv: 3, win: [room('hunt-bird')] }), room('hunt-bird')))),
    ch('Keep it, then.', out('He nods, slowly. He goes back up the gangway, and the airship slips its mooring, and drifts off into the cloud. You could find it again, later, if you came back to open the cage.', flag('coat-kept'), again('hunt-lair'))),
  ]),
  sub('hunt-lair', 'hunt-bird', 'The Bird, Freed', 'The cage door stands open. The bird steps out onto the deck, and stretches, wing by wing, carefully, as if it is not sure they still work. It looks at you. Then it looks at Aurel. It is Moltres, and the air goes warm around it.', birdChoices('moltres', 'Moltres'), {
    remembers: [
      v('articuno', [ARTICUNO], { intro: 'The cage door stands open. The bird steps out onto the deck, and stretches, wing by wing, carefully. Frost spreads across the deck where it stands. It is Articuno. It looks at you. Then it looks at Aurel.', hide: [0, 1, 2], add: birdChoices('articuno', 'Articuno') }),
      v('zapdos', [ZAPDOS], { intro: 'The cage door stands open. The bird steps out onto the deck, and stretches, wing by wing, and the instruments on the station mast all spin at once. It is Zapdos. It looks at you. Then it looks at Aurel.', hide: [0, 1, 2], add: birdChoices('zapdos', 'Zapdos') }),
    ],
  }),
];

export const EVENTS: Json[] = withRooms([...DISCIPLE, ...READINGS, ...FOG, ...COAT]);
