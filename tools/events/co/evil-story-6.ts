// Catalog Overhaul Pack, Evil Teams Volume III: Kanto, Team Rocket from inside (EVIL_TEAMS_VOLUME_3_A "Kanto" and
// TEAM_ROCKET_KANTO_FULL_1 part II, FULL_3 parts B to D). The Offer, the five Acts, the six Operations, Friday and the
// other inside-only scenes, the loyalty test and being found out. The Final Choice, the endings and Team Ledger are in
// evil-story-7.ts; the twelve scenes for any player in evil-story-8.ts. Standing, Suspicion and the rank are the
// `evil` effect's `standing`/`suspicion`/`rank` (core/evil/inside.ts). Player's codename: Agent 000, "House Card".
import { $, ch, ev, fight, flag, flagIs, inRegion, out, room, type Json } from '../dsl.ts';
import { evil as story, foe, kind, prompt } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-story';

const R = teamJson('rocket');
const GRUNT = R.ranks.grunt.sprite;
const EXEC = R.ranks.executive.sprite;
const BOSS = R.ranks.leader.sprite;
const TINT = R.color;
const K = inRegion('kanto');
const say = (who: string, line: string): string => `${who}: "${line}"`;
/** The region's team is Rocket (and the run is in Kanto). */
const rk = (o: Json = {}): Json[] => [{ kind: 'evil', team: 'rocket', ...o }, K];
const inside = (o: Json = {}): Json[] => rk({ inside: true, ...o });
const mark = (m: string): Json => story({ mark: m });
const meters = (standing: number, suspicion = 0, rank?: number): Json => story({ ...(standing ? { standing } : {}), ...(suspicion ? { suspicion } : {}), ...(rank ? { rank } : {}) });
const beat = story({ beat: true });
const quiet = (): Json[] => [meters(1, 1), ...kind(1)];

// ---------- The Offer (stage 2, after The Files) ----------
const OFFER = `A black car pulls up beside you. The back window comes down the width of a hand. ${say('Domino', `You broke a dig, a card game and four noses. The Boss read the report twice. He doesn't read anything twice.`)} ${say('Domino', `He's a businessman. You're an expense. He'd rather you were an asset. The pay's real. The uniform's optional, at your level. Yes or no. I've a manicure.`)}`;
const offered = flag('rocket-offered');
const yes = ch('"Yes."', out(`The window goes up. The door opens. ${say('Domino', `Celadon. The Game Corner. Tell the lift you're new; it'll know.`)} You're Team Rocket now, on the inside, and nobody outside knows it.`, mark('inside'), offered));
const report = ch('"Yes." (And tell the International Police.)', out(`You say yes to Domino. That night, from a phone box, you say it again to a tired man in a brown coat who calls himself Looker. "So. You will be my eyes inside. Be careful. They count everything, these people." You have a handler now. Every careless step counts double.`, mark('inside'), mark('inside-man'), flag('rocket-looker-met'), offered));
const no = ch('"No."', out(`${say('Domino', `Pity.`)} The window goes up, and the car slides away into the traffic. Team Rocket's story goes on as it was, with you on the outside of it.`, flag('rocket-offer-refused'), offered));
const offer: Json[] = [
  ev('evil-rocket-offer-kanto', 'The Offer', 'Evil Teams', { room: true, cast: [EXEC], tint: TINT, effect: 'glint' }, OFFER, [
    yes, no,
    ch('"What would I be doing?"', out(say('Domino', `Whatever makes money. You'd be surprised how little of it's dramatic.`), room('evil-rocket-offer-kanto-2'))),
    report,
  ]),
  ev('evil-rocket-offer-kanto-2', 'The Offer', 'Evil Teams', { room: true, cast: [EXEC], tint: TINT, effect: 'glint' }, `${say('Domino', `Well? Yes or no.`)} She looks at her nails.`, [yes, no, report]),
];
// Taken the bag at Induction Day already: Domino only nods.
(offer[0] as Json).remembers = [{ id: 'early', when: [flagIs('rocket-offered')], notice: `${say('Domino', `Oh. You took the bag at Induction Day. Jardine told me. Carry on, then.`)}`, hide: [0, 1, 2, 3], addChoices: [ch('Nod to Domino.', out(`The window goes up, and the car slides away.`))] }];

// ---------- Act 1. The Top Bunk (stage 3) ----------
const bunk = (text: string, ...fx: Json[]): Json => out(text, ...fx, flag('matori-met'), room('rk-act1-bunk'));
const fitting = room('rk-fitting');
const act1: Json[] = [
  ev('rk-act1', 'The Top Bunk', 'Evil Teams', { callback: true, requires: inside({ beat: 2 }), cast: [GRUNT], tint: TINT, effect: 'none' },
    `A lift with no buttons. It goes down for longer than the building's tall. Doors; a corridor painted the green of a hospital; a woman with a tablet, who doesn't look up. ${say('Matori', `Agent 000. Provisional. You'll be "House Card" on the radio. Sit.`)} One chair. One question. ${say('Matori', `What are you running from?`)} Whatever you say, she writes it down.`,
    [
      ch('"Nothing."', bunk(`She writes: "Says nothing. Means: doesn't know yet." ${say('Matori', `Bunk nineteen. Lower. Don't take the top. Uniform's on the bed. It won't fit; they don't. Friday's pay. Questions go to your squad leader. You don't have one yet. So: no questions.`)}`, flag('rocket-matori-nothing'))),
      ch(`"I'm not. I'm looking."`, bunk(`She writes: "Looking. For what, not stated." ${say('Matori', `Bunk nineteen. Lower. Don't take the top. Uniform's on the bed. It won't fit; they don't. Friday's pay. No questions.`)}`, flag('rocket-matori-looking'))),
      ch('"Somebody I couldn\'t beat."', bunk(`She writes: "A rival. Good. They work harder." Somewhere a black envelope is addressed to your rival. ${say('Matori', `Bunk nineteen. Lower. Don't take the top. Friday's pay. No questions.`)}`, flag('rocket-matori-rival'))),
      ch('(Say nothing.)', bunk(`She waits. You wait longer. She writes: "Declined. Noted as: careful." ${say('Matori', `Bunk nineteen. Lower. Don't take the top. Friday's pay. No questions.`)}`, flag('rocket-matori-careful'), mark('careful'))),
    ]),
  ev('rk-act1-bunk', 'The Dormitory', 'Evil Teams', { room: true, cast: [GRUNT], tint: TINT },
    `Forty beds. The boiler. A smell of floor polish and instant noodles. A Grunt of about nineteen is folding a uniform into a perfect square. ${say('Otis Blackthorn', `You're the new one. Don't take the top bunk; it's Remy's, and Remy's not coming back, and nobody says so.`)} The top bunk's made. A paperback, face down, a third of the way through. Boots under it, side by side. ${say('Otis', `I joined for the dental. I'm not joking. Look.`)} His teeth are excellent. ${say('Otis', `Six months ago I couldn't chew. Rocket's got a dentist. What's the League got? A hat. They don't tell you what the crates are. You load the crates. Nobody here's ever done a whole bad thing. Just a twelfth.`)}`,
    [
      ch(`"What's in the crates?"`, out(say('Otis', `Stock. That's the word. Don't say another word; say "stock."`), room('rk-act1-crate'))),
      ch('"Where did Remy go?"', out(`He stops folding. ${say('Otis', `He asked what was in a crate. Out loud. In the lift. With Butch in it.`)} He starts again. ${say('Otis', `His book's about a detective. I've read the back. I've not turned it over. Feels like it'd be turning him over.`)}`, room('rk-act1-crate'))),
      ch('"Which twelfth is ours?"', out(say('Otis', `Thursdays, we carry. Lift to lorry. That's all. We carry.`), room('rk-act1-crate'))),
      ch('"Who else is down here?"', out(`He points, bed by bed. A girl by the door, writing a letter she won't post. A man of fifty, asleep in his boots. A boy facing the wall. ${say('Otis', `Don't ask him. Matori knows. That's enough people knowing.`)}`, room('rk-act1-crate'))),
    ]),
  ev('rk-act1-crate', 'Thursday', 'Evil Teams', { room: true, cast: [GRUNT], tint: TINT },
    `Thursday. A trolley, six crates, the lift, the loading bay, a lorry with its engine running, and Sergeant Jardine with a clipboard. ${say('Sergeant Jardine', `Six on the sheet, six on the truck. That's the whole job, and I love it. Don't make it seven. Don't make it five.`)} The fourth crate's warm. It shifts its weight when it's lifted, the way a sleeper does. There's a slot in the side, a hand wide.`,
    [
      ch('Look.', out(`A Sandshrew. A grey collar on it with a light. Its eyes are shut tight, not in sleep. It's breathing as if it's been told to. A guard has seen your face at the slot. Otis has seen it too. He says nothing. He looked too, once.`, meters(0, 1), flag('rocket-crate-seen'), room('rk-act1-night'))),
      ch(`Don't look.`, out(`The crate's loaded. Six on the sheet. Jardine ticks it, and whistles.`, meters(1), beat, fitting)),
      ch(`"Otis. This one's alive."`, out(`${say('Otis', `I know. Fourth one always is. I've carried forty fourth-ones.`)} He doesn't look at it. Quieter: ${say('Otis', `I looked, my second week. Don't. You can't un-look.`)}`, beat, fitting)),
    ]),
  ev('rk-act1-night', 'Lights Out', 'Evil Teams', { room: true, cast: [GRUNT], tint: '#141a24' },
    `That night, in the bunk room, in the dark. ${say('Otis', `What was it?`)}`,
    [
      ch('"A Sandshrew."', out(`A long quiet. ${say('Otis', `...Mine was a Vulpix. Second week. It'd been somebody's. It had a ribbon.`)} He turns over. "Night."`, flag('rocket-otis-vulpix'), beat, fitting)),
      ch('"Stock."', out(`"Right," he says, after a while. "Stock." He doesn't sound as if he believes either of you.`, beat, fitting)),
      ch('"You know what it was."', out(`He doesn't answer. Much later, when you think he's asleep: "Yeah. I know."`, beat, fitting)),
    ]),
  // I2. The Fitting (after Act 1, at its node).
  ev('rk-fitting', 'The Fitting', 'Evil Teams', { room: true, cast: [GRUNT], tint: TINT, effect: 'sparkle' },
    `The quartermaster has pins in his mouth. He's Mr. Tavish Gladwell, the same who does the Boss's suits. ${say('Mr. Gladwell', `Arms up. They never fit. It's policy. A Grunt in a uniform that fits starts thinking he's somebody. I'll tell you a secret: I take them in, when they've been here a year. A half-inch. They don't notice. They just stand straighter. That's all a year's worth.`)} Cap or no cap; gloves; where the R goes. And one thing that isn't regulation.`,
    [
      ch('A pin of your own.', out(`${say('Mr. Gladwell', `That's not regulation.`)} He sews it on. ${say('Mr. Gladwell', `I'll put it down as "damaged in the field."`)} By the sixth week, three others in the bunk room have something that isn't regulation.`, flag('rocket-fitting-pin'))),
      ch('A scarf.', out(`${say('Mr. Gladwell', `That's not regulation.`)} He tucks it in himself. ${say('Mr. Gladwell', `"Damaged in the field."`)} By the sixth week, three others in the bunk room have something that isn't regulation.`, flag('rocket-fitting-scarf'))),
      ch('Your own boots.', out(`${say('Mr. Gladwell', `Those are not regulation.`)} He looks at them a long time, and then at you. ${say('Mr. Gladwell', `"Damaged in the field." Off you go.`)}`, flag('rocket-fitting-boots'))),
    ]),
];

// ---------- Act 2. The Tenth (stage 4) ----------
const act2: Json[] = [
  ev('rk-act2', 'The Tenth', 'Evil Teams', { callback: true, requires: inside({ beat: 3 }), cast: [GRUNT, GRUNT], tint: TINT },
    `A promotion, by envelope; a squad of two, by name; six shops, by address. In the motor pool, a black car too big for the job: Otis in the back, pleased, and in the front, with a ledger on her knee, a woman of forty in a cardigan over the uniform. ${say('Faye Coldwell', `I'm your books. Eleven years at Silph Co., accounts receivable, never late. They let me go by letter. Second-class post. The week after, a car came. He sent a car. A real person got out and said my name. I'm not saying any of this is right. I'm saying I know which one sent a car.`)} ${say('Otis', `She does the sums. I carry. You're the one who knocks.`)} Five shops in Celadon pay without a word. The bakery: "It's in the tin. Tell him the bread's good this week." The bike shop owner pays and doesn't look up. The tailor: "I pay the tenth and I do his suits. I'd like that noted." (Faye: "It's been noted for six years.") The tea shop puts a bun in Otis's other hand: "You're too thin. All of you." The pawnbroker: "A tenth. It's the only honest number in this town." The sixth is a florist, Miss Anselma Vickery, with soil on her hands. ${say('Miss Vickery', `It was a bad month. It's always a bad month; I sell flowers. Take the till. Leave me the stock, or there's no next month to collect from.`)} The till's light. Otis is looking at a bucket of sunflowers as if he's never seen one close.`,
    [
      ch('Take the till.', out(`It's done. She watches the coins counted. "Six years I've paid. One short month." By the time this region is nearly over, the shop will be shuttered.`, meters(1, 0, 2), flag('rocket-florist-shut'), beat)),
      ch('Pay it out of my own pocket. (₽1,000)', out(`Your own coins go in the envelope. In the car, Faye doesn't look round. ${say('Faye', `You'll go broke being decent on his behalf. I'll not write it. But I saw it.`)} A stage later there's a sunflower on your bunk.`, $(-1000), meters(1, 1, 2), ...kind(1), flag('rocket-vickery-paid'), beat), { requires: [{ kind: 'money', atLeast: 1000 }] }),
      ch('"Faye. What does the book say?"', out(`Faye turns back four pages. Then four more. Her finger stops.`, meters(2, 0, 2), flag('rocket-skim-found'), room('rk-act2-book'))),
      ch(`"A tenth of nothing's nothing. We'll come back."`, out(`It's Madame's rule, in Madame's words, and Faye looks up sharply. "...Who taught you that?" It's right. The round's short, and it's correct. Somewhere in the count room, Pit Boss Vesper hears of it, approves, and says so to nobody.`, meters(1, 0, 2), flag('rocket-tenth-of-nothing'), flag('rocket-rules-heard'), beat)),
    ]),
  ev('rk-act2-book', 'The Book', 'Evil Teams', { room: true, cast: [GRUNT, GRUNT], tint: TINT },
    `${say('Faye', `It says she's paid in full since March. Every month. There's a tick. And there's an entry, in another hand, each month after, marking her "short," and a second collection. The second one never reaches the count room.`)} ${say('Otis', `So somebody's been—`)} ${say('Faye', `Somebody's been taking a tenth of a tenth off a woman who sells flowers. It's Cassidy's round, the second Tuesday. I've known since June. I've said nothing. You're the squad leader. Say something, or don't.`)}`,
    [
      ch('Report it to Domino.', out(`Domino listens with her eyes shut. "Skimming. From the Boss. How stupid, and how useful." You're a Field Agent by morning. Cassidy is docked, and she knows exactly who did it.`, meters(0, 0, 3), flag('cassidy-grudge'), beat)),
      ch('Tell Cassidy we know.', out(`You find Cassidy alone by the lockers and tell her what the book says. She goes white. She doesn't argue. By Friday the money is back where it came from, and Cassidy can't quite look at you. She owes you, and she knows it.`, flag('cassidy-owes'), beat)),
      ch(`Give Miss Vickery back what was skimmed, from the float.`, out(`Faye writes it as "correction of clerical error." Miss Vickery counts it twice, and then a third time, and then sits down among her buckets.`, meters(0, 1), ...kind(2), flag('rocket-vickery-refund'), beat)),
      ch('Say nothing. Yet.', out(`Faye closes the ledger without a word, and marks the page with a pressed sunflower petal. It's yours to use, later, when it matters.`, flag('rocket-skim-held'), beat)),
    ]),
];
(act2[0] as Json).remembers = [{ id: 'sunflower', when: [flagIs('rocket-vickery-refund')], notice: `Miss Vickery has heard what you did. There's a sunflower on your bunk.` }];

// ---------- Act 3. Third Floor (stage 5): a door of four rooms (ps_rk_tower) ----------
const way = (text: string, ...fx: Json[]): Json => out(text, ...fx, room('rk-tower-down'));
const act3: Json[] = [
  ev('rk-act3', 'Third Floor', 'Evil Teams', { callback: true, requires: inside({ beat: 4 }), cast: [EXEC, GRUNT], tint: '#22142e', effect: 'fog' },
    `Lavender, after dark. The squad's been lent to Butch. By torchlight, at Pokémon Tower's door, he talks to six Grunts. ${say('Butch', `In, crates, out. The ghosts aren't real. The Marowak's real. The Marowak's a problem. That's why House Card's here.`)} ${say('A Grunt', `It's Thursday.`)} ${say('Butch', `So?`)} ${say('The Grunt', `You don't say its— we don't come here Thursdays.`)} ${say('Butch', `You do now.`)}`,
    [ch('Go in.', out(`The door is heavier than it looks. Inside, it's colder than outside.`, room('rk-tower-graves')))]),
  ev('rk-tower-graves', 'The Graves', 'Evil Teams', { room: true, cast: [GRUNT], tint: '#22142e', effect: 'fog' },
    `Rows of small stones. The squad's to lift what's been left at them: collars, bells, a favourite ball. "Stock," Butch says.`,
    [
      ch('Carry what you\'re handed.', out(`You carry. A bell rings once in the bag, and every Grunt on the floor flinches.`, room('rk-tower-stair'))),
      ch('Put each thing back as Otis lifts it.', out(`Otis notices. After the third one, he starts putting them back himself.`, ...kind(1), flag('rocket-graves-back'), room('rk-tower-stair'))),
    ]),
  ev('rk-tower-stair', 'The Stair', 'Evil Teams', { room: true, cast: [GRUNT], tint: '#160e22', effect: 'fog' },
    `Something goes past on the landing: a cold patch and a smell of burnt wire. Every Grunt's flat against the wall. The Black Fog. It doesn't stop. It's looking for a collar to eat, and nobody here is wearing one.`,
    [ch('Keep climbing.', out(`It drifts on down the stairwell, and the air warms by a degree. Nobody says anything about it.`, room('rk-tower-third')))]),
  ev('rk-tower-third', 'The Third Floor', 'Evil Teams', { room: true, cast: [GRUNT, GRUNT], pokemon: 'marowak', tint: '#22142e', effect: 'fog' },
    `A Marowak stands between the squad and a small grave, a club held in both hands. She isn't attacking. She's standing. Behind her leg: a Cubone that can't be more than a month old. Its skull doesn't fit yet. ${say('Otis', `...That's its kid. That's— I didn't sign up for a kid.`)} ${say('Faye', `Rule three. "Nobody touches the children." It's in the book. It's the oldest line in the book.`)} ${say('Butch, on the radio', `The mother's worth four thousand to the lab. The skull alone's worth— somebody deal with it. Agent 000. That's an order.`)} The Marowak has looked at you. She's worked out who's in charge. (Whatever you choose, no blow is shown, and the Cubone is never struck.)`,
    [
      ch('"Stand down. All of you."', way(`Otis is behind you before the sentence is finished. Faye closes her ledger. The other three Grunts look at their boots, and then, one by one, step back. Butch reports it. The Marowak watches you all the way to the stairs. She doesn't lower the club. She dips her head, once.`, meters(-1, 3), flag('rocket-tower-spared'))),
      ch('"Take the Cubone and run; leave her."', way(`It's lifted, quickly, in Otis's jacket. It doesn't cry. The mother follows to the Tower's door, and the lorry as far as the town's edge, and stands in the road. It will be in the Holding Pen by morning. Otis doesn't speak to you for a stage.`, meters(2), flag('rocket-tower-taken'))),
      ch('"Battle her. Properly. And let her win."', way(`You send out your lead and fight her the way a good trainer fights, and every turn you can see which move would end it, and every turn you choose another. The squad "retreats in good order." ${say('Butch', `Useless.`)} Faye writes it up as equipment failure, and files it under a heading nobody reads.`, meters(-1, 1), flag('rocket-tower-thrown'))),
      ch('"Butch. Rule three."', way(`${say('Butch', `That's for people's kids.`)} Faye takes the radio and reads, level: ${say('Faye', `"Nobody touches the children." It doesn't say whose. I've the original. In her hand.`)} A long hiss of static. ${say('Butch', `...Leave it. Bring the collars.`)} Nothing is taken, and nothing is owed.`, flag('rocket-tower-rule3')), { requires: [flagIs('rocket-rules-heard')] }),
    ]),
  ev('rk-tower-down', 'The Way Down', 'Evil Teams', { room: true, cast: [GRUNT], tint: '#22142e' },
    `On the stairs, going down.`,
    [ch('Go down.', out(`Otis is carrying nothing. He's put everything back. At the door he stops, takes one collar out of his own pocket, and goes back up alone. He's two minutes. "Right. Now I've put everything back."`, beat), {
      branches: [
        { when: [flagIs('rocket-tower-taken')], text: `It's asleep against Otis. He's holding it the way people hold something they've decided to feel nothing about.`, effects: [beat] },
        { when: [flagIs('rocket-tower-thrown')], text: `The squad's bruised and laughing, the way people laugh after. ${say('A Grunt', `She had us.`)} ${say('Another', `...Did she? I thought House Card had her.`)} Nobody answers.`, effects: [beat] },
      ],
    })]),
];

// ---------- Act 4. The Persian's Plate (stage 6) ----------
const asked = (k: string): Json => flagIs(`rk-asked-${k}`, 0, 0);
const ask = (k: string, label: string, text: string, back: string, need: Json[] = [], ...fx: Json[]): Json => ch(label, out(text, flag(`rk-asked-${k}`), ...fx, room(back)), { requires: [asked(k), ...need] });
// He answers any number of questions, each once: three about the business, then two about him.
const BUSINESS = (): Json[] => [
  ask('rigs', '"And the Rigs?"', `He puts the fork down. ${say('Giovanni', `A tool. I don't love it. I don't love guns either. I own both.`)}`, 'rk-act4-talk'),
  ask('roof', `"What's on the roof?"`, `The Persian has stopped eating. ${say('Giovanni', `Insurance. I'll never use it. That's what makes it worth having. My mother thinks I'm a fool. She's rung nine times.`)}`, 'rk-act4-talk'),
  ask('rule3', '"Rule three."', `${say('Giovanni', `Faye read it out over the radio. In my mother's hand. Butch wanted her docked.`)} He smiles, slightly. ${say('Giovanni', `I've had her wage raised. Don't tell her why. It'd frighten her.`)}`, 'rk-act4-talk', [flagIs('rocket-tower-rule3')]),
  ch('Ask about him.', out(`He waits, fork in hand.`, room('rk-act4-him'))),
];
const HIM = (): Json[] => [
  ask('want', '"What do you want from me?"', say('Giovanni', `Company at the top of a tower. And somebody to tell me, afterward, whether it was worth it. I shan't know. I never do.`), 'rk-act4-him'),
  ask('son', '"Does your son know where you are?"', `The longest pause of the night. ${say('Giovanni', `...No. Find him, and I'll make you Executive tonight. Don't find him, and I'll think more of you.`)}`, 'rk-act4-him', [], flag('rocket-find-son')),
  ch('Say nothing more.', out(`He nods, as if that were an answer too, and opens a drawer.`, room('rk-act4-drawer'))),
];
const act4Intro = `A card under the bunk-room door, with a time and no place. Jardine's car knows the place: the Viridian Gym, after hours. Sand, raked. One lamp. A man in a good suit at a small table, eating alone, cutting his meat very small, feeding a Persian on the next chair from his own plate. ${say('Giovanni', `Sit. You're wondering why you. Everybody here wants something from me. You've wanted nothing, twice, to my face. It's restful.`)}`;
const act4Rest = `${say('Giovanni', `This was mine. Honestly mine. Eleven inspections. They sent their hardest man, the last time; he looked for a week. He shook my hand and said, "Cleanest Gym in Kanto." I had him followed home. I wanted to know what an honest opinion cost. It hadn't cost anything. I've never got over that.`)} ${say('Giovanni', `I had a son. I have. He's somewhere in this region with red hair and my temper, stealing Pokémon from laboratories because he thinks it's what I'd respect. It isn't. I'd respect him buying the laboratory. I built this so he'd have something. He won't take it. So: Silph. If I own the company that makes the Ball, I own the door every Pokémon in the world goes through. Nobody's hurt. They just pay. A tenth. That's all I've ever wanted. For it to be orderly.`)}`;
const act4: Json[] = [
  ev('rk-act4', `The Persian's Plate`, 'Evil Teams', { callback: true, requires: inside({ beat: 5 }), cast: [BOSS], pokemon: 'persian', tint: '#1c1c28', effect: 'glint' }, `${act4Intro} ${act4Rest}`, BUSINESS()),
  ev('rk-act4-talk', `The Persian's Plate`, 'Evil Teams', { room: true, cast: [BOSS], pokemon: 'persian', tint: '#1c1c28' }, `He waits, fork in hand, for the next question.`, BUSINESS()),
  ev('rk-act4-him', `The Persian's Plate`, 'Evil Teams', { room: true, cast: [BOSS], pokemon: 'persian', tint: '#1c1c28' }, `He cuts another piece for the Persian, and waits.`, HIM()),
  ev('rk-act4-drawer', 'The Photograph', 'Evil Teams', { room: true, cast: [BOSS], tint: '#1c1c28' },
    `He opens a drawer. He doesn't take anything out. He looks, and shuts it.`,
    [
      ch('"May I?"', out(`He's still for a moment. Then he turns the drawer toward you. A boy of nine, scowling, on a raked sand floor, with a Sneasel on his shoulder that's scowling the same way. On the back, in a woman's hand: "He won't smile for the camera. I said: neither would you."`, flag('rocket-boss-photograph'), room('rk-act4-phone'))),
      ch(`(Don't ask.)`, out(`You don't ask. He seems glad of it.`, room('rk-act4-phone'))),
    ]),
  ev('rk-act4-phone', 'The Telephone', 'Evil Teams', { room: true, cast: [BOSS], tint: '#1c1c28' },
    `The telephone rings. He lets it. ${say('Giovanni', `That's her. Thursday.`)} It rings on. ${say('Giovanni', `Answer it, if you like. She'll want to know who you are. Don't lie; she always knows.`)}`,
    [
      ch('(Answer it.)', out(`A warm, amused, frightening voice: "Oh, he's got company. Good. He eats too fast alone. Who's this? ...House Card. Matori's told me. You're the one who keeps choosing the long way round." A pause. "He's forgotten the rest of my rules. The fourth one went: give it back when they can pay. Say that to him, dear. Not tonight. On the roof." The line clicks. Giovanni has listened to all of it and says nothing at all.`, flag('rocket-madame-spoke'), flag('rocket-madame-line'), flag('rocket-rules-heard'), meters(2, 0, 5), mark('confided'), beat), {
        branches: [{ when: [{ kind: 'evil', standing: 6 }], text: `A warm, amused, frightening voice: "Oh, he's got company. Good. He eats too fast alone. Who's this? ...House Card. Matori's told me." A pause. "He's forgotten the rest of my rules. The fourth one went: give it back when they can pay. Say that to him, dear. Not tonight. On the roof." The line clicks. Giovanni looks at you a long while. "Right Hand," he says. "Don't make me regret it."`, effects: [flag('rocket-madame-spoke'), flag('rocket-madame-line'), flag('rocket-rules-heard'), meters(2, 0, 6), mark('confided'), beat] }],
      }),
      ch('(Let it ring.)', out(`It rings eleven times and stops. ${say('Giovanni', `She'll ring again. She always does.`)} He pushes his plate to the Persian. You're an Executive when you leave, and you've listened to the Boss, which very few people have.`, meters(2, 0, 5), mark('confided'), beat), {
        branches: [{ when: [{ kind: 'evil', standing: 6 }], text: `It rings eleven times and stops. ${say('Giovanni', `She'll ring again.`)} He looks at you a long while. "Right Hand," he says. "Don't make me regret it."`, effects: [meters(2, 0, 6), mark('confided'), beat] }],
      }),
    ]),
];
(act4[0] as Json).remembers = [{ id: 'matori', when: [flagIs('rocket-matori-nothing')], notice: say('Giovanni', `Matori says you don't know what you're running from. I find that's the only kind worth hiring. The others arrive with a grudge, and a grudge is somebody else's leash.`) }];
(act4[1] as Json).remembers = [{ id: 'crate', when: [flagIs('rocket-crate-seen'), flagIs('rk-asked-rigs')], notice: say('Giovanni', `You looked in a crate. Matori said. Good. I don't trust anyone who's never looked.`) }];

// ---------- Act 5. Sandwiches (stage 7, then the Final Choice) ----------
const act5: Json[] = [
  ev('rk-act5', 'Sandwiches', 'Evil Teams', { callback: true, requires: inside({ beat: 6 }), cast: [GRUNT, GRUNT], tint: '#2a1e3a' },
    `Saffron's sealed under a violet shimmer. The squad's been posted to a stairwell in Silph Co., floor six, and told to wait: concrete stairs, a fire door, three people on a step, eating out of paper. ${say('Otis', `Cheese. They're all cheese. Who makes forty cheese sandwiches for a takeover?`)} ${say('Faye', `Catering. Line eleven. I approved it.`)} ${say('Faye', `Whatever happens tomorrow, I've put you both down as "contractors." If it goes badly, you were never on the payroll. It's the only thing I can do with a pen.`)} ${say('Otis', `If it goes well?`)} ${say('Faye', `Then I've cost you a pension. I'd apologise. I won't.`)} ${say('Otis', `I've been thinking about the top bunk. If Remy'd asked what was in the crate quietly. To one person. He'd still be reading that book. I never asked. I'm still here. I don't know which of us got it right.`)}`,
    [
      ch('"He got it right."', out(`Otis nods slowly, as if you'd confirmed a suspicion.`, room('rk-act5-faye'))),
      ch(`"You're still here. That counts."`, out(`"Does it?" He tears his sandwich in half and gives you the bigger bit.`, room('rk-act5-faye'))),
      ch('"Ask now."', out(`He looks at the fire door. He looks at Faye. ${say('Otis', `...Faye. What's in the crates?`)} ${say('Faye', `Four thousand, one hundred and twelve Pokémon, since the book began. Each with a previous owner. I've the list. I've had it since my first week. I thought if I never said the number, it'd stay a number.`)} She's said it.`, flag('rocket-otis-asked'), room('rk-act5-faye'))),
    ]),
  ev('rk-act5-faye', 'Sandwiches', 'Evil Teams', { room: true, cast: [GRUNT, GRUNT], tint: '#2a1e3a' },
    `Below you, the building hums. Somewhere above, a lift's going up without stopping. Faye is folding her sandwich paper into a perfect square.`,
    [
      ch(`"Why 'contractors'?"`, out(say('Faye', `Contractors walk. Staff hang. It's the only clause in the building I wrote myself.`), room('rk-act5-you'))),
      ch('"What would you write, if it were up to you?"', out(say('Faye', `"Returned." Four thousand one hundred and twelve times. I've practised the handwriting.`), room('rk-act5-you'))),
      ch('"Have you ever met him?"', out(say('Faye', `Once. He held a door for me. I've never decided what to do with that.`), room('rk-act5-you'))),
    ]),
  ev('rk-act5-you', 'Sandwiches', 'Evil Teams', { room: true, cast: [GRUNT, GRUNT], tint: '#2a1e3a' },
    `${say('Otis', `What about you? You never said why you joined.`)} Matori's note from your first day is in your head, word for word.`,
    [
      ch('(The same answer.)', out(`You give it again. Otis nods. "Fair." A door, far above. Footsteps coming down. They stop one flight up. Matori, to nobody, over the rail: "Agent 000. Eleventh floor. Dawn. He'd like you to bring the key." A pause. "I'd bring your squad. I haven't said that."`, beat, room('rk-final-choice'))),
      ch('(A different one.)', out(`You tell him something truer. He listens all the way through. A door, far above. Footsteps stop one flight up. Matori, over the rail: "Agent 000. Eleventh floor. Dawn. He'd like you to bring the key." A pause. "I'd bring your squad. I haven't said that."`, beat, room('rk-final-choice'))),
      ch('"Ask me tomorrow."', out(`"Tomorrow, then," Otis says. "I'll hold you to it." A door, far above. Footsteps stop one flight up. Matori, over the rail: "Agent 000. Eleventh floor. Dawn. Bring the key." A pause. "I'd bring your squad. I haven't said that."`, beat, room('rk-final-choice'))),
    ]),
];

// ---------- The six Operations (FULL_3 C): one per stage from 3, optional. Either way, Standing +1 ----------
const OPS: Json[] = [
  ev('rk-op-protection-round', 'Operation: The Protection Round', 'Evil Teams', { requires: inside({ after: 2 }), cast: [GRUNT, GRUNT], tint: TINT },
    `The weekly round: six shops in Celadon, a tenth from each. The tailor's the richest, and the rudest. The tea shop's the poorest, and gave Otis a bun.`,
    [
      ch('Collect from all six.', out(`Six envelopes, six ticks. Faye writes them in without comment.`, meters(1))),
      ch(`Collect from five; "lose" the tea shop's address.`, out(`${say('Faye', `One short. I'll write "premises closed for a family matter." Whose family?`)} You tell her. ${say('Faye', `...Good choice.`)}`, ...quiet())),
      ch(`Collect from five; "lose" the tailor's address.`, out(`${say('Faye', `One short. Whose family?`)} You tell her. ${say('Faye', `...Good choice. I'd have picked the tailor. I dislike the tailor.`)}`, ...quiet())),
    ]),
  ev('rk-op-night-lorry', 'Operation: The Night Lorry', 'Evil Teams', { requires: inside({ after: 3 }), cast: [GRUNT], tint: '#141a24', effect: 'rain' },
    `Six crates, Mt. Moon to Vermilion, overnight. The fourth one's warm.`,
    [
      ch('Take the main road.', out(`Six crates, on time. At Vermilion, Major Surge counts them off his clipboard and signs.`, meters(1))),
      ch('Take the coast road.', out(`It's longer, and it's wet. At a lay-by in the rain, Otis has the tailgate down, and two collars are sparking. ${say('Otis', `They've stopped. The lights. Look at it. It's opened its eyes.`)} A Sandshrew. ${say('Otis', `It's looking at me like I'm somebody.`)} At Vermilion, Surge scowls at his clipboard. "Four live, two duds. Namba'll scream." The two "duds" go on the reject pile, which nobody guards.`, ...quiet(), flag('rocket-lorry-damp'))),
    ]),
  ev('rk-op-card-sharp', 'Operation: The Card Sharp', 'Evil Teams', { requires: inside({ after: 3 }), cast: [GRUNT], tint: '#3a1e28', effect: 'sparkle' },
    `The Game Corner, after midnight. ${say('Vesper', `He's in for forty thousand. He'll stake the deeds on the last hand. Deal him the seven.`)} Across the felt, a man who owns a diner is shaking.`,
    [
      ch('Deal him the seven.', out(`He turns it over and sits very still. The deeds slide across the table. Vesper counts.`, meters(1))),
      ch('Deal him the ace.', out(`He turns the card. He doesn't cheer. He gets up, very carefully, takes his deeds, and walks out without his coat. Vesper, afterwards, counting, doesn't look up: "House lost forty thousand tonight. Dealer's error. It's in the book. The other book. He's got a girl of nine."`, ...quiet(), flag('rocket-card-ace'))),
    ]),
  ev('rk-op-understudy', 'Operation: The Understudy', 'Evil Teams', { requires: inside({ after: 4 }), cast: [GRUNT], tint: TINT },
    `The order: pose as a Silph safety inspector, and pass the eleventh-floor lift as sound. It's been tampered with, for the night.`,
    [
      ch('Pass it, as ordered.', out(`You sign the sheet without opening the panel. Nobody at Silph asks a question of a clipboard.`, meters(1))),
      ch('Do the inspection properly.', out(`The cable: fine. The brake: filed half through; it would hold a Boss, and it wouldn't hold a full car of staff. The call button rings a Rocket phone. You write it up: "Brake: FAIL." A Silph engineer mends it by lunch, and on the night, the lift works for everyone. A man in a brown coat reads the report over the engineer's shoulder. "An honest inspector. In that uniform." He catches your eye. "I am tying my shoe."`, ...quiet(), flag('rocket-lift-fixed'), flag('rocket-looker-met'))),
    ]),
  ev('rk-op-stray-order', 'Operation: The Stray Order', 'Evil Teams', { requires: inside({ after: 5 }), cast: [GRUNT, GRUNT], tint: TINT },
    `Bring in forty strays for the Rigs: Jardine's lorry, and a net.`,
    [
      ch('Bring in forty.', out(`Forty, netted and loaded. Jardine doesn't ask. Namba is pleased.`, meters(1))),
      ch('Bring in forty, and check each for a collar.', out(`Thirty-one have one. ${say('Otis', `That's not a stray. That's "Biscuit." It says "Biscuit, 14 Maple Lane."`)} ${say('Jardine', `Not asking.`)} ${say('Faye', `Thirty-one delivered in error to their registered addresses. Nine genuine strays.`)} She looks at the nine. "...The dentist wants a cat." The nine are homed in the building. The Rigs get none. Namba screams.`, ...quiet(), flag('rocket-strays-home'))),
    ]),
  ev('rk-op-favour', 'Operation: The Favour', 'Evil Teams', { requires: inside({ after: 6 }), cast: [GRUNT], tint: TINT },
    `A Gym trainer owes the Corner ₽20,000. He's to throw his next match against a challenger Rocket's backing. ${say('Jessup Rookwood', `I'll lose my place. It's all I've got. I only went in for my sister's school fees.`)}`,
    [
      ch('Lean on him.', fight(`He squares up, shaking.`, { kind: 'trainer', name: 'Jessup Rookwood', size: 3, types: [], levelBonus: 1, win: [] }, meters(1))),
      ch(`Pay his debt from the Operation's float.`, out(`${say('Faye', `Twenty thousand, from operating expenses, to clear a debt owed to ourselves. I'm calling it "petty cash." It's the largest petty cash I've ever written.`)} ${say('Jessup', `Why would— you're them.`)} ${say('Otis', `We're a twelfth of them.`)} He fights his match straight, and wins it.`, ...quiet(), flag('rocket-jessup-free'))),
    ]),
];

// ---------- I1. Friday (every stage from 3) ----------
const friday = (n: number, after: number, slip: string, extra: Json[] = []): Json =>
  ev(`rk-friday-${n}`, 'Friday', 'Evil Teams', { requires: inside({ after }), cast: [GRUNT], tint: TINT, effect: 'sparkle' },
    `Pay day. An envelope with your codename on it, to the coin. ${slip}`,
    [
      ch('Keep it.', out(`You pocket it. It's heavier than money ought to be.`, $(500))),
      ch('Send it home.', out(`You post it home with no note. Somebody there will wonder.`, ...kind(1))),
      ch('Put it back where it came from.', out(`You return this week's tenth to one of the shops on the round. Nobody audits what a Grunt does with their own pay. Faye knows. Faye knows everything. That night Otis pushes half his noodles across: "You've no money. Again."`, ...kind(1), flag('rocket-friday-back'))),
      ...extra,
    ]);
const FRIDAYS: Json[] = [
  friday(3, 2, `A slip: "First week. Dental from Monday." ${say('Otis', `Told you.`)}`),
  friday(4, 3, `A tenth, itemised. Each item is a name: "Vickery's. Nettlebed's." You know exactly whose money you're holding.`),
  friday(5, 4, `A slip in Matori's hand: "Bonus, Lavender." It's ₽4,000.`, [ch('Refuse the bonus.', out(`You hand it back across the desk. Matori writes something down. That night, Otis speaks to you again.`, meters(0, 1), flag('rocket-bonus-refused')), { requires: [flagIs('rocket-tower-taken')] })]),
  friday(6, 5, `A note in Matori's hand: "You're owed a day's leave. So am I. Don't take yours either."`),
  friday(7, 6, `Double. A slip: "For tomorrow." Nobody in the bunk room has opened theirs.`),
];
(FRIDAYS[2] as Json).remembers = [{ id: 'bonus', when: [flagIs('rocket-tower-taken')], notice: `The ₽4,000 is for Lavender. For the Cubone. You may refuse it.` }];

// ---------- I3. The Motor Pool Derby, I4. The Second Book ----------
const derbyEnd = `Afterwards, on upturned crates: ${say('Sergeant Jardine', `I never ask, you know. What's in the back. Thirty years. You know why? Because I like driving. If I asked, I'd have to stop. So I've never asked. I'm a happy man.`)} His whistle has stopped. ${say('Jardine', `...I was a happy man till about a minute ago. Why'd you make me say it out loud?`)}`;
const EXTRA: Json[] = [
  ev('rk-derby', 'The Motor Pool Derby', 'Evil Teams', { requires: inside({ after: 4 }), cast: [GRUNT], tint: TINT, effect: 'sparkle' },
    `${say('Sergeant Jardine', `Once a year! Lorries! Round the back of the Game Corner and through the car park. No prize. No reason. It's the best day.`)} You're in a lorry, with Otis navigating badly. ${say('Otis', `Left! No. My left. Your— that was a bollard.`)}`,
    [ch('Drive.', out(`You win, by a bumper. ${derbyEnd}`, flag('jardine-said')), { prompt: prompt('dodge-tap'), fail: out(`You lose, by a bollard. ${derbyEnd}`, flag('jardine-said')) })]),
  ev('rk-second-book', 'The Second Book', 'Evil Teams', { requires: [...inside({ after: 5, rank: 4 }), { kind: 'period', in: ['night'] }], cast: [EXEC], tint: '#1c1c28' },
    `${say('Pit Boss Vesper', `Rank four gets you the count room. Sit. I'll show you something I show one person a year.`)} A second ledger. Small. Black. Every page a date and a line. "A girl, six, lost her mother at the slots. Found. Ice cream. ₽12." "A boy, nine, crying: his father had staked the boy's Pokémon. Returned to the boy. Father barred. Loss to house: ₽8,000." ${say('Vesper', `Rule three. It's the only one I'd keep if I'd to pick. I run a room that takes people's rent off them. I'm not good. But there's a book where I was, on the day, about the one thing. I'd like somebody to know it's there.`)}`,
    [
      ch('"Why show me?"', out(say('Vesper', `Because one day somebody will ask what this place was, and I'd like them to ask you.`), flag('vesper-book'))),
      ch('"Does the Boss know?"', out(say('Vesper', `He knows there's a second book. He's never asked to see it. That's how I know he's read it.`), flag('vesper-book'))),
      ch('"Add one."', out(`He turns to the last page. He writes: "A Cubone, a month old. Pokémon Tower. Left with its mother. Loss to house: ₽4,000. Entered by: House Card." He blots it. ${say('Vesper', `There. You're in the good book. There's only the two of us.`)}`, flag('vesper-book'), ...kind(1)), { requires: [flagIs('rocket-tower-rule3')] }),
    ]),
];

// ---------- The loyalty test (Suspicion 7) and found out (Suspicion 10) ----------
const TESTS: Json[] = [
  ev('rk-loyalty-test', 'The Loyalty Test', 'Evil Teams', { callback: true, requires: inside({ suspicion: 7, suspicionBelow: 10, lacks: 'loyalty-test' }), cast: [EXEC, EXEC], tint: '#1c1c28' },
    `The count room, after hours, with the door shut. Domino sits on the desk; Butch stands by the door. ${say('Domino', `House Card. People talk about you. The long way round, every time. Crates that arrive damp. Shops that close for a family matter. I'd like to hear you explain it, before somebody explains it for you.`)}`,
    [
      ch('Hold her eye, and explain nothing.', out(`You hold her eye. Neither of you blinks first. ${say('Domino', `...Fine. Clever people are expensive. Don't make me pay for you.`)}`, meters(0, -2), mark('loyalty-test')), { chance: 0.6, fail: out(`Your eyes slide to the door. Butch smiles. ${say('Domino', `That's what I thought.`)}`, meters(0, 1), mark('loyalty-test')) }),
      ch(`Give them Cassidy's skim.`, out(`You tell them what Faye's book says about the florist. Domino laughs once, with her eyes shut. ${say('Domino', `A tenth of a tenth. From the Boss. And you've been sitting on it. Now that is loyalty I understand.`)} Cassidy is docked by morning, and knows who did it.`, meters(1, -3), flag('cassidy-grudge'), mark('loyalty-test')), { requires: [flagIs('rocket-skim-held')] }),
      ch('"I do the job my way. It gets done."', out(`${say('Butch', `It gets done wet.`)} ${say('Domino', `It gets done. For now.`)} She lets you go. You can feel them watching you all the way to the lift.`, meters(0, -1), mark('loyalty-test'))),
    ]),
  ev('rk-found-out', 'Found Out', 'Evil Teams', { callback: true, requires: inside({ suspicion: 10, lacks: 'found-out' }), cast: [EXEC, EXEC], tint: '#3a1418', effect: 'glint' },
    `The lift stops between floors. When the doors open, Butch and Cassidy are waiting, and behind them half the basement. ${say('Butch', `House Card. Or whatever your name is. The Boss would like a word. So would I.`)} You've been found out. There's only one way back outside, and it's through them, with your own party, on worse ground than you'd have chosen.`,
    [ch('Fight your way out.', fight(`They come at you two at once.`, foe('executive', 'Butch and Cassidy', 6, { lv: 2, format: 'doubles' }),
      mark('found-out'), story({ end: 'defeated' }), flag('rocket-ending-turn'), flag('rocket-found-out')))]),
];
(TESTS[1] as Json).remembers = [{ id: 'otis', when: [flagIs('rocket-otis-asked')], notice: `Otis is in the crowd. He catches your eye, and takes one step sideways, out of their line.` }];

export const EVENTS: Json[] = [...offer, ...act1, ...act2, ...act3, ...act4, ...act5, ...OPS, ...FRIDAYS, ...EXTRA, ...TESTS];
export const REMOVE: string[] = [];
