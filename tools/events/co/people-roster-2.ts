// Catalog Overhaul Pack, people: THE ROAD ROSTER, RR2 to RR11 (ROAD_ROSTER.md lines 82 to 613). Pattern: people-roster-1.ts.
// Build: npm run co:build -- people-roster-2
import { any, ch, companion, cure, ferry, fight, flag, flagIs, forRegion, heal, item, join, out, ptype, room, trade, type Json } from '../dsl.ts';
import { bond, CATEGORY as CAT, moment, rosterKit, spar, variant, wildSpar } from './_people.ts';

export const CATEGORY = CAT;

// ---------- RR2. Aroma Lady Rosalind (evening, night; Bellossom, Vileplume, Comfey) ----------
const RO = rosterKit('rosalind', 'npc-meet-aroma-lady-rosalind', 'Aroma Lady Rosalind');
const ROS = 'Aroma Lady Rosalind';
// "Her Pokémon start with Sweet Scent and Sleep Powder": foeMoves reaches the first Pokémon only (see the report, needs engine).
const rosM1 = (): Json => spar(ROS, { team: ['bellossom', 'vileplume'], foeMoves: ['sweet-scent', 'sleep-powder'], win: [moment('You stayed awake through Rosalind\'s moonflower garden')], lose: [moment('Rosalind\'s moonflowers put your team to sleep')] });
const toCouncil = (text: string): Json => out(text, RO.set('m2'), room(RO.roomId('council')));

const rosalind: Json[] = [
  RO.meet(1, {
    title: 'Smell the Flowers',
    intro:
      'A narrow path winds through a night garden, the gravel pale under a thin moon. A woman in a long skirt kneels by a bed of white moonflowers, her sleeves rolled to the elbow and soil on her knees. She does not look up. Rosalind: "Come. Smell this one. Go on." ' +
      'She tilts a bloom toward you. The scent is sweet and heavy, like warm honey, and your lead gives a slow, enormous yawn. Rosalind smiles at the flower, not at you. Rosalind: "That\'s the trick. Smell the flowers, then fall to them."',
    choices: [
      ch('"Battle."', fight('Rosalind sits back on her heels and whistles softly. A Bellossom and a Vileplume step out from between the stems, shaking pollen from their petals. Before you can call a move the air goes thick and sweet: Sweet Scent first, then Sleep Powder drifting down like snow.',
        rosM1(), RO.set('m1'))),
      ch('"What is that scent?"', fight('Rosalind: "Moonflower. Grows only where someone\'s grieved." She says it lightly, the way people say true things they have had a long time to get used to. Then she brushes the soil from her hands, and her Bellossom and Vileplume rise from the bed, already shedding Sweet Scent and Sleep Powder into the dark.',
        rosM1(), RO.set('m1'), RO.set('asked'))),
      ch('"Hold my breath and leave."', out('You fill your lungs and walk briskly past the flowerbed, cheeks puffed out. Rosalind laughs, a low warm sound, and waves you on with her trowel. The smell follows you halfway down the path anyway.')),
    ],
  }),
  RO.meet(2, {
    title: 'The Bare Garden',
    intro:
      'The same garden, or what is left of it. The beds have been dug up and the moonflowers lie in heaps by the path, roots in the air, already wilting. Stakes with orange tape mark out neat rectangles in the dirt. Rosalind sits on an upturned crate with a trowel in her lap, looking at nothing. ' +
      'Rosalind: "The town wants a car park." She turns the trowel over and over in her hands. Rosalind: "My husband planted the first moonflower here. Forty years ago."',
    choices: [
      ch('"Fight the town."', out('Rosalind looks up for the first time. Something in her face sets, like soil after rain. Rosalind: "Then we\'ll need names. A lot of names." She pulls a clipboard out from under the crate. She has clearly had it ready for a while.', RO.set('m2'), room(RO.roomId('petition')))),
      // TODO(takeNode): "One rest node spent digging" (the shared takeNode effect is not merged yet).
      ch('"Move the garden."', out('You spend the rest of the evening on your knees beside her, lifting moonflowers one by one with their roots wrapped in wet newspaper. It costs you a whole rest, and your back aches, but by midnight the last bloom is settled in the little yard behind her house. Rosalind pats the soil flat and is quiet a long time. Rosalind: "Thank you."',
        RO.set('m2'), RO.set('moved'))),
      ch('"Plant one somewhere else."', out('Rosalind chooses one moonflower from the heap, the healthiest, and wraps its roots in her own scarf. Rosalind: "Somewhere it\'s needed. You\'ll know." You carry it carefully on top of your bag. The next time you stop to rest it opens, white and sweet, and your whole team sleeps better than they have in days.',
        RO.set('m2'), RO.set('carried'), moment('You carried one of Rosalind\'s moonflowers to a new place'))),
    ],
    remembers: [
      variant('asked', [RO.is('asked')], {
        notice: 'Rosalind looks at you for a long moment. Rosalind: "You remembered what grows here." Half the town already knows her story; with you beside her, the petition is as good as signed.',
        hide: [0],
        add: [ch('"Fight the town."', toCouncil('Rosalind stands up off the crate. Rosalind: "Then we go straight to the council." The names come easily: the baker, the postman, the children who used to steal the flowers. By evening the petition is full, and the council meets tonight.'))],
      }),
    ],
  }),
  RO.room('petition', {
    title: 'The Petition',
    intro: 'Market morning. You and Rosalind stand by the fountain with the clipboard and a jam jar of moonflower cuttings. People slow down, read the heading, and look at her. Some of them remember her husband. Some only remember the smell on summer nights.',
    choices: [
      ch('"Knock on every door."', out('By noon your feet hurt and the clipboard holds four pages of names, some in wobbly children\'s writing. An old man signs twice by mistake and refuses to cross one out. Rosalind tucks the pages into her coat like a love letter. The council meets tonight.', room(RO.roomId('council')))),
      ch('"Hand out cuttings."', out('Every cutting buys a signature, and some buy a story: a first kiss by the moonflowers, a dog buried under them, a grandmother who walked there every night. Rosalind listens to every one. By evening the jar is empty and the pages are full.', room(RO.roomId('council')))),
    ],
  }),
  RO.room('council', {
    title: 'The Council',
    intro: 'The council chamber smells of floor polish and old coffee. The mayor is "unavailable." His aide, a sharp young man with a sharper Pokémon, stands between Rosalind and the table where the plans are spread. Aide: "Plans are plans. If you want them changed, you\'ll have to make me." Rosalind lays the petition down beside the plans and looks at you.',
    choices: [
      ch('"Battle the aide."', fight('The aide sighs as if this happens every week and sends out his team. Behind you, someone from the market starts to clap. Win or lose, the room has seen the names, and by the end of the night the car park moves to the far side of town.',
        spar('The Mayor\'s Aide', { types: ['normal'], win: [moment('You beat the mayor\'s aide and saved Rosalind\'s garden')], lose: [moment('The petition saved Rosalind\'s garden, if not your pride')] }), RO.set('saved'))),
      ch('"Let Rosalind speak first."', fight('Rosalind reads out the names, every one, in a clear voice that does not shake once. When she is done the councillors are looking at their shoes. The aide sends out his team anyway, for form\'s sake, but the vote is already over: the car park moves to the far side of town.',
        spar('The Mayor\'s Aide', { types: ['normal'], win: [moment('You beat the mayor\'s aide and saved Rosalind\'s garden')], lose: [moment('The petition saved Rosalind\'s garden, if not your pride')] }), RO.set('saved'))),
    ],
  }),
  RO.meet(3, {
    title: 'First Bloom',
    intro:
      'Night again, and warm. In a new bed edged with river stones, the moonflowers are opening one by one, slowly, like hands unclenching. Rosalind is dressed up: a good coat, a silver brooch, her hair pinned with care. She has brought two folding chairs. ' +
      'Rosalind: "It bloomed. I wanted someone to see it with me."',
    choices: [
      // Reward: "a Miracle Seed or a moonflower (held: the holder can't be put to sleep)". The moonflower is a new item (see the report); the Miracle Seed is given.
      ch('"Sit with her."', out('You sit. For a long while neither of you says anything, and the flowers open around you with tiny papery sounds. The scent settles over your team like a blanket, and every ache and fever and sting eases out of them. When you finally stand, Rosalind presses a Miracle Seed into your palm and folds your fingers over it.',
        cure(), item('miracle-seed'), RO.set('done'))),
      ch('"Battle, one last time."', fight('Rosalind laughs and claps her gloved hands. A Comfey drifts out from behind her brooch, trailing its ring of flowers, and her Bellossom and Vileplume follow it onto the path. She laughs the whole way through, at good moves and bad ones, hers and yours.',
        spar(ROS, { team: ['comfey', 'bellossom', 'vileplume'], size: 3, win: [item('miracle-seed'), moment('You and Rosalind battled under her first moonflowers')], lose: [moment('Rosalind laughed all through your last battle')] }), RO.set('done'))),
      ch('"Bring my team."', out('You call everyone out. One by one your Pokémon push their noses into the moonflowers, sneeze, sniff again, and go soft-eyed and quiet. Rosalind watches each one as if she is memorising them. She gives you a Miracle Seed for the road.',
        bond(1, 'party'), item('miracle-seed'), RO.set('done'))),
    ],
    remembers: [
      variant('named-bed', [RO.is('carried')], { notice: 'Rosalind points to the oldest bloom at the centre of the bed. Rosalind: "That one\'s from the flower you carried. The whole bed grew from it." A little painted stick in the soil beside it bears your name.' }),
      variant('saved', [RO.is('saved')], { notice: 'Over the hedge you can see the old garden, saved, its gate open, and a bench by the gate with a brass plate for her husband.' }),
      variant('moved', [RO.is('moved')], { notice: 'This is her own yard. The moonflowers you dug up together crowd right up to her back step, and her kettle is whistling in the kitchen.' }),
    ],
  }),
];

// ---------- RR3. Beauty Bianca (morning, night; Milotic, Sylveon) ----------
const BI = rosterKit('bianca', 'npc-meet-beauty-bianca', 'Beauty Bianca');
const BIA = 'Beauty Bianca';
const biaM1 = (): Json => spar(BIA, { team: ['milotic'], size: 1, win: [moment('You beat Bianca without a scuff')], lose: [moment('Bianca\'s Milotic outshone your team')] });
/** "+10% prize money if the player wins": a one-battle bonus, applied before the fight. */
const glow: Json = { kind: 'tempEffect', label: 'Bianca glows', effects: [{ kind: 'moneyMultiplier', value: 1.1 }], battles: 1, until: 'battle' };

const bianca: Json[] = [
  BI.meet(1, {
    title: 'Sparkle',
    intro:
      'A boardwalk over bright water, gulls wheeling overhead. A woman in a wide sun hat holds up a hand mirror, fixes a curl that was not out of place, then turns the mirror so it flashes right in your eyes. Bianca: "My Pokémon sparkle, and so do I. Do you?" ' +
      'Behind her a Milotic lifts its head over the railing, its scales throwing little rainbows across the planks. Bianca: "Battle me. Try not to get scuffed."',
    choices: [
      ch('"Battle."', fight('Bianca snaps her mirror shut. Her Milotic pours over the railing like a ribbon of light and takes the lead, every scale catching the sun.', biaM1(), BI.set('m1'))),
      ch('"You look lovely."', fight('Bianca glows. She actually glows, pink to the ears, and has to fan herself with the mirror. Bianca: "Well. Aren\'t you sweet." She is so pleased that if you beat her today, she will pay you a little extra prize money.', biaM1(), glow, BI.set('m1'))),
      ch('"I don\'t sparkle."', fight('Bianca: "Everyone does. You just don\'t polish." She tucks a stray hair behind your ear, very briskly, like an aunt. Then her Milotic slides forward over the planks and the battle begins.', biaM1(), BI.set('m1'), BI.set('polish'))),
    ],
  }),
  BI.meet(2, {
    title: 'Scuffed',
    intro:
      'You almost walk right past her. No hat, no makeup, a plaster cast on one arm, hair tied back with a rubber band. Her Milotic lies beside her on a beach towel, one long fin torn and bandaged. Bianca: "A wild Gyarados on the coast road. My Milotic got between us." ' +
      'She strokes the bandaged fin with her good hand, very gently. Bianca: "I\'m supposed to be in a contest Friday. Look at us."',
    choices: [
      ch('"Enter anyway."', out('Friday comes, and Bianca walks on stage as she is: cast, bandage, not a speck of powder. The judges mark her down in the beauty round. The crowd does not care. When Milotic lifts its torn fin into the lights, the whole hall stands, and they are still clapping when she walks off.',
        BI.set('m2'), BI.set('brave'), moment('Bianca entered her contest scuffed and won the crowd'))),
      ch('"Heal first."', out('Bianca hesitates, then nods. Bianca: "There\'s a specialist up the coast. Two days\' walk." You carry the towel; she carries her pride.', BI.set('m2'), room(BI.roomId('coast-road')))),
      ch('"I\'ll enter for you."',
        out('You walk on stage in her place with your own Pokémon, and the round goes beautifully: every beat hit, every turn clean. In the front row Bianca is on her feet, cast and all, cheering louder than anyone in the hall.', BI.set('m2'), BI.set('stand-in')),
        { prompt: { id: 'echo-rhythm', needs: 'good' }, fail: out('You walk on stage in her place, and the round goes wrong: a missed cue, a stumble, a judge wincing. You hear Bianca anyway, right through it, cheering from the front row as if you had won. Bianca: "That\'s sparkle!"', BI.set('m2'), BI.set('stand-in')) }),
    ],
    remembers: [
      variant('no-polish', [BI.is('polish')], { notice: 'Bianca looks up at you and almost laughs. Bianca: "You were right. I\'ll go without polish." If she enters anyway, it will cost her nothing she minds losing.' }),
    ],
  }),
  BI.room('coast-road', {
    title: 'The Coast Road',
    intro: 'The coast road, the same one. Bianca walks slower here, watching the water. Her Milotic rides in a borrowed handcart, and every wave that breaks too loud makes it flinch.',
    choices: [
      ch('"Keep to the cliff path."', out('You take the long way, high above the water. It costs most of the day, but Milotic stops flinching, and by evening Bianca is humming.', room(BI.roomId('specialist')))),
      ch('"Sing to Milotic."', out('You hum something, badly. Bianca joins in, worse. Milotic lays its head on the side of the cart and closes its eyes for the first time since the Gyarados.', room(BI.roomId('specialist')))),
    ],
  }),
  BI.room('specialist', {
    title: 'The Specialist',
    intro: 'A white clinic at the end of the coast, with a Chansey at the door. The specialist unwraps the fin, hums, and says it will mend clean if they stay three days. The contest is tomorrow. Bianca looks at the date on the wall for a long moment.',
    choices: [
      ch('"Stay."', out('Bianca: "There\'ll be other Fridays." She says it lightly and does not quite manage it. But three days later the fin is whole, and her Milotic swims a full lap of the clinic pool, shining. She misses the contest and does not mention it once.', BI.set('healed'))),
      ch('"Hold her hand."', out('You sit with her through the first night. She misses the contest. She does not miss Milotic waking up and nosing her cast, very gently, as if checking that she healed too.', BI.set('healed'))),
    ],
  }),
  BI.meet(3, {
    title: 'New Shine',
    intro:
      'A contest hall, bright as noon, ribbons everywhere. At the judges\' table, in a silver dress with her sleeve pinned back to show a thin pale scar down her arm, sits Bianca. Her Milotic lies coiled beside her chair. ' +
      'Bianca: "They asked me to judge. Because of the scar. Isn\'t that funny?" She does not sound as if she thinks it is funny. She sounds proud.',
    choices: [
      ch('"Enter her contest."',
        out('Your round is clean and bright, and Bianca scores it honestly, which means high. She leans across the table as you leave the stage. Bianca: "That had real shine." She slips you a Prism Scale wrapped in tissue paper.', BI.set('done'), item('prism-scale')),
        { prompt: { id: 'echo-rhythm', needs: 'good' }, fail: out('Your round wobbles, and Bianca scores it honestly, which means low. She catches you at the stage door anyway. Bianca: "Scuffed is fine. Scuffed is how you start." She gives you a Prism Scale wrapped in tissue paper.', BI.set('done'), item('prism-scale')) }),
      ch('"Battle her."', fight('Bianca stands, smooths her dress, and steps down from the judges\' table onto the floor. Her new partner leads: a Sylveon, ribbons trailing, with Milotic gliding behind it.',
        spar(BIA, { team: ['sylveon', 'milotic'], win: [item('prism-scale'), moment('You battled Bianca, the judge with the scar')], lose: [moment('Bianca\'s new Sylveon outshone your team')] }), BI.set('done'))),
      ch('"Ask about the Gyarados."', out('Bianca\'s smile goes still. Bianca: "It wasn\'t an ordinary one. It was an Alpha." She folds her hands on the table. Bianca: "It\'s still out there on the coast road. Would you calm it? For both of us." She presses a Prism Scale into your hand, as if paying in advance.',
        BI.set('done'), BI.set('gyarados'), item('prism-scale'))),
    ],
    remembers: [
      variant('brave', [BI.is('brave')], { notice: 'On the wall behind her hangs a photograph from that Friday: Bianca in her cast, Milotic\'s torn fin raised, the whole crowd on its feet.' }),
      variant('healed', [BI.is('healed')], { notice: 'Bianca catches your eye and lifts her healed arm a little, then nods at Milotic\'s fin, mended into a shining seam. Bianca: "Clean seams. Both of us."' }),
      variant('stand-in', [BI.is('stand-in')], { notice: 'Bianca waves at you from the table with both hands. Bianca: "My stand-in! Everyone, this one entered for me."' }),
    ],
  }),
];

// ---------- RR4. Biker Ryder (evening, night; Weezing, Scrafty) ----------
const RY = rosterKit('ryder', 'npc-meet-biker-ryder', 'Biker Ryder');
const RYD = 'Biker Ryder';
const ryM1 = (): Json => spar(RYD, { team: ['weezing', 'scrafty'], win: [moment('You beat Ryder on the open road')], lose: [moment('Ryder roared off after beating you')] });
/** Reward: "free deliveries for the region" (needs engine; see the report). */
const deliveries = RY.set('free-deliveries');

const ryder: Json[] = [
  RY.meet(1, {
    title: 'Out of My Way',
    intro:
      'The engine comes first, then the bike: it roars up the road and skids sideways in a spray of gravel, blocking the way completely. The rider pulls off a dented helmet with a sticker half peeled off the side. Ryder: "Out of my way, rookie!" ' +
      'He waits. You do not move. He shifts on the seat. Ryder: "Or, you know. Battle me. Either."',
    choices: [
      ch('"Battle."', fight('Ryder grins, all teeth, and kicks the stand down. A Weezing rolls out of a saddlebag in a cloud of exhaust-coloured smog, and a Scrafty hops off the back seat, hitching up its skin like trousers.', ryM1(), RY.set('m1'))),
      ch('"Move aside."', out('You step onto the verge. Ryder looks almost disappointed, then guns the engine and roars off in a cloud of dust. One less battle today. Far down the road, you hear him whoop.')),
      ch('"Nice bike."', fight('Ryder stops. He looks at the bike, at the dent in the tank, at the old chrome he clearly polishes every night. Ryder: "...It was my dad\'s." He is quieter after that, and when he sends out his Weezing and Scrafty, he does it without the shouting.', ryM1(), RY.set('m1'), RY.set('bike'))),
    ],
  }),
  RY.meet(2, {
    title: 'The Gang',
    intro:
      'A diner car park at night, neon buzzing pink over the puddles. A dozen bikes lean in a row, and their riders laugh too loud by the door. Ryder sits apart on the kerb with his helmet between his boots. Ryder: "They want me to do a job. Rob a delivery van." ' +
      'He scrapes at the dent in the helmet with his thumbnail. Ryder: "If I don\'t, I\'m out. If I do, I\'m what my dad was."',
    choices: [
      ch('"Don\'t."', fight('Ryder stands up and tells them. The car park goes quiet. Then four of them step forward, and four Pokémon come out of four saddlebags. Ryder\'s Scrafty moves to stand beside your lead without being asked. Two against four.',
        spar('The Gang', { format: 'doubles', size: 4, types: ['poison', 'dark'], ally: 'scrafty', win: [moment('You and Ryder faced down his old gang together')], lose: [moment('Ryder walked away from his gang, bruised but free')] }), RY.set('m2'), RY.set('left-gang'))),
      ch('"Do it and tip the police."', out('Ryder does the job. Halfway through, he stops at a phone box and calls Officer Jenny himself. The sirens catch the whole gang at the van, and him with them. As they put him in the car he looks at you through the window and nods, once, like a man who has finally paid for something.',
        RY.set('m2'), RY.set('arrested'))),
      ch('"Ride with me instead."', out('Ryder looks at you, then at the gang, then at his dad\'s bike. He pulls on the dented helmet. For the next stretch of road his engine rumbles a polite distance behind you, and when the gang roars past looking for him, they never think to look behind a rookie.',
        RY.set('m2'), RY.set('rode'), companion(1))),
    ],
    remembers: [
      variant('bike', [RY.is('bike')], { notice: 'Ryder pats the tank of the bike beside him. Ryder: "Only thing my dad left me that isn\'t trouble." He says it to the bike, not to you.' }),
    ],
  }),
  RY.meet(3, {
    title: 'Delivery',
    intro:
      'A delivery bike, very clean, with a Pokémon Center cross painted on the box. Ryder sits on it in a courier\'s jacket two sizes too neat for him, his helmet polished, the dent still there. Ryder: "Got a job. Real one. I deliver for the Pokémon Center." He cannot stop grinning.',
    choices: [
      ch('"Race me."',
        out('You win by a wheel\'s length and Ryder whoops louder than you do. Ryder: "Fine! Winner gets a courier." He will carry one thing of yours ahead to any stop down the road, no charge, and deliveries are free for you all region.', RY.set('done'), RY.set('carry'), deliveries),
        { prompt: { id: 'hurdle-rhythm', needs: 'good' }, fail: out('Ryder wins by a wheel\'s length and does a lap of honour he has clearly practised. Then he slaps your back. Ryder: "Deliveries are free for you anyway. Rookie rate."', RY.set('done'), deliveries) }),
      ch('"Battle."', fight('Ryder sends out his Weezing, then his Scrafty. The smog is thinner now, more like morning mist, and he calls his moves instead of shouting them. His team is calmer, and somehow that makes it harder to beat. Win or lose, he says your deliveries are free for the region.',
        spar(RYD, { team: ['weezing', 'scrafty'], win: [moment('You battled Ryder the courier')], lose: [moment('Ryder the courier beat you, calmly')] }), RY.set('done'), deliveries)),
      ch('"Deliver something for me."', out('You think of someone you met on this road and write them a few lines on the back of a map. Ryder tucks it into the box like it is the most important parcel in the region. Ryder: "Signed for. Every time." He roars off, and for once nobody minds the noise. Your deliveries ride free for the rest of the region.',
        RY.set('done'), deliveries, moment('Ryder carried your letter to someone you met on the road'))),
    ],
    remembers: [
      variant('halfway-house', [RY.is('arrested')], {
        intro:
          'Not a road this time: a halfway house with a vegetable patch and a sign that says VISITORS WELCOME. Ryder is in the kitchen in an apron, up to his elbows in potatoes, a clean delivery bike leaning outside the window. ' +
          'He laughs out loud when he sees you, at himself, at all of it. Ryder: "Got a job. Real one. I deliver for the Pokémon Center." He waves a peeler. Ryder: "Afternoons. Mornings, I peel."',
      }),
      variant('left-gang', [RY.is('left-gang')], { notice: 'Ryder\'s Scrafty wears a little courier cap now. Ryder: "Nobody\'s come looking. Not once since that car park."' }),
      variant('rode', [RY.is('rode')], { notice: 'Ryder taps his horn twice, the way he did riding behind you. Ryder: "Never did find me, did they."' }),
    ],
  }),
];

// ---------- RR5. Bird Keeper Perry (morning, afternoon; Pidgeotto, Swellow, Staraptor) ----------
const PE = rosterKit('perry', 'npc-meet-bird-keeper-perry', 'Bird Keeper Perry');
const PER = 'Bird Keeper Perry';

const perry: Json[] = [
  PE.meet(1, {
    title: 'Ride the Wind',
    intro:
      'A windy hilltop, the grass flattened into silver waves. A man in a heavy coat stands with binoculars, three birds circling over him in wide, lazy loops. He does not lower the binoculars when you arrive. Perry: "Watch them ride the wind! Look at the left one. She\'s showing off." ' +
      'The left one, a Swellow, folds her wings and drops like a stone, then flicks up at the last second, screaming with joy.',
    choices: [
      // "First turn, all faster": needs engine (see the report).
      ch('"Battle."', fight('Perry whistles once and all three birds peel out of the sky at once: Pidgeotto, Swellow, Staraptor. They are on you before your team has blinked, every one of them faster than anything on your side for that first turn.',
        spar(PER, { team: ['pidgeotto', 'swellow', 'staraptor'], size: 3, win: [moment('You beat Perry\'s three birds')], lose: [moment('Perry\'s birds were too fast for you')] }), PE.set('m1'))),
      // TODO(takeNode): "One node passes" (the shared takeNode effect is not merged yet).
      ch('"Watch with him."', out('You stand beside Perry and watch until your eyes water. He names every thermal and every trick, and the time it takes to cross a whole stop slips away. But your own flying Pokémon have been watching too, and for the rest of the region they ride the wind like the Swellow does.',
        PE.set('m1'), PE.set('watched'), forRegion('Riding the wind', { kind: 'statMultiplier', stat: 'spe', type: 'flying', value: 1.05 }))),
      ch('"Leave."', out('You leave Perry to his birds. He does not notice you go; the Swellow is showing off again, and he is laughing at her.')),
    ],
  }),
  PE.meet(2, {
    title: 'One Missing',
    intro:
      'The same hilltop, the same coat. But only two birds circle overhead now, and they keep turning north, as if listening for something. Perry\'s binoculars hang forgotten on his chest. Perry: "Swellow didn\'t come back. Three days." ' +
      'He rubs his left knee, slowly. Perry: "Storm took her north. I can\'t climb up there anymore."',
    choices: [
      ch('"I\'ll find her."', out('Perry grips your arm hard, then presses his binoculars into your hands. Perry: "She\'ll come to a whistle. Two short, one long." You head north toward the storm-torn ridges.', PE.set('m2'), room(PE.roomId('north')))),
      ch('"She\'ll come back."', out('You sit with him. The wind blows. Perry does not believe you and then, later, a little, does. The next stage she comes back on her own: limping through the air, one wing held wrong, landing in his arms as if she never meant to leave.', PE.set('m2'), PE.set('waited'))),
      ch('"Get another."', out('Perry: "That\'s not how it works." He turns his back on you and lifts the binoculars north again. He does not lower them until you are gone.', PE.set('m2'), PE.set('cold'))),
    ],
    remembers: [
      variant('watched', [PE.is('watched')], { notice: 'Perry nods when he sees you. He remembers you standing with him in the wind, watching her show off.' }),
    ],
  }),
  PE.room('north', {
    title: 'North of the Storm',
    intro: 'North of Perry\'s hill the land breaks into ridges and torn trees, the storm\'s path still written in snapped branches. Wind howls through the gaps. Somewhere up here is a Swellow who did not come home.',
    choices: [
      ch('"Whistle: two short, one long."', out('You whistle until your lips go numb. On the third try, very faint, something whistles back from higher up the ridge.', room(PE.roomId('nest')))),
      ch('"Follow the feathers."', out('Blue-black feathers, caught in thorns, one every few hundred steps. You follow them up the ridge as the light goes gold.', room(PE.roomId('nest')))),
    ],
  }),
  PE.room('nest', {
    title: 'The Nest',
    intro: 'Under an overhang on the highest ridge, Swellow is grounded, one wing dragging at a terrible angle. Behind her, in a scrape of dry grass, a nest of Taillow chicks gape and cheep. She hisses at you, broken wing and all, and does not budge an inch from the nest.',
    choices: [
      ch('"Splint the wing."', out('You move slowly, talking the whole time. In the end she lets you, and you strap the wing to a straight stick with your own scarf. You carry the whole nest down the ridge in your hat. When Perry sees you coming, he has to sit down in the grass.', PE.set('found'))),
      ch('"Stay till she trusts you."', out('You sit by the overhang all night, sharing your food with a nest of very loud chicks. By morning Swellow lets you lift them. Perry meets you halfway up the hill, knee or no knee, crying openly.', PE.set('found'))),
    ],
  }),
  PE.meet(3, {
    title: 'The Flock',
    intro:
      'The hilltop is crowded with birds: on the fence, in the grass, on Perry\'s hat. Swellow sits on his shoulder, and young Taillow trip over each other around his boots. Perry: "She brought her chicks. They think I\'m their grandad." One of them tries to climb his coat. He lets it.',
    choices: [
      ch('"Battle."', fight('Perry whistles and the sky fills: Staraptor, Swellow, Pidgeotto and the three boldest chicks, six birds, all fast, all screaming with joy.',
        spar(PER, { team: ['staraptor', 'swellow', 'pidgeotto', 'taillow', 'taillow', 'taillow'], size: 6, win: [item('sharp-beak'), moment('You beat Perry\'s whole flock')], lose: [moment('Perry\'s flock ran rings round you')] }), PE.set('done'))),
      ch('"Take a chick."', out('Perry kneels and lets the chicks choose. The boldest Taillow hops onto your boot and will not get off. Perry: "That one. She\'s got her mother\'s nerve." He wipes his eyes on his sleeve.', PE.set('done'), join({ species: ['taillow'] }))),
      ch('"Fly with them."', out('Perry\'s Staraptor lowers its back for you. You climb on and the whole flock lifts with you, round the hill and over the next stretch of road, wind roaring, Perry a tiny waving figure below. You land well ahead. A Taillow catches up with a Sharp Beak tied to its foot, from him.',
        PE.set('done'), ferry(), item('sharp-beak'))),
    ],
    remembers: [
      variant('cold', [PE.is('cold')], {
        intro: 'The hilltop again, and birds on every post. Perry stands among them, polite and distant, and nods to you the way you nod to a stranger. Swellow is on his shoulder; there are no chicks. He does not say how she came home, and you do not ask.',
        hide: [0, 1],
        add: [ch('"Battle."', fight('Perry whistles. Staraptor, Swellow and Pidgeotto drop out of the sky, fast and clean. He battles like a professional, and afterwards shakes your hand like one.',
          spar(PER, { team: ['staraptor', 'swellow', 'pidgeotto'], size: 3, win: [item('sharp-beak'), moment('You beat Perry\'s birds, and he shook your hand')], lose: [moment('Perry\'s birds beat you, politely')] }), PE.set('done')))],
      }),
      variant('found', [PE.is('found')], { notice: 'Swellow lands on your shoulder instead of Perry\'s, the old splint mark still in her feathers. Perry: "She remembers who carried her down."' }),
      variant('waited', [PE.is('waited')], { notice: 'Swellow\'s wing never quite set straight; she flies with a little hitch now. Perry: "Came home on her own. Stubborn, like me."' }),
    ],
  }),
];

// ---------- RR6. Black Belt Kenji (morning; Machoke, Hitmonlee, Hitmonchan) ----------
const KE = rosterKit('kenji', 'npc-meet-black-belt-kenji', 'Black Belt Kenji');
const KEN = 'Black Belt Kenji';
const pass = (text: string): Json => out(text, KE.set('done'), item('black-belt'), moment('You judged the black belts at Kenji\'s dojo'));

const kenji: Json[] = [
  KE.meet(1, {
    title: 'Hup',
    intro:
      'A dojo yard at dawn, the sand raked into neat lines and dew on the practice posts. A man in a white gi does push-ups on his knuckles, counting under his breath, sweat dripping off his nose. He springs up when he sees you. Kenji: "Hup! Train the body, train the Pokémon!" ' +
      'He points at the sand. Kenji: "You. Twenty push-ups, then we battle."',
    choices: [
      ch('"Do the push-ups."', fight('You get down in the cold sand and do twenty. The last five are ugly, but you do them. Kenji counts every one aloud and bows at the end, very properly. Out of respect, he sends out only his Machoke.',
        spar(KEN, { team: ['machoke'], size: 1, win: [moment('You did twenty push-ups and beat Kenji\'s Machoke')], lose: [moment('Kenji\'s Machoke beat you after your push-ups')] }), KE.set('m1'), KE.set('pushups'))),
      ch('"Just battle."', fight('Kenji grunts, not unhappy, and steps back. A Machoke and a Hitmonchan stride into the yard and bow to you before they raise their fists.',
        spar(KEN, { team: ['machoke', 'hitmonchan'], win: [moment('You beat Kenji in his dojo yard')], lose: [moment('Kenji\'s fighters beat you at dawn')] }), KE.set('m1'))),
      ch('"Skip."', out('Kenji: "Soft." He drops straight back into his push-ups and does not look up again. Somehow it stings more than a lost battle would.')),
    ],
  }),
  KE.meet(2, {
    title: 'The Old Knee',
    intro:
      'The dojo, but quiet. Kenji sits on a chair at the edge of the mat, his knee strapped in a heavy brace, a walking stick hooked over the chair back. The rack of practice gis is half empty. Kenji: "Can\'t kneel. Can\'t spar. My students are leaving." ' +
      'He stares at the mat. Kenji: "I can still teach. Nobody wants a teacher who can\'t show."',
    choices: [
      ch('"Teach from the chair."', out('Kenji frowns, then nods. Kenji: "Then you show. I\'ll talk." He points his stick at the empty mat, and you realise you are about to lead a class.', KE.set('m2'), room(KE.roomId('class')))),
      ch('"Let your Pokémon teach."', out('Kenji whistles, and his Machoke steps onto the mat and runs through every form, slow and then fast, while Kenji calls the counts from his chair. The children by the door creep back in one by one. By the end they are all copying Machoke and shrieking with laughter.', KE.set('m2'), KE.set('pokemon'))),
      ch('"Train me."', out('Kenji looks at your lead for a long time. Then he leans forward on his stick, and the old voice comes back into him. Kenji: "Two choices. Low and fast, or straight and faster. Pick."', KE.set('m2'), room(KE.roomId('lesson')))),
    ],
    remembers: [
      variant('pushups', [KE.is('pushups')], { notice: 'Kenji brightens a little when he sees you. Kenji: "Twenty push-ups. Ugly ones. I remember."' }),
    ],
  }),
  KE.room('class', {
    title: 'The Class',
    intro: 'Three children stand on the mat in gis too big for them, and you stand in front of them. Kenji sits behind you with his stick across his knees. Kenji: "Stance first. Show them."',
    choices: [
      ch('"Show them the stance."', out('You plant your feet the way Kenji tells you, and the children copy you, wobbling. Kenji corrects all four of you from his chair, sharp and funny. At the end of the class three students write their names back on the dojo board.', KE.set('chair'))),
      ch('"Let them spar with my team."', out('Your team spars with three tiny students, very gently, while Kenji calls every move from his chair like a commentator. When the parents come, three names go back up on the dojo board.', KE.set('chair'))),
    ],
  }),
  KE.room('lesson', {
    title: 'The Lesson',
    intro: 'Kenji has your lead on the mat in front of his chair, talking it through the move one piece at a time, tapping the floor with his stick on every beat. Kenji: "Low Kick takes their feet. Mach Punch beats them to it."',
    choices: [
      ch('"Low Kick."', out('By sundown your lead sweeps the practice post clean off its base. Kenji nods once. That is apparently the highest praise there is.', KE.set('trained'), { kind: 'teachMove', move: 'low-kick' })),
      ch('"Mach Punch."', out('By sundown your lead hits the post before Kenji has finished saying "now." He laughs out loud, for the first time since the knee.', KE.set('trained'), { kind: 'teachMove', move: 'mach-punch' })),
    ],
  }),
  KE.meet(3, {
    title: 'Grading Day',
    intro:
      'The dojo is full: parents on benches, students in rows, belts laid out on a low table like a rainbow that ends in black. Kenji stands on his stick, brace under his gi, as proud as a man can be. Kenji: "I need one more judge for the black belts. You."',
    choices: [
      ch('"Judge."', out('Kenji hands you a scoring card and a stub of pencil, and three candidates in white step onto the mat and bow to you.', room(KE.roomId('grading')))),
      ch('"Spar the students."', fight('Kenji calls three of his best. One at a time, one Pokémon each, quick and hard, while the whole room counts every round aloud.',
        spar('Kenji\'s Students', { types: ['fighting'], size: 1, chain: 3, win: [item('black-belt'), moment('You beat three of Kenji\'s students on grading day')], lose: [moment('Kenji\'s students beat you on grading day')] }), KE.set('done'))),
      ch('"Spar Kenji."', fight('Kenji does not stand. He sits on his chair at the edge of the mat and fights through his Pokémon, calling every move a beat before you think of yours: Machoke, Hitmonlee, Hitmonchan. He is brilliant, and the whole room knows it.',
        spar(KEN, { team: ['machoke', 'hitmonlee', 'hitmonchan'], size: 3, lv: 1, win: [item('black-belt'), moment('You beat Kenji, who fought sitting down')], lose: [moment('Kenji beat you without getting up')] }), KE.set('done'))),
    ],
    remembers: [
      variant('chair', [KE.is('chair')], { notice: 'Three of the students in the front row are the ones you taught from the chair. They wave at you, then remember they are supposed to be serious.' }),
      variant('pokemon', [KE.is('pokemon')], { notice: 'Machoke stands beside Kenji as his assistant instructor, wearing a black belt of its own.' }),
      variant('trained', [KE.is('trained')], { notice: 'Kenji glances at your lead and checks its stance from across the room. Kenji: "Good. You kept practising."' }),
    ],
  }),
  KE.room('grading', {
    title: 'The Black Belts',
    intro: 'Three candidates bow to the judges. Mika is fast and sure. Taro falls twice in the forms and gets straight back up both times. Little Sora barely makes a sound, and her Pokémon does not miss a single count. Kenji leans over. Kenji: "One black belt left. Your call."',
    choices: [
      ch('"Mika."', pass('Mika bows so low her forehead touches the mat. Kenji ties the black belt on her himself, his hands steady. Afterwards he presses a Black Belt of his own into your hands, old and soft from years of wear.')),
      ch('"Taro."', pass('Taro stares at you as if you have made a mistake, then realises you have not. Kenji: "Good pick. He gets up." He gives you a Black Belt of his own, old and soft from years of wear.')),
      ch('"Sora."', pass('Sora does not say anything. She holds the black belt in both hands for the rest of the afternoon. Kenji nods slowly and gives you a Black Belt of his own, old and soft from years of wear.')),
    ],
  }),
];

// ---------- RR7. Bug Catcher Wade (morning, afternoon; Beedrill, Butterfree, Scyther) ----------
const WA = rosterKit('wade', 'npc-meet-bug-catcher-wade', 'Bug Catcher Wade');
const WAD = 'Bug Catcher Wade';
const wadeM1 = (lv = 0): Json => spar(WAD, { team: ['beedrill', 'butterfree'], lv, win: [moment('You beat Wade\'s bugs at the forest edge')], lose: [moment('Wade\'s bugs were tougher than they looked')] });

const wade: Json[] = [
  WA.meet(1, {
    title: 'Tougher Than They Look',
    intro:
      'A forest edge, sun coming through the leaves in bright coins. A boy with a net taller than he is holds up a jar with something buzzing furiously inside. Wade: "Bugs are way tougher than they look!" ' +
      'He hugs the jar to his chest. Wade: "Everyone at school says they\'re gross. Watch."',
    choices: [
      ch('"Battle."', fight('Wade unscrews the jar. A Beedrill zips out, stingers up, and a Butterfree floats down from a branch where it was waiting all along.', wadeM1(), WA.set('m1'))),
      ch('"Show me your favourite."', fight('Wade\'s face lights up. He digs in his shirt pocket and brings out a tiny Weedle on his palm. Wade: "This is Spike. He\'s going to be huge." Spike wiggles importantly. Then Wade tucks him away safe and sends out his Beedrill and Butterfree.', wadeM1(), WA.set('m1'), WA.set('spike'))),
      ch('"They are gross."', fight('Wade\'s face falls. He looks down at the jar for a long second. Then he sets his jaw and sends out his Beedrill and Butterfree anyway, and they fight harder than bugs have any right to.', wadeM1(1), WA.set('m1'), WA.set('hurt'))),
    ],
  }),
  WA.meet(2, {
    title: 'The Bug Show',
    intro:
      'A school fair: bunting, a cake stall, a bouncy castle full of shrieking. In the far corner stands a table with a hand-painted sign, BUG SHOW, and jars, and drawings, and a Butterfree asleep on a cushion. Nobody is at it. Wade sits behind it with his chin on his hands. ' +
      'Wade: "Nobody\'s coming. It\'s because of the last kid who brought a Beedrill. It stung a teacher."',
    choices: [
      ch('"I\'ll stand at your table."', out('You stand next to Wade, pick up a jar and look interested, which turns out to be all it takes. One kid wanders over, then three, then a crowd. By the end Wade is explaining moulting to a ring of children, his voice cracking with happiness.', WA.set('m2'), WA.set('show'))),
      ch('"Bring my Bug-types."', out('You let your Bug-types out onto the table, and every one of them draws a new visitor: a kid who wants to touch, a dad who used to catch them, a girl who asks very serious questions. Wade keeps a tally on the back of his sign and runs out of room.', WA.set('m2'), WA.set('show')), { requires: [ptype('bug')] }),
      ch('"Find the teacher."', out('Wade goes pale. Wade: "She\'ll still be cross." You go to find her anyway, through the fair crowd, toward the staff tent.', WA.set('m2'), room(WA.roomId('teacher')))),
    ],
    remembers: [
      variant('hurt', [WA.is('hurt')], { notice: 'Wade sees you and looks away, fast. He will not look at you, not properly, until you help.' }),
    ],
  }),
  WA.room('teacher', {
    title: 'The Teacher',
    intro: 'The teacher is in the staff tent with a cup of tea and a small plaster on her hand. She knows exactly why you are here before you open your mouth.',
    choices: [
      ch('"Ask her to visit the table."', out('She laughs. She was never cross with Wade at all. She walks back with you to the BUG SHOW and makes a great fuss of Spike, and suddenly everyone else wants to see too.', WA.set('teacher'))),
      ch('"Tell her about Wade."', out('You tell her about the jar and the net and how hard he worked on the sign. She puts down her tea. Five minutes later she is at his table, asking him to show her everything, and he does.', WA.set('teacher'))),
    ],
  }),
  WA.meet(3, {
    title: 'Scyther',
    intro:
      'The same forest edge, but Wade is taller now, his net traded for a proper bag. A Beedrill hums at his shoulder and, beside him, a Scyther stands like a green blade. Wade: "Spike evolved all the way. And look who I caught."',
    choices: [
      ch('"Battle."', fight('Wade grins and sends them both: Spike the Beedrill, buzzing with pride, and the Scyther, which bows before it strikes.',
        spar(WAD, { team: ['beedrill', 'scyther'], win: [item('silver-powder'), moment('You beat Spike the Beedrill and Wade\'s Scyther')], lose: [moment('Wade\'s Scyther cut you down to size')] }), WA.set('done'))),
      ch('"Trade?"', out('Wade thinks very hard. Then he nods. Wade: "Okay. But you have to look after it like a bug person." Your Bug-type goes to him and his Scyther comes to you, still bowing.',
        trade('a Bug-type', { type: 'bug' }), join({ species: ['scyther'] }), WA.set('done')), { requires: [ptype('bug')] }),
      ch('"How\'s school?"', out('Wade: "Bug Club has twelve people." He says it like he is announcing a championship. There is a badge on his bag with a Weedle on it. He gives you a pouch of Silver Powder, swept up after club meetings.', WA.set('done'), item('silver-powder'))),
    ],
    remembers: [
      variant('spike', [WA.is('spike')], { notice: 'You remember Spike: a tiny Weedle on a boy\'s palm. The Beedrill at Wade\'s shoulder seems to remember you too.' }),
      variant('teacher', [WA.is('teacher')], { notice: 'Wade\'s old teacher sits on a stump nearby with a field guide. She runs Bug Club now, with him.' }),
      variant('show', [WA.is('show')], { notice: 'Wade has the old BUG SHOW sign tucked under his arm. Wade: "Kept it. It\'s on the club door now."' }),
    ],
  }),
];

// ---------- RR8. Burglar Quinn (afternoon, evening; Murkrow, Sneasel) ----------
const QU = rosterKit('quinn', 'npc-meet-burglar-quinn', 'Burglar Quinn');
const QUI = 'Burglar Quinn';
const loot = (): Json[] => [any('nugget', 'pearl', 'big-pearl', 'star-piece'), any('nugget', 'pearl', 'big-pearl', 'star-piece')];
/** "If the player keeps stolen goods: honest.kept_stolen". */
const keptStolen = flag('honest-kept-stolen');
const job: Json[] = [
  ch('"Help."', out('Quinn looks at you sideways, then nods. Quinn: "Quiet as you can. And we take what\'s owed, not a coin more."', QU.set('m2'), room(QU.roomId('stealth')))),
  ch('"Talk to the owner."', fight('You walk up to the front door instead. The owner will not come down; he sends his butler, who peels off his gloves very slowly. Butler: "The master is not receiving complaints." Whatever happens on the gravel, the neighbours are watching, and by morning the owner pays every coin he owes.',
    spar('The Butler', { types: ['normal'], win: [moment('You beat the butler, and Quinn\'s sister got paid')], lose: [moment('The butler beat you, but Quinn\'s sister got paid')] }), QU.set('m2'), QU.set('legal'))),
  ch('"Stop them."', out('You put a hand on Quinn\'s shoulder. They are still for a long time. Then they let go of the roof edge. Quinn: "Fine. Then I\'m done here." By morning Quinn has left town, and the Murkrow with them.', QU.set('m2'), QU.set('stopped'))),
];

const quinn: Json[] = [
  QU.meet(1, {
    title: 'Finders Keepers',
    intro:
      'A back alley behind a row of fine houses, all bins and drainpipes. A thin figure in a striped shirt sees you, drops a heavy sack with a clink, and holds both hands up, grinning. Quinn: "Finders keepers, right?" ' +
      'A Murkrow lands on a bin lid, eyeing the sack. Quinn: "Battle me for the sack. You win, you keep what\'s in it."',
    choices: [
      ch('"Battle."', fight('Quinn snaps their fingers. The Murkrow hops down and a Sneasel drops off the gutter, claws out, both very much at home in an alley. If you win, the sack is yours, and there are two good things in it.',
        spar(QUI, { team: ['murkrow', 'sneasel'], win: [...loot(), keptStolen, moment('You won Quinn\'s sack, and kept it')], lose: [moment('Quinn kept the sack')] }), QU.set('m1'))),
      ch('"Whose sack is that?"', fight('Quinn: "Rich fella\'s. He won\'t miss it." They say it without a flicker. Then the Murkrow and the Sneasel are between you and the sack, and what to do with it will have to wait until after.',
        spar(QUI, { team: ['murkrow', 'sneasel'], win: [room(QU.roomId('sack'))], lose: [moment('Quinn kept the rich fella\'s sack')] }), QU.set('m1'), QU.set('asked'))),
      ch('"Report you."', out('You turn toward the street to shout for help. Quinn is faster: over the wall, sack and all, the Murkrow cawing like laughter. A curtain twitches somewhere. You have the feeling Quinn will remember your face.', QU.set('m1'), QU.set('reported'))),
    ],
  }),
  QU.room('sack', {
    title: 'The Sack',
    intro: 'The sack is yours by the rules of the alley. Inside: silver, a jewel box, and a few things worth a lot more than they look. Quinn shrugs. The rich fella\'s back gate is right there, unlatched.',
    choices: [
      ch('"Keep it."', out('You heft the sack. Quinn grins as if you have passed some sort of test. You walk off two good things heavier, and not quite as light inside.', ...loot(), keptStolen)),
      ch('"Return it."', out('You knock at the back door and hand the sack to a startled maid. Quinn watches from the wall, head tilted, as if you are a puzzle. Quinn: "Huh." That is all, but they keep looking back at you as they go.')),
    ],
  }),
  QU.meet(2, {
    title: 'The Job',
    intro:
      'A rooftop at dusk, the slates still warm from the day. Quinn lies flat at the edge, Murkrow tucked under one arm, looking across at a mansion with every window lit. Quinn: "That\'s where my sister works. Cleaner. They didn\'t pay her for three months." ' +
      'Their voice is very flat. Quinn: "I\'m getting her money. Just her money."',
    choices: job,
    requires: [QU.not('reported')],
    remembers: [
      variant('asked', [QU.is('asked')], { notice: 'Quinn glances at you. Quinn: "You asked whose sack it was. Nobody asks." It seems to have stayed with them.' }),
    ],
  }),
  // Remembers "If roster.quinn.reported": Quinn won't talk until the player says sorry. A variant must keep one base choice, so this
  // is Meeting 2 drawn instead of the usual one (same gate, plus the flag); "Sorry." opens the usual choices as a side scene.
  { ...QU.meet(2, {
    title: 'The Job',
    requires: [QU.is('reported')],
    intro: 'A rooftop at dusk, the slates still warm from the day. Quinn lies flat at the edge, looking across at a mansion with every window lit, and hears you climb up. Their face closes like a door. They do not say a word, and the Murkrow turns its back on you. Quinn will not talk until you say sorry.',
    choices: [
      ch('"Sorry."', out('Quinn studies you for a long moment. Then they shift over to make room on the warm slates. Quinn: "That\'s where my sister works. They didn\'t pay her for three months. I\'m getting her money. Just her money."', QU.set('m2'), room(QU.roomId('apology')))),
      ch('"I\'d do it again."', out('Quinn nods slowly, as if that is the answer they expected. Quinn: "Then we\'re done." They slide down the drainpipe and are gone into the dark. You never see them again.', QU.set('m2'), QU.set('done'))),
    ],
  }), id: QU.roomId('m2-reported') },
  QU.room('apology', {
    title: 'The Job',
    intro: 'Quinn lies flat beside you at the roof edge, watching the lit windows of the mansion. Somewhere inside, their sister is mopping a floor she has not been paid for in three months.',
    choices: job,
  }),
  QU.room('stealth', {
    title: 'Through the Window',
    intro: 'A servants\' window, a loose latch, a dark corridor smelling of polish. Quinn knows exactly where the study is: the ledger in the desk, the cash box beside it. Footsteps creak somewhere above.',
    choices: [
      ch('"Slip past the guard."',
        out('You and Quinn move like shadows past the night guard\'s lamp. In the study Quinn counts out three months\' wages to the coin, writes OWED across the ledger page, and leaves everything else exactly where it was.', QU.set('helped')),
        { prompt: { id: 'dodge-tap', needs: 'good' }, fail: out('A floorboard shrieks and the guard\'s Growlithe starts barking, but Quinn already has the envelope. You go out of the window with exactly the owed amount and not a coin more, and end up laughing in the bushes.', QU.set('helped')) }),
      ch('"Keep watch at the door."', out('You stand in the dark with your heart thudding while Quinn works. They are back in two minutes with one envelope: three months\' wages, counted twice. Quinn: "Not a coin more." They mean it.', QU.set('helped'))),
    ],
  }),
  QU.meet(3, {
    title: 'Honest Work',
    intro:
      'A narrow locksmith\'s shop with a brand-new sign over the door, the paint barely dry. Keys hang from every wall like wind chimes. Quinn stands behind the counter in a clean apron, the Murkrow on a perch by the till. Quinn: "Turns out knowing how to break in is how you know how to keep people out."',
    choices: [
      ch('"Battle."', fight('Quinn comes round the counter, wiping their hands. The Murkrow flaps down, and the Sneasel is gone: in its place stands a Weavile, sleek and sure of itself. Quinn: "Weavile now. Grew up, like me."',
        spar(QUI, { team: ['murkrow', 'weavile'], win: [moment('You beat Quinn the locksmith')], lose: [moment('Quinn\'s Weavile beat you')] }), QU.set('done'))),
      // Reward "Free locks for a region" is this choice (needs engine; see the report).
      ch('"Open a lock for me."', out('Quinn takes a ring of slim picks from under the counter and drops it into your hand. Quinn: "Any locked chest in this region. Tell them I sent you." The picks are still warm from the till drawer.', QU.set('done'), QU.set('free-locks'))),
      ch('"How\'s your sister?"', out('Quinn does not answer; they just nod toward the back room. Their sister is there, laughing at something on the radio, flour on her sleeves and a key of her own on a ribbon round her neck. Quinn watches her as if they are still keeping lookout.', QU.set('done'))),
    ],
    remembers: [
      variant('helped', [QU.is('helped')], { notice: 'Framed behind the counter hangs a page torn from a ledger, with OWED written across it in Quinn\'s hand.' }),
      variant('legal', [QU.is('legal')], { notice: 'A receipt is pinned by the till: three months\' wages, signed by a very grumpy owner. Quinn: "My sister wanted it framed. I said pinned is fine."' }),
      variant('stopped', [QU.is('stopped')], { notice: 'Quinn shrugs at the strange town outside the window. Quinn: "You were right to stop me. Annoying, but right."' }),
    ],
  }),
];

// ---------- RR9. Camper Liam (morning, afternoon; Growlithe, Sandshrew) ----------
const LI = rosterKit('liam', 'npc-meet-camper-liam', 'Camper Liam');
const LIA = 'Camper Liam';

const liam: Json[] = [
  LI.meet(1, {
    title: 'Under the Stars',
    intro:
      'A campsite in a clearing, the tent pitched a little crooked. A boy in a scout scarf crouches over a ring of stones, poking at a fire that will not light: smoke, and no flame. A Sandshrew watches him with deep sympathy. Liam: "Nothing beats a night under the stars." ' +
      'He blows on the kindling. It goes out. Liam: "Once I get the fire going. Any second now."',
    choices: [
      ch('"Light it for him."', out('Your Fire-type sniffs the kindling, sneezes once, and the whole stack catches with a soft whump. Liam stares, then laughs and shakes your hand with both of his. Liam: "Stay! There\'s beans!" You rest by his fire, free, and your team sleeps warm.',
        LI.set('m1'), heal(0.5)), { requires: [ptype('fire')] }),
      ch('"Battle."', fight('Liam gives up on the fire with obvious relief. Liam: "Battle\'s easier than kindling." A Growlithe bounds out of the tent barking, and the Sandshrew rolls after it.',
        spar(LIA, { team: ['growlithe', 'sandshrew'], win: [moment('You beat Liam by his unlit fire')], lose: [moment('Liam beat you, even without a fire')] }), LI.set('m1'))),
      ch('"Show him how."', out('You kneel beside him and rebuild it: tinder small, twigs crossed, room for air. Liam copies every move with his tongue between his teeth, and on the second try the flame takes. He writes it all down in a notebook. You have a feeling your next rest will go better for it.',
        LI.set('m1'), LI.set('taught'))),
    ],
  }),
  LI.meet(2, {
    title: 'Lost Scout',
    intro:
      'Night, and cold. Liam stands alone at a fork in the path, holding a map upside down under a torch with a dying battery. His scarf is crooked and his Growlithe is pressed against his legs. Liam: "My troop went on without me. I said I knew the way." ' +
      'He tries to sound as if it does not matter. It matters.',
    choices: [
      ch('"Walk him back."', out('You turn his map the right way up. Liam: "...Oh." You set off together down the dark path, Growlithe trotting in front with its tail up.', LI.set('m2'), room(LI.roomId('trail')))),
      ch('"Camp here together."', out('You build a fire and share what food you have, and your team rests. Late in the night, eyes shine at the edge of the firelight: a wild Pokémon, curious and close. Liam stands up in front of you, shaking, arms out, and it stares at him and backs away. He sleeps very well after that, and so do you.',
        LI.set('m2'), LI.set('camped'), heal(0.5))),
      ch('"Let him find it."', out('You show him the stars, and how to find north by them, and then you step back. He goes off alone with his chin up. Much later, from far down the valley, you hear a whistle and a whole troop cheering. He got there late, and proud.', LI.set('m2'), LI.set('alone'))),
    ],
    remembers: [
      variant('taught', [LI.is('taught')], { notice: 'He has a fire going this time, small and neat, built exactly the way you showed him. Even now, he is very proud of it.' }),
    ],
  }),
  LI.room('trail', {
    title: 'The Dark Trail',
    intro: 'The trail winds down into pine forest. Every snapped twig makes Liam jump. His Growlithe has its nose to the ground, following the troop\'s scent, and keeps looking back to check you are both still there.',
    choices: [
      ch('"Let Growlithe lead."', out('Growlithe takes the lead and never once loses the scent. Liam follows it with his hand on its back, and by the second mile he is walking taller.', room(LI.roomId('troop')))),
      ch('"Sing a camp song."', out('You sing, badly. Liam knows all the words and corrects you. By the third verse he has forgotten to be scared.', room(LI.roomId('troop')))),
    ],
  }),
  LI.room('troop', {
    title: 'The Troop',
    intro: 'Lanterns in the trees, a ring of tents, and a troop leader with a whistle pacing at the edge of camp. She stops when she sees Liam. Then she runs.',
    choices: [
      ch('"Hand him over."', out('The troop leader hugs Liam so hard his cap falls off, then shakes your hand and will not let go. Troop Leader: "Thank you. Truly." The whole troop cheers you into camp for cocoa.', LI.set('escorted'))),
      ch('"Say he led the way."', out('You tell the leader Liam found the trail himself. Liam goes red to the ears and says nothing, which is exactly right. The troop leader thanks you anyway, quietly, with a look that says she knows.', LI.set('escorted'))),
    ],
  }),
  LI.meet(3, {
    title: 'Troop Leader',
    intro:
      'A campsite with a ring of little kids in scout scarves, all watching one boy. It is Liam, taller now, with a leader\'s badge on his scarf and an Arcanine lying beside him like a rug. He spots you, comes over fast, and whispers. Liam: "I\'m the leader now. Don\'t tell them I got lost."',
    choices: [
      ch('"I won\'t."', out('Liam grins, the same grin as the night by the fire that would not light. He presses a Fire Stone into your hand, warm from his pocket, and goes back to his troop a little taller.', LI.set('done'), item('fire-stone'))),
      ch('"Battle."', fight('Liam turns to his troop. Liam: "Watch carefully. This is how it\'s done." His Arcanine rises, huge and golden, and a Sandslash rolls out beside it.',
        spar(LIA, { team: ['arcanine', 'sandslash'], win: [item('fire-stone'), moment('You beat Liam in front of his whole troop')], lose: [moment('Liam beat you in front of his whole troop')] }), LI.set('done'))),
      ch('"Teach them something."', out('You teach the troop to build a fire that lights the first time. Liam takes notes with them, very seriously, then tells them the trick is his. For the rest of the region, every rest you take is a little warmer. He gives you a Fire Stone for the lesson.',
        LI.set('done'), item('fire-stone'), LI.set('rest-healing'))),
    ],
    remembers: [
      variant('escorted', [LI.is('escorted')], { notice: 'The troop leader from that night waves from her tent. She has made Liam her second-in-command.' }),
      variant('camped', [LI.is('camped')], { notice: 'Liam is telling his troop a story about a wild Pokémon in the dark, and a scout who stood up to it. He winks at you.' }),
      variant('alone', [LI.is('alone')], { notice: 'The troop\'s flag has a new motto stitched on it: GET THERE PROUD. Liam says it was his idea.' }),
    ],
  }),
];

// ---------- RR10. Channeler Hester (night; Haunter, Misdreavus, Banette) ----------
const HE = rosterKit('hester', 'npc-meet-channeler-hester', 'Channeler Hester');
const HES = 'Channeler Hester';

const hester: Json[] = [
  HE.meet(1, {
    title: 'Behind You',
    intro:
      'A graveyard gate at night, the iron cold and beaded with mist. An old woman in layered robes sways in front of it, eyes half shut, a string of little bells at her wrist. She stops swaying the moment you come near. Hester: "I feel something behind you…" ' +
      'You turn. Nothing. Only the path and the dark trees. Hester: "No. Not that kind. Something you lost."',
    choices: [
      ch('"Battle."', fight('Hester\'s bells shiver though she has not moved. A Haunter rises out of the gate itself, grinning, and a Misdreavus drifts down from a headstone.',
        spar(HES, { team: ['haunter', 'misdreavus'], win: [moment('You beat Hester\'s ghosts at the graveyard gate')], lose: [moment('Hester\'s ghosts beat you at the graveyard gate')] }), HE.set('m1'))),
      ch('"What did I lose?"', out('Hester takes your hand in both of hers. Her fingers are icy. She is quiet a long time, and then, if you have ever let a Pokémon go or lost one on the road, she says the name of its kind, softly, and your throat tightens. Then she lets you go.', HE.set('m1'), HE.set('named'))),
      ch('"Walk away."', out('You walk. Behind you, not loudly, Hester calls after you. Hester: "It\'s following you anyway." You do not look back. You almost do.')),
    ],
  }),
  HE.meet(2, {
    title: 'The Real Ghost',
    intro:
      'Hester\'s cottage, a lamp lit in every window. She opens the door before you knock, and she is not swaying now; she is frightened. Behind her, plates lift off the dresser one by one and drift slowly around the room. ' +
      'Hester: "I\'ve been pretending. Thirty years. Now there\'s a real one and I can\'t make it go."',
    choices: [
      ch('"Find out what it wants."', out('You sit at her table among the floating plates and wait. After a long while a Shuppet peeks out of the teapot. It drifts upward, again and again, toward the attic hatch. It wants something up there.', HE.set('m2'), room(HE.roomId('attic')))),
      ch('"Battle it."', fight('You call your team. Something small and dark shrieks out of the teapot and the plates come down like rain. Hester covers her ears. It will flee rather than be beaten, and the house will stay as haunted as before.',
        wildSpar({ species: ['shuppet'], win: [moment('The Shuppet fled, but Hester\'s house stayed haunted')], lose: [moment('The Shuppet in Hester\'s house drove you off')] }), HE.set('m2'), HE.set('fought'))),
      ch('"Leave."', out('Hester watches you go from the doorway, a plate hovering over her shoulder. A week later there is a SOLD sign on the gate. She has moved out.', HE.set('m2'), HE.set('moved'))),
    ],
  }),
  HE.room('attic', {
    title: 'The Attic',
    intro: 'The attic hatch sticks, then gives. Dust, trunks, hat boxes: thirty years of a channeler\'s props, crystal balls and fake candles and a plaster skull with a chipped nose. Shuppet hovers at your shoulder, trembling with hope.',
    choices: [
      ch('"Search the trunks."', out('Robes, letters, a bundle of old bells. Not here. Shuppet droops, then points deeper, under the eaves where the roof comes down low.', room(HE.roomId('doll')))),
      ch('"Follow Shuppet."', out('Shuppet drifts past every trunk without a glance, deeper into the attic, to where the roof slopes down and the dust is oldest.', room(HE.roomId('doll')))),
    ],
  }),
  HE.room('doll', {
    title: 'The Lost Doll',
    intro: 'Under the eaves, behind a broken rocking horse, sits a cardboard box marked in a child\'s hand. Inside is a rag doll with button eyes and a stitched smile, wrapped in a baby blanket. Hester comes up the ladder behind you and goes very still. Hester: "That was mine. When I was small."',
    choices: [
      ch('"Give the doll to Shuppet."', out('Shuppet wraps itself around the doll and goes perfectly quiet. Downstairs, every plate settles back on the dresser with a tiny clink. Hester sits down in the dust and cries, and Shuppet floats over and pats her head with the doll\'s hand.', HE.set('doll'))),
      ch('"Give the doll to Hester."', out('Hester holds the doll against her chest. Shuppet curls up on her shoulder, against the doll, and stays there. The plates downstairs settle one by one. Hester: "Oh. It wasn\'t haunting me. It was keeping me company."', HE.set('doll'))),
    ],
  }),
  HE.meet(3, {
    title: 'Real Channeler',
    intro:
      'A small room with one candle and no props at all: no crystal ball, no plaster skull. Hester sits at a plain table, and at her shoulder floats a Banette, the Shuppet grown up. Hester: "It stayed. Now I really do feel things." She does not sway. She does not need to.',
    choices: [
      // "One true thing about the next region (a hidden event's location)": needs engine (see the report).
      ch('"Read me."', out('Hester takes your hands and closes her eyes, and this time there is no swaying and no show. She tells you one true thing about the region ahead: where something hidden waits, off the road, for someone who knows to look.', HE.set('done'), HE.set('reading'))),
      ch('"Battle."', fight('Hester stands. Banette rises from her shoulder with a grin full of zips, and a Mismagius fades out of the candle smoke beside it.',
        spar(HES, { team: ['banette', 'mismagius'], win: [moment('You beat Hester, a real channeler now')], lose: [moment('Hester\'s Banette and Mismagius beat you')] }), HE.set('done'))),
      ch('"Thank it."', out('You bow to Banette. It stares at you, then reaches inside itself, which is unsettling, and hands you a Spell Tag, still warm. Hester: "It likes you. It doesn\'t like anyone."', HE.set('done'), item('spell-tag'))),
    ],
    remembers: [
      variant('named', [HE.is('named')], {
        notice: 'Hester looks past you, at the space behind your shoulder, and her face softens. Hester: "Your lost one\'s still with you. The reading will be about it."',
        hide: [0],
        add: [ch('"Read me."', out('Hester reads you, and it is all about the Pokémon you lost: its kind, and the place in the region ahead where others of its kind can still be found. You write it down with shaking hands.', HE.set('done'), HE.set('reading-lost')))],
      }),
      variant('fought', [HE.is('fought')], { notice: 'A teacup drifts past the window; the cottage is still a little haunted. Hester: "It came back after you fought it. It forgave you, I think."' }),
      variant('moved', [HE.is('moved')], { notice: 'This is a new house, smaller, at the other end of the region. Hester: "It followed me here. Of course it did."' }),
    ],
  }),
];

// ---------- RR11. Cool Couple Leon and Sky (doubles; morning, night; Plusle, Minun, later Ampharos, Altaria) ----------
const CO = rosterKit('couple', 'npc-meet-cool-couple-leon-and-sky', 'Cool Couple Leon and Sky');
const COU = 'Cool Couple Leon and Sky';
const coM1 = (): Json => spar(COU, { format: 'doubles', team: ['plusle', 'minun'], win: [moment('You beat Leon and Sky in a double battle')], lose: [moment('Leon and Sky beat you, stylishly')] });
/** Leon's message (1 an apology, 2 a complaint, 3 a joke). */
const msg = (lo: number, hi = lo): Json => flagIs(CO.key('msg'), lo, hi);
const toSky = (text: string, n: number): Json => out(text, CO.set('msg', n), room(CO.roomId('sky')));

const couple: Json[] = [
  CO.meet(1, {
    title: 'Stylish and Strong',
    intro:
      'A seaside promenade, gulls and ice-cream carts. Two trainers in matching red jackets lean against the railing in a pose they have obviously practised, sunglasses on, collars up. Sky: "Stylish and strong, that\'s us." ' +
      'Leon pushes his sunglasses up into his hair. Leon: "Doubles. You and whoever you\'ve got." At their feet, a Plusle and a Minun high-five.',
    choices: [
      ch('"Battle."', fight('Leon and Sky step apart in perfect time. Plusle and Minun spark at each other and leap onto the field together, sharing every charge.', coM1(), CO.set('m1'))),
      // "They target separately": needs engine (see the report).
      ch('"Who\'s stronger?"', fight('They both say "Me" at exactly the same moment, and glare at each other over their sunglasses. The battle starts badly for them: Plusle and Minun keep going after different targets, each trainer calling their own plan and ignoring the other.', coM1(), CO.set('m1'), CO.set('tension'))),
      ch('"Not today."', out('Sky shrugs, unbothered. Leon is already fixing his collar for the next challenger. They hold the pose until you are out of sight.')),
    ],
  }),
  CO.meet(2, {
    title: 'Separate Jackets',
    intro:
      'A bench by the road. Leon sits alone, no sunglasses, in a plain blue jacket that matches nothing. His Plusle sits at the far end of the bench, staring down the road. Leon: "We split. She says I never let her lead." ' +
      'He picks at a thread on his cuff. Somewhere two bends further on, you suspect, Sky is sitting alone too.',
    choices: [
      ch('"Talk to the other one."', out('Leon looks up, startled, then hopeful, then cross with himself for hoping. Leon: "Tell her... no. Wait. Let me think what to say."', CO.set('m2'), room(CO.roomId('leon-message')))),
      ch('"Battle them alone."', fight('Leon shrugs and stands. His Plusle hops down, sparks fizzing, looking round for the Minun that is not there. Alone, they are clumsier than you remember. Two bends of the road later, you will find Sky.',
        spar('Leon', { team: ['plusle'], size: 1, lv: -1, win: [moment('You beat Leon on his own')], lose: [moment('Leon beat you, even on his own')] }), CO.set('m2'), CO.set('apart'), room(CO.roomId('sky')))),
      ch('"Stay out of it."', out('You wish him luck and walk on. Leon nods as if he expected that. Two bends of the road later you can already see a green jacket on a wall ahead.', CO.set('m2'), CO.set('apart'), room(CO.roomId('sky')))),
    ],
  }),
  CO.room('leon-message', {
    title: 'Leon\'s Message',
    intro: 'Leon thinks for a long time. He starts three sentences and finishes none of them. Then it all comes out at once: that he is sorry, that she always does this, and something daft about the jackets that makes you both laugh. Which part do you carry?',
    choices: [
      ch('"That he\'s sorry."', toSky('You fold the apology up carefully, like a letter, and carry it two bends down the road.', 1)),
      ch('"That she always does this."', toSky('Leon: "Good. Tell her that." He does not look as if he thinks it is good. You carry the complaint two bends down the road.', 2)),
      ch('"The joke about the jackets."', toSky('Leon snorts. Leon: "She\'ll hate that. She\'ll laugh, and she\'ll hate that." You carry the joke two bends down the road.', 3)),
    ],
  }),
  CO.room('sky', {
    title: 'Separate Jackets',
    intro: 'Two bends of the road later, Sky sits on a low wall in a green jacket, alone, her Minun asleep in her lap. She does not take her sunglasses off. Sky: "He thinks matching is the same as together."',
    choices: [
      ch('"Talk to the other one."', out('Sky is quiet a while. Then she pushes her sunglasses up into her hair. Sky: "Fine. Take him something back."', room(CO.roomId('sky-message')))),
      ch('"Battle them alone."', fight('Sky sends out her Minun alone. It keeps glancing to its left, at the space where Plusle should be. Alone, it is slower than you remember.',
        spar('Sky', { team: ['minun'], size: 1, lv: -1, win: [moment('You beat Sky on her own')], lose: [moment('Sky beat you, even on her own')] }), CO.set('apart'))),
      ch('"Stay out of it."', out('You leave her to her wall and her thoughts. Leon and Sky stay apart; for this run, at least, they are two people in two jackets.', CO.set('apart'))),
    ],
    remembers: [
      variant('tension', [CO.is('tension')], { notice: 'Sky glances at you over her sunglasses. Sky: "You noticed, didn\'t you." She almost smiles.' }),
      variant('heard-sorry', [msg(1)], { notice: 'You give her Leon\'s apology. Sky takes off her sunglasses for the first time. She says nothing, but she is listening.' }),
      variant('heard-other', [msg(2, 3)], { notice: 'You pass on Leon\'s words. Sky snorts, half annoyed and half not, and Minun wakes up to see what the fuss is about.' }),
    ],
  }),
  CO.room('sky-message', {
    title: 'Sky\'s Answer',
    intro: 'Sky starts, stops, and starts again. She is sorry; he never listens; and there is the thing about the jackets that she cannot help laughing at. Which part do you carry back to Leon?',
    choices: [
      ch('"That she\'s sorry."', out('You carry her apology back up the road. Leon hears it, and something in his shoulders lets go. But one apology is half a bridge, and he never sent his own; they stay apart, each a little less sure of it.', CO.set('apart'))),
      ch('"That he never listens."', out('You carry the complaint back. Leon hears it, opens his mouth to argue, and shuts it again. They stay apart.', CO.set('apart'))),
      ch('"The joke about the jackets."', out('Leon laughs despite himself. Then he stops laughing. It was a good joke, but a joke is not an apology, and they stay apart.', CO.set('apart'))),
    ],
    remembers: [
      variant('both-sorry', [msg(1)], {
        notice: 'You are already carrying Leon\'s apology. If she sends one back, that will make two.',
        hide: [0],
        add: [ch('"That she\'s sorry."', out('You carry her apology back two bends of the road. Leon listens, then runs, jacket flapping, all the way to the wall where Sky is already walking to meet him. Two apologies. They meet in the middle of the road, and neither of them is matching anything.', CO.set('reconciled')))],
      }),
    ],
  }),
  CO.meet(3, {
    title: 'New Jackets',
    intro:
      'A promenade again, bright and busy. Leon and Sky are both here, but not together: each stands with a new partner, a stranger in a stranger\'s jacket, two pairs a little way apart along the railing. They both see you at once.',
    choices: [
      ch('"Battle."', fight('Leon and Sky step out with Ampharos and Altaria, and this time every move is coordinated: one calls, the other answers, and the two Pokémon move like a single thought.',
        spar(COU, { format: 'doubles', team: ['ampharos', 'altaria'], win: [moment('You beat Leon and Sky, coordinated at last')], lose: [moment('Leon and Sky beat you, in step at last')] }), CO.set('done'))),
      // Reward "A tag partner for a double battle" is this choice.
      ch('"Tag with me."', out('Sky elbows Leon. Leon elbows her back. In the end one of them falls in beside you for your next double battle, jacket and all, already arguing tactics.', CO.set('done'), companion(1))),
      ch('"Congratulations."', out('They both go a little pink. Sky presses a Pecha Berry into your hand, and Leon presses another one on top, so it is fair. Sky: "Each. We do things each now."', CO.set('done'), item('pecha-berry', 2))),
    ],
    remembers: [
      variant('reconciled', [CO.is('reconciled')], {
        intro:
          'A promenade again. Leon and Sky stand side by side at the railing in two jackets that do not match at all, one blue and one green, and somehow they look more like a pair than they ever did. An Ampharos and an Altaria lounge at their feet. Sky: "We stopped matching. Better."',
      }),
      variant('apart', [CO.is('apart')], { notice: 'Leon nods to you from one end of the railing; Sky raises a hand from the other. They are polite to each other now, at least.' }),
    ],
  }),
];

export const EVENTS: Json[] = [...rosalind, ...bianca, ...ryder, ...perry, ...kenji, ...wade, ...quinn, ...liam, ...hester, ...couple];
export const REMOVE: string[] = [];

/** Where each event is scripted (for docs/status/co-people.md and the `extra` list of the status file). */
export const DOC: Record<string, string> = {
  'npc-meet-aroma-lady-rosalind': 'RR2 M1', 'npc-meet-aroma-lady-rosalind-m2': 'RR2 M2', 'npc-meet-aroma-lady-rosalind-m3': 'RR2 M3',
  'npc-meet-aroma-lady-rosalind-petition': 'RR2 M2 (Fight the town)', 'npc-meet-aroma-lady-rosalind-council': 'RR2 M2 (Fight the town)',
  'npc-meet-beauty-bianca': 'RR3 M1', 'npc-meet-beauty-bianca-m2': 'RR3 M2', 'npc-meet-beauty-bianca-m3': 'RR3 M3',
  'npc-meet-beauty-bianca-coast-road': 'RR3 M2 (Heal first)', 'npc-meet-beauty-bianca-specialist': 'RR3 M2 (Heal first)',
  'npc-meet-biker-ryder': 'RR4 M1', 'npc-meet-biker-ryder-m2': 'RR4 M2', 'npc-meet-biker-ryder-m3': 'RR4 M3',
  'npc-meet-bird-keeper-perry': 'RR5 M1', 'npc-meet-bird-keeper-perry-m2': 'RR5 M2', 'npc-meet-bird-keeper-perry-m3': 'RR5 M3',
  'npc-meet-bird-keeper-perry-north': 'RR5 M2 (Find)', 'npc-meet-bird-keeper-perry-nest': 'RR5 M2 (Find)',
  'npc-meet-black-belt-kenji': 'RR6 M1', 'npc-meet-black-belt-kenji-m2': 'RR6 M2', 'npc-meet-black-belt-kenji-m3': 'RR6 M3',
  'npc-meet-black-belt-kenji-class': 'RR6 M2 (Chair)', 'npc-meet-black-belt-kenji-lesson': 'RR6 M2 (Train me)', 'npc-meet-black-belt-kenji-grading': 'RR6 M3 (Judge)',
  'npc-meet-bug-catcher-wade': 'RR7 M1', 'npc-meet-bug-catcher-wade-m2': 'RR7 M2', 'npc-meet-bug-catcher-wade-m3': 'RR7 M3',
  'npc-meet-bug-catcher-wade-teacher': 'RR7 M2 (Teacher)',
  'npc-meet-burglar-quinn': 'RR8 M1', 'npc-meet-burglar-quinn-m2': 'RR8 M2', 'npc-meet-burglar-quinn-m3': 'RR8 M3',
  'npc-meet-burglar-quinn-m2-reported': 'RR8 M2 (Remembers: reported)', 'npc-meet-burglar-quinn-sack': 'RR8 M1 (Whose sack?)', 'npc-meet-burglar-quinn-apology': 'RR8 M2 (Sorry)', 'npc-meet-burglar-quinn-stealth': 'RR8 M2 (Help)',
  'npc-meet-camper-liam': 'RR9 M1', 'npc-meet-camper-liam-m2': 'RR9 M2', 'npc-meet-camper-liam-m3': 'RR9 M3',
  'npc-meet-camper-liam-trail': 'RR9 M2 (Walk)', 'npc-meet-camper-liam-troop': 'RR9 M2 (Walk)',
  'npc-meet-channeler-hester': 'RR10 M1', 'npc-meet-channeler-hester-m2': 'RR10 M2', 'npc-meet-channeler-hester-m3': 'RR10 M3',
  'npc-meet-channeler-hester-attic': 'RR10 M2 (Find out)', 'npc-meet-channeler-hester-doll': 'RR10 M2 (Find out)',
  'npc-meet-cool-couple-leon-and-sky': 'RR11 M1', 'npc-meet-cool-couple-leon-and-sky-m2': 'RR11 M2 (Leon, first node)', 'npc-meet-cool-couple-leon-and-sky-m3': 'RR11 M3',
  'npc-meet-cool-couple-leon-and-sky-leon-message': 'RR11 M2 (Talk, Leon)', 'npc-meet-cool-couple-leon-and-sky-sky': 'RR11 M2 (Sky, second node)',
  'npc-meet-cool-couple-leon-and-sky-sky-message': 'RR11 M2 (Talk, Sky)',
};

/** Flags nothing in this file reads: where the doc says they come back (merged into src/data/catalogOverhaul/flags/people.json). */
export const AFTERSTORY: { match: string; readBy: string }[] = [
  { match: 'roster-bianca-gyarados', readBy: 'The Alpha Gyarados on the coast road: A2, another document (RR3 M3 "The Gyarados")' },
  { match: 'roster-ryder-(free-deliveries|carry)', readBy: 'Needs engine: free deliveries for the region, one item carried ahead to a later node (RR4 M3 reward, Race)' },
  { match: 'honest-kept-stolen', readBy: 'The honesty record (RR8 M1: "If the player keeps stolen goods: honest.kept_stolen")' },
  { match: 'roster-quinn-free-locks', readBy: 'Needs engine: any locked chest this region opens free (RR8 M3 Lock, reward "Free locks for a region")' },
  { match: 'roster-liam-rest-healing', readBy: 'Needs engine: +1 rest healing for the region (RR9 M3 Teach)' },
  { match: 'roster-hester-(reading|reading-lost)', readBy: 'Needs engine: a hidden event\'s location in the next region, or where the lost Pokémon\'s kind is found (RR10 M3 Read)' },
  { match: 'roster-hester-doll', readBy: 'Finished trainers at the All-Star Tournament and the Final Reunion (ROAD_ROSTER "How the Roster runs"; RR10 M2 Find out)' },
];
