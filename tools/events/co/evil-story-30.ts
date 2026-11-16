// Catalog Overhaul Pack, Evil Teams Volume III: Kalos, Team Flare from inside (EVIL_TEAMS_VOLUME_3_B "Kalos",
// TEAM_FLARE_KALOS_FULL_1 part B, FULL_3 parts B to D, EVIL_TEAMS_VOLUME_3_D "Kalos"). The Offer, the five Acts, the six
// Operations, the House Red and the other inside-only scenes, the officers alone, the loyalty test and being found out.
// The Final Choice, the endings and Team Ember are in evil-story-31.ts; the twelve scenes for any player in
// evil-story-32.ts. Standing, Suspicion and the rank are the `evil` effect's `standing`/`suspicion`/`rank`
// (core/evil/inside.ts). The player is "the Guest of Honor": Lysandre's own name for the one he wouldn't charge.
import { ch, ev, fight, flag, flagIs, inRegion, out, room, trainer, type Json } from '../dsl.ts';
import { evil as story, foe, kind } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-story';

const F = teamJson('flare');
const GRUNT = F.ranks.grunt.sprite;
const BOSS = F.ranks.leader.sprite;
const TINT = F.color;
const XAN = 'trainer.pr/rich_kid_m';
const RUE = 'trainer.pr/janitor';
const YARB = 'boss.npc_gentleman';
const XEROSIC = 'trainer.pr/xerosic';
const VALERIE = 'trainer.pr/artist';
const LIFT = 'trainer.pr/waiter_m';
const SCI = ['trainer.pr/aliana', 'trainer.pr/bryony', 'trainer.pr/celosia', 'trainer.pr/mable'];
const LABS = '#2a1414';
const K = inRegion('kalos');
const say = (who: string, line: string): string => `${who}: "${line}"`;
/** The region's team is Flare (and the run is in Kalos). */
const fl = (o: Json = {}): Json[] => [{ kind: 'evil', team: 'flare', ...o }, K];
const inside = (o: Json = {}): Json[] => fl({ inside: true, ...o });
const mark = (m: string): Json => story({ mark: m });
const meters = (standing: number, suspicion = 0, rank?: number): Json => story({ ...(standing ? { standing } : {}), ...(suspicion ? { suspicion } : {}), ...(rank ? { rank } : {}) });
const beat = story({ beat: true });
const quiet = (): Json[] => [meters(1, 1), ...kind(1)];
const intel = (n: number): Json => flag('intel', n);
const night: Json = { kind: 'period', in: ['night'] };
const sus = (atLeast: number, below = 11): Json => ({ kind: 'evil', team: 'flare', inside: true, suspicion: atLeast, ...(below <= 10 ? { suspicionBelow: below } : {}) });
const stand = (atLeast: number): Json => ({ kind: 'evil', team: 'flare', inside: true, standing: atLeast });

// ---------- The Offer (after The Files: "After Glittering Cave") ----------
const offered = flag('flare-offered');
const OFFER = `A café in Lumiose. A tall man with a mane of red hair stands to pull out your chair. ${say('Lysandre', `You're magnificent. I mean it clinically. I've watched you give half of what you have to people who'll waste it. It's beautiful, and it can't last. There isn't enough. There never was.`)} ${say('Lysandre', `I've a list of people worth saving. It's short. It costs five million to be on it. I'm waiving yours.`)}`;
const yes = ch('"Yes."', out(`He doesn't smile. He inclines his head, as if you'd accepted a glass of wine. A red card on the table: WITH THE COMPLIMENTS OF M. LYSANDRE. Lysandre Labs; the staff will show you up. You're Team Flare now, on the inside: a Subscriber, the one he waived. Nobody outside knows it.`, mark('inside'), offered));
const report = ch('"Yes." (And tell the International Police.)', out(`You say yes to Lysandre. That night, from a telephone box on the Rue Verte, you say it again to a tired man in a brown coat who calls himself Looker. "Team Flare. You are inside? So. You will be my eyes. Be careful; they are very polite, these people, and polite people count everything." You have a handler now. Every careless step counts double.`, mark('inside'), mark('inside-man'), flag('flare-looker-met'), offered));
const no = ch('"No."', out(`${say('Lysandre', `Of course. It's beautiful that you can.`)} He pays for both coffees and is gone before yours is cold. Team Flare's story goes on as it was, with you on the outside of it.`, flag('flare-offer-refused'), offered));
const offer: Json[] = [
  ev('evil-flare-offer-kalos', 'The Offer', 'Evil Teams', { room: true, cast: [BOSS], tint: TINT, effect: 'glint' }, OFFER, [
    yes, no,
    ch('"Who isn\'t on the list?"', out(say('Lysandre', `Almost everyone. I wept, when I worked it out. I do, still, some mornings. Then I comb my hair.`), room('evil-flare-offer-kalos-2'))),
    report,
  ]),
  ev('evil-flare-offer-kalos-2', 'The Offer', 'Evil Teams', { room: true, cast: [BOSS], tint: TINT, effect: 'glint' }, `He waits, with his hands folded, as if he has all the time in the world and knows exactly how much that is.`, [yes, no, report]),
];

// ---------- Act 1. A Theme (stage 3, the town) ----------
const act1: Json[] = [
  ev('fl-act1', 'A Theme', 'Evil Teams', { callback: true, requires: inside({ beat: 2 }), cast: [VALERIE, XAN], tint: TINT, effect: 'sparkle' },
    `A fitting room. Three mirrors. A woman with pins in her mouth, and a bolt of red. ${say('Couturière Valerie', `Arms out. ...You stand like someone who carries things. The others stand like someone's about to take their coat.`)} She chalks a line, dreamily, round the pins. ${say('Valerie', `It's for a theatre company. That's what I was told. Four hundred and twelve costumes and nobody's told me the play.`)} The suite isn't a bunk. A bed the size of a field. A bowl of fruit. A card: WITH THE COMPLIMENTS OF M. LYSANDRE. In the doorway of the next one, in a suit that fits better than anything he's ever done, a young man of twenty-two. ${say('Xan Delacroix', `You're the one he waived! Everyone's talking. I'm Xan. I paid out of an allowance. Don't tell my father; he thinks it's a yacht.`)} ${say('Xan', `It's fabulous. The suits are bespoke. There's a wine list. Something about the end of the world; I skimmed it. Is it a theme? I assumed it was a theme.`)}`,
    [
      ch(`"It's not a theme."`, out(say('Xan', `Everything's a theme. Last year it was 'Under the Sea.' I was a Clauncher.`), flag('ally-xan'), room('fl-act1-brochure'))),
      ch('"What did you think you were buying?"', out(say('Xan', `Somewhere to belong that had a dress code. I've never been anywhere I wasn't paying to be. This felt honest about it.`), flag('ally-xan'), room('fl-act1-brochure'))),
      ch('"Who else is in the club?"', out(say('Xan', `Oh, everyone. The Vasseurs. A man who owns a river. Malva, off the television! She doesn't speak to us. It's very exclusive, being ignored by her.`), flag('ally-xan'), room('fl-act1-brochure'))),
    ]),
  ev('fl-act1-brochure', 'Page Nine', 'Evil Teams', { room: true, cast: [XAN], tint: TINT },
    `The brochure's on the pillow. A Beautiful Future. Eleven pages. Pages one to eight: photographs. A sunset. A vineyard. "Preservation." "Stewardship." Page nine: one paragraph, in the same pleasant type. "The device removes the surplus. Holders of a valid key are exempt." Pages ten and eleven: the wine list. Xan reads over your shoulder, laughing. ${say('Xan', `'The surplus.' That's so him. What's the surplus?`)}`,
    [
      ch('"People."', out(`He goes on smiling for about two seconds too long. ${say('Xan', `...No. It'll be a metaphor. For— clutter. He's very against clutter.`)}`, flag('flare-page9'), room('fl-act1-concierge'))),
      ch('"You should read it again."', out(`He reads it again. He reads it a third time, with his finger under the line, the way he hasn't since school. He doesn't say anything. He puts the brochure down very carefully, the way one puts down something hot.`, flag('flare-page9'), room('fl-act1-concierge'))),
      ch('(Close it.)', out(`You close it. Xan picks it up again at once, and turns to the wine list.`, flag('flare-page9'), room('fl-act1-concierge'))),
    ]),
  ev('fl-act1-concierge', 'The Concierge', 'Evil Teams', { room: true, cast: [YARB], tint: TINT },
    `A knock. A man of seventy with a tray. ${say('Concierge Wilhelm Yarborough', `The house red, with M. Lysandre's compliments. I'm Yarborough. I've been with the family forty years. If there's anything you want, you've only to not ask too loudly.`)} He sets it down. He squares the tray to the table's edge. ${say('Yarborough', `You'll be shown the building. You'll not be shown the dining room. It isn't in use.`)}`,
    [
      ch('"Why not?"', out(`He looks at the tray a moment, as if the answer were on it. ${say('Yarborough', `It isn't in use, sir.`)} It's the whole of his answer, and he gives it twice.`, room('fl-act1-dining'))),
      ch('"Are you a member?"', out(`${say('Yarborough', `I'm staff, sir.`)} The pause is perfectly judged. ${say('Yarborough', `I bring things to the list.`)}`, room('fl-act1-dining'))),
      ch('"Forty years. What was he like?"', out(say('Yarborough', `He'd give you his coat. I've seen it done. Twice in one winter; I'd to order a third.`), room('fl-act1-dining'))),
    ]),
  ev('fl-act1-dining', 'The Dining Room', 'Evil Teams', { room: true, cast: [YARB], tint: '#2a2020', effect: 'fog' },
    `The dining room can be found. A double door off the staff corridor. It isn't locked. Nobody locks a thing they can't bear to look at.`,
    [
      ch('Go in.', out(`Four hundred and eleven places. A red cloth, grey with dust. Glasses. Good china. At the head, a pencil, where it was put down. That night: a red suit, and a key. It chimes.`, flag('flare-dining-seen'), flag('flare-inside-act1'), beat)),
      ch('Leave it shut.', out(`You leave it. That night: a red suit, and a key. It chimes.`, flag('flare-inside-act1'), beat)),
    ]),
];

// ---------- Act 2. One Crate (stage 4) ----------
const factory = room('fl-act2-factory');
const act2: Json[] = [
  ev('fl-act2', 'One Crate', 'Evil Teams', { callback: true, requires: inside({ beat: 3 }), cast: [RUE], tint: TINT },
    `A service lift. A woman in grey overalls with a mop bucket, who's pressed the button for your floor without asking which. ${say('Rue Carmody', `Guest of Honor. I know; I do your room. You fold your own towels. Nobody else in the building does.`)} ${say('Rue', `I'm on the Factory job with you. Not on it. I'm sent to clean up after. Staff pass. Never paid a thing; never been asked to.`)} ${say('Rue', `I mop the room with the big flower in it. Tuesdays. I'm not stupid. It's a gun. I've a mum in Lumiose and two brothers in Camphrier, and I've counted the red suits, and there's not one in my size.`)}`,
    [
      ch('"Why stay?"', out(say('Rue', `The pay's the best in the city. And I've the keys. If I walk out, somebody else has the keys, and she mightn't count.`), flag('ally-rue'), factory)),
      ch('"Have you told anyone?"', out(`She looks at the mop, and then at you. ${say('Rue', `I'm telling you.`)}`, flag('ally-rue'), factory)),
      ch('"What size are you?"', out(`She laughs. First time. ${say('Rue', `Ten. Don't.`)}`, flag('ally-rue'), factory)),
    ]),
  ev('fl-act2-factory', 'The Poké Ball Factory', 'Evil Teams', { room: true, cast: [SCI[2]!, SCI[1]!], tint: '#2a2a30' },
    `The Poké Ball Factory. The line's running. Two of the scientists are loading crates. Xan's been given a clipboard; he volunteered. Members don't, as a rule. He wanted to "do something." ${say('Celosia', `Every Ball made in Kalos for a year. It's not theft. It's curation.`)} ${say('Bryony', `She's been practising that all morning.`)} The factory's president, tied to an office chair, with great dignity: "Take them. I can't stop you. Leave the line running. I've two hundred on the floor who eat because of it." ${say('Celosia', `Guest. Your call. He's asked us to be nice. We've the stock either way. Shut the line and there's no more for a year; leave it and somebody else has Balls by spring.`)}`,
    [
      ch('"Shut the line."', out(`The belt stops. It's very quiet. Two hundred people in a canteen hear it stop. ${say('Xan', `Oh, that's a horrid noise. The not-noise.`)}`, meters(2, 0, 2), flag('flare-factory-shut'), room('fl-act2-canteen'))),
      ch('"Take the stock; leave the line."', out(`The president: "Thank you. I shan't say for what; I've a board."`, meters(1, 0, 2), flag('flare-factory-left'), room('fl-act2-canteen'))),
      ch('"Rue. What would you do?"', out(`${say('Rue', `Take one crate. Photograph it. Tell them it was all there was. I've done it with the mop cupboard for years.`)} ${say('Celosia', `I can hear you, you know.`)} she says, not turning round. ${say('Bryony', `She can. I can't. I've gone deaf. It's very sudden.`)} One crate goes to the Labs. The rest goes out the loading bay in a laundry van that Rue's cousin drives.`, meters(0, 1, 2), ...kind(1), flag('flare-factory-crate'), room('fl-act2-canteen'))),
    ]),
  ev('fl-act2-canteen', 'The Canteen', 'Evil Teams', { room: true, cast: [XAN], tint: '#2a2a30' },
    `In the canteen, after. Two hundred workers, being untied by Xan, who's doing it badly. A worker: "You one of them?" ${say('Xan', `I'm a member.`)} The worker: "What's that get you?" ${say('Xan', `A— there's a wine list.`)} He hears it. "There's a wine list," he says again, more quietly, to the knot.`,
    [ch('Help him with the knots.', out(`You do the rest of them. Xan watches how.`, flag('flare-inside-act2'), beat))]),
];

// ---------- Act 3. Bijou (stage 5): a door of four rooms (ps_fl_stones) ----------
const act3: Json[] = [
  ev('fl-act3', 'Bijou', 'Evil Teams', { callback: true, requires: inside({ beat: 4 }), cast: [XAN], tint: '#1e2418', effect: 'fog' },
    `Route 10. Standing stones in rows, to the horizon. Cables between them, new, red.`,
    [ch('Walk the rows.', out(`The grass is cut short between them, as if for an audience.`, room('fl-stones-rows')))]),
  ev('fl-stones-rows', 'The Rows', 'Evil Teams', { room: true, cast: [XAN], tint: '#1e2418' },
    `Xan, in a visor, picking his way: ${say('Xan', `It's an installation. I've seen this. There was one at the Biennale with fridges.`)}`,
    [ch('Go on.', out(`The cables hum, faintly, like a fridge.`, room('fl-stones-wiring')))]),
  ev('fl-stones-wiring', 'The Wiring', 'Evil Teams', { room: true, cast: [XEROSIC], tint: '#1e2418' },
    `At the foot of each stone: a Pokémon. Lying down. A clip on a foreleg, a wire to the cable. Not hurt. Not asleep, quite. Dimmer than they should be. They're being borrowed from; they'll wake, if they're unclipped. Xerosic, cheerful, on a folding stool, eating a sandwich: ${say('Xerosic', `Ah! The Guest! Come and see. It needs life to run. A little from many's as good as a lot from few! It's very fair. They hardly notice. Hardly.`)}`,
    [ch('Go on, to the fourth stone.', out(`Xan has gone ahead of you. He's stopped.`, room('fl-stones-fourth')))]),
  ev('fl-stones-fourth', 'The Fourth Stone', 'Evil Teams', { room: true, cast: [XAN], pokemon: 'furfrou', tint: '#1e2418' },
    `Xan's taken off his visor. He's looking at a Furfrou. It's been groomed. Recently. By somebody who loved it: the trim's fussy, a little uneven, done at home. There's a tag on its collar. Brass. A heart. BIJOU. And a telephone number. ${say('Xan', `That's got a name tag. That's somebody's— somebody did that trim with kitchen scissors. I can tell. Mine's done at a salon. That's done by someone who minds.`)} ${say('Xan', `This isn't a theme. Is it. I paid for this. I paid five million for this.`)} He sits down in the grass in a bespoke suit.`,
    [
      ch('"Unhook them."', out(`You start on the first clip. Down the row, somebody shouts. A woman in a red visor comes over the grass, already reaching for a Ball, already sorry about it.`, flag('xan-sat-down'), room('fl-stones-last'))),
      ch('"Unhook one stone\'s worth, and say the wiring failed."', out(`Twelve clips. "A fault." ${say('Xerosic', `Tch! Corrosion. It's the sea air.`)} That night, Rue: "That's a tenth. I'll do a tenth a night. Nobody counts stones."`, meters(0, 1, 4), ...kind(1), flag('flare-stones-tenth'), flag('xan-sat-down'), room('fl-stones-tag'))),
      ch(`"It's the price of the list."`, out(`Xan asks for his money back. ${say('Treasurer Garance', `Oh, darling. There are no refunds. It's on page eleven, under the Burgundies.`)} she says, warmly. He laughs. Badly.`, meters(2, 0, 4), flag('flare-stones-price'), flag('xan-sat-down'), room('fl-stones-tag'))),
    ]),
  ev('fl-stones-last', 'The Last Stone', 'Evil Teams', { room: true, cast: [SCI[0]!], tint: '#1e2418' },
    `${say('Aliana', `I'm sorry. I am. Put the clip back, Guest, and I'll say I never saw you.`)}`,
    [ch('Battle Aliana.', fight(`She sends out her Pokémon as if she'd rather not.`, trainer('Aliana', { sprite: SCI[0]!, team: ['druddigon', 'mightyena', 'houndoom'], size: 3, lv: 1, win: [] }),
      meters(0, 4, 4), ...kind(2), flag('flare-stones-unhooked'), flag('route10-woke-row'), room('fl-stones-tag')))]),
  ev('fl-stones-tag', 'The Tag', 'Evil Teams', { room: true, cast: [XAN], pokemon: 'furfrou', tint: '#1e2418' },
    `Bijou's tag has a number. It can be rung, from any town.`,
    [
      ch('Ring the number.', out(`A woman's voice: "Hello? ...Is it about— have you found her? She went from the garden. I only turned round for the pegs."`, flag('flare-bijou-rung'), flag('flare-inside-act3'), beat), {
        branches: [{ when: [flagIs('flare-stones-unhooked')], text: `The row is awake. Xan has ripped his own sleeve off for a lead rope and is walking Bijou to the road himself. At the road, you ring the number. A woman's voice: "Hello? ...Is it about— have you found her? She went from the garden. I only turned round for the pegs."`, effects: [flag('flare-bijou-rung'), flag('flare-bijou-walked'), flag('flare-inside-act3'), beat] }],
      }),
      ch('Leave it.', out(`You leave the number on the tag.`, flag('flare-inside-act3'), beat), {
        branches: [{ when: [flagIs('flare-stones-unhooked')], text: `The row is awake. Xan has ripped his own sleeve off for a lead rope and is walking Bijou to the road himself.`, effects: [flag('flare-bijou-walked'), flag('flare-inside-act3'), beat] }],
      }),
    ]),
];
(act3[0] as Json).remembers = [{ id: 'rue-sus', when: [sus(4, 7)], notice: say('Rue', `They've checked the stones. They've put it down to weather. Keep it at a tenth.`) }];

// ---------- Act 4. Not Enough Well (stage 6, a + node at Night; needs Rank 4) ----------
const confide = (rank: number, ...fx: Json[]): Json[] => [meters(2, 0, rank), mark('confided'), flag('flare-lysandre-confided'), flag('flare-inside-act4'), ...fx, beat];
const STUDY = `A study. A fire. A green ledger. A photograph, face down. A man standing at the window with his back to all of it.`;
const act4Choices = (): Json[] => [
  ch('"Then dig more wells."', out(`${say('Lysandre', `Thirty-one. I dug thirty-one. Do you know how many villages there are?`)} A pause. ${say('Lysandre', `I do. I looked it up. I wish I hadn't.`)} He writes your name in the blank himself. His hand's steady. It's the only thing in the room that is. You're Chosen.`, ...confide(5))),
  ch('"Who told you forty?"', out(`He's very still. ${say('Lysandre', `...The machine has a range. Xerosic gave me a number. I never asked if the number could be made bigger. I asked how to choose.`)} A long pause. ${say('Lysandre', `That's a different question, isn't it.`)} He writes your name in the blank himself. You're Chosen.`, ...confide(5, flag('flare-who-forty')))),
  ch(`"I'll take the seat."`, out(`${say('Lysandre', `Thank you.`)} He says it as if you'd done him a kindness. He writes your name in the blank himself. His hand's steady. It's the only thing in the room that is. You're Chosen.`, ...confide(5))),
  ch('"Whose seat is yours?"', out(`He doesn't answer at once. He goes to the desk. He turns the list to face you.`, room('fl-act4-list'))),
];
const act4: Json[] = [
  ev('fl-act4', 'Not Enough Well', 'Evil Teams', { callback: true, requires: [...inside({ beat: 5, rank: 4 }), night], cast: [BOSS], tint: '#1c1418', effect: 'glint' },
    `${STUDY} ${say('Lysandre', `Sit, please. No; take the good chair. I've never liked it. It was my father's. He sat in it to refuse people.`)} ${say('Lysandre', `I gave. For twenty years. Everything my family had. Wells. Schools. Thursdays; Wilhelm will have told you about Thursdays. I thought, if I give enough, it will be enough. And each year there were more hands. Not because they were greedy. Because there were more of them. I was pouring into the sea.`)} ${say('Lysandre', `I'm not cruel. I've been trying to find the cruelty in it so that I could hate myself and stop. I can't find it. It's arithmetic. The lifeboat holds forty. I didn't build the boat that small.`)} He turns the photograph over. A much younger man, at a well, with a village round him, laughing. ${say('Lysandre', `They're all dead. A drought. Six years after. I'd dug the well. It wasn't enough well.`)}`,
    act4Choices()),
  ev('fl-act4-list', 'The List', 'Evil Teams', { room: true, cast: [BOSS], tint: '#1c1418' },
    `Forty names. The margins. Sycamore: struck, and restored. Diantha. A blank, with a note: "For whoever answers correctly." You look for an L. ${say('Lysandre', `You've noticed. Garance thinks it's an oversight. I've forty places. I've given forty away. I couldn't— one doesn't sit while a guest is standing.`)}`,
    [
      ch('"And the other three hundred and seventy?"', out(`${say('Lysandre', `Their keys chime. I'll tell them. On the day. So that they may spend it as they'd wish to have spent it.`)} A pause. ${say('Lysandre', `They asked. I've never been able to refuse anyone who asked. So I didn't refuse. I only— didn't find more chairs.`)}`, flag('flare-forty-known'), flag('flare-list-read'), room('fl-act4-staff'))),
    ]),
  ev('fl-act4-staff', 'The Page About the Staff', 'Evil Teams', { room: true, cast: [BOSS], tint: '#1c1418' },
    `The page about the staff's in there, too.`,
    [
      ch('Turn to it.', out(`"— I cannot do Thursday again." ${say('Lysandre', `Mme Carmody does the flower room. She hums. I've stood outside the door to listen. I can't put her on it. If I put her on it I'll put them all on it, and then I'm back at the head of that table with a pencil.`)} He writes your name in the blank himself. His hand's steady. It's the only thing in the room that is. You're the Last Guest.`, ...confide(6, flag('flare-forty-known'), flag('flare-list-read')))),
      ch('Leave it.', out(`You leave the page unturned. He writes your name in the blank himself. His hand's steady. It's the only thing in the room that is. You're the Last Guest.`, ...confide(6, flag('flare-forty-known'), flag('flare-list-read')))),
    ]),
];
// What the run's brought him (FULL_3 L3, L4, L11, L12): the Water from the Eleventh Well, the Other Column, "What does it eat?".
(act4[0] as Json).remembers = [
  { id: 'eleventh', when: [flagIs('flare-eleventh')], notice: `You have the bottle of water from the eleventh well.`, hide: [2], addChoices: [ch('Put the Water from the Eleventh Well on his desk.', out(`He knows the bottle's dust. He's dug in it. ${say('Lysandre', `...It held.`)} "They built a cistern. And a rule about gardens." ${say('Lysandre', `They added to it.`)} A long time. ${say('Lysandre', `I never went back to any of them. I thought, if I look, I'll see it wasn't enough. I never thought I'd see that they'd—`)} He doesn't finish. He writes your name in the blank himself. You're Chosen.`, story({ standing: 3 }), ...confide(5, flag('flare-well-given'))))] },
  { id: 'column', when: [flagIs('flare-column')], notice: `You have the census clerk's Other Column.`, hide: [2], addChoices: [ch('Show him the Other Column.', out(`${say('Lysandre', `...They grew.`)} He reads down. He's fast with figures. ${say('Lysandre', `Nine schools. I built nine. There are sixty in this column.`)} "They built the rest." ${say('Lysandre', `I didn't ask what they'd done with it. I only ever asked how many had come to the table.`)} He writes your name in the blank himself. You're Chosen.`, ...confide(5, flag('flare-column-shown'))))] },
  { id: 'brother', when: [flagIs('flare-lore-brother')], notice: `AZ's question is in your head.`, hide: [2], addChoices: [ch('"What does it eat?"', out(`${say('Lysandre', `It— the surplus.`)} "What does it eat?" He can't say "people." He's never once said it. He says: ${say('Lysandre', `...Thursday.`)} He writes your name in the blank himself. You're Chosen.`, ...confide(5)))] },
];
(act4[2] as Json).remembers = [{ id: 'query', when: [flagIs('flare-correction-query')], notice: `On his own copy of the brochure, open on the desk, there's a printer's mark in the margin of page nine, in blue pencil: ? Author to confirm.` }];

// ---------- Act 5. She Stayed (stage 7, then the Final Choice) ----------
const act5: Json[] = [
  ev('fl-act5', 'She Stayed', 'Evil Teams', { callback: true, requires: inside({ beat: 6 }), cast: [XAN, YARB], tint: '#20181c' },
    `The shelter, under Geosenge. A rehearsal. Four hundred people in red, queuing for a lift, complaining. A member: "Is there to be seating? Nobody's said if there's seating." Another: "The lighting's very harsh. One looks drained." Xan, beside you, not in the queue, in a suit with one sleeve: ${say('Xan', `They don't know. Do they. I didn't.`)} At the lift: Yarborough, with a list. He's letting people through. One. Then a pause. Then another. ${say('Yarborough', `Madame Vasseur. This way. ...Monsieur, if you'd wait in the upper lounge. There's a buffet.`)} The upper lounge has some three hundred and seventy people in it by the end. There's a very good buffet. In the shelter proper: forty chairs. A table. A red cloth, new. Forty places, laid. ${say('Yarborough', `He asked me to lay it. I said, sir, the last time. He said, 'Forty, Wilhelm. I can do forty.'`)} He squares a fork.`,
    [
      ch(`"You've read the list."`, out(`${say('Yarborough', `I have, sir.`)} He lays a knife. He doesn't say what was on it, and he doesn't need to.`, flag('flare-forty-laid'), room('fl-act5-corridor'))),
      ch(`"You're not on it."`, out(`${say('Yarborough', `No, sir.`)} He moves a glass a quarter-inch. ${say('Yarborough', `I've brought his wine for forty years. I'd not know how to stop on the last day. Somebody's to pour.`)}`, flag('flare-forty-laid'), room('fl-act5-corridor'))),
      ch('"Why lay it?"', out(`${say('Yarborough', `Because he asked, sir. And because it'll be laid properly, if it's laid by me.`)}`, flag('flare-forty-laid'), room('fl-act5-corridor'))),
    ]),
  ev('fl-act5-corridor', 'The Staff Corridor', 'Evil Teams', { room: true, cast: [RUE, LIFT], tint: '#20181c' },
    `The staff corridor. Night. A kettle. Sixty people on a rota that ends tomorrow. ${say('Rue', `My mum's packed a bag. I told her to go to the coast. She said, 'Is it your work?' I said yes. She said, 'Then I'll stay and see what you've done.'`)} ${say('Rue', `She's on her balcony. She's got her good coat on. She's seventy-one and she's going to stand there and look at it.`)} The lift man: "Mine's the same. Wouldn't shift." Xan, who's come down to the staff corridor, and has never been in one: ${say('Xan', `Is this where the kettle is? I've wondered for a month where tea came from.`)} Your last choice of the night: who's told about the chime.`,
    [
      ch('Nobody.', out(`Some three hundred and seventy people go to bed with a key on the nightstand. In the morning, a note under your door in Yarborough's hand: "The Chamber. Dusk. He'd like you to bring the key."`, flag('flare-told-none'), flag('flare-inside-act5'), beat, room('fl-final-choice'))),
      ch('Xan and Rue.', out(`You tell them. Xan sits on the floor of the staff corridor. Rue doesn't sit; she puts the kettle on again. They know. Whatever happens tomorrow, they'll act on it. In the morning, a note under your door in Yarborough's hand: "The Chamber. Dusk. He'd like you to bring the key."`, flag('flare-told-two'), flag('flare-inside-act5'), beat, room('fl-final-choice'))),
      ch('The upper lounge.', out(`You stand on a buffet table and say it. They don't riot. They ask for the manager. A member: "I've a receipt." Another: "This'll be in my review." Then one, at the back, an old Friend, in a suit she calls her Thursday: "He's put himself with us. Hasn't he. He's not on the forty." Silence. "Of course he hasn't. Silly man. He never could sit down first." Everyone in the building knows who said it. It doesn't matter now. Tomorrow three hundred and seventy people in red are standing in the lift hall, not complaining, for the first time.`, flag('flare-told-all'), flag('flare-inside-act5'), beat, room('fl-final-choice'))),
    ]),
];
(act5[1] as Json).remembers = [{ id: 'lift', when: [flagIs('flare-lift-daughter')], notice: `The lift man, Kettering: "Mine wouldn't shift either. She's on the balcony. She's taken a chair out."` }];

// ---------- The six Operations (FULL_3 C): one per stage from 3, optional. Standing +1 either way ----------
const OPS: Json[] = [
  ev('fl-op-fitting', 'Operation: The Fitting', 'Evil Teams', { requires: inside({ after: 2 }), cast: ['trainer.pr/clerk_f'], tint: TINT },
    `The order: stand outside the boutique. Catch the ones who're turned away. A brochure; a smile. A man comes out, crushed, with resoled shoes: "Quite right. Quite right."`,
    [
      ch('A brochure; a smile.', out(`He takes the brochure. He takes the smile. Garance is pleased with the corner.`, meters(1))),
      ch('Tell them the price, and what it buys.', out(`"It's five million. You get a suit and a key. Page nine says what the key's for. Read page nine before you pay." He reads it, on the pavement. Twice. "...'The surplus.' Is that— am I the—" He looks at his shoes. "Quite right," he says, in a different voice, and hands the brochure back, and goes and buys his wife a scarf from a stall. Nobody joins on that corner. ${say('Garance', `Your conversion's nought. Are you being honest with them? Darling. We've discussed this.`)}`, ...quiet(), flag('flare-op-fitting-honest'))),
    ]),
  ev('fl-op-stone-round', 'Operation: The Stone Round', 'Evil Teams', { requires: inside({ after: 3 }), cast: [XAN], tint: TINT },
    `The order: collect Mega Stones from trainers, "for safekeeping during the emergency." Xan's holding the bag.`,
    [
      ch('Collect them.', out(`Forty stones, in a velvet bag. Xan doesn't ask what the emergency is.`, meters(1))),
      ch('Give receipts. Real ones. Dated.', out(`You write each out. Name. Stone. Date. "To be returned on demand." A signature. A trainer: "Nobody's given me a receipt for anything in a year." ${say('Xan', `Is that binding? If you sign it? Legally?`)} "Yes." ${say('Xan', `...Can I sign one? I'd like to be bound to something.`)} Forty receipts. Whatever happens, forty people will turn up with a slip of paper, and it'll be honoured.`, ...quiet(), flag('flare-receipts'))),
    ]),
  ev('fl-op-power-plant', 'Operation: The Power Plant', 'Evil Teams', { requires: inside({ after: 4 }), cast: [SCI[0]!, RUE], tint: '#202430' },
    `The order: divert Lumiose's current to Geosenge. All of it.`,
    [
      ch('All of it.', out(`Aliana throws the switches. Lumiose dims.`, meters(1))),
      ch(`Leave the hospital's line.`, out(`${say('Aliana', `It's all one bus. I can't leave a line; I'd have to label a line. Somebody'd have to tell me which.`)} Rue, with a mop, not looking up: ${say('Rue', `Feeder nine. It's got a red tag. I dust it.`)} ${say('Aliana', `...Why's a cleaner know the feeders?`)} ${say('Rue', `My brother was born on it.`)} Feeder nine stays live. If the Blackout comes, it won't reach the hospital quarter: its Center heals in full, member or not.`, ...quiet(), flag('flare-feeder-nine'))),
    ]),
  ev('fl-op-holo-caster', 'Operation: The Holo Caster', 'Evil Teams', { requires: inside({ after: 5 }), cast: [RUE], tint: TINT },
    `The order: push Lysandre's broadcast to every device in Kalos. "—so that you may spend today as you would wish to have spent it."`,
    [
      ch('Push it.', out(`Every Holo Caster in Kalos lights up with his face.`, meters(1))),
      ch(`Add one line at the end: the staff entrance's address.`, out(`A beat. Then, in plain type: "Lysandre Labs, Rue Verte, the door by the bins. Ask for Rue. Bring something." People come. Not many. A dozen, the first night, to a door by the bins. A woman with a tart. A boy with a soldering iron. A typesetter. ${say('Rue', `I didn't say you could put my name on it.`)} She puts the kettle on.`, ...quiet(), flag('flare-door-by-bins'))),
    ]),
  ev('fl-op-guest-list', 'Operation: The Guest List', 'Evil Teams', { requires: inside({ after: 5 }), cast: [RUE, LIFT], tint: TINT },
    `The order: vet a hundred applicants. A tick or a cross. Garance wants ninety crosses: "It keeps the tone."`,
    [
      ch('Ninety crosses.', out(`Ninety crosses, ten ticks. Garance says it keeps the tone.`, meters(1))),
      ch('Lose the list for a day.', out(`Rue, at the staff photocopier, which jams: ${say('Rue', `Four hundred and eleven names. And a second sheet, in his writing. Forty.`)} She looks at it. She looks at the first. ${say('Rue', `They don't match. There's forty on this and four hundred on that.`)} ${say('Rue', `He's sold four hundred tickets for a forty-seat bus.`)} The lift man, over her shoulder: "And he's not on the forty." Nobody in the corridor says anything for a bit. A cook: "...He's not wicked, is he. He's just never once in his life said 'we're full.'" The copies go in sixty lockers. On the day, sixty people already know which keys chime.`, ...quiet(), flag('flare-staff-know'))),
    ]),
  ev('fl-op-flower-room', 'Operation: The Flower Room', 'Evil Teams', { requires: inside({ after: 6 }), cast: [RUE], tint: '#18201c', effect: 'fog' },
    `The order: mop it. Rue's off; her mum's had a turn. You volunteer. Nobody's ever volunteered. The chamber. The flower. It's very large and very quiet and it smells faintly of cut stems. A mop. A bucket. A floor the size of a square. It's the only Operation that's just the work.`,
    [
      ch('Mop it.', out(`You mop it. It takes all night. The floor shines.`, meters(1), room('fl-op-flower-rue'))),
      ch('Mop it. Count the fuses. Remember where they are.', out(`While mopping, you find what Rue's found in three years of Tuesdays. Under the console: a biscuit wrapper, Xerosic's. Under the table: chalk marks, forty, for chairs, and a forty-first, rubbed out; somebody drew it and thought better. The grey box: forty fuses, ceramic. They lift out. At a petal's root: a flower. A real one. Small, red, in a crack in the floor. It shouldn't be growing down here. Rue's been watering it.`, ...quiet(), flag('flare-fuses-counted'), room('fl-op-flower-rue'))),
    ]),
  ev('fl-op-flower-rue', 'The Next Day', 'Evil Teams', { room: true, cast: [RUE], tint: '#18201c' },
    `${say('Rue', `You did the corners. Nobody does the corners.`)} A pause. ${say('Rue', `You saw my flower.`)}`,
    [
      ch('"Why water it?"', out(say('Rue', `Because it came up. On its own. Under that. I thought: if it's going to bother, I'll bother.`))),
      ch('"I counted the fuses."', out(`She looks at you for a long moment. ${say('Rue', `So've I. Every Tuesday. It's always forty.`)}`, flag('flare-fuses-told'))),
      ch('"Somebody drew a forty-first chair."', out(`${say('Rue', `I know. I mop round it.`)}`)),
    ]),
];
(OPS[0] as Json).remembers = [{ id: 'xan-low', when: [sus(0, 4)], notice: say('Xan', `Are you staff? You fold things.`) }];
(OPS[2] as Json).remembers = [{ id: 'rue-mid', when: [stand(5)], notice: say('Rue', `You do the corners.`) }];
(OPS[3] as Json).remembers = [{ id: 'xan-sus', when: [sus(4, 7)], notice: say('Xan', `Garance asked if you were 'on message.' I said I didn't know there was one.`) }];
(OPS[4] as Json).remembers = [{ id: 'xan-high', when: [stand(8)], notice: say('Xan', `If there's a list of people I'd give my seat to, you're— well, you've got one. Whoever you'd pick, then.`) }];

// ---------- M1. The House Red (every stage from 3, the stage's last rest) ----------
const red = (n: number, after: number, year: string, line: string, extra: Json[] = []): Json =>
  ev(`fl-house-red-${n}`, 'The House Red', 'Evil Teams', { requires: inside({ after }), cast: [YARB], tint: '#3a1418' },
    `Yarborough brings a bottle to the suite. It has a year on it: ${year}. He says one thing about the year. ${line}`,
    extra.length ? extra : [ch('Thank him.', out(`He squares the tray, and goes.`))]);
const RED: Json[] = [
  red(3, 2, 'the first Thursday', say('Yarborough', `Twelve at table. He carved. Badly. Everyone was very kind about it.`)),
  red(4, 3, 'the tenth', say('Yarborough', `A second table. He said, 'Wilhelm, we'll need more glasses.' He was delighted. That's what I'd have you know: he was delighted.`)),
  red(5, 4, 'the well', say('Yarborough', `He came home brown, with his hands in ribbons. He'd dug. I said, sir, there are men for that. He said, 'I was one of them, for a fortnight.'`)),
  red(6, 5, 'the drought', `He doesn't open it. He sets it down, corked. ${say('Yarborough', `I'll leave this one with you, sir. I don't pour this one.`)}`, [
    ch('Open it yourself.', out(`You draw the cork. It's very good. You drink it alone, which is how he must have.`, flag('flare-drought-opened'))),
    ch('Leave it corked.', out(`You leave it. In the last scene, whichever it is, it will be on Lysandre's desk, still corked.`, flag('flare-drought-corked'))),
  ]),
  red(7, 6, 'the first, again', `${say('Yarborough', `The last of twelve bottles. I've kept it back six years. I thought there'd be an occasion.`)} He draws the cork. ${say('Yarborough', `I find I'd rather it were drunk the night before than not at all.`)}`),
];

// ---------- M2. Complaints, M3. What's the Play, M4. Between Floors ----------
const desk = (id: string, intro: string, choices: Json[]): Json => ev(id, 'Complaints', 'Evil Teams', { room: true, cast: ['trainer.pr/rich_f'], tint: TINT }, intro, choices);
const MORE: Json[] = [
  ev('fl-complaints', 'Complaints', 'Evil Teams', { requires: inside({ after: 3 }), cast: ['trainer.pr/rich_f'], tint: TINT },
    `You're asked to sit the members' desk for a morning. Garance is at the dentist. The first complaint: "The shelter rehearsal ran over. I'd a fitting." From Madame Vasseur.`,
    [
      ch('Apologise.', out(`She accepts it, as one accepts a canapé.`, room('fl-complaints-2'))),
      ch(`"It's the end of the world, madame."`, out(`"That's no excuse for poor scheduling."`, room('fl-complaints-2'))),
    ]),
  desk('fl-complaints-2', `"My visor fogs." From a man who owns a river.`, [
    ch('Send it to the Labs.', out(`It goes to the Labs, in a box marked URGENT.`, room('fl-complaints-3'))),
    ch('"Breathe less."', out(`He considers it, seriously.`, room('fl-complaints-3'))),
  ]),
  desk('fl-complaints-3', `"There's a cleaner who hums." From a member, anonymous.`, [
    ch('File it.', out(`Filed.`, room('fl-complaints-4'))),
    ch('Lose it.', out(`It goes behind the radiator.`, room('fl-complaints-4'))),
    ch(`Write on it: "Yes. Isn't it nice."`, out(`You write it, and leave it in the tray. By evening it's pinned over the staff kettle. Rue: "Somebody's written on it. 'Isn't it nice.'"`, flag('flare-hum-nice'), room('fl-complaints-4'))),
  ]),
  desk('fl-complaints-4', `"I wasn't told there'd be no pets. I've a Meowstic. Is she on the list?" From a girl of nineteen, a legacy member.`, [
    ch(`"Pets aren't covered."`, out(`She goes quite white, and then quite red.`, room('fl-complaints-5'))),
    ch(`"I'll ask."`, out(`It's the first time anyone's asked whether a member's Pokémon has a key. It hasn't. None of them have.`, flag('flare-pets'), room('fl-complaints-5'))),
  ]),
  desk('fl-complaints-5', `"My key doesn't sound like my husband's." From an old Friend, in a suit she calls her Thursday. Her husband's a founder. He's on the forty. She paid later.`, [
    ch(`"It's a software variation."`, out(`She nods, and goes. She doesn't believe you, and she's too polite to say so.`)),
    ch('"Whose sounds better?"', out(`She: "His. It's got a hum under it. Mine's just the tune." She looks at you, and you don't lie. "I see." She closes her bag. "Thirty years I've sat next to that man at dinner. I'll not have him sit somewhere I can't." She doesn't make a scene. She goes to find her husband. By the next stage, there's a working key on the members' desk, in an envelope: "For whoever needs it more than a man who won't go without his wife. — H." It can be given to anyone. Yarborough won't take it.`, flag('flare-spare-key'))),
  ]),
  ev('fl-whats-the-play', `What's the Play`, 'Evil Teams', { requires: inside({ after: 4 }), cast: [VALERIE], tint: TINT },
    `The fitting room. A final alteration. Valerie, with the pins. ${say('Valerie', `Four hundred and twelve, and I've never been told the play. I've guessed. Something with a chorus. Everyone the same: it must be a chorus. And one sleeve I've had to do again; a young man tore his off. For a lead rope, he said. Is there a dog in it?`)}`,
    [
      ch(`"It's not a play."`, out(`She takes the pins out of her mouth. One at a time. She puts them in the cushion. ${say('Valerie', `...Then what've I dressed?`)}`, room('fl-whats-the-play-2'))),
      ch(`"There's a dog in it. She's called Bijou."`, out(`She stops chalking. She asks what the dog's for. You tell her.`, room('fl-whats-the-play-2'))),
      ch('"What do you think it\'s about?"', out(say('Valerie', `People who want to be looked at and not seen. That's what a visor's for. I thought: a tragedy, then.`))),
    ]),
  ev('fl-whats-the-play-2', `What's the Play`, 'Evil Teams', { room: true, cast: [VALERIE], tint: TINT },
    `She's very quiet. She's horrified in a way that doesn't move her face. ${say('Valerie', `I measured every one of them. I know their shoulders. I know who stands as if they're ashamed.`)} A pause. ${say('Valerie', `There's a seam, on the left, under the arm. I leave an inch, always, to let out. I could take it in.`)}`,
    [ch('Let her.', out(`She does. Over a stage, every suit that comes back for alteration goes out a little tight under the left arm. It's nothing. It's enough that nobody can raise that arm above the shoulder.`, flag('valerie-knows')))]),
  ev('fl-between-floors', 'Between Floors', 'Evil Teams', { requires: inside({ after: 5 }), cast: [LIFT], tint: '#2a2420' },
    `The lift. A man in a pillbox cap, facing the doors. He doesn't turn round. The first ride: two members get in. "—and I said to Garance, if there isn't a view from the shelter—" "There's not. It's underground." "Then what's one paying for?"`,
    [ch('Ride again.', out(`Down, and up.`, room('fl-between-floors-2')))]),
  ev('fl-between-floors-2', 'Between Floors', 'Evil Teams', { room: true, cast: [LIFT, XEROSIC], tint: '#2a2420' },
    `The second ride: Xerosic gets in, eating. ${say('Xerosic', `Four hundred! I could! I've a capacitor on order; it's for a hobby. Nobody's asked. Going down, Everard! Is it Everard? I've been saying Edmund.`)} Kettering: "Either, monsieur."`,
    [ch('Ride again.', out(`Down, and up.`, room('fl-between-floors-3')))]),
  ev('fl-between-floors-3', 'Between Floors', 'Evil Teams', { room: true, cast: [BOSS, 'boss.sycamore'], tint: '#2a2420' },
    `The third ride: Lysandre and Sycamore. Neither speaks for nine floors. At the fourth: ${say('Sycamore', `You've not touched your glass in six years.`)} ${say('Lysandre', `You noticed.`)} ${say('Sycamore', `Of course I noticed. I thought you were on a diet.`)} It's the worst thing he's ever said, and he knows it as it leaves him. Lysandre laughs. Once. It surprises both of them. After that, the lift's empty. Kettering, still facing the doors: "Six years. He's never ridden with the Professor without one of them talking. That's the first silence. I'd say something's on his mind."`,
    [
      ch('"What do you hear, in here?"', out(`"Everything, monsieur. People don't see a man in a lift. They say what they'd not say in a corridor." He doesn't say any of it.`)),
      ch(`"What's your daughter play?"`, out(`He turns round. "...Viola. Third desk. She's very good. Monsieur thinks it's the cello."`, flag('flare-kind-staff'), flag('flare-lift-daughter'))),
      ch(`"Why don't you turn round?"`, out(`"Because then they'd see me, monsieur, and stop talking." He doesn't turn round.`)),
    ]),
];

// ---------- The officers, alone (EVIL_TEAMS_VOLUME_3_D, Kalos) ----------
const OFFICERS: Json[] = [
  ev('fl-xerosic-alone', 'Xerosic, Alone', 'Evil Teams', { requires: inside({ after: 3 }), cast: [XEROSIC], tint: '#202430' },
    `A lab. He's eating. ${say('Xerosic', `Forty! Yes! I said forty. It was the first number that fitted the capacitor I'd got. I could do four hundred with a bigger one. Nobody asked! He went very pale and started making a list.`)}`,
    [
      ch('"Tell him four hundred."', out(`${say('Xerosic', `Tell him? He's not asked! One doesn't volunteer a capacitor.`)} He goes back to his sandwich.`, flag('flare-x-four-hundred'))),
      ch('"Could it do everyone?"', out(say('Xerosic', `It'd need to run backwards. Give, not take. Much harder. Much more interesting. Nobody's asked for interesting.`), flag('flare-backwards'))),
      ch(`"Why didn't you say?"`, out(say('Xerosic', `Say? To whom? He asked how to choose. I answered the question. That's what one does with questions.`))),
    ]),
  ev('fl-malva-alone', 'Malva, Alone', 'Evil Teams', { requires: inside({ after: 4 }), cast: ['trainer.malva'], tint: TINT },
    `The League's green room. She's in both uniforms. ${say('Malva', `I'm Elite Four and I'm Flare. People ask how. I don't see the difference. Both pick who's worth it. One's got better lighting.`)}`,
    [
      ch('"Who picked you?"', out(`${say('Malva', `I picked me. Then they agreed.`)} She checks her lipstick in the mirror, and doesn't look at herself.`)),
      ch(`"And the ones who aren't?"`, out(`${say('Malva', `They watch. Somebody has to.`)}`)),
      ch('"Which would you keep?"', out(`A pause she isn't used to having. ${say('Malva', `...The one where they clap before I've hurt anyone.`)}`, flag('flare-malva-keep'))),
    ]),
  ev('fl-scientists-alone', 'The Four, at Lunch', 'Evil Teams', { requires: inside({ after: 4 }), cast: [SCI[1]!, SCI[3]!, SCI[2]!], tint: TINT },
    `The four scientists, together, at lunch. ${say('Bryony', `We've a pool. On whether he'll go through with it.`)} ${say('Mable', `I've 'yes.'`)} ${say('Celosia', `I've 'no,' and I've started sleeping in my street clothes.`)}`,
    [
      ch(`"What's the pot?"`, out(`${say('Bryony', `Enough.`)} Nobody tells you the figure.`)),
      ch(`"Put me down for 'he's talked out of it.'"`, out(`They look at each other. ${say('Aliana', `...Nobody's got that square.`)}`, flag('flare-pool-talked'))),
      ch(`"Why are you still here?"`, out(`${say('Celosia', `Because it's the most interesting job in Kalos.`)} ${say('Mable', `And because nobody's ever asked us to leave.`)}`)),
    ]),
];

// ---------- The loyalty test (Suspicion 7) and found out (Suspicion 10) ----------
const TESTS: Json[] = [
  ev('fl-loyalty-test', 'The Loyalty Test', 'Evil Teams', { callback: true, requires: inside({ suspicion: 7, suspicionBelow: 10, lacks: 'loyalty-test' }), cast: [BOSS], tint: '#1c1418' },
    `${say('Lysandre', `Give me one name. One person you love who isn't worth a seat. If you can't, you don't understand what we're doing.`)}`,
    [
      ch('(Give him a name: somebody the run has met.)', out(`You say a name. He writes it nowhere. ${say('Lysandre', `Yes. That's what it feels like. Now you understand.`)}`, meters(0, -2), mark('loyalty-test'), flag('flare-test-named'))),
      ch(`"I can't."`, out(`${say('Lysandre', `No. Neither could I, at first.`)} He doesn't say what came after first.`, meters(0, 1), mark('loyalty-test'))),
      ch('"Give me yours first."', out(`He opens his mouth. He shuts it. ${say('Lysandre', `...The village. At the well. All of them.`)} He sits.`, meters(0, -3), mark('loyalty-test'), flag('flare-test-yours'))),
    ]),
  ev('fl-found-out', 'Found Out', 'Evil Teams', { callback: true, requires: inside({ suspicion: 10, lacks: 'found-out' }), cast: [SCI[2]!, SCI[3]!], tint: '#3a1418', effect: 'glint' },
    `The service lift stops between floors. When the doors open on the lab level, Celosia and Mable are waiting in their visors, and behind them a corridor of red suits. ${say('Celosia', `Guest. He'd like you to know he's very disappointed. He said it warmly.`)} You've been found out. There's only one way back outside, and it's through them, with your own party, on worse ground than you'd have chosen.`,
    [ch('Fight your way out.', fight(`They come at you two at once.`, foe('executive', 'Celosia and Mable', 6, { lv: 2, format: 'doubles' }),
      mark('found-out'), story({ end: 'defeated' }), flag('flare-ending-turn'), flag('flare-found-out')))]),
];
(TESTS[0] as Json).remembers = [{ id: 'rue-warn', when: [flagIs('ally-rue')], notice: say('Rue', `He'll ask you for a name. Somebody you love who's not worth a seat. Ask him for his first.`) }];
(TESTS[1] as Json).remembers = [{ id: 'xan', when: [flagIs('ally-xan')], notice: `Xan is in the corridor in a suit with one sleeve. He catches your eye, and takes one step sideways, out of their line.` }];

export const EVENTS: Json[] = [...offer, ...act1, ...act2, ...act3, ...act4, ...act5, ...OPS, ...RED, ...MORE, ...OFFICERS, ...TESTS];
export const REMOVE: string[] = [];
