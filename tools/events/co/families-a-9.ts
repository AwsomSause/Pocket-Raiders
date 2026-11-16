// Catalog Overhaul Pack: STORY_FAMILIES_7.md, part one. SF42 The Hazard System, SF43 The Kindness Ledger,
// SF44 Strangers Worth Stopping For, SF45 The Camp. Build: npm run co:build -- families-a-9. Run memory is same-run only (Kice 2026-11-14).
import { $, any, anyType, at, bond, bondUp, br, celebrate, ch, convoyHeal, cure, fight, flag, flagAt, flagThisRegion, fr, gym, heal, hurt, hurtExcept, item, lose, lv, out, milestone, relic, rest, room, rp, scout, statusLead, takeNode, wild, TREASURE, VITAMINS, type Json } from '../dsl.ts';
import { crisis, crisisAt, feel, is, kind, later, moment, not, sub, temp, trust, v, withRooms } from './_fa.ts';

export const CATEGORY = 'families-a';

const money = (atLeast: number): Json => ({ kind: 'money', atLeast });
const hasItem = (id: string, count = 1): Json => ({ kind: 'item', id, count });
const useItem = (id: string, count = 1): Json => ({ kind: 'loseItem', id, count });
const mentor = (o: Json = {}): Json => ({ kind: 'mentor', ...o });
const mentorFx = (trust: number, loyalty: number, start = false): Json => ({ kind: 'mentor', trust, loyalty, rivalry: 0, disagree: false, ...(start ? { mission: 'start' } : {}) });
const monRival = (state: 'open' | 'carried' | 'sacrificed'): Json => ({ kind: 'monRival', state });
const until = (label: string, effects: Json[], u: 'boss' | 'battle', battles = 1): Json => ({ kind: 'tempEffect', label, effects, battles, until: u });

// =====================================================================================================================
// SF42. THE HAZARD SYSTEM. Every hazard: Push on (a cost), Wait (a node), or Use a Pokémon (an answering type, +1 Bond).
// `hazard-answered` counts "Use a Pokémon"; the tenth gives the Pathfinder ribbon. Crisis-linked hazards raise Severity.
// =====================================================================================================================
interface Use { label: string; types: string[]; text: string; fx?: Json[] }
interface Hazard {
  id: string; intro: string;
  push: string; pushText: string; pushFx: Json[]; pushChance?: { chance: number; fail: string; failFx: Json[] };
  wait: string; waitText: string; waitFx?: Json[];
  uses: Use[];
  /** The npc's line when your lead has answered three hazards (it recognises the lead). */
  knows: string;
  extra?: Json[];
  /** Crisis link: the strand whose Severity rises when you push on. */
  strand?: { s: string; label: string; text: string };
}
const PATHFINDER = relic('pathfinder', 'The Pathfinder Ribbon', [{ kind: 'statMultiplier', stat: 'spe', value: 1.05 }]);
const answered = (key: string, types: string[]): Json[] => [bondUp(1, { types }), flagAt('hazard-answered'), flag(`hazard-${key}-used`)];
function hazard(h: Hazard): Json {
  const key = h.id.replace(/^wx-/, '');
  const use = (u: Use): Json => {
    const fx = [...answered(key, u.types), ...(u.fx ?? [])];
    return ch(`${u.label} (${u.types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' or ')})`, out(u.text, ...fx), {
      requires: [anyType(...u.types)],
      branches: [br([is('hazard-answered', 9), not('pathfinder')], `${u.text} On the far side, someone you have never met stops you with a hand on your arm. "That's ten. Ten times I've heard of a trainer letting their Pokémon lead people through the worst of it." They pin a faded ribbon to your lead: the Pathfinder ribbon. Your lead stands a little straighter, and from now on it is quicker on its feet.`, ...fx, PATHFINDER, flag('pathfinder'), moment('Your lead earned the Pathfinder ribbon: ten hazards answered, and everyone walked through', 70))],
    });
  };
  const push = (label: string, extraFx: Json[]): Json => ch(label, out(h.pushText, flag(`hazard-${key}-push`), ...h.pushFx, ...extraFx),
    h.pushChance ? { chance: h.pushChance.chance, fail: out(h.pushChance.fail, flag(`hazard-${key}-push`), ...h.pushChance.failFx, ...extraFx) } : {});
  const remembers: Json[] = [];
  if (h.strand) {
    const on = [is(`crisis-${h.strand.s}-on`), not(`crisis-${h.strand.s}-ended`)];
    remembers.push(v('too-dangerous', [...on, crisisAt(3)], { notice: `${h.strand.text} Too dangerous now. Nobody pushes through this any more, and you won't either.`, hide: [0] }));
    remembers.push(v('crisis-link', on, { notice: h.strand.text, hide: [0], add: [push(`${h.push} (the ${h.strand.label} gets worse)`, [crisis(1)])] }));
  }
  remembers.push(v('knows-lead', [is('hazard-answered', 3), flagThisRegion('hazard-answered')], { notice: h.knows }));
  return {
    id: h.id, intro: h.intro,
    choices: [push(h.push, []), ch(h.wait, out(h.waitText, flag(`hazard-${key}-wait`), takeNode(1), ...(h.waitFx ?? []))), ...h.uses.map(use), ...(h.extra ?? [])],
    remembers,
  };
}

const HAZARDS: Json[] = [
  hazard({
    id: 'wx-ancient-lava-tube',
    intro: 'A cooled lava tube winds into the hillside like the throat of something asleep. Somewhere inside, rock ticks as it cools, a slow uneven clock. A geologist sits at the mouth with a clipboard on her knees and soot on her cheek. Geologist: "It\'s a shortcut. Mostly cooled." She taps the clipboard. "Mostly is doing a lot of work in that sentence, I\'ll admit."',
    push: 'Walk the tube. (Fire damage to everyone but Fire-types)', pushText: 'You walk it. In places the floor is warm through your boots, and once it is hot, and your team skips across a seam of dull orange that should not still be glowing. Everyone comes out the far side singed and blinking at the daylight.', pushFx: [hurtExcept(0.1, 'fire')],
    wait: 'Go over the hill. (a node)', waitText: 'You take the long way over the top. It costs you the afternoon, and a lot of climbing, and the view at the top is so good that nobody minds as much as they expected.',
    uses: [{ label: 'Lead with it; it feels the hot spots.', types: ['fire', 'rock'], text: 'Your Pokémon goes first, one careful step at a time, pausing, turning, sniffing the stone. Wherever it steps, the floor is cool. The team walks in its footprints and comes out the far side without a mark. The geologist, behind you, is writing very fast.' }],
    knows: 'The geologist looks up from her clipboard, and then past you, at your lead. "Oh. That\'s the one. Someone came through here last week talking about a trainer whose Pokémon walked everybody through a hailstorm."',
  }),
  hazard({
    id: 'wx-black-ice-road',
    intro: 'The road is slick with black ice, invisible until you are on it. Halfway up the hill a bus has given up, wheels turned to the verge, engine ticking. The driver sits on the step with a flask and the expression of a man who has made his peace. Driver: "Nobody\'s going anywhere." Behind him, faces at the misted windows.',
    push: 'Walk it. (damage, and something might fall out of the bag)', pushText: 'You walk it, arms out, the whole team skidding. Everyone falls at least once. At the top you count bruises, and then the bag, and come up one thing short. It is somewhere on that hill now, under the ice.', pushFx: [hurt(0.1), lose()],
    pushChance: { chance: 0.5, fail: 'You walk it, arms out, the whole team skidding. Everyone falls at least once, and you count bruises at the top, but the bag held. Small mercies.', failFx: [hurt(0.1)] },
    wait: 'Wait for the grit lorry. (a node)', waitText: 'You sit on the bus with everyone else. Someone has biscuits. Someone has a guitar with five strings. When the grit lorry finally comes groaning up the hill, the whole bus cheers it like a champion.',
    uses: [
      { label: 'Melt a path.', types: ['fire'], text: 'Your Fire-type breathes on the road, slowly, walking backwards, and a dark wet path opens up behind it all the way to the top. The bus follows at a crawl, every face pressed to the glass. At the top, the driver toots the horn three times.' },
      { label: 'Skate us across.', types: ['ice'], text: 'Your Ice-type looks at the road the way a child looks at a frozen pond, and then it is off, gliding, turning circles, towing your team across one at a time. The bus passengers clap. The driver shakes his head, laughing, and pours himself another cup.' },
    ],
    knows: 'The driver squints at your lead. "Here, I know that one. Heard about it on the radio. Walked a whole crowd through a dust devil, they said."',
  }),
  hazard({
    id: 'wx-dust-devil',
    intro: 'A whirling dust devil sweeps across the camp, a brown column taller than the trees, and the camp comes apart in front of it. Tents fly. A pan goes past at head height. Somebody\'s washing is going up, and up, and gone.',
    push: 'Hold the tents down. (damage to everyone)', pushText: 'You throw yourselves on the guy-ropes and hold. Grit fills your mouth, your eyes, your team\'s fur. When it passes, half the tents are still standing, and the people who own them come out to shake your hand, gritty-handed.', pushFx: [hurt(0.1)],
    wait: 'Shelter till it passes. (a node)', waitText: 'You crouch behind the cook-wagon with everyone else, arms over heads, until the roaring stops. Then you spend an hour helping pick the camp up off the plain.',
    uses: [{ label: 'Break it up.', types: ['ground', 'flying'], text: 'Your Pokémon goes straight into the base of it and does the one thing a dust devil cannot stand: it disagrees. The column wobbles, leans, and comes apart in a sigh of falling sand. In the sudden quiet, a tent peg drops out of the sky and lands at your feet.' }],
    knows: 'A woman shaking out a tent stops and points. "That one. My cousin said a Pokémon like that walked her party through a lava tube."',
  }),
  hazard({
    id: 'wx-fog-bank',
    intro: 'Thick fog, the kind that eats sound. Three paths run off into grey and vanish after a step. Somewhere in it a voice calls, not unkindly: "Left. Always left." You cannot tell where it comes from.',
    push: 'Pick a path. (one in three is a dead end)', pushText: 'You pick one and walk it, and the fog lets you through. You never find out whether the others would have.', pushFx: [],
    pushChance: { chance: 0.67, fail: 'You pick one and walk it for an hour before it ends at a wall of rock. Back you go. By the time you have found the right path, the day is mostly gone.', failFx: [takeNode(1)] },
    wait: 'Wait for it to lift. (a node)', waitText: 'You sit down on your pack and wait, and the team huddles round you for the warmth. In the grey the world is very small: just you and them. It is not the worst afternoon you have had.',
    uses: [{ label: 'See through it.', types: ['flying', 'psychic'], text: 'Your Pokémon goes ahead, and the fog parts around it, or it sees through the grey with something other than its eyes. Either way, it walks you down the right path without a single wrong turn.' }],
    knows: 'The voice in the fog stops. Then: "Is that the one that walked everybody through the black ice? Go on, then. You don\'t need me."',
    extra: [],
  }),
  hazard({
    id: 'wx-hailstorm',
    intro: 'Hail hammers the trail, stones of ice the size of marbles, bouncing off packs and rocks and the backs of your team with a sound like applause that will not stop.',
    push: 'Run for it. (heavy damage to everyone but Ice-types)', pushText: 'You run. You all run, heads down, and it is like running through a crowd that is throwing things. By the time you reach the trees everyone is bruised and laughing in that half-mad way that comes after.', pushFx: [hurtExcept(0.15, 'ice')],
    wait: 'Under the rocks. (a node)', waitText: 'You squeeze under an overhang with your whole team packed in around you, and watch the hail turn the trail white. Somebody falls asleep on your foot.',
    uses: [{ label: 'Shield us.', types: ['ice', 'steel'], text: 'Your Pokémon walks out into it and lets the hail ring off its back, and the rest of the team walks in its shadow, single file, untouched. It does not flinch once. You have never been so proud of something for standing still.' }],
    knows: 'A ranger in a dripping hood recognises your lead before she recognises you. "You\'re the one with the Pokémon that sees through fog. They talk about you at the lodge."',
  }),
  hazard({
    id: 'wx-heat-wave-trek',
    intro: 'The air shimmers. A long, shadeless climb goes up into white light, and at the bottom a trail sign has been sun-bleached until it barely reads: WATER: 4 MILES. Your team looks at the sign, and then at you, and nobody says anything.',
    push: 'Climb now. (damage, and the heat might burn)', pushText: 'You climb now. By the top, everyone is red and slow, and your lead has a burn on its back from where the sun found it, raw and angry.', pushFx: [hurt(0.1), statusLead('burn')],
    pushChance: { chance: 0.5, fail: 'You climb now. By the top, everyone is red and slow, and you share out every drop of water you have, but nobody is hurt worse than tired.', failFx: [hurt(0.1)] },
    wait: 'Climb at dusk. (a node)', waitText: 'You wait it out in the only shade for a mile, a single crooked tree, all of you pressed into its shadow and moving with it as the sun moves. At dusk you climb in the cool, and the stars come out before you reach the top.',
    uses: [{ label: 'Mist the party, or shade it.', types: ['water', 'grass'], text: 'Your Pokémon spends the whole climb taking care of the others, a fine mist over their heads or a wide leaf held up like a parasol. Halfway up, your team starts walking in a tight little knot around it, nobody wanting to leave its shade.' }],
    knows: 'A hiker coming down stops dead and stares at your lead. "No way. Is that the one from the hailstorm? It is, isn\'t it?"',
  }),
  hazard({
    id: 'wx-mudslide-pass',
    intro: 'The slope has slid across the pass in the night, and where the road was is a wall of mud, brown and steaming, waist-high and still moving very slowly downhill.',
    push: 'Wade through. (damage, and you\'re slower next battle)', pushText: 'You wade. It is like walking through cold porridge that wants your boots. On the far side you scrape off what you can, but everyone is caked and heavy and it will be a while before anybody is quick again.', pushFx: [hurt(0.1), temp('Caked in mud: slower', [{ kind: 'statMultiplier', stat: 'spe', value: 0.67 }], 1)],
    wait: 'Go round. (a node)', waitText: 'You go round, the long way, down into the valley and back up. It takes all day. At the far end you can look back and see the mud, still creeping.',
    uses: [
      { label: 'Dig us a path.', types: ['ground'], text: 'Your Ground-type puts its head down and goes, and a tunnel opens through the slide as neat as a pipe. You all walk through it in the dark, holding the tail of the one in front.' },
      { label: 'Clear it.', types: ['fighting'], text: 'Your Fighting-type looks at the wall of mud the way it looks at an opponent, sets its feet, and starts shovelling with its hands. It does not stop until there is a road again. Afterwards it sits on a rock, filthy and enormously pleased with itself.' },
    ],
    knows: 'A road crew is already at the far side, leaning on their shovels. The foreman points at your lead. "That one walked a whole bus over black ice. Saw it in the paper."',
  }),
  hazard({
    id: 'wx-overgrown-trail',
    intro: 'Vines have swallowed the old trail whole. Somewhere under the green there is a path, there are even old signposts, leaning, with leaves growing out of the arrows. Something rustles in the thick of it.',
    push: 'Hack through. (a little damage, and something in there will fight)', pushText: 'You hack through. It is slow and scratchy work, and halfway along you cut a vine that turns out to be somebody\'s tail.', pushFx: [hurt(0.05)],
    wait: 'Find the road. (a node)', waitText: 'You go back and find the long road round. Behind you, the vines close over the hole you made, as if you were never there.',
    uses: [
      { label: 'Cut the vines.', types: ['fire', 'bug'], text: 'Your Pokémon goes in front and the green parts before it, burned back or snipped through, neatly, like a gardener with an appointment. Nothing wild bothers you. Nothing wild wants to.' },
      { label: 'Ask them to part.', types: ['grass'], text: 'Your Grass-type walks up to the wall of vines and stands there, very still, for a long moment. Then, slowly, with a sound like a breath going out, the vines draw back from the path. You walk through a green tunnel. When you look back, they have closed again behind you, gently.' },
    ],
    knows: 'An old forester at the trailhead nods at your lead. "Heard about that one. Shaded a whole climb in a heatwave, they say."',
  }),
  hazard({
    id: 'wx-pollen-season',
    intro: 'Clouds of yellow pollen hang over the meadow. Everything is sneezing: Pokémon, people, a Bidoof in a ditch. A hiker staggers past with streaming eyes and a handkerchief over his face. Hiker: "Don\'t breathe." He sneezes. "I mean it. Don\'t."',
    push: 'Hold your breath. (your lead may be poisoned)', pushText: 'You hold your breath and go. Your lead does not manage it; it sneezes, and sneezes again, and by the far side it is wheezing and sick and leaning on you.', pushFx: [statusLead('poison')],
    pushChance: { chance: 0.5, fail: 'You hold your breath and go, and everybody makes it with streaming eyes and nothing worse.', failFx: [] },
    wait: 'Wait for rain. (a node)', waitText: 'You wait. In the afternoon the rain comes, and the pollen goes down with it, and the meadow is suddenly green and clean and smells of wet grass.',
    uses: [{ label: 'It doesn\'t bother them; they lead.', types: ['grass', 'poison'], text: 'Your Pokémon walks into the yellow like it is walking into a warm bath, and the team follows close behind it, breathing where it breathes. Nobody sneezes once. The hiker watches you go, open-mouthed, and sneezes.' }],
    knows: 'The hiker lowers his handkerchief and looks at your lead. "Hang on. Isn\'t that the one that walked a whole field of folk through the mudslide?"',
  }),
  hazard({
    id: 'wx-rainy-day-market',
    intro: 'Rain drives everyone indoors, into an old market hall roofed in glass that rattles. It is warm and crowded and smells of oranges and wet coats. A stallholder waves you in. Stallholder: "Rainy day! Everything\'s ten percent off!"',
    push: 'Go back out. (a little damage; you skip the market)', pushText: 'You go back out into it. The rain finds every gap in your coat. Behind you the market lights glow, and you do not look back more than twice.', pushFx: [hurt(0.05)],
    wait: 'Shop and wait. (a node; ten percent off)', waitText: 'You stay. You wander the stalls, eat something hot from a paper cone, and buy a few things you need for less than they cost yesterday. When the rain stops, the whole hall lets out its breath and empties.', waitFx: [{ kind: 'addStop', stop: 'shop' }, temp('Rainy day: ten percent off', [{ kind: 'priceMultiplier', group: 'all', value: 0.9 }], 1)],
    uses: [{ label: 'Walk out in it; they love the rain.', types: ['water'], text: 'Your Water-type is out the door before you can stop it, turning its face up into the rain, splashing in every puddle. The stallholders crowd the doorway to watch, laughing. One of them runs after you with a paper bag. Stallholder: "For the show! On the house!"', fx: [any('oran-berry', 'sitrus-berry', 'lum-berry')] }],
    knows: 'The stallholder leans over her oranges and lowers her voice. "That\'s the one, isn\'t it? From the pollen field? My sister was there."',
  }),
  hazard({
    id: 'wx-rising-tide',
    intro: 'The sea is racing in over the flats faster than a person can walk, silver sheets of it sliding over the sand, filling the channels, meeting behind you. The high ground is far off, a green line with a lighthouse on it.',
    push: 'Run. (heavy damage, and the water takes something)', pushText: 'You run, and it is up to your knees, your waist, and something tears loose from your bag and is gone. You reach the high ground soaked and gasping, with everybody, and that is what matters.', pushFx: [hurt(0.15), lose()],
    wait: 'Climb the old post and wait it out. (a node)', waitText: 'You all climb the old marker post and cling to it while the sea goes by below you, the whole team piled on top of each other. It takes hours. When the tide goes out again it leaves a starfish on your boot.',
    uses: [
      { label: 'Ride it.', types: ['water'], text: 'Your Water-type swims out under you and everyone climbs on, and it carries you all to the lighthouse on the swell of the tide, as easy as a ferry. The lighthouse keeper is waiting on the steps with towels.' },
      { label: 'Fly us.', types: ['flying'], text: 'Your Flying-type carries them over one at a time, back and forth, back and forth, the tide rising under its wings each trip. It does not stop until the last of you is on the grass. Then it lies down flat and will not move for a while.' },
    ],
    knows: 'The lighthouse keeper, towels over his arm, looks at your lead. "That one walked half a market out into the rain, I heard. You lot are getting a name."',
  }),
  hazard({
    id: 'wx-salt-flats-mirage',
    intro: 'Shimmering water on the horizon, and a town beside it with towers and trees. Both look close. Both look too good to be true. The salt crunches underfoot, white to every edge of the world.',
    push: 'Head for the town. (a node lost to nothing, and thirst)', pushText: 'You head for the town. It stays exactly the same distance away all afternoon, and then, as the sun drops, it simply is not there. You turn back, thirsty and quiet.', pushFx: [takeNode(1), hurt(0.1)],
    wait: 'Stop and get your bearings. (a node)', waitText: 'You stop, sit, and wait for the light to change, and when it does, the false town wavers and fades, and the real road shows itself, faint, off to the left.',
    uses: [{ label: 'It knows which way\'s real.', types: ['psychic', 'ground'], text: 'Your Pokémon ignores the town completely. It turns its head, and turns it again, feeling for something you cannot, and then sets off at an angle you would never have chosen. An hour later, the real road is under your feet.' }],
    knows: 'A salt-cutter on a cart slows down beside you. "That Pokémon of yours. Didn\'t it ride a whole team through the tide off the lighthouse flats?"',
  }),
  hazard({
    id: 'wx-smog-alert',
    intro: 'Yellow smog rolls down from the plant on the hill, low and thick, and the street goes dim at midday. A loudspeaker on a pole crackles: "Stay indoors. Stay indoors." Somebody\'s Pokémon is coughing in a doorway.',
    push: 'Walk through it. (your lead may be poisoned)', pushText: 'You pull your collar over your mouth and walk. Your lead walks into the worst of it, and comes out the far side coughing, sick and grey.', pushFx: [statusLead('poison')],
    pushChance: { chance: 0.5, fail: 'You pull your collar over your mouth and walk. Everyone comes out the far side coughing and red-eyed, but nobody worse.', failFx: [] },
    wait: 'Shelter in a café. (a node)', waitText: 'You wait it out in a café with the blinds down, nursing one cup of something for three hours, and listen to the people at the other tables talk about the plant in low, tired voices.',
    uses: [
      { label: 'Immune; it leads the way.', types: ['poison', 'steel'], text: 'Your Pokémon walks into the yellow without a cough and the team follows it in a line, a hand or a paw on the one in front. At the far side a woman in the café window raises her cup to you.' },
      { label: 'Blow it off.', types: ['flying'], text: 'Your Flying-type beats its wings in the middle of the street, steady, steady, until a clear tunnel opens through the smog and the sun comes down it. People come out of doorways to stand in the light.' },
    ],
    strand: { s: 'factory', label: 'Factory crisis', text: 'The smog is coming from the same plant the whole region is talking about. Every hour you walk through it is an hour it gets worse.' },
    knows: 'The café owner, shutters half down, recognises your lead. "You\'re the one whose Pokémon walked people across the salt flats. Come in, come in."',
  }),
  hazard({
    id: 'wx-solar-flare',
    intro: 'The sun spits a flare, bright enough to see through closed eyes. Every bit of gear on you crackles. Your PokéNav hisses static, its map flickering, and then just static.',
    push: 'Ignore it. (a little damage from the static)', pushText: 'You ignore it and walk on by the sun and guesswork. Every metal buckle on you bites with little shocks all afternoon, and the team flinches at every one.', pushFx: [hurt(0.05)],
    wait: 'Wait it out. (a node)', waitText: 'You wait in the shade of a rock until the static clears, the team dozing in a heap, and the map comes back one square at a time.',
    uses: [
      { label: 'Ground the gear.', types: ['electric'], text: 'Your Electric-type puts a paw on the PokéNav and draws the wild charge out of it like drawing out a splinter. The map flickers back to life. Your Pokémon looks very full of itself, and very slightly fizzy.' },
      { label: 'Shield it.', types: ['steel'], text: 'Your Steel-type curls round the gear and takes the flare on its own back, and the static breaks against it like waves on a sea wall. When the light dims, the map is steady.' },
    ],
    knows: 'A lineman up a pole calls down to you. "Oi! Isn\'t that the one that cleared the smog off the high street? Good on it."',
  }),
  hazard({
    id: 'wx-sunken-road',
    intro: 'The road is flooded knee-deep, brown water flat and still from hedge to hedge. A signpost stands up out of it, pointing at more water.',
    push: 'Wade. (slower next battle)', pushText: 'You wade, boots full, team swimming or riding on shoulders. On the far side everybody is soaked and slow and shivering.', pushFx: [temp('Soaked through: slower', [{ kind: 'statMultiplier', stat: 'spe', value: 0.67 }], 1)],
    wait: 'Detour. (a node)', waitText: 'You take the detour along the ridge. It is a long way, but you can see the whole flooded valley from up there, shining.',
    uses: [{ label: 'Carry us.', types: ['water'], text: 'Your Water-type takes everyone across, two at a time, patient as a ferryman. On the last trip it carries you, and it swims a little slower than it needs to, so you can see the fish under the water.' }],
    strand: { s: 'flood', label: 'Flood crisis', text: 'This is the flood\'s water, still spreading. Every boot that churns through it pushes it further down the valley.' },
    knows: 'A farmer in waders, up to his waist, looks at your lead. "That\'s the one from the hailstorm, isn\'t it? Walked a whole party through dry."',
  }),
  hazard({
    id: 'wx-swampy-mist',
    intro: 'A pale mist lies over the swamp, low as breath on a window. Shapes move in it. Something laughs, a long way off, or near. Your team draws close around you without being told.',
    push: 'Push through. (something in the mist will attack)', pushText: 'You push through, and the shapes come for you.', pushFx: [],
    wait: 'Wait for morning. (a node)', waitText: 'You make camp on the only dry hummock and keep a fire going all night. The shapes come to the edge of the light and look at you, and do not come any closer. In the morning the mist is gone, and so are they.',
    uses: [
      { label: 'Talk to the shapes.', types: ['ghost'], text: 'Your Ghost-type drifts into the mist and you hear it talking, low, in a voice you have never heard it use. The shapes gather round it. Then they move aside, and you walk through a corridor of quiet watchers who do not lift a hand.' },
      { label: 'Burn it off.', types: ['fire'], text: 'Your Fire-type breathes out a long warm breath, and the mist curls back from it and burns away to nothing. The shapes in it were only reeds after all. Probably.' },
    ],
    extra: [],
    knows: 'An old woman poling a punt through the reeds nods at your lead. "I know that one. Sang a whole bus over black ice, the way I heard it."',
  }),
  hazard({
    id: 'wx-thunderstorm-crossing',
    intro: 'Lightning walks across an open field, one white leg and then another. You count, the way you were taught as a kid. One, two, CRACK. One, two, CRACK. The far side of the field has a ditch, and trees, and it is a long way off.',
    push: 'Run between strikes. (your lead may be paralysed)', pushText: 'You run. The world goes white once, very close, and your lead stumbles and goes stiff and you carry it the last stretch, its fur standing straight up.', pushFx: [statusLead('paralysis')],
    pushChance: { chance: 0.5, fail: 'You run, counting, and the strikes fall left and right and never on you. At the ditch you all collapse in a heap, hearts hammering, laughing at nothing.', failFx: [] },
    wait: 'Wait in the ditch. (a node)', waitText: 'You lie in the ditch with your team pressed flat around you and wait, and count, and count, until the gap between flash and crack grows long, and longer, and the storm walks away over the hills.',
    uses: [
      { label: 'Lead; it takes the strikes.', types: ['ground'], text: 'Your Ground-type walks out into the middle of the field and stands there, and when the lightning comes it comes for it, and goes into it, and goes into the earth. The rest of you cross behind it. It does not even blink.' },
      { label: 'It absorbs them.', types: ['electric'], text: 'Your Electric-type runs out into the field to meet the storm. The strikes come down to it like dogs to a whistle, and it drinks them in, and comes back to you crackling, eyes bright, hardly able to keep still.', fx: [temp('Full of lightning: faster', [{ kind: 'statMultiplier', stat: 'spe', value: 1.5 }], 1)] },
    ],
    knows: 'A man sheltering under a cart squints at your lead. "That one burned the mist off the swamp road. My boy was on that road."',
  }),
  hazard({
    id: 'wx-tropical-squall',
    intro: 'A squall comes in off the sea over a beach where a child\'s birthday party was just getting going. Sand stings. A bunch of balloons tears loose and goes up and up across the dark sky. A child: "My balloon!"',
    push: 'Run for cover. (a little damage)', pushText: 'You run for cover with everyone else, sand in your teeth, and watch the balloons go out to sea.', pushFx: [hurt(0.05)],
    wait: 'Shelter in the beach hut. (a node)', waitText: 'You crowd into the beach hut with the whole birthday party. There is cake. It is a little sandy. By the time the squall passes you know all the words to a song you will never get out of your head.',
    uses: [
      { label: 'Fetch the balloon.', types: ['flying'], text: 'Your Flying-type goes up into the squall like an arrow and comes back, buffeted and determined, with the whole bunch of balloons in its beak. The child cries with joy and hugs it, wet feathers and all, and presses something into your hand.', fx: [any('oran-berry', 'sitrus-berry')] },
      { label: 'Splash about in it.', types: ['water'], text: 'Your Water-type runs out into the storm and plays in it, rolling in the surf, spinning in the rain, and the children come out from under the hut to watch, and then to join in, and the party becomes a different, better party.' },
    ],
    knows: 'The birthday child\'s mother peers at your lead. "Wait. Didn\'t that one walk people through a lightning storm? My brother said."',
  }),
  hazard({
    id: 'wx-volcanic-ash',
    intro: 'Grey ash drifts from a far volcano and settles on everything, soft as snow, but warm. Eyes sting. Every leaf is grey. Your team keeps blinking and pawing at its face.',
    push: 'Cover your face and walk. (less accurate next battle)', pushText: 'You wrap your faces and walk. By the end, everyone\'s eyes are red and streaming, and nobody can see straight for a while.', pushFx: [temp('Ash in your eyes: less accurate', [{ kind: 'accuracyMultiplier', value: 0.85 }], 1)],
    wait: 'Wait for the wind. (a node)', waitText: 'You wait, and in the evening the wind turns and carries the ash off to the east, and the sunset through what is left of it is the reddest you have ever seen.',
    uses: [
      { label: 'Lead, unbothered.', types: ['fire', 'rock'], text: 'Your Pokémon walks through the ash like it was born in it, and maybe it was. It finds the road under the grey by feel and the team follows its tracks, eyes shut, one paw on the one in front.' },
      { label: 'Clear the air.', types: ['flying'], text: 'Your Flying-type beats its wings and the ash lifts and swirls away from the road in a long grey wave, and the trail is clear for as far as you can see.' },
    ],
    knows: 'A ranger with a mask round her neck stops you. "You\'re them. The one whose Pokémon brought the balloons back down. The whole coast is talking."',
  }),
  hazard({
    id: 'wx-windstorm-gap',
    intro: 'A howling gale pours through a narrow gap in the cliffs, the only way through, and the noise of it is like a train that never ends. Pebbles skitter past along the ground. Your lightest Pokémon is already leaning into it at a steep angle.',
    push: 'Lean into it. (damage; a light Pokémon may be blown back)', pushText: 'You lean into it and push. Halfway through, your lightest Pokémon is plucked off its feet and tumbled back, and you have to go back for it, and it is shaken and slow for the rest of the day.', pushFx: [hurt(0.1), temp('Blown about: slower', [{ kind: 'statMultiplier', stat: 'spe', value: 0.8 }], 1)],
    wait: 'Wait for a lull. (a node)', waitText: 'You wait in a cleft of rock for the lull, and when it comes, all at once, it is so quiet you can hear your own heart. You walk through the gap in the silence.',
    uses: [
      { label: 'Heavy; it anchors the line.', types: ['steel', 'rock'], text: 'Your heaviest Pokémon goes first and everyone holds on to it, a line of paws and tails, and the wind screams and pulls and cannot shift it one inch. You come out the far side in a single unbroken chain.' },
      { label: 'Ride it.', types: ['flying'], text: 'Your Flying-type opens its wings and lets the gale have them, and rides it like a kite, and drops a rope back to the rest of you, and hauls. It is the best afternoon of its life.' },
    ],
    knows: 'A climber roped to the cliff calls down. "Hey! Is that the one that cleared the ash off the high road? Thought so!"',
  }),
];
// The swampy mist push: something in the mist attacks.
(HAZARDS.find((e) => e.id === 'wx-swampy-mist')!.choices as Json[])[0] = ch('Push through. (something in the mist will attack)', fight('You push through, and the shapes come for you, pale and quick.', { ...wild({ types: ['ghost', 'poison'], lv: 1 }), friendly: true, lose: [] }, flag('hazard-swampy-mist-push')));
// The overgrown trail push: what you cut was a tail.
(HAZARDS.find((e) => e.id === 'wx-overgrown-trail')!.choices as Json[])[0] = ch('Hack through. (a little damage, and something in there will fight)', fight('You hack through. It is slow and scratchy work, and halfway along you cut a vine that turns out to be somebody\'s tail.', { ...wild({ types: ['grass'], lv: 1 }), friendly: true, lose: [] }, hurt(0.05), flag('hazard-overgrown-trail-push')));
// The fog bank: Halden's bell rings the way through if the Bell in the Fog is in this run (SF29).
(HAZARDS.find((e) => e.id === 'wx-fog-bank')!.remembers as Json[]).unshift(v('halden-bell', [is('halden-bell')], { notice: 'The voice in the fog is a bell. You know that bell. Halden\'s bell, rung slow and steady from somewhere on the left, the way it rang for you once before. Left. Always left.' }));

// =====================================================================================================================
// SF43. THE KINDNESS LEDGER. Small kindnesses; each "pay it forward" adds 1 to `kind-total` (with Kindness +1).
// At a Crisis climax, the people you helped turn up (kind-helpers). Hettie keeps the ledger.
// =====================================================================================================================
const KINDNESS: Json[] = [
  {
    id: 'bakery-gift',
    intro: 'A bakery doorway, warm air spilling out of it into the cold, and the smell of it stops your whole team in its tracks. The baker, a round man in a floury apron, is handing buns out to anyone with a Poké Ball on their belt. Fen-Lo: "Trainers eat free on Thursdays." He winks. "It\'s always Thursday for trainers." Behind you in the queue, a small boy is counting coins in his palm, and coming up short.',
    choices: [
      ch('Take one.', out('You take one. It is still hot, sweet, soft in the middle. You break pieces off for your team as you walk, and everybody walks a little lighter.', heal(0.1))),
      ch('Take one, and pay. (₽50)', out('You put the coins on the counter anyway. Fen-Lo looks at them for a long moment, and then at you, and something in his face goes soft. Fen-Lo: "Nobody ever pays." He puts two more buns in your bag when he thinks you are not looking.', heal(0.1), $(-50), ...kind()), { requires: [money(50)] }),
      ch('Take one for the kid behind me.', out('You hand it straight to the boy with the coins. He stares at you, and then at the bun, and then he is off down the street to a woman in a shop doorway, shouting about it. She looks up, finds you, and puts her hand on her heart. Fen-Lo gives you another without a word.', heal(0.1), ...kind())),
    ],
  },
  {
    id: 'center-lady',
    intro: 'A roadside first-aid post, really just a folding table, an awning and a kettle. A woman in a cardigan is knitting behind it, and a Chansey sits beside her with a tray of bandages on its lap. A hiker with a sprained ankle is waiting on the bench, pretending not to be. Mrs. Pryor: "Would you like me to heal your Pokémon? Sit, sit." She is already putting the knitting down.',
    choices: [
      ch('Yes, please.', out('She sees to every one of them, slowly, talking to each the whole time. Chansey hums. By the end your team is whole, and you are holding a cup of tea you do not remember being given.', heal(1))),
      ch('Heal the hiker first.', out('Mrs. Pryor looks at you over her glasses, and then at the hiker, who goes red. She sees to his ankle first. Then your team. As you leave, the hiker limps after you to shake your hand, and says he\'ll not forget it. You think he means it.', heal(1), flag('pryor-hiker'), ...kind())),
      ch('Bring her lunch next time.', out('She laughs, delighted. "Nobody\'s ever offered!" She heals your team, and you come back that evening, the long way round, with a sandwich wrapped in paper. She eats half and gives the other half to Chansey. It is the happiest you have seen anyone all week.', heal(1), flag('pryor-lunch'), ...kind())),
    ],
  },
  {
    id: 'gift-from-mom',
    intro: 'A parcel waiting for you at the Pokémon Center counter, battered from the road, your name on it in handwriting you would know anywhere. Inside: two pairs of thick socks, a bottle of Sweet Berry Juice, a bag of the biscuits you liked when you were seven, and a note. "Don\'t forget to eat. I\'m proud of you. Call." You read it twice. Your team crowds round the box, very interested in the biscuits.',
    choices: [
      ch('Call her.', out('You find the phone in the corner before you can talk yourself out of it. It rings twice.', item('sweet-berry-juice'), room('mom-calls'))),
      ch('Write back.', out('You sit down at the Center\'s table and write back, a long letter, longer than you meant, about the road and the team and the things you have seen. You put it in the post with a drawing your lead "helped" with.', item('sweet-berry-juice'), flagAt('mom-wrote'))),
      ch('Share the snacks.', out('You tip the biscuits out on the floor of the Center and everybody gets one, then two, then the crumbs. It is a small thing. Your team acts like it is a feast. Afterwards they are all lying on your feet.', item('sweet-berry-juice'), bondUp(1, 'party'), ...kind())),
    ],
  },
  sub('gift-from-mom', 'mom-second-parcel', 'A Bigger Parcel', 'Another parcel, a stage or two on, and this one is twice the size. Your letter got there. Inside are socks, more biscuits, two bottles of Sweet Berry Juice, a scarf that is clearly the first scarf anybody ever knitted, and a note: "Your letter is on the fridge. The drawing too. Tell your Pokémon it\'s very good. Keep writing."', [
    ch('Keep writing.', out('You will. You put the scarf on, though it is not cold, and it is a bit lopsided, and you leave it on all day.', item('sweet-berry-juice', 2), bondUp(1, 'party'), flag('mom-parcel-two'))),
  ], { callback: true, requires: [is('mom-wrote'), later('mom-wrote', { stages: 2 }), not('mom-parcel-two')] }),
  {
    id: 'kind-hiker',
    intro: 'A hiker on a bench at a bend in the trail, boots off, toes wriggling, a huge bag of trail mix open on his knee. He sees you and holds it out before you can say hello. Gus: "Trail mix? Got too much. Always do." He shakes the bag. "My wife says I pack for a family I haven\'t got."',
    choices: [
      ch('Thanks.', out('You take a handful. Gus nods, satisfied, like a man who has done his job for the day.', heal(0.05))),
      ch('Swap him for something of mine.', out('You give him something from your bag in return. Gus turns it over in his big hands, and grins. Gus: "Fair trade. Fair trade!" He tells everybody he meets for the rest of the week.', heal(0.05), ...kind())),
      ch('Give it to my Pokémon.', out('You crouch and hold your palm out to your lead, who eats every last nut with enormous seriousness and then licks your hand. Gus laughs till he has to put his boots back on.', bondUp(1, 'lead'))),
    ],
  },
  {
    id: 'kind-ranger',
    intro: 'A ranger at a lookout tower, binoculars round her neck, sleeves rolled up. Ranger Sol: "Mind if I check your team? Feet, eyes, teeth." She nods down the slope, where a wild Pokémon is lying in the grass, licking a cut on its leg. "Got one more patient waiting, but I\'ve time."',
    choices: [
      ch('Go ahead.', out('She checks every one of them, quick and gentle, and finds things you never noticed: a stone in a paw, a scratch under a wing. When she is done, everybody is right as rain.', cure())),
      ch('Check the wild one first.', out('Sol looks at you properly, then nods once and goes down the slope. You watch her clean the cut and bind it while the wild Pokémon holds very still and trusts her. Then she comes back up and does your team. Ranger Sol: "Don\'t see many who\'d wait."', cure(), ...kind())),
      ch('We\'re fine.', out('She shrugs, cheerfully. "Suit yourself. Watch the left fork, it\'s muddy." She goes back to her binoculars.')),
    ],
  },
  {
    id: 'kind-rival-visit',
    intro: 'Your rival is leaning on a fence by the road, not to battle, by the look of it. They straighten up when they see you and look away, then back. {rival}: "{say gift||champion-chaser::Here. Don\'t make it weird. I had two.||bitter-challenger::Here. Don\'t make it weird. I didn\'t want it anyway.||enthusiast::Here! Don\'t make it weird! I got you something!||idealist::Here. Don\'t make it weird. It\'s what you do.||strategist::Here. Don\'t make it weird. You\'ll need it more than I will, statistically.||protector::Here. Don\'t make it weird. Just take it.||prodigy::Here. Don\'t make it weird. I won\'t miss it.||underdog::Here. Don\'t make it weird. It\'s not much.}" They push something into your hands. {rival}: "Good luck out there."',
    choices: [
      ch('Thanks.', out('You say it like you mean it, and they hear that you mean it, and for a second neither of you knows where to look.', any('sitrus-berry', 'lum-berry', 'repel'), trust(1))),
      ch('Give them something back.', out('You dig in your bag and hand them something of yours. They blink at it. Then they put it away very carefully, in an inside pocket, and do not say anything, and that is how you know.', lose(), any('sitrus-berry', 'lum-berry', 'repel'), feel({ trust: 1, respect: 1 }), ...kind())),
      ch('What\'s the catch?', out('{rival}: "Wow." They shake their head. "Wow." They put the gift on the fence post anyway and walk off without looking back. You take it. It is a long time before you stop feeling bad about that.', any('sitrus-berry', 'lum-berry', 'repel'), trust(-1))),
    ],
  },
  {
    id: 'last-cookie',
    intro: 'A rest stop, after a long day. One last cookie on the plate. It sits there. Every single member of your team is looking at it, and then at you, and then at it. Nobody moves. The silence has weight.',
    choices: [
      ch('Give it to my starter.', out('Your starter takes it with the dignity of the first. The others sulk, briefly, theatrically, and then one by one they curl up against your starter anyway, because that is where they always end up.', bondUp(2, 'starter'))),
      ch('Break it into six.', out('You break it into tiny, ridiculous, fair pieces and give everybody one. It is about one crumb each. It is the best crumb any of them has ever had.', bondUp(1, 'party'), ...kind())),
      ch('Eat it myself.', out('You eat it. Every eye in the camp follows it all the way into your mouth. Nobody says anything. Nothing else happens. You feel terrible for the rest of the night.')),
    ],
  },
  {
    id: 'pay-it-forward',
    intro: 'A shop counter. You put down a bag of Berries and reach for your money, and the shopkeeper shakes her head and slides a note across. "Paid for. Somebody before you." The note, in pencil: "Pass it on!"',
    choices: [
      ch('Pass it on. (pay for the next person, ₽150)', out('You take your bag, and then you put down money for whoever is next, and write "Pass it on!" on the back of the note. The shopkeeper pins it to the till. As you go, a tired-looking woman with a pram comes in, and you hear the shopkeeper start to tell her.', item('oran-berry', 2), $(-150), flag('kind-passed-on'), flag('kind-forward'), ...kind()), { requires: [money(150)] }),
      ch('Keep the savings.', out('You take the Berries and keep the money. It was meant for you, after all. You think about it for a mile or two.', item('oran-berry', 2), flag('kind-forward'))),
      ch('Find the stranger.', out('You run outside, but whoever it was is gone. Under the shop\'s mat there is a second note, as if they knew: "Don\'t find me. Pass it on."', item('oran-berry', 2), flag('kind-stranger-note'), flag('kind-forward'))),
    ],
  },
  {
    id: 'pay-it-forward-pass', callback: true, requires: [is('kind-forward'), later('kind-forward', { stages: 1 })],
    intro: 'A stage on from the shop with the note, a noodle stall at dusk. A weary traveller in a coat too thin for the weather is counting coins on the counter, and counting them again, and coming up short. The stallholder is waiting, not unkindly. The traveller starts to push the bowl back.',
    choices: [
      ch('Cover it. (₽300)', out('You put the money down before they can finish pushing the bowl away. The traveller looks at it, and at you, and then they are crying, quietly, into the steam. They eat every noodle. When they leave, they shake your hand with both of theirs.', $(-300), flag('kind-tab-covered'), ...kind()), { requires: [money(300)] }),
      ch('Cover half. (₽150)', out('You put down half, and they manage the rest, and the two of you eat side by side at the counter without saying much. It is a good bowl.', $(-150), flag('kind-tab-covered'), ...kind()), { requires: [money(150)] }),
      ch('Look away.', out('You look away and walk on. Behind you, you hear the stallholder say something, and the traveller laugh, short and surprised. Maybe it worked out.', flag('kind-walked-past'))),
    ],
  },
  {
    id: 'mom-calls',
    intro: 'The phone rings. You know who it is before you pick up. Mom: "Are you eating well? Are you warm enough? Is your Pokémon eating well?" A pause. "I saw you on the news. Well, someone who looked like you. From the back. I told everyone at work it was you." She is quiet for a moment, and you can hear the kitchen behind her, the radio, the tap dripping that nobody ever fixed.',
    choices: [
      ch('I\'m fine, Mom.', out('Mom: "You sound tired." You tell her you are not, and she does not believe you, and somehow, after you hang up, you are a bit less tired anyway.', heal(0.05))),
      ch('Tell her the truth about the road.', out('You tell her. The cold nights. The battles you lost. The one you almost did not get up from. She listens to all of it without saying a word. Then, Mom: "Come home whenever. Or don\'t. I\'m proud either way." You put the phone down and sit for a minute with your team pressed against you.', bondUp(1, 'party'))),
      ch('Put my starter on.', out('You hold the phone out. Your starter makes its noise down it, loud and proud and very close to the receiver. On the other end there is a pause, and then your mother is laughing, and laughing, until she is crying, and you are too, a little.', bondUp(1, 'starter'))),
    ],
  },
  {
    id: 'nurse-clinic',
    intro: 'A small clinic at the edge of town, a friendly doctor and a very long queue: a farmer with a limping Mareep, a girl with a sneezing Pichu, an old man who mostly seems to be there for the company. Dr. Amari sees you at the back and raises her voice. Dr. Amari: "I\'ll get to you. Or," she holds up a roll of bandage, "you could help me get to everyone faster."',
    choices: [
      ch('Wait my turn. (a node)', out('You wait your turn on a hard bench and read a very old magazine. When your turn comes, she is quick and kind with your team, and they come out whole.', heal(1), takeNode(1))),
      ch('Help.', out('You roll your sleeves up. You hold Pokémon still, fetch things, comfort the girl with the Pichu. The queue goes down twice as fast. At the end of it, Dr. Amari heals your team herself and presses a Sitrus Berry into your hand. Dr. Amari: "Come back any time. I mean it. I\'ll put you on the rota."', heal(1), item('sitrus-berry'), ...kind())),
      ch('Skip ahead. (₽200)', out('You pay the fee to go first. Dr. Amari takes it without comment. Your team is healed. The queue watches you leave, and you can feel every one of them watching.', heal(1), $(-200)), { requires: [money(200)] }),
    ],
  },
  {
    id: 'charity-drive',
    intro: 'A trestle table in the square with a hand-painted sign: FOR THE ORPHANAGE. A quiet woman in a grey coat sits behind it with a cash tin and an old leather ledger, writing names in very small, very neat handwriting. Hettie: "Whatever you can spare." She looks up. Her eyes are kind and tired. "Or not. That\'s alright too."',
    choices: [
      ch('Give money. (₽200)', out('You put it in the tin. Hettie writes your name in the ledger, and the amount, and then, after a moment\'s thought, a little star beside it.', $(-200), flag('charity'), flag('charity-hettie'), ...kind()), { requires: [money(200)] }),
      ch('Give a lot. (₽1,000)', out('You put it in the tin, and Hettie stops writing and looks at the money, and then at you. Hettie: "That\'s… that\'s a winter\'s coal." She writes your name very carefully, and underlines it.', $(-1000), flag('charity'), flag('charity-hettie'), ...kind(2)), { requires: [money(1000)] }),
      ch('Give an item.', out('You give something from your bag. Hettie writes it down, exactly what it was, and thanks you for it as if it were gold.', lose(), flag('charity'), flag('charity-hettie'), ...kind())),
      ch('Give nothing.', out('Hettie: "That\'s alright too." She means it. She goes back to her ledger, and you go on.', flag('charity-hettie'))),
    ],
  },
  {
    id: 'umbrella-share',
    intro: 'Rain, suddenly and all at once. You get your umbrella up. Under a tree by the road, a stranger in a long coat has no umbrella at all, and is standing very straight, getting very wet, with the patience of somebody who has been rained on many times before. Your whole team looks up at your umbrella, and then at the stranger, and then at you.',
    choices: [
      ch('Share it.', out('You walk over and hold it over them both. You walk to town together, close, shoulders bumping. They talk the whole way, in a slow voice, about old things: who built the bridge, what the river was called before it was called anything, the shape of something huge they once saw on the hills at dawn. At the town gate they thank you and go, and you realise you never asked their name.', flag('teller-umbrella'), ...kind())),
      ch('Give it.', out('You hand it over and walk on in the rain. Your team huddles under your coat. You get soaked. Later, on a bench at the edge of town, you find a smooth grey stone left where you will see it, still damp, still cool: a Damp Rock, and a dry bit of paper under it that says "thank you".', hurt(0.05), item('damp-rock'), ...kind())),
      ch('Keep walking.', out('You keep walking. When you look back the stranger is still there, under the tree, very straight, in the rain.', flag('kind-walked-past'))),
    ],
  },
  {
    id: 'charity-favor', requires: [is('charity-hettie'), later('charity-hettie', { stages: 2 }), not('charity-favor')],
    intro: 'Late in the region. Someone is waving at you from across the street, a quiet woman in a grey coat. Hettie, from the orphanage stall. She crosses through the traffic with the old leather ledger under her arm. Hettie: "Your kindness came back to us. Let us return the favour." She opens the ledger. Your name is in it, again and again, in her small careful handwriting: every kind thing you did on this road that anybody saw, and some that you thought nobody did.',
    choices: [
      ch('You didn\'t have to.', out('Hettie: "No. That\'s why." She presses something into your hands and will not take it back.', flag('charity-favor')), {
        branches: [
          br([is('kind-total', 7)], 'Hettie: "No. That\'s why." She presses a parcel into your hands: a Rare Candy, a Lucky Egg, and, folded very carefully, a drawing in crayon. It is you, and your team, very large, walking over a hill with the sun behind you. In the corner, in a child\'s writing: "THANK YOU". Hettie: "The children did it. They argued about the colours for a week."', item('rare-candy'), item('lucky-egg'), flag('charity-favor'), flag('hettie-drawing'), moment('The orphanage children drew you and your team walking over a hill, the sun behind you', 70)),
          br([is('kind-total', 5)], 'Hettie: "No. That\'s why." She presses a parcel into your hands: a Rare Candy, and a Lucky Egg wrapped in a clean handkerchief.', item('rare-candy'), item('lucky-egg'), flag('charity-favor')),
          br([is('kind-total', 3)], 'Hettie: "No. That\'s why." She presses a Rare Candy into your hand and closes your fingers round it.', item('rare-candy'), flag('charity-favor')),
        ],
      }),
      ch('Read me the list.', out('Hettie reads it. She reads every line, in order, in a soft voice, standing in the street with people going past. It is long. It is longer than you thought. By the end, your lead is leaning against your leg, and you are not quite looking at her.', bondUp(1, 'party'), flag('charity-favor'))),
      ch('Give it to someone else.', out('You shake your head and push it back. "The orphanage. Please." Hettie looks at you for a long moment, and then she writes one more line in the ledger. A week later a letter finds you on the road. Inside, folded, is a crayon drawing of you and your team, and a child\'s writing: "THANK YOU".', flag('charity-favor'), flag('hettie-drawing'), ...kind())),
    ],
  },
  // The Crisis climax: whoever you were kind to comes (SF43, "What the total does").
  sub('charity-drive', 'kind-helpers', 'The People You Helped', 'The night before the worst of it. You are checking your team for the hundredth time when you hear voices at the edge of camp, and footsteps, a lot of footsteps. People are coming up the road with lamps.', [
    ch('Let them in.', out('It is only one or two, in the end: a familiar face, a thermos of tea, a hand on your shoulder. It is enough.', flag('kind-helpers')), {
      branches: [
        br([is('kind-total', 7)], 'It is everyone. Fen-Lo the baker with a basket. Gus the hiker with too much trail mix. Ranger Sol, already rolling her sleeves up. Hettie with her ledger. Faces you helped without thinking about it, faces you had forgotten, all of them carrying lamps, a long line of light coming up the road behind you. Ranger Sol: "We heard where you were going. Thought you\'d want company." Tomorrow, wherever you do not stand, one of them will. Nobody gets left behind this time.', heal(1), flag('crisis-ally-split'), flag('kind-helpers'), moment('Everyone you were kind to came up the road with lamps the night before the crisis', 85)),
        br([is('kind-total', 5)], 'Fen-Lo the baker and Gus the hiker, arguing cheerfully about whose food is better, and behind them Ranger Sol with a medical bag. They feed your team, and Sol checks every paw and wing. Ranger Sol: "Tomorrow, if you have to split your team, I\'ll take the half you can\'t. Don\'t argue."', heal(1), temp('Ranger Sol has your back: your team takes less damage', [{ kind: 'damageTakenMultiplier', value: 0.85 }], 2), flag('kind-helpers')),
        br([is('kind-total', 3)], 'Fen-Lo the baker, with a basket of buns still warm in a cloth, and Gus the hiker with a bag of trail mix the size of a pillow. Gus: "Packed for a family I haven\'t got. Turns out I have." Your team eats until it can\'t, and sleeps like it hasn\'t in weeks.', heal(1), flag('kind-helpers')),
      ],
    }),
  ], { callback: true, requires: [is('crisis-strand-open'), is('crisis-beat'), is('kind-total', 3), not('kind-helpers')], remembers: [v('traveller', [is('kind-tab-covered'), is('kind-total', 5)], { notice: 'At the back of the line, in a coat too thin for the weather, is the traveller from the noodle stall. They do not say anything. They just stand with you, and hold a lamp.' })] }),
];

// =====================================================================================================================
// SF44. STRANGERS WORTH STOPPING FOR. Each costs something; each stranger is a hidden Teller (`teller-<name>`)
// whom the Legendary and Mythical questlines read later.
// =====================================================================================================================
const STRANGERS: Json[] = [
  {
    id: 'barefoot-monk',
    intro: 'A monk in faded saffron sits at the foot of a long hill, one foot bound in a strip of cloth, gone dark with blood. His staff is broken beside him. Far above, at the top of a thousand worn steps, a shrine roof shows between the pines. Brother Tal: "I must reach the shrine before the moon is full." He says it without self-pity, as a fact. "Can you carry me?"',
    choices: [
      ch('Carry him. (a node)', out('You carry him. A thousand steps. He is lighter than he looks and heavier than you hoped, and he does not complain once, only hums an old tune under his breath that keeps time with your feet. At the top, he puts his hand flat on the shrine\'s gate, and turns to you, and tells you one true thing about where an old power sleeps in this land. You will remember it.', takeNode(1), flag('teller-tal'), ...kind())),
      ch('Let a Pokémon carry him.', out('Your strongest Pokémon kneels without being asked, and Brother Tal climbs on, and they go up the steps together at a slow, careful walk. At the top he bows to your Pokémon before he bows to you, and tells you both one true thing about where an old power sleeps in this land.', bondUp(2, 'picked'), flag('teller-tal'), ...kind()), { pick: {} }),
      ch('I\'m sorry, I can\'t.', out('Brother Tal: "Of course." He nods, and there is nothing in it but kindness. When you look back from the bend in the road, he has started up the steps on his own, one at a time.', flag('kind-walked-past'))),
    ],
  },
  {
    id: 'blind-describer',
    intro: 'A viewpoint at the top of a pass, the whole valley laid out below in gold and green. An old woman sits on the bench with her hands folded on a white cane and her face turned to the wind. Marguerite: "I can\'t see it, but I can hear it." She tilts her head at the valley. "Rivers. Birds. Something big, far off. Tell me what\'s out there?"',
    choices: [
      ch('Describe the view. (a node)', out('You sit down and tell her. You do it badly at first, and then better, the river like a dropped ribbon, the town like spilled sugar, the shadow of a cloud walking over the fields. She listens with her whole face. Marguerite: "You\'ve a good eye." In return she tells you a story her grandmother told her, about something small and bright that lives in this valley and is only seen by people who are not looking for it.', takeNode(1), flag('teller-marguerite'))),
      ch('Describe my team. (a node)', out('You describe your team instead, one by one. She asks each one\'s name, and says it back to them, slowly, getting it right. Each of them comes and puts its head under her hand when she says it. At the end she tells you a story about this valley that her grandmother told her, and you think the team listens as hard as you do.', takeNode(1), bondUp(1, 'party'), flag('teller-marguerite'))),
      ch('Describe something that isn\'t there.', out('You tell her there is a dragon on the far hill, sunning itself. She laughs, a big surprising laugh. Marguerite: "There\'s no dragon. But thank you." She pats your hand.')),
    ],
  },
  {
    id: 'blind-old-lady',
    intro: 'A busy road, cars and carts and a bus going by much too fast. An old lady stands at the kerb with a shopping basket and a stick, waiting for a gap that is never going to come. She takes a step, and steps back.',
    choices: [
      ch('Walk her across.', out('You offer your arm and she takes it, and you walk her across, slowly, one hand up to the traffic. On the far side she pats your arm twice. Old lady: "My late husband walked like you. Like the road was yours." She tells you, as you go, that her husband used to say three old spirits keep the lakes of this land, and that you had best be good to lakes.', flag('teller-oldlady'), ...kind())),
      ch('Stop the traffic with a big Pokémon.', out('You send out your biggest Pokémon and it walks into the middle of the road and sits down. Everything stops dead. The drivers glare. The old lady laughs so hard she has to lean on you, all the way across. On the far side she tells you her husband used to say three old spirits keep the lakes of this land, and that you had best be good to lakes.', flag('teller-oldlady'))),
      ch('Point her to the crossing.', out('You point her to the crossing, fifty yards down. She thanks you and goes. She gets there.')),
    ],
  },
  {
    id: 'old-mans-tale',
    intro: 'A campfire at a rest stop, and an old man already sitting at it, poking it with a stick. He has kept a place for you, or for anyone. Hob: "You\'ve got time for a story." He does not look up. "Everyone has, if they stop."',
    choices: [
      ch('Listen.', out('You sit, and he tells it: an old story about the great one of this region, how it came, what it wanted, where it went to sleep. He tells it like a man telling you about his own grandfather. It is a long story. You will find out, later, that every word of it is true.', flag('teller-hob'))),
      ch('Tell one back.', out('You tell him one of yours, about the road and your team, and he listens to all of it, nodding. Then he tells his: an old story about the great one of this region. Hob: "I\'ll tell yours to the next one who stops. That\'s how it works." Somewhere, later, a stranger is going to hear about you.', flag('teller-hob'), bondUp(1, 'party'))),
      ch('Not tonight.', out('Hob: "Fair enough." He keeps the fire going for you while you sleep, and in the morning he is gone, and the fire is still warm.', heal(0.3))),
    ],
  },
  {
    id: 'quiet-hermit',
    intro: 'A hollow tree with a door in it, a real door, painted green, with a brass knocker. A thin man with a beard down to his belt opens it before you knock and looks at your bag. Wennick: "Bring food, and I\'ll tell you my story." He clears his throat. "I don\'t get many visitors. I\'m out of practice at asking."',
    choices: [
      ch('Give food. (three Oran Berries)', out('You give him three Berries. He eats one very slowly, with his eyes closed, and then he tells you his story: thirty years ago, on this very hill, at dawn, he saw something he could not name, and it looked at him, and he has been waiting here ever since in case it comes back.', useItem('oran-berry', 3), flag('teller-wennick'), ...kind()), { requires: [hasItem('oran-berry', 3)] }),
      ch('Share a meal. (a node)', out('You cook. He eats as if he has forgotten how food tastes. Afterwards, by the fire in his tree, he tells you his story: thirty years ago, on this hill, at dawn, something he could not name looked at him, and he has waited for it ever since. Before you go he gives you a Leftovers. Wennick: "I won\'t need it. Someone\'s coming. I can feel it."', takeNode(1), item('leftovers'), flag('teller-wennick'), ...kind())),
      ch('No food to spare.', out('Wennick: "Come back when you\'ve some." He closes the green door very gently.')),
    ],
  },
  {
    id: 'share-a-meal',
    intro: 'A traveller at the side of the road, cooking over a fire so small it fits in two hands. A dented pot, something simmering. They look up as you pass and shift along the log. Traveller: "There\'s always enough for one more. Sit."',
    choices: [
      ch('Sit. (a node)', out('You sit. The pot should not feed two, let alone your whole team, and somehow it does. While you eat, the traveller talks about a Pokémon they saw once, white and gold, walking on the water of a lake at dawn, not hurrying. Traveller: "It looked at me like I was enough." They do not explain, and you do not ask.', takeNode(1), heal(1), flag('teller-traveller'))),
      ch('Add something to the pot. (an Oran Berry)', out('You drop a Berry in. The traveller smiles like you have given them a gift. The meal is enough for everyone, and then some, and your team is so full and so warm that they all fall asleep in a heap against the log. The traveller tells you about something white and gold they saw once, walking on water at dawn.', useItem('oran-berry'), heal(1), bondUp(1, 'party'), flag('teller-traveller')), { requires: [hasItem('oran-berry')] }),
      ch('Thank you, no.', out('Traveller: "Another time." They mean it. When you look back, they are still there, the little fire still going.')),
    ],
  },
];

// =====================================================================================================================
// SF45. THE CAMP. The checkpoint opens one of the camp scenes by the time of day.
// =====================================================================================================================
const CAMP: Json[] = [
  {
    id: 'camp-checkpoint',
    intro: 'A tidy camp set up for travellers: a ring of stones round a firepit, a tent pitched square, a kettle on a hook. A camp warden in a wide hat checks you in with a clipboard. Camp warden: "One hour, then I need the pitch." She looks at your team, already spreading out to sniff everything, and softens. "Or the whole night, if you need it. What\'ll it be?"',
    choices: [
      ch('Make camp for the night.', out('You make camp. Nobody says much. Your team lies down round you by the fire, one by one, and sleeps the deep sleep of the safe, and so does anyone travelling in your care. In the morning everyone is whole again.', heal(1), cure(), convoyHeal(4), fr(3, 'party'), rest())),
      ch('Prepare for the road.', out('You spread your gear out on the grass.', room('camp-prepare'))),
      ch('Hold council. (morning or afternoon)', out('You sit down in the middle of your team and wait for them to tell you.', room('camp-council')), { requires: [at('morning', 'afternoon')] }),
      ch('Talk by the fire. (evening or night)', out('The fire burns low. You take one of them a little way off, where it is quiet.', room('camp-talk')), { requires: [at('evening', 'night')] }),
    ],
  },
  {
    id: 'camp-council',
    intro: 'A quiet camp between two roads, an hour to spend, and your whole team looking at you to decide how to spend it. They each make their case. Your starter paces, restless, wanting to train. The newest one keeps bringing you sticks to throw. The one who has been with you longest is already lying down with its eyes half shut, making a very clear point.',
    choices: [
      ch('Train.', out('You train. An hour of hard work, sharp and focused, and your lead comes out of it standing differently, ready for anything. The newest one sulks under a bush with its stick.', temp('Trained hard: your lead hits harder', [{ kind: 'statMultiplier', stat: 'atk', value: 1.1 }, { kind: 'statMultiplier', stat: 'spa', value: 1.1 }], 1), bondUp(-1, 'newest'))),
      ch('Play.', out('You throw the stick. And again. And again. By the end of the hour the whole team is playing, even the old one, and the newest is so happy it can barely stand up. Afterwards nobody wants to stop.', bondUp(1, 'newest'), fr(5, 'party'), room('camp-party'))),
      ch('Sleep.', out('You sleep. All of you, in a heap, in the sun. The old one gets the best spot, against your side, and sighs a long sigh of having been right.', heal(0.5), bondUp(2, 'firstCatch'))),
    ],
  },
  {
    id: 'camp-mentor', requires: [mentor()],
    intro: 'Your mentor talks best at night, when the road is quiet and the fire is low and there is nobody else to hear. They sit with their hands round a tin cup and do not look at you. Mentor: "Ask me anything. Once." A long pause. "I\'ll answer straight."',
    choices: [
      ch('What should I fear next?', out('Your mentor thinks for a long time. Then they tell you, plainly, about what is waiting at the end of this road: what it fights with, what it holds back, where it is weak. It is a true answer. You can tell by how much they did not want to give it.', gym(), mentorFx(2, 1), rp(20))),
      ch('What did you get wrong?', out('A long silence. Then your mentor tells you. Not all of it. One thing, from a long time ago, that they have not told anyone. When they are done, they finish their cup and go to bed without another word, and the next morning they are a little easier with you.', mentorFx(5, 3), flag('camp-mentor-story'), rp(15))),
      ch('Am I doing well?', out('Mentor: "Yes." They look at you, finally. "Don\'t let it slow you."', mentorFx(2, 1))),
      ch('Ask about the mission.', out('Your mentor looks at you for a long moment over the cup, then nods. Mentor: "You\'re ready."', mentorFx(1, 1, true), rp(10)), { requires: [mentor({ mission: 'none' })] }),
    ],
  },
  {
    id: 'camp-party',
    intro: 'An hour off, and your Pokémon drift toward each other the way they do. Two are squabbling over the warm rock. Three are playing some game with rules only they understand. And one is off by itself at the edge of the firelight, watching the others, not joining in.',
    choices: [
      ch('Break up the argument.', out('You sit down between the two and do not take sides, and after a while they are sharing the rock, and after a while longer they are asleep on it, curled round each other. Whatever was between them is gone.', fr(5, 'party'), bond(6, 4, true), rp(15))),
      ch('Join the game.', out('You join the game. You do not understand the rules. You lose, badly, every round, and every single one of them thinks it is the funniest thing that has ever happened.', bondUp(1, 'party'), bond(8, 4), rp(20))),
      ch('Sit with the one alone.', out('You go and sit with the one at the edge. You do not say anything. After a while it leans against you, just a little, and you stay like that until the fire goes down.', bondUp(2, 'newest'), bond(3, 2), rp(10))),
    ],
  },
  {
    id: 'camp-prepare',
    intro: 'A quiet road ahead, an hour to spare, and your gear spread out on a groundsheet. What you can usefully do with an hour changes as the day wears on.',
    choices: [
      ch('Scout ahead.', out('You leave the team at camp and walk the road ahead, and come back with the next stretch drawn on the back of your hand.', scout(2), rp(15))),
      ch('Sort the bag. (afternoon)', out('You tip the bag out and sort it, properly, for the first time in weeks. At the bottom, squashed but whole, is something you forgot you had.', any('sitrus-berry', 'lum-berry', 'great-ball')), { requires: [at('afternoon')] }),
      ch('Mend gear. (evening or night)', out('You mend what can be mended by the light of the fire, and your team rests and gathers itself. Everyone will go into the next fight fresh.', { kind: 'restorePp' }), { requires: [at('evening', 'night')] }),
      ch('Celebrate the day.', out('Today is a day worth marking, and you mark it. The whole team feasts by the fire, and in the morning a stranger has left a small gift by the ashes.', celebrate(), fr(10, 'party'), heal(1), any(...TREASURE), any(...VITAMINS), rp(60)), { requires: [milestone] }),
    ],
  },
  {
    id: 'camp-rival',
    intro: 'The fire pops. Your starter, lying with its chin on its paws, gives you a look that you have learned means one thing. It is thinking about {rival}. So, if you are honest, are you.',
    choices: [
      ch('They\'re good.', out('You say it out loud, for the first time. They are good. Better than you, some days. Your starter thumps its tail once, agreeing, and it is easier to say than you thought.', feel({ respect: 1 }))),
      ch('They\'re annoying.', out('They are annoying. You list the ways. It takes a while. Your starter listens to the whole list with great patience, and then yawns.', feel({ rivalry: 1 }))),
      ch('I worry about them.', out('You do. You do not know when that started. You sit with it, and your starter comes and leans on you, and neither of you says anything else.', trust(1))),
    ],
  },
  {
    id: 'camp-rival-trail',
    intro: 'A quiet clearing. One of your team stops in the middle of the path and will not move. It has been like this since the last time it faced that one Pokémon of your rival\'s, the one it always ends up facing. It scratches a shape in the dirt with one claw: the other Pokémon\'s shape. Then it looks up at you.',
    choices: [
      ch('Train for it.', out('You train for it. Every move that one makes, you make, and your Pokémon answers it, over and over, until the answers come without thinking. When you leave the clearing it is walking taller, and its eyes are fixed on the road ahead.', temp('Trained for its rival: hits harder next fight', [{ kind: 'damageMultiplier', value: 1.1 }], 1), lv(1, 'lead'), rp(20)), { requires: [monRival('open')] }),
      ch('Talk to it.', out('You sit down by the shape in the dirt and talk to it, about losing and about trying again, and about how you do not care who wins, not really. It listens. Then it rubs the shape out with its tail.', bondUp(2, 'lead'))),
      ch('Let it think.', out('You sit on a log and let it think. It is remembering the one that took the blow meant for it, and did not get up. It takes a long time. Then, all at once, it gets up and comes to you, ready, and the whole team gathers round it.', flag('trail-first'), bondUp(1, 'lead'), fr(10, 'party'), heal(0.3), rp(40)), { requires: [monRival('sacrificed')] }),
      ch('Ask about the one that left.', out('Its rival joined a trainer, and it has not known what to do with that. You tell it that it is allowed to miss an enemy. It sits with you for a while, and something in it settles.', fr(6, 'party'), rp(20)), { requires: [monRival('carried')] }),
    ],
  },
  {
    id: 'camp-talk',
    intro: 'Away from the others, the night is long enough for a real conversation. You sit with one of them on a rock at the edge of camp, the fire behind you and the stars in front, and it is the kind of quiet where you can say things.',
    choices: [
      ch('Ask about where they came from.', out('You ask, and it shows you, the only way it can: the way it looks at the dark, the direction it faces, the sound it makes very softly in its throat. You remember the day you found it, and you understand that it remembers too, from the other side. You have never felt so much that it chose you.', bondUp(2, 'lead'), bond(3, 2), rp(10))),
      ch('Tell them about home.', out('You tell it about home. Your room. The window. The tree in the yard. The sound the kettle makes. It does not understand a word, and listens to every one, its head on your knee. One by one the others come over from the fire and listen too.', bondUp(2, 'lead'), bondUp(1, 'party'))),
      ch('Talk about {rival}.', out('The fire pops. You find you are thinking about {rival}.', room('camp-rival')), { requires: [{ kind: 'rivalMet', atLeast: 1 }] }),
      ch('Talk with your mentor.', out('Your mentor has been watching the fire too.', room('camp-mentor')), { requires: [mentor()] }),
    ],
  },
];

export const EVENTS: Json[] = withRooms([...HAZARDS, ...KINDNESS, ...STRANGERS, ...CAMP]);
