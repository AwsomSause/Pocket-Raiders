// Greenneedle, part 1: events gn.01 to gn.05 (doc GREENNEEDLE_REWORKED_PLACED_1.md).
// gn.03 Viridian Forest, gn.04 Mt. Moon and gn.05 Damian's Unofficial Gym are written here in full.
// gn.01 Poli-Pond and gn.02 Pidgey's Resolve keep their own engines (core/episodes/poliPond.ts, core/sky); their scenes are in greenneedle-1b.ts.
// Build: npm run co:build -- greenneedle-1
import { $, any, at, ch, egg, fight, flag, has, inRegion, item, join, leave, money, out, room, trainer, wild, type Json } from '../dsl.ts';
import { bond, cap, chIf, eitherWay, exactly, gev, gn, inside, intel, is, leavePseudo, moment, not, rm, roll, route, say, setTo, teach, when, type Placement } from './_gn.ts';

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

export const EVENTS: Json[] = [...gn03];
export const REMOVE: string[] = [];

/** Placement as the doc gives it (written to src/data/catalogOverhaul/placement/greenneedle.json by tools/catalog-overhaul/gn-placement.ts). */
export const PLACEMENT: Record<string, Placement> = {
  'gn-03-door': { gn: 'gn.03', shape: 'Door', earliest: 'A1', home: 6, window: [4, 9], sits: 'must-see', attaches: 'instead', tags: ['Pseudo Stage', 'Rival Episode'], level: 'A-1', often: 'run', needs: ['forest'], dressing: { kanto: 'Viridian Forest', kantoStage: 'Pewter', elsewhere: 'The Old Wood' }, note: 'Six nodes. The duel is at equal levels.' },
};

/** Chain pseudo-stages of this file (written to src/data/catalogOverhaul/pseudo/greenneedle.json). */
export const CHAINS: Json[] = [
  { id: 'ps_gn_forest', name: "Viridian Forest: The Samurai's Challenge", entry: 'gn-03-door', themeId: 'grass-bug', tint: FOREST_TINT, mood: 'green light', start: 'opened' },
];

// Unused imports are kept for the events added below in this file.
void [$, any, at, money, cap, intel, route];
