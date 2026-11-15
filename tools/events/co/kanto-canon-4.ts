// Kanto Canon Spaces, KANTO_PLACED_2.md (second half): Cinnabar Island (Stage 7), Route 23 and Victory Road (Stage 8 and the
// finale), Cerulean Cave, the roaming cast's own scene (Sabrina's lament), and the route moments. Lines kept word for word.
import type { Json } from '../dsl.ts';
import { EXTRA, SPACES, retired, followup, later, intel, kind, battle, buy, c, flag, foe, fr, has, heal, is, item, join, kc, moment, not, o, space, teach, wild } from './_kc.ts';

export const CATEGORY = 'kanto-canon';
export const EVENTS: Json[] = [];
const E = EVENTS;
const DOC = 'KANTO_PLACED_2';
const lose = (id: string, count = 1): Json => ({ kind: 'loseItem', id, count });
const party = (species: string): Json => ({ kind: 'partySpecies', species });
const move = (id: string): Json => ({ kind: 'partyMove', move: id });
const burnLead: Json = { kind: 'status', status: 'burn', who: 'lead', except: ['fire'] };
const newest = (count: number): Json => kc('bond', { who: 'newest', count });
const evolve = (from: string, to: string): Json => ({ kind: 'formChange', from, to });

// ============================================================ CINNABAR ISLAND (Stage 7)

// ---------- Cinnabar Lab
{
  const s = space(E, { id: 'cs.kanto.cinnabar.lab', town: 'cinnabar', name: 'Cinnabar Lab', kind: 'HUB', appears: 'always', flags: ['kanto.fossil.revived'], section: `${DOC}: Cinnabar Lab`,
    placed: { stage: [7], home: 10, sits: 'plus', attaches: 'plus', badge: 'A flask', level: -2, often: 'Once per run; one revival per visit' } });
  const YARROW = 'Dr. Fenwick Yarrow: "Put it on the plate. Stand back. No, further. It\'s been asleep a long time and it wakes up offended."';
  const revive = (fossil: string, mon: string, name: string) => c(name, o(`${YARROW} The plate glows. The stone cracks along a line that was always there.`, lose(fossil), join([mon], { levelBonus: -2 }), flag('kanto-fossil-revived'), s.open('wake')), { requires: [has(fossil)] });
  const rooms = [
    c('Fossil Revival.', o('The revival room is cold and very clean, with one plate in the middle of it like an altar.', s.open('revive'))),
    c('The Fusion Display.', o('Two tanks and a drawing of what would come out. An assistant: "We don\'t do it. We draw it. The drawing\'s the fun part. Nobody gets hurt by a drawing."', s.open('fusion'))),
    c('Lab Trades.', o('A scientist: "Mine\'s a Porygon. It\'s very polite. I want something that isn\'t. I\'ve had enough manners."', s.open('trade'))),
    c('Leave him asleep on his keyboard.', o('You let the door close softly. Behind it the hum goes on, and so does the snoring.')),
  ];
  s.entry('Cinnabar Lab', 'A white building on black rock. Inside, everything hums, and a man\'s asleep on a keyboard. Three rooms: Fossil Revival, the Fusion Display, and Lab Trades.', rooms,
    { remembers: [{ id: 'museum', when: [is('kanto-museum-registry')], notice: 'Dr. Yarrow has the paperwork. "Blackwood wrote. Nine pages. He wants to know everything it does."' }] });
  s.room('revive', 'Cinnabar Lab: Fossil Revival', 'One revival per visit. Helix, Omanyte; Dome, Kabuto; Old Amber, Aerodactyl; and the other regions\' fossils likewise.',
    [revive('helix-fossil', 'omanyte', 'The Helix Fossil.'), revive('dome-fossil', 'kabuto', 'The Dome Fossil.'), revive('old-amber', 'aerodactyl', 'The Old Amber.'),
      c('Other fossils, or a Fossil Fragment.', o('Dr. Yarrow pulls out a second tray.', s.open('revive2')))]);
  s.room('revive2', 'Cinnabar Lab: Other Fossils', 'The other regions\' fossils, and a drawer marked FRAGMENTS. A player holding one fragment gets the second here, for nothing.',
    [c('A fossil from another region.', o('He picks it out of your bag himself.', s.open('revive3'))),
      c('The second Fossil Fragment, for nothing.', o('Dr. Yarrow: "Half of a thing is no use to anybody. Here." The two halves fit.', kc('fossilFragment')), { requires: [is('kanto-fossil-fragment')] }),
      c('Back to the hall.', o('Back to the humming.', s.open('hall')))]);
  // Every other fossil in the game, on trays of three (the Lab revives them all; KANTO_PLACED_2: "the other regions' fossils likewise").
  const TRAYS: [string, string, [string, string, string][]][] = [
    ['hoenn', 'Hoenn, Sinnoh or Unova.', [['root-fossil', 'lileep', 'The Root Fossil.'], ['claw-fossil', 'anorith', 'The Claw Fossil.'], ['skull-fossil', 'cranidos', 'The Skull Fossil.'],
      ['armor-fossil', 'shieldon', 'The Armor Fossil.'], ['cover-fossil', 'tirtouga', 'The Cover Fossil.'], ['plume-fossil', 'archen', 'The Plume Fossil.']]],
    ['kalos', 'Kalos or Galar.', [['jaw-fossil', 'tyrunt', 'The Jaw Fossil.'], ['sail-fossil', 'amaura', 'The Sail Fossil.'], ['fossilized-bird', 'dracozolt', 'The Fossilized Bird.'],
      ['fossilized-dino', 'arctozolt', 'The Fossilized Dino.'], ['fossilized-drake', 'dracovish', 'The Fossilized Drake.'], ['fossilized-fish', 'arctovish', 'The Fossilized Fish.']]],
    ['hisui', 'Hisui.', ['ember', 'spark', 'tide', 'talon', 'veil', 'inferno', 'thunder', 'ghostfire', 'blade', 'quill', 'phantom', 'slime', 'bloom', 'crest', 'glacier'].map((k) => {
      const mon: Record<string, string> = { ember: 'growlithe', spark: 'voltorb', tide: 'qwilfish', talon: 'sneasel', veil: 'zorua', inferno: 'arcanine', thunder: 'electrode', ghostfire: 'typhlosion', blade: 'samurott', quill: 'decidueye', phantom: 'zoroark', slime: 'goodra', bloom: 'lilligant', crest: 'braviary', glacier: 'avalugg' };
      return [`hisui-${k}-fossil`, `${mon[k]}-hisui`, `The Hisuian ${k[0]!.toUpperCase()}${k.slice(1)} Fossil.`] as [string, string, string];
    })],
  ];
  s.room('revive3', 'Cinnabar Lab: Other Fossils', 'The plate takes any fossil. It just takes a little longer with the far ones.',
    [...TRAYS.map(([key, label]) => c(label, o('He pulls out the tray and holds his hand out for it.', s.open(`${key}1`)))), c('Back.', o('Back to the hall.', s.open('hall')))]);
  for (const [key, , list] of TRAYS) {
    const pages = Array.from({ length: Math.ceil(list.length / 3) }, (_, i) => list.slice(i * 3, i * 3 + 3));
    pages.forEach((page, i) => {
      const last = i === pages.length - 1;
      s.room(`${key}${i + 1}`, 'Cinnabar Lab: Other Fossils', `${page.map(([, , n]) => n.replace(/\.$/, '')).join(', ')}.`,
        [...page.map(([f, m, n]) => revive(f, m, n)), last ? c('Not these. Back.', o('He puts the tray away again, carefully.', s.open('revive3'))) : c('The next tray.', o('Another tray, another three.', s.open(`${key}${i + 2}`)))]);
    });
  }
  const wake = (label: string, text: string) => c(label, o(`${text} Its Bond starts one step higher.`, newest(5), newest(5), moment('Woke a fossil at the Cinnabar Lab, and were the first face it saw.')));
  s.room('wake', 'Cinnabar Lab: It Wakes', 'Something very old opens its eyes on a world with the wrong stars, and sees one face.',
    [wake('"It\'s all right."', 'It looks at you for a long time. Then it decides to believe you.'), wake('"Welcome back."', 'It doesn\'t know the words. It knows the voice.'),
      wake('(Say nothing; hold out a hand.)', 'It puts its head under your hand, and leaves it there.')]);
  s.room('fusion', 'Cinnabar Lab: The Fusion Display', 'Pick any two of your party, and the assistant sketches what would come out. Cosmetic: nobody gets hurt by a drawing.',
    [c('Pick two and watch her draw.', o('The sketch is very bad and very loving. Your lead looks at it, and then at you, with deep suspicion. You keep it anyway.', fr(1, 'picked'), s.open('hall')), { pick: {} }), c('Back.', o('Back.', s.open('hall')))]);
  const tradeFor = (stage: number, mon: string, label: string) => c(label, o(`The scientist swaps Balls with you with enormous relief. Both sides of the trade were shown before it was made.`, { kind: 'tradeAway', want: { label: `a Pokémon of evolution stage ${stage}`, species: [], stage } }, join([mon])));
  s.room('trade', 'Cinnabar Lab: Lab Trades', 'One trade, with both sides shown first: a Voltorb, an Electrode or a Porygon, for any Pokémon of the same evolution stage.',
    [tradeFor(1, 'voltorb', 'A first-stage Pokémon for the Voltorb.'), tradeFor(2, 'electrode', 'A middle-stage Pokémon for the Electrode.'), tradeFor(1, 'porygon', 'A first-stage Pokémon for the Porygon.'), c('No trade.', o('"Manners it is, then," he sighs.'))]);
  s.room('hall', 'Cinnabar Lab', 'Everything hums. The man on the keyboard has turned his head the other way.', rooms);
}

// ---------- Pokémon Mansion (Pseudo Stage: six nodes)
{
  const s = space(E, { id: 'cs.kanto.cinnabar.mansion', town: 'cinnabar', name: 'Pokémon Mansion', kind: 'PS', appears: 'roll', flags: ['kanto.mansion.diary', 'kanto.mansion.order', 'kanto.mansion.file'], section: `${DOC}: Pokémon Mansion`,
    placed: { stage: [7], home: 6, window: [4, 8], sits: 'door', attaches: 'instead', badge: 'A burnt door', level: 1, often: 'Once per run' },
    ps: { name: 'Pokémon Mansion', themeId: 'fire-poison', mood: 'a great house with no roof' } });
  const ruin = (to: string, text: string) => c('Go on.', battle(text, wild([], { types: ['fire', 'poison', 'electric'], levelBonus: 1, win: [s.open(to)] })),
    { chance: 15 / 16, fail: battle(`${text} Hot rubble shifts underfoot and your lead is burned.`, wild([], { types: ['fire', 'poison', 'electric'], levelBonus: 1, win: [s.open(to)] }), burnLead) });
  const page = (n: number, text: string) => [intel(), intel(), flag('kanto-mansion-diary'), moment(`Read page ${n} of the Mansion diary: ${text}`)];
  s.entry('Pokémon Mansion', 'A great house with no roof. The fire was years ago. Grimer live in what was the kitchen. Burned-out ruins: Fire, Poison and Electric Pokémon, and a 1 in 16 chance of a burn from hot rubble at every room.',
    [c('Go in.', o('The front door is only half a door.', s.open('n1'))), c('Not today.', o('You leave the ruin to its Grimer.'))]);
  const sw = (to: string, name: string) => c(`Press the ${name} statue's eye.`, o('Something clunks deep in the walls, and a door you hadn\'t noticed stands open.', s.open(to)), { chance: 0.5, fail: o('Something clunks deep in the walls, and the wrong door slams shut. It takes another try to put it right.', s.open(to)) });
  s.room('n1', 'Pokémon Mansion: The Hall', 'Two statues with red eyes. One\'s eye is a switch. Three statues in the house, and each one opens some doors and shuts others.',
    [ruin('n2', 'The hall is full of things that live in rubble now.'), sw('n2', 'hall')]);
  s.room('n2', 'Pokémon Mansion: The Library', 'Burned books. On the one desk, Diary page 1: "We found it in the jungle. A new kind. We\'ve named it. It let us."',
    [ruin('n3', 'Something in the stacks objects to you reading.'), c('Read it twice.', o('It let us. You read that line a third time.', ...page(1, 'a new kind, found in the jungle'), s.open('n3')))]);
  s.room('n3', 'Pokémon Mansion: The Laboratory', 'Broken tanks. A second statue switch. Diary page 2: "It\'s had a child. We are calling the child Two. We\'re very proud. I\'m ashamed of how proud." On the back of the page, in pencil, the order of the switches.',
    [c('Read the back of page 2, and press them in order.', o('Hall, laboratory, basement. Every door opens at once, the right ones.', ...page(2, 'the child called Two'), flag('kanto-mansion-order'), s.open('n4'))), sw('n4', 'laboratory'), ruin('n4', 'A Magmar has made a nest in the warm tank.')]);
  s.room('n4', 'Pokémon Mansion: The Nursery', 'A small room. A cot. Toys for something that wasn\'t a child. Nothing lives in this room; nothing fights here. Diary page 3: "It asks questions now. We haven\'t taught it any. I answered one honestly and it didn\'t speak for a week."',
    [c('Take the page.', o('You fold it into your notebook very carefully, as if it could still be hurt.', ...page(3, 'it asks questions'), s.open('n5'))), c('Leave the page on the cot.', o('Some things should stay where they were left.', fr(1, 'party'), s.open('n5')))]);
  s.room('n5', 'Pokémon Mansion: The Basement', 'The third switch, and the door it opens. Diary page 4: "We can\'t hold it. He says we must. He signs the cheques. He doesn\'t sign them with his name." Page 4 is a File: the cheques tie to Giovanni\'s cover.',
    [c('Take page 4, and open the door.', o('The file goes in your bag. The door opens on a light.', ...page(4, 'the cheques'), flag('kanto-mansion-file'), s.open('n6'))), sw('n6', 'basement')]);
  const reward = s.open('reward');
  s.room('n6', 'Pokémon Mansion: The Scientist', 'A Rocket scientist, left behind, with a Muk or a Weezing. The scientist: "I came back for my notes. That\'s all. I just want my name off them."',
    [c('Battle.', battle('He fights like a man who wants it to be over.', foe('Rocket Scientist', { team: ['muk'], size: 1, levelBonus: 1, win: [item('secret-key'), reward] })), { chance: 0.5, fail: battle('He fights like a man who wants it to be over.', foe('Rocket Scientist', { team: ['weezing'], size: 1, levelBonus: 1, win: [item('secret-key'), reward] })) }),
      c('"Whose name\'s on the cheques?"', o('"Not his. Never his." He says it to the floor. Then he looks up: "Battle me or let me go. I can\'t stand here."', intel(), s.open('n6b'))),
      c('"Take your notes and go."', o('No battle. He gathers his notes, and leaves the Secret Key on the table, and goes up the stairs without looking back.', item('secret-key'), ...kind(), reward))]);
  s.room('n6b', 'Pokémon Mansion: The Scientist', 'He waits for your answer with his notes held against his chest.',
    [c('Battle.', battle('He fights like a man who wants it to be over.', foe('Rocket Scientist', { team: ['weezing'], size: 1, levelBonus: 1, win: [item('secret-key'), reward] }))), c('"Take your notes and go."', o('He leaves the Secret Key on the table.', item('secret-key'), ...kind(), reward))]);
  s.room('reward', 'Pokémon Mansion: What the House Gives', 'The Secret Key opens the Gym\'s door, and one locked room in Cerulean Cave. And in the scientist\'s drawer: TM Fire Spin, or a Fire-type fossil.',
    [c('TM Fire Spin.', o('The disc is warm, as if the fire never quite went out in it.', teach('fire-spin'), moment('Walked out of the burned Mansion with the Secret Key.'))),
      c('The Fire-type fossil.', o('A fossil with a little warmth still in the stone.', item('hisui-ember-fossil'), moment('Walked out of the burned Mansion with the Secret Key.')))]);
}

// ---------- Seafoam Islands (Pseudo Stage: six nodes)
{
  const s = space(E, { id: 'cs.kanto.cinnabar.seafoam', town: 'cinnabar', name: 'Seafoam Islands', kind: 'PS', appears: 'roll', flags: ['kanto.seafoam.articuno'], section: `${DOC}: Seafoam Islands`,
    placed: { stage: [7], home: 12, window: [10, 14], sits: 'door', attaches: 'instead', badge: 'A snowflake over a wave', level: 2, often: 'Once per run' },
    ps: { name: 'Seafoam Islands', themeId: 'water-ice', mood: 'the sea going in at one end and out the other, fast' } });
  const FOES = ['seel', 'dewgong', 'shellder', 'slowpoke', 'jynx', 'golbat', 'zubat', 'psyduck'];
  const boulder = (n: number, from: string, to: string, extra: Json[] = []) => [
    c('Push it in with Strength.', o('Your Pokémon puts its shoulder to the boulder and it drops into the hole on the level below. The current there breaks against it.', s.open(to)), { requires: [move('strength')] }),
    c('Push it in with your lead: two pushes.', battle('The first push moves it halfway. Something in the ice cave doesn\'t like the noise.', wild(FOES, { levelBonus: 2, win: [s.open(to)] }))),
    c('Leave it, and wade past.', o('You keep your feet. Just. The current pulls at you the whole way, and lets go at the far side.', s.open(to)),
      { chance: 0.5, fail: o('Without the boulder the current is still running. It takes you off your feet and carries you one room back.', s.open(from)) }),
    ...extra,
  ];
  s.entry('Seafoam Islands', 'Two islands joined underground. The sea goes in at one end and comes out the other, fast. An ice cave with a current: until a boulder is set, the current may carry you one room back. Three boulders, on the second, third and fourth rooms, each to be pushed into the hole on the level below.',
    [c('Go down.', battle('The first room is all ice and spray, and a Seel who thinks you are in its way.', wild(FOES, { levelBonus: 2, win: [s.open('n2')] }))), c('Not today.', o('You leave the sea to its business.'))]);
  s.room('n2', 'Seafoam Islands: The First Boulder', 'The first boulder sits by the hole, and the current runs hard under it.', boulder(2, 'n2', 'n3'));
  s.room('n3', 'Seafoam Islands: The Second Boulder', 'A Slowpoke\'s sitting on the second boulder. It doesn\'t move. It\'s noticed you. It\'ll have noticed properly by tomorrow.',
    [c('Push anyway. Gently.', o('You push. The Slowpoke rides the boulder all the way into the hole, and climbs out again, unbothered.', s.open('n4'))),
      c('Wait for it.', o('You wait. It takes a node\'s time. When it finally gets down, it follows you, and lets itself be caught without a fight.', { kind: 'takeNode' }, join(['slowpoke']), s.open('n4'))),
      c('Offer it a Berry.', o('It takes the Berry, and gets off, and the boulder goes in.', s.open('n4')))]);
  s.room('n4', 'Seafoam Islands: The Third Boulder', 'The last boulder. Beyond it the water goes still.', boulder(4, 'n3', 'n5'));
  s.room('n5', 'Seafoam Islands: The Still Water', 'The current is broken. The sound of the sea has gone somewhere far away. One more room, and the bottom.',
    [c('Go on down.', battle('A Jynx is singing in the dark, and stops when it sees you.', wild(['jynx', 'dewgong', 'golbat'], { levelBonus: 2, win: [s.open('n6')] })))]);
  const prize = [item('nevermeltice'), item('icy-rock')];
  s.room('n6', 'Seafoam Islands: The Bottom', 'It\'s the only thing down here that isn\'t moving. The current goes round it.',
    [c('Look.', o('A pillar of ice, in still water.', s.open('pillar')), { chance: 0.45, fail: battle('Not a bird. Dewgong: five of them, surfacing one after another, and none of them pleased.', wild(['dewgong'], { levelBonus: 2, chain: 3, win: [...prize, moment('Fought a Dewgong horde at the bottom of the Seafoam Islands.')] })) })]);
  s.room('pillar', 'Seafoam Islands: The Pillar', 'On a pillar of ice in still water, something with long blue feathers. It can be caught, at low odds.',
    [c('Battle.', battle('It opens its wings and the water freezes round your feet.', wild(['articuno'], { levelBonus: 2, win: [...prize, flag('kanto-seafoam-articuno'), moment('Met Articuno at the bottom of the Seafoam Islands.')] })),
      { chance: 0.78, fail: battle('Its feathers are the wrong colour: violet, and the eyes are wrong too. A Galarian Articuno.', wild(['articuno-galar'], { levelBonus: 2, win: [...prize, flag('kanto-seafoam-articuno'), moment('Met a Galarian Articuno at the bottom of the Seafoam Islands.')] })) })]);
}

// ---------- New Island (Pseudo Stage: five nodes)
{
  const s = space(E, { id: 'cs.kanto.cinnabar.newisland', town: 'cinnabar', name: 'New Island', kind: 'PS', appears: 'roll', flags: ['kanto.newisland.stood', 'kanto.newisland.done', 'kanto.newisland.dock'], section: `${DOC}: New Island`,
    placed: { stage: [7], home: 15, window: [13, 17], sits: 'optional', attaches: 'instead', badge: 'A sealed letter', level: 2, often: 'Once per run (roll, weight 1)' },
    ps: { name: 'New Island', themeId: 'psychic-dark', mood: 'a thunderstorm that never ends' } });
  const dock = o('You wake on the dock. "Your best Pokémon was scanned." Nothing\'s lost. Nobody on the dock remembers a castle.', flag('kanto-newisland-dock'));
  s.entry('New Island', 'A Dragonite lands with a letter, and waits for an answer. The letter: "You are invited, as one of a few trainers of promise, to the castle on New Island. A ferry leaves at dusk. The ferry will not run. Come anyway." A thunderstorm: rain throughout; Thunder never misses.',
    [c('Go.', o('The Dragonite bows, and flies off ahead of you into the dark.', s.open('n1'))), c('Who sent this?', o('The Dragonite doesn\'t know how to say. It looks at the sea.', s.open('ask'))), c('Not tonight.', o('Declining ends it; nothing\'s lost. The Dragonite takes the letter back, very carefully.'))]);
  s.room('ask', 'New Island: The Letter', 'The Dragonite waits, rain running off its wings.', [c('Go.', o('It flies ahead.', s.open('n1'))), c('Not tonight.', o('It takes the letter back.'))]);
  s.room('n1', 'New Island: The Crossing', 'The ferry isn\'t running. Your own Pokémon carry you through the storm: a timing course. The harbour mistress, in a cloak, watching: "The ones who get across are the ones who should."',
    [c('Cross.', o('You cross, soaked to the bone, every one of your Pokémon gasping on the far shore.', s.open('n2')), { prompt: ['dodge-tap', 'good'], fail: dock })]);
  s.room('n2', 'New Island: The Hall', 'A long table set for many; three other trainers who made it. A hooded woman who speaks as if reciting.', [c('Sit.', o('Nobody eats. The hooded woman leads you all deeper.', s.open('n3')))]);
  s.room('n3', 'New Island: The Host', 'The hood comes off. She\'s a missing nurse, and she blinks, and doesn\'t know where she is. The host speaks without a mouth: "You came through a storm because a letter flattered you. So did they."',
    [c('Go on.', o('The nurse holds your sleeve. You take her with you.', s.open('n4')))]);
  s.room('n4', 'New Island: The Laboratory', 'Tanks. Every Pokémon the guests brought is scanned, through the Balls, without being taken. Nothing of yours is removed.',
    [c('Go down.', o('Below, a floor like a stage.', s.open('n5')))]);
  s.room('n5', 'New Island: The Clone Battle', 'Copies of your own team: the same species, no items, no abilities, +10% to every stat, and they know your moves and use the best one against each matchup. Your lead looks at itself. Itself looks back. Neither wants to go first.',
    [c('Fight.', battle('After two knock-outs on either side, the fighting slows. Both sides are tired. They\'re hitting themselves.', foe('The Copies', { mirror: true, clone: true, size: 3, levelBonus: 2, weather: 'rain', win: [s.open('after')], lose: [flag('kanto-newisland-dock')] })))]);
  const core: Json[] = [{ kind: 'copyMoves' }, flag('kanto-newisland-done')];
  const mew = (text: string, ...x: Json[]) => o(text, ...core, ...x, s.open('end'));
  s.room('after', 'New Island: Both Sides Tired', 'Both sides are tired. They\'re hitting themselves.',
    [c('Keep fighting.', o('The battle\'s finished as a battle. The host says: "As I thought. Nothing in it." The Clone Core is left on the floor: once, copy one Pokémon\'s moves to another.', ...core)),
      c('Stop. Call mine back.', mew('The copies stop too. They\'ve nobody telling them to go on. The host leaves, taking the copies with it: "They\'re mine. I won\'t have them used. Not even by me." The Clone Core is left behind.')),
      c('Stand between them.', mew('Off-screen, a white flash. You\'re on the floor. Both parties are round you. The host\'s silent for a long time. "...Why would you do that for something you could replace?" Then it leaves, taking the copies: "They\'re mine. I won\'t have them used. Not even by me." The Clone Core is left behind.', flag('kanto-newisland-stood'), moment('Stood between your team and its copies on New Island.')))]);
  s.room('end', 'New Island: The Rafters', 'The castle is emptying. Something pink might have been watching from the rafters all along.',
    [c('Look up.', o('Something pink\'s been watching from the rafters all along. It can be tried for, once.', s.open('mew')), { chance: 0.1, fail: o('Only rafters, and the storm going quiet outside.') })]);
  s.room('mew', 'New Island: Mew', 'It hangs in the air, upside down, curious. Once.',
    [c('Try for it.', battle('It plays with you more than it fights.', wild(['mew'], { levelBonus: 2, win: [moment('Saw Mew on New Island.')] }))), c('Let it watch.', o('It watches you go, and then it is gone.', fr(1, 'party')))]);
}

// ---------- Cinnabar Volcano
{
  const s = space(E, { id: 'cs.kanto.cinnabar.volcano', town: 'cinnabar', name: 'Cinnabar Volcano', kind: 'EV', appears: 'roll', flags: ['kanto.volcano.herb'], section: `${DOC}: Cinnabar Volcano`,
    placed: { stage: [7], home: 9, window: [7, 11], sits: 'optional', attaches: 'after', badge: 'A smoking peak', level: 0, often: 'Once per run' } });
  const step = (n: number, to: string) => c(`Climb (step ${n} of 3).`, o('Hot stone, and the smell of sulphur, and the path climbing.', s.open(to)), { chance: 15 / 16, fail: o('A vent breathes out as you pass. Your lead is burned.', burnLead, s.open(to)) });
  const prize = [item('fire-stone'), item('heat-rock'), flag('kanto-volcano-herb'), ...kind(), moment('Climbed Cinnabar Volcano for the burn herb.')];
  s.entry('Cinnabar Volcano', 'The Center\'s out of burn medicine. The herb it\'s made from grows in one place. Nurse: "It\'s up there. It only grows where it\'s too hot to pick it. I\'d go, but then who\'s here?" Three steps up; each has a 1 in 16 chance of a burn to your lead. A Fire-type in the lead takes none, and finds the path.',
    [step(1, 's2'), c('Not today.', o('The nurse nods. "Somebody will."'))]);
  s.room('s2', 'Cinnabar Volcano: Halfway', 'The ground is warm through your boots.', [step(2, 's3')]);
  s.room('s3', 'Cinnabar Volcano: The Last Step', 'Nearly there. The air shimmers.', [step(3, 'top')]);
  const guard = ['magmar', 'charmeleon', 'ponyta'];
  s.room('top', 'Cinnabar Volcano: The Herb Bed', 'At the top, a Magmar, a Charmeleon or a Ponyta, sitting in the herb bed as if it\'s a garden.',
    [c('Battle.', battle('It gets up out of the herbs, slowly, and shakes them off.', wild(guard, { levelBonus: 0, win: prize }))),
      c('Ask. Pick only what\'s needed.', o('It watches. You take one handful. It lets you.', ...prize)),
      c('Trade it a Berry for a handful.', o('It takes the Berry, and moves over.', ...prize))]);
}

// ============================================================ VIRIDIAN THE RETURN (Stage 8) AND THE FINALE

// ---------- Route 23: The Badge Check
{
  const s = space(E, { id: 'cs.kanto.route.badge-check', town: 'route', name: 'Route 23: The Badge Check', kind: 'CUT', appears: 'always', flags: ['kanto.badge.shortcut'], section: `${DOC}: Route 23: The Badge Check`,
    placed: { stage: [8], home: 19, sits: 'must', attaches: 'before', badge: 'Eight small circles', level: null, often: 'Once per run' } });
  s.entry('Route 23: The Badge Check', 'Eight guards, one after another, on one road. Each checks one Badge, and each has heard one thing about you. First guard: "Boulder. ...You\'re the one who sat through Brock\'s stew? Brave." Eighth guard: "Earth. ...Go on. Nobody\'s checked that one in years. Nobody\'s had it."',
    [c('Walk the road.', o('Eight guards, eight Badges, eight small nods. At the end of the road the gate is open.', moment('Passed the eight guards on Route 23.'))),
      c('Take the shortcut the sixth guard offers.', o('He opens a side door: "Six Badges by Stage 7. You\'ve earned the short way round." It skips the first two rooms of Victory Road.', flag('kanto-badge-shortcut')), { requires: [{ kind: 'badges', atLeast: 6 }] })],
    { remembers: [
      { id: 'perfume', when: [is('kanto-perfume-foiled')], notice: 'Fourth guard: "Rainbow. You pushed a wheelbarrow at Team Rocket. My sister was there. She can\'t tell it without crying."' },
      { id: 'stew', when: [is('kanto-stew-perfect')], notice: 'Second guard, unprompted: "And Brock says the stew\'s never been better since."' },
      { id: 'quiet', when: [not('kanto-perfume-foiled')], notice: 'Fourth guard: "Rainbow. Quiet one, that. Nothing wrong with quiet."' },
    ] });
}

// ---------- Victory Road (Pseudo Stage: seven nodes, the finale)
{
  const s = space(E, { id: 'cs.kanto.indigo.road', town: 'indigo', name: 'Victory Road', kind: 'PS', appears: 'always', flags: ['kanto.road.moltres'], section: `${DOC}: Victory Road`,
    placed: { stage: [8], home: 20, sits: 'door', attaches: 'after', badge: 'Eight lights', level: 2, often: 'Once per run' },
    ps: { name: 'Victory Road', themeId: 'ground-rock', mood: 'eight lights coming on, one at a time' } });
  const FOES = ['machop', 'machoke', 'geodude', 'graveler', 'onix', 'rhyhorn', 'marowak', 'zubat', 'golbat'];
  const plate = (to: string, text: string) => [c('Push the boulder onto the plate.', o(text, s.open(to)), { requires: [move('strength')] }),
    c('Push it the hard way.', battle(`${text} It takes long enough that something comes to see what the noise is.`, wild(FOES, { levelBonus: 2, win: [s.open(to)] })))];
  s.entry('Victory Road', 'A cave with a carved arch. Eight sockets in the arch. As you walk under, eight lights come on, one at a time.',
    [c('Go in.', o('The lights stay on behind you.', s.open('n1')))],
    { remembers: [{ id: 'short', when: [is('kanto-badge-shortcut')], addChoices: [c('The guard\'s side door.', o('The short way round comes out past the first boulder.', s.open('n3')))], notice: 'The sixth guard\'s side door is unlocked.' }] });
  s.room('n1', 'Victory Road: The Arch', 'A trainer sitting just inside, boots off: "I\'ve been in here a month. I\'m not lost. I\'m resting."',
    [c('Go on.', battle('Past the resting trainer, the cave gets serious.', wild(FOES, { levelBonus: 2, win: [s.open('n2')] })))]);
  s.room('n2', 'Victory Road: Boulder Puzzle 1', 'One boulder, one plate.', plate('n3', 'The boulder grinds onto the plate, and a gate lifts.'));
  s.room('n3', 'Victory Road: Back to Back', 'Two trainers, back to back.',
    [c('Battle.', battle('A double battle.', foe('Ace Trainers', { size: 2, format: 'doubles', levelBonus: 1, win: [s.open('n4')] })))]);
  s.room('n4', 'Victory Road: Boulder Puzzle 2', 'Two boulders, two plates, one of them on the floor above.', plate('n5', 'Two boulders, two plates; the second one rolls the last foot by itself.'));
  s.room('n5', 'Victory Road: The Ledge', 'A rest: a ledge with a view of every stage of Kanto you\'ve crossed. The party sits.',
    [c('Sit with them.', o('Every road, every town, from up here, small and lit. Nobody says anything. Bond +1.', fr(3, 'party'), heal(0.3), s.open('n6')))]);
  s.room('n6', 'Victory Road: Boulder Puzzle 3', 'The last boulder, and behind it, either a nest or a kennel.', plate('n6b', 'The last boulder drops, and the wall behind it opens.'));
  s.room('n6b', 'Victory Road: Behind the Boulder', 'Behind the third boulder: the cave\'s one shaft of daylight.',
    [c('Look.', o('Moltres, asleep on a ledge with the cave\'s one shaft of daylight on it.', s.open('moltres')), { chance: 0.35, fail: o('An Arcanine, old, guarding nothing in particular.', s.open('arcanine')) })]);
  s.room('moltres', 'Victory Road: The Nest', 'Moltres, asleep in the light. It can be caught, at low odds.',
    [c('Battle.', battle('It wakes, and the light becomes fire.', wild(['moltres'], { levelBonus: 2, win: [flag('kanto-road-moltres'), moment('Met Moltres on Victory Road.'), s.open('n7')] }))), c('Let it sleep.', o('You pass it on tiptoe.', s.open('n7')))]);
  s.room('arcanine', 'Victory Road: The Kennel', 'The old Arcanine lifts its head. It can be battled, or passed with a bow.',
    [c('Battle.', battle('It fights the way old dogs fight: rarely, and well.', wild(['arcanine'], { levelBonus: 2, win: [s.open('n7')] }))), c('Pass with a bow.', o('It lowers its head to you, and lets you go.', s.open('n7')))]);
  const after = 'Rival: "Right. Go on, then. I\'ll be behind you. ...I\'ll be right behind you."';
  s.room('n7', 'Victory Road: The Rival\'s Last Stand', 'The exit. Daylight. Somebody\'s sitting in it. Rival: "I got here yesterday. I was going to go straight in. Then I thought: no. They\'ll come through here. I want that one first. Everything after this is strangers. This one\'s ours."',
    [c('Battle.', battle(`A full battle. Win or lose, at the end the rival gets up first. ${after}`, foe('Rival', { rival: true, size: 6, levelBonus: 2, win: [item('hard-stone'), moment('Fought the rival one last time at the mouth of Victory Road.'), { kind: 'addEvent', eventId: 'cs-kanto-cerulean-cave' }], lose: [item('hard-stone'), { kind: 'addEvent', eventId: 'cs-kanto-cerulean-cave' }] }), { kind: 'rivalChange', feelings: { respect: 1 }, lead: 0 }))],
    { remembers: [{ id: 'trust', when: [{ kind: 'rivalState', feeling: { key: 'trust', atLeast: 5 } }], notice: 'The rival walks out beside you.' }, { id: 'low', when: [], notice: 'The rival walks out after you.' }] });
  // remembers with no condition is not allowed: drop the fallback.
  (E[E.length - 1] as { remembers: unknown[] }).remembers.pop();
}

// ---------- Cerulean Cave (post-game Pseudo Stage: two visits)
{
  const s = space(E, { id: 'cs.kanto.cerulean.cave', town: 'cerulean', name: 'Cerulean Cave', kind: 'PS', appears: 'locked', requires: { spaces: ['cs.kanto.indigo.road'] }, flags: ['kanto.cave.first', 'kanto.cave.answer'], section: `${DOC}: Cerulean Cave`,
    placed: { stage: [8], home: 20, sits: 'door', attaches: 'after', badge: 'A cave over water', level: 2, often: 'Twice per run' },
    ps: { name: 'Cerulean Cave', themeId: 'psychic-dark', mood: 'still water, and something standing in it' } });
  const STRONG = ['electrode', 'raichu', 'kadabra', 'wobbuffet', 'chansey', 'ditto', 'rhydon', 'golbat', 'parasect', 'sandslash'];
  s.entry('Cerulean Cave', 'A cave mouth over the water north of Cerulean. There was always a man standing in front of it. He\'s gone. Strong wild Pokémon of every kind; no trainers. Nobody else has been let in.',
    [c('Go in.', battle('The first thing in the dark is not friendly.', wild(STRONG, { levelBonus: 2, win: [s.open('n2')] }))), c('Not yet.', o('The water laps at the mouth of the cave. It will wait.'))]);
  s.room('n2', 'Cerulean Cave: The Deep', 'Deeper. A locked door in the rock, and the way on.',
    [c('Open the locked door with the Secret Key.', o('A cot, the same as the one in the Mansion\'s nursery. It\'s been carried here, a long way, by something that didn\'t need to carry anything.', s.open('n3')), { requires: [has('secret-key')] }),
      c('Go on.', battle('Something else lives down here.', wild(STRONG, { levelBonus: 2, win: [s.open('n3')] })))]);
  s.room('n3', 'Cerulean Cave: The Bottom', 'It\'s standing in still water with its back turned. Mewtwo: "Another one. You\'ve come to see if it\'s true. It\'s true. Now what?"',
    [c('Battle.', battle('It can\'t be caught on this visit. It ends when it has seen enough. Mewtwo: "Enough. You fight like someone who\'ll stop when it\'s asked. That\'s rare. Go."',
      foe('Mewtwo', { team: ['mewtwo'], size: 1, levelBonus: 2, spritePokemon: 'mewtwo', win: [flag('kanto-cave-first'), s.open('leave')], lose: [flag('kanto-cave-first'), s.open('leave')] })))]);
  s.room('leave', 'Cerulean Cave: Before Leaving', 'Mewtwo has turned its back again.',
    [c('"I\'m sorry for what they did."', o('Mewtwo: "You didn\'t do it. Don\'t carry what isn\'t yours. I\'ve enough for both."', flag('kanto-cave-answer'), { kind: 'laterEvent', eventId: s.id('second'), nodes: 2 })),
      c('"What do you want?"', o('Mewtwo: "Nobody\'s asked. ...Come back when I\'ve an answer."', flag('kanto-cave-answer'), { kind: 'laterEvent', eventId: s.id('second'), nodes: 2 })),
      c('(Leave, quietly.)', o('You leave the way you came, and the water closes over the sound of your steps.', flag('kanto-cave-answer'), { kind: 'laterEvent', eventId: s.id('second'), nodes: 2 }))],
    { remembers: [{ id: 'stood', when: [is('kanto-newisland-stood')], addChoices: [c('Wait.', o('It turns round. It has heard about the castle.', s.open('second')))], notice: 'It knows you. It knows what you did on New Island.' }] });
  s.room('second', 'Cerulean Cave: The Second Visit', 'Mewtwo: "I\'ve an answer. I\'d like to see what it\'s like. Out there. With someone who stops when asked." It offers to come. No Ball\'s thrown unless you choose to; it steps into one.',
    [c('Hold out a Ball.', o('It steps into it. The Kanto Secret.', join(['mewtwo'], { levelBonus: 2 }), moment('Mewtwo chose to come with you: the Kanto Secret.'))), c('"Come without one."', o('It comes without one, and a Ball is only for the rules. The Kanto Secret.', join(['mewtwo'], { levelBonus: 2 }), moment('Mewtwo chose to come with you: the Kanto Secret.')))]);
}

// ---------- Sabrina's lament (manga-inspired: after the Labyrinth, a flashback at the next + node)
{
  const s = space(E, { id: 'cs.kanto.saffron.lament', town: 'route', name: "Sabrina's Lament", kind: 'CUT', appears: 'route', flags: [], section: `${DOC}: Manga-inspired moments`,
    placed: { stage: [6, 7], home: 10, sits: 'plus', attaches: 'plus', badge: 'A bent spoon', level: null, often: 'Once per run' } });
  s.room('flash', "Sabrina's Lament", 'A flashback, at a quiet place on the road. A small girl who bent a spoon, and a room that went quiet.',
    [c('Let it pass.', o('The memory is not yours, and it leaves you holding it anyway.', intel()))], later({ requires: [is('kanto-sabrina-labyrinth-done')] }));
  followup(s.id('flash'), [6, 7]);
  // A cutscene with no entry of its own: drop the empty catalog id back out of EXTRA.
  delete EXTRA['cs.kanto.saffron.lament'];
  SPACES.pop();
}

// ============================================================ THE ROUTES (any Kanto stage; at most two per stage)

// ---------- Charizard Valley
{
  const s = space(E, { id: 'cs.kanto.route.charizard', town: 'route', name: 'Charizard Valley', kind: 'EV', appears: 'route', flags: [], section: `${DOC}: Charizard Valley`,
    placed: { stage: [5, 6, 7, 8], home: 16, window: [14, 18], sits: 'door', attaches: 'instead', badge: 'A wing and a flame', level: 0, often: 'Once per run' } });
  const feather = item('charizard-feather');
  const round = (n: number, to: string) => battle(`Charizard ${n}: each one stronger. Between them you may rest, but not heal.`, wild(['charizard'], { levelBonus: n - 1, win: [feather, s.open(to)] }));
  s.entry('Charizard Valley', 'A canyon with a gate, and a woman on a Charizard above it, looking down. The warden, Liza: "Nobody\'s kept here. They come to get strong, and they leave when they are. Yours wants in? Or you do?"',
    [c('Three battles.', round(1, 'r2')), c('Let it fight all three alone.', battle('Your Charmander line asked to fight all three alone, and you let it.', wild(['charizard'], { levelBonus: 0, chain: 3, rule: { leadType: 'fire', noSwitch: true }, win: [feather, feather, feather, kc('statUp', { stat: 'best' }), s.open('prize')] })), { requires: [{ kind: 'partyLine', species: 'charmander' }], pick: { types: ['fire'] } }),
      c('Not today.', o('Liza: "Come back when it asks."'))]);
  s.room('r2', 'Charizard Valley: The Second', 'The second Charizard drops off the cliff and lands in front of you.', [c('Battle.', round(2, 'r3'))]);
  s.room('r3', 'Charizard Valley: The Third', 'The third is the oldest, scarred across one wing.', [c('Battle.', round(3, 'prize'))]);
  s.room('prize', 'Charizard Valley: Liza', 'Liza lands beside you. She gives you Charcoal, and looks at you a long while: half the time, she gives a Mega Stone too.',
    [c('Thank her.', o('A Mega Stone, too.', item('charcoal'), { kind: 'itemFrom', ids: ['charizardite-x', 'charizardite-y'], count: 1 }, moment('Beat the three Charizard of the valley.')), { chance: 0.5, fail: o('Charcoal, warm in the hand.', item('charcoal'), moment('Beat the three Charizard of the valley.')) })]);
}

// ---------- Pidgeotto's Farewell
{
  const s = space(E, { id: 'cs.kanto.route.pidgeotto', town: 'route', name: "Pidgeotto's Farewell", kind: 'EV', appears: 'route', requires: { flags: ['kanto.flock.pidgey'] }, flags: ['kanto.pidgeotto.released'], section: `${DOC}: Pidgeotto's Farewell`,
    placed: { stage: [4, 5, 6, 7, 8], home: 5, window: [3, 8], sits: 'optional', attaches: 'before', badge: 'A feather, falling', level: 1, often: 'Once per run' } });
  const go = { kind: 'tradeAway', want: { label: 'your Pidgeotto', species: ['pidgeotto'] } };
  s.entry("Pidgeotto's Farewell", 'The flock again. Fearow now. Under them, a tree full of Pidgey and Pidgeotto, with nobody to lead them. Your Pidgeotto\'s out of its Ball before it\'s called. It looks at the tree. It looks at you.',
    [c('"Go. They need you."', o('It evolves in the air. It leaves the party. A Sharp Beak\'s left on the path. It will be back, once, when you need it most.', go, item('sharp-beak'), flag('kanto-pidgeotto-released'), moment('Let your Pidgeotto go to lead the flock.'))),
      c('"Stay. We\'ll drive them off together."', battle('A battle with the Fearow.', foe('Fearow flock', { team: ['fearow'], size: 1, levelBonus: 1, win: [evolve('pidgeotto', 'pidgeot'), moment('Your Pidgeotto drove off the Fearow, and stayed.')] }))),
      c('"It\'s your choice."', o('It goes. A stage later it comes back, and goes again. It\'s the tree\'s, and it\'s yours. It\'s both.', go, flag('kanto-pidgeotto-released'), flag('kanto-pidgeotto-both')))],
    { requires: [party('pidgeotto'), is('kanto-flock-pidgey')] });
  s.room('back', "Pidgeotto's Farewell: Both", 'A Pidgeot lands in front of you on the road, and shakes out its wings.', [c('Welcome it back.', o('It stays a while. No choice here loses it for good.', join(['pidgeot'])))], later({ requires: [is('kanto-pidgeotto-both')] }));
  followup(s.id('back'), [5, 6, 7, 8]);
}

// ---------- Bulbasaur's Gathering
{
  const s = space(E, { id: 'cs.kanto.route.bulbasaur', town: 'route', name: "Bulbasaur's Gathering", kind: 'EV', appears: 'route', flags: [], section: `${DOC}: Bulbasaur's Gathering`,
    placed: { stage: [1, 2, 3, 4, 5, 6, 7, 8], home: 11, window: [8, 14], sits: 'door', attaches: 'after', badge: 'A bud', level: null, often: 'Once per run', tags: ['forest', 'night'] } });
  const prize = (text: string) => o(`${text} A Bulbasaur or an Ivysaur follows you out, with a Miracle Seed.`, join(['bulbasaur', 'ivysaur']), item('miracle-seed'), moment('Saw every bulb open at the Bulbasaur gathering.'));
  s.entry("Bulbasaur's Gathering", 'Every Bulbasaur for miles, walking the same way, in the dark, in silence. A clearing. A tree in the middle with one enormous bud. A hundred Bulbasaur in rings round it. They start to sway.',
    [c('Sway with them.', prize('Four bars, and you hit them, and every bulb in the clearing opens at once.'), { prompt: ['echo-rhythm', 'good'], fail: o('You lose the beat, and the bulbs stay shut. Nobody minds.') }),
      c('Watch from the edge.', o('You watch until dawn. It is enough.', fr(1, 'party'))),
      c('Let mine join.', o('At the last bar, it stops. Everyone else evolves. It can choose not to. You\'re asked nothing; it looks at you, and decides: it stays as it is, and gains what it would\'ve gained.', { kind: 'levels', amount: 2, who: 'picked' }, item('miracle-seed')), { requires: [party('bulbasaur'), { kind: 'bondLevel', atLeast: 3 }], pick: {} }),
      c('Let mine join (it\'s young yet).', o('At the last bar, everyone evolves, and so does yours.', evolve('bulbasaur', 'ivysaur'), item('miracle-seed')), { requires: [party('bulbasaur'), { kind: 'bondLevel', atLeast: 3, absent: true }] })]);
}

// ---------- Haunter's Mansion
{
  const s = space(E, { id: 'cs.kanto.route.haunter', town: 'route', name: "Haunter's Mansion", kind: 'EV', appears: 'route', flags: [], section: `${DOC}: Haunter's Mansion`,
    placed: { stage: [4, 5, 6, 7, 8], home: 13, window: [10, 16], sits: 'optional', attaches: 'instead', badge: 'A party hat', level: 0, often: 'Once per run' } });
  s.entry("Haunter's Mansion", 'An empty house with every light on, and music. The door opens by itself. A banner: "WELCOME" and, under it, in a different hand, your name, spelled nearly right. A party thrown by ghosts who haven\'t had a guest in forty years. A Gastly serving drinks through the glasses. A Gengar at the piano. A Haunter, hosting, in a hat.',
    [c('Stay for the party.', o('Three party games: musical chairs (the chairs move), charades (the Haunter\'s are all "ghost"), and a toast. Then the Haunter asks to come along.', join(['haunter']), item('spell-tag'), moment('Stayed for a party forty years in the making.'))),
      c('This is a trap.', battle('It isn\'t. They\'re hurt. A battle, half-hearted.', wild(['haunter', 'gengar', 'gastly'], { levelBonus: 0, win: [item('spell-tag')] }))),
      c('I can\'t stay long.', o('They understand. A slice of cake, wrapped. It\'s forty years old. It\'s a Spell Tag.', item('spell-tag')))],
    { remembers: [{ id: 'prank', when: [is('kanto-prank-friend')], notice: 'It\'s the same Haunter, from Lavender. "It\'s got a house?"' }] });
}

// ---------- Lapras's Song
{
  const s = space(E, { id: 'cs.kanto.route.lapras', town: 'route', name: "Lapras's Song", kind: 'EV', appears: 'route', flags: ['kanto.lapras.escort'], section: `${DOC}: Lapras's Song`,
    placed: { stage: [3, 4, 5, 6, 7, 8], home: 9, window: [6, 12], sits: 'optional', attaches: 'after', badge: 'A note over a wave', level: 0, often: 'Once per run', tags: ['water', 'night'] } });
  const escort = (text: string) => battle(`${text} A two-step escort along the coast, and one battle with Tentacool. At the end, far out: answering voices. It goes. It looks back once.`, wild(['tentacool'], { levelBonus: 0, win: [item('mystic-water'), flag('kanto-lapras-escort'), moment('Took a young Lapras home to its herd.')] }));
  s.entry("Lapras's Song", 'Singing, from the water. One voice, with gaps left in it where other voices should come in. A young Lapras in a cove too small for it, singing out to sea. Nothing sings back.',
    [c('Help it find them.', escort('You walk the shore and it swims beside you.')),
      c('Sing the gaps.', escort('It stops, astonished. It tries the song again with you in it.'), { prompt: ['echo-rhythm', 'ok'], fail: escort('Your voice cracks. It sings anyway.') }),
      c('Catch it.', o('It lets itself be caught. It\'s quiet in the Ball. A Lapras with Water Absorb and Sing.', join(['lapras'], { ability: 'water-absorb', moves: ['sing'] })))],
    { remembers: [{ id: 'silph', when: [is('kanto-silph-lapras')], intro: 'Singing, from the water. Your Lapras from Silph answers it. The young one follows her voice out to the herd. No escort\'s needed.', hide: [0, 1], addChoices: [c('Let her sing.', o('They sing to each other until the young one is gone over the horizon.', item('mystic-water'), fr(2, 'party')))] }] });
}

// ---------- The Tournament Poster
{
  const s = space(E, { id: 'cs.kanto.route.poster', town: 'route', name: 'The Tournament Poster', kind: 'EV', appears: 'route', flags: ['kanto.tournament.poster'], section: `${DOC}: The Tournament Poster`,
    placed: { stage: [1, 2, 3, 4, 5], home: 10, sits: 'plus', attaches: 'plus', badge: 'None', level: null, often: 'Once per run' } });
  s.entry('The Tournament Poster', 'A poster on the wall: FIGHTING TOURNAMENT. ALL COMERS. P-1 GRAND PRIX. Somebody\'s drawn a moustache on the Hitmonchan.',
    [c('Read it.', o('You read every line. You\'re entered at the door, without the entry test.', flag('kanto-tournament-poster'))), c('Walk past.', o('The Hitmonchan\'s moustache watches you go.'))]);
}

// ---------- Game route moments
{
  const s = space(E, { id: 'cs.kanto.route.pidgey-rush', town: 'route', name: 'Pidgey Rush', kind: 'EV', appears: 'route', flags: [], section: `${DOC}: Game route moments`,
    placed: { stage: [1], home: 4, sits: 'optional', attaches: 'after', badge: 'A feather', level: -2, often: 'Once per run' } });
  const horde = (to?: string) => battle('Pidgey and Rattata, one after another.', wild(['pidgey', 'rattata'], { levelBonus: -2, chain: 3, win: to ? [s.open(to)] : [moment('Ran at a Pidgey rush, and it worked.')] }));
  s.entry('Pidgey Rush', 'A Pidgey and Rattata horde: six, one after another. A boy on a fence: "They do that. Run at them. They hate that."', [c('Fight all six.', horde('more')), c('Run at them.', horde())]);
  s.room('more', 'Pidgey Rush: Three More', 'Three more come out of the grass.', [c('Fight on.', horde()), c('Run at them.', o('They scatter. The boy on the fence applauds.'))]);
}
{
  const s = space(E, { id: 'cs.kanto.route.cut-tree', town: 'route', name: 'The Cut Tree', kind: 'EV', appears: 'route', flags: [], section: `${DOC}: Game route moments`,
    placed: { stage: [1, 2], home: 8, sits: 'door', attaches: 'after', badge: 'A small tree', level: null, often: 'Once per run' } });
  const behind = o('The tree comes down clean. Behind it: an item, and a quiet place to rest.', { kind: 'itemFrom', ids: ['rare-candy', 'pp-up', 'nugget'], count: 1 }, heal(0.5));
  s.entry('The Cut Tree', 'A small tree across a side path.',
    [c('Cut it.', behind, { requires: [move('cut')] }), c('The Samurai\'s Slash.', behind, { requires: [is('kanto-forest-samurai-won')] }),
      c('Rest under it.', o('Without Cut, the tree\'s a rest of its own. A Caterpie\'s asleep in it. Nothing\'s lost.', heal(0.3)))]);
}
{
  const s = space(E, { id: 'cs.kanto.route.tough-junior', town: 'route', name: 'The Tough Junior', kind: 'EV', appears: 'route', flags: [], section: `${DOC}: Game route moments`,
    placed: { stage: [1], home: 9, sits: 'optional', attaches: 'after', badge: 'A small fist', level: 0, often: 'Once per run' } });
  // Changed: the doc's Potion is an in-battle healing item, which no event hands out (Kice's rule); she patches you up instead.
  s.entry('The Tough Junior', 'Junior Trainer Thomasina Stubbs: "I\'m tough. Ask anybody. Ask my mum."',
    [c('Battle.', battle('She is, in fact, quite tough.', foe('Junior Trainer Thomasina', { size: 2, levelBonus: 0, win: [heal(0.3), moment('Beat the toughest junior on the road.')], lose: [heal(0.5)] })))]);
}
{
  const s = space(E, { id: 'cs.kanto.route.fishing', town: 'route', name: 'The Fishing Contest', kind: 'EV', appears: 'route', flags: [], section: `${DOC}: Game route moments`,
    placed: { stage: [3, 4, 5], home: 10, sits: 'optional', attaches: 'after', badge: 'A hook', level: null, often: 'Once per run', tags: ['water'] } });
  s.entry('The Fishing Contest', 'Five anglers on a pier. Three casts; the biggest catch wins a Super Rod.',
    [c('Cast.', o('Yours is the biggest by a hand. A Super Rod.', item('super-rod'), moment('Won the fishing contest on the pier.')), { prompt: ['pull-hold', 'good'], fail: o('Yours is respectable, and not the biggest.') }), c('Watch.', o('You watch them fish until the light goes.'))],
    { remembers: [{ id: 'sprat', when: [is('kanto-sprat-taught')], notice: 'Mr. Sprat is the judge, and he pretends he\'s never seen you.' }] });
}
{
  const s = space(E, { id: 'cs.kanto.route.stone-seller', town: 'route', name: 'The Stone Seller', kind: 'SHOP', appears: 'route', flags: [], section: `${DOC}: Game route moments`,
    placed: { stage: [4, 5], home: 12, sits: 'optional', attaches: 'after', badge: 'A tray', level: null, often: 'Once per run' } });
  const tray = (suffix: string, price: number, intro: string) => {
    s.room(suffix, 'The Stone Seller', intro, [buy('Fire Stone', price, 'He wraps it in newspaper.', item('fire-stone')), buy('Water Stone', price, 'He wraps it in newspaper.', item('water-stone')), buy('Thunder Stone', price, 'He wraps it in newspaper.', item('thunder-stone')), c('The other stones.', o('He turns the tray round.', s.open(`${suffix}2`)))]);
    s.room(`${suffix}2`, 'The Stone Seller', intro, [buy('Leaf Stone', price, 'He wraps it in newspaper.', item('leaf-stone')), buy('Moon Stone', price, 'He wraps it in newspaper.', item('moon-stone')), c('No, thank you.', o('He never goes above the listed price. He tips his hat anyway.'))]);
  };
  tray('list', 2400, 'Stones at ×1.2: ₽2,400. He never goes above it.');
  tray('best', 1600, 'The best result: ×0.8, ₽1,600.');
  s.entry('The Stone Seller', 'A man with a tray. Stones at ×1.2. Haggle, with the Honest Trade Card: a three-step offer game. Best result: ×0.8. Worst: the listed price. He never goes above it.',
    [c('Haggle.', o('Three offers, three counter-offers, and he laughs and gives in.', s.open('best')), { prompt: ['gauge-hold', 'perfect'], fail: o('He holds firm at the listed price.', s.open('list')) }), c('Pay the listed price.', o('He turns the tray to you.', s.open('list'))), c('Walk on.', o('He doesn\'t call after you.'))]);
}
{
  const s = space(E, { id: 'cs.kanto.route.cycling', town: 'route', name: 'Cycling Road', kind: 'EV', appears: 'route', flags: [], section: `${DOC}: Game route moments`,
    placed: { stage: [5], home: 7, sits: 'optional', attaches: 'instead', badge: 'A bicycle', level: null, often: 'Once per run' } });
  s.entry('Cycling Road', 'A long hill down. A race against three Bikers: a lane-switching game.',
    [c('Race.', o('You win by a wheel. The Bike Voucher.', item('bike-voucher'), moment('Won the race down Cycling Road.')), { prompt: ['tilt-drag', 'good'], fail: o('They win, but only just. Biker, sneering anyway: "You haven\'t even got a bell."') }), c('Walk your bike down.', o('It takes a long time. The view is lovely.'))],
    { remembers: [{ id: 'owned', when: [has('bike-voucher')], hide: [0], addChoices: [c('Race.', o('You win by a wheel. A Quick Claw, since you already have the Voucher. Biker, losing: "You haven\'t even got a bell."', item('quick-claw')), { prompt: ['tilt-drag', 'good'], fail: o('Biker: "You haven\'t even got a bell."') })] }] });
}
{
  const s = space(E, { id: 'cs.kanto.route.biker-gang', town: 'route', name: 'The Biker Gang', kind: 'EV', appears: 'route', flags: [], section: `${DOC}: Game route moments`,
    placed: { stage: [5], home: 15, sits: 'optional', attaches: 'after', badge: 'A patch', level: 0, often: 'Once per run' } });
  s.entry('The Biker Gang', 'Six Bikers across the road, Rocket patches under their jackets.',
    [c('Battle all three pairs.', battle('Three battles.', foe('Biker Gang', { size: 2, chain: 3, levelBonus: 0, win: [{ kind: 'evil', heat: -1 }, moment('Beat the Biker Gang.')] }))),
      c('"Nice bikes."', o('Their leader, a woman called Big Dot, talks engines for ten minutes and lets you through. No Heat change.'))]);
}

export const REMOVE: string[] = [...retired(EVENTS), 'cs-kanto-indigo-cave', 'cs-kanto-indigo-cave-n1', 'cs-kanto-indigo-cave-n2'].sort();
export { SPACES, EXTRA };
