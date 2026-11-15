// Catalog Overhaul Pack: the Hideout. STORY_FAMILIES_13 A8 (the entry, the boss, the boss's last words) for all sixteen teams,
// and STORY_FAMILIES_18 SF131 (the infiltration rooms), SF132 (the Hideout keys) and SF133 (the Holding Pen).
// Each team's Hideout is a chain pseudo-stage (src/data/catalogOverhaul/pseudo/evil-story.json, written by _evil-story-sync.ts):
// the Warehouse Door, then one room per column picked by the player on a map drawn like a stage, the boss, the boss's last
// words, the Holding Pen and the Way Out. The shared rooms are written once with the team's words as tokens ({team}, {front},
// {grunt}, {lt}, {boss}) and read the region's own team with the `evil` condition's `has` / `lacks` marks.
import { $, any, ch, ev, fight, flag, flagIs, item, money, out, ptype, room, wild, HELD, RARE_HELD, TREASURE, type Json } from '../dsl.ts';
import { evil as story, foe, kind, node, rep } from './_evil-story-kit.ts';
import { TEAMS, type TeamStory } from './_evil-story-teams.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-story';

const say = (who: string, line: string): string => `${who}: "${line}"`;
const mark = (m: string): Json => story({ mark: m });
const has = (m: string, lacks?: string): Json => ({ kind: 'evil', has: m, ...(lacks ? { lacks } : {}) });
const pfoe = (rank: 'grunt' | 'specialist' | 'executive' | 'leader', name: string, size: number, win: Json[] = [], o: { lv?: number; chain?: number; ally?: string } = {}) => foe(rank, name, size, { pseudo: true, win, ...o });
const HIDEOUT = { group: 'Evil Teams', tint: '#161a22' };

/** SF13 A8: the stolen files open one door without a fight, a defector a second, and a quiet way in (a key, a change of guard, the Grunt from the back) a third. */
function passes(hide: number[], what: string): Json[] {
  return [
    { id: 'files', when: [has('files', 'files-door')], notice: `The badge numbers in your stolen files match the ones on this door.`, hide, addChoices: [ch('Use the files.', out(`You read the code off a shipping list, and ${what} opens without anyone looking up.`, mark('files-door')))] },
    { id: 'inside', when: [{ kind: 'evil', defector: true, lacks: 'inside-door' }], notice: `Your friend from inside said this one would be easy.`, hide, addChoices: [ch('Do it the way your friend said.', out(`It goes exactly as you were told. ${what[0]!.toUpperCase()}${what.slice(1)} is behind you before anyone thinks to check.`, mark('inside-door')))] },
    { id: 'quiet', when: [has('quiet', 'quiet-door')], notice: `Nobody is here. The way you came in, nobody was expecting you yet.`, hide, addChoices: [ch('Walk straight through.', out(`You walk through ${what} and nobody stops you.`, mark('quiet-door')))] },
  ];
}

// ---------- SF131. The infiltration rooms (shared by every Hideout) ----------
const ROOMS: Json[] = [
  {
    id: 'ps-evil-hideout-gate', name: 'The Warehouse Door', room: true, requires: [],
    intro: `Cold air spills from a {front} warehouse door that should be locked. Inside, machines hum, and somewhere further in, boots shuffle on concrete. This is {team}'s Hideout. Every step from here on is theirs.`,
    choices: [
      ch('Go in.', out(`You slip through the gap and let the door swing shut behind you. The dark smells of oil and wet stone.`)),
      ch('Wait for the change of guard. (a node)', out(`You wait in the rain until the night shift trudges out and the day shift hasn't trudged in yet. The first room ahead will be empty.`, ...node(), mark('quiet'))),
      ch('Use a key.', out(`The key turns as if it had been waiting for you. One room ahead will be no trouble at all.`, flag('hideout-key', -1), mark('quiet')), { requires: [flagIs('hideout-key')] }),
    ],
    remembers: [
      { id: 'lift', when: [flagIs('hideout-lift')], notice: `Your Lift Key fits the service lift by the door. It goes all the way down.`, hide: [2], addChoices: [ch('Ride the lift down.', out(`The lift drops for a long time and opens one door from {boss}'s.`, flag('hideout-lift', -1), room('ps-evil-hideout-d')))] },
      { id: 'quit', when: [{ kind: 'evil', stopped: 4 }], notice: `Two {grunt}s are coming out as you arrive, carrying a box of their things between them. One stops. "There's nothing left to guard." They walk off into the rain.`, hide: [], addChoices: [] },
    ],
  },
  {
    id: 'ps-evil-hideout-a', name: 'The Corridor', room: true, requires: [],
    intro: `Grey walls with the {team} logo stencilled every ten paces. A floor plan is pinned to a board by the stairs, curling at the corners, with coffee rings on it.`,
    choices: [
      ch('Read the map.', out(`You trace the corridors with a finger: the security room, the trap floor, the vault, and at the very centre, a door with {boss}'s name on it. The next three rooms have names now. You know what's coming.`, mark('map-read'), flag('intel'))),
      ch('Keep moving.', out(`No time for maps. You keep your shoulder to the wall and keep going.`)),
    ],
  },
  {
    id: 'ps-evil-hideout-b', name: 'The Guard', room: true, requires: [],
    intro: `A {grunt} at a desk, eating noodles out of the carton. He looks up, chopsticks frozen halfway to his mouth. "...Is it shift change already?"`,
    choices: [
      ch('Battle.', fight(`He knocks the carton over getting up.`, pfoe('grunt', '{grunt}', 2))),
      ch('Say yes.', out(`"Finally." He grabs his coat and goes, still chewing. He doesn't come back.`), { chance: 0.5, fail: fight(`"Finally." He grabs his coat and goes. Two rooms on, he comes back for his phone, sees you, and works it out.`, pfoe('grunt', '{grunt}', 2)) }),
    ],
    remembers: passes([0, 1], 'the guard post'),
  },
  {
    id: 'ps-evil-hideout-c', name: 'The Trap Floor', room: true, requires: [],
    intro: `A floor of spin tiles, wall to wall, the arrows on them scuffed nearly away by years of boots. Step on the wrong one and it throws you back where you started.`,
    choices: [
      ch('Read the pattern.', out(`Left, left, up, wait, right. You cross without a single spin.`), { check: 'intelligence', fail: out(`Left, up... no. The tile whirls you round and drops you at the start, dizzy. You do it again, slower. It costs you time.`, ...node()) }),
      ch('Send a Psychic-type.', out(`Your Psychic-type holds every tile still with its mind while you walk across.`), { requires: [ptype('psychic')] }),
    ],
  },
  {
    id: 'ps-evil-hideout-d', name: `The Lieutenant's Door`, room: true, requires: [],
    intro: `The last door before {boss}'s. {lt} is waiting in front of it, arms folded, as if they knew which way you'd come.`,
    choices: [
      ch('Battle.', fight(`"I told you there'd be a last time."`, pfoe('executive', '{lt}', 4))),
      ch('Why are you still here?', fight(`{lt} almost laughs. "Where else would I go? This is the only place anyone ever knew my name." They raise a Ball.`, pfoe('executive', '{lt}', 4))),
      ch('Your people are leaving you.', out(`{lt} looks past you, down the empty corridor, for a long moment. Then they step aside. "Go on, then. Finish it."`), { requires: [{ kind: 'evil', defector: true }] }),
    ],
    remembers: [
      { id: 'arrested', when: [has('lieutenant-arrested')], intro: `The last door before {boss}'s. The chair in front of it is empty. {lt} is in a cell in town, and nobody took their place.`, hide: [0, 1, 2], addChoices: [ch('Go through.', out(`Nobody stops you.`))] },
      { id: 'recruited', when: [has('lieutenant-recruited')], intro: `The last door before {boss}'s. {lt} goes ahead of you and puts their hand on it. "I know the code. I set it."`, hide: [0, 1, 2], addChoices: [ch('Go through together.', out(`The door opens. {lt} takes a breath, and walks through first.`))] },
      { id: 'free', when: [has('lieutenant-free')], intro: `The last door before {boss}'s. On the chair in front of it, a folded note: "Gone. Like you said. Good luck. Truly." It isn't signed. It doesn't need to be.`, hide: [0, 1, 2], addChoices: [ch('Go through.', out(`You put the note in your pocket and open the door.`))] },
    ],
  },
  {
    id: 'ps-evil-hideout-e', name: 'The Way Out', room: true, requires: [],
    intro: `Daylight, at the top of a long ramp. Behind you the Pokémon from the Holding Pen come up out of the dark in twos and threes, blinking, holding on to each other.`,
    choices: [ch('Lead them out.', out(`You walk them out into the open. Some of them run the second they feel grass. Some of them stay close to you until the very last moment. When you look back, the {front} sign over the door is hanging by one screw.`, ...kind(1)))],
    remembers: [{ id: 'seller', when: [flagIs('emblem-seller')], notice: `In the last cell by the ramp, a man in a long coat is sitting very still. The emblem seller. "You said you'd let me out." You did.`, hide: [], addChoices: [ch('Let him out too.', out(`You open the cell. He walks out with the Pokémon, blinking just like they do, and says nothing at all, which from him is a lot.`, ...kind(1)))] }],
  },
  {
    id: 'vt-laser-maze', name: 'The Laser Maze', room: true, requires: [],
    intro: `Red beams criss-cross the corridor at knee, waist and throat height, humming faintly. At the far end a vault door glows.`,
    choices: [
      ch('Time the gaps.', fight(`You almost make it. The last beam catches your heel, and an alarm goes off somewhere above. One {grunt} comes running.`, pfoe('grunt', '{grunt}', 2))),
      ch(`Use a mirror: a Steel-type's coat.`, out(`Your Steel-type stands in the first beam and bends it neatly into the wall. Every beam after it goes dark. You walk to the vault door at an ordinary pace.`), { requires: [ptype('steel')] }),
      ch('Go round. (a node)', out(`There's a maintenance crawlway that goes all the way round. It takes forever.`, ...node())),
    ],
    remembers: passes([0], 'the laser corridor'),
  },
  {
    id: 'vt-locked-chest', name: 'The Locked Chest', room: true, requires: [],
    intro: `An old iron-bound chest in an alcove, with a lock that has outlived three owners and means to outlive you.`,
    choices: [
      ch('Pick it.', out(`The lockpicks find the pins one by one. The lid comes up on something worth having.`, any(...RARE_HELD)), { requires: [flagIs('lockpicks')] }),
      ch('Break it with a Fighting-type.', out(`One blow and the lid caves in. Most of what was inside is crushed with it. You save what you can.`, any(...HELD)), { requires: [ptype('fighting')] }),
      ch('Leave it.', out(`Some things are better left shut.`)),
    ],
  },
  {
    id: 'vt-password-lock', name: 'The Password Lock', room: true, requires: [],
    intro: `A keypad by a steel door, and three notes taped above it in three different hands: "Where we began." "First letter, last letter." "Count the badges." Somebody in {team} is very bad at secrets.`,
    choices: [
      ch('Work out the code.', out(`Your start town's first and last letters, then your badge count. You type it, and the door slides open with a polite chime. You'll remember that.`, flag('password-learned')), { check: 'intelligence', fail: fight(`Wrong. Wrong again. The third time the keypad screams, and one {grunt} comes to see why.`, pfoe('grunt', '{grunt}', 2)) }),
    ],
    remembers: [{ id: 'learned', when: [flagIs('password-learned')], notice: `It's the same three notes. You already know the answer.`, hide: [0], addChoices: [ch('Type it in.', out(`The door slides open with the same polite chime.`))] }],
  },
  {
    id: 'vt-camera-swap', name: 'The Camera Room', room: true, requires: [],
    intro: `A wall of flickering monitors, every corridor in the building on one of them. Under the desk, a tape deck with a label in marker: "LOOP".`,
    choices: [
      ch('Put the loop on.', out(`You slot the tape in. On every screen, an empty corridor plays over and over. For the next two rooms nobody will see you.`, mark('quiet'), mark('quiet'))),
      ch('Smash the monitors.', fight(`The screens go dark in a shower of glass, and every guard in the building knows exactly where you are.`, pfoe('grunt', '{grunt}', 3, [], { chain: 2 }))),
    ],
  },
  {
    id: 'vt-vent-crawl', name: 'The Vent Crawl', room: true, requires: [],
    intro: `Three vents in the wall at ankle height. From the first, voices. From the second, the deep hum of machinery. From the third, the bright clink of coins being counted.`,
    choices: [
      ch('Follow the voices.', out(`You lie in the dust above {boss}'s office and hear the whole plan for the end: who stands where, what they'll use, what they're afraid of. When you face {boss}, you'll know what's coming.`, mark('climax-heard'), flag('intel'))),
      ch('Follow the machinery.', out(`The generator room. You find the big red switch and pull it. Every alarm in the building sighs and goes quiet.`, mark('quiet'))),
      ch('Follow the coins. (₽1,000)', out(`The team's cash box, on a desk, with nobody watching it. You take ₽1,000 and leave the rest for the police.`, $(1000))),
    ],
  },
  {
    id: 'vt-fake-gym-front', name: 'The Fake Gym', room: true, requires: [],
    intro: `It looks like an ordinary Gym, except the sign over the door is crooked and every trainer in it looks terrified. Behind the trophy case you can just see a stairwell going down.`,
    choices: [
      ch('Battle the trainers.', fight(`They battle you because they have to. Their hearts aren't in it.`, pfoe('grunt', 'Gym Trainers', 3))),
      ch('Ask them if they are all right.', out(`The youngest one starts crying. They're hostages, made to run a front for {team} while their families are watched. They show you the stairs and then they leave, all of them, out the front door into the light. Word of it gets around.`, rep(1))),
    ],
  },
  {
    id: 'vt-safehouse-raid', name: 'The Safehouse', room: true, requires: [],
    intro: `A shuttered house inside the base, room after room, and a squad of {grunt}s waiting in every one of them.`,
    choices: [
      ch('Room by room. (three battles)', fight(`Front room. Kitchen. Upstairs.`, pfoe('grunt', '{grunt}', 2, [], { chain: 3 }))),
      ch('Smoke them out with a Fire-type.', fight(`Smoke curls under every door, and the whole squad comes out coughing at once, all of them together.`, pfoe('grunt', '{grunt}', 4, [], { lv: 1 })), { requires: [ptype('fire')] }),
    ],
    remembers: passes([0], 'the safehouse'),
  },
  {
    id: 'vt-cargo-ship-ransack', name: 'The Cargo Ship', room: true, requires: [],
    intro: `The base opens onto a dock, and a freighter rides at anchor beside it. Waves crash over the rail as {team} members dive for the crates.`,
    choices: [
      ch('Board.', fight(`You go up the gangway into the middle of them.`, pfoe('grunt', '{grunt}', 3))),
      ch('Cut the anchor with a Water-type.', out(`Your Water-type dives and bites through the chain. The ship swings out on the tide, and drifts straight into the arms of the coastguard. Every crate on board is recovered.`, flag('freed-caged')), { requires: [ptype('water')] }),
    ],
  },
  {
    id: 'vt-prison-break', name: 'The Prison Break', room: true, requires: [],
    intro: `Cages along a cellar wall. A key hangs on a hook by the guard's chair. The guard is very much in the chair.`,
    choices: [
      ch('Take the key.', out(`You lift it off the hook while he's yawning. Every cage opens.`, mark('pen-open')), { check: 'speed', fail: fight(`He opens his eyes as your hand closes on it.`, pfoe('grunt', '{grunt}', 2, [mark('pen-open')])) }),
      ch('Battle the guard.', fight(`He's out of the chair in a second.`, pfoe('grunt', '{grunt}', 2, [mark('pen-open')]))),
      ch('Let a Ghost-type through the bars.', out(`Your Ghost-type drifts from cage to cage and comes back each time with a latch in its mouth. Every cage opens.`, mark('pen-open')), { requires: [ptype('ghost')] }),
    ],
  },
  // On the map, not in a Hideout: the lesson that makes the Locked Chest pickable, and the bounty on the region's lieutenant.
  {
    id: 'vt-lockpick-lesson', name: 'The Lockpick Lesson',
    intro: `A retired burglar is having tea on her porch, and she waves you over as if you were late. "Sit. Never know when you'll need it."`,
    choices: [
      ch('Learn. (a node)', out(`An hour, two pots of tea, and a lot of patience later, she gives you a roll of picks and a long look. "Only locks that deserve it."`, flag('lockpicks'), ...node())),
      ch('No, thanks.', out(`She shrugs and pours herself another cup. "Your loss, love."`)),
    ],
  },
  {
    id: 'vt-bounty-board', name: 'The Bounty Board', requires: [{ kind: 'evil', ends: ['none'], lacks: 'lt-gone' }],
    intro: `A notice board outside the Ranger station, layered with bounties. Pinned on top of all of them, newer than the rest: {lt}, of {team}. Reward ₽2,000.`,
    choices: [
      ch('Take the bounty.', out(`You take the poster down and fold it into your bag. The Ranger at the desk raises an eyebrow and writes your name in the ledger.`, flag('vt-bounty'))),
      ch('Leave it.', out(`You leave it pinned where it is.`)),
    ],
  },
  {
    id: 'vt-bounty-target', name: 'The Bounty Target', requires: [flagIs('vt-bounty'), { kind: 'evil', ends: ['none'], lacks: 'lt-gone' }],
    intro: `{lt} steps out of the shadow of a bridge, coat buttoned, ready to run. They've seen the poster too.`,
    choices: [
      ch('Battle.', fight(`"Two thousand. Is that all I'm worth?"`, foe('executive', '{lt}', 4, { win: [$(2000), flag('vt-bounty', -1)] }))),
      ch('Talk.', out(`You talk. They listen. In the end they walk to the Ranger station beside you, on their own feet. No reward, but they told you everything, and if you ever ask them to stand with you, they'll say yes.`, flag('vt-bounty', -1), mark('lt-asked')), { requires: [has('lt-asked')] }),
      ch('Let them go.', out(`You step aside. {lt} looks at you as they pass, and you can see them remembering it.`, flag('vt-bounty', -1), mark('lt-spared'))),
    ],
  },
];

// ---------- SF132. The Hideout keys (each opens one Hideout room for free) ----------
const KEY = flag('hideout-key');
const KEYS: Json[] = [
  {
    id: 'rocket-emblem-swap', name: 'The Emblem Seller',
    intro: `A man in a long coat falls into step beside you. "Psst. A Magma Emblem? A Galactic key? No questions asked." He has a look you've seen before: the look of someone who works for two sides and is tired of both.`,
    choices: [
      ch('Buy one. (₽1,500)', out(`He takes the money without counting it and presses a key into your hand. "One door. Any door. Don't tell them where you got it."`, $(-1500), KEY), { requires: [money(1500)] }),
      ch('Ask which side he is on.', out(`He stops walking. "Yours, if you let me." He sells it to you for half, ₽750, and asks one thing: when you get to the Hideout, let him out of it.`, $(-750), KEY, flag('emblem-seller')), { requires: [money(750)] }),
    ],
  },
  { id: 'basement-key-tunnel', name: 'Basement Key: Old Tunnels', intro: `Under the city, the old basement tunnels rumble with trains you can't see. Your Basement Key fits a rusted door at the end of one of them, and behind it the tunnel runs on, toward a Hideout's back door.`, choices: [ch('Go through.', out(`You walk the tunnel to its end. The back door is there, and now you can open it.`, KEY))] },
  {
    id: 'card-key-silph', name: 'Card Key: Company Doors', intro: `A company door clicks open at the touch of your Card Key. Inside, a crate of prototypes, and a staff passage that runs a long way under the city.`,
    choices: [ch('Take a prototype.', out(`You pocket the smallest one. It's an Up-Grade. The staff passage will get you through one Hideout door.`, item('up-grade'), KEY)), ch('Leave them.', out(`You leave the prototypes where they are and take only the passage.`, KEY))],
  },
  { id: 'galactic-key-hq', name: 'Galactic Key: The Warehouse', intro: `The warehouse door slides open for the Galactic Key with a sound like a sigh.`, choices: [ch('Go in.', out(`You walk straight past the first room as if you worked there. Nobody asks.`, KEY))] },
  { id: 'lift-key-hideout', name: 'Lift Key: The Vault Floor', intro: `The Lift Key fits a service lift that every map of the city leaves out. A button at the bottom has no number, only a painted R.`, choices: [ch('Ride down.', out(`You don't go down yet. But you know now: when you find the Hideout, this lift will take you one room from the boss.`, flag('hideout-lift')))] },
  {
    id: 'magma-emblem-hideout', name: 'Magma Emblem: The Volcano Base', intro: `The emblem opens a seam in the volcano wall. Hot air rolls out. Deep below, far below, something enormous is sleeping, and every breath it takes shakes the floor.`,
    choices: [
      ch('Go in quietly.', out(`You go in on your toes and close the seam behind you. Whatever is down there stays asleep, and it will stay asleep through all of it.`, KEY, flag('magma-quiet'))),
      ch('Go in loudly.', out(`You don't bother being careful. Far below, something huge turns over in its sleep. It is waking.`, KEY, flag('team-magma-climax-harder'), flag('sign-groudon'))),
    ],
  },
  { id: 'storage-key-room', name: 'Storage Key: The Warehouse', intro: `Boxes to the ceiling, and some of them are labelled with your name, in a careful hand.`, choices: [ch('Open them.', out(`Everything they took from you this run is here, packed and labelled like evidence. You take it all back.`, story({ pen: true })))] },
];

// ---------- SF13 A8 and SF133, per team ----------
const HARD: Record<string, { flag: string; notice: string; win?: Json[] }> = {
  aqua: { flag: 'team-aqua-legend-stirring', notice: `Behind the glass wall of the chamber the sea is moving wrong. Kyogre is half-awake, and the water is coming in.` },
  magma: { flag: 'team-magma-climax-harder', notice: `The floor is hot through your shoes. Under all of you, Groudon is waking up.` },
  marauders: { flag: 'team-marauders-engine', notice: `The Engine is finished, and it hums. A cable snakes from it to one of your Poké Balls, and that Ball won't open until you win.` },
  choir: { flag: 'team-choir-night', notice: `The prophecy is complete. It is night in here, a real night, and every shadow leans toward you.` },
  ironvein: { flag: 'team-ironvein-veinheart-chained', notice: `In the pit behind the Chairwoman's desk, Veinheart lies in chains, and every chain is humming.`, win: [flag('veinheart-freed')] },
};

function hideout(t: TeamStory): Json[] {
  const j = teamJson(t.id);
  const id = (x: string) => `evil-${t.id}-${x}`;
  const boss = t.boss;
  const ally = j.ranks.executive.species.at(-1)!;
  const hard = HARD[t.id];
  const bossWin = (extra: Json[] = []): Json[] => [story({ beat: true, end: 'defeated' }), $(4000), any(...TREASURE), ...extra, room(id('hideout-after'))];
  const bossFight = (o: { size?: number; lv?: number; ally?: boolean } = {}) => pfoe('leader', boss, o.size ?? 5, bossWin(hard?.win), { lv: o.lv ?? 2, ...(o.ally ? { ally } : {}) });
  const bossChoices = (o: { size?: number; lv?: number; ally?: boolean } = {}, lead = ''): Json[] => [
    ch('Battle.', fight(`${lead}${boss} doesn't say anything else. They don't need to.`, bossFight(o))),
    ch('Why?', fight(`${lead}${say(boss, t.why)} Then the first Ball opens.`, bossFight(o))),
    ch('Your people are leaving you.', fight(`${lead}${boss} looks round the room, at the empty chairs, the open doors, the desk where ${t.lt.name} used to sit. ${say(boss, t.bossRealise)} One of their Pokémon isn't there to answer the call.`, bossFight({ ...o, size: (o.size ?? 5) - 1 })), { requires: [{ kind: 'evil', defector: true, has: 'lt-out' }] }),
  ];
  const withLt = `${t.lt.name} steps up beside you without a word and sends out their partner. `;
  const variants: Json[] = [];
  if (hard) {
    variants.push({ id: 'hard-ally', when: [flagIs(hard.flag), has('lieutenant-recruited')], notice: hard.notice, hide: [0, 1, 2], addChoices: bossChoices({ size: 6, lv: 4, ally: true }, withLt) });
    variants.push({ id: 'hard', when: [flagIs(hard.flag)], notice: hard.notice, hide: [0, 1, 2], addChoices: bossChoices({ size: 6, lv: 4 }) });
  }
  variants.push({ id: 'ally', when: [has('lieutenant-recruited')], hide: [0, 1, 2], addChoices: bossChoices({ ally: true }, withLt) });

  const entry: Json = {
    id: id('hideout'),
    name: `${t.name} Hideout`,
    intro: `You found it. ${t.lair} ${boss} is inside. Whatever happens in there, this is where ${t.name}'s story in this region ends.`,
    choices: [
      ch('Go in.', out(`You go in. Behind you, out across the region, whatever ${t.name} still had running goes ahead on its date.`, story({ door: true }), room('ps-evil-hideout-gate'))),
      ch('Not yet.', out(`You mark it on your map and walk on. It will still be here. So will they.`)),
    ],
    remembers: [
      { id: 'grunt', when: [has('grunt-inside')], notice: `By the door, the young Grunt from the back of ${t.lt.name}'s squad is on watch. They see you, look away very deliberately, and leave the side door on the latch.`, hide: [0], addChoices: [ch('Go in by the side door.', out(`You go in by the side door. Nobody saw. The first room ahead will be quiet.`, story({ door: true }), mark('quiet'), room('ps-evil-hideout-gate')))] },
    ],
  };
  const turnIn = out(`Officer Jenny's car comes down the ramp with its lights on and no siren. ${boss} holds out their wrists before she asks. As they're led past you, they don't look at you at all.`, mark('boss-jailed'));
  const leave = out(`${boss} picks up a coat from the back of the chair and walks out the way you came in, past the empty desks. They don't hurry. Somewhere far from here, you suspect, someone will offer them a new uniform.`, mark('boss-gone'));
  const after = ev(id('hideout-after'), `${boss}, Beaten`, 'Evil Teams', { room: true, cast: [j.ranks.leader.sprite], tint: j.color },
    `${boss} recalls the last of their team and stands in the wreck of their plan with the empty Ball in their hand. For a long moment it is very quiet. ${say(boss, t.bossLast)}`,
    [
      ch('Turn yourself in.', turnIn),
      ch('Leave the region.', leave),
      ch('What will you do now?', out(`${boss} thinks about it, honestly, which you didn't expect. ${say(boss, t.whatNow)}`, room(id('hideout-now')))),
    ]);
  const now = ev(id('hideout-now'), `What ${boss} Does Now`, 'Evil Teams', { room: true, cast: [j.ranks.leader.sprite], tint: j.color },
    `${boss} waits for you to decide what that means.`,
    [ch('Turn yourself in.', turnIn), ch('Leave the region.', leave)]);
  const bossRoom = ev(id('hideout-boss'), boss, 'Evil Teams', { room: true, cast: [j.ranks.leader.sprite], tint: j.color, effect: 'shake' },
    `At the heart of the base, past the last door, ${boss} is waiting for you. They have been waiting a while. ${say(boss, t.bossOpen)}`,
    bossChoices());
  bossRoom.remembers = variants.slice(0, 3);

  // SF133. The Holding Pen.
  const freed = [story({ pen: true }), mark('pen-open'), ...kind(1)];
  const open = fight(`You open every cage. They come out slowly, then all at once, and the ones that were taken from you this run go straight to you. The rest head for the door and home. One of them stays, though, looking up at you, and won't leave until you've given it a chance.`, wild({ lv: 0 }), ...freed);
  const pen: Json = {
    id: id('rescue'),
    name: `${t.name} Holding Pen`,
    room: true,
    requires: [],
    intro: `Behind the ${t.front} warehouse, stolen Pokémon sit in cages, waiting to be shipped. The pen keeper, a tired ${j.ranks.grunt.name}, steps in front of them with a bucket of feed still in her hand. ${say('Pen keeper', `Don't. I just feed them. Don't.`)} In the nearest cage, a Pokémon pushes its paw through the bars, reaching for your team.`,
    choices: [
      ch('Open every cage.', open),
      ch('Ask the keeper to help.', fight(`"No," she says, and it costs her something to say it. "They'll know it was me." She puts the bucket down and reaches for a Ball.`, pfoe('grunt', 'Pen keeper', 2, freed))),
      ch('Battle the keeper.', fight(`She doesn't want to. She does it anyway.`, pfoe('grunt', 'Pen keeper', 2, freed))),
    ],
  };
  const helped = ch('Ask the keeper to help.', out(`She looks at you for a long time. "...They bite the boss. They never bite me." She hands you the keys and takes off her jacket with the ${t.name} badge on it and leaves it folded on the bucket. She helps you open every cage, and then she walks out with them.`, mark('keeper-quit'), ...freed));
  const penVariants: Json[] = [];
  if (t.id === 'plasma') penVariants.push({ id: 'yard', when: [flagIs('plasma-yard-stopped')], notice: `The pen is half empty. The keeper sees you looking. "You sent most of them to a Center. I heard."` });
  if (t.id === 'yell') penVariants.push({ id: 'morpeko', when: [{ kind: 'evil', ends: ['defeated', 'exposed', 'allied'] }], notice: `In the cage nearest the door, chewing a scarf, is a Morpeko with a tag on its collar: Marnie's.`, hide: [0], addChoices: [ch('Open every cage, and take Morpeko home to Marnie.', out(`You open every cage, and carry Morpeko out in your arms. Marnie is waiting at the top of the ramp. She takes Morpeko and holds it a long time. "They're not my fans," she says at last, very quietly. "Not any more."`, ...freed))] });
  if (t.id === 'star') penVariants.push({ id: 'class', when: [{ kind: 'evil', ends: ['defeated', 'exposed', 'allied'] }], intro: `It isn't a warehouse. It's a classroom, with the desks pushed back and cages where the chairs should be. The "stolen" Pokémon are the club's own, taken off them by a teacher and locked up here as punishment. The keeper is a girl from the club, and she has been crying.`, notice: `Ortega is standing in the doorway behind you. When the first cage opens, the Star boss starts to cry too.` });
  penVariants.push({ id: 'helps', when: [{ kind: 'evil', stopped: 2 }], hide: [1], addChoices: [helped] });
  penVariants.push({ id: 'kit', when: [flagIs('shelf-kit-address')], notice: `On one cage there's a label in pencil, the same hand as the files: KIT ARDEN. The Pokémon inside it lifts its head at the name.` });
  penVariants.push({ id: 'kindness', when: [flagIs('kind-total', 10)], notice: `One of them knows your lead. A kindness you did on some road, a long time ago. It comes to the bars first.` });
  pen.remembers = penVariants.slice(0, 3);
  void HIDEOUT;
  return [entry, bossRoom, after, now, pen];
}

export const EVENTS: Json[] = [...ROOMS, ...KEYS, ...TEAMS.flatMap(hideout)];
// SF131: the old "A Suspicious Warehouse" stop is now the Warehouse Door of every Hideout.
export const REMOVE: string[] = ['ev-hidden-hideout'];
