// Greenneedle, part 1: events gn.01 to gn.05 (doc GREENNEEDLE_REWORKED_PLACED_1.md).
// gn.03 Viridian Forest, gn.04 Mt. Moon and gn.05 Damian's Unofficial Gym are written here in full.
// gn.01 Poli-Pond and gn.02 Pidgey's Resolve keep their own engines (core/episodes/poliPond.ts, core/sky); their scenes are in greenneedle-1b.ts.
// Build: npm run co:build -- greenneedle-1
import { $, ch, egg, fight, flag, fr, has, heal, inRegion, item, join, leave, money, out, room, trainer, wild, type Json } from '../dsl.ts';
import { bond, chIf, eitherWay, exactly, fossil, gev, gn, inside, is, leavePseudo, moment, noMoveOf, not, notThisRegion, partyHas, pick, regionChanged, rm, roll, route, say, scene, setTo, stageMod, stampRegion, teach, weighted, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

// =====================================================================================================================
// gn.03  VIRIDIAN FOREST: THE SAMURAI'S CHALLENGE  (Pseudo Stage, six nodes; once per run)
// =====================================================================================================================
const FOREST_TINT = '#1f3a22';
const forest = (o: Json = {}): Json => ({ tint: FOREST_TINT, tags: ['Dungeon', 'Rival', 'Pokémon'], ...o });
const BUG_CATCHER = (name: string, win: Json[]): Json => inside(trainer(name, { cls: 'bug-catcher', size: 2, types: ['bug'], lv: -1, win }));

/** The duel itself: one on one, equal levels, no items, no switching. He answers a duelist that is weak to Flying with his Scyther. */
const SAMURAI_DUEL = (win: Json[], lose: Json[]): Json => ({
  ...inside(trainer('The Samurai', { cls: 'veteran', size: 1, team: ['pinsir'], win })),
  counter: { weakTo: 'flying', team: ['scyther'] },
  rule: { gn: 'samurai', leadMark: 'duelist', leadType: 'bug', matchLead: true, suddenDeath: true, noSwitch: true, noItems: true },
  lose,
});

const gn03: Json[] = [
  gev('gn-03-door', "Viridian Forest: The Samurai's Challenge", forest({
    stop: 'dungeon', rarity: 'rare', forced: true, minStage: 1, types: ['bug', 'grass'], effect: 'float', requires: [not('gn-03-entered')],
    remembers: [{
      id: 'kanto', when: [inRegion('kanto')],
      intro: say(
        'Viridian Forest. Everyone in Pewter has a story about it, and every story ends the same way: with a man in old armour, sitting very still in a clearing, waiting for somebody worth his time.',
        'The road goes in under the first branches and the day goes green and quiet behind you. Somewhere ahead a twig snaps, and then, very politely, does not snap again.',
        'It is six stops deep. You can still turn round here.',
      ),
    }],
  }), say(
    'The Old Wood. The people at the last crossroads lowered their voices when they named it, the way you do for a neighbour who might be listening.',
    'The road goes in under the first branches and the day goes green and quiet behind you. Somewhere ahead a twig snaps, and then, very politely, does not snap again.',
    'They say a man in old armour waits in a clearing in there. It is six stops deep. You can still turn round here.',
  ), [
    ch('Step under the trees.', out(
      'You step in. The light changes on your hands first. Behind you the road is already a bright coin at the end of a tunnel, and getting smaller.',
      flag('gn-03-entered'), setTo('gn-forest-in', 1), roll('gn-forest-fog', 10), roll('gn-forest-trap', 10), room('gn-03-eaves'),
    )),
    ch('Not today.', leave('You stand at the tree line a moment longer. The forest does not mind. It has waited for people before, and it will be here.')),
  ]),

  // ---- node 1: The Eaves ----
  rm('gn-03-eaves', 'The Eaves', forest({
    cast: ['trainer.bug_catcher'], effect: 'float',
    remembers: [{
      id: 'fog', when: [is('gn-forest-fog')],
      notice: 'And there is fog today, lying between the trunks like breath on glass. Nobody will aim well in it: every move, yours and theirs, is a tenth less sure until you leave the forest. Something pale may be drifting in it.',
    }],
  }), say(
    'The light goes green. It comes down through so many leaves that it has forgotten it was ever sunlight, and it lies on the path in coins that move when the wind does.',
    'A boy with a net taller than he is steps out of the ferns, so pleased to see another person that he forgets to look fierce.',
    '**Bug Catcher Arlo:** "Mind the man with the sword. He\'s all right. He\'s just very serious."',
    'Then he remembers he is a trainer, and plants his feet, and tries to look like one.',
  ), [
    ch('Battle Bug Catcher Arlo.', fight(
      '**Bug Catcher Arlo:** "Right! Yes! Battle! I knew that\'s what this was!"',
      BUG_CATCHER('Bug Catcher Arlo', [
        gn('duelist', { type: 'bug' }),
        when('gn-forest-trap', {}, [setTo('gn-forest-trap', 0), flag('flight-sighting'), moment('A net dropped on the party in the forest. Far above the leaves: a balloon with a cat\'s face.', 55)],
          'A net drops out of the branches onto your whole party! By the time you have fought free of it, there is only a shape far above the leaves: a balloon, with a cat\'s face, drifting away as if it had somewhere better to be.'),
        room('gn-03-gift'),
      ]),
    )),
  ]),

  // ---- node 2: The Forest Gift ----
  rm('gn-03-gift', 'The Forest Gift', forest({ pokemon: 'caterpie', effect: 'rattle' }), say(
    'The ferns ahead are shaking, and it is not the wind, because the wind has not found its way in here in years.',
    'Something small is in there, and it is not hiding. It is waiting to be found. The whole forest seems to lean in a little, the way a room does when someone is about to open a present.',
    'The first Bug-type you catch in this forest will walk beside you to the end of it. The others will notice.',
  ), [
    ch('Part the ferns.', fight(
      'You part the ferns. It looks up at you. It does not run. It was always going to be here, and so, it seems, were you.',
      inside({
        ...eitherWay(wild({ species: ['caterpie', 'weedle'], lv: -1, win: [gn('duelist', { type: 'bug' }), room('gn-03-oak')] })),
        rare: [{ species: ['shedinja'], chance: 0.01, flag: 'gn-forest-fog' }, { species: ['pinsir', 'scyther', 'heracross'], chance: 0.1 }],
      }),
    )),
  ]),

  // ---- node 3: The Split Oak (the voice from the trees after the fight; side path: the Beedrill Swarm, 40%) ----
  rm('gn-03-oak', 'The Split Oak', forest({
    effect: 'flicker',
    remembers: [
      { id: 'most', when: [is('gn-03-oak-won'), is('gn-forest-duelist'), exactly('gn-forest-rank', 2)], notice: 'The Bug Catcher has gone, and the fork is empty. A voice comes down out of the trees, from nowhere you can point to. **A voice:** "It watches your hands. That\'s trust."' },
      { id: 'some', when: [is('gn-03-oak-won'), is('gn-forest-duelist'), exactly('gn-forest-rank', 1)], notice: 'The Bug Catcher has gone, and the fork is empty. A voice comes down out of the trees, from nowhere you can point to. **A voice:** "It\'s eager. You\'re careful with it. Too careful?"' },
      { id: 'none', when: [is('gn-03-oak-won'), is('gn-forest-duelist'), exactly('gn-forest-rank', 0)], notice: 'The Bug Catcher has gone, and the fork is empty. A voice comes down out of the trees, from nowhere you can point to. **A voice:** "It walks beside you like luggage."' },
    ],
  }), say(
    'An oak that lightning opened long ago, and that went on growing anyway, in two directions, like an argument nobody won. The path runs straight through the split.',
    'A Bug Catcher\'s net leans in the fork. Off to one side, away from the path, a thicket is buzzing: a low, crowded sound, like a kettle with opinions.',
  ), [
    chIf([not('gn-03-oak-won')], 'Battle the Bug Catcher in the fork.', fight(
      'He drops out of the fork and lands badly and pretends he meant to.',
      BUG_CATCHER('Bug Catcher', [gn('duelist', { type: 'bug' }), flag('gn-03-oak-won'), room('gn-03-oak')]),
    )),
    chIf([not('gn-03-swarm-tried'), not('gn-forest-big')], 'Follow the buzzing off the path.', fight(
      'The thicket opens like a door kicked from the inside. Weedle on the low twigs, Kakuna hung in rows like lanterns, and above them the Beedrill, coming down in three waves. Stand through all three and whatever they were guarding is yours.',
      inside(wild({ species: ['weedle', 'kakuna', 'beedrill'], lv: -1, chain: 3, win: [item('poison-barb'), room('gn-03-oak')] })),
      flag('gn-03-swarm-tried'),
    ), {
      chance: 0.4,
      fail: out('You push through to the buzzing and find only an old nest, grey and papery, humming with nothing but the wind in its empty cells. Whatever lived here moved on. You go back to the path.', flag('gn-03-swarm-tried'), room('gn-03-oak')),
    }),
    chIf([is('gn-03-oak-won')], 'Walk on, deeper in.', out('You step through the split in the oak. For one stride there is a tree on either side of you, and both of them are the same tree.', room('gn-03-hollow'))),
  ]),

  // ---- node 4: The Hollow (side path: the Honey Tree, 30%; a Weedle waits if no Bug-type has been caught) ----
  rm('gn-03-hollow', 'The Hollow', forest({
    effect: 'glint',
    remembers: [{
      id: 'weedle', when: [{ kind: 'partyType', type: 'bug', absent: true }],
      notice: 'And in the middle of the path, exactly where you would have to step, sits a Weedle. It is not blocking the way. It is sitting the way someone sits who was told to wait here, and has, for longer than was reasonable.',
      addChoices: [
        ch('Crouch, and let the Weedle climb on.', out(
          'You put your hand flat on the moss. It considers the hand. Then it walks up your arm, one careful foot at a time, as if it had been waiting for exactly this arm, and settles against your collar. It was never lost. It was early.',
          { ...join({ species: ['weedle'], lv: -1 }), direct: true }, gn('duelist', { type: 'bug' }), room('gn-03-hollow'),
        )),
      ],
    }],
  }), say(
    'The path dips into a hollow where the oldest tree in the forest stands, so wide that its own roots have had to climb over each other. The bark smells sweet. Something has been at it.',
    'A Bug Catcher waits on the far side of the dip, tapping his net against his shoe.',
  ), [
    ch('Battle the Bug Catcher across the dip.', fight(
      'He has clearly been practising what to say, and forgets all of it, and throws the Ball instead.',
      BUG_CATCHER('Bug Catcher', [gn('duelist', { type: 'bug' }), room('gn-03-clearing')]),
    )),
    chIf([not('gn-03-honey-tried')], 'Look inside the sweet-smelling tree.', out(
      'Inside the trunk the dark is golden. Comb, hung in sheets, and a slow shifting of bodies far up where the hollow narrows. A den. They will not come down for a stranger. They might come down for honey, left at the roots, with no hand near it.',
      flag('gn-03-honey-tried'), flag('gn-03-den-found'), room('gn-03-hollow'),
    ), {
      chance: 0.3,
      fail: out('Inside the trunk there is old comb, long dry, and the ghost of sweetness. Whatever kept house here has gone. You brush the bark dust off your hands.', flag('gn-03-honey-tried'), room('gn-03-hollow')),
    }),
    chIf([is('gn-03-den-found'), not('gn-03-den-done')], 'Leave honey at the roots, and step back.', fight(
      'You set the honey down and walk away from it, which is the hard part. For a long minute nothing. Then a scrape of bark, and something comes down the trunk head first, slowly, watching you the whole way.',
      inside(eitherWay(wild({ species: ['combee', 'heracross'], win: [gn('duelist', { type: 'bug' }), room('gn-03-hollow')] }))),
      { kind: 'loseItem', id: 'honey' }, flag('gn-03-den-done'),
    ), { requires: [has('honey')] }),
  ]),

  // ---- node 5: The Clearing ----
  rm('gn-03-clearing', 'The Clearing', forest({
    cast: ['trainer.samurai'], effect: 'glint',
    remembers: [
      {
        id: 'accept', when: [is('gn-forest-duelist'), exactly('gn-forest-rank', 2)],
        notice: 'He looks at the Bug-type beside you for a long time, and it looks back, and neither of them seems to find the other wanting. **The Samurai:** "I accept."',
        addChoices: [ch('Step onto the duelling ground.', out('He stands. The stump he leaves behind is worn into the shape of a man who has waited a long time. He does not hurry. Neither, you notice, does your duelist.', room('gn-03-duel')))],
      },
      {
        id: 'barely', when: [is('gn-forest-duelist'), exactly('gn-forest-rank', 1)],
        notice: 'He looks at the Bug-type beside you, and then at you, and breathes out through his nose. **The Samurai:** "It\'ll do. Barely."',
        addChoices: [ch('Step onto the duelling ground.', out('He stands. The stump he leaves behind is worn into the shape of a man who has waited a long time. Your duelist edges half a step closer to your boot, and then, deliberately, half a step away again.', room('gn-03-duel')))],
      },
      {
        id: 'stranger', when: [is('gn-forest-duelist'), exactly('gn-forest-rank', 0)],
        notice: 'He looks at the Bug-type beside you. It looks at the ground. He closes his eyes. **The Samurai:** "You brought me a stranger." He will not duel it. Not until it has fought one battle at your side.',
        addChoices: [
          ch('Fight one battle beside it, here, now.', fight(
            'The ferns at the edge of the clearing are moving. You look at your duelist. For the first time since the eaves, you ask it for something.',
            inside({ ...eitherWay(wild({ types: ['bug'], lv: -1, win: [flag('samurai-refused'), room('gn-03-clearing')] })), rule: { leadMark: 'duelist' } }),
          )),
          ch('Bow, and leave the forest.', out(
            'You bow. He does not open his eyes, but he inclines his head, the exact depth you bowed and no deeper. The far side of the forest is brighter than you remembered daylight being.',
            flag('samurai-refused'), setTo('gn-forest-in', 0), gn('unmark', { key: 'duelist' }), leavePseudo(),
          )),
        ],
      },
    ],
  }), say(
    'A clearing. The first sky you have seen since the eaves. In the middle of it, on a stump, a figure in old armour sits so still that a Metapod has settled on the stump beside him, and hardens, with a small flourish, as if drawing a sword.',
    '**The Samurai:** "You carry a Bug-type. Good. I\'ve been watching it since the eaves."',
  ), [
    // Base scene: nobody walks beside the player (no Bug-type was caught and the Weedle was left on the path).
    chIf([not('gn-forest-duelist')], 'Tell him no Bug-type walks with you.', out(
      'He looks at the empty air beside your boot. **The Samurai:** "Then I was watching the wrong traveller." He says it without unkindness. The far side of the forest is brighter than you remembered daylight being.',
      flag('samurai-refused'), setTo('gn-forest-in', 0), leavePseudo(),
    )),
    chIf([not('gn-forest-duelist')], 'Bow, and leave the forest.', out(
      'You bow. He inclines his head, the exact depth you bowed and no deeper. The far side of the forest is brighter than you remembered daylight being.',
      flag('samurai-refused'), setTo('gn-forest-in', 0), leavePseudo(),
    )),
  ]),

  // ---- node 6: The Duel (and, after it, what he names) ----
  rm('gn-03-duel', 'The Duel', forest({
    cast: ['trainer.samurai'], effect: 'glint',
    remembers: [
      {
        id: 'won-evolved', when: [is('kanto-forest-samurai-won'), is('gn-forest-evolved')],
        intro: say(
          'It is over. The grass is flat where they circled. Your duelist is breathing hard and standing very straight, in a shape it did not have when you walked in under the eaves.',
          '*He sheathes the sword he never drew.*',
          '**The Samurai:** "Take this. It\'s not a gift. You\'ve already got it; I\'m only naming it."',
          '**The Samurai:** "It became itself in front of me. I\'ve an egg that deserves that."',
        ),
        addChoices: [ch('Take what he names, and the egg.', out(
          'He shows your duelist the cut once, slowly, the way you show something to an equal. Then he puts the egg in your hands with both of his, and holds on a moment longer than he needs to. You leave the forest carrying more than you brought in.',
          teach('samurai-slash', { type: 'bug' }), egg({ species: ['scyther', 'pinsir', 'heracross'], left: 3, unit: 'battle' }), flag('gn-03-done'), setTo('gn-forest-in', 0), gn('unmark', { key: 'duelist' }), leavePseudo(),
        ))],
      },
      {
        id: 'won', when: [is('kanto-forest-samurai-won')],
        intro: say(
          'It is over. The grass is flat where they circled. Your duelist is breathing hard and standing very straight, and it keeps glancing up at you to check that you saw.',
          '*He sheathes the sword he never drew.*',
          '**The Samurai:** "Take this. It\'s not a gift. You\'ve already got it; I\'m only naming it."',
        ),
        addChoices: [ch('Take what he names.', out(
          'He shows your duelist the cut once, slowly, the way you show something to an equal. It copies him. It gets it wrong. He nods as if it had got it right, and by the edge of the forest, it has.',
          teach('samurai-slash', { type: 'bug' }), flag('gn-03-done'), setTo('gn-forest-in', 0), gn('unmark', { key: 'duelist' }), leavePseudo(),
        ))],
      },
      {
        id: 'farfetchd', when: [is('gn-new-06-won')],
        notice: 'He watches how you stand before he says anything else. **The Samurai:** "You\'ve duelled before. It shows in the wrists."',
      },
    ],
  }), say(
    'One on one. Equal levels. No items. No switching. He has drawn a line in the grass with his heel, and stands behind it, and waits for you to notice there is one on your side too.',
    '**The Samurai:** "First cut decides most duels. Not this one. Begin."',
  ), [
    chIf([not('kanto-forest-samurai-won')], 'Begin.', fight(
      'Your duelist walks out to the line. It does not look small. Nothing does, standing where it has chosen to stand.',
      SAMURAI_DUEL(
        [flag('kanto-forest-samurai-won'), room('gn-03-duel')],
        [item('silver-powder'), flag('samurai-rematch-owed'), setTo('gn-forest-in', 0), moment('The Samurai bowed. "Next forest. I\'ll be at the far side."', 60)],
      ),
    )),
  ]),

  // ---- the rematch he owes: at the far side of the next forest ----
  gev('gn-03-rematch', 'The Far Side of the Forest', forest({
    stop: 'event', rarity: 'rare', callback: true, minStage: 2, types: ['bug', 'grass'], cast: ['trainer.samurai'], effect: 'glint',
    requires: [is('samurai-rematch-owed'), not('kanto-forest-samurai-won'), { kind: 'partyType', type: 'bug' }],
  }), say(
    'The trees thin. And there, at the far side, exactly where he said, a figure in old armour is sitting on a fence rail as if rails had been invented for the purpose.',
    'You remember how it ended last time. *He bowed.* **The Samurai:** "Next forest. I\'ll be at the far side."',
    'He gets down. He draws the line in the dirt with his heel. He has been waiting, and he is glad, and he would rather fall on the sword than say so.',
  ), [
    ch('Begin.', fight(
      'Same line. Same rules. One on one, equal levels, no items, no switching. Only the two of you are different.',
      SAMURAI_DUEL(
        [flag('kanto-forest-samurai-won'), teach('samurai-slash', { type: 'bug' }), flag('gn-03-done'), gn('unmark', { key: 'duelist' }), moment('"Take this. It\'s not a gift. You\'ve already got it; I\'m only naming it." The Samurai named the cut: Samurai Slash.', 65)],
        [moment('The Samurai bowed again. "Next forest. I\'ll be at the far side."', 50)],
      ),
    )),
    ch('Not yet.', leave('**The Samurai:** "Then next forest." He climbs back onto the rail. He would wait a year. You suspect he has.')),
  ]),

  // ---- afterstory: the Samurai who lost has copied the player's Bug-type ----
  gev('gn-03-after', 'A Familiar Stance', forest({
    stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, cast: ['trainer.samurai'], effect: 'glint',
    requires: [is('kanto-forest-samurai-won'), not('gn-03-after-done'), { kind: 'partyType', type: 'bug' }],
  }), say(
    'A figure in old armour by the road, drilling a Bug-type through a cut, over and over. You know the armour. You know the cut.',
    'Then you see the Bug-type. It is the same kind as yours. It opens with the same first move as yours. It even waits on the same foot.',
    '**The Samurai:** "Don\'t say anything. I lost. A man who loses and learns nothing has lost twice."',
  ), [
    ch('Spar with him.', fight(
      'He turns his copy to face your original. For once, he is the one who looks nervous.',
      { ...trainer('The Samurai', { cls: 'veteran', size: 1, mirror: true, win: [flag('gn-03-after-done'), bond(1)] }), rule: { leadType: 'bug', noItems: true } },
    )),
    ch('Bow, and walk on.', out('You bow. He bows. His Bug-type bows, a half-second late, and yours, without being asked, bows back.', flag('gn-03-after-done'))),
  ]),
];

// =====================================================================================================================
// gn.04  MT. MOON  (Pseudo Stage, seven nodes, three episodes; once per run)
// =====================================================================================================================
const MOON_TINT = '#2a2440';
const moon = (o: Json = {}): Json => ({ tint: MOON_TINT, tags: ['Dungeon', 'Pokémon', 'Treasure'], ...o });
const RAID_WON = 'team-raid-moon-won';
const RAID_LOST = 'team-raid-moon-lost';

/** After the dance's result: the mistaken Clefairy (20%), then the secret full-moon dance (25% with a Clefairy or Clefable along), then on. */
const SECRET_OR_ON: Json[] = [
  when('gn-moon-secret', { min: 1 }, [scene('gn-04-dance-secret')]),
  when('gn-moon-secret', { min: 0, max: 0 }, [room('gn-04-fossil')]),
];
const AFTER_DANCE: Json[] = [
  flag('kanto-moon-clefairy'),
  when('gn-moon-mistaken', { min: 1 }, [scene('gn-04-dance-mistaken')]),
  when('gn-moon-mistaken', { min: 0, max: 0 }, SECRET_OR_ON),
];

/** The grateful researcher, if the player beat the evil team in this cave. */
const GRATEFUL = when(RAID_WON, {}, [fossil('local')], 'The other one presses a second fossil into your hands. "For the raid. We remember who stood in the door."');
const RESEARCHER = (name: string, cls: string, lv: number): Json => inside(trainer(name, {
  cls, size: 3, team: ['magnemite', 'voltorb', 'koffing'], lv,
  win: [fossil('local'), GRATEFUL, flag('kanto-moon-fossil'), room('gn-04-mine')],
}));

/** One swing at the mine: the deposit's guardian first, then the find. */
const ORE_FACE: [string, number][] = [['moon-stone', 22], ['fire-stone', 14], ['water-stone', 14], ['thunder-stone', 14], ['leaf-stone', 14], ['sun-stone', 12], ['everstone', 10]];
const SEAM: [string, number][] = [['hard-stone', 1], ['metal-coat', 1], ['everstone', 1]];
const POCKET: [string, number][] = [['fire-stone', 1], ['water-stone', 1], ['thunder-stone', 1], ['leaf-stone', 1]];
const GEM: Json[] = [roll('gn-moon-gem', 10), when('gn-moon-gem', {}, [item('rare-candy'), item('metal-coat')], 'The rock gives way into a hollow full of colour. A Gem Vein!')];
const FIND = (table: [string, number][]): Json[] => [...weighted('gn-moon-find', table), ...GEM, flag('gn-moon-swings'), flag('kanto-moon-mine'), room('gn-04-mine')];
const GUARDIAN = (table: [string, number][]): Json => inside(eitherWay(wild({ types: ['rock'], win: FIND(table) })));
const SWINGS_LEFT = is('gn-moon-swings', 0, 2);

const GO_IN = (kanto: boolean): Json => ch('Go in.', out(
  'You duck under the lip of the rock. The air changes: colder, stiller, older. Your footsteps come back to you a half-second late, from somewhere far ahead.',
  flag('gn-04-entered'), setTo('gn-moon-kanto', kanto ? 1 : 0), stageMod('gn-moon-phase', 4), room('gn-04-mouth'),
));

const gn04: Json[] = [
  gev('gn-04-door', 'Mt. Moon', moon({
    stop: 'dungeon', rarity: 'rare', forced: true, minStage: 1, types: ['rock', 'ground', 'fairy'], effect: 'sparkle', requires: [not('gn-04-entered')],
    remembers: [{
      id: 'kanto', when: [inRegion('kanto')],
      intro: say(
        'Mt. Moon. The road out of Pewter runs straight at it and then gives up, and a dark mouth opens in the rock where the road should go.',
        'People in Pewter say a stone fell out of the sky here, long ago, and the mountain closed round it like a hand round a coin.',
        'Seven stops through, and daylight on the far side. Somewhere in the middle, they say, something dances.',
      ),
      hide: [0],
      addChoices: [GO_IN(true)],
    }],
  }), say(
    'The Moonlit Cave. A mountain with a hole in its roof, and a dark mouth at its foot that breathes out cold air and the smell of wet stone.',
    'Travellers say the moon shines straight down into the middle of it, once a night, and that something down there waits for it.',
    'Seven stops through, and daylight on the far side.',
  ), [
    GO_IN(false),
    ch('Not today.', leave('The mountain does not call after you. It has been here a long time, and it is not in a hurry.')),
  ]),

  // ---- node 1: The Mouth ----
  rm('gn-04-mouth', 'The Mouth', moon({
    cast: ['trainer.hiker'], effect: 'flicker',
    remembers: [
      { id: 'raid-won', when: [is(RAID_WON)], notice: 'On the walls, scratched over and half rubbed out, are the marks the raiders left. Someone has chalked a big tick beside each one. **Hiker:** "That was you, wasn\'t it. Thank you."' },
      { id: 'raid-lost', when: [is(RAID_LOST)], notice: 'On the walls are the marks the raiders left, fresh, and nobody has rubbed them out. **Hiker:** "They\'ve been through. Watch your pockets further in."' },
    ],
  }), say(
    'A hiker sits on a rock just inside, a lamp at his boots throwing his shadow huge across the roof.',
    '**Hiker:** "Going through? Good. Nobody should go through alone. Here, follow the lamp a while."',
    'He stands, and the shadows all swing round together, like a flock turning.',
  ), [
    ch('Follow the lamp in.', out(
      'He walks you as far as the first bend, then hands you the lamp and goes back to his rock. **Hiker:** "Leave it at the camp. Garrick will know whose it is."',
      room('gn-04-tunnels'),
    )),
  ]),

  // ---- node 2: The Low Tunnels ----
  rm('gn-04-tunnels', 'The Low Tunnels', moon({
    pokemon: 'zubat', effect: 'flicker', tags: ['Dungeon', 'Combat'],
    remembers: [{
      id: 'kanto', when: [is('gn-moon-kanto')],
      intro: say(
        'The roof comes down to meet you. Water ticks somewhere. And then the dark starts moving: a sound like a hundred umbrellas opening at once.',
        'Zubat. They don\'t stop. They have never once in their lives stopped.',
      ),
    }],
  }), say(
    'The roof comes down to meet you. Water ticks somewhere. And then the dark starts moving: wings, and then claws on stone, and then something rolling.',
    'Whatever lives down here does not stop. It has never once in its life stopped.',
  ), [
    chIf([is('gn-moon-kanto')], 'Push through the Zubat.', fight(
      'You put your head down and go. The lamp swings. The dark swings back.',
      inside(eitherWay(wild({ species: ['zubat', 'zubat', 'zubat', 'geodude', 'paras', 'clefairy', 'sandshrew'], chain: 2, win: [room('gn-04-camp')] }))),
    )),
    chIf([not('gn-moon-kanto')], 'Push through the dark.', fight(
      'You put your head down and go. The lamp swings. The dark swings back.',
      inside(eitherWay(wild({ types: ['rock', 'ground', 'fairy'], chain: 2, win: [room('gn-04-camp')] }))),
    )),
  ]),

  // ---- node 3: The Hiker's Camp (a rest) ----
  rm('gn-04-camp', "The Hiker's Camp", moon({ cast: ['trainer.hiker'], effect: 'none', tags: ['Dungeon', 'Recovery'] }), say(
    'A fire in a ring of stones, and an old hiker feeding it one stick at a time. He sees the lamp and nods: he knows whose it is.',
    '**Hiker Garrick:** "Sit. Eat something. You look like the tunnels."',
    '**Hiker Garrick:** "Midnight, by the skylight. Don\'t clap. I clapped. I\'ve regretted it nine years."',
  ), [
    ch('Rest by the fire.', out(
      'You sit. The fire is small and very warm. Your Pokémon pile up against you in the order they trust each other, and somebody starts snoring first, and it isn\'t you, quite.',
      heal(1), room('gn-04-dance'),
    )),
    chIf([not('gn-04-garrick')], 'Ask him why he clapped.', out(
      '**Hiker Garrick:** "Because it was beautiful. That\'s the only reason anybody claps." He pokes the fire. **Hiker Garrick:** "They went like smoke. Never came back to that stone. Not for me."',
      flag('gn-04-garrick'), room('gn-04-camp'),
    )),
  ]),

  // ---- node 4: Episode 1, Clefairy Moon Watching ----
  rm('gn-04-dance', 'Clefairy Moon Watching', moon({
    pokemon: 'clefairy', effect: 'sparkle',
    remembers: [
      { id: 'full', when: [exactly('gn-moon-phase', 3)], notice: 'The moon tonight is full. It fills the hole in the roof like a lid on a jar. The Clefairy are dancing as if they had been waiting all month.' },
      { id: 'new', when: [exactly('gn-moon-phase', 1)], notice: 'There is almost no moon tonight: a thin rind of it, and the Clefairy dance by starlight, carefully, as if the floor might not be there.' },
    ],
  }), say(
    'A shaft of moonlight comes down through a hole in the roof and stands on the floor of the cave like a pillar.',
    'Around a stone in the middle of it, a ring of Clefairy are hopping. Round and round, soft-footed, humming something with no tune.',
    'They haven\'t seen you.',
  ), [
    ch('Keep to the shadows, and watch.', out(
      'You set the lamp down and turn it low. You find a place in the dark and become part of it.',
      setTo('gn-moon-right', 0), partyHas('gn-moon-clef', 'clefairy', 'clefable'), roll('gn-moon-secret', 25),
      when('gn-moon-clef', { min: 0, max: 0 }, [setTo('gn-moon-secret', 0)]), roll('gn-moon-mistaken', 20), scene('gn-04-dance-1'),
    )),
    ch('Leave them to it, and go on.', out('You go round by the wall, slowly, and the humming follows you a long way down the next tunnel.', room('gn-04-fossil'))),
  ]),
  rm('gn-04-dance-1', 'The Dance', moon({ pokemon: 'clefairy', effect: 'sparkle' }), say(
    'The ring turns. One of them spins too fast and sits down hard and gets up again as if that had been the dance all along.',
    'They\'re dancing. What do you do?',
  ), [
    ch('Stay still.', out('You stay still. You barely breathe. The ring comes round past you, so close you could touch the nearest one, and it does not even look. You are a rock now. They dance around rocks.', flag('gn-moon-right'), scene('gn-04-dance-2'))),
    ch('Join in.', out('You step out and try the hop. They scatter like dropped marbles into every crack in the wall. A long minute. Then, one by one, slowly, they come back.', scene('gn-04-dance-2'))),
    ch('Clap.', out('You clap. It is beautiful, and that is the only reason anybody claps. They go like smoke. The stone in the middle stands alone in the moonlight. They don\'t come back.', setTo('gn-moon-mistaken', 0), setTo('gn-moon-secret', 0), scene('gn-04-dance-end'))),
  ]),
  rm('gn-04-dance-2', 'The Shard', moon({ pokemon: 'clefairy', effect: 'sparkle' }), say(
    'One of them breaks from the ring and pads over to you. It is holding something in both hands.',
    'One holds out a shard of stone to you. It glows faintly, the colour of the moon on water.',
  ), [
    ch('Stay quiet, and offer a Berry back.', out('You say nothing. You hold out a Berry on your open palm. It looks at the Berry, and at you, and takes it, and leaves the shard in its place. A fair trade. It goes back to the ring humming louder.', flag('gn-moon-right'), scene('gn-04-dance-3'))),
    ch('Take it.', out('You take it. It lets go, puzzled, and stands there with its empty hands still held out, as if waiting for the other half of something. Then it goes back to the ring.', scene('gn-04-dance-3'))),
    ch('Say thank you.', out('"Thank you," you say, and it is the loudest thing that has ever happened in this cave. The sound startles them. The ring stops dead. It takes them a long time to start again.', scene('gn-04-dance-3'))),
  ]),
  rm('gn-04-dance-3', 'The Smallest', moon({ pokemon: 'clefairy', effect: 'sparkle' }), say(
    'Something bumps your ankle. The smallest of them has come round behind you, the long way.',
    'The smallest hides behind your leg, and looks up.',
  ), [
    ch('Look up, too.', out(say(
      'You look up.',
      '*The moon is exactly over the hole. The stone in the middle is glowing. The small one\'s hand finds your sleeve.*',
    ), flag('gn-moon-right'), scene('gn-04-dance-end'))),
    ch('Pick it up.', out('You scoop it up. It squeaks, a high, offended sound, and wriggles free, and is back in the ring before its feet touch the floor.', scene('gn-04-dance-end'))),
    ch('Shoo it back.', out('You nudge it toward the others. It goes, slowly, looking back at you twice.', scene('gn-04-dance-end'))),
  ]),
  rm('gn-04-dance-end', 'When the Moon Moves On', moon({
    pokemon: 'clefairy', effect: 'sparkle',
    remembers: [
      {
        id: 'three', when: [exactly('gn-moon-right', 3)],
        intro: say(
          'The moonlight slides off the stone and up the wall, and the dance winds down with it. They drift away into the dark in twos and threes.',
          'One stays. It walks up to you, takes your sleeve the way the small one did, and does not let go.',
        ),
        addChoices: [ch('Let it come with you.', out('It hums the tune with no tune, once, at the stone, as if saying goodbye. Then it turns and follows you, and the light it leaves on the floor behind it is very faintly silver.', { ...join({ species: ['clefairy'] }), moves: ['moonblast'] }, ...AFTER_DANCE))],
      },
      {
        id: 'full', when: [exactly('gn-moon-right', 2), exactly('gn-moon-phase', 3)],
        intro: say(
          'The full moon slides off the stone and up the wall, and the dance winds down with it. You got one wrong. Under a full moon, it seems, one is forgivable.',
          'One stays. It walks up to you, takes your sleeve the way the small one did, and does not let go.',
        ),
        addChoices: [ch('Let it come with you.', out('It hums the tune with no tune, once, at the stone, as if saying goodbye. Then it turns and follows you, and the light it leaves on the floor behind it is very faintly silver.', { ...join({ species: ['clefairy'] }), moves: ['moonblast'] }, ...AFTER_DANCE))],
      },
      {
        id: 'two', when: [exactly('gn-moon-right', 2)],
        intro: say(
          'The moonlight slides off the stone and up the wall, and the dance winds down with it. They drift away into the dark in twos and threes.',
          'Where the ring was, someone has left a stone on the floor. Not the glowing one. A smaller one, round and pale, set down carefully, facing you.',
        ),
        addChoices: [ch('Pick up the Moon Stone.', out('It is cold, and heavier than it looks, and it fits your hand as if someone measured. A thank-you, or as near as they could manage.', item('moon-stone'), ...AFTER_DANCE))],
      },
    ],
  }), say(
    'They scatter. The moonlight slides off the stone and up the wall, and the cave is only a cave again.',
    'On the floor where the ring was, something small catches the lamp: a Moon Stone shard, dropped in the hurry.',
  ), [
    chIf([is('gn-moon-right', 0, 1)], 'Pick up the shard.', out('You pick it up. It is still faintly warm. You put it somewhere safe, and you think about Garrick, nine years on, poking a fire.', item('moon-shard'), ...AFTER_DANCE)),
  ]),
  rm('gn-04-dance-mistaken', 'Taken by the Hand', moon({ pokemon: 'clefairy', effect: 'hearts' }), say(
    'One Clefairy has got muddled. It has taken one of your Pokémon for one of its own, and has it by the hand, and is trying to lead it away into the ring.',
    'Your Pokémon looks back at you over its shoulder. It does not look worried. It looks like it is asking.',
  ), [
    ch('Let it dance one round.', out('One round. Your Pokémon is terrible at it and does not care. When the ring comes back past you, it lets go of the Clefairy\'s hand and trots over, holding something it was given: a sliver of moon.', bond(1), item('moon-shard'), ...SECRET_OR_ON)),
    ch('Call it back.', out('You call it softly. It comes, and the Clefairy lets go, puzzled, and watches it go with its empty hand still out.', ...SECRET_OR_ON)),
  ]),
  rm('gn-04-dance-secret', 'The Full Moon Dance', moon({ pokemon: 'clefable', effect: 'sparkle' }), say(
    'Your own Clefairy-kind has gone very still. Then it walks out into the light, and the ring opens for it, and closes behind.',
    'They dance again, and it is not the same dance. Slower. Wider. Something old in it. The stone in the middle burns white, and for a moment the whole cave is full moon.',
  ), [
    ch('Watch until the end.', out('When it is over your Pokémon comes back carrying a second Moon Stone, and one of the old ones walks behind it with an egg held in both arms, and gives it to you, and bows.', item('moon-stone'), egg({ species: ['cleffa'], left: 3, unit: 'battle' }), room('gn-04-fossil'))),
  ]),

  // ---- node 5: Episode 2, Fossil Recovery ----
  rm('gn-04-fossil', 'Fossil Recovery', moon({
    effect: 'none', tags: ['Dungeon', 'Trainer', 'Treasure'],
    remembers: [
      {
        id: 'payroll', when: [is(RAID_LOST)],
        notice: 'Dr. Crowe\'s coat is new. Very new. There is a badge on the lining you are not supposed to see, and he keeps glancing at the tunnel the raiders went down. He is on their payroll now, and he fights like it.',
        hide: [0],
        addChoices: [ch('Battle Dr. Crowe.', fight('**Dr. Ansel Crowe:** "Nothing personal. The pay is simply better than the university\'s."', RESEARCHER('Dr. Ansel Crowe', 'worker', 1)))],
      },
      { id: 'grateful', when: [is(RAID_WON)], notice: 'They both stop to look at you. **Dr. Mirabel Larkin:** "You\'re the one who ran them off." **Dr. Ansel Crowe:** "We\'re grateful. We\'re still not agreeing."' },
    ],
  }), say(
    'Two researchers at a folding table, each with a fossil, each pointing at the other\'s.',
    '**Dr. Ansel Crowe:** "His is a river pebble with ambitions."',
    '**Dr. Mirabel Larkin:** "Hers was carved last Tuesday. I can smell the chisel."',
    '*On the table between them, a third fossil, cracked, pushed to one side.*',
    '**Both:** "That? Worthless."',
  ), [
    ch('Battle Dr. Crowe.', fight('**Dr. Ansel Crowe:** "Fine. If you win, take Larkin\'s. No, take mine. Whoever loses, the fossil goes."', RESEARCHER('Dr. Ansel Crowe', 'worker', 0))),
    ch('Battle Dr. Larkin.', fight('**Dr. Mirabel Larkin:** "Science by combat. My favourite peer review."', RESEARCHER('Dr. Mirabel Larkin', 'aroma-lady', 0))),
    ch('Can I have the third one?', out(say(
      'They stop arguing. They look at the cracked fossil, and at you, and then at each other, and they both laugh at the same moment, which surprises them.',
      '**Dr. Mirabel Larkin:** "Take it. Nobody\'s fought over that one in years."',
      'You turn it over in the lamplight. The crack runs through something neither of them ever bothered to look at.',
    ), fossil('far'), GRATEFUL, flag('moon-third-fossil'), flag('kanto-moon-fossil'), room('gn-04-mine'))),
  ]),

  // ---- node 6: Episode 3, the Gem-Stone Mine ----
  rm('gn-04-mine', 'The Gem-Stone Mine', moon({
    effect: 'glint', tags: ['Dungeon', 'Treasure'],
    remembers: [{
      id: 'pickaxe', when: [noMoveOf('fighting', 'steel', 'ground')],
      notice: 'None of your Pokémon knows a move that could break rock. A pickaxe hangs on a nail by the sign, with a tin under it: ₽200 A SWING. HONESTY BOX. THE MOUNTAIN IS WATCHING.',
      hide: [0, 1, 2],
      addChoices: [chIf([SWINGS_LEFT], 'Rent the pickaxe and swing. (₽200)', out(
        'You put the coins in the tin. The pickaxe is heavier than it looks and swings itself, mostly. The ore face cracks along a line you didn\'t choose.',
        $(-200), ...weighted('gn-moon-find', ORE_FACE), ...GEM, flag('gn-moon-swings'), flag('kanto-moon-mine'), room('gn-04-mine'),
      ), { requires: [money(200)] })],
    }],
  }), say(
    'A wall of ore, glittering in three kinds: a rough ore face, a seam with metal running through it like a vein, and low down a buried pocket, packed with earth.',
    'A sign: THREE SWINGS PER VISITOR. THE MOUNTAIN IS COUNTING.',
    'Each swing wakes whatever guards that deposit. They are not pleased about it.',
  ), [
    chIf([SWINGS_LEFT], 'Swing at the ore face. (a Fighting move)', fight('Your Pokémon squares up to the rock and hits it. The rock hits back: something in the wall unfolds.', GUARDIAN(ORE_FACE)), { requires: [{ kind: 'partyMoveType', type: 'fighting' }] }),
    chIf([SWINGS_LEFT], 'Swing at the metal seam. (a Steel move)', fight('Steel on stone. Sparks. A shape peels itself off the seam and turns to look at you.', GUARDIAN(SEAM)), { requires: [{ kind: 'partyMoveType', type: 'steel' }] }),
    chIf([SWINGS_LEFT], 'Dig at the buried pocket. (a Ground move)', fight('The earth gives. Something in the earth objects.', GUARDIAN(POCKET)), { requires: [{ kind: 'partyMoveType', type: 'ground' }] }),
    ch('Walk on to the far side.', out('You shoulder your pack, heavier than it was, and follow the draught toward the daylight.', room('gn-04-far'))),
  ]),

  // ---- node 7: The Far Side ----
  rm('gn-04-far', 'The Far Side', moon({ effect: 'none', tags: ['Dungeon', 'Story'] }), say(
    'Daylight. It comes round the last bend like a shout, and you have to stand in the mouth a while with your eyes shut, letting it in.',
    'You sit on a rock at the edge of the light and count what you carried out of the mountain.',
  ), [
    ch('Count it.', out(
      'You lay it out on the rock in the sun.',
      when('kanto-moon-clefairy', {}, [], 'You saw the Clefairy dance. Nobody can take that out of your bag.'),
      when('moon-third-fossil', {}, [], 'The cracked fossil nobody wanted.'),
      when('kanto-moon-fossil', {}, [], 'A fossil, wrapped in your spare shirt.'),
      when('gn-moon-swings', {}, [], 'Ore dust in every seam of the bag, and what the mountain let you keep.'),
      flag('gn-04-done'), leavePseudo(),
    )),
  ]),

  // ---- afterstory: the two researchers, sharing a stall ----
  gev('gn-04-after', 'Two Fossils, One Stall', moon({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, effect: 'none', tags: ['Shop', 'Story'], requires: [is('kanto-moon-fossil'), not('gn-04-after-done')] }), say(
    'A market stall with one table and two chairs and two researchers, and a sign that has been crossed out and rewritten so many times the price is just a smudge.',
    '**Dr. Ansel Crowe:** "Fifteen hundred."',
    '**Dr. Mirabel Larkin:** "Five hundred. It\'s a pebble."',
    '**Dr. Ansel Crowe:** "It\'s YOUR pebble."',
  ), [
    ch('Pay the price in the middle. (₽1000)', out('You put a thousand on the table. They both open their mouths to object, then both close them, because neither of them can say the other was right. **Dr. Mirabel Larkin:** "Fine. Fine."', $(-1000), fossil('local'), flag('gn-04-after-done')), { requires: [money(1000)] }),
    ch('Leave them to it.', out('You leave them to it. Halfway down the street you hear them both laugh, at the same moment, which still surprises them.', flag('gn-04-after-done'))),
  ]),
];

// =====================================================================================================================
// gn.05  DAMIAN'S UNOFFICIAL GYM  (Single; recurs once per region, and grows. Walking past costs nothing; never the stage's Gym)
// =====================================================================================================================
const damian = (o: Json = {}): Json => ({ tags: ['Trainer', 'Story', 'Relationship'], ...o });
/** This week's theme (1 fire, 2 water, 3 "strong ones"): his team's types and, at the real Gym, his ace's egg. */
const THEMES: [number, string[], string][] = [
  [1, ['fire'], 'This week is fire: paper flames taped to every pillar, and a bucket of sand by the door, just in case.'],
  [2, ['water'], 'This week is water: blue streamers, a paddling pool in the corner, and a Magikarp drawn on the wall with a crown on.'],
  [3, ['fighting', 'rock'], 'This week is "strong ones": a punching bag made of a feed sack, and the word STRONG painted on it, twice.'],
];
/** A loss to any of them: the speech, and the node can be retried. */
const DAMIAN_LOST = [flag('damian-lost-once'), room('gn-05-lost')];
const FRIEND = (name: string, cls: string, size: number, rule?: string): Json => ({
  ...inside(trainer(name, { cls, size, lv: -2, win: [] })),
  ...(rule ? { rule: { gn: rule } } : {}),
  lose: DAMIAN_LOST,
});
const DAMIAN_FIGHT = (types: string[], size: number, lv: number, win: Json[]): Json => ({
  ...inside(trainer('Damian', { cls: 'ace-trainer', size, types, lv, win })),
  rule: { gn: 'damian', ace: 1 },
  lose: DAMIAN_LOST,
});
const withWin = (b: Json, win: Json[]): Json => ({ ...b, win });
/** Meeting `n` is done: he is met once per region, and comes back in the next one. */
const MET = (n: number): Json[] => [setTo('damian-meetings', n), stampRegion('damian-region'), stampRegion('damian-passed')];

const gn05: Json[] = [
  // ---- meeting 1: the barn ----
  gev('gn-05-barn', "Damian's Unofficial Gym", damian({
    stop: 'event', rarity: 'uncommon', minStage: 3, cast: ['trainer.damian'], effect: 'confetti',
    requires: [exactly('damian-meetings', 0), notThisRegion('damian-passed')],
    remembers: [
      {
        id: 'closed', when: [is('rain-damian-beaten')],
        intro: say(
          'A barn. Cardboard pillars painted grey. A hand-painted sign: **DAMIAN\'S ~~OFFISHAL~~ ~~OFFICAL~~ UNOFFICIAL GYM.**',
          'The door is shut. There is a note pinned to it, in the same hand as the sign, written smaller.',
          '*"Closed. Thinking."*',
        ),
      },
      { id: 'came-back', when: [is('damian-lost-once')], notice: '**Damian:** "You came back! Nobody comes back!" He says it like it is the best news he has had all year. It might be.' },
    ],
  }), say(
    'A barn. Cardboard pillars painted grey. A hand-painted sign: **DAMIAN\'S ~~OFFISHAL~~ ~~OFFICAL~~ UNOFFICIAL GYM.**',
    'Inside, the decorations say this week\'s theme is whatever Damian liked this week.',
    '**Damian:** "A challenger! Tully! TULLY! Positions!"',
    '**Tully:** "Which one\'s my position?"',
    '**Damian:** "The one I showed you! By the hay!"',
  ), [
    chIf([not('rain-damian-beaten')], 'Challenge the Gym.', out(
      '**Damian:** "YES. Right. Rules: you beat my Gym Trainers, then you face the Leader. That\'s me. I\'m the Leader."',
      pick('damian-theme', 1, 1, 1), ...THEMES.map(([n, , text]) => when('damian-theme', { min: n, max: n }, [], text)), room('gn-05-tully'),
    )),
    chIf([not('rain-damian-beaten'), not('gn-05-asked')], "Ask if it's a real Gym.", out(
      '**Damian:** "It\'s got a sign." He points at it, in case you missed it. He looks at it himself for a moment, proudly, the way you look at something you made.',
      flag('gn-05-asked'), room('gn-05-barn'),
    )),
    ch('Walk on.', out(
      'You walk on. Nobody shouts after you. Behind you, faintly, someone asks which one is the attack one.',
      stampRegion('damian-passed'),
      when('rain-damian-beaten', {}, [flag('damian-closed-thinking'), ...MET(1)], 'Whatever he is thinking about, he is thinking about it hard. You have a feeling you will find out next region.'),
    )),
  ]),
  rm('gn-05-tully', 'Gym Trainer Tully', damian({ cast: ['trainer.swimmer'], effect: 'none' }), say(
    'Tully stands by the hay, in his position, in swimming trunks, in a barn. He has two Poké Balls and is holding them like they might go off.',
    '**Tully:** "Damian says I\'m the first line of defence. Is that good? It sounds good."',
  ), [
    ch('Battle Tully.', fight('**Tully:** "Okay. Okay! Go, um. Go!"', withWin(FRIEND('Gym Trainer Tully', 'swimmer', 2, 'tully'), [room('gn-05-bex')]))),
  ]),
  rm('gn-05-bex', 'Gym Trainer Bex', damian({ cast: ['trainer.camper'], effect: 'none' }), say(
    'Bex is by the second pillar, the one that leans. Bex has read the instructions on the back of the Poké Ball twice and is starting a third time.',
    '**Bex:** "Which one\'s the attack one?"',
    '**Damian, from the back:** "TOP LEFT!"',
  ), [
    ch('Battle Bex.', fight('**Bex:** "Top left. Top left. Okay."', withWin(FRIEND('Gym Trainer Bex', 'camper', 2, 'bex'), [room('gn-05-damian')]))),
  ]),
  rm('gn-05-damian', 'Leader Damian', damian({ cast: ['trainer.damian'], effect: 'shake' }), say(
    'Damian is waiting at the far end of the barn, on a crate, under a banner that says LEADER. He jumps down. He lands well. He has practised.',
    '**Damian:** "Three of mine, and then the real one. Ready?"',
    'He holds up his last Poké Ball, and for a moment the shouting goes out of his face. **Damian:** "This one I actually trained."',
  ), THEMES.map(([n, types]) => chIf([exactly('damian-theme', n)], 'Battle Damian.', fight(
    '**Damian:** "GYM BATTLE! Real one! Well. Real-ish!"',
    DAMIAN_FIGHT(types, 4, 0, [room('gn-05-won')]),
  )))),
  rm('gn-05-won', 'Ha! HA!', damian({ cast: ['trainer.damian'], effect: 'confetti' }), say(
    '**Damian:** "Ha! HA! Good! That\'s— no, that\'s good. Here. I made these."',
    'He holds out a bottle cap with a pin glued to the back. It has been painted, carefully, in four colours, and one of them is still a bit wet.',
  ), [
    ch('Take the Bottle-Cap Badge.', out(
      'You pin it on. He watches you do it, and stands up a little straighter, as if you had pinned it on him. Then he presses a disc into your hand: Water Pulse. **Damian:** "Tully\'s idea. Don\'t tell him it was good."',
      item('bottle-cap-badge'), teach('water-pulse'), flag('kanto-cerulean-damian-won'), ...MET(1),
    )),
  ]),
  rm('gn-05-lost', 'Not Finished Yet', damian({ cast: ['trainer.damian'], effect: 'none' }), say(
    '**Damian:** "Listen. Losing\'s just winning that hasn\'t finished yet. You\'ve got to believe in yourself. Even when nobody— even when it\'s a barn."',
    '*He\'s not looking at you.*',
  ), [
    ch('Go again.', out('**Damian:** "Yeah? YEAH. Positions! Everyone back to positions!"', route('damian-meetings', 'gn-05-barn', 'gn-05-hall', 'gn-05-gym'))),
    ch('Walk on.', out('You walk on. When you look back, he is still standing in the door, and he lifts a hand, and you lift one back.', stampRegion('damian-passed'))),
  ]),

  // ---- meeting 2 (the next region): a rented hall ----
  gev('gn-05-hall', "Damian's Gym (Rented Hall)", damian({
    stop: 'event', rarity: 'uncommon', callback: true, minStage: 3, cast: ['trainer.damian'], effect: 'confetti',
    requires: [exactly('damian-meetings', 1), regionChanged('damian-region'), notThisRegion('damian-passed')],
    remembers: [
      {
        id: 'rain', when: [is('rain-saved'), is('rain-damian'), not('damian-asked-rain')],
        notice: 'Before anything else he takes you aside, by the elbow, away from the others. **Damian:** "The Fire-type. From the rain. Is it... how is it?"',
        hide: [0],
        addChoices: [
          ch("It's happy.", out('He nods, too many times. **Damian:** "Good. Good. That\'s all I— good." He goes back to the others, and shouts at them, and it is the happiest shouting you have ever heard.', flag('damian-asked-rain'), room('gn-05-hall'))),
          ch("It doesn't think about you.", out('He takes that. You watch him take it. **Damian:** "No. Course not. That\'s right, that\'s how it should be." He says it to the floor.', flag('damian-asked-rain'), room('gn-05-hall'))),
          ch('Come and see it.', out('He looks at you as if you have offered him something he cannot carry. **Damian:** "Yeah? At the next rest? I won\'t— I\'ll just sit. I\'ll just sit near it."', flag('damian-asked-rain'), flag('damian-visit'), room('gn-05-hall'))),
        ],
      },
      { id: 'thinking', when: [is('damian-closed-thinking')], notice: 'He is quieter than you have heard about. He shakes your hand properly, and holds on, and says only: **Damian:** "I did some thinking. Let\'s see if it helped."' },
      { id: 'came-back', when: [is('damian-lost-once'), is('damian-meetings', 1, 1)], notice: '**Damian:** "You! You came back! Nobody comes back, and you came back TWICE!"' },
    ],
  }), say(
    'A rented hall, with a stage at one end and folding chairs stacked along the walls. A banner: **DAMIAN\'S GYM.** No crossing out this time. Somebody checked the spelling.',
    'By the door stands a real Gym Trainer, in a real uniform, who is very clearly being paid and very clearly embarrassed about it.',
    '**Damian:** "You! Look! A hall! Tully and Bex know the buttons now! ALL the buttons!"',
  ), [
    ch('Challenge the Gym.', out('**Hired Gym Trainer:** "I\'m just here for the afternoon. Let\'s get this over with." Behind them, Damian is mouthing the words along, proudly.', room('gn-05-hall-hired'))),
    ch('Walk on.', out('You walk on. Damian waves from the door with both arms until you are out of sight.', stampRegion('damian-passed'))),
  ]),
  rm('gn-05-hall-hired', 'The Hired Gym Trainer', damian({ cast: ['trainer.ace-trainer'], effect: 'none' }), say(
    'The hired trainer does not look at Damian. The hired trainer does not look at anyone. The hired trainer is, however, actually good.',
  ), [
    ch('Battle the hired trainer.', fight('**Hired Gym Trainer:** "For the record, I told my friends I was at the dentist."', {
      ...inside(trainer('Hired Gym Trainer', { cls: 'ace-trainer', size: 2, lv: 0, win: [room('gn-05-hall-friends')] })), lose: DAMIAN_LOST,
    })),
  ]),
  rm('gn-05-hall-friends', 'Tully and Bex', damian({ cast: ['trainer.swimmer', 'trainer.camper'], effect: 'none' }), say(
    'Tully and Bex, side by side, three Poké Balls each. Tully has a wristband. Bex has a list of the buttons written on one hand.',
    '**Bex:** "Top left is the attack one. We checked."',
    '**Tully:** "Twice!"',
  ), [
    ch('Battle Tully and Bex.', fight('They throw at the same moment, which they have clearly practised, and are clearly delighted about.', {
      ...inside(trainer('Tully and Bex', { cls: 'swimmer', format: 'doubles', size: 6, lv: -2, win: [room('gn-05-hall-damian')] })), lose: DAMIAN_LOST,
    })),
  ]),
  rm('gn-05-hall-damian', 'Leader Damian', damian({ cast: ['trainer.damian'], effect: 'shake' }), say(
    'Damian on the stage, under a light somebody is holding for him. Four of his, and then the one he trained.',
    '**Damian:** "I got better. I want you to see. That\'s all. That\'s the whole reason."',
  ), THEMES.map(([n, types]) => chIf([exactly('damian-theme', n)], 'Battle Damian.', fight(
    '**Damian:** "Same as before. Except BETTER."',
    DAMIAN_FIGHT(types, 5, 0, [room('gn-05-hall-won')]),
  )))),
  rm('gn-05-hall-won', 'Better', damian({ cast: ['trainer.damian'], effect: 'confetti' }), say(
    '**Damian:** "Ha! Okay. OKAY. You\'re still better. But it was closer. Wasn\'t it closer?"',
    'It was closer.',
  ), [
    ch('Tell him it was closer.', out('**Damian:** "I KNEW it." He writes something down on the back of his hand. **Damian:** "Next time. Next time there\'ll be pillars."', bond(1), ...MET(2))),
  ]),

  // ---- meeting 3 (the region after): an inspected Gym ----
  gev('gn-05-gym', "Damian's Gym", damian({
    stop: 'event', rarity: 'rare', callback: true, minStage: 3, cast: ['trainer.damian'], effect: 'glint',
    requires: [exactly('damian-meetings', 2), regionChanged('damian-region'), notThisRegion('damian-passed')],
  }), say(
    'A Gym. A real one, inspected, with a certificate on the wall in a frame. The pillars are stone.',
    '**Damian:** "It\'s official. They sent a man with a clipboard. He said the pillars had to be real. So they\'re real."',
    '**Damian:** "I\'m not going to go easy on you. You never went easy on me. That\'s why there\'s pillars."',
  ), [
    ...THEMES.map(([n, types]) => chIf([exactly('damian-theme', n)], 'Challenge Damian.', fight(
      'He does not shout. He does not need to. He just nods, once, and throws.',
      DAMIAN_FIGHT(types, 6, 1, [room('gn-05-gym-won')]),
    ))),
    ch('Walk on.', out('You walk on. He does not wave this time. He nods, the way the real Gym Leaders do, and goes back inside to wait.', stampRegion('damian-passed'))),
  ]),
  rm('gn-05-gym-won', 'A Real Badge', damian({ cast: ['trainer.damian'], effect: 'confetti' }), say(
    'He looks at his ace for a long time after it goes down. Then he recalls it, and thanks it, quietly, so only it can hear.',
    '**Damian:** "There. That one\'s real. It\'s got a number on the back and everything."',
    'He hands you an egg as well, warm from his coat. **Damian:** "Its kid. It should go with someone who beat it properly."',
  ), [
    ch('Take the badge, and the egg.', out(
      'The badge has a number on the back. He is right. It is real. Beside it, in your bag, the bottle cap rattles, and you find you would not trade one for the other.',
      item('damian-badge'), ...THEMES.map(([n, types]) => when('damian-theme', { min: n, max: n }, [egg({ types, left: 3, unit: 'battle' })])), ...MET(3),
      moment('Damian\'s Gym is real now. The pillars are stone. He did not go easy.', 70),
    )),
  ]),

  // ---- the visit: he sits near the Fire-type at the next rest ----
  gev('gn-05-visit', 'Damian at the Fire', damian({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 3, cast: ['trainer.damian'], effect: 'fire', requires: [is('damian-visit'), not('damian-visit-done')] }), say(
    'He comes at dusk, as he said. He does not come close. He sits on the far side of the fire, a long way off, hands in his lap.',
    'The Fire-type looks at him for a long time. Then it gets up, and walks round the fire, and lies down against his boot.',
    'He doesn\'t move. He doesn\'t say anything. He just lets it.',
  ), [
    ch('Leave them be a while.', out('You go and see to something that does not need seeing to. When you come back he has gone, and the Fire-type is asleep, and there is a bottle cap on the ground beside it, painted orange.', fr(5, 'party'), flag('damian-visit-done'), moment('Damian came to the fire, and it let him.', 65))),
  ]),
];

export const EVENTS: Json[] = [...gn03, ...gn04, ...gn05];
export const REMOVE: string[] = [];

/** Placement as the doc gives it (written to src/data/catalogOverhaul/placement/greenneedle.json by tools/catalog-overhaul/gn-placement.ts). */
export const PLACEMENT: Record<string, Placement> = {
  'gn-04-door': { gn: 'gn.04', shape: 'Door', earliest: 'A1', home: 12, window: [10, 15], sits: 'must-see', attaches: 'instead', tags: ['Pseudo Stage', 'Exploration'], level: 'A+0', often: 'run', needs: ['cave', 'high'], dressing: { kanto: 'Mt. Moon', kantoStage: 'Pewter (after the forest)', elsewhere: 'The Moonlit Cave' }, note: 'Seven nodes, three episodes. Needs a cave OR high stage (either tag). Raid marks read team-raid-moon-won / team-raid-moon-lost.' },
  'gn-05-barn': {
    gn: 'gn.05', shape: 'Single', earliest: 'A3', home: 9, window: [7, 13], sits: 'optional', tags: ['Rival Episode'], level: 'friends A-2, Damian A+0, ace A+1', often: 'region',
    dressing: { kanto: 'Outside Cerulean', kantoStage: 'Cerulean', elsewhere: "Damian's Unofficial Gym" },
    beats: [
      { beat: 'Meeting 1: the barn', event: 'gn-05-barn', stage: 'A3', home: 9, window: [7, 13] },
      { beat: 'Meeting 2: a rented hall (next region)', event: 'gn-05-hall', stage: 'next region', home: 9, window: [7, 13] },
      { beat: 'Meeting 3: an inspected Gym (the region after)', event: 'gn-05-gym', stage: 'region after', home: 9, window: [7, 13] },
    ],
    note: 'At most once per region; walking past costs nothing; never the stage\'s Gym.',
  },
  'gn-03-door': { gn: 'gn.03', shape: 'Door', earliest: 'A1', home: 6, window: [4, 9], sits: 'must-see', attaches: 'instead', tags: ['Pseudo Stage', 'Rival Episode'], level: 'A-1', often: 'run', needs: ['forest'], dressing: { kanto: 'Viridian Forest', kantoStage: 'Pewter', elsewhere: 'The Old Wood' }, note: 'Six nodes. The duel is at equal levels.' },
};

/** Chain pseudo-stages of this file (written to src/data/catalogOverhaul/pseudo/greenneedle.json). */
export const CHAINS: Json[] = [
  { id: 'ps_gn_moon', name: 'Mt. Moon', entry: 'gn-04-door', themeId: 'rock-fairy', tint: MOON_TINT, mood: 'moonlight', start: 'opened' },
  { id: 'ps_gn_forest', name: "Viridian Forest: The Samurai's Challenge", entry: 'gn-03-door', themeId: 'grass-bug', tint: FOREST_TINT, mood: 'green light', start: 'opened' },
];
