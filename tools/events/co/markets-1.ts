// Catalog Overhaul Pack: STORY_FAMILIES_11.md, SF87 THE HONEST MARKET (29 sellers).
// Every price is said before buying, nobody lies about what they sell, and a gamble prints its odds.
// A regular (third visit in a run) gets the perk named in the seller's entry and one line about their life.
import { $, any, ch, ev, fight, flag, flagIs, has, item, leave, out, reveal, stopHere, wild, type Json } from '../dsl.ts';
import { COMMON, RARE, UNCOMMON, VERY_RARE, ask, asRoom, bond, kind, mk, moment, need, pay, regular, stay, temp, visit } from './_markets.ts';

export { CATEGORY } from './_markets.ts';

const G = 'Merchants & Deals';
const lure = temp("Dunny's lure: rare finds half again as likely", [{ kind: 'encounterWeightMultiplier', group: 'rare', value: 1.5 }], 3, 'wild');
const gripper = temp('Sticky Gripper: +5% catch rate', [{ kind: 'captureMultiplier', value: 1.05 }], 1, 'wild');
const COMMONS = ['potion', 'poke-ball', 'oran-berry', 'pecha-berry', 'cheri-berry', 'repel', 'fresh-water', 'heal-powder', 'pearl', 'fire-gem', 'fairy-gem', 'cell-battery'];
const TRUCK = ['super-potion', 'great-ball', 'full-heal', 'revive', 'repel', 'sitrus-berry', 'wide-lens', 'muscle-band', 'silk-scarf', 'soda-pop'];
const MATCHED = ['leftovers', 'focus-sash', 'expert-belt', 'scope-lens', 'eviolite'];

const room = (id: string, name: string, cast: string[], intro: string, choices: Json[]): Json => asRoom(ev(id, name, G, { stop: 'merchant', cast, tint: '#2b2a1e' }, intro, choices));

export const EVENTS: Json[] = [
  // ---- SF87.1 Bait Bargain ----
  {
    id: 'bait-bargain', name: 'Bait Bargain', stop: 'merchant',
    intro: `A bait shop leans over the end of a pier, its shutters crusted white with salt. Dunny, the owner, wipes his hands on an apron that has not been clean in thirty years. "Lures that raise your odds of a rare find. Good for three stops. Smell's free." A lure is ₽${UNCOMMON}, and he says so before you can ask.`,
    choices: [
      ch('Buy a lure.', out('Dunny wraps the lure in yesterday\'s newspaper as gently as if it were glass. "Three stops. Then it\'s just a feather on a hook. Go catch something worth telling me about."', pay(UNCOMMON), lure, ...visit('dunny', 'bait-bargain')), need(UNCOMMON)),
      ask('How much do they raise it?', '"Half again. Not double." He looks you in the eye when he says it. "Anyone who says double is lying, and I\'d sooner lose the sale than be that man." The lures hang there, turning in the wind.', 'bait-bargain'),
      ch('No thanks.', leave('"Fair enough. Tide\'ll be here tomorrow, and so will I." He goes back to untangling a line that does not need untangling.')),
    ],
    remembers: [regular('dunny', 'Dunny sets down his knife when he sees you. "Thirty years. Never caught a thing myself. I just like people who do." He pushes a lure across the counter. "This one\'s on the pier."',
      ch("Take the regular's free lure.", out('He will not take a coin for it. "You come back. That\'s payment. Most people only pass a pier once."', lure, ...visit('dunny', 'bait-bargain'))))],
  },
  // ---- SF87.2 Factory Seconds ----
  {
    id: 'ball-factory-outlet', name: 'Factory Seconds', stop: 'merchant',
    intro: 'An outlet behind the factory wall. Dented Poké Balls fill a wire bin, each one turned so its scuff faces up, honest. Rhoda, the clerk, lifts one and clicks it shut. It is loud. "Seconds. Every one catches. Some wobble funny." Five for ₽600: sixty percent of the shelf price, written on the bin.',
    choices: [
      ch('Buy five.', out('Rhoda counts them into your hands one at a time, checking each hinge with her thumb as if she cannot help it. "Five. They\'ll do the job. They always did, they just weren\'t pretty enough for a shelf."', pay(600), item('poke-ball', 5), ...visit('rhoda', 'ball-factory-outlet')), need(600)),
      ask("What's wrong with them?", '"Paint\'s chipped. The click\'s loud. That\'s it." She holds one to the light so you can see for yourself. "Catch rate is the same as any Ball on any shelf. I\'d tell you if it wasn\'t."', 'ball-factory-outlet'),
      ch('Leave.', leave('Rhoda nods and goes back to turning the scuffed sides up.')),
    ],
    remembers: [regular('rhoda', 'Rhoda has one set aside before you reach the bin. "My dad built the line. I still check every one." She says it quietly, like it is the only thing she has ever been sure of.',
      ch('Buy the Great Ball second (₽200).', out('A Great Ball with a crooked stripe, at a Poké Ball\'s price. "Dad would have binned it. I think it deserves a throw."', pay(200), item('great-ball'), ...visit('rhoda', 'ball-factory-outlet')), need(200)))],
  },
  // ---- SF87.3 The Pitchman ----
  {
    id: 'ball-pitchman', name: 'The Pitchman', stop: 'merchant',
    intro: 'A man bangs a folding table hard enough to make the Poké Balls jump. "The Mega-Gripper! The Sure-Snatch 3000! The Whisper Ball!" Then Sal leans in and lowers his voice. "They\'re factory seconds with stickers on. I\'ll tell you what\'s wrong with each. The Gripper\'s sticky. The Snatch is heavy. The Whisper\'s just quiet." Each is ₽200, the plain shelf price.',
    choices: [
      ch('Buy the Gripper.', out('The Gripper clings to your palm a moment before it lets go. "Sticky. Holds a wild one a little better on the next throw. Five in a hundred better. I counted." Sal looks almost shy about having counted.', pay(200), item('poke-ball'), gripper, ...visit('sal', 'ball-pitchman')), need(200)),
      ch('Buy the Whisper.', out('The Whisper opens without a sound. "Won\'t wake a sleeping one if you miss. That\'s all it does. It\'s enough, some nights."', pay(200), item('dream-ball'), ...visit('sal', 'ball-pitchman')), need(200)),
      ask('Why tell me?', 'Sal stops banging the table. "Lied for twenty years. Didn\'t sell more. Now I tell the truth and it\'s a laugh." He grins, and for once it reaches his eyes. "Turns out people like a man who points at the dent."', 'ball-pitchman'),
    ],
    remembers: [regular('sal', 'Sal sees you and drops the patter mid-shout. "My wife says this is the first job I\'ve been proud of." He clears his throat. "Call now! Two for one! And this time it\'s real."',
      ch('Take Sal\'s "Call Now" deal: two Grippers for ₽200.', out('Two Grippers, one price, no small print. Sal turns the price card around so you can see there is nothing on the back.', pay(200), item('poke-ball', 2), gripper, ...visit('sal', 'ball-pitchman')), need(200)))],
  },
  // ---- SF87.4 The Bargain Bin ----
  {
    id: 'bargain-bin', name: 'The Bargain Bin', stop: 'merchant',
    intro: 'A janitor tips a bin of odds and ends onto a trestle table: a mitten, a Berry pouch, things small hands put down and forgot. Iggy straightens them into rows. "Lost property. Unclaimed a year. A hundred each." Three things for ₽300.',
    choices: [
      ch('Rummage.', out('You dig through a year of other people\'s forgetting and come up with three things worth keeping. Iggy writes each one in a ledger before he lets it go, in case anyone ever comes asking.', pay(300), any(...COMMONS), any(...COMMONS), any(...COMMONS), ...visit('iggy', 'bargain-bin')), need(300)),
      ask('Ask who lost them.', '"Mostly kids." Iggy turns a small shoe over in his hands. "One trainer left a Lucky Egg. I kept that for her. Not for sale. Some things you just hold onto until the right person walks back in."', 'bargain-bin'),
      ch('Leave.', leave('Iggy starts sweeping around the table, careful not to knock a single mitten off.')),
    ],
    remembers: [
      regular('iggy', 'Iggy waves you over before the bin is even tipped. "I\'m the janitor at the Gym too. Seen every challenger\'s scuff marks." He taps the floor with his broom. "Yours I\'d know anywhere. First pick is yours."',
        ch('Take first pick (₽100).', out('Before anyone else gets a look, Iggy lifts the best thing out of the bin and sets it in front of you.', pay(100), any('wide-lens', 'muscle-band', 'silk-scarf', 'amulet-coin'), ...visit('iggy', 'bargain-bin')), need(100))),
      { id: 'iggy-tib', when: [flagIs('apprentice-met')], notice: 'Iggy looks at you a little longer than usual. "That Lucky Egg I kept. The girl who left it, name of Tib. You know her, don\'t you? Tell her it\'s here. Tell her I dusted it."', addChoices: [] },
    ],
  },
  // ---- SF87.5 The Berry Cart ----
  {
    id: 'berry-merchant', name: 'The Berry Cart', stop: 'merchant',
    intro: 'A hand cart heaped with fresh Berries, still wet from the morning. Jo polishes one on her sleeve and holds it up to the sun. "Two for 400!"',
    choices: [
      ch('Buy two.', out('Jo steps back so you can see the whole cart. "Pick. I won\'t pick for you. A Berry you chose yourself tastes better, everybody knows that."', stay('berry-merchant-stock'))),
      ch('Which are freshest?', out('"The Sitrus. Picked before the dew was off." She sells you two and tucks a third in beside them without a word, then pretends she did not.', pay(400), item('sitrus-berry', 3), ...visit('jo', 'berry-merchant')), need(400)),
      ask('Do you grow them?', '"My grandad\'s grove." Jo looks down at her stained fingers. "He planted every tree. I just carry what he started."', 'berry-merchant'),
    ],
    remembers: [
      regular('jo', '"You again!" Jo reaches under the cart for a basket she does not show other people. "Kept the rare ones back. Common price, for you."',
        ch('Buy the rare Berry (₽200).', out('A Berry the size of a fist, heavy and gold. "Grandad only got one tree of these to take. It took for me, too."', pay(200), item('hyper-sitrus-berry'), ...visit('jo', 'berry-merchant')), need(200))),
      { id: 'jo-festival', when: [flagIs('berry-festival-fixed')], notice: 'Jo\'s cart is fuller than it has any right to be. "The grove\'s back, thanks to someone." She does not say who. She gives you a look that says she knows.', addChoices: [] },
    ],
  },
  room('berry-merchant-stock', "The Berry Cart's Stock", ['trainer.aroma_lady'], 'Jo\'s cart, row by row: Oran and Sitrus on top, Lum and Pecha in the shade, Cheri and Rawst at the back where the sun is kindest. Two for ₽400, any two.', [
    ch('An Oran and a Sitrus.', out('Jo wraps them in a leaf. "Good choice. Those two never let anyone down."', pay(400), item('oran-berry'), item('sitrus-berry'), ...visit('jo', 'berry-merchant')), need(400)),
    ch('A Lum and a Pecha.', out('"For the bad days," Jo says, and wraps them in a leaf. "I hope you never need them."', pay(400), item('lum-berry'), item('pecha-berry'), ...visit('jo', 'berry-merchant')), need(400)),
    ch('A Cheri and a Rawst.', out('Jo picks the two reddest and wraps them in a leaf. "Grandad\'s favourites. He said they looked like sunrise."', pay(400), item('cheri-berry'), item('rawst-berry'), ...visit('jo', 'berry-merchant')), need(400)),
    ch('None today.', leave('"They\'ll keep till tomorrow. Mostly." Jo polishes another one on her sleeve.')),
  ]),
  // ---- SF87.6 The Bulk Buyer ----
  {
    id: 'bulk-buyer', name: 'The Bulk Buyer', stop: 'merchant',
    intro: 'A buyer in a hard hat stands by an empty crate with a calculator on a string round his neck. Mr. Grent does not smile. "I sell nothing. I pay double for stacks of identical things." Five or more of one item: double the usual selling price, and he shows you the sum first.',
    choices: [
      ch('Sell a stack.', out('Mr. Grent counts your stack twice, taps the calculator, and turns it to face you before a single coin moves. "That\'s the number. I don\'t round it down."', mk('sell', { pick: 'stack', factor: 2 }), ...visit('grent', 'bulk-buyer'))),
      ask('Why stacks?', '"Supplies the region\'s Centers. They need forty of everything." He looks at the empty crate. "One Potion helps one trainer. Forty keeps a door open all night."', 'bulk-buyer'),
      ch('Nothing to sell.', leave('Mr. Grent nods once and goes back to waiting. He is good at it.')),
    ],
    remembers: [regular('grent', 'Mr. Grent almost smiles. Almost. "The Centers stay open because of people like you selling me junk." He writes a new number on the crate. "They\'re short of Potions. Triple, today."',
      ch('Sell a stack of Potions at triple.', out('He counts them like they matter, because tonight, somewhere, they will.', mk('sell', { pick: 'stack', factor: 3, only: ['potion', 'super-potion', 'hyper-potion'] }), ...visit('grent', 'bulk-buyer'))))],
  },
  // ---- SF87.7 The Charm Peddler ----
  {
    id: 'charm-peddler', name: 'The Charm Peddler', stop: 'merchant',
    intro: 'Paper lanterns sway over a cart of charms: glass beads, knotted cords, tiny bells. Ama-Lin does not look up from her knotting. "Charms. They don\'t do anything. I tell everyone that." A pause. "Well. Two of them do. The rest are pretty." Pretty ones are ₽100. The two that work are ₽' + UNCOMMON + ' each.',
    choices: [
      ch('Buy a pretty one.', out('You choose a blue bead on a red cord. It does nothing at all, and it catches the lantern light every time you move. Ama-Lin ties it on for you herself.', pay(100), flag('charm-pretty'), moment('Bought a charm from Ama-Lin that does nothing and is pretty.', 35), ...visit('amalin', 'charm-peddler')), need(100)),
      ch('Buy one that works.', out('Ama-Lin lifts a tray from under the cart. Two charms on plain cloth, nothing pretty about either.', stay('charm-peddler-two'))),
      ch('Which two?', out('She shows you without being asked twice: an Amulet Coin, dull with handling, and a Cleanse Tag gone soft at the corners. "These. Everything else is for the eyes."', stay('charm-peddler-two'))),
    ],
    remembers: [regular('amalin', 'Ama-Lin has something finished and waiting. "I made one with your first partner\'s face on it. I had to guess the ears." The ears are perfect.',
      ch("Take the charm with your partner's face.", out('Your lead Pokémon stares at the little carved face for a long time, then presses its nose against it. Ama-Lin looks away, smiling at her knots.', bond(1), moment("Ama-Lin carved a charm with your first partner's face on it.", 60), ...visit('amalin', 'charm-peddler'))))],
  },
  room('charm-peddler-two', 'The Two That Work', ['trainer.fairy_tale_girl'], `Two charms on plain cloth. The Amulet Coin: prize money up while it is carried. The Cleanse Tag: wild Pokémon come a level gentler while the holder leads. ₽${UNCOMMON} each. "I won't tell you which you need," Ama-Lin says. "You know your own road."`, [
    ch('The Amulet Coin.', out('The coin is warm, as if someone has only just let go of it.', pay(UNCOMMON), item('amulet-coin'), ...visit('amalin', 'charm-peddler')), need(UNCOMMON)),
    ch('The Cleanse Tag.', out('The tag smells faintly of incense and rain.', pay(UNCOMMON), item('cleanse-tag'), ...visit('amalin', 'charm-peddler')), need(UNCOMMON)),
    ch('Neither.', leave('Ama-Lin covers the tray again. "They\'ll wait. They\'ve waited longer."')),
  ]),
  // ---- SF87.8 The Tasting Table ----
  {
    id: 'chefs-tasting', name: 'The Tasting Table', stop: 'merchant', scene: { cast: ['trainer.pr/clerk_f'], tint: '#2b2a1e', effect: 'none' },
    intro: 'Steam rises from a row of small plates on a roadside table. Chef Rumi stands behind them with her sleeves rolled and a spoon behind her ear. "Tasting menu. One plate per Pokémon. They tell me what they like." ₽100 a plate, chalked on a slate.',
    choices: [
      ch('Feed the team.', out('Rumi sets a plate in front of each of them and watches, hands clasped, hardly breathing. The ones who find their flavour close their eyes. "There. That one. Did you see? That\'s why I cook."', mk('feed', { amount: 100 }), ...visit('rumi', 'chefs-tasting')), need(100)),
      ask('Taste one myself.', 'You try the spicy one. Rumi watches your face go through several weathers and laughs until she has to hold the table. "No charge. That was worth more than a coin."', 'chefs-tasting'),
      ask('Ask the price first.', '"A hundred each. It\'s on the slate." She turns the slate so you can read it. "I\'d never feed someone and tell them after."', 'chefs-tasting'),
    ],
    remembers: [regular('rumi', 'Rumi pulls out a stool for you. "Sit. You\'ve eaten here enough to cook here." She writes something on a card in careful letters.',
      ch("Learn Rumi's recipe.", out('She walks you through it twice, guiding your hand on the spoon. "My mother\'s. Don\'t change it. Well. Change it a little. She did."', flag('recipe-rumi'), bond(1, 'party'), moment("Chef Rumi taught you her mother's recipe.", 60), ...visit('rumi', 'chefs-tasting'))))],
  },
  // ---- SF87.9 The Coupon Clipper ----
  {
    id: 'coupon-clipper', name: 'The Coupon Clipper', stop: 'merchant',
    intro: 'A woman with a binder as thick as a brick beams at you over her glasses. Mrs. Fauna tears out a coupon along a perfect line. "Thirty percent off! Next shop only. Don\'t lose it."',
    choices: [
      ch('Take it.', out('She presses it into your hand and folds your fingers over it. "Next shop. Don\'t lose it. People lose them, and it breaks my heart."', item('fauna-coupon'), ...visit('fauna', 'coupon-clipper'))),
      ask("What's the catch?", '"There isn\'t one. I have four hundred." Mrs. Fauna pats the binder fondly. "My husband says it\'s a sickness. I say it\'s a gift, and gifts are for giving."', 'coupon-clipper'),
      ch('Give it to someone else.', out('A trainer nearby is counting coins twice and coming up short both times. You hand them the coupon. They stare at it, then at you. Mrs. Fauna dabs her eyes with a sleeve. "Oh, that\'s the best use it ever had."', ...kind(1), ...visit('fauna', 'coupon-clipper'))),
    ],
    remembers: [regular('fauna', 'Mrs. Fauna has your coupon torn out before you say hello. "One every region, dear. I\'ve got your name on a tab." She does. It is the only tab in the binder.',
      ch("Take this region's coupon, and one to spare.", out('"One for you, one for whoever needs it. You\'ll know them when you see them."', item('fauna-coupon', 2), ...visit('fauna', 'coupon-clipper'))))],
  },
  // ---- SF87.10 The Exchange ----
  {
    id: 'currency-exchanger', name: 'The Exchange', stop: 'merchant',
    intro: 'A counter with two glass jars, one of coins and one of blue Battle Point tokens. Pim-Tal counts under his breath and never loses his place. "Money to Battle Points, or back. Rates on the wall." The wall says: ₽500 for 1 point, 1 point for ₽500. No fee.',
    choices: [
      ch('Money to BP.', out('Pim-Tal counts your coins into one jar and a single blue token out of the other. He counts it twice, in front of you, both times out loud.', mk('buyPoint', { amount: 500 }), ...visit('pimtal', 'currency-exchanger')), need(500)),
      ch('BP to money.', out('One blue token in, five hundred out. Pim-Tal slides the coins across in stacks of five so you can check them at a glance.', mk('cashPoint', { amount: 500 }), ...visit('pimtal', 'currency-exchanger'))),
      ask('Why the rates?', '"The rate\'s what the Frontier says. I just count." He looks at the jars with real affection. "Counting\'s honest. A number is the same whoever\'s asking."', 'currency-exchanger'),
    ],
    remembers: [regular('pimtal', 'Pim-Tal nods at you like an old colleague. "I never round against you. I want you to know that. I round against the jar."',
      ch('Money to BP, rounded your way (₽450).', out('He takes fifty fewer coins than the wall says and drops them back in your hand. "The jar can afford it."', mk('buyPoint', { amount: 450 }), ...visit('pimtal', 'currency-exchanger')), need(450)))],
  },
  // ---- SF87.11 The Haggle Sale ----
  {
    id: 'haggle-sale', name: 'The Haggle Sale', stop: 'merchant',
    intro: 'Tags flip to red all down the shelves as a clerk waves both arms. "Sale! You can haggle. I\'ll go down twenty. Not one coin more." Doss says it like a man who has done the sums at his kitchen table.',
    choices: [
      ch('Haggle.', out('You haggle. Doss sighs, sucks his teeth, and comes down twenty percent to the coin, exactly as promised. He opens the shop for you.', item('doss-twenty'), stopHere('shop'), ...visit('doss', 'haggle-sale'))),
      ch('Pay the tag.', out('You pay what the tag says. Doss blinks. Then he tucks a Berry into your bag and will not hear a word about it. "Nobody ever just pays. Thank you."', item('sitrus-berry'), stopHere('shop'), ...visit('doss', 'haggle-sale'))),
      ask('Why only twenty?', '"Twenty\'s what I can afford. Thirty and my kids don\'t eat." He says it plainly, without shame. "I\'d rather tell you the floor than pretend there isn\'t one."', 'haggle-sale'),
    ],
    remembers: [regular('doss', 'Doss lowers his voice. "For you, twenty-five. My eldest got a scholarship. I can breathe a bit." He cannot stop smiling.',
      ch('Haggle to twenty-five.', out('Twenty-five percent, to the coin. Doss shakes your hand with both of his.', item('coupon-2'), stopHere('shop'), ...visit('doss', 'haggle-sale'))))],
  },
  // ---- SF87.12 The Herbalist ----
  {
    id: 'healing-herbalist', name: 'The Herbalist', stop: 'merchant',
    intro: 'Bitter herbs dry on a blanket in the sun, and the smell alone makes your lead Pokémon take a step back. Old Sesk does not get up. "Cheap. Heal fast. Out of battle only. Your Pokémon won\'t like the taste." Heal Powder and Energy Root, ₽100 each: half a Potion\'s price.',
    choices: [
      ch('Buy herbs.', out('Old Sesk folds one of each into a twist of paper. "They\'ll hate you for an hour. Then they\'ll be well, and they\'ll forget. That\'s the bargain. It\'s a fair one."', pay(200), item('heal-powder'), item('energy-root'), ...visit('sesk', 'healing-herbalist')), need(200)),
      ask('How much do they dislike it?', '"One step of Bond. They forgive you by next rest, mostly." He chews a root himself and does not flinch. "I never said it was kind. I said it works."', 'healing-herbalist'),
      ch('No.', leave('Old Sesk shrugs. Your Pokémon relaxes visibly.')),
    ],
    remembers: [regular('sesk', 'Old Sesk grunts, which from him is a welcome. He holds out a small sweet Berry. "Mix this in. Cancels the bitter, once. My wife\'s trick. She couldn\'t stand to see them pull faces."',
      ch("Take the Berry that sweetens it.", out('You crush the Berry into the powder. Your Pokémon sniffs it, suspicious, then licks your hand.', item('pecha-berry'), bond(1), ...visit('sesk', 'healing-herbalist'))))],
  },
  // ---- SF87.13 The Honest Hawker ----
  {
    id: 'honest-hawker', name: 'The Honest Hawker', stop: 'merchant',
    intro: 'A hawker waves a single Potion over his head like a flag. "One item, exact shop price, no tricks! Say thanks and I throw in a sticker." Nim-Rai\'s Potion is ₽200, the same as any shop, and he is prouder of that than of anything.',
    choices: [
      ch('Buy, and say thanks.', out('"Thank you!" you say. Nim-Rai lights up as if nobody has said it all week, and peels a sticker off his roll with great ceremony.', pay(200), item('potion'), flag('hawker-stickers'), ...visit('nimrai', 'honest-hawker')), need(200)),
      ch('Buy.', out('One Potion, one fair price. Nim-Rai waits a second, hopeful, sticker half peeled. Then he smooths it back onto the roll.', pay(200), item('potion'), ...visit('nimrai', 'honest-hawker')), need(200)),
      ch('Just the sticker?', out('"...Fine." He hands one over, trying to look put out and failing completely.', flag('hawker-stickers'), ...visit('nimrai', 'honest-hawker'))),
    ],
    remembers: [
      { id: 'nimrai-six', when: [flagIs('hawker-stickers', 6)], notice: 'Nim-Rai counts the stickers on your bag and gasps. "Six! Nobody collects six! I made a prize up years ago and never once gave it out."',
        addChoices: [ch('Trade six stickers for the prize.', out('He digs to the very bottom of his pack and comes up with a Rare Candy wrapped in a seventh sticker. His hands shake a little as he gives it to you.', flag('hawker-stickers', -6), item('rare-candy'), ...visit('nimrai', 'honest-hawker')))] },
      regular('nimrai', '"A new region, a new sticker!" Nim-Rai shows you the roll. Every one is different. "I draw them myself at night. Nobody knows that. Well. You know."',
        ch("Take this region's sticker.", out('This one is a tiny Potion with a smiling face. He drew it for today.', flag('hawker-stickers'), ...visit('nimrai', 'honest-hawker')))),
    ],
  },
  // ---- SF87.14 The Pawnshop ----
  {
    id: 'item-pawnshop', name: 'The Pawnshop', stop: 'merchant', scene: { cast: ['trainer.pr/clerk_f'], tint: '#2b2a1e', effect: 'none' },
    intro: 'A dim shop, one lamp, one ledger. A woman in a maid\'s uniform sits very straight behind it. "Pawn something? You can buy it back for what I paid, for one region." Miss Ottoline pays sixty percent of an item\'s value, and writes the figure where you can read it upside down.',
    choices: [
      ch('Pawn an item.', out('Miss Ottoline weighs your most valuable item in a gloved hand, names her price, and writes you a ticket in copperplate. "It will be here. I do not sell what is waiting for someone."', mk('pawn', { key: 'ottoline', factor: 0.6 }), ...visit('ottoline', 'item-pawnshop')), { requires: [flagIs('pawn-ottoline', 0, 0)] }),
      ch('Buy back.', out('She finds your ticket in the ledger at once, as though she had been keeping the page. The same price she paid, not a coin more.', mk('redeem', { key: 'ottoline', factor: 1 }), ...visit('ottoline', 'item-pawnshop')), { requires: [flagIs('pawn-ottoline')] }),
      ask("Why a maid's uniform?", '"I worked at the big house. They went bust. I got the ledger and the shop." She straightens a cuff. "I kept the uniform. Somebody ought to remember that house was looked after."', 'item-pawnshop'),
    ],
    remembers: [regular('ottoline', 'Miss Ottoline inclines her head. "For you, the window is two regions. I have written it in the ledger. In ink." From her, that is an embrace.',
      ch('Thank her.', out('She permits herself a very small smile. "You may go. Come back."', bond(1), ...visit('ottoline', 'item-pawnshop'))))],
  },
  // ---- SF87.15 The Lucky Charm Shop ----
  {
    id: 'lucky-charm-shop', name: 'The Lucky Charm Shop', stop: 'merchant',
    intro: `Charms and pendants crowd the shelves from floor to ceiling. Pippa dusts them one by one. "Good luck pendants. They give you nothing. They make you feel lucky. That's worth something." A pendant is ₽100. The one thing that really works, a Lucky Egg, is ₽${RARE}.`,
    choices: [
      ch('Buy a pendant.', out('A little brass clover on a chain. It gives you nothing. You feel lucky anyway, walking out into the light, and Pippa watches you go as if that were the whole point.', pay(100), flag('pendant-pippa'), moment('Bought a pendant from Pippa that only makes you feel lucky.', 35), ...visit('pippa', 'lucky-charm-shop')), need(100)),
      ch('Anything that really works?', out('"One thing." Pippa unlocks the bottom drawer. "A Lucky Egg. Rare, and priced like it. I won\'t pretend it\'s cheap, and I won\'t pretend the rest of the shop is this."', pay(RARE), item('lucky-egg'), ...visit('pippa', 'lucky-charm-shop')), need(RARE)),
      ch('Leave.', leave('The door chimes behind you. It sounds, somehow, like good luck.')),
    ],
    remembers: [regular('pippa', 'Pippa already has her engraving needle out. "Free, for a regular. What shall it say? People always go quiet at this bit."',
      ch('Have a pendant engraved.', out('You tell her. She engraves it in tiny letters and does not ask what it means. Your lead Pokémon wears it for the rest of the day.', bond(1), moment('Pippa engraved a pendant for you, free.', 45), ...visit('pippa', 'lucky-charm-shop'))))],
  },
  // ---- SF87.16 The Mart Truck ----
  {
    id: 'mart-truck', name: 'The Mart Truck', stop: 'merchant',
    intro: `A truck pulls over in a cloud of dust and its side panel drops open into a counter. Hob-Tam leans out, sunburnt and cheerful. "Random stock. Gone tomorrow. Prices fair." Today's one Rare item is a Focus Sash, ₽${RARE}; everything else is on the shelf at shop price.`,
    choices: [
      ch('Browse.', out('Hob-Tam props the panel and lets you climb up. Six things on the shelf, each with a tag, each tag the fair price. "Take your time. The road\'s not going anywhere."', stopHere('shop'), any(...TRUCK), ...visit('hobtam', 'mart-truck'))),
      ch("What's rare today?", out('"Focus Sash. One. Came off a trainer who retired last week. Said it saved his partner more times than he could count." Hob-Tam holds it out so you can see the frayed edge.', flag('mart-truck-asked'), stay('mart-truck'))),
      ch('Wave him on.', leave('Hob-Tam tips his cap, folds up the counter, and the truck rattles off toward the next town that needs it.')),
    ],
    remembers: [
      { id: 'hobtam-asked', when: [flagIs('mart-truck-asked')], notice: 'Hob-Tam taps a box behind the seat. "Saved the one you asked about. Didn\'t feel right selling it to someone who hadn\'t."',
        addChoices: [ch('Buy the Focus Sash.', out('He hands it over carefully, both hands. "Look after it. It looked after somebody."', pay(RARE), item('focus-sash'), flag('mart-truck-asked', -1), ...visit('hobtam', 'mart-truck')), need(RARE))] },
      regular('hobtam', '"My best customer!" Hob-Tam pulls over before you can even wave. "I drive four hundred miles a week. You\'re the only face I see twice."', ch('Share his flask of tea.', out('You sit on the tailgate and drink sweet tea out of the lid while the engine ticks and cools. Neither of you is in a hurry.', bond(1, 'party'), ...visit('hobtam', 'mart-truck')))),
    ],
  },
  // ---- SF87.17 The Mega Bazaar ----
  {
    id: 'mega-bazaar', name: 'The Mega Bazaar', stop: 'merchant', scene: { cast: ['trainer.pr/rich_f'], tint: '#2b1e3a', effect: 'glint' },
    intro: `A shopfront glittering with strange stones, each on its own velvet pad. Celosine stands with her hands folded. "Mega Stones. Real ones. From a licensed seam, not Flare's." A stone matched to one of your Pokémon is ₽${VERY_RARE}.`,
    choices: [
      ch('Buy a stone.', out('Celosine studies your party for a long moment, then lifts one stone from its pad. It hums when it comes near the right Pokémon. "There. It knows. They always know before we do."', pay(VERY_RARE), item('mega-charm'), ...visit('celosine', 'mega-bazaar')), need(VERY_RARE)),
      ask("Prove they're licensed.", 'She lays a certificate on the counter: a seam number, a surveyor\'s seal, a date. "Every stone here was asked for, not taken. I can show you the miners\' names. I pay them myself."', 'mega-bazaar'),
      ch('Leave.', leave('The stones glitter after you, patient as stars.')),
    ],
    remembers: [
      { id: 'celosine-harvest', when: [flagIs('team-op-stopped-stone-harvest')], notice: 'Celosine\'s prices have new, lower tags. "Prices dropped since Flare\'s mine closed. Thank whoever did that." She looks at you as if she suspects, and is glad.',
        addChoices: [ch(`Buy a stone at the new price (₽${RARE}).`, out('"Honest stone, honest price. It is easier to be both now."', pay(RARE), item('mega-charm'), ...visit('celosine', 'mega-bazaar')), need(RARE))] },
      regular('celosine', 'Celosine brings out a pad from the back. "One stone, once, at the Rare price. I keep it for the people who come back. You came back."',
        ch(`Buy the regular's stone (₽${RARE}).`, out('She wraps it in velvet herself. "My father dug the first seam by hand. He would have liked you."', pay(RARE), item('mega-charm'), flag('market-celosine-visits', -3), ...visit('celosine', 'mega-bazaar')), need(RARE))),
    ],
  },
  // ---- SF87.18 The Rotating Mart ----
  {
    id: 'mismatched-mart', name: 'The Rotating Mart', stop: 'merchant',
    intro: 'A mart that stocks only one type\'s items at a time. A calendar by the till is covered in crossings-out. The clerk squints at it. "Fire week. Next week, Water. Week after, I forget." Everything on the shelf is at the fair shop price.',
    choices: [
      ch('Buy.', out('The clerk waves at the shelves. Everything is red, orange, or faintly warm to the touch.', stay('mismatched-mart-shelf'))),
      ask('Look at the calendar.', 'You read it for him. Fire here. Water at your next visit. Grass the one after, and then round again. "Oh," the clerk says, with real relief. "Someone did write it down. I think it was me."', 'mismatched-mart', flag('mart-calendar-read')),
      ch('Leave.', leave('"Come back for Water week!" he calls. "Or whatever it turns out to be!"')),
    ],
    remembers: [
      { id: 'mart-grass-week', when: [flagIs('mart-week', 2)], intro: 'The Rotating Mart again, and the shelves have gone green. The clerk checks the calendar, checks it again, and beams. "Grass week! I remembered! Well. I wrote it on my hand." Everything is at the fair shop price.', hide: [0],
        addChoices: [ch('Buy.', out('Everything on the shelves is green, and smells of cut stems.', stay('mismatched-mart-shelf-grass')))] },
      { id: 'mart-water-week', when: [flagIs('mart-week', 1)], intro: 'The Rotating Mart again. The shelves are blue this time, and something drips. The clerk mops around your feet. "Water week. Like the calendar said. I think the calendar said." Everything is at the fair shop price.', hide: [0],
        addChoices: [ch('Buy.', out('Everything on the shelves is blue, and a little damp.', stay('mismatched-mart-shelf-water')))] },
    ],
  },
  ...([
    ['mismatched-mart-shelf', 'Fire Week', 'Fire week at the Rotating Mart.', ['fire-gem', 'A Fire Gem', 'It is warm in your hand, like a stone left in the sun.'], ['charcoal', 'Charcoal', 'It leaves a black thumbprint on everything, and the clerk wraps it twice.'], ['fire-stone', 'A Fire Stone', 'It flickers inside, a small trapped sunset.'], '"Fair. Not everyone wants Fire. That\'s why there\'s a Water week. I think."'],
    ['mismatched-mart-shelf-water', 'Water Week', 'Water week at the Rotating Mart.', ['water-gem', 'A Water Gem', 'It is cool, and beads with dew as you hold it.'], ['mystic-water', 'Mystic Water', 'A blue drop on a cord, heavy as the sea.'], ['water-stone', 'A Water Stone', 'Something inside it moves like a tide.'], '"Fair. Grass week next. I\'m nearly sure."'],
    ['mismatched-mart-shelf-grass', 'Grass Week', 'Grass week at the Rotating Mart.', ['grass-gem', 'A Grass Gem', 'It smells of cut stems and morning.'], ['miracle-seed', 'A Miracle Seed', 'It is trying, very slowly, to sprout in your palm.'], ['leaf-stone', 'A Leaf Stone', 'It smells, faintly, of a forest after rain.'], '"Fair. Fire week next. It goes round. I worked that out!"'],
  ] as [string, string, string, [string, string, string], [string, string, string], [string, string, string], string][]).map(([id, name, lead, a, b, c, bye]) =>
    room(id, name, ['trainer.worker_m'], `${lead} ${a[1]}, ₽${COMMON}. ${b[1]}, ₽${UNCOMMON}. ${c[1]}, ₽${UNCOMMON}. Nothing else. The clerk is sure about that much.`, [
      ch(`${a[1]}.`, out(a[2], pay(COMMON), item(a[0]), flag('mart-week'), mk('comeBack', { event: 'mismatched-mart' })), need(COMMON)),
      ch(`${b[1]}.`, out(b[2], pay(UNCOMMON), item(b[0]), flag('mart-week'), mk('comeBack', { event: 'mismatched-mart' })), need(UNCOMMON)),
      ch(`${c[1]}.`, out(c[2], pay(UNCOMMON), item(c[0]), flag('mart-week'), mk('comeBack', { event: 'mismatched-mart' })), need(UNCOMMON)),
      ch('Nothing.', leave(bye)),
    ])),
  // ---- SF87.19 Odd Socks ----
  {
    id: 'mismatched-socks', name: 'Odd Socks', stop: 'merchant',
    intro: 'A stall of footwear, every pair odd. Gilly holds up two boots that have plainly never met. "Speed boots! Left\'s a nine, right\'s a six. Still fast!" Running Boots, ₽' + COMMON + '.',
    choices: [
      ch('Buy boots.', out('One pinches. One flaps. You run a few steps down the road and back, and somehow they really are fast. Gilly claps. "Told you! Nobody believes me until they run!"', pay(COMMON), flag('running-boots'), moment("Bought Gilly's odd Running Boots: a nine and a six.", 40), ...visit('gilly', 'mismatched-socks')), need(COMMON)),
      ask('Why odd?', '"Factory mixed the sizes. Thought I\'d own it." Gilly shrugs, grinning. "Everyone\'s a bit odd. I just sell it honestly."', 'mismatched-socks'),
      ch('Leave.', leave('Gilly waves a boot at you in farewell.')),
    ],
    remembers: [regular('gilly', 'Gilly is almost in tears. "It came in! A matching pair! First one in six years!" She has saved it for you. Of course she has.',
      ch('Take the matching pair.', out('A nine and a nine. They fit like they were waiting. Gilly watches you lace them and wipes her nose on her sleeve. "Don\'t tell anyone. I\'ve a reputation."', bond(1), moment('Gilly saved you her first matching pair in six years.', 55), ...visit('gilly', 'mismatched-socks'))))],
  },
  // ---- SF87.20 Mystery Meat ----
  {
    id: 'mystery-meat-cart', name: 'Mystery Meat', stop: 'merchant',
    intro: 'A hot plate, a dented pot, a handwritten menu that says MEAT in confident letters. Barnaby stirs. "Cheap, hearty, and probably meat." He catches your eye and gives in at once. "It\'s beans. It\'s always been beans." A bowl is ₽50. A round for the whole team is ₽150.',
    choices: [
      ch('Eat.', out('You eat. It is beans. They are very good beans. You share the last spoonful with your lead Pokémon, who feels a little better for it.', pay(50), mk('mend', { factor: 0.1, who: 'lead' }), ...visit('barnaby', 'mystery-meat-cart')), need(50)),
      ch('Feed the team.', out('Barnaby ladles out a bowl each and stands back to watch them eat, arms folded, proud as a father. Everyone feels a little better.', pay(150), mk('mend', { factor: 0.1, who: 'party' }), ...visit('barnaby', 'mystery-meat-cart')), need(150)),
      ask("What's in it?", '"Beans!" Barnaby throws up his hands. "I put MEAT on the sign because my dad did. He sold beans too. Nobody ever complained. Not once in forty years."', 'mystery-meat-cart'),
    ],
    remembers: [regular('barnaby', 'Barnaby is already ladling. "Extra beans for a regular. Don\'t argue. Dad always said the third bowl is where a customer turns into a friend."',
      ch('Take the extra beans.', out('The bowl is so full it has a hill. The whole team shares it, and nobody is left out.', mk('mend', { factor: 0.2, who: 'party' }), ...visit('barnaby', 'mystery-meat-cart'))))],
  },
  // ---- SF87.21 The Price Matcher ----
  {
    id: 'price-match-guy', name: 'The Price Matcher', stop: 'merchant',
    intro: `A man with a notebook so worn its cover has gone soft as cloth. Arno licks a finger and turns a page. "Cheapest price I ever saw. Bring me a deal, I'll match it for one item." Today the cheapest price in the book is ₽${COMMON}, for a held item worth far more.`,
    choices: [
      ch('Match a price.', out('Arno runs his finger down a column, stops, and nods. "Three hundred. Saw it in a harbour town, nine years back. A price is a promise. I keep other people\'s."', pay(COMMON), any(...MATCHED), ...visit('arno', 'price-match-guy')), need(COMMON)),
      ch('Show me the notebook.', out('He lets you hold it. Every price in the region, in tiny careful writing, with the date and the weather. You learn where everything is, and where it is cheapest.', reveal(), ...visit('arno', 'price-match-guy'))),
      ch('Leave.', leave('Arno writes down today\'s date, and the weather, and that you came by.')),
    ],
    remembers: [regular('arno', 'Arno opens the notebook to a page with your name at the top. "Two matches a region, for you. I started a page. I only have pages for people I like."',
      ch('Match a second price.', out('He finds one cheaper still, from a market that closed years ago. "It still counts. I was there."', pay(200), any(...MATCHED), ...visit('arno', 'price-match-guy')), need(200)))],
  },
  // ---- SF87.22 The Rebate Booth ----
  {
    id: 'rebate-booth', name: 'The Rebate Booth', stop: 'merchant',
    intro: 'A booth made of a door laid across two barrels, under a hand-drawn sign: REBATE. The attendant has a cash tin and a hopeful face. "Twenty percent back on your last purchase."',
    choices: [
      ch('Claim it.', out('The attendant checks your receipt, counts out a fifth of it, and pushes it across the door with one finger. "There. Feels like finding it in a coat pocket, doesn\'t it?"', mk('rebate', { factor: 0.2 }))),
      ask('Who pays for this?', '"The Mart chain. They\'d rather you came back." The attendant leans closer. "And between us, I\'d rather you came back too. It\'s a quiet booth."', 'rebate-booth'),
      ch('Leave.', leave('The attendant straightens the sign, which did not need straightening.')),
    ],
  },
  // ---- SF87.23 The Scrap Buyer ----
  {
    id: 'scrap-buyer', name: 'The Scrap Buyer', stop: 'merchant',
    intro: 'A man with a handcart and a voice that carries three streets. "I buy anything! Anything at all!" Wex pays the plain scrap price, weighed on a scale you can watch.',
    choices: [
      ch('Sell junk.', out('Wex weighs it, pays the scrap price to the coin, and then stops. He picks a clean little cog out of the pile and hands it back. "That\'s a Machine Part. Too good for my cart. Keep it."', mk('sell', { pick: 'junk', factor: 1 }), item('machine-part'), ...visit('wex', 'scrap-buyer'))),
      ch('Sell something good.', out('Wex looks at what you are holding and pushes it gently back toward you. "That\'s worth more at a shop. Go there." He means it. He would rather lose the trade than cheat you by an inch.')),
      ask('What do you do with it?', '"Machine Parts. For the TM Workshop." Wex pats the cart. "Fidget turns scrap into discs. I turn clutter into scrap. Everything\'s something, if you carry it far enough."', 'scrap-buyer'),
    ],
  },
  // ---- SF87.24 The Snack Stand ----
  {
    id: 'snack-stand', name: 'The Snack Stand', stop: 'merchant',
    intro: 'Fresh Water beading in an ice tub. Soda Pop. Lava Cookies still warm in a paper-lined tray. Your whole team has stopped walking and is staring, very hard, at the tray. A round for everyone is ₽600. One drink is ₽200.',
    choices: [
      ch('Buy for everyone.', out('You buy the lot. For a few minutes nobody is a fighter, just a row of happy faces with crumbs on them. One of them saves you the last cookie.', pay(600), mk('mend', { factor: 0.2, who: 'party' }), bond(1, 'party')), need(600)),
      ch('Buy one.', out('One cold bottle for the road. The team watches it go into your bag with great interest.', pay(200), item('fresh-water')), need(200)),
      ch('Not now.', leave('The team sighs, all together, like one tired animal. Somebody looks back at the tray twice.')),
    ],
  },
  // ---- SF87.25 The Stone Seller ----
  {
    id: 'stone-seller', name: 'The Stone Seller', stop: 'merchant',
    intro: 'Four stones on a square of felt, each catching the light a different way. Mabry does not oversell. "Fire, Water, Thunder, Leaf. Pick a stone, 1,200."',
    choices: [
      ch('Buy a stone.', out('Mabry turns the felt so all four face you.', stay('stone-seller-felt'))),
      ch('Which suits my team?', out('Mabry looks at each of your Pokémon in turn, slowly, the way a tailor looks at shoulders. Then he tells you the truth, whichever way it falls.', mk('advise', { key: 'stone' }), stay('stone-seller'))),
      ch('Leave.', leave('Mabry folds the felt over the stones like a blanket.')),
    ],
  },
  room('stone-seller-felt', "Mabry's Four Stones", ['trainer.hiker'], `Fire, Water, Thunder, Leaf. ₽${UNCOMMON} each. "A stone can't be taken back out," Mabry says. "Be sure. I'll wait while you're sure."`, [
    ch('The Fire Stone.', out('It is warm, and it flickers.', pay(UNCOMMON), item('fire-stone')), need(UNCOMMON)),
    ch('The Water Stone.', out('It is cool, and something inside it moves like a tide.', pay(UNCOMMON), item('water-stone')), need(UNCOMMON)),
    ch('The Thunder Stone.', out('It prickles your palm.', pay(UNCOMMON), item('thunder-stone')), need(UNCOMMON)),
    ch('The Leaf Stone.', out('It smells, faintly, of a forest after rain.', pay(UNCOMMON), item('leaf-stone')), need(UNCOMMON)),
  ]),
  // ---- SF87.26 The TM Vendor ----
  {
    id: 'tm-vendor', name: 'The TM Vendor', stop: 'merchant',
    intro: `A case of discs, each in its own sleeve, each sleeve labelled by hand. Marcelle taps the glass. "I teach moves for money. Your lead could learn a lot." One move for your lead: ₽${UNCOMMON}.`,
    choices: [
      ch('Teach a move.', out('Marcelle slots a disc, and your lead Pokémon goes very still, listening to something you cannot hear. When it looks up it stands a little differently.', pay(UNCOMMON), { kind: 'train', what: 'learnMove' }), need(UNCOMMON)),
      ask('Show me the list.', 'She turns the case around. Every move your lead could learn here, each with its price beside it in the same neat hand. "No surprises. A move is for life. You should read the label."', 'tm-vendor'),
      ch('Leave.', leave('Marcelle closes the case with a soft click.')),
    ],
    remembers: [{ id: 'marcelle-no-machines', when: [flagIs('promise-genesect-no-machines')], intro: 'A case of discs, every sleeve labelled by hand. Marcelle looks at you, and then at the case, and sighs from somewhere deep. "No more machines. You promised it, and I heard." She closes the case. She does not look angry. Only tired, and a little proud of you.', hide: [0, 1], addChoices: [] }],
  },
  // ---- SF87.27 The Travelling Collector ----
  {
    id: 'travelling-collector', name: 'The Travelling Collector', stop: 'merchant',
    intro: 'A collector peers at your bag through a glass case she carries like a window. Hesper points with a gloved finger. "I\'ll buy that. And that. Fair prices. I\'ve a ledger." She buys curios: fossils, shards, Pearls.',
    choices: [
      ch('Sell.', out('Hesper names a price for each curio, writes it in the ledger, and pays it. The fair price, no haggling. She lays each one in the case as if it were being put to bed.', mk('sell', { pick: 'curio', factor: 1 }))),
      ask('What are you collecting?', '"Things from roads that ended." She tilts the case. Inside, on velvet: a cracked Poké Ball, a child\'s badge, a ribbon gone grey. "Somebody carried each of these as far as they could. I carry them the rest of the way."', 'travelling-collector'),
      ch('Leave.', leave('Hesper lifts the case and looks at the road through it, as though checking it is still there.')),
    ],
  },
  // ---- SF87.28 The Vending Machine ----
  {
    id: 'vending-machine', name: 'The Vending Machine', stop: 'merchant',
    intro: 'A machine glows by the empty road, humming to itself. Something rattles inside. A sticker on the glass, printed and official: "1 IN 10: A SECOND DRINK DROPS." A drink is ₽200.',
    choices: [
      ch('Buy a drink.', out('The machine thinks about it. Then clunk, and clunk again. Two bottles roll into the tray, cold and beaded. The rattle inside sounds almost pleased.', pay(200), item('fresh-water', 2)), { requires: need(200).requires, chance: 0.1, fail: out('Clunk. One bottle, cold and beaded, exactly as promised.', pay(200), item('fresh-water')) }),
      ch('Shake it.', fight('You shake it. The humming stops. A Rotom bursts out of the coin slot, sparking with outrage at being woken, and it is not going to let this go.', wild({ species: ['rotom'], lv: -1 }))),
      ch('Look behind it.', out('Dust, a dead leaf, and a coin somebody dropped and never missed. You pick it up. The machine hums on.', $(100))),
    ],
  },
  // ---- SF87.29 The Warehouse ----
  {
    id: 'wholesale-warehouse', name: 'The Warehouse', stop: 'merchant', scene: { cast: ['trainer.pr/worker_f'], tint: '#2b2a1e', effect: 'none' },
    intro: 'Pallets stacked to the rafters, and a forklift idling in the aisle. Gertrude does not turn it off to talk. "Five of anything, steep discount. No singles." Five of one item at seventy percent of the shelf price each.',
    choices: [
      ch('Buy five.', out('Gertrude jerks a thumb at three pallets by the door.', stay('wholesale-warehouse-pallets'))),
      ask('Why no singles?', '"Forklift can\'t pick one." She says it flat. Then, after a moment: "And one\'s lonely. Five look after each other in a bag."', 'wholesale-warehouse'),
      ch('Leave.', leave('The forklift beeps as it backs away. Gertrude raises two fingers off the wheel, which is her wave.')),
    ],
  },
  room('wholesale-warehouse-pallets', 'Three Pallets', ['trainer.pr/worker_f'], 'Three pallets by the door. Five Potions for ₽700. Five Poké Balls for ₽700. Five Super Potions for ₽2,100. Seventy percent each, stencilled on the shrink-wrap.', [
    ch('Five Potions.', out('Gertrude lowers the forks, and a shrink-wrapped block of five lands at your feet as lightly as a feather.', pay(700), item('potion', 5)), need(700)),
    ch('Five Poké Balls.', out('Five in a block, wrapped tight. They look after each other already.', pay(700), item('poke-ball', 5)), need(700)),
    ch('Five Super Potions.', out('The good ones. Gertrude nods, the smallest nod. Approval.', pay(2100), item('super-potion', 5)), need(2100)),
    ch('None.', leave('"Suit yourself." The forklift is already turning.')),
  ]),
];

export const REMOVE: string[] = [];
