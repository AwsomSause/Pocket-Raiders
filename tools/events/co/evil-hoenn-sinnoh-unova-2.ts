// Catalog Overhaul Pack, row 9: Sinnoh, Team Galactic from inside, the end (TEAM_GALACTIC_SINNOH_FULL_2). The Final Choice
// at the Spear Pillar, the four endings as chain pseudo-stages (ps_gx_plan, ps_gx_turn, ps_gx_charon, ps_gx_own: written by
// _evil-hsu-maps.ts), Team Lantern (the third option: founding, three Rounds and Three Hundred Lanterns) and Part G's
// "who ends up where", said as each ending closes. "Take it all" ends the team story here: Evil Mode is on hold (Kice),
// so its first hour's four decisions are flags only.
import { $, ch, ev, fight, flag, flagIs, hurt, out, room, trainer, type Json } from '../dsl.ts';
import { evil as story, kind, prompt, rivalTrust, STEALTH } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';
import { gx } from './evil-hoenn-sinnoh-unova-1.ts';

export const CATEGORY = 'evil-hoenn-sinnoh-unova';

const G = teamJson('galactic');
const GRUNT = G.ranks.grunt.sprite;
const SCI = G.ranks.specialist.sprite;
const MARS = G.ranks.executive.sprite;
const BOSS = G.ranks.leader.sprite;
const SATURN = 'boss.npc_psychic_m';
const CHARON = 'boss.npc_scientist';
const PADRAIG = 'boss.npc_fisherman';
const HOLMGREN = 'boss.npc_lady';
const CYNTHIA = 'boss.cynthia-gen7';
const PILLAR = '#2a2e3e';
const say = (who: string, line: string): string => `${who}: "${line}"`;
const mark = (m: string): Json => story({ mark: m });
/** A fight inside an ending's own map: a loss walks the player back out, and the run goes on. */
const ps = (b: Json): Json => ({ ...b, pseudo: true });
const step = (id: string, name: string, intro: string, choices: Json[], o: { cast?: string[]; pokemon?: string; tint?: string; effect?: string } = {}): Json =>
  ev(id, name, 'Evil Teams', { room: true, cast: o.cast ?? [BOSS], tint: o.tint ?? PILLAR, effect: o.effect ?? 'snow', ...(o.pokemon ? { pokemon: o.pokemon } : {}) }, intro, choices);
const on = (text: string, next: string, ...fx: Json[]): Json => out(text, ...fx, room(next));
const night: Json = { kind: 'period', in: ['night'] };

// Part G, who ends up where, said as each ending closes.
const EPILOGUE: Record<'plan' | 'turn' | 'charon' | 'own' | 'lantern', string> = {
  plan: `Saturn starts a new log. Mars waits on the Pillar. Jupiter's gone, with the petty cash. Charon tries to patent the tear. Sird keeps her Thursdays. Greer says "Una" in the empty world, and it echoes. Lior was right; nobody knows. Cadet Io hums it in the dark, to keep count. Wynn labels the last door: OUT. Padraig fishes a lake with nothing in it, for four minutes. Mrs. Holmgren asks the empty hall; there's no answer. The old man still writes. The three were free the moment it folded. The building's empty, and the lights are on.`,
  turn: `Saturn winds the firm up properly, and corrects his two false entries, with a note: "Deliberate." Mars goes looking for him. Jupiter's gone, with the petty cash. Charon's in Looker's custody. Sird's gone before the snow settles. Greer does birthdays, badly; everyone loves them. Lior runs the Institute. Cadet Io opens the doors, and leaves them open. Wynn starts a new drawer: FEELINGS (SOME). Padraig fishes. Mrs. Holmgren chairs the Institute. The old man is at the foot of the mountain. The three are free. The building's the Veilstone Institute.`,
  charon: `Saturn resigns: "I'll not invoice a lake." Mars works for Charon a week, and breaks his clipboard. Jupiter stays: "It's a job." Charon's Chief Executive. Sird's on the board. Greer posts her helmet to Charon, with a bill. Lior's hired, and resigns in a week. Cadet Io's fined for humming on licensed premises. Wynn labels a lake PROPERTY, and takes the tab off that night. Padraig's charged for a licence, and doesn't pay. Mrs. Holmgren votes against. The old man lives two streets from a man who won't walk them. The three are in tanks, licensed. The building's Galactic plc.`,
  own: `Saturn's your Second. Mars stays, if named: "Present." Jupiter stays: "It's a job. The hat's better." Charon renegotiates; he's kept, and he's watched. Sird reports to you on Mondays, and somewhere else on Thursdays. Greer has the Mess: she asks, and waits. Lior has the Workshop: "Something that doesn't end everything. As a change." Cadet Io leads the canteen. Wynn relabels the building, room by room, by asking who's in it. Lake Valor's a holding you never have to take. Mrs. Holmgren votes against, the first time. Then for. The old man gets a visitor, in time. The building's your headquarters.`,
  lantern: `Cyrus lives two streets from the sea. Saturn carries a lamp wrong, for good. Mars is on the roll: somebody asked. Jupiter's gone, with the hat. Charon sends Lantern a bill for the cable; Mrs. Holmgren pays it in person, slowly, in coins. Sird took a lamp; nobody saw her light it. Greer's home; there's a place laid. Lior teaches at Canalave and sets one exam question: "Why not?" Cadet Io went first. Wynn labels three hundred lamps with three hundred names. Padraig: "Mind the spines." The old man lent the bench. The three are free; one of them listened. The doors are open.`,
};

// ---------- The Final Choice (Sinnoh stage 8, the Spear Pillar) ----------
const finalChoice = ev('gx-final-choice', 'The Final Choice', 'Evil Teams', { room: true, cast: [BOSS], tint: PILLAR, effect: 'snow' },
  `The summit. Snow going sideways. Two tears in the sky. Two shapes that don't fit in it, held by four red lines. All four lines come down to one man's forearm. ${say('Cyrus', `Ceres. You're on time. Stand at my left. You'll see better.`)} Below, on the stair: lights. Somebody's coming up. Several somebodies. ${say('Cyrus', `They're climbing. They always do. It's the defect in operation: they think arriving will change the arithmetic.`)} He looks at the lines on his arm. Two are slack. Two are taut. He's one man. ${say('Cyrus', `I've miscalculated the load. It requires two hands and I've need of one for the mechanism. Take these.`)} He holds out two of the four. ${say('Cyrus', `Hold them. That's all. You needn't believe in it. You need only not let go.`)} You hesitate. ${say('Cyrus', `You're still feeling something. I can see it from here. Hold the chain regardless.`)}`,
  [
    ch('Take the two lines. Hold.', on(`You take them. They're heavier than a world. Below, the first of them reach the last landing.`, 'gx-plan-looker', flag('galactic-final-plan'))),
    ch('Take the two lines. Let go.', on(`You open your hands. Two lines go up into the sky like kite strings. One of the shapes turns its head, slowly, toward the dais. It's got room to. ${say('Cyrus', `...You let go.`)} ${say('Cyrus', `I'd calculated for betrayal. I'd put it at four per cent. I'd not calculated for it being you. I'd thought you were the one result I'd got right.`)}`, 'gx-turn-slack', flag('galactic-final-turn'))),
    ch(`Don't take them. Raise a hand to the ridge.`, on(`On the ridge, a man in a lab coat is waiting with a clipboard. He sees your hand, and starts down.`, 'gx-charon-meeting', flag('galactic-final-charon'))),
    ch('"Give them to me. Not two. All of them."', on(`${say('Cyrus', `You can't hold four. I couldn't.`)} "You don't want a new world. You want to be let alone. Go and be let alone. I'll mind this one." He looks at you. For the first time, he's surprised; it shows as a very small delay. ${say('Cyrus', `...You'd take them? All of them? The five hundred. The cards. With the wanting?`)} ${say('Cyrus', `I've no contest to offer. Contesting is wanting. I find I don't.`)} He hands over the lines like a man putting down shopping.`, 'gx-own-mars', flag('galactic-final-own')), { requires: [{ kind: 'evil', rank: 5, has: 'confided' }] }),
  ]);
// What the run is carrying changes what can be said (FULL_2 A).
(finalChoice as Json).remembers = [
  { id: 'eleven', when: [flagIs('galactic-eleven')], notice: `"Eleven minutes." He knows what it means. Saturn logged it.` },
  { id: 'wanted', when: [flagIs('galactic-wanted-to')], notice: say('Cyrus', `"I wanted to." I've thought about that. I couldn't find the fault in it. I've been looking.`) },
  { id: 'cards', when: [flagIs('galactic-cards-said')], notice: `"Nobody asked for all of it." He hears it again, from you, and doesn't answer it this time either.` },
];

// ---------- Ending 1. "It's Very Quiet" (Carry it out; ps_gx_plan) ----------
const plan: Json[] = [
  step('gx-plan-looker', 'Phase 1: The Stair', `You hold two lines and can't leave the dais. Your party fights from where it stands. Three come up. The first, in his own coat: ${say('Looker', `I shared a canteen with you! I vouched, in my report! One sentence, and you were in it!`)}`, [
    ch('Hold the lines. Fight.', fight(`Looker's Croagunk comes up the last step first.`, ps(trainer('Looker', { size: 3, lv: 0, win: [room('gx-plan-rival')] })))),
  ], { cast: [] }),
  step('gx-plan-rival', 'Phase 1: The Stair', `Your rival, out of breath, with snow in their hair. They don't understand. They're not meant to. "What are you doing up there? Come down. Come down and tell me."`, [
    ch('Hold the lines. Fight.', fight(`They don't wait for an answer.`, ps(trainer('Your rival', { rival: true, size: 6, lv: 1, win: [room('gx-plan-cynthia')] })), rivalTrust(-2))),
  ], { cast: [] }),
  step('gx-plan-cynthia', 'Phase 1: The Stair', `${say('Cynthia', `I'm not going to tell you it's wrong. You know. I'm going to ask you what you think is on the other side.`)}`, [
    ch('Hold the lines. Fight.', fight(`Her Garchomp lands on the last step and the dais shakes.`, ps(trainer('Cynthia', { sprite: CYNTHIA, team: ['garchomp', 'spiritomb', 'lucario', 'milotic', 'roserade', 'togekiss'], size: 6, lv: 2,
      win: [room('gx-plan-load')] })))),
  ], { cast: [CYNTHIA] }),
  step('gx-plan-load', 'Phase 2: The Load', `${say('Cynthia, beaten, sitting down in the snow', `Then I'll watch. Somebody ought to. He wanted a witness; he's getting two.`)} The two shapes pull. Your lines go taut and slack. Hold when it's taut; give when it's slack. Each guardian that's free pulls the other way.`, [
    ch('Hold it by feel.', on(`${say('Cyrus, not looking round', `Steady. You're doing it by feel. I'd have used a gauge. ...It's working. I'll note that.`)}`, 'gx-plan-fold'), { prompt: prompt('gauge-hold'), fail: on(`You miss the slack, and the party takes the strain. Nobody faints from it. ${say('Cyrus', `Steady. ...It's working. I'll note that.`)}`, 'gx-plan-fold', hurt(0.1)) }),
  ]),
  step('gx-plan-fold', 'Phase 3: The Fold', `The sky doesn't break. It closes, like a book. The mountain's inside it for a moment. Then nothing is.`, [ch('...', on(`White.`, 'gx-plan-nothing'))], { effect: 'none', tint: '#e8e8f0' }),
  step('gx-plan-nothing', 'A World With Nothing in It', `White. No floor that's a floor. No sound. Two people. A long time. There's no clock, so it's only long. ${say('Cyrus', `...It's quiet.`)} More of it. ${say('Cyrus', `It's very quiet.`)} He's looking about. There's nothing to look at. He turns, at last, and looks at you. It's the only thing in the world to look at. ${say('Cyrus', `It's finished. It's been seen. That's— that concludes it.`)} He doesn't move. He'd like you to say something. He doesn't know that's what it is.`, [
    ch('(Say nothing.)', on(`He nods. He waits. He goes on waiting. It's what he built: a place where nobody says anything. After a while he sits down. ${say('Cyrus', `You may go. I find I'd assumed you'd stay. I don't know what I based that on.`)}`, 'gx-plan-door')),
    ch('"How are you?"', on(`The four minutes start. There's no clock. He takes them anyway. ${say('Cyrus', `...I've no instrument for that. I switched it off. I'm going to say "tired." I can't verify it. It's the word that was there.`)}`, 'gx-plan-door', flag('cyrus-asked'))),
    ch('"What now?"', on(say('Cyrus', `There's no "now." I removed it. I see that makes the question difficult. I hadn't provided for a question.`), 'gx-plan-door')),
], { effect: 'none', tint: '#e8e8f0' }),
  step('gx-plan-door', 'The Way Out', `Behind you, where there's no behind: a tear, the size of a door. Two dragons don't unmake that easily. They've left one. ${say('Cyrus', `It's for you. I've no requirement to go back. I've what I designed.`)}`, [
    ch('"Come with me."', on(`${say('Cyrus', `No. But ask again. Not now; there isn't one. Ask again when there is.`)} You walk out.`, 'gx-plan-after', flag('cyrus-asked'))),
    ch('"Goodbye, Cyrus."', on(`He nods. You walk out.`, 'gx-plan-after', flag('cyrus-stayed'))),
    ch('(Leave the letter. Go.)', on(`You leave it on the white, by his hand. You walk out.`, 'gx-plan-after', flag('cyrus-stayed')), { requires: [flagIs('galactic-letter')] }),
  ], { effect: 'none', tint: '#e8e8f0' }),
  step('gx-plan-after', 'Afterwards', `The mountain's there. The snow's there. Sinnoh's as it was: the dragons undid it the moment the line went slack. It lasted, outside, about four minutes. Five hundred Grunts on the stair, who weren't coming. They're looking at the one who came back. ${say('Saturn', `He isn't with you.`)} ${say('Saturn', `The Observations say a thing's not finished till it's been seen. You saw it. Is it finished?`)} Whatever you say, he writes it down. It's the first entry in a new log. The team has no leader, and looks to the Witness.`, [
    ch('Take it.', out(`"Mind This One," entered late, with Cyrus gone. Saturn opens a fresh page. ${EPILOGUE.plan}`, story({ beat: true }), story({ end: 'allied' }), flag('galactic-ending-plan'), flag('sinnoh-four-minutes'), flag('galactic-plan-took-it'))),
    ch('Tell them to go home.', out(`They go home. Five hundred people walk down a mountain with their helmets under their arms. ${EPILOGUE.plan}`, story({ beat: true }), story({ end: 'allied' }), flag('galactic-ending-plan'), flag('sinnoh-four-minutes'), ...kind(1))),
  ], { cast: [SATURN] }),
];

(plan[5] as Json).remembers = [
  { id: 'letter', when: [flagIs('galactic-letter')], notice: `The letter's still in your coat.`, addChoices: [ch('(Hand him the letter.)', on(`He takes it. He opens it. It's the only made thing in the world. He reads it. It's about a crossword. He reads it again. ${say('Cyrus', `He's saved me four hundred and sixty-eight crosswords. They'll be out of date.`)} A pause. ${say('Cyrus', `Nine across won't have changed.`)}`, 'gx-plan-door'))] },
  { id: 'name', when: [flagIs('galactic-x-grandfather')], notice: `You know his grandfather's name.`, addChoices: [ch('(Say his name.)', on(`He looks up as if at a sound from another room.`, 'gx-plan-door'))] },
];
(plan[0] as Json).remembers = [{ id: 'all', when: [flagIs('galactic-told-all')], notice: `The stair below's quiet. The gauntlet isn't holding. He hasn't noticed yet.` }];

// ---------- Ending 2. "Let Go" (Turn on the team; ps_gx_turn) ----------
const CYRUS_TEAM = ['honchkrow', 'weavile', 'gyarados', 'crobat'];
const turn: Json[] = [
  step('gx-turn-slack', 'Phase 1: Slack', `The lines are loose in the sky. He looks at you as if at a reading he can't account for.`, [
    ch('"Eleven minutes."', on(`${say('Cyrus', `The fish. Yes. I see. I should've weighted that.`)}`, 'gx-turn-cyrus'), { requires: [flagIs('galactic-eleven')] }),
    ch('(Say nothing.)', on(`He takes off his gloves.`, 'gx-turn-cyrus')),
  ]),
  step('gx-turn-cyrus', 'Phase 2: Cyrus', `Cold Calculus. At a quarter of his ace's health he'll finish the subtraction on himself: his orders stop, his side uses its strongest move and never switches, and you can read every turn. ${say('Cyrus', `I am finishing it now. On myself. You'll observe I don't hesitate.`)}`, [
    ch('Battle.', fight(`${say('Cyrus, flat, to nobody', `Honchkrow. Night Slash. Honchkrow. Night Slash.`)}`, ps(trainer('Cyrus', { sprite: BOSS, team: CYRUS_TEAM, size: 4, lv: 2, win: [room('gx-turn-tear')] })))),
  ]),
  step('gx-turn-tear', 'Phase 3: The Third Tear', `The last line parts. The two tears don't close. A third opens, under him, black, and something with too many wings looks out. ${say('Cyrus, with the only expression he\'s worn all region; it\'s relief', `Ah. There is somewhere else.`)}`, [
    ch('(Let him step in.)', on(`He steps in. It was always an exit.`, 'gx-turn-after', flag('cyrus-gone'))),
    ch('(Throw the box after him.)', on(`You heave it. Four hundred and sixty-eight letters go into the dark after him, and the lid comes off, and they fall like snow that isn't cold. It's the only post that'll ever be delivered there. He'll have a great deal of time.`, 'gx-turn-after', flag('cyrus-box')), { requires: [flagIs('galactic-box')] }),
    ch('(Hold out the letter.)', on(`He's half in. He looks at it. He takes it. He steps in holding it.`, 'gx-turn-after', flag('cyrus-letter')), { requires: [flagIs('galactic-letter')] }),
    ch('"Cyrus. Supper."', on(`He stops. One foot in the dark. ${say('Cyrus', `...Where did you read that.`)} "Your card." ${say('Cyrus', `I wrote that to test the form.`)} "You wrote what you'd like to stop. You wrote 'supper.'" ${say('Cyrus', `Being called down to it. Yes. I—`)} A long time. ${say('Cyrus', `I'd like it to stop. I'd not said I'd like there to be no supper. I see that's a distinction.`)} He doesn't step in. He sits down on the edge of it. Cynthia arrives, late, out of breath, and takes in the scene. ${say('Cynthia', `Oh, good. I was going to have to go in after you. I'd much rather make tea.`)}`, 'gx-turn-after', flag('cyrus-supper')), { requires: [flagIs('galactic-card-his')] }),
  ], { pokemon: 'giratina' }),
  step('gx-turn-after', 'Afterwards', `The mountain, emptying.`, [
    ch('Walk down.', out(`Galactic dissolves into the Veilstone Institute. Lior runs it. The charter's one line again. Greer does birthdays. ${EPILOGUE.turn}`, story({ beat: true }), story({ end: 'defeated' }), flag('galactic-ending-turn')),
      { branches: [{ when: [flagIs('galactic-grandfather-kept'), flagIs('cyrus-supper')], text: `At the foot of the mountain: an old man with a folded newspaper. Nobody says anything. He holds it out. It's open at the crossword. Cyrus takes the pencil. Galactic dissolves into the Veilstone Institute. Lior runs it. The charter's one line again. Greer does birthdays. ${EPILOGUE.turn}`, effects: [story({ beat: true }), story({ end: 'defeated' }), flag('galactic-ending-turn')] }] }),
  ], { cast: [] }),
];
// What the run's done changes the fight (FULL_2 C, Phase 2).
(turn[1] as Json).remembers = [
  { id: 'saturn', when: [flagIs('saturn-heard')], notice: `Saturn's voice, by radio, from the basement: "It's done. I logged it under my own name." He's opened the tanks himself. Each free guardian slackens a line.` },
  { id: 'three', when: [flagIs('galactic-told-three')], notice: `Greer and Lior are on the stair, holding off Mars and Jupiter. ${say('Greer', `I'm not angry at you, Commander. I'm just in the way.`)}` },
  { id: 'mars', when: [flagIs('mars-named')], notice: `Mars comes up at the end. She doesn't fight you. She goes to him.` },
];

(turn[0] as Json).remembers = [
  { id: 'all', when: [flagIs('galactic-told-all')], notice: `There's nobody on the stair to hold off.` },
  { id: 'name', when: [flagIs('galactic-x-grandfather')], notice: `You say his grandfather's name. His ace's first move will be a turn late.` },
];

// ---------- Ending 3. "The Licence" (Side with Charon; ps_gx_charon) ----------
const charon: Json[] = [
  step('gx-charon-meeting', 'Phase 1: The Extraordinary General Meeting', `The man on the ridge comes down. Lab coat. Clipboard. Behind him: eleven people in good overcoats, very cold, very cross, and a twelfth in a wool hat who's brought a flask. ${say('Charon', `Cyrus, old thing. Don't let go on my account. I've convened the board. It's quorate. We'd no venue; I said, well, he's up there.`)} ${say('Cyrus', `This is not a meeting room.`)} ${say('Charon', `Clause nine. "Any place the shareholders are assembled." You drafted it.`)} ${say('Charon', `Motion: that the Chief Executive, having committed the company's entire capital to a project with no revenue on the far side, be relieved. All in favour.`)} Eleven gloved hands. ${say('Charon', `Against.`)} One. In a mitten. ${say('Mrs. Holmgren', `I always vote against. I'm not starting to agree with people at my age.`)} Cyrus has been removed by the firm he rewrote, eleven to one. It's the same vote that passed his charter. ${say('Cyrus', `You can't outvote a law of nature.`)} ${say('Charon', `No. But I can outvote you, and you were the only one who wanted to use it. Ceres has kindly brought me the forge drawings. I'll not unmake anything. I'll license.`)}`, [
    ch('Stand beside Charon.', on(`He holds out a hand to the Rotom on his shoulder.`, 'gx-charon-repo')),
  ], { cast: [CHARON, HOLMGREN] }),
  step('gx-charon-repo', 'Phase 2: Repossession', `A double: you and Charon against Cyrus. Charon's Rotom, the Poltergeist Engine, changes form each turn. It doesn't want to be there. ${say('Cyrus, mid-battle, to you', `You've sold it. I'd have understood stopping me. I don't understand this.`)}`, [
    ch('Battle.', fight(`He loses, in the end. The lines are taken off his arm by a man from Legal.`, ps(trainer('Cyrus', { sprite: BOSS, team: CYRUS_TEAM, size: 4, lv: 2, format: 'doubles', ally: 'rotom', win: [room('gx-charon-bought')] })))),
  ], { cast: [BOSS, CHARON], pokemon: 'rotom' }),
  step('gx-charon-bought', `Phase 3: What's Been Bought`, `${say('Charon', `Now. Lake Acuity: memory. There's a market. Exam season alone. Lake Verity: I'll bottle calm; the clinics already have the storefronts. Lake Valor: will. D'you know what a gym'd pay?`)} ${say('Mrs. Holmgren, to you, screwing the top on her flask', `I've asked one question at that meeting for four years. "Are the lights on?" I'll have to think of a new one. You can think what it should be.`)} The Honest Trade Card, at the Pillar: you're paid ₽60,000 and a seat on the board. The three guardians stay in tanks. Sinnoh keeps its feelings and rents them back. This can't be undone this run.`, [
    ch('Confirm.', on(`The card asks again. It means it.`, 'gx-charon-confirm')),
    ch('Not this.', on(`You hand the card back. Charon shrugs: the motion's carried either way; it's only whether you profit. The lines go to Legal. Cyrus goes down the mountain with a box.`, 'gx-charon-unpaid')),
  ], { cast: [CHARON, HOLMGREN] }),
  step('gx-charon-confirm', 'The Licence', `Confirm a second time: ₽60,000 and a board seat; the three in tanks; Sinnoh's feelings licensed. It can't be undone this run.`, [
    ch('Confirm again.', out(`It's worse, and it's legal. Memory, feeling and will each cost ₽500 a stage to switch back on, at any clinic. Cyrus isn't arrested. There's no charge. He's given a severance and a box to put his desk in. He's already got a box. ${EPILOGUE.charon}`, $(60000), story({ beat: true }), story({ end: 'exposed' }), flag('galactic-ending-charon'), flag('sinnoh-licensed'), flag('board-seat'))),
    ch('No.', on(`You put the pen down.`, 'gx-charon-unpaid')),
  ], { cast: [CHARON] }),
  step('gx-charon-unpaid', 'The Licence', `The lakes are Charon's now, with or without your signature.`, [
    ch('Walk down.', out(`It's worse, and it's legal, and you weren't paid for it. ${EPILOGUE.charon}`, story({ beat: true }), story({ end: 'exposed' }), flag('galactic-ending-charon'), flag('sinnoh-licensed'))),
  ], { cast: [CHARON] }),
];

// ---------- Ending 4. "Mind This One" (Take it all; ps_gx_own) ----------
const decision = (id: string, name: string, text: string, next: string, opts: [string, string, string][], cast: string[] = [SATURN]): Json =>
  step(id, name, text, opts.map(([label, k, words]) => ch(label, on(words, next, flag(k)))), { cast, effect: 'none' });
const own: Json[] = [
  step('gx-own-mars', 'Phase 2: Mars', `He doesn't fight. She does. ${say('Mars, coming up the last step, Purugly ahead of her', `No. No. He doesn't get to put it down. I've carried it for four years. He hasn't said my name once and I've carried it, and you don't get to just— take the bags.`)}`, [
    ch('Battle.', fight(`Fierce Loyalty, twice.`, ps(trainer('Commander Mars', { sprite: MARS, team: ['purugly', 'crobat', 'houndoom', 'skuntank', 'honchkrow'], size: 5, lv: 2, win: [room('gx-own-mars-down')] })))),
  ], { cast: [MARS], pokemon: 'purugly' }),
  step('gx-own-mars-down', 'Phase 2: Mars', `${say('Mars, beaten, in the snow', `...He's not even looking.`)}`, [
    ch('(Say her name.)', on(`She looks up. It's the first time it's been said on this mountain. ${say('Mars', `...Yes. That's— yes. Present.`)}`, 'gx-own-lines', flag('galactic-mars-stays')), { requires: [flagIs('mars-named')] }),
    ch('(Leave her be.)', on(`She doesn't get up.`, 'gx-own-lines')),
  ], { cast: [MARS] }),
  step('gx-own-lines', 'Phase 3: The Four Lines', `You're holding two dragons. That's what this is, plainly. What do you do with them?`, [
    ch('Let all four go.', on(`They leave. The tears close. The team's yours; the gods aren't. It's the clean start. Cyrus walks down the mountain. Nobody stops him. He's got his hands in his pockets. He's never had them free before.`, 'gx-own-d1', flag('chain-released'))),
    ch('Keep the lines.', on(`The Red Chain, in your hands. ${say('Cynthia, quietly', `Then I'll be seeing you again. I'd hoped I wouldn't mean it like that.`)} Cyrus walks down the mountain. Nobody stops him. He's got his hands in his pockets. He's never had them free before.`, 'gx-own-d1', flag('chain-kept'))),
  ], { pokemon: 'dialga' }),
  decision('gx-own-d1', 'The First Hour: The Observations', `Five hundred people on a stair, looking up. Four decisions, each one line, said aloud. First: the Observations.`, 'gx-own-d2', [
    ['Keep the three.', 'galactic-creed-kept', `The Observations stay as written.`],
    ['Strike the first. ("Ask.")', 'galactic-creed-ask', `Observation one is struck through. In its place, one word: ASK.`],
    ['Replace all three with one of your own.', 'galactic-creed-own', `You say it. Saturn writes it down, exactly.`],
  ]),
  decision('gx-own-d2', 'The First Hour: The Cards', `The cards. Five hundred and six of them, in a locked cabinet.`, 'gx-own-d3', [
    ['Keep the cabinet locked.', 'galactic-cards-kept', `The key goes on your ring.`],
    ['Hand each card back to whoever wrote it.', 'galactic-cards-returned', `Five hundred and six people are handed back one line each. Every one of them has a thing they want stopped, and now somebody knows it.`],
    ['Burn them.', 'galactic-cards-burned', `They burn quickly. Nobody watches.`],
  ]),
  decision('gx-own-d3', 'The First Hour: The Charter', `The charter. One line.`, 'gx-own-d4', [
    ['"To complete the world."', 'galactic-charter-complete', `It stays as he wrote it.`],
    ['"To keep the lights on."', 'galactic-charter-lights', `Somewhere below, Mrs. Holmgren unscrews her flask.`],
    ['Your own line.', 'galactic-charter-own', `You say it. Saturn writes it.`],
  ]),
  decision('gx-own-d4', 'The First Hour: The Three in the Tanks', `The three in the tanks.`, 'gx-own-title', [
    ['Free them.', 'galactic-three-freed', `Sinnoh's rules lift. The basement's cold by morning.`],
    ['Hold them.', 'galactic-three-held', `They stay in the warm room. Charon's pleased. Nobody else is.`],
  ]),
  step('gx-own-title', 'The First Hour', `${say('Saturn, with a fresh clipboard', `I'll need a title for you. For the log.`)}`, [
    ch('"Boss."', out(`${say('Saturn', `Noted.`)} Team Galactic's yours. ${EPILOGUE.own}`, story({ beat: true }), story({ end: 'allied' }), flag('galactic-ending-own'), flag('evil-start-galactic'))),
    ch('"Chair."', out(`${say('Saturn', `Noted.`)} Somewhere below, Mrs. Holmgren votes against. Team Galactic's yours. ${EPILOGUE.own}`, story({ beat: true }), story({ end: 'allied' }), flag('galactic-ending-own'), flag('evil-start-galactic'))),
    ch(`"Ceres'll do."`, out(`${say('Saturn', `Provisional.`)} He almost smiles. It costs him nothing. He's surprised. ${say('Saturn', `Noted.`)} Team Galactic's yours. ${EPILOGUE.own}`, story({ beat: true }), story({ end: 'allied' }), flag('galactic-ending-own'), flag('evil-start-galactic'))),
  ], { cast: [SATURN], effect: 'none' }),
];

// ---------- Team Lantern: the third option (FULL_2 F) ----------
const LANTERN = { cast: [PADRAIG], tint: '#3a2e1a', effect: 'sparkle' };
/** The waiting: the only mechanic in the game won by not touching it (a hold-steady prompt). */
const WAIT = prompt(STEALTH);
const lantern: Json[] = [
  ev('lantern-founding', 'Team Lantern', 'Evil Teams', { callback: true, requires: [...gx({ after: 4, ends: ['none'], inside: false }), flagIs('galactic-offer-refused'), flagIs('galactic-charon-refused'), flagIs('galactic-fish')], ...LANTERN },
    `A boathouse at Lake Valor. A paraffin lamp in the window, in daylight. ${say('Old Padraig Lachlan', `It's you. Fish-first. Come in. I've company; mind your head.`)} Thirty people on upturned boats, in silver suits with the G picked off. Helmets in a heap by the door. Half of them without the hair they came with. ${say('Padraig', `They came down the valley three nights ago. Walked. I said: are you lost? This one said—`)} ${say('A former Grunt', `I said, "Nobody's asked us that."`)} ${say('Padraig', `So I asked the next one. And the next. Took till morning. I've not had a night like it since the wife.`)} ${say('Padraig', `He wants no spirit in the world, your man on the mountain. I say there's too little. Let's go round and put some in.`)} The creed, chalked on a boat: SOMEBODY SHOULD ASK. He hands you the lamp. ${say('Padraig', `You knock. You say: "How are you?" Then— this is the hard part, I'll not pretend it isn't— you wait. However long. You don't fill it. That's the whole trade.`)}`,
    [
      ch('Take the lamp.', out(`It's warm. Team Lantern has a roll of thirty-one: the Thirty, who know every door in the Veilstone building and who's behind each; Padraig, with the lamp and sixty years of waiting for a bite; and you. Mrs. Holmgren sends word she'll lend her one share and a flask.`, mark('third'), flag('lantern-founded'), flag('lantern-roll', 30))),
      ch('"Who else?"', out(`${say('Padraig', `The Thirty. Mrs. Holmgren's share, and her flask. A band of sixty-year-olds, if you can find them. The young cadet with the tune, if she's doubting. A girl with a Buneary, who has a sock she says is a flag. The old man in Sunyshore won't join; he'll lend his bench. And Volkner, if somebody turns him: "I can light a mountain. Ask me something hard."`)} He hands you the lamp anyway.`, mark('third'), flag('lantern-founded'), flag('lantern-roll', 30))),
    ]),
  // Round 1: The Families (a door of three; stage 6).
  ev('lantern-round-1', 'Round 1: The Families', 'Evil Teams', { requires: [...gx({ after: 5, has: 'third' }), flagIs('lantern-round1', 0, 0)], ...LANTERN },
    `Three hundred and forty of the Grunts have someone, somewhere. The Thirty know the addresses. A Round's a door-knocking. At each door: you ask, and then you wait.`,
    [ch('Knock on the first door.', out(`A terraced house. A light in the back.`, room('lantern-door-1')))]),
  ev('lantern-door-1', 'Door 1', 'Evil Teams', { room: true, ...LANTERN, cast: [HOLMGREN] },
    `A mother. Her son joined a year ago. ${say('The mother', `He writes. "All is in order." Every month. The same five words.`)} You ask her how she is.`,
    [ch('(Wait.)', out(`${say('The mother', `...I'm not all right. I've been saying I am to the neighbours for a year.`)} She comes.`, flag('lantern-roll', 30), room('lantern-door-2')), { prompt: WAIT, fail: out(`You fill the quiet. She says she's fine. She shuts the door gently.`, room('lantern-door-2')) })]),
  ev('lantern-door-2', 'Door 2', 'Evil Teams', { room: true, ...LANTERN, cast: ['boss.npc_gentleman'] },
    `A husband. ${say('The husband', `She said she needed quiet. I said I'd be quiet. She said: not your quiet.`)} You ask him how he is.`,
    [ch('(Wait.)', out(`${say('The husband', `I talk too much. I know. I'm doing it now.`)} He stops. He waits, too. He comes.`, flag('lantern-roll', 30), room('lantern-door-3')), { prompt: WAIT, fail: out(`You say something to help. He thanks you, and goes on talking, and doesn't come.`, room('lantern-door-3')) })]),
  ev('lantern-door-3', 'Door 3', 'Evil Teams', { room: true, ...LANTERN, cast: ['boss.npc_lass'] },
    `A girl of nine, and a grandmother behind her. ${say('The girl', `Is this about Una's sister?`)} It's Greer's house.`,
    [ch('(Wait.)', out(`${say('The grandmother', `We've a place laid. We've had a place laid for a year.`)} They come. They bring the plate. Lantern's roll is a hundred and twenty.`, flag('lantern-roll', 30), flag('lantern-round1'), ...kind(1)))]),
  // Round 2: The Queue (a door of three; stage 7, a clinic).
  ev('lantern-round-2', 'Round 2: The Queue', 'Evil Teams', { requires: [...gx({ after: 5, has: 'third' }), flagIs('lantern-round1'), flagIs('lantern-round2', 0, 0)], ...LANTERN, pokemon: 'chansey' },
    `Outside a Galactic Wellness storefront: a queue of people with Pokémon that look at nothing. ${say('Orderly Vance, in the doorway, soothing', `You're upsetting the patients.`)} ${say('Padraig', `We've not said a word to them. We're only asking you, son. How are you?`)} ${say('Vance', `I'm well. Stress responses are down ninety per cent.`)}`,
    [ch('(Wait.) The longest wait in the game.', out(`${say('Vance', `...I had a Chansey that sang. Before the trial. I volunteered her. She's very calm now.`)} A pause. ${say('Vance', `I've been telling people that's a wonderful result.`)} He hands over the keys. He doesn't fight. The clinics become Lantern Rooms: rests that heal in full, where one Pokémon's bond goes up a step. The roll's two hundred and twenty.`, flag('lantern-roll', 100), flag('lantern-round2'), flag('lantern-rooms')), { prompt: WAIT, fail: out(`You can't wait it out. He squares up.`, room('lantern-queue-fight')) })]),
  ev('lantern-queue-fight', 'Round 2: The Queue', 'Evil Teams', { room: true, ...LANTERN, cast: [GRUNT] }, `${say('Orderly Vance', `Then I'll have to ask you to leave.`)}`,
    [ch('Battle.', fight(`He fights calmly, as if from a script.`, trainer('Orderly Vance', { team: ['chansey', 'bronzor', 'chingling'], size: 3, lv: 1, win: [flag('lantern-roll', 100), flag('lantern-round2'), flag('lantern-rooms')] })))]),
  // Round 3: The Lights (stage 7, a + node at Night, the Windworks).
  ev('lantern-round-3', 'Round 3: The Lights', 'Evil Teams', { requires: [...gx({ after: 5, has: 'third' }), flagIs('lantern-round2'), flagIs('lantern-round3', 0, 0), night], ...LANTERN, cast: ['boss.npc_engineer', HOLMGREN] },
    `The Windworks, at night. The old line crews: a dozen men and women in their sixties, in boiler suits with a G that means Grid. ${say('A lineman', `Sixty years we've had one job. He never changed that part; he just changed what it was for.`)} ${say('Mrs. Holmgren', `Then let's do the job. There's a stair up that mountain with no lamps on it. I don't know about the world. I know about that.`)} They'll run cable up Mt. Coronet in a night: three ridges, one drum of wire.`,
    [ch('Route the cable.', out(`By dawn there's a string of bulbs from the valley to the cloud. The roll's three hundred. The Ascent's lit: no whiteout, no accuracy loss, at the climax.`, flag('lantern-roll', 80), flag('lantern-round3'), flag('lantern-ascent-lit')), { prompt: prompt('aim-drag'), fail: out(`One ridge is wired wrong, and has to be done twice. By dawn it's lit anyway. The roll's three hundred.`, flag('lantern-roll', 80), flag('lantern-round3'), flag('lantern-ascent-lit')) })]),
  // F4. The climax: Three Hundred Lanterns (replaces the Final Choice and the outside climax).
  ev('lantern-climax', 'Three Hundred Lanterns', 'Evil Teams', { callback: true, requires: [...gx({ beat: 6, has: 'third', inside: false })], ...LANTERN, effect: 'snow' },
    `The foot of the stair, at dusk. A string of bulbs going up into the cloud. Three hundred people, each with a lamp. A band, tuning. It's dreadful. It's sixty. There's no gauntlet. At each landing there's a Galactic post. At each post, somebody from the roll steps out of the line.`,
    [ch('Climb.', out(`At the foot, two Grunts. A mother steps out of the line. "All is in order, is it? Come here."`, room('lantern-ridge')))]),
  ev('lantern-ridge', 'The Ridge', 'Evil Teams', { room: true, ...LANTERN, cast: [SCI], effect: 'snow' },
    `The ridge: researchers. A lineman steps out of the line. ${say('The lineman', `I'll show you my maths if you'll show me yours.`)} They put their clipboards down.`,
    [ch('Climb.', out(`Higher. The snow comes sideways.`, room('lantern-saddle')))]),
  ev('lantern-saddle', 'The Saddle', 'Evil Teams', { room: true, ...LANTERN, cast: [MARS], pokemon: 'purugly', effect: 'snow' },
    `The saddle: Mars. Nobody she knows steps out. That's the scene. Three hundred people, and not one's come for her.`,
    [
      ch(`"What's your name?"`, out(`She tells you. It's not Mars. Somebody puts a lamp in her hand. She's on the roll.`, flag('lantern-mars-asked'), room('lantern-col'))),
      ch('Battle her.', fight(`She doesn't want to be asked. Or she does, and nobody has.`, trainer('Commander Mars', { sprite: MARS, team: ['purugly', 'crobat', 'houndoom', 'skuntank', 'honchkrow'], size: 5, lv: 1, win: [room('lantern-col')] }))),
    ]),
  ev('lantern-col', 'The Col', 'Evil Teams', { room: true, ...LANTERN, cast: ['boss.npc_beauty'], effect: 'snow' },
    `The col: Jupiter. The Garage Band steps out of the line. ${say('Jupiter', `Oh, for—`)} She listens to eight bars. ${say('Jupiter', `That's the worst thing I've ever heard. I'm off. I'm taking the hat.`)}`,
    [ch('Climb.', out(`The band plays on, uphill.`, room('lantern-summit')))]),
  ev('lantern-summit', 'The Summit Stair', 'Evil Teams', { room: true, ...LANTERN, cast: [SATURN, PADRAIG], effect: 'snow' },
    `The summit stair: Saturn. Padraig steps out of the line. ${say('Padraig', `Mind the spines, son.`)} Saturn steps aside. He takes a lamp. He's not sure how to hold it.`,
    [ch('Climb.', out(`The dais.`, room('lantern-dais')))]),
  ev('lantern-dais', 'The Dais', 'Evil Teams', { room: true, ...LANTERN, cast: [BOSS, SATURN], effect: 'snow' },
    `Cyrus, the four lines on his arm. He hears it before he sees it: a brass band, in a blizzard, playing a company march he abolished. He looks down. A line of light, all the way to the valley. It's the only time anyone's seen the whole of Mt. Coronet lit. ${say('Cyrus', `...What is that.`)} ${say('Saturn, behind him, holding a lamp wrong', `Three hundred people, sir. I counted. They've come up.`)} ${say('Cyrus', `To stop me.`)} ${say('Saturn', `No, sir. I asked. They've come to see you. They've a question.`)} Nobody's ever come for him before.`,
    [ch('Let the question be asked.', out(`The youngest goes first, because nobody else will.`, room('lantern-question')))]),
  ev('lantern-question', 'The Question', 'Evil Teams', { room: true, ...LANTERN, cast: [BOSS, HOLMGREN], effect: 'snow' },
    `${say('Cadet Io, at the front', `Mr. Cyrus. How are you?`)} ${say('Cyrus', `That question costs four minutes.`)} ${say('Padraig', `We've four minutes.`)} They wait. Three hundred people, in snow. You're holding a lamp, and can't press anything. The band stops. The wind doesn't. One of the shapes in the sky has turned its head to listen.`,
    [ch('(Wait.)', out(`${say('Cyrus, at the end of it', `...Tired.`)} ${say('Cyrus', `I can't verify that. It's the word that was there.`)} ${say('Mrs. Holmgren', `Well, of course you are. You've been holding that up on your own. Put it down, dear. Are the lights on?`)} He looks down the mountain. ${say('Cyrus', `...Yes.`)} ${say('Mrs. Holmgren', `Then that's the job done. Sit.`)} He lets go of the lines. Not because he's beaten. Because his arm's tired, and somebody's noticed. Team Lantern doesn't disband: on any night in Sinnoh, a lamp in a window is a free rest. Cyrus lives two streets from a breakwater. He does the crossword in pencil. He doesn't come down for supper every night. Some. ${EPILOGUE.lantern}`,
      story({ beat: true }), story({ end: 'defeated' }), flag('galactic-ending-lantern'), flag('cyrus-asked'), ...kind(2)),
    { prompt: WAIT, fail: out(`You press. ${say('Cyrus', `As I calculated.`)} He turns to fight.`, room('lantern-cold')),
      branches: [{ when: [flagIs('galactic-box')], text: `The box is passed up the line, hand to hand, three hundred hands. It arrives with snow on it. ${say('Cyrus, at the end of the wait', `...Tired.`)} ${say('Mrs. Holmgren', `Well, of course you are. Put it down, dear. Are the lights on?`)} ${say('Cyrus', `...Yes.`)} ${say('Mrs. Holmgren', `Then that's the job done. Sit.`)} He lets go of the lines. Because his arm's tired, and somebody's noticed. Team Lantern doesn't disband: on any night in Sinnoh, a lamp in a window is a free rest. ${EPILOGUE.lantern}`, effects: [story({ beat: true }), story({ end: 'defeated' }), flag('galactic-ending-lantern'), flag('cyrus-asked'), ...kind(2)] }] })]),
  ev('lantern-cold', 'Three Hundred Lanterns', 'Evil Teams', { room: true, ...LANTERN, cast: [BOSS], effect: 'snow' }, `The base fight, a little colder.`,
    [ch('Battle.', fight(`Three hundred lamps light the snow you fight in.`, trainer('Cyrus', { sprite: BOSS, team: CYRUS_TEAM, size: 4, lv: 1, win: [story({ beat: true }), story({ end: 'defeated' }), flag('galactic-ending-lantern')], lose: [story({ beat: true }), story({ end: 'defeated' }), flag('galactic-ending-lantern')] }),
      { kind: 'flag', key: 'lantern-cold', amount: 1 }))]),
];
// Lantern's ending is the same if the fight comes, but colder.
(lantern[lantern.length - 1] as Json).remembers = [{ id: 'cold', when: [flagIs('lantern-mars-asked')], notice: `Mars is on the roll now. She holds her lamp up so you can see.` }];

export const EVENTS: Json[] = [finalChoice, ...plan, ...turn, ...charon, ...own, ...lantern];
export const REMOVE: string[] = [];
