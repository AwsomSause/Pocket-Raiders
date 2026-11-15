// Catalog Overhaul Pack, people: THE ROAD ROSTER, RR32 to RR41 (ROAD_ROSTER.md lines 1642 to 2141). Pattern: people-roster-1.ts.
// Build: npm run co:build -- people-roster-5
import { any, ch, companion, fight, heal, item, join, out, ptype, relic, room, stat, type Json } from '../dsl.ts';
import { bond, CATEGORY as CAT, moment, rosterKit, spar, variant, wildSpar } from './_people.ts';

export const CATEGORY = CAT;

/** "+1 Bond" for the one Pokémon the player picks (Lorna's worried one). */
const bondPicked = (n = 1): Json => ({ kind: 'friendship', amount: 5 * n, who: 'picked' });
const FOSSIL = ['helix-fossil', 'dome-fossil', 'old-amber', 'root-fossil', 'claw-fossil'];
const RARE = ['leftovers', 'focus-sash', 'choice-band', 'choice-specs', 'choice-scarf', 'life-orb', 'eviolite', 'rocky-helmet'];

// ---------- RR32. Psychic Lorna (night; Gardevoir, Gallade, Meowstic) ----------
const L = rosterKit('lorna', 'npc-meet-psychic-lorna', 'Psychic Lorna');
const LORNA = 'Psychic Lorna';

const lorna: Json[] = [
  L.meet(1, {
    title: 'In My Head',
    intro:
      'A cliff under the stars, so high the wind sings in the grass. A girl stands right at the edge with her eyes closed and her hands loose at her sides, as calm as if she were asleep standing up. ' +
      'She speaks before you have taken another step. Lorna: "Your next move is already in my head." A small, private smile. Lorna: "So is the one after." Behind her, a Meowstic\'s ears slowly unfold.',
    choices: [
      ch('"Battle."', fight('Lorna opens her eyes for the first time, and they are very bright. Her Pokémon are moving before yours have even settled, as if they had heard your orders before you gave them. Her Pokémon always act first on turn one.',
        spar(LORNA, { team: ['meowstic', 'gardevoir'], size: 2, win: [moment('You beat Psychic Lorna on a cliff under the stars')], lose: [moment('Psychic Lorna read every move you made')] }), L.set('m1'), L.set('first-turn'))),
      ch('"What am I thinking?"', out('Lorna tilts her head as if listening to a far-off radio. Then she names a type, one that is in your party right now, and she is right. She does not look smug about it. She only looks a little tired, like someone who never gets to stop hearing things.', L.set('m1'))),
      ch('"Leave."', out('You step back from the edge and leave her to the stars. She does not open her eyes, but you get the strange feeling she already knew you would.')),
    ],
  }),
  L.meet(2, {
    title: 'Too Loud',
    intro:
      'A busy market at night, all lanterns and shouting and frying oil. In the middle of it, against a fruit stall, a girl stands with both hands pressed hard over her ears. It is Lorna, and she looks like the noise is a weight on her chest. ' +
      'Lorna: "Everyone\'s thoughts. All at once. I can\'t turn it off." She is shaking. Her Meowstic presses against her shins, ears flat.',
    choices: [
      ch('"Take her somewhere quiet."', out('You take her elbow and steer her out past the last lantern, then further, until the market is a glow behind the hills. She does not let go of your sleeve. A bend of the road later, the trees close in around you both.', L.set('m2'), room(L.roomId('forest')))),
      ch('"Teach her to block it."', out('You bring a Steel-type to stand right beside her, solid and still as a wall. Lorna blinks. Lorna: "It\'s... quieter. Behind it." She practises leaning into that quiet, a breath at a time, until her hands come down from her ears. It helps.', L.set('m2'), L.set('steel'))),
      ch('"Battle to focus."', fight('Lorna looks at you like you are mad, then sees the point. A battle is one loud thought instead of a thousand. She lowers her hands and lifts her chin, and her Gardevoir steps between you.',
        spar(LORNA, { team: ['gardevoir', 'meowstic'], size: 2, win: [moment('You battled Lorna until the market went quiet in her head')], lose: [moment('Lorna found her focus by beating you')] }), L.set('m2'), L.set('focus'), moment('The focus cleared Lorna\'s head'))),
    ],
  }),
  L.room('forest', {
    title: 'The Quiet Wood',
    intro:
      'The forest is so still you can hear the leaves settle. Lorna sits down on the moss between two roots, and for the first time since you met her, her face goes slack and young. Her eyes are already closing.',
    choices: [
      ch('"Keep watch."', out('You sit with your back to a tree and keep watch while she sleeps, deep and dreamless, her Meowstic curled on her chest. When she wakes, near dawn, she just says thank you, and means it more than most people mean anything.', L.set('quiet'))),
      ch('"Let your team curl up around her."', out('Your Pokémon settle round her in a loose, warm ring, and their quiet, sleepy minds are the only thoughts left in the wood. Lorna sleeps until the birds start. She wakes smiling, which she tells you she had forgotten how to do.', L.set('quiet'))),
    ],
  }),
  L.meet(3, {
    title: 'Quiet Mind',
    intro:
      'A clear night and a low wall by the road. Lorna sits on it with her eyes wide open, looking at you, not through you. A Gallade stands at her shoulder, arms folded like a bodyguard who has decided to like you. ' +
      'Lorna: "I only listen now when someone asks." She sounds rested. Her Gardevoir hums somewhere behind her, a sound like a tuning fork.',
    choices: [
      ch('"Battle."', fight('Lorna slides off the wall. Gardevoir and Gallade step out side by side, and this time she watches the battle with her own eyes, the way anyone would.',
        spar(LORNA, { team: ['gardevoir', 'gallade'], size: 2, win: [moment('You beat Lorna, Gardevoir and Gallade on a quiet night')], lose: [moment('Lorna\'s Gardevoir and Gallade beat you')] }), L.set('done'))),
      ch('"Listen to my team."', out('Lorna closes her eyes, only because you asked. She tells you which of your Pokémon is the happiest, and you can see it in how it is sitting. Then, more gently, she tells you which one is worried. When you go and talk to it, quietly, just the two of you, something in it eases.', L.set('done'), bondPicked(1))),
      ch('"Thanks."', out('Lorna laughs, a real laugh, surprised out of her. She digs in her pocket and presses something cool and dark into your hand: a Dawn Stone, glittering like the sky over that first cliff. Lorna: "For the quiet."', L.set('done'), item('dawn-stone'))),
    ],
  }),
];

// ---------- RR33. Rocker Axel (evening, night; Toxtricity, Electivire, Loudred) ----------
const A = rosterKit('axel', 'npc-meet-rocker-axel', 'Rocker Axel');
const AXEL = 'Rocker Axel';
const throatSpray = item('throat-spray');

const axel: Json[] = [
  A.meet(1, {
    title: 'Eleven',
    intro:
      'A crumbling stage behind a bar, the boards soft with old beer and rain. An amp the size of a fridge, a guitar with one string held on by tape, and a Toxtricity already bobbing its head to music only it can hear. ' +
      'A man in a leather jacket kicks the amp into life with a squeal. Axel: "Turn it up to eleven!" He spins the dial, grinning at you. Axel: "First battle\'s a soundcheck."',
    choices: [
      ch('"Battle."', fight('Axel slams out a chord and the whole stage shakes. Every roar, screech and song in this fight comes out twice as loud, from your side and his. Sound moves hit harder this battle, both sides.',
        spar(AXEL, { team: ['toxtricity', 'electivire'], size: 2, win: [moment('You won Rocker Axel\'s soundcheck')], lose: [moment('Rocker Axel\'s soundcheck blew you off the stage')] }), A.set('m1'), A.set('loud'))),
      ch('"Play something."', out('He does. It is terrible. It is the most joyful terrible thing you have ever heard, all wrong notes and stamping, and the Toxtricity sings along a full beat behind. By the end the barman is clapping on the off-beat and you are too.', A.set('m1'))),
      ch('"Turn it down."', out('Axel looks at you with real pity. Then he reaches for the dial, very slowly, and turns it up to twelve. The amp howls. Somewhere a window rattles. He winks, and the Toxtricity gives you a thumbs-up.', A.set('m1'))),
    ],
  }),
  A.meet(2, {
    title: 'The Band Broke Up',
    intro:
      'The same stage, at the same hour, and it is empty. No crowd, no drum kit, just Axel sitting on the edge with his guitar across his knees and a Loudred snoring next to the amp. He does not even plug in. ' +
      'Axel: "Drummer left. Bassist left. It\'s just me and a Loudred." He plucks one string and lets it die.',
    choices: [
      ch('"Join the band."', out('Axel sits up so fast he nearly drops the guitar. He counts in, and your Pokémon are the band: one on the bin lids, one on the stomp box, one just shouting. Your team found the beat and held it all the way to the last chord. Axel: "Same time tomorrow?"', A.set('m2'), A.set('band')),
        { prompt: { id: 'echo-rhythm', needs: 'good' }, fail: out('Axel counts in, and your Pokémon are the band: one on the bin lids, one on the stomp box, one just shouting. It falls apart in the second verse and nobody cares. Axel is laughing too hard to play. Axel: "Best rehearsal we ever had."', A.set('m2'), A.set('band')) }),
      ch('"Go solo."', out('Axel turns the idea over like a guitar pick. Then he grabs a beer mat and starts writing, fast, crossing things out. He writes a song about it, about the drummer and the bassist and the empty stage, and it is the first good song he has ever written. He knows it, too.', A.set('m2'), A.set('solo'))),
      ch('"Find the drummer."', out('Axel: "She\'s across the river. She won\'t want to see me." But he tells you the street anyway. A bend of the road later, you hear it before you see it: someone hitting a stack of crates with real feeling.', A.set('m2'), room(A.roomId('drummer')))),
    ],
  }),
  A.room('drummer', {
    title: 'The Drummer',
    intro:
      'A yard full of crates and a woman with drumsticks, playing to nobody. She stops when she sees you looking. She does not have to ask who sent you. She glances at the river, toward the bar, and she misses it. It is all over her face.',
    choices: [
      ch('"He misses you too."', out('She looks at her sticks for a long time. Then she taps out a little rhythm on the nearest crate, the one from the band\'s first song. She says she might come by the bar, just to listen. You both know she will.', A.set('reunion'))),
      ch('"The stage is still there."', out('She laughs, rough and sudden, and wipes her eyes on her wrist. She says the band was the best and worst thing she ever did. Then she picks up the crate she has been drumming on and tucks it under her arm, ready to go.', A.set('reunion'))),
    ],
  }),
  A.meet(3, {
    title: 'The Gig',
    intro:
      'A real show. A real crowd, packed shoulder to shoulder, holding up their glowing phones. The old stage has new boards. Axel stands in the lights with the Toxtricity, the Loudred and an Electivire crackling at the back. ' +
      'He spots you in the crowd and points right at you. Axel: "First song\'s for you." The crowd turns round to see who you are.',
    choices: [
      ch('"Dance."', out('You dance, badly and completely, and your whole team dances with you, hopping and stomping and spinning in the crush. By the encore you are all soaked, hoarse and very close. Backstage, Axel tosses you a Throat Spray. Axel: "For the singing. You were loud."', A.set('done'), bond(1, 'party'), throatSpray)),
      ch('"Battle on stage."', fight('Axel waves you up into the lights. The crowd cheers each hit like it is a guitar solo, and Axel plays the battle\'s soundtrack live, one hand on the strings.',
        spar(AXEL, { team: ['toxtricity', 'electivire', 'loudred'], size: 3, win: [moment('You beat Rocker Axel on stage in front of a real crowd')], lose: [moment('Rocker Axel beat you on stage, and the crowd loved it')] }), A.set('done'), throatSpray)),
      ch('"Request a song."', out('Axel leans down off the stage and hands you the setlist, sticky with tape. Three songs are circled. Axel: "Pick one. We\'ll play it so loud you\'ll hear it all the way through the next region."', room(A.roomId('setlist')))),
    ],
  }),
  A.room('setlist', {
    title: 'The Setlist',
    intro: 'Three songs, circled in marker. The crowd is chanting. The Loudred is already taking a deep, deep breath.',
    choices: [
      ch('"The one about the band."', out('The drummer counts it in. It is the song about the empty stage, and the whole room sings the chorus back. The song plays over the next region, stuck in your head on every road. Axel throws you a Throat Spray from the stage.', A.set('done'), A.set('song', 1), throatSpray)),
      ch('"Eleven."', out('The amp goes up to eleven, then twelve. It is fast and stupid and glorious, and the Toxtricity spins until it falls over. The song plays over the next region in your head. Axel throws you a Throat Spray from the stage.', A.set('done'), A.set('song', 2), throatSpray)),
      ch('"The slow one."', out('The lights go down, the phones come up, and Axel plays it alone, just him and the one taped string. The song plays over the next region, soft on every quiet night. Afterwards he presses a Throat Spray into your hand without a word.', A.set('done'), A.set('song', 3), throatSpray)),
    ],
  }),
];

// ---------- RR34. Ruin Maniac Hadrian (morning, afternoon; Golett, Claydol, Baltoy) ----------
const H = rosterKit('hadrian', 'npc-meet-ruin-maniac-hadrian', 'Ruin Maniac Hadrian');
const HADRIAN = 'Ruin Maniac Hadrian';
const fossil = any(...FOSSIL);

const hadrian: Json[] = [
  H.meet(1, {
    title: 'Secrets',
    intro:
      'A dig site roped off with string and pegs, the earth cut into neat brown steps. An old man kneels in the deepest trench with a soft brush in one hand and a magnifying glass in the other, his hat pushed back. A Baltoy spins slowly beside him. ' +
      'Hadrian: "These ruins hold such secrets." He looks up, sees your foot, and goes pale. Hadrian: "Don\'t step there. That\'s a secret."',
    choices: [
      ch('"Battle."', fight('Hadrian climbs out of the trench with great care, dusts off his knees, and calls his Baltoy and Golett out from between the stones.',
        spar(HADRIAN, { team: ['baltoy', 'golett'], size: 2, win: [moment('You beat Ruin Maniac Hadrian at his dig')], lose: [moment('Ruin Maniac Hadrian\'s Baltoy and Golett beat you')] }), H.set('m1'))),
      ch('"Help dig."', out('Hadrian hands you the spare brush like it is a holy relic. You work the soil away grain by grain, holding your breath, and something hard and curved comes up into the light: a fossil. Hadrian says you have the hands for it.', H.set('m1'), H.set('dug'), fossil),
        { prompt: { id: 'brace-hold', needs: 'good' }, fail: out('Hadrian hands you the spare brush like it is a holy relic. You scrape a little too hard and he winces, but under the crumbled soil something glints anyway: an old lost item, someone else\'s secret. Hadrian lets you keep it.', H.set('m1'), H.set('dug'), any('hard-stone', 'stardust')) }),
      ch('"What secret?"', out('Hadrian glances both ways, though there is nobody for miles. Then he lifts a tarp. Under it, cut deep into the old stone, is a carving of a Legendary Pokémon, worn soft by a thousand years of rain. He touches it with one fingertip, the way you would touch a sleeping child.', H.set('m1'))),
    ],
  }),
  H.meet(2, {
    title: 'Closed',
    intro:
      'The dig site again, and now a tall wire fence runs all the way round it. A sign is bolted to the gate: CLOSED BY ORDER. Hadrian stands outside it with his hands hooked in the wire, looking in at his trenches. ' +
      'Hadrian: "A company wants the land. They say the ruins are fake." His voice cracks on the last word.',
    choices: [
      ch('"Prove them real."', out('Hadrian\'s head comes up. He has rubbings of every carving in his satchel, and he has always thought they matched something. He spreads them on the grass. A bend of the road later you are both on your knees beside an old sigil stone, comparing lines.', H.set('m2'), room(H.roomId('sigil')))),
      ch('"Fight the company."', fight('The company\'s men at the gate are not surveyors. The badges under their jackets belong to the evil team: the company is a front. They let their Pokémon off the lead without a word.',
        { ...spar('Company Guard', { size: 2, win: [moment('You saw off the evil team\'s front at Hadrian\'s dig')], lose: [moment('The evil team\'s front company beat you at Hadrian\'s dig')] }), evil: 'grunt' }, H.set('m2'), H.set('fought'))),
      ch('"Help him move the finds."', out('You spend the afternoon carrying crates, each one packed in straw, out through a gap in the fence before the bulldozers come. Hadrian writes a label for every single find. By evening they are on a cart to the Museum, where nobody can say they are fake.', H.set('m2'), H.set('museum'))),
    ],
  }),
  H.room('sigil', {
    title: 'The Sigil',
    intro:
      'The old sigil stone sits in long grass, half sunk. Hadrian lays the first rubbing over it with shaking hands. The lines are close. Very close. Hadrian: "If they match, the ruins are real. Help me look."',
    choices: [
      ch('"Count the rings."', out('Seven rings on the carving, seven on the sigil, and the same notch in the fourth. Hadrian says it out loud three times, like he is afraid it will change. The carvings match the sigil. Nobody can call the ruins fake now.', H.set('proved'))),
      ch('"Trace the lines."', out('You run your finger along the sigil while he runs his along the rubbing, and your hands move the same way at the same time, curve for curve. Hadrian has to sit down. The carvings match the sigil, and the ruins are real.', H.set('proved'))),
    ],
  }),
  H.meet(3, {
    title: 'The Chamber',
    intro:
      'Deep in the ruins, a stone door that has not moved in a thousand years stands open a crack. Cold air breathes out of it, smelling of dust and time. Hadrian holds a lamp up to the gap. His hand is trembling. ' +
      'Hadrian: "Forty years." He turns to you, and he is smiling like a boy. Hadrian: "Come and see."',
    choices: [
      ch('"Go in first."', out('You squeeze through first, the lamp held high. The chamber glitters: shelves of offerings, untouched. Hadrian, right behind you, insists you take the best of them, a rare treasure, and a fossil from the floor where it has waited all this time.', H.set('done'), any(...RARE), fossil)),
      ch('"Let him go first."', out('Hadrian goes in alone, and for a long moment there is no sound at all. Then you hear him crying, quietly, the way people cry when something finally happens. He names the find for both of you, there and then, and puts a fossil from the chamber floor into your hands.', H.set('done'), moment('Hadrian named his life\'s find for both of you'), fossil)),
      ch('"Battle the guardian."', fight('Something stirs in the dark at the back of the chamber. A Claydol, the old guardian, rises off its plinth and turns all its eyes on you. Hadrian whispers that it is the most beautiful thing he has ever seen.',
        wildSpar({ species: ['claydol'], lose: [moment('The chamber\'s guardian Claydol drove you back')] }), H.set('done'), fossil)),
    ],
  }),
];

// ---------- RR35. Sailor Murphy (morning, evening; Machoke, Tentacruel, Pelipper) ----------
const M = rosterKit('murphy', 'npc-meet-sailor-murphy', 'Sailor Murphy');
const MURPHY = 'Sailor Murphy';

const murphy: Json[] = [
  M.meet(1, {
    title: 'Hoist the Sails',
    intro:
      'A dock that smells of tar and salt. A broad sailor with a grey beard leans on a bollard, a Pelipper perched on his shoulder like a parrot, beak tucked into its feathers. ' +
      'He sees you and throws out an arm toward the sea. Murphy: "Hoist the sails, matey!" The Pelipper opens one eye and squawks along.',
    choices: [
      ch('"Battle."', fight('Murphy rolls up his sleeves. A Machoke climbs out of a crate, and a Tentacruel rises dripping from the water beside the dock.',
        spar(MURPHY, { team: ['machoke', 'tentacruel'], size: 2, win: [moment('You beat Sailor Murphy on his dock')], lose: [moment('Sailor Murphy\'s crew beat you on the dock')] }), M.set('m1'))),
      ch('"Where are you sailing?"', out('Murphy\'s grin wobbles. He looks along the dock at a little boat with peeling paint and weed on its rope. Murphy: "Nowhere. Ship\'s been in dock four years." The Pelipper rubs its head against his ear.', M.set('m1'))),
      ch('"Leave."', out('You leave him to the gulls. Behind you, he is still saluting the sea.')),
    ],
  }),
  M.meet(2, {
    title: 'Ship',
    intro:
      'The little boat is out of the water on blocks, and Murphy is painting her, slow careful strokes of blue. The name on her side is fresh: you can still smell it. ' +
      'Murphy: "I\'m going. Before I\'m too old." He wipes his brush on a rag and looks at you hard. Murphy: "Need a crew."',
    choices: [
      ch('"Crew for a night."', out('Murphy laughs so loudly the Pelipper falls off his shoulder. By dusk the boat is in the water and you are on her, the dock lights shrinking behind you. Ahead is nothing but sea.', M.set('m2'), room(M.roomId('sea1')))),
      ch('"Patch the hull."', out('There is a split in the planks below the waterline that he has been pretending not to see. A Water-type helps, holding the seam shut from outside while you and Murphy hammer in the pitch. When she floats, dry inside, he hugs you with tar on both hands.', M.set('m2'), M.set('patched'))),
      ch('"Stay ashore."', out('Murphy nods, not hurt. Murphy: "Fair. Somebody has to wave." At dawn you stand on the dock and wave, and he sails alone, a small blue boat getting smaller, the Pelipper flying ahead.', M.set('m2'), M.set('alone'))),
    ],
  }),
  M.room('sea1', {
    title: 'Open Water',
    intro: 'The first sea node. The land is gone. Stars above, stars in the water, and the boat creaking like it is happy. Murphy hands you the wheel and goes forward to look at the sails.',
    choices: [
      ch('"Hold the course."', out('You keep her steady on the star he showed you, and Murphy hums an old shanty on the bow. The night goes on, and on. Further out, the swell grows.', room(M.roomId('sea2')))),
      ch('"Mind the nets."', out('You coil ropes and mind the trailing net while Murphy steers, and you catch three silver fish and a very surprised Tentacool, which you put back. Further out, the swell grows.', room(M.roomId('sea2')))),
    ],
  }),
  M.room('sea2', {
    title: 'The Far Buoy',
    intro: 'The second sea node. A lone buoy bells in the dark, the farthest mark Murphy has ever reached. Beyond it the sea is open all the way to the morning. He looks at it a long time.',
    choices: [
      ch('"Bring her home."', out('You turn round the buoy and run home on the wind, fast and wet and laughing. At the dock Murphy ties up, sits down, and says that was the best night of his life. He means it.', M.set('sailed'))),
      ch('"Sail till dawn."', out('You do not turn back until the sky goes pink. Murphy watches the sun come up over open water with tears in his beard. Murphy: "Four years. Should\'ve done it sooner." You sail home in the light.', M.set('sailed'))),
    ],
  }),
  M.meet(3, {
    title: 'Postcard',
    intro:
      'A postcard finds you at a rest stop, tucked under a pebble with your name on it in big square capitals. On the front: a green island, a white beach, a small blue boat. The Pelipper must have flown it the whole way. ' +
      'Murphy, written: "Made it. Bring your team. I\'ve got a hammock for every one."',
    choices: [
      ch('"Visit."', out('You follow the card\'s little map down to the coast, and a fisherman ferries you across. A bend of the sea later, there is the island, and Murphy waving from the sand.', room(M.roomId('island')))),
      ch('"Write back."', out('You write him everything: where you have been, who you have beaten, how the team is. Two days later the Pelipper comes back with a parcel. Inside is a Mystic Water and a note: "From the bottom of my sea."', M.set('done'), item('mystic-water'))),
      ch('"Battle him there."', fight('You cross to the island and Murphy is delighted. Murphy: "Fight on the beach? Like the old days!" His Pelipper and Tentacruel come splashing out of the shallows.',
        spar(MURPHY, { team: ['pelipper', 'tentacruel'], size: 2, win: [moment('You beat Sailor Murphy on his island beach')], lose: [moment('Sailor Murphy beat you on his island beach')] }), M.set('done'))),
    ],
  }),
  M.room('island', {
    title: 'The Island',
    intro: 'A rest node on Murphy\'s island. Palm trees, a fire, the blue boat pulled up on the sand, and strung between the trees, a hammock for every one of your team, exactly as he promised.',
    choices: [
      ch('"Take a hammock."', out('You swing in the shade while the sea hushes, and your whole team sleeps the afternoon away, rocked by the breeze. When you wake, everyone is fully rested, and Murphy is cooking fish.', M.set('done'), heal(1))),
      ch('"Sit up with Murphy."', out('You sit by his fire till late while your team snores in the hammocks, and he tells you about the crossing, every wave of it. By morning everyone is fully rested, and he does not want you to go.', M.set('done'), heal(1))),
    ],
  }),
];

// ---------- RR36. Scientist Dr. Orson (afternoon, evening; Porygon2, Magneton, Klang) ----------
const O = rosterKit('orson', 'npc-meet-scientist-dr-orson', 'Scientist Dr. Orson');
const ORSON = 'Scientist Dr. Orson';
const upGrade = item('up-grade');

const orson: Json[] = [
  O.meet(1, {
    title: 'Sample',
    intro:
      'A lab coat, very white, in the middle of a muddy field. The man inside it has a clipboard, three pens in his top pocket and grass stains on both knees. A Porygon2 hovers beside him, scanning the hedges. ' +
      'He looks you up and down and writes something. Orson: "A fascinating battle sample."',
    choices: [
      ch('"Battle."', fight('Orson clicks a pen. Porygon2 and a Magneton float forward in perfect formation while he takes notes on every move you make.',
        spar(ORSON, { team: ['porygon2', 'magneton'], size: 2, win: [moment('You beat Dr. Orson and became a footnote in his data')], lose: [moment('Dr. Orson\'s Porygon2 and Magneton beat you')] }), O.set('m1'))),
      ch('"What\'s the study?"', out('Orson brightens like nobody has ever asked. It is battle data for a paper: how trainers choose under pressure. He shows you graphs drawn by hand, with little apologetic arrows. He thanks you three times for asking.', O.set('m1'))),
      ch('"Leave."', out('You leave him in his field. He writes something down about that, too.')),
    ],
  }),
  O.meet(2, {
    title: 'Funding',
    intro:
      'Orson stands on the pavement outside a glass building. Over the doors is a logo you know: the evil team\'s. He is holding a fat envelope and not opening it. ' +
      'Orson: "They\'ll fund me. I just have to not ask what for." He tries to laugh. It does not work.',
    choices: [
      ch('"Don\'t take it."', out('Orson looks at the envelope for a long time. Then he walks in, hands it back at the desk, and walks out again, very quickly, like someone leaving a fire. He is broke but clean, and he looks ten years younger.', O.set('m2'), O.set('clean'))),
      ch('"Take it and spy."', out('Orson goes white, then very still, then nods. A week of his life goes into it. He feeds you one step of the evil team\'s plan, folded small inside a lab report, and his hands shake as he passes it over.', O.set('m2'), O.set('spy'))),
      ch('"Your choice."', out('Orson nods slowly, as if you have told him something sad. He takes it. The doors slide shut behind him, and through the glass you watch someone hand him a new white coat with the logo on the pocket.', O.set('m2'), O.set('took'))),
    ],
  }),
  O.meet(3, {
    title: 'Results',
    intro:
      'Orson\'s lab: one room above a bakery, warm and smelling of bread, papers pinned to every wall. He looks thinner and much happier. A Porygon2 is sorting his mail. ' +
      'Orson: "Small grant. Small results. I sleep fine." He offers you a stool and a bun.',
    choices: [
      ch('"Battle."', fight('Orson straightens his coat and calls out something new: a Porygon-Z, twitching with fresh code. Orson: "My best result."',
        spar(ORSON, { team: ['porygon-z'], size: 1, win: [moment('You beat Dr. Orson\'s Porygon-Z')], lose: [moment('Dr. Orson\'s Porygon-Z beat you')] }), O.set('done'), upGrade)),
      ch('"Use your data."', out('Orson pulls a thick binder off the shelf. It is every wild Pokémon he has measured in this region, every base stat, laid out in tidy tables. He gives you the whole thing, and an Up-Grade from his drawer for good measure. You see base stats of every wild Pokémon this region.', O.set('done'), O.set('stats'), upGrade)),
      ch('"Bring him to the Professor."', out('You bring him to the Professor\'s lab, and Orson stammers through his graphs. The Professor reads them twice, then offers him a desk and a real job. Orson presses his old Up-Grade into your hand on the way out. He cannot stop smiling.', O.set('done'), upGrade)),
    ],
    remembers: [
      variant('took', [O.is('took')], {
        intro:
          'Not Orson\'s lab: the team\'s. White corridors, humming machines, and grunts everywhere. Orson is here in the logo coat, an evil-team scientist now, standing behind them in the team battle with his clipboard and his Porygon-Z. He will not meet your eyes.',
        hide: [1, 2],
        add: [
          ch('"Your old data was good."', out('Orson stops. He looks down at the clipboard, then at the logo on his pocket. Then he takes off the coat, folds it neatly, and lays it on a bench. He walks out with you, and on the steps outside he gives you an Up-Grade, his hands steady at last.', O.set('done'), O.set('turned'), upGrade)),
        ],
      }),
    ],
  }),
];

// ---------- RR37. Sis and Bro Amy and Tim (doubles; evening, night; Plusle, Minun, later Ampharos, Pachirisu) ----------
const S = rosterKit('amytim', 'npc-meet-sis-and-bro-amy-and-tim', 'Sis and Bro Amy and Tim');
const SIBS = 'Sis and Bro Amy and Tim';

const amytim: Json[] = [
  S.meet(1, {
    title: 'Always Together',
    intro:
      'A swing set in the evening, chains squeaking. Two kids swing side by side in perfect time, up and back, up and back, like one kid and a mirror. A Plusle sits on one\'s lap and a Minun on the other\'s. ' +
      'They jump off at the top of the arc, together, and land together. Amy: "We always fight together!" Tim: "Always!"',
    choices: [
      ch('"Battle."', fight('Amy and Tim stand back to back. Plusle and Minun hop forward, cheeks crackling, and high-five before the first move.',
        spar(SIBS, { format: 'doubles', team: ['plusle', 'minun'], size: 2, win: [moment('You beat Amy and Tim\'s Plusle and Minun')], lose: [moment('Amy and Tim beat you, together')] }), S.set('m1'))),
      ch('"What if you didn\'t?"', out('The swing chains go quiet. Amy and Tim look at each other, and for a second they both look very scared, like you have asked what happens if the sun goes out. Then Tim grabs Amy\'s hand and they run off home.', S.set('m1'), S.set('asked'))),
      ch('"Leave."', out('You leave them swinging. The chains squeak in time behind you until you are out of earshot.')),
    ],
  }),
  S.meet(2, {
    title: 'Different Schools',
    intro:
      'The same swing set. Only Amy this time, swinging alone, not in sync with anybody. The other swing hangs empty and turns a little in the wind. Her Plusle sits in the dirt watching it. ' +
      'Amy: "Tim got into the science school. I didn\'t." She drags her feet to stop.',
    choices: [
      ch('"Visit Tim."', out('You go with her across town to the science school\'s gates. Tim comes out in a too-big blazer, and the moment he sees his sister he bursts into tears. Tim is miserable too. They sit on the kerb and swap every single bad thing about the week.', S.set('m2'), S.set('visit'))),
      ch('"Battle me alone."', fight('Amy wipes her nose and stands up. Amy: "Fine. Just me." She fights alone for the first time, and she is good, sharper and braver than you have ever seen her. She looks surprised at herself.',
        spar('Amy', { team: ['plusle', 'ampharos'], size: 2, lv: 1, win: [moment('You beat Amy, battling alone for the first time')], lose: [moment('Amy beat you on her own')] }), S.set('m2'), S.set('alone'))),
      ch('"It\'s okay to be apart."', out('Amy does not answer for a long time. The empty swing turns in the wind. Amy: "Is it?" She is quiet after that, but she lets you push her on the swing, and she does not ask you to stop.', S.set('m2'), S.set('talk'))),
    ],
  }),
  S.meet(3, {
    title: 'Weekends',
    intro:
      'The swing set on a Saturday, sunny and loud. Both of them are back, Amy in her old jumper and Tim still in the school blazer, swinging out of time and not caring. An Ampharos and a Pachirisu run circles under the swings. ' +
      'Tim: "Weekends we\'re a team." Amy: "Weekdays we\'re people." They say it like something they have practised and come to believe.',
    choices: [
      ch('"Battle."', fight('They jump down together. Four Pokémon, two kids, one plan. It is a double battle, and it is very good: they have each learned things the other has not.',
        spar(SIBS, { format: 'doubles', team: ['plusle', 'minun', 'ampharos', 'pachirisu'], size: 4, lv: 2, win: [moment('You beat Amy and Tim at their best')], lose: [moment('Amy and Tim beat you on a Saturday')] }), S.set('done'), companion(1))),
      ch('"Tag with Amy."', fight('Amy whoops and runs to your side with her Plusle. Tim grins and squares up across the sandpit with Minun and Pachirisu. She joins you in a double, and for once they are on opposite sides, and neither of them minds at all.',
        spar('Tim', { format: 'doubles', team: ['minun', 'pachirisu'], size: 2, ally: 'plusle', win: [moment('You and Amy beat Tim in a double')], lose: [moment('Tim beat you and Amy in a double')] }), S.set('done'), companion(1))),
      ch('"Tag with Tim."', fight('Tim straightens his blazer and joins you with his Minun. Amy sticks out her tongue and lines up across from you with Plusle and Ampharos. He joins you in a double, and the two of them trash-talk the whole way through.',
        spar('Amy', { format: 'doubles', team: ['plusle', 'ampharos'], size: 2, ally: 'minun', win: [moment('You and Tim beat Amy in a double')], lose: [moment('Amy beat you and Tim in a double')] }), S.set('done'), companion(1))),
    ],
  }),
];

// ---------- RR38. Super Nerd Miles (morning, afternoon; Porygon, Magnemite, Electrode) ----------
const N = rosterKit('miles', 'npc-meet-super-nerd-miles', 'Super Nerd Miles');
const MILES = 'Super Nerd Miles';
const scopeLens = item('scope-lens');

const miles: Json[] = [
  N.meet(1, {
    title: 'Odds',
    intro:
      'A boy on a park bench with a calculator held up close to his glasses, thumbs flying. A Magnemite hums beside him like a desk lamp. He looks at your team, taps three more keys, and frowns at the screen. ' +
      'Miles: "I did the math on your odds. Thirty-eight percent." He says it kindly, like a doctor.',
    choices: [
      ch('"Battle."', fight('Miles pushes his glasses up his nose. Miles: "For the data." Porygon and Magnemite take the field.',
        spar(MILES, { team: ['porygon', 'magnemite'], size: 2, win: [moment('You beat Miles\'s thirty-eight percent')], lose: [moment('Super Nerd Miles\'s math held up')] }), N.set('m1'))),
      ch('"Show me the math."', out('Miles turns the calculator round, then pulls out a dog-eared type chart covered in his own notes. He walks you through every matchup on your team, one by one. You check it twice. Annoyingly, it is right.', N.set('m1'))),
      ch('"Ignore the odds."', fight('You tell him what he can do with his thirty-eight percent. Miles blinks, then grins, and calls out his Porygon and Magnemite to prove the number.',
        spar(MILES, { team: ['porygon', 'magnemite'], size: 2, win: [moment('You beat the odds, and Miles said: "That\'s not possible."')], lose: [moment('Super Nerd Miles\'s math held up')] }), N.set('m1'))),
    ],
  }),
  N.meet(2, {
    title: 'The Bet',
    intro:
      'Miles on the same bench, surrounded by a ring of bigger kids with folded arms. He is clutching his calculator to his chest like a shield. ' +
      'He spots you and his face crumples with relief. Miles: "I bet them all I could predict the gym leader\'s team. I can\'t."',
    choices: [
      ch('"Help him."', out('You crouch down beside him and share what you know: what the gym leader leads with, what they save for last, the move that caught you out. Miles writes it all down, nodding fast. The big kids look less sure of themselves.', N.set('m2'), N.set('helped'))),
      ch('"Let him lose."', out('You shake your head. Miles has to guess, and he guesses wrong. He loses his lunch money, coin by coin, into a bigger kid\'s hand. He does not cry until they are gone. Then he cleans his glasses for a long time.', N.set('m2'), N.set('lost'))),
      ch('"Ask the leader."', out('You march Miles and the whole crowd up to the gym doors. The leader hears the story and laughs so hard they have to lean on the doorframe. Then they tell him, Pokémon by Pokémon. Miles wins every bet.', N.set('m2'), N.set('leader'))),
    ],
  }),
  N.meet(3, {
    title: 'The Algorithm',
    intro:
      'Miles at a café table with a laptop covered in stickers, its fan whirring. Lines of numbers scroll past his face. He turns the screen so you can see a little cartoon of your team, fighting. ' +
      'Miles: "I built a battle simulator. It said you\'d win." He sounds proud and a little worried.',
    choices: [
      ch('"Battle."', fight('Miles snaps the laptop shut. Miles: "Let\'s test it." He calls out a Porygon-Z, glitching and grinning.',
        spar(MILES, { team: ['porygon-z'], size: 1, win: [moment('You beat Miles\'s Porygon-Z, just like his simulator said')], lose: [moment('Miles\'s Porygon-Z broke his own simulator\'s prediction')] }), N.set('done'), scopeLens)),
      ch('"Run my team."', out('Miles types in your whole team, move by move. The simulator runs a thousand fights in a few seconds, then flashes one line in red: your team\'s biggest type weakness. He gives you a Scope Lens to help cover it.', N.set('done'), N.set('weakness'), scopeLens)),
      ch('"Turn it off."', out('Miles looks at you, then at the screen, then at the real sky over the café. He closes the lid. Miles: "...Good point." He hands you a Scope Lens and says you should look at things properly, not through a screen.', N.set('done'), scopeLens)),
    ],
  }),
];

// ---------- RR39. Swimmer Coral (morning, evening; Corsola, Lanturn) ----------
const C = rosterKit('coral', 'npc-meet-swimmer-coral', 'Swimmer Coral');
const CORAL = 'Swimmer Coral';

const coral: Json[] = [
  C.meet(1, {
    title: 'Splash',
    intro:
      'A shallow reef, the water clear and green over the coral. A swimmer in goggles bursts up through the surface right beside a Corsola, sending spray everywhere. She pushes the goggles up onto her forehead. ' +
      'Coral: "Swim and splash!" A Lanturn\'s light blinks on and off under the water behind her.',
    choices: [
      ch('"Battle."', fight('Coral flips over, laughing. The Corsola bobs up on one side and the Lanturn on the other, both ready.',
        spar(CORAL, { team: ['corsola', 'lanturn'], size: 2, win: [moment('You beat Swimmer Coral on her reef')], lose: [moment('Swimmer Coral beat you on her reef')] }), C.set('m1'))),
      ch('"Is the reef okay?"', out('Coral\'s grin fades. She ducks under and comes back up holding a branch of coral in both hands, and it is pale at the tips, like bone. Coral: "It\'s going white." Her Corsola nudges it, worried.', C.set('m1'), C.set('asked'))),
      ch('"Swim on."', out('You swim on along the coast. Behind you, Coral is still splashing.')),
    ],
  }),
  C.meet(2, {
    title: 'White Reef',
    intro:
      'Coral sits on the beach with her knees up and her goggles off, not swimming. Her Corsola is in her lap, and it has gone a dull, sick grey. She strokes its branches very gently, as if they might break. ' +
      'Coral: "The reef\'s dying. Corsola\'s going grey."',
    choices: [
      ch('"Find out why."', out('You follow the warm water. Upstream, round two bends of the river, a pipe pours hot runoff from a works straight into the current. A warm-water outflow. You find the valve, and between you, you shut it. Coral stands in the river until the water runs cold again.', C.set('m2'), C.set('saved'))),
      ch('"Move the Corsola."', out('You help her carry them, one by one, in buckets of seawater, down the coast to a colder bay. They live elsewhere now, and they like it. Coral says she has started seeing a new kind on the rocks there, ghostly and white: Galarian Corsola start appearing.', C.set('m2'), C.set('moved'))),
      ch('"Plant new coral."', out('You spend the afternoon in the shallows with her, tying tiny cuttings of living coral onto the dead branches with string. It is slow work, and it will be slow to grow. Coral says it does not matter how long it takes. She will be here.', C.set('m2'), C.set('planted'))),
    ],
  }),
  C.meet(3, {
    title: 'New Reef',
    intro:
      'Coral comes running out of the waves smiling, goggles up, water streaming off her. She grabs your arm and points. Coral: "It\'s coming back. Pink at the edges." ' +
      'Under the surface, the reef has a blush of colour again, and little shapes move between the branches. Coral: "The Corsola are breeding again. Want to help count them?"',
    choices: [
      ch('"Battle."', fight('Coral whistles. Her Corsola, pink and healthy, comes up beside the Lanturn, and a Mantine glides in over the reef to join them.',
        spar(CORAL, { team: ['corsola', 'lanturn', 'mantine'], size: 3, win: [moment('You beat Swimmer Coral over her new reef')], lose: [moment('Swimmer Coral beat you over her new reef')] }), C.set('done'))),
      ch('"Swim the reef."', out('You swim the reef with her, slow and easy, in water so clear it feels like flying. Your team floats in the warm shallows over the pink coral. When you come out, everyone is fully healed and very sleepy.', C.set('done'), heal(1))),
      ch('"Help count Corsola."', out('You float face-down with her, counting. Thirty-one, thirty-two, and a tiny one hiding under a ledge. When you surface, a young Corsola has followed you up and will not leave your side. Coral: "It\'s chosen you. Take it. There are plenty now."', C.set('done'), join({ species: ['corsola'] }))),
    ],
  }),
];

// ---------- RR40. Swimmer Finn (morning, evening; Floatzel, Wailmer) ----------
const F = rosterKit('finn', 'npc-meet-swimmer-finn', 'Swimmer Finn');
const FINN = 'Swimmer Finn';

const finn: Json[] = [
  F.meet(1, {
    title: 'Cannonball',
    intro:
      'A long wooden pier over deep water. A boy sprints the full length of it, arms windmilling, and leaps off the end, knees tucked, shouting the whole way down. Finn: "Cannonball into battle!" ' +
      'The splash soaks you to the knees. He surfaces laughing, a Buizel paddling in circles round his head.',
    choices: [
      ch('"Battle."', fight('Finn hauls himself up the ladder, dripping. His Buizel shakes off on the boards and a Wailmer surfaces under the pier, spouting.',
        spar(FINN, { team: ['buizel', 'wailmer'], size: 2, win: [moment('You beat Swimmer Finn off the end of his pier')], lose: [moment('Swimmer Finn beat you on his pier')] }), F.set('m1'))),
      ch('"Cannonball too."', fight('You run the length of the pier and jump. The water is shockingly cold. Finn loves it, absolutely loves it, and is still whooping when you both climb out, and then it is straight into a battle, dripping.',
        spar(FINN, { team: ['buizel', 'wailmer'], size: 2, win: [moment('You cannonballed with Finn, then beat him')], lose: [moment('You cannonballed with Finn, then he beat you')] }), F.set('m1'), F.set('jumped'))),
      ch('"Stay dry."', out('You step back from the edge. Finn shrugs, climbs out and does it again. And again.')),
    ],
  }),
  F.meet(2, {
    title: 'Too Far',
    intro:
      'The same pier, and the sea is choppy. Far out past the last buoy, a head bobs in the grey water, an arm waving. It is Finn, and he is not playing. ' +
      'Finn: "Cramp! Cramp!" His voice is thin over the waves. He goes under, and comes back up coughing.',
    choices: [
      ch('"Swim out."', out('You are in the water before you have decided to be, and your Water-type surges past you to get to him first. Together you get an arm under each of his and tow him in. On the pier you both lie there, gasping. Both fine.', F.set('m2'), F.set('saved')), { requires: [ptype('water')] }),
      ch('"Send a Water-type."', out('Your Water-type hits the sea like an arrow and cuts out through the chop. It reaches him, lets him grab on, and brings him all the way in. Finn hugs it, shaking, and will not let go for a long while.', F.set('m2'), F.set('saved')), { requires: [ptype('water')] }),
      // TODO(takeNode): the doc's "One stage" passes here (the shared takeNode effect is not merged yet).
      ch('"Call the lifeguard."', out('You run for the lifeguard\'s tower and shout. The lifeguard goes out on a board and brings him in by the collar, and the whole beach watches. He is fine but embarrassed, red to the ears under a towel. It takes the rest of the stage to calm him down.', F.set('m2'), F.set('lifeguard'))),
    ],
  }),
  F.meet(3, {
    title: 'Lifeguard',
    intro:
      'A tall white lifeguard\'s chair on the beach, and up in it, in a red vest with a whistle, is Finn. He sits straight and watches the water like a hawk. A Floatzel lies at the foot of the chair. ' +
      'He spots you and his face splits into a grin. Finn: "Turns out I\'m a good one."',
    choices: [
      ch('"Battle."', fight('Finn hands his whistle to another lifeguard and jumps down. His Floatzel bounds up the sand, and out past the swimmers a huge Wailord surfaces.',
        spar(FINN, { team: ['floatzel', 'wailord'], size: 2, win: [moment('You beat Lifeguard Finn on his beach')], lose: [moment('Lifeguard Finn beat you on his beach')] }), F.set('done'))),
      ch('"Race."', out('To the buoy and back. You hit the water together, and you touch the buoy first, just, and beat him back to the sand by an arm\'s length. Finn is thrilled to lose. He gives you a Wave Incense from the lifeguard hut.', F.set('done'), item('wave-incense')),
        { prompt: { id: 'hurdle-rhythm', needs: 'good' }, fail: out('To the buoy and back. Finn is a lifeguard now, and it shows: he is waiting on the sand, not even out of breath, when you crawl in. He helps you up and tells you that you are better than he was.', F.set('done')) }),
      ch('"Teach me."', out('Finn takes his job very seriously. He has your Water-types out in the shallows for an hour, kicking, breathing, turning, until they cut through the water faster than they ever have. Water-types in your party gain +1 Speed.', F.set('done'), relic('finn-stroke', 'Finn\'s Stroke', [{ kind: 'statMultiplier', stat: 'spe', type: 'water', value: 1.05 }]))),
    ],
  }),
];

// ---------- RR41. Swimmer Kai (morning, evening; Seaking, Lumineon) ----------
const K = rosterKit('kai', 'npc-meet-swimmer-kai', 'Swimmer Kai');
const KAI = 'Swimmer Kai';
const splashPlate = item('splash-plate');

const kai: Json[] = [
  K.meet(1, {
    title: 'Perfect Water',
    intro:
      'A calm bay, flat as glass, the sky lying in it. A swimmer floats on his back far out with his arms spread, eyes closed, rising and falling on a swell you can barely see. A Seaking circles him lazily. ' +
      'Kai: "The water is perfect today!" He does not open his eyes to say it.',
    choices: [
      ch('"Battle."', fight('Kai rolls over and swims in with long easy strokes. His Seaking and a glowing Lumineon follow him into the shallows.',
        spar(KAI, { team: ['seaking', 'lumineon'], size: 2, win: [moment('You beat Swimmer Kai in his perfect water')], lose: [moment('Swimmer Kai beat you in his perfect water')] }), K.set('m1'))),
      ch('"Float too."', out('You wade out and lie back beside him. The water holds you up like a hand. You float there a long time, saying nothing, while your Pokémon doze on the warm sand. Calm. Your lead comes out of the water a little hardier than it went in.', K.set('m1'), stat('hp'))),
      ch('"Leave."', out('You leave him floating. When you look back from the headland, he has not moved.')),
    ],
  }),
  K.meet(2, {
    title: 'The Storm',
    intro:
      'The bay in a storm. Waves the colour of slate smash over the harbour wall, and rain comes sideways. Kai stands on the shore in a soaked jacket, staring out, his face white. ' +
      'Kai: "Never seen it like this. The fishing boats are still out." Far out, in the murk, little lights are tossing.',
    choices: [
      ch('"Light a beacon."', out('You and Kai drag driftwood up onto the point, and your Fire-type lights it, roaring, in spite of the rain. The beacon burns all night. One by one the little lights turn toward it, and all the boats come home.', K.set('m2'), K.set('beacon')), { requires: [ptype('fire')] }),
      ch('"Swim out."', out('It is madness and you both know it. Kai and your Water-type go out into the surf with a rope, and between them they reach the nearest boat and pull it in, foot by foot, to the harbour steps. The crew fall on the stones and kiss them.', K.set('m2'), K.set('swam')), { requires: [ptype('water')] }),
      ch('"Wait."', out('There is nothing to do but wait. You stand with Kai and the families on the harbour wall all night. By morning the boats come in, one by one, battered. One boat doesn\'t come back.', K.set('m2'), K.set('lost'))),
    ],
  }),
  K.meet(3, {
    title: 'Calm Again',
    intro:
      'The bay calm again, flat and shining, as if the storm never happened. Kai floats out on his back like the first day, then swims in to meet you. ' +
      'Kai: "Water\'s perfect again." He looks out over it for a while. Kai: "Feels different now."',
    choices: [
      ch('"Battle."', fight('Kai nods. His Lumineon glows in the shallows, and something huge stirs further out: a Gyarados, rising from the bay with the sea pouring off it.',
        spar(KAI, { team: ['lumineon', 'gyarados'], size: 2, win: [moment('You beat Swimmer Kai in the calm after the storm')], lose: [moment('Swimmer Kai beat you in the calm after the storm')] }), K.set('done'), splashPlate)),
      ch('"Float."', out('You float with him, the two of you side by side, the bay holding you up. Your team rests on the sand. When you come in, everyone is fully healed. Kai gives you a Splash Plate he found on the seabed after the storm.', K.set('done'), heal(1), splashPlate)),
      ch('"Visit the fishermen."', out('The fishermen know you from the storm. They press free fish on you, and a bag of Berries, three of them, and will not hear a word against it. Kai gives you a Splash Plate he found on the seabed after the storm.', K.set('done'), item('oran-berry', 3), splashPlate)),
    ],
    remembers: [
      variant('lost', [K.is('lost')], {
        notice: 'The fishermen on the harbour wall are quieter than they used to be. One mooring post stands empty.',
        hide: [2],
        add: [
          ch('"Visit the fishermen."', out('The fishermen are quieter now. They press free fish and three Berries on you anyway. Then one of them, an old woman, asks if you will lay a wreath for the boat that did not come back. You lay it on the water together, and Kai gives you a Splash Plate.', K.set('done'), item('oran-berry', 3), moment('You laid a wreath for the boat that never came home'), splashPlate)),
        ],
      }),
    ],
  }),
];

export const EVENTS: Json[] = [...lorna, ...axel, ...hadrian, ...murphy, ...orson, ...amytim, ...miles, ...coral, ...finn, ...kai];
export const REMOVE: string[] = [];

/** Where each event is scripted. */
export const DOC: Record<string, string> = {
  'npc-meet-psychic-lorna': 'RR32 M1', 'npc-meet-psychic-lorna-m2': 'RR32 M2', 'npc-meet-psychic-lorna-m3': 'RR32 M3', 'npc-meet-psychic-lorna-forest': 'RR32 M2 (Quiet)',
  'npc-meet-rocker-axel': 'RR33 M1', 'npc-meet-rocker-axel-m2': 'RR33 M2', 'npc-meet-rocker-axel-m3': 'RR33 M3',
  'npc-meet-rocker-axel-drummer': 'RR33 M2 (Drummer)', 'npc-meet-rocker-axel-setlist': 'RR33 M3 (Request)',
  'npc-meet-ruin-maniac-hadrian': 'RR34 M1', 'npc-meet-ruin-maniac-hadrian-m2': 'RR34 M2', 'npc-meet-ruin-maniac-hadrian-m3': 'RR34 M3', 'npc-meet-ruin-maniac-hadrian-sigil': 'RR34 M2 (Prove)',
  'npc-meet-sailor-murphy': 'RR35 M1', 'npc-meet-sailor-murphy-m2': 'RR35 M2', 'npc-meet-sailor-murphy-m3': 'RR35 M3',
  'npc-meet-sailor-murphy-sea1': 'RR35 M2 (Crew)', 'npc-meet-sailor-murphy-sea2': 'RR35 M2 (Crew)', 'npc-meet-sailor-murphy-island': 'RR35 M3 (Visit)',
  'npc-meet-scientist-dr-orson': 'RR36 M1', 'npc-meet-scientist-dr-orson-m2': 'RR36 M2', 'npc-meet-scientist-dr-orson-m3': 'RR36 M3',
  'npc-meet-sis-and-bro-amy-and-tim': 'RR37 M1', 'npc-meet-sis-and-bro-amy-and-tim-m2': 'RR37 M2', 'npc-meet-sis-and-bro-amy-and-tim-m3': 'RR37 M3',
  'npc-meet-super-nerd-miles': 'RR38 M1', 'npc-meet-super-nerd-miles-m2': 'RR38 M2', 'npc-meet-super-nerd-miles-m3': 'RR38 M3',
  'npc-meet-swimmer-coral': 'RR39 M1', 'npc-meet-swimmer-coral-m2': 'RR39 M2', 'npc-meet-swimmer-coral-m3': 'RR39 M3',
  'npc-meet-swimmer-finn': 'RR40 M1', 'npc-meet-swimmer-finn-m2': 'RR40 M2', 'npc-meet-swimmer-finn-m3': 'RR40 M3',
  'npc-meet-swimmer-kai': 'RR41 M1', 'npc-meet-swimmer-kai-m2': 'RR41 M2', 'npc-meet-swimmer-kai-m3': 'RR41 M3',
};

const REUNION = 'No reader named in the doc: the trainer\'s Meeting 2 or 3 choice, kept for the All-Star Tournament and Final Reunion (ROAD_ROSTER.md, How the Roster runs)';
/** Flags nothing in this file reads. */
export const AFTERSTORY: { match: string; readBy: string }[] = [
  { match: 'roster-lorna-(quiet|steel|focus)', readBy: `${REUNION} (RR32)` },
  { match: 'roster-lorna-first-turn', readBy: 'Needs engine: her Pokémon always act first on turn one (RR32 M1 Battle)' },
  { match: 'roster-axel-(band|solo|reunion)', readBy: `${REUNION} (RR33)` },
  { match: 'roster-axel-loud', readBy: 'Needs engine: sound moves hit harder this battle, both sides (RR33 M1 Battle)' },
  { match: 'roster-axel-song', readBy: 'Needs engine: the requested song plays over the next region (RR33 M3 Request)' },
  { match: 'roster-hadrian-(dug|proved|fought|museum)', readBy: `${REUNION} (RR34)` },
  { match: 'roster-murphy-(sailed|patched|alone)', readBy: `${REUNION} (RR35)` },
  { match: 'roster-orson-(clean|spy|turned)', readBy: `${REUNION}; spy also needs engine: one evil-team plan step shown (RR36 M2)` },
  { match: 'roster-orson-stats', readBy: 'Needs engine: base stats of every wild Pokémon shown for this region (RR36 M3 Data)' },
  { match: 'roster-amytim-(asked|visit|alone|talk)', readBy: `${REUNION} (RR37)` },
  { match: 'roster-miles-(helped|lost|leader)', readBy: `${REUNION} (RR38)` },
  { match: 'roster-miles-weakness', readBy: 'Needs engine: show the team\'s biggest type weakness (RR38 M3 Run)' },
  { match: 'roster-coral-(asked|saved|planted)', readBy: `${REUNION} (RR39)` },
  { match: 'roster-coral-moved', readBy: 'Needs engine: Galarian Corsola start appearing in wild encounters (RR39 M2 Move)' },
  { match: 'roster-finn-(jumped|saved|lifeguard)', readBy: `${REUNION} (RR40)` },
  { match: 'roster-kai-(beacon|swam)', readBy: `${REUNION} (RR41)` },
];
