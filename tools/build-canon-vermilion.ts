// Beta 0.6 workstream 18: builds src/data/eventsCanonVermilion.json (the six Vermilion City canon spaces, section 5 of CANON_SPACES_KANTO.md)
// and the raid + item records they need. Run with `npm run data:canon-vermilion`. Every species, move and item id used is checked, so a typo fails here.
import { readFileSync, writeFileSync } from 'node:fs';

const read = (f: string) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'));
const species: any[] = read('species.json').species ?? Object.values(read('species.json'));
const moves: any[] = read('moves.json').moves ?? Object.values(read('moves.json'));
const catalog: any[] = [...read('itemCatalog.json'), ...Object.values(read('items.json'))];
const speciesById = new Map(species.map((s) => [s.id, s]));
const moveById = new Map(moves.map((m) => [m.id, m]));
const itemIds = new Set(catalog.map((i) => i.id));
itemIds.add('network-machine');
const sp = (id: string) => { if (!speciesById.has(id)) throw new Error(`unknown species ${id}`); return id; };
const item = (id: string) => { if (!itemIds.has(id)) throw new Error(`unknown item ${id}`); return id; };

const P = 'cs-kanto-vermilion-';
const TINT = '#2f5d73';
const GROUP = 'Canon Spaces: Kanto';
type Any = any;

const ev = (id: string, name: string, intro: string, choices: Any[], extra: Any = {}): Any => ({
  id: P + id, name, group: GROUP, stop: 'event', rarity: 'common', minStage: 1, types: [], requires: [],
  scene: { cast: [], effect: 'none', tint: TINT }, intro, choices, ...extra,
});
const room = (id: string, name: string, intro: string, choices: Any[], extra: Any = {}): Any => ev(id, name, intro, choices, { stop: 'delve', room: true, ...extra });
const add = (id: string) => ({ kind: 'addEvent', eventId: P + id });
const addFrom = (ids: string[]) => ({ kind: 'addEventFrom', ids: ids.map((i) => P + i) });
const flag = (key: string, amount = 1) => ({ kind: 'flag', key, amount });
const out = (text: string, effects: Any[] = [], battle?: Any) => ({ text, effects, ...(battle ? { battle } : {}) });
const pay = (price: number, effects: Any[]) => ({ requires: [{ kind: 'money', atLeast: price }], success: out('Sold.', [{ kind: 'money', amount: -price }, ...effects]) });
const choice = (label: string, success: Any, extra: Any = {}): Any => ({ label, ...extra, success });
const buy = (label: string, price: number, effects: Any[], text = 'Sold.'): Any => ({ label: `${label} (₽${price})`, requires: [{ kind: 'money', atLeast: price }], success: out(text, [{ kind: 'money', amount: -price }, ...effects]) });

const events: Any[] = [];
const bst = (s: Any) => Object.values(s.baseStats as Record<string, number>).reduce((a, b) => a + b, 0);

// ============================================================ 5.4 Flight North (mandatory check, then a Pseudo Stage)
const MOTTO = '"Prepare for trouble!" "Make it double!" A net falls over you, and the sky goes dark.';
events.push(ev('flight', 'Vermilion: Flight North',
  'A balloon shaped like a Meowth head drifts over the harbor. High above it, three voices clear their throats.',
  [choice('Keep walking', out('Just an advertisement. The balloon drifts out to sea.', []),
    { chance: 0.5, failure: out(`${MOTTO} You wake in a field with no Pokémon and no Poké Balls.`, [{ kind: 'stashParty' }, flag('kanto-flight-stolen'), add('flight-n1')]) })],
  { canon: 'cs.kanto.vermilion.flightnorth' }));

const bugs = {
  c: { name: 'Caterpie', line: ['caterpie', 'metapod', 'butterfree'], mega: 'Butterfree' },
  w: { name: 'Weedle', line: ['weedle', 'kakuna', 'beedrill'], mega: 'Beedrill' },
} as const;
const joinBug = (k: 'c' | 'w') => [{ kind: 'join', species: [sp(bugs[k].line[0])], level: 5, direct: true }, flag('kanto-flight-bug', k === 'c' ? 1 : 2)];
events.push(room('flight-n1', 'Flight North: The Bully', 'You wake in a field with nothing but the clothes you stand in. A Spearow screams out of the sky and dives at your head.', [
  choice('Cover your head', out('Something small and green drops on the Spearow. It flaps away, beaten. A Caterpie looks up at you.', [...joinBug('c'), add('flight-c2')]),
    { chance: 0.5, failure: out('A Weedle rams the Spearow from behind. It flaps away, beaten, and the little bug looks up at you.', [...joinBug('w'), add('flight-w2')]) }),
]));

// One line per Bug-type: levels run 5 -> 20 by the boss (the Bug-type is always the only Pokémon). Wild and trainer foes use fixed levels.
const wildPool = ['rattata', 'pidgey', 'spearow', 'nidoran-f', 'nidoran-m', 'oddish', 'bellsprout', 'zubat', 'geodude'].map(sp);
for (const k of ['c', 'w'] as const) {
  const [a, b, c] = bugs[k].line.map(sp);
  const n = (i: number) => `flight-${k}${i}`;
  const lvlUp = (amount: number) => ({ kind: 'levels', amount, who: 'lead' });
  events.push(room(n(2), 'Flight North: The Meadow', `The ${bugs[k].name} follows you into tall grass. Two small wild Pokémon are in the way. It will have to do the fighting.`, [
    choice('Fight', out('It squares up to the first one.', [], { kind: 'wild', species: wildPool, level: 5, chain: 2, pseudo: true, win: [lvlUp(3), add(n(3))] }))]));
  events.push(room(n(3), 'Flight North: Cocoon Night', 'Night falls. The little bug spins itself into a cocoon beside a fallen log. You sit up and keep watch until dawn.', [
    choice('Keep watch', out('At dawn the cocoon splits and it crawls out changed.', [{ kind: 'formChange', from: a, to: b }, lvlUp(2), { kind: 'heal', share: 1 }, add(n(4))]))]));
  events.push(room(n(4), 'Flight North: The Stream', 'A stream cuts the path. Something wet and angry is on the stepping stones.', [
    choice('Fight', out('Your bug braces on the stones.', [], { kind: 'wild', species: ['poliwag', 'magikarp', 'psyduck', 'tentacool'].map(sp), level: 10, pseudo: true, win: [lvlUp(3), add(n(5))] }))]));
  events.push(room(n(5), 'Flight North: Hatching', 'A flock of Pidgey takes off from a dead tree. Your bug feels it too. Something is about to change.', [
    choice('Stand together', out(`It sheds its shell and spreads new wings: ${species.find((s) => s.id === c)!.name}! The flock turns on it at once.`, [{ kind: 'formChange', from: b, to: c }, { kind: 'heal', share: 1 }], { kind: 'wild', species: [sp('pidgey')], level: 13, chain: 2, pseudo: true, win: [lvlUp(3), add(n(6))] }))]));
  events.push(room(n(6), "Flight North: The Trio's Camp", 'Smoke rises from a camp in a dry riverbed. Your Pokémon are in a cage beside the fire. A cat is guarding it, and it looks bored.', [
    choice('Slip in from the shadows', out('You send your bug in low and fast.', [], { kind: 'trainer', name: 'Meowth', team: ['meowth'].map(sp), level: 16, size: 1, pseudo: true, win: [lvlUp(2), add(n(7))] }))]));
  events.push(room(n(7), 'Flight North: The Venomoth', 'Jessie and James are on their feet. "Venomoth, go!" Your bug is the only one between them and the cage.', [
    // Evolution by love: a bug that has not reached its last form by now finishes evolving as the fight starts (formChange does nothing for a form it is not in).
    choice('Fight!', out('Your bug glows. It will not be left behind. It launches itself at the Venomoth!', [{ kind: 'formChange', from: a, to: c }, { kind: 'formChange', from: b, to: c }], {
      kind: 'trainer', name: 'Jessie & James', team: [sp('venomoth')], level: 20, size: 1, pseudo: true, rule: { shinyRescue: true },
      win: [add('flight-goodbye')],
    }))]));
}

events.push(room('flight-goodbye', 'Flight North: Goodbye', 'The Venomoth is down and the trio blasts off with a ping. A shiny copy of your bug rests on a branch and watches. You open the cage, and your own team spills out around you.', [
  choice('Say goodbye', out('Your bug flutters up beside its shiny twin. You wave. When you look again, only the sky is left.', [{ kind: 'restoreParty' }, flag('kanto-flight-gratitude')]))]));

// ============================================================ 5.2 Kaiju Tentacruel is a raid (data/raids.json); here only the Harbor Market that depends on it.
// ============================================================ 5.6 Harbor Market
const market = ev('market', 'Vermilion Harbor Market', 'Crates of salt fish, nets and glass floats. A stall sells anything that likes water.', [
  choice('Water-type goods', out('The stallkeeper pulls back a tarp.', [add('market-goods')])),
  choice("Harbor Hero's stock", out('The stallkeeper looks you over, then waves you to the back. "You, I trust."', [add('market-hero')]), { requires: [{ kind: 'flag', key: 'kanto-kaiju-won' }] }),
  buy('S.S. Anne Ticket (replacement)', 2000, [{ kind: 'item', id: item('ss-ticket') }], 'A stamped ticket. Do not lose it again.'),
  choice('Leave', out('You wave and move on.', [])),
], { canon: 'cs.kanto.vermilion.market', stop: 'merchant' });
events.push(market);
events.push(room('market-goods', 'Harbor Market: Water Goods', 'Everything on the table is damp.', [
  buy('Mystic Water', 900, [{ kind: 'item', id: item('mystic-water') }]),
  buy('Dive Ball ×5', 600, [{ kind: 'item', id: item('dive-ball'), count: 5 }]),
  buy('Splash Plate', 1500, [{ kind: 'item', id: item('splash-plate') }]),
  choice('Leave', out('You leave the table alone.', [])),
]));
events.push(room('market-hero', "Harbor Market: Hero's Stock", 'Under the counter: things the harbor keeps for the people who saved it.', [
  buy('Shell Bell', 1200, [{ kind: 'item', id: item('shell-bell') }]),
  buy('Big Pearl', 600, [{ kind: 'item', id: item('big-pearl') }]),
  buy('Sea Incense', 800, [{ kind: 'item', id: item('sea-incense') }]),
  choice('Leave', out('You leave the table alone.', [])),
]));

// ============================================================ 5.6 Diglett Port: The Fan Club Fish
events.push(ev('fishclub', 'Diglett Port: The Fan Club Fish', 'A fisher in a hat covered in fish badges waves a rod at you. "Fan Club rules! Strike the second the float dips, and I will teach you everything I know."', [
  choice('Take the rod', out('The float dips and you strike. The fisher cheers: a fine catch, and a fine rod to go with it.', [{ kind: 'item', id: item('good-rod') }, { kind: 'join', species: ['basculin', 'corphish'].map(sp) }]),
    { prompt: { id: 'shout-tap', needs: 'good' }, failure: out('The fish slips away. The fisher laughs and gives you the rod anyway: "Practice!"', [{ kind: 'item', id: item('good-rod') }, { kind: 'addStop', stop: 'fish' }]) }),
  choice('Just watch', out('You watch the Diglett pop up and down along the quay.', [{ kind: 'addStop', stop: 'fish' }])),
], { canon: 'cs.kanto.vermilion.fishclub', stop: 'fish' }));

// ============================================================ 5.3 Maiden's Peak (Pseudo Stage + market hub)
events.push(ev('maiden', "Maiden's Peak", 'Lanterns climb the hillside in rows. A bustling market fills the lower slope, and above it, a woman in a veil is walking up the steps. She glances back once.', [
  choice('Walk into the market', out('Stalls everywhere. The Tea House sits at the back.', [add('maiden-square-a')])),
  choice('Chase the veiled lady', out('You take the steps two at a time.', [add('maiden-n1')])),
], { canon: 'cs.kanto.vermilion.maiden', pseudo: true }));
const back = (to: string) => choice('Back to the square', out('You return to the crowd.', [add(to)]));
events.push(room('maiden-square-a', "Maiden's Peak: Market Square", 'A huge market: lanterns, shouting, crates of everything. Four lanes lead off the square.', [
  choice('Lantern Row (supplies, +10%)', out('Rows of paper lanterns and shelves of medicine.', [add('maiden-lantern')])),
  choice('TM Hall (pick a move)', out('A hall of glass cases, each with a labelled disc.', [addFrom(Array.from({ length: 8 }, (_, i) => `maiden-tm${i + 1}`))])),
  choice('Swap Alley (trading)', out('Traders call from every doorway.', [add('maiden-swap')])),
  choice('Further in', out('You push on deeper into the market.', [add('maiden-square-b')])),
]));
events.push(room('maiden-square-b', "Maiden's Peak: Back Lanes", 'The back lanes smell of tea and warm sugar.', [
  choice('Egg Row', out('Baskets of eggs line both walls.', [add('maiden-eggs')])),
  choice('The Tea House', out('A low door, a warm room.', [add('maiden-tea')])),
  choice('Chase the veiled lady', out('You hear a laugh somewhere above. You run.', [add('maiden-n1')])),
  back('maiden-square-a'),
]));
const price = (n: number) => Math.round(n * 1.1 / 10) * 10;
events.push(room('maiden-lantern', 'Lantern Row', 'Everything on Lantern Row costs a little extra, and is worth it.', [
  buy('Super Potion ×3', price(900), [{ kind: 'item', id: item('super-potion'), count: 3 }]),
  buy('Revive', price(1500), [{ kind: 'item', id: item('revive') }]),
  buy('Poké Ball ×10', price(1000), [{ kind: 'item', id: item('poke-ball'), count: 10 }]),
  back('maiden-square-a'),
]));

// TM Hall: 8 boards of 3 moves = the 24-move rotating board. The price follows the move's power.
const boards: [string, string[]][] = [
  ['Fire', ['flamethrower', 'fire-blast', 'overheat']], ['Water', ['surf', 'hydro-pump', 'scald']], ['Electric', ['thunderbolt', 'thunder', 'volt-switch']],
  ['Grass and Bug', ['energy-ball', 'giga-drain', 'x-scissor']], ['Ice and Dragon', ['ice-beam', 'blizzard', 'dragon-pulse']], ['Ground and Rock', ['earthquake', 'stone-edge', 'rock-slide']],
  ['Mind and Shadow', ['psychic', 'shadow-ball', 'dark-pulse']], ['Fighting and Steel', ['close-combat', 'aura-sphere', 'flash-cannon']],
];
boards.forEach(([name, ids], i) => {
  events.push(room(`maiden-tm${i + 1}`, `TM Hall: ${name} Board`, `Today the board shows the ${name} moves. The clerk taps a price card under each.`, [
    ...ids.map((id) => {
      const mv = moveById.get(id); if (!mv) throw new Error(`unknown move ${id}`);
      const cost = (mv.power ?? 0) >= 110 ? 2600 : (mv.power ?? 0) >= 90 ? 1800 : 1200;
      return buy(`TM ${mv.name}`, cost, [{ kind: 'teachMove', move: id, type: mv.type }], `The disc hums. ${mv.name} is taught on the spot.`);
    }),
    back('maiden-square-a'),
  ]));
});

// Swap Alley: three offers, each 1-for-1 within a base-stat-total range, random Nature.
const dexPool = species.filter((s) => s.tags.length === 0 && s.evolutionStage >= 1 && !/-(mega|gmax|primal)/.test(s.id) && !s.form).map((s) => s.id);
const swap = (label: string, bstRange: number) => choice(label, out('A handshake, a swap of Poké Balls, and the trader is gone into the crowd.', [{ kind: 'tradeFor', want: { label: 'a Pokémon of yours' }, similar: { pool: dexPool, bst: bstRange } }]));
events.push(room('maiden-swap', 'Swap Alley', 'Three traders hold up cards: what they will take, and roughly what they give.', [
  swap('Fair swap (similar strength)', 30), swap('Wide swap (a little further)', 70), swap('Gamble swap (anything goes)', 120), back('maiden-square-a'),
]));
events.push(room('maiden-eggs', 'Egg Row', 'Baskets of warm eggs, a hand-painted sign, and a very old man with a very serious face.', [
  buy('Buy a mystery Egg', 1500, [{ kind: 'egg', left: 3, unit: 'battle', origin: 'Event' }], 'It is warm in your hands.'),
  buy('Egg Move Tutor', 1000, [{ kind: 'eggMove' }], 'The old man whispers a secret to your lead.'),
  back('maiden-square-b'),
]));
events.push(room('maiden-tea', 'The Tea House', 'An old woman pours tea and talks without stopping. Every third sentence is about a lady in a veil.', [
  choice('Rest and drink', out('Your whole team sleeps like logs.', [{ kind: 'heal', share: 1 }])),
  choice('Listen to her stories', out('"She does not walk on stairs, dear. She walks between them." You write that down.', [{ kind: 'attribute', key: 'intelligence', amount: 1 }])),
  back('maiden-square-b'),
]));

// The chase: five sightings. The first three decide the Lady's Blessing (two correct turns); the clue in the text says which way to run.
const sightings: [string, string, 'left' | 'right'][] = [
  ['A Veil', 'A veil catches on the left railing and flutters toward the left stair. The right stair is empty and dark.', 'left'],
  ['A Lantern', 'A paper lantern is lit on the right and swings as if someone just brushed past. The left lane is cold.', 'right'],
  ['A Laugh', 'A laugh comes down the left lane, bright and close. Nothing at all comes from the right.', 'left'],
  ['A Footprint in Frost', 'Frost prints lead off to the right, small and bare. The left lane is warm and dry.', 'right'],
  ['A Reflection', 'In a still pool, a veiled figure waves from the left. The right side of the pool shows only you.', 'left'],
];
sightings.forEach(([name, text, correct], i) => {
  const nextId = i === 4 ? 'maiden-top' : `maiden-n${i + 2}`;
  const turn = (dir: 'left' | 'right') => choice(dir === 'left' ? 'Run left' : 'Run right', out(dir === correct ? 'Yes! You can hear her light steps just ahead.' : 'Nothing but empty air. You have lost ground.', [...(i < 3 && dir === correct ? [flag('kanto-maiden-turn')] : []), add(nextId)]));
  events.push(room(`maiden-n${i + 1}`, `Maiden's Peak: ${name}`, text, [turn('left'), turn('right')]));
});
const top = (label: string, text: string, effects: Any[], extra: Any = {}) => choice(label, out(text, effects), extra);
const bless = [{ kind: 'item', id: item('fairy-feather') }, { kind: 'addStop', stop: 'heal' }, flag('kanto-maiden-blessing')];
const turnsAtMost1 = { kind: 'flag', key: 'kanto-maiden-turn', atLeast: 0, atMost: 1 };
const turnsAtLeast2 = { kind: 'flag', key: 'kanto-maiden-turn', atLeast: 2 };
const hasZ = { kind: 'item', id: 'fairium-z' };
const zFx = [{ kind: 'item', id: item('fairium-z') }, flag('kanto-maiden-zcrystal')];
const hmFx = [{ kind: 'item', id: item('hm-fairy'), count: 3 }, flag('kanto-maiden-hms')];
events.push(room('maiden-top', "Maiden's Peak: The Summit", 'The last step. The lady stands at the edge of the lantern light with her back to you. She turns, smiles, and the wind takes her apart like smoke. Where she stood, something small and bright is left behind. (If you caught up with her by the lucky turns, she left more.)', [
  top('Take what she left', 'She is gone already. In the grass: a Z-Crystal humming with Fairy light, Fairium Z.', zFx, { requires: [turnsAtMost1] }),
  top("Take the Lady's gifts", 'She turned and knew you. Fairium Z, a Fairy Feather, and the Tea House lanterns light one by one below.', [...zFx, ...bless], { requires: [turnsAtLeast2] }),
  top('Take the Fairy HMs', 'You already hold her crystal, so she left three Fairy HMs instead.', hmFx, { requires: [hasZ, turnsAtMost1] }),
  top("Take the Lady's gifts (HMs)", 'She turned and knew you. Three Fairy HMs, a Fairy Feather, and the Tea House lanterns light one by one below.', [...hmFx, ...bless], { requires: [hasZ, turnsAtLeast2] }),
]));

// ============================================================ 5.1 S.S. Anne (12 nodes on 3 decks, every node a trainer fight + two trade offers)
const ssTable: Record<string, string> = {
  pikachu: 'raichu-alola', raichu: 'raichu-alola', rattata: 'rattata-alola', raticate: 'raticate-alola', sandshrew: 'sandshrew-alola', sandslash: 'sandslash-alola',
  vulpix: 'vulpix-alola', ninetales: 'ninetales-alola', diglett: 'diglett-alola', dugtrio: 'dugtrio-alola', meowth: 'meowth-alola', persian: 'persian-alola',
  geodude: 'geodude-alola', graveler: 'graveler-alola', golem: 'golem-alola', grimer: 'grimer-alola', muk: 'muk-alola', exeggcute: 'exeggutor-alola', exeggutor: 'exeggutor-alola',
  cubone: 'marowak-alola', marowak: 'marowak-alola', ponyta: 'ponyta-galar', rapidash: 'rapidash-galar', slowpoke: 'slowpoke-galar', slowbro: 'slowbro-galar',
  farfetchd: 'farfetchd-galar', koffing: 'weezing-galar', weezing: 'weezing-galar', 'mr-mime': 'mr-mime-galar', growlithe: 'growlithe-hisui', arcanine: 'arcanine-hisui',
  voltorb: 'voltorb-hisui', electrode: 'electrode-hisui', qwilfish: 'qwilfish-hisui',
};
for (const [a, b] of Object.entries(ssTable)) { sp(a); sp(b); }
const regionalPool = species.filter((s) => /-(alola|galar|hisui)$/.test(s.id) && s.tags.length === 0).map((s) => s.id);
const kantoPool = species.filter((s) => s.generation === 1 && s.tags.length === 0 && !s.form).map((s) => s.id);
const wantKeys = Object.keys(ssTable);
const decks = ['Lower Deck', 'Main Deck', 'Upper Deck'];
const sailorTypes: string[][] = [['water'], ['normal'], ['fighting'], ['water', 'flying'], ['normal', 'psychic'], ['electric'], ['water'], ['poison'], ['fire'], ['psychic', 'normal'], ['fighting', 'water'], ['normal', 'flying']];
const foeNames = ['Sailor', 'Fisherman', 'Black Belt', 'Swimmer', 'Gentleman', 'Engineer', 'Sailor', 'Biker', 'Burglar', 'Lady', 'Sailor', 'Gentleman'];
const nextAfter = (k: number) => (k === 12 ? 'ssanne-captain' : `ssanne-n${k + 1}`);
const optional = (k: number): [string, number] | null => (k === 7 ? ['ssanne-stow', 0.2] : k === 9 ? ['ssanne-duel', 0.3] : k === 10 ? ['ssanne-cup', 0.15] : null);
events.push(ev('ssanne', 'S.S. Anne', 'The ship\'s horn rolls over the harbor. A sailor at the gangway holds out his hand for your Ticket.', [
  choice('Hand over the Ticket and board', out('"Welcome aboard!" The gangway creaks under your feet.', [add('ssanne-n1')])),
  choice('Not today', out('You step back from the gangway.', [])),
], { canon: 'cs.kanto.vermilion.ssanne', pseudo: true }));
for (let k = 1; k <= 12; k++) {
  const deck = decks[Math.floor((k - 1) / 4)]!;
  const levelBonus = 1 + Math.floor((k - 1) / 4);
  const afterTrade = k === 3 ? 'ssanne-galley' : null;
  const next = nextAfter(k);
  const routeNext = (): Any => {
    const o = optional(k + 1);
    if (!o || k === 12) return add(next);
    const slots = 20; const n = Math.round(o[1] * slots);
    return addFrom([...Array(n).fill(o[0]), ...Array(slots - n).fill(next)]);
  };
  events.push(room(`ssanne-n${k}`, `S.S. Anne: ${deck}, Cabin ${k}`, `${deck}. A ${foeNames[k - 1]!.toLowerCase()} blocks the corridor. "Nobody gets past without a battle."`, [
    choice('Battle', out('The ship rocks gently.', [], { kind: 'trainer', name: foeNames[k - 1], size: k <= 4 ? 2 : k <= 8 ? 3 : 4, types: sailorTypes[k - 1], levelBonus, pseudo: true, win: [add(`ssanne-t${k}`)] }))]));
  const onward = afterTrade ? add(afterTrade) : routeNext();
  events.push(room(`ssanne-t${k}`, `S.S. Anne: Trade Offers ${k}`, `After the fight, two passengers lean out of their doors with Poké Balls in their hands.`, [
    choice('Trade A: a Kanto Pokémon of similar strength', out('Even trade. The passenger hands over a new friend.', [{ kind: 'tradeFor', want: { label: 'a Pokémon of yours' }, similar: { pool: kantoPool, bst: 40 } }, onward])),
    choice('Trade B: the region trade', out('"Oh, a lovely one! I have just the thing." Same level, kept item.', [{ kind: 'tradeFor', want: { label: 'a Pokémon with a regional form', species: wantKeys }, table: ssTable }, onward])),
    choice('Trade B: any Pokémon for a regional one', out('"Anything will do. Here, take this one."', [{ kind: 'tradeFor', want: { label: 'a Pokémon of yours' }, similar: { pool: regionalPool, bst: 200 } }, onward])),
    choice('Move on', out('You wave and keep walking.', [onward])),
  ]));
}
const mealFx: Any[][] = [
  [{ kind: 'damageMultiplier', value: 1.1 }], [{ kind: 'statMultiplier', stat: 'spe', value: 1.1 }], [{ kind: 'damageTakenMultiplier', value: 0.9 }],
  [{ kind: 'critChanceBonus', value: 0.1 }], [{ kind: 'xpMultiplier', value: 1.25 }],
];
const mealNames = ['Spicy Curry', 'Citrus Salad', 'Hearty Stew', 'Grilled Fish', 'Sweet Dumplings'];
events.push(room('ssanne-galley', 'S.S. Anne: The Galley', 'The ship\'s chef waves a ladle. "Sit, sit! I will feed you something special."', [choice('Sit down', out('He disappears into the steam.', [addFrom(mealNames.map((_, i) => `ssanne-meal${i + 1}`))]))]));
mealNames.forEach((m, i) => events.push(room(`ssanne-meal${i + 1}`, `S.S. Anne: ${m}`, `The chef serves ${m.toLowerCase()}. It smells amazing.`, [
  choice('Eat up', out(`Delicious. Your team is healed and feels ready for anything.`, [{ kind: 'heal', share: 0.5 }, { kind: 'tempEffect', label: m, effects: mealFx[i], battles: 3, until: 'battle' }, add('ssanne-n4')]))])));
// Stowaways (node 7, 20%), the Passenger Duel (node 9, 30%) and the Pokémon Cup (node 10, 15%).
events.push(room('ssanne-stow', 'S.S. Anne: The Stowaways', 'A barrel in the corner is humming "Prepare for trouble". The lid pops off: Jessie, James and a very flustered Meowth.', [
  choice('Battle the trio', out('"Surprise!"', [], { kind: 'trainer', name: 'Jessie & James', format: 'doubles', size: 2, evil: 'grunt', evilTeam: 'rocket-remnants', levelBonus: 1, pseudo: true, win: [{ kind: 'attribute', key: 'intelligence', amount: 1 }, { kind: 'evil', heat: 1 }, flag('kanto-ssanne-stowaways'), add('ssanne-n7')] }))]));
events.push(room('ssanne-duel', 'S.S. Anne: The Passenger Duel', 'A rich passenger in a white suit flips a coin onto the table. "Two against two. The stakes are a Premium Ball. Interested?"', [
  choice('Accept', out('He smiles. "Excellent."', [], { kind: 'trainer', name: 'Rich Passenger', format: 'doubles', size: 2, types: ['normal', 'psychic'], levelBonus: 3, pseudo: true, win: [{ kind: 'item', id: item('premier-ball'), count: 3 }, add('ssanne-n9')] })),
  choice('Decline', out('You tip an imaginary hat.', [add('ssanne-n9')])),
]));
events.push(room('ssanne-cup', 'S.S. Anne: The Pokémon Cup', 'The deck has been cleared for a tournament: three rounds, one winner, and a Rare Candy on a velvet cushion.', [
  choice('Enter the cup', out('Round one.', [], { kind: 'trainer', name: 'Cup Challenger', size: 2, levelBonus: 2, chain: 3, chainHeal: 0.2, pseudo: true, win: [{ kind: 'item', id: item('rare-candy') }, add('ssanne-n10')] })),
  choice('Watch from the rail', out('The crowd roars.', [add('ssanne-n10')])),
]));
// The Captain, then the rival at the gangway, then the Network Machine.
events.push(room('ssanne-captain', 'S.S. Anne: The Captain', 'The captain lies in his cabin, green around the gills. "Please... my back."', [
  choice('Rub his back', out('He sighs. "That is much better. Take this, with my thanks."', [{ kind: 'heal', share: 0.3 }, add('ssanne-rival')]),
    { prompt: { id: 'gauge-hold', needs: 'ok' }, failure: out('You press too hard. He yelps, then laughs and waves you toward the gangway.', [add('ssanne-rival')]) }),
]));
events.push(room('ssanne-rival', 'S.S. Anne: The Rival on the Gangway', 'On the way off the ship, someone steps into the sun in front of you. Your rival, arms folded. "You did not think I would let you leave without a battle?"', [
  choice('Fight', out('A full battle on the open deck.', [], { kind: 'trainer', name: 'Rival', rival: true, size: 4, levelBonus: 3, pseudo: true, win: [add('ssanne-reward')] }))]));
events.push(room('ssanne-reward', 'S.S. Anne: The Network Machine', 'The captain, a little less green, sends a deckhand running after you with a box. A single-use machine that can teach one Pokémon any move it could ever learn.', [
  choice('Take it', out('You hold the Network Machine. It is warm, and humming.', [{ kind: 'item', id: item('network-machine') }, flag('kanto-ssanne-done'), flag('kanto-ssanne-machine')]))]));

writeFileSync(new URL('../src/data/eventsCanonVermilion.json', import.meta.url), JSON.stringify({ events }, null, 1) + '\n');
console.log(`canon vermilion: ${events.length} events`);
