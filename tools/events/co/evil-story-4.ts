// Catalog Overhaul Pack, STORY_FAMILIES_18 SF130: the Operation scenes, each team's variety pool. Once The Plan has run (beat 6),
// one scene from the region's team's pool turns up in the region (the mark `scene` closes the pool until the next region).
// Every scene has the doc's three buttons: "Stop them." (a battle; winning marks `op-stopped`, which SF13's "stop all four" counts),
// the scene's own other way (a node, or a Pokémon of a stated type), and "Walk on." with its consequence stated before the choice.
// Plasma's Operations 1 to 3 keep their home on the weekly Plasma Operation game event (its objectives count them).
import { $, ch, ev, fight, flag, flagIs, inRegion, join, out, room, trainer, wild, egg, stopHere, money, type Json } from '../dsl.ts';
import { evil as story, foe, kind, node, rep, rivalTrust } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-story';

const mark = (m: string): Json => story({ mark: m });
const SCENE = mark('scene');
const gate = (team?: string): Json[] => [{ kind: 'evil', ...(team ? { team } : {}), after: 6, ends: ['none'], lacks: 'scene' }];
const say = (who: string, line: string): string => `${who}: "${line}"`;
const pick = (...types: string[]) => ({ pick: { types } });

interface Scene { id: string; name: string; team?: string; region?: string; intro: string; stop: string; way: Json; walk: Json; extra?: Json[]; remembers?: Json[]; pokemon?: string; effect?: string }

/** Builds one scene: Stop them (battle) / the other way / Walk on. Every outcome closes the pool for the region. */
function scene(s: Scene): Json {
  const j = s.team ? teamJson(s.team) : null;
  const grunt = j ? j.ranks.grunt.name : 'Grunt';
  const stop = ch('Stop them.', fight(s.stop, foe('grunt', grunt, 3, { chain: 2, win: [mark('op-stopped'), $(900)] }), SCENE));
  const withScene = (c: Json): Json => ({ ...c, success: { ...(c.success as Json), effects: [...((c.success as Json).effects as Json[]), SCENE] } });
  const requires = s.region ? [inRegion(s.region), { kind: 'evil', after: 6, ends: ['none'], lacks: 'scene' }] : gate(s.team);
  const e = ev(s.id, s.name, 'Evil Teams', { requires, cast: [j ? j.ranks.grunt.sprite : 'trainer.pr/rocket_grunt_m'], ...(j ? { tint: j.color } : {}), ...(s.pokemon ? { pokemon: s.pokemon } : {}), ...(s.effect ? { effect: s.effect } : {}), ...(s.remembers ? { remembers: s.remembers } : {}) },
    s.intro, [stop, withScene(s.way), withScene(s.walk), ...(s.extra ?? []).map(withScene)]);
  if (!j) e.scene = { ...(e.scene as Json), cast: [] };
  return e;
}

const fightWalk = (text: string, team: string | undefined, o: { lv?: number; chain?: number; size?: number } = {}) =>
  ch('Walk on.', fight(text, foe('grunt', team ? teamJson(team).ranks.grunt.name : 'Grunt', o.size ?? 3, { chain: o.chain ?? 1, lv: o.lv, win: [$(600)] })));

const ROCKET: Scene[] = [
  { id: 'rocket-ambush', name: 'The Ambush', team: 'rocket', effect: 'net',
    intro: `A net drops out of the trees and over your whole team at once. Two Rocket Grunts jump down after it and strike a pose they have obviously practised in a mirror. ${say('Both of them', 'Prepare for trouble!')} A pause. ${say('The smaller one', `...We practised the rest. Hang on.`)} He gets out a card. Under the net, your lead is looking at you, waiting to be told what to do. If you walk on, they'll take one of your Pokémon to their Holding Pen at the Hideout.`,
    stop: `"Make it double!" the bigger one shouts, a beat too late, and they both reach for their Balls.`,
    way: ch('Cut the net.', out(`Your Pokémon saws through the cords while the two of them argue over whose line it was. By the time they look up, the net is empty and you are well down the road.`), pick('bug', 'grass')),
    walk: ch('Walk on.', out(`You can't get the net off in time. They drag the last one in the net away while you're still pulling at the knots. "It's in the Pen!" the smaller one shouts over his shoulder, like that helps. It's at their Hideout now. You'll have to go and get it.`, story({ steal: 1 }))) },
  { id: 'rocket-roadblock', name: 'The Roadblock', team: 'rocket',
    intro: `A barrier across the road, painted red and white by someone who ran out of white. A Rocket Grunt sits on an upturned crate beside it with a cash tin. ${say('Grunt', 'Team Rocket toll! ₽500 or battle!')} If you walk on, you pay the ₽500, and that's all.`,
    stop: `"Battle it is," he sighs, and closes the tin first, carefully.`,
    way: ch('Ask who the toll goes to.', out(`${say('Grunt', `...The boss. Mostly. Some of it's lunch.`)} You pay, and ask for a receipt. He's so pleased someone asked that he writes one out properly, with the warehouse address it gets paid into. That address is going in your files.`, $(-500), mark('files')), { requires: [money(500)] }),
    walk: ch('Walk on.', out(`You count out ₽500 into the tin. He lifts the barrier with a little bow. The money is gone, and somewhere a Rocket boss is slightly richer.`, $(-500)), { requires: [money(500)] }) },
  { id: 'vt-rocket-cargo-truck', name: 'The Cargo Truck', team: 'rocket',
    intro: `A truck with a big red R on the side thunders past. The back door is loose. Crates bounce out one after another and roll down the hill into the long grass, and something in each one cries out when it lands. If you walk on, the crates are collected and taken to their Holding Pen.`,
    stop: `The truck screeches to a stop. Two Grunts jump down to pick up the crates and find you already standing over them.`,
    way: ch('Open the crates. (a node)', fight(`You spend an hour finding every crate in the grass. Three frightened Pokémon scatter into the trees. One doesn't. It sits at your feet and looks up, deciding about you.`, wild({}), ...node())),
    walk: ch('Walk on.', out(`You keep walking. Behind you, the truck backs up the hill, and two Grunts throw the crates back in. The crying goes with them, to the Pen.`, mark('pen-extra'))) },
  { id: 'vt-rocket-disguise-gig', name: 'The Disguise', team: 'rocket',
    intro: `A spare Rocket uniform hangs on a hook by the warehouse gate, cap and all. The guards going in and out don't look at faces. They look at the big R. If you walk on, nothing changes.`,
    stop: `You knock on the gate instead. The guards look at you, then at each other, then reach for their Balls.`,
    way: ch('Put it on.', out(`It's two sizes too big and smells of someone else's lunch. You pull the cap down. The next guard nods at you and holds the door. When you reach the Hideout, one room will wave you straight through.`, mark('quiet'), mark('disguise'))),
    walk: ch('Walk on.', out(`You leave the uniform on its hook. Some things you'd rather not wear.`)) },
  { id: 'vt-rocket-radio-hijack', name: 'The Radio Hijack', team: 'rocket',
    intro: `Every radio in town plays the same jammed buzz. An old man taps his against the table, again and again, as if it will bring back the song he was listening to. A Rocket transmitter hums on a pole above the square. If you walk on, Rocket's broadcast runs and prices in this region go up by a tenth.`,
    stop: `The two Grunts guarding the pole see you looking up at it.`,
    way: ch('Short it out.', out(`Your Pokémon puts one spark into the box and it dies with a pop. A second later every radio in town comes back at once, all playing different songs. The old man laughs out loud. The town knows who did it.`, rep(1)), pick('electric')),
    walk: ch('Walk on.', out(`You leave the buzz behind you. By the next town the broadcast is everywhere, telling people the prices are going up, and somehow they are.`, story({ mods: [{ kind: 'priceMultiplier', group: 'all', value: 1.1 }], modsText: 'Shop prices are 10% higher while you are in this region' }))) },
];

const AQUA: Scene[] = [
  { id: 'aqua-dig', name: 'The Dig', team: 'aqua',
    intro: `Aqua Grunts are digging a trench up the shore, and the sea is following them in. ${say('Grunt', `There's a cave under here. The sea used to fill it. It will again.`)} In the bottom of the trench a Shellder is stranded on the wet sand, clamped shut. If you walk on, the dig reaches the cave, and their Hideout will be half flooded when you get there.`,
    stop: `"Hey! This is a conservation site!" They drop the shovels and pick up their Balls.`,
    way: ch('Fill it back in.', out(`Your Pokémon pushes the sand back into the trench faster than they can dig it out. The Grunts give up and go to complain to someone. The Shellder opens up, looks at you, and decides it is coming with you.`, join({ species: ['shellder'] })), pick('ground')),
    walk: ch('Walk on.', out(`You leave them to it. By evening the dig reaches the cave and the sea pours in. Their Hideout will be half underwater when you find it.`, mark('hideout-flooded'))) },
  { id: 'aqua-flood', name: 'The Flood', team: 'aqua',
    intro: `Water pours through an opened sluice into a green valley. An Aqua Admin stands on the gate with her arms wide. ${say('Admin', `It's for the Pokémon! More sea, more homes!`)} A Diglett family floats past on a log, all of them looking back at the holes where they lived. If you walk on, the valley floods and the Diglett line is gone from this region.`,
    stop: `The Admin sees you coming and whistles. Grunts come up out of the water.`,
    way: ch('Ask the Diglett. (a node)', out(`You wade out and pull the log in, and set it in front of her. The Diglett look up at her. She looks down at them. She says nothing for a long time. Then she climbs down and closes the sluice herself, and won't look at you while she does it.`, ...node(), ...kind(1))),
    walk: ch('Walk on.', out(`By the time you reach the ridge the valley is a lake. Somewhere under it are a lot of empty holes. You won't see a Diglett in this region again.`, flag('region-diglett-gone'))) },
  { id: 'vt-aqua-leak-patrol', name: 'The Leak Patrol', team: 'aqua',
    intro: `A cracked pipe sprays sea water across the path. Two Aqua Grunts stand in the spray arguing about whose fault it is. ${say('One', 'You said you tightened it!')} ${say('The other', 'You said YOU did!')} If you walk on, the leak floods the path, and the next stop costs you more time.`,
    stop: `They stop arguing, which is something, and turn on you instead.`,
    way: ch(`"It's both of yours."`, out(`They both open their mouths, and close them. Your Pokémon plugs the crack while they're thinking about it. They walk off still arguing, and one of them drops a key without noticing. It has a Hideout tag on it.`, flag('hideout-key')), pick('water')),
    walk: ch('Walk on.', out(`You go round. By the time you get back on the path, it's a stream, and the next stretch of road takes twice as long.`, flag('next-node-slow'))) },
  { id: 'vt-aqua-submarine-dock', name: 'The Submarine Dock', team: 'aqua',
    intro: `A hatch stands open in the sea wall, and inside it a submarine sits low in the water, heavy with cargo. Some of the cargo is moving. One guard, bored, throws pebbles off the pier. If you walk on, the submarine leaves, and its cargo goes to their Holding Pen.`,
    stop: `The guard stops throwing pebbles. A second one climbs out of the hatch.`,
    way: ch('Swim under the pier.', out(`Your Pokémon carries you under the pier in the dark water, and you slacken the mooring rope knot by knot. The submarine drifts out on the tide, empty and harmless, with the guard still on the pier. Behind you the cargo is already swimming for the rocks.`, ...kind(1)), pick('water')),
    walk: ch('Walk on.', out(`The submarine slides out into the bay and under. Whatever was in it is on its way to the Holding Pen.`, mark('pen-extra'))) },
  { id: 'vt-aqua-tide-turner', name: 'The Tide-Turner', region: 'hoenn',
    intro: `A huge brass dial on top of a sea tower controls the tide for the whole bay. Aqua wants it high. Magma wants it low. You can see both teams coming along the beach from opposite ends, running. If you walk on, whichever team is this region's gets the tide, and their Hideout fight will be easier for them.`,
    stop: `You get to the top first. So do two of them.`,
    way: ch('Leave it where it is.', out(`Your Pokémon bends the wheel round the middle mark until it won't turn any further. The tide stops exactly halfway. Both teams arrive at the top of the tower, out of breath, look at the wheel, and start blaming each other. You leave them to it.`, mark('tide-locked')), pick('steel')),
    walk: ch('Walk on.', out(`From the road you hear the wheel turning, and a cheer. The tide moves. Wherever their Hideout is, it is the way they want it now.`, mark('tide-theirs'))) },
];

const MAGMA: Scene[] = [
  { id: 'magma-drill', name: 'The Drill', team: 'magma', effect: 'shake',
    intro: `A drill the size of a house bites into the mountainside, and the ground shakes in time with it. ${say('Grunt', 'More land! The world needs more land!')} He laughs. The Pokémon that live on the mountain are leaving it in a long, quiet line. If you walk on, the drill opens a vent, and the sun burns over every road in this region.`,
    stop: `"Hey, no visitors!" The Grunts climb down off the rig.`,
    way: ch('Cool the bit.', out(`Your Pokémon pours water over the bit until it glows, smokes, and cracks in half with a sound like a bell. The drill whines to a stop. The Grunts stare at it. The line of Pokémon stops, and turns, and slowly starts going home.`), pick('water')),
    walk: ch('Walk on.', out(`Behind you the drill breaks through. Steam roars out of the mountain, and the sky in this region goes hot and white.`, flag('region-sun-vent'))) },
  { id: 'magma-heist', name: 'The Heist', team: 'magma',
    intro: `Magma Grunts stand around a crate that is smoking gently. ${say('Grunt', 'Volcanic core samples. Stand back.')} Something inside the crate knocks, twice. If you walk on, Magma takes the crate to their Hideout.`,
    stop: `"Samples," the Grunt says again, stepping in front of it. His friends step in too.`,
    way: ch('Ask what\'s in it.', out(`They look at each other. None of them know. Nobody told them. So you open it together. Inside, wrapped in a fireproof blanket, is an egg, hot as an ember and rocking gently. The Grunts go very quiet. "Take it somewhere it'll be looked after," one says. "Please." You know a Day-Care that will.`, egg({ types: ['fire'] }), flag('daycare-egg'))),
    walk: ch('Walk on.', out(`They lift the crate onto a truck. The knocking goes with it, to their Hideout.`, mark('pen-extra'))) },
  { id: 'vt-magma-flood-valve', name: 'The Flood Valve', team: 'magma',
    intro: `A big red valve controls the coolant in a Magma lab. Flood it and everything inside drowns. Drain it and the lab burns. Through the window you can see cages, and the Pokémon in them can see you. If you walk on, the lab burns.`,
    stop: `The two Grunts at the valve see you and step away from it, towards you.`,
    way: ch('Get them out first. (a node)', out(`You go in. One cage at a time, you carry every Pokémon out into the air, until your arms shake. Then you turn the valve, and it doesn't matter which way any more.`, ...node(), ...kind(2))),
    walk: ch('Walk on.', out(`You're three bends down the road when you hear it go. You don't look back. You hear it anyway.`, ...kind(-1))) },
  { id: 'vt-magma-quarry-strike', name: 'The Quarry Strike', team: 'magma',
    intro: `Magma is strip-mining a hillside. Behind two guards and a rig, rare ore glints in the cut. If you walk on, Magma takes the ore, and the lieutenant at their Hideout will carry something rare.`,
    stop: `The guards see you coming up the cut.`,
    way: ch('Bring the cut down.', out(`Your Pokémon sets its shoulder to the cliff and pushes, carefully. The cut slides in on itself with a long roar. Nobody is under it. The ore is buried for good, and the rig is half buried with it.`), pick('rock')),
    walk: ch('Walk on.', out(`They load the ore by the cartload. Somebody at the Hideout is going to have a very nice new held item.`, mark('lt-rare-item'))) },
  { id: 'vt-magma-seismograph', name: 'The Seismograph', team: 'magma',
    intro: `The village quake alarm is blaring. People are grabbing children and Pokémon and running. The ground is perfectly still. A Magma Grunt is leaning on the cable box in the square, whistling. If you walk on, the village empties, Magma loots it, and the village remembers that you didn't help.`,
    stop: `He sees you see him, and stops whistling.`,
    way: ch('Show the village.', out(`You walk up and lift his hand off the box. The alarm stops. In the silence, the whole village turns round and looks at him. Somebody laughs. Then everybody does. He goes very red, and leaves.`, rep(1))),
    walk: ch('Walk on.', out(`By the time the village comes back, the houses are open and empty. They saw you on the road. They saw you keep walking.`, rep(-1))) },
];

const GALACTIC: Scene[] = [
  { id: 'galactic-lecture', name: 'The Lecture', team: 'galactic',
    intro: `A Galactic speaker stands on a crate in the square. "A new world, without spirit! Without pain!" A kid in the crowd puts her hand up. "Without spirit means without Pokémon." Nobody answers her. If you walk on, the crowd nods along, and one more Grunt joins the Hideout.`,
    stop: `"Hecklers," he says, and Grunts come out of the crowd.`,
    way: ch('Ask him what he\'d lose. (a node)', out(`You ask him, in front of everyone. He opens his mouth, and his Bronzor floats up beside him, and he looks at it. For a long time. Then he gets down off the crate and walks away with it, and the crowd lets him go.`, ...node(), ...kind(1))),
    walk: ch('Walk on.', out(`The crowd nods along. By the end of the speech, one of them has signed up.`, mark('extra-grunt'))) },
  { id: 'galactic-survey', name: 'The Survey', team: 'galactic',
    intro: `A Grunt with a handheld scanner steps into your path. ${say('Grunt', 'Mind if I scan your party? Just a survey.')} If you walk on, he scans your team, and the lieutenant at their Hideout will be ready for your lead.`,
    stop: `"That's a no, then," he says, and calls for backup.`,
    way: ch('Scan yours first.', out(`He shrugs and points it at his own Pokémon. The readings are low. Very low. He shakes the scanner, and tries again, and then he goes pale and runs for the Pokémon Center without another word.`, ...kind(1))),
    walk: ch('Walk on.', out(`He scans your team and nods, writing it all down. Somewhere, someone is building a team to beat yours.`, mark('scanned'))) },
  { id: 'vt-galactic-orders', name: 'Cyrus\'s Orders', team: 'galactic',
    intro: `A folded note on a park bench, signed with one stern C. It's their next Operation, step by step, in very neat handwriting.`,
    stop: `As you reach for it, two Grunts come back for it.`,
    way: ch('Read it and leave it.', out(`You read every line twice and put it back exactly how it was. You know what they'll do and when. They don't know you know.`, flag('intel'), mark('orders-read'))),
    walk: ch('Take it.', out(`You pocket it. By evening they know it's missing, and the whole plan changes. Whatever you read is out of date now, and they are angry.`, story({ heat: 1 }))) },
  { id: 'vt-galactic-toll-booth', name: 'The Toll Booth', team: 'galactic',
    intro: `A booth across the road, freshly painted Galactic silver. ${say('Grunt', 'Road tax for a new universe. ₽400.')} If you walk on, you pay the ₽400.`,
    stop: `"Tax evasion," he says sadly, and stands up.`,
    way: ch(`"What's the universe for?"`, out(`${say('Grunt', `...I'll be honest, the money's for the booth.`)} He looks at the booth. You look at the booth. He waves you through.`)),
    walk: ch('Walk on.', out(`You pay. He gives you a ticket with a planet on it.`, $(-400)), { requires: [money(400)] }) },
  { id: 'vt-gravity-well', name: 'The Gravity Well', team: 'galactic',
    intro: `A device on a pole bends the light around it. Pebbles roll uphill towards the road ahead. If you walk on, gravity is heavy on the next stop, and Flying-types there can't dodge Ground moves.`,
    stop: `Two Grunts are adjusting the dials. They don't like being interrupted.`,
    way: ch('Pull it down.', out(`Your Pokémon takes hold of the pole and pulls, and the device comes down with a crunch. The pebbles roll back the right way.`), pick('psychic', 'steel')),
    walk: ch('Walk on.', out(`You walk on. The road ahead feels heavier with every step.`, flag('gravity-next-node'))),
    remembers: [{ id: 'files', when: [{ kind: 'evil', has: 'files' }], notice: `You know this shape. It's in your files: one piece of the Spear Pillar plan.` }] },
  { id: 'vt-meteorite-fakeout', name: 'The Meteorite Fakeout', team: 'galactic',
    intro: `Treasure hunters swarm round a glowing "meteorite" in a field. It's painted rock. You can see the brush marks. Two Galactic crooks wait behind a hedge for someone to dig it up.`,
    stop: `You walk round the hedge. The crooks weren't expecting that.`,
    way: ch('Tell the hunters.', out(`You tell them. They look at the rock, then the hedge. The crooks run. The hunters chase them. You are left alone in the field with a painted rock.`, ...kind(1))),
    walk: ch('Walk on.', out(`From the road, you watch a hunter dig it up, and the crooks take everything he has. He sits in the field afterwards with his head in his hands. You saw it.`)) },
];

const PLASMA: Scene[] = [
  { id: 'plasma-protest', name: 'The Protest', team: 'plasma',
    intro: `Signs everywhere: FREE YOUR POKÉMON! A girl in a Plasma tunic steps in front of you. "Do they want to be with you? Did you ask?" She means it. If you walk on, nothing changes, and the next Plasma crowd will be bigger.`,
    stop: `Her friends close in around her. "Leave her alone!"`,
    way: ch('Ask them, then.', out(`She kneels and asks your lead, in a soft voice. "Do you want to go?" It looks at her, and then walks round her and sits down on your foot. She stays kneeling for a long time. She doesn't know what to say.`, ...kind(1))),
    walk: ch('Walk on.', out(`She shouts after you. A few more people stop to listen to her.`, mark('extra-grunt'))) },
  { id: 'plasma-liberation', name: 'Liberation', team: 'plasma',
    intro: `A Plasma Grunt waves a banner. "Liberate your Pokémon!" Behind him, on a short lead tied to his belt, a Purrloin sits in the dust. If you walk on, he follows you to the next town, shouting.`,
    stop: `"You're a prisoner of your own Pokémon!" he shouts, and lets go of the banner.`,
    way: ch('"You first."', out(`He looks down at the lead. At the Purrloin on the end of it. Slowly, he unties it. The Purrloin doesn't go anywhere. It stays with him. He keeps looking at it, and you can see he doesn't understand why.`, ...kind(1))),
    walk: ch('Walk on.', out(`He follows you all the way to the next town, shouting. The Purrloin trots behind him on its lead.`, flag('plasma-follower'))) },
  { id: 'vt-banner-burn', name: 'The Banner Burn', team: 'plasma',
    intro: `A huge Plasma banner hangs over the plaza. Pinned to its corner is an ad for one of your rivals. The rival is beside you, whispering. "A match would do wonders." They're watching you to see what you'll say.`,
    stop: `The Grunts on the steps see the two of you looking at their banner.`,
    way: ch('No fires.', out(`Your Pokémon unpins the ad and brings the banner down quietly, folded. Your rival lets out a breath. "Good. I was hoping you'd say that."`, rivalTrust(1)), pick('flying')),
    walk: ch('Burn it.', out(`It goes up all at once. The town cheers, and the plaza smells of smoke for a week. Your rival watches it burn. "I wanted you to say no," they say quietly.`, rep(1), rivalTrust(-1))) },
  { id: 'vt-plasma-blank-duel', name: 'The Blank Soldier', team: 'plasma',
    intro: `A silent Plasma soldier blocks the road. He speaks once. "N asks only one thing. Do your Pokémon fight for you, or with you?"`,
    stop: `He doesn't wait for your answer.`,
    way: ch('"With me."', fight(`He looks at your team, and isn't convinced. "Show me."`, foe('grunt', 'Blank Soldier', 3, { win: [$(800)] }))),
    walk: ch('"For me."', fight(`Something in him goes hard. "Then they need freeing." He fights harder than he did a moment ago.`, foe('grunt', 'Blank Soldier', 3, { lv: 1, win: [$(800)] }))),
    // "If the lead's Bond is 3 or more": any party Pokémon this fond of you (friendship 150 of 255).
    remembers: [{ id: 'bond', when: [{ kind: 'friendship', atLeast: 150 }], hide: [1], addChoices: [ch('"With me."', out(`Your lead steps up beside you before you've finished saying it, and leans on you. The soldier looks at it for a long time. Then he nods, once, and steps off the road.`, SCENE))] }] },
  { id: 'vt-plasma-rally', name: 'The Rally', team: 'plasma',
    intro: `A speaker on the town hall steps. "Pokémon deserve freedom!" The crowd turns round, one face at a time, to look at you and your team. If you walk on, the crowd boos, and Plasma has more recruits in the next town.`,
    stop: `"There's one," the speaker says, pointing, and his helpers come down the steps.`,
    way: ch('"They do. These ones chose."', out(`You open every Ball and sit down on the steps, and your team comes and sits with you, in front of everyone. Nobody says anything. The crowd sees.`, rep(1), ...kind(1))),
    walk: ch('Walk on.', out(`They boo you all the way out of the square.`, mark('extra-grunt'))) },
];

// The Plasma holding camp: a chain pseudo-stage (gate, then the yard, then the handler).
const camp: Json[] = [
  ev('plasma-substage-gate', 'The Holding Camp', 'Evil Teams', { requires: gate('plasma'), cast: [teamJson('plasma').ranks.grunt.sprite], tint: teamJson('plasma').color, effect: 'fog' },
    `Crates with air holes in a field behind a fence. A tarp that moves when nobody touches it. Plasma Grunts patrol the wire, talking about "the shipment" at dawn. If you walk on, the camp ships out at dawn, and everything in those crates goes with it.`,
    [
      ch('Stop them.', fight(`You climb the fence in plain sight. The patrol comes running.`, foe('grunt', 'Plasma Grunt', 3, { chain: 2, win: [mark('op-stopped')] }), SCENE, room('plasma-substage-yard'))),
      ch('Wait for the changeover. (a node)', out(`You wait in the long grass until the patrols change. For one minute nobody is watching the gate, and you're through it.`, ...node(), SCENE, room('plasma-substage-yard'))),
      ch('Walk on.', out(`At dawn you hear the trucks go. The field is empty when you look back.`, SCENE, mark('pen-extra'))),
    ]),
  ev('plasma-substage-yard', 'The Yard', 'Evil Teams', { room: true, cast: [], tint: teamJson('plasma').color, effect: 'fog' },
    `Dozens of crates in rows, with numbers stencilled on. Something breathes in every one of them. The guards haven't seen you yet.`,
    [
      ch('Open them quietly, one by one.', out(`Your Pokémon keeps them calm, one mind touching each one in turn, while you open the crates. Every Pokémon goes free without a sound. The guards never turn round.`, ...kind(2), mark('op-stopped'), room('plasma-substage-leader')), pick('psychic')),
      ch('Open them all at once.', fight(`You pull every latch in the row. Chaos. Pokémon everywhere, guards everywhere, shouting, and three of them come at you at once. In the middle of it, the door of the office opens, and the handler comes out.`,
        { kind: 'trainer', evil: 'grunt', name: 'Plasma Yard Guards', size: 3, levelBonus: -1, format: 'triples', chain: 1, pseudo: true, win: [] }, ...kind(1), room('plasma-substage-leader'))),
    ]),
  ev('plasma-substage-leader', 'The Handler', 'Evil Teams', { room: true, cast: [teamJson('plasma').ranks.specialist.sprite], tint: teamJson('plasma').color, effect: 'fog' },
    `The handler steps out of the office with a Pokémon at heel that is very clearly not theirs. It flinches when they move. "Those are company property."`,
    [
      ch('Ask the Pokémon.', out(`You kneel and hold out your hand. The Pokémon looks at the handler, and then walks across the yard to your side. The handler reaches for another Ball and finds there isn't one. They haven't got a team at all. They run.`, ...kind(1))),
      ch('Battle.', fight(`"Company property," the handler says again, and points.`, foe('specialist', 'Plasma Handler', 3, { pseudo: true, win: [$(1200), ...kind(1)] }))),
    ]),
];

// Plasma Operations 1 to 3, on the weekly Plasma Operation (keeps its counters: eventClues, eventBossesWon, eventFinalesWon).
const clue = (n: number): Json => ({ kind: 'count', counter: 'eventClues', amount: n });
const plasmaOps: Json[] = [
  ev('plasma-op-1', 'Operation: The Supply Route', 'Plasma Operation', { gameEvent: 'plasma-operation', callback: true, requires: [flagIs('plasma-op', 0, 0)], cast: ['boss.ghetsis'], tint: '#1a2230', effect: 'fog' },
    `Crates on a long road, and trucks waiting to take them. A foreman with a clipboard ticks them off one by one. The trucks are Plasma's, and so are the Pokémon in the back. You can hear them. If you walk on, the trucks reach the yard, and the next Operation will be harder.`,
    [
      ch('Stop them.', fight(`The guards see you before the foreman does.`, trainer('Plasma Convoy Guard', { size: 3, lv: 2, win: [clue(1), flag('plasma-op-1-stopped'), ...kind(2)] }), clue(1), flag('plasma-op'))),
      ch('Change the clipboard. (a node)', out(`It takes an hour of standing around looking like you belong. Then the foreman puts the clipboard down for his tea, and you change every address on it. The trucks drive off to a Pokémon Center.`, ...node(), clue(1), flag('plasma-op'), flag('plasma-op-1-stopped'), ...kind(2))),
      ch('Walk on.', out(`The trucks pull out, heavy and slow, towards the yard.`, clue(1), flag('plasma-op'))),
    ]),
  ev('plasma-op-2', 'Operation: The Holding Yard', 'Plasma Operation', { gameEvent: 'plasma-operation', callback: true, requires: [flagIs('plasma-op', 1, 1)], cast: ['boss.ghetsis'], tint: '#1c2430', effect: 'fog' },
    `Word has spread about the supply route. Plasma has fallen back to a holding yard: more guards, more crates, more fence. If you walk on, the yard ships out, and their Holding Pen will be full.`,
    [
      ch('Stop them.', fight(`The yard erupts.`, trainer('Plasma Yard Crew', { size: 3, lv: 3, win: [clue(2), flag('plasma-yard-stopped'), ...kind(2)] }), flag('plasma-op'))),
      ch('Open the back fence.', out(`At night, your Pokémon cuts the wire behind the last row of crates, quietly, strand by strand. By morning the yard is empty and the guards are counting crates that aren't there.`, clue(2), flag('plasma-op'), flag('plasma-yard-stopped'), ...kind(2)), pick('dark')),
      ch('Walk on.', out(`The yard ships out that week. The trucks go to the Holding Pen, and it is full.`, flag('plasma-op'), flag('plasma-pen-full'))),
    ],
  ),
  ev('plasma-op-3', 'Operation: The Commander', 'Plasma Operation', { gameEvent: 'plasma-operation', callback: true, requires: [flagIs('plasma-op', 2)], cast: ['boss.ghetsis'], tint: '#101820', effect: 'fog' },
    `Commander Varga waits at the end of the road, with two Grunts at her back. "You're the one. I've trained a team just for you."`,
    [
      ch('"Then show me."', fight(`The Grunts come first. Varga watches how you fight them, and takes notes.`, trainer('Commander Varga', { cls: 'veteran', size: 5, lv: 5, chain: 3, win: [clue(3), { kind: 'count', counter: 'eventFinalesWon', amount: 1 }, { kind: 'count', counter: 'eventBossesWon', amount: 1 }, $(2500), flag('plasma-op-done'), ...kind(2)] }))),
    ]),
];
(plasmaOps[1] as Json).remembers = [{ id: 'half', when: [flagIs('plasma-op-1-stopped')], notice: `Half the crates are empty. The trucks that should have filled them went to a Pokémon Center.` }];
(plasmaOps[2] as Json).remembers = [{ id: 'alone', when: [flagIs('plasma-op-1-stopped'), flagIs('plasma-yard-stopped')], notice: `The Grunts aren't with her. Nobody is. After the road and the yard, there's nobody left who would stand behind her.`, hide: [0], addChoices: [ch('"Then show me."', fight(`She's alone, and she knows it, and she fights anyway.`, trainer('Commander Varga', { cls: 'veteran', size: 5, lv: 5, win: [clue(3), { kind: 'count', counter: 'eventFinalesWon', amount: 1 }, { kind: 'count', counter: 'eventBossesWon', amount: 1 }, $(2500), flag('plasma-op-done'), ...kind(2)] })))] }];

const FLARE: Scene[] = [
  { id: 'flare-boutique', name: 'The Boutique', team: 'flare',
    intro: `A boutique all in red glass. The doorman looks you up and down. "Only the beautiful may shop." If you walk on, you're turned away, and that's all.`,
    stop: `"Security," he says, without raising his voice.`,
    way: ch('"Then I\'ll shop for my Pokémon."', out(`He looks at your team. He looks at you. He can't think of a rule against it, and lets you in. The prices are high, and every one of them is on show. Through a door behind the counter you see desks, and a map, and the Flare logo on a filing cabinet. You remember all of it.`, mark('files'), stopHere('shop'))),
    walk: ch('Walk on.', out(`The door closes in your face, very softly.`)) },
  { id: 'flare-fashion', name: 'The Pose', team: 'flare',
    intro: `Two Grunts in red suits jump out in front of you and strike a pose. They hold it. "Rate us."`,
    stop: `You don't rate them. They're offended, then furious.`,
    way: ch('"Ten. Now move."', out(`They move, delighted, and you can hear them still talking about it a mile down the road.`)),
    walk: ch('"Three."', fight(`Silence. Then: "THREE?"`, foe('grunt', 'Flare Grunt', 3, { lv: 1, chain: 2, win: [$(700)] }))) },
  { id: 'vt-flare-fashion-heist', name: 'The Fashion Heist', team: 'flare',
    intro: `Two Flare members dash past and snatch the scarf right off your lead. A third waits at the corner, twirling another scarf, just like it, waving it at you.`,
    stop: `You catch the one at the corner. He drops the act and calls the others back.`,
    way: ch('Ignore the decoy.', out(`You ignore the twirling scarf and send your fastest after the two runners. It catches them at the bridge, and comes trotting back with your lead's scarf in its mouth.`), pick('electric', 'flying')),
    walk: ch('Chase the scarf.', out(`The decoy leads you round three streets in a circle. When you get back, the other two are long gone, and so is your lead's scarf. It's at their Hideout now.`, mark('accessory-taken'))) },
  { id: 'vt-flare-salon-spy', name: 'The Salon Spy', team: 'flare',
    intro: `The stylist hums while she works. "So. Where are you heading next? Who's on your team?" Her lipstick is shaped like the Flare logo, and she hasn't noticed you noticed.`,
    stop: `You stand up with the cape still on. She sighs and rings a bell, and two Grunts come in from the back.`,
    way: ch('Lie.', out(`You tell her a route you aren't taking and a team you don't have. She writes it all down. Flare will be waiting somewhere you'll never be, and the next ambush never comes.`, mark('ambush-skip'))),
    walk: ch('Tell the truth.', out(`You tell her. She smiles in the mirror. The next Flare ambush will be ready for you.`, story({ heat: 2 }))) },
];

const SKULL: Scene[] = [
  { id: 'skull-graffiti', name: 'The Graffiti', team: 'skull',
    intro: `Skull Grunts are spray-painting the front of a Pokémon Center. "Yo, whatchu lookin' at?" The nurse is standing in the doorway, too tired to argue. If you walk on, the Center is tagged, and the nurse is too worn out to give you the free heal.`,
    stop: `"You wanna go? We can go."`,
    way: ch('"It\'s not bad. Do it on the wall that\'s yours."', out(`They stop. Nobody has ever said it was not bad. They look at the wall, then at each other, then pack up and go and paint their own hideout wall instead. Guzma will hear about this.`, mark('guzma-heard'))),
    walk: ch('Walk on.', out(`By evening the Center is covered in skulls, and the nurse is sitting on the step with her head against the door.`, flag('center-tagged'))) },
  { id: 'skull-squad', name: 'The Squad', team: 'skull',
    intro: `Grunts spraying graffiti on everything in reach. "Yo, what you lookin' at?"`,
    stop: `"Oh, it's like THAT, yo?"`,
    way: ch('"Teach me." (a node)', out(`They're so surprised they actually do. It takes an hour. You tag a rock with your team's name, badly, and they cheer. When you get to their Hideout, somebody will leave the first door open for you.`, ...node(), mark('quiet'))),
    walk: fightWalk(`"Nah, you ain't walkin' past us, yo."`, 'skull') },
  { id: 'vt-skull-dance-break', name: 'The Dance Break', team: 'skull',
    intro: `A boombox in the middle of the road, and a circle of Skull Grunts round it. "Dance-off, yo! Win and we bounce!"`,
    stop: `You turn the boombox off. Big mistake.`,
    way: ch('Dance.', out(`Your Pokémon steps into the circle and goes for it. The Grunts start out laughing and end up clapping. Fair's fair: they bounce.`), pick('fighting', 'fairy')),
    walk: fightWalk(`"You walkin' past the circle? Disrespectful, yo."`, 'skull') },
];

const YELL: Scene[] = [
  { id: 'yell-blockade', name: 'The Blockade', team: 'yell',
    intro: `Team Yell has blocked the road to Marnie's gym. They chant and stamp and won't let anyone through.`,
    stop: `"No one gets past Team Yell!"`,
    way: ch('"Marnie would hate this."', out(`They go quiet. All of them. After a while, one says, "She would." They step aside and let you through, and nobody chants. Later, a League Card turns up in your bag with a short note in Marnie's hand: "Thanks."`, mark('marnie-heard'), flag('marnies-league-card'))),
    walk: ch('Walk on.', fight(`You try to walk past. Three of them come at you, one after another.`, foe('grunt', 'Yell Grunt', 2, { chain: 3, win: [$(600)] }))) },
  { id: 'yell-fans', name: 'The Fans', team: 'yell',
    intro: `Signs, noise, scarves. The whole road is full of Team Yell, and they're not moving. If you walk on, you'll wait a whole stop for them to leave.`,
    stop: `"Oi! Back of the queue!"`,
    way: ch('Chant with them.', out(`You join in. Marnie! Marnie! They love it. By the end of the chant they're making room for you, and one of them pats you on the back.`)),
    walk: ch('Walk on.', out(`You sit down by the road and wait. It takes a long time.`, ...node())) },
  { id: 'vt-yell-cheer-chorus', name: 'The Cheer Chorus', team: 'yell',
    intro: `"We won't move unless you sing along!"`,
    stop: `"Not singing? Then you're battling!"`,
    way: ch('Sing.', out(`You sing. Badly. They cheer like you're Marnie herself, and one of them hands you a Team Yell towel. Later, Marnie will say she heard about it.`, flag('yell-towel'), mark('marnie-heard'))),
    walk: fightWalk(`"No song, no road!"`, 'yell') },
];

const STAR: Scene[] = [
  { id: 'star-heist', name: 'The Heist', team: 'star',
    intro: `Team Star is "borrowing" boxes of Poké Balls out of a school storeroom. Their boss, in a helmet, waves a box at you. "They had loads!" If you walk on, the school's Balls are gone, and the shops in this region run out of Poké Balls.`,
    stop: `"Star Barrage!" they shout, and drop the boxes.`,
    way: ch('Ask the teacher.', out(`You find the teacher. The teacher finds the Star kids. And instead of shouting, the teacher offers them an after-school club. Half of them want in before she's finished asking.`, mark('star-club'), ...kind(1))),
    walk: ch('Walk on.', out(`They load the boxes into a cart. By the end of the week there isn't a Poké Ball for sale anywhere in the region.`, flag('region-no-balls'))) },
  { id: 'star-raid', name: 'The Raid', team: 'star', pokemon: 'revavroom',
    intro: `A Starmobile revs outside a Team Star base, its engine growling. The boss sits on top of it.`,
    stop: `"Wanna roll?"`,
    way: ch('Ask why they started.', out(`The boss looks at you for a long time. Then they take off the helmet and tell you. They were bullied, all of them. Team Star was the only place it stopped. The engine goes quiet. So does the base.`, story({ heat: -1 }))),
    walk: ch('Walk on.', fight(`The Starmobile roars and comes after you. It's a Pokémon under all that chrome, and it wants a fight.`, trainer('Starmobile', { team: ['revavroom'], size: 1, lv: 3, win: [$(1000)] }))) },
  { id: 'vt-team-neo', name: 'Team Neo',
    intro: `Three villains in very new uniforms trip over their own banner. They get up. "We are... Team Neo! Prepare for... something!"`,
    stop: `"Prepare for battle!" one remembers. The other two cheer.`,
    way: ch('Help them up.', out(`You help them up and dust them off. They're so touched they have to sit down. After a long talk they decide to be a hiking club instead. Later, on a mountain path, you see three people in very new boots, waving.`, flag('team-neo-hikers'), ...kind(1))),
    walk: ch('Walk on.', fight(`"You can't just ignore us!" They attack.`, trainer('Team Neo', { size: 2, lv: -3, win: [flag('team-neo-hikers')] }), flag('team-neo-cried'))) },
  { id: 'macro-cosmos-lab', name: 'Macro Cosmos Lab', team: 'yell',
    intro: `A Macro Cosmos lab in a clearing, humming. Cables run from it into the grass, where wild Pokémon lie limp, and the energy runs up the cables into rows of glowing batteries. If you walk on, the batteries power a Dynamax spot, and the wild Pokémon here stay tired for the rest of the region.`,
    stop: `Lab security comes out of the door.`,
    way: ch('Pull the plug.', out(`Your Pokémon takes hold of the main cable and turns the current back. The batteries flicker and go dark, and out in the grass, one by one, the wild Pokémon stand up.`, ...kind(2)), pick('electric')),
    walk: ch('Walk on.', out(`The batteries fill. Somewhere ahead, the ground is glowing red. The wild Pokémon don't get up.`, flag('dynamax-spot'), flag('region-tired-wild'))) },
  { id: 'ev-evil-team-raid', name: 'The Raid',
    intro: `Alarm bells. {team} is stripping a roadside stall, and loading the owner's Pokémon into crates. A lookout on the roof whistles. If you walk on, the stall is robbed, and you'll see the owner later, shut down for good.`,
    stop: `The lookout whistles again, louder, and they drop the crates.`,
    way: ch('Get the stall owner out first.', fight(`You get the owner out of the back and round the corner. Then you go back for the lookout.`, foe('grunt', 'Lookout', 2, { win: [$(800)] }), ...kind(1))),
    walk: ch('Walk on.', out(`The stall is empty by the time you're out of sight. Later, in another town, you see the owner behind a counter that isn't theirs. They don't look at you.`, rep(-1))) },
];

export const EVENTS: Json[] = [...ROCKET, ...AQUA, ...MAGMA, ...GALACTIC, ...PLASMA, ...FLARE, ...SKULL, ...YELL, ...STAR].map(scene).concat(camp, plasmaOps);
export const REMOVE: string[] = [];
