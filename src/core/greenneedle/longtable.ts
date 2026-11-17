// Greenneedle gn.new.38, The Long Table (doc GREENNEEDLE_PLACED_2.md lines 634–667). The night before the last battle.
// A place for every event that ended well (a name card), an empty chair for each that did not, and a pile of stones at the far end.
// Seats are worked out once, when the player walks the table; the player sits by any of them; the two neighbours speak.
// Reward: +1% to every stat of the whole party for the last battle for each filled place, at most 10%.
import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { addItem } from '../items';

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
  /** The bag item the dish is, at dawn ("whatever was on the player's plate is in the bag"); a berry when the dish has no item of its own. */
  gift?: string;
}
/** The dish that has no item of its own goes into the bag as this. */
export const LT_PLATE = 'oran-berry';

/** In the order down the table: one guest for each event that can end well or badly. A flag no event sets yet simply never seats anyone. */
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
  { id: 'ranch', name: 'Ysabeau, the rancher', dish: 'a berry from the ranch', gift: 'oran-berry', good: ['ranch-dug', 'ranch-moved'], bad: ['bibarel-dam-broken'],
    said: '"Twelve. All twelve. I named a calf after your digger. She doesn\'t know. She\'s a calf, but I do, and I wanted you to hear it."',
    empty: 'A thin Bidoof is sitting under it, very quietly, looking at the empty plate.' },
  { id: 'well', name: 'Old Tabor', dish: 'a pebble from a well', gift: 'hard-stone', good: ['well-lifted'],
    said: '"We use the well. I say sorry to it. Daft. It answers with a pebble, every morning, and I put it in my pocket like a fool."' },
  { id: 'kaiju', name: 'Ned and the harbour crews', dish: 'a net of shellfish', good: ['kaiju-freed'], bad: ['kaiju-lost'],
    said: '"Nobody on the dock will say it, so I will. You didn\'t leave it in the net. It went back out. We watch the tide every day."',
    empty: 'A boat hook is propped against the chair. The water in the cup is salt.' },
  { id: 'squad', name: 'The Squirtle Squad', dish: 'a bowl of cold spring water', gift: 'fresh-water', good: ['kanto-squad-joined'],
    said: '"Sunglasses stay ON at dinner. House rule. But I\'m allowed to cry behind them, and I am. Pass the water. Thank you. For everything."' },
  { id: 'mankey', name: 'The Mankeys of Route 25', dish: 'a bunch of grapes', gift: 'pecha-berry', good: ['mankey-fifth-joined', 'mankey-waited'], bad: ['mankey-hit-fifth'],
    said: '"They keep looking at you, then at the grapes, then at you. That is, I believe, the Mankey way of saying a great deal."',
    empty: 'A single grape has been left on the chair, like a very small apology.' },
  { id: 'cubone', name: 'The little Cubone', dish: 'a bone-shaped biscuit', good: ['cubone-joined', 'cubone-trusted'],
    said: '"It sits closer to you than to the fire. It hasn\'t taken its skull off since the road. It\'s holding your hand. Don\'t move."' },
  { id: 'factory', name: 'The Muk of the old factory', dish: 'something green and shining', good: ['factory-freed', 'factory-muk-helped'], bad: ['factory-lost'],
    said: '"It\'s been out of the pipes for a year. It still smells of the pipes. Somehow, tonight, it smells like home. Don\'t say that to it."',
    empty: 'A puddle has gathered under the chair, in the shape of a long, long sigh.' },
  { id: 'jungle', name: 'The people of the jungle village', dish: 'a ripe, dripping fruit', gift: 'sweet-apple', good: ['jungle-unharmed'], bad: ['jungle-harmed'],
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
  { id: 'ring', name: 'The rescued from the smugglers', dish: 'a pair of mismatched mugs', good: ['ring-finished'],
    said: '"They said there would be a table for us. We did not believe it, either. And look. Nobody checked who we were."' },
  // ---- the new events (GREENNEEDLE_PLACED_1.md and _2.md), in their own order ----
  { id: 'dog', name: 'The Growlithe from the station', dish: 'a station sandwich, in paper', good: ['dog-reunited', 'dog-chose-player'],
    said: '"It doesn\'t watch the door. Four years it watched a door. Tonight it has its chin on the table, and it is watching the food."' },
  { id: 'ball', name: 'The one from the Ball that wouldn\'t open', dish: 'a polished Apricorn', gift: 'red-apricorn', good: ['ball-after'],
    said: '"It keeps the Ball beside its plate. It doesn\'t go back in. It likes to know where the Ball is, that\'s all. So would you."' },
  { id: 'egg', name: 'The hatchling that listened', dish: 'a warm bread roll', good: ['egg-listened-hatched'],
    said: '"It heard all of this before it had ears. Every word on the road. It looks round the table as if it were checking the voices against a list."' },
  { id: 'understudy', name: 'Madame Okonjo-Reyes and the company', dish: 'a bag of stage toffee', good: ['understudy-ending'],
    said: '"Darling, the house was full. FULL. I have told the story eleven times tonight and it improves with each telling. Sit. Twelve."' },
  { id: 'arcade', name: 'Mr. Vandersloot, from the arcade', dish: 'a paper cone of chips', good: ['arcade-cleared'], bad: ['arcade-sold'],
    said: '"Three games, cleared. I had that cabinet eleven years and never saw the last screen. Have a chip. Have all of them."',
    empty: 'A single arcade token lies on the plate, heads up. On the screen it came from, a small bird is still waiting.' },
  { id: 'weather', name: 'The keeper of the weather station', dish: 'a flask of tea, still hot', good: ['ws-done'],
    said: '"Clear tonight. I checked, and then I checked the old way, with my knee. Both say clear. First night off the hill in years."' },
  { id: 'stranding', name: 'The beach town that held the Wailord', dish: 'a pot of chowder', good: ['stranding-helped'],
    said: '"Forty of us in the surf till the tide came back. My arms still ache. Best ache I ever had. Eat, there\'s a whole pot."' },
  { id: 'center', name: 'The nurse from the Center that closed', dish: 'a tray of warm towels and soup', good: ['gn18-done'],
    said: '"The lights are back on. I left the night bell switched off for one evening, to come here. I keep reaching for it."' },
  { id: 'snowbound', name: 'The snowbound village', dish: 'a crate of winter pears', gift: 'tart-apple', good: ['sv-done'],
    said: '"The pass is open. We came down it this morning, all of us, on the sled you loaded. The bell rang the whole way."' },
  { id: 'orchestra', name: 'The meadow orchestra', dish: 'a comb of meadow honey', gift: 'honey', good: ['orchestra-end'],
    said: '*Forty Kricketot, in rows, on the tablecloth. The old Kricketune taps the rim of a glass, twice, and they play you the first note. They never miss it.*' },
  { id: 'court', name: 'The strays of the alley court', dish: 'half a fish', good: ['court-kittens', 'court-meowth-won', 'court-meowth-lost'], bad: ['court-persian'],
    said: '*The Persian has the head of the fish, with great dignity. Six kittens are sitting on things. One of the things is your foot.*',
    empty: 'Half a fish lies on the plate, uneaten. No stray has come down from the roofs to claim it.' },
  { id: 'appliance', name: 'Old Mr. Dufresne', dish: 'a loaf from a borrowed oven', good: ['appliance-done'], bad: ['appliance-open'],
    said: '"Closed Friday, I said. I lied. It picked, you know. Or it didn\'t. Either way it hums when your name comes up. Bread?"',
    empty: 'A fan, a fridge door, an oven knob, a washer dial and a mower blade are laid at the place, like cutlery. Nothing hums.' },
  { id: 'daycare', name: 'Mr. and Mrs. Holloway', dish: 'a bowl of Mrs. Holloway\'s stew', good: ['daycare-defended', 'daycare-fed'], bad: ['daycare-egg-taken'],
    said: '"Forty in the shed, and forty this morning. We counted. We\'ve brought the frying pan, in case. Force of habit. Eat up."',
    empty: 'A frying pan and a broom lean against the chair. On the plate, a small knitted egg cosy, with no egg in it.' },
  { id: 'mural', name: 'The Smeargle of the long wall', dish: 'a bun in a painted wrapper', good: ['mural-walls'],
    said: '*It has painted the tablecloth, from your end to the far one. You are in it, arriving. It is already working on the lamps.*' },
  { id: 'ace', name: 'Your rival, and the ace that came back', dish: 'a bag of trail mix, tipped out to share', good: ['rival-ace-found'], bad: ['rival-wasnt-there'],
    said: '"It sat next to me the whole way here. It bowed at the gate. To you, I think. Don\'t make it weird. Pass the bread."',
    empty: 'The rival\'s bag is on the chair, buckled shut. They are sitting further down the table, with their back half turned.' },
  { id: 'littlecup', name: 'Tansy-Jane and the Sunkern', dish: 'a pocketful of sunflower seeds', good: ['lc-won'],
    said: '"I still want the cup back next year. I\'m telling you now. It sat in the sun all the way here and it isn\'t even cross with you."' },
  { id: 'bridge', name: 'The fighters from under the bridge', dish: 'a plate of dojo rice balls', good: ['ring-won-clean', 'ring-freed'], bad: ['ring-threw'],
    said: '"Nobody rings a bell here. Nobody counts. A Machoke keeps putting food on other plates. It hasn\'t eaten yet. It is too busy being allowed to."',
    empty: 'A length of rope lies coiled on the seat. Somewhere under a road, a pan is being hit with a spoon.' },
  { id: 'borrowed', name: 'The referee with the two hats', dish: 'two hats, full of roasted nuts', good: ['borrow-result'],
    said: '"Exhibition rules. You eat from their hat. They eat from yours. No, I don\'t make the rules. Yes I do. Eat."' },
  { id: 'cheer', name: 'Plusle and Minun', dish: 'a leaf pom-pom, full of berries', gift: 'sitrus-berry', good: ['cheer-both', 'cheer-truth'], bad: ['cheer-split'],
    said: '*They cheer when you sit down. They cheer when you lift your cup. They are arguing, in squeaks, about which cheer made the soup hot.*',
    empty: 'One leaf pom-pom lies on the seat. The other one is cheering for someone else tonight, a long way down the road.' },
  { id: 'fox', name: 'The Ninetales of the shrine', dish: 'a paper lantern, lit', good: ['fox-l9'], bad: ['fox-declined'],
    said: '**In your head:** "Nine lit. I counted them again before I came. I do not forget things, now. I have decided."',
    empty: 'A stone lantern stands on the seat, unlit. Nine tails\' worth of grass beside it is pressed flat, and cold.' },
  { id: 'pichu', name: 'The Pichu from the split tree', dish: 'a slightly scorched berry', gift: 'cheri-berry', good: ['raikou-pichu'],
    said: '*Far off, thunder. Everyone at the table looks up but one. It goes on eating, ears steady, and offers you the scorched half.*' },
  { id: 'courier', name: 'Mr. Okoro and the old courier', dish: 'a slice of sheet cake', good: ['courier-done'], bad: ['courier-let-go'],
    said: '"We cut the cake at last. It wouldn\'t let us, till the parcel was in. It\'s asleep on the roof of the tent. Mailbag on."',
    empty: 'A mailbag hangs on the back of the chair. The slice of cake in front of it has not been cut.' },
  { id: 'warning', name: 'Goody Prowse and the village under the ridge', dish: 'a pot of something warm', good: ['warning-kept'], bad: ['absol-driven'],
    said: '"We stacked the stones. Every one. Nobody told us to. It sits on the ridge and we leave a dish of water. That\'s how a village says it."',
    empty: 'A stone sits in the middle of the plate. Nobody threw it. Nobody will pick it up.' },
  { id: 'storyteller', name: 'The Storyteller', dish: 'a heel of bread, and a story', good: ['sr-told'],
    said: '"...and the trainer sat down at a long table, between two friends. Left, I think. No. Well. You tell me."' },
  { id: 'lantern', name: 'Aunt Brigid, the boat-maker', dish: 'a paper boat with a sweet in it', good: ['lantern-boat', 'ls-child'],
    said: '"One for each who didn\'t come home, and tonight, one for each who did. Yours is by your plate. Everyone\'s first one\'s free."' },
  { id: 'nest', name: 'The Braviary and its chick', dish: 'a strip of dried fish', good: ['second-nest-carried', 'second-nest-left'], bad: ['second-nest-watched'],
    said: '*The chick is twice the size of the chair. The Braviary sits beside it like a much smaller bird, feet together, and lets it have the fish.*',
    empty: 'A single small feather lies on the seat, red and grey: a Fletchinder\'s. No one fought for the nest.' },
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

/** How many stones: one for everything walked past (the pack flag `kind.walked_past`, counted up by each event walked away from). */
export const stones = (run: Pick<RunState, 'story'>): number => f(run, 'kind-walked-past');

/** The bag item a guest's dish is (the plain berry when it names none, or one the game does not have). */
export const giftOf = (content: Content, g: Guest): string => (g.gift && (content.items.has(g.gift) || content.catalog.has(g.gift)) ? g.gift : LT_PLATE);

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
  // "Whatever was on the player's plate is in the bag": the dishes of the two neighbours (filled places only).
  const plate = [f(run, 'lt-n1'), f(run, 'lt-n2')].map((i) => seats[i - 1]).filter((x): x is Seat => !!x?.guest && !x.empty);
  for (const p of [...new Set(plate)]) addItem(run.inventory, giftOf(content, p.guest!), 1);
  if (bonus > 0) {
    for (const mon of run.party) {
      mon.eventBoosts = { ...mon.eventBoosts, ...Object.fromEntries(STATS.map((s) => [s, (mon.eventBoosts?.[s] ?? 0) + bonus])) };
      mon.eventBoostsRegion = { ...mon.eventBoostsRegion, ...Object.fromEntries(STATS.map((s) => [s, (mon.eventBoostsRegion?.[s] ?? 0) + bonus])) };
    }
  }
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
