// Greenneedle, part 9: gn.39 The Travelling Pokémon Market, gn.40 The Pokémon Day-Care Village, gn.41 The Pokémon Museum (doc GREENNEEDLE_REWORKED_PLACED_9.md).
// Build: npm run co:build -- greenneedle-9   then   npm run co:gn
import { any, br, ch, egg, fight, flag, item, join, out, trade, wild, type Json } from '../dsl.ts';
import { anyFlag } from './_ne.ts';
import { bondAll, chIf, exactly, gev, gn, is, moment, not, notThisRegion, pick, rm, say, scene, setTo, stampRegion, when, type Placement } from './_gn.ts';

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

// =====================================================================================================================
// gn.40  THE POKÉMON DAY-CARE VILLAGE  (Hub Destination at a Town node; until towns exist, step 5, optional; once per region, and it remembers).
// Services (leave two for a region, eggs, an egg move, the breeding board), village life (the four families, the hatching), one
// adoption a visit (the answer shapes the hatchling: core/greenneedle/daycare.ts), and Bronwen Okafor's pair. The pair left here comes
// home in the next region (gn-40-return, or the next visit): a level a stage, knowing each other, an egg if they're compatible.
// =====================================================================================================================
const VILLAGE_TINT = '#5e7a3a';
const village = (o: Json = {}): Json => ({ tint: VILLAGE_TINT, tags: ['Pokémon', 'Relationship', 'Story'], effect: 'none', ...o });
const toSquare40 = (label = 'Back to the square.'): Json => ch(label, out('Back to the square, past a heap of sleeping Pokémon who don\'t move.', scene('gn-40-square')));
/** Visits counted 1, 2, 3...; the adoption egg turns every three, Bronwen's pair every four. */
const cycle = (key: string, n: number): Json[] => Array.from({ length: 9 }, (_, i) => when('daycare-visits', { min: i + 1, max: i + 1 }, [setTo(key, (i % n) + 1)]));
const byVisit = (key: string, n: number, base: string): Json[] => Array.from({ length: n }, (_, i) => when(key, { min: i + 1, max: i + 1 }, [scene(`${base}-${i + 1}`)]));
const once = (key: string): Json => notThisRegion(key);
const gnc = (test: string, o: Json = {}): Json => ({ kind: 'gn', test, ...o });
const RARE_ITEM = ['rare-candy', 'ability-capsule', 'life-orb', 'choice-scarf', 'leftovers', 'focus-sash'];

/** Eggs for sale: two told, one a surprise; the price by rarity. */
const EGG_SALE: [string, string[] | null, number, string][][] = [
  [['An Eevee egg', ['eevee'], 1200, 'Cream, with a brown band. "Eevee. Popular. Priced like it."'], ['A Ralts egg', ['ralts'], 1500, 'White with a green crown. "Ralts. Shy. Worth it."'], ['A surprise', null, 900, '"Couldn\'t tell you. Neither could the mother."']],
  [['A Growlithe egg', ['growlithe'], 1000, 'Orange and black, warm as toast. "Growlithe. The Old Dog\'s grandchildren, near enough."'], ['A Riolu egg', ['riolu'], 1500, 'Blue with a black ring. "Riolu. It\'ll know you before you know it."'], ['A surprise', null, 900, '"Found in the hay. No idea. Good luck."']],
  [['A Snorunt egg', ['snorunt'], 900, 'Cold to the touch. "Snorunt. Keep it out of the sun."'], ['A Larvesta egg', ['larvesta'], 2000, 'Hot to the touch. "Larvesta. Keep it out of the hay."'], ['A surprise', null, 900, '"It hums. That\'s all I know."']],
];
const eggRoom = (i: number): Json => rm(`gn-40-eggs-${i + 1}`, 'The Day-Care: Eggs', village(), say('Three eggs in a straw-lined crate. Mr. Holloway names two of them. The third he just pats.', 'Prices are chalked on the crate, by how rare.'), [
  ...EGG_SALE[i]!.map(([name, sp, price, line]) => ch(`${name} (${fmt(price)}).`, out(line, { kind: 'money', amount: -price }, egg(sp ? { species: sp } : {}), scene('gn-40-daycare')), { requires: [{ kind: 'money', atLeast: price }] })),
  ch('Back to the counter.', out('He puts the lid back on the crate.', scene('gn-40-daycare'))),
]);

/** The adoption eggs: a story, one question, three answers; the answer shapes the hatchling (daycare.ts EGG_SHAPES). */
const ADOPT: { name: string; story: string; q: string; egg: Json; answers: [string, string, string][] }[] = [
  { name: 'Found in a Storm', story: 'Washed up against the fence after the storm, still warm. Mrs. Holloway kept it by the stove all night.', q: '"It\'s been frightened already. What\'ll you do the first time it\'s frightened again?"', egg: egg({ types: ['water', 'flying'] }),
    answers: [['Hold it.', 'storm-hold', 'She nods, slowly. "Then it\'ll start out knowing you will."'], ['Let it see I\'m not afraid.', 'storm-brave', '"Good. They learn that faster than anything."'], ['Stand in front.', 'storm-front', '"It\'ll grow up wanting to do the same. You watch."']] },
  { name: 'Left on a Doorstep', story: 'In a basket on the step, with a note: *"I can\'t. Please."*', q: '"Someone couldn\'t keep it. Will you tell it that, when it\'s older?"', egg: egg({}),
    answers: [['Yes.', 'door-yes', '"Then it\'ll be a gentle one. They always are, the ones who know."'], ['No.', 'door-no', '"Then it\'ll be a bold one. Nothing behind it but forwards."'], ['I\'ll tell it someone wanted it safe.', 'door-safe', 'She has to look away for a moment. "It\'ll be careful, that one. Like whoever wrote the note."']] },
  { name: 'The Last of a Clutch', story: 'The others hatched and went. This one\'s late. It rocks, sometimes, and then thinks better of it.', q: '"It\'s slow. Does that bother you?"', egg: egg({ species: ['slowpoke'] }),
    answers: [['No.', 'clutch-no', '"Then it\'ll hatch when it\'s ready, and it\'ll be the better for it."'], ['A bit.', 'clutch-bit', '"Then it\'ll hurry. It\'ll know it hurried, mind."'], ['I\'m slow too.', 'clutch-slow', 'She laughs, properly. "Then you\'ll get on."']] },
];
const adoptRoom = (i: number): Json => {
  const a = ADOPT[i]!;
  return rm(`gn-40-adopt-${i + 1}`, `The Adoption: ${a.name}`, village(), say(`**Mrs. Holloway**, with an egg in a shawl. ${a.story}`, a.q), [
    ...a.answers.map(([label, shape, line]) => ch(label, out(say(line, '**Mrs. Holloway, handing it over:** "We don\'t sell these ones. We place them."'), stampRegion('daycare-adopt-at'), { ...a.egg }, gn('eggShape', { key: shape }), flag(`daycare-adopted-${shape}`), scene('gn-40-edge')))),
    ch('Not yet.', out('She tucks the shawl back round it. "It\'ll keep."', scene('gn-40-edge'))),
  ]);
};

/** Bronwen Okafor's pair, one a visit, named on the sign outside her caravan. */
const has = (sp: string): Json => ({ kind: 'partySpecies', species: sp });
const PAIRS: { sign: string; needs: Json[]; give: Json[]; line: string }[] = [
  { sign: 'A Nidoran♀ and a Nidoran♂.', needs: [has('nidoran-f'), has('nidoran-m')], give: [egg({ species: ['nidoran-f', 'nidoran-m'] }), gn('eggShape', { key: 'nidoran-best' })], line: '"There. An egg with both lines\' best move in it. Earth Power from her side, Megahorn from his."' },
  { sign: 'A Volbeat and an Illumise.', needs: [has('volbeat'), has('illumise')], give: [{ ...join({ species: ['volbeat', 'illumise'] }), moves: ['tail-glow', 'quiver-dance', 'bug-buzz', 'moonlight'] }], line: '"Raised under the same lantern. It knows Tail Glow and Quiver Dance, both. They don\'t, usually."' },
  { sign: 'A Zangoose and a Seviper that get on.', needs: [has('zangoose'), has('seviper'), gnc('hasAbility', { key: 'truce' })], give: [{ ...join({ species: ['zangoose', 'seviper'] }), ability: 'truce' }], line: '"I didn\'t think I\'d ever see it." A kit raised by both of them, and it already knows the Truce.' },
  { sign: 'Any Pokémon and its own parent.', needs: [gnc('parentAndChild')], give: [item('destiny-knot'), { ...egg({}), tier: 'rare' }], line: '"Mother and child, in one party. Here. A Destiny Knot, and my best egg."' },
];
const pairRoom = (i: number): Json => {
  const p = PAIRS[i]!;
  return rm(`gn-40-bronwen-${i + 1}`, 'Bronwen\'s Caravan', village({ remembers: [{ id: 'given', when: [is('daycare-bronwen-at')], notice: 'Bronwen\'s already given you this visit\'s. "Come back next time. Different pair."', hide: [0] }] }), say(
    '**Bronwen Okafor**, Nan\'s cousin, in a caravan at the edge of the village, with a hand-painted sign outside:',
    `*THIS VISIT: ${p.sign.toUpperCase()}*`,
    '"Bring me that, and I\'ll give you something you won\'t find on a road."',
  ), [
    ch('Show her the pair.', out(p.line, ...p.give, stampRegion('daycare-bronwen-at'), flag('daycare-breeder-pair'), scene('gn-40-edge')), { requires: p.needs }),
    ch('Back to the village.', out('She waves you off with a teaspoon.', scene('gn-40-edge'))),
  ]);
};

const gn40: Json[] = [
  gev('gn-40-door', 'The Pokémon Day-Care Village', village({ stop: 'event', rarity: 'common', requires: [notThisRegion('daycare-region')] }), say(
    '*Low fences. A hill of clover. Pokémon of four generations asleep in one heap by a gate.*',
    '**Mr. Holloway:** "Mind the little ones underfoot. And the big ones. And the middle ones, they bite."',
  ), [
    ch('Walk into the village.', out('The heap by the gate shifts to let you through, and settles again.', stampRegion('daycare-region'), flag('daycare-visits'), ...cycle('daycare-egg', 3), ...cycle('daycare-pair', 4), gn('daycareReturn'), scene('gn-40-square'))),
    ch('Walk on.', out('A Nidoran trots after you to the end of the fence, decides against it, and trots back.')),
  ]),
  rm('gn-40-square', 'The Day-Care Village', village({ remembers: [{ id: 'listened', when: [is('egg-listened-hatched')], notice: 'Mrs. Holloway sees the one that hatched from the Egg That Listened. "That\'s one of ours. It heard a lot, that one."' }] }), say(
    'A square of packed earth, a well, and the day-care itself: a long low house with a step the size of a bed.',
    'On the step, an old Arcanine, grey at the muzzle, asleep. Hatchlings are climbing on it. It doesn\'t mind.',
  ), [
    ch('The day-care.', out('Mr. Holloway is at the counter, writing in a ledger with a very short pencil.', scene('gn-40-daycare'))),
    ch('Walk round the village.', out('Round by the clover hill.', scene('gn-40-village'))),
    ch('The edge of the village.', out('Out past the last fence, where Mrs. Holloway keeps the special eggs, and a caravan is parked.', scene('gn-40-edge'))),
    ch('Leave the village.', out('Mr. Holloway raises the short pencil in farewell. "Next region," he says. "We\'ll be here. We\'re always here."', flag('daycare-left-village'))),
  ]),
  rm('gn-40-daycare', 'The Day-Care', village({ remembers: [{ id: 'full', when: [is('daycare-held', 2)], notice: 'Two of yours are here already, asleep in the heap by the gate. "They\'re fine," says Mr. Holloway. "Better than fine. Come back next region."', hide: [0] }] }), say(
    '**Mr. Holloway**, behind a counter of scrubbed wood. "Leave two with us and they stay a region. A level a stage, near enough. If they\'re a pair that could, there\'ll be an egg when you\'re back."',
    '"And they come back knowing each other. You\'ll see it, when they\'re out together."',
  ), [
    ch('Leave two Pokémon.', out('He opens the ledger at a clean page.', scene('gn-40-leave-1')), { requires: [{ kind: 'partySize', atLeast: 3 }] }),
    ch('Buy eggs.', out('He lifts the lid on a straw-lined crate.', ...byVisit('daycare-egg', 3, 'gn-40-eggs'))),
    chIf([once('daycare-move-at')], 'Mrs. Holloway\'s egg moves.', out('Mrs. Holloway comes in from the back, wiping her hands.', scene('gn-40-eggmove'))),
    toSquare40(),
  ]),
  rm('gn-40-leave-1', 'The Day-Care: The First One', village(), 'Mr. Holloway licks the pencil. "First one?"', [
    ch('This one.', out('It goes and lies down in the heap by the gate as if it\'s always lived here.', gn('daycareLeave'), scene('gn-40-leave-2')), { pick: {} }),
    ch('Not today.', out('He closes the ledger. "Any time."', scene('gn-40-daycare'))),
  ]),
  rm('gn-40-leave-2', 'The Day-Care: The Second One', village(), '"And the second?"', [
    ch('This one.', out('It goes and finds the first one in the heap. Neither of them looks back. That\'s how you know it\'s fine.', gn('daycareLeave'), flag('daycare-left-pair'), scene('gn-40-daycare')), { pick: {} }),
    ch('Just the one.', out('"One\'s fine. One gets spoilt."', scene('gn-40-daycare'))),
  ]),
  ...[0, 1, 2].map(eggRoom),
  rm('gn-40-eggmove', 'Mrs. Holloway\'s Egg Moves', village(), say(
    '**Mrs. Holloway** teaches one egg move a visit, to a Pokémon that could have hatched knowing it. She looks at your lead for a long time first.',
    '"I don\'t take Heart Scales, love. You use those the minute you find them. Coins."',
  ), [
    ch(`Pay ${fmt(1000)}.`, out('She takes your lead\'s face in both hands and says something to it you don\'t catch. It practises the move all afternoon.', { kind: 'money', amount: -1000 }, { kind: 'eggMove' }, stampRegion('daycare-move-at'), scene('gn-40-daycare')), { requires: [{ kind: 'money', atLeast: 1000 }] }),
    ch('Not this time.', out('"It\'ll keep. They always keep."', scene('gn-40-daycare'))),
  ]),
  // ---- Village life ----
  rm('gn-40-village', 'The Village', village(), 'Families of Pokémon that have lived here for generations. The village has names for them.', [
    ch('The Clover Hill lot.', out('Up the clover hill.', scene('gn-40-clover'))),
    ch('The Pond lot.', out('Down to the pond.', scene('gn-40-pond'))),
    ch('The Roof lot.', out('Past the thatched roofs.', scene('gn-40-roof'))),
    ch('On through the village.', out('On, towards the day-care step and the board by the well.', scene('gn-40-village-2'))),
  ]),
  rm('gn-40-clover', 'The Clover Hill Lot', village({ pokemon: 'nidoqueen' }), say('Nidoran, Nidorina, Nidorino, and a Nidoqueen who\'s everyone\'s grandmother.', 'At dusk she counts them, with one claw. She always gets one too many.'), [
    ch('Count them too.', out('You count. You get one too many as well. The Nidoqueen gives you a look of deep fellow-feeling.', scene('gn-40-village'))),
    ch('Leave them to it.', out('She starts again from the top.', scene('gn-40-village'))),
  ]),
  rm('gn-40-pond', 'The Pond Lot', village({ pokemon: 'wooper' }), say('Marill and Azumarill, bobbing. And one Wooper, bobbing with them, who thinks it\'s one of them.', 'It\'s been told. It doesn\'t believe it.'), [
    ch('Tell it.', out('You tell it, gently. The Wooper looks at you, then at the Marill, then at you, and bobs, firmly, like a Marill.', scene('gn-40-village'))),
    ch('Let it be.', out('It bobs. The Marill bob. Nobody here minds.', scene('gn-40-village'))),
  ]),
  rm('gn-40-roof', 'The Roof Lot', village({ pokemon: 'tranquill' }), 'Pidove and Tranquill along the thatch, in a row.', [
    ch('Look up.', out('They leave, all at once, in a clatter of wings.', scene('gn-40-roof-2'))),
    ch('Walk on.', out('They watch you go. You can feel it.', scene('gn-40-village'))),
  ]),
  rm('gn-40-roof-2', 'The Roof Lot', village({ pokemon: 'pidove' }), 'The thatch is empty.', [
    ch('Look down.', out('A flutter, a scrape of claws. When you look up again, they\'re all back, in a row, looking innocent.', scene('gn-40-village'))),
    ch('Keep looking up.', out('Nothing. Nothing. Nothing. You give up. You look down. Behind you, a flutter, a scrape of claws.', scene('gn-40-village'))),
  ]),
  rm('gn-40-village-2', 'The Village: The Step and the Well', village({ remembers: [{ id: 'sneasel', when: [is('night-shift-sneasel')], notice: 'On the fence, the Sneasel that stayed after the Night Shift. Hatchlings are climbing on it, too. It\'s pretending not to like it.' }] }), say(
    'The day-care step, and the Old Dog asleep across it. It\'s raised forty years of hatchlings. They climb on it. It lets them.',
    'By the well, a board of breeding requests, pinned with clothes pegs.',
  ), [
    chIf([once('daycare-hatch-at')], 'Wait by the step.', out('A bell rings, somewhere in the house. Everyone in the village stops what they\'re doing.', stampRegion('daycare-hatch-at'), scene('gn-40-hatch'))),
    ch('The breeding board.', out('Three requests, in three hands.', scene('gn-40-board'))),
    toSquare40(),
  ]),
  rm('gn-40-hatch', 'The Hatching', village({ pokemon: 'arcanine' }), say(
    '*A bell. Everyone stops. Mrs. Holloway carries the egg out on a cushion and sets it on the step, between the Old Dog\'s paws.*',
    '*It cracks. Nobody breathes. A very small face.*',
    '*The Old Dog licks it, once. The village cheers. Somebody\'s already made a cake.*',
  ), [
    ch('Cheer.', out('You cheer with everyone else. The hatchling sneezes. The village cheers again, louder, for the sneeze.', bondAll(1), scene('gn-40-village-2'))),
    ch('Stay at the back.', out('You stay at the back, by the fence. The Old Dog looks up over the crowd, finds you, and puts its head down again.', scene('gn-40-village-2'))),
    ch('Ask to hold it.', out('Mrs. Holloway looks at your hands, and then at your team, for a long moment. "Not today, love. Next time."', scene('gn-40-village-2')), { branches: [
      br([gnc('partyBond', { n: 2 })], 'Mrs. Holloway looks at your hands, and then at your team. Every one of them is watching you, not her. "Yes," she says, and puts it in your arms. It is warm, and it weighs nothing, and it yawns.', bondAll(2), { kind: 'moment', text: 'You held a hatchling on the day-care step, the morning it was born.', importance: 60 }, scene('gn-40-village-2')),
    ] }),
  ]),
  rm('gn-40-board', 'The Breeding Board', village(), say('Three requests, pinned with clothes pegs. Meet one, and the village pays in something rare.'), [
    chIf([once('daycare-req-1')], 'A Pokémon that knows a move its parents taught it.', out('Mr. Holloway checks it over, and writes your name on the board.', any(...RARE_ITEM), stampRegion('daycare-req-1'), scene('gn-40-board')), { requires: [gnc('eggMoveKnown')] }),
    chIf([once('daycare-req-2')], 'One with a calm nature.', out('Your calm one sits through Mr. Holloway\'s whole inspection without blinking. He\'s impressed.', any(...RARE_ITEM), stampRegion('daycare-req-2'), scene('gn-40-board')), { requires: [gnc('natureIs', { key: 'calm' })] }),
    chIf([once('daycare-req-3')], 'A pair that get on.', out('The two of them sit together in the clover and groom each other. That\'s the request met.', any(...RARE_ITEM), stampRegion('daycare-req-3'), scene('gn-40-board')), { requires: [gnc('pairGetsOn')] }),
    ch('Back to the step.', out('The clothes pegs rattle in the wind.', scene('gn-40-village-2'))),
  ]),
  // ---- The edge: the adoption, and Bronwen's caravan ----
  rm('gn-40-edge', 'The Edge of the Village', village(), 'The last fence. Mrs. Holloway\'s egg shed, with one egg in it that has a story. And Bronwen Okafor\'s caravan, with a sign outside.', [
    chIf([once('daycare-adopt-at')], 'The egg with a story.', out('Mrs. Holloway is already at the shed door.', ...byVisit('daycare-egg', 3, 'gn-40-adopt'))),
    ch('Bronwen\'s caravan.', out('A kettle on, a sign out.', ...byVisit('daycare-pair', 4, 'gn-40-bronwen'))),
    toSquare40(),
  ]),
  ...[0, 1, 2].map(adoptRoom),
  ...[0, 1, 2, 3].map(pairRoom),
  // The pair left here comes home in the next region, if the village isn't there to visit first.
  gev('gn-40-return', 'Back From the Day-Care', village({ stop: 'event', rarity: 'common', callback: true, requires: [is('daycare-held'), notThisRegion('daycare-region')] }), say(
    'Mr. Holloway, at the side of the road, in a cart, with a very short pencil behind his ear. Asleep in the back of the cart: your two.',
    '"Thought we\'d save you the walk. They\'ve been good. Mostly."',
  ), [ch('Take them home.', out('They wake up, and see you, and are out of the cart before it\'s stopped.', gn('daycareReturn')))]),
];

// =====================================================================================================================
// gn.41  THE POKÉMON MUSEUM  (Hub Destination at a Town node; until towns exist, step 15, optional; once per region, each region's its own).
// Four halls, three activities (fossil identification, the jigsaw, three hidden items), the label that's wrong on purpose (always one
// the player could know from this run: core/greenneedle/museum.ts), the locked gallery and its resident, and the Legendary hall's Sign.
// =====================================================================================================================
const MUSEUM_TINT = '#6b6a75';
const marble = (o: Json = {}): Json => ({ tint: MUSEUM_TINT, tags: ['Mystery', 'Treasure', 'Story'], effect: 'none', ...o });
const toHalls = (label = 'Back to the halls.'): Json => ch(label, out('Back through the marble arch.', scene('gn-41-halls')));
const toFoyer = (label = 'Back to the foyer.'): Json => ch(label, out('Back to the foyer, under the sign.', scene('gn-41-foyer')));

/** The labels: the right one, and the one Dr. Winterbourne wrote wrong eleven years ago (museum.ts picks which, 1 to 6). */
const LABELS: { k: number; id: string; exhibit: string; right: string; wrong: string; hall: string }[] = [
  { k: 1, id: 'bell', hall: 'gn-41-artifacts', exhibit: 'A cracked bronze bell on a cushion.', right: '*"Bell, signal. Rung to call the boats in through fog."*', wrong: '*"Bell, ceremonial. Purpose unknown."* You know its purpose. You\'ve rung one like it, and something answered.' },
  { k: 2, id: 'net', hall: 'gn-41-artifacts', exhibit: 'A net, folded in a case. There\'s a stamp on the float.', right: '*"Net, fishing. Hand-knotted, local hemp."*', wrong: '*"Net, fishing."* The stamp on the float is a factory\'s. You\'ve seen that stamp before, and what that factory did.' },
  { k: 3, id: 'portrait', hall: 'gn-41-history', exhibit: 'A portrait of a woman in a veil, looking out to sea.', right: '*"Portrait of the founder\'s sister, who kept the lighthouse."*', wrong: '*"Portrait of an unknown woman."* You know her face. It\'s on a statue, on a cliff, above a town where it is always festival week.' },
  { k: 4, id: 'footprint', hall: 'gn-41-fossils', exhibit: 'A plaster cast of a footprint, mounted on the wall. It\'s the size of a door.', right: '*"Footprint cast: Rhydon. A large one."*', wrong: '*"Footprint cast: Rhydon."* No Rhydon made that. You\'ve seen what did, on an island where everything is too big.' },
  { k: 5, id: 'tablet', hall: 'gn-41-artifacts', exhibit: 'A clay tablet covered in small marks.', right: '*"Tablet. A tally of grain, by the look of it."*', wrong: '*"Tablet. Decorative marks."* They aren\'t decoration. They\'re letters. You learned to read them in a cavern that was much too large.' },
  { k: 6, id: 'date', hall: 'gn-41-history', exhibit: 'A brass plate under the first settlers\' boat.', right: '*"The boat that brought the first families, the year the History wall says."*', wrong: '*"The boat that brought the first families, a hundred years before anyone came."* The History wall, two rooms back, gives the year. This is a hundred years out.' },
];
const labelRoom = (l: (typeof LABELS)[number]): Json => rm(`gn-41-label-${l.id}`, 'A Label', marble({ remembers: [
  { id: 'wrong', when: [exactly('museum-wrong', l.k)], notice: `The label: ${l.wrong}` },
  { id: 'right', when: [is('museum-region')], notice: `The label: ${l.right}` },
] }), l.exhibit, [
  ch('Read it.', out('You read it twice. Dr. Winterbourne, across the hall, pretends not to watch you reading it.', scene(l.hall))),
  ch('Tell the curator it\'s wrong.', out('**Dr. Winterbourne:** "No, dear. I checked that one."', scene(l.hall)), { branches: [
    br([gnc('thisRegion', { key: 'museum-label-at' })], '**Dr. Winterbourne:** "Yes, yes. You told me. I\'ve had a cup of tea about it."', scene(l.hall)),
    br([exactly('museum-wrong', l.k)], say(
      '**Dr. Winterbourne:** "...Yes. Yes, it is. I wrote it wrong eleven years ago, to see if anyone read them. You\'re the first. I\'d nearly forgotten which it was."',
      '*A key from her own pocket. A door painted the same colour as the wall.*',
    ), stampRegion('museum-label-at'), stampRegion('museum-gallery-at'), stampRegion('museum-reader-at'), flag('museum-reader'), flag('museum-label-found'), moment('You found the one label in the museum that was wrong on purpose.', 55), scene('gn-41-gallery')),
  ] }),
]);
const labelCh = (id: string, text: string): Json => ch(text, out('You lean in to the label.', scene(`gn-41-label-${id}`)));

/** The fossil tray: five bones, three guesses each; the clues are on the Fossil hall's skeletons. A right answer: the museum's lab revives it. */
const BONES: { n: number; bone: string; options: string[]; right: string; fossil: string }[] = [
  { n: 1, bone: 'A spiral of shell, coiled to the right, with ridges like a staircase.', options: ['Omanyte.', 'Lileep.', 'Kabuto.'], right: 'Omanyte.', fossil: 'helix-fossil' },
  { n: 2, bone: 'A smooth dome with two pits underneath, like eyes looking up.', options: ['Shieldon.', 'Kabuto.', 'Tirtouga.'], right: 'Kabuto.', fossil: 'dome-fossil' },
  { n: 3, bone: 'A jaw full of needle teeth, in a chunk of orange amber.', options: ['Tyrunt.', 'Archen.', 'Aerodactyl.'], right: 'Aerodactyl.', fossil: 'old-amber' },
  { n: 4, bone: 'A claw like a pair of shears, jointed in three places.', options: ['Anorith.', 'Kabuto.', 'Archen.'], right: 'Anorith.', fossil: 'claw-fossil' },
  { n: 5, bone: 'A skull as thick as a door, flat on top, scarred from a hundred collisions.', options: ['Shieldon.', 'Cranidos.', 'Tyrunt.'], right: 'Cranidos.', fossil: 'skull-fossil' },
];
const boneRoom = (b: (typeof BONES)[number]): Json => rm(`gn-41-bone-${b.n}`, `The Tray: Bone ${b.n}`, marble(), say(b.bone, '"Which Pokémon?" says the card. Three answers, in Dr. Winterbourne\'s hand.'), [
  ...b.options.map((o) => ch(o, o === b.right
    ? out(`"${o.replace('.', '')}! Yes!" She takes it to the back, and comes out with it revived, blinking.`, item(b.fossil), stampRegion(`museum-bone-${b.n}`), scene('gn-41-tray'))
    : out('"Not quite, dear. Have another look at the skeletons." She puts it back in the tray, face down.', stampRegion(`museum-bone-${b.n}`), scene('gn-41-tray')))),
  ch('Put it back.', out('You put it back in the tray.', scene('gn-41-tray'))),
]);
const boneCh = (n: number): Json => chIf([once(`museum-bone-${n}`)], `Bone ${['one', 'two', 'three', 'four', 'five'][n - 1]}.`, out('You pick it up. It\'s lighter than you thought.', scene(`gn-41-bone-${n}`)));

/** Three hidden items, behind exhibits: a Relic each. "Take it." / "Tell the curator." */
const HIDDEN: { n: number; id: string; find: string; relic: string; back: string }[] = [
  { n: 1, id: 'case', find: 'The case of small fossils nobody\'s identified slides an inch when you lean on it. Behind it, in the dust: a gold coin with a Pokémon on it.', relic: 'relic-gold', back: 'gn-41-fossils' },
  { n: 2, id: 'tile', find: 'A loose tile, by the Tyrantrum\'s foot. Under it, wrapped in oilcloth: a little stone statue.', relic: 'relic-statue', back: 'gn-41-fossils' },
  { n: 3, id: 'painting', find: 'The painting of the harbour swings out on a hinge. Behind it, on a hook: a silver band.', relic: 'relic-band', back: 'gn-41-history' },
];
const hiddenRoom = (h: (typeof HIDDEN)[number]): Json => rm(`gn-41-hidden-${h.id}`, 'Behind the Exhibit', marble(), h.find, [
  ch('Take it.', out('It goes in your bag. Nobody saw. The Tyrantrum\'s eye sockets look at you anyway.', item(h.relic), stampRegion(`museum-hidden-${h.n}`), scene(h.back))),
  ch('Tell the curator.', out('Dr. Winterbourne is delighted. She puts it in a case of its own, and writes the card herself, with your name on it: *Found by a visitor who told us.*', flag('museum-hidden-returned'), stampRegion(`museum-hidden-${h.n}`), scene(h.back))),
]);
const hiddenCh = (n: number, label: string): Json => chIf([once(`museum-hidden-${n}`)], label, out('You look closer.', scene(`gn-41-hidden-${HIDDEN[n - 1]!.id}`)));

/** The Hall of Legendary Pokémon, by region: three or four of the region's legends, and the plinth that's always empty. */
const LEGEND_HALL: { region: string; shown: [string, string][]; empty: [string, string] }[] = [
  { region: 'kanto', shown: [['articuno', 'Articuno'], ['zapdos', 'Zapdos'], ['moltres', 'Moltres']], empty: ['mewtwo', 'Mewtwo'] },
  { region: 'johto', shown: [['raikou', 'Raikou'], ['entei', 'Entei'], ['suicune', 'Suicune'], ['lugia', 'Lugia']], empty: ['ho-oh', 'Ho-Oh'] },
  { region: 'hoenn', shown: [['groudon', 'Groudon'], ['kyogre', 'Kyogre'], ['latias', 'Latias']], empty: ['rayquaza', 'Rayquaza'] },
  { region: 'sinnoh', shown: [['dialga', 'Dialga'], ['palkia', 'Palkia'], ['uxie', 'Uxie']], empty: ['giratina', 'Giratina'] },
  { region: 'unova', shown: [['reshiram', 'Reshiram'], ['zekrom', 'Zekrom'], ['cobalion', 'Cobalion']], empty: ['kyurem', 'Kyurem'] },
  { region: 'kalos', shown: [['xerneas', 'Xerneas'], ['yveltal', 'Yveltal']], empty: ['zygarde', 'Zygarde'] },
  { region: 'alola', shown: [['tapu-koko', 'Tapu Koko'], ['solgaleo', 'Solgaleo'], ['lunala', 'Lunala']], empty: ['necrozma', 'Necrozma'] },
  { region: 'galar', shown: [['zacian', 'Zacian'], ['zamazenta', 'Zamazenta']], empty: ['eternatus', 'Eternatus'] },
  { region: 'paldea', shown: [['koraidon', 'Koraidon'], ['miraidon', 'Miraidon']], empty: ['terapagos', 'Terapagos'] },
];
const legendRoom = (h: (typeof LEGEND_HALL)[number], i: number): Json => {
  const names = h.shown.map(([, n]) => n);
  return rm(`gn-41-legends-${i + 1}`, 'The Hall of Legendary Pokémon', marble(), say(
    `Statues and paintings: ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}. The light comes down on them from a high window.`,
    `One plinth is empty, with a card: *"Not yet seen."* It's where ${h.empty[1]} would stand.`,
  ), [
    chIf([anyFlag(...h.shown.map(([id]) => `blessing-${id}`)), not('museum-blessing-given')], 'Stand in front of the statue.', out(
      '*Your lead looks at the statue. Then at you. Then at the statue. It\'s seen that shape. Not in stone.*',
      ...h.shown.map(([id]) => flag(`sign-${id}`)), flag('museum-blessing-given'), scene(`gn-41-legends-${i + 1}`))),
    chIf([is(`blessing-${h.empty[0]}`), not(`museum-card-${h.region}`)], 'I\'ve seen it.', out(
      'Dr. Winterbourne doesn\'t believe you. She writes it down anyway, very neatly, on the back of the card.', flag(`museum-card-${h.region}`), scene(`gn-41-legends-${i + 1}`))),
    chIf([is(`blessing-${h.empty[0]}`), not(`museum-card-${h.region}`)], 'Leave the card.', out('*"Not yet seen."* You leave it. It isn\'t your card to change.', flag(`museum-card-${h.region}`), scene(`gn-41-legends-${i + 1}`))),
    toHalls(),
  ]);
};

const gn41: Json[] = [
  gev('gn-41-door', 'The Pokémon Museum', marble({ stop: 'event', rarity: 'common', requires: [notThisRegion('museum-at')] }), say(
    '*Marble. Cool air. A sign: PLEASE DO NOT TOUCH. Below it, in a child\'s hand: (the fossils like it though).*',
    '**Curator, Dr. Mathilde Winterbourne:** "Welcome. Four halls. Everything\'s labelled. I wrote most of the labels myself. I\'m very proud of the labels."',
  ), [
    ch('Go in.', out('Your footsteps are very loud on the marble. Everyone\'s are.', stampRegion('museum-at'), flag('museum-visits'), gn('museumArrive'), when('museum-relics-returned', { min: 1 }, [stampRegion('museum-gallery-at')], 'Dr. Winterbourne recognises you. "You brought our relics home. The back gallery\'s open for you. It\'s the least we can do."'), scene('gn-41-foyer'))),
    ch('Walk on.', out('Through the window, a child is touching a fossil. The fossil seems fine with it.')),
  ]),
  rm('gn-41-foyer', 'The Museum: The Foyer', marble({ remembers: [{ id: 'reader', when: [is('museum-reader'), notThisRegion('museum-reader-at')], notice: 'On one label in every hall, below the curator\'s writing, a new line: *Reader:* and your name.' }] }), say(
    'The foyer. Four halls off it. An activities desk with a bell on it. And a door painted exactly the same colour as the wall.',
  ), [
    ch('The halls.', out('Through the marble arch.', scene('gn-41-halls'))),
    ch('The activities desk.', out('You ring the bell. Dr. Winterbourne appears from nowhere.', scene('gn-41-desk'))),
    chIf([gnc('thisRegion', { key: 'museum-gallery-at' })], 'The door the colour of the wall.', out('She unlocks it with the key from her pocket.', scene('gn-41-gallery'))),
    ch('Leave the museum.', out('"Come back," says Dr. Winterbourne. "The labels will still be here. That\'s the point of labels."', flag('museum-left'))),
  ]),
  rm('gn-41-halls', 'The Museum: The Halls', marble(), 'Four halls, each with a brass sign over the arch.', [
    ch('Fossils.', out('Into the Fossil hall.', scene('gn-41-fossils'))),
    ch('Artifacts.', out('Into the Artifacts hall.', scene('gn-41-artifacts'))),
    ch('The Hall of Legendary Pokémon.', out('Into the hall with the high window.', ...Array.from({ length: 9 }, (_, i) => when('museum-region', { min: i + 1, max: i + 1 }, [scene(`gn-41-legends-${i + 1}`)])))),
    ch('Regional History.', out('Along the painted wall.', scene('gn-41-history'))),
  ]),
  rm('gn-41-fossils', 'The Fossil Hall', marble({ pokemon: 'tyrantrum' }), say(
    'Skeletons. A Tyrantrum that fills the room. Small plaques under the others: *Omanyte, the shell coils right. Kabuto, a dome, two pits beneath. Aerodactyl, needle teeth, kept in amber. Anorith, a claw jointed three times. Cranidos, a skull as thick as a door.*',
    'A case of small ones nobody\'s identified. And on the wall, a plaster footprint.',
  ), [
    labelCh('footprint', 'Read the footprint\'s label.'),
    hiddenCh(1, 'Lean on the case of small ones.'),
    hiddenCh(2, 'The tile by the Tyrantrum\'s foot.'),
    toHalls(),
  ]),
  rm('gn-41-artifacts', 'The Artifacts Hall', marble(), 'Old Poké Balls made of Apricorns. A cracked bell. A net. Keys, a whole wall of them, for doors nobody can find.', [
    labelCh('bell', 'Read the bell\'s label.'),
    labelCh('net', 'Read the net\'s label.'),
    labelCh('tablet', 'Read the tablet\'s label.'),
    toHalls(),
  ]),
  rm('gn-41-history', 'Regional History', marble(), 'A long painted wall: how this region was settled, by whom, and what they found here. The year the first boat landed is painted in gold, very large.', [
    labelCh('portrait', 'Read the portrait\'s label.'),
    labelCh('date', 'Read the plate under the boat.'),
    hiddenCh(3, 'The painting of the harbour.'),
    toHalls(),
  ]),
  ...LABELS.map(labelRoom),
  ...HIDDEN.map(hiddenRoom),
  ...LEGEND_HALL.map(legendRoom),
  rm('gn-41-desk', 'The Activities Desk', marble({ remembers: [{ id: 'trophy', when: [is('trophy-kept'), not('museum-trophy')], notice: 'Dr. Winterbourne sees the trophy in your bag. "Oh. Oh, we\'d give that a case. With a blank plate. Somebody should have their name on it one day."',
    addChoices: [ch('Give it a case.', out('It goes in a case by the door, with a blank brass plate under it. She polishes the plate with her sleeve.', flag('museum-trophy'), scene('gn-41-desk')))] }] }), 'Two activities, chalked on a board: FOSSIL IDENTIFICATION. FOSSIL RESTORATION.', [
    ch('Fossil identification.', out('A tray of five bones, and a card for each.', scene('gn-41-tray'))),
    chIf([once('museum-jigsaw-at')], 'Fossil restoration.', out('A broken skull in a sandbox. Twelve pieces.', scene('gn-41-jigsaw'))),
    toFoyer(),
  ]),
  rm('gn-41-tray', 'Fossil Identification', marble(), '"Which Pokémon?" Five bones, three answers each. The clues are on the skeletons in the Fossil hall.', [boneCh(1), boneCh(2), boneCh(3), ch('The other two bones.', out('The far end of the tray.', scene('gn-41-tray-2')))]),
  rm('gn-41-tray-2', 'Fossil Identification', marble(), 'The last two bones.', [boneCh(4), boneCh(5), ch('Back to the desk.', out('You leave the tray as you found it, nearly.', scene('gn-41-desk')))]),
  ...BONES.map(boneRoom),
  rm('gn-41-jigsaw', 'Fossil Restoration', marble(), say('A broken skull in a sandbox, in twelve pieces. A brush, a pot of glue, and a card: *Don\'t force them.*', 'The museum pays for the work.'), [
    ch('Fit the pieces.', out('Twelve pieces, and not one forced. Dr. Winterbourne holds it up to the light. "*Perfect.*" She pays you, and then, from a drawer, gives you a Rare Bone. "For a good pair of hands."', { kind: 'money', amount: 800 }, item('rare-bone'), stampRegion('museum-jigsaw-at'), scene('gn-41-desk')), {
      prompt: { id: 'museum-jigsaw', needs: 'perfect' },
      fail: out('It\'s together. One piece went in with a crack you\'ll both pretend not to have heard. She pays you for the work, kindly.', { kind: 'money', amount: 800 }, stampRegion('museum-jigsaw-at'), scene('gn-41-desk')),
    }),
    ch('Leave it.', out('The skull stays in twelve pieces. It\'s been in twelve pieces a long time.', scene('gn-41-desk'))),
  ]),
  rm('gn-41-gallery', 'The Locked Gallery', marble({ remembers: [{ id: 'met', when: [gnc('thisRegion', { key: 'museum-secret-at' })], notice: 'The gallery\'s resident is back where it was, among the things nobody looks at.', hide: [0, 1] }] }), say(
    '*Inside: the things the museum can\'t explain, and doesn\'t show.* A Poké Ball that\'s warm. A photograph of this museum, with a hall it doesn\'t have. A map of the region with one more town on it.',
    'And something alive, that\'s been living here among the things nobody looks at.',
  ), [
    ch('Battle it.', fight('It comes off its shelf.', { ...wild({ species: ['@museum-secret'], lv: 1 }), exact: true, caught: [stampRegion('museum-secret-at'), scene('gn-41-gallery')], lose: [stampRegion('museum-secret-at'), scene('gn-41-gallery')] }, stampRegion('museum-secret-at'), scene('gn-41-gallery'))),
    ch('Ask it.', out('You hold out your hand. It looks at you a long time. Then it comes, the way it came to the museum: as if it had always meant to.', { ...join({ species: ['@museum-secret'], lv: 1 }) }, stampRegion('museum-secret-at'), flag('museum-secret-asked'), scene('gn-41-gallery')), { requires: [is('museum-hidden-returned')] }),
    toFoyer('Leave it be.'),
  ]),
];

export const EVENTS: Json[] = [...gn39, ...gn40, ...gn41];

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-39-door': {
    gn: 'gn.39', shape: 'Hub', earliest: 'A3', home: 10, window: [8, 12], sits: 'optional', attaches: 'town', tags: ['Hub Destination'],
    level: 'No battles, except the rare-encounter stall (A+0)', often: 'region', badge: 'own', dressing: { kanto: 'The Travelling Pokémon Market', elsewhere: 'The Travelling Pokémon Market' },
    note: 'Badge: a striped awning. Once per region, in every region, with the same vendors and new stock. Until towns exist it sits on step 10. Vendors remember within the run (no memory across runs).',
  },
  'gn-40-door': {
    gn: 'gn.40', shape: 'Hub', earliest: 'A4', home: 5, window: [3, 8], sits: 'optional', attaches: 'town', tags: ['Hub Destination', 'Community Episode'],
    level: 'No battles', often: 'region', badge: 'own', dressing: { kanto: 'The Pokémon Day-Care Village', elsewhere: 'The Pokémon Day-Care Village' },
    note: 'Badge: an egg. Once per region; the same village, and it remembers (within the run). Until towns exist it sits on step 5. The pair left there comes home in the next region (gn-40-return).',
  },
  'gn-40-return': { gn: 'gn.40', shape: 'Single', earliest: 'A4', home: 3, window: [1, 20], sits: 'optional', tags: ['Afterstory'], level: 'none', often: 'run', note: 'Only while two Pokémon are at the village, in a later region.' },
  'gn-41-door': {
    gn: 'gn.41', shape: 'Hub', earliest: 'A3', home: 15, window: [13, 17], sits: 'optional', attaches: 'town', tags: ['Hub Destination', 'Mystery Episode'],
    level: 'The secret encounter at A+1', often: 'region', badge: 'own', dressing: { kanto: 'The Pokémon Museum', elsewhere: 'The Pokémon Museum' },
    note: "Badge: a column. Once per region; each region's museum is different. In Kanto it is separate from Pewter's Museum of Science (cs.kanto.pewter.museum). Until towns exist it sits on step 15.",
  },
};

export const CHAINS: Json[] = [];
