// Run events A (docs/ideas/categories/r-a-merchants-deals-and-swaps.md): merchants, deals and swaps, R1-R50.
// Written with the DSL; tools/build-merchant-events.ts writes them to src/data/eventsMerchants.json.
// Skipped because they already exist: R16 (risky-loan / repay-banker) and R29 (lost-and-found-desk).
// Delayed payoffs (R5, R6, R15, R31, R39, R42) are a flag now and a callback event on a later stage.
import { $, any, ch, ev, flag, flagIs, good, evil, has, heal, hurt, item, leave, lose, money, out, fight, rp, status, attr, trainer, relic, type Json } from './dsl.ts';

const G = 'Merchants & Deals';
const moment = (text: string, importance = 55): Json => ({ kind: 'moment', text, importance });
const mon = (value: number): Json => ({ kind: 'moneyMultiplier', value });
const xpm = (value: number): Json => ({ kind: 'xpMultiplier', value });
const cap = (value: number): Json => ({ kind: 'captureMultiplier', value });
const M = (id: string, name: string, o: Parameters<typeof ev>[3], intro: string, choices: Json[]): Json =>
  ev(id, name, G, { cast: ['trainer.worker_m'], tint: '#2b2a1e', ...o }, intro, choices);
const need = (n: number) => ({ requires: [money(n)] });
const L = (id: string) => ({ requires: [has(id)] });
const BERRY = ['oran-berry', 'sitrus-berry', 'lum-berry', 'pecha-berry', 'cheri-berry', 'rawst-berry'];
const POTIONS = ['potion', 'super-potion', 'hyper-potion'];
const T3 = ['rare-candy', 'max-potion', 'life-orb', 'choice-band', 'choice-scarf', 'choice-specs', 'focus-sash', 'leftovers', 'eviolite'];
const TIER2 = ['leftovers', 'focus-sash', 'scope-lens', 'wide-lens', 'muscle-band', 'wise-glasses', 'expert-belt', 'quick-claw'];
const TIER1 = ['oran-berry', 'sitrus-berry', 'x-attack', 'x-speed', 'dire-hit', 'guard-spec', 'potion', 'super-potion'];
const LURES = ['fire-lure', 'water-lure', 'grass-lure', 'electric-lure', 'rock-lure', 'bug-lure'];

export const MERCHANT_EVENTS: Json[] = [
  // ---- Batch 1: R1-R10 ----
  M('honest-hawker', 'The Honest Hawker', { rarity: 'common' },
    'A hawker waves a single potion in the air. "One item, exact shop price, no tricks! Say thanks and I throw in a berry."', [
      ch('Buy a Hyper Potion (₽300)', out('"Thank you!" you say. He beams and tosses a berry on top.', $(-300), item('hyper-potion'), any(...BERRY), good(1)), need(300)),
      ch('Buy a Great Ball set (₽200)', out('Fair price, polite words, a free berry.', $(-200), item('great-ball', 3), any(...BERRY)), need(200)),
      ch('Say thanks and walk on', out('"Always a pleasure!" He presses a berry into your hand anyway.', any(...BERRY), good(1))),
    ]),
  M('barter-barge', 'The Barter Barge', { rarity: 'uncommon', cast: ['trainer.fisherman'] },
    'A flat barge piled with crates drifts by the dock. "No coins here. Hand me two items, I hand you one better."', [
      ch('Swap a Potion and a berry for a hold item', out('The deckhand weighs your offer and nods. The deal is struck.', lose('potion'), lose('oran-berry'), any(...TIER2)), { requires: [has('potion'), has('oran-berry')] }),
      ch('Swap a Poké Ball and a Potion for a strong item', out('Two small items go in the basket. A better one comes out.', lose('poke-ball'), lose('potion'), any(...T3)), { requires: [has('poke-ball'), has('potion')] }),
      ch('Swap a Potion and a Poké Ball (Charisma)', out('You talk the trade up a tier. The deckhand grumbles but pays.', lose('potion'), lose('poke-ball'), any(...T3)), { requires: [has('potion'), has('poke-ball')], check: 'charisma', fail: out('He only pays a plain item for the pair.', lose('potion'), lose('poke-ball'), any(...TIER1)) }),
      ch('Leave the barge', leave('The barge drifts on.')),
    ]),
  M('mismatched-socks', 'The Mismatched Socks Sale', { rarity: 'common' },
    'A stall of footwear, every pair odd. "Speed boots! Left one is a size nine, right one a size six. Still fast!"', [
      ch('Buy the pair (₽250)', out('One boot does not quite fit, but you feel quicker. Three X Speed charges come with them.', $(-250), item('x-speed', 3)), need(250)),
      ch('Buy just one boot (₽100)', out('A single boot. It helps a little, once.', $(-100), item('x-speed', 1)), need(100)),
      ch('Skip the sale', out('You leave. The seller sighs and shuffles his boots.')),
    ]),
  M('coupon-clipper', 'The Coupon Clipper', { rarity: 'common', cast: ['trainer.aroma_lady'] },
    'A woman with a binder full of coupons beams at you. "Thirty percent off! Next shop only. Do not lose it."', [
      ch('Take the 30% coupon (₽80)', out('You pocket the coupon. It will work at the next shop you visit.', $(-80), item('coupon-3')), need(80)),
      ch('Help her sort her coupons (Intelligence)', out('She is delighted and hands you a coupon for free.', item('coupon-3'), rp(1)), { check: 'intelligence', fail: out('You mix up the piles. She takes your help as a joke and gives you a smaller coupon.', item('coupon-1')) }),
      ch('No thanks', leave()),
    ]),
  M('subscription-box', 'The Subscription Box', { rarity: 'uncommon' },
    'A courier thrusts a clipboard at you. "Pay once, and a surprise item arrives after each of your next three battles!"', [
      ch('Subscribe (₽450)', out('The courier stamps your card. Deliveries start soon.', $(-450), flag('sub-box', 3)), need(450)),
      ch('Ask for a trial box (₽120)', out('One small parcel now, nothing after.', $(-120), any(...TIER1)), need(120)),
      ch('Decline politely', leave()),
    ]),
  M('subscription-box-delivery', 'A Parcel for You', { rarity: 'rare', callback: true, requires: [flagIs('sub-box', 1)] },
    'The courier is back with a neat box. "Your subscription! Surprise!"', [
      ch('Open the box', out('Something nice, wrapped carefully. The courier waves goodbye.', any(...TIER2, ...T3), flag('sub-box', -1))),
    ]),
  M('layaway-lady', 'The Layaway Lady', { rarity: 'uncommon', cast: ['trainer.aroma_lady'] },
    'A shopkeeper with a ledger taps a locked case. "Half now, the rest is ours. It will be with you in a couple of towns."', [
      ch('Put a rare item on layaway (₽400)', out('She writes your name in the ledger. "Two more stops, dear."', $(-400), flag('layaway', 1)), need(400)),
      ch('Put a lesser item on layaway (₽150)', out('A smaller deal, a smaller wait.', $(-150), flag('layaway-small', 1)), need(150)),
      ch('Not today', leave()),
    ]),
  M('layaway-pickup', 'Your Layaway Is Ready', { rarity: 'rare', callback: true, requires: [flagIs('layaway', 1)] },
    'The Layaway Lady waves at you across the street. "It has arrived, dear!"', [
      ch('Collect your item', out('She hands over a sealed case. It was worth the wait.', any(...T3), flag('layaway', -1))),
    ]),
  M('layaway-pickup-small', 'Your Layaway Is Ready (Small)', { rarity: 'rare', callback: true, requires: [flagIs('layaway-small', 1)] },
    'The Layaway Lady flags you down with a paper bag. "The small one is here!"', [
      ch('Collect your item', out('A tidy package with a handwritten receipt.', any(...TIER2), flag('layaway-small', -1))),
    ]),
  M('rental-counter', 'The Rental Counter', { rarity: 'uncommon' },
    'A counter with a "Hold Items for Rent" sign. "Five battles, then it comes back to me. Do not scratch it."', [
      ch('Rent a Life Orb (₽200)', out('You hand over the fee. The orb hums in your pocket.', $(-200), item('life-orb'), flag('rental-due', 5)), need(200)),
      ch('Rent a Choice Scarf (₽200)', out('The scarf fits. Speed is yours for a short while.', $(-200), item('choice-scarf'), flag('rental-due', 5)), need(200)),
      ch('Not renting', leave()),
    ]),
  M('rental-return', 'The Rental Is Due', { rarity: 'rare', callback: true, requires: [flagIs('rental-due', 1)] },
    'The Rental Counter clerk jogs up, out of breath. "Time is up! I need that item back."', [
      ch('Hand back a Life Orb', out('He checks it for scratches and nods.', lose('life-orb'), flag('rental-due', -5), good(1)), L('life-orb')),
      ch('Hand back a Choice Scarf', out('He smooths the fabric and thanks you.', lose('choice-scarf'), flag('rental-due', -5), good(1)), L('choice-scarf')),
      ch('Claim you lost it', out('He sighs and bills you for the item.', $(-400), flag('rental-due', -5), evil(1)), { ...need(400) }),
      ch('Run', out('You bolt. He shouts something about a fee.', flag('rental-due', -5), evil(2))),
    ]),
  M('price-match-guy', 'The Price Match Guy', { rarity: 'common' },
    'A man shows you a worn notebook. "Cheapest price I ever saw. Bring me a deal and I will match it for one item."', [
      ch('Match a Hyper Potion (₽180)', out('He matches it. A fair deal, written in his notebook.', $(-180), item('hyper-potion')), need(180)),
      ch('Match a Revive (₽400)', out('"Never saw it cheaper." He hands over a Revive.', $(-400), item('revive')), need(400)),
      ch('Match an Ultra Ball set (₽250)', out('Three Ultra Balls for a price he swears is the lowest in town.', $(-250), item('ultra-ball', 3)), need(250)),
      ch('Leave', leave()),
    ]),
  M('bulk-buyer', 'The Bulk Buyer', { rarity: 'uncommon' },
    'A buyer in a hard hat holds a calculator. "I sell nothing. I pay double for stacks of identical things."', [
      ch('Sell a Potion', out('He counts it twice, then pays double.', lose('potion'), $(120)), L('potion')),
      ch('Sell a Super Potion', out('A tidy item. The buyer pays a strong price.', lose('super-potion'), $(260)), L('super-potion')),
      ch('Sell a Poké Ball', out('He weighs the ball and nods.', lose('poke-ball'), $(100)), L('poke-ball')),
      ch('Keep your stock', leave()),
    ]),
  M('wholesale-warehouse', 'The Wholesale Warehouse', { rarity: 'uncommon' },
    'A warehouse with stacked pallets. "Five of anything, steep discount. No singles."', [
      ch('Five Potions (₽300)', out('A pallet of potions, heavy and cheap.', $(-300), item('potion', 5)), need(300)),
      ch('Five Super Potions (₽500)', out('A strong stack for a small price.', $(-500), item('super-potion', 5)), need(500)),
      ch('Five Poké Balls (₽350)', out('A crate of balls for the road.', $(-350), item('poke-ball', 5)), need(350)),
      ch('Walk past', leave()),
    ]),

  // ---- Batch 2: R11-R20 ----
  M('clearance-rack', 'The Clearance Rack of Doom', { rarity: 'uncommon', tint: '#3a1a1a' },
    'A crooked rack, a hand-painted "90% OFF" sign. "One of these is cursed. Which one? Nobody knows."', [
      ch('Grab an item (₽60)', out('Cheap. You feel a little odd afterward.', $(-60), any(...TIER2), hurt(0.1)), { ...need(60), chance: 0.7, fail: out('It was the cursed one. Your Pokémon shudder.', $(-60), hurt(0.15), status('poison')) }),
      ch('Grab three items (₽150)', out('A bagful of bargains and a bad feeling.', $(-150), any(...TIER2), any(...TIER1), any(...T3), hurt(0.1)), { ...need(150), chance: 0.5, fail: out('Cursed. The whole bag smells of old socks and bad luck.', $(-150), hurt(0.2), evil(1)) }),
      ch('Leave the rack', leave()),
    ]),
  M('auction-popup', 'The Auction Pop-up', { rarity: 'rare', cast: ['trainer.roughneck'], minStage: 2 },
    'A pop-up auction: an NPC in a suit, a smug rival, and a Rocket grunt in sunglasses. The lot is a sealed crate.', [
      ch('Bid ₽300', out('You outbid the suit. The grunt scowls, the rival laughs.', $(-300), any(...TIER2)), { ...need(300), chance: 0.45, fail: out('The suit raises. You lose the lot and keep your coins.') }),
      ch('Bid ₽700', out('Everyone drops out. The crate is yours.', $(-700), any(...T3)), { ...need(700), chance: 0.7, fail: out('The rival bids ₽900. You walk away poorer in pride only.') }),
      ch('Bid ₽1200', out('Silence. Then the gavel. The crate holds treasure.', $(-1200), any(...T3), item('rare-candy')), { ...need(1200), chance: 0.9, fail: out('The grunt snatches the lot and runs. You lose nothing.') }),
      ch('Watch and leave', leave('You enjoy the shouting and walk on.')),
    ]),
  M('silent-auction', 'The Silent Auction', { rarity: 'uncommon', cast: ['trainer.gentleman'] },
    'A quiet room with slips of paper and a locked case. "Write your bid. Closest to the hidden value wins."', [
      ch('Low bid (₽200)', out('Your slip is the closest. The item is yours.', $(-200), any(...TIER2)), { ...need(200), check: 'intelligence', fail: out('Someone guessed closer. The slip is returned.') }),
      ch('Mid bid (₽500)', out('Right on target. The clerk hands over the case.', $(-500), any(...T3)), { ...need(500), check: 'luck', fail: out('Too high. You lose the money on a rare mistake.', $(-100)) }),
      ch('High bid (₽900)', out('Almost exact. A grand prize.', $(-900), item('rare-candy'), any(...T3)), { ...need(900), chance: 0.5, fail: out('Way over. The winner pays less. You gain nothing.', $(-200)) }),
      ch('Do not bid', leave()),
    ]),
  M('raffle-seller', 'The Raffle Seller', { rarity: 'uncommon' },
    'A kid with a drum of paper tickets. "Win a tier-three item! The more tickets, the better your odds."', [
      ch('One ticket (₽50)', out('Your number comes up! A shiny prize.', $(-50), any(...T3)), { ...need(50), chance: 0.15, fail: out('A lucky stranger wins. You get nothing.', $(-50)) }),
      ch('Five tickets (₽200)', out('Your number comes up! A shiny prize.', $(-200), any(...T3)), { ...need(200), chance: 0.4, fail: out('Not today. The kid offers you a consolation berry.', $(-200), any(...BERRY)) }),
      ch('Fifteen tickets (₽500)', out('A whole fistful, and one of them wins.', $(-500), any(...T3), item('rare-candy')), { ...need(500), chance: 0.7, fail: out('So many tickets, so little luck. A berry for the effort.', $(-500), any(...BERRY)) }),
      ch('No tickets', leave()),
    ]),
  M('pawn-sharks', 'The Pawn Sharks', { rarity: 'uncommon', tint: '#2a1a2a' },
    'Two men in sharp suits lean on a counter. "Sell it now. Buy it back later. We mark it up. It is only business."', [
      ch('Pawn Leftovers (₽500 now)', out('They take the item and hand you cash. "Come see us again."', lose('leftovers'), $(500), flag('pawned', 1)), L('leftovers')),
      ch('Pawn a berry (₽200 now)', out('A small pawn. They smile too widely.', lose('oran-berry'), $(200), flag('pawned-small', 1)), L('oran-berry')),
      ch('Walk away', leave()),
    ]),
  M('pawn-sharks-buyback', 'The Pawn Sharks Again', { rarity: 'rare', callback: true, requires: [flagIs('pawned', 1)] },
    'The same two men corner you outside a shop. "Want your item back? It will cost more now."', [
      ch('Buy it back (₽800)', out('They hand it over without a smile.', $(-800), item('leftovers'), flag('pawned', -1)), need(800)),
      ch('Let them keep it', out('"Business is business."', flag('pawned', -1), evil(1))),
    ]),
  M('pawn-sharks-buyback-small', 'The Pawn Sharks Again (Berry)', { rarity: 'rare', callback: true, requires: [flagIs('pawned-small', 1)] },
    'The pawn sharks tip their hats. "That berry, friend. Still want it?"', [
      ch('Buy it back (₽350)', out('A slightly bruised berry returns to your bag.', $(-350), item('oran-berry'), flag('pawned-small', -1)), need(350)),
      ch('Let them keep it', out('They shrug and move on.', flag('pawned-small', -1))),
    ]),
  M('street-tailor', 'The Street Tailor', { rarity: 'common', cast: ['trainer.fairy_tale_girl'] },
    'A tailor with a mouthful of pins and a measuring tape. "Let me swap your outfit. A small perk comes with the new look."', [
      ch('Sharp suit (Charisma +1)', out('You look the part. People listen.', attr('charisma', 1), $(-80)), need(80)),
      ch('Trail gear (Strength +1)', out('Sturdy boots and a tough coat.', attr('strength', 1), $(-80)), need(80)),
      ch('Scholar robe (Intelligence +1)', out('A neat cut and deep pockets.', attr('intelligence', 1), $(-80)), need(80)),
      ch('Keep your clothes', leave()),
    ]),
  M('charm-tinkerer', 'The Charm Tinkerer', { rarity: 'rare', cast: ['trainer.psychic_m'] },
    'A tinkerer hunches over a desk of bells and beads. "Two charms in, one blended charm out. Weaker, but it hums."', [
      ch('Blend two charms', out('Gears whir. A single faint charm comes out.', lose('lucky-charm'), lose('charm-coin'), item('old-charm')), { requires: [has('lucky-charm'), has('charm-coin')] }),
      ch('Blend Lucky + Catching', out('A soft glow and a smaller catch bonus.', lose('lucky-charm'), lose('catching-charm'), relic('blended-charm', 'Blended Charm', [cap(1.1), xpm(1.03)])), { requires: [has('lucky-charm'), has('catching-charm')] }),
      ch('Walk away', leave()),
    ]),
  M('mystery-meat-cart', 'The Mystery Meat Cart', { rarity: 'common' },
    'A cart with a hot plate and a handwritten menu. "Cheap, hearty, and probably meat."', [
      ch('Buy a skewer (₽40)', out('Your team wolfs it down and feels sturdier.', $(-40), heal(0.3)), { ...need(40), chance: 0.85, fail: out('The skewer was off. Your team wolfs it anyway and pays for it.', $(-40), status('poison')) }),
      ch('Buy a feast (₽120)', out('A feast fit for a party. Everyone feels better.', $(-120), heal(0.6)), { ...need(120), chance: 0.7, fail: out('The feast was off. Your team is miserable.', $(-120), status('poison'), hurt(0.1)) }),
      ch('Walk on', leave()),
    ]),
  M('ball-pitchman', 'The Poké Ball Pitchman', { rarity: 'uncommon', cast: ['trainer.guitarist'] },
    'A pitchman bangs a table. "The Mega-Gripper! The Sure-Snatch 3000! The Whisper Ball! Call now and get a second free!"', [
      ch('The Mega-Gripper (₽300)', out('A stout ball with a firm hinge. You get a second for free.', $(-300), item('great-ball', 2), item('net-ball')), need(300)),
      ch('The Sure-Snatch 3000 (₽450)', out('Loud paint and a flashy sticker. It works, mostly.', $(-450), item('ultra-ball', 2), item('quick-ball')), need(450)),
      ch('The Whisper Ball (₽250)', out('A pale ball that makes no sound. Three come in the box.', $(-250), item('dusk-ball', 2), item('timer-ball')), need(250)),
      ch('Pass', leave()),
    ]),

  // ---- Batch 3: R21-R30 ----
  M('vending-machine', 'The Vending Machine', { rarity: 'common', stop: 'event', cast: [], effect: 'glint' },
    'A glowing vending machine hums by the road. Something rattles inside.', [
      ch('Insert coins (₽100)', out('Clunk. A drink rolls out.', $(-100), any(...POTIONS, ...BERRY)), need(100)),
      ch('Insert a lot of coins (₽300)', out('Clunk-clunk. A hearty haul drops.', $(-300), any(...TIER2, ...T3)), need(300)),
      ch('Shake it for a free one', out('Something big drops out. The machine shivers.', any(...TIER1)), { chance: 0.5, fail: out('An angry Rotom bursts out of the machine and zaps your team.', hurt(0.15), status('paralysis')) }),
      ch('Walk on', leave()),
    ]),
  M('capsule-gacha', 'The Capsule Gacha', { rarity: 'common', stop: 'event', cast: [], effect: 'glint' },
    'A toy machine with a crank. "Each spin: a random cosmetic or a tiny perk."', [
      ch('Spin once (₽60)', out('A capsule pops open: a tiny charm!', $(-60), any(...TIER1, 'charm-coin')), need(60)),
      ch('Spin five times (₽250)', out('Five capsules, a pile of trinkets and a nice surprise.', $(-250), any(...T3), any(...BERRY)), need(250)),
      ch('Walk past', leave()),
    ]),
  M('flea-fossil', 'The Flea Market Fossil', { rarity: 'uncommon', cast: ['trainer.hiker'] },
    'A hobbyist guards a gray lump on a rickety table. "Real fossil! Or a rock. The reveal costs money."', [
      ch('Pay to crack it open (₽200)', out('It is a fossil, and a good one.', $(-200), any('old-amber', 'helix-fossil', 'dome-fossil')), { ...need(200), chance: 0.4, fail: out('Just a rock. The hobbyist shrugs.', $(-200)) }),
      ch('Pay a lot for the best tools (₽500)', out('A perfect fossil and a Revive tucked inside.', $(-500), any('old-amber', 'helix-fossil', 'dome-fossil'), item('revive')), { ...need(500), chance: 0.7, fail: out('A rock and a story about a rock.', $(-500), rp(1)) }),
      ch('Keep your coins', leave()),
    ]),
  M('bait-bargain', 'The Bait Shop Bargain', { rarity: 'common', cast: ['trainer.fisherman'] },
    'A bait shop owner winks. "Lures that raise your odds of rare finds. Good for three stops."', [
      ch('One lure (₽180)', out('A lure for the road. Rare finds feel closer.', $(-180), any(...LURES)), need(180)),
      ch('Three lures (₽450)', out('A tackle box of lures.', $(-450), any(...LURES), any(...LURES), any(...LURES)), need(450)),
      ch('Not today', leave()),
    ]),
  M('repel-reseller', 'The Repel Reseller', { rarity: 'common', cast: ['trainer.roughneck'] },
    'A shifty man peels open a coat of spray bottles. "Expired Repels. Half effect, dirt cheap."', [
      ch('Buy a Repel (₽120)', out('It smells a bit off, but it works.', $(-120), item('repel')), need(120)),
      ch('Buy three Repels (₽300)', out('A discount bundle, all expired.', $(-300), item('repel', 3)), need(300)),
      ch('Decline', leave()),
    ]),
  M('scalper-alley', 'Scalper Alley', { rarity: 'uncommon', tint: '#201a28', cast: ['trainer.roughneck'] },
    'A scalper holds a tier-three item high. "Triple price. Take it or leave it. Or haggle, if you can."', [
      ch('Pay triple (₽1200)', out('You pay the premium. It stings and it works.', $(-1200), any(...T3)), need(1200)),
      ch('Haggle (Charisma)', out('You haggle him down to a decent price.', $(-500), any(...T3)), { ...need(500), check: 'charisma', fail: out('He laughs and raises the price. You walk away.') }),
      ch('Turn him in', out('You flag a patrol. A reward comes through the post.', good(1), $(150))),
      ch('Walk on', leave()),
    ]),
  M('estate-sale', 'The Estate Sale', { rarity: 'rare', cast: ['trainer.aroma_lady'] },
    'A house full of items, a sign reading "Everything must go". A relative stands in the doorway with crossed arms.', [
      ch('Take two items', out('You pick two. The relative glares at your back.', any(...T3), any(...TIER2), evil(1)), { chance: 0.7, fail: out('The relative drags you out. You leave with one item.', any(...TIER1)) }),
      ch('Take one item and thank her', out('She softens and lets you take a keepsake as well.', any(...TIER2), item('heart-scale'), good(1))),
      ch('Leave respectfully', leave()),
    ]),
  M('retired-champ-garage', 'The Retired Champion\'s Garage Sale', { rarity: 'epic', minStage: 4, cast: ['trainer.hiker'] },
    'A retired champion sits among old trophies. "Three signature items for sale. I will not need them where I am going."', [
      ch('Buy the signature scarf (₽700)', out('A scarf that has seen many finals.', $(-700), item('choice-scarf')), need(700)),
      ch('Buy the signature belt (₽700)', out('The champion\'s belt, still creased from use.', $(-700), item('expert-belt')), need(700)),
      ch('Buy the signature sash (₽700)', out('A sash that survived a hundred hits.', $(-700), item('focus-sash')), need(700)),
      ch('Chat about old battles', out('A long story, a small gift.', rp(3), item('rare-candy'))),
    ]),
  M('gift-wrap-station', 'The Gift Wrap Station', { rarity: 'common', cast: ['trainer.aroma_lady'] },
    'A booth with ribbons and tape. "Wrap an item and hand it to the next person you meet. They will remember."', [
      ch('Wrap a berry', out('A tidy bow. It will find its recipient.', lose('oran-berry'), flag('gift-wrap', 1)), L('oran-berry')),
      ch('Wrap a Potion', out('A cheerful ribbon on a plain Potion.', lose('potion'), flag('gift-wrap', 1)), L('potion')),
      ch('Skip it', leave()),
    ]),
  M('gift-wrap-receiver', 'The Gift Returned', { rarity: 'rare', callback: true, requires: [flagIs('gift-wrap', 1)] },
    'A stranger waves you down, holding your wrapped gift. "A friend sent this ahead. They said you would pass by."', [
      ch('Take the bonus', out('The stranger grins. "A gift for a gift!"', flag('gift-wrap', -1), good(1), any(...TIER2, ...T3))),
    ]),

  // ---- Batch 4: R31-R40 ----
  M('delivery-rider', 'The Delivery Rider', { rarity: 'uncommon', cast: ['trainer.biker'] },
    'A rider in a helmet hands you a package. "Carry this three stops. Do not open it. Payment on delivery."', [
      ch('Accept the parcel', out('You tuck the parcel carefully into your Bag.', flag('parcel', 1)), {}),
      ch('Decline', leave()),
    ]),
  M('delivery-rider-drop', 'The Parcel Is Due', { rarity: 'rare', callback: true, requires: [flagIs('parcel', 1)] },
    'A familiar rider waits at a crossing. "Did you bring it?"', [
      ch('Deliver it unopened', out('"Perfect." Payment and a thank-you.', $(700), good(1), flag('parcel', -1))),
      ch('Peek inside first', out('You peek. The rider glares. Inside: a decent item. You keep it.', any(...TIER2), evil(1), flag('parcel', -1))),
    ]),
  M('berry-smoothie', 'The Pawn Berry Smoothie', { rarity: 'common', cast: ['trainer.aroma_lady'] },
    'A smoothie bar run out of a cart. "Blend three berries into a temporary buff drink."', [
      ch('Blend 3 Oran berries', out('A rich blue drink. Your lead feels strong.', lose('oran-berry'), lose('oran-berry'), lose('oran-berry'), item('x-attack'), item('x-speed')), L('oran-berry')),
      ch('Blend 3 Sitrus berries', out('A wild purple drink. Your team feels sharp.', lose('sitrus-berry'), lose('sitrus-berry'), lose('sitrus-berry'), item('x-speed'), item('dire-hit')), L('sitrus-berry')),
      ch('Just drink one', out('Fresh and cold.', heal(0.2), $(-30)), need(30)),
      ch('Walk on', leave()),
    ]),
  M('mart-truck', 'The Mobile Poké Mart Truck', { rarity: 'uncommon', cast: ['trainer.worker_m'] },
    'A truck pulls over for one node only. Its stock is random, the driver says, and tomorrow it will be gone.', [
      ch('Buy a random bundle (₽300)', out('The driver tosses in whatever is on the shelf.', $(-300), any(...TIER1), any(...TIER2)), need(300)),
      ch('Buy a big random bundle (₽700)', out('A full crate rattles out.', $(-700), any(...T3), any(...TIER2), any(...TIER1)), need(700)),
      ch('Browse only', leave('You browse. The driver tips his cap.')),
    ]),
  M('black-friday', 'The Black Friday Stampede', { rarity: 'rare', cast: ['trainer.worker_m'] },
    'A crowd stampedes a shop opening. "First pick goes to whoever pushes the hardest!"', [
      ch('Fight through the swarm', fight('The crowd turns and a shopper swarm swings at you. Fight for first pick!', trainer('Shopper Swarm', { cls: 'worker', size: 3, lv: 1, win: [any(...T3), item('rare-candy'), $(300)] }), hurt(0.05))),
      ch('Wait for the crowd to thin (Luck)', out('The crowd drifts off. You pick the leftovers.', any(...TIER2)), { check: 'luck', fail: out('Nothing is left but a bent shelf.', $(30)) }),
      ch('Slip away', leave()),
    ]),
  M('counterfeit-cop', 'The Counterfeit Charm Cop', { rarity: 'uncommon', cast: ['trainer.roughneck'] },
    'A cop eyes a charm vendor. "That charm is a fake. I need a witness. Or you could buy a fake cheap."', [
      ch('Report the seller', out('The cop thanks you and slips you a reward.', $(400), good(2)), {}),
      ch('Buy the fake cheap (₽60)', out('A fake charm. It does something odd, anyway.', $(-60), item('old-charm'), evil(1)), { ...need(60), chance: 0.6, fail: out('Totally fake. The seller laughs and the cop watches.', $(-60), evil(1)) }),
      ch('Walk away', leave()),
    ]),
  M('magnet-salesman', 'The Magnet Salesman', { rarity: 'uncommon', cast: ['trainer.guitarist'] },
    'A salesman stands among floating Magnemite. "Gadgets that pull coins toward you. Slightly magnetic, slightly cursed."', [
      ch('Buy the Coin Magnet (₽500)', out('A gadget hums. Coins feel drawn to your pocket.', $(-500), relic('coin-magnet', 'Coin Magnet', [mon(1.1)])), need(500)),
      ch('Buy the Big Magnet (₽800)', out('A stronger gadget, noisy and heavy.', $(-800), relic('big-magnet', 'Big Magnet', [mon(1.2)])), need(800)),
      ch('Decline', leave()),
    ]),
  M('smugglers-crate', 'The Smuggler\'s Crate', { rarity: 'rare', tint: '#1c1020', cast: ['trainer.roughneck'] },
    'A smuggler pats a stenciled crate. "Unopened. Contents may include a banned item. No refunds."', [
      ch('Buy the crate (₽400)', out('The crate holds a haul of gear. A patrol passes you without looking.', $(-400), any(...T3), any(...TIER2)), { ...need(400), chance: 0.6, fail: out('Banned goods. A patrol confiscates the crate and fines you.', $(-100), evil(1)) }),
      ch('Turn him in', out('The patrol thanks you with a reward.', $(300), good(1))),
      ch('Walk on', leave()),
    ]),
  M('rebate-booth', 'The Rebate Booth', { rarity: 'common' },
    'A booth with a hand-drawn "REBATE" sign. "Refund of twenty percent of your last purchase."', [
      ch('Claim a rebate', out('The clerk counts out some coins.', $(150), good(1)), {}),
      ch('Ask for a bigger one (Charisma)', out('The clerk sighs and counts out more.', $(350)), { check: 'charisma', fail: out('"Rebate denied." You are shown out.') }),
      ch('Skip', leave()),
    ]),
  M('bank-teller', 'The Bank Teller', { rarity: 'uncommon', cast: ['trainer.gentleman'] },
    'A teller behind brass bars. "Deposit now. At the next bank stop, you will get ten percent back."', [
      ch('Deposit ₽500', out('The teller stamps your slip. "See you later."', $(-500), flag('deposit-500', 1)), need(500)),
      ch('Deposit ₽1000', out('A heavier slip, a bigger smile.', $(-1000), flag('deposit-1000', 1)), need(1000)),
      ch('No deposit', leave()),
    ]),
  M('bank-teller-return', 'The Teller Returns', { rarity: 'rare', callback: true, requires: [flagIs('deposit-500', 1)] },
    'The same teller waves from an open window. "Your deposit has matured."', [
      ch('Withdraw it', out('You get your money back, with interest.', $(550), flag('deposit-500', -1))),
    ]),
  M('bank-teller-return-big', 'The Teller Returns (Big)', { rarity: 'rare', callback: true, requires: [flagIs('deposit-1000', 1)] },
    'The teller waves a thick envelope. "Interest at last."', [
      ch('Withdraw it', out('A thick envelope of cash.', $(1100), flag('deposit-1000', -1))),
    ]),
  M('currency-exchanger', 'The Currency Exchanger', { rarity: 'common' },
    'A counter with two glass jars. "Money to Battle Points, or back again. Rates posted on the wall."', [
      ch('Money to research points (₽400)', out('Four hundred coins turn into research notes.', $(-400), rp(3)), need(400)),
      ch('Research points to money', out('Notes turn into coins.', rp(1), $(150))),
      ch('No exchange', leave()),
    ]),

  // ---- Batch 5: R41-R50 ----
  M('mismatched-mart', 'The Mismatched Mart', { rarity: 'common', stop: 'shop' },
    'A mart stocking only one type\'s items today. A wall calendar tracks the rotation.', [
      ch('Fire day (₽250)', out('Today it is all fire: lures and charcoal.', $(-250), item('fire-lure'), item('charcoal')), need(250)),
      ch('Water day (₽250)', out('Today it is all water: lures and mystic water.', $(-250), item('water-lure'), item('mystic-water')), need(250)),
      ch('Grass day (₽250)', out('Today it is all grass: lures and seeds.', $(-250), item('grass-lure'), item('miracle-seed')), need(250)),
      ch('Not today', leave()),
    ]),
  M('second-chances', 'The Seller of Second Chances', { rarity: 'rare', cast: ['trainer.psychic_m'], tint: '#1c1830' },
    'A pale seller shakes a velvet bag. "Regret something? For a fee I let you undo your last choice. Once."', [
      ch('Pay to undo (₽500)', out('The seller whispers. The memory shifts.', $(-500), heal(0.4), rp(2)), need(500)),
      ch('Pay a smaller fee (₽200)', out('A fainter shift. You feel lighter.', $(-200), heal(0.2)), need(200)),
      ch('No regrets', leave()),
    ]),
  M('quiet-antiquarian', 'The Quiet Antiquarian', { rarity: 'uncommon', cast: ['trainer.psychic_m'] },
    'An old man arranges small relics on a cloth. He speaks softly of kings and storms.', [
      ch('Listen to his lore', out('A quiet story, and a small relic pressed into your hand.', rp(3), item('relic-copper'))),
      ch('Buy a relic (₽300)', out('A handsome piece of the past.', $(-300), item('relic-silver')), need(300)),
      ch('Thank him and go', leave()),
    ]),
  M('itinerant-tutor', 'The Itinerant Moves Tutor', { rarity: 'uncommon', cast: ['trainer.hiker'] },
    'A traveling tutor teaches one move per visit. His price is odd: a berry, a coin, or a secret.', [
      ch('Pay with a berry', out('He taps a TM from his pack and nods.', lose('oran-berry'), any('tm-fire', 'tm-water', 'tm-grass', 'tm-electric')), L('oran-berry')),
      ch('Pay with a coin (₽100)', out('A coin for a lesson. He is fine with that.', $(-100), any('tm-normal', 'tm-fighting', 'tm-flying', 'tm-ground')), need(100)),
      ch('Pay with a secret (Intelligence)', out('You whisper a secret. He smiles and teaches a rare lesson.', any('tm-psychic', 'tm-ghost', 'tm-dragon', 'tm-dark'), rp(1)), { check: 'intelligence', fail: out('Your secret is dull. He teaches a plain lesson.', item('tm-normal')) }),
      ch('Decline', leave()),
    ]),
  M('gym-merch-stall', 'The Retired Gym Merch Stall', { rarity: 'common', cast: ['trainer.hiker'] },
    'A stall of type-themed badge pins from retired gym leaders. "Each pin carries a tiny type boost."', [
      ch('Fire pin (₽150)', out('A bright red pin.', $(-150), item('charcoal')), need(150)),
      ch('Water pin (₽150)', out('A blue pin that never dries.', $(-150), item('mystic-water')), need(150)),
      ch('Grass pin (₽150)', out('A green pin with a tiny leaf.', $(-150), item('miracle-seed')), need(150)),
      ch('Look and leave', leave()),
    ]),
  M('sock-puppet-salesman', 'The Sock Puppet Salesman', { rarity: 'rare', cast: ['trainer.guitarist'], tint: '#1c1c2a' },
    'A salesman wearing a floppy hat sells you an item. Something is off about his shadow. It looks very much like a Mimikyu.', [
      ch('Buy his item (₽300)', out('You buy it. It works. His shadow looks pleased.', $(-300), any(...TIER2)), need(300)),
      ch('Call out the disguise (Intelligence)', fight('"Mimikyu!" you shout. The disguise flops and the salesman springs at you.', trainer('Sock Puppet Salesman', { cls: 'worker', size: 2, types: ['ghost', 'fairy'], lv: 1, win: [any(...T3), $(250)] }), rp(1)), { check: 'intelligence', fail: out('You miss it. The seller sells you a plain item and slips away.', $(-300), item('potion')), requires: [money(300)] }),
      ch('Walk on', leave()),
    ]),
  M('trade-wind-caravan', 'The Trade Wind Caravan', { rarity: 'rare', cast: ['trainer.worker_m'] },
    'A caravan of three merchants parks by the road. "You may trade with only one of us. Choose carefully."', [
      ch('Trade with the spice merchant', out('She trades a bundle of berries for a coin.', $(-100), any(...BERRY), any(...BERRY), any(...BERRY)), need(100)),
      ch('Trade with the arms merchant', out('He swaps a hold item for a coin.', $(-300), any(...TIER2)), need(300)),
      ch('Trade with the rare merchant', out('He asks a lot, and gives a lot.', $(-700), any(...T3)), need(700)),
      ch('Wave and move on', leave()),
    ]),
  M('stolen-goods-stall', 'The Stolen Goods Stall', { rarity: 'uncommon', tint: '#1c1020', cast: ['trainer.roughneck'] },
    'A stall of questionable bargains. "Cheap, cheap! Do not ask where it came from."', [
      ch('Buy a bargain (₽120)', out('You pocket something nice. It might be hot.', $(-120), any(...TIER2), flag('stolen', 1)), need(120)),
      ch('Buy the best item (₽250)', out('A strong item at a thief\'s price.', $(-250), any(...T3), flag('stolen', 1)), need(250)),
      ch('Report the stall', out('The patrol thanks you.', good(1), $(150))),
      ch('Walk on', leave()),
    ]),
  M('stolen-goods-reclaim', 'The Rocket Grunt Wants It Back', { rarity: 'rare', callback: true, requires: [flagIs('stolen', 1)] },
    'A Rocket grunt steps in front of you. "That item you bought. It was ours. Hand it over."', [
      ch('Hand it over', out('He takes it and leaves. Fair enough.', flag('stolen', -1), good(1))),
      ch('Fight for it', fight('"No way," you say. He throws a ball.', trainer('Rocket Grunt', { cls: 'roughneck', size: 2, lv: 0, win: [$(250), any(...TIER2)] }), flag('stolen', -1), evil(1))),
    ]),
  M('apothecary-experiment', 'The Apothecary Experiment', { rarity: 'uncommon', cast: ['trainer.aroma_lady'] },
    'A lab-coated apothecary offers a bubbling vial. "Test-drink a random potion. I pay you for the data."', [
      ch('Drink a random potion', out('It fizzes and works. You are paid and refreshed.', heal(0.4), $(200)), { chance: 0.6, fail: out('It burns your tongue. You are still paid for the data.', hurt(0.15), $(120)) }),
      ch('Drink the premium vial', out('A deep green glow and a stronger buff.', heal(1), $(350), attr('strength', 1)), { chance: 0.4, fail: out('The vial was bad. A coin for your trouble.', status('poison'), $(150)) }),
      ch('Decline', leave()),
    ]),
  M('final-sale-banner', 'The Final Sale Banner', { rarity: 'rare', cast: ['trainer.worker_m'] },
    'A banner reads "EVERYTHING ₽1". The stall owner clears his throat. "First, you will sit through a short skit."', [
      ch('Sit through the skit', out('The skit takes forever, but the shelves empty into your arms for a coin.', $(-1), any(...T3), any(...TIER2), any(...TIER1), rp(1)), {}),
      ch('Skip the skit (Charisma)', out('You charm your way past the skit.', $(-1), any(...TIER2)), { check: 'charisma', fail: out('He sulks and refuses to sell.') }),
      ch('Walk on', leave()),
    ]),
];
