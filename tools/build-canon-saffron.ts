// Beta 0.6 workstream 18, Saffron City (CANON_SPACES_KANTO.md section 9): writes src/data/eventsCanonSaffron.json.
// Route 25, Fighting Tournament, Fighting Dojo, Copycat Girl, Silph Co. Lobby, Magnet Train and Sabrina's Labyrinth, as event rooms.
// Run: node tools/build-canon-saffron.ts   (the rules these use live in src/core/expansion/canonSaffron.ts)

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

// ---------- 9.3 Route 25 ----------
ev('r25', 'Route 25: The Horde', 'A horde of Angry Mankey spills onto the road and will not let you pass. Five of them, one after another.', [
  { label: 'Stand your ground', success: { text: 'The first three rush you together.', effects: [], battle: { kind: 'wild', species: ['mankey'], chain: 3, levelBonus: 1, win: [add('r25-breath')] } } },
], { canon: 'cs.kanto.saffron.route25', tint: '#6b4a3a' });
ev('r25-breath', 'Route 25: A Breather', 'Three down. The last two Mankey are working themselves into a rage behind the rocks.', [
  { label: 'Tend your team first', success: { text: 'You get a minute to patch everyone up.', effects: [{ kind: 'heal', share: 0.35 }, add('r25-fourth')] } },
  { label: 'Press on', success: { text: 'No time to lose.', effects: [add('r25-fourth')] } },
], { room: true, tint: '#6b4a3a' });
ev('r25-fourth', 'Route 25: The Fourth', 'The fourth Mankey screams and charges.', [
  { label: 'Meet it', success: { text: 'It goes down, and the last one steps out.', effects: [], battle: { kind: 'wild', species: ['mankey'], levelBonus: 1, win: [add('r25-wrath')] } } },
], { room: true, tint: '#6b4a3a' });
ev('r25-wrath', "Route 25: Mankey's Wrath", 'The fifth is no Mankey. A Primeape, wild with rage, uses Rage again and again.', [
  {
    label: 'Calm the Primeape down the hard way', success: {
      text: 'The horde falls quiet. One Mankey steps out of the grass and sets its jaw: it wants to come with you.', effects: [], battle: {
        kind: 'wild', species: ['primeape'], levelBonus: 2, foeMoves: ['rage'],
        win: [{ kind: 'join', species: ['mankey'], types: [], levelBonus: 0 }, { kind: 'teachMove', move: 'swords-dance', species: 'mankey', slot: 2 }, { kind: 'teachMove', move: 'mach-punch', species: 'mankey', slot: 3 }, flag('kanto-mankey'), canon('flawless'), add('tournament')],
      },
    },
  },
], { room: true, tint: '#6b4a3a' });

// ---------- 9.4 Fighting Tournament ----------
const entry = (species: string) => ({
  label: `Enter with ${species === 'mankey' ? 'Mankey' : 'Primeape'}`, requires: [{ kind: 'partySpecies', species }],
  success: { text: 'The sign-up sheet has thirty-two names. Yours goes at the bottom. Only your fighter steps onto the mat.', effects: [canon('solo', { species: ['mankey', 'primeape'] }), add('t1')] },
});
ev('tournament', 'Saffron Fighting Tournament', 'A banner over the dojo yard: THE SAFFRON FIGHTING TOURNAMENT. Thirty-two fighters, Fighting types only, one Pokémon each. The organizer eyes your Mankey.', [
  entry('mankey'), entry('primeape'), leave('You leave it for the next trainer.'),
], { canon: 'cs.kanto.saffron.tournament', room: true, tint: '#7a3b2e' });
const ROUNDS = [
  { n: 1, bracket: 'Round of 32', species: ['machop', 'mankey'], prize: 'muscle-band', name: 'Brawler' },
  { n: 2, bracket: 'Round of 16', species: ['meditite', 'timburr'], prize: 'protein', name: 'Black Belt' },
  { n: 3, bracket: 'Quarterfinal', species: ['hitmonlee', 'hitmonchan'], prize: 'focus-sash', name: 'Kickboxer' },
  { n: 4, bracket: 'Semifinal', species: ['machoke', 'poliwrath'], prize: 'black-belt', name: 'Semifinalist' },
];
for (const r of ROUNDS) {
  ev(`t${r.n}`, `Tournament: ${r.bracket}`, `${r.bracket}. One Pokémon each, matched to yours. If yours faints, you are out.`, [{
    label: 'Step into the ring', success: {
      text: `${r.bracket}: a fighter your size.`, effects: [], battle: {
        kind: 'trainer', name: r.name, size: 1, species: r.species, types: ['fighting'], pseudo: true, rule: { matchLead: true, bstMatch: true },
        win: [{ kind: 'item', id: r.prize, count: 1 }, { kind: 'heal', share: 0.4 }, add(`t${r.n + 1}`)], lose: [canon('unsolo')],
      },
    },
  }], { room: true, tint: '#7a3b2e' });
}
ev('t5', 'Tournament: The Final', 'The final. Across the mat stands the rival Mankey: the same kind as yours, the same level, and it wants the belt as much as you do.', [{
  label: 'Step into the ring', success: {
    text: 'The crowd chants for both of you.', effects: [], battle: {
      kind: 'trainer', name: 'Rival Fighter', size: 1, mirror: true, types: ['fighting'], pseudo: true, rule: { evolveMid: true },
      win: [canon('champion', { species: ['mankey', 'primeape'] }), flag('kanto-tournament-won'), canon('unsolo')], lose: [canon('unsolo')],
    },
  },
}], { room: true, tint: '#7a3b2e' });

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
