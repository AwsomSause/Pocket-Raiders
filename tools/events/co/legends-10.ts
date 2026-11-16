// Catalog Overhaul Pack, legends: the RULE ids (CATALOG_INDEX.md status "rule"). The old catalog events that became game rules are
// retired here (REMOVE) and their job is done by the systems: Signs feed the blessing's Influence ladder (core/legends/signs.ts; the
// Presence places the Legendary's own gate, core/legendary/legendary.ts), Tellings make a Mythical believed so its Visit scene can
// open (legends-7/8), Static and Tears are the Ultra Beast system, Alpha warnings are the Alpha questlines. These few stops are the
// places Signs and Tellings now come from: a landmark, a shrine, a ruin, a campfire tale, the sky, a dream, an echo.
// Ids still live on purpose (pseudo stages, the Shadow chain, past-run Archive pieces, rival scenes, keys, form items) stay pending:
// docs/status/co-legends.md.
import { $, at, ch, ev, flag, flagIs, fr, heal, leave, money, out, type Json } from '../dsl.ts';
import { sign, telling } from './_legendsKit.ts';

export const CATEGORY = 'legends';

const G = 'Signs and Tellings';
const BLESSED = flagIs('blessed');
const TOLD = flagIs('promises-on');
const anyTelling = (): Json => flag('telling-any');

export const EVENTS: Json[] = [
  ev('co-rule-landmark', 'A Regional Landmark', G, { rarity: 'uncommon', requires: [BLESSED], cast: ['trainer.ruin_maniac'], tint: '#a08060' },
    'One of the region\'s great landmarks: the kind of place on every postcard. A guide in a faded cap is packing up for the day.\n\nGuide: "Everyone takes the photo. Nobody asks what it was built for."',
    [
      ch('"What was it built for?"', out('The guide tells you a secret the postcards leave out: it was built for a Legendary, a long time ago. You feel something far off turn toward you.', sign('own'))),
      ch('Walk all the way round it.', out('On the far side, where nobody goes, a carving of a great shape. Your Pokémon go quiet looking at it.', sign('own'), fr(1))),
      ch('Take the photo and go.', leave('It is a very good photo.')),
    ]),
  ev('co-rule-shrine', 'An Old Shrine', G, { rarity: 'uncommon', requires: [BLESSED], tint: '#c0a060' },
    'A small shrine by the road, older than the road. Offerings are left here for whichever Legendary is listening.',
    [
      ch('Leave an offering (₽200).', out('The coins settle. The wind changes direction, just for a moment.', $(-200), sign('own')), { requires: [money(200)] }),
      ch('Ring the bell.', out('One clear note. Something answers, a long way off.', sign('own'))),
      ch('Bow and walk on.', leave('The shrine keeps its own counsel.')),
    ]),
  ev('co-rule-ruin', 'Ruin Inscriptions', G, { rarity: 'uncommon', requires: [TOLD], cast: ['trainer.ruin_maniac'], tint: '#807060' },
    'A broken wall covered in old writing. Half of it is about a great Legendary; the other half is about something small that walks where it likes.',
    [
      ch('Read the Legendary half.', out('A Legend, named in a language nobody speaks now. You can almost hear it.', sign('own')), { requires: [BLESSED] }),
      ch('Read the other half.', out('A small story, carefully carved, about something nobody quite believes in.', anyTelling())),
      ch('Leave it.', leave('The wall has waited this long.')),
    ]),
  ev('co-rule-tale', 'A Campfire Tale', G, { rarity: 'uncommon', requires: [TOLD], cast: ['trainer.hiker'], tint: '#c06030' },
    'Another traveller shares your fire. When the food is gone, she leans back.\n\nTraveller: "Want to hear something nobody believes?"',
    [
      ch('"Tell me."', out('She tells it well. You find yourself believing a little of it.', anyTelling())),
      ch('Trade a story of your own.', out('You tell her about your run. She tells you something better.', anyTelling(), fr(1))),
      ch('Sleep.', out('You sleep well by the fire.', heal(0.2))),
    ]),
  ev('co-rule-sky', 'Something in the Sky', G, { rarity: 'uncommon', requires: [TOLD, at('evening', 'night')], tint: '#202050', effect: 'sparkle' },
    'The sky is doing something it should not. A falling star that does not fall. A moon with a bite taken out of it.',
    [
      ch('Follow the falling star.', out('It lands somewhere to the south. Something in the crater hums.', telling('deoxys'))),
      ch('Make a wish on it.', out('You wish. Somewhere, something sleepy turns over.', telling('jirachi'))),
      ch('Watch the eclipse.', out('The light goes strange and thin. Something old is hungry for it.', sign('necrozma'))),
    ]),
  ev('co-rule-dream', 'A Strange Dream', G, { rarity: 'uncommon', requires: [TOLD, at('night')], tint: '#302040' },
    'You dream of the camp, and in the dream someone is standing at the edge of the firelight.',
    [
      ch('Walk toward them.', out('Smoke, and a white plume. They say nothing. You wake with the dream still on you.', telling('darkrai'))),
      ch('Look for the moon.', out('A crescent, very bright, very close. You wake rested.', sign('cresselia'), heal(0.1))),
    ]),
  ev('co-rule-echo', 'An Echo', G, { rarity: 'rare', requires: [BLESSED, flagIs('blessing-influence', 3)], tint: '#6060a0', effect: 'flicker' },
    'A shadow crosses the path: something huge, flying low, and gone before you look up. A local stands in a doorway, staring after it.\n\nLocal: "That\'s twice this week."',
    [
      ch('Follow its shadow.', out('You lose it in the hills. But it knows you followed.', sign('own'))),
      ch('Ask the local.', out('"It\'s looking for someone," they say. They look at you a long time.', sign('own'))),
      ch('Let it pass.', leave('The shadow does not come back today.')),
    ]),
];

/** Mythical chains (ovm-*): their three stages are now the Visit scenes (legends-7/8) and Tellings. */
const MYTHICAL_CHAINS = ['arceus', 'celebi', 'darkrai', 'deoxys', 'diancie', 'genesect', 'hoopa', 'jirachi', 'keldeo', 'magearna', 'manaphy', 'marshadow', 'meloetta', 'meltan', 'mew', 'pecharunt', 'phione', 'shaymin', 'victini', 'volcanion', 'zarude', 'zeraora'];

export const REMOVE: string[] = [
  ...MYTHICAL_CHAINS.flatMap((m) => [1, 2, 3].map((s) => `ovm-${m}-s${s}`)),
  // Signs: landmarks, shrines, echoes, the Legend Trail and single-Legendary sign places.
  'site-shrine', 'w4-landmark-alola', 'w4-landmark-frontier', 'w4-landmark-galar', 'w4-landmark-grand', 'w4-landmark-hoenn', 'w4-landmark-johto',
  'w4-landmark-kalos', 'w4-landmark-kanto', 'w4-landmark-paldea', 'w4-landmark-sinnoh', 'w4-landmark-torren', 'w4-landmark-trial', 'w4-landmark-unova',
  'tour-landmark', 'old-shrine-offering', 'old-shrine-spirit', 'ancient-shrine', 'ritual-circle', 'shrine-bell', 'professors-errand',
  'lake-legend', 'legendary-shadow', 'ev-legendary-disturbance', 'legend-clue-scales', 'legend-clue-song', 'legend-clue-tracks', 'legend-encounter',
  'legend-trail-1', 'legend-trail-2', 'legend-trail-3', 'r121-mystic-spring', 'mr-sleeping-titan', 'mr-totem-whisper', 'w4-time-rift',
  'mr-frozen-time-garden', 'mr-rewind-gate', 'distortion-world', 'ev-dimensional-collision', 'ev-distortion-rift', 'world-eclipse', 'wx-eclipse-totality',
  'mr-eclipse', 'pokemon-statue',
  // Trials now built as Legendary questlines: the Red Chain (L9), Sky Pillar (L6).
  'ancient-chain', 'red-chain-pillar', 'sky-pillar', 'sky-pillar-top',
  // Tellings: tales, scribes, rumours, ruin finds, dreams, wishes, falling stars.
  'tale-ghost-story', 'tale-pokemon-memory', 'tale-storyteller', 'tale-world-lore', 'lore-scribe-1', 'lore-scribe-2', 'lore-scribe-3',
  'world-legend-rumor', 'oral-history-rumor', 'quiet-antiquarian', 'ancient-seed', 'ancient-tablet', 'ev-ancient-discovery', 'lost-journal',
  'ruins-of-alph', 'unown-wall', 'elder-tree-memory', 'time-rift', 'second-chances', 'mr-door-without-wall', 'ev-dream-orb', 'dream-mist',
  'weird-dream', 'r156-drowzee-dream-sale', 'wishing-well', 'wish-upon-star', 'ev-star-path', 'site-crater', 'world-meteor-shower',
  'meteor-shower', 'meteorite-crash', 'strange-signal', 'r177-beldum-magnet-rain',
  // Ultra Static and Tears (the Ultra Beast system), Alpha warnings (the Alpha questlines).
  'w4-gravity-well', 'mr-portal-shard-a', 'mr-portal-shard-b', 'mr-portal-shard-c', 'mr-shattered-portal', 'mystery-region-signal',
  'alpha-pokemon', 'territorial-warning',
];
