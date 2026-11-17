// Greenneedle gn.new.38, The Long Table (doc GREENNEEDLE_PLACED_2.md lines 634–667). The night before the last battle.
// A place for every event that ended well (a name card), an empty chair for each that did not, and a pile of stones at the far end.
// Seats are worked out once, when the player walks the table; the player sits by any of them; the two neighbours speak.
// Reward: +1% to every stat of the whole party for the last battle for each filled place, at most 10%.
import type { Content } from '../contentSchema';
import type { RunState } from '../state';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, v: number): void => {
  run.story.flags[`ev:${k}`] = v;
};
const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
export const LT_CAP = 10;
/** How many seats one page of the table shows (three, and a fourth choice to walk further). */
export const LT_PAGE = 3;

interface Guest {
  id: string;
  name: string;
  dish: string;
  /** Any one of these flags set: it ended well, and there is a place with a name card. */
  good: string[];
  /** Any one of these flags set (and none of `good`): it did not, and the chair is empty. */
  bad?: string[];
  /** What the neighbour says when the place is filled. */
  said: string;
  /** What is seen at the empty chair. */
  empty?: string;
}

/** In the order down the table. A flag no event sets yet simply never seats anyone. */
export const GUESTS: Guest[] = [
  { id: 'market', name: 'the market stallholders', dish: 'a loaf', good: ['sg-civ-market'], bad: ['siege-missing-market'],
    said: '"You came back for the stalls. Half the street has a roof now because of you. I brought bread. It\'s the first thing I\'ve baked in a year."',
    empty: 'A stallholder\'s apron hangs over the back of the chair. No one comes to take it down.' },
  { id: 'homes', name: 'the families from the housing blocks', dish: 'a pot of stew', good: ['sg-civ-homes'], bad: ['siege-missing-homes'],
    said: '"The little one wouldn\'t let go of your sleeve all through the siege. Look at her now. She\'s eaten three bowls. Sit, sit."',
    empty: 'A child\'s chair, with a cushion, and a stew bowl set for someone who will not be sat there.' },
  { id: 'hall', name: 'the people of the town hall', dish: 'a seed cake', good: ['sg-civ-hall'], bad: ['siege-missing-hall'],
    said: '"We kept the lamps lit all night, and you held the door. That has to be paid for in cake. Do not argue with the clerk."',
    empty: 'The mayor\'s chain lies folded on a plate, beside a cup nobody has touched.' },
  { id: 'school', name: 'the teacher from the school', dish: 'a tin of biscuits', good: ['sg-school'], bad: ['siege-missing-school'],
    said: '"Thirty-one children, and I counted them out twice. They made the biscuits. Some are burnt. Eat the burnt ones first, they\'ll be watching."',
    empty: 'A register lies open on the plate, with thirty-one names, and no ticks.' },
  { id: 'ranch', name: 'Ysabeau, the rancher', dish: 'a berry from the ranch', good: ['ranch-dug', 'ranch-moved'], bad: ['bibarel-dam-broken'],
    said: '"Twelve. All twelve. I named a calf after your digger. She doesn\'t know. She\'s a calf, but I do, and I wanted you to hear it."',
    empty: 'A thin Bidoof is sitting under it, very quietly, looking at the empty plate.' },
  { id: 'well', name: 'Old Tabor', dish: 'a pebble from a well', good: ['well-lifted'],
    said: '"We use the well. I say sorry to it. Daft. It answers with a pebble, every morning, and I put it in my pocket like a fool."' },
  { id: 'kaiju', name: 'Ned and the harbour crews', dish: 'a net of shellfish', good: ['kaiju-freed'], bad: ['kaiju-lost'],
    said: '"Nobody on the dock will say it, so I will. You didn\'t leave it in the net. It went back out. We watch the tide every day."',
    empty: 'A boat hook is propped against the chair. The water in the cup is salt.' },
  { id: 'squad', name: 'The Squirtle Squad', dish: 'a bowl of cold spring water', good: ['kanto-squad-joined'],
    said: '"Sunglasses stay ON at dinner. House rule. But I\'m allowed to cry behind them, and I am. Pass the water. Thank you. For everything."' },
  { id: 'mankey', name: 'The Mankeys of Route 25', dish: 'a bunch of grapes', good: ['mankey-fifth-joined', 'mankey-waited'], bad: ['mankey-hit-fifth'],
    said: '"They keep looking at you, then at the grapes, then at you. That is, I believe, the Mankey way of saying a great deal."',
    empty: 'A single grape has been left on the chair, like a very small apology.' },
  { id: 'cubone', name: 'The little Cubone', dish: 'a bone-shaped biscuit', good: ['cubone-joined', 'cubone-trusted'],
    said: '"It sits closer to you than to the fire. It hasn\'t taken its skull off since the road. It\'s holding your hand. Don\'t move."' },
  { id: 'factory', name: 'The Muk of the old factory', dish: 'something green and shining', good: ['factory-freed', 'factory-muk-helped'], bad: ['factory-lost'],
    said: '"It\'s been out of the pipes for a year. It still smells of the pipes. Somehow, tonight, it smells like home. Don\'t say that to it."',
    empty: 'A puddle has gathered under the chair, in the shape of a long, long sigh.' },
  { id: 'jungle', name: 'The people of the jungle village', dish: 'a ripe, dripping fruit', good: ['jungle-unharmed'], bad: ['jungle-harmed'],
    said: '"The vines have grown back over the track you cut. Gently. We cried a little. Then we brought you the sweetest thing we grow."',
    empty: 'A cut vine lies coiled on the seat. Someone has tied it in a careful bow.' },
  { id: 'giants', name: 'The giants of the island', dish: 'a fist of honeycomb', good: ['giants-calm'], bad: ['giants-lost'],
    said: '"They had to send the smallest one to sit with you. The big ones wouldn\'t fit under the table. They\'re listening from the field."',
    empty: 'The chair is enormous, and no one is in it. The grass around it is pressed flat, as if they had sat down and thought better of it.' },
  { id: 'mansion', name: 'The ghosts of the old mansion', dish: 'a cold, silver pot of tea', good: ['mansion-thanked'],
    said: '"Do not worry about the draught. It\'s only us, trying to sit still. We\'ve not had so many guests in years, not alive ones. Thank you."' },
  { id: 'circus', name: 'The shy performer', dish: 'a pocket of sweets', good: ['circus-shy-helped'],
    said: '"I didn\'t think I could. Not in front of everyone. Now there is a stage, and the lights, and you\'re in the front row. I\'m terrified."' },
  { id: 'defector', name: 'The one who walked out', dish: 'a crust and a letter', good: ['defector-boss-won'],
    said: '"I haven\'t slept properly since I left. Tonight I will. They gave me a chair. A real one. With a name on it. Mine."' },
  { id: 'hideout', name: 'The freed Shadow Pokémon', dish: 'a clean blue flame', good: ['hideout-shadow-freed'],
    said: '"The eyes aren\'t red now. It still looks over its shoulder, every few minutes. Then it looks at you, and it stops looking."' },
  { id: 'forest', name: 'The keepers of the forest', dish: 'a seedling in a cup', good: ['forest-planted'],
    said: '"We planted the little tree where you said. It has leaves now. It sent us here with a seedling, for you. It was most insistent."' },
  { id: 'desert', name: 'The traveller from the desert', dish: 'a flask of water', good: ['desert-gave-water'],
    said: '"You gave me water, when you had so little. I counted. Every night I counted. I brought you back one more than you gave."' },
  { id: 'bidoof', name: 'Mr. Applewhite and his Bidoof', dish: 'a perfectly ordinary turnip', good: ['bidoof-end'],
    said: '"It is a perfectly ordinary Bidoof. It has eaten four turnips. It has not once said what it thinks of the table, which is a mercy."' },
  { id: 'ring', name: 'The rescued from the smugglers', dish: 'a pair of mismatched mugs', good: ['ring-finished', 'bridge-ring-stopped'],
    said: '"They said there would be a table for us. We did not believe it, either. And look. Nobody checked who we were."' },
];

/** One seat at the table: a guest (filled or empty), or the pile of stones at the far end. */
export interface Seat { guest: Guest | null; empty: boolean }

const any = (run: Pick<RunState, 'story'>, flags: string[] | undefined): boolean => !!flags && flags.some((k) => f(run, k) > 0);

/** Every place laid for this run, in order, ending with the stones. Pure: it reads only what the run remembers. */
export function seatsOf(run: Pick<RunState, 'story'>): Seat[] {
  const seats: Seat[] = [];
  for (const g of GUESTS) {
    if (any(run, g.good)) seats.push({ guest: g, empty: false });
    else if (g.empty && any(run, g.bad)) seats.push({ guest: g, empty: true });
  }
  seats.push({ guest: null, empty: false });
  return seats;
}

/** How many stones: one for each event the run walked past or into. */
export const stones = (run: Pick<RunState, 'itemCounters'>): number => Object.keys(run.itemCounters ?? {}).filter((k) => k.startsWith('event-seen:')).length;

const seatName = (s: Seat): string => (!s.guest ? 'the stones' : s.empty ? `${s.guest.name}'s empty chair` : s.guest.name);

function setSlots(run: RunState, page: number): void {
  const seats = seatsOf(run);
  for (let k = 0; k < LT_PAGE; k++) set(run, `lt-slot-${k}`, page * LT_PAGE + k < seats.length ? page * LT_PAGE + k + 1 : 0);
  set(run, 'lt-page', page);
  set(run, 'lt-more', (page + 1) * LT_PAGE < seats.length ? 1 : 0);
}

/** The player walks the length of the table: the seats are counted and the first page is shown. */
export function ltArrive(run: RunState): string {
  const seats = seatsOf(run);
  set(run, 'lt-seats', seats.length - 1);
  set(run, 'lt-filled', seats.filter((s) => s.guest && !s.empty).length);
  setSlots(run, 0);
  return '';
}

/** Walk further down: the next three seats, and back to the start at the end. */
export function ltPage(run: RunState): string {
  const seats = seatsOf(run);
  const page = f(run, 'lt-page') + 1;
  setSlots(run, page * LT_PAGE < seats.length ? page : 0);
  return '';
}

/** Sit by the seat in slot `n` (0 to 2): its guest and the next one are the neighbours (the last two when it is the stones). */
export function ltSit(run: RunState, n: number): string {
  const seats = seatsOf(run);
  const seat = f(run, `lt-slot-${n}`);
  if (seat < 1 || seat > seats.length) return '';
  const last = seats.length;
  const a = seat === last ? Math.max(1, last - 1) : seat;
  const b = seat === last ? last : seat + 1;
  set(run, 'lt-n1', a);
  set(run, 'lt-n2', b);
  set(run, 'lt-two', a === b ? 0 : 1);
  return '';
}

const LINES_STONES = (n: number): string => `"One for everything you walked past," says the pile. It is only stones. ${n === 0 ? 'There are none. A bare road, then.' : `${n} of them, each small and grey and set down by a different hand.`}`;

/** Text tokens: {lt:name:<slot>}, {lt:talk:<1|2>}, {lt:count}, {lt:roll}. */
export function ltTokens(run: RunState, text: string): string {
  const seats = seatsOf(run);
  const at = (i: number): Seat | undefined => seats[i - 1];
  return text
    .replace(/\{lt:name:([0-2])\}/g, (_, n: string) => { const s = at(f(run, `lt-slot-${n}`)); return s ? seatName(s) : 'the stones'; })
    .replace(/\{lt:talk:([12])\}/g, (_, n: string) => {
      const s = at(f(run, `lt-n${n}`));
      if (!s) return '';
      if (!s.guest) return LINES_STONES(stones(run));
      return s.empty ? `*${s.guest.empty ?? 'The chair is empty.'}*` : `**${s.guest.name}:** ${s.guest.said}`;
    })
    .replace(/\{lt:count\}/g, () => String(f(run, 'lt-filled')))
    .replace(/\{lt:roll\}/g, () => {
      const names = seats.filter((s) => s.guest && !s.empty).map((s) => s.guest!.name);
      return names.length === 0 ? 'no one' : names.join(', ');
    })
    .replace(/\{lt:plate\}/g, () => {
      const dishes = [f(run, 'lt-n1'), f(run, 'lt-n2')].map(at).filter((s): s is Seat => !!s?.guest && !s.empty).map((s) => s.guest!.dish);
      return dishes.length === 0 ? 'a pebble from the pile' : dishes.join(' and ');
    });
}

/** Dawn: the cleared table. +1% to every stat of the whole party per filled place (at most 10%), for the last battle (ends with the region). */
export function ltDawn(content: Content, run: RunState): string {
  if (f(run, 'lt-done') > 0) return '';
  set(run, 'lt-done', 1);
  const seats = seatsOf(run);
  const filled = seats.filter((s) => s.guest && !s.empty);
  const bonus = Math.min(LT_CAP, filled.length);
  set(run, 'lt-bonus', bonus);
  if (bonus > 0) {
    for (const mon of run.party) {
      mon.eventBoosts = { ...mon.eventBoosts, ...Object.fromEntries(STATS.map((s) => [s, (mon.eventBoosts?.[s] ?? 0) + bonus])) };
      mon.eventBoostsRegion = { ...mon.eventBoostsRegion, ...Object.fromEntries(STATS.map((s) => [s, (mon.eventBoostsRegion?.[s] ?? 0) + bonus])) };
    }
  }
  void content;
  const names = filled.map((s) => s.guest!.name).join(', ');
  const cap = filled.length > LT_CAP ? ` (${filled.length} places, held at the cap of ${LT_CAP}%)` : '';
  return bonus === 0
    ? 'No place was laid with a name card. The party stands alone at dawn: +0%.'
    : `Every place laid is behind you: +${bonus}% to every stat, for the whole party, in the last battle${cap}. With you: ${names}.`;
}

/** Is this the run's last stage (the last stage of the last regular region)? */
export function isLastStage(content: Content, run: RunState, stagesPerRegion: number, regularRegions: number): boolean {
  void content;
  return !!run.stage && run.stage.kind === 'stage' && run.stage.index + 1 >= stagesPerRegion && run.regionIndex + 1 >= regularRegions;
}
