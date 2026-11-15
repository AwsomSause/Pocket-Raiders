// Catalog Overhaul Pack, category "places": STORY_FAMILIES_17.md SF117 The S.S. Anne, SF118 The Haunted Mansion, SF119 The Slowpoke
// Detective Agency, SF120 Ferries and Passes, SF121 The Day-Care Village, SF122 The Egg That Listened.
// Each merged catalog event is a beat inside its new home: the place's first beat stays on the map, the rest are rooms it opens
// (on the same node), or a later stop (`laterEvent`) where the pack says the beats are separate stops.
import { BERRIES, RARE_HELD, $, any, ch, egg, ev, express, ferry, flag, flagIs, fr, has, heal, hurt, item, join, lose, money, out, ptype, rp, scout, stopHere, type Json } from '../dsl.ts';
import { kind, moment, no, rep, variant } from './_delve.ts';

export const CATEGORY = 'places';

const go = (id: string, text: string, ...fx: Json[]): Json => out(text, ...fx, { kind: 'addEvent', eventId: id });
const later = (id: string, nodes = 1): Json => ({ kind: 'laterEvent', eventId: id, nodes });
const bond = (n: number, who: Json | string = 'party'): Json => ({ kind: 'friendship', bond: n, who });
const room = <T extends Json>(e: T): T => ({ ...e, room: true });
const fightW = (text: string, species: string[], lv: number, win: Json[], ...fx: Json[]): Json => ({ text, effects: fx, battle: { kind: 'wild', species, types: [], levelBonus: lv, shinyMultiplier: 1, win } });
const fightT = (text: string, name: string, cls: string, size: number, lv: number, win: Json[], ...fx: Json[]): Json => ({ text, effects: fx, battle: { kind: 'trainer', name, classId: cls, size, types: [], levelBonus: lv, win } });

// ---------- SF117 The S.S. Anne (one voyage: the cabins open one after another on the same stop) ----------
const ANNE: Json[] = [
  {
    id: 'ss-ticket-ferry',
    intro: 'The S.S. Anne sounds its horn, a sound so deep you feel it in your ribs. Streamers, a band on the quay, a hundred people waving at nobody in particular. At the gangplank a purser in a white cap checks tickets. Mr. Ashworth, the purser: "All aboard for the Gym city! Ticket, please."',
    choices: [
      ch('Board.', go('rm-1-key-cabin', 'He punches your ticket and hands you four little brass keys on a ring. "Cabins one, two, four and six, and the suite at the end of the voyage. Enjoy the crossing." The ship pulls away from the quay as you find the first door.', ferry())),
      ch('Ask about the cabins.', go('ss-ticket-ferry', '"Four keys," says Mr. Ashworth, "each a room, and one voyage to see them all. Cabin one\'s got a trunk nobody\'s claimed. Cabin two\'s got a sailor who\'ll fight anyone. Cabin four\'s cold, I couldn\'t tell you why. Cabin six, there\'s a collector. And then the suite. Best beds on the sea."')),
    ],
  },
  room({
    id: 'rm-1-key-cabin',
    intro: 'Cabin 1. A dusty trunk under the porthole, and a note pinned to it in shaky capitals: "FOR WHOEVER\'S NEXT. — A SAILOR WHO RETIRED."',
    choices: [
      ch('Open it.', go('rm-2-key-cabin', 'Inside, folded in an old oilskin, something good. And a postcard: a little house on a hill, a garden, and on the back, "I grow tomatoes now. They\'re terrible. I\'ve never been happier." You keep the postcard too.', any(...RARE_HELD), flag('anne-postcard'))),
      ch('Leave it.', go('rm-2-key-cabin', 'You leave the trunk for whoever\'s after you. That is what the note asked, after all.')),
    ],
  }),
  room({
    id: 'rm-2-key-cabin',
    intro: 'Cabin 2. A sailor jumps up off his bunk the moment the door opens, fists already up, grinning. "A battle! Winner takes double! I\'ve been at sea six weeks, I\'m going spare!"',
    choices: [
      ch('Battle (double prize).', fightT('"YES." He kicks the bunk out of the way to make room.', 'Sailor', 'black-belt', 3, 2, [$(500), { kind: 'addEvent', eventId: 'rm-4-key-cabin' }])),
      ch('No.', go('rm-4-key-cabin', 'His face falls, then recovers. "Fair. Fair. Ask me tomorrow." He is already doing press-ups as you close the door.')),
    ],
  }),
  room({
    id: 'rm-4-key-cabin',
    intro: 'Cabin 4. Cold, colder than the sea outside. A shadow slides across the wall where there is nothing to cast it: a Haunter that stowed away, grinning at you from the ceiling.',
    choices: [
      ch('Battle.', fightW('It laughs, and the light bulb flickers.', ['haunter'], 2, [{ kind: 'addEvent', eventId: 'rm-6-key-cabin' }])),
      ch('Ask why it\'s here.', go('rm-6-key-cabin', 'It drops down, upside down, nose to nose with you. It wants to see the Gym city, it says, as well as a Haunter says anything: it has heard there are lights there all night. You talk until the porthole goes dark. When you open a Ball, it climbs in on its own.', join({ species: ['haunter'] }))),
      ch('Leave.', go('rm-6-key-cabin', 'You leave it to its cold cabin. It waves at you through the door as it shuts.')),
    ],
  }),
  room({
    id: 'rm-6-key-cabin',
    intro: 'Cabin 6. On the desk, a strange device with a screen and an aerial: a Scanner, the kind that finds things hidden in walls. A collector in a velvet jacket is already in the doorway. "That Scanner. I\'ll trade you for it. Name your price."',
    choices: [
      ch('Trade it.', go('suite-key-rest', 'He opens a case lined with little velvet nests and lets you choose. You choose well. He walks off cradling the Scanner like a baby.', any(...RARE_HELD))),
      ch('Keep it.', go('suite-key-rest', 'You keep it. On deck, it beeps at a loose plank, and under the plank there is a little tin of things somebody hid years ago.', item('scanner'), any('nugget', 'pearl', 'star-piece'))),
    ],
  }),
  room({
    id: 'suite-key-rest',
    intro: 'The Suite. Soft beds, a view of the whole sea going gold, a bowl of fruit nobody has touched. Your team takes one look and flops down on every surface at once.',
    choices: [
      ch('Rest.', out('You sleep in a real bed while the sea rocks you. When the horn sounds for the Gym city, everyone wakes up whole.', heal(1), moment('You crossed on the S.S. Anne and slept in the suite.', 45))),
      ch('Let the team play.', out('You let them have the run of the suite: pillows everywhere, fruit everywhere, someone in the bath. It is the best hour any of you have had in a long time.', bond(1))),
    ],
  }),
];

// ---------- SF118 The Haunted Mansion (three lamps in three rooms; light all three and the vault opens) ----------
const LAMPS = ['mansion-lamp-kitchen', 'mansion-lamp-library', 'mansion-lamp-cellar'];
const DOOR = (id: string): Json => ({
  id,
  intro: 'An old manor at the end of an overgrown drive. As you reach the steps, the door swings open by itself. Lights flicker on inside, one room at a time, and then off again. Somewhere upstairs, something giggles.',
  choices: [
    ch('Go in.', go('w4-haunted-hall', 'You step over the threshold. The door does not slam behind you. It closes, very gently, as if someone is trying not to wake the house.')),
    ch('Call out.', go(id, '"Hello?" The giggling stops. The whole house holds its breath. Then the giggling starts again, closer, just on the other side of the door.')),
  ],
});
const HALL_CHOICES = (): Json[] => [
  ch('Scream back.', go('dz-mansion-kitchen', 'You scream right back at it. The portrait\'s mouth snaps shut. Then a Gastly falls out of the frame, laughing so hard it cannot float, and rolls around on the floor. It follows you after that, still giggling.', fr(2))),
  ch('Look closer.', go('dz-mansion-kitchen', 'It is a family: a mother, a father, a little girl, and around them their Pokémon, a Gastly, a Shuppet, a Litwick, a Mimikyu in the girl\'s arms. Under the frame, a date, a long time ago. The portrait stops screaming, as if it is glad to be looked at properly.', flag('mansion-family'), rp(1))),
];
const MANSION: Json[] = [
  DOOR('w4-haunted-manor'),
  DOOR('haunted-house'),
  {
    id: 'dz-mansion',
    intro: 'Through the broken window of an old manor you can see its hall: three cold lamps on three tables, and portraits whose eyes follow you along the glass. One of the portraits opens its mouth and screams. The door, beside you, is already open.',
    choices: HALL_CHOICES(),
  },
  room({ id: 'w4-haunted-hall', intro: 'The Hall. Three cold lamps on three tables, wicks black. Portraits up the stairs, whose eyes follow you. One of them opens its mouth and screams.', choices: HALL_CHOICES() }),
  room({
    id: 'dz-mansion-kitchen',
    intro: 'The Kitchen. A cold stove with the first lamp sitting on top of it. Pots clatter by themselves on their hooks, and a ladle taps the empty bowls. Something wants feeding.',
    choices: [
      ch('Cook something.', go('dz-mansion-library', 'You light the stove and make soup from what is in your bag. A Shuppet drifts down from the rafters and eats the whole pot, purring. When it is done, the lamp on the stove lights itself.', flag(LAMPS[0]!))),
      ch('Leave a Berry.', go('dz-mansion-library', 'You set a Berry on the cold stove. A Shuppet sweeps down and swallows it whole, and does a happy loop of the ceiling. The lamp lights.', lose('oran-berry'), flag(LAMPS[0]!)), { requires: [has('oran-berry')] }),
      ch('Battle the pots.', fightW('The pots fly off their hooks at you, and behind them, a Shuppet, furious.', ['shuppet'], 1, [{ kind: 'addEvent', eventId: 'dz-mansion-library' }])),
    ],
  }),
  room({
    id: 'dz-mansion-library',
    intro: 'The Library. Books float in the air, turning their own pages. The second lamp is on a high shelf, and under it, a riddle carved into the wood: "Which number comes after all the others?"',
    choices: [
      ch('"Infinity."', go('dz-mansion-cellar', 'The books all snap shut at once. Wrong. The lamp stays dark, and a heavy dictionary bonks your lead on the head on the way out.', hurt(0.03))),
      ch('"Zero."', go('dz-mansion-cellar', 'A little sigh goes round the room. Wrong. The lamp stays dark.')),
      ch('"The last page."', go('dz-mansion-cellar', 'Every floating book turns to its last page at once. The last book on the shelf is a diary: the family\'s. Its last page is a drawing of all of them. The lamp lights.', flag(LAMPS[1]!), rp(2))),
    ],
  }),
  room({
    id: 'dz-mansion-cellar',
    intro: 'The Cellar. Damp stone, and the third lamp glinting under a floor of loose boards, half of them rotten.',
    choices: [
      ch('Test the boards.', go('w4-haunted-attic', 'You test each board before you trust it. One gives under your foot and you go through to the knee. You reach the lamp anyway, scraped and filthy, and light it.', hurt(0.05), flag(LAMPS[2]!))),
      ch('Send a Ghost-type.', go('w4-haunted-attic', 'Your Ghost-type drifts over the rotten boards without touching them, as if it was born to it, and breathes on the wick. The lamp lights.', flag(LAMPS[2]!), fr(3, { types: ['ghost'] })), { requires: [ptype('ghost')] }),
    ],
  }),
  room({
    id: 'w4-haunted-attic',
    intro: 'The Attic. Dust, a round window, a big old chest. And sitting on the chest, very still, waiting: a Banette, stitched and patched, that was once a doll.',
    choices: [
      ch('Talk to it.', go('cursed-doll', 'You sit down on the floor in front of it, so you are the same height. Its zipper mouth begins to move.')),
      ch('Battle.', fightW('Its zipper mouth opens wide.', ['banette'], 2, [{ kind: 'addEvent', eventId: 'r151-mimikyu-ruined-stage' }])),
    ],
  }),
  room({
    id: 'cursed-doll',
    intro: 'The doll\'s zipper mouth moves, and its voice is very small. "She threw me away. She grew up, and she threw me away."',
    choices: [
      ch('"I\'m sorry."', go('r151-mimikyu-ruined-stage', 'It looks at you for a long time. "Nobody ever said that," it says. It climbs down off the chest and follows you, a little way behind.', ...kind())),
      ch('"Who?"', go('r151-mimikyu-ruined-stage', '"The girl in the picture." The family\'s daughter, all grown up now, somewhere far away. "She had a Mimikyu after me. It\'s still here. It\'s still waiting too."', flag('mansion-doll-girl'))),
      ch('"Come with me."', go('r151-mimikyu-ruined-stage', 'It is in your arms before you finish the sentence, light as cloth. It does not say anything else. It does not have to.', join({ species: ['banette'] }), flag('doll-thrown-away'), moment('You took the doll that was thrown away with you.', 65))),
    ],
  }),
  room({
    id: 'r151-mimikyu-ruined-stage',
    intro: 'The Ballroom. At the far end, a little stage in rags, its curtains torn. A Mimikyu in a patched costume steps out into a spotlight that is not there, and takes a deep bow to an empty house.',
    choices: [
      ch('Applaud.', go('dz-mansion-vault', 'You clap. Your team claps, or stamps, or howls. The Mimikyu freezes, and then it bows again, lower, happier. When you go on, it follows you to the vault, skipping.', flag('mansion-mimikyu'), fr(2))),
      ch('Join the act.', go('dz-mansion-vault', 'You climb up on the stage and bow beside it. It looks at you, delighted, and you do the whole show together, to nobody, and it is wonderful.', flag('mansion-mimikyu'), bond(1, 'lead'))),
      ch('Leave.', go('dz-mansion-vault', 'You leave it bowing to the dark. It does not notice. It is used to an empty house.')),
    ],
  }),
  room({
    id: 'dz-mansion-vault',
    intro: 'The Vault. A heavy iron door at the end of the hall, three keyholes shaped like flames, all cold.',
    choices: [
      ch('Try the door.', go('sock-puppet-salesman', 'It does not move. Three cold flames. Somewhere in the house, a lamp is still dark.')),
    ],
    remembers: [variant('lit', LAMPS.map((k) => flagIs(k)), {
      intro: 'The Vault. Three lamps lit, and the iron door swings open by itself. Inside, on a little table, the family\'s photo album. And all around you, every Pokémon in the album is here in the house tonight, in the doorway, on the stairs, waiting.',
      hide: [0],
      add: [
        ch('Read the album.', go('sock-puppet-salesman', 'You turn the pages slowly, out loud. Every ghost in the mansion goes quiet to listen. When you close it, they cheer, all of them at once, so loud the windows rattle. On the last page someone has left you a Reaper Cloth.', item('reaper-cloth'), ...LAMPS.map((k) => flag(k, -99)), moment('You read the haunted family\'s album to their ghosts, and they cheered.', 70))),
        ch('Take the treasure.', go('sock-puppet-salesman', 'Under the album, a strongbox. You take what is in it. Behind you, the ghosts watch you go without a word.', any(...RARE_HELD), ...LAMPS.map((k) => flag(k, -99)))),
      ],
    })],
  }),
  room({
    id: 'sock-puppet-salesman',
    intro: 'On your way out, by the front door, a salesman in a floppy hat with a tray of odds and ends. "Souvenir? Everything\'s a bargain." His shadow on the wall behind him has big pointed ears, and a little crooked smile.',
    choices: [
      ch('Buy.', out('You buy a charm from his tray. He is very pleased, and bows exactly the way the Mimikyu in the ballroom bowed.', $(-200), any('cleanse-tag', 'spell-tag')), { requires: [money(200)] }),
      ch('Point out the shadow.', out('"Oh," he says, in a much smaller voice, and the hat slips, and it is the Mimikyu, practising being a person. It gives you the charm for free, and makes you promise not to tell.', any('cleanse-tag', 'spell-tag'), ...kind())),
    ],
  }),
];

// ---------- SF119 The Slowpoke Detective Agency ----------
const CASE1: Json[] = [
  {
    id: 'detective-case',
    intro: 'A very slow man in a long coat is crouched in the middle of the square, looking at the cobbles through a magnifying glass, and beside him a Slowpoke is doing exactly the same thing with no glass at all. Inspector Quennell: "A lantern\'s missing from the square. Three clues, three stops. Help?"',
    choices: [
      ch('Help.', out('"Good." He stands up, slowly. "First clue\'s at the well. Dawdle will meet you there. Dawdle\'s always there first." The Slowpoke is already gone, somehow.', flag('detective-case-1'), later('detective-clue-2', 1))),
      ch('"Why me?"', go('detective-case', '"Dawdle likes you," he says. The Slowpoke is leaning against your leg. "Dawdle\'s never wrong. I\'ve been wrong four times. Dawdle, never."')),
    ],
  },
  room({
    id: 'detective-clue-2',
    intro: 'The Well. On the stone rim, a wet paw print, small, and a scrap of red ribbon caught on a nail. Quennell holds it up to the light. "What does it tell you?"',
    choices: [
      ch('"A Water-type."', out('"Hm. Wet, yes. But everything\'s wet at a well." He writes it down anyway, kindly.', later('r171-slowpoke-wellside', 1))),
      ch('"A small Pokémon."', out('"True. But small isn\'t a who." He writes it down.', later('r171-slowpoke-wellside', 1))),
      ch('"A child\'s pet."', out('"Yes." He looks at you properly for the first time. "The ribbon\'s a collar. Somebody loves this one." He writes it down and underlines it twice.', flag('detective-right'), rp(2), later('r171-slowpoke-wellside', 1))),
    ],
  }),
  room({
    id: 'r171-slowpoke-wellside',
    intro: 'Dawdle sits by the well with its tail down in the water, perfectly still. It has been there a long time. Quennell is nowhere to be seen.',
    choices: [
      ch('Wait with it.', out('You sit down beside it. You wait a long time. Then its tail comes up out of the water, and on the end of it, snagged, is the other half of the red ribbon, and a name stitched on it: WICK.', flag('detective-ribbon'), fr(3), later('detective-clue-3', 1))),
      ch('Ask Quennell.', out('He arrives, eventually. "Dawdle\'s fishing," he says. "Dawdle\'s always fishing. Never catches fish." He sits down too. "Next stop, the rooftops."', later('detective-clue-3', 1))),
    ],
  }),
  room({
    id: 'detective-clue-3',
    intro: 'The Rooftop. Up the fire stairs, and there it is: the lantern, and curled round it, fast asleep, a little Litwick with a red collar. It was cold. It found the warmest thing in the square.',
    choices: [
      ch('Return the lantern.', out('You lift the lantern out of its arms as gently as you can. It wakes, and shivers. Quennell takes the lantern back to the square, and says nothing about it, and you can tell he wishes you had chosen differently.', $(200), flag('detective-case-1-done'))),
      ch('Let it keep it.', out('You leave it sleeping. The square will have one less light. Quennell nods slowly. "There are worse places for a lantern to be."', flag('detective-case-1-done'), ...kind())),
      ch('Find it a lantern of its own.', out('You go down to the church and ask, and they have an old lantern in the vestry, dented and perfect. The town puts it up on the roof for the Litwick. It moves in that night. Everyone is happy, Dawdle most of all, though you couldn\'t say how you can tell.', flag('detective-case-1-done'), ...kind(2), moment('You solved the case of the missing lantern, and a cold Litwick got a lantern of its own.', 60))),
    ],
  }),
];
const CASE2: Json[] = [
  {
    id: 'mystery-clue-1',
    intro: 'The lamp at the crossroads is dark. It is never dark. The keeper\'s chair is empty, his tea cold, and a torn page from his ledger flutters on the step. Somewhere behind you, slowly, a Slowpoke arrives.',
    choices: [
      ch('Read the page.', out('"...checked the cellar, door stuck, will try the..." and then the tear. Quennell, at your elbow: "Case two. The Lantern-Keeper."', flag('mystery-clue'))),
      ch('Light the lamp first.', out('You find the matches and light it. All along the dark road, travellers look up and see it and are glad. Then you read the page: "...door stuck, will try the..." Quennell nods. "Lamp first. Good instinct."', flag('mystery-clue'), ...kind())),
    ],
  },
  {
    id: 'mystery-clue-2',
    intro: 'Footprints in the mud by the crossroads, a man\'s boots, leading to a cracked cellar door half hidden in brambles.',
    choices: [
      ch('Follow.', out('You follow them to the cellar step. Under the step, wrapped in a cloth: a key. The keeper\'s. He must have dropped it going in.', flag('mystery-clue'), rp(1))),
      ch('Call the police.', out('Officer Jenny comes, and looks at the footprints, and looks at you, and says, "Quennell\'s case? Then it\'s Quennell\'s." She leaves. You find the key under the step yourself.', flag('mystery-clue'))),
    ],
  },
  {
    id: 'mystery-solved',
    intro: 'A garden shed. You turn the key, and inside, wrapped in a horse blanket and very embarrassed, is the lantern-keeper. "Door stuck," he says. "I locked myself in. Three days. I had biscuits."',
    choices: [
      ch('Laugh with him.', out('You laugh, and he laughs, and Dawdle sits down in the doorway, which is a Slowpoke laughing. Quennell takes off his own hat and puts it on your head. "Honorary detective. Don\'t let it go to your head. It\'s a very big hat."', flag('mystery-solved'), flag('honorary-detective'), moment('Inspector Quennell made you an honorary detective.', 60))),
      ch('Walk him home.', out('You walk him home, slowly, and he tells you about every lamp he has ever lit. At his door Quennell catches up, and puts his own hat on your head. "Honorary detective. It suits you. It doesn\'t suit anyone."', flag('mystery-solved'), flag('honorary-detective'), ...kind(), moment('Inspector Quennell made you an honorary detective.', 60))),
    ],
  },
];

// ---------- SF120 Ferries and passes ----------
const ISLAND: Record<string, { label: string; text: string; fx: Json[] }> = {
  one: { label: 'Island One.', text: 'Island One: a fishing town with a market on the harbour and a hot spring up the hill. You shop, and soak, and come back salt-sweet and rested.', fx: [stopHere('shop'), heal(0.5)] },
  two: { label: 'Island Two.', text: 'Island Two: a quiet place with an old woman who keeps a rest house for travellers. She feeds you, and puts you all to bed, and nobody asks you for anything.', fx: [heal(1)] },
  three: { label: 'Island Three.', text: 'Island Three: wild and green, with ruins on the cliffs and something rare in the bracken. You explore until the ferry horn calls you back.', fx: [any(...RARE_HELD), rp(2)] },
};
const FERRIES: Json[] = [
  {
    id: 'tri-pass-ferry',
    intro: 'A fast little boat at the quay, painted blue and white. Its captain is chewing a pipe she never lights. Mo, the ferry captain: "Seagallop to one of three islands. Pick."',
    choices: Object.values(ISLAND).map((i) => ch(i.label, out(`${i.text} Mo is waiting at the quay when you are done. "Back on the mainland by tea."`, ferry(), ...i.fx))),
  },
  {
    id: 'rainbow-pass-ferry',
    intro: 'Mo\'s boat again, flying a flag with every colour on it. "Rainbow Pass," she says. "Every island. Shop, rest, explore. Your pick, or all of them."',
    choices: [
      ch('All of them.', out(`Mo takes you round them all. ${ISLAND.one!.text} ${ISLAND.two!.text} ${ISLAND.three!.text} You come home with sunburn and stories.`, ferry(), ...ISLAND.one!.fx, ...ISLAND.two!.fx, ...ISLAND.three!.fx, moment('You sailed the Rainbow Pass to every island.', 55))),
      ch('Just one.', out(`${ISLAND.two!.text} Sometimes one is enough.`, ferry(), ...ISLAND.two!.fx)),
    ],
  },
  {
    id: 'ticket-booth',
    intro: 'A ticket booth at the harbour with a clerk behind the glass, stamping things. Clerk: "Express ferry to the Gym town! Fifteen hundred!"',
    choices: [
      ch('Buy. (1,500)', out('The express ferry cuts through the waves like a knife. You are at the Gym town before you have finished your sandwich.', $(-1500), express()), { requires: [money(1500)] }),
      ch('"Is there a slow one?"', out('"There\'s the slow one," says the clerk, and points at a little tub of a boat with a dog asleep on the deck. "Three hundred. Two extra stops at sea." It is slow. It is lovely.', $(-300), ferry(), scout(2)), { requires: [money(300)] }),
    ],
  },
];

// ---------- SF121 The Day-Care Village ----------
const DAYCARE: Json[] = [
  {
    id: 'pokemon-daycare-visit',
    intro: 'A neat fenced yard full of Pokémon, playing, napping, arguing over a ball. A cheerful man in overalls leans on the gate. Mr. Holloway: "Leave one with us a while? It\'ll grow. They always grow here."',
    choices: [
      ch('Leave one.', out('You choose. It looks back once, then sees the ball, and is gone. Mr. Holloway writes its name on a little chalkboard. "Collect it on your next visit. It\'ll have grown, I promise."', { kind: 'sendAway', key: 'daycare-holloway', who: 'picked' }, flag('daycare-left')), { requires: [{ kind: 'partySize', atLeast: 2 }], pick: {} }),
      ch('Visit the others.', out('You spend an hour in the yard. A Pokémon you have never seen before falls asleep in your lap. Mr. Holloway brings you lemonade.', fr(3), heal(0.2))),
    ],
  },
  ev('daycare-holloway-collect', 'Collecting from the Day-Care', 'Helpers, gifts and kindness', { stop: 'event', rarity: 'common', types: [], minStage: 1, callback: true, requires: [{ kind: 'flag', key: 'daycare-holloway', atLeast: 1, atMost: 99, regionsAgo: 1 }, no('daycare-collected')], tint: '#4a6a3a' },
    'The Day-Care yard again. Mr. Holloway sees you coming and rings the bell, and the one you left comes running across the grass, bigger than you remember.',
    [ch('Welcome it back.', out('It nearly knocks you over. Mr. Holloway wipes his eyes on his sleeve. "They always know," he says. "They always know when it\'s you."', { kind: 'bringBack', key: 'daycare-holloway', levels: 4, friendship: 10 }, flag('daycare-collected')))]),
  {
    id: 'daycare-couple',
    intro: 'An old couple at a garden fence, the house behind them quiet. Mrs. Holloway: "We\'ll raise one for you. Two, if you like. We miss the noise."',
    choices: [
      ch('Leave two (eggs may come).', out('You leave two with them for the evening. They spoil them rotten. When you come back, Mrs. Holloway is holding something warm in a tea towel. "Well. We didn\'t plan this. It\'ll hatch in two stages, dear."', egg({ left: 2, unit: 'stage' }), moment('The Holloways gave you an egg.', 50)), { requires: [{ kind: 'partySize', atLeast: 2 }] }),
      ch('Just visit.', out('You stay for tea. They show you photos of every Pokémon they have ever raised: hundreds. They remember every name.', fr(3))),
    ],
  },
  {
    id: 'breeders-visit',
    intro: 'A breeder on the road with a basket on each arm and a Chansey trundling behind her. Nan Okafor: "I can look after one for a bit, on the road. I\'ll teach it something its parents knew."',
    choices: [
      ch('Leave one with her.', out('She takes it as if it were already hers to love. "A region," she says. "Then I\'ll find you. I always find people."', { kind: 'sendAway', key: 'breeder-okafor', who: 'picked' }), { requires: [{ kind: 'partySize', atLeast: 2 }], pick: {} }),
      ch('No.', out('"Fair enough," she says, and gives your lead a biscuit anyway.', fr(2, 'lead'))),
    ],
  },
  {
    id: 'wandering-breeder',
    intro: 'Nan Okafor again, sitting on a milestone with her baskets and a flask. "You again! Want me to take one for a bit? I\'ll teach it an old move."',
    choices: [
      ch('Leave one with her.', out('"Lovely," she says, and tucks it in beside the eggs. "A region. I\'ll find you."', { kind: 'sendAway', key: 'breeder-okafor', who: 'picked' }), { requires: [{ kind: 'partySize', atLeast: 2 }, no('breeder-okafor')], pick: {} }),
      ch('No.', out('She pours you a cup from her flask anyway. It is very strong tea.', heal(0.1))),
    ],
  },
  ev('breeder-okafor-return', 'Nan Okafor Returns', 'Helpers, gifts and kindness', { stop: 'event', rarity: 'common', types: [], minStage: 1, callback: true, requires: [{ kind: 'flag', key: 'breeder-okafor', atLeast: 1, atMost: 99, regionsAgo: 1 }, no('breeder-okafor-back')], tint: '#4a6a3a' },
    'A whistle on the road, and there is Nan Okafor, waving both arms. Beside her, trotting, the one you left, looking very pleased with itself.',
    [ch('Welcome it back.', out('"It learned it in a week," says Nan. "Clever thing. Show them!" It shows you: an egg move, an old one, its parents\' move.', { kind: 'bringBack', key: 'breeder-okafor', levels: 2, friendship: 10 }, { kind: 'eggMove' }, flag('breeder-okafor-back')))]),
];

// ---------- SF122 The Egg That Listened ----------
// The warmed egg goes in the egg bag and hatches two stages on, the stage its hatch scene is due; the scene gives the newborn its +2 Bond.
const FIND = (id: string): Json => ({
  id,
  intro: 'An egg in a hollow of moss under a tree. No nest, no parent, no tracks in the soft earth around it. You touch it. It is cold.',
  choices: [
    ch('Warm it.', out('You pick it up and tuck it inside your coat. It is so cold it hurts, and then, slowly, it is not. Against your side, very faintly, it ticks.', egg({ species: ['togepi', 'pichu', 'cleffa', 'igglybuff', 'elekid', 'magby', 'smoochum', 'azurill'], left: 2, unit: 'stage' }), flag('cradle'), moment('You found a cold egg and warmed it.', 55)), { requires: [no('cradle')] }),
    ch('Wait for a parent.', go(id, 'You sit back out of sight and wait. The light changes. Nobody comes. Nobody is going to come.')),
    ch('Leave it.', out('You leave it in its moss. You think about it for a long time after.')),
  ],
});
const EGG: Json[] = [
  FIND('egg-cradle-find'),
  FIND('egg-nest'),
  {
    id: 'egg-cradle-night',
    intro: 'Night, and colder than you planned for. The egg ticks against your side, slow and steady, like it is listening to your heart.',
    choices: [
      ch('Hold it close.', out('You hold it with both arms all night. By morning it is ticking faster, as if it has decided something.', flag('cradle'))),
      ch('Let a Fire-type sleep next to it.', out('Your Fire-type curls round the egg like a cat round a hot water bottle, and the egg ticks faster, warm right through. In the morning the two of them are still curled up together.', flag('cradle'), fr(3, { types: ['fire'] })), { requires: [ptype('fire')] }),
      ch('Wrap it in my coat.', out('You wrap it in your coat and shiver all night. It ticks faster. It is listening, you are sure of it now.', flag('cradle'), hurt(0.03))),
    ],
  },
  {
    id: 'name-the-egg',
    requires: [flagIs('cradle', 1, 2), no('egg-named')],
    intro: 'A caretaker at a little hut by the road, with a pen behind her ear and a shelf of eggs, each one labelled. She sees the egg under your coat. "It hears its name before it hatches, you know. Give it one."',
    choices: [
      ch('Name it.', out('You say a name, out loud, to the egg. It ticks twice, very quickly. The caretaker writes it on a little label and ties it on with string.', flag('egg-named'))),
      ch('Let it choose.', out('You hold the egg and say names until one makes it tick. It picks a strange one. It is perfect.', flag('egg-named'), fr(2))),
    ],
  },
  {
    id: 'egg-cradle-hatch',
    intro: 'A crack. Then another. It has decided it is time.',
    choices: [
      ch('Talk to it.', out('You talk to it the whole time, about nothing, about everything. It comes out into the world already knowing your voice, and turns straight toward it.', bond(2, 'newest'), flag('cradle', -99), moment('The egg that listened hatched, and knew your voice.', 70))),
      ch('Stay quiet.', out('You hold your breath and let it do it alone. It does. Then it looks up, and finds you, as if it knew you were there all along.', bond(2, 'newest'), flag('cradle', -99), moment('The egg that listened hatched, and knew your voice.', 70))),
    ],
  },
];

export const EVENTS: Json[] = [...ANNE, ...MANSION, ...CASE1, ...CASE2, ...FERRIES, ...DAYCARE, ...EGG];
export const REMOVE: string[] = [];
