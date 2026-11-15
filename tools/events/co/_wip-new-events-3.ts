// The 100 new events, Part 3 (NE51 to NE75): Pokémon-anime stories, evil teams, road people and town stories, wild scenes.
// Script: catalog_overhaul/NEW_EVENTS_3.md. Placement: NEW_EVENTS_PLACED.md, categories 11 to 15.
// The trades (NE61 to NE65) need the markets thread's Honest Trade Card: they wait, fully written, in _ne-trades.ts.
// Build: npm run co:build -- new-events-3
import { $, anyType, bondIs, bondUp, fight, flag, flagAgo, flagAt, flagIs, heal, item, join, money, out, ptype, room, scout, stopHere, takeNode, trainer, wild, reveal, type Json } from '../dsl.ts';
import { GROUP, L, P, after, anyFlag, ch, has, kind, kindFull, lose, ne, not, place, rep, step, teach, telling, variant } from './_ne.ts';

export { CATEGORY } from './_ne.ts';
export const REMOVE: string[] = [];

/**
 * Lines that read a flag another thread sets (evil-story's Files, the honesty flag, SF150's interview, a starving Poochyena, Old Haddon).
 * The category test only allows flags listed in its FOREIGN set; once those keys are listed there, set this to true and the lines play.
 */
const FOREIGN_READY = false;
const foreign = <T>(...x: T[]): T[] => (FOREIGN_READY ? x : []);

/** A Pokémon that joins with a quirk (this thread's quirks; see the Part 3 report for each rule). */
const joinQ = (species: string, quirk: string, extra: Json = {}): Json => ({ ...join({ species: [species] }), quirk, ...extra });
/** The run's Evil Team story (core/evil): `after` beats played, `ends` how it ended, `stopped` operations foiled. */
const team = (o: Json): Json => ({ kind: 'evil', ...o });
const line = (species: string, bond = 0): Json => ({ kind: 'partyLine', species, bond });
const noLine = (species: string): Json => ({ kind: 'partyLine', species, bond: 0, absent: true });
const age = (key: string, atLeast: number, atMost = 99): Json => ({ kind: 'flagAge', key, atLeast, atMost });
const later = (eventId: string, nodes: number): Json => ({ kind: 'laterEvent', eventId, nodes });
const types = (...t: string[]): Json => ({ kind: 'stageTypes', types: t });
const quiet = (span: 'stage' | 'region', t: string[]): Json => ({ kind: 'quietWild', span, types: t });
const RARE = (): Json => ({ kind: 'itemFrom', ids: ['leftovers', 'focus-sash', 'choice-band', 'choice-specs', 'choice-scarf', 'life-orb', 'eviolite', 'rocky-helmet'] });
const CORN = (): Json[] => [item('oran-berry'), item('sitrus-berry'), item('pecha-berry')];

// =====================================================================================================================
// CATEGORY 11. POKÉMON-ANIME STORIES
// =====================================================================================================================

/** The three Steel-types that hold the valley, with the wild Torkoal fighting beside your lead. */
const steelTrio = (win: Json[], lose: Json[]): Json => ({
  ...trainer('The Steel-types of the valley', { team: ['skarmory', 'magneton', 'lairon'], size: 3, friendly: true, win, lose }),
  ally: 'torkoal', spritePokemon: 'skarmory',
});
const TORKOAL = (): Json => joinQ('torkoal', 'smoke-crier', { ability: 'white-smoke' });

const NE51: Json[] = [
  ne(51, 'one-who-cried-smoke', 'The One Who Cried Smoke', GROUP.ash, {
    place: { earliest: 'A3', home: 7, window: [5, 10], sits: 'optional', attaches: 'before', tags: ['cave'], level: 'A+0', note: 'Steel or Rock stages.' },
    requires: [types('steel', 'rock')],
    tags: ['Pokémon', 'Story'], cast: ['trainer.hiker'], pokemon: 'torkoal', tint: '#2a2420', effect: 'fog',
  },
  P(
    'A Torkoal is backed against a cliff by three Steel-types. It isn\'t fighting. It\'s crying, and every sob puts out a cloud of white smoke.',
    'A Skarmory circles overhead, wings ringing like knives on a whetstone. A Magneton hums. A Lairon scrapes the ground and waits.',
    'The cliff behind the Torkoal is covered in scorch marks. There are eleven of them, and the old ones are paler, worn down by weather. Somebody has been counting.',
    L('Hiker Caspian: "It keeps coming back. They keep beating it."', 'Hiker Caspian: "It cries, it sleeps, it comes back. Eleven times this year. I\'ve stopped being able to watch."'),
  ), [
    ch('Stand with it.', fight(P(
      'You walk across the valley floor and stop beside the Torkoal. It looks up at you through the smoke, astonished.',
      'Your lead steps up on its other side. For the first time in eleven tries, the Torkoal is not alone. It stops crying long enough to plant its feet.',
    ), steelTrio(
      [flag('torkoal-stood'), TORKOAL()],
      [item('charcoal')],
    ))),
    ch('Drive the Steel-types off.', fight(
      'You put yourself between the Torkoal and the valley, and send your team at the three of them.',
      { ...wild({ species: ['skarmory'], win: [item('charcoal')] }), friendly: true, lose: [item('charcoal')] },
    ), { branches: [] }),
    ch('Give it a tissue.', out(P(
      'You crouch down and hold out a tissue. The Torkoal stares at it. Then it takes it, very carefully, in its mouth, and blows its nose.',
      'A jet of flame roars out across the valley, white-hot and as long as a house. The Skarmory flares backwards. The Magneton\'s hum goes up an octave.',
      'Everyone is impressed: Caspian, your team, and the Skarmory most of all. The Torkoal, very pleased with itself, hands back what is left of the tissue. It is ash.',
      'Caspian presses a lump of Charcoal into your hand. "Off the cliff. It\'s been making them all year."',
    ), ...kind(1), item('charcoal'))),
  ]),
  after(51, 'ne51-smoke-from-the-stands', 'Smoke Over the Stands', GROUP.ash, [line('torkoal'), flagIs('torkoal-stood'), place({ lastRegion: true, regionEnd: true })], { minStage: 6, pokemon: 'torkoal', tint: '#2a2420', effect: 'fog' },
    P(
      'You are still in the tunnel under the stands, waiting for your name, when the crowd starts murmuring.',
      'A column of white smoke is rising out of your bag, straight up through the open roof, where everyone in the stadium can see it. The Torkoal is crying already. It knows what today is.',
    ), [
      ch('Walk out into the smoke.', out(P(
        'You walk out with it billowing round you like a cape. Somebody in the top rows starts clapping. Somebody else joins in.',
        'By the time you reach the middle, the whole crowd knows that something out there cried eleven times and came back a twelfth.',
      ), { kind: 'friendshipLine', species: 'torkoal', amount: 5 })),
    ]),
];

const NE52: Json[] = [
  ne(52, 'dancing-crocodile', 'The Dancing Crocodile', GROUP.ash, {
    place: { earliest: 'A2', home: 6, window: [4, 9], sits: 'optional', attaches: 'before', tags: ['water'], level: 'A+0' },
    tags: ['Pokémon', 'Story'], cast: ['trainer.fairy_tale_girl'], pokemon: 'totodile', tint: '#10283a', effect: 'sparkle',
  },
  P(
    'A Totodile is dancing on a rock in the middle of a lake. It stamps, it spins, it claps its little jaws in time to nothing at all.',
    'Two trainers on opposite shores threw a Ball at the same moment. Both Balls are floating, bobbing gently, one on each side of the rock.',
    L('Ravenna, on the far shore: "Mine hit first."', 'Neither Ball has a mark on it. The Totodile dances between them, absolutely thrilled to be wanted twice.'),
    'Ravenna: "Battle for it? Or ask it?"',
  ), [
    ch('Battle for it.', fight(
      'Ravenna grins and wades in to her knees. "One on one. Winner keeps the dancer." On its rock, the Totodile starts a new dance, faster, as if it were the referee.',
      trainer('Ravenna', { size: 1, friendly: true, win: [flag('totodile-won'), joinQ('totodile', 'victory-dancer')], lose: [flag('ravenna-has-totodile')] }),
    )),
    ch('Ask it.', out(P(
      'You call across the water. The Totodile stops, one foot in the air, and looks at you. Then it dances a step and waits, head on one side.',
      'It dances to whoever dances back. Your lead looks at you, looks at the rock, and then, because it loves you, it dances.',
      'It is terrible. It is the best thing the Totodile has ever seen. It dives off the rock and swims straight for you, and comes up still dancing.',
      'Ravenna laughs until she has to sit down in the shallows. "Fair. That\'s fair. I couldn\'t have done that."',
    ), flag('totodile-danced'), bondUp(1, 'lead'), joinQ('totodile', 'victory-dancer')), { requires: [bondIs(3, 'lead')] }),
    ch('Let her have it.', out(P(
      'You fish your own Ball out of the water and wave her on. Ravenna stares at you for a moment as if you have done something she will need to think about later.',
      'The Totodile hops into her Ball. Just before it goes, it turns to you and waves with both arms.',
      'Ravenna: "I won\'t forget that. Find me on the road some time. I\'ll owe you one."',
    ), rep(1), flag('ravenna-has-totodile'))),
  ]),
  after(52, 'ne52-the-tag-battle', 'Ravenna and the Dancer', GROUP.ash, [flagIs('ravenna-has-totodile')], { minStage: 4, cast: ['trainer.fairy_tale_girl'], pokemon: 'totodile', tint: '#10283a', effect: 'sparkle' },
    P(
      'Two trainers block the road ahead, spoiling for a double battle. Before you can answer them, someone splashes up beside you.',
      L('Ravenna: "Told you I\'d owe you one. Mind if we share?"', 'Her Totodile is already dancing on your side of the line.'),
    ), [
      ch('Fight beside them.', fight(
        'The Totodile dances through the whole battle: between attacks, while dodging, once in the middle of a Water Gun. It does not miss a single step.',
        trainer('Road pair', { size: 2, friendly: true, win: [bondUp(1, 'lead'), $(400)], lose: [] }),
      )),
    ]),
  // The tag battle above: the Totodile fights beside your lead as the ally.
];
(NE52[1]!.choices as Json[])[0]!.success = { ...((NE52[1]!.choices as Json[])[0]!.success as Json), battle: { ...(((NE52[1]!.choices as Json[])[0]!.success as Json).battle as Json), ally: 'totodile' } };

const NE53: Json[] = [
  ne(53, 'one-who-got-too-slow', 'The One Who Got Too Slow', GROUP.ash, {
    place: { earliest: 'A4', home: 'The first + node after the evolution', sits: 'optional', attaches: 'rest', level: 'A+0, sparring', note: 'A Trigger: placed when a party Pokémon evolves into something slower (that trigger is not built yet; the player points at the Pokémon).' },
    tags: ['Pokémon', 'Relationship'], cast: ['trainer.black_belt_m'], tint: '#20242c',
  },
  P(
    'The one of yours that evolved most recently tries the dodge it has always done, the one that has saved it a hundred times. It doesn\'t get out of the way.',
    'It tries again in the next battle. It\'s hit again. Now, by the fire, it sits looking at its own feet, as if they have let it down.',
    L('A veteran by the next fire, Hargrove: "Had a Torterra like that. It kept trying to be a Grotle. You know what fixed it?"', 'Hargrove: "It stopped dodging. It started standing."'),
  ), [
    ch('Teach it to take the hit (a node).', out(P(
      'Hargrove gets up, groaning, and his old Torterra gets up with him. For the length of a road, the two of them spar with yours.',
      'No dodging. Your Pokémon plants its new, heavy feet and takes the blows, and stays up, and stays up. Near the end it stops flinching.',
      'Hargrove: "There. It\'s got a new shape. Now it needs a move to match."',
    ), takeNode(), flag('slow-accepted'), bondUp(2, 'picked'), room('ne53-a-move-for-its-shape')), { pick: {} }),
    ch('Keep training its speed.', out(P(
      'You run it up and down the road until you are both out of breath. It is a little quicker, by the end. Only a little.',
      'It is still unhappy. It keeps looking back at where its old self would have been.',
    ), item('carbos')), { pick: {} }),
    ch('Tell it it\'s fine as it is.', out(P(
      'You sit down beside it and tell it so. It looks at you, and you can see it doesn\'t believe you yet.',
      'But it leans against your shoulder, heavy and warm, and leaves it there.',
    ), bondUp(1, 'picked')), { pick: {} }),
  ]),
  step(53, 'ne53-a-move-for-its-shape', 'A Move for Its Shape', GROUP.ash, { cast: ['trainer.black_belt_m'], tint: '#20242c' },
    P('Hargrove: "Three I\'d teach a heavy one. Pick."', 'Your Pokémon looks up at you. Point at it again, and choose.'), [
      ch('Rock Climb.', out('It goes up the rock face behind the camp in four great steps, slowly, and never once slips.', teach('rock-climb')), { pick: {} }),
      ch('Body Press.', out('It learns to throw its whole new weight at a problem. Hargrove\'s Torterra rocks back a step and looks impressed.', teach('body-press')), { pick: {} }),
      ch('Iron Defense.', out('It learns to set itself like a wall. Hargrove raps on it with his knuckles. "There. Let them hit that."', teach('iron-defense')), { pick: {} }),
    ]),
];

const TAILLOW = (): Json => joinQ('taillow', 'wont-fall', { ability: 'guts' });
const NE54: Json[] = [
  ne(54, 'bird-who-wouldnt-fall', 'The Bird Who Wouldn\'t Fall', GROUP.ash, {
    place: { earliest: 'A3', home: 13, window: [10, 16], sits: 'optional', attaches: 'instead', tags: ['storm', 'high'], level: 'A+1' },
    tags: ['Pokémon', 'Combat'], cast: ['trainer.aroma_lady'], pokemon: 'taillow', tint: '#1c2430', effect: 'rain',
  },
  P(
    'Rain is coming down in sheets. In the middle of an orchard, a Taillow half the size of the others is fighting an Electric-type.',
    'It has been shocked four times. You can see it in the way its feathers stand up. It\'s still up. It\'s still diving.',
    'Behind it, a whole ragged flock has been raiding the trees. They are thin. You can see their ribs through the wet feathers. They are starving.',
    L('Orchard keeper Brae: "I don\'t mind the fruit. I mind that one."', 'Brae: "It\'ll kill itself before it backs down. It doesn\'t know how to back down."'),
  ), [
    ch('Feed the flock.', out(P(
      'You and Brae drag a crate of windfalls out under the trees. The Electric-type loses interest and wanders off. The flock comes down like rain.',
      'They eat and eat. The small one eats last, after every other bird has had its fill, and the whole time it eats, it is watching you.',
    ), flag('taillow-fed'), ...kind(1))),
    ch('Battle it.', fight(
      'It turns on you the moment you step forward, as if it has been waiting all day for someone its own size. It won\'t fall. Not easily.',
      { ...wild({ species: ['taillow'], lv: 1, win: [flag('taillow-respects')] }), weather: 'rain', friendly: true, lose: [flag('taillow-respects')] },
    )),
    ch('Catch it before it hurts itself.', out(P(
      'You throw before it can dive again. The Ball shakes, and bursts open. It is out, and furious. You throw again. It breaks out a second time.',
      'The third time, the Ball rocks once, twice, three times, and goes still. Brae lets out a breath she seems to have been holding all season.',
      'Brae: "Good. Somebody needed to make it stop."',
    ), flag('taillow-joined'), TAILLOW())),
  ], [
    variant('fed-before', [anyFlag('border-peace', 'funeral-berry', ...foreign('fed-poochyena'))], {
      notice: 'The small Taillow lands on a branch just above you and looks at you sideways for a long time. It seems to know what you are: someone who feeds things.',
      addChoices: [ch('Hold out your hand.', out(P(
        'It drops onto your wrist. It is so light. Its feet are shaking with cold and with all those shocks, and it doesn\'t fly off.',
        'It comes without a battle. Brae watches it go into the Ball and wipes the rain off her face, or something that isn\'t rain.',
      ), flag('taillow-joined'), TAILLOW()))],
    }),
  ]),
  after(54, 'ne54-the-lightning', 'The Lightning Bolt', GROUP.ash, [{ kind: 'partySpecies', species: 'swellow' }, flagIs('taillow-joined')], { minStage: 5, pokemon: 'swellow', tint: '#1c2430', effect: 'rain' },
    P(
      'The storm finds you on open ground. The flash comes first, white, and in it you see your Swellow already moving.',
      'It goes up, into the light, between the sky and your lead. The thunder comes after. When you can see again, it is on the ground, smoking, and getting up.',
    ), [
      ch('Hold it until it stops shaking.', out('It shakes for a long time. Your lead stands over the two of you until the storm moves on. Neither of them will look away from the other all evening.', bondUp(2, 'lead'), { kind: 'friendshipLine', species: 'taillow', amount: 10 })),
    ]),
];

const NE55: Json[] = [
  ne(55, 'fire-that-wouldnt-light', 'The Fire That Wouldn\'t Light', GROUP.ash, {
    place: { earliest: 'A1', home: 5, window: [3, 8], sits: 'optional', attaches: 'after', level: 'A-1', note: 'Seen again at Step 15 of the same stage: lit, or still trying.' },
    tags: ['Pokémon', 'Story'], cast: ['trainer.firebreather'], pokemon: 'cyndaquil', tint: '#2a1c14',
  },
  P(
    'A Cyndaquil stands in front of a cold campfire, straining with its whole body. Its back smokes a little. Nothing catches.',
    'Someone has left it a neat pile of sticks. Beside it, a young trainer is packing up his camp very slowly, like somebody who has given up waiting.',
    L('The trainer, Lysander: "It only lights when it\'s angry. And I don\'t want to make it angry."', 'Lysander: "I\'ve run out of ideas. I\'ve run out of everything."'),
  ), [
    ch('Take over its training.', out(P(
      'Lysander looks at you for a long moment. Then he holds the Ball out, relieved and sad at the same time. He asks for nothing at all.',
      'Lysander: "It deserves someone who knows what they\'re doing. Its flames are out when it starts a fight. Be patient with it."',
      'The Cyndaquil looks back at him once, and then up at you, and its back gives off one small puff of hopeful smoke.',
    ), flag('cyndaquil-taken'), joinQ('cyndaquil', 'slow-kindling'))),
    ch('Show it my Fire-type.', out(P(
      'Your Fire-type sits down beside the sticks and lights the fire slowly, one breath at a time, so the Cyndaquil can see every step.',
      'The Cyndaquil watches. It copies the breath. Its back catches: a small blue flame, then a real one, roaring up out of its fur.',
      'Lysander makes a noise like a laugh and a sob together. He presses a Charcoal into your hand. He won\'t let go of his Cyndaquil all afternoon.',
    ), flag('cyndaquil-lit'), bondUp(1, 'picked'), item('charcoal'), later('ne55-step-fifteen', 10)), { pick: { types: ['fire'] }, requires: [ptype('fire')] }),
    ch('Tell him to keep trying.', out(P(
      'You tell him it isn\'t about anger. You tell him to keep going. He sits back down on his pack, slowly, and looks at the sticks again.',
      'Lysander: "All right. One more day." He gives you a Charcoal from his bag. "I won\'t need it if it lights. I\'ll need it less if it doesn\'t."',
    ), ...kind(1), flag('cyndaquil-trying'), item('charcoal'), later('ne55-step-fifteen', 10))),
  ]),
  step(55, 'ne55-step-fifteen', 'Lysander, Further On', GROUP.ash, { cast: ['trainer.firebreather'], pokemon: 'cyndaquil', tint: '#2a1c14' },
    'Further down the same road, a boy waves both arms at you from beside a campfire. It is Lysander, with the Cyndaquil on his shoulder.', [
      ch('Go and see.', out('He has been waiting to tell someone.'), {
        branches: [
          { kind: 'ignored' },
        ].filter(() => false),
      }),
    ]),
  after(55, 'ne55-typhlosion-in-the-circuit', 'Lysander\'s Typhlosion', GROUP.ash, [flagIs('cyndaquil-lit'), flagAgo('cyndaquil-lit-seen')], { minStage: 4, cast: ['trainer.firebreather'], pokemon: 'typhlosion', tint: '#2a1c14', effect: 'fire' },
    P(
      'A crowd has gathered round a Circuit battle at the edge of town. In the middle of it, a Typhlosion stands in a ring of its own fire.',
      'Its trainer looks up and sees you, and his whole face changes. It is Lysander, a region older. The Typhlosion\'s collar blazes higher.',
    ), [
      ch('Ask for a battle.', fight('Lysander: "Its first real fire was because of you. Let\'s show you what it does now."', trainer('Lysander', { team: ['typhlosion'], size: 1, friendly: true, win: [$(500), bondUp(1, 'party')], lose: [bondUp(1, 'party')] }))),
      ch('Just watch him win.', out('You stay in the crowd. He wins. When he looks for you afterwards, you raise a hand, and he raises a fist with fire round it.', bondUp(1, 'party'))),
    ]),
];
// The Step 15 scene has two versions, by what the player chose at Step 5.
{
  const s15 = NE55[1]!;
  const go = (s15.choices as Json[])[0]!;
  go.success = out(P(
    'Lysander: "Look. Look!" The Cyndaquil\'s back is alight, steady as a lamp. It lights his fire with one breath, then lights it again, because it can.',
    'He can\'t stop grinning. Neither can the Cyndaquil.',
  ), flagAt('cyndaquil-lit-seen'));
  delete go.branches;
  (go as Json).branches = [
    { when: [flagIs('cyndaquil-trying')], text: P(
      'Lysander: "It did it! Once! It was mostly smoke. But there was a bit of fire in the smoke."',
      'The Cyndaquil puffs proudly. There is a little black scorch on the end of one stick, and Lysander has wrapped it in a handkerchief to keep.',
    ), effects: [bondUp(1, 'party')] },
  ];
}

// =====================================================================================================================
// CATEGORY 12. EVIL TEAMS
// =====================================================================================================================

const NE56: Json[] = [
  ne(56, 'grunts-mum', 'The Grunt\'s Mum', GROUP.team, {
    place: { earliest: 'A2', home: 5, window: [3, 8], sits: 'optional', attaches: 'town', level: 'A+0 if the tin is taken to him', note: 'The town; else Step 5. Needs team step 1 or more. "Take the tin": the next team scene on the path gains a small tin badge.' },
    requires: [team({ after: 1 })],
    tags: ['Evil Team', 'Story'], cast: ['trainer.aroma_lady'], tint: '#2a2028',
  },
  P(
    'A woman is handing out flyers in the square. On each one is a photo of a young man in a team uniform, grinning, his hat on crooked.',
    'The flyer says: "HAVE YOU SEEN MY SON? HE\'S NOT IN TROUBLE." The last four words are underlined twice.',
    L('Mrs. Castellanos: "He said it was a job with a hat. He doesn\'t write. He always wrote."', 'Mrs. Castellanos: "I baked. I didn\'t know what else to do. I baked."'),
    'She is holding a tin against her chest. You know the face in the photo. You have battled him.',
  ), [
    ch('"I\'ve seen him. He\'s all right."', out(P(
      'She sits down on the edge of the fountain, all at once, like a puppet with its strings cut. She doesn\'t cry. She just breathes for a while.',
      'Mrs. Castellanos: "All right. All right is all I wanted." She opens the tin and makes you take a biscuit. It is a Berry biscuit, still a little warm.',
    ), flagAt('grunt-mum-met'), item('sitrus-berry'))),
    ch('Take the tin to him.', out(P(
      'She presses the tin into your hands and holds on to it a moment longer than she needs to.',
      'Mrs. Castellanos: "Tell him I\'m not angry. Tell him there are more where these came from." She gives you a biscuit from the top, for the road. It tastes of Berries.',
    ), flag('team-grunt-tin'), flagAt('grunt-mum-met'), item('sitrus-berry'))),
    ch('Tell her what the job is.', out(P(
      'You tell her. All of it: the stolen Pokémon, the uniforms, the cages. She doesn\'t interrupt once.',
      'She goes very quiet. Then she folds the rest of her flyers, neatly, and puts them in her bag. She gives you a biscuit, very politely.',
      'Mrs. Castellanos: "Thank you. Now. Where is this Hideout?"',
    ), flag('team-mum-coming'), flagAt('grunt-mum-met'), item('sitrus-berry'))),
  ]),
  after(56, 'ne56-your-mum-sent-these', 'Your Mum Sent These', GROUP.team, [flagIs('team-grunt-tin'), team({ after: 2 })], { minStage: 3, tint: '#2a2028' },
    P(
      'A Grunt steps out across the path, Ball already in his hand. It is him: the face from the flyer, under the crooked hat.',
      'Grunt: "You again. Right. Let\'s get this over wi..." Then he sees what you are holding out.',
    ), [
      ch('"Your mum sent these."', out(P(
        'He takes the tin in both hands. He opens it and looks inside, and his face folds up like a child\'s.',
        'He can\'t battle. He sits down in the road and cries into the biscuits, and you sit with him until he can breathe. When you go, he is still holding the tin.',
      ), flag('team-grunt-home'), ...kind(1))),
    ]),
  after(56, 'ne56-the-bakery', 'The Bakery in the Next Region', GROUP.team, [flagAgo('grunt-mum-met')], { minStage: 4, tint: '#2c2418' },
    P(
      'A new bakery on the corner. In the window, a young man in a floury apron is setting out trays of Berry biscuits.',
      'He has the hat on, the team hat, turned backwards and covered in flour. He sees you through the glass and goes red to the ears.',
    ), [
      ch('Go in and buy a biscuit.', out('He won\'t take your money. He puts two in the bag instead of one. "Mum\'s recipe," he says, and doesn\'t say anything else, and doesn\'t need to.', item('sitrus-berry'), heal(0.25))),
    ]),
];

const NE57: Json[] = [
  ne(57, 'teams-recruitment-fair', 'The Team\'s Recruitment Fair', GROUP.team, {
    place: { earliest: 'A3', home: 9, window: [6, 12], sits: 'optional', attaches: 'town', tags: ['city'], level: 'A+0', note: 'The town; else Step 9. Needs team step 2 or more.' },
    requires: [team({ after: 2 })],
    tags: ['Evil Team', 'Story'], cast: ['trainer.roughneck'], tint: '#2c2a1c', effect: 'confetti',
  },
  P(
    'A cheerful stall in the market square, hung with balloons. The banner reads "CAREERS IN LOGISTICS. FREE HAT." A queue of teenagers stretches round the corner.',
    'Recruiter, smiling with every tooth: "Travel. Purpose. A family. Sign here, here and here."',
    'You pick up a contract from the pile. The first two pages are all smiles and pictures. The third page is in very small print.',
  ), [
    ch('Read page three aloud.', out(P(
      'You clear your throat and read it out, loud enough for the back of the queue. "\'The undersigned gives up their Pokémon to the organisation.\'"',
      'There is a silence. A girl at the front looks down at the Eevee in her arms. Then the queue leaves, all of it, quickly and without a word.',
      'The Recruiter is still smiling. It is a very different smile. Someone from the queue presses one of the free hats into your hand on the way past.',
    ), rep(1), flag('team-op-stopped'), flag('fair-read'), flag('free-hat'))),
    ch('Sign up, to get inside.', out(P(
      'You sign: here, here and here. The Recruiter shakes your hand warmly and gives you a uniform that almost fits, and the free hat.',
      'For the length of a road you are one of them. You learn the passwords, the shift times, which door is never locked. You learn which room nobody guards.',
    ), takeNode(), flag('team-uniform'), flag('free-hat'))),
    ch('Knock the stall over.', fight(
      'The balloons go up. The table goes over. Contracts go everywhere. Two Recruiters drop the smiles and reach for their Balls.',
      { ...trainer('Recruiters', { format: 'doubles', size: 2, win: [flag('fair-knocked'), flag('free-hat')] }), evil: 'grunt' },
    )),
  ], foreign(
    variant('the-interview', [flagIs('journalist-interview')], {
      notice: 'Someone in the queue nudges her friend and points at you. "That\'s the one from the paper." The whole queue turns round to listen before you have said a word.',
    }),
  )),
  after(57, 'ne57-the-ranger-trainee', 'The Ranger Trainee', GROUP.team, [anyFlag('fair-read', 'fair-knocked'), flagAgo('fair-seen')], { minStage: 5, cast: ['trainer.youngster_m'], tint: '#1c2c20' },
    P(
      'A Ranger trainee in a uniform that is too new is clearing a fallen branch off the road. She looks up, and goes pink.',
      'Trainee: "You won\'t remember me. I was in a queue. I had a pen in my hand. You read something out."',
    ), [
      ch('"I remember."', out('She doesn\'t believe you, and it doesn\'t matter. She salutes, badly, and lets your party past first.', rep(1))),
    ]),
];
// Every outcome of the fair marks the region, for the trainee a region later.
for (const c of NE57[0]!.choices as Json[]) {
  const s = c.success as Json;
  (s.effects as Json[]).push(flagAt('fair-seen'));
}

const NE58: Json[] = [
  ne(58, 'bosss-day-in-court', 'The Boss\'s Day in Court', GROUP.team, {
    place: { earliest: 'A8', home: 'The town of the stage after the Hideout', sits: 'must-see', attaches: 'town', note: 'Must-see when drawn. Needs the Hideout won.' },
    requires: [team({ ends: ['defeated', 'exposed'] })],
    tags: ['Evil Team', 'Story'], rarity: 'rare', tint: '#2a2420',
  },
  P(
    'A courtroom, wood-panelled and much too warm. The team\'s boss sits at the front in a very good suit, hands folded, looking rested.',
    'The gallery is packed. Nearly everyone has a Pokémon on their lap: some of them were in the cages under the Hideout, and their people are holding them very tight.',
    L('Judge: "The court calls a witness."', 'The boss turns, finds you, and smiles pleasantly. "Be accurate. That\'s all I ask."'),
  ), [
    ch('Tell all of it.', out(P(
      'You tell it all, from the first whisper to the last door. Some of it you saw. Some of it you were told by people too frightened to come.',
      'The lawyers object. The hearsay is struck out, line by line. But the rest sticks, and there is a great deal of the rest.',
      'Judge: "Guilty." The gallery doesn\'t cheer. A Growlithe on someone\'s lap barks once, and its owner lets it.',
    ), flag('team-convicted'), rep(2))),
    ch('Tell only what I saw.', out(P(
      'You tell only what you saw with your own eyes. It is short. It is exact. You don\'t look at the boss once.',
      'It is enough. The Files back up every word. Judge: "Guilty." The boss inclines his head to you, as if you have both played well.',
    ), flag('team-convicted'), rep(2)), {
      branches: foreign(
        { when: [flagIs('intel', 0, 2)], text: P('You tell only what you saw. It is short, and exact, and it is not quite enough: there is too little in the Files to hold it up.', 'Judge: "Not proven." The boss stands, buttons his jacket, and nods to you on his way out.'), effects: [flag('team-boss-free'), rep(2)] },
      ),
    }),
    ch('Speak for the Grunts who left.', out(P(
      'You tell the court about the ones who walked away: the Grunt with the tin, the ones who opened doors for you, the ones who were sixteen and wanted a hat.',
      'The court goes easy on them. The boss watches you the whole time, and at the end his face has something in it like respect.',
    ), flag('team-grunts-spared'), flag('team-boss-free'), ...kind(1), rep(2))),
  ], foreign(
    variant('the-lie', [flagIs('honest-lied')], {
      notice: 'The boss\'s lawyer stands before you can begin. "The witness has lied before, on this very road. The court will remember it." Your word counts for less now. The Files will need one more entry.',
      hide: [1],
      addChoices: [ch('Tell only what I saw.', out(P(
        'You tell only what you saw. It is short, and exact, and the lawyer picks at every word.',
        'The Files hold. Just. Judge: "Guilty." The boss looks at you as if he will remember that you nearly cost him nothing.',
      ), flag('team-convicted'), rep(2)), { branches: [{ when: [flagIs('intel', 0, 3)], text: 'You tell only what you saw. It is not enough, not from you, not now. Judge: "Not proven." The boss leaves by the front door.', effects: [flag('team-boss-free'), rep(2)] }] })],
    }),
  )),
];

const NE59: Json[] = [
  ne(59, 'stolen-pokemon-wont-come-home', 'The Stolen Pokémon That Won\'t Come Home', GROUP.team, {
    place: { earliest: 'A4', home: 'The + node after any Holding Pen', sits: 'optional', attaches: 'rest', note: 'Needs a Holding Pen cleared (until pens exist: one of the team\'s operations stopped).' },
    requires: [team({ stopped: 1 })],
    tags: ['Evil Team', 'Pokémon', 'Relationship'], cast: ['trainer.fairy_tale_girl'], pokemon: 'growlithe', tint: '#2a1c18',
  },
  P(
    'A girl is kneeling by the fire with her arms held out. In front of her, a Growlithe that was stolen from her, and freed today, is hiding behind your legs.',
    L('The girl, Posy-Rae: "Pepper? It\'s me. Pepper, it\'s me."', 'The Growlithe shakes. It was in the pen a long time. It has learned that hands reaching for it mean the bad kind of Ball.'),
  ), [
    ch('Give it time. Sit down, all of us (a node).', out(P(
      'You sit down. Posy-Rae sits down. Your whole team sits down. She talks about nothing: what she had for breakfast, a dream about a boat, the rain.',
      'It takes the length of a road. Bit by bit, the Growlithe creeps over on its belly, nose first, until its nose touches her knee. She keeps talking. Her voice only wobbles once.',
      'When it finally climbs into her lap, she gives you the Fire Stone she was saving for it. "It doesn\'t need to change. It just needed to come back."',
    ), takeNode(), flag('pepper-home'), ...kindFull(2), item('fire-stone'))),
    ch('Carry it to her.', out(P(
      'You pick it up. It lets you. It is all bones and fur and it is rigid in your arms.',
      'You put it in hers. It is stiff, stiff, and then, all at once, it is not. It pushes its whole face into her neck. She gives you her Fire Stone without looking away from it.',
    ), flag('pepper-home'), item('fire-stone'))),
    ch('Let it stay with me a while.', out(P(
      'Posy-Rae: "Will you bring it home? When it\'s ready?" You promise. She ties her own ribbon round its neck and lets you go.',
      'The Growlithe walks out of the camp pressed against your boot. It will travel with you for a stage, and decide for itself.',
    ), flag('pepper-guest'), { ...join({ species: ['growlithe'] }), direct: true })),
  ]),
  after(59, 'ne59-pepper-leads-the-way', 'Pepper Leads the Way', GROUP.team, [flagIs('pepper-guest'), age('pepper-guest', 1)], { minStage: 5, cast: ['trainer.fairy_tale_girl'], pokemon: 'growlithe', tint: '#2a1c18' },
    P(
      'In the morning the Growlithe with the ribbon is already up, waiting at the edge of the camp, tail going.',
      'It has decided. It sets off without you, looks back, and waits. You follow it for a long time, down roads you didn\'t plan to take, until a small house with a blue door.',
    ), [
      ch('Knock on the blue door.', out(P(
        'Posy-Rae opens it. The Growlithe goes past her like a shot, into the house, round the kitchen twice, and back into her arms.',
        'She is crying too hard to speak. She puts the Fire Stone she was saving into your hand, and closes your fingers over it.',
      ), flag('pepper-home'), { kind: 'tradeAway', want: { label: 'Pepper goes home', species: ['growlithe'] } }, item('fire-stone')), { requires: [line('growlithe')] }),
      ch('Tell her how it got lost.', out('Pepper is not with you any more, and you tell Posy-Rae the truth about that. She listens to all of it. Then she thanks you for bringing her the truth, at least.', flag('pepper-lost')), { requires: [noLine('growlithe')] }),
    ]),
];

/** The second crew at the museum: a roaming team (core/evil fields it with `evilTeam`). */
const crewA = (win: Json[]): Json => ({ ...trainer('Grunt', { size: 2, lv: 1, win }), evil: 'grunt' });
const crewB = (win: Json[]): Json => ({ ...trainer('Straggler', { size: 2, lv: 1, win }), evil: 'grunt', evilTeam: 'rocket-remnants' });
const NE60: Json[] = [
  ne(60, 'two-teams-one-target', 'Two Teams, One Target', GROUP.team, {
    place: { earliest: 'A6', home: 14, window: [11, 16], sits: 'must-see', attaches: 'instead', level: 'A+1, twice', note: 'Must-see when drawn. Needs two teams in the region (the run\'s team awake; the second crew is a roaming one). "Lock both doors": the node stays visible for the rest of the stage, with shouting.' },
    requires: [team({ after: 2 })],
    tags: ['Evil Team', 'Combat'], rarity: 'rare', tint: '#24202c',
  },
  P(
    'Two sets of Grunts in two different uniforms are robbing the same museum. They came in from different doors, quietly, and have just met in the middle, beside the glass case.',
    L('Grunt A: "We were here first."', 'Grunt B: "We have a schedule."', 'Grunt A: "We have a better schedule."'),
    'The curator is under a desk, watching it all like a tennis match. Both crews have just noticed you in the doorway.',
  ), [
    ch('Battle both.', fight(
      'They both turn on you at once. The first crew is nearer.',
      crewA([room('ne60-the-second-crew')]),
    )),
    ch('Make them fight each other.', out(P(
      'You tell Grunt A one true thing his rivals did to his team last month. You tell Grunt B one true thing the other lot did to theirs. Both are in the Files.',
      'There is a long, dangerous pause. Then they are at each other: Balls, fists, a very old vase. The relic is completely forgotten.',
      'You and the curator carry the glass case out of the side door together. Neither crew notices. She shakes your hand, then gives you something from the museum\'s own stores.',
    ), flag('teams-feud'), RARE())),
    ch('Lock both doors.', out(P(
      'Your Pokémon drags both heavy doors shut and seals them. The two crews are locked in a room with each other and nothing to steal.',
      'For the rest of the day you can hear them shouting from three roads away. The police are very, very pleased.',
      'The curator comes out from under the desk, dusts herself down, and gives you something from the museum\'s own stores.',
    ), rep(2), RARE(), bondUp(1, 'picked')), { pick: { types: ['steel', 'psychic'] }, requires: [anyType('steel', 'psychic')] }),
  ]),
  step(60, 'ne60-the-second-crew', 'The Second Crew', GROUP.team, { tint: '#24202c' },
    'The first crew runs for its door. The second crew is still standing by the glass case, and it has watched everything you did.', [
      ch('Battle them too.', fight('They come at you in a line.', crewB([flag('team-op-stopped'), flag('remnants-op-stopped'), flag('museum-saved'), RARE()]))),
    ]),
  after(60, 'ne60-the-curators-report', 'The Curator\'s Report', GROUP.team, [anyFlag('museum-saved', 'teams-feud', 'ne60-two-teams-one-target-done')], { minStage: 7, tint: '#24202c' },
    'A radio is playing in a café. The newsreader is reading out a museum report, word for word. It is extremely dry.', [
      ch('Listen.', out(P(
        '"At approximately eleven, two criminal organisations entered the building to steal the same object. This was inefficient of them."',
        'The whole café is laughing by the end. You catch yourself in the report, as "a passing trainer, unhurried."',
      ), heal(0.25))),
    ]),
];

// =====================================================================================================================
// CATEGORY 14. ROAD PEOPLE AND TOWN STORIES (the trades, category 13, are in _ne-trades.ts)
// =====================================================================================================================

const NE66: Json[] = [
  ne(66, 'town-with-one-clock', 'The Town With One Clock', GROUP.road, {
    place: { earliest: 'A2', home: 6, window: [4, 9], sits: 'optional', attaches: 'town', note: 'The town; else Step 6. While the clock is stopped the header shows no time; when it runs again it is wrong by an hour, and nobody minds.' },
    tags: ['Story', 'Pokémon'], cast: ['trainer.worker_m'], pokemon: 'klink', tint: '#2c2818',
  },
  P(
    'Everyone in the square is standing still, looking up at the town clock. It has stopped. They are arguing about what time it is.',
    L('Baker: "It\'s dawn. I\'ve baked."', 'Lamplighter: "It\'s dusk. I\'ve lit."', 'A child: "It\'s lunch. I\'m hungry."'),
    'Clock-keeper Ottokar, on a ladder against the clock face: "A Klink\'s gone from the works. Walked out. I think it was bored."',
  ), [
    ch('Find the Klink.', out(P(
      'You find it at the fair at the bottom of the hill, riding the carousel, round and round, with an expression of total peace.',
      'It will come back, you explain to Ottokar, if it gets Sundays off. He stands at the bottom of the ladder for a long time. Then he agrees.',
      'The clock starts with a clank. The whole town checks it. Ottokar gives you a bed for the night, and a pocket watch set to the right time.',
    ), flag('clock-klink'), flag('pocket-watch'), heal(1))),
    ch('Lend a Pokémon to the works (a node).', out(P(
      'Your Pokémon climbs into the works behind the clock face and takes hold of the big gear. It turns. The hands move. The square cheers.',
      'For a whole day the town runs on its mood. When it is cheerful the hours fly. When it gets bored the afternoon lasts forever. Nobody minds.',
      'Ottokar gives you a bed for the night and a pocket watch, and your Pokémon comes out of the works oily and proud.',
    ), takeNode(), bondUp(1, 'picked'), flag('pocket-watch'), heal(1)), { pick: { types: ['steel', 'electric'] }, requires: [anyType('steel', 'electric')] }),
    ch('Tell them the time.', out(P(
      'You look at the sun and tell them, quite reasonably, what time it is.',
      'Nobody believes a stranger. The baker goes back to his ovens and the lamplighter goes back to his lamps. The clock stays stopped.',
    ))),
  ]),
  after(66, 'ne66-closed-sundays', 'Closed Sundays', GROUP.road, [flagIs('clock-klink'), flagAgo('clock-klink-seen')], { minStage: 4, pokemon: 'klink', tint: '#2c2818' },
    P('You pass back through a town you remember. The clock is running. Under it, a small sign has been screwed to the wall.', '"CLOSED SUNDAYS. THE KLINK IS AT THE FAIR."'), [
      ch('Check your pocket watch against it.', out('They match, to the second, except that both are an hour out. Nobody here minds at all.')),
    ]),
];
for (const c of NE66[0]!.choices as Json[]) ((c.success as Json).effects as Json[]).push(flagAt('clock-klink-seen'));

const NE67: Json[] = [
  ne(67, 'ferrymans-last-crossing', 'The Ferryman\'s Last Crossing', GROUP.road, {
    place: { earliest: 'A3', home: 12, window: [9, 15], sits: 'must-see', attaches: 'instead', tags: ['water'], note: 'Must-see when drawn: it is the river. The bridge and the ferry are two real paths across the same step; crossing with him shows the hidden node on the far bank.' },
    tags: ['Story', 'Exploration'], cast: ['trainer.fisherman'], tint: '#10283a',
  },
  P(
    'A new bridge is being opened today. There are ribbons, and a band, and a mayor with very large scissors.',
    'Fifty metres downstream, a ferryman sits in his boat with nobody in it. He is watching the ribbons, and his face is very still.',
    L('Ferryman Lorcan: "Forty years. I know every stone in this river. Tomorrow nobody needs that."', 'Lorcan: "One more across? No charge."'),
  ), [
    ch('Cross with him.', out(P(
      'You step down into the boat. He pushes off, and as he rows, he tells you the river: where it floods in spring, which stones move, where the current lies about itself.',
      'Halfway over he stops rowing and points down. Far below, in a deep green pool, something long and blue is curled up asleep. "Dratini. Every winter. Nobody knows but me. And you."',
      'On the far bank there is a path you would never have seen from the bridge. In the shallows by the landing, a scale glints. He tells you to keep it.',
    ), flag('ferry-last'), ...kind(1), reveal(), item('dragon-scale'))),
    ch('Cross by the bridge.', out(P(
      'You walk over the new bridge with the crowd. The mayor shakes your hand, hard, for the photographer, and says you are the future.',
      'From the middle of the bridge you can see the ferry, still tied up, and the ferryman, still sitting in it.',
    ), rep(1))),
    ch('Ask what he\'ll do.', out(P(
      'He thinks about it for a long time, as if nobody has asked.',
      'Lorcan: "Teach kids the river, maybe. If anyone asks." He looks at the bridge. "Nobody will ask."',
    ), room('ne67-the-crossing'))),
  ], foreign(
    variant('haddons-manners', [flagIs('haddon-ferried')], {
      notice: 'Lorcan watches you step into the boat: weight low, hand on the side, sitting where you are put. "You\'ve a ferryman\'s manners. Someone taught you."',
    }),
  )),
  step(67, 'ne67-the-crossing', 'The Crossing', GROUP.road, { cast: ['trainer.fisherman'], tint: '#10283a' },
    'The band starts up on the bridge. Lorcan picks up his oars, and puts them down again, and waits to see which way you go.', [
      ch('Cross with him.', out(P(
        'You step down into the boat. As he rows, he tells you the river: where it floods, which stones move. Halfway over he points down at a deep pool. "Dratini. Every winter."',
        'On the far bank there is a path you would never have seen from the bridge. In the shallows by the landing, a scale glints. He tells you to keep it.',
      ), flag('ferry-last'), ...kind(1), reveal(), item('dragon-scale'))),
      ch('Cross by the bridge.', out('You walk over the bridge with the crowd. The mayor shakes your hand for the photographer. The ferry stays tied up below.', rep(1))),
    ]),
];

const NE68: Json[] = [
  ne(68, 'letter-for-a-house-thats-gone', 'The Letter for a House That\'s Gone', GROUP.road, {
    place: { earliest: 'A2', home: 7, window: [4, 12], sits: 'optional', attaches: 'after' },
    tags: ['Story', 'Mystery'], cast: ['trainer.worker_m'], pokemon: 'hoothoot', tint: '#24261c',
  },
  P(
    'A postman is standing in the middle of a field, holding a letter, looking at a chimney. There is no house round it. There hasn\'t been for a long time.',
    L('Postman Mr. Abara: "Forty-two Elm. There\'s an elm. There\'s a chimney."', 'Mr. Abara: "It\'s marked urgent. Thirty years ago. It fell behind a sorting frame."'),
    'Mr. Abara: "I can\'t open it. Rules. Thirty years and I\'ve never broken one. I don\'t know what to do."',
  ), [
    ch('Open it for him.', out(P(
      'He hands it to you and turns his back, so that he hasn\'t technically seen. You open it. It is one line, in a hand that shakes.',
      '"I forgive you. Come home."',
      'Nobody knows who to. Nobody knows from whom. Mr. Abara stands in the field for a long time. Then he gives you his spare whistle, because he doesn\'t know what else to do.',
    ), flag('letter-opened'), flag('abara-whistle'))),
    ch('Help find the family (a node).', out(P(
      'You ask in every house down the lane. An old man remembers the fire. A woman remembers the name. A boy remembers where they went.',
      'The granddaughter runs the inn in the next village. She reads the letter twice, standing at the bar, and then sits down on the floor behind it.',
      'When she can talk, she gives you both a room for the night and won\'t hear a word about paying. Mr. Abara writes "DELIVERED" in his book with enormous care.',
    ), takeNode(), flag('letter-delivered'), ...kindFull(2), heal(1))),
    ch('Leave it at the chimney.', out(P(
      'You prop the letter in the hearth, out of the rain. Mr. Abara nods slowly. It is, at least, the address.',
      'A Hoothoot drops out of the chimney, looks at the letter, and takes it back up inside, where it lives. Mr. Abara gives you his spare whistle and goes off whistling on his own.',
    ), flag('letter-hoothoot'), flag('abara-whistle'))),
  ]),
  after(68, 'ne68-forty-two-elm', 'Forty-Two Elm', GROUP.road, [flagIs('letter-delivered')], { minStage: 3, stop: 'rest', tint: '#24261c' },
    'You stop at an inn you know. The sign over the door has been taken down and repainted. In new gold letters it reads: "Forty-Two Elm."', [
      ch('Go in.', out('The granddaughter is behind the bar. She points at a frame on the wall: the letter, under glass. She pours you a drink and won\'t take your money, again.', heal(1))),
    ]),
];

const NE69: Json[] = [
  ne(69, 'boy-who-sells-directions', 'The Boy Who Sells Directions', GROUP.road, {
    place: { earliest: 'A1', home: 'A fork, 5 to 12', window: [5, 12], sits: 'optional', attaches: 'before', note: 'At a real fork, and what he sells is true: for ₽10 he names the better path; for ₽50 the map also marks its Berry tree and its rest spot.' },
    tags: ['Story', 'Exploration'], cast: ['trainer.youngster_m'], tint: '#2c2a1c',
  },
  P(
    'A boy sits on a milestone at a crossroads, swinging his legs, beside a hand-drawn sign: "DIRECTIONS ₽10. GOOD DIRECTIONS ₽50."',
    'The boy, Ferdinand: "The ₽10 ones are true. The ₽50 ones are true and nice."',
    'His shoes are held together with string. He has drawn a very careful map on the back of the sign, with little trees on it.',
  ), [
    ch('₽10.', out(P('He takes the coin and bites it, like he\'s seen someone do.', 'Ferdinand: "Left." He points left. It is the right way.'), $(-10), scout(3)), { requires: [money(10)] }),
    ch('₽50.', out(P(
      'Ferdinand: "Left, and there\'s a Berry tree at the bend, and the dog at the farm\'s friendly, and it gets pretty at the top."',
      'All of it is true. The tree is there, heavy with Berries. The dog is friendly. And at the top of the hill there is a spot so pretty that you stop, and sit, and rest.',
    ), $(-50), scout(3), item('sitrus-berry'), stopHere('heal')), { requires: [money(50)] }),
    ch('Why are you out here?', out(P(
      'He looks at his shoes.',
      'Ferdinand: "Saving for a Poké Ball. There\'s a Pidgey at the farm that likes me. I\'m ₽40 short. I\'ve been ₽40 short for a month."',
    ), room('ne69-forty-short'))),
  ]),
  step(69, 'ne69-forty-short', 'Forty Short', GROUP.road, { cast: ['trainer.youngster_m'], tint: '#2c2a1c' },
    'Ferdinand is pretending very hard that he didn\'t just tell you that.', [
      ch('Give him a Ball.', out(P('You put a Poké Ball in his hands. He holds it like it might break.', 'Ferdinand: "I\'ll pay you back. In directions. Forever." He is already running toward the farm.'), lose('poke-ball'), flag('ferdinand-ball')), { requires: [has('poke-ball')] }),
      ch('Give him ₽40.', out('He counts it three times. Then he runs, all the way down the road to the shop and back, with the Ball held over his head like a trophy.', $(-40), flag('ferdinand-ball')), { requires: [money(40)] }),
      ch('Buy more directions.', out(P(
        'He sells you the ₽50 ones, very seriously. There is a Berry tree at the bend. The dog is friendly. It gets pretty at the top.',
        'You stop at the top, and sit, and rest. When you look back down, he is counting the money again.',
      ), $(-50), scout(3), item('sitrus-berry'), stopHere('heal')), { requires: [money(50)] }),
    ]),
  after(69, 'ne69-free-directions', 'Free Directions', GROUP.road, [flagIs('ferdinand-ball'), age('ferdinand-ball', 1, 2)], { minStage: 2, cast: ['trainer.youngster_m'], pokemon: 'pidgey', tint: '#2c2a1c' },
    P('On the next route there is a boy at a fork with a Pidgey on his head. His sign has been painted over.', 'It says: "DIRECTIONS. FREE."'), [
      ch('Ask the way.', out('Ferdinand: "Left. And there\'s a Berry tree at the bend." The Pidgey points with its whole wing, in case you missed it.', scout(3), item('oran-berry'))),
    ]),
];

const NE70: Json[] = [
  ne(70, 'widows-scarecrow', 'The Widow\'s Scarecrow', GROUP.road, {
    place: { earliest: 'A2', home: 10, window: [7, 14], sits: 'side-branch', attaches: 'instead', tags: ['forest'], note: 'Normal or Grass stages.' },
    requires: [types('normal', 'grass')],
    tags: ['Story', 'Relationship'], cast: ['trainer.aroma_lady'], pokemon: 'murkrow', tint: '#24261c',
  },
  P(
    'A scarecrow stands in a field of corn, wearing a good suit. The suit is a little too big for it. A woman is straightening its tie.',
    L('Farmer Griselda: "His. His good suit. He\'d have hated it out here."', 'Griselda: "The crows liked him too, so it doesn\'t work."'),
    'A Murkrow is sitting on the scarecrow\'s shoulder, very comfortably, as if it owns the place.',
  ), [
    ch('Help with the crows.', out(P(
      'Your Pokémon charges into the corn. The crows go up in a great black sheet and away over the hedge.',
      'All but one. The Murkrow won\'t go. It moves along the scarecrow\'s arm, out of reach, and settles again. Griselda doesn\'t try to shift it.',
      'Griselda: "It was his. It used to sit on his shoulder just like that. While he worked." She fills a sack with corn for you anyway.',
    ), flag('scarecrow-murkrow'), ...CORN(), room('ne70-plant-enough'))),
    ch('Ask about him.', out(P(
      'She tells you. Fifty years in this field. Bad knees. A laugh you could hear from the road.',
      'Griselda: "He talked to that bird more than he talked to me. I talk to it now." The Murkrow cocks its head at her. She fills a sack with corn for you.',
    ), ...kind(1), ...CORN())),
    ch('Leave her to it.', out('You lift a hand and walk on. She waves, and goes back to the tie, and the Murkrow watches you to the end of the field.')),
  ]),
  step(70, 'ne70-plant-enough', 'Plant Enough for Both', GROUP.road, { cast: ['trainer.aroma_lady'], pokemon: 'murkrow', tint: '#24261c' },
    'The Murkrow is still there, on his shoulder, in his good suit. Griselda is looking at it the way you look at an old photograph.', [
      ch('"It can stay. Plant enough for both."', out(P(
        'She looks at you. Then she laughs: a real one, surprised out of her, the first in a long time, you can tell.',
        'Griselda: "He said that. Every spring. Word for word." She is still laughing, and wiping her eyes, when you leave.',
      ), flag('scarecrow-both'), flagAt('scarecrow-harvest'))),
      ch('Leave them be.', out('You leave the two of them in the field: the woman and the bird, and the suit between them.')),
    ]),
  after(70, 'ne70-two-scarecrows', 'Two Scarecrows', GROUP.road, [flagIs('scarecrow-both'), flagAgo('scarecrow-harvest')], { minStage: 5, pokemon: 'murkrow', tint: '#24261c' },
    'It is harvest time in a field you remember. There are two scarecrows now: one in a good suit, one in a flowered dress. The crows sit on both.', [
      ch('Wave to the farmhouse.', out('Someone waves back from the porch. On the porch rail sits a Murkrow, eating corn from a bowl.')),
    ]),
];

// =====================================================================================================================
// CATEGORY 15. WILD SCENES
// =====================================================================================================================

const NE71: Json[] = [
  ne(71, 'funeral-in-the-tall-grass', 'The Funeral in the Tall Grass', GROUP.wild, {
    place: { earliest: 'A2', home: 9, window: [5, 14], sits: 'optional', attaches: 'instead', tags: ['forest'], note: 'Before the battle; the wild battle does not happen. Normal or Grass stages. The node has no badge at all: the only hidden one of the hundred.' },
    requires: [types('normal', 'grass')],
    tags: ['Pokémon', 'Story'], pokemon: 'raticate', tint: '#1c2418',
  },
  P(
    'You expected a wild battle. Instead, a ring of wild Pokémon of a dozen different kinds is standing round something small in the grass. Predators and prey, side by side. None of them moves.',
    'It is an old Raticate, grey round the muzzle, very still. A Fearow, of all things, has brought a flower, and laid it down with its terrible beak.',
    'They notice you. Nobody runs.',
  ), [
    ch('Take off my hat and wait (a node).', out(P(
      'You take off your hat and stand at the edge of the ring. Your team stands with you. Nobody says anything, because nobody there can.',
      'It takes a long time. One by one, they go back into the grass. The Fearow goes last but one, and nods to you as it passes.',
      'The very last is a young Rattata. It sits beside the old one for a while. Then it looks at you, a long look, and goes.',
    ), takeNode(), flag('wild-funeral'), ...kind(1))),
    ch('Leave a Berry.', out('You step into the ring and leave a Berry by the flower. The Fearow watches you do it. Then it nods to you, once, slow and grave.', lose('oran-berry'), flag('funeral-berry')), { requires: [has('oran-berry')] }),
    ch('Back away.', out('You back away, quietly, the way you would leave a room where somebody is sleeping. They watch you go, every one of them, until the grass closes.')),
    ch('Battle.', fight(
      'You send your lead in. The ring breaks. The Fearow turns on you with a scream that has nothing in it but grief.',
      { ...wild({ species: ['fearow'], win: [quiet('stage', ['normal', 'flying', 'grass', 'bug'])] }), friendly: true, lose: [quiet('stage', ['normal', 'flying', 'grass', 'bug'])] },
    )),
  ]),
  after(71, 'ne71-the-young-rattata', 'The Young Rattata', GROUP.wild, [flagIs('wild-funeral')], { minStage: 3, pokemon: 'rattata', tint: '#1c2418' },
    'A young Rattata is sitting in the middle of the road, as if it has been waiting. You know it. It looked at you once, for a long time, over something small in the grass.', [
      ch('Crouch down and hold out a hand.', out('It sniffs your fingers, and then your boots, and then the whole of your team. Then it climbs into your bag as if it has decided something.', join({ species: ['rattata'] }))),
      ch('Let it go its own way.', out('It watches you pass, and then goes off into the grass, upright and certain, the way the old one must have walked.')),
    ]),
];

const NE72: Json[] = [
  ne(72, 'teacher-in-the-stream', 'The Teacher in the Stream', GROUP.wild, {
    place: { earliest: 'A1', home: 5, window: [3, 9], sits: 'optional', attaches: 'before', tags: ['water'] },
    tags: ['Pokémon'], pokemon: 'poliwrath', tint: '#10283a',
  },
  P(
    'A Poliwrath stands waist-deep in a clear stream. In front of it, in a row, float seven Poliwag.',
    'It does a stroke, slow and perfect. They copy it, badly, all splash and spin. It does the stroke again. They copy it again, a little less badly.',
    'One Poliwag keeps drifting off downstream. The Poliwrath wades over and fetches it back, without a trace of impatience. You count. It does this nine times.',
  ), [
    ch('Watch the lesson.', out('You sit on the bank with your boots off and watch the whole lesson to the end. It is the most restful thing you have seen in days.', heal(1))),
    ch('Let my Water-type join the class.', out(P(
      'Your Water-type slides into the stream at the end of the row. The Poliwrath looks it up and down, and then teaches it exactly as patiently as the others.',
      'By the end, your Pokémon has learned something. You can see it in how it moves.',
    ), bondUp(1, 'picked'), room('ne72-what-it-learned')), { pick: { types: ['water'] }, requires: [ptype('water')] }),
    ch('Help the one that drifts.', out(P(
      'You wade in and catch the drifter. It isn\'t drifting. It is watching fish, and birds, and the way the light moves on the water. It wants to be something else.',
      'When you climb out of the stream, it climbs out after you. The Poliwrath watches, and does not fetch it back this time.',
    ), flag('dreamer-joined'), joinQ('poliwag', 'dreamer'))),
  ]),
  step(72, 'ne72-what-it-learned', 'What It Learned', GROUP.wild, { pokemon: 'poliwrath', tint: '#10283a' },
    'Which lesson stuck? Point at your Water-type again.', [
      ch('Waterfall.', out('It learned to swim up, against the whole weight of the stream.', teach('waterfall')), { pick: { types: ['water'] } }),
      ch('Aqua Jet.', out('It learned to go from still to gone in one kick.', teach('aqua-jet')), { pick: { types: ['water'] } }),
    ]),
  after(72, 'ne72-on-the-bank', 'On the Bank', GROUP.wild, [flagIs('dreamer-joined'), { kind: 'partySpecies', species: 'politoed' }], { minStage: 3, pokemon: 'poliwrath', tint: '#10283a' },
    'Your Politoed hops ahead onto a riverbank and stops. On the far side, waist-deep, stands a Poliwrath with a row of Poliwag in front of it.', [
      ch('Wait while they look at each other.', out('The Poliwrath looks at the Politoed for a long time. Then it turns back to its class. Your Politoed sings the whole way to the next town.', { kind: 'friendshipLine', species: 'poliwag', amount: 10 })),
    ]),
];

const ENVOY = 'ne73-the-envoy';
const NE73: Json[] = [
  ne(73, 'border-dispute', 'The Border Dispute', GROUP.wild, {
    place: { earliest: 'A2', home: 8, window: [5, 12], sits: 'optional', attaches: 'before', tags: ['forest'], level: 'A+0 if the Berry is eaten' },
    tags: ['Pokémon', 'Mystery'], pokemon: 'sentret', tint: '#1c2c18',
  },
  P(
    'A line of Sentret stands on one side of a fallen log. A line of Zigzagoon stands on the other. On the log, exactly in the middle, sits a single Oran Berry.',
    'You step out of the trees. Both sides start chattering at you at once, pointing at the Berry, at each other, at the sky.',
    'Each side clearly thinks you have been sent to judge.',
  ), [
    ch('Split the Berry.', out(P(
      'You cut it exactly in half with great ceremony and give one half to each side.',
      'Both sides are dissatisfied, loudly and equally. And so the peace holds.',
    ))),
    ch('Give them each one of mine.', out(P(
      'You take two Oran Berries from your bag and set one on each side of the log.',
      'There is a long, suspicious silence. Then peace. The original Berry stays on the log, untouched, a monument. A Sentret and a Zigzagoon stay behind to see you off.',
    ), lose('oran-berry', 2), ...kind(1), flag('border-peace'), room(ENVOY)), { requires: [has('oran-berry', 2)] }),
    ch('Eat it.', fight(
      'You pick up the Berry and eat it. Both sides go silent. Then, for the first time in history, Sentret and Zigzagoon are united, against you.',
      { ...wild({ format: 'doubles', species: ['sentret', 'zigzagoon'], win: [flag('border-united'), room(ENVOY)] }), friendly: true, lose: [flag('border-united'), room(ENVOY)] },
    )),
  ]),
  step(73, ENVOY, 'The Envoy', GROUP.wild, { pokemon: 'zigzagoon', tint: '#1c2c18' },
    'Two small figures are still standing by the log: a Sentret and a Zigzagoon, side by side, chests out. Envoys. Each would like to go with you.', [
      ch('Take the Sentret envoy.', out('The Sentret stands up very tall and marches over. The Zigzagoon zigzags off to report.', join({ species: ['sentret'] }))),
      ch('Take the Zigzagoon envoy.', out('The Zigzagoon runs to you in a perfect zigzag. The Sentret stands up very tall and salutes.', join({ species: ['zigzagoon'] }))),
      ch('Send them both home.', out('You thank them both, very formally. They bow, very formally, and go back to their own sides of the log.')),
    ]),
  after(73, 'ne73-the-mixed-patrol', 'The Mixed Patrol', GROUP.wild, [flagIs('border-united')], { minStage: 4, pokemon: 'sentret', tint: '#1c2c18' },
    'A patrol trots across the road ahead of you: two Sentret, two Zigzagoon, in step. They stop, look at you, and give you a long, hard look.', [
      ch('Salute the patrol.', out('They salute back, all four of them, and march on into the trees. One of them is carrying an Oran Berry.')),
    ]),
];

const NE74: Json[] = [
  ne(74, 'night-stars-fell-into-lake', 'The Night the Stars Fell Into the Lake', GROUP.wild, {
    place: { earliest: 'A3', home: 15, window: [12, 18], sits: 'side-branch', attaches: 'instead', tags: ['water', 'night'] },
    tags: ['Pokémon', 'Legendary'], rarity: 'rare', cast: ['trainer.fisherman'], pokemon: 'starmie', tint: '#0c1430', effect: 'sparkle',
  },
  P(
    'The lake is full of light. Hundreds of Staryu and Starmie are rising to the surface at once, their cores blinking, red and gold and white.',
    'Overhead, a meteor shower is passing. They are answering it. Each streak in the sky gets a blink in the water.',
    'A night fisher, Eudora: "Once a decade. They think it\'s their relations." She hasn\'t touched her rod. "I\'ve seen it three times. I\'ve cried three times."',
  ), [
    ch('Watch.', out(P(
      'You sit down on the shore with your whole team and watch until the last star has gone.',
      'Nobody says anything. Nobody needs to. When the lake goes dark, your Pokémon are all leaning on you, and on each other.',
      'Eudora fishes a Star Piece out of the shallows and gives it to you without a word.',
    ), heal(1), bondUp(1, 'party'), item('star-piece'))),
    ch('Blink a torch at them.', out(P(
      'You blink your torch at the lake: once, twice, once. For a moment nothing happens.',
      'Then the whole lake blinks back. Once, twice, once. For a minute you are part of it: the sky, the water, and you, between them, answering.',
      'Something high above, far past the meteors, takes notice of that. Eudora gives you a Star Piece. "They\'ll remember you now."',
    ), flag('stars-answered'), telling('deoxys'), item('star-piece')), {
      branches: [{ when: [flagIs('telling-deoxys')], text: P(
        'You blink your torch at the lake: once, twice, once. Then the whole lake blinks back, and for a minute you are part of it.',
        'Something small and sleepy, far above, wakes up and hears you. Eudora gives you a Star Piece. "They\'ll remember you now."',
      ), effects: [flag('stars-answered'), telling('jirachi'), item('star-piece')] }],
    }),
    ch('Wade in.', out(P(
      'You wade in up to your knees. The lights swirl round your legs, warm, humming.',
      'When you wade out again, one Staryu has attached itself firmly to your bag, and it will not let go. Eudora laughs and gives you a Star Piece for it to look at.',
    ), join({ species: ['staryu'] }), item('star-piece'))),
  ]),
  after(74, 'ne74-the-first-blink', 'The First Blink', GROUP.wild, [flagIs('stars-answered'), { kind: 'period', in: ['night'] }], { minStage: 4, stop: 'rest', tint: '#0c1430', effect: 'sparkle' },
    'A clear night. Far off, on a lake you can barely see, one light blinks. Once, twice, once. It blinks first.', [
      ch('Blink back.', out('You blink your torch at it. Once, twice, once. The far light answers, and goes out, satisfied. You sleep better than you have in weeks.', heal(1))),
    ]),
];

const PANGORO = 'ne75-it-moves-over';
const NE75: Json[] = [
  ne(75, 'bully-of-the-watering-hole', 'The Bully of the Watering Hole', GROUP.wild, {
    place: { earliest: 'A3', home: 11, window: [8, 14], sits: 'optional', attaches: 'before', tags: ['hot'], level: 'A+1', note: 'Savanna or dry stages.' },
    tags: ['Pokémon', 'Combat'], pokemon: 'pangoro', tint: '#2c2414', effect: 'shake',
  },
  P(
    'There is one water hole for miles, and one tree beside it. A Pangoro sits in the only shade, by the only water. Everything else waits in the sun.',
    'A Skiddo creeps forward, tongue out, desperate. The Pangoro growls. The Skiddo goes back.',
    'The Pangoro has a leaf in its mouth, and it is chewing it hard. When it shifts its weight, it does it carefully. It has a limp it is hiding.',
  ), [
    ch('Battle it.', fight(
      'It comes out of the shade at you like a landslide. It fights hard, and badly, favouring the leg.',
      { ...wild({ species: ['pangoro'], lv: 1, win: [flag('pangoro-beaten')] }), friendly: true, lose: [] },
      flag('pangoro-fought'),
    )),
    ch('Look at its leg.', out(P(
      'You walk into the shade slowly, hands open. It growls the whole way. It doesn\'t get up. You kneel down by the leg.',
      'A thorn, long as your finger, driven deep into the pad. You are the first thing in days that it has let close enough to see. You pull it out in one go.',
      'It is ashamed afterwards. It won\'t look at you. And then it gets up, and limps along, and moves over. The Skiddo comes down to drink.',
    ), flag('pangoro-thorn'), ...kind(1), room(PANGORO))),
    ch('Bring water to the others (a node).', out(P(
      'You and your Water-type spend the length of a road carrying water out into the sun, to the ones waiting. Skiddo, a pair of Phanpy, things too small to name.',
      'The Pangoro watches the whole time. Gradually, a little at a time, it shifts along the trunk, until there is shade for two, then four.',
    ), takeNode(), ...kind(1), bondUp(1, 'picked'), room(PANGORO)), { pick: { types: ['water'] }, requires: [ptype('water')] }),
  ]),
  step(75, PANGORO, 'It Moves Over', GROUP.wild, { pokemon: 'pangoro', tint: '#2c2414' },
    'The Pangoro is sitting at the edge of the shade now, between the water and the open savanna, where something hungry would have to get past it. It looks at you.', [
      ch('Ask it to come with you.', out('It considers your team: the small ones especially. Then it gets up and stands at the back of them, like a wall. It has decided who it guards.', joinQ('pangoro', 'protector'))),
      ch('Leave it to guard the water.', out('You leave it there, on watch. As you go, the Skiddo settles down in the shade right beside it, and it lets it.')),
    ]),
  after(75, 'ne75-bamboo-shade', 'Shade for Everyone', GROUP.wild, [flagIs('pangoro-thorn'), flagAgo('pangoro-thorn-at')], { minStage: 5, pokemon: 'pangoro', tint: '#1c2c18' },
    'You pass the watering hole again. It doesn\'t look the same. A stand of young bamboo has grown up all the way round it, and there is shade for everyone.', [
      ch('Drink with them.', out('Skiddo, Phanpy, a Pangoro or two. Nobody growls. Somebody has planted bamboo, and you can guess who.', heal(0.5))),
    ]),
];
for (const c of NE75[0]!.choices as Json[]) ((c.success as Json).effects as Json[]).push(flagAt('pangoro-thorn-at'));

export const EVENTS: Json[] = [...NE51, ...NE52, ...NE53, ...NE54, ...NE55, ...NE56, ...NE57, ...NE58, ...NE59, ...NE60, ...NE66, ...NE67, ...NE68, ...NE69, ...NE70, ...NE71, ...NE72, ...NE73, ...NE74, ...NE75];
