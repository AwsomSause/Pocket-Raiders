// Catalog Overhaul Pack: STORY_FAMILIES_11.md, SF90 CONS AND SCAMS (7 cons and the 10 front-company booths).
// Every con shows its tells in the scene. Spotting the tell exposes it (flag `con-<id>-exposed`, Reputation +1, a small reward).
// Falling for it costs exactly what the con takes (flag `con-<id>-lost`), and that money waits in the next Hideout's vault:
// the `market` effect's silent `stash` on key `hideout-vault` (a Hideout pays it back with `withdraw`, and a stolen item with `redeem`).
// The Apprentice (SF2) reads the counters `con-lost` and `con-exposed`. Grunts are male only (Kice), so the fake nurse is a man.
import { $, ch, fight, flag, flagIs, heal, item, out, trainer, type Json } from '../dsl.ts';
import { COMMON, aNode, kind, mk, moment, need, pay, rep, stay } from './_markets.ts';

export { CATEGORY } from './_markets.ts';

const VAULT = 'hideout-vault';
/** Fell for it: the con takes exactly this much, and it turns up in the next Hideout's vault. */
const lost = (id: string, money = 0): Json[] => [flag(`con-${id}-lost`), flag('con-lost'), ...(money > 0 ? [mk('stash', { key: VAULT, amount: money })] : [])];
/** Spotted it: exposed, and Reputation +1. */
const exposed = (id: string): Json[] => [flag(`con-${id}-exposed`), flag('con-exposed'), ...rep(1)];
/** The run's own Evil Team sends a grunt (a loss never ends the run). */
const grunt = (win: Json[] = []): Json => ({ kind: 'trainer', name: 'Grunt', evil: 'grunt', size: 2, friendly: true, ...(win.length ? { win } : {}) });
/** A question that narrows the con down: the scene stays, and next time only the tell is left to point at. */
const narrow = (id: string, label: string, text: string): Json => ch(label, out(text, flag(`con-${id}-asked`), stay(id)));
const narrowed = (id: string, notice: string, hide: number[]): Json => ({ id: `${id}-asked`, when: [flagIs(`con-${id}-asked`)], notice, hide });

// ---------- SF90.8 the front-company booths: one shape, each team's own words ----------
type Front = [team: string, front: string, line: string, cast: string];
const FRONTS: Front[] = [
  ['galactic', 'Galactic Energy Corp.', 'Clean energy from space! Well. From a lake.', 'trainer.pr/galactic_grunt_m'],
  ['plasma', 'Plasma Liberation League', 'Free the Pokémon! Starting with yours!', 'trainer.pr/plasma_grunt_m'],
  ['flare', 'Lysandre Labs', 'A beautiful future, for those who can pay.', 'trainer.pr/flare_grunt_m'],
  ['aether', 'Aether Paradise Conservation', 'We protect Pokémon. Mostly from their trainers.', 'trainer.pr/aether_grunt_m'],
  ['star', 'School Outdoor Club', 'Fun hikes! No teachers! Totally normal club!', 'trainer.pr/star_grunt_m'],
  ['marauders', 'Halvard Heritage Trust', 'Preserving the old ways. And the old vaults.', 'trainer.pr/macro_grunt_m'],
  ['choir', 'Hallow Marrow Bell Society', 'Sing with us. Everybody sings eventually.', 'trainer.psychic_m'],
  ['ironvein', 'Ironvein Energy Combine', 'Power for the people. Mined from under the people.', 'trainer.worker_m'],
  ['cartographers', 'Unfound Survey Society', "We map what nobody's found. Then we take it.", 'trainer.pr/backpacker_m'],
  ['gilt', 'Meridian Laurel Club', 'Members only. Membership: everything.', 'trainer.pr/clerk_m'],
];

const booth = ([team, front, line, cast]: Front): Json => {
  const id = `evil-${team}-disguise`;
  const shell = `front-${team}-shell`;
  const pinText = 'The smiling clerk wears a scarf, and under the scarf, just for a second, a pin you have seen before.';
  const sleeveText = 'The smiling clerk keeps his arms folded. When he reaches for a flyer, the inside of his sleeve flashes a pin you have seen before. They have learned to hide it. Not well enough.';
  const intro = (tell: string) => `A friendly booth under a striped awning, a banner reading ${front}, a stack of glossy flyers. ${tell} "${line} Sign up for our newsletter?" He asks which way you are headed.`;
  const readNotice = `You have already read the small print. ${front} is a front, and you know the name of the shell behind it.`;
  return {
    id, name: `${front} Booth`, stop: 'merchant',
    requires: [{ kind: 'evil', team, after: 2, ends: ['none'] }],
    scene: { cast: [cast] },
    intro: intro(pinText),
    choices: [
      ch('Sign up.', out(`You write your name, and, because he asks so nicely, your route. He beams. "Wonderful! We'll be in touch." Behind the booth, a radio crackles once and goes quiet.`, ...lost(id), flag('evil-ambush'), { kind: 'evil', heat: 1 })),
      ch('Read the small print.', out(`Under the glossy photos, in type so small it is nearly a line: "${front}, a wholly owned holding of" and then a name nobody would ever look twice at. You will look twice. It is a thread, and threads lead somewhere.`, flag(shell), flag('intel'), stay(id))),
      ch('Point out the pin.', fight(`"Nice pin," you say. The smile stays on his face for one more second, out of habit. Then it drops, and so does the act. "Should've worn a thicker scarf." He kicks the flyers aside and reaches for a Poké Ball.`,
        grunt([moment(`Exposed the ${front} booth. It folded before nightfall.`, 50)]),
        ...exposed(id), flag('front-exposed'), stay('front-officer-jenny'))),
    ],
    remembers: [
      { id: `${id}-read-sleeve`, when: [flagIs(shell), flagIs('front-exposed', 3)], intro: intro(sleeveText), notice: readNotice, hide: [1] },
      { id: `${id}-read`, when: [flagIs(shell)], notice: readNotice, hide: [1] },
      { id: `${id}-sleeve`, when: [flagIs('front-exposed', 3)], intro: intro(sleeveText) },
    ],
  };
};

export const EVENTS: Json[] = [
  // ---- SF90.1 Counterfeit Leftovers ----
  {
    id: 'counterfeit-items', name: 'Counterfeit Leftovers', stop: 'merchant',
    intro: 'A folding table of half-eaten apples, glossy as toys. Jinty, the seller, grins wide. "Genuine Leftovers, only ₽300!" They shine like plastic. The hand-written label reads "Lefttovers".',
    choices: [
      ch('Buy one.', out('You pay. Jinty wraps it in newspaper, very fast. At the next bend you unwrap it. It squeaks. It is a dog toy, painted red. Jinty and the table are gone.', pay(COMMON), ...lost('counterfeit-items', COMMON)), need(COMMON)),
      ch('Point out the spelling.', out('"Two Ts," you say, loud enough to carry. Jinty looks at the label. The crowd looks at the label. Jinty looks at the crowd, and runs. Somebody starts clapping, and then everybody is, and someone passes a hat for you.', ...exposed('counterfeit-items'), $(150))),
      narrow('counterfeit-items', 'Smell it.', 'You lean in and sniff. Real Leftovers smell of apple and a little of soil. These smell of nothing at all. Jinty sees your face change and starts, very casually, to pack up.'),
    ],
    remembers: [narrowed('counterfeit-items', 'You already know these smell of nothing. Only one thing left to say, and the label is right there.', [0, 2])],
  },
  // ---- SF90.2 The Fake Nurse ----
  {
    id: 'fake-nurse', name: 'The Fake Nurse',
    intro: 'A man in a nurse\'s pink cap waves you over. "Tired team? Hand me their Balls, I\'ll fix them right up!" His smile is off. No Chansey, no Audino. His cap badge is printed paper.',
    choices: [
      ch('Hand over the Balls.', out('He takes them behind a curtain. Real healing light flickers. He comes back with your team, healthy, and a bill for ₽500. A real Pokémon Center has never charged a coin. He is gone before you finish reading it.', heal(1), pay(500), ...lost('fake-nurse', 500)), need(500)),
      narrow('fake-nurse', "Where's your Chansey?", 'He blinks. "Day off." He blinks again. "Sick. Day off for being sick." He straightens the paper badge on his cap, which only draws your eye to it.'),
      ch('Point out the paper badge.', out('You flick the badge. It bends. He looks at it, then at you, and the whole act sags. "It\'s my first week," he mutters. A grunt in training. He drops a Potion as he bolts, which is honestly very nurse-like of him.', ...exposed('fake-nurse'), item('potion'))),
    ],
    remembers: [narrowed('fake-nurse', '"Day off," he said. The paper badge on his cap is still curling at one corner.', [0, 1])],
  },
  // ---- SF90.3 The Pickpocket ----
  {
    id: 'pickpocket', name: 'The Pickpocket',
    intro: 'A shoulder hits yours in the crowd. "Sorry, sorry!" A hand was in your bag, and now it is not, and neither is the best thing that was in there. A figure is already running.',
    choices: [
      ch('Chase.', out('You run. Through a market, over a wall, round three corners and into a dead end. The thief turns, panting, and hands it back without a word. It took the rest of the afternoon.', ...aNode(), ...exposed('pickpocket'))),
      ch('Send a fast Pokémon.', out('Your fastest Pokémon is gone before you finish pointing. It is back before the thief has finished running, carrying your things in its mouth, very proud.', ...exposed('pickpocket'))),
      ch('Let it go.', out('You let it go. Things are only things. But you will remember the face, and somewhere, in some vault, your things will be waiting with a label on them.', mk('stolen', { key: VAULT }), ...lost('pickpocket'))),
    ],
  },
  // ---- SF90.4 The Disguised Merchant ----
  {
    id: 'vt-disguised-merchant', name: 'The Disguised Merchant', stop: 'merchant',
    intro: 'A friendly seller with prices a little too good. Three Great Balls for ₽300. A radio on his belt hisses softly. His boots are black, polished, and standard issue for a certain team.',
    choices: [
      ch('Buy.', out('The Balls are real, and cheap, and you know exactly where your money just went. Somewhere a plan you would rather stop moves a little faster.', pay(COMMON), item('great-ball', 3), ...lost('vt-disguised-merchant'), flag('evil-funded'), { kind: 'evil', heat: 1 }), need(COMMON)),
      ch('Point out the boots.', fight('"Nice boots," you say. "Team issue?" His smile drops like a shutter. The radio on his belt barks a name and a place before he can switch it off. You heard it. He knows you heard it.',
        grunt(), ...exposed('vt-disguised-merchant'), flag('intel'))),
      narrow('vt-disguised-merchant', 'Ask where the goods came from.', '"Here and there," he says, too quickly. His eyes go to his own boots, just for a second, the way people look at the thing they hope you will not.'),
    ],
    remembers: [narrowed('vt-disguised-merchant', '"Here and there," he said. He keeps shifting his feet, as if the boots were too tight.', [0, 2])],
  },
  // ---- SF90.5 The Poké Ball Sting ----
  {
    id: 'vt-pokeball-sting', name: 'The Poké Ball Sting',
    intro: 'A man in a trench coat sells "special" Poké Balls from the back of a van. No maker\'s mark on any of them. Three more men sit in the van. One Ball on the tray rattles by itself.',
    choices: [
      ch('Buy.', out('₽1,000 for a bag of shining Balls. The first one you throw cracks in half in the air. So does the second. The van, of course, is long gone.', pay(1000), ...lost('vt-pokeball-sting', 1000)), need(1000)),
      ch('Open the rattling one.', out('You pop it open before he can stop you. A tiny, frightened Pokémon tumbles out, someone\'s, with a name tag. The man runs. You carry it to the Lost and Found, and its trainer cries when they see it.', ...exposed('vt-pokeball-sting'), ...kind(1), flag('lost-and-found-returned'))),
      ch('Look in the van.', fight('Crates. Dozens of them, stamped with ports you know, all rattling. This is no stall. It is a ring. The three men climb out, one at a time, cracking their knuckles.',
        trainer('The Van Crew', { cls: 'roughneck', chain: 3, size: 2, friendly: true }), ...exposed('vt-pokeball-sting'), flag('lead-smuggling-ring'), flag('intel'))),
    ],
  },
  // ---- SF90.6 The Bake Sale ----
  {
    id: 'vt-rocket-bake-sale', name: 'The Bake Sale',
    intro: 'A cheerful stall of cookies "for sick Pokémon". The cash box names no charity. The cashier\'s collar has a red R stitched on it. One cookie, under a little glass dome, is labelled "Boss\'s".',
    choices: [
      ch('Buy a cookie.', out('₽200. It is, annoyingly, a very good cookie. Your lead gets half and perks right up. Somewhere, the money is counted in a back room by people in black.', pay(200), mk('mend', { factor: 0.05, who: 'lead' }), ...lost('vt-rocket-bake-sale', 200)), need(200)),
      narrow('vt-rocket-bake-sale', 'Which charity?', '"Um." The cashier looks at the cash box. "The... Pokémon one." He tugs his collar up higher, which puts the R right under your nose.'),
      ch('Point out the collar.', out('"That\'s an R," you say. The cashier, Petey, bursts into tears. "I just like baking!" He gives you a cookie for free, and a recipe, and his whole sad story. You believe every word of it.', ...exposed('vt-rocket-bake-sale'), mk('mend', { factor: 0.05, who: 'lead' }))),
    ],
    remembers: [
      { id: 'bake-sale-dilly', when: [flagIs('grunt-school-active')], notice: 'The other cashier looks very familiar. Dilly, from Grunt School, sees you and ducks under the table.', hide: [2],
        addChoices: [ch('Point out the collar.', out('"That\'s an R," you say. Petey bursts into tears. "I just like baking!" Under the table, Dilly whispers, "Don\'t tell them I was here." Petey gives you a cookie for free.', ...exposed('vt-rocket-bake-sale'), flag('dilly-hid'), mk('mend', { factor: 0.05, who: 'lead' })))] },
      narrowed('vt-rocket-bake-sale', '"The... Pokémon one," he said. The R on his collar has not gone anywhere.', [0, 1]),
    ],
  },
  // ---- SF90.7 The Shady Surveyor ----
  {
    id: 'vt-shady-surveyor', name: 'The Shady Surveyor',
    intro: 'Four people at a market stall. One of them just lifted a wallet; you saw it, not clearly. One has dirt on his knees. One wears a team pin. One keeps a hand in a pocket. One is the victim.',
    choices: [
      ch('Accuse the one with a pin.', out('You point. The pin-wearer freezes, then empties his coat on the stall. The wallet falls out. Its owner hugs you, then hugs the stallholder, then tips you for your trouble.', ...exposed('vt-shady-surveyor'), $(150))),
      ch('Accuse the one with a hand in their pocket.', out('She takes her hand out. It is empty and very cold. "It\'s winter," she says, icily. The whole stall stares at you. You stare at the floor.', ...rep(-1))),
      ch('Accuse the one with dirt on their knees.', out('"I\'m a gardener," he says, wounded, and shows you a trowel. He has been kneeling in begonias all morning. He forgives you quickly, which somehow makes it worse.')),
      ch('Tell the victim to check their pocket.', fight('The victim pats his coat. "My wallet!" The pin-wearer bolts at once, which answers everything. You give chase through the stalls, and he turns at the end of the row to fight.',
        grunt([flag('con-vt-shady-surveyor-exposed'), flag('con-exposed'), ...rep(1), $(150)]))),
    ],
  },
  // ---- SF90.8 The Front-Company Booths ----
  ...FRONTS.map(booth),
  // Officer Jenny takes the statement after a front booth is exposed; at the third, she gives the Detective's Badge (SF90.8 Remembers).
  {
    id: 'front-officer-jenny', name: 'Officer Jenny', group: 'Evil Teams', stop: 'merchant', room: true,
    scene: { cast: ['trainer.pr/officer'] },
    intro: 'Officer Jenny arrives as the booth comes down, notebook already out. She takes your statement and the flyers, and nods at you like one professional to another. "Good eye. Keep it open."',
    choices: [ch('Salute.', out('You salute. She salutes back, crisply, and climbs onto her motorbike. "If you see another one," she calls, "you know where I am."'))],
    remembers: [
      { id: 'jenny-badge', when: [flagIs('front-exposed', 3), flagIs('detectives-badge', 0, 0)], notice: 'Officer Jenny closes her notebook. "Three fronts. Three." She unpins something from her own jacket. "We give these out maybe twice a year."',
        addChoices: [ch('Take the badge.', out('A Detective\'s Badge, small and bright, still warm from her jacket. "They\'ll change their tells now," she warns. "Pins in sleeves, probably. Keep looking." You pin it on.', flag('detectives-badge'), moment('Officer Jenny pinned a Detective\'s Badge on you after three front booths fell.', 70)))] },
    ],
  },
];

export const REMOVE: string[] = [];
