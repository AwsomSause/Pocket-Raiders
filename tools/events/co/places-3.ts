// Catalog Overhaul Pack, category "places": the Delves, part 3 (STORY_FAMILIES_14.md, D-9 to D-12).
import { RARE_HELD, TREASURE, any, ch, egg, ev, flag, flagIs, fr, has, heal, hurt, item, join, lose, out, ptype, rp, status, takeNode, type Json } from '../dsl.ts';
import { delve, moment, mtype, no, species, variant, type Next } from './_delve.ts';

export const CATEGORY = 'places';

// ---------- D-9. The Frozen Cavern (resident: the Ice Sculptor, a Beartic that carves every Pokémon it has seen) ----------
const ice = delve({
  slug: 'frozen-cavern', name: 'The Frozen Cavern', rooms: 'abcdefgh', types: ['ice'], tint: '#2c4860', minStage: 3,
  mons: { a: 'snover', d: 'darumaka-galar', e: 'sneasel', f: 'mamoswine', g: 'beartic' },
  gate: {
    intro: 'A crack in the glacier breathes cold, blue light. From deep inside comes a small, steady sound: tick, tick, tick. Something in there is working ice with a tool.',
    enter: 'Walk into the blue.', enterText: 'The ice closes overhead. On the wall beside the entrance, at knee height, someone has carved a perfect little Rattata. It is looking at you.',
    pass: 'Stay out of the cold.', passText: 'You pull your collar up and go round the glacier. The ticking goes on behind you, patient, a hundred carvings from finished.',
  },
});
const ICE: Json[] = [
  ice.room('a', 'Blue light comes down through ice as thick as a house. A Snover shuffles out of a drift, shakes snow off its head like a dog, and holds one mitten out to you.', (n) => [
    ch('Battle.', n.wild('It takes back the mitten and puts up both.', { species: ['snover'], win: [rp(1)] })),
    ch('Shake its hand.', n.to('Its mitten is cold and very solemn. It shakes twice, as it has seen people do, then presses a perfectly round Snowball into your palm: a gift, packed with great care.', item('snowball'), fr(2))),
    ch('Walk past.', n.to('You nod and walk past. It keeps its mitten out a moment longer, then tucks it away.')),
    n.back,
  ]),
  ice.room('b', 'The tunnel crosses a frozen pool. The ice is thin and grey in the middle, scuffed at the edge where others stood, thought about it, and turned back.', (n) => [
    ch('Slide across.', n.to('You push off and glide across in one breath, arms out, the ice singing under you. You arrive laughing.'), { check: 'speed', fail: n.to('Halfway over, the ice goes off like a gunshot. Everyone scrambles out the far side, soaked to the waist and shaking.', hurt(0.1)) }),
    ch('Send an Ice-type.', n.to('Your Ice-type walks out, breathes on the grey ice until it goes white and hard, and beckons you over a floor it made itself.', fr(2)), { requires: [ptype('ice')] }),
    ch('Go round. (a node)', n.to('You take the long gallery round the pool, an hour of squeezing sideways through blue cracks. Slow, cold, and perfectly safe.', takeNode())),
    n.back,
  ]),
  ice.room('c', 'A dry corner out of the wind. All around it the walls are carved: a Pikachu mid-leap, a Snorlax asleep, a Lapras with every shell-stud in place. They are extraordinarily good. They are all at eye level for something tall.', (n) => [
    ch('Rest.', n.to('You sleep among the carvings. It is like sleeping in a crowd of friends holding very still.', heal(0.5))),
    ch('Look at the carvings.', n.stay('You walk the wall slowly. Near the end the ice is fresh, the chips still on the floor. It is your starter. Not the species: yours, with the look it gets before a battle. Something watched you come in, and carved it while you walked.', flag(n.f('looked')), fr(3, 'starter'))),
    ch('Add a carving.', n.stay('You scratch away with a tent peg for an hour. It is not good. It is recognisably a Pokémon, if you are kind. You leave it at the end of the wall, next to the masterpieces, for whoever made them to find.', flag(n.f('carved')))),
    n.back,
  ], (n) => [
    variant('both', [flagIs(n.f('looked')), flagIs(n.f('carved'))], { notice: 'Your own crooked carving stands at the end of the wall, beside your starter\'s.', hide: [1, 2] }),
    variant('looked', [flagIs(n.f('looked'))], { notice: 'Your starter looks back at you from the ice.', hide: [1] }),
    variant('carved', [flagIs(n.f('carved'))], { notice: 'Your own crooked carving stands at the end of the wall.', hide: [2] }),
  ]),
  ice.room('d', 'An unusual cry echoes down the tunnel. Whatever it is, it does not belong here: a Darumaka, but white as the walls, with a snowball for a nose, from another region entirely. It is shivering. It is delighted.', (n) => [
    ch('Catch it.', n.to('It rolls into the ball like a snowball downhill, giggling.', join({ species: ['darumaka-galar'] }), flag('farhome-kept'))),
    ch('Ask how it got here.', n.stay('It acts it out for you. Walking. Walking. A lot of walking. Snow, more snow, a boat perhaps, then this place, colder than anywhere, and it throws its arms up: perfect. It walked in over a winter and liked it. It is a very long way from home.', flag(n.f('asked')))),
    ch('Leave it.', n.to('You leave it rolling happily in a drift, the only one of its kind for a thousand miles, and not minding at all.')),
    n.back,
  ], (n) => [
    variant('asked', [flagIs(n.f('asked'))], {
      intro: 'The white Darumaka sits in the snow watching you, head on one side. It came a very long way. What happens to the one far from home?', hide: [0, 1, 2],
      add: [
        ch('Escort it to the pass. (two nodes)', n.wild('You walk it out through the high tunnels toward the pass that leads home. Something has been following the smell of a small, lost thing. It steps out of the dark ahead of you.', { species: ['weavile'], lv: 3, win: [flag('farhome-escorted'), flag(n.f('escorted')), item('galarica-cuff'), fr(3), moment('You walked a Galarian Darumaka to the pass that leads home.', 55)] }, takeNode(2))),
        ch('Keep it.', n.to('It comes with you gladly. But that night, and for many nights, it sits facing the direction it came from, quiet, before it sleeps.', join({ species: ['darumaka-galar'] }), flag('farhome-kept'))),
        ch('Let it decide.', n.to('You sit down and wait. It looks at you. It looks at the perfect cold. It pats your boot, kindly, as you would pat someone who cannot help not being a glacier, and rolls back into its drift. It has decided.', flag('farhome-herd'), fr(1))),
      ],
    }),
  ]),
  ice.room('e', 'A pack of Sneasel comes skittering down the tunnel toward you with their arms full of small bright tools: ice chisels, a dozen of them, stolen. Behind them, far off, a deep unhappy roar.', (n) => [
    ch('Battle.', n.wild('They drop into a ring around you, chisels clutched tight.', { species: ['sneasel'], chain: 2, win: [rp(1)] })),
    ch('Get the chisels back.', n.to('You go after them over the ice, cut them off at a bend, and they scatter in a clatter of dropped steel. A dozen fine chisels, each handle worn by a huge paw. Whoever owns these will want them.', flag(n.f('chisels')), rp(1)), { prompt: { id: 'hurdle-rhythm', needs: 'ok' }, fail: n.wild('You slip at the bend and they turn on you, laughing. You will have to take the chisels the hard way.', { species: ['sneasel'], chain: 2, win: [flag(n.f('chisels')), rp(1)] }) }),
    ch('Let them go.', n.to('You flatten against the wall and they pour past, cackling. The roar behind them sounds less angry than heartbroken.')),
    n.back,
  ]),
  ice.room('f', 'Claw marks and nests line the walls. This is somebody\'s home. An Alpha Mamoswine fills the cave, frost thick on its tusks, eyes red. Tucked against its side, half under the fur: a calf, small, shivering, too cold even for here.', (n) => [
    ch('Calm it with a Never-Melt Ice.', n.to('You set the Never-Melt Ice on the floor between you. The Mamoswine snuffs it, crunches it, and lets out a long breath that fogs the whole cave. The red fades. It turns its great head back to the calf, and lets you by.', lose('nevermeltice'), flag(n.f('den-calmed')), flag('calmed-alpha'), rp(3)), { requires: [has('nevermeltice')] }),
    ch('Battle.', n.wild('It puts itself between you and the calf, and charges.', { species: ['mamoswine'], lv: 3, win: [rp(2)] })),
    ch('Leave the calf something warm.', n.to('Your Fire-type walks forward slowly, sits down by the calf, and simply glows. The shivering stops. The calf sighs and burrows against the warmth. The Mamoswine watches for a long time. Then it lies down, all at once, like a hill settling.', flag(n.f('den-calmed')), flag('calmed-alpha'), rp(3), fr(5, { types: ['fire'] })), { requires: [ptype('fire')] }),
    n.back,
  ]),
  ice.room('g', 'The deepest room: a hall of ice, and the Beartic, carving. The whole wall is Pokémon, a hundred of them, every one it has ever seen. In the middle one figure stands half finished, rough-cut: not a Pokémon. A trainer.', (n) => [
    ch('Pose for it.', n.to('You stand still. The Beartic looks at you, looks at the ice, and works. Chips fly for an hour. When it steps back, the trainer in the wall has your coat, your stance, your face. In a hundred carvings of Pokémon it left one space for a person, and waited to see who would come.', flag(n.f('done-pose')), flag(n.f('resident-posed')), moment('The Ice Sculptor carved you into its wall.', 65))),
    ch('Battle.', n.wild('It drops the chisel and rises on its hind legs in front of the wall. Not one carving will be touched.', { species: ['beartic'], lv: 5, win: [flag(n.f('resident-fought')), rp(4)] })),
    ch('Give it the chisels.', n.to('You hold out the stolen chisels. The Beartic counts them with one claw, twice. Then it bows, very low. It breaks a block from the wall and carves, fast and sure, and puts the result in your hands: your starter, small enough to carry, every line right.', flag(n.f('resident-chisels')), item('ice-carving'), fr(5, 'starter'), moment('The Ice Sculptor gave you a carving of your starter.', 65)), { requires: [flagIs(n.f('chisels'))] }),
    n.back,
  ]),
  ice.room('h', 'Daylight, white and blinding after so much blue.', (n) => [
    ch('Look back at the wall.', n.to('You turn. Sun strikes down through the glacier, and for one moment the whole carved wall lights from inside. Every Pokémon you have ever met is there, glowing. You had not counted how many. The Sculptor had.', flag(n.f('done')), rp(3), fr(3), moment('You saw the whole wall of the Frozen Cavern lit by the sun.', 55))),
    ch('Walk on.', n.to('You walk out into the snow without looking back. Behind you, faintly: tick, tick, tick.', flag(n.f('done')))),
  ], (n) => [
    variant('posed', [flagIs(n.f('resident-posed'))], { notice: 'Somewhere back in the blue, you are part of the wall now, standing among a hundred friends.' }),
    variant('chisels', [flagIs(n.f('resident-chisels'))], { notice: 'The little ice starter in your pack has not melted. You suspect it never will.' }),
    variant('fought', [flagIs(n.f('resident-fought'))], { notice: 'The ticking has stopped. You fought the Sculptor in front of its own wall, and the cavern is very quiet.' }),
  ]),
];

// ---------- D-10. The Volcanic Core (resident: the Keeper of the Embers, an old Torkoal) ----------
const core = delve({
  slug: 'volcanic-core', name: 'The Volcanic Core', rooms: 'abcdefghi', types: ['fire', 'rock'], tint: '#4a231c', minStage: 4,
  mons: { a: 'slugma', d: 'houndoom', f: 'magmar', g: 'charmander', h: 'magcargo', i: 'torkoal' },
  gate: {
    intro: 'A vent in the mountainside glows dull red, and the rock is warm under your hand. The town at the volcano\'s foot says the oldest fire in the country burns in there, older than the town, and that something tends it.',
    enter: 'Go into the heat.', enterText: 'The warmth wraps round you like a held breath. Far below, slow as a heartbeat, something puffs smoke.',
    pass: 'Keep your distance.', passText: 'You skirt the mountain. A thin, steady thread of smoke rises from its top, the same as every day for a thousand years.',
  },
});
const CORE: Json[] = [
  core.room('a', 'Warm rock, getting warmer. A Slugma slides across the path, leaving a glowing trail, and stops to stare at you with huge yellow eyes, as if it has never seen anything so cold.', (n) => [
    ch('Battle.', n.wild('It puffs itself up, dripping fire.', { species: ['slugma'], win: [rp(1)] })),
    ch('Step over it.', n.to('You step over. It watches your boot go by with deep interest.')),
    ch('Follow it.', n.to('It slides on and you follow its cooling trail. It keeps to the black rock, the old rock, away from every red seam. It has lived here always. It knows where the mountain is asleep.', flag(n.f('cool-path')), rp(1))),
    n.back,
  ]),
  core.room('b', 'The floor\'s wrong: a black crust, thin as pie, over something that glows through the cracks. There are scuff marks where others turned back, and one boot print that goes on, and stops.', (n) => [
    ch('Test it.', n.to('You throw stones ahead. Where one sinks hissing, you do not step. It takes patience and every stone in reach.')),
    ch('Send a Fire-type.', n.to('Your Fire-type strolls out across the crust as if over a lawn, finds the thick places by feel, and scorches a marked path for the rest of you.', fr(2)), { requires: [ptype('fire')] }),
    ch('Run.', n.to('You sprint. The crust dips and cracks behind every footfall, and you make the far side with your soles smoking and nothing worse.'), { chance: 0.5, fail: n.to('You sprint. The crust breaks under your lead\'s last stride, and it comes out the far side scorched and wincing.', { kind: 'status', status: 'burn', who: 'lead' }) }),
    n.back,
  ], (n) => [
    variant('cool', [flagIs(n.f('cool-path'))], { notice: 'The Slugma you followed slides out ahead of you and crosses on a line of old black rock, without a pause.', hide: [2], add: [ch('Cross where the Slugma crossed.', n.to('You put your feet exactly where it went. The crust on either side glows and ticks. Under you it is cold, solid, a thousand years asleep. The Slugma waits to see you over, then slides away.'))] }),
  ]),
  core.room('c', 'A battered chest: a geologist\'s instrument case, lid warped by heat. A note is tucked under the strap in a hurried hand: "If found, the readings say it\'s waking. Tell the town."', (n) => [
    ch('Take the readings.', n.to('Pages of careful numbers, climbing. You do not need to understand them to see the shape. You fold them inside your coat, next to your chest, to carry down to people who will.', flag(n.f('readings')), { kind: 'crisis', amount: -1 }, rp(2))),
    ch('Take the case.', n.to('Under the instruments, packed in asbestos cloth: a lump of Charcoal and a Fire Stone, samples from the deep.', item('charcoal'), item('fire-stone'))),
    ch('Both.', n.to('You take the samples and the pages. The pages weigh nothing, and feel like the heavier of the two.', flag(n.f('readings')), { kind: 'crisis', amount: -1 }, rp(2), item('charcoal'), item('fire-stone'))),
    n.back,
  ]),
  core.room('d', 'Claw marks and nests line the walls. This is somebody\'s home. A Houndoom pack rises from the warm rock as one, and at their head an Alpha, red-eyed, horns like a crown. Behind them, in a hollow: pups, a heap of them, asleep.', (n) => [
    ch('Calm it with a Rawst Berry.', n.to('You toss the Rawst Berry. The Alpha catches it out of the air, and the bitterness seems to clear its head. It looks at you properly for the first time: small, not a threat, already leaving. It sits. The pack sits.', lose('rawst-berry'), flag(n.f('den-calmed')), flag('calmed-alpha'), rp(3)), { requires: [has('rawst-berry')] }),
    ch('Battle.', n.wild('The Alpha does not wait for the pack.', { species: ['houndoom'], lv: 3, win: [rp(2)] })),
    ch('Back away from the pups.', n.to('You show your hands and walk backwards, away from the hollow, keeping the whole width of the cave between you and the pups. The Alpha paces you every step. At the far tunnel it stops, and lets you go.', flag(n.f('backed-away')), rp(1))),
    n.back,
  ], (n) => [
    variant('known', [flagIs(n.f('backed-away')), no(n.f('den-calmed'))], { notice: 'The Alpha knows your smell: the one who backed away from the pups. It does not rise this time.', hide: [0], add: [ch('Calm it. (it remembers you)', n.to('You sit down where you are and wait. The Alpha walks over, slow, and sniffs your open hands. Then it turns its back on you, which from a Houndoom is everything, and lies down across the mouth of the hollow.', flag(n.f('den-calmed')), flag('calmed-alpha'), rp(3)))] }),
  ]),
  core.room('e', 'A dry, warm corner. A hot spring bubbles in a basin of smooth stone, steam curling off it, the water milky blue.', (n) => [
    ch('Rest.', n.to('You sleep beside the spring with the warmth soaking into your back.', heal(0.5))),
    ch('Bathe the team.', n.to('Everyone gets in. There is splashing. There is a great deal of sighing. Your Fire-types sink to their noses and close their eyes, home at last.', heal(1), fr(5, { types: ['fire'] }))),
    ch('Move on.', n.to('You dip a hand in, shake it dry, and go on. The spring bubbles on without you.')),
    n.back,
  ]),
  core.room('f', 'A lava pool, and a Magmar in it up to the chest, eyes shut, bathing. It has not seen you. It is humming.', (n) => [
    ch('Battle.', n.wild('It opens one eye, furious at the interruption.', { species: ['magmar'], lv: 1, win: [rp(1)] })),
    ch('Wait.', n.to('You wait. It hums the whole tune, twice. Then it climbs out, shakes off a spray of sparks, gives you a civil nod, and strolls away down a side tunnel.')),
    ch('Leave it be.', n.to('You edge round the pool on the far side. The humming never falters.')),
    n.back,
  ]),
  core.room('g', 'An unusual cry, thin and far off. Ahead, where the heat-haze is thickest, something stands: Charmander-shaped, but you can see the rock through it. A shadow with a flame where a tail should be.', (n) => [
    ch('Follow it.', n.to('It walks ahead of you, never nearer, never further, to a wall of old soot. There it turns, looks back once, and steps through the stone. Where it stood the rock is cold. You write down everything.', flag('delta-clue-d2'), rp(3))),
    ch('Call to it.', n.to('You call. It turns its head. For a moment you are looked at by something that is mostly not here. Then the haze shifts, and there is only heat.', rp(1))),
    ch('Leave it.', n.to('You let it be. Some things come to an old fire to be alone.')),
    n.back,
  ], () => [
    variant('d2-done', [flagIs('delta-d2-done')], { intro: 'An unusual cry, thin and far off. Ahead in the heat-haze stands a shape you know now: the Ghost Dragon of the Burnt Valley, the Delta Charizard, grown and translucent, come back to sit by the oldest fire.', notice: 'It knows you. It dips its head, the way it did in the valley.' }),
  ]),
  core.room('h', 'The deepest room. An Alpha Magcargo, enormous, lies coiled round a pit where the oldest fire in the country burns low and gold. Behind it, slow and grey with age, an old Torkoal puffs a thin thread of smoke and watches you.', (n) => [
    ch('Calm it: feed the fire.', n.to('Your Pokémon turns from the Magcargo and breathes fire into the pit, carefully, like someone laying a log on a hearth. The old flame leaps and steadies. The Magcargo watches it burn. Its shell stops glowing white, and it settles round the fire again, content.', flag(n.f('resident-calmed')), flag('calmed-alpha'), rp(4), fr(5, { types: ['fire'] })), { requires: [mtype('fire')] }),
    ch('Battle.', n.wild('It rears up out of its shell, a wall of fire between you and the pit.', { species: ['magcargo'], lv: 5, win: [flag(n.f('resident-fought')), rp(4)] })),
    ch('Ask the Torkoal.', n.to('You bow to the old Torkoal. It considers you through its own smoke. Then it puffs twice, short. The Magcargo lowers itself and makes room. They are partners. One keeps the fire, one guards the keeper, and they have done it since before there was a town.', flag(n.f('resident-asked')), rp(3), moment('The Keeper of the Embers let you stand beside the oldest fire.', 55))),
    n.back,
  ]),
  core.room('i', 'Daylight at the crater rim. Far below, the town is lighting its lamps for evening, each one a spark that began, long ago, up here.', (n) => [
    ch('Take an ember for the town.', n.to('The Torkoal lets you lift one ember from the old fire in a clay pot. You carry it down the mountain shielded in both hands. That night the town\'s dark shrine is lit again from the first flame, and the elders begin, at once, to argue about a festival.', flag(n.f('done')), flag(n.f('resident-ember')), flag('ember-festival'), moment('You carried an ember of the oldest fire down to the town\'s shrine.', 65))),
    ch('Leave the fire where it is.', n.to('You take nothing. You stand at the rim while the smoke goes up straight into a windless sky, and something vast and warm, far away, turns its attention toward a traveller who left a fire alone.', flag(n.f('done')), flag(n.f('resident-left')), flag('sign-fire'), rp(2))),
    ch('Thank the Torkoal.', n.to('The old Torkoal has climbed to the rim behind you; it must have taken it an hour. It nudges two things toward you with its nose: a Heat Rock, and an egg, warm as fresh bread.', flag(n.f('done')), flag(n.f('resident-thanked')), item('heat-rock'), egg({ species: ['torkoal'] }))),
  ], (n) => [
    variant('fought', [flagIs(n.f('resident-fought'))], { notice: 'Below, the old fire burns unguarded tonight. The Torkoal has not followed you up.', hide: [2] }),
    variant('readings', [flagIs(n.f('readings'))], { notice: 'The geologist\'s pages are still inside your coat. The town down there should read them.' }),
  ]),
];
// The festival the ember starts, on a later stage.
const FESTIVAL = ev('delve-ember-festival', 'The Ember Festival', 'Dungeons', { stop: 'event', rarity: 'uncommon', types: ['fire'], callback: true, requires: [flagIs('ember-festival'), no('ember-festival-held')], tint: '#4a231c' },
  'Word has travelled faster than you. The next town along has heard of the shrine relit from the oldest fire, and has lit its own from it, lamp to lamp, down the whole valley. Tonight there is a festival, and they have saved you a place by the fire.', [
    ch('Sit by the fire.', out('They feed you until you cannot move, and the children take turns guarding the flame with great seriousness. Your team sleeps in a heap in the warmth.', heal(1), fr(3), flag('ember-festival-held'))),
    ch('Carry the flame on.', out('You light a lantern from their fire and carry it to the edge of town, where the next village\'s runner is waiting to take it further. The flame you carried down a mountain is still travelling.', flag('ember-festival-held'), flag('rep'), rp(2))),
  ]);
(FESTIVAL as { tags?: string[] }).tags = ['Story', 'Recovery'];

// ---------- D-11. The Deep Ocean (a dive Delve with Breath; resident: the Lantern Fish, an old Lanturn) ----------
// Breath (SF37 rules): 4, or 6 with a Water-type. Going one room deeper costs 1; at 0 the only way is up. The air pocket (room e) refills it.
const B = 'delve-deep-ocean-breath';
const air = (need = 1): Json => flagIs(B, need);
const ocean = delve({
  slug: 'deep-ocean', name: 'The Deep Ocean', rooms: 'abcdefghi', types: ['water', 'dark'], tint: '#12263a', minStage: 4,
  mons: { a: 'mantyke', d: 'wailmer', f: 'lanturn', h: 'gyarados', i: 'lanturn' },
  back: { label: 'Surface.', text: 'You turn for the light and kick upward, keeping everything you carry. The deep will wait.' },
  gate: {
    intro: 'Open sea, and under the boat the water goes from blue to black. Divers say there is a light down there that has shown them the way home since the first of them went down. Four breaths of air; a Water-type helps.',
    enter: 'Dive.', enterText: 'You fill your lungs and go over the side. Breath: 4. The light from above narrows to a column, and you follow it down.',
    pass: 'Stay in the boat.', passText: 'You row on. Deep under the keel, a small light turns, waits a while, and sinks away.',
  },
});
(ocean.gate as { choices: Json[] }).choices[0] = ch('Dive.', out('You fill your lungs and go over the side. Breath: 4. The light from above narrows to a column, and you follow it down.', flag(B, -99), flag(B, 4), { kind: 'addEvent', eventId: 'dg-deep-ocean-a' }), { requires: [{ kind: 'partyType', type: 'water', absent: true }] });
(ocean.gate as { choices: Json[] }).choices.splice(1, 0, ch('Dive, your Water-type leading.', out('Your Water-type takes the lead and you hold on. It finds the easy currents; the sea carries you instead of fighting you. Breath: 6.', flag(B, -99), flag(B, 6), { kind: 'addEvent', eventId: 'dg-deep-ocean-a' }), { requires: [ptype('water')] }));
/** Going deeper: needs air, costs one breath (plus `extra`). */
const deeper = (n: Next, label: string, text: string, fx: Json[] = [], o: { extra?: number; requires?: Json[] } = {}): Json => ch(label, n.to(text, flag(B, -1 - (o.extra ?? 0)), ...fx), { requires: [air(1 + (o.extra ?? 0)), ...(o.requires ?? [])] });
const deeperFight = (n: Next, label: string, text: string, sp: string, lv: number, win: Json[] = [], requires: Json[] = []): Json => ch(label, n.wild(text, { species: [sp], lv, win: [flag(B, -1), ...win] }), { requires: [air(), ...requires] });
const BREATH = ' Breath left: {flag:delve-deep-ocean-breath}.';
const OCEAN: Json[] = [
  ocean.room('a', 'The water darkens long before the bottom. A Mantyke glides up out of the blue and circles you, once, twice, close enough to touch, curious about the clumsy thing with two legs.' + BREATH, (n) => [
    deeperFight(n, 'Battle.', 'It banks and comes at you, playing rough.', 'mantyke', 0, [rp(1)]),
    deeper(n, 'Swim with it.', 'You match its turns. It shows you something divers take years to learn: a cold current that sinks like a lift, no kicking needed. You ride it down side by side, and arrive with air to spare.', [flag(B, 1), fr(2)]),
    deeper(n, 'Keep going.', 'You kick on down. The Mantyke follows a little way, then peels off toward the light.'),
    n.back,
  ]),
  ocean.room('b', 'Something that doesn\'t belong. A faint light pulses ahead, and it is not a fish. It is a crack, hanging in the water itself, as if the sea were glass. Through it: a different dark, with different stars.' + BREATH, (n) => [
    deeper(n, 'Back away.', 'You back off slowly and give it the whole width of the water. Whatever is on the other side does not notice you. You were never here.'),
    deeper(n, 'Look in.', 'You swim to the edge and look through. Something vast looks back, without eyes, and knows your shape now. You tear yourself away with your ears ringing. The world on this side feels thinner than it did.', [flag('faller-rank'), rp(2)]),
    deeper(n, 'Mark it.', 'You tie a diver\'s buoy line to the rock beside it, the red kind that means: danger, tell a Ranger. Someone will follow that line down, and close this.', [flag('tear-marked'), rp(1)]),
    n.back,
  ]),
  ocean.room('c', 'The seabed\'s wrong: soft grey silt, scuffed where other divers turned back, dimpled in the middle like a throat. A sinkhole, breathing in.' + BREATH, (n) => [
    deeper(n, 'Swim over. (1 extra breath)', 'You swim hard and high over the dimple. The pull catches your ankles anyway, and you fight it stroke by stroke. You get across. It costs air you wanted.', [], { extra: 1 }),
    deeper(n, 'Send a Water-type down first.', 'Your Water-type noses along the bottom, finds where the silt is firm, and leads you over on a line a fish would take. You never feel the pull at all.', [fr(2)], { requires: [ptype('water')] }),
    deeper(n, 'Go round. (a node)', 'You follow the reef the long way round the sinkhole, slow and safe along the rock. It takes far longer than you meant to spend down here.', [takeNode()]),
    n.back,
  ]),
  ocean.room('d', 'An unusual cry, high and frightened. A baby Wailmer, alone, far too deep, turning in circles in the dark. Its pod is singing somewhere above, and it cannot tell which way above is.' + BREATH, (n) => [
    deeper(n, 'Guide it up. (1 extra breath)', 'You put a hand on its side and swim up with it, up, toward the singing, until it hears the direction for itself and shoots away. Above, the song changes: one voice more. You sink back down, lungs burning, glad.', [flag('wailmer-guided'), fr(3), moment('You guided a lost baby Wailmer back up to its pod.', 55)], { extra: 1 }),
    deeper(n, 'Catch it.', 'It comes to the ball as to the first warm thing it has met down here.', [join({ species: ['wailmer'] })]),
    deeper(n, 'Leave it.', 'You swim on down. Behind you the small voice goes on calling, and the big voices go on answering, and neither can find the other.'),
    n.back,
  ]),
  ocean.room('e', 'A dry corner, of all things: an air pocket trapped under the hull of a sunken ship. You come up into it gasping. The air is stale and a hundred years old, and it is the best you have ever breathed.' + BREATH, (n) => [
    ch('Rest and breathe.', n.stay('You hang on a beam and breathe until your heart slows. The team does the same. When you are ready, your lungs are full again.', flag(B, -99), flag(B, 4), heal(0.5), flag(n.f('rested')))),
    ch('Search the hull.', n.stay('You feel along the ribs of the ship. In a rotted locker, under a captain\'s cap: a Big Pearl, grown fat in the dark.', item('big-pearl'), flag(n.f('searched')))),
    deeper(n, 'Move on.', 'You take one last breath of old air and duck back under, into the dark.'),
    n.back,
  ], (n) => [
    variant('both', [flagIs(n.f('rested')), flagIs(n.f('searched'))], { notice: 'The pocket of old air waits, a little smaller for your breathing.', hide: [0, 1] }),
    variant('rested', [flagIs(n.f('rested'))], { notice: 'Your lungs are full again.', hide: [0] }),
    variant('searched', [flagIs(n.f('searched'))], { notice: 'The captain\'s locker hangs open.', hide: [1] }),
  ]),
  ocean.room('f', 'A light ahead in the black: soft, gold, steady. An old Lanturn. And round it, in tightening rings, the grey shape of a Sharpedo.' + BREATH, (n) => [
    deeperFight(n, 'Drive off the Sharpedo.', 'You put yourself between the teeth and the light.', 'sharpedo', 2, [flag('delve-deep-ocean-lanturn'), rp(2), fr(2)]),
    deeper(n, 'Follow the light.', 'The Lanturn slips the Sharpedo with an old diver\'s trick, down through a gap in the reef, and you go after its glow. It lights your way a while. Then it is gone ahead, about its rounds.'),
    deeper(n, 'Hide.', 'You press into the weed until the grey shape loses interest and slides off. When you look again, the light has gone too.'),
    n.back,
  ]),
  ocean.room('g', 'A sealed chamber in the living reef, its lock cold and old: a carving of a Relicanth, every scale cut by hand, with a hollow where the real thing would rest.' + BREATH, (n) => [
    deeper(n, 'Bring a Relicanth.', 'Your Relicanth swims to the carving and settles into the hollow as if returning to a chair. The reef grinds open. Inside, something kept for whoever the old fish trusted; and far below, for a moment, the whole sea seems to turn over in its sleep.', [any(...RARE_HELD), flag('sign-kyogre'), rp(3)], { requires: [species('relicanth')] }),
    deeper(n, 'Force it.', 'You heave at coral that was old when the ship above was built. You bruise your hands, and do not so much as stir the silt.'),
    deeper(n, 'Leave it.', 'You leave the stone fish waiting for a real one.'),
    n.back,
  ]),
  ocean.room('h', 'The deepest room. An Alpha Gyarados lies in the dark, curled three times round a wreck, eyes like red lamps. Every diver who came for that ship came back up without it, or did not come back up.' + BREATH, (n) => [
    ch('Calm it with the Lanturn\'s light.', n.to('The old Lanturn swims past you, straight to the great head, and hangs there glowing, small and gold and unafraid. The red eyes follow the light. Slow. Slower. They close. The Gyarados sleeps, as it has not slept in years. You lift the wreck\'s chest out from under one coil, and it does not stir.', flag(n.f('resident-calmed')), flag('calmed-alpha'), any(...TREASURE), item('nugget'), rp(4)), { requires: [flagIs('delve-deep-ocean-lanturn')] }),
    ch('Battle.', n.wild('It uncoils, and the whole wreck groans.', { species: ['gyarados'], lv: 5, win: [flag(n.f('resident-fought')), any(...TREASURE), rp(4)] }), { requires: [air()] }),
    ch('Surface. (leave the wreck)', n.to('You look at the red eyes, and the red eyes look at you, and you go up. There is no shame in it. Everyone who is still alive made the same choice.')),
    n.back,
  ], () => [
    variant('a2', [flagIs('alpha-gyarados-met')], { notice: 'You know that scarred jaw, or its father\'s. You have met this fury before, at the lake.' }),
  ]),
  ocean.room('i', 'The surface. Daylight, and air, endless air. The old Lanturn bobs up beside the boat, its light pale in the sun, and looks at you with one round eye.', (n) => [
    ch('Thank it.', n.to('You thank it, out loud, like a person. It flicks water at you with its tail, pleased, and waits to see what you will do next.', flag(n.f('done')), flag(n.f('resident-thanked')), fr(2))),
    ch('Ask it to come.', n.to('It thinks about it for as long as a wave takes to pass. Then it swims into your hands. It is old, and slow, and it has lit the way for strangers all its life; it would like, for once, to see where one of them goes.', flag(n.f('done')), flag(n.f('resident-joined')), join({ species: ['lanturn'], lv: 3 }), fr(10, 'newest'), moment('The Lantern Fish of the Deep Ocean came up into the sun with you.', 70))),
    ch('Let it go down.', n.to('It turns and sinks, its light going gold again as the water darkens round it, down and down, to wait for the next diver who needs showing home.', flag(n.f('done')), flag(n.f('resident-down')), rp(1))),
  ], (n) => [
    variant('calmed', [flagIs(n.f('resident-calmed'))], { notice: 'It put a Gyarados to sleep for you with nothing but its own small light. It looks rather pleased with itself.' }),
    variant('lanturn', [flagIs('delve-deep-ocean-lanturn')], { notice: 'You put yourself between it and a Sharpedo, down there. It has not forgotten.' }),
    variant('fought', [flagIs(n.f('resident-fought'))], { notice: 'It watched you fight the Gyarados in the dark, and lit the way up for you anyway.' }),
  ]),
];

// ---------- D-12. The Overgrown Forest (resident: a Celebi glimmer; a forest grown over a town so it could forget a war) ----------
const grown = delve({
  slug: 'overgrown-forest', name: 'The Overgrown Forest', rooms: 'abcdefgh', types: ['grass', 'ghost'], tint: '#22352a', minStage: 3,
  mons: { a: 'phantump', b: 'beedrill', e: 'tangela', g: 'tangrowth' },
  gate: {
    intro: 'The old road runs straight into a forest and does not come out. Roots have lifted the paving. Deep among the trunks you can make out straight lines that are not trees: a chimney, a gatepost, a weathervane.',
    enter: 'Follow the old road in.', enterText: 'The trees stand in rows, like streets. You are walking down the middle of a town.',
    pass: 'Leave the forest to itself.', passText: 'You turn aside. The forest keeps what it is keeping.',
  },
});
const GROWN: Json[] = [
  grown.room('a', 'Roots have swallowed the road. In a hollow stump a Phantump sits watching you with dark, round, shy eyes, as a child watches a visitor from the stairs.', (n) => [
    ch('Battle.', n.wild('It rises out of the stump, hands up, more frightened than fierce.', { species: ['phantump'], win: [rp(1)] })),
    ch('Wave.', n.to('You wave. After a long moment a small wooden hand waves back. When you walk on, it floats after you at a careful distance, as if it has not had anyone to follow in a long time.', flag(n.f('phantump')), fr(1))),
    ch('Walk on.', n.to('You walk on. The dark eyes watch you all the way to the bend.')),
    n.back,
  ]),
  grown.room('b', 'Claw marks and nests line the walls of what was once a front room. An Alpha Beedrill hangs in the doorway of an old house, red-eyed, guarding a hive that fills the place from floor to ceiling.', (n) => [
    ch('Calm it with Honey.', n.to('You set the Honey on the step and back away. The Alpha tastes it, and the hum of the whole hive drops a tone. It moves aside from the door. Inside, between the combs, a wall still stands; and on it, under glass, a photograph. A family. Five of them, squinting into the sun, outside this house.', lose('honey'), flag(n.f('photo')), flag(n.f('den-calmed')), flag('calmed-alpha'), rp(3)), { requires: [has('honey')] }),
    ch('Battle.', n.wild('It comes through the doorway like a thrown spear.', { species: ['beedrill'], lv: 3, win: [rp(2)] })),
    ch('Back out of the house.', n.to('You step backwards out through the door you should not have opened, and close what is left of it. The humming settles. It is their house now.')),
    n.back,
  ]),
  grown.room('c', 'A carved mechanism blocks the way, worn but readable: the old town gate, and on it a lock shaped like a leaf, with four smaller leaves that turn on pins.', (n) => [
    ch('Turn the leaves to match the season.', n.to('You look up at the canopy, then at the lock, and turn each little leaf to match the ones overhead. The gate thinks about it. Then, with a sigh of roots, it opens.', rp(2)), { check: 'intelligence', fail: n.stay('You turn them one way, then another. The pins click back. The trees above you stir, as if trying to give you a hint.') }),
    ch('Force it.', n.stay('You put your shoulder to it. A hundred years of roots hold it shut with no effort at all.')),
    ch('Ask the Phantump.', n.to('The Phantump floats up to the lock. Its small hands turn the four leaves without looking, the way you would open your own front door. The gate swings wide. It hovers there, and will come no further. This was as far as it was ever allowed.', flag(n.f('phantump-gate')), fr(2)), { requires: [flagIs(n.f('phantump'))] }),
    n.back,
  ]),
  grown.room('d', 'A faint light pulses between the trunks: green, flickering, gone the instant you look straight at it. The air smells of rain from some other year.', (n) => [
    ch('Stand still.', n.to('You stand perfectly still and look at nothing. The green light comes closer. It circles you once, slowly, at the edge of your eye, the way you might walk round a statue. You feel weighed, and not found wanting. Then it is elsewhere.', flag('telling-celebi'), rp(2))),
    ch('Follow it.', n.to('You go after it. It is always one tree further. It leads you nowhere, patiently, and leaves you where you began.')),
    ch('Call to it.', n.to('You call. The light goes out like a blown candle. A while later, further off, it comes back, more careful.')),
    n.back,
  ]),
  grown.room('e', 'The old town square. A crowd of Tangela has taken it over, rolling and tumbling, tangling everything: a bench, a pump, a tall stone thing in the middle wound so thick with vine you cannot tell what it was.', (n) => [
    ch('Battle.', n.wild('Half the square unrolls toward you.', { species: ['tangela'], chain: 2, win: [rp(1)] })),
    ch('Untangle a statue.', n.to('You work the vines off the tall stone, strand by strand. Under them: a soldier, bare-headed, looking down. And under the soldier, cut in rows, names. Dozens of names, every one filled with moss. You clean out the first few with your thumbnail before you understand how long it would take.', flag(n.f('memorial')), rp(2))),
    ch('Pass.', n.to('You pick your way round the edge of the square. The Tangela roll on, tangling, forgetting.')),
    n.back,
  ]),
  grown.room('f', 'A dry corner in an old school. Rows of small desks under ivy. A blackboard, still up, still written on in a round, firm hand.', (n) => [
    ch('Rest.', n.to('You sleep at the teacher\'s desk with your head on your arms.', heal(0.5))),
    ch('Read the blackboard.', n.stay('You rub away the grime with your sleeve. "SEE YOU AFTER THE HOLIDAY." Underneath, smaller, in a child\'s chalk: "see you miss."', flag(n.f('board')), rp(1))),
    ch('Clean it.', n.stay('You find the cloth, stiff as a board itself, and wipe the dust from round the words without touching one letter. At the window, a green light watches you do it, and stays a long moment before it goes.', flag(n.f('cleaned')), fr(2))),
    n.back,
  ], (n) => [
    variant('both', [flagIs(n.f('board')), flagIs(n.f('cleaned'))], { notice: 'The words on the board stand clear in a clean frame of slate.', hide: [1, 2] }),
    variant('board', [flagIs(n.f('board'))], { notice: '"SEE YOU AFTER THE HOLIDAY."', hide: [1] }),
    variant('cleaned', [flagIs(n.f('cleaned'))], { notice: 'The board is clean round its words.', hide: [2] }),
  ]),
  grown.room('g', 'The deepest room: the town hall. An Alpha Tangrowth sits on the steps, vast, red-eyed, its vines grown through every window and out of the roof. It is not guarding the hall. It is holding it shut.', (n) => [
    ch('Calm it: a Grass move at the roots, gently.', n.to('Your Pokémon does not strike. It grows: a slow green push at the Tangrowth\'s roots, like a hand on a shoulder. The great tangle shivers. One by one the vines let go of the window frames. The red goes out of its eyes like a lamp turned down.', flag(n.f('resident-calmed')), flag('calmed-alpha'), rp(4), fr(5, { types: ['grass'] })), { requires: [mtype('grass')] }),
    ch('Battle.', n.wild('It rises off the steps and the whole building creaks with it.', { species: ['tangrowth'], lv: 5, win: [flag(n.f('resident-fought')), rp(4)] })),
    ch('Read the names on the memorial to it.', n.to('You stand at the foot of the steps and say the names you cleaned from the stone, one after another. The Tangrowth goes still. It listens to every one. When you run out of names it lowers its vines to the ground, all of them, slowly. It grew over this town so the names could stop hurting. It had not thought anyone would say them kindly.', flag(n.f('resident-calmed')), flag(n.f('resident-names')), flag('calmed-alpha'), rp(4), moment('You read the war memorial\'s names to the Tangrowth that buried them.', 65)), { requires: [flagIs(n.f('memorial'))] }),
    n.back,
  ]),
  grown.room('h', 'Daylight. The forest stands behind you, quiet, the old road running into it and not coming out.', (n) => [
    ch('Tell the nearest town.', n.to('You tell them. By the next season there are historians in the square with brushes and notebooks, cleaning moss out of names. The war is remembered. Some of the old people in the nearest town cry, and some will not speak to you.', flag(n.f('done')), flag(n.f('resident-told')), rp(3), moment('You told the world about the town under the Overgrown Forest.', 55))),
    ch('Leave it overgrown.', n.to('You say nothing to anyone. As you walk away a green light keeps pace with you between the trunks, to the very last tree, and stops there. It seems, as far as a light can, to bow.', flag(n.f('done')), flag(n.f('resident-left')), flag('telling-celebi'), rp(2))),
    ch('Plant a tree at the gate.', n.to('You dig a hole in the middle of the old road and plant a sapling there. By the time you have shouldered your pack and looked back, you cannot tell which tree was yours. The forest has taken it in, and the gate is never found again.', flag(n.f('done')), flag(n.f('resident-planted')), fr(3), moment('You planted a tree across the road to the Overgrown Forest.', 55))),
  ], (n) => [
    variant('names', [flagIs(n.f('resident-names'))], { notice: 'Somewhere back there, a Tangrowth is sitting on the town hall steps with its vines laid down, turning names over.' }),
    variant('fought', [flagIs(n.f('resident-fought'))], { notice: 'The town hall stands open behind you now, its keeper beaten. The forest feels thinner for it.' }),
  ]),
];

export const EVENTS: Json[] = [ice.gate, ...ICE, core.gate, ...CORE, FESTIVAL, ocean.gate, ...OCEAN, grown.gate, ...GROWN];
export const REMOVE: string[] = [];
void status;
