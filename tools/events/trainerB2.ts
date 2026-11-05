// Run events B batch 2 (R55, R68, R80, R86, R87, R101, R103): trainer fights with a temporary next-fight modifier
// (`tempEffect`, run events J) or a follow-up ladder. Built into src/data/events/trainer-b2.json by
// `npm run data:rb2-events` (tools/build-rb2-events.ts).
import { $, any, ch, ev, fight, flag, flagIs, good, heal, HELD, leave, lv, out, rp, SNACKS, trainer, type Json } from './dsl.ts';

const G = 'Trainer Challenges';
const temp = (label: string, effects: Json[], battles = 1): Json => ({ kind: 'tempEffect', label, effects, battles, until: 'battle' });
const duel = (name: string, o: Parameters<typeof trainer>[1]): Json => trainer(name, o);

export const RB2_EVENTS: Json[] = [
  // R55 Trainer on a Bike: win the race, strike first
  ev('trainer-on-a-bike', 'Trainer on a Bike', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.biker'], tint: '#232a2a' },
    'A trainer revs a bike beside you. "Race me to that signpost. Win and I give you the first move in our battle."', [
      ch('Race!', fight('You cross the line first. "Fine, you move first."', duel('Bike Racer', { cls: 'biker', size: 3, win: [$(500), rp(3)] }), temp('Won the race: you strike first', [{ kind: 'firstStrike' }])), { check: 'speed', fail: fight('They are across the line before you blink. "Now we fight."', duel('Bike Racer', { cls: 'biker', size: 3, win: [$(400), rp(2)] })) }),
      ch('Skip the race, just battle', fight('"No warm-up? Fine."', duel('Bike Racer', { cls: 'biker', size: 3, win: [$(400), rp(2)] }))),
      ch('Wave and walk on', leave()),
    ]),
  // R68 Held-Item Gauntlet
  ev('held-item-gauntlet', 'Held-Item Gauntlet', G, { stop: 'event', rarity: 'uncommon', minStage: 2, cast: ['trainer.worker_m'], tint: '#2a2518' },
    'Every trainer on this road carries a berry or a trinket for their Pokémon. "Beat us and keep what we were holding."', [
      ch('Take the gauntlet', fight('The first trainer grins and sends out a Pokémon with a berry in its paw.', duel('Gauntlet Trainers', { cls: 'ace-trainer', size: 2, chain: 2, win: [any(...HELD), any(...SNACKS), rp(3)] }))),
      ch('Skip it', leave()),
    ]),
  // R80 Ranked Ladder (three rungs; each win raises the next event's tier)
  ev('ranked-ladder-1', 'Ranked Ladder: Bronze Match', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.black_belt_m'], tint: '#2a2218' },
    'A bulletin board lists a ranked ladder. "Climb it. Every win unlocks a tougher opponent further down the road."', [
      ch('Take a Bronze match', fight('The Bronze ranked trainer salutes.', duel('Bronze Ranked Trainer', { cls: 'ace-trainer', size: 2, win: [$(300), flag('ladder', 1), rp(2)] }))),
      ch('Ignore the board', leave()),
    ]),
  ev('ranked-ladder-2', 'Ranked Ladder: Silver Match', G, { stop: 'event', rarity: 'rare', minStage: 2, callback: true, requires: [flagIs('ladder', 1, 1)], cast: ['trainer.black_belt_m'], tint: '#232830' },
    'The board has a new entry with your name on it. "Silver tier. Win again and you are close to the top."', [
      ch('Take a Silver match', fight('A Silver-ranked trainer steps up.', duel('Silver Ranked Trainer', { cls: 'ace-trainer', size: 3, lv: 1, win: [$(700), flag('ladder', 1), lv(1, 'party'), rp(3)] }))),
      ch('Not yet', leave()),
    ]),
  ev('ranked-ladder-3', 'Ranked Ladder: Gold Match', G, { stop: 'event', rarity: 'epic', minStage: 3, callback: true, requires: [flagIs('ladder', 2, 2)], cast: ['trainer.black_belt_m'], tint: '#2e2a14' },
    'Top of the ladder. The crowd hushes. "Gold tier: the best of the best."', [
      ch('Take the Gold match', fight('The Gold-ranked champion adjusts their cap.', duel('Gold Ranked Champion', { cls: 'veteran', size: 4, lv: 2, win: [$(1800), any(...HELD), flag('ladder', 1), good(1), rp(6)] }))),
      ch('Stay at Silver', leave()),
    ]),
  // R86 Slippery Slope Duel (hail + Trick Room approximates the shuffling speed order)
  ev('slippery-slope-duel', 'Slippery Slope Duel', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.snow_worker_m'], tint: '#1c2a34' },
    'A frozen slope with a skater waiting at the top. "On ice nobody stays in order. Care for a duel?"', [
      ch('Duel on the ice', fight('You slide into position as hail starts to fall.', duel('Ice Skater', { cls: 'snow-worker', size: 3, types: ['ice'], win: [$(550), rp(3)] }), temp('The ice scrambles the speed order', [{ kind: 'battleStart', weather: 'hail', field: 'trickRoom', turns: 5 }]))),
      ch('Take the long way around', leave()),
    ]),
  // R87 Duel on the Train (motion blur: evasion up)
  ev('duel-on-the-train', 'Duel on the Train', G, { stop: 'event', rarity: 'rare', minStage: 2, cast: ['trainer.worker_m'], tint: '#222630', effect: 'rattle' },
    'The train lurches. A conductor blocks the aisle. "Tickets, or a duel. Motion blur makes every hit a gamble."', [
      ch('Duel in the carriage', fight('Everything blurs as the train races on.', duel('Train Conductor', { cls: 'worker', size: 3, win: [$(650), rp(3)] }), temp('Motion blur: your Pokémon are harder to hit', [{ kind: 'evasionMultiplier', value: 1.25 }]))),
      ch('Find your seat', leave()),
    ]),
  // R101 Midnight Cafe Duel (tea: pick a boost)
  ev('midnight-cafe-duel', 'Midnight Cafe Duel', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.aroma_lady'], tint: '#1c1a28' },
    'A cafe stays open past midnight. The waiter sets down three teas. "Pick one, and duel me. The tea helps. Probably."', [
      ch('Sharp green tea (more crits)', fight('The waiter rolls up their sleeves.', duel('Cafe Waiter', { cls: 'aroma-lady', size: 3, win: [$(500), heal(0.25), rp(3)] }), temp('Sharp tea: sharper hits', [{ kind: 'critChanceBonus', value: 0.15 }]))),
      ch('Calm chamomile (more evasive)', fight('The waiter rolls up their sleeves.', duel('Cafe Waiter', { cls: 'aroma-lady', size: 3, win: [$(500), heal(0.25), rp(3)] }), temp('Calm tea: steadier on their feet', [{ kind: 'evasionMultiplier', value: 1.2 }]))),
      ch('Bright citrus (surer aim)', fight('The waiter rolls up their sleeves.', duel('Cafe Waiter', { cls: 'aroma-lady', size: 3, win: [$(500), heal(0.25), rp(3)] }), temp('Citrus tea: moves land more often', [{ kind: 'accuracyMultiplier', value: 1.2 }]))),
      ch('Just pay for the tea', out('A lovely cup of tea, and nobody gets hurt.', heal(0.1), { kind: 'money', amount: -40 })),
    ]),
  // R103 Lifeguard Test
  ev('lifeguard-test', 'Lifeguard Test', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.fisherman'], tint: '#16303a' },
    'A whistle blows on the beach. "A swimmer is in trouble! Rescue first, then prove you can hold your own."', [
      ch('Swim out and rescue them (Speed)', fight('You haul them back. The head lifeguard nods and sends out a Water-type.', duel('Head Lifeguard', { cls: 'swimmer', size: 3, types: ['water'], win: [$(650), good(1), rp(3)] }), good(1)), { check: 'speed', fail: fight('The current wins this round. The lifeguard does the rescue and challenges you for the effort.', duel('Head Lifeguard', { cls: 'swimmer', size: 3, types: ['water'], win: [$(300), rp(2)] })) }),
      ch('Stay on the sand', leave()),
    ]),
];
