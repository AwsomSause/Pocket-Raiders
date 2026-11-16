// Catalog Overhaul Pack, legends batch 5 row B: the pseudo-stage worlds and the rift (OPEN_IDS.md row B).
// The legends questlines retired the old doors into the five worlds (ev-distortion-rift, ev-dimensional-collision, ev-dream-orb,
// ev-ancient-discovery, ev-star-path: legends-10.ts REMOVE), so the worlds had no way in. These are the new doors, written to the
// ledger rules: Giratina's worlds are the rifts of Guidance of Giratina and The Renegade's Reverse Side; the Dreamscape is Darkrai's and
// Cresselia's; the Ancient Wilds hang below Area Zero's Edge; the Celestial Expanse is Rayquaza's and Deoxys's sky. Each door is a
// pseudo-stage door (`pseudo: true`: 1 per region, 2 per run). Also The Rift Whisper (Giratina's Primordial bargain, offered mid-run)
// and the Rival Ambush in its Pseudo Stage form (a chain in src/data/catalogOverhaul/pseudo/legends.json). Same-run memory only.
import { $, br, ch, ev, flagIs, fr, inRegion, leave, out, rp, room, trainer, better, type Json } from '../dsl.ts';
import { sign, telling } from './_legendsKit.ts';

export const CATEGORY = 'legends';

const G = 'Pseudo Stages';
const door = (e: Json): Json => ({ ...e, pseudo: true });
const moment = (text: string, importance = 70): Json => ({ kind: 'moment', text, importance });
const GUIDANCE = flagIs('wre-giratina');
const RENEGADE = flagIs('blessing-giratina');

const doors: Json[] = [
  door(ev('co-ps-wrong-sky', 'A Wrong Sky', G, {
    rarity: 'rare', minStage: 3, tint: '#2b1a3d', effect: 'flicker',
    remembers: [
      { id: 'guidance', when: [GUIDANCE], notice: 'There is an ash handprint on the nearest stone. You have seen that print before, on a door in town. The Division opened this one.' },
      { id: 'renegade', when: [RENEGADE], notice: 'The cracked mirror in your bag goes warm. It shows this hillside, but upside down, and there is someone standing in it who looks like you.' },
    ],
  },
  'A wound has opened in the hillside: a tear in the air no taller than a door, and behind it the wrong sky. Grass leans toward it. A Pidgey flies past, slows, and is pulled a little sideways before it gets free.\n\nUp close you can hear it. Not wind. Something on the far side, breathing very slowly.',
  [
    ch('Step through the tear.', out('Down moves. For a moment you are standing on the side of the hill, and the hill does not mind.', room('ps-distortion-incident-gate'), sign('giratina'))),
    ch('Throw a stone in first.', out('The stone goes in, stops in mid-air, and comes back out of the ground behind you. Warm. You keep it.', rp(10), room('ps-distortion-incident-gate'))),
    ch('Back away.', leave('You walk away without turning your back on it. When you look again, the hillside is only a hillside.')),
  ])),
  door(ev('co-ps-two-places', 'Where Two Places Touch', G, {
    rarity: 'rare', minStage: 5, tint: '#1a1a26', effect: 'flicker',
    remembers: [
      { id: 'guidance', when: [GUIDANCE], notice: 'Grey robes are folded neatly at the edge, the way someone folds clothes before a swim. Nobody comes back for them.' },
      { id: 'renegade', when: [RENEGADE], notice: 'You know this place. You have been here, on the other side of a fight you walked out of.' },
    ],
  },
  'The road ahead folds like paper. On one side of the fold it is noon; on the other, a cave ceiling hangs where the sky should be, and a waterfall runs upward into it.\n\nTwo places that should never touch are touching. Something unquiet is leaning through from the side with no sky.',
  [
    ch('Walk into the fold.', out('Floors become walls. The way back is somewhere else now.', room('ps-distortion-world-gate'), sign('giratina'))),
    ch('Wait and watch it.', out('A shadow with six wings crosses the upside-down waterfall and looks at you, once, before the fold closes a little. Only a little.', rp(12), room('ps-distortion-world-gate'))),
    ch('Take the long way round.', leave('It costs you the afternoon. Behind you the fold closes with a sound like a page turning.')),
  ])),
  door(ev('co-ps-new-moon', 'A Dream That Is Not Yours', G, {
    rarity: 'rare', minStage: 2, tint: '#3a2a4a', effect: 'fog',
    remembers: [{ id: 'darkrai', when: [flagIs('telling-darkrai')], notice: 'You know the stories now. Bad dreams come on new-moon nights, and a lunar feather is the only cure anyone has found.' }],
  },
  'You stop for the night. Your Pokémon fall asleep first, all of them at once, which they never do.\n\nThen you are standing in a field you have never seen, under a sky that is too close. Your party is here too, sleepy and surprised. Far off, a crescent of pale light hangs low over the clouds. Further off, there is no light at all.',
  [
    ch('Walk toward the crescent.', out('The clouds give a little underfoot, like moss. The dream opens out ahead of you.', room('ps-dreamscape-gate'), sign('cresselia'))),
    ch('Walk toward the dark.', out('It is cold, and quiet, and the quiet listens. You are not afraid. You are fairly sure you are not afraid.', room('ps-dreamscape-gate'), telling('darkrai'))),
    ch('Wake yourself up.', out('You pinch your arm until the field goes. Morning. Everyone is rested, and nobody wants to talk about it.', fr(2))),
  ])),
  door(ev('co-ps-area-zero', "Area Zero's Edge", G, {
    rarity: 'rare', minStage: 3, tint: '#2f3a1a', effect: 'glint',
    remembers: [{ id: 'paldea', when: [inRegion('paldea')], notice: 'This is the real one: the Great Crater of Paldea. The research station far below has its lights on, and no one has answered its radio for years.' }],
  },
  "The path ends at a rim. Below it the ground falls away into a crater so deep that clouds sit inside it. Crystals grow out of the cliffs, and the air coming up is warm and wet and smells of ferns.\n\nA signpost at the edge, very old: AREA ZERO. Under it someone has scratched: THE PAST IS NOT OVER DOWN THERE.",
  [
    ch('Climb down.', out('Ferns taller than houses. Tracks in the mud bigger than your feet. Something very old is watching you come.', room('ps-ancient-wilds-gate'), sign('koraidon'))),
    ch('Follow the old research rope.', out('Somebody fixed this rope years ago and never came back up it. It holds. You find their notebook halfway down.', rp(15), room('ps-ancient-wilds-gate'))),
    ch('Stay on the rim.', leave('You sit on the edge a while. Down in the green, something roars, and it is not any Pokémon in your Pokédex.')),
  ])),
  door(ev('co-ps-star-stair', 'A Stair of Light', G, {
    rarity: 'rare', minStage: 4, tint: '#101a3a', effect: 'glint',
    remembers: [{ id: 'faller', when: [flagIs('faller-rank', 3)], notice: 'You have been through Ultra Wormholes before. At the very top of the stair, the light has the same colour.' }],
  },
  'A meteor shower, so thick that the sky looks like it is snowing upward. One falling star does not fall. It stops above the hill, and from it a stair of light comes down to your feet, one step at a time.\n\nHigh above, something long and green coils between the clouds. Something else, orange and blue, is coming down the stair to meet it.',
  [
    ch('Climb the stair.', out('There is no ground under the steps, and your feet find them anyway. The sky opens around you.', room('ps-celestial-expanse-gate'), sign('rayquaza'))),
    ch('Call to the thing coming down.', out('It stops on the step above you and changes shape, twice, as if trying to find one you will understand. Then it turns and leads the way.', rp(15), room('ps-celestial-expanse-gate'))),
    ch('Watch from the hill.', leave('The stair fades at dawn. You will remember the colour of it for the rest of the run.')),
  ])),
];

// ---------------------------------------------------------------- The Rift Whisper (Giratina's Primordial bargain, mid-run)
const RENEGADE_TEXT = 'The voice takes something from you: the blessing you carried goes quiet, like a candle in a closed room. In its place you hold a cracked mirror that shows a different room.\n\nThe Renegade has noticed you. Once in every stage, you can step out of a fight that is not a boss\'s, and come back to that place from the other side. Ghost-type Pokémon will notice you too.';
const whisper: Json[] = [
  ev('mr-rift-whisper', 'The Rift Whisper', 'Mysteries & Ruins', {
    stop: 'special', rarity: 'rare', minStage: 3, tint: '#201028', effect: 'spin',
    remembers: [{ id: 'guidance', when: [GUIDANCE], notice: 'The voice says your name. The old man at the crossroads said it the same way.' }],
  },
  'A crack in the air speaks in a voice bigger than the sky.\n\n"They put me out of the world for being honest. I have had a long time to think, behind the door they built on top of me. I know what you carry, little traveller. I can offer you something better: the other side of every door."\n\nThe crack widens a little. On the far side, water falls upward.',
  [
    ch('Accept the bargain.', out('Power comes, and a price with it.', { kind: 'relic', id: 'rift-bargain', name: 'Rift Bargain', effects: [{ kind: 'statMultiplier', stat: 'atk', value: 1.08 }, { kind: 'statMultiplier', stat: 'def', value: 0.95 }] }, moment('Struck a bargain with a legendary voice in a rift.', 60)), {
      branches: [br([flagIs('blessed')], RENEGADE_TEXT, { kind: 'takeBlessing', id: 'giratina' }, moment('Took The Renegade\'s bargain: the Reverse Side.', 80))],
    }),
    ch('Ask for knowledge instead.', out('The voice sighs. "Then listen." It tells you what is under the road, and how long it has been listening to you walk on its ceiling.', rp(60), { kind: 'attribute', key: 'intelligence', amount: 1 })),
    ch('Refuse.', out('"Honest," the voice says. "I liked that once." The rift closes with a small sigh. Your Pokémon crowd close to you for a while after.', fr(1))),
  ]),
];

// ---------------------------------------------------------------- Rival Ambush (Rival spec, Pseudo Stage form)
const rivalFight = (win: Json[]): Json => ({ ...trainer('Rival', { rival: true, friendly: true, size: 3, lv: 1, win: [...win, room('dz-rival-ambush-trail')], lose: [room('dz-rival-ambush-trail')] }) });
const ambush: Json[] = [
  ev('dz-rival-ambush', 'Rival Ambush', 'Dungeon Puzzles', { stop: 'event', rarity: 'uncommon', minStage: 2, requires: [{ kind: 'rivalMet', atLeast: 1 }], tint: '#2a4a1a' },
    'Your rival jumps out of the tall grass, grinning. They have been waiting for you.\n\nRival: "Took you long enough! I\'ve been through this whole meadow. I know every path. Fight me here, or try and outrun me to the far side. Your choice."',
    [
      ch('Fight here.', out('You square up in the grass.', room('dz-rival-ambush-duel')), { requires: [{ kind: 'rivalMet', atLeast: 1 }] }),
      ch('Race them to the far side.', out('You both break into a run.', room('dz-rival-ambush-chase')), { requires: [{ kind: 'rivalMet', atLeast: 1 }] }),
      ch('Wave them off.', leave('"Seriously?" They look disappointed, then grin again. "Next time, then." They walk on.')),
    ]),
  ev('dz-rival-ambush-duel', 'Rival Ambush: the duel', 'Dungeon Puzzles', { room: true, rarity: 'uncommon', tint: '#2a4a1a' },
    'Rival: "No running. No excuses. Just us."\n\nThe grass flattens in a circle around you both.',
    [ch('Battle!', { text: '"Here we go!"', effects: [], battle: rivalFight([better(1)]) })]),
  ev('dz-rival-ambush-chase', 'Rival Ambush: the chase', 'Dungeon Puzzles', { room: true, rarity: 'uncommon', tint: '#2a4a1a' },
    'The meadow is a maze of tall grass and hidden paths. Your rival is fast, and knows the way. You can hear them laughing somewhere to your left.',
    [
      ch('Cut through the grass (Speed).', out('You burst out on the far side first. When your rival arrives, out of breath, you are already sitting on the fence.', $(150), room('dz-rival-ambush-trail')), {
        check: 'speed',
        fail: { text: 'They cut you off at the stream. "Gotcha! Now you have to fight me."', effects: [], battle: rivalFight([]) },
      }),
      ch('Follow their laughing.', { text: 'You follow the sound straight into them. "Ha! Fine, fight me then."', effects: [], battle: rivalFight([]) }),
    ]),
  ev('dz-rival-ambush-trail', 'Rival Ambush: the far side', 'Dungeon Puzzles', { room: true, rarity: 'uncommon', tint: '#2a4a1a' },
    'The far side of the meadow. Your rival flops down in the grass beside you, breathing hard, and for once does not say anything for a while.\n\nRival: "...You\'re getting good. Don\'t let it go to your head."',
    [
      ch('"You too."', out('They pretend not to hear, and slip you something for the road.', rp(8), { kind: 'rivalChange', feelings: { respect: 1 } })),
      ch('"Again sometime?"', out('"Obviously." They are already walking. "Next time I win."', rp(8))),
    ]),
];

export const EVENTS: Json[] = [...doors, ...whisper, ...ambush];
export const REMOVE: string[] = [];
