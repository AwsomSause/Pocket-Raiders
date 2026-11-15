// Catalog Overhaul Pack: STORY_FAMILIES_16.md, SF104 to SF109 and SF112 (tolls, the oasis, guides, insurance, loans, the bank,
// pawn, rentals, layaway, subscriptions, wagers, fossils, tutors and tinkers). The honesty rules hold everywhere: both sides
// shown, every odd printed, every term stated, a loss never more than the stake, and a trader warns you.
// Scenes that come back later ("next bank stop", "two nodes", "five battles") are rooms queued with `laterEvent` (N nodes on).
import { $, ch, cure, fight, flag, flagIs, heal, item, out, anyType, trainer, wild, type Json } from '../dsl.ts';
import { COMMON, RARE, UNCOMMON, aNode, bond, kind, mk, moment, need, pay, rep, stay } from './_markets.ts';

export { CATEGORY } from './_markets.ts';

const G = 'Merchants & Deals';
const later = (eventId: string, nodes: number): Json => ({ kind: 'laterEvent', eventId, nodes });
const holds = (ids: string[], label: string, count = 1): Json => ({ kind: 'holdsAny', ids, count, label });
const room = (e: Json): Json => ({ group: G, callback: false, ...e, room: true });
const BERRIES = ['oran-berry', 'pecha-berry', 'cheri-berry', 'chesto-berry', 'rawst-berry', 'aspear-berry', 'persim-berry', 'leppa-berry', 'sitrus-berry', 'lum-berry'];
const CHARMS = ['lucky-charm', 'coin-charm', 'berry-charm', 'healing-charm', 'catching-charm', 'exp-charm', 'friendship-charm', 'step-charm', 'mercy-charm', 'mining-charm', 'lure-charm', 'clover-charm', 'heart-charm', 'repel-charm', 'frugal-charm', 'spirit-charm', 'hard-charm', 'easy-charm', 'nature-charm', 'element-charm', 'effort-charm'];
const RENTALS = ['choice-band', 'choice-specs', 'choice-scarf', 'life-orb', 'expert-belt', 'focus-sash'];
const COMMONS = ['great-ball', 'super-potion', 'full-heal', 'escape-rope', 'oran-berry', 'repel'];
const UNCOMMONS = ['ultra-ball', 'hyper-potion', 'revive', 'sitrus-berry', 'pp-up', 'heart-scale'];
const VITAMINS = ['hp-up', 'protein', 'iron', 'calcium', 'zinc', 'carbos'];
const COMMON_FOSSILS = ['plume-fossil', 'root-fossil', 'hisui-spark-fossil'];
const RARE_FOSSILS = ['helix-fossil', 'dome-fossil', 'old-amber', 'claw-fossil', 'skull-fossil', 'armor-fossil', 'cover-fossil', 'jaw-fossil', 'sail-fossil'];
const LEGENDS = ['articuno', 'zapdos', 'moltres', 'raikou', 'entei', 'suicune', 'regirock', 'regice', 'registeel', 'uxie', 'mesprit', 'azelf', 'cobalion', 'terrakion', 'virizion'];

export const EVENTS: Json[] = [
  // =====================================================================
  // SF104. Tolls
  // =====================================================================
  {
    id: 'w4-toll-bridge', name: 'The Toll Bridge', group: G,
    intro: 'A rope bridge over a white river, and a big man with a painted sign: TOLL. Big Abe folds his arms. "Toll\'s for the village that built it. Money, a battle, or a job. Your pick."',
    choices: [
      ch('Pay 200.', out('Abe takes the coins and writes your name in a fat ledger, under a hundred others. "The village thanks you." The bridge sways, but holds.', pay(200), flag('toll-ledger')), need(200)),
      ch('Battle.', fight('Abe grins and whistles. A Conkeldurr stomps up from under the bridge, a stone pillar on each shoulder. "Win, and you cross free."', trainer('Big Abe', { team: ['conkeldurr'], size: 1, friendly: true }))),
      ch('Do a job.', out('You spend the afternoon on the bridge with Abe, splicing rope, tightening knots. When it is done, he presses a Berry into your hand. "For the road. Good knots."', ...aNode(), { kind: 'itemFrom', ids: BERRIES })),
    ],
  },
  {
    id: 'wx-mountain-pass-toll', name: 'The Mountain Pass Toll', group: G,
    intro: 'A tollkeeper in a narrow pass, snow on her shoulders, a shovel in her fist. Sorcha squints at you. "No coin? Then do me a favour. My goats got loose." Three Mareep bleat somewhere above. The toll is ₽150.',
    choices: [
      ch('Round up the goats.', out('Three chases up three slopes, one Mareep at a time, wool full of snow. Sorcha waves you through for free, and gives you a Wool Ball, spun from them.', flag('wool-ball'), moment('Sorcha gave you a Wool Ball spun from her Mareep, for rounding them up.', 45)), { prompt: { id: 'dodge-tap', needs: 'ok' }, fail: out('The third Mareep leads you a merry dance, but in the end it comes, sulky. Sorcha waves you through, laughing.') }),
      ch('Pay 150.', out('You pay. Sorcha nods and leans on her shovel to let you pass.', pay(150)), need(150)),
      ch('Ask why the toll.', out('"Snow clearing. I do it alone. The toll pays the salt." She looks up the pass. "Somebody has to keep it open."', stay('wx-mountain-pass-toll'))),
    ],
  },
  // =====================================================================
  // SF105. Desert (the Sandstorm Camp is with the trades, markets-7)
  // =====================================================================
  {
    id: 'wx-heatwave-oasis', name: 'The Oasis', group: G,
    intro: 'An oasis in the scorched flats: water, shade, and a high price. Rahim, the keeper, shows you a slate: the camel train, the well fee, the losses. "Water\'s ₽300 a skin. That\'s what it costs me. Or work an hour and drink free."',
    choices: [
      ch('Pay 300.', out('Cold water, in the shade. Your whole team drinks until they cannot, and lies in the wet sand afterward, restored.', pay(300), heal(1)), need(300)),
      ch('Work an hour.', out('You haul buckets for an hour, and drink free, and so does everyone. Rahim draws a map in the sand. "A well that isn\'t dry. Nobody believes me. Go and see."', ...aNode(), heal(1), flag('desert-well'))),
      ch('Ask about the well.', out('"There\'s a well that isn\'t dry. Nobody believes me." He draws the way in the sand with a stick, carefully, twice. "Go and see."', flag('desert-well'), stay('wx-heatwave-oasis'))),
    ],
    remembers: [{ id: 'oasis-well-known', when: [flagIs('desert-well')], notice: 'Rahim\'s map to the Desert Well is in your bag.', hide: [2] }],
  },
  // =====================================================================
  // SF106. Guides, Insurance and Advice
  // =====================================================================
  {
    id: 'guide-for-hire', name: 'The Guide for Hire', group: G,
    intro: 'Cyrilla, a guide with a walking stick: "Fifty and I show you the quiet way. Two hundred and I show you the secret way." Quiet: three nodes, one hazard, no trainers. Secret: two nodes, a hidden cache, a wild Rare. "Secret\'s only worth it if you want the cache."',
    choices: [
      ch('The quiet way (50).', out('She walks you round the back of everything. Nobody challenges you. One rockslide, which she sees coming. The way ahead is laid out plain.', pay(50), { kind: 'scout', columns: 3 }, { kind: 'takeNode', nodes: 3 }), need(50)),
      ch('The secret way (200).', fight('Through a crack in a cliff, along a dry stream bed. A cache in a hollow tree, exactly where she said. And at the end, something rare watching you from the rocks.', { ...wild({ lv: 2 }), rare: true, friendly: true }, pay(200), { kind: 'skipAhead' }, { kind: 'itemFrom', ids: UNCOMMONS }), need(200)),
      ch('Neither.', out('"Your road, then." Cyrilla tips her hat. "It\'s a good road too."')),
    ],
  },
  {
    id: 'insurance-agent', name: 'The Insurance Agent', group: G,
    intro: 'A thin man with a briefcase. Mr. Pettifer: "Nobody likes to talk about losing a Pokémon. One page. Read it." Premium ₽500. Payout: a revival token and a memorial plaque if a Pokémon is lost. Exclusions: released or traded Pokémon.',
    choices: [
      ch('Sign.', out('You sign. Mr. Pettifer stamps it twice and hands you your copy. "Covered for the region. I hope you never need me."', pay(500), { kind: 'flag', key: 'insured', stamp: 'region' }, later('insurance-claim', 3)), need(500)),
      ch('Read it again.', out('The same page. Premium, payout, exclusions. No small print; he does not believe in it. "Read it as often as you like."', stay('insurance-agent'))),
      ch('No.', out('"Of course." He closes the briefcase gently. "Most people say no. Most people are lucky."')),
    ],
  },
  room({
    id: 'insurance-claim', name: 'The Insurance Agent',
    requires: [flagIs('insured'), { kind: 'flag', key: 'insured', regionsAgoMost: 0 }],
    intro: 'Mr. Pettifer finds you on the road, briefcase first. "Checking in on my policy holders. Any losses? I hope the answer is no."',
    choices: [
      ch('All\'s well.', out('"Good. Very good." He makes a small, happy tick on his page. "Still covered for the region. I\'ll look in again."', later('insurance-claim', 3))),
    ],
    remembers: [{ id: 'insurance-loss', when: [{ kind: 'memberFainted', within: 6 }], notice: 'He looks at your team, and then at you, and takes off his hat. "Ah. I\'m sorry. That\'s what the policy is for."',
      addChoices: [ch('Make a claim.', out('He pays without a single question: a Revive in a velvet bag, and a small brass plaque with your Pokémon\'s name on it, polished. "The policy is spent. I\'m glad it was there."', item('revive'), flag('insured', -1)))] }],
  }),
  {
    id: 'rumour-seller', name: 'The Rumour Seller', group: G,
    intro: 'A man in a coat lined with paper slips. Fitch winks. "Rumours, ₽100 apiece! Reliability\'s written on each one. Lies get a refund." The slips are stamped 90%, 60%, 30%.',
    choices: [
      ch('Buy a rumour.', out('Fitch draws a slip and reads it out, reliability first. Then he writes your name on the stub. "If it\'s false, I owe you."', pay(100), { kind: 'scout', columns: 2 }, flag('rumour-bought'), mk('comeBack', { event: 'rumour-seller' })), need(100)),
      ch('Buy three.', out('Three slips: 90%, 60%, 30%. He reads each one, and the reliability, and writes your name on three stubs.', pay(300), { kind: 'scout', columns: 4 }, flag('rumour-bought', 3), mk('comeBack', { event: 'rumour-seller' })), need(300)),
      ch('No.', out('Fitch shrugs. "The truth\'s cheaper than you\'d think. Come back."')),
    ],
    remembers: [{ id: 'rumour-refund', when: [flagIs('rumour-bought')], notice: 'Fitch spots you and pulls a stub from his coat. "One of mine was false. Here." He counts out a refund before you can ask.',
      addChoices: [ch('Take the refund.', out('₽100 back, counted twice. "Lies get a refund," Fitch says. "I keep my word even when my rumours don\'t."', $(100), flag('rumour-bought', -99)))] }],
  },
  {
    id: 'ticket-tout', name: 'The Ticket Tout', group: G,
    intro: 'A man in a flat cap fanning tickets. Jimmy Spark leans in. "Ticket to a secret stop? Real, I swear. It\'s the Glass Forest." ₽400.',
    choices: [
      ch('Buy (400).', out('He hands you the ticket and points down the path. "Two turns past the big rock. Tell \'em Jimmy sent you."', pay(400), flag('glass-forest-ticket')), need(400)),
      ch('How do I know it\'s real?', out('He names it, shows the route on a map, and draws the trees. It is real. Jimmy is a lot of things, but not a liar.', stay('ticket-tout'))),
      ch('No.', out('"Your loss," he says cheerfully, and means it kindly.')),
    ],
  },
  // =====================================================================
  // SF107. Loans and the Bank
  // =====================================================================
  {
    id: 'risky-loan', name: 'A Generous Loan', group: G,
    intro: 'A man in a sharp coat, a pen already uncapped. Mr. Crane smiles. "Short on funds? I lend. Pay me back at the next town." The note: ₽1,000 now; ₽1,200 due at the bank four nodes on; miss it and the Debt Collector comes.',
    choices: [
      ch('Borrow.', out('You sign. He counts out ₽1,000, crisp, and folds the note into your pocket himself. "Four nodes. The bank knows."', $(1000), flag('loan-crane'), later('repay-banker', 4))),
      ch('Read the note again.', out('The same note: ₽1,000 now, ₽1,200 at the next bank, four nodes on. The Debt Collector if you miss it. Mr. Crane waits, pen ready, perfectly patient.', stay('risky-loan'))),
      ch('No.', out('"Sensible." He caps the pen. "Sensible people never need me. Until they do."')),
    ],
  },
  room({
    id: 'repay-banker', name: 'Repay the Banker',
    requires: [flagIs('loan-crane')],
    intro: 'A bank window, a clerk with sleeve garters. "Here to repay Mr. Crane\'s loan? ₽1,200. I can clear it before the collectors hear."',
    choices: [
      ch('Repay.', out('The clerk counts it, stamps the note PAID, and gives you the stub. You feel lighter than ₽1,200 ought to make you.', pay(1200), flag('loan-crane', -1)), need(1200)),
      ch('Ask for more time.', out('"One more node. Plus ₽100 interest, stated." The clerk writes it on the note. "Next window along."', flag('loan-crane-late'), later('repay-banker', 1))),
      ch('Not yet.', out('The clerk nods and makes a small note. You know who reads those notes.')),
    ],
    remembers: [{ id: 'repay-late', when: [flagIs('loan-crane-late')], notice: 'The note says ₽1,300 now: the ₽100 interest is written in, as promised.', hide: [0, 1],
      addChoices: [ch('Repay.', out('₽1,300. The clerk stamps it PAID. "Clear. Mr. Crane won\'t hear your name again."', pay(1300), flag('loan-crane', -1), flag('loan-crane-late', -1)), need(1300))] }],
  }),
  {
    id: 'bank-teller', name: 'The Bank', group: G,
    intro: 'A neat counter, a brass bell. Miss Agatha Lowe: "Deposit half your money now. Next bank stop, ten percent back. Two stops on, twenty-five. If the bank\'s robbed, you lose half. That\'s the risk."',
    choices: [
      ch('Deposit.', out('She counts it, writes a receipt in perfect copperplate, and hands it over. "Four nodes to the next bank. It\'ll be waiting."', mk('deposit', { key: 'bank', factor: 0.5 }), later('bank-teller-return', 4))),
      ch('What robs banks?', out('"The evil team, if their trouble reaches us." Miss Lowe does not smile. "It has happened. I\'d rather tell you."', stay('bank-teller'))),
      ch('No.', out('"Keep it close, then." She rings the bell for the next customer.')),
    ],
  },
  room({
    id: 'bank-teller-return', name: 'The Bank',
    requires: [flagIs('deposit-bank')], callback: false,
    intro: 'The next bank, the same copperplate on your receipt. The teller looks up. "Your deposit\'s matured. Ten percent. Or leave it in: four more nodes and it\'s twenty-five."',
    choices: [
      ch('Take it.', out('Counted out in front of you, ten percent on top.', mk('withdraw', { key: 'bank', factor: 1.1 }))),
      ch('Leave it in.', out('"Four more nodes." The teller stamps the receipt. "Interest at last, then."', later('bank-teller-return-big', 4))),
    ],
    remembers: [{ id: 'bank-robbed', when: [flagIs('bank-robbed')], notice: 'The window is boarded on one side. "We were robbed," the teller says quietly. "You get half. It\'s what the sign said. I\'m sorry."', hide: [0],
      addChoices: [ch('Take it.', out('Half, counted out with shaking hands.', mk('withdraw', { key: 'bank', factor: 0.5 })))] }],
  }),
  room({
    id: 'bank-teller-return-big', name: 'The Bank',
    requires: [flagIs('deposit-bank')], callback: false,
    intro: 'A bigger bank, marble floors. Your receipt has two stamps now. "Interest at last. Twenty-five percent." Or leave it in, and the next stop\'s return applies.',
    choices: [
      ch('Take it.', out('Twenty-five percent on top, in a paper band.', mk('withdraw', { key: 'bank', factor: 1.25 }))),
      ch('Leave it in.', out('"Four more nodes." Another stamp.', later('bank-teller-return-big', 4))),
    ],
    remembers: [{ id: 'bank-robbed-big', when: [flagIs('bank-robbed')], notice: 'The marble is cracked. "Robbed," says the teller. "Half. As stated."', hide: [0],
      addChoices: [ch('Take it.', out('Half, as stated.', mk('withdraw', { key: 'bank', factor: 0.5 })))] }],
  }),
  // =====================================================================
  // SF108. Pawn, Appraisal and Rentals
  // =====================================================================
  {
    id: 'pawn-appraiser', name: 'The Pawn Appraiser', group: G,
    intro: 'A tiny brass loupe on a chain, and a man behind it. Mr. Okonkwo: "Bring me anything old. I\'ll tell you what it is, and if it\'s stolen." He sells at the price he names, too.',
    choices: [
      ch('Appraise an item.', out('He turns your treasures over one by one under the loupe and tells you, plainly, what each is worth. None stolen. He seems a little disappointed.', mk('advise', { key: 'best' }), stay('pawn-appraiser'))),
      ch('Sell at your price.', out('He names a fair price for your curios, writes it down, and pays it to the coin.', mk('sell', { pick: 'curio', factor: 1 }))),
      ch('No.', out('"Bring me something old another day." He polishes the loupe.')),
    ],
  },
  {
    id: 'pawn-sharks', name: 'The Pawn Sharks', group: G,
    intro: 'Two men in sharp suits and sharper smiles. Vic and Vinnie: "Sell now. Buy back later. Markup\'s on the receipt." The receipt: they pay half its value now; buyback at +50% of that, four nodes on.',
    choices: [
      ch('Pawn something.', out('Vinnie takes your most valuable item and writes a receipt. Vic counts out the money. "Four nodes. We\'ll find you."', mk('pawn', { key: 'sharks', factor: 0.5 }), later('pawn-sharks-buyback', 4), later('pawn-sharks-buyback-small', 4))),
      ch('No.', out('"Suit yourself." They straighten each other\'s ties.')),
    ],
  },
  room({
    id: 'pawn-sharks-buyback', name: 'The Pawn Sharks',
    requires: [flagIs('pawn-sharks'), { kind: 'flag', key: 'pawn-sharks-berry', atLeast: 0, atMost: 0 }],
    intro: 'Vic and Vinnie fall into step beside you. "Want it back? It\'ll cost more now." Vinnie holds up the receipt: half again what they paid, just as printed.',
    choices: [
      ch('Buy back.', out('Vic counts your money twice, then hands your item back with a little bow.', mk('redeem', { key: 'sharks', factor: 1.5 }))),
      ch('Keep the money.', out('"Business is business." Vinnie tears the receipt in half. They are gone before the pieces land.', mk('redeem', { key: 'sharks', forfeit: true }))),
    ],
  }),
  room({
    id: 'pawn-sharks-buyback-small', name: 'The Pawn Sharks',
    requires: [flagIs('pawn-sharks'), flagIs('pawn-sharks-berry')],
    intro: 'Vic and Vinnie again, Vinnie holding up a little Berry between two fingers. "That Berry, friend. Still want it?" The receipt says half again what they paid.',
    choices: [
      ch('Buy back.', out('Vinnie tosses it over. Vic pockets the coins. "Pleasure."', mk('redeem', { key: 'sharks', factor: 1.5 }))),
      ch('Keep the money.', out('Vinnie eats the Berry. Vic sighs at him. "Business."', mk('redeem', { key: 'sharks', forfeit: true }))),
    ],
  }),
  {
    id: 'rental-counter', name: 'The Rental Counter', group: G,
    intro: 'A counter of glass cases full of held items. Dot-Ann, the clerk: "Hold items for rent. ₽100. Five battles, then it comes back. Damage terms on the card." The card: if it\'s used up, you pay its value.',
    choices: [
      ch('Rent (100).', out('Dot-Ann unlocks a case and hands you a strong held item on a ribbon tag. "Five battles. I\'ll come find you."', pay(100), mk('rent', { key: 'counter', only: RENTALS }), later('rental-return', 5)), need(100)),
      ch('Read the card.', out('"Rental: ₽100. Five battles. Returned as lent. If it\'s consumed, the player pays its value." Signed by Dot-Ann, in green ink.', stay('rental-counter'))),
      ch('No.', out('"Next time!" Dot-Ann waves a feather duster at you.')),
    ],
  },
  room({
    id: 'rental-return', name: 'The Rental Counter',
    requires: [flagIs('rent-counter')],
    intro: 'Dot-Ann jogs up the path, out of breath, clipboard in hand. "Time\'s up! I need it back."',
    choices: [
      ch('Here.', out('You hand it over. Dot-Ann checks it, ticks her clipboard and beams. "Lovely. Rent again any time." (If it was used up, the card\'s terms apply.)', mk('returnRent', { key: 'counter' }))),
      ch('I used it.', out('"These things happen." She reads the card out, finds the value, and you pay it. "Thank you for telling me."', mk('returnRent', { key: 'counter', used: true }))),
    ],
  }),
  {
    id: 'layaway-lady', name: 'Layaway', group: G,
    intro: 'A kindly woman with a catalogue and a pencil behind her ear. Mrs. Penhaligon: "Half now, the rest when it arrives. It\'ll be with you in two nodes." Big: Leftovers, ₽2,500. Small: a Quick Claw, ₽600.',
    choices: [
      ch('Layaway a big item.', out('She writes your name in the catalogue. "₽1,250 now, ₽1,250 when the Leftovers arrive. Two nodes, dear."', pay(1250), flag('layaway'), later('layaway-pickup', 2)), need(1250)),
      ch('A small one.', out('"₽300 now, ₽300 when the Quick Claw arrives. Two nodes."', pay(300), flag('layaway-small'), later('layaway-pickup-small', 2)), need(300)),
      ch('No.', out('"Of course. Come back when you\'re ready." She licks her pencil.')),
    ],
  },
  room({
    id: 'layaway-pickup', name: 'Layaway',
    intro: 'Mrs. Penhaligon waves a parcel over her head. "It\'s arrived, dear!" The Leftovers, wrapped in brown paper. ₽1,250 to go.',
    choices: [
      ch('Pay the rest.', out('You pay, and she hands it over as if it were a birthday present.', pay(1250), item('leftovers'), flag('layaway', -1)), need(1250)),
      ch('Cancel (lose the half).', out('"Of course, dear. The half stays with us; that\'s the terms." She tucks the parcel back under her arm, not unkindly.', flag('layaway', -1))),
    ],
  }),
  room({
    id: 'layaway-pickup-small', name: 'Layaway',
    intro: 'Mrs. Penhaligon, a small parcel in hand. "The small one\'s here!" The Quick Claw. ₽300 to go.',
    choices: [
      ch('Pay the rest.', out('She tucks it into your hand and pats it.', pay(300), item('quick-claw'), flag('layaway-small', -1)), need(300)),
      ch('Cancel (lose the half).', out('"The half stays, dear. Terms are terms." She smiles anyway.', flag('layaway-small', -1))),
    ],
  }),
  {
    id: 'subscription-box', name: 'The Subscription Box', group: G,
    intro: 'A courier with a cap and a tablet. "Pay once, ₽900, and a surprise box after each of the next three towns. Tiers on the form." The form: one Common box, then two Uncommon.',
    choices: [
      ch('Subscribe (900).', out('You sign. The courier taps the tablet. "First box in four nodes. You\'ll love it. Or not. It\'s a surprise."', pay(900), flag('sub-box', 3), later('subscription-box-delivery', 4)), need(900)),
      ch('Read the form.', out('"Three boxes. Box one: a Common item. Boxes two and three: an Uncommon item each. ₽900 total." No small print. The courier looks proud of that.', stay('subscription-box'))),
      ch('No.', out('"Your loss!" The courier zooms off on a bicycle.')),
    ],
  },
  room({
    id: 'subscription-box-delivery', name: 'The Subscription Box',
    intro: 'The courier skids to a stop beside you, a box under one arm. "Your subscription! Surprise!" The label: COMMON.',
    choices: [
      ch('Open it.', out('Tissue paper, a ribbon, and inside, a Common item, exactly as the form promised.', { kind: 'itemFrom', ids: COMMONS }, flag('sub-box', -1), later('subscription-box-delivery', 4))),
      ch('Save it for later.', out('You tuck it in your bag unopened. The courier looks scandalised. "It\'ll still be a surprise," you tell him.', later('subscription-box-delivery', 2))),
    ],
    remembers: [
      { id: 'sub-box-last', when: [flagIs('sub-box', 1, 1)], intro: 'The courier, the last box, the label: UNCOMMON. "Final one! Hope you enjoyed it."', hide: [0],
        addChoices: [ch('Open it.', out('The last box: an Uncommon item. The courier salutes and pedals away for good.', { kind: 'itemFrom', ids: UNCOMMONS }, flag('sub-box', -1)))] },
      { id: 'sub-box-second', when: [flagIs('sub-box', 2, 2)], intro: 'The courier again, the box bigger this time. The label: UNCOMMON.', hide: [0],
        addChoices: [ch('Open it.', out('An Uncommon item, nested in straw. "One more to go," says the courier.', { kind: 'itemFrom', ids: UNCOMMONS }, flag('sub-box', -1), later('subscription-box-delivery', 4)))] },
    ],
  }),
  // =====================================================================
  // SF109. Wagers
  // =====================================================================
  {
    id: 'ace-trainer-bet', name: "Ace Trainer's Bet", group: G,
    intro: 'An Ace Trainer in a crisp jacket. Viv taps a card: "Bet on our battle? I put up the same." Win: you take her stake. Lose: she takes yours. Nothing more.',
    choices: [
      ch('Bet 200.', fight('Two ₽200 stacks on a flat stone. Viv sends out her first Pokémon.', trainer('Ace Trainer Viv', { cls: 'ace-trainer', friendly: true, win: [$(200)], lose: [$(-200)] })), need(200)),
      ch('Bet 500.', fight('Two ₽500 stacks on the stone. Viv\'s smile sharpens.', trainer('Ace Trainer Viv', { cls: 'ace-trainer', friendly: true, win: [$(500)], lose: [$(-500)] })), need(500)),
      ch('Just battle.', fight('"For the love of it, then." Viv shakes your hand first.', trainer('Ace Trainer Viv', { cls: 'ace-trainer', friendly: true }))),
    ],
  },
  {
    id: 'gamblers-gauntlet', name: "Gambler's Gauntlet", group: G,
    intro: 'A card sharp in a waistcoat. Lou shuffles. "Bet on yourself! Bigger stake, bigger payout." Each battle: win ₽300, lose ₽300. Stop any time.',
    choices: [
      ch('Three battles, 300 each.', fight('Lou signals the first of three trainers. "Round one. You can stop after any of them."', trainer('Gauntlet Trainer', { friendly: true, win: [$(300), flag('gauntlet-wins'), stay('gamblers-gauntlet-next')], lose: [$(-300)] })), need(300)),
      ch('One battle, 300.', fight('"Just the one? Fine." Lou signals a trainer.', trainer('Gauntlet Trainer', { friendly: true, win: [$(300)], lose: [$(-300)] })), need(300)),
      ch('No.', out('"Never bet against yourself," Lou says. "But never bet if you don\'t want to."')),
    ],
  },
  room({
    id: 'gamblers-gauntlet-next', name: "Gambler's Gauntlet",
    intro: 'Lou deals the next card face up: another trainer, already waiting. "₽300 on the next one? Or walk away with what you\'ve got."',
    choices: [
      ch('Next battle, 300.', fight('Lou waves the next trainer in.', trainer('Gauntlet Trainer', { friendly: true, lv: 2, win: [$(300), flag('gauntlet-wins'), stay('gamblers-gauntlet-next')], lose: [$(-300)] })), need(300)),
      ch('Stop.', out('"Smart." Lou tips his hat. "Most people don\'t know when."', flag('gauntlet-wins', -99))),
    ],
    remembers: [{ id: 'gauntlet-last', when: [flagIs('gauntlet-wins', 2)], notice: 'Lou deals the last card. "Final round."', hide: [0],
      addChoices: [ch('Last battle, 300.', fight('The last trainer, the strongest. Lou watches with real interest.', trainer('Gauntlet Trainer', { friendly: true, lv: 4, win: [$(300), flag('gauntlet-wins', -99)], lose: [$(-300), flag('gauntlet-wins', -99)] })), need(300))] }],
  }),
  {
    id: 'sudden-death-duel', name: 'Sudden Death', group: G,
    intro: 'A duellist in a long coat holds up a Focus Sash. Raine: "First faint ends it. Winner takes a held item from the loser." Her stake: the Focus Sash. Yours: your most valuable item.',
    choices: [
      ch('Accept.', fight('One Pokémon each. First faint ends it. Raine bows, very formally, and throws.', trainer('Duellist Raine', { size: 1, friendly: true, win: [item('focus-sash')], lose: [mk('stolen', { key: 'duel' })] }))),
      ch('Which item of yours?', out('Raine looks through your bag with you and names it, out loud, so there is no mistake.', mk('advise', { key: 'best' }), stay('sudden-death-duel'))),
      ch('No.', out('Raine bows anyway. "Another day."')),
    ],
  },
  // =====================================================================
  // SF112. Fossils, Tutors and Tinkers
  // =====================================================================
  {
    id: 'flea-fossil', name: 'The Flea-Market Fossil', group: G,
    intro: 'A blanket of rocks and one lump wrapped in newspaper. Mungo, the hobbyist: "Real fossil! Or a rock. Reveal\'s ₽100, and it\'s yours if it\'s real. Or buy it unrevealed for ₽300." The card: 1 in 3 are real.',
    choices: [
      ch('Reveal (100).', out('Mungo taps the lump with a tiny hammer. It cracks open.', mk('prize', { stake: 100, table: [{ weight: 1, label: 'A real fossil!', item: 'root-fossil' }, { weight: 2, label: 'A rock' }] })), need(100)),
      ch('Buy it unrevealed (300).', out('You pay and crack it yourself at the next campfire.', mk('prize', { stake: 300, table: [{ weight: 1, label: 'A real fossil!', item: 'claw-fossil' }, { weight: 2, label: 'A rock' }] })), need(300)),
      ch('No.', out('"Plenty more rocks," Mungo says, happily.')),
    ],
  },
  {
    id: 'fossil-trader', name: 'The Fossil Trader', group: G,
    intro: `A cart of labelled fossils. Ammonia, the trader: "Ancient fossils! Plume, Root, Spark cheap: ₽${UNCOMMON}. Rare ones named and priced: ₽${RARE}."`,
    choices: [
      ch('Buy a common fossil.', out('She wraps it in cloth and writes its name on the cloth.', pay(UNCOMMON), { kind: 'itemFrom', ids: COMMON_FOSSILS }), need(UNCOMMON)),
      ch('Buy a rare one.', out('She opens a velvet case and lets you choose by eye. The name is on a little card.', pay(RARE), { kind: 'itemFrom', ids: RARE_FOSSILS }), need(RARE)),
      ch('No.', out('"They\'ve waited a million years," Ammonia says. "They can wait for you."')),
    ],
  },
  {
    id: 'itinerant-tutor', name: 'The Itinerant Tutor', group: G,
    intro: 'A man with a satchel of scrolls and a notebook. Ambrose: "One move per visit. My price: a Berry, a coin, or a secret."',
    choices: [
      ch('A Berry.', out('He eats the Berry thoughtfully, then teaches your lead a move it could not have learned alone.', mk('payItem', { only: BERRIES }), { kind: 'train', what: 'learnMove' }), { requires: [holds(BERRIES, 'a Berry')] }),
      ch('A coin (100).', out('He pockets the coin and teaches your lead a move.', pay(100), { kind: 'train', what: 'learnMove' }), need(100)),
      ch('A secret.', out('You tell him something you have never told anyone. He writes it down. "It goes in my memoir. Anonymously." Then he teaches your lead a move.', flag('tutor-secret'), { kind: 'train', what: 'learnMove' })),
    ],
  },
  {
    id: 'charm-tinkerer', name: 'The Charm Tinkerer', group: G,
    intro: 'A workbench of tiny tools and a magnifying lamp. Bix, the tinkerer: "Two charms in, one blended charm out. Result shown first." The result, chalked on the board: a Twin Charm.',
    choices: [
      ch('Blend.', out('Bix melts two of your charms together over a tiny flame and taps them into one. A Twin Charm, exactly as chalked.', mk('payItem', { only: CHARMS, amount: 2 }), item('twin-charm')), { requires: [holds(CHARMS, 'two charms', 2)] }),
      ch('No.', out('"Charms keep," Bix says. "Bring two when you\'re ready."')),
    ],
  },
  {
    id: 'magnet-salesman', name: 'The Magnet Salesman', group: G,
    intro: `A salesman among floating Magnemite. "Gadgets that pull coins toward you. Slightly cursed." ₽${UNCOMMON}.`,
    choices: [
      ch('Buy.', out('He clips the gadget to your bag. Coins already seem to roll your way. So, faintly, does a Magnemite.', pay(UNCOMMON), { kind: 'tempEffect', label: 'Coin magnet: money +10%, more Steel-types in the wild', effects: [{ kind: 'moneyMultiplier', value: 1.1 }, { kind: 'typeEncounterWeight', type: 'steel', value: 1.5 }], until: 'region' }), need(UNCOMMON)),
      ch("What's the curse?", out('"Money comes ten percent faster. So do Steel-types: the wild ones notice you more." He shrugs. "For the region. Then it wears off."', stay('magnet-salesman'))),
      ch('No.', out('The Magnemite drift after you a little way, curious, then drift back.')),
    ],
  },
  {
    id: 'traveling-doctor', name: 'The Travelling Doctor', group: G,
    intro: 'A doctor\'s bag on a tree stump and a woman with kind eyes. Dr. Isolde Marsh: "Statuses cured. Hurts healed. No fee for the weeping." Her price list: ₽300 for the party.',
    choices: [
      ch('Heal (prices listed).', out('She works down the line, one Pokémon at a time, listening to each heartbeat. Everything that hurt stops hurting.', pay(300), heal(1), cure()), need(300)),
      ch("I'm weeping.", out('She sees that you are. She heals them all, and then sits with you a while, and does not charge a coin.', heal(1), cure())),
      ch('No.', out('"Take care of them," she says. "And yourself."')),
    ],
  },
  {
    id: 'apothecary-experiment', name: 'The Apothecary', group: G,
    intro: 'A table of bubbling flasks. Herne, the apothecary: "Test-drink a random potion. I pay ₽300 whatever happens." The bottle: a quarter each, a stat\'s effort up, one down, a nap, nothing.',
    choices: [
      ch('Drink.', out('Your lead drinks. Herne watches with a notebook, then pays ₽300 as promised.', $(300), mk('brew', {}))),
      ch('Read the effects.', out('Every effect on the label, with its odds: 25% a stat\'s effort up, 25% a stat\'s effort down, 25% a nap (half HP back), 25% nothing at all. "Honest science," Herne says.', stay('apothecary-experiment'))),
      ch('No.', out('Herne drinks one himself. Nothing happens. He writes that down too.')),
    ],
  },
  {
    id: 'repel-reseller', name: 'The Repel Reseller', group: G,
    intro: 'A crate of dented Super Repels. Slim, the seller: "Expired. Half effect, half price. Says so on the label." Half effect: they work like a plain Repel. ₽150 each.',
    choices: [
      ch('Buy.', out('Slim hands you one. The label says EXPIRED, then HALF EFFECT, then a sad face somebody drew.', pay(150), item('repel')), need(150)),
      ch('No.', out('"Can\'t blame you," Slim says.')),
    ],
  },
  {
    id: 'shady-vitamins', name: 'Shady Vitamins', group: G,
    intro: 'A crate of bottles with labels spelled wrong. A sign: "ONE IN FIVE IS REAL. WE DON\'T KNOW WHICH." ₽400 a bottle. Five guarantees one real one.',
    choices: [
      ch('Buy one.', out('You uncap it and sniff. You will find out.', mk('prize', { stake: 400, table: [...VITAMINS.map((v) => ({ weight: 1, label: 'A real one!', item: v })), { weight: 24, label: 'Coloured water' }] })), need(400)),
      ch('Buy five.', out('Five bottles. Four are coloured water. One is the real thing, as the sign promised.', pay(2000), { kind: 'itemFrom', ids: VITAMINS }), need(2000)),
      ch('No.', out('The sign creaks in the wind. Honest, at least.')),
    ],
  },
  {
    id: 'mystery-box', name: 'The Mystery Box', group: G,
    intro: 'A stack of sealed boxes. The seller: "Mystery boxes! ₽700! Odds on the lid." The lid: ₽300 coins 40%, an Ultra Ball 30%, a Revive 20%, a Rare Candy 10%.',
    choices: [
      ch('Buy.', out('You tear the tape off.', mk('prize', { stake: 700, table: [{ weight: 40, label: '₽300 in coins', money: 300 }, { weight: 30, label: 'An Ultra Ball', item: 'ultra-ball' }, { weight: 20, label: 'A Revive', item: 'revive' }, { weight: 10, label: 'A Rare Candy', item: 'rare-candy' }] })), need(700)),
      ch('Read the lid.', out('Four lines, four odds, nothing else in any box, ever.', stay('mystery-box'))),
      ch('No.', out('The seller shakes a box at you as you leave. It rattles enticingly.')),
    ],
  },
  {
    id: 'raffle-seller', name: 'The Raffle', group: G,
    intro: 'A kid with a drum of tickets. Tilly: "Win a tier-three item! More tickets, better odds!" The prize: a Life Orb. ₽50 a ticket, 1 in 50 per ticket.',
    choices: [
      ch('One ticket (50).', out('Tilly spins the drum and draws.', mk('prize', { stake: 50, table: [{ weight: 1, label: 'You won the Life Orb!', item: 'life-orb' }, { weight: 49, label: 'Not your number' }] })), need(50)),
      ch('Ten tickets.', out('Ten tickets, ten draws, Tilly calling each one.', mk('prize', { stake: 50, times: 10, table: [{ weight: 1, label: 'The Life Orb!', item: 'life-orb' }, { weight: 49, label: 'Not yours' }] })), need(50)),
      ch('No.', out('"Next time!" Tilly spins the drum anyway, for fun.')),
    ],
  },
  {
    id: 'clearance-rack', name: 'The Clearance Rack', group: G,
    intro: 'A rack of held items, 90% off: ₽250 each. The clerk: "One\'s cursed. Which one? The tag says what the curse does." Buy without reading and it\'s one of four.',
    choices: [
      ch('Buy one.', out('You grab one without reading.', mk('prize', { stake: 250, table: [{ weight: 1, label: 'An Expert Belt', item: 'expert-belt' }, { weight: 1, label: 'A Muscle Band', item: 'muscle-band' }, { weight: 1, label: 'Wise Glasses', item: 'wise-glasses' }, { weight: 1, label: 'The cursed one: a Sticky Barb', item: 'sticky-barb' }] })), need(250)),
      ch('Read every tag.', out('Expert Belt. Muscle Band. Wise Glasses. And a Sticky Barb: "CURSED: hurts whoever holds it, and clings." Now you know.', flag('clearance-read'), stay('clearance-rack'))),
      ch('No.', out('The clerk shrugs. "It\'ll all go eventually. Even the cursed one."')),
    ],
    remembers: [{ id: 'clearance-tags', when: [flagIs('clearance-read')], notice: 'You have read every tag.', hide: [0, 1],
      addChoices: [
        ch('Buy the Expert Belt.', out('₽250 for an Expert Belt. Not cursed.', pay(250), item('expert-belt')), need(250)),
        ch('Buy the Muscle Band.', out('₽250 for a Muscle Band. Not cursed.', pay(250), item('muscle-band')), need(250)),
      ] }],
  },
  {
    id: 'mr-mirage-merchant', name: 'The Mirage Merchant', group: G,
    intro: 'A merchant who shimmers at the edges like heat over sand. "Pay up front. I tend to vanish." Her goods: a Choice Scarf, ₽2,500, delivered two nodes on, on the path.',
    choices: [
      ch('Pay.', out('You pay. She fades, mid-smile, coins and all.', pay(RARE), flag('mirage-paid'), later('mirage-delivery', 2)), need(RARE)),
      ch('No.', out('She shimmers, and then she is not there.')),
    ],
  },
  room({
    id: 'mirage-delivery', name: 'The Mirage Merchant',
    intro: 'Two nodes on, the air shimmers on the path ahead, and there she is, holding out a Choice Scarf. "I said I tend to vanish. I never said I don\'t come back."',
    choices: [ch('Take it.', out('The Scarf is real, warm from the sun. She is gone again before you can say thank you.', item('choice-scarf'), flag('mirage-paid', -1)))],
  }),
  {
    id: 'rival-merchants', name: 'The Rival Merchants', group: G,
    intro: 'Two carts shouting prices at each other. Hobb: "Mine\'s better!" (Ultra Balls, ₽800.) Nelly: "Mine\'s cheaper!" (Great Balls, ₽500.) Buy from one and the other drops ten percent to win you back.',
    choices: [
      ch('Buy from Hobb.', out('Hobb crows. Nelly scowls and scribbles a new price on her board.', pay(800), item('ultra-ball'), flag('rival-hobb'), mk('comeBack', { event: 'rival-merchants' })), need(800)),
      ch('Buy from Nelly.', out('Nelly cheers. Hobb mutters and repaints a number on his cart.', pay(500), item('great-ball'), flag('rival-nelly'), mk('comeBack', { event: 'rival-merchants' })), need(500)),
      ch('Both.', out('Both of them are briefly speechless.', pay(1300), item('ultra-ball'), item('great-ball')), need(1300)),
    ],
    remembers: [
      { id: 'rival-nelly-cut', when: [flagIs('rival-hobb')], notice: 'Nelly has cut her price ten percent to win you back: Great Balls, ₽450.', hide: [1],
        addChoices: [ch('Buy from Nelly.', out('Nelly grins in triumph.', pay(450), item('great-ball'), flag('rival-hobb', -1), flag('rival-nelly'), mk('comeBack', { event: 'rival-merchants' })), need(450))] },
      { id: 'rival-hobb-cut', when: [flagIs('rival-nelly')], notice: 'Hobb has cut his price ten percent to win you back: Ultra Balls, ₽720.', hide: [0],
        addChoices: [ch('Buy from Hobb.', out('Hobb bows extravagantly.', pay(720), item('ultra-ball'), flag('rival-nelly', -1), flag('rival-hobb'), mk('comeBack', { event: 'rival-merchants' })), need(720))] },
    ],
  },
  {
    id: 'sign-language-market', name: 'The Sign-Language Market', group: G,
    intro: 'A trader who does not speak your language. She gestures at her Berries: three fingers, a flat palm, a circle. She waits, patient and amused.',
    choices: [
      ch('Three fingers (three of something).', out('She beams and counts out three Berries for three coins\' worth: ₽150. A fair price, because you understood.', pay(150), item('oran-berry', 3), flag('sign-vocab')), need(150)),
      ch('Flat palm (wait).', out('You hold up a flat palm. She nods, and waits with you, and the waiting is the word. She teaches you two more signs while you stand there.', flag('sign-vocab'), stay('sign-language-market'))),
      ch('Circle (a Berry).', out('A circle: one Berry. She hands it over for ₽50, and touches her chest. Fair.', pay(50), item('sitrus-berry'), flag('sign-vocab')), need(50)),
    ],
    remembers: [{ id: 'sign-fluent', when: [flagIs('sign-vocab', 3)], notice: 'You know her signs now. She greets you with one that means, as far as you can tell, "old friend".' }],
  },
  {
    id: 'r155-kecleon-bazaar', name: 'The Kecleon Bazaar', group: G,
    intro: 'A stall run by a Kecleon, its wares shimmering and changing colour. Press a stall and it shows its true item. Buy without looking for ₽1,200: half are what they seem (Leftovers), half are a Tiny Mushroom.',
    choices: [
      ch('Press each stall.', out('You press each one. Colours drain away, and the true items sit there plainly. One really is a Leftovers. The Kecleon nods: fair is fair.', flag('kecleon-pressed'), stay('r155-kecleon-bazaar'))),
      ch('Buy without looking.', out('You point and pay. The colour fades.', mk('prize', { stake: UNCOMMON, table: [{ weight: 1, label: 'Leftovers, as it seemed', item: 'leftovers' }, { weight: 1, label: 'A Big Mushroom in disguise', item: 'big-mushroom' }] })), need(UNCOMMON)),
      ch('Leave.', out('The Kecleon turns the colour of the wall and watches you go.')),
    ],
    remembers: [{ id: 'kecleon-known', when: [flagIs('kecleon-pressed')], notice: 'You know which stall holds the real Leftovers.', hide: [0],
      addChoices: [ch('Buy the true Leftovers.', out('₽1,200 for the stall you pressed. Leftovers, really. The Kecleon licks its eye approvingly.', pay(UNCOMMON), item('leftovers')), need(UNCOMMON))] }],
  },
  {
    id: 'strangers-map', name: "The Stranger's Map", group: G,
    intro: 'A hooded stranger with a rolled map. "It leads to a Legendary\'s lair. ₽500. My share\'s included if you find one: ₽500 more, only if you catch it."',
    choices: [
      ch('Buy.', out('The map is old and careful. A waterfall, three nodes on, and a mark behind it.', pay(500), flag('strangers-map'), later('strangers-map-lair', 3)), need(500)),
      ch('Why sell it?', out('"I found it. I went. I looked at what was sleeping there and I couldn\'t." The stranger pulls the hood lower. "Maybe you can."', stay('strangers-map'))),
      ch('No.', out('The stranger nods, unsurprised, and walks on.')),
    ],
  },
  room({
    id: 'strangers-map-lair', name: 'The Hidden Lair',
    intro: 'Behind the waterfall, a cave, and in the cave, something vast and sleeping, breathing slowly. The map was real.',
    choices: [
      ch('Wake it.', fight('It opens its eyes. The whole cave holds its breath.', { ...wild({ species: LEGENDS, lv: 5 }), friendly: true, win: [stay('strangers-map-share')] })),
      ch('Let it sleep.', out('You back away quietly. Some things are better left dreaming. You leave the map on a rock for the next one.', flag('strangers-map', -1))),
    ],
  }),
  room({
    id: 'strangers-map-share', name: 'The Hidden Lair',
    intro: 'Outside the waterfall, the stranger is waiting, hood dripping. "Well?" The share is ₽500, only if you caught it.',
    choices: [
      ch('Pay 500 (I caught it).', out('The stranger takes it, looks at you a long moment, and nods. "Look after it."', pay(500), flag('strangers-map', -1)), need(500)),
      ch('It got away.', out('"Then you owe me nothing." The stranger smiles, just slightly. "That\'s the deal."', flag('strangers-map', -1))),
    ],
  }),
  {
    id: 'token-exchange', name: 'The Token Exchange', group: G,
    intro: 'A stall with a price board. The stallholder: "Nuggets, Star Pieces, Comet Shards. Prices posted." The board shows the fair price of every token.',
    choices: [
      ch('Exchange.', out('She weighs each token and pays exactly the posted price.', mk('sell', { pick: 'curio', factor: 1, only: ['nugget', 'big-nugget', 'star-piece', 'comet-shard'] }))),
      ch('No.', out('"Prices don\'t change," she says. "Come back whenever."')),
    ],
  },
];

export const REMOVE: string[] = [];
