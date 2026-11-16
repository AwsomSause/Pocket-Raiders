// Greenneedle, part 9: gn.39 The Travelling Pokémon Market (doc GREENNEEDLE_REWORKED_PLACED_9.md).
// Build: npm run co:build -- greenneedle-9   then   npm run co:gn
import { any, ch, egg, fight, flag, item, out, trade, wild, type Json } from '../dsl.ts';
import { anyFlag } from './_ne.ts';
import { chIf, exactly, gev, gn, is, not, notThisRegion, pick, rm, say, scene, setTo, stampRegion, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

// =====================================================================================================================
// gn.39  THE TRAVELLING POKÉMON MARKET  (Hub Destination at a Town node; until towns exist, step 10, optional; once per region, every region).
// A walkable ring of wagons: seven stalls (three lots each, new stock every appearance), three conditional stalls, and the vendors'
// memory (core/greenneedle/market.ts): 10% off after a purchase, 15% and a held-back lot after three, "out of stock" for one appearance
// after two offers below the floor. Carmela and Tanager undercut each other when told the other's price.
// =====================================================================================================================
const MARKET_TINT = '#5a4630';
const wagons = (o: Json = {}): Json => ({ tint: MARKET_TINT, tags: ['Shop', 'Story'], effect: 'none', ...o });
const fmt = (n: number): string => `₽${n.toLocaleString('en-GB')}`;
type V = 'carmela' | 'tanager' | 'dace' | 'nan' | 'hooded' | 'josune';
const NAME: Record<V, string> = { carmela: 'Carmela', tanager: 'Tanager', dace: 'the Dace sisters', nan: 'Nan Okafor', hooded: 'The hooded stallholder', josune: 'Josune' };
const RIVAL: Partial<Record<V, string>> = { carmela: 'Tanager', tanager: 'Carmela' };
const RING = ['gn-39-ring', 'gn-39-ring-2', 'gn-39-ring-3', 'gn-39-back'];
const toRing = (n = 0, label = 'Back to the ring.'): Json => ch(label, out('Back into the ring of wagons. Somebody is frying dough. Somebody is always frying dough.', scene(RING[n]!)));
const loyal = (v: V, n: number): Json => is(`market-${v}-bought`, n);

interface Lot { id: string; name: string; price: number; give: Json[]; blurb: string }
/** One lot: "Pay the price." / "Offer less." / "Walk away." (and, at the two rivals' stalls, the other's price). */
function lotRooms(v: V, stall: string, lot: Lot): Json[] {
  const id = `${stall}-${lot.id}`;
  const back = (text: string): Json => out(text, scene(stall));
  const buy = (o: Json): Json => gn('marketBuy', { key: v, n: lot.price, then: [...lot.give, ...(v === 'tanager' ? [any('oran-berry', 'sitrus-berry', 'lum-berry')] : []), scene(stall)], ...o });
  const pay = ch('Pay the price.', out(v === 'tanager' ? 'He beams, and drops a Berry in with it, because you didn\'t haggle. "I like you."' : 'Coins on the counter. The lot is yours.', buy({})));
  const choices: Json[] = [
    pay,
    ch('Offer less.', out('You make a face at the price. They make a face back.', scene(`${id}-haggle`))),
    ch('Walk away.', back('You put it down. They watch you go, the way a fisherman watches a fish that\'ll be back.')),
  ];
  if (RIVAL[v]) choices.push(ch(`Mention ${RIVAL[v]}'s price.`, out(`"${RIVAL[v]}'s got one for less."`, gn('marketUndercut', { key: v, n: lot.price }), scene(id))));
  const remembers: Json[] = [
    { id: 'honest-took', when: [is('honest-took')], notice: '*Word has travelled from the shop with no shopkeeper. They count your change twice, and there\'s no haggling with you at all.*', hide: RIVAL[v] ? [1, 3] : [1] },
  ];
  if (RIVAL[v]) remembers.push({ id: 'caught', when: [is('market-rivals-caught')], notice: '**Both, from behind one stall:** "Full price. For a month."', hide: [3] });
  const haggle = [90, 78, 70].map((pct) => ch(`Offer ${fmt(Math.round((lot.price * pct) / 100))}.`, out('You name it.', gn('marketOffer', { key: v, n: lot.price, min: pct, type: id, then: [...lot.give, scene(stall)] }))));
  return [
    rm(id, lot.name, wagons({ remembers }), say(lot.blurb, `The asking price: **${fmt(lot.price)}**.`), choices),
    rm(`${id}-haggle`, `${lot.name}: Haggling`, wagons({ remembers: [{ id: 'honest-shop', when: [is('honest-shop')], notice: '*Word has travelled from the shop with no shopkeeper. The wince comes later than it used to.*' }] }), say(
      'You think of a number. They watch your mouth.',
      `At ${fmt(Math.round(lot.price * 0.9))}, nothing. At ${fmt(Math.round(lot.price * 0.78))}, a wince. At ${fmt(Math.round(lot.price * 0.7))}, they stop breathing.`,
    ), [...haggle, ch('Walk away.', back('You put your money away. Their face goes back to normal.'))]),
  ];
}

/** A stall: three lots and the way back. Out of stock: nothing for you this time. Three purchases: the held-back lot. */
function stall(v: V, id: string, name: string, intro: string, lots: Lot[], held: Lot | null, ring: number, extra: Json[] = [], first: Json[] = []): Json[] {
  const choices: Json[] = [...lots.map((l) => ch(`${l.name} (${fmt(l.price)}).`, out(l.blurb.split('.')[0] + '.', scene(`${id}-${l.id}`)))), ...extra, toRing(ring)];
  const lotIdx = lots.map((_, i) => i);
  const remembers: Json[] = [
    { id: 'out', when: [is(`market-${v}-out`)], notice: '*Out of stock.* The stall\'s open. There\'s nothing on it for you.', hide: lotIdx },
    ...first.map((x) => ({ ...x, hide: lotIdx })),
  ];
  if (held) remembers.push({ id: 'regular', when: [loyal(v, 3)], notice: `*Fifteen off for you, a regular. And from under the counter, a lot they've held back.*`, hide: [choices.length - 1],
    addChoices: [ch(`${held.name} (${fmt(held.price)}).`, out('From under the counter.', scene(`${id}-${held.id}`)))] });
  remembers.push({ id: 'known', when: [loyal(v, 1)], notice: '*They know your face now. Ten off.*' });
  return [rm(id, name, wagons({ remembers }), intro, choices), ...[...lots, ...(held ? [held] : [])].flatMap((l) => lotRooms(v, id, l))];
}

// ---- The stock, by appearance (1, 2, 3, then round again). ----
const stone = (id: string, name: string, price: number, blurb: string): Lot => ({ id, name, price, give: [item(id)], blurb });
const STONES: { lots: Lot[]; held: Lot }[] = [
  { lots: [stone('leaf-stone', 'Leaf Stone', 800, 'A green stone with a leaf inside, like a fly in amber. She weighs it in her palm first.'), stone('fire-stone', 'Fire Stone', 800, 'Warm, even in the shade. She weighs it and nods to herself.'), stone('moon-stone', 'Moon Stone', 1000, 'Dull by day. She cups it to show you the glow.')],
    held: stone('shiny-stone', 'Shiny Stone', 1500, 'Wrapped in a handkerchief. It makes the handkerchief look grey.') },
  { lots: [stone('water-stone', 'Water Stone', 800, 'Blue all the way through, and cold. She weighs it twice.'), stone('thunder-stone', 'Thunder Stone', 800, 'It makes the hair on your arm stand up. She holds it with gloves.'), stone('dusk-stone', 'Dusk Stone', 1200, 'Darker than its own shadow. She weighs it and won\'t meet its eye.')],
    held: stone('dawn-stone', 'Dawn Stone', 1500, 'It catches a light that isn\'t there yet.') },
  { lots: [stone('sun-stone', 'Sun Stone', 1000, 'Orange, warm, and heavier than it looks. She weighs it like bread.'), stone('ice-stone', 'Ice Stone', 900, 'It frosts her fingertips. She puts it down quickly.'), stone('leaf-stone', 'Leaf Stone', 800, 'A green stone with a leaf in it. "Last one this side of the river."')],
    held: stone('shiny-stone', 'Shiny Stone', 1500, 'Wrapped in a handkerchief. It makes the handkerchief look grey.') },
];
const helditem = (id: string, name: string, price: number, blurb: string): Lot => ({ id, name, price, give: [item(id)], blurb });
const HELD: { lots: Lot[]; held: Lot }[] = [
  { lots: [helditem('quick-claw', 'Quick Claw', 600, 'A curved claw on a cord. "Fast. Not always. Mostly. Sometimes."'), helditem('scope-lens', 'Scope Lens', 900, 'A lens that makes everything look like a target. He talks about it for a long time.'), helditem('leftovers', 'Leftovers', 1800, 'Half an apple, kept fresh forever. He apologises for how it looks, then explains it, then apologises again.')],
    held: helditem('life-orb', 'Life Orb', 2500, 'A red orb that pulses like a heart. "It hurts to hold. I\'m told that\'s the point."') },
  { lots: [helditem('kings-rock', 'King\'s Rock', 700, 'A little crown of stone. "Makes them flinch. Don\'t ask me how. People ask me how."'), helditem('shell-bell', 'Shell Bell', 900, 'It rings when it\'s hit. "Heals a bit. Pretty sound, too, isn\'t it? Isn\'t it."'), helditem('expert-belt', 'Expert Belt', 1600, 'A worn belt. "For hitting where it hurts. Belonged to an expert. Probably."')],
    held: helditem('choice-scarf', 'Choice Scarf', 2800, 'A long scarf. "Fast. Very. One move only, though. People forget. Then they write to me."') },
  { lots: [helditem('bright-powder', 'Bright Powder', 700, 'A twist of glittering powder. "Hard to hit. Gets everywhere. Everywhere."'), helditem('muscle-band', 'Muscle Band', 900, 'A sweatband. "Stronger hits. Washed. Mostly."'), helditem('focus-sash', 'Focus Sash', 1500, 'A white sash. "One hit that should\'ve finished them, doesn\'t. Once."')],
    held: helditem('assault-vest', 'Assault Vest', 2800, 'A padded vest. "Takes special hits like nothing. No status moves in it. I tried."') },
];
const tm = (move: string, name: string, type: string, power: number): Lot => ({ id: `tm-${move}`, name: `TM ${name}`, price: power * 20, give: [{ kind: 'teachMove', move, type }], blurb: `${name}. "${['Two', 'Three'][power % 2]} hundred uses left," says one sister. "At least," says the other.` });
const TMS: { lots: Lot[]; held: Lot }[] = [
  { lots: [tm('thunderbolt', 'Thunderbolt', 'electric', 90), tm('ice-beam', 'Ice Beam', 'ice', 90), tm('flamethrower', 'Flamethrower', 'fire', 90), tm('earthquake', 'Earthquake', 'ground', 100)], held: tm('close-combat', 'Close Combat', 'fighting', 120) },
  { lots: [tm('surf', 'Surf', 'water', 90), tm('psychic', 'Psychic', 'psychic', 90), tm('shadow-ball', 'Shadow Ball', 'ghost', 80), tm('energy-ball', 'Energy Ball', 'grass', 90)], held: tm('outrage', 'Outrage', 'dragon', 120) },
  { lots: [tm('dark-pulse', 'Dark Pulse', 'dark', 80), tm('dragon-pulse', 'Dragon Pulse', 'dragon', 85), tm('flash-cannon', 'Flash Cannon', 'steel', 80), tm('dazzling-gleam', 'Dazzling Gleam', 'fairy', 80)], held: tm('brave-bird', 'Brave Bird', 'flying', 120) },
];
const eggLot = (id: string, name: string, price: number, species: string[] | null, blurb: string): Lot => ({ id, name, price, give: [egg(species ? { species } : {})], blurb });
const EGGS: { lots: Lot[]; held: Lot }[] = [
  { lots: [eggLot('egg-shown', 'The Spotted Egg', 1200, ['eevee'], 'A cream egg with brown spots. "Eevee," says Nan. "I\'d stake my name on it."'), eggLot('egg-hidden', 'The Plain Egg', 800, null, 'An egg with no marks at all. "No idea," says Nan, cheerfully. "That\'s the fun."')],
    held: eggLot('egg-dratini', 'The Blue Egg', 2500, ['dratini'], 'An egg the colour of deep water, in a nest of straw. "I don\'t show this one to just anyone."') },
  { lots: [eggLot('egg-shown', 'The Patterned Egg', 1200, ['togepi'], 'An egg with red and blue triangles. "Togepi. You can tell by the triangles."'), eggLot('egg-hidden', 'The Warm Egg', 800, null, 'A plain egg, very warm. "Something lively," says Nan. "Beyond that, your guess."')],
    held: eggLot('egg-larvitar', 'The Heavy Egg', 2500, ['larvitar'], 'An egg as heavy as a stone. "It eats rock when it hatches. Keep it off the floor."') },
  { lots: [eggLot('egg-shown', 'The Ringed Egg', 1200, ['riolu'], 'A blue egg with a black ring. "Riolu. It\'ll know how you feel before you do."'), eggLot('egg-hidden', 'The Speckled Egg', 800, null, 'A speckled egg. "Someone left it at my wagon. I don\'t ask."')],
    held: eggLot('egg-beldum', 'The Metal Egg', 2500, ['beldum'], 'An egg that rings faintly when you tap it. "Don\'t tap it."') },
];
/** The hooded stallholder's parcels: what can be inside, and the odds, are on a card. */
const parcel = (id: string, name: string, price: number, card: string, table: [number, Json[]][]): Lot => ({
  id, name, price, blurb: `${name.split(' (')[0]}, sealed. The card: ${card}`,
  give: [pick(`market-parcel-${id}`, ...table.map(([w]) => w)), ...table.map(([, fx], i) => when(`market-parcel-${id}`, { min: i + 1, max: i + 1 }, fx))],
});
const PARCELS: Lot[] = [
  parcel('small', 'A Small Parcel', 400, 'Super Potion ×2, 50%. Great Ball ×3, 30%. Rare Candy, 15%. Star Piece, 5%.', [[50, [item('super-potion', 2)]], [30, [item('great-ball', 3)]], [15, [item('rare-candy')]], [5, [item('star-piece')]]]),
  parcel('large', 'A Large Parcel', 900, 'Hyper Potion ×2, 40%. Ultra Ball ×2, 30%. A held item, 20%. Rare Candy ×2, 10%.', [[40, [item('hyper-potion', 2)]], [30, [item('ultra-ball', 2)]], [20, [any('quick-claw', 'scope-lens', 'kings-rock', 'shell-bell', 'bright-powder', 'muscle-band')]], [10, [item('rare-candy', 2)]]]),
  parcel('crate', 'A Sealed Crate', 2000, 'Rare Candy ×2, 50%. Ability Capsule, 30%. HP Up and Protein, 15%. Comet Shard, 5%.', [[50, [item('rare-candy', 2)]], [30, [item('ability-capsule')]], [15, [item('hp-up'), item('protein')]], [5, [item('comet-shard')]]]),
];
const SEALED = parcel('sealed', 'A Parcel With a Wax Seal', 1500, 'Life Orb, Choice Band or Choice Specs, 60%. Ability Capsule, 40%.', [[60, [any('life-orb', 'choice-band', 'choice-specs')]], [40, [item('ability-capsule')]]]);

/** The stalls whose stock turns with the appearance: one room per stock, picked on the way in. */
const byStock = (base: string): Json[] => [1, 2, 3].map((n) => when('market-stock', { min: n, max: n }, [scene(`${base}-${n}`)]));

const TEAMS = ['rocket', 'aqua', 'magma', 'galactic', 'plasma', 'flare', 'skull', 'aether', 'yell', 'star', 'marauders', 'choir', 'ironvein', 'cartographers', 'wildfire', 'gilt', 'cipher', 'rocket-remnants', 'snagem'];
/** An evil-team win (any Operation stopped), checked eight teams at a time. */
const VET_CHECK: Json[] = [0, 1, 2].map((i) => gn('check', { key: `market-vet-${i + 1}`, if: [anyFlag(...TEAMS.slice(i * 8, i * 8 + 8).map((t) => `team-${t}-op-stopped`))] }));
const FOSSIL_MONS = ['omanyte', 'kabuto', 'aerodactyl', 'lileep', 'anorith', 'cranidos', 'shieldon', 'tirtouga', 'archen', 'tyrunt', 'amaura'];
const GEMS = ['normal-gem', 'fire-gem', 'water-gem', 'grass-gem', 'electric-gem', 'ice-gem', 'fighting-gem', 'poison-gem', 'ground-gem', 'flying-gem', 'psychic-gem', 'bug-gem', 'rock-gem', 'ghost-gem', 'dragon-gem', 'dark-gem', 'steel-gem', 'fairy-gem'];
/** The Sableye's slate: its rates this appearance (made up, written down, honest after that). */
const SLATE = ['3 Poké Balls for a gem. 1 Great Ball for a gem. 1 Ultra Ball for 2 gems.', '2 Poké Balls for a gem. 1 Great Ball for 2 gems. 1 Ultra Ball for 2 gems.', '4 Poké Balls for a gem. 1 Great Ball for a gem. 1 Ultra Ball for 3 gems.'];
const RATES: [number, number, number][] = [[3, 1, 2], [2, 2, 2], [4, 1, 3]];
const gemTrade = (ball: string, label: string, idx: 0 | 1 | 2): Json => ch(label, out('It takes them one by one, bites each to be sure, and pays from the tray.',
  ...[1, 2, 3].map((s) => when('market-slate', { min: s, max: s }, idx === 0
    ? [{ kind: 'loseItem', id: ball, count: RATES[s - 1]![0] }, any(...GEMS)]
    : [{ kind: 'loseItem', id: ball, count: 1 }, ...Array.from({ length: RATES[s - 1]![idx] }, () => any(...GEMS))])),
  scene('gn-39-night')), { requires: [{ kind: 'item', id: ball, count: idx === 0 ? 4 : 1 }] });

const VETERAN: Lot[] = [
  { id: 'vet-band', name: 'A Choice Band, Grunt-issue', price: 1800, give: [item('choice-band')], blurb: 'A Choice Band with the logo picked off. "Hits like a truck. One move, though. You\'re locked in. Like the job."' },
  { id: 'vet-orb', name: 'A Flame Orb, from the lockers', price: 900, give: [item('flame-orb')], blurb: 'A Flame Orb in a sock. "Burns whoever holds it. Some of ours liked that. Don\'t ask."' },
  { id: 'vet-barb', name: 'A Sticky Barb', price: 400, give: [item('sticky-barb')], blurb: 'A Sticky Barb in a jar. "Hurts the holder. Jumps to whoever touches it. We used to put them in the new lads\' bunks."' },
];

const gn39: Json[] = [
  gev('gn-39-door', 'The Travelling Pokémon Market', wagons({ stop: 'event', rarity: 'common', requires: [notThisRegion('market-region')] }), say(
    '*Wagons in a ring. Awnings going up. A smell of frying dough and lamp oil.*',
    '**Market warden, Old Wicker:** "We go where the roads are good. Stock\'s different every stop. The faces aren\'t. Mind who you haggle with; they talk."',
  ), [
    ch('Walk into the ring.', out('Old Wicker lifts a rope for you, and lets it fall behind you.', stampRegion('market-region'), gn('marketArrive'), pick('market-slate', 1, 1, 1), flag('market-visited'),
      when('market-story', { min: 1, max: 1 }, [], 'Carmela and Tanager aren\'t speaking.'),
      when('market-story', { min: 2, max: 2 }, [], 'Carmela and Tanager aren\'t speaking, loudly. Their awnings have moved closer.'),
      when('market-story', { min: 3, max: 3 }, [], 'One stall where there were two. Both names on the sign. Still arguing.'),
      scene('gn-39-ring'))),
    ch('Walk on.', out('Behind you, someone starts a song about a road. Everyone knows the words but you.')),
  ]),
  rm('gn-39-ring', 'The Market: The Near Wagons', wagons({ remembers: [
    { id: 'sign', when: [is('market-story', 3), is('market-rivals-run', 2)], notice: 'The sign over the joint stall reads: *OKAFOR-LYLE & TANAGER. NO, WE WON\'T MATCH EACH OTHER\'S PRICES.*' },
    { id: 'joint', when: [is('market-story', 3)], notice: 'Carmela\'s stones and Tanager\'s held items share one long table now, with a chalk line down the middle that neither of them has crossed.', hide: [1] },
  ] }), say(
    'The near wagons: Carmela Okafor-Lyle\'s stones, Mr. Alban Tanager\'s held items, and the Dace sisters\' long table of discs.',
    'Further round, more awnings, and the smell of the dough.',
  ), [
    ch('Evolution Stones.', out('Carmela looks up.', ...byStock('gn-39-carmela'))),
    ch('Held Items.', out('Tanager is already talking.', ...byStock('gn-39-tanager'))),
    ch('TMs.', out('"Morning," says one Dace sister. "Morning," says the other.', ...byStock('gn-39-dace'))),
    ch('Further round the ring.', out('Past a wagon selling rope, and a wagon selling nothing but bells.', scene('gn-39-ring-2'))),
  ]),
  rm('gn-39-ring-2', 'The Market: The Far Wagons', wagons({ remembers: [
    { id: 'farfetchd', when: [anyFlag('balthasar-placed', 'balthasar-bell')], notice: 'Your Farfetch\'d is recognised. Three vendors come out from behind their stalls, wiping their hands, to say hello to it. "Balthasar\'s," says one. "He\'d be glad."' },
    { id: 'took', when: [is('honest-took')], notice: '*Word has travelled from the shop with no shopkeeper. Every vendor here counts your change twice.*' },
    { id: 'shop', when: [is('honest-shop')], notice: '*Word has travelled from the shop with no shopkeeper. People here smile at you a moment longer.*' },
  ] }), say(
    'The far wagons: Ivo Ternary\'s trading table, Nan Okafor\'s nest of eggs under a quilt, and a stall with a hooded figure and a stack of parcels.',
  ), [
    ch('Trades.', out('Ivo looks up from his ledger. "Fair to a fault," says the sign. He\'s written it himself.', ...byStock('gn-39-ivo'))),
    ch('Eggs.', out('Nan lifts the quilt. "Now. Where will it be kept?"', ...byStock('gn-39-nan'))),
    ch('Mystery Items.', out('The hooded stallholder says nothing. It points at the card.', ...byStock('gn-39-hooded'))),
    ch('On round the ring.', out('Round the ring, where the wagons are older.', scene('gn-39-ring-3'))),
  ]),
  rm('gn-39-ring-3', 'The Market: The Pens', wagons(), say(
    'The pens, at the end of the ring. Josune Arregi\'s wagon has a pen with one Pokémon in it, and a sign: MEET IT. BATTLE IT. CATCH IT. FEE FOR THE MEETING.',
  ), [
    ch('Rare Encounters.', out('Josune nods at the pen.', scene('gn-39-josune'))),
    chIf([{ kind: 'period', in: ['night'] }], 'The Night Stall.', out('Behind the last wagon, a lantern, and a small grinning shape behind a tray.', scene('gn-39-night'))),
    ch('Behind the wagons.', out('The back of the market, where the vendors keep their own things.', gn('partyHas', { key: 'market-fossil', species: FOSSIL_MONS }), ...VET_CHECK, scene('gn-39-back'))),
    ch('Leave the market.', out('Old Wicker lifts the rope. "Next region," he says. "Same faces."', flag('market-left'))),
  ]),
  rm('gn-39-back', 'The Market: Behind the Wagons', wagons(), 'Behind the wagons: washing lines, a dog asleep under a cart, two tables nobody\'s advertising.', [
    chIf([is('market-fossil')], 'The Fossil Stall.', out('Two people at one table, arguing about a price card.', scene('gn-39-fossil'))),
    chIf([anyFlag('market-vet-1', 'market-vet-2', 'market-vet-3')], 'The Veteran\'s Stall.', out('A man in half a uniform, selling the other half.', scene('gn-39-veteran'))),
    chIf([not('market-found')], 'Something in the mud by a wheel.', out('You pick it up and wipe it off. You know whose it is.', flag('market-found'),
      when('market-stock', { min: 1, max: 1 }, [], 'Carmela\'s loupe, the one she weighs stones by eye with. She snatches it, then catches herself, and thanks you properly.'),
      when('market-stock', { min: 2, max: 2 }, [], 'Tanager\'s ledger. He goes white, then red, then hugs you, which neither of you expected.'),
      when('market-stock', { min: 3, max: 3 }, [], 'Nan Okafor\'s egg thermometer. "I\'ve been checking them by hand all day," she says. "My hands are very tired."'),
      when('market-stock', { min: 1, max: 1 }, [when('market-carmela-gift', { min: 0, max: 0 }, [item('moon-stone'), setTo('market-carmela-gift', 1)], '"For your trouble." A Moon Stone, no charge.')]),
      when('market-stock', { min: 2, max: 2 }, [when('market-tanager-gift', { min: 0, max: 0 }, [item('leftovers'), setTo('market-tanager-gift', 1)], '"Take it. Take it! I insist." Leftovers, no charge.')]),
      when('market-stock', { min: 3, max: 3 }, [when('market-nan-gift', { min: 0, max: 0 }, [egg({}), setTo('market-nan-gift', 1)], '"This one\'s yours. No, no money. Keep it warm."')]),
    )),
    toRing(0),
  ]),
  // ---- Carmela, Tanager, the Dace sisters, Nan, the hooded stallholder: three stock rooms each. ----
  ...STONES.flatMap((s, i) => stall('carmela', `gn-39-carmela-${i + 1}`, 'Evolution Stones', say('**Carmela Okafor-Lyle**, brisk, sleeves rolled. She weighs each stone in her hand before she names a price.', 'Three stones on the cloth today.'), s.lots, s.held, 0)),
  ...HELD.flatMap((s, i) => stall('tanager', `gn-39-tanager-${i + 1}`, 'Held Items', say('**Mr. Alban Tanager**, nervous, talking before you\'ve stopped walking. "Everything\'s tested. Mostly by me. Ask me anything. Ask me anything at all."'), s.lots, s.held, 0)),
  ...TMS.flatMap((s, i) => [
    ...stall('dace', `gn-39-dace-${i + 1}`, 'TMs', say('**The Dace sisters**, one on each end of the table. "Four discs today," says one. "Four," says the other, "that we\'re selling."'), s.lots.slice(0, 2), s.held, 0,
      [ch('The other two discs.', out('The other sister slides the other end of the table towards you.', scene(`gn-39-dace-${i + 1}-b`)))]),
    rm(`gn-39-dace-${i + 1}-b`, 'TMs: The Far End', wagons({ remembers: [{ id: 'out', when: [is('market-dace-out')], notice: '*Out of stock.*', hide: [0, 1] }] }), '"These two," says the sister at this end. "She\'d charge you more."', [
      ...s.lots.slice(2).map((l) => ch(`${l.name} (${fmt(l.price)}).`, out(`${l.name}.`, scene(`gn-39-dace-${i + 1}-b-${l.id}`)))),
      ch('Back to the other end.', out('Back along the table.', scene(`gn-39-dace-${i + 1}`))),
    ]),
    ...s.lots.slice(2).flatMap((l) => lotRooms('dace', `gn-39-dace-${i + 1}-b`, l)),
  ]),
  ...EGGS.flatMap((s, i) => stall('nan', `gn-39-nan-${i + 1}`, 'Eggs', say('**Nan Okafor**, a quilt over her eggs like a tea cosy. Before she shows you anything, she asks where you\'ll keep it. She listens to the answer.', 'Two eggs today. One she\'ll tell you about. One she won\'t.'), s.lots, s.held, 1)),
  ...[1, 2, 3].flatMap((i) => stall('hooded', `gn-39-hooded-${i}`, 'Mystery Items', say('**A hooded stallholder.** It says nothing. It points at a card propped against the parcels: what can be inside each, and how likely.'), PARCELS, SEALED, 1)),
  // ---- Ivo Ternary: three honest one-for-one trades (TRADES.md), and his Trade-Back service. ----
  ...([['city-market', 'coastal-harbour', 'forest-grove'], ['global-trade', 'mountain-mine', 'farm-ranch'], ['city-market', 'snow-ice', 'desert-ruins']] as const).flatMap((pools, i) => [
    rm(`gn-39-ivo-${i + 1}`, 'Trades', wagons(), say('**Ivo Ternary**, fair to a fault. Three cards face up on the table, each with both sides of a trade written out in full.', '"And if it\'s a Pokémon that changes when it\'s traded, I\'ll do that too. Straight back. Ask anyone."'), [
      ...pools.map((pool, k) => ch(`The ${['first', 'second', 'third'][k]} card.`, out('Ivo turns the card to face you, and waits while you read every line.', { kind: 'honestTrade', id: `gn39-ivo-${i + 1}-${k + 1}`, pool }))),
      ch('The Trade-Back.', out('"Hand it over, I hand it back, evolved. Free."', scene('trade-back-service'))),
    ]),
  ]),
  // ---- Josune Arregi's pen: a Pokémon uncommon for the region. The fee is for the meeting. ----
  ...stall('josune', 'gn-39-josune', 'Rare Encounters', say('**Josune Arregi**, trapper-turned-keeper, leaning on the rail. One Pokémon in the pen, uncommon for these parts.', '"Fee\'s for the meeting. What happens after\'s between the two of you. And if it backs away from you, there\'s no fee, because there\'s no meeting."'),
    [{ id: 'pen', name: 'The Pen', price: 600, give: [scene('gn-39-pen')], blurb: 'The pen. The Pokémon inside watches you over the rail.' }], null, 2, [],
    // It backs away from a party with an Intimidating Pokémon in it, and Josune won't sell.
    [{ id: 'backs-away', when: [{ kind: 'gn', test: 'hasAbility', key: 'intimidate' }], notice: 'The Pokémon in the pen takes one look at your party and backs into the far corner. Josune shakes her head. "Not today. It\'s decided."' }]),
  rm('gn-39-pen', 'Rare Encounters: The Pen', wagons(), 'Josune unhooks the gate. The Pokémon inside looks at you, and then at your Pokémon, and decides to stay.', [
    ch('Battle it.', fight('Josune steps back. "Fair fight. Don\'t be cruel."', { ...wild({ species: ['@market-pen'], lv: 0 }), exact: true, caught: [flag('market-pen-caught'), scene('gn-39-ring-3')], lose: [scene('gn-39-ring-3')] }, scene('gn-39-ring-3'))),
    ch('Just meet it.', out('You sit on the straw. After a while, it comes and sniffs your sleeve, and goes back to its corner. Josune looks pleased. "That\'s what the fee\'s for, really."', flag('market-pen-met'), scene('gn-39-ring-3'))),
  ]),
  // ---- The conditional stalls ----
  rm('gn-39-night', 'The Night Stall', wagons({ pokemon: 'sableye', remembers: SLATE.map((t, i) => ({ id: `slate-${i + 1}`, when: [exactly('market-slate', i + 1)], notice: `The slate, in a careful scratchy hand: *${t}*` })) }), say(
    'A **Sableye** behind a tray of gems, grinning. It trades gems for shiny things from your bag, at rates it makes up and writes on a slate.',
    'Once a rate is on the slate, it keeps to it. It is very proud of this.',
  ), [
    gemTrade('poke-ball', 'Hand over Poké Balls.', 0),
    gemTrade('great-ball', 'Hand over a Great Ball.', 1),
    gemTrade('ultra-ball', 'Hand over an Ultra Ball.', 2),
    toRing(2, 'Leave it to its tray.'),
  ]),
  rm('gn-39-fossil', 'The Fossil Stall', wagons(), say(
    '**Dr. Mirabel Larkin and Dr. Ansel Crowe**, sharing a table, arguing about the price on the card. They both look at your fossil Pokémon at once and stop arguing.',
    '"We can revive one for you, right here," says Larkin. "Or trade you two for one," says Crowe. "Two for one is *robbery*," says Larkin. "For us," says Crowe.',
  ), [
    ch('Have one revived. (₽1,500)', out('A humming box, a flash, a smell like a hot stone. Larkin hands it over. Crowe writes down the time.', { kind: 'money', amount: -1500 }, gn('fossil', { key: 'local' }), scene('gn-39-back')), { requires: [{ kind: 'money', atLeast: 1500 }] }),
    ch('Trade two for one.', out('Your fossil Pokémon goes to Crowe, who looks at it like a long-lost cousin. Two fossils come back, revived, from somewhere much further away.', trade('a fossil Pokémon', { species: FOSSIL_MONS }), gn('fossil', { key: 'far' }), gn('fossil', { key: 'far' }), scene('gn-39-back'))),
    ch('Leave them to it.', out('They\'re arguing again before you\'ve turned round.', scene('gn-39-back'))),
  ]),
  rm('gn-39-veteran', 'The Veteran\'s Stall', wagons(), say(
    '**A former Grunt**, selling off the uniform, the gadgets, and whatever was in the lockers. Strong things, with the drawbacks written on the tags.',
    '"I\'d rather they went to someone who beat us."',
  ), [
    ...VETERAN.map((l) => ch(`${l.name} (${fmt(l.price)}).`, out(`${l.blurb}`, { kind: 'money', amount: -l.price }, ...l.give, scene('gn-39-veteran')), { requires: [{ kind: 'money', atLeast: l.price }] })),
    ch('Back behind the wagons.', out('"Good luck," he says. "You know where they are now. Which is more than I did."', scene('gn-39-back'))),
  ]),
];

export const EVENTS: Json[] = [...gn39];

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-39-door': {
    gn: 'gn.39', shape: 'Hub', earliest: 'A3', home: 10, window: [8, 12], sits: 'optional', attaches: 'town', tags: ['Hub Destination'],
    level: 'No battles, except the rare-encounter stall (A+0)', often: 'region', badge: 'own', dressing: { kanto: 'The Travelling Pokémon Market', elsewhere: 'The Travelling Pokémon Market' },
    note: 'Badge: a striped awning. Once per region, in every region, with the same vendors and new stock. Until towns exist it sits on step 10. Vendors remember within the run (no memory across runs).',
  },
};

export const CHAINS: Json[] = [];
