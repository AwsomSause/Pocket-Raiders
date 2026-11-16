// Catalog Overhaul Pack, row 9: Sinnoh, twelve Galactic scenes for any player, inside the team or out of it
// (TEAM_GALACTIC_SINNOH_FULL_3 part A, S1 to S12), and the scenes they open (Tove, Eskil, the board's six votes).
// Keepsakes stay cut (Kice, 2026-11-13): the Works Band Badge and the Thirteenth Chime are run flags.
import { $, ch, ev, flag, flagIs, has, heal, bondUp, lose, money, out, room, type Json } from '../dsl.ts';
import { evil as story, kind, prompt, RHYTHM } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-hoenn-sinnoh-unova';

const G = teamJson('galactic');
const GRUNT = G.ranks.grunt.sprite;
const SCI = G.ranks.specialist.sprite;
const BOSS = G.ranks.leader.sprite;
const JUPITER = 'boss.npc_beauty';
const HOLMGREN = 'boss.npc_lady';
const say = (who: string, line: string): string => `${who}: "${line}"`;
/** Galactic is the region's team, the run is in Sinnoh, and its story has reached this far. Inside or out. */
const gx = (after: number, o: Json = {}): Json[] => [{ kind: 'evil', team: 'galactic', after, anyRoute: true, ...o }, { kind: 'region', ids: ['sinnoh'] }];
const night: Json = { kind: 'period', in: ['night'] };
const intel = (n: number): Json => flag('intel', n);

const S: Json[] = [
  // S1. Are the Lights On?
  ev('gx-lights-on', 'Are the Lights On?', 'Evil Teams', { requires: gx(2), cast: [HOLMGREN], tint: '#2e3440' },
    `A hall with five hundred chairs and eleven people on a platform. A sign: ANNUAL GENERAL MEETING. SHAREHOLDERS ONLY. One woman in the audience, in a wool hat, with a flask. ${say('The chair, reading', `Item nine. Any other business.`)} ${say('Mrs. Holmgren, standing', `One question. Are the lights on?`)} ${say(`The chair, who's answered it four years running`, `The lights are on, Mrs. Holmgren.`)} ${say('Mrs. Holmgren', `Thank you.`)} She sits. She unscrews the flask. To you, in the next seat, without lowering her voice: ${say('Mrs. Holmgren', `You're not a shareholder. Nor's anyone; I've the only share that isn't his. Sit. They can't throw you out. They'd have to ask you something first, and that costs four minutes.`)}`,
    [
      ch('"Why that question?"', out(`${say('Mrs. Holmgren', `I was born by candle. The lines were down nine days. My father started the firm that spring with a ladder and a cousin. "To keep the lights on." I ask so that somebody in this building has to say the old charter out loud once a year. He's never noticed that's what I'm doing.`)} She offers you a sip from the flask. It's tea. It does nothing. She says it's medicinal.`, flag('galactic-lore-holmgren'), intel(3))),
      ch('"Why do you still come?"', out(`${say('Mrs. Holmgren', `Because one share's a seat. And a seat's a place to be asked from. I've sat in worse.`)} She offers you a sip from the flask. It's tea. She says it's medicinal.`, flag('galactic-lore-holmgren'), intel(3))),
      ch('"Who voted for it? The new charter."', out(`She points, along the platform, with the flask. ${say('Mrs. Holmgren', `All eleven. Don't think badly of them. He was right. Every item. That's what I'd tell a young person: be careful of someone who's right about everything on the list and never asks who wrote the list.`)} She offers you a sip. It's tea.`, flag('galactic-lore-holmgren'), intel(3))),
    ]),
  // S2. The Garage Band
  ev('gx-garage-band', 'The Garage Band', 'Evil Teams', { requires: gx(2), cast: ['boss.npc_gentleman', 'boss.npc_lady'], tint: '#3a3428', effect: 'sparkle' },
    `A roller door, half up. Inside: eleven people in their sixties, a van with no wheels, and the worst noise in Sinnoh. ${say('The bandmaster, Mr. Henrik Nyberg, lowering a cornet', `Veilstone Light & Power Works Band. Regional champions, thirty years back. Disbanded by memorandum: "eleven instruments, no measurable output." We've met every Tuesday since.`)} ${say('A woman with a tuba', `Out of spite.`)} ${say('Mr. Nyberg', `Out of habit, Birgit. The spite's extra.`)} ${say('Mr. Nyberg', `We're short a triangle. Young Tove had it. She joined the silver lot; she said she wanted to stop being nervous before concerts. I'd have told her: that is the concert.`)}`,
    [
      ch('"Play me the march."', out(`They play it. It's dreadful. It's sixty. Birgit's tuba is flat and she doesn't care.`)),
      ch(`"I'll take the triangle."`, out(`One note, every eighth bar. It's harder than it sounds; the band's not together. You hit every one. ${say('Mr. Nyberg', `There. That's the first time it's sounded like the march since Tove.`)} He pins a Works Band Badge on you.`, flag('galactic-band')), { prompt: prompt(RHYTHM), fail: out(`You're off it. ${say('Birgit', `Doesn't matter. I'm off it.`)} Mr. Nyberg pins a Works Band Badge on you anyway.`, flag('galactic-band')) }),
      ch('"Was he ever in the band?"', out(`${say('Mr. Nyberg', `Cyrus? He came to one rehearsal. Nineteen. Stood at the back. I said, "D'you play?" He said, "I've calculated the room's resonance. Your tuba's flat."`)} ${say('Birgit', `I was.`)} ${say('Mr. Nyberg', `He was right. He's always right. He left before the tea.`)}`)),
    ]),
  ev('gx-tove', 'Tove', 'Evil Teams', { requires: [...gx(2), flagIs('galactic-band')], cast: [GRUNT], tint: '#2e3440' },
    `A Grunt on the Windworks gate, standing very still. Her name tape says TOVE.`,
    [
      ch('Show her the Works Band Badge.', out(`${say('Tove', `...They're still meeting? Without a triangle? That'll sound awful.`)} She's nervous. It's the first thing she's felt in a year. She goes to rehearsal.`, flag('galactic-tove'), ...kind(1))),
      ch('Walk past.', out(`She doesn't look round.`)),
    ]),
  // S3. The Fish, After
  ev('gx-fish-after', 'The Fish, After', 'Evil Teams', { requires: gx(3), cast: ['boss.npc_fisherman'], pokemon: 'magikarp', tint: '#2a3a48', effect: 'fog' },
    `A lakebed. Mud to the horizon. A hundred Magikarp, and one old man with a rod he isn't using. ${say('Old Padraig Lachlan', `Sixty years I've fished this water. Never once had them come to me.`)} He's carrying them down. One at a time. He's eighty. ${say('Padraig', `I'm not asking. You've somewhere to be. Everybody's somewhere to be, this year; I've noticed it. Nobody stops.`)}`,
    [
      ch('(Pick one up. Stay till it\'s done.) (a node)', out(`The party helps, each after its nature. A Water type ferries three. A Flying type's no use and knows it. Your lead stands in the shallows and nudges them out to deep water. By dusk there are none on the mud. ${say('Padraig', `I'll remember which way round you did it.`)}`, ...kind(1), flag('galactic-fish'))),
      ch('(Pick one up, and go.)', out(say('Padraig', `That's one more than the last hundred people.`))),
      ch('"Who did this?"', out(`He nods up at the sky, where a black airship was yesterday. ${say('Padraig', `Folk in silver. They'd a van. One of them carried three, badly, in good shoes.`)}`, room('gx-fish-after-2'))),
      ch(`"You'll never get them all."`, out(`${say('Padraig', `No. I'll get this one.`)} He does. ${say('Padraig', `And now I'll get this one.`)}`, room('gx-fish-after-2'))),
    ]),
  ev('gx-fish-after-2', 'The Fish, After', 'Evil Teams', { room: true, cast: ['boss.npc_fisherman'], pokemon: 'magikarp', tint: '#2a3a48', effect: 'fog' }, `He bends for the next one.`,
    [
      ch(`(Pick one up. Stay till it's done.) (a node)`, out(`Your party helps, each after its nature, until there are none on the mud. ${say('Padraig', `I'll remember which way round you did it.`)}`, ...kind(1), flag('galactic-fish'))),
      ch('(Walk on.)', out(`Nothing's said. He doesn't look up.`)),
    ]),
  // S4. The Regulation Cut
  ev('gx-regulation-cut', 'The Regulation Cut', 'Evil Teams', { requires: gx(2), cast: ['boss.npc_lady'], tint: '#3a2a3a' },
    `A wigmaker's. A window of identical teal bowl-cuts on identical wooden heads. ${say('The wigmaker, Madame Solveig Drummond', `Forty years I made hair for the theatre. Hamlets. Dowagers. A very good Father Time. This year I've made four hundred of those. One style. One colour. Nobody tries them on. Nobody looks in the glass. They pay, they put it on in the doorway, they go.`)} ${say('Madame Drummond', `I've started sewing a name in each. Inside the band. They never told me their names; I make one up. This one's Astrid. That's Leif. So that somebody knows which is which.`)}`,
    [
      ch('"Who was the oddest customer?"', out(say('Madame Drummond', `A gentleman with a great deal of his own hair and a very loud whisper. He wanted it "to look as though it has always been there." I said: sir, it's on back to front. He said that was the disguise.`))),
      ch('"Has anyone ever come back?"', out(say('Madame Drummond', `One. A girl. She brought hers in to be let out; she said it was tight. It wasn't tight. She'd grown her own, underneath, an inch. She hadn't noticed. I said: that's yours, dear. She cried in my chair. I've not had anyone cry in my chair since the Dowager.`))),
      ch('"Make me one." (₽500)', out(`The Honest Trade Card: a disguise; in Sinnoh, Galactic ambushes don't trigger for one stage. It itches. She sews a name in the band, and lets you choose it.`, $(-500), flag('galactic-disguise')), { requires: [money(500)] }),
    ]),
  // S5. All Is in Order
  ev('gx-all-in-order', 'All Is in Order', 'Evil Teams', { requires: gx(2), cast: ['boss.npc_lady'], tint: '#3a3428' },
    `A kitchen table. Twelve letters laid out in a row. A woman squaring their edges. ${say('The mother, Mrs. Runa Pruett', `My son. He joined them a year ago; he said he was tired of "being like this." He writes on the first. Look.`)} Twelve letters. Each says: ALL IS IN ORDER. Five words, counting his name. ${say('Mrs. Pruett', `I thought it was a code. I held them to the stove. I've a neighbour says lemon juice. It's not a code. It's what he's got to say.`)} ${say('Mrs. Pruett', `I write back four pages. The dog. The roof. Who's died. I don't know if he reads them.`)}`,
    [
      ch('"What was he like? Before?"', out(`${say('Mrs. Pruett', `Dreadful. Slammed doors. Cried at adverts. Rang me at midnight to say he'd seen a Starly with a bad wing and what should he do.`)} A pause. ${say('Mrs. Pruett', `I'd give a year's pension for a slammed door.`)}`)),
      ch('"I could carry one."', out(`She gives you this month's four pages, folded twice. "Eterna. The building with the G." You carry the letter.`, flag('galactic-pruett-letter'))),
      ch('"Write him five words."', out(`She thinks about it. She takes a clean sheet. She writes: "The Starly's wing has mended." It's five. She counts them. You carry the letter.`, flag('galactic-pruett-letter'), flag('galactic-pruett-five'))),
    ]),
  ev('gx-eskil', 'The Thirteenth Letter', 'Evil Teams', { requires: [...gx(2), flagIs('galactic-pruett-five')], cast: [GRUNT], tint: '#2e3440' },
    `A corridor in the Eterna building. A Grunt with a name tape: PRUETT.`,
    [ch('Give him his mother\'s letter.', out(`${say('Grunt Eskil Pruett, reading it', `...It mended?`)} A long pause. It's the first question he's asked in a year. ${say('Eskil', `It— I'd splinted it with a lolly stick. I never knew if—`)} He sits down on the floor. The thirteenth letter home is four pages.`, flag('galactic-pruett'), ...kind(1)))]),
  // S6. Thursdays
  ev('gx-thursdays', 'Thursdays', 'Evil Teams', { requires: gx(3), cast: ['boss.npc_gentleman'], tint: '#2e2e3a' },
    `A sorting bench. A clerk with a magnifying glass and a stamp album. ${say('The post clerk, Mr. Leif Maddox', `I collect. Stamps. It's all I've ever been curious about, which is why they've let me stay: I'm not curious about the letters.`)} ${say('Mr. Maddox', `There's a Commander posts one envelope every Thursday. Plain. No return. I'd never have looked. But the stamp. It's franked here, and then it's got a second, underneath, half soaked off: a foreign one. A desert. An orange sun. I've not got that one. I've wanted that one for six years.`)}`,
    [
      ch('"Which Commander?"', out(say('Mr. Maddox', `The fourth. Nobody remembers the fourth. I do; she tips.`), room('gx-thursdays-stove'))),
      ch(`"Where's the stamp from?"`, out(say('Mr. Maddox', `Orre.`), intel(4), flag('cipher-seen-sird'), room('gx-thursdays-stove'))),
      ch('"Steam one open."', out(`He won't. ${say('Mr. Maddox', `I've standards.`)} But he'll look away. One sheet: a floor plan of the Veilstone basement, and a line: "The chain holds the large ones. Tell him the dragon will fit." It's the Thread, a stage early.`, flag('galactic-thread-early'), intel(2), room('gx-thursdays-stove'))),
    ]),
  ev('gx-thursdays-stove', 'Thursdays', 'Evil Teams', { room: true, cast: ['boss.npc_psychic_f'], tint: '#2e2e3a' },
    `Outside, a camp stove. Sird, warming her hands. ${say('Sird', `You've been in the post room. So've I. He wants the stamp; I've been meaning to give him a clean one. Would you? I'm always leaving.`)} She hands over a small square of orange. ${say('Sird', `Mondays I report to Cyrus. Thursdays, elsewhere. On the other five I'm my own. You've caught me on a Tuesday. Lucky.`)}`,
    [
      ch('Take the stamp in to Mr. Maddox.', out(`He holds it under the glass for a long time. He's got what he wanted. He gives you the Thursday envelope, unsteamed, whole.`, flag('galactic-maddox-stamp'), intel(2))),
      ch('Keep walking.', out(`She shrugs, and pockets the stamp again.`)),
    ]),
  // S7. The Unlabelled Pan
  ev('gx-unlabelled-pan', 'The Unlabelled Pan', 'Evil Teams', { requires: gx(2), cast: ['boss.npc_engineer', 'boss.npc_lady'], tint: '#3a3428' },
    `A back kitchen behind a substation. Six people in boiler suits round a pan the size of a cartwheel. ${say('A linewoman, Mrs. Ulla Truscott, stirring', `Friday pan. We take it in, we leave it on the end of the counter, we go. No label. They've labelled the salt in there. If we put a name on this, somebody'd have to decide if it was allowed.`)} ${say('A lineman', `Thirty years ago, you came off a night on the lines, the office cooked you breakfast. Chairwoman and all. He stopped it. So we've turned it round. We cook for the office.`)} ${say('Mrs. Truscott', `They've never said thank you. Not once in four years. It's always gone by one.`)}`,
    [
      ch(`"What's in it?"`, out(`${say('Mrs. Truscott', `Whatever's going. Barley. Onions. What the allotment gave.`)} She hands you a bowl. Your lead's bond goes up a step.`, bondUp(1, 'lead'), flag('galactic-pan'))),
      ch('"Why feed them?"', out(`${say('Mrs. Truscott', `Because they're thin, love. I don't mean in the body.`)} She hands you a bowl. Your lead's bond goes up a step.`, bondUp(1, 'lead'), flag('galactic-pan'))),
      ch('"Can I add something?"', out(`She holds out the spoon.`, room('gx-unlabelled-pan-2'))),
    ]),
  ev('gx-unlabelled-pan-2', 'The Unlabelled Pan', 'Evil Teams', { room: true, cast: ['boss.npc_lady'], tint: '#3a3428' }, `What goes in?`,
    [
      ch('A Berry.', out(`It goes in. At one o'clock, in the canteen, somebody says: "It's different." It's the first remark about food in four years. She hands you a bowl; your lead's bond goes up a step.`, lose('oran-berry'), bondUp(1, 'lead'), flag('galactic-pan'), flag('galactic-pan-berry')), { requires: [has('oran-berry')] }),
      ch('Honey.', out(`It goes in. Three people in the canteen go back for more. Nobody's gone back before. She hands you a bowl; your lead's bond goes up a step.`, lose('honey'), bondUp(1, 'lead'), flag('galactic-pan'), flag('galactic-pan-honey')), { requires: [has('honey')] }),
      ch('Something from another region.', out(`A Lava Cookie, crumbled in. In the canteen, a Grunt stops with the spoon in the air. "...I've had that. I had that on a holiday." He remembers the holiday. He's no use all afternoon. She hands you a bowl; your lead's bond goes up a step.`, lose('lava-cookie'), bondUp(1, 'lead'), flag('galactic-pan'), flag('galactic-pan-holiday')), { requires: [has('lava-cookie')] }),
      ch('Nothing, after all.', out(`She hands you a bowl anyway. Your lead's bond goes up a step.`, bondUp(1, 'lead'), flag('galactic-pan'))),
    ]),
  // S8. Checking the Sky
  ev('gx-checking-sky', 'Checking the Sky', 'Evil Teams', { requires: [...gx(3), night], cast: [JUPITER], tint: '#141a2e' },
    `A flat roof. A cheap telescope on a tripod with one leg taped. A woman with her hat off. ${say('Jupiter, not turning', `If you tell anyone, I'll deny it, and they'll believe me, because I've never been interested in anything.`)} ${say('Jupiter', `I don't believe a word. New world. Please. I filled in the card: "Nothing. I need the pay." It was true. It's four years. D'you know what happens when you pretend to believe something for four years, every day, in a hat?`)} She puts her eye to it. ${say('Jupiter', `You start checking. I bought this in a market. I come up here and I look at where he says it'll tear. And every night it hasn't, I'm—`)} She doesn't say "relieved." ${say('Jupiter', `It's a clear night. That's all.`)}`,
    [
      ch('"What are you looking at, really?"', out(`She lets you look. The weather for the next stage shows on your map.`, intel(2), flag('jupiter-sky'), flag('galactic-sky-forecast'))),
      ch('"And if it does tear?"', out(`${say('Jupiter', `Then I'll've been wrong for four years in the other direction. I'd the pay either way.`)} She lets you look. The weather for the next stage shows on your map.`, intel(2), flag('jupiter-sky'), flag('galactic-sky-forecast'))),
      ch(`"Which one's Jupiter?"`, out(`She swings the tube. She doesn't need to look for it. ${say('Jupiter', `That one. The bright one. It's got a storm on it that's older than the company. I looked that up.`)} A pause. ${say('Jupiter', `I looked that up. I've started looking things up. It's a disgrace.`)} She lets you look. The weather for the next stage shows on your map.`, intel(2), flag('jupiter-sky'), flag('galactic-sky-forecast'))),
    ]),
  // S9. Thirteen
  ev('gx-thirteen', 'Thirteen', 'Evil Teams', { requires: gx(4), cast: ['boss.npc_gentleman'], tint: '#22142e', effect: 'fog' },
    `A clockmaker's. Forty clocks, all running, all right. A queue of people holding more. ${say('The clockmaker, Mr. Odhran Yorath', `There's nothing wrong with it, madam. I've had it apart. It keeps time to the second.`)} ${say('A customer', `It chimed thirteen.`)} ${say('Mr. Yorath', `They all did. Tuesday. Once. Every clock in the town; I've forty on the wall and I counted with my own ears. And nobody said. That's what's brought you in, isn't it? Not the clock. That your husband heard thirteen and went on buttering his toast.`)}`,
    [
      ch('"What does thirteen mean?"', out(say('Mr. Yorath', `Nothing a clock means. That's what frightens them.`), room('gx-thirteen-2'))),
      ch('"Is it the clocks or the people?"', out(`${say('Mr. Yorath', `I mend clocks. I've been asked that all week and I've given the clock answer.`)} He takes his glass out of his eye. ${say('Mr. Yorath', `It's the people. A clock's a thing you mind about. Nobody minds. So the hour's gone a bit loose. It's nobody's hour.`)}`, room('gx-thirteen-2'))),
      ch('"Wind one back."', out(`He puts a small clock in your hands. A slow dial.`, room('gx-thirteen-2'))),
    ]),
  ev('gx-thirteen-2', 'Thirteen', 'Evil Teams', { room: true, cast: ['boss.npc_gentleman'], tint: '#22142e' }, `A small clock in your hands, and a slow dial.`,
    [
      ch('Wind it with care.', out(`It ticks. One person in the queue looks up at the sound. Then another. "Is that the time? I'm late." It's the first hurry in the town for a week. The rest here heals in full, whatever the brownout.`, heal(1), flag('galactic-thirteen-wound'))),
      ch('Leave it.', out(`He gives you a small brass bell instead: a Thirteenth Chime. Held, its holder isn't touched by the Zero Hour.`, flag('galactic-thirteenth-chime'))),
    ]),
  // S10. The Barber of Sunyshore
  ev('gx-barber', 'The Barber of Sunyshore', 'Evil Teams', { requires: gx(4), cast: ['boss.npc_gentleman'], tint: '#3a3428' },
    `A barber's pole. One chair. One customer in forty years who walked out with half a haircut. ${say('The barber, Mr. Talfryn Hadleigh', `You'll want to know about the boy. They all do, since the news. I've told it so often I've got it down to a size.`)} ${say('Mr. Hadleigh', `He'd have been seven. His grandfather brought him. Sat like a post. I'd the cape on, I'd the comb in, and I said what I say: "And how's school?"`)} ${say('Mr. Hadleigh', `He said: "Why do you need to know?" Not rude. He wanted the reason. I'd none. I said, "Just making talk." He said, "Then I needn't answer." And I laughed, and I said, "Fair enough, and what's your favourite subject?"`)} ${say('Mr. Hadleigh', `He got down. Half done. One side long. He walked home like that. His grandfather paid me the full cut and apologised, and I said no harm.`)} ${say('Mr. Hadleigh', `There was harm. I asked a child a second question after he'd told me plain he'd rather not have the first. I've cut hair in silence since. Forty years. People think it's a style.`)}`,
    [
      ch('"It was one question."', out(`${say('Mr. Hadleigh', `It was one too many. That's the whole of it.`)}`, flag('galactic-lore-barber'))),
      ch('"What would you say to him now?"', out(say('Mr. Hadleigh', `Nothing. I'd finish the other side.`), flag('galactic-lore-barber'))),
      ch('"A cut, please. In silence." (a rest)', out(`He does it without a word. It takes a rest. At the end, he holds up the mirror, and doesn't ask if that's all right.`, heal(1), flag('galactic-lore-barber'))),
    ]),
  // S11. His Card (inside a Galactic raid's side room; or, on the inside route, any visit to Wynn after Act 3)
  ev('gx-his-card', 'His Card', 'Evil Teams', { requires: gx(5), cast: [SCI], tint: '#2a3240' },
    `The Intake Room. A cabinet. Five hundred and six tabs, alphabetical, in one hand. A drawer at the bottom with no letter on it. ${say('Wynn Oakeshott', `That's not filed. It came in before there was a system. It's the first one. I've never known where it goes.`)} One card. The print's the trial run: the question's slightly crooked. WHAT WOULD YOU LIKE TO STOP? One word, in a hand that's since got smaller: SUPPER.`,
    [
      ch('"Supper?"', out(`${say('Wynn', `I thought it was a joke. He doesn't joke. I thought, then, it was a test of the pen.`)} She turns it over. Nothing. ${say('Wynn', `A person doesn't want supper stopped. A person wants— whatever happened at it.`)}`, flag('galactic-card-his'))),
      ch('"Whose is it?"', out(`She doesn't answer. She doesn't have to.`, flag('galactic-card-his'))),
      ch('(Take it.)', out(`It fits in a pocket. Wynn doesn't stop you. The drawer is empty again.`, flag('galactic-card-his'))),
      ch('"Being called down. Being asked, across a table."', out(`${say('Wynn', `...Then it's not "supper." It's "questions." He's built all this to get out of one meal.`)} She takes a blank tab. She writes, slowly: C. She files it. First drawer. In order, at last.`, flag('galactic-card-his'), flag('galactic-card-filed')), { requires: [flagIs('galactic-lore-barber')] }),
    ]),
];

// S12. Four More: four of the eleven who voted for the charter, one per town, any order (Sinnoh stages 5 to 8).
const member = (k: string, name: string, line: string, moved: string, needs: Json[], label: string): Json =>
  ev(`gx-board-${k}`, `Four More: ${name}`, 'Evil Teams', { requires: gx(4), cast: ['boss.npc_gentleman'], tint: '#2e3440' }, line,
    [
      ch(label, out(moved, flag(`board-${k}`)), { requires: needs }),
      ch('Leave them to think.', out(`They thank you for coming, and don't move.`)),
    ]);
const BOARD: Json[] = [
  member('ainsley', 'Mr. Ainsley', `Hearthome. Mr. Lowri Ainsley, finance: ${say('Mr. Ainsley', `I voted for it because the numbers were right. They're still right. That's the horrible thing.`)}`, `You show him the pensions: five hundred and six, set up for people who aren't coming. He reads the total twice. He'll vote.`, [flagIs('galactic-next-of-kin')], 'Show him the pensions.'),
  member('quillan', 'Miss Quillan', `Canalave. Miss Kerensa Quillan, legal: ${say('Miss Quillan', `"To complete the world." I drafted that. I thought it was a slogan.`)}`, `You show her the last page of the plan. She reads "No observer persists" aloud, and puts her pen down. She'll vote.`, [{ kind: 'flag', key: 'galactic-last-page', atLeast: 1, atMost: 99 }], 'Show her the last page.'),
  member('nettleship', 'Mr. Nettleship', `Floaroma. Mr. Zennor Nettleship, the Windworks: ${say('Mr. Nettleship', `I'd a brass band to disband. I signed it. My wife plays tuba.`)}`, `You show him the Works Band Badge. ${say('Mr. Nettleship', `Birgit's still going? ...Don't tell her how I voted.`)} She knows. He'll vote.`, [flagIs('galactic-band')], 'Show him the badge.'),
  member('islay', 'Dame Petronel', `Snowpoint. Dame Petronel Islay, the oldest: ${say('Dame Petronel', `I voted yes because Signe voted no, and I'd been voting against Signe since school.`)}`, `You give her Mrs. Holmgren's flask, lent. ${say('Dame Petronel', `Oh, give it here. She's put too much sugar in. She always did.`)} She'll vote.`, [flagIs('galactic-lore-holmgren')], `Lend her Mrs. Holmgren's flask.`),
];
// The Lecture's students count too: the last page read out loud is the last page.
const SIX: Json[] = [
  ev('gx-board-six', 'Six Votes', 'Evil Teams', { requires: [...gx(4), flagIs('board-ainsley'), flagIs('board-quillan'), flagIs('board-nettleship'), flagIs('board-islay'), flagIs('board-six', 0, 0)], cast: [HOLMGREN], tint: '#2e3440' },
    `A tearoom, booked for the afternoon. Four board members, Mrs. Holmgren and her one share, and one more: your seat, if you have one, or Saturn's proxy in a sealed envelope. Six.`,
    [
      ch('Call the meeting.', out(`The Windworks' draw is cut by a board order. The brownout eases. Cyrus's memo in reply: "Noted. Insufficient."`, flag('board-six'), story({ heat: -1 }))),
      ch('Call the meeting, and revoke the licences.', out(`The licences are revoked. The three go free. ${say('Charon', `You've outvoted me on a mountain and now in a tearoom. I'm beginning to take it personally.`)}`, flag('board-six'), flag('galactic-three-freed'), ...kind(2)), { requires: [flagIs('sinnoh-licensed')] }),
    ]),
];
// The Barber's line can be said to Cyrus, on the inside route, when he talks about questions.
const SAID: Json[] = [
  ev('gx-other-side', 'The Other Side', 'Evil Teams', { requires: [{ kind: 'evil', team: 'galactic', after: 5, inside: true }, { kind: 'region', ids: ['sinnoh'] }, flagIs('galactic-lore-barber'), flagIs('galactic-other-side', 0, 0)], cast: [BOSS], tint: '#1a2230' },
    `Cyrus, in a corridor, on his way somewhere, alone.`,
    [
      ch(`"He'd finish the other side."`, out(`${say('Cyrus', `...Hadleigh. I walked home lopsided. My mother asked eleven questions about it.`)} A pause. ${say('Cyrus', `He's not spoken since? Forty years.`)} Another. ${say('Cyrus', `That's disproportionate. I only wanted the one question fewer.`)}`, flag('galactic-other-side'))),
      ch('(Let him pass.)', out(`He passes.`)),
    ]),
];

export const EVENTS: Json[] = [...S, ...BOARD, ...SIX, ...SAID];
export const REMOVE: string[] = [];
