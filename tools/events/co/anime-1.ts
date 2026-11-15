// Anime questlines, module 1: AN1-AN8. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AN1 The Bathhouse at the Edge of Night (Door;        script: QUESTLINES_ANIME_INSPIRED.md "AN1")
//   AN2 The Spore Doctor                   (Stage-Three; script: QUESTLINES_ANIME_INSPIRED.md "AN2")
//   AN3 The Book of Names                  (Run-Long;    script: QUESTLINES_ANIME_INSPIRED.md "AN3")
// Build: npm run co:build -- anime-1
import { anyType, ch, ev, fight, flag, flagAgo, flagAt, flagIs, fr, heal, hurtLead, item, out, room, takeNode, type Json } from '../dsl.ts';
import { AN, bondLine, gain, later, line, moment, monDuel, notYet, seen, stageOf, tagTypes, temp, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AN1: 'an01-bathhouse',
  AN2: 'an02-spore-doctor',
  AN3: 'an03-book-of-names',
};

export const PLACEMENT: Record<string, Place> = {
  'an01-bathhouse': { shape: 'Door', earliest: 'A4', home: 14, window: [12, 16], tags: ['water'], beats: ['an01-apron', 'an01-bridge-gone', 'an01-the-food', 'an01-tub', 'an01-tea', 'an01-lost-name', 'an01-dawn'], note: 'The header reads Dusk. Door: chain pseudo-stage ps_an01_bathhouse (src/data/catalogOverhaul/pseudo/anime-1.json); the three entry choices open the three first rooms, which all lead to the three shifts and dawn.' },
  'an02-spore-doctor': { shape: 'Stage-Three', earliest: 'A3', home: 6, tags: ['forest'], beats: ['an02-far-road', 'an02-last-road'], note: 'Steps 6, 12, 17. "Move it." adds the cave three nodes on; the far road comes five nodes after the village either way.' },
  'an03-book-of-names': { shape: 'Run-Long', earliest: 'A3', home: 'each region\'s Stage 3', tags: ['eerie'], beats: ['an03-second-name', 'an03-third-name', 'an03-fourth-name', 'an03-everyone'], note: 'A + node at Night. One spirit per region after the Shuppet (flagAt / flagAgo); Spiritomb comes on a later stage once three names are back.' },
};

export const NOT_A_BUTTON: Record<string, Record<string, string>> = {};

export const LIMITS: Record<string, string[]> = {
  AN1: [
    'The Polteageist cup is an ordinary Sinistea: the game has no Antique form.',
    'The silt pellet is the Clean Silt Pellet (held): it cures the holder\'s status once and crumbles; the doc\'s "once per battle" cure that stays has no held-item hook.',
    'Remembers "cleaned a polluted river this run" reads the Volunteer Cleanup event (seen volunteer-cleanup) or flag factory-shutdown, which greenneedle\'s Polluted Factory (gn.17) must set.',
    'Remembers "ate at a festival stall in the last stage" reads flag festival-stall-ate, which the thread that builds festival stalls must set; it holds for any earlier stage of this run, not only the last.',
    'Afterstory (the bridge appears again in a later run) is not built: nothing crosses runs.',
  ],
  AN2: [
    'The Morelull\'s "reveals one hidden node per stage" has no engine piece: it comes with Morelull\'s Glow, a run-long item that shows every hidden "?" stop on every stage, whether or not the Morelull is in the party.',
    'Remembers "carried the Bell in the Fog" reads flag fog-named, which the thread that builds SF29 The Bell in the Fog must set.',
  ],
  AN3: [
    'The doc counts 108 names returned across runs (a Save flag). It is built on the names returned in this run only: four pages (the Shuppet and three later spirits), and Spiritomb comes once three are back.',
    'Spirits come one per region (QUESTLINES_PLACED.md: each region\'s Stage 3), not one per stage as the script says.',
    'The Odd Keystone filling (the Story ledger\'s Spiritomb form change) is not built here; the finale gives the Spiritomb itself.',
  ],
};

export const CHECKED: Record<string, string> = { AN1: '2026-11-15', AN2: '2026-11-15' };

const BATH = { pokemon: 'indeedee-female', tint: '#1e2238' };

export const EVENTS: Json[] = [
  // ---------------- AN1. The Bathhouse at the Edge of Night (Door) ----------------
  ev('an01-bathhouse', 'The Bathhouse at the Edge of Night', AN, { rarity: 'rare', minStage: stageOf('A4'), types: tagTypes('water'), ...BATH, effect: 'fog',
    remembers: [{ id: 'festival-stall', when: [flagIs('festival-stall-ate')], notice: 'The Indeedee leans in and sniffs your sleeve: fried dough, burnt sugar, something sold on a stick at a festival stall. Its nose wrinkles. "Not here, you don\'t."' }] },
    'At dusk you come to a river you have crossed before, and there is a bridge over it that was not there this morning. It is red, and old, and dry, though the river is high. On the far side: lanterns, a long tiled roof, steam rolling off it into the dark. You are halfway over before you decide to be. At the door stands an Indeedee in a starched apron, holding a ledger. "You\'re early. Or you\'re human. Either way, you\'ll have to work." It turns a page. "Guests here are spirits. They come to wash off the day. Some of them have very long days." It looks at you over the ledger. "Work until dawn and you can cross back. Don\'t eat the food."',
    [
      ch('I\'ll work.', out('The Indeedee does not smile, but it writes something in the ledger, and when you read it upside down it is your name. It hands you an apron that fits exactly. Behind it, the whole bathhouse breathes out steam, like something that has been waiting for you.', flag('bath-worked'), room('an01-apron'))),
      ch('I\'m leaving.', out('You turn round. There is no bridge. There is the river, wide and black, and the far bank where you stood a minute ago, very small and very far. Behind you the Indeedee waits without hurrying, as if this happens every night. It probably does.', room('an01-bridge-gone'))),
      ch('What happens if I eat the food?', out('The Indeedee closes the ledger on one finger, to keep its place, and gives the question its full attention.', flag('bath-warned'), room('an01-the-food'))),
    ]),
  ev('an01-apron', 'Sleeves Up', AN, { room: true, ...BATH, effect: 'fog' },
    'The Indeedee walks fast and talks faster. Corridors of steam, paper doors, the smell of cedar and hot stone. Shapes pass you in the mist with towels over their shoulders. "Three shifts. The big tub on the lower floor: a guest came in muddy and it is getting worse. Then the tea room. Then the front desk: somebody has lost their name, and it is upsetting the others." It stops at a door that is shaking slightly on its runners. "Start here."',
    [
      ch('Roll up your sleeves.', out('You roll them up. The Indeedee watches, approves of the second fold and not the first, and slides the door open. A wave of brown, cold air rolls out over your shoes.', room('an01-tub'))),
    ]),
  ev('an01-bridge-gone', 'No Bridge', AN, { room: true, ...BATH, effect: 'fog' },
    'The Indeedee comes and stands beside you and looks at the place where the bridge was. "It comes at dusk and goes when someone is inside. It comes back at dawn." It does not say "I told you." It holds out an apron, folded in four. "Everybody who tries to leave says they are not staying. Then they work. Then they cross back. It is a good system. It has never once failed."',
    [
      ch('Take the apron.', out('It fits exactly, which is the strangest thing so far. The Indeedee is already walking. "The big tub first. Sleeves up. Mind the step: it is older than you."', room('an01-tub'))),
    ]),
  ev('an01-the-food', 'The Way Back', AN, { room: true, ...BATH, effect: 'fog' },
    '"You forget the way back," says the Indeedee. It does not lower its voice. It is not a threat. It is a fact, the way the river being wet is a fact. "Guests eat. Guests are already where they are going. You are not." Somewhere inside a gong sounds, and the smell of something sweet and fried drifts past. Your stomach answers it out loud. The Indeedee pretends not to hear. "Now. Will you work?"',
    [
      ch('I\'ll work.', out('It nods once, writes your name in the ledger and hands you an apron. "Good. The big tub first. And if a guest offers you a dumpling, you are allergic."', flag('bath-worked'), room('an01-tub'))),
      ch('And if I\'d rather leave?', out('You glance back over your shoulder. There is no bridge. There is only the river, black and wide. "It comes back at dawn," says the Indeedee, and hands you an apron, folded in four. "Everyone works."', room('an01-tub'))),
    ]),
  ev('an01-tub', 'The River Guest', AN, { room: true, pokemon: 'palossand', tint: '#2a2418', effect: 'rain',
    remembers: [
      { id: 'river-cleaned', when: [seen('volunteer-cleanup')], notice: 'The guest lifts its head. Under the mud, two eyes open, and they know you. You waded into it once this run, with bin bags and gloves, and pulled things out of it. It sighs, a long river sigh, and some of the mud simply slides off by itself.', hide: [0], addChoices: [
        ch('Pick up where you left off.', out('It leans into the brush like an old dog. The mud comes away in sheets. Under it: a bicycle, a fridge, and, wound round and round with fishing line in the very middle, a small Feebas that has been holding its breath for a long time. You cut the line. It slips away into the guest, which is clear water now, clear to the stones. The guest stands, shakes itself, and leaves on the tiles one pellet of clean grey silt. Then it is gone, and somewhere below you hear water running fast and clean.', item('silt-pellet'), fr(3), flag('an01-river-scrubbed'), room('an01-tea'))),
      ] },
      { id: 'factory-shut', when: [flagIs('factory-shutdown')], notice: 'The guest smells of a factory pipe, but the smell is old. It lifts its head and looks at you, and you understand that the pipe is cold now. You are the one who shut it. It sighs, and some of the mud simply slides off by itself.', hide: [0], addChoices: [
        ch('Pick up where you left off.', out('It leans into the brush like an old dog. The mud comes away in sheets. Under it: a bicycle, a fridge, and, wound round and round with fishing line in the very middle, a small Feebas that has been holding its breath for a long time. You cut the line. It slips away into the guest, which is clear water now, clear to the stones. The guest stands, shakes itself, and leaves on the tiles one pellet of clean grey silt. Then it is gone, and somewhere below you hear water running fast and clean.', item('silt-pellet'), fr(3), flag('an01-river-scrubbed'), room('an01-tea'))),
      ] },
    ] },
    'The lower floor is one enormous wooden tub, and in it sits a guest so caked in mud you cannot tell what shape it is. A Ghost-type, you think, from the cold coming off it. It is also, somehow, a river. Brown water runs off it and does not stop. It smells of drains and diesel and old weed. It does not look at you. It looks very tired of being looked at. "Scrub," says the Indeedee from the door. "Hard. It will not mind. It will not say thank you either."',
    [
      ch('Scrub it clean.', out('You put your back into it, and it gives. Under the mud: a bicycle. You haul it out. A fridge. A trolley wheel. And in the very middle, wound round and round with fishing line, a small Feebas that has been holding its breath for a very long time. You cut the line. It slips away into the guest, which is clear water now, clear to the stones. The guest stands, shakes itself, and leaves on the tiles one pellet of clean grey silt. Then it is gone, and somewhere far below you hear water running fast and clean.', item('silt-pellet'), flag('an01-river-scrubbed'), room('an01-tea')),
        { prompt: { id: 'pull-hold', needs: 'ok' }, fail: out('The mud fights back. It gets in your hair, your ears, your lead Pokémon\'s fur. It takes all night that you have, and some you do not. But a bicycle comes out, and a fridge, and at last, tangled in fishing line, a small Feebas, which you cut free. The guest stands up clear to the stones and leaves you one pellet of clean grey silt. You and your lead are wrung out.', item('silt-pellet'), hurtLead(0.25), flag('an01-river-scrubbed'), room('an01-tea')) }),
      ch('Scrub it with a Water-type.', out('Your Water-type climbs into the tub as if it owned it and starts to churn. The river guest goes very still, then leans in: it has not felt clean water against it for years. The mud lifts in clouds. Out comes a bicycle, a fridge, and a small Feebas wound in fishing line, which you cut free. The guest stands, clear as glass, and leaves one pellet of clean grey silt on the tiles. Your Water-type does not want to get out.', item('silt-pellet'), fr(5, { types: ['water'] }), flag('an01-river-scrubbed'), room('an01-tea')), { requires: [anyType('water')] }),
    ]),
  ev('an01-tea', 'The Fussiest Cup', AN, { room: true, pokemon: 'sinistea', tint: '#2a1e2e', effect: 'float' },
    'The tea room is low tables and paper lanterns, and every cup on the shelf is a Sinistea. Most of them are asleep. One is not. It sits in a chipped antique cup with a crack in the glaze, and it has opinions. The water is too hot. Now it is too cold. That leaf is the wrong leaf. A guest in a grey shawl has been waiting an hour for it to agree to be poured. "This one," says the Indeedee, "is very old, and very fussy, and very good. Serve the guest."',
    [
      ch('Let it steep as long as it likes.', out('You sit down on the floor and wait. So does the guest. It takes a long time. When the Sinistea finally tips itself and pours, the tea is the colour of a sunset and smells of rain on a hot road. The guest drinks with both hands and closes its eyes. Over the rim of its cup, the Sinistea watches you. It has decided something about you.', flag('an01-tea-patient'), room('an01-lost-name'))),
      ch('Ask it how it wants to be poured.', out('Nobody has asked it before. It rattles, startled, then rattles in a different, more particular way, and you work it out between you: the left hand, the third cushion, the kettle just off the boil, a small bow first. The tea is perfect. The guest weeps a little and does not say why. The old Sinistea looks very pleased with itself, and with you.', flag('an01-tea-asked'), room('an01-lost-name'))),
      ch('Pour it yourself, quickly.', out('It is not happy. It sloshes. The tea is fine, more or less, and the guest is too tired to mind. But the old Sinistea turns its cup so the crack faces you, which the Indeedee tells you later is the worst thing a teacup can do to a person.', flag('an01-tea-hurried'), room('an01-lost-name'))),
    ]),
  ev('an01-lost-name', 'The Guest Without a Name', AN, { room: true, ...BATH, effect: 'flicker' },
    'At the front desk a guest is standing very still. It is pale and thin as steam and has no face to speak of, and the other guests step round it uneasily. "It came in with the others and signed nothing," the Indeedee says quietly. "Now it cannot remember what it is called. Without a name it cannot leave. Without leaving, it starts to fade." The guest turns toward you. Something in it is listening very hard. "Find it. Before dawn."',
    [
      ch('Search the guest book.', out('Page after page of names in a hundred hands. Near the bottom of one page is only a smudge, as if someone began to write and was called away. You hold it to the lantern. Under the smudge, pressed into the paper: four letters. You read them out loud. The guest flickers hard, like a candle in a doorway, and then it has a face. It is smiling, and it is much younger than you thought.', flag('an01-name-found'), room('an01-dawn'))),
      ch('Ask it what it remembers.', out('"Water," it whispers, if steam can whisper. "A bridge. Somebody calling me in for supper." You ask what they called. It does not know. You ask what the somebody sounded like. "Like you," it says, and slowly it says its own name back in your voice, and hears it. It has a face again. It is somebody\'s child, who wandered off a long time ago and has worked here ever since, waiting to be called in.', flag('an01-name-found'), fr(2), room('an01-dawn'))),
      ch('Ask the other guests.', out('The guests are shy, and then they are not. One remembers it sat by the window. One remembers it always took the last bath. Then the old Sinistea from the tea room rattles across the floor in its cup and says, very firmly, a single word. Everyone goes quiet. The guest straightens. That was it. That was its name. The Sinistea looks at you as if you owe it one.', flag('an01-name-found'), flag('an01-cup-helped'), room('an01-dawn'))),
    ]),
  ev('an01-dawn', 'The Bridge at Dawn', AN, { room: true, ...BATH, effect: 'sparkle',
    remembers: [
      { id: 'tea-hurried', when: [flagIs('an01-tea-hurried')], notice: 'The old Sinistea still has its crack turned toward you. It has not forgiven the pouring. It is, however, still sitting on the step.', hide: [0], addChoices: [
        ch('Say sorry to the cup.', out('"I was in a hurry. I\'m sorry." It thinks about this for a long, long time. Then it turns round, tips toward you a fraction, and lets you carry it, very carefully, over the bridge. It will take a while to forgive you properly. It has time. Teacups always do. Behind you the lanterns go out one by one.', gain('sinistea'), flag('an01-cup-came'), moment('You worked a night in the bathhouse at the edge of night, and came back over the bridge at dawn with a teacup that had opinions.', 70))),
      ] },
      { id: 'did-not-eat', when: [flagIs('bath-warned')], notice: 'The Indeedee glances at your hands, then at your mouth. "You didn\'t eat." It nods, once. From an Indeedee, that is a medal.' },
    ] },
    'Grey light at the paper windows. The steam thins. The Indeedee takes your apron, folds it in four and puts it on a shelf with a great many others. "Dawn. The bridge is back." It walks you to the door. The river guest\'s pellet is in your pocket, still warm. On the step, in its chipped antique cup, sits the old Sinistea from the tea room. It has its back to you, very pointedly, in the way of something that wants to be asked.',
    [
      ch('Ask the cup to come with you.', out('You crouch and ask. It turns round slowly, as if it had only just noticed you. It rattles, very particularly: left hand, third pocket, not too fast. You carry it out over the bridge exactly so. Behind you the lanterns go out one by one. The Indeedee does not wave. When you look back from the far bank there is no bridge, only morning on the river, running clean.', gain('sinistea', { bond: 20 }), flag('an01-cup-came'), moment('You worked a night in the bathhouse at the edge of night, and came back over the bridge at dawn with a teacup that had opinions.', 70))),
      ch('Leave it with its tea room.', out('You bow to it, the way you saw the guests do. It turns round. It bows back, a little, which costs a cup a great deal. The Indeedee presses a twist of tea leaves into your hand for the road, the good ones, the ones the old cup lets nobody else touch. You brew them on the far bank. Your whole team sleeps like stones. When you look back there is no bridge.', heal(1), fr(3), moment('You worked a night in the bathhouse at the edge of night, and crossed back at dawn.', 60))),
    ]),

  // ---------------- AN2. The Spore Doctor (Stage-Three: steps 6, 12, 17) ----------------
  ev('an02-spore-doctor', 'The Spore Doctor', AN, { rarity: 'uncommon', minStage: stageOf('A3'), types: tagTypes('forest'), cast: ['trainer.pr/doctor_m'], pokemon: 'morelull', tint: '#16222a', effect: 'fog',
    remembers: [{ id: 'bell-in-the-fog', when: [flagIs('fog-named')], notice: 'At your belt, the guide\'s bell from the fog stirs on its own. Its note goes out into the village and meets the ringing halfway. For one long breath both sounds stand still. Then they fold into each other and are gone. Along the street, one by one, people take their hands from their ears.', addChoices: [
      ch('Let the bell ring.', out('You hold it up and let it ring once more. The silence after is soft and whole. The villagers fall asleep where they sit, on doorsteps and benches, smiling like children. Under the trees the Morelull glow on, singing to nobody, unharmed. The doctor stares at your bell for a long time. "I have walked a long way," he says, "and I have never seen that." He writes it down in a small book.', flag('an02-bell-quieted'), fr(3), later('an02-far-road', 5))),
    ] }] },
    'The village is awake at noon and has been awake all night. People sit on their doorsteps with their hands over their ears. "Can you hear it?" a woman asks you. When you say no, she starts to cry: nobody from outside ever can. A man in a long coat sits on the well with a wooden box on his back, listening with his eyes shut. "It isn\'t a curse. It\'s a spore. It lives in sound." He points at the woods, where something glows soft and blue under the trees. "It\'s not cruel. It just doesn\'t know we\'re here. Things like this never do." He opens his eyes. "I can drive it out or move it somewhere it won\'t bother anyone. Help me decide."',
    [
      ch('Drive it out.', out('He nods and does not argue. He takes a lamp from his box and walks into the woods, and you go with him. Under the trees a colony of Morelull glows blue in a ring, swaying, singing a note nobody in the village asked to hear. He sets the lamp down among them. The fire takes them quickly. The ringing stops all at once, and the whole village sighs in its sleep. The doctor does not speak for an hour. When he does, it is only: "That was the right thing. It usually is. I still don\'t like it."', flag('an02-driven-out'), later('an02-far-road', 5))),
      ch('Move it.', out('He almost smiles. From his box he takes a glass jar as big as a lantern. Under the trees the Morelull colony glows in a ring, swaying, and he coaxes them in one by one with a low hum, until the jar is full of soft light and the ringing is inside it, muffled, like a bell under a blanket. He puts it in your arms. "There\'s a cave three hops down the road. Dark, wet, nobody to hear. Carry it gently. It will sing the whole way."', flag('an02-moved'), later('an02-spore-cave', 3))),
      ch('Can it stay?', out('He looks at you for a long moment. Then he goes from door to door with you and tells them what it is. He shows them the colony glowing under the trees, small and harmless, swaying as it sings. A child says it sounds like a lullaby if you stop being cross with it. That night the village sleeps for the first time in a week, with the ringing all round them. On the well, the doctor smiles. It is the first time he has. It changes his whole face.', flag('an02-let-stay'), fr(3), later('an02-far-road', 5))),
    ]),
  ev('an02-spore-cave', 'The Jar That Sings', AN, { room: true, requires: [flagIs('an02-moved')], pokemon: 'morelull', tint: '#101c26', effect: 'sparkle' },
    'Three hops down the road, as he said, a cave opens in the hillside: dark, wet, quiet as the inside of a shell. The jar has sung the whole way. It has grown warmer, too, and once when you stumbled it went very dim, and only brightened again when you said sorry to it out loud. Inside the cave the dark is total, except for you and the jar of soft blue light in your arms.',
    [
      ch('Set the jar down in the dark.', out('You unscrew the lid. The Morelull pour out across the wet stone like spilled light. They find the walls and climb them, and in a minute the whole cave is a blue sky full of small swaying stars. The ringing goes up into the rock and comes back changed: a hum, a hush. Out on the road it fades to nothing. One Morelull stays on the rim of the empty jar, looking at you, until you leave.', flag('an02-cave-glowing'), later('an02-far-road', 2))),
      ch('Hum to it first.', out('You do not know the song, so you hum anything. The jar brightens. When you open the lid the colony pours out slowly, as if it would like to stay with you a little longer. They climb the walls and turn the cave into a night sky. The ringing goes up into the rock and comes back as a hush. One Morelull sits on your shoe and will not get off until you set it down by the others, gently.', flag('an02-cave-glowing'), fr(2), later('an02-far-road', 2))),
    ]),
  ev('an02-far-road', 'A Coat at the End of the Road', AN, { room: true, cast: ['trainer.pr/doctor_m'], tint: '#1e2a22', effect: 'none' },
    'Days on, on a long straight road, you see a coat at the far end of it. A long coat with a wooden box on its back, walking away from you at a steady, patient pace, the pace of someone who has walked every road in every region and expects to walk them again. You would know it anywhere. The spore doctor has not seen you yet.',
    [
      ch('Catch him up.', out('You run. He hears you coming and stops, and does not seem surprised. "I wondered if you would." He is on his way to a farm where a Paras has stopped moving. "Come and help me decide again. You were good at it."', room('an02-paras'))),
      ch('Let him walk.', out('You raise a hand. At the far end of the road, without turning round, he raises his. Then the road bends, and he is gone. You have a feeling he will turn up again. The roads are not as many as they look.', flag('an02-waved'), later('an02-last-road', 5))),
    ]),
  ev('an02-paras', 'The Paras in the Barn', AN, { room: true, cast: ['trainer.pr/doctor_m'], pokemon: 'paras', tint: '#2a2016', effect: 'none' },
    'A farm at the edge of a wood. In the barn, on a bed of straw, lies a Paras whose mushrooms have grown so big it cannot stand. The farmer\'s daughter sits beside it with her knees pulled up. "It was fine in the spring." The doctor kneels in the straw. "The mushroom is doing what mushrooms do. It doesn\'t know the Paras is there." He looks up at you. "I can cut them back, and they\'ll grow again. Or I can let it change into what it was always going to be. Help me decide."',
    [
      ch('Cut them back.', out('He works with a small silver knife, slowly, the way you would cut someone\'s hair. The Paras stands up on its little legs, wobbles, and walks straight into the girl\'s lap. "Every spring," the doctor tells her. "Not too much. Not too little. You\'ll learn." She is already learning. She is watching his hands.', flag('an02-paras-trimmed'), later('an02-last-road', 5))),
      ch('Let it change.', out('"Then we wait," he says, and you wait, all three of you, in the straw. Near dawn the Paras shivers. The mushrooms open like a coat, and something larger stands up in the barn: a Parasect, slow and calm and not hurting any more. The girl cries. The doctor puts a hand on her shoulder and says nothing at all, which is exactly right.', flag('an02-paras-changed'), later('an02-last-road', 5))),
      ch('Ask the girl.', out('"I want it to stay my Paras," she says. Then, smaller: "But I don\'t want it to hurt." The doctor smiles at you over her head. He cuts them back a little, shows her how, and leaves her the silver knife. "Next spring it\'s your decision. You\'re the one who knows it."', flag('an02-paras-asked'), fr(2), later('an02-last-road', 5))),
    ]),
  ev('an02-last-road', 'It Glows When Something Is Wrong', AN, { room: true, cast: ['trainer.pr/doctor_m'], pokemon: 'morelull', tint: '#121e1c', effect: 'glint',
    remembers: [
      { id: 'from-the-fire', when: [flagIs('an02-driven-out')], notice: '"It was in my box when I got back to the road," he says. "From the colony we burned. One got away, and it came to me, of all people." He does not say what he could not do then. He does not have to.' },
      { id: 'from-the-cave', when: [flagIs('an02-cave-glowing')], notice: '"It followed the empty jar out of the cave," he says. "All that way down the road, on its own. It must have liked how you carried it."' },
      { id: 'from-the-village', when: [flagIs('an02-let-stay')], notice: '"The village sent it after me," he says. "Wrapped in a scarf, with a note. The note says it sings them to sleep, and they can spare one."' },
    ] },
    'Dusk, at the edge of a dark wood. The doctor is waiting where the road goes in, as if you had arranged to meet. He swings the box off his back and opens it. Inside, on a bed of moss, sits a single Morelull, glowing a slow, steady blue. As you step nearer the wood, it flares bright, and the trees beyond go quiet. "It glows when something is wrong," he says. "Something is wrong in there. Something always is." He holds the box out to you. "It should be with someone who walks into places. I mostly walk past them."',
    [
      ch('Take the Morelull.', out('It climbs out of the box onto your shoulder and dims to a soft, pleased glow. The doctor shuts the empty box and settles it on his back. "It will warn you. Listen to it." Then he walks into the dark wood alone. The Morelull flares once, and when nothing happens, settles. Every now and then, for the rest of the run, at the far end of some road, you see a long coat.', gain('morelull', { bond: 10 }), item('morelull-glow'), flag('an02-morelull'), moment('A spore doctor in a long coat gave you a Morelull that glows when something is wrong.', 65))),
      ch('Walk into the wood with him (a node).', out('The Morelull rides on your shoulder and you go in together: the doctor, you and the light. Something is wrong in there, a pool gone sour, a nest of Foongus spitting at nothing. He sees to it. You hold the light. On the far side of the wood he says, "You keep it. You\'ll need it more than me," and walks on. Every now and then, at the far end of some road, you see a long coat.', takeNode(), gain('morelull', { bond: 20 }), item('morelull-glow'), flag('an02-morelull'), moment('You walked into a dark wood beside the spore doctor, and came out with a Morelull that glows when something is wrong.', 65))),
    ]),
];

export const REMOVE: string[] = [];
