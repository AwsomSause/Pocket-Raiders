// Catalog Overhaul Pack, Evil Teams Volume III: Alola, Team Skull and the Aether Foundation from inside
// (EVIL_TEAMS_VOLUME_3_B "Alola", TEAM_SKULL_AETHER_ALOLA_FULL_1 part B, FULL_3 parts B to D, EVIL_TEAMS_VOLUME_3_D
// "Alola"). Two teams, one route each: a run's Alola story belongs to one of them (Skull or Aether), and that team makes
// its Offer; the other is the other side. On the Skull side the player is Numbskull Number One; on the Aether side, the
// Deputy Director. Every Act is written twice (`sk-` and `ae-`), and the two meet in the middle of each. The Final
// Choice, the endings and Team Tidepool are in evil-story-34.ts; the twelve scenes for any player in evil-story-35.ts.
import { ch, ev, fight, flag, flagIs, inRegion, out, room, trainer, type Json } from '../dsl.ts';
import { evil as story, foe, kind, prompt, STEALTH } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-story';

const S = teamJson('skull');
const A = teamJson('aether');
const SG = S.ranks.grunt.sprite;
const GUZMA = S.ranks.leader.sprite;
const PLUM = S.ranks.executive.sprite;
const AG = A.ranks.grunt.sprite;
const FABA = A.ranks.executive.sprite;
const LUSA = A.ranks.leader.sprite;
const KOA = 'trainer.pr/skull_grunt_m';
const LUX = 'trainer.pr/skull_grunt_f';
const ZIA = 'trainer.pr/aether_grunt_f';
const URI = 'trainer.pr/aether_grunt_m';
const WICKE = 'boss.wicke';
const PUA = 'trainer.pr/scientist_f';
const RAIN = '#2a2a34';
const WHITE = '#c8c0a0';
const AL = inRegion('alola');
const say = (who: string, line: string): string => `${who}: "${line}"`;
type Side = 'skull' | 'aether';
const team = (t: Side, o: Json = {}): Json[] => [{ kind: 'evil', team: t, ...o }, AL];
const inside = (t: Side, o: Json = {}): Json[] => team(t, { inside: true, ...o });
const mark = (m: string): Json => story({ mark: m });
const meters = (standing: number, suspicion = 0, rank?: number): Json => story({ ...(standing ? { standing } : {}), ...(suspicion ? { suspicion } : {}), ...(rank ? { rank } : {}) });
const beat = story({ beat: true });
const quiet = (): Json[] => [meters(1, 1), ...kind(1)];
const intel = (n: number): Json => flag('intel', n);
const night: Json = { kind: 'period', in: ['night'] };
const sus = (t: Side, atLeast: number, below = 11): Json => ({ kind: 'evil', team: t, inside: true, suspicion: atLeast, ...(below <= 10 ? { suspicionBelow: below } : {}) });
const stand = (t: Side, atLeast: number): Json => ({ kind: 'evil', team: t, inside: true, standing: atLeast });
const final = (t: Side): Json => room(t === 'skull' ? 'sk-final-choice' : 'ae-final-choice');

// ---------- The two Offers ----------
const offerOf = (t: Side): Json[] => {
  const id = `evil-${t}-offer-alola`;
  const yes = t === 'skull'
    ? ch('"Yes."', out(`"Aight! Po Town. Big gate, lotta rain. Tell 'em you're the respectful one." You're Team Skull now, on the inside. Nobody outside knows it.`, mark('inside'), flag(`${t}-offered`)))
    : ch('"Yes."', out(`${say('Wicke', `Oh, wonderful. There are eleven forms. I'll fill in what I can.`)} You're with the Aether Foundation now, on the inside. Nobody outside knows what that means.`, mark('inside'), flag(`${t}-offered`)));
  const report = ch('"Yes." (And tell the International Police.)', out(`You say yes. That night, behind the Hau'oli police station, you say it again to a man in a brown coat who calls himself Looker, and to a sleepy officer called Nanu who doesn't get up. ${say('Looker', `So. You will be my eyes. Be careful.`)} ${say('Nanu', `Mm. Don't get yourself killed on my island. Paperwork.`)} You have a handler now. Every careless step counts double.`, mark('inside'), mark('inside-man'), flag('alola-looker-met'), flag(`${t}-offered`)));
  const no = ch('"No."', out(t === 'skull' ? `"Aight. No hard feelings. You're still respectful." He wanders off, still lost. Team Skull's story goes on as it was, with you on the outside of it.` : `${say('Wicke', `Of course. I'll tell her you were busy.`)} She looks almost relieved. The Foundation's story goes on as it was, with you on the outside of it.`, flag(`${t}-offer-refused`), flag('alola-offer-refused'), flag(`${t}-offered`)));
  const intro = t === 'skull'
    ? `After the Trainers' School. A Grunt who's lost, and is being nice about it: "Yo, you beat us down respectfully. Nobody does that. Big G wants to meet you. It ain't a trap. We ain't organised enough for traps."`
    : `After the first Ultra Wormhole. ${say('Wicke', `The President would love to meet you. She says you've a gift with Pokémon. She collects people with gifts. I mean— she supports them.`)}`;
  const cast = t === 'skull' ? [SG] : [WICKE];
  return [
    ev(id, 'The Offer', 'Evil Teams', { room: true, cast, tint: t === 'skull' ? RAIN : WHITE, effect: 'glint' }, intro, [
      yes, no,
      ch(t === 'skull' ? '"What would I be doing?"' : '"What would I be doing?"', out(t === 'skull' ? `"Uh. Eatin'? Mostly eatin'. Bein' loud at people. Big G'll tell you."` : `${say('Wicke', `Helping. Truly. There's a conservation wing. It's the healthiest room in Alola.`)}`, room(`${id}-2`))),
      report,
    ]),
    ev(`${id}-2`, 'The Offer', 'Evil Teams', { room: true, cast, tint: t === 'skull' ? RAIN : WHITE }, t === 'skull' ? `"So, like. You in?"` : `${say('Wicke', `So. Shall I tell her yes?`)}`, [yes, no, report]),
  ];
};

// ---------- Act 1, Skull: What's Your Name (stage 3, Po Town, in the rain) ----------
const skAct1: Json[] = [
  ev('sk-act1', `What's Your Name`, 'Evil Teams', { callback: true, requires: inside('skull', { beat: 2 }), cast: [SG], tint: RAIN, effect: 'rain' },
    `A gate in a wall. Rain. A Grunt on a deckchair under half an umbrella. "Yo. You the respectful one? Go on in. ...Hey. You ate?" It's the first thing anyone says. At the fountain, where there's taro: "You ate?" On the Shady House steps: "You ate?" The Shady House: a chandelier on the floor, a throne made from a sun lounger. ${say('Guzma', `So you're the one. Beat my boys and didn't rub it in. Huh.`)} He looks you over. ${say('Guzma', `What's your name.`)} You say it. ${say('Guzma', `A'ight. That's it. That's the interview. You're in. Number One Numbskull; I just made it up; it's the top one.`)}`,
    [ch('Find your bunk.', out(`A villa. A bunk bed with the price tag still on. A lamp: ₽12,000, REDUCED.`, room('sk-act1-bunk')))]),
  ev('sk-act1-bunk', 'The Villa', 'Evil Teams', { room: true, cast: [KOA], tint: RAIN, effect: 'rain' },
    `Koa Ridgeway, on the top bunk, in the dark: ${say('Koa', `He ask your name?`)} ${say('Koa', `Three times I took it. Melemele. Third time, the captain didn't even watch. He was talking to somebody. Just said 'next.' I can tell you the day. I can tell you what I had for breakfast.`)} ${say('Koa', `You know what Guzma said, when I showed up here? Soaking. He said, 'What's your name.' That's it. That's the whole reason. Nobody on that island'd used it in a month; I was 'the Ridgeway kid, shame about him.'`)}`,
    [
      ch('"Would you try again?"', out(say('Koa', `Walk back up there? Past all of 'em? ...If somebody was watchin'. Actually watchin'. I'd— nah. Who's gonna watch.`), flag('ally-koa'), room('sk-act1-supper'))),
      ch(`"What'd you have for breakfast?"`, out(`${say('Koa', `Malasada. Two. Mum made 'em. She said, 'For luck.'`)} He's quiet a while. ${say('Koa', `Didn't work.`)}`, flag('ally-koa'), room('sk-act1-supper'))),
      ch(`"What's he like?"`, out(say('Koa', `Loud. He's got forty kids and he don't know what to do with us except be loud at everybody else. It works. Nobody calls us failures to our face.`), flag('ally-koa'), room('sk-act1-supper'))),
    ]),
  ev('sk-act1-supper', 'Supper', 'Evil Teams', { room: true, cast: [PLUM, LUX], tint: RAIN },
    `A villa kitchen. A pot. Plumeria, with a ladle, counting heads. ${say('Plumeria', `Thirty-nine. Who ain't here. Lux. Where's—`)} Lux, fourteen, from under the table, with a Wimpod: ${say('Lux', `I'm here.`)} ${say('Plumeria', `You ate?`)} ${say('Lux', `I'm eating.`)} ${say('Plumeria', `Then be seen doin' it.`)} To you: ${say('Plumeria', `You're forty-one. I count G separate. Bowl's on the side. You wash your own.`)}`,
    [ch('Wash your bowl.', out(`You wash your own. That night, a bandana on your bunk. The skull on it's a bit wonky.`, flag('skull-ate'), flag('skull-inside-act1'), beat))]),
];

// ---------- Act 1, Aether: Get Well. (stage 3, Aether Paradise) ----------
const aeAct1: Json[] = [
  ev('ae-act1', 'Get Well.', 'Evil Teams', { callback: true, requires: inside('aether', { beat: 2 }), cast: [WICKE, LUSA], tint: WHITE, effect: 'sparkle' },
    `A dock. Everything white. A lift that makes no noise. ${say('Wicke', `Welcome. You'll be in the conservation wing. I'm so sorry about the forms; there are eleven. I've filled in what I could.`)} A poster, by the lift. A Pikachu, mid-leap. GET WELL. Under it: 98% RECOVERY RATE. The President's office: a woman arranging white flowers. ${say('Lusamine', `So you're the one with the gift. Come into the light. ...Yes. Your Pokémon look at you. Did you know that? Most people's don't. I notice things that look at one.`)} ${say('Lusamine', `I'll call you Deputy. I've wanted a deputy. Faba's so eager. You're restful.`)}`,
    [ch('Find your room.', out(`The staff floor. A white room. Two beds, made with corners.`, room('ae-act1-room')))]),
  ev('ae-act1-room', 'The Staff Floor', 'Evil Teams', { room: true, cast: [ZIA], tint: WHITE },
    `Zia Pemberton, a keeper, taking off white gloves a finger at a time: ${say('Zia', `I'm conservation. Third year. We do extraordinary work; I mean that. A Mareanie came in last month with half its spines gone. I've got it eating from my hand.`)} ${say('Zia', `We've a ninety-eight per cent recovery rate. It's on the poster. D'you know what our release rate is? I looked. It isn't on the poster.`)}`,
    [
      ch('"What is it?"', out(say('Zia', `Two. Per cent. I thought I'd misread. I ran it three ways.`), flag('ally-zia'), flag('aether-rate'), room('ae-act1-wing'))),
      ch('"Where do they go, then?"', out(`She looks at the floor, which is white. ${say('Zia', `Downstairs. That's all anyone says. Downstairs.`)}`, flag('ally-zia'), flag('aether-rate'), room('ae-act1-wing'))),
      ch(`"Why'd you look?"`, out(say('Zia', `The Mareanie's better. It's been better for a fortnight. I wrote 'ready for release' on its chart. The next morning the chart said 'ready for preservation.' Somebody'd changed one word. In my handwriting. They're good; I'd not have known, but I never cross my t's.`), flag('ally-zia'), flag('aether-rate'), room('ae-act1-wing'))),
    ]),
  ev('ae-act1-wing', 'The Wing', 'Evil Teams', { room: true, cast: [PUA], tint: WHITE },
    `The wing. Pools. Two hundred Pokémon, glossy, bright, well. It's the healthiest room in Alola. Curator Pua, gently, tidying a chart: "Aren't they lovely? It's for the best. Out there they'd only get hurt again."`,
    [
      ch('Walk to the back of the dock.', out(`A rusted barge. A wheelhouse. Chalk on the wall, faded: two columns. And, propped behind a locker, a board with hand lettering: GET WELL. GO HOME. That night: a white uniform, and a pass. It opens every door but one.`, flag('aether-sign-seen'), flag('aether-inside-act1'), beat)),
      ch('Go to bed.', out(`A white uniform, and a pass. It opens every door but one.`, flag('aether-inside-act1'), beat)),
    ]),
];

// ---------- Act 2, both: One Slowpoke (stage 4) ----------
const slow = (t: Side): Json[] => {
  const p = t === 'skull' ? 'sk' : 'ae';
  const intro = t === 'skull'
    ? `A nursery on Akala, run by Aether. Steal a Slowpoke. It's on a list. ${say('Plumeria', `Don't ask who's payin'. I ain't asked. I hate that I ain't asked.`)} The squad: Koa, and Lux, who isn't meant to be on it. ${say('Koa', `She followed. I said go home. She said this is—`)} ${say('Lux', `I'm lookout.`)} ${say('Koa', `She's in the van. With the doors locked. From the outside.`)}`
    : `A nursery on Akala. "Acquire" a Slowpoke before Team Skull takes it. ${say('Faba', `A specimen of unusual placidity. The President wants it. Skull's been tipped off, by someone; I can't think who.`)} He can. The squad: Zia, and Uri Vandermeer, a guard. ${say('Uri', `I'm Uri. I do what I'm told. I've found it's the simplest.`)}`;
  const foeOf = t === 'skull'
    ? trainer('Uri Vandermeer', { sprite: URI, team: ['arcanine', 'hypno'], size: 2, lv: 1, win: [] })
    : trainer('Koa Ridgeway', { sprite: KOA, team: ['salazzle', 'golbat'], size: 2, lv: 1, win: [] });
  const choices = (): Json[] => [
    ch('"Take it."', fight(`The other squad's lead squares up.`, foeOf, meters(2, 0, 2), flag('alola-slowpoke-taken'), flag(`${t}-inside-act2`), flag('alola-same-job'), beat)),
    ch('"Whose is it, actually?"', out(`The nursery's keeper: "Nobody's. It walked in. Two years back. It's got a friend here."`, intel(2), room(`${p}-act2-whose`))),
    ch('"Put it down. All of us. See where it goes."', out(`Four hands let go. It sits. It thinks about it. It takes about a minute. It's the longest minute in the corridor's history. It gets up. It goes back into the nursery, slowly, and lies down next to another Slowpoke, which shuffles over without waking. Both squads stand there. ${say('Koa', `...So nobody needed to steal it.`)} ${say('Zia', `Nobody needed to have it.`)} ${say('Uri', `I was told to take it.`)} A pause. ${say('Uri', `I wasn't told what to do if it didn't want to go. Nobody's ever covered that.`)} ${say('Lux', `It's got a friend.`)} Koa and Zia have met. They swap nothing. He notices her gloves. She notices he's wet.`, meters(0, 1, 2), ...kind(1), flag('alola-slowpoke-down'), flag('alola-same-job'), flag('ally-uri'), flag(`${t}-inside-act2`), beat)),
  ];
  return [
    ev(`${p}-act2`, 'One Slowpoke', 'Evil Teams', { callback: true, requires: inside(t, { beat: 3 }), cast: t === 'skull' ? [KOA, LUX] : [ZIA, URI], tint: '#3a4a3a' }, intro,
      [ch('Go in.', out(`It's the same Slowpoke. Aether hired Skull to steal it and sent its own people to save it. It wanted a theft on the news and a rescue on the poster.`, room(`${p}-act2-corridor`)))]),
    ev(`${p}-act2-corridor`, 'The Corridor', 'Evil Teams', { room: true, cast: [KOA, ZIA, URI], pokemon: 'slowpoke', tint: '#3a4a3a' },
      `A corridor. Two squads. One Slowpoke, between them, being held at both ends. ${say('Koa', `Yo. That's ours.`)} ${say('Zia', `It's a patient.`)} ${say('Uri', `I've been told to take it.`)} ${say('Koa', `I been told to take it.`)} The Slowpoke yawns. Lux, who was locked in a van: ${say('Lux', `Why's everybody got the same job?`)} Nobody asks how she got out.`, choices()),
    ev(`${p}-act2-whose`, 'The Corridor', 'Evil Teams', { room: true, cast: [KOA, ZIA, URI], pokemon: 'slowpoke', tint: '#3a4a3a' },
      `Nobody's. Everybody is still holding on to it.`, [choices()[0]!, choices()[2]!]),
  ];
};

// ---------- Act 3, both: Preserved (stage 5): a door of rooms (ps_sk_cold, ps_ae_cold) ----------
const COLD = '#1a2230';
const preserved = (t: Side): Json[] => {
  const p = t === 'skull' ? 'sk' : 'ae';
  const after = `${p}-cold-after`;
  const fighter = t === 'skull'
    ? trainer('Curator Pua', { sprite: PUA, team: ['comfey', 'oranguru', 'porygon2'], size: 3, lv: 1, win: [] })
    : trainer('Faba', { sprite: FABA, team: ['hypno', 'bruxish', 'alakazam'], size: 3, lv: 1, win: [] });
  const fighterLine = t === 'skull' ? `Curator Pua comes down the far stairs. "It's for the best," she says as she sends each one out.` : `Faba, behind you, in a coat, already reaching for a Ball.`;
  const one = t === 'skull'
    ? `The Pikachu. Guzma lifts the case lid. ${say('Guzma', `It was jumpin'. She froze it jumpin'.`)} He carries it inside his jacket.`
    : `The Corsola. Zia lifts it out herself, frost and all, and wraps it in her coat.`;
  const shut = t === 'skull'
    ? `You close the door. Guzma goes back to Po Town and doesn't say anything at supper. ${say('Plumeria', `You ate?`)} ${say('Guzma', `...Nah.`)} It's never happened before.`
    : `You close the door. Zia goes back to the wing and feeds a Mareanie that's been better for a fortnight.`;
  const rooms: Json[] = t === 'skull'
    ? [
      ev('sk-act3', 'Preserved', 'Evil Teams', { callback: true, requires: inside('skull', { beat: 4 }), cast: [GUZMA], tint: COLD, effect: 'fog' },
        `Guzma's had a tip: there's something in the basement worth smashing. He's brought a bat and the Number One Numbskull.`,
        [ch('Go down the drain.', out(`Aether Paradise, from below.`, room('sk-cold-drain')))]),
      ev('sk-cold-drain', 'The Drain', 'Evil Teams', { room: true, cast: [GUZMA], tint: COLD }, `A drain under Aether Paradise. Dripping. A ladder up, and a door with frost on the handle.`, [ch('Up.', out(`It's colder at the top.`, room('sk-cold-rows')))]),
      ev('sk-cold-rows', 'The Cold', 'Evil Teams', { room: true, cast: [GUZMA], tint: COLD, effect: 'fog' },
        `Rows of glass. Frost on the inside. A Pikachu, mid-leap. A Corsola. A Petilil. Each one bright, whole, at its best. Each with a label: PRESERVED AT ITS MOST BEAUTIFUL. Nothing's dead; they're in stasis, and can be woken. He's got the bat on his shoulder. He's not using it. ${say('Guzma', `She told me I was special. She said, 'You're my favourite broken thing.' I thought that was a nice thing to say. Nobody'd ever said 'favourite.'`)} ${say('Guzma', `Look at 'em. That's what she does with favourites.`)}`,
        [ch('Walk the row with him.', out(`He walks the row. He stops at an empty case, near the end. It's new. It's tall. It's about his height. ${say('Guzma', `...Nah.`)}`, flag('guzma-saw-case'), room('sk-cold-case')))]),
    ]
    : [
      ev('ae-act3', 'Preserved', 'Evil Teams', { callback: true, requires: inside('aether', { beat: 4 }), cast: [ZIA], tint: COLD, effect: 'fog' },
        `The one door. Your pass doesn't open it. Zia's has, today: somebody's upgraded her. It's a test. She knows.`,
        [ch('Go through.', out(`The door sighs open. Cold air pours over your shoes.`, room('ae-cold-rows')))]),
      ev('ae-cold-rows', 'The Cold', 'Evil Teams', { room: true, cast: [ZIA, FABA], tint: COLD, effect: 'fog' },
        `Rows of glass. Frost on the inside. A Pikachu, mid-leap. A Corsola. A Petilil. Each one bright, whole, at its best. Each with a label: PRESERVED AT ITS MOST BEAUTIFUL. Nothing's dead; they're in stasis, and can be woken. ${say('Zia', `Those are ours. Those are the ones that got better. That's— I nursed that Corsola. Eleven weeks. I signed it 'ready.'`)} Faba, behind you, in a coat: ${say('Faba', `The President can't bear for lovely things to change. Is that so wicked? You've pressed a flower.`)}`,
        [ch('Go on, to the last case.', out(`Zia doesn't move from the Corsola.`, flag('zia-saw-corsola'), room('ae-cold-tall')))]),
      ev('ae-cold-tall', 'The Last Case', 'Evil Teams', { room: true, cast: [ZIA], pokemon: 'exeggutor-alola', tint: COLD },
        `The tallest. An Exeggutor with a neck like a palm, and three heads, all smiling. The label's older than the others. Handwritten. TALL TALE. — There. Now one of them has to stay.`,
        [ch('Turn back to the rows.', out(`Zia is waiting.`, room('ae-cold-case')))]),
    ];
  rooms.push(
    ev(`${p}-cold-case`, 'Preserved', 'Evil Teams', { room: true, cast: t === 'skull' ? [GUZMA] : [ZIA], tint: COLD },
      `The rows hum.`,
      [
        ch('"Wake them."', out(fighterLine, room(`${p}-cold-last`))),
        ch('"Wake one, and carry it out as proof."', out(one, meters(0, 1, 4), ...kind(1), flag('alola-coldroom-one'), flag(t === 'skull' ? 'alola-carried-pikachu' : 'alola-carried-corsola'), room(after))),
        ch('"Close the door."', out(shut, meters(1, 0, 4), flag('alola-coldroom-shut'), room(after))),
      ]),
    ev(`${p}-cold-last`, 'The Last Room', 'Evil Teams', { room: true, cast: [t === 'skull' ? PUA : FABA], tint: COLD },
      t === 'skull' ? `${say('Curator Pua', `It's for the best.`)}` : `${say('Faba', `I am the last line of defence.`)}`,
      [ch('Battle.', fight(`A row of glass between you.`, fighter, meters(0, 4, 4), ...kind(2), flag('alola-coldroom-woke'), room(after)))]),
    ev(after, 'Preserved', 'Evil Teams', { room: true, cast: t === 'skull' ? [GUZMA] : [ZIA], tint: COLD },
      `Behind you, the cold room hums, or doesn't.`,
      [ch('Go back up.', out(`Back up, into the warm.`, flag(`${t}-inside-act3`), beat), {
        branches: [{ when: [flagIs('alola-coldroom-woke')], text: `A row thaws. A Petilil bolts.`, effects: [flag(`${t}-inside-act3`), beat] }],
      })]),
  );
  return rooms;
};

// ---------- Act 4, Skull: Second (stage 6, a + node at Night; needs Rank 4) ----------
const confide = (t: Side, rank: number, ...fx: Json[]): Json[] => [meters(2, 0, rank), mark('confided'), flag(`${t}-${t === 'skull' ? 'guzma' : 'lusamine'}-confided`), flag(`${t}-inside-act4`), ...fx, beat];
const skAct4: Json[] = [
  ev('sk-act4', 'Second', 'Evil Teams', { callback: true, requires: [...inside('skull', { beat: 5, rank: 4 }), night], cast: [GUZMA], tint: '#2a2420' },
    `A porch light. A woman who's been expecting a knock for six years, answering one. Guzma's mother: "He's upstairs. He comes sometimes, when his father's out. I leave the back door. I've not moved anything." A boy's room. A shelf. Trophies, a dozen. Every one's silver. In the hall, a rack of golf clubs, each bent in the middle, the same way. Guzma, on a bed too short for him: ${say('Guzma', `Second. Second. Second. Old man kept 'em on the shelf so I'd see. Golf club's still in the hall.`)} ${say('Guzma', `I passed, y'know. Every trial. They don't know that, back at the house; I let 'em think I washed out like them. I didn't wash out. I got to the end and Hala looked at me and looked at the other guy and picked the other guy.`)} ${say('Guzma', `I ain't evil. I'm bad at it. I got forty kids in a wet house who failed a test some dead guy made up. I thought if I was scary enough, nobody'd call 'em failures. Then she comes along and she ain't scared of me at all. She thinks I'm cute. She says there's a fifth island and it needs a kahuna. I'd have done anything.`)}`,
    [
      ch('"You fed forty kids."', out(say('Guzma', `Plumes fed 'em. I yelled near 'em.`), flag('guzma-passed'), room('sk-act4-wimpod'))),
      ch('"What do they call you?"', out(`${say('Guzma', `...'Boss.' Lux calls me 'big bro.' I told her to quit it.`)} She hasn't.`, flag('guzma-passed'), room('sk-act4-wimpod'))),
      ch('"Come home. Not here. Po Town."', out(`He looks at the trophies a long time. ${say('Guzma', `...Yeah. Po Town. That's home, huh.`)}`, flag('guzma-passed'), room('sk-act4-wimpod'))),
      ch('"You saw the empty case."', out(`He's quiet. ${say('Guzma', `It was my height. I stood next to it. I ain't dumb. I'm her favourite. I seen what she does with favourites.`)} A pause. ${say('Guzma', `I'm still gonna go. Tomorrow. If she calls. That's the messed-up part. I know what the case is for and I'm still gonna go, 'cause she's the only one ever picked me.`)}`, flag('guzma-passed'), flag('guzma-knows-case'), room('sk-act4-wimpod-6')), { requires: [flagIs('guzma-saw-case')] }),
    ]),
  ev('sk-act4-wimpod', 'Under the Bed', 'Evil Teams', { room: true, cast: [GUZMA], pokemon: 'wimpod', tint: '#2a2420' },
    `Under the bed: a Wimpod. It's been looking at the door for years. It sees him. It doesn't run. It's the only time a Wimpod doesn't run. ${say('Guzma', `...Lil' G. You're still— Ma's been feedin' you?`)}`,
    [ch('Leave them to it.', out(`You go down. His mother has made tea and doesn't ask. You're an Admin now, beside Plumeria.`, ...confide('skull', 5)))]),
  ev('sk-act4-wimpod-6', 'Under the Bed', 'Evil Teams', { room: true, cast: [GUZMA], pokemon: 'wimpod', tint: '#2a2420' },
    `Under the bed: a Wimpod. It's been looking at the door for years. It sees him. It doesn't run. It's the only time a Wimpod doesn't run. ${say('Guzma', `...Lil' G. You're still— Ma's been feedin' you?`)}`,
    [ch('Leave them to it.', out(`At the door he says it, not looking: "Second. You're my second. Ain't a title I've had cause to give before." You're Guzma's Second.`, ...confide('skull', 6)))]),
];

// ---------- Act 4, Aether: Dead Heads ----------
const deadHeads = (text: string, rank: number, ...fx: Json[]): Json => out(`${text} ${say('Lusamine', `Deputy. You've never once tried to leave. I can't tell you what that means to me.`)} She touches your collar. She straightens it. ${say('Lusamine', `I shan't ever let you.`)} ${rank === 6 ? 'You are the President\'s Favourite.' : 'You are Branch Chief.'}`, ...confide('aether', rank, ...fx));
const aeAct4: Json[] = [
  ev('ae-act4', 'Dead Heads', 'Evil Teams', { callback: true, requires: [...inside('aether', { beat: 5, rank: 4 }), night], cast: [LUSA], tint: '#e8e4d8', effect: 'sparkle' },
    `A glass roof. White roses. A woman with scissors, cutting the brown ones off, dropping them in a basket. ${say('Lusamine', `Deputy. Hold this. ...One has to take them the moment they turn. Before they spoil the look of the others.`)} ${say('Lusamine', `My husband went into one of those holes and didn't come out. The children grew. They changed. Everything I love leaves, or alters. I only want one thing to stay as it was. Is that monstrous? Every mother's wanted it.`)} ${say('Lusamine', `The Beast doesn't change. It doesn't leave. It only wants. I understand it better than anyone I've met.`)}`,
    [
      ch('"Your children are still here."', deadHeads(`The scissors stop. ${say('Lusamine', `They aren't the ones I had.`)} Then, quieter: ${say('Lusamine', `...I never met the ones they became. I was busy keeping the ones they'd been.`)}`, 5)),
      ch('"What did your husband love?"', deadHeads(`${say('Lusamine', `Letting things go. He'd stand on the barge and wave. At a Corsola. As if it'd wave back.`)} A pause. ${say('Lusamine', `It did, once. A branch. I've never forgiven it.`)}`, 5)),
      ch('"And the cold room?"', deadHeads(say('Lusamine', `They're safe. Nothing can happen to them now. Do you know how rare that is? For a thing you love to be somewhere nothing can happen to it?`), 5)),
      ch(`"The sign used to say 'Go home.'"`, deadHeads(`She puts the scissors down. Carefully. In the basket, with the dead heads. ${say('Lusamine', `That was his. He lettered it. I kept the first half. It was the half that was true. They got well. The second half was— he went. The sign told everything to go, and then he went.`)} A long time. ${say('Lusamine', `I couldn't have it on the wall saying that.`)}`, 6, flag('aether-gohome-said'), flag('aether-favourite')), { requires: [flagIs('aether-sign-seen')] }),
    ]),
];
// Zia, later, very quietly (FULL_1 Act 4).
const ZIA_FAV = { id: 'fav', when: [flagIs('aether-favourite')], notice: say('Zia', `Don't let her call you that. I've seen where she keeps her favourites.`) };

// ---------- Act 5, both: The Wrong Signs (stage 7, the ferry at night) ----------
const signs = (t: Side): Json[] => {
  const p = t === 'skull' ? 'sk' : 'ae';
  const told = t === 'skull'
    ? `Zia tells you: ${say('Zia', `The white boat's ours. The children's fund. Wicke signs it; she thinks it's the Aether House. You're paid to be noisy. So nobody looks at B2. You're a line item.`)}`
    : `Koa tells you: ${say('Koa', `She's told G there's a fifth island. That he's kahuna. He's goin' through that hole with her tomorrow. He seen a case his own height and he's still goin'. 'Cause she picked him.`)}`;
  const knows = flag(t === 'skull' ? 'skull-knows-boat' : 'aether-knows-fifth');
  const last = (): Json[] => [
    ch('Tell nobody.', out(`Tomorrow goes as planned.`, flag('alola-told-none'), flag('alola-signs'), flag(`${t}-inside-act5`), beat, final(t))),
    ch('Tell the two squads.', out(`Koa, Zia, Uri and Lux know. Whatever happens tomorrow, they'll act on it.`, flag('alola-told-squads'), flag('alola-signs'), flag(`${t}-inside-act5`), beat, final(t))),
    t === 'skull'
      ? ch('Tell Po Town.', out(`You stand on the dry fountain. "The white boat's Aether's. You're the noise." Forty kids. Nobody shouts. Tupp: "So we been— a distraction?" Rapp: "We've been a distraction for six years. From what, I couldn't have told you. I'd assumed, from ourselves." Plumeria takes a book out from behind the brochures. ${say('Plumeria', `Then we got three to bring back, and a house to pay our own rent on. You ate? Good. Get in the van.`)}`, flag('alola-told-town'), flag('alola-signs'), flag(`${t}-inside-act5`), beat, final(t)))
      : ch('Tell the conservation wing.', out(`You read out the release rate. Two hundred staff. Nobody speaks. Then Curator Pua, gently: "It's for the—" She stops. It's the first time. Wicke takes a pile of forms from a drawer. Two hundred and six. She tears the top one in half.`, flag('alola-told-wing'), flag('alola-signs'), flag(`${t}-inside-act5`), beat, final(t))),
  ];
  return [
    ev(`${p}-act5`, 'The Wrong Signs', 'Evil Teams', { callback: true, requires: inside(t, { beat: 6 }), cast: [KOA, ZIA], tint: '#1a2a3a', effect: 'rain' },
      `The inter-island ferry, at night. A bench on deck. Two people on it who've never sat on the same bench: one in a bandana, one in white gloves. ${say('Koa', `She said meet on the boat. I ain't never been on the boat. We got a van.`)} ${say('Zia', `I've never been off the Paradise. Three years.`)} More or less together: "We've been comparing." ${say('Koa', `You lot make 'em well. Then you don't let 'em go.`)} ${say('Zia', `You lot take them in. Then you don't— where do yours go? After? Koa, you've been in that town six years.`)} ${say('Koa', `...Nowhere. It's Po Town. There ain't an after.`)} ${say('Zia', `We freeze Pokémon and call it a charity.`)} ${say('Koa', `We feed kids and call it a gang.`)} Both: "I think we've each got the other's sign up." ${told}`,
      [
        ch('Listen.', out(`The ferry's engine thrums under the bench. Your last choice of the night: who's told.`, knows, room(`${p}-act5-told`))),
        ch(`Tell them both: he's alive. The man at the Pelago.`, out(`${say('Zia', `He's— alive?`)} ${say('Koa', `Growin' beans?`)} ${say('Zia', `She built all of it because he left. The white. The cold. And he's twenty miles off, humming.`)} ${say('Koa', `...You gonna tell her?`)}`, knows, flag('alola-pelago-told'), room(`${p}-act5-told`)), { requires: [flagIs('alola-mohn-found')] }),
      ]),
    ev(`${p}-act5-told`, 'The Wrong Signs', 'Evil Teams', { room: true, cast: [KOA, ZIA], tint: '#1a2a3a', effect: 'rain' }, `The lights of the islands go by. Who's told?`, last()),
  ];
};

// ---------- The six Operations (FULL_3 C): three for each side ----------
const OPS: Json[] = [
  // AO1. The Bus Stop (Skull)
  ev('sk-op-bus-stop', 'Operation: The Bus Stop', 'Evil Teams', { requires: inside('skull', { after: 2 }), cast: [KOA, 'trainer.pr/veteran_f'], tint: RAIN },
    `The order: shake down a bus stop on Route 8. "There's always somebody." ${say('Koa', `Always somebody here. Like, always. Old lady's been here every time we come. Three hours, sometimes.`)} The old lady, Auntie Haunani: "It says ten past. It's said ten past since my husband was alive. It's never once been ten past."`,
    [
      ch('Shake it down.', out(`She hands over her purse without looking at you. There's always somebody.`, meters(1))),
      ch('Fix the timetable.', out(`The timetable's behind cracked plastic. It's for a route that was changed nine years ago. "When does it actually come?" Auntie Haunani: "Twenty to. And only Tuesdays and Fridays. Everybody knows. You wait anyway, in case." You take it down. Koa's got a marker. Lux, who isn't meant to be here, has the best handwriting. A new one, on the back of a Po Town brochure: BUS: 20 TO. TUES + FRI. — SKULL. Auntie Haunani, reading it: "...Well. That's the first true thing that's been up there in nine years." She gets up. It's a Thursday. "I'll go home, then." There's nobody to shake down, after. That's why there always was.`, ...quiet(), flag('skull-op-bus'))),
    ]),
  // AO2. The Trial Site (Skull)
  ev('sk-op-trial-site', 'Operation: The Trial Site', 'Evil Teams', { requires: inside('skull', { after: 4 }), cast: [KOA, SG], tint: '#1a2a1a' },
    `The order: wreck a captain's trial. Tags on the gate. Knock the markers down. Night. A trial site, closed. Six of the forty, with spray cans, not spraying. ${say('Koa', `We're s'posed to trash it.`)}`,
    [
      ch('Trash it.', out(`Tags on the gate. The markers go down. Koa sprays his name, and then crosses it out.`, meters(1))),
      ch('"Or take it."', out(`A Grunt: "It ain't official. There's no captain. No stamp." "There's me. I'll watch." Each of the six takes the trial. You're the captain. The first is a boy who froze, once. He freezes.`, room('sk-op-trial-watch'))),
    ]),
  ev('sk-op-trial-watch', 'The Trial Site', 'Evil Teams', { room: true, cast: [SG], tint: '#1a2a1a' },
    `He's frozen at the hard moment, with everybody looking.`,
    [
      ch('"Next."', out(`He goes red, and walks down. The others don't look at you. It's the word.`, meters(1))),
      ch('"Take your time."', out(`He unfreezes. It takes forty seconds. He's never been given forty seconds.`, room('sk-op-trial-rest'))),
      ch('(Say nothing. Keep looking.)', out(`He unfreezes. It takes forty seconds. He's never been given forty seconds.`, room('sk-op-trial-rest'))),
    ]),
  ev('sk-op-trial-rest', 'The Trial Site', 'Evil Teams', { room: true, cast: [SG, KOA], tint: '#1a2a1a' },
    `A twin: she's better than her sister was, and she knows it halfway through. She finishes. She cries. "She got a party." Kimo: his Rattata's hurt, and he stops to sling it. That's a fail, on paper. "Not here." Three more. Koa, after, not having taken it: ${say('Koa', `I ain't goin'. Not here. Not at night with nobody. I want it in the day.`)} A pause. ${say('Koa', `...I want it in the day. I ain't said that before.`)}`,
    [ch('Oil the gate on the way out.', out(`The site isn't wrecked. In the morning, the real captain finds six sets of footprints and a gate that's been oiled. There's one tag. Small. By the stamp box: we came back.`, ...quiet(), flag('skull-op-trial')))]),
  // AO3. Po Town Roof (Skull)
  ev('sk-op-roof', 'Operation: Po Town Roof', 'Evil Teams', { requires: inside('skull', { after: 5 }), cast: [PLUM, GUZMA], tint: RAIN, effect: 'rain' },
    `The order: guard the Shady House. All night. Guzma's expecting trouble. There are nine buckets on the landing. They're full. ${say('Plumeria', `He thinks somebody's comin' for him. Nobody's comin'. It's rained on that boy's bed for six years and he's put a guard on the door.`)}`,
    [
      ch('Guard the door.', out(`You stand at the door all night. Nobody comes. The buckets fill.`, meters(1))),
      ch('Mend the roof.', out(`Tiles, tar, a ladder. The squad helps. It's raining throughout. Guzma, coming out at three in the morning, with a bat: ${say('Guzma', `What's that noise. Who's on my—`)} The Number One Numbskull, on his roof, with a hammer. ${say('Guzma', `...You're fixin' it.`)} ${say('Guzma', `Nobody's ever—`)} He looks at the bat. He puts it down against the wall. ${say('Guzma', `You need somebody to hold the ladder?`)} He holds the ladder till it's done. The nine buckets are emptied. They're never needed again. He keeps one, by the bed. He doesn't say why.`, ...quiet(), flag('skull-roof-mended')), { prompt: prompt(STEALTH), fail: out(`Tiles, tar, a ladder, and rain. You slip twice. Guzma comes out at three in the morning with a bat, sees you, and puts the bat down. ${say('Guzma', `You need somebody to hold the ladder?`)} He holds the ladder till it's done. The buckets are emptied. He keeps one, by the bed.`, ...quiet(), flag('skull-roof-mended')) }),
    ]),
  // AO4. The Intake (Aether)
  ev('ae-op-intake', 'Operation: The Intake', 'Evil Teams', { requires: inside('aether', { after: 2 }), cast: [URI, ZIA], tint: WHITE },
    `The order: bring in six "rescues" from Melemele. Strays. Injured. "At risk."`,
    [
      ch('Bring in six.', out(`Six crates, six forms. Uri signs them.`, meters(1))),
      ch('Check each for a trainer.', out(`A Pikipek, "stray": it's on a wire outside a window; there's a dish on the sill. A Yungoos with a limp, "injured, unattended": a boy's two streets off, calling it. A Grubbin, "at risk": it's a Grubbin; it's fine. A Meowth with a bell, "stray": it's got a bell. A Wingull, oiled, "injured": it is; it needs the wing. A Slowpoke, "unusually placid": it's a Slowpoke. ${say('Uri', `I was told six.`)} ${say('Zia', `You were told six rescues. That's one.`)} ${say('Uri', `...I'll bring one. If I'm asked, I'll say there was one.`)} A pause. ${say('Uri', `That's true, isn't it? It'd be the first time the form and the day matched.`)} One Wingull comes in. Zia's got it flying in a week. It's the first chart she writes "ready for release" on.`, ...quiet(), flag('aether-op-intake'))),
    ]),
  // AO5. The Poster (Aether)
  ev('ae-op-poster', 'Operation: The Poster', 'Evil Teams', { requires: inside('aether', { after: 4 }), cast: [ZIA, WICKE], tint: WHITE },
    `The order: hang the new recovery poster at twelve Pokémon Centers. GET WELL. 98%.`,
    [
      ch('Hang them.', out(`Twelve Centers, twelve posters, straight.`, meters(1))),
      ch('Write the release rate under it, in pencil.', out(`The first Center. You hang it. Straight. Zia holds the tape. A pencil. ${say('Zia', `Small. So they have to come close.`)} Under the 98%, in neat grey figures: released: 2%. By the third, somebody's found the first. A nurse, by telephone, to the Paradise: "There's a figure on your poster. Is it right? Because I've sent you forty this year and I've been telling their trainers 'soon.'" Wicke, taking the call: "I— one moment." She goes and looks. "It's right." At the twelfth Center, somebody's got there first. Under the pencil, in different pencil: where are the other 96? And under that, in a child's hand, a drawing of a Rockruff.`, ...quiet(), flag('aether-op-poster'))),
    ]),
  // AO6. The Cold Room (Aether): a door of two rooms
  ev('ae-op-cold-room', 'Operation: The Cold Room', 'Evil Teams', { requires: inside('aether', { after: 5 }), cast: [PUA], tint: COLD, effect: 'fog' },
    `The order: log the day's "preservations." Three. Sign. Lock up. B2. The frost. Three new cases, empty, humming, ready. Three trolleys. A Mareanie, glossy, every spine back. A Wingull. A Petilil. Each with a chart. Each chart on the wrong form. Curator Pua: "It's for the best. It is. They're perfect. They'll never be more— oh, that one's looking at me. They don't usually look." The log: three lines. You write them.`,
    [
      ch('"Preserved." Three times.', out(`They're cased. Zia doesn't speak at supper.`, meters(2), room('ae-op-cold-latch'))),
      ch(`"Preserved." Three times, and don't close the cases.`, out(`The log says it. The room doesn't. Pua sees. She says nothing. It's for the best.`, ...quiet(), room('ae-op-cold-latch'))),
      ch(`"Deferred: no second signature."`, out(`It's true. Wicke's lost the forms. Pua: "Is that— can one write that?" "It's what happened." Pua: "...I've never written what happened. I've written what was for the best." She initials it.`, ...quiet(), flag('pua-initialled'), room('ae-op-cold-latch'))),
    ]),
  ev('ae-op-cold-latch', 'The Cold Room', 'Evil Teams', { room: true, cast: [PUA], tint: COLD },
    `And the door. A latch. It can be left.`,
    [
      ch('Leave it on the latch.', out(`It's the only door on B2 that's ever been left. That night, something small comes up the stairs from below, with its helmet off, and sits outside it. It's not waiting for orders. Whatever happens, nobody will need a key.`, flag('coldroom-latch'))),
      ch('Lock up.', out(`You lock up. The key goes back on its hook.`)),
    ]),
];
(OPS[0] as Json).remembers = [{ id: 'koa-low', when: [sus('skull', 0, 4)], notice: say('Koa', `You ate?`) }];
(OPS[1] as Json).remembers = [{ id: 'koa-mid', when: [stand('skull', 5)], notice: say('Koa', `You watch. I noticed that. You actually watch.`) }];
(OPS[4] as Json).remembers = [{ id: 'koa-high', when: [stand('skull', 8)], notice: say('Koa', `If I went back up there. You'd come?`) }, { id: 'koa-sus', when: [sus('skull', 4, 7)], notice: say('Koa', `Tupp says you're soft. I said yeah. So?`) }];
(OPS[5] as Json).remembers = [{ id: 'zia-low', when: [sus('aether', 0, 4)], notice: say('Zia', `Gloves, please.`) }];
(OPS[6] as Json).remembers = [{ id: 'zia-mid', when: [stand('aether', 5)], notice: say('Zia', `You read the chart before the patient. Good. No: bad. Read the patient.`) }, { id: 'zia-sus', when: [sus('aether', 4, 7)], notice: say('Zia', `Faba's asked for your pass logs. I've given him mine instead. They're very dull.`) }];
(OPS[7] as Json).remembers = [{ id: 'zia-high', when: [stand('aether', 8)], notice: say('Zia', `If I'm ever at my best, don't let anyone write it down.`) }];

// ---------- AI1. You Ate? (Skull, every stage from 3) and AI3. Rounds (Aether, every stage from 3) ----------
const ate = (n: number, after: number, text: string, choices?: Json[]): Json =>
  ev(`sk-you-ate-${n}`, 'You Ate?', 'Evil Teams', { requires: inside('skull', { after }), cast: [PLUM], tint: RAIN }, `Supper. Plumeria counts heads. ${text}`, choices ?? [ch('Eat.', out(`You eat. You wash your own bowl.`))]);
const ATE: Json[] = [
  ate(3, 2, `Lux isn't there. She's under the table.`),
  ate(4, 3, `Kimo isn't there. He's at the Ten-Coin Center, with a Grunt's Zubat in a sling. Plumeria takes his bowl over herself.`),
  ate(5, 4, `Guzma isn't there. He's eaten, he says. He's on the roof.`, [
    ch('Take a bowl up.', out(`He eats it. ${say('Guzma', `Don't tell Plumes.`)} She can see you both from the kitchen.`, flag('guzma-fed'))),
    ch('Eat.', out(`You eat. You wash your own bowl.`)),
  ]),
  ate(6, 5, `Nobody's missing. ${say('Plumeria', `Forty-one. Huh.`)} She counts again. ${say('Plumeria', `First time in a year.`)}`),
  ate(7, 6, `Plumeria isn't there. She's dished up forty-one and she's on the step in the rain with the book.`, [
    ch(`"You ate?"`, out(`She looks up. Nobody's ever said it back.`, flag('plumeria-heard'))),
    ch('Leave her be.', out(`You leave her with the book.`)),
  ]),
];
const roundsOf = (n: number, after: number, text: string, req: Json[] = []): Json =>
  ev(`ae-rounds-${n}`, 'Rounds', 'Evil Teams', { requires: [...inside('aether', { after }), ...req], cast: [ZIA], tint: WHITE }, `The wing, at night. Zia does rounds. You carry the clipboard. ${text}`, [ch('Carry on.', out(`On to the next pool.`))]);
const ROUNDS: Json[] = [
  roundsOf(3, 2, `The Mareanie. "Eating. Spines at 60%." ${say('Zia', `Another fortnight. Then I'll write 'ready.' I'm going to write it very clearly.`)}`),
  roundsOf(4, 3, `The Mareanie. "Ready for release." In her hand, t's crossed, underlined. ${say('Zia', `There. Let them change that.`)}`),
  roundsOf(5, 4, `The Mareanie. "Ready for preservation." ${say('Zia', `They didn't change the word. They changed the form. It's a different sheet. Same clipboard.`)} She takes it off. She folds it. She puts it in her glove.`),
  roundsOf(6, 5, `No chart. The pool's there. The Mareanie's there. ${say('Zia', `It hasn't got one. If it hasn't got a chart, nobody can sign it. I've lost two hundred and six charts. Wicke's lost the forms. We've not discussed it.`)}`),
  roundsOf(7, 6, `A wall. Two columns, in chalk: IN. HOME. The second column's empty. ${say('Zia', `For tomorrow.`)}`, [flagIs('aether-chalk-given')]),
];
(ROUNDS[0] as Json).remembers = [ZIA_FAV];

// ---------- AI2. The Night Run (Skull), AI4. As They Were (Aether) ----------
const MORE: Json[] = [
  ev('sk-night-run', 'The Night Run', 'Evil Teams', { requires: [...inside('skull', { after: 3 }), night], cast: [PLUM], pokemon: 'meowth', tint: '#1a1a24' },
    `The sales office. Two in the morning. Plumeria, with a ledger, and a Meowth held by the scruff, which has given up. ${say('Plumeria', `You're up. Good. You're comin'. You tell anybody and I'll deny it and they'll believe me.`)} ${say('Plumeria', `Entry three-oh-eight. Meowth. 'Borrowed' off a porch in Malie by two of my geniuses on Tuesday. It's got a bell on. It's somebody's baby.`)} A road. A porch. A light on upstairs. She sets it down on the mat. It looks at her. It looks at the door. ${say('Plumeria', `Go on.`)} It scratches. A light. A voice: "Is that— MITTENS?" A door. A shriek. Plumeria's already behind the hedge. She's got the book out. She writes a date in the second column. ${say('Plumeria', `Three hundred and six back. Six to go.`)}`,
    [
      ch('"Why not tell Guzma?"', out(say('Plumeria', `'Cause he needs to think we're bad. If we ain't bad, what are we? Forty kids in a wet house. He can't look at that straight.`), flag('skull-borrowbook'))),
      ch('"Why keep the book?"', out(say('Plumeria', `'Cause I gotta be able to. Look at it straight.`), flag('skull-borrowbook'))),
      ch(`"Who's the six?"`, out(`She turns the book so you can read it. Six lines without a second date. ${say('Plumeria', `Take one, if you want. By the scruff. To a doorstep. Nobody suspects this of Skull.`)}`, flag('skull-borrowbook'))),
    ]),
  ev('sk-borrow-errand', 'An Entry in the Book', 'Evil Teams', { requires: [...inside('skull', { after: 4 }), flagIs('skull-borrowbook')], cast: [PLUM], tint: '#1a1a24' },
    `One of the six from the Borrow Book: a Pichu, taken from a market stall in Konikoni. You've got it by the scruff. It's given up.`,
    [ch('Take it to the doorstep.', out(`You set it down on the mat. It looks at you. It looks at the door. It scratches. A light, a voice, a door. Plumeria writes a date in the second column when you tell her. Nobody suspects this of Skull.`, ...kind(1), flag('skull-borrow-returned')))]),
  ev('ae-as-they-were', 'As They Were', 'Evil Teams', { requires: inside('aether', { after: 4, rank: 4 }), cast: [LUSA], tint: '#e8e4d8' },
    `The family floor. Two doors, side by side. Lusamine, with a key on a ribbon. ${say('Lusamine', `Deputy. I'd like you to see. I don't show people.`)} The first room. A girl's. White. A bed made for someone four feet tall. On it, laid out: a dress, a hat, small white shoes. Fresh. Pressed. ${say('Lusamine', `I lay them out. Every morning. In case she comes down.`)} She smooths the collar. ${say('Lusamine', `She's— there's a tall girl about the place who answers to the name. I'm polite to her.`)} The second room. A boy's. A height chart on the door frame, in pencil. It stops at ten. ${say('Lusamine', `He was measured every birthday. Then he stopped coming to be measured.`)} She holds out the hat. ${say('Lusamine', `Would you? I've a call. Just lay it straight. On the pillow.`)}`,
    [
      ch('(Lay it out.)', out(`It's on the pillow tomorrow, and every day.`, meters(1))),
      ch('(Put it away. In the wardrobe.)', out(`She finds the bed bare. She doesn't shout. She takes it out and lays it down again. ${say('Lusamine', `Deputy. We don't tidy her.`)}`, meters(0, 2))),
      ch('(Mark the door frame: a new line, higher, with today\'s date.)', out(`A pencil's there, on the ledge, where it's been for six years. You mark where a boy of sixteen would come to. Lusamine, in the doorway, back from her call: ${say('Lusamine', `...What's that.`)} "Where he is now." She comes and stands under it. It's above her eye. ${say('Lusamine', `He's taller than me?`)} A long time. ${say('Lusamine', `I'd not— I've been looking down, for him. All this time. I'd have walked straight past.`)}`, flag('aether-height'))),
    ]),
];

// ---------- The officers, alone (EVIL_TEAMS_VOLUME_3_D, Alola) ----------
const OFFICERS: Json[] = [
  ev('sk-plumeria-alone', 'Plumeria, Alone', 'Evil Teams', { requires: inside('skull', { after: 3 }), cast: [PLUM], tint: RAIN, effect: 'rain' },
    `Po Town's roof, in the rain. ${say('Plumeria', `I'm not their boss. I'm their big sister. Somebody's got to check they ate. Guzma checks they're scary. I check they ate. You tell me which matters.`)}`,
    [
      ch('"Who checks you ate?"', out(`She laughs. It stops. ${say('Plumeria', `...Nobody. Huh.`)}`, flag('plumeria-heard'))),
      ch(`"They'd follow you."`, out(`${say('Plumeria', `They'd follow a bowl. I just carry it.`)}`)),
      ch('"What does Guzma eat?"', out(`${say('Plumeria', `Whatever's left. He waits till everyone's done. Thinks I don't see.`)}`)),
    ]),
  ev('sk-gladion-alone', 'Gladion, Alone', 'Evil Teams', { requires: inside('skull', { after: 4 }), cast: ['boss.gladion'], pokemon: 'type-null', tint: '#2a2430' },
    `A motel. Type: Null, with its helmet half off. ${say('Gladion', `I took it and ran. From her. It was a weapon that failed, so she froze it. I'm with Skull because nobody here asks what I'm running from.`)}`,
    [
      ch(`"It's not a weapon."`, out(`He looks at it a long time. ${say('Gladion', `No. It isn't. It eats cereal out of my hand.`)}`)),
      ch('"Does it have a name?"', out(`${say('Gladion', `...I've been calling it 'Null.' That's what the file said.`)} A pause. ${say('Gladion', `That's not a name, is it. That's what she called it.`)} He gives it one.`, flag('null-named'))),
      ch('"Go home and tell her."', out(`${say('Gladion', `Tell her what? She'd only freeze it again. Or me.`)}`)),
    ]),
  ev('ae-faba-alone', 'Faba, Alone', 'Evil Teams', { requires: inside('aether', { after: 3 }), cast: [FABA], tint: WHITE },
    `His office. Every certificate he's ever earned. ${say('Faba', `Branch Chief. The last line of defence. She's never once used my name without 'thank you, that will be all' after it.`)}`,
    [
      ch('"You could be more."', out(`${say('Faba', `More? I'm Branch Chief.`)} He says it as if it were a ceiling.`)),
      ch('"What did you do before?"', out(`${say('Faba', `Research. Real research. I was going to cure something. I forget what.`)}`)),
      ch('"Who are you defending her from?"', out(`${say('Faba', `...I've never asked.`)} He looks at the cold room's key on its hook.`, flag('faba-asked'))),
    ]),
  ev('ae-wicke-alone', 'Wicke, Alone', 'Evil Teams', { requires: inside('aether', { after: 4 }), cast: [WICKE], tint: WHITE },
    `The conservation deck. She's feeding something that should've been released. ${say('Wicke', `I sign the intake forms. I've stopped signing the other ones. They pile up. Nobody's noticed. If nobody signs, nothing's 'preserved.' It's the only disobedience I'm capable of.`)}`,
    [
      ch('"How many?"', out(say('Wicke', `Two hundred and six. They're all still awake.`), flag('wicke-pile'))),
      ch('"Give me the pile."', out(`${say('Wicke', `Oh, I couldn't. If they're with me, they're lost. If they're with you, they're stolen.`)} She keeps them.`)),
      ch(`"That's enough to matter."`, out(`${say('Wicke', `Is it? I've never been sure anything I did was.`)}`)),
    ]),
];

// ---------- The loyalty tests (Suspicion 7) and found out (Suspicion 10) ----------
const TESTS: Json[] = [
  ev('sk-loyalty-test', 'The Loyalty Test', 'Evil Teams', { callback: true, requires: inside('skull', { suspicion: 7, suspicionBelow: 10, lacks: 'loyalty-test' }), cast: [GUZMA], tint: RAIN },
    `${say('Guzma', `Smash it. That statue. Captain's statue. C'mon. Show me you're one of us.`)}`,
    [
      ch('"Nah."', out(`${say('Guzma', `...Nah?`)} He looks at you. He looks at the statue. ${say('Guzma', `Huh. Nah.`)} He doesn't press it.`, meters(0, -1), mark('loyalty-test'))),
      ch('(Smash it.)', out(`It comes apart easier than you'd think. Guzma whoops. It doesn't feel like anything.`, meters(0, -2), mark('loyalty-test'), flag('skull-statue-smashed'))),
      ch('"You do it."', out(`He lifts the bat. He doesn't. ${say('Guzma', `...Ain't his fault I came second.`)}`, meters(0, -3), mark('loyalty-test'), flag('skull-test-yours'))),
    ]),
  ev('ae-loyalty-test', 'The Loyalty Test', 'Evil Teams', { callback: true, requires: inside('aether', { suspicion: 7, suspicionBelow: 10, lacks: 'loyalty-test' }), cast: [LUSA], tint: '#e8e4d8' },
    `${say('Lusamine', `Choose one for the cold room. Any. Whichever you think is at its loveliest.`)}`,
    [
      ch('"None."', out(`${say('Lusamine', `None? Nothing at all is lovely enough to keep?`)} She looks at you as if you'd said something cruel.`, meters(0, 1), mark('loyalty-test'))),
      ch('(Point at a rose in her garden.)', out(`She follows your finger. A white rose, just open. She laughs, delighted. ${say('Lusamine', `Yes. Oh, yes. You do understand.`)} She cuts it herself.`, meters(0, -3), mark('loyalty-test'))),
      ch('"You choose. Look at them first."', out(`She goes along the pools. She looks. She stops at the Mareanie a long time. She doesn't choose.`, meters(0, -1), mark('loyalty-test'), flag('aether-test-looked'))),
    ]),
  ev('sk-found-out', 'Found Out', 'Evil Teams', { callback: true, requires: inside('skull', { suspicion: 10, lacks: 'found-out' }), cast: [PLUM, SG], tint: '#3a1418', effect: 'rain' },
    `The Shady House gate is shut when you come back, and Plumeria is standing in front of it with three Grunts who won't meet your eye. ${say('Plumeria', `Somebody's been talkin' to the cops. Nanu's got a sheet with your name on it. I ain't sayin' it's you. I'm sayin' you're goin' out the long way.`)} You've been found out. The only way back outside is through them, with your own party, on worse ground than you'd have chosen.`,
    [ch('Fight your way out.', fight(`They come at you two at once.`, foe('executive', 'Plumeria and a Grunt', 6, { lv: 2, format: 'doubles' }),
      mark('found-out'), story({ end: 'defeated' }), flag('alola-ending-turn'), flag('skull-found-out')))]),
  ev('ae-found-out', 'Found Out', 'Evil Teams', { callback: true, requires: inside('aether', { suspicion: 10, lacks: 'found-out' }), cast: [FABA, AG], tint: '#3a1418' },
    `The lift stops between floors. When the doors open, Faba is waiting, with two Employees and a clipboard. ${say('Faba', `Deputy. The President is very hurt. I, on the other hand, am delighted.`)} You've been found out. The only way back outside is through them, with your own party, on worse ground than you'd have chosen.`,
    [ch('Fight your way out.', fight(`They come at you two at once.`, foe('executive', 'Faba and an Employee', 6, { lv: 2, format: 'doubles' }),
      mark('found-out'), story({ end: 'defeated' }), flag('alola-ending-turn'), flag('aether-found-out')))]),
];
(TESTS[0] as Json).remembers = [{ id: 'koa', when: [flagIs('ally-koa')], notice: say('Koa', `G's gonna make you smash somethin'. Tell him to do it himself. He won't.`) }];
(TESTS[1] as Json).remembers = [{ id: 'zia', when: [flagIs('ally-zia')], notice: say('Zia', `She'll ask you to choose one for the cold. Point at a rose.`) }];
(TESTS[2] as Json).remembers = [{ id: 'koa', when: [flagIs('ally-koa')], notice: `Koa is by the gate. He catches your eye, and takes one step sideways, out of their line.` }];
(TESTS[3] as Json).remembers = [{ id: 'zia', when: [flagIs('ally-zia')], notice: `Zia is in the corridor behind them. She takes one step sideways, out of their line.` }];

export const EVENTS: Json[] = [
  ...offerOf('skull'), ...offerOf('aether'), ...skAct1, ...aeAct1, ...slow('skull'), ...slow('aether'), ...preserved('skull'), ...preserved('aether'),
  ...skAct4, ...aeAct4, ...signs('skull'), ...signs('aether'), ...OPS, ...ATE, ...ROUNDS, ...MORE, ...OFFICERS, ...TESTS,
];
export const REMOVE: string[] = [];
void AG;
