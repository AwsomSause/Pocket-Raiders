// Catalog Overhaul Pack, Evil Teams Volume III: Kanto, Team Rocket from inside, the end (TEAM_ROCKET_KANTO_FULL_2). The
// Final Choice on the eleventh floor of Silph Co., the four endings as chain pseudo-stages (ps_rk_plan, ps_rk_turn,
// ps_rk_police, ps_rk_own: written by _evil-story-sync.ts), Team Ledger (the third option: founding, three audits and
// The Read-Out) and everyone's epilogue line. "Take it all" ends the team story here: Evil Mode is on hold (Kice).
import { ch, ev, fight, flag, flagIs, inRegion, item, out, room, trainer, type Json } from '../dsl.ts';
import { evil as story, foe, kind, rivalTrust } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-story';

const R = teamJson('rocket');
const GRUNT = R.ranks.grunt.sprite;
const EXEC = R.ranks.executive.sprite;
const BOSS = R.ranks.leader.sprite;
const TINT = R.color;
const SILPH = '#1e2230';
const K = inRegion('kanto');
const say = (who: string, line: string): string => `${who}: "${line}"`;
const rk = (o: Json = {}): Json[] => [{ kind: 'evil', team: 'rocket', ...o }, K];
const mark = (m: string): Json => story({ mark: m });
const madame = flagIs('rocket-madame-line');
/** A fight inside an ending's own map: a loss walks the player back out, and the run goes on. */
const ps = (b: Json): Json => ({ ...b, pseudo: true });
/** A room in an ending: one step on that ending's own map. */
const step = (id: string, name: string, intro: string, choices: Json[], o: { cast?: string[]; pokemon?: string; tint?: string; effect?: string } = {}): Json =>
  ev(id, name, 'Evil Teams', { room: true, cast: o.cast ?? [GRUNT], tint: o.tint ?? SILPH, effect: o.effect ?? 'none', ...(o.pokemon ? { pokemon: o.pokemon } : {}) }, intro, choices);
const on = (text: string, next: string, ...fx: Json[]): Json => out(text, ...fx, room(next));

// The epilogues (FULL_2 "Everyone, by ending"): one line each, said as the ending closes.
const EPILOGUE: Record<'plan' | 'turn' | 'police' | 'own' | 'audit', string> = {
  plan: `Otis has a desk, and he's good at it. Faye moves one name a week to "Returned." Matori still takes no day's leave. Domino is promoted. Butch's twelfth commendation says "Buck." Cassidy skims the new company. Dr. Sotheby says nothing about the switch. Jardine drives. Madame, on the telephone: "He'll be unbearable."`,
  turn: `Otis trains as a dental nurse: "Open wide. I know. I know." Faye's lists are on every Center's glass. Remy says, "It's the butler." Matori takes a day's leave, doesn't know what to do with it, and comes back at noon. Domino goes out by a window. Butch: "It's Butch." Dr. Sotheby presses the switch, and Rudd opens every cage he's ever counted. Jardine drives the other way and doesn't ask. Madame: "He'll sulk for a year. Do drop in." Giovanni is gone; the Persian's bowl is full.`,
  police: `Otis is suspended for six months. Faye gives nine hours of testimony and doesn't miss a figure. Remy gets an apology, at length, from a man in a brown coat. Matori tells them nothing and is released for want of a file. Domino goes out by a window. Butch is arrested as "Hutch," appeals on that ground, and wins. Vesper hands Looker the second book; it's the best evidence in the case. Giovanni is gone, with the Persian, and a note about the tea.`,
  own: `Otis is your first Lead, and he knows what's in the crates, because you told him. Faye has the Counting Room and audits you on Fridays. Remy takes the top bunk back. Matori is yours now: "What are you running from?" Domino is contracted, which she says is better than loyal. Butch photographs his name on a door, spelled right. Somewhere, a man with a Persian will send one letter in a year.`,
  audit: `Otis carries, and only good things now. The book is Faye's. Remy gets eleven weeks' back pay and the apology. Matori reads her own entry and laughs, once. Domino is entered as "Expensive." Butch's name is right in the book. Cassidy's balance is nil. The trio are owed nine years and receive it with interest; James cries. Miss Vickery keeps the flag.`,
};

// ---------- The Final Choice ----------
const finalChoice = ev('rk-final-choice', 'The Final Choice', 'Evil Teams', { room: true, cast: [GRUNT, GRUNT], tint: SILPH, effect: 'glint' },
  `Dawn. The eleventh floor: a corridor of grey carpet, and at the end of it a door with a brass plate, PRESIDENT. Otis is behind you with his sleeves rolled; Faye has a ledger under her arm that isn't the one she usually carries. In your hand is a key card: ELEVENTH FLOOR. ALL DOORS. Behind the brass plate, unhurried: ${say('Giovanni', `It's open. It's been open for an hour. I was curious whether you'd knock.`)} On the fire stairs, one flight down, a man in a brown coat has stopped tying his shoe. ${say('Looker', `I am not here. I am a man with a shoe.`)} Faye holds out the other ledger. ${say('Faye', `Four thousand, one hundred and twelve. Names and addresses. I copied it out by hand; it took a year of lunches. I don't know who to give it to. I've decided that's your job.`)} You hold two things now: a key and a list. The Final Choice is who gets which.`,
  [
    ch('"Open the door for him."', on(`You open the door. He's at the desk, and he nods to you as if you'd brought the post. The list goes back into Faye's bag.`, 'rk-plan-hold', flag('rocket-final-plan'))),
    ch('"Lock it. With him inside."', on(`You close the brass-plated door, from the outside, and turn the key. A pause, from inside. ${say('Giovanni', `Ah. You're one of the looking kind after all. Matori did say "doesn't know yet."`)} A chair creaks. ${say('Giovanni', `I'll wait. It's a good door. I chose it.`)} ${say('Otis', `What do we do?`)} ${say('Faye', `We go down. Floor by floor. And I read the book out at each one.`)}`, 'rk-turn-11', flag('rocket-final-turn'))),
    ch('"Looker. Catch."', on(`You throw the key card down the stairwell. A hand comes out of a brown coat and catches it. ${say('Looker', `I asked for evidence. You have brought me a building.`)} He's already on a radio. "All units. Eleventh floor. We have the door, the list, and a person in a uniform who is, I am told, looking."`, 'rk-police-cordon', flag('rocket-final-police')), { requires: [flagIs('rocket-looker-met')] }),
    ch(`"It's a good plan. It doesn't need you."`, on(`You open the door, go in, and shut it behind you. He doesn't turn round from the window. ${say('Giovanni', `...No. It doesn't. That's how I knew it was good.`)} Now he turns. ${say('Giovanni', `I've been waiting eleven years for somebody downstairs to say that. I'd rather hoped it would be my son.`)}`, 'rk-own-duel', flag('rocket-final-own')), { requires: [{ kind: 'evil', rank: 5, has: 'confided' }] }),
  ]);
(finalChoice as Json).remembers = [
  { id: 'looking', when: [flagIs('rocket-matori-looking')], notice: `Matori is at the lift as you pass, tablet under her arm. "Did you find it?" she asks, and doesn't wait for the answer.` },
  { id: 'bench', when: [flagIs('matori-bench')], notice: `${say('Matori', `You sat with me on a bench. I've moved his one o'clock. I'd have moved it anyway. I'd like you to think I moved it for that.`)}` },
];

// ---------- Ending 1. Carry it out: "Under New Management" (ps_rk_plan) ----------
const PLAN_END = (extra = ''): Json => out(`${say('Giovanni', `You held. I don't need loyalty. I need people who finish the job. Executive. Your first task: do not let me down.`)}${extra} Kanto is under new management. Every Poké Ball sold here pays a tenth to a company nobody's heard of. Prices are stable; shops are open; people have stopped saying the word. Shops charge you less, and call you "sir" or "ma'am." The rival won't meet your eye for a region. ${EPILOGUE.plan}`,
  story({ beat: true }), story({ end: 'allied', mods: [{ kind: 'priceMultiplier', group: 'all', value: 0.85 }], modsText: 'Every Kanto shop charges you 15% less for the rest of the region.' }), flag('rocket-ending-plan'), flag('kanto-occupied'));
const plan: Json[] = [
  step('rk-plan-hold', 'Phase 1: Hold the Line', `The Saffron police and Gym trainers with warrants contest the lobby, the labs and the stairs. You place the squad.`, [
    ch('Otis in the lobby, Faye in the labs, you on the stairs.', fight(`In the lobby Otis doesn't fight well; he talks. "Mind the plant, that's the President's." Two officers stop to mind the plant. In the labs, Faye has locked the specimen cabinets and lost the key in her cardigan. The stairs are yours.`, ps(trainer('Saffron Police', { size: 3, lv: 1, chain: 2, win: [room('rk-plan-gate')] })))),
    ch('Keep the squad with you on the stairs.', fight(`The three of you hold the stairs, and the lobby and the labs come up to meet you.`, ps(trainer('Saffron Police', { size: 3, lv: 1, chain: 3, win: [room('rk-plan-gate')] })))),
  ]),
  step('rk-plan-gate', 'Phase 2: The Gate Locks', `The last lock is in your hands. Seat it, and the building is sealed.`, [
    ch('Seat the last lock.', on(`Over the PA: ${say('Giovanni', `Building sealed. Please remain where you are. ...House Card: the eighth-floor pantry has a secretary in it who's been here nineteen years. Leave her. She makes the tea.`)}`, 'rk-plan-rival')),
  ]),
  step('rk-plan-rival', 'Phase 3: The Rival', `Your rival comes through the freight lift, and stops dead. "You're in it. You're wearing it. Tell me there's a reason. I'll believe nearly anything."`, [
    ch(`"There's a reason."`, fight(`"Then show me."`, ps(trainer('Your rival', { rival: true, size: 6, lv: 1, win: [room('rk-plan-defender')] })), rivalTrust(-2))),
    ch('"Go home."', fight(`"Not without you."`, ps(trainer('Your rival', { rival: true, size: 6, lv: 1, win: [room('rk-plan-defender')] })), rivalTrust(-3))),
    ch(`"Sixth floor. The Rig Room. There's a switch under the housing, on the left."`, on(`No battle. Your rival looks at you for one long second, and goes. Somewhere below, every Rig in the building goes quiet. Giovanni never learns who.`, 'rk-plan-defender', rivalTrust(2), flag('rocket-rival-sabotage'))),
  ], { cast: [] }),
  step('rk-plan-defender', 'Phase 4: The Defender', `The city's Gym Leader leads the police up the last stair. ${say('Sabrina', `This city isn't yours. Give it back.`)}`, [
    ch('Battle.', fight(`She doesn't raise her voice.`, ps(trainer('Sabrina', { boss: 'sabrina', size: 6, lv: 2, win: [room('rk-plan-roof')] })))),
  ], { cast: [] }),
  step('rk-plan-roof', 'Phase 5: The Roof', `Rain. The armour, kneeling, cabled. Ein, under an umbrella, writing. Police helicopters are coming in over Saffron. ${say('M2, a voice with no mouth', `You. You're on the wrong side of the glass. I can tell. You keep looking at the cables.`)} ${say('Giovanni', `Hold ten turns. Then it's done, and nobody need ever switch it on.`)}`, [
    ch('Defend the generator.', on(`Ten turns. You hold. At the tenth: ${say('Giovanni', `There. Orderly. You see? Nobody shouting.`)} The Master Ball's on a cushion. He doesn't pick it up. He looks at it the way he looked at the photograph.`, 'rk-plan-verdict')),
    ch('Do nothing, and let them see you do it.', on(`You stand in the rain with your hands at your sides. The game doesn't punish it. M2 notices. ${say('M2', `...Ah. One of you has a conscience and a uniform. I've met the uniform. I'd like to meet the other.`)} The tenth turn comes anyway. ${say('Giovanni', `There. Orderly.`)}`, 'rk-plan-verdict', flag('m2-noticed'))),
  ], { cast: [BOSS], tint: '#141a24', effect: 'rain' }),
  step('rk-plan-verdict', 'The Verdict', `On the roof, in the rain, Giovanni turns to you.`, [
    ch('Take the title.', PLAN_END()),
    ch('"Give it back when they can pay."', PLAN_END(` He turns round, slowly. "...Where did you hear that." "She rang." A long time. The rain. "It was the fourth rule. I took it off the wall the day she retired." He picks up the telephone on the roof's wall box. "Matori. The florist. Vickery. Mark her paid, for good." He hangs up. "One. I'll do one. Don't ask me for four thousand."`), { requires: [madame] }),
  ], { cast: [BOSS], tint: '#141a24', effect: 'rain' }),
];
(plan[5] as Json).remembers = [{ id: 'cubone', when: [flagIs('rocket-tower-taken')], notice: `The Cubone from the Tower is still in the Holding Pen. Nobody will remind you. It's there if you go and get it.` }];

// ---------- Ending 2. Turn on the team: "The Long Ledger, From the Top" (ps_rk_turn) ----------
const turn: Json[] = [
  step('rk-turn-11', '11: The Anteroom', `Matori, with her tablet. Faye reads: "Matori. Nine years. Never a day's leave. Real name: on file. Reason for joining: 'Somebody had to know everyone's.'" ${say('Matori', `That's not for reading aloud.`)} A pause. ${say('Matori', `...He has a helicopter at one. I'll move it.`)} She steps aside.`, [
    ch('Go down.', on(`No battle. The stairs go down into the building you've worked in.`, 'rk-turn-10')),
    ch('Ask her name.', on(`She tells you. It's in no file after today.`, 'rk-turn-10', flag('matori-named'))),
  ], { cast: [EXEC] }),
  step('rk-turn-10', '10: The Specimen Hall', `A Rocket scientist with a fossil Pokémon on a lead. Faye reads the fossil's entry: "Taken from Mt. Moon. Owner: the mountain."`, [
    ch('Battle.', fight(`The scientist pushes his glasses up.`, foe('specialist', 'Rocket Scientist', 3, { lv: 1, pseudo: true, win: [room('rk-turn-9')] }))),
    ch('Let Griggs do it.', on(`The freight lift opens. A big man with a crowbar: Foreman Griggs. "That's mine. I dug it. I'm putting it back." He does the fighting.`, 'rk-turn-9'), { requires: [flagIs('griggs-left')] }),
  ], { cast: [GRUNT] }),
  step('rk-turn-9', '9: Butch', `Butch, at the top of the ninth-floor stair. Faye reads: "Butch. Eleven commendations. Name spelled wrong on nine."`, [
    ch('Battle.', fight(`He loses, and says it himself as he does: "It's Butch."`, foe('executive', 'Butch', 5, { lv: 2, pseudo: true, win: [room('rk-turn-7')] }))),
    ch('"Butch." (Say it right.)', on(`${say('Butch', `...House Card said it right. First go. Let them by.`)}`, 'rk-turn-7'), { requires: [flagIs('butch-named')] }),
  ], { cast: [EXEC] }),
  step('rk-turn-7', '7: Cassidy', `Cassidy, with her Big Tab. Faye reads: "Cassidy. Second collection, Vickery's, March to now: forty-one thousand, two hundred."`, [
    ch('Battle.', fight(`She doesn't wait for Faye to finish.`, foe('executive', 'Cassidy', 5, { lv: 2, pseudo: true, win: [room('rk-turn-6')] }))),
  ], { cast: [EXEC] }),
  step('rk-turn-6', '6: The Rig Room', `Dr. Namba, and Dr. Sotheby at the back. Faye reads: "Dr. Namba. Patent holder. Dr. Sotheby: deputy; no patent."`, [
    ch('Battle Namba.', fight(`"Do you know what this equipment costs?"`, foe('specialist', 'Dr. Namba', 4, { lv: 1, pseudo: true, win: [room('rk-turn-b')] }))),
    ch('Look at Sotheby.', on(`Sotheby reaches under the housing, on the left. Every Rig in the building opens at once. ${say('Dr. Namba', `What did you— that's not in the— it's NAMBA on the patent!`)} No battle. Collars fall off like leaves.`, 'rk-turn-b'), { requires: [flagIs('rocket-lore-sotheby')] }),
  ], { cast: [GRUNT] }),
  step('rk-turn-b', 'B: The Holding Cells', `A door, and a guard who's had the same sandwich as everyone. Faye reads: "Remy. Bunk nineteen, upper. Detained eleven weeks. Charge: none written." Otis doesn't wait for a choice. He's got the guard's keys before the guard has stood up. A thin man with a beard he didn't have, blinking. ${say('Remy', `...Did you finish my book?`)} ${say('Otis', `I never turned it over.`)} ${say('Remy', `It's the butler.`)}`, [
    ch('Up to the roof, by the service stair.', on(`On the way, the trio, lying down next to a potted plant. ${say('Meowth', `So let me get this straight. The new kid's sackin' the Boss.`)} ${say('James', `Is there severance?`)} ${say('Jessie', `We're with whoever's winning. It's implied in the motto.`)}`, 'rk-turn-roof', story({ pen: true }))),
  ], { cast: [GRUNT, GRUNT] }),
  step('rk-turn-roof', 'The Roof', `M2. The cables. Ein, closing his notebook. ${say('Ein', `The pulse has stopped. Somebody found the switch. How disappointing for Dr. Namba. I have what I came for.`)} He leaves by launch. ${say('M2', `The armour's quiet. I can hear myself. Is that your doing?`)} No battle. The four seals are unbolted by hand, one at a time. Otis takes the left shoulder ("You're shaking." "You're eight foot tall." "...Fair."). Faye takes the right ("You've a list. Am I on it?" "Entry four thousand, one hundred and thirteen. I added you this morning. Under 'Returned.'"). Remy takes the chest ("You were in a cage too. It doesn't leave. But it goes quiet."). The crown is yours.`, [
    ch('Unbolt the crown.', on(`${say('M2', `You wore the uniform to get to this bolt. I'll remember that this happened. I think I may even remember it fondly.`)} It's gone.`, 'rk-turn-door', flag('m2-free'), flag('legend-cerulean-cave'))),
  ], { tint: '#141a24', effect: 'rain' }),
  step('rk-turn-door', 'The Door', `The eleventh floor again. You unlock it. He's at the window, with his back to the room; the Persian is on the desk. ${say('Giovanni', `I heard it go. The thing on the roof. I'd know that silence anywhere; it's the silence after you lose something you couldn't afford.`)} He straightens his cuffs. ${say('Giovanni', `You've the list. Faye's. I knew she was copying it. I let her. I wanted to see whether anybody in this building would do anything with the truth, if they had it. Eleven years, nobody did. A battle? It's customary.`)}`, [
    ch('"A battle."', fight(`He fights the way he ran his Gym: cleanly, and to the end.`, foe('leader', 'Giovanni', 6, { lv: 2, pseudo: true, win: [] }), story({ beat: true }), story({ end: 'defeated', mods: [{ kind: 'priceMultiplier', group: 'all', value: 0.9 }], modsText: 'Every Kanto shop charges you 10% less, and they don\'t say why.' }), flag('rocket-ending-turn'), flag('rocket-remnants-hostile'))),
    ch('"No. Go."', out(`He picks up the Persian. At the private lift: "Customary isn't compulsory." He leaves the bowl, full. Rocket falls. Lists in Faye's handwriting are taped to the glass of every Pokémon Center in Kanto. ${EPILOGUE.turn}`, story({ beat: true }), story({ end: 'defeated', mods: [{ kind: 'priceMultiplier', group: 'all', value: 0.9 }], modsText: 'Every Kanto shop charges you 10% less, and they don\'t say why.' }), flag('rocket-ending-turn'), flag('rocket-remnants-hostile'))),
    ch(`"Your son's in Johto. Red hair. He's all right."`, out(`He doesn't move for a moment. ${say('Giovanni', `...Is he.`)} He picks up the Persian. ${say('Giovanni', `I'll not go to him. He'd think I wanted something.`)} At the private lift: ${say('Giovanni', `Tell him the Gym was real. He won't believe it from me.`)} Rocket falls. ${EPILOGUE.turn}`, story({ beat: true }), story({ end: 'defeated' }), flag('rocket-ending-turn'), flag('rocket-son-told')), { requires: [flagIs('rocket-son-found')] }),
    ch('"Give it back when they can pay."', out(`${say('Giovanni', `They can't pay. That's the point of them.`)} A pause. ${say('Giovanni', `...She'd say: then give it back anyway. She'd be insufferable about it.`)} He leaves the Master Ball on the desk. ${say('Giovanni', `There. One.`)} He goes, with the Persian. ${EPILOGUE.turn}`, story({ beat: true }), story({ end: 'defeated' }), item('master-ball'), flag('rocket-ending-turn')), { requires: [madame] }),
  ], { cast: [BOSS], pokemon: 'persian' }),
];
(turn[3] as Json).remembers = [
  { id: 'owes', when: [flagIs('cassidy-owes')], notice: `She's already put it back. Faye reads: "Balance: nil." Cassidy looks at the floor, and holds the lift.`, hide: [0], addChoices: [ch('Take the lift.', on(`Nobody fights. Cassidy holds the door until you're in.`, 'rk-turn-6'))] },
  { id: 'grudge', when: [flagIs('cassidy-grudge')], notice: `She knows who reported her skim. She's brought more than her Big Tab.`, hide: [0], addChoices: [ch('Battle.', fight(`She's been waiting for this.`, foe('executive', 'Cassidy', 6, { lv: 3, pseudo: true, win: [room('rk-turn-6')] })))] },
];
(turn[7] as Json).remembers = [{ id: 'inspector', when: [flagIs('rocket-lore-inspector')], notice: `You tell him: "Pilkington says it was the cleanest Gym in Kanto." He stops. ${say('Giovanni', `...He said that to you? In words?`)} A pause. ${say('Giovanni', `I had it in writing. I never heard it said.`)}` }];
((plan[5] as Json).remembers as Json[]).push({ id: 'inspector', when: [flagIs('rocket-lore-inspector')], notice: `You tell him: "Pilkington says it was the cleanest Gym in Kanto." ${say('Giovanni', `...He said that to you? In words? I had it in writing. I never heard it said.`)}` });
(turn[6] as Json).remembers = [{ id: 'cubone', when: [flagIs('rocket-tower-taken')], notice: `Afterwards you'll carry the Cubone back up Pokémon Tower yourself. The Marowak will be at the grave. She'll take it, and look at you for the length of one breath.` }];

// ---------- Ending 3. Side with the other side: "Safekeeping" (ps_rk_police) ----------
const POLICE_AFTER = `Kanto is safe. There's an International Police office in Saffron where Silph's lobby was, "temporarily," and Silph Co. is held "for safekeeping." It will still be held when the run ends. Shops are open; nobody's afraid; there are a few more forms than there used to be. A man in a brown coat nods to you in every town. You have one favour from Looker, for later. ${EPILOGUE.police}`;
const policeEnd = (text: string, ...fx: Json[]): Json => out(`${text} ${POLICE_AFTER}`, story({ beat: true }), story({ end: 'exposed' }), flag('rocket-ending-police'), flag('kanto-safekept'), flag('looker-favour'), ...fx);
const police: Json[] = [
  step('rk-police-cordon', 'Phase 1: The Cordon', `Forty officers in the stairwells. No battles: they have Faye's floor plan. You walk them up, floor by floor. Each Grunt they pass is offered a form. Most sign. Otis hands out pens.`, [
    ch('Keep walking.', on(`At the ninth floor there's one who won't sign.`, 'rk-police-arrests')),
  ], { cast: [] }),
  step('rk-police-arrests', 'Phase 2: The Arrests', `Butch, Cassidy, Namba, Vesper, Griggs and Rudd are led away. Domino doesn't sign. ${say('Domino', `Agent 009. Somebody ought to remember the number.`)}`, [
    ch('Battle.', fight(`She fights like someone with somewhere to be.`, foe('executive', 'Domino', 6, { lv: 2, pseudo: true, win: [room('rk-police-roof')] }))),
  ], { cast: [EXEC] }),
  step('rk-police-roof', 'Phase 3: The Roof', `M2, kneeling. Four officers and a technician with a new set of cables. An International Police helicopter with a cradle. ${say('Looker', `It comes with us. Safekeeping. A secure facility. It is for its own protection, and for— everyone's.`)} ${say('M2', `A different man. A different coat. The same cables. Do you see?`)}`, [
    ch(`"It walks free. That's the deal."`, on(`${say('Looker', `I cannot authorise—`)} "I'm not asking the International Police. I'm asking you." He looks at the rain for a while. ${say('Looker', `...I am tying my shoe.`)} The seals are unbolted while he ties it.`, 'rk-police-door', flag('m2-free'), flag('legend-cerulean-cave'))),
    ch('"...Safekeeping. For now."', on(`It's lifted. It doesn't struggle. It looks at you all the way up.`, 'rk-police-door', flag('m2-held'))),
    ch('"Ask it."', on(`${say('M2', `I want to not be asked for things.`)} Looker, slowly: "...That is a reasonable request. I have made it myself, of my superiors." It goes free.`, 'rk-police-door', flag('m2-free'), flag('legend-cerulean-cave'))),
  ], { cast: [], tint: '#141a24', effect: 'rain' }),
  step('rk-police-door', 'Phase 4: The Door', `Giovanni's gone, by the private lift. On the desk, a note: "Tell Looker the tea's on the eighth floor." ${say('Looker', `And the ledger. The list. This we must keep. For the prosecutions. It will be returned to the public in— there is a process.`)} ${say('Faye', `How long's the process?`)} ${say('Looker', `Years. Four. Perhaps six. They will be filed.`)} ${say('Faye', `They've been filed for forty.`)}`, [
    ch(`"It's evidence. Take it."`, policeEnd(`Looker takes the list, and thanks you properly.`)),
    ch('"Faye. Read it out. Now. All of it. On the PA."', policeEnd(`She does. It takes until evening. The whole of Saffron is listening, behind its seal. Looker stands in the lobby with his hat in his hands and doesn't stop her. By the time it's evidence, it's also common knowledge.`, flag('rep', 2))),
    ch('"Copy it first."', policeEnd(`Faye copies it again, faster this time, while Looker pretends to read the notice board.`, flag('rocket-list-copied'))),
    ch('"Give it back when they can pay."', policeEnd(`${say('Looker', `I do not— pay what?`)} ${say('Faye', `Attention.`)} He writes it in his notebook, and underlines it.`), { requires: [madame] }),
  ], { cast: [] }),
];

// ---------- Ending 4. Take it all: "The Fourth Rule" (ps_rk_own) ----------
const own: Json[] = [
  step('rk-own-duel', 'The Duel', `One on one: his Rhydon, Vault-Breaker, against your lead. No items. The Persian, Chairman, watches from the desk. Mid-fight, he says: ${say('Giovanni', `You'll keep the tenth. Say you'll keep the tenth. It's what stops it becoming a gang.`)}`, [
    ...([['"I\'ll keep the tenth."', 'tenth'], ['"I\'ll keep all four rules."', 'rules'], [`"I'll run it my way."`, 'mine']] as const).map(([label, k]) => ch(label, fight(`The Rhydon comes on like a wall.`,
      trainer('Giovanni', { sprite: BOSS, team: ['rhydon'], size: 1, lv: 2, win: [room('rk-own-matori')], lose: [room('rk-own-lost')] }), flag(`rocket-own-${k}`)))),
  ], { cast: [BOSS], pokemon: 'rhydon' }),
  step('rk-own-matori', 'The First Hour', `He looks at the Rhydon. He recalls it himself. ${say('Giovanni', `There. I'm told a handshake's customary.`)} He means it. He takes the photograph from the drawer, and nothing else. At the lift: ${say('Giovanni', `Mind Matori. She's never had a day's leave. And answer the telephone on Thursdays; she'll only ring your mother otherwise.`)} The office is yours. Four people come to the door, one at a time. The first is Matori. ${say('Matori', `You've a helicopter at one, a call with Johto at two, and a decision about the roof that I'd make before lunch. What are you running from? I'm obliged to ask the new ones.`)}`, [
    ch('(The same answer as your first day.)', on(`She writes it down again, in the same words, and underlines it.`, 'rk-own-callers')),
    ch(`"Nothing. I've stopped."`, on(`She looks up from the tablet, for the first time since you've known her.`, 'rk-own-callers')),
  ], { cast: [EXEC] }),
  step('rk-own-callers', 'The First Hour', `Domino: ${say('Domino', `I told you to ask again when you had a region. You have a region.`)} She names a figure. It's high, and exact. ${say('Domino', `I'm not loyal. I'm contracted. It's better. You'll always know where I am.`)} Faye: ${say('Faye', `I've audited you. It's Friday; I audit on Fridays. You've been Boss for forty minutes and you've already an unexplained item.`)} She puts the hand-copied list on the desk. ${say('Faye', `That one. What's it filed under?`)} Then the telephone. ${say('Madame Boss', `Oh, it's you now. Good. He was getting pompous. I've four rules, dear. He kept three. Let's hear yours.`)}`, [
    ch('Decide the list.', on(`You pick up the list.`, 'rk-own-list')),
  ], { cast: [EXEC, GRUNT] }),
  step('rk-own-list', 'The Four Decisions: The List', `Four thousand, one hundred and twelve names. What does Team Rocket do with them now?`, [
    ch('Return all of them.', on(`Faye closes her eyes, briefly. Then she opens a new ledger.`, 'rk-own-rigs', flag('rocket-own-list-all'), ...kind(2))),
    ch('Return those who can be found.', on(`About half. Faye writes "Returned" two thousand times, and starts on the rest.`, 'rk-own-rigs', flag('rocket-own-list-half'), ...kind(1))),
    ch('Keep it.', on(`Faye files it. She doesn't say anything. She doesn't have to.`, 'rk-own-rigs', flag('rocket-own-list-kept'))),
  ], { cast: [GRUNT] }),
  step('rk-own-rigs', 'The Four Decisions: The Rigs', `Dr. Namba's machines, and Dr. Sotheby's off switch.`, [
    ch('Destroy them.', on(`Sotheby brings her Growlithe to work the next day.`, 'rk-own-roof', flag('rocket-own-rigs-destroyed'))),
    ch('Lock them away.', on(`They go into a room only you have the key to.`, 'rk-own-roof', flag('rocket-own-rigs-locked'))),
    ch('Keep them running.', on(`Namba is delighted. Nobody else is.`, 'rk-own-roof', flag('rocket-own-rigs-running'))),
  ], { cast: [GRUNT] }),
  step('rk-own-roof', 'The Four Decisions: The Roof', `The armour on the roof, kneeling, cabled.`, [
    ch('Unbolt it.', on(`M2 stands up for the first time in a year, looks at you, and goes.`, 'rk-own-rule', flag('m2-free'), flag('legend-cerulean-cave'))),
    ch('Keep it as he did: owned, never used.', on(`You lock the roof door, and keep the key on your own ring.`, 'rk-own-rule', flag('m2-held'))),
    ch('Use it.', on(`You reach for the switch. The building goes very quiet. Are you sure? It's a living thing in that armour, and switching it on can't be taken back. You take your hand away, this time.`, 'rk-own-rule', flag('m2-held'), flag('rocket-own-roof-asked'))),
  ], { cast: [], tint: '#141a24', effect: 'rain' }),
  step('rk-own-rule', 'The Four Decisions: The Fourth Rule', `A pale square on the office wall, where a frame used to hang. Madame's fourth rule: "Give it back when they can pay."`, [
    ch('Put it back on the wall.', out(`The frame goes back up. The Heads grumble; it costs you their good opinion for a while. Kanto is yours. ${EPILOGUE.own}`, story({ beat: true }), story({ end: 'allied' }), flag('rocket-ending-own'), flag('rocket-own-rule-back'))),
    ch('Put it back on the wall. (Madame asked you to.)', out(`The frame goes back up. Nobody says a word against it: she rang them all first. Kanto is yours. ${EPILOGUE.own}`, story({ beat: true }), story({ end: 'allied' }), flag('rocket-ending-own'), flag('rocket-own-rule-back'), ...kind(1)), { requires: [madame] }),
    ch('Leave it off.', out(`The pale square stays pale. Kanto is yours. ${EPILOGUE.own}`, story({ beat: true }), story({ end: 'allied' }), flag('rocket-ending-own'))),
  ], { cast: [EXEC] }),
];

// A lost duel: "Not today." The Carry it out ending, from its Verdict, on the duel's own map.
own.push(step('rk-own-lost', 'The Verdict', `The Rhydon stands over your lead. Giovanni doesn't gloat. ${say('Giovanni', `Not today. Executive, then.`)}`, [ch('Take the title.', PLAN_END())], { cast: [BOSS] }));

// ---------- Team Ledger: the third option ----------
const LEDGER = { cast: [GRUNT], tint: '#2a2418', effect: 'sparkle' };
const ledger: Json[] = [
  ev('ledger-founding', 'Team Ledger', 'Evil Teams', { callback: true, requires: [...rk({ after: 3, ends: ['none'], stopped: 1 }), flagIs('rocket-offer-refused'), flagIs('rocket-looker-met', 0, 0), { kind: 'period', in: ['night'] }], ...LEDGER },
    `A woman in a cardigan over a black uniform, at the edge of the firelight, with two ledgers. ${say('Faye Coldwell', `You're the one who keeps breaking things and not taking anything. I've had to write you up four times. I don't know which column you go in. I've the books. All of them. Which shops are skimmed, which Grunts are owed, which crates went where. I don't want to give them to the police; they'll file them. I don't want him to keep them. You said no to both. So did I, in my head, for a year.`)} ${say('Faye', `There's a thing I'd like to do. It isn't fighting. It's auditing. I go through the book, line by line, and I put each thing back where it came from, and I leave a receipt. I can't do it alone. I can't carry a Snorlax.`)}`,
    [
      ch(`"I'll carry the Snorlax."`, out(`She almost smiles. Within the week there are six of you: Faye (books: "I won't lie in a ledger."), Otis Blackthorn (hands: "I won't carry a fourth crate."), Sergeant Jardine (wheels: "I won't ask."), Miss Anselma Vickery (heart: "I won't have anybody leaned on."), a crane operator from the Vermilion docks (eyes: "I've got kids."), and LEDGER, a Porygon2 with a black tag. QUERY: IF A THING IS RETURNED, IS THE ENTRY DELETED OR COMPLETED? Faye: "Completed." ...PREFERRED. Miss Vickery stitches the creed on a tea towel, and it's the team's flag: "Everything gets paid back."`, mark('third'), flag('ledger-founded'))),
      ch('"Who else?"', out(`She counts them off: the boy from the bunk room who joined for his teeth; the sergeant who never asks; a florist; a crane operator; a Porygon2 that asks too many questions. And you. Miss Vickery stitches a tea towel: "Everything gets paid back."`, mark('third'), flag('ledger-founded'))),
      ch('"Why receipts?"', out(`${say('Faye', `Because he taught me one true thing. Write it down. If it's written, it happened. I want it to have happened that they got them back.`)} Within the week there are six of you, and a tea towel for a flag: "Everything gets paid back."`, mark('third'), flag('ledger-founded'))),
    ]),
  ev('ledger-audit-1', 'Audit 1: One Growlithe', 'Evil Teams', { requires: [...rk({ after: 4, has: 'third' })], ...LEDGER, pokemon: 'growlithe' },
    `The book: "Entry 3,880. One Growlithe. Taken: Celadon, a bike shop's back room. Sold: a collector in Fuchsia. Price: ₽40,000." In a room of glass cases, Mr. Zoltan Quarrington: ${say('Mr. Quarrington', `I paid for it. I've a bill of sale. I'm the injured party.`)} ${say('Faye', `You are. You were sold something that wasn't theirs to sell. Here's your forty thousand; it's from the count room's float; I've written it as "refund." Here's a receipt. Sign there.`)}`,
    [
      ch('Hold out the pen.', out(`He signs. He's never been refunded by a crime before. The Growlithe goes home, and the bike shop's shutter goes up. The receipt: "Received: one Growlithe, in good health, a little fat. Signed: the boy." He's drawn a Growlithe.`, flag('ledger-audit-1'), ...kind(1)), { chance: 0.5, fail: out(`He folds his arms. He isn't signing. Faye looks at you.`, room('ledger-audit-1-refuse')) }),
    ]),
  ev('ledger-audit-1-refuse', 'Audit 1: One Growlithe', 'Evil Teams', { room: true, ...LEDGER, pokemon: 'growlithe' }, `${say('Mr. Quarrington', `I won't. It's mine. I've a bill of sale.`)}`, [
    ch('Battle for it.', fight(`He calls his collection to the glass.`, { kind: 'trainer', name: 'Mr. Quarrington', size: 3, types: [], levelBonus: 0, win: [flag('ledger-audit-1')] }, flag('ledger-audit-1-fought'))),
    ch(`Show him the boy's drawing of it.`, out(`He looks at it for a long time. Then he signs. The receipt comes back with a second drawing on it, by Mr. Quarrington, of a man in a room full of glass.`, flag('ledger-audit-1'), ...kind(1))),
    ch('Leave the receipt, and the money, and wait.', out(`You leave them on his table and wait in the street. At dusk the door opens, and the Growlithe comes out, and runs for Celadon.`, flag('ledger-audit-1'), ...kind(1))),
  ]),
  ev('ledger-audit-2', 'Audit 2: Forty Crates', 'Evil Teams', { requires: [...rk({ after: 5, has: 'third' })], ...LEDGER, tint: '#1a2230' },
    `Entries 2,001 to 2,040: forty crates on the Vermilion freighter, before it sails. ${say('The crane operator', `I can put a crate anywhere on that dock. I've never once been asked to put one back.`)} No stealth. Team Ledger walks up the gangway with a clipboard.`,
    [ch('Up the gangway.', out(`The deck is wet and the crates are stacked high.`, room('ledger-freighter-deck')))]),
  ev('ledger-freighter-deck', 'The Deck', 'Evil Teams', { room: true, ...LEDGER, tint: '#1a2230' },
    `Major Surge is at the top of the gangway. ${say('Major Surge', `What's this? A raid?`)} ${say('Faye', `An inventory check. Head office. You'll have had the memo.`)} There's no memo. She's so sure of herself that he looks for it.`,
    [ch('Wait while he looks.', out(`He finds no memo, and squares up.`, room('ledger-freighter-hold')), { chance: 0.5, fail: out(`He looks, and looks, and decides he must have lost it.`, room('ledger-freighter-crane')) })]),
  ev('ledger-freighter-hold', 'The Hold', 'Evil Teams', { room: true, ...LEDGER, tint: '#1a2230' },
    `${say('Major Surge', `No memo, no crates. I don't care whose head office.`)}`,
    [ch('Battle.', fight(`The deck hums with his Pokémon's charge.`, trainer('Major Surge', { boss: 'lt-surge', size: 5, lv: 1, win: [room('ledger-freighter-crane')] })))]),
  ev('ledger-freighter-crane', 'The Crane', 'Evil Teams', { room: true, ...LEDGER, tint: '#1a2230' },
    `Forty crates are craned ashore while Surge argues with a telephone.`,
    [ch('Sign for them.', out(`The receipt runs to forty lines. The last: "Received by: the dock, and whoever comes to collect. Signed: the crane."`, flag('ledger-audit-2'), ...kind(2)))]),
  ev('ledger-audit-3', 'Audit 3: One Pidgey', 'Evil Teams', { requires: [...rk({ after: 5, has: 'third' }), flagIs('ledger-audit-2'), { kind: 'period', in: ['night'] }], ...LEDGER, pokemon: 'pidgey' },
    `LEDGER: ENTRY 1. ONE PIDGEY. OWNER: MADAME. STATUS: KEPT. QUERY: IS THIS ENTRY OPEN? ${say('Faye', `Forty years. The boy who couldn't pay his tenth. She meant to give it back.`)} It's you who rings her, from the Game Corner's basement. ${say('Madame Boss', `Who's this on my line? ...The auditors. Oh, how lovely. I wondered who'd get to entry one. He never looked that far back. It died, dear, eleven years ago. Old age. It's under the plum tree. But the boy's alive. He's seventy. He keeps a ferry at Fuchsia. He never came for it because he was ashamed; I never sent it because I'd got fond. Go and tell him it had a good life. That's the only way that one closes.`)}`,
    [ch('Go to the ferry.', out(`An old man is mending a rope. "A Pidgey? ...I was nine. I traded a marble for it and I couldn't pay the lady's tenth. I've thought about that bird for sixty years. I thought she'd sold it." ${say('Faye', `She kept it. Thirty years. It slept on her desk. Here's your receipt.`)} He reads it for a long time. "Returned: the knowledge of one Pidgey. Owner: you, all along. Balance: nil." ENTRY 1: COMPLETED. LEDGER's black tag falls off.`, flag('ledger-entry1'), ...kind(2)))]),
  ev('ledger-readout', 'The Read-Out', 'Evil Teams', { callback: true, requires: [...rk({ beat: 6, has: 'third', inside: false })], ...LEDGER, tint: SILPH },
    `The night of Silph. Saffron's sealed. Team Ledger walks in through the front. In the lobby there are forty Grunts, and nobody has told them what to do about six people and a tea towel. Faye goes to the reception desk and picks up the building's own PA. ${say('Faye', `Good evening. This is an audit. I'll be reading out what each of you is owed. Please remain where you are.`)}`,
    [ch('Stand beside her.', out(`She starts at the basement.`, room('ledger-readout-floors')))]),
  ev('ledger-readout-floors', 'The Read-Out', 'Evil Teams', { room: true, ...LEDGER, tint: SILPH },
    `Floor by floor, over the speakers, in a level voice. "Basement. Otis Blackthorn: one set of teeth, paid in full. Remy, upper nineteen: eleven weeks' wages, unpaid; and an apology, unpaid." "Fourth floor. Kennel handlers: you were told to stop naming them. Biscuit Two's name is in the book. So's Biscuit One's." "Sixth floor. Dr. Sotheby: one patent, owed." "Ninth. Butch. It's spelled B, U, T, C, H. It's been wrong on your pay slip for nine years. It's right in mine." "Eleventh. Giovanni. One Gym, honestly held, eleven inspections. It's the only entry against your name that's in black." For every person you've helped in Kanto, one Grunt goes home. The building is half empty before anybody throws a Ball. Only Domino stays in the lobby, alone, because she's the only one who isn't owed anything.`,
    [ch('Battle Domino.', fight(`She doesn't make a speech.`, foe('executive', 'Domino', 6, { lv: 2, win: [room('ledger-readout-top')] })))]),
  ev('ledger-readout-top', 'The Eleventh Floor', 'Evil Teams', { room: true, cast: [BOSS], tint: SILPH },
    `${say('Domino', `Put me in your book, then. Under what?`)} ${say('Faye', `"Expensive."`)} ${say('Domino', `...Accurate.`)} On the eleventh floor, Giovanni is waiting. ${say('Giovanni', `I heard it. Every floor. You read my Gym out. In black. Nobody's ever audited me and found something to my credit.`)} He puts the Master Ball on the desk, and LEDGER's original beside it. ${say('Giovanni', `Finish the book. I never could. I kept getting to the Pidgey.`)}`,
    [ch('Take the book.', out(`No Boss battle. He goes. The roof is unbolted by six people and a Porygon. Rocket isn't beaten. It's closed, like an account. The Game Corner becomes a bank, of sorts: it lends at a tenth, and gives it back when they can pay. Faye has stopped wearing the uniform under the cardigan. ${EPILOGUE.audit}`,
      story({ beat: true }), story({ end: 'exposed' }), flag('rocket-ending-audit'), flag('m2-free'), flag('legend-cerulean-cave')))]),
];

export const EVENTS: Json[] = [finalChoice, ...plan, ...turn, ...police, ...own, ...ledger];
export const REMOVE: string[] = [];
