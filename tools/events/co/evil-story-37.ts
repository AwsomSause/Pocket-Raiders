// Catalog Overhaul Pack, Evil Teams Volume III: Galar, the end (MACRO_COSMOS_YELL_GALAR_FULL_2). The Final Choice on the
// night of the Champion Cup (written once per side: mc-final-choice, yl-final-choice), the eight endings as chain
// pseudo-stages (ps_mc_plan, ps_mc_turn, ps_mc_lift, ps_mc_own; ps_yl_plan, ps_yl_turn, ps_yl_bought, ps_yl_own: written by
// _evil-story-sync.ts), Team Encore (the third option: Route 9 from outside, founding, three Away Days and Twelve
// Thousand), and who ends up where (part J). "A Thousand Years" ends the team story here: Evil Mode is on hold (Kice);
// its four decisions are flags only.
import { bondUp, ch, ev, fight, flag, flagIs, inRegion, out, room, trainer, wild, type Json } from '../dsl.ts';
import { evil as story, kind, prompt, rivalTrust, STEALTH } from './_evil-story-kit.ts';
import { BOBBIN, ROUTE9_INTRO } from './evil-story-36.ts';

export const CATEGORY = 'evil-story';

type Side = 'mc' | 'yl';
const ROSE = 'trainer.pr/rose';
const OLEANA = 'trainer.pr/oleana';
const ZANE = 'boss.drive/galarian-swsh-office-worker-man';
const SHAY = 'boss.drive/galarian-swsh-office-worker-woman';
const YG = 'boss.drive/galarian-swsh-yell-grunt-man';
const BECK = YG;
const SHAZ = 'trainer.pr/musician';
const PIERS = 'boss.piers';
const MARNIE = 'boss.marnie-masters4';
const LEON = 'boss.leon-masters';
const HOP = 'boss.hop';
const SONIA = 'boss.sonia';
const PEONY = 'boss.peony';
const BALLGUY = 'boss.ballguy';
const HOLLIS = 'boss.drive/galarian-swsh-leaguestaff-man';
const OLDMAN = 'trainer.pr/veteran_m';
const SORDSHIEL = 'boss.sordward-shielbert';
const RED = '#3a1418';
const TOWER = '#1e2430';
const SPIKE = '#1a141c';
const G = inRegion('galar');
const say = (who: string, line: string): string => `${who}: "${line}"`;
const mark = (m: string): Json => story({ mark: m });
const night: Json = { kind: 'period', in: ['night'] };
const isSide = (s: Side): Json => flagIs(s === 'mc' ? 'galar-side-mc' : 'galar-side-yell');
/** A fight inside an ending's own map: a loss walks the player back out, and the run goes on. */
const ps = (b: Json): Json => ({ ...b, pseudo: true });
const step = (id: string, name: string, intro: string, choices: Json[], o: { cast?: string[]; pokemon?: string; tint?: string; effect?: string } = {}): Json =>
  ev(id, name, 'Evil Teams', { room: true, cast: o.cast ?? [ROSE], tint: o.tint ?? TOWER, effect: o.effect ?? 'none', ...(o.pokemon ? { pokemon: o.pokemon } : {}) }, intro, choices);
const on = (text: string, next: string, ...fx: Json[]): Json => out(text, ...fx, room(next));

// Part J. Who ends up where: said as each ending closes.
const EPILOGUE: Record<'plan' | 'yplan' | 'turn' | 'yturn' | 'lift' | 'bought' | 'own' | 'encore', string> = {
  plan: `Rose hands himself in, and asks for a pencil. Oleana inserts the figure: low. Zane was right, and frames the graph. Shay finds the four billion's gone. Beck watched a red sky from a dark town. Kaya makes a banner: WE'RE STILL HERE. Marnie played under a red sky. Piers sang in the dark. Leon lost, and got up. Peony went in first, two hours. The Ball Guy has a ball. Bede collects the last Star. Spikemuth is dark; then one line. At Number Two, Rose writes forty-one sheets from memory, and gets thirty-eight.`,
  yplan: `Rose hands himself in, after. Oleana refunds forty thousand policies. Zane wires the truck's aux. Shay finds the clause. Beck got it on a screen, after eight years. Kaya has a cousin in a truck. Marnie: "Oi. Hangry." Piers: "Is this on?" Leon: "He's just 'Charizard.'" The Ball Guy is chanted, on the concourse. Bede is chanted, by name, and has to leave the room. Spikemuth is on.`,
  turn: `Rose lit the lamp; or didn't. Oleana told you to hurry up and win. Zane pulled it too, and turned the mug round. Shay gives evidence, in a spreadsheet. Beck gets a crowd, cries, and denies it. Kaya makes the League's banners. Marnie plays, and wins or doesn't. Piers has a crowd. Leon is Champion. Peony was sent for, and put his boots on the desk. The Ball Guy took the head off. Bede takes the watch off. Spikemuth has a crowd. At Number Two, the lamp is lit.`,
  yturn: `Rose is the same. Oleana resigns in six weeks. Zane finds the spur a month late. Beck left his towel on a seat. Kaya has a banner she doesn't unroll. Marnie: "Just us. Always was." Piers stands in an away end, for the first time. Leon played Marnie with nobody watching her. The Ball Guy has a ball. Spikemuth is the same as it was. But the forty have stopped getting in the way, and they never do again.`,
  lift: `Rose: "The League's me." Oleana holds the lift. Zane threw a brass lever. Shay audits a lift's load rating, after. Beck: "Say ta." Kaya made one for the tower: HIYA. Marnie sees the sign lit. Piers has forty feet of neon. Leon gets lost in the tower and meets sixty people in a lift. Peony rides the lift. The Ball Guy: "BALL! GUY!" Bede is in the lift, somehow, appalled. Spikemuth is lit.`,
  bought: `Rose is delighted. Until the plate. Oleana made the offer, efficiently. Zane costs an arena. Shay stops the cheque once; it's reissued. Beck: "They'll not know the names." Kaya is asked to do the arena's signage, and says no. Marnie is offered a sponsorship, and raises one eyebrow. Piers puts the guitar in its case. Leon opens the arena. Peony scratched his initial, forty years back. The Ball Guy is the mascot of Wyndon East. Bede is offered the arena's Gym. Spikemuth is Wyndon East.`,
  own: `Rose was beaten: "I'd endorse you." Oleana takes six weeks' leave, and comes back with a tan and a list. Zane has the Workshop. Shay has the Counting Room. Beck is the loudest Lead. Kaya designs the uniform. Marnie lends her name. Piers: "Don't." Leon asks to be un-sponsored, and is. Peony: "Chin up!" He runs Rail, badly, joyfully. The Ball Guy is asked, and says no, and thinks about it. Bede has a pink cardigan. Spikemuth is lit first. Number Two is on the redrawn map.`,
  encore: `Rose switched it off himself. Oleana signed it off as "losses." Zane carries a generator up a quarry. Shay finds a ferry in the budget. Beck has a chip shop, and a third chair. Kaya made forty banners; she asked each. Marnie came home: "Go on, then." Piers has twelve thousand. Leon watches it on the other screen, and wishes he were there. Peony: "I've brought a crowd." The Ball Guy turned up without it. Bede is found by a very old woman. Spikemuth has twelve thousand. Number Two has one street, seven men, and forty-one names.`,
};

// ---------- A. The Final Choice (one per side) ----------
const STADIUM = `Wyndon Stadium. Sixty thousand. The Champion Cup's final: Leon, and whoever's got there. A red cloud over the roof. On the big screen: Rose. In a suit, for once. Smiling. Under Hammerlocke: a cage of light, opening. A switch. Floor 50: Oleana, at the window. A lamp on a desk. The away end, block J: forty people in black and pink. Towels. No horns: she asked. In Spikemuth: Piers, on a pallet stage, with a camera somebody's borrowed. ${say('Rose, on the screen, to sixty thousand', `Galar! Forgive the interruption. I'll be brief. I've some wonderful news, and I'm afraid it can't wait a thousand years.`)} The stadium laughs. They think it's a sponsor message. ${say('Rose', `In a few moments, Macro Cosmos will secure this region's energy for the next millennium. There'll be a little light. A little noise. Please remain seated.`)}`;
const finalOf = (s: Side): Json => {
  const intro = s === 'mc'
    ? `${STADIUM} Off screen, to an earpiece; you hear it, and so does anyone with a lanyard: ${say('Rose', `Future Planning. You're at the Plant? Good. I'd not trust it to anyone else. The switch on the left. When I say.`)}`
    : `${STADIUM} The same minute, in block J. ${say('Gaz, looking up', `It's gone red. Oi. Oi. The sky's gone red.`)} ${say('Beck', `That's the leccy. That's where it's all been goin'.`)} Marnie, on the pitch, not to them, to her Morpeko: ${say('Marnie', `Steady.`)} Across the stadium, on the grass, a Wooloo's starting to swell.`;
  const e = ev(`${s}-final-choice`, 'The Final Choice', 'Evil Teams', { room: true, cast: s === 'mc' ? [ROSE, ZANE] : [BECK, MARNIE], tint: RED, effect: 'glint' }, intro,
    s === 'mc'
      ? [
          ch('Throw the switch.', on(`The switch on the left.`, 'mc-plan-hop', flag('galar-final-plan'))),
          ch('Pull the breaker.', on(`Your hand's on the switch on the left. It moves to the one on the right.`, 'mc-turn-breaker', flag('galar-final-turn'))),
          ch('Reroute one line, east.', on(`You touch neither. You go to the bottom of the panel. Brass.`, 'mc-lift-feeder', flag('galar-final-lift'))),
          ch(`"Give it to someone with a thousand years."`, on(`You go up to the roof.`, 'mc-own-roof', flag('galar-final-own')), { requires: [{ kind: 'evil', rank: 5, has: 'confided' }] }),
        ]
      : [
          ch(`"Is this on?" Take the broadcast for Spikemuth.`, on(`Kaya's already got her rucksack on.`, 'yl-plan-feed', flag('galar-final-yell-plan'))),
          ch(`"Go home and eat."`, on(`You stand up in block J.`, 'yl-turn-coach', flag('galar-final-yell-turn'))),
          ch(`Hand Oleana the old plant's gate.`, on(`You take a key out of your pocket: the old substation's. Mr. Oldroyd's.`, 'yl-bought-warn')),
          ch(`"You've never had a leader. D'you want one?"`, on(`Forty people look round.`, 'yl-own-blockj', flag('galar-final-own')), { requires: [{ kind: 'evil', rank: 5, has: 'confided' }] }),
        ]);
  (e as Json).remembers = s === 'mc'
    ? [
        { id: 'spur', when: [flagIs('rose-knows-spur')], notice: `You could say it into the earpiece: "You're dimming the first town you lit."` },
        { id: 'floor', when: [flagIs('galar-told-floor')], notice: `Thirty-one's dark. Nobody's at the relays.` },
        { id: 'chips', when: [flagIs('galar-chipshop')], notice: `Zane's got the feeders. Beck's got a coach.` },
      ]
    : [
        { id: 'coach', when: [flagIs('galar-told-coach')], notice: `Shaz has five stadiums' worth of names in a ring binder.` },
        { id: 'names', when: [flagIs('yell-names-all')], notice: `You know all six names. You could lead a chant.` },
        { id: 'chips', when: [flagIs('galar-chipshop')], notice: `Zane's got the feeders. Beck's got a coach.` },
      ];
  return e;
};

// ---------- B. Ending 1 (MC): "Launch Day" (ps_mc_plan) ----------
const PLAN_END = (lead: string): Json => out(`${lead} He hands himself in. He walks into Hammerlocke station and asks for a pencil. Galar is lit for a millennium. And it's frightened of its own power stations: once a stage, something on a pitch or a road may be the size of a house for a turn, and nobody's sure it'll come down. Spikemuth is dark, that night. Then the first line is reconnected: he signed the order from a cell, in pencil. The company has no Chairman. It looks to Future Planning. ${EPILOGUE.plan}`,
  story({ beat: true }), story({ end: 'allied' }), flag('galar-ending-plan'), flag('galar-lit'), flag('rose-station'), flag('galar-overcharged'));
const mcPlan: Json[] = [
  step('mc-plan-hop', 'Phase 1: The Lobby', `Your party holds Rose Tower. Three come up. The first is Hop. ${say('Hop', `You've got a lanyard. You've got a— mate, what's Future Planning?`)}`, [
    ch('Battle him.', fight(`"Right. Right! Let's see it, then."`, ps(trainer('Hop', { sprite: HOP, rival: true, size: 6, lv: 1, win: [room('mc-plan-sonia')] }))), rivalTrust(-1))], { cast: [HOP] }),
  step('mc-plan-sonia', 'Phase 1: The Lobby', `Sonia, with a book. ${say('Sonia', `I've read every source on the Darkest Day there is. D'you know what none of them say? 'And it went fine.'`)}`, [
    ch('Battle her.', fight(`She closes the book, and keeps a finger in her page.`, ps(trainer('Sonia', { sprite: SONIA, team: ['yamper', 'boltund', 'eldegoss'], size: 3, lv: 0, win: [room('mc-plan-leon')] }))))], { cast: [SONIA] }),
  step('mc-plan-leon', 'Phase 1: The Lobby', `${say('Leon', `I've never lost. I'd like you to know I'm not angry. I'm lost. I came up the wrong stairs twice. But I'm here now.`)}`, [
    ch('Battle the Champion.', fight(`Charizard lands on the marble.`, ps(trainer('Leon', { sprite: LEON, team: ['charizard', 'aegislash', 'dragapult', 'haxorus', 'rhyperior', 'seismitoad'], size: 6, lv: 2, win: [room('mc-plan-relays')] }))))], { cast: [LEON] }),
  step('mc-plan-relays', 'Phase 2: The Relays', `Leon, beaten: ${say('Leon', `...So that's what it's like. Huh.`)} He sits on the marble. He takes off the cape. It's all logos. He looks at them as if for the first time. Five relays to feed.`, [
    ch('Feed the relays.', on(`Five relays. Each takes a turn.`, 'mc-plan-switch'), { prompt: prompt(STEALTH), fail: on(`The fourth relay arcs and throws you off it; you feed it on the second try.`, 'mc-plan-switch') }),
  ], { cast: [ZANE] }),
  step('mc-plan-switch', 'Phase 3: The Switch', `${say('Rose, in the earpiece', `Now.`)} The switch on the left. The cage opens. The Darkest Day: three feeds, and then a hand the size of the sky. You're holding the Stars feed open. Two helpless turns. ${say('Rose, on the roof, beside you, in a red wind', `There. There. Do you see it? A thousand years. Was that so hard?`)} Two shapes arrive. Nobody invited them. One comes down the red light like a blade. One lands like a door being shut. ${say('Rose', `Ah. The heritage. I'd wondered if they'd turn up.`)}`, [
    ch('Hold it.', fight(`It's held. Barely. By you, and two wolves, and a Champion who's just lost for the first time and got back up.`, ps(wild({ species: ['eternatus'], lv: 2, win: [room('mc-plan-roof')] })))),
  ], { cast: [ROSE], pokemon: 'eternatus', tint: RED, effect: 'glint' }),
  step('mc-plan-roof', 'The Roof, After', `${say('Rose', `It's done. It's banked. A thousand years of light, and I was the one who—`)} He looks north. The hills. Then east. The coast's dark. One patch. It's been dark for nine minutes. ${say('Rose', `What's that. There. That's not a cut; I didn't authorise—`)}`, [
    ch('"East coast spur. R and B."', PLAN_END(`${say('Rose', `That's— that's on my wire?`)} He takes his glasses off. ${say('Rose', `I lit that. With a hand winch. I've just put it out to prove nobody'd ever be left dark.`)} Oleana, behind you: ${say('Oleana', `The press release, Chairman. Shall I insert the figure?`)} ${say('Rose', `...What is it?`)} ${say('Oleana', `Low.`)} He doesn't say "good." It's the first time.`), { requires: [flagIs('galar-brass-seen')] }),
    ch('(Say nothing.)', PLAN_END(`Oleana, behind you: ${say('Oleana', `The press release, Chairman. Shall I insert the figure?`)} ${say('Rose', `...What is it?`)} ${say('Oleana', `Low.`)} He doesn't say "good." It's the first time.`)),
  ], { cast: [ROSE, OLEANA], tint: RED }),
];
(mcPlan[3] as Json).remembers = [{ id: 'floor', when: [flagIs('galar-told-floor')], notice: `Thirty-one was told. Nobody's at the relays: you feed all five alone.` }];

// ---------- C. Ending 1 (Yell): "Is This On?" (ps_yl_plan) ----------
const YPLAN_END = (lead: string): Json => out(`${lead} The League votes to build no stadium in Spikemuth. It votes to hold the final there. No Dynamax. Piers hates it. He writes a song. Yell stops blocking roads. Nobody told them to. They've found something louder. ${EPILOGUE.yplan}`,
  ...kind(2), story({ beat: true }), story({ end: 'allied' }), flag('galar-ending-yell-plan'), flag('spikemuth-on'), flag('galar-chanted'));
const ylPlan: Json[] = [
  step('yl-plan-feed', 'Phase 1: The Feed', `Kaya, in block J, with a rucksack: ${say('Kaya', `I've a cousin in the broadcast truck. He's on his break. He's left it unlocked.`)} ${say('Beck', `Eight years I've wanted this town on a screen.`)} The stands, the concourse, the truck. Stadium Security have whistles.`, [
    ch('Run for the truck.', fight(`Two whistles at once.`, ps(trainer('Stadium Security', { size: 3, lv: 1, win: [room('yl-plan-truck')] }))))], { cast: [BECK], tint: RED }),
  step('yl-plan-truck', 'Phase 1: The Feed', `More whistles, on the concourse.`, [
    ch('Keep running.', fight(`They don't stop blowing them the whole fight.`, ps(trainer('Stadium Security', { size: 3, lv: 1, win: [room('yl-plan-aux')] }))))], { cast: [], tint: RED }),
  step('yl-plan-aux', 'Phase 2: Is This On', `The truck. A desk. Sixty thousand faces on one monitor; a red sky on another; a third, dark, labelled AUX: UNUSED. Kaya's cousin, coming back with a pasty: "What're you— that's live—" "What's on Aux?" The cousin: "Nothing. It's the regional feed. It's been dead since— it used to be Spikemuth."`, [
    ch('Switch to Aux.', on(`The big screen. Rose, mid-sentence. The picture tears. A test card: SPIKEMUTH PUBLIC ACCESS. A thin man, squinting. ${say('Piers', `Is this on? ...Right. Galar. This is Spikemuth. No Power Spot. No stadium. No sponsors. You've not seen us in eight years. We're still here.`)} Sixty thousand people, who came for a final, looking at a street.`, 'yl-plan-chant')),
  ], { cast: [PIERS], tint: RED }),
  step('yl-plan-chant', 'Phase 3: The Chant', `The sky's gone red. On the pitch: a Wooloo the size of a bus. A Corviknight that fills the goal. Marnie's Morpeko, enormous, hangry, lost. Marnie, small on the grass, level: ${say('Marnie', `Oi. Hangry. It's all right.`)} It doesn't hear. It's too big. One voice isn't enough. Shaz, in block J, on her feet, with a ring binder: ${say('Shaz', `One, two, three—`)}`, [
    ch('"Han-gry."', on(`Forty people, low, in time: "Han-gry. Han-gry. Han-gry." It looks down. Block J has it.`, 'yl-plan-rounds'), { prompt: prompt('echo-rhythm'), fail: on(`You come in late. Shaz carries it. "Han-gry. Han-gry." It looks down. Block J has it.`, 'yl-plan-rounds') }),
  ], { cast: [MARNIE, SHAZ], pokemon: 'morpeko', tint: RED }),
  step('yl-plan-rounds', 'Phase 3: The Chant', `Five stadiums, by link. You lead; Yell follows; the stands learn it. The lower tier is next. Then the whole east stand: a girl in row nine knows what the Corviknight's called; it's her dad's. Then Wyndon. ${say('Leon', `He's just 'Charizard.' I never— he's never had a—`)} Sixty thousand: "CHAR-I-ZARD." Leon's crying. He's delighted. The last name is your lead's. Galar says it.`, [
    ch(`Say your lead's name.`, on(`Piers, on the screen, deadpan: ${say('Piers', `...And that's why we don't Dynamax in Spikemuth.`)}`, 'yl-plan-above', bondUp(1))),
  ], { cast: [LEON, PIERS], tint: RED }),
  step('yl-plan-above', 'Phase 4: The Thing Above the Plant', `It's still up there. The chant's brought the pitches down; it's not shut the cage. Every stadium's chanting.`, [
    ch('Face it.', { ...YPLAN_END(`One helpless turn, not two: there's a whole region shouting. It's held. It comes down. The cage shuts.`), battle: ps(wild({ species: ['eternatus'], lv: 2 })) }),
  ], { cast: [], pokemon: 'eternatus', tint: RED, effect: 'glint' }),
];
(ylPlan[4] as Json).remembers = [{ id: 'bobbin', when: [flagIs('galar-cheered')], notice: `The lower tier joins on "Bob-bin." They'd heard about the boy from Postwick.` }];

// ---------- D. Ending 2 (MC): "There's Time" (ps_mc_turn) ----------
const TURN_END = (lead: string, ...fx: Json[]): Json => out(`${lead} Macro Cosmos is broken up. Zane keeps the mug. He's turned it round, so the words face the wall. The thousand-year problem's still real. It's given to Sonia; or to Magnolia; or to Rose, from his cell, with a pencil. The third's the only one that says a number. ${EPILOGUE.turn}`,
  story({ beat: true }), story({ end: 'defeated' }), flag('galar-ending-turn'), flag('macro-broken'), ...fx);
const mcTurn: Json[] = [
  step('mc-turn-breaker', 'Phase 1: The Breaker', `${say('Zane, beside you', `That's the breaker.`)} "It's a thousand years off." ${say('Zane', `...It's a thousand years off.`)} He puts his hand on it too. He's wanted to for three years. The cage stops opening. ${say('Rose', `Future Planning? I've no reading. Future Planning. Ingleby. What have you done.`)}`, [
    ch('Go up the tower.', on(`The Tower Climb, from the bottom, with a lanyard. Every floor knows you.`, 'mc-turn-ballguy')),
  ], { cast: [ZANE] }),
  step('mc-turn-ballguy', 'Phase 2: The Tower', `Floor 12. The Ball Guy. ${say('The Ball Guy', `Heya, Trainer! Have a—`)} He stops. He takes the head off. There's a man under it. He's about fifty. "Go on up. I'll say I didn't see."`, [
    ch('Go on up.', on(`Floor 20.`, 'mc-turn-hollis')),
  ], { cast: [BALLGUY] }),
  step('mc-turn-hollis', 'Phase 2: The Tower', `Floor 20. Director Hollis.`, [
    ch('Battle him.', fight(`He announces his own defeat as a delay.`, ps(trainer('Director Hollis', { sprite: HOLLIS, team: ['steelix', 'klinklang', 'copperajah'], size: 3, lv: 1, win: [room('mc-turn-pryce')] }))))], { cast: [HOLLIS] }),
  step('mc-turn-pryce', 'Phase 2: The Tower', `Floor 25. Director Pryce, who reads your policy aloud. "You're covered. I checked. I'd hoped you'd not need it."`, [
    ch('Battle him.', fight(`He files each move as he makes it.`, ps(trainer('Director Pryce', { sprite: 'boss.drive/galarian-swsh-office-worker-man', team: ['bronzong', 'perrserker', 'klinklang'], size: 3, lv: 1, win: [room('mc-turn-thirtyone')] }))))], { cast: [] }),
  step('mc-turn-thirtyone', 'Phase 2: The Tower', `Floor 31. Forty people at forty desks, who look up, and then look at Zane. ${say('Zane', `It's a thousand years. I've the graph. Go home.`)} They go. Floor 44: Shay, holding the lift.`, [
    ch('Up to forty-nine.', on(`The corridor outside fifty.`, 'mc-turn-oleana')),
  ], { cast: [ZANE, SHAY] }),
  step('mc-turn-oleana', 'Phase 3: Oleana', `${say('Oleana', `I was nine. He shook my hand and the lights came on behind him. I thought he'd done it by shaking my hand.`)} ${say('Oleana', `I've known for a year. I'd stand between him and whoever tried to stop him, and I'd hate it, and I'd do it. So. Here I am. Doing it.`)} ${say('Oleana', `Hurry up and win.`)}`, [
    ch('Battle her.', fight(`Garbodor first: her First Friend. She fights as well as she can. She can't not.`, ps(trainer('Oleana', { sprite: OLEANA, team: ['garbodor', 'froslass', 'tsareena', 'salazzle', 'milotic'], size: 5, lv: 2, win: [room('mc-turn-fifty')] }))))], { cast: [OLEANA] }),
  step('mc-turn-fifty', 'Phase 4: Floor 50', `Oleana, beaten: ${say('Oleana', `Good. Go in. He'll be kind. That's the worst of him.`)} The office. He's at the window. He's not fighting; the Plant's off; there's nothing to fight for. ${say('Rose', `Well played. Truly. I'd endorse you.`)} ${say('Rose', `You'll tell me there's time. They all do.`)} "There's time. And there's a town on the east coast you've been turning off to save it."`, [
    ch('(Leave him.)', TURN_END(`You leave him at the window.`, flag('rose-left'))),
    ch('"Light it."', TURN_END(`There's a box of matches in the drawer. There's always been. He's never. He lights number forty-one. It's a small yellow light in a very large dark office. It's the first time in forty-five years he's looked at a light and not counted it.`, flag('rose-lit'))),
    ch('"Come and look at Spikemuth."', TURN_END(`He gets his coat. He's never been.`, flag('rose-came'))),
    ch(`"You didn't lose one. Thackray came up whistling."`, TURN_END(`He picks up the lamp. ${say('Rose', `Four minutes. I stood at that pithead four minutes thinking I'd lost a man. I've been standing there since. Forty-five years of four minutes.`)} There's a box of matches in the drawer. He lights number forty-one.`, flag('rose-lit')), { requires: [flagIs('rose-lamp-41')] }),
  ]),
];
(mcTurn[4] as Json).remembers = [{ id: 'floor', when: [flagIs('galar-told-floor')], notice: `Nobody's on thirty-one. The floor was told. It's dark.` }];
(mcTurn[6] as Json).remembers = [{ id: 'peony', when: [flagIs('galar-peony-met')], notice: `You could tell him what Peony told you: "The lamps all came up. Every one."` }];

// ---------- E. Ending 2 (Yell): "Go Home and Eat" (ps_yl_turn) ----------
const ylTurn: Json[] = [
  step('yl-turn-coach', 'Phase 1: The Coach', `"She asked you to go home." ${say('Gaz', `We came to watch.`)} "You came to boo. You've three chants ready for the lad from Postwick and they're all about his mum." Shaz closes the ring binder. ${say('Beck', `...They are.`)} "Go home. Eat. Let her win it or lose it."`, [
    ch('Watch them go.', on(`They go. It's the saddest walk in the game: forty people in black and pink, down a concourse, past sixty thousand going the other way. One towel's left on a seat in block J. Beck's.`, 'yl-turn-final', flag('yell-walked'))),
  ], { cast: [BECK, SHAZ], tint: RED }),
  step('yl-turn-final', 'Phase 2: The Final, with Nobody', `Marnie plays Leon. You watch from the tunnel. She's good. She's very good. Nobody's shouting for her. She looks up, once, at block J. There's a towel on a seat. ${say('Marnie, to her Morpeko', `S'all right. Just us. Always was.`)}`, [
    ch('Wait in the tunnel.', on(`The Darkest Day comes. There's nobody in Wyndon who knows the names. The pitch is full of things the size of houses.`, 'yl-turn-red')),
  ], { cast: [MARNIE], pokemon: 'morpeko', tint: RED }),
  step('yl-turn-red', 'Phase 3: The Red Sky, with No Chant', `Five of them, the size of houses, and no chant to bring them down. Every one has to be fought down.`, [
    ch('Fight them down.', fight(`One. Two. Three. And then, at the fourth: a horn. From the car park. The coach never left. Big Daz couldn't get it started. Forty people come back up the concourse. Not booing. Not blocking. ${say('Shaz', `She said go home. She never said stay home. One, two, three—`)}`, ps(wild({ format: 'doubles', species: ['wooloo', 'corviknight', 'morpeko', 'centiskorch'], lv: 1, win: [room('yl-turn-after')] })))),
  ], { cast: [], tint: RED, effect: 'glint' }),
  step('yl-turn-after', 'Go Home and Eat', `The fifth comes down to its own name.`, [
    ch('Go down to the pitch.', out(`Marnie didn't ask. They came anyway. That's Yell. It always was. But they've stopped getting in the way, and they never do again. ${EPILOGUE.yturn}`,
      story({ beat: true }), story({ end: 'defeated' }), flag('galar-ending-yell-turn'), flag('yell-came-back'))),
  ], { cast: [BECK, MARNIE], tint: RED }),
];

// ---------- F. Ending 3A: "Sixty in a Lift" (MC to Yell, ps_mc_lift) ----------
const mcLift: Json[] = [
  step('mc-lift-feeder', 'Phase 1: The Feeder', `The board, under Hammerlocke. EAST COAST (R&B). ${say('Zane', `That's— you can't route to that. It's a spur. It's forty years old.`)} "Can it take a tenth of what's in that cage?" He does the sum on his hand. ${say('Zane', `...It can take a hundredth. That's still more than Spikemuth's had since I was born.`)}`, [
    ch('Throw it. Permanently.', on(`It's a big brass lever and it takes two of you. In Spikemuth: every bulb in the street comes on. Ones nobody knew were there. Neon that hasn't worked in eight years. A sign over the Gym, forty feet long, that nobody under thirty's ever seen lit: SPIKEMUTH.`, 'mc-lift-lift', flag('spur-live'), flag('spikemuth-sign'))),
  ], { cast: [ZANE], tint: '#14181c' }),
  step('mc-lift-lift', 'Phase 2: The Tower', `By Holo-call, to block J: "Beck. The tower's side door. I've a lanyard." ${say('Beck', `How many can you get in?`)} "How many've you got?" Sixty Yellers in a lift. It's rated for twelve. ${say('Gaz', `Breathe in!`)} Kaya, flat against the mirror, with a banner: ${say('Kaya', `I've made one for the tower. It says HIYA.`)} Floor 12. The doors open. The Ball Guy. He looks at sixty people in black and pink. Sixty people look at a man with a Poké Ball for a head. ${say('The Ball Guy', `...Have a ball?`)} Sixty people: "BALL! GUY! BALL! GUY!" Nobody's ever chanted him. The head tilts. Under it, something that might be a sob.`, [
    ch('Up, floor by floor.', on(`They don't fight anyone. They cheer them. Director Hollis is chanted out of his office. He comes quietly. He's not been called by his first name in a decade; Shaz got it off the door.`, 'mc-lift-fifty')),
  ], { cast: [BECK, BALLGUY] }),
  step('mc-lift-fifty', 'Phase 3: Floor 50', `The lift. Sixty people. Rose's office. ${say('Rose', `...Who are all of you?`)} ${say('Beck', `Spikemuth.`)} ${say('Rose', `I don't—`)} ${say('Beck', `East coast. End o' the old spur. You laid it. There's a plate. 'R and B.' You've been turnin' us off for eight year an' tonight some lass with a lanyard turned us back on.`)} ${say('Rose', `You came up here to—`)} ${say('Beck', `Say ta.`)} A pause. ${say('Beck', `An' to ask who the League is. I sat in your lobby four hours once. Nobody could tell me.`)} Rose sits down. In his brother's chair. ${say('Rose', `It's me. I'm afraid the League's me.`)}`, [
    ch('"There\'s time."', out(`The cage is still half open. He shuts it from the desk, with sixty people at your back and no battle on any floor. Spikemuth has lights and a crowd. The away coaches come back. The chip shop by the Gym reopens. Then the other one. ${EPILOGUE.lift}`,
      ...kind(2), story({ beat: true }), story({ end: 'exposed' }), flag('galar-ending-other-yell'))),
  ], { cast: [ROSE, BECK] }),
];

// ---------- G. Ending 3B: "Bought" (Yell to MC, ps_yl_bought). Warned, and confirmed twice. ----------
const WARNING = `Spikemuth will be sold. It'll have light, a Power Spot, a stadium and a new name. Nobody's harmed. It won't be Spikemuth.`;
const ylBought: Json[] = [
  step('yl-bought-warn', 'Bought', WARNING, [
    ch('Go on.', on(`You read it again.`, 'yl-bought-warn-2')),
    ch('Go back.', on(`You put the key back in your pocket.`, 'yl-final-choice')),
  ], { cast: [OLEANA] }),
  step('yl-bought-warn-2', 'Bought', `${WARNING} Are you sure?`, [
    ch(`I'm sure.`, on(`You go to Oleana, with the key.`, 'yl-bought-gate', flag('galar-final-bought'))),
    ch('Go back.', on(`You put the key back in your pocket.`, 'yl-final-choice')),
  ], { cast: [OLEANA] }),
  step('yl-bought-gate', 'Phase 1: The Gate', `${say('Oleana', `Spikemuth. There's a plant?`)} "The old one. Under the Gym. It's on your first spur." She looks it up. Four seconds. ${say('Oleana', `...There's a Power Spot under it. Capped. Since before the survey. We never looked; it wasn't on the map.`)} She almost smiles. It's the efficient kind. ${say('Oleana', `The Chairman will be delighted. We'll make an offer for the freehold tonight.`)}`, [
    ch('Go back to Spikemuth.', on(`Beck is at the shutter, alone.`, 'yl-bought-beck')),
  ], { cast: [OLEANA] }),
  step('yl-bought-beck', 'Phase 2: Beck', `${say('Beck', `You give 'em the key. Oldroyd's key. He polished that plate thirty year.`)} ${say('Beck', `They'll light us. I know. They'll light us lovely.`)}`, [
    ch('Battle him.', fight(`He was a Gym trainer when there were sixty in on a Tuesday. He's better than he's let on.`, ps(trainer('Beck Gallowglass', { sprite: BECK, team: ['obstagoon', 'skuntank', 'scrafty', 'toxtricity'], size: 4, lv: 2, win: [room('yl-bought-offer')] }))))], { cast: [BECK], tint: SPIKE }),
  step('yl-bought-offer', 'Phase 3: The Offer', `Beck, beaten: ${say('Beck', `...They'll not know the names.`)} A contract, four lines: "Macro Cosmos Construction to redevelop the site known as Spikemuth as WYNDON EAST ARENA. Capacity 40,000. Dynamax-capable. Existing structures to be cleared. Residents to be rehoused at the developer's expense in superior accommodation." Nobody's harmed. Everybody's rehoused. It's generous. Piers, reading it, on a pallet: ${say('Piers', `'Superior.' Aye. It will be.`)} He puts the guitar in its case. ${say('Piers', `They've offered me the Gym. In the new place. Power Spot. Telly.`)} A pause. ${say('Piers', `It's what I turned down. They've just moved the town to it instead.`)}`, [
    ch('(Say nothing.)', out(`Spikemuth is Wyndon East: a Center that heals in full, a shop with everything, very bright. Your Pokémon are each a step less sure of you, for now; it recovers. Team Yell still goes to every match. It doesn't chant names. It's got nothing of its own to shout for. It claps, politely. The night before the diggers came, Mr. Oldroyd took the plate off the box and gave it to you, and didn't say why: R. & B., LAMPS. ${EPILOGUE.bought}`,
      bondUp(-1, 'party'), story({ beat: true }), story({ end: 'defeated' }), flag('galar-ending-other-macro'), flag('spikemuth-bought'), flag('brass-plate'))),
  ], { cast: [PIERS], tint: SPIKE }),
];
const PLATE = ev('gl-brass-plate', 'The Brass Plate', 'Evil Teams', { requires: [G, flagIs('brass-plate'), flagIs('brass-plate-given', 0, 0), flagIs('rose-station', 0, 0)], cast: [ROSE], tint: TOWER },
  `Rose, at his desk. You've a brass plate in your bag: R. & B., LAMPS.`,
  [
    ch('Put the plate on his desk.', out(`${say('Rose', `...I laid that.`)} "You've knocked it down." ${say('Rose', `I've— there's an arena. It's a good arena.`)} He turns the plate over. On the back, scratched with a nail, forty years ago, in two hands: R. and P. ${say('Rose', `He scratched his. I'd forgotten he scratched his.`)} He stops the diggers. Half the street's left. It's enough to start from.`, ...kind(2), flag('brass-plate-given'), flag('spikemuth-half'))),
    ch('Keep it.', out(`You keep it.`)),
  ]);

// ---------- H. Ending 4: "A Thousand Years" (ps_mc_own, ps_yl_own). Evil Mode on hold: the four decisions are flags. ----------
const OWN_END = (lead: string, ...fx: Json[]): Json => out(`${lead} Macro Cosmos is yours, with Team Yell as its loudest department. Eight subsidiaries, each a ready-made department. Forty thousand insurance policies that must be honoured or refunded. And the flaw: everything's a line on a budget, and you can't see who's on the wire unless you go and look. ${EPILOGUE.own}`,
  story({ beat: true }), story({ end: 'allied' }), flag('galar-ending-own'), flag('evil-start-galar'), ...fx);
const own: Json[] = [
  step('mc-own-roof', 'Phase 1: The Roof', `"It's a good company run by a man in a hurry." ${say('Rose', `I beg your pardon.`)} "Give it to someone with a thousand years." ${say('Rose', `...You'd wait?`)} "I'd light Spikemuth first." ${say('Rose', `Spikemuth. You keep— everybody keeps—`)} He looks east. He's a man who can read a grid by its glow. There's a gap. ${say('Rose', `Ah.`)} ${say('Rose', `I love an upset. I've always said. The Chair's yours if you can win it.`)}`, [
    ch('Win it.', on(`He sends out Escavalier.`, 'gl-own-rose')),
  ], { tint: RED }),
  step('yl-own-blockj', 'Phase 1: Block J', `"You've never had a leader." Forty people point at Piers. He's not there. They point at the screen he's on. ${say('Piers, on the screen', `Don't.`)} "D'you want one? I'll not block a road. I'll not boo. I'll get you a town with the lights on." ${say('Gaz', `...Can we still have the horns?`)}`, [
    ch('"Yes."', on(`Forty horns. You go up the tower with them behind you. Rose is on the roof. ${say('Rose', `I love an upset. The Chair's yours if you can win it.`)}`, 'gl-own-rose')),
  ], { cast: [BECK, PIERS], tint: RED }),
  step('gl-own-rose', 'Phase 2: Rose', `Escavalier, Perrserker (Boardroom), Klinklang, Copperajah (Foundry), and Duraludon (Skyline; it Gigantamaxes). At half Skyline's health: Any Questions? He gives a press conference to the cameras while his Pokémon choose for themselves. ${say('Rose', `Yes, you at the back. Was it necessary? An excellent question. Next.`)}`, [
    ch(`"Chairman. Who's on the east coast spur?"`, fight(`${say('Rose', `I— next question.`)}`, ps(trainer('Rose', { sprite: ROSE, team: ['escavalier', 'perrserker', 'klinklang', 'copperajah', 'duraludon'], size: 5, lv: 2, win: [room('gl-own-mug')] }))), { requires: [flagIs('galar-brass-seen')] }),
    ch(`"Chairman. Whose lamp's on your desk?"`, fight(`He takes his glasses off. Skyline's next move is skipped.`, ps(trainer('Rose', { sprite: ROSE, team: ['escavalier', 'perrserker', 'klinklang', 'copperajah', 'duraludon'], size: 5, lv: 1, win: [room('gl-own-mug')] }))), { requires: [flagIs('rose-lamp-41')] }),
    ch('Battle him.', fight(`He's gracious. He's always been gracious.`, ps(trainer('Rose', { sprite: ROSE, team: ['escavalier', 'perrserker', 'klinklang', 'copperajah', 'duraludon'], size: 5, lv: 2, win: [room('gl-own-mug')] })))),
  ], { tint: RED }),
  step('gl-own-mug', 'Phase 3: The First Hour', `${say('Rose', `I'd endorse you. I mean that. There's a pen in the drawer. And a box of matches. I never used the matches.`)} A tower. Forty thousand staff. A grid. A thing in a cage. A coach in the car park. Four decisions. The first: the mug.`, [
    ch('Keep it.', on(`"There's never time." It stays on the desk.`, 'gl-own-map', flag('galar-mug-kept'))),
    ch('Smash them.', on(`Four hundred mugs. It takes a while.`, 'gl-own-map', flag('galar-mug-smashed'))),
    ch(`Reprint it: "There's time. Who's it for?"`, on(`No Operation will have a deadline. Every one will have a named person it's for.`, 'gl-own-map', flag('galar-mug-reprinted'))),
  ], { cast: [ROSE] }),
  step('gl-own-map', 'Phase 3: The First Hour', `The second: the map.`, [
    ch('As it is.', on(`The Power Spots, as they were.`, 'gl-own-cage', flag('galar-map-same'))),
    ch('Redraw it from the wires, not the Power Spots.', on(`Forty places light up that were never on it.`, 'gl-own-cage', flag('galar-map-wires'))),
    ch('Burn it.', on(`It burns quickly. It was mostly logos.`, 'gl-own-cage', flag('galar-map-burned'))),
  ], { cast: [ZANE] }),
  step('gl-own-cage', 'Phase 3: The First Hour', `The third: the cage.`, [
    ch('Seal it.', on(`It's sealed.`, 'gl-own-yell', flag('galar-cage-sealed'))),
    ch('Run it, slowly, at a hundredth.', on(`A hundredth. The dials barely move.`, 'gl-own-yell', flag('galar-cage-slow'))),
    ch('Give the problem away: Sonia, Magnolia, and a man in a cell with a pencil.', on(`The Thousand-Year Desk. It produces nothing. It's for somebody else.`, 'gl-own-yell', flag('galar-cage-given'))),
  ], { cast: [], pokemon: 'eternatus', tint: '#2a1420' }),
  step('gl-own-yell', 'Phase 3: The First Hour', `The fourth: Team Yell.`, [
    ch('A department.', on(`They get a floor, and lanyards.`, 'gl-own-oleana', flag('galar-yell-department'))),
    ch('Nothing to do with it.', on(`They go home on the coach.`, 'gl-own-oleana', flag('galar-yell-apart'))),
    ch(`The company's crowd: wherever Macro Cosmos lights a place, a coach turns up.`, on(`Forty people who'll learn every new place's names.`, 'gl-own-oleana', flag('galar-yell-crowd'))),
  ], { cast: [BECK] }),
  step('gl-own-oleana', 'Phase 3: The First Hour', `Oleana, with a tablet: ${say('Oleana', `You'll want a secretary. I come with the office. I should tell you I'd have stood between you and him, an hour ago.`)}`, [
    ch('"I know."', OWN_END(`${say('Oleana', `Good.`)}`, flag('galar-oleana-stays'))),
    ch('"Would you stand between me and anyone?"', OWN_END(`${say('Oleana', `Ask me in a year.`)}`, flag('galar-oleana-stays'))),
    ch(`"Go home. Six weeks' leave. Then tell me."`, OWN_END(`She looks at you as if you'd spoken another language. ${say('Oleana', `...I've not had leave since I was nineteen.`)} She takes it. She goes back to a recycling plant, on purpose, with a Garbodor. She comes back in six weeks. She's got a tan and a list.`, flag('galar-oleana-leave'))),
  ], { cast: [OLEANA] }),
];

// ---------- I. Team Encore: refused the lanyard and the horn, and cheered for everybody ----------
const outside = (o: Json = {}): Json[] => [{ kind: 'evil', team: 'yell', inside: false, ends: ['none'], ...o }, G];
const ENC = { cast: [BECK, ZANE], tint: '#2a2418', effect: 'none' };
const encore: Json[] = [
  ev('enc-route9', 'Route 9', 'Evil Teams', { requires: [...outside({ after: 2 }), flagIs('galar-yell-refused'), flagIs('galar-cheered', 0, 0)], cast: [YG, MARNIE], pokemon: 'wooloo', tint: '#2a2a34' }, ROUTE9_INTRO,
    [
      ch(`"What's the Wooloo's name?"`, out(BOBBIN, ...kind(1), flag('galar-cheered'), flag('yell-road-cheered'))),
      ch('Walk round them.', out(`You go the long way, by the river. Behind you, the booing starts again.`)),
    ]),
  ev('enc-founding', 'Team Encore', 'Evil Teams', { callback: true, requires: [...outside({ after: 4 }), flagIs('galar-yell-refused'), flagIs('galar-mc-refused'), flagIs('galar-cheered')], ...ENC },
    `A chip shop on the Hammerlocke road. One table. Vinegar. A man in a lanyard, a man with a towel, and a third chair. ${say('Beck Gallowglass', `You're the one who asked the Wooloo's name. It went round the coach in a minute flat.`)} ${say('Zane Ingleby', `I heard it in the tower. Somebody on twelve had it on a clip. Forty people chanting 'Bobbin.' I watched it nine times.`)} ${say('Beck', `He's got the power and no idea where it goes.`)} ${say('Zane', `They've got a town and no power. And there's— I've been through the feeders. There's forty places like theirs. Off the map. A Gym in a quarry. A village the League skipped. An island with one trainer.`)} ${say('Beck', `Somebody should just—`)} ${say('Zane', `—carry it over.`)} The chip shop's owner, Mrs. Jocelyn Sowerby, wiping the counter: "You'll want a generator, then. I've one in the yard. It were my husband's; he were a lamp man." The creed, on the specials board, in chalk, under MUSHY PEAS: NOBODY PLAYS TO AN EMPTY HOUSE.`,
    [
      ch('Take the third chair.', out(`Team Encore: Beck, who knows what it's like when sixty people know your name, and when eleven do. Zane: the feeders, and a graph that says there's time. Shay: "There's four billion in a line called 'contingency.' Nobody'll miss a van."`, mark('third'), flag('encore-founded'))),
      ch('"Who else?"', out(`Kaya: banners, one per place; she asks what they want on it. Shaz: the ring binder; she learns the names before they arrive. Big Daz: a coach, forty-two seats. Mrs. Sowerby: a generator, and a chip van, in time. Peony: "An adven-tour! Where there's no lights! Chin up, I'm in!" The Ball Guy isn't asked. He turns up. Without the head. Nobody recognises him. He's thrilled. Marnie doesn't join. She's got a final. She lends her name: "Say I said it were all right."`, mark('third'), flag('encore-founded'))),
    ]),
  // Away Day 1: The Quarry (ps_enc_quarry)
  ev('enc-away-1', 'Away Day 1: The Quarry', 'Evil Teams', { requires: [...outside({ after: 5, has: 'third' })], ...ENC },
    `An Away Day's a visit. A coach, a generator, a banner, and forty people who've learned the names. A Gym in a worked-out quarry, north of Circhester. No Power Spot. Four trainers. A Leader of sixty who's not had a challenger in two years.`,
    [ch('Get on the coach.', on(`The coach doesn't fit down the track.`, 'enc-q-road'))]),
  ev('enc-q-road', 'The Road', 'Evil Teams', { room: true, ...ENC },
    `The coach doesn't fit. Everybody gets out and carries the generator.`,
    [ch('Carry.', on(`Forty people, one generator, a track.`, 'enc-q-pitch'), { prompt: prompt(STEALTH), fail: on(`It slips twice. Big Daz catches it both times.`, 'enc-q-pitch') })]),
  ev('enc-q-pitch', 'The Pitch', 'Evil Teams', { room: true, cast: [ZANE], tint: '#2a2418' },
    `Zane wires it. Floodlights that last worked when Beck was a lad. They come on one at a time, with a clunk.`,
    [ch('Step onto the pitch.', on(`You're the challenger.`, 'enc-q-match'))]),
  ev('enc-q-match', 'The Match', 'Evil Teams', { room: true, cast: [OLDMAN], pokemon: 'coalossal', tint: '#2a2418' },
    `The old Leader, Mr. Gwilym Hartshorn. Forty people chant for both sides. By name.`,
    [ch('Battle him.', fight(`He's not heard his Coalossal's name shouted since his wife.`, ps(trainer('Mr. Gwilym Hartshorn', { sprite: OLDMAN, team: ['coalossal', 'stonjourner', 'rhyperior'], size: 3, lv: 1, win: [] })),
      flag('encore-away1')))]),
  // Away Day 2: The Island (ps_enc_island)
  ev('enc-away-2', 'Away Day 2: The Island', 'Evil Teams', { requires: [...outside({ after: 5, has: 'third' }), flagIs('encore-away1')], cast: [PEONY], tint: '#1e3a40' },
    `An island off the west coast with one house. A girl of twelve who trains alone, because the ferry's Macro Cosmos Rail's, and it was "rationalised."`,
    [ch('Find a boat.', on(`No ferry. Peony's got a boat. It's not his. "Borrowed! With enthusiasm!"`, 'enc-i-beach'))]),
  ev('enc-i-beach', 'The Beach', 'Evil Teams', { room: true, cast: ['trainer.pr/youngster_f'], pokemon: 'clobbopus', tint: '#1e3a40' },
    `She's practising. Against the tide. A Clobbopus and a Dreepy and nobody.`,
    [ch('Challenge her.', on(`She's never had a crowd. She freezes.`, 'enc-i-match'))]),
  ev('enc-i-match', 'The Match', 'Evil Teams', { room: true, cast: ['trainer.pr/youngster_f', SHAZ], pokemon: 'dreepy', tint: '#1e3a40' },
    `Forty people, waiting.`,
    [
      ch('Wait.', fight(`Forty people, waiting, quietly, for a girl of twelve to send out a Dreepy. She does. Shaz, low: ${say('Shaz', `One, two, three—`)} Forty people: "Mizzle. Mizzle. Mizzle." The girl: "How d'you know she's called Mizzle?" ${say('Shaz', `It's on your bucket, love.`)} Shay, that week, finds the ferry in the budget. It costs less than the Chairman's flowers. It runs again from the next stage.`,
        ps(trainer('The girl on the island', { sprite: 'trainer.pr/youngster_f', team: ['clobbopus', 'dreepy'], size: 2, lv: 0, win: [] })), ...kind(1), flag('encore-away2'))),
    ]),
  // Away Day 3: Number Two (night)
  ev('enc-away-3', 'Away Day 3: Number Two', 'Evil Teams', { requires: [...outside({ after: 5, has: 'third' }), flagIs('encore-away1'), night], cast: [ZANE, PEONY], tint: '#1a1a14' },
    `${say('Zane', `There's one more feeder I can't place. It's not on the grid at all. It's got no load. It's just— a wire, that goes into the hills behind Motostoke and stops.`)} Peony, very quiet for him: ${say('Peony', `I know where that goes.`)} A pit village. Forty years dark. A street. A chapel with no roof. A bandstand. Old men on a bench. Seven of them. They were in the forty-one. ${say('Peony', `Evenin', lads.`)} An old miner, Mr. Thackray, who stopped to help a pony: "Peony. You've brought a coach." ${say('Peony', `I've brought a crowd.`)}`,
    [ch('Wire the street.', out(`Zane wires one street. It's the one Rose paid for himself, forty years ago, till he couldn't. The lamps come on. Seven old men, under street lights, in a village with no name. Shaz, with the binder, quietly: ${say('Shaz', `I've not got these. I've nowt on these. What are they called?`)} Mr. Thackray: "We're not Pokémon, love." ${say('Shaz', `No. But what're you called?`)} They tell her. Seven names. And then the others: the thirty-four who aren't on the bench. Forty-one. Forty people, low, in time. One name at a time. It takes a while. Shaz gives you the list: forty-one names, in her writing.`, ...kind(2), flag('encore-away3'), flag('fortyone-names')))]),
  // I4. The climax: Twelve Thousand
  ev('enc-twelve-thousand', 'Twelve Thousand', 'Evil Teams', { callback: true, requires: [...outside({ beat: 6, has: 'third' })], cast: [PIERS, MARNIE], tint: SPIKE, effect: 'glint' },
    `The night of the final. Wyndon's full. And half of Galar isn't watching it. Kaya's cousin. The truck. Aux. Encore's put Spikemuth on the regional feed, with a generator, legally: Shay found the clause. "Televised fixtures shall take place at venues with Dynamax capability." It doesn't say what a fixture is. Encore's registered a concert.`,
    [ch('Go to Spikemuth.', on(`The shutters are up. All of them. For the first time in eight years.`, 'enc-12k-street'))]),
  ev('enc-12k-street', 'Twelve Thousand', 'Evil Teams', { room: true, cast: [PIERS, MARNIE, PEONY], tint: SPIKE },
    `The street's full. Not forty. The quarry's come. The island's come: one girl, on Peony's shoulders. Number Two's come: seven old men, in a coach, in their good caps. And then the others. Forty places off the map, each with a banner Kaya asked them about. Piers, at a microphone, looking at it: ${say('Piers', `...There's twelve thousand people in my street.`)} Marnie, who isn't in Wyndon; she was knocked out in the semi, fairly, and came home: ${say('Marnie', `Go on, then. They've not come to watch you tune.`)}`,
    [ch('Look at the sky.', on(`It comes. Over Wyndon. On the feed from the stadium, things are getting big.`, 'enc-12k-sky'))]),
  ev('enc-12k-sky', 'The Red Sky', 'Evil Teams', { room: true, cast: [PIERS, SHAZ], tint: RED, effect: 'glint' },
    `${say('Rose, on one screen', `—a little light. A little noise. Please remain—`)} ${say('Piers, on the other', `Right. Galar. You know the one. After me.`)} Spikemuth leads; Wyndon learns it off the screen. Twelve thousand people who know what it's like to be forgotten, saying sixty thousand strangers' Pokémon's names until they come down.`,
    [ch('Chant.', on(`One name at a time. They come down.`, 'enc-12k-chairman'), { prompt: prompt('echo-rhythm'), fail: on(`You lose the beat twice. Twelve thousand people don't. They come down.`, 'enc-12k-chairman') })]),
  ev('enc-12k-chairman', 'The Chairman', 'Evil Teams', { room: true, cast: [ROSE, OLEANA], tint: TOWER },
    `Floor 50. He's watching both screens. The stadium, where it's working. And a street he doesn't know, where twelve thousand people are standing under lights he can't account for. ${say('Rose', `Oleana. What's that. That's not one of ours. Who's lit that?`)} ${say('Oleana', `A generator, Chairman. From a chip shop. And the east coast spur. An analyst from thirty-one's been feeding it a hundredth of the Plant for a week. I signed it off as 'losses.'`)} ${say('Rose', `You— you signed—`)} ${say('Oleana', `It's the town with no lights, Chairman. I grew up in one. I thought somebody should shake its hand.`)} On the screen: seven old men in caps. He knows the caps. ${say('Rose', `...That's Thackray.`)} He's got the lamp in his hands before he knows he's picked it up. ${say('Rose', `That's Thackray. He's— they're all—`)} He switches off the Plant himself. From the desk. There's a button. He's never looked at it.`,
    [
      ch('Stay in the street.', out(`Team Encore doesn't disband. It becomes a thing Galar has: a coach in a lay-by, where a match can be played with a crowd. Number Two has one lit street. Rose pays for it, from a cell, by postal order. He's very organised. ${EPILOGUE.encore}`,
        ...kind(2), story({ beat: true }), story({ end: 'exposed' }), flag('galar-ending-encore'))),
      ch('Find who came to wake something.', on(`Sordward and Shielbert, who've come to Spikemuth to wake something and found twelve thousand people between them and it.`, 'enc-12k-brothers')),
    ]),
  ev('enc-12k-brothers', 'Twelve Thousand', 'Evil Teams', { room: true, cast: [SORDSHIEL], tint: SPIKE },
    `Two brothers in very good coats, at the back of twelve thousand people.`,
    [ch('Battle them.', fight(`They're chanted off. By name. They're very moved. Team Encore doesn't disband. It becomes a thing Galar has: a coach in a lay-by, where a match can be played with a crowd. Number Two has one lit street. Rose pays for it, from a cell, by postal order. He's very organised. ${EPILOGUE.encore}`,
      ps(trainer('Sordward and Shielbert', { sprite: SORDSHIEL, format: 'doubles', team: ['sirfetchd', 'bisharp', 'golisopod', 'rhyperior'], size: 4, lv: 1, win: [] })),
      ...kind(2), story({ beat: true }), story({ end: 'exposed' }), flag('galar-ending-encore')))]),
  // I5. After Encore: a coach in a lay-by
  ev('enc-lay-by', 'A Coach in a Lay-By', 'Evil Teams', { requires: [G, flagIs('galar-ending-encore')], cast: [YG], tint: '#2a2a34' },
    `A coach in a lay-by. Forty people, with a ring binder. They'd like to know your Pokémon's names.`,
    [ch('Tell them.', out(`They learn every one. For a while, your party fights as if somebody knows their names: they do.`, bondUp(1, 'party')))]),
];

export const EVENTS: Json[] = [finalOf('mc'), finalOf('yl'), ...mcPlan, ...ylPlan, ...mcTurn, ...ylTurn, ...mcLift, ...ylBought, PLATE, ...own, ...encore];
export const REMOVE: string[] = [];
void mark;
