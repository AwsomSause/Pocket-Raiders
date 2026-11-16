// Catalog Overhaul, families-c part 4: STORY_FAMILIES_9.md SF72, the 30 Rule Battles. Every rule battle has the
// same frame (Accept / How bad is it for me? / Decline); the rule is in core/battle (eventRule + coRules.ts); the
// prize multiplier is read from the team (ruleRead / rulePrize). A beaten rule trainer comes back once in the next
// region with the rule tightened and the prize raised. Re-read log: docs/status/co-families-c.md.
import { readFileSync } from 'node:fs';
import { ch, ev, fight, flag, flagAgo, flagIs, out, room, roomFrom, type Json } from '../dsl.ts';
import { done, notYet, stamped, tf } from './_families-c-kit.ts';

export const CATEGORY = 'families-c';

const OLD = JSON.parse(readFileSync(new URL('../../../src/data/catalogOverhaul/oldPlacement.json', import.meta.url), 'utf8')) as Record<string, Json>;
const oldOf = (id: string): Json => ((OLD.events as Record<string, Json> | undefined) ?? OLD)[id] ?? {};

const PRIZE = 600;
const PRIZE_AGAIN = 900;
const TYPES = ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];

type Special = 'prompt' | 'tea' | 'wheel';
interface RuleTrainer {
  id: string; name: string; who: string; cls: string;
  opening: string; ruleLine: string; rule: Json; tight: Json; tightLine: string;
  bad: string[]; good: string[]; win: string; loss: string; part: string;
  size?: number; battle?: Json; tightBattle?: Json;
  special?: Special; promptId?: string;
  always2?: boolean; pride?: boolean; earlyKo?: boolean; slowHalf?: boolean; slowLoses?: boolean;
  roster?: 'perry' | 'ryder' | 'marina';
}

const T: RuleTrainer[] = [
  { id: 'backwards-battle', name: 'Rory Backtrack', who: 'Rory', cls: 'youngster', opening: 'A trainer in a back-to-front jacket walks toward you backwards. Rory: "We fight backwards today. Your last Pokémon leads."', ruleLine: 'Both sides lead with their last slot and send in reverse order.', rule: { reversed: true }, tight: { reversed: true, noSwitch: true }, tightLine: 'Backwards, and nobody switches. Not even once.', bad: ['lastWeak'], good: ['lastStrong'], win: 'Forwards next time.', loss: 'See? Backwards works.', part: 'Rory walks off backwards, and doesn\'t trip.' },
  { id: 'beginners-luck', name: 'Rookie Pip-Pip', who: 'Pip-Pip', cls: 'youngster', opening: 'A wide-eyed rookie bounces on her toes. Pip-Pip: "I\'ve never won a thing, so the universe owes me!"', ruleLine: 'Both sides land critical hits twice as often; all damage is 10% lower.', rule: { critMult: 2, damageMult: 0.9 }, tight: { critMult: 3, damageMult: 0.8 }, tightLine: 'Triple crits now. The universe owes me MORE.', bad: ['frail'], good: ['bulky'], win: 'The universe is SO in debt to me.', loss: 'I WON A THING!', part: 'Pip-Pip: "The universe will wait. It\'s very patient."' },
  { id: 'blindfold-bout', name: 'Odile Darkward', who: 'Odile', cls: 'psychic', opening: 'A trainer with a silk band over her eyes. Odile: "Fight blind. You won\'t see my team until each Pokémon moves."', ruleLine: 'Both teams are hidden until each Pokémon acts once.', rule: { hiddenFoe: true, blindBoth: true }, tight: { hiddenFoe: true, blindBoth: true, silent: true }, tightLine: 'Blind and deaf this time. No words, no numbers.', bad: ['small'], good: ['bulky'], win: 'You fought like you could see.', loss: 'Neither of us could.', part: 'Odile: "Then go. Carefully."' },
  { id: 'bodybuilder-beach', name: 'Brick Hale', who: 'Brick', cls: 'black-belt', opening: 'A beach gym, all sand and sweat. Brick: "Everyone here\'s pumped. Both sides start with Attack up!"', ruleLine: 'Every Pokémon gets +1 Attack when it comes in.', rule: { entryStages: { atk: 1 } }, tight: { entryStages: { atk: 2 } }, tightLine: 'Plus two this time. I\'ve been lifting.', bad: ['frail', 'special'], good: ['physical'], win: 'PUMPED.', loss: '...Still pumped.', part: 'Brick flexes at you as you leave. It\'s a goodbye.' },
  { id: 'cursed-hat-trainer', name: 'Mortimer Hatt', who: 'Mortimer', cls: 'hex-maniac', opening: 'A tall hat twitches on a tall man. Mortimer: "It flips every status between our Pokémon. Every turn."', ruleLine: 'At the end of each turn, the two active Pokémon swap status conditions.', rule: { cursedHat: true }, tight: { cursedHat: true, noSwitch: true }, tightLine: 'The hat insists. Nobody switches out of its curse.', bad: ['status'], good: ['noStatus'], win: 'The hat approves.', loss: 'The hat is never wrong.', part: 'The hat sighs. So does Mortimer.' },
  { id: 'dance-off-duel', name: 'DJ Sola', who: 'Sola', cls: 'guitarist', opening: 'Music, loud enough to feel. Sola: "Win the dance-off and you move first!"', ruleLine: 'A dance-off first; the winner\'s side moves first on turn one.', rule: {}, tight: { accuracyMult: 0.9 }, tightLine: 'New track. Faster. And the floor\'s slippery.', bad: ['slow'], good: ['fast'], win: 'You\'ve got moves.', loss: 'Rhythm is a weapon.', part: 'Sola turns the music up as you go.', special: 'prompt', promptId: 'echo-rhythm' },
  { id: 'duel-on-the-train', name: 'Conductor Rhee', who: 'Rhee', cls: 'worker', opening: 'The train lurches. Conductor Rhee: "Tickets, or a duel. Motion blur makes every hit a gamble."', ruleLine: 'All accuracy is 10% lower; all critical-hit chances are 10% higher.', rule: { accuracyMult: 0.9, critBonus: 0.1 }, tight: { accuracyMult: 0.8, critBonus: 0.2 }, tightLine: 'Express line. Twice the blur.', bad: ['frail'], good: ['physical'], win: 'Next stop, your destination.', loss: 'Fare please.', part: 'Rhee punches your ticket anyway.' },
  { id: 'handicap-match', name: 'Twins Sib and Sab', who: 'Sib', cls: 'lass', opening: 'Two identical grins. Sib: "One Pokémon each way, no switching, and I get a friend."', ruleLine: 'Your one Pokémon against two of theirs, no switching. The prize is always doubled.', rule: { noSwitch: true, oneOnOne: true }, tight: { noSwitch: true, oneOnOne: true }, tightLine: 'We brought a cousin. Three on one.', bad: [], good: [], win: 'Two wasn\'t enough.', loss: 'Two\'s company.', part: 'Sab: "Chicken." Sib: "Sab!"', size: 2, tightBattle: { size: 3 }, always2: true },
  { id: 'honor-duel', name: 'Sir Aldric Vane', who: 'Vane', cls: 'ace-trainer', opening: 'A man in old armour bows. Sir Aldric Vane: "An honourable duel. Nobody switches out."', ruleLine: 'No switching, either side. The winner carries Pride: the lead\'s first attack next battle hits 10% harder.', rule: { noSwitch: true }, tight: { noSwitch: true, oneOnOne: true }, tightLine: 'One knight each. When yours falls, it is over.', bad: ['lastWeak'], good: ['bulky'], win: 'Honour is yours.', loss: 'Honour is mine. Today.', part: 'Vane bows, very low. You feel judged.', pride: true },
  { id: 'library-duel-silence', name: 'Librarian Weld', who: 'Weld', cls: 'psychic', opening: 'A finger to the lips. Librarian Weld: "Shh. This duel is silent."', ruleLine: 'No battle text: effectiveness and damage numbers aren\'t shown.', rule: { silent: true }, tight: { silent: true, hiddenFoe: true }, tightLine: '(Weld points at the sign: SILENCE. And DARKNESS.)', bad: ['full'], good: [], win: '(a silent bow)', loss: '(a silent bow, smugger)', part: '(Weld shushes you all the way to the door.)' },
  { id: 'magicians-misdirection', name: 'The Great Vasquez', who: 'Vasquez', cls: 'psychic', opening: 'A cape twirl, a puff of smoke. The Great Vasquez: "Watch my hands! My Pokémon is never what it seems."', ruleLine: 'Every Pokémon looks like some other Pokémon until it moves.', rule: { decoyFoe: '*', blindBoth: true }, tight: { decoyFoe: '*', blindBoth: true, hiddenFoe: true }, tightLine: 'Now you see nothing at all. Ta-da in advance.', bad: ['special'], good: ['bulky'], win: 'You saw through it.', loss: 'Ta-da.', part: 'Vasquez vanishes. You hear him trip behind the curtain.' },
  { id: 'midnight-cafe-duel', name: 'Waiter Benoît', who: 'Benoît', cls: 'worker', opening: 'A cafe open at midnight. Three cups of tea on a tray. Waiter Benoît: "Pick one, and duel me. The tea helps. Probably."', ruleLine: 'You pick a tea: Speed +1, Defense +1, or a random stat +2. He drinks the same.', rule: {}, tight: {}, tightLine: 'A stronger pot tonight. My team has been drinking it all week.', bad: [], good: [], win: 'Another cup?', loss: 'Tea always wins.', part: 'Benoît pours your tea down the sink, sadly.', special: 'tea', tightBattle: { lv: 2 } },
  { id: 'mimic-mayhem', name: 'Mime Ferdy', who: 'Ferdy', cls: 'camper', opening: 'A street mime copies your walk, your face, your wave. Ferdy (mouthing): "Whatever you do, my Pokémon does next."', ruleLine: 'His Pokémon uses your last move each turn, if it can.', rule: { mimic: true }, tight: { mimic: true, noSwitch: true }, tightLine: '(Ferdy mimes a cage. You can\'t switch out of it.)', bad: ['physical'], good: ['status'], win: '(a silent bow)', loss: '(mimes winning)', part: '(Ferdy mimes a sad goodbye. It\'s very good.)' },
  { id: 'night-shift-guards', name: 'Guards Kell and Bree', who: 'Kell', cls: 'worker', opening: 'Torch beams across your face. Guard Kell: "Night shift. Nobody passes without a duel."', ruleLine: 'Both sides\' accuracy is 10% lower, except Dark and Ghost types.', rule: { accuracyMult: 0.9, accuracyExempt: ['dark', 'ghost'] }, tight: { accuracyMult: 0.8, accuracyExempt: ['dark', 'ghost'] }, tightLine: 'New moon. Darker than last time.', bad: ['physical'], good: ['type:dark', 'type:ghost'], win: 'Pass, friend.', loss: 'Back to bed, you.', part: 'Bree: "Go around, then. Long way."', battle: { chain: 2 } },
  { id: 'pacifist-challenge', name: 'Sister Amaya', who: 'Amaya', cls: 'breeder', opening: 'A woman in grey, hands folded. Sister Amaya: "Win without striking. Status moves only. Last eight turns."', ruleLine: 'You win if any of your Pokémon stands after 8 turns, using status moves only. She attacks normally.', rule: { noAttacks: true, surviveTurns: 8 }, tight: { noAttacks: true, surviveTurns: 10 }, tightLine: 'Ten turns now. Peace is longer than you think.', bad: ['noStatus', 'frail'], good: ['status', 'bulky'], win: 'Peace takes strength.', loss: 'Strike next time. It\'s allowed elsewhere.', part: 'Amaya: "Go in peace, then."' },
  { id: 'pinch-hitter', name: 'Coach Dugan', who: 'Dugan', cls: 'veteran', opening: 'A coach in a cap chews a whistle. Coach Dugan: "Bottom of the ninth! Every Pokémon that goes down gets back up once."', ruleLine: 'Every Pokémon, both sides, gets back up once at 25% after fainting.', rule: { pinchHitter: true }, tight: { pinchHitter: true, damageMult: 1.2 }, tightLine: 'Extra innings, and everybody swings harder.', bad: ['small'], good: ['full'], win: 'Extra innings!', loss: 'Walk-off!', part: 'Dugan: "Rain check. Always a rain check."' },
  { id: 'pizza-delivery-duel', name: 'Delivery Kai-Lin', who: 'Kai-Lin', cls: 'biker', opening: 'A courier with a pizza box strapped to her back. Kai-Lin: "Win in 5 turns or the pizza goes cold!"', ruleLine: 'Win within 5 turns. After 5, it\'s her win.', rule: { turnLimit: 5 }, tight: { turnLimit: 4 }, tightLine: 'Four turns. The customer is hungry.', bad: ['slow', 'bulky'], good: ['fast'], win: 'Hot pizza for you!', loss: 'Cold pizza for me.', part: 'Kai-Lin is gone before you finish saying no.', slowLoses: true },
  { id: 'rooftop-rumble', name: 'Roofer Jax', who: 'Jax', cls: 'worker', opening: 'A windy rooftop, gravel and gulls. Roofer Jax: "Knock \'em off fast and the bonus is yours!"', ruleLine: 'A knockout on turn one or two adds 50% to the prize; Flying types are 10% faster.', rule: { earlyKo: 2, typeSpeed: { type: 'flying', mult: 1.1 } }, tight: { earlyKo: 1, typeSpeed: { type: 'flying', mult: 1.2 } }, tightLine: 'Turn one only. And the wind\'s picked up.', bad: ['slow'], good: ['type:flying'], win: 'Nice drop.', loss: 'Wind\'s on my side.', part: 'Jax: "Mind the edge on the way down."', earlyKo: true },
  { id: 'sky-duel', name: 'Bird Keeper Perry', who: 'Perry', cls: 'bird-keeper', opening: 'A floating platform, high over the trees. Perry: "Up here the ground\'s a long way down. Ground moves miss."', ruleLine: 'Ground moves fail, both sides.', rule: { sky: true }, tight: { sky: true, typeSpeed: { type: 'flying', mult: 1.2 } }, tightLine: 'Higher this time. My birds love it up here.', bad: ['moveType:ground'], good: ['type:flying'], win: 'You flew!', loss: 'The wind and me.', part: 'Perry: "The sky\'ll still be here."', roster: 'perry' },
  { id: 'sleepwalker-brawl', name: 'Dreamer Lull', who: 'Lull', cls: 'lass', opening: 'A trainer sleepwalking, and her Pokémon too. Lull (mumbling): "Strike first, or lose the edge..."', ruleLine: 'Every Pokémon starts asleep for one turn; the first to act gains +1 Speed.', rule: { entrySleep: true, firstActBoost: true }, tight: { entrySleep: true, firstActBoost: true, noSwitch: true }, tightLine: '(still asleep) ...nobody... leaves the dream...', bad: ['slow'], good: ['fast'], win: 'Mm... good fight...', loss: 'Zzz... won...', part: '(Lull sleepwalks away, still mumbling.)' },
  { id: 'slippery-slope-duel', name: 'Swimmer Marina', who: 'Marina', cls: 'swimmer', opening: 'A frozen slope, and a swimmer in a wetsuit sliding down it on purpose. Marina: "On ice nobody stays in order!"', ruleLine: 'Turn order is random every turn.', rule: { randomOrder: true }, tight: { randomOrder: true, accuracyMult: 0.9 }, tightLine: 'Fresh ice. Nobody stays on their feet.', bad: ['fast'], good: ['slow'], win: 'You held your footing!', loss: 'Wheee!', part: 'Marina slides off down the hill, laughing.', roster: 'marina' },
  { id: 'sniper-ambush', name: 'The Sharpshooter, Vex', who: 'Vex', cls: 'ace-trainer', opening: 'A glint on a ridge. Vex: "I always aim for the soft spot." A Ranger steps up beside you. Ranger: "Not alone, you don\'t."', ruleLine: 'Vex targets your lowest-HP Pokémon; a Ranger fights beside you.', rule: { sniper: true }, tight: { sniper: true, critBonus: 0.1 }, tightLine: 'New scope. I don\'t miss soft spots now.', bad: ['frail', 'small'], good: ['bulky'], win: 'Your friend\'s good.', loss: 'Soft spot.', part: 'Vex lowers the scope. "Another day."', battle: { ally: 'staraptor' } },
  { id: 'speedrun-trial', name: 'Speedrunner Zip', who: 'Zip', cls: 'camper', opening: 'A kid with a stopwatch, already timing you. Zip: "Beat my three in 10 turns. Slow win pays half."', ruleLine: 'Three knockouts in 10 turns; a slower win pays half.', rule: { turnLimit: 10 }, tight: { turnLimit: 8 }, tightLine: 'Eight turns. I found a skip.', bad: ['slow', 'bulky'], good: ['fast'], win: 'New record.', loss: 'Reset!', part: 'Zip: "You just cost me a personal best."', size: 3, slowHalf: true },
  { id: 'stage-fright-challenge', name: 'Stagehand Mabel', who: 'Mabel', cls: 'reporter', opening: 'A packed crowd, hot lights. Stagehand Mabel: "Everyone\'s nervous. Speed drops at the start!"', ruleLine: 'Every Pokémon gets -1 Speed when it comes in.', rule: { entryStages: { spe: -1 } }, tight: { entryStages: { spe: -2 } }, tightLine: 'Sold-out show tonight. Bigger crowd, bigger nerves.', bad: ['fast'], good: ['slow'], win: 'You shook it off.', loss: 'Stage fright\'s real.', part: 'Mabel: "Next show, then. Break a leg."' },
  { id: 'the-contrarian', name: 'Topsy Contrare', who: 'Topsy', cls: 'picnicker', opening: 'A cap on backwards, a grin upside down. Topsy: "Up is down. Every stat change is inverted."', ruleLine: 'All stat changes are reversed.', rule: { contrary: true }, tight: { contrary: true, noSwitch: true }, tightLine: 'Stay is go! I mean, nobody switches.', bad: ['status'], good: ['noStatus'], win: 'Down is up! I mean... you won.', loss: 'Up is up!', part: 'Topsy: "Hello! I mean, goodbye!"' },
  { id: 'trainer-on-a-bike', name: 'Biker Ryder', who: 'Ryder', cls: 'biker', opening: 'A bike skids to a stop, spraying gravel. Ryder: "Race me to the signpost. Win and you move first."', ruleLine: 'A race first; the winner moves first on turn one.', rule: {}, tight: { accuracyMult: 0.9 }, tightLine: 'Longer course. Gravel all the way.', bad: ['slow'], good: ['fast'], win: 'Fast. Respect.', loss: 'Eat my dust.', part: 'Ryder pops a wheelie and is gone.', special: 'prompt', promptId: 'dodge-tap', roster: 'ryder' },
  { id: 'type-roulette-duel', name: 'Wheel-Spinner Gus', who: 'Gus', cls: 'guitarist', opening: 'A painted wheel of types, taller than you. Gus: "Spin it. Whatever it lands on is our theme."', ruleLine: 'The wheel picks a type; both sides\' moves of that type gain 30%.', rule: {}, tight: {}, tightLine: 'I oiled the wheel. It spins harder now: plus fifty.', bad: [], good: [], win: 'The wheel likes you.', loss: 'The wheel likes me.', part: 'Gus spins the wheel anyway, just to watch it.', special: 'wheel' },
  { id: 'umbrella-squad', name: 'The Yellow Squad', who: 'Puddle', cls: 'swimmer', opening: 'Yellow raincoats in a row. Squad leader, Puddle: "No sun, no wind, just rain. Care to dance?"', ruleLine: 'Rain for the whole battle; three trainers in a row.', rule: {}, tight: { typeBoost: { type: 'water', pct: 20 } }, tightLine: 'We trained in the storm. Water hits harder now, both sides.', bad: ['type:fire'], good: ['type:water'], win: 'We\'ll dry off.', loss: 'Singing in the rain!', part: 'The Squad marches off, splashing in every puddle.', battle: { weather: 'rain', chain: 3 } },
  { id: 'underground-duel', name: 'Tunneller Hask', who: 'Hask', cls: 'hiker', opening: 'A dusty tunnel, a lamp swinging. Tunneller Hask: "Down here the sand never settles."', ruleLine: 'Sandstorm for the whole battle.', rule: {}, tight: { accuracyMult: 0.9 }, tightLine: 'Deeper tunnel. Thicker sand. You won\'t see a thing.', bad: ['frail'], good: ['type:rock', 'type:steel'], win: 'Dig deeper next time.', loss: 'Sand in everything.', part: 'Hask: "Mind your head on the way out."', battle: { weather: 'sand' } },
  { id: 'weather-rival', name: 'Forecaster Brio', who: 'Brio', cls: 'reporter', opening: 'A barometer on his hat, spinning. Forecaster Brio: "The sky changes every turn. Adapt or get soaked!"', ruleLine: 'A new random weather every turn.', rule: { weatherRandom: ['rain', 'sun', 'sand', 'snow'] }, tight: { weatherRandom: ['rain', 'sun', 'sand', 'snow', 'hail'] }, tightLine: 'Hail\'s in the forecast now. Five skies, every turn a new one.', bad: [], good: [], win: 'Clear skies ahead.', loss: 'Told you.', part: 'Brio: "Seven-day outlook says: you\'ll regret this."', tightBattle: { lv: 2 } },
];

// ---------- the frame ----------
const won = (t: RuleTrainer): string => `rule-${t.id}-won`;
const mult = (t: RuleTrainer): string => `rule-${t.id}-mult`;
const say = (t: RuleTrainer, line: string): string => (line.startsWith('(') ? line : `${t.who}: "${line}"`);
const sceneOf = (t: RuleTrainer): Json => (oldOf(t.id).scene as Json | undefined) ?? { cast: [], effect: 'none' };
const look = (t: RuleTrainer): Json => { const s = sceneOf(t); return { cast: (s.cast as string[]) ?? [], ...(s.pokemon ? { pokemon: s.pokemon } : {}), ...(s.tint ? { tint: s.tint } : {}), effect: (s.effect as string) ?? 'none' }; };
const sfx = (again: boolean): string => (again ? '-again' : '');

/** The prize the battle pays: the team read (or ×2 always for the twins), then paid out. */
function prize(t: RuleTrainer, again: boolean, half = false): Json[] {
  const amount = Math.round((again ? PRIZE_AGAIN : PRIZE) * (t.always2 ? 2 : 1) * (half ? 0.5 : 1));
  return [
    ...(t.always2 ? [] : [{ kind: 'ruleRead', key: mult(t), bad: t.bad, good: t.good, prize: amount, store: true }]),
    { kind: 'rulePrize', key: mult(t), amount, earlyKo: !!t.earlyKo },
  ];
}
const PRIDE: Json = { kind: 'tempEffect', label: 'Pride', battles: 1, effects: [{ kind: 'firstAttackDamage', first: 1.1, later: 1 }] };

/** The rule battle itself. `rule` overrides the trainer's rule (tea, wheel, first mover). */
function battle(t: RuleTrainer, again: boolean, rule: Json, friendly = false): Json {
  const winFx: Json[] = [...prize(t, again), stamped(won(t)), flag('rule-declined', -99), ...(t.pride ? [PRIDE] : []), room(`${t.id}-won`)];
  const loseFx: Json[] = [flag('rule-declined', -99), room(`${t.id}-lost`)];
  const extra: Json = { ...(t.battle ?? {}), ...(again ? t.tightBattle ?? {} : {}) };
  const size = (extra.size as number | undefined) ?? t.size ?? 3;
  const lv = (extra.lv as number | undefined) ?? (again ? 1 : 0);
  const b = tf(t.name, { cls: t.cls, size, lv, win: winFx }, loseFx);
  const { size: _s, lv: _l, ...rest } = extra;
  void _s; void _l;
  if (t.slowHalf) Object.assign(b, { slowWin: [...prize(t, again, true), stamped(won(t)), flag('rule-declined', -99), room(`${t.id}-won`)] });
  if (t.slowLoses) Object.assign(b, { slowWin: loseFx });
  return friendly ? { ...b, ...rest } : { ...b, ...rest, rule };
}

/** "Accept.": the battle, under the rule (the dance and the race come first; the tea and the wheel open a room). */
function accept(t: RuleTrainer, again: boolean, extraFx: Json[] = [], label = 'Accept.'): Json {
  const rule = again ? t.tight : t.rule;
  const pre: Json[] = [...extraFx, ...(again ? [done(`${t.id}-again-done`)] : [])];
  const go = `${t.who} grins. The rule holds for both of you.`;
  if (t.special === 'prompt') {
    return ch(label, fight(`You win the ${t.id === 'dance-off-duel' ? 'dance-off' : 'race'}! Your side moves first.`, battle(t, again, { ...rule, firstMover: 'player' }), ...pre), {
      prompt: { id: t.promptId!, needs: again ? 'perfect' : 'good' },
      fail: fight(`${t.who} wins it, just. ${t.who}'s side moves first.`, battle(t, again, { ...rule, firstMover: 'enemy' }), ...pre),
    });
  }
  if (t.special === 'tea') return ch(label, out('Benoît sets the tray in front of you.', ...pre, room(`${t.id}${sfx(again)}-tea`)));
  if (t.special === 'wheel') return ch(label, out('You grab the wheel and spin. It clicks, and clicks, and slows...', ...pre, roomFrom(...TYPES.map((ty) => `${t.id}${sfx(again)}-wheel-${ty}`))));
  return ch(label, fight(go, battle(t, again, rule), ...pre));
}
function decline(t: RuleTrainer, again: boolean): Json {
  return ch('Decline.', out(t.part, flag('rule-declined'), ...(again ? [done(`${t.id}-again-done`)] : [])));
}
function howBad(t: RuleTrainer, again: boolean): Json {
  const amount = (again ? PRIZE_AGAIN : PRIZE) * (t.always2 ? 2 : 1);
  const read: Json[] = t.always2 ? [] : [{ kind: 'ruleRead', key: mult(t), bad: t.bad, good: t.good, prize: amount }];
  const text = t.always2 ? 'Sib: "Two on one. Double prize, always. We\'re not monsters."' : 'You look over your team against the rule.';
  return ch('How bad is it for me?', out(text, ...read, room(`${t.id}${sfx(again)}-ask`)));
}

/** "Scared of rules? I'll make it a friendly one": after three declines in a row, the rule can be dropped at ×1. */
function friendlyOffer(t: RuleTrainer, again: boolean): Json {
  return {
    id: 'declined', when: [flagIs('rule-declined', 3)], notice: `${t.who}: "Scared of rules? I'll make it a friendly one."`,
    addChoices: [ch('A friendly one, then.', fight(`${t.who} shrugs. No rule this time.`, battle(t, again, {}, true), flag(mult(t), -99), ...(again ? [done(`${t.id}-again-done`)] : [])))],
  };
}
/** A Road Roster trainer's rule battle counts as their first meeting when it is due (people thread's flags). */
function rosterMeet(t: RuleTrainer, again: boolean): Json[] {
  if (!t.roster) return [];
  const key = `roster-${t.roster}-m1`;
  return [{ id: 'roster', when: [flagIs(key, 0, 0)], hide: [0], addChoices: [accept(t, again, [{ kind: 'flag', key, amount: 1, stamp: 'region' }])] }];
}

function events(t: RuleTrainer): Json[] {
  const L = look(t);
  const group = (oldOf(t.id).group as string | undefined) ?? 'Trainer Challenges';
  const base = ev(t.id, t.name, group, L, `${t.opening} The rule: ${t.ruleLine}`, [accept(t, false), howBad(t, false), decline(t, false)]);
  Object.assign(base, { remembers: [...rosterMeet(t, false), friendlyOffer(t, false)] });
  const rematch = ev(`${t.id}-again`, `${t.name}, Again`, 'Trainer Challenges', { ...L, callback: true, requires: [flagAgo(won(t), 1), notYet(`${t.id}-again-done`)] },
    `${t.who} is waiting for you, a region later. ${t.who}: "Last time you got lucky." ${say(t, t.tightLine)} The rule: ${t.ruleLine} Tightened. The prize is raised.`,
    [accept(t, true), howBad(t, true), decline(t, true)]);
  Object.assign(rematch, { remembers: [friendlyOffer(t, true)] });
  const rooms: Json[] = [
    ev(`${t.id}-ask`, t.name, 'Trainer Challenges', { room: true, ...L }, `The rule: ${t.ruleLine}`, [accept(t, false), decline(t, false)]),
    ev(`${t.id}-again-ask`, t.name, 'Trainer Challenges', { room: true, ...L }, `The rule, tightened: ${t.ruleLine}`, [accept(t, true), decline(t, true)]),
    ev(`${t.id}-won`, t.name, 'Trainer Challenges', { room: true, ...L }, say(t, t.win), [ch('Walk on.', out('You walk on, prize in hand.'))]),
    ev(`${t.id}-lost`, t.name, 'Trainer Challenges', { room: true, ...L }, say(t, t.loss), [ch('Walk on.', out('Your team picks itself up. Rules are rules.'))]),
  ];
  for (const again of [false, true]) {
    if (t.special === 'tea') {
      const tea = (label: string, stages: Json, text: string): Json => ch(label, fight(text, battle(t, again, { stages })));
      const randoms = ['atk', 'def', 'spa', 'spd', 'spe'] as const;
      rooms.push(ev(`${t.id}${sfx(again)}-tea`, 'Three Teas', 'Trainer Challenges', { room: true, ...L }, 'Three cups. One smells of mint, one of smoke, one of something you can\'t name.', [
        tea('The mint (Speed +1).', { spe: 1 }, 'Light and quick. Benoît drinks the same.'),
        tea('The smoke (Defense +1).', { def: 1 }, 'Heavy and warm. Benoît drinks the same.'),
        ch('The one you can\'t name (a random stat +2).', out('It tastes like nothing, then like everything.', roomFrom(...randoms.map((s) => `${t.id}${sfx(again)}-tea-${s}`)))),
      ]));
      for (const s of randoms) rooms.push(ev(`${t.id}${sfx(again)}-tea-${s}`, 'Three Teas', 'Trainer Challenges', { room: true, ...L }, `Your whole team feels it at once: ${({ atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed' })[s]} +2. Benoît drinks the same.`, [tea('Duel.', { [s]: 2 }, '"Shall we?"')]));
    }
    if (t.special === 'wheel') {
      for (const ty of TYPES) rooms.push(ev(`${t.id}${sfx(again)}-wheel-${ty}`, 'The Wheel', 'Trainer Challenges', { room: true, ...L }, `The wheel stops on ${ty[0]!.toUpperCase()}${ty.slice(1)}. Gus: "${ty[0]!.toUpperCase()}${ty.slice(1)} it is!"`, [
        ch('Duel.', fight(`Both sides' ${ty[0]!.toUpperCase()}${ty.slice(1)} moves hit ${again ? '50' : '30'}% harder.`, battle(t, again, { typeBoost: { type: ty, pct: again ? 50 : 30 } }))),
      ]));
    }
  }
  return [base, rematch, ...rooms];
}

export const EVENTS: Json[] = T.flatMap(events);
export const REMOVE: string[] = [];
