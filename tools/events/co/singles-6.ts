// Catalog Overhaul Pack, category "singles" (revised single events), batch 6.
// Doc: catalog_overhaul/STORY_FAMILIES_20.md SF144 Challenges, SF145 Shops and Workshops.
// Known limits: docs/status/co-singles.md.
import { $, any, anyType, bondUp, ch, fight, flag, flagIs, good, gym, heal, item, leave, out, room, trainer, wild, type Json } from '../dsl.ts';
import { friendlyAll } from './_singlesKit.ts';

export const CATEGORY = 'singles';

const moment = (text: string, importance = 40): Json => ({ kind: 'moment', text, importance });
const money = (atLeast: number): Json => ({ kind: 'money', atLeast });
const has = (id: string, count = 1): Json => ({ kind: 'item', id, count });
const lose = (id: string, count = 1): Json => ({ kind: 'loseItem', id, count });
const rep = (n = 1): Json[] => Array.from({ length: n }, () => flag('rep'));
const pick = { pick: {} };
const rm = (id: string, name: string, group: string, intro: string, choices: Json[], o: Json = {}): Json => ({ id, name, group, room: true, scene: { cast: [], effect: 'none' }, ...o, intro, choices });
const nextBattle = (label: string, effects: Json[]): Json => ({ kind: 'tempEffect', label, effects, battles: 1, until: 'battle' });
const learn: Json = { kind: 'train', what: 'learnMove' };
const TM = ['tm-normal', 'tm-fighting', 'tm-flying', 'tm-poison', 'tm-ground', 'tm-rock', 'tm-bug'];

// ---------- SF144. CHALLENGES ----------
const SF144: Json[] = [
  {
    id: 'boss-rush-mini',
    intro: 'Three huge wild Pokémon block the road, one behind the other, and all three are furious: eyes red, fur on end, ground torn up where they have been pacing. They are not hungry. Something has frightened them very badly.',
    choices: [
      ch('Fight them.', fight('The first one charges the moment you step forward. Three of them, one after another, and no time to breathe.', wild({ chain: 3, lv: 3 }))),
      ch('Find out why they\'re angry.', out('You circle wide around them, slow and careful, and follow the torn ground back the way they came. Over the next rise: cages, and nets, and a poacher camp.', room('boss-rush-poachers'))),
    ],
  },
  rm('boss-rush-poachers', 'The Poacher Camp', 'Challenges', 'A poacher camp: cages stacked three high, a cookfire, two men arguing over a ledger. In the cages, the young of the three angry Pokémon on the road, crying for their parents.', [
    ch('Free them.', fight('"Oi! Those are paid for!" The poachers grab their Poké Balls.', trainer('Poacher', { cls: 'worker', size: 3, lv: 2, win: [flag('poacher-camp-freed'), moment('Freed the poachers\' cages; three angry Pokémon calmed and went home.', 55)] }))),
  ], { scene: { cast: [], effect: 'none' } }),
  {
    id: 'camp-counselor-contest',
    intro: '**A camp counsellor** with a whistle and a clipboard: "Three-legged battle! You get a partner you didn\'t pick, and you win together or not at all!"',
    choices: [
      ch('Draw a partner.', fight('You draw a name out of the hat. Your partner for the day is a road trainer with a Growlithe that immediately licks your hand. "Don\'t let me down," they say, and grin.', trainer('Camp Pair', { cls: 'hiker', ally: 'growlithe', size: 2, win: [$(400), moment('Won a three-legged battle with a stranger.', 30)] }))),
    ],
  },
  {
    id: 'charity-match',
    intro: 'A banner across the square: ALL PRIZES TO THE TOWN FUND. A trainer is waiting under it, and behind them, a hand-painted thermometer showing how far the fund still has to go. It has a long way to go.',
    choices: [
      ch('Battle for the fund.', fight('The crowd cheers you both in. Every prize from this fight goes to the town.', trainer('Charity Champion', { cls: 'ace-trainer', size: 3, win: [...rep(2), moment('Won a charity match; the prize went to the town fund.', 45)] }))),
      ch('Donate instead (₽200).', out('You drop ₽200 into the bucket. Someone climbs a ladder and paints the thermometer a little higher, and the whole square claps for you.', $(-200), ...rep(2)), { requires: [money(200)] }),
    ],
  },
  {
    id: 'collectors-test',
    intro: '**A collector** in a coat covered in Water-type badges: "Water-type owners only. Bigger prize." He looks you up and down. "Anyone else can battle too. Normal prize."',
    choices: [
      ch('Battle (with a Water-type).', fight('His eyes light up when he sees your Water-type. "Now that is a proper trainer." Double prize.', trainer('Collector', { cls: 'psychic', size: 3, types: ['water'], win: [$(1200)] })), { requires: [{ kind: 'partyType', type: 'water' }] }),
      ch('Battle (without).', fight('"Fine, fine." He waves a hand. Normal prize.', trainer('Collector', { cls: 'psychic', size: 3, types: ['water'], win: [$(600)] }))),
    ],
  },
  {
    id: 'double-date-doubles',
    intro: '**Rosa and Hal**, holding hands and looking stricken: "Our partners cancelled! The tournament starts in five minutes! Borrow my Pokémon. Please."',
    choices: [
      ch('Team up.', fight('Rosa presses a Poké Ball into your hand. "Pikachu. She bites if you\'re rude." You and her Pikachu take the field together, against a pair who look very pleased about it.', trainer('Tournament Pair', { cls: 'ace-trainer', ally: 'pikachu', size: 2, win: [$(500), moment('Stood in for a cancelled partner at a doubles tournament.', 30)] }))),
    ],
  },
  {
    id: 'double-trouble',
    intro: 'Twins in matching scarves, finishing each other\'s sentences: "We battle..." "...together!" "Two against..." "...two!"',
    choices: [
      ch('Battle.', fight('They step out side by side, and their Pokémon do too.', trainer('Twins', { format: 'doubles', cls: 'ace-trainer', size: 2, win: [$(500)] }))),
    ],
  },
  {
    id: 'eco-ranger-test',
    intro: '**Ranger, Ingrid**, in a green jacket with a capture styler on her belt: "Calm them. No knockouts. A Ranger never hurts what they\'re protecting."',
    choices: [
      ch('Take the test.', fight('Three wild Pokémon, frightened and lashing out. Put them to sleep or wear them down, but do not let a single one faint.', trainer('Frightened Pokémon', { cls: 'hiker', size: 3, rule: { spare: true }, win: [flag('ranger-outpost'), { kind: 'addStop', stop: 'heal' }, moment('Passed the Eco Ranger test without one knockout.', 50)] }))),
    ],
  },
  {
    id: 'gym-scout',
    intro: '**A guide** leaning on the Gym town signpost, flipping a coin: "Want to know what\'s inside? The Leader\'s lead, and the ace. Everyone asks eventually."',
    choices: [
      ch('Yes (₽100).', out('You pay. She leans in and tells you, plainly, the first Pokémon out and the last one standing.', $(-100), gym()), { requires: [money(100)] }),
      ch('No.', leave('"Brave," she says. "Or stubborn." She goes back to flipping her coin.')),
    ],
  },
  {
    id: 'gym-trainer-ambush',
    intro: '**A gym trainer** in the Gym\'s colours steps out of a doorway: "Want to see what the leader uses? Battle me and show me you deserve to know."',
    choices: [
      ch('Battle me and show me.', fight('They take you on with the Gym\'s own style.', trainer('Gym Trainer', { cls: 'ace-trainer', size: 2, win: [gym(), $(300)] }))),
    ],
  },
  {
    id: 'held-item-gauntlet',
    intro: 'Four trainers in a row along the road, each holding something up: a Quick Claw, a Shell Bell, a Scope Lens, a Muscle Band. **"Beat us and keep what we were holding."**',
    choices: [
      ch('Run the gauntlet.', fight('The first three step out one after another. The Quick Claw, the Shell Bell and the Scope Lens are on the line.', trainer('Gauntlet Trainer', { cls: 'ace-trainer', size: 2, chain: 3, win: [item('quick-claw'), item('shell-bell'), item('scope-lens'), room('held-item-gauntlet-last')] }))),
    ],
  },
  rm('held-item-gauntlet-last', 'The Last of the Gauntlet', 'Challenges', 'The fourth trainer is the oldest, and holds up the Muscle Band without a word.', [
    ch('Battle.', fight('One more.', trainer('Gauntlet Veteran', { cls: 'veteran', size: 3, lv: 1, win: [item('muscle-band')] }))),
    ch('Stop here.', leave('You have three of the four. The veteran nods: fair enough.')),
  ]),
  {
    id: 'hot-dog-duelists',
    intro: 'Two hot dog vendors, one street corner, one grudge older than either of their carts. They see you and both shout at once: "Settle it!"',
    choices: [
      ch('Battle both.', fight('They come at you together, still arguing. Whoever wins, you are told, gets fed.', trainer('Rival Vendors', { format: 'doubles', cls: 'worker', size: 4, win: [heal(1), moment('Settled the hot dog feud; the feast healed the whole team.', 30)] }))),
    ],
  },
  {
    id: 'lifeguard-test',
    intro: 'A whistle, shrill and panicked: "A swimmer\'s in trouble!" Out past the buoys, an arm goes up and goes under.',
    choices: [
      ch('Rescue first.', fight('Your Pokémon is in the water or in the air before you have finished shouting, and the swimmer is pulled out, coughing and alive. The lifeguard runs up, soaked, grinning: "That was my job! Right. Prove you can do it properly."', trainer('Lifeguard', { cls: 'swimmer', size: 2, win: [$(500), moment('Pulled a swimmer out of the sea.', 50)] })), { requires: [anyType('water', 'flying')] }),
      ch('Shout for the lifeguard.', out('You shout until your voice cracks, and the lifeguard hears and goes in, and comes out with the swimmer over one shoulder. She is too busy to battle anyone today.')),
    ],
  },
  {
    id: 'marathon',
    intro: 'Runners line up at a chalk line with their Pokémon, stretching. A banner over the finish says the prize: a Choice Scarf. It is a very long way to the finish.',
    choices: [
      ch('Run.', out('You find your rhythm and keep it, mile after mile, your team running beside you, and you cross the line with your lungs on fire. They hang the Choice Scarf round your lead\'s neck.', item('choice-scarf'), bondUp(1, 'party')), { prompt: { id: 'hurdle-rhythm', needs: 'good' }, fail: out('You lose your rhythm halfway and finish somewhere in the middle, gasping. No scarf. Your team does not care at all: they had a wonderful time.', bondUp(1, 'party')) }),
    ],
  },
  {
    id: 'mentors-examination',
    intro: '**A veteran** on a folding chair, an Expert Belt laid across her knees: "No held items. No bag. Just you and them. Pass, and take this."',
    choices: [
      ch('Accept.', fight('Hold items come off. Bag goes on the ground. She stands.', trainer('Examiner', { cls: 'veteran', size: 3, lv: 1, rule: { noItems: true }, win: [item('expert-belt'), moment('Passed the veteran\'s examination with no items.', 45)] }))),
    ],
  },
  {
    id: 'moot-court-showdown',
    intro: '**A law student** in a gown two sizes too big: "Out-argue me, and then we enforce the verdict in battle. Every point you win, my lead feels it."',
    choices: [
      ch('Argue.', out('She clears her throat and asks her first question.', room('moot-court-1'))),
    ],
  },
  ...mootCourt(),
  {
    id: 'pokeathlon',
    intro: 'A track, hurdles, a crowd in the stands, and a board with the prizes: first place takes a Power Herb; everyone who finishes gets a Potion.',
    choices: [
      ch('Enter.', out('You and your team clear every hurdle on the beat and cross the line first. The Power Herb is yours.', item('power-herb')), { prompt: { id: 'hurdle-rhythm', needs: 'good' }, fail: out('You clip a hurdle, and then another, and finish in the pack. You still get a Potion, and a pat on the back.', item('potion')) }),
    ],
  },
  {
    id: 'quiz-master',
    intro: '**The Quiz Master**, in a sequined jacket, with a buzzer: "Three questions about Pokémon! Get all three right and a TM is yours!"',
    choices: [
      ch('Answer.', out('One, two, three. He hits the buzzer three times, delighted, and hands you a TM.', any(...TM)), { check: 'intelligence', fail: out('You get one wrong. "So close!" He gives you a sticker instead, which is something.') }),
    ],
  },
  {
    id: 'relay-battle',
    intro: 'Three trainers stand along the road with batons, one every hundred paces. Between each, a bench and a water bottle: a breath, no more.',
    choices: [
      ch('Run the relay.', fight('The first trainer hands you the baton and takes you on. Win, catch your breath, and run on to the next.', trainer('Relay Runner', { cls: 'black-belt', size: 2, chain: 3, chainHeal: 0.25, win: [$(700)] }))),
    ],
  },
  {
    id: 'rookie-hazing',
    intro: 'Youngsters, five of them, closing in a circle with their caps on backwards. **"Welcome to the road, rookie!"** The last one, at the back, is clutching a Rattata and trying very hard to look tough.',
    choices: [
      ch('Battle them all.', fight('The first three come at you one after another.', trainer('Youngster', { cls: 'youngster', size: 2, chain: 3, win: [room('rookie-hazing-joey')] }))),
      ch('Ask the last one\'s name.', fight('"J-Joey," he says, and goes bright red, and then the others shove him to the back and come at you anyway, three in a row.', trainer('Youngster', { cls: 'youngster', size: 2, chain: 3, win: [room('rookie-hazing-joey')] }))),
    ],
  },
  rm('rookie-hazing-joey', 'Joey', 'Challenges', 'Two left: a big kid, and then Joey, who has stopped trying to look tough and is just holding his Rattata. "It\'s in the top percentage of Rattata," he tells you seriously. "I checked."', [
    ch('Battle them.', fight('The big kid, and then Joey, and his top-percentage Rattata.', trainer('Youngster Joey', { cls: 'youngster', size: 1, chain: 2, team: ['rattata'], lv: 2, win: [$(400), moment('Beat Joey and his top-percentage Rattata.', 40)] }))),
  ]),
  {
    id: 'speed-dating-trainers',
    intro: 'A bell rings. Three tables, three trainers, a sign: "Three minutes per table." Somebody pours you a glass of water.',
    choices: [
      ch('Sit down.', fight('Ding. The first one leans across the table. One Pokémon each, and the clock is running.', trainer('Table Trainer', { cls: 'ace-trainer', size: 1, chain: 3, win: [$(450)] }))),
    ],
  },
  {
    id: 'speed-trial',
    intro: '**A runner** with a stopwatch and a Quick Claw on a string round her neck: "Beat my time! It\'s yours if you do."',
    choices: [
      ch('Race.', out('You go on her whistle and you go fast, and you beat her by a hair. She takes the Quick Claw off and gives it to you, laughing.', item('quick-claw')), { prompt: { id: 'dodge-tap', needs: 'good' }, fail: out('You go fast, and she goes faster. "Next time!" She is not even out of breath.') }),
    ],
  },
  {
    id: 'strength-trial',
    intro: '**A hiker**, sitting on a boulder halfway up a hill: "Push it up the hill. All the way to the top." He pats the boulder. "Nobody\'s done it this year."',
    choices: [
      ch('Push (a Fighting- or Rock-type).', out('Your Pokémon sets its shoulder to the boulder and pushes, and pushes, and it rolls, and you push too, and it goes over the top. The hiker gives you his own Black Belt.', item('black-belt')), { requires: [anyType('fighting', 'rock')], prompt: { id: 'pull-hold', needs: 'good' }, fail: out('It goes halfway, wobbles, and rolls all the way back down. The hiker sighs: "Nobody, this year."') }),
      ch('Leave it.', leave('"Nobody, this year," the hiker says again, to the boulder.')),
    ],
  },
  {
    id: 'time-trial-gate',
    intro: 'A gate across the road, shut, with a quiz board bolted to it and a guard beside it. "Fifteen seconds. Answer it, and through you go."',
    choices: [
      ch('Take the quiz.', out('You answer with two seconds to spare. The gate swings open.'), { prompt: { id: 'gauge-hold', needs: 'good' }, fail: fight('Time\'s up. The guard sighs and picks up his Poké Ball. "Rules are rules. Battle me, and I\'ll open it anyway."', trainer('Gate Guard', { cls: 'ace-trainer', size: 2 })) }),
    ],
  },
  {
    id: 'trainers-test',
    intro: '**A trainer** with one Pokémon at her side: "One Pokémon. Just one. Win, and I\'ll teach it something."',
    choices: [
      ch('Battle with one.', fight('The Pokémon you chose steps forward alone.', trainer('Teacher', { cls: 'psychic', size: 1, lv: 1, rule: { noSwitch: true }, win: [learn, bondUp(1, 'picked')] }), { kind: 'leadPicked' }), pick),
    ],
  },
  {
    id: 'triple-battle',
    intro: 'Three kids at once, shoving each other to be in front: "All of us!" "At the same time!" "That\'s the rules!"',
    choices: [
      ch('Battle.', fight('Three of them, three of their Pokémon, all at once.', trainer('Three Kids', { format: 'triples', cls: 'youngster', size: 3, win: [$(500)] }))),
    ],
  },
  {
    id: 'twin-trainers',
    intro: '**Amy and Liv**, in identical everything: "We fight as one!" They say it at exactly the same time, and look pleased about it.',
    choices: [
      ch('Battle.', fight('They step out in perfect step.', trainer('Amy & Liv', { format: 'doubles', cls: 'ace-trainer', size: 2, win: [$(600)] }))),
    ],
  },
  {
    id: 'type-specialist',
    intro: 'A trainer whose whole team, and whose whole outfit, is one type. They have clearly given their life to it.',
    choices: [
      ch('Battle.', fight('One type. Every one of them.', trainer('Type Specialist', { cls: 'ace-trainer', size: 3, lv: 1, win: [flag('type-specialist-hired'), moment('Beat a type specialist; they went to work at the next Gym.', 35)] }))),
    ],
  },
  {
    id: 'underdog-union',
    intro: 'Three trainers with the scruffiest Pokémon you have ever seen. **"Each of us carries a rare held item!"** One of them holds up a Wide Lens. "This one\'s yours if you win."',
    choices: [
      ch('Battle them.', fight('They look weak. They are not as weak as they look.', trainer('Underdog', { cls: 'youngster', size: 2, chain: 3, win: [item('wide-lens')] }))),
    ],
  },
  {
    id: 'winstrate-family',
    intro: 'A whole family lines up on their front lawn, from a little boy to a grandmother: "Beat us all, back to back! You\'re our guest, so we\'ll look after your team in between."',
    choices: [
      ch('Take them on.', fight('The first three, one after another. Between each, the grandmother bustles out with a tray, and your team is fully rested.', trainer('Winstrate', { cls: 'ace-trainer', size: 2, chain: 3, chainHeal: 1, win: [heal(1), room('winstrate-vicky')] }))),
    ],
  },
  rm('winstrate-vicky', 'Vicky Winstrate', 'Challenges', 'The grandmother takes off her apron and hands her tray to her grandson. "My turn, dear." Your team is rested.', [
    ch('Battle.', fight('She is the strongest of them all.', trainer('Vicky Winstrate', { cls: 'veteran', size: 3, lv: 2, win: [$(800), item('macho-brace'), moment('Beat the whole Winstrate family, back to back.', 50)] }))),
  ]),
];

function mootCourt(): Json[] {
  const point: Json = flag('moot-points');
  const q = (n: number, question: string, right: string, wrong: string, next: string): Json =>
    rm(`moot-court-${n}`, `Moot Court: Question ${n}`, 'Challenges', question, [
      ch(right, out('"...Sustained." She looks at her notes, rattled. Her lead shifts on its feet.', point, room(next))),
      ch(wrong, out('"Overruled!" She looks pleased with herself.', room(next))),
    ]);
  return [
    q(1, '"Question one. A Pokémon is put to sleep, and the trainer switches it out. Is it still asleep when it comes back?"', 'Yes, it stays asleep.', 'No, switching wakes it.', 'moot-court-2'),
    q(2, '"Question two. Does a Ground-type move hit a Pokémon that is holding an Air Balloon?"', 'No, the balloon lifts it clear.', 'Yes, Ground always lands.', 'moot-court-3'),
    q(3, '"Question three. Your Pokémon has a burn. Is its Attack lower?"', 'Yes, a burn halves physical attacks.', 'No, burns only hurt.', 'moot-court-verdict'),
    rm('moot-court-verdict', 'Moot Court: The Verdict', 'Challenges', '"The court will now enforce its verdict." She sends out her lead. Every point you won, it carries with it.', [
      ch('Enforce it.', fight('Her lead comes out steady. You did not win a single point.', trainer('Law Student', { cls: 'ace-trainer', size: 3, lv: 3, win: [$(600)] })), { branches: mootBranches() }),
    ]),
  ];
}

/** Each point won in the moot court: her lead is weaker for the battle (built as a damage edge for you, +10% a point; see Known limits). The points are spent. */
function mootBranches(): Json[] {
  return [3, 2, 1].map((n) => ({
    when: [flagIs('moot-points', n)],
    text: `Her lead comes out looking shaken: you won ${n === 3 ? 'all three points' : n === 2 ? 'two points' : 'one point'}, and it feels every one.`,
    effects: [nextBattle(`Out-argued (${n}): your damage ×${(1 + n / 10).toFixed(1)} next battle`, [{ kind: 'damageMultiplier', value: 1 + n / 10 }]), flag('moot-points', -n)],
  }));
}

// ---------- SF145. SHOPS AND WORKSHOPS ----------
const SF145: Json[] = [
  {
    id: 'berry-smoothie',
    intro: '**A smoothie cart**, painted like a Berry: "Blend three Berries into a drink! Good for the next battle only." The menu lists what each blend does.',
    choices: [
      ch('Three Oran Berries (Defense up).', out('A thick blue drink. Your team\'s Defense is up for the next battle.', lose('oran-berry', 3), nextBattle('Oran smoothie: Defense ×1.2 next battle', [{ kind: 'statMultiplier', stat: 'def', value: 1.2 }])), { requires: [has('oran-berry', 3)] }),
      ch('Three Sitrus Berries (Attack up).', out('A sharp yellow drink. Your team\'s Attack is up for the next battle.', lose('sitrus-berry', 3), nextBattle('Sitrus smoothie: Attack ×1.2 next battle', [{ kind: 'statMultiplier', stat: 'atk', value: 1.2 }])), { requires: [has('sitrus-berry', 3)] }),
      ch('Three Pecha Berries (Speed up).', out('A sweet pink drink. Your team\'s Speed is up for the next battle.', lose('pecha-berry', 3), nextBattle('Pecha smoothie: Speed ×1.2 next battle', [{ kind: 'statMultiplier', stat: 'spe', value: 1.2 }])), { requires: [has('pecha-berry', 3)] }),
      ch('No thanks.', leave()),
    ],
  },
  {
    id: 'capsule-gacha',
    intro: 'A toy machine with a crank and a glass dome full of capsules. The odds are printed on the side: 1 in 2 a tiny perk, 1 in 2 a little toy just for fun.',
    choices: [
      ch('Spin (₽50).', out('Crank, crank, clunk. A capsule rolls out and pops open: a tiny perk.', $(-50), any('oran-berry', 'x-attack', 'x-speed', 'dire-hit', 'potion')), { requires: [money(50)], chance: 0.5, fail: out('Crank, crank, clunk. A capsule rolls out and pops open: a tiny plastic Pokémon. Your lead takes it immediately and will not give it back.', $(-50), bondUp(1, 'lead')) }),
      ch('Walk on.', leave('You give the crank a wistful look and walk on.')),
    ],
  },
  {
    id: 'final-sale-banner',
    intro: 'A shop with a banner: "EVERYTHING ₽1." **The owner**, in a cardboard crown: "First, though, a short skit. Store policy."',
    choices: [
      ch('Watch the skit.', out('It is a play about the region\'s Legendary, performed by the owner, his wife and a very patient Snorlax. It is terrible, and then, near the end, it is suddenly not: the wife speaks one line so quietly the whole shop leans in, and you know it is true. Then the lights come on. "Everything ₽1! One of each!"', flag('sign-region'), room('final-sale-shop'))),
      ch('Leave.', leave('"Philistine!" the owner shouts after you, cheerfully.')),
    ],
  },
  rm('final-sale-shop', 'Everything ₽1', 'Shops and workshops', 'The shelves: a Potion, a Poké Ball, an Antidote, a Repel. Every one ₽1. One of each per customer.', [
    ch('Buy one of everything (₽4).', out('You pay ₽4 and walk out with your arms full. The owner bows.', $(-4), item('potion'), item('poke-ball'), item('antidote'), item('repel')), { requires: [money(4)] }),
    ch('Just the Potion (₽1).', out('One Potion, ₽1. The owner bows anyway.', $(-1), item('potion')), { requires: [money(1)] }),
    ch('Buy nothing.', leave('"Then the skit was free too!" the owner says, delighted, and bows you out.')),
  ]),
  {
    id: 'gift-wrap-station',
    intro: '**A gift-wrap stall** with ribbons in every colour: "Wrap an item for the next person you meet! Someone down the road will get a lovely surprise."',
    choices: [
      ch('Wrap a Potion.', out('She wraps it in blue paper with a white bow. "They\'ll love it."', lose('potion'), flag('gift-sent')), { requires: [has('potion')] }),
      ch('Wrap a Berry.', out('She wraps it in green paper with a red bow. "They\'ll love it."', lose('oran-berry'), flag('gift-sent')), { requires: [has('oran-berry')] }),
      ch('Wrap a Poké Ball.', out('She wraps it in red paper with a gold bow. "They\'ll love it."', lose('poke-ball'), flag('gift-sent')), { requires: [has('poke-ball')] }),
      ch('No.', leave('"Another time!" She goes back to her ribbons.')),
    ],
  },
  {
    id: 'gift-wrap-receiver',
    requires: [flagIs('gift-sent')],
    callback: true,
    intro: '**A stranger** waves you down, holding a box wrapped in silver paper: "A friend sent this ahead. They said you\'d be passing. They said you sent them something first."',
    choices: [
      ch('Open it.', out('Inside, wrapped in tissue: something better than what you gave. A note says only, "Thank you. It was a hard week."', any('leftovers', 'scope-lens', 'wide-lens', 'muscle-band', 'wise-glasses', 'expert-belt', 'quick-claw'), flag('gift-sent', -1), moment('A stranger you sent a gift to sent one back.', 40))),
    ],
  },
  {
    id: 'key-item-workshop-bike',
    intro: '**Tinkerer, Bolt**, under a bicycle with only his boots showing: "Parts cost money. Work\'s free. Bring it here and I\'ll make it go further."',
    choices: [
      ch('Upgrade (₽500).', out('He takes your bike apart, puts it back together, and hands it over a gear better than it was.', $(-500), lose('bicycle'), item('mach-bike')), { requires: [has('bicycle'), money(500)] }),
      ch('Upgrade the Mach Bike (₽500).', out('He swaps half its parts and adds a pop-up wheel. "Further still."', $(-500), lose('mach-bike'), item('acro-bike')), { requires: [has('mach-bike'), money(500)] }),
      ch('Not now.', leave('"Bring it back when it squeaks."')),
    ],
  },
  {
    id: 'key-item-workshop-rod',
    intro: '**Tinkerer, Bolt**, at a bench covered in reels: "Same deal for rods. Parts cost money. Work\'s free."',
    choices: [
      ch('Upgrade (₽500).', out('New reel, new line. A Good Rod.', $(-500), lose('old-rod'), item('good-rod')), { requires: [has('old-rod'), money(500)] }),
      ch('Upgrade the Good Rod (₽500).', out('New hook, new everything. A Super Rod, that can pull the rare ones.', $(-500), lose('good-rod'), item('super-rod')), { requires: [has('good-rod'), money(500)] }),
      ch('Not now.', leave('"The fish will wait."')),
    ],
  },
  {
    id: 'lost-property',
    intro: '**A clerk** behind a counter piled with boxes: "Lost property. Nobody comes back for these. Have a look, if you like. About one box in five has something worth keeping."',
    choices: [
      ch('Look through it.', out('Under a pile of single gloves you find it: something worth keeping, with a paper tag tied on and a date written in careful pencil.', any('nugget', 'pearl', 'stardust', 'big-mushroom', 'heart-scale')), { chance: 0.2, fail: out('Gloves. Umbrellas. A single roller skate. Nothing you can use, but somebody loved every one of these once.') }),
    ],
  },
  {
    id: 'street-tailor',
    intro: '**A tailor** with a mouthful of pins and a tape round her neck: "A new look, and a small perk with it." She holds up three outfits, each with a card pinned on: Sharp Suit, Charisma +1; Trail Gear, Strength +1; Scholar\'s Coat, Intelligence +1. ₽80 each.',
    choices: [
      ch('The Sharp Suit (Charisma +1).', out('You look the part. People listen when you talk.', $(-80), { kind: 'attribute', key: 'charisma', amount: 1 }), { requires: [money(80)] }),
      ch('The Trail Gear (Strength +1).', out('Sturdy boots and a coat that could stop a Tackle.', $(-80), { kind: 'attribute', key: 'strength', amount: 1 }), { requires: [money(80)] }),
      ch('The Scholar\'s Coat (Intelligence +1).', out('Deep pockets, for notes, and a neat cut.', $(-80), { kind: 'attribute', key: 'intelligence', amount: 1 }), { requires: [money(80)] }),
      ch('Keep your clothes.', leave('"Suit yourself." She laughs at her own joke for a long time.')),
    ],
  },
  {
    id: 'rare-candy-cache',
    intro: 'Behind a rock, a jar with a lid. Inside, one Rare Candy, and a note in a child\'s writing: "for whoever needs it."',
    choices: [
      ch('Take it.', out('You take it. You do need it. Everyone does.', item('rare-candy'))),
      ch('Leave it for the next trainer.', out('You put the lid back on and set the jar where the next trainer will find it. Somewhere down the road, someone who needs it more is going to have a very good day.', good(1))),
    ],
  },
];

export const EVENTS: Json[] = friendlyAll([...SF144, ...SF145]);
export const REMOVE: string[] = [];
