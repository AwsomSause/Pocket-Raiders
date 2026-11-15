// Catalog Overhaul Pack, category "places": STORY_FAMILIES_17.md SF127 The Biome Hazards and SF128 Volunteer Work.
// SF127: every hazard is a node with three approaches, as in SF42: "Push on." / "Wait." / "Use a [type]." (a kind hazard has no
// "Wait."). Where two catalog ids share a biome, both are the same hazard.
// SF128: one family with a stated trade, no random rewards: a node of time and one Pokémon's effort for +2 Bond with that Pokémon
// and the town's Reputation +1; or a stated donation; or not today.
import { $, anyType, ch, flag, fr, heal, hurt, hurtExcept, hurtLead, item, join, money, out, statusLead, status, takeNode, type Json } from '../dsl.ts';
import { kind, moment, rep } from './_delve.ts';

export const CATEGORY = 'places';

const bond = (n: number, who: Json | string = 'party'): Json => ({ kind: 'friendship', bond: n, who });
const nextBattle = (label: string, stat: string, value: number): Json => ({ kind: 'tempEffect', label, effects: [{ kind: 'statMultiplier', stat, value }], battles: 1, until: 'battle' });
const types = (...t: string[]): { types: string[] } => ({ types: t });

interface Hazard {
  ids: string[]; intro: string;
  push: { text: string; fx: Json[]; chance?: number; fail?: { text: string; fx: Json[] } };
  wait?: { text: string; fx: Json[] };
  use: { types: string[]; label: string; text: string; fx: Json[] };
}
const hazard = (h: Hazard): Json[] => h.ids.map((id) => ({
  id,
  intro: h.intro,
  choices: [
    ch('Push on.', out(h.push.text, ...h.push.fx), h.push.chance !== undefined ? { chance: h.push.chance, fail: out(h.push.fail!.text, ...h.push.fail!.fx) } : {}),
    ...(h.wait ? [ch('Wait.', out(h.wait.text, ...h.wait.fx))] : []),
    ch(h.use.label, out(h.use.text, ...h.use.fx), { requires: [anyType(...h.use.types)] }),
  ],
}));

const HAZARDS: Hazard[] = [
  {
    ids: ['abandoned-power-plant', 'power-plant-fault'],
    intro: 'The Abandoned Power Plant. Sparks spit from a broken generator in the dark, and the air tastes of metal. A Voltorb rolls out from under a turbine, stops, and looks at you. Everything in here is humming.',
    push: { text: 'You hurry past the generator. A spark jumps the gap and catches your lead mid-stride; it shakes it off, but its legs are stiff for a while.', fx: [statusLead('paralysis')], chance: 0.5, fail: { text: 'You hurry past the generator, between sparks, and make it through untouched. The Voltorb watches you go.', fx: [] } },
    wait: { text: 'You sit and wait while the generator cools, tick by tick, until the sparks stop. It takes a long time. The Voltorb falls asleep against your boot.', fx: [takeNode()] },
    use: { types: ['ground', 'electric'], label: 'Use a Ground- or Electric-type.', text: 'Your Pokémon walks straight through the sparks. If it is a Ground-type they cannot touch it; if it is an Electric-type it drinks them down, and comes out the far side crackling, faster than it has ever been.', fx: [nextBattle('Charged up', 'spe', 1.5)] },
  },
  {
    ids: ['ancient-forest'],
    intro: 'The Ancient Forest. Trees so old and so huge their roots are hills. The light comes down green and slow. Time feels slower here, as if the forest is thinking about something and has been for a thousand years.',
    push: { text: 'You push on and the paths all look the same. By the time you find your way out, the light has moved a long way.', fx: [takeNode()] },
    wait: { text: 'You sit on a root and wait for the forest to show you the way. It does, eventually, in its own time.', fx: [takeNode(), heal(0.2)] },
    use: { types: ['grass', 'psychic'], label: 'Use a Grass- or Psychic-type.', text: 'Your Pokémon closes its eyes and listens, and then it knows: it leads you through the roots without one wrong turn, and when you are out, it looks back at the forest for a long time, and then at you.', fx: [bond(1, types('grass', 'psychic'))] },
  },
  {
    ids: ['blizzard-pass'],
    intro: 'Blizzard Pass. The road goes up into white and disappears. Snow to the knee, to the waist, wind like knives.',
    push: { text: 'You put your heads down and push through. Your Ice-types love it. Nobody else does.', fx: [hurtExcept(0.1, 'ice')] },
    wait: { text: 'You dig in behind a rock and wait for the blizzard to blow itself out. It does, by evening.', fx: [takeNode()] },
    use: { types: ['fire'], label: 'Use a Fire-type.', text: 'Your Fire-type walks ahead, and the snow hisses and melts in front of it, and you follow a black path of steaming stone all the way over the pass, warm as toast.', fx: [fr(3, types('fire'))] },
  },
  {
    ids: ['cherry-blossom'],
    intro: 'Cherry Blossoms. A road under trees so thick with pink petals that the air is pink. There is a festival on, lanterns in the branches, music. A kind place.',
    push: { text: 'You join the festival. You eat things on sticks. You sit under the trees with your team while petals land on everyone. It is a rest, and a good one.', fx: [heal(0.5)] },
    use: { types: ['grass', 'fairy'], label: 'Use a Grass- or Fairy-type.', text: 'Your Pokémon dances in the falling petals, and the festival stops to watch, and then everyone is dancing, and your whole team with them.', fx: [bond(1)] },
  },
  {
    ids: ['crystal-cave'],
    intro: 'The Crystal Cave. Glowing crystals in every wall, blue and violet. They hum, all of them, a low note that comes and goes.',
    push: { text: 'You push on through the glow and lose the way twice. You come out the far side much later than you meant to.', fx: [takeNode()] },
    use: { types: ['rock', 'psychic'], label: 'Use a Rock- or Psychic-type.', text: 'Your Pokémon follows the hum, turning left, then right, then down, to a chamber where it is loudest. In the middle, a clay that holds the light: a Light Clay.', fx: [item('light-clay')] },
  },
  {
    ids: ['desert-oasis'],
    intro: 'A Desert Oasis. Palm trees and a pool of clear water in the middle of the sand. A kind place.',
    push: { text: 'You drink. Everyone drinks. You lie in the shade until the heat goes out of you.', fx: [heal(0.25)] },
    use: { types: ['water'], label: 'Use a Water-type.', text: 'Your Water-type dives straight in and swims laps of the pool, delighted, splashing everyone. It comes out happier than you have seen it in days.', fx: [bond(1, types('water'))] },
  },
  {
    ids: ['foggy-moor'],
    intro: 'The Foggy Moor. Fog so thick you cannot see your own feet. Somewhere out there is a road. Somewhere out there is a bog.',
    push: { text: 'You push on and walk straight into a dead end, and then another. By the time you find the road, half the day is gone.', fx: [takeNode()] },
    wait: { text: 'You wait for the fog to lift. It lifts, slowly, by noon.', fx: [takeNode()] },
    use: { types: ['flying'], label: 'Use a Flying-type.', text: 'Your Flying-type beats its wings, once, twice, and the fog tears open in front of you like a curtain. The road is right there.', fx: [fr(2, types('flying'))] },
  },
  {
    ids: ['heatwave'],
    intro: 'A Heatwave. The sun burns. The road shimmers. Your team is panting before you have gone a hundred steps.',
    push: { text: 'You push on through the heat. It costs you: everyone is scorched and sore, and your lead takes a burn.', fx: [hurt(0.1), statusLead('burn')], chance: 0.5, fail: { text: 'You push on through the heat. It costs you, but nobody burns.', fx: [hurt(0.1)] } },
    wait: { text: 'You rest in the shade of a rock until evening, when the heat breaks.', fx: [takeNode(), heal(0.1)] },
    use: { types: ['water'], label: 'Use a Water-type.', text: 'Your Water-type mists the whole party as you walk, a fine cool spray, all the way to the next stop. Nobody so much as sweats.', fx: [fr(2, types('water'))] },
  },
  {
    ids: ['moonlit-path'],
    intro: 'A Moonlit Path. A full moon, and in a clearing by the road, Fairy Pokémon dancing in a ring, slow and silver. A kind place.',
    push: { text: 'You step into the ring. Nobody minds. You dance with them until the moon goes down, and your team does too.', fx: [bond(1)] },
    use: { types: ['fairy'], label: 'Use a Fairy-type.', text: 'Your Fairy-type joins the ring as if it had always been part of it. When the dance ends, the Clefairy at the centre gives it a stone that shines like the moon.', fx: [item('moon-stone')] },
  },
  {
    ids: ['rainbow-bridge'],
    intro: 'A Rainbow Bridge. A rainbow after rain, so bright and so close you could walk under it. A kind place.',
    push: { text: 'You walk under the rainbow. For a moment, in the colours, you see something enormous and golden flying very high, and then it is gone.', fx: [flag('sign-ho-oh'), moment('You walked under a rainbow and saw something golden flying in it.', 60)] },
    use: { types: ['flying'], label: 'Use a Flying-type.', text: 'Your Flying-type flies straight up through the rainbow and out the other side, every colour on its wings, and comes down to you shining.', fx: [bond(1, types('flying'))] },
  },
  {
    ids: ['sandstorm', 'r122-sandstorm-burrow'],
    intro: 'A Sandstorm. Sand across the route, stinging, blinding. Off the road, a burrow in a dune, big enough to crawl into.',
    push: { text: 'You push on with your eyes shut. The sand gets everywhere and into everyone, except the ones built for it.', fx: [hurtExcept(0.1, 'rock', 'ground', 'steel')] },
    wait: { text: 'You crawl into the burrow to wait it out. Something is in there already: a Sandile, who looks at you, decides you are fine, and goes back to sleep. When the storm ends it follows you out.', fx: [takeNode(), join({ species: ['sandile'] })] },
    use: { types: ['ground', 'rock'], label: 'Use a Ground- or Rock-type.', text: 'Your Pokémon leads, head down, sand sliding off it, and you walk in its shadow the whole way.', fx: [fr(2, types('ground', 'rock'))] },
  },
  {
    ids: ['volcano-rim'],
    intro: 'The Volcano Rim. A narrow path along the crater\'s edge. Far below, lava breathes in and out.',
    push: { text: 'You hurry along the rim. A gust of heat comes up from below and catches two of you.', fx: [status('burn')], chance: 0.5, fail: { text: 'You hurry along the rim, and the heat never quite reaches you.', fx: [] } },
    wait: { text: 'You wait for the crater to settle before you go on. It takes all afternoon.', fx: [takeNode()] },
    use: { types: ['fire', 'rock'], label: 'Use a Fire- or Rock-type.', text: 'Your Pokémon leads along the rim, completely at home, and you step where it steps.', fx: [fr(2, types('fire', 'rock'))] },
  },
  {
    ids: ['cave-in', 'world-cave-in'],
    intro: 'A Cave-In. Rubble seals a chamber off the path. Through a gap, something metallic glints.',
    push: { text: 'You dig at the rubble with your hands. A stone shifts and comes down on your lead. You get through, scraped, and the glint is a Metal Coat.', fx: [hurtLead(0.1), item('metal-coat')] },
    wait: { text: 'You go round the long way. You never find out what the glint was.', fx: [takeNode()] },
    use: { types: ['fighting', 'ground'], label: 'Use a Fighting- or Ground-type.', text: 'Your Pokémon clears the rubble in a few great heaves. The glint is a Metal Coat, lying on the floor as if someone set it down and meant to come back.', fx: [item('metal-coat')] },
  },
  {
    ids: ['frozen-lake', 'w4-winter-lake'],
    intro: 'A Frozen Lake. A shortcut straight across the ice. Out in the middle, something shines under the surface.',
    push: { text: 'You cross slowly, testing every step. The ice groans but holds the whole way. The shining thing stays sealed in it, out of reach.', fx: [], chance: 0.67, fail: { text: 'Halfway across, the ice cracks under someone with a sound like a gunshot, and everyone gets wet and cold scrambling to the far side.', fx: [hurt(0.1)] } },
    wait: { text: 'You go round the shore. It takes a long time, and the shining thing stays where it is.', fx: [takeNode()] },
    use: { types: ['ice'], label: 'Use an Ice-type.', text: 'Your Ice-type walks straight across, the ice thickening under its feet, and stops in the middle, and digs. The shine is a Never-Melt Ice.', fx: [item('never-melt-ice')] },
  },
  {
    ids: ['wx-floating-ice-floes'],
    intro: 'Ice Floes in a channel, rocking. On the far one, something shiny.',
    push: { text: 'You jump from floe to floe. You make it, mostly. Some of you get a dunking.', fx: [hurt(0.1), item('pearl')] },
    use: { types: ['water'], label: 'Use a Water-type.', text: 'Your Water-type ferries everyone across one by one, and brings back the shiny thing: a Pearl.', fx: [item('pearl'), fr(2, types('water'))] },
  },
  {
    ids: ['junkyard'],
    intro: 'A Junkyard. Scrap metal in piles taller than houses, rusting, leaning. Something useful is in there somewhere.',
    push: { text: 'You climb over the piles. One shifts. Everyone gets a scrape, and nobody finds anything worth having.', fx: [hurt(0.05)] },
    use: { types: ['steel'], label: 'Use a Steel-type.', text: 'Your Steel-type sorts the scrap like it was born to it, tossing aside rust, until it holds up something good: a held item, perfectly fine under the grime.', fx: [{ kind: 'itemFrom', ids: ['metal-coat', 'iron-ball', 'magnet', 'shed-shell', 'grip-claw', 'quick-claw'], count: 1 }] },
  },
  {
    ids: ['toxic-swamp'],
    intro: 'A Toxic Swamp. Purple bubbles rise and pop in the mud. The smell makes your eyes water.',
    push: { text: 'You wade through. The fumes get two of you.', fx: [status('poison')] },
    wait: { text: 'You wait for the wind to change and blow the fumes away. It takes a while.', fx: [takeNode()] },
    use: { types: ['poison', 'steel'], label: 'Use a Poison- or Steel-type.', text: 'Your Pokémon leads through, untroubled, and finds the one firm path across.', fx: [fr(2, types('poison', 'steel'))] },
  },
  {
    ids: ['w4-quicksand', 'wx-quicksand-flats'],
    intro: 'Quicksand. A hiker up to his chest in it, shouting, struggling, sinking deeper every time he moves. "Don\'t come near! It\'ll take you too!"',
    push: { text: 'You grab his hands and pull. The sand pulls back. Your lead gets dragged in to the knees before he comes free, both of you gasping. "Dale," he says, when he can talk. "I\'m Dale. I owe you."', fx: [hurtLead(0.1), flag('dale-saved'), ...kind()] },
    use: { types: ['ground', 'grass'], label: 'Use a Ground- or Grass-type.', text: 'Your Pokémon firms the sand, or throws him a vine, and he comes out with a sucking pop. He sits on the bank and shakes. "Dale," he says. "I\'m Dale. I owe you. I know these flats. If you\'re ever lost round here, I\'ll be your guide."', fx: [flag('dale-saved'), ...kind(), moment('You pulled a hiker named Dale out of quicksand.', 55)] },
  },
  {
    ids: ['w4-spring-flood'],
    intro: 'A Spring Flood. A meadow turned into a shallow lake overnight, flowers standing up through the water.',
    push: { text: 'You wade across, slow and heavy. Your legs ache for the rest of the day.', fx: [nextBattle('Waterlogged', 'spe', 0.67)] },
    wait: { text: 'You wait for the water to go down. It does, by evening, and the flowers are still there.', fx: [takeNode()] },
    use: { types: ['water'], label: 'Use a Water-type.', text: 'Your Water-type carries everyone across one by one, swimming between the flowers, and is plainly having the time of its life.', fx: [bond(1, types('water'))] },
  },
  {
    ids: ['wx-earthquake-tremor'],
    intro: 'An Earthquake Tremor. The ground rumbles under your feet, then rolls. Stones bounce down the hillside.',
    push: { text: 'You push on through the shaking. Rocks come down around you, and some of them hit. Somewhere deep under you, something is getting worse.', fx: [hurt(0.1), { kind: 'crisis', amount: 1 }] },
    wait: { text: 'You wait in the open until the ground is still.', fx: [takeNode()] },
    use: { types: ['ground', 'rock'], label: 'Use a Ground- or Rock-type.', text: 'Your Pokémon plants itself and the ground steadies around it, and you all walk through the tremor in its calm.', fx: [fr(2, types('ground', 'rock'))] },
  },
];

// ---------- SF128 Volunteer work ----------
interface Job { id: string; intro: string; donate: number; best: string[]; did: string; bestDid: string; extra?: Json[] }
const JOBS: Job[] = [
  { id: 'beach-cleanup', intro: 'A beach littered with bags and bottles, and Trubbish rummaging happily through all of it. A woman in rubber gloves holds out a sack. Coral, the organiser: "Every bag counts. Every single one."', donate: 200, best: ['water', 'poison'], did: 'You spend the day filling sacks. By sunset the beach is sand again.', bestDid: 'Your Pokémon works harder than anyone, and the Trubbish follow it all afternoon, and when you leave, one of them follows it home.', extra: [join({ species: ['trubbish'] })] },
  { id: 'charity-marathon', intro: 'A road lined with bunting and a runner in a paper number, stretching. Esme, the runner: "Every coin goes to the shelter! Run a bit with me?"', donate: 300, best: [], did: 'You run beside her the whole way, and your Pokémon with you. You are not fast. You finish.', bestDid: 'Your fastest Pokémon runs beside her, matching her stride for stride, and she finishes first, laughing, crying, both.' },
  { id: 'graveyard-tidy', intro: 'An overgrown graveyard behind a little chapel, the stones lost in brambles. Whispers in the long grass. The groundskeeper leans on his rake. "They like it neat," he says. "They told me."', donate: 150, best: ['ghost'], did: 'You clear the brambles, stone by stone, and read every name.', bestDid: 'Your Ghost-type drifts from stone to stone as you work, and the whispers follow it, softer and softer, until the last thing you hear is something very like "thank you."' },
  { id: 'neighbors-garden', intro: 'A garden gone wild, waist-high weeds, and a little old woman in a cardigan surveying it with despair. Mrs. Pike: "A Grass-type would make quick work of this. If anyone had one."', donate: 100, best: ['grass'], did: 'You pull weeds all afternoon. Mrs. Pike brings tea at the right moments.', bestDid: 'Your Grass-type has the whole garden sorted in an hour, and then plants her a row of something that will flower in spring. She cries a little, and gives it a biscuit.' },
  { id: 'orchard-harvest', intro: 'Harvest day in the orchard. Ladders against every tree, baskets everywhere. Brae waves you over from the top of a ladder: "Hands needed! Any hands!"', donate: 200, best: ['fighting', 'normal'], did: 'You pick until your arms ache and your basket is the fullest on the row.', bestDid: 'Your Pokémon with good strong arms picks two baskets for every one of yours, and Brae calls it the best picker she has ever had.' },
  { id: 'soup-kitchen', intro: 'A soup kitchen in a church hall. A pot steaming on a stove, a queue at the door, and nobody to serve. Barnaby, the cook: "It\'s beans. It\'s always beans. Can you help?"', donate: 150, best: ['fire'], did: 'You ladle beans for three hours. You learn everyone\'s name.', bestDid: 'Your Fire-type keeps the pot hot all evening, and the children in the queue sit as close to it as they can get, warming their hands.' },
  { id: 'volunteer-cleanup', intro: 'A river with an oily sheen on it, rubbish caught in the reeds. Volunteers in waders, working in a line. "Grab a net," someone calls. "We could use you."', donate: 200, best: ['water'], did: 'You work the reeds with them all day, pulling out tyres and trolleys and worse.', bestDid: 'Your Water-type dives for the things nobody can reach, and comes up with something every time, and the volunteers cheer it each time.' },
  { id: 'zoo-keeper-aid', intro: 'A little zoo of rescued Pokémon, each with a sign: where it was found, what it is afraid of. Hettie, the keeper: "Spend an afternoon with them? They need people who\'ll be gentle."', donate: 200, best: [], did: 'You sit in the enclosures for hours, being gentle.', bestDid: 'The rescued Pokémon warm to your Pokémon first, and then, slowly, to you. One of them, who has not let anyone touch it in a year, puts its head in your lap.' },
];
const job = (j: Job): Json => ({
  id: j.id,
  intro: j.intro,
  choices: [
    { ...ch('Volunteer (a node; choose a Pokémon).', out(`${j.did} The town will remember. The one who helped will remember more.`, takeNode(), bond(2, 'picked'), rep(1), ...kind()), { pick: {} }),
      branches: j.best.length ? [{ when: [{ kind: 'picked', types: j.best }], text: `${j.bestDid} The town will remember.`, effects: [takeNode(), bond(2, 'picked'), rep(1), ...kind(), ...(j.extra ?? [])] }] : [] },
    ch(`Donate instead (${j.donate}).`, out('You give what you can. It goes in a tin, and someone writes your name in a book.', $(-j.donate), rep(1)), { requires: [money(j.donate)] }),
    ch('Not today.', out('Not today. They wave you off anyway.')),
  ],
});

export const EVENTS: Json[] = [...HAZARDS.flatMap(hazard), ...JOBS.map(job)];
export const REMOVE: string[] = [];
