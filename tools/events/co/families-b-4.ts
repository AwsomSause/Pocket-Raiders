// Catalog Overhaul, families-b (STORY_FAMILIES_6.md, "Covers": the road chains): the 26 two-step callbacks (REVISE).
// Ledger: "the second stage is the point. Each second stage now references what the player actually did in the first."
// Step 1 sets `ovc-<id>` and starts the `ovt-<id>` node timer (core/overhaul/chains.ts), so step 2 keeps its old window
// (it comes back a few nodes later, from oldPlacement.json). Step 1's choice is remembered in a short flag; step 2 reads it.
import { BERRIES, TYPE_ITEMS, any, ch, egg, fight, flag, flagIs, fr, front, good, has, hasAny, heal, item, join, lose, loseOne, money, out, peace, ptype, rest, rp, scout, trainer, wild, type Json } from '../dsl.ts';
import { moment, rem } from './_fb.ts';

export const CATEGORY = 'families-b';

const cash = (amount: number): Json => ({ kind: 'money', amount });
/** Step 1 of a road chain: every outcome starts the chain's timer, so step 2 always comes back. */
const go = (key: string): Json[] => [flag(`ovc-${key}-s1`), flag(`ovt-${key}-s1`, 0)];
const withGo = (key: string, c: Json): Json => {
  const add = (o: Json | undefined) => (o ? { ...(o as object), effects: [...((o as { effects?: Json[] }).effects ?? []), ...go(key)] } : o);
  const choice = c as { success: Json; failure?: Json };
  return { ...(c as object), success: add(choice.success), ...(choice.failure ? { failure: add(choice.failure) } : {}) };
};
interface Two {
  types?: string[];
  pokemon?: string;
  tint?: string;
  fx?: string;
  intro1: string;
  c1: Json[];
  intro2: string;
  /** Step 2 opens differently for what you did in step 1: [flag, opening]. First match wins (up to 3). */
  by: [string, string][];
  c2: Json[];
  pokemon2?: string;
}
const two = (key: string, name: string, o: Two): Json[] => [
  {
    id: `ovc-${key}-s1`, name, ...(o.types ? { types: o.types } : {}),
    scene: { cast: [], ...(o.pokemon ? { pokemon: o.pokemon } : {}), ...(o.tint ? { tint: o.tint } : {}), effect: o.fx ?? 'none' },
    intro: o.intro1,
    choices: o.c1.map((c) => withGo(key, c)),
  },
  {
    id: `ovc-${key}-s2`, name, ...(o.types ? { types: o.types } : {}),
    scene: { cast: [], ...(o.pokemon2 ?? o.pokemon ? { pokemon: o.pokemon2 ?? o.pokemon } : {}), ...(o.tint ? { tint: o.tint } : {}), effect: 'none' },
    intro: o.intro2,
    choices: o.c2,
    remembers: o.by.slice(0, 3).map(([f, intro], i) => rem(`${key}-${i}`, [flagIs(f)], { intro })),
  },
];

const ROADSIDE = two('roadside-stand', 'The Roadside Stand', {
  types: ['grass'], pokemon: 'skiddo', tint: '#3a4a24',
  intro1: `A crate by the road, a hand-painted sign: BERRIES, 100. Behind it sits a girl of about eight, and a Skiddo chewing the sign. You hold out a 500 note. Her face falls. She has 60 in change.`,
  c1: [
    ch('"Keep the change."', out(`Her eyes go round. "All of it?" She counts the berries into your hands twice, very carefully, so you get your money's worth. The Skiddo watches you leave like you are a hero.`, cash(-100), good(1), flag('rs-kept')), { requires: [money(100)] }),
    ch('Wait while she makes change.', out(`She runs to a farmhouse and back, twice. The Skiddo keeps you company and eats a corner of your map. In the end she hands you exactly 400, damp, and one extra berry "for waiting."`, item('pecha-berry'), flag('rs-waited'))),
    ch('Offer one of your berries in trade.', out(`You trade a berry from your bag for one of hers. She holds yours up to the light like a jewel. "I've never seen this kind. I'm going to plant it." She means it.`, loseOne(...BERRIES, 'pecha-berry', 'cheri-berry', 'chesto-berry', 'rawst-berry', 'aspear-berry', 'leppa-berry'), flag('rs-seed')), { requires: [hasAny(...BERRIES, 'pecha-berry', 'cheri-berry', 'chesto-berry', 'rawst-berry', 'aspear-berry', 'leppa-berry')] }),
  ],
  intro2: `A rest stop, a new crate, a new sign: JAM. It's the berry girl. Her Skiddo has a ribbon now. She spots you and waves with both arms.`,
  by: [
    ['rs-kept', `It's the berry girl, with a new sign: JAM. "You!" she shouts. "Your change bought the jars. I'm in business!" Her Skiddo bleats like it agrees.`],
    ['rs-waited', `It's the berry girl, with a new sign: JAM. "I have change now," she says proudly, and rattles a whole tin of coins at you.`],
    ['rs-seed', `It's the berry girl, with a new sign: JAM. Beside the jars is a pot, and in the pot is a green shoot. "That's yours," she says. "It's growing."`],
  ],
  c2: [
    ch('Buy a jar.', out(`It is sticky, lumpy and very good. Your team shares it at the next fire, licking it off their noses. For a while nobody is tired.`, cash(-100), heal(0.5), fr(3)), { requires: [money(100)] }),
    ch('Ask how business is.', out(`"Good! A Ranger bought six jars." She lowers her voice. "I'm saving for a Poké Ball. For Skiddo, so it's official." She gives you a jar for listening, and won't take money.`, heal(0.5), good(1))),
    ch('Look at the shoot.', out(`It has two leaves and a third coming. She has written your name on the pot in crayon. "When it fruits, the first one's yours. Even if you're far away. I'll keep it."`, fr(5, 'lead'), moment('A girl at a roadside stand is growing a berry plant from the berry you traded her. Your name is on the pot.', 55)), { requires: [flagIs('rs-seed')] }),
  ],
});

const LOST_HAT = two('lost-hat', 'The Lost Hat', {
  types: ['flying'], tint: '#4a5a6a', fx: 'float',
  intro1: `A gust comes off the hill and a straw hat sails past your head, over the path and into the tall grass. Up the road, a trainer is running, one hand on his head where the hat was.`,
  c1: [
    ch('Send a Pokémon after it.', out(`Your lead plunges into the grass and comes back proud, the hat in its mouth, only a little chewed. The trainer laughs so hard he has to sit down. "My dad's hat," he says. "Thank you."`, fr(5, 'lead'), flag('hat-returned'))),
    ch('Wade in yourself.', out(`Grass to your waist, burrs in your socks. You find the hat on a Bellsprout, which is wearing it. Getting it back takes a berry and an apology. The trainer has already gone on, but you keep it safe.`, flag('hat-kept-safe'))),
    ch('Let the wind have it.', out(`The hat lifts again, higher, and is gone over the hill. The trainer stops, watches it go, and shrugs. It looks like a shrug that costs him something.`, flag('hat-gone'))),
  ],
  intro2: `A rest stop by a well. A trainer sits on the wall, bareheaded, squinting into the sun. You know him: the one who lost his hat.`,
  by: [
    ['hat-returned', `A rest stop by a well. A trainer in a slightly chewed straw hat waves you over. "My lucky hat's rescuer!" He is already reaching into his bag.`],
    ['hat-kept-safe', `A rest stop by a well. A trainer sits on the wall, bareheaded, squinting into the sun. In your pack, you still have his hat.`],
    ['hat-gone', `A rest stop by a well. A trainer sits on the wall, bareheaded and sunburned. He sees you and smiles anyway. "Hey. The hat person."`],
  ],
  c2: [
    ch('Give him back his hat.', out(`He turns it over in his hands, finds the Bellsprout's tooth marks, and goes quiet. "Dad wore this up every mountain in the region." He puts it on. He gives you the only thing in his pockets of any value.`, any(...TYPE_ITEMS), good(1)), { requires: [flagIs('hat-kept-safe')] }),
    ch('Sit with him a while.', out(`He tells you about his dad, who walked these roads with a Pidgeotto and that hat. Your team naps in the shade. When you stand to go, everyone feels lighter.`, heal(0.4), fr(3)), { requires: [flagIs('hat-returned')] }),
    ch('Lend him something for the sun.', out(`You give him a cloth and he ties it on like a bandana. He looks ridiculous and happy. "I'll walk with my head up," he says. "Dad would like that better than a hat, anyway."`, good(1), peace(1))),
    ch('Battle him for old times\' sake.', fight(`"Sure," he says, standing. "Dad always said a battle tells you more than talk."`, trainer('Hatless Trainer', { size: 3, win: [cash(400)] }))),
  ],
});

const FISHERMAN = two('fisherman-tip', 'The Fisherman\'s Tip', {
  types: ['water'], pokemon: 'magikarp', tint: '#24445a',
  intro1: `An old man on a pier, rod out, bucket empty. "Nothing's biting," he says without turning round. "Forty years on this pier. Never this quiet." He sounds less angry than afraid.`,
  c1: [
    ch('Let a Water-type look under the pier.', out(`Your Pokémon slips into the water and comes back up tangled in old netting. Under the pier, a wall of it, and fish trapped behind. You cut it free together. The bay breathes again.`, flag('fish-net'), good(1)), { requires: [ptype('water')] }),
    ch('Share some bait.', out(`You give him half a sandwich for bait. He gives you a long look and a short lesson: cast past the weeds, wait for the pull, not the nibble. "Thought nobody listened any more."`, flag('fish-bait'))),
    ch('Tell him the fish will come back.', out(`"Maybe," he says. "Maybe they will." He keeps watching the water. You leave him there, the line still, his hands very steady.`, flag('fish-hope'))),
  ],
  intro2: `Out on the water, a little boat. A man is standing up in it, waving both arms at you, something huge and shining held up in one of them.`,
  by: [
    ['fish-net', `The old fisherman stands up in his boat and waves. In his hand is a fish as long as his arm. "The net!" he shouts across the water. "Whole bay's come back!"`],
    ['fish-bait', `The old fisherman stands up in his boat, holding up a fat, shining catch. "Past the weeds!" he shouts. "Wait for the pull!" He is laughing.`],
    ['fish-hope', `The old fisherman stands up in his boat, holding up a catch. "You were right!" he calls. He looks younger than he did.`],
  ],
  c2: [
    ch('Wave back.', out(`He rows over and presses a wrapped package into your hands: a lure he made himself, and a small heavy pearl he found in the catch. "For the luck," he says. "You brought some."`, item('pearl'), flag('fish-done'))),
    ch('Ask him to teach you.', out(`An hour in the boat. He talks about the bay like an old friend. When you climb out, one of your Pokémon has caught something too, and is very proud.`, rp(15), fr(5, { types: ['water'] }))),
    ch('Ask what he will do now.', out(`"Fish," he says. "Teach my granddaughter. Keep the pier clean." He looks at the water a long time. "Thought I'd outlived it. Turns out I didn't."`, peace(1), item('net-ball', 2)), { requires: [flagIs('fish-net')] }),
  ],
});

const LOST_CHILD = two('lost-child', 'The Lost Child', {
  pokemon: 'pichu', tint: '#4a4030',
  intro1: `A small boy in a big coat stands in the middle of the road, holding a Pichu so tight it squeaks. He isn't crying. He's trying very hard not to. "I lost my mum," he says. "Pichu lost her too."`,
  c1: [
    ch('Walk him back the way he came.', out(`He holds your sleeve the whole way. Two hills back, a woman is running down the road calling his name. She grabs him up so hard the Pichu squeaks again. She doesn't get your name.`, good(1), flag('child-walked'), flag('kind-helped-stranger'))),
    ch('Let your Pokémon find her by scent.', out(`Your lead sniffs the Pichu, then the boy's coat, then the wind. It sets off at a trot. Ten minutes later it's sitting at the feet of a frantic woman, very pleased with itself.`, fr(5, 'lead'), good(1), flag('child-tracked'), flag('kind-helped-stranger'))),
    ch('Point him to the next town.', out(`"The Pokémon Center will find her," you tell him. He nods, very serious, and walks off with his Pichu. You watch him until he is small. It is a long road for small legs.`, flag('kind-walked-past'), flag('child-pointed'))),
  ],
  intro2: `A courier's Pidgey lands on your pack, a little envelope tied to its leg. Inside: a note in careful grown-up writing, and a drawing in crayon.`,
  by: [
    ['child-walked', `A courier's Pidgey lands on your pack with an envelope. A note: "You walked him home and didn't stay to be thanked. So we're thanking you anyway." And a crayon drawing of you, very tall.`],
    ['child-tracked', `A courier's Pidgey lands on your pack with an envelope. In crayon: your lead, drawn huge, with a cape. Underneath, in a mother's hand: "He says it's a superhero now."`],
    ['child-pointed', `A courier's Pidgey lands on your pack with an envelope. A note: "He found us at the Pokémon Center. He said a trainer told him where to go. He was so brave." No drawing. Just that.`],
  ],
  c2: [
    ch('Open the rest of the parcel.', out(`Wrapped in tissue: a rare berry from their family tree, and a line at the bottom of the note: "He's going to be a trainer. Like you."`, item('leppa-berry'), any('lum-berry', 'leppa-berry'), good(1))),
    ch('Write back.', out(`You write a short letter for the Pidgey to carry home: a tip about Pichu, and that you're glad he's safe. The Pidgey takes it like a medal.`, peace(1), fr(3))),
  ],
});

const TINKER = two('tinkering-kid', 'The Tinkering Kid', {
  types: ['electric', 'steel'], pokemon: 'magnemite', tint: '#3a3a4a', fx: 'glint',
  intro1: `A boy with oil on his nose is waving a box of wires at passers-by. "It's a Pokémon detector!" It beeps, sparks, and a Magnemite floats over to see. "It works on Magnemite, anyway."`,
  c1: [
    ch('Help him fix it.', out(`You hold the torch, your Electric-type steadies the current, and he solders. The box gives one clean beep, then another. He looks at you like you hung the moon.`, flag('tinker-fixed'), fr(5, { types: ['electric'] })), { requires: [ptype('electric')] }),
    ch('Tell him it\'s brilliant.', out(`"Really?" He holds it up and it sparks at him. "Really really?" He puts it back in his bag like it's made of glass. "I'm going to make it better. Wait and see."`, flag('tinker-praised'), good(1))),
    ch('Tell him the truth: it doesn\'t work.', out(`His face does something complicated. Then he nods. "Yeah. I know." He takes the back off it right there in the road and starts again.`, flag('tinker-honest'))),
  ],
  intro2: `A beeping comes up the road, steady as a heartbeat. The boy with oil on his nose has a new box. This one has a dial and a little screen.`,
  by: [
    ['tinker-fixed', `The tinkering boy runs up holding a new box. "Your fix! I built the whole new one round it." It beeps, clean as a bell.`],
    ['tinker-praised', `The tinkering boy runs up with a new box, shiny and humming. "You said it was brilliant. So I made it actually brilliant."`],
    ['tinker-honest', `The tinkering boy comes up the road with a new box. "You said it didn't work," he says. "You were right. This one does." He's grinning.`],
  ],
  c2: [
    ch('Try the new gadget.', out(`He straps it to your wrist. It hums, and on the little screen are dots: the wild Pokémon in the grass ahead. "It'll last a stage," he says. "Then it needs a new battery. I'm working on that."`, scout(2), { kind: 'tempEffect', label: 'Gadget scanner', effects: [{ kind: 'preview', what: 'wild' }], battles: 4, until: 'wild' })),
    ch('Ask what he will build next.', out(`He talks for twenty minutes. A Pokédex for blind trainers. A boat that Magnemite can pull. A light that doesn't scare Zubat. You give him a few spare parts from your bag.`, rp(20), good(1))),
  ],
});

const HERBS = two('herb-gatherer', 'The Herb Gatherer', {
  types: ['grass'], pokemon: 'bellossom', tint: '#2e4a2a',
  intro1: `An old woman with a basket on her back and a Bellossom on her hat is trying to reach a plant on a ledge. "Young legs," she says when she sees you. "I'll trade you a handful of herbs for one."`,
  c1: [
    ch('Climb up for her.', out(`You get the plant and scrape both knees. She binds them with something green that stings, then stops hurting completely. "Mint and moss," she says. "And bad language. That helps."`, heal(0.5), flag('herb-climbed'))),
    ch('Send a Pokémon up.', out(`Your nimblest teammate is up and down in seconds. She claps. "Well. That one's a natural." She tucks a sprig behind its ear, and it is unbearably smug.`, fr(5, 'lead'), flag('herb-pokemon'))),
    ch('Help her carry the basket instead.', out(`You carry it a mile to her house. She talks the whole way: which root calms a fever, which leaf a Pokémon will chew when it's sad. You remember more than you expect.`, rp(10), flag('herb-carried'))),
  ],
  intro2: `A rest stop with a low wall, and on the wall a row of clay pots, all green. The herb gatherer is planting them. She has made a little garden for travellers.`,
  by: [
    ['herb-climbed', `The herb gatherer is planting pots on a wall at the rest stop. She looks at your knees first. "Healed clean. Good. Come and help me plant, climbing child."`],
    ['herb-pokemon', `The herb gatherer is planting pots on a wall at the rest stop. Her Bellossom sees your teammate and runs over, delighted. They know each other now.`],
    ['herb-carried', `The herb gatherer is planting pots on a wall at the rest stop. "My basket-carrier! Come. You know which leaf is which now. Prove it."`],
  ],
  c2: [
    ch('Help plant.', out(`An hour with your hands in soil. Your team rolls in it. When you finish, there is a little garden by the road that anyone can pick from. She sends you off with full pockets.`, heal(1), any('pecha-berry', 'cheri-berry', 'chesto-berry', 'rawst-berry'))),
    ch('Ask for a remedy for your team.', out(`She looks at each of your Pokémon in turn, slowly, like a doctor. Then she mixes something bitter in a cup. Everyone drinks it. Everyone sulks. Everyone feels better.`, heal(1), { kind: 'cure' })),
  ],
});

const BACKPACK = two('abandoned-backpack', 'The Abandoned Backpack', {
  tint: '#3a3428',
  intro1: `A backpack by the trail, rain-stained, half open. Inside: a water bottle, a bag of Poké Balls, and a letter that stops mid-sentence. "Dear Sana, I am sorry I left without telling you why. The truth is"`,
  c1: [
    ch('Keep it safe for its owner.', out(`You zip it shut, letter and all, and carry it. It isn't heavy. It feels heavy.`, flag('pack-kept'), good(1))),
    ch('Read the rest of the letter.', out(`There isn't a rest. Just the next page, blank, and a pressed flower. You put it back exactly how it was. You carry the pack. You know a little too much now.`, flag('pack-read'))),
    ch('Take the Poké Balls and leave the pack.', out(`Somebody isn't coming back for them, probably. You take the balls and leave the letter where it lay, open to the rain.`, item('poke-ball', 3), flag('pack-took'))),
  ],
  intro2: `A young man is walking the road slowly, looking in every bush. He has the face of someone who has looked in a lot of bushes.`,
  by: [
    ['pack-kept', `A young man is searching the roadside, slow and hopeless. Then he sees what you're carrying, and stops dead. "That's... that's mine."`],
    ['pack-read', `A young man is searching the roadside. He sees his pack on your back and runs. Then he sees your face, and slows. "You read it," he says. It isn't angry.`],
    ['pack-took', `A young man is searching the roadside. "Have you seen a backpack?" he asks. "There's a letter in it. That's all I care about. The letter."`],
  ],
  c2: [
    ch('Hand it over.', out(`He opens it right there, takes out the letter, and holds it against his chest. "I never sent it. I lost my nerve, then I lost the bag. I thought that was the answer." He takes a breath. "It wasn't." He gives you the Poké Balls.`, item('great-ball', 3), good(1)), { requires: [flagIs('pack-kept')] }),
    ch('Tell him you read it.', out(`You hand him the pack and tell him the truth. He laughs, wet-eyed. "Then you know I have to finish it." He sits down on the verge and starts writing. You leave him with the flower and the pen.`, good(1), peace(1), moment('You found a young man\'s unfinished letter to someone called Sana. He finished it by the roadside.', 55)), { requires: [flagIs('pack-read')] }),
    ch('Tell him where you saw it.', out(`You walk him back to the place. The pack is still there, soaked. The letter is pulp. He kneels, takes the pressed flower out of the mess, and stays kneeling. "It's fine," he says. "I'll say it to her face."`, { kind: 'attribute', key: 'goodEvil', amount: -1 }), { requires: [flagIs('pack-took')] }),
  ],
});

const MERCHANT = two('mysterious-merchant', 'The Mysterious Merchant', {
  tint: '#2a2238', fx: 'flicker',
  intro1: `A hooded merchant steps out from behind a signpost and opens a small velvet case without a word. Three things inside, on black cloth. A price on each, in neat silver writing.`,
  c1: [
    ch('Buy the dull grey stone (500).', out(`It's an Everstone. Nothing more, nothing less. The merchant nods, as if you passed a test you didn't know you were taking.`, cash(-500), item('everstone'), flag('merch-honest')), { requires: [money(500)] }),
    ch('Buy the glowing shard (1500).', out(`It glows in your hand, then stops. A Star Piece. Worth what you paid, maybe a little less. The merchant's hood tips, unreadable.`, cash(-1500), item('star-piece'), flag('merch-paid')), { requires: [money(1500)] }),
    ch('Haggle.', out(`You name half. The hood shakes. You name more. The hood shakes. The case closes with a soft click. "Later," says a voice, very quiet. The merchant is gone.`, flag('merch-haggled'))),
    ch('Walk on.', out(`The case closes. When you look back, the signpost stands alone.`, flag('merch-left'))),
  ],
  intro2: `Behind a signpost, a hood, a velvet case. The merchant again. The case opens. This time there is one thing in it, and no price.`,
  by: [
    ['merch-honest', `The hooded merchant again. The case opens on one thing. A note beside it, silver ink: "For the one who wanted only what they needed. Half price."`],
    ['merch-haggled', `The hooded merchant again. The case opens on one thing. A note in silver: "You argued. Most don't. Name your price."`],
    ['merch-paid', `The hooded merchant again. The case opens. A note in silver: "You paid full price for a pretty thing. Here is a useful one, for less."`],
  ],
  c2: [
    ch('Look at what is in the case.', out(`A small charm, warm to the touch. The note says: Lucky Egg. The merchant takes what you can spare, and not a coin more. When you look up, the hood is already walking away.`, cash(-400), item('lucky-egg')), { requires: [money(400)] }),
    ch('Ask who they are.', out(`The hood turns toward you. For a moment you think you will see a face. Then a Banette's zipper grin flickers in the dark of it, and the case shuts, and there is just the road.`, flag('merch-banette'), rp(10))),
  ],
});

const DIG = two('dig-up', 'The Dig', {
  types: ['ground'], pokemon: 'diglett', tint: '#4a3a24', fx: 'shake',
  intro1: `Your team stops for water and one of them won't stop digging. Paws going, dirt flying, the hole getting deeper and deeper. It has found something. Or it thinks it has.`,
  c1: [
    ch('Help dig.', out(`You get down in the dirt with it. Three feet down: a tin box with a child's things inside. A marble, a badge, a photo of a Diglett. Your teammate looks at you like it knew all along.`, fr(5, { types: ['ground'] }), item('nugget'), flag('dig-helped'))),
    ch('Let it dig alone.', out(`You sit and watch. It digs until it is nothing but a tail. Then it curls up in the hole and sleeps, happy. You don't have the heart to wake it for an hour.`, heal(0.5), fr(3, 'lead'), flag('dig-let'))),
    ch('Call it out and fill it in.', out(`It comes when called, sulking, dirt on its nose. You fill the hole in. It looks back at the spot three times before you're out of sight.`, flag('dig-filled'))),
  ],
  intro2: `The same road, coming back round. Where your teammate dug, the ground has changed.`,
  by: [
    ['dig-helped', `Where you dug together, the hole has become a burrow. A Diglett pokes its head out, sees your teammate, and pops up again and again, like a hello.`],
    ['dig-let', `Where your teammate slept in its hole, there is a den now. Fresh dirt, a little doorway. Something has moved in, and it smells your teammate and comes out to look.`],
    ['dig-filled', `Where you filled the hole in, the earth has been dug out again. Not by you. Small claw marks. Something wanted it open.`],
  ],
  c2: [
    ch('Let your teammate say hello.', out(`It goes nose to nose with the den's new owner. They chitter. When your teammate trots back it is carrying a gift: something round and gleaming from deep underground.`, any('hard-stone', 'soft-sand', 'star-piece'), fr(5, 'lead'))),
    ch('Invite the den\'s owner along.', out(`It thinks about it for a long time, head out of the hole. Then it climbs out and shakes the dirt off and follows. It knows these tunnels. Maybe it wants to know others.`, join({ types: ['ground'] }))),
    ch('Leave it its home.', out(`You leave a berry at the door. Your teammate looks back once. You are fairly sure the den will be there next time you pass, if there is a next time.`, peace(1))),
  ],
});

const RESEARCHER = two('researcher-request', 'The Researcher\'s Request', {
  tint: '#30404a',
  intro1: `A researcher with a cracked camera and a deadline. "I need a photo of a wild Pokémon of one type, in the wild, behaving naturally. My professor wants it by tonight. Please. I'll pay."`,
  c1: [
    ch('Take the camera.', out(`You crouch in the grass for an hour. You get the shot: a Pokémon in the evening light, mid-yawn. It's the best photo you've ever taken. The researcher has gone to meet her professor. You still have the camera.`, flag('photo-good'))),
    ch('Lend your own Pokémon for the photo.', out(`"It has to be wild," she says, then sees your teammate posing. She laughs and takes the picture anyway. "For me. Not the professor."`, fr(5, 'lead'), flag('photo-pet'))),
    ch('Say you are too busy.', out(`She nods, already turning to the next traveller. The road takes you on.`, flag('photo-no'))),
  ],
  intro2: `A tent by the road, papers pinned everywhere with stones. The researcher with the cracked camera, writing fast.`,
  by: [
    ['photo-good', `The researcher sees you and jumps up. "You! The camera!" She takes it, looks at the picture, and is silent. "This is the cover of the paper. This. Your photo."`],
    ['photo-pet', `The researcher waves. Pinned to her tent pole: your Pokémon's portrait. "Best thing I took all trip. The professor hated it. I don't care."`],
    ['photo-no', `The researcher looks up, tired. "Oh. You." Then a smile. "It's fine. Someone helped in the end. I got my photo."`],
  ],
  c2: [
    ch('Let her pay you.', out(`She pays more than she said, and adds a page from her notes: where the type nests on this road, and when. "You'll use it better than I will."`, cash(600), rp(15)), { requires: [flagIs('photo-good')] }),
    ch('Ask about her work.', out(`She talks about migration, about which types follow which rivers. She is so happy to be listened to. You leave with a head full of maps.`, rp(20), scout(1))),
    ch('Ask for a copy of the photo.', out(`She prints it on a little machine and hands it over. Your teammate looks at itself a very long time.`, fr(8, 'lead')), { requires: [flagIs('photo-pet')] }),
  ],
});

const STRAY = two('stray-trainer', 'The Stray Trainer', {
  tint: '#38343a',
  intro1: `A girl with a trainer's cap and no Poké Balls on her belt. "I'm a trainer," she says, before you can ask. "I just don't have a Pokémon yet. Can I battle with you? Just once. Just to know what it's like."`,
  c1: [
    ch('Let her command your lead.', fight(`She calls the moves. She calls them wrong at first, then less wrong, then right. Your lead listens to her. When it ends she is shaking.`, wild({ lv: 0, win: [flag('stray-commanded'), fr(5, 'lead')] }))),
    ch('Battle beside her, side by side.', fight(`You call; she shouts encouragement and points at every move the wild Pokémon makes before it makes it. She sees things.`, wild({ format: 'doubles', lv: 0, win: [flag('stray-beside'), rp(10)] }))),
    ch('Tell her to find her own first.', out(`She nods hard. "I will." You can tell she's going to cry the moment you've gone. You can also tell she means it.`, flag('stray-told'))),
  ],
  intro2: `A girl in a trainer's cap is standing in the middle of the road, chin up, a Poké Ball held out in front of her like a sword.`,
  by: [
    ['stray-commanded', `The girl in the trainer's cap. A Poké Ball on her belt now, and her hand on it. "I caught one. I remembered how your Pokémon listened. Battle me. Properly."`],
    ['stray-beside', `The girl in the trainer's cap. A Poké Ball on her belt. "I saw things," she says. "When we battled together. I still see them. Battle me?"`],
    ['stray-told', `The girl in the trainer's cap. A Poké Ball on her belt. "I found my own." Her voice shakes, just once. "Battle me."`],
  ],
  c2: [
    ch('Accept.', fight(`Her one Pokémon against yours. She has studied. She is not good yet. She is going to be.`, trainer('New Trainer', { size: 1, lv: -2, win: [flag('stray-done'), good(1), cash(200)] }))),
    ch('Give her some Poké Balls instead.', out(`She stares at them. "For the next one," you say. She puts them on her belt one at a time, very carefully, and stands up straighter with each one.`, lose('poke-ball'), good(2), moment('A girl who once had no Pokémon battled her first trainer battle. You gave her Poké Balls for the next one.', 50)), { requires: [has('poke-ball')] }),
  ],
});

const TREE = two('whispering-tree', 'The Whispering Tree', {
  types: ['grass', 'ghost'], tint: '#22302a', fx: 'fog',
  intro1: `An oak older than the road. When the wind moves through it, it sounds like a voice, saying something almost too quiet. Your Pokémon have all gone still and are listening.`,
  c1: [
    ch('Listen.', out(`You stand with your hand on the bark and listen. You almost hear words. Something about waiting. Something about a long time. Your Grass-type is crying, quietly, and won't say why.`, flag('tree-listened'), fr(5, { types: ['grass'] }))),
    ch('Answer it.', out(`You say hello, feeling foolish. The wind stops. Every leaf goes still. Then, very gently, a single acorn drops onto your boot.`, flag('tree-answered'), item('miracle-seed'))),
    ch('Move on quickly.', out(`Your team doesn't want to go. You call them, twice, three times. They come, but they keep looking back at the oak until the road bends.`, flag('tree-left'))),
  ],
  intro2: `Further on, another oak. No. The same oak. Somehow the road has curved back to it. It isn't whispering now. It is waiting.`,
  by: [
    ['tree-listened', `The whispering oak, again. The wind is still. As you come near, a single seed drops from a high branch, falls slowly, and lands in your open hand. You listened. It remembers.`],
    ['tree-answered', `The whispering oak, again. When you come near, the wind rises, and the leaves all say one word together. You think it's your name.`],
    ['tree-left', `The whispering oak, again. The wind moves through it and sounds, very clearly this time, like a sigh.`],
  ],
  c2: [
    ch('Take the seed.', out(`It's warm and smells green. Inside it, if you hold it to your ear, the wind is still whispering. Whatever it says, your Grass-types understand.`, item('miracle-seed'), fr(5, { types: ['grass'], every: true }))),
    ch('Sit under it a while.', out(`Your team sleeps in its roots. You might sleep too. You wake with leaves on you, rested all the way down, and the oak quiet above.`, heal(1), peace(1))),
  ],
});

const TAILOR = two('traveling-tailor', 'The Traveling Tailor', {
  tint: '#4a3040', fx: 'sparkle',
  intro1: `A cart painted every colour, and a man with pins in his mouth. "Scarves! Ribbons! Collars for any Pokémon! I stitch while you wait." He looks your team over with an expert eye. "Ah. That one needs blue."`,
  c1: [
    ch('Let him make something for your lead.', out(`He measures it with a ribbon, pins, cuts, stitches, and in ten minutes your lead is wearing a scarf that fits exactly. It keeps walking past puddles to look at itself.`, cash(-300), fr(10, 'lead'), flag('tailor-made')), { requires: [money(300)] }),
    ch('Ask him to mend your bag instead.', out(`He clicks his tongue at the state of it, and mends it for free, with a fancy blue lining, "because I couldn't bear it."`, flag('tailor-mended'), good(1))),
    ch('Let your team pick the colours.', out(`They argue. Loudly. He laughs until the pins fall out of his mouth, and promises to make something they'll all agree on. "Next time," he says. "I need to think."`, flag('tailor-asked'), fr(3))),
  ],
  intro2: `The painted cart again, and the tailor waving a new sample book over his head. "I have a NEW design!"`,
  by: [
    ['tailor-made', `The painted cart again. The tailor sees your lead in its scarf and nearly weeps. "Still wearing it! A sign. I've made a matching set, for the whole team."`],
    ['tailor-mended', `The painted cart again. "How's the lining?" he asks first, and checks it. Satisfied, he flips his sample book open. "Now. The team."`],
    ['tailor-asked', `The painted cart again. "I thought about it," says the tailor. "I thought about it for a week. I have the design your team will ALL agree on."`],
  ],
  c2: [
    ch('See the new design.', out(`Matching bands in your team's colours, one for each, all different and somehow all the same. They wear them proudly. You are a team, and now it shows.`, fr(5), moment('A travelling tailor made your team matching bands.', 40))),
    ch('Commission a silk scarf.', out(`He works the silk like water. "For a Normal-type, it brings out the best." He won't say how. It does.`, cash(-500), item('silk-scarf')), { requires: [money(500)] }),
  ],
});

const SHRINE = two('mountain-shrine', 'The Mountain Shrine', {
  tint: '#3a3a44', fx: 'snow',
  intro1: `A tiny shrine on a mountain path, half buried in snow. A cup, a bell, a wooden plaque worn smooth. Someone has swept the step, but not for a long time.`,
  c1: [
    ch('Sweep the step and ring the bell.', out(`You clear the snow, straighten the plaque, and ring the bell once. It sounds much bigger than it is. Somewhere far up the mountain, something rings back.`, flag('shrine-swept'), good(1))),
    ch('Leave an offering.', out(`You leave a berry in the cup. Your lead adds something of its own: a pebble, carefully placed. You bow. It bows, a moment after you.`, flag('shrine-offered'), fr(5, 'lead'))),
    ch('Pass by.', out(`The bell stays silent. The snow keeps falling on the step.`, flag('shrine-passed'))),
  ],
  intro2: `A small house on a mountain path, a lamp in the window, and an old man at the door in a keeper's coat.`,
  by: [
    ['shrine-swept', `An old shrine keeper waits at his door. "Someone rang my bell," he says. "First time in eleven years. I came down from the high house to see who."`],
    ['shrine-offered', `An old shrine keeper waits at his door, holding a pebble. "A Pokémon left this at my shrine," he says. "Next to a berry. I wanted to meet it."`],
    ['shrine-passed', `An old shrine keeper waits at his door. "Did you pass my shrine?" he asks gently. "It's hard to see, in the snow. I'm too old to sweep it now."`],
  ],
  c2: [
    ch('Accept his thanks.', out(`He gives you tea by his fire and a small charm from the shrine: a bell on a red cord. "It rings when you need it to," he says. "That's all I know about it."`, heal(1), item('cleanse-tag'))),
    ch('Offer to sweep it for him.', out(`You walk back up together and sweep it clean. He rings the bell. Far away, something rings back, and he laughs like a boy. "There. Now we both heard it."`, good(1), peace(1), rest())),
  ],
});

const RANGER = two('ranger-patrol', 'The Ranger\'s Patrol', {
  pokemon: 'ponyta', tint: '#3a4a2a',
  intro1: `A Pokémon Ranger kneels by a Ponyta caught in a rusted fence, its leg tangled, its mane flaring hot every time she reaches for it. "It won't let me close. Can you help me keep it calm?"`,
  c1: [
    ch('Calm it while she cuts the wire.', out(`You talk to it, low and steady, and don't move. The Ranger cuts, wire by wire. When it's free it stands shaking, then puts its nose against your shoulder before it bolts.`, good(1), peace(1), flag('ranger-calmed'), flag('kind-helped-stranger'))),
    ch('Let a Water-type cool its fire.', out(`A gentle mist, not a blast. The flames die down. The Ponyta stops fighting. The Ranger works fast, and it's free, and gone in a flash of hooves.`, fr(5, { types: ['water'] }), flag('ranger-water'), flag('kind-helped-stranger')), { requires: [ptype('water')] }),
    ch('Hold it down.', out(`It works, but it's ugly. The Ponyta screams, burns your sleeve, kicks the Ranger. When it's free it runs and doesn't look back.`, { kind: 'damage', share: 0.15, who: 'lead' }, flag('ranger-held'))),
  ],
  intro2: `A Ranger on a Ponyta trots up the road, and the Ponyta stops dead when it sees you.`,
  by: [
    ['ranger-calmed', `The Ranger rides up on a Ponyta. The Ponyta stops, nickers, and walks the last few steps to you to put its nose on your shoulder, exactly like before.`],
    ['ranger-water', `The Ranger rides up on a Ponyta. It stops and looks for your Water-type, then snorts a little cloud of steam at it, friendly.`],
    ['ranger-held', `The Ranger rides up. Her Ponyta stamps and backs away from you. "It's all right," she tells it, and you. "It remembers. It'll get over it."`],
  ],
  c2: [
    ch('Accept the Ranger\'s reward.', out(`"The Ranger Union pays for help," she says, and hands you an envelope. "And I pay for good help." She adds a handful of Great Balls from her own belt.`, cash(500), item('great-ball', 2))),
    ch('Ask to ride with her a while.', out(`An hour on the road, the Ponyta's warm flank under your hand. She shows you the paths the wild ones use. It's the fastest you've ever covered ground.`, scout(2), flag('ranger-rode')), { requires: [{ kind: 'flag', key: 'ranger-held', atLeast: 0, atMost: 0 }] }),
  ],
});

const LOST_MON = two('lost-pokemon', 'The Lost Pokémon', {
  pokemon: 'growlithe', tint: '#4a3a2a',
  intro1: `A Growlithe in a red collar sits at a crossroads, looking up each road in turn. Its tail goes up whenever someone comes, then down when it isn't them. It has been here a while.`,
  c1: [
    ch('Read the tag on its collar.', out(`A name, "Biscuit," and a town two routes away. You walk it there. The house is shut. Biscuit lies down on the step to wait, and won't come with you. You leave a note in the door.`, good(1), flag('lost-tag'), flag('kind-helped-stranger'))),
    ch('Let it walk with you for a while.', out(`It trots beside your team, sniffing every traveller who passes. Your Pokémon share their food. At the next town it catches a scent and is gone, barking.`, fr(3), flag('lost-walked'))),
    ch('Leave it waiting.', out(`It watches you go. Then it turns its head back to the crossroads, and waits.`, flag('lost-left'))),
  ],
  intro2: `A young woman with a red lead in her hand and a Growlithe at her heel. She sees you and her whole face changes.`,
  by: [
    ['lost-tag', `A young woman with a Growlithe at her heel runs up holding your note. "You walked Biscuit home. I was gone three days looking for him and he was on my step the whole time."`],
    ['lost-walked', `A young woman with a Growlithe at her heel. Biscuit sees your team and goes mad with joy. "He found me in town," she says. "He smelled of your Pokémon. I had to find you."`],
    ['lost-left', `A young woman with a Growlithe at her heel. "Did you see him?" she asks, smiling. "At the crossroads? A Ranger brought him home. He waited there two days."`],
  ],
  c2: [
    ch('Say you\'re glad they found each other.', out(`She hugs Biscuit, then you, then Biscuit. She gives you what she has: a tin of homemade treats your team devours, and her father's old Quick Claw.`, item('quick-claw'), fr(3)), { requires: [{ kind: 'flag', key: 'lost-left', atLeast: 0, atMost: 0 }] }),
    ch('Scratch Biscuit\'s ears.', out(`Biscuit flops over for belly rubs. It's the happiest Pokémon you have ever seen. That's the reward.`, peace(1), heal(0.3))),
  ],
});

const INN = two('snowed-in-inn', 'The Snowed-In Inn', {
  types: ['ice'], tint: '#38485a', fx: 'snow',
  intro1: `A blizzard closes the pass in an hour. The inn at the foot of it is full of stuck travellers: a cartographer, a family, a grumpy old Ice-type trainer, and a fire in the grate. You'll be here till morning.`,
  c1: [
    ch('Share your food around.', out(`You put what you have on the big table. Others add theirs. It becomes a feast, then a party. The cartographer tells stories about roads that aren't on any map.`, flag('inn-shared'), good(1), rest())),
    ch('Battle the Ice-type trainer for the warmest seat.', fight(`"The seat by the fire is MINE," says the old trainer. "Unless you take it."`, trainer('Grumpy Skier', { types: ['ice'], size: 2, win: [flag('inn-battled'), rest()] }))),
    ch('Keep to yourself.', out(`You take a corner, curl up with your team, and sleep through the noise. You wake rested. The others are asleep in a heap by the fire.`, flag('inn-quiet'), rest())),
  ],
  intro2: `Morning. The pass is open and white. As you lace your boots, the cartographer comes over with a rolled-up map.`,
  by: [
    ['inn-shared', `Morning. The cartographer finds you at the door. "You fed half the inn last night," she says. "I make maps. Here's one that no one else has."`],
    ['inn-battled', `Morning. The grumpy Ice-type trainer and the cartographer are both waiting at the door. The old man grunts. "She has a map for you. I told her to."`],
    ['inn-quiet', `Morning. The cartographer stops you at the door. "You missed a good night," she says. "But I saw you looked tired. Take this. It's a shortcut."`],
  ],
  c2: [
    ch('Take the map.', out(`It shows the road ahead in her small, neat hand: every hollow and every nest. "Don't sell it," she says. "Use it."`, scout(3), { kind: 'revealStops' })),
    ch('Trade her a story for it.', out(`You tell her about the strangest place you've been. She writes it in the margin of the map, and hands you the map. "Now it's a better one."`, scout(3), rp(10))),
  ],
});

const RUNAWAY_EGG = two('runaway-egg', 'The Runaway Egg', {
  tint: '#4a4430',
  intro1: `Something white and speckled comes rolling down the hill, bouncing off stones, picking up speed. An egg. It's heading straight for the river.`,
  c1: [
    ch('Dive and catch it.', out(`You land face-first in the mud and catch it an inch from the water. It's warm. Something inside it knocks, once, very softly.`, flag('egg-caught'), { kind: 'damage', share: 0.1, who: 'lead' })),
    ch('Have a Pokémon block it.', out(`Your fastest Pokémon gets ahead of it and stops it with its body, gently. It holds the egg like it's the most important thing in the world.`, fr(5, 'lead'), flag('egg-blocked'))),
    ch('Let it go.', out(`It hits the water with a soft splash. For a second it bobs, then the current takes it. Something up the hill cries out.`, flag('egg-lost'))),
  ],
  intro2: `A huge, frantic Pokémon is searching the hillside, nose to the ground, making a sound like grief.`,
  by: [
    ['egg-caught', `A big wild Pokémon comes crashing down the hillside, frantic, searching. Then it smells the egg you've kept warm all this way, and stops dead.`],
    ['egg-blocked', `A big wild Pokémon comes down the hillside searching. It smells its egg on your teammate, and the two of them look at each other a very long time.`],
    ['egg-lost', `A big wild Pokémon is pacing the riverbank, nosing the water, crying. You know what it's looking for. It isn't going to find it.`],
  ],
  c2: [
    ch('Give the egg back.', out(`It nudges the egg into the curl of its body and makes a deep, rumbling sound. Then it nudges something else toward you: a second egg, smaller. It wants you to have it.`, egg({ lv: 1 }), good(1)), { requires: [{ kind: 'flag', key: 'egg-lost', atLeast: 0, atMost: 0 }] }),
    ch('Stay with it.', out(`You sit on the riverbank beside it. You can't fix it. You stay until it stops crying and walks back up the hill. Your team is very quiet that night.`, peace(1), moment('A wild Pokémon lost its egg to the river while you watched. You stayed with it afterward.', 50)), { requires: [flagIs('egg-lost')] }),
    ch('Back away carefully.', out(`It watches you leave, then turns back to what it was doing.`)),
  ],
});

const RAIN_FESTIVAL = two('rain-dance-festival', 'The Rain Dance Festival', {
  types: ['water'], pokemon: 'politoed', tint: '#4a4a30', fx: 'confetti',
  intro1: `A dry village, a dry square, and everyone in it dancing. Drums. A Politoed on a little stage, conducting. "Dance with us!" someone shouts. "The more feet, the more rain!"`,
  c1: [
    ch('Dance.', out(`You are a terrible dancer. It doesn't matter at all. Your team joins in. By the end even the grandmothers are cheering. The sky stays blue, but it looks thoughtful.`, flag('rain-danced'), fr(3), good(1))),
    ch('Let a Water-type use Rain Dance.', out(`The square goes silent. Your Pokémon lifts its head and calls, and the clouds roll in. Three drops. Then a hundred. Then everyone is soaked and screaming with joy.`, flag('rain-called'), fr(8, { types: ['water'] })), { requires: [ptype('water')] }),
    ch('Watch from the edge.', out(`You clap along from the shade. A little girl gives you a paper flower. The drums go on long after you've gone.`, flag('rain-watched'))),
  ],
  intro2: `The sky over the next battlefield is grey, and getting greyer, and the first drops are falling. Behind you on the wind, very faint: drums.`,
  by: [
    ['rain-danced', `Clouds come in fast over your next battle. On the wind, drums. You danced. Apparently it counted.`],
    ['rain-called', `Clouds pile in over your next battle, black and heavy. Your Water-type looks up and makes a small, smug sound.`],
    ['rain-watched', `Clouds come in over your next battle. On the wind, very far behind you, drums and singing.`],
  ],
  c2: [
    ch('Let it rain.', out(`It pours. Your team stands in it, faces up. Somewhere a village is dancing in mud.`, front('rain', 3))),
    ch('Send thanks back to the village.', out(`You tie a ribbon to a branch facing back down the road. It's a silly thing to do. It feels right.`, front('rain', 2), peace(1))),
  ],
});

const TREE_HOUSE = two('tree-house', 'The Tree House', {
  tint: '#3a4a2a',
  intro1: `A tree house, badly built and gloriously big, with a rope ladder and a sign: TRAINERS ONLY. Four kids lean out of the window. "You can rest here if you want," says one. "There's a password." Another: "There isn't."`,
  c1: [
    ch('Climb up and rest.', out(`They give you the best cushion and a cup of something purple. They show you their Pokémon cards, then their real Pokémon, a Caterpie and a Rattata. You sleep for an hour, safe as anything.`, heal(0.5), flag('treehouse-rested'))),
    ch('Help them fix the roof.', out(`It leaks in three places. You fix two. They decide you're the best trainer who ever lived.`, flag('treehouse-fixed'), good(1))),
    ch('Tell them you\'re busy.', out(`"Okay," says the smallest one, and the shutters close. You hear them arguing about whether you were a real trainer.`, flag('treehouse-passed'))),
  ],
  intro2: `Four kids come running down the road toward you, all talking at once, all carrying Poké Balls. It's the tree house gang.`,
  by: [
    ['treehouse-rested', `The tree house gang comes running. "We've been training! Since you stayed over! Battle us!" They all talk at once.`],
    ['treehouse-fixed', `The tree house gang comes running. "Roof's still dry!" shouts the oldest. "We want a rematch for the roof!" There was no first match.`],
    ['treehouse-passed', `The tree house gang comes running. "We trained," the smallest says. "So you can't be too busy now." They look very serious.`],
  ],
  c2: [
    ch('Battle all four.', fight(`Two at a time, swapping. Their Caterpie has evolved. They cheer for you and for themselves.`, trainer('Tree House Gang', { format: 'doubles', size: 4, lv: -3, win: [cash(300), flag('treehouse-won'), fr(3)] }))),
    ch('Teach them instead.', out(`You show them how to read a type matchup, how to tell when a Pokémon is tired. They take notes in crayon. When you leave, they're battling each other, properly.`, good(1), rp(10))),
  ],
});

const WRECK = two('shipwreck-find', 'The Shipwreck Find', {
  types: ['water'], tint: '#2a3a44',
  intro1: `A broken ship on the beach, rib-bones of wood in the foam. In the wreck: a sealed chest, a ship's bell, and in the sand by it, fresh tracks of something with claws.`,
  c1: [
    ch('Open the chest.', out(`Inside, wrapped in oilcloth: a captain's logbook and a little bag of pearls. The last log entry says, "If found, please tell my daughter we tried."`, item('pearl', 2), flag('wreck-log'))),
    ch('Ring the bell.', out(`It rings out over the water, cracked and clear. The claw-tracks belong to a Corphish, which pops out of the hull, alarmed, and scuttles off.`, flag('wreck-bell'))),
    ch('Leave the wreck alone.', out(`It's someone's grave, maybe. You don't touch it. The tide is coming, and it will do what tides do.`, flag('wreck-left'), peace(1))),
  ],
  intro2: `A diver in a patched suit comes up the beach from the sea, mask pushed back. "That wreck down the coast," she says. "Did you see it?"`,
  by: [
    ['wreck-log', `A diver comes up the beach. "That wreck down the coast. I've been looking for it for six years." Then she sees the logbook sticking out of your pack.`],
    ['wreck-bell', `A diver comes up the beach. "Was it you? Ringing the bell?" Her voice catches. "I heard it from the water. My father's bell."`],
    ['wreck-left', `A diver comes up the beach. "There's a wreck down the coast. Did anyone disturb it?" When you shake your head, she lets out a long breath.`],
  ],
  c2: [
    ch('Give her the logbook.', out(`She reads the last entry and sits down in the sand. "We tried," she reads aloud. She stays there a long time. When she gets up she gives you her father's diving charm.`, item('mystic-water'), good(1), moment('You gave a diver her father\'s last logbook. He wrote that they tried.', 60)), { requires: [flagIs('wreck-log')] }),
    ch('Tell her what you saw.', out(`You tell her everything: the chest, the bell, the tracks. She listens to every word. "Thank you," she says. "I'll dive tomorrow." She gives you Dive Balls she won't need.`, item('dive-ball', 3))),
  ],
});

const SINGER = two('midnight-singer', 'The Midnight Singer', {
  tint: '#1a1a30',
  intro1: `Midnight, a sleeping town, and from somewhere on the rooftops, a voice singing. No words. Just a long, slow tune that makes your chest ache. Your Pokémon are all awake and listening.`,
  c1: [
    ch('Follow the voice.', out(`Over a wall, up some stairs, onto a roof. Nobody there. Just a warm spot on the tiles, and the tune still hanging in the air. Then it stops.`, flag('singer-followed'))),
    ch('Sing back.', out(`You hum the tune back, badly. Silence. Then the voice starts again, and this time it sings your part with you. Your Pokémon join in.`, flag('singer-sang'), fr(5))),
    ch('Listen until it ends.', out(`You sit on the fountain's edge and listen to all of it. When it ends you notice your face is wet. Your team leans against you.`, flag('singer-listened'), peace(1), heal(0.3))),
  ],
  intro2: `Another night, another town, and the same tune. This time it's coming from the next street, at ground level.`,
  by: [
    ['singer-followed', `The same tune, from the next street. You turn the corner and the singer is sitting on a step: a Jigglypuff, and a woman with its old trainer's hat. "You followed us," she says.`],
    ['singer-sang', `The same tune, and this time a second voice with it, low and human. You turn the corner: a woman and a Jigglypuff. "You sang back," she says, smiling. "We've been hoping you'd come."`],
    ['singer-listened', `The same tune. You turn the corner: a woman and a Jigglypuff on a step. "You stayed for all of it," she says. "Nobody does. It's a long song."`],
  ],
  c2: [
    ch('Ask about the song.', out(`"Her first trainer wrote it," the woman says. "My brother. He's gone. She sings it every night so she won't forget it." The Jigglypuff sings it once more, for you.`, peace(1), heal(0.5), moment('A Jigglypuff sings its late trainer\'s song every night so it won\'t forget. It sang it for you.', 60))),
    ch('Sing it with them.', out(`All three of you, and then your team, on a doorstep at midnight. Windows open up and down the street. Nobody complains.`, fr(5), good(1)), { requires: [flagIs('singer-sang')] }),
  ],
  pokemon2: 'jigglypuff',
});

const BAKERY = two('bakery-queue', 'The Bakery Queue', {
  tint: '#4a3a2a',
  intro1: `A queue out the door and round the corner. A famous bakery, the smell of it enough to make your team whine. At the very back, an old man with a cane is about to give up.`,
  c1: [
    ch('Give the old man your place.', out(`You've queued for an hour. You give it to him. He argues, then doesn't. You get nothing but his surprised face. It's enough.`, good(1), flag('bakery-gave'))),
    ch('Queue the whole time.', out(`Two hours. It's worth it. The bun is soft and sweet and your team fights over the crumbs.`, heal(0.3), flag('bakery-queued'))),
    ch('Skip it.', out(`Your team looks at you like you've betrayed them. You walk on, the smell following you for a mile.`, flag('bakery-skipped'))),
  ],
  intro2: `A bakery van by the road, a woman in flour leaning out. "You!" she calls. "You're the one from the queue!"`,
  by: [
    ['bakery-gave', `The baker leans out of her van. "You gave my father your place in my queue," she says. "He told me all about you. I've been watching for you since."`],
    ['bakery-queued', `The baker leans out of her van. "Two hours you stood there! I remember your team. They pressed their noses on my window."`],
    ['bakery-skipped', `The baker leans out of her van. "You walked away from my queue," she says, mock-offended. "Nobody walks away. Come here."`],
  ],
  c2: [
    ch('Accept a free basket.', out(`Warm bread, sweet buns, one for each of your team with their name on it in icing. Somehow she knew the names.`, heal(1), fr(3))),
    ch('Ask for the recipe.', out(`She laughs and says no. Then she tells you one secret, just one: patience. You aren't sure if that's the recipe or advice.`, peace(1), rp(5))),
  ],
});

const SCARECROW = two('scarecrow-trial', 'The Scarecrow Trial', {
  types: ['grass', 'ghost'], tint: '#4a4024',
  intro1: `A scarecrow in a field, arms out. As you pass, its head turns. "HALT," it says, in a voice like dry straw. "None pass my field without a TRIAL." A Pumpkaboo is sitting on its shoulder, grinning.`,
  c1: [
    ch('Accept the trial.', fight(`"PROVE YOURSELF," says the scarecrow, and the field rustles. Things that were hiding in the corn come out.`, wild({ types: ['grass', 'ghost'], format: 'doubles', win: [flag('scare-won')] }))),
    ch('Laugh at it.', out(`The scarecrow goes very still. "RUDE," it says. The Pumpkaboo laughs too. Then the scarecrow does. You all laugh, in a field, at nothing.`, flag('scare-laughed'), fr(3))),
    ch('Look behind it.', out(`A boy with a megaphone, crouched in the corn, red-faced. "Don't tell anyone," he whispers. The Pumpkaboo is his.`, flag('scare-found'))),
  ],
  intro2: `The scarecrow again, in a different field, the Pumpkaboo on its shoulder. "YOU," it says. "I have been WAITING."`,
  by: [
    ['scare-won', `The scarecrow again. "YOU PASSED MY TRIAL," it booms. "NONE HAVE BEFORE. I OWE YOU A PRIZE." The Pumpkaboo holds out something.`],
    ['scare-laughed', `The scarecrow again. "YOU LAUGHED," it booms. "IT WAS... NICE." A pause. "I HAVE A PRIZE FOR LAUGHING."`],
    ['scare-found', `The scarecrow again, and the boy is sitting openly at its feet with his megaphone. "You didn't tell," he says. "So I owe you."`],
  ],
  c2: [
    ch('Take the prize.', out(`It's a Spell Tag, made by hand, and a little bag of candy for your team. "THE FIELD REMEMBERS YOU," booms the scarecrow, and then, more quietly: "Thanks."`, item('spell-tag'), fr(3))),
    ch('Let the Pumpkaboo come along.', out(`The boy hesitates. "She's always wanted to see further than the field." The Pumpkaboo hops onto your shoulder. The boy waves until you're gone.`, join({ species: ['pumpkaboo'] })), { requires: [{ kind: 'flag', key: 'scare-laughed', atLeast: 1, atMost: 99 }] }),
  ],
  pokemon: 'pumpkaboo',
});

const SLEEPY_LIGHT = two('sleepy-lighthouse', 'The Sleepy Lighthouse', {
  types: ['electric'], tint: '#2a3448',
  intro1: `Dusk at a lighthouse, and no light. In the lamp room, the keeper is asleep in a chair with his mouth open, a sleeping Ampharos beside him. Out at sea, a boat is coming in blind.`,
  c1: [
    ch('Wake the keeper.', out(`He jolts awake, sees the dark, and goes white. "Ampharos! Light!" It wakes, glows, and the beam swings out. The boat turns, just in time.`, flag('lamp-woke'))),
    ch('Light the lamp yourself.', out(`Your Electric-type climbs into the lamp housing and lights it. The beam goes out over the water. The keeper and Ampharos sleep on, snoring, and never know.`, flag('lamp-lit'), fr(8, { types: ['electric'] })), { requires: [ptype('electric')] }),
    ch('Leave them sleeping.', out(`It isn't your lighthouse. You go on down the path. Behind you the sea is dark.`, flag('lamp-left'))),
  ],
  intro2: `Daylight at the lighthouse. The old keeper is sitting outside on the step with his Ampharos, wide awake, and he stands when he sees you.`,
  by: [
    ['lamp-woke', `The keeper is waiting on the lighthouse step. "You woke me," he says. "Forty years and I've never slept on watch. That boat had my grandson on it."`],
    ['lamp-lit', `The keeper is waiting on the step, his Ampharos beside him. "Someone lit my lamp while I slept. A Pokémon's charge, not mine. Was it yours?"`],
    ['lamp-left', `The keeper is on the step, very pale. "The boat made it," he tells you, unasked. "Barely. I slept through it. I'm retiring." His Ampharos leans on him.`],
  ],
  c2: [
    ch('Accept his thanks.', out(`He gives you his old keeper's lamp-glass, a lens that catches light like a prism, and a handshake that doesn't let go. "Thank you. That's all. Thank you."`, item('wide-lens'), good(1)), { requires: [{ kind: 'flag', key: 'lamp-left', atLeast: 0, atMost: 0 }] }),
    ch('Stay to keep watch with him tonight.', out(`You sit up all night with him and the Ampharos. He tells you about the ships. At dawn he says he's not retiring after all.`, rest(), peace(1))),
  ],
  pokemon: 'ampharos',
});

const COLLECTOR = two('collector-request', 'The Collector\'s Request', {
  tint: '#38304a',
  intro1: `A woman with a fancy camera on a tripod. "I collect portraits of Pokémon," she says. "One of every type. I'm missing one. Would you let one of yours sit for me?"`,
  c1: [
    ch('Let your lead sit for her.', out(`She spends an hour on lighting. Your lead poses like a star. When she shows you the shot on the little screen, you see your Pokémon the way she does: brave, and beautiful.`, fr(8, 'lead'), flag('collector-sat'))),
    ch('Ask what she\'ll do with them.', out(`"A book," she says. "So people can see every kind of Pokémon at its best." She seems honest. You let her take two pictures.`, flag('collector-asked'))),
    ch('Decline.', out(`She nods, a little disappointed, and packs up the tripod. "I'll find one," she says.`, flag('collector-no'))),
  ],
  intro2: `The portrait collector, with a book under her arm and a different look in her eye. "I want to make you an offer."`,
  by: [
    ['collector-sat', `The portrait collector, holding a printed proof. Your lead is on the cover. "It's the best one in the book," she says. "Now I want to make an offer."`],
    ['collector-asked', `The portrait collector, with a proof of her book. Two pages are yours. "I want to make an offer," she says. "A fair one."`],
    ['collector-no', `The portrait collector. "I found my last type," she says. "But I kept thinking about your team. I'd like to make an offer."`],
  ],
  c2: [
    ch('Hear the offer.', out(`She wants nothing but a copy of the book signed by your Pokémon, a paw print. In return, she pays for "modelling" and gives you a Luxury Ball from her own collection.`, cash(500), item('luxury-ball'))),
    ch('Ask her to photograph your whole team.', out(`An afternoon of it. Everyone gets a turn. She gives you the print, and it's the first time you've seen all of you together in one picture.`, fr(5), moment('A portrait collector took a picture of your whole team together.', 55))),
  ],
});

export const EVENTS: Json[] = [
  ...ROADSIDE, ...LOST_HAT, ...FISHERMAN, ...LOST_CHILD, ...TINKER, ...HERBS, ...BACKPACK, ...MERCHANT, ...DIG, ...RESEARCHER, ...STRAY, ...TREE, ...TAILOR,
  ...SHRINE, ...RANGER, ...LOST_MON, ...INN, ...RUNAWAY_EGG, ...RAIN_FESTIVAL, ...TREE_HOUSE, ...WRECK, ...SINGER, ...BAKERY, ...SCARECROW, ...SLEEPY_LIGHT, ...COLLECTOR,
];
export const REMOVE: string[] = [];
