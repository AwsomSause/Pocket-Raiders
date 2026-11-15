// Catalog Overhaul, families-b (STORY_FAMILIES_6.md): the six Doors.
// SF31 The Lost Expedition, SF34 The Sunken Lighthouse, SF36 The Old Quarry, SF37 The Captain's Chest,
// SF39 The Whispering Grove, SF40 The Windswept Spire. Each is a chain pseudo-stage (catalogOverhaul/pseudo/families-b.json).
import { FOSSILS, RARE_HELD, any, anyType, br, ch, egg, fight, flag, flagIs, fr, heal, hurtLead, item, join, leave, moveFlag, out, rest, room, leadIs, stopHere, takeNode, type Json } from '../dsl.ts';
import { GEMS, ROOM, VALLEY, exit, mentorIs, moment, no, pw, rem, seen, temp, withBr } from './_fb.ts';

export const CATEGORY = 'families-b';

const inRegion = (ids: string[]): Json => ({ kind: 'region', ids });
const node = takeNode();
const DOOR = (minStage: number) => ({ requires: [] as Json[], callback: false, room: false, pseudo: true, minStage });

// ---------------------------------------------------------------- SF31 The Lost Expedition
const valleyEgg = (species: string): Json => egg({ species: [species], left: 4 });
const SEALED = flagIs('expedition-respected');
const TUBE = ' Before you go she presses a sealed sample tube into your hands. "You left the crate shut. So this is yours. It is an egg. Valley-born. Name it well."';
/** A survivor choice: with the crate left sealed, Ilse adds the Valley-born egg (its species by region). */
const survivor = (label: string, text: string, key: string): Json => {
  const fx = (species?: string): Json[] => [flag(key), ...(species ? [valleyEgg(species), flag('expedition-egg')] : []), room('ovc-lost-expedition-s3')];
  return withBr(ch(label, out(text, ...fx())), ...VALLEY.map((v) => br(v.regions.length > 0 ? [SEALED, inRegion(v.regions)] : [SEALED], text + TUBE, ...fx(v.species))));
};
const SURVIVOR: Json[] = [
  survivor('Show me the valley.', 'She walks you to the edge without a word. Below, a valley nobody has drawn: green, quiet, full of shapes you have no names for. One of them climbs the path, looks at you for a long moment, and goes home.', 'expedition-saw'),
  survivor('Who wrote STILL LOOKING?', 'Ilse: "My brother Bram\'s son. Tavin. He comes every year with his chalk. He has never found the camp." She looks at her hands. "I have watched him from up here. Every year."', 'expedition-nephew'),
  survivor('Come home with me.', 'Ilse: "And leave it?" She looks at the valley, then at the cane, then at the path she has not walked in twelve years. "...Give me a minute to bank the fire."', 'expedition-home'),
];
const TAVIN_ALONE = ch('Give it to Tavin.', out('Tavin reads on the kerb until the light goes. "My dad voted to tell. He died for it." He closes the journal. "...And I think he would want me to listen to her now." He publishes the six names, and not the place. Then he gives you the last thing the expedition carried out: an egg.', flag('expedition-tavin'), room('fb-valley-egg')));
const TAVIN_WITH_ILSE = ch('Give it to Tavin.', out('Tavin reads. Then he looks up, past you, at the old woman with the cane. "...Aunt Ilse?" Nobody says anything for a while. "My dad voted to tell. He died for it. And I think he would want me to listen to her now." They decide together: the names, and not the place. They walk into town side by side. That is the ending.', flag('expedition-tavin'), flag('expedition-reunion'), moment('Ilse Halverson came down the ridge after twelve years, and her nephew was waiting.', 80), room('fb-valley-egg')));
const VALE = ch('Give the notes to Dr. Vale.', out('Dr. Vale takes them with both hands. His paper names all six, in full, in the first line. Where the map should be, the page is left blank. "Some findings," he writes, "are better kept than shared."', any(...RARE_HELD), flag('rep', 2), flag('expedition-published'), flag('expedition-vale'), { kind: 'mentor', trust: 5 }, exit));

const EGG_TEXT = 'It is warm through the glass. Valley-born: part leaf, part stone, and nobody has ever given one a name.';
const SF31: Json[] = [
  {
    id: 'ev-abandoned-expedition', name: 'The Lost Expedition', ...DOOR(6), rarity: 'rare', tags: ['Dungeon', 'Exploration', 'Story'], scene: { cast: [], tint: '#2a2a24', effect: 'fog' },
    intro: 'A collapsed signpost marks an old trail into the hills. Boot prints go in. None come out. A faded poster is nailed to a tree: THE HALVERSON EXPEDITION. SIX MEMBERS. FIND THE LOST VALLEY. It is dated twelve years ago. Under it, in fresh chalk, somebody has written: STILL LOOKING.',
    choices: [
      ch('Follow the prints.', out('The prints are old, but the trail remembers them. You follow six people into the hills.', flag('expedition-on'), room('lost-expedition-camp'))),
      ch('Read the poster closely.', out('Six names. One is circled: Ilse Halverson, the leader. The chalk handwriting matches none of the six. Whoever is still looking was never on the list. You follow the prints in.', flag('expedition-on'), flag('expedition-names'), room('lost-expedition-camp'))),
      ch('Not my business.', leave('You leave the poster to the wind. The chalk will be rained off by morning, and somebody will write it again.')),
    ],
  },
  {
    id: 'lost-expedition-camp', name: 'The Lost Expedition: The Camp', ...ROOM, minStage: 1,
    intro: 'Torn tents, a cold fire, a leather journal weighed down with a stone. The explorers who made this camp did not pack up. The last entry reads: "Day 41. Found it. The valley is real. Pokémon there we have no names for. Ilse says we can\'t tell anyone. Bram says we must. We\'ll vote in the morning." There is no Day 42.',
    choices: [
      ch('Read the earlier entries.', out('Forty days of blisters and bad jokes. Three things stand out: a cache "behind the split boulder", a drawing of a Pokémon nobody has named, and one line underlined twice: "the ridge path, only at dawn".', flag('expedition-clues'), room('lost-expedition-cache'))),
      ch('Search the tents.', out('Six tents. Five sleeping bags, still rolled out as if their owners stepped away for a moment. The sixth is missing. Somebody walked out of this camp carrying their bed.', flag('expedition-five'), room('lost-expedition-cache'))),
      ch('Take the journal.', out('You lift the stone and take the journal. It is heavier than paper should be. Forty-one days of six people\'s lives go into your bag.', flag('expedition-journal'), room('lost-expedition-cache'))),
    ],
    remembers: [rem('names', [flagIs('expedition-names')], { notice: 'You read the six names on the poster. In the journal, Ilse Halverson\'s handwriting is the careful one.' })],
  },
  {
    id: 'lost-expedition-cache', name: 'The Lost Expedition: The Cache', ...ROOM, minStage: 1,
    intro: 'Behind the split boulder: a sealed crate, and a drawing pinned under a stone. Inside the crate are field notes, photographs and a sealed sample tube. A letter lies on top: "If you find this, we didn\'t make it home. The valley is at the end of the ridge path. Please decide better than we did." The drawing shows a small Pokémon, part leaf, part stone. It is labelled "Valley-born."',
    choices: [
      ch('Take the notes.', out('The notes join your bag: a year of work by people who never got to finish the sentence. You take the ridge path at dawn.', flag('expedition-notes'), room('ovc-lost-expedition-s2'))),
      ch('Leave the crate sealed.', out('You put the lid back and set the stone on it. You walk on with only the letter, and the feeling of having been trusted by strangers.', flag('expedition-respected'), room('ovc-lost-expedition-s2'))),
      ch('Look at the photos.', out('Six people laughing at a campfire. You count again. Five faces, and across the grass, the long shadow of the one holding the camera. You take the ridge path at dawn.', flag('expedition-photos'), room('ovc-lost-expedition-s2'))),
    ],
    remembers: [rem('five', [flagIs('expedition-five')], { notice: 'Five sleeping bags in the camp. Whoever took the sixth would have passed this boulder.' })],
  },
  {
    id: 'ovc-lost-expedition-s2', name: 'The Lost Expedition: The Survivor', ...ROOM, minStage: 1, scene: { cast: [], tint: '#3a342a', effect: 'none' },
    intro: 'The ridge path at dawn. A hut at the end, smoke from the chimney. An old woman with a cane comes out: Ilse Halverson. "You found the camp. Nobody has found the camp in twelve years. The others went down to tell the world. A rockslide took the path. I stayed. Someone had to keep the valley\'s secret." She points down. "Pokémon no one has named. If the world finds out, it ends. If it doesn\'t, the five of them died for nothing."',
    choices: SURVIVOR,
    remembers: [rem('sealed', [SEALED], { notice: 'You left the crate sealed. Ilse knows: she checks it every spring.' })],
  },
  {
    id: 'ovc-lost-expedition-s3', name: 'The Lost Expedition: Publish or Bury', ...ROOM, minStage: 1, scene: { cast: [], tint: '#3a342a', effect: 'none' },
    intro: 'Back down the ridge. A town at the bottom, and a young man on the kerb with chalk dust on his sleeve. Tavin. "You came from up there. Did you find them?" You have what you carried out, and what you saw. He is waiting for an answer he has waited twelve years for.',
    choices: [
      ch('Publish everything.', out('You tell it all. The six names are printed, and the five are honoured in every town on the road. The valley becomes a reserve. There is already talk of a viewing platform.', any(...RARE_HELD), flag('rep', 2), flag('expedition-published'), exit)),
      ch('Bury it.', out('That night the journal goes into a fire, a page at a time. The valley stays what it was. Tavin never knows, and will write on the poster again next year. Somewhere above, small shapes sleep unafraid.', flag('expedition-buried'), temp('The valley trusts you', [{ kind: 'captureMultiplier', value: 1.5 }], 3, 'wild'), exit)),
      TAVIN_ALONE,
    ],
    remembers: [
      rem('home-vale', [flagIs('expedition-home'), mentorIs('linden-vale')], { notice: 'Ilse came down the ridge with you. She is standing a few steps behind, both hands on her cane. And Dr. Vale has already written to ask for the notes.', hide: [2], add: [TAVIN_WITH_ILSE, VALE] }),
      rem('home', [flagIs('expedition-home')], { notice: 'Ilse came down the ridge with you. She is standing a few steps behind, both hands on her cane.', hide: [2], add: [TAVIN_WITH_ILSE] }),
      rem('vale', [mentorIs('linden-vale')], { notice: 'Dr. Vale has already written to ask for the notes. He wants them badly.', add: [VALE] }),
    ],
  },
  {
    id: 'fb-valley-egg', name: 'The Lost Expedition: The Sample Tube', group: 'Landmarks', rarity: 'rare', ...ROOM, scene: { cast: [], tint: '#3a342a', effect: 'glint' },
    intro: 'Tavin holds out a sealed sample tube, padded in a wool sock. "They carried this out before the slide. It has been warm the whole time. I think it has been waiting for somebody who went and looked."',
    choices: [withBr(ch('Take the egg.', out(EGG_TEXT, valleyEgg('nacli'), flag('expedition-egg'), exit)), ...VALLEY.filter((v) => v.regions.length > 0).map((v) => br([inRegion(v.regions)], EGG_TEXT, valleyEgg(v.species), flag('expedition-egg'), exit)))],
  },
];

// ---------------------------------------------------------------- SF34 The Sunken Lighthouse
const NAMED = flagIs('sunk-name');
const farewell = (label: string, text: (name: string) => string, ...fx: Json[]): Json => withBr(ch(label, out(text('The keeper'), ...fx)), br([NAMED], text('Corvin Ashby'), ...fx));
const FAREWELL: Json[] = [
  farewell('I\'ll take it with me.', (n) => `The old Lanturn leaves the chair it has circled for forty years. ${n} watches it go and smiles. Behind you, the great lamp gutters and goes dark. The harbour will have to build its own light now.`, { ...join({ species: ['lanturn'], lv: 2 }), moves: ['light-screen', 'heal-bell'], friendship: 100 }, flag('sunk-took'), flag('sunk-done'), exit),
  farewell('It can stay as the light.', (n) => `${n} fades like breath off glass. The Lanturn settles under the lens, and the lamp turns, and will turn. Weary travellers will rest here now, under a light that knows it is loved.`, stopHere('heal'), flag('sunk-stay'), flag('sunk-done'), exit),
  farewell('Ask it.', () => 'You kneel and ask. The Lanturn thinks about it, in its slow blind way. It chooses the lamp. But it noses something out from under the keeper\'s chair and pushes it to your feet: an egg, faintly glowing.', egg({ species: ['chinchou'], left: 3 }), flag('sunk-asked'), flag('sunk-done'), exit),
];
const SF34: Json[] = [
  {
    id: 'lighthouse-entrance', name: 'The Sunken Lighthouse', ...DOOR(5), types: ['water', 'ghost'],
    intro: 'A lighthouse stands knee-deep in the sea, its lamp still turning. No keeper. Its door is open to the tide. A fisher on the shore does not look up from her nets: "Keeper drowned forty years back. The lamp has never stopped. Nobody has ever been up."',
    choices: [
      ch('Wade in.', out('The water is colder than it looks, and it pulls. You get through the door soaked to the waist.', hurtLead(0.1, ['water']), flag('sunk-in'), room('lighthouse-1'))),
      ch('Wait for low tide (a node).', out('You sit with the fisher while the sea goes out. She shares her tea and says nothing. When the sand shows, you walk in dry.', node, flag('sunk-in'), room('lighthouse-1'))),
      ch('Ask about the keeper.', out('Fisher: "Old Corvin Ashby. Lived alone with a Chinchou. Never said a word to anyone but it." She nods at a line of dry rocks. "Go in that way, if you must."', flag('sunk-in'), flag('sunk-name'), room('lighthouse-1'))),
    ],
  },
  {
    id: 'lighthouse-1', name: 'The Sunken Lighthouse: The Pool', ...ROOM, minStage: 1,
    intro: 'The ground floor is a pool. The stairs are above the water, if you can reach them. Wild Tentacool drift in the dark. Something blue glows at the bottom.',
    choices: [
      ch('Swim for the stairs.', fight('Halfway across, the water under you rises. A Tentacruel has been watching the door for a long time.', pw({ species: ['tentacruel'], lv: 1, win: [room('lighthouse-2')] }))),
      ch('Dive for the glow.', out('You come up with a Poké Ball, old and furred with weed. It is empty. Somebody opened it once and never needed it again. You climb out onto the stairs.', flag('sunk-ball'), room('lighthouse-2'))),
      ch('Use a Pokémon to bridge.', out('Vines catch the stair rail and pull tight, or one cold breath lays a path of ice across the pool. Either way you cross above the Tentacool without wetting a boot, and they bump against your bridge from below, puzzled.', room('lighthouse-2')), { requires: [anyType('grass', 'ice')] }),
    ],
  },
  {
    id: 'lighthouse-2', name: 'The Sunken Lighthouse: The Keeper\'s Room', ...ROOM, minStage: 1,
    intro: 'A bed, a table, a keeper\'s lantern. Something moves in the corner. A ghostly keeper in an oilskin sits reading a letter he cannot hold. "You\'ll be wanting the lamp. Mind the stairs. I never did." The thing moving in the corner is a Lanturn, old and blind, curled around the keeper\'s chair.',
    choices: [
      ch('Who is the Lanturn?', out('Keeper: "My Chinchou. Grew up. Still here. Won\'t leave me." The Lanturn turns toward his voice. Its light is very faint, as if most of it were somewhere else.', flag('sunk-lanturn'), room('lighthouse-final'))),
      ch('Why did you drown?', out('Keeper: "Storm took the lamp out. I went out on the rocks to fix the lens. Got it lit. Didn\'t get back." He says it the way a man mentions a missed train.', flag('sunk-story'), room('lighthouse-final'))),
      ch('Go up.', out('You nod to him and take the stairs. He goes back to his letter. The Lanturn listens to your footsteps all the way up.', room('lighthouse-final'))),
    ],
    remembers: [
      rem('name', [flagIs('sunk-name')], { notice: '"Mr. Ashby?" The ghost looks up, startled. Nobody has said his name in forty years.' }),
      rem('ball', [flagIs('sunk-ball')], { notice: 'The empty Ball from the pool is still in your hand. The Lanturn turns its blind face toward it.' }),
    ],
  },
  {
    id: 'lighthouse-final', name: 'The Sunken Lighthouse: The Lamp and the Chest', ...ROOM, minStage: 1,
    intro: 'The lamp at the top is a ball of living light. It is the Lanturn\'s light, sent up the stairs every night for forty years. Beside it stands a chest the keeper never opened. Inside: letters. Hundreds. All to "Little Light." All from the keeper. He wrote one every night and never sent them, because who sends letters to someone in the same room?',
    choices: [
      ch('Read them to the Lanturn.', out('You carry the chest down and read aloud until your voice cracks. The Lanturn listens to every one. On the last letter, its light goes out upstairs and comes on in the room. The keeper reaches out, and for the first time, he can touch it.', flag('sunk-read'), room('fb-lighthouse-farewell'))),
      ch('Give them to the keeper.', out('You set the chest in front of him. He holds them. All of them. "I never sent one." He takes the top letter and, hands shaking, gives it to the Lanturn.', flag('sunk-sent'), room('fb-lighthouse-farewell'))),
      ch('Close the chest.', out('Some things are not yours to open. You close the lid. The lamp keeps turning, as it has, as it will.', flag('sunk-done'), exit)),
    ],
    remembers: [rem('lanturn', [flagIs('sunk-lanturn')], { notice: '"My Chinchou. Still here." Now you understand where its light has been going.' })],
  },
  {
    id: 'fb-lighthouse-farewell', name: 'The Sunken Lighthouse: Little Light', group: 'Landmarks', rarity: 'uncommon', types: ['water', 'ghost'], ...ROOM, scene: { cast: [], pokemon: 'lanturn', tint: '#14242c', effect: 'glint' },
    intro: 'The keeper stands. He is lighter than he was. "I can go now, I think. Will you see to it?" The Lanturn presses against his boots.',
    choices: FAREWELL,
    remembers: [rem('name', [NAMED], { intro: 'Corvin Ashby stands. He is lighter than he was. "I can go now, I think. Will you see to it?" The Lanturn presses against his boots.' })],
  },
  {
    // SF34.5: a later visit. The pack says "any run after"; with same-run memory only, it comes back later in this run.
    id: 'ovc-the-lighthouse-that-remembers-s1', name: 'The Lighthouse That Remembers', requires: [flagIs('sunk-done')], callback: true, room: false, minStage: 5, scene: { cast: [], tint: '#0c1a2c', effect: 'fog' },
    intro: 'The lighthouse at night. A voice from the lamp recites every ship that has ever passed, by name: "The Margery. The Swift. The Old Corvin..." Out on the water a ghost ship appears: a fishing boat with no one aboard, and its lamp lit.',
    choices: [
      ch('Signal the ghost ship.', out('You flash the lamp. The ghost ship flashes back, once, and sinks without a ripple, like something finally allowed to. The light dims, content. In the morning a pearl has washed up on the step.', item('pearl'), flag('sunk-remembered'))),
      ch('Let it pass.', out('It passes. The light dims as it goes by, the way you lower your voice in a quiet room, then brightens again.', flag('sunk-remembered'))),
      ch('Ask the light its name.', out('The voice stops. Then it recites one more, shyly: "Little Light." After that it is quiet, and the lamp turns.', flag('sunk-remembered'))),
    ],
    remembers: [
      rem('read', [flagIs('sunk-read')], { notice: 'You read it every letter. Tonight the voice recites the keeper\'s name last, and warmly: "Corvin Ashby."' }),
      rem('sailed', [flagIs('harbour-sailed')], { notice: 'You crossed this bay for the medicine. Near the end of the list, the voice says your name.' }),
    ],
  },
];

// ---------------------------------------------------------------- SF36 The Old Quarry
const KING = seen('story-alpha-quarry-king');
const DIANCIE = flagIs('promise-diancie');
const GEM_TAIL = ' A Carbink drifts out of the stone and sets a gem in your palm, unasked.';
const MINE_WIN: Json[] = [any(...FOSSILS), any('plume-fossil', 'root-fossil', 'claw-fossil', 'hisui-spark-fossil'), { kind: 'itemFrom', ids: GEMS, count: 2 }, flag('quarry-mined'), room('fb-quarry-after')];
const mine = (foe: 'gigalith' | 'rhyperior'): Json => {
  const text = `You lift the pick. The ${foe === 'gigalith' ? 'Gigalith' : 'Rhyperior'} does not roar. It just steps in front of the nursery, and stays there.`;
  return withBr(ch('Mine the seam.', fight(text, pw({ species: [foe], lv: 2, win: MINE_WIN }))), br([DIANCIE], text + GEM_TAIL, any(...GEMS)));
};
const SEALED_G = 'You set the pick down. The Gigalith bows, slow as a hill. When you climb out, it climbs out behind you, and does not go back.';
const SEALED_R = 'You set the pick down. The Rhyperior lowers its horn until it touches the floor. It will remember who came to the seam and took nothing.';
const around = (foe: string) => `It takes most of a day, on your knees, a chisel-width at a time. One fossil. One gem. Not a crack in the stone where the Carbink sleep. The ${foe} watches every stroke, and lets you go.`;
const SEALED_FX_G: Json[] = [join({ species: ['gigalith'], lv: 1 }), flag('quarry-sealed'), room('fb-quarry-after')];
const SEALED_FX_R: Json[] = [fr(3, 'party'), flag('quarry-sealed'), room('fb-quarry-after')];
const AROUND_FX: Json[] = [node, any(...FOSSILS), any(...GEMS), flag('quarry-careful'), room('fb-quarry-after')];
const SEAM: Json[] = [
  mine('gigalith'),
  withBr(ch('Leave it sealed.', out(SEALED_G, ...SEALED_FX_G)),
    br([KING, DIANCIE], SEALED_R + GEM_TAIL, any(...GEMS), ...SEALED_FX_R), br([KING], SEALED_R, ...SEALED_FX_R), br([DIANCIE], SEALED_G + GEM_TAIL, any(...GEMS), ...SEALED_FX_G)),
  withBr(ch('Mine around the nursery (a node).', out(around('Gigalith'), ...AROUND_FX)),
    br([KING, DIANCIE], around('Rhyperior') + GEM_TAIL, any(...GEMS), ...AROUND_FX), br([KING], around('Rhyperior'), ...AROUND_FX), br([DIANCIE], around('Gigalith') + GEM_TAIL, any(...GEMS), ...AROUND_FX)),
];
const SEAM_INTRO = (foe: string) => `A seam of coloured stone runs back into the mountain. Fossils, ore and gems, all laid open. A ${foe} stands in front of it. It is not angry. It is guarding something: in the stone, a cluster of Carbink, newly formed, still soft at the edges.`;
const SF36: Json[] = [
  {
    id: 'quarry-entrance', name: 'The Old Quarry', ...DOOR(4), types: ['rock', 'ground'],
    intro: 'A quarry cut into a hillside. Cranes frozen halfway through a lift. A dozen shafts going down. An ex-foreman on the road out catches your sleeve: "Don\'t. Something came up the deep shaft. We ran. Left everything. It didn\'t hurt anyone. It just stood in the way. Roared. We weren\'t paid enough."',
    choices: [
      ch('Go in.', out('He lets go of your sleeve and shakes his head. The gate hangs open. Twelve dark doors, and a load of stone still swinging gently on its chain.', flag('quarry-in'), room('quarry-1'))),
      ch('What did it look like?', out('Ex-foreman: "Stone. Big. Gems on its back." He rubs his arm. "It looked at us like we were the ones trespassing." You go in.', flag('quarry-in'), flag('quarry-hint'), room('quarry-1'))),
      ch('Leave it.', leave('You leave the quarry to whatever came up the deep shaft. The foreman looks relieved.')),
    ],
    remembers: [rem('king', [seen('story-alpha-quarry-king')], { notice: 'This is the quarry road the Gym Leader roped off. Whatever came up the shaft, you have met it: the Quarry King.' })],
  },
  {
    id: 'quarry-1', name: 'The Old Quarry: Among the Gear', ...ROOM, minStage: 1,
    intro: 'The crane operators left in a hurry. A Pokémon has made itself at home among their gear: a family of Roggenrola in a lunchbox. The smallest one is wearing a hard hat.',
    choices: [
      ch('Leave them.', out('You step around the lunchbox. Four round bodies turn to watch you go. The hard hat tips, slowly, like a salute.', room('quarry-2'))),
      ch('Take the hard hat back.', fight('You lift the hat. The small one cries, a thin grinding sound, and the whole family comes out of the lunchbox at once.', pw({ species: ['roggenrola', 'boldore'], format: 'doubles', lv: 0, win: [flag('quarry-hat'), room('quarry-2')] }))),
      ch('Feed them.', out('You crumble a ration bar into the lunchbox. They hum. The biggest rolls a Hard Stone to your boot, and the one in the hard hat follows you down the shaft, keeping three careful paces behind.', item('hard-stone'), flag('quarry-fed'), room('quarry-2'))),
    ],
  },
  {
    id: 'quarry-2', name: 'The Old Quarry: The Deep Shaft', ...ROOM, minStage: 1,
    intro: 'One shaft goes much deeper than the rest. Rubble blocks the bottom. Behind the rubble: breathing. Big.',
    choices: [
      ch('Clear the rubble.', out('Your Pokémon sets itself against the pile and the rubble gives, block by block. The breathing on the other side does not change.', room('quarry-final')), { requires: [anyType('fighting', 'ground')] }),
      ch('Call to it.', out('"Hello?" Silence. Then stone shifts, from the other side, one careful block at a time. It is opening the door for you.', flag('quarry-called'), room('quarry-final'))),
      ch('Climb back up.', out('Some doors are shut for a reason. You climb back to daylight.', exit)),
    ],
    remembers: [rem('fed', [flagIs('quarry-fed')], { notice: 'The little Roggenrola in the hard hat has followed you down. It is not afraid of the breathing.' })],
  },
  {
    id: 'quarry-final', name: 'The Old Quarry: The Seam', ...ROOM, minStage: 1,
    intro: SEAM_INTRO('Gigalith'),
    choices: SEAM,
    remembers: [
      rem('king', [KING], { intro: SEAM_INTRO('Rhyperior'), notice: 'The Quarry King. It knows you. It does not move from the nursery.', hide: [0], add: [mine('rhyperior')] }),
      rem('diancie', [DIANCIE], { notice: 'You promised Diancie to sell nothing. The Carbink can tell: they crowd to the edge of the stone to look at you.' }),
      rem('called', [flagIs('quarry-called')], { notice: 'It opened the way for you itself. It is calm. It is waiting to see what kind of visitor you are.' }),
    ],
  },
  {
    id: 'fb-quarry-after', name: 'The Old Quarry: The Road Out', group: 'Landmarks', rarity: 'uncommon', types: ['rock', 'ground'], ...ROOM, scene: { cast: [], tint: '#3a3226', effect: 'none' },
    intro: 'Daylight. The cranes have not moved. The quarry is as quiet as you found it, and you know now what the quiet is for.',
    choices: [withBr(ch('Walk on.', out('You leave the quarry behind you.', exit)),
      br([flagIs('quarry-hint'), flagIs('quarry-careful')], 'He is quiet for a while. A week later the quarry reopens, with a new sign painted by hand: KEEP OUT OF SHAFT 12. He hammers it in himself.', flag('quarry-reopened'), moment('The Old Quarry reopened, with a sign: KEEP OUT OF SHAFT 12.'), exit),
      br([flagIs('quarry-hint')], '"Stone. Big. Gems on its back," you tell him. He nods. "Told you." He looks down the shaft for a long time before he goes.', exit))],
    remembers: [
      rem('sign', [flagIs('quarry-hint'), flagIs('quarry-careful')], { intro: 'Daylight. The ex-foreman is at the gate. He came back to see. You show him the fossil, and tell him about the nursery.' }),
      rem('hint', [flagIs('quarry-hint')], { intro: 'Daylight. The ex-foreman is at the gate. He came back to see for himself what you would bring out.' }),
    ],
  },
];

// ---------------------------------------------------------------- SF37 The Captain's Chest
const BREATH = 'chest-breath';
const WATER_LEAD = leadIs('water');
const shaft = (label: string, breath: number, text: (b: number) => string, ...extra: Json[]): Json => {
  const fx = (b: number): Json[] => [flag(BREATH, -99), flag(BREATH, b - 1), ...extra, room('w4-dive-1')];
  return withBr(ch(label, out(text(breath), ...fx(breath))), br([WATER_LEAD], text(breath + 2), ...fx(breath + 2)));
};
const SHAFT: Json[] = [
  shaft('Dive.', 4, (b) => `You fill your lungs and go down the shaft of blue light. Breath: ${b}. The reef takes the first.`),
  shaft('Who\'s tried?', 4, (b) => `Odo: "Me. Three times. Something wouldn't let me take it." He turns his empty hands over. "Maybe it's waiting for someone else." You dive. Breath: ${b}. The reef takes the first.`, flag('chest-odo')),
  shaft('Lend me the gear.', 5, (b) => `Odo buckles his old tank onto you himself, checking every strap twice. "Bring it back. Bring yourself back." Breath: ${b}. The reef takes the first.`, flag('chest-gear')),
];
const RAVI = mentorIs('ravi-ironhand');
const CHEST = 'The captain\'s log. A compass, still true. And a letter to his crew: "If the anchor holds, we\'re home. If it doesn\'t, we\'re the sea\'s."';
const RAVI_TAIL = ' Captain Ravi takes the compass from you. He reads the letter. He says nothing for a long time. Then he closes your fingers around the compass. "He would want it at sea."';
// The compass is a key item for the run: sea stops show what they hold (core/co/compass.ts reads the flag).
const CHEST_FX: Json[] = [flag('chest-compass'), item('gold-bottle-cap'), flag('chest-opened'), moment('You brought up the captain\'s compass from the Silver Morrow. Sea stops show their hazards now.', 70)];
const TRUST = { kind: 'mentor', trust: 8 };
const SINKS = ' You read it aloud, for the anchor. It listens, then sinks away to wait for a keel that needs it.';
const ABOARD = ' The Dhelmise hooks itself gently over your arm. It held one ship to the end. It wants another.';
const CARRIED = flagIs('chest-carried');
const OPEN = withBr(ch('Open the chest.', out(CHEST, ...CHEST_FX, exit)),
  br([CARRIED, RAVI], CHEST + SINKS + RAVI_TAIL, ...CHEST_FX, TRUST, exit), br([CARRIED], CHEST + SINKS, ...CHEST_FX, exit), br([RAVI], CHEST + RAVI_TAIL, ...CHEST_FX, TRUST, exit));
const OPEN_ABOARD = withBr(ch('Open the chest. Take the anchor aboard.', out(CHEST + ABOARD, ...CHEST_FX, join({ species: ['dhelmise'], lv: 2 }), flag('chest-dhelmise'), exit)),
  br([RAVI], CHEST + ABOARD + RAVI_TAIL, ...CHEST_FX, TRUST, join({ species: ['dhelmise'], lv: 2 }), flag('chest-dhelmise'), exit));
const SF37: Json[] = [
  {
    id: 'w4-dive', name: 'The Captain\'s Chest', ...DOOR(5), types: ['water'],
    intro: 'Clear deep water. A wreck far below. Diving gear on the rocks, and an old diver, Odo, mending it. "Four breaths of air, and every room below costs one. A Water-type\'ll help you. The Silver Morrow went down with her captain\'s chest. Nobody\'s brought it up. Not for want of trying."',
    choices: SHAFT,
    remembers: [rem('water', [WATER_LEAD], { notice: 'Your Water-type lead slips into the shallows and waits for you. With it beside you, you have two more breaths.' })],
  },
  {
    id: 'w4-dive-1', name: 'The Captain\'s Chest: The Reef', ...ROOM, minStage: 1,
    intro: 'A coral garden. Strange fish drift past, unbothered. Shells and pearls lie on the sand. Your breath ticks down.',
    choices: [
      ch('Gather pearls (costs 1 breath).', out('You spend a breath on your knees in the sand. A Pearl, and under it, a Big Pearl. Then you kick on toward the dark shape of the wreck.', flag(BREATH, -2), item('pearl'), item('big-pearl'), room('dz-dive-wreck')), { requires: [flagIs(BREATH, 2)] }),
      ch('Swim on.', out('The pearls will be here tomorrow. Your air will not. You kick on toward the dark shape of the wreck.', flag(BREATH, -1), room('dz-dive-wreck')), { requires: [flagIs(BREATH, 1)] }),
      ch('Surface.', out('Your chest is burning. You turn for the light and break the surface gasping. Odo hauls you onto the rocks.', exit), { requires: [no(BREATH)] }),
    ],
  },
  {
    id: 'dz-dive-wreck', name: 'The Captain\'s Chest: The Wreck and the Trench', group: 'World & Traversal', stop: 'event', ...ROOM, minStage: 1, types: ['water', 'ghost'], scene: { cast: [], tint: '#081428', effect: 'fog' },
    intro: 'A ship on her side, hold still shut. Beyond her the light fades, and a huge shape moves in the dark. It is a Wailord, asleep. It is not the danger.',
    choices: [
      ch('Into the hold.', out('You pull yourself through a split in the hull. The dark inside is complete, and something in it is awake.', flag(BREATH, -1), room('w4-dive-2')), { requires: [flagIs(BREATH, 1)] }),
      ch('Into the trench.', out('You swim down beside the sleeping Wailord, close enough to feel its slow heart in the water. Something glints in the silt by its side. You take it with your last breath and kick for the light.', flag(BREATH, -99), any(...RARE_HELD), exit)),
      ch('Surface.', out('Enough. You turn for the light. The Silver Morrow keeps her chest.', exit)),
    ],
  },
  {
    id: 'w4-dive-2', name: 'The Captain\'s Chest: The Guardian', ...ROOM, minStage: 1,
    intro: 'Inside the wreck, a captain\'s chest, and something guarding it in the dark: an anchor with an eye. The Dhelmise was this ship\'s anchor. It wraps its chain around the chest. It looks at your lead.',
    choices: [
      ch('Let my Water-type carry it.', out('Your lead swims forward alone. The Dhelmise studies it, a creature of the sea, the same as the ship was. Link by link, the chain lets go. The chest comes up.', flag('chest-carried'), room('fb-chest-surface')), { requires: [leadIs('water')] }),
      ch('Battle it.', fight('It will not let a stranger of the land take what the sea was given. The chain lashes out.', pw({ species: ['dhelmise'], lv: 2, win: [flag('chest-forced'), room('fb-chest-surface')] }))),
      ch('Leave it.', out('You let go of the chest. The Dhelmise nods, once, the way a sailor nods to another. You surface with empty hands and a strange light feeling.', exit)),
    ],
    remembers: [rem('odo', [flagIs('chest-odo')], { notice: '"Something wouldn\'t let me take it." Odo was right. It is looking at your lead, not at you.' })],
  },
  {
    id: 'fb-chest-surface', name: 'The Captain\'s Chest: On the Surface', group: 'World & Traversal', rarity: 'uncommon', types: ['water'], ...ROOM, scene: { cast: [], tint: '#0c1c30', effect: 'glint' },
    intro: 'The chest breaks the surface. Odo wades in to his chest to help you land it, laughing and swearing. The water behind you boils: the Dhelmise has followed you up, and it is angry. It circles once, and goes.',
    choices: [OPEN],
    remembers: [
      rem('carried-ravi', [CARRIED, RAVI], { intro: 'The chest breaks the surface. Odo wades in to his chest to help you land it, laughing and swearing. Behind you the Dhelmise surfaces too, quiet, its chain trailing. It is offering itself. Captain Ravi has gone very still: the name on the lid is his father\'s.', add: [OPEN_ABOARD] }),
      rem('carried', [CARRIED], { intro: 'The chest breaks the surface. Odo wades in to his chest to help you land it, laughing and swearing. Behind you the Dhelmise surfaces too, quiet, its chain trailing. It is offering itself.', add: [OPEN_ABOARD] }),
      rem('ravi', [RAVI], { notice: 'Captain Ravi has gone very still. The name on the lid is his father\'s.' }),
    ],
  },
];

// ---------------------------------------------------------------- SF39 The Whispering Grove
const SF39: Json[] = [
  {
    id: 'whispering-grove-entrance', name: 'The Whispering Grove', ...DOOR(6), types: ['grass', 'fairy'],
    intro: 'A grove where the wind seems to be saying your name. Every tree has a face if you look long enough. The faces are the faces of Pokémon. One looks like one you had.',
    choices: [
      ch('Go in.', out('The wind drops as you step under the branches, the way a room goes quiet when the person being talked about walks in.', flag('grove-in'), room('whispering-grove-1'))),
      ch('Listen to the names.', out('You stand still and listen. The wind says the names of your team, one by one, softly, the way you say them yourself when nobody is near. Then you go in.', flag('grove-in'), flag('grove-listened'), room('whispering-grove-1'))),
      ch('Leave.', leave('You do not want to know what else it knows. The wind says your name once more, behind you, and lets you go.')),
    ],
  },
  {
    id: 'whispering-grove-1', name: 'The Whispering Grove: The Lullaby', ...ROOM, minStage: 1,
    intro: 'A ring of mossy stones. Something is humming a lullaby. It is a Jigglypuff, old, singing to nobody. Every wild Pokémon in the ring is asleep.',
    choices: [
      ch('Sit and listen.', out('You sit on a stone. The song is gentle, and older than the singer. Your team\'s breathing slows to match it. When it ends, they are better.', heal(0.25), room('whispering-grove-2'))),
      ch('Wake them.', fight('You clap your hands. Three pairs of eyes open, grumpy, and in no mood to be reasoned with.', pw({ types: ['grass', 'fairy'], format: 'triples', lv: 0, win: [room('whispering-grove-2')] }))),
      ch('Sing back.', out('Your Pokémon answers the lullaby, note for note. The old Jigglypuff stops, astonished. Then it smiles, and bows you through the ring.', flag('grove-sang'), room('whispering-grove-2')), { requires: [moveFlag('sound')] }),
    ],
    remembers: [rem('listened', [flagIs('grove-listened')], { notice: 'The lullaby has words, if you listen the way you listened to the wind. They are names too.' })],
  },
  {
    id: 'whispering-grove-2', name: 'The Whispering Grove: The Root Guardian', ...ROOM, minStage: 1,
    intro: 'A tree older than the grove. A guardian wakes in its roots: a Trevenant. Its voice is in the leaves. "You have come for one of them. They are sleeping. They do not need you."',
    choices: [
      ch('I just want to see.', out('The Trevenant considers you with its one red eye. Then the roots draw aside. It follows you in, watching.', room('whispering-grove-final'))),
      ch('They were mine.', fight('Trevenant: "Were." The roots come up out of the ground.', pw({ species: ['trevenant'], lv: 2, win: [flag('grove-fought'), room('whispering-grove-final')] }))),
      ch('I\'m sorry.', out('Trevenant: "Tell them, not me." But the roots draw aside, gently, and it does not follow.', flag('grove-sorry'), room('whispering-grove-final'))),
    ],
  },
  {
    id: 'whispering-grove-final', name: 'The Whispering Grove: The Sleeper', ...ROOM, minStage: 1,
    intro: 'A clearing where the light falls in a perfect circle. A Pokémon sleeps at its centre. It is the same kind as your starter, a wild one, small, with a leaf caught on its ear. It opens one eye.',
    choices: [
      ch('Say its name.', out('You say the only name you have for one of its kind. It wakes fully. It is not yours, and never was. But it walks over to your starter, and they touch noses, like two letters of the same word.', fr(3, 'party'), flag('grove-named'), exit)),
      ch('Sit beside it.', out('You sit. It looks at you, decides something, and goes back to sleep against your leg. You stay until the circle of light has crossed the whole clearing. Nobody hurries you.', rest(), heal(1), flag('grove-sat'), exit)),
      ch('Leave it sleeping.', out('You back out of the light. The eye closes. Behind you, in a thousand leaves, the grove whispers: thank you. Something small and silver hangs from a low branch, where you cannot miss it.', item('soothe-bell'), flag('grove-left'), exit)),
    ],
    remembers: [rem('sorry', [flagIs('grove-sorry')], { notice: '"Tell them, not me," the Trevenant said. The sleeper is listening.' })],
  },
];

// ---------------------------------------------------------------- SF40 The Windswept Spire
const VULTURE = inRegion(['alola', 'galar', 'kalos', 'paldea']);
const nestFight = (bird: 'braviary' | 'mandibuzz'): Json => ch('Battle it.', fight(`You reach for a Ball. The ${bird === 'braviary' ? 'Braviary' : 'Mandibuzz'} does not pull up this time.`, pw({ species: [bird], lv: 2, win: [flag('spire-fought'), room('windswept-spire-final')] })));
const still = (b: string) => `You do not move. Not when it dives again, not when the wind of its wings fills your eyes. The ${b} lands. It lets you pass an arm's length from the nests, watching every step.`;
const back = (b: string) => `You edge back until your heels find the drop. The ${b} is satisfied. The way round is a ledge the width of your boot, and you take it facing the rock.`;
const NESTS: Json[] = [
  withBr(ch('Stand still.', out(still('Braviary'), flag('spire-still'), room('windswept-spire-final'))), br([VULTURE], still('Mandibuzz'), flag('spire-still'), room('windswept-spire-final'))),
  nestFight('braviary'),
  withBr(ch('Back away from the nests.', out(back('Braviary'), room('windswept-spire-final'))), br([VULTURE], back('Mandibuzz'), room('windswept-spire-final'))),
];
const SUMMIT_ASHES = ch('Scatter Ember\'s ashes.', out('You open the tin box. For a moment nothing happens. Then the wind comes back, gently, and takes her: up, and out, over the whole forest she ran in for forty years. High above, a great bird turns once in the light, and is gone.', flag('sign-bird', 1), flag('spire-ember'), moment('Ember\'s ashes were scattered from the top of the Windswept Spire.', 85), exit));
const SF40: Json[] = [
  {
    id: 'windswept-spire-entrance', name: 'The Windswept Spire', ...DOOR(5), types: ['flying', 'dragon'],
    intro: 'A spire of rock rising into the clouds, a stair carved around it. The wind is loud. Carved at the foot are the names of everyone who reached the top. The newest is forty years old.',
    choices: [
      ch('Climb.', out('You put your hand on the first step. The stone is worn into a hollow by everyone who did the same.', flag('spire-in'), room('windswept-spire-1'))),
      ch('Read the names.', out('Hundreds, in a dozen hands. Near the bottom, cut deep and careful: OSWIN & EMBER. Two names, one chisel. You start to climb.', flag('spire-in'), flag('spire-oswin'), room('windswept-spire-1'))),
      ch('Not today.', leave('The wind is too loud today. The names will wait. They have waited forty years.')),
    ],
    remembers: [rem('ashes', [flagIs('ranger-spire')], { notice: 'The tin box is in your bag. "She loved the Windswept Spire," Oswin said. "I can\'t climb it anymore."' })],
  },
  {
    id: 'windswept-spire-1', name: 'The Windswept Spire: The Sideways Wind', ...ROOM, minStage: 1,
    intro: 'A terrace where the wind comes in sideways. You can barely stand. The stair goes on at the far end, forty steps away. It might as well be forty miles.',
    choices: [
      ch('Crawl.', out('On your belly, fingers in the cracks, one arm\'s length at a time. It is slow. It is not dignified. You get there.', room('windswept-spire-2'))),
      ch('Let a Flying-type shield me.', out('Your Flying-type spreads its wings on the windward side and walks you across like a sail. It is fast. At the far end it is shaking with the effort.', { kind: 'damage', share: 0.1, who: 'picked' }, room('windswept-spire-2')), { pick: { types: ['flying'] } }),
      ch('Wait for a lull (a node).', out('You tuck into the rock and wait. An hour. Two. Then the wind drops, all at once, and a flock of wild Swablu drifts across the terrace like blown cloud. You cross behind them.', node, room('windswept-spire-2'))),
    ],
  },
  {
    id: 'windswept-spire-2', name: 'The Windswept Spire: The Nests', ...ROOM, minStage: 1,
    intro: 'A ledge crowded with nests. The guardian circles overhead: a Braviary. It dives at you, and pulls up a wing\'s width away.',
    choices: NESTS,
    remembers: [rem('mandibuzz', [VULTURE], { intro: 'A ledge crowded with nests. The guardian circles overhead: a Mandibuzz. It dives at you, and pulls up a wing\'s width away.', hide: [1], add: [nestFight('mandibuzz')] })],
  },
  {
    id: 'windswept-spire-final', name: 'The Windswept Spire: The Feather', ...ROOM, minStage: 1,
    intro: 'The top, above the cloud line. A single shrine, and a single feather turning in the wind. It is the feather of this region\'s Legendary bird. The wind stops, for the first time since the foot of the stair.',
    choices: [
      ch('Take the feather.', out('It is warm, and it weighs nothing. Somewhere far off, something that owns the sky notices that you have it.', flag('sign-bird', 1), flag('spire-feather'), moment('You carry a feather of the region\'s Legendary bird, from the shrine on the Windswept Spire.', 70), exit)),
      ch('Leave it at the shrine.', out('You set a stone on its quill so it will not blow away, and bow. On the way down a shadow crosses the stair, twice: the bird itself, circling the spire, seeing you off.', flag('sign-bird', 2), flag('spire-left'), exit)),
      ch('Carve my name.', out('At the foot of the stair you find a clean place and cut your name under forty years of silence. The newest name on the Spire is yours now.', flag('sign-bird', 1), flag('spire-carved'), exit)),
    ],
    remembers: [
      rem('ashes', [flagIs('ranger-spire')], { notice: 'The tin box is in your bag. This is where she wanted to be.', add: [SUMMIT_ASHES] }),
      rem('oswin', [flagIs('spire-oswin')], { notice: 'OSWIN & EMBER, at the foot of the stair. When you see the old ranger again, you can tell him his name is still there.' }),
    ],
  },
];

export const EVENTS: Json[] = [...SF31, ...SF34, ...SF36, ...SF37, ...SF39, ...SF40];

// Old ids these scenes absorb (ledger MERGE rows): never drawn again, still loadable by saved runs.
export const MERGED: Record<string, string> = {
  'ovc-lost-expedition-s1': 'lost-expedition-camp',
  'ovc-phantom-lighthouse-s1': 'lighthouse-entrance',
  'ovc-phantom-lighthouse-s2': 'lighthouse-2',
  'ovc-phantom-lighthouse-s3': 'lighthouse-final',
  'ovc-the-lighthouse-that-remembers-s2': 'ovc-the-lighthouse-that-remembers-s1',
  'ovc-the-lighthouse-that-remembers-s3': 'ovc-the-lighthouse-that-remembers-s1',
  'dz-dive': 'w4-dive',
  'dz-dive-reef': 'w4-dive-1',
  'dz-dive-trench': 'dz-dive-wreck',
};
export const REMOVE: string[] = Object.keys(MERGED);
