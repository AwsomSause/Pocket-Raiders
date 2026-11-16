// Catalog Overhaul Pack, category "places": STORY_FAMILIES_15.md SF102 Standalone Choices, part 2, and The Pacts.
// Pacts state the gain and the cost in full before signing; every pact offers "Sign." / "Read it again." / "No.".
// A drawn ticket, card or dial setting is its own room event (never drawn at random), so it is shown before the player signs.
import { BERRIES, HELD, RARE_HELD, SNACKS, STONES, $, any, ch, ev, express, flag, flagAgo, flagAt, flagIs, fr, has, heal, hurt, item, lose, money, out, relic, roomFrom, rp, stopHere, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { kind, moment, no, rep, variant } from './_delve.ts';

export const CATEGORY = 'places';

const intel = (n = 1): Json => flag('intel', n);
const canJoin: Json = { kind: 'standWith', joined: false };
const standWith: Json = { kind: 'standWith', action: 'join' };
const team = (id: string): Json => ({ kind: 'evil', team: id });
const heat = (n: number): Json => ({ kind: 'evil', heat: n });
const fightIt = (text: string, battle: Json, ...fx: Json[]): Json => ({ text, effects: fx, battle });
const age = (key: string, atLeast: number): Json => ({ kind: 'flagAge', key, atLeast, atMost: 99 });
const again = (id: string, text: string, ...fx: Json[]): Json => out(text, ...fx, { kind: 'addEvent', eventId: id });
const room = (id: string, name: string, group: string, tint: string, intro: string, choices: Json[]): Json => ({ ...ev(id, name, group, { stop: 'event', rarity: 'rare', types: [], minStage: 1, tint }, intro, choices), room: true });

// ---------- SF102 part 2 ----------
const STANDALONE_B: Json[] = [
  {
    id: 'black-friday',
    intro: 'A crowd heaves at the doors of a shop on opening day. "First pick to whoever gets there first!" A small child is crushed against the glass, holding her mum\'s hand, nearly crying.',
    choices: [
      ch('Push to the front.', out('You shoulder through. You get the best thing on the shelf. When you turn round, the child is crying properly, and people are looking at you.', any(...RARE_HELD), rep(-1))),
      ch('Let a child go first.', out('You make a gap, and the child slips into it and gets her prize. You get what is left. Her mum catches your arm on the way out. "Here. It was my mother\'s. It brings luck to the patient."', any('potion', 'super-potion', 'great-ball'), item('lucky-egg'), ...kind(), moment('You let a child go first, and her mother gave you a Lucky Egg.', 50))),
    ],
  },
  {
    id: 'counterfeit-cop',
    intro: 'A cop stands at a charm stall, glaring at the vendor. "That charm\'s fake. I need a witness who saw the sale." The vendor looks at you. His boy, beside him, looks at the floor.',
    choices: [
      ch('Witness.', out('You tell what you saw. The vendor goes quietly; the boy watches him go and does not cry. "He\'ll run the stall now," says the cop, softer. "Maybe he\'ll run it straight."', flagAt('counterfeit-witness'), rep(1), $(200))),
      ch('Buy the fake.', out('You buy one, cheap. The vendor winks. It is a pretty thing. It will work once, you think, and then it will break, like the man who sold it.', $(-60), item('fake-charm')), { requires: [money(60)] }),
      ch('Stay out of it.', out('You keep walking. Behind you the argument goes on without you.')),
    ],
  },
  ev('counterfeit-son-stall', 'An Honest Stall', 'Merchants & Deals', { stop: 'merchant', rarity: 'uncommon', types: [], minStage: 1, callback: true, requires: [age('counterfeit-witness', 1), no('counterfeit-son-seen')], tint: '#4a3d2a' },
    'The charm stall again, a stage on. The boy runs it now. Every charm has a tag: what it really does, written out in careful letters. He recognises you. He does not look away.',
    [
      ch('Buy a real charm (300).', out('He wraps it properly. "Dad said you were the one who told." A pause. "Thanks. I mean it. It\'s better like this."', $(-300), item('amulet-coin'), flag('counterfeit-son-seen'), ...kind()), { requires: [money(300)] }),
      ch('Ask how his dad is.', out('"He writes," says the boy. "He says he\'s sorry. He says it a lot." He gives you a charm for free. "For asking."', item('cleanse-tag'), flag('counterfeit-son-seen'))),
    ]),
  {
    id: 'scalper-alley',
    intro: 'A scalper in an alley holds up a tier-three item, the last of the shop\'s stock. "Triple price. Bought the lot this morning. Shop\'s empty, so it\'s me or nothing."',
    choices: [
      ch('Buy.', out('You pay triple. It stings, and it works. The shop stays empty on your next visit, and the next.', $(-1200), any(...RARE_HELD), { kind: 'tempEffect', label: 'Scalped shelves', effects: [{ kind: 'shopUnlockOffset', value: -1 }], until: 'region' }), { requires: [money(1200)] }),
      ch('Report him.', out('You find a patrol. He is gone by the time they come, but the stock is in a crate behind him. By morning the shop\'s shelves are full again, a little fuller than before.', { kind: 'tempEffect', label: 'Restocked shelves', effects: [{ kind: 'shopEarlyRareStock', count: 1 }], until: 'region' }, rep(1))),
      ch('Leave.', out('You leave him to wait for someone desperate.')),
    ],
  },
  {
    id: 'trade-wind-caravan',
    intro: 'A caravan of three wagons by the road: a spice trader, a stone trader, a tailor. "You may trade with one of us," says the eldest. "Only one. We do not come back this way."',
    choices: [
      ch('The spice trader.', out('Her wagon smells of a hundred places. She sells you snacks and Berries and tells you which ones your Pokémon will love. The other two wagons roll on without you.', $(-100), any(...SNACKS), any(...BERRIES), stopHere('shop'), flag('caravan-spice')), { requires: [money(100)] }),
      ch('The stone trader.', out('His stones glow in their straw. He lets you hold each one before you choose. The other two wagons roll on without you.', $(-500), any(...STONES), flag('caravan-stone')), { requires: [money(500)] }),
      ch('The tailor.', out('She measures your Pokémon with great seriousness and sews something that fits exactly. The other two wagons roll on without you.', $(-300), any('silk-scarf', 'choice-scarf'), flag('caravan-tailor')), { requires: [money(300)] }),
    ],
  },
  {
    id: 'bond-ceremony',
    intro: 'A shrine where trainers and their Pokémon promise to stay together. Old ribbons on every post, faded, still tied. The keeper says, "A vow here is for good. No trading it away. No letting go."',
    choices: [
      ch('Make the vow with a Pokémon.', out('You kneel. Your Pokémon puts its head against yours. You tie a ribbon on the post together. It will not be released or traded, and nothing will make it love you less. If it is ever lost, the vow will stay with all of you.', { kind: 'vow', who: 'picked' }, fr(20, 'picked'), moment('You made a vow at the Bond shrine.', 75)), { pick: {} }),
      ch('Not yet.', out('"There is no hurry," says the keeper. "The ribbons wait."')),
    ],
  },
  {
    id: 'ghetsis-offer',
    requires: [team('plasma')],
    intro: 'Ghetsis, in his robes, at the edge of a square, as if he has always been standing there. "Power, child. Take it. Plasma rewards those who see clearly."',
    choices: [
      ch('Take it.', out('He smiles, and something huge and three-headed comes to your side. Plasma\'s colours are yours now. Somewhere, a part of you is already wondering what it cost.', { kind: 'join', species: ['hydreigon'], types: [], levelBonus: 0, shinyMultiplier: 1 }, standWith, moment('You took Ghetsis\'s offer and stood with Plasma.', 80)), { requires: [canJoin] }),
      ch('No.', out('"Fool." He does not raise his voice. He simply turns away, and the square seems colder after.', ...kind())),
    ],
  },
  {
    id: 'two-visitors',
    intro: 'A sanctuary keeper and a collector in a good coat have set up on the same crate. Both are looking at the Shadow Pokémon you rescued. The keeper says "Let me heal it." The collector says "Let me pay you."',
    choices: [
      ch('The keeper.', out('She takes it gently, talking to it the whole time. "A region," she says. "Then it comes back to you. Clean." It looks back at you once, over her shoulder.', { kind: 'sendAway', key: 'keeper-shadow', shadow: true, who: 'lead' }, ...kind()), { requires: [{ kind: 'partyShadow' }, { kind: 'partySize', atLeast: 2 }] }),
      ch('The collector.', out('He counts out the money without looking at it. It does not look at you as it goes. "It\'ll have a good home," he says. You will see it again, in a place that is not a home at all.', { kind: 'sendAway', key: 'collector-shadow', shadow: true, who: 'lead' }, $(800), flag('shadow-sold')), { requires: [{ kind: 'partyShadow' }, { kind: 'partySize', atLeast: 2 }] }),
      ch('Neither.', out('"It stays with me." The keeper nods. The collector shrugs and folds his coat.')),
    ],
  },
  ev('keeper-shadow-returns', 'The Keeper Returns', 'Shadow Pokémon', { stop: 'event', rarity: 'uncommon', types: [], minStage: 1, callback: true, requires: [flagAgo('keeper-shadow', 1), no('keeper-shadow-back')], tint: '#3a4a52' },
    'The sanctuary keeper is waiting on the road, and beside her, clear-eyed, is the Pokémon you rescued. The darkness is gone out of it. It sees you and comes at a run.',
    [
      ch('Welcome it home.', out('It is warm. It is itself. The keeper wipes her eyes. "It asked for you every day."', { kind: 'bringBack', key: 'keeper-shadow', levels: 2, friendship: 30, purify: true }, flag('keeper-shadow-back'), moment('The Pokémon you rescued came back purified.', 75))),
    ]),
  {
    id: 'vt-boss-phone-call',
    intro: 'A public phone rings by itself as you pass. When you pick up, a rasping voice says: "I\'ve been watching you. Choose your words."',
    choices: [
      ch('Listen.', out('You say nothing. The voice likes the sound of itself, and talks too long. When the line goes dead you know one piece of their plan.', intel())),
      ch('Feed it a lie.', out('You tell it where you are going. You are not going there. It thanks you. Somewhere, an Operation sets up at the wrong place and waits for nobody.', heat(-1), flag('evil-misled'))),
      ch('Hang up.', out('You put the phone back on its hook. It does not ring again.')),
    ],
  },
  {
    id: 'vt-letter-mixup',
    intro: 'The postman hands you a letter by mistake. It is addressed to a Grunt, and it is orders.',
    choices: [
      ch('Read it.', out('Times, places, a code word. You fold it carefully and memorise it.', intel())),
      ch('Rewrite it.', out('You steam it open and change the orders. Stand down. Stay put. You seal it again. The postman takes it on. Somewhere, an Operation is called off by its own side.', { kind: 'evil', op: 'foiled' }, moment('You rewrote a Grunt\'s orders and called off an Operation.', 60))),
      ch('Return it.', out('You give it back to the postman. He is relieved, and pays you a little for the trouble.', $(250), ...kind())),
    ],
  },
  {
    id: 'vt-spy-dead-drop',
    intro: 'An envelope behind a loose brick, sealed, addressed to no one. A dead drop.',
    choices: [
      ch('Take it.', out('Inside: a step of the evil team\'s plan, in somebody\'s neat hand.', intel())),
      ch('Swap it.', out('You copy the handwriting as best you can and leave them a plan of your own. Somebody will follow it, carefully, the wrong way.', heat(-1), flag('evil-misled'))),
      ch('Leave it.', out('You push the brick back in. Not your business. Not today.')),
    ],
  },
  {
    id: 'vt-stakeout',
    intro: 'Across the street, in a café that is always shut, a shady meeting is starting. Uniforms under coats.',
    choices: [
      ch('Wait and watch. (a node)', out('You wait. And wait. You see everything: who, what, two steps of the plan. Your legs are stiff when you stand.', takeNode(), intel(2))),
      ch('Burst in.', fightIt('"It\'s a setup!" "It\'s a kid." "Get the kid!"', trainer('Courier', { cls: 'roughneck', size: 3, lv: 1, friendly: true, win: [intel(), $(400)] }))),
    ],
  },
  {
    id: 'vt-doom-clock',
    intro: 'A red clock ticking over crates in the hideout. Two wires, red and blue, run to a dented box. A Grunt behind a barrel whispers: "Don\'t ask me. I just carry them."',
    choices: [
      ch('Red.', out('Snip. The clock stops. Everybody breathes again, including the Grunt.', $(500), rp(2)), { chance: 0.5, fail: out('Snip. A pipe bursts. Water floods the hideout to your knees. Nobody is hurt, but it takes a long time to wade out.', takeNode()) }),
      ch('Blue.', out('Snip. The clock stops. Everybody breathes again, including the Grunt.', $(500), rp(2)), { chance: 0.5, fail: out('Snip. A pipe bursts. Water floods the hideout to your knees. Nobody is hurt, but it takes a long time to wade out.', takeNode()) }),
      ch('Use a Psychic- or Steel-type.', out('Your Pokémon studies the box for a long, long time, then holds both wires still while you take the clock off its mount. Slow. Safe.', $(250), rp(2), fr(5, { types: ['psychic', 'steel'] })), { requires: [{ kind: 'partyTypes', types: ['psychic', 'steel'] }] }),
    ],
  },
  {
    id: 'vt-hostage-negotiation',
    intro: 'A Grunt holds a trainer\'s Pokémon behind a crate. "One step closer and it\'s over!" The trainer is crying. Everyone is looking at you.',
    choices: [
      ch('Talk (Reputation 3).', out('They know your name. You talk slowly. You tell them it is over and there is a way out. They believe you. They put it down.', ...kind(2), rep(1)), { requires: [flagIs('rep', 3)] }),
      ch('Trade an item.', out('You hold something out. "Take this instead." He grabs it and runs. The Pokémon runs the other way, into its trainer\'s arms.', lose(), ...kind())),
      ch('Force it.', fightIt('"Fine!" In the scramble the hostage is knocked down. It gets up, shaky. It will be all right. Now there\'s just him and you.', trainer('Hostage Taker', { cls: 'roughneck', size: 3, lv: 1, friendly: true, win: [$(400), ...kind()] }))),
    ],
  },
  {
    id: 'vt-shadow-exchange',
    intro: 'A dealer in a back room. "I lend Shadow Pokémon. A few battles. It hits hard. Just keep it away from the light." Nobody is making you.',
    choices: [
      ch('Borrow it.', out('It is cold to the touch and does not look at you. The dealer writes your name in a book.', { kind: 'join', species: [], types: [], levelBonus: 1, shinyMultiplier: 1, shadow: true }, flag('shadow-activity'), flag('shadow-tally'))),
      ch('No.', out('"Suit yourself." The book closes.')),
    ],
  },
  {
    id: 'face-villain-pep',
    intro: 'A villain boss steps out of the shadows with a lukewarm smile. "You\'re clever. Wasted on the good guys, honestly."',
    choices: [
      ch('Join you.', out('He laughs, delighted, and claps you on the shoulder like an old friend. "Welcome. You\'ll get a name. Everyone does." You stand with them now.', standWith, moment('You joined the evil team.', 80)), { requires: [canJoin] }),
      ch('No.', out('"Pity." He means it, which is somehow worse.', ...kind())),
      ch('Why me?', again('face-villain-pep', '"Because you win," he says, "and you don\'t enjoy it. That\'s rare. The ones who enjoy it are easy to replace." He waits.')),
    ],
  },
  {
    id: 'giovanni-offer',
    intro: 'Giovanni, a Persian at his feet, looking at you the way a buyer looks at a horse. "Join Team Rocket. I reward loyalty."',
    choices: [
      ch('Accept.', out('He hands you an envelope and a black uniform. "Good." You stand with Rocket now.', $(3000), standWith, moment('You accepted Giovanni\'s offer.', 80)), { requires: [canJoin, team('rocket')] }),
      ch('Refuse.', fightIt('"Then you\'ll be crushed." He does not even stand up. The Persian does.', trainer('Giovanni', { boss: 'giovanni', size: 3, lv: 3, friendly: true, win: [$(4000), ...kind()] }))),
    ],
  },
  {
    id: 'rk-bounty-hunter',
    intro: 'A hard-eyed hunter leans out of a doorway. "Vasko. I hunt the strongest one in any team. Sign my contract: three times, down the road, I come for your best. Beat me all three times and the pay is big."',
    choices: [
      ch('Sign.', out('You sign. He folds the paper into his coat. "Your best," he says. "Keep it sharp." Then he is gone.', flag('bounty-signed'))),
      ch('Refuse.', out('He shrugs. "There\'s always someone stronger to sign."')),
    ],
  },
  ev('rk-bounty-hunter-duel', 'Vasko Comes Back', 'Run-Wide Modifiers', { stop: 'ambush', rarity: 'uncommon', types: [], minStage: 2, callback: true, requires: [flagIs('bounty-signed'), flagIs('bounty-won', 0, 2), no('bounty-lost')], tint: '#3a2a2a' },
    'Vasko steps out onto the road. "As agreed. Your best against mine. One on one." He counts the marks on his sleeve. {flag:bounty-won} down.',
    [
      ch('Lead with your best.', fightIt('"Good. Don\'t hold back." His first Pokémon goes for yours and nothing else.', trainer('Vasko', { cls: 'ace-trainer', size: 1, lv: 4, friendly: true, rule: { suddenDeath: true }, win: [flag('bounty-won'), { kind: 'seeAgain', eventId: 'rk-bounty-hunter-duel' }], lose: [flag('bounty-lost')] }))),
    ]),
  ev('rk-bounty-hunter-paid', 'The Bounty, Paid', 'Run-Wide Modifiers', { stop: 'event', rarity: 'uncommon', types: [], minStage: 2, callback: true, requires: [flagIs('bounty-won', 3), no('bounty-paid')], tint: '#3a2a2a' },
    'Vasko waits by the road with a heavy purse and a torn contract. "Three times. Nobody does three times." He looks at your best Pokémon a long moment. "Keep it."',
    [ch('Take the pay.', out('It is a great deal of money. He shakes your hand, and your Pokémon\'s paw, very seriously.', $(4000), flag('bounty-paid'), fr(10, 'top'), moment('You beat Vasko three times.', 70)))]),
  {
    id: 'rk-interview',
    intro: 'A hiring manager with a clipboard. "What are you best at? Be honest. It decides how you\'ll grow from here."',
    choices: [
      ch('Battling.', out('Written down: Battling. Every fight from now on teaches a little more.', relic('rk-interview-battling', 'Focus: Battling', [{ kind: 'xpMultiplier', value: 1.1 }]))),
      ch('Catching.', out('Written down: Catching. Every Ball you throw from now on flies a little truer, and every catch pays.', relic('rk-interview-catching', 'Focus: Catching', [{ kind: 'captureMultiplier', value: 1.1 }, { kind: 'catchMoneyMultiplier', value: 1.25 }]))),
      ch('Helping.', out('Written down: Helping. The manager looks up. "Rare answer." Your Pokémon will warm to you faster from now on.', relic('rk-interview-helping', 'Focus: Helping', [{ kind: 'friendshipMultiplier', value: 1.25 }]))),
    ],
  },
  {
    id: 'rk-rule-board',
    intro: 'A notice board of house rules, with pins. "Pin one up," says the sign. "It holds for the rest of your run. So does the reward."',
    choices: [
      ch('No battle items: money +30%.', out('You pin it. No battle items from now on. Your pockets already feel heavier.', relic('rk-rule-nobattleitems', 'No Battle Items', [{ kind: 'runRule', id: 'no-battle-items' }, { kind: 'moneyMultiplier', value: 1.3 }]))),
      ch('No revives: XP +25%.', out('You pin it. Fainted is fainted from now on. Every lesson sticks harder.', relic('rk-rule-norevives', 'No Revives', [{ kind: 'runRule', id: 'no-revives' }, { kind: 'xpMultiplier', value: 1.25 }]))),
      ch('Double money: foes +2 levels.', out('You pin it. Rich and in danger, from now on.', relic('rk-rule-richandrisky', 'Rich and Risky', [{ kind: 'moneyMultiplier', value: 2 }, { kind: 'enemyLevelOffset', value: 2 }]))),
      ch('Leave the board bare.', out('You leave the pins where they are.')),
    ],
  },
  {
    id: 'contract-desk',
    intro: 'A broker slides three contracts across the desk, pay and difficulty written on each. "Easy pays little. Hard pays a lot. Fail me and I remember."',
    choices: [
      ch('Easy.', fightIt('A small job: a nuisance trainer moved on.', trainer('Contract: Easy', { size: 2, lv: 0, friendly: true, win: [$(300)], lose: [flag('broker-rep-lost')] }))),
      ch('Medium.', fightIt('A real job: a gang of three.', trainer('Contract: Medium', { size: 3, lv: 2, friendly: true, win: [$(700)], lose: [flag('broker-rep-lost')] }))),
      ch('Hard.', fightIt('The hard job: an ace who has beaten everyone the broker sent.', trainer('Contract: Hard', { cls: 'ace-trainer', size: 4, lv: 4, friendly: true, win: [$(1500), moment('You took the broker\'s hard contract and won.', 55)], lose: [flag('broker-rep-lost')] }))),
    ],
    remembers: [variant('failed', [flagIs('broker-rep-lost')], { notice: 'The broker remembers the job you failed. She slides only one contract across.', hide: [2] })],
  },
  {
    id: 'cursed-treasure',
    intro: 'A chest wrapped in chains, humming. A note nailed to the lid: "Whoever takes this, someone else pays."',
    choices: [
      ch('Take it.', out('The chains fall away at your touch. Inside: something rare and lovely. Somewhere, you feel it, someone\'s luck just turned.', any(...RARE_HELD), flagAt('cursed-treasure-taken'))),
      ch('Leave it.', out('You leave it humming in the dark. Nobody pays. Not today.', ...kind())),
    ],
  },
  ev('cursed-treasure-merchant', 'The Ruined Merchant', 'Set Pieces', { stop: 'event', rarity: 'uncommon', types: [], minStage: 1, callback: true, requires: [age('cursed-treasure-taken', 1), no('cursed-treasure-amends')], tint: '#3a3328' },
    'A merchant sits on the steps of a boarded-up shop. Everything went wrong at once, he says: the fire, the debts, the cart. "Like somebody else\'s luck landed on me." He doesn\'t know your face. You know his.',
    [
      ch('Pay him (1000).', out('You press the money into his hands. He does not understand why. He takes it anyway, and holds it, and starts to cry.', $(-1000), flag('cursed-treasure-amends'), ...kind(2), moment('You made amends to the merchant the treasure ruined.', 65)), { requires: [money(1000)] }),
      ch('Help him rebuild. (a node)', out('You spend a day hauling and hammering. By the end the shop has a door again. He sells you nothing; he gives you tea.', takeNode(), flag('cursed-treasure-amends'), ...kind(2))),
      ch('Tell him the truth.', out('You tell him about the chest. He is quiet for a long time. "Well," he says. "At least now I know it wasn\'t me." It is not forgiveness. It is something.', flag('cursed-treasure-amends'), ...kind())),
      ch('Walk on.', out('You walk on. He does not look up.', flag('cursed-treasure-amends'), flag('kind-walked-past'))),
    ]),
  {
    id: 'mr-archivist-dilemma',
    intro: 'An archivist holds two scrolls and looks as if both are her children. "I can only keep one in the great archive. The war history, or the founding myth. The other burns."',
    choices: [
      ch('Keep the war history.', out('She files it. The other scroll curls in the fire. From now on this region remembers its war: of land against sea, and the sky that ended it. Their Signs will come to you.', relic('archive-war', 'The War Remembered', [{ kind: 'legendaryFocus', species: ['groudon', 'kyogre', 'rayquaza'], weight: 4, gateChance: 0.25 }]), { kind: 'choice', id: 'archivist-keep', pick: 'war', text: 'Kept the war history', weight: 2 })),
      ch('Keep the founding myth.', out('She files it. The other scroll curls in the fire. From now on this region remembers how the world began: time, space, and what lies under both. Their Signs will come to you.', relic('archive-myth', 'The Myth Remembered', [{ kind: 'legendaryFocus', species: ['dialga', 'palkia', 'giratina'], weight: 4, gateChance: 0.25 }]), { kind: 'choice', id: 'archivist-keep', pick: 'myth', text: 'Kept the founding myth', weight: 2 })),
    ],
  },
  {
    id: 'mr-final-page',
    intro: 'The last page of a great book, left open on a lectern. Three endings written in three hands. Whichever you read becomes yours.',
    choices: [
      ch('Read the hopeful ending.', out('Everyone gets home. Nobody is left behind. You close the book feeling lighter. Your Pokémon feel it too: they warm to you faster from now on.', relic('final-page-hopeful', 'The Hopeful Ending', [{ kind: 'friendshipMultiplier', value: 1.2 }]), flag('ending-hopeful'))),
      ch('Read the honest one.', out('Some get home. Some do not. It is true, and it hurts, and it teaches. Every battle teaches a little more from now on.', relic('final-page-honest', 'The Honest Ending', [{ kind: 'xpMultiplier', value: 1.08 }]), flag('ending-honest'))),
      ch('Read the strange one.', out('It does not end. It turns into a map of a place that is not there, and then into a list of colours. Strange things will find you more often from now on.', relic('final-page-strange', 'The Strange Ending', [{ kind: 'shinyChanceMultiplier', value: 1.5 }]), flag('ending-strange'))),
    ],
  },
];

// ---------- The Pacts ----------
const PACT_TEXT = {
  booth: 'THE PACT. Gain: every prize pays half again (money x1.5). Cost: every foe fights two levels higher. For the rest of the run.',
  shadow: 'THE LOAN. Gain: your lead, +1 to every stat, for this region. Cost: at your next boss battle, your lead starts at -1 to every stat. Then the debt is paid.',
  sunk: 'THE BRIDGE. Pay 500 more: the bridge is finished and you cross by the shortcut. Walk away: the 500 already paid is gone, and that is fine.',
};
const pactChoices = (id: string, text: string, sign: Json, signReq: Json[] = [], no = 'You hand the pen back. Nothing changes. That was allowed.'): Json[] => [
  ch('Sign.', sign, signReq.length ? { requires: signReq } : {}),
  ch('Read it again.', again(id, text)),
  ch('No.', out(no)),
];

const DIAL = [
  { name: 'Calm', rare: 0.8, ambush: 0.5, words: 'Calm: rare Pokémon x0.8, ambushes x0.5.' },
  { name: 'Brisk', rare: 1.25, ambush: 1.25, words: 'Brisk: rare Pokémon x1.25, ambushes x1.25.' },
  { name: 'Wild', rare: 1.5, ambush: 1.5, words: 'Wild: rare Pokémon x1.5, ambushes x1.5.' },
  { name: 'Chaos', rare: 2, ambush: 2, words: 'Chaos: rare Pokémon x2, ambushes x2.' },
];
const dialSign = (i: number): Json => ch('Sign.', out(`The dial locks at ${DIAL[i]!.name}. For the rest of the run: ${DIAL[i]!.words}`, relic(`rk-risk-dial-${DIAL[i]!.name.toLowerCase()}`, `Risk Dial: ${DIAL[i]!.name}`, [{ kind: 'encounterWeightMultiplier', group: 'rare', value: DIAL[i]!.rare }, { kind: 'stopWeight', stop: 'ambush', value: DIAL[i]!.ambush }]), flag('rk-dial-set')));
const dialTurn = (i: number): Json => ch('Turn the dial.', again('rk-risk-dial', `Click. The needle moves to ${DIAL[(i + 1) % 4]!.name}. ${DIAL[(i + 1) % 4]!.words}`, flag('rk-dial-point', i === 3 ? -99 : 1)));

const TICKETS = [
  { id: 'rk-curse-ticket-1', gain: 'Every battle teaches more (XP x1.2).', cost: 'Every hit lands harder on you (damage taken x1.1).', effects: [{ kind: 'xpMultiplier', value: 1.2 }, { kind: 'damageTakenMultiplier', value: 1.1 }] },
  { id: 'rk-curse-ticket-2', gain: 'After every battle your team heals a little (5%).', cost: 'Every prize pays less (money x0.85).', effects: [{ kind: 'postBattleHeal', percent: 5 }, { kind: 'moneyMultiplier', value: 0.85 }] },
  { id: 'rk-curse-ticket-3', gain: 'Critical hits come more often (+5%).', cost: 'Potions heal less (healing items x0.8).', effects: [{ kind: 'critChanceBonus', value: 0.05 }, { kind: 'healingMultiplier', value: 0.8 }] },
];
const CARDS = [
  { id: 'rk-fate-card-sun', name: 'The Sun', gain: 'Your whole team healed, now.', cost: '150 money.', effects: [heal(1), $(-150)], req: [money(150)] },
  { id: 'rk-fate-card-tower', name: 'The Tower', gain: 'A rare find, now.', cost: 'Every Pokémon takes a hard knock (15% HP).', effects: [any('nugget', 'big-pearl', 'star-piece', 'comet-shard', 'leftovers', 'life-orb', 'choice-band'), hurt(0.15)], req: [] },
  { id: 'rk-fate-card-star', name: 'The Star', gain: 'A new Pokémon follows you from the table.', cost: '250 money, the dealer\'s cut.', effects: [{ kind: 'join', species: [], types: [], levelBonus: 0, shinyMultiplier: 1 }, $(-250)], req: [money(250)] },
];

const PACTS: Json[] = [
  {
    id: 'rk-pact-booth',
    intro: `A clerk in a red coat pushes a contract across the counter. "Harder fights, richer pay. Sign here." The contract reads: ${PACT_TEXT.booth}`,
    choices: pactChoices('rk-pact-booth', `You read every line again. ${PACT_TEXT.booth} The clerk waits, pen out.`, out('The ink dries. The road ahead feels meaner, and so does your wallet: fuller.', relic('rk-pact-booth', 'The Pact', [{ kind: 'moneyMultiplier', value: 1.5 }, { kind: 'enemyLevelOffset', value: 2 }]))),
  },
  {
    id: 'rk-curse-lottery',
    intro: 'A hooded clerk spins a drum of tickets. "Every curse comes with its blessing. Draw one. You\'ll read both before you sign."',
    choices: [
      ch('Draw a ticket.', out('The drum stops. A ticket drops into your hand, face up.', roomFrom(...TICKETS.map((t) => t.id)))),
      ch('Read it again.', again('rk-curse-lottery', 'A ticket gives one blessing and one curse, for the rest of the run. You read both before you sign. Nothing is hidden.')),
      ch('No.', out('You walk past the booth. The drum keeps spinning for someone else.')),
    ],
  },
  ...TICKETS.map((t) => room(t.id, 'A Lottery Ticket', 'Run-Wide Modifiers', '#3a2448', `The ticket reads: BLESSING: ${t.gain} CURSE: ${t.cost} For the rest of the run.`,
    pactChoices(t.id, `You read the ticket again. Blessing: ${t.gain} Curse: ${t.cost}`, out('You sign the back of the ticket. It burns away, and both halves of it stay with you.', relic(t.id, 'Curse Lottery Ticket', t.effects))))),
  {
    id: 'rk-fate-cards',
    intro: 'A dealer fans three cards face down. "Each one gives, and each one takes. Turn one. You\'ll read it before you agree."',
    choices: [
      ch('Turn a card.', out('The dealer lets you choose. You turn it over.', roomFrom(...CARDS.map((c) => c.id)))),
      ch('Read it again.', again('rk-fate-cards', 'Each card prints its gain and its cost. You read both before you sign. Nothing is hidden.')),
      ch('No.', out('You leave the cards face down. The dealer shrugs and shuffles.')),
    ],
  },
  ...CARDS.map((c) => room(c.id, c.name, 'Run-Wide Modifiers', '#2c2440', `${c.name}. GIVES: ${c.gain} TAKES: ${c.cost}`,
    pactChoices(c.id, `You read the card again. ${c.name}. Gives: ${c.gain} Takes: ${c.cost}`, out(`The dealer lays ${c.name} on the table between you, and it is done.`, ...c.effects), c.req))),
  {
    id: 'rk-risk-dial',
    intro: `A brass dial on a post, marked from Calm to Chaos. The needle sits at Calm. ${DIAL[0]!.words} Sign, and it holds for the rest of the run.`,
    choices: [dialSign(0), dialTurn(0), ch('Read it again.', again('rk-risk-dial', `The plate under the dial: ${DIAL.map((d) => d.words).join(' ')}`)), ch('No.', out('You leave the dial where it is.'))],
    remembers: [1, 2, 3].map((i) => variant(`point-${i}`, [flagIs('rk-dial-point', i, i)], { intro: `The brass dial. The needle sits at ${DIAL[i]!.name}. ${DIAL[i]!.words} Sign, and it holds for the rest of the run.`, hide: [0, 1], add: [dialSign(i), dialTurn(i)] })),
  },
  {
    id: 'rk-shadow-boon',
    intro: `Your own shadow peels off the road and stands up. It has your voice. "I'll lend you strength now. You pay it back later." It holds out a contract: ${PACT_TEXT.shadow}`,
    choices: pactChoices('rk-shadow-boon', `Your shadow reads it to you, slowly, in your voice. ${PACT_TEXT.shadow}`, out('Strength pours into your lead from the ground up. Your shadow lies back down at your feet. It will be waiting at the next boss, and it says so.', { kind: 'statBoost', stat: 'all', percent: 5, who: 'lead', until: 'region' }, { kind: 'tempEffect', label: 'The Shadow\'s Loan', effects: [{ kind: 'bossLeadStages', value: -1 }], battles: 1, until: 'boss' })),
  },
  {
    id: 'rk-sunk-cost',
    intro: `A half-built bridge across a gorge, and a builder sitting on the last plank. "We're in too deep. 500 already in it. Keep paying, or walk away." ${PACT_TEXT.sunk}`,
    choices: pactChoices('rk-sunk-cost', `The builder goes through it again, honestly. ${PACT_TEXT.sunk}`, out('You pay. The last planks go down by evening and you cross by the shortcut, high over the gorge, with the wind in your face.', $(-500), express(), rp(1)), [money(500)], 'You walk away. The 500 already in the bridge stays in the bridge. The builder nods: "That\'s fine. Somebody else will finish it." It is fine. You go round.'),
  },
];

export const EVENTS: Json[] = [...STANDALONE_B, ...PACTS];
export const REMOVE: string[] = [];
void [HELD, has, wild];
