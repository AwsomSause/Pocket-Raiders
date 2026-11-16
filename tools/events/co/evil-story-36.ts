// Catalog Overhaul Pack, Evil Teams Volume III: Galar, Macro Cosmos and Team Yell from inside (EVIL_TEAMS_VOLUME_3_C
// "Galar", MACRO_COSMOS_YELL_GALAR_FULL_1 part B, FULL_3 parts B to D, EVIL_TEAMS_VOLUME_3_D "Galar"). Galar's story team
// is Team Yell (evilTeams.json); Macro Cosmos is not a team of its own there, so both inside routes run on Yell's meters
// and the side is a flag: `galar-side-mc` (Junior Executive, Future Planning) or `galar-side-yell` (the Honorary Yeller).
// Yell's Offer comes from the files, as every team's does; Macro Cosmos's comes after the first stadium. Taking one closes
// the other. Every Act is written twice (`mc-` and `yl-`), and the two meet in a chip shop. The Final Choice, the endings
// and Team Encore are in evil-story-37.ts; the twelve scenes for any player in evil-story-38.ts.
import { bondUp, ch, ev, fight, flag, flagIs, inRegion, out, room, trainer, type Json } from '../dsl.ts';
import { evil as story, foe, kind, STEALTH, prompt } from './_evil-story-kit.ts';

export const CATEGORY = 'evil-story';

type Side = 'mc' | 'yl';
const ROSE = 'trainer.pr/rose';
const OLEANA = 'trainer.pr/oleana';
const ZANE = 'boss.drive/galarian-swsh-office-worker-man';
const SHAY = 'boss.drive/galarian-swsh-office-worker-woman';
const YG = 'boss.drive/galarian-swsh-yell-grunt-man';
const BECK = YG;
const KAYA = 'boss.drive/galarian-swsh-artist-man';
const SHAZ = 'trainer.pr/musician';
const PIERS = 'boss.piers';
const MARNIE = 'boss.marnie-masters4';
const BEDE = 'boss.bede';
const OLDROYD = 'trainer.pr/veteran_m';
const HOLLIS = 'boss.drive/galarian-swsh-leaguestaff-man';
const TOWER = '#1e2430';
const SPIKE = '#1a141c';
const G = inRegion('galar');
const say = (who: string, line: string): string => `${who}: "${line}"`;
const sideFlag = (s: Side): string => (s === 'mc' ? 'galar-side-mc' : 'galar-side-yell');
const inside = (s: Side, o: Json = {}): Json[] => [{ kind: 'evil', team: 'yell', inside: true, ...o }, G, flagIs(sideFlag(s))];
const mark = (m: string): Json => story({ mark: m });
const meters = (standing: number, suspicion = 0, rank?: number): Json => story({ ...(standing ? { standing } : {}), ...(suspicion ? { suspicion } : {}), ...(rank ? { rank } : {}) });
const beat = story({ beat: true });
const quiet = (): Json[] => [meters(1, 1), ...kind(1)];
const intel = (n: number): Json => flag('intel', n);
const night: Json = { kind: 'period', in: ['night'] };
const sus = (s: Side, atLeast: number, below = 11): Json => ({ kind: 'evil', team: 'yell', inside: true, suspicion: atLeast, ...(below <= 10 ? { suspicionBelow: below } : {}) });
const stand = (atLeast: number): Json => ({ kind: 'evil', team: 'yell', inside: true, standing: atLeast });
const final = (s: Side): Json => room(`${s}-final-choice`);

// ---------- The two Offers (Galar Stage 2, Step 12) ----------
const offerOf = (s: Side): Json[] => {
  const id = s === 'yl' ? 'evil-yell-offer-galar' : 'evil-mc-offer-galar';
  const offered = flag('galar-offered');
  const yes = s === 'yl'
    ? ch('"Yes."', out(`"Get in! Mind the shutter!" A horn, pressed into your hands. You're in Team Yell now, on the inside. Nobody outside knows it.`, mark('inside'), flag(sideFlag(s)), offered))
    : ch('"Yes."', out(`A lanyard, on a ribbon. ${say('Oleana', `Don't lose the lanyard.`)} You're in Macro Cosmos now: Junior Executive, Future Planning. Nobody outside knows what that means.`, mark('inside'), flag(sideFlag(s)), offered));
  const report = ch('"Yes." (And tell the International Police.)', out(`You say yes. That night, in a Wyndon café, you say it again to a man in a brown coat who calls himself Looker. ${say('Looker', `So. You will be my eyes. Be careful.`)} You have a handler now. Every careless step counts double.`, mark('inside'), mark('inside-man'), flag('galar-looker-met'), flag(sideFlag(s)), offered));
  const no = ch('"No."', out(s === 'yl' ? `"Fair enough. You're still dead good." He goes off to find his coach. Team Yell goes on as it was, with you on the outside of it.` : `${say('Oleana', `Noted.`)} She doesn't look up. The lanyard goes back in a drawer.`, flag(s === 'yl' ? 'galar-yell-refused' : 'galar-mc-refused'), offered));
  const intro = s === 'yl'
    ? `After they've blocked a road. A Yeller, hoarse: "You're dead good. Not as good as our Marnie. Nobody's as good as our Marnie. D'you want a horn? We've spare horns."`
    : `After the first stadium. Oleana, not looking up from a tablet: ${say('Oleana', `The Chairman's noticed you. He notices forty people a day. He's remembered you. That's the rarer thing. There's a lanyard. Don't lose the lanyard.`)}`;
  const cast = s === 'yl' ? [YG] : [OLEANA];
  const what = ch('"What would I be doing?"', out(s === 'yl' ? `"Shoutin'. Mostly shoutin'. Bein' her crowd. Everywhere."` : `${say('Oleana', `Future Planning. It's a department of one. He invented it on Tuesday.`)}`, room(`${id}-2`)));
  const first = s === 'yl'
    ? ev(id, 'The Offer', 'Evil Teams', { room: true, cast, tint: SPIKE, effect: 'glint' }, intro, [yes, no, what, report])
    : ev(id, 'The Offer', 'Evil Teams', { requires: [{ kind: 'evil', team: 'yell', inside: false, ends: ['none'] }, G, flagIs('galar-mc-refused', 0, 0)], cast, tint: TOWER, effect: 'glint' }, intro, [yes, no, what, report]);
  return [first, ev(`${id}-2`, 'The Offer', 'Evil Teams', { room: true, cast, tint: s === 'yl' ? SPIKE : TOWER }, s === 'yl' ? `"So. You in?"` : `${say('Oleana', `Well?`)}`, [yes, no, report])];
};

// ---------- Act 1, Macro Cosmos: Thursday (stage 3, Wyndon) ----------
const mcAct1: Json[] = [
  ev('mc-act1', 'Thursday', 'Evil Teams', { callback: true, requires: inside('mc', { beat: 2 }), cast: [OLEANA], tint: TOWER, effect: 'glint' },
    `A lobby. Marble. A wall of logos. A printer by reception, running. ${say('Oleana', `Floor thirty-one. Future Planning. It's a department of one; he invented it on Tuesday. You've a desk, a lanyard and a mug. You've not earned the mug. He's given it you on account.`)} The mug: "There's never time. There's only whether you're the one who did it."`,
    [ch('Go up to thirty-one.', out(`Floor 31. Night. Forty desks. Thirty-eight lit.`, room('mc-act1-desk')))]),
  ev('mc-act1-desk', 'Floor Thirty-One', 'Evil Teams', { room: true, cast: [ZANE], tint: TOWER },
    `Zane Ingleby, twenty-six, at the next desk, with four screens and the look of someone who last saw daylight through glass: ${say('Zane', `You're Future Planning. I'm present planning. It's called 'the energy problem.' I've done eighteen-hour days on it for three years. I've never been told what it is.`)} ${say('Zane', `It's a thousand years off. The shortage. I ran it. A thousand. He wants it solved by Thursday. I said, 'Sir, there's time.' He said, 'There's never time, Ingleby, there's only whether you're the one who did it.' I've got that on a mug now. He gave me the mug.`)}`,
    [
      ch('"Which Thursday?"', out(say('Zane', `Every Thursday. It's always Thursday. I asked once why Thursday. Oleana said, 'It's the day the seam ran out.' I don't know what that means. I didn't ask twice.`), flag('ally-zane'), room('mc-act1-rose'))),
      ch('"Why stay?"', out(say('Zane', `He knows my name. He knows my mum's name. He sent flowers when she was ill; he did, not an assistant; the card was in his writing. D'you know how hard it is to leave a man who's wrong about one thing and right about your mum?`), flag('ally-zane'), room('mc-act1-rose'))),
      ch('"Show me the graph."', out(`A line, gently falling, for a very long way. It touches the axis off the edge of the screen. He has to scroll. ${say('Zane', `There. Year three thousand and something. I check it every morning in case it's moved. It's never moved.`)}`, flag('ally-zane'), flag('macro-graph-seen'), room('mc-act1-rose'))),
    ]),
  ev('mc-act1-rose', 'The Chairman', 'Evil Teams', { room: true, cast: [ROSE, ZANE], tint: TOWER },
    `The Chairman comes down. In shirtsleeves. He does this. ${say('Rose', `Future Planning! Splendid. Do you know, I've never had anyone to talk to about the year three thousand. They glaze. You'll not glaze. I can tell.`)} ${say('Rose', `Ingleby, go home. No; you'll not. I never did either. Then have this.`)} A sandwich, from his own pocket, in paper. ${say('Rose', `Cheese and pickle. My mother's way. She'd be ashamed of a man who kept another man late and didn't feed him.`)}`,
    [ch('Take the lanyard.', out(`A lanyard. It opens every floor but fifty.`, flag('macro-inside-act1'), beat))]),
];

// ---------- Act 1, Team Yell: The Away End (stage 3, Spikemuth) ----------
const ylAct1: Json[] = [
  ev('yl-act1', 'The Away End', 'Evil Teams', { callback: true, requires: inside('yl', { beat: 2 }), cast: [YG], tint: SPIKE },
    `A shutter. Half up. A street that's a tunnel. Neon, some of it working. Cheer Captain Gaz, a foghorn with feelings: ${say('Gaz', `OI! It's the dead good one! Get in! Mind the shutter; it sticks! Somebody get 'em a towel!`)} A towel. Black and pink. It's not new. It's been to every stadium in Galar. ${say('Gaz', `That one's been to Wyndon. Twice. Don't wash it.`)}`,
    [ch('Go in.', out(`A lock-up behind the Gym. Camp beds. Banners, drying.`, room('yl-act1-lockup')))]),
  ev('yl-act1-lockup', 'The Lock-Up', 'Evil Teams', { room: true, cast: [BECK], tint: SPIKE },
    `Beck Gallowglass, forty, folding a banner the size of a sail: ${say('Beck', `I were a Gym trainer here. When there were sixty in on a Tuesday. I'd come out under the lights and they'd know me name. 'Go on, Beck!' You never forget that. Somebody you've never met, knowin' your name.`)} ${say('Beck', `No Power Spot, see. Can't Dynamax here. League says no Dynamax, no telly. No telly, no crowd. Town's dyin' on a technicality. So we go be her crowd. Everywhere. Loud. Is it daft? It's daft. It's all I've got.`)}`,
    [
      ch('"Who decided no telly?"', out(say('Beck', `Nobody. That's what does me head in. I went up to Wyndon to ask. Sat in a lobby four hours. Nice lass on the desk said, 'It's in the contract.' I said, whose contract? She said, 'The League's.' I said, who's the League? She give me a leaflet.`), flag('ally-beck'), room('yl-act1-chants'))),
      ch('"What was it like, under the lights?"', out(`He stops folding. ${say('Beck', `Like bein' somebody. Sixty folk. Every one of 'em knew me name.`)}`, flag('ally-beck'), room('yl-act1-chants'))),
      ch('"Why her?"', out(say('Beck', `'Cause she's from here an' she's goin' to leave. She should. An' when she's on that pitch in Wyndon with sixty thousand shoutin' for some lad from Postwick, I want her to look up an' see one towel. That's it. One.`), flag('ally-beck'), room('yl-act1-chants'))),
    ]),
  ev('yl-act1-chants', 'The Chant Book', 'Evil Teams', { room: true, cast: [SHAZ, BECK], pokemon: 'linoone-galar', tint: SPIKE },
    `Chant Leader Shaz, hoarse, with a ring binder: ${say('Shaz', `One for every Pokémon in the town. By name. That's the rule; you don't chant 'Linoone,' you chant Stripes. Learn 'em. There's a hundred and twelve.`)} Three chants, call and response.`,
    [ch('"Stripes!"', out(`"STRIPES!" Then a Morpeko called Biscuit. Then a Scraggy called Our Kev. You learn three names. They'll matter. A towel. A horn. A seat on the coach: fourteen, by the window that doesn't shut.`, flag('yell-names', 3), flag('yell-inside-act1'), beat), {
      prompt: prompt(STEALTH), fail: out(`You come in a beat late on the first. Shaz doesn't mind. By the third you've got it: Stripes, Biscuit, Our Kev. Three names. They'll matter. A towel. A horn. A seat on the coach: fourteen, by the window that doesn't shut.`, flag('yell-names', 3), flag('yell-inside-act1'), beat),
    })]),
];

// ---------- Act 2, Macro Cosmos: Contingency (stage 4) ----------
const mcAct2 = ev('mc-act2', 'Contingency', 'Evil Teams', { callback: true, requires: inside('mc', { beat: 3 }), cast: [SHAY, ZANE], tint: TOWER },
  `Floor 44. Accounts. A woman with a printout as long as a scarf. ${say('Shay Brisbane', `You're the new department. Good. You've no history. Look at this and tell me I'm wrong.`)} ${say('Shay', `It says 'contingency.' It's four billion. That's not a contingency. That's a thing. Somebody's building a thing. It's bigger than the League's whole budget and it's on one line and the line's got no cost centre.`)} Zane, who's come up with her: ${say('Zane', `It's the problem. That's what I've been costing. I never saw the total. Nobody on thirty-one's seen the total; we each do a slice.`)} A memo. From fifty. "Reroute Hammerlocke's supply to the Plant, 02:00–02:20, for a test. Routine. — R." ${say('Shay', `Twenty minutes. What's on Hammerlocke's supply at two in the morning?`)} Zane, pulling it up: ${say('Zane', `The vault. The station. Street lighting. ...And the infirmary. It's on the same bus. It's got a generator; it's rated for—`)} He checks. ${say('Zane', `Fifteen minutes.`)}`,
  [
    ch('Reroute it.', out(`Twenty minutes. The generator cuts out at fifteen. From the street: a ward's lights, going out, and coming back five minutes on. Nobody's lost. A night sister writes it in the book. ${say('Shay, after', `He's never once asked what's on the line. He asks how much. I've eleven years of his memos. 'How much.' 'By when.' Never 'who's on it.'`)} ${say('Zane', `He'd care. If he knew. That's the mad part. He'd send the infirmary flowers.`)}`, meters(2, 0, 2), flag('macro-fourbillion'), flag('macro-infirmary-cut'), flag('ally-shay'), flag('macro-inside-act2'), beat)),
    ch(`Reroute it, and leave the infirmary's feeder.`, out(`The test's nine per cent short. Rose, by memo: "Disappointing. Find the nine." ${say('Shay, after', `He's never once asked what's on the line. He asks how much.`)} ${say('Zane', `He'd care. If he knew. He'd send the infirmary flowers.`)}`, meters(0, 1, 2), flag('macro-fourbillion'), flag('macro-infirmary-left'), flag('ally-shay'), flag('macro-inside-act2'), beat)),
    ch('Ring the infirmary first.', out(`The night sister: "Twenty minutes? Our set does fifteen. Who is this? ...Right. Give me an hour. I'll have the theatre on batteries." She's the first person outside the tower who's been told anything. ${say('Shay, after', `He's never once asked what's on the line. 'How much.' 'By when.' Never 'who's on it.'`)} ${say('Zane', `He'd care. If he knew. That's the mad part.`)}`, meters(0, 2, 2), ...kind(1), flag('macro-fourbillion'), flag('macro-infirmary-rung'), flag('ally-shay'), flag('macro-inside-act2'), beat)),
  ]);

// ---------- Act 2, Team Yell: Route 9 (stage 4). Route 9 can also be met from outside, for Team Encore (evil-story-37). ----------
export const ROUTE9_INTRO = `A coach, parked across Route 9. Forty people in black and pink, arms linked. Horns. ${say('Gaz', `Right! Three challengers comin' through to Circhester! All of 'em drawn before our Marnie! They're late, they forfeit! Nobody passes!`)} Kaya, nineteen, with a banner still wet: ${say('Kaya', `I did a new one.`)} It says NONE SHALL PASS (EXCEPT MARNIE). The brackets are very neat. A challenger arrives: a boy from Postwick, fourteen, with a Wooloo, out of breath. ${say('The boy', `I've a match at two. Please. I've never got this far.`)} ${say('Gaz', `BOO!`)} Forty people: "BOOOO!" The Wooloo rolls behind his legs. And then, behind the line, a quiet voice. Marnie, arriving, mortified: ${say('Marnie', `Stop it. I never asked. If I win 'cause they were late, I've not won. Go home.`)} She looks at them. Forty people who came on a coach. ${say('Marnie', `...Have you eaten? Go home and eat.`)}`;
export const BOBBIN = `"What's the Wooloo's name?" ${say('The boy', `...Bobbin.`)} Shaz, who's got a pencil out before anyone's told her: ${say('Shaz', `Bobbin. Two syllables. Right. One, two, three—`)} Forty people: "BOB-BIN! BOB-BIN! BOB-BIN!" The Wooloo comes out from behind his legs. It's twice the size it was. Not Dynamaxed. Just: stood up. The boy's crying. He's fourteen and he's from Postwick and forty strangers know his Wooloo's name. Gaz, baffled, delighted: ${say('Gaz', `That were louder than booin'. Did you hear that? We were louder.`)} They do it for all three. It's deafening. Marnie pretends not to see, and is seen smiling.`;
const ylAct2 = ev('yl-act2', 'Route 9', 'Evil Teams', { callback: true, requires: inside('yl', { beat: 3 }), cast: [YG, MARNIE], pokemon: 'wooloo', tint: '#2a2a34' }, ROUTE9_INTRO,
  [
    ch('"Clear the road."', out(`They do. Sulkily. Marnie nods.`, meters(0, 0, 2), flag('yell-road-cleared'), flag('ally-kaya'), flag('yell-inside-act2'), beat)),
    ch(`"Clear it, and cheer for everybody."`, out(BOBBIN, meters(2, 0, 2), ...kind(1), flag('galar-cheered'), flag('yell-road-cheered'), flag('ally-kaya'), flag('yell-inside-act2'), beat)),
    ch(`"She's wrong. She needs the help."`, out(`The line holds. The boy forfeits. Marnie doesn't speak to anyone on the coach home.`, meters(2, 0, 2), flag('marnie-cross'), flag('yell-road-held'), flag('ally-kaya'), flag('yell-inside-act2'), beat)),
  ]);

// ---------- Act 3, both: The Flicker (stage 5). Macro Cosmos: a door of four nodes (ps_mc_flicker). Yell: a single node. ----------
const mcAct3: Json[] = [
  ev('mc-act3', 'The Flicker', 'Evil Teams', { callback: true, requires: inside('mc', { beat: 4 }), cast: [ZANE], tint: '#14181c' },
    `Under Hammerlocke. The lift. It goes down for a long time.`,
    [ch('Step out.', out(`A hall.`, room('mc-flicker-plant')))]),
  ev('mc-flicker-plant', 'The Plant', 'Evil Teams', { room: true, cast: [ROSE, ZANE], pokemon: 'eternatus', tint: '#2a1420', effect: 'glint' },
    `A hall. A cage of light. Something in it that's the size of the room, and mostly ribs, and awake. Rose, warm, in shirtsleeves, a hard hat on that he wears as if he'd never taken one off: ${say('Rose', `There it is! A thousand years of power. It only wants waking. A little test. Tonight, during the match; nobody'll notice a flicker.`)} Zane's looking at a dial. It isn't a flicker. ${say('Zane', `Sir. That's every stadium. That's the whole grid. If it wakes during the final, with sixty thousand— sir, it's a thousand years off.`)} ${say('Rose', `And I shan't be here in a thousand years, shall I? Somebody has to mind.`)}`,
    [ch('Go to the board.', out(`Feeders. Lights.`, room('mc-flicker-board')))]),
  ev('mc-flicker-board', 'The Board', 'Evil Teams', { room: true, cast: [ZANE], tint: '#14181c' },
    `Feeders. Lights. One, at the bottom, older than the rest: brass, not plastic. EAST COAST (R&B). Nobody on thirty-one knows what it feeds.`,
    [
      ch('Run the test.', out(`The dials go over. The thing in the cage turns its head. Across Galar, for nine seconds, every Pokémon on a pitch is the size of a house. The brass feeder goes dark and stays dark.`, meters(2, 0, 3), flag('galar-test-full'), flag('galar-brass-seen'), flag('macro-inside-act3'), beat)),
      ch('Run it at a tenth.', out(`A tremor. One Wooloo, in one stadium, briefly enormous. The brass feeder flickers.`, meters(0, 1, 3), flag('galar-test-tenth'), flag('galar-brass-seen'), flag('macro-inside-act3'), beat)),
      ch('"Zane. Pull the breaker."', out(`Zane's hand is on it. A man in a blazer steps out from behind the board.`, room('mc-flicker-hollis'))),
    ]),
  ev('mc-flicker-hollis', 'The Breaker', 'Evil Teams', { room: true, cast: [HOLLIS], tint: '#14181c' },
    `Director Hollis, who announces it like a delay: "We apologise for the interruption to your service."`,
    [ch('Battle him.', fight(`Steelix first.`, { ...trainer('Director Hollis', { sprite: HOLLIS, team: ['steelix', 'klinklang', 'copperajah'], size: 3, lv: 1, win: [] }), pseudo: true },
      meters(0, 4, 3), flag('galar-test-off'), flag('galar-breaker'), flag('galar-brass-seen'), flag('macro-inside-act3'), beat))]),
];
(mcAct3[3] as Json).remembers = [{ id: 'after', when: [flagIs('ally-zane')], notice: `Afterwards, the test's off. Rose isn't angry. ${say('Rose', `Ingleby. I'd hoped you'd be the one who did it.`)} It's worse than angry.` }];
const ylAct3: Json[] = [
  ev('yl-act3', 'The Flicker', 'Evil Teams', { callback: true, requires: inside('yl', { beat: 4 }), cast: [PIERS, BECK], tint: SPIKE },
    `The Gym. A Tuesday. Eleven in. Piers is on. The neon goes. Then the street lights. Then the amp. He goes on singing. Without it. The street knows the words. Beck, in the dark: ${say('Beck', `That's it, then. That's the last of the leccy. Somebody up top's usin' us.`)} ${say('Kaya', `It's come back before.`)} ${say('Beck', `It's come back less, every time. I've been countin' the bulbs.`)} Then, between the shopfronts, a Yeller's Linoone swells. It's the size of a house, and frightened.`,
    [ch(`Lead the chant: "Stripes."`, out(`Forty people, low, in time: "Stripes. Stripes. Stripes." It gets smaller.`, ...kind(1), flag('yell-chant-led'), room('yl-act3-dark')))]),
  ev('yl-act3-dark', 'The Flicker', 'Evil Teams', { room: true, cast: [BECK, OLDROYD], tint: SPIKE },
    `The street, by candle. Stripes, ordinary-sized, asleep across Beck's boots.`,
    [
      ch(`"Where's the power come from?"`, out(`An old man at the back, Mr. Talbot Oldroyd, who was the substation's engineer: "East coast spur. Oldest cable in Galar. There's a plate on the box; I used to polish it. 'R. & B., Lamps.' Whoever R and B were, they lit this town before the League were thought of."`, meters(1, 0, 3), flag('yell-spur-known'), flag('yell-inside-act3'), beat)),
      ch('"Stay here. Keep the Gym open on candles."', out(`Candles on every sill. Piers plays the second half. Eleven people stay to the end.`, meters(2, 0, 3), flag('yell-candles'), flag('yell-inside-act3'), beat)),
      ch('"Go to Wyndon. All of us. Ask."', out(`Forty people on a coach at midnight. A lobby. A nice lass on the desk, who gives them a leaflet each. Gaz reads his out loud on the way home, very slowly, all of it.`, meters(1, 1, 3), flag('yell-asked-wyndon'), flag('yell-inside-act3'), beat)),
    ]),
];

// ---------- Act 4, Macro Cosmos: Forty-One (stage 6, needs Rank 4) ----------
const confide = (s: Side, rank: number, ...fx: Json[]): Json[] => [meters(2, 0, rank), mark('confided'), flag(s === 'mc' ? 'macro-rose-confided' : 'yell-piers-confided'), flag(s === 'mc' ? 'macro-inside-act4' : 'yell-inside-act4'), ...fx, beat];
const ROSE_END = (rank: number): string => rank === 6 ? `You're the Chairman's Protégé. Oleana, in the doorway, having heard: ${say('Oleana', `He's never told me whose it was. I've dusted it for eleven years.`)}` : `You're Vice-Chair, beside Oleana.`;
const mcAct4 = ev('mc-act4', 'Forty-One', 'Evil Teams', { callback: true, requires: [...inside('mc', { beat: 5, rank: 4 }), night], cast: [ROSE], tint: '#2a2420' },
  `Floor fifty. An office. A window that looks north, at hills. A desk. A miner's lamp, brass, dented, unlit. ${say('Rose', `Future Planning. Come in. Don't sit there; that's Oleana's. Sit there. That was my brother's, when he'd come up. He'd put his boots on the desk.`)} ${say('Rose', `My father went down a pit at fourteen. I went down beside him at fifteen. He came up at sixty with a cough and a clock. I said: never again. Not one more boy down one more hole for one more lump of anything. I built all this so there'd be enough.`)} ${say('Rose', `And they tell me: 'A thousand years, Chairman, there's time.' There was time when my father was fourteen. Nobody spent it. I'll not be the man who knew and waited.`)} ${say('Rose', `They'll call it reckless. I've been called worse by people who never lit a town.`)}`,
  [
    ch('"And Spikemuth?"', out(`He blinks. ${say('Rose', `Spikemuth? It hasn't a Power Spot. It doesn't— I didn't think it was on the grid.`)} "East coast spur. There's a brass feeder. R and B." ${say('Rose', `...R and B.`)} He turns the lamp over in his hands. ${say('Rose', `That's— we laid that. Peony and I. With a hand winch. It was the first— it was the first place after home.`)} A long time. ${say('Rose', `Have they been dark?`)} "Come and look." He writes it in his diary, in pencil: Spikemuth. It's the first entry in forty years that isn't a deadline. ${ROSE_END(5)}`, ...confide('mc', 5, flag('rose-knows-spur'), flag('rose-came'))), {
      branches: [{ when: [flagIs('rose-notice')], text: `He doesn't blink. He takes a folded notice out of his breast pocket: SUPPLY ISSUES — EAST COAST. ${say('Rose', `I've had this a stage. I keep reading it.`)} "There's a brass feeder. R and B." ${say('Rose', `...R and B. We laid that. Peony and I. With a hand winch. It was the first place after home.`)} A long time. ${say('Rose', `Have they been dark?`)} "Come and look." He writes it in his diary, in pencil: Spikemuth. It's the first entry in forty years that isn't a deadline. ${ROSE_END(5)}`, effects: [...confide('mc', 5, flag('rose-knows-spur'), flag('rose-came'))] }],
    }),
    ch('"Who told you it had to be tonight?"', out(`${say('Rose', `Nobody. That's the point. Nobody was ever going to. Somebody has to say Thursday, or it's never Thursday.`)} ${ROSE_END(5)}`, ...confide('mc', 5))),
    ch('"What does Leon think?"', out(`${say('Rose', `Leon thinks it's a thousand years. He's twenty-four. Everything's a thousand years when you're twenty-four.`)} ${ROSE_END(5)}`, ...confide('mc', 5))),
    ch('"Whose lamp is that?"', out(`He picks it up. He knows its weight. ${say('Rose', `Number forty-one. The last one up. A lad called Thackray; he'd stopped to help a pony. I stood there with forty counted and I thought: I've lost one. Four minutes. Then he came up the cage whistling.`)} He sets it down. ${say('Rose', `I've never lit it since. I don't know what I'm keeping it for.`)} ${ROSE_END(6)}`, ...confide('mc', 6, flag('rose-lamp-41')))),
  ]);

// ---------- Act 4, Team Yell: Not the Leader (stage 6, needs to've led a chant) ----------
const PIERS_END = (rank: number): string => rank === 6 ? `You're Piers's Opening Act. It's a real slot. Ten minutes. Your party, on a pallet stage, and forty people who learn all six names before the first chorus.` : `You're in Marnie's Corner.`;
const ylAct4 = ev('yl-act4', 'Not the Leader', 'Evil Teams', { callback: true, requires: [...inside('yl', { beat: 5, rank: 4 }), flagIs('yell-chant-led'), night], cast: [PIERS], tint: SPIKE },
  `The Spikemuth Gym, empty. A stage made of pallets. A thin man on the edge of it, tuning a guitar by candle. ${say('Piers', `I'm not their leader. I'll say it first so it's said. They've no leader. They've a coach.`)} ${say('Piers', `I could move the Gym. They've offered. Nice site. Power Spot. Telly. And leave this lot here in the dark with nowt. I'll not. So I'm the Leader who killed his own town by lovin' it. Write that on me stone.`)} ${say('Piers', `Marnie'll be better than me. She'll leave. She should. I've told Yell to follow her, so somebody from here's there when she does it.`)} ${say('Piers', `They block roads now. That's not what I meant. I said follow. I never said get in the way.`)}`,
  [
    ch('"Play something."', out(`He does. It's not cheerful. The candle doesn't flicker; there's no draught; the shutters are down. ${say('Piers', `That were for eleven people on a Tuesday. It's the best gig I've done in a year.`)} ${PIERS_END(5)}`, ...confide('yl', 5))),
    ch('"What if the power came to you?"', out(`${say('Piers', `It'll not. There's nowt here they want. No Spot. That's the whole—`)} He stops. ${say('Piers', `Unless they don't know we're on the wire.`)} ${PIERS_END(5)}`, ...confide('yl', 5))),
    ch(`"She won't leave."`, out(`${say('Piers', `She will. An' I'll stand in an away end with a towel. First time. I've never been to an away game. I've always been the home.`)} ${PIERS_END(5)}`, ...confide('yl', 5, flag('piers-away')))),
    ch(`"They know every Pokémon's name. D'you know what that does?"`, out(`${say('Piers', `Brings 'em down. The big 'uns. I've seen it. Stripes. Our Marnie says they forget who they are.`)} He looks at the guitar. ${say('Piers', `...That's the only thing this town's got that Wyndon's not. Sixty thousand in that stadium an' not one knows what the Pokémon's called.`)} ${PIERS_END(6)}`, ...confide('yl', 6, flag('yell-names-all')))),
  ]);

// ---------- Act 5, both: A Chip Shop (stage 7) ----------
const CHIPS = `A chip shop, on the road between Hammerlocke and Spikemuth. The only one open. One table. Two people at it who've never met: a man in a lanyard, a man with a towel. ${say('Zane', `Is this seat— sorry. I've not eaten off a plate in three years.`)} ${say('Beck', `Sit down, lad. You look like you've been kept in a drawer.`)} They get talking. It's a chip shop. That's what it's for. ${say('Zane', `—so there's this feeder nobody can place. Brass. Old. 'East coast.' It browns out first, every test. I've been trying to find what's on it for a month.`)} Beck puts his fork down. ${say('Beck', `...Say that again.`)} ${say('Zane', `R and B. It's—`)} ${say('Beck', `It's us. That's us. That's Spikemuth. You've been turnin' us off.`)} ${say('Zane', `I didn't— it's not on the map—`)} ${say('Beck', `I know it's not on the map, lad. I've had eight years of it not bein' on the map.`)} A long silence. The fryer. ${say('Zane', `He's got the power and no idea where it goes.`)} ${say('Beck', `We've a town and no power.`)} ${say('Zane', `There'll be others. Off the map. I could find them. I've the feeders.`)} ${say('Beck', `An' I've a coach.`)}`;
const act5 = (s: Side): Json[] => {
  const p = s;
  const act = s === 'mc' ? 'macro-inside-act5' : 'yell-inside-act5';
  const tail = (...fx: Json[]): Json[] => [flag('galar-chipshop'), flag(act), ...fx, beat, final(s)];
  const night5 = s === 'mc'
    ? `At the tower, the same night. ${say('Shay', `I've printed the four billion. I've left it on Oleana's chair. She'll either sack me or read it.`)} Oleana, later, finding you by the lifts: ${say('Oleana', `I read it. I've known for a year. I grew up in a town with no lights. He found me there. I'd do it again. I'm telling you so there's one person who knows I knew.`)}`
    : `In Spikemuth, the same night. Marnie, on the coach steps, with her bag: ${say('Marnie', `It's the final tomorrow. I'm in it. I've told 'em: no blockin'. No booin'. If you come, you come an' you watch.`)} A pause. ${say('Marnie', `Are they comin'?`)} Forty people, loading a coach, pretending they weren't going to.`;
  return [
    ev(`${p}-act5`, 'A Chip Shop', 'Evil Teams', { callback: true, requires: inside(s, { beat: 6 }), cast: [ZANE, BECK], tint: '#2a2418' }, CHIPS,
      [ch('Finish your chips.', out(night5, ...(s === 'mc' ? [flag('oleana-knew')] : []), room(`${p}-act5-told`)))]),
    ev(`${p}-act5-told`, 'A Chip Shop', 'Evil Teams', { room: true, cast: s === 'mc' ? [OLEANA, SHAY] : [MARNIE, SHAZ], tint: '#2a2418' }, `Your last choice of the night: who's told.`, [
      ch('Nobody.', out(`Tomorrow goes as planned.`, ...tail(flag('galar-told-none')))),
      ch('The squads.', out(`Zane, Shay, Beck and Kaya know: about the spur, about "if low." Whatever happens tomorrow, they'll act on it.`, ...tail(flag('galar-told-squads')))),
      s === 'mc'
        ? ch('Floor thirty-one.', out(`You read the Draft Release aloud, to forty desks. "Insert casualty figure if low." Nobody shouts. Somebody, at the back, puts down a mug. Then another. By two in the morning there are forty mugs in the bin by the lift, and the lights on thirty-one are off for the first time in three years.`, ...tail(flag('galar-told-floor'))))
        : ch('The coach.', out(`You tell them what the names do. "You're the cure. When it goes red tomorrow: don't block. Don't boo. Chant." ${say('Gaz', `For who?`)} "Whoever's on the pitch." Shaz, with the ring binder: ${say('Shaz', `I've a hundred and twelve. There's five stadiums. I'll need to know what they're called.`)} She starts writing. She doesn't stop all night.`, ...tail(flag('galar-told-coach')))),
    ]),
  ];
};

// ---------- The six Operations (FULL_3 C): three for each side ----------
const OPS: Json[] = [
  // GO1. The Sponsorship (MC)
  ev('mc-op-sponsorship', 'Operation: The Sponsorship', 'Evil Teams', { requires: inside('mc', { after: 2 }), cast: ['boss.drive/galarian-swsh-pokemon-breeder-woman', ZANE], tint: TOWER },
    `The order: a struggling Gym, a minor-division one, behind on its rates. Sign it. Exclusive. Macro Cosmos logos on everything; no other backer; a clause on fixtures. The Gym's Leader, a woman in her fifties with a clipboard and a whistle: "I know what it is. I've read it. I'll sign. I've eleven kids on the youth side and the roof's coming in."`,
    [
      ch('Sign it.', out(`She signs. Logos on everything by Friday. The clause on fixtures goes in the drawer with the others.`, meters(1))),
      ch(`Sign it. Cross out "exclusive."`, out(`You turn the contract round. A pen. One word, with a line through it. And initials. ${say('The Leader', `...You can't do that. Can you do that?`)} ${say('Zane', `They're Future Planning. Nobody knows what they can do. That's the beauty of the department.`)} It goes through. Legal doesn't read past the signature. The Gym's got Macro Cosmos money and can take anyone else's too. A stage on, there's a second logo on the roof: a chip shop's.`, ...quiet(), flag('galar-sponsor-crossed'))),
    ]),
  // GO2. The Meter Round (MC)
  ev('mc-op-meter-round', 'Operation: The Meter Round', 'Evil Teams', { requires: inside('mc', { after: 3 }), cast: [ZANE, OLDROYD], tint: SPIKE },
    `The order: read Wyndon's meters. A sample of forty, for the forecast.`,
    [
      ch(`Read Wyndon's.`, out(`Forty meters. Forty numbers. They go in the forecast.`, meters(1))),
      ch(`Read Spikemuth's. Nobody has in years.`, out(`${say('Zane', `It's not on the round. There's no route for it.`)} "There's a meter." The green box at the end of the street. A dial, behind glass, behind dust. ${say('Zane', `That's— that can't be right. That's nothing. A town this size should draw forty times that.`)} He taps the glass. The needle doesn't move. ${say('Zane', `They're not using it because it's not there. We've been sending them a tenth and billing them for— we've been billing them?`)} Mr. Oldroyd, behind you, with a tin of polish: "Every quarter. Estimated. I've a drawer full." Zane writes it up. It's the first document in Macro Cosmos with the word "Spikemuth" in it in eight years. It goes to Shay. Shay finds eight years of estimated bills, and refunds them, and puts it under "contingency," where there's room.`, ...quiet(), flag('galar-meter-read'), flag('galar-power-east'))),
    ]),
  // GO3. The Lanyard (MC)
  ev('mc-op-lanyard', 'Operation: The Lanyard', 'Evil Teams', { requires: inside('mc', { after: 5 }), cast: [ROSE], tint: '#2a2a30' },
    `The order: escort the Chairman to a ribbon-cutting at Hammerlocke. Car to the door. Twenty minutes.`,
    [
      ch('Car to the door.', out(`Twenty minutes. He makes the speech. It's a good speech.`, meters(1))),
      ch('Walk him the long way.', out(`${say('Rose', `This isn't the route.`)} "It's a route." ${say('Rose', `Oleana will be— well. I've not walked anywhere in years. They put me in cars.`)}`, room('mc-op-lanyard-walk'))),
    ]),
  ev('mc-op-lanyard-walk', 'The Long Way', 'Evil Teams', { room: true, cast: [ROSE], tint: '#2a2a30' },
    `A street off the main road. It could be anywhere. It's not Spikemuth; it's just somewhere his cars don't go. A row of shops. Every third one shut. ${say('Rose', `That's a baker's. Was. They go fourth.`)} He doesn't explain. A bus shelter with a Macro Cosmos Rail poster: SERVICE RATIONALISED. ${say('Rose', `That's mine.`)} He reads it as a stranger would. A kiosk: DARKEST DAY COVER. A woman's buying a policy. She recognises him. "Chairman! Is it really coming? Only I've put my holiday money in." He can't answer her. A street light, out. A child under it, doing homework by a torch. He stops for a long time. ${say('Rose', `How long's that been out?`)} The child: "Dunno. Always."`,
    [ch('Walk on to the ribbon.', out(`Rose, at the ribbon-cutting, with the scissors, to nobody: ${say('Rose', `I paid for a street's lights myself, once. I knew every lamp.`)} He cuts the ribbon. He doesn't make the speech. He sends an engineer to the street light that afternoon. Himself. By name. It's one bulb. It's the first thing he's done in forty years that wasn't for a thousand people at once.`, ...quiet(), flag('rose-street-light')))]),
  // GO4. The Blockade (Yell)
  ev('yl-op-blockade', 'Operation: The Blockade', 'Evil Teams', { requires: inside('yl', { after: 2 }), cast: [YG, BECK], tint: '#2a2430' },
    `The order: a hotel lobby in Motostoke. Marnie's rivals are staying. Block the doors. Make a racket. Nobody gets a night's sleep. ${say('Gaz', `Right! Link arms! Nobody gets to the lift!`)} A family. A mother, a challenger of twelve, two cases and a Pokémon carrier.`,
    [
      ch('Link arms.', out(`Nobody gets to the lift. Nobody sleeps. The challenger of twelve sits on a case in the lobby till two.`, meters(1))),
      ch('Carry everyone\'s bags.', out(`You pick up a case. "Which floor?" The mother: "...Fourth?" ${say('Gaz', `What're you doin'?`)} "They'll not get to the lift without us now." It catches. Forty people in black and pink, in a hotel lobby, being very loud and extremely helpful. Beck, with a pram on his shoulder: ${say('Beck', `Mind your backs!`)} ${say('Shaz', `One, two, three: Room! Four! Twelve!`)} Forty people: "ROOM! FOUR! TWELVE!" The night manager, to the day manager, on the telephone: "No, they're— I don't know what they're doing. They've carried a wardrobe." The rivals sleep well. The hotel gives Yell breakfast. It's the first time anybody's fed them at an away ground.`, ...quiet(), flag('yell-breakfast'))),
    ]),
  // GO5. The Chant (Yell)
  ev('yl-op-chant', 'Operation: The Chant', 'Evil Teams', { requires: inside('yl', { after: 4 }), cast: [SHAZ, MARNIE], pokemon: 'eldegoss', tint: '#2a2430' },
    `The order: a rival's doing a press interview before a match. Drown it out. A girl from Turffield, fifteen, in front of a microphone, terrified. A reporter. A camera. ${say('Gaz', `Horns ready!`)}`,
    [
      ch('Horns.', out(`Nobody hears a word she says. Neither does she.`, meters(1))),
      ch(`"What's she called?"`, out(`${say('Kaya', `Dunno. 'The Turffield lass.'`)} "Find out." Shaz has a programme out. A pencil. ${say('Shaz', `Nellie. Nellie Aldersley. An' the Eldegoss is Thistle.`)} Forty people, as the camera rolls, to a tune they use for Marnie: "NEL-LIE! NEL-LIE! AN' THIS-TLE!" The girl looks round. She doesn't know them. They don't know her. They're wearing somebody else's colours and they're singing her name. The reporter: "And you've brought quite a following from Turffield!" ${say('Nellie', `I've— they're not— I came on the bus.`)} Marnie, at the back, arms folded: ${say('Marnie', `They're mine. They're on loan.`)} Marnie beats her, that afternoon. Fairly. Nellie asks for a towel. She's given one.`, ...quiet(), flag('yell-nellie'))),
    ]),
  // GO6. The Shutters (Yell): a door of two nodes, at night
  ev('yl-op-shutters', 'Operation: The Shutters', 'Evil Teams', { requires: [...inside('yl', { after: 5 }), night], cast: ['boss.drive/galarian-swsh-leaguestaff-man'], tint: SPIKE },
    `The order: guard Spikemuth's gate. Nobody in. "They only come to look." The shutter. Down. It's been down, more or less, for five years. It started as a way to keep the wind out. A knock. A man in a League blazer, with a rolled-up plan, and the look of someone who's rung from outside three times. ${say('Mr. Midgley', `I only wanted to see it. I've a model. I've never—`)}`,
    [
      ch('(Keep it shut.)', out(`He goes. He builds what's on the model.`, meters(1))),
      ch('(Open it.)', out(`He comes in. He stands in the street. It's narrower than he drew it.`, ...quiet())),
      ch('(Open it, and walk him through.)', out(`You open it.`, room('yl-op-shutters-walk'))),
    ]),
  ev('yl-op-shutters-walk', 'The Shutters', 'Evil Teams', { room: true, cast: ['boss.drive/galarian-swsh-leaguestaff-man', 'boss.drive/galarian-swsh-mom'], tint: SPIKE },
    `You show him: the Gym, which is a street. Mrs. Gallowglass's front step, where the away fans used to sit. The chip shop. The green box, with a brass plate. Forty people, who look at a man in a blazer, and don't boo. Gaz's mam: "You're the one wi' the model." ${say('Mr. Midgley', `I— yes.`)} Gaz's mam: "Is there a step on it?" ${say('Mr. Midgley', `No.`)} Gaz's mam: "Put a step on it. Folk need somewhere to sit that's not a seat."`,
    [ch('See him to the gate.', out(`He goes home. He takes the tiny trees off. The shutter's left up, after. Nobody decides it. It just isn't pulled down that night, and then it isn't the next.`, ...quiet(), flag('yell-shutter-up')))]),
];
// Barks (FULL_3 D): Zane and Beck, by Standing and Suspicion.
(OPS[0] as Json).remembers = [{ id: 'zane-low', when: [sus('mc', 0, 4)], notice: say('Zane', `Sorry: are you on the Thursday list?`) }];
(OPS[1] as Json).remembers = [{ id: 'zane-mid', when: [stand(5)], notice: say('Zane', `You go home at night. How d'you do that?`) }, { id: 'zane-sus', when: [sus('mc', 4, 7)], notice: say('Zane', `Oleana asked what Future Planning's planned. I said it was confidential. Is it?`) }];
(OPS[2] as Json).remembers = [{ id: 'zane-high', when: [stand(8)], notice: say('Zane', `If he's wrong, I'd rather you told him than me. He'd listen to you. You're the future.`) }, { id: 'zane-7', when: [sus('mc', 7)], notice: say('Zane', `He'll ask you to cut a line. 'A rounding error.' Ask him to come and look at it.`) }];
(OPS[4] as Json).remembers = [{ id: 'beck-low', when: [sus('yl', 0, 4)], notice: say('Beck', `Hold that end.`) }];
(OPS[5] as Json).remembers = [{ id: 'beck-mid', when: [stand(5)], notice: say('Beck', `You learn the names. I've noticed.`) }, { id: 'beck-sus', when: [sus('yl', 4, 7)], notice: say('Beck', `Gaz says you're soft on the away lot. I said aye. An'?`) }];
(OPS[6] as Json).remembers = [{ id: 'beck-high', when: [stand(8)], notice: say('Beck', `When there's sixty in again on a Tuesday, I want you stood next to me.`) }, { id: 'beck-7', when: [sus('yl', 7)], notice: say('Beck', `They'll want you to boo a Pokémon. Don't. Marnie'd never speak to you.`) }];

// ---------- GI1. Past Midnight (MC), GI3. Seat Fourteen (Yell): the stage's last rest, from stage 3 ----------
const midnight = (n: number, after: number, text: string, choices?: Json[], req: Json[] = []): Json =>
  ev(`mc-midnight-${n}`, 'Past Midnight', 'Evil Teams', { requires: [...inside('mc', { after }), ...req], cast: [ZANE], tint: TOWER }, `Floor thirty-one. After twelve. You're one of those still there. ${text}`, choices ?? [ch('Go home.', out(`You go home. It's the strangest thing anyone on thirty-one does all week.`))]);
const MIDNIGHT: Json[] = [
  midnight(3, 2, `Thirty-eight of forty still at a desk. Rose comes round with sandwiches. Cheese and pickle. He knows who's vegetarian.`),
  midnight(4, 3, `Thirty-six. Two have been sent on leave: "exhaustion." Their mugs are still on their desks. Nobody's moved them.`),
  midnight(5, 4, `Zane, asleep on his keyboard. The graph's on his screen.`, [
    ch('Put a coat over him.', out(`He wakes at four with a line of j's across a spreadsheet and somebody's coat on. ${say('Zane', `Whose— nobody's done that since my mum.`)}`, ...kind(1), flag('zane-coat'))),
    ch('Wake him.', out(`He sits up. ${say('Zane', `Thursday?`)} "Go home." He doesn't.`)),
  ]),
  midnight(6, 5, `Shay, who doesn't work on this floor. She's reading the mugs. ${say('Shay', `Four hundred of these. I've found the invoice. He pays for them himself. Not the company. It's the only thing in the building that isn't on a cost centre.`)}`),
  midnight(7, 6, `The night before.`),
];
(MIDNIGHT[4] as Json).remembers = [
  { id: 'floor', when: [flagIs('galar-told-floor')], notice: `It's dark. Forty mugs in a bin.` },
  { id: 'lit', when: [flagIs('galar-told-floor', 0, 0)], notice: `Forty desks, lit, the night before, and Rose, with sandwiches, and nobody eating. ${say('Rose', `Eat. Somebody eat. My mother'd be ashamed.`)}` },
];
const seat = (n: number, after: number, text: string, choices?: Json[]): Json =>
  ev(`yl-seat-14-${n}`, 'Seat Fourteen', 'Evil Teams', { requires: inside('yl', { after }), cast: [BECK], tint: '#2a2430' }, `The coach, coming home. You're in fourteen: the window that doesn't shut. ${text}`, choices ?? [ch('Look out of the window.', out(`Galar goes by in the dark.`))]);
const SEATS: Json[] = [
  seat(3, 2, `In thirteen: Kaya, with a banner on her knee, redoing a letter. ${say('Kaya', `I get the S's right. Gaz never did. I do 'em backwards on one, every time, for luck. See if you can spot which.`)}`),
  seat(4, 3, `In thirteen: Marnie. She's never been on the coach. ${say('Marnie', `Don't tell 'em I got on. I just— I wanted to see what it were like. From inside.`)} She's got a towel. She's holding it as if it might be someone else's.`),
  seat(5, 4, `In thirteen: nobody. It's got a coat on it. Big Daz, from the front: "That's Dennis's. He passed. Two year back. Seat thirteen were his. We keep his coat on it. He comes to every match."`),
  seat(6, 5, `In thirteen: Beck, counting on his fingers.`, [
    ch('"How many bulbs?"', out(say('Beck', `Fewer.`)), { branches: [{ when: [flagIs('galar-power-east')], text: say('Beck', `I counted the bulbs again. There's more. I don't know who's doin' it. More. First time in eight year the number's gone up.`), effects: [] }] }),
  ]),
  seat(7, 6, `Everybody's awake. Nobody's singing. Shaz is writing. Big Daz: "Who's got seat one? Somebody's to write in the book on the way home tomorrow." Nobody takes it. They leave it for you.`),
];
(SEATS[1] as Json).remembers = [{ id: 'bobbin', when: [flagIs('galar-cheered')], notice: say('Gaz', `Bobbin. I can't get it out me head. Bob-bin.`) }];
(SEATS[2] as Json).remembers = [{ id: 'hood', when: [flagIs('galar-cheered')], notice: `Big Daz: "Somebody were in thirteen wi' a hood up, last time. I'm sayin' nowt."` }];

// ---------- GI2. Forty a Day (MC), GI4. Opening Act (Yell) ----------
const MORE: Json[] = [
  ev('mc-forty-a-day', 'Forty a Day', 'Evil Teams', { requires: inside('mc', { after: 3 }), cast: [ROSE], tint: TOWER },
    `The Chairman walks the building, mornings. He greets forty people by name. Future Planning's asked along. ${say('Rose, to a cleaner', `Doreen! How's the knee? Did the cream help?`)} Doreen: "It did, Chairman." ${say('Rose', `Splendid. Splendid.`)} ${say('Rose, to a post boy', `Kevin. Your sister passed her exams? Tell her well done from me. Tell her.`)} He's extraordinary at it. He doesn't check a note. Forty people. Forty names. A fact about each. ${say('Rose, to you, walking', `Do you know why? When I was fifteen the manager came down the pit once a year and called every man 'you there.' I said: I'll know them. All of them. Whatever it gets to.`)} On a notice-board by the lift, between a fire drill and a five-a-side sign-up: "SUPPLY ISSUES — EAST COAST. Customers at the following postcodes may experience intermittent—" He walks past it. He's greeting Kevin.`,
    [
      ch('(Say nothing.)', out(`He walks on. The notice stays where it is.`)),
      ch('"Chairman. The notice."', out(`He stops. He reads it. It takes him four seconds. ${say('Rose', `East coast. That'll be— what's on the east coast?`)} "People you've not met." He takes the notice down. He folds it. He puts it in his breast pocket, with the sandwiches.`, flag('rose-notice'))),
      ch('"How many do you know?"', out(`${say('Rose', `Four thousand, in this building. I've a system.`)} A pause. ${say('Rose', `There are forty thousand in the company. I've stopped being able to. I find I mind that more than anything on the accounts.`)}`)),
    ]),
  ev('yl-opening-act', 'Opening Act', 'Evil Teams', { requires: [...inside('yl', { after: 5, rank: 6 }), night], cast: [PIERS, SHAZ], tint: SPIKE },
    `Ten minutes. A pallet stage. Before Piers. ${say('Piers, from the wings, flat', `You're on. Don't thank 'em for comin'. They live here.`)} The street. Forty. Then sixty; word's gone round. A candle on every sill, because the lights are off again. It isn't a battle. It's a turn. You send out each of your party, one at a time, onto a stage, in front of a street. For each: one move, shown off; and its name, said into a microphone. Shaz, at the front, with a pencil: ${say('Shaz', `Say it clear. I'm writin' 'em down.`)}`,
    [ch('Say the first name.', out(`One name. A pause. "One, two, three—" Sixty people, by candle. It's the first time anyone but you has said it. Then the next, and the next. Something that's been "the Corviknight" on every road in Galar hears a street say what it's called. Piers, coming on after, to the microphone, deadpan: ${say('Piers', `Follow that. Cheers.`)} He does. It's the best set he's played in a year. He'd never say so.`, bondUp(1, 'party'), flag('yell-opening')))]),
];

// ---------- The officers, alone (VOLUME_3_D) ----------
const OFFICERS: Json[] = [
  ev('mc-oleana-alone', 'Oleana, Alone', 'Evil Teams', { requires: [...inside('mc', { after: 4 }), night], cast: [OLEANA], tint: '#1e1e24' },
    `The tower's car park. She's in the car, not driving. ${say('Oleana', `I was nine. No lights in the whole street. He came to open a plant, and he shook my hand, and the lights came on behind him. I thought he'd done it by shaking my hand.`)}`,
    [
      ch(`"He didn't."`, out(`${say('Oleana', `I know. I found out at twelve. It didn't help.`)}`)),
      ch('"Would you stop him?"', out(say('Oleana', `No. I'd stand between him and whoever tried, and I'd hate it, and I'd do it.`), flag('oleana-stands'))),
      ch('"What do you want, yourself?"', out(`She looks at the steering wheel a long time. ${say('Oleana', `To drive somewhere. Nobody's ever asked.`)}`, flag('oleana-asked'))),
    ]),
  ev('mc-bede-alone', 'Bede, Alone', 'Evil Teams', { requires: inside('mc', { after: 3 }), cast: [BEDE], tint: TOWER },
    `A corridor. He's holding a Wishing Star. ${say('Bede', `The Chairman chose me. Out of an orphanage. I collect these for him. If I collect enough, he'll— I don't know what he'll. I've never asked what happens if I finish.`)}`,
    [
      ch(`"He'll need more."`, out(`${say('Bede', `...Yes. He always does.`)}`)),
      ch(`"You're good without him."`, out(say('Bede', `...Say it again. I didn't— say it once more.`), flag('bede-heard'))),
      ch('"What did the orphanage call you?"', out(`${say('Bede', `'The quiet one.' I wasn't. I just didn't say anything they could use.`)}`)),
    ]),
  ev('yl-marnie-alone', 'Marnie, Alone', 'Evil Teams', { requires: inside('yl', { after: 3 }), cast: [MARNIE], pokemon: 'morpeko', tint: '#2a2430' },
    `Behind a stadium. She's taking off her jacket to give to a cold Yeller. ${say('Marnie', `They follow us about. It's dead embarrassin'. An' if they stopped, I'd have nobody. Don't tell 'em.`)}`,
    [
      ch('"They know."', out(`${say('Marnie', `...Aye. Probably.`)} She gives the jacket over anyway.`)),
      ch(`"What's it for, the winning?"`, out(say('Marnie', `So somebody on the telly's from Spikemuth. That's all. So some kid there sees it.`), flag('marnie-heard'))),
      ch('"Go home and see your brother."', out(`${say('Marnie', `He's always in. That's the trouble with him.`)} She goes anyway, that night.`)),
    ]),
];

// ---------- The loyalty tests (Suspicion 7) and found out (Suspicion 10) ----------
const TESTS: Json[] = [
  ev('mc-loyalty-test', 'The Loyalty Test', 'Evil Teams', { callback: true, requires: inside('mc', { suspicion: 7, suspicionBelow: 10, lacks: 'loyalty-test' }), cast: [ROSE], tint: '#2a2420' },
    `${say('Rose', `Cut Spikemuth's line. For the test. One night. It's a rounding error.`)}`,
    [
      ch(`"It's a town."`, out(`${say('Rose', `It's a line on a board, Future Planning.`)} He waits. You don't cut it. He writes something down.`, meters(0, 1), mark('loyalty-test'))),
      ch('(Cut it.)', out(`You cut it. Somewhere on the east coast, a street goes dark. It's a rounding error.`, meters(0, -3), mark('loyalty-test'), flag('galar-cut-spikemuth'))),
      ch('"Come and look at it first."', out(`He comes. He's never been. He stands in the dark street for a long time.`, meters(0, -3), mark('loyalty-test'), flag('rose-came'))),
    ]),
  ev('yl-loyalty-test', 'The Loyalty Test', 'Evil Teams', { callback: true, requires: inside('yl', { suspicion: 7, suspicionBelow: 10, lacks: 'loyalty-test' }), cast: [YG], tint: '#2a2430' },
    `A Yeller: "Boo that lad's Pokémon. Go on. Proper loud. It's what we do."`,
    [
      ch('"No."', out(`"No?" He looks at you. He looks at the others. Nobody boos.`, meters(0, -1), mark('loyalty-test'))),
      ch('(Cheer it instead.)', out(`You ask the lad what it's called. You chant it. It's a Rookidee called Pip. By the third time, forty people are chanting it.`, meters(0, -3), ...kind(1), mark('loyalty-test'), flag('galar-cheered-test'))),
      ch(`"What's it done to you?"`, out(`He opens his mouth. He shuts it. "...Nowt." He doesn't boo either.`, meters(0, -2), mark('loyalty-test'))),
    ]),
  ev('mc-found-out', 'Found Out', 'Evil Teams', { callback: true, requires: inside('mc', { suspicion: 10, lacks: 'found-out' }), cast: [OLEANA, HOLLIS], tint: '#3a1418' },
    `Your lanyard doesn't open the lift. Oleana is waiting in the lobby, with Director Hollis and a clipboard. ${say('Oleana', `Future Planning. The Chairman is disappointed. I'm not; I never expected anything else.`)} You've been found out. The only way back outside is through them, with your own party, on worse ground than you'd have chosen.`,
    [ch('Fight your way out.', fight(`They come at you two at once.`, foe('executive', 'Oleana and Director Hollis', 6, { lv: 2, format: 'doubles' }),
      mark('found-out'), story({ end: 'defeated' }), flag('galar-ending-turn'), flag('macro-found-out')))]),
  ev('yl-found-out', 'Found Out', 'Evil Teams', { callback: true, requires: inside('yl', { suspicion: 10, lacks: 'found-out' }), cast: [YG], tint: '#3a1418' },
    `The shutter's down when you come back, and there are six Yellers in front of it who won't meet your eye. "Somebody's been talkin' to the League. There's a sheet wi' your name on it. I'm not sayin' it's you. I'm sayin' you're goin' out the long way." You've been found out. The only way back outside is through them, with your own party, on worse ground than you'd have chosen.`,
    [ch('Fight your way out.', fight(`They come at you two at once.`, foe('grunt', 'Two Yellers', 6, { lv: 2, format: 'doubles' }),
      mark('found-out'), story({ end: 'defeated' }), flag('galar-ending-yell-turn'), flag('yell-found-out')))]),
];
(TESTS[0] as Json).remembers = [{ id: 'zane', when: [flagIs('ally-zane')], notice: say('Zane', `He'll ask you to cut a line. 'A rounding error.' Ask him to come and look at it.`) }];
(TESTS[1] as Json).remembers = [{ id: 'beck', when: [flagIs('ally-beck')], notice: say('Beck', `They'll want you to boo a Pokémon. Don't. Marnie'd never speak to you.`) }];
(TESTS[2] as Json).remembers = [{ id: 'zane', when: [flagIs('ally-zane')], notice: `Zane is by the lifts. He catches your eye, and takes one step sideways, out of their line.` }];
(TESTS[3] as Json).remembers = [{ id: 'beck', when: [flagIs('ally-beck')], notice: `Beck is by the chip shop. He catches your eye, and takes one step sideways, out of their line.` }];

export const EVENTS: Json[] = [
  ...offerOf('yl'), ...offerOf('mc'), ...mcAct1, ...ylAct1, mcAct2, ylAct2, ...mcAct3, ...ylAct3, mcAct4, ylAct4, ...act5('mc'), ...act5('yl'),
  ...OPS, ...MIDNIGHT, ...SEATS, ...MORE, ...OFFICERS, ...TESTS,
];
export const REMOVE: string[] = [];
void KAYA; void intel;
