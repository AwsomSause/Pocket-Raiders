// Catalog Overhaul Pack, row 9: Unova, Team Plasma from inside (TEAM_PLASMA_UNOVA_FULL_1 parts B, the three corrections;
// EVIL_TEAMS_VOLUME_3_B and _D "Unova"). The Offer (N's, for himself), the five Acts, and the Vigil's loyalty test and
// being found out. The Coronation, the four endings and Team Open Hand are in -5; the Operations, the Watch, Collections,
// the King's Room, the Table and the twelve scenes for any player in -6. The engine is row 8's (core/evil/inside.ts).
// The Vigil gives no codename: the player is "Listener," and later, to the Sages, "the Seventh."
import { ch, ev, fight, flag, flagIs, inRegion, out, room, trainer, type Json } from '../dsl.ts';
import { evil as story, foe } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-hoenn-sinnoh-unova';

const P = teamJson('plasma');
export const GRUNT = P.ranks.grunt.sprite;
export const SAGE = P.ranks.executive.sprite;
export const BOSS = P.ranks.leader.sprite;
export const COLRESS = P.ranks.specialist.sprite;
export const N = 'boss.n';
export const KNIGHT = 'trainer.pr/plasma_grunt_m';
export const OLD = 'boss.npc_lady';
export const TINT = P.color;
export const WHITE = '#e8e4d8';
export const CANDLE = '#3a2a18';
export const say = (who: string, line: string): string => `${who}: "${line}"`;
/** Plasma is the region's team, and the run is in Unova. */
export const px = (o: Json = {}): Json[] => [{ kind: 'evil', team: 'plasma', ...o }, inRegion('unova')];
export const inside = (o: Json = {}): Json[] => px({ inside: true, ...o });
export const mark = (m: string): Json => story({ mark: m });
export const meters = (standing: number, suspicion = 0, rank?: number): Json => story({ ...(standing ? { standing } : {}), ...(suspicion ? { suspicion } : {}), ...(rank ? { rank } : {}) });
export const beat = story({ beat: true });
export const intel = (n: number): Json => flag('intel', n);
export const night: Json = { kind: 'period', in: ['night'] };
export const once = (k: string): Json => flagIs(k, 0, 0);

// ---------- The Offer (Unova stage 2, after Accumula's Speech) ----------
const OFFER = `${say('N, speaking fast, not quite looking at you', `Your Pokémon just said something. Did you hear? No. Nobody does. It said it wasn't afraid of you. That's rare. I've listened to four hundred. Eleven said that.`)} ${say('N', `I can't go back in. They'd kneel. I'd say "get up" and they'd take it for a blessing. But I need to know what they're for, now. What he's made of them. Would you go? You'd be my ears. It's the only part of me that was ever any use.`)} ${say('N', `If you come out thinking I was wrong to leave, I'll listen. I always listen.`)}`;
const offered = flag('plasma-offered');
const yes = ch('"Yes."', out(`${say('N', `Then listen. That's all. Don't decide anything for me.`)} He's gone before you can ask where to. You're going into Team Plasma, on the inside, as N's ears, and nobody outside knows it.`, mark('inside'), offered));
const no = ch('"No."', out(`${say('N', `That's an answer. I'll write it down. People don't often give me one.`)} Team Plasma's story goes on as it was, with you on the outside of it.`, flag('plasma-offer-refused'), offered));
const offer: Json[] = [
  ev('evil-plasma-offer-unova', 'The Offer', 'Evil Teams', { room: true, cast: [N], tint: TINT, effect: 'glint' }, OFFER, [
    yes, no,
    ch('"What did the other three hundred and eighty-nine say?"', out(`He stops. ${say('N', `...Mostly: "I'm hungry." Some: "Don't." I think about the "don't"s.`)}`, flag('plasma-dont'), room('evil-plasma-offer-unova-2'))),
  ]),
  ev('evil-plasma-offer-unova-2', 'The Offer', 'Evil Teams', { room: true, cast: [N], tint: TINT, effect: 'glint' }, say('N', `Would you go?`), [yes, no]),
];

// ---------- Act 1. A Dog at a Fence (stage 3, the town) ----------
const act1: Json[] = [
  ev('px-act1', 'A Dog at a Fence', 'Evil Teams', { callback: true, requires: inside({ beat: 2 }), cast: [KNIGHT], pokemon: 'chandelure', tint: CANDLE, effect: 'none' },
    `A hillside with a castle coming out of it. Scaffolding. Wet stone. Six hundred people in white, with candles, digging by hand. ${say('A Knight, at the gate, holding out an open hand, flat and low', `Welcome, Listener. That's what you're called till you've heard something. It's not a rank. It's a state.`)} A Chandelure overhead, burning steadily: the Vigil's Votive. It's never gone out. Somebody's always awake to see it doesn't. The oath is one line, and you say it: "I'll not hold what hasn't chosen me." ${say('The Knight', `You'll be asked to prove it. Not today. We don't ask it of Listeners. But you'll see it done, at dusk, and you'll know what you're walking toward.`)}`,
    [ch('(Go down to the dormitory.)', out(`A vaulted room. Two hundred pallets. A window at ground level that looks out at boots.`, room('px-act1-dorm')))]),
  ev('px-act1-dorm', 'The Lower Dormitory', 'Evil Teams', { room: true, cast: [KNIGHT], tint: CANDLE },
    `${say('Yara Fairchild, twenty, folding a tabard with great care', `You're beside me. I'm Yara. I'm a Knight; I did mine in spring.`)} ${say('Yara', `A Lillipup. I'd had her from an egg. He said: "Did she choose you, or were you just there first?" And I couldn't say. So I knelt.`)} ${say('Yara', `It was the right thing. He said. She's free now. I go on Sundays. She comes to the fence. She thinks I'm coming back for her.`)} She's very steady about it. ${say('Yara', `She's free. That's what free looks like. It looks like a dog at a fence.`)}`,
    [
      ch('"Do you miss her?"', out(say('Yara', `That's not the question. The question's whether she's better. I'm not supposed to count.`), flag('ally-yara'), room('px-act1-dusk'))),
      ch('"Has anyone asked her?"', out(`${say('Yara', `The king could've. He's away. They say when he's back he'll walk every field and tell us what they said.`)} A pause. ${say('Yara', `I think about what she'll have said.`)}`, flag('ally-yara'), room('px-act1-dusk'))),
      ch('"You could bring her home."', out(`She folds the tabard again. It was already folded. ${say('Yara', `Then I'd be someone who took it back. I'd have done it for nothing. Don't say that to me again, please.`)}`, flag('ally-yara'), flag('plasma-yara-home'), room('px-act1-dusk'))),
    ]),
  ev('px-act1-dusk', 'The Release', 'Evil Teams', { room: true, cast: [SAGE, KNIGHT], pokemon: 'tepig', tint: '#5a3a28' },
    `Dusk. You watch from the fence line. A boy of sixteen, a Tepig. ${say('Sage Gorm, sonorous', `It was never yours.`)} ${say('The boy', `I'll not hold what hasn't chosen me.`)} He stands. He turns. He walks. He doesn't look back; that's the rule. The Tepig trots after him. It gets to the fence. It puts its nose through. You're the only one facing that way.`,
    [
      ch('(Watch it.)', out(`The Tepig sits. It watches the boy to the top of the hill.`, flag('plasma-saw-fence'), room('px-act1-night'))),
      ch('(Look away, like the others.)', out(`That's what a Knight does.`, meters(1), room('px-act1-night'))),
      ch('(Hold out an open hand. Flat. Low.)', out(`The old gesture. The Tepig looks at it. It comes over. It sniffs. It looks back at the hill. It stays with you till the candle's lit. ${say('Sister Ianthe, behind', `Where did you learn that? That's the old way. That's what it was for.`)}`, meters(0, 1), flag('plasma-oldway'), flag('plasma-saw-fence'), room('px-act1-night'))),
    ]),
  ev('px-act1-night', 'The Lower Dormitory', 'Evil Teams', { room: true, cast: [OLD], tint: '#2a2018' },
    `Night. A lamp at the far end. An old woman in the old white, mending. ${say('Sister Ianthe Moncrieff', `I tend the king's room. It's being dug out; they've found the door. I was his nurse. I'm told that's an honour. I'll tell you what it was, when I know you.`)} End of Act 1: a white hood. A candle. A collecting tin, with your name on it.`,
    [ch('(Take the hood.)', out(`It's warm from the last person. Somebody's always awake.`, meters(0, 0, 2), flag('plasma-inside-act1'), flag('plasma-tin'), beat))]),
];

// ---------- Act 2. The Wrong House (stage 4, instead of the battle) ----------
const signature = `${say('Emil', `"Z." Zinzolin.`)} He takes a folded bundle from inside his tabard. He's been keeping them. ${say('Emil', `That's the fourth this month. A Vanillite with a gold sheen. An Axew, "unusually large." An Eevee.`)} A pause. ${say('Emil', `None of them said "neglected." I read "neglected." I read it because it's what I came here to read.`)}`;
const act2: Json[] = [
  ev('px-act2', 'The Wrong House', 'Evil Teams', { callback: true, requires: inside({ beat: 3 }), cast: [KNIGHT], tint: '#4a5a48', effect: 'none' },
    `A lane in Striaton. Washing on a line. A white-hooded man of forty checking an address against a paper, twice. ${say('Emil Hawksmoor', `You're the Listener. Emil. I was nineteen years an orderly at a Center. D'you know what an orderly does? He patches them up and hands them back. To the same people. "He fell." "She's clumsy." I've handed back a Herdier three times to a man who called it clumsy.`)} ${say('Emil', `I'm done handing them back. So. A visit. The order says: neglected Pansage. Number nine.`)}`,
    [ch('(Number nine.)', out(`A front garden. A gate with a child's wellingtons beside it.`, flag('ally-emil'), room('px-act2-nine')))]),
  ev('px-act2-nine', 'Number Nine', 'Evil Teams', { room: true, cast: [KNIGHT, KNIGHT], pokemon: 'pansage', tint: '#4a5a48' },
    `On the windowsill, in the sun: a Pansage. Fat. Asleep. It's got a ribbon on. Taped to the glass above it: a drawing, in crayon, of a green thing with a ribbon on. BEST FREND. ${say('Emil', `...This isn't the house. It can't be. Check the address.`)} It's the address. ${say('Yara', `It could be— appearances. He says we can't tell from outside.`)} ${say('Emil', `I've nineteen years of telling from outside. That's a Pokémon that's never missed a meal or been shouted at. Look at its ears.`)} You have the order. "Liberation Order 114. Pansage, juvenile, unusual colouring. PRIORITY. — Z."`,
    [
      ch('"Take it. Orders."', out(`A child's face at the window. The screen cuts to the lane, and Emil standing in it with a carrier, not moving. Emil doesn't speak for the rest of the stage.`, meters(2), flag('plasma-pansage-taken'), room('px-act2-van'))),
      ch('"Leave it. Tell them the house was empty."', out(`"The house was empty." ${say('Emil, to the windowsill', `Stay fat.`)}`, meters(0, 1), flag('plasma-pansage-left'), room('px-act2-van'))),
      ch('"Whose signature is that?"', out(`${signature} It's the first thread.`, flag('plasma-orders-seen'), intel(2), room('px-act2-nine-2'))),
    ]),
  ev('px-act2-nine-2', 'Number Nine', 'Evil Teams', { room: true, cast: [KNIGHT, KNIGHT], pokemon: 'pansage', tint: '#4a5a48' },
    `The Pansage sleeps on. The order's still in your hand.`,
    [
      ch('"Take it. Orders."', out(`A child's face at the window. The screen cuts to the lane, and Emil standing in it with a carrier, not moving. Emil doesn't speak for the rest of the stage.`, meters(2), flag('plasma-pansage-taken'), room('px-act2-van'))),
      ch('"Leave it. Tell them the house was empty."', out(`"The house was empty." ${say('Emil, to the windowsill', `Stay fat.`)}`, meters(0, 1), flag('plasma-pansage-left'), room('px-act2-van'))),
    ]),
  ev('px-act2-van', 'The Van', 'Evil Teams', { room: true, cast: [GRUNT, GRUNT], tint: '#2a2a30' },
    `As you leave: a black van at the end of the lane. Two of the Crew, leaning on it. ${say('A Crew Grunt, to the white hoods, amused', `All right, candles? Got it?`)} ${say('Emil', `Who are you?`)} ${say('The Crew Grunt', `Collections. You lot do the crying, we do the lifting. It's a system.`)} He looks at your empty hands. ${say('The Crew Grunt', `No? Never mind. We'll come back when you've gone. We've a key.`)} ${say('Yara', `A key to what?`)}`,
    [
      ch('(Stand in the gate.)', fight(`Two of the Crew, and they don't expect a white hood to stand anywhere.`, { ...trainer('Crew Grunts', { sprite: GRUNT, team: ['liepard', 'scrafty', 'watchog'], size: 3, lv: 1, format: 'doubles',
        win: [flag('plasma-two-uniforms'), flag('plasma-van-fought'), flag('plasma-inside-act2'), meters(0, 0, 2), beat],
        lose: [flag('plasma-two-uniforms'), flag('plasma-inside-act2'), meters(0, 0, 2), beat] }), pseudo: true })),
      ch('"On whose order?"', out(`${say('The Crew Grunt', `Commander Aldith's. Who's yours? A candle?`)} He laughs. He gets back in the van. It doesn't leave.`, flag('plasma-two-uniforms'), flag('plasma-inside-act2'), intel(1), meters(0, 0, 2), beat)),
      ch('(Walk on.)', out(`Behind you, the van door slides. Emil doesn't look back. It's the rule.`, flag('plasma-two-uniforms'), flag('plasma-inside-act2'), meters(0, 0, 2), beat)),
    ]),
];
(act2[3] as Json).remembers = [{ id: 'aldith', when: [flagIs('plasma-van-fought')], notice: say('Commander Aldith, by radio, after', `Who was that? White hoods? Fighting us? Put it in the report as weather.`) }];

// ---------- Act 3. A Red Collar (stage 5, the Dreamyard: a door of four rooms) ----------
const ledger = (): Json[] => [flag('plasma-ledger'), flag('plasma-inside-act3'), meters(0, 0, 3), beat];
const MIST = `In the mist, going out, the Munna shows you one thing: a tall man with a cane, standing over a crate, saying nothing. It's what it shows everyone here. It's the only thing it's seen for a year. You take the ledger: the Dreamyard Ledger. Sixty rows. Sixty towns.`;
const act3: Json[] = [
  ev('px-act3', 'A Red Collar', 'Evil Teams', { callback: true, requires: inside({ beat: 4 }), cast: [KNIGHT, KNIGHT], pokemon: 'munna', tint: '#5a3a50', effect: 'fog' },
    `The Dreamyard. A ruined factory. A sign, new: RESETTLEMENT. NO ADMITTANCE TO KNIGHTS. Pink mist at ankle height. A Munna, watching. ${say('Yara', `"Resettlement." That's where they go after the fields. It's a good word. It means there's a place.`)} ${say('Emil', `It means there's a sign.`)}`,
    [ch('(The floor.)', out(`Past the sign.`, room('px-act3-floor')))]),
  ev('px-act3-floor', 'The Floor', 'Evil Teams', { room: true, cast: [SAGE], pokemon: 'lillipup', tint: '#5a3a50' },
    `Not a field. Not a forest. Crates. Stacked four high, in rows, with air holes. A stencil on each: a type, a level, a number. A Sage at a desk with a ledger. He's got a thick neck and a candle he hasn't lit. ${say('Sage Giallo, not looking up', `Knights aren't permitted. It says so on the sign. I had the sign made.`)} ${say('Yara', `That's— those are ours. The ones we freed. That's a Lillipup. That's—`)} She's stopped. ${say('Yara', `That's a Lillipup with a red collar.`)} It's seen her. Its whole back end's going. It's been in a crate since Monday, and its person's come, as it always knew she would. Nothing's hurt here, and nothing has been. They're fed. They're kept. They're being held for one man's army.`,
    [ch('(The ledger.)', out(`It's on the desk. Giallo's stood up.`, room('px-act3-ledger')))]),
  ev('px-act3-ledger', 'The Ledger', 'Evil Teams', { room: true, cast: [SAGE], tint: '#5a3a50' },
    `Columns. Date. Field. Species. "Released by." "Collected." "Assigned." Under "Assigned," in every row, the same word: Hold. The Frigate's hold.`,
    [
      ch('"Open them. All of them."', out(`Emil's beside you. It's the first time he's ever sent a Pokémon at a person.`, room('px-act3-giallo'))),
      ch('"Take hers. Only hers. Quietly."', out(`Emil knocks over the candle. Giallo turns. Yara's got the crate open and shut in the time it takes. She carries it under her tunic for the rest of the region. It doesn't make a sound. It's good at this. It's been waiting quietly since spring.`, meters(0, 1), flag('plasma-dreamyard-hers'), flag('plasma-lillipup'), room('px-act3-mist'))),
      ch('"Go to N. Now."', out(`Nothing's opened. You walk out. Act 4 comes early, and angrier. Yara looks back the whole way. It's the rule that she mustn't. She does.`, flag('plasma-dreamyard-left'), flag('plasma-act4-early'), room('px-act3-mist'))),
    ]),
  ev('px-act3-giallo', 'Room Four', 'Evil Teams', { room: true, cast: [SAGE], tint: '#5a3a50', effect: 'glint' },
    `${say('Sage Giallo', `I guard. It's all I've ever done. Step away from the crates.`)}`,
    [ch('Battle.', fight(`Sage Giallo doesn't light the candle.`, { ...trainer('Sage Giallo', { sprite: SAGE, team: ['conkeldurr', 'garbodor', 'bisharp'], size: 3, lv: 1,
      // Win: sixty Pokémon go into the Dreamyard, and the Munna's mist covers them. Suspicion +4.
      win: [story({ suspicion: 4 }), flag('plasma-dreamyard-opened'), flag('plasma-lillipup'), ...ledger()],
      lose: [flag('plasma-dreamyard-left'), ...ledger()] }), pseudo: true }))]),
  ev('px-act3-mist', 'The Mist', 'Evil Teams', { room: true, cast: [], pokemon: 'munna', tint: '#5a3a50', effect: 'fog' }, MIST,
    [ch('(Go out.)', out(`The sign says NO ADMITTANCE TO KNIGHTS on the way out, too.`, ...ledger()))]),
];
(act3[3] as Json).remembers = [{ id: 'gone', when: [flagIs('ally-yara')], notice: `Yara's gone with the Lillipup before it ends. Win, and sixty Pokémon go into the Dreamyard, and the Munna's mist comes up to cover them going.` }];

// ---------- Act 4. Not Admitted (stage 6, a + node at night: the King's Room; needs Rank 3) ----------
const DAYBOOK = `Sister Ianthe's in the doorway. She's brought the daybook. She's had it under her mattress for eleven years. ${say('Sister Ianthe', `N. I've something to give you that I should've given you when you were six. I'd like you to read the right-hand column.`)} He reads. "Not admitted." A Herdier. Content. A Pidove that sang. He turns a page. And another. The right-hand column's five times the length of the left. ${say('N', `...Two thousand.`)} ${say('Sister Ianthe', `Two thousand, one hundred and nineteen. He stood at the door with me. He'd look, and he'd say: "Not that one."`)} ${say('N', `They came to see me. Two thousand happy ones came to my door, and I never—`)} He picks up the Zorua's old ball. He turns it over. ${say('N', `I never asked why they were all like that. A scientist would have asked.`)} ${say('Sister Ianthe', `You were five.`)} ${say('N', `I was fourteen at the end. I'd have asked at fourteen, if anyone'd ever shown me that asking got you something.`)}`;
const keeper = (...fx: Json[]): Json[] => [flag('plasma-daybook'), flag('plasma-inside-act4'), meters(0, 0, 5), ...fx, beat];
const act4: Json[] = [
  ev('px-act4', 'Not Admitted', 'Evil Teams', { callback: true, requires: [...inside({ beat: 5, rank: 3 }), night], cast: [N], tint: '#2a2440', effect: 'none' },
    `A half-dug doorway. A child's room, untouched. A toy train going round. A basketball hoop, too low now. A music box. ${say('N, on the floor, knees up, watching the train', `You came. I flew in under the cloud; nobody saw. I shouldn't be here. If they find me they'll put a crown on me, and I'll have to be polite about it.`)} ${say('N', `This is where I grew up. He brought them here. The ones people had hurt. A Darumaka with a burn. A Zorua that wouldn't let anyone touch its tail. I thought that's what people did. I was eleven before I met a Pokémon that was happy. I thought it was lying.`)} ${say('N', `I've done the sum. If every trainer's like the ones who hurt my friends, I'm right. If they aren't— how many would it take? To make me wrong? I keep meeting ones that aren't afraid. I've a list. You're on it. Your team is on it.`)} ${say('N', `Tell me about the Dreamyard. Don't make it kind.`)}`,
    [
      ch('(Tell him all of it.)', out(`The train goes round three times while you talk. He doesn't interrupt. At "Hold," he puts his hand flat on the floor, as if something had moved under it. ${DAYBOOK}`, flag('plasma-told-n-all'), room('px-act4-after'))),
      ch('"Ask Ghetsis."', out(`${say('N', `I've never once asked him a question he didn't answer beautifully.`)} ${DAYBOOK}`, room('px-act4-after'))),
      ch('"You were only shown the hurt ones. On purpose."', out(`He's quiet a long time. ${DAYBOOK}`, flag('plasma-told-n-all'), room('px-act4-after'))),
    ]),
  ev('px-act4-after', 'Not Admitted', 'Evil Teams', { room: true, cast: [N, OLD], tint: '#2a2440' },
    `The train goes round. The daybook's open on the floor between you.`,
    [
      ch('"It isn\'t your fault."', out(`${say('N', `It was my door.`)} Sister Ianthe gives you the key: Rank 5, Keeper of the King's Room.`, ...keeper())),
      ch('"What will you do?"', out(`${say('N', `Ask. Properly. The whole region; every one that'll speak to me. Not "did you choose this." That's his question; it's built to have one answer. I'll ask: "What do you want?" And I'll have to hear it. Even if it's "supper."`)} Sister Ianthe gives you the key: Rank 5, Keeper of the King's Room.`, ...keeper(flag('unova-asked')))),
      ch(`"One of them's still here. On a balcony. Wearing your face."`, out(`He's very still. ${say('N', `...I can hear him from here. I thought I was imagining. He's saying the same thing, over and over, in a voice only we use.`)} He doesn't say what. Sister Ianthe gives you the key: Rank 5, Keeper of the King's Room.`, ...keeper(flag('plasma-n-knows-likeness')))),
    ]),
];
(act4[0] as Json).remembers = [{ id: 'early', when: [flagIs('plasma-act4-early')], notice: `You came straight from the Dreamyard. You've the ledger in your hand, and you're angrier than he is.` }];
// "Rank 6, the King's Friend, if all of it was told and the daybook was read: nobody in the Vigil knows it's a rank. N does."
(act4[1] as Json).remembers = [{ id: 'friend', when: [flagIs('plasma-told-n-all')], notice: `He looks at you as if you were on his list twice. Nobody in the Vigil knows it's a rank: the King's Friend. N does.`, addChoices: [
  ch('(Sit with him till the train stops.)', out(`It runs down on its own. Neither of you winds it. Rank 6: the King's Friend. Sister Ianthe gives you the key as well.`, ...keeper(meters(0, 0, 6), mark('confided'), flag('plasma-n-confided')))),
] }];

// ---------- Act 5. The Seventh Chair (stage 7, instead of the battle) ----------
const TRIAD = `He goes. In the corner, three shapes that were there the whole time. ${say('One of the Shadow Triad', `He gave us names. Then he took them back.`)} ${say('Another', `The King gave things names. A train. A ball.`)} ${say('The third', `Ask him for three more. We'd take any.`)}`;
const toDorm = (text: string, ...fx: Json[]): Json => out(`${text} ${TRIAD}`, ...fx, room('px-act5-dorm'));
const act5: Json[] = [
  ev('px-act5', 'The Seventh Chair', 'Evil Teams', { callback: true, requires: inside({ beat: 6 }), cast: [BOSS], tint: '#2a2a40', effect: 'glint' },
    `The Hall of Sages. Seven chairs. Six with dust. A man with a cane, standing behind the seventh, with a cloth in his hand. ${say('Ghetsis', `Ah. The Listener. You've seen the Dreamyard. Good. I dislike explaining.`)} ${say('Ghetsis', `Sit. No, not that one. This one. I dusted it myself. Do you know how long it's been since I did a thing with my own hands that wasn't a lie?`)} ${say('Ghetsis', `The boy was a key I cut myself. Fourteen years. He opened every door in Unova and then walked out of the last one, which I hadn't foreseen: I'd made him to listen, and he did. You're cleverer than he is. You've seen the crates and you're still in the hood. Tomorrow a king's crowned on that balcony. Stand beside the throne and look moved.`)}`,
    [
      ch('"No."', toDorm(`You stay standing. ${say('Ghetsis', `A Sage who stands. How original.`)}`, flag('plasma-seat-stood'))),
      ch('"What does the Vigil know?"', out(say('Ghetsis', `What it needs. That he's coming back. They've dug out a castle with their hands on the strength of it. I find that affecting. I mean that. I'm affected by it the way one's affected by a very good lock.`), room('px-act5-chair'))),
      ch('"How long did it take, to make him?"', out(say('Ghetsis', `Fourteen years. I'm a patient man. It's my only virtue, and I've made it do the work of all the others.`), room('px-act5-chair'))),
      ch('(Sit.)', toDorm(`The chair's warm. He's been sitting in it. He doesn't sit at the table; he's said so for two years. ${say('Ghetsis', `It suits you. I'd wondered if it'd suit anyone.`)} Rank 4 is confirmed: the Seventh Seat.`, meters(0, -3, 4), flag('plasma-seat-sat'), flag('seventh-ring'))),
    ]),
  ev('px-act5-chair', 'The Seventh Chair', 'Evil Teams', { room: true, cast: [BOSS], tint: '#2a2a40' }, `He holds the cloth out. The seventh chair waits.`, [
    ch('(Sit.)', toDorm(`The chair's warm. He's been sitting in it. ${say('Ghetsis', `It suits you. I'd wondered if it'd suit anyone.`)} Rank 4 is confirmed: the Seventh Seat.`, meters(0, -3, 4), flag('plasma-seat-sat'), flag('seventh-ring'))),
    ch('(Stand.)', toDorm(`You stay standing. ${say('Ghetsis', `A Sage who stands. How original.`)}`, flag('plasma-seat-stood'))),
  ]),
  ev('px-act5-dorm', 'The Night Before', 'Evil Teams', { room: true, cast: [KNIGHT, KNIGHT], pokemon: 'chandelure', tint: CANDLE },
    `The lower dormitory. The night before. Six hundred candles. The Votive overhead. The word's gone round. ${say('A Knight, shining', `He's back. They've seen him. He's in the king's room; the Sister's seen a light.`)} ${say('Another', `He'll walk the fields. He'll tell us what they said.`)} Yara's on her pallet, on her side, facing the wall, with one arm under her tunic. Something under there sighs. ${say('Yara, very low', `I've a dog in my shirt and a king coming in the morning to tell me I was right to let her go. I don't know which of those I'm going to have to give up.`)} ${say('Emil, on the next pallet, on his back, hands locked on his chest', `If he's lied to that boy the way they lied to me at the Center, I'll— I don't know what I'll do. I'm a nurse. I've only ever been angry at things.`)} Your last choice of the night: who's told about the balcony.`,
    [
      ch('Tell nobody.', out(`The Vigil kneels in the morning, whole.`, flag('plasma-told-none'), flag('plasma-inside-act5'), beat, room('px-final-choice'))),
      ch('Tell Yara and Emil.', out(`They know. In every ending, they act on it.`, flag('plasma-told-two'), flag('plasma-inside-act5'), beat, room('px-final-choice'))),
      ch('Tell the dormitory.', out(`You stand under the Votive and say it. Nobody believes it. Not one. These people aren't tired. They've faith. ${say('A Knight', `You've been listening to the black coats.`)} You're found out, and put out of the gate. You're on the hill in the morning, with N, looking in.`, meters(0, 10), mark('found-out'), flag('plasma-told-all'), flag('plasma-inside-act5'), beat, room('px-final-choice'))),
    ]),
];
(act5[2] as Json).remembers = [{ id: 'asked', when: [flagIs('plasma-triad-asked')], notice: `In the corner, the three shapes are still there. One of them says, to nobody: "Ask him for three more."` }];
(act5[0] as Json).remembers = [{ id: 'ring', when: [flagIs('plasma-seat-refused')], notice: say('Ghetsis', `You refused the seat once. I'm offering it again. I'm a patient man.`) }];
(act5[1] as Json).remembers = [{ id: 'triad', when: [flagIs('plasma-n-confided')], notice: `The three in the corner have heard you talk about the King's Room.`, addChoices: [
  ch('(Turn to the corner.) "What names?"', out(`${say('The first', `You'd have to ask him.`)} ${say('The third', `Or you could give some. You've the right; you're the Seventh.`)} It's the first time anyone's asked.`, flag('plasma-triad-asked'), room('px-act5-chair'))),
] }];

// ---------- The officers, alone (Rank 4+, a + node at night, stages 5 to 7), EVIL_TEAMS_VOLUME_3_D "Unova" ----------
const alone = (id: string, name: string, cast: string[], intro: string, choices: Json[], o: Json = {}): Json =>
  ev(`px-alone-${id}`, name, 'Evil Teams', { requires: [...inside({ after: 4, rank: 4, ends: ['none'] }), night], cast, tint: '#1a2030', ...o }, intro, choices);
const ALONE: Json[] = [
  alone('zinzolin', 'Zinzolin, Alone', [SAGE], `A cold room. He's in furs. ${say('Zinzolin', `I feel the cold more than other men. It's the only thing I feel. Ghetsis keeps me close because I've no warmth to betray him with.`)}`, [
    ch('"Whose shopping list was it?"', out(`${say('Zinzolin', `Mine. In my hand. His words. "Priority." I've never once wanted a gold Vanillite. I'm cold enough.`)}`, intel(1))),
    ch('"Come nearer the fire."', out(`He does, a little. He holds his hands out to it as if it were a thing he'd read about.`)),
    ch('"What do you want?"', out(`${say('Zinzolin', `To be cold with company.`)} He names the Dreamyard's other sites, one by one, as if they were rooms in a house he'd lived in.`, flag('zinzolin-heard'))),
  ]),
  alone('colress', 'Colress, Alone', [COLRESS], `A lab. He's delighted to see anyone. ${say('Colress', `I don't care about liberation! I care what brings out a Pokémon's strength. Ghetsis says force. The King says freedom. I say: test it. You're a splendid data point. Yours fight harder than either theory predicts.`)}`, [
    ch('"It\'s Bond."', out(say('Colress', `Is it! Can you show me? Under controlled conditions?`), room('px-alone-colress-spar'))),
    ch('"And if the answer\'s inconvenient?"', out(say('Colress', `Then it's the best kind! An inconvenient answer is one nobody's paid for yet.`))),
    ch('"Who funds you?"', out(`${say('Colress', `A man with a cane. I don't ask what he funds next door. That's a lie. I ask. He answers beautifully.`)}`, intel(1))),
  ], { pokemon: 'klinklang' }),
  ev('px-alone-colress-spar', 'Controlled Conditions', 'Evil Teams', { room: true, cast: [COLRESS], tint: '#1a2030', effect: 'glint' },
    `A sparring match, under controlled conditions. He's got a clipboard and a grin.`,
    [ch('Battle.', fight(`${say('Colress', `Splendid! Again! No, don't hold back for the data's sake.`)}`, { ...trainer('Colress', { sprite: COLRESS, team: ['magneton', 'klinklang', 'metang', 'beheeyem'], size: 4, lv: 1,
      // Win it, and he publishes: Ghetsis's machine has no engineer on the night.
      win: [flag('colress-published')], lose: [] }), pseudo: true }))]),
  alone('triad', 'The Shadow Triad', [GRUNT, GRUNT, GRUNT], `They're simply there. ${say('One of them', `He found us. He named us. He took the names back when we were useful. Ask the King to give us one. We'd take any.`)}`, [
    ch('(Give them one each.)', out(`You pick three. They don't thank you. They say them over, once each, under their breath. They're gone from Ghetsis's side in the throne room.`, flag('triad-names-true'), flag('plasma-triad-named'))),
    ch('"Ask him yourselves."', out(`${say('The second', `We don't ask. We were made not to.`)} ${say('The third', `...We'll think about it.`)}`, flag('plasma-triad-asked'))),
    ch('"What were they before?"', out(`A long pause. ${say('The first', `We don't remember. That was the point of taking them.`)}`)),
  ]),
  alone('ghetsis', 'Ghetsis, Alone', [BOSS], `He comes to you. ${say('Ghetsis', `You've seen the Dreamyard. Good. I dislike explaining. The boy's a key I cut myself. You're cleverer than he is. Stand beside the throne and look moved.`)}`, [
    ch('"No."', out(say('Ghetsis', `No. How refreshing. I'll ask again tomorrow, and you'll be tireder.`))),
    ch('"What does he know?"', out(say('Ghetsis', `What he needs. That they love him. It's even true. I find that's the most useful kind of lie: the kind that is.`))),
    ch('"How long did it take, to make him?"', out(say('Ghetsis', `Fourteen years. I'm a patient man. It's my only virtue, and I've made it do the work of all the others.`))),
  ]),
];

// ---------- The loyalty test (Suspicion 7) and found out (Suspicion 10), EVIL_TEAMS_VOLUME_3_D "Unova" ----------
const TESTS: Json[] = [
  ev('px-loyalty-test', 'The Loyalty Test', 'Evil Teams', { callback: true, requires: inside({ suspicion: 7, suspicionBelow: 10, lacks: 'loyalty-test' }), cast: [SAGE], tint: WHITE },
    `${say('A Sage', `Release your lead. Here. Now. As we all did.`)} Your lead Pokémon looks up at you.`,
    [
      ch('"No."', out(`The Sage writes something down. He doesn't ask again.`, meters(0, 1), mark('loyalty-test'))),
      ch('"Ask it."', out(`The Sage looks at you as if you'd said it in another language. Then, slowly, he looks at your Pokémon. Nobody's ever asked him to.`, mark('loyalty-test'))),
      ch('(Let it go; see what it does.)', out(`It walks ten paces. It sits down. It looks at you. It comes back. N's in the doorway. He's seen. He adds a name to his list.`, meters(0, -4), mark('loyalty-test'), flag('plasma-released-came-back'))),
    ]),
  ev('px-found-out', 'Found Out', 'Evil Teams', { callback: true, requires: inside({ suspicion: 10, lacks: 'found-out' }), cast: [SAGE, KNIGHT], tint: '#3a1418', effect: 'glint' },
    `The Votive gutters. Six Knights round your pallet, and a Sage behind them. ${say('A Knight', `You've been listening to the black coats.`)} You've been found out, and you're to be put out of the gate.`,
    [ch('Fight your way out.', fight(`The Sage doesn't light his candle.`, foe('executive', 'Sage Giallo', 3, { lv: 1 }),
      mark('found-out'), story({ end: 'defeated' }), flag('plasma-ending-turn'), flag('plasma-found-out')))]),
];
// U7's Three Names (any player, in -6) add "You had them already" to the Triad.
(ALONE[3] as Json).remembers = [{ id: 'names', when: [flagIs('plasma-three-names')], notice: `You've the harbourmaster's entry, copied out.`, addChoices: [
  ch('"You had them already."', out(`You read them out. ${say('One of the Triad', `...Wick.`)} ${say('Another', `That's—`)} ${say('The third, who was always cold', `Tallow. I was— there was soup.`)} They don't thank you. They're gone. In every ending, they aren't at his shoulder.`, flag('triad-names-true'), flag('plasma-triad-named'))),
] }];
(TESTS[1] as Json).remembers = [{ id: 'yara', when: [flagIs('ally-yara')], notice: `Yara's at the gate when you're put out of it. She doesn't look at you. Something under her tunic sneezes, once, and every Knight looks at her instead.` }];

export const EVENTS: Json[] = [...offer, ...act1, ...act2, ...act3, ...act4, ...act5, ...ALONE, ...TESTS];
export const REMOVE: string[] = [];
