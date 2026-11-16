// Catalog Overhaul Pack, category "places": the Delves, part 2 (STORY_FAMILIES_14.md, D-5 to D-8).
import { $, RARE_HELD, any, ch, egg, ev, flag, flagIs, fr, has, heal, hurt, item, join, lose, money, out, ptype, rp, statusLead, takeNode, type Json } from '../dsl.ts';
import { delve, kind, moment, mtype, no, rep, variant } from './_delve.ts';

export const CATEGORY = 'places';

// ---------- D-5. The Desert Well (the well isn't dry: a Whiscash keeps a pocket of water alive) ----------
const well = delve({
  slug: 'desert-well', name: 'The Desert Well', rooms: 'abcde', types: ['ground', 'water'], tint: '#4a3d24', minStage: 1,
  mons: { a: 'sandile', c: 'krookodile', e: 'whiscash' },
  gate: {
    intro: 'A stone well stands alone in the sand, its rope long gone. The town says it has been dry for a hundred years. Small tracks from every direction lead to it, and none lead away thirsty.',
    enter: 'Climb down the well.', enterText: 'You go down hand over hand on your own rope. The air gets cooler the deeper you go. That should not happen in a dry well.',
    pass: 'Walk on through the sand.', passText: 'You leave the well behind. A Trapinch passes you going the other way, in no doubt at all about where the water is.',
  },
});
const WELL: Json[] = [
  well.room('a', 'A stone well, dry for a hundred years. A Sandile pokes its head over the rim, hisses at you like a kettle, and blocks the way down with its whole small body.', (n) => [
    ch('Battle.', n.wild('It snaps at your ankles. It is guarding something.', { species: ['sandile'], win: [rp(1)] })),
    ch('Climb down past it.', n.to('You swing a leg over the rim. The Sandile hisses the whole way down after you, scandalised, but it does not bite.')),
    ch('Drop a stone.', n.to('You drop a stone and count. One. Two. Three. Four. It falls a very long way. And then, impossibly, it splashes. The Sandile looks at you as if you have learned a family secret.', flag(n.f('splash')), rp(1))),
    n.back,
  ]),
  well.room('b', 'The floor of the shaft opens into a tunnel, and the tunnel floor looks wrong: too smooth, with scuff marks where others turned back. Quicksand.', (n) => [
    ch('Test with a stick.', n.to('You prod ahead step by step. The stick vanishes to your wrist twice. Between those places runs a spine of firm ground, and you walk it like a rope.')),
    ch('Send a Ground-type.', n.to('Your Ground-type walks out onto the sand, feels it with its feet, and stamps a safe path for the rest of you. It looks back, proud, sand to the knees.', fr(2)), { requires: [ptype('ground')] }),
    ch('Walk across.', n.to('Three steps in, the floor swallows you to the waist. Everybody hauls everybody else out, spitting sand, hearts hammering.', hurt(0.1))),
    n.back,
  ]),
  well.room('c', 'Claw marks and nests line the walls. This is somebody\'s home. An Alpha Krookodile lies across the passage down, huge, cracked at the lips. It is not angry. It is thirsty, and it is standing guard over the last water in the desert.', (n) => [
    ch('Calm it with a Fresh Water.', n.to('You uncap the bottle and roll it across the stone. The Krookodile drinks it in one long swallow, eyes closed. When it opens them the red has gone. It shifts its tail aside, and lets you pass to what it guards.', lose('fresh-water'), flag(n.f('resident-calmed')), flag('calmed-alpha'), rp(3)), { requires: [has('fresh-water')] }),
    ch('Battle.', n.wild('It rises to keep you from the water, and it fights like the last thing standing between a desert and its death.', { species: ['krookodile'], lv: 3, win: [flag(n.f('muddied')), rp(2)] })),
    ch('Back away and leave water.', n.to('You back up slowly, pour your own canteen into a hollow of the rock, and sit down where it can see you. It watches you for a long time. Then it drinks what you left, to the last drop, and moves its tail out of your way.', flag(n.f('left-water')), rp(2))),
    n.back,
  ]),
  well.room('d', 'A battered chest of old explorers\' gear, half sunk in sand. On top lies a map with this well circled twice in red: "WATER, 300 FT." They knew. They never made it down.', (n) => [
    ch('Take the gear.', n.to('Rope gone to dust, a cracked lamp, and one thing still good: a Ground TM with DIG on the case.', item('tm-ground'))),
    ch('Take the map.', n.to('You unroll it. Two more wells are marked across this country in the same red ink, each with a depth beside it. Somebody spent a lifetime finding these.', flag('desert-wells-marked', 2), rp(1))),
    ch('Both.', n.to('You take the TM and roll the map carefully into your pack. Two more red circles. Two more wells nobody believes in.', item('tm-ground'), flag('desert-wells-marked', 2), rp(1))),
    n.back,
  ]),
  well.room('e', 'The bottom. A cool cave, and a pool as still as glass. An ancient Whiscash drifts in it, whiskers trailing, and all around the edge the desert\'s Pokémon are drinking side by side: hunters beside the hunted, nobody afraid.', (n) => [
    ch('Drink.', n.to('You kneel between a Cacnea and a Trapinch and drink. Nothing has ever tasted like it. The Whiscash watches everyone get their share.', heal(1), flag(n.f('done')))),
    ch('Leave a Water-type\'s gift.', n.to('Your Pokémon pours clean water into the pool until it laps a hand higher on the stone. Every drinker looks up. The old Whiscash rises, and bows until its whiskers touch the surface. When you turn to go, a small Barboach is swimming after you up the runnel, determined.', flag(n.f('done')), flag(n.f('resident-gift')), join({ species: ['barboach'] }), fr(4), moment('You refilled the hidden pool under the Desert Well.', 60)), { requires: [mtype('water')] }),
    ch('Tell the town above.', n.to('You tell them. By evening the whole town is at the well with buckets and cheering. The Whiscash sinks out of sight. In a year the pool will be gone, and the tracks in the sand will lead nowhere.', flag(n.f('done')), flag(n.f('resident-told')), $(500), moment('You told the town about the water under the Desert Well.', 50))),
    ch('Don\'t tell.', n.to('You climb out and say nothing to anyone. Behind you a hundred small tracks still lead to a well that is dry for a hundred years, and the desert stays alive.', flag(n.f('done')), flag(n.f('resident-kept')), moment('You kept the Desert Well\'s secret.', 55))),
  ], (n) => [
    variant('muddied', [flagIs(n.f('muddied'))], { notice: 'The pool is clouded brown: the fight above shook silt down into it. The drinkers wait at the edge for it to clear. The Whiscash looks at you, and you look away.' }),
    variant('calmed', [flagIs(n.f('resident-calmed'))], { notice: 'Behind you the Krookodile has come down to drink at last, now that someone else is keeping watch.' }),
    variant('left', [flagIs(n.f('left-water'))], { notice: 'The Krookodile follows you down and drinks beside the smallest ones. It was only ever making sure there would be enough.' }),
  ]),
];
// The two wells on the explorers' map: each is a rest on a later stage.
const WELL_MARKED = ev('delve-desert-well-marked', 'A Marked Well', 'Dungeons', { stop: 'heal', rarity: 'uncommon', types: ['ground'], callback: true, requires: [flagIs('desert-wells-marked')], tint: '#4a3d24' },
  'A ring of stones in the sand, exactly where the explorers\' red circle said it would be. Everyone who passes thinks it is dry. You drop a stone, and count, and it splashes.', [
    ch('Draw water and rest.', out('You haul up a bucket so cold it hurts your teeth. Everyone drinks, and sleeps in the well\'s thin shade. You tick the red circle off the map.', heal(1), flag('desert-wells-marked', -1))),
    ch('Leave it for the desert.', out('You leave the bucket full on the rim for whoever comes on four legs tonight, and fold the map away.', flag('desert-wells-marked', -1), fr(2))),
  ]);
(WELL_MARKED as { tags?: string[] }).tags = ['Recovery', 'Exploration'];

// ---------- D-6. The Marsh Boardwalk (resident: the Ferryman, Old Haddon) ----------
const marsh = delve({
  slug: 'marsh-boardwalk', name: 'The Marsh Boardwalk', rooms: 'abcde', types: ['water', 'poison'], tint: '#2a3a2c', minStage: 1,
  mons: { a: 'croagunk', b: 'gloom', c: 'litwick', e: 'lotad' },
  gate: {
    intro: 'Rotten planks run out over still, black water and vanish into mist. A hand-painted board is nailed to the first post: "FERRY. FREE. ASK FOR HADDON."',
    enter: 'Step onto the boardwalk.', enterText: 'The first plank sags and holds. Somewhere out in the mist a pole knocks against wood, slow and regular.',
    pass: 'Keep to dry land.', passText: 'You go round by the road. Out on the water, an old man on a raft of Lotad lifts his hat to you anyway.',
  },
});
const MARSH: Json[] = [
  marsh.room('a', 'Rotten planks over still water, and then a gap where six of them have gone. A Croagunk croaks at you from a stump, cheeks pulsing, enjoying your problem.', (n) => [
    ch('Battle.', n.wild('It hops down onto the last good plank to argue about it.', { species: ['croagunk'], win: [rp(1)] })),
    ch('Step over the gap.', n.to('You jump. The far plank cracks, tilts, and holds. The Croagunk looks disappointed.')),
    ch('Wait for the ferry.', n.to('A pole knocks, and out of the mist comes an old man standing on a raft of living Lotad. "Ride? Free. Always free." He steadies you aboard with a hand like tree root. "Haddon. Mind your feet, they\'re ticklish."', flag(n.f('met')), fr(1))),
    n.back,
  ]),
  marsh.room('b', 'A patch of Gloom has taken over the walkway, swaying, drooling, pleased to see anyone. The smell arrives before they do. Haddon poles alongside holding his nose. "Mind the Glooms. They\'re friendly. They stink."', (n) => [
    ch('Battle.', n.wild('They take it as a game. The smell gets worse.', { species: ['gloom'], chain: 2, win: [rp(1)] })),
    ch('Hold breath and pass.', n.to('You go through at a run with your cheeks puffed out. The Gloom wave. You make it to clean air with your eyes streaming and nobody the worse.'), { chance: 0.5, fail: n.to('You almost make it. Your lead takes one breath too early, in the thick of it, and comes out the far side green.', statusLead('poison')) }),
    ch('Feed them.', n.to('You hold out an Oran Berry. They crowd round it, delighted, and shuffle off the planks to share it in the reeds. Haddon nods. "That\'s all they wanted. Somebody to stop."', lose('oran-berry'), fr(2)), { requires: [has('oran-berry')] }),
    n.back,
  ]),
  marsh.room('c', 'A faint light pulses over the water: a Litwick, drifting on nothing, turning slowly as if it has forgotten which way it was going. Haddon takes his hat off. "They come here when no one\'s lit their candle."', (n) => [
    ch('Light a candle for it.', n.to('Haddon has a stub in his pocket; he always has. You light it and set it on a post. The Litwick stops turning. It drifts to your shoulder and stays there, steady now, a small cold flame that knows someone remembered.', flag('hollow-lantern-clue'), flag(n.f('candle')), ...kind(), rp(1))),
    ch('Catch it.', n.to('It drifts into the ball without protest. Being kept is, at least, being somewhere.', join({ species: ['litwick'] }))),
    ch('Leave it.', n.to('You leave it turning over the black water. Haddon puts his hat back on and says nothing.')),
    n.back,
  ]),
  marsh.room('d', 'A dry corner: the porch of Haddon\'s hut, on stilts in the middle of nowhere. He makes tea on a spirit stove. "Fifty years ferrying. Nobody pays. I like it that way. Nobody owes me anything."', (n) => [
    ch('Rest.', n.to('You sleep on his porch to the sound of Lotad breathing under the floor. In the morning there is tea again, and he will not let you wash the cup.', heal(1))),
    ch('Pay him anyway.', n.stay('He pushes your money back across the table three times. In the end he takes a single Oran Berry, turns it over, and puts it on the shelf beside a row of other things he could not refuse. "Don\'t tell anyone."', lose('oran-berry'), flag(n.f('paid')), fr(2)), { requires: [has('oran-berry')] }),
    ch('Ask why.', n.stay('He is quiet for a while. "Fifty years ago I poled my wife\'s coffin across this marsh. Nobody else would take her. Got to the far side and couldn\'t think what to do next." He shrugs. "So I went back for the living. Still going back."', flag(n.f('why')), rp(1))),
    n.back,
  ], (n) => [
    variant('both', [flagIs(n.f('paid')), flagIs(n.f('why'))], { notice: 'Haddon tops up your cup. Your berry sits on his shelf in the row.', hide: [1, 2] }),
    variant('paid', [flagIs(n.f('paid'))], { notice: 'Your berry sits on his shelf, at the end of a long row.', hide: [1] }),
    variant('why', [flagIs(n.f('why'))], { notice: 'Haddon watches the water as if it might answer him one day.', hide: [2] }),
  ]),
  marsh.room('e', 'Daylight on the far shore, firm ground under your boots at last. Behind you Haddon is already turning the raft around, to go back for whoever is next.', (n) => [
    ch('Thank Haddon.', n.to('He waves it off, then wades after you with something wrapped in a wet leaf. "One of mine laid this. Raise it kind." A Lotad egg, cool and green.', egg({ species: ['lotad'] }), flag(n.f('done')), flag(n.f('resident-thanked')))),
    ch('Offer to pole the raft back for him.', n.to('You find the rhythm: push, lift, glide. Haddon sits down on his own raft for the first time in fifty years and watches the marsh go by like a passenger. Halfway across he starts to laugh, and cannot stop.', flag(n.f('done')), flag(n.f('resident-ferried')), flag('kind-helped-stranger'), ...kind(), moment('You poled the raft so Old Haddon could ride his own ferry.', 60)), { prompt: { id: 'echo-rhythm', needs: 'ok' }, fail: n.to('You catch a crab on the first stroke and nearly go in. Haddon laughs until he has to sit down on his own raft, which he has not done in fifty years. You get him across in the end, zigzag.', flag(n.f('done')), flag(n.f('resident-ferried')), flag('kind-helped-stranger'), ...kind(), moment('You poled the raft, badly, so Old Haddon could ride his own ferry.', 60)) }),
    ch('Walk on.', n.to('You raise a hand. He raises his pole. The mist closes between you, and the knocking of wood on wood goes on behind you for a long time.', flag(n.f('done')))),
  ], (n) => [
    variant('candle', [flagIs(n.f('candle'))], { notice: 'The Litwick on your shoulder burns steady and small. Haddon looks at it, and nods to it like a neighbour.' }),
    variant('why', [flagIs(n.f('why'))], { notice: 'Fifty years ago he reached this shore with a coffin and could not think what to do next. He is still going back.' }),
    variant('paid', [flagIs(n.f('paid'))], { notice: 'Your berry is on his shelf, in the row of things he could not refuse.' }),
  ]),
];

// ---------- D-7. The Sky Bridge (resident: Tollkeeper Isaura; the toll is one true story) ----------
const bridge = delve({
  slug: 'sky-bridge', name: 'The Sky Bridge', rooms: 'abcde', types: ['flying', 'fairy'], tint: '#3d5266', minStage: 1,
  mons: { a: 'swablu', e: 'altaria' },
  gate: {
    intro: 'A rope bridge hangs between two cliffs, so long its middle is lost in cloud. Every plank has words carved into it. A sign at the near end: "TOLL: ONE STORY."',
    enter: 'Set foot on the bridge.', enterText: 'The first plank reads: "I crossed to see my daughter married." The second: "I ran from something and stopped running here." You keep reading, and keep walking.',
    pass: 'Find another way across.', passText: 'You take the goat track down into the gorge instead. Above you the bridge creaks in the wind, full of other people\'s stories.',
  },
});
const story = (n: { to: (text: string, ...fx: Json[]) => Json; f: (name: string) => string }, label: string, text: string): Json =>
  ch(label, n.to(text, flag(n.f('toll-paid')), flag(n.f('story-carved')), moment('Your story is carved on a plank of the Sky Bridge.', 50)));
const BRIDGE: Json[] = [
  bridge.room('a', 'A rope bridge between two cliffs. A flock of Swablu has nested all along the hand ropes, so the whole bridge looks strung with cloud. They watch you with bright, uneasy eyes.', (n) => [
    ch('Walk carefully.', n.to('You go one slow plank at a time, hands off the ropes, whispering apologies. Not one Swablu leaves its nest.')),
    ch('Battle.', n.wild('The flock lifts off the ropes in one white burst.', { species: ['swablu'], chain: 2, win: [rp(1)] })),
    ch('Let a Flying-type carry me.', n.to('Your Flying-type lifts you clear over the nests and sets you down in the middle of the bridge. The Swablu sing as you pass over. You did not wake a single chick.', fr(2)), { requires: [ptype('flying')] }),
    n.back,
  ]),
  bridge.room('b', 'Someone is waiting mid-span, arms folded, a carving knife at her belt: Isaura, the tollkeeper. "Toll\'s one story. True ones only. Lie and I\'ll know."', (n) => [
    ch('Tell a story.', n.stay('She sits down cross-legged on the planks, over a thousand feet of air, and takes out the knife. "Go on, then. Which one?"', flag(n.f('telling')))),
    ch('Battle instead.', n.trainer('"Some people would rather bleed than talk. Fine."', 'Tollkeeper Isaura', { team: ['altaria', 'noivern'], lv: 1, cls: 'bird-keeper', win: [flag(n.f('toll-paid')), $(300)] })),
    ch('Ask about the bridge.', n.stay('"My grandmother built it. Every rope, every plank, forty years." Isaura runs a thumb along the hand rope. "For a Pokémon that couldn\'t fly. She never told us which one. Toll\'s still one story."', flag(n.f('asked-bridge')), rp(1))),
    n.back,
  ], (n) => [
    variant('telling', [flagIs(n.f('telling'))], {
      intro: 'Isaura waits, knife in hand, a blank plank across her knees. The wind has dropped to listen. "Which story? A true one."', hide: [0, 1, 2],
      add: [
        story(n, 'The day my first partner chose me.', 'You tell her how it began: the three of them waiting, and the one that looked back at you. She carves as you speak, and does not look up until the end. "True," she says. The plank goes into the bridge. Walk on.'),
        story(n, 'The flock in your ropes, an hour ago.', 'You tell her about a bridge strung with cloud, and trying not to wake it. Isaura laughs, the first time. "That\'s today. Nobody tells me today." She carves it anyway, the newest story on the oldest bridge.'),
        story(n, 'The hardest fight on my road so far.', 'You tell it straight: who nearly fell, who stood back up, what it cost. She listens with her whole face. "True," she says quietly, and carves it deep, so the weather will take longer over it.'),
      ],
    }),
    variant('asked', [flagIs(n.f('asked-bridge'))], { notice: 'Isaura is still waiting, thumb on the hand rope her grandmother tied.', hide: [2] }),
  ]),
  bridge.room('c', 'Where the bridge meets a spur of cliff there is a sealed chamber cut into the rock, its lock cold and old. The keyhole is not a keyhole. It is the shape of a wing.', (n) => [
    ch('Put a feather in it.', n.to('The Silver Wing slides into the lock as if it was cast for it. Stone turns on stone. Inside, on a shelf, a gift left for whoever came with the sky\'s blessing; and as you take it, a huge shadow crosses the gorge and is gone.', any(...RARE_HELD), flag('sign-bird'), rp(2)), { requires: [has('silver-wing')] }),
    ch('Force it.', n.to('You put your shoulder to it, then your whole team\'s. It holds. It was built by the woman who built the bridge. It will hold longer than you.')),
    ch('Leave it.', n.to('You leave the wing-shaped lock for someone carrying the right feather.')),
    n.back,
  ], () => [
    variant('rainbow', [has('rainbow-wing')], { notice: 'The Rainbow Wing in your pack has gone warm.', hide: [0], add: [ch('Put a feather in it.', out('The Rainbow Wing fits the lock, and seven colours run round the edge of the door as it opens. Inside, on a shelf, a gift left for whoever came with the sky\'s blessing; and as you take it, a huge shadow crosses the gorge and is gone.', any(...RARE_HELD), flag('sign-bird'), rp(2), { kind: 'addEvent', eventId: 'dg-sky-bridge-d' }))] }),
  ]),
  bridge.room('d', 'A battered chest lashed to the bridge post. Inside, wrapped in oilcloth: the grandmother\'s journal. The first page is a drawing of a Swablu, one wing bound in a splint made from a spoon.', (n) => [
    ch('Read it.', n.to('"She cannot fly and will not be carried. Her flock is on the far cliff. So I will make the cliff come to her." Forty years of rope lengths and plank counts follow. The last entry is one line: "She crossed today. On her own feet."', flag(n.f('read')), rp(1))),
    ch('Take the chest\'s gift.', n.to('Under the journal, pressed flat between two boards: one Soft Feather, white as cloud, kept for forty years.', item('soft-feather'))),
    ch('Show Isaura.', n.to('You carry the journal back along the bridge. Isaura has never seen it. She reads it standing, in silence, the wind turning the pages for her. When she finishes she holds it against her chest and looks at the far cliff for a long time.', flag(n.f('showed')), fr(2), moment('You showed Isaura her grandmother\'s journal.', 50))),
    n.back,
  ]),
  bridge.room('e', 'Daylight on the far cliff. At the bridge\'s end, in a nest woven into the last post, an old Altaria is asleep, its cloud gone thin and grey. One wing sits a little crooked. It is the Swablu.', (n) => [
    ch('Let it sleep.', n.to('You step round the nest without a sound. Something small and white flutters down from the post and lands on your pack: a Swablu chick, which has decided you are going somewhere interesting.', join({ species: ['swablu'] }), flag(n.f('done')), flag(n.f('resident-slept')))),
    ch('Wake it gently.', n.to('You touch its wing. It opens one eye, sees a traveller who crossed its bridge, and sings: one long, clear, unhurried song that carries back over the whole span. Every Swablu on the ropes answers.', heal(0.5), fr(4), flag(n.f('done')), flag(n.f('resident-sang')))),
    ch('Tell Isaura.', n.to('You call back along the bridge. Isaura crosses it, all the way, for the first time in years, and stops at the nest. She knows that crooked wing from the drawing or from somewhere older. She sits down beside the old Altaria, and it shifts in its sleep to lean on her.', flag(n.f('done')), flag(n.f('resident-told')), moment('Isaura sat down beside the Altaria her grandmother built a bridge for.', 65))),
  ], (n) => [
    variant('showed', [flagIs(n.f('showed'))], { notice: 'Isaura has followed you across with the journal under her arm. She is looking at the nest, and has stopped walking.' }),
    variant('carved', [flagIs(n.f('story-carved'))], { notice: 'Behind you, your own story is one more plank in the bridge it crossed on.' }),
  ]),
];

// ---------- D-8. The Deep Mine (resident: the Lamp-Keeper, a Lampent waiting for a shift that never came) ----------
const deep = delve({
  slug: 'deep-mine', name: 'The Deep Mine', rooms: 'abcdefgh', types: ['rock', 'steel'], tint: '#2e2a2a', minStage: 3,
  mons: { a: 'roggenrola', d: 'durant', e: 'lampent', g: 'steelix', h: 'lampent' },
  gate: {
    intro: 'The big mine closed years ago; the gates are chained and the company is gone. But through the chained gates, down the main drift, you can see lamps. All of them lit. Every single one.',
    enter: 'Slip through the gates.', enterText: 'You squeeze between the bars. The lamps stretch away into the dark in a perfect line, trimmed and burning, waiting for a shift.',
    pass: 'Leave the mine chained.', passText: 'You walk on. Behind the gates a small purple flame moves from lamp to lamp, checking each one.',
  },
});
const DEEP: Json[] = [
  deep.room('a', 'Lamps hang on beams nobody has checked in years. A family of Roggenrola huddles in the pool of light under one of them, as if round a fire.', (n) => [
    ch('Battle.', n.wild('The biggest one rolls out of the light to meet you.', { species: ['roggenrola'], win: [rp(1)] })),
    ch('Pass quietly.', n.to('You keep to the dark side of the drift. The Roggenrola do not stir. The light is all they want.')),
    ch('Look at the lamp.', n.to('The glass is clean. The wick is new. The oil is full to the line, and the brass has been polished by something that does not have hands. Somebody is keeping these. Somebody has never stopped.', flag(n.f('lamp')), rp(1))),
    n.back,
  ]),
  deep.room('b', 'A battered chest in the pay office: the last shift\'s wages, never collected. Forty brown envelopes, each with a name in clerk\'s copperplate, each still sealed.', (n) => [
    ch('Take the money.', n.to('You slit them open one by one. It adds up. So do the names, as you drop each empty envelope on the floor.', $(2000), rep(-1), flag(n.f('took-wages')))),
    ch('Read the names.', n.to('Abel. Brannigan. Cole and Cole, brothers. Forty miners who went home one evening and were told not to come back. You read every name aloud, and the lamp outside the door burns a little higher.', flag(n.f('names')), rp(1))),
    ch('Leave it.', n.to('You close the lid. In the doorway a small purple flame hangs watching you, and then it bobs once, like a nod, and drifts away.', flag(n.f('left-wages')))),
    n.back,
  ]),
  deep.room('c', 'The floor\'s wrong: boards laid over something, gone soft and grey, with scuffs where others turned back. Under the rot, an old shaft drops into nothing.', (n) => [
    ch('Test it.', n.to('You tap ahead with a pick handle. Two boards hold. You cross on those, not breathing.')),
    ch('Send a Rock-type.', n.to('Your Rock-type walks out, the boards groan, and it simply stands across the gap like a bridge until everyone is over. Then it steps off, unconcerned.', fr(2)), { requires: [ptype('rock')] }),
    ch('Jump it.', n.to('You run and jump. The far edge crumbles under you and you land hard on your knees, everyone piling in behind.', hurt(0.1))),
    n.back,
  ]),
  deep.room('d', 'Claw marks and nests line the walls. This is somebody\'s home. The miners\' tunnels are full of Durant now, and in the widest gallery waits the colony queen, an Alpha, red-eyed, jaws ringing on the rails.', (n) => [
    ch('Calm it with an Iron Ball.', n.to('You roll the Iron Ball down the rails. The queen catches it, tastes it, and the whole colony goes still. She carries it away like treasure, and the columns part to let you through.', lose('iron-ball'), flag(n.f('queen-calmed')), flag('calmed-alpha'), rp(3)), { requires: [has('iron-ball')] }),
    ch('Battle.', n.wild('The queen screams and the walls come alive.', { species: ['durant'], lv: 3, chain: 2, win: [rp(2)] })),
    ch('Back away.', n.to('You back out step by step and take the narrow air shaft round the gallery instead. It costs skin off your elbows. The queen never moves.')),
    n.back,
  ], (n) => [
    variant('steel', [mtype('steel')], { notice: 'The queen\'s head turns toward your Pokémon that knows steel.', hide: [0], add: [ch('Calm it: ring Steel moves off the walls.', n.to('Your Pokémon strikes the iron walls, not the colony: one clean note, then another. The Durant stop. To them it is the sound of the mine working again. The queen lowers her jaws, and the columns part.', flag(n.f('queen-calmed')), flag('calmed-alpha'), rp(3), fr(2)))] }),
  ]),
  deep.room('e', 'A Lampent floats from beam to beam down the gallery, touching each cold lamp alight, tidy and unhurried. It notices you. It stops, mid-air, like someone caught talking to themselves.', (n) => [
    ch('Follow it.', n.to('It decides you are with the shift. It leads you round every bad board and loose prop in the gallery, lighting the way a few lamps ahead, glancing back to count you.', flag(n.f('followed')), fr(1))),
    ch('Catch it.', n.to('It goes into the ball looking back at the lamps it has not finished. All down the gallery the unlit ones stay dark.', join({ species: ['lampent'] }), flag(n.f('caught')))),
    ch('Ask it why.', n.to('It cannot tell you. It shows you. It floats to one lamp, older than the rest, brass worn thin from a thousand trimmings, and lights that one first and most carefully: the shift foreman\'s station. It hangs there a while.', flag(n.f('why')), rp(1))),
    n.back,
  ]),
  deep.room('f', 'A dry corner: the miners\' break room. Forty cups still on the table, each with a ring of dried tea. A stove, cold. A calendar stopped on a Friday.', (n) => [
    ch('Rest.', n.to('You sit at the long table in somebody\'s chair and sleep with your head on your arms.', heal(0.5))),
    ch('Wash the cups.', n.to('You wash all forty and stand them upside down in a row to dry. In the doorway the Lampent watches. Its flame, which has burned too high for years, dims a little. It looks, for the first time, relieved.', flag(n.f('cups')), fr(3))),
    ch('Light the stove.', n.to('The stove catches at the first match, as if it had only been waiting to be asked. Warmth fills the room, and the chairs, and you.', heal(1))),
    n.back,
  ]),
  deep.room('g', 'The deepest room. An Alpha Steelix lies coiled, link upon link, round the mine\'s last lamp: the foreman\'s, on its iron hook. Nothing has got past it in years, and it has not gone out.', (n) => [
    ch('Calm it with a Metal Coat.', n.to('You hold up the Metal Coat. The Steelix lowers its head and takes it, and something in that huge body unclenches. It uncoils. Under it, kept safe: the foreman\'s lamp, and beside it his brass badge.', lose('metal-coat'), flag(n.f('badge')), flag(n.f('resident-calmed')), flag('calmed-alpha'), rp(4)), { requires: [has('metal-coat')] }),
    ch('Battle.', n.wild('It rises until its head scrapes the roof. It will not let the last lamp go dark.', { species: ['steelix'], lv: 5, win: [flag(n.f('resident-fought')), rp(4)] })),
    ch('Ask the Lampent.', n.to('The Lampent floats past you, straight up to the Steelix\'s great face, and touches its flame to the iron brow. The Steelix lowers its head to the floor. They have kept this lamp together. It was the foreman\'s Steelix. It still is.', flag(n.f('badge')), flag(n.f('resident-asked')), rp(3), fr(3), moment('The Lampent and the foreman\'s Steelix let you through to the last lamp.', 55))),
    n.back,
  ]),
  deep.room('h', 'Daylight. By the mine entrance stands a memorial board with forty names, and one unlit lamp on a hook beneath it. The Lampent has followed you up, and hangs at the edge of the sun, uncertain.', (n) => [
    ch('Light the last lamp.', n.to('The Lampent drifts out of the mine, into daylight, and touches the lamp under the forty names. It catches. The shift is over. The little flame shudders, and unfolds, arm after arm of soft fire, into a Chandelure, right there in the sun. It bows to the board, and to you.', flag(n.f('done')), flag(n.f('resident-lit')), moment('The Lamp-Keeper lit the last lamp and left the Deep Mine as a Chandelure.', 70))),
    ch('Bring the wages. (a node)', n.to('You carry the forty envelopes down to the town and post every one, to forty doors. Some of the names are answered by grandchildren. It takes the best part of a day. Nobody in that town will forget who brought them.', flag(n.f('done')), flag(n.f('resident-wages')), takeNode(), rep(2), moment('You delivered forty miners\' wages, years late.', 65)), { requires: [no(n.f('took-wages'))] }),
    ch('Take the Lampent with me.', n.to('You hold out a hand. The Lampent looks back down the drift once. One by one, all the way down, the lamps go out, gently, like a house going to bed. Then it comes to you. The mine is dark, and at peace.', flag(n.f('done')), flag(n.f('resident-joined')), join({ species: ['lampent'], lv: 2 }), moment('The Lamp-Keeper let the Deep Mine go dark, and came with you.', 65))),
  ], (n) => [
    variant('caught-took', [flagIs(n.f('caught')), flagIs(n.f('took-wages'))], { notice: 'Your Lampent has let itself out of its ball to look at the board. The envelopes\' money is heavy in your pack.', hide: [1, 2], add: [ch('Bring the wages back. (a node)', n.to('You count out every coin you took, seal it up again, and post all forty to forty doors. It takes the best part of a day, and it is the least you could do.', flag(n.f('done')), flag(n.f('resident-wages')), $(-2000), takeNode(), rep(2), moment('You gave back forty miners\' wages and delivered them.', 60)), { requires: [money(2000)] })] }),
    variant('caught', [flagIs(n.f('caught'))], { notice: 'Your Lampent has let itself out of its ball. It hangs before the forty names, and looks at the unlit lamp.', hide: [2] }),
    variant('took', [flagIs(n.f('took-wages'))], { notice: 'Forty names. The money from their envelopes is heavy in your pack.', hide: [1], add: [ch('Bring the wages back. (a node)', n.to('You count out every coin you took, seal it up again, and post all forty to forty doors. It takes the best part of a day, and it is the least you could do.', flag(n.f('done')), flag(n.f('resident-wages')), $(-2000), takeNode(), rep(2), moment('You gave back forty miners\' wages and delivered them.', 60)), { requires: [money(2000)] })] }),
  ]),
];

export const EVENTS: Json[] = [well.gate, ...WELL, WELL_MARKED, marsh.gate, ...MARSH, bridge.gate, ...BRIDGE, deep.gate, ...DEEP];
export const REMOVE: string[] = [];
