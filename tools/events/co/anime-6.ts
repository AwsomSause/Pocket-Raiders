// Anime questlines, module 6: AQ9-AQ15, AQ17. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AQ9  The Muk That Hugs              (Single, two nodes;   script: QUESTLINES_ASH.md "AQ9")
//   AQ10 The Thirty Tauros              (Single;              script: QUESTLINES_ASH.md "AQ10")
//   AQ11 The Baby Lapras                (Companion;           script: QUESTLINES_ASH.md "AQ11")
//   AQ12 The Snorlax and the Melons     (Single;              script: QUESTLINES_ASH.md "AQ12")
//   AQ13 The Ghost Who Made Her Laugh   (Companion;           script: QUESTLINES_ASH.md "AQ13"; in Kanto, Haunter's Prank is its meeting)
//   AQ14 The Sap Thief                  (Single, three scenes; script: QUESTLINES_ASH.md "AQ14")
//   AQ15 The Jealous One                (Companion;           script: QUESTLINES_ASH.md "AQ15")
//   AQ17 The Herd's Little One          (Companion;           script: QUESTLINES_DEEPENED_2.md "AQ17")
// Build: npm run co:build -- anime-6
import { $, anyType, bondIs, ch, ev, fight, flag, flagIs, fr, item, leave, out, room, statusLead, takeNode, type Json } from '../dsl.ts';
import { AQ, gain, seen, stageOf, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ9: 'aq09-muk-that-hugs',
};

export const PLACEMENT: Record<string, Place> = {
  'aq09-muk-that-hugs': { shape: 'Single', earliest: 'A3', home: 'a + node', sits: 'optional', attaches: 'rest', note: 'Single: two nodes. It is outside the Pokémon Center; "Find it someone." takes the next two nodes.' },
};

/** Doc choices that are not buttons (questline -> label -> reason). */
export const NOT_A_BUTTON: Record<string, Record<string, string>> = {};

export const LIMITS: Record<string, string[]> = {
  AQ9: [
    'The hug poisons your lead Pokémon (until it is healed), not you: the player has no health of their own. The doc says the player is poisoned for one node.',
    'Remembers "the Polluted Factory was shut down" reads flag kanto-factory-cleared, which the Kanto Canon Spaces Polluted Factory (cs-kanto-fuchsia-factory) sets when its Magmuk is beaten.',
    'Afterstory "the NO MUK sign is gone in later runs" is not built (nothing crosses runs); the sign comes down in this run when the Muk is homed.',
  ],
};

/** Set after the questline was re-read line by line against its doc. */
export const CHECKED: Record<string, string> = {};

const ANY: string[] = [];

export const EVENTS: Json[] = [
  // ---------------- AQ9. The Muk That Hugs ----------------
  ev('aq09-muk-that-hugs', 'The Muk That Hugs', AQ, { rarity: 'uncommon', minStage: stageOf('A3'), types: ANY, cast: ['trainer.pr/nursery_aide'], pokemon: 'muk', tint: '#2a2238', effect: 'none',
    remembers: [
      { id: 'max-bond', when: [bondIs(5)], notice: 'The Muk looks along your line of Pokémon and stops at {most}. Something passes between them. {most} has been loved for a long time, and it knows what a hug is worth.', hide: [0],
        addChoices: [ch('Let it hug you.', out('It goes straight past you. It stops in front of {most}, opens its arms, and waits. {most} looks back at you once. Then it steps in and lets itself be held, smell and all, for a long, long moment, and it does not flinch. Nobody faints. When they part, the Muk is shining, and it follows {most} down the road like a little brother who has finally been let into the game.', fr(5, 'top'), gain('muk', { bond: 20 }), flag('aq-muk-hugged')))] },
      { id: 'factory', when: [flagIs('kanto-factory-cleared')], notice: 'You know that smell. It is the factory you shut down: the green fog, the grimy pipes. When you tell the nurse, she takes the peg off her nose. "It came from there? Then it never had a chance." She sits down on the step beside it, close enough to touch.' },
    ] },
    'A Pokémon Center, and a sign taped to its door in big red letters: NO MUK. A Muk is sitting outside it, on the step, in a small puddle of itself. It is very still, the way someone sits when they have been told to wait and nobody has come back. The nurse comes out with a peg on her nose. "It hugs everyone. It means well. Three people fainted." She looks at it, and her voice goes soft. "Its trainer left it here. She couldn\'t get a job, smelling like that." The Muk sees you. Its whole body lifts. It opens its arms.',
    [
      ch('Let it hug you.', out('You step in. It is warm, and wet, and it smells like a drain that has given up, and it holds on as if you might be the last person in the world. Your eyes stream. Your head swims. {lead} rushes in to pull you free and gets hugged too, and comes out green and wobbling. The Muk is overjoyed. It will not leave your side. When you walk on, it slides along behind you, humming to itself.', statusLead('poison'), gain('muk', { bond: 20 }), flag('aq-muk-hugged'))),
      ch('Bathe it first.', out('Your Water-type gives it everything: a spray, a soak, a long rinse in the Center\'s fountain. The fountain turns brown. The Muk comes out gleaming and smelling exactly the same. It looks at the Water-type that worked so hard for it, and before anybody can stop it, it hugs that one instead. Your Water-type, to its great credit, hugs it back. The Muk follows you both down the road, delighted to be clean, which it is not.', fr(5, { types: ['water'] }), gain('muk', { bond: 10 })), { requires: [anyType('water')] }),
      ch('Find it someone.', out('You ask at every door for two whole nodes of road. People are kind about it, from a distance. They close their windows kindly. Then, at the far end of town, a manhole cover lifts, and a man in waders climbs out and asks what all the fuss is about.', takeNode(2), room('aq09-sewage-worker'))),
    ]),
  ev('aq09-sewage-worker', 'Somebody Who Can\'t Smell', AQ, { room: true, cast: ['trainer.worker_m'], pokemon: 'muk', tint: '#2a2238', effect: 'none' },
    'He is Mr. Osgood Prall, and he has worked the sewers for thirty years. "Lost my sense of smell the first week. Best thing that ever happened to me." He looks past you at the Muk, and his face goes very quiet. "Is that one... does it hug?" He swallows. "Nobody\'s hugged me since my mum."',
    [
      ch('Introduce them.', out('The Muk does not need introducing. It goes to him like water going downhill and wraps him up, all of him, and he stands in the middle of the street with his eyes shut, holding on. When he can speak again, he presses something into your hand: a lump of Black Sludge, wrapped in a clean handkerchief. "For your Poison-types. And thank you. You don\'t know what you\'ve done." You think you might. When you pass the Center on your way out, the NO MUK sign has gone.', item('black-sludge'), flag('aq-muk-homed'), fr(2))),
    ]),
];

export const REMOVE: string[] = [];
