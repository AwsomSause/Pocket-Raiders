// Catalog Overhaul Pack, Evil Teams Volume III: Paldea, Team Star from inside (EVIL_TEAMS_VOLUME_3_C "Paldea",
// TEAM_STAR_PALDEA_FULL_1 part B, FULL_3 parts B to D, EVIL_TEAMS_VOLUME_3_D "Paldea"). The Offer, the five Acts, the six
// Operations, the four inside-only scenes, the five bosses alone, Odin's question at Suspicion 7 and walking out at 10.
// The Final Choice, the four endings and Team Homeroom are in evil-story-40.ts; the twelve scenes for any player in
// evil-story-41.ts. This team is not the villain: the inside route isn't joining a gang, it's being let into a tent.
// Everyone in Team Star's a child; nothing that was done to them is shown, and no child's hurt on screen.
// The player's name is the scripts' own: Fulu, a squad of one, for the constellation's seventh star.
import { $, ch, ev, flag, flagIs, inRegion, money, out, room, type Json } from '../dsl.ts';
import { evil as story, foe, kind, prompt, STEALTH } from './_evil-story-kit.ts';

export const CATEGORY = 'evil-story';

const GRUNT = 'trainer.pr/star_grunt_m';
const ODIN = GRUNT;
const GIACOMO = 'boss.giacomo';
const ORTEGA = 'boss.ortega';
const MELA = 'trainer.pr/mela';
const ATTICUS = 'trainer.pr/atticus';
const ERI = 'trainer.pr/eri';
const PENNY = 'trainer.penny';
const CLAVELL = 'trainer.gentleman';
const UPSHAW = 'boss.drive/paldean-sv-janitor';
const YUSUF = 'trainer.pr/school_kid_m';
const MATE = 'boss.drive/paldean-sv-youngster';
const JACQ = 'boss.drive/paldean-sv-scientist';
const ZEB = 'boss.drive/paldean-sv-worker';
const STAR = '#241830';
const SCHOOL = '#1c2038';
const DARK = '#141424';
const P = inRegion('paldea');
const say = (who: string, line: string): string => `${who}: "${line}"`;
const inside = (o: Json = {}): Json[] => [{ kind: 'evil', team: 'star', inside: true, ...o }, P];
const mark = (m: string): Json => story({ mark: m });
const meters = (standing: number, suspicion = 0, rank?: number): Json => story({ ...(standing ? { standing } : {}), ...(suspicion ? { suspicion } : {}), ...(rank ? { rank } : {}) });
const beat = story({ beat: true });
/** The quiet way (FULL_3 C): Standing +1 either way, Suspicion +1, Kindness +1. Team Star doesn't punish Suspicion. */
const quiet = (): Json[] => [meters(1, 1), ...kind(1)];
const night: Json = { kind: 'period', in: ['night'] };
const sus = (atLeast: number, below = 11): Json => ({ kind: 'evil', team: 'star', inside: true, suspicion: atLeast, ...(below <= 10 ? { suspicionBelow: below } : {}) });
const stand = (atLeast: number): Json => ({ kind: 'evil', team: 'star', inside: true, standing: atLeast });
const final = room('st-final-choice');

// ---------- The Offer (after The Files; the scripts' Paldea Stage 2, Step 12: at the school gates) ----------
const offered = flag('star-offered');
const OFFER = `At the school gates. A Grunt in a star helmet, reading from a card: "'Hasta la vistar!' is— no. Wait. 'Join Team Star, where— ' I've lost my place. Look. D'you want to come? There's a tent. Nobody makes you talk. Nobody takes your stuff. That's the whole pitch."`;
const yes = ch('"Yes."', out(`"You will? Brilliant. Up the hill. There's a gate made of pallets; you can't miss it." You're in Team Star now, on the inside: the New Kid. Nobody outside knows it.`, mark('inside'), offered));
const report = ch('"Yes." (And tell the International Police.)', out(`You say yes. That night, in a Mesagoza café, you say it again to a man in a brown coat who calls himself Looker. ${say('Looker', `Team Star. They are children, you know. So. You will be my eyes, and you will be gentle with what you see.`)} You have a handler now. Every careless step counts double.`, mark('inside'), mark('inside-man'), flag('star-looker-met'), offered));
const no = ch('"No."', out(`"Fair enough. Nobody makes you." He folds the card back into his pocket, carefully, as if he'll need it again. Team Star goes on as it was, with you on the outside of it.`, flag('star-offer-refused'), offered));
const offer: Json[] = [
  ev('evil-star-offer-paldea', 'The Offer', 'Evil Teams', { room: true, cast: [GRUNT], tint: STAR, effect: 'glint' }, OFFER, [
    yes, no,
    ch('"Who took your stuff?"', out(`The helmet comes off. He's about fifteen. "...Everyone. For a year. Then Star happened. Then nobody."`, room('evil-star-offer-paldea-2'))),
    report,
  ]),
  ev('evil-star-offer-paldea-2', 'The Offer', 'Evil Teams', { room: true, cast: [GRUNT], tint: STAR }, `He puts the helmet back on. "So. D'you want to come?"`, [yes, no, report]),
];

// ---------- Act 1: Nobody Makes You Talk (stage 3, the town) ----------
const ACT1_NIGHT = `Night. The fairy lights. A fire in an oil drum. ${say('Odin, in the dark', `You've not said much.`)} ${say('Odin', `That's fine. Rule two.`)} A helmet. A sleeping bag. A timetable.`;
const act1End = (...fx: Json[]): Json[] => [flag('star-inside-act1'), flag('ally-odin'), ...fx, beat];
const act1: Json[] = [
  ev('st-act1', 'Nobody Makes You Talk', 'Evil Teams', { callback: true, requires: inside({ beat: 2 }), cast: [GRUNT], tint: STAR, effect: 'sparkle' },
    `A hillside. A gate made of pallets. A banner with a star. Tents. Fairy lights, in daylight. A bassline. The gate Grunt, helmet two sizes too big, wrench the wrong way round: "You came! I did the card wrong. I always do the card wrong. Go in. You don't have to say anything. That's rule two." Inside the gate, taped to a post: a field-trip permission slip. On the back, in five handwritings: the Code. 1. Nobody takes your stuff. 2. Nobody makes you talk. 3. You can sit with us. 4. A boss who's beaten steps down. 5. Nobody gets talked out of it.`,
    [ch('Take the helmet.', out(`You're given a helmet. Atticus made it. It fits. He's never met you. A note inside the band, in tiny stitches: "Spare. For whoever's next. — A." He's made forty-one. He's been keeping one back for eighteen months.`, flag('star-helmet-41'), room('st-act1-tent')))]),
  ev('st-act1-tent', 'The Tent', 'Evil Teams', { room: true, cast: [ODIN], tint: STAR },
    `A tent. A mixing desk. A sleeping bag. A stack of exercise books to the height of a chair. Odin Fenwright, sixteen, cross-legged, with a protractor: ${say('Odin', `You're Fulu. Squad of one. I'm Odin. That's my bag; that's yours; that's the homework.`)} ${say('Odin', `I've not been to a class in eighteen months. I've the syllabus memorised. I do the work. All of it. I post it under the staffroom door. Nobody marks it. I got Giacomo to check my maths; he's good. We're not skiving. We just can't be in the building.`)}`,
    [
      ch('"Why not?"', out(say('Odin', `You know when you've been somewhere something happened, and your legs won't? It's that. It's not a decision. I get to the gate and my legs won't.`), room('st-act1-class'))),
      ch('"Do they know you do it?"', out(say('Odin', `I put my name on it. Every sheet. Top right, like you're meant to. I don't know what happens after the door.`), room('st-act1-class'))),
      ch('"What happened eighteen months ago?"', out(say('Odin', `There was a whole class of us got picked on. Proper. Every day. Teachers knew. We made the team to stand up. We stood up once. All together. Didn't touch anyone. The bullies got frightened and left school. And we got the blame for 'driving students out.' That's the bit nobody'll say.`), room('st-act1-class'))),
    ]),
  ev('st-act1-class', 'Third Period', 'Evil Teams', { room: true, cast: [GIACOMO, ODIN], tint: STAR },
    `Third period. A bell: it's a saucepan. Twenty kids on crates. Giacomo at the decks, with a whiteboard. ${say('Giacomo', `Quadratics. Four-four time. Negative b,`)} (a beat) "plus or minus," (a beat) "root of b-squared minus four a c—" Twenty kids: "—ALL OVER TWO A." ${say('Giacomo, to you, not stopping', `Fulu! You're late! That's a detention! We don't have detentions! Sit down!`)}`,
    [
      ch('(Sit down.)', out(`You sit on a crate. You learn the quadratic formula in four-four. ${ACT1_NIGHT}`, ...act1End(flag('star-act1-quiet')))),
      ch('"Is this allowed?"', out(`${say('Giacomo', `Nobody's said it isn't! Sit down!`)} You sit. ${ACT1_NIGHT}`, ...act1End())),
      ch('"Who sets the work?"', out(`${say('Giacomo', `The Academy. We nicked the timetable. It's the same lessons. Same order. Same day. If we ever go back, nobody's behind. That was Cassiopeia's rule. She was dead strict about it.`)} ${ACT1_NIGHT}`, ...act1End())),
    ]),
];

// ---------- Act 2: The Thing with the Beans (stage 4; Step 9, instead of the battle) ----------
const BEANS = `Then, up the path: a boy in Academy uniform, by himself, carrying a casserole dish with a tea towel over it. ${say('The schoolmate', `I'm not here to fight. Yusuf, your mum's asking. She's made the thing with the beans.`)} He holds it out. It's still warm. He's walked it up a hill. Yusuf's looking at his shoes. ${say('The schoolmate', `And Mr. Jacq says the science fair's Thursday and there's still a table with your name on. He's not taken the card off.`)}`;
/** Yusuf, what do you want? Also played from outside (evil-story-40, st-gate-outside), for Team Homeroom. */
export const VOLCANO = `${say('Yusuf', `...I want to do the science fair. I've a volcano. It's a good volcano.`)} He opens the shoebox. It is. It's got a village round the bottom, with little flags. ${say('Yusuf', `I've not said. Everybody here got— I didn't get it as bad. I came after. I just didn't want to be the one who went back. Like it was fine.`)} A boot, on the truck roof. She's heard all of it. ${say('Mela', `Oi. New kid.`)} ${say('Yusuf', `...Yeah.`)} ${say('Mela', `Is it a good volcano?`)} ${say('Yusuf', `It erupts.`)} ${say('Mela', `Then go and do your volcano, kid. Nobody stays here 'cause they've got to. That's not the rule. That's the opposite of the rule.`)} A pause. ${say('Mela', `We'll come and watch. Loudly.`)} He goes down the hill with a schoolmate, a shoebox and an empty casserole dish.`;
const stays = ch(`"He stays. That's the rule."`, out(`Rule five. The schoolmate puts the dish down on the path and goes. Yusuf eats the beans in the gatehouse, by himself, out of the dish.`, meters(1, 0, 2), flag('star-yusuf-stayed'), flag('ally-yusuf'), flag('star-inside-act2'), beat));
const wants = ch('"Yusuf. What do you want?"', out(`${VOLCANO} ${say('Mela, to you, lacing the boot', `Don't look at me like that. I'm not soft. He's thirteen.`)}`, meters(1, 0, 2), ...kind(1), flag('star-volcano'), flag('star-yusuf-home'), flag('ally-yusuf'), flag('star-inside-act2'), beat));
const act2: Json[] = [
  ev('st-act2', 'The Thing with the Beans', 'Evil Teams', { callback: true, requires: inside({ beat: 3 }), cast: [MELA, YUSUF], tint: STAR },
    `Schedar base. A truck on a rise. Somebody on top of it, in very large boots, fixing one. ${say('Mela, not looking down', `You're the squad of one. Gate duty. Take the new kid; he needs to see how it's done. Somebody comes, you say 'who goes there,' you battle 'em. That's the job. Don't let 'em talk.`)} The new kid. ${say('Yusuf Lightfoot, thirteen, with a helmet under his arm and a shoebox under the other', `I'm Yusuf. I came 'cause my cousin did. He's in Navi. I've been here three weeks.`)} The shoebox has holes in the lid. It's not a Pokémon. It's papier-mâché. ${say('Yusuf', `It's nothing. It's a— it's nothing.`)}`,
    [ch('Take the gate.', out(`The gate. An hour.`, room('st-act2-gate')))]),
  ev('st-act2-gate', 'The Gate', 'Evil Teams', { room: true, cast: [MATE, YUSUF], tint: STAR }, BEANS, [
    ch('"Let him go home."', out(`He looks at you. He looks at the truck. He doesn't go. He needed to be asked a different question.`, room('st-act2-gate-2'))),
    stays, wants,
  ]),
  ev('st-act2-gate-2', 'The Gate', 'Evil Teams', { room: true, cast: [MATE, YUSUF], tint: STAR }, `The dish is still warm. Yusuf's still looking at his shoes.`, [stays, wants]),
];
(act2[0] as Json).remembers = [{ id: 'tidepool', when: [flagIs('tidepool-founded')], notice: `A line on a rock outside Schedar: BETTER ISN'T FINISHED TILL YOU'VE SOMEWHERE TO GO. ${say('Mela', `Yeah. That. That.`)}` }];

// ---------- Act 3: Forty-One, One Friday (stage 5; a door of four nodes, ps_st_file; no battle) ----------
const UPSHAW_SEEN = `In the corridor, going out: a man with a floor buffer, who's stopped it. ${say('Mr. Upshaw', `Evening.`)} He looks at Odin. He knows the helmet. He knows the name; it's top right on seventy sheets. ${say('Mr. Upshaw', `Fenwright. Your quadratics are coming on.`)} And he switches the buffer back on.`;
const act3End = (...fx: Json[]): Json[] => [meters(1, 0, 3), flag('star-inside-act3'), flag('star-file-empty'), flag('upshaw-seen'), ...fx, beat];
const act3: Json[] = [
  ev('st-act3', 'Forty-One, One Friday', 'Evil Teams', { callback: true, requires: inside({ beat: 4 }), cast: [ODIN], tint: SCHOOL },
    `The Academy, at night. A side door. Odin, at the threshold, with his hand on the frame. ${say('Odin', `Cassiopeia wants the file. On what happened. Proof. I said I'd go.`)} His legs won't. ${say('Odin', `...Give me a second.`)} It takes a minute.`,
    [
      ch('Wait.', out(`He goes in. On his own. It's the first time in eighteen months.`, flag('odin-walked-in'), room('st-file-corridor'))),
      ch('Go in first.', out(`You go in. He comes after you, a step behind, the way you'd follow somebody into cold water.`, room('st-file-corridor'))),
      ch('Hold out a hand.', out(`He looks at it. He takes it. You go in together.`, room('st-file-corridor'))),
    ]),
  ev('st-file-corridor', 'The Corridor', 'Evil Teams', { room: true, cast: [ODIN], tint: SCHOOL },
    `Lockers. A noticeboard. EXPULSION NOTICES — FINAL WARNING. Forty names. Odin's is eleventh.`,
    [ch('The records room.', out(`A cabinet. A drawer by year.`, room('st-file-records')))]),
  ev('st-file-records', 'The Records Room', 'Evil Teams', { room: true, cast: [ODIN], tint: SCHOOL },
    `A cabinet. A drawer by year. A folder, eighteen months old. Empty. A sticky note, in a neat hand: "Removed at the Vice-Principal's instruction. See H. — Staff involved reassigned." ${say('Odin', `They wiped it. There's no bullying on record. There's just us, with a truck, looking like the problem.`)} One sheet's left, at the back, stuck to the folder's spine. It's the forty-second. "Recommend the group be regarded as the aggressors." ${say('Odin', `That's— we told them. Forty-one times. I wrote number fifteen. 'We're not making it up. We compared.' I remember typing it.`)}`,
    [ch('A light, in the doorway.', out(`A torch.`, room('st-file-torch')))]),
  ev('st-file-torch', 'The Torch', 'Evil Teams', { room: true, cast: [CLAVELL, ODIN, UPSHAW], tint: SCHOOL },
    `A light in the doorway. A man of sixty, in a cardigan, with a ring of keys. He hasn't got the wig on. It's the first time. ${say('The Director', `...Ah.`)} ${say('Odin', `Clive?`)} ${say('The Director', `Clavell. I'm afraid. I've been meaning to say.`)} He looks at the open drawer. At the empty folder. He's as shocked as they are. ${say('The Director', `I've been here a year. I've been trying to find out why you won't come back. Nobody would tell me. There was no one left to tell me. I've a school with a year missing, and forty children outside it, and I'm supposed to expel them on Monday for reasons nobody can show me.`)}`,
    [
      ch('"Show him the empty folder."', out(`He reads the sticky note. He reads the forty-second. ${say('The Director', `'H.' Harrow. He interviewed me for this post. He was charming.`)} ${UPSHAW_SEEN}`, ...act3End(flag('star-director-shown')))),
      ch('Run.', out(`You're gone. He doesn't chase. He stands with a torch and an empty folder. He's seen less than he needs. ${UPSHAW_SEEN}`, ...act3End(flag('star-director-ran')))),
      ch('"Tell him. All of it. Now."', out(`Odin does. Rule two says nobody makes you. Nobody's making him. It takes an hour. The Director sits down on a filing cabinet and listens. He doesn't say "use your words." He doesn't say anything. At the end: ${say('The Director', `I can't act on an account. I'd need a record. Somebody who was here.`)} ${UPSHAW_SEEN}`, ...act3End(flag('star-director-told')))),
    ]),
];

// ---------- Act 4: A Second-Year Who's Scared of the Canteen (stage 6, needs Rank 4; a + node, at Night) ----------
const confide = (rank: number, ...fx: Json[]): Json[] => [meters(2, 0, rank), mark('confided'), flag('star-penny-confided'), flag('star-inside-act4'), ...fx, beat];
const RANK = (rank: number): string => rank === 6 ? `She gives you a number. It's her real one. You're the One She Meets.` : `She gives you a number. It's her real one. You're Cassiopeia's Voice.`;
const act4: Json[] = [
  ev('st-act4', 'A Second-Year Who\'s Scared of the Canteen', 'Evil Teams', { callback: true, requires: [...inside({ beat: 5, rank: 4 }), night], cast: [PENNY], tint: DARK },
    `A phone that rings. Yours. ${say('Cassiopeia, a voice changer', `This is Cassiopeia. You've been inside six weeks. You've seen the folder. I'm going to tell you something. I'd like you not to hang up.`)} ${say('Cassiopeia', `I founded it. I'm the reason they're out there. I should tell you: I'm also trying to end it. I've been setting people on them. Good trainers. So they'll lose, by their own rules, and go home. It's the only way I can think of to let them stop.`)} ${say('Cassiopeia', `There's a bench. By the fountain. I'll be— there'll be someone there.`)}`,
    [ch('Go to the fountain.', out(`A bench. A small figure in a hood.`, room('st-act4-bench')))]),
  ev('st-act4-bench', 'The Bench', 'Evil Teams', { room: true, cast: [PENNY], pokemon: 'eevee', tint: DARK },
    `The bench. A small figure in a hood. An Eevee backpack. A laptop, shut. The voice is her own now. ${say('Penny, to the fountain', `I got sent abroad when it blew up. My dad's idea. So I wasn't there when they took the blame. I made the plan and I wasn't there. They think I'm some legend. I'm a second-year who's scared of the canteen.`)} ${say('Penny', `I wrote rule five. 'Nobody gets talked out of it.' I was so pleased. I thought: no teacher can ever sit us down and be reasonable. And now I can't— I rang Giacomo. A year ago. I said, it's Cassiopeia, you can stop. He said, 'Rule five, boss.' He was proud.`)} ${say('Penny', `So I've been hiring people to beat them. That's what I do. I sit behind a pillar and I send strong trainers to make my friends lose. It's the only door I left.`)}`,
    [
      ch(`"They don't want to stop. They want to come back together."`, out(`${say('Penny', `There's no 'together' to come back to. There's a forty-second report. They'd walk into that building as 'the aggressors.'`)} A pause. ${say('Penny', `...Unless there wasn't a forty-second report. Unless there were the other forty-one.`)} ${RANK(5)}`, ...confide(5))),
      ch(`"Tell them it's you."`, out(`${say('Penny', `They'll hate me.`)} "They've a tent with your star on it." She's quiet for a while. ${say('Penny', `...They kept the star?`)} ${RANK(5)}`, ...confide(5))),
      ch(`"You were a kid. You still are."`, out(`${say('Penny', `I was fourteen. I wrote report number forty. 'We're going to do something about it ourselves. I'm telling you first.' I thought that was the grown-up thing.`)} ${RANK(5)}`, ...confide(5))),
      ch(`"They know it's you."`, out(`She looks up. First time. ${say('Penny', `They— no. They think she's— how long?`)} "Always. Rule two. Nobody makes you talk." She puts her hood down. Then up again. Then, slowly, down. ${RANK(6)}`, ...confide(6, flag('penny-hood-down'), flag('penny-knows-they-know')))),
    ]),
];
(act4[0] as Json).remembers = [{ id: 'silent', when: [flagIs('star-act1-quiet')], notice: say('Cassiopeia', `You don't fill gaps. That's— I like that. I can't do phones. This is all right.`) }];
(act4[1] as Json).remembers = [
  { id: 'ferry', when: [flagIs('star-lore-ferry')], notice: `You could say it: "Eleven hours." ${say('Penny', `...Who told you about the ferry.`)} A pause. ${say('Penny', `I wrote the timetable rule on the ferry. 'Same lessons, same day, so nobody's behind.' I thought if I couldn't be there I could at least make sure they could come back. It's the only rule I'm proud of.`)}` },
  { id: 'ledger', when: [flagIs('ledger-founded')], notice: say('Penny', `I've read Team Ledger's accounts. They publish. Everything. I've forty-one reports nobody'll admit existed, and there's a gang in Kanto that prints its own receipts.`) },
];

// ---------- Act 5: As Us (stage 7; Step 15, instead of the battle) ----------
const act5Tail = (...fx: Json[]): Json[] => [flag('star-inside-act5'), flag('star-as-us'), flag('star-van'), ...fx, beat, final];
const act5: Json[] = [
  ev('st-act5', 'As Us', 'Evil Teams', { callback: true, requires: inside({ beat: 6 }), cast: [GIACOMO, ORTEGA, ERI], tint: '#2a1a14' },
    `A hill between the five bases. An oil-drum fire. Five trucks, parked in a ring, noses out. Five bosses on five bonnets. They don't do this. They've not all been in one place since the shed. ${say('Giacomo', `Monday. The notices say Monday. We're expelled by post or we're in the yard.`)} ${say('Ortega', `I vote yard. With the engines. Loud. So loud they can't pretend. Star Barrage.`)} ${say('Atticus', `And then?`)} ${say('Ortega', `...And then they've heard us.`)} ${say('Eri', `They heard us last time. They wrote it down wrong.`)} ${say('Mela', `Somebody's got to say it. Do we want to go back?`)} Nobody answers. The fire. ${say('Odin, from the edge, where the squad seconds sit', `If we go back, do we go back as us? With the helmets? Or do we have to pretend it didn't happen? Because I'm not pretending it didn't happen.`)} ${say('Giacomo', `Rule five. Nobody's talked out of it.`)} ${say('Mela', `Yeah. I know. I know the rule. I'm asking what we want. The rule doesn't say what we want. It just says nobody can change our minds. I'm not sure we ever made them up.`)} The five look at the squad of one. ${say('Eri', `Fulu. You've been in the building. You've seen the folder. What's it like in there now?`)}`,
    [
      ch('"The same."', out(`${say('Eri', `...Right.`)} Nobody says anything. The fire.`, room('st-act5-van'))),
      ch(`"There's a Director who listened for an hour."`, out(`${say('Giacomo', `An hour?`)} "He didn't say 'use your words.' He didn't say anything." ${say('Mela', `...Huh.`)}`, room('st-act5-van'))),
      ch(`"There's a janitor with a box."`, out(`${say('Atticus', `A box?`)} "Seventy Fridays. In date order." Giacomo's stopped. ${say('Giacomo', `He kept it? All of— my verse-chorus proof of Pythagoras is in a box?`)} ${say('Odin', `He said my quadratics were coming on.`)}`, room('st-act5-van'))),
      ch(`"There's a table with Yusuf's name on. Nobody took the card off."`, out(`${say('Mela', `...They left the card.`)} She looks at her boot. ${say('Mela', `Eighteen months, there's forty desks in that room with nobody at them. Did they take ours away?`)} "I'll look."`, room('st-act5-van')), { requires: [flagIs('star-volcano')] }),
    ]),
  ev('st-act5-van', 'As Us', 'Evil Teams', { room: true, cast: [ZEB, ATTICUS], tint: '#2a1a14' },
    `Down the hill, at the Ruchbah gate, a van with no plates. Captain Zeb, on the radio, fourteen: ${say('Captain Zeb', `Boss. There's people in our helmets. They've got the wrong boots.`)} Atticus, counting, by the fire: "Forty. Forty-one. Forty-two." He's counting helmets. He's got one too many. He doesn't put it away.`,
    [ch(`The night's last choice: what's said, and to whom.`, out(`The fire's low.`, room('st-act5-told')))]),
  ev('st-act5-told', 'As Us', 'Evil Teams', { room: true, cast: [MELA, GIACOMO, ERI], tint: '#2a1a14' }, `Your last choice of the night. What's said, and to whom.`, [
    ch('Nothing.', out(`Monday goes as it goes.`, ...act5Tail(flag('star-told-none')))),
    ch('To Odin and Yusuf.', out(`They know Cassiopeia's trying to end it. In every ending, they act on it.`, ...act5Tail(flag('star-told-squad')))),
    ch(`To the five: "Cassiopeia wants you to stop."`, out(`It isn't breaking rule five. It's telling them what she wants; it's not talking them out of it. Silence. Then Mela: ${say('Mela', `Then why didn't she say?`)} ${say('Giacomo', `She did. I said 'rule five, boss.' I was proud.`)} He puts his headphones on. He takes them off. ${say('Atticus', `We've been holding a door shut that she's been trying to open from the other side.`)}`, ...act5Tail(flag('star-told-wants')))),
    ch(`To the five: "She's Penny. She's by the fountain. She thinks you don't know."`, out(`${say('Eri', `...She thinks we don't know?`)} ${say('Ortega', `She found the Varoom! In a skip! Who else'd it be!`)} ${say('Mela', `Eighteen months she's been doing a voice at us.`)} She's laughing. Then she isn't. ${say('Mela', `She's been by herself the whole time.`)} They get in the trucks. They don't go to the yard. They go to the fountain.`, ...act5Tail(flag('star-told-penny'))), { requires: [{ kind: 'evil', has: 'confided' }] }),
  ]),
];
(act5[0] as Json).remembers = [
  { id: 'desks', when: [flagIs('star-desks-kept')], notice: `You've lifted the lids in 1-G. Nobody took the desks away.` },
  { id: 'encore', when: [flagIs('encore-founded')], notice: `A coach in the Academy's car park. Forty-two seats. Black and pink. Big Daz: "We heard there's a lot who've nobody watchin'. We've come to watch."` },
  { id: 'koa', when: [flagIs('koa-fourth')], notice: say('Odin', `A kid in Alola took his trial four times. With forty people watching. I'd take a class with forty people watching.`) },
];

// ---------- The six Operations (FULL_3 C): one per Paldea stage from 3, optional ----------
const OPS: Json[] = [
  // PO1. The Gate (stage 3)
  ev('st-op-gate', 'Operation: The Gate', 'Evil Teams', { requires: inside({ after: 2 }), cast: [GRUNT], tint: STAR },
    `The order: turn challengers away. "Who goes there." A battle. No talking. The gate Grunt gives you the card. On every line it says: BATTLE THEM.`,
    [
      ch('Battle them.', out(`Who goes there. A battle. No talking. They go.`, meters(1))),
      ch('Ask each why they came.', out(`You ask.`, room('st-op-gate-ask'))),
    ]),
  ev('st-op-gate-ask', 'The Gate', 'Evil Teams', { room: true, cast: [GRUNT], tint: STAR },
    `A trainer with eight badges: Cassiopeia sent him. He's been told they need to lose. He doesn't know why. He feels bad about it. A second-year with a rucksack: she got a flyer. She wants to join. She's been at the gate an hour working up to it. A delivery man: forty sandwiches. From "a friend." They're labelled. A woman with a pot: beans. And a boy in the wrong boots: "School production."`,
    [ch('Battle the boy in the wrong boots.', { ...out(`He's the first one the base has ever turned away, and it's the right one. The gate Grunt, wrench the wrong way round: "We've been battling the sandwich man? For a year?" The card's rewritten. By the Grunt. In felt tip: WHO GOES THERE. AND WHAT FOR.`, ...quiet(), flag('star-gate-asked')), battle: foe('grunt', 'A boy in the wrong boots', 3, { lv: 0 }) })]),
  // PO2. The Homework Run (stage 4)
  ev('st-op-homework', 'Operation: The Homework Run', 'Evil Teams', { requires: inside({ after: 3 }), cast: [ODIN], tint: SCHOOL },
    `The order: Friday. The folder. Under the staffroom door. In and out; don't be seen.`,
    [
      ch('Under the door.', out(`In and out. Nobody sees.`, meters(1))),
      ch('Hand it to a teacher. In person. Wait.', out(`The staffroom door. You knock.`, room('st-op-homework-door'))),
    ]),
  ev('st-op-homework-door', 'The Staffroom Door', 'Evil Teams', { room: true, cast: [JACQ], tint: SCHOOL },
    `${say('Mr. Jacq, opening it, with a mug', `Yes?`)} You hold out a folder. Forty names. He reads the first one. Top right. ${say('Mr. Jacq', `Fenwright.`)} The second. ${say('Mr. Jacq', `...These are 1-G.`)} He looks at you. At the helmet. ${say('Mr. Jacq', `You're one of—`)} "I'm the post." ${say('Mr. Jacq', `Wait there. Don't go. Don't go.`)} He goes in. A long time. He comes back with a red pen and a chair. ${say('Mr. Jacq', `I'm going to mark the first one now. In front of you. So you can tell them you saw it done.`)}`,
    [ch('Wait.', out(`He marks Odin's. In a corridor. On his knee. It takes forty minutes. You wait. ${say('Mr. Jacq', `Nine out of ten. He's dropped a sign in question six. Tell him he's dropped a sign.`)}`, ...quiet(), flag('star-homework-marked')))]),
  // PO3. The Flag (stage 5)
  ev('st-op-flag', 'Operation: The Flag', 'Evil Teams', { requires: inside({ after: 4 }), cast: [ODIN], tint: STAR },
    `The order: a new hill. A new banner. Somewhere remote; somewhere nobody'll take it down. ${say('Odin, with a pole', `The far ridge. That's the order. Nobody goes up there.`)}`,
    [
      ch('The far ridge.', out(`It goes up on the far ridge. Nobody goes up there.`, meters(1))),
      ch(`"Nobody sees up there."`, out(`You point. A nearer hill. Bare. It faces the Academy's east windows. It's the view from Homeroom 1-G. ${say('Odin', `...That's— we'd be looking right at it. They'd be looking right at us.`)} "That's what a flag's for."`, room('st-op-flag-dawn'))),
    ]),
  ev('st-op-flag-dawn', 'The Flag', 'Evil Teams', { room: true, cast: [ODIN], tint: STAR },
    `Dawn. A pole, a rope, a wind.`,
    [ch('Raise it.', out(`It goes up at dawn. In 1-G, at registration: Mr. Jacq, reading forty names to forty empty desks. He looks up. Out of the window. A star, on a hill, a mile off. He goes on reading. He's smiling. At the end, he adds a forty-first: "Flag. Present."`, ...quiet(), flag('star-flag-raised')), {
      prompt: prompt(STEALTH), fail: out(`The wind takes it twice. It goes up at dawn anyway. In 1-G, at registration: Mr. Jacq, reading forty names to forty empty desks. He looks up. Out of the window. A star, on a hill, a mile off. He goes on reading. He's smiling. At the end, he adds a forty-first: "Flag. Present."`, ...quiet(), flag('star-flag-raised')),
    })]),
  // PO4. The Canteen (stage 6, the Academy)
  ev('st-op-canteen', 'Operation: The Canteen', 'Evil Teams', { requires: inside({ after: 5 }), cast: [ODIN], tint: SCHOOL },
    `The order: "liberate" lunch. In by the kitchen door; forty trays; out. ${say('Odin, at the canteen\'s double doors, in a helmet', `It's one o'clock. There's four hundred people in there.`)} ${say('Odin', `I've not been in since report twenty-three. That was mine as well. 'Is there somewhere else I'm allowed to eat.'`)}`,
    [
      ch('In by the kitchen door.', out(`Forty trays. Out. The squad eats from the pot that night.`, meters(1))),
      ch('Pay. Sit down. At a table. In daylight.', out(`You go in first. Two lunches: ₽400. The Honest Trade Card: it's lunch. You sit. At a table by the bins. You put the second tray opposite. The doors. A boy in a star helmet. Four hundred people don't look up; it's lunch; they're eating. He walks to the table. It takes him a long time. He sits. He takes the helmet off and puts it on the bench beside him. ${say('Odin', `...It's chips.`)} ${say('Odin', `I'd built it up. In my head. Eighteen months. It's just a room with chips in.`)} Nothing's stolen. The squad eats from the pot that night, as usual. Odin eats twice.`, $(-400), ...quiet(), flag('star-canteen')), { requires: [money(400)] }),
    ]),
  // PO5. The Truck (stage 6 or 7)
  ev('st-op-truck', 'Operation: The Truck', 'Evil Teams', { requires: inside({ after: 5 }), cast: [ORTEGA, ZEB], pokemon: 'revavroom', tint: STAR },
    `The order: guard the Ruchbah Starmobile. There's been a van.`,
    [
      ch('Guard it.', out(`You stand by it all night. Nothing comes.`, meters(1))),
      ch('Wash it. With the kids who built it.', out(`A bucket. A sponge.`, room('st-op-truck-wash'))),
    ]),
  ev('st-op-truck-wash', 'The Truck', 'Evil Teams', { room: true, cast: [ORTEGA, ZEB], pokemon: 'revavroom', tint: STAR },
    `Ortega, under the chassis. Captain Zeb, on the bonnet. A Revavroom the size of a shed, purring. ${say('Ortega, from underneath', `You don't guard an engine. You maintain it.`)} Each panel washed is a thing said. The bonnet, Zeb: ${say('Zeb', `She runs hot. She doesn't like running hot. I can tell. She goes quiet after.`)} The wheels, Ortega: ${say('Ortega', `My dad thinks it's a phase. He's offered to ring someone. I'd rather be expelled than rung up for.`)} The star on the door, a Grunt: "I painted that. I'd never painted anything. I didn't know I could do a straight line." The grille: you. The Revavroom's looking at you. Close up. It's got eyes.`,
    [ch('"Does she want to?"', out(`${say('Ortega', `...Does who want to what.`)} "The engine. Run." He comes out from under. ${say('Ortega', `I've never— it's an engine.`)} He looks at it. It looks at him. ${say('Ortega', `It's a Revavroom. I know it's a Revavroom. I've been calling her 'the engine' for a year and a half so I'd not have to—`)} He puts a hand on the grille. ${say('Ortega', `D'you want to? Girl? You can stop. I'd still feed you.`)} She revs. Once. Low. ${say('Zeb', `That's yes.`)} ${say('Ortega', `How d'you know.`)} ${say('Zeb', `Torque.`)}`, ...quiet(), flag('star-engine-asked')))]),
  // PO6. The Call (stage 7; a door of two nodes)
  ev('st-op-call', 'Operation: The Call', 'Evil Teams', { requires: inside({ after: 6 }), cast: [PENNY], tint: DARK },
    `The order: take Cassiopeia's orders for Monday. Write them down. Relay them. ${say('Cassiopeia, the voice changer', `Monday. Positions. Segin at the east wall. Schedar—`)}`,
    [
      ch('Write them down.', out(`Eleven items. You write them down. You relay them.`, meters(1))),
      ch('"How are you?"', out(`Silence. The changer hums.`, room('st-op-call-2'))),
    ]),
  ev('st-op-call-2', 'The Call', 'Evil Teams', { room: true, cast: [PENNY], tint: DARK },
    `${say('Cassiopeia', `...That's not on the agenda.`)} "I know." ${say('Cassiopeia', `I've an agenda. I've eleven items. I made it so I'd not have to—`)} The changer cuts out. Or she's turned it off. ${say('Penny', `I'm really bad. Actually. Since you ask. I've not slept. I keep thinking: Monday, they're either expelled or they're in a yard with engines I designed, and either way I'm behind a pillar.`)}`,
    [
      ch('"Come to the yard."', out(`A long time. ${say('Penny', `...I'll think about it. That's not no.`)} The orders are still relayed. All eleven items. There's a twelfth, in her own voice, that you're asked to pass on: "And tell them I'll be there. Not on the phone."`, ...quiet(), flag('star-call-asked'))),
      ch(`"What d'you need?"`, out(`${say('Penny', `...Somebody to say I can stop being Cassiopeia. I can't say it. Rule five. I'd be talking myself out of it.`)} "You can stop being Cassiopeia." A very long silence. ${say('Penny', `That— doesn't count. You're not— does that count?`)} "Rule five says nobody gets talked out of it. I'm not talking you out of it. I'm telling you you're allowed." ${say('Penny', `That's a loophole.`)} "You wrote it." She laughs. It's got the hiccups in it. The orders are still relayed. All eleven items. There's a twelfth, in her own voice, that you're asked to pass on: "And tell them I'll be there. Not on the phone."`, ...quiet(), flag('star-call-asked'), flag('penny-allowed'))),
      ch('(Stay on the line.)', out(`Neither of you says anything for a while. It isn't awkward. The orders are still relayed. All eleven items. There's a twelfth, in her own voice, that you're asked to pass on: "And tell them I'll be there. Not on the phone."`, ...quiet(), flag('star-call-asked'))),
    ]),
];
// Barks (FULL_3 D): Odin and Yusuf by Standing and Suspicion; the bases at the oil drum; Penny, to her Voice.
(OPS[0] as Json).remembers = [{ id: 'odin-low', when: [sus(0, 4)], notice: say('Odin', `Rule two. You don't have to.`) }, { id: 'yusuf-low', when: [sus(0, 4)], notice: say('Yusuf', `It's nothing. It's a shoebox.`) }];
(OPS[2] as Json).remembers = [{ id: 'odin-mid', when: [stand(5)], notice: say('Odin', `You walk at my speed. Nobody walks at my speed.`) }, { id: 'yusuf-mid', when: [stand(5)], notice: say('Yusuf', `D'you want to see it erupt? I've done it in the sink.`) }, { id: 'odin-sus', when: [sus(4, 7)], notice: say('Odin', `You were at the staffroom door. In daylight. That's brave or stupid. I've not decided.`) }];
(OPS[4] as Json).remembers = [{ id: 'mela', when: [flagIs('star-inside-act2')], notice: `At the oil drum, Mela: "He's thirteen. I'm not soft." Nobody said she was.` }, { id: 'homework', when: [flagIs('star-homework-marked')], notice: say('Odin, to anyone', `Nine out of ten. I dropped a sign. In six.`) + ` He's told forty people.` }, { id: 'odin-after', when: [{ kind: 'evil', has: 'loyalty-test' }], notice: say('Odin', `I'm glad you told them. I'd have had to, and I'd have made it sound worse.`) }];
(OPS[6] as Json).remembers = [{ id: 'odin-high', when: [stand(8)], notice: say('Odin', `If I go in, I want you on my left. That's where the door is.`) }, { id: 'yusuf-high', when: [stand(8)], notice: say('Yusuf', `When I'm in Star and in school, will you tell people that's allowed?`) }, { id: 'flag', when: [flagIs('star-flag-raised')], notice: `At the oil drum, a Grunt: "You can see the school from the flag. You can see our room."` }];
(OPS[7] as Json).remembers = [{ id: 'canteen', when: [flagIs('star-canteen')], notice: `${say('Giacomo', `Fenwright ate in the canteen? In daylight? And nothing—`)} ${say('Odin', `It's chips.`)}` }, { id: 'pots', when: [flagIs('star-pot')], notice: `At the oil drum, everybody: "There's three pots now."` }];
(OPS[9] as Json).remembers = [{ id: 'acceptable', when: [flagIs('star-gate-asked')], notice: `(changer) "Acceptable." (a click) "—that was really good, actually—" (a click) "Acceptable."` }, { id: 'speech', when: [{ kind: 'evil', team: 'star', inside: true, after: 6, has: 'confided' }], notice: say('Penny', `I've an eleven-page speech. Giacomo says one line. What's the one line?`) }];

// ---------- PI1. How Near: Odin walks to the school, evenings (the stage's last rest, stages 3 to 7). No choices but one. ----------
const near = (stage: number, where: string, line: string): Json =>
  ev(`st-near-${stage}`, 'How Near', 'Evil Teams', { requires: inside({ after: stage - 1 }), cast: [ODIN], tint: SCHOOL },
    `Odin walks to the school, evenings. To see how near his legs'll go. You walk with him. ${where}`,
    [ch('Walk beside him.', out(line))]);
const NEAR: Json[] = [
  near(3, `The end of the road. He can see the clock.`, say('Odin', `That's it. That's the record. I can see it.`)),
  near(4, `The bus shelter opposite.`, `${say('Odin', `I used to get off here. I'd my hand on the pole, like this. I can't let go of the pole.`)} He lets go of the pole. He puts his hand back.`),
  near(5, `Inside. At night. With a job to do.`, say('Odin', `It's easier with a reason. I didn't have to be there. I just had to fetch something.`)),
  near(6, `The gate. In daylight. Break's on; there's noise.`, say('Odin', `They're playing football. I thought it'd be— I don't know what I thought. It's just football.`)),
  near(7, `The yard. He stands in it. For a minute. Nobody looks.`, `${say('Odin', `Nobody looked. I thought they'd all look.`)} A pause. ${say('Odin', `I'm in the yard. Fulu. I'm in the yard.`)}`),
];

// ---------- PI2. Your Lesson (stage 4 or 5, a + node) ----------
const TEST = room('st-lesson-test');
const LESSON: Json[] = [
  ev('st-lesson', 'Your Lesson', 'Evil Teams', { requires: inside({ after: 3 }), cast: [GIACOMO], tint: STAR },
    `A crate. A whiteboard. Twenty kids on the ground. A timetable with a gap in it. ${say('Giacomo', `Fourth period's 'Battle Studies.' We've nobody for it. Eri does PE; it's not the same. You've been everywhere. Teach.`)}`,
    [
      ch(`"What to do after you lose."`, out(`Twenty kids write it down. It's the only lesson they've had on it.`, TEST)),
      ch(`"It's not a tool. Ask it."`, out(`Twenty kids look at their Pokémon. One asks hers something, quietly.`, TEST), { requires: [{ kind: 'bondLevel', atLeast: 5 }] }),
      ch(`"There's others. Like you. They're all right."`, out(`What you did in another region, with people who'd been left out. Twenty kids listen as if it were the news.`, TEST), { requires: [{ kind: 'anyFlag', keys: ['ledger-founded', 'ember-founded', 'tidepool-founded', 'encore-founded', 'lantern-founded', 'openhand-founded'] }] }),
      ch('"Type match-ups."', out(say('Giacomo', `It's on the syllabus. Fair enough.`), TEST)),
    ]),
  ev('st-lesson-test', 'Your Lesson', 'Evil Teams', { room: true, cast: [GIACOMO, GRUNT], tint: STAR },
    `A Grunt, hand up: "Is this on the test?" ${say('Giacomo', `There's no test. There's never been a test. We've nobody to set one.`)} The Grunt: "...Can we have one? I'd like to know if I'm any good."`,
    [ch('Set one question.', out(`One question. Whatever you like. It's marked the next stage. Everybody passes. Atticus sews a pass-mark onto each sleeve.`, ...kind(1), flag('star-lesson')))]),
];

// ---------- PI3. The Seventh Star (stage 5 or 6, Navi base, at Night; needs Rank 3) ----------
const SEVENTH = ev('st-seventh-star', 'The Seventh Star', 'Evil Teams', { requires: [...inside({ after: 4, rank: 3 }), night], cast: [ATTICUS], tint: DARK },
  `A hill. No lights. Atticus, with a needle, and a sky. ${say('Atticus', `Cassiopeia's five stars. The W. Segin, Ruchbah, Navi, Schedar, Caph. One each. She picked. She said: 'A constellation's just some dots somebody decided went together.'`)} ${say('Atticus', `There's a sixth. Achird. Faint. And a seventh, fainter: Fulu. Nobody uses those. She said to keep them back. For whoever came after.`)} He holds up your helmet. He's sewing something inside the band, where the "spare" note was. ${say('Atticus', `I've been unpicking 'spare.' It's taken a week. I do very small stitches.`)}`,
  [
    ch('"What goes there now?"', out(`He shows it. Seven tiny points. A W, and two more. ${say('Atticus', `That's all of us. With you in. And a place for her.`)}`, flag('star-seventh'))),
    ch(`"Why'd she keep two back?"`, out(say('Atticus', `She said: 'There'll be someone who should've been in the room and wasn't. And someone who wasn't in the room and should be.' I didn't understand it. I think the first one's her.`), flag('star-seventh'))),
    ch(`"Who's Achird for?"`, out(`He doesn't answer. He goes on sewing. Very small stitches.`, flag('star-seventh'))),
  ]);

// ---------- PI4. Voice Changer (stage 6 or 7, a rest at Night; needs Rank 5) ----------
const VOICE = ev('st-voice-changer', 'Voice Changer', 'Evil Teams', { requires: [...inside({ after: 5, rank: 5 }), night], cast: [PENNY], tint: DARK },
  `The phone rings. It's late. ${say('Cassiopeia, the voice changer', `Fulu. Report. Segin's morale. Schedar's supplies. Whether Ortega's eating.`)} You report. ${say('Cassiopeia', `Good. And— is Mela sleeping? She doesn't. She says she does.`)} A click. The changer's cut out. She hasn't noticed. ${say('Penny, her own voice, small, tired', `—because she used to ring me at two in the morning, before. Just to say she was awake. And I'd say, me too. And we'd not say anything else. We'd just both be awake.`)} A silence. She's heard herself. ${say('Penny', `...It's off. Isn't it. The thing.`)}`,
  [
    ch(`"It's off."`, out(`${say('Penny', `How long?`)} "Since 'is Mela sleeping.'" ${say('Penny', `Oh, no.`)} A pause. ${say('Penny', `...It's quite nice. Talking like this. I'd forgotten what I sound like.`)}`)),
    ch('(Say nothing.)', out(`She doesn't switch it back on. Neither of you hangs up for a while.`)),
    ch('"Ring her. At two. Don\'t say who."', out(`She does. That night. You aren't on the call. The next day, at Schedar: ${say('Mela', `Somebody rang me. Two in the morning. Didn't say a word. Just breathed. I said, 'Me too.'`)} She's lacing a boot. She's smiling at it. ${say('Mela', `I slept after. First time in a year.`)}`, flag('penny-rang'))),
  ]);

// ---------- The five bosses, alone (VOLUME_3_D), at their own bases, after hours ----------
const BOSSES: Json[] = [
  ev('st-giacomo-alone', 'Giacomo, Alone', 'Evil Teams', { requires: inside({ after: 3 }), cast: [GIACOMO], tint: STAR },
    `At the decks, headphones round his neck. ${say('Giacomo', `I wrote the team song. Nobody's heard the last verse. It's about going back. I can't finish it till I know if we do.`)}`,
    [
      ch('"Play what you\'ve got."', out(`He does. It stops where the last verse should be. He doesn't fill the gap. Neither do you.`)),
      ch(`"What rhymes with 'homeroom'?"`, out(`${say('Giacomo', `Nothing. I've checked. That's half the problem.`)}`)),
      ch('"Write it as if you do."', out(`He picks up a pen. He puts it down. ${say('Giacomo', `...I'll write it in pencil.`)}`, flag('giacomo-pencil'))),
    ]),
  ev('st-mela-alone', 'Mela, Alone', 'Evil Teams', { requires: inside({ after: 3 }), cast: [MELA], tint: STAR },
    `Fixing a boot. ${say('Mela', `I was the one who shouted. That day. The bullies ran 'cause I shouted. So if we got blamed, I got us blamed. Nobody's said. I've said it to myself every night.`)}`,
    [
      ch('"You shouted for them."', out(`${say('Mela', `...Yeah. I did.`)} She goes back to the boot.`)),
      ch(`"They'd have run anyway."`, out(`${say('Mela', `Maybe.`)} She doesn't believe it. She'd like to.`)),
      ch('"Has anyone thanked you?"', out(`She's stopped lacing. ${say('Mela', `...No. I didn't do it for— no. Nobody has.`)}`, room('st-mela-thank'))),
    ]),
  ev('st-mela-thank', 'Mela, Alone', 'Evil Teams', { room: true, cast: [MELA], tint: STAR }, `The boot, half laced.`, [
    ch('"Thank you."', out(`She looks at the boot for a long time. She doesn't say anything. She finishes the lace, very carefully.`, ...kind(1), flag('mela-thanked'))),
    ch('(Say nothing.)', out(`She finishes the lace.`)),
  ]),
  ev('st-atticus-alone', 'Atticus, Alone', 'Evil Teams', { requires: inside({ after: 3 }), cast: [ATTICUS], tint: STAR },
    `Sewing. ${say('Atticus', `I made every uniform. Forty. By hand. If we disband, what do I do with forty helmets? I'm not being funny. I've nowhere to put them.`)}`,
    [
      ch('"A school club needs a kit."', out(`He stops sewing. ${say('Atticus', `...It would, wouldn't it.`)}`)),
      ch('"Keep one."', out(say('Atticus', `I've kept one. I've kept one for eighteen months. That's how I know it doesn't help.`))),
      ch('"Who taught you to sew?"', out(say('Atticus', `Nobody. A book. I sewed under the desk, in lessons. It was the only thing I could do with my hands that nobody could take off me.`))),
    ]),
  ev('st-ortega-alone', 'Ortega, Alone', 'Evil Teams', { requires: inside({ after: 3 }), cast: [ORTEGA], tint: STAR },
    `On a far too expensive chair. ${say('Ortega', `My family could've had the bullies expelled in a day. I never told them. I didn't want it bought. I wanted us to do it. And then it went wrong, and I could still buy it right, and I still won't. Is that pride? Giacomo says it's pride.`)}`,
    [
      ch(`"It's pride."`, out(say('Ortega', `...Yeah. Fine. It's pride. I'm keeping it.`))),
      ch(`"It's respect."`, out(`He looks at you as if you'd paid him. ${say('Ortega', `Tell Giacomo.`)}`)),
      ch('"Buy the truck a new engine instead."', out(say('Ortega', `I don't buy her engines. I build them. That's the whole point.`))),
    ]),
  ev('st-eri-alone', 'Eri, Alone', 'Evil Teams', { requires: inside({ after: 3 }), cast: [ERI], tint: STAR },
    `In the dojo, cooling down. ${say('Eri', `I'm the strong one. So I stand at the front. Nobody's asked if I'm frightened. I'm always frightened. I'm just big.`)}`,
    [
      ch(`"I'm asking."`, out(say('Eri', `...Yeah. I am. Thanks.`), ...kind(1), flag('eri-asked'))),
      ch('"Who stands in front of you?"', out(`${say('Eri', `Nobody. That's the job.`)} She stretches. She doesn't look at you.`)),
      ch('"Sit down a minute."', out(`She sits. She doesn't say anything. It's the first time you've seen her sit.`)),
    ]),
];

// If other regions were played first (FULL_1 A14): the third-option teams of Sinnoh and Unova, as the parallel row names them.
(BOSSES[3] as Json).remembers = [{ id: 'openhand', when: [flagIs('openhand-founded')], notice: `A tea towel in Atticus's tent: ASK THE ONE IT'S ABOUT. ${say('Atticus', `Nobody did. Eighteen months. They asked the school.`)}` }];
(BOSSES[5] as Json).remembers = [{ id: 'lantern', when: [flagIs('lantern-founded')], notice: `A lamp at the Caph base gate. ${say('Eri', `Somebody posted it from Sinnoh. With a note. 'Ask, and then wait.' I don't know who it's for. I think it's for me.`)}` }];

// ---------- Odin asks (Suspicion 7: Team Star doesn't test people) and walking out (Suspicion 10) ----------
const TESTS: Json[] = [
  ev('st-odin-asks', 'Odin Asks', 'Evil Teams', { callback: true, requires: inside({ suspicion: 7, suspicionBelow: 10, lacks: 'loyalty-test' }), cast: [ODIN], tint: STAR },
    `There isn't a loyalty test. Team Star doesn't test people. Odin, by the oil drum, not looking at you: ${say('Odin', `You've been talking to the Director. I saw. Are you going to tell them, or am I?`)}`,
    [
      ch(`"I'll tell them."`, out(`You tell them. Nobody shouts. ${say('Odin, after', `I'm glad you told them. I'd have had to, and I'd have made it sound worse.`)}`, meters(0, -2), mark('loyalty-test'))),
      ch('"You tell them."', out(`He does. He makes it sound worse. They listen anyway. Rule two.`, meters(0, -1), mark('loyalty-test'))),
      ch(`"Let's both."`, out(`You tell them together. It takes a while. ${say('Odin, after', `I'm glad you told them. I'd have had to, and I'd have made it sound worse.`)}`, meters(0, -3), ...kind(1), mark('loyalty-test'))),
    ]),
  ev('st-found-out', 'Found Out', 'Evil Teams', { callback: true, requires: inside({ suspicion: 10, lacks: 'found-out' }), cast: [MELA, ODIN], tint: '#3a1418' },
    `The gate's shut when you come back. Mela's on it, in her dad's boots, and she won't meet your eye. ${say('Mela', `You've been in the building more than we have. With the Director. It's fine. It's not a crime. But it's Monday soon, and we can't have somebody in the tent who's on both sides of the gate.`)} Nobody battles you. Nobody shouts. That's not what they're for. Odin, behind her, holds out his hand for the helmet.`,
    [ch('Give it back.', out(`You give it back. Odin turns it over and puts it under his arm, carefully, like something he'll be asked to look after. You're outside Team Star now. Nobody's angry. That's somehow worse.`, mark('found-out'), story({ end: 'defeated' }), flag('star-found-out')))]),
];
(TESTS[0] as Json).remembers = [{ id: 'yusuf', when: [flagIs('ally-yusuf')], notice: `Yusuf's by the gatehouse. He catches your eye, and nods, very small, as if to say: go on.` }];

export const EVENTS: Json[] = [...offer, ...act1, ...act2, ...act3, ...act4, ...act5, ...OPS, ...NEAR, ...LESSON, SEVENTH, VOICE, ...BOSSES, ...TESTS];
export const REMOVE: string[] = [];
