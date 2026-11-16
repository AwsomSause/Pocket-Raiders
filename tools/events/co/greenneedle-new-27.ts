// Greenneedle gn.new.27 The Little Cup (doc GREENNEEDLE_PLACED_2.md lines 250-283).
// Build: npm run co:build -- greenneedle-new-27   then   npm run co:gn
// Four rounds on one node, first-stage Pokémon only, everyone at level 5 (core/greenneedle/littlecup.ts). Must-see, step 15; once per region.
import { ch, fight, heal, item, out, trainer, type Json } from '../dsl.ts';
import { chIf, gev, gn, is, moment, not, notThisRegion, rm, say, scene, setTo, stampRegion, bond, intel, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#6b8f4a';
const cup = (o: Json = {}): Json => ({ tint: TINT, tags: ['Combat', 'Trainer', 'Story'], effect: 'none', ...o });
const gnc = (test: string): Json => ({ kind: 'gn', test });

interface Round { name: string; cls: string; intro: string; text: string }
const ROUNDS: Round[] = [
  { name: 'A Child with a Caterpie', cls: 'youngster', intro: say(
    'Round one. A child barely taller than the table, holding a Caterpie in both hands like something that might spill.',
    'It knows Tackle. Only Tackle. The child knows nothing else and does not seem to mind. "It\'s going to win," they say, with total faith.',
  ), text: 'The Caterpie squares up, all of it trembling. You do not laugh. Not once.' },
  { name: 'A Grandmother with a Wooper', cls: 'veteran', intro: say(
    'Round two. A grandmother in a cardigan, with a Wooper she has had for thirty years. It looks nothing like a thirty-year-old Pokémon.',
    '**The grandmother:** "She\'s slow. So am I. We\'ve never once been in a hurry, and we\'re still here."',
  ), text: 'The Wooper blinks at you, slowly. It has seen thousands of these. It still wants this one.' },
  { name: 'Mr. Prendergast', cls: 'worker', intro: say(
    'Round three. The Official himself, clipboard under one arm, with three perfectly bred, perfectly dull Pokémon in a perfect line.',
    '**Prendergast:** "Not one of them has ever surprised me. That is the achievement. I\'d like you to understand that it is an achievement."',
  ), text: 'He sets the clipboard down for the first time all day. It looks wrong, without it, in his hands.' },
  { name: 'Tansy-Jane', cls: 'youngster', intro: say(
    'The final. Tansy-Jane, last year\'s champion, and the Sunkern that has never lost. It sits in the sun that isn\'t there yet. It is very calm.',
    '**Tansy-Jane:** "I don\'t know why it wins either. I\'ve stopped asking. It just knows when to be bright."',
  ), text: 'The Sunkern looks up at the sky, and the sky, for reasons nobody can explain, listens.' },
];

function roundRoom(i: number): Json {
  const r = ROUNDS[i - 1]!;
  const win: Json[] = i < 4
    ? [heal(0.5), scene(`gn-new-27-b${i}`)]
    : [gn('lcEnd', { n: 1 }), gn('unbench'), item('little-cup'), moment('Won the Little Cup. Level 5, first-stage, and the biggest crowd of the year.', 60), scene('gn-new-27-champion')];
  return rm(`gn-new-27-r${i}`, `The Little Cup: Round ${i}`, cup(), r.intro, [
    ch('Battle.', fight(r.text, trainer(r.name, { cls: r.cls, size: i === 3 ? 3 : 1, lv: 0, friendly: true, rule: { gn: 'littlecup', slot: i }, win, lose: [gn('lcEnd', { n: 2 }), gn('unbench'), scene('gn-new-27-out')] }))),
  ]);
}

/** Between rounds: an entrant that is ready to evolve gets asked, once. */
const between = (i: number): Json => rm(`gn-new-27-b${i}`, `The Little Cup: After Round ${i}`, cup({ tags: ['Recovery', 'Story'] }), say(
  `The bell. Round ${i} is over, and the bench smells of orange slices. A small crowd has gathered along the rope, shouting names.`,
), [
  chIf([gnc('lcEvolver')], 'Cancel it. Stay in.', out('It wanted to. It looked at you first. Then it looked at the rope, and the shouting, and sat back down. It chose this.', gn('lcStay'), scene(`gn-new-27-b${i}`)), { }),
  chIf([gnc('lcEvolver'), gnc('lcMany')], 'Evolve. Withdraw.', out('The light takes it, and gives it back larger. Prendergast writes a line on the clipboard, and, very quietly, does not look pleased about it.', gn('lcWithdraw'), scene(`gn-new-27-r${i + 1}`))),
  chIf([gnc('lcEvolver'), gnc('lcAlone')], 'Evolve. Withdraw.', out('The light takes it, and gives it back larger. You were its only entry. Prendergast takes the clipboard back, kindly, and strikes your name off.', gn('lcWithdraw'), gn('lcEnd', { n: 2 }), gn('unbench'), scene('gn-new-27-out'))),
  chIf([gnc('lcIdle')], 'On to the next round.', out('You rest. You rub its ears. Somebody hands you an orange slice you did not ask for.', scene(`gn-new-27-r${i + 1}`))),
]);

const EVENTS: Json[] = [
  gev('gn-new-27-door', 'The Little Cup', cup({ stop: 'event', rarity: 'rare', forced: true, requires: [notThisRegion('lc-at'), gnc('lcEligible')] }), say(
    '*A banner across the gate, hand-painted: NO EVOLVED POKÉMON. NO EXCEPTIONS. YES, WE CHECK.*',
    '**Official, a very serious man with a clipboard, Mr. Prendergast:** "Three entrants. First-stage. I will be weighing them."',
    '*The bracket on the fence: children, grandparents, Prendergast himself, and at the bottom, last year\'s champion.*',
    '**A girl with a Sunkern, Tansy-Jane:** "It\'s never lost. I don\'t know why either."',
  ), [
    ch('Enter.', out('Prendergast hands you a pen. It is, you notice, also on a string.', stampRegion('lc-at'), scene('gn-new-27-pick'))),
    ch('Walk on.', out('Through the fence, somebody small is already cheering. You hear it for a long time.')),
  ]),
  rm('gn-new-27-pick', 'The Little Cup: Your Three', cup(), 'Choose who you enter, one at a time. Up to three. Everyone is set to level 5. The rest wait on the bench and shout advice.', [
    ch('Enter this one.', out('You point. Prendergast looks it up and down, and checks something off.', gn('lcBring'), when('lc-picked', { min: 3 }, [gn('bench'), gn('lcStart'), scene('gn-new-27-r1')], 'Three. The others go to the bench, and everyone entered is set to level 5.'), when('lc-picked', { min: 0, max: 2 }, [scene('gn-new-27-pick')])), { pick: {} }),
    ch('That\'s enough.', out('The others go to the bench. Everyone entered is set to level 5.', gn('bench'), gn('lcStart'), scene('gn-new-27-r1')), { requires: [is('lc-picked')] }),
  ]),
  ...[1, 2, 3, 4].map(roundRoom),
  ...[1, 2, 3].map(between),
  rm('gn-new-27-out', 'The Little Cup: Out', cup(), say(
    'It is over. Your entrants are their real size again, and they sit very close, watching the next match start without you.',
    'Prendergast crosses a name off the bracket. He does not enjoy it as much as he said he would.',
  ), [ch('Leave.', out('A child runs past with a Caterpie held high. You catch yourself clapping.'))]),
  rm('gn-new-27-champion', 'The Little Cup: Champion', cup(), say(
    'The Sunkern is beaten. Nobody quite believes it, least of all Tansy-Jane, who stands very still for a moment and then, helplessly, laughs.',
    'Prendergast hands you the Little Cup himself. It is smaller than you expected. It is heavier than it looks.',
  ), [ch('Take it.', out('**Tansy-Jane:** "It\'s a good cup. I\'ll want it back next year. I\'m telling you now."', setTo('lc-won', 1)))]),
  gev('gn-new-27-letter', 'A Letter from Tansy-Jane', cup({ stop: 'event', rarity: 'common', callback: true, tags: ['Story'], requires: [is('lc-result'), not('lc-letter')], remembers: [
    { id: 'won', when: [is('lc-won')], notice: 'The letter begins with one word, underlined three times: *HOW.*' },
  ] }), say(
    '*A letter, in a hand that slopes uphill. Tansy-Jane.*',
    'She asks how you beat it. Then, because she is kind, she tells you how you could have: "Keep the sun out. Or just be faster. Mostly be faster."',
    '"Next year," it ends. "Same time. Bring something small."',
  ), [
    ch('Read it twice.', out('You read it again on the road. It reads better the second time. Some letters do.', intel(1), setTo('lc-letter', 1))),
    ch('Write back.', out('You write four lines, and one of them is a joke. You hope she gets it.', bond(1), setTo('lc-letter', 1))),
  ]),
];

const REMOVE: string[] = [];

const PLACEMENT: Record<string, Placement> = {
  'gn-new-27-door': {
    gn: 'gn.new.27', shape: 'Hub', earliest: 'A3', home: 15, window: [13, 17], sits: 'must-see', attaches: 'town', tags: ['Tournament Episode'],
    level: 'Everyone is set to level 5 (your three entrants, first-stage only; the foes too)', often: 'region', badge: 'own',
    dressing: { kanto: 'The Little Cup', elsewhere: 'The Little Cup' },
    note: 'Must-see, once per region, step 15; fallback step 5 of the next stage. Four rounds on one node. No experience in the Cup. An entrant ready to evolve may cancel (Bond +2, sets littlecup-cancelled) or evolve and withdraw.',
  },
  'gn-new-27-letter': {
    gn: 'gn.new.27', shape: 'Single', earliest: 'A3', home: 1, window: [1, 2], sits: 'optional', attaches: 'after', tags: ['Story'],
    level: 'None', often: 'region', badge: 'own',
    dressing: { kanto: 'A Letter', elsewhere: 'A Letter' },
    note: 'Step 1 of the stage after the Cup: Tansy-Jane writes, how you beat it or how you could have.',
  },
};

const CHAINS: Json[] = [];

export { EVENTS, REMOVE, PLACEMENT, CHAINS };
