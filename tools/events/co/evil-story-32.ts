// Catalog Overhaul Pack, Evil Teams Volume III: Kalos, twelve scenes for any player, inside the team or out of it
// (TEAM_FLARE_KALOS_FULL_3 part A, L1 to L12). Each shows a piece of Team Flare that wasn't visible before. Key Items
// are run flags (flare-plate, flare-eleventh, flare-bijou-lead, flare-column, flare-tester): the inside route and the
// endings read them.
import { $, bondUp, ch, ev, flag, flagIs, inRegion, out, room, type Json } from '../dsl.ts';
import { kind, prompt, STEALTH } from './_evil-story-kit.ts';

export const CATEGORY = 'evil-story';

const say = (who: string, line: string): string => `${who}: "${line}"`;
/** Flare is the region's team, the run is in Kalos, and its story has reached this far. */
const fl = (after: number, o: Json = {}): Json[] => [{ kind: 'evil', team: 'flare', after, anyRoute: true, ...o }, inRegion('kalos')];
const night: Json = { kind: 'period', in: ['night'] };
const intel = (n: number): Json => flag('intel', n);
const outsider: Json = { kind: 'evil', team: 'flare', inside: false };
const open = { cast: ['trainer.pr/clerk_f'], tint: '#3a3428' };

// ---------- L1. Couldn't Afford the Suit Either ----------
const MARGAUX = `Margaux lets you in by the back. The boutique's stock, at the staff discount, with the price written plainly on each tag. One thing only she can sell: a Resoled Shoe. "Hold it, and your first move each battle won't miss. It's what he wore. The older gentleman."`;
const L1: Json[] = [
  ev('fl-afford-the-suit', `Couldn't Afford the Suit Either`, 'Evil Teams', { requires: fl(2), ...open },
    `The boutique's back step, in the alley. The clerk, on her break, with her shoes off and a notebook on her knee. ${say('The clerk', `Oh. It's you. I turned you away. I'm sorry; I'm meant to. It's in the contract: 'maintain the tone.'`)} ${say('The clerk', `I keep a book. Everyone I've refused. What they'd on. What their face did. I thought I'd write to them, after. When I've left. I haven't got addresses. It's just a list of faces.`)} The notebook's thick. She's worked there four years. ${say('The clerk', `The red-suit woman waits outside for the ones I turn away. Did you notice? I'm the bad shop, so she can be the kind one. I'm part of it. Nobody told me. I worked it out from where she stands.`)}`,
    [
      ch(`"What's your name?"`, out(`She stares. ${say('The clerk', `...Nobody asks the clerk. Margaux. Margaux Tessier. Four years.`)} ${MARGAUX}`, intel(2), flag('flare-kind-staff'), flag('flare-resoled-shoe'))),
      ch('"Why stay?"', out(`${say('Margaux', `Because if I go, they'll hire someone who doesn't keep a book.`)} ${MARGAUX}`, intel(2), flag('flare-resoled-shoe'))),
      ch('"Read me one."', out(`She turns back a long way. ${say('The clerk', `'Older gentleman. Good shoes, resoled. Wanted a scarf for his wife's birthday. I said we couldn't possibly. He said, quite right, quite right, and thanked me.' I think about 'quite right.'`)} ${MARGAUX}`, intel(2), flag('flare-resoled-shoe'))),
    ]),
];

// ---------- L2. A Soup Plate ----------
const L2: Json[] = [
  ev('fl-soup-plate', 'A Soup Plate', 'Evil Teams', { requires: fl(2), cast: ['trainer.pr/veteran_f'], tint: '#3a3428' },
    `A fourth-floor room. A dresser. One plate on it, on a stand: white, with a gold rim, far too good for the room. The old woman, Madame Honorine Aubert: "That's from the Avenue d'Été. I took it. I'm not proud. Nine years I ate at that table; every Thursday; I'd nowhere else on a Thursday. The last night, I put the plate in my bag." "Not to sell. I wanted to have been somewhere. D'you understand? Nine years, and he never knew my name. He'd pass down the table, he'd say, 'Is there enough? Have you enough?' He'd fill your glass himself. He never once said, 'And who are you?'" "I'd have liked to be asked. I'd have told him: I was a seamstress; I made the dresses his mother's friends wore to dine at that same table, forty years before. I'd have liked him to know I'd been in that room both ways."`,
    [
      ch('"Would you go back?"', out(`"If I could bring something. I can still do a tart. I'd not go empty again. It's hard on a person, nine years of being given to."`)),
      ch('"Shall I return it?"', out(`She looks at it a long time. Then she wraps it in a tea towel and puts it in your hands. "Lend. Not give. It's the only thing I've got that says I was there."`, flag('flare-plate'), room('fl-soup-plate-back'))),
      ch('"What was the food like?"', out(`"Extraordinary. That was the trouble. You can't feed four hundred people like that. You can feed four hundred people soup. He wouldn't. He'd have thought it an insult."`)),
    ]),
  ev('fl-soup-plate-back', 'Place Two Hundred and Six', 'Evil Teams', { room: true, cast: ['boss.npc_gentleman'], tint: '#2a2020', effect: 'fog' },
    `The dining room. Four hundred and eleven places. One's got no soup plate. It's had none for six years. Nobody noticed but Yarborough, who laid round the gap.`,
    [ch('Put it back.', out(`${say('Yarborough', `Place two hundred and six. I wondered who.`)} He takes it. He polishes it on his sleeve, which he's never done to anything. ${say('Yarborough', `Tell Madame she's expected.`)}`, flag('flare-plate-back'), ...kind(1)))]),
];

// ---------- L3. Enough Well ----------
const L3: Json[] = [
  ev('fl-enough-well', 'Enough Well', 'Evil Teams', { requires: fl(3), cast: ['trainer.pr/worker_f'], tint: '#4a3a24', effect: 'sparkle' },
    `A hamlet in the Kalos badlands. A square. A well with a stone rim and a brass plate: GIFT OF A FRIEND. Children. A queue of two, with buckets, chatting. A woman at the rope, Madame Clémence Girard: "The eleventh. That's what the man who dug it called it; he'd a number for each. Tall. Red hair. Dug with the crew, in his shirt. My husband said: a gentleman who blisters. You don't see it." "Twenty years. It's never gone dry. We've had the drought, same as the south. It went low. We queued. It was enough." "He's never been back. I'd have thought he'd want to see one that worked. You'd want to, wouldn't you? After the other."`,
    [
      ch('"The other?"', out(`"A village in the south. He'd dug theirs first. It went dry in the drought, and they went with it. Everybody knows. Nobody says it to him."`, room('fl-enough-well-2'))),
      ch('"Why was this one enough?"', out(`"It wasn't, on its own. Nobody's well is. We'd the well and a cistern we built ourselves, the second year, and a rule about gardens. He gave us the hole. We made it enough." She hauls. "He'd not have liked the cistern. It's ugly."`, room('fl-enough-well-2'))),
      ch('"Does he know?"', out(`"He's thirty-one of these. I don't suppose he's had a letter from one. You don't write to thank a man for water. It'd be like thanking him for Tuesday."`, room('fl-enough-well-2'))),
    ]),
  ev('fl-enough-well-2', 'Enough Well', 'Evil Teams', { room: true, cast: ['trainer.pr/worker_f'], tint: '#4a3a24' },
    `She fills a bottle. "If you see him. Tell him the eleventh's enough. And tell him why."`,
    [ch('Take the Water from the Eleventh Well.', out(`It's heavier than a bottle of water ought to be. Put it on his desk, or hand it to him at the end.`, flag('flare-eleventh')))]),
];

// ---------- L4. Page Nine ----------
const L4: Json[] = [
  ev('fl-page-nine', 'Page Nine', 'Evil Teams', { requires: fl(2), cast: ['trainer.pr/worker_m'], tint: '#2a2a30' },
    `A press. The smell of ink. A man with a loupe and a galley proof he's kept two years. The typesetter, Monsieur Fabrice Collet: "A Beautiful Future. Eleven pages, four colours, a thousand copies on the heavy stock. I set it myself. You read what you set; you can't help it. Letter by letter." "Page nine. 'The device removes the surplus.' I stopped the press. I rang the client. I said, monsieur, there's a line here I don't follow; is it a figure of speech?" "A lady came on. Very warm. She said: 'It's conceptual.' I said, ah. I ran it." He holds up the proof. In the margin of page nine, in blue pencil, a printer's mark: ? "That's a query. It means: author to confirm. It was never confirmed. I ran it with the query open. I've not done that before or since."`,
    [
      ch('"What did you think it meant?"', out(`"I thought it meant what it said. That's the trouble with setting type. You can't not read it."`)),
      ch('"Can I have the proof?"', out(`He hands it over. The blue question mark is the only thing on the page in his own hand.`, flag('flare-proof'))),
      ch('"Would you set a correction?"', out(`"For whom?" "For anyone who's got the brochure." He thinks. He goes to the type case. "One line. Under page nine. What should it say?"`, room('fl-page-nine-2'))),
    ]),
  ev('fl-page-nine-2', 'Page Nine', 'Evil Teams', { room: true, cast: ['trainer.pr/worker_m'], tint: '#2a2a30' },
    `He waits, with the composing stick in his hand.`,
    [
      ch(`"'Surplus' means people."`, out(`A thousand slips, gummed. He posts them to every member on his delivery list. Kalos feels it. ${say('Garance', `Somebody's annotated us.`)}`, flag('flare-correction-people'), flag('world-state-down'))),
      ch(`"Ask which key you have."`, out(`A hundred members do.`, flag('flare-members-asking'))),
      ch(`"Author to confirm."`, out(`Only the query. He likes that best. It's what's on Lysandre's own copy, the next time you're in his study.`, flag('flare-correction-query'))),
    ]),
];

// ---------- L5. Two Chimes ----------
const L5: Json[] = [
  ev('fl-two-chimes', 'Two Chimes', 'Evil Teams', { requires: fl(2), cast: ['trainer.pr/rich_kid_m'], tint: '#2a2a30' },
    `A repair stall. Holo Casters in pieces. A boy of fifteen with a soldering iron and a jeweller's eye. The repair boy, Bastien Lemaire: "They bring them when they drop them. The red ones. I'm not meant to open the upgrade; there's a seal. I open it. I put the seal back. I'm good at seals." "There's two kinds. Look." Two backs, off. "This one's got a capacitor the size of a sugar lump. Proper. I don't know what it does; it's listening for something." "This one's got a comb and a pin. Like a music box. It plays a chime. That's all. That's all it does. I've had forty-one of these and one of the other."`,
    [
      ch('"Whose was the one?"', out(`"A lady off the television. She tipped. She said, 'You didn't open it.' I said no, madame. She said, 'Good boy,' like she knew I had."`, room('fl-two-chimes-2'))),
      ch('"Do the owners know?"', out(`"They think they've all got the same one. Why would they look? It chimes."`, room('fl-two-chimes-2'))),
      ch('"Can you make the chime one work?"', out(`"I'd need the sugar lump. I'd need forty. ...I could make one that says which it is. A light. Green if it's real."`, room('fl-two-chimes-2'))),
    ]),
  ev('fl-two-chimes-2', 'Two Chimes', 'Evil Teams', { room: true, cast: ['trainer.pr/rich_kid_m'], tint: '#2a2a30' },
    `"A tester. Hold it to a Flare key. Red, it only chimes. Green, it's real. A thousand, and I'll tell you straight: it's a light and a wire and an afternoon."`,
    [
      ch('Buy the tester. (₽1,000)', out(`On a member's key: red. "It's what?" On your own, if you're inside: red, before you're Chosen; green, after, the night he wrote the name in. On the key Lysandre holds out, at the very end: red. He picked it up off the desk.`, $(-1000), flag('flare-tester')), { requires: [{ kind: 'money', atLeast: 1000 }] }),
      ch('Leave it.', out(`He goes back to his seals.`)),
    ]),
];

// ---------- L6. Kitchen Scissors ----------
const JAM = `She gives you a jar of plum jam. On the road, one of your Pokémon gets a spoonful and decides it likes you better.`;
const L6: Json[] = [
  ev('fl-kitchen-scissors', 'Kitchen Scissors', 'Evil Teams', { requires: fl(4), cast: ['trainer.pr/veteran_f'], tint: '#3a4a2a' },
    `A garden. A washing line. A basket of pegs, tipped over, not picked up. A grooming table made from a door. The owner, Madame Yvette Peltier: "I trim her myself. I can't afford the salon. She doesn't mind; she stands like a lamb. I do the pom-poms uneven. I always have. My husband used to say she looked like she'd been done in the dark." "I turned round for the pegs. That's all. And the gate was open and she wasn't— she doesn't wander. She's eleven. She sleeps on my feet." "I've left the pegs. I know it's silly. I thought: if I pick them up, that's the afternoon over, and she went in it."`,
    [
      ch(`"What's her name?"`, out(`"Bijou." She says it as if it might bring her.`, room('fl-kitchen-scissors-2'))),
      ch(`"I'll look."`, out(`A lead's pressed into your hand. "Then take this. She'll not come to a stranger without it; it smells of the house." With Bijou's Lead, on Route 10, one stone's Pokémon can be unclipped without a battle. ${JAM}`, flag('flare-bijou-lead'), bondUp(1))),
      ch(`"There's a tag?"`, out(`"Brass. A heart. BIJOU, and the telephone. I had it done for her tenth. She'd never needed one. I just wanted her to have something with my number on."`, room('fl-kitchen-scissors-2'))),
      ch('"I know where she is."', out(`A lead's pressed into your hand. "Then take this. She'll not come to a stranger without it; it smells of the house." With Bijou's Lead, on Route 10, one stone's Pokémon can be unclipped without a battle. ${JAM}`, flag('flare-bijou-lead'), bondUp(1)), {
        requires: [flagIs('flare-inside-act3')],
        branches: [{ when: [flagIs('flare-stones-unhooked')], text: `Bijou's at the gate before you've finished the sentence. She's walked. She's thinner. The pom-poms have grown out. Madame Peltier picks up the pegs. ${JAM}`, effects: [flag('flare-bijou-home'), bondUp(1), ...kind(1)] }],
      }),
    ]),
  ev('fl-kitchen-scissors-2', 'Kitchen Scissors', 'Evil Teams', { room: true, cast: ['trainer.pr/veteran_f'], tint: '#3a4a2a' },
    `She's looking at the gate.`,
    [ch(`"I'll look."`, out(`A lead's pressed into your hand. "Then take this. She'll not come to a stranger without it; it smells of the house." With Bijou's Lead, on Route 10, one stone's Pokémon can be unclipped without a battle. ${JAM}`, flag('flare-bijou-lead'), bondUp(1)))]),
];

// ---------- L7. What the Glasses Say ----------
const GLASSES = `Last night's glasses: one extra, at the corner table. Very tall. The stem's been held like something breakable.`;
const L7: Json[] = [
  ev('fl-what-the-glasses-say', 'What the Glasses Say', 'Evil Teams', { requires: [...fl(2), night], cast: ['trainer.pr/waiter_m'], tint: '#2a2420' },
    `The Lysandre Café's kitchen door. A yard. Crates. A man in an apron, on an upturned bucket, smoking nothing: he's given up; he just sits where he used to. The dishwasher, Monsieur Anselme Brunel: "Forty years of glasses. You learn to read them. Lipstick; that's easy. But how much is left. That's the real news." "Corner table. The Professor: drained. Always. A man who's enjoying himself. The actress: half. She's watching her figure, or the room." "The patron. Six years, it comes back full. Every night. He orders the house red. He lifts it. He puts it down. I pour away a full glass of the best wine in Lumiose every evening of my life." "Before that, he drank like the Professor. I could tell you the date it changed. I've got it on the wall, in pencil, by the sink."`,
    [
      ch('"What date?"', out(`He shows you. The date by the sink's the day of the drought. ${GLASSES}`, intel(3))),
      ch('"Why order it, then?"', out(`"So the others will. A host doesn't let a guest drink alone. He just doesn't swallow." The date by the sink's the day of the drought. ${GLASSES}`, intel(3))),
      ch('(Tip him.)', out(`He looks at the coin. "...In forty years. You're the second." "Who was the first?" "Him. Every Thursday. Before." The date by the sink's the day of the drought. ${GLASSES}`, intel(3), flag('flare-kind-staff'))),
    ]),
];

// ---------- L8. The Pool ----------
const square = (label: string, id: string, text: string): Json => ch(label, out(`${text} The slip pays at the end of the region, in whatever ending, by whichever of the four's still solvent. You may lose it.`, $(-500), flag(`flare-pool-${id}`)), {
  requires: [{ kind: 'money', atLeast: 1000 }],
  branches: [{ when: [outsider], text: `${text} Outsiders pay double: ₽1,000. The slip pays at the end of the region, by whichever of the four's still solvent. You may lose it.`, effects: [$(-1000), flag(`flare-pool-${id}`), flag('flare-pool-outside')] }],
});
const L8: Json[] = [
  ev('fl-the-pool', 'The Pool', 'Evil Teams', { requires: fl(3), cast: ['trainer.pr/bryony', 'trainer.pr/mable', 'trainer.pr/celosia'], tint: '#3a2830' },
    `A lunch table. Four women in coloured visors. A sheet of graph paper with squares on it, and money under a salt cellar. ${say('Bryony', `It's a pool. On whether he'll go through with it.`)} ${say('Mable', `I've 'yes.'`)} ${say('Celosia', `I've 'no,' and I've started sleeping in my street clothes.`)} ${say('Aliana', `I've 'yes, but it doesn't work.' It was long odds. They've shortened.`)} ${say('Bryony', `You can buy a square. Outsiders pay double. It's not personal, it's actuarial.`)} The price is written on the sheet: ₽500 a square (₽1,000 from outside). "A bet. It pays at the end of the region. You may lose it."`,
    [
      ch('Look at the grid.', out(`"Yes," 2 to 1. "Yes, but it's short," 5 to 1. "No: stopped," 3 to 1. "No: talked out of it," 20 to 1. "The tall one," 50 to 1: nobody's got it. "New management," 40 to 1.`, room('fl-the-pool-grid'))),
      ch(`Write in "The cleaners."`, out(`It's not on the grid.`, room('fl-the-pool-cleaners'))),
      ch('Leave them to it.', out(`${say('Bryony', `Suit yourself. It's actuarial.`)}`)),
    ]),
  ev('fl-the-pool-grid', 'The Pool', 'Evil Teams', { room: true, cast: ['trainer.pr/bryony'], tint: '#3a2830' },
    `${say('Bryony', `One square each. Pick.`)}`,
    [
      square('"Yes." (2 to 1)', 'yes', `Mable looks pleased.`),
      square(`"Yes, but it's short." (5 to 1)`, 'short', `Aliana raises an eyebrow.`),
      square('"No: stopped." (3 to 1)', 'stopped', `Celosia nods, as if you'd confirmed something.`),
      ch('The long odds.', out(`Bryony turns the sheet over.`, room('fl-the-pool-long'))),
    ]),
  ev('fl-the-pool-long', 'The Pool', 'Evil Teams', { room: true, cast: ['trainer.pr/bryony'], tint: '#3a2830' },
    `${say('Bryony', `The long odds. People like the long odds. People are wrong.`)}`,
    [
      square('"No: talked out of it." (20 to 1)', 'talked', `${say('Aliana', `...Nobody's got that square.`)}`),
      square('"The tall one." (50 to 1)', 'tall', `${say('Celosia', `Who's the tall one?`)} Nobody knows.`),
      square('"New management." (40 to 1)', 'mgmt', `Celosia writes your name next to hers.`),
    ]),
  ev('fl-the-pool-cleaners', 'The Pool', 'Evil Teams', { room: true, cast: ['trainer.pr/celosia'], tint: '#3a2830' },
    `${say('Celosia', `The cleaners? Fine. A hundred to one. It's your money.`)}`,
    [square('Pay for it. (100 to 1)', 'cleaners', `She writes it in the margin, in very small letters.`), ch('Think better of it.', out(`She rubs it out.`))]),
];

// ---------- L9. The Good China ----------
const STALL = `The address of the stall, and a word with the seller: she's the one who buys the chiming keys back, from members who've dropped them, for scrap.`;
const L9: Json[] = [
  ev('fl-good-china', 'The Good China', 'Evil Teams', { requires: fl(2), cast: ['boss.npc_gentleman'], tint: '#3a3428' },
    `A Lumiose market. A bric-a-brac stall. A man of seventy in a black coat, turning over a white plate with a gold rim, and checking the mark on the back. ${say('Concierge Yarborough', `It's the pattern. Discontinued. I've been making up the set for six years. We lost a number, on the Thursdays. Breakages. And one walked.`)} ${say('Yarborough', `It isn't in use. The table. I'm aware it's not rational to complete a service nobody'll eat off. I find I can't have it short. If he ever came down and counted.`)}`,
    [
      ch('"Would he count?"', out(`${say('Yarborough', `He counted once. I'd not have him count and find me wanting.`)} ${STALL}`, intel(3))),
      ch('"Let me carry those."', out(`A tray of eleven plates, through a market. Not one breaks. ${say('Yarborough', `You've hands. I'd have you in service.`)} It's the highest thing he can say. ${STALL}`, intel(3), flag('flare-kind-staff')), { prompt: prompt(STEALTH), fail: out(`A tray of eleven plates, through a market. One slides. ${say('Yarborough', `Ten, then. I'll find the eleventh. I've found the others.`)} ${STALL}`, intel(3)) }),
      ch('"Forty years. Tell me one thing."', out(`${say('Yarborough', `The second coat. A January. A man at the kitchen door, no coat at all. Monsieur was coming in from the opera. He took it off on the step. I said, sir, that's the vicuña. He said, 'Then he'll be warm, Wilhelm.' I ordered another. He gave that one away in March.`)} ${STALL}`, intel(3))),
    ]),
];

// ---------- L10. A Better Part ----------
const L10: Json[] = [
  ev('fl-better-part', 'A Better Part', 'Evil Teams', { requires: fl(3), cast: ['boss.diantha'], tint: '#3a2838' },
    `A film set outside Lumiose. A caravan. A mirror with bulbs. Kalos's most famous face, being made eighty by a man with a sponge. ${say('Diantha', `Don't make me laugh; it cracks. I'm somebody's grandmother. It's eleven lines. I've wanted it for a year.`)} ${say('Diantha', `A friend of mine asked me if I'd not rather be this, always. He meant it as the kindest thing he could offer. I said I'd rather play a grandmother. He looked at me as if I'd said I'd rather be ill.`)} ${say('Diantha', `Run the scene with me? You're the grandchild. You've come to say you're leaving.`)}`,
    [
      ch(`"I'm going away, Gran. A long way."`, out(`She takes your hand, in character.`, room('fl-better-part-2'))),
      ch(`"I've got to go. I don't know when I'll be back."`, out(`She takes your hand, in character.`, room('fl-better-part-2'))),
      ch(`"Don't be sad. I'll write."`, out(`She takes your hand, in character.`, room('fl-better-part-2'))),
    ]),
  ev('fl-better-part-2', 'A Better Part', 'Evil Teams', { room: true, cast: ['boss.diantha'], tint: '#3a2838' },
    `Diantha, as the grandmother: "Go, then. I'll be here, and I'll be different when you're back, and so will you. That's not a loss. That's the visit." She comes out of it. ${say('Diantha', `He's confused a thing lasting with a thing staying the same. He always has. Give him a sunset, he wants to nail it up.`)}`,
    [
      ch('"Will you tell him?"', out(`${say('Diantha', `I have. Every way I know. He hears it as a review.`)}`, flag('diantha-part'))),
      ch('"Would you take a seat, if he offered?"', out(say('Diantha', `He has. I'm on some list; Augustine's seen it. I shan't go. I'll be on set. If the world ends I'd like to be in the middle of a take. The crew'd never forgive me otherwise.`), flag('diantha-part'))),
      ch(`"It's a good part."`, out(`${say('Diantha', `It's the best part I've ever had. Eleven lines.`)}`, flag('diantha-part'))),
    ]),
];

// ---------- L11. The Brother ----------
const L11: Json[] = [
  ev('fl-the-brother', 'The Brother', 'Evil Teams', { requires: fl(4), cast: ['boss.az'], tint: '#1e2418', effect: 'fog' },
    `Geosenge. A small stone, among the big ones, set a little apart. No cable on it. Lichen. Letters almost gone. A man twice a man's height is sitting beside it, with his hand flat on the top, as one might on a child's head. ${say('AZ', `My brother. He was the younger. He kept bees. He'd no talent for kingship and he knew it; that was his talent.`)} ${say('AZ', `When I built the machine, he came to the door of the workshop. He said: 'Brother, what does it eat?' I said: nothing you'll miss. He said: 'Then it eats something.' He didn't come in.`)} ${say('AZ', `He raised this himself. For the ones I took. He never told me. I found it six hundred years on. He'd cut one line.`)} The line's worn. You trace it: I LOVED THEM ENOUGH NOT TO.`,
    [
      ch('"Did he forgive you?"', out(`${say('AZ', `He was dead before I could ask. I've decided he did. It's the only kindness I've allowed myself.`)}`, flag('flare-lore-brother'))),
      ch(`"His line goes on. There's a man in Lumiose."`, out(`${say('AZ', `I know. I've seen him across a café. He's my brother's hair. He's got my hands.`)} A pause. ${say('AZ', `That's the wrong way round.`)}`, flag('flare-lore-brother'))),
      ch('"What does it eat?"', out(say('AZ', `That's the only question. He asked it at the door and I've been answering it since.`), flag('flare-lore-brother'))),
    ]),
];

// ---------- L12. The Other Column ----------
const L12: Json[] = [
  ev('fl-other-column', 'The Other Column', 'Evil Teams', { requires: fl(2), cast: ['trainer.pr/clerk_f'], tint: '#2a2a24' },
    `Lumiose: the Prefecture. A records office. Ledgers to the ceiling. A woman on a rolling ladder. The census clerk, Mademoiselle Séverine Moreau: "He came himself. Six years ago. Very courteous; he held the ladder. He wanted the figures for the south: villages, head by head. I gave them." "He came back every spring. Same request. The count. It went up; it does. He'd go quite white. He'd say: 'More.'" "He only ever asked for the one column. I've two. I said, the third year. I said, monsieur, would you like the other? He said, 'What other?' I said: what they grew. He said he'd not time." She turns the ledger. Two columns. Heads. And beside it: yield. Hectares under the plough. Cisterns. Schools. The second column's gone up faster than the first. Every year but one. "The drought year. That's the one he looked at. I don't blame him; it's a dreadful year. But it's one. He's built on one year and one column."`,
    [
      ch('"Can I copy it?"', out(`She lets you. The Other Column, in your own hand, every year but one.`, flag('flare-column'))),
      ch(`"Why didn't he look?"`, out(`"Because he'd already decided what the page said. People do. I copy it out for you anyway; somebody should read both." The Other Column.`, flag('flare-column'))),
      ch('"Is there enough, then?"', out(`"I'm a clerk. I don't say 'enough.' I say: more hands, and more in them. Both. Every year but one. He's been reading half the page." She copies it out for you: the Other Column.`, flag('flare-column'))),
    ]),
];

export const EVENTS: Json[] = [...L1, ...L2, ...L3, ...L4, ...L5, ...L6, ...L7, ...L8, ...L9, ...L10, ...L11, ...L12];
export const REMOVE: string[] = [];
