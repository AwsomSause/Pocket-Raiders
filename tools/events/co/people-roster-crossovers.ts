// Catalog Overhaul Pack, people: THE ROAD ROSTER crossovers (ROAD_ROSTER.md lines 2648-2661, "Roster crossovers").
// One scene per pair, offered once both arcs are done (`roster-<key>-done` on both) in the same run. New ids `roster-crossover-<pair>`.
// Build: npm run co:build -- people-roster-crossovers
import { ch, ferry, fight, flagAt, heal, item, out, type Json } from '../dsl.ts';
import { bond, CATEGORY as CAT, is, moment, not, oldOf, rep, spar } from './_people.ts';

export const CATEGORY = CAT;

const done = (...keys: string[]): Json[] => keys.map((k) => is(`roster-${k}-done`));
const X = (pair: string) => ({ id: `roster-crossover-${pair}`, key: `roster-crossover-${pair}`, set: flagAt(`roster-crossover-${pair}`) });
/** A crossover scene: both arcs done, not seen yet; the art of the first trainer's old meeting. */
function crossover(pair: string, title: string, keys: string[], artFrom: string, intro: string, choices: Json[]): Json {
  const x = X(pair);
  const old = oldOf(artFrom);
  return {
    id: x.id, name: `Road Roster: ${title}`, group: 'Trainers and challenges', stop: 'event', rarity: 'uncommon', types: [], minStage: 1, callback: true,
    requires: [...done(...keys), not(x.key)], scene: (old.scene as Json | undefined) ?? { cast: [], effect: 'none' }, intro, choices,
  };
}

const EVENTS_LIST: Json[] = [
  crossover('joey-dot', 'The Newest Member', ['joey', 'dot'], 'npc-meet-youngster-joey',
    'A patch of tall grass behind a Pokémon Center, trampled flat into a ring. Youngster Joey stands in the middle in his shorts with his cap on backwards, very serious, and five Rattata sit in a row behind him like a jury. ' +
    'Next to him, still dripping from the beach in her rubber ring, is Tuber Dot. Her Marill has been given a tiny paper badge with a Rattata drawn on it in crayon. Joey: "The Rattata Club has a new member. She doesn\'t even have a Rattata." Dot: "Marill is an honorary Rattata. It said so."',
    [
      ch('"Welcome her in."', out('Joey clears his throat and reads the club oath off a crumpled bit of paper, and Dot repeats it word for word, her Marill squeaking at every pause. The five Rattata thump their tails on the ground in a ragged drumroll. Joey shakes her hand like she has joined the Elite Four. Then they both look at you, waiting, until you clap.', X('joey-dot').set, moment('Tuber Dot joined the Rattata Club'))),
      ch('"Can Marill really be a Rattata?"', out('Joey thinks about it so hard his cap slips. Joey: "It\'s top percentage at being round. That counts." Dot beams. Marill bounces once, perfectly round, and the vote is unanimous. You are made to sign the club register as a witness, under a drawing of a Rattata wearing a crown.', X('joey-dot').set, moment('You witnessed Tuber Dot joining the Rattata Club'))),
    ]),
  crossover('kenji-tamsin', 'Grading Day', ['kenji', 'tamsin'], 'npc-meet-black-belt-kenji',
    'Kenji\'s dojo on grading day, the mat swept, the parents\' benches full, the belt table laid out again. Kenji stands on his stick at the edge of the mat in his best gi. And kneeling in the line of students, hair tied back, white belt cinched tight, is Crush Girl Tamsin, the one who used to fight only to impress somebody. ' +
    'Kenji: "She asked to train. Every morning, before anyone else. Today she grades." Tamsin catches your eye and gives you a small, nervous nod.',
    [
      ch('"Watch her grade."', out('Tamsin runs her form clean, her Machamp mirroring every strike, and when she finishes the hall is quiet for a breath before the parents clap. Kenji ties the new belt round her waist himself, slowly, his hands not quite steady. Tamsin bows to him, then, after a second, to you. This time she fought for nobody but herself.', X('kenji-tamsin').set, moment('Tamsin graded at Kenji\'s dojo'))),
      ch('"Be her sparring partner."', fight('Kenji: "Good. She needs someone who won\'t go easy." Tamsin steps onto the mat across from you and bows, and her hands are steady now.',
        spar('Crush Girl Tamsin', { team: ['machamp', 'hawlucha'], size: 2, win: [moment('You sparred Tamsin on her grading day, and she graded')], lose: [moment('Tamsin beat you on her grading day')] }), X('kenji-tamsin').set)),
    ]),
  crossover('elliot-kai', 'Two Lines in the Water', ['elliot', 'kai'], 'npc-meet-fisherman-elliot',
    'The end of a long pier at first light, mist lifting off the water. Fisherman Elliot sits on an upturned bucket with his line out, and beside him, legs dangling over the edge in a wetsuit, is Swimmer Kai, holding a rod for the first time and holding it all wrong. ' +
    'Elliot: "Kai says he\'s only ever seen fish from underneath. I said that\'s the wrong side." Kai laughs. Kai: "He\'s teaching me patience. It\'s going badly."',
    [
      ch('"Fish with them."', out('Elliot shows Kai how to hold the rod loose, and Kai shows Elliot where the fish actually sit, because he has swum past them all his life. Between the two of them the bucket fills by noon. When you get up to go, Elliot presses his old rod into your hands, the cork grip worn to the shape of his palm. Elliot: "Kai\'s got his own now. Take this one."', X('elliot-kai').set, item('good-rod'), moment('Elliot and Kai fished together, and Elliot gave you his old rod'))),
    ]),
  crossover('rosalind-alfred', 'Tea in the Garden', ['rosalind', 'alfred'], 'npc-meet-aroma-lady-rosalind',
    'Aroma Lady Rosalind\'s garden in the late afternoon, bees heavy in the lavender. A little iron table has been set for three, with a teapot under a knitted cosy. Gentleman Alfred sits very straight in his good coat, his cane hooked on the chair, and Rosalind pours. ' +
    'Rosalind: "Alfred says his cottage has no flowers since his wife passed." Alfred, softly: "She did the garden. I only ever did the tea."',
    [
      ch('"Stay for tea."', out('You sit with them while the shadows get long. Rosalind talks about soil and Alfred talks about his wife, and somewhere in it they find they were at the same flower show forty years ago. When it is time to go, Rosalind digs up a moonflower, roots and all, wraps it in damp newspaper and puts it in Alfred\'s hands. Alfred: "For the cottage. She would have liked it." His eyes are wet, and he does not hide it.', X('rosalind-alfred').set, moment('Rosalind gave Alfred a moonflower for his cottage'))),
      ch('"Help plant it."', out('You walk Alfred home with the moonflower in a pot, Rosalind\'s Bellossom riding on your shoulder. In the little empty bed under his window you dig the hole together, and Alfred kneels for the first time in years to press the soil down. Alfred: "There. Now she has a flower again." The Bellossom dances once round the pot before you go.', X('rosalind-alfred').set, bond(1), moment('You planted a moonflower at Alfred\'s cottage'))),
    ]),
  crossover('quinn-rex', 'Page Forty-Two, Returned', ['quinn', 'rex'], 'npc-meet-poke-maniac-rex',
    'Rex\'s little museum, the room with one card under one light. Rex is dusting the glass when the door opens and Burglar Quinn comes in, cap in his hands, no mask, looking smaller than you have ever seen him. He holds a battered card sleeve to his chest. ' +
    'Quinn: "Page forty-two went through my hands once. I never said sorry to your face. I\'m bringing it back myself."',
    [
      ch('"Let him say it."', out('Rex listens to the whole apology without a word, his costume rustling. Then he lifts the glass, and Quinn sets page forty-two back in its case with his own hands, very carefully, as if it might bruise. Rex: "There. Now it\'s home twice." Quinn stands in front of the glass for a long time, and when he leaves he shakes Rex\'s hand with both of his.', X('quinn-rex').set, rep(1), moment('Quinn returned page forty-two to Rex in person'))),
    ]),
  crossover('boris-jessa', 'The Night Shift', ['boris', 'jessa'], 'npc-meet-team-rocket-grunt-boris',
    'A Pokémon Center late at night, the lights turned low. Behind the counter, in pink aprons that do not suit either of them, stand Boris and Jessa, the two grunts who walked away from Team Rocket. Boris is folding towels. Jessa is reading a first-aid manual with her tongue between her teeth. ' +
    'Jessa: "Nurse Joy gave us the night shift. We don\'t charge you." Boris: "We don\'t charge anyone. That\'s the whole job."',
    [
      ch('"Heal my team."', out('Boris takes your Poké Balls like they might break and sets them on the machine, and Jessa hums along to its little tune. Every one of your Pokémon comes back rested and bright. Boris: "Come back any time this side of the mountains. We\'re here all night." For the rest of the region, their door is open to you.', heal(1), X('boris-jessa').set, moment('Boris and Jessa healed your team at their Center'))),
      // TODO(engine): "free heals across the region" (ROAD_ROSTER.md crossovers). Heal stops are already free; what the doc means across the region needs Kice. The flag records it.
    ]),
  crossover('hal-willa', 'Joint Patrol', ['hal', 'willa'], 'npc-meet-pokemon-ranger-hal',
    'A ranger station at the forest edge, two mugs steaming on the rail. Pokémon Rangers Hal and Willa stand over a map pinned with coloured tacks, arguing in the friendly way of people who will agree in a minute. ' +
    'Willa: "We patrol together now. Two Rangers, one forest." Hal taps a path through the trees. Hal: "This one\'s ours. Nothing bad happens on it while we\'re walking it."',
    [
      ch('"Walk it with them."', out('You walk the patrol path with them while the light turns green and gold through the leaves. Hal\'s Pokémon goes ahead, Willa\'s brings up the rear, and every wild Pokémon you pass simply watches you go by. At the far end Willa marks the path on your map with a ranger\'s green pen. Willa: "Any forest you\'re in, we\'ll have one path covered."', X('hal-willa').set, moment('You walked a joint patrol with Rangers Hal and Willa'))),
      // TODO(engine): "one forest node always safe" (ROAD_ROSTER.md crossovers) needs a node-safety effect. The flag records it.
    ]),
  crossover('swim-club', 'The Swim Club', ['marina', 'kai', 'finn'], 'npc-meet-swimmer-marina',
    'A sheltered cove, the water so clear you can see the sand ripples. Three heads bob in the swell: Swimmers Marina, Kai and Finn, with a Dewgong, a Lapras and a very small hand-painted sign on a buoy that says SWIM CLUB. ' +
    'Marina: "We made it official. Three members." Finn: "Four, if you want." Kai: "And whenever you need to cross water, you won\'t go round."',
    [
      ch('"Join the club."', out('They take you out past the headland on the Lapras\'s back, Marina in front, Finn and Kai racing alongside, laughing, and the next stretch of sea goes by under you in no time at all. When they set you down, Finn ties a strip of the club\'s blue towel round your wrist. Marina: "Members don\'t wait for boats."', ferry(), X('swim-club').set, moment('You joined the Swim Club with Marina, Kai and Finn'))),
      // TODO(engine): the doc gives "a sea-node skip per region"; this scene skips one now. Once per region needs a per-region repeat.
    ]),
  crossover('leon-sky-dan-eri', 'Double Doubles', ['couple', 'danieri'], 'npc-meet-cool-couple-leon-and-sky',
    'The promenade at dusk, the railing strung with lights. Cool Couple Leon and Sky, in their matching jackets, stand face to face with Dan and Eri, newly married and still a little shy about it, all four of them grinning. ' +
    'Sky: "Two couples. One battle." Eri: "And you. Someone has to stand across from all four of us."',
    [
      ch('"Bring it."', fight('Leon: "Stylish." Dan: "And strong." Four Poké Balls open at once, two pairs side by side, and the promenade crowd gathers along the railing to watch.',
        spar('Leon and Sky, Dan and Eri', { format: 'doubles', team: ['ampharos', 'altaria', 'volbeat', 'illumise'], size: 4, lv: 1, win: [moment('You beat both couples in a double-double battle')], lose: [moment('Both couples beat you in a double-double battle')] }), X('leon-sky-dan-eri').set)),
      ch('"Just watch."', out('You sit on the railing and watch the four of them battle each other instead, couple against couple, Volbeat\'s light trailing round Altaria\'s wings. Nobody really wins. Sky calls it a draw, and Eri agrees, and they all go for chips.', X('leon-sky-dan-eri').set, moment('You watched both couples battle on the promenade'))),
    ]),
  crossover('kids-four', 'The Referee', ['amytim', 'twins'], 'npc-meet-sis-and-bro-amy-and-tim',
    'A school playground on a Saturday, chalk lines drawn on the tarmac for a battle field. On one side, Amy and Tim with Plusle and Minun; on the other, Twins Nia and Mia in their matching hats with Pikachu and Pachirisu. Four kids, four Pokémon, and a whistle on a string that they hold out to you. ' +
    'Tim: "Four on four. You\'re the referee." Mia: "A fair one. Not like our dad."',
    [
      ch('"Call it fair."', out('You blow the whistle and the playground erupts. Sparks everywhere, Pachirisu darting between legs, Plusle and Minun cheering each other on. You call every faint honestly, even the close ones. At the end it is Amy and Tim by a whisker, and the twins shake their hands without being told. Nia: "That was fair. Can we do it again?"', X('kids-four').set, rep(1), moment('You refereed a four-on-four kids\' battle, and called it fair'))),
      ch('"Call it a draw."', out('With one Pokémon left on each side and everyone exhausted, you blow the whistle long and hard and call it a draw. Four kids collapse on the tarmac laughing. Amy: "A draw means everyone gets ice cream." Nobody can argue with that, so you buy it.', X('kids-four').set, bond(1, 'party'), moment('You refereed a four-on-four kids\' battle, and called it a draw'))),
    ]),
];

export const EVENTS: Json[] = EVENTS_LIST;
export const REMOVE: string[] = [];

export const DOC: Record<string, string> = Object.fromEntries(EVENTS_LIST.map((e) => [e.id as string, 'Road Roster crossovers']));

export const AFTERSTORY: { match: string; readBy: string }[] = [
  { match: 'roster-crossover-[a-z-]+', readBy: 'The All-Star Tournament and Final Reunion (ROAD_ROSTER.md, How the Roster runs); Boris and Jessa\'s free heals, Hal and Willa\'s safe forest node and the Swim Club\'s per-region skip need an engine reader (status note, Needs Kice)' },
];
