// Catalog Overhaul Pack, Evil Teams Volume III: Johto, Team Rocket's Return from inside, the end (TEAM_ROCKET_JOHTO_FULL_2).
// The Final Choice at Noon in studio one, the four endings as chain pseudo-stages (ps_neo_plan, ps_neo_turn, ps_neo_lance,
// ps_neo_own: written by _evil-story-sync.ts), Team Static (the third option: founding, three broadcasts and "Two
// Frequencies") and everyone's epilogue line. "Take it all" ends the team story here: Evil Mode is on hold (Kice).
// Nothing ends a run; Dark Celebi is never the player's to command; Mika is never in a battle or in danger on screen.
import { ch, ev, fight, flag, flagIs, inRegion, out, room, trainer, type Json } from '../dsl.ts';
import { evil as story, foe, kind, rivalTrust } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-story';

const R = teamJson('rocket');
const GRUNT = R.ranks.grunt.sprite;
const EXEC = R.ranks.executive.sprite;
const ARCHER = 'trainer.pr/archer';
const TOWER = '#1e1e2e';
const ROOF = '#141824';
const J = inRegion('johto');
const say = (who: string, line: string): string => `${who}: "${line}"`;
const neo = (o: Json = {}): Json[] => [{ kind: 'evil', team: 'rocket', ...o }, J];
const mark = (m: string): Json => story({ mark: m });
const coat = flagIs('neo-heir-coat');
/** A fight inside an ending's own map: a loss walks the player back out, and the run goes on. */
const ps = (b: Json): Json => ({ ...b, pseudo: true });
/** The man in the iron mask: the Marauder, paid half up front. `A+2`. */
const marauder = (o: Json = {}): Json => ps(trainer('The man in the iron mask', { size: 2, lv: 2, types: ['dark', 'rock'], ...o }));
/** A room in an ending: one step on that ending's own map. */
const step = (id: string, name: string, intro: string, choices: Json[], o: { cast?: string[]; pokemon?: string; tint?: string; effect?: string } = {}): Json =>
  ev(id, name, 'Evil Teams', { room: true, cast: o.cast ?? [GRUNT], tint: o.tint ?? TOWER, effect: o.effect ?? 'none', ...(o.pokemon ? { pokemon: o.pokemon } : {}) }, intro, choices);
const on = (text: string, next: string, ...fx: Json[]): Json => out(text, ...fx, room(next));

// The epilogues (FULL_2 "Everyone, by ending"): said as the ending closes.
const EPILOGUE: Record<'plan' | 'turn' | 'lance' | 'own' | 'static', string> = {
  plan: `Mika believes he heard. Tobi tends the mast, badly, for ever. Mr. Sallow goes home; he's taken the hint. Sabela dusts the chair. The Director reads what he's given. Mary is on air, under guard. The Yateses sell candy bars to Rocket. Archer is wrong, and knows it, and reads the weather. Ariana is passed over again. Petrel is the Director, for good; it's the saddest one. Proton does the tails. The Heir hears his father was called, and wasn't there. The Marauder is paid in full. Kurt never speaks to you again. Somewhere, a phone rings once, and nobody speaks.`,
  turn: `Mika goes home with Tobi's family, goes to school, and tells them she "worked in broadcasting." Tobi keeps Slowpoke at the Well. Mr. Sallow went home when he was told. Sabela is asked what should be done with the chair. The Director is free, with his pills: "Understudy." Mary does The Morning After, with the correct weather. The Yateses sell candy bars. Ariana stood at the door till you'd finished. Petrel goes without the wig, and finds out. Proton: "The first thing in three years that's been somebody else's fault." The Marauder loses the Ball and laughs anyway. Kurt says the name. At Tohjo Falls, a man switches off a radio.`,
  lance: `Mika is at the Den, top of her year; she hates it; she's good at it. Tobi is vouched for by the Director, who vouches. Mr. Sallow goes home. Sabela is sent home, and takes the duster. Mary is on air. The Yateses sell candy bars. Archer has a house in Blackthorn with a garden and no telephone, and Ariana is running it within a month. Petrel is removed as himself, and nobody recognises him. Proton keeps a Slowpoke in the garden and doesn't touch its tail. The Heir watches from the Magnet Train station. The Marauder was removed by a man in a cape, and is furious. Kurt says the name. Nobody looks for Giovanni.`,
  own: `Mika: "It's 'Boss' now." She has two words left. Tobi is first officer, "the one who breaks it." Mr. Sallow stays, if the fourth rule is on the wall. The Director runs your station and reads what's true: that was his price. Mary is your Voice. The Yateses sell candy bars, and are asked their opinion, weekly. Archer would be your Patron, if asked: "Tell me whose room." Ariana was asked, and stopped the tails that day. Petrel is nobody, and finding out who that is. Proton is the one who says "stop." The Heir sits on the arm of the chair. The Marauder goes unpaid: the ring's redeemed instead. Kurt has the Ball, to open in his own time. Giovanni hears there's a new chair, and says nothing; which, from him, is approval.`,
  static: `Mika reads the children's hour, and checks it twice. Tobi is the engineer. Mr. Sallow sings the closing-time song on air, and explains it. Sabela keeps the houseboat spotless. The Director is station manager, at seventy. Mary is the Voice. The Yateses have a wireless on the counter; it's always on. Archer works the souvenir shop's till, and he's very good with it; the coat hangs on the back of the door. Ariana sends Static the Return's books, anonymously; everyone knows. Petrel does voices on the children's hour, and all of them are his own. Proton is the first caller to the phone-in, doesn't give his name, and says sorry. The Heir listens every night and never writes in. The Marauder is offered a candy bar. Kurt: "Give me that thing." Giovanni hears a kettle on the wireless, and listens to the end.`,
};

// ---------- The Final Choice (Noon, studio one) ----------
const finalChoice = ev('neo-final-choice', 'Noon', 'Evil Teams', { room: true, cast: [ARCHER, EXEC], tint: TOWER, effect: 'glint' },
  `Studio one. A glass booth. A clock with a red second hand: eleven fifty-eight. A desk; a microphone on a spring arm; a script, one page, typed, corrected, corrected back. The last line: "Giovanni. Team Rocket calls you home." Through the glass: Archer, with his hands behind his back. Ariana at the door. Petrel, with no wig on, which nobody's seen before. Proton, looking at the floor. Behind them, the whole of the Return that would fit in a corridor: Mika at the front, with a folded paper; Mr. Sallow, with his cap in his hand; Tobi. On the roof, over all their heads: a man in an iron mask, and a black ball, and air that's the wrong season. The second hand. ${say('Archer, through the talkback, very gently', `When the light's red. Just as it's written. Or— as you find you can.`)} The light's red. Every radio in Johto is on. The Final Choice is what you say into it.`,
  [
    ch('"Giovanni. Team Rocket calls you home."', on(`You read it as written, on every band in Johto. The Tower hums. In the corridor a hundred and fifty people are holding their breath, and one of them is fourteen.`, 'neo-plan-hold', flag('neo-final-plan'))),
    ch(`"This is the Radio Tower. Here's where the Director is. Here's where the mast is. Here's the hideout."`, on(`${say('You, on every band', `The real Director's in the basement store room. The mast's on a barge at the Lake of Rage. The hideout's under the souvenir shop in Mahogany; push the Gyarados's eye.`)} Through the glass, nobody moves. For a whole second, nobody at all.`, 'neo-turn-air-1', flag('neo-final-turn')), {
      branches: [{ when: [flagIs('ariana-door')], text: `${say('You, on every band', `The real Director's in the basement store room. The mast's on a barge at the Lake of Rage. The hideout's under the souvenir shop in Mahogany; push the Gyarados's eye.`)} Through the glass, nobody moves. For a whole second, nobody at all. Then Ariana shuts the studio door, from the outside, and stands in front of it. ${say('Ariana', `Nobody goes in till they've finished. I said I'd back whoever held the microphone.`)}`, effects: [flag('neo-final-turn'), flag('neo-ariana-held'), room('neo-turn-air-1')] }],
    }),
    ch('"Lance. The roof. Now."', on(`For four seconds, nothing. Then every window on the south side of the studio goes dark at once, because something very large has landed outside it.`, 'neo-lance-windows', flag('neo-final-lance')), { requires: [flagIs('neo-lance-met')] }),
    ch(`"He isn't coming. I'm here."`, on(`Through the glass: a hundred and fifty faces. Mika's dropped her paper. Archer has his eyes shut, and his shoulders have come down, for the first time in three years. ${say('Archer, on the talkback, off the air, barely a voice', `...Thank you. I couldn't have said it.`)}`, 'neo-own-duel', flag('neo-final-own')), { requires: [{ kind: 'evil', rank: 5, has: 'confided' }] }),
  ]);
(finalChoice as Json).remembers = [
  { id: 'mika', when: [flagIs('neo-mika-archer')], notice: `Mika, at the front of the corridor, isn't looking at the clock. She's looking at Archer.` },
  { id: 'rule4', when: [flagIs('neo-rule4')], notice: `Somebody has chalked the fourth rule on the corridor wall, under the three: "Give it back when they can pay."` },
];

// ---------- Ending 1. Carry it out: "The Call" (ps_neo_plan) ----------
const PLAN_END = (extra: string, ...fx: Json[]): Json => out(`${extra} ${say('Archer', `You held. I knew you would. The Boss will hear of this.`)} A pause; it's the old line, and he hears himself. ${say('Archer', `...I've heard of it. That'll have to do. Executive. Welcome to what's left of the family.`)} Johto is listening. The Return holds the airwaves, and what they carry is up to Archer, a man who's just found out he was wrong. It plays music. It reads the weather, correctly. Once a day, at noon, a voice says: "Team Rocket. Standing by." Nobody knows what for any more; it's become a time signal. You wear a white-trimmed coat. ${EPILOGUE.plan}`,
  story({ beat: true }), story({ end: 'allied' }), flag('neo-ending-plan'), flag('johto-listening'), ...fx);
const plan: Json[] = [
  step('neo-plan-hold', 'Phase 1: Hold the Line', `Goldenrod's police and the Tower's guards come up the stairs, and Gym trainers who "heard the broadcast and came to end it." You post the squad. Mika is at your elbow, waiting to be told where.`, [
    ch('Mr. Sallow and Old Rocket in the lobby; Tobi in the studio; you on the stairs.', fight(`In the lobby, Old Rocket don't fight. They stand in a row with their caps off and sing the closing-time song, and the police stop: nobody's ever been sung at. Tobi has wired the Broadcast Keys so each needs one turn, not two. Mika is behind the glass, safe, and she sees everything. The stairs are yours.`, ps(trainer('Goldenrod Police', { size: 3, lv: 1, chain: 1, win: [room('neo-plan-keys')] })))),
    ch('The same, and send Mika to Mahogany "to make the chair room ready."', fight(`She goes, pleased to be trusted, and she's out of the Tower before the first officer reaches the lobby. Old Rocket sing; the police stop; Tobi's at the keys. The stairs are yours.`, ps(trainer('Goldenrod Police', { size: 3, lv: 1, chain: 1, win: [room('neo-plan-keys')] })), flag('neo-mika-sent'))),
    ch('Keep the squad with you on the stairs.', fight(`The lobby and the studio come up the stairs to meet you.`, ps(trainer('Goldenrod Police', { size: 3, lv: 1, chain: 2, win: [room('neo-plan-keys')] })))),
  ]),
  step('neo-plan-keys', 'Phase 2: The Broadcast Keys', `Three keys. The Tower hums louder with each one seated.`, [
    ch('Seat them.', on(`${say('Archer, on the PA', `One. He could hear me through a tin can.`)} The hum climbs. ${say('Archer', `Two. Boss, if the line's bad, I'll say it again.`)} It climbs. ${say('Archer', `Three. Then I'll stop asking.`)}`, 'neo-plan-rival')),
  ], { cast: [ARCHER] }),
  step('neo-plan-rival', 'Phase 3: The Rival', `Your rival bursts out of the stairwell. "You read it. I heard you read it. I was in a tea shop. Everyone stopped stirring."`, [
    ch(`"It's one day of hope for two hundred people."`, fight(`"Then it can be one day without you in it."`, ps(trainer('Your rival', { rival: true, size: 6, lv: 1, win: [room('neo-plan-defender')] })), rivalTrust(-1))),
    ch('"Go and get Mary out. Third floor."', on(`No battle. Your rival looks at you for one long second, and goes. It's this ending's one mercy.`, 'neo-plan-defender', rivalTrust(2), flag('neo-rival-mary'))),
    ch('"Listen for an answer with me."', on(`The two of you stand by the big speaker. The carrier hiss. A minute. "...There's nothing." "Not yet." Your rival doesn't fight. They stay.`, 'neo-plan-defender', rivalTrust(1))),
  ], { cast: [] }),
  step('neo-plan-defender', 'Phase 4: The Defender', `Goldenrod's Gym Leader leads the last of them up the stair. ${say('Whitney', `Pull the plug, Rocket. People are listening.`)}`, [
    ch('Battle.', fight(`At half her ace's health the Tower goes to Dead Air, and she doesn't flinch.`, ps(trainer('Whitney', { boss: 'whitney', size: 6, lv: 2, win: [room('neo-plan-roof')] })))),
  ], { cast: ['boss.whitney'] }),
  step('neo-plan-roof', 'Phase 5: The Roof', `Noon's been and gone. Nothing's come back on any band. The dish; the man in the iron mask on the rail; the black ball. ${say('Archer, on the stair, hoarse', `Nothing. Not even static.`)} He looks up. ${say('Archer', `It doesn't matter. I made other arrangements. Standby: if I go through, hold the roof for ten minutes. If I don't come back—`)} He doesn't finish. ${say('The man in the iron mask', `And here's my favourite part of every job. The part where I explain that it's mine now.`)} Celebi is in the Ball, in three Thorn Rings. You aren't freeing it. You're deciding whether Archer gets his door.`, [
    ch('Open it for him.', fight(`You fight the man in the iron mask for the Ball.`, marauder({ win: [room('neo-plan-door')] })), { requires: [flagIs('neo-letter-held', 0, 0)] }),
    ch('Open it for him. (He has his letter.)', fight(`You fight the man in the iron mask for the Ball, and win it, and hold it out. Archer looks at the door for a long moment. ${say('Archer', `I've had my answer. Four lines, three years late. I don't need to stand in a doorway to hear it again.`)} He doesn't go through.`, marauder({ win: [room('neo-plan-verdict')] }), flag('neo-archer-answered'), flag('celebi-free')), { requires: [flagIs('neo-letter-held')] }),
    ch('Break the Ball.', on(`The three rings, one by one, and the Ball splits. Celebi is free. Archer watches his door close. He sits down on the cable drum. ${say('Archer', `...Thank you. I think. I'd have stood in that doorway for ever. I can see that now. It's not a kindness I'd have done myself.`)}`, 'neo-plan-verdict', flag('neo-archer-closed'), flag('celebi-free'))),
    ch('"Archer. The boy took the coat."', on(`Archer turns. The Heir is on the stair, in white trim, furious about it. ${say('The Heir', `It's a nice coat. That's the worst part. Don't make it mean anything.`)} Archer puts the Dark Ball down on the rail himself. ${say('Archer', `I don't need the door. I've somebody to make the room ready for.`)} The man in the iron mask takes his fee and goes, laughing.`, 'neo-plan-verdict', flag('neo-archer-coat')), { requires: [coat] }),
  ], { cast: [ARCHER], tint: ROOF, effect: 'glint', pokemon: 'celebi' }),
  step('neo-plan-door', 'Phase 5: The Door', `The Ball is Archer's. The roof is three years ago for as long as it takes him to step, and he's gone. You hold the roof alone, ten turns, against the police. At the tenth he's back, standing exactly where he was. His coat's wet. ${say('Archer', `I stood in the door. The lobby. That night. There was a child on the steps.`)}`, [
    ch('Listen.', on(`${say('Archer', `I couldn't. They were so certain. They'd a Pokémon that kept looking up at them to see if they were all right. I thought: if I stop this one, I've to be the kind of man who stops that. And he wasn't worth it. I stood in the door of the building, and I worked out, three years late, that he wasn't worth it.`)} ${say('Archer', `So I stepped aside. I've just watched you go up the stairs. It's the best thing I've ever done, and nobody was there.`)}`, 'neo-plan-verdict', flag('neo-archer-door'))),
    ch('"Was it me? On the steps?"', on(`He looks at you properly. ${say('Archer', `It was you. Smaller.`)} Then the rest of it, the certain child and the Pokémon looking up, and the man in the door who stepped aside. ${say('Archer', `It's the best thing I've ever done, and nobody was there.`)}`, 'neo-plan-verdict', flag('neo-archer-door')), { requires: [flagIs('team-rocket-beaten')] }),
  ], { cast: [ARCHER], tint: ROOF, effect: 'rain' }),
  step('neo-plan-verdict', 'The Verdict', `The roof. The dish is quiet.`, [
    ch('Take the coat.', PLAN_END(`Archer holds out a white-trimmed coat.`)),
    ch(`"Read the weather. Correctly."`, PLAN_END(`${say('Archer', `...Correctly. Yes. We can do that much.`)}`, ...kind(1)), { requires: [flagIs('neo-mary-spoke')] }),
  ], { cast: [ARCHER], tint: ROOF }),
];
(plan[3] as Json).remembers = [{ id: 'pills', when: [flagIs('neo-director-pills')], notice: say('Whitney', `The old man in the basement says one of you's all right. Is it you? It had better be you.`) }];

// ---------- Ending 2. Turn on the team: "Dead Air, From the Booth" (ps_neo_turn) ----------
const TURN_AFTER = `The Return is finished. The Tower is back on the air: The Morning After, with the correct weather. Mika goes home with Tobi's family; he has a sister her age.`;
const turnEnd = (text: string, ...fx: Json[]): Json => out(`${text} ${TURN_AFTER} ${EPILOGUE.turn}`, story({ beat: true }), story({ end: 'defeated' }), flag('neo-ending-turn'), flag('rocket-return-cut'), ...fx);
const turn: Json[] = [
  step('neo-turn-air-1', 'On Air', `You keep talking. Each line sends somebody.`, [
    ch(`"Mary's on the third floor. She's all right."`, on(`Her listeners hear it.`, 'neo-turn-air-2', flag('neo-turn-mary')), { branches: [{ when: [flagIs('neo-mary-spoke')], text: `Her listeners were already in the lobby: forty people with flasks, since she spoke in the rehearsal.`, effects: [flag('neo-turn-mary'), room('neo-turn-air-2')] }] }),
    ch('"The Director needs his pills. Small, white, twice a day."', on(`A chemist from four streets off is running before you've finished.`, 'neo-turn-air-2', flag('neo-turn-chemist'))),
    ch(`"There's a man on the roof with a black ball. It's Celebi."`, on(`In Azalea, Kurt is on his feet before the sentence ends. Somewhere over Blackthorn, so is a man in a cape.`, 'neo-turn-air-2', flag('neo-kurt-heard'))),
  ], { cast: [ARCHER, EXEC] }),
  step('neo-turn-air-2', 'On Air', `The light's still red.`, [
    ch('"Old Rocket: home you go."', on(`Mr. Sallow, in the corridor, puts his cap on. Twelve people file out. They've been told, in the right words, at last.`, 'neo-turn-studio', flag('neo-turn-home'))),
    ch('"Mika. It was Archer with the tray."', on(`She unfolds her paper. She looks through the glass at the wrong man, and then at the right one.`, 'neo-turn-studio', flag('neo-turn-mika'))),
    ch(`"That's all. Thank you for listening."`, on(`You switch the light off yourself.`, 'neo-turn-studio')),
  ], { cast: [GRUNT, GRUNT] }),
  step('neo-turn-studio', 'Studio One', `Archer is at the glass. He doesn't come in. ${say('Archer', `You've told them where the chair is.`)} That's what he heard, out of all of it. He goes up, not down. To the roof.`, [
    ch('Go down.', on(`The corridor.`, 'neo-turn-corridor')),
  ], { cast: [ARCHER] }),
  step('neo-turn-corridor', 'The Corridor', `New blood, who don't know what to do. Tobi stands on a chair. ${say('Tobi', `Who here's actually seen him? Hands up.`)} None. ${say('Tobi', `Who's seen Archer bring the tea round?`)} All. ${say('Tobi', `Then who are you waiting for?`)} Half of them sit down on the floor.`, [
    ch('Step past them.', on(`No battle.`, 'neo-turn-third')),
  ], { cast: [GRUNT, GRUNT] }),
  step('neo-turn-third', 'The Third Floor', `Mary's guard, at studio three.`, [
    ch('Battle.', fight(`He's been told to hold the door, and he holds it.`, foe('grunt', `Mary's guard`, 3, { lv: 1, pseudo: true, win: [room('neo-turn-library')] }))),
    ch('Knock.', on(`Mary has opened the door herself, with her listeners on the other side of it. The guard sits down.`, 'neo-turn-library'), { requires: [flagIs('neo-mary-spoke')] }),
  ], { cast: [GRUNT] }),
  step('neo-turn-library', 'The Record Library', `Petrel, with no wig. ${say('Petrel', `I could stop you. I could be anybody. I could be you; I've been practising.`)} A pause. ${say('Petrel', `I'd rather find out who's left if I don't.`)} He holds out the cassette, and the Understudy, his Ditto, which turns into nothing in particular and looks relieved.`, [
    ch('Take the cassette, and the Ditto.', on(`The Understudy settles in your arms as a small grey lump, and stays one.`, 'neo-turn-lobby', { kind: 'join', shadow: false, species: ['ditto'], types: [] }, flag('neo-understudy'))),
    ch('Take the cassette. "Keep him."', on(`${say('Petrel', `...He's never been anyone's but mine. Fair enough.`)}`, 'neo-turn-lobby')),
  ], { cast: ['trainer.pr/petrel'], pokemon: 'ditto' }),
  step('neo-turn-lobby', 'The Lobby', `Proton. ${say('Proton', `I knew. The pills. The mast. Mary. I've known for a week. I didn't say.`)} ${say('Proton', `I was the one who did the tails. So they wouldn't have to. I've been waiting three years for somebody to do the thing I couldn't. Stop it. I'd done too much to be the one who stopped it.`)} ${say('Proton', `A battle. I need to have lost. Don't go easy; I'll know.`)}`, [
    ch('Battle. Properly.', fight(`He fights properly. ${say('Proton, beaten', `...There. That's the first thing in three years that's been somebody else's fault. Thank you.`)}`, ps(trainer('Proton', { boss: 'proton', size: 6, lv: 2, win: [room('neo-turn-basement')] })))),
  ], { cast: ['trainer.pr/proton'] }),
  step('neo-turn-basement', 'The Basement', `The Director, doing the crossword. ${say('The Director', `Seven across. "A change of heart, in the theatre." Eleven letters.`)}`, [
    ch('"Understudy."', on(`${say('The Director', `Good. You may let me out.`)} You do. Then up, all the way, to the roof.`, 'neo-turn-roof', flag('neo-director-free'))),
  ], { cast: ['trainer.gentleman'] }),
  step('neo-turn-roof', 'The Roof', `The man in the iron mask; the Dark Ball; Celebi in three Thorn Rings; twelve turns. Archer is by the dish.`, [
    ch('Break the rings.', fight(`Ring by ring.`, marauder({ win: [room('neo-turn-after')] }))),
  ], { cast: [ARCHER], tint: ROOF, effect: 'glint', pokemon: 'celebi' }),
  step('neo-turn-after', 'When the Ball Splits', `Celebi. It looks at Archer. It looks at you. Then the roof is three years ago, for exactly as long as it takes to blink. ${say('Archer', `It showed me. The door. I could have gone.`)} He's looking at his hands. ${say('Archer', `I'd have stood there for the rest of my life. Wouldn't I.`)} Later the chair turns up in a police inventory, tagged. You may ask for it, and say where it goes.`, [
    ch('To Archer.', turnEnd(`It goes to Archer. He's seen once more, at a bus stop, without the coat.`, flag('celebi-free'), flag('neo-chair-archer')), { branches: [{ when: [coat], ...turnEnd(`It goes to Archer. He's seen once more, at a bus stop, with somebody, carrying their bag.`, flag('celebi-free'), flag('neo-chair-archer')) }] }),
    ch('To the Heir.', turnEnd(`It goes to the Heir, who says he doesn't want it, and keeps it.`, flag('celebi-free'), flag('neo-chair-heir'))),
    ch(`To Sabela, who's dusted it for three years.`, turnEnd(`Sabela takes it home on a handcart, with the duster on the seat.`, flag('celebi-free'), flag('neo-chair-sabela'))),
    ch(`To the Yateses, who'd like something to sit on behind the counter.`, turnEnd(`It goes behind the counter of the souvenir shop. Mr. Yates does the crossword in it.`, flag('celebi-free'), flag('neo-chair-yates'))),
  ], { cast: [ARCHER], tint: ROOF, pokemon: 'celebi' }),
];
(turn[8] as Json).remembers = [
  { id: 'kurt', when: [flagIs('neo-kurt-heard')], notice: `Kurt is there by the second ring, out of breath, with the name. He says it.` },
  { id: 'coat', when: [coat], notice: `Archer has seen the Heir on the stair. For two turns he steps between the man in the iron mask and you.` },
  { id: 'rule4', when: [flagIs('neo-rule4')], notice: `Old Rocket are on the roof stair. They don't fight. They block the man in the iron mask's flying machine with a tea trolley.` },
];
(turn[6] as Json).remembers = [
  { id: 'mercy', when: [flagIs('proton-mercy')], notice: `He's got a Slowpoke's hair on his sleeve. It's what makes the battle a relief and not a punishment.` },
  { id: 'vendor', when: [flagIs('neo-tails-fed')], notice: say('Proton', `The vendor's feeding them. I've sent him money. He doesn't know it's from me.`) },
];
(turn[4] as Json).remembers = [{ id: 'listener', when: [flagIs('neo-listener-promise')], notice: `You tell Mary: "There's a girl of seven who's written you nine letters." ${say('Mary', `...That's who they're from. They're pinned over my desk. They were the only post that wasn't orders.`)}` }];
(turn[7] as Json).remembers = [{ id: 'pills', when: [flagIs('neo-director-pills')], notice: `He's taken his pills. He looks ten years younger than the man you met in the rehearsal.` }];

// ---------- Ending 3. Side with the other side: "The Dragon's Order" (ps_neo_lance) ----------
const LANCE_AFTER = `Johto is safe. The Dragon clan "keep order," out of Blackthorn. There are Dragonite over the towns in the evening. People are grateful. People look up rather often. Nobody voted for it; nobody quite minds. Lance would be the first to say it isn't how things should be done, and he's still doing it at the end of the run. You have the Dragon's favour: once, in a later region, a Dragonite will come when it's needed.`;
const lanceEnd = (text: string, ...fx: Json[]): Json => out(`${text} ${LANCE_AFTER} ${EPILOGUE.lance}`, story({ beat: true }), story({ end: 'exposed' }), flag('neo-ending-lance'), flag('johto-order'), flag('dragon-favour'), ...fx);
const lance: Json[] = [
  step('neo-lance-windows', 'Phase 1: The Windows', `A Dragonite at every floor. The Tower's guards put their hands up without being asked. It's over before you're out of the booth.`, [
    ch('Come out of the booth.', on(`Lance is in the corridor.`, 'neo-lance-order')),
  ], { cast: ['boss.lance'], pokemon: 'dragonite' }),
  step('neo-lance-order', 'Phase 2: The Order', `${say('Lance, to a hundred and fifty Grunts', `Hyper Beam.`)} It's aimed at the wall. The wall's gone. ${say('Lance', `That was a courtesy. Leave by it.`)}`, [
    ch(`"They're kids. Half of them are kids."`, on(`He stops. He looks at the corridor properly: at the uniforms that don't fit, at a girl with a folded paper. ${say('Lance', `...How old is that one.`)} "Fourteen." ${say('Lance', `And I have just fired a Hyper Beam through a wall beside her.`)} He's quiet. ${say('Lance', `The Dragon's Den takes apprentices. Any who want a roof and a discipline. Any. I'll not have it said I only know how to remove.`)}`, 'neo-lance-roof', flag('neo-den-apprentices'), ...kind(2))),
    ch('Say nothing.', on(`They go out by the wall, into a city that's just heard where they live.`, 'neo-lance-roof')),
    ch('"Tell them where to go, not just to go."', on(`${say('Lance', `...Home. Wherever that is. The Pokémon Center will take any who've nowhere.`)} It's not the Den. It's something.`, 'neo-lance-roof', ...kind(1))),
  ], { cast: ['boss.lance', GRUNT] }),
  step('neo-lance-roof', 'Phase 3: The Roof', `The man in the iron mask; the Ball. ${say('Lance', `A Dark Ball. I've read of them. One doesn't negotiate.`)} ${say('The man in the iron mask', `A cape! He's sent a man in a cape!`)}`, [
    ch('Together.', fight(`Lance's Dragonite beside yours.`, marauder({ format: 'doubles', ally: 'dragonite', win: [room('neo-lance-ball')] }))),
  ], { cast: ['boss.lance'], tint: ROOF, effect: 'glint', pokemon: 'celebi' }),
  step('neo-lance-ball', 'The Ball', `The Dark Ball is on the ground. If it goes to the Den it is kept, unopened, on a shelf, in a clan that means well, and Ilex Forest loses a day at every rest for the rest of the region.`, [
    ch('Break it.', lanceEnd(`Celebi is free.`, flag('celebi-free'))),
    ch('"Lance. Let Archer see what\'s in it first."', lanceEnd(`Lance allows it; he's courteous. Three years ago, for a blink. ${say('Archer', `...Thank you. I didn't expect that from you.`)} ${say('Lance', `Nor did I.`)} Then it breaks, and Celebi is free.`, flag('celebi-free'), flag('neo-archer-saw'))),
    ch('Give it to the Den, for safekeeping.', lanceEnd(`It's kept, on a shelf, in Blackthorn.`, flag('celebi-shelved'))),
  ], { cast: ['boss.lance', ARCHER], tint: ROOF, pokemon: 'celebi' }),
];

// ---------- Ending 4. Take it all: "Standby No Longer" (ps_neo_own) ----------
const OWN_AFTER = `Johto is yours: a team that holds a radio tower and a souvenir shop.`;
const own: Json[] = [
  step('neo-own-duel', 'The Duel', `It's customary. Archer, in the studio, with the microphone on. ${say('Archer', `I'll not hand it over. You'll take it, so they can hear it taken. They've had three years of being told. They should hear something.`)} ${say('Archer, at Open Mic', `This is what it sounds like when we don't quit.`)}`, [
    ch('Battle, on air.', fight(`As his Houndoom falls: ${say('Archer', `And this is what it sounds like when we do. Properly. To someone.`)} ${say('Archer', `Last call. I've always hated the phrase.`)} He takes off the coat. He folds it. He holds it out. ${say('Archer', `He gave me this. I'm giving it to you. That's how a thing's kept.`)}`,
      ps(trainer('Archer', { boss: 'archer', size: 6, lv: 2, win: [room('neo-own-chair')], lose: [room('neo-own-lost')] })), flag('neo-own-coat'))),
  ], { cast: [ARCHER] }),
  step('neo-own-chair', 'The Chair', `Mahogany. The chair room. Sabela, with the key on its ribbon, and the duster. ${say('Sabela', `Three years, every morning. It's as he left it.`)} The chair. The mark on the arm.`, [
    ch('Sit.', on(`It's a chair. That's the discovery. Sabela lets out a breath she's held since a Tuesday in a car park.`, 'neo-own-hour', flag('neo-own-sat')), { branches: [{ when: [flagIs('neo-mark-touched')], text: `It's a chair. That's the discovery. Sabela lets out a breath she's held since a Tuesday in a car park. ${say('Sabela', `You never did have any respect.`)} She's smiling.`, effects: [flag('neo-own-sat'), room('neo-own-hour')] }] }),
    ch('Leave it. Bring another.', on(`The Boss's chair stays, dusted, empty. Yours is beside it: a kitchen chair, from the Yateses' shop. The Return has two chairs, and uses the plain one.`, 'neo-own-hour', flag('neo-own-two-chairs'))),
    ch('"Sabela. You sit."', on(`She won't. Then she does. Her feet don't reach. ${say('Sabela', `...It's comfortable. I'd have thought it'd be— I don't know what I thought.`)} She's the base's first officer.`, 'neo-own-hour', flag('neo-own-sabela'))),
    ch('Give it to the boy.', on(`The Heir, at the door: "I don't want his chair." "It's not his. It was on a handcart in the rain for four days. It's Archer's." He sits on the arm. The one with the mark.`, 'neo-own-hour', flag('neo-own-heir'))),
  ], { cast: [GRUNT], tint: '#2e2a22' }),
  step('neo-own-hour', 'The First Hour', `Four at the door. ${say('Ariana', `I've run this firm in everything but name for three years. I'm not asking for the name. I'm asking to be asked.`)} ${say('Petrel', `Who d'you want me to be?`)}`, [
    ch(`"Ariana: what would you do first?" "Petrel: nobody. Find out who that is."`, on(`${say('Ariana', `Stop selling tails. Today. It's bad business and it's worse than that.`)} Petrel is frightened. He's delighted.`, 'neo-own-hour-2', flag('neo-own-asked'))),
  ], { cast: ['trainer.pr/ariana', 'trainer.pr/petrel'] }),
  step('neo-own-hour-2', 'The First Hour', `${say('Proton', `I'll resign.`)} Behind him, Mika: ${say('Mika', `It's "Boss" now. Isn't it. I've a speech.`)}`, [
    ch(`"No, Proton. You'll be the one who says 'stop.' You know what it looks like. That's the job now."`, on(`He nods, once. Mika has only got two words of her speech left. ${say('Mika', `...Thank you.`)}`, 'neo-own-signal')),
  ], { cast: ['trainer.pr/proton', GRUNT] }),
  step('neo-own-signal', 'The Four Decisions: The Signal', `The mast on the barge at the Lake of Rage, still humming.`, [
    ch('Dismantle it.', on(`Tobi takes it apart, properly this time.`, 'neo-own-tails', flag('neo-own-signal-off'))),
    ch('Keep the Tower, honestly.', on(`The Tower stays yours, and says only what's so.`, 'neo-own-tails', flag('neo-own-signal-tower'))),
    ch('Keep the pulse.', on(`The Lake of Rage keeps going red. Nobody says anything to you about it, which is worse.`, 'neo-own-tails', flag('neo-own-signal-pulse'), ...kind(-1))),
  ], { cast: [GRUNT] }),
  step('neo-own-tails', 'The Four Decisions: The Tails', `Ariana's ledger, open at the tails.`, [
    ch('Stop.', on(`Ariana closes the ledger. "Today, then."`, 'neo-own-celebi', flag('neo-own-tails-stop'), ...kind(1))),
    ch(`"Shed tails only." (They do drop, in season.)`, on(`The Well keepers grumble, and agree.`, 'neo-own-celebi', flag('neo-own-tails-shed'))),
    ch('Carry on.', on(`Proton looks at you, and says "stop," as is now his job. You carry on anyway.`, 'neo-own-celebi', flag('neo-own-tails-on'), ...kind(-1))),
  ], { cast: ['trainer.pr/ariana'] }),
  step('neo-own-celebi', 'The Four Decisions: Celebi', `The Dark Ball, on a cushion, in the chair room.`, [
    ch('Break the Ball.', on(`Celebi is free.`, 'neo-own-call', flag('celebi-free'))),
    ch('Give it to Kurt, to open in his own time.', on(`Kurt takes it in both hands, and doesn't say thank you, and comes back the next day to say it.`, 'neo-own-call', flag('celebi-free'), flag('neo-own-kurt'))),
  ], { cast: ['boss.kurt'], pokemon: 'celebi' }),
  step('neo-own-call', 'The Four Decisions: The Call', `Noon tomorrow, the Tower will say "Team Rocket. Standing by." as it has for three years.`, [
    ch('End it.', out(`Noon comes, and the Tower plays music. ${OWN_AFTER} ${EPILOGUE.own}`, story({ beat: true }), story({ end: 'allied' }), flag('neo-ending-own'), flag('neo-own-call-ended'))),
    ch('Change it.', out(`You write what it says now. It's read at noon, every day: the team's motto. ${OWN_AFTER} ${EPILOGUE.own}`, story({ beat: true }), story({ end: 'allied' }), flag('neo-ending-own'), flag('neo-own-call-changed'))),
  ], { cast: [GRUNT] }),
];

// A lost duel: "Not today. Executive, then." The Carry it out ending, from its Verdict, on the duel's own map.
own.push(step('neo-own-lost', 'The Verdict', `Your lead is down. Archer switches the microphone off. ${say('Archer', `Not today. Executive, then.`)}`, [ch('Take the coat he gives you.', PLAN_END(`He holds out a white-trimmed coat, not his.`))], { cast: [ARCHER] }));

// ---------- Team Static: the third option ----------
const STATIC = { cast: ['trainer.gentleman'], tint: '#1e2a2e', effect: 'sparkle' };
const sb = (n: number): Json => flagIs(`static-broadcast-${n}`);
const staticEnd = (text: string): Json => out(`${text} The Return isn't beaten. It's gone off the air. The Tower is Mary's. The pirate band stays up, because the Director doesn't trust a station with only one voice on it. ${EPILOGUE.static}`, story({ beat: true }), story({ end: 'exposed' }), flag('celebi-free'), flag('neo-ending-static'));
const staticEvents: Json[] = [
  ev('static-founding', 'Team Static', 'Evil Teams', { callback: true, requires: [...neo({ after: 3, ends: ['none'] }), flagIs('neo-offer-refused'), flagIs('neo-lance-met', 0, 0), flagIs('rocket-return-lance-ally', 0, 0), flagIs('rocket-return-director-known'), { kind: 'period', in: ['night'] }], ...STATIC },
    `A houseboat on the canal at Goldenrod, with a washing line that's actually an aerial. A man of seventy in a cardigan, and a camp stove. ${say('The Director', `I let myself out. Forty years in that building; I know which door they haven't found. They've a fellow in my office wearing my face. He's got my walk wrong. I shuffle. He strides.`)} ${say('The Director', `I've forty years of knowing how to run a station, and a tower I can't go back to. You've a way of turning up where things are happening. Let's be a nuisance.`)}`,
    [
      ch('"What sort of nuisance?"', out(`${say('The Director', `The true sort. Out loud, where everyone can hear.`)} He paints it on the hull that week: "Say what's true, out loud, where everyone can hear." The call sign is a kettle whistling. Within the week there's a crew: the Director (voice: "I won't broadcast a thing I haven't checked twice."), Buena from the password show (heart: "There's always cake."), Tobi Northcott, demoted for mercy, who walked (hands: "I won't make it look broken. I'll break it."), and the Yateses from the souvenir shop (eyes: "We don't ask."). They've been listening through the floor for three years. They know everything.`, mark('third'), flag('static-founded'))),
      ch('"With what?"', out(`He lifts a tarpaulin. A transmitter the size of a suitcase, older than you. ${say('The Director', `My first. 1961. It reaches about as far as you can shout. We'll need to shout from a great many places.`)} Within the week there's a crew, and a kettle for a call sign.`, mark('third'), flag('static-founded'))),
      ch(`"Who's listening?"`, out(`${say('The Director', `Nobody, yet. That's the beauty of it. Everyone who listens will have chosen to.`)} The Yateses come aboard with a tray. Tobi comes with a soldering iron. Buena brings cake.`, mark('third'), flag('static-founded'))),
    ]),
  // Broadcast 1. "This Is Mary": a door of three rooms (ps_static_mary).
  ev('static-broadcast-1', 'Broadcast 1: This Is Mary', 'Evil Teams', { requires: [...neo({ after: 4, has: 'third' })], ...STATIC },
    `The Black Hour. Midnight. Mary's reading Rocket's coded orders under guard. Static is going to jam it, from a van in the Tower's own car park, and put her through on the pirate band instead. ${say('The Director, in the van, with headphones', `She's saying "the kettle's on at the usual place." That's Olivine. I've had the code since week two; it's the shipping forecast with the sea areas swapped. Amateurs.`)}`,
    [ch('Get the suitcase to the roof of the car park.', out(`It's heavier than it looks.`, room('static-mary-roof')))]),
  ev('static-mary-roof', 'The Car Park Roof', 'Evil Teams', { room: true, ...STATIC },
    `The top level of the car park, in the rain, with a suitcase and a hundred feet of cable. Tobi is turning a dial very slowly.`, [
      ch('Hold it while Tobi finds the frequency.', fight(`A Signal Technician has found you first, with a Noctowl.`, ps(trainer('Signal Technician', { size: 3, lv: 1, types: ['flying', 'electric'], win: [room('static-mary-switch')] })))),
    ]),
  ev('static-mary-switch', 'The Switch', 'Evil Teams', { room: true, ...STATIC },
    `Tobi has it. ${say('Tobi', `There. Your hand. You do it.`)}`, [
      ch('Throw the switch.', out(`Every radio in Johto: a whistle, like a kettle. ${say('Mary, who can hear it in her headphones, and knows what it is', `...This is Mary. Not the one you've been hearing. The real one. I'm on the third floor of the Radio Tower. The weather's been wrong for a month, and I'm sorry. Here's what the forecasts meant.`)} She reads the code, decoded, for four minutes. Then the guard's hand is on her shoulder, and she's still talking. By morning there's a queue at the Tower's front desk, of people who'd like to speak to Mary, please, and aren't leaving. She walks out through them, and comes to the houseboat. ${say('Mary', `I won't read a script I didn't write. Never again.`)}`, flag('static-broadcast-1'), flag('static-mary'), ...kind(1))),
    ]),
  ev('static-broadcast-2', 'Broadcast 2: The Price of a Tail', 'Evil Teams', { requires: [...neo({ after: 5, has: 'third' }), sb(1)], ...STATIC, cast: ['boss.kurt'], pokemon: 'slowpoke' },
    `The Slowpoke Well itself. Kurt, with a bad back, carrying the aerial. ${say('Kurt', `I've shouted at them for a month. I've a voice that carries to my own front gate. Give me that thing.`)}`,
    [
      ch('Give him the microphone.', out(`${say('Kurt, on air, to the whole of Johto', `A million. That's what they're charging. D'you know what it costs the Slowpoke? Ask it. Here.`)} He holds the microphone to Old Yawn. It yawns. It's the longest, saddest, most reasonable sound anyone's heard on a wireless. ${say('Buena, afterwards', `Password for today is "TAIL." Say it back. It's worth a prize. The prize is: don't buy one.`)} It rains on Azalea. No shop in Johto will stock them now.`, flag('static-broadcast-2'), flag('tails-unsold'), ...kind(1))),
    ]),
  // Broadcast 3. "Not Known at This Address": the player writes it, three lines of five.
  ev('static-broadcast-3', 'Broadcast 3: Not Known at This Address', 'Evil Teams', { requires: [...neo({ after: 5, has: 'third' }), sb(1), { kind: 'period', in: ['night'] }], ...STATIC, cast: ['trainer.pr/clerk_f'] },
    `The hardest one. It's addressed to Archer. ${say('The Yateses, who have been listening through the floor', `He pawned his mother's ring in the spring. He doesn't know we know. He brings the tea tray back every single night. We'd like to say something to him. We don't know how.`)} You write it: three lines, from five.`,
    [
      ch(`"Mr. Archer. This is the shop upstairs." / "We know about the watch, and the flat, and the ring."`, out(`Two lines down.`, flag('static-line-shop'), flag('static-line-ring'), room('static-letter-close'))),
      ch(`"Mr. Archer. This is the shop upstairs." / "He isn't coming. You've known a year. So have we."`, out(`Two lines down.`, flag('static-line-shop'), flag('static-line-coming'), room('static-letter-close'))),
      ch(`"We know about the watch, and the flat, and the ring." / "He isn't coming. You've known a year. So have we."`, out(`Two lines down.`, flag('static-line-ring'), flag('static-line-coming'), room('static-letter-close'))),
    ]),
  ev('static-letter-close', 'Not Known at This Address', 'Evil Teams', { room: true, ...STATIC, cast: ['trainer.pr/clerk_f'] },
    `And the last line.`, [
      ...([[`"You fed a hundred and fifty people every Friday for three years. You did. Not him."`, 'fed'], [`"The chair's only a chair. Come up and have a candy bar."`, 'chair']] as const).map(([label, k]) => ch(label,
        out(`It goes out at midnight, on the pirate band, to one listener. In the chair room, a radio's on. Nobody ever finds out what he did when he heard it. In the morning the tea tray's come back, as always. There's a note on it: "Thank you. Noon. I have to see it through. — A."`, flag(`static-line-${k}`), flag('static-broadcast-3'), flag('static-archer-heard'), ...kind(1)))),
    ]),
  // The climax: "Two Frequencies" (ps_static_air), at Noon, in place of the Final Choice.
  ev('static-two-frequencies', 'Two Frequencies', 'Evil Teams', { callback: true, requires: [...neo({ beat: 6, has: 'third', inside: false })], ...STATIC, tint: TOWER },
    `Noon. The Tower broadcasts the Call. The houseboat broadcasts everything else. On the same frequency. ${say(`Archer's voice, from the Tower`, `Giovanni. Team Rocket calls you home.`)} ${say(`Mary's, from a canal`, `This is Radio Static. Here's the news. It's true; we checked it twice.`)} The map of Johto, with two rings spreading over it. Town by town, each radio picks one. A town with a kindness in it tunes to the kettle. A town you walked through tunes to the Tower.`,
    [ch('Listen.', out(`The Call goes out whole. Nothing answers. Static reads that out too: "Twelve-oh-four. No reply." It's the truth. That's the job.`, flag('static-air-tower'), room('static-air-roof')), {
      branches: [
        { when: [flagIs('kind-total', 8)], text: `Most of Johto is on Static. In the Tower, the Grunts have the pirate band on, in the corridor, turned up. Archer is speaking to an empty frequency. He stops, mid-sentence. He listens. He hears Mr. Sallow, on the houseboat, singing the closing-time song, with the words explained.`, effects: [flag('static-air-most'), room('static-air-roof')] },
        { when: [flagIs('kind-total', 4, 7)], text: `It's even. The two signals cross; for a minute every radio in Johto is playing both. Then Old Yawn yawns into the microphone, and it rains, and Static's the one that carries.`, effects: [flag('static-air-even'), room('static-air-roof')] },
      ],
    })]),
  ev('static-air-roof', 'The Roof', 'Evil Teams', { room: true, ...STATIC, tint: ROOF, pokemon: 'celebi' },
    `Not a raid. The Director, Mary, Kurt, Tobi, the Yateses with a tray. And the man in the iron mask. ${say('The man in the iron mask', `What's this? A tea party?`)} ${say('Mrs. Yates', `Would you like a candy bar, dear? You look as though nobody's offered you anything in years that you hadn't to take.`)} He doesn't know what to do with it.`, [
      ch('Battle.', fight(`At the third ring, Kurt says the name.`, marauder({ win: [room('static-air-after')] }))),
    ]),
  ev('static-air-after', 'Off the Air', 'Evil Teams', { room: true, ...STATIC, cast: [ARCHER], tint: ROOF, pokemon: 'celebi' },
    `Celebi is free. The roof is quiet, apart from a kettle somebody has brought up on the camp stove.`, [
      ch('Go down.', staticEnd(`Archer isn't on the stair. You find him later, in the chair room, with the radio off, and he lets you make the tea.`), { branches: [{ when: [flagIs('static-archer-heard')], ...staticEnd(`Archer is on the stair. ${say('Archer', `I heard you. Last night. On the little band. I'd have had the door, and I'd have stood in it for ever, and you sent me a tea tray.`)} He's laughing. It's not a sound he's used. ${say('Archer', `Come down. All of you. I'll put the kettle on. I've only ever been any good at making a room ready.`)}`) }] }),
    ]),
];

(own[2] as Json).remembers = [
  { id: 'gate', when: [flagIs('petrel-gate')], notice: `"Who d'you want me to be?" has a new answer now. ${say('Petrel', `The one from the gate.`)}` },
  { id: 'list', when: [flagIs('ariana-list')], notice: `Ariana has the list from the shoebox in her hand. Item one: find honest income.` },
];
(staticEvents[3] as Json).remembers = [{ id: 'listener', when: [flagIs('neo-listener-promise')], notice: `Afterwards you tell Mary: "There's a girl of seven who's written you nine letters." ${say('Mary', `...That's who they're from. They're pinned over my desk. They were the only post that wasn't orders.`)}` }];

export const EVENTS: Json[] = [finalChoice, ...plan, ...turn, ...lance, ...own, ...staticEvents];
export const REMOVE: string[] = [];
