// Catalog Overhaul Pack, Evil Teams Volume III: Johto, Team Rocket's Return from inside (EVIL_TEAMS_VOLUME_3_A "Johto",
// TEAM_ROCKET_JOHTO_FULL_1 part II, FULL_3 parts B and C). Three years on: no Boss, four Executives keeping a dead man's
// chair warm. The Offer, the five Acts, the six Operations, Friday in Mahogany and the inside-only scenes, the loyalty
// test and being found out. The Final Choice at Noon, the endings and Team Static are in evil-story-10.ts; the twelve
// scenes for any player in evil-story-11.ts. The player's radio name is "Standby". Kanto's ending (same run) is read.
import { $, ch, ev, fight, flag, flagIs, inRegion, out, room, type Json } from '../dsl.ts';
import { evil as story, foe, kind, prompt } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-story';

const R = teamJson('rocket');
const GRUNT = R.ranks.grunt.sprite;
const EXEC = R.ranks.executive.sprite;
const TINT = R.color;
const MESS = '#2e2a22';
const J = inRegion('johto');
const say = (who: string, line: string): string => `${who}: "${line}"`;
const inside = (o: Json = {}): Json[] => [{ kind: 'evil', team: 'rocket', inside: true, ...o }, J];
const mark = (m: string): Json => story({ mark: m });
const meters = (standing: number, suspicion = 0, rank?: number): Json => story({ ...(standing ? { standing } : {}), ...(suspicion ? { suspicion } : {}), ...(rank ? { rank } : {}) });
const beat = story({ beat: true });
const quiet = (): Json[] => [meters(1, 1), ...kind(1)];
/** Kanto's Boss was met or beaten earlier this run (Kanto's inside route, or its team story ended). */
const sawHim = flagIs('team-rocket-beaten');

// ---------- The Offer (after Slowpoke Well) ----------
const offered = flag('neo-offered');
const OFFER = `A man in a bad disguise as a well-digger leans on his shovel. ${say('Petrel', `You're good. We're short of good. We've got loyal. Loyal's all we've got. Three years of loyal and not one of us can read a map.`)} ${say('Petrel', `I'll be honest, which I never am: there's no Boss. There's a chair. We polish it. We're going to take a radio tower and call him home on every wireless in Johto, and if he doesn't come, I don't know what we are. Come and find out with us. It's steady work till then.`)}`;
const offer = ev('evil-rocket-offer-johto', 'The Offer', 'Evil Teams', { room: true, cast: [EXEC], tint: TINT, effect: 'glint' }, OFFER, [
  ch('"Yes."', out(`${say('Petrel', `Lovely. Mahogany. The souvenir shop. Don't buy anything; it confuses them.`)} You're with the Return now, on the inside.`, mark('inside'), offered)),
  ch('"No."', out(`${say('Petrel', `Shame. You'd have made a lovely Grunt.`)} He shoulders the shovel and goes, whistling something about closing time.`, flag('neo-offer-refused'), offered)),
  ch('"Yes." (And tell Lance.)', out(`You say yes to Petrel. That night a man in a cape lands on the roof of the Pokémon Center as if he owned it. ${say('Lance', `Inside, then. Tell me what they do. I'll decide what's done about it.`)} You have a handler. Every careless step counts double.`, mark('inside'), mark('inside-man'), flag('neo-lance-met'), offered)),
]);

// ---------- Act 1. Keeping the Chair (stage 3) ----------
const act1: Json[] = [
  ev('neo-act1', 'Keeping the Chair', 'Evil Teams', { callback: true, requires: inside({ beat: 2 }), cast: ['trainer.pr/clerk_f'], tint: MESS },
    `A souvenir shop in Mahogany. Rage Candy Bars in a pyramid. ${say('Mrs. Ferelith Yates', `You're for downstairs. I can tell; you didn't look at the price. It's the poster of the Gyarados. Push the eye.`)} ${say('Mr. Yates, from his crossword', `They pay the rent. They're no trouble. The tall one brings back the tea tray. We don't ask. We make a very good candy bar.`)} Stairs; a corridor; coffee and floor polish; a woman with a clipboard and a duster. ${say('Quartermaster Sabela Kilbride', `Hopeful. One question, and it's the only one that matters. Did you see him?`)}`,
    [
      ch('"No."', out(say('Sabela', `Nor did most. You'll be told what he was like. Believe about half.`), room('neo-chair-room'))),
      ch('"Once."', out(`She puts the duster down. ${say('Sabela', `...You saw him. What was he wearing? No. Don't tell me here. Tell me in the mess, Friday, where the old ones can hear.`)} Old Rocket treat you as one of theirs from then on.`, flag('neo-saw-him'), room('neo-chair-room')), { requires: [sawHim] }),
      ch('"I fought him."', out(`A very long look. ${say('Sabela', `Then you know he can lose. Don't say that downstairs. They've only got the one thing.`)} Ariana will want a word.`, flag('neo-saw-him'), meters(0, 1), room('neo-chair-room')), { requires: [sawHim] }),
      ch('"Who?"', out(say('Sabela', `Good. Keep that face. You'll go far, or you'll be out by Friday.`), room('neo-chair-room'))),
    ]),
  ev('neo-chair-room', 'The Chair Room', 'Evil Teams', { room: true, cast: ['trainer.pr/clerk_f'], tint: MESS },
    `She unlocks a door with a key on a ribbon. A desk; a lamp; a bowl on the floor with fresh water in it; a black leather chair, turned a little toward the window that isn't there. ${say('Sabela', `From Viridian. The real one. Mr. Archer brought it himself, on a cart, in the rain. There's a mark on the arm. Don't touch the mark.`)} She dusts it. She doesn't dust the mark. ${say('Sabela', `Every morning. Twenty minutes. If he walked in tomorrow, he'd find it as he left it. That's the whole of my job, and I'll not hear it called small.`)}`,
    [
      ch('"Why the water?"', out(say('Sabela', `For the Persian. He'd not come without the Persian.`), room('neo-dormitory'))),
      ch('"Has anyone ever sat in it?"', out(say('Sabela', `Mr. Petrel. Once. In a wig. I didn't speak to him for a month, and he brought me flowers every day of it, and he's never done it again.`), room('neo-dormitory'))),
      ch('"May I?" (The duster.)', out(`She hands it over. It's the first test. You dust the room, every corner, and leave the mark. She says nothing, and unlocks the dormitory.`, meters(1), room('neo-dormitory')), { prompt: prompt('brace-hold'), fail: out(`Your sleeve brushes the arm of the chair, right across the mark. Sabela takes the duster back without a word, and unlocks the dormitory.`, flag('neo-mark-touched'), room('neo-dormitory')) }),
    ]),
  ev('neo-dormitory', 'The Dormitory', 'Evil Teams', { room: true, cast: [GRUNT], tint: MESS },
    `A girl of fourteen sits on a bunk under a hand-coloured poster of the Boss. ${say('Mika Everleigh', `You're new! I'm Mika. I've been here a year. I was eleven when the Tower fell. My brother was a Grunt. They fed him. Nobody else was feeding him. He's coming back. Archer says. There's a broadcast, and he'll hear it, and he'll come. I've got a speech. In case I meet him. It's two words. It's "Thank you." I'm working on a third.`)}`,
    [
      ch('"What did he do for you?"', out(say('Mika', `Nothing. I never met him. My brother was a Grunt. They fed him.`), room('neo-pressing'))),
      ch(`"What if he doesn't come?"`, out(`She laughs, as at a joke. ${say('Mika', `He will. Why would there be a chair?`)}`, room('neo-pressing'))),
      ch(`"What's the third word?"`, out(say('Mika', `I'll know it when I've got it.`), room('neo-pressing'))),
      ch(`"Where's your brother now?"`, out(say('Mika', `He went home. After. He's got a job in a cannery. He says it's fine. He says it like that: "It's fine." I didn't want "fine."`), room('neo-pressing'))),
    ]),
  ev('neo-pressing', 'Pressing Day', 'Evil Teams', { room: true, cast: [GRUNT, GRUNT], tint: MESS },
    `No crates. Pressing day: forty uniforms, one iron, and an old Grunt who shows how. ${say('Mr. Jericho Sallow', `Collar first. Then the R. Never iron over the R; it shines. He hated a shiny R. I saw him say so. Corridor B, third floor, a Tuesday. He was wearing grey.`)} ${say('Mika', `Mr. Sallow saw him.`)} When she's gone for hangers, Mr. Sallow says, quietly: "I saw the back of his head for four seconds. I've been dining out on it for three years. Don't tell the choir. It's all some of them have got."`,
    [
      ch('Iron round the R.', out(`Forty collars, forty Rs, none of them shiny. Mr. Sallow nods once.`, beat)),
      ch(`"I won't tell."`, out(say('Mr. Sallow', `Good lad. Good lass. Whichever. Collar first.`), beat)),
    ]),
];

// ---------- Act 2. Red Water (stage 4) ----------
const act2: Json[] = [
  ev('neo-act2', 'Red Water', 'Evil Teams', { callback: true, requires: inside({ beat: 3 }), cast: [GRUNT, GRUNT], pokemon: 'magikarp', tint: '#4a1a1a', effect: 'rain' },
    `The Lake of Rage is the wrong colour. A flat boat sits in the middle of red water, a humming mast on it, and round the barge the lake boils with Magikarp, thrashing, each one too big for itself. ${say('Tyson, with a clipboard', `Pulse every ninety seconds. They evolve in a week instead of a year. We net them at the weir. It's a job. Somebody runs it. Today that's your squad.`)} The squad: Mika, and a man of twenty-five with one stripe unpicked from his sleeve. ${say('Tobi Northcott', `Demoted. Slowpoke Well. I wouldn't do the tails. Proton said, "It grows back." So does a fingernail. I'd still rather you asked.`)} ${say('Mika', `It's for the funds. Archer says. Gyarados sell.`)} The pulse: twenty Magikarp jump, and land wrong. A fisherman rows out, furious, and says it anyway: sixty years on this lake. Then the mast's dial is in front of you.`,
    [
      ch('Keep it at full.', out(`The count's made. Twelve Gyarados at the weir by evening. Tyson's pleased. Mika doesn't eat.`, meters(2, 0, 2), flag('neo-lake-full'), room('neo-act2-stuck'))),
      ch(`Turn it down to half; nobody'll check.`, out(`Six. ${say('Tyson', `Slow day.`)} He writes it. He doesn't look at the dial.`, meters(1, 1, 2), flag('neo-lake-half'), room('neo-act2-stuck'))),
      ch('"Tobi. Can it be made to look broken?"', out(`${say('Tobi', `I've been making it look broken every third night for a month. I thought nobody'd noticed. Welcome to the squad.`)} He does something with a coin and a fuse. The mast hums, and does nothing. The count's nil. Tyson radios Proton.`, meters(0, 2, 2), flag('neo-lake-broken'), room('neo-act2-stuck'))),
    ]),
  ev('neo-act2-stuck', 'Red Water', 'Evil Teams', { room: true, cast: [GRUNT, GRUNT], pokemon: 'magikarp', tint: '#4a1a1a', effect: 'rain' },
    `One Magikarp isn't evolving. It's being evolved. It's got halfway and stuck: one eye huge, a fin too long. It's against the barge, not thrashing now, looking at Mika. Whatever the dial says, it's too late for it to go back, and too soon to go on. ${say('Mika', `We can't leave it like that.`)}`,
    [
      ch('Let it finish. Turn the mast on it, once, gently.', out(`One pulse, aimed. It finishes. A Gyarados, red, exhausted, alive. It doesn't rage. It lies on the surface, looking at Mika. It will remember who stayed.`, flag('neo-red-gyarados'), beat)),
      ch(`Get it out of the water and into a Ball. Mika's.`, out(`It's Mika's: the first Pokémon she's had that wasn't issued. She won't put it in the tally.`, ...kind(1), flag('neo-mika-karp'), beat)),
      ch('"Rule three."', out(`"Nobody touches the children. That one's a month old." ${say('Tobi', `...Whose rule's that?`)} Mr. Sallow, on the radio, who's been listening: "Hers. Madame's. I'd forgotten it had words. Tyson. Shut it off." ${say('Tyson', `It's not in my brief.`)} ${say('Mr. Sallow', `It was in ours.`)} The twelve Old Rocket on the shore have stopped work. The mast goes quiet.`, flag('neo-rule3-spoken'), ...kind(1), beat), { requires: [{ kind: 'flag', key: 'rocket-rules-heard', atLeast: 1, atMost: 99 }] }),
      ch('"Rule three." (Mr. Sallow told you.)', out(`"Nobody touches the children. That one's a month old." Mr. Sallow, on the radio: "Hers. Madame's. I'd forgotten it had words. Tyson. Shut it off." The twelve Old Rocket on the shore have stopped work. The mast goes quiet.`, flag('neo-rule3-spoken'), ...kind(1), beat), { requires: [flagIs('neo-saw-him')] }),
    ]),
];

// ---------- Act 3. The Dress Rehearsal (stage 5): a door of four rooms (ps_neo_tower) ----------
const act3: Json[] = [
  ev('neo-act3', 'The Dress Rehearsal', 'Evil Teams', { callback: true, requires: inside({ beat: 4 }), cast: [EXEC], tint: '#2a2a3a' },
    `Goldenrod. The Radio Tower is giving tours. The Director greets each group himself, and salutes with the wrong hand. Petrel, as the Director, without moving his lips: ${say('Petrel', `Standby. You're "new programme assistant." Basement, studio three, the roof. It's a walk-through for noon on the day. Don't touch anything that's lit.`)}`,
    [ch('Start in the basement.', out(`The stairs down smell of dust and old tape.`, room('neo-tower-basement')))]),
  ev('neo-tower-basement', 'The Basement', 'Evil Teams', { room: true, cast: ['trainer.gentleman'], tint: '#2a2a3a' },
    `A store room. A camp bed. A man of seventy in a cardigan, with a book. ${say('The real Director', `Ah. A new one. Do sit. I don't mind the kidnapping. I've had a dull career. I mind the pills. Heart. Twice a day, the small white ones. The young man with the scowl said he'd see to it. That was Tuesday.`)} It's Friday.`,
    [
      ch('Fetch the pills.', out(`His flat, four streets off: a cat, forty years of programme schedules, bound, and the pills on the kitchen table, where he said. Back in the basement he takes two, and holds your wrist a moment. "I'll remember the face. I'm good with faces; I did television." Proton has noticed you were gone.`, meters(0, 2), flag('neo-director-pills'), room('neo-tower-studio'))),
      ch('Let him out the back, and tell Proton he escaped.', out(`He won't go. "And leave Mary upstairs with them? I'm the Director. I direct. From here, if I must."`, meters(0, 1), flag('neo-director-out'), room('neo-tower-studio'))),
      ch(`"He stays. The plan's the plan."`, out(`He nods. "Then would you at least tell me the cricket score."`, meters(1), flag('neo-director-stays'), room('neo-tower-studio'))),
      ch('"Which young man?"', out(`Proton. Who's been bringing him a newspaper every day, and reading him the crossword clues through the door, and forgot the one thing that mattered.`, flag('neo-proton-papers'), room('neo-tower-studio'))),
    ]),
  ev('neo-tower-studio', 'Studio Three', 'Evil Teams', { room: true, cast: ['trainer.pr/clerk_f', GRUNT], tint: '#3a1a1a' },
    `A red light. A desk. A young woman at a microphone, with a script, and a Grunt behind her chair. ${say('Mary, on air, bright as a bell', `...and that's the weather! Sunny all day. Stay indoors anyway; it's lovely indoors. And now a message for our friends on the late shift: the kettle's on at the usual place.`)} The light goes off. Her hands are shaking so hard that the script rattles. ${say('Mary', `Are you one of the kind ones or one of the others? I've stopped being able to tell. You all say "please."`)}`,
    [
      ch('"One of the kind ones."', out(`"That's what the last one said," she says, but she stops shaking.`, room('neo-tower-library'))),
      ch(`"What does 'the kettle's on' mean?"`, out(say('Mary', `It means a lorry's at Olivine. I've been reading your timetable to the whole of Johto for a month, and they think I'm doing the shipping forecast.`), flag('intel', 2), room('neo-tower-library'))),
      ch(`"Read something true. Once. I'll say the tape slipped."`, out(`The red light. She breathes in. ${say('Mary', `This is Mary. The weather's actually rain. I'm sorry. I've been told what to say. If you can hear this: I'm all right. I'm on the third floor.`)} The light. Every radio in Johto has heard it.`, meters(0, 3), flag('neo-mary-spoke'), room('neo-tower-library'))),
    ]),
  ev('neo-tower-library', 'The Record Library', 'Evil Teams', { room: true, cast: [GRUNT], tint: '#2a2a3a' },
    `Forty years of jingles. A Signal Technician asleep in a chair. On a shelf, a cassette with no label, and a smell of hair oil.`,
    [
      ch('Play it.', out(`The Carrier Beat, alone, with no speech over it. It's a very good dance track. You pocket the cassette.`, flag('intel', 2), flag('neo-cassette'), room('neo-tower-roof'))),
      ch('Leave it, and go up.', out(`The technician snores on.`, room('neo-tower-roof'))),
    ]),
  ev('neo-tower-roof', 'The Roof', 'Evil Teams', { room: true, cast: [], tint: '#1a1a2a' },
    `The great dish. A man in an iron mask leans on the rail, eating an apple, and isn't on anyone's list. ${say('The man in the iron mask', `Ha! A child. He's sending children up to look at me now. Do you know what I am, child? I'm a line item. "Consultancy." He paid half up front. Half! For a thing he doesn't understand and I do. Go and tell your sad man in the nice coat that the Marauder's had a look at his roof, and it'll hold.`)} He throws the apple core off the building, and doesn't watch it land.`,
    [
      ch(`"What's he paying you for?"`, out(`${say('The Marauder', `To bring him a door. He thinks it opens his way. Doors open the way they open.`)}`, flag('intel', 3), flag('neo-marauder-seen'), beat)),
      ch('"Who are you?"', out(`"Nobody you'll see twice," he says, and you're quite sure that's a lie.`, flag('neo-marauder-seen'), beat)),
      ch('(Say nothing; go back down.)', out(`You go back down. Behind you, he's laughing at something.`, beat)),
    ]),
];

// ---------- Act 4. Not Known at This Address (stage 6) ----------
const asked = (k: string): Json => flagIs(`neo-asked-${k}`, 0, 0);
const ask = (k: string, label: string, text: string, back: string, need: Json[] = [], ...fx: Json[]): Json => ch(label, out(text, flag(`neo-asked-${k}`), ...fx, room(back)), { requires: [asked(k), ...need] });
const ARCHER_A = (): Json[] => [
  ask('after', '"And the day after?"', `He's quiet. ${say('Archer', `That's what the man in the mask is for.`)}`, 'neo-act4-talk'),
  ask('mask', `"What's the man in the mask for?"`, say('Archer', `There's a thing in Ilex Forest that goes where it likes in time. He can hold it. I've paid him to. If the Boss doesn't answer at noon, I shan't ask again. I'll go and fetch. Three years back. The lobby at Silph. There was a child at the door, that night, who went up the stairs and ended it. I'll stand in the door. That's all. I'll simply stand in it.`), 'neo-act4-talk'),
  ask('cost', '"What did it cost?"', `He turns out his pockets. A pawn ticket. Another. Another. ${say('Archer', `A watch. A flat. My mother's ring; that was this spring. The half up front was the ring. I've the coat. I'll not pawn the coat. He gave me the coat.`)}`, 'neo-act4-talk'),
  ch('Ask about him.', out(`He looks out at Goldenrod, every window lit.`, room('neo-act4-him'))),
];
const ARCHER_B = (): Json[] => [
  ask('want', '"What would he have wanted?"', say('Archer', `Profit. He'd have shut us down in a week. We don't make any. I know that. I kept his chair and I've run his firm into the ground with love. He'd be appalled.`), 'neo-act4-him'),
  ask('truth', '"Tell them the truth."', say('Archer', `I'll tell them at noon, one way or the other. Either he answers, and it was true all along. Or I'll have gone to fetch him, and it won't matter what was true.`), 'neo-act4-him'),
  ch('Let him say what he came up here to say.', out(`He holds out a script.`, room('neo-act4-script'))),
];
const act4: Json[] = [
  ev('neo-act4', 'Not Known at This Address', 'Evil Teams', { callback: true, requires: inside({ beat: 5 }), cast: [EXEC], tint: '#1a1a2a', effect: 'glint' },
    `The Radio Tower's roof, by the great dish, at night. A man in a white-trimmed coat with his back to the stairs. ${say('Archer', `Standby. Come up. Mind the cable.`)} Goldenrod, below, all lit; every window with a radio in it. ${say('Archer', `I'm going to tell you something the other three don't know. I wrote to him. A year ago. Care of the Gym. Eleven pages. I crossed out nine.`)} He takes an envelope from his breast pocket, a red stamp across it. ${say('Archer', `"Not known at this address." His own Gym. I've carried it a year. I look at the stamp when I need to remember that I'm not a fool. I'm something else. I haven't a word for it. He isn't coming. I've known for a year. I'm doing the broadcast anyway. There are two hundred people downstairs who've nothing else, and if I tell them, they've nothing at all. I'm not calling him home. I'm giving them one more day of thinking he might.`)}`,
    ARCHER_A()),
  ev('neo-act4-talk', 'Not Known at This Address', 'Evil Teams', { room: true, cast: [EXEC], tint: '#1a1a2a' }, `He waits, the envelope still in his hand.`, ARCHER_A()),
  ev('neo-act4-him', 'Not Known at This Address', 'Evil Teams', { room: true, cast: [EXEC], tint: '#1a1a2a' }, `The wind pulls at his coat.`, ARCHER_B()),
  ev('neo-act4-script', 'The Script', 'Evil Teams', { room: true, cast: [EXEC], tint: '#1a1a2a' },
    `${say('Archer', `You'll read it. The Call. They've heard my voice for three years; it's got the pleading in it now, and they can tell. They'll believe it from somebody new. That's why "Standby." That's what you've been standing by for.`)} One page. Typed. Corrected, in ink, many times, and then corrected back. At the stair's head he stops you. ${say('Archer', `The red-haired boy. Outside the shop. I leave him a coat. If he ever takes it— I'd not need the door. Do you see? I'd have somebody to make the room ready for. I'd like that better than the door. I've not said that to anyone either.`)}`,
    [
      ch(`"I'll read it."`, out(`He gives you the page. You're the fifth Executive, by his word.`, meters(0, 0, 5), mark('confided'), beat), { branches: [{ when: [{ kind: 'evil', standing: 8 }], text: `He gives you the page. "The Voice," he says. "That's what you are now."`, effects: [meters(0, 0, 6), mark('confided'), beat] }] }),
      ch(`"I'll read it my way."`, out(`"That's what I'm afraid of," he says, "and what I'm hoping for." You're the fifth Executive.`, meters(0, 0, 5), mark('confided'), flag('neo-my-way'), beat), { branches: [{ when: [{ kind: 'evil', standing: 8 }], text: `"That's what I'm afraid of, and what I'm hoping for. The Voice."`, effects: [meters(0, 0, 6), mark('confided'), flag('neo-my-way'), beat] }] }),
      ch('"Not yet."', out(`He folds the page into your hand anyway. "Noon is a long way off. Until it isn't." You're the fifth Executive.`, meters(0, 0, 5), mark('confided'), beat), { branches: [{ when: [{ kind: 'evil', standing: 8 }], text: `He folds the page into your hand anyway. "The Voice. Until noon, and after."`, effects: [meters(0, 0, 6), mark('confided'), beat] }] }),
    ]),
];
(act4[0] as Json).remembers = [{ id: 'kanto', when: [{ kind: 'flag', key: 'rocket-ending-turn', atLeast: 1, atMost: 99 }], notice: `He looks at you, properly. ${say('Archer', `...It was you. On the stairs. Sabela told me you'd fought him. I didn't ask the year. Then you'll understand that it's nothing personal, when I say I'd like you never to have gone up.`)}` }];

// ---------- Act 5. The Third Word (stage 7, then Noon) ----------
const act5: Json[] = [
  ev('neo-act5', 'The Third Word', 'Evil Teams', { callback: true, requires: inside({ beat: 6 }), cast: [GRUNT, GRUNT], tint: MESS },
    `The night before noon. The Mahogany mess: trestle tables, Old Rocket at one end, new blood at the other. ${say('Mika, with a paper folded very small', `I've got the third word. It's "sir." "Thank you, sir." Is that better? Is "sir" right? Mr. Sallow says he liked "sir."`)} ${say('Mr. Sallow, into his tea', `I said I assumed he liked "sir."`)} ${say('Tobi', `If he walks in tomorrow, d'you know the first thing he'll ask? "What have you made?" And Archer'll have to say: "Nothing, sir. We kept your chair." And I can't decide if that's the saddest thing I've ever heard or the best.`)} Ariana, in the doorway, with a file she's stopped burning: ${say('Ariana', `Standby. A word. You're reading it. I was his second for four years before Archer ever carried his coat. If you get to "calls you home" and you find you can't say it— don't. Say what's true. I'll have the studio door. Nobody'll get through me before you've finished.`)} Then it's Friday, and Old Rocket sing: a slow tune about closing time. Glasses in, lights down, mind the step, home you go. New blood stand for it. ${say('Mika, whispering', `It's the anthem.`)} ${say('Mr. Sallow, under it', `It's what the Game Corner played to get the drunks out. "Home you go." Three years I've sung it at them and not one's taken the hint.`)}`,
    [
      ch('Sing.', out(`You don't know the words. Mr. Sallow feeds them to you, a line ahead. For the length of a song, there's one team in the room.`, flag('ariana-door'), room('neo-act5-mika'))),
      ch(`Tell them what the song's for.`, out(`A silence. A new-blood Grunt laughs. Then another. Then Mika, who doesn't want to: "It's telling us to go home? For a year?" Nobody leaves. But some of them have heard it now.`, flag('ariana-door'), flag('neo-song-told'), room('neo-act5-mika'))),
      ch('Ask Old Rocket to teach them the fourth rule.', out(`${say('Mr. Sallow', `There wasn't a fourth.`)} An older woman at the end, who's never spoken: "There was. Before your time. 'Give it back when they can pay.' He took it off the wall." She chalks it up, under the three.`, flag('ariana-door'), flag('neo-rule4'), room('neo-act5-mika'))),
    ]),
  ev('neo-act5-mika', 'Lights Out', 'Evil Teams', { room: true, cast: [GRUNT], tint: '#1a1a24' },
    `${say('Mika, at lights out', `If he comes— will you stand next to me? When I say it? In case I forget the third word.`)}`,
    [
      ch(`"I'll be there."`, out(`She's asleep before you've finished saying it.`, beat, room('neo-final-choice'))),
      ch('"Mika. He might not."', out(`"He will," she says, into the pillow. "He has to. There's a chair."`, beat, room('neo-final-choice'))),
      ch('"What would you say to Archer, instead?"', out(`She's never thought of it. "...He's the one who fed us. Actually. It was always Archer with the tray." She unfolds the paper and looks at it. "I've been saying thank you to the wrong chair."`, flag('neo-mika-archer'), beat, room('neo-final-choice'))),
    ]),
];

// ---------- The six Operations (FULL_3 C) ----------
const OPS: Json[] = [
  ev('neo-op-tail-run', 'Operation: The Tail Run', 'Evil Teams', { requires: inside({ after: 2 }), cast: [GRUNT], pokemon: 'slowpoke', tint: TINT },
    `A folding table in Goldenrod. A sign: SLOWPOKE TAIL. ₽1,000,000. Sell one.`,
    [
      ch('Sell one.', out(`Nobody buys at a million. That's not the point of the price. You've "stock," and you've stood behind it all day.`, meters(1))),
      ch('Sell carved turnips.', out(`Tobi's idea; Mr. Sallow carves. ${say('Mr. Sallow, whittling', `Nobody's ever bought one. That's the trick of the million. It's not a price. It's so we can say we've stock.`)} A customer does look. A long look. "...That's a turnip." ${say('Tobi', `It's a rare tail.`)} "It's got a root." ${say('Mr. Sallow', `Regional form.`)} That night, forty real tails go back to the Well in a sack.`, ...quiet(), flag('neo-turnips'))),
    ]),
  ev('neo-op-red-lake', 'Operation: The Red Lake', 'Evil Teams', { requires: inside({ after: 3 }), cast: [GRUNT], pokemon: 'gyarados', tint: '#4a1a1a' },
    `Net the forced Gyarados at the weir.`,
    [
      ch('Net them.', out(`Twelve red Gyarados in the nets by dark. Tyson signs for them.`, meters(1))),
      ch(`Cut the nets' anchor lines.`, out(`A man in a cape is on the bank, watching the water. ${say('Lance', `You're in their colours. And you've a knife out, and you're on the wrong side of the net for someone who means to use it as a net.`)} You hold out the rope. "Hold this end." He does. Courteously. ${say('Lance', `I had intended a Hyper Beam. This is tidier.`)}`, ...quiet(), flag('neo-lance-met'))),
    ]),
  ev('neo-op-wig', 'Operation: The Wig', 'Evil Teams', { requires: inside({ after: 4 }), cast: ['trainer.gentleman'], tint: '#2a2a3a', effect: 'sparkle' },
    `Petrel's due at the Tower as the Director, and at Mahogany as himself. Be the Director for a day: a wig, a cardigan, a shuffle. The day brings a frightened sound engineer, Mary's script for tonight, a schools broadcast to be cut for Rocket's jingle, and a listener's letter about the weather being wrong.`,
    [
      ch('Do as Petrel would.', out(`You stride, as Petrel strides, and cut the schools broadcast, and pass Mary her script. Nobody notices a thing.`, meters(1))),
      ch(`Do the Director's job. Well.`, out(`You send the engineer home on full pay ("family matter"), lose Mary's script, run the schools broadcast, and answer the letter by hand, with an apology. The real Director, in the basement, hearing about it: "You answered the post? I never answered the post. You've made me a better Director than I was."`, ...quiet(), flag('neo-wig-honest'))),
    ]),
  ev('neo-op-poster-round', 'Operation: The Poster Round', 'Evil Teams', { requires: inside({ after: 4 }), cast: [GRUNT], tint: TINT, effect: 'rain' },
    `Paper six towns with the Boss's face: ROCKET'S FUTURE IS BRIGHT. ${say('Mika, with the brush, loving it', `We're doing the whole street!`)}`,
    [
      ch('Paper them.', out(`Six towns, a thousand grey faces. Mika's arms ache. She's never been happier.`, meters(1))),
      ch(`Paper them, with flour-and-water paste.`, out(`It rains. By morning, six towns have a grey man sliding slowly down every wall. ${say('Mika', `They've all come off.`)} ${say('Tobi', `Weather.`)} ${say('Mika', `It said sunny. On the wireless. Mary said.`)} One poster stays up: the one Mika coloured by hand, over her bunk.`, ...quiet())),
    ]),
  ev('neo-op-old-guard', 'Operation: The Old Guard', 'Evil Teams', { requires: inside({ after: 5 }), cast: [GRUNT], tint: MESS },
    `Collect "dues" from six retired Grunts of the first team. They owe nothing. Proton thinks they owe loyalty, in cash.`,
    [
      ch('Collect.', out(`Six front doors; six envelopes, handed over without a word.`, meters(1))),
      ch('Bring soup.', out(`Each pays in a story. A night watchman: "He sent a car for my wife, when she was ill." A widow: "My husband drove the lorry. He died not knowing. I envy him." A man with a Raticate: "I was at Silph. I saw the child go up the stairs. I stepped aside." He tells you the Tower's back stair. A tailor's apprentice gives you a thimble. A woman who won't open the door takes the soup through the letterbox, and a note comes back out: "I was the one who wrote 'the Boss.' On the ballot. I was nineteen. I'm sorry."`, ...quiet(), flag('intel', 3), flag('neo-ballot-solved'))),
    ]),
  ev('neo-op-frequency', 'Operation: The Frequency', 'Evil Teams', { requires: inside({ after: 6 }), cast: ['trainer.gentleman'], tint: '#1a1a2a' },
    `Guard the Tower's transmitter room through the night before noon. At two in the morning, a scrape at the window: a man of seventy, in a cardigan, on a ledge he's too old for, with a screwdriver. ${say('The Director', `Ah. A guard. How tiresome. I'd hoped for the one who snores.`)}`,
    [
      ch('Call it in.', out(`Two Grunts haul him in off the ledge, gently enough. The dial stays where it was.`, meters(1))),
      ch(`"I'm asleep."`, out(`You shut your eyes and breathe slowly. He turns one dial four degrees. Whatever you say into the microphone at noon, in any ending, will go out on a band nobody can switch off.`, ...quiet(), flag('neo-frequency-open'))),
      ch('"What are you doing?"', out(`${say('The Director', `Turning one dial four degrees. It won't stop your Call. It'll put it on a band where every wireless in Johto can also hear whatever's said next. I thought somebody might like the last word.`)} You let him.`, ...quiet(), flag('neo-frequency-open'))),
      ch(`"You'll fall. Come in by the door."`, out(`He comes in by the door, turns the dial anyway, and thanks you for the arm.`, ...quiet(), flag('neo-frequency-open'))),
    ]),
];

// ---------- K1. Friday in Mahogany (every stage from 3) ----------
const friday = (n: number, after: number, slip: string, extra: Json[] = []): Json =>
  ev(`neo-friday-${n}`, 'Friday in Mahogany', 'Evil Teams', { requires: inside({ after }), cast: [EXEC], tint: MESS, effect: 'sparkle' },
    `Pay day. An envelope, in Archer's own hand, to the coin. ${slip}`,
    [
      ch('Keep it.', out(`You pocket it.`, $(500))),
      ch('Put it back in the tin.', out(`You drop it back in the Friday tin, and it's seen. By the last Friday, the tin is fuller than it was paid out: the Grunts are paying the Return.`, meters(1), flag('neo-tin'))),
      ...extra,
    ]);
const FRIDAYS: Json[] = [
  friday(3, 2, `A slip: "First week. Thank you for staying." Nobody else in Rocket's history has been thanked on a pay slip.`),
  friday(4, 3, `Mr. Sallow, quietly: "I drove him to Ecruteak this morning. Don't ask what for. Spend it carefully."`),
  friday(5, 4, `It's short, by a tenth. A note: "Made up next week. My apologies. — A." If you put yours back in the tin, so do four of Old Rocket, and Mika, who doesn't know why.`),
  friday(6, 5, `Full, and last week's tenth made up. The pawnshop window in Ecruteak has a ring in it now.`),
  friday(7, 6, `Double. "For tomorrow." Mika's saving hers "to buy him something. For when he comes."`),
];

// ---------- K2 The Black Hour Shift, K3 Doing the Boss, K4 Roll Call ----------
const night: Json = { kind: 'period', in: ['night'] };
const EXTRA: Json[] = [
  ev('neo-black-hour', 'The Black Hour Shift', 'Evil Teams', { requires: [...inside({ after: 4 }), night], cast: ['trainer.pr/clerk_f'], tint: '#3a1a1a' },
    `You're posted behind Mary's chair for the midnight show. ${say('Mary, off air, not turning', `You're new. The last one hummed. I asked him to stop. He said, "Sorry, miss," and stopped. That's what I can't bear about you lot. You're polite.`)} Three scripts on the desk: the weather, wrong on purpose; "a message for the late shift," the lorry times; and a request, "for Mika, from her brother at the cannery." It came by post. Nobody was going to read it.`,
    [
      ch('Hand her all three, as they are.', out(`She reads them all. The request is the last thing on the show. ${say('Mary, on air', `...And this one's for Mika. Your brother says the cannery's "fine." He says it twice. He says he's got a bed made up.`)} Her voice has changed. In Mahogany, under a blanket, a fourteen-year-old is listening.`, flag('neo-mika-brother'))),
      ch('Write the real weather in the margin, and hand her the request.', out(`She reads your margin, not the script: "Rain." Then the request, and her voice changes. In Mahogany, under a blanket, Mika is listening.`, meters(0, 1), ...kind(1), flag('neo-mika-brother'))),
      ch('Swap two sea areas, and hand her the request.', out(`The Olivine lorry goes to the wrong dock. The request is the last thing on the show, and Mika, in Mahogany, hears that her brother has a bed made up.`, meters(0, 1), ...kind(1), flag('neo-mika-brother'))),
      ch('Leave the request out.', out(`The show ends on the shipping forecast. Mary doesn't look at you.`)),
    ]),
  ev('neo-doing-the-boss', 'Doing the Boss', 'Evil Teams', { requires: inside({ after: 5, rank: 3 }), cast: [EXEC], tint: MESS },
    `${say('Petrel', `You're reading the Call. You'll need to know what it's a call to. Sit. I'll do him.`)} He turns his back, rolls his shoulders, turns round. It isn't a wig. It's the stillness. The room's colder. ${say('Petrel, as Giovanni', `You've been keeping my chair. How touching. Tell me what you've made.`)} He holds it for five seconds. Then he's a tired man in a cardigan, sweating. ${say('Petrel', `That's all I've got. Five seconds. I've forty of tape and the back of his head. Everything else, I made up. D'you know what frightens me? It works. They cheer.`)}`,
    [
      ch('"Teach me."', out(`He teaches you the stillness. It takes all evening. You have it, once: for one line, in any ending, you could speak as him.`, flag('neo-stillness')), { prompt: prompt('brace-hold'), fail: out(`You can't quite find it. "Nobody can," he says. "That's the secret. Neither can I."`) }),
      ch('"What have you got wrong?"', out(say('Petrel', `Everything but the five seconds. I gave him a laugh. He didn't have one. I couldn't bear it.`))),
      ch('"Who do they think they\'re waiting for, then?"', out(say('Petrel', `Mine. My Boss. The one I do. He's kinder than the real one. I put that in. I couldn't help it. They're waiting for a man I invented, and Archer's bankrupting himself to send for the original, who'd sack the lot of us.`))),
    ]),
  ev('neo-roll-call', 'Roll Call', 'Evil Teams', { requires: [...inside({ after: 3 }), night], cast: ['trainer.pr/clerk_f'], tint: MESS },
    `Sabela calls the roll: the Return's one ceremony, a hundred and fifty names. "Everleigh, M." "Standing by." "Northcott, T." "Standing by." It takes ten minutes. At the end: "The Boss." Silence. Three seconds. It's kept, every Friday. "Absent. Noted." Then she calls your name.`,
    [
      ch('"Standing by."', out(`She ticks it, and moves on.`)),
      ch('(Silence.)', out(`She looks up. She ticks it anyway. "Noted."`)),
      ch('"Present."', out(`Heads turn. It's not the word. ${say('Mr. Sallow, slowly', `...'Present.' Not 'standing by.' Here.`)} He tries it the next Friday. So do the twelve. By the last Friday, half the room answers "Present," and Sabela has stopped correcting them.`, flag('neo-present'))),
    ]),
];

// ---------- The loyalty test (Suspicion 7) and found out (Suspicion 10) ----------
const TESTS: Json[] = [
  ev('neo-loyalty-test', 'The Loyalty Test', 'Evil Teams', { callback: true, requires: inside({ suspicion: 7, suspicionBelow: 10, lacks: 'loyalty-test' }), cast: [EXEC], tint: MESS },
    `Proton, in the corridor, blocking it. ${say('Proton', `The pills. The mast. Mary. Somebody's been very kind around here lately, Standby. Kindness is how they get in. Tell me it isn't you.`)}`,
    [
      ch('"It isn\'t me."', out(`He looks at you a long time. He decides something, and steps aside. You won't know what for some while.`, meters(0, -2), mark('loyalty-test'), flag('proton-decided')), { chance: 0.6, fail: out(`He doesn't believe you. He doesn't say so. He writes something down.`, meters(0, 1), mark('loyalty-test')) }),
      ch('"It\'s me. Somebody had to be."', out(`He flinches as if you'd hit him. ${say('Proton', `...Somebody has to be the one. I know.`)} He doesn't report it.`, mark('loyalty-test'), flag('proton-decided'))),
      ch('"Ask Archer."', out(`${say('Proton', `I'd sooner not. He'd only be kind about it.`)} He lets you by.`, meters(0, -1), mark('loyalty-test'))),
    ]),
  ev('neo-found-out', 'Found Out', 'Evil Teams', { callback: true, requires: inside({ suspicion: 10, lacks: 'found-out' }), cast: [EXEC, EXEC], tint: '#3a1418', effect: 'glint' },
    `Tyson and a dozen new blood are waiting at the foot of the hideout stairs. ${say('Tyson', `Standby. We've had a listen to your shifts. You're done.`)} You've been found out. There's only one way back outside, and it's through them, with your own party.`,
    [ch('Fight your way out.', fight(`They come at you two at once.`, foe('executive', 'Tyson and the new blood', 6, { lv: 2, format: 'doubles' }), mark('found-out'), story({ end: 'defeated' }), flag('neo-ending-turn'), flag('neo-found-out')))]),
];

(act4[0] as Json).remembers = [{ id: 'cart', when: [flagIs('neo-lore-cart')], notice: `You say: "'Nearly there, sir.'" He's very still. ${say('Archer', `...Who told you that. Nobody was on that road.`)}` }];

export const EVENTS: Json[] = [offer, ...act1, ...act2, ...act3, ...act4, ...act5, ...OPS, ...FRIDAYS, ...EXTRA, ...TESTS];
export const REMOVE: string[] = [];
