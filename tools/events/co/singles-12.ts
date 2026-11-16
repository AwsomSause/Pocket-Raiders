// Catalog Overhaul Pack, category "singles" (revised single events), batch 12.
// Doc: catalog_overhaul/STORY_FAMILIES_22.md SF158 Seasonal and Cultural Festivals (calendar weeks).
// Each week's opening line and choice is a stop drawn only while that week runs (`gameEvent`); "for the week" lasts the region.
// Known limits: docs/status/co-singles.md.
import { $, any, bondUp, ch, fight, flag, good, heal, item, out, reveal, trainer, wild, type Json } from '../dsl.ts';
import { friendlyAll } from './_singlesKit.ts';

export const CATEGORY = 'singles';

const moment = (text: string, importance = 35): Json => ({ kind: 'moment', text, importance });
const rest: Json = { kind: 'rest' };
const rep = (n = 1): Json => flag('rep', n);
const fire: Json = { kind: 'partyType', type: 'fire' };
/** "For the week": lasts until the run moves on to the next region. */
const week = (label: string, effects: Json[]): Json => ({ kind: 'tempEffect', label, effects, until: 'region' });
const more = (...types: string[]): Json[] => types.map((type) => ({ kind: 'typeEncounterWeight', type, value: 2 }));
/** A calendar week's opening stop: drawn only while the week runs. */
export const wk = (weekId: string, name: string, intro: string, choices: Json[]): Json => ({
  id: weekId, name, group: 'Calendar weeks', stop: 'event', rarity: 'common', gameEvent: weekId,
  scene: { cast: [], effect: 'sparkle' }, intro, choices,
});
const rm = (id: string, name: string, intro: string, choices: Json[]): Json => ({ id, name, group: 'Calendar weeks', room: true, scene: { cast: [], effect: 'none' }, intro, choices });
const STARTERS = ['bulbasaur', 'charmander', 'squirtle', 'chikorita', 'cyndaquil', 'totodile', 'treecko', 'torchic', 'mudkip'];

// ---------- SF158. SEASONAL AND CULTURAL FESTIVALS ----------
const SF158: Json[] = [
  wk('spooky-season', 'Spooky Season Begins', '**"Lanterns lit, and the dead have walked out to the road!"** Pumpkins grin on every gatepost. Somewhere, a parade is tuning up.', [
    ch('Wear a costume.', out('You throw a sheet over your head and cut out two eye holes. The Ghost-types on the road take one look and decide you are one of them. They are friendlier all week, and the Pumpkin King and the Midnight Parade are out there somewhere.', bondUp(1, { types: ['ghost'] }), week('Costume on: Ghost-types are friendlier', [{ kind: 'captureMultiplier', value: 1.1 }, ...more('ghost')]), flag('spooky-costume'))),
    ch('Go as you are.', out('You go as you are. Spooky forms rustle in the long grass, and somewhere out there, the Pumpkin King and the Midnight Parade are waiting.')),
  ]),
  wk('winter-festival', 'Winter Festival', '**"Snow, lights and gifts for everyone!"** A tree in the square, strung with lights, and a pile of presents underneath.', [
    ch('Give a gift.', out('You leave a gift under the tree for someone you will never meet. It feels better than any present you have opened. Somewhere out in the snow, the Frost King stirs, and the gift swap is open.', good(1), bondUp(1, 'party'))),
    ch('Take a gift.', out('A little parcel with your name spelled wrong on it. Inside, something useful. Somewhere out in the snow, the Frost King stirs, and the gift swap is open.', any('pp-up', 'nugget', 'snowball'))),
  ]),
  wk('lunar-new-year', 'Lunar New Year', '**"Red lanterns, dragon dances, lucky envelopes!"** Drums in the street and a dragon made of people, weaving through the crowd.', [
    ch('Join the dragon dance.', out('You dance under the dragon\'s tail, and your Dragon-types dance with you, roaring along with the drums. At the end, an old lady presses a red envelope into your hand: ₽888, for luck.', bondUp(1, { types: ['dragon'] }), $(888))),
    ch('Hang a lantern.', out('You hang a red lantern on the line with the others and make a wish. An old lady presses a red envelope into your hand: ₽888, for luck.', $(888))),
  ]),
  wk('friendship-festival', 'Friendship Festival', '**"Bring your friends, all of them, every last one!"** Blankets on every lawn.', [
    ch('Picnic.', out('You spread a blanket and your whole team piles onto it. All week long, every moment you share counts for a little more.', bondUp(1, 'party'), week('Friendship Festival: Bond gains up', [{ kind: 'friendshipMultiplier', value: 1.5 }]))),
  ]),
  wk('spring-bloom', 'Spring Bloom', '**"The first flowers are out, and so are the eggs!"** Gracidea everywhere, and children with baskets.', [
    ch('Look for eggs.', out('You ask around. The egg hunt is in the meadow, and every hidden place on this road is marked for you.', reveal())),
    ch('Look for the Guardian.', out('You ask about the Guardian. People lower their voices: it keeps the first bloom, in a meadow nobody can quite find. Now you know where to look.', reveal())),
  ]),
  wk('summer-splash', 'Summer Splash', '**"Sun, sea, and the biggest beach battle of the year!"**', [
    ch('Swim.', out('You swim out past the breakers with your team, and the tide pools shine on the way back. Everyone comes out of the sea refreshed.', heal(0.25))),
    ch('Battle.', fight('A warm-up match on the sand with a swimmer who is far too good at this.', trainer('Beach Swimmer', { cls: 'swimmer', size: 2, lv: 0, win: [$(300)] }))),
  ]),
  wk('valentines-duo-week', 'Duo Week', '**"Two hearts, one battle!"** Every match this week is fought in pairs, and pays like it.', [
    ch('Pick a pair from the team.', out('You pick this one, and your lead to stand beside it. All week, doubles pay half again, and the two of them fight like they planned it.', bondUp(1, 'picked'), bondUp(1, 'lead'), week('Duo Week: doubles pay ×1.5', [{ kind: 'doubleBattleRewardMultiplier', value: 1.5 }, { kind: 'friendshipMultiplier', value: 1.1 }])), { pick: {} }),
  ]),
  wk('cherry-blossom-picnic', 'Cherry Blossom Picnic', '**"The blossom only lasts a week. Sit under it while you can."**', [
    ch('Picnic.', out('You lie under the blossom with your team until the petals cover all of you. Everyone is rested, and something small and green watches from the next tree, pleased.', rest, flag('sign-shaymin'))),
  ]),
  wk('pride-rainbow-parade', 'Rainbow Parade', '**"Everyone, exactly as they are!"** A parade under a rainbow that does not fade.', [
    ch('March.', out('You march, and your team marches with you, ribbons on everyone. Overhead, the rainbow burns brighter, and something with burning wings crosses it, once.', bondUp(1, 'party'), flag('sign-ho-oh'))),
    ch('Cheer.', out('You cheer from the side until your voice goes. Overhead, the rainbow burns brighter, and something with burning wings crosses it, once.', bondUp(1, 'party'), flag('sign-ho-oh'))),
  ]),
  wk('midsummer-night', 'Midsummer Night', '**"The shortest night of the year. Nobody sleeps."** Fireflies, and music from the woods.', [
    ch('Stay up.', out('You stay up. Fairies and bugs dance in the dark, and a light comes on in a place on the map you had not noticed before.', week('Midsummer Night: Fairy and Bug Pokémon about', more('fairy', 'bug')), reveal())),
    ch('Sleep.', out('You sleep through it, and wake to dew and birdsong, everyone rested.', rest)),
  ]),
  wk('fireworks-festival', 'Fireworks Festival', '**"Tonight the sky catches fire!"**', [
    ch('Watch.', out('You lie on the hill and watch. Your team gasps at every one. So do you.', bondUp(1, 'party'))),
    ch('Help light them (a Fire-type).', out('Your Fire-type lights the fuses one by one, and the whole crowd cheers its name.', bondUp(1, { types: ['fire'] }), rep(1)), { requires: [fire] }),
  ]),
  wk('autumn-harvest-moon', 'Harvest Moon', '**"The trees are heavy this year. Take what you need."**', [
    ch('Pick Berries.', out('Under the big orange moon, the trees give twice what they should. Your bag is full of Berries.', item('cheri-berry', 2), item('pecha-berry', 2), flag('harvest-moon'))),
  ]),
  wk('thanksgiving-feast', 'The Feast', '**"A long table, and room for everyone."**', [
    ch('Sit down.', out('You eat until nobody can move. Everyone is whole again.', heal())),
    ch('Bring someone.', out('You bring a trainer you met on the road, and they are so happy to be asked. Everyone is whole again, and they will remember you asked.', heal(), flag('roster-trust'))),
  ]),
  wk('winter-solstice', 'Winter Solstice', '**"The longest night. Walk it, or wait for the dawn."**', [
    ch('Walk in the dark.', out('You walk the longest night with your team close around you. Ghosts and Dark-types watch from the trees, and once, at the darkest hour, a shape like a black cloud with a single blue eye passes over you, and your dreams are strange for days.', week('Solstice: Ghost and Dark Pokémon about', more('ghost', 'dark')), flag('telling-darkrai'))),
    ch('Stay by the fire.', out('You stay by the fire until the dawn comes back. Everyone rests.', rest)),
  ]),
  wk('spring-equinox', 'Spring Equinox', '**"Day and night, exactly equal. Stand in the balance."**', [
    ch('Stand in the balance.', out('You stand on the line between the sun and the moon. For a moment you feel both, and something vast, made of light, notices.', flag('sign-light'), moment('Stood in the balance at the equinox.'))),
  ]),
  wk('autumn-equinox', 'Autumn Equinox', '**"The deer are changing their coats."**', [
    ch('Look for the deer.', out('In the gold woods you find them: Deerling and Sawsbuck in their autumn coats. They are everywhere this week.', week('Autumn: Deerling and Sawsbuck about', [{ kind: 'speciesEncounterWeight', lines: ['deerling'], value: 4 }]))),
  ]),
  wk('diwali-light-walk', 'Festival of Lights', '**"Every lamp is lit tonight. Follow them home."**', [
    ch('Follow the lamps.', out('You follow the lamps, and they lead you down paths you would never have found: two hidden places, lit for you.', reveal())),
    ch('Light a lamp.', out('You light a lamp for someone who needs it, and leave it in a window.', good(1), flag('kindness'))),
  ]),
  wk('mid-autumn-moon-cake', 'Moon Festival', '**"Moon cakes, and the biggest moon of the year."**', [
    ch('Share one.', out('You share a moon cake with your lead under the full moon. Baked into the middle, for luck: a Moon Stone.', bondUp(1, 'lead'), item('moon-stone'))),
  ]),
  wk('day-of-the-dead', 'Day of the Dead', '**"Marigolds on every grave, and a candle for every friend."**', [
    ch('Leave marigolds for a lost friend.', out('You leave marigolds for the ones you lost on this road. For one moment, in the candlelight, you see them again, just as they were. Then the wind moves the flames, and the way to the Lantern Sea is open.', flag('lantern-sea-open'), moment('Left marigolds for lost friends.', 60))),
    ch('Watch the parade.', out('Skeletons and Ghost-types dance down the street together. It is joyful, and sad, and joyful again. The way to the Lantern Sea is open.', flag('lantern-sea-open'))),
  ]),
  wk('brew-fair', 'Brew Fair', '**"Berry Juice, every flavour, first cup free!"**', [
    ch('Try one.', out('A cup of Berry Juice for everyone on the team. Everyone feels a little better.', heal(0.25))),
  ]),
  wk('harvest-festival', 'Harvest Festival', '**"Many hands, light work!"** Carts of grain and a farmer who keeps losing track of things.', [
    ch('Help.', out('You help bring the harvest in. The farmer thanks you three times, forgetting each time that he already did, and pays you for the day.', $(300), flag('farmer-forgets-met'))),
  ]),
  wk('pokemon-day', 'Pokémon Day', '**"Every first partner, out in the wild for one day!"**', [
    ch('Visit the starters.', fight('Out in the long grass, a first partner Pokémon, wild and curious, comes trotting up to see who you are.', wild({ species: STARTERS }))),
  ]),
  wk('earth-week', 'Earth Week', '**"Clean the river, plant a tree, leave it better!"**', [
    ch('Volunteer.', out('You sign up for the Big Cleanup. Rock, Ground and Grass Pokémon come out to see the cleared banks all week.', good(1), flag('kindness'), week('Earth Week: Rock, Ground and Grass Pokémon about', more('rock', 'ground', 'grass')))),
  ]),
  wk('stargazing-nights', 'Stargazing Nights', '**"Look up. Something might look back."**', [
    ch('Watch.', out('You lie in the grass and watch the stars all night. Rare Pokémon come out on nights like this.', week('Stargazing: rare Pokémon about', [{ kind: 'encounterWeightMultiplier', group: 'rare', value: 2 }]))),
  ]),
  wk('trainer-academy', 'Trainer Academy Week', '**"Open classes for every trainer on the road!"**', [
    ch('Enrol.', out('You enrol. All week, the study halls are open and the Academy Exam is on, and every trainer on the road is training harder: two levels stronger, and paying a fifth more.', week('Academy Week: trainers +2 levels, prizes +20%', [{ kind: 'enemyLevelOffset', value: 2 }, { kind: 'moneyMultiplier', value: 1.2 }]))),
  ]),
  wk('berry-festival', 'Berry Festival', '**"Plant a Berry, guard a tree, win a prize!"**', [
    ch('Plant.', out('You plant a Berry in the festival ground and pat the soil down. "Come back down the road," says the gardener. "It will have grown."', { kind: 'laterEvent', eventId: 'wk-berry-sprout', nodes: 6 })),
    ch('Guard the tree.', fight('Berry thieves! You stand in front of the festival tree.', trainer('Berry Thief', { cls: 'roughneck', size: 2, lv: 0, win: [any('liechi-berry', 'ganlon-berry', 'salac-berry')] }))),
  ]),
  rm('wk-berry-sprout', 'Your Berry Tree', 'The Berry you planted at the festival has come up: a little tree, heavy with fruit, with your name on a stick beside it.', [
    ch('Pick them.', out('You pick every one. Your bag is full of Berries.', item('cheri-berry', 2), item('rawst-berry', 2), item('persim-berry'))),
  ]),
  wk('new-moon-night', 'New Moon', '**"No moon tonight. Stay in, or go out into the dark."**', [
    ch('Go out.', out('You go out into the dark. Dark-types prowl all week, and once, at the darkest hour, a shape with a single blue eye passes over you.', week('New Moon: Dark Pokémon about', more('dark')), flag('telling-darkrai'))),
    ch('Stay in.', out('You stay in. Everyone rests.', rest)),
  ]),
  wk('full-moon-rise', 'Full Moon', '**"Stand in the moonlight, and be well."**', [
    ch('Stand in it.', out('You stand in the full moon with your team. It is cool and kind, and it heals. Somewhere above, a shape like a crescent drifts across the moon.', heal(0.25), flag('sign-cresselia'))),
  ]),
  wk('friday-the-13th', 'Friday the 13th', '**"Unlucky day! Or is it?"** Black Purrloin on every wall.', [
    ch('Carry a lucky charm.', out('You carry a charm all day. Nothing bad happens. Nothing good either. That is the charm.')),
    ch('Embrace it.', out('You embrace it. First a bad thing: you trip in a puddle and your whole team gets a soaking. Then a good thing: in the puddle, a Nugget.', { kind: 'damage', share: 0.1, who: 'party', except: [] }, item('nugget'), week('Unlucky week: Ghost Pokémon about', more('ghost')))),
  ]),
  wk('palindrome-date', 'Palindrome Day', '**"Today reads the same both ways."**', [
    ch('Look in a mirror.', out('You look in a shop window and your reflection waves a moment too late. All week, mirror matches are waiting on the road: your own team, the other way round.', flag('mirror-week'))),
  ]),
  wk('weekend-warm-up', 'Weekend Warm-Up', '**"It\'s Friday! Celebrate!"**', [
    ch('Celebrate.', out('You celebrate. Prize money is a tenth better until the week is out.', week('Weekend: prize money +10%', [{ kind: 'moneyMultiplier', value: 1.1 }]))),
  ]),
  wk('shiny-charm-day', 'Shiny Charm Day', '**"Today, shiny odds are doubled. Look closely!"**', [
    ch('Look closely.', out('You look closely at every Pokémon you see. Shiny odds are doubled while the day lasts.', week('Shiny Charm Day: shiny odds ×2', [{ kind: 'shinyChanceMultiplier', value: 2 }]))),
  ]),
];

export const EVENTS: Json[] = friendlyAll([...SF158]);
export const REMOVE: string[] = [];
