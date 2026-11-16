// Greenneedle gn.56 The Slowpoke Detective Agency (doc GREENNEEDLE_REWORKED_PLACED_12.md lines 173-282).
// Build: npm run co:build -- greenneedle-56   then   npm run co:gn
// A Town event, three cases across three regions (one a region). Each case: six clues in three places, three real. The player reads each
// (one of three readings is right); the agency's own reading is always wrong and arrives at the truth by accident. A case can't be lost:
// the clues read right (of the three real ones) set the reward's tier. Pure DSL: flags only (slowpoke-case, -read, -clues-read, -farrow-met).
import { any, ch, flag, join, money, out as out0, RARE_HELD, type Json, $, item } from '../dsl.ts';
import { bond, chIf, gev, intel, is, kindness, moment, not, notThisRegion, rm, route, say as say0, scene, setTo, stampRegion, when, exactly, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

/** Keeps every paragraph under 30 words: breaks long text at sentence ends. */
function para(t: string): string {
  const parts = t.split(/(?<=[.!?”"*])\s+(?=[A-Z*"“])/);
  const out: string[] = [];
  let cur = '';
  for (const x of parts) {
    if (cur && (cur + ' ' + x).split(/\s+/).length >= 28) { out.push(cur); cur = x; } else cur = cur ? cur + ' ' + x : x;
  }
  if (cur) out.push(cur);
  return out.join('\n\n');
}
const say = (...l: string[]): string => say0(...l.map((x) => para(x)));
const out = (text: string, ...e: Json[]): Json => out0(para(text), ...e);
const TINT = '#6b5a3c';
const ag = (o: Json = {}): Json => ({ tint: TINT, tags: ['Mystery', 'Story'], effect: 'none', pokemon: 'slowpoke', ...o });
void money;

interface Clue {
  id: string;
  /** Real clue (counts toward the tier) or one of the useless three. */
  real: boolean;
  /** The button at the place. */
  look: string;
  /** What the player finds. */
  found: string;
  /** Three readings; `ok` is the right one (for a useless clue: that it means nothing). */
  readings: [string, string, string];
  ok: 0 | 1 | 2;
  yes: string;
  no: string;
  /** The agency's own reading, in the doc's words. */
  slow: string;
}
interface Place { id: string; name: string; intro: string; back: string; clues: [Clue, Clue] }
interface Case {
  n: 1 | 2 | 3;
  client: string;
  /** The office scene: the client's case. */
  office: string;
  hub: string;
  places: [Place, Place, Place];
  conclusion: string[];
  /** Opens the truth: the way the agency goes. */
  go: string;
  truth: string;
  pokemon: string;
  /** Three choices at the end, each a Json choice made by `end`. */
}

const CASES: Case[] = [
  {
    n: 1,
    client: 'The Mayor',
    office: say(
      '*A door with frosted glass. Painted on it: SLOWPOKE DETECTIVE AGENCY. NO CASE TOO. The painter ran out of door.*',
      'Inside, three Slowpoke at three desks. One wears a hat. One holds a pipe with nothing in it. One sleeps, a file open on its face.',
      'The Chief, in the hat, stares at a clue until it means something. This takes about four minutes. The Pipe points at people, usually the wrong one. The Sleeper solves cases in its sleep and tells nobody.',
      '**Miss Prudence Hartigan,** their human secretary, translates. "They\'ve accepted the case. I can tell because the Chief blinked. It doesn\'t blink for the ones it turns down."',
      'Your client is the town\'s mayor, near tears. Her ceremonial hat is gone, an hour before the parade. Nobody saw it go.',
    ),
    hub: say(
      'Six clues, scattered round the town. Three are real. Three aren\'t, and the Slowpoke will prefer the useless three every time.',
      'You decide what each one means. The agency decides too, separately, and it will be wrong. That is the method.',
    ),
    places: [
      {
        id: 'hall', name: 'The Town Hall', back: 'Back to the hall steps.',
        intro: 'The Town Hall. The mayor\'s office, door open, window open, a desk with nothing on it but a diary and a hat-shaped gap.',
        clues: [
          {
            id: 'feather', real: true, look: 'Look at the windowsill.',
            found: 'A grey-black feather on the sill of the open window. Shiny at the edge, like oil on water. Fine scratches in the paint beside it.',
            readings: ['The window opened itself.', 'Something flew in, and out again.', 'The mayor\'s boa shed it.'], ok: 1,
            yes: 'The scratches are claws, very small, landing and leaving. Something flew in, took what it came for, and flew out. You almost hear the wings.',
            no: 'You look closer. The scratches are small and sharp and rather deliberate. Windows don\'t scratch, and the mayor owns no boa.',
            slow: 'The window did it.',
          },
          {
            id: 'diary', real: false, look: 'Read the diary.',
            found: 'The mayor\'s diary, open on the desk. One line, underlined twice, the pen nearly through the page: *must find hat.*',
            readings: ['It\'s a confession.', 'It\'s a code, and the hat is a person.', 'She lost a hat and she\'s worried. That\'s all.'], ok: 2,
            yes: 'A woman an hour from a parade wrote herself a reminder. It isn\'t a clue. It\'s just rather sad.',
            no: 'You turn it over, hold it to the light, check the margins. It stays exactly what it is: a worried note.',
            slow: 'The Pipe points at the mayor.',
          },
        ],
      },
      {
        id: 'square', name: 'The Square', back: 'Back to the hall steps.',
        intro: 'The Square, hung with parade bunting and not much else. Everything that was going to happen here is waiting for a hat.',
        clues: [
          {
            id: 'sandwich', real: false, look: 'Look at the bench.',
            found: 'Half a sandwich on the bench. Ham and pickle, bitten once and forgotten. A wide ring of crumbs lies around it.',
            readings: ['The thief ate it, and fled.', 'Someone was hungry. Everyone is.', 'It\'s a sandwich. It means nothing.'], ok: 2,
            yes: 'It\'s a sandwich in a square at lunchtime. The detective who ignores it keeps their dignity.',
            no: 'You build a theory on the pickle. It lasts about as long as the sandwich did.',
            slow: 'The culprit was hungry. Therefore: everyone.',
          },
          {
            id: 'prints', real: true, look: 'Look at the muddy patch.',
            found: 'Small prints in the mud by the fountain. Three toes forward, one back. They walk in and, oddly, never walk out.',
            readings: ['A child\'s boots, in the rain.', 'A bird, landing and leaving.', 'The mayor\'s slippers.'], ok: 1,
            yes: 'Three toes forward, one back. A bird. It landed, walked, and took off from the fountain rim. That\'s why the prints stop.',
            no: 'Boots don\'t have three toes. The prints look back at you, faintly embarrassed.',
            slow: 'It rained.',
          },
        ],
      },
      {
        id: 'tower', name: 'The Clock Tower', back: 'Back to the hall steps.',
        intro: 'The Clock Tower, tall and shut, ticking a little too slowly. The stairs wind up past the gears into the dark.',
        clues: [
          {
            id: 'receipt', real: false, look: 'Pick up the receipt.',
            found: 'A receipt for forty metres of string, caught in the gutter at the tower\'s foot. Dated last Tuesday.',
            readings: ['The string took the hat.', 'The thief bought string. Suspicious.', 'Someone bought string. It\'s nothing to do with a hat.'], ok: 2,
            yes: 'Hats don\'t need string. Neither does this case. Somewhere there is a very good kite.',
            no: 'You follow the string through half the town. It was a kite. It was a lovely kite.',
            slow: 'The Chief stares at it for the whole four minutes.',
          },
          {
            id: 'nest', real: true, look: 'Climb up to the gears.',
            found: 'High in the clock, among the gears: a nest of twigs and foil, silver spoons, a bottle-top, and something shiny. Out of reach, and rather proud of itself.',
            readings: ['A clockmaker\'s workshop.', 'Something here steals shiny things.', 'A hat rack, oddly.'], ok: 1,
            yes: 'Foil, spoons, a bottle-top: a collector, nesting high. Whatever took the hat is up here, or was.',
            no: 'No clockmaker uses foil. Nobody does. It\'s a nest, and you\'re looking at it.',
            slow: 'A clock.',
          },
        ],
      },
    ],
    conclusion: [
      'The Chief rises. Miss Hartigan clears her throat and reads from the Chief\'s expression.',
      '**Miss Hartigan:** "The mayor stole her own hat, using string, and hid it in a clock, because she was hungry."',
      'The Pipe points at the mayor. The mayor, in the corner, gives a small and dignified sob. The Sleeper turns over.',
    ],
    go: 'Go to the clock.',
    truth: say(
      'The Slowpoke march to the Clock Tower in a line. They arrest the clock. The clock does not resist.',
      'You climb the stairs. In the gears, on the highest ledge, is a nest lined with foil, and a **Murkrow**, bright-eyed and defiant, sitting on the mayor\'s ceremonial hat.',
      'Three small eggs lie in the crown of it, warm. The hat is the best nest it has ever had.',
    ),
    pokemon: 'murkrow',
  },
  {
    n: 2,
    client: 'The Harbour Master',
    office: say(
      'The door again: SLOWPOKE DETECTIVE AGENCY. NO CASE TOO. Inside, three desks, a kettle, and a new cobweb on the Sleeper\'s hat-stand.',
      '**Miss Hartigan:** "A shipment. A harbour master. A locked warehouse. It\'s serious this time." She looks at the Slowpoke. "They haven\'t noticed."',
      'Harbour Master Ansgar Voss twists his cap in his hands. A crate has vanished from a warehouse locked tight, and he signed for it.',
    ),
    hub: say(
      'Six clues, again, three real and three not. The harbour master has asked, twice, whether the Slowpoke are listening.',
      '**Miss Hartigan:** "The Chief nodded. At the window. I think."',
    ),
    places: [
      {
        id: 'warehouse', name: 'The Warehouse', back: 'Back to the harbour office.',
        intro: 'The warehouse, locked, bolted, and empty in the place where the crate should be. Dust outlines the crate and nothing else.',
        clues: [
          {
            id: 'lock', real: true, look: 'Check the lock.',
            found: 'The padlock hangs open and undamaged. The hasp is on the inside of the door. Whoever opened it was already in.',
            readings: ['The harbour master forgot to lock it.', 'Opened from inside. Nobody walked in.', 'The lock is old and gave up.'], ok: 1,
            yes: 'The hasp is on the inside. Nobody forced it, nobody entered. It was opened from within.',
            no: 'It\'s a good lock, and it did its job. You can tell by how it isn\'t broken.',
            slow: 'A seagull.',
          },
          {
            id: 'lunch', real: false, look: 'Look at the harbour master\'s lunch.',
            found: 'His lunch, forgotten on a crate: a pie, one slice gone. He keeps asking if anyone has seen the pastry fork.',
            readings: ['The thief wanted the pie.', 'The pie is the motive.', 'It\'s his lunch. It isn\'t a clue.'], ok: 2,
            yes: 'It\'s a pie. The slice went the usual way. The fork is under the stove.',
            no: 'A whole theory about the pie, and the pie is still just a pie.',
            slow: 'The Pipe points at the harbour master\'s lunch.',
          },
        ],
      },
      {
        id: 'quay', name: 'The Quay', back: 'Back to the harbour office.',
        intro: 'The quay, wet with morning, gulls on every post. Everything smells of tar and fish and rope.',
        clues: [
          {
            id: 'scale', real: true, look: 'Pick up the scale.',
            found: 'A single scale on the warehouse floor, blue-white, the size of a coin, still damp. It catches the light like something living.',
            readings: ['A fish, being taken to market.', 'Something scaled and wet was in here.', 'A sequin, from the circus.'], ok: 1,
            yes: 'Damp scale, not a sequin. Something wet and scaled was inside a locked warehouse. Interesting.',
            no: 'Sequins don\'t move when you breathe on them. This one does, very slightly.',
            slow: 'A sequin from the circus.',
          },
          {
            id: 'gull', real: false, look: 'Look at the seagull.',
            found: 'A seagull, on the crate-hook, looking guilty. It looks guilty every day. It has looked guilty for years.',
            readings: ['The seagull did it.', 'It\'s staring at you. A confession!', 'It\'s a seagull. They always look like that.'], ok: 2,
            yes: 'It\'s a seagull. Looking guilty is just what a gull\'s face does.',
            no: 'The gull stares back. You blink first. That proves nothing at all, except about you.',
            slow: 'The seagull is the culprit.',
          },
        ],
      },
      {
        id: 'street', name: 'The Back Street', back: 'Back to the harbour office.',
        intro: 'A narrow back street behind the warehouse. Peeling posters, a leaning lamp, one wet cobble in a dry street.',
        clues: [
          {
            id: 'drain', real: true, look: 'Look at the drain.',
            found: 'The drain cover in the corner has shifted a hand\'s width, as if pushed from below. Its edge is wet, and the wet leads to the water.',
            readings: ['It was moved from below.', 'Nobody cleans it, so it moves.', 'The harbour cat knocked it.'], ok: 0,
            yes: 'Pushed from below, and the wet leads back to the harbour. Whatever took the crate came and went by water.',
            no: 'A cat can\'t move an iron cover. You get stuck trying, which tells you everything.',
            slow: 'The drain is where seagulls go.',
          },
          {
            id: 'poster', real: false, look: 'Read the poster.',
            found: 'A poster on the wall: *Tonight at the circus: the Seagull Who Sings.* The harbour master has been to see it twice.',
            readings: ['The circus took the crate.', 'The circus is always the answer.', 'It\'s an advert. It has nothing to do with the crate.'], ok: 2,
            yes: 'It\'s an advert for a seagull who sings. It deserves to be seen. It doesn\'t deserve to be a clue.',
            no: 'You follow the poster\'s logic as far as it goes. It goes to the circus and stops.',
            slow: 'The circus did it.',
          },
        ],
      },
    ],
    conclusion: [
      'The Chief rises, slowly. Miss Hartigan reads its expression aloud.',
      '**Miss Hartigan:** "A seagull joined the circus."',
      'The harbour master sits down on his own crate-shaped gap in the floor. The Pipe points at the poster. The Sleeper is already asleep.',
    ],
    go: 'Go to the circus.',
    truth: say(
      'They set off for the circus to arrest the seagull. On the way, the Sleeper nods off, rolls off the quay, and falls through the drain.',
      'You follow it down the wet steps. Below the docks, on a ledge, sits the crate: the Sleeper on top of it, still asleep, and beside it, coiled round a stack of river stones, a **Dratini**.',
      'It has been collecting things that smell like home. The crate holds river stones, packed for an aquarium. It looks at you, caught, and very small.',
    ),
    pokemon: 'dratini',
  },
  {
    n: 3,
    client: 'A Child',
    office: say(
      'The door: SLOWPOKE DETECTIVE AGENCY. NO CASE TOO. Under it, in fresh paint, the last word is wrapped round the frame: **SLOW.**',
      'Inside, the three desks, the Chief with a loaf of bread held in front of it, staring. A woman in a city coat stands behind it, writing.',
      '**Detective Sergeant Rowena Farrow:** "Two cases. Both solved. Both reports make no sense whatever. I was sent to find out how they do it. I\'ve been here a week. I still don\'t know."',
      'And in the chair before the desk, a child in a too-big coat. Her grandfather went out for bread yesterday and didn\'t come back. Real detectives are already looking.',
    ),
    hub: say(
      'It\'s a missing person this time. There is no room for the joke, and the Slowpoke seem to feel it. They have not slept, which for them is remarkable.',
      'Six clues, three real. Take the real ones seriously.',
    ),
    places: [
      {
        id: 'wood', name: 'The Edge of the Wood', back: 'Back to the cottage gate.',
        intro: 'The edge of the wood, where the town ends and the trees begin. The old man\'s path runs into it and doesn\'t come out.',
        clues: [
          {
            id: 'stick', real: true, look: 'Pick up the walking stick.',
            found: 'A walking stick, leaning on the first tree. Worn at the handle by one hand over forty years, and left carefully, not dropped.',
            readings: ['He dropped it and ran.', 'He leant it there on purpose.', 'It\'s somebody else\'s stick.'], ok: 1,
            yes: 'Leant, not dropped. He stopped at the wood\'s edge, put it down gently, and went in. He meant to be found.',
            no: 'It lies against the tree in a very tidy way. Nobody drops a stick tidily.',
            slow: 'The stick is a lead. To the bakery.',
          },
          {
            id: 'prints', real: true, look: 'Look at the prints.',
            found: 'Prints in the soft ground: a man\'s boots, slow and uneven, and beside them, something large, walking slowly in step.',
            readings: ['He was carried off.', 'Two walkers, one slow, one huge, side by side.', 'A wheelbarrow.'], ok: 1,
            yes: 'Two walkers, side by side, the big one matching the old man\'s pace. Whatever it is, it isn\'t dragging him. It\'s keeping him company.',
            no: 'The prints don\'t drag. They don\'t rush. A wheelbarrow doesn\'t keep step, either.',
            slow: 'The prints belong to the bread.',
          },
        ],
      },
      {
        id: 'cottage', name: 'The Cottage', back: 'Back to the cottage gate.',
        intro: 'The cottage, one chair pulled out from the table, one cup still half full. The child sits on the step and doesn\'t speak.',
        clues: [
          {
            id: 'whistle', real: true, look: 'Ask about the night.',
            found: '"I heard a whistle," the child says. "Three notes. Up, down, up. Last night. Grandpa does it when he can\'t sleep."',
            readings: ['A kettle, whistling.', 'It\'s him, calling from somewhere.', 'The wind in the chimney.'], ok: 1,
            yes: 'Three notes, up, down, up, in the dark. He\'s alive, awake, and calling. Somewhere not very far.',
            no: 'Kettles don\'t whistle three notes. Chimneys don\'t sound like a man trying to be found.',
            slow: 'The whistle is the bread.',
          },
          {
            id: 'drawing', real: false, look: 'Look at the child\'s drawing.',
            found: 'A drawing on the table, in wax crayon: a very large Slowpoke, a very small old man, and a sun that is smiling a little too hard.',
            readings: ['It\'s a confession.', 'It\'s a map to the old man.', 'It\'s a child\'s drawing. It means she misses him.'], ok: 2,
            yes: 'She drew the people she hopes will find him. You tell her it\'s a good one. She nods, and looks away.',
            no: 'The sun smiles. The Slowpoke smile. It is not evidence, only a child asking for help in crayon.',
            slow: 'The Chief takes it as a confession.',
          },
        ],
      },
      {
        id: 'bakery', name: 'The Bakery', back: 'Back to the cottage gate.',
        intro: 'The bakery, warm and floury and empty of any answer. The baker shakes his head: he last saw the old man a week ago.',
        clues: [
          {
            id: 'loaf', real: false, look: 'Look at the loaf.',
            found: 'A loaf on the counter, set aside, with the old man\'s name on a paper tag. He never came to collect it.',
            readings: ['The bread took him.', 'He came, then left without it.', 'It\'s his loaf. It\'s only a loaf.'], ok: 2,
            yes: 'His loaf, set aside. The bakery is where he was going, not where he went. It tells you nothing, kindly.',
            no: 'You stare at the loaf. The loaf stares back. Neither of you moves for a long moment.',
            slow: 'The bread took him.',
          },
          {
            id: 'bread', real: false, look: 'Ask about the word "bread".',
            found: 'Everybody keeps saying it: *he went out for bread.* Over and over, until it starts to sound like a clue.',
            readings: ['It\'s a code word.', 'It\'s what the culprit asked for.', 'It\'s what he said. It\'s only a word.'], ok: 2,
            yes: 'He went out for bread. People do. It\'s only what he said, not where he went.',
            no: 'Say a word enough times and it starts to look like an answer. This one is still a word.',
            slow: 'The word "bread" is the culprit.',
          },
        ],
      },
    ],
    conclusion: [
      'The Chief rises. In front of a woman who has solved real cases, it speaks, through Miss Hartigan, with great dignity.',
      '**Miss Hartigan:** "The bread took him."',
      'Farrow closes her notebook, very slowly, and opens it again. The child doesn\'t laugh. The Slowpoke are not laughing, either.',
    ],
    go: 'Follow them out.',
    truth: say(
      'They set off to interview a bakery. They get lost. All three walk into the wood, at Slowpoke speed, in a line, and eleven hours later they walk into a clearing.',
      'An old man sits with a twisted ankle, whistling three notes, a blanket round his knees. Beside him, keeping him warm, is a wild **Ursaring**, huge and patient.',
      '**Farrow, writing it down:** "\'Proceeded in the wrong direction until correct.\' I can\'t put that in a report."',
      '**The grandfather:** "It\'s been bringing me honey. I think it thinks I\'m its."',
    ),
    pokemon: 'ursaring',
  },
];

/** Reward tier by clues read right (of the three real): 3 = a held item and Hartigan's line; 0 = "one of them". */
const tier = (): Json[] => [
  when('slowpoke-read', { min: 3 }, [any(...RARE_HELD)], '**Miss Hartigan:** "You\'d be wasted here." She slides a small parcel across the desk. A held item, for the rare find.'),
  when('slowpoke-read', { min: 0, max: 0 }, [bond(1)], 'The Chief looks at you, nods slowly, and moves its hat a little to make room. The Slowpoke consider you one of them.'),
];
const done = (n: number): Json[] => [flag('slowpoke-case'), setTo(`slowpoke-case-${n}`, 1), ...tier()];

function clueRoom(c: number, place: Place, k: Clue, pokemon?: string): Json {
  const seen = `slowpoke-seen-${c}-${k.id}`;
  return rm(`gn-56-c${c}-${k.id}`, `Detective Agency: ${k.id}`, ag(pokemon ? { pokemon } : {}), say(k.found, '**What does it mean?**'), k.readings.map((label, i) => {
    const right = i === k.ok;
    return ch(label, out(
      say(right ? k.yes : k.no, `**Miss Hartigan:** "The agency's reading: ${k.slow}"`),
      setTo(seen, 1),
      ...(right && k.real ? [flag('slowpoke-read'), flag('slowpoke-clues-read')] : []),
      scene(`gn-56-c${c}-${place.id}`),
    ));
  }));
}

function placeRoom(c: number, place: Place): Json {
  const choices = place.clues.map((k) => chIf([not(`slowpoke-seen-${c}-${k.id}`)], k.look, out('You crouch to look properly.', scene(`gn-56-c${c}-${k.id}`))));
  return rm(`gn-56-c${c}-${place.id}`, `Detective Agency: ${place.name}`, ag(), place.intro, [
    ...choices,
    ch(place.back, out('You go back, notebook in hand.', scene(`gn-56-c${c}-hub`))),
  ]);
}

/** The three-choice endings, per case (the doc's choices and rewards). */
function truthChoices(c: Case): Json[] {
  const d = done(c.n);
  if (c.n === 1) {
    return [
      ch('Take the hat.', out('You lift the hat from under the eggs. The Murkrow screams and lunges at you, then thinks better of it. The mayor will get her hat, and the Murkrow will get a very long grudge. It follows you out of town, and joins you, scowling.', join({ species: ['murkrow'], lv: 0 }), kindness(0), ...d)),
      ch('Leave the hat. Find her another.', out('You leave the hat with the eggs. The Murkrow watches you, wary, as you slide a shiny hairpin out of the nest and put it in your pocket. A good trade. The mayor gets a new hat, the Murkrow keeps its nest, and you carry the rarest thing in the lining.', any(...RARE_HELD), kindness(1), ...d)),
      ch('Ask the Murkrow.', out('The Murkrow tilts its head. You explain: a parade, a mayor, one hat. It considers. Then it pushes the hat off the ledge to you with its beak, and hops onto your shoulder. A bargain, between professionals.', join({ species: ['murkrow'], lv: 0 }), bond(1), ...d)),
    ];
  }
  if (c.n === 2) {
    return [
      ch('Take the Dratini.', out('You hold out a hand. The Dratini looks at the stones, at the crate, and at you. Then it winds round your arm, cold and smooth and certain. It has been very lonely under these docks.', join({ species: ['dratini'], lv: 0 }), ...d)),
      ch('Take the Dragon Scale, and leave it be.', out('Behind the stones, polished and cold: a Dragon Scale the Dratini shed. It lets you take it, but watches. You leave the crate for the aquarium, and the Dratini lets you leave.', item('dragon-scale'), kindness(1), ...d)),
      ch('Ask the Sleeper how it knew.', out('The Sleeper opens one eye. Closes it. A smile, you think, at the corner of its mouth. The Dratini has gone shy, but when you offer a hand it comes anyway, curious, and wraps round your wrist.', join({ species: ['dratini'], lv: 0 }), intel(1), ...d)),
    ];
  }
  return [
    ch('Thank the Ursaring.', out('You thank it, properly, with a bow. It nods once and looks at the old man. It follows him home, slowly, and then, at the gate, turns round and follows you.', join({ species: ['ursaring'], lv: 0 }), kindness(1), setTo('slowpoke-honorary', 1), moment('Found a missing grandfather by walking the wrong way with the Slowpoke Detective Agency.', 70), ...d)),
    ch('Carry him home.', out('You take the old man\'s weight on your shoulder, and the Ursaring takes the other. Between you, you carry him home. The Ursaring stays at the gate all night, to see he\'s fed, and leaves a gift on the step.', any(...RARE_HELD), kindness(1), setTo('slowpoke-honorary', 1), moment('Found a missing grandfather by walking the wrong way with the Slowpoke Detective Agency.', 70), ...d)),
    ch('Ask the Slowpoke how they knew.', out('The Chief looks at you. Four minutes pass. It yawns. Miss Hartigan, arriving late, translates: "It says it didn\'t. It says it wasn\'t sure it should." The Ursaring, listening, decides to follow you home.', join({ species: ['ursaring'], lv: 0 }), intel(1), setTo('slowpoke-honorary', 1), moment('Found a missing grandfather by walking the wrong way with the Slowpoke Detective Agency.', 70), ...d)),
  ];
}

function caseRooms(c: Case): Json[] {
  const hub = rm(`gn-56-c${c.n}-hub`, 'Detective Agency: The Case', ag(), c.hub, [
    ...c.places.map((p) => ch(`Look in ${p.name}.`, out('You pick up your notebook, and go.', scene(`gn-56-c${c.n}-${p.id}`)))),
    ch('Take what you have to the agency.', out('You climb the stairs back to the frosted door. The Chief is waiting, at the exact angle it was before you left.', scene(`gn-56-c${c.n}-end`))),
  ]);
  const end = rm(`gn-56-c${c.n}-end`, 'Detective Agency: The Conclusion', ag(), say(...c.conclusion), [
    ch(c.go, out('You follow them out, a respectful ten paces behind, because it is the only way not to overtake them.', scene(`gn-56-c${c.n}-truth`))),
  ]);
  const truth = rm(`gn-56-c${c.n}-truth`, 'Detective Agency: The Truth', ag({ pokemon: c.pokemon }), c.truth, truthChoices(c));
  return [hub, end, truth, ...c.places.flatMap((p) => [placeRoom(c.n, p), ...p.clues.map((k) => clueRoom(c.n, p, k))])];
}

const GN56: Json[] = [
  gev('gn-56-door', 'The Slowpoke Detective Agency', ag({ stop: 'event', rarity: 'common', requires: [notThisRegion('slowpoke-at'), is('slowpoke-case', 0, 2)], remembers: [
    { id: 'repainted', when: [exactly('slowpoke-case', 2)], notice: 'The door has been repainted. The sign now reads: **NO CASE TOO SLOW.** The painter, for once, left room.' },
  ] }), say(
    '*A door with frosted glass. Painted on it: SLOWPOKE DETECTIVE AGENCY. NO CASE TOO. The painter ran out of door.*',
    'A very small bell. Behind the glass, three shapes that haven\'t moved since you arrived, and one that very slowly has.',
  ), [
    ch('Go in.', out('The bell rings. Somewhere in the room, a very large animal begins, calmly, to notice.', stampRegion('slowpoke-at'), scene('gn-56-office'))),
    ch('Walk on.', out('Behind the glass, nobody moves. You have the odd impression you\'ve been very thoroughly examined.')),
  ]),
  rm('gn-56-office', 'Detective Agency: The Office', ag({ remembers: [
    { id: 'both', when: [is('honorary-detective'), is('ne89-thief-who-returns-things-done')], notice: 'In the corner, in a long coat, with a Slowpoke called Dawdle and a cup of tea: Inspector Quennell. **"I trained with them. Briefly. I left because I kept solving things on purpose."** On the Chief\'s desk, a returned item sits in a small frame. The Chief has been investigating who gave it back for a year.' },
    { id: 'quennell', when: [is('honorary-detective')], notice: 'In the corner, in a long coat, with a Slowpoke called Dawdle and a cup of tea: Inspector Quennell. **"I trained with them. Briefly. I left because I kept solving things on purpose."**' },
    { id: 'returned', when: [is('ne89-thief-who-returns-things-done')], notice: 'On the Chief\'s desk, a returned item sits in a small frame. The Chief has been investigating who gave it back for a year. It has made no progress, and is delighted.' },
  ] }), say(
    'A little reception room: a kettle, a clock that\'s several minutes slow, a desk with a brass nameplate: MISS P. HARTIGAN, SECRETARY AND INTERPRETER.',
    '**Miss Hartigan:** "A case? Of course. Sit down. They are expecting you. They are always expecting everyone."',
  ), [
    ch('Take the case.', out('She slides a file across the desk. The Chief opens one eye, and then, very slowly, the other.', setTo('slowpoke-read', 0), route('slowpoke-case', 'gn-56-case-1', 'gn-56-case-2', 'gn-56-case-3'))),
    ch('Not today.', out('**Miss Hartigan:** "Quite. The Chief has a way of saying no. It involves not blinking."')),
  ]),
  ...CASES.flatMap((c) => [
    rm(`gn-56-case-${c.n}`, `Detective Agency: Case ${c.n}`, ag(), c.office, [
      ch(c.n === 3 ? 'Take the case. Take it seriously.' : 'Take the case.', out('You open the file. The Sleeper, from its chair, murmurs something that might be a name.', setTo('slowpoke-read', 0), ...(c.n === 3 ? [setTo('slowpoke-farrow-met', 1)] : []), scene(`gn-56-c${c.n}-hub`))),
    ]),
    ...caseRooms(c),
  ]),
];

export const EVENTS: Json[] = [...GN56];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-56-door': {
    gn: 'gn.56', shape: 'Recurring', earliest: 'A3', home: 5, window: [3, 8], sits: 'optional', attaches: 'town', tags: ['Mystery Episode'],
    level: 'The rare Pokémon at the end of each case: A+0', often: 'region', badge: 'own',
    dressing: { kanto: 'The Slowpoke Detective Agency', elsewhere: 'The Slowpoke Detective Agency' },
    note: 'Badge: a magnifying glass. A Town or Hub stop (until towns exist, step 5). Three cases across three regions, one a region. Six clues a case (three real); the clues read right set the reward tier. SF119 Quennell and NE89 are remembered in the office.',
  },
};

export const CHAINS: Json[] = [];
void $;
