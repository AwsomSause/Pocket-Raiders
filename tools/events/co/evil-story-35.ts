// Catalog Overhaul Pack, Evil Teams Volume III: Alola, twelve scenes for any player, inside either team or out of both
// (TEAM_SKULL_AETHER_ALOLA_FULL_3 part A, AL1 to AL12): six on Skull's side of the story, six on Aether's. Key Items are
// run flags (potown-path-known, guzma-staff, aether-chalk, acerola-letter): the inside routes and the endings read them,
// and each has a short hand-over scene here (the staff to Guzma, the chalk to Zia, the letter to Wicke).
import { $, bondUp, ch, ev, flag, flagIs, heal, inRegion, lose, money, out, room, type Json } from '../dsl.ts';
import { kind, prompt, STEALTH } from './_evil-story-kit.ts';

export const CATEGORY = 'evil-story';

const say = (who: string, line: string): string => `${who}: "${line}"`;
const AL = inRegion('alola');
/** The run is in Alola and its story has reached this far (either team's; either route). */
const al = (after: number): Json[] => [{ kind: 'evil', after, anyRoute: true }, AL];
const intel = (n: number): Json => flag('intel', n);
const RAIN = '#2a2a34';
const WHITE = '#c8c0a0';
const KOA = 'trainer.pr/skull_grunt_m';
const ZIA = 'trainer.pr/aether_grunt_f';
const GRUNT = 'trainer.pr/skull_grunt_m';
const GUZMA = 'boss.guzma';
const WICKE = 'boss.wicke';

// ---------- AL1. You've Arrived ----------
const CAV = `He gives you a brochure: PO TOWN. YOU'VE ARRIVED. On the back, in his hand, a sketch map: where the path was.`;
const AL1 = ev('al-youve-arrived', `You've Arrived`, 'Evil Teams', { requires: al(2), cast: ['boss.drive/alolan-usum-gentleman', GRUNT], tint: RAIN, effect: 'rain' },
  `Rain. A man of seventy in a blazer, with a clipboard in a plastic bag, being waved through Po Town's gate by a Grunt who doesn't look up. ${say('Mr. Sylvester Cavendish', `I'm expected. Thursdays. I inspect the show home. I was Mr. Norcross's last man on site; nobody's told me to stop.`)} ${say('Mr. Cavendish', `Forty villas. I never sold one. Thirty years in property and that's my record: nought. It rained on every viewing. People'd stand in that square under my umbrella and say, 'It's very grey, isn't it,' and I'd say, 'It's unseasonal.' For eleven months.`)} ${say('Mr. Cavendish', `Then the young people moved in. I came up to evict them. I'd a letter. The big one with the bat opened the door and said, 'What's your name.' I told him. He said, 'You ate?'`)} ${say('Mr. Cavendish', `I've had Thursday supper here six years. It's the only time the place has ever been lived in. I put that in my report. 'Occupancy: full.' Nobody reads it. There's nobody to read it.`)}`,
  [
    ch('"Why did it rain?"', out(`${say('Mr. Cavendish', `The wall. There was a path. Old; you'd not have seen it. I said to Mr. Norcross: there's a path. He said, paths don't have title.`)} ${CAV}`, flag('alola-lore-potown'), flag('potown-path-known'))),
    ch(`"What's in the report?"`, out(`He takes it out of the plastic bag and shows you. Six years of Thursdays, one line each. "Occupancy: full." ${CAV}`, flag('alola-lore-potown'), flag('potown-path-known'))),
    ch('"Who owns it now?"', out(`${say('Mr. Cavendish', `The bank that took Norcross. Then a bank that took that bank. Then, four years ago, a holding company with a white logo. They've never sent anyone. They pay the rates.`)} Aether owns Po Town outright. ${CAV}`, intel(3), flag('alola-lore-potown'), flag('potown-path-known'), flag('alola-aether-owns-potown'))),
  ]);

// ---------- AL2. Ten ----------
const AL2 = ev('al-ten', 'Ten', 'Evil Teams', { requires: al(2), cast: [GRUNT, KOA], tint: RAIN },
  `A Pokémon Center that was never opened. Dust sheets. Two Grunts behind the counter in paper hats they've made. ${say('Grunt A', `Yo, welcome to the Pokémon Center! That'll be ten.`)} ${say('Grunt B', `We ain't got the machine. Machine never came. We got a couch.`)} ${say('Grunt A', `And a book.`)} He holds it up. FIRST AID FOR POKÉMON: A HOME GUIDE. It's very thumbed. ${say('Grunt A', `I'm on chapter nine. I can do sprains. I can do a really good sling.`)} ${say('Grunt B', `Ten gets you the couch, a sling if you need it, and Kimo here tells you it's gonna be okay. He's good at that part. He practised on us.`)} The Honest Trade Card: ₽10. A rest. It heals a quarter. It isn't a real Center. He means it.`,
  [
    ch('Pay the ten. (₽10)', out(`The couch. A sling, on whichever of your Pokémon looks sorriest. ${say('Kimo', `It's gonna be okay.`)} It's said with such conviction that it is.`, $(-10), heal(0.25), bondUp(1), flag('alola-ten-paid')), { requires: [money(10)] }),
    ch(`"Where'd you learn?"`, out(`${say('Kimo', `My Rattata got sick, back home. Center was two villages off. I didn't know what to do. I ain't ever not gonna know what to do again.`)}`)),
    ch('Give them a real Potion.', out(`They look at it. ${say('Grunt B', `Yo. Is that— it's full.`)} They put it on a shelf, behind glass. They don't use it. It's for emergencies. Someone else's.`, lose('potion'), ...kind(1), flag('alola-ten-potion')), { requires: [{ kind: 'item', id: 'potion' }] }),
  ]);

// ---------- AL3. Rhymes with Plumeria ----------
const wall = (line: string, reply: string, ...fx: Json[]): Json => ch(line, out(`${reply} It goes on the wall. Eight feet high, on the Po Town road, for the rest of the run.`, flag('skull-rep', 5), flag('alola-x-bars'), ...fx));
const AL3 = [
  ev('al-rhymes-plumeria', 'Rhymes with Plumeria', 'Evil Teams', { requires: al(2), cast: [GRUNT, KOA], tint: '#3a3a44' },
    `A wall. A Grunt with a spray can, not spraying. A notebook open on a bin. ${say('Tupp', `Yo. I'm writin' a tribute. For Big Sis. It's her day. We don't know when her birthday is; she won't say; so we picked one.`)} ${say('Tupp', `I got the first line. 'Yo, Big Sis, Plumeria—' and then I been here two hours.`)} Rapp, on the kerb, not looking up from a malasada: ${say('Rapp', `Tell them what you've got.`)} ${say('Tupp', `'Wisteria.' 'Bacteria.' 'Cafeteria.'`)} ${say('Zipp', `Cafeteria!`)} ${say('Rapp', `He likes 'bacteria.' I've said no.`)} Pick the second line.`,
    [
      wall(`"—you're the whole cafeteria."`, `${say('Tupp', `'Cause she feeds us! Yo, that's deep.`)} ${say('Rapp', `...It's actually not the worst.`)}`, flag('alola-bars-cafeteria')),
      wall(`"—nobody's superior."`, `${say('Rapp', `That scans.`)} ${say('Tupp', `What's 'scans.'`)}`, flag('alola-bars-superior')),
      wall(`"—we were lost in the interior."`, `Nobody says anything for a second. Zipp, quietly: "Interior."`, flag('alola-bars-interior')),
      wall(`"—fights off bacteria."`, `${say('Rapp', `No.`)} It goes up anyway. Tupp's delighted.`, flag('alola-bars-bacteria')),
    ]),
  ev('al-rhymes-plumeria-2', 'Rhymes with Plumeria', 'Evil Teams', { requires: [...al(3), flagIs('alola-x-bars')], cast: ['boss.plumeria'], tint: '#3a3a44' },
    `Plumeria, in front of the wall, looking at it, arms folded. ${say('Plumeria', `Who did this.`)} A long time. ${say('Plumeria', `...It ain't even my birthday.`)}`,
    [ch('(Say nothing.)', out(`She doesn't have it painted over.`, flag('alola-bars-kept')))]),
];

// ---------- AL4. It Wouldn't ----------
const AL4 = [
  ev('al-it-wouldnt', `It Wouldn't`, 'Evil Teams', { requires: al(2), cast: [KOA], pokemon: 'fomantis', tint: '#1a2a1a' },
    `The foot of a jungle path on Akala. A girl of seventeen in a bandana, sitting on the trial gate, which is closed. A Fomantis on her knee. ${say('Nohea', `I ain't vandalisin' it. I'm sittin' on it. There's a difference.`)} ${say('Nohea', `I took it two years back. Got to the Totem. And Momi here: she just wouldn't. She looked at that thing, it's six times her size, and she got behind my leg. And everybody's watchin'. And the captain says, 'Send it out.'`)} ${say('Nohea', `I said no. She's scared. I ain't sendin' her. He said, 'Then that's a fail.' I said, 'Okay.' I walked down. I been thinkin' ever since: I chose that. That ain't failin'. That's choosin' her over a stamp.`)} ${say('Nohea', `Nobody's got a word for that. There's 'pass' and there's 'next.'`)}`,
    [
      ch('"You were right."', out(`She looks at you a long time. ${say('Nohea', `...Yeah. I was.`)} Something moves in the trees.`, flag('alola-notyet'), room('al-it-wouldnt-wait'))),
      ch('"Is she still scared?"', out(`${say('Nohea', `Nah. She's fought plenty since. She just wasn't ready that day. Nobody asked if she was ready. It's a set date.`)} Something moves in the trees.`, flag('alola-notyet'), room('al-it-wouldnt-wait'))),
      ch('"What would you call it?"', out(`She thinks. ${say('Nohea', `'Not yet.' That's all it was. 'Not yet.' You'd think there'd be a stamp for that.`)} Something moves in the trees.`, flag('alola-notyet'), room('al-it-wouldnt-wait'))),
    ]),
  ev('al-it-wouldnt-wait', `It Wouldn't`, 'Evil Teams', { room: true, cast: [KOA], pokemon: 'lurantis', tint: '#1a2a1a' },
    `The Totem's in the trees.`,
    [
      ch('Wait.', out(`It comes to the gate. It's enormous. It looks at the Fomantis. The Fomantis looks back. It doesn't hide. ${say('Nohea', `...Huh. It remembers her.`)} The Totem lowers its head. It's not a challenge. It's a hello.`, flag('alola-notyet-totem'), ...kind(1))),
      ch('Go.', out(`You leave her on the gate, with Momi on her knee.`)),
    ]),
];

// ---------- AL5. Next ----------
const AL5 = ev('al-next', 'Next', 'Evil Teams', { requires: al(2), cast: ['boss.kiawe'], tint: '#2a3a2a' },
  `A porch on Melemele. A man of thirty with a ledger: a real one, the island challenge's roll. He's running a finger down a column. ${say('Captain Kainoa', `The roll. Everybody who's stood my trial. Date. Result. There's a column for 'returned.' I've been looking at it.`)} ${say('Captain Kainoa', `Six years of it. Two hundred and eleven took it. A hundred and sixty passed. Fifty-one didn't.`)} ${say('Captain Kainoa', `'Returned': four.`)} ${say('Captain Kainoa', `Nobody's barred. I'd take any of them. I'd take them tomorrow. I thought— I assumed if they wanted it, they'd come back. Forty-seven kids didn't want it? That's not right. That can't be right.`)}`,
  [
    ch('"What do you say, when they fail?"', out(`${say('Captain Kainoa', `'Next.' It's— there's a queue. It's not unkind. It means the next one's up.`)} He hears it. ${say('Captain Kainoa', `...It means the next one's up. And you're not.`)} He starts a letter. It isn't sent yet: he's working out how to ask without it being pity.`, intel(2), flag('alola-captain'))),
    ch('"Have you ever asked one to come back?"', out(`${say('Captain Kainoa', `It's not done. The challenge is the challenger's to take. If I went knocking, it'd be—`)} He stops. ${say('Captain Kainoa', `I was going to say 'pity.' Would it be? Or would it just be asking?`)} He starts a letter. It isn't sent yet.`, intel(2), flag('alola-captain'))),
    ch(`"There's a boy in Po Town who can tell you the date."`, out(`${say('Captain Kainoa', `Ridgeway. Third attempt.`)} He finds the line. He doesn't need to look for long. ${say('Captain Kainoa', `I was talking to somebody. The ferry times. I didn't see the end. I said 'next' to a kid on his third try and I didn't see the end.`)} He starts a letter. It isn't sent yet.`, intel(2), flag('alola-captain'), flag('alola-captain-koa')), { requires: [flagIs('alola-same-job')] }),
  ]);

// ---------- AL6. The One Who Didn't Need It ----------
const AL6 = [
  ev('al-didnt-need-it', `The One Who Didn't Need It`, 'Evil Teams', { requires: al(3), cast: ['boss.hala'], tint: '#2a2a1a' },
    `A kahuna, on his step in Iki Town, with two wooden practice staffs across his knees. One's worn smooth. One's nearly new. ${say('Hala', `I'd two pupils. Fifteen years back. Best I've had. One laughed when he lost. One went white.`)} ${say('Hala', `I'd one place to give. A captaincy. I thought about it a season. I gave it to the one who laughed.`)} ${say('Hala', `My reasoning was this. The one who laughs can carry it lightly. The one who goes white: it'll eat him. I was protecting him from it. That's what I told myself.`)} ${say('Hala', `I've had fifteen years to see it from his side. I picked the one who didn't need it. And I told the one who needed it most that he'd come second. I've thought, since, that I'd the thing backwards.`)}`,
    [
      ch('"Did you tell him why?"', out(`${say('Hala', `No. I said the name of the other boy. In front of the village. That's how it's done.`)} He turns the newer staff over. ${say('Hala', `He left this. He didn't come back for it.`)} He holds it out to you. Guzma's Staff.`, flag('guzma-staff'))),
      ch(`"He's got forty kids now."`, out(`${say('Hala', `I know. I've stood on the Po Town road in the rain and counted the lights. He took in every one the islands dropped. That's a kahuna's work. He's been doing my job in a wet house for six years, without the title, thinking he's a criminal.`)} He holds out the newer staff. Guzma's Staff.`, flag('guzma-staff'))),
      ch('"What would you say to him?"', out(`He doesn't answer for a while. Then he holds out the newer staff. ${say('Hala', `Give him this. He'll know what it says.`)} Guzma's Staff.`, flag('guzma-staff'))),
    ]),
  ev('al-guzma-staff', `Guzma's Staff`, 'Evil Teams', { requires: [...al(3), flagIs('guzma-staff'), flagIs('guzma-staff-given', 0, 0)], cast: [GUZMA], tint: RAIN, effect: 'rain' },
    `Guzma, on the Po Town steps. He sees what you're carrying. ${say('Guzma', `...Where'd you get that.`)}`,
    [ch('"Hala kept it."', out(`${say('Guzma', `He kept it?`)} He weighs it. His hands know it. ${say('Guzma', `Fifteen years. He coulda burned it.`)} "He says he had it backwards." He doesn't answer. He doesn't put it down, either.`, flag('guzma-staff-given')))]),
];

// ---------- AL7. The Barge ----------
const AL7 = ev('al-the-barge', 'The Barge', 'Evil Teams', { requires: al(2), cast: ['trainer.pr/veteran_f'], tint: '#2a3a40' },
  `A rusted hull at a Hau'oli boatyard. A wheelhouse with the glass out. An old woman in faded white overalls, fishing off the stern. ${say('Auntie Mahina', `This was all of it. The whole Foundation. Him, her, me, a tank, a net. I was the first hire. He paid me in fish for a month till the grant came.`)} ${say('Auntie Mahina', `Look at the wall. In there.`)} Chalk. Two columns, in a quick slanting hand. IN. HOME. Tally marks. Hundreds. The columns keep pace all the way down. ${say('Auntie Mahina', `He'd mark 'home' himself. He'd not let anyone else. He'd come back from the reef grinning like he'd been given something.`)} ${say('Auntie Mahina', `She did the 'in.' She was better at the in. She'd sit up three nights with a thing. She'd the gift for it; he'd tell you so. But she'd go quiet on release days. She'd stand at the rail and not wave.`)}`,
  [
    ch('"What happened to the sign?"', out(`${say('Auntie Mahina', `Behind the locker. I'd not let them skip it. I said, it's his writing; you'll not put his writing in a skip.`)} She gives you a stick of the chalk.`, intel(3), flag('aether-sign-seen'), flag('aether-chalk'))),
    ch(`"Why'd she go quiet?"`, out(`${say('Auntie Mahina', `I asked her once. She said, 'I've just got it right, and now it goes.' He said, 'That's what getting it right is, love.' She laughed. She didn't agree.`)} She gives you a stick of the chalk.`, intel(3), flag('aether-sign-seen'), flag('aether-chalk'))),
    ch(`"Why are you still here?"`, out(`${say('Auntie Mahina', `Somebody's got to keep the tally. Nobody's marked 'home' in a long while.`)} She gives you a stick of the chalk.`, intel(3), flag('aether-sign-seen'), flag('aether-chalk'))),
  ]);
const CHALK = ev('al-chalk-zia', 'A Stick of Chalk', 'Evil Teams', { requires: [...al(3), flagIs('aether-chalk'), flagIs('alola-same-job'), flagIs('aether-chalk-given', 0, 0)], cast: [ZIA], tint: WHITE },
  `Zia, in white gloves, between rounds.`,
  [
    ch('Give her the chalk.', out(`She turns it over. ${say('Zia', `From the barge? His?`)} She puts it in her pocket, carefully, as if it might go off.`, flag('aether-chalk-given'))),
    ch('Keep it.', out(`You keep it. She doesn't know you've got it.`)),
  ]);

// ---------- AL8. When Do I Get Her Back ----------
const AL8 = ev('al-get-her-back', 'When Do I Get Her Back', 'Evil Teams', { requires: al(3), cast: ['trainer.pr/scientist_f', 'trainer.pr/preschooler_f'], pokemon: 'rockruff', tint: WHITE },
  `A Pokémon Center. A white desk in the lobby, with a white banner: AETHER FOUNDATION — WE'LL TAKE IT FROM HERE. A woman with a gentle voice. A girl of eight with a Rockruff in a towel. ${say('Curator Pua', `A thorn, is it? In the pad. Poor thing. We've specialists. She'll have the very best.`)} ${say('The girl', `When do I get her back?`)} ${say('Curator Pua', `When she's well, dear.`)} ${say('The girl', `When's that?`)} ${say('Curator Pua', `It's— we don't like to rush them.`)} She's got the form half filled in. There's a box: RETURN TO OWNER. There's another: FOUNDATION CARE (ONGOING). Her pen's over the second. It always goes to the second. It's for the best. ${say('The girl', `It's only a thorn.`)}`,
  [
    ch('(Take the thorn out.)', out(`Tweezers, and a careful hand. The Rockruff licks your wrist. ${say('The girl', `Oh. It was only that.`)} Pua, watching: ${say('Curator Pua', `...It was only that.`)} She looks at her form. She puts it in the bin, quite gently.`, ...kind(1), flag('alola-thorn')), {
      prompt: prompt(STEALTH), fail: out(`Tweezers. It yelps once, and then it's out. The Rockruff licks your wrist anyway. ${say('The girl', `Oh. It was only that.`)} Pua, watching: ${say('Curator Pua', `...It was only that.`)} She looks at her form. She puts it in the bin, quite gently.`, ...kind(1), flag('alola-thorn')),
    }),
    ch('"Tick the first box."', out(`${say('Curator Pua', `It's— out there they only get hurt again.`)} "It's a thorn." She ticks it. Her hand's not used to the motion.`, ...kind(1))),
    ch(`"What's your release rate?"`, out(`${say('Curator Pua', `Ninety-eight per— no. That's recovery. Release is—`)} She doesn't know. She's worked there nine years. ${say('Curator Pua', `I've never been asked. I'll— I'll find out.`)}`, ...kind(1), flag('pua-asked'))),
  ]);

// ---------- AL9. The Post at the Aether House ----------
const AL9 = [
  ev('al-aether-house-post', 'The Post at the Aether House', 'Evil Teams', { requires: al(3), cast: ['boss.acerola'], tint: '#3a3428' },
    `A kitchen on Ula'ula. An eleven-year-old on a stool, stirring something, with a shoebox of envelopes beside the stove. ${say('Acerola', `I write every month. To the Foundation. 'Dear Sirs, the roof.' 'Dear Sirs, the boiler.' 'Dear Sirs, we're nine now, not six.' I keep the copies. I've forty-one.`)} ${say('Acerola', `They used to answer. A lady. Nice handwriting; she did little apologies in the margins. Then it stopped. Four years. Not a 'no.' Just: nothing. A 'no' I could do something with.`)} One envelope's different. It's come back. RETURN TO SENDER. And, stapled to it, a slip nobody meant to enclose: a remittance stub. "ULA'ULA: CHILDREN'S FUND. Monthly. Payee: —" The payee's a jetty. In Po Town.`,
    [
      ch(`"Who's the nice handwriting?"`, out(`${say('Acerola', `I don't know. A lady at the Foundation. W, she signs. Just W.`)} She gives you her forty-second letter, with the stub. ${say('Acerola', `Give it to W. If you find her.`)}`, flag('acerola-letter'))),
      ch('"Let me carry one."', out(`She gives you her forty-second letter, with the stub. ${say('Acerola', `Don't read it. It's mostly about the boiler.`)}`, flag('acerola-letter'))),
      ch(`"D'you know where the money goes?"`, out(`${say('Acerola', `To children. On Ula'ula. That's what it says.`)} She reads the stub. She's eleven; she's quick. ${say('Acerola', `...There's two lots of children on Ula'ula with nobody. They've picked the other one. Why'd they— we don't make any noise.`)} She gives you the letter, with the stub.`, intel(2), flag('acerola-letter'))),
    ]),
  ev('al-acerola-letter-wicke', `Acerola's Forty-Second Letter`, 'Evil Teams', { requires: [...al(3), flagIs('acerola-letter'), flagIs('aether-house-found', 0, 0)], cast: [WICKE], tint: WHITE },
    `Wicke, at a desk with a pile of forms.`,
    [ch('Give her the letter.', out(`She reads it. ${say('Wicke', `I sign this. Every month. I thought— it says children's fund. I thought it was you.`)} She turns the stub over. She knows the hand that changed the payee. ${say('Wicke', `Faba.`)} A pause. ${say('Wicke', `Oh, Acerola. Forty-one letters. I never saw one.`)} She sits down and writes back. Three pages. There are little apologies in the margins. From the next stage, the Aether House is funded. And Wicke starts reading what she signs.`, ...kind(1), flag('aether-house-found')))]),
];

// ---------- AL10. Chosen ----------
const AL10 = ev('al-chosen', 'Chosen', 'Evil Teams', { requires: al(3), cast: ['boss.lillie-z'], tint: '#4a3a4a' },
  `A clothes shop in Hau'oli. A rail of dresses. A girl in white, holding two hangers, entirely stuck. A bag on the floor beside her, which sneezes. ${say('Lillie', `I'm— could you— I can't tell which I like.`)} ${say('Lillie', `Mother chose. Until I was eleven; and after that I just went on wearing what she'd chosen, because I didn't know how to do the other thing. I've never bought a piece of clothing. I've been in here forty minutes. The lady thinks I'm going to steal something.`)} ${say('Lillie', `How do you know? Which you like? Is there a feeling? I keep thinking: which would she pick. And then: which would she hate. Neither of those is me.`)}`,
  [
    ch('"The left one."', out(`She buys it. She's grateful. It's still somebody else choosing. She knows. ${say('Lillie', `Thank you. Next time I'll— next time.`)}`)),
    ch('"The right one."', out(`She buys it. She's grateful. It's still somebody else choosing. She knows. ${say('Lillie', `Thank you. Next time I'll— next time.`)}`)),
    ch('"Neither. Try a third."', out(`She looks along the rail. She takes down something she'd not have dared. It's not white. ${say('Lillie', `...Oh. Oh. Is that it? Is that the feeling?`)}`, flag('lillie-chose'))),
    ch(`"I'm not going to tell you."`, out(`She's almost cross. ${say('Lillie', `That's not helpful.`)} "No." A long time. The bag sneezes again. She puts both back. She walks the whole rail. She comes back with a hat. ${say('Lillie', `I don't know why. I just want it.`)} "That's the feeling."`, ...kind(1), flag('lillie-chose'))),
  ]);

// ---------- AL11. The Third ----------
const MASK = 'al-the-third-mask';
const AL11 = [
  ev('al-the-third', 'The Third', 'Evil Teams', { requires: al(4), cast: ['trainer.pr/scientist_m'], pokemon: 'type-null', tint: '#1a2230', effect: 'fog' },
    `A workshop off Aether Paradise's conservation wing. Three stands for three heavy helmets. Two are empty. A technician with a soldering iron and a guilty look. ${say('Mr. Nathaniel Ironside', `I made the masks. Three. For the three of them. They were built to fight what's on the other side of the holes; they went wrong; I was told: 'restrain.' So I made something that'd hold.`)} ${say('Mr. Ironside', `The boy took one and ran. Good for him. One's gone to the cold. That leaves—`)} Behind a mesh door: something large, in a helmet too heavy for its neck, lying with its head on its forefeet. It's looking at the door. ${say('Mr. Ironside', `It doesn't do anything. It's not angry. The file says 'failed.' I've been feeding it for two years and I can't work out what it's failed at.`)}`,
    [
      ch('"Take the mask off."', out(`It's got a catch. Mr. Ironside built it. He knows where.`, room(MASK))),
      ch('"What does it do all day?"', out(`${say('Mr. Ironside', `Watches the door. I thought: waiting for orders. Then I noticed. It's not the lab door. It's that one.`)} A small door, at the back. Child height. Painted over. ${say('Mr. Ironside', `That went to the family floor. The children used to come through. Before.`)}`, room(MASK))),
      ch('"The boy named his."', out(`${say('Mr. Ironside', `Did he.`)} He looks at the thing in the mesh. ${say('Mr. Ironside', `Two years I've called you 'Three.'`)}`, room(MASK))),
    ]),
  ev(MASK, 'The Third', 'Evil Teams', { room: true, cast: ['trainer.pr/scientist_m'], pokemon: 'type-null', tint: '#1a2230' },
    `The mask has a catch. Mr. Ironside knows where.`,
    [
      ch('Take it off.', out(`It's the only one that hasn't had it off. It lifts its head. It's lighter than it expected; it overbalances. It looks at you. It looks at the small door. It goes to the door and sits by it. It's still waiting. It's just more comfortable.`, ...kind(1), flag('null-three-free'))),
      ch('Name it.', out(`You give it a name. Mr. Ironside writes it on the stand, in capitals, and underlines it.`, ...kind(1), flag('null-three-named'))),
      ch('Tell Lillie.', out(`${say('Lillie', `There's a third? Awake? It used to— there was something behind that door that breathed. I thought I'd imagined it. I used to push biscuits under.`)} She goes. She opens the small door from the other side.`, ...kind(2), flag('null-three-lillie'))),
    ]),
];

// ---------- AL12. Wednesday (a Visit: the same Town node, three times) ----------
const AL12 = [
  ev('al-wednesday-1', 'Wednesday', 'Evil Teams', { requires: [...al(4), flagIs('potown-path-known')], cast: ['trainer.pr/skull_grunt_f'], tint: RAIN, effect: 'rain' },
    `Po Town. A stretch of wall like any other. Rain. Lux, with a stick, scratching at the foot of it: ${say('Lux', `There's steps under here. Old ones. Going through.`)}`,
    [ch('Dig.', out(`A flagstone. Another. They go under the wall and stop.`, flag('potown-wednesday-1')))]),
  ev('al-wednesday-2', 'Wednesday', 'Evil Teams', { requires: [...al(4), flagIs('potown-wednesday-1')], cast: [GUZMA], tint: RAIN, effect: 'rain' },
    `Guzma, with a bat, looking at a wall. ${say('Guzma', `Cavendish says there's a path. Says the guardian used it. Says that's why it rains.`)} A pause. ${say('Guzma', `I been lookin' for somethin' it's okay to smash for six years.`)}`,
    [ch('Hand him the first swing.', out(`He takes the wall down across the width of the path. Nothing else. He's very exact. Forty kids carry the blocks. ${say('Plumeria', `Stack 'em. That's a bench.`)}`, flag('potown-wednesday-2')))]),
  ev('al-wednesday-3', 'Wednesday', 'Evil Teams', { requires: [...al(5), flagIs('potown-wednesday-2')], cast: [GRUNT], tint: RAIN, effect: 'rain' },
    `A gap in a wall. Wet steps, going through, up toward the mountain. Something's used them. Hoofprints, in the mud, very large.`,
    [ch('Wait.', out(`It's a Wednesday. The rain thins. It doesn't stop like a tap; it stops like someone leaving a room. The square's dripping. There's a colour in the sky nobody in Po Town's seen from Po Town. ${say('Rapp', `...What's that noise.`)} ${say('Tupp', `What noise.`)} ${say('Rapp', `That's the noise. There isn't one.`)} She opens a window. On the bench made of wall, something's left a berry the size of a Bulu's head. Nobody saw it put there. On Thursday, Mr. Cavendish stands in a dry square with his umbrella down for the first time in thirty years. ${say('Mr. Cavendish', `'It's unseasonal,' I used to say.`)} He writes in his report: "Weather: fine. Occupancy: full. Recommend: no action."`, heal(1), ...kind(1), flag('potown-wednesday')))]),
];

export const EVENTS: Json[] = [AL1, AL2, ...AL3, ...AL4, AL5, ...AL6, AL7, CHALK, AL8, ...AL9, AL10, ...AL11, ...AL12];
export const REMOVE: string[] = [];
