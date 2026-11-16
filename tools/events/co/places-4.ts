// Catalog Overhaul Pack, category "places": the Delves, part 4 (STORY_FAMILIES_14.md).
// The Celestial Observatory (ledger verdict SYSTEM: "A Deoxys Telling delve; at Faller 2, a Tear at the exit"), and the old dungeons the pack folds
// into other places: Ancient Ruin Steps and Ancient Ruins (into The Sunken City, SF116), Haunted Mansion (SF118), Forgotten Research Lab (SF124).
import { $, RARE_HELD, any, ch, flag, flagIs, fr, has, heal, hurt, item, rp, type Json } from '../dsl.ts';
import { delve, moment, variant } from './_delve.ts';

export const CATEGORY = 'places';

const sky = delve({
  slug: 'celestial-observatory', name: 'The Celestial Observatory', rooms: 'abcdefgh', types: ['psychic', 'fairy'], tint: '#221c40', minStage: 5,
  mons: { b: 'elgyem', c: 'minior', f: 'clefairy' },
  gate: {
    intro: 'A dome of old glass stands on the hilltop over a brass map of the sky. The telescope inside is trained on one empty patch of stars, and by the worn floor round it, it has been for decades. Someone is waiting for something to come back.',
    enter: 'Go in under the dome.', enterText: 'Your footsteps ring on brass constellations. Overhead, through the cracked glass, the real ones look down.',
    pass: 'Leave the stargazers to it.', passText: 'You walk on down the hill. Behind you the great telescope does not move a hair.',
  },
});
const SKY: Json[] = [
  sky.room('a', 'A dome of old glass over a map of the sky. A carved mechanism blocks the inner door, worn but readable: a brass orrery, its planets on rings, waiting to be set to a night that someone thought worth remembering.', (n) => [
    ch('Set the planets to tonight\'s sky.', n.to('You look up through the dome and move each brass world to where its real one hangs. The last ring clicks. Somewhere a counterweight falls, and the inner door swings open on oiled hinges. Somebody still oils them.', rp(2)), { check: 'intelligence', fail: n.stay('You set them, and nothing moves. One planet is wrong. You look up through the cracked glass and start again.') }),
    ch('Force the door.', n.stay('The door is brass a hand thick. It rings like a bell when you hit it, and does nothing else.')),
    ch('Read the plate on the orrery.', n.stay('A small engraved plate, polished by a thumb: "The night it came. Set the sky as it is NOW, not as it was. It will not come the same way twice."', flag(n.f('plate')), rp(1))),
    n.back,
  ], (n) => [
    variant('plate', [flagIs(n.f('plate'))], { notice: 'The plate says to set the sky as it is now.', hide: [2] }),
  ]),
  sky.room('b', 'The stair winds up through the dome\'s machinery. An Elgyem hangs in the air between two great gears, fingers flickering red, yellow, green, as if counting something far away.', (n) => [
    ch('Battle.', n.wild('The lights stop. It turns to you, very slowly.', { species: ['elgyem'], lv: 2, win: [rp(1)] })),
    ch('Flicker a light back.', n.to('You cover and uncover your lamp: three short, like its last pattern. It stares. Then it answers, faster, delighted, and drifts up the stair ahead of you still signalling, as if you had said something very funny.', fr(1))),
    ch('Slip past.', n.to('You climb past underneath it. It never stops counting.')),
    n.back,
  ]),
  sky.room('c', 'An unusual cry, like gravel poured on glass. A Minior has come through a broken pane and lies in a crater of its own on the gallery floor, shell cracked, the bright core showing through, pulsing.', (n) => [
    ch('Battle.', n.wild('It lifts off the floor, spinning, shedding shell.', { species: ['minior'], lv: 2, win: [rp(2)] })),
    ch('Carry it to the broken pane.', n.to('It is warm and heavier than it looks. You hold it up to the gap in the glass. It hangs in your hands a moment, as if getting its bearings, then rises out into the night and is one more light among the rest.', fr(3), rp(2), moment('You helped a fallen Minior back into the sky.', 45))),
    ch('Leave it.', n.to('You step round the crater. It pulses on, patient as a lighthouse, waiting for the sky to notice it is missing.')),
    n.back,
  ]),
  sky.room('d', 'The floor ahead looks wrong: the gallery here is glass, an old skylight for the room below, and it is starred with cracks. There are chalk marks where someone tested each pane.', (n) => [
    ch('Follow the chalk marks.', n.to('A tick means safe. A cross means not. Somebody small and careful did this, pane by pane, years ago. You walk on ticks all the way across.')),
    ch('Run across.', n.to('You run. Glass sings under you, and holds.'), { chance: 0.5, fail: n.to('A crossed pane goes under your heel. You catch the frame; your team hauls you up, all of you cut and shaking.', hurt(0.1)) }),
    ch('Lay a plank from the stair.', n.to('You pull a loose tread from the stair and bridge the worst of it. It is slow, undignified, and nobody bleeds.')),
    n.back,
  ]),
  sky.room('e', 'A sealed chamber off the gallery, its lock cold and old: a star chart cut into the door, with one star missing, a small square hole where it should be.', (n) => [
    ch('Fit a Star Piece in the hole.', n.to('The Star Piece sits in the gap as if cut for it. The chart turns, the door opens. Inside: the observatory\'s strongroom, and what its keepers thought worth locking up.', { kind: 'loseItem', id: 'star-piece' }, any(...RARE_HELD), item('stardust', 2), rp(2)), { requires: [has('star-piece')] }),
    ch('Force it.', n.to('The door does not notice you.')),
    ch('Leave it.', n.to('You leave the chart one star short.')),
    n.back,
  ]),
  sky.room('f', 'The top gallery, open to the sky. A ring of Clefairy is dancing round the base of the telescope, slowly, solemnly, in the dust of a path worn by a hundred nights of the same dance.', (n) => [
    ch('Battle.', n.wild('The dance breaks. They are very cross.', { species: ['clefairy'], chain: 2, lv: 2, win: [rp(1)] })),
    ch('Wait for the dance to end.', n.to('You sit on the stair and watch. It takes a long time, and at the end they all look up at the same empty patch of stars, and sigh, and file away. One pats your knee as it passes.', heal(0.25), fr(2))),
    ch('Join the ring.', n.to('You take a place in the ring and shuffle round with them, getting the steps wrong. Nobody minds. When it ends, every one of them looks up at the same empty patch of stars. So do you.', fr(3), flag(n.f('danced')))),
    n.back,
  ]),
  sky.room('g', 'The deepest room is the highest: the telescope\'s cradle. An old woman sits at the eyepiece in a coat stitched with constellations. "Star Keeper. Forty years I\'ve held this glass on one spot. It came once. If you\'ve come to move my telescope, you\'ll have to move me."', (n) => [
    ch('Battle.', n.trainer('"Good. I was getting stiff."', 'The Star Keeper', { team: ['beheeyem', 'clefable', 'starmie', 'lunatone', 'solrock'], lv: 3, cls: 'psychic', win: [flag(n.f('resident-beaten')), $(900)] })),
    ch('Ask what came.', n.to('"A light that changed shape as it fell. Red and green, like nothing born here. It looked at me through this glass. Looked BACK." She laughs at herself. "I was nineteen. I\'ve been waiting to be looked at again ever since." She waves you to the roof stair. "Go and see my sky."', flag(n.f('resident-asked')), rp(2))),
    ch('Offer to keep watch.', n.to('You take the eyepiece. She stands, creaking, and for the first time in forty years walks away from it: makes tea, eats something, sleeps an hour in her chair. You watch one empty patch of sky. Nothing comes. When she wakes she takes your hands in both of hers and cannot speak.', flag(n.f('resident-watched')), heal(0.5), fr(2), moment('You kept the Star Keeper\'s watch so she could rest.', 60))),
    n.back,
  ]),
  sky.room('h', 'The roof. Open sky from edge to edge, more stars than dark. The telescope below you points at its one empty patch.', (n) => [
    ch('Look where the telescope looks.', n.to('You look at the empty patch until your eyes water. And then it is not empty. One point, red and green, that was not there. It does not fall. It turns, the way a head turns. Down below, the Star Keeper cries out. She has seen it too.', flag(n.f('done')), flag('telling-deoxys'), rp(3), moment('Something in the sky looked back at the Celestial Observatory.', 60))),
    ch('Lie back and watch them all.', n.to('You lie on the warm lead of the roof with your team in a row beside you and watch the whole sky wheel. Nobody speaks. It is one of the good nights.', flag(n.f('done')), heal(0.5), fr(3))),
    ch('Go down.', n.to('You take the outside stair down the dome and leave the sky to the people who wait for it.', flag(n.f('done')))),
  ], (n) => [
    variant('tear', [flagIs('faller-rank', 2)], { notice: 'The sky above the dome is wrong. A crack hangs in it, thin as a hair, with a different dark behind: a Tear. You have looked through such things before, and this one knows you.', add: [ch('Stand under the Tear.', n.to('You stand beneath it and it widens, a little, the way a pupil does. Something on the far side is deciding about you. Then the stars slide back over it like a lid. Your hands will not stop shaking for an hour.', flag(n.f('done')), flag('tear-observatory'), flag('telling-deoxys'), rp(4)))] }),
    variant('watched', [flagIs(n.f('resident-watched'))], { notice: 'The Star Keeper has come up to the roof behind you, wrapped in a blanket, rested for the first time in years.' }),
  ]),
];

export const EVENTS: Json[] = [sky.gate, ...SKY];

// Old dungeons the pack merges into other places (their rooms are never drawn again; the places are built in places-7..).
const rooms = (slug: string, letters: string): string[] => [...letters].map((l) => `dg-${slug}-${l}`);
export const MERGED_DUNGEONS: Record<string, string[]> = {
  'ancient-ruin-steps': rooms('ancient-ruin-steps', 'abcde'),
  'ancient-ruins': rooms('ancient-ruins', 'abcdefgh'),
  'haunted-mansion': rooms('haunted-mansion', 'abcdefghi'),
  'forgotten-lab': rooms('forgotten-lab', 'abcdefgh'),
};
export const REMOVE: string[] = Object.values(MERGED_DUNGEONS).flat();
