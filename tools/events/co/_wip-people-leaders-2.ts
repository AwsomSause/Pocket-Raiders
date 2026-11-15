// @ts-nocheck: work in progress (stopped 2026-11-15 when Kice capped running threads at five); rename to people-*.ts to build.
// Catalog Overhaul Pack, people: PAST GYM LEADERS GL3 to GL10 (QUESTLINES_PAST_CHAMPIONS_AND_LEADERS.md lines 340 to 602).
// GL5 and GL6 follow the rewrite in QUESTLINES_DEEPENED_1.md (lines 351 to 438); GL6's last stage is STORY_FAMILIES_8.md B14 "The Coin Hums".
// GL3 builds the three wings only: the vault (`mr-ancient-gym-vault`) is another file's, and reads `forgotten-badge` (3 opens it).
// Catalog ids: STORY_FAMILIES_8.md Part A. Pattern: people-roster-2.ts. Build: npm run co:build -- people-leaders-2
import { again, ch, fight, flag, flagAgo, flagAt, item, join, out, relic, room, type Json } from '../dsl.ts';
import { CATEGORY as CAT, is, moment, not, scene, spar, variant } from './_people.ts';

export const CATEGORY = CAT;

/** A fight with a `turnLimit`: a win in more turns than `turns` pays `slowWin` instead of `win`. */
const timed = (battle: Json, turns: number, slowWin: Json[]): Json => ({ ...battle, rule: { turnLimit: turns }, slowWin });
/** A side scene of a questline (opened with `room(id)` only). */
const side = (id: string, name: string, intro: string, choices: Json[], o: { remembers?: Json[]; requires?: Json[]; pokemon?: string } = {}): Json =>
  scene(id, name, { room: true, rarity: 'uncommon', requires: o.requires ?? [], ...(o.remembers ? { remembers: o.remembers } : {}), ...(o.pokemon ? { pokemon: o.pokemon } : {}) }, intro, choices);
/** Stage n of a three-stage questline: needs the stage before set at least one region ago, and not this stage yet. */
const stageGate = (base: string, n: 2 | 3): Json[] => [flagAgo(`${base}-s${n - 1}`, 1), not(`${base}-s${n}`)];
const stageDone = (base: string, n: 1 | 2 | 3): Json => flagAt(`${base}-s${n}`);

// ---------- GL3. The First Gym (Delve: Ancient Gym Remains), the three wings ----------
const WINGS = {
  ember: { id: 'mr-ancient-gym-a', name: 'Ember', type: 'fire', keeper: 'ninetales', prompt: 'gauge-hold', other: ['tide', 'leaf'] },
  tide: { id: 'mr-ancient-gym-b', name: 'Tide', type: 'water', keeper: 'lapras', prompt: 'tilt-drag', other: ['ember', 'leaf'] },
  leaf: { id: 'mr-ancient-gym-c', name: 'Leaf', type: 'grass', keeper: 'venusaur', prompt: 'climb-rhythm', other: ['ember', 'tide'] },
} as const;
type Wing = keyof typeof WINGS;
const ENTRANCE =
  'A crumbling Gym in the hills, half swallowed by heather, its roof long gone to the sky. Three wings open off a cracked central hall: Ember, Tide, Leaf. Above the broken arch an inscription, worn almost smooth by a thousand years of weather: "The first Gym. Before badges were made of metal." ' +
  'In each wing, a keeper Pokémon still guards it. It has not been told the Gym is closed. ';
/** The wing's badge. The vault counts three (`forgotten-badge`); each badge is a third of the set bonus (+5% to the Pokémon of its type). */
const ancientBadge = (w: Wing): Json[] => [
  flag('forgotten-badge'),
  relic(`first-gym-${w}`, `Ancient ${WINGS[w].name} Badge`, [{ kind: 'damageMultiplier', type: WINGS[w].type, value: 1.05 }]),
  moment(`You took the ancient ${WINGS[w].name} Badge from the first Gym`),
];
const told = (w: Wing): string => `first-gym-told-${w}`;

function wing(w: Wing, o: { intro: string; battle: string; tell: string; pass: string; fail: string; follow: string }): Json {
  const W = WINGS[w];
  const tell = (text: string, ...more: Json[]): Json => ch('"Tell it the Gym is closed."', out(text, flag(told(w)), ...ancientBadge(w), ...more));
  return scene(W.id, `The First Gym: ${W.name} Wing`, {
    pokemon: W.keeper,
    remembers: [
      // "If 'Tell it the Gym is closed.' for all three": telling the last keeper sends all three out with the player.
      variant('keepers-follow', [is(told(W.other[0])), is(told(W.other[1]))], {
        notice: 'Behind you, in the central hall, two old keepers you already spoke to are lying in the dust, watching you go in. They have not left.',
        hide: [1],
        add: [tell(o.follow, flag('first-gym-keepers-moved'), moment('The three keepers of the first Gym followed you out to a living Gym', 70))],
      }),
    ],
  }, ENTRANCE + o.intro, [
    ch('"Battle the keeper."', fight(o.battle, spar(`The ${W.name} Keeper`, { team: [W.keeper], size: 1, lv: 1, win: ancientBadge(w), lose: [again(W.id)] }))),
    tell(o.tell),
    ch('"Ask to be tested."', out(o.pass, ...ancientBadge(w)), { prompt: { id: W.prompt, needs: 'good' }, fail: out(o.fail, ...ancientBadge(w)) }),
  ]);
}

const firstGym: Json[] = [
  wing('ember', {
    intro: 'The Ember wing is black with old soot. A cold brazier stands on a dais at the far end, and under the dust in front of it something glows, faint and red, like an ember that never went out. Curled around the dais is a Ninetales, its fur gone silver at the tips with age. It lifts its head as you come in, and every one of its tails rises with it.',
    battle: 'The Ninetales stands, slowly, the way the very old stand, and then it is not slow at all. Fire pours off its tails in a ring around you both. It fights like a Leader\'s ace from an age before Leaders: no tricks, only heat and patience. Win, and the badge under the dust is yours to take; lose, and it lies back down to wait for the next challenger.',
    tell: 'You tell it, gently, that the Gym is closed; that nobody has come here to battle for a very long time. The Ninetales does not believe you. It stares, ears flat. Then it looks around, at the open sky where the roof was and the heather in the doorway, and something in it goes quiet. It lies down with its chin on its paws and lets you lift the glowing badge from the dust.',
    pass: 'The keeper rises and nudges the cold brazier with its nose: the original test. You coax a spark from the old flint, feed it, shield it, breathe on it, hold it just right until the brazier roars alight for the first time in a thousand years. The Ninetales watches the fire for a long moment, then steps aside from the badge.',
    fail: 'The brazier smokes and sputters and will not catch, however carefully you feed it. You try until your fingers sting. At last the Ninetales leans down and breathes on it itself, and the fire takes. It looks at you, not unkindly, and steps aside from the badge: you tried the test the way it was meant to be tried.',
    follow: 'You tell the Ninetales the Gym is closed. It does not believe you, and then it looks around and lies down. But when you carry the glowing badge out into the central hall, it gets up again and follows. So do the other two keepers, one after the other, out into the light. They walk with you all the way down the hill to the nearest Gym, and when you look back from the road, all three are settling in by its door.',
  }),
  wing('tide', {
    intro: 'The Tide wing was a pool once. Now it is a dry stone basin with a crust of white salt at the rim, and at the bottom, under a skin of dust, something glows a pale sea-blue. A Lapras lies beside the empty pool, its shell scarred and mossy, singing very softly to nobody. It stops when it sees you.',
    battle: 'The Lapras drags itself to the edge of the empty pool and calls up water out of nothing, out of the air and the old stone, until the basin is half full and rolling. It fights like a tide: patient, heavy, always coming back. Win, and the badge at the bottom of the pool is yours to take; lose, and the water drains away and it lies down to wait again.',
    tell: 'You tell it the Gym is closed. The Lapras does not believe you; it sings a low, offended note. Then it looks around at the dry pool, the salt crust, the swallows nesting where the challengers once sat. It stops singing. It lays its long neck down along the stone and lets you climb down into the basin for the glowing badge.',
    pass: 'The Lapras looks at the empty pool, then at you: the original test is to fill it. You haul water from the stream outside, bucket after bucket, tipping each channel just so until the old stone runnels carry it in and the pool fills to the rim. The Lapras slides in with a sigh you feel in your chest, and nudges the glowing badge to the surface for you.',
    fail: 'The channels are cracked and the water keeps escaping into the heather, however you tip them. By the time your arms give out the pool is barely knee-deep. The Lapras slides in anyway and floats there in the shallows, happy, and nudges the glowing badge up to you. The test, it seems, was in carrying the water at all.',
    follow: 'You tell the Lapras the Gym is closed. It does not believe you, and then it looks around and lays its neck down on the stone. But when you carry the badge out into the central hall it heaves itself up and follows, and the other two keepers fall in beside it. All three come with you down the hill to the nearest Gym, where the Lapras slides into the training pool as if it has come home.',
  }),
  wing('leaf', {
    intro: 'The Leaf wing has gone back to the forest. Roots have split the floor; a great dead vine climbs the back wall to a stone ledge, and on the ledge, under dust and fallen leaves, something glows a soft green. At the foot of the wall sits a Venusaur so old that real moss grows on its flower, and real ferns along its back.',
    battle: 'The Venusaur rises and the whole wing rises with it: roots heaving up through the floor, vines whipping down from the walls. It battles like a forest that has decided you are in the way. Win, and the badge on the ledge is yours to take; lose, and the roots settle back and it waits again.',
    tell: 'You tell it the Gym is closed. The Venusaur does not believe you; its vines twitch. Then it looks around at the broken floor and the trees growing through it, at the sky, at you. Slowly it lowers itself to the ground with a creak like a falling oak, and a single vine reaches up and brings the glowing badge down into your hands.',
    pass: 'The Venusaur sets a single seed in the cracked floor at the foot of the dead vine: the original test is to grow it. You water it and coax it and climb beside it, guiding each new shoot up the wall, until the fresh vine reaches the ledge and curls round the glowing badge. The Venusaur rumbles, deep and pleased, as the vine lowers the badge into your hands.',
    fail: 'The new shoot climbs, falters, and slips back down the wall, however you guide it. You try again, and again. In the end the Venusaur sends up one of its own vines to finish the climb, and it brings the glowing badge down to you. It does not seem disappointed; it seems glad somebody tried.',
    follow: 'You tell the Venusaur the Gym is closed. It does not believe you, and then it looks around and lies down with a creak. But when you carry the badge out into the central hall it rises again and follows, and so do the other two keepers. All three walk with you down the hill to the nearest Gym, and the Venusaur settles in its garden and does not move again for a week.',
  }),
];

// ---------- GL4. The Abandoned Ace (catalog: r159-wild-gym-leader-pokemon) ----------
const ACE = 'r159-wild-gym-leader-pokemon';
const aceBattle = (win: Json[]): Json => ({ ...spar('The Old Leader\'s Machamp', { team: ['machamp'], size: 1, lv: 2, win, lose: [again(ACE)] }), spritePokemon: 'machamp' });
const aceJoin = (): Json[] => [join({ species: ['machamp'] }), moment('The old Leader\'s Machamp joined you', 75)];
const abandonedAce: Json[] = [
  scene(ACE, 'The Abandoned Ace', {},
    'A clearing in the woods, ringed with trampled grass like the edge of a battlefield. A Machamp stands alone in the middle of it, feet planted, all four arms folded. It is not wild, not quite; it holds itself as if it belonged to a Gym Leader once. It looks at you the way a Leader looks at a challenger, and it waits for you to send something out. ' +
    'A hiker resting on a stump nearby lowers his flask. Hiker: "That\'s the old Leader\'s. He retired and couldn\'t keep it in a flat." He shakes his head. Hiker: "It\'s been out here for two years waiting for a challenger."',
    [
      ch('"Challenge it."', fight('You step into the ring of trampled grass, and the Machamp unfolds its arms. It fights a Gym battle exactly by the old rules, one Pokémon, no switching its stance, every blow placed like a lesson. When it is over, win or lose, it bows.',
        aceBattle([flag('wild-ace-beaten'), moment('The old Leader\'s Machamp gave you the badge it had carried for two years', 70), room(`${ACE}-after`)]))),
      ch('"Find its Leader."', out('You ask the hiker where the old Leader went. He scratches his beard and points down the valley toward town. The Machamp watches you go, and does not move from its ring.', room(`${ACE}-search`))),
      ch('"Leave."', out('You leave it in its clearing. When you look back from the treeline it is still standing there, arms folded, waiting for someone worth waiting for. It keeps waiting.', again(ACE))),
    ]),
  side(`${ACE}-after`, 'The Abandoned Ace: The Badge',
    'The Machamp reaches into the old belt still buckled round its waist and holds something out in one huge palm: a badge, scratched and dulled, that it has been carrying for two years for whoever finally beat it. You take it. The Machamp folds its arms again, but differently now, like something finished. The hiker is on his feet. Hiker: "Well. Somebody ought to tell the old man."',
    [
      ch('"Find its Leader."', out('You set off down the valley toward town. Behind you, heavy footsteps: the Machamp has decided to come too.', room(`${ACE}-search`))),
      ch('"Leave."', out('You pocket the badge and nod to the Machamp. It nods back, and sits down in the middle of its ring for the first time in two years.')),
    ]),
  side(`${ACE}-search`, 'The Abandoned Ace: The Old Leader',
    'The town at the bottom of the valley is small and quiet. The Gym has a new Leader now and a new sign. You ask after the old one at the Gym, at the post office, at the café, until a woman behind the counter puts down her cloth. "He\'s up at Elm Lodge. The retirement home. He doesn\'t get many visitors."',
    [
      ch('"Take me there."', out('She draws you a map on a napkin. Elm Lodge is up a gravel drive, all net curtains and geraniums.', room(`${ACE}-home`))),
      ch('"Does he ever talk about his Machamp?"', out('"Every day," she says. "To anyone who\'ll listen." She draws you a map on a napkin, up the hill to Elm Lodge.', room(`${ACE}-home`))),
    ]),
  side(`${ACE}-home`, 'The Abandoned Ace: Elm Lodge',
    'Elm Lodge smells of tea and furniture polish. The old Leader sits in a chair by the window in a cardigan, a Gym jacket folded over the arm. He is bigger than the chair. When you say the word Machamp he grips the armrests. Old Leader: "It\'s still out there? In the clearing?" He looks at his hands. Old Leader: "They don\'t allow anything bigger than a cat here. Will you take it on? Please."',
    [
      ch('"I\'ll take it on."', out('He writes a note in careful capitals, MACHAMP: GO WITH THIS ONE, and asks you to read it out loud in the clearing. You do. The Machamp listens to every word, looks down the valley toward town for a long time, and then comes with you.', ...aceJoin())),
      ch('"It\'s still waiting for you."', out('The old Leader turns to the window and does not answer. You leave the Machamp in its clearing, still waiting.')),
    ],
    {
      remembers: [
        // "If both (challenge then find): the Leader sees it again. It joins the player at his request."
        variant('both', [is('wild-ace-beaten')], {
          notice: 'The Machamp followed you all the way here. It is standing in the gravel drive outside, too big for the doorway, looking up at the window.',
          hide: [0, 1],
          add: [ch('"I\'ll take it on."', out('The old Leader sees it through the window and is out of the chair faster than anyone thought he could move. He goes out on the gravel in his slippers. The Machamp kneels, and he puts both hands on its head, and neither of them says anything for a long while. Then he looks up at you. Old Leader: "Take it on. For me. Please." The Machamp stands and comes to your side.', ...aceJoin()))],
        }),
      ],
    }),
];

// ---------- GL5. The Two-Gym Feud (QUESTLINES_DEEPENED_1.md GL5, three stages) ----------
const FEUD = 'ovc-two-gym-feud';
const LEANDER = 'Mr. Leander Roake';
const DELPHINA = 'Miss Delphina Roake-Marsh';
const feudBadge = (who: 'roake' | 'marsh', text: string): Json =>
  ch(who === 'roake' ? '"Mr. Roake\'s badge."' : '"Miss Roake-Marsh\'s badge."', out(text, flag(`feud-badge-${who}`), stageDone(FEUD, 1), moment(who === 'roake' ? 'Mr. Roake gave you his Gym\'s badge, and the other Gym shut its doors' : 'Miss Roake-Marsh gave you her Gym\'s badge, and the other Gym shut its doors')));
const twoGymFeud: Json[] = [
  scene(`${FEUD}-s1`, 'The Two-Gym Feud', { requires: [] },
    'One square. Two buildings, face to face across a dry fountain: one red brick with a chimney that smokes on still days, one blue-tiled with a gutter that never stops dripping. Two signs, hand-painted, each a little bigger than the last time someone repainted the other: FOUNDED BY ELSPETH. FOUNDED BY ELSPETH\'S BETTER. ' +
    'Two Leaders meet in the middle the moment they see you carrying a badge case, as if they have been watching from their windows. Mr. Leander Roake, Fire, in a waistcoat with a scorch on it: "My grandmother founded this Gym." Miss Delphina Roake-Marsh, Water, in a raincoat she clearly wears indoors: "Mine founded it first, and yours copied the sign." ' +
    'They turn to you together. Both: "You\'re a challenger. You decide." They have the same chin. Nobody mentions the chin.',
    [
      ch('"Battle both."', fight('Two battles, back to back, and the whole square comes out to watch. Mr. Roake goes first, sleeves rolled, his Fire-types filling the square with heat. He grins through the whole thing. Whoever lasts more turns against you gives the badge; Miss Roake-Marsh is already waiting at the fountain with her Poké Balls.',
        timed(spar(LEANDER, { types: ['fire'], size: 3, lv: 1, win: [room(`${FEUD}-s1-marsh`)], lose: [flag('feud-roake-lasted'), room(`${FEUD}-s1-marsh`)] }), 5, [flag('feud-roake-lasted'), room(`${FEUD}-s1-marsh`)]))),
      ch('"Look at the records."', out('Both Leaders stare at you as if you have suggested reading the sky. Miss Roake-Marsh: "Records?" Mr. Roake: "What records?" Nobody in the square seems to know, so you decide to find out. The town hall is shut today; you will come back to it.', flag('feud-asked-records'), stageDone(FEUD, 1))),
      // Greyed out in stage 1 ("You'd need a reason."): the reason is the records, found in stage 2.
      ch('"Merge the Gyms."', out('You hold up the photograph from the town hall. Both Leaders fall silent, and look at it, and then at each other. Nobody says anything about the chin. That can wait for the fountain.', stageDone(FEUD, 1)), { requires: [is('feud-records')] }),
    ]),
  side(`${FEUD}-s1-marsh`, 'The Two-Gym Feud: The Second Battle',
    'The square is steaming. Mr. Roake sits on the fountain\'s edge mopping his forehead with a handkerchief, very pleased with himself either way. Miss Roake-Marsh steps up, unbuttons the raincoat, and does not take it off. Miss Roake-Marsh: "My turn. Count the turns, somebody."',
    [
      ch('"Ready."', fight('Her Water-types come out in a wave, and the steam in the square becomes a downpour. She is precise where he was loud, and she counts every turn under her breath.',
        timed(spar(DELPHINA, { types: ['water'], size: 3, lv: 1, win: [room(`${FEUD}-s1-verdict`)], lose: [flag('feud-marsh-lasted'), room(`${FEUD}-s1-verdict`)] }), 5, [flag('feud-marsh-lasted'), room(`${FEUD}-s1-verdict`)]))),
    ]),
  side(`${FEUD}-s1-verdict`, 'The Two-Gym Feud: Whoever Lasted',
    'The baker has been keeping score on a chalkboard by the fountain. He holds it up. Whoever lasted more turns gives the badge. The two columns are the same length. Both Leaders hold out a badge at the same moment, and both glare at the other\'s hand.',
    [
      feudBadge('roake', 'You take Mr. Roake\'s. He beams, and Miss Roake-Marsh turns on her heel, marches into the blue-tiled Gym and bolts the door. It will stay shut for a stage. By evening the town has taken sides in the bakery, and the baker has started selling two kinds of bun.'),
      feudBadge('marsh', 'You take Miss Roake-Marsh\'s. She says "Thank you" very correctly, and Mr. Roake stalks into the red-brick Gym and slams the door so hard the chimney coughs. It will stay shut for a stage. By evening the town has taken sides in the bakery, and the baker has started selling two kinds of bun.'),
    ],
    {
      remembers: [
        variant('roake', [is('feud-roake-lasted'), not('feud-marsh-lasted')], {
          intro: 'The baker has been keeping score on a chalkboard by the fountain. He holds it up: Mr. Roake lasted longer. Miss Roake-Marsh goes very pale and very still.',
          hide: [1],
        }),
        variant('marsh', [is('feud-marsh-lasted'), not('feud-roake-lasted')], {
          intro: 'The baker has been keeping score on a chalkboard by the fountain. He holds it up: Miss Roake-Marsh lasted longer. Mr. Roake goes red to the ears.',
          hide: [0],
        }),
      ],
    }),
  scene(`${FEUD}-s2`, 'The Two-Gym Feud: The Records', {
    requires: stageGate(FEUD, 2),
    remembers: [
      variant('roake-won', [is('feud-badge-roake')], { notice: 'Across the square, Miss Roake-Marsh\'s blue door is still bolted, and there is a queue at the bakery for the blue buns.' }),
      variant('marsh-won', [is('feud-badge-marsh')], { notice: 'Across the square, Mr. Roake\'s red door is still shut, and there is a queue at the bakery for the red buns.' }),
      variant('asked', [is('feud-asked-records')], { notice: 'The town hall is open today, as you hoped. Both Leaders are pretending not to watch you walk in.' }),
    ],
  },
    'The town hall is cold and smells of old paper. The clerk, Mr. Enoch Pilbeam, has to climb a ladder to reach the right shelf, and blows a small cloud of dust off the box. Mr. Pilbeam: "Founding papers? Nobody\'s asked in sixty years. They\'d rather shout." ' +
    'Inside, the deed: thick paper gone brown at the folds, and at the bottom, two signatures side by side, in two different hands, the same date.',
    [
      ch('"Whose signatures?"', out('Mr. Pilbeam peers over his glasses. "Elspeth. And Marguerite. There\'s more in the box, if you want it." There is: something flat, wrapped in tissue.', room(`${FEUD}-s2-photograph`))),
      ch('"Is there anything else?"', out('Mr. Pilbeam reaches into the bottom of the box and lifts out something flat, wrapped in tissue, very carefully. "This," he says. "Nobody\'s ever asked for this either."', room(`${FEUD}-s2-photograph`))),
    ]),
  side(`${FEUD}-s2-photograph`, 'The Two-Gym Feud: The Photograph',
    'A photograph: two young women on the steps of one building, each with a hand on the same spade. One is soaked to the skin. One is singed at the cuffs. Both are laughing so hard they are blurred. ' +
    'On the back, in faded ink: "Elspeth and Marguerite. First day. We\'ll never agree on the sign." Mr. Pilbeam reads it over your shoulder, and takes his glasses off, and puts them back on.',
    [
      ch('"Can I borrow this?"', out('Mr. Pilbeam wraps it back in its tissue and puts it in your hands. "Bring it back," he says. "Or don\'t. It\'s done more good in the box than it will on a shelf. Which is to say, none." Both grandmothers founded it together.', flag('feud-records'), stageDone(FEUD, 2))),
      ch('"They need to see this."', out('"Sixty years too late, but yes," says Mr. Pilbeam, and wraps it in tissue for you. You walk out of the town hall holding the photograph against your chest like something that could break: proof that both grandmothers founded it together.', flag('feud-records'), stageDone(FEUD, 2))),
    ]),
  scene(`${FEUD}-s3`, 'The Two-Gym Feud: The Help', { requires: [...stageGate(FEUD, 3), is('feud-records')] },
    'The square again, the dry fountain between the two Gyms. You lay the photograph on the fountain\'s edge, and wait. One door opens, then the other. Both Leaders come out slowly and look at it, side by side, closer than they have stood in years. ' +
    'Mr. Roake: "That\'s... she never said there were two." Miss Roake-Marsh: "Mine said yours was \'the help.\'" Mr. Roake: "Mine said yours was \'a flood with opinions.\'" ' +
    'A pause. The fountain drips. Then, both, not quite together: "...That does sound like her."',
    [
      ch('"Merge the Gyms."', fight('They look at each other, and at the photograph, and at you. One Gym, two Leaders, and from now on Double Battles only. You are the first challenger. Fire and Water come out side by side, and the whole square disappears in steam. When it clears, the two of them are laughing exactly the way their grandmothers are laughing in the photograph. They hand you the badge together: two halves, one red, one blue, soldered down the middle.',
        spar('Roake and Roake-Marsh', { format: 'doubles', types: ['fire', 'water'], size: 4, lv: 1, win: [moment('You won the first Double Battle at the merged Roake Gym')], lose: [moment('The merged Roake Gym beat you in its first Double Battle')] }),
        flag('feud-merged'), stageDone(FEUD, 3), moment('The Roake Gyms merged; they gave you a badge soldered from two halves', 75)), { requires: [is('feud-records')] }),
      ch('"Leave them to it."', out('You leave the photograph on the fountain and walk away. They keep two Gyms and one photograph, which moves between them weekly: a week in the red-brick Gym on the mantelpiece, a week in the blue-tiled one by the pool. Neither of them ever says whose turn it is. Neither of them is ever late.', stageDone(FEUD, 3))),
    ]),
];

// ---------- GL6. The Borrowed Badge (QUESTLINES_DEEPENED_1.md GL6; stage 3 is STORY_FAMILIES_8.md B14) ----------
const BB = 'ovc-the-borrowed-badge';
// TODO(engine): a badge lent and given back. The engine cannot take a badge away; the lending is told and kept in `borrowed-badge-lent`.
const lend = (text: string, ...more: Json[]): Json => ch('"Lend it."', out(text, flag('borrowed-badge-lent'), stageDone(BB, 1), ...more));
const hospitalBattle = (): Json => spar('Mr. Theodric Aldane', { team: ['rhydon'], size: 1, win: [moment('You battled old Mr. Aldane from his hospital bed, and won', 75)], lose: [moment('Old Mr. Aldane beat you from his hospital bed', 75)] });
const borrowedBadge: Json[] = [
  scene(`${BB}-s1`, 'The Borrowed Badge', { requires: [] },
    'The road bends past the last trainer before the Gym. Someone is waiting at the bend, a lanky boy of about sixteen in a coat a size too big, scuffing the gravel. He asks before he can lose his nerve: could he borrow a badge, just for one battle? "Just so they\'ll let me in." ' +
    'Jem Aldane does not meet your eye. Jem: "Any one. The oldest you\'ve got. I\'ll bring it back." He winces at himself. Jem: "I know how that sounds."',
    [
      lend('You open your badge case and hold out the oldest one. Jem looks at it as if you have handed him something alive. He wraps it in a clean handkerchief, then in another, and puts it inside his coat, over his heart. "I\'ll bring it back," he says again, and this time it does not sound like a lie at all. The badge is lent, not given; it cannot be lost for good.'),
      ch('"Why?"', out('Jem looks at the gravel for a long time. Then it comes out all at once. Jem: "My dad\'s a Leader. Was. He\'s in the hospital at the next town. He doesn\'t know me, most days. He knows badges." ' +
        'Jem: "He\'ll hold one and tell you who made it and what year and who lost it. They took his when he retired." His voice cracks. Jem: "I just want him to hold one."',
        flag('borrowed-badge-asked'), room(`${BB}-s1-why`))),
      ch('"No."', out('Jem nods quickly, as if he expected nothing else, and goes away down the road with his hands deep in his pockets. He does not look back.', flag('borrowed-badge-refused'), stageDone(BB, 1))),
    ]),
  side(`${BB}-s1-why`, 'The Borrowed Badge: Why',
    'Jem stands there with his hands shoved in his pockets, waiting for you to laugh, or leave. Behind him, the road goes on toward the next town and the hospital.',
    [
      lend('You open your badge case and give him the oldest one. Jem holds it in both hands and does not say anything for a moment, because he cannot. Then he wraps it in a clean handkerchief and tucks it inside his coat. The badge is lent, not given; it cannot be lost for good.'),
      ch('"No."', out('Jem nods, and swallows, and says it is all right, it was a stupid idea. He walks away down the road toward the next town with his shoulders up round his ears.', flag('borrowed-badge-refused'), stageDone(BB, 1))),
    ]),
  scene(`${BB}-s2`, 'The Borrowed Badge: A Stage Later', {
    requires: stageGate(BB, 2),
    remembers: [
      variant('lent-after-why', [is('borrowed-badge-lent'), is('borrowed-badge-asked')], {
        intro: 'The bend before the Gym again, and Jem is waiting, your badge in a clean handkerchief held out in both hands like an offering. He has not slept much, but he is smiling. Jem: "He held it an hour. He said, \'Boulder. Poor solder. That\'ll be a \'94.\'" He searches your face. Jem: "Was he right?" ' +
          'He was. You turn the badge over, and there, under your thumb, is the rough little seam of poor solder you had never noticed. Jem: "He wants to meet you. Will you come? To the hospital?"',
        hide: [0],
        add: [
          ch('"I\'ll come."', out('Jem lets out a breath he must have been holding since the last stage, and hands your badge back. He walks you to the next town himself, talking the whole way about his dad: the Gym, the Rhydon, the year they nearly won the league.', flag('borrowed-badge-back'), stageDone(BB, 2), room(`${BB}-hospital`))),
        ],
      }),
      variant('refused', [is('borrowed-badge-refused')], {
        intro: 'The bend before the Gym again, and Jem is there anyway, alone, turning something over and over in his fingers: a badge cut out of a tin lid, the edges filed down, a shape scratched into the middle with a nail. He holds it up so you can see. ' +
          'Jem: "I\'m going to try this. It\'s rubbish. He\'ll know." His chin comes up. Jem: "I\'m going to try it."',
        hide: [0],
        add: [
          lend('You open your badge case without a word and hold out the oldest one. Jem stares at it, then at the tin badge, then at you. He puts the tin one in his pocket and the real one inside his coat, over his heart, and he runs, actually runs, toward the next town. It will come back to you; you can tell from the way he ran.', flag('borrowed-badge-back'), stageDone(BB, 2)),
          ch('"No."', out('Jem nods. He walks off toward the hospital with the tin badge held tight in his fist, to try anyway.', stageDone(BB, 2))),
        ],
      }),
    ],
  },
    'The bend before the Gym again, the last stretch of road before the doors. A stage ago you lent a badge to a boy called Jem Aldane without asking why. You wait by the signpost a while, watching the road from the next town, and wonder whether he meant it.',
    [
      ch('Wait at the bend.', out('Jem comes jogging up the road, red in the face, and puts your badge back in your hand still wrapped in its clean handkerchief. Tucked in with it: a Sitrus Berry and a note in careful writing. "Thank you. He held it all afternoon. — J." He is gone again before you can say anything.', item('sitrus-berry'), flag('borrowed-badge-back'), stageDone(BB, 2)),
        { chance: 0.75, fail: out('Jem does not come. Nobody comes. The note on the signpost is a tradesman\'s, not his. Later, a stallholder lets slip that a badge like yours went across a counter at the Black Market, and tells you where; it can\'t be lost for good, only found again.', flag('honest-trusted-badly'), flag('borrowed-badge-at-market'), room('black-market'), stageDone(BB, 2)) }),
    ]),
  side(`${BB}-hospital`, 'The Borrowed Badge: The Hospital',
    'A ward with a window full of sky. An old man propped on three pillows, a badge in his hand, turning it, turning it, so the light runs round its edge. He looks up at you, and his eyes are perfectly clear. ' +
    'Mr. Theodric Aldane: "You\'re the one it belongs to. I can tell. You stand like you\'ve carried it." He lowers his voice. Mr. Aldane: "I\'d give a great deal for one more. Battle, I mean." ' +
    'Mr. Aldane: "I\'ve a Pokémon under the bed. They don\'t know. Don\'t tell the sister." Under the bed, between the slippers and a stack of old league programmes: an old Rhydon\'s nose.',
    [
      ch('"Battle."', fight('The Rhydon rolls out from under the bed with a groan of bedsprings, and the whole ward holds its breath. One Pokémon, from a bed. Mr. Aldane calls every move a second before yours lands. He is superb. When it is over, win or lose, he sinks back into his pillows. Mr. Aldane: "There. Best of the year. Best of several." ' +
        'He looks at Jem, hovering by the door. Mr. Aldane: "...You\'ve got your mother\'s way of hovering. Sit down, boy." Jem sits down. He has been standing since the first stage. Then the old man reaches into his bedside drawer and gives you his badge case: empty, eight slots, the velvet worn through at each.',
        hospitalBattle(), flag('borrowed-badge-case'), moment('Old Mr. Aldane gave you his badge case, the velvet worn through at every slot', 75))),
      ch('"Don\'t tell the sister."', fight('You pull the curtain round the bed and keep one eye on the corridor. The Rhydon rolls out with a groan of bedsprings. One Pokémon, from a bed, and Mr. Aldane calls every move a second before yours lands. Afterwards, win or lose: Mr. Aldane: "There. Best of the year. Best of several." ' +
        'He looks at Jem by the door. Mr. Aldane: "...You\'ve got your mother\'s way of hovering. Sit down, boy." Jem sits, for the first time since the first stage. The old man gives you his empty badge case, eight slots, the velvet worn through at each.',
        hospitalBattle(), flag('borrowed-badge-case'), moment('Old Mr. Aldane gave you his badge case, the velvet worn through at every slot', 75))),
    ], { pokemon: 'rhydon' }),
  // STORY_FAMILIES_8.md B14 "The Coin Hums".
  scene(`${BB}-s3`, 'The Coin Hums', {
    requires: [...stageGate(BB, 3), is('borrowed-badge-back')],
    remembers: [
      variant('has-case', [is('borrowed-badge-case')], {
        hide: [1],
        add: [ch('"Return it to the old Leader."', out('You go back to the ward. Mr. Aldane holds the coin up to his ear, listens, and laughs, a big rusty laugh that brings the sister running. He holds out his hand for the badge case he already gave you, presses the coin into the velvet of the first slot where it always sat, and gives the case back to you. Now it is complete.', moment('Old Mr. Aldane set his humming coin back into his badge case, and gave it to you', 70), stageDone(BB, 3)))],
      }),
    ],
  },
    'The badge Jem gave back has been riding in your case ever since. Tonight, by the fire, you notice it is heavier than it should be: there is a coin taped to its back, an old, worn coin, and it is humming, very faintly, like a held note. ' +
    'Folded under the tape, a note in Jem\'s careful writing: "Dad said to give you this. It was on his first badge case. He said it hums when someone\'s about to need help."',
    [
      // TODO(new item): the Hum Coin (key item: hums before a Lost and Found or rescue node within two nodes). Flag until the item exists.
      ch('"Keep it."', out('You peel the tape away and close your hand round the coin. It hums against your palm, then goes quiet, as if it has said what it needed to. The Hum Coin is yours: it will hum before help is needed, a little way ahead on the road.', flag('borrowed-badge-hum-coin'), moment('You kept old Mr. Aldane\'s Hum Coin', 65), stageDone(BB, 3))),
      ch('"Return it to the old Leader."', out('You walk back to the hospital. The old Leader, propped on his pillows, holds the coin up to the window, and listens, and laughs, a big rusty laugh that brings the sister running. He will not take it back. He gives you his badge case instead: empty, eight slots, the velvet worn through at each, and the coin pressed into the first slot.', flag('borrowed-badge-case'), moment('Old Mr. Aldane gave you his badge case, with the humming coin in its first slot', 75), stageDone(BB, 3))),
      ch('"Listen to it."', out('You hold the coin up to your ear. The hum leans, like a compass needle, toward the hills off the road. You follow it.', room(`${BB}-s3-rescue`))),
    ]),
  side(`${BB}-s3-rescue`, 'The Coin Hums: Someone Needs Help',
    'The hum grows louder with every step, until it stops on the edge of a steep gully. Down at the bottom, a young Bidoof has got itself wedged between two rocks with the stream rising round its feet. It is too frightened to cry. The coin goes silent in your hand.',
    [
      ch('"Climb down."', out('You scramble down the bank, wedge your shoulder against the rock and heave until the Bidoof pops free. It shakes itself, squeaks once, and paddles away downstream. You climb back up wet to the knees, and the coin in your pocket is warm.', room(`${BB}-s3-again`))),
      ch('"Send a Pokémon down."', out('Your lead goes down the bank in three bounds, braces against the rock and shoves until the Bidoof pops free. It squeaks at both of you and paddles away downstream. The coin in your pocket is warm.', room(`${BB}-s3-again`))),
    ], { pokemon: 'bidoof' }),
  side(`${BB}-s3-again`, 'The Coin Hums: The Choice Again',
    'Back on the road, you take the coin out again. It is quiet now, and warm, and it looks like nothing at all: an old coin from an old man\'s first badge case.',
    [
      ch('"Keep it."', out('You put it away in your pocket where you can feel it. The Hum Coin is yours: it will hum before help is needed, a little way ahead on the road.', flag('borrowed-badge-hum-coin'), moment('You kept old Mr. Aldane\'s Hum Coin', 65), stageDone(BB, 3))),
      ch('"Return it to the old Leader."', out('You walk back to the hospital and tell the old Leader about the Bidoof in the gully. He holds the coin to his ear and laughs, a big rusty laugh. He will not take it back. He gives you his badge case instead, eight empty slots, the velvet worn through at each, with the coin pressed into the first.', flag('borrowed-badge-case'), moment('Old Mr. Aldane gave you his badge case, with the humming coin in its first slot', 75), stageDone(BB, 3))),
    ], {
      remembers: [
        variant('has-case', [is('borrowed-badge-case')], {
          hide: [1],
          add: [ch('"Return it to the old Leader."', out('You walk back to the hospital and tell the old Leader about the Bidoof in the gully. He listens to the coin and laughs, then holds out his hand for the badge case he already gave you, presses the coin into the velvet of the first slot, and gives it back. Now it is complete.', moment('Old Mr. Aldane set his humming coin back into his badge case, and gave it to you', 70), stageDone(BB, 3)))],
        }),
      ],
    }),
];

// ---------- GL7. The Stolen Badge (three stages; the clues are rooms of stage 1, the scene with Sorrel opens straight from stage 2) ----------
const SB = 'ovc-stolen-badge';
const pellThanks = (): Json[] => [item('cell-battery'), moment('Pell got his Volt Badge back', 60)];
const immaBattle = (win: Json[], lose: Json[]): Json => spar('Imma', { team: ['elekid'], size: 1, win, lose });
const stolenBadge: Json[] = [
  scene(`${SB}-s1`, 'The Stolen Badge', { requires: [] },
    'A town square at midday, pigeons, a fountain with a chipped stone Pikachu in the middle. A young trainer sits on the fountain\'s edge, sobbing into his sleeve, an empty badge case open on his knees. ' +
    'Pell: "I earned it this morning. The Volt Badge. I put it down to tie my shoe." He holds up the empty case as if you might not believe him. Pell: "Somebody took it. I saw a hood. Small. Fast." ' +
    'Footsteps: a broad man in a Gym jacket, with the grey, tired face of someone who has not slept properly in weeks. Gym Leader Sorrel: "Third one this month. I can\'t keep giving out badges twice."',
    [
      ch('"I\'ll find it."', out('Pell looks up at you through his fingers. Sorrel looks at you too, longer, then nods. Sorrel: "Behind the Gym is where they go." You start there.', flag('badge-hunt'), room(`${SB}-s1-print`))),
      ch('"Report it to the Jenny."', out('You walk Pell to the station. Officer Jenny writes it all down, the hood, the shoe, the time, and promises she will have it solved inside two stages. She does. The thief is caught and named in the Region Report, and Pell gets his badge back by post.', flag('badge-reported'), ...pellThanks())),
      ch('"Not my business."', out('You walk on. Behind you, Pell closes the empty badge case very slowly. By the end of the day he has given up training altogether, and he will not be on the road this run.', flag('badge-ignored'))),
    ]),
  side(`${SB}-s1-print`, 'The Stolen Badge: The First Clue',
    'Behind the Gym the ground is soft from last night\'s rain. In the mud by the back fence: a child\'s shoe print, light and quick, the toe dug in deep as if whoever made it was running. Then another. Then a third, at the gap in the fence.',
    [
      ch('"Follow the prints."', out('The prints run through the gap and out across the waste ground, and stop at the gate of a scrapyard. From somewhere inside, a crackle like static.', room(`${SB}-s1-scrapyard`))),
      ch('"Measure one."', out('You crouch and set your hand beside the print. It is barely longer than your palm. A child. You follow the trail through the fence to a scrapyard gate, and from inside comes a crackle like static.', room(`${SB}-s1-scrapyard`))),
    ]),
  side(`${SB}-s1-scrapyard`, 'The Stolen Badge: The Second Clue',
    'A scrapyard, all rusted cars and coils of wire. On a pile of old washing machines, a wild Elekid is playing, sparking at a tin can and laughing. Tied round its arm is a ribbon: a badge ribbon, Volt yellow. It is friendly, and it has clearly been trained; when you say "sit" it sits.',
    [
      ch('"Play with it."', out('You toss the tin can and the Elekid zaps it out of the air, delighted, then trots off between the cars, looking back to see if you are coming. You are. It leads you out the back of the yard, across a garden, to a tree.', room(`${SB}-s1-treehouse`))),
      ch('"Follow it home."', out('You hang back and let the Elekid wander off when it gets bored. It goes straight home, the way trained Pokémon do: out the back of the scrapyard, over a wall, across a garden, to a big old tree.', room(`${SB}-s1-treehouse`))),
    ], { pokemon: 'elekid' }),
  side(`${SB}-s1-treehouse`, 'The Stolen Badge: The Third Clue',
    'A treehouse in an oak behind a house you recognise: Sorrel\'s own house. Inside, among comics and a sleeping bag, three badges in a jam jar, and a note in thick crayon capitals: "WHEN SOMEONE COMES FOR THESE, THEY HAVE TO FIGHT ME."',
    [
      ch('"Wait for the thief."', out('You sit in the treehouse with the jar in your lap until dusk. Nobody comes; the thief must have seen you climb up. But you know whose house this is now, and whoever wrote that note wanted to be found. Next time, they will be waiting.', stageDone(SB, 1))),
      ch('"Leave a note back."', out('You tear a page from a comic and write on the back: "I CAME. I\'LL FIGHT YOU." You leave it in the jar with the badges. Next time, the thief will be waiting for you.', stageDone(SB, 1))),
    ]),
  scene(`${SB}-s2`, 'The Stolen Badge: The Thief', { requires: [...stageGate(SB, 2), is('badge-hunt')], pokemon: 'elekid' },
    'The treehouse again, and this time someone is in it: a girl of eleven in an oversized hood, arms folded, an Elekid on her shoulder with a Volt-yellow ribbon round its arm. Sorrel\'s daughter. Imma: "Dad gives badges to anyone. Not to me. He says I\'m \'not ready.\'" ' +
    'Her voice wobbles and she makes it stop. Imma: "He won\'t even battle me." She pushes the jam jar of badges across the floor toward you. Imma: "So I made people come and get them. From me."',
    [
      ch('"Give them back."', out('Imma hands the jar over, sulking, and climbs down without a word. Sorrel grounds her for a month. The badges are returned to their owners, and Pell holds his Volt Badge up to the sun and does not stop grinning for an hour. He presses a Cell Battery into your hand.', flag('badge-returned'), ...pellThanks())),
      ch('"Challenge her."', fight('Imma\'s whole face changes. She is down the ladder before you are, and her Elekid is on the grass sparking, and for the first time she looks exactly like her father. She loses or she wins, and either way she glows. Afterwards she gives back the badges without being asked, and Pell gives you a Cell Battery.',
        immaBattle([moment('You battled Imma and her Elekid under the treehouse')], [moment('Imma\'s Elekid beat you under the treehouse')]), flag('badge-challenged'), ...pellThanks())),
      ch('"Take her to her father."', out('Imma goes white. But she comes down the ladder, and walks beside you across the garden to the back door, with the jam jar in both hands.', flag('badge-father'), room(`${SB}-s3`))),
    ]),
  scene(`${SB}-s3`, 'The Stolen Badge: Father and Daughter', { room: true, requires: [is('badge-father')], pokemon: 'elekid' },
    'Sorrel\'s kitchen. He sees the jam jar of badges, and then his daughter holding it, and he sits down very slowly at the table. Sorrel: "Imma. Why." Imma puts the jar down. Her chin is shaking. Imma: "You never battled me. Not once."',
    [
      ch('"Battle her, Sorrel."', out('They go out into the garden and you referee, standing between the washing line and the apple tree. Sorrel holds nothing back. His Pokémon is twice the size of her Elekid and he does not go easy for a second, and she does not ask him to. She loses. He kneels on the grass and pins a badge to her hood anyway. "For the fight, not the win." ' +
        'The badges go back to their owners. Pell sends a Cell Battery. And Sorrel presses a TM into your hand from his own Leader\'s stock, without a word, because he cannot quite speak.', flag('badge-sorrel-battled'), ...pellThanks(), item('tm-electric'))),
      ch('"Let me battle her first."', fight('You take Imma out into the garden first, and Sorrel stands at the back door with his arms folded, watching. She loses or she wins, and either way she glows. When it is over, Sorrel walks out onto the grass. Sorrel: "You don\'t fight like someone who isn\'t ready." He offers her a real Gym apprenticeship. The badges go home, and Pell sends a Cell Battery.',
        immaBattle([moment('You battled Imma while her father watched')], [moment('Imma beat you while her father watched')]), flag('badge-challenged'), flag('badge-apprentice'), ...pellThanks())),
      ch('"Stay out of it."', out('You step back to the door. They argue: about the badges, about her mother, about everything; it goes round and round and comes to nothing. There is no resolution. A week later, the stolen badges come back to their owners by post, and so does a Cell Battery from Pell.', ...pellThanks())),
    ]),
];

// ---------- GL8. The Rebel Gym (Damian, a later chapter; three stages) ----------
const RG = 'ovc-rebel-gym';
// The doc names no type for Damian's one-type rule; Fire is a judgment call (see the report).
const damian = (lv: number, win: Json[], lose: Json[]): Json => spar('Damian', { types: ['fire'], size: 4, lv, win, lose });
const rebelS1 = (text: string): Json => ch('"Battle."', fight(text, damian(1, [moment('You beat Damian at his Rebel Gym')], [moment('Damian\'s Rebel Gym beat you, fair and square')]), flag('rebel-battled'), stageDone(RG, 1)));
const rebelApproval = (text: string): Json => ch('"Help get it approved."', out(text, flag('rebel-approval'), stageDone(RG, 1)));
const rebelGym: Json[] = [
  scene(`${RG}-s1`, 'The Rebel Gym', { requires: [] },
    'A small building on the edge of town with a hand-painted sign so big it hangs off both sides: THE REBEL GYM. ONE TYPE ONLY. Inside, real pillars, a polished floor, bunting. A young man in a cape bursts out of the door before you can knock. ' +
    'Damian: "It\'s me! From the barn! Look, a real Gym!" He spreads his arms at all of it. Then, a little lower: Damian: "The League hasn\'t approved it yet. But look at the sign."',
    [
      rebelS1('Damian sweeps the cape back and sends out his first Pokémon with a flourish. Then he battles, and the flourish stops mattering: his one-type team is genuinely good now, every one of them trained with care, the gaps in its coverage thought about. When it is over he is grinning so hard his face must hurt.'),
      rebelApproval('Damian grabs your hand in both of his and shakes it. Damian: "An inspector! We need an inspector!" He sends a letter to the League that afternoon, in three colours of ink. An inspector will visit, and your battle will be the test.'),
      ch('"One type? Really?"', out('Damian draws himself up under the cape. Damian: "I\'m specialising. Real Leaders specialise." He says it like a man who has practised saying it in the mirror, and means it anyway.', room(`${RG}-s1-really`))),
    ]),
  side(`${RG}-s1-really`, 'The Rebel Gym: Specialising',
    'Damian is still standing very straight, waiting to see what you will say next. Behind him, someone has painted the one type on every pillar, slightly unevenly.',
    [
      rebelS1('Damian whoops and sends out his first Pokémon. His one-type team is genuinely good now: he battles like someone who has finally picked a thing and stayed with it.'),
      rebelApproval('Damian: "You\'ll help? Really?" He writes to the League that afternoon. An inspector will visit, and your battle will be the test.'),
    ]),
  scene(`${RG}-s2`, 'The Rebel Gym: The Second Challenge', {
    requires: stageGate(RG, 2),
    remembers: [
      variant('inspector', [is('rebel-approval')], {
        intro: 'The Rebel Gym, swept and polished within an inch of its life. A man from the League sits on a folding chair by the pillars with a clipboard on his knee, writing something down about the bunting. Damian is sweating through the cape. Damian: "He\'s here. The inspector. Your battle\'s the test. No pressure."',
        hide: [0, 1],
        add: [
          ch('"Let\'s show him."', fight('Damian squares up across the polished floor. The inspector clicks his pen. It is the best battle Damian has ever fought, and you can see the moment the inspector stops writing and just watches. Win, and the League approves the Gym on the spot; lose, and the inspector says it was very close and he will be back.',
            damian(1, [flag('rebel-approved'), moment('Your battle got Damian\'s Rebel Gym approved by the League', 70)], [moment('The League inspector watched Damian beat you, and called it very close')]), stageDone(RG, 2))),
        ],
      }),
    ],
  },
    'The Rebel Gym again, and Damian has added a second sign under the first: SECOND CHALLENGE. HARDER. He has been training since you last came. Damian: "You beat me once. Do it again and I\'ll know it wasn\'t luck. Either way."',
    [
      ch('"Again."', fight('Damian\'s team comes out sharper than last time, and he does not waste a single turn on showing off. It is a real Leader\'s second challenge.', damian(2, [moment('You beat Damian\'s second challenge')], [moment('Damian\'s second challenge beat you')]), stageDone(RG, 2))),
      ch('"Next time."', out('Damian: "Next time, then! It\'ll be harder!" He waves you off with the cape.', again(`${RG}-s2`))),
    ]),
  scene(`${RG}-s3`, 'The Rebel Gym: The Rebel Badge', {
    requires: stageGate(RG, 3),
    remembers: [variant('approved', [is('rebel-approved')], { notice: 'There is a new plaque by the door, small and brass and very official: the League\'s seal. Damian polishes it with his sleeve every time he walks past.' })],
  },
    'Damian meets you at the door of the Rebel Gym holding a small box in both hands like it might bite. Inside, on a square of red velvet he has clearly cut from his own cape: a badge, his own design, a little lopsided. Damian: "The Rebel Badge. The first one. It\'s yours." He swallows. Damian: "It counts. I don\'t care who says it doesn\'t."',
    [
      // TODO(engine): "The Rebel Badge (counts as a badge)": no effect adds a badge. Kept in `rebel-badge`.
      ch('"Pin it on."', out('Damian pins it on your jacket himself, with great care and slightly shaking hands, then steps back to look at it. Damian: "There. Now there\'s two of us who think it\'s real." It counts as a badge.', flag('rebel-badge'), moment('Damian gave you the first Rebel Badge', 70), stageDone(RG, 3))),
    ]),
];

// ---------- GL9. The Championship That Wasn't (three stages: Harrow, the bracket, the final) ----------
const CW = 'ovc-the-championship-that-wasnt';
const leader = (name: string, species: string, lv: number, win: Json[], lose: Json[]): Json => spar(name, { team: [species], size: 1, lv, win, lose });
const championship: Json[] = [
  scene(`${CW}-s1`, 'The Championship That Wasn\'t', { requires: [], pokemon: 'pidgey' },
    'A faded banner sags over the square between two lampposts, its letters bleached to the colour of weak tea: GRAND LEADERS\' CHAMPIONSHIP. The date on it is fifty years ago. Under it, on a bench, an old man in a flat cap is feeding a crowd of Pidgey from a paper bag. ' +
    'Harrow: "Cancelled. The year of the flood. Eight Leaders had trained a whole year for it." He tosses a handful of crumbs. Harrow: "I was going to referee. Had a new whistle." ' +
    'He looks up at the banner a long time. Harrow: "They\'re all still alive, you know. Just. You could hold it."',
    [
      ch('"Hold it."', out('Harrow drops the paper bag. The Pidgey do not complain. He takes your hand and shakes it and keeps shaking it.', flag('gl9-held'), room(`${CW}-s1-setup`))),
      ch('"Ask the Leaders first."', out('Harrow nods slowly. Harrow: "Fair. They\'re old. They might say no." He writes eight addresses on the back of the paper bag; you start with the three nearest.', flag('gl9-asked'), room(`${CW}-s1-visits`))),
      ch('"Leave it."', out('You leave Harrow to his Pidgey. The banner comes down at the end of the region, folded by a council worker who never looks at what it says.')),
    ]),
  side(`${CW}-s1-setup`, 'The Championship That Wasn\'t: Setting Up',
    'The first job is the square. The old ring is still there under fifty years of moss and chewing gum, if you know where to look, and Harrow does.',
    [
      ch('"Scrub the ring."', out('You spend the afternoon on your knees with a scrubbing brush, and by dusk the old white lines are showing through, crooked and proud.', room(`${CW}-s1-setup-2`))),
      ch('"Mend the banner."', out('You climb a ladder and stitch the torn corner of the banner, and re-paint the date in fresh letters underneath: THIS YEAR.', room(`${CW}-s1-setup-2`))),
    ]),
  side(`${CW}-s1-setup-2`, 'The Championship That Wasn\'t: Invitations',
    'The second job is the Leaders. Eight letters, handwritten by Harrow at his kitchen table, one at a time, with his tongue between his teeth. He makes you read each one back to him.',
    [
      ch('"Deliver them by hand."', out('Eight doors, eight old faces, eight long silences while they read. Every one of them says yes. Harrow takes a whistle out of his top pocket, still in its box after fifty years, and blows it once. The bracket begins next region.', stageDone(CW, 1))),
      ch('"Post them."', out('You post them together, and by the end of the week eight replies have come back, all yes, some in very shaky handwriting. Harrow takes a whistle out of his top pocket, still in its box, and blows it once. The bracket begins next region.', stageDone(CW, 1))),
    ]),
  side(`${CW}-s1-visits`, 'The Championship That Wasn\'t: Asking First',
    'Three of the eight, the ones Harrow could find. Brask, in a bungalow full of rocks, says yes before you have finished asking. Ilse, in a flat full of plants, says yes and goes to find her speech. ' +
    'The third, Ondine, will not open the door past the chain. Ondine: "I don\'t want to lose to myself in my head again." She has been losing that match for fifty years.',
    [
      ch('"Play anyway."', out('You sit on her doorstep and talk through the gap in the door for an hour: about the flood, the match she never played, how a head is a bad place to keep a fight. At last the chain comes off. Ondine: "...One match." The bracket begins next region.', flag('gl9-ondine'), stageDone(CW, 1))),
      ch('"Then don\'t."', out('You leave her be. The chain stays on. Two out of three say yes, and Harrow finds the other five himself. The bracket begins next region.', stageDone(CW, 1))),
    ]),
  scene(`${CW}-s2`, 'The Championship That Wasn\'t: The Quarter-Final', {
    requires: stageGate(CW, 2), pokemon: 'golem',
    remembers: [
      variant('ondine', [is('gl9-asked'), is('gl9-ondine')], { notice: 'On the far side of the ring, Ondine plays her first-round match, the one she has lost in her head for fifty years. She wins it. She stands very still afterwards with her hand over her mouth, and then she looks across the square and finds you.' }),
      variant('asked', [is('gl9-asked')], { notice: 'Ondine sits in the front row, not playing, her handbag held on her knees. She watches every match very closely.' }),
      variant('held', [is('gl9-held')], { notice: 'The lines you scrubbed are bright white in the morning sun. Harrow keeps touching the whistle on its string round his neck.' }),
    ],
  },
    'The square is full: chairs, flasks, folding stools, grandchildren on shoulders. Eight retired Leaders, all in their seventies or eighties, each with one Pokémon from that year, or the nearest thing to it. You fight three of them: quarter, semi, final. The rest fight each other in the background. ' +
    'Harrow blows the whistle. Your first: Leader Brask, Rock, leaning on a stick, a Golem at his side. Brask: "My Golem\'s grandson. Same stubbornness."',
    [
      ch('"Quarter-final."', fight('Brask\'s Golem plants itself in the middle of the ring and will not be moved, exactly as stubborn as promised. Brask cheers it on louder than anyone in the crowd. Win, and you go through to the semi-final; lose, and the bracket goes on without you, and you watch it from the front row.',
        leader('Leader Brask', 'golem', 1, [room(`${CW}-s2-semi`)], [flag('gl9-out'), room(`${CW}-s2-semi`)]))),
    ]),
  side(`${CW}-s2-semi`, 'The Championship That Wasn\'t: The Semi-Final',
    'Semi-final. Leader Ilse, Ice, steps into the ring with a folded sheet of paper sticking out of her cardigan pocket and a Walrein rolling along behind her like a boulder. Ilse: "I wrote my speech. I\'ll read it if I win."',
    [
      ch('"Semi-final."', fight('Ilse\'s Walrein fights like a glacier, slow and enormous and impossible to argue with. She touches the speech in her pocket every time it lands a hit. Win, and you are in the final next region; lose, and you watch the final from the front row.',
        leader('Leader Ilse', 'walrein', 1, [moment('You reached the final of the Grand Leaders\' Championship')], [flag('gl9-out')]), stageDone(CW, 2))),
    ],
    {
      pokemon: 'walrein',
      remembers: [
        variant('out', [is('gl9-out')], {
          intro: 'You watch the semi-finals from the front row with Harrow\'s flask. Leader Ilse, Ice, wins hers with a Walrein like a glacier, and touches the folded speech in her cardigan pocket after every hit. The final is set for next region.',
          hide: [0],
          add: [ch('"Cheer."', out('You cheer until you are hoarse. Ilse goes through; so does Leader Toma, Bug, on knees that clearly hurt. The final is next region.', stageDone(CW, 2)))],
        }),
        // Remembers: "If the player completed any Leader's Day Off: that Leader's predecessor is in the bracket and mentions them" (dayoff-met, people-leaders-1).
        variant('day-off', [is('dayoff-met')], {
          notice: 'Before the match, one of the other eight, a tall old woman, catches your sleeve. She held a Gym long ago, before the Leader you spent a day off with. "You\'re the one who gave my successor a day off. About time somebody did."',
        }),
      ],
    }),
  scene(`${CW}-s3`, 'The Championship That Wasn\'t: The Final', {
    requires: stageGate(CW, 3), pokemon: 'scizor',
    remembers: [
      variant('out', [is('gl9-out')], {
        intro: 'The final, fifty years late. You watch from beside Harrow. Leader Toma, Bug, limps into the ring with a Scizor gleaming like it was polished this morning. Toma: "My knees won\'t, but my Scizor will." Harrow puts the whistle to his lips, and blows. Harrow: "Whistle\'s still good. Look at that."',
        hide: [0],
        add: [ch('"Watch."', out('It is a final worth fifty years. Toma\'s Scizor takes it in the end, and the whole square stands up. Then Harrow turns to you: someone has to give the trophy out, and it is your championship.', room(`${CW}-s3-award`)))],
      }),
    ],
  },
    'The final, fifty years late. The whole town is here, and some of the next town. Leader Toma, Bug, limps into the ring on knees that clearly hurt, a Scizor beside him gleaming like it was polished this morning. Toma: "My knees won\'t, but my Scizor will." ' +
    'Harrow steps into the middle, puts the whistle to his lips, and blows, clear and sharp across the square. He looks at it in his hand. Harrow: "Whistle\'s still good. Look at that."',
    [
      ch('"The final."', fight('Toma\'s Scizor moves faster than anything that old has a right to, and Toma calls every move from a folding chair. Win or lose, when it is over the whole square stands up. Then there is the trophy to give out.',
        leader('Leader Toma', 'scizor', 2, [room(`${CW}-s3-award`)], [flag('gl9-out'), room(`${CW}-s3-award`)]))),
    ]),
  side(`${CW}-s3-award`, 'The Championship That Wasn\'t: The Trophy',
    'Harrow brings it out of a cardboard box: a silver cup, tarnished, the engraving still blank. It was made fifty years ago and never awarded. The eight old Leaders stand in a line in the ring. Everybody looks at you.',
    [
      ch('"Award the trophy to the winner."', out('Harrow hands you the cup. The engraver from the high street, who has been waiting in the crowd with his tools, cuts your name into it there and then. The trophy that was made and never awarded is finally somebody\'s, and it is yours.', flag('gl9-trophy'), moment('You won the Grand Leaders\' Championship, fifty years late', 80), stageDone(CW, 3))),
      ch('"Award it to all eight."', out('The engraver cuts eight names round the cup, very small, so they all fit. It goes in the town hall, in a glass case by the door, with eight names on it. The eight old Leaders stand in front of it for a photograph, and the town\'s thanks follow you out of town.', flag('gl9-town-thanks'), moment('The Grand Leaders\' Championship cup went to the town hall with eight names on it', 75), stageDone(CW, 3))),
      ch('"Give it to Harrow."', out('You put the cup in Harrow\'s hands. He looks at it, and at you, and he cries, right there in the middle of the ring, with his whistle still round his neck. He has never been given anything. The town\'s thanks follow you out of town.', flag('gl9-town-thanks'), moment('You gave Harrow the trophy, and he cried', 80), stageDone(CW, 3))),
    ],
    {
      remembers: [
        variant('out', [is('gl9-out')], {
          hide: [0],
          add: [ch('"Award the trophy to the winner."', out('Harrow hands the cup to Leader Toma. Toma holds it up over his head on his bad knees, and the Scizor holds him up. The trophy that was made and never awarded is finally somebody\'s.', moment('The Grand Leaders\' Championship was finally won, fifty years late', 70), stageDone(CW, 3)))],
        }),
      ],
    }),
];

// ---------- GL10. The Tower Apprentice (three stages: the foot of the tower, the five floors, the top; the climb runs straight through) ----------
const TA = 'ovc-tower-apprentice';
const FLOORS: { name: string; team: string[] }[] = [
  { name: 'Black Belt Dorran', team: ['machop', 'mankey'] },
  { name: 'Battle Girl Mika', team: ['meditite', 'tyrogue'] },
  { name: 'Black Belt Hollis', team: ['machoke', 'primeape'] },
  { name: 'Battle Girl Sena', team: ['medicham', 'hitmontop'] },
  { name: 'Black Belt Ferro', team: ['hitmonlee', 'hitmonchan'] },
];
const floorId = (n: number): string => (n === 1 ? `${TA}-s2` : `${TA}-s2-floor-${n}`);
const next = (n: number): Json => (n < 5 ? room(floorId(n + 1)) : room(`${TA}-s3`));
const floorFight = (n: number, together: boolean, text: string, ...more: Json[]): Json => {
  const f = FLOORS[n - 1]!;
  const lv = n >= 4 ? 1 : 0;
  const battle = together
    ? spar(f.name, { format: 'doubles', team: f.team, size: 2, lv, ally: 'makuhita', win: [next(n)], lose: [next(n)] })
    : spar(f.name, { team: [f.team[0]!], size: 1, lv, win: [next(n)], lose: [next(n)] });
  return fight(text, battle, ...more);
};
const floorScene = (n: number, intro: string, alone: string, together: string, extra: Json[] = []): Json => {
  const sc = scene(floorId(n), n === 1 ? 'The Tower Apprentice: The Trial' : `The Tower Apprentice: Floor ${n}`, {
    ...(n === 1 ? { requires: [is('ovc-tower-apprentice-s1')], room: true } : { room: true, requires: [] }),
    remembers: [variant('together', [is('tower-together')], { hide: [0], add: [ch('"Next floor."', floorFight(n, true, together, ...(n === 5 ? [stageDone(TA, 2)] : []))), ...extra] })],
  }, intro, [ch('"Next floor."', floorFight(n, false, alone, ...(n === 5 ? [stageDone(TA, 2)] : [])))]);
  return sc;
};
const VITAL = (): Json => ({ kind: 'teachMove', move: 'vital-throw' });
const TOGETHER_LAST = ' Varn stops on the stair, looks back past Wren, and his last line is to you. Varn: "You brought them up. Good."';
type Mode = 'alone' | 'together' | 'coached';
const topChoices = (mode: Mode): Json[] => {
  const last = mode === 'alone' ? '' : TOGETHER_LAST;
  const wren = mode === 'coached'
    ? out('Wren steps up with the Makuhita, and does not shake. Not once. The Makuhita does everything you worked on together on the stairs, and the Hariyama goes down on one knee. Varn stares, and then he laughs, for the first time in years, a great cracked laugh that fills the whole tower. He unknots his own belt and ties it round Wren\'s waist. Then he gives you the last TM he ever made, Vital Throw, a move only he taught.' + last,
      flag('tower-wren-battled'), flag('tower-wren-won'), VITAL(), moment('Wren beat old Varn, and wears his belt', 85), stageDone(TA, 3))
    : out('Wren steps up with the Makuhita. The Hariyama is too much for them, far too much, and Wren loses. But Wren doesn\'t shake. Not once, start to finish. Varn looks at his apprentice for a long time. Varn: "That\'ll do." He comes down anyway, and on the way he gives you the last TM he ever made, Vital Throw, a move only he taught.' + last,
      flag('tower-wren-battled'), VITAL(), moment('Wren lost to old Varn without shaking, and he came down', 75), stageDone(TA, 3));
  return [
    ch('"Battle him."', fight('Varn uncrosses his legs and stands, and the Hariyama stands with him, and the whole top floor seems to get smaller. It is a hard battle. Win, and he nods and goes down the stairs with Wren behind him; lose, and he sits back down to wait.',
      spar('Varn', { team: ['hariyama'], size: 1, lv: 2,
        win: [flag('tower-player-won'), VITAL(), moment('You beat old Varn at the top of his tower, and he came down', 80), stageDone(TA, 3)],
        lose: [room(`${TA}-s3-again`)] }))),
    ch('"Let Wren battle him."', wren),
  ];
};
const topVariants = (): Json[] => [
  variant('coached', [is('tower-together'), is('tower-coached')], { hide: [0, 1], add: topChoices('coached') }),
  variant('together', [is('tower-together')], { hide: [0, 1], add: topChoices('together') }),
];
const towerApprentice: Json[] = [
  scene(`${TA}-s1`, 'The Tower Apprentice', { requires: [] },
    'The foot of an old stone tower, so tall its top is lost in cloud. A young apprentice, Wren, sits on the bottom step in a white gi gone grey at the knees, with a bag of food beside them that has long since gone cold. A Makuhita sits on the step below, chin in its hands. ' +
    'Wren: "My master\'s up there. Varn. He ran the Fighting Gym for forty years." Wren: "He went up a week ago and won\'t come down. I bring food. He doesn\'t eat it." ' +
    'Wren looks up the tower. Wren: "He keeps shouting that he\'s waiting for someone who isn\'t afraid of him."',
    [
      ch('"Climb with you."', out('Wren stares at you, then scrambles up, grabs the cold food bag, and nods hard. Five floors, each held by a Fighting-type trainer Varn trained, and Wren and the Makuhita will fight beside you on every one.', flag('tower-together'), stageDone(TA, 1), room(`${TA}-s2`))),
      ch('"I\'ll climb alone."', out('Wren nods and sits back down on the step, holding the food bag in both arms. Wren: "I\'ll wait." Five floors above you, each held by a Fighting-type trainer Varn trained.', flag('tower-alone'), stageDone(TA, 1), room(`${TA}-s2`))),
      ch('"Shout up to him."', out('You cup your hands and shout up the tower. Silence. Then, from very far above, an old man\'s voice like a landslide. Varn: "Go away!" And a stone falls, a big one, and buries itself in the grass a yard from your foot. You will have to climb.', room(`${TA}-s1-climb`))),
    ]),
  side(`${TA}-s1-climb`, 'The Tower Apprentice: You Must Climb',
    'Wren is looking at the stone in the grass, white-faced. Wren: "He\'s never thrown one before." The tower door stands open above the bottom step.',
    [
      ch('"Climb with you."', out('Wren takes a breath, picks up the food bag, and comes. Five floors, and Wren and the Makuhita will fight beside you on every one.', flag('tower-together'), stageDone(TA, 1), room(`${TA}-s2`))),
      ch('"I\'ll climb alone."', out('Wren sits back down on the step. Wren: "I\'ll wait." You go in alone.', flag('tower-alone'), stageDone(TA, 1), room(`${TA}-s2`))),
    ]),
  floorScene(1, 'The first floor of the tower is a bare stone room with a straw mat. A Black Belt sits on it with his eyes closed; he trained under Varn when he was younger than Wren. He opens his eyes. "Nobody has come up in a week. Show me why you should."',
    'One on one, singles, and he fights the way Varn taught him: straight at you, nothing wasted. Win or lose, he steps aside from the stairs.',
    'A double: Wren and the Makuhita fight beside you, Wren\'s voice shaking on every command. Win or lose, the Black Belt steps aside, and gives Wren a look that is almost proud.'),
  floorScene(2, 'The second floor is narrow and round, and a Battle Girl is skipping rope in the middle of it so fast the rope whistles. She stops dead when she sees you. "Varn\'s? No. You\'re not afraid enough to be one of his."',
    'Singles. She fights like the rope: fast, and in rhythm, and she never misses a beat. Win or lose, she points you up the stairs.',
    'A double, with Wren beside you. Wren calls one move too early, then gets the next one exactly right. Win or lose, the Battle Girl points you both up the stairs.'),
  floorScene(3, 'The third floor is a landing with a window, the only one in the tower. A Black Belt sits under it with a Machoke and a Primeape, eating an apple. "Halfway. Rest a moment. Then we\'ll see."',
    'Singles. He fights with an apple core still in one hand. Win or lose, he tosses it out of the window and waves you on.',
    'A double beside Wren. Halfway up the tower, Wren is still shaking. Win or lose, the Black Belt waves you both on.',
    // "If the player coached Wren earlier": the only coaching in the arc happens here, on the landing with the window.
    [ch('"Wren, take the lead. I\'ll call it with you."', floorFight(3, true, 'You crouch beside Wren and talk the whole fight through: when to brace, when to strike, to breathe out on the throw. The Makuhita listens to Wren, and Wren listens to you, and by the end the shaking has stopped. Win or lose, the Black Belt waves you both on.', flag('tower-coached')))]),
  floorScene(4, 'The fourth floor is dark and smells of liniment. A Battle Girl is stretching against the wall with a Medicham hovering cross-legged beside her. "One more after me. He\'s listening, you know. He hears every fight."',
    'Singles, and harder now. The Medicham reads you before you move. Win or lose, she steps aside.',
    'A double, harder now, with Wren beside you. Win or lose, she steps aside, and as Wren passes she says, "He used to be like you."'),
  floorScene(5, 'The fifth floor is the last before the top. The oldest of Varn\'s students waits there, grey at the temples, with a Hitmonlee and a Hitmonchan. "I was his first. Forty years ago. Win and you can go up and tell him he\'s a stubborn old fool."',
    'Singles. He is very, very good. Win or lose, he stands aside from the last stair, and the light from the top of the tower falls on you.',
    'A double, the hardest yet, Wren beside you. Win or lose, Varn\'s first student stands aside from the last stair and puts a hand on Wren\'s shoulder as Wren goes by.'),
  scene(`${TA}-s3`, 'The Tower Apprentice: At the Top', { room: true, requires: [is('ovc-tower-apprentice-s2')], pokemon: 'hariyama', remembers: topVariants() },
    'The top of the tower is open to the sky, all wind and cloud. An old man in a frayed gi sits cross-legged on the stone, with a Hariyama sitting cross-legged beside him the same way. Neither of them has eaten in a week. ' +
    'Varn: "Forty years. Every challenger came in shaking. My own apprentice shakes." Varn: "I\'m not coming down until someone beats me who isn\'t afraid of me." ' +
    'He looks past you at Wren, who has come up the last stairs anyway, breathless, holding the cold food bag.',
    [...topChoices('alone'), ch('"Why does it matter?"', out('Varn is quiet for so long you think he will not answer. Then: Varn: "Because a Gym\'s not a wall. It\'s a door." He looks at his hands. Varn: "I spent forty years being a wall."', room(`${TA}-s3-again`)))]),
  side(`${TA}-s3-again`, 'The Tower Apprentice: A Door',
    'Varn sits on the stone with the Hariyama beside him and waits, the wind pulling at his frayed gi. Wren stands at the top of the stairs, holding the food bag, not shaking, or trying not to.',
    topChoices('alone'), { remembers: topVariants(), pokemon: 'hariyama' }),
];

export const EVENTS: Json[] = [...firstGym, ...abandonedAce, ...twoGymFeud, ...borrowedBadge, ...stolenBadge, ...rebelGym, ...championship, ...towerApprentice];
export const REMOVE: string[] = [];

/** Where each event is scripted (for docs/status/co-people.md). */
export const DOC: Record<string, string> = {
  'mr-ancient-gym-a': 'GL3 Ember wing', 'mr-ancient-gym-b': 'GL3 Tide wing', 'mr-ancient-gym-c': 'GL3 Leaf wing',
  'r159-wild-gym-leader-pokemon': 'GL4', 'r159-wild-gym-leader-pokemon-after': 'GL4 Challenge (then Find)', 'r159-wild-gym-leader-pokemon-search': 'GL4 Find its Leader (node 1)', 'r159-wild-gym-leader-pokemon-home': 'GL4 Find its Leader (node 2)',
  'ovc-two-gym-feud-s1': 'GL5 (QD1) Stage 1', 'ovc-two-gym-feud-s1-marsh': 'GL5 (QD1) Stage 1 Battle both', 'ovc-two-gym-feud-s1-verdict': 'GL5 (QD1) Stage 1 Battle both',
  'ovc-two-gym-feud-s2': 'GL5 (QD1) Stage 2 (deeds)', 'ovc-two-gym-feud-s2-photograph': 'GL5 (QD1) Stage 2 (photograph)', 'ovc-two-gym-feud-s3': 'GL5 (QD1) Stage 3',
  'ovc-the-borrowed-badge-s1': 'GL6 (QD1) Stage 1', 'ovc-the-borrowed-badge-s1-why': 'GL6 (QD1) Stage 1 Why', 'ovc-the-borrowed-badge-s2': 'GL6 (QD1) Stage 2',
  'ovc-the-borrowed-badge-hospital': 'GL6 (QD1) Stage 3 the hospital', 'ovc-the-borrowed-badge-s3': 'SF8 B14 The Coin Hums', 'ovc-the-borrowed-badge-s3-rescue': 'SF8 B14 Listen', 'ovc-the-borrowed-badge-s3-again': 'SF8 B14 Listen (the choice again)',
  'ovc-stolen-badge-s1': 'GL7', 'ovc-stolen-badge-s1-print': 'GL7 Clue 1', 'ovc-stolen-badge-s1-scrapyard': 'GL7 Clue 2', 'ovc-stolen-badge-s1-treehouse': 'GL7 Clue 3',
  'ovc-stolen-badge-s2': 'GL7 The thief', 'ovc-stolen-badge-s3': 'GL7 With Sorrel',
  'ovc-rebel-gym-s1': 'GL8', 'ovc-rebel-gym-s1-really': 'GL8 One type? Really?', 'ovc-rebel-gym-s2': 'GL8 Approved / second challenge', 'ovc-rebel-gym-s3': 'GL8 Reward (Rebel Badge)',
  'ovc-the-championship-that-wasnt-s1': 'GL9', 'ovc-the-championship-that-wasnt-s1-setup': 'GL9 Hold it (node 1)', 'ovc-the-championship-that-wasnt-s1-setup-2': 'GL9 Hold it (node 2)',
  'ovc-the-championship-that-wasnt-s1-visits': 'GL9 Ask the Leaders first', 'ovc-the-championship-that-wasnt-s2': 'GL9 The bracket (quarter)', 'ovc-the-championship-that-wasnt-s2-semi': 'GL9 The bracket (semi)',
  'ovc-the-championship-that-wasnt-s3': 'GL9 At the final', 'ovc-the-championship-that-wasnt-s3-award': 'GL9 Choices after the final',
  'ovc-tower-apprentice-s1': 'GL10', 'ovc-tower-apprentice-s1-climb': 'GL10 Shout', 'ovc-tower-apprentice-s2': 'GL10 Floor 1',
  'ovc-tower-apprentice-s2-floor-2': 'GL10 Floor 2', 'ovc-tower-apprentice-s2-floor-3': 'GL10 Floor 3', 'ovc-tower-apprentice-s2-floor-4': 'GL10 Floor 4', 'ovc-tower-apprentice-s2-floor-5': 'GL10 Floor 5',
  'ovc-tower-apprentice-s3': 'GL10 At the top', 'ovc-tower-apprentice-s3-again': 'GL10 Why does it matter? (the choice again)',
};

/** Flags nothing in this file reads: where the doc says they come back (merged into src/data/catalogOverhaul/flags/people.json). */
export const AFTERSTORY: { match: string; readBy: string }[] = [
  { match: 'forgotten-badge', readBy: 'The vault, mr-ancient-gym-vault (GL3 "Three forgotten badges open a hidden door"; another file)' },
  { match: 'first-gym-keepers-moved', readBy: 'The nearest Gym, where the three keepers now live (GL3 Remembers, told all three)' },
  { match: 'feud-merged', readBy: 'Cross-run, not built: the town\'s Double Battle Gym in later runs (GL5 Remembers)' },
  { match: 'honest-trusted-badly', readBy: 'The honesty record (GL6 Stage 2: "honest.trusted_badly")' },
  { match: 'borrowed-badge-(at-market|hum-coin)', readBy: 'Needs engine: the lent badge waiting at the Black Market (GL6 Stage 2); the Hum Coin key item (SF8 B14 Keep)' },
  { match: 'badge-(reported|ignored|returned|challenged|apprentice|sorrel-battled)', readBy: 'GL7 flags: the Region Report (reported); Pell off the Road Roster (ignored); Imma as a Road Roster trainer with an Electabuzz next region (challenged, needs content)' },
  { match: 'rebel-(battled|badge)', readBy: 'GL8: Damian\'s afterstory (All-Star Tournament, Final Reunion); the Rebel Badge counting as a badge needs engine' },
  { match: 'gl9-(trophy|town-thanks)', readBy: 'GL9 Reward: the trophy in the hub (needs engine), the town\'s free rests (cross-run, not built); Ondine\'s thanks in the epilogue reads gl9-ondine' },
  { match: 'tower-(player-won|wren-battled|wren-won|alone)', readBy: 'GL10: Wren on the Road Roster as a rising Fighting Leader (wren-won, needs content); the Final Reunion' },
];

/** Flags this file reads that another category sets. */
export const EXTERNAL: string[] = ['dayoff-met'];
