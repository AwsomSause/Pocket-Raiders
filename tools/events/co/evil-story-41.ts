// Catalog Overhaul Pack, Evil Teams Volume III: Paldea, the twelve scenes for any player (TEAM_STAR_PALDEA_FULL_3 part A,
// PS1 to PS12): open on either route, inside or out, while Team Star's story runs in Paldea. What was done to 1-G is
// never shown. Keepsakes are cut (Kice, 2026-11-13), so the hairdryer (PS3) and the detention slip (PS10) are flags only.
import { bondUp, ch, ev, flag, flagIs, heal, inRegion, out, room, type Json } from '../dsl.ts';
import { kind, prompt, STEALTH } from './_evil-story-kit.ts';

export const CATEGORY = 'evil-story';

const PENNY = 'trainer.penny';
const CLAVELL = 'trainer.gentleman';
const UPSHAW = 'boss.drive/paldean-sv-janitor';
const JACQ = 'boss.drive/paldean-sv-scientist';
const TYME = 'trainer.pr/scientist_f';
const MELA = 'trainer.pr/mela';
const ODIN = 'trainer.pr/star_grunt_m';
const ZEB = 'boss.drive/paldean-sv-worker';
const TULLY = 'trainer.roughneck';
const KID = 'boss.drive/paldean-sv-schoolkid-girl';
const SCHOOL = '#1c2038';
const TOWN = '#2a2418';
const P = inRegion('paldea');
const say = (who: string, line: string): string => `${who}: "${line}"`;
const intel = (n: number): Json => flag('intel', n);
/** Open on any route while Team Star's story runs in Paldea, from this beat on. */
const ps = (after: number): Json[] => [{ kind: 'evil', team: 'star', after, anyRoute: true }, P];
const night: Json = { kind: 'period', in: ['night'] };

// PS1. The Green Form (the Academy, a computer room; stage 3 or later)
const FORM: Json[] = [
  ev('ps-green-form', 'The Green Form', 'Evil Teams', { requires: ps(2), cast: [KID], tint: SCHOOL },
    `A row of terminals. On each, in the corner of the school's home page, a small green button: TELL US. WE'LL LISTEN. ${say('A second-year at the next screen, not looking round', `Don't bother. It doesn't go anywhere. I did one in the autumn. You get the message and then nothing.`)}`,
    [
      ch('(Send one.)', out(`A form. Name. Year. "What happened?" A box. You type a line. Anything. SEND. A reply, at once: "Thank you. Your report has been received and will be reviewed by the Vice-Principal." ${say('The second-year', `There isn't a vice-principal. There's not been one for a year. It's still going to his inbox.`)}`, flag('star-form-sent'))),
      ch('"What did yours say?"', out(`${say('The second-year', `That nobody sits next to me. I felt stupid typing it. It's not a thing. Nobody's done anything.`)} A pause. ${say('The second-year', `I'd have liked somebody to write back 'that sounds rubbish.' That's all.`)}`)),
      ch(`"Who'd know where it goes?"`, out(say('The second-year', `It says the Vice-Principal. There isn't a vice-principal. There's not been one for a year. It's still going to his inbox.`))),
    ]),
  ev('ps-green-form-reply', 'The Green Form', 'Evil Teams', { requires: [...ps(2), flagIs('star-form-sent'), flagIs('star-form-found', 0, 0)], cast: [CLAVELL], tint: SCHOOL },
    `A second reply. Not automatic. Sent at ten to three in the morning. "I am so sorry. I have only this week discovered where this form delivers. There are, I find, sixty-three unread. I am reading every one. Yours is the first I have answered. That sounds rubbish, and I should like to hear more. — C. (Director. Not Clive.)"`,
    [ch('Read it again.', out(`From then on, the green button works. The second-year gets a reply the same night. It says: "That sounds rubbish."`, ...kind(1), flag('star-form-found')))]),
];

// PS2. Forty Desks (the Academy, Homeroom 1-G)
const DESKS = ev('ps-forty-desks', 'Forty Desks', 'Evil Teams', { requires: ps(2), cast: [JACQ], tint: SCHOOL },
  `A classroom. Morning. Forty desks. Nobody at them. A teacher in a lab coat at the front, with a register, reading aloud. ${say('Mr. Jacq', `Fenwright, Odin.`)} Silence. ${say('Mr. Jacq, making a mark', `Lightfoot, Yusuf. ...Ah. No. Here, as of Thursday. Good.`)} A different mark. He sees you. He isn't embarrassed. ${say('Mr. Jacq', `I take it every morning. Forty names. I was told to stop. I was told to put a line through the room. I found I couldn't.`)} ${say('Mr. Jacq', `There's a code for 'absent' and a code for 'present.' I've made one up. I put 'O.' For outside. It's not in the handbook. But 'absent' means they're not doing the work, and I've reason to think they are.`)}`,
  [
    ch('"Why keep the desks?"', out(say('Mr. Jacq', `The site manager wanted the room for storage. I said: those are assigned. He said, to whom? I read him the register. He went away.`), flag('star-desks-kept'))),
    ch('"What reason?"', out(say('Mr. Jacq', `I can't prove it. But there's a janitor who knows my students' handwriting better than I do, and he once told me Fenwright's quadratics were coming on. Where would he have seen them?`), flag('star-desks-kept'))),
    ch('"Did you teach them?"', out(say('Mr. Jacq', `Science. Every Tuesday. I still have the Tuesday.`), flag('star-desks-kept'))),
    ch('Lift a lid.', out(`In each desk, whatever was left, eighteen months ago. A pencil case. A half-eaten pack of mints, fossilised. In one: a helmet. Small. An early one. The star's on crooked. ${say('Mr. Jacq', `That's the first. He made it in my lesson. Under the desk. I pretended not to see. It was the only thing I did that year that was any use.`)}`, flag('star-desks-kept'))),
  ]);

// PS3. The Shed (a garden on the edge of Mesagoza; a + node)
const SHED = ev('ps-the-shed', 'The Shed', 'Evil Teams', { requires: ps(2), cast: ['trainer.pr/rich_m'], tint: '#1e2a1a' },
  `A very large lawn. A very small shed at the bottom of it. A gardener with a wheelbarrow, who's stopped. ${say('The gardener, Señor Basilio Montoya', `The young master's shed. I'm not to touch it. His father thinks it's for croquet.`)} Inside: a workbench. A hairdryer, melted at the nozzle. A scorch on the ceiling, in the shape of a flower, and it's pink. ${say('Señor Montoya', `Six of them. Every day after school, for a month. I'd bring lemonade. They'd stop talking when I came in. Not rudely. Like people who'd got used to stopping.`)} ${say('Señor Montoya', `Then one evening: whoomp. The whole garden lit up pink. And screaming. I ran. I thought they'd been hurt.`)} ${say('Señor Montoya', `They were laughing. All six. On the lawn, on their backs. I'd not heard one of them laugh in the month. The little one with the fox bag was laughing so hard she'd the hiccups.`)} On the bench: six mugs. One's got a fox on. It's been washed. He washes it every week.`,
  [
    ch('"Does his father know?"', out(say('Señor Montoya', `He knows his son's 'not attending.' He's had letters. He thinks it's a phase. He's offered to ring someone. The boy said: don't you dare. I heard it through the hedge. 'Don't you dare fix it. It's ours.'`), intel(3), flag('star-lore-shed'))),
    ch(`"What was it, that went whoomp?"`, out(say('Señor Montoya', `I don't know. Something with wheels, and the hairdryer. It came out pink. They named it.`), intel(3), flag('star-lore-shed'))),
    ch('"Did they come back?"', out(say('Señor Montoya', `Once. All six. The night before the— before the yard. They wrote something. On the back of a school form. They each signed it. Then the little one left on a ferry and the shed's been shut since.`), intel(3), flag('star-lore-shed'))),
  ]);

// PS4. Use Your Words (a café in Mesagoza)
const WORDS: Json[] = [
  ev('ps-use-your-words', 'Use Your Words', 'Evil Teams', { requires: ps(2), cast: ['boss.drive/paldean-sv-waitress'], tint: TOWN },
    `A counter. A woman making coffee with great care, as if it might be marked. ${say('The café\'s owner, Señora Jimena Carrasco', `I was the Academy's counsellor. Two years ago. I'd a room with beanbags. I was very well trained.`)} ${say('Señora Carrasco', `A girl came. First-year. Enormous backpack; a fox. She sat on a beanbag for forty minutes and didn't say a word. I said what you're taught to say. 'Use your words.' 'I can't help unless you tell me.'`)} ${say('Señora Carrasco', `She got up. She said, very politely, 'I did tell you. I filled in the form.' And she left. I didn't know what form. Nobody'd shown me a form. They went to the vice-principal.`)} ${say('Señora Carrasco', `I've thought about that every day. She'd used her words. Forty-one times, I found out later; the whole room had. And then she came and sat with me, to see if a person'd do better than a form, and I asked her to do it again.`)}`,
    [
      ch('"What should you have said?"', out(say('Señora Carrasco', `Nothing. I should've sat on the other beanbag and said nothing for forty minutes. She wasn't there to talk. She was there to see if anyone'd stay.`))),
      ch(`"Why'd you leave?"`, out(say('Señora Carrasco', `Everyone left. That summer. It was suggested. I didn't know why until I saw the ranking.`))),
      ch(`"She's by the fountain, most evenings."`, out(`Señora Carrasco takes off her apron. She makes a hot chocolate. She puts it in a paper cup.`, room('ps-use-your-words-bench')), { requires: [{ kind: 'anyFlag', keys: ['star-penny-confided', 'star-penny-known', 'star-penny-trusted'] }] }),
    ]),
  ev('ps-use-your-words-bench', 'The Bench', 'Evil Teams', { room: true, cast: [PENNY, 'boss.drive/paldean-sv-waitress'], pokemon: 'eevee', tint: '#141424' },
    `The bench. A hood. A woman sits down at the other end. She puts a cup between them. She doesn't say anything. Forty minutes.`,
    [ch('Wait.', out(`${say('Penny, at the end of it, to the fountain', `...You stayed.`)} ${say('Señora Carrasco', `I'm late. I'm eighteen months late.`)} ${say('Penny', `Yeah.`)} She takes the cup. ${say('Penny', `It's gone cold.`)} She drinks it.`, ...kind(1), flag('penny-stayed-with')))]),
];

// PS5. Outstanding (an education office; a + node)
const OUTSTANDING = ev('ps-outstanding', 'Outstanding', 'Evil Teams', { requires: ps(2), cast: ['boss.drive/paldean-sv-office-worker-woman'], tint: TOWN },
  `A desk. A framed certificate. A woman with a red pen and a stack of school files. ${say('The inspector, Doña Remedios Valverde', `The Academy? I graded it. Eighteen months ago. Outstanding. I remember, because it was the only school that year with nothing in the incidents column. Not a line.`)} ${say('Doña Valverde', `I thought: how lovely. I wrote that. 'A notably harmonious community.' It's in the report.`)} ${say('Doña Valverde', `I've inspected two hundred schools. Do you know how many have no incidents? In a building with a thousand children?`)} She puts the pen down. ${say('Doña Valverde', `None. There's always something. A fight. A lost coat. Nought isn't harmony. Nought's a column that's been cleaned.`)} ${say('Doña Valverde', `I knew that. I've known it thirty years. And I looked at a nought and I wrote 'how lovely,' because it was a Friday and the vice-principal'd been charming and there was a train.`)}`,
  [
    ch('"Can a grade be withdrawn?"', out(say('Doña Valverde', `Corrected. Nobody's ever asked me to.`))),
    ch('"What would you have asked?"', out(say('Doña Valverde', `'Who mops your floors?' I always ask. The caretaker knows more than the head. I didn't ask, that time. I'd a train.`))),
    ch('"He deleted forty-one."', out(`She's very still. ${say('Doña Valverde', `...In one night?`)} "Nineteen minutes." She pulls a file. She opens it. She takes the red pen. ${say('Doña Valverde', `Then I've a correction to issue. It's eighteen months late. It'll say: 'Not inspected. The inspector did not look.'`)} By the next stage, the Academy's ranked "Not Inspected." The Director, reading it: ${say('The Director', `Good. That's the first honest thing on the file.`)}`, flag('star-ranking-withdrawn'))),
  ]);

// PS6. The Ferry (a ferry terminal on Paldea's coast)
const FERRY = ev('ps-the-ferry', 'The Ferry', 'Evil Teams', { requires: ps(2), cast: ['trainer.pr/waiter_m'], tint: '#1e3040' },
  `A boat. A steward with a tray, on his break, by the rail. ${say('The steward, Señor Fermín Olmedo', `The Galar run. Eleven hours. You see all sorts. I remember one, though. A year and a half back. A girl. Fourteen, maybe. By herself; her father'd put her on and gone.`)} ${say('Señor Olmedo', `She sat at that table. The one bolted by the window. She'd a laptop. She typed the whole crossing. Eleven hours. And she cried the whole crossing. Not loud. Just: it ran down, and she kept typing.`)} ${say('Señor Olmedo', `I brought her a tea. She said thank you. I brought her another at midnight. She said, 'I'm writing the rules so they'll be all right without me.' I said, who? She said, 'Forty people.' I said, that's a lot of people to be all right. She said, 'That's why it's taking eleven hours.'`)}`,
  [
    ch('"What was she typing?"', out(say('Señor Olmedo', `I didn't look. It wasn't mine to look at.`), flag('star-lore-ferry'))),
    ch('"Did she come back?"', out(say('Señor Olmedo', `Three months on. Same table. She didn't type. She looked at the sticker for eleven hours.`), flag('star-lore-ferry'))),
    ch('"Is the table still there?"', out(`Under it, where a hand would rest: a sticker. A star. Five points. Peeling. ${say('Señor Olmedo', `She left that. I've not let them scrape it off.`)}`, flag('star-lore-ferry'))),
  ]);

// PS7. Mrs. Lightfoot's Pot (a house in Mesagoza)
const POT = ev('ps-lightfoot-pot', `Mrs. Lightfoot's Pot`, 'Evil Teams', { requires: ps(2), cast: ['boss.drive/galarian-swsh-mom'], tint: TOWN },
  `A kitchen. A pot the size of a drum. A woman stirring it with both hands. ${say('Mrs. Lightfoot', `It's the thing with the beans. My mother's. It's for Yusuf. He's up on that hill with his cousin.`)} It's a great deal of beans for a boy of thirteen. ${say('Mrs. Lightfoot', `I know what you're thinking. I'm not a fool. I know he's not eating all of this. There's forty of them. I've counted the tents from the road.`)} ${say('Mrs. Lightfoot', `The school says they're delinquents. I went up, the first week, to fetch him home. There was a girl on a lorry, shouting at a first-year. I thought: there, you see. Then I listened. She was shouting, 'Have you had a hot meal today?'`)} ${say('Mrs. Lightfoot', `I came home and I got the big pot down.`)}`,
  [
    ch('"Does Yusuf know it\'s for all of them?"', out(say('Mrs. Lightfoot', `He knows. He's not daft.`))),
    ch(`"I'll carry it."`, out(`A pot, up a hill. ${say('Mela, at the top, looking in', `That's— who's this from?`)} "Yusuf's mum." ${say('Mela', `For Yusuf?`)} "She counted the tents." Mela doesn't say anything. She gets forty bowls. There's one for you. From the next stage, there's a second pot. And a third. Three mothers. They've started a rota. None of them's told the school.`, heal(0.25), bondUp(1), ...kind(1), flag('star-pot'))),
    ch('"What do you want for him?"', out(say('Mrs. Lightfoot', `For him to do his volcano. And for the forty to be fed while he decides. Both. I don't see why I've to choose.`))),
  ]);

// PS8. The Wrong Boots (Mesagoza, a cobbler's; at world state 4, or after The Old Hallway)
const BOOTS: Json[] = [
  ev('ps-wrong-boots', 'The Wrong Boots', 'Evil Teams', { requires: [...ps(2), { kind: 'track', atLeast: 4 }], cast: [ZEB, 'trainer.pr/clerk_m'], tint: TOWN },
    `A workshop. Lasts on the wall. A boy of fourteen, in a boiler suit, arguing with a man in an apron. ${say('Captain Zeb', `Thirty pairs. Black. Steel toe. Who bought them?`)} ${say('The cobbler, Maestro Leandro Quiroga', `I don't discuss customers.`)} ${say('Captain Zeb', `They're wearing our helmets! They've got our star on! But they've got your boots, and we don't wear those; we wear whatever we've got. Mela's are her dad's. Eri's are two different sizes!`)} ${say('Maestro Quiroga, slowly', `...Somebody's dressing up as children?`)}`,
    [
      ch('"Who paid?"', out(`${say('Maestro Quiroga', `A gentleman. Silver hair. Cash. He said they were for a 'school production.'`)} He looks at the boy. At his boots: one's got tape round it. ${say('Maestro Quiroga', `He asked me to scuff them. I did. I'm good at scuffing. I thought it was for the stage.`)}`, room('ps-wrong-boots-q'))),
      ch(`"What's wrong with the boots?"`, out(`${say('Zeb', `Nothing! That's what's wrong! They match!`)}`, room('ps-wrong-boots-q'))),
      ch('"Show him yours, Zeb."', out(`Zeb puts a boot on the counter. Tape, and string, and a toe that's been mended twice. Maestro Quiroga looks at it for a long time.`, room('ps-wrong-boots-q'))),
    ]),
  ev('ps-wrong-boots-q', 'The Wrong Boots', 'Evil Teams', { room: true, cast: [ZEB, 'trainer.pr/clerk_m'], tint: TOWN },
    `Maestro Quiroga does one thing. He goes to a drawer. A die-stamp. A small one. ${say('Maestro Quiroga', `I mark my work. Inside the heel. Nobody looks.`)} He shows it: a tiny Q. ${say('Maestro Quiroga', `Thirty pairs. Every one. You want to know who's not yours? Take the boot off.`)}`,
    [ch('Take the stamp to heart.', out(`In every ending, a Cipher Peon in a Star helmet can be told at a glance. In the climax, no ambush by "Star Grunts" can surprise you.`, intel(5), flag('star-boots')))]),
];

// PS9. The Box (the Academy, a janitor's cupboard; a + node, at Night)
const BOX: Json[] = [
  ev('ps-the-box', 'The Box', 'Evil Teams', { requires: [...ps(3), night], cast: [UPSHAW], tint: '#1a1a14' },
    `A door marked CLEANING. A bulb on a string. Mops. A kettle. A box that held floor polish, with a lid. ${say('Mr. Bertrand Upshaw', `You'll be wanting the lost property. It's the other door.`)} You don't go. ${say('Mr. Upshaw', `...No. You've the look of somebody who's come to ask. Have you? I'll not get my hopes up.`)}`,
    [
      ch(`"What's in the box?"`, out(`He takes the lid off. Folders. Seventy-one. In date order. A name on each sheet, top right. ${say('Mr. Upshaw', `Under the staffroom door. Fridays. I'd nowhere to send it. It's schoolwork. You don't bin schoolwork.`)}`, room('ps-the-box-light'))),
      ch('"Were you here? Eighteen months ago?"', out(`${say('Mr. Upshaw', `Aye.`)} He doesn't tell it all, here. That's for a yard, and a Director. He tells one thing.`, room('ps-the-box-light'))),
      ch(`"Nobody's asked you. Have they."`, out(`He sits down on an upturned bucket. He's been standing for a year and a half. ${say('Mr. Upshaw', `No. I thought somebody would. The old lot went in a summer. The new lot came in the autumn. Nobody was here for both but me and the building.`)}`, room('ps-the-box-light'))),
    ]),
  ev('ps-the-box-light', 'The Box', 'Evil Teams', { room: true, cast: [UPSHAW], tint: '#1a1a14' },
    `${say('Mr. Upshaw', `There was a lad ate his lunch in my boiler room. A whole term. Big lad; you'd think he'd nothing to fear. I never said a word to him. I left the light on. I've thought, since: I should've said a word.`)}`,
    [ch('"The light was the word."', out(`${say('Mr. Upshaw', `...Was it.`)} He lends you one folder: Odin's.`, ...kind(1), flag('upshaw-seen'), flag('odin-folder')))]),
  ev('ps-box-jacq', `Fenwright's Folder`, 'Evil Teams', { requires: [...ps(3), flagIs('odin-folder'), flagIs('odin-marked-green', 0, 0)], cast: [JACQ], tint: SCHOOL },
    `You've Odin's folder, lent from a box that held floor polish. Mr. Jacq's at his desk.`,
    [ch('Hand it to Mr. Jacq.', out(`He marks it at his desk, in forty minutes, in green.`, flag('odin-marked-green')))]),
];
(BOX[0] as Json).remembers = [{ id: 'ember', when: [flagIs('ember-founded')], notice: `On the box, a postcard. From a cleaner in Kalos: "We just didn't do Tuesday." He's put it on the box.` }];

// PS10. Radical (outside any Star base; after Clive)
const RADICAL = ev('ps-radical', 'Radical', 'Evil Teams', { requires: [...ps(3), { kind: 'eventSeen', id: 'xe.paldea.clive' }], cast: [CLAVELL, ODIN], tint: TOWN },
  `A car park. Three Star Grunts. A skateboard. A sixty-year-old man in a pompadour wig, lying on the tarmac. ${say('Clive, from the ground', `I am— fine. That was a 'wipe-out.' As we say.`)} A Grunt: "You've got to bend your knees, Clive." ${say('Clive', `My knees have not bent since the previous administration.`)} They pick him up. They put him back on. One holds each arm. They've clearly done this before. Another Grunt, to you, behind a hand: "We know. Everyone knows. He's trying, though. Nobody old's ever tried."`,
  [
    ch('(Hold the board.)', out(`A man, a board, ten feet. He does it. Ten feet. He doesn't fall. ${say('Clive', `Radical!`)} Three Grunts: "YEAH, CLIVE!" He's sixty. Nobody's cheered him since his appointment. He gives you a detention slip, blank, signed: "For use at your discretion. I find I've stopped issuing them."`, ...kind(1), flag('star-clive-friend'), flag('clive-slip')), {
      prompt: prompt(STEALTH), fail: out(`A man, a board, ten feet. He wobbles at six. You hold the board. He does it. ${say('Clive', `Radical!`)} Three Grunts: "YEAH, CLIVE!" He's sixty. Nobody's cheered him since his appointment. He gives you a detention slip, blank, signed: "For use at your discretion. I find I've stopped issuing them."`, ...kind(1), flag('star-clive-friend'), flag('clive-slip')),
    }),
    ch('"Why skateboards?"', out(say('Clive', `I asked my secretary what the young people enjoy. She said skateboards. I've since been told that was true in her day.`))),
    ch('"Clive. What have you learned?"', out(`He stops trying to balance. He sits on the kerb. The wig's slipped. ${say('Clive', `That they do their homework. That they've a timetable. That they feed each other. That when I fell, three of them ran. I came to find delinquents. I've found the best-run house in my school, and it's in a car park.`)}`)),
  ]);

// PS11. The Third One (a bus stop on a Paldea road; needs Tully cracking, from The Old Hallway)
const THIRD: Json[] = [
  ev('ps-third-one', 'The Third One', 'Evil Teams', { requires: [...ps(4), flagIs('star-tully-cracking')], cast: [TULLY], tint: '#202028' },
    `A shelter. A boy of seventeen in a uniform that's a size too new, with a badge in his hand, not on. ${say('Tully', `I'm waiting for the van. They pick us up here. Brask and Odette went on ahead; they like to be first.`)} ${say('Tully', `I got a job. That's what you do, isn't it. After school. He found us one. Mr. Harrow. He said we'd 'shown initiative.'`)} ${say('Tully', `I didn't show initiative. I showed up. That's all I ever did. They'd say 'come on' and I'd come on. I never thought of one thing we did. I never said one of the things. I just stood there so it was three.`)}`,
    [
      ch(`"Three's what made it work."`, out(`He flinches. ${say('Tully', `...Yeah. Two's a couple of idiots. Three's a crowd. I was the difference between two and three. I've worked that out. It took me a year and a half.`)}`, room('ps-third-one-van'))),
      ch('"Why not walk away?"', out(`${say('Tully', `From a van? To where? I left school. I've a reference from a man who's wanted by the—`)} He stops. ${say('Tully', `I don't even know who he's wanted by.`)}`, room('ps-third-one-van'))),
      ch(`"What's the badge for?"`, out(`He turns it over. ${say('Tully', `You wear it in the van. That's all I know.`)}`, room('ps-third-one-van'))),
    ]),
  ev('ps-third-one-van', 'The Third One', 'Evil Teams', { room: true, cast: [TULLY], tint: '#202028' },
    `The van comes round the bend.`,
    [
      ch('(Say nothing.)', out(`He gets in.`, flag('tully-van'))),
      ch(`"There's a bus, too."`, out(`There is. It's behind the van. It goes to Mesagoza. He looks at one. At the other. He gets on the bus. He puts the badge in the bin by the shelter. It's the first decision he's made.`, ...kind(1), flag('tully-bus'), flag('tully-note'))),
      ch(`"Write it down. What you did. Put your name on it."`, out(`He's got a pen. ${say('Tully', `Who'd I give it to?`)} "There's a green form." He fills it in on his phone, at a bus stop. It's the forty-third. It's the first one from that side.`, ...kind(1), flag('tully-wrote'), flag('tully-note'))),
    ]),
];

// PS12. Under the Door (the staffroom corridor; three visits, stages 5 to 8)
const DOOR: Json[] = [
  ev('ps-door-1', 'Under the Door', 'Evil Teams', { requires: ps(3), cast: [TYME], tint: SCHOOL },
    `A door. A gap under it, about the width of a folder. A Friday. A folder, half under. A teacher's stepped over it, coffee in hand, and gone in. Then another. They've been stepping over it for seventy Fridays; it's part of the floor.`,
    [
      ch('Pick it up. Knock.', out(`It's Ms. Tyme. Maths. ${say('Ms. Tyme', `Whose is— oh. These are good. Who set this?`)} "You did. It's your scheme of work."`, flag('star-door-1'))),
      ch('Step over it.', out(`It's part of the floor.`)),
    ]),
  ev('ps-door-2', 'Under the Door', 'Evil Teams', { requires: [...ps(4), flagIs('star-door-1')], cast: [ODIN], tint: SCHOOL },
    `The next Friday. The folder's there. And beside it, pushed out the other way: last week's. Marked. In red. "7/10. Show your working on Q4. — T."`,
    [ch('Carry it up a hill.', out(`${say('Odin, holding it', `Seven. Out of ten. Somebody's given me a seven.`)} He's never been so happy to lose three marks. ${say('Odin', `Show my working. Right. Right.`)}`, flag('star-door-2')))]),
  ev('ps-door-3', 'Under the Door', 'Evil Teams', { requires: [...ps(5), flagIs('star-door-2')], cast: [TYME], tint: SCHOOL },
    `A Friday. Two piles. One going in. One coming out. And a note on the door, in six hands: "Please use the pigeonholes. — The Staff." There are forty new pigeonholes. Each has a name. ${say('Ms. Tyme, in the corridor, to nobody in particular', `They were never absent. I've been marking 'absent' for a year and a half for the most punctual class I've ever taught. They've handed in every Friday. I never showed up.`)}`,
    [ch('Nothing. It\'s working.', out(`In every ending, the forty have marks.`, ...kind(1), flag('star-door')))]),
];
// The Academy, overheard (FULL_3 D).
(DOOR[0] as Json).remembers = [
  { id: 'nothing', when: [flagIs('star-form-found', 0, 0), flagIs('star-flag-raised', 0, 0)], notice: `A first-year, passing: "Team Star? Delinquents. It was in a report."` },
  { id: 'form', when: [flagIs('star-form-found')], notice: `A first-year, passing: "I got a reply. From the Director. At three in the morning. He said it sounded rubbish. It does sound rubbish!"` },
  { id: 'flag', when: [flagIs('star-flag-raised')], notice: `A first-year, passing: "There's a star on the hill. You can see it from Maths."` },
];
(DOOR[1] as Json).remembers = [{ id: 'canteen', when: [flagIs('star-canteen')], notice: `A first-year, passing: "There was one of them in here. He had chips. He looked sort of normal."` }];
(DOOR[2] as Json).remembers = [{ id: 'night', when: [{ kind: 'evil', team: 'star', after: 6, anyRoute: true }], notice: `A first-year, at a dormitory window, in pyjamas, to another: "Are you going down?" "...Are you?"` }];

export const EVENTS: Json[] = [...FORM, DESKS, SHED, ...WORDS, OUTSTANDING, FERRY, POT, ...BOOTS, ...BOX, RADICAL, ...THIRD, ...DOOR];
export const REMOVE: string[] = [];
