// Anime questlines, module 0: the three worked examples every other anime module follows.
//   AN9  The Crew of the Rusted Anchor  (Stage-Three; script: QUESTLINES_DEEPENED_1.md "AN9")
//   AN11 The Camp at the Lake           (Single;      script: QUESTLINES_ANIME_INSPIRED.md "AN11")
//   AQ16 The Shiny Owl                  (Companion;   script: QUESTLINES_DEEPENED_2.md "AQ16")
// Build: npm run co:build -- anime-0
import { $, ch, ev, fight, flag, flagIs, fr, heal, item, leave, lv, out, relic, rest, room, type Json } from '../dsl.ts';
import { AN, AQ, age, beast, bondLine, duel, evolve, gain, later, line, moment, noLine, notYet, seen, stageOf, tagTypes, temp, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = { AN9: 'an09-rusted-anchor', AN11: 'an11-camp-at-the-lake', AQ16: 'aq16-shiny-owl' };

export const PLACEMENT: Record<string, Place> = {
  'an09-rusted-anchor': { shape: 'Stage-Three', earliest: 'A4', home: 6, window: [4, 8], sits: 'optional', tags: ['water'], level: 'A+1', beats: ['an09-three-islands', 'an09-the-storm'], note: 'Steps 6, 12, 17. The islands fight is A+0, the storm A+1.' },
  'an11-camp-at-the-lake': { shape: 'Single', earliest: 'A1', home: 'a + node', sits: 'optional', attaches: 'rest', tags: ['water'] },
  'aq16-shiny-owl': { shape: 'Companion', earliest: 'A3', home: 11, window: [8, 14], sits: 'optional', attaches: 'before', tags: ['forest'], level: 'A+1', beats: ['aq16-owl-watch', 'aq16-owl-hat', 'aq16-owl-sun', 'aq16-owl-lamps'], note: 'Night. Hunters A+0, the turning point A+1, two stages on at Step 13.' },
};

/** Doc choices that are not buttons (questline -> label -> reason). Keep it short: a label the doc writes on a button belongs on a button. */
export const NOT_A_BUTTON: Record<string, Record<string, string>> = {
  AQ16: { 'Seen a bird? Gold?': 'the hunter\'s question, printed on the same line as the choices' },
};

/** Questline -> the date it was last re-read against its doc. */
export const CHECKED: Record<string, string> = { AN9: '2026-11-16', AN11: '2026-11-16', AQ16: '2026-11-16' };

export const LIMITS: Record<string, string[]> = {
  AN9: [
    'The crew helps in the storm fight as one boost (your Pokémon take 15% less damage); the navigator calling the foe\'s next move is told in the text only.',
    'The crew\'s flag is a run relic (healing items restore 10% more); the doc\'s "sea-stage rests heal a little more" has no rest-heal modifier yet. Keepsakes are cut, so it is not a keepsake.',
    'Remembers "The Captain\'s Chest dive" reads flag captains-chest-dived, which the thread that owns that event must set. The later-run postcard is not built (nothing crosses runs).',
  ],
  AN11: [
    'The curry is a map-only bag item that fully restores one Pokémon; the doc\'s pot heals the party, which no bag item can do.','Remembers "no battle for a whole stage" (a wild Rolycoly comes to the fire) is not built: the game does not record battles per stage.'],
  AQ16: [
    '"Catch it first" starts its Bond low (friendship 40 instead of 70); the doc says Bond 0.',
    'Its Hypnosis "cannot miss" in the turning-point fight is not built; the fight is an ordinary A+1 double battle.',
    'Remembers "released a shiny on this save" is not built (nothing crosses runs).',
  ],
};

const SEA = tagTypes('water');
const WOOD = tagTypes('forest');

export const EVENTS: Json[] = [
  // ---------------- AN9. The Crew of the Rusted Anchor ----------------
  ev('an09-rusted-anchor', 'The Crew of the Rusted Anchor', AN, { rarity: 'rare', minStage: stageOf('A4'), types: SEA, cast: ['trainer.pr/veteran_m'], pokemon: 'dhelmise', tint: '#1d3a4a', effect: 'float' },
    'A small ship rides at the jetty. It has had three other names, and they all show through the paint. Coiled on the bow, draped in weed like a shawl, is a Dhelmise: a living anchor. A man stands on the rail with his arms flung wide. "I\'m Captain Marcellin Hathersage. Barnacle, to my crew. I\'m going to find the island at the end of the map!" He looks you up and down. "I need a crew. You look like a crew." The Dhelmise creaks, long and low, like a door that has an opinion.',
    [
      ch('Join.', out('"HA!" He nearly falls off the rail. You catch his coat. "First act as crew: saving the captain. Promotion!" The Dhelmise loops a strand of weed round your wrist, gently, the way it would test a rope. "Three islands ahead. A crew is out there, they just don\'t know it yet. We sail when you reach the water."', flag('an09-crew-joined'), fr(2), later('an09-three-islands', 5))),
      ch('What\'s at the end?', out('"No idea! That\'s the point. If I knew, somebody would have been." He says it with his whole chest, and for a moment the old patched ship looks like the finest thing on the sea. The offer stands; he shouts it after you twice.', flag('an09-crew-asked-end'), room('an09-rusted-anchor-again'))),
      ch('You can\'t swim?', out('He glances at the water the way other people glance at a debt. "Neither can the anchor. We\'re fine." The Dhelmise creaks. It sounds a little like laughing. The offer stands.', flag('an09-crew-asked-swim'), room('an09-rusted-anchor-again'))),
    ]),
  ev('an09-rusted-anchor-again', 'The Crew of the Rusted Anchor', AN, { room: true, cast: ['trainer.pr/veteran_m'], pokemon: 'dhelmise', tint: '#1d3a4a', effect: 'float' },
    'Captain Hathersage is still on the rail, still with his arms out, as if the answer might come in on the wind. "Well? The map isn\'t getting any shorter!"',
    [
      ch('Join.', out('"A crew of two!" He counts on his fingers anyway. The Dhelmise loops weed round your wrist: you are tied on now. "Three islands ahead. We sail when you reach the water."', flag('an09-crew-joined'), fr(2), later('an09-three-islands', 5))),
      ch('Not this voyage.', leave('"Then wave when we pass!" he calls. You do not doubt that he will pass, somewhere, shouting.')),
    ]),
  ev('an09-three-islands', 'Three Islands', AN, { room: true, requires: [flagIs('an09-crew-joined')], cast: ['trainer.pr/veteran_m', 'trainer.aroma_lady'], pokemon: 'cramorant', tint: '#1d3a4a', effect: 'float' },
    'The Rusted Anchor noses between three small islands. On the first, Miss Persimmon Yardley runs a food stall nobody visits. On the second, Mr. Valerian Underhill has drawn a map of somewhere he has never been. On the third, a Cramorant stands very still with a fish stuck in its throat. "Crew!" the captain whispers, far too loudly. "Every one of them! Go and tell them!"',
    [
      ch('Eat what the cook makes.', out('It is very good, and it is very strange: something purple, something that hums. You eat all of it. Miss Yardley watches the empty bowl as if it were a letter. "He said he\'d eat anything. Nobody has ever said that to me as a compliment." She packs her knives. She was packed already; she only needed asking.', flag('an09-crew-cook'), heal(0.5), room('an09-island-navigator'))),
    ]),
  ev('an09-island-navigator', 'The Navigator\'s Bet', AN, { room: true, requires: [flagIs('an09-crew-cook')], cast: ['trainer.pr/rich_m'], tint: '#1d3a4a', effect: 'float' },
    'Mr. Valerian Underhill holds his map to his chest. The coastline on it is beautiful and belongs to nowhere. "A battle. I bet the map. If I lose, I come. If I win, I come, and I bring the map." He frowns. "I don\'t see a way I don\'t come."',
    [
      ch('Take the bet.', fight('He bows, very formally, to you and then to the sea.', duel('Navigator Underhill', { cls: 'veteran', size: 2, types: ['water', 'flying'], win: [flag('an09-crew-navigator'), room('an09-island-bird')] }, { lose: [flag('an09-crew-navigator'), flag('an09-crew-navigator-won'), room('an09-island-bird')] }))),
    ]),
  ev('an09-island-bird', 'A Bird With a Problem', AN, { room: true, requires: [flagIs('an09-crew-navigator')], pokemon: 'cramorant', tint: '#1d3a4a', effect: 'float' },
    'Mr. Underhill is already aboard, map and all. On the third island the Cramorant has not moved. Its eyes are wide. The tail of a fish sticks out of its beak and waves, faintly.',
    [
      ch('Pat it on the back.', out('One good pat. The fish shoots out, lands in the sea and swims off, offended. The Cramorant looks at you. It looks at the ship. It has nowhere else to be, so it walks up the gangplank as if it had a ticket. The captain counts: "A cook! A navigator! A bird! And you! That\'s a crew! That\'s four more than I had!"', flag('an09-crew-bird'), flag('an09-crew-whole'), fr(3), later('an09-the-storm', 5))),
    ]),
  ev('an09-the-storm', 'The Storm', AN, { room: true, requires: [flagIs('an09-crew-whole')], cast: ['trainer.pr/veteran_m'], pokemon: 'gyarados', tint: '#143028', effect: 'rain',
    remembers: [{ id: 'chest-brother', when: [flagIs('captains-chest-dived')], notice: 'The anchor has been watching you all voyage. It knows the diver who opened its brother\'s chest. It goes very still, and then it holds on tighter.' }] },
    'The sky goes green. The sea stands up. Captain Hathersage goes over the side with the first wave, and he cannot swim. The anchor goes in after him. It cannot swim either. It sinks on purpose, chain run out, and comes up underneath him like a floor. Then the wave that took him opens its eyes: a Gyarados, as angry as the weather. Miss Yardley is already throwing something from her pot. Mr. Underhill is shouting what it will do next. The Cramorant has a fish ready.',
    [
      ch('Fight for the ship!', fight('The deck pitches. The crew is at your back, every one of them, shouting.', beast({ species: ['gyarados'], lv: 1, win: [flag('an09-crew-storm-won'), room('an09-after-the-storm')] }), temp('The crew at your back', [{ kind: 'damageTakenMultiplier', value: 0.85 }], 1))),
      ch('Haul the captain in first.', out('You get the rope round him while the Gyarados circles. The anchor heaves; the cook and the navigator heave; the bird helps by standing on your head. The great serpent looks at the five of you, soaked and shouting on a ship that should have sunk three names ago, and decides the storm is company enough. It dives.', flag('an09-crew-storm-hauled'), room('an09-after-the-storm'))),
    ]),
  ev('an09-after-the-storm', 'As a Crew', AN, { room: true, cast: ['trainer.pr/veteran_m'], pokemon: 'dhelmise', tint: '#1d3a4a', effect: 'sparkle' },
    'Captain Hathersage is hauled aboard upside down. "Did you see that? We nearly died! As a crew!" He is crying, or it is the sea. The anchor settles back on the bow and, very carefully, breaks off a young cutting of itself: a small Dhelmise, still soft, that it sets on the deck in front of you. The cook presses a folded flag into your hands. It has five badly sewn figures on it. One is a bird.',
    [
      ch('Take the cutting and the flag.', out('The little Dhelmise winds itself round your arm and holds on. The flag smells of salt and purple stew. "Not the end!" the captain shouts as the ship pulls away. "There\'s more map! Come!" You can hear him for a long time.', gain('dhelmise', { bond: 20 }), relic('crews-flag', 'The Crew\'s Flag', [{ kind: 'healingMultiplier', value: 1.1 }]), flag('an09-crew-flag'), moment('You sailed with the crew of the Rusted Anchor, and nearly died. As a crew.', 70))),
      ch('Keep the flag. The cutting belongs at sea.', out('The anchor considers this, and tucks the cutting back among its weed. It dips its whole great weight toward you, once: a bow. The flag is yours. "Not the end!" the captain shouts. "There\'s more map!"', relic('crews-flag', 'The Crew\'s Flag', [{ kind: 'healingMultiplier', value: 1.1 }]), flag('an09-crew-flag'), fr(3), moment('You sailed with the crew of the Rusted Anchor, and nearly died. As a crew.', 70))),
    ]),

  // ---------------- AN11. The Camp at the Lake ----------------
  ev('an11-camp-at-the-lake', 'The Camp at the Lake', AN, { rarity: 'uncommon', minStage: stageOf('A1'), types: SEA, stop: 'event', cast: ['trainer.aroma_lady'], pokemon: 'sizzlipede', tint: '#1c2a3c', effect: 'fire' },
    'A girl sits by a tiny camp stove at the edge of a lake. A Sizzlipede is curled around the stove for warmth, or the stove is curled around the Sizzlipede. "You camp too? Solo or group?" She does not wait for the answer. "I always go solo. But this lake is better with someone to show it to." She lifts a lid, and the steam makes your eyes water. "Stay for curry. It\'s very spicy."',
    [
      ch('Stay.', out('The curry is very spicy. Your Pokémon eat in a ring round the stove, and for once nobody is watching the dark for the next thing. The lake goes black, then silver. The stars come out one at a time, as if somebody were counting them. Nobody battles. Nobody needs to. In the morning she has packed a pot of curry into your bag, still warm, and she is already gone.', heal(1), rest(), fr(3), item('camp-curry'), flag('an11-camp-stayed'))),
      ch('Show me the lake.', out('She walks you round it with a lantern. The water is so cold it rings when a stone goes in. "I come here every year," she says. "I\'ve never shown anybody. It looked like this the whole time. I just needed a witness." You eat curry on the far shore, under more stars than the sky should hold. In the morning there is a warm pot in your bag.', heal(1), rest(), fr(3), item('camp-curry'), flag('an11-camp-stayed'), flag('an11-camp-lake-shown'))),
      ch('Go.', leave('"Next time, then." She says it easily, like someone who is used to it. Behind you the little stove glows, one orange point beside a very large lake.')),
    ]),

  // ---------------- AQ16. The Shiny Owl ----------------
  ev('aq16-shiny-owl', 'The Shiny Owl', AQ, { rarity: 'rare', minStage: stageOf('A3'), types: WOOD, cast: ['trainer.roughneck'], pokemon: 'hoothoot', tint: '#14201a', effect: 'net' },
    'A wood at night, full of swinging lamps. On a low branch sits a Hoothoot that is the wrong colour for hiding: gold and red, so every lamp finds it. It is smaller than it should be. It stands on one foot, then the other, and each time it swaps, three lamps swing. "A shiny! Worth a fortune," a hunter hisses. "Left side, Dunstan. Left." The Hoothoot looks at you and hoots once, as if asking.',
    [
      ch('Stop the hunters.', fight('You step into the lamplight. Up on the branch, the Hoothoot turns its head right round to keep both hunters in view.', duel('Hunters Dunstan and Crake', { cls: 'roughneck', size: 2, format: 'doubles', types: ['dark', 'poison'], win: [flag('aq16-owl-saved'), room('aq16-owl-follows')] }, { lose: [flag('aq16-owl-lost-fight'), room('aq16-owl-follows')] }))),
      ch('Catch it first.', out('It fights the Ball. It fights it twice. When the Ball finally clicks shut the hunters curse and go, and the wood is dark and quiet. You let it out at once. It will not look at you. One wing is held a little away from its body. It can still come round; it has decided, for now, that you are one more lamp.', gain('hoothoot', { shiny: 9999 }), bondLine('hoothoot', -30), flag('aq16-owl-met'), flag('aq16-owl-caught'))),
      ch('Hide it.', out('You take off your hat. It gets in. It is very warm, and it is holding its breath. A hunter stops a foot away. "Seen a bird? Gold?"', flag('aq16-owl-hidden'), room('aq16-owl-in-the-hat'))),
    ]),
  ev('aq16-owl-in-the-hat', 'A Hat With a Heartbeat', AQ, { room: true, cast: ['trainer.roughneck'], tint: '#14201a', effect: 'net' },
    'The hunter lifts his lamp. Your hat is on your head. Your hat has a heartbeat. "Well? Seen a bird? Gold?"',
    [
      ch('No.', out('He looks at you for a long moment. Lying has never felt so much like holding something. Then he grunts and the lamps move off between the trees. The Hoothoot stays in your hat until morning. When the sun comes up, it is still there.', gain('hoothoot', { shiny: 9999, bond: 10 }), flag('aq16-owl-met'))),
      ch('That way.', out('You point the wrong way with great confidence. "Left side, Dunstan!" They crash off into the brambles. Inside the hat there is one very small, very relieved hoot. It stays on your hat until morning. When the sun comes up, it is still there.', gain('hoothoot', { shiny: 9999, bond: 10 }), flag('aq16-owl-met'))),
      ch('What\'s it worth to you?', out('"A fortune," he says, and names it. It is a lot. Inside your hat, the heartbeat stops for one whole second. "Not enough," you say, and he laughs, not understanding, and goes. The Hoothoot stays on your hat until morning. It keeps checking that you are still under it.', gain('hoothoot', { shiny: 9999 }), flag('aq16-owl-met'), flag('aq16-owl-priced'))),
    ]),
  ev('aq16-owl-follows', 'At a Distance', AQ, { room: true, pokemon: 'hoothoot', tint: '#14201a', effect: 'glint' },
    'The hunters are gone, lamps and all. You walk on. Behind you, a branch dips. Then a nearer one. The gold Hoothoot is following you: at a distance, for a while. Then nearer.',
    [
      ch('Hold out an arm.', out('It thinks about the arm for the length of one foot-swap. Then it lands, lightly, as if it might have to leave at once. It does not leave.', gain('hoothoot', { shiny: 9999, bond: 10 }), flag('aq16-owl-met'))),
      ch('Let it follow as it likes.', out('You do not look back. That seems to be the right thing. By the next rise it is on your shoulder, facing backwards, watching the dark for both of you.', gain('hoothoot', { shiny: 9999, bond: 5 }), flag('aq16-owl-met'))),
      ch('Wave it home.', leave('It watches you go from a high branch, a small gold lamp of its own. It will remember that someone stepped into the light for it.')),
    ]),
  // Small scenes: one each time its Bond rises a step, while it is in the party.
  ev('aq16-owl-watch', 'It Won\'t Sleep', AQ, { callback: true, requires: [flagIs('aq16-owl-met'), line('hoothoot', 1), age('aq16-owl-met', 1)], pokemon: 'hoothoot', tint: '#14201a', effect: 'none' },
    'Camp, late. Everyone is asleep except the Hoothoot. It sits bolt upright on one foot, watching the dark between the trees, the way you watch a door someone once came through.',
    [
      ch('Let your lead sit up with it.', out('Your lead Pokémon gets up without being asked and sits down beside it. Neither of them looks at the other. They watch the dark together until it is only dark. Near dawn, the Hoothoot swaps feet, and its eyes close.', bondLine('hoothoot', 5), fr(2, 'lead'), flag('aq16-owl-scene-1'))),
      ch('Sit up with it yourself.', out('You pull your blanket over and sit. It glances at you, once, as if checking a sum. The night is long and nothing comes out of it. That is the whole point, and the Hoothoot is beginning to believe it.', bondLine('hoothoot', 5), flag('aq16-owl-scene-1'))),
    ]),
  ev('aq16-owl-hat', '"Look at That"', AQ, { callback: true, requires: [seen('aq16-owl-watch'), line('hoothoot', 2)], pokemon: 'hoothoot', tint: '#2a2a1c', effect: 'none' },
    'On the road somebody points and says, "Look at that." They mean a cloud. The Hoothoot is behind your legs before the sentence ends, wings tight, trying to be a brown bird by force of will.',
    [
      ch('Put the hat on it.', out('You set your hat down over it. The hat walks along the road for a while on two small feet. Then one gold eye looks out from under the brim, at the cloud everyone is admiring, and stays out.', bondLine('hoothoot', 5), flag('aq16-owl-scene-2'))),
      ch('Stand between it and the road.', out('You stand there until the strangers have gone. It leans on your ankle, very slightly: the weight of a bird that has decided where the safe side is.', bondLine('hoothoot', 5), flag('aq16-owl-scene-2'))),
    ]),
  ev('aq16-owl-sun', 'A Little Sun', AQ, { callback: true, requires: [seen('aq16-owl-hat'), line('hoothoot', 3)], pokemon: 'hoothoot', tint: '#3a3420', effect: 'sparkle' },
    'A child at a Pokémon Center stops dead in front of you. "It\'s GOLD!" The Hoothoot flinches so hard it nearly leaves the perch. The child does not reach for it. The child only stares, delighted. "It\'s like a little sun."',
    [
      ch('"It is, isn\'t it."', out('It has been called a fortune. It has been called the gold one, the left side, a shiny. It has never been called that. It thinks about it for the whole of the next road, turning the words over, standing a little taller on each foot.', bondLine('hoothoot', 5), flag('aq16-owl-scene-3'), flag('aq16-owl-little-sun'))),
      ch('Let it answer for itself.', out('It looks at the child for a long time. Then, very slowly, it opens its wings, all the way, so the light can find every feather. The child claps. It thinks about that for the whole of the next road.', bondLine('hoothoot', 5), flag('aq16-owl-scene-3'), flag('aq16-owl-little-sun'))),
    ]),
  // The turning point: two stages after the meeting, while it is still in the party as a Hoothoot or a Noctowl.
  ev('aq16-owl-lamps', 'The Same Lamps', AQ, { callback: true, minStage: stageOf('A5'), requires: [flagIs('aq16-owl-met'), age('aq16-owl-met', 2), line('hoothoot')], types: WOOD, cast: ['trainer.roughneck'], pokemon: 'hoothoot', tint: '#14201a', effect: 'net',
    remembers: [
      { id: 'little-sun', when: [flagIs('aq16-owl-little-sun')], notice: 'Somewhere a child once called it a little sun. It has not forgotten. It is standing very tall.' },
      { id: 'caught-first', when: [flagIs('aq16-owl-caught')], notice: 'You caught it in a wood like this one, with lamps like these. It looks at the lamps. It looks at you. It stays on your shoulder.' },
    ] },
    'A wood, at night. The same lamps. The hunters have brought a third, with a bigger net. "It\'s the gold one. You\'ll not miss it. It can\'t hide; that\'s the beauty." The Hoothoot is on your shoulder. It is shaking. Then it isn\'t. It flies up, into the open, into every lamp at once. And it glows. The light does not find it now. It is making its own.',
    [
      ch('Fight beside it.', fight('The hunters cannot look away from it. None of them can.', duel('The Three Hunters', { cls: 'roughneck', size: 3, format: 'doubles', types: ['dark', 'poison'], lv: 1, win: [evolve('hoothoot', 'noctowl'), bondLine('hoothoot', 10), flag('aq16-owl-turned'), room('aq16-owl-gold')] }, { lose: [flag('aq16-owl-turned'), flag('aq16-owl-lamps-lost'), room('aq16-owl-gold')] }))),
      ch('Let it show them alone.', out('You stay where you are. It hangs in the air above the three of them, blazing, and it does not attack. It only lets them look. One by one the lamps go down. A net is dropped. The third hunter says, quietly, "I never saw one fly at the light before," and they go. It comes back to your shoulder lit from the inside, and something in it has finished growing.', evolve('hoothoot', 'noctowl'), bondLine('hoothoot', 10), flag('aq16-owl-turned'), flag('aq16-owl-alone'), room('aq16-owl-gold'))),
    ]),
  ev('aq16-owl-gold', 'The Gold Doesn\'t Dull', AQ, { room: true, pokemon: 'noctowl', tint: '#3a3420', effect: 'sparkle' },
    'The wood is dark again, except for one thing. It sits on the highest branch it can find, where anybody at all could see it, and it does not stand on one foot.',
    [
      ch('Call it down.', out('It comes, in its own time, in a long gold curve through the trees. It lands on your shoulder, heavier than it was. It does not hide when the next traveller says, "Look at that." It lets them look.', lv(1, 'lead'), moment('The gold owl flew into every lamp at once, and made its own light.', 75), flag('reunion-guest-shiny-owl'))),
    ]),
  // If it was never taken in, or left the party for good before the turning point, the meeting is the whole story.
  ev('aq16-owl-seen-again', 'Gold in the Trees', AQ, { callback: true, minStage: stageOf('A5'), requires: [flagIs('aq16-owl-saved'), notYet('aq16-owl-met'), age('aq16-owl-saved', 2), noLine('hoothoot')], types: WOOD, pokemon: 'noctowl', tint: '#14201a', effect: 'glint' },
    'High in a wood, at night, something gold crosses the moon. No lamps follow it. It circles once over your camp, lower than it needs to.',
    [
      ch('Raise a hand.', out('It dips one wing, the way a ship dips a flag, and is gone over the trees: bigger now, and not hiding. On your blanket in the morning there is one gold feather and a Nugget it must have taken from somebody who deserved it.', item('nugget'), $(300), flag('aq16-owl-thanked'))),
    ]),
];

export const REMOVE: string[] = [];
