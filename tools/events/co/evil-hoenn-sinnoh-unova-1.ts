// Catalog Overhaul Pack, row 9: Sinnoh, Team Galactic from inside (EVIL_TEAMS_VOLUME_3_A "Sinnoh", TEAM_GALACTIC_SINNOH_FULL_1
// part B, FULL_3 parts B to D, EVIL_TEAMS_VOLUME_3_D "Sinnoh"). The Offer, the five Acts, the six Operations, Lights Out and
// the other inside-only scenes, the officers alone, the loyalty test and being found out. The Final Choice, the endings and
// Team Lantern are in evil-hoenn-sinnoh-unova-2.ts; the twelve scenes for any player in -3. The engine is row 8's
// (core/evil/inside.ts): Standing, Suspicion and the rank are the `evil` effect's `standing`/`suspicion`/`rank`.
// The player's codename: Ceres.
import { ch, ev, fight, flag, flagIs, inRegion, out, room, scout, bondUp, trainer, join, type Json } from '../dsl.ts';
import { evil as story, foe, kind, node, prompt } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-hoenn-sinnoh-unova';

const G = teamJson('galactic');
const GRUNT = G.ranks.grunt.sprite;
const SCI = G.ranks.specialist.sprite;
const MARS = G.ranks.executive.sprite;
const BOSS = G.ranks.leader.sprite;
const SATURN = 'boss.npc_psychic_m';
const JUPITER = 'boss.npc_beauty';
const CHARON = 'boss.npc_scientist';
const PADRAIG = 'boss.npc_fisherman';
const TINT = G.color;
const WHITE = '#2a3240';
const say = (who: string, line: string): string => `${who}: "${line}"`;
/** Galactic is the region's team, and the run is in Sinnoh. */
export const gx = (o: Json = {}): Json[] => [{ kind: 'evil', team: 'galactic', ...o }, inRegion('sinnoh')];
const inside = (o: Json = {}): Json[] => gx({ inside: true, ...o });
const mark = (m: string): Json => story({ mark: m });
const meters = (standing: number, suspicion = 0, rank?: number): Json => story({ ...(standing ? { standing } : {}), ...(suspicion ? { suspicion } : {}), ...(rank ? { rank } : {}) });
const beat = story({ beat: true });
/** The quiet way of an Operation: Standing +1 either way, Suspicion +1, Kindness +1 (FULL_3 C). */
const quiet = (): Json[] => [meters(1, 1), ...kind(1)];
const intel = (n: number): Json => flag('intel', n);
const night: Json = { kind: 'period', in: ['night'] };
const once = (k: string): Json => flagIs(k, 0, 0);

// ---------- The Offer (Sinnoh stage 2, after the Valley Windworks) ----------
const OFFER = `Saturn, tired, holding a clipboard, is waiting by the Windworks fence. ${say('Saturn', `You fought well. It was inefficient. You stopped to check on the girl's father. That's four minutes.`)} ${say('Saturn', `Master Cyrus says spirit is the flaw. I'm not sure. I notice the ones with it get more done. Come and be a counter-example. I'd like to have one to point at.`)}`;
const offered = flag('galactic-offered');
const yes = ch('"Yes."', out(`${say('Saturn', `Veilstone. The lobby. There's a card on the desk. Fill it in. Don't explain it.`)} He ticks something on the clipboard. You're Team Galactic now, on the inside, and nobody outside knows it.`, mark('inside'), offered));
const report = ch('"Yes." (And tell the International Police.)', out(`You say yes to Saturn. That night, by the Windworks fence, a man in a brown coat steps out of a hedge. ${say('Looker', `So. You will be my eyes inside. I have joined also, under another name. You will not recognise me. Nobody recognises me. It is my gift.`)} You have a handler now. Every careless step counts double.`, mark('inside'), mark('inside-man'), flag('galactic-looker-met'), offered));
const no = ch('"No."', out(`${say('Saturn', `Noted.`)} He writes one word and walks back to the van without looking round. Team Galactic's story goes on as it was, with you on the outside of it.`, flag('galactic-offer-refused'), offered));
const offer: Json[] = [
  ev('evil-galactic-offer-sinnoh', 'The Offer', 'Evil Teams', { room: true, cast: [SATURN], tint: TINT, effect: 'glint' }, OFFER, [
    yes, no,
    ch('"What would I be doing?"', out(say('Saturn', `Whatever is next on the list. There is always a list. You'd be surprised how restful that is.`), room('evil-galactic-offer-sinnoh-2'))),
    report,
  ]),
  ev('evil-galactic-offer-sinnoh-2', 'The Offer', 'Evil Teams', { room: true, cast: [SATURN], tint: TINT, effect: 'glint' }, `${say('Saturn', `Well? Yes or no. I'm timing it.`)}`, [yes, no, report]),
];

// ---------- Act 1. A White Room (stage 3, Veilstone) ----------
const CARD = `A lobby with nothing in it but a desk, a pen on a chain, and a card. The card says: WHAT WOULD YOU LIKE TO STOP? ${say('Technician Wynn Oakeshott', `One line. Don't explain it. Nobody reads the explanation. He reads the line.`)} She isn't looking up.`;
const toRoom = (text: string, ...fx: Json[]): Json => out(text, ...fx, room('gx-act1-room'));
const act1: Json[] = [
  ev('gx-act1', 'A White Room', 'Evil Teams', { callback: true, requires: inside({ beat: 2 }), cast: [SCI], tint: WHITE, effect: 'none' }, CARD, [
    ch('"Losing."', toRoom(`You write it. Wynn files it without reading it.`, flag('galactic-card-losing'))),
    ch('"Being afraid."', toRoom(`You write it. Wynn files it without reading it.`, flag('galactic-card-afraid'))),
    ch('"Missing someone."', toRoom(`You write it. Wynn files it without reading it.`, flag('galactic-card-missing'))),
    ch('(Something else.)', out(`The pen's on a chain. It reaches exactly as far as the card and no further.`, room('gx-act1-card'))),
  ]),
  ev('gx-act1-card', 'A White Room', 'Evil Teams', { room: true, cast: [SCI], tint: WHITE }, `WHAT WOULD YOU LIKE TO STOP? Wynn waits, not looking up.`, [
    ch('"Nothing."', toRoom(`You write it. Wynn files it without reading it.`, flag('galactic-card-nothing'))),
    ch('"People getting hurt."', toRoom(`You write it. Wynn files it without reading it.`, flag('galactic-card-hurt'))),
    ch('(Leave it blank.)', toRoom(`You hand it back empty. ${say('Wynn', `...Nobody's left it blank. I've no tab for blank.`)} She makes one.`, flag('galactic-card-blank'))),
    ch('"This."', toRoom(`Wynn looks up. First time. ${say('Wynn', `"This." The card? The form? ...I'll file it under T.`)}`, flag('galactic-card-this'))),
  ]),
  ev('gx-act1-room', 'A White Room', 'Evil Teams', { room: true, cast: [GRUNT], tint: WHITE },
    `A white room. Two bunks. Two lockers, labelled LOCKER. A window, labelled WINDOW. On the top bunk, staring at the ceiling, which is labelled: ${say('Greer Whitcombe', `You're Ceres. I'm Greer. That's it; that's the introductions. Nobody's going to ask you where you're from. Isn't it wonderful.`)} ${say('Greer', `They don't do birthdays. They don't do "how are you." It's the kindest place I've ever worked. D'you know how tiring it is, being asked? Out there? Every day. "How are you, Greer." And having to make something up.`)} ${say('Greer', `He says he'll make a world with no spirit in it. No wanting. No missing people. I thought: yes. That. Sign me up for not missing people.`)}`,
    [
      ch('"Who do you miss?"', out(`She's quiet. ${say('Greer', `...That's a four-minute question. I'll answer it when we've four minutes.`)}`, flag('galactic-greer-asked'), room('gx-act1-canteen'))),
      ch('"It sounds restful."', out(say('Greer', `It is. I slept. First night. Eleven hours. I hadn't done that since—`) + ` She stops. "Since."`, room('gx-act1-canteen'))),
      ch('"And if he does it?"', out(say('Greer', `Then I shan't mind that he has. That's the beauty of it. It's the only plan there's ever been where you can't regret it after.`), room('gx-act1-canteen'))),
    ]),
  ev('gx-act1-canteen', 'The Canteen', 'Evil Teams', { room: true, cast: [GRUNT, GRUNT], tint: WHITE },
    `The canteen. One meal. Five hundred people. No talking. A sound, very low: someone's humming. ${say('Cadet Io', `Sorry. Sorry. I don't know I'm doing it.`)} She's two seats down, catching herself. ${say('A Grunt', `Observation two.`)} He says it without malice. ${say('Cadet Io', `It's not a feeling. It's a tune.`)} Nobody answers. It'd cost four minutes.`,
    [
      ch(`"What's the tune?"`, out(`She shrugs, helpless. ${say('Cadet Io', `I don't know. It's been in my head since I came downstairs. I can't find where it starts.`)}`, room('gx-act1-labels'))),
      ch('(Hum the next bar.)', out(`She stares. She grins. She hums the one after. Three tables look round. Nobody stops you. Nobody's sure it's against anything.`, meters(0, 1), flag('galactic-io-duet'), room('gx-act1-labels'))),
      ch('(Say nothing.)', out(`You eat. Io eats. The humming stops, and starts again under the clatter, and stops.`, room('gx-act1-labels'))),
    ]),
  ev('gx-act1-labels', 'Corridor C', 'Evil Teams', { room: true, cast: [SCI], tint: WHITE, effect: 'sparkle' },
    `The first task. Wynn hands over a label gun. ${say('Wynn', `Corridor C's not been done. Everything a person might look at. If it's got a name, it gets a tab.`)} DOOR. LIGHT. FLOOR. EXTINGUISHER. At the end of the corridor there's a drawer, already labelled, in Wynn's own hand: FEELINGS (EMPTY).`,
    [
      ch('Open it.', out(`It isn't empty. A pressed flower. A bus ticket. A photograph, face down. Wynn's behind you. ${say('Wynn', `That's mislabelled. I know it's mislabelled. I've not got round to it.`)}`, flag('galactic-drawer-opened'), room('gx-act1-end'))),
      ch('Leave it.', out(`${say('Wynn', `You didn't look. Everybody looks.`)} A pause. ${say('Wynn', `Thank you.`)}`, meters(1), flag('galactic-drawer-left'), room('gx-act1-end'))),
      ch('Relabel it: FEELINGS.', out(`She watches the tab come out of the gun. She doesn't take it off.`, flag('galactic-drawer-relabelled'), room('gx-act1-end'))),
    ]),
  ev('gx-act1-end', 'A Helmet', 'Evil Teams', { room: true, cast: [GRUNT], tint: WHITE },
    `End of the first week. Rank 2: a helmet, and the regulation haircut. Or a wig from the cupboard. Nobody will say which you took.`,
    [
      ch('The haircut.', out(`The clippers are cold. Nobody asks.`, meters(0, 0, 2), flag('galactic-inside-act1'), beat)),
      ch('A wig from the cupboard.', out(`It itches. Nobody asks.`, meters(0, 0, 2), flag('galactic-inside-act1'), flag('galactic-wig'), beat)),
    ]),
];
(act1[2] as Json).remembers = [{ id: 'afraid', when: [flagIs('galactic-card-afraid')], notice: say('Greer', `You wrote "being afraid." Wynn told me; she tells me things, I'm restful. Does it work? Tell me if it works.`) }];

// ---------- Act 2. Eleven Minutes (stage 4, Lake Valor) ----------
const CHARGES = (lead: string): Json[] => [
  ch('Set them.', out(`${lead}Forty minutes. The fisherman doesn't look up. He's got to fourteen. The lake's taken on schedule.`, meters(1, 0, 3), flag('galactic-lake-valor-full'), flag('galactic-inside-act2'), flag('ally-greer'), flag('ally-lior'), beat)),
  ch('Set them wrong.', out(`${lead}A wire crossed at point three. The blast's a quarter of what it should be. Azelf's dazed, not held. Over a loudspeaker, from a ship you can't see: ${say('Hunter J', `Client's charge underperformed. Not my invoice.`)}`, meters(0, 2, 3), flag('galactic-lake-valor-quarter'), flag('galactic-inside-act2'), flag('ally-greer'), flag('ally-lior'), beat)),
];
const act2: Json[] = [
  ev('gx-act2', 'Eleven Minutes', 'Evil Teams', { callback: true, requires: inside({ beat: 3 }), cast: [SCI, GRUNT], tint: '#2a3a48', effect: 'fog' },
    `Lake Valor at first light. A survey van. A black airship, very high, very patient. In the van, with a slide rule nobody else can use: ${say('Lior Trevelyan', `You're the new one. Good. I need someone who hasn't read it. I've read it.`)} ${say('Lior', `The plan. All of it; I'd clearance, for the funding review. The last page. It's elegant. I'll give him that. It's the most elegant thing I've ever seen. It ends everything. I checked the maths four times, hoping I was stupid.`)} ${say('Greer', `Don't tell me.`)} ${say('Lior', `I wasn't going to tell you. You're here for the not-knowing. I'm telling Ceres, who looks like a person who'd rather.`)}`,
    [
      ch('"Tell me."', out(say('Lior', `The Chain holds two things that between them are every when and every where. He pulls. What comes out the other side has neither. He calls it a new world. It's a correct term, if you don't mind that there's nothing in it.`), flag('galactic-last-page'), room('gx-act2-shore'))),
      ch(`"Don't."`, out(`${say('Lior', `...Fair.`)} He folds the page away. His hands are shaking a little.`, room('gx-act2-shore'))),
      ch('"Why are you still here?"', out(say('Lior', `The pension. And— this is the awful part— I want to see if I'm right.`), room('gx-act2-shore'))),
    ]),
  ev('gx-act2-shore', 'The Shore', 'Evil Teams', { room: true, cast: [PADRAIG], pokemon: 'magikarp', tint: '#2a3a48', effect: 'fog' },
    `The test charge went off at dawn. It was meant to measure the lakebed. It's taken the top six feet of water with it. The shore: a hundred Magikarp on the mud, flopping. A man of eighty with a rod, standing among them, not fishing. ${say('Old Padraig Lachlan', `Sixty years I've fished this water. I've never once had them come to me.`)} He isn't joking. He's picking them up, one at a time, and walking each to the waterline. He's managed nine. He's eighty. Saturn, on the radio: ${say('Saturn', `Ceres. The main charges. Four points, marked. You've a window of forty minutes before the contractor's ship is in position. Begin.`)}`,
    [
      ...CHARGES(''),
      ch('Put the fish back first. Then set them. (a node)', out(`You put the detonator case down and pick up a Magikarp. Greer watches you for a while. Then she puts down her case and picks one up. It's the first thing she's chosen to do in a year.`, ...node(), ...kind(1), flag('galactic-eleven'), flag('galactic-fish'), room('gx-act2-fish'))),
    ]),
  ev('gx-act2-fish', 'Eleven Minutes', 'Evil Teams', { room: true, cast: [SATURN, PADRAIG], pokemon: 'magikarp', tint: '#2a3a48' },
    `Lior's doing it by arithmetic: nearest to the water first. Greer's doing it by which one's looking at her. The fisherman's doing it the way he was. A van door. Saturn, with a stopwatch, on the bank. ${say('Saturn', `You're eleven minutes over. I've been timing it from the ridge.`)} He looks at the mud. Three left, a long way up, where the water was. ${say('Saturn', `Those are inefficiently placed.`)} He takes off his gloves. He folds them. He walks up the mud in good shoes. ${say('Saturn', `It's— they're heavier than the specification suggests.`)} ${say('The fisherman', `Mind the spines, son.`)} Nobody's called him "son." He's twenty-six. ${say('Saturn', `...Noted.`)} At the end, putting his gloves back on: ${say('Saturn', `Eleven minutes. I'll log it.`)} He does. He logs it as "equipment check." It's the first false entry of his career. Then the charges. As the van pulls out, the fisherman calls after you: ${say('Padraig', `Whatever that's for, in the cases. You put them back first. I'll remember which way round you did it.`)}`,
    CHARGES('')),
];
(act2[0] as Json).remembers = [{ id: 'hurt', when: [flagIs('galactic-card-hurt')], notice: `Saturn, on the radio, before anything else: "Ceres. Your card. 'People getting hurt.' I read it twice. I filed it myself."` }];

// ---------- Act 3. The Frequency You Can't Hear (stage 5): a door of four rooms (ps_gx_lab) ----------
const act3: Json[] = [
  ev('gx-act3', 'The Frequency You Can\'t Hear', 'Evil Teams', { callback: true, requires: inside({ beat: 4 }), cast: [CHARON], tint: '#3a2418', effect: 'none' },
    `The basement. It's warm. Three tanks, lit from below. In each, a small bright shape with a red band around it. At a desk with a price list: ${say('Charon', `Ah. The provisional one. Come in; shut the door; you're letting the heat out. They all come down here, you know. "Delivering." Nobody's delivered anything in a month. They stand by the forge and they don't know why.`)} ${say('Charon', `They scream, by the way. The three. On a frequency you can't hear. The instruments can. I've turned the instruments off; it was upsetting the staff.`)}`,
    [ch('Go through to the glass.', out(`The warm gets warmer.`, room('gx-act3-glass')))]),
  ev('gx-act3-glass', 'The Glass', 'Evil Teams', { room: true, cast: [GRUNT], pokemon: 'azelf', tint: '#3a2418' },
    `Greer's at the middle tank. Azelf, or whichever was taken, is looking at her. She's not looking away. ${say('Greer', `It's— I can feel what it wants. It wants me to want something. Anything. It's just offering. I'd forgotten what that— oh.`)} ${say('Greer', `Oh, no. I'd forgotten on purpose.`)} She's got her hand flat on the glass. So has it.`,
    [ch('Go to the readout.', out(`You leave her there. She doesn't notice you go.`, flag('galactic-greer-glass'), room('gx-act3-readout')))]),
  ev('gx-act3-readout', 'The Readout', 'Evil Teams', { room: true, cast: [SCI, GRUNT], tint: '#3a2418' },
    `A wall of dead dials. One switch: INSTRUMENTS. ${say('Lior', `I know what's on those, if you turn them on. I designed the pickups. It's not a number you un-see.`)}`,
    [
      ch('"Open the tanks."', out(`You reach for the release. A shutter comes down over the far door, and a man in a guard's coat comes through the near one.`, room('gx-act3-warden'))),
      ch('"Turn the instruments back on. Let everyone hear."', out(`The dials come up. Three needles, hard over. A speaker, which was never meant to be connected, and is. It isn't a scream. It's three notes, held, that don't resolve. It's the sound of something asking the same question for a month. Every Grunt on the floor stops. Somebody sits down where they are. Somebody takes off the helmet, and then the wig under it. ${say('A Grunt, to nobody', `I've been bringing boxes down here for three weeks. I thought it was the warm.`)} ${say('Charon, mildly', `Now that's a pity. That'll be thirty resignations by morning. D'you know what it costs to train a Grunt?`)} ${say('Cadet Io, in the doorway, very white', `That's the tune. That's the one I've been— that's where I got it.`)} Thirty Grunts resign by morning.`, meters(0, 3), flag('galactic-instruments'), room('gx-act3-saturn'))),
      ch(`"Greer. Step back. It's the job."`, out(`She does. It takes her a long time to get her hand off the glass. She doesn't sleep that night; first time in a year.`, meters(1, 0, 4), flag('galactic-tanks-held'), flag('galactic-inside-act3'), beat)),
    ]),
  ev('gx-act3-warden', 'Room Four', 'Evil Teams', { room: true, cast: [GRUNT], tint: '#3a2418', effect: 'glint' },
    `${say('Warden Pell', `Step away from the release, Ceres. That's three months of somebody's work in there.`)}`,
    [ch('Battle.', fight(`Steel, all of it, and patient.`, { ...trainer('Warden Pell', { team: ['bastiodon', 'probopass', 'magnezone'], size: 3, lv: 1,
      // Win, and the three go for their lakes: Suspicion +5, the fast way to be found out. Lose, and the shutter stays down.
      win: [story({ suspicion: 5, rank: 4 }), flag('galactic-tanks-opened'), flag('galactic-guardians-free'), flag('galactic-inside-act3'), beat],
      lose: [story({ rank: 4 }), flag('galactic-tanks-held'), flag('galactic-inside-act3'), beat] }), pseudo: true }))]),
  ev('gx-act3-saturn', 'Room Four: Saturn', 'Evil Teams', { room: true, cast: [SATURN], tint: '#3a2418' },
    `He comes down. He looks at the dials. ${say('Saturn', `Who turned these on.`)}`,
    [
      ch('"I did."', out(`He nods. ${say('Saturn', `I can't hear it. The frequency. I've the readout. It looks like—`)} He doesn't finish. ${say('Saturn', `Leave them on. I'll say it was a fault.`)} It's the second false entry.`, meters(0, 0, 4), flag('galactic-saturn-second-entry'), flag('galactic-inside-act3'), beat)),
      ch('"They came on."', out(`${say('Saturn', `Instruments don't come on.`)} He looks at you for a long time. ${say('Saturn', `...They came on. I'll log it.`)}`, meters(0, 0, 4), flag('galactic-inside-act3'), beat)),
      ch('"You should listen."', out(`He stands by the speaker with his hands behind his back for a full minute. ${say('Saturn', `I am listening. I can't hear anything.`)} He doesn't switch it off.`, meters(0, 0, 4), flag('galactic-inside-act3'), beat)),
    ]),
];

// ---------- Act 4. A Large Box (stage 6, Rank 4, Sunyshore at night) ----------
const asked = (k: string): Json => flagIs(`gx-asked-${k}`, 0, 0);
const ask = (k: string, label: string, text: string, back: string, ...fx: Json[]): Json => ch(label, out(text, flag(`gx-asked-${k}`), ...fx, room(back)), { requires: [asked(k)] });
const QUESTIONS = (): Json[] => [
  ask('lonely', '"Were you lonely?"', say('Cyrus', `I've no current reading on that. I tested the first stage on myself. A year ago. I recorded that I didn't mind the result. I've not been able to verify the entry since, because the instrument that would mind is the one I switched off.`), 'gx-act4-talk'),
  ask('cards', '"Nobody on those cards asked for all of it."', `He's still. ${say('Cyrus', `...They asked for one each. I've noted that. I concluded they lacked the imagination to ask for the rest.`)} A pause. ${say('Cyrus', `It's possible they lacked the wish. I can't tell those apart any more. That's a limitation of the method. I've logged it.`)}`, 'gx-act4-talk', flag('galactic-cards-said')),
  ask('alive', '"Your grandfather. Is he alive?"', `${say('Cyrus', `In Sunyshore. Two streets from here. He writes. I don't open them. There's a box.`)} A pause. ${say('Cyrus', `It's quite a large box.`)} "Why keep them?" ${say('Cyrus', `I don't know. I've looked at it as a problem. A thing one's not going to read should be disposed of. I've had the box moved four times. I've not disposed of it. Observation three, perhaps. They're not finished. They've not been seen.`)}`, 'gx-act4-talk', flag('galactic-box-known')),
  ch(`"I'll come."`, out(`${say('Cyrus', `You're the first of them who hasn't argued. Come to the Pillar. I'd like a witness. A thing isn't finished till it's been seen.`)} Rank 6 is offered: Witness. It skips 5. Saturn's told by memo.`, meters(0, 0, 6), mark('confided'), flag('galactic-cyrus-confided'), room('gx-act4-box'))),
];
const act4Intro = `The breakwater. The lighthouse going round. A man in a long coat, watching the sea, which isn't doing anything for him. ${say('Cyrus', `Ceres. You were sent for. Stand there. Don't speak yet; I'm finishing a thought.`)} A long time. The light comes round twice. ${say('Cyrus', `I was a quiet child. I liked machines. A machine does what it's for. My grandfather used to say I'd grow into people. I grew out of them.`)} ${say('Cyrus', `I'm told I'm angry. I'm not. I'm tired. Everyone I've ever met has wanted me to feel something for their benefit. I'd like it to stop. Not for me. For everyone. No one would be lonely if there were no one to be lonely at.`)} ${say('Cyrus', `I've read your card. I've read all of them. Five hundred and six people have asked me to stop something. I intend to be thorough.`)}`;
const BOX = (): Json[] => [
  ch('Take the top one.', out(`You slip the newest letter into your coat: A Letter, Unopened. It can be handed to him, at the Pillar.`, flag('galactic-letter'), room('gx-act4-box')), { requires: [flagIs('galactic-letter', 0, 0)] }),
  ch('Open one.', out(`It's short. "The Wingull are back. I've saved you the crossword. No need to write. — G." They're all like that. Nobody's been asking him to feel anything. Somebody's been saving him the crossword.`, flag('galactic-letter-read'), room('gx-act4-box')), { requires: [flagIs('galactic-letter-read', 0, 0)] }),
  ch('Carry the box.', out(`It's heavy. It takes a Pokémon's worth of room in the bag. It can be brought to the Pillar.`, flag('galactic-box'), room('gx-act4-box')), { requires: [flagIs('galactic-box', 0, 0)] }),
  ch('Leave the room.', out(`You close the door on the top room. The rest of the box stays where it is, the newest on top.`, room('gx-act4-street'))),
];
const act4: Json[] = [
  ev('gx-act4', 'A Large Box', 'Evil Teams', { callback: true, requires: inside({ beat: 5, rank: 4 }), cast: [BOSS], tint: '#1a2230', effect: 'glint' }, act4Intro, QUESTIONS()),
  ev('gx-act4-talk', 'A Large Box', 'Evil Teams', { room: true, cast: [BOSS], tint: '#1a2230' }, `The light comes round. He waits.`, QUESTIONS()),
  ev('gx-act4-street', 'Two Streets', 'Evil Teams', { room: true, cast: ['boss.npc_gentleman'], tint: '#1a2230' },
    `Outside, the lighthouse goes round. Two streets from here, there's a bench.`,
    [
      ch('Walk two streets.', out(`The Old Man of Sunyshore's on his bench, as he always is. "He's kept every one." ${say('The old man', `...Kept. Not read?`)} "Not read." He thinks about it for a long time. ${say('The old man', `Kept's something. I'll take kept.`)}`, flag('galactic-grandfather-kept'), flag('galactic-inside-act4'), beat)),
      ch('Go back.', out(`You walk back to Veilstone in the dark.`, flag('galactic-inside-act4'), beat)),
    ]),
  ev('gx-act4-box', 'The Top Room', 'Evil Teams', { room: true, cast: [], tint: '#1a2230' },
    `The top room, which the Witness may enter. The box is a real thing. Four hundred and sixty-eight letters, unopened, in date order, the newest on top. Nine years of Fridays.`, BOX()),
];
(act4[0] as Json).remembers = [
  { id: 'missing', when: [flagIs('galactic-card-missing')], notice: say('Cyrus', `"Missing someone." You wrote that. I noted it. You've not behaved like someone who wants it stopped.`) },
  { id: 'card-short', when: [flagIs('galactic-card-hurt')], notice: `He has your card in his coat pocket. He doesn't take it out.` },
];
// Act 4 needs Rank 4 (FULL_1); a player who got here without it is lifted to it by Act 3, so the story never waits for good.

// ---------- Act 5. Four Minutes (stage 7, then the Final Choice) ----------
const act5: Json[] = [
  ev('gx-act5', 'Four Minutes', 'Evil Teams', { callback: true, requires: inside({ beat: 6 }), cast: [BOSS], tint: WHITE },
    `The Assembly Hall. Five hundred in ranks. You're on the floor this time, third row. ${say('Cyrus, at the lectern', `You have given me your labor. I have given you a purpose. Tomorrow that exchange concludes.`)} ${say('Cyrus', `The world is incomplete because the spirit is incomplete. I will remove the error. There will be no more want, and so no more strife, and so no more of this.`)} Applause. Synchronised. Greer's clapping. She's a quarter-beat late. She's never been late. The Witness goes out by the side door, behind him. It's the corridor. Saturn's there. ${say('Cyrus, same tone', `They will not be coming. The new world has no requirement for them. Do not inform them. It would only cause feeling.`)} ${say('Saturn', `...Understood, sir.`)} ${say('Cyrus, to you, as to a colleague', `You'll have gathered that. You, I require. Until it's been seen. After that I've made no provision. I thought you'd prefer to be told.`)} He goes. Saturn doesn't move. ${say('Saturn', `Five hundred and six cards. I've processed their pensions. I set up the pensions, Ceres. He let me set up the pensions.`)}`,
    [
      ch('"Tell them."', out(`${say('Saturn', `I can't. It's not on the list.`)} He looks at you. ${say('Saturn', `It's not on yours either. I've checked.`)}`, room('gx-act5-dorm'))),
      ch('"What will you do?"', out(say('Saturn', `What's next on the list. There's always a list.`) + ` He doesn't look at it.`, room('gx-act5-dorm'))),
      ch('"He told me. Why?"', out(`${say('Saturn', `Because you'd ask. And it'd cost four minutes. He's saved the four minutes.`)} A pause. ${say('Saturn', `It's the nearest he comes to courtesy. I used to think it was the nearest anyone needed.`)}`, room('gx-act5-dorm'))),
    ]),
  ev('gx-act5-dorm', 'Four Minutes', 'Evil Teams', { room: true, cast: [GRUNT, SCI], tint: '#141a24' },
    `The dormitory, after lights-out. Five hundred bunks. Three people awake. ${say('Lior', `If it works, there'll be no one to know I was right. That's the only maths I can't forgive him.`)} ${say('Greer, to the ceiling, which is labelled', `I've four minutes.`)} Nobody says anything. It's the first time in the building anyone's been given them. ${say('Greer', `It was my sister. Her name was Una. She'd a laugh you could hear through a wall. I came here so I'd stop listening for it. There. I've said it. I didn't die of it.`)} ${say("Cadet Io, from the next bunk, who wasn't meant to be awake", `...How are you, Greer?`)} A very long silence. ${say('Greer', `Bad.`)} And then, as if it's the most surprising thing she's ever heard herself say: ${say('Greer', `Thanks for asking.`)} Your last choice of the night: tell the room, or don't.`,
    [
      ch('Tell the three.', out(`You tell them, in a whisper, what's on the far side of tomorrow. They know. In every ending, they act on it.`, flag('galactic-una'), flag('galactic-asked'), flag('galactic-told-three'), flag('galactic-inside-act5'), beat, room('gx-final-choice'))),
      ch('Tell the dormitory.', out(`You stand on a bunk. Five hundred people wake the same way. It's told in one sentence. Nobody shouts. Somebody, far back, starts to hum. You're found out, and it doesn't matter; it's tomorrow. The Pillar's gauntlet is half empty.`, meters(0, 10), mark('found-out'), flag('galactic-una'), flag('galactic-asked'), flag('galactic-told-all'), flag('galactic-inside-act5'), beat, room('gx-final-choice'))),
      ch('Say nothing.', out(`The room sleeps. Greer doesn't.`, flag('galactic-una'), flag('galactic-asked'), flag('galactic-told-none'), flag('galactic-inside-act5'), beat, room('gx-final-choice'))),
    ]),
];

// ---------- The six Operations (FULL_3 C): one per Sinnoh stage from 3, optional. Standing +1 either way ----------
const op = (id: string, name: string, after: number, intro: string, choices: Json[], o: Json = {}): Json =>
  ev(`gx-op-${id}`, `Operation: ${name}`, 'Evil Teams', { requires: inside({ after, ends: ['none'] }), cast: [GRUNT], tint: TINT, ...o }, intro, choices);
const OPS: Json[] = [
  op('windworks-shift', 'The Windworks Shift', 2, `The order: take all six turbines off the public grid and onto the Veilstone line. At the board, hands up: ${say('The engineer', `I'm not helping you. I want that understood. I'm just bad at saying no.`)}`, [
    ch('Take all six.', out(`Six turbines, six switches. The engineer watches the village lights go out one street at a time.`, meters(1))),
    ch('"Which one feeds the village?"', out(`${say('The engineer', `...Four. Floaroma. Two hundred houses and the flower shop's cold store.`)} He looks at the board. He looks at you. ${say('The engineer', `If four had a fault, I'd have to leave it on the local loop. For safety.`)} You leave one turning. Outside the fence: a small girl, and a Drifloon on her head. ${say('The little girl', `Papa's lights are still on. He said they'd go off. Did you do a fault?`)} Floaroma keeps its lights: the Brownout never reaches it, and its rest heals in full all region.`, ...quiet(), flag('galactic-floaroma-lit'))),
  ]),
  op('survey', 'The Survey', 3, `The order: sound the three lakes. Depth to the island, to the metre. It's for the charges. ${say('Lior, with the plumb line', `Fourteen point two.`)}`, [
    ch('"Fourteen point two."', out(`He writes it. The charges will be shaped to the metre.`, meters(1))),
    ...([['Acuity', 'acuity'], ['Verity', 'verity'], ['Valor', 'valor']] as const).map(([lake, k]) => ch(`"Thirteen point two." (Lake ${lake})`, out(`He looks at the line. He looks at you. ${say('Lior', `...I've a slide rule nobody else in the building can use. If I say thirteen point two, it's thirteen point two until the heat death.`)} He writes it. ${say('Lior', `D'you know what a metre does to a shaped charge? It turns a cage into a loud noise.`)} ${say('Lior', `This is the first wrong number I've ever written down. It's— I feel sick. Is this what it's like? Doing a thing on purpose?`)} Lake ${lake}'s guardian won't be held by its blast.`, ...quiet(), flag(`galactic-survey-${k}`)))),
  ], { cast: [SCI] }),
  op('requisition', 'The Requisition', 4, `The order: a Pokémon Center's generator. The lab's short. The nurse is standing in front of it. ${say('The nurse', `There's an incubator on that circuit. A Happiny, nine days from hatching. If you take it I'll be keeping an egg warm in my coat.`)} ${say('Greer', `We've an order.`)}`, [
    ch('Take it.', out(`The generator goes on the lorry. The nurse takes off her coat.`, meters(1))),
    ch(`"For 'a generator.' It doesn't say which."`, out(`In the shed: a second one. Older. Under a tarpaulin. It's got a brass plate: VEILSTONE LIGHT & POWER. TO KEEP THE LIGHTS ON. ${say('Greer', `That's forty years old. It won't run the lab.`)} "No." She thinks about it for four minutes. She doesn't time them. ${say('Greer', `...It's a generator. It's what the form says.`)} She takes one end. The lab's a generator short. Charon's forge runs at half: the Pillar will have one fewer Chain.`, ...quiet(), flag('galactic-spare'), flag('galactic-pillar-chain-short'))),
  ], { pokemon: 'happiny' }),
  op('lecture', 'The Lecture', 4, `The order: a recruiting talk at Canalave's library. Forty students. A script: A FUTURE WITHOUT CONFLICT. Lior's at the back, arms folded, not breathing.`, [
    ch('Read the script.', out(`Forty students. Six sign. Lior leaves before the end.`, meters(1))),
    ch('Read out the last page of the plan.', out(`"The resulting state contains no time and no location. No observer persists. The project has no deliverable on the far side." Silence. ${say('A student, hand up', `Sorry. "No observer." Does that include us?`)} "Yes." ${say('The student', `And you're— recruiting. For that.`)} ${say('Another', `What's the starting salary?`)} Laughter. It's the first you've heard in a Galactic uniform. ${say('A third, at the back, not laughing', `Can I see the maths?`)} Lior's already walking down the aisle with it. Nobody signs.`, ...quiet(), flag('galactic-lecture-read'))),
  ], { cast: [SCI] }),
  op('honey-trees', 'The Honey Trees', 5, `The order: a relay mast on a hill of honey trees. Clear the Combee. In front of the oldest tree, with a smoker: ${say('A honey seller', `There's a Vespiquen in that one's been queen since my mother sold from this gate. You'll not shift her. I'm not saying that as a threat. I'm saying I've tried, for the roof.`)} A Munchlax is asleep at the roots, sticky to the ears.`, [
    ch('Clear them.', out(`It takes the afternoon, and the seller doesn't watch.`, meters(1))),
    ch('"Is four per cent in the Observations?"', out(`${say('Lior, with a theodolite', `The next hill's nine metres lower. We'd lose four per cent.`)} "Is four per cent in the Observations?" ${say('Lior', `...No. There's nothing about four per cent.`)} The mast goes on the next hill. The Munchlax follows the smell of the survey crew's sandwiches down one and up the other, and sits on the mast's footing, and can't be moved.`, ...quiet(), flag('galactic-next-hill'), room('gx-op-munchlax'))),
  ], { pokemon: 'vespiquen' }),
  ev('gx-op-munchlax', 'The Mast Footing', 'Evil Teams', { room: true, cast: [], pokemon: 'munchlax', tint: '#2e3a22' },
    `The Munchlax is on the mast's footing, and it isn't moving. The honey seller holds up a jar. The Honest Trade Card: a jar of her honey, and it'll come with you.`,
    [
      ch('Trade it the jar.', out(`It takes the jar in both hands and follows you down the hill.`, join({ species: ['munchlax'] }), flag('galactic-munchlax'))),
      ch('Leave it on the footing.', out(`It's still there when the mast goes up. The crew put a sandwich out for it every day.`)),
    ]),
  op('quiet-room', 'The Quiet Room', 6, `The order: guard the tanks through the night. Don't engage. Don't look. The warm room. Three small lights. The instruments are on or off, as you left them. There's a chair.`, [
    ch('Guard them, as ordered.', out(`You stand with your back to the glass all night. In the morning the readout shows a month of the same question.`, meters(1))),
    ch('Pull the chair up by Uxie. (a node)', out(`Nothing's said. A node passes. They know. You remember something: the map shows one node further ahead for the rest of the region.`, ...node(), ...quiet(), scout(1), flag('galactic-quiet-uxie'), room('gx-op-quiet-morning'))),
    ch('Pull the chair up by Mesprit. (a node)', out(`Nothing's said. A node passes. They know. Your lead leans on your leg, and its bond goes up a step.`, ...node(), ...quiet(), bondUp(1, 'lead'), flag('galactic-quiet-mesprit'), room('gx-op-quiet-morning'))),
    ch('Pull the chair up by Azelf. (a node)', out(`Nothing's said. A node passes. They know. Once, at the climax, a Pokémon of yours that would faint will hold at 1 HP. It decided not to.`, ...node(), ...quiet(), flag('galactic-quiet-azelf'), room('gx-op-quiet-morning'))),
  ], { cast: [CHARON], tint: '#3a2418' }),
  ev('gx-op-quiet-morning', 'The Quiet Room', 'Evil Teams', { room: true, cast: [CHARON], tint: '#3a2418' },
    `Charon, in the morning, looking at the readout: ${say('Charon', `They were quiet. All night. First time in a month. What did you do?`)}`,
    [
      ch('"Nothing."', out(say('Charon', `...Hm. I can't bill for that.`))),
      ch('"I sat."', out(say('Charon', `...Hm. I can't bill for that.`))),
      ch(`"I didn't ask them for anything."`, out(say('Charon', `...Hm. I can't bill for that.`))),
    ]),
  // The egg hatches, nine days on: passing the Center again.
  ev('gx-op-egg', 'Nine Days On', 'Evil Teams', { requires: [...gx({ after: 5, anyRoute: true }), flagIs('galactic-spare')], cast: ['trainer.pr/clerk_f'], pokemon: 'happiny', tint: '#3a2a3a' },
    `You pass the Center again. The nurse sees you through the window, and holds something up to the glass. It's pink, and cross, and nine days old.`,
    [ch('Wave.', out(`It waves back, or the nurse makes it.`, ...kind(1)))]),
];

// ---------- T1. Lights Out (every Sinnoh stage from 3, at the stage's last rest) ----------
const lights = (n: number, after: number, who: string, whisper: string, choices: [string, string][], cast: string[] = [GRUNT]): Json =>
  ev(`gx-lights-out-${n}`, 'Lights Out', 'Evil Teams', { requires: [...inside({ after, ends: ['none'] }), once(`gx-lights-${n}`)], cast, tint: '#141a24' },
    `Five hundred bunks. Everyone asleep the same way: on the back, hands at the sides. You aren't. ${who} ${whisper}`,
    choices.map(([label, text]) => ch(label, out(text, flag(`gx-lights-${n}`), flag('galactic-turned-over')))));
const LIGHTS: Json[] = [
  lights(3, 2, 'Cadet Io is awake.', say('Cadet Io, in a whisper', `D'you dream? I've stopped. I used to dream I was late. I miss being late.`), [
    [`"I dreamed I was late last night."`, `She laughs, very quietly, into her pillow. A bunk away, somebody turns over onto their side.`],
    [`"Try being late tomorrow."`, `"On purpose?" She thinks about it. "...Thirty seconds. I'll start with thirty seconds." Somebody turns over.`],
    ['(Hum the bar from the canteen.)', `She hums the next one, under her breath. Two bunks down, somebody turns over onto their side, toward the sound.`],
  ]),
  lights(4, 3, `Wynn is awake. She's labelling the bunks by torchlight. Not numbers. Names.`, say('Wynn', `I'll take them off before reveille. I only wanted to see it done once.`), [
    ['"Do mine."', `She looks at you a long moment, and prints it, and sticks it on. It's your own name, not Ceres. Somebody turns over.`],
    [`"Leave them on."`, `"I can't. It's not regulation." She doesn't take them off until the very last minute. Somebody turns over.`],
    [`"Who's that one?"`, `She reads it to you, in a whisper, and the next, and the next, until the torch dies. Somebody turns over.`],
  ], [SCI]),
  lights(5, 4, `Nobody's awake.`, `Thirty bunks are empty. The beds are made. On each pillow: a helmet, and a wig, with a name sewn in the band.`, [
    ['(Read the names.)', `Astrid. Leif. Tove. Thirty names, in a wigmaker's hand. You put each wig back where it was. Somebody, nearby, turns over.`],
    ['(Straighten the helmets.)', `Thirty helmets, square to the pillows. Somebody, nearby, turns over.`],
    ['(Lie down in one.)', `It's still a little warm. You don't sleep. Somebody, nearby, turns over.`],
  ], []),
  lights(6, 5, `Saturn is in the doorway, with a clipboard.`, `${say('Saturn', `I do a count. It's not required. Five hundred and six. Four hundred and seventy-six. I say the number and then I stand here.`)} A pause. ${say('Saturn', `I don't know what the standing's for.`)}`, [
    [`"It's for them."`, `He stands there a while longer. Then he goes. Somebody turns over.`],
    ['"Count me."', `"...Four hundred and seventy-seven." He writes it. Somebody turns over.`],
    ['(Stand with him.)', `You stand in the doorway, side by side, and say nothing. It takes four minutes. He doesn't time them. Somebody turns over.`],
  ], [SATURN]),
];

// ---------- T2. Inspection, T3. Seen, T4. Next of Kin ----------
const INSPECTION_END = `Then she reaches you. ${say('Mars', `Wig or cut?`)} Before there's an answer: ${say('Mars', `Don't tell me. I don't ask. I'm not—`)} She touches her own hair, once, at the back, where it doesn't sit flat. ${say('Mars', `Level with the ear. Dismissed.`)}`;
const T: Json[] = [
  ev('gx-inspection', 'Inspection', 'Evil Teams', { requires: inside({ after: 2, ends: ['none'] }), cast: [MARS, GRUNT], pokemon: 'purugly', tint: WHITE },
    `A corridor. A line of Grunts, at attention. Mars, walking it, with Purugly. ${say('Mars', `Hair. Level with the ear. Master Cyrus notices. He's never said he notices. I notice for him.`)} Three along from you: a Grunt whose hair's on at an angle. A great deal of his own's coming out under it. He's standing very straight and whispering. ${say('Grunt No. 836', `Psst. Ceres. It has slipped. I can feel that it has slipped. I cannot adjust it; adjustment would be suspicious.`)}`,
    [
      ch('(Straighten it.)', out(`A quick hand. ${say('Looker', `You have the reflexes of an agent. I shall say so in my report. It is one sentence; I shall make it two.`)} ${INSPECTION_END}`, flag('looker-owed'))),
      ch('(Sneeze, loudly.)', out(`Mars turns. Purugly turns. ${say('Mars', `Observation two.`)} "It's not a feeling. It's a sneeze." Somebody, far down the line, hums one bar. She doesn't find out who. ${INSPECTION_END}`)),
      ch('(Do nothing.)', out(`She stops in front of him. A long look. ${say('Mars', `...That's the worst regulation cut in the building.`)} ${say('Looker', `Thank you, Commander.`)} ${say('Mars', `It wasn't—`)} She moves on. She's got four hundred more. ${INSPECTION_END}`)),
    ]),
  ev('gx-seen', 'Seen', 'Evil Teams', { requires: inside({ after: 4, rank: 3, ends: ['none'] }), cast: [SCI], tint: WHITE },
    `Observation three: every job needs a second signature. You're rostered as the second, for a day. A corridor, labelled, by Wynn: it's perfect. She's left one thing off: the window. ${say('Wynn', `I couldn't. You can see the mountain from it.`)} A grid repair, by a lineman: it's better than the drawing; he's used the old method. Then a "wellness check," by a clinic orderly: a Shinx that looks at nothing.`,
    [
      ch('Sign the wellness check.', out(`Signing completes it. The Shinx goes back to the clinic.`, room('gx-seen-saturn'))),
      ch(`Don't sign it.`, out(`You send it back: "Unfinished. Not seen." The Shinx is back with its trainer by the next stage, and bites her, and she cries with relief.`, ...kind(1), flag('galactic-shinx-home'), room('gx-seen-saturn'))),
    ], ),
  ev('gx-seen-saturn', 'Seen', 'Evil Teams', { room: true, cast: [SATURN], tint: WHITE },
    `A pension schedule, by Saturn: five hundred and six lines. He watches you read the total. Then a blank form, in his hand: "Equipment check. Lake Valor. Eleven minutes." He's asking for a witness to a false entry.`,
    [
      ch('Sign it.', out(`${say('Saturn', `Then there's two of us.`)}`, flag('galactic-saturn-witnessed'), room('gx-seen-pencil')), { requires: [flagIs('galactic-eleven')] }),
      ch(`Sign the schedule, and leave the form.`, out(`He puts the form back in the drawer, under the others.`, room('gx-seen-pencil'))),
    ]),
  ev('gx-seen-pencil', 'Seen', 'Evil Teams', { room: true, cast: [BOSS], tint: WHITE },
    `The last form's upstairs. Cyrus, at the desk, not looking up: ${say('Cyrus', `I've sharpened this pencil. It requires a second signature.`)} It's a pencil. ${say('Cyrus', `I'm aware it's a pencil. I applied the rule to everything, to see if it held. It holds. I find I don't like to use it until someone's looked.`)}`,
    [
      ch('(Sign.)', out(`You sign. He takes the pencil back, and uses it.`, flag('galactic-seen'))),
      ch(`"It's a good point."`, out(`${say('Cyrus', `It is.`)} He holds it out anyway. You sign.`, flag('galactic-seen'))),
      ch(`"You don't need me to look at a pencil."`, out(`${say('Cyrus', `No. I've established that I don't. I've established it eleven times this month.`)} He holds it out anyway. You sign.`, flag('galactic-seen'))),
    ]),
  ev('gx-next-of-kin', 'Next of Kin', 'Evil Teams', { requires: [...inside({ after: 5, rank: 4, ends: ['none'] }), night], cast: [SATURN], tint: '#1a2230' },
    `Saturn's office. A desk. A lamp. Five hundred and six forms in a stack with a ruler's edge. ${say('Saturn', `Pensions want a beneficiary. I sent the form round. Look.`)} Line seven: NEXT OF KIN. Most say: None. ${say('Saturn', `Three hundred and forty of those are false. I've their intake addresses; I cross-checked. They've mothers. Husbands. One's nine children. They wrote "None" because it's what they came here to make true.`)} ${say('Saturn', `I can't process "None." It's not a payee.`)}`,
    [
      ch('"Fill them in." (a night)', out(`A night's work, card to address. The Thirty will know where to knock; each returned card will have a home to go with it; and three hundred and forty people will get a letter, the morning after the Pillar: "Your son is well and is asking for you." Saturn signs every one.`, flag('galactic-next-of-kin')), { prompt: prompt('aim-drag'), fail: out(`Some of the addresses are smudged. You get two hundred done before the lamp gives out. It's enough to start.`, flag('galactic-next-of-kin')) }),
      ch(`"Leave them. It's what they asked for."`, out(`He squares the stack. ${say('Saturn', `Noted.`)} He doesn't file it.`)),
      ch('"Whose did you put?"', out(`He turns his own over. Line seven's blank. ${say('Saturn', `I'd meant to get to it.`)} He turns one more, from a separate drawer. It's Cyrus's. Saturn's filled it in himself, in his own hand: "Grandfather. Sunyshore." ${say('Saturn', `He left it empty. I'm not permitted to guess. I looked it up. I've not told him there's a form.`)}`, flag('galactic-x-grandfather'), room('gx-next-of-kin'))),
    ]),
];
(T[0] as Json).remembers = [{ id: 'losing', when: [flagIs('galactic-card-losing')], notice: say('Mars', `You wrote "losing." Good. So would I.`) }];

// ---------- Volume III D: the officers, alone (a + node at Night, stages 5 to 7, Rank 4) ----------
const alone = (id: string, name: string, cast: string[], intro: string, choices: Json[], o: Json = {}): Json =>
  ev(`gx-alone-${id}`, name, 'Evil Teams', { requires: [...inside({ after: 4, rank: 4, ends: ['none'] }), night], cast, tint: '#1a2230', ...o }, intro, choices);
const ALONE: Json[] = [
  alone('mars', 'Mars, Alone', [MARS], `The Windworks, at night. She's talking to a Purugly. ${say('Mars', `He's never said my name. "Commander." I've done everything. Everything. I'd follow him into nothing. That's the plan, isn't it? Nothing. With him. I thought that sounded lovely.`)}`, [
    ch(`"He doesn't want anyone there."`, out(`The Purugly looks at you. So does she. ${say('Mars', `...I know.`)}`)),
    ch(`"What's your name?"`, out(`She tells you. It's not Mars. In any ending, she's the one who goes looking for him.`, flag('mars-named'))),
    ch('"What will you do after?"', out(say('Mars', `There isn't an after. That was the point.`) + ` She scratches the Purugly's ears. "Isn't there?"`)),
  ], { pokemon: 'purugly' }),
  alone('jupiter', 'Jupiter, Alone', [JUPITER], `Eterna. A statue, defaced. She's cleaning it. ${say('Jupiter', `I don't believe a word of it. A new world. Please. I'm here for the pay and the hat. But I've been pretending so long I've started checking the sky.`)}`, [
    ch('"Then leave."', out(say('Jupiter', `And go where? I'd have to believe in something else.`))),
    ch(`"What if he's right?"`, out(say('Jupiter', `Then I'll have been wrong in a very good hat.`))),
    ch('"Why clean the statue?"', out(say('Jupiter', `Somebody carved that. I just blew up the plaque. I'm not a vandal.`))),
  ]),
  alone('saturn', 'Saturn, Alone', [SATURN], `The lab. He's switched the instruments back on, and is listening. ${say('Saturn', `I can't hear it. The frequency. I've the readout. It looks like screaming. I keep thinking: if I can't hear it, am I responsible for it?`)}`, [
    ch('"Yes."', out(`He nods, slowly. ${say('Saturn', `...That's efficient. Thank you.`)}`, flag('saturn-heard'))),
    ch('"Turn up the gain."', out(`He turns it up. Nothing changes for him. He leaves it up.`)),
    ch('"What would Cyrus say?"', out(say('Saturn', `"Irrelevant." He'd be right. I don't find that as restful as I used to.`))),
  ], { tint: '#3a2418' }),
  alone('charon', 'Charon, Alone', [CHARON], `His office. A price list. ${say('Charon', `He wants to unmake the world. I want to invoice it. We've the same machine and one of us is mad. I'll leave you to work out which.`)}`, [
    ch('"Both."', out(say('Charon', `Ha! Very likely.`))),
    ch(`"What's on the list?"`, out(`It's every lake, with a figure.`, intel(3), flag('galactic-charon-met'))),
    ch(`"I'm not for sale."`, out(say('Charon', `Everyone says that. It's my favourite opening position.`), flag('galactic-charon-refused'), flag('galactic-charon-met'))),
  ]),
];
(ALONE[1] as Json).remembers = [{ id: 'nothing', when: [flagIs('galactic-card-nothing')], notice: say('Jupiter', `You wrote "nothing." That's mine. Get your own.`) }];

// ---------- The loyalty test (Suspicion 7) and found out (Suspicion 10) ----------
const TESTS: Json[] = [
  ev('gx-loyalty-test', 'The Loyalty Test', 'Evil Teams', { callback: true, requires: inside({ suspicion: 7, suspicionBelow: 10, lacks: 'loyalty-test' }), cast: [BOSS], tint: WHITE },
    `${say('Cyrus', `You put the fish back. Saturn's logged eleven minutes. Explain the eleven minutes.`)}`,
    [
      ch('"They were dying."', out(say('Cyrus', `Many things are dying. It's not a reason. It's a description.`) + ` He writes something down.`, mark('loyalty-test'))),
      ch('"It was inefficient to leave them: the smell."', out(say('Cyrus', `...That's a reason.`) + ` He doesn't believe it, and lets it stand.`, meters(0, -1), mark('loyalty-test'))),
      ch('"I wanted to."', out(`He looks at you for a long time. ${say('Cyrus', `...Wanting. Yes. I see it has uses.`)}`, meters(0, -2), mark('loyalty-test'), flag('galactic-wanted-to'))),
    ]),
  ev('gx-found-out', 'Found Out', 'Evil Teams', { callback: true, requires: inside({ suspicion: 10, lacks: 'found-out' }), cast: [MARS, SATURN], tint: '#3a1418', effect: 'glint' },
    `The lift stops between floors. When the doors open, Mars is waiting, with Purugly, and behind her half the corridor. ${say('Mars', `Ceres. Or whatever's on your real card. He'd like a word. He'd like it to be your last.`)} You've been found out. There's only one way back outside.`,
    [ch('Fight your way out.', fight(`She doesn't make a speech.`, foe('executive', 'Commander Mars', 5, { lv: 2 }),
      mark('found-out'), story({ end: 'defeated' }), flag('galactic-ending-turn'), flag('galactic-found-out')))]),
];
(TESTS[1] as Json).remembers = [{ id: 'io', when: [flagIs('galactic-io-duet')], notice: `Cadet Io is in the crowd. She hums one bar, very loud, and three Grunts look round at her instead of at you.` }];
(TESTS[0] as Json).remembers = [{ id: 'blank', when: [flagIs('galactic-card-blank')], notice: `${say('Wynn', `(in the doorway)`)} Your blank card is on his desk, on its own tab.` }];

export const EVENTS: Json[] = [...offer, ...act1, ...act2, ...act3, ...act4, ...act5, ...OPS, ...LIGHTS, ...T, ...ALONE, ...TESTS];
export const REMOVE: string[] = [];
