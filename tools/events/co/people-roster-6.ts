// Catalog Overhaul Pack, people: THE ROAD ROSTER, RR42 to RR51 (ROAD_ROSTER.md lines 2142 to 2645). Pattern: people-roster-1.ts.
// Build: npm run co:build -- people-roster-6
import { ch, companion, egg, ferry, fight, flagIs, gym, heal, item, join, out, ptype, room, type Json } from '../dsl.ts';
import { bond, CATEGORY as CAT, moment, rosterKit, spar, variant, wildSpar } from './_people.ts';

export const CATEGORY = CAT;

// ---------- RR42. Swimmer Marina (morning, evening; Dewgong, Lapras) ----------
const MA = rosterKit('marina', 'npc-meet-swimmer-marina', 'Swimmer Marina');
const MARINA = 'Swimmer Marina';
const marinaHelp = (text: string): Json => ch('"Call for help."', out(text, MA.set('m2'), MA.set('friends')));

const marina: Json[] = [
  MA.meet(1, {
    title: 'Dive In',
    intro:
      'A cold cove, the water grey-green and so clear you can count the pebbles on the bottom. Your breath smokes. Out past the rocks a swimmer in a thick black suit is treading water beside a Dewgong, both of them looking perfectly at home. ' +
      'She waves with her whole arm and kicks in towards you, cheeks bright red with cold and grinning anyway. Marina: "Dive in with me!" The Dewgong barks once, as if to second it.',
    choices: [
      ch('"Battle."', fight('Marina whoops and slaps the water. The Dewgong slides up onto the shingle beside her, and a Seel bobs up out of nowhere to join it, whiskers dripping.',
        spar(MARINA, { team: ['dewgong', 'seel'], size: 2, win: [moment('You beat Swimmer Marina in her freezing cove')], lose: [moment('Swimmer Marina\'s cold-water pair beat you')] }), MA.set('m1'))),
      ch('"It\'s freezing."', out('Marina: "That\'s the point." She ducks under, comes up blowing like a Seel, and laughs at your face. Her lips are a little blue and she is plainly having the best morning of her life. She floats on her back and lets the Dewgong tow her in slow circles.', MA.set('m1'))),
      ch('"Leave."', out('You leave her to the cold water. Behind you there is a splash and a delighted shriek, and the Dewgong\'s happy barking follows you a long way up the path.')),
    ],
  }),
  MA.meet(2, {
    title: 'The Lapras',
    intro:
      'The tide is far out, and the sand is ribbed and shining. In the middle of it lies a Lapras, stranded, its great shell tilted and its long neck laid flat on the wet ground. Marina kneels beside it, scooping water over its head with her hands. ' +
      'Marina: "Tide went out and left it. It\'s too heavy to push." The Lapras makes a low, soft sound, almost a song, and looks at you with very dark eyes.',
    choices: [
      ch('"Push together."', out('Your strongest Pokémon set their shoulders against the shell beside Marina and heave, feet sliding in the sand. Inch by inch, then all at once, the Lapras slides into the shallows. It lifts its head, sings one long clear note, and swims off into the deep water.', MA.set('m2'), MA.set('pushed'))),
      ch('"Wait for the tide."', out('You stay with it. You and Marina carry water in your hands, your hats, anything, keeping its skin wet for hours while the sea crawls slowly back. When the water finally lifts it, the Lapras floats, breathes, and lives. Marina sits down in the surf, soaked and shaking and laughing.', MA.set('m2'), MA.set('waited'))), // TODO(takeNode): "keep it wet for a node" costs a node
      marinaHelp('You shout until your voice cracks. People come running down from the harbour with ropes and buckets, strangers in rolled-up trousers, and together you all walk the Lapras back into the sea. Marina hugs every one of them, even the ones she has never met.'),
    ],
    remembers: [
      variant('kai-and-finn', [flagIs('roster-kai-m1'), flagIs('roster-finn-m1')], { hide: [2], add: [
        marinaHelp('You shout, and two familiar voices shout back. Swimmer Kai and Swimmer Finn come pelting down the beach, Finn already pulling his shirt off. The four of you and all your Pokémon walk the Lapras back into the sea, singing to it the whole way. Marina is grinning like you have known each other for years.'),
      ] }),
      variant('kai', [flagIs('roster-kai-m1')], { hide: [2], add: [
        marinaHelp('You shout, and someone shouts back: Swimmer Kai, jogging down from the rocks. He takes one look and wades straight in. Between the three of you and your Pokémon, the Lapras slides home into the sea, and Kai and Marina are friends before it has even stopped singing.'),
      ] }),
      variant('finn', [flagIs('roster-finn-m1')], { hide: [2], add: [
        marinaHelp('You shout, and Swimmer Finn comes cannonballing off the pier to answer. He pushes, splashes and cheers in equal measure. Between the three of you and your Pokémon, the Lapras slides home into the sea, and Finn asks Marina if she wants to race it.'),
      ] }),
    ],
  }),
  MA.meet(3, {
    title: 'Ride',
    intro:
      'The cove again, and the water calm as glass. A long neck rises from the sea, and a Lapras glides in to the rocks, looking up and down the shore until it finds Marina. She wades out and rests her forehead against its cheek. ' +
      'Marina: "It comes back every week. Wants to give rides." The Lapras turns its head and looks at you too, patient, its shell broad enough for two.',
    choices: [
      ch('"Ride."', out('You climb onto the smooth, cold shell behind Marina. The Lapras pushes off, singing low, and carries you both across the sea faster than any boat, the spray bright in the air. It sets you down on a far shore, a whole stretch of the road behind you.', ferry(), MA.set('done'), MA.set('rode'))),
      ch('"Battle."', fight('Marina: "Oh, it\'ll love that." The Lapras rears up in the shallows with the Dewgong at its side, both of them shining wet and ready. Marina treads water between them, coaching.',
        spar(MARINA, { team: ['lapras', 'dewgong'], size: 2, win: [moment('You battled Marina and the Lapras you saved')], lose: [moment('The Lapras you saved beat you, gently')] }), MA.set('done'), MA.set('battled'))),
      ch('"Thank it."', out('You put your hand on the Lapras\'s neck and say thank you, for coming back, for trusting people again. It closes its eyes. When it opens its mouth, a cold, clear crystal rolls out into your hands, a piece of ice that does not melt. Marina: "It only does that for friends."', item('nevermeltice'), MA.set('done'), MA.set('thanked'))),
    ],
  }),
];

// ---------- RR43. Tamer Garrett (morning, night; Arbok, Ursaring, Seviper) ----------
const G = rosterKit('garrett', 'npc-meet-tamer-garrett', 'Tamer Garrett');
const GARRETT = 'Tamer Garrett';
const garrettM3 = (bell: boolean): Json[] => {
  const r = bell ? [item('soothe-bell')] : [];
  return [
    ch('"Battle."', fight(bell ? 'Garrett nods, and the Teddiursa trots out with his Arbok, looking back at him for a word. He gives it one, softly. Afterwards he presses a small silver bell into your hand: he does not need it to call anything any more.' : 'Garrett nods, and the Teddiursa trots out with his Arbok, looking back at him for a word. He gives it one, softly. He watches your Ursaring the whole time, and smiles once, without meaning to.',
      spar(GARRETT, { team: ['teddiursa', 'arbok'], size: 2, win: [moment('You battled Garrett and his Teddiursa, with no whip in sight')], lose: [moment('Garrett\'s Teddiursa beat you, and he did not raise his voice once')] }), G.set('done'), G.set('battled'), ...r)),
    ch('"Show him how to bond."', out(bell ? 'You show him: crouch down, open hand, a treat on the palm, and wait. Garrett copies you, stiff and clumsy. The Teddiursa takes the treat, then climbs into his lap and hugs him round the middle. He goes very still. Later he gives you a Soothe Bell, his voice rough.' : 'You show him: crouch down, open hand, a treat on the palm, and wait. Garrett copies you, stiff and clumsy. The Teddiursa takes the treat, then climbs into his lap and hugs him round the middle. He goes very still, and does not say anything for a long time.', G.set('done'), G.set('hugged'), ...r)),
  ];
};
const garrettLeave = ch('"Leave him be."', out('You leave them to it. When you look back, Garrett is sitting in the grass with the Teddiursa, teaching it nothing at all, just sitting with it in the sun. It is the most patient you have ever seen him, and the Teddiursa has fallen asleep against his boot.', G.set('done'), G.set('left')));

const garrett: Json[] = [
  G.meet(1, {
    title: 'They Listen',
    intro:
      'A ring of rope pegged out in a trampled field. Inside it stands a broad man with a coiled whip on his belt, and beside him an Ursaring, huge and hunched, its eyes on his hands. ' +
      'Garrett: "Wild or not, they listen to me." He turns to face you, and the Ursaring flinches when he moves, a quick, small jerk that a creature that size should never have to make.',
    choices: [
      ch('"Battle."', fight('Garrett snaps his fingers. The Arbok rises out of the grass, hood spread, and the Ursaring lumbers into the ring after it, glancing back at him before every step.',
        spar(GARRETT, { team: ['arbok', 'ursaring'], size: 2, win: [moment('You beat Tamer Garrett and his frightened Ursaring')], lose: [moment('Tamer Garrett\'s pair beat you')] }), G.set('m1'))),
      ch('"Why does it flinch?"', out('Garrett: "Because it respects me." He says it flatly, like he has said it many times. You look at the Ursaring, at the way it keeps its head low and its ears back, and you do not believe him. Something in your face must say so, because he looks away first.', G.set('m1'), G.set('seen'))),
      ch('"Put the whip down."', fight('Garrett: "No." He does not even think about it. His hand goes to the coil on his belt, and the battle starts there, with the Ursaring flinching at the sound of the leather.',
        spar(GARRETT, { team: ['arbok', 'ursaring'], size: 2, win: [moment('You beat Tamer Garrett and his frightened Ursaring')], lose: [moment('Tamer Garrett\'s pair beat you')] }), G.set('m1'))),
    ],
  }),
  G.meet(2, {
    title: 'The Bite',
    intro:
      'Garrett sits on a fence post at the edge of the hills, one hand wrapped in a thick, stained bandage. The whip is coiled on the ground at his feet. There is no Ursaring anywhere. ' +
      'Garrett: "It bit me. After eight years. It ran into the hills." He stares up at the slopes, and for the first time he does not look like a man in charge of anything.',
    choices: [
      ch('"Find it with him."', out('You climb together until you find it in a stand of pines. The Ursaring sees Garrett and backs away, growling low, and will not come one step closer. He holds out his good hand, and it still will not come. He sees it then, all of it. He lowers his hand and walks back down alone.', G.set('m2'), G.set('saw'))),
      ch('"Find it alone."', fight('You go up into the hills alone. The Ursaring you find is bigger than you remember, scarred, standing tall at the head of the slope: an Alpha now, the master of its own ground. It roars. If you can calm it, it might come with you.',
        wildSpar({ species: ['ursaring'], lv: 2, win: [G.set('calmed'), join({ species: ['ursaring'] }), moment('You calmed Garrett\'s Ursaring, an Alpha in the hills, and it chose you')], lose: [moment('The Alpha Ursaring drove you back down the hill')] }), G.set('m2'), G.set('lost-it'))),
      ch('"It was right to run."', out('Garrett is on his feet, face red, shouting about eight years and what he gave it. You let him shout. Then he stops, all at once, and sits back down on the post. He picks at the bandage and is quiet for a very long time.', G.set('m2'), G.set('told'))),
    ],
    remembers: [
      variant('seen', [G.is('seen')], { notice: 'Garrett looks at you sideways. Garrett: "You saw it the first day. I didn\'t."' }),
    ],
  }),
  G.meet(3, {
    title: 'No Whip',
    intro:
      'A meadow, no rope ring this time. Garrett sits cross-legged in the grass with a little Teddiursa tumbling about his knees, and there is no whip on his belt, or anywhere. ' +
      'Garrett: "Starting over. It\'s slower. It\'s better." The Teddiursa grabs his thumb with both paws and gnaws it, and he lets it.',
    choices: [...garrettM3(true), garrettLeave],
    remembers: [
      variant('calmed', [G.is('calmed')], { notice: 'Garrett sees your Ursaring and goes very still. It does not flinch. Neither does he. He nods to it, once, like an apology.', hide: [0, 1], add: garrettM3(false) }),
    ],
  }),
];

// ---------- RR44. Team Rocket Grunt Boris (afternoon, evening; Koffing, Zubat, Raticate) ----------
const B = rosterKit('boris', 'npc-meet-team-rocket-grunt-boris', 'Team Rocket Grunt Boris');
const BORIS = 'Team Rocket Grunt Boris';
const borisM1 = { team: ['koffing', 'zubat'], size: 2, win: [moment('You beat Team Rocket Grunt Boris on the open road')], lose: [moment('Rocket Grunt Boris beat you, and still looked bored')] };

const boris: Json[] = [
  B.meet(1, {
    title: 'Hand Over',
    intro:
      'A thug in black steps out from behind a signpost and plants himself in the middle of the road, a red R on his chest. He sounds like he has said this a hundred times today. ' +
      'Boris: "Hand over your Pokémon!" A pause. He checks his watch. Boris: "Or don\'t. Then we fight. I\'m paid either way."',
    choices: [
      ch('"Battle."', fight('Boris sighs and throws two Poké Balls without looking. A Koffing and a Zubat drift out, as unenthusiastic as he is.', spar(BORIS, borisM1), B.set('m1'))),
      ch('"How much are you paid?"', fight('Boris blinks. Nobody has ever asked him that before. Boris: "Not enough." For a second he looks like an ordinary tired man. Then he throws his Poké Balls, and the battle is on.', spar(BORIS, borisM1), B.set('m1'), B.set('asked'))),
      ch('"Run."', out('You run. Boris watches you go, hands in his pockets, and does not chase. You hear him mutter that he is not paid for running either.')),
    ],
  }),
  B.meet(2, {
    title: 'Demoted',
    intro:
      'A back corridor of a Rocket base, strip lights buzzing. Boris pushes a mop along the floor with a bucket on squeaky wheels. He freezes when he sees you, then goes back to mopping, slower. ' +
      'Boris: "Lost to you. Now I mop." He wrings the mop out hard. Boris: "Don\'t tell anyone you saw me."',
    choices: [
      ch('"Sneak me in."', out('Boris looks up and down the corridor. Then he leans the mop against the wall and draws you a rough map on the wet floor with the handle: which doors stick, which guards nap after lunch. It dries away in a minute. He says he never saw you.', B.set('m2'), B.set('inside'))), // needs engine: one fewer battle in the next Rocket stage
      ch('"Quit."', out('Boris: "And do what?" He says it like a joke, but it does not come out like one. He looks at the mop in his hands for a long moment, as if it might answer for him. Then he goes back to the floor.', B.set('m2'), B.set('quit-q'))),
      ch('"Battle again."', fight('Boris drops the mop with a clatter. Boris: "Fine. Can\'t get demoted twice." The Koffing and Zubat drift out into the corridor.',
        spar(BORIS, { team: ['koffing', 'zubat'], size: 2, win: [B.set('lost2'), moment('You beat Boris again, in his mop corridor')], lose: [moment('Boris beat you in his mop corridor, and did not look any happier')] }), B.set('m2'))),
    ],
  }),
  B.meet(3, {
    title: 'Choice',
    intro:
      'Alarms, shouting, a Rocket base in uproar. In the middle of a loading bay Boris stands with his back to a stack of crates, his Raticate in front of him, facing his own side. ' +
      'Boris: "They\'re shipping a nest of eggs. I\'m not doing that." Behind him, through a gap in the crates, you can see the eggs, dozens of them, packed in straw.',
    choices: [
      ch('"Fight beside him."', fight('You step in beside Boris. His Raticate glances at your lead and squares up next to it, and the two of you face Team Rocket together.',
        spar('Team Rocket', { format: 'doubles', size: 2, team: ['arbok', 'golbat'], ally: 'raticate', win: [moment('You fought beside Boris to stop a shipment of stolen eggs')], lose: [moment('You and Boris lost, but the eggs never left the bay')] }), B.set('done'), B.set('fought'))),
      ch('"Arrest him."', out('Boris holds out his wrists before you even ask. He goes quietly, and on the walk out he talks: every route, every name, every shipment he ever loaded. It is the first time in years anyone has listened to him this carefully. He hands you a folded plan as evidence.', B.set('done'), B.set('arrested'), B.set('evidence'))), // needs engine: one Rocket plan step revealed
      ch('"Let him go."', out('You nod at the back door. Boris looks at you, then at the eggs, and helps you push the crates out into the daylight first. Then he takes off his black cap, leaves it on a crate, and walks out of the region with his Raticate at his heel.', B.set('done'), B.set('freed'))),
    ],
    remembers: [
      variant('asked', [B.is('asked')], { notice: 'Boris catches your eye across the bay. Boris: "You asked what they paid. Nobody ever asked."' }),
    ],
  }),
];

// ---------- RR45. Team Rocket Grunt Jessa (morning, afternoon; Ekans, Houndour, Meowth) ----------
const JE = rosterKit('jessa', 'npc-meet-team-rocket-grunt-jessa', 'Team Rocket Grunt Jessa');
const JESSA = 'Team Rocket Grunt Jessa';
const jessaM1 = { team: ['ekans', 'houndour'], size: 2, win: [moment('You beat Team Rocket Grunt Jessa on her third day')], lose: [moment('Rocket Grunt Jessa beat you, and looked amazed about it')] };

const jessa: Json[] = [
  JE.meet(1, {
    title: 'Trouble',
    intro:
      'A girl jumps into your path in a Rocket uniform two sizes too big, the sleeves rolled up three times and the cap sliding over one eye. She points at you with great conviction. ' +
      'Jessa: "Stand still, rookie! This is a robbery! Probably!" She pushes the cap back up. It slides down again.',
    choices: [
      ch('"Battle."', fight('Jessa: "Right! Yes! Battle!" She fumbles two Poké Balls and gets them open on the second try. An Ekans and a Houndour tumble out, and the Houndour looks back at her, worried.', spar(JESSA, jessaM1), JE.set('m1'))),
      ch('"Are you new?"', out('Jessa: "Third day." She says it before she can stop herself, then goes pink to the ears. She fiddles with a button on the giant jacket. For a moment she is just a kid in somebody else\'s clothes, wondering how she got here.', JE.set('m1'), JE.set('new'))),
      ch('"Laugh."', fight('Jessa goes scarlet. Jessa: "Don\'t laugh at me!" She hurls her Poké Balls down hard enough to bounce, and the Ekans and Houndour come out bristling on her behalf.', spar(JESSA, jessaM1), JE.set('m1'))),
    ],
  }),
  JE.meet(2, {
    title: 'Trying to Quit',
    intro:
      'A small café, steamed-up windows. Jessa sits in the corner in a plain jumper, no uniform, a cup going cold between her hands. She jumps every time the door opens. She waves you over, then checks the window. ' +
      'Jessa: "I want out. They don\'t let you out." She turns the cup round and round. Jessa: "My Houndour\'s theirs. If I leave, they keep it."',
    choices: [
      ch('"Get the Houndour back."', out('Jessa stares at you. Then she pulls a napkin over and draws, fast: a warehouse by the docks, the kennel row, the gap in the fence. Jessa: "Tonight. Kennel six." Two streets later the warehouse looms up out of the dark.', JE.set('m2'), room(JE.roomId('warehouse')))),
      ch('"Leave without it."', out('She nods slowly. She leaves money on the table and walks out without looking back, but at the door her shoulders shake. You see her stop on the corner, hand pressed to her mouth, before she goes. She grieves for it all the way down the street.', JE.set('m2'), JE.set('left'))),
      ch('"Stay in, for now."', out('Jessa lets out a long breath. Jessa: "One more region. Then I\'m gone." She puts the uniform cap back on under the table, where nobody can see, and tugs it down over her eyes.', JE.set('m2'), JE.set('stayed'))),
    ],
  }),
  JE.room('warehouse', {
    title: 'Kennel Six',
    intro:
      'The Rocket warehouse at night: stacked crates, a single lamp swinging, a guard\'s footsteps somewhere above on the gantry. Down the kennel row, behind a wire door marked 6, a Houndour lifts its head and sniffs. Its tail starts, very quietly, to wag.',
    choices: [
      ch('"Creep along the crates."', out('Shadow to shadow, crate to crate, between the guard\'s footsteps. You slip the kennel latch and the Houndour presses against your legs without a sound. Outside, Jessa drops to her knees and it knocks her flat, licking her face.', JE.set('houndour'), moment('You stole Jessa\'s Houndour back from a Rocket warehouse')), { prompt: { id: 'dodge-tap', needs: 'good' }, fail: out('A crate creaks. A torch beam sweeps the row and you run for it, the Houndour bounding beside you, an alarm wailing behind. Outside, Jessa is crying before you reach her. The Houndour does not care how it got out.', JE.set('houndour'), moment('You stole Jessa\'s Houndour back from a Rocket warehouse')) }),
      ch('"Send a Pokémon to cause a distraction."', out('Your Pokémon knocks a stack of empty crates down at the far end, and every footstep in the building runs towards the noise. You walk the Houndour out the side door. Jessa holds it so tight it squeaks.', JE.set('houndour'), moment('You stole Jessa\'s Houndour back from a Rocket warehouse')), { prompt: { id: 'throw-ring', needs: 'good' }, fail: out('The crash is too early and too loud. You grab the latch and run, the Houndour at your heels and shouting behind. Jessa catches you both at the fence, laughing and sobbing at once.', JE.set('houndour'), moment('You stole Jessa\'s Houndour back from a Rocket warehouse')) }),
    ],
  }),
  JE.meet(3, {
    title: 'Out',
    intro:
      'A Pokémon Center, warm and bright. Behind the front desk, in a pink apron with a name badge, stands Jessa. Her hair is tied back and she looks like she has slept for once. She spots you and leans over the counter. ' +
      'Jessa: "Nurse Joy gave me a chance. Don\'t tell her about the uniform."',
    choices: [
      ch('"I won\'t."', out('Jessa lets out a breath she seems to have been holding since the café. She takes your Poké Balls herself and runs them through the machine, and waves away your money. Jessa: "Here, you\'re always free. Always." The chime sounds, and your whole team comes back bright.', heal(1), JE.set('done'), JE.set('heals'))), // needs engine: free heals at this Center (for the save is cross-run)
      ch('"Battle."', fight('Jessa grins and ducks under the counter. Nurse Joy sighs and lets her. Out on the practice field a Houndoom stretches and yawns, all horns and smoke.',
        spar(JESSA, { team: ['houndoom'], size: 1, win: [moment('You battled Jessa, who got out')], lose: [moment('Jessa\'s Houndoom beat you, out on the Center field')] }), JE.set('done'), JE.set('battled'))),
      ch('"Ask about Rocket."', out('Jessa\'s smile slips. She checks that Nurse Joy is busy, then leans close and tells you one thing, very quietly: an admin\'s weakness, the one thing that admin cannot stand. Jessa: "Use it. Then never ask me again."', JE.set('done'), JE.set('secret'))), // needs engine: the admin's weakness is told but no system reads it yet
    ],
    remembers: [
      variant('stayed', [JE.is('stayed')], {
        intro: 'A Rocket base, deep inside. You come round a corner and there is Jessa in the too-big uniform, alone on guard at a door. She does not raise her Poké Balls. She looks exhausted. Jessa: "Arrest me. Please. It\'s the only way they let you out."',
        hide: [0],
        add: [ch('"Arrest her."', out('You march her out past the guards with your hand on her shoulder, and nobody stops you. Outside, in the open air, she pulls the cap off and throws it in a hedge. On the walk to the station she tells you one thing: an admin\'s weakness.', JE.set('done'), JE.set('secret'), JE.set('arrested')))],
      }),
      variant('houndour', [JE.is('houndour')], { notice: 'Under the desk, curled up on a folded blanket, the Houndour is fast asleep, one paw resting on Jessa\'s shoe.' }),
    ],
  }),
];

// ---------- RR46. Tuber Dot (evening, night; Marill, Psyduck) ----------
const D = rosterKit('dot', 'npc-meet-tuber-dot', 'Tuber Dot');
const DOT = 'Tuber Dot';
const marillEgg = egg({ species: ['marill'] });

const dot: Json[] = [
  D.meet(1, {
    title: 'Splash Fight',
    intro:
      'A paddling pool on the grass by a lake, the evening light gold on the water. In the middle of it sits a tiny kid in a bright inflatable ring, so small the ring holds her up even sitting down. A Marill bobs beside her. ' +
      'She spots you and her whole face lights up. Dot: "Splash fight!"',
    choices: [
      ch('"Battle."', fight('Dot squeals and claps, and the Marill bounces out of the pool and lands in front of you, round and dripping and very serious.', spar(DOT, { team: ['marill'], size: 1, win: [moment('You beat Tuber Dot\'s Marill by the lake')], lose: [moment('Tuber Dot\'s Marill beat you, and she did a lap of the pool')] }), D.set('m1'))),
      ch('"Splash back."', out('You kneel and send a wave over the side. Dot giggles so hard she tips over in her ring and has to be righted by the Marill. When she has her breath back she digs in the pocket of her swimsuit and gives you a Berry, warm from the sun.', item('oran-berry'), D.set('m1'))),
      ch('"Where\'s your parent?"', out('Dot points. On a deckchair a few steps away, under a hat, her dad lifts his hand and waves, one eye open. He has clearly been watching the whole time. Dot splashes you anyway, to be fair.', D.set('m1'))),
    ],
  }),
  D.meet(2, {
    title: 'Swimming Lessons',
    intro:
      'The lake shallows. Dot stands up to her waist with no ring on, arms held stiff out to the sides, the Marill circling her anxiously. Her lip is wobbling. ' +
      'Dot: "Dad says no ring this year. I\'m scared."',
    choices: [
      ch('"Swim with her."', out('You wade in beside her and hold your hands under her, not quite touching. She kicks, splutters, kicks again, and paddles three whole strokes on her own before she grabs your arm. She comes up shrieking with joy.', D.set('m2'), D.set('swam'))),
      ch('"Let Marill help."', out('The Marill slips under her and floats, round and steady, holding her up like a living ring. Dot lies on top of it with her arms spread and laughs and laughs. The Marill looks enormously pleased with itself.', D.set('m2'), D.set('marill'))),
      ch('"Wear it one more year."', out('Dot sags with relief and runs to get the ring. She jams it on over her head and paddles straight back out, happy again. On the deckchair her dad shrugs at you and smiles: one more year is fine.', D.set('m2'), D.set('ring'))),
    ],
  }),
  D.meet(3, {
    title: 'Big Kid',
    intro:
      'The lake again, but Dot is not in the shallows. She is out in the open water, swimming laps, her stroke wobbly but strong, with a big Azumarill swimming alongside. She sees you and stops, treading water. ' +
      'Dot: "Look! No ring!"',
    choices: [
      ch('"Battle."', fight('Dot: "Azumarill, you heard!" The Azumarill hops out onto the bank, ears up, round as ever and twice as strong. Afterwards her dad hands you an egg wrapped in a towel: their Marill had one.',
        spar(DOT, { team: ['azumarill'], size: 1, win: [moment('You battled Tuber Dot, who swims now')], lose: [moment('Tuber Dot\'s Azumarill beat you')] }), D.set('done'), D.set('battled'), marillEgg)),
      ch('"Race."', out('You race her to the buoy and back. Whether you hold back or not, she wins, touching the bank a full arm\'s length ahead and screaming about it. Her dad hands you an egg wrapped in a towel: their Marill had one, and Dot wants you to have it.', D.set('done'), D.set('raced'), marillEgg)),
      ch('"Clap."', out('You clap, and she swims a victory lap. Then she runs up the bank, dripping, and pushes something into your arms: her old ring, faded and a little patched. Dot: "You keep it. I\'m big now." Her dad adds an egg wrapped in a towel.', D.set('done'), D.set('clapped'), moment('Tuber Dot gave you her old swim ring'), marillEgg)),
    ],
  }),
];

// ---------- RR47. Tuber Pip (morning, afternoon; Goldeen, Horsea) ----------
const P = rosterKit('pip', 'npc-meet-tuber-pip', 'Tuber Pip');
const PIP = 'Tuber Pip';
const pipM1 = { team: ['goldeen'], size: 1, win: [moment('You beat Tuber Pip\'s Goldeen')], lose: [moment('Tuber Pip\'s Goldeen beat you, and he went back to sleep')] };

const pip: Json[] = [
  P.meet(1, {
    title: 'Float On',
    intro:
      'A slow green river. A boy drifts past in a rubber tube, head back, mouth open, fast asleep, one hand trailing in the water where a Goldeen nibbles at his fingers. He bumps gently into the bank beside you and wakes with a snort. ' +
      'Pip: "Float on, battle later." He yawns enormously and settles back in.',
    choices: [
      ch('"Battle now."', fight('Pip groans, but rolls out of his tube into the shallows. The Goldeen leaps, flicking water in his face to wake him properly.', spar(PIP, pipM1), P.set('m1'))),
      ch('"Float later."', out('Pip: "Mm. Later." He pushes off and drifts on downstream. Two bends of the river later, there he is again, caught in the reeds and wide awake this time, waiting for you.', P.set('m1'), room(P.roomId('later')))),
      ch('"Let him sleep."', out('You leave him to it. He floats off round the bend, snoring softly, the Goldeen keeping watch beside the tube.')),
    ],
  }),
  P.room('later', {
    title: 'Battle Later',
    intro: 'The tube is wedged in the reeds and Pip is sitting up in it, hair sticking up on one side, the Goldeen circling. Pip: "Told you. Later." He seems very pleased that later has arrived exactly when he said.',
    choices: [
      ch('"Battle."', fight('Pip slides into the water and the Goldeen leaps up beside him, horn gleaming.', spar(PIP, pipM1))),
      ch('"Still sleepy?"', fight('Pip: "Always." But he slides into the water anyway, and the Goldeen leaps up beside him, horn gleaming.', spar(PIP, pipM1))),
    ],
  }),
  P.meet(2, {
    title: 'Drifted',
    intro:
      'You hear a thin shout from the water. Far out on the current, past where anyone should be, is a small tube spinning slowly, and in it Pip, clutching the sides. ' +
      'Pip: "I fell asleep. Where am I?" The current is carrying him further out by the second.',
    choices: [
      ch('"Tow him in."', out('Your Water-type dives in and swims out to him, takes the tube\'s rope in its mouth, and tows him home stroke by steady stroke. Pip clings on, wide-eyed and quiet all the way, and says thank you three times on the bank.', P.set('m2'), P.set('towed')), { requires: [ptype('water')] }),
      ch('"Call his mum."', out('You run for the house up the hill. His mum is out of the door and into a rowing boat before you have finished talking. She rows out furious and hauls him in, scolding the whole way back, then holds him so tight he squeaks.', P.set('m2'), P.set('mum'))),
      ch('"Send a Flying-type with a rope."', out('Your Flying-type takes the end of a rope and beats out over the water against the wind. Pip catches it on the second try. It works: you haul, and he comes skimming back across the current, laughing now that it is over.', P.set('m2'), P.set('rope')), { requires: [ptype('flying')] }),
    ],
  }),
  P.meet(3, {
    title: 'Awake',
    intro:
      'Pip stands on the riverbank in the morning, wide awake, with a Seadra in the shallows at his feet. No tube in sight. He looks older. ' +
      'Pip: "I don\'t float anymore. I train." The Seadra snorts a jet of water as if to agree. In his hand he turns over a dark, gleaming scale.',
    choices: [
      ch('"Battle."', fight('Pip: "Finally, a proper one." The Seadra rises out of the river, spines up. Afterwards he hands you the gleaming scale: a Dragon Scale. Pip: "It shed it. I don\'t need it."',
        spar(PIP, { team: ['seadra'], size: 1, win: [moment('You battled Pip, awake and training')], lose: [moment('Pip\'s Seadra beat you')] }), P.set('done'), P.set('battled'), item('dragon-scale'))),
      ch('"Float once more."', out('Pip hesitates, then grins and drags the old tube out from behind a bush. You both float for a while in the sun, not talking, your team dozing on the bank. At the end he gives you the gleaming scale: a Dragon Scale.', heal(0.5), P.set('done'), P.set('floated'), item('dragon-scale'))),
      ch('"Laugh."', out('You laugh, and Pip laughs too, at himself, at the tube, at the whole sleepy summer. The Seadra splashes you both. When you go he presses the gleaming scale into your hand: a Dragon Scale.', P.set('done'), P.set('laughed'), item('dragon-scale'))),
    ],
  }),
];

// ---------- RR48. Tuber Rudy (morning, night; Poliwag, Poliwhirl) ----------
const RU = rosterKit('rudy', 'npc-meet-tuber-rudy', 'Tuber Rudy');
const RUDY = 'Tuber Rudy';

const rudy: Json[] = [
  RU.meet(1, {
    title: 'Tube Life',
    intro:
      'A boy in a tube spins lazily down the river, arms behind his head, a Poliwag riding on his stomach. He catches a branch to stop beside you. ' +
      'Rudy: "Tube life is the best life." He says it like a motto he made up himself, and he is very proud of it.',
    choices: [
      ch('"Battle."', fight('Rudy lets go of the branch and the Poliwag hops off his stomach onto a rock, its spiral belly swirling.', spar(RUDY, { team: ['poliwag'], size: 1, win: [moment('You beat Tuber Rudy\'s Poliwag')], lose: [moment('Tuber Rudy\'s Poliwag beat you')] }), RU.set('m1'))),
      ch('"Is it?"', out('Rudy: "Better than school." He says it fast, and then looks at the water for a bit, spinning slowly. The Poliwag looks up at him. Then he pushes off and floats on, humming.', RU.set('m1'))),
      ch('"Leave."', out('You leave him spinning on the current. He waves without opening his eyes.')),
    ],
  }),
  RU.meet(2, {
    title: 'Skipping',
    intro:
      'A weekday morning, the river quiet. Somewhere a school bell is ringing. Rudy drifts out from under a bridge in his tube, sees you, and sinks down low in it. ' +
      'Rudy: "Don\'t tell. They\'re doing maths." The Poliwhirl beside him looks distinctly guilty.',
    choices: [
      ch('"Take him to school."', out('You walk him up the hill, his tube under his arm, dripping. He sulks the whole way and drags his feet on the steps. At the door he turns round. Rudy: "Traitor." But he goes in.', RU.set('m2'), RU.set('school'))),
      ch('"Skip with him."', out('You float together under the willows for one glorious hour. Then a shadow falls over you both. His teacher stands on the bridge, arms folded, and catches you both. You get a lecture too. Rudy cannot stop grinning about that.', RU.set('m2'), RU.set('caught'))),
      ch('"Teach him maths with Pokémon."', out('You draw the type chart in the mud with a stick, then work out damage together: power, times the type bonus, times two for super effective. Rudy frowns, counts on his fingers, then sits bolt upright. He gets it. He wants another one.', RU.set('m2'), RU.set('taught'))),
    ],
  }),
  RU.meet(3, {
    title: 'Top of the Class',
    intro:
      'Rudy runs to meet you on the riverbank, waving a sheet of stiff paper with a gold seal on it, a Poliwrath stamping along behind him. ' +
      'Rudy: "First in maths. Because of Pokémon." He holds the certificate up beside his face so you can see both at once.',
    choices: [
      ch('"Battle."', fight('Rudy: "I\'ve calculated this." The Poliwrath cracks its knuckles. Afterwards he gives you a Water Stone, the one that evolved his Poliwhirl. Rudy: "Seemed right."',
        spar(RUDY, { team: ['poliwrath'], size: 1, win: [moment('You battled Rudy, first in maths')], lose: [moment('Rudy\'s Poliwrath beat you, exactly as he calculated')] }), RU.set('done'), RU.set('battled'), item('water-stone'))),
      ch('"Tube once more."', out('Rudy whoops and fetches two tubes. You float down the river together in the sun, certificate tucked safely in a plastic bag on his chest. At the end he gives you a Water Stone, the one that evolved his Poliwhirl.', heal(0.5), RU.set('done'), RU.set('tubed'), item('water-stone'))),
      ch('"Show me."', out('Rudy pulls out a notebook full of type charts and sums. He asks about the next boss, works through it with his tongue between his teeth, and taps one line: your best move against them. He gives you a Water Stone, the one that evolved his Poliwhirl.', gym(), RU.set('done'), RU.set('best-move'), item('water-stone'))), // needs engine: the best move against the next boss (gymPreview shows only the team)
    ],
  }),
];

// ---------- RR49. Tuber Sunny (morning, afternoon; Shellder, Staryu) ----------
const SU = rosterKit('sunny', 'npc-meet-tuber-sunny', 'Tuber Sunny');
const SUNNY = 'Tuber Sunny';

const sunny: Json[] = [
  SU.meet(1, {
    title: 'Waves',
    intro:
      'A sunny beach, the waves small and sparkling. A girl in a yellow ring bobs just past the breakers, waving both arms over her head at you. ' +
      'Sunny: "Come join the waves!" A Staryu spins past her on the surf, its gem flashing.',
    choices: [
      ch('"Battle."', fight('Sunny paddles in and her Shellder and Staryu come tumbling up the sand after her, both glittering wet.', spar(SUNNY, { team: ['shellder', 'staryu'], size: 2, win: [moment('You beat Tuber Sunny on the beach')], lose: [moment('Tuber Sunny\'s beach pair beat you')] }), SU.set('m1'))),
      ch('"Join."', out('You wade in. The water is warm and the waves lift you and set you down, over and over. Sunny shows you how to float on your back and look at the sky. Your Pokémon splash in the shallows. You come out salty and rested.', heal(0.5), SU.set('m1'))),
      ch('"Leave."', out('You wave back and walk on along the dunes. She keeps waving until you are out of sight.')),
    ],
  }),
  SU.meet(2, {
    title: 'Shells',
    intro:
      'Sunny walks slowly along the tideline with a bucket, stopping every few steps to pick something up and look at it carefully. She shows you one: pink, curled, perfect. ' +
      'Sunny: "I\'m collecting for my gran. She can\'t walk to the beach anymore."',
    choices: [
      ch('"Help collect."', out('You walk the tideline together for an hour, both of you bent double, your Pokémon digging and bringing things. Spiral shells, flat ones, a blue one like a fingernail. The bucket fills to the brim. Sunny carries it home with both arms, very carefully.', SU.set('m2'), SU.set('shells'))),
      ch('"Bring her to the beach."', out('Sunny stares, then runs. You find a wheelchair at the Center, and a Machoke who is happy to push it through the soft sand. Her gran comes down the dunes laughing and holding on to her hat, and sits at the edge of the sea for the first time in years.', SU.set('m2'), SU.set('gran'))),
      ch('"Find a rare one."', out('Out on the rocks a Shellder sits half-open in a pool. It watches you for a long time, then clacks its shell and leaves something behind: a pearl, small and pink and glowing. Sunny holds it like it might break. Sunny: "Gran\'s going to cry."', SU.set('m2'), SU.set('pearl'))),
    ],
  }),
  SU.meet(3, {
    title: 'Gran',
    intro:
      'Sunny and her gran sit together on a blanket on the sand, a striped windbreak flapping beside them. Gran wears a big straw hat and an old jacket with a badge pinned to the collar that you almost recognise. She pats the blanket for you to sit. ' +
      'Gran: "She talks about you. The trainer who helped." Sunny goes red and pretends to look at the sea.',
    choices: [
      ch('"Battle Sunny."', fight('Sunny jumps up, delighted. Her Starmie and Cloyster come out of the surf, both grown up now, like her. Afterwards Gran presses a pearl into your hand from Sunny\'s bucket.',
        spar(SUNNY, { team: ['starmie', 'cloyster'], size: 2, win: [moment('You battled Sunny on the beach, with Gran watching')], lose: [moment('Sunny beat you, with Gran cheering')] }), SU.set('done'), SU.set('battled'), item('pearl'))),
      ch('"Sit with gran."', out('You sit. Gran tells you about the sea when she was young, and Sunny lies with her head in Gran\'s lap and listens to stories she has heard a hundred times. Your team sleeps in the sun until every one of them is whole again. Gran gives you a pearl when you go.', heal(1), SU.set('done'), SU.set('sat'), item('pearl'))),
      ch('"Battle gran."', fight('Gran laughs and takes off her hat. Gran: "Oh, I haven\'t done this in years." She whistles, and out of the sea rises an old Lapras, scarred and calm. The badge on her collar: she was a Gym Leader once.',
        spar('Gran', { team: ['lapras'], size: 1, lv: 2, win: [item('tm-ice'), moment('You battled Sunny\'s gran, a retired Gym Leader, and her old Lapras')], lose: [item('pearl'), moment('Sunny\'s gran, a retired Gym Leader, beat you with her old Lapras')] }), SU.set('done'), SU.set('gran-battle'))),
    ],
  }),
];

// ---------- RR50. Twins Nia and Mia (doubles; evening, night; Pikachu, Pachirisu, Plusle) ----------
const T = rosterKit('twins', 'npc-meet-twins-nia-and-mia', 'Twins Nia and Mia');
const TWINS = 'Twins Nia and Mia';

const twins: Json[] = [
  T.meet(1, {
    title: 'Two for One',
    intro:
      'Two identical girls step out under a streetlamp in the evening, same bunches, same dresses, striking the exact same pose with a hand on one hip. ' +
      'Nia: "Two for the price of one!" Mia: "One for the price of two!" Nia shoots her a sideways look. Nia: "That\'s not how it goes." Neither of them breaks the pose.',
    choices: [
      ch('"Battle."', fight('The twins spin on the spot, perfectly together, and a Pikachu and a Pachirisu leap out side by side, sparking.',
        spar(TWINS, { format: 'doubles', team: ['pikachu', 'pachirisu'], size: 2, win: [moment('You beat Twins Nia and Mia in a double battle')], lose: [moment('Twins Nia and Mia beat you, two for one')] }), T.set('m1'))),
      ch('"Which is which?"', out('You point at the left one and say Nia. They squeal: you are right. Then they spin round each other twice, so fast you lose track, and now you have no idea. They are delighted. They do it again just to watch your face.', T.set('m1')), { chance: 0.5, fail: out('You point at the left one and say Nia. They squeal: wrong, that is Mia. Then they spin round each other twice and swap anyway, so you will never know. They are delighted. They do it again just to watch your face.', T.set('m1')) }),
      ch('"Leave."', out('You leave them posing under the lamp. When you look back they are still holding it, perfectly still, in case someone else comes along.')),
    ],
  }),
  T.meet(2, {
    title: 'Swapped',
    intro:
      'One twin alone, sitting on a low wall, swinging her feet. Without her sister beside her she looks smaller, and not quite sure what to do with her hands. ' +
      'Twin: "I\'m Mia. Probably. We swapped so long I\'m not sure." She laughs, but she is waiting for an answer.',
    choices: [
      ch('"You\'re Mia."', out('She smiles, slow and wide, like you gave her something. She says it again quietly to herself, trying it on: Mia. Then she hops down off the wall and walks home with a little bounce in it.', T.set('m2'), T.set('named'))),
      ch('"Ask Nia."', out('Her sister comes running round the corner when called, and looks her up and down very seriously. Nia: "She\'s Nia." Both of them burst out laughing so hard they have to hold each other up, and the question does not seem to matter any more.', T.set('m2'), T.set('laughed'))),
      ch('"Does it matter?"', out('She thinks about it for a long time, swinging her feet. Twin: "...Not really." She looks lighter for saying it. Whoever she is, she is the one who goes home to the same sister.', T.set('m2'), T.set('okay'))),
    ],
  }),
  T.meet(3, {
    title: 'Different Hats',
    intro:
      'The twins again, under the same streetlamp, still identical in every way except one: one wears a red hat and one wears a blue hat. ' +
      'Nia touches the red brim. Nia: "We decided. Red hat\'s me." Mia: "For now." They look at each other and grin. A Plusle sits on the blue hat\'s shoulder.',
    choices: [
      ch('"Battle."', fight('The twins spin, together still, and a Raichu and a Pachirisu leap out side by side, crackling.',
        spar(TWINS, { format: 'doubles', team: ['raichu', 'pachirisu'], size: 2, win: [moment('You beat the twins in their different hats')], lose: [moment('The twins in different hats beat you')] }), T.set('done'), T.set('battled'))),
      ch('"Tag with red."', out('Nia whoops and jumps to your side. Nia: "Red team!" For a while she travels with you, ready to stand beside you in a double battle, while Mia shouts advice from behind.', companion(1), T.set('done'), T.set('red'))),
      ch('"Tag with blue."', out('Mia beams and steps to your side, the Plusle hopping onto your shoulder. Mia: "Blue team. For now." For a while she travels with you, ready to stand beside you in a double battle.', companion(1), T.set('done'), T.set('blue'))),
    ],
  }),
];

// ---------- RR51. Young Couple Dan and Eri (doubles; evening, night; Volbeat, Illumise) ----------
const DE = rosterKit('danieri', 'npc-meet-young-couple-dan-and-eri', 'Young Couple Dan and Eri');
const COUPLE = 'Young Couple Dan and Eri';

const danieri: Json[] = [
  DE.meet(1, {
    title: 'Together',
    intro:
      'A couple stands holding hands under a streetlight in the warm evening, and above them a Volbeat and an Illumise circle the lamp, drawing slow loops of light. ' +
      'Dan: "Together we can\'t lose." Eri, without letting go of his hand: "Statistically we can." Dan squeezes her hand anyway.',
    choices: [
      ch('"Battle."', fight('The Volbeat and Illumise drop from the lamp and hover side by side, tails glowing, in step with each other.',
        spar(COUPLE, { format: 'doubles', team: ['volbeat', 'illumise'], size: 2, win: [moment('You beat Dan and Eri under the streetlight')], lose: [moment('Dan and Eri beat you, together')] }), DE.set('m1'))),
      ch('"Who\'s right?"', out('They both turn and look at you, perfectly together, waiting. Dan hopeful, Eri with one eyebrow raised. Whatever you say, they look at each other afterwards and smile like it proved their point.', DE.set('m1'))),
      ch('"Leave."', out('You leave them under the lamp. The bugs keep drawing their loops of light, and the two of them do not notice you go.')),
    ],
  }),
  DE.meet(2, {
    title: 'The Ring',
    intro:
      'Dan alone, pacing under a tree, a small velvet box in his hand that he keeps opening and shutting. He has clearly been here a while. The Volbeat blinks anxiously on his shoulder. ' +
      'Dan: "I\'m asking tonight. If I battle you and win, I\'ll be brave enough."',
    choices: [
      ch('"Let him win."', out('You battle, and you hold back just enough. He wins. He punches the air, kisses the box, and runs off towards the lights without a backward look. He is brave now. He thinks he earned it.', DE.set('m2'), DE.set('thrown'))),
      ch('"Battle fair."', fight('Dan nods, swallowing hard. Dan: "Fair. Yeah. Fair." The Volbeat lifts off his shoulder. Whatever happens, he puts the box in his pocket and goes to ask her.',
        spar('Dan', { team: ['volbeat'], size: 1, win: [moment('You beat Dan fair, and he asked her anyway')], lose: [moment('Dan beat you fair, and went to ask her')] }), DE.set('m2'), DE.set('fair'))),
      ch('"You don\'t need a win."', out('Dan stops pacing. He looks at the box for a long moment. Then he shuts it, puts it in his pocket, takes a breath, and walks off to ask her without battling anyone at all.', DE.set('m2'), DE.set('brave'))),
    ],
  }),
  DE.meet(3, {
    title: 'Wedding',
    intro:
      'A garden wedding at dusk, chairs in rows on the lawn, the air smelling of cut grass. Up the aisle, a Volbeat and an Illumise light the way, drifting from post to post. Eri, in white, spots you at the gate and waves you in. ' +
      'Eri: "You\'re invited. Obviously."',
    choices: [
      ch('"Attend."', out('You sit near the back. Dan cries before Eri even reaches him, and she rolls her eyes and cries too. There is cake and dancing on the lawn, and your team eats and sleeps and dances until every one of them is rested and happy.', heal(1), bond(1, 'party'), DE.set('done'), DE.set('attended'))),
      ch('"Battle the couple."', fight('Eri: "A wedding double? Statistically, yes." Dan is already rolling up his sleeves. The Volbeat and Illumise swing down from the aisle, glowing brighter than ever.',
        spar(COUPLE, { format: 'doubles', team: ['volbeat', 'illumise'], size: 2, win: [moment('You battled Dan and Eri at their wedding')], lose: [moment('Dan and Eri beat you at their own wedding')] }), DE.set('done'), DE.set('battled'))),
      ch('"Give a gift."', out('You find something in your bag and wrap it as well as you can. Eri unwraps it carefully and laughs. In return they press a warm egg into your hands, from the Volbeat and the Illumise. Dan: "It\'s from all four of us."', egg({ species: ['volbeat', 'illumise'] }), DE.set('done'), DE.set('gift'))),
    ],
    remembers: [
      variant('thrown', [DE.is('thrown')], { notice: 'Eri catches your arm at the gate, smiling. Eri: "You let him win. That\'s sweet. Don\'t do it again."' }),
    ],
  }),
];

export const EVENTS: Json[] = [...marina, ...garrett, ...boris, ...jessa, ...dot, ...pip, ...rudy, ...sunny, ...twins, ...danieri];
export const REMOVE: string[] = [];

/** Where each event is scripted (for docs/status/co-people.md and the `extra` list of the status file). */
const arc = (base: string, rr: number): Record<string, string> => ({ [base]: `RR${rr} M1`, [`${base}-m2`]: `RR${rr} M2`, [`${base}-m3`]: `RR${rr} M3` });
export const DOC: Record<string, string> = {
  ...arc('npc-meet-swimmer-marina', 42), ...arc('npc-meet-tamer-garrett', 43), ...arc('npc-meet-team-rocket-grunt-boris', 44),
  ...arc('npc-meet-team-rocket-grunt-jessa', 45), 'npc-meet-team-rocket-grunt-jessa-warehouse': 'RR45 M2 (Get the Houndour back)',
  ...arc('npc-meet-tuber-dot', 46), ...arc('npc-meet-tuber-pip', 47), 'npc-meet-tuber-pip-later': 'RR47 M1 (Float later)',
  ...arc('npc-meet-tuber-rudy', 48), ...arc('npc-meet-tuber-sunny', 49), ...arc('npc-meet-twins-nia-and-mia', 50), ...arc('npc-meet-young-couple-dan-and-eri', 51),
};

/** Flags nothing in this file reads: where the doc says they come back (merged into src/data/catalogOverhaul/flags/people.json). */
const REUNION = 'All-Star Tournament and Final Reunion (ROAD_ROSTER.md, How the Roster runs)';
export const AFTERSTORY: { match: string; readBy: string }[] = [
  { match: 'roster-marina-(pushed|waited|friends|rode|battled|thanked)', readBy: `${REUNION}; the Swim Club crossover with Kai and Finn (Roster crossovers)` },
  { match: 'roster-garrett-(saw|lost-it|told|battled|hugged|left)', readBy: `${REUNION} (RR43)` },
  { match: 'roster-boris-(inside|quit-q|lost2|fought|arrested|freed)', readBy: `${REUNION}; Boris and Jessa at the Center (Roster crossovers). inside = one fewer battle in the next Rocket stage (RR44 M2, needs engine)` },
  { match: 'roster-boris-evidence', readBy: 'RR44 reward: one Rocket plan step revealed (needs engine)' },
  { match: 'roster-jessa-(new|left|battled|arrested)', readBy: `${REUNION}; Boris and Jessa at the Center (Roster crossovers)` },
  { match: 'roster-jessa-(heals|secret)', readBy: 'RR45 M3 reward: free heals at this Center (needs engine) / an admin\'s weakness (needs engine)' },
  { match: 'roster-dot-(swam|marill|ring|battled|raced|clapped)', readBy: `${REUNION}; Dot joins the Rattata Club (Roster crossovers)` },
  { match: 'roster-pip-(towed|mum|rope|battled|floated|laughed)', readBy: `${REUNION} (RR47)` },
  { match: 'roster-rudy-(school|caught|taught|battled|tubed)', readBy: `${REUNION} (RR48)` },
  { match: 'roster-rudy-best-move', readBy: 'RR48 M3: his best move against the next boss (needs engine; the gym preview shows the team only)' },
  { match: 'roster-sunny-(shells|gran|pearl|battled|sat|gran-battle)', readBy: `${REUNION} (RR49)` },
  { match: 'roster-twins-(named|laughed|okay|battled|red|blue)', readBy: `${REUNION}; the twins as a tag partner (RR50 reward)` },
  { match: 'roster-danieri-(fair|brave|attended|battled|gift)', readBy: `${REUNION}; the double-double with Leon and Sky (Roster crossovers)` },
];
