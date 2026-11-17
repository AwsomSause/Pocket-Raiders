// Catalog Overhaul Pack, category "places": STORY_FAMILIES_15.md part 1.
// SF93 The Crystal Hollow (a four-room Landmark Delve, drawn as a pseudo-stage), SF95 Deliveries, SF96 The Winter Set, SF101 Reputation scenes.
import { BERRIES, SNACKS, $, any, ch, ev, flag, flagIs, fr, has, heal, hurt, item, lose, money, out, ptype, rp, stopHere, takeNode, type Json } from '../dsl.ts';
import { kind, leaveP, moment, mtype, no, rep, variant } from './_delve.ts';

export const CATEGORY = 'places';

const trust = (n: number): Json => ({ kind: 'rivalChange', feelings: { trust: n } });
const typeShift = (type: string): Json => ({ kind: 'typeShift', type, who: 'top' });
const stay = (id: string, text: string, ...fx: Json[]): Json => out(text, ...fx, { kind: 'addEvent', eventId: id });
const go = (id: string, text: string, ...fx: Json[]): Json => out(text, ...fx, { kind: 'addEvent', eventId: id });
const back = (name: string): Json => ch('Turn back.', out(`You keep what you carry and climb back out of ${name}. The hum follows you a long way.`, leaveP));

// ---------- SF93. The Crystal Hollow ----------
// The entrance stays on the map node; the Hall, the Lake and the Heart are the drawn pseudo-stage (src/data/catalogOverhaul/pseudo/places.json).
const HUM = 'crystal-hollow-hum-stopped';
const CRYSTAL: Json[] = [
  {
    id: 'crystal-hollow-entrance',
    intro: 'A cave whose walls are ice and whose ceiling is a field of quartz. Your Pokémon hear a hum before you do. At the mouth, a crystal miner named Petra is roping up her packs. "It sings. Nobody\'s ever found where from. I\'m done looking."',
    choices: [
      ch('Go in.', go('crystal-hollow-1', 'You duck under the quartz. The hum gets inside your teeth. Behind you Petra calls, "Mind your reflection. It talks."', rp(2))),
      ch('Ask what she found.', stay('crystal-hollow-entrance', 'Petra digs in a pocket and drops a chip of crystal in your palm. It hums. Your starter\'s ears go up: it is the same note as its own heartbeat. "Keep it," she says. "It never sang for me like that."', item('crystal-chip'), flag('crystal-hollow-chip'), fr(5, 'starter'))),
      ch('Leave.', out('You help Petra with her packs and walk on. Behind you the hollow sings to nobody.')),
    ],
    remembers: [variant('chip', [flagIs('crystal-hollow-chip')], { notice: 'The chip in your pocket hums along with the cave.', hide: [1] })],
  },
  {
    id: 'crystal-hollow-1',
    intro: 'The Hall of Mirrors. Every surface shows a slightly different you. In each one, {lead} is a different evolution: larger, or smaller, or something it never chose to be. The reflection-you speaks. "This one could have been. Do you mind that it wasn\'t?"',
    choices: [
      ch('"No. It\'s right as it is."', go('crystal-hollow-2', 'You put your hand on {lead}\'s head, the real one. All the mirror-versions go still and look at the two of you. Then, one by one, they look away, as if embarrassed to have asked.', fr(10, 'lead'))),
      ch('"Show me."', go('crystal-hollow-2', 'The reflection steps aside. The other {lead} stands there in the glass, its numbers written beside it like a scorecard: stronger here, slower there. Nothing changes. You find you do not want it to.', rp(2))),
      ch('Smash the mirror.', go('crystal-hollow-2', 'Your fist goes through the glass. A crack runs across the whole hall, every reflection splits, and shards rain down on all of you. The hum stops dead, as if the hollow is holding its breath.', hurt(0.05), flag(HUM))),
      back('the Crystal Hollow'),
    ],
  },
  {
    id: 'crystal-hollow-2',
    intro: 'The Frozen Lake. Black ice, and a single path of white stones across it. Your team listens: one stone hums wrong.',
    choices: [
      ch('Step on the stones in order of the hum.', go('crystal-hollow-final', 'You listen with your eyes closed and step only where the note is right. The wrong stone sinks into black water behind you, singing a flat note all the way down.', rp(2)), { requires: [no(HUM)] }),
      ch('Send an Ice-type across first.', go('crystal-hollow-final', 'Your Ice-type walks out, puts a foot on each stone, and freezes the wrong one solid where it stands. It waits on the far side for you, very pleased.', fr(5, { types: ['ice'] })), { requires: [ptype('ice')] }),
      ch('Walk the ice.', go('crystal-hollow-final', 'The black ice holds for ten steps. On the eleventh it cracks like a shout and everyone goes in to the knees. You drag each other out the far side, blue and shaking.', hurt(0.1))),
      back('the Crystal Hollow'),
    ],
    remembers: [variant('silent', [flagIs(HUM)], { notice: 'Since you broke the mirror, the hollow has made no sound. Every stone is silent. You cannot tell which one is wrong.' })],
  },
  {
    id: 'crystal-hollow-final',
    intro: 'The Heart Crystal: a crystal as big as a house, humming at exactly the note of your highest-Bond Pokémon. It leans toward the crystal as if called. The crystal offers it a shift, for good: its second type will become Fairy. You can see it in the light already.',
    choices: [
      ch('Accept the shift.', out('Light pours through your Pokémon, and the hum and its heartbeat become one note. When the light fades it is itself, and a little more: part Fairy, for the rest of the road.', typeShift('fairy'), flag('crystal-hollow-done'), leaveP, moment('The Heart Crystal shifted your partner\'s type.', 60))),
      ch('Refuse.', out('You put a hand on your partner and step back. The crystal dims, gently, as if it understands. A piece of it breaks away at your feet: a Light Clay, still warm.', item('light-clay'), flag('crystal-hollow-done'), leaveP)),
      ch('Let the Pokémon choose.', out('You step back and leave it to them. Your partner walks up to the crystal and listens for a long moment. Then it turns its back on the light and walks back to you. It chose itself.', fr(15, 'top'), flag('crystal-hollow-done'), leaveP, moment('Your partner listened to the Heart Crystal and chose to stay itself.', 65))),
    ],
    remembers: [
      variant('rock', [{ kind: 'region', ids: ['kanto', 'hoenn', 'kalos', 'paldea', 'grand', 'cairnmoor'] }], { intro: 'The Heart Crystal: a crystal as big as a house, humming at exactly the note of your highest-Bond Pokémon. It leans toward the crystal as if called. The crystal offers it a shift, for good: its second type will become Rock. You can see it in the light already.', hide: [0], add: [ch('Accept the shift.', out('Light pours through your Pokémon, and the hum and its heartbeat become one note. When the light fades it is itself, and a little more: part Rock, for the rest of the road.', typeShift('rock'), flag('crystal-hollow-done'), leaveP, moment('The Heart Crystal shifted your partner\'s type.', 60)))] }),
      variant('ice', [{ kind: 'region', ids: ['johto', 'sinnoh', 'unova', 'galar', 'tidewrack-reaches', 'orrery-basin'] }], { intro: 'The Heart Crystal: a crystal as big as a house, humming at exactly the note of your highest-Bond Pokémon. It leans toward the crystal as if called. The crystal offers it a shift, for good: its second type will become Ice. You can see it in the light already.', hide: [0], add: [ch('Accept the shift.', out('Light pours through your Pokémon, and the hum and its heartbeat become one note. When the light fades it is itself, and a little more: part Ice, for the rest of the road.', typeShift('ice'), flag('crystal-hollow-done'), leaveP, moment('The Heart Crystal shifted your partner\'s type.', 60)))] }),
    ],
  },
];

// ---------- SF95. Deliveries ----------
const DELIVERIES: Json[] = [
  {
    id: 'deliver-devon-goods',
    intro: 'A Devon Corp. agent is waiting at the crossroads, checking his watch. "Those goods! At last! Let me return the favour: half price at our stall." The box under your arm is a prototype. You notice, now, that its seal is broken.',
    choices: [
      ch('Hand it over sealed.', out('You press the broken seal flat and hand it over with both hands. He never looks inside. "Devon remembers its friends." He opens the stall for you, at half price.', { kind: 'tempEffect', label: 'Devon half price', effects: [{ kind: 'priceMultiplier', group: 'all', value: 0.5 }], battles: 1, until: 'battle' }, stopHere('shop'))),
      ch('Look inside first.', out('Inside, in foam: a Poké Ball that catches anything weakened. The agent sees you looking and goes white. "That is not... please. Take one. Take two. Only don\'t tell anyone. Promise me."', item('devon-ball', 2), flag('devon-silence'))),
      ch('Ask what it is.', stay('deliver-devon-goods', '"A better Ball," he says, softly, as if it were a child. "One that understands when a Pokémon is tired of running. For everyone, eventually. Not yet."', rp(1))),
    ],
    remembers: [variant('asked', [{ kind: 'eventSeen', id: 'deliver-devon-goods' }], { notice: '"A better Ball. For everyone, eventually."', hide: [2] })],
  },
  {
    id: 'deliver-gram-1',
    intro: 'A post-office clerk looks up from her ledger at the parcel in your hands. "Gram one! One piece of the set." She says it like a prayer. It is part of a gramophone. Her late father\'s.',
    choices: [
      ch('Hand it over.', out('She holds it in both hands. "Thank you. Truly." She pays you from her own purse.', $(200), flag('gram-delivered'))),
      ch('Ask about the gramophone.', out('"Dad recorded one song on it before he died. Only one. Then it broke into three pieces, and we three took one each and swore to put it back together." She looks at the piece. "We never did. Until now." She pays you and holds on to your hand a moment.', $(200), flag('gram-delivered'), flag('gram-story'))),
    ],
  },
  {
    id: 'deliver-gram-2',
    intro: 'Another post office, another clerk; the first one\'s brother, with her eyes. "You\'re kind to bring it," he says, before you have even said what it is. "Gram two."',
    choices: [
      ch('Hand it over.', out('He fits it to nothing, holding it in the air where the rest should be. "Two of three." He pays you.', $(200), flag('gram-delivered'))),
      ch('Ask about the gramophone.', out('"Dad couldn\'t sing. He sang anyway. Into a horn, onto wax, the one time." He laughs. "We split the machine so none of us could play it without the others. Stubborn family." He pays you.', $(200), flag('gram-delivered'), flag('gram-story'))),
    ],
  },
  {
    id: 'deliver-gram-3',
    intro: 'Two clerks stand side by side at the third counter, and a third you have not met: the youngest. "Gram three," they all say together. "The set\'s complete."',
    choices: [
      ch('Hand it over.', out('They thank you three times, one each, and pay you three times, one each.', $(200), flag('gram-delivered'))),
      ch('Ask about the gramophone.', stay('deliver-gram-3', '"One song," says the youngest. "We were too angry at each other to play it, after. Then too proud. Then too long had gone by." The three of them look at the pieces on the counter.', flag('gram-story'))),
    ],
    remembers: [variant('all', [flagIs('gram-delivered', 2)], { notice: 'You carried all three pieces. They have set them on the counter, and look at you.', add: [ch('"Play it."', out('They fit it together, and wind it, and set the needle down. A man\'s voice comes out of the horn, singing very badly, very happily, a song about three children. The clerks cry. Then they laugh, all three, at the same wrong note. The youngest presses a Soothe Bell into your hands.', item('soothe-bell'), $(200), ...kind(), moment('You helped three siblings play their father\'s one song.', 65)))] })],
  },
  {
    id: 'deliver-letter',
    intro: 'A shopkeeper reads the address on the letter you carry and gasps, both hands flying to her mouth. "That\'s for me!"',
    choices: [
      ch('Give it.', out('She tears it open right there and reads it twice. Her son is abroad. Her son is coming home. She tells every customer in the shop, then every customer who comes in after, and gives you anything you look at for a week.', ...kind(), flag('rep'))),
      ch('Read it first.', out('You read it on the step, while she watches through the glass. It is only a son telling his mother he is coming home. You hand it over. She reads your face before the letter, and does not thank you.', rep(-1))),
      ch('Ask who sent it.', stay('deliver-letter', '"My boy." She does not take her eyes off the envelope. "Three years. Not a word. That\'s his writing."')),
    ],
    remembers: [variant('asked', [{ kind: 'eventSeen', id: 'deliver-letter' }], { notice: '"That\'s his writing," she whispers.', hide: [2] })],
  },
  {
    id: 'deliver-oaks-parcel',
    intro: 'A Mart clerk leans over the counter. "Is that parcel for Professor Oak? He told us to expect it! He\'s been ringing every morning."',
    choices: [
      ch('Yes, take it to him.', out('"I\'ll run it over at lunch. Here, for your trouble." Five Poké Balls and his thanks.', item('poke-ball', 5))),
      ch('Deliver it myself.', out('You walk it to the lab yourself. Oak meets you at the door, tears the paper off like a child, and insists on upgrading your Pokédex on the spot. "The data you\'ll bring me! Off you go!"', flag('oak-parcel-delivered'), rp(5), moment('You delivered Professor Oak\'s parcel by hand.', 50))),
      ch('Open it.', out('Inside, wrapped in an old lab coat: a Poké Ball model, hand-carved, from Oak\'s own youth. When you finally bring it to him he sees the loose paper and laughs until he wheezes. "I made that at your age! Badly!"', rp(3), $(100))),
    ],
  },
  {
    id: 'deliver-parcel',
    intro: 'The clinic healer sees the parcel and almost runs to the door. "I\'ve been waiting for that! Come in, come in."',
    choices: [
      ch('Hand it over.', out('Medicine. She goes straight to the back, where a small Pokémon lies under a blanket, and gives it the first dose with you watching. Within the hour it is sitting up and eating. She presses a Potion on you at the door.', item('potion'), ...kind())),
      ch('Ask what\'s in it.', out('"Medicine for a little one in the back. It hasn\'t eaten in three days." She lets you come and watch it work: the first dose, the first sip of water, the first look round the room. Then she sends you off with a Potion.', item('potion'), fr(3, 'party'))),
    ],
  },
  {
    id: 'delivery-rider',
    intro: 'A rider in a scratched helmet skids to a stop and pushes a package into your arms. "Zelda, Rider Post. Carry this three stops. Don\'t open it. Pay on delivery."',
    choices: [
      ch('Take it.', out('You tuck it into your bag. It is heavier than it looks, and it does not rattle.', flag('parcel'))),
      ch('Refuse.', out('"Your loss." She roars off to find somebody else.')),
    ],
  },
  {
    id: 'delivery-rider-drop',
    intro: 'Zelda is waiting at the crossing three stops on, helmet under her arm. "Did you bring it?"',
    choices: [
      ch('"Here, unopened."', out('She checks the seal, nods once, and pays you on the nail. "Good courier. Rare thing."', $(800), flag('parcel', -1))),
      ch('"I opened it."', out('She goes red, then white. You show her what is inside: papers, maps, names. Evidence against the evil team, being carried by their own couriers. Zelda reads it and sits down on the kerb. "...I didn\'t know." She takes off her Rider Post badge and leaves it on the road.', flag('parcel', -1), flag('intel'), flag('zelda-quit'), moment('You showed Zelda what she had been carrying. She quit.', 55))),
      ch('"I lost it."', out('She looks at you for a long moment. "Right." She does not shout. She writes your name in a small book.', flag('parcel', -1), rep(-1))),
    ],
  },
];

// ---------- SF96. The Winter Set ----------
const WINTER: Json[] = [
  {
    id: 'lunar-lantern-walk',
    intro: 'Red lanterns hang over the street, and a dragon dance winds between them. A dancer at the head, Mei, waves you in. "Hold a lantern! The dragon needs a tail!"',
    choices: [
      ch('Hold one.', out('You hold a lantern at the dragon\'s tail and run when it runs. Your team runs too, under the red light, and every one of them is grinning by the end.', fr(3, 'party'))),
      ch('Dance with them.', out('You get the steps on the third try and keep them all the way down the street. Mei gives you a Dragon Fang from the costume\'s jaw. "You earned a tooth."', item('dragon-fang')), { prompt: { id: 'echo-rhythm', needs: 'good' }, fail: out('You tread on the dragon\'s tail twice. Mei laughs so hard the head falls off. No tooth, but a good night.', fr(2, 'party')) }),
      ch('Watch.', out('You sit on a step and watch the dragon go by, again and again, in the lantern light. Your team sleeps against you.', heal(1))),
    ],
  },
  {
    id: 'winter-frost-king',
    intro: 'A snow worker crowned with icicles blocks the pass, challenging every passer-by. Beside him stands a huge white horse, breath steaming. "The Frost King! Best me and pass. Lose and shovel snow."',
    choices: [
      ch('Battle.', { text: '"Ha! To arms, old girl!" The white horse steps forward.', effects: [], battle: { kind: 'trainer', pseudo: true, name: 'The Frost King', classId: 'snow-worker', team: ['glastrier', 'abomasnow', 'beartic'], size: 3, types: [], levelBonus: 3, win: [$(900), flag('frost-king-beaten')] } }),
      ch('Shovel snow. (a node)', out('You shovel snow all afternoon while the Frost King supervises from his throne of ice, shouting encouragement. At sundown he laughs and waves you through. "Good back on you!"', takeNode(), fr(2, 'party'))),
      ch('Ask about the horse.', stay('winter-frost-king', '"Found her in a drift, starving, ribs like a ladder. Fed her. She stayed." He pats the great white neck. "Sometimes, at night, she looks up the mountain like someone\'s calling her home." Up the mountain, very faintly, something is.', flag('sign-calyrex'))),
    ],
    remembers: [variant('asked', [flagIs('sign-calyrex')], { notice: 'The white horse watches the mountain.', hide: [2] })],
  },
  {
    id: 'winter-gift-exchange',
    intro: 'Under a glowing tree, trainers swap wrapped gifts. The organiser has a clipboard and a firm voice. "Bring one, take one. Every gift\'s tier is on the tag. No tricks."',
    choices: [
      ch('Swap a gift.', out('You wrap an Oran Berry; its tag says Common. You pick a gift with a tag that says Common. It is a treat, wrapped by someone who cared.', lose('oran-berry'), any(...SNACKS)), { requires: [has('oran-berry')] }),
      ch('Give without taking.', out('You put a gift under the tree and walk away empty-handed. The organiser writes your name on a bauble and hangs it high, where everyone will see it next year.', lose(), ...kind(), flag('gift-bauble'))),
      ch('Watch.', out('You watch strangers open strangers\' gifts under the lights. Nobody gets anything expensive. Everybody is happy.', heal(0.25))),
    ],
  },
  {
    id: 'new-year-countdown',
    intro: 'Fireworks wait on the hill for midnight. A trainer in a scarf wants one last battle of the year. It\'s your rival, grinning in the cold.',
    choices: [
      ch('Battle.', { text: '"Last battle of the year. Make it a good one." 3... 2... 1...', effects: [], battle: { kind: 'trainer', pseudo: true, rival: true, name: 'Rival', size: 3, types: [], levelBonus: 2, win: [$(800), flag('rival-last-battle-year')] } }),
      ch('Watch the fireworks together.', out('You sit on the cold grass, side by side, and watch the sky go gold and green. Neither of you says much. You don\'t need to.', trust(1), flag('rival-fireworks'))),
      ch('Make a promise for next year.', out('"Same place next year. Whoever\'s stronger buys the cocoa." Your rival holds out a gloved hand, and you shake on it as the first rocket goes up.', flag('rival-promise-made'), trust(1))),
    ],
  },
];

// ---------- SF101. Reputation scenes ----------
const REPUTATION: Json[] = [
  {
    id: 'circuit-fans',
    intro: 'A knot of kids recognises you from the Circuit and comes running with a banner. They have drawn your whole team on it in crayon. "Can you sign it? It\'s you! And your {starter}!"',
    choices: [
      ch('Sign it.', out('You sign it big, with a flourish. They shriek. A parent slips you a Berry for the road. Somewhere, someone who keeps lists writes your name a little higher on one.', any(...BERRIES), flag('rep'), flag('evil-known-sooner'))),
      ch('Draw something back.', out('You take a crayon and draw them a {starter}, badly. The kids scream with joy. Your {starter} looks at the drawing for a long time, and then at you, with enormous dignity.', fr(5, 'starter'))),
      ch('"I\'m busy."', out('Their faces fall. They roll up the banner and go.')),
    ],
  },
  {
    id: 'merchant-remembers',
    intro: 'A merchant from a town you hurried past blocks the road: Ilse Brack, arms folded. "We asked for help. You walked by. Prices are up for you. The inn\'s closed to you."',
    choices: [
      ch('"I\'m sorry. What can I do?" (two nodes)', out('"You can carry water." You do: two long days of hauling and mending in her town. On the second evening Ilse brings you supper herself. Prices are back where they were. The inn has a room.', takeNode(2), flag('ignored-crisis', -99), flag('kind-walked-past', -99), ...kind(), moment('You went back and made amends to Ilse Brack\'s town.', 55))),
      ch('"I had my reasons."', out('She listens to every one. "Reasons," she says, flat, and walks away. The prices stay up.', { kind: 'relic', id: 'brack-prices', name: 'Ilse Brack Remembers', effects: [{ kind: 'priceMultiplier', group: 'all', value: 1.15 }] })),
      ch('Walk on.', out('You walk past her the way you walked past her town. The prices stay up. The inn stays closed for the rest of the run.', { kind: 'relic', id: 'brack-prices', name: 'Ilse Brack Remembers', effects: [{ kind: 'priceMultiplier', group: 'all', value: 1.15 }] }, flag('brack-inn-closed'))),
    ],
    remembers: [variant('crisis', [{ kind: 'crisis', atLeast: 4, atMost: 5 }], { notice: 'You were at the crisis, at the end, when it mattered. You could tell her.', hide: [1], add: [ch('"I had my reasons."', out('You tell her where you were: at the climax of the crisis, holding the line. She is quiet for a long time. "...All right," she says. "All right." The prices come down.'))] })],
  },
];

export const EVENTS: Json[] = [...CRYSTAL, ...DELIVERIES, ...WINTER, ...REPUTATION];
export const REMOVE: string[] = [];
void [ev, money, mtype, rp];
