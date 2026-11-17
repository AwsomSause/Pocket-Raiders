// Catalog Overhaul Pack, Evil Teams Volume III: Johto, twelve scenes for any player, inside the Return or out of it
// (TEAM_ROCKET_JOHTO_FULL_3 part A, J1 to J12), and the redeemed ring given to Archer. Each shows a piece of the Return
// that wasn't visible before; several leave a flag the endings read (evil-story-10.ts).
import { $, ch, ev, flag, flagIs, inRegion, item, money, out, room, type Json } from '../dsl.ts';
import { evil as story, kind } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-story';

const R = teamJson('rocket');
const GRUNT = R.ranks.grunt.sprite;
const EXEC = R.ranks.executive.sprite;
const ARCHER = 'trainer.pr/archer';
const say = (who: string, line: string): string => `${who}: "${line}"`;
/** Rocket is Johto's team and its story has reached this far; inside the Return or out of it. */
const neo = (after: number, o: Json = {}): Json[] => [{ kind: 'evil', team: 'rocket', after, anyRoute: true, ...o }, inRegion('johto')];
const night: Json = { kind: 'period', in: ['night'] };
const intel = (n: number): Json => flag('intel', n);
const open = { cast: ['trainer.pr/clerk_f'], tint: '#3a3428' };

const RING = `He doesn't take it at once. ${say('Archer', `I sold that. It's not mine to— where did you—`)} Then he does. He doesn't say anything else, and he doesn't need to.`;

const SCENES: Json[] = [
  // J1. A Very Good Candy Bar
  ev('neo-candy-bar', 'A Very Good Candy Bar', 'Evil Teams', { requires: neo(1), ...open },
    `A souvenir shop in Mahogany. A pyramid of Rage Candy Bars. A poster of a Gyarados with one eye worn pale by thumbs. ${say('Mrs. Yates', `Rage Candy Bar? Local speciality. We've been making them forty years. It's the only shop in Johto that's never once been raided, and I'll tell you why: we make a very good candy bar.`)} ${say('Mr. Yates, from the crossword', `And we don't ask.`)} From under the floor: a kettle. A chair being moved. Somebody singing, quietly, a tune about closing time. ${say('Mrs. Yates', `That's the boiler.`)}`,
    [
      ch('"Who rents downstairs?"', out(say('Mrs. Yates', `A firm. Very quiet. Pay on the first. The tall one brings our tea tray back, washed. In forty years of letting that cellar, he's the only tenant who's washed the tray.`), intel(2), flag('neo-lore-yates'))),
      ch('"A bar, please." (₽300)', out(`It's excellent.`, $(-300), item('ragecandybar')), { requires: [money(300)] }),
      ch(`"The boiler's singing."`, out(`She looks at her husband. He looks at his crossword. ${say('Mr. Yates', `Nine down. "Knowledge one would rather not have." Eleven letters.`)} A pause. ${say('Mr. Yates', `..."Awkwardness." No. Too short.`)}`, intel(2), flag('neo-lore-yates'))),
      ch(`"You know what they are."`, out(`${say('Mrs. Yates', `We know what they did. We also know the one in the nice coat's sold his mother's ring to pay those children's wages. We've been married forty years, dear. We know you can be two things.`)} When you leave, the Gyarados poster has swung a little open, and the Yateses are pretending not to see it.`, intel(2), flag('neo-lore-yates'), flag('neo-door-found'))),
    ]),
  // J2. The Car Park
  ev('neo-car-park', 'The Car Park', 'Evil Teams', { requires: neo(1), cast: ['trainer.gentleman', 'trainer.pr/clerk_f'], tint: '#2e2a22' },
    `An inn's back room. Twelve people in their forties and fifties at one long table, in civvies, with one thing each that's black: a scarf, a hatband, a pair of gloves. ${say('Mr. Sallow', `Private party. ...No. Sit. You've the look of someone who was there. Were you there?`)} ${say('A woman with a hatband', `The car park. The morning after. Sixty of us, in uniform, in the rain, with the police going in the front and us not knowing if we were sacked or arrested or what.`)} ${say('A man with one glove', `And nobody came. That's what I remember. The Boss always sent someone. A car. A man with a clipboard. That morning: nobody.`)} ${say('Mr. Sallow', `Then a door opens. And it's Archer. Six years I'd worked there; I'd never heard him speak. He says: "Is anybody still here?" Like he was frightened of the answer.`)} ${say('The woman', `We're the ones who said yes.`)}`,
    [
      ch('"Why did you say yes?"', out(`${say('The man with one glove', `I'd a mortgage.`)} ${say('The woman', `I'd nowhere.`)} ${say('Mr. Sallow', `He looked like he'd nobody. Archer. I thought: well. That makes sixty-one.`)} Before you go, Mr. Sallow teaches you the closing-time song, with the words. Wherever Old Rocket are, you can sing it and be let by.`, intel(3), flag('neo-lore-carpark'), flag('neo-song-words'))),
      ch('"What was he like? The Boss."', out(`A silence. ${say('Mr. Sallow', `I saw the back of his head for four seconds.`)} ${say('The woman', `He nodded at me once. I think. It might've been at the lift.`)} ${say('The man', `I never saw him at all. I've said I did for three years.`)} They look at each other. Nobody's said it before. Mr. Sallow teaches you the closing-time song before you go.`, intel(3), flag('neo-lore-carpark'), flag('neo-song-words'))),
      ch(`"Do you think he's coming back?"`, out(`All twelve, not quite together: "No." Then, after a moment: ${say('Mr. Sallow', `Don't tell the choir.`)} He teaches you the closing-time song, with the words, so you'll know it when you hear it.`, intel(3), flag('neo-lore-carpark'), flag('neo-song-words'))),
    ]),
  // J3. Four Days on a Handcart
  ev('neo-handcart', 'Four Days on a Handcart', 'Evil Teams', { requires: neo(0, { ends: ['none'] }), cast: ['trainer.worker_m'], tint: '#3a3428' },
    `A man selling souvenirs from a handcart with one new wheel. ${say('Mr. Bexley Quartermain', `Lovely cart, isn't she? I lent her out once. Three years back. A gentleman in a good coat. Paid a month's takings for four days. Wanted her for a chair.`)} ${say('Mr. Quartermain', `One chair. Under a tarpaulin. He wouldn't let me help lift. Walked her himself, Viridian to Mahogany, in the rain. I followed a way, to see my cart didn't come to harm. He talked to it. The chair. On the hills. "Nearly there, sir." I thought: that's either the saddest man in Kanto or the happiest.`)} ${say('Mr. Quartermain', `Brought her back with a new wheel. I hadn't asked. The old one was fine.`)}`,
    [
      ch('"Which was he?"', out(`${say('Mr. Quartermain', `Both, I've decided. It's a long road, Viridian to Mahogany. You can be both on a road that long.`)} He gives you a tin Gyarados off the cart, for listening.`, flag('neo-lore-cart'), flag('neo-tin-gyarados'))),
      ch('"What did the chair look like?"', out(`${say('Mr. Quartermain', `Leather. Old. A mark on one arm, like a hand had gripped it a long time. That's all I saw; he kept the tarpaulin tight.`)} He gives you a tin Gyarados off the cart.`, flag('neo-lore-cart'), flag('neo-tin-gyarados'))),
      ch('"Did he say why?"', out(`${say('Mr. Quartermain', `I asked. He said: "Somebody has to know where it is." I said: "The chair?" He said: "Yes." But he'd stopped for a second before the "yes."`)} He gives you a tin Gyarados off the cart.`, flag('neo-lore-cart'), flag('neo-tin-gyarados'))),
    ]),
  // J4. Do They Grow Back
  ev('neo-grow-back', 'Do They Grow Back', 'Evil Teams', { requires: neo(2), cast: ['trainer.worker_m'], pokemon: 'slowpoke', tint: '#2a3a3a' },
    `The Well's edge. The vendor from the Tail Market, without his hat, with his feet over the side. ${say('Kingsolver', `I packed up. After you asked. "Do they grow back." I'd been saying yes for six months. I came down here to look.`)} In the pool below, a Slowpoke. Its tail's a stump, healed pink. It's fishing with the stump. It isn't catching anything. It keeps looking at where the end of it should be, as if it's mislaid something. ${say('Kingsolver', `It grows back. That's true. Takes a season. D'you know what they do, in the season? That. They fish with it. And nothing bites, because the sweet bit's the end. So they go hungry, a season, and they don't know why.`)} ${say('Kingsolver', `"It grows back." It does. It's just not the whole of the sentence.`)}`,
    [
      ch('Feed it.', out(`A Berry. It takes a long time to notice. It eats. It looks at you. It goes back to fishing with the stump, a little less puzzled. Kingsolver takes off his jacket and wades in with a bag of his own lunch. On the bank, where it dropped in the autumn, there's a tail that was shed, not cut. It's the only one Kurt will look at without shouting.`, ...kind(1), item('slowpoketail'), flag('neo-tails-fed'))),
      ch(`"What'll you do now?"`, out(`${say('Kingsolver', `This. Every day, till they've all grown back. There's forty. I counted them when I was selling them.`)} He finds you a tail on the bank that was shed, not cut.`, ...kind(1), item('slowpoketail'), flag('neo-tails-fed'))),
      ch('"Who told you to say it?"', out(`${say('Kingsolver', `Proton. He said it the way you'd say a prayer. I think he was saying it to himself.`)} He finds you a tail on the bank that was shed, not cut.`, ...kind(1), item('slowpoketail'), flag('neo-tails-fed'))),
    ]),
  // J5. The Pawnbroker of Ecruteak
  ev('neo-pawnbroker', 'The Pawnbroker of Ecruteak', 'Evil Teams', { requires: neo(2), ...open },
    `A pawnshop. In the window, on a velvet pad, a man's wristwatch, a set of flat keys, and a ring with a small stone. ${say('Miss Xiomara Eastlake', `The three in the window? Same gentleman. One a year. I'm not meant to say. I'll say this: he's never once haggled. I've offered him more. He says, "Whatever's fair." Nobody says that in a pawnshop. It's upsetting.`)} ${say('Miss Eastlake', `The ring was this spring. He held it a long time. He said, "She'd understand. She kept books for a firm that folded." I said I was sorry. He said, "It's Friday tomorrow." As if that was an answer.`)} The tickets: the watch, ₽8,000. The keys (a flat in Saffron, long sold; the keys are only keys), ₽500. The ring, ₽30,000.`,
    [
      ch(`"I'll redeem the ring." (₽30,000)`, out(`She wraps it in tissue, as if it were going to someone. It is.`, $(-30000), flag('neo-ring-redeemed')), { requires: [money(30000)] }),
      ch('"Does he ever come back for them?"', out(say('Miss Eastlake', `He looks in the window, Fridays. From across the road. He doesn't come in.`), intel(1))),
      ch(`"Why's it upsetting?"`, out(say('Miss Eastlake', `Because a man who says "whatever's fair" in here has stopped expecting anything to be. I'd rather he haggled.`))),
    ]),
  // J6. The Jingle
  ev('neo-jingle', 'The Jingle', 'Evil Teams', { requires: neo(3), cast: ['trainer.gentleman'], tint: '#3a2e3a' },
    `Goldenrod. Every shop's playing the same eight bars. A man at a café table with his head in his hands. ${say('Mr. Mallory Ziegler', `That's mine. That tune. I wrote it in twenty minutes for a man who paid cash and wouldn't say who for. "Something cheerful. Something you can't get out." I'm good at that. It's the only thing I'm good at.`)} ${say('Mr. Ziegler', `It's everywhere. My mother hums it. I wrote the anthem of a crime, and it's the best thing I've done.`)} The jingle. Again.`,
    [
      ch('"Write a better one."', out(`He gets out a spoon and a cup. ${say('Mr. Ziegler', `Give me four. Any four.`)}`, room('neo-jingle-write'))),
      ch('"What are the words?"', out(say('Mr. Ziegler', `There aren't any. That's what makes it stick. You put your own in. I've heard children skipping to it. "Rocket, Rocket, in your pocket." I didn't write that. They did.`))),
      ch('"Who paid you?"', out(say('Mr. Ziegler', `A tall man in a good coat, who said "whatever's fair" when I named my price. I doubled it. He paid it. I've felt bad ever since.`), intel(1))),
    ]),
  ev('neo-jingle-write', 'The Jingle', 'Evil Teams', { room: true, cast: ['trainer.gentleman'], tint: '#3a2e3a' },
    `Four phrases, of the eight on his napkin: "the kettle's on"; "rain by Tuesday"; "a very good candy bar"; "nobody's coming"; "push the eye"; "tails grow back"; "home you go"; "standing by".`, [
      ...([
        [`"The kettle's on," "rain by Tuesday," "a very good candy bar," "home you go."`, 'kettle'],
        [`"Nobody's coming," "standing by," "push the eye," "home you go."`, 'nobody'],
        [`"Tails grow back," "rain by Tuesday," "the kettle's on," "standing by."`, 'tails'],
      ] as const).map(([label, k]) => ch(label, out(`He plays it on a spoon and a cup. ${say('Mr. Ziegler', `...That's it. That's worse. That's so much worse it's better. You can't hum the old one once you've heard this.`)} By the next stage the shops are playing the new one, and nobody can remember the old one.`, flag('neo-jingle-replaced'), flag(`neo-jingle-${k}`)))),
    ]),
  // J7. Somebody's Son
  ev('neo-somebodys-son', `Somebody's Son`, 'Evil Teams', { requires: neo(3), cast: ['trainer.pr/petrel'], tint: '#3a3a2e' },
    `A front garden. An old woman pegging out washing. A man at the gate, in a plain coat, with no particular face, who hasn't opened it. ${say('The old woman', `Can I help you, dear? Are you from the gas?`)} ${say('Petrel', `No. I— no. Wrong house. Sorry to trouble you.`)} She goes in. He's still at the gate. ${say(`Petrel, to you, who he's noticed, and doesn't mind`, `That's my mum. I came as myself. First time in six years. She didn't know me.`)} ${say('Petrel', `I've been the Director. I've been the Boss, with the lights down. I've been a well-digger, a nurse, a man from the gas. I've come to this gate as eleven different people and she's known every one of them was a stranger. I thought: I'll come as me, and she'll see. And I've forgotten what I look like when I'm doing it.`)}`,
    [
      ch('"What did you look like, at eight?"', out(`He thinks. ${say('Petrel', `I'd a cowlick. I scowled at cameras. I did voices. She used to say, "Do the milkman," and I'd do the milkman.`)} He flattens his hair the wrong way, and scowls, and for a second he's somebody.`, flag('petrel-gate'))),
      ch('"Knock again. Say your name."', out(`${say('Petrel', `And say what? "It's Petrel"? That's not what she called me.`)} "Then say that one." He's quiet a long time. He says a name. You don't hear it. The door opens.`, flag('petrel-gate'), ...kind(1))),
      ch(`"What's she like?"`, out(`${say('Petrel', `She thinks everyone's from the gas. She's been right about that for six years.`)} He laughs, and it's his own laugh, and he hears it.`, flag('petrel-gate'))),
    ]),
  // J8. The One He Kept
  ev('neo-one-he-kept', 'The One He Kept', 'Evil Teams', { requires: neo(3), cast: ['trainer.pr/proton'], pokemon: 'slowpoke', tint: '#2a3a3a' },
    `A locked room. A sound of water. A Slowpoke in a tin bath, with a whole tail, being fed, one Berry at a time, by a man with his back to the door. ${say('Proton', `Don't. Don't say anything. Shut the door.`)} The Slowpoke yawns at you. It's fat. It's the best-kept Pokémon in the building. ${say('Proton', `First one I was sent to do. Three years ago. I'd the shears. It looked at me. They do that: they look, and then a week later they realise what they saw. I thought: by the time it works out what I've done, I'll be gone. And I couldn't have it sitting in a well, a week on, working it out.`)} ${say('Proton', `So I did the next one. And the next. Forty. And this one's had a bath every day for three years, and it hasn't the faintest idea why I can't look at it.`)}`,
    [
      ch('"Does it have a name?"', out(say('Proton', `...Mercy. I know. I know. I was twenty-two.`), flag('proton-mercy'))),
      ch(`"It's not enough."`, out(say('Proton', `No. It's one in forty-one. I can do sums.`), flag('proton-mercy'))),
      ch('"Let it out. With the others."', out(`He carries it to the Well himself. It walks in among the forty with stumps, and it looks at them, and a week later it's worked something out. It comes back up to the edge every morning, and waits for him. He comes.`, flag('proton-mercy'), flag('proton-mercy-free'), ...kind(1))),
    ]),
  // J9. The Vote
  ev('neo-the-vote', 'The Vote', 'Evil Teams', { requires: [...neo(3), night], cast: ['trainer.pr/ariana'], tint: '#2e2a2a' },
    `Ariana, alone, with a shoebox of folded slips. ${say('Ariana', `Sixty ballots. The week after the car park. Who leads. I kept them. I don't know why I kept them.`)} She tips them out. Almost all say ARCHER. ${say('Ariana', `I was his second. For four years. I ran the Celadon side while Archer was still carrying coats. And when it came to it, fifty-one of sixty wrote the name of the man who'd cried in the car park. I didn't cry. I made a list of what needed doing.`)} ${say('Ariana', `They were right. That's what I can't forgive. They didn't need a list. They needed somebody who minded as much as they did. I've been correct for three years, and it's got me a shoebox.`)}`,
    [
      ch('"Who were the nine?"', out(say('Ariana', `Eight for me. One spoiled: it says "the Boss." In a child's hand. We'd no children then. I've never worked that one out.`), intel(3), flag('ariana-ballots'))),
      ch('"Would you have done the tails?"', out(say('Ariana', `No. It was the first thing on the list I didn't write down, because I thought it went without saying. Nothing goes without saying. Write that down.`), intel(3), flag('ariana-ballots'))),
      ch('"What was on the list?"', out(`She still has it. ${say('Ariana', `One: find honest income. Two: stop wearing the uniform in daylight. Three: tell them he's not coming, in the first month, while it could still be survived.`)} She folds it. ${say('Ariana', `None of it was done. All of it was right.`)}`, intel(3), flag('ariana-list'))),
    ]),
  // J10. The Listener
  ev('neo-listener', 'The Listener', 'Evil Teams', { requires: [...neo(3), night], cast: [], tint: '#1a1a2a' },
    `A child of seven on the stairs of an inn, in pyjamas, with a wireless under a blanket. Her mother is calling her to bed from somewhere below. ${say('The child, whispering', `It's the Black Hour. Mum says I'm not allowed. It's a story. There's a lady called Mary and she's a spy and she says things in code. "The kettle's on at the usual place." That means the baddies are moving. I've a notebook.`)} She has. It's very thorough. She's decoded more of it than the police. ${say('The child', `Tonight she sounded sad. D'you think the baddies have got her? In the story?`)}`,
    [
      ch(`"It's not a story."`, out(`She thinks about it. "...Then she got my letters." She's delighted, and then, slowly, she isn't. "Then she's really sad." You promise to tell Mary.`, flag('neo-listener'), flag('neo-listener-promise'))),
      ch(`"What's the code, so far?"`, out(`Her notebook is better than any File: it gives the time of the next Olivine lorry.`, intel(4), flag('neo-listener'))),
      ch('"What would you do, if they had?"', out(`"Write to her. I have. I've written nine. Mum says there's no such lady. I post them anyway. 'Mary, The Wireless, Goldenrod.'" You promise to tell Mary.`, flag('neo-listener'), flag('neo-listener-promise'))),
    ]),
  // J11. The Dead Letter Office
  ev('neo-dead-letter', 'The Dead Letter Office', 'Evil Teams', { requires: neo(3), cast: ['trainer.gentleman'], tint: '#2e2e2a' },
    `A back room of the Goldenrod post office. Pigeonholes to the ceiling. A clerk with a stamp: NOT KNOWN AT THIS ADDRESS. ${say('Mr. Inverness', `Everything that can't be delivered comes to me. I'm meant to burn it after a year. I don't. I read the envelopes. Never the insides. The envelopes are enough.`)} ${say('Mr. Inverness', `There's one came through a year back. Viridian Gym. Thick. The address was in a very careful hand: someone who'd written it out three times to get the lines straight. I stamped it. That's the job. I've thought about that one.`)} He takes down a different bundle: a child's writing, nine letters, each to "Mary, The Wireless." ${say('Mr. Inverness', `These I could deliver, if I knew she was real.`)}`,
    [
      ch(`"She's real. Third floor of the Tower."`, out(`He stamps all nine DELIVER, and puts them in his own coat pocket to walk round himself.`, flag('neo-letters-delivered'), ...kind(1))),
      ch('"Where did the Viridian one come from?"', out(say('Mr. Inverness', `Mahogany. A souvenir shop's address, care of a basement. The careful hand again. Every year, on the same day.`), intel(2))),
      ch(`"Is there anything for the Gym that wasn't returned?"`, out(`He looks. ${say('Mr. Inverness', `...One. Went the other way. From Viridian, three years ago. No stamp; hand-delivered to this office to be held. "To be collected by A." Nobody's collected.`)} He gives it to you, to give. Later, Archer knows the hand. He doesn't open it in front of anyone. If asked: ${say('Archer', `Four lines. "A. I am not coming back. Do not wait. You were the best of them; that is why I'm telling you and not the others. Sell the chair."`)} A pause. ${say('Archer', `It's been in a pigeonhole for three years. He told me the day he left. I've spent everything I had on a question he'd already answered.`)}`, flag('neo-letter-held'))),
    ]),
  // J12. The Coat on the Bench
  ev('neo-coat-bench', 'The Coat on the Bench', 'Evil Teams', { requires: neo(4), cast: [], pokemon: 'sneasel', tint: '#2a2a3a' },
    `A bench outside the souvenir shop. A folded coat with white trim. A red-haired boy sitting at the far end of it, as far from the coat as the bench allows. ${say('The Heir', `He leaves it every day. Fresh. Pressed. I've never touched it. I come and look at it. I don't know why I come.`)} ${say('The Heir', `My father's got a chair in a cellar and a man who dusts it. I've got a coat on a bench. That's the family estate.`)} His Sneasel is sitting on the coat. It's comfortable. ${say('The Heir', `Get off that.`)} It doesn't.`,
    [
      ch(`"It's a good coat."`, out(say('The Heir', `It's a very good coat. That's the worst part.`), room('neo-coat-tell'))),
      ch(`"Who's it from, really?"`, out(`${say('The Heir', `Archer. Not him. He's never given me anything. Archer's the one who—`)} He stops. ${say('The Heir', `Archer came to a school play. When I was six. My father sent him "to represent the firm." He stayed for the whole thing. He clapped.`)}`, room('neo-coat-tell'))),
      ch('"What would you do with a team?"', out(`${say('The Heir', `Burn it down.`)} A pause. ${say('The Heir', `...Or run it properly. I can't tell which I want. That's the worst part.`)}`, room('neo-coat-tell'))),
    ]),
  ev('neo-coat-tell', 'The Coat on the Bench', 'Evil Teams', { room: true, cast: [], pokemon: 'sneasel', tint: '#2a2a3a' },
    `You can tell him one thing, from what this run has found.`, [
      ch(`"He keeps your photograph in a drawer."`, out(`${say('The Heir', `Which one.`)} You describe it. ${say('The Heir', `...I was nine. I'd lost. He took that after I'd lost.`)} When you look back from the corner, the coat is gone from the bench.`, flag('neo-heir-told'), flag('neo-heir-coat')), { requires: [flagIs('rocket-boss-photograph')], chance: 0.8, fail: out(`${say('The Heir', `Which one.`)} You describe it. ${say('The Heir', `...I was nine. I'd lost.`)} He doesn't touch the coat. Not today.`, flag('neo-heir-told')) }),
      ch(`"The Gym was real. Eleven inspections."`, out(`${say('The Heir', `I don't believe that from anyone.`)} A pause. ${say('The Heir', `Who said it?`)} When you look back from the corner, the coat is gone from the bench.`, flag('neo-heir-told'), flag('neo-heir-coat')), { requires: [flagIs('rocket-lore-inspector')], chance: 0.7, fail: out(`${say('The Heir', `I don't believe that from anyone.`)} A pause. ${say('The Heir', `Who said it?`)} The coat stays on the bench.`, flag('neo-heir-told')) }),
      ch(`"He told Archer he wasn't coming back. Three years ago. It was never delivered."`, out(`He looks at the coat. ${say('The Heir', `Then Archer's been doing this for nothing.`)} "Not for nothing. For you." He picks it up, and the Sneasel falls off, offended.`, flag('neo-heir-told'), flag('neo-heir-coat')), { requires: [flagIs('neo-letter-held')], chance: 0.9, fail: out(`He looks at the coat. ${say('The Heir', `Then Archer's been doing this for nothing.`)} "Not for nothing. For you." He doesn't answer, and he doesn't pick it up.`, flag('neo-heir-told')) }),
      ch(`"It's only a coat."`, out(`${say('The Heir', `It's never only a coat.`)} The next morning, the bench is empty.`, flag('neo-heir-coat')), { chance: 0.4, fail: out(say('The Heir', `It's never only a coat.`)) }),
    ]),
  // J5, after: the ring, given back.
  ev('neo-ring-given', 'The Ring', 'Evil Teams', { requires: [{ kind: 'evil', team: 'rocket', anyRoute: true }, inRegion('johto'), flagIs('neo-ring-redeemed'), flagIs('neo-ring-given', 0, 0)], cast: [ARCHER], tint: '#2a2a3a' },
    `Archer, alone, by the souvenir shop. You have a ring in tissue paper in your pocket.`,
    [
      ch('Give it to him.', out(RING, flag('neo-ring-given'), ...kind(1)), { branches: [{ when: [{ kind: 'evil', team: 'rocket', inside: true }], text: RING, effects: [flag('neo-ring-given'), story({ standing: 3 }), ...kind(1)] }] }),
    ]),
];

export const EVENTS: Json[] = SCENES;
export const REMOVE: string[] = [];
