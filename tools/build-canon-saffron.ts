// Beta 0.6 workstream 18, Saffron City (CANON_SPACES_KANTO.md section 9): writes src/data/eventsCanonSaffron.json.
// Route 25, Fighting Tournament, Fighting Dojo, Copycat Girl, Silph Co. Lobby, Magnet Train and Sabrina's Labyrinth, as event rooms.
// Run: node tools/build-canon-saffron.ts   (the rules these use live in src/core/expansion/canonSaffron.ts)
// NOTE (Beta 0.7): the Labyrinth rooms in src/data/eventsCanonSaffron.json were later edited by hand; re-running this tool would overwrite them with the older version. Route 25 and the Tournament (9.3, 9.4) are current here.

import { writeFileSync } from 'node:fs';

type Json = Record<string, unknown>;
const P = 'cs-kanto-saffron-';
const events: Json[] = [];

interface Opts { canon?: string; room?: boolean; stop?: 'event' | 'delve'; tint?: string; effect?: string; pokemon?: string }
function ev(id: string, name: string, intro: string, choices: Json[], o: Opts = {}): void {
  events.push({
    id: P + id, name, group: 'Canon Spaces: Kanto', stop: o.stop ?? (o.room ? 'delve' : 'event'), rarity: 'common', minStage: 1, types: [], requires: [],
    scene: { cast: [], ...(o.pokemon ? { pokemon: o.pokemon } : {}), effect: o.effect ?? 'none', tint: o.tint ?? '#5b3a6e' },
    intro, choices, ...(o.canon ? { canon: o.canon } : {}), ...(o.room ? { room: true } : {}),
  });
}
const add = (id: string) => ({ kind: 'addEvent', eventId: P + id });
const flag = (key: string) => ({ kind: 'flag', key, amount: 1 });
const canon = (action: string, extra: Json = {}) => ({ kind: 'canon', action, species: [], ...extra });
const leave = (text = 'You walk on.') => ({ label: 'Walk on', success: { text, effects: [] } });

// ---------- 9.3 Route 25: The Angry Mankey (Beta 0.7 rebuild of Kice's spec 15) ----------
// Mandatory check: five Mankey in a row, nobody healed in between; the fifth stands in front of the other four and does not attack first.
// Optional: the thieves' camp is one node off the path (before or after the fight). Bringing the food back (flag r25-food) changes the ending.
const FOOD = { kind: 'flag', key: 'r25-food', atLeast: 1 };
const NOFOOD = { kind: 'flag', key: 'r25-food', atLeast: 0, atMost: 0 };
const R25 = '#6b4a3a';
ev('r25', 'Route 25: The Angry Mankey',
  'The road is lined with torn sacks and spilled grain. Pale tracks lead into the grass, and from the grass comes a sound you can feel in your teeth: a whole troop of Mankey, screaming. They are not angry at you. They have not eaten properly in a week, and someone has been taking what they stored for the winter. You are only the next stranger on the road, and they have no more patience left.',
  [
    { label: 'Face the troop', success: { text: 'You set your feet. The screaming stops all at once, and that is worse.', effects: [add('r25-1')] } },
    { label: 'Follow the torn sacks first', success: { text: 'The trail bends away from the road, toward a thread of smoke. Someone has been very careless about hiding what they took.', effects: [add('r25-camp')] } },
  ], { canon: 'cs.kanto.saffron.route25', tint: R25 });
ev('r25-camp', "Route 25: The Thieves' Camp",
  "A rough camp in a hollow: three trainers, a cookfire, and a stack of the troop's food sacks they have stopped bothering to hide. A kid's drawing is pinned to the tent: a Mankey with a crown. They took this winter's food from something that has never once asked anyone for anything.",
  [
    { label: 'Take the food back', success: { text: 'Nobody wins an argument against a returned sack and a raised fist. The camp breaks and runs, and you lift the heaviest sack onto your shoulder. It is lighter than it should be. They had already eaten a good part of it.', effects: [], battle: { kind: 'trainer', name: 'Food Thieves', size: 2, team: ['meowth', 'raticate'], levelBonus: 0, win: [flag('r25-food'), add('r25-1')] } } },
    { label: 'Leave it, and face the troop', success: { text: 'You turn back. The troop is still waiting, and still hungry.', effects: [add('r25-1')] } },
  ], { room: true, tint: '#4a3a2a' });
ev('r25-1', 'Route 25: The First Three',
  'The grass breaks open. Three Mankey come at once, shoulder to shoulder, and their eyes are not rage so much as hunger wearing rage like a coat. There will be no breaks between them. The troop has fought this way for a week.',
  [{ label: 'Hold the line', success: { text: 'Three bodies hit you at once. You do not get a breath, and you were not going to be offered one.', effects: [], battle: { kind: 'wild', species: ['mankey'], chain: 3, levelBonus: 1, win: [add('r25-4')] } } }], { room: true, tint: R25 });
ev('r25-4', 'Route 25: The Fourth',
  'Three are down and breathing hard. No potion, no rest. The fourth Mankey was watching the whole fight, and it has learned something from watching. It does not scream. It simply comes.',
  [{ label: 'Meet it', success: { text: 'It is smarter than the first three, and angrier, because it understood what you did to its friends.', effects: [], battle: { kind: 'wild', species: ['mankey'], levelBonus: 1, win: [add('r25-5')] } } }], { room: true, tint: R25 });
ev('r25-5', 'Route 25: The Fifth Stands Still',
  'The fifth Mankey does not charge. It walks out from the rocks and plants itself in front of the other four, who have crawled back to its feet, scratched and silent. It spreads its arms. It is not here to win. It is here so that nobody else has to be hit again. It looks at you, and for one breath you understand that you are the thing that frightens it.',
  [{ label: 'Meet its eyes', success: { text: 'It does not attack first. It waits for you to decide what kind of person you are.', effects: [], battle: { kind: 'wild', species: ['mankey'], levelBonus: 2, rule: { foeStands: 1 }, win: [add('r25-after')] } } }], { room: true, tint: R25 });
ev('r25-after', 'Route 25: The Quiet After',
  'The fifth Mankey lies in the grass, and the other four crowd around it, shaking. Nobody screams now. The whole troop is looking at you and at each other, and it is the kind of quiet in which a person decides who they are.',
  [
    { label: "Go find the thieves' camp", requires: [NOFOOD], success: { text: 'You look back at the troop. They watch you go. It might be the first time in a week that something has walked toward the thieves instead of away.', effects: [add('r25-camp-after')] } },
    { label: "Accept the troop's thanks", requires: [FOOD], success: { text: 'The troop saw you come back with the sack. They do not understand every word, but they understand that.', effects: [add('r25-thanks')] } },
    { label: 'Offer your hand to the fifth Mankey', requires: [NOFOOD], success: { text: 'It sniffs your hand for a long time. It is deciding whether you are as hungry for a fight as it was.', effects: [add('r25-claim')] } },
  ], { room: true, tint: R25 });
ev('r25-camp-after', "Route 25: The Thieves' Camp (After)",
  'The camp is exactly where the tracks said. The thieves heard the screaming stop and hoped it meant the troop had gone. They are packing the sacks they have not yet eaten into a cart. They see you, and their faces do the arithmetic.',
  [
    { label: 'Take the food back', success: { text: 'It is easier than it should be. They were already half-ashamed. You carry the last sack back by hand, and as you walk the road you hear the troop begin to sing, which is not a word anyone has taught them.', effects: [], battle: { kind: 'trainer', name: 'Food Thieves', size: 2, team: ['meowth', 'raticate'], levelBonus: 0, win: [flag('r25-food'), add('r25-thanks')] } } },
    { label: 'Let it go', success: { text: 'You leave the cart where it stands. The troop will remember that.', effects: [add('r25-claim')] } },
  ], { room: true, tint: '#4a3a2a' });
const MANKEY_JOIN = [{ kind: 'teachMove', move: 'swords-dance', species: 'mankey', slot: 2 }, { kind: 'teachMove', move: 'mach-punch', species: 'mankey', slot: 3 }, flag('kanto-mankey'), canon('flawless'), add('tournament')];
ev('r25-thanks', 'Route 25: What the Troop Gave Back',
  "The fifth Mankey rises, and the troop parts around it. It walks to the sack you carried and puts a hand flat on the grain, and then it walks to you. It is not a request. It is the first Mankey that has ever stood between a troop and a stranger and then been fed by the stranger. It will come with you, and the rest of the troop will be waiting in the stands.",
  [{ label: 'Welcome Mankey into your team', success: { text: 'It bumps its forehead against your leg, once, hard. The troop watches you go. Not one of them looks angry any more. Mankey will be looking for them in the crowd.', effects: [{ kind: 'join', species: ['mankey'], types: [], levelBonus: 0, friendship: 40 }, ...MANKEY_JOIN] } }], { room: true, tint: '#8a6a3a' });
ev('r25-claim', 'Route 25: A Mankey Steps Out',
  'The fifth Mankey steps out of the circle. It does not trust you, but it has seen what you are willing to fight for. The other four lower their eyes. The troop is still hungry, and it is not yours to feed today. It will follow you and ask nothing, which is its own way of saying a great deal.',
  [{ label: 'Welcome Mankey into your team', success: { text: 'It walks beside you and never quite looks back. The troop watches until the road bends.', effects: [{ kind: 'join', species: ['mankey'], types: [], levelBonus: 0 }, ...MANKEY_JOIN] } }], { room: true, tint: R25 });

// ---------- 9.4 The Fighting Tournament (Beta 0.7 rebuild of Kice's spec 16) ----------
// 32 entrants, five rounds, Fighting types only, one Pokémon each (the Mankey or Primeape, via the Saffron stash). A sports anime in five rounds:
// commentary, a crowd, a training montage between rounds (Power, Guard or Footwork, a small bonus for the rest of the bracket), and recurring competitors.
const TS = '#7a3b2e';
const entry = (species: string) => ({
  label: `Enter with ${species === 'mankey' ? 'Mankey' : 'Primeape'}`, requires: [{ kind: 'partySpecies', species }],
  success: { text: 'The sign-up sheet has thirty-two names. Yours goes at the bottom, in your own hand. Only your fighter will step onto the mat. Everyone else on your team goes to the rail to watch, and not one of them is happy about it.', effects: [canon('solo', { species: ['mankey', 'primeape'] }), add('tc')] },
});
ev('tournament', 'Saffron Fighting Tournament',
  'A banner stretched across the dojo yard: THE SAFFRON FIGHTING TOURNAMENT. Thirty-two fighters, Fighting types only, one Pokémon each. The organizer, a woman with a clipboard and a bruise on her chin, looks at your Mankey the way a coach looks at a student they have not met yet. "Only that one steps in," she says. "Everything the rest of you know has to stay at the rail."',
  [entry('mankey'), entry('primeape'), leave('You leave it for the next trainer.')], { canon: 'cs.kanto.saffron.tournament', room: true, tint: TS });
ev('tc', 'Tournament: The Crowd',
  'A bell. The gate opens. A noise comes up out of the stands like a wave breaking, and over the PA, a voice that has been waiting all year to say this: "Ladies and gentlemen, thirty-two fighters, five rounds, one belt!" A commentary desk beside the mat has two seats: a retired champion with a broken nose, and a young announcer who has never once stopped talking.',
  [
    { label: 'Look to the stands', requires: [FOOD], success: { text: 'Row after row of brown fur. The whole Mankey troop came down from Route 25 and is standing on the benches, stamping their feet. Someone has hung a sack of grain from the rail like a banner. Your Mankey sees them and does not move for a long moment.', effects: [add('t1')] } },
    { label: 'Look to the stands', requires: [NOFOOD], success: { text: 'You scan the rows for brown fur and find none. No one is there for your Mankey. It stands very straight, and it has stopped looking.', effects: [add('t1')] } },
  ], { room: true, tint: TS });
const ROUNDS = [
  { n: 1, bracket: 'Round of 32', species: ['machop'], prize: 'muscle-band', name: 'Machop', rule: {}, intro: 'Round of 32. A Machop with a twin on the rail: the twin is a coach, bellowing instructions and flinching at every hit. "That one is somebody\'s whole family," says the young announcer. "Do not take it personally."', win: 'It goes down fighting, and its twin leaps the rail and carries it out in its arms. The crowd applauds that harder than the knockout.' },
  { n: 2, bracket: 'Round of 16', species: ['hawlucha'], prize: 'protein', name: 'Hawlucha', rule: { fanClub: true }, intro: 'Round of 16. A Hawlucha who spends more time on the ropes than on the mat. It points at people in the crowd, it blows kisses, it waves at the cameras. "It plays to the crowd," says the old champion, "and it is better than it pretends. Watch its feet."', win: 'It bows to the crowd in defeat, then, quietly, bows to you. The pose was a mask for something sharper.' },
  { n: 3, bracket: 'Quarterfinal', species: ['throh'], prize: 'focus-sash', name: 'Throh', rule: {}, intro: 'Quarterfinal. A Throh in a belt so worn it is the colour of dust. It bows to the crowd, to the referee, to the officials, and to you. "The politest fighter in Saffron," says the announcer. "That is not the same as the gentlest."', win: 'It rises, bows once more, and shakes your fighter\'s hand with both of its own. You do not remember when you last felt that respected by someone you had just beaten.' },
  { n: 4, bracket: 'Semifinal', species: ['hitmonchan'], prize: 'black-belt', name: 'Hitmonchan', rule: { silent: true }, intro: 'Semifinal. A Hitmonchan who has not made a sound in four tournaments: no cry, no grunt. Its fists speak. The announcer lowers his voice. "Nobody has ever heard it say a word. The people who have fought it say they did not need to."', win: 'It does not cry out when it falls. It lifts its eyes to yours, and for the first time in four years the crowd hears it exhale. That is the loudest thing in the building.' },
];
const MONTAGE = [
  ['The cafeteria-bench montage: you grab a rice ball in one fist and a clipboard in the other. The announcer calls this the quiet part, and says nothing for a moment.', 'You and your fighter climb the dojo steps again and again until the sun hits the hill.'],
  ['A rooftop at dusk. Somewhere below, a radio plays a song your fighter hums without knowing the words. A scrap of paper falls from your pocket: the bracket, with your name circled in your own handwriting.', 'You skip stones on the roof tiles. Your fighter throws punches at the dusk until its knuckles ring.'],
  ['The sun is rising, and your fighter is already up, shadow-boxing the first light. The Throh from the last round is outside the gate, bowing to the sunrise. It does not say anything. It holds the door.', 'Someone left a clean towel on the bench. Nobody will admit to it.'],
  ['The night before the final. The stadium is empty, chairs stacked, floor lights on low. Somewhere a faint cheer from the memory of the afternoon. Your fighter walks out alone, stands in the ring, and stares at the other side.', 'There is a single rival now, on the other side of a wall, awake too.'],
];
const PICKS = [
  { label: 'Power', text: 'Heavy bag, tyre drags, stones. Your fighter hits harder for the rest of the bracket.', fx: [{ kind: 'statMultiplier', stat: 'atk', value: 1.1 }] },
  { label: 'Guard', text: 'Slow drills, a hundred counters, learning how to take a hit. Your fighter takes the rest of the bracket a little more easily.', fx: [{ kind: 'statMultiplier', stat: 'def', value: 1.1 }, { kind: 'statMultiplier', stat: 'spd', value: 1.1 }] },
  { label: 'Footwork', text: 'Ladders, ropes, sidesteps until it stops thinking about its feet. Your fighter moves faster for the rest of the bracket.', fx: [{ kind: 'statMultiplier', stat: 'spe', value: 1.15 }] },
];
for (const r of ROUNDS) {
  const left = 5 - r.n;
  ev(`t${r.n}`, `Tournament: ${r.bracket}`, r.intro, [{
    label: 'Step into the ring', success: {
      text: `${r.bracket}: ${r.name} steps up, and the crowd rises with it.`, effects: [], battle: {
        kind: 'trainer', name: r.name, size: 1, species: r.species, types: ['fighting'], pseudo: true, rule: { matchLead: true, bstMatch: true, ...r.rule },
        win: [{ kind: 'item', id: r.prize, count: 1 }, { kind: 'heal', share: 0.4 }, add(`tm${r.n}`)], lose: [canon('unsolo')],
      },
    },
  }], { room: true, tint: TS });
  const final = r.n === 4;
  ev(`tm${r.n}`, `Tournament: Training Montage ${r.n}`, `${r.win} ${MONTAGE[r.n - 1]![0]} Pick what to train: ${left} ${left === 1 ? 'fight is' : 'fights are'} still ahead.`,
    PICKS.map((p, i) => ({ label: p.label, success: { text: `${p.text} ${MONTAGE[r.n - 1]![1]}`, effects: [{ kind: 'tempEffect', label: `Training: ${p.label}`, effects: p.fx, battles: left, until: 'battle' }, final ? { kind: 'addEventFrom', ids: [P + 't5a', P + 't5b', P + 't5c'] } : add(`t${r.n + 1}`)] } })), { room: true, tint: TS });
}
const RIVALS = [
  { id: 't5a', intro: 'The final. Across the mat stands a fighter of your own kind. Its trainer is a tired woman who runs a dojo with a leaking roof. The belt is prize money. If it wins, the dojo stays open and nine children keep their lessons. It looks at your fighter the way you look at your own, and neither of you wants to hurt the other.', name: 'The Dojo Rival' },
  { id: 't5b', intro: 'The final. Across the mat stands a fighter of your own kind, and it is crying before the bell. Its trainer is a boy who lost his father, a Black Belt who once fought in this ring. The belt is the only thing he has ever wanted. The announcer finds no joke for it.', name: 'The Fighter Who Cried' },
  { id: 't5c', intro: 'The final. Across the mat stands a fighter of your own kind with a scar through one eyebrow. Its trainer is a stranger from another region who says only: "I came to lose to someone who deserves it. Do not make me wait." The crowd does not know whether to cheer or to hush. Your fighter growls and means it.', name: 'The Stranger' },
];
for (const rv of RIVALS) {
  ev(rv.id, 'Tournament: The Final', rv.intro, [{
    label: 'Step into the ring', success: {
      text: 'The crowd chants for both of you. In the stands, nobody sits.', effects: [], battle: {
        kind: 'trainer', name: rv.name, size: 1, mirror: true, types: ['fighting'], pseudo: true, rule: { evolveMid: true, fanClub: true },
        win: [canon('champion', { species: ['mankey', 'primeape'] }), flag('kanto-tournament-won'), { kind: 'moment', text: 'Won the Saffron Fighting Tournament and the belt: the title, Dynamic Punch and Champion\'s Entrance.', importance: 80 }, canon('unsolo')], lose: [canon('unsolo')],
      },
    },
  }], { room: true, tint: TS });
}
ev('rival-return', 'A Familiar Belt',
  'On the path ahead a fighter of your own kind stands very straight, its arms folded across a belt it made itself: red cloth, knotted, bleached with the sun. It does not look at the stands this time. It looks at you, and bows, once, from the waist.',
  [
    { label: 'Bow back', success: { text: 'It is still too proud to say thank you. It grins at you, a flash of teeth. The home-made belt is the best thing it owns. It is nothing like the real one, and it has never looked better.', effects: [{ kind: 'moment', text: 'The Tournament rival returned in a home-made belt, and bowed.', importance: 60 }, { kind: 'friendship', amount: 10, who: 'party' }] } },
    leave('You nod and walk on. It watches you go, belt and all.'),
  ], { tint: TS });

// ---------- 9.5 Fighting Dojo ----------
ev('dojo', 'Saffron Fighting Dojo', 'The Fighting Dojo next door is open. Its master, arms folded, offers a one-on-one: his Machamp against your whole team.', [
  {
    label: 'Take the challenge', success: {
      text: 'The master bows. Machamp cracks its knuckles.', effects: [], battle: {
        kind: 'trainer', name: 'Dojo Master', size: 1, team: ['machamp'], types: ['fighting'], levelBonus: 1,
        // 15% of the time the master has a third student to offer (3 of 20).
        win: [{ kind: 'addEventFrom', ids: [...Array(3).fill(P + 'dojo-three'), ...Array(17).fill(P + 'dojo-two')] }],
      },
    },
  },
  leave('You bow and leave the dojo.'),
], { canon: 'cs.kanto.saffron.dojo', tint: '#8a4a2a' });
const student = (species: string, label: string) => ({ label, success: { text: `${label.replace('Take ', '')} bows and falls in step beside you.`, effects: [{ kind: 'join', species: [species], types: [], levelBonus: 0 }] } });
ev('dojo-two', 'Dojo: The Master’s Gift', 'The master nods. "You earned a student. Choose."', [student('hitmonlee', 'Take Hitmonlee'), student('hitmonchan', 'Take Hitmonchan')], { room: true, tint: '#8a4a2a' });
ev('dojo-three', 'Dojo: The Master’s Gift', 'The master nods, then calls a third student out of the back. "Today I can offer three. Choose."', [student('hitmonlee', 'Take Hitmonlee'), student('hitmonchan', 'Take Hitmonchan'), student('hitmontop', 'Take Hitmontop')], { room: true, tint: '#8a4a2a' });

// ---------- 9.6 Copycat Girl ----------
ev('copycat', 'The Copycat Girl', 'A girl in a bow follows you down the street, repeating every word you say and every step you take. She holds out a hand: "Copy me! Four claps!"', [
  {
    label: 'Play her game', prompt: { id: 'copycat-claps', needs: 'good' },
    success: { text: 'You match all four. She squeals, copies your Pokémon’s cry note for note, and hands you a TM: Mimic.', effects: [{ kind: 'teachMove', move: 'mimic' }] },
    failure: { text: 'You miss a clap. She copies your embarrassed face, giggles, and skips away.', effects: [] },
  },
  leave('She copies your wave and your walk, all the way out of town.'),
], { canon: 'cs.kanto.saffron.copycat', tint: '#c25a8a', effect: 'sparkle' });

// ---------- 9.7 Silph Co. Lobby ----------
ev('silph', 'Silph Co.: The Lobby', 'The lobby of the Silph Co. tower: marble floors, a hushed receptionist, a single elevator. The president himself comes down to meet visitors.', [
  {
    label: 'Meet the president', requires: [{ kind: 'evil', heatBelow: 40 }],
    success: { text: 'He thanks you for keeping the city safe and hands you a Poké Ball: a Lapras, bred for ferrying people across the water. "Something is wrong upstairs," he adds quietly. The building stays open to you.', effects: [{ kind: 'join', species: ['lapras'], types: [], levelBonus: 0 }, flag('kanto-silph-lobby')] },
  },
  {
    label: 'The guards turn you away', requires: [{ kind: 'evil', heat: 40 }],
    success: { text: 'Word has gone round that you are being hunted. The guards cross their arms. The lobby is as far as you get.', effects: [flag('kanto-silph-lobby')] },
  },
], { canon: 'cs.kanto.saffron.silph', tint: '#6f8aa8' });

// ---------- 9.8 Magnet Train ----------
ev('train', 'Saffron Magnet Train', 'The Magnet Train hums in its station, bound for the coast. A ride would carry you most of the way across, but you would see nothing of the road.', [
  { label: 'Ride the train', success: { text: 'The city blurs. You step off right beside the Gym, with nothing found along the way.', effects: [{ kind: 'skipAhead' }] } },
  leave('You watch it glide away without you.'),
], { canon: 'cs.kanto.saffron.train', tint: '#4a6a8a' });

// ---------- 9.2 Sabrina's Labyrinth ----------
const START = { text: 'Your Poké Balls rattle, then go quiet. The world tilts.', effects: [canon('ghostStart'), add('lab-lost')] };
ev('labyrinth', "Sabrina's Labyrinth", 'A fortune-teller in a violet shawl stops you outside the Gym: "Let me read your aura." A town guide hurries over, whispering about a special entrance that few ever see.', [
  { label: 'Let her read your aura', success: START },
  { label: 'Take the guide’s special entrance', success: START },
  leave('You decline. Nothing changes.'),
], { canon: 'cs.kanto.saffron.labyrinth', tint: '#2a1b3d', effect: 'fog' });
ev('lab-lost', 'Labyrinth: The First Fight', 'Your Pokémon are scattered across the Labyrinth, locked in shadow lanterns. A hooded shape blocks the corridor. You reach for a Poké Ball and find nothing. The first fight is lost before it begins. A tombstone rises on the dark, a swarm of ghosts flies behind it, and the dark folds into a new scene. A small ghost floats up to you: "I can help you get your body and your Pokémon back."', [
  { label: 'Follow the ghost', success: { text: 'Free every lantern, reach Sabrina, and your body comes home.', effects: [add('lab-n1')] } },
], { room: true, tint: '#1b1030', effect: 'fog' });

const LEVELS = [10, 15, 20, 25, 30, 37, 40];
const free = (k: number, next: string, extra: Json[] = []) => [canon('ghostFree'), canon('ghostLevel', { level: LEVELS[k] }), ...extra, add(next)];
const retry = (id: string) => [{ kind: 'damage', share: 0.2, who: 'lead' }, add(id)];
const LAB = { room: true as const, tint: '#1b1030', effect: 'fog' };
const lanternIntro = (n: number, what: string) => `Lantern ${n} of 6: one of your Pokémon is trapped inside. ${what}`;
ev('lab-n1', 'Labyrinth: The Possessed Trainer', lanternIntro(1, 'A trainer with empty eyes guards it.'), [{
  label: 'Challenge the trainer', success: {
    text: 'The ghost fights alone.', effects: [], battle: {
      kind: 'trainer', name: 'Possessed Trainer', size: 2, types: ['ghost', 'psychic'], pseudo: true, rule: { matchLead: true, noItems: true },
      win: free(1, 'lab-n2'), lose: [add('lab-n1')],
    },
  },
}], LAB);
ev('lab-n2', 'Labyrinth: The Mirror Puzzle', lanternIntro(2, 'Mirrors line the walls; the real path is the one that reflects true.'), [{
  label: 'Trace the true path', prompt: { id: 'tilt-drag', needs: 'ok' },
  success: { text: 'The mirrors part. The lantern opens. A campfire burns warm in the next chamber.', effects: free(2, 'lab-n3', [{ kind: 'addStop', stop: 'heal' }]) },
  failure: { text: 'The glass shows you a false road and bites back.', effects: retry('lab-n2') },
}], LAB);
ev('lab-n3', 'Labyrinth: The Memory Game', lanternIntro(3, 'Lights flash in a pattern. Echo it back.'), [{
  label: 'Echo the pattern', prompt: { id: 'echo-rhythm', needs: 'ok' },
  success: { text: 'The lights fall in line. The lantern opens.', effects: free(3, 'lab-n4') },
  failure: { text: 'You lose the thread and the dark pushes back.', effects: retry('lab-n3') },
}], LAB);
ev('lab-n4', 'Labyrinth: Two Doors', lanternIntro(4, 'Two doors, one lantern. One door is true.'), [
  { label: 'The left door', chance: 0.5, success: { text: 'The true door. The lantern opens, and a campfire waits beyond.', effects: free(4, 'lab-n5', [{ kind: 'addStop', stop: 'heal' }]) }, failure: { text: 'A false door. You stumble back out.', effects: retry('lab-n4') } },
  { label: 'The right door', chance: 0.5, success: { text: 'The true door. The lantern opens, and a campfire waits beyond.', effects: free(4, 'lab-n5', [{ kind: 'addStop', stop: 'heal' }]) }, failure: { text: 'A false door. You stumble back out.', effects: retry('lab-n4') } },
], LAB);
ev('lab-n5', 'Labyrinth: The Balance', lanternIntro(5, 'A scale hangs over the lantern. Hold steady until it levels.'), [{
  label: 'Hold the scale', prompt: { id: 'brace-hold', needs: 'ok' },
  success: { text: 'The scale settles. The lantern opens.', effects: free(5, 'lab-n6') },
  failure: { text: 'The scale tips and the weights fall.', effects: retry('lab-n5') },
}], LAB);
ev('lab-n6', 'Labyrinth: The Riddle', lanternIntro(6, 'A voice from the lantern: "I walk beside you but leave no steps. Cut me down and I still follow. What am I?"'), [
  { label: 'A memory', success: { text: 'Wrong. The voice sighs.', effects: retry('lab-n6') } },
  { label: 'A shadow', success: { text: 'The lantern flares open. Only Sabrina remains.', effects: free(6, 'lab-final') } },
  { label: 'An echo', success: { text: 'Wrong. The voice sighs.', effects: retry('lab-n6') } },
], LAB);
ev('lab-final', "Labyrinth: Sabrina's Alakazam", 'Sabrina waits at the heart of the Labyrinth with her Alakazam. "You are only a ghost," she says. "Go back to sleep."', [{
  label: 'Face Sabrina', success: {
    text: 'The ghost faces her alone.', effects: [], battle: {
      kind: 'trainer', name: 'Sabrina', size: 1, team: ['alakazam'], types: ['psychic'], levelBonus: 1, pseudo: true,
      rule: { matchLead: true, noItems: true, evolveMid: true, ghostRescue: true },
      win: [canon('ghostEnd'), flag('kanto-sabrina-ghost'), flag('kanto-sabrina-labyrinth-done'), flag('kanto-sabrina-haunting-owed')],
      lose: [add('lab-n1')],
    },
  },
}], LAB);

// ---------- the ghost's return, one scene per ghost ----------
for (const [base, final] of [['shuppet', 'banette'], ['duskull', 'dusknoir'], ['drifloon', 'drifblim'], ['gastly', 'gengar']] as const) {
  ev(`return-${base}`, 'The Ghost Returns', 'The screen goes black. Silence. Then a face lunges out of the dark, all teeth and eyes, and holds there. It wavers, and the fright melts into something shy. It asks, very quietly, to join your team.', [
    { label: 'Welcome it', success: { text: 'It has not forgotten the Labyrinth, or you.', effects: [canon('ghostReturn')] } },
    leave('It fades, and the dark lets go of the screen.'),
  ], { stop: 'event', tint: '#000000', effect: 'flicker', pokemon: final });
}

const out = { events };
writeFileSync(new URL('../src/data/eventsCanonSaffron.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`wrote ${events.length} Saffron events`);
