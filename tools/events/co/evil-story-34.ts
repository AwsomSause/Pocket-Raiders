// Catalog Overhaul Pack, Evil Teams Volume III: Alola, the end (TEAM_SKULL_AETHER_ALOLA_FULL_2). The Final Choice on the
// upper deck of Aether Paradise (written once per side: sk-final-choice, ae-final-choice), the five endings as chain
// pseudo-stages (ps_al_plan, ps_al_turn, ps_al_case, ps_al_placed, ps_al_both: written by _evil-story-sync.ts), Team
// Tidepool (the third option: the outside corridor, founding, three Returns and Still Here), and who ends up where (part H).
// "Both Halves" ends the team story here: Evil Mode is on hold (Kice); its four decisions are flags only.
import { bondUp, ch, ev, fight, flag, flagIs, fr, inRegion, out, room, trainer, type Json } from '../dsl.ts';
import { evil as story, kind, prompt, rivalTrust, STEALTH } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-story';

type Side = 'skull' | 'aether';
const S = teamJson('skull');
const A = teamJson('aether');
const GUZMA = S.ranks.leader.sprite;
const PLUM = S.ranks.executive.sprite;
const AG = A.ranks.grunt.sprite;
const FABA = A.ranks.executive.sprite;
const LUSA = A.ranks.leader.sprite;
const KOA = 'trainer.pr/skull_grunt_m';
const ZIA = 'trainer.pr/aether_grunt_f';
const URI = 'trainer.pr/aether_grunt_m';
const WICKE = 'boss.wicke';
const PUA = 'trainer.pr/scientist_f';
const LILLIE = 'boss.lillie-z';
const GLADION = 'boss.gladion-stance';
const NANU = 'boss.nanu';
const HAU = 'boss.hau-stance';
const ACEROLA = 'boss.acerola';
const MOHN = 'boss.drive/alolan-usum-gentleman';
const CAPTAIN = 'boss.kiawe';
const DECK = '#1a1a2e';
const TIDE = '#1e3a40';
const AL = inRegion('alola');
const say = (who: string, line: string): string => `${who}: "${line}"`;
const mark = (m: string): Json => story({ mark: m });
const isSide = (t: Side): Json => ({ kind: 'evil', team: t });
const night: Json = { kind: 'period', in: ['night'] };
/** A fight inside an ending's own map: a loss walks the player back out, and the run goes on. */
const ps = (b: Json): Json => ({ ...b, pseudo: true });
const step = (id: string, name: string, intro: string, choices: Json[], o: { cast?: string[]; pokemon?: string; tint?: string; effect?: string } = {}): Json =>
  ev(id, name, 'Evil Teams', { room: true, cast: o.cast ?? [LUSA], tint: o.tint ?? DECK, effect: o.effect ?? 'none', ...(o.pokemon ? { pokemon: o.pokemon } : {}) }, intro, choices);
const on = (text: string, next: string, ...fx: Json[]): Json => out(text, ...fx, room(next));
const LUSAMINE = ['clefable', 'lilligant', 'milotic', 'mismagius', 'bewear'];

// Part H. Who ends up where: said as each ending closes.
const EPILOGUE: Record<'plan' | 'turn' | 'case' | 'placed' | 'both' | 'tidepool', string> = {
  plan: `Lusamine is on the far side. Happy. Not herself. Guzma went; or turned round for forty voices. Plumeria feeds forty, still. Wicke signs intake, and nothing else. Faba is the last line. Koa holds a door he doesn't understand. Zia went through after her, on a rope; Uri held the rope, and didn't let go. Lux was kept well out of it, by everyone. Lillie is at the rail. Gladion went in after his mother. Tall Tale is in glass. The man at the Pelago hums, and doesn't know why he's sad today. Nanu feeds the cats. Po Town is forty and a bat. The sign says GET WELL.`,
  turn: `Lusamine asks what Lillie'll do to her hair. Guzma: "Ya boy is NOT a keepsake." Plumeria runs Po Town. Wicke is President, and releases a Mareanie first. Faba is on reception, handing out the leaflet. Koa takes his trial a fourth time, and forty watch. Zia runs releases. Uri is told to let them go, and does. Lux is in school; all forty come to parents' evening. Lillie cuts her hair. Gladion is Deputy, unwillingly. Tall Tale is woken, and looks north. The man at the Pelago gets a visitor who's good at beans. Nanu signs the lease. Po Town has a roof. The sign has both sentences.`,
  case: `Lusamine went through alone; or was told, and stopped. Guzma carried sixty cases, and smashed nothing. Plumeria runs a real town. Wicke sends malasadas to Po Town. Faba gave up the key, and is still astonished. Koa carried cases all night. Zia runs Po Town's Center. Uri stood aside. Lux held the lift door. Lillie is the same. Gladion carried the Nulls' cases himself. Tall Tale was woken on the dock; it took six to carry it. The man at the Pelago is the same. Nanu signs the lease. Po Town is a real town. The sign has both sentences.`,
  placed: `Lusamine signs forty forms, and thinks it's kindness. Guzma went through: there was nowhere to turn round for. Plumeria: "Who's gonna ask if they ate." Wicke: "Oh, no." Faba is promoted. Koa is at a boarding school, with excellent facilities. Zia read over a shoulder. Uri holds an umbrella. Lux is on Poni. Safe. Not asked. She writes. Lillie is the same. Gladion leaves. Tall Tale is in glass. The man at the Pelago isn't told. Nanu has nobody to charge. Po Town is empty. The sign says GET WELL.`,
  both: `Lusamine was fought to a stop: "You'll stand on the dock and wave." Guzma counts separate. Plumeria has the Mess, and the Book. Wicke has the forms. Faba has been asked what he's for, and is still thinking. Koa is the first Lead. Zia has the Infirmary. Uri steps aside for the right people. Lux has the common room. Lillie is the same. Gladion's been asked to run security, and covers his face. The man at the Pelago gets a supply boat, monthly. It's white. Nanu's been asked to be Law. "Mm. No." He does it anyway. Po Town is a base.`,
  tidepool: `Lusamine carries a basket. Guzma stops in Po Town: somebody's asked his name. It's Hala. Plumeria's book balances. Wicke finds a pen. Faba stops halfway. Koa: "Tuesday?" Zia has two columns in chalk. Uri was told something he'd have done anyway. Lux picked her own place: the Aether House. Acerola needed a second cook. Lillie: "You never met us." Gladion: "Come and see." Tall Tale: "Don't I know you." The man at the Pelago has a straw hat, and a lot of stairs. Nanu stops charging. The sign's on the Po Town wall, in paint. Both sentences. Twice.`,
};

// ---------- A. The Final Choice (one per side; the inside route's Act 5 leads here) ----------
const finalOf = (t: Side): Json => {
  const p = t === 'skull' ? 'sk' : 'ae';
  const toLusamine = t === 'aether'
    ? say('Lusamine, to you', `Deputy. You'll come. You've never once tried to leave.`)
    : say('Lusamine, to you', `And you're the one he's fond of. Bring him. He dawdles.`);
  const e = ev(`${p}-final-choice`, 'The Final Choice', 'Evil Teams', { room: true, cast: [LUSA, GUZMA, LILLIE], tint: DECK, effect: 'glint' },
    `The upper deck of Aether Paradise. The sky coming apart like wet paper. Pale bells drifting in it. Walking toward it: Lusamine, in white, not hurrying. Behind her, for once not in front of anyone: Guzma. A bat. No bandana: she's asked him to take it off. At the rail: Lillie, with a bag that's moving. At the lift: Wicke, with a pile of forms. Faba, with a key. On the dock, below: a van. Forty kids. Plumeria, with a book. Beside you: your squad. ${say('Lusamine', `It's open. Do you see them? They don't change. They don't leave. They only want.`)} ${say('Lusamine, to Guzma, without turning', `Come along, dear. Hold the door. A kahuna keeps his island's gate.`)} ${say('Guzma', `...Yeah.`)} He doesn't move yet. ${toLusamine}`,
    [
      t === 'aether'
        ? ch('Go with her.', on(`You go to her side. She takes your arm, as she'd take a coat.`, 'al-plan-hau', flag('alola-final-plan')))
        : ch('Hold the door.', on(`You go to the gate, and put your hand on it. Guzma looks at you. He doesn't say anything.`, 'al-plan-hau', flag('alola-final-plan'))),
      ch('Stand between her and the gate.', on(`You walk past her. You turn round. You're between Lusamine and the sky.`, 'al-turn-between', flag('alola-final-turn'))),
      t === 'aether'
        ? ch(`Go to Skull's side.`, on(`You cross the deck. Not to the gate. To Faba.`, 'al-case-key', flag('alola-final-case')))
        : ch(`Go to Aether's side.`, on(`You cross the deck. Not to the gate. To Wicke.`, 'sk-placed-warn')),
      ch('"Give me both."', on(`Everyone on the deck looks round. Including the ones who weren't listening.`, 'al-both-deck', flag('alola-final-both')), { requires: [{ kind: 'evil', rank: 5, has: 'confided' }] }),
    ]);
  (e as Json).remembers = [
    t === 'skull'
      ? { id: 'case', when: [flagIs('guzma-knows-case')], notice: `Guzma's already seen what's at the end of the walk. He keeps looking at the glass.` }
      : { id: 'gohome', when: [flagIs('aether-gohome-said')], notice: `You've the sign's second sentence in your pocket. "GO HOME."` },
    { id: 'pile', when: [flagIs('wicke-pile')], notice: `Wicke's pile: two hundred and six forms, unsigned.` },
    { id: 'null', when: [flagIs('null-named')], notice: `Gladion's at the rail with something that's got a name.` },
  ];
  return e;
};

// ---------- B. Ending 1: "Where Nothing Leaves" (ps_al_plan) ----------
const PLAN_END = (lead: string, ...fx: Json[]): Json => out(`${lead} The gate doesn't close cleanly. Alola has Beasts in it now: once a stage, a wild battle may be an Ultra Beast, frightened, that flees at half health. Lusamine has what stays. Aether runs itself. The cold room's still cold. Your Pokémon that were put back, on the far side, are slow to come out of their Balls for the rest of Alola; it fades. ${EPILOGUE.plan}`,
  fr(-10), story({ beat: true }), story({ end: 'allied' }), flag('alola-ending-plan'), flag('lusamine-far-side'), flag('alola-beasts-loose'), ...fx);
const plan: Json[] = [
  step('al-plan-hau', 'Phase 1: The Stairs', `Your party holds the deck. Three come up. The first is Hau. ${say('Hau', `You were nice. At the School. I told everyone you were nice.`)}`, [
    ch('Battle him.', fight(`He doesn't smile. He always smiles.`, ps(trainer('Hau', { sprite: HAU, team: ['raichu-alola', 'tauros', 'noivern'], size: 3, lv: 0, win: [room('al-plan-rival')] }))))], { cast: [HAU] }),
  step('al-plan-rival', 'Phase 1: The Stairs', `Your rival comes up the stairs and stops at the top, and looks at who you're standing with.`, [
    ch('"Go home."', fight(`"Not without you."`, ps(trainer('Your rival', { rival: true, size: 6, lv: 1, win: [room('al-plan-nanu')] })), rivalTrust(-2))),
    ch(`"There's a reason."`, fight(`"Then show me."`, ps(trainer('Your rival', { rival: true, size: 6, lv: 1, win: [room('al-plan-nanu')] })), rivalTrust(-1))),
  ], { cast: [] }),
  step('al-plan-nanu', 'Phase 1: The Stairs', `${say('Nanu', `Thirty years a cop. I've held a lot of doors for the wrong people. Lemme tell you how it feels after.`)} He doesn't. He sends out a Persian.`, [
    ch('Battle him.', fight(`His cats come out one at a time, unhurried.`, ps(trainer('Nanu', { sprite: NANU, team: ['persian-alola', 'sableye', 'krookodile', 'honchkrow'], size: 4, lv: 2, win: [room('al-plan-pylons')] }))))], { cast: [NANU] }),
  step('al-plan-pylons', 'Phase 2: The Pylons', `Nanu, beaten, sitting down on the deck among his cats: ${say('Nanu', `Mm. Go on, then. I'll be here. Somebody's gotta feed these when it goes wrong.`)} Three pylons to prime. The defenders try to short them.`, [
    ch('Prime the pylons.', fight(`The defenders come at the pylons.`, ps(trainer('The defenders', { size: 3, lv: 1, win: [room('al-plan-through-ae')] }))), { requires: [isSide('aether')] }),
    ch('Prime the pylons.', fight(`The defenders come at the pylons. Guzma primes the third himself. His hands are shaking. He does it wrong twice. ${say('Guzma', `Kahuna keeps the gate. Kahuna keeps the gate. That's a thing, right? That's a real thing they do?`)}`, ps(trainer('The defenders', { size: 3, lv: 1, win: [room('al-plan-through-sk')] }))), { requires: [isSide('skull')] }),
  ], { cast: [NANU] }),
  step('al-plan-through-ae', 'Phase 3: Through', `You go through with her. A sea with no water in it. Black rock. Glass threads. A hundred pale bells. ${say('Lusamine', `There. Do you feel it? Nothing's going anywhere.`)} One of the bells comes down. It settles on her like a hat, and then like a veil, and then there isn't a line between them. The Mother Beast, her voice and a chord under it: "Look how still they are. Look how they stay. Deputy. You'll stay." She's happy. She isn't herself. She can't be pulled out. She can be reminded.`, [
    ch('Stay.', on(`A turn. Another. Your party's Pokémon are being put back: one by one, into their Balls, by threads. "Everything in its place."`, 'al-plan-stay', flag('alola-kept'))),
    ch('"The sign had a second sentence."', PLAN_END(`The Mother Beast: "...Go home." The chord wavers. "That was his. I took it down. It told everything to go." You pull. It's a bar: your hand in hers. She doesn't come; but you do.`), { requires: [flagIs('aether-gohome-said')] }),
    ch(`"He's lost. He grows beans."`, PLAN_END(`The largest bell goes dark. You pull. It's a bar: your hand in hers. She doesn't come; but you do.`), { requires: [flagIs('alola-mohn-found')] }),
    ch('Pull.', PLAN_END(`You've nothing to say. You pull anyway. It's a bar: your hand in hers. Zia comes through after you, with a rope from the dock round her waist, and Uri on the other end of it, doing what he's told: "Hold this, and don't let go." He doesn't.`, flag('zia-rope'))),
  ], { cast: [LUSA, ZIA], tint: '#10101c', effect: 'fog' }),
  step('al-plan-stay', 'Phase 3: Through', `The third turn. The threads are at your belt. The game asks again.`, [
    ch('Stay.', PLAN_END(`You stay a moment longer. Then a rope comes taut round your waist: Zia, with a rope from the dock, and Uri on the other end of it, doing what he's told. "Hold this, and don't let go." He doesn't. You come back. She doesn't.`, flag('zia-rope'))),
    ch('Pull.', PLAN_END(`You pull. It's a bar: your hand in hers. She doesn't come; but you do. The threads let go of the last Ball.`)),
  ], { cast: [LUSA], tint: '#10101c', effect: 'fog' }),
  step('al-plan-through-sk', 'Phase 3: Through', `Guzma's at the door. She's gone through. He's meant to follow. There's a case in there, in the glass and the dark. He can see it. It's his height. ${say('Guzma', `Yo. Number One. She picked me. First time. You get that? First time anybody—`)}`, [
    ch('"Go, then."', PLAN_END(`He goes. You hold the door. The bat's on the deck where he put it down. Forty kids and a bat on a deck: they look to Number One.`, flag('guzma-went'))),
    ch(`"She pays your rent."`, PLAN_END(`He stops. "...She what." He looks at the van on the dock, and the forty, and the book in Plumeria's hand. He turns round. Forty kids, a bat, and Guzma on a deck: they look to Number One.`, flag('guzma-turned')), { requires: [flagIs('skull-knows-boat')] }),
    ch('"You passed every one."', PLAN_END(`The forty can hear, on the dock. He stops, one foot through. "...Every one?" He turns round. Forty kids, a bat, and Guzma on a deck: they look to Number One.`, flag('guzma-turned')), { requires: [flagIs('guzma-passed')] }),
    ch('"Lux calls you big bro."', PLAN_END(`He stops. One foot through. "...I told her to quit that." From the dock, forty voices, not together: "YO, BIG G!" He turns round. Forty kids, a bat, and Guzma on a deck: they look to Number One.`, flag('guzma-turned'))),
  ], { cast: [GUZMA], tint: '#10101c', effect: 'fog' }),
];
(plan[3] as Json).remembers = [{ id: 'skull', when: [isSide('skull')], notice: `Guzma's at the third pylon already, with his sleeves pushed up.` }];

// ---------- C. Ending 2: "Come Home, All of You" (ps_al_turn) ----------
const TURN_END = (lead: string): Json => out(`${lead} Aether's run by Wicke, who releases things. The first is a Mareanie. The sign's put back up: the old one, off the barge, hand-lettered, both sentences. Skull's a house with forty kids and a roof that's been fixed. Nanu signs the lease, sighing. A week on, at the foot of a trial site, Koa, with thirty-nine people behind him and one in white gloves: ${say('Koa', `A'ight. Fourth time. Somebody watchin'?`)} All of them: "YEAH." ${EPILOGUE.turn}`,
  story({ beat: true }), story({ end: 'defeated' }), flag('alola-ending-turn'), flag('gate-shut'), flag('sign-restored'), flag('koa-fourth'));
const LINE_BETWEEN = `${say('Lusamine', `I don't have people who stand in my way. I have people who are perfect. I'll wait for you to come back.`)} She doesn't wait. She sends out Madame, her Clefable, without looking.`;
const turn: Json[] = [
  step('al-turn-between', 'Phase 1: Between', `You stand in front of the gate. She stops walking.`, [
    ch('Stay where you are.', on(`${say('Lusamine', `...Deputy.`)} ${LINE_BETWEEN}`, 'al-turn-fight'), {
      branches: [{ when: [isSide('skull')], text: `${say('Lusamine', `Oh, it's the one he's fond of.`)} ${LINE_BETWEEN}`, effects: [room('al-turn-fight')] }],
    }),
  ]),
  step('al-turn-fight', 'Phase 2: Lusamine', `Clefable (Madame), Lilligant, Milotic, Mismagius, and Bewear, the one she calls Embrace. At half Embrace's health: Everything in Its Place. She tidies: your active Pokémon is returned and replaced, each turn.`, [
    ch('Battle her.', fight(`She fights as if the battle's a room she's putting straight.`, ps(trainer('Lusamine', { sprite: LUSA, team: LUSAMINE, size: 5, lv: 2, win: [room('al-turn-lillie')] }))), {
      branches: [{ when: [flagIs('guzma-knows-case')], text: `He steps in front of you. ${say('Guzma', `Ya boy is NOT a keepsake.`)} He takes one hit meant for you. She fights as if the battle's a room she's putting straight.`, effects: [] }],
    }),
  ]),
  step('al-turn-lillie', 'Phase 3: Lillie', `She's beaten. The gate's still open. She could still walk. Lillie, from the rail, with a bag: ${say('Lillie', `Mother.`)} ${say('Lusamine', `Lillie. You've done something to your hair.`)} ${say('Lillie', `I'm going to. Next week. I've decided. I'm not perfect. I'm not finished. I'm going to change and you're going to miss it if you go in there.`)} A long time. The bells drift. ${say('Lusamine', `...What will you do to it?`)} ${say('Lillie', `I don't know yet. That's the point.`)}`, [
    ch('Shut the gate.', TURN_END(`It's a lever. It's heavy. Whoever's beside you helps. It shuts, with her on this side.`)),
  ], { cast: [LUSA, LILLIE] }),
];
(turn[0] as Json).remembers = [
  { id: 'wing', when: [flagIs('alola-told-wing')], notice: `Wicke's torn up two hundred and six forms. The wing's doors are open. Each turn, something that got better walks past, down to the dock, and into the sea.` },
  { id: 'town', when: [flagIs('alola-told-town')], notice: `Forty kids on the stairs. They don't fight her. ${say('Plumeria', `We ain't here for you, lady. We're here for him. G. You ate?`)}` },
];
(turn[1] as Json).remembers = [
  { id: 'corsola', when: [flagIs('alola-carried-corsola')], notice: `The Corsola you carried out is set down on the deck. It jumps. She sees it move. Her next order's a turn late.` },
  { id: 'pikachu', when: [flagIs('alola-carried-pikachu')], notice: `The Pikachu you carried out is set down on the deck. It jumps. She sees it move. Her next order's a turn late.` },
  { id: 'null', when: [flagIs('null-named')], notice: say('Gladion', `You made three monsters to protect us from the thing you want to wear. I named mine.`) },
];

// ---------- D. Ending 3A: "Case by Case" (Aether to Skull, ps_al_case) ----------
const CASE_END = (lead: string, ...fx: Json[]): Json => out(`${lead} Po Town's a real town. It's got a Pokémon Center that's a real Center: Zia runs it. It's got sixty new residents that got better, and are deciding where to go. ${EPILOGUE.case}`,
  bondUp(1), story({ beat: true }), story({ end: 'exposed' }), flag('alola-ending-case'), flag('coldroom-carried'), ...fx);
const caseBy: Json[] = [
  step('al-case-key', 'Phase 1: The Key', `You cross the deck. To Faba. You hold out a hand. ${say('Faba', `I'm the last line of defence.`)}`, [
    ch('"Who are you defending her from?"', on(`${say('Faba', `...`)} He puts the cold room's key in your hand. He's astonished at himself. You throw it. Across the deck. Guzma catches it, one-handed, without looking. ${say('Guzma', `What's this.`)} "B2. All of them." He looks at the key. He looks at the gate. He looks at her back. ${say('Guzma', `...Yeah. A'ight. Yo! Po Town! We got a job!`)}`, 'al-case-pua'), {
      branches: [{ when: [flagIs('faba-asked')], text: `He's been thinking about it since you asked him, alone. ${say('Faba', `...I've never asked.`)} He puts the cold room's key in your hand. He's astonished at himself. You throw it. Across the deck. Guzma catches it, one-handed, without looking. ${say('Guzma', `What's this.`)} "B2. All of them." He looks at the key. He looks at the gate. He looks at her back. ${say('Guzma', `...Yeah. A'ight. Yo! Po Town! We got a job!`)}`, effects: [room('al-case-pua')] }],
    }),
  ], { cast: [FABA, GUZMA] }),
  step('al-case-pua', 'Phase 2: Curator Pua', `Lusamine doesn't turn round. The Foundation's staff do. Curator Pua and two Employees. She says "it's for the best" as she sends each one out, and by the third she's saying it as a question.`, [
    ch('Battle them.', fight(`"It's for the best." "It's for the best." "...It's for the best?"`, ps(trainer('Curator Pua and two Employees', { sprite: PUA, size: 3, lv: 1, win: [room('al-case-carry')] }))))], { cast: [PUA, AG] }),
  step('al-case-carry', 'Phase 3: The Cold Room', `It isn't a battle. It's a carry. Forty kids. Sixty cases. A lift that holds four. Guzma, with a case on his shoulder that's got a Pikachu in it, mid-leap: ${say('Guzma', `I ain't smashin' nothin'. Anybody smashes anything, they answer to me. These are people's.`)} ${say('Tupp', `Yo, we're haulin' glass, don't be an—`)} ${say('Rapp', `Don't.`)} ${say('Tupp', `—lass?`)} ${say('Zipp', `Lass!`)} Lux, who's been told to wait in the van, holding the lift door: ${say('Lux', `I'm helping.`)} Route the cases to the ferry before the stasis units' batteries run down.`, [
    ch('Route the cases.', on(`Each that reaches the dock is set down by the water, and opened. They wake.`, 'al-case-tale'), { prompt: prompt(STEALTH), fail: on(`The batteries are low on the last dozen; the lift sticks twice. Every case reaches the dock in the end, slower than you'd like. Each is set down by the water, and opened. They wake.`, 'al-case-tale') }),
  ], { cast: [GUZMA, KOA], tint: '#1a2230', effect: 'fog' }),
  step('al-case-tale', 'Phase 3: The Cold Room', `The last one's Tall Tale. It takes six of them. Guzma's at the front. ${say('Guzma', `This the first one? The one she— a'ight. Easy. Easy with him.`)} It thaws on the dock. Three heads blink. They look at the island. They look at the sea. They look north.`, [
    ch('Go up the stairs.', on(`She's still walking. Nobody's stopped her; they've been carrying.`, 'al-case-gate')),
  ], { cast: [GUZMA], pokemon: 'exeggutor-alola', tint: '#1a2a3a' }),
  step('al-case-gate', 'Phase 4: The Gate', `Guzma, out of breath, at the top of the stairs: ${say('Guzma', `Yo. Lady. You said I was your favourite.`)} ${say('Lusamine', `You are, dear.`)} ${say('Guzma', `I just carried sixty of your favourites up a stairwell. They were cold.`)} A pause. ${say('Guzma', `I got forty kids. I ain't got favourites. I got forty.`)} He doesn't follow her.`, [
    ch('(Let her go.)', CASE_END(`She goes through alone.`, flag('lusamine-alone'))),
    ch(`"He's twenty miles north. He grows beans."`, CASE_END(`She stops, with one foot over the line. She's told. She stops.`, flag('lusamine-told')), { requires: [flagIs('alola-mohn-found')] }),
  ], { cast: [GUZMA, LUSA] }),
];

// ---------- E. Ending 3B: "Placed" (Skull to Aether, ps_al_placed). Warned, and confirmed twice. ----------
const PLACED_END = (lead: string, ...fx: Json[]): Json => out(`${lead} Po Town's empty. The rain stops on a Wednesday. Nobody's there to open a window. Po Town is a rest now: forty villas, bowls washed, on the side. Your Pokémon are each a step less sure of you, for now; it recovers. Plumeria leaves the Borrow Book on the step: three hundred and twelve entries, three open. At the rests ahead, letters will arrive: from a kid, to another kid, care of you. They don't have each other's addresses. ${EPILOGUE.placed}`,
  bondUp(-1, 'party'), story({ beat: true }), story({ end: 'defeated' }), flag('alola-ending-placed'), flag('potown-empty'), flag('borrow-book'), ...fx);
const WARNING = `Forty children will be found homes and schools, apart, kindly, and without being asked. Nobody's harmed. Nobody's together. Po Town will be empty.`;
const placed: Json[] = [
  step('sk-placed-warn', 'Placed', WARNING, [
    ch('Go on.', on(`You read it again.`, 'sk-placed-warn-2')),
    ch('Go back.', on(`You go back to where you were standing.`, 'sk-final-choice')),
  ], { cast: [WICKE], tint: '#c8c0a0' }),
  step('sk-placed-warn-2', 'Placed', `${WARNING} Are you sure?`, [
    ch(`I'm sure.`, on(`You take a sheet of paper out of your jacket.`, 'al-placed-list', flag('alola-final-placed'))),
    ch('Go back.', on(`You go back to where you were standing.`, 'sk-final-choice')),
  ], { cast: [WICKE], tint: '#c8c0a0' }),
  step('al-placed-list', 'Phase 1: The List', `You go to Wicke, with a sheet of paper. Forty names. Ages. Which trial. Which island they're from. ${say('Wicke', `These are— Po Town? You've their names?`)} "He asks everyone." ${say('Wicke', `Oh, the poor things. In that rain. We've a programme. We've homes. I'll sign at once.`)} She means it. Every word. It's the kindest thing on the deck, and that's what's wrong with it.`, [
    ch('Hand her the list.', on(`She signs. Somebody on the stairs has worked out what the paper is.`, 'al-placed-plumeria')),
  ], { cast: [WICKE], tint: '#c8c0a0' }),
  step('al-placed-plumeria', 'Phase 2: Plumeria', `Plumeria, on the stairs, alone: ${say('Plumeria', `You gave her the names. His names. He asked every one of those kids who they were so somebody'd know. And you wrote it down for a lady with a clipboard.`)} She isn't fighting to win. She's fighting to hold the stairs till the van's gone. It doesn't go. They won't leave without her.`, [
    ch('Battle her.', fight(`Salazzle first. She doesn't look at you once.`, ps(trainer('Plumeria', { sprite: PLUM, team: ['salazzle', 'toxapex', 'golbat', 'gengar'], size: 4, lv: 2, win: [room('al-placed-ledger')] }))))], { cast: [PLUM] }),
  step('al-placed-ledger', 'Phase 3: Placement', `Plumeria, beaten: ${say('Plumeria', `...Who's gonna ask if they ate.`)} A white boat, at the Po Town jetty, in daylight. Staff in white, with umbrellas, being gentle. A ledger, a column of names, and beside each, in Wicke's neat hand, a place. Koa Ridgeway: Akala. A boarding school. "Excellent facilities." Nohea: Melemele. A family. The twins: different islands. "For their independence." Lux: Poni. A very good home. She's fourteen. She's safe. She's fed. She wasn't asked. Nobody's harmed. Nobody's together. ${say('Wicke, signing the last', `There. They've all somewhere to go.`)} Zia, reading over her shoulder, very quietly: ${say('Zia', `Did anyone ask them where?`)} The pen stops. ${say('Wicke', `...We don't— it's for the—`)} She looks at the column. ${say('Wicke', `Oh, no.`)}`, [
    ch('Go up to the gate.', on(`Guzma's at the door. He hasn't heard.`, 'al-placed-gate')),
  ], { cast: [WICKE, ZIA], tint: '#c8c0a0' }),
  step('al-placed-gate', 'Phase 4: The Gate', `Guzma's at the door. He hasn't heard.`, [
    ch('Tell him.', PLACED_END(`You tell him. He listens. He looks down at the dock, where the van was. Then he goes through: there's no Po Town to turn round for.`, flag('guzma-went'))),
    ch(`Don't.`, PLACED_END(`You say nothing. He goes through: there's no Po Town to turn round for.`, flag('guzma-went'))),
  ], { cast: [GUZMA] }),
];
// The letters: five bundles of eight, one at each rest after Placed, for the rest of the run. Carry every one, and at the fortieth they've all got each other's addresses.
const LETTERS = [
  `A letter, care of you. From Nohea, on Melemele, to "Koa (the wet one)." Seven more under it, tied with a bootlace.`,
  `Eight letters. One from a twin to a twin, on different islands. It says "WHERE ARE YOU" on the front, and an island's name on the back, crossed out, and another.`,
  `Eight more. One's from Koa, from the boarding school: "Excellent facilities. Nobody asks if you ate." It's addressed to all of them.`,
  `Eight more. One's from Lux, on Poni. It's six pages. It's mostly drawings of a van.`,
  `The last eight. Lux's is on top: "Plumes. I got everybody's. Everybody's got everybody's now."`,
];
const letters: Json[] = LETTERS.map((text, i) => ev(`al-placed-letters-${i + 1}`, `Letters (${(i + 1) * 8} of 40)`, 'Evil Teams', { requires: [flagIs('alola-ending-placed'), flagIs('alola-letters', i * 8, i * 8)], cast: [], tint: '#3a3428' }, text, [
  ch('Carry them.', out(i === 4
    ? `You carry them. Forty. They've all got each other's addresses now. Months on, a van's seen on the Poni road. It's very full.`
    : `You carry them to where they're going. It's out of your way.`, flag('alola-letters', 8), ...(i === 4 ? [flag('alola-van-poni'), ...kind(2)] : kind(1)))),
  ch('Leave them.', out(`You leave them on the table at the rest. Somebody else might.`, flag('alola-letters-dropped'))),
]));

// ---------- F. Ending 4: "Both Halves" (ps_al_both). Evil Mode on hold: the four decisions are flags. ----------
const BOTH_END = (lead: string, ...fx: Json[]): Json => out(`${lead} Two bases: a white one and a wet one. Aether's funds, and a line item that's finally honest. Skull's loyalty: very high, and personal. It isn't to the team. It's to whoever asked their name. Everything this team takes in has to end up somewhere. ${EPILOGUE.both}`,
  story({ beat: true }), story({ end: 'allied' }), flag('alola-ending-both'), flag('evil-start-alola'), ...fx);
const both: Json[] = [
  step('al-both-deck', 'Phase 1: The Deck', `"You've each got half a good idea. You take them in. You make them well. Neither of you does the next part." ${say('Guzma', `...You want us?`)} ${say('Wicke', `I've the forms.`)} Lusamine, at the gate, turning for the first time: ${say('Lusamine', `You'd take my Foundation. And put it with that.`)} "It's your husband's Foundation. I've seen his sign."`, [
    ch('Battle Guzma.', fight(`Neither's fought to the end. Each is fought to a stop.`, ps(trainer('Guzma', { sprite: GUZMA, team: ['golisopod', 'ariados', 'masquerain', 'pinsir'], size: 4, lv: 1, win: [room('al-both-guzma')] }))))], { cast: [GUZMA, WICKE, LUSA] }),
  step('al-both-guzma', 'Phase 2: Two Bosses', `${say('Guzma', `I been second my whole life, Number One. You tellin' me I gotta be second to you?`)}`, [
    ch(`"I'm telling you there's forty-one. And you count separate."`, fight(`He laughs. He sits down on the deck. ${say('Guzma', `...Plumes says that. A'ight.`)} Lusamine is already sending out Madame.`, ps(trainer('Lusamine', { sprite: LUSA, team: LUSAMINE, size: 5, lv: 2, win: [room('al-both-lusamine')] }))))], { cast: [GUZMA, LUSA] }),
  step('al-both-lusamine', 'Phase 2: Two Bosses', `${say('Lusamine', `You'll let them go. All of them. That's what the second sentence is. You'll stand on the dock and wave.`)}`, [
    ch(`"And some'll come back."`, on(`She doesn't answer. She doesn't go through, either.`, 'al-both-sign')),
    ch(`"One did. He's twenty miles north."`, on(`She doesn't answer. She doesn't go through, either. She looks north.`, 'al-both-sign'), { requires: [flagIs('alola-mohn-found')] }),
  ], { cast: [LUSA] }),
  step('al-both-sign', 'Phase 3: The First Hour', `A deck. A dock. Forty kids. Two hundred staff. Two hundred and six that got better. A gate, open. Four decisions. The first: the sign.`, [
    ch('GET WELL.', on(`The sign stays as it was.`, 'al-both-cold', flag('alola-sign-short'))),
    ch('GET WELL. GO HOME.', on(`Both sentences. Everything the team takes in will have a count: days till it's somewhere to go. The team's judged on it.`, 'al-both-cold', flag('alola-sign-full'))),
    ch('Your own second sentence.', on(`You write it under the first, yourself.`, 'al-both-cold', flag('alola-sign-own'))),
  ], { cast: [WICKE, KOA] }),
  step('al-both-cold', 'Phase 3: The First Hour', `The second: the cold room.`, [
    ch('Keep it cold.', on(`B2 stays cold.`, 'al-both-gate', flag('alola-cold-kept'))),
    ch('Wake them, and ask each.', on(`Sixty cases, opened one at a time, and each is asked. The police wave, these days.`, 'al-both-gate', flag('alola-cold-asked'))),
    ch(`Wake them, and keep the ones that'd be useful.`, on(`A powerful roster on day one. Zia leaves the door open, and walks out through it.`, 'al-both-gate', flag('alola-cold-useful'), flag('zia-left'))),
  ], { cast: [ZIA], tint: '#1a2230' }),
  step('al-both-gate', 'Phase 3: The First Hour', `The third: the gate.`, [
    ch('Shut it.', on(`It shuts.`, 'al-both-forty', flag('alola-gate-shut'))),
    ch('Leave it.', on(`It stays open.`, 'al-both-forty', flag('alola-gate-open'))),
    ch(`Shut it, and keep a door: for the ones on the far side that are lost.`, on(`A door: the Thin Place. Once a stage, a frightened Beast may be shown the way back.`, 'al-both-forty', flag('alola-gate-door'))),
  ]),
  step('al-both-forty', 'Phase 3: The First Hour', `The fourth: the forty.`, [
    ch('Grunts.', on(`They're Grunts.`, 'al-both-ladle', flag('alola-forty-grunts'))),
    ch('Staff.', on(`They're staff, with passes.`, 'al-both-ladle', flag('alola-forty-staff'))),
    ch(`Each one's asked: "What's next?" And somebody watches.`, on(`Each of the forty has a trial to retake. Koa's first.`, 'al-both-ladle', flag('alola-forty-asked'))),
  ], { cast: [KOA] }),
  step('al-both-ladle', 'Phase 3: The First Hour', `Plumeria, with a ladle: ${say('Plumeria', `Two bases. A white one and a wet one. Who's doin' the cookin'?`)}`, [
    ch('"You."', BOTH_END(`${say('Plumeria', `Figured.`)}`, flag('alola-cook-plumeria'))),
    ch(`"Whoever asks 'you ate?'"`, BOTH_END(`${say('Plumeria', `...That's everybody, now.`)}`, flag('alola-cook-asks'))),
    ch('"Everybody washes their own bowl."', BOTH_END(`${say('Plumeria', `Ha. A'ight.`)}`, flag('alola-cook-bowls'))),
  ], { cast: [PLUM] }),
];

// ---------- G. Team Tidepool: refused the Offer, and put the Slowpoke down ----------
const TP = { cast: [ZIA, KOA], tint: TIDE, effect: 'none' };
const corridor = (t: Side): Json => ev(`tp-corridor-${t === 'skull' ? 'sk' : 'ae'}`, 'One Slowpoke', 'Evil Teams', { requires: [isSide(t), { kind: 'evil', inside: false, after: 2, ends: ['none'] }, AL, flagIs('alola-offer-refused'), flagIs('alola-slowpoke-down', 0, 0)], cast: [KOA, ZIA, URI], pokemon: 'slowpoke', tint: '#3a4a3a' },
  `A nursery on Akala. You walk in on a corridor. Two squads. One Slowpoke, between them, being held at both ends. ${say('Koa', `Yo. That's ours.`)} ${say('Zia', `It's a patient.`)} ${say('Uri', `I've been told to take it.`)} ${say('Koa', `I been told to take it.`)} The Slowpoke yawns. Lux, who was locked in a van: ${say('Lux', `Why's everybody got the same job?`)} Nobody asks how she got out. They've all noticed you.`,
  [
    ch('"Whose is it, actually?"', out(`The nursery's keeper: "Nobody's. It walked in. Two years back. It's got a friend here." Nobody lets go. You leave them to it.`, flag('alola-same-job'))),
    ch('"Put it down. All of you. See where it goes."', out(`Four hands let go. It sits. It thinks about it. It takes about a minute. It's the longest minute in the corridor's history. It gets up. It goes back into the nursery, slowly, and lies down next to another Slowpoke, which shuffles over without waking. ${say('Koa', `...So nobody needed to steal it.`)} ${say('Zia', `Nobody needed to have it.`)} ${say('Uri', `I wasn't told what to do if it didn't want to go. Nobody's ever covered that.`)} ${say('Lux', `It's got a friend.`)} Koa and Zia have met. He notices her gloves. She notices he's wet.`, ...kind(1), flag('alola-slowpoke-down'), flag('alola-same-job'), flag('ally-uri'))),
    ch('Walk on.', out(`It's not your corridor. You leave them holding it.`)),
  ]);
const outside = (o: Json = {}): Json[] => [{ kind: 'evil', inside: false, ends: ['none'], ...o }, AL];
const tidepool: Json[] = [
  corridor('skull'), corridor('aether'),
  ev('tp-founding', 'Team Tidepool', 'Evil Teams', { callback: true, requires: [...outside({ after: 4 }), flagIs('alola-offer-refused'), flagIs('alola-slowpoke-down')], ...TP, pokemon: 'corsola' },
    `Rocks. A pool on Akala, at low water. Two people sitting on either side of it who've never sat on the same rocks. Zia Pemberton, gloves off, one hand in the water: ${say('Zia', `You said, 'See where it goes.' I've thought about nothing else.`)} Koa Ridgeway, wet, as usual: ${say('Koa', `She wrote me. On paper. I ain't had a letter since I was eleven.`)} ${say('Zia', `I know how to make them well.`)} ${say('Koa', `I know what it's like when nobody wants you after.`)} Both: "It's the same job. It's the second half nobody does." In the pool: a Corsola, with one branch shorter than the others. It's looking at Zia. It waves the branch. ${say('Zia', `...That's— I nursed that one. Before the cold. They let one go, my first year, by mistake. It came back here.`)} She's crying. It's very undramatic. ${say('Zia', `It remembers me. It went home and it remembers me. I didn't know they did that. Nobody at the Paradise knows they do that; we've never let enough go to find out.`)} The creed, scratched on a rock above the tide line: BETTER ISN'T FINISHED TILL YOU'VE SOMEWHERE TO GO.`,
    [
      ch('Sit down on the rocks.', out(`You sit. Team Tidepool: Zia, who can make anything well; Koa, who knows the walk back up; Uri, who'd like to be told something he'd have done anyway. Lux isn't crew. She's fourteen. She'll be the first one Tidepool finds a place for, and she'll pick it.`, mark('third'), flag('tidepool-founded'))),
      ch('"Who else?"', out(`Zia counts them off. Uri Vandermeer: "I do what I'm told. I'd like to be told something I'd have done anyway." Wicke: two hundred and six unsigned forms, and a boat she can borrow. Plumeria: the Borrow Book, three open entries. Nanu: he doesn't join; he stops charging rent. Acerola, eleven, who does the cooking: "I've a house full of kids with nobody. D'you want it to be part of this? It'd be nice to be part of something that writes back." And a captain, unnamed: the one who said "next." He's come to watch.`, mark('third'), flag('tidepool-founded'))),
    ]),
  // G3. Return 1: Three Open Entries (ps_tp_entries)
  ev('tp-return-1', 'Return 1: Three Open Entries', 'Evil Teams', { requires: [...outside({ after: 5, has: 'third' })], cast: [PLUM], tint: TIDE },
    `A Return's a walk. Somebody, or something, that's been taken in is taken back: to where it's from, or to where it's chosen. Tidepool goes along. It doesn't leave till the thing's landed. Plumeria opens the Borrow Book. Three hundred and twelve. Three not brought back.`,
    [ch('Go.', on(`You go along.`, 'tp-r1-rockruff'))]),
  ev('tp-r1-rockruff', 'A Rockruff', 'Evil Teams', { room: true, cast: [PLUM], pokemon: 'rockruff', tint: TIDE },
    `A Rockruff, from a boy on Melemele. The boy moved. Nobody knew where. Found: Akala, a new school. He doesn't recognise it at first; it's grown. It recognises him.`,
    [ch('Next entry.', on(`Plumeria ticks it.`, 'tp-r1-cutiefly'))]),
  ev('tp-r1-cutiefly', 'A Cutiefly', 'Evil Teams', { room: true, cast: [PLUM], pokemon: 'cutiefly', tint: TIDE },
    `A Cutiefly, from a florist. It was let go by a Grunt who felt bad. In the wrong meadow. It's doing fine.`,
    [ch('Ask it. (An open hand; a flower.)', on(`It goes back. The florist's kept its jar.`, 'tp-r1-mudbray'))]),
  ev('tp-r1-mudbray', 'A Mudbray', 'Evil Teams', { room: true, cast: [PLUM], pokemon: 'mudbray', tint: TIDE },
    `A Mudbray, from a farm. It doesn't want to go back. It's been pulling the Po Town taro cart for a year and it likes it. Plumeria goes to the farm herself. With the book. She apologises. The farmer: "A year? I thought it was stolen. You've been working it? ...Is it happy?"`,
    [ch('"Come and see."', out(`He comes to see. It's happy. He takes a day's wage for it, and a bag of taro. Plumeria closes the book. It's the first time it's balanced.`, ...kind(1), flag('tidepool-return1')))]),
  // Return 2: The Fourth Time (ps_tp_fourth). The player doesn't take it for him.
  ev('tp-return-2', 'Return 2: The Fourth Time', 'Evil Teams', { requires: [...outside({ after: 5, has: 'third' }), flagIs('tidepool-return1')], cast: [KOA, ZIA], tint: '#1a2a1a' },
    `A trial site. Koa takes his trial again. ${say('Koa', `Three times I walked up there. I can tell you every stone.`)} Behind him: thirty-nine kids, a keeper in white gloves, a guard, an eleven-year-old with a ladle, and an old man under several cats. ${say('Koa', `...That's a lot of people.`)} ${say('Zia', `You said if somebody was watching.`)} ${say('Koa', `I said somebody.`)}`,
    [ch('Watch.', on(`You don't take it for him. You watch.`, 'tp-r2-wrong'))]),
  ev('tp-r2-wrong', 'The Fourth Time', 'Evil Teams', { room: true, cast: [KOA, CAPTAIN], pokemon: 'salandit', tint: '#1a2a1a' },
    `You're in the crowd. It's a battle you aren't in. It goes wrong, in the middle. His Salandit's burned out. He's got one left. At the top of the path, the captain. The same one. He's not talking to anybody. He's watching. ${say('The captain', `...Take your time.`)} It's the opposite of "next."`,
    [
      ch('Keep looking.', out(`He passes. Forty people make a noise that the island hears. A queue's formed behind him: Nohea. The twin. The boy who froze.`, ...kind(1), flag('tidepool-return2'), flag('koa-passed')), {
        chance: 0.5, fail: out(`He doesn't. ${say('Koa', `A'ight. Fifth time. Tuesday?`)} Forty people: "TUESDAY." A queue's formed behind him: Nohea. The twin. The boy who froze.`, ...kind(1), flag('tidepool-return2'), flag('koa-tuesday')),
      }),
      ch('Look away.', out(`You look at the sea. When you look back, it's over. It doesn't matter which way.`, flag('tidepool-return2'), flag('koa-tuesday')), {
        chance: 0.5, fail: out(`You look at the sea. When you look back, he's at the top. A queue's formed behind him: Nohea. The twin. The boy who froze.`, flag('tidepool-return2'), flag('koa-passed')),
      }),
    ]),
  // Return 3: Two Hundred and Six (night, a + node)
  ev('tp-return-3', 'Return 3: Two Hundred and Six', 'Evil Teams', { requires: [...outside({ after: 5, has: 'third' }), flagIs('tidepool-return1'), night], cast: [WICKE, ZIA], tint: '#c8c0a0' },
    `The conservation wing, at night. Wicke's forms. Each one's a Pokémon that got better and has been waiting. ${say('Wicke', `If I sign the other form: 'release': I need a second signature. A keeper's.`)} Zia's got a pen. ${say('Wicke', `And a destination. For each. The form won't file without.`)}`,
    [ch('Sort the charts.', on(`You start with the first pile.`, 'tp-r3-charts'))]),
  ev('tp-r3-charts', 'Two Hundred and Six', 'Evil Teams', { room: true, cast: [WICKE, ZIA], pokemon: 'mareanie', tint: '#c8c0a0' },
    `A long, quiet game: two hundred and six charts. Each has where it was found. You sort them by island; Tidepool's crew takes a boat each. "Mareanie. Spines regrown. Found: Hano Beach." "Wingull. Wing set. Found: off Po Town." That's where all the Wingull went. "Petilil. Found: Lush Jungle. Has asked to stay." It's allowed. That's somewhere to go. "Slowpoke. Nothing wrong. Found: a nursery. Has a friend there."`,
    [ch('Sort until morning.', out(`The wing's empty by morning. Curator Pua's standing in it. ${say('Pua', `It's very quiet. I'd thought— I'd thought it'd feel like losing them.`)} She looks at the chalk on the wall: Zia's started two columns. ${say('Pua', `It feels like the job.`)}`, ...kind(2), flag('tidepool-return3')))]),
  // G4. The climax: Still Here (replaces the Final Choice and the outside climax; no battle is needed)
  ev('tp-still-here', 'Still Here', 'Evil Teams', { callback: true, requires: [...outside({ beat: 6, has: 'third' })], cast: [LUSA, ZIA, KOA], tint: DECK, effect: 'glint' },
    `The upper deck. The gate. Lusamine, walking. Tidepool doesn't fight. It comes up the stairs with two people. ${say('Zia', `President. We've brought you something.`)} ${say('Lusamine', `I'm leaving, dear. I'm going where nothing does.`)} ${say('Koa', `Yeah. We heard. Thing is. You got this idea that stuff either stays the same or it's gone.`)}`,
    [ch('Step aside for them.', on(`You step aside.`, 'tp-still-two'))]),
  ev('tp-still-two', 'Still Here', 'Evil Teams', { room: true, cast: [GLADION, LILLIE, LUSA], tint: DECK },
    `Two people step forward. Gladion, with a Pokémon that's got its helmet off, and a name. Lillie, with a bag, and a look she didn't used to have. ${say('Zia', `They changed. They're still here.`)} ${say('Lillie', `Mother. I'm going to cut my hair.`)} ${say('Gladion', `I named it. It's fine. We're fine. Come and see.`)} ${say('Lusamine', `...You're not the ones I had.`)} ${say('Lillie', `No. You never met us. You were busy keeping the others.`)}`,
    [ch('Look at the stairs.', on(`Somebody else is coming up.`, 'tp-still-corsola'))]),
  ev('tp-still-corsola', 'Still Here', 'Evil Teams', { room: true, cast: [ZIA, KOA, LUSA], pokemon: 'corsola', tint: DECK },
    `Behind them, up the stairs, at their own pace: a Corsola with a short branch, carried in a bucket by a fourteen-year-old. A Pikachu, that was frozen mid-leap, finishing the leap. A Slowpoke, and its friend. ${say('Zia', `These got better. And went. And came to say so.`)} The Corsola waves its branch. ${say('Lusamine', `It did that to him. On the barge. I never forgave it.`)} ${say('Koa', `Lady. It's wavin' at you.`)}`,
    [
      ch('Wait.', on(`Lusamine doesn't go through the gate.`, 'tp-still-close')),
      ch('Look at the dock.', on(`A boat's come in.`, 'tp-still-pelago'), { requires: [flagIs('alola-mohn-found')] }),
    ]),
  ev('tp-still-pelago', 'Still Here', 'Evil Teams', { room: true, cast: [MOHN, LILLIE, LUSA], pokemon: 'exeggutor-alola', tint: DECK },
    `A man in a straw hat, with a basket, who's been told there are people here who like beans. ${say('The Man at the Pelago', `Hello, hello! What a lot of stairs! Is this the— oh.`)} He's looking at an Exeggutor on the dock. It's looking at him. Three heads. ${say('The Man at the Pelago', `...Well, now. Don't I know you.`)} He's humming. Lillie's humming. It's the same tune. Lusamine doesn't go through the gate. She sits down on the deck in a white dress. She doesn't tell him. She asks if she can carry the basket.`,
    [ch('Watch the gate.', on(`Nobody's holding it open now.`, 'tp-still-close', flag('mohn-came')))]),
  ev('tp-still-close', 'Still Here', 'Evil Teams', { room: true, cast: [LUSA, FABA, WICKE], tint: DECK },
    `The gate closes by itself. Nobody was holding it open but her.`,
    [
      ch('Let it close.', out(`It closes. Tidepool doesn't disband. It becomes a thing Alola has: a rock by the tide with a line scratched on it, where a Pokémon may be asked what it wants. The sign's back. Both sentences. On Aether Paradise's dock, and, in spray paint, on the Po Town wall. ${EPILOGUE.tidepool}`,
        story({ beat: true }), story({ end: 'exposed' }), flag('alola-ending-tidepool'), ...kind(2))),
      ch('Battle Faba.', fight(`Faba, defending the last line from nobody.`, ps(trainer('Faba', { sprite: FABA, team: ['hypno', 'claydol', 'bruxish'], size: 3, lv: 1, win: [room('tp-still-faba')] })))),
    ]),
  ev('tp-still-faba', 'Still Here', 'Evil Teams', { room: true, cast: [FABA, WICKE], tint: DECK },
    `He stops halfway. ${say('Faba', `I've— who am I—`)} Wicke takes his arm.`,
    [ch('Let the gate close.', out(`It closes by itself. Tidepool doesn't disband. It becomes a thing Alola has: a rock by the tide with a line scratched on it, where a Pokémon may be asked what it wants. The sign's back. Both sentences. On Aether Paradise's dock, and, in spray paint, on the Po Town wall. ${EPILOGUE.tidepool}`,
      story({ beat: true }), story({ end: 'exposed' }), flag('alola-ending-tidepool'), ...kind(2)))]),
  // G5. After Tidepool: a rock with a line scratched on it, at a tide node.
  ev('tp-rock', 'A Line on a Rock', 'Evil Teams', { requires: [flagIs('alola-ending-tidepool'), AL], cast: [], tint: TIDE },
    `A rock above the tide line, with a line scratched on it: BETTER ISN'T FINISHED TILL YOU'VE SOMEWHERE TO GO.`,
    [ch('Ask your lead what it wants.', out(`The answer's what it does. It looks at the sea, and at the road, and at you; and it keeps going. It's glad to've been asked.`, bondUp(1)))]),
];
(tidepool[2] as Json).remembers = [{ id: 'uri', when: [flagIs('ally-uri')], notice: say('Uri', `I do what I'm told. I'd like to be told something I'd have done anyway.`) }];

export const EVENTS: Json[] = [finalOf('skull'), finalOf('aether'), ...plan, ...turn, ...caseBy, ...placed, ...letters, ...both, ...tidepool];
export const REMOVE: string[] = [];
void ACEROLA;
