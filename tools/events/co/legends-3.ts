// Catalog Overhaul Pack, legends: the Delta Anomalies D1 to D8 (QUESTLINES_ALPHAS_AND_ANOMALIES.md part three).
// D1 (Dr. Linden Vale's Delta Study) rebuilds the catalog ids delta-clue-nest/-scales/-song and delta-research-battle;
// the old form-clue-* and form-research-battle are merged into them. D2 to D8 are pack questlines (status `extra`).
// Each Delta left in its home adds 1 to `delta-studied`; each one taken adds 1 to `delta-caught`. Same-run memory only.
import { $, ch, ev, fight, flag, flagIs, fr, good, has, heal, item, leave, lose, money, moveFlag, out, ptype, room, rp, season, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { gift, sign } from './_legendsKit.ts';

export const CATEGORY = 'legends';

const G = 'Story: Delta Anomalies';
const R = { room: true, rarity: 'rare' as const };
const moment = (text: string, importance = 70): Json => ({ kind: 'moment', text, importance });
const studied = (code: string): Json[] => [flag('delta-studied'), flag(`delta-studied-${code}`)];
const caught = (code: string): Json[] => [flag('delta-caught'), flag(`delta-caught-${code}`)];
const starterIs = (species: string): Json => ({ kind: 'starter', species });
const fainted = (within = 18): Json => ({ kind: 'memberFainted', within });
const partySpecies = (species: string): Json => ({ kind: 'partySpecies', species });

// ---------------------------------------------------------------- D1. The Delta Study (Dr. Linden Vale)
/** Linden's question at every habitat: catch it, study it and leave it, or bring a sample to the lab (a Delta Ditto copies it). */
const lindensChoice = (code: string, species: string, ditto: string): Json[] => [
  ch('Catch it.', fight('It does not run. It only looks at you, then at the place it lives, then at you again.', wild({ species: [species], win: caught(code) }))),
  ch('Study it and leave it.', out(`You sit with your notebook until the light changes. Linden reads every page twice.\n\nLinden: "It's fine here. It's the only one of it. And now someone has written that down. That counts for something."`, ...studied(code), rp(25))),
  ch('Bring a sample to the lab.', out('A shed scale, carried carefully in a jar. At the lab a little Delta Ditto looks at it a long time, and then it is that colour too. The original stays where it lives. The Ditto comes with you.', flag(`delta-sampled-${code}`), gift(ditto))),
  ch('Leave it.', leave('You leave it to its strange, quiet home.')),
];

const clue = (id: string, name: string, intro: string, tint: string): Json =>
  ev(id, name, 'Delta Research', { rarity: 'uncommon', minStage: 1, requires: [flagIs('delta-journal')], cast: [], effect: 'sparkle', tint }, intro, [
    ch('Write it down in the Delta Journal.', out('You sketch it, note the place and the hour. Linden will want to see this. The pattern is getting clearer.', flag('delta-clue'), rp(15))),
    ch('Keep it for Linden.', out('You wrap it up and keep it safe. One more piece.', flag('delta-clue'), fr(1))),
    ch('Leave it.', leave('You leave it where it lies.')),
  ]);

const d1: Json[] = [
  ev('co-d1-linden', 'The Delta Study', G, { rarity: 'rare', requires: [flagIs('delta-journal', 0, 0)], cast: ['trainer.psychic_m'], pokemon: 'bulbasaur-delta', tint: '#7a9a60' },
    'A path through a meadow. A scale lies on the ground, the wrong colour for anything in this region.\n\nDr. Linden Vale, crouched over it with a jeweller\'s loupe: "Don\'t step on it. Please."\nLinden: "That\'s a Bulbasaur scale. Bulbasaur don\'t have scales."\nLinden: "Somewhere near here, something has changed to fit where it lives. I\'d like to know where."\nLinden: "I\'m too old for the hills. You\'re not."',
    [
      ch('"I\'ll help."', out('He gives you a worn notebook with a pressed leaf on the cover: the Delta Journal. "Odd nests. Scales out of place. Calls you don\'t know. Write them down. Three of them, and you\'ll find the place."', flag('delta-journal'), moment('Dr. Linden Vale gave you the Delta Journal.', 60))),
      ch('"What\'s in it for me?"', out('Linden: "Truthfully? Something nobody\'s seen. And a lens, if you see enough." He gives you the Delta Journal anyway. "Odd nests. Scales out of place. Calls you don\'t know. Three, and you\'ll find the place."', flag('delta-journal'), moment('Dr. Linden Vale gave you the Delta Journal.', 60))),
      ch('"Not now."', out('Linden: "No. Of course." He goes back to his scale. "I\'ll be about. I usually am." He will be waiting a region from now.')),
    ]),
  ev('co-d1-linden-again', 'The Delta Study: Linden Again', G, {
    rarity: 'rare', requires: [flagIs('delta-journal')], cast: ['trainer.psychic_m'], tint: '#7a9a60',
    remembers: [
      { id: 'lens', when: [flagIs('delta-studied', 5), flagIs('delta-lens', 0, 0)], notice: 'Linden holds out a brass lens. "Five. Five, and you left every one where it lived. Here. You\'ll see them now before they see you."', addChoices: [ch('Take the Delta Lens.', out('A brass lens with a green glass eye. Through it, the land looks the same, and a little stranger.', flag('delta-lens'), moment('Dr. Linden Vale gave you the Delta Lens.', 80)))] },
      { id: 'named', when: [flagIs('delta-studied', 3), flagIs('delta-named', 0, 0)], notice: 'Linden, pink in the face: "I\'ve put you in the paper. A species note. With your name on it. Don\'t argue."', addChoices: [ch('"Let me see."', out('There it is, in small print at the bottom of page nine: a sub-variety, named for you. You read it three times.', flag('delta-named'), moment('Dr. Linden Vale named a Delta variety after you in his paper.', 75)))] },
      { id: 'letter', when: [flagIs('delta-caught', 2), flagIs('delta-studied', 0, 0)], intro: 'Linden is not on the path today. There is a letter pinned to the signpost with your name on it.\n\n"I hope they\'re happy with you. I mean that. I won\'t be coming any more. L.V."', hide: [0, 1] },
    ],
  },
    'Dr. Linden Vale, on the path again, a little greyer, notebook open: "There you are. Show me."',
    [
      ch('Show him the journal.', out('He reads every page twice and hands it back. "Good. Keep going. They\'re out there."', rp(20), fr(1))),
      ch('"Where should I look next?"', out('Linden: "Wherever the ground is wrong. Ash that\'s cold. Steam in the snow. A shadow on a clear day."', rp(10))),
      ch('Leave it.', leave('You nod to him and walk on. He is already crouched over something else.')),
    ]),
  clue('delta-clue-nest', 'An Odd Nest', 'A nest built from materials that never grew here. Sea-glass and pine needles in a desert thorn. The eggs are missing.', '#2a301f'),
  clue('delta-clue-scales', 'Scales Out of Place', 'A shed scale in a colour the field guide does not list. Whatever left it came from another kind of habitat.', '#1f2a30'),
  clue('delta-clue-song', 'A Call You Do Not Know', 'A cry from the brush that no Pokémon of this region makes. It stops when you hold your breath, and starts again when you let it out.', '#2a1f30'),
  ev('delta-research-battle', 'The Delta Study', 'Delta Research', { rarity: 'rare', minStage: 1, requires: [flagIs('delta-clue', 3)], cast: ['trainer.psychic_m'], pokemon: 'bulbasaur-delta', effect: 'glint', tint: '#1f2a30' },
    'The clues point to one clearing. The grass here is the wrong colour, and so is the Bulbasaur sitting in the middle of it: pale pink and violet, its bulb a smooth crystal that hums.\n\nLinden, out of breath behind you: "There. There it is. Look at it."\nLinden, at each habitat, always the same: "It\'s fine here. It\'s the only one of it. What will you do?"',
    lindensChoice('bulbasaur', 'bulbasaur-delta', 'ditto-delta-psychic').map((c, i) => (i === 3 ? c : { ...c, success: { ...(c as { success: { effects: Json[] } }).success, effects: [...(c as { success: { effects: Json[] } }).success.effects, flag('delta-clue', -3)] } }))),
];

// ---------------------------------------------------------------- D2. The Ghost Dragon of the Burnt Valley (Delta Charizard)
const d2: Json[] = [
  ev('co-d2-valley', 'The Ghost Dragon of the Burnt Valley', G, { rarity: 'rare', cast: ['trainer.hiker'], pokemon: 'charizard-delta', tint: '#707070', effect: 'fog' },
    'A valley burned grey decades ago. Nothing grows. In the middle, a Charizard made of smoke and pale fire, curled around a single ember.\n\nOld forester, at the valley mouth: "It\'s been in there since the fire. Hatched after. Everything else was dead."\nForester: "Its fire went inward. That\'s what I think. Turned it into what it is."\nThe Charizard lifts its head. The ember in its claws flickers.\nForester: "That ember\'s going out. It knows."',
    [
      ch('Carry the ember out.', out('Your Fire-type takes the ember in its own flame, gently, the way you would hold a bird. The Charizard rises and follows, a long grey shape at the edge of sight. "Three stages," the forester says. "Don\'t let it go out."', flag('ghostdragon-carried'), sign('ho-oh')), { requires: [ptype('fire')] }),
      ch('Catch it.', fight('It does not want to come. It fights with a cold, quiet fire.', wild({ species: ['charizard-delta'], win: [flag('ghostdragon-forced'), ...caught('charizard')] }))),
      ch('Sit with it.', out('You sit down in the ash. Nobody says anything for a long time. The ember goes out. The Charizard lays its head down beside it and fades like smoke in the morning.\n\nWhen you stand, there is one green blade of grass where the ember was.', flag('ghostdragon-sat'), ...studied('charizard'), heal(1), moment('You sat with the Ghost Dragon of the Burnt Valley while its ember went out. The valley grew its first grass.', 80))),
      ch('Leave it.', leave('You leave the valley to its grey quiet.')),
    ]),
  ev('co-d2-ember', 'The Ghost Dragon: The Ember', G, {
    callback: true, rarity: 'rare', requires: [flagIs('ghostdragon-carried'), flagIs('ghostdragon-lost', 0, 0)], pokemon: 'charizard-delta', tint: '#806050', effect: 'fog',
    remembers: [
      { id: 'starter', when: [starterIs('charmander')], notice: 'Your Charmander has carried it the whole way, tail held high. It has never once flickered. It will not.' },
      { id: 'dims', when: [fainted(18)], intro: 'The ember dims. One of your Pokémon fell, and the flame went small and blue. The Charizard roars from somewhere behind.', hide: [0], addChoices: [
        ch('Use a Revive to wake it.', out('Your Pokémon wakes, and the ember catches again, smaller than before. One stage left.', lose('revive')), { requires: [has('revive')] }),
        ch('Let the ember go.', out('You let it go. It drifts up and out like a spark from a fire. The Charizard lies down where it lands and fades. One green blade of grass grows there.', flag('ghostdragon-lost'), flag('ghostdragon-sat'), ...studied('charizard'))),
      ] },
    ],
  },
    'The ember still burns in your Fire-type\'s keeping. Behind you, at the edge of sight, a grey shape follows.',
    [
      ch('Walk on, carefully.', out('Another stage. The ember holds.', flag('ghostdragon-steps'))),
    ]),
  ev('co-d2-out', 'The Ghost Dragon: Out of the Valley', G, { callback: true, rarity: 'rare', requires: [flagIs('ghostdragon-carried'), flagIs('ghostdragon-steps'), flagIs('ghostdragon-lost', 0, 0)], cast: ['trainer.hiker'], pokemon: 'charizard-delta', tint: '#c08040', effect: 'sparkle' },
    'Green country. The ember flares up, bright and warm for the first time in its life, and the Charizard comes close enough to touch. Its smoke has colour in it now.\n\nThe forester, who has walked all this way behind you: "Well. Well, look at that."',
    [
      ch('Hold out the ember to it.', out('It takes the ember back. Its fire goes outward again, and the grey becomes dusk-purple, and it stays. It is yours, and the stone that answers it is yours too.', ...caught('charizard'), gift('charizard-delta'), item('delta-charizardite'), moment('The Ghost Dragon followed its ember out of the Burnt Valley and joined you.', 90))),
    ]),
];

// ---------------------------------------------------------------- D3. The Four Seasons Snorlax
const SEASON_FORM = { Spring: 'blossom', Summer: 'summer', Autumn: 'autumn', Winter: 'winter' } as const;
const awake = (s: keyof typeof SEASON_FORM): Json =>
  ch(`Catch the awake one (${SEASON_FORM[s][0]!.toUpperCase()}${SEASON_FORM[s].slice(1)}).`, fight('It stands up, yawning, and it is the size of a house.', wild({ species: [`snorlax-delta-${SEASON_FORM[s]}`], win: [flag(`seasons-${SEASON_FORM[s]}`), flag('seasons-caught'), ...caught('snorlax')] })), { requires: [season(s)] });
const visit = (s: keyof typeof SEASON_FORM): Json =>
  ch(`Sit with the ${s} one.`, out(`You sit on the hill a while in ${s.toLowerCase()} light, and the ${SEASON_FORM[s]} Snorlax opens one eye at you. That is enough.`, flag(`seasons-visit-${SEASON_FORM[s]}`), flag('seasons-visit')), { requires: [season(s), flagIs(`seasons-visit-${SEASON_FORM[s]}`, 0, 0)] });
const d3: Json[] = [
  ev('co-d3-hill', 'The Four Seasons Snorlax', G, {
    rarity: 'rare', cast: ['trainer.youngster_m'], pokemon: 'snorlax-delta', tint: '#80a060',
    remembers: [{ id: 'watching', when: [flagIs('seasons-watch')], notice: 'You come back to the hill. The child is still there.' }],
  },
    'A hill with four hollows. In one of them, a huge sleeping shape is coloured like the season. The other three are buried under leaves, snow or petals.\n\nA child, sitting on the hill: "They take turns. My gran says."\nChild: "Blossom wakes in spring, Summer in summer. You know."\nChild: "She says once, she saw all four awake. And a fifth one underneath."',
    [
      ch('Catch the awake one.', out('You walk down to the hollow whose season it is.', room('co-d3-awake'))),
      ch('Come back each season.', out('You mark the hill on your map. The child nods very seriously. "Each season. Then you\'ll see."', flag('seasons-watch'))),
      ch('Ask the gran.', out('Two nodes to the farm. The gran gives you Leftovers wrapped in a cloth, and pats your hand.\n\nGran: "The fifth sleeps under the fourth snow. You\'ll know it when you see it."', takeNode(2), flag('seasons-gran'), flag('seasons-watch'), item('leftovers'))),
      ch('Leave it.', leave('You let them sleep.')),
    ]),
  ev('co-d3-awake', 'The Four Seasons Snorlax: The Awake One', G, { ...R, pokemon: 'snorlax-delta', tint: '#80a060' },
    'Only the one whose season it is is awake. It looks at you through half-closed eyes.',
    [awake('Spring'), awake('Summer'), awake('Autumn'), awake('Winter')]),
  ev('co-d3-visit', 'The Four Seasons Snorlax: Another Season', G, { callback: true, rarity: 'rare', requires: [flagIs('seasons-watch'), flagIs('seasons-visit', 0, 3)], cast: ['trainer.youngster_m'], pokemon: 'snorlax-delta', tint: '#90b070' },
    'The hill with four hollows. This season, a different one is awake.',
    [visit('Spring'), visit('Summer'), visit('Autumn'), visit('Winter')]),
  ev('co-d3-under', 'The Four Seasons Snorlax: The Fifth', G, {
    callback: true, rarity: 'rare', requires: [flagIs('seasons-visit', 4)], cast: ['trainer.youngster_m'], pokemon: 'snorlax-delta', tint: '#e0e8f0', effect: 'snow',
    remembers: [
      { id: 'gran', when: [flagIs('seasons-gran')], notice: 'The gran comes up the hill with a stick, puffing. "Told you."' },
      { id: 'empty', when: [flagIs('seasons-caught')], notice: 'One hollow stays empty: the one whose sleeper you took. Under the hill, the fifth turns over, and does not wake.', hide: [0] },
    ],
  },
    'All four are awake. They stand. Under the hill, something rolls over.',
    [
      ch('Take the one underneath.', out('The hill shrugs, and out of it climbs a plain green Snorlax that smells of every season at once. It yawns and follows you.', ...caught('snorlax'), gift('snorlax-delta'), moment('You found the fifth Snorlax under the hill of four seasons.', 85))),
      ch('Leave them all.', out('All four lie down again, one by one. The hill is warm when you leave it, and the hollow you slept in heals you through.', heal(1), ...studied('snorlax'))),
    ]),
];

// ---------------------------------------------------------------- D4. The Ditto Colony
type Find = { n: number; tell: string; right: string; wrong: [string, string]; next: string };
const ditto = (f: Find): Json =>
  ev(`co-d4-find-${f.n}`, `The Ditto Colony: Find ${f.n}`, G, { ...R, cast: ['trainer.fisherman'], pokemon: 'ditto-delta', tint: '#6090a0' }, f.tell, [
    ch(`"It's a ${f.right} one."`, out(`It drops its disguise with a little pop: a ${f.right}-coloured Ditto, delighted to be found. It joins the chorus.`, flag('dittos-found'), flag(`dittos-${f.right.toLowerCase()}`), ...(f.next ? [room(f.next)] : []))),
    ch(`"It's a ${f.wrong[0]} one."`, out('It giggles and wobbles off somewhere else. The beachcomber writes something down.', flag('dittos-missed'), ...(f.next ? [room(f.next)] : []))),
    ch(`"It's a ${f.wrong[1]} one."`, out('It giggles and wobbles off somewhere else. The beachcomber writes something down.', flag('dittos-missed'), ...(f.next ? [room(f.next)] : []))),
  ]);
const d4: Json[] = [
  ev('co-d4-cove', 'The Ditto Colony', G, {
    rarity: 'rare', cast: ['trainer.fisherman'], pokemon: 'ditto-delta', tint: '#5080a0', effect: 'rain',
    remembers: [{ id: 'own-ditto', when: [partySpecies('ditto')], notice: 'Your own Ditto wobbles down to the waterline and starts singing. One fewer to find.' }],
  },
    'A cove. Everything in it is very slightly wrong. A rock blinks.\n\nBeachcomber: "They\'ve been here so long they\'ve each become whatever they copied most."\nBeachcomber: "There\'s eighteen. Every type but plain, and two Water. I\'ve found eleven in thirty years."\nBeachcomber: "The old one\'s the Water one. That\'s the one that started it."',
    [
      ch('Look for them.', out('You start at the tide line. Each one has a tell, if you know how to look.', flag('dittos-looking'), room('co-d4-find-1'))),
      ch('Leave it.', leave('You leave the cove to its blinking rocks.')),
    ]),
  ditto({ n: 1, tell: 'A rock at the waterline is warm to the touch, warmer than the sun could make it.', right: 'Fire', wrong: ['Rock', 'Ground'], next: 'co-d4-find-2' }),
  ditto({ n: 2, tell: 'A puddle in the shade has frost around its edge. In summer.', right: 'Ice', wrong: ['Water', 'Steel'], next: '' }),
  ditto({ n: 3, tell: 'A shell on the sand has no shadow at all.', right: 'Ghost', wrong: ['Dark', 'Psychic'], next: 'co-d4-find-4' }),
  ditto({ n: 4, tell: 'Seaweed on a post crackles when the wind touches it, and your hair stands up.', right: 'Electric', wrong: ['Grass', 'Water'], next: '' }),
  ditto({ n: 5, tell: 'A sandcastle someone built very carefully. It is breathing.', right: 'Ground', wrong: ['Rock', 'Normal'], next: 'co-d4-end' }),
  ev('co-d4-rest', 'The Ditto Colony: The Far Rocks', G, { callback: true, rarity: 'rare', requires: [flagIs('dittos-looking'), flagIs('dittos-round', 0, 0)], cast: ['trainer.fisherman'], pokemon: 'ditto-delta', tint: '#5080a0' },
    'The tide is out. The beachcomber waves you down to the far rocks. "More of them out here. Come on."',
    [ch('Keep looking.', out('You pick your way out over the rocks.', flag('dittos-round'), room('co-d4-find-3')))]),
  ev('co-d4-last', 'The Ditto Colony: The Last Light', G, { callback: true, rarity: 'rare', requires: [flagIs('dittos-round'), flagIs('dittos-ended', 0, 0)], cast: ['trainer.fisherman'], pokemon: 'ditto-delta', tint: '#a07050' },
    'Evening on the cove. One more, the beachcomber says. He always says that.',
    [ch('One more.', out('The light is going. You look hard at the sand.', flag('dittos-ended'), room('co-d4-find-5')))]),
  ev('co-d4-end', 'The Ditto Colony: The Chorus', G, {
    ...R, cast: ['trainer.fisherman'], pokemon: 'ditto-delta', tint: '#80a0c0',
    remembers: [{ id: 'elder-own', when: [partySpecies('ditto'), flagIs('dittos-found', 4), flagIs('dittos-missed', 0, 0)], notice: 'Your own Ditto sang the missing note. Out of the deep water, slowly, comes a very old blue Ditto. The elder.', addChoices: [ch('Ask the elder.', out('The elder settles into your hands like a cold, kind stone. "It started it," the beachcomber says softly. "And now it\'s going with you."', ...caught('ditto'), gift('ditto-delta'), moment('The elder of the Ditto Colony chose to come with you.', 85)))] }, { id: 'elder', when: [flagIs('dittos-found', 5), flagIs('dittos-missed', 0, 0)], notice: 'Out of the deep water, slowly, comes a very old blue Ditto. The elder. It looks at every one you found, and then at you.', addChoices: [ch('Ask the elder.', out('The elder settles into your hands like a cold, kind stone. "It started it," the beachcomber says softly. "And now it\'s going with you."', ...caught('ditto'), gift('ditto-delta'), moment('The elder of the Ditto Colony chose to come with you.', 85)))] }],
  },
    'The chorus sings: one note for every Ditto you found, high and wobbly and very proud of itself.\n\nBeachcomber: "You found more than me. Wonderful."',
    [
      ch('Pick one of the found.', out('They line up on the sand, each one very sure it is the best one.', room('co-d4-pick'))),
      ch('Leave them.', out('The beachcomber gives you his notebook: every tell, thirty years of them. "For next time. There\'s always a next time."', ...studied('ditto'), rp(30))),
    ]),
  ev('co-d4-pick', 'The Ditto Colony: Pick One', G, { ...R, cast: ['trainer.fisherman'], pokemon: 'ditto-delta', tint: '#80a0c0' },
    'The ones you found wait in a row, wobbling with hope.',
    [
      ch('Pick the Fire one.', out('The warm one hops into your arms.', ...caught('ditto'), gift('ditto-delta-fire')), { requires: [flagIs('dittos-fire')] }),
      ch('Pick the Ice one.', out('The frosty one leaves a little ring of ice in your palm, and stays.', ...caught('ditto'), gift('ditto-delta-ice')), { requires: [flagIs('dittos-ice')] }),
      ch('Pick the Ghost one.', out('The one with no shadow is suddenly just there, beside you, as if it always had been.', ...caught('ditto'), gift('ditto-delta-ghost')), { requires: [flagIs('dittos-ghost')] }),
      ch('Pick the Electric one.', out('The crackling one climbs your sleeve and makes your hair stand up, and stays.', ...caught('ditto'), gift('ditto-delta-electric')), { requires: [flagIs('dittos-electric')] }),
    ]),
];

// ---------------------------------------------------------------- D5. The Six Cages (Delta Muk forms)
const CAGES = ['bug', 'dark', 'fairy', 'fire', 'grass', 'water'] as const;
const cage = (i: number): Json => {
  const form = CAGES[i]!;
  const last = i === CAGES.length - 1;
  return ev(`co-d5-cage-${i + 1}`, `The Six Cages: Cage ${i + 1}`, G, { ...R, cast: ['trainer.worker_m'], pokemon: `muk-delta-${form}`, tint: '#706048' },
    `The Muk shifts. One of the round shapes against its body is a ${form} cage, and something inside it presses a small paw to the bars.`,
    [ch('Open it.', fight(`The Muk will not give it up easily. It takes on the colour of the cage.`, wild({ species: [`muk-delta-${form}`], win: [flag('cages-freed'), ...(last ? [room('co-d5-calm')] : [room(`co-d5-cage-${i + 2}`)])] })))]);
};
const d5: Json[] = [
  ev('co-d5-dump', 'The Six Cages', G, { rarity: 'rare', cast: ['trainer.worker_m'], pokemon: 'muk-delta', tint: '#605040' },
    'Behind a factory, a dumping ground. A brown Muk sits on a hill of junk, holding six round shapes against its body. In each, something moves.\n\nFactory worker, on a smoke break: "Don\'t go near it."\nWorker: "People dump things there. Pokémon too, sometimes. Ones they don\'t want."\nWorker: "It eats the junk. The Pokémon it keeps. I think it\'s keeping them safe."\nWorker: "Boss wants it gone. He\'s bringing in an exterminator Friday."',
    [
      ch('Open the cages.', out('You climb the junk hill. The Muk watches you come.', flag('cages-opened'), room('co-d5-cage-1'))),
      ch('Go to the boss.', out('Two nodes through the factory, past rows of drums with no labels. At the end, an office.', takeNode(2), flag('cages-factory'), room('co-d5-boss'))),
      ch('Leave it.', out('You walk on. Friday comes. The exterminator wins. The Pokémon are scattered, and nobody keeps them safe now.', flag('cages-left'), moment('You left the Six Cages to the exterminator.', 60))),
    ]),
  ...CAGES.map((_, i) => cage(i)),
  ev('co-d5-calm', 'The Six Cages: Open', G, { ...R, cast: ['trainer.worker_m'], pokemon: 'muk-delta', tint: '#8a7a58' },
    'Six cages open. Six small Pokémon blink in the light. The Muk goes plain brown and very calm, and it does not stop them leaving. One of them stays by your boot.',
    [
      ch('"Come on, then."', out('It comes along.', ...studied('muk'), { kind: 'join', species: [], types: ['bug', 'dark', 'fairy', 'fire', 'grass', 'water'], levelBonus: 0, shinyMultiplier: 1 }, good(1))),
      ch('"Go home, little one."', out('It looks at you, then runs after the others.', ...studied('muk'), good(1))),
    ]),
  ev('co-d5-boss', 'The Six Cages: The Owner', G, { ...R, cast: ['trainer.roughneck'], tint: '#504840' },
    'Factory owner: "It\'s a waste site. It\'s legal. What\'s the problem?"\nOwner: "You want me to stop? Fine. Show me what you\'d do with a hundred tons of sludge."\nBehind him, on a shelf, a crate with a stencilled red letter on it that is not his company\'s.',
    [
      ch('"Report you."', out('Two nodes to the region office. A week later the Region Report has one line about it: SHUT. Whoever was paying him loses a dump site. The Muk lets them all go itself, and then comes to you, plain and calm.', takeNode(2), flag('cages-reported'), flag('evil-op-shut'), good(2), ...caught('muk'), gift('muk-delta'))),
      ch('"Pay the clean-up."', out('3000. The dumping stops. The owner keeps his factory. The Muk lets them all go itself, and then comes to you.', $(-3000), flag('cages-paid'), ...caught('muk'), gift('muk-delta')), { requires: [money(3000)] }),
      ch('"Fight your guards."', fight('Three guards come out of the back.', { ...trainer('Factory Guards', { size: 3, types: ['poison', 'steel'], win: [flag('cages-fought'), ...caught('muk'), gift('muk-delta')] }), evil: 'grunt' })),
    ]),
];

// ---------------------------------------------------------------- D6. The Hot Marsh (Delta Wooper)
const groudonVent = ch('Let the ground answer.', out('The vent opens at once with a sound like a held breath let go. Steam rises for a mile. The Quagsire stand in it with their eyes closed.', flag('marsh-vent'), ...studied('wooper'), gift('wooper-delta'), sign('groudon')));
const d6: Json[] = [
  ev('co-d6-marsh', 'The Hot Marsh', G, {
    rarity: 'rare', cast: ['trainer.snow_worker_m'], pokemon: 'quagsire-delta', tint: '#a05030', effect: 'snow',
    remembers: [{ id: 'groudon', when: [flagIs('blessing-groudon')], notice: 'The ground under your feet is warm, and getting warmer.', addChoices: [groudonVent] }, { id: 'own-groudon', when: [partySpecies('groudon')], notice: 'Your Groudon puts one foot on the ice, and it cracks, and steams.', addChoices: [groudonVent] }],
  },
    'A marsh in deep cold, the only warm water for miles. Little fires burn on lily pads. Quagsire, coloured like coals, tend them.\n\nA Quagsire looks up at you. It holds out a stick, lit at one end.\nTrapper, up a tree: "They\'re trying to keep it warm. The vent underneath is closing up."\nTrapper: "Every year it\'s colder. This year there\'ll be ice by the full moon."',
    [
      ch('Reopen the vent.', fight('Your Ground-type digs. Cold-water Pokémon come up through the ice to stop it, and you and the Quagsire hold them off.', wild({ format: 'doubles', types: ['water', 'ice'], win: [flag('marsh-vent'), ...studied('wooper'), gift('wooper-delta')] })), { requires: [ptype('ground')] }),
      ch('Take the Wooper somewhere warm.', out('You carry the little ones out, wrapped in your coat. They live. Behind you, the fires go out one by one.', flag('marsh-moved'), ...caught('wooper'), gift('wooper-delta'))),
      ch('Help tend the fires.', out('You spend the rest with them, feeding sticks to the little fires all night. It buys the marsh one more year. The trapper says you could come back.', { kind: 'flag', key: 'marsh-tended', amount: 1, stamp: 'region' }, heal(0.5))),
    ]),
  ev('co-d6-back', 'The Hot Marsh: Back Again', G, { callback: true, rarity: 'rare', requires: [{ kind: 'flag', key: 'marsh-tended', atLeast: 1, atMost: 99, regionsAgo: 1 }, flagIs('marsh-vent', 0, 0)], cast: ['trainer.snow_worker_m'], pokemon: 'wooper-delta', tint: '#b06040', effect: 'snow' },
    'The Hot Marsh, a region later. The fires you tended are still burning. The vent is half-open already: the Quagsire have been digging all year.',
    [
      ch('Finish the work.', out('It takes an afternoon and every stick on the marsh. Then the steam comes up, and the Quagsire sit in it, and one small Wooper climbs into your bag and will not get out.', flag('marsh-vent'), ...studied('wooper'), gift('wooper-delta'))),
    ]),
];

// ---------------------------------------------------------------- D7. The Sky Whale (Delta Wailmer, Wailord)
const DOWN = 'It turns its whole great body toward you. Then, slowly, it comes down.';
/** A signal; on the third crossing, with the two before answered too, it comes down (`co-d7-check`). */
const signal = (last: boolean): Json[] => {
  const sig = (label: string, text: string, requires: Json[], ...extra: Json[]): Json =>
    ch(label, out(text, flag('whale-signal'), ...extra), { requires, ...(last ? { branches: [{ when: [flagIs('whale-signal', 2)], text: `${text} ${DOWN}`, effects: [flag('whale-signal'), ...extra, room('co-d7-check')] }] } : {}) });
  return [
    sig('Signal it with a Flying-type.', 'Your Flying-type rises as high as it can and calls. The whale turns its head.', [ptype('flying')]),
    sig('Signal it with a sound.', 'A sound move, as loud as you can make it. Far above, the whale turns its head.', [moveFlag('sound')]),
    sig('Signal it with a light.', 'Flash, three times, from the hilltop. The whale turns its head.', [{ kind: 'partyMove', move: 'flash' }]),
    ch('Ignore it.', out(last ? 'It passes over, singing. Nobody answers.' : 'It passes over. The song fades.')),
  ];
};
const crossing = (n: number, text: string): Json =>
  ev(`co-d7-crossing-${n}`, `The Sky Whale: Crossing ${n}`, G, { rarity: 'rare', ...(n > 1 ? { callback: true, requires: [flagIs('whale-seen')] } : {}), cast: ['trainer.bird_keeper_m'], pokemon: 'wailord-delta', tint: '#a0c0e0' },
    text, n === 1 ? signal(false).map((c) => ({ ...c, success: { ...(c as { success: { effects: Json[] } }).success, effects: [...(c as { success: { effects: Json[] } }).success.effects, flag('whale-seen')] } })) : signal(n === 3));
const d7: Json[] = [
  crossing(1, 'Every Pokémon on the route looks up at once. A whale crosses the sky, icy, slow, the size of a town.\n\nWeather watcher, with binoculars: "It was a Wailmer. Twenty years ago. A storm took it up and it never came down."\nWatcher: "It crosses three times a year. It sings. Nobody answers."'),
  crossing(2, 'The shadow again, on a clear day. The whale crosses for the second time, singing. The watcher is on the hill with his binoculars.'),
  crossing(3, 'The third crossing. The whale is lower this time. You can hear the song in your teeth.'),
  ev('co-d7-check', 'The Sky Whale: Down', G, { ...R, cast: ['trainer.bird_keeper_m'], pokemon: 'wailord-delta', tint: '#c0e0f0', effect: 'snow' },
    'It comes down for the first time in its life, onto a frozen lake. It lies there, frightened of its own weight. The ice groans.',
    [
      ch('Stay with it.', out('A long night on the ice. You talk to it. Your Pokémon lean against its side for warmth. At dawn it lifts off again, slowly, and sings back to you all the way up.', flag('whale-stayed'), ...studied('wailord'), fr(2), sign('lugia'), moment('You stayed the night with the Sky Whale. At dawn it sang back.', 85))),
      ch('Catch it.', out('It joins you. It cannot fly again. It is heavy and sad, and it looks up, often.', flag('whale-caught'), ...caught('wailord'), gift('wailord-delta'), sign('lugia'))),
      ch('Call the Wailmer pod.', out('Two nodes to the coast. A pod of Wailmer comes up the river, blowing spray, and the whale sees its own kind for the first time. When they go, one small icy Wailmer stays behind with you.', takeNode(2), flag('whale-pod'), ...studied('wailord'), gift('wailmer-delta'), sign('lugia'))),
    ]),
];

// ---------------------------------------------------------------- D8. The Storm-Kissed Pikachu
const cloud = (n: number, text: string): Json =>
  ev(`co-d8-rest-${n}`, `The Storm-Kissed Pikachu: Rest ${n}`, G, { callback: true, rarity: 'rare', requires: [flagIs('stormpika', n, n), flagIs('stormpika-down', 0, 0)], pokemon: 'pikachu-delta', tint: '#e0a0c0', effect: 'rain' }, text, [
    ch('Rest quietly.', out(n === 2 ? 'It comes one cloud lower. You can see its whiskers.' : 'It watches you sleep. It does not hide.', flag('stormpika'), heal(0.5))),
  ]);
const landing = [
  ch('"Stay with me."', out('It stays. It climbs onto your shoulder and stays there, fizzing pink.', flag('stormpika-down'), ...caught('pikachu'), gift('pikachu-delta'), moment('The Storm-Kissed Pikachu came down from its cloud to stay with you.', 85))),
  ch('"You can go back."', out('It looks at you a long time. Then it goes back up. You see it, now and then, on the highest cloud, looking down.', flag('stormpika-down'), flag('stormpika-free'), ...studied('pikachu'))),
];
const d8: Json[] = [
  ev('co-d8-cloud', 'The Storm-Kissed Pikachu', G, {
    rarity: 'rare', cast: ['trainer.hiker'], pokemon: 'pikachu-delta', tint: '#e0a0c0', effect: 'rain',
    remembers: [{ id: 'starter', when: [starterIs('pikachu')], notice: 'It stares at your Pikachu. Your Pikachu stares back. It comes down at once, to look at the other one.', hide: [1], addChoices: [ch('Let them meet.', out('It lands, sniffs your Pikachu nose to nose, and does not go back up.', room('co-d8-land')))] }],
  },
    'Below a thunderhead, a Pikachu peeks over the edge of a cloud. It is pink and white. It has never touched the ground.\n\nIt drops a pink spark. It lands at your feet and fizzes.\nHiker: "That\'s been up there all week. Every time someone looks up, it hides."\nHiker: "I left it an apple. It took it. Then it threw the core at me."',
    [
      ch('Coax it down.', out('You sit very still and do not look up. When you rest, it will come a little lower.', flag('stormpika'))),
      ch('Fly up to it.', out('Your Flying-type carries you up into the cloud. It panics and flees to another cloud, and is gone.', flag('stormpika-fled')), { requires: [ptype('flying')] }),
      ch('Throw it an apple.', out('It takes it. It throws the core at you. Then it comes one cloud closer.', flag('stormpika', 2))),
      ch('Leave it.', leave('You leave it to its cloud.')),
    ]),
  cloud(1, 'You rest under the thunderhead. A pink spark lands on your blanket.'),
  cloud(2, 'Another rest. It is lower now, sitting on the very bottom of its cloud with its feet hanging over.'),
  ev('co-d8-land', 'The Storm-Kissed Pikachu: The Ground', G, { ...R, pokemon: 'pikachu-delta', tint: '#f0c0d0' },
    'It lands. It looks around. Grass. It pats the grass, very carefully, with one paw.',
    landing),
  ev('co-d8-rest-3', 'The Storm-Kissed Pikachu: Rest 3', G, { callback: true, rarity: 'rare', requires: [flagIs('stormpika', 3, 3), flagIs('stormpika-down', 0, 0)], pokemon: 'pikachu-delta', tint: '#f0c0d0' },
    'The third rest. It lands. It looks around.',
    landing),
];

export const EVENTS: Json[] = [...d1, ...d2, ...d3, ...d4, ...d5, ...d6, ...d7, ...d8];
export const REMOVE: string[] = ['form-clue-fur', 'form-clue-tracks', 'form-clue-sketch', 'form-research-battle'];
