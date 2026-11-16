// Catalog Overhaul, families-b (STORY_FAMILIES_6.md): the stories that are not Doors.
// SF32 The One Far From Home (Single), SF33 The Light at the Harbour (Stage-Three), SF35 The One That Beat You (Single), SF38 Who Keeps Watch (Single).
import { HELD, at, br, ch, fight, flag, flagIs, fr, front, item, join, leave, out, ptype, rest, room, takeNode, wild, type Json } from '../dsl.ts';
import { ROOM, no, rem, withBr } from './_fb.ts';

export const CATEGORY = 'families-b';

const inRegion = (...ids: string[]): Json => ({ kind: 'region', ids });
const hasSpecies = (species: string): Json => ({ kind: 'partySpecies', species });
const picked = (...types: string[]): Json => ({ kind: 'picked', types });
const single = (minStage: number, requires: Json[] = []) => ({ requires, callback: false, room: false, minStage });
const later = (requires: Json[]) => ({ requires, callback: true, room: false });

// ---------------------------------------------------------------- SF32 The One Far From Home
const ALOLA = inRegion('alola');
const UB = flagIs('faller-rank');
const farHome = (stranger: string, gift: string, herd: string): { escort: Json; keep: Json } => {
  const text = `You walk beside it for two days, toward the weather it keeps looking at. On the second evening something that has been following the herd decides the straggler is alone.`;
  const win = [item(gift), flag('farhome-escorted'), flag('farhome-done')];
  return {
    escort: withBr(ch('Escort it to its herd (two nodes).', fight(text, wild({ types: ['dark'], lv: 2, win }), takeNode(2))),
      br([UB], `${text} Your Ultra Beast has not taken its eyes off the stranger once. It knows what it is to be the wrong shape for the sky.`, takeNode(2), fr(5, 'top'))),
    keep: ch('Keep it.', fight(`You step between it and the ${herd}. It does not run. It only looks at you, then at the sky in the wrong direction, then at you again.`, wild({ species: [stranger], lv: 0, win: [flag('farhome-kept'), flag('farhome-done')] }))),
  };
};
const BASE = farHome('vulpix-alola', 'big-malasada', 'herd');
const IN_ALOLA = farHome('vulpix', 'pewter-crunchies', 'herd');
const STAYS = 'The herd\'s leader steps between you and the stranger, and does not move. The herd closes around it like water around a stone. It will be the wrong colour among them for the rest of its life, and it will not be alone.';
const GOES = (kind: string) => `The herd's leader steps between you and the stranger. Then it sees your ${kind}, one of its own, standing calm at your side. It looks for a long time. It steps back. The stranger walks over to you, and does not look at the sky again.`;
const SF32: Json[] = [
  {
    id: 'ev-pokemon-migration', name: 'The One Far From Home', ...single(2), scene: { cast: [], pokemon: 'vulpix-alola', tint: '#3a4a34', effect: 'none' },
    intro: 'A long line of Vulpix crosses the hills, red as embers. One in the herd is white as snow: an Alolan Vulpix, a thousand miles from any mountain it knows. The herd\'s leader nudges it along. It keeps stopping to look at the sky in the wrong direction. A herder on a stile: "Joined us last spring. Followed a storm, I reckon. It doesn\'t know where it is."',
    choices: [
      BASE.escort,
      BASE.keep,
      withBr(ch('Let the herd decide.', out(STAYS, flag('farhome-herd'), flag('farhome-done'))),
        br([ALOLA, hasSpecies('vulpix-alola')], GOES('Alolan Vulpix'), join({ species: ['vulpix'] }), flag('farhome-herd'), flag('farhome-done')),
        br([ALOLA], STAYS, flag('farhome-herd'), flag('farhome-done')),
        br([hasSpecies('vulpix')], GOES('Vulpix'), join({ species: ['vulpix-alola'] }), flag('farhome-herd'), flag('farhome-done'))),
    ],
    remembers: [
      rem('alola', [ALOLA], { intro: 'A long line of Alolan Vulpix crosses the snowline, white as the drifts. One in the herd is red as an ember: a Vulpix from across the sea, a thousand miles from any meadow it knows. The herd\'s leader nudges it along. It keeps stopping to look at the sky in the wrong direction. A herder on a stile: "Joined us last spring. Followed a storm, I reckon. It doesn\'t know where it is."', hide: [0, 1], add: [IN_ALOLA.escort, IN_ALOLA.keep] }),
      rem('ub', [UB], { notice: 'Your Ultra Beast has gone very still. It is watching the stranger, and only the stranger.' }),
    ],
  },
];

// ---------------------------------------------------------------- SF33 The Light at the Harbour
const THANKS: Json[] = [item('cell-battery'), item('electric-gem'), flag('harbour-ferry-free'), flag('harbour-done')];
const FLASH = ' At midnight, far down the coast, another lamp answers: the Sunken Lighthouse, the one you relit. The two lights flash to each other across the dark, like old friends who have just found out the other is still alive.';
const TIDE = flagIs('tide-lamp');
const FEVER = flagIs('crisis-fever-on');
const SAVED = { kind: 'crisis', amount: -1 };
const dose = (label: string, text: string, key: string, cures: boolean): Json => {
  const fx = [flag('harbour-dose'), flag(key)];
  const c = ch(label, out(text, ...fx));
  return cures ? withBr(c, br([FEVER], `${text} It is the same fever that is in the kennels and the roosts. One more place it did not take.`, ...fx, SAVED, flag('crisis-fever-harbour'))) : c;
};
const SF33: Json[] = [
  {
    id: 'lighthouse', name: 'The Light at the Harbour', ...single(3, [at('night')]), types: ['electric', 'water'], scene: { cast: [], pokemon: 'ampharos', tint: '#102030', effect: 'fog' },
    intro: 'A harbour at night. The lighthouse lamp is out. Ships drift outside the reef, sounding their horns at nothing. The keeper\'s daughter, Dina, meets you on the stairs: "It\'s Amphy. She\'s sick. She can\'t light it." In the lamp room an Ampharos lies on blankets, the jewel on her tail dim. "The medicine\'s on an island across the bay. The ferry\'s out. Three ships are waiting for the light."',
    choices: [
      ch('Fetch the medicine (two nodes).', out('Dina unties her father\'s skiff with shaking hands. The bay is black and steep. Your best swimmer or flier takes the lead, and you follow it out into the weather.', takeNode(2), front('rain', 3), flag('harbour-medicine'), flag('harbour-sailed'))),
      withBr(ch('Light the lamp myself.', out('Your Electric-type climbs into the great lens and gives it everything. The beam swings out over the water. One by one, three ships come in under it. Amphy watches from her blankets, too weak to lift her head, and her tail glows faintly in answer. At dawn Dina presses her thanks into your hands.', flag('harbour-lamp'), ...THANKS), { pick: { types: ['electric'] } }),
        br([TIDE], 'Your Electric-type climbs into the great lens and gives it everything. The beam swings out over the water. One by one, three ships come in under it. Amphy watches from her blankets, too weak to lift her head, and her tail glows faintly in answer.' + FLASH, flag('harbour-lamp'), ...THANKS)),
      ch('Both (two nodes).', out('One of yours stays in the lens, burning steady, holding three ships off the rocks. You take the skiff out alone into the weather. Behind you the beam sweeps the water, and every time it passes, you know who is sending it.', takeNode(2), front('rain', 3), flag('harbour-both'), flag('harbour-sailed')), { pick: { types: ['electric'] } }),
    ],
  },
  {
    id: 'fb-harbour-island', name: 'The Light at the Harbour: The Island', group: 'Places and weather', rarity: 'uncommon', types: ['electric', 'water'], ...later([flagIs('harbour-sailed'), no('harbour-dose')]), scene: { cast: [], tint: '#1c2c38', effect: 'rain' },
    intro: 'The island, at last. A shuttered pharmacy with one lamp burning. The old pharmacist turns a small brown bottle over in his fingers. "For an Ampharos? I\'ve only one dose. There\'s a Pikachu in town with the same fever." Through the back door you can see it: a small yellow shape under a blanket, and a child asleep in the chair beside it.',
    choices: [
      dose('Ampharos.', 'You take the bottle. The child in the chair does not wake. The pharmacist nods, slowly. "It\'ll pull through. Slower. They mostly do." You do not look through the back door again on the way out.', 'harbour-dose-amphy', true),
      dose('The Pikachu.', 'You push the bottle back across the counter. The pharmacist looks at you for a long moment, then carries it through the back door. You row home with empty hands, working out what to say to Dina.', 'harbour-dose-pikachu', false),
      dose('Split the dose.', 'The pharmacist measures it out with a hand steadier than his voice. "Half each. It\'ll be slow for both. But it\'ll be both." He stoppers your half and wraps it in a clean cloth.', 'harbour-dose-split', true),
    ],
    remembers: [rem('fever', [FEVER], { notice: 'You know this fever. And you know the handwriting on the label: the medicine is Ranger Ines\'s own.' })],
  },
  {
    id: 'fb-harbour-return', name: 'The Light at the Harbour: The Lamp', group: 'Places and weather', rarity: 'uncommon', types: ['electric', 'water'], ...later([flagIs('harbour-dose'), no('harbour-done')]), scene: { cast: [], pokemon: 'ampharos', tint: '#102030', effect: 'glint' },
    intro: 'The harbour again. Dina gives Amphy the medicine a drop at a time. By evening the jewel on her tail is the colour of a coal you could blow back to life. She gets up. She climbs the stairs herself. Out past the reef, word comes back that the Pikachu on the island is mending too, slowly, a little more each day.',
    choices: [
      withBr(ch('Watch her light the lamp.', out('The beam swings out over the water, steadier than any machine. Three ships come in under it. Dina cannot stop crying, and cannot stop laughing, and gives you everything in her father\'s drawer that she thinks a trainer could use. "And the ferry\'s yours. For good. I\'ll tell them myself."', ...THANKS)),
        br([TIDE], 'The beam swings out over the water, steadier than any machine. Three ships come in under it. Dina gives you everything in her father\'s drawer that she thinks a trainer could use. "And the ferry\'s yours. For good."' + FLASH, ...THANKS)),
    ],
    remembers: [
      rem('pikachu', [flagIs('harbour-dose-pikachu')], { intro: 'The harbour again. You tell Dina the truth. She says nothing. Amphy has been listening. She gets up, sicker than before, and climbs the stairs on legs that barely hold her. She lights the lamp one more time, with the last of her strength. Then she sleeps for three days, and wakes up hungry.' }),
      rem('split', [flagIs('harbour-dose-split')], { intro: 'The harbour again. Half a dose is slow medicine. For the nights in between, your own Electric-type sits in the lens and holds the beam, while Amphy watches from her blankets and learns its rhythm. Tonight, at last, she stands up. Word comes from the island: the Pikachu is standing too.' }),
    ],
  },
];

// ---------------------------------------------------------------- SF35 The One That Beat You
const DONE = flag('foe-done');
const AFTER = room('fb-foe-after');
const rematch = (): Json => ch('Send out the one it beat.', fight('Your Pokémon walks out alone. It is shaking. It does not stop. The two of them look at each other across the grass, and everything else goes quiet.', wild({ recall: true, lv: 1, win: [fr(10, 'picked'), flag('foe-rematch'), AFTER] }), { kind: 'leadPicked' }), { pick: {} });
const strongest = (): Json => ch('Send out my strongest.', fight('No sentiment. You send out your best. The wild one bares its teeth: it expected nothing else from you.', wild({ recall: true, lv: 2, win: [flag('foe-fought'), AFTER] })));
const duel = (c: Json): Json => { ((c.success as Json).battle as Json).rule = { noSwitch: true }; return c; };
const SF35: Json[] = [
  {
    id: 'old-foe-returns', name: 'The One That Beat You', ...single(3, [{ kind: 'oldFoe' }, no('foe-stalking'), no('foe-done')]),
    intro: 'A familiar cry from the tall grass. A wild Pokémon that knocked out one of your team earlier in this run is back, and it is not backing down. It is bigger now. There is a scar where your Pokémon hit it. It looks straight at the one it beat.',
    choices: [
      duel(rematch()),
      strongest(),
      ch('Back away.', out('You back away, slowly. It lets you. But when you look over your shoulder an hour later, there is a shape on the ridge, keeping pace.', flag('foe-stalking'))),
    ],
    remembers: [rem('grave', [{ kind: 'memorial', atLeast: 1 }], { notice: 'You have buried a Pokémon on this road. The wild one carries a scar from that fight too. If there is a grave, it knows where.' })],
  },
  {
    id: 'fb-foe-stalks', name: 'The One That Beat You: Still Following', group: 'World Callbacks', rarity: 'uncommon', ...later([{ kind: 'oldFoe' }, flagIs('foe-stalking'), no('foe-done')]), scene: { cast: [], tint: '#2a1d1d', effect: 'fog' },
    intro: 'It has followed you for days. You have seen it on ridges, at the edge of firelight, once in the reflection of a stream. Now it steps out onto the road in front of you. The scar is the same. So is the look.',
    choices: [
      duel(rematch()),
      strongest(),
      ch('Back away.', out('You back away again. This time it does not follow. At the edge of the region it stops on the last hill and watches you out of sight. Some things are never finished.', DONE)),
    ],
  },
  {
    id: 'fb-foe-after', name: 'The One That Beat You: After', group: 'World Callbacks', rarity: 'uncommon', ...ROOM, scene: { cast: [], tint: '#2a1d1d', effect: 'none' },
    intro: 'It lies down in the flattened grass, breathing hard. It is looking at the Pokémon that beat it now. There is no anger left in the look. It is waiting to find out what happens next.',
    choices: [
      ch('Catch it.', out('It does not struggle. It has spent this whole run studying your team\'s weak places. Now it stands in front of them.', join({ recall: true }), flag('foe-caught'), DONE)),
      ch('Let it go.', out('It gets up. It nods, the way one fighter nods to another, and walks into the grass without looking back.', DONE)),
      withBr(ch('Let my Pokémon decide.', out('Your Pokémon looks at it, then at you, then steps back to your side. The wild one understands. It gets up, nods once, and goes.', DONE)),
        br([flagIs('foe-rematch')], 'The one it beat walks up to it, alone. They stand nose to nose. Then your Pokémon turns and walks back to you, and the wild one gets up and follows. They are rivals now. Neither would have it any other way.', join({ recall: true }), flag('foe-caught'), flag('foe-rivals'), DONE)),
    ],
    remembers: [rem('grave', [{ kind: 'memorial', atLeast: 1 }], { notice: 'If you let it go, you think you know where it will walk to. It has a scar from that fight too. It will wait there.' })],
  },
];

// ---------------------------------------------------------------- SF38 Who Keeps Watch
const DAWN = [rest(), room('fb-watch-dawn')];
const SF38: Json[] = [
  {
    id: 'w4-night-watch', name: 'Who Keeps Watch', ...single(2, [at('night')]), types: [],
    intro: 'Camp for the night. Somebody has to keep watch. The fire is low. The party is tired. One of them stands up, looking at you.',
    choices: [
      withBr(ch('Pick the watcher.', out('A curious wild Pokémon comes out of the dark and sits down beside your watcher, not too close. Neither makes a sound. They keep the fire together until dawn, and then it is gone.', flag('watch-kept'), ...DAWN), { pick: {} }),
        br([picked('fire')], 'Your watcher burns low and steady, and the cold comes to it. Small shapes creep in from the frost to sit in the warmth. By dawn one of them has decided not to leave.', join({ types: ['ice', 'water'] }), flag('watch-kept'), ...DAWN),
        br([picked('dark', 'ghost')], 'Something is going through your bag. Your watcher lets it get both hands in. Then it is simply there, behind the thief, in the dark it knows better. The thief drops a sack and runs. In the sack: something stolen on this road, days ago.', { kind: 'itemFrom', ids: HELD, count: 1 }, flag('watch-kept'), flag('watch-thief'), ...DAWN),
        br([picked('psychic', 'fairy')], 'You dream badly. Your watcher sees it happen: sees what you are dreaming, and stands between you and it until morning. Far away, something that lives in bad dreams notices it was noticed.', flag('telling-darkrai', 1), flag('watch-kept'), flag('watch-dream'), ...DAWN),
        br([picked('flying')], 'Something passes overhead, vast and silent. Your watcher looks up and does not cry out. In the morning there is a single feather lying across the ashes, longer than your arm.', flag('sign-bird', 1), flag('watch-kept'), ...DAWN),
        br([picked('normal', 'fighting')], 'Nothing comes. Nothing at all. Your watcher stands at the edge of the firelight all night with its fists up, ready. At dawn you find it still standing there, fast asleep on its feet.', flag('watch-kept'), ...DAWN)),
    ],
  },
  {
    id: 'fb-watch-dawn', name: 'Who Keeps Watch: At Dawn', group: 'World & Traversal', rarity: 'common', ...ROOM, scene: { cast: [], tint: '#3a3040', effect: 'none' },
    intro: 'Dawn. The fire is ash. Your watcher turns to you, tired to the bone, and waits to see whether it did well.',
    choices: [
      withBr(ch('Thank it.', out('You tell it so, out loud, with the others listening. It stands a little straighter. Tired is nothing, next to that.', fr(10, 'picked'))),
        br([{ kind: 'picked', starter: true }], 'You tell it so, out loud, with the others listening. Your starter stands a little straighter. Of course it kept watch. It will again.', fr(10, 'picked'), flag('watch-starter'))),
      withBr(ch('Let it sleep in my bag.', out('You make a nest of spare clothes and lift it in. It is asleep before you close the flap. By the next battle it will be itself again.', fr(5, 'picked'), { kind: 'heal', share: 1, who: 'picked' })),
        br([{ kind: 'picked', starter: true }], 'You make a nest of spare clothes and lift your starter in. It is asleep before you close the flap, one paw still on your wrist. It will keep watch again.', fr(5, 'picked'), { kind: 'heal', share: 1, who: 'picked' }, flag('watch-starter'))),
      withBr(ch('Get moving.', out('There is road to cover. It falls in behind you without complaint, a step slower than yesterday.', fr(5, 'picked'), { kind: 'damage', share: 0.2, who: 'picked' })),
        br([{ kind: 'picked', starter: true }], 'There is road to cover. Your starter falls in beside you without complaint, a step slower than yesterday. It will keep watch again tonight, whether you ask or not.', fr(5, 'picked'), { kind: 'damage', share: 0.2, who: 'picked' }, flag('watch-starter'))),
    ],
  },
  {
    id: 'fb-watch-again', name: 'Who Keeps Watch: Unasked', group: 'World & Traversal', rarity: 'common', ...later([flagIs('watch-starter'), no('watch-again'), at('night')]), scene: { cast: [], tint: '#0c0c1c', effect: 'fog' },
    intro: 'Camp again. Before you can ask, your starter is already sitting at the edge of the firelight with its back to you, facing the dark. Nobody told it to. It looks over its shoulder once, to make sure you are lying down.',
    choices: [
      ch('Let it.', out('You sleep better than you have in weeks. In the morning it is exactly where you left it.', rest(), fr(5, 'starter'), flag('watch-again'))),
      ch('Sit up with it.', out('You sit down next to it. It leans on you, just slightly. Neither of you sleeps much. Neither of you minds.', fr(10, 'starter'), flag('watch-again'))),
    ],
  },
];

export const EVENTS: Json[] = [...SF32, ...SF33, ...SF35, ...SF38];
export const REMOVE: string[] = [];
