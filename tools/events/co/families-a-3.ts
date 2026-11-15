// Catalog Overhaul Pack: STORY_FAMILIES_2.md. SF7 Gatekeeper Mara, SF8 The Old Ranger, SF9 The Blissful Sanctuary,
// SF10 The Hooded Traveller, SF11 The Broken Habitat, SF12 Hollow Vale. Build: npm run co:build -- families-a-3.
// Run memory is same-run only (Kice 2026-11-14): Mara's "past runs" become what happened earlier in this run.
import { again, anyType, ch, fight, flag, flagAgo, flagAt, fr, ferry, gym, has, heal, hurt, item, lose, money, out, $, room, stopHere, takeNode, trainer, wild, isEvil, type Json } from '../dsl.ts';
import { disaster, grunt, is, kind, later, moment, not, region, safe, sub, temp, trust, v } from './_fa.ts';

export const CATEGORY = 'families-a';
/** Ids this doc folds into others (see _fa-retired.json). */
export const REMOVE = ['rk-third-wheel', 'mr-vanished-village', 'sanctuary-found', 'sanctuary-guardian', 'blissful-encounter', 'blissful-awakening'];

/** "N nodes on": the event's stop opens beside the node reached after N more nodes (anime's laterEvent). */
const soon = (eventId: string, nodes: number): Json => ({ kind: 'laterEvent', eventId, nodes });
const flagMost = (key: string, atMost: number): Json => ({ kind: 'flag', key, atLeast: 0, atMost });

// =====================================================================================================================
// SF7. GATEKEEPER MARA. Three meetings. Her "memory" is this run's: walking past her twice sours her (SF7.2);
// holding the bridge while she sleeps earns the package (SF7.3).
// =====================================================================================================================
const maraTeam = (o: { lv: number; win: Json[]; lose: Json[] }): Json => safe(trainer('Mara', { cls: 'veteran', team: ['gallade', 'bisharp', 'lucario'], size: 3, lv: o.lv, win: o.win }), ...o.lose);
/** Two travellers come to cross while Mara sleeps; the player holds the bridge (one node of duty). */
const watch = (win: Json[]): Json => safe(trainer('Bridge Challengers', { cls: 'ace-trainer', size: 2, lv: 0, chain: 2, win }), ...win);

const MARA: Json[] = [
  {
    id: 'mara-gatekeeper', requires: [flagMost('mara-walked-on', 1), not('mara-m2'), not('mara-m3')],
    intro: 'A narrow stone bridge over a gorge so deep the river at the bottom makes no sound. A woman in a dented breastplate stands in the middle of it, a Gallade at her side. On the far bank sits a row of bruised trainers, nursing their pride and their Pokémon and not looking at each other. Mara: "Nobody crosses without beating me." She rolls her shoulder, and something in it clicks. "I\'ve fought nineteen people today. I\'ll fight twenty." She sways a little. Her Gallade puts a hand flat on her back, very gently, and keeps it there until she is steady.',
    choices: [
      ch('Battle.', fight('She sets her feet. Whatever is wrong with her, it is not her timing.', maraTeam({ lv: 2, win: [flag('mara-m1'), flag('mara-won1'), room('mara-after')], lose: [flag('mara-m1'), flag('mara-lost1'), moment('Mara beat you on her bridge, and let you cross anyway. "You didn\'t run."', 55)] }))),
      ch('Why do you guard it?', fight('Mara: "Someone told me to. A long time ago." She frowns, as if the answer used to be longer. "I don\'t remember who. I just know I mustn\'t stop." Then she raises her hand, and the Gallade steps forward, and there is no more talking.', maraTeam({ lv: 2, win: [flag('mara-m1'), flag('mara-asked'), flag('mara-won1'), room('mara-after')], lose: [flag('mara-m1'), flag('mara-asked'), flag('mara-lost1'), moment('Mara beat you on her bridge, and let you cross anyway. "You didn\'t run."', 55)] }))),
      ch('Find another way. (two nodes)', out('You go the long way round: down a goat track, across the river on stones, up the other side on your hands. It takes most of the day. When you look back from the top, she is still standing in the middle of the bridge, alone, watching a road nobody is on.', takeNode(2))),
    ],
    remembers: [
      v('second-bridge', [is('mara-walked-on')], { intro: 'Another gorge. Another bridge. The same dented breastplate in the middle of it, and the same Gallade, which sees you first. Mara looks up a moment later. Something crosses her face, and goes. Mara: "Nobody crosses without beating me." She says it the way you say a prayer you have stopped hearing. "Twenty-one today. Come on, then."' }),
    ],
  },
  sub('mara-gatekeeper', 'mara-after', 'Gatekeeper Mara', 'Mara steps aside without a word. Then, as you pass, she sits down on the bridge rail. Her Gallade stands beside her. She doesn\'t get up. She doesn\'t look as if she can.', [
    ch('Rest. I\'ll watch the bridge.', fight('Mara looks at you for a long moment, as if you had spoken another language. Then she lies down on the stones with her head on her arm and is asleep before her Gallade has finished kneeling beside her. Two challengers come up the road before dark. You hold the bridge.', watch([flag('mara-rested'), moment('You held a stranger\'s bridge for a night so she could sleep', 60)]))),
    ch('Good fight.', out('She nods, once. It is a very small nod, and it costs her something, and she means it.')),
    ch('Walk on.', out('You walk on. Behind you there is no sound at all. When you glance back from the far end she has not moved, and the Gallade is looking at you over her head.', flag('mara-walked-on'), again('mara-gatekeeper'))),
  ]),
  {
    id: 'mara-remembers-grudge', callback: true, requires: [is('mara-walked-on', 2), later('mara-walked-on', { stages: 1 }), not('mara-m2'), not('mara-m3')],
    intro: 'A different bridge. Mara is in the middle of it again, and her eyes lock on yours from the far end, before you are even close. Mara: "I know you. I don\'t know how." Her jaw works. "I just know I don\'t like you." Her Gallade steps forward without being told.',
    choices: [
      ch('We\'ve never met.', fight('Mara: "Then why does my hand shake?" It does. Then it stops shaking, and she is sharper than before: every opening you remember from last time has been closed.', maraTeam({ lv: 3, win: [flag('mara-m2'), room('mara-grudge-after')], lose: [flag('mara-m2'), room('mara-grudge-after')] }))),
      ch('What did I do?', out('Mara: "Walked past me. Like I was furniture." She stops. She looks surprised that she said it, and then a little ashamed, and then angry about being ashamed. The Gallade lowers its arm-blades an inch.', flag('mara-m2'), flag('mara-named-it'), room('mara-grudge-after'))),
      ch('Battle, then.', fight('It is a hard battle. She fights like someone who has been waiting for exactly you.', maraTeam({ lv: 3, win: [flag('mara-m2'), room('mara-grudge-after')], lose: [flag('mara-m2'), room('mara-grudge-after')] }))),
    ],
  },
  sub('mara-gatekeeper', 'mara-grudge-after', 'I Know You', 'Afterwards, the two of you stand on the bridge with the wind coming up out of the gorge. Mara is breathing hard. She has not stepped aside, and she has not asked you to go.', [
    ch('I\'m sorry.', out('It is not much. She looks at you as if she is weighing it, and then the weight goes out of her shoulders in one go, like a pack being put down. Mara: "...Huh." She steps aside. The Gallade bows to you, very slightly, which it has never done.', flag('mara-forgiven'))),
    ch('Let me take a shift.', fight('Mara: "You\'d do that." It is not a question. She sits down where she stands and is asleep in a breath, her back against the Gallade\'s legs. Two challengers come before the light goes. You hold the bridge for her.', watch([flag('mara-rested'), flag('mara-forgiven'), moment('You held the bridge for the woman who hated you, and she slept', 65)]))),
    ch('You\'re still in my way.', out('Mara: "Yes," she says. "I am." She steps aside, slowly, without taking her eyes off you, and it goes in deep and stays there. Whatever reunion waits at the end of all this, she will not speak at it.', flag('mara-grudge'))),
  ]),
  {
    id: 'mara-remembers-kind', callback: true, requires: [is('mara-rested'), later('mara-rested', { stages: 1 }), not('mara-grudge'), not('mara-m3')],
    intro: 'The next bridge. Mara is waiting at the near end of it this time, not the middle, holding a package wrapped in a scarf. She doesn\'t have her sword out. Mara: "I don\'t know why. I feel like I owe you." She turns the package over in her hands. "Last night I dreamt someone held the bridge while I slept. I woke up crying." She looks up. "Was that you?"',
    choices: [
      ch('It was.', out('She laughs, embarrassed, and wipes her eyes on the back of her glove, and pushes the package into your hands. Inside is a Focus Sash, the fabric soft and old. Mara: "I\'ve carried it for years. I never knew who for."', item('focus-sash'), flag('mara-m3'), flag('mara-kind'), room('mara-last'))),
      ch('Maybe in another life.', out('Mara: "Then thank you, other life." She puts the package in your hands and closes your fingers over it. A Focus Sash, carried so long it has taken the shape of her pack.', item('focus-sash'), flag('mara-m3'), flag('mara-kind'), room('mara-last'))),
      ch('Open the package?', out('She nods. Inside: a whetstone worn into a curve, a Focus Sash, and a slip of paper in her own handwriting. "Give this to the one who let you sleep." Mara stares at it. Mara: "I don\'t remember writing that." She does not take it back.', item('focus-sash'), flag('mara-m3'), flag('mara-kind'), room('mara-last'))),
    ],
  },
  sub('mara-gatekeeper', 'mara-last', 'A Package', 'Mara looks out at the bridge she has been standing on for longer than she can remember. Mara: "Who told me to guard the bridge?" Her voice is very small. "Do you know?"', [
    ch('Nobody. You can stop.', out('She looks at the bridge for a long time. Then she puts down her sword, carefully, on the stones, the way you would lay down something sleeping. She walks off the bridge. Halfway across the road she starts to laugh, and cannot stop, and the Gallade walks beside her with its hand on her back, and this time she does not need it.', flag('mara-free'), flag('mara-reunion'), moment('Mara put her sword down and walked off the bridge, laughing', 75))),
    ch('I\'ll find out.', out('At the foot of the bridge, under moss you scrape away with your sleeve, there is a carved stone: an order, in an old Kalos hand, from a war three thousand years past. HOLD THIS CROSSING UNTIL RELIEVED. Nobody ever came to relieve her. She traces the letters with one finger. Mara: "Oh," she says. "Oh, I forgot." There is an old man, somewhere, who would know more. AZ. He was there.', room('mara-stone'))),
    ch('Keep guarding. You\'re good at it.', out('She smiles. It is a real smile, the first you have seen on her. Mara: "I am, aren\'t I." She goes back to the middle of the bridge. But she sleeps at night now. Her Gallade makes sure of it.', flag('mara-guard'))),
    ch('I\'ll take the bridge for a while.', fight('You take the middle of the bridge. Mara sleeps the whole way through, on her back on the warm stones, one arm over her eyes. Two challengers come. You hold.', watch([flag('mara-free'), flag('mara-relieved'), flag('mara-reunion'), moment('You took Mara\'s bridge, and she went home for the first time in years', 75)]))),
  ], {
    remembers: [
      v('az', [is('az-flute')], { intro: 'Mara looks out at the bridge. And then she looks past it, because there is an old, old man coming up the road with a flute at his belt, walking very slowly. AZ stops at the foot of the bridge. He looks at Mara, at her breastplate, at the stone. AZ: "The war is over," he says. "It has been over for a very long time. I am sorry nobody came." Mara sits down on the stones and weeps, and AZ waits with her until she has finished. Then Mara: "Who told me to guard the bridge?" she asks you anyway. "Do you know?"' }),
      v('asked', [is('mara-asked')], { intro: 'Mara looks out at the bridge she has been standing on for longer than she can remember. Mara: "You asked me why, the first day. Nobody asks." She is quiet a while. "Who told me to guard the bridge?" Her voice is very small. "Do you know?"' }),
    ],
  }),
  sub('mara-gatekeeper', 'mara-stone', 'The Carved Stone', 'Mara kneels by the carved stone for a long time. The wind comes up out of the gorge. Her Gallade sits down beside her, which you have never seen it do. Mara: "I was so tired," she says. "I thought being tired was the job."', [
    ch('Walk with her a while.', out('You walk with her as far as the next crossroads. She asks about your team, and remembers every name. At the crossroads she stops. Mara: "If there\'s ever a fight at the end of all this," she says, "a real one. Call me. I\'d like to stand somewhere because I chose to."', flag('mara-truth'), flag('mara-reunion'), moment('Mara learned who set her on the bridge, three thousand years ago', 70))),
  ]),
];

// =====================================================================================================================
// SF8. THE OLD RANGER. Three visits; at Friends he asks a favour: the Windswept Spire (a chain pseudo-stage).
// =====================================================================================================================
const spireWild = (next: string): Json => ({ ...safe(wild({ types: ['flying'], lv: 1, win: [room(next)] }), room(next)), pseudo: true });

const RANGER: Json[] = [
  {
    id: 'ranger-trust-1', requires: [not('ranger-v1')],
    intro: 'A forest clearing at dusk. A fire, a tent, a big Ursaring asleep against a log with its paws folded on its stomach. An old man in a ranger\'s hat squints at you over the fire. Ranger Oswin: "Mind the fire. And the bear. The bear\'s friendly." The Ursaring snores, enormously. Oswin: "Sit, if you\'re sitting. Don\'t, if you\'re not."',
    choices: [
      ch('Sit.', out('You sit. Oswin says almost nothing. He passes you a tin mug of something hot and smoky and goes back to looking at the fire. Your team stretch out in the warm. The Ursaring rolls over. It is lovely, and it is the first time in a long while that nobody has wanted anything from you.', heal(1), flagAt('ranger-v1'))),
      ch('Is that bear yours?', out('Oswin: "No. He\'s his own." He pokes the fire. "He likes the fire." The Ursaring opens one eye at the sound of being discussed, decides you are fine, and closes it again.', flagAt('ranger-v1'), flag('ranger-bear'))),
      ch('I\'m passing through.', out('Oswin: "Most are." He does not look up. Behind you, the fire pops.')),
    ],
  },
  {
    id: 'ranger-trust-2', callback: true, requires: [is('ranger-v1'), flagAgo('ranger-v1', 1), not('ranger-v2')],
    intro: 'The same clearing, somehow, though you are a whole region away. A different season in the trees. Oswin puts a kettle on without asking, and moves his pack off the log so there is room. Oswin: "Back again." He settles. "Tell me about the road."',
    choices: [
      ch('Tell him about a hard battle.', out('He listens to all of it without interrupting, the way people only listen when they have been in a few. When you finish he says one thing, about the next Gym Leader, and the way they open. It is exactly the right thing.', gym(), flag('ranger-v2'))),
      ch('Tell him about a kindness.', out('He nods slowly through it. When you\'re done he reaches into his coat and puts three berries in your hand, still cold from the night air. Oswin: "For the next one."', item('oran-berry', 3), flag('ranger-v2'))),
      ch('Ask about his road.', out('Oswin is quiet for so long you think he hasn\'t heard. Oswin: "Forty years with an Arcanine called Ember." He watches the fire. "She went last winter. I\'ve been sitting here since." The Ursaring, asleep, shifts closer to him.', flag('ranger-v2'), flag('ranger-ember'))),
    ],
  },
  {
    id: 'ranger-trust-3', callback: true, requires: [is('ranger-v2'), later('ranger-v2', { stages: 1 }), not('ranger-v3')],
    intro: 'The clearing. There is a spare bedroll laid out by the fire, rolled tight and tied with ranger\'s knots. Oswin: "For you. Made it last winter. Thought you might turn up." He looks at the fire. A tin box sits beside him, very plain. Oswin: "I\'ve a favour. You can say no." His hand rests on the lid. "Ember\'s in there. She loved the Windswept Spire. Used to sit at the top with her ears inside out in the wind." He swallows. "I can\'t climb it anymore."',
    choices: [
      ch('I\'ll take her.', out('He puts the box in your hands as if it weighs a great deal more than it does. Oswin: "Top\'s a flat rock. You\'ll know it." The Windswept Spire is already in sight above the trees, three hard turns of path into the wind.', item('oswins-bedroll'), flag('ranger-bedroll'), flag('ranger-v3'), room('ranger-spire-1'))),
      ch('Climb with me.', out('Oswin looks at you, and then up at the Spire, and then at his knees. Oswin: "Slow, then." He gets up. The Ursaring gets up too, without being asked, and stands at his shoulder. It will be four turns of path, not three. Nobody minds.', item('oswins-bedroll'), flag('ranger-bedroll'), flag('ranger-v3'), flag('ranger-together'), room('ranger-spire-1'))),
      ch('I can\'t.', out('Oswin: "Fair." He keeps the box. There is no grudge in it at all, and he still pushes the bedroll at you until you take it. Oswin: "That\'s yours either way. That was never the trade."', item('oswins-bedroll'), flag('ranger-bedroll'), flag('ranger-v3'))),
    ],
  },
  sub('ranger-trust-3', 'ranger-spire-1', 'The Windswept Spire', 'The path up the Windswept Spire is a ledge a body wide, and the wind comes at it sideways, off the whole forest at once. It pulls at your coat. It pulls at the box under your arm. Ahead the path turns round a buttress and out of sight.', [
    ch('Climb on, heads down.', out('You lean into it and climb. The wind takes your breath and gives it back colder. Your team take a battering on the open stretches, and nobody turns round.', hurt(0.15), room('ranger-spire-2'))),
    ch('Let a Flying-type read the wind.', out('Your Flying-type goes up first, riding the gusts the way it was made to, and calls the lulls down to you one at a time. You climb between them, and the wind never gets a proper hold.', room('ranger-spire-2')), { requires: [anyType('flying')] }),
    ch('Climb at his pace.', out('You climb at Oswin\'s pace, which is slow, and stop when he stops. The wind batters all of you on the open stretches. Nobody says anything about it.', hurt(0.1), room('ranger-spire-rest'))),
  ], {
    remembers: [
      v('together', [is('ranger-together')], { intro: 'The path up the Windswept Spire is a ledge a body wide, and the wind comes at it sideways. Oswin goes slowly, one hand flat on the rock, the other on your shoulder at the worst stretches. He does not complain once. The Ursaring goes behind him, so close its nose is nearly in his pack, and each time the wind gusts it leans its whole weight against the old man and keeps him on the mountain.', hide: [0, 1] }),
      v('bear', [is('ranger-bear')], { intro: 'The path up the Windswept Spire is a ledge a body wide, and the wind comes at it sideways. You are not alone on it. The Ursaring has come up after you from the clearing, on its own, as if this is something it has been meaning to do. It climbs just behind you the whole way.', hide: [2] }),
      v('alone', [not('ranger-together')], { hide: [2] }),
    ],
  }),
  sub('ranger-trust-3', 'ranger-spire-rest', 'The Windswept Spire', 'A notch in the rock, out of the wind. Oswin sits down in it without a word and stays sitting. His hands are shaking. Oswin: "Used to run this," he says. "She\'d beat me to the top every time. Wait for me with her tongue out."', [
    ch('Wait with him.', out('You wait. You don\'t say anything. After a while he gets up, one hand on the Ursaring, and nods at the path, and you go on. It is the slowest part of the climb, and you would not have it any faster.', fr(3, 'party'), room('ranger-spire-2'))),
  ]),
  sub('ranger-trust-3', 'ranger-spire-2', 'The Windswept Spire', 'Higher up, the path crosses a saddle of bare rock, and something is riding the updraught there, wheeling and screaming, furious at anything that comes into its wind.', [
    ch('Battle it.', fight('It dives out of the gale at you.', spireWild('ranger-spire-top'))),
    ch('Edge round it on the lip.', out('You go round on the very edge of the saddle with the drop at your heels. It strafes you twice. Then you are past, and it loses interest.', hurt(0.2), room('ranger-spire-top'))),
  ], {
    remembers: [
      v('together', [is('ranger-together')], { notice: 'Oswin puts his back to the rock with the Ursaring in front of him like a wall, and shouts advice you mostly can\'t hear over the wind.' }),
    ],
  }),
  sub('ranger-trust-3', 'ranger-spire-top', 'The Top of the Spire', 'The top of the Windswept Spire is a flat rock, like he said. You know it at once: there are claw marks worn into it, old and smooth, where a big dog used to sit with her ears inside out in the wind. The whole forest is below you. You open the tin.', [
    ch('Let the wind take her.', out('You tip the box into the wind. The ashes go up, not down, a long grey ribbon over the trees, and then they are gone, and it is just the wind. You stand there a while. It seems rude to leave straight away.', flag('ranger-spire'), room('ranger-spire-view'))),
  ], {
    remembers: [
      v('together', [is('ranger-together')], { intro: 'The top of the Windswept Spire is a flat rock with claw marks worn into it, old and smooth. The Ursaring goes to the edge and stands there looking down at the forest. Oswin stands in front of the claw marks for a long time. Then he takes the box from you, and opens it himself, and holds it up into the wind, and lets her go. Afterwards he sits down on the rock, exactly where the marks are, and looks out over the forest, and doesn\'t say anything for a very long time.', hide: [0], add: [
        ch('Sit beside him.', out('You sit beside him until the light changes. When he finally gets up, he unbuckles something from inside his coat and pushes it into your hands without looking at you: a worn leather collar, the tag rubbed blank. Oswin: "Hers. She never once got burned in forty years. Stubborn." His voice goes. "Take it up mountains."', item('embers-collar'), flag('ranger-spire'), room('ranger-spire-view'))),
      ] }),
      v('bear', [is('ranger-bear')], { intro: 'The top of the Windswept Spire is a flat rock, like he said, with claw marks worn into it, old and smooth. The Ursaring that followed you up walks past you to the edge and stands there on its hind legs, looking down at the whole forest, very still, as if it is looking for someone. You open the tin.' }),
    ],
  }),
  sub('ranger-trust-3', 'ranger-spire-view', 'The Top of the Spire', 'From the top of the Spire, the whole forest is laid out like a map: the river, the road, and, very small, the smoke of a campfire in a clearing where an old man has been sitting since last winter.', [
    ch('Head back down.', out('You go back down. At the clearing, the fire is out and the tent is struck. Oswin is on his feet with his pack on. Oswin: "Thought I\'d walk a bit," he says. "Been sitting long enough." Wherever the end of all this is, he will be at it, with the Ursaring beside him.', flag('ranger-done'), flag('ranger-reunion'), moment('You took Ember up the Windswept Spire, and Oswin walked again', 70))),
  ], {
    remembers: [
      v('flame', [{ kind: 'flag', key: 'blessing-ho-oh', atLeast: 1, atMost: 99 }], { intro: 'From the top of the Spire the whole forest is laid out like a map. And then, out of the empty wind, a flame lifts: a single bright feather of fire, turning over and over above the rock where the ashes went, warm on your face. It burns for as long as a breath and then it is gone. Something very old was watching. It approved.', hide: [0], add: [
        ch('Head back down.', out('You go back down with the warmth still on your face. At the clearing, Oswin is on his feet with his pack on. Oswin: "Saw a light up there," he says. "Thought I\'d walk a bit." Wherever the end of all this is, he will be at it, with the Ursaring beside him.', flag('ranger-done'), flag('ranger-reunion'), flag('sign-ho-oh'), moment('A flame rose over the Windswept Spire where Ember\'s ashes went', 75))),
      ] }),
      v('flame-moltres', [{ kind: 'flag', key: 'blessing-moltres', atLeast: 1, atMost: 99 }], { intro: 'From the top of the Spire the whole forest is laid out like a map. And then, out of the empty wind, a flame lifts: a long wing of fire, turning once above the rock where the ashes went, warm on your face. It burns for as long as a breath and then it is gone. Something very old was watching. It approved.', hide: [0], add: [
        ch('Head back down.', out('You go back down with the warmth still on your face. At the clearing, Oswin is on his feet with his pack on. Oswin: "Saw a light up there," he says. "Thought I\'d walk a bit." Wherever the end of all this is, he will be at it, with the Ursaring beside him.', flag('ranger-done'), flag('ranger-reunion'), flag('sign-moltres'), moment('A flame rose over the Windswept Spire where Ember\'s ashes went', 75))),
      ] }),
      v('arcanine', [{ kind: 'partyLine', species: 'growlithe', bond: 0 }], { intro: 'From the top of the Spire the whole forest is laid out like a map. Your own Pokémon of Ember\'s kind walks to the edge of the rock, to the claw marks, and puts its feet in them. Then it lifts its head and howls, long and rising, out over the trees. Far below, very small, a figure by a campfire stands up.', hide: [0], add: [
        ch('Head back down.', out('At the clearing, Oswin is already on his feet with his pack on, staring at your fire-dog. Oswin: "Heard her," he says. "Thought I heard her." He puts his hand on its head, and it lets him. "Thought I\'d walk a bit." Wherever the end of all this is, he will be at it, with the Ursaring beside him.', flag('ranger-done'), flag('ranger-reunion'), fr(5, { species: ['growlithe', 'arcanine'] }), moment('Your fire-dog howled from the Windswept Spire, and Oswin heard it', 75))),
      ] }),
    ],
  }),
];

// =====================================================================================================================
// SF9. THE BLISSFUL SANCTUARY. Region-long: hurt wanderer -> sanctuary -> raid -> trial -> grove -> the old one.
// =====================================================================================================================
const raidWin = [flag('sanct-raid')];
const raiders = (o: { chain?: number; rule?: Json; win: Json[]; lose: Json[] }): Json => safe(grunt('Raider', { size: 2, lv: 0, chain: o.chain, win: o.win }), ...o.lose);
const holdLine = (win: Json[], lose: Json[]): Json => ({ ...raiders({ win, lose }), rule: { noAttacks: true, surviveTurns: 4 } });
const raidChoices = (pre: string): Json[] => [
  ch('Fight them.', fight(`${pre}Three crews, one after another, at the pool's edge. With every battle, the light in the water dims a step.`, raiders({ chain: 3, win: [...raidWin, flag('sanct-fought'), flag('sanct-dim', 3)], lose: [...raidWin, flag('sanct-fought'), flag('sanct-dim', 3), flag('sanct-crates')] }))),
  ch('Defend without fighting.', fight(`${pre}You put your team between the raiders and the water, and you do not strike back. Only guards, screens, and patience. Four turns. Hold the line.`, holdLine([...raidWin, flag('sanct-defended')], [...raidWin, flag('sanct-crates'), flag('sanct-dim')]))),
];

const SANCTUARY: Json[] = [
  {
    id: 'hurt-wanderer', requires: [not('sanct-on')],
    intro: 'The roadside. A gentle Pokémon, long-legged and pale, is limping along the verge, favouring one foreleg. It looks toward a ridge in the distance, then at you. It stops. It waits. A shepherd sitting on a wall takes his pipe out of his mouth. Shepherd: "That one comes through every year. Goes up to the ridge." He watches it hold its foreleg off the ground. "This year it can\'t."',
    choices: [
      ch('Carry it.', out('Your strongest Pokémon kneels, and the wanderer climbs on with great care, as if it has done this before, a long time ago. It is heavier than it looks. Your team will be a fighter short for the next stretch of road. The wanderer rests its chin on your Pokémon\'s head and closes its eyes.', flag('sanct-on'), flag('sanct-carried'), temp('Carrying the wanderer: your team is a fighter short', [{ kind: 'statMultiplier', stat: 'atk', value: 0.85 }, { kind: 'statMultiplier', stat: 'spa', value: 0.85 }], 3), soon('wanderer-arrives', 3), ...kind())),
      ch('Heal it here.', out('A Potion, and a bandage torn from your own sleeve. It stands a little straighter. It nudges your hand once, and then it limps on up the road alone, toward the ridge, very slowly. The shepherd watches it go. Shepherd: "Might make it," he says. "Might not."', lose('potion'), flag('sanct-on'), flag('sanct-healed')), { requires: [has('potion')] }),
      ch('Follow it.', out('You don\'t pick it up and you don\'t hurry it. You just walk beside it, at its pace, which is very slow. It will take four nodes to reach the ridge instead of three. It keeps glancing at you as if to make sure you\'re still there.', takeNode(1), flag('sanct-on'), flag('sanct-followed'), soon('wanderer-arrives', 4), ...kind())),
    ],
  },
  {
    id: 'wanderer-arrives', callback: true, requires: [is('sanct-on'), is('sanct-healed'), later('sanct-on', { stages: 1 }), not('sanct-found')],
    intro: 'The ridge road ends at a quiet glade with a pool in it, so still it holds the whole sky. The wanderer is steady on its feet now. A keeper in grey robes hurries out of the trees. Keeper Lisle: "You brought it." She kneels and puts her forehead to its neck. "It hasn\'t missed a year in thirty." She stands. Lisle: "This is a sanctuary. Nobody fights here. The light here is very old." She looks at the pool. "It gathers on those who\'ve been gentle a long time."',
    choices: [
      ch('Can I stay?', out('Lisle: "Of course." Your Pokémon lie down in the long grass by the pool and sleep more deeply than they have slept in weeks. When they wake, every one of them is whole.', heal(1), flag('sanct-found'))),
      ch('What light?', out('Lisle points at the pool. You look, and keep looking, and then you see it: a faint glow, far down, like a lamp left on in a house at the bottom of a lake.', flag('sanct-found'))),
      ch('I\'ll go.', out('Lisle: "Go gently, then." The glade stays where it is, a little green mark on your map that you know how to find again.', flag('sanct-found'))),
    ],
    remembers: [
      v('healed', [is('sanct-healed')], { intro: 'A stage later, the ridge road ends at a quiet glade with a still pool in it. The wanderer is there. It arrived alone, a whole stage after you sent it on, thinner, the bandage still on its leg. A keeper in grey robes is sitting with it. Keeper Lisle: "It made it." She strokes its neck. "Just." She stands. Lisle: "This is a sanctuary. Nobody fights here. The light here is very old. It gathers on those who\'ve been gentle a long time."' }),
      v('followed', [is('sanct-followed')], { intro: 'The ridge road ends at a quiet glade with a pool in it, so still it holds the whole sky. The wanderer is steady now. A keeper in grey robes hurries out. Keeper Lisle: "You brought it." She looks at you, and at the dust on your boots. Lisle: "You walked at its pace. That\'s rarer than you\'d think." She stands. "This is a sanctuary. Nobody fights here. The light here is very old. It gathers on those who\'ve been gentle a long time."' }),
      v('carried', [is('sanct-carried')], { intro: 'The ridge road ends at a quiet glade with a pool in it, so still it holds the whole sky. The wanderer slides down off your Pokémon\'s back and stands on its own four feet. A keeper in grey robes hurries out. Keeper Lisle: "You brought it. You carried it." She puts her forehead to its neck. "It hasn\'t missed a year in thirty." Lisle: "This is a sanctuary. Nobody fights here. The light here is very old. It gathers on those who\'ve been gentle a long time."' }),
    ],
  },
  {
    id: 'sanctuary-attack', callback: true, requires: [is('sanct-found'), later('sanct-found', { stages: 1 }), not('sanct-raid')],
    intro: 'Smoke over the ridge. You run. In the glade, raiders in the region\'s team colours are hauling crates toward the pool, and running a hose down into the water. Raider: "The light\'s worth a fortune. Pump it into the crates." Lisle is on the ground by the pool, her robe torn. Lisle: "We don\'t fight here!" She sees you. Something changes in her face. Lisle: "We don\'t fight here. But you\'re not from here."',
    choices: [
      ...raidChoices(''),
      ch('Get Lisle out first.', out('You go for Lisle and the wanderer first and get them up into the trees, and it takes everything you have and the whole of the next stretch of road. Behind you, one crate goes over the ridge full of light. Then you come back down for the rest.', takeNode(1), flag('sanct-rescued-lisle'), flag('sanct-crates'), room('sanct-raid-back'), ...kind())),
    ],
    remembers: [
      v('flowers', [is('promise-shaymin')], { intro: 'Smoke over the ridge. You run. In the glade, raiders are hauling crates toward the pool, and they cannot get there. Flowers have come up all round the water overnight, white and green and knee-high, and every raider who steps into them sits down and forgets why they came. Lisle is standing among the flowers with her hands over her mouth. Lisle: "I don\'t know who you made a promise to," she says. "But they kept theirs."', hide: [0, 1, 2], add: [
        ch('Walk out among the flowers.', out('The raiders go, eventually, yawning and baffled, leaving their crates behind. Not a single hand was raised in the glade.', ...raidWin, flag('sanct-flowers'))),
      ] }),
      v('stopped', [{ kind: 'evil', stopped: 1 }], { intro: 'Smoke over the ridge. You run. In the glade there is only one raider, dragging a single empty crate, and when they see you coming down the slope they recognise you. Their face goes white. Raider: "No. No, no, no. Not you again." They drop the crate and run.', hide: [0, 1, 2], add: [
        ch('Let them run.', out('You let them run. Lisle comes out of the trees with the wanderer behind her. Lisle: "They\'re afraid of you," she says, not quite as a compliment, not quite not. Then she goes to put the crate back where nobody will find it.', ...raidWin, flag('sanct-defended'))),
      ] }),
    ],
  },
  sub('sanctuary-attack', 'sanct-raid-back', 'Smoke Over the Glade', 'Lisle and the wanderer are safe in the trees. Down at the pool, the raiders are filling a second crate. One of them turns and sees you coming.', raidChoices('')),
  {
    id: 'blessing-trial', callback: true, requires: [is('sanct-raid'), not('sanct-trial'), not('sanct-trial-begun')],
    intro: 'Behind the pool, half hidden in the trees, there is a mossy arch, and it hums, very softly, like a held note. Lisle stands under it. Lisle: "No one needs to fight here. The trial only asks what kind of presence you are." She steps aside. "Walk through. It will show you."',
    choices: [
      ch('Walk through.', out('You step under the arch. The humming gets inside your ribs. The glade goes, and something else comes.', flag('sanct-trial-begun'), room('sanct-moment-1'))),
      ch('Not yet.', out('Lisle: "It will wait. It\'s good at waiting."', again('blessing-trial'))),
    ],
  },
  sub('blessing-trial', 'sanct-moment-1', 'The Presence Trial', 'You are on the roadside again, and the wanderer is limping toward you with its foreleg held up, and you are watching yourself give it a Potion and a bandage and let it go up the road alone. The arch asks, in no words at all: would you do it again?', [
    ch('I\'d choose the same.', out('The arch stays cold. Not angry. Just cold, like a stone in the shade.', room('sanct-moment-2'))),
    ch('I\'d choose differently.', out('Something in the arch warms all at once, and more than you expected. Regret counts here. It counts for a great deal.', flag('sanct-warm', 2), room('sanct-moment-2'))),
  ], {
    remembers: [
      v('carried', [is('sanct-carried')], { intro: 'You are on the roadside again, and the wanderer is climbing onto your strongest Pokémon\'s back, very carefully, and resting its chin on its head. You are watching yourself carry it toward the ridge. The arch asks, in no words at all: would you do it again?', hide: [0, 1], add: [
        ch('I\'d choose the same.', out('The arch warms, gently, like a hand on the back of your neck.', flag('sanct-warm'), room('sanct-moment-2'))),
        ch('I\'d choose differently.', out('The arch goes quiet. It does not understand why you would.', room('sanct-moment-2'))),
      ] }),
      v('followed', [is('sanct-followed')], { intro: 'You are on the roadside again, walking beside the wanderer at its pace, which is very slow, and it keeps glancing up to check you are still there. The arch asks, in no words at all: would you do it again?', hide: [0, 1], add: [
        ch('I\'d choose the same.', out('The arch warms, gently, like a hand on the back of your neck.', flag('sanct-warm'), room('sanct-moment-2'))),
        ch('I\'d choose differently.', out('The arch goes quiet. It does not understand why you would.', room('sanct-moment-2'))),
      ] }),
    ],
  }),
  sub('blessing-trial', 'sanct-moment-2', 'The Presence Trial', 'The glade again, full of smoke. You are watching yourself at the edge of the pool, fighting: crew after crew, and the light in the water going down a step every time. In a place where nobody fights. The arch asks again.', [
    ch('I\'d choose the same.', out('The arch stays cold. You hear Lisle\'s voice from very far off: "We don\'t fight here."', room('sanct-moment-3'))),
    ch('I\'d choose differently.', out('The arch warms, all at once, and more than you expected. Regret counts here.', flag('sanct-warm', 2), room('sanct-moment-3'))),
  ], {
    remembers: [
      v('kind', [not('sanct-fought')], { intro: 'The glade again, full of smoke. You are watching yourself at the edge of the pool, and you are not fighting. Whatever the raiders did, you did not strike back in that place. The arch asks again.', hide: [0, 1], add: [
        ch('I\'d choose the same.', out('The arch warms, like sun coming out from behind a cloud.', flag('sanct-warm'), room('sanct-moment-3'))),
        ch('I\'d choose differently.', out('The arch goes quiet. It does not understand why you would.', room('sanct-moment-3'))),
      ] }),
    ],
  }),
  sub('blessing-trial', 'sanct-moment-3', 'The Presence Trial', 'Somewhere earlier on the road. You can\'t see where. You can only see {lead}, looking up at you, while you do something kind for somebody who could never pay you back. The arch asks a last time.', [
    ch('I\'d choose the same.', out('The arch warms. {lead} remembers it too.', flag('sanct-warm'), room('sanct-trial-end'))),
    ch('I\'d choose differently.', out('The arch goes quiet. It does not understand why you would.', room('sanct-trial-end'))),
  ], {
    remembers: [
      v('sly', [isEvil(1)], { intro: 'Somewhere earlier on the road. You can\'t see where. You can only see {lead}, looking up at you, while you take something that was not yours to take, and smile about it afterwards. The arch asks a last time.', hide: [0, 1], add: [
        ch('I\'d choose the same.', out('The arch stays cold. {lead} looks away.', room('sanct-trial-end'))),
        ch('I\'d choose differently.', out('The arch warms, all at once, and more than you expected. Regret counts here.', flag('sanct-warm', 2), room('sanct-trial-end'))),
      ] }),
    ],
  }),
  sub('blessing-trial', 'sanct-trial-end', 'The Presence Trial', 'You come out the other side of the arch into the glade. It is very quiet. Lisle puts her hand on the moss of the arch and holds it there, reading it. Her face falls, gently. Lisle: "It\'s cold. Mostly." She takes her hand away. "That isn\'t a verdict. It\'s just where you are today."', [
    ch('Ask what that means.', out('Lisle: "The light will still come. It always comes." She looks at the pool. "It just won\'t stay as long."', flag('sanct-trial'), flag('sanct-cold'))),
  ], {
    remembers: [
      v('warm', [is('sanct-warm', 2)], { intro: 'You come out the other side of the arch into the glade. It is very quiet. Lisle puts her hand on the moss of the arch and holds it there, reading it. She smiles. Lisle: "It\'s warm. Mostly." She takes her hand away. "That\'s more than most."', hide: [0], add: [
        ch('Thank her.', out('Lisle: "Don\'t thank me. I only keep the door."', flag('sanct-trial'), flag('sanct-passed'))),
      ] }),
      v('held', [is('sanct-defended'), is('sanct-warm', 1)], { intro: 'You come out the other side of the arch, and there is a fourth moment waiting that you did not walk through: the glade full of smoke, and you standing between the raiders and the water, and not striking back. The arch shows it to you already warm. Lisle puts her hand on the moss and smiles. Lisle: "It\'s warm. Mostly. That\'s more than most."', hide: [0], add: [
        ch('Thank her.', out('Lisle: "Don\'t thank me. Thank the you that held the line."', flag('sanct-trial'), flag('sanct-passed'))),
      ] }),
    ],
  }),
  {
    id: 'habitat-restored', callback: true, requires: [is('sanct-trial'), later('sanct-trial', { stages: 1 }), not('sanct-restored')],
    intro: 'The glade a stage later, and it is alive again. Pokémon are coming out of the trees: shy ones, old ones, little ones walking under the legs of big ones. Lisle: "They remember you. Look." A Stantler crosses the grass, puts its head on your shoulder and leaves it there. A Bidoof brings you a twig and sets it down at your feet with enormous ceremony.',
    choices: [
      ch('Stay a while.', out('You stay. Your team lie down in the grass among the wild ones, and are licked, and sat on, and slept against. By evening every one of them is whole and warm, and closer to you than they were this morning.', heal(1), fr(3, 'party'), flag('sanct-restored'), room('legendary-blessing'))),
      ch('Thank them.', out('You thank them one by one, which takes a long time, because they keep coming. Each of them leaves something at your feet before it goes back into the trees: a berry, then another, then a third, set down very carefully in a row.', item('oran-berry', 2), item('sitrus-berry'), flag('sanct-restored'), room('legendary-blessing'))),
      ch('Ask Lisle what\'s next.', out('Lisle looks at the pool. The glow in it is brighter than you have ever seen it, and rising. Lisle: "The light\'s gathering." She sits down on the grass to wait. "Tonight."', flag('sanct-restored'), room('legendary-blessing'))),
    ],
  },
  {
    id: 'legendary-blessing', room: true, requires: [],
    intro: 'Night. The restored glade is silent: no wind, no insects, nothing. Then the light changes, and something very old is standing at the edge of the pool. You could not say how long it has been there. It looks past you, at the Pokémon that has been with you longest. The light gathers on that Pokémon. It glows. It isn\'t afraid. Lisle, whispering: "It\'s chosen." Her voice cracks. "It\'s yours that it chose."',
    choices: [
      ch('Step back.', out('You step back, and give them the moment. The light settles into your Pokémon like warmth into a stone, and stays there. When you look up again, the old one has gone.', { kind: 'awaken' }, flag('sign-own', 2), flag('sanct-done'), moment('Something very old came to the sanctuary pool and chose one of yours', 85))),
      ch('Stay beside it.', out('You stay beside your Pokémon, your hand on its back. The light touches you too, just for a moment: a warmth like being remembered. The old one looks at you, once, directly. Then it is gone.', { kind: 'awaken' }, flag('sign-own', 2), flag('sanct-done'), moment('Something very old came to the sanctuary pool and looked at you once', 85))),
      ch('Bow.', out('You bow. After a moment, very slowly, the old one bows back. Then it is gone, and the light it left behind stays in your Pokémon.', { kind: 'awaken' }, flag('sign-own', 2), flag('sanct-done'), moment('Something very old came to the sanctuary pool, and bowed back', 85))),
    ],
    remembers: [
      v('cold', [is('sanct-cold')], { intro: 'Night. The restored glade is silent. Then the light changes, and something very old is standing at the edge of the pool. It looks past you, at the Pokémon that has been with you longest, for a long time, as if deciding. Then the light gathers on that Pokémon, thinner than it might have been, but there. Lisle, whispering: "It\'s chosen. It\'s yours that it chose."', hide: [0, 1, 2], add: [
        ch('Step back.', out('You step back. The light settles into your Pokémon, a little at a time. When you look up again, the old one has gone.', { kind: 'awaken' }, flag('sign-own', 1), flag('sanct-done'), moment('Something very old came to the sanctuary pool and chose one of yours', 80))),
        ch('Stay beside it.', out('You stay beside your Pokémon. The light does not touch you. It isn\'t unkind about it. Then it is gone.', { kind: 'awaken' }, flag('sign-own', 1), flag('sanct-done'), moment('Something very old came to the sanctuary pool and chose one of yours', 80))),
        ch('Bow.', out('You bow. The old one watches you bow, and then, after a long moment, it dips its head. Then it is gone.', { kind: 'awaken' }, flag('sign-own', 1), flag('sanct-done'), moment('Something very old came to the sanctuary pool, and dipped its head', 80))),
      ] }),
    ],
  },
];

// =====================================================================================================================
// SF10. THE HOODED TRAVELLER. Four meetings across a region. Same-run memory only, so the reveal is the mentor version
// (the doc's first-run case); the Past Champion / Gym Leader / Ally pools are cross-run and other categories' questlines.
// =====================================================================================================================
const HOODED: Json[] = [
  {
    id: 'companion-meet', requires: [not('hood-m1')],
    intro: 'The road. A traveller in a long coat, hood up, falls into step beside you without asking. They say nothing about why. They just walk, matching your pace exactly, a little to your left. After a whole node of it, they speak. Traveller: "You walk fast." A pause. "That\'s fine. I\'m waiting for something. I\'ll walk with you while I wait."',
    choices: [
      ch('Waiting for what?', out('Traveller: "To see if you\'re who I heard about." The hood turns toward you for a moment, and then back to the road.', flag('hood-m1'), flag('hood-asked-what'))),
      ch('Who are you?', out('Traveller: "Later." It is not unfriendly. It is a promise.', flag('hood-m1'))),
      ch('Suit yourself.', out('They nod. You walk on together, and after a while you stop noticing the extra footsteps, the way you stop noticing your own.', flag('hood-m1'))),
    ],
  },
  {
    id: 'companion-one', callback: true, requires: [is('hood-m1'), later('hood-m1', { stages: 1 }), not('hood-m2')],
    intro: 'A stream. The traveller has been walking a step behind you all morning. When you stop for water they have already filled two canteens, and they hold one out. Traveller: "You looked thirsty. Your Pokémon too." They kneel and fill a wooden bowl for your team, and hold it steady while they drink. As they lean down, the hood falls a little, and you glimpse an old scar along the jaw, white and long healed, the kind you only get from a very bad day a very long time ago.',
    choices: [
      ch('Thank you.', out('Traveller: "Drink." The water is so cold it hurts your teeth. Your team drink until their sides heave and come up stronger for it, for the rest of the region.', region('Water from a stranger\'s canteen: +5% HP', { kind: 'statMultiplier', stat: 'hp', value: 1.05 }), flag('hood-m2'))),
      ch('You\'ve done this before.', out('Traveller: "Many times." They screw the cap back on. "Different people."', flag('hood-m2'), flag('hood-hint'))),
      ch('Show me your face.', out('Traveller: "Not yet." They step back, out of reach, and pull the hood forward again. They don\'t walk away. But they walk a little further off, for a while.', flag('hood-m2'), flag('hood-pushed'))),
    ],
  },
  {
    id: 'companion-two', callback: true, requires: [is('hood-m2'), later('hood-m2', { stages: 1 }), not('hood-fork')],
    intro: 'A fork in the road. The traveller takes the right-hand way without looking, and then stops and waits for you to catch up. Traveller: "It\'s not my first time here." They look down the left-hand road for a moment. "I came this way once with a team like yours. The other fork goes to a bad place." The hood turns to you. "Do you trust me?"',
    choices: [
      ch('Yes.', out('Traveller: "Good." The right-hand road is narrow and steep and saves you a whole stretch of trouble you will never even see.', ferry(), flag('hood-fork'), flag('hood-trusted'))),
      ch('No, I\'ll take the other.', fight('The other road goes into a cutting, and there is an ambush in it, exactly where an ambush should be. Grunts, three of them, fresh and waiting. And then footsteps behind you, running: the traveller, who came anyway, and whose Dragonite drops out of the sky beside yours.', safe({ ...trainer('Grunt', { size: 3, lv: 1, ally: 'dragonite', format: 'doubles', win: [flag('hood-fork'), flag('hood-doubted')] }), evil: 'grunt' }, flag('hood-fork'), flag('hood-doubted')))),
      ch('What\'s down the other?', out('Traveller: "A place I lost someone." They don\'t say any more. They don\'t move either. The choice is still yours.', flag('hood-m3'), room('companion-two'))),
    ],
    remembers: [
      v('asked', [is('hood-m3')], { intro: 'The fork. The traveller stands at the mouth of the right-hand road, not looking down the left. A place they lost someone. Traveller: "Do you trust me?"', hide: [2] }),
    ],
  },
  {
    id: 'companion-three', callback: true, requires: [is('hood-fork'), later('hood-fork', { stages: 1 }), not('hood-end')],
    intro: 'The last bend before a town. The traveller stops, and puts both hands up, and the hood comes down. It\'s an old trainer, older than you can quite believe, with the long white scar along the jaw and your eyes. Exactly your eyes. Traveller: "I was you, once." They look up the road, the way you came. "Here, on this road. I wanted to walk it again."',
    choices: [
      ch('Come back.', out('They laugh, surprised. Traveller: "Come back?" They think about it properly. "All right. At the end. When it matters. I\'ll come back for that."', flag('hood-end'), flag('hood-returned'))),
      ch('Walk with me longer.', out('Traveller: "I was hoping you\'d ask." They fall back into step beside you, the hood down now, and their Dragonite drops out of the sky to walk beside yours. For the rest of the region, you are two trainers on the road, not one.', { kind: 'wandererFriend', stages: 4 }, flag('hood-end'), flag('hood-partner'))),
      ch('Thank you for walking.', out('Traveller: "Thank you for letting me." They unbuckle an old belt from under their coat, its leather cracked, its buckle stamped with a League mark too worn to read, and hold it out. Traveller: "This got me through. It\'ll get you through."', item('expert-belt'), flag('hood-end'), flag('hood-done'))),
    ],
    remembers: [
      v('doubted', [is('hood-doubted')], { intro: 'The last bend before a town. The traveller stops, and the hood comes down. It\'s an old trainer with a long white scar along the jaw and your eyes. Exactly your eyes. Traveller: "You didn\'t trust me." They smile. "You were right not to. Then I came anyway." A shrug. "That\'s the lesson. I was you, once. Here, on this road. I wanted to walk it again."' }),
      v('pushed', [is('hood-pushed')], { intro: 'The last bend before a town. The traveller stops. Traveller: "You wanted to see." The hood comes down. "Here." An old trainer, with a long white scar along the jaw and your eyes. It is a little less warm than it might have been. Traveller: "I was you, once. Here, on this road. I wanted to walk it again."' }),
    ],
  },
];

// =====================================================================================================================
// SF11. THE BROKEN HABITAT. Three stages: find who did it (wood or marsh), stop them (the hollow tree, then the culprit),
// rebuild (up to three nodes, a Zygarde Cell each). The culprit follows the region.
// =====================================================================================================================
/** Poachers everywhere else (kanto, hoenn, unova, alola, torren, grand and any new region). */
const FACTORY_REGIONS = ['johto', 'sinnoh', 'galar', 'kalos', 'orrery-basin', 'tidewrack-reaches'];
const RIVAL_REGIONS = ['paldea', 'frontier-isles', 'trial-archipelago', 'cairnmoor'];
const onStrand = (): Json[] => [flag('habitat-on')];
const regionIs = (...ids: string[]): Json => ({ kind: 'region', ids });
const culpritBattle = (name: string, cls: string, o: { chain?: number; lv?: number }, win: Json[]): Json => safe(trainer(name, { cls, size: 2, lv: o.lv ?? 1, chain: o.chain, win }), ...win);
const stopped = (...more: Json[]): Json[] => [flag('habitat-stopped'), ...more];

const HABITAT: Json[] = [
  {
    id: 'disturbed-habitat', requires: [not('habitat-on')],
    intro: 'A wood that should be loud, and isn\'t. Nests lie overturned in the bracken. Wild Pokémon keep their distance and watch you from very far back in the trees. A Pidgey stands on an empty nest on the ground and won\'t leave it, though you come close enough to touch. There are tyre tracks pressed into the moss. A cigarette end. A crate lid stamped with a logo.',
    choices: [
      ch('Follow the tracks.', out('The tracks go deep into the wood and out the other side, toward whoever did this. You know the way now. You will be back.', ...onStrand())),
      ch('Right the nests. (a node)', out('It takes the rest of the daylight. You set the nests back in the forks of trees, one after another, as gently as you can. The Pidgey\'s eggs are cold, but they are whole, and when you set its nest back up it climbs in and settles and looks at you. When you leave, it follows you, from branch to branch.', takeNode(1), ...onStrand(), flag('habitat-nests'), ...kind())),
      ch('Read the crate lid.', out('The logo is a company name, and under it, a stencilled address. You know exactly who did this, and where they are.', ...onStrand(), flag('habitat-named'))),
    ],
  },
  {
    id: 'habitat-disturbed', requires: [not('habitat-on')],
    intro: 'A marsh, torn up. The reeds are flattened in long swathes and the water is churned brown. Every Water-type you can see is on edge and moving away, slowly, all in the same direction. A Wooper is wandering in circles in the shallows, lost, calling. At the marsh edge a dredge sits rusting with its intake still in the water. You put your hand on the engine housing. It is still warm.',
    choices: [
      ch('Stop the dredge.', out('Your Pokémon takes the intake apart with its hands: a wrench of metal, a long scream of bolts, and the pipe comes away from the water and the churning stops. The marsh goes very still.', ...onStrand(), flag('habitat-dredge')), { requires: [anyType('fighting', 'steel')] }),
      ch('Guide the Wooper.', out('You wade in and walk the Wooper back along the reed line, slowly, until a chorus of answering calls starts up from a channel you could not see. Its family. It runs the last bit, splashing, and does not look back, which is exactly right.', ...onStrand(), flag('habitat-wooper'), ...kind())),
      ch('Find the driver.', fight('The driver is in a hut at the marsh edge, with a crew and a boss with a clipboard. The boss sees you looking at the dredge and puts the clipboard down.', culpritBattle('Crew Boss', 'worker', { lv: 1 }, [...onStrand(), flag('habitat-culprit-met')]))),
    ],
  },
  {
    id: 'habitat-nest', callback: true, requires: [is('habitat-on'), later('habitat-on', { stages: 1 }), not('habitat-nest-seen')],
    intro: 'A hollow tree, crowded with sleeping Bug-types: dozens of them, packed in like seeds in a pod. A larger one, the leader, watches you from the mouth of the hollow with all of its eyes. It doesn\'t attack. It\'s guarding the last safe nest. Outside, through the trees, you can hear it already: the culprit\'s next machine, or the next camp, a node away.',
    choices: [
      ch('Leave them be.', out('You leave them be. Nothing changes. The leader watches you all the way out of sight.', flag('habitat-nest-seen'), soon('habitat-culprit', 1))),
      ch('Stand guard with it.', fight('You sit down by the hollow tree as night comes in. The leader watches you for an hour, and then turns its back on you, which is the biggest compliment a guard can pay. In the dark, the culprit comes. You fight beside the leader.', safe(trainer('Night Crew', { cls: 'roughneck', size: 2, lv: 1, ally: 'vespiquen', format: 'doubles', win: [flag('habitat-nest-seen'), flag('habitat-guarded'), soon('habitat-culprit', 1)] }), flag('habitat-nest-seen'), flag('habitat-guarded'), soon('habitat-culprit', 1)))),
      ch('Bring it Honey.', out('You set Honey down at the mouth of the hollow and step back. After a long time the leader comes out and eats, and then goes back in, and does not watch you any more. You sleep that night under the tree, among the roots, safer than you have been in a week.', lose('honey'), heal(0.5), flag('habitat-nest-seen'), flag('habitat-fed'), soon('habitat-culprit', 1)), { requires: [has('honey')] }),
      ch('Bring it a berry.', out('You set a berry down at the mouth of the hollow and step back. The leader takes a long time deciding. Then it comes out and eats, and goes back in, and lets you sleep that night among the roots under its tree.', lose('oran-berry'), heal(0.5), flag('habitat-nest-seen'), flag('habitat-fed'), soon('habitat-culprit', 1)), { requires: [has('oran-berry')] }),
    ],
  },
  sub('disturbed-habitat', 'habitat-culprit', 'Stop Them', 'The poachers\' camp is in a clearing scraped bare, with cages stacked three high. A man with a ledger looks up from a camp chair and doesn\'t get up. Poacher: "It\'s a job." He shrugs. "They\'re animals."', [
    ch('Battle.', fight('He sighs, and puts the ledger down, and whistles, and two more come out of the tents.', culpritBattle('Poacher', 'roughneck', { chain: 2 }, stopped(flag('habitat-fought'))))),
    ch('Report.', out('You take down every number on every cage and walk to the nearest Ranger post. By evening the clearing is full of uniforms, and the cages are open, and the poacher is sitting very still in the back of a truck.', ...stopped(flag('habitat-reported'), flag('reported-crime')))),
    ch('Pay them to leave. (₽1000)', out('He counts it twice. Then they pack up and go, cages and all, without a word. The money is gone. They will be back somewhere else; people like this always are.', $(-1000), ...stopped(flag('habitat-paid'))), { requires: [money(1000)] }),
  ], {
    remembers: [
      v('factory', [regionIs(...FACTORY_REGIONS)], { intro: 'The factory sits on the river below the wood, and a drain the width of a road runs out of it into everything. At the gate there is a manager in a clean hard hat, and two guards behind him. Manager: "We have permits." He says it before you have said anything at all.', hide: [0, 1, 2], add: [
        ch('Battle the guards.', fight('The guards are already moving.', culpritBattle('Factory Guard', 'worker', { chain: 2 }, stopped(flag('habitat-fought'))))),
        ch('Report.', out('Permits have conditions, and you read every one of them out to a very interested inspector. By the next morning the drain has a valve on it, and the valve is shut.', ...stopped(flag('habitat-reported'), flag('reported-crime')))),
        ch('Show them the nests.', out('You don\'t argue. You walk the manager up into the wood and show him: the overturned nests, the cold eggs, the Pidgey that will not leave. He stands there a long time with his hard hat in his hands. Manager: "I\'ve got kids," he says, to nobody. The next day the drain is shut.', ...stopped(flag('habitat-shown')), ...kind())),
      ] }),
      v('rival', [regionIs(...RIVAL_REGIONS)], { intro: 'At the end of the tracks there is a tent, a dead campfire, a pile of crates, and your rival, sitting on one of them, looking at what you look at: the trampled nests, the ruts in the moss. They look up when you come. Rival: "...I didn\'t know." Their voice cracks. "I swear I didn\'t know. I just pitched the tent. I didn\'t look."', hide: [0, 1, 2], add: [
        ch('Help me fix it.', out('They look up at you as if you have thrown them a rope. Rival: "Yeah. Yeah. Okay." They get up. They roll up their sleeves.', ...stopped(flag('habitat-rival-help')), trust(1))),
        ch('You should\'ve looked.', out('They take it without arguing. Rival: "I know." They don\'t look at you for a while after that.', ...stopped(flag('habitat-rival-blamed')))),
        ch('It\'s okay.', out('Rival: "It\'s not." But their shoulders come down an inch.', ...stopped(flag('habitat-rival-eased')))),
      ] }),
    ],
  }),
  sub('disturbed-habitat', 'habitat-rebuild', 'Then Rebuild', 'The broken place again, quiet now. Nobody is coming back to hurt it. The work is what is left. You could spend up to three nodes here. Each one is something: replant, re-nest, or clear the water.', [
      ch('Replant. (a node)', out('You and your team spend a whole node on your knees, setting seedlings into the scraped ground. Somewhere in the turned earth something small and green hums, and comes up into your hand: a Zygarde Cell.', takeNode(1), flag('habitat-replant'), flag('habitat-built'), flag('zygarde-cells'), room('habitat-rebuild')), { requires: [not('habitat-replant')] }),
      ch('Re-nest. (a node)', out('Nests, one after another, back in the forks of trees and the hollows of banks. By the end, things are watching you work from the branches. Somewhere in a hollow something small and green hums: a Zygarde Cell.', takeNode(1), flag('habitat-renest'), flag('habitat-built'), flag('zygarde-cells'), room('habitat-rebuild')), { requires: [not('habitat-renest')] }),
      ch('Clear the water. (a node)', out('You drag the rubbish out of the water by hand: drums, cable, the broken half of a crate. By evening it runs clear again. At the bottom of the clean water, something small and green is humming: a Zygarde Cell.', takeNode(1), flag('habitat-clear'), flag('habitat-built'), flag('zygarde-cells'), room('habitat-rebuild')), { requires: [not('habitat-clear')] }),
      ch('That\'s enough.', out('You stand up, and look at what you have done. It is not what it was. It will be. The wild ones are coming back to it already, and there is a soft hollow at the heart of it where a traveller could rest.', stopHere('heal'), flag('habitat-done'))),
  ], {
    callback: true, requires: [is('habitat-stopped'), later('habitat-stopped', { stages: 1 }), not('habitat-done')],
    remembers: [
      v('full-chicks', [is('habitat-built', 3), is('habitat-nests')], { intro: 'You straighten up from the last of it. The whole place has been replanted, re-nested and cleared. And over your head, wobbling, shrieking, absurdly proud of themselves: the Pidgey\'s chicks, flying, with their parent wheeling round them. Something under the ground hums, deep, as if it has noticed.', hide: [0, 1, 2, 3], add: [
        ch('Rest here a while.', out('You rest. The habitat is whole. It will keep a soft hollow for travellers now.', stopHere('heal'), flag('habitat-done'), flag('habitat-full'), moment('You rebuilt a broken habitat and watched the Pidgey\'s chicks fly', 70))),
      ] }),
      v('full', [is('habitat-built', 3)], { intro: 'You straighten up from the last of it. The whole place has been replanted, re-nested and cleared. Something under the ground hums, deep, as if it has noticed.', hide: [0, 1, 2, 3], add: [
        ch('Rest here a while.', out('You rest. The habitat is whole. It will keep a soft hollow for travellers now.', stopHere('heal'), flag('habitat-done'), flag('habitat-full'), moment('You rebuilt a broken habitat, all of it', 65))),
      ] }),
      v('rival', [is('habitat-rival-help')], { intro: 'The broken place again. Your rival is already there, sleeves rolled, waiting for you. They do the work beside you and are quiet all the way through. You could spend up to three nodes here. Each one is something: replant, re-nest, or clear the water.' }),
    ],
  }),
];

// =====================================================================================================================
// SF12. HOLLOW VALE. A town of ghosts on the last evening before the flood. Market, hall, then the dam.
// =====================================================================================================================
const gate = room('ghost-town-gate');
const lake = [stopHere('heal'), stopHere('fish')];
const VALE: Json[] = [
  {
    id: 'ghost-town-gate', requires: [not('vale-done'), not('vale-left')],
    intro: 'The road bends through a town that is not on any map. Lights are on in every window. Tables are set, doors open. You call out. No one answers. A clock in the square says 7:40. It ticks. It doesn\'t move. A child runs past you, laughing, and through a wall. On the notice board by the well, in fresh paint: "TOWN MEETING TONIGHT. DAM REPORT. ALL WELCOME."',
    choices: [
      ch('Go to the market.', out('You follow the smell of bread down a lane of open stalls.', flag('vale-in'), room('ghost-town-market'))),
      ch('Go to the hall.', out('The hall doors are open and the lamps are lit. You go in.', flag('vale-in'), room('ghost-town-hall'))),
      ch('Leave.', out('You turn back the way you came. The road unbends behind you. When you look round, the town is gone, and there is only a valley full of still water, very deep, with the evening on it.', flag('vale-left'))),
    ],
    remembers: [
      v('both', [is('vale-hall'), is('vale-market')], { intro: 'The square again. The clock says 7:40, and then, for the first time, it doesn\'t: it says 7:58. Up the valley, above the roofs, the dam stands against the last of the light. Somebody is up there, alone.', hide: [0, 1], add: [ch('Go to the dam.', out('You climb the path to the dam.', room('vale-dam')))] }),
      v('hall', [is('vale-hall')], { intro: 'The square again. The clock says 7:40, and then, for the first time, it doesn\'t: it says 7:58. Up the valley, above the roofs, the dam stands against the last of the light. Somebody is up there, alone.', hide: [1], add: [ch('Go to the dam.', out('You climb the path to the dam.', room('vale-dam')))] }),
      v('market', [is('vale-market')], { intro: 'The square again. The clock in the square says 7:40. It ticks. It doesn\'t move. The hall doors are open, and the lamps are lit, and you can hear chairs scraping as people sit down for the meeting.', hide: [0] }),
    ],
  },
  {
    id: 'ghost-town-market', room: true, requires: [],
    intro: 'A stall keeper is arranging goods that are slightly out of focus: apples you can\'t quite see the edges of, a jar of something that keeps changing colour. She smiles at you as if you are a regular. Stall keeper, Mrs. Abney: "Do you want to trade?" She dusts her hands on her apron. "I don\'t take money. Money\'s no good here. I take memories." She leans on the counter. "Tell me something you remember, and I\'ll give you something I kept."',
    choices: [
      ch('My first battle.', out('You tell her about it: the nerves, the bad first move, the moment it turned. She listens with her chin on her hand. Then she hands you a little stoppered bottle of Sweet Berry Juice, and keeps nothing. Abney: "That one\'s still yours, love. It was only told."', item('sweet-berry-juice'), flag('vale-market'), gate)),
      ch('My starter\'s face.', out('You tell her about {starter}\'s face, the first time: what it looked like, what it did, how you knew. She closes her eyes while you talk. When you finish she gives you a Rare Candy. Abney: "Lovely," she says, and means it.', item('rare-candy'), flag('vale-market'), gate)),
      ch('Something I\'d rather forget.', out('You start to tell her. She stops you with one hand, gently, and takes it from you before you have finished saying it, the way you take a splinter out. You cannot remember now what it was. Only that it was heavy. She gives you a Cleanse Tag. Abney: "There. You won\'t need that one."', item('cleanse-tag'), flag('vale-market'), flag('vale-forgot'), gate)),
    ],
  },
  {
    id: 'ghost-town-hall', room: true, requires: [],
    intro: 'The hall is lit. A long table is set for the mayor and eleven guests, and there is a twelfth chair, empty, at the end. Mayor Dunmore: "You\'re late. Sit." He waves you in without looking. "The dam report\'s next." A young engineer stands up, holding a paper in both hands. Engineer, Aldo: "The dam\'s cracked. I\'ve said so for a month." His voice shakes. "We have to leave tonight." Mayor: "We\'ll vote." Pleasant. Reasonable. "All in favour of waiting until morning?" Every hand goes up but Aldo\'s. The twelfth chair is for whoever stopped the warning. The mayor is looking at it.',
    choices: [
      ch('Vote to leave now.', out('You put your hand up. One hand, in the whole hall: yours. The ghosts turn and look at you, all of them, with mild surprise, the way you would look at a draught. Nothing changes. It already happened.', flag('vale-hall'), flag('vale-voted'), gate)),
      ch('Sit in the chair.', out('You sit in the twelfth chair, and you see it: the mayor, a month ago, reading Aldo\'s warning in this room, alone, late. Not wanting to frighten anyone. Folding it into his coat. Patting the pocket. You get up very fast.', flag('vale-hall'), flag('vale-sat'), flag('vale-truth'), gate)),
      ch('Ask who the chair was for.', out('Aldo sits down beside you while the vote is counted. Aldo, quietly: "Him." He doesn\'t look at the mayor. "He knew. He thought there was time."', flag('vale-hall'), flag('vale-knows'), flag('vale-truth'), gate)),
    ],
  },
  sub('ghost-town-gate', 'vale-dam', 'The Dam', 'The dam above town, at 7:58. Aldo is there, alone, both hands flat on a crack in the stone as if he could hold it shut. Water is weeping through between his fingers. Aldo: "It goes at eight." He doesn\'t turn round. "It always goes at eight. We do this every night. We have the meeting. Nobody leaves. It goes." He presses harder. "I don\'t know how to make it stop."', [
    ch('Let the evening end.', out('You put your hand on his shoulder. He lets go of the stone. The clock in the square ticks to 8:00, and you both wait, and nothing comes. The water never comes. Down in the town, the ghosts come out of their doors and look up, surprised, and go out like lamps, one by one, peaceful. Aldo goes last. In the morning there is a lake where the valley was, very still, full of fish, and at its edge a little stone with eleven names on it and a twelfth that just says "the one who sat."', ...lake, flag('vale-freed'), flag('vale-done'), moment('You let Hollow Vale\'s last evening end, and the ghosts went out like lamps', 80))),
    ch('Hold the crack.', fight('You put your team between the town and the water. The dam breaks anyway, and the water comes over in a wall, and you fight it, because what else is there.', disaster('The Water', 'vaporeon', ['water'], { waves: 2, lv: 1, win: [flag('vale-held'), again('ghost-town-gate')], lose: [flag('vale-held'), again('ghost-town-gate')] }))),
    ch('Bring the mayor.', out('You go down and fetch him out of the hall, and he comes, slowly, his coat buttoned up to the throat. At the top of the dam he stands in front of Aldo and takes the folded warning out of his pocket and holds it out. Dunmore: "I\'m sorry." Aldo takes the paper. He looks at it for a long time. Then they both go out together, like one lamp. Where Aldo stood, there is a Damp Rock, and a blueprint for a better dam, beautifully drawn. In the morning there is a lake where the valley was, and a little stone with eleven names and a twelfth that just says "the one who sat."', ...lake, item('damp-rock'), flag('vale-freed'), flag('vale-forgiven'), flag('vale-done'), moment('The mayor of Hollow Vale said sorry to Aldo, and they went out together', 85)), { requires: [is('vale-truth')] }),
  ], {
    remembers: [
      v('kyogre', [{ kind: 'flag', key: 'blessing-kyogre', atLeast: 1, atMost: 99 }], { notice: 'At 8:00 exactly, the water behind the dam speaks, once, in a voice like a whole sea turning over in its sleep. Aldo hears it. He weeps.' }),
      v('suicune', [{ kind: 'flag', key: 'blessing-suicune', atLeast: 1, atMost: 99 }], { notice: 'At 8:00 exactly, the water behind the dam goes clear as glass, all at once, and a voice comes up out of it, once, very gently. Aldo hears it. He weeps.' }),
    ],
  }),
  sub('ghost-town-gate', 'vale-again', 'Hollow Vale, Again', 'The road bends, and Hollow Vale is there again: every light on, every table set, the clock in the square at 7:40. Aldo is waiting by the town gate this time, not up on the dam. He sees you, and his face changes. Aldo: "You." He sounds amazed. "You were here last night. You held it." He looks up at the dam. "Nobody\'s ever remembered before."', [
      ch('Go up to the dam with him.', out('You climb the path together.', flag('vale-again-seen'), room('vale-dam'))),
      ch('Not tonight.', out('Aldo: "Tomorrow, then." He smiles, and it is a terrible smile. "There\'s always a tomorrow, here."', flag('vale-again-seen'))),
  ], { callback: true, requires: [is('vale-held'), later('vale-held', { stages: 1 }), not('vale-done'), not('vale-again-seen')] }),
];

export const EVENTS: Json[] = [...MARA, ...RANGER, ...SANCTUARY, ...HOODED, ...HABITAT, ...VALE];
